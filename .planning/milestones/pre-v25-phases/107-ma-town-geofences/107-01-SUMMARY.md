---
phase: 107-ma-town-geofences
plan: 01
subsystem: database
tags: [postgres, postgis, tiger, geofence, ma, cousub, g4040]

# Dependency graph
requires:
  - phase: 38-ma-cousub-load (v5.0)
    provides: 293 G4040 COUSUB town boundaries loaded into essentials.geofence_boundaries
provides:
  - 107-01-VERIFICATION.md: recorded pass evidence for all 4 ROADMAP success criteria
  - MA-GEO-01 closed: 293 G4040 rows confirmed; Concord/Brookline/Lexington PIP verified
  - MA-GEO-02 closed (geofence prerequisite): section-split clean; Phase 108/109 unblocked
affects: [108-boston-deep-seed, 109-ma-tier2-cities, 110-ma-elections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Verification-only phase pattern: assert production state, do NOT re-run idempotent loaders"
    - "MACOUSUB gate sequence (01-06) for G4040 COUSUB layer validation"
    - "OR-pattern section-split check: geofence NOT IN districts (not reverse direction)"
    - "G4040 COUSUB writeDistrictRow=false: towns inherit tiers from G5200/G5210/G5220 ST_Covers"

key-files:
  created:
    - .planning/phases/107-ma-town-geofences/107-01-VERIFICATION.md
  modified: []

key-decisions:
  - "Verification-only: 293 G4040 rows were loaded in v5.0 (2026-05-19); ON CONFLICT DO NOTHING would give false sense of re-load; assert instead"
  - "Section-split direction: geofence NOT IN districts (not reverse) is the correct PASS signal — reverse direction yields 7 expected rows for statewide districts with no polygon"
  - "G4040 districts join must be state-scoped: global join returns 54 rows from state='18' (Indiana CCDs); MA-scoped join returns 0 as designed"

patterns-established:
  - "COUSUB PIP tier chain: G4040 (town) + G5200 (congressional) + G5210 (state senate) + G5220 (state house)"
  - "FUNCSTAT exclusion verified: Cambridge (FUNCSTAT=F) and Boston (FUNCSTAT=I) both absent from G4040"

requirements-completed: [MA-GEO-01, MA-GEO-02]

# Metrics
duration: 25min
completed: 2026-06-10
---

# Phase 107: MA Town Geofences Summary

**293 G4040 COUSUB town boundaries confirmed in production; Concord/Brookline/Lexington PIP routing verified; Boston G4110 exclusion intact; section-split clean; MA-GEO-01 and MA-GEO-02 closed**

## Performance

- **Duration:** 25 min
- **Started:** 2026-06-10T15:40:00Z
- **Completed:** 2026-06-10T16:05:00Z
- **Tasks:** 3 (all executed in single pass — verification-only, all gates ran together)
- **Files modified:** 1 (107-01-VERIFICATION.md created)

## Accomplishments

- Confirmed all 7 MACOUSUB gates pass against production: 293 G4040 rows, Cambridge absent, Boston absent, Lexington present, Concord present, 0 invalid geometries, full MA picture matches expected counts
- Smoke test `smoke-ma-towns.ts` passes (exit 0): Lexington G4040=2501735215, Concord G4040=2501715060, Cambridge returns G4110 only
- Concord and Brookline both route through full G4040+G5200+G5210+G5220 tier chain as required by MA-GEO-01
- Boston routes via G4110=2507000 with zero G4040 rows — FUNCSTAT exclusion intact
- Section-split check (geofence NOT IN districts, state='25', mtfcc in G5200/G5210/G5220/G4020) returns 0 rows
- MA-GEO-01 and MA-GEO-02 (geofence prerequisite) closed; Phase 108 unblocked

## Task Commits

All tasks executed and committed as a single verification pass:

1. **Task 1: Assert G4040 town rows present, geometry valid, FUNCSTAT exclusions** - see below
2. **Task 2: Town routing smoke test + PIP tier checks** - see below
3. **Task 3: Section-split check + requirement closure** - see below

**Verification evidence commit:** `467d43d` (feat(107-01): run MACOUSUB gates + PIP tier checks + section-split verification)

## Files Created/Modified

- `.planning/phases/107-ma-town-geofences/107-01-VERIFICATION.md` - Recorded pass evidence for all 4 ROADMAP success criteria; includes MACOUSUB-01..06 results, smoke test output, PIP tier tables for Concord/Brookline/Boston, section-split result, and MA-GEO-01/MA-GEO-02 closure

## Decisions Made

- **Verification-only phase:** Research confirmed all 293 rows were loaded in v5.0 (2026-05-19). Re-running the loader would silently skip via ON CONFLICT DO NOTHING and give a false sense of "loading" — assert instead.
- **Section-split direction:** The correct check is `geofence NOT IN districts` for district-backed mtfcc types. The reverse direction (`districts NOT IN geofence`) yields ~7 expected rows for statewide STATE_EXEC/NATIONAL_UPPER districts — those have no polygon by design and are NOT a failure signal.
- **G4040 districts join must be state-scoped:** The unscoped join returns 54 rows from Indiana CCDs (which are also G4040 mtfcc and do write district rows). Filtering to state='25' confirms MA COUSUB writes 0 district rows as designed.

## Deviations from Plan

None — plan executed exactly as written. All 4 success criteria verified against production; VERIFICATION.md created with all required sections.

## Issues Encountered

- `npx tsx` was not recognized on Windows PATH (tsx is installed under node_modules but not in a .bin directory accessible to PATH). Resolved by calling `node node_modules/tsx/dist/cli.mjs` directly — both the smoke test and all Node pg queries executed successfully without issue.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Phase 108 (Boston Deep Seed): Fully unblocked. Boston geo_id='2507000' routes via G4110 confirmed. All G5200/G5210/G5220 tiers are present for Boston address routing. Officials seeding can proceed.
- Phase 109 (MA Tier 2 Cities): Unblocked. G4040 layer provides routing for all 293 towns; Tier 2 cities (Worcester, Springfield, Lowell, Brockton, Quincy) are G4110 cities already in the layer.
- Phase 110 (MA Elections): Unblocked. 40 G5210 state senate districts + 160 G5220 state house districts confirmed present.

---
*Phase: 107-ma-town-geofences*
*Completed: 2026-06-10*
