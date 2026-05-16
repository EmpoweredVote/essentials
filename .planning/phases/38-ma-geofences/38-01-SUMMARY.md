---
phase: 38-ma-geofences
plan: 01
subsystem: database
tags: [tiger, geofences, massachusetts, postgis, shapefile, boundaries]

# Dependency graph
requires: []
provides:
  - MA registered in load-state-tiger-boundaries.ts (STATE_LAYER_ALLOWLIST, STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID)
  - MTFCC pre-flight assertion for MA layers before any DB write
  - 281 geofence rows in essentials.geofence_boundaries for state='25'
  - 223 district rows in essentials.districts for state='MA'/'ma'
  - Cambridge place boundary geo_id='2511000', name='Cambridge city', mtfcc='G4110'
  - Middlesex County boundary geo_id='25017' (G4020) loaded
affects: [39-ma-government-db, 40-ma-executives-federal, 41-cambridge-city-structure, 43-cambridge-elections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "MA MTFCC pre-flight assertion pattern: count records before DB write, halt on mismatch, named MtfccAssertionError"
    - "MA place layer: only 58 G4110 cities exist; 293 towns are G4040 COUSUB — filtered out by existing G4110 MTFCC check"

key-files:
  created: []
  modified:
    - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts

key-decisions:
  - "MA place count is 58 (not 351 as originally planned) — TIGER 2024 PLACE file has 58 G4110 incorporated cities; remaining 293 municipalities are G4040 COUSUB (towns, not cities in the TIGER sense)"
  - "293 MA towns (G4040 COUSUB) are NOT loaded in Phase 38 — future work if complete MA municipal coverage is needed"
  - "Cambridge IS one of the 58 G4110 cities (geo_id=2511000) — all Phase 38 goals satisfied despite lower place count"
  - "districts.state casing: NATIONAL_LOWER rows use uppercase 'MA' (loaded via cd layer / different prior script); STATE_UPPER/STATE_LOWER/COUNTY use lowercase 'ma' (loaded via insertDistrictIfMissing with abbrev variable)"

patterns-established:
  - "MTFCC pre-flight assertion pattern: assert before upsert pass, throw named MtfccAssertionError with layer + expected + actual + URL for diagnostic clarity"

# Metrics
duration: ~20min
completed: 2026-05-16
---

# Phase 38 Plan 01: MA TIGER Loader + Boundary Load Summary

**5 MA TIGER 2024 layers loaded via pre-flight-asserted loader: 58 G4110 cities (Cambridge confirmed), 9 congressional, 40 Senate, 160 House, 14 counties**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-16
- **Completed:** 2026-05-16
- **Tasks:** 2 (+ 1 fix task)
- **Files modified:** 1 (load-state-tiger-boundaries.ts)

## Accomplishments

- MA registered in all three allowlist tables: STATE_LAYER_ALLOWLIST, STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID
- MTFCC pre-flight assertion added to processLayer for MA (fips='25') — counts records before DB write, halts with named MtfccAssertionError on mismatch
- Place assertion corrected from 351 to 58 after user decision: MA TIGER PLACE layer has only 58 G4110 incorporated cities; the other 293 municipalities are G4040 COUSUB (towns)
- All 5 layers loaded to production: G4020=14, G4110=58, G5200=9, G5210=40, G5220=160 (281 total boundaries)
- 223 district rows confirmed: NATIONAL_LOWER=9, STATE_UPPER=40, STATE_LOWER=160, COUNTY=14
- Cambridge geo_id='2511000' confirmed present with name='Cambridge city', mtfcc='G4110'
- Zero invalid geometries (ST_MakeValid applied to all 5 MA layers)

## Task Commits

1. **Task 1: Register MA in TIGER loader with MTFCC pre-flight assertion** - `015599b` (feat) — in C:/EV-Accounts/backend
2. **Fix: Correct MA place assertion from 351 to 58** - `a9acb49` (fix) — in C:/EV-Accounts/backend
3. **Task 2: Live load all 5 MA TIGER layers** — DB load only, no source file changes; verified via psql

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — MA added to STATE_LAYER_ALLOWLIST + STATE_CITY_ASSERTIONS + STATE_RUN_MAKEVALID; MTFCC pre-flight assertion block added (~45 lines); place count corrected 351→58

## Decisions Made

**Place count deviation: 58 not 351**

The original plan specified 351 incorporated G4110 places. After the assertion fired with actualCount=58, a user decision was sought. Decision: proceed with 58. Rationale: Massachusetts has only 58 municipalities with city charters (G4110 in TIGER); the remaining 293 municipalities are towns filed as G4040 COUSUB in a separate TIGER layer. Cambridge (geo_id=2511000) is one of the 58 cities, so all Phase 38 goals are fully satisfied.

**Cousub layer deferred**

293 MA towns (G4040 COUSUB) are not loaded in Phase 38. This means address lookups for residents of non-city municipalities (e.g., Lexington, Concord) will not return a LOCAL boundary row. Deferred as future work.

## Deviations from Plan

### Plan-vs-Reality: Place count 351 → 58

- **Found during:** Task 2 (live load attempt — MTFCC assertion fired)
- **Issue:** TIGER 2024 PLACE file for FIPS 25 contains only 58 G4110 records; the plan expected 351
- **Root cause:** MA municipal structure — only 58 cities have G4110 classification; 293 towns are G4040 COUSUB
- **Resolution:** User decision to proceed with 58 (correct count); assertion updated via fix commit a9acb49
- **Impact:** Cambridge still loadable; Phase 38 success criteria met; 293 towns are acknowledged future work

---

**Total deviations:** 1 plan correction (place count 351→58; user-decided)
**Impact on plan:** Cambridge fully covered. Phase 38 success criteria satisfied. COUSUB towns deferred.

## Issues Encountered

- Initial MTFCC assertion (351) would have caused live load to fail with MtfccAssertionError. Caught correctly before any DB write. Fixed before re-run. The assertion worked exactly as designed.

## User Setup Required

None — no external service configuration required.

## Final Verification Counts

```
essentials.geofence_boundaries WHERE state='25':
  G4020 (county)           |  14
  G4110 (incorporated city)|  58
  G5200 (congressional)    |   9
  G5210 (state senate)     |  40
  G5220 (state house)      | 160
  TOTAL                    | 281

essentials.districts WHERE state IN ('MA','ma'):
  NATIONAL_LOWER (MA)      |   9
  STATE_UPPER    (ma)      |  40
  STATE_LOWER    (ma)      | 160
  COUNTY         (ma)      |  14
  TOTAL                    | 223

Cambridge: geo_id='2511000', name='Cambridge city', mtfcc='G4110' ✓
Invalid geometries: 0 ✓
```

## Next Phase Readiness

- Phase 38-02 (smoke test) can proceed: 4 Cambridge addresses can be verified against correct district rows
- Middlesex County G4020 boundary is loaded (geo_id='25017') — county intersection pattern from Phase 19 applies
- Phase 39 (MA Government DB) can begin: district rows exist for all 200 state legislators to link to
- Phase 40 (MA Executives + Federal Officials) can begin: 9 NATIONAL_LOWER congressional boundaries confirmed
- Phase 41 (Cambridge City Structure) can begin: Cambridge G4110 geofence confirmed

**Known gap:** G4040 COUSUB boundaries (293 MA towns) are not loaded. Address lookups for non-city MA addresses will not return a LOCAL boundary row. This is acknowledged and deferred.

---
*Phase: 38-ma-geofences*
*Completed: 2026-05-16*
