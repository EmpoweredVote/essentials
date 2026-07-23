---
phase: 92-md-state-government-db
plan: "02"
subsystem: database
tags:
  - maryland
  - state-government
  - executives
  - headshots
  - migration
dependency_graph:
  requires:
    - "Phase 92 Plan 01: 5 MD chambers seeded (migration 269)"
    - "Migration 174: State of Maryland government row (pre-existing)"
  provides:
    - "5 STATE_EXEC districts for MD executives (state='MD', geo_id='24')"
    - "5 politicians: Moore, Miller, Brown, Lierman, Davis (-240001..-240005)"
    - "5 offices linking politicians to chambers via CTE pattern"
    - "office_id back-fill on all 5 politicians"
    - "5 headshots at 600x750 JPEG in Supabase Storage politician_photos bucket"
    - "5 politician_images rows with type='default', photo_license='public_domain'"
    - "Migration 270 applied to production DB"
    - "Migration 271 recorded (audit-only, not applied via ledger)"
  affects:
    - "Phase 93 (MD Legislature) — MD executive branch now complete; add legislative chambers"
    - "Phase 94 (MD Headshots) — 5 executive headshots seeded; verify + gap-fill remaining"
    - "Phase 96 (MD Elections) — politicians available for race_candidates linking"
tech_stack:
  added: []
  patterns:
    - "ME migration 169 CTE pattern (WITH ins_p AS ... ON CONFLICT DO NOTHING RETURNING id)"
    - "OR short-name chamber name lookup (name='Governor' + government_id subquery)"
    - "STATE_EXEC districts state='MD' uppercase (OR 223a lesson)"
    - "Multnomah 245 audit-only headshot migration pattern"
    - "psql direct insert for essentials schema (REST API does not expose essentials schema)"
    - "Pillow LANCZOS crop-first then resize 600x750 q90 pattern"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/270_md_state_executives.sql"
    - "C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql"
    - "scripts/md_executives_headshots.py"
  modified: []
decisions:
  - "D-01 confirmed: Aruna Miller has standalone Lieutenant Governor chamber and Maryland Lieutenant Governor district"
  - "D-02 confirmed: Dereck Davis seeded in this phase (not deferred)"
  - "D-03 confirmed: Davis is_appointed=true, is_appointed_position=true; other 4 have both false"
  - "Rule 3 fix: DB insert via psql (not REST API) — essentials schema not exposed in Supabase REST"
metrics:
  duration: "~14 minutes"
  completed: "2026-06-05"
  tasks_completed: 3
  files_created: 3
  db_rows_inserted: 20
---

# Phase 92 Plan 02: MD State Executives + Headshots Summary

**One-liner:** 5 MD executive officials (Moore, Miller, Brown, Lierman, Davis) seeded with STATE_EXEC districts, offices, and 600x750 headshots via migration 270 and Python headshot script; audit migration 271 recorded.

## What Was Built

### Migration 270 — MD State Executives

`C:/EV-Accounts/backend/migrations/270_md_state_executives.sql`

Applied to production Supabase DB 2026-06-05 via psql. Three-step structure (ME 169 pattern):

1. **STEP 1**: 5 STATE_EXEC district INSERTs (`state='MD'` uppercase, `geo_id='24'`)
2. **STEP 2**: 5 politician+office CTE blocks (OR 223 short-name chamber lookup pattern)
3. **STEP 3**: office_id back-fill `UPDATE` scoped to `-240010..-240001`

Apply output:
```
BEGIN
DO       -- pre-flight assertion passed
INSERT 0 1  -- Maryland Governor district
INSERT 0 1  -- Maryland Lieutenant Governor district
INSERT 0 1  -- Maryland Attorney General district
INSERT 0 1  -- Maryland Comptroller district
INSERT 0 1  -- Maryland State Treasurer district
INSERT 0 1  -- Wes Moore politician + Governor office
INSERT 0 1  -- Aruna Miller politician + Lieutenant Governor office
INSERT 0 1  -- Anthony G. Brown politician + Attorney General office
INSERT 0 1  -- Brooke Lierman politician + Comptroller office
INSERT 0 1  -- Dereck E. Davis politician + State Treasurer office
UPDATE 5    -- office_id back-fill
COMMIT
```

Idempotency confirmed: second run returned all `INSERT 0 0` and `UPDATE 0`.

### Python Headshot Script

`scripts/md_executives_headshots.py`

Downloads 5 official headshots from government/Wikimedia sources, processes (4:5 crop + 600x750 Lanczos q90 JPEG), uploads to Supabase Storage `politician_photos` bucket, and inserts `politician_images` rows via psql (essentials schema not exposed via REST API).

Idempotency confirmed: second run skipped all 5 officials (existing rows detected via `COUNT(*)`).

### Migration 271 — Audit-Only Headshots

`C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql`

AUDIT-ONLY per Multnomah 245 pattern. Header explicitly states "DO NOT apply via Supabase ledger." Documents the 5 live politician_images INSERTs performed by the Python script. NOT applied via apply_migration.

## Politician UUID to Storage URL Mapping (Phase 94 Reference)

| external_id | Name | UUID | Storage URL |
|-------------|------|------|-------------|
| -240001 | Wes Moore | `21e534c8-c0c0-42f5-b52b-5eb2f246d632` | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/21e534c8-c0c0-42f5-b52b-5eb2f246d632-headshot.jpg` |
| -240002 | Aruna Miller | `ea9fc2d6-3b26-469a-978c-e8c846d2d49a` | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/ea9fc2d6-3b26-469a-978c-e8c846d2d49a-headshot.jpg` |
| -240003 | Anthony G. Brown | `60329719-1d5b-4bb4-8295-38ea18f6f378` | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/60329719-1d5b-4bb4-8295-38ea18f6f378-headshot.jpg` |
| -240004 | Brooke Lierman | `b26fb5d2-90eb-4108-8ce5-838df719473d` | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/b26fb5d2-90eb-4108-8ce5-838df719473d-headshot.jpg` |
| -240005 | Dereck E. Davis | `75378a96-8886-46eb-b0c1-37cbe2579265` | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/75378a96-8886-46eb-b0c1-37cbe2579265-headshot.jpg` |

## Phase-Completion Gate Results (Task 3)

All 6 gates pass.

| Gate | Query | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| 1 — Chambers | COUNT(*) chambers under State of Maryland | 5 | 5 | PASS |
| 2 — STATE_EXEC districts | COUNT(*) districts WHERE district_type='STATE_EXEC' AND state='MD' | 5 | 5 | PASS |
| 3 — Politicians | external_id + full_name for -240001..-240005 | 5 rows | 5 rows | PASS |
| 4 — Offices + appointed flags | external_id, full_name, is_appointed_position, title | 5 rows; Davis only has true | 5 rows; Davis only has true | PASS |
| 5 — politician_images | COUNT(*) WHERE type='default' | 5 | 5 | PASS |
| 6 — Back-fill | COUNT(*) WHERE office_id IS NULL | 0 | 0 | PASS |

### Gate 3 Detail — Politicians Roster

| external_id | full_name |
|-------------|-----------|
| -240001 | Wes Moore |
| -240002 | Aruna Miller |
| -240003 | Anthony G. Brown |
| -240004 | Brooke Lierman |
| -240005 | Dereck E. Davis |

### Gate 4 Detail — Offices + Appointed Flags

| external_id | full_name | is_appointed_position | title |
|-------------|-----------|----------------------|-------|
| -240001 | Wes Moore | false | Governor |
| -240002 | Aruna Miller | false | Lieutenant Governor |
| -240003 | Anthony G. Brown | false | Attorney General |
| -240004 | Brooke Lierman | false | Comptroller |
| -240005 | Dereck E. Davis | **true** | State Treasurer |

### Chamber-District Spot Check

| full_name | chamber_name | title | district_label |
|-----------|-------------|-------|----------------|
| Wes Moore | Governor | Governor | Maryland Governor |
| Aruna Miller | Lieutenant Governor | Lieutenant Governor | Maryland Lieutenant Governor |
| Anthony G. Brown | Attorney General | Attorney General | Maryland Attorney General |
| Brooke Lierman | Comptroller | Comptroller | Maryland Comptroller |
| Dereck E. Davis | State Treasurer | State Treasurer | Maryland State Treasurer |

All chamber names match district labels correctly. Every chamber is distinct (D-01 confirmed for LG).

### HTTP Storage Accessibility

All 5 storage URLs return HTTP 200 (publicly accessible):
- Moore: 200
- Miller: 200
- Brown: 200
- Lierman: 200
- Davis: 200

## Decision Confirmations

### D-01: LG Standalone Chamber

Aruna Miller (`-240002`) is linked to:
- Chamber: `Lieutenant Governor` / `Lieutenant Governor of Maryland`
- District: `Maryland Lieutenant Governor` (distinct STATE_EXEC district)

She is NOT under the Governor's chamber. The standalone chamber was created by migration 269 and referenced correctly by migration 270.

### D-03: Davis Appointed Flag

Dereck E. Davis (`-240005`) is the ONLY official with:
- `politicians.is_appointed = true`
- `offices.is_appointed_position = true`

The other 4 officials (Moore, Miller, Brown, Lierman) all have `is_appointed=false` and `is_appointed_position=false`.

### Idempotency Confirmation

| Artifact | Idempotency Test | Result |
|----------|-----------------|--------|
| Migration 270 | Re-applied via psql | All INSERTs returned `0 0`; UPDATE affected 0 rows |
| Python headshot script | Re-run after all 5 uploads | All 5 skipped (`SKIP: politician_images row already exists`) |
| Migration 271 | AUDIT-ONLY — not applied via ledger | N/A (confirmed by header comment) |

## Headshot Processing Notes

All images processed: crop 4:5 FIRST (never stretch), then resize 600x750 Lanczos q90 JPEG.

| Name | Source Dims | Mode | Crop Applied | Final |
|------|-------------|------|-------------|-------|
| Wes Moore | 504x672 | RGB | top-crop to 504x630 (too tall) | 600x750 |
| Aruna Miller | 504x672 | RGB | top-crop to 504x630 (too tall) | 600x750 |
| Anthony G. Brown | 192x240 | RGB | none (already 4:5) | 600x750 |
| Brooke Lierman | 1280x1488 | RGBA | center-crop width to 1190x1488 (too wide) | 600x750 |
| Dereck E. Davis | 989x1319 | RGB | top-crop to 989x1236 (too tall) | 600x750 |

## Commits

| Task | Description | Hash | Repo |
|------|-------------|------|------|
| Task 1 | Write + apply migration 270 — MD state executives | c28e177 | EV-Accounts |
| Task 2 (EV-Accounts) | Write audit migration 271 — MD executive headshots | 7d184b2 | EV-Accounts |
| Task 2 (essentials) | Add MD executive headshots script | 7353b7c | essentials worktree |
| Task 3 | Verification-only (no file changes) | — | — |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase REST API does not expose `essentials` schema for DB inserts**

- **Found during:** Task 2 — initial run of Python headshot script
- **Issue:** The Supabase REST API only exposes schemas: public, civic_spaces, connect, empower, inform, graphql_public, validation_quests, treasury. The `essentials` schema is not exposed. Calls with `Accept-Profile: essentials` returned HTTP 406.
- **Fix:** Updated Python script to use psql direct connection for both existence check and INSERT (via subprocess). The images were already uploaded to Storage successfully on the first run; only the DB insert step needed fixing. The 5 politician_images rows were also inserted directly via psql.
- **Files modified:** `scripts/md_executives_headshots.py` — replaced REST API insert with psql subprocess call
- **Impact:** No data loss; all 5 headshots are in Storage and all 5 DB rows are correct. The pattern (psql for essentials schema writes) matches what `_tmp-ca-school-headshots.py` apparently also encountered but masked differently.

**2. [Rule 1 - Bug] Plan's automated verify script used case-insensitive regex for state='MD' check**

- **Found during:** Task 1 verification
- **Issue:** The plan's `<automated>` node verification command used `/state\s*=\s*'md'/gi` which matched ALL `state='MD'` occurrences (not just lowercase ones) due to the `i` flag.
- **Fix:** Ran targeted verification confirming 0 lowercase `state='md'` occurrences and 22 uppercase `state='MD'` occurrences. The migration file itself is correct.
- **Impact:** No data issue; plan's verify script was wrong, actual file is correct.

## Known Stubs

None — all 5 politician rows have full data, all 5 office rows are correctly linked, all 5 headshots are live in Storage.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes at trust boundaries. All threat mitigations from the plan's STRIDE register were applied:

| Threat | Mitigation Applied |
|--------|-------------------|
| T-92-02-01 (STATE_EXEC casing) | All 5 districts use `state='MD'` uppercase; confirmed 0 lowercase occurrences |
| T-92-02-02 (Davis appointed flag) | Davis is the only is_appointed=true; Gate 4 confirmed |
| T-92-02-03 (url column name) | Used `url` throughout; zero `storage_url` in audit migration |
| T-92-02-04 (Migration 271 ledger) | Header explicitly says "DO NOT apply via Supabase ledger"; not applied |
| T-92-02-06 (SERVICE_ROLE_KEY in script) | Key read from env var only; confirmed no hardcoded JWT in script |
| T-92-02-07 (headshot integrity) | Crop-first-then-resize pattern applied; Lanczos q90 |
| T-92-02-SC (pip install) | Pillow already available; no install needed |

## Self-Check

- [x] Migration file exists: `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql`
- [x] Audit migration exists: `C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql`
- [x] Python script exists: `scripts/md_executives_headshots.py`
- [x] EV-Accounts Task 1 commit: `c28e177`
- [x] EV-Accounts Task 2 commit: `7d184b2`
- [x] Essentials Task 2 commit: `7353b7c`
- [x] Gate 1 = 5 (chambers)
- [x] Gate 2 = 5 (STATE_EXEC districts)
- [x] Gate 3 = 5 rows correct names
- [x] Gate 4 = 5 rows; Davis only has is_appointed_position=true
- [x] Gate 5 = 5 (politician_images)
- [x] Gate 6 = 0 (back-fill complete)
- [x] All 5 storage URLs return HTTP 200
- [x] D-01 confirmed (LG standalone chamber)
- [x] D-03 confirmed (Davis appointed flags)
- [x] Migration 271 NOT applied via ledger

## Self-Check: PASSED
