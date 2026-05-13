---
phase: 34-mini-compass-tile-component
plan: 02
subsystem: ui
tags: [react, radar-chart, compass, ev-ui, mini-compass, elections]

# Dependency graph
requires:
  - phase: 34-01
    provides: computeDisplaySpokes() and buildAnswerMapByShortTitle() pure functions in src/lib/compass.js
provides:
  - MiniCompass presentational component (src/components/MiniCompass.jsx)
  - Label-free RadarChartCore wrapper with silent absence gate and replacement-spoke opacity distinction
affects:
  - 34-03 (ElectionsView wiring — drops MiniCompass into candidate tiles)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "INNER_SVG_SIZE=200 with CSS-constrained container: RadarChartCore receives 200 internally but parent div is constrained to `size` (120px default) — avoids SVG foreignObject/hit-dot geometry distortion at small sizes"
    - "labelFontSize=0 as the sole label-suppression mechanism (no showLabels prop on RadarChartCore)"
    - "tightFit=true required for mini size — without it horizontal-cluster spokes cause excessive vertical whitespace"
    - "Container opacity 0.7 for Lens-ON replacement spokes — visual signal without text labels"

key-files:
  created:
    - src/components/MiniCompass.jsx
  modified: []

key-decisions:
  - "INNER_SVG_SIZE=200 not 120 — RadarChartCore foreignObjects (190px wide) and hit-dots (r=14) don't scale with size prop; CSS-constraining the outer container achieves the visual scaling without distorting SVG geometry"
  - "Silent absence (return null) — no placeholder, no spinner, no error UI when fewer than 3 bilateral spokes available"
  - "Container opacity 0.7 only when (hasReplacedSpokes && localLensActive) — when Lens is OFF, replacement spokes are normal user-selected fallbacks requiring no visual distinction"
  - "overflow:hidden added to container div to prevent SVG bleed beyond circular clip area"

patterns-established:
  - "MiniCompass prop contract: userAnswers, polAnswers, selectedTopics, scopedTopics, invertedSpokes, localLensActive, isDark, size=120"
  - "All spoke computation via useMemo — no redundant recalculation on parent re-renders"

# Metrics
duration: 5min
completed: 2026-05-13
---

# Phase 34 Plan 02: MiniCompass Component Summary

**Label-free RadarChartCore tile with INNER_SVG_SIZE=200/CSS-container-120 scaling, silent absence gate at <3 spokes, and Lens-ON replacement opacity signal**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-13T00:30:02Z
- **Completed:** 2026-05-13T00:35:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `src/components/MiniCompass.jsx` — pure-presentational component requiring no internal state or data fetching
- Implemented silent absence: returns null when `computeDisplaySpokes()` yields fewer than 3 bilateral spokes
- Applied INNER_SVG_SIZE=200 with CSS-constrained outer container (default 120px) to prevent RadarChartCore geometry distortion at small sizes
- Container opacity drops to 0.7 when Lens is ON and replacement spokes are present — subtle visual signal that local data is thin

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/components/MiniCompass.jsx** - `b14d0ec` (feat)

**Plan metadata:** (pending this commit)

## Files Created/Modified

- `src/components/MiniCompass.jsx` — Label-free mini radar chart component; consumes `computeDisplaySpokes()` + `buildAnswerMapByShortTitle()`; renders null when insufficient spokes

## Decisions Made

**INNER_SVG_SIZE=200, not 120:** RadarChartCore renders tooltip foreignObjects at 190px width and hit-dots at r=14, neither of which scales with the `size` prop. At size=120 these elements dominate the chart area. The fix is to pass size=200 (normal internal SVG coordinate space) and let the CSS outer container (120px) perform the visual shrink via flex layout. This is a known pitfall documented in the 34-RESEARCH.md.

**overflow:hidden on container:** Added beyond the plan spec — required to prevent the 200px SVG from visually bleeding outside the 120px circular container on browsers that don't clip flex children.

**Silent absence (return null):** When hasEnoughSpokes is false, no placeholder div, no spinner, no text — the component simply does not render. This is the CONTEXT.md-required behavior: "silently absent when <3 total bilateral answers exist."

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added overflow:hidden to container div**

- **Found during:** Task 1 review
- **Issue:** The 200px SVG inside a 120px flex container will visually overflow the circular border on most browsers without explicit clipping
- **Fix:** Added `overflow: 'hidden'` to the outer container style
- **Files modified:** src/components/MiniCompass.jsx
- **Verification:** Build passes; SVG bleed visually contained
- **Committed in:** b14d0ec (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** overflow:hidden is a required CSS property for correctness of the circular clip — no scope creep.

## Issues Encountered

None. Build passed on first attempt. All verification checks confirmed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `MiniCompass` component is complete and export-ready
- Plan 34-03 can import `MiniCompass` from `../components/MiniCompass` and drop it into ElectionsView candidate tiles
- Parent (ElectionsView) is responsible for: fetching `polAnswers` per politician, deriving `scopedTopics` from `allTopics` + districtScope, and passing `userAnswers`/`selectedTopics`/`invertedSpokes`/`localLensActive`/`isDark` from CompassContext

---
*Phase: 34-mini-compass-tile-component*
*Completed: 2026-05-13*
