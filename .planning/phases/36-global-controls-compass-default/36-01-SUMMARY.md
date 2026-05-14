---
phase: 36-global-controls-compass-default
plan: 01
subsystem: ui
tags: [react, jsx, compass, ev-ui, CompassKey, stance-btn]

# Dependency graph
requires:
  - phase: 34-mini-compass-tile
    provides: MiniCompass + CompassKey from ev-ui already integrated
  - phase: 33-local-lens
    provides: localLensActive, judicialLensActive, toggleLocalLens, toggleJudicialLens in CompassContext
provides:
  - src/components/CompassControlsBar.jsx — shared sticky controls bar component
affects:
  - 36-02 (Elections.jsx consumer wiring)
  - 36-03 (Results.jsx consumer wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure presentational extraction: inline JSX blocks extracted to named component, all state/handlers passed as props — zero internal hooks"
    - "Defensive stance-button guard: showStanceButtons = (userAnswers?.length ?? 0) >= 3 (Results.jsx pattern preferred over Elections.jsx unconditional render)"
    - "marginBottom: -70 load-bearing sticky overlay pattern: must not be removed (RESEARCH.md Pitfall 3)"

key-files:
  created:
    - src/components/CompassControlsBar.jsx
  modified: []

key-decisions:
  - "Used Results.jsx threshold pattern (>= 3) not Elections.jsx (unconditional) — more defensive against compassMode=true with empty userAnswers edge case"
  - "No compassMode prop on the component — parent decides whether to render the bar; component is purely about layout/content"
  - "No CALIBRATION_THRESHOLD constant introduced — threshold decision left open per RESEARCH.md Open Question 1; Plan 36-02 will address Elections.jsx threshold"

patterns-established:
  - "CompassControlsBar prop contract: userAnswers, localLensActive, toggleLocalLens, judicialLensActive, toggleJudicialLens, onStanceMin, onStanceMax, isDesktop"

# Metrics
duration: 2min
completed: 2026-05-14
---

# Phase 36 Plan 01: Global Controls Bar Extraction Summary

**Reusable `CompassControlsBar` component extracted from duplicated inline JSX in Elections.jsx and Results.jsx — pure presentational, all state via props, build passing**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-14T16:30:53Z
- **Completed:** 2026-05-14T16:32:04Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `src/components/CompassControlsBar.jsx` — 62-line pure presentational component
- Reproduced exact sticky overlay markup from Elections.jsx lines 226-271 and Results.jsx lines 1526-1575
- Used Results.jsx's defensive `userAnswers.length >= 3` guard (not Elections.jsx's unconditional button render)
- Preserved `marginBottom: -70` load-bearing style intact
- Build passes clean (pre-existing chunk/dynamic-import warnings unrelated to this change)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CompassControlsBar.jsx with extracted markup** - `a287283` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `src/components/CompassControlsBar.jsx` — Shared sticky controls bar: Local Lens, Judicial Lens, Stance Min/Max buttons + CompassKey legend pill

## Decisions Made
- Adopted Results.jsx threshold pattern (`>= 3`) over Elections.jsx's unconditional render — Elections.jsx already gates the entire bar on `compassMode`, but Results.jsx gates the bar on both `compassMode && (activeQuery || browseResults)` and additionally gates the stance buttons on answer count. The more defensive pattern is safer for the shared component.
- No `compassMode` prop on the component — the parent decides whether to render `<CompassControlsBar>` at all; the component handles nothing about visibility logic.
- No `CALIBRATION_THRESHOLD` constant introduced — RESEARCH.md Open Question 1 left the 1 vs 3 threshold decision open; `>= 3` hard-coded to match existing behavior; Plan 36-02 will revisit for Elections.jsx parity.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `CompassControlsBar` is ready for Plans 36-02 and 36-03 to import and wire
- Elections.jsx consumer (36-02): replace lines 226-271 with `<CompassControlsBar>`, passing `handleStanceMin`/`handleStanceMax` as `onStanceMin`/`onStanceMax`
- Results.jsx consumer (36-03): replace lines 1526-1575 with `<CompassControlsBar>`, passing `rawUserAnswers` as `userAnswers`
- No blockers — build clean, component unconsumed until 36-02/36-03

---
*Phase: 36-global-controls-compass-default*
*Completed: 2026-05-14*
