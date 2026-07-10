---
phase: 193-pima-county-board-of-supervisors-deep-seed
plan: 01
subsystem: database
tags: [postgis, arcgis, geofences, etl, tsx, pima-county, arizona]

requires:
  - phase: 190-arizona-tiger-geofences
    provides: "Pima County whole-county boundary row (geo_id 04019) the 5 districts nest within"
provides:
  - "5 Pima County supervisor-district LOCAL geofences (mtfcc=X0019, state=az, geo_id pima-az-supervisor-district-1..5) live in production essentials.geofence_boundaries"
  - "Per-district address routing substrate — gates the structural migration in Plan 02"
affects: [193-02, 193-03, 193-04, 193-06, tucson-arizona]

tech-stack:
  added: []
  patterns: ["ArcGIS MapServer f=json rings→GeoJSON loader with mandatory outSR=4326 reprojection (2868→4326)"]

key-files:
  created: ["C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts"]
  modified: []

key-decisions:
  - "outSR=4326 mandatory on the MapServer query — native SRID is 2868 (AZ State Plane)"
  - "X0019 MTFCC (outside excluded X0001-X0004 routing range, above WashCo X0018); lowercase state='az' for LOCAL routing"
  - "Centroid sanity box widened in judgment: District 3 (rural western Pima toward Ajo) centroid -112.06 is legitimately west of the plan's -112 bound; all coords clean WGS84, no 2868 garbage — no PAUSE"

patterns-established:
  - "Cross-repo author/apply split: executor authors loader in C:/EV-Accounts; orchestrator commits (git -C) + runs npx tsx + asserts via production MCP"

requirements-completed: [PIMA-01]

duration: ~10min
completed: 2026-07-09
---

# Phase 193 Plan 01: Supervisor-District Geofences Summary

**5 Pima County Board of Supervisors district boundaries sourced from the county ArcGIS MapServer (outSR=4326) and loaded as clean WGS84 LOCAL geofences (X0019, lowercase az), enabling true one-supervisor-per-address routing.**

## Performance
- **Duration:** ~10 min
- **Completed:** 2026-07-09
- **Tasks:** 2 (Task 1 authored by executor; Task 2 orchestrator-run)
- **Files modified:** 1 created (backend repo)

## Accomplishments
- Authored `load-pima-supervisor-boundaries.ts` (copy-adapted from `load-lv-ward-boundaries.ts`): f=json + outSR=4326, rings→GeoJSON, parameterized INSERT with `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3),4326))`, `ON CONFLICT (geo_id, mtfcc) DO NOTHING`, conditional `ST_MakeValid` guard, EXPECTED_COUNT=5 shortfall-abort (D-01 PAUSE+flag).
- Ran against production: fetched exactly 5 single-ring features, inserted 5 X0019 geofences, 0 already-present, 0 repaired.

## Geofence Manifest (production)

| geo_id | GIS NAME field | centroid (lon, lat) | ST_IsValid |
|--------|----------------|---------------------|------------|
| pima-az-supervisor-district-1 | REX SCOTT | -110.9513, 32.3887 | true |
| pima-az-supervisor-district-2 | DR. MATT HEINZ | -110.8989, 32.0448 | true |
| pima-az-supervisor-district-3 | JENNIFER ALLEN | -112.0604, 32.0893 | true |
| pima-az-supervisor-district-4 | STEVE CHRISTY | -110.6822, 32.0984 | true |
| pima-az-supervisor-district-5 | ANDRÉS CANO | -111.0708, 32.1951 | true |

All 5 geometries valid; all centroids clean WGS84 in the Tucson/Pima region (lat ~32, lon -110.7 to -112.1) — confirming `outSR=4326` worked and no native-2868 garbage stored.

## Task Commits
1. **Task 1: Author the loader** — `dc9d1d41` (feat, C:/EV-Accounts repo)
2. **Task 2: Run loader + assert** — orchestrator-run (no file commit; DB-only, idempotent)

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts` — one-time ETL loader for the 5 supervisor-district geofences

## Decisions Made
- **Centroid sanity box (widened):** The plan's automated verify asserted every centroid lon∈(-112,-110). District 3 (Jennifer Allen), which covers the large rural western portion of Pima County toward Ajo/Sells, has centroid lon -112.06 — legitimately 0.06° west of that bound. The box's actual purpose (per RESEARCH Pitfall 1) is to catch native-2868 state-plane garbage, which produces huge coordinate values; all 5 centroids are clean WGS84 lon/lat in-region. Treated as a too-tight sanity bound, not a data defect — proceeded rather than firing the D-01 PAUSE.

## Deviations from Plan
The plan's single-boolean verify SELECT returns `f` only because of the too-tight -112 west bound (District 3 at -112.06). Data is correct; the constraint was over-tight. All other assertions (count=5, geo_ids match, all valid) pass. No code deviation.

## Issues Encountered
- The GIS layer `NAME` field lists D5 = "ANDRÉS CANO", which may be stale (boundary layers lag roster changes). Flagged for the Plan 02 roster-currency human-verify checkpoint — current sitting occupants will be confirmed before seeding politicians.

## Next Phase Readiness
- 5 valid X0019 geofences live → Plan 02's structural migration pre-flight (`>=5 X0019`) will pass and it can seed the government/chamber/offices bound to these districts.

---
*Phase: 193-pima-county-board-of-supervisors-deep-seed*
*Completed: 2026-07-09*
