---
phase: 19-tx-congressional-seats-geofences
plan: "02"
subsystem: database
tags: [postgis, tiger, shapefile, geofences, collin-county, texas, county-boundary]

requires:
  - phase: 19-01
    provides: TX G5200 congressional district boundaries in geofence_boundaries

provides:
  - Collin County G4020 boundary (geo_id='48085') in essentials.geofence_boundaries
  - County-side geometry needed for ST_Intersects intersection query in Plan 19-04

affects:
  - 19-04 (PostGIS intersection query requires this county boundary as spatial join anchor)
  - 19-05 (frontend congressional seat display depends on intersection results)

tech-stack:
  added: []
  patterns:
    - "TIGER/Line 2024 county shapefile download + extract + filter + insert pattern"
    - "ON CONFLICT (geo_id, mtfcc) DO NOTHING idempotency for geofence_boundaries"
    - "state stored as 2-digit FIPS ('48') not state abbreviation ('TX') in geofence_boundaries"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-collin-county-boundary.ts
  modified: []

key-decisions:
  - "state column stores '48' (2-digit FIPS) not 'TX' — matches existing G5200 congressional rows"
  - "Script downloads national county ZIP (~120MB) and cleans it up after completion"
  - "Only geofence_boundaries row inserted — no districts row needed (county is a spatial anchor, not a political district)"
  - "AdmZip must use default import (not require) since project runs in ESM mode"

patterns-established:
  - "County boundary scripts: download national ZIP, filter by STATEFP+COUNTYFP, insert one row, cleanup"

duration: ~35min
completed: 2026-05-03
---

# Phase 19 Plan 02: Load Collin County G4020 Boundary Summary

**Downloads TIGER 2024 national county shapefile, extracts Collin County (GEOID 48085), and inserts a valid PostGIS G4020 boundary row into essentials.geofence_boundaries — enabling the Plan 19-04 ST_Intersects intersection query**

## Performance

- **Duration:** ~35 min (dominated by ~120MB TIGER ZIP download)
- **Started:** 2026-05-03T20:53:00Z
- **Completed:** 2026-05-03T21:28:02Z
- **Tasks:** 2
- **Files modified:** 1 (new script created)

## Accomplishments

- Wrote `load-collin-county-boundary.ts` script mirroring the congressional boundary loader pattern
- Successfully downloaded `tl_2024_us_county.zip` (~120MB) from TIGER 2024 COUNTY dataset
- Scanned all 3,235 county records and found Collin County at GEOID 48085
- Inserted one row with geo_id='48085', mtfcc='G4020', state='48', srid=4326, is_valid=t
- Confirmed idempotency: re-run reports "Already exists. Skipped." and count stays at 1
- ZIP and extracted directory cleaned up automatically after completion

## Task Commits

Each task was committed atomically:

1. **Task 1: Write load-collin-county-boundary.ts script** - `c255e61` (feat)
2. **Task 1 fix: ESM AdmZip import fix** - `c52717a` (fix) [deviation - Rule 1]

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/load-collin-county-boundary.ts` — Downloads TIGER 2024 county ZIP, filters for Collin County (STATEFP=48, COUNTYFP=085), inserts G4020 boundary row into essentials.geofence_boundaries with cleanup

## Decisions Made

- **state='48' not 'TX'**: geofence_boundaries stores 2-digit FIPS for the state column on all TIGER-sourced rows; using 'TX' would mismatch existing G5200 rows
- **No districts row**: Collin County is a spatial anchor for the ST_Intersects query, not a political district with an OCD-ID that needs routing — inserting into `districts` is unnecessary and out of scope
- **Download-on-run pattern**: Script downloads the full ~120MB national county file each run (unless zip already present) and deletes it after; this is consistent with load-us-congressional-boundaries.ts approach for large one-time loads

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESM module scope requires default import for AdmZip**

- **Found during:** Task 2 (running the script)
- **Issue:** Initial code used `const AdmZip = require('adm-zip')` which fails in ESM scope. The project's `package.json` has `"type": "module"` and the tsconfig uses `"module": "ESNext"`, so `require` is not defined at runtime.
- **Fix:** Changed to `import AdmZip from 'adm-zip'` — tsx respects `esModuleInterop: true` from tsconfig, so default import works correctly
- **Files modified:** `backend/scripts/load-collin-county-boundary.ts`
- **Verification:** Script ran successfully, row inserted
- **Committed in:** `c52717a`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Required for script to run at all. No scope creep.

## Shapefile Details

- **Source ZIP:** `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip`
- **ZIP size:** ~120MB (109.6 MB reported during download)
- **Total county records scanned:** 3,235
- **Collin County position in file:** Roughly 1/3 into the file (TX counties appear mid-file)
- **Shapefile MTFCC field:** `G4020` — matched expected value exactly (no mismatch)
- **Final row count (geo_id='48085', mtfcc='G4020'):** 1

## DB Verification Result

```
 geo_id |     name      | state | mtfcc | geom_type  | srid | is_valid
--------+---------------+-------+-------+------------+------+----------
 48085  | Collin County | 48    | G4020 | ST_Polygon | 4326 | t
(1 row)
```

## Issues Encountered

None — script ran successfully after the ESM import fix. Shapefile MTFCC matched G4020 exactly. Geometry is valid at SRID 4326.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 19-02 complete: Collin County G4020 boundary is in `essentials.geofence_boundaries`
- Plan 19-03 (TX state district boundaries) and Plan 19-04 (PostGIS intersection query) can now proceed
- The ST_Intersects query in Plan 19-04 has both sides of the join available: G5200 TX congressional districts (from Plan 19-01) and G4020 Collin County boundary (this plan)
- Ready for Plan 19-03-PLAN.md

---
*Phase: 19-tx-congressional-seats-geofences*
*Completed: 2026-05-03*
