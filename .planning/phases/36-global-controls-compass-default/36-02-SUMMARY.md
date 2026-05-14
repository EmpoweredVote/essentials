---
phase: 36-global-controls-compass-default
plan: 02
subsystem: ui
tags: [react, jsx, compass, localStorage, Elections, CompassControlsBar, auto-enable]

# Dependency graph
requires:
  - phase: 36-01
    provides: CompassControlsBar.jsx shared component ready for consumption
  - phase: 34-mini-compass-tile
    provides: MiniCompass tiles rendered on candidate cards in Elections.jsx
provides:
  - Elections.jsx with stateful compassMode backed by localStorage auto-enable pattern
  - Compass toggle checkbox in Elections filter controls row
  - CompassControlsBar consumption in Elections.jsx (inline 47-line block removed)
affects:
  - 36-03 (Results.jsx — same pattern already applied there as reference)
  - Any future plan touching Elections.jsx compassMode or filter controls row

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localStorage null-check auto-enable: getItem === null triggers setCompassMode(true) + setItem('true'); explicit 'false' suppresses re-enable on reload"
    - "handleCompassModeChange: single handler for checkbox onChange — writes localStorage + calls enableCompass() on enable; matches Results.jsx shape"
    - "useEffect calibration guard: early return if userAnswers.length < 3 before localStorage null-check"

key-files:
  created: []
  modified:
    - src/pages/Elections.jsx
    - src/components/CompassControlsBar.jsx

key-decisions:
  - "Kept >= 3 calibration threshold (not >= 1) — changing both pages together is a product decision outside this plan's scope; Results.jsx already uses >= 3"
  - "Compass checkbox not gated on userAnswers.length — uncalibrated users may check it; ElectionsView just shows no mini compasses until they have answers"
  - "77b3d77 (post-checkpoint) replaced ⊟/⊞ text symbols with Heroicon SVGs in CompassControlsBar.jsx — committed directly to shared component by orchestrator"

patterns-established:
  - "localStorage null-check auto-enable pattern: now used in both Elections.jsx and Results.jsx — canonical reference for future pages"

# Metrics
duration: ~45min (including human checkpoint)
completed: 2026-05-14
---

# Phase 36 Plan 02: Elections Compass-Default + Controls Bar Wiring Summary

**Elections.jsx compassMode refactored from pure derivation to localStorage-backed stateful auto-enable; inline 47-line controls block replaced by `<CompassControlsBar />`; Compass checkbox added to filter row**

## Performance

- **Duration:** ~45 min (including human checkpoint with 5 tests)
- **Started:** 2026-05-14T16:32:00Z
- **Completed:** 2026-05-14T18:17:00Z
- **Tasks:** 2 + checkpoint
- **Files modified:** 2 (Elections.jsx, CompassControlsBar.jsx)

## Accomplishments
- Replaced `const compassMode = (userAnswers?.length ?? 0) >= 3` (pure derivation) with `useState` initializer reading `ev:compassMode` from localStorage
- Added `handleCompassModeChange` writing to localStorage + calling `enableCompass()` when toggled on
- Added auto-enable `useEffect`: calibrated users (>= 3 answers) landing on /elections for the first time see compass tiles immediately — `ev:compassMode` key absent triggers auto-enable; explicit `'false'` suppresses re-enable (DEFAULT-01 satisfied)
- Added Compass checkbox to the filter controls row alongside "Hide withdrawn candidates" (always visible; uncalibrated users see it but no compasses render until calibrated)
- Replaced the 47-line inline sticky controls block with `<CompassControlsBar />` (4 lines); removed now-unused `CompassKey` from ev-ui import
- Post-checkpoint: orchestrator updated `CompassControlsBar.jsx` (`77b3d77`) to replace ⊟/⊞ text symbols with Heroicon SVGs (arrows-pointing-in / arrows-pointing-out) matching compass.empowered.vote

## Task Commits

Each task was committed atomically:

1. **Task 1: Refactor compassMode to stateful + localStorage null-check pattern** - `052fd81` (feat)
2. **Task 2: Add compass toggle checkbox + replace inline controls bar with CompassControlsBar** - `a088139` (feat)
3. **Post-checkpoint (orchestrator): Replace text symbols with Heroicon SVGs for Min/Max buttons** - `77b3d77` (fix)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `src/pages/Elections.jsx` — compassMode refactored to useState + localStorage; handleCompassModeChange added; auto-enable useEffect added; Compass checkbox in filter row; inline controls block replaced by `<CompassControlsBar />`; CompassKey removed from ev-ui import
- `src/components/CompassControlsBar.jsx` — ⊟/⊞ text symbols replaced with Heroicon SVG icons (arrows-pointing-in / arrows-pointing-out)

## Decisions Made
- Kept `>= 3` calibration threshold (not `>= 1`) — Results.jsx uses `>= 3`; changing both pages together is a product decision; RESEARCH.md Open Question 1 left it open; changing Elections.jsx alone would create inconsistency.
- Compass checkbox not gated on `userAnswers.length` — any user can check it; the component just renders no mini compasses until they have stances to display.
- Post-checkpoint Heroicon fix applied to shared `CompassControlsBar.jsx` rather than to Elections.jsx alone — the shared component is the single source of truth for Min/Max button rendering.

## Deviations from Plan

### Auto-fixed Issues

None during task execution — plan executed exactly as written for Tasks 1 and 2.

### Post-Checkpoint Change (Orchestrator)

**[External] Heroicon SVGs for Min/Max buttons in CompassControlsBar.jsx**
- **When:** After human checkpoint approval
- **Change:** Replaced ⊟/⊞ Unicode text symbols with proper Heroicon SVG paths (arrows-pointing-in / arrows-pointing-out) matching the compass.empowered.vote UI
- **Files modified:** `src/components/CompassControlsBar.jsx`
- **Committed in:** `77b3d77` (by orchestrator, directly to shared component)

## Issues Encountered
None during planned task execution. Human checkpoint passed all 5 tests on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Elections.jsx is fully wired with stateful compassMode, toggle checkbox, and CompassControlsBar
- Plan 36-03 (Results.jsx) has already been completed (`27d8385`) — Results.jsx also consumes CompassControlsBar
- CompassControlsBar.jsx now uses Heroicon SVGs for Min/Max — both consumers (Elections + Results) get the fix automatically
- Phase 36 is complete (all 3 plans done)

---
*Phase: 36-global-controls-compass-default*
*Completed: 2026-05-14*
