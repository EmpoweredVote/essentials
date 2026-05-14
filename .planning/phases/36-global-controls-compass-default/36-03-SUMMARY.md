---
phase: 36-global-controls-compass-default
plan: 03
subsystem: ui
tags: [react, compass, controls-bar, refactor, results-page, component-extraction]

# Dependency graph
requires:
  - phase: 36-01
    provides: CompassControlsBar.jsx reusable component (shared sticky controls bar)
  - phase: 36-02
    provides: Elections.jsx already consuming CompassControlsBar (parity baseline)
provides:
  - Results.jsx consuming CompassControlsBar instead of ~50 lines of duplicated inline markup
  - Cross-page compass controls parity between /elections and /results?view=elections (DEFAULT-05)
  - CTRL-01 + CTRL-02 satisfied: single source of truth for all compass controls across both pages
affects: [phase-37, any-future-results-page-work, compass-controls-evolution]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Shared CompassControlsBar component consumed by both Elections.jsx and Results.jsx — single source of truth for sticky compass controls"
    - "Controls block positioned OUTSIDE activeView ternary so it shows on both Representatives and Elections tabs"
    - "Render condition compassMode && (activeQuery || browseResults) preserves empty-state guard in Results (unlike Elections.jsx which gates on data load)"

key-files:
  created: []
  modified:
    - src/pages/Results.jsx

key-decisions:
  - "Kept controls block OUTSIDE the activeView ternary — critical position for dual-tab coverage (RESEARCH.md Pitfall 4)"
  - "Preserved (activeQuery || browseResults) guard — Results page empty-state differs from Elections.jsx which uses just compassMode"
  - "Removed CompassKey import from Results.jsx after deletion of inline block (was unused after refactor)"
  - "Min/Max buttons updated from text symbols (⊟/⊞) to Heroicon SVGs in CompassControlsBar.jsx (commit 77b3d77, orchestrator-applied)"

patterns-established:
  - "Results.jsx controls position: sticky bar lives OUTSIDE activeView ternary to cover all tabs simultaneously"
  - "CompassControlsBar prop contract: userAnswers, localLensActive, toggleLocalLens, judicialLensActive, toggleJudicialLens, onStanceMin, onStanceMax, isDesktop"

# Metrics
duration: 30min
completed: 2026-05-14
---

# Phase 36 Plan 03: Results.jsx CompassControlsBar Wiring Summary

**Results.jsx inline sticky controls block (~50 lines) replaced with shared CompassControlsBar component; dual-tab parity (Representatives + Elections) verified across 6 human tests**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-14
- **Completed:** 2026-05-14
- **Tasks:** 1 auto + 1 checkpoint (approved)
- **Files modified:** 1 (Results.jsx)

## Accomplishments

- Deleted ~50-line duplicated inline sticky controls block from Results.jsx and replaced with a single `<CompassControlsBar />` call
- Verified that the controls bar shows on BOTH the Representatives tab and the Elections tab (critical positioning outside the activeView ternary)
- Established DEFAULT-05 cross-page parity: /elections and /results?view=elections now show identical compass controls bar
- All 6 human verification tests passed (Representatives tab, Elections tab parity, /elections vs /results?view=elections parity, persistence, uncalibrated user regression, marginBottom -70 scroll behavior)
- Orchestrator separately updated Min/Max button icons in CompassControlsBar.jsx from text symbols to Heroicon SVGs (commit 77b3d77), matching compass.empowered.vote styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace inline sticky controls bar in Results.jsx with CompassControlsBar** - `27d8385` (feat)
2. **Orchestrator: Replace text symbols with Heroicon SVGs for Min/Max buttons** - `77b3d77` (fix, applied to CompassControlsBar.jsx directly)

## Files Created/Modified

- `src/pages/Results.jsx` - Inline sticky controls block (~50 lines) deleted; `<CompassControlsBar />` rendered in its place with `compassMode && (activeQuery || browseResults)` guard; `CompassKey` import removed (no longer used after refactor)

## Decisions Made

- Controls block kept OUTSIDE the `activeView === 'representatives' ? (...) : (...)` ternary — this is the load-bearing position that allows the bar to appear on both the Representatives and Elections tabs simultaneously (RESEARCH.md Pitfall 4)
- `(activeQuery || browseResults)` guard preserved — Results.jsx empty-state differs from Elections.jsx (Elections already gates on `electionsData` load; Results page has an empty landing state that the guard prevents the bar from appearing on)
- `CompassKey` removed from Results.jsx imports after the inline block (its only consumer) was deleted
- Min/Max Heroicon SVG update (77b3d77): orchestrator-applied directly to the shared CompassControlsBar.jsx so both /elections and /results benefit simultaneously

## Deviations from Plan

None - plan executed exactly as written. The orchestrator's Heroicon SVG update (77b3d77) was applied to the shared component, not Results.jsx, and was committed separately outside this plan's task scope.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CTRL-01 + CTRL-02 satisfied: CompassControlsBar is now the single source of truth for sticky compass controls on both /elections and /results
- DEFAULT-02, DEFAULT-03, DEFAULT-05 all satisfied (auto-enable preserved, dual-tab parity confirmed)
- Phase 36 plan sequence complete for the controls bar extraction work
- Remaining Phase 36 plans (if any) can proceed — no blockers

---
*Phase: 36-global-controls-compass-default*
*Completed: 2026-05-14*
