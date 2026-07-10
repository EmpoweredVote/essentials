---
phase: 177-city-of-hillsboro-deep-seed
reviewed: 2026-07-02T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - src/lib/coverage.js
  - src/lib/buildingImages.js
  - C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql
  - C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql
  - C:/EV-Accounts/backend/migrations/1152_pace_stances.sql
  - C:/EV-Accounts/backend/migrations/1153_salgado_stances.sql
  - C:/EV-Accounts/backend/migrations/1154_anvery_stances.sql
  - C:/EV-Accounts/backend/migrations/1155_sinclair_stances.sql
  - C:/EV-Accounts/backend/migrations/1156_case_stances.sql
  - C:/EV-Accounts/backend/migrations/1157_alcaire_stances.sql
  - C:/EV-Accounts/backend/migrations/1158_harris_stances.sql
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 177: Code Review Report

**Reviewed:** 2026-07-02
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed the two essentials-repo JS changes (coverage.js Hillsboro entry, buildingImages.js CURATED_LOCAL key + attribution) and all nine EV-Accounts migrations (1150 structural, 1151 headshots, 1152-1158 stances). All migrations are already applied to production and passed post-apply audits; every finding below is a **latent defect worth fixing for the record / template reuse** — nothing requires an emergency production fix.

Adversarial checks that came back clean (verified, not assumed):

- **geo_id 4134100 everywhere; zero occurrences of the incorrect 4133850** in any of the 9 migration files.
- **Politician UUIDs in 1151-1158 match the 177-02-SUMMARY handoff table 7/7** (Pace 95a6d0c4, Salgado 44d84b41, Anvery 2615c597, Sinclair 92ad1ef9, Case c95bfe4d, Alcaire 6f901dde, Harris 38aa9579).
- **Stance counts match the 177-04-SUMMARY exactly:** Pace 9 / Salgado 8 / Anvery 7 / Sinclair 12 / Case 9 / Alcaire 8 / Harris 7 = 60. In each file the answers-statement and context-statement topic sets are identical (each topic_key appears exactly twice).
- **All stance values are within 1-5** (only 1, 2, 3, 4 used). Sinclair local-immigration = 2, the other six = 1, matching the summary's documented split; Sinclair has no climate-change row (honest blank preserved).
- **Zero judicial-* topic_keys.** The two "judicial" hits in 1155 are reasoning prose ("judicial warrant" carve-out), not topic keys. 15 unique topic_keys used, all standard live keys.
- **Every politician_context row has non-empty reasoning and a non-empty `::text[]` sources array** (array count = 2x stance count per file; zero `ARRAY[]` empties).
- **Ledger discipline correct:** exactly one `supabase_migrations.schema_migrations` insert in 1150 (version '1150', ON CONFLICT DO NOTHING); zero ledger writes in 1151-1158 (audit-only convention held).
- **All 9 migrations are BEGIN/COMMIT wrapped**; 1150's `BETWEEN -4134107 AND -4134101` gate uses correct negative-range ordering.
- **All 8 Storage objects return HTTP 200** (cities/hillsboro.jpg banner + all 7 {uuid}-headshot.jpg files).
- **`node --check` passes on both JS files.** coverage.js Hillsboro entry is alphabetically placed (Gresham → Hillsboro → Maywood Park), geo_id string '4134100', `hasContext: true` justified by the 60 seeded stances. buildingImages.js 'hillsboro' key matches `representing_city='Hillsboro'` via the lowercase `.includes()` lookup; attribution comment (Steve Morgan, CC BY-SA 4.0) present. No raw Windows backslash paths introduced (no Tailwind v4 scan risk).

## Warnings

### WR-01: Migration 1150 post-verify Gate (c) is a dead assertion — it can never fail

**File:** `C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql:354-367`
**Issue:** Gate (c) counts `geofence_boundaries` rows for geo_id 4134100/G4110 that lack a LOCAL/LOCAL_EXEC district. But Steps 3-4 in the same transaction guarantee both district rows exist (either pre-existing or just inserted) before the DO block runs, so `v_split_count` is 0 by construction — the gate cannot raise under any input state. It also passes vacuously if the Hillsboro G4110 geofence was never loaded at all. The NOTICE "section-split=0" therefore provides false assurance: the *real* split-section defect (offices for one geo_id scattered across multiple governments/chambers, per the established post-seeding SQL check) is not what this gate tests. The actual scan only ran as an independent post-apply E2E gate outside the migration. This gate was inherited from the Beaverton 1131 template, so it will propagate into Phase 178+ unless corrected.
**Must fix now?** No — production was independently verified. Fix the template before reuse.
**Fix:** Replace Gate (c) with the canonical split-section query, e.g.:
```sql
SELECT COUNT(*) INTO v_split_count
FROM (
  SELECT o.district_id
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4134100'
  GROUP BY o.district_id
  HAVING COUNT(DISTINCT o.chamber_id) > 1
) x;
```
and add a separate assertion that the G4110 geofence row exists (`SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id='4134100' AND mtfcc='G4110'` must be >= 1) so a missing TIGER load fails loudly instead of passing silently.

### WR-02: Stance migrations silently drop rows on topic_key mismatch — no in-migration count assertion

**File:** `C:/EV-Accounts/backend/migrations/1152_pace_stances.sql:21,38` (same pattern in 1153-1158)
**Issue:** `FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true` is an inner join: any misspelled or retired topic_key silently drops that stance row and the migration still COMMITs successfully with fewer rows than authored. Under the project's evidence-only trust model a silently missing stance is indistinguishable from an honest blank spoke — the defect class the no-default rule exists to prevent. This run was caught safe only by the external post-apply audit (60/60); the migration template itself has no self-check.
**Must fix now?** No — the 60-row audit confirmed all keys resolved. Fix the template for future stance migrations.
**Fix:** Append a count-assert DO block per file, e.g. for 1152:
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM inform.politician_answers
  WHERE politician_id = '95a6d0c4-2b0e-4c4f-9f53-02eb55543fb7';
  IF n <> 9 THEN
    RAISE EXCEPTION 'Expected 9 Pace answers, found % — topic_key mismatch dropped rows', n;
  END IF;
END $$;
```

## Info

### IN-01: 1151 headshot guard degrades unsafely if a politician row is missing

**File:** `C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql:24-27` (pattern repeats x7)
**Issue:** If the `external_id` subquery returned NULL (politician missing), `WHERE politician_id = NULL` in the NOT EXISTS guard is never true, so the guard *allows* the insert to proceed with a NULL politician_id — relying on a NOT NULL constraint to abort rather than the guard itself. Harmless here (all 7 politicians existed from 1150), but the guard's intent inverts on the exact failure it should protect against.
**Fix:** Add `AND (SELECT id FROM essentials.politicians WHERE external_id = -41341NN) IS NOT NULL` to each WHERE clause, or restructure as `SELECT ... FROM essentials.politicians p WHERE p.external_id = -41341NN AND NOT EXISTS (...)`.

### IN-02: 1150 office_id back-fill picks an arbitrary office if a politician has multiple office rows

**File:** `C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql:313-320`
**Issue:** `UPDATE ... FROM essentials.offices o WHERE o.politician_id = p.id` has no district/chamber filter. Safe for this greenfield city (each politician has exactly one office), but if the template is reused in a reconcile-style city where a politician already holds another office row, the back-fill nondeterministically picks one. Latent template hazard only.
**Fix:** Constrain the join: `AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name='City Council' AND government_id = ...)`.

### IN-03: Stance migrations duplicate the full VALUES block verbatim — drift risk between the two copies

**File:** `C:/EV-Accounts/backend/migrations/1152_pace_stances.sql:7-18` vs `24-35` (pattern repeats in 1153-1158)
**Issue:** The answers statement carries unused `reasoning`/`sources` columns and the entire VALUES list is hand-duplicated for the context statement (~2x file size). Verified in-sync for all 7 files this phase, but any hand-edit to one copy (e.g., a value correction) can silently diverge from the other. Both statements execute inside one transaction, so a single CTE feeding both inserts would eliminate the drift class.
**Fix:** Template improvement: one `WITH s(...) AS (VALUES ...), a AS (INSERT INTO inform.politician_answers ... RETURNING 1) INSERT INTO inform.politician_context ... FROM s JOIN ...` — single source of truth per stance row.

---

_Reviewed: 2026-07-02_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
