---
phase: 63-sf-deep-seed
plan: 01
subsystem: essentials-data
tags: [geofences, migration, datasf, socrata, sf, supervisor-districts, postgis]

requires:
  - phase: 57-ca-tiger-boundaries
    provides: SF city TIGER boundaries (geo_id=0667000 G4110, 06075 G4020) already loaded
provides:
  - 11 SF supervisor district polygons in geofence_boundaries (mtfcc=X0006, DataSF 2022 redistricted)
  - SF government row (City and County of San Francisco, LOCAL, CA, geo_id=0667000)
  - 10 SF chambers (Board of Supervisors + 9 citywide executives)
  - 11 LOCAL district rows (sf-supervisor-district-1 through sf-supervisor-district-11)
  - 1 LOCAL_EXEC district row (geo_id=0667000, San Francisco Citywide)
  - Loader script: C:/EV-Accounts/backend/scripts/load-sf-supervisor-boundaries.ts
  - Smoke test script: C:/EV-Accounts/backend/scripts/smoke-sf-geofences.ts
  - Migration 205 applied to live DB
affects: [63-02, 63-03]

tech-stack:
  added: []
  patterns:
    - DataSF Socrata pattern: rows.geojson endpoint returns native WGS84; no outSR=4326 param
    - DataSF district field: sup_dist_num (numeric float e.g. 11.0) not DISTRICT (ArcGIS string)
    - X0006 mtfcc now claimed for SF supervisor districts (non-colliding with X0005=LA County)
    - districts.label column (not 'name'); no unique constraint on (geo_id, district_type)

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-sf-supervisor-boundaries.ts
    - C:/EV-Accounts/backend/scripts/smoke-sf-geofences.ts
    - supabase/migrations/205_sf_government_structure.sql
  modified: []

key-decisions:
  - "Migration 198 already taken by 198_lausd_board_seed.sql (unapplied file in repo); used 205 instead"
  - "SF City Hall routes to District 5 (Supervisor Matt Dorsey territory, Civic Center area)"
  - "districts.label column confirmed (not 'name'); no unique constraint on (geo_id, district_type)"
  - "DataSF sup_dist_num returns numeric floats (11.0 not 11); parseInt(String()) handles correctly"

patterns-established:
  - "Socrata DataSF loader: no outSR, field=sup_dist_num, parseInt(String(rawDistrict)) for float->int"
  - "X0006 MTFCC reserved for SF supervisor districts"

duration: 10min
completed: 2026-05-22
---

# Phase 63 Plan 01: SF Supervisor Geofences + Government Structure Summary

**DataSF Socrata loader inserts 11 post-2022-redistricted SF supervisor district polygons (X0006); migration 205 creates SF government row + 10 chambers + 12 districts rows; smoke test confirms City Hall routes to District 5, Oakland returns 0 rows.**

## Performance

- **Duration:** 10 minutes
- **Started:** 2026-05-22T06:03:38Z
- **Completed:** 2026-05-22T06:14:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Loaded 11 SF Board of Supervisors district polygons from DataSF Socrata (f2zs-jevy endpoint) into `essentials.geofence_boundaries` with mtfcc='X0006', state='06'
- Loader is idempotent: second run Inserted=0, Skipped=11
- Applied migration 205 to live DB: 1 SF government row, 10 chambers, 11 supervisor district rows, 1 SF-wide LOCAL_EXEC district row
- All 4 verification gates pass: government row, 10 chambers, 11 supervisor districts, 1 SF-wide district
- smoke-sf-geofences.ts exits 0 with all 3 gates passing: SC1 (11 rows), SC2 (City Hall → District 5), SC3 (Oakland → 0 rows)

## Task Commits

1. **Task 1: Load SF supervisor boundaries (loader script + live run)** — documented in `51d7e7a` (feat)
2. **Task 2: Migration 205 SF government structure** — `51d7e7a` (feat — combined with Task 1)
3. **Task 3: smoke-sf-geofences.ts created and run** — script in C:/EV-Accounts/backend (no essentials repo file to stage)

**Plan metadata:** See final docs commit

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/load-sf-supervisor-boundaries.ts` — DataSF Socrata fetch + upsert of 11 SF supervisor district polygons; idempotent ON CONFLICT DO NOTHING
- `C:/EV-Accounts/backend/scripts/smoke-sf-geofences.ts` — 3-gate smoke test: row count, SF City Hall positive, Oakland negative
- `supabase/migrations/205_sf_government_structure.sql` — Government row + 10 chambers + 12 districts rows; idempotent WHERE NOT EXISTS guards

## Verification Gate Outputs

### Task 1: Geofence Boundaries

```
Dry-run: 11 districts mapped, all with sup_dist_num field
Live run: Inserted: 11, Skipped: 0
Re-run: Inserted: 0, Skipped: 11 (idempotent confirmed)
DB: SELECT COUNT(*) = 11 where geo_id LIKE 'sf-supervisor-district-%' AND mtfcc='X0006' AND state='06'
```

### Task 2: Migration 205 Verification

```
Gate A: City and County of San Francisco | LOCAL | CA | geo_id=0667000 — PASS
Gate B: 10 chambers (Assessor-Recorder, Board of Supervisors, City Administrator, City Attorney,
        Controller, District Attorney, Mayor, Public Defender, Sheriff, Treasurer) — PASS
Gate C: 11 supervisor districts (sf-supervisor-district-1 through -11, LOCAL, CA) — PASS
Gate D: geo_id=0667000, district_type=LOCAL_EXEC, state=CA — PASS
Re-run: all counts unchanged (1/10/11/1) — idempotent confirmed
```

### Task 3: Smoke Test

```
SC1: 11 rows (geo_id LIKE 'sf-supervisor-district-%', mtfcc='X0006', state='06') — PASS
SC2: SF City Hall (-122.4194, 37.7793) → sf-supervisor-district-5 / District 5 — PASS
SC3: Oakland City Hall (-122.2711, 37.8044) → 0 rows — PASS
Exit code: 0
```

## SF City Hall District Reference

**SF City Hall (-122.4194, 37.7793) routes to: `sf-supervisor-district-5` (District 5)**

District 5 covers the Civic Center, Hayes Valley, Western Addition, and Haight-Ashbury neighborhoods. The incumbent Supervisor for District 5 is Matt Dorsey. This is the canonical routing result for downstream plan 63-02 reference.

## Decisions Made

1. **Migration number 205 instead of 198**: The plan specified migration 198, but `198_lausd_board_seed.sql` already exists as an unapplied file in `supabase/migrations/`. Used 205 as the next sequential number after 204 (last applied migration `204_la_council_orphan_cleanup`). [Rule 3 - Blocking]

2. **districts.label not districts.name**: The plan's SQL used `name` column in INSERT for `essentials.districts`, but the actual column is `label`. Fixed automatically. [Rule 1 - Bug]

3. **No ON CONFLICT for districts**: The plan specified `ON CONFLICT (geo_id, district_type) DO NOTHING` for districts inserts, but no such unique constraint/index exists on `essentials.districts`. Changed to `WHERE NOT EXISTS` guard pattern used throughout the codebase. [Rule 1 - Bug]

4. **DataSF sup_dist_num returns float (11.0)**: The field returns numeric floats, not integers. The loader uses `parseInt(String(rawDistrict ?? ''), 10)` which correctly handles `"11.0"` → `11`. No code change needed (the plan's parseInt approach already handles this).

5. **X0006 MTFCC reserved for SF**: LA County supervisor districts use X0005; SF supervisor districts now claim X0006. Non-colliding, consistent with the custom MTFCC pattern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration number conflict: 198 taken, used 205**
- **Found during:** Task 2 (writing migration 198_sf_government_structure.sql)
- **Issue:** `supabase/migrations/198_lausd_board_seed.sql` already exists in the essentials repo (written for Phase 62-03, never applied to DB). Cannot create another 198 file.
- **Fix:** Used migration number 205 (next sequential after 204, the last applied migration)
- **Files modified:** supabase/migrations/205_sf_government_structure.sql (created with correct number)
- **Verification:** `SELECT version FROM supabase_migrations.schema_migrations WHERE version='205'` → 1 row
- **Committed in:** 51d7e7a

**2. [Rule 1 - Bug] districts.label column (not .name)**
- **Found during:** Task 2 (first migration apply attempt)
- **Issue:** Plan SQL used `name` column but actual column is `label` on `essentials.districts`
- **Fix:** Changed all INSERT statements for districts to use `label` instead of `name`
- **Files modified:** supabase/migrations/205_sf_government_structure.sql
- **Verification:** Migration applied without error; Gate C/D pass
- **Committed in:** 51d7e7a

**3. [Rule 1 - Bug] No unique constraint on (geo_id, district_type) in districts**
- **Found during:** Task 2 (schema inspection)
- **Issue:** Plan specified `ON CONFLICT (geo_id, district_type) DO NOTHING` for districts inserts, but `essentials.districts` has no such unique index (only primary key and external_id indexes)
- **Fix:** Changed to `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id=... AND district_type=...)` guard pattern
- **Files modified:** supabase/migrations/205_sf_government_structure.sql
- **Verification:** Re-run confirmed idempotent (counts unchanged on second apply)
- **Committed in:** 51d7e7a

---

**Total deviations:** 3 auto-fixed (1 blocking, 2 bugs)
**Impact on plan:** All auto-fixes necessary for correct migration numbering and DB schema compatibility. No scope creep.

## Issues Encountered

None beyond the 3 auto-fixed deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SF supervisor district geofences: loaded and verified ✓
- SF government row: bc3d780d-941e-475b-b07f-bc8dbcd300d3 ✓
- 10 chambers ready for office linkage ✓
- 11 LOCAL district rows ready for office linkage ✓
- 1 LOCAL_EXEC district row (0667000) ready for citywide offices ✓
- SF City Hall routing confirmed: District 5 (for 63-02 reference) ✓
- Ready for 63-02: seeding 20 SF incumbents (11 supervisors + 9 citywide) via migration 206

---
*Phase: 63-sf-deep-seed*
*Completed: 2026-05-22*
