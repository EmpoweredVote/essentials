---
phase: 180-city-of-forest-grove-deep-seed
reviewed: 2026-07-03T07:47:09Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql
  - C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql
  - C:/EV-Accounts/backend/migrations/1180_wenzl_stances.sql
  - C:/EV-Accounts/backend/migrations/1181_marshall_stances.sql
  - C:/EV-Accounts/backend/migrations/1182_martinez_stances.sql
  - C:/EV-Accounts/backend/migrations/1183_valenzuela_stances.sql
  - C:/EV-Accounts/backend/migrations/1184_gustafson_stances.sql
  - C:/EV-Accounts/backend/migrations/1185_falconer_stances.sql
  - C:/EV-Accounts/backend/migrations/1186_schimmel_stances.sql
  - C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py
  - C:/EV-Accounts/backend/scripts/_tmp-forest-grove-wave0-probe.sql
  - src/lib/buildingImages.js
  - src/lib/coverage.js
findings:
  critical: 0
  warning: 3
  info: 5
  total: 8
status: issues_found
---

# Phase 180: Code Review Report

**Reviewed:** 2026-07-03T07:47:09Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Narrative Findings (AI reviewer)

## Summary

Reviewed all 13 Phase 180 (City of Forest Grove deep-seed) artifacts: the
Wave-0 probe, the headshot pipeline script, structural migration 1178, audit
migrations 1179-1186, and the two frontend surfacing edits. Domain invariants
were checked mechanically (scripted), not by eye:

- **geo_id correctness:** `'4126200'` is the only geo_id in every backend
  file (17 occurrences in 1178, zero in 1179-1186 as expected — those key off
  ext_ids/UUIDs). A scripted scan found **zero leftover sibling-city
  identifiers** (no 4174950/4173650/4134100/4105350 and no -41749xx/-41736xx
  ext_ids anywhere in the 180 file set).
- **ext_id block:** every ext_id in every file is inside -4126201..-4126207;
  all `BETWEEN` predicates use the correct low-to-high order.
- **UUID↔ext_id identity:** the 7 hardcoded politician UUIDs map identically
  across 1179's CDN URLs and the 7 stance files, and each stance file's
  in-file identity gate cross-checks its UUID against the right ext_id at
  apply time. Each stance file contains exactly one UUID (no cross-file
  bleed).
- **Stance parity (scripted diff, all 7 files):** the answers and context
  VALUES blocks are byte-identical in every file; row counts (7/3/4/3/8/8/6)
  match the header comments and both count gates; no duplicate topic_keys; no
  `judicial-*` keys; all values within 1-5; no empty sources arrays.
- **Ledger discipline:** 1178 registers version '1178' with a conflict-safe
  insert; a scripted scan confirms none of 1179-1186 touches the ledger table
  (AUDIT-ONLY by design).
- **Casing:** `districts.state = 'or'` in both district INSERTs and every
  district predicate; governments/offices use uppercase 'OR' throughout 1178.
- **179-review hardening verified implemented:** the script's non-zero-exit
  fix is present and correct (`sys.exit(1)` when any configured official
  failed, `_tmp-forest-grove-headshots.py:496-499` — failures list is built
  from every non-success result, including resolve failures and missing-URL
  entries, so no failure mode escapes the tally). The 1178 in-file identity
  gate is present (lines 421-432) but is a **weaker form than the 179 review
  prescribed** — see WR-02 below.
- **photo_license:** `'sourced'` for all 7 is consistent with the D-09 rule
  (sources are news/campaign, not government-hosted) and has repo precedent
  (migration 775 uses the same value); `'press_use'` correctly does NOT
  appear in 1179.
- **Frontend edits (commit d419c61):** coverage.js adds Forest Grove
  (4126200, `hasContext: true`) in correct alphabetical position; the 10
  deleted lines are pure column-realignment of the untouched Oregon rows
  (geo_ids byte-identical before/after). buildingImages.js adds the
  `'forest grove'` CURATED_LOCAL key (+2 lines, additive only) pointing at
  `cities/forest-grove.jpg` with CC BY 3.0 attribution; the space-form key
  correctly matches 1178's `representing_city='Forest Grove'` via the
  lowercase-includes lookup, and collides with no other curated key.
- **Security:** parameterized SQL for the UUID lookup, credentials from
  `.env` only (no hardcoded secrets), TLS enforced (`verify=True`,
  sslmode appended), re-encode strips EXIF; probe file is read-only SELECTs.

No Critical findings. Three Warnings — all latent template defects relevant
to phases 181-182, none realized in this already-applied-and-verified run —
and five Info items (four are 179-review Info findings carried unfixed into
the 180 clones).

## Warnings

### WR-01: 1179's fail-closed template doctrine is now false in the committed artifact — a clone that skips the edit steps passes its own gate on a partial run

**File:** `C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql:21-33, 125-126, 135`
**Issue:** The ORCHESTRATOR NOTE (lines 21-33) and the gate comment (lines
125-126) both state the expected count is "currently 0, the fail-closed
template default" and that the file "applied UNEDITED ... fails closed."
Neither is true of the file as committed: the gate at line 135 expects 7 and
7 INSERT blocks are present, so the described fail-closed property no longer
exists in this artifact. That matters because this file is the clone source
for phases 181-182: an orchestrator who clones the applied version and
forgets step 1 (delete blocks for pipeline-failed officials) plus step 4
(re-set the count) after a partial pipeline run gets a migration that
**passes its own gate while recording CDN URLs whose storage objects were
never uploaded** — each INSERT embeds the correct politician UUID in the URL,
so the url-embeds-uuid check counts it, N INSERTs match a gate of N, and the
result is live 404 headshots. That is exactly the silent-partial mode the
0-default was designed to block. The script's non-zero-exit fix mitigates
(chained automation stops), but the SQL-side backstop described by the
comments is gone.
**Fix:** Two-part: (a) correct the stale comments in this file so they
describe the as-applied state (expected count edited from 0 to 7 on
YYYY-MM-DD after a 7/7 manifest); (b) for 181-182, clone from a template
state with the gate reset to 0 — or add a one-line marker comment at the
gate, e.g.:

```sql
-- CLONE RESET REQUIRED: set this back to 0 when cloning for a new city.
IF n <> 7 THEN
```

### WR-02: 1178's new in-file identity gate is set-membership, not the pairwise assertion the 179 review prescribed — cross-wired or coincidentally-named collisions pass

**File:** `C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql:421-432`
**Issue:** The gate counts politicians whose ext_id is in the 7-id list AND
whose full_name is in the 7-name list — two independent IN predicates, not a
paired check. Two collision classes it therefore cannot detect: (a)
cross-wired attachments within the roster (ext_id -4126201 carrying
'Brian Schimmel' while -4126207 carries 'Malynda Wenzl' still counts 7); (b)
a colliding pre-existing politician whose stale full_name coincidentally
matches a *different* roster member's name — with common names like Michael
Marshall and Karen Martinez in this roster, same-set name coincidence is the
plausible real-world collision, and the conflict-update path only touches
`is_active`, so the stale row's name survives and the office attaches to the
wrong human. The 179 review's WR-02 fix explicitly prescribed a pairwise
`(external_id, full_name) NOT IN (VALUES ...)` form for exactly this reason;
the set-membership variant implemented here closes most but not all of the
gap. Out-of-band Probe D (0 collisions) means the risk did not materialize
this run — this is a template defect for 181-182.
**Fix:** Replace the two-IN count with the pairwise form:

```sql
IF EXISTS (
  SELECT 1 FROM essentials.politicians
  WHERE external_id BETWEEN -4126207 AND -4126201
    AND (external_id, full_name) NOT IN (VALUES
      (-4126201::bigint,'Malynda Wenzl'),(-4126202::bigint,'Michael Marshall'),
      (-4126203::bigint,'Karen Martinez'),(-4126204::bigint,'Mariana Valenzuela'),
      (-4126205::bigint,'Donna Gustafson'),(-4126206::bigint,'Angel Falconer'),
      (-4126207::bigint,'Brian Schimmel'))
) THEN
  RAISE EXCEPTION 'identity gate: an ext_id in the Forest Grove block maps to an unexpected name';
END IF;
```

### WR-03: Headshot script crashes with IndexError on the empty roster its own documentation declares legal

**File:** `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py:455` (docs at 48-53, 168-172)
**Issue:** The header and the roster-guard comment both state a 0/7 outcome
is "an expected, acceptable result" and that the orchestrator removes
entries "including down to 0/7." But `main()` unconditionally calls
`test_download_guard(OFFICIALS[0])` — with an empty OFFICIALS list this
raises IndexError before the DB connection, the loop, or the manifest. The
crash is at least fail-closed (non-zero exit), but a legitimate 0/7 run can
never produce its honest empty manifest, and a traceback is
indistinguishable from a script bug to the operator. Secondary nit on the
same path: line 451 prints a hardcoded "(7/7 expected)" even when the
orchestrator has legitimately trimmed the roster. Latent here (this run was
7/7) but 181-182 clone this file into cities where a genuine 0/N sourcing
gap is possible.
**Fix:**

```python
if OFFICIALS:
    test_download_guard(OFFICIALS[0])
else:
    print('Roster is empty (documented honest-gap outcome) — nothing to upload.')
```

and derive the expected-count string from context rather than hardcoding 7.

## Info

### IN-01: Fragile hand-rolled `.env` parser carried unfixed from the 179 review

**File:** `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py:183-190, 457-460`
**Issue:** Identical to 179's finding: `open(_env_path)` uses the platform
default encoding (cp1252 on this host — a UTF-8 BOM would corrupt the first
key); quoted values are not unquoted (would fail the SUPABASE_URL startswith
assert confusingly); and `if 'sslmode' not in db_url` is a substring test a
password containing "sslmode" would defeat.
**Fix:** `open(_env_path, encoding='utf-8')`, strip surrounding quotes, test
`'sslmode=' not in db_url`.

### IN-02: Guard `assert` statements are stripped under `python -O`

**File:** `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py:173-177, 201-203, 332`
**Issue:** Carried from 179: the roster-shape guards, the SUPABASE_URL/CDN
derivation guard, and the post-resize size check are `assert` statements,
compiled out under `-O`/`PYTHONOPTIMIZE`. The mandatory-guard doctrine
silently becomes a no-op in that mode.
**Fix:** `if not cond: raise RuntimeError(...)` for guards that must never
be skippable.

### IN-03: office_id back-fill join is unconstrained; combined with the `office_id IS NULL` filter it can leave a colliding politician pointing at their old office

**File:** `C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql:343-350`
**Issue:** Carried from 179 (whose fix was not adopted here even though the
same file adopted the identity gate): the UPDATE joins offices on
`politician_id` alone — with more than one office row Postgres picks an
unspecified winner. Additionally, the idempotency filter skips any politician
whose office_id is already set, so a colliding pre-existing politician would
keep office_id aimed at their *previous* office; the NULL-count check cannot
see that state (office_id is non-null). Both paths require an ext_id
collision that Probe D and (usually) the identity gate rule out — latent
template defect only.
**Fix:** Constrain the join:
`AND o.district_id IN (SELECT id FROM essentials.districts WHERE geo_id = '4126200')`.

### IN-04: Stance-gate counts are politician-total, not migration-scoped

**File:** `C:/EV-Accounts/backend/migrations/1180_wenzl_stances.sql:48-58` (same pattern in 1181-1186)
**Issue:** Carried from 179: the count checks assert the politician's
*total* answers/context row counts equal this file's row count. Exact for
the greenfield first apply (politicians minted in 1178), and conflict-update
makes a plain re-run idempotent — but any legitimate future re-apply after
additional stances are seeded elsewhere raises a false-positive and rolls
back.
**Fix:** None required now; if re-apply support is ever needed, count the
JOIN-matched rows from the CTE instead of politician totals.

### IN-05: Context-parity gate is count-only — content divergence between the duplicated VALUES lists is undetectable in-file

**File:** `C:/EV-Accounts/backend/migrations/1180_wenzl_stances.sql:52-58` (same pattern in 1181-1186)
**Issue:** The parity gate added this cycle catches a *dropped or added* row
in one of the two verbatim-duplicated VALUES lists, but not an *edited* one:
a value or reasoning change applied to only one list keeps both counts equal
and both gates green while answers and context silently disagree. Scripted
diff confirms all 7 files are byte-identical as committed, so this is
latent-only — but the duplication itself is the defect class. A single
shared CTE feeding both INSERTs (data-modifying CTE chain:
`WITH s AS (...), a AS (INSERT INTO inform.politician_answers ... FROM s ...)
INSERT INTO inform.politician_context ... FROM s ...`) would eliminate the
divergence class instead of detecting one symptom of it, and halve each
file's size.
**Fix:** Adopt the single-CTE shape in the 181-182 stance template; keep the
count gates as belt-and-suspenders.

---

_Reviewed: 2026-07-03T07:47:09Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
