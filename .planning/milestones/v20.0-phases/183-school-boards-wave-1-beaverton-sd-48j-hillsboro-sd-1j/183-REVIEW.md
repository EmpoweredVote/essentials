---
phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j
reviewed: 2026-07-04T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql
  - C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql
  - C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py
  - C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql
  - src/lib/coverage.js
findings:
  critical: 0
  warning: 3
  info: 4
  total: 7
status: issues_found
---

# Phase 183: Code Review Report

**Reviewed:** 2026-07-04
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the two applied production migrations (1203 structural, 1205 headshot audit), the two gitignored one-shot helpers (probe SQL + headshot ETL), and the 2-entry `COVERAGE_SCHOOL_DISTRICTS` append in `src/lib/coverage.js`.

Verification performed during review:
- `src/lib/coverage.js` passes `node --check`; a suspicious grep rendering at line 259 was byte-inspected and is a clean `//` comment (no corruption). The two new school-district entries carry exactly the fields their consumers read (`browseGeoId`, `browseMtfcc`, `browseStateAbbrev`, `label` — consumed at coverage.js:275, 324-332 and Landing.jsx:113-130), geo_ids match migration 1203 and the probe (4101920 / 4100023, mtfcc G5420), and school districts remain search-only: `Landing.jsx` imports only `COVERAGE_STATES` for the grid, per the standing rule. No findings in coverage.js.
- Storage host in 1205 (`kxsdzaojfaibhuzmclfq.storage.supabase.co`) matches the 1197 Cornelius convention exactly.
- The 1204 filename-collision claim in 1205's header is true on disk (`1204_az_ballot_ineligible_reconciliation.sql` exists).
- Both `_tmp-*` helpers are confirmed gitignored in the EV-Accounts repo (`git check-ignore` exit 0).
- ETL security posture is sound: parameterized SQL only (no injection), service key loaded from `.env` (never hardcoded, never printed), key sent only to the env-derived Supabase host, `verify=True` TLS, timeouts on all requests, non-zero exit on any partial run.

No Critical issues. The three Warnings are latent re-run/clone defects in the migration template — exactly the class that bites the next same-shape district seed — not defects in the applied production state.

## Warnings

### WR-01: 1203 politician/office blocks cannot self-heal a missing office — the office `NOT EXISTS` guard is dead code

**File:** `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql:144-174` (pattern repeated in all 14 blocks)
**Issue:** The office INSERT consumes `ins_p` (the `ON CONFLICT (external_id) DO NOTHING ... RETURNING id` CTE) via `CROSS JOIN`. When the politician already exists, `RETURNING` yields zero rows, the CROSS JOIN produces zero rows, and the office INSERT is silently skipped — regardless of whether the office exists. The `NOT EXISTS (offices WHERE district_id/politician_id)` guard is therefore unreachable: it can only be evaluated for a freshly-minted politician UUID, which by construction can never already have an office. Consequences: (a) a re-run can never repair a politician-without-office state (e.g., a politician pre-seeded by another workstream on the same external_id — the exact scenario Probe D exists to detect, but only pre-run); (b) in that state the Step 6 gate (`expected 7 offices`) aborts the whole transaction, so the migration deadlocks against itself instead of healing. Benign for the applied run (Probe D confirmed greenfield ext_ids), but this is the carried-forward template for every future board seed.
**Fix:** Resolve the politician id from a union of the insert result and the existing row, and join the office INSERT to that:
```sql
ins_p AS (
  INSERT INTO essentials.politicians (...) VALUES (...)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
),
pol AS (
  SELECT id FROM ins_p
  UNION
  SELECT id FROM essentials.politicians WHERE external_id = -4101921
)
INSERT INTO essentials.offices (...)
SELECT ..., p.id, ...
FROM essentials.districts d CROSS JOIN pol p
WHERE ... AND NOT EXISTS (SELECT 1 FROM essentials.offices o
                          WHERE o.district_id = d.id AND o.politician_id = p.id);
```
This makes the existing `NOT EXISTS` guard live and the block genuinely idempotent/repairing.

### WR-02: 1203 office INSERT can commit rows with NULL `chamber_id`, and the post-verify gate would not notice

**File:** `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql:159-174` (all 14 blocks); gate at lines 624-675
**Issue:** `chamber_id` is populated via scalar subquery `(SELECT id FROM chamber)`. If the `chamber` CTE matches zero rows — the realistic path is a clone for the next district where the CTE's chamber-name string drifts from the Step 2 INSERT string ('School Board' vs 'Board of Education' etc.) — the scalar subquery yields NULL and all 7 offices INSERT with `chamber_id = NULL`. The Step 6 gate counts offices per district and checks `office_id` back-fill but never asserts `chamber_id IS NOT NULL` (nor that it points at the intended government's chamber), so the migration would COMMIT with broken chamber linkage and a silently mis-rendered board. In this applied run the strings match exactly (verified: 'School Board' at lines 89/146, 'Board of Directors' at lines 102/379), so production is unaffected — but the gate has a blind spot in the template.
**Fix:** Add to the Step 6 DO block:
```sql
SELECT COUNT(*) INTO v_null_chamber
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id IN ('4101920','4100023') AND d.district_type = 'SCHOOL' AND d.state = 'or'
  AND o.chamber_id IS NULL;
IF v_null_chamber <> 0 THEN
  RAISE EXCEPTION 'Post-verification FAILED: % offices have NULL chamber_id', v_null_chamber;
END IF;
```

### WR-03: 1205 INSERT guard is vacuously true when the external_id lookup returns NULL — attempts an orphan `politician_id = NULL` row

**File:** `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql:56-64` (pattern repeated in all 14 blocks)
**Issue:** Each block guards with `WHERE NOT EXISTS (SELECT 1 FROM politician_images WHERE politician_id = (SELECT id FROM politicians WHERE external_id = ...))`. If the politician row is absent (deleted, renumbered, or the file re-applied against an environment where 1203 minted different rows), the inner subquery is NULL, `politician_id = NULL` matches nothing, `NOT EXISTS` is true, and the INSERT proceeds with `politician_id = NULL`. Today the damage is bounded: either a NOT NULL/FK constraint rejects it loudly, or the Step-2 uuid gate (lines 223-251) fails on the missing uuid and rolls the transaction back. But the header (lines 43-49) explicitly instructs cloners to delete INSERT blocks and hand-edit the gate's VALUES list to match — the one workflow in which the gate and the INSERTs can desync, at which point an orphan NULL-politician image row (or a hard constraint error mid-file) is the outcome.
**Fix:** Make the resolution explicit so a missing politician skips the block instead of degrading to NULL:
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), p.id, '<url>', 'default', 'press_use'
FROM essentials.politicians p
WHERE p.external_id = -4101921
  AND NOT EXISTS (SELECT 1 FROM essentials.politician_images pi WHERE pi.politician_id = p.id);
```

## Info

### IN-01: ETL `.env` parser does not strip surrounding quotes or `export ` prefixes

**File:** `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py:237-244`
**Issue:** `v.strip()` keeps surrounding quotes, so a standard `KEY="value"` .env line yields a value containing literal quote characters — `SUPABASE_URL` would then fail the `startswith('https://')` check and `SERVICE_KEY`/`DATABASE_URL` would fail auth/connect. All failure modes are loud (raise or exit 1), so this is fragility, not a correctness bug, and the current .env is evidently unquoted. Carried-forward template nit.
**Fix:** `v = v.strip().strip('\'"')` and skip an optional leading `export `.

### IN-02: Source-dimension documentation contradicts the source filenames for two Hillsboro directors

**File:** `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py:163-166, 203-209`
**Issue:** Yessica Hardin Mercado's and Katie Rhyne's source URLs end in `...-256x230px.jpg` while the comments assert "genuine original ~256x320 (exact 4:5)" and "~172x215 (exact 4:5)" respectively. 256x230 is not 4:5. If the actual pixels were 256x230, `crop_to_4_5` would center/top-crop correctly (the pipeline is ratio-safe either way), but the "crop is a NO-OP for all 14 sources" claim repeated throughout the file and in 1205's header would be false for these two, and the crop choice (top-crop vs center) becomes load-bearing. Migration 1205's comments inherit the same claim. Documentation-accuracy issue only; the applied output was visually verified.
**Fix:** Correct the dimension comments to the actual downloaded dimensions from the run log (the manifest printed `Working size` per official), or note that the filename dims are the CDN's naming, not the payload dims.

### IN-03: Probe file stale/overstated comments — "headshots 1204" and Hillsboro "margin"

**File:** `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-probe.sql:56-61, 67-70`
**Issue:** (a) Probe E's comment says "next structural migration 1203, headshots 1204" — the headshot migration shipped as 1205 (collision documented in 1205's header; the probe predates it and was never updated). (b) Probe D's Hillsboro range `BETWEEN -4100030 AND -4100020` is labeled "with margin", but the lower bound sits exactly on the block's last id (-4100030) — zero margin below, unlike Beaverton's 3-id lower margin. The probe still fully covers the actual block, so no operational impact.
**Fix:** Gitignored one-shot; if kept as a clone template, update the ledger comment to 1205 and widen the Hillsboro lower bound (e.g., `-4100035`).

### IN-04: Hillsboro external_id block spills past its geo-derived namespace

**File:** `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql:614-615`
**Issue:** Beaverton's ids follow the geo-derived scheme (geo 4101920 → -4101921..-4101927, all inside the -410192x decade). Hillsboro's geo 4100023 yields -4100024..-4100030 — the last id crosses into the -410003x decade, which the same scheme would assign to a future entity with geo_id 4100029/4100030. Probe D's collision check is the standing mitigation, and any future seed that runs its own probe will detect the occupied id; risk is speculative.
**Fix:** None required now; for future double-digit rosters consider a scheme with headroom (e.g., geo_id * 100 offsets) so blocks never cross decade boundaries.

---

_Reviewed: 2026-07-04_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
