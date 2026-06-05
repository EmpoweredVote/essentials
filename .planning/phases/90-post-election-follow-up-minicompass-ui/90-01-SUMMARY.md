---
phase: 90-post-election-follow-up-minicompass-ui
plan: 01
subsystem: ui
tags: [ev-ui, react, svg, npm, github-actions, radar-chart, compass]

# Dependency graph
requires:
  - phase: 36-compass-experience
    provides: MiniCompass.jsx component that consumes RadarChartCore from ev-ui
provides:
  - "@empoweredvote/ev-ui@0.9.3 published to npm with dotRadius prop on RadarChartCore"
  - "dotRadius prop (default=5) for both user and compare dot circles in RadarChartCore"
affects: [90-02-minicompass-ui-wiring, any consumer of @empoweredvote/ev-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ev-ui re-clone pattern: C:/ev-ui/ev-ui-main.stale-X.Y.Z.bak preserves prior state; git clone https://github.com/EmpoweredVote/ev-ui.git ev-ui-main"
    - "dotRadius prop as multiplier ratio: r={matches ? dotRadius * (8/7) : dotRadius} preserves matched/unmatched visual distinction"
    - "OIDC trusted publishing via GitHub Actions publish.yml on v*.*.* tag push — no OTP needed"

key-files:
  created: []
  modified:
    - "C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx"
    - "C:/ev-ui/ev-ui-main/package.json"

key-decisions:
  - "Combined showLabels (already in 0.9.2) and dotRadius (new) into single ev-ui 0.9.3 release to avoid intermediate broken state"
  - "Used r={matches ? dotRadius * (8/7) : dotRadius} ratio to preserve 0.9.2 matched/unmatched visual distinction (8:7 ratio)"
  - "Default dotRadius=5 so existing callers are unaffected; MiniCompass will pass dotRadius={2.5}"

patterns-established:
  - "ev-ui prop-addition pattern: add to destructured props with default → use in both user-dot and compare-dot circle elements → verify with grep -c dotRadius dist/index.mjs >= 1"

requirements-completed: [UI-01]

# Metrics
duration: 10min
completed: 2026-06-05
---

# Phase 90 Plan 01: ev-ui dotRadius Prop + npm Publish Summary

**@empoweredvote/ev-ui@0.9.3 published with configurable dotRadius prop (default=5) on RadarChartCore, enabling MiniCompass to pass dotRadius={2.5} for ~50% smaller dots**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-05T00:21:00Z
- **Completed:** 2026-06-05T00:31:28Z
- **Tasks:** 3
- **Files modified:** 2 (in ev-ui repo)

## Accomplishments
- Refreshed stale C:/ev-ui/ev-ui-main (0.8.12) to 0.9.2 via fresh git clone; prior state preserved as C:/ev-ui/ev-ui-main.stale-0.8.12.bak
- Added `dotRadius = 5` prop to RadarChartCore.jsx; both user dot and compare dot now use `r={matches ? dotRadius * (8/7) : dotRadius}`
- Bumped package.json to 0.9.3, committed, pushed tag v0.9.3 — CI published to npm; `npm view @empoweredvote/ev-ui version` returns `0.9.3`

## Task Commits

Each task was committed atomically (all changes are in the ev-ui repo, not the essentials repo):

1. **Task 1: Refresh local ev-ui clone to 0.9.2 codebase** - git clone to C:/ev-ui/ev-ui-main (no essentials commit)
2. **Task 2: Add dotRadius prop to RadarChartCore and bump version** - (staged for commit in Task 3)
3. **Task 3: Commit, tag, and push to publish via CI** - `ff03db4` in ev-ui repo (feat)

**ev-ui commit:** `ff03db4505c2f220796c2f98564b939c94a0e1bf` — `feat(RadarChartCore): add dotRadius prop for compact contexts (MiniCompass)`
**Tag:** `v0.9.3` pushed to `https://github.com/EmpoweredVote/ev-ui`
**npm:** `@empoweredvote/ev-ui@0.9.3` — verified via `npm view @empoweredvote/ev-ui version` returning `0.9.3` at 2026-06-05T00:31:00Z

## Files Created/Modified
- `C:/ev-ui/ev-ui-main/src/RadarChartCore.jsx` - Added `dotRadius = 5` prop; both dot circles now use `r={matches ? dotRadius * (8/7) : dotRadius}`
- `C:/ev-ui/ev-ui-main/package.json` - Version bumped from 0.9.2 to 0.9.3

## Decisions Made
- Combined the dotRadius prop addition and version bump into a single commit + 0.9.3 release (rather than separate PRs) since showLabels was already in 0.9.2 and there was no reason to split the work
- Used `dotRadius * (8/7)` ratio for matched dots to preserve the visual distinction already present in 0.9.2 (r=8 matched vs r=7 unmatched)
- Default `dotRadius = 5` chosen so all existing callers of RadarChartCore (CompassCard, full-size compass views) are completely unaffected — only MiniCompass will pass a smaller value

## Deviations from Plan

None - plan executed exactly as written. The local ev-ui-main was at 0.8.12 as predicted (Pitfall 5 confirmed). The re-clone approach worked as specified.

## Issues Encountered

- The plan mentioned the `ringColor` prop in the target MiniCompass.jsx call (RESEARCH.md Code Examples), but RadarChartCore.jsx in 0.9.2 has no `ringColor` prop — it uses `isDark` from `useTheme()` hook internally. This is not a blocker for Plan 90-01 (which only touches ev-ui). Plan 90-02 will handle the MiniCompass.jsx call site changes.
- GitHub Actions CI completed publish nearly instantly — `npm view @empoweredvote/ev-ui version` returned `0.9.3` within seconds of the tag push.

## User Setup Required

None - no external service configuration required. CI published to npm automatically via OIDC trusted publishing.

## Next Phase Readiness

- Plan 90-02 can now run `npm install @empoweredvote/ev-ui@^0.9.3` in the essentials repo and wire `dotRadius={2.5}` + `showLabels={false}` in MiniCompass.jsx
- The `dotRadius` prop is live in the npm registry and available immediately
- No blockers or concerns for Plan 90-02

---
*Phase: 90-post-election-follow-up-minicompass-ui*
*Completed: 2026-06-05*
