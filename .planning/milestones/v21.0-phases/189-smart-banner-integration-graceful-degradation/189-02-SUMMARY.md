---
phase: 189-smart-banner-integration-graceful-degradation
plan: 02
subsystem: ui
tags: [react, banner, refactor, integration]

# Dependency graph
requires:
  - phase: 189-01
    provides: "Pure buildBannerProps(tier, ctx) helper (src/lib/bannerProps.js)"
provides:
  - "Both Results.jsx and ElectionsView.jsx render all 3 banner tiers via buildBannerProps(tier, bannerCtx) one-liners"
  - "Zero page-specific divergence in banner prop assembly (STATE_NAMES/stateNames unified via bannerCtx)"
affects: [189-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "bannerCtx useMemo per page, referentially stable, feeding buildBannerProps at each of the 3 tier call sites"
    - "Hook-ordering constraint: bannerCtx useMemo must be placed before any conditional early return (ElectionsView has loading/null/empty early returns)"

key-files:
  created: []
  modified:
    - src/pages/Results.jsx
    - src/components/ElectionsView.jsx

key-decisions:
  - "ElectionsView's bannerCtx useMemo placed immediately after the processedElections useMemo (before the loading/null/empty early returns), not near the JSX render block as originally sketched, to satisfy react-hooks/rules-of-hooks (hooks cannot be called after an early return)"

patterns-established: []

requirements-completed: [SBAN-01, SBAN-02]

# Metrics
duration: 12min
completed: 2026-07-08
---

# Phase 189 Plan 02: Wire Results.jsx + ElectionsView.jsx Through buildBannerProps Summary

**Replaced all 6 hand-assembled `<SectionBanner>` call sites (3 per page) with uniform `buildBannerProps(tier, bannerCtx)` one-liners, closing the last page-specific prop-assembly divergence between Results and Elections banners.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-08T15:38:00Z
- **Completed:** 2026-07-08T15:50:00Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- `src/pages/Results.jsx`: added a `bannerCtx` `useMemo` (`{ representingCity, userState, stateNames: STATE_NAMES, buildingImageMap, featureIconMap, populationMap }`), replaced the 3 `tier === 'Local'/'State'/'Federal'` hand-assembled `<SectionBanner>` branches with `<SectionBanner {...buildBannerProps('city'|'state'|'federal', bannerCtx)} />`
- `src/components/ElectionsView.jsx`: added an identical-shape `bannerCtx` `useMemo` using ElectionsView's own destructured prop names (`stateNames`, not `STATE_NAMES` — literal drop-in, no renaming), replaced its 3 hand-assembled `<SectionBanner>` branches the same way
- Both pages now feed the same `buildBannerProps` function with equivalent `ctx` shapes — the previous `STATE_NAMES[userState]` vs `stateNames?.[userState]` variable-name divergence is gone; `locationName` construction lives in exactly one place (`bannerProps.js`, Wave 1)
- `npm run lint`: identical error/warning set to the pre-existing baseline (0 new errors/warnings introduced by this plan's edits)
- `npm test`: 119/119 tests passing (full suite, unchanged from Wave 1's baseline — no test file changes needed since `buildBannerProps` itself was already covered in Wave 1)

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire Results.jsx through buildBannerProps**
   - `56b9d5a1` (refactor) — bannerCtx useMemo + 3 call sites replaced
2. **Task 2: Wire ElectionsView.jsx through buildBannerProps**
   - `42aab1c0` (refactor) — bannerCtx useMemo + 3 call sites replaced

## Files Created/Modified
- `src/pages/Results.jsx` — `bannerCtx` useMemo added after the `populationMap` useMemo; 3 `<SectionBanner>` tier branches now one-liners
- `src/components/ElectionsView.jsx` — `bannerCtx` useMemo added after `processedElections` (before the component's early returns); 3 `<SectionBanner>` tier branches now one-liners

## Decisions Made
- **[Rule 1 - Bug] ElectionsView `bannerCtx` placement moved above early returns.** The plan's illustrative code sketch placed `bannerCtx` near the render block (after the loading/null/empty-state early returns), but `ElectionsView` has three conditional `return` statements (loading skeleton, `elections === null`, `elections.length === 0`) before that point. A `useMemo` call after those returns violates `react-hooks/rules-of-hooks` (hooks must run in the same order every render) and `npm run lint` caught it immediately as a NEW error not present in the baseline. Fixed by placing the `bannerCtx` useMemo immediately after the existing `processedElections` useMemo — before any early return — matching the ordering of all of ElectionsView's other hooks. Verified: lint now shows the identical error set as the pre-change baseline (0 new errors), and `npm test` remains 119/119 green.
  - **Found during:** Task 2
  - **Fix:** Moved the `useMemo` block up ~14 lines, before the `if (loading)` early return
  - **Files modified:** `src/components/ElectionsView.jsx`
  - **Commit:** `42aab1c0`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed conditional hook call in ElectionsView.jsx**
- **Found during:** Task 2 (`npm run lint` verification step)
- **Issue:** Placing the `bannerCtx` `useMemo` where the plan's illustrative sketch suggested (near the render return) put it after 3 early `return` statements, triggering `react-hooks/rules-of-hooks` — a real bug that would produce a runtime warning/inconsistent hook order across renders (e.g. between a loading render and a loaded render).
- **Fix:** Relocated the `useMemo` to before all early returns, immediately after the existing `processedElections` useMemo, alongside ElectionsView's other top-level hooks.
- **Files modified:** `src/components/ElectionsView.jsx`
- **Commit:** `42aab1c0`

## Issues Encountered
None beyond the auto-fixed hook-ordering issue documented above.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Both `Results.jsx` and `ElectionsView.jsx` are now literal drop-ins over `buildBannerProps`, with zero page-specific divergence in banner prop assembly (SBAN-01, SBAN-02 satisfied).
- No remaining inline `locationName=`, `stats={populationMap.`, `imageUrl={buildingImageMap.`, or `featureIcons={featureIconMap.` at either page's `<SectionBanner>` call sites (grep-verified clean).
- Full test suite green (119/119); lint shows only pre-existing baseline issues, none introduced by this plan.
- Ready for 189-03 (empty-state / graceful-degradation verification, SBAN-04).

---
*Phase: 189-smart-banner-integration-graceful-degradation*
*Completed: 2026-07-08*

## Self-Check: PASSED

Verified both modified files exist and both commit hashes (`56b9d5a1`, `42aab1c0`) are present in `git log --oneline`.
