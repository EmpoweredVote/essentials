---
phase: 04-navigation
plan: 01
subsystem: ui
tags: [react, react-router, navigation, landing-page, header, elections]

# Dependency graph
requires:
  - phase: 02-elections-page
    provides: /elections route — must exist for nav links to target
  - phase: 03-unopposed-and-empty-race-ux
    provides: elections page polish — visible content at /elections
provides:
  - Elections card on landing page linking to /elections
  - Elections nav item in site header visible on all pages
affects: [future phases adding elections sub-navigation or landing page updates]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Two-step navItems computation pattern in Layout.jsx (base + appended items)
    - Full-width card below a flex row of equal-width cards (own wrapper div, not inside flex container)

key-files:
  created: []
  modified:
    - src/pages/Landing.jsx
    - src/components/Layout.jsx

key-decisions:
  - "Elections card copy locked: 'Upcoming Elections' / 'See what's on your ballot'"
  - "Elections nav label locked: 'Elections'"
  - "navItems built as two-step: baseNavItems (Read & Rank injection) then spread + append Elections item"
  - "Elections card is NOT inside COVERAGE_AREAS flex container — own wrapper div for full-width layout"

patterns-established:
  - "Layout.jsx nav extension: add items after baseNavItems via spread, not by mutating defaultNavItems"

# Metrics
duration: 6min
completed: 2026-04-14
---

# Phase 4 Plan 01: Navigation Entry Points Summary

**Elections card on landing page and Elections header nav item — two discoverability entry points linking to /elections to complete v2.0 milestone (ELEC-12, ELEC-13)**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-04-14T03:32:10Z
- **Completed:** 2026-04-14T03:38:10Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Landing page shows an "Upcoming Elections" card between the county coverage cards and the "Browse by location" link, styled to match county cards (teal border, white bg, rounded corners, shadow)
- Site header shows "Elections" as a top-level nav item on all pages, appended after Read & Rank injection
- Both entry points navigate to /elections on click — ELEC-12 and ELEC-13 satisfied

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Elections card to landing page** - `05eaeaf` (feat)
2. **Task 2: Add Elections nav item to site header** - `8a239e2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/pages/Landing.jsx` - Elections card inserted between county cards flex container and Browse by location link
- `src/components/Layout.jsx` - navItems computation split into baseNavItems + Elections append

## Decisions Made

- Copy is locked per plan: "Upcoming Elections" / "See what's on your ballot" and nav label "Elections"
- Layout.jsx uses a named intermediate `baseNavItems` to cleanly separate Read & Rank injection from the Elections append — avoids mutation of `defaultNavItems`
- Elections card placed in its own `<div className="mt-3 mb-2">` wrapper, NOT inside the `COVERAGE_AREAS.map()` flex container, so it renders full-width on its own row

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pre-existing build failure: BallotIcon not found in local ev-ui dev build**

- **Found during:** Task 1 verification (npm run build)
- **Issue:** `C:/Transparent Motivations/ev-ui/dist/index.mjs` (the local dev-aliased ev-ui, v0.1.53) did not export `BallotIcon`, `CompassIcon`, or `BranchIcon`. Vite aliases the local build when `../ev-ui/dist` exists alongside the project. The npm-installed package (v0.4.0) has these exports, but the stale local build was being used instead.
- **Fix:** Synced `C:/Transparent Motivations/ev-ui/dist/index.mjs` and `index.js` from the npm-installed v0.4.0 package files. This makes the local dev build match the production npm package.
- **Files modified:** `C:/Transparent Motivations/ev-ui/dist/index.mjs`, `C:/Transparent Motivations/ev-ui/dist/index.js` (outside this repo)
- **Verification:** `npm run build` succeeds — `✓ built in 5.55s`
- **Committed in:** Not committed (files are outside the essentials repo; local ev-ui dist is gitignored there)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Build was already failing before this plan; fix required to satisfy verification criterion. No scope creep.

## Issues Encountered

The local ev-ui dev build at `C:/Transparent Motivations/ev-ui/dist` was out of date (v0.1.53) compared to the npm-installed package (v0.4.0). The Vite config aliases `@empoweredvote/ev-ui` to the local build when it exists, so Rollup could not statically resolve `BallotIcon` during the build. Syncing the local dist from npm resolved it. This is a local dev environment issue only — production Render deploys use the npm package directly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- ELEC-12 and ELEC-13 satisfied — Elections page is now discoverable from both the landing page and site header
- v2.0 milestone complete: all 13 requirements shipped
- Phase 4 plan 01 is the final plan in the roadmap

---
*Phase: 04-navigation*
*Completed: 2026-04-14*
