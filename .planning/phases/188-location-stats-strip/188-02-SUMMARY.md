---
phase: 188-location-stats-strip
plan: 02
subsystem: frontend
tags: [pure-function, resolver, census, fips, vitest]

# Dependency graph
requires:
  - phase: 188-01
    provides: "src/data/population.js (POP_BY_FIPS/NAME_STATE_TO_FIPS) + exported STATE_FIPS_TO_ABBREV in src/lib/buildingImages.js"
provides:
  - "src/lib/population.js — pure resolvePopulation({tier, geoId, city, stateAbbrev}, maps) with an injectable maps seam, defaulting to the real bundle"
  - "src/lib/population.test.js — fixture-injected Vitest matrix proving STAT-02/STAT-03"
affects: [188-03, 189-smart-banner-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injectable second-argument maps seam on a pure resolver (DI without a framework) — lets callers use the one-arg real-bundle form while tests inject tiny fixtures"
    - "Tier-branch resolver mirroring resolveFeatureIcons' idiom, extended to a single scalar (population) instead of a per-tier array"

key-files:
  created:
    - src/lib/population.js
    - src/lib/population.test.js
  modified: []

key-decisions:
  - "resolvePopulation takes maps as an explicit second argument (default = bound real bundle) rather than a factory/curried function — simplest DI seam matching RESEARCH's Wave-0 requirement without adding new architectural surface"

patterns-established:
  - "Resolver DI seam: any future pure resolver over a large committed bundle (e.g. a second Census variable) should default its second arg to the real bundle and let tests inject fixtures, avoiding a ~1MB+ import in unit tests"

requirements-completed: [STAT-02, STAT-03]

# Metrics
duration: 12min
completed: 2026-07-07
---

# Phase 188 Plan 02: Population Resolver Summary

**Pure `resolvePopulation({tier, geoId, city, stateAbbrev})` resolver implementing D-04 (state abbrev -> FIPS), D-05 (city via geo_id OR name|state index), D-06 (federal US total), and D-07/STAT-03 (null-on-any-miss), with an injectable maps seam and a 13-case fixture-based Vitest matrix.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-07
- **Completed:** 2026-07-07
- **Tasks:** 2 (both executed as planned, no deviations)
- **Files modified:** 2 (both created)

## Accomplishments
- Authored `src/lib/population.js` exporting `resolvePopulation`, mirroring `resolveFeatureIcons`' tier-branch idiom (`src/lib/featureIcons.js`).
- Derived `ABBREV_TO_STATE_FIPS` once at module scope via `Object.fromEntries` inverting the now-exported `STATE_FIPS_TO_ABBREV` — no re-typed FIPS table (D-04).
- City tier resolves via `geoId` matched as a string verbatim (never `Number()`/`parseInt`, per Pitfall 2) as the primary path (D-05), falling back to the `name|state` index (lowercased city + uppercased state) when no `geoId` match exists.
- Every miss path (unknown geoId, bad/empty abbrev, missing city, unrecognized tier, no args) returns `null`; every resolved population that is `0`, `NaN`, or non-number also returns `null` (STAT-03), via the single guard `typeof pop === 'number' && pop > 0`.
- The function accepts an optional second `maps` argument defaulting to the real bound bundle (`{POP_BY_FIPS, NAME_STATE_TO_FIPS, ABBREV_TO_STATE_FIPS}` imported from `../data/population.js` + `./buildingImages.js`), so Plan 03's parents can call it with the one-arg form while tests inject a tiny fixture instead of loading the ~1.16MB real bundle.
- Authored `src/lib/population.test.js` with a 13-case Vitest matrix covering the full STAT-02/STAT-03 requirement set, following the repo's pure-logic/no-jsdom convention (`featureIcons.test.js` style).

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement resolvePopulation with an injectable maps seam** - `13c9ae2b` (feat)
2. **Task 2: Fixture-injected Vitest matrix for the resolver** - `aa0c3100` (test)

No deviations — both tasks executed exactly as planned.

## Files Created/Modified
- `src/lib/population.js` - Pure `resolvePopulation({tier, geoId, city, stateAbbrev}, maps)`. Imports `POP_BY_FIPS`/`NAME_STATE_TO_FIPS` from `../data/population.js` and `STATE_FIPS_TO_ABBREV` from `./buildingImages.js`; derives `ABBREV_TO_STATE_FIPS` once at module scope. Zero I/O, zero console, zero router access.
- `src/lib/population.test.js` - 13 `it` cases across one `describe('resolvePopulation')` block: federal (always resolves), state (mixed-case abbrev resolves + unknown/empty/missing abbrev -> null), city-via-geoId (primary), city-via-name-index (fallback), geoId-preferred-over-index-when-both-present, city miss cases (unknown geoId, unknown name+state, missing stateAbbrev, no geoId/city at all), unrecognized tier -> null, no-args -> null, and population value `0`/`NaN`/non-number/`undefined` -> null. Imports only `./population` (and vitest) — never `../data/population.js`.

## Verification Results

- **Inline Node probe (Task 1 acceptance criteria):** exits 0 — federal=US total, state abbrev (case-insensitive) resolves, city geoId resolves, city name+state resolves, unknown geoId -> null, bad abbrev -> null. Confirmed via direct execution: `ok`.
- **`npx vitest run src/lib/population.test.js`:** 1 file, 13 tests, all passed.
- **`npm test` (full suite):** 10 files, 102 tests, all passed — no regression from Plan 01's bundle or Phase 187's icon-row work.
- **Source inspection:** contains `Object.fromEntries` (line 10) inverting `STATE_FIPS_TO_ABBREV`; contains no `parseInt`/`Number(` applied anywhere in the file (grep-confirmed).

## Decisions Made
- Injectable-maps-as-second-argument (not a factory/curry) chosen as the DI seam — matches RESEARCH's explicit Wave-0 requirement ("do NOT force tests to import the ~700KB real bundle") with the smallest possible API surface change from the RESEARCH.md reference implementation (which took no second argument); Plan 03's parents still call it with the simple one-arg form since the default binds the real bundle.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None. This plan adds no new dependencies, no env vars, no build steps beyond what Plan 01 already established.

## Next Phase Readiness

- `resolvePopulation({ tier, geoId, city, stateAbbrev })` (one-arg form, bound to the real committed bundle) is ready for Plan 03 to call from `Results.jsx`'s `useMemo` blocks (mirroring the existing `buildingImageMap`/`featureIconMap` pattern) and to pass through `ElectionsView.jsx` as a `populationMap` prop.
- Carried-forward flag from Plan 01 (unchanged by this plan): minified bundle size (~1.16 MB) exceeds the ~600KB research threshold — Plan 03/189 should evaluate a dynamic `import()` switch if initial-bundle size becomes a concern. Not blocking; `resolvePopulation`'s default import of `../data/population.js` uses whatever import strategy Plan 03 chooses (static or dynamic) with no change to the resolver's own logic.

---
*Phase: 188-location-stats-strip*
*Completed: 2026-07-07*

## Self-Check: PASSED

All claimed files (`src/lib/population.js`, `src/lib/population.test.js`) and both commit hashes (`13c9ae2b`, `aa0c3100`) verified present in the repo/git history.
