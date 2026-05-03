---
phase: 19-tx-congressional-seats-geofences
plan: 05
subsystem: api, frontend
tags: react, postgis, geofence, congressional, vite, jsx

# Dependency graph
requires:
  - phase: 19-tx-congressional-seats-geofences
    plan: 04
    provides: "Backend getPoliticiansByGovernmentList extended with countyGeoId option; POST /by-government-list accepts county_geo_id; PostGIS G4020↔G5200 intersection returns 5 US House reps for Collin County"
provides:
  - "browseByGovernmentList in api.jsx accepts countyGeoId option and forwards county_geo_id in POST body"
  - "Landing.jsx Collin County entry carries browseCountyGeoId='48085' and emits browse_county_geo_id in URL"
  - "Results.jsx reads browse_county_geo_id URL param and passes countyGeoId to API call"
  - "End-to-end: browsing Collin County in production shows 5 TX US House reps via PostGIS intersection"
affects:
  - future TX county expansions (Dallas=48113, Tarrant=48439, Bexar=48029, Travis=48453)
  - any coverage area that needs county-level congressional rep intersection

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "countyGeoId threaded from COVERAGE_AREAS entry → URL param → searchParams → API call → POST body"
    - "Conditional URL param: browse_county_geo_id only emitted when browseCountyGeoId truthy on coverage area entry"
    - "G4020 county boundary intersection pattern: add browseCountyGeoId to COVERAGE_AREAS entry to activate"

key-files:
  created: []
  modified:
    - src/lib/api.jsx
    - src/pages/Landing.jsx
    - src/pages/Results.jsx

key-decisions:
  - "URL param name is browse_county_geo_id (matches browse_* pattern used by other URL params in Results.jsx)"
  - "Default empty options object {countyGeoId} = {} in browseByGovernmentList preserves backward compatibility with existing callers"
  - "browseCountyGeoId field added only to Collin County COVERAGE_AREAS entry; other areas unchanged until their G4020 boundaries are loaded"

patterns-established:
  - "County congressional rep expansion pattern: (a) load G4020 boundary for county, (b) add browseCountyGeoId to COVERAGE_AREAS entry — no other code changes needed"

# Metrics
duration: segmented (Tasks 1-3 auto; Task 4 human-verify approved)
completed: 2026-05-03
---

# Phase 19 Plan 05: Frontend Wiring + User Verify Summary

**Frontend threads browseCountyGeoId through Landing→Results→api to surface 5 TX congressional reps for Collin County via PostGIS intersection; user verified on production (Keith Self TX-3, Pat Fallon TX-4, Lance Gooden TX-5, Brandon Gill TX-26, Julie Johnson TX-32)**

## Performance

- **Duration:** Segmented execution (Tasks 1-3 auto; Task 4 human-verify checkpoint approved by user)
- **Started:** 2026-05-03
- **Completed:** 2026-05-03
- **Tasks:** 4 (3 auto + 1 human-verify checkpoint)
- **Files modified:** 3

## Accomplishments

- `api.jsx` — `browseByGovernmentList` extended with `countyGeoId` option; sends `county_geo_id` in POST body when provided; backward compatible (default `= {}`)
- `Landing.jsx` — Collin County `COVERAGE_AREAS` entry gains `browseCountyGeoId: '48085'`; URL builder conditionally emits `browse_county_geo_id=48085` in the Results link
- `Results.jsx` — reads `browse_county_geo_id` URL param; coerces null→undefined; passes `{ countyGeoId }` to `browseByGovernmentList`
- User verified on **production** (Render deploy): Collin County page shows 5 correct US House reps; LA County and Indiana unaffected; URL contains `browse_county_geo_id=48085`

## Task Commits

Each task was committed atomically:

1. **Task 1: Add countyGeoId support to api.jsx browseByGovernmentList** - `6809dcd` (feat)
2. **Task 2: Add browseCountyGeoId to Collin County entry in Landing.jsx** - `a1b2e4f` (feat)
3. **Task 3: Read browse_county_geo_id URL param in Results.jsx** - `f9e3e7a` (feat)
4. **Task 4: User-verify end-to-end flow** — approved (no code commit; checkpoint resolved)

## Files Created/Modified

- `src/lib/api.jsx` — `browseByGovernmentList` extended with `countyGeoId` option; sends `county_geo_id` in POST body when truthy
- `src/pages/Landing.jsx` — Collin County `COVERAGE_AREAS` entry includes `browseCountyGeoId: '48085'`; Results link conditionally appends `browse_county_geo_id`
- `src/pages/Results.jsx` — reads `browse_county_geo_id` from URL params; passes `countyGeoId` to API call

## Collin County URL Pattern

```
/results?browse_state_code=TX&browse_government_list=collin-county&browse_county_geo_id=48085
```

(Param order may vary; `browse_county_geo_id=48085` is the key addition)

## Decisions Made

- URL param name `browse_county_geo_id` chosen to match the existing `browse_*` naming pattern (`browse_state_code`, `browse_government_list`) already used in Results.jsx
- `browseCountyGeoId` field added only to Collin County in `COVERAGE_AREAS`; other coverage areas (LA County, Indiana) untouched until their G4020 boundaries are loaded into the DB
- Default empty options object `{ countyGeoId } = {}` ensures all existing callers of `browseByGovernmentList` that pass no third argument continue to work without change

## Deviations from Plan

None — plan executed exactly as written. All three frontend files modified per spec; user verified on production.

## Issues Encountered

None. Production deploy on Render succeeded. Browser verification passed for all three test cases (Collin County new behavior, LA County regression, Indiana regression).

## Verification Result

**User approved on production** (not just local):

- Collin County page: Keith Self (TX-3), Pat Fallon (TX-4), Lance Gooden (TX-5), Brandon Gill (TX-26), Julie Johnson (TX-32) — all 5 correct reps shown
- LA County: congressional reps unchanged (no regressions)
- Indiana: congressional reps unchanged (no regressions)
- URL confirmed: `browse_county_geo_id=48085` present in address bar

## Phase 19 Closing Notes

Phase 19 is **fully complete** (5/5 plans):

| Plan | Description | Key Outcome |
|------|-------------|-------------|
| 19-01 | TX G5200 congressional boundaries | 38 district boundaries loaded; migration 104 backfilled district_id |
| 19-02 | Collin County G4020 boundary | `geo_id=48085`, `state='48'`, ST_Polygon SRID 4326; 3235 county records scanned |
| 19-03 | TX House politicians seeded | 37 active + 1 vacant (TX-23); chamber UUID c2facc31; migration 105 applied |
| 19-04 | Backend PostGIS intersection | `getPoliticiansByGovernmentList` + `countyGeoId`; smoke test: 5 reps for Collin County |
| 19-05 | Frontend wiring + user verify | api.jsx + Landing.jsx + Results.jsx; production verified |

**Phase 19 goal achieved:** All 38 TX US House members loaded as `NATIONAL_LOWER` records; Collin County `G4020` geofence exists; browsing Collin County surfaces 5 correct congressional reps via PostGIS intersection; LA County and Indiana unaffected.

## Suggested Follow-ups: Expanding TX County Coverage

To add congressional rep intersection for additional TX counties, the pattern is established:

1. Load the county's G4020 boundary (run `load-county-boundary.ts` or equivalent for the target GEOID)
2. Add `browseCountyGeoId: '<FIPS>'` to the county's `COVERAGE_AREAS` entry in `Landing.jsx`

No other code changes needed. Priority counties when TX coverage expands:

| County | FIPS (GEOID) | Notes |
|--------|-------------|-------|
| Dallas County | 48113 | ~9 congressional districts; large metro |
| Tarrant County | 48439 | Fort Worth metro |
| Bexar County | 48029 | San Antonio |
| Travis County | 48453 | Austin |

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

Phase 19 complete. No blockers. Next work items for TX v3.0 (from `project_collin_county_next_phase.md` memory):
- Elections/candidates data for Collin County
- Stance research for remaining officials
- Contact data gaps
- Missing people (no online headshot source)
- Web form URLs

---
*Phase: 19-tx-congressional-seats-geofences*
*Completed: 2026-05-03*
