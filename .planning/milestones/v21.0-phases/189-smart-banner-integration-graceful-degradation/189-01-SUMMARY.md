---
phase: 189-smart-banner-integration-graceful-degradation
plan: 01
subsystem: ui
tags: [react, banner, refactor, vitest]

# Dependency graph
requires:
  - phase: 187-tethered-feature-icon-row
    provides: featureIconMap resolution + featureIcons?.length guard (now shouldRenderIcons)
  - phase: 188-location-stats-strip
    provides: populationMap resolution + shouldRenderStat guard + top-right stat scrim (now repositioned)
provides:
  - Pure buildBannerProps(tier, ctx) prop-assembly helper (src/lib/bannerProps.js) with TIER_TO_MAP_KEY bridge
  - Unified locationName construction (folds STATE_NAMES/stateNames divergence into one function)
  - D-05 mid-left population stat scrim reposition in SectionBanner.jsx
  - Exported, unit-tested shouldRenderIcons predicate (twin of shouldRenderStat)
affects: [189-02, 189-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure prop-assembly helper composing already-resolved maps (no re-fetch/re-resolve), mirroring resolvePopulation/resolveFeatureIcons convention"
    - "TIER_TO_MAP_KEY lookup bridges lowercase component prop values to capitalized map keys once, at the single assembly point"

key-files:
  created:
    - src/lib/bannerProps.js
    - src/lib/bannerProps.test.js
  modified:
    - src/components/SectionBanner.jsx
    - src/components/SectionBanner.test.js

key-decisions:
  - "buildBannerProps folds locationName construction in (not just the 3 named maps) to fully close SBAN-03's single-source-of-truth gap per RESEARCH guidance"
  - "D-05 reposition implemented via an outer Tailwind-class wrapper (className) around the existing inline-style stats div, since inline styles cannot express the md: breakpoint needed for the responsive vertical anchor"
  - "shouldRenderIcons extracted as an exported pure predicate to close Open Question 2 from RESEARCH, strengthening SBAN-04's empty-state proof with direct unit coverage"

patterns-established:
  - "Pattern 1: buildBannerProps(tier, ctx) — single pure function assembling all SectionBanner props per tier from already-centralized maps"

requirements-completed: [SBAN-03, SBAN-04]

# Metrics
duration: 6min
completed: 2026-07-08
---

# Phase 189 Plan 01: Banner Prop-Assembly Helper + Stat Reposition Summary

**Pure buildBannerProps(tier, ctx) helper unifying all 6 SectionBanner call-site prop assembly, plus D-05 mid-left population-stat reposition and an exported shouldRenderIcons predicate.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-07-08T08:36:00-07:00
- **Completed:** 2026-07-08T08:39:21-07:00
- **Tasks:** 2 completed
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- `src/lib/bannerProps.js` — pure `buildBannerProps(tier, ctx)` assembling `{tier, locationName, imageUrl, featureIcons, stats}` from already-resolved maps, bridging lowercase `tier` to capitalized `Local/State/Federal` map keys via `TIER_TO_MAP_KEY`, and folding the previously-duplicated `locationName` logic into one place
- `SectionBanner.jsx` D-05 reposition: population stat scrim moved from top-right to responsive mid-left (`top-4` mobile, `md:top-1/2 md:-translate-y-1/2` desktop), left-aligned to the title margin via shared `px-6 md:px-12` padding, `alignItems` flipped `flex-end` -> `flex-start`; all 188 scrim tokens (background/blur/radius/padding) and the `shouldRenderStat` guard preserved unchanged
- Extracted `shouldRenderIcons(featureIcons)` as an exported, directly unit-tested predicate; replaced the inline `featureIcons?.length > 0 &&` render guard

## Task Commits

Each task was committed atomically (Task 1 followed TDD RED/GREEN):

1. **Task 1: Create the pure buildBannerProps helper + unit tests**
   - `b2e2b969` (test) — RED: 5-case failing test suite against a not-yet-existing module
   - `db6c28e7` (feat) — GREEN: implementation, all 5 tests pass
2. **Task 2: Reposition stat scrim to mid-left (D-05) + extract shouldRenderIcons predicate** - `0a7d2de6` (feat)

## Files Created/Modified
- `src/lib/bannerProps.js` - Pure `buildBannerProps(tier, ctx)` prop-assembly helper (no React import)
- `src/lib/bannerProps.test.js` - 5-case Vitest suite (all 3 tiers, stateNames fallback, empty-ctx tolerance)
- `src/components/SectionBanner.jsx` - D-05 stat reposition + exported `shouldRenderIcons`
- `src/components/SectionBanner.test.js` - Extended with a 5-case `shouldRenderIcons` describe block

## Decisions Made
- `buildBannerProps`'s `ctx` parameter is a superset of the "maps" shorthand in D-01 (also carries `representingCity`/`userState`/`stateNames`) so `locationName` construction has exactly one owner — matches 189-RESEARCH.md's explicit guidance on closing the last SBAN-03 divergence gap.
- The D-05 positioning wrapper uses a Tailwind `className` (the only such usage introduced into this otherwise all-inline-style component) because inline `style` objects cannot express a `md:` breakpoint-conditional `top` value — this exactly matches the plan's/CONTEXT's own prescribed prototype approach, not an improvised deviation.

## Deviations from Plan

None - plan executed exactly as written. Task 2's `shouldRenderIcons` extraction was already explicitly scoped in the plan (not an unplanned addition).

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `buildBannerProps` is ready for Wave 2's page wiring (189-02/03: replacing the 6 hand-assembled `<SectionBanner>` call sites in `Results.jsx` and `ElectionsView.jsx` with `<SectionBanner {...buildBannerProps(tier, bannerCtx)} />` one-liners).
- `shouldRenderIcons` is available for any future direct-usage/refactor needs alongside `shouldRenderStat`.
- Full test suite green: 119/119 tests across 11 files (up from the 109-test v20.0 baseline).
- No blockers for 189-02.

---
*Phase: 189-smart-banner-integration-graceful-degradation*
*Completed: 2026-07-08*

## Self-Check: PASSED

All created files verified present on disk; all 3 task commit hashes (b2e2b969, db6c28e7, 0a7d2de6) verified present in git log.
