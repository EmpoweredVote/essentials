---
phase: 194-city-of-tucson-deep-seed
plan: 01
subsystem: database
tags: [postgis, arcgis, geofences, etl, tucson, multipolygon]

requires:
  - phase: 190-va-... (Arizona foundation / Phase 190 city geofence)
    provides: whole-city G4110 geofence (geo_id='0477000') that the 6 wards nest inside
provides:
  - 6 City of Tucson ward LOCAL geofences (mtfcc='X0020', state='az', geo_id tucson-az-ward-1..6) live in production
  - Ward 4 (2 constituent polygons) and Ward 5 (7) stored as faithful MultiPolygons — no ring dropped
  - The gating dependency for Plan 02's structural migration (per-ward routing)
affects: [194-02, 194-06]

tech-stack:
  added: []
  patterns:
    - "FULL multi-ring winding-classification ETL loader (CW=exterior/CCW=hole, AREA_EPS guard) — first phase where the multi-ring branch is load-bearing, not dead code"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-tucson-ward-boundaries.ts
  modified: []

key-decisions:
  - "Copied the Pima supervisor loader's winding-classification helper verbatim (both branches) rather than the LV naive pass-through (WR-01), because Ward 4/5 are genuinely multi-ring"
  - "ST_MakeValid repair guard fired for Ward 4 (self-intersection) — repaired to valid, ST_NumGeometries preserved at 2"

patterns-established:
  - "Per-ward ST_NumGeometries self-report added to the loader (Pima's lacked it) so multi-ring shape is observable at load + on idempotent re-run"

requirements-completed: [TUC-01]

duration: ~15min
completed: 2026-07-09
---

# Phase 194 Plan 01: Tucson Ward Geofence Loader Summary

**6 City of Tucson ward LOCAL geofences (X0020, lowercase az) loaded to production via the full multi-ring winding-classification ETL — Ward 4/5 faithful MultiPolygons, Ward 4 self-intersection auto-repaired.**

## Performance

- **Duration:** ~15 min
- **Tasks:** 3 (author loader → blocking ring-verify checkpoint → orchestrator-run load + assert)
- **Files modified:** 1 (in C:/EV-Accounts)

## Accomplishments
- Authored `load-tucson-ward-boundaries.ts` from the Pima analog, using the FULL winding-classification helper (both branches) — the LV naive pass-through anti-pattern (WR-01) was NOT used.
- Loaded 6 X0020/state='az' ward geofences to production from Pima County's `Boundaries2/MapServer/3` (f=json, outSR=4326).
- Ward 4 = 2 constituent polygons, Ward 5 = 7, Wards 1/2/3/6 = 1 — no ring silently dropped.
- Ward 4 geometry was self-intersecting; the `ST_MakeValid` re-run guard repaired it to valid while preserving `ST_NumGeometries=2`.

## Task Commits
1. **Task 1: Author loader** — `473bacbf` (feat) — committed to `C:/EV-Accounts` (master→Render)
2. **Task 2: Blocking ring-structure verify** — human-approved ("Approved — run it")
3. **Task 3: Orchestrator-run load + assert** — no repo files; production DB writes + read-only assertions

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/load-tucson-ward-boundaries.ts` — ArcGIS rings→GeoJSON multi-ring loader, parameterized binds, ON CONFLICT idempotent, ST_MakeValid guard, D-01 shortfall PAUSE+flag

## Production Manifest (assertion evidence)

| geo_id | ST_IsValid | ST_NumGeometries | centroid (lon,lat) |
|---|---|---|---|
| tucson-az-ward-1 | t | 1 | -111.0035, 32.1952 |
| tucson-az-ward-2 | t | 1 | -110.8173, 32.2320 |
| tucson-az-ward-3 | t | 1 | -110.9707, 32.2697 |
| tucson-az-ward-4 | t | 2 | -110.8038, 32.1269 |
| tucson-az-ward-5 | t | 7 | -110.8914, 32.0852 |
| tucson-az-ward-6 | t | 1 | -110.9073, 32.2279 |

- Combined boolean assertion returned `t` (count=6, all valid, all centroids in Tucson WGS84 box, Ward 4=2 / Ward 5=7 / others=1).
- Ward containment inside city boundary 0477000: 99.3%–100% — clean nesting, no split section.

## Decisions Made
- The city boundary `0477000` carries `state='04'` (FIPS, from Phase 190 TIGER) while the custom X0020 wards use lowercase `'az'` — consistent with the Pima X0019 / county-04019 precedent; lowercase az is required for LOCAL-tier routing.

## Deviations from Plan
None — plan executed exactly as written. (The Ward 4 `ST_MakeValid` repair is a designed-in guard firing, not a deviation.)

## Issues Encountered
- Ward 4's raw MultiPolygon was self-intersecting (ST_IsValid=false on insert). The conditional `ST_MakeValid` re-run guard repaired it and re-verified validity — exactly the defensive path the plan specified for the multi-ring case.

## Next Phase Readiness
- 6 X0020 ward geofences are live and valid → Plan 02's structural migration pre-flight (>=6 X0020) will pass and it may proceed.

---
*Phase: 194-city-of-tucson-deep-seed*
*Completed: 2026-07-09*
