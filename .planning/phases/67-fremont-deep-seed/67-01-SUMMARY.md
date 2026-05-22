---
phase: 67-fremont-deep-seed
plan: "01"
subsystem: database
tags: [arcgis, geofences, postgis, migrations, fremont, california]

# Dependency graph
requires:
  - phase: 57-ca-tiger-geofences
    provides: Fremont city boundary G4110 geo_id=0626000 in geofence_boundaries
  - phase: 65-sd-deep-seed
    provides: load-sd-council-boundaries.ts pattern (ArcGIS fetcher + X007 mtfcc claim)

provides:
  - 6 Fremont council district boundaries in geofence_boundaries (mtfcc=X0008, state=06)
  - load-fremont-council-boundaries.ts (ArcGIS FeatureServer fetcher, idempotent)
  - smoke-fremont-geofences.ts (3-gate smoke test, all PASS)
  - migration 210: City of Fremont government row + 2 chambers + 6 LOCAL districts + 1 LOCAL_EXEC district

affects:
  - 67-02 (politicians seed — needs government_id, chamber_ids, district_ids from this plan)
  - 67-03 (headshots — needs politician_ids from 67-02)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ArcGIS FeatureServer GeoJSON fetch with outSR=4326 (State Plane to WGS84 projection)
    - X0008 mtfcc claimed for Fremont council districts (X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont)
    - WHERE NOT EXISTS idempotent INSERT pattern for governments/chambers/districts

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-fremont-council-boundaries.ts
    - C:/EV-Accounts/backend/scripts/smoke-fremont-geofences.ts
    - C:/EV-Accounts/backend/migrations/210_fremont_government_structure.sql
  modified: []

key-decisions:
  - "Fremont City Attorney is APPOINTED (Rafael E. Alvarado Jr.) — NO City Attorney chamber created"
  - "X0008 mtfcc claimed for Fremont council district geofences"
  - "ARCGIS_URL endpoint confirmed: services2.arcgis.com/AVso4yDITKsybTJg (6 features); NOT services2.arcgis.com/vdNDkVykv9vEWFX4 (13 features, wrong city)"
  - "Fremont City Hall (-121.9886, 37.5483) routes to fremont-council-district-3"
  - "Migration 210 applied via pg pool (supabase CLI db execute subcommand does not exist)"

patterns-established:
  - "outSR=4326 on all ArcGIS FeatureServer URLs — Fremont uses State Plane CA Zone 3 natively (WKID 102643)"
  - "Use DISTRICT field for geo_id derivation, not MAP_LABEL (MAP_LABEL holds council member name, changes with elections)"

# Metrics
duration: 6min
completed: 2026-05-22
---

# Phase 67 Plan 01: Fremont Geofences + Government Structure Summary

**6 Fremont council district polygons loaded from City ArcGIS FeatureServer (X0008) + government scaffold (1 gov, 2 chambers, 7 districts) via migration 210; all 3 smoke test gates pass**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-22T16:55:51Z
- **Completed:** 2026-05-22T17:02:19Z
- **Tasks:** 2
- **Files modified:** 3 (all created new)

## Accomplishments
- 6 Fremont council district boundaries inserted into geofence_boundaries with WGS84 coordinates (outSR=4326 enforced)
- Migration 210 applied: City of Fremont government + City Council + Mayor chambers + 6 LOCAL districts + 1 LOCAL_EXEC district
- Smoke test (3 gates): SC1 count=6, SC2 City Hall->District 3, SC3 Oakland=0 rows — all PASS

## Task Commits

Each task was committed atomically:

1. **Task 1: Load Fremont council district geofences** - `305a8ea` (feat)
2. **Task 2: Migration 210 + smoke test** - `7f65168` (feat)

**Plan metadata:** `(see docs commit below)`

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/load-fremont-council-boundaries.ts` - ArcGIS FeatureServer fetcher; outSR=4326; inserts 6 rows with mtfcc=X0008; idempotent ON CONFLICT
- `C:/EV-Accounts/backend/scripts/smoke-fremont-geofences.ts` - 3-gate smoke test (count, City Hall positive, Oakland negative)
- `C:/EV-Accounts/backend/migrations/210_fremont_government_structure.sql` - government row + 2 chambers + 6 LOCAL + 1 LOCAL_EXEC districts; WHERE NOT EXISTS idempotent

## Decisions Made
- Fremont City Attorney is APPOINTED (Rafael E. Alvarado Jr., appointed by City Council) — NO City Attorney chamber created; only Mayor + City Council get chambers
- X0008 mtfcc claimed for Fremont council districts; falls through to X% fallback in essentialsService.ts → district_type IN ('LOCAL','COUNTY')
- ArcGIS endpoint confirmed: services2.arcgis.com/AVso4yDITKsybTJg has exactly 6 features (correct); services2.arcgis.com/vdNDkVykv9vEWFX4 has 13 features (different city — do not use)
- DISTRICT field used for district number derivation; MAP_LABEL intentionally excluded (holds incumbent name, changes each election cycle)
- Fremont City Hall (-121.9886, 37.5483) confirmed in District 3 per ArcGIS polygon geometry

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `supabase db execute` subcommand does not exist in installed CLI version. Resolved by applying SQL via pg Pool (node -e pattern used for all migrations in this project). Not a deviation — same workaround used for all prior migrations.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Government structure complete: government_id, chamber_ids (City Council + Mayor), district_ids (fremont-council-district-1..6 + 0626000 LOCAL_EXEC) all seeded
- Ready for 67-02: seed 7 politicians (Mayor + 6 council members) and their office rows
- Fremont City Hall routing confirmed working end-to-end via ST_Covers
- Key IDs to use in 67-02: government via subquery WHERE name='City of Fremont' AND state='CA'; districts via geo_id pattern

---
*Phase: 67-fremont-deep-seed*
*Completed: 2026-05-22*
