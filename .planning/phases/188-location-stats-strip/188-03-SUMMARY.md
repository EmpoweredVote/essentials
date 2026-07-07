---
phase: 188-location-stats-strip
plan: 03
subsystem: ui
tags: [react, section-banner, census, population, useMemo, vitest]

# Dependency graph
requires:
  - phase: 188-02
    provides: "src/lib/population.js — pure resolvePopulation({tier, geoId, city, stateAbbrev}) with injectable-maps seam, bound to the real committed bundle by default"
  - phase: 188-01
    provides: "src/data/population.js (POP_BY_FIPS/NAME_STATE_TO_FIPS) + exported STATE_FIPS_TO_ABBREV"
provides:
  - "SectionBanner top-right population scrim rendered via exported shouldRenderStat(stats) predicate (STAT-01, STAT-03)"
  - "populationMap useMemo in Results.jsx resolving all three tiers once and passing stats to its 3 banners + through to ElectionsView"
  - "ElectionsView populationMap pass-through — identical stat on both pages, no page-specific divergence"
affects: [189-smart-banner-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exported pure render-guard predicate (shouldRenderStat) on a presentational component — mirrors FALLBACK_GRADIENTS export precedent so the render guard is unit-testable without jsdom"
    - "Parent-resolves / child-renders: populationMap computed once in Results.jsx (mirroring buildingImageMap/featureIconMap useMemo idiom) and threaded through ElectionsView so SectionBanner stays purely presentational"

key-files:
  created: []
  modified:
    - src/components/SectionBanner.jsx
    - src/components/SectionBanner.test.js
    - src/pages/Results.jsx
    - src/components/ElectionsView.jsx

key-decisions:
  - "Extracted the render guard as an exported pure predicate shouldRenderStat(stats) rather than an inline JSX expression, matching the FALLBACK_GRADIENTS exported-testable-const precedent so the STAT-03 omit logic gets no-jsdom unit coverage"
  - "Resolved population in the parent (Results.jsx) and passed a resolved {label,value}|null stats prop, keeping SectionBanner presentational and ElectionsView a pure pass-through (no router access) — the exact posture Phase 189's shared-component consolidation needs"

patterns-established:
  - "populationMap useMemo (dep array [representingCity, userState, searchParams]) with != null gates keeping null flowing through so STAT-03 omit stays intact end-to-end"

requirements-completed: [STAT-01, STAT-03]

# Metrics
duration: 18min
completed: 2026-07-07
---

# Phase 188 Plan 03: Location Stats Strip Render & Wiring Summary

**Top-right population scrim on city/state/federal SectionBanners, resolved once in Results.jsx via a populationMap useMemo and threaded through ElectionsView, gated by an exported shouldRenderStat predicate that omits cleanly on any miss.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-07-07
- **Completed:** 2026-07-07
- **Tasks:** 2 auto tasks executed + 1 human-verify checkpoint (operator-approved)
- **Files modified:** 4

## Accomplishments
- Replaced SectionBanner's inert `sr-only` stats slot with a guarded top-right navy scrim rendering `{stats.label}` + `{stats.value.toLocaleString()}` per the locked UI-SPEC (STAT-01).
- Extracted the render guard as an exported pure predicate `shouldRenderStat(stats)` (`typeof stats?.value === 'number' && stats.value > 0`) with 7 new unit tests — treats null/undefined/0/NaN/string/empty-object identically and omits the entire block (STAT-03).
- Added a `populationMap` useMemo in Results.jsx (mirroring the shipped `buildingImageMap`/`featureIconMap` blocks) resolving city (browse_geo_id → name+state fallback, D-05), state (D-04), and federal (D-06) tiers once, and passed `stats` to all three SectionBanner branches.
- Threaded `populationMap` through to `<ElectionsView>` and destructured `populationMap = {}` there, passing `stats={populationMap?.Local|State|Federal}` to its three banners — ElectionsView stays a pure pass-through with no router/browse_geo_id access, so both pages resolve identically.

## Task Commits

Each task was committed atomically:

1. **Task 1: Render the population scrim in SectionBanner (+ shouldRenderStat predicate)** - `3b3e5062` (feat)
2. **Task 2: Resolve population in Results.jsx and thread it through ElectionsView** - `b16682d7` (feat)

## Files Created/Modified
- `src/components/SectionBanner.jsx` - Replaced inert stats slot with the top-right scrim block; added exported `shouldRenderStat(stats)` predicate; updated the `stats` prop docblock from "inert scaffolding" to the real `{label,value}|null` contract. No `z-index`, no new `!important`.
- `src/components/SectionBanner.test.js` - Added a `describe('shouldRenderStat')` block: true for `{value:652503}`; false for null, undefined, `{value:0}`, `{value:NaN}`, `{value:'5'}`, `{}`.
- `src/pages/Results.jsx` - Imported `resolvePopulation`; added `populationMap` useMemo (dep `[representingCity, userState, searchParams]`, `!= null` gates); passed `stats` to the 3 tier banners and `populationMap` to ElectionsView.
- `src/components/ElectionsView.jsx` - Destructured `populationMap = {}`; passed `stats={populationMap?.Local|State|Federal}` to its 3 banners.

## Decisions Made
- **Exported predicate over inline guard:** `shouldRenderStat` extracted so STAT-03 omit logic is unit-testable following the repo's pure-logic/no-jsdom convention (FALLBACK_GRADIENTS precedent).
- **Parent resolves, child renders:** population resolved in Results.jsx and passed down as resolved `stats`, keeping SectionBanner presentational and ElectionsView a pure pass-through — lower-risk setup for Phase 189 consolidation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. (`npm run lint` reports 41 pre-existing errors / 12 warnings across the repo, none in the lines touched by this plan — verified by diffing the exact edits against the flagged line numbers. No new lint errors introduced.)

## Verification Results

### Automated (executor)
- `npx vitest run src/components/SectionBanner.test.js` — 1 file, **13 tests passed** (includes the 7 new `shouldRenderStat` cases).
- `npm run lint` — no new errors for the edited files (pre-existing repo errors unchanged and out of scope).
- `npm test` (full suite) — 10 files, **109 tests passed**, exit 0.
- Confirmed no `z-index` / new `!important` in SectionBanner.jsx; confirmed ElectionsView has zero router/`browse_geo_id` access.

### Live visual QA (Task 3 checkpoint — operator-approved via a fresh Playwright session against a local dev build, dark mode) — ALL PASS
- **City** (LA, `browse_geo_id=0644000`): top-right scrim `POPULATION / 3,857,897`.
- **State** (CA): `POPULATION / 39,242,785`; **Federal** (US): `POPULATION / 332,387,540`, title "United States".
- **Styling pixel-exact to UI-SPEC:** `position:absolute; top:16px right:16px`; bg `rgba(13,17,23,0.55)`; `borderRadius 10px`; `padding 4px 12px`; `backdropFilter blur(2px)`; block height 47px.
- **Mobile (390px):** label + number both render, no drop, no collision with title/feature-icons.
- **Elections page** (`?view=elections`): identical `3,857,897` — parity confirmed, no divergence between Results and Elections.
- **Omit case** (government-list county browse, `browse_government_list=06037&browse_state=CA`): the local "Los Angeles County, CA" banner renders NO stat block; only State + Federal scrims present; no "0"/"undefined"/NaN/empty scrim (STAT-03).
- **Console:** only the pre-existing 401 on `/api/auth/session` (not logged in locally); zero new errors/warnings.

## User Setup Required
None - no external service configuration required (runtime never touches Census; the bundle is committed).

## Next Phase Readiness
- Both Results.jsx and ElectionsView.jsx now render the identical population stat across all three tiers via a single Results-computed `populationMap` — Phase 189's shared-component consolidation only needs to standardize *how* the parent computes it, not refactor SectionBanner internals.
- Carried-forward (non-blocking, unchanged from Plan 01/02): the committed population bundle (~1.16 MB minified) exceeds the ~600KB research threshold; Phase 189 may evaluate a dynamic `import()` if initial-bundle size becomes a concern.

---
*Phase: 188-location-stats-strip*
*Completed: 2026-07-07*

## Self-Check: PASSED

All modified files (`src/components/SectionBanner.jsx`, `src/components/SectionBanner.test.js`, `src/pages/Results.jsx`, `src/components/ElectionsView.jsx`), the SUMMARY, and both task commit hashes (`3b3e5062`, `b16682d7`) verified present in the repo/git history.
