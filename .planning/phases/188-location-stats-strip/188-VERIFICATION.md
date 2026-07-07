---
phase: 188-location-stats-strip
verified: 2026-07-07T15:20:00Z
status: passed
score: 3/3 must-haves verified
overrides_applied: 0
---

# Phase 188: Location Stats Strip Verification Report

**Phase Goal:** City and state banners show at least one legible, Census-sourced fact (population first) about that banner's own location, resolved dynamically from the location's geo identifier — and the strip degrades gracefully when a stat is unavailable.
**Verified:** 2026-07-07T15:20:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Requirements)

| # | Requirement | Verdict | Evidence |
| --- | --- | --- | --- |
| STAT-01 | User sees a legible population fact on city/state (and federal) banners, positioned without collision | ✓ MET | `SectionBanner.jsx:228-270` renders a `data-slot="stats"` scrim: `top:16px right:16px`, label `{stats.label}` (from prop, not hardcoded) + `{stats.value.toLocaleString()}`. Anchored top-right, clear of bottom-left title (`:207-223`) and bottom-right feature-icon row (`:275-291`). `Results.jsx:1973/1981/1989` pass `stats={populationMap.Local/State/Federal}` to all three tier banners. Live QA (operator-approved) confirmed LA 3,857,897 / CA 39,242,785 / US 332,387,540 with pixel-exact styling and no mobile drop. |
| STAT-02 | Population is Census-derived and keyed by FIPS/geo_id, NOT hardcoded per city | ✓ MET | `scripts/gen-population.mjs` pulls ACS5 2023 `B01003_001E` via 3 fetches (`for=place:*&in=state:*`, `for=state:*`, `for=us:1`) with `&key=${KEY}` from env. `src/data/population.js` is the only place holding population integers; generated with provenance header. Runtime probe: `POP_BY_FIPS` has US + 53 two-digit state/territory keys + 32,325 seven-digit place keys (4,355 leading-zero place keys preserved as strings; `POP_BY_FIPS["0644000"]` key is a string). `NAME_STATE_TO_FIPS` has 31,915 entries. grep confirms NO population integer hardcoded anywhere in `scripts/` or `src/lib/` (only GEOID strings in unrelated building-image URLs). `resolvePopulation` (`src/lib/population.js`) keys lookups by FIPS/geo_id verbatim string, never `Number()`/`parseInt`. |
| STAT-03 | An unavailable/unresolved stat is omitted cleanly (no 0/null/undefined/empty scrim) | ✓ MET | `shouldRenderStat(stats)` (`SectionBanner.jsx:155-157`) = `typeof stats?.value === 'number' && stats.value > 0` and is the sole render gate (`:228`). `resolvePopulation` returns `null` on every miss and for 0/NaN/non-number via final guard `typeof pop === 'number' && pop > 0` (`population.js:50`). `Results.jsx:1161-1163` uses `!= null` gates so null flows through `populationMap` untouched. Live QA confirmed omit case on a government-list county browse (no "0"/"undefined"/empty scrim). |

**Score:** 3/3 requirements verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `scripts/gen-population.mjs` | Rebuildable Node ESM Census generator | ✓ VERIFIED | Valid ESM; reads `process.env.CENSUS_API_KEY`, fails fast if unset; 3 ACS5 fetches; fail-fast row-count assertions (`places>20000`, `states>=50`, `us===1`); imports `STATE_FIPS_TO_ABBREV` (no re-typed table); FIPS kept as strings. |
| `src/data/population.js` | Committed FIPS-keyed bundle | ✓ VERIFIED | Exports `POP_BY_FIPS` (32,378 entries) + `NAME_STATE_TO_FIPS` (31,915 entries) with AUTO-GENERATED provenance header. Runtime probe confirms US/state/place keys and leading-zero preservation. |
| `src/lib/buildingImages.js` | Exported `STATE_FIPS_TO_ABBREV` | ✓ VERIFIED | `export const STATE_FIPS_TO_ABBREV` present; single-source-of-truth for FIPS↔abbrev, inverted by the resolver. |
| `src/lib/population.js` | Pure `resolvePopulation` with injectable maps seam | ✓ VERIFIED | Exports `resolvePopulation({tier,geoId,city,stateAbbrev}, maps=DEFAULT_MAPS)`; derives `ABBREV_TO_STATE_FIPS` via `Object.fromEntries`; STAT-03 guard; no I/O/console/router. |
| `src/lib/population.test.js` | Fixture-injected Vitest matrix | ✓ VERIFIED | 13 cases, injects tiny `MAPS` fixture; does NOT import the real bundle. Covers federal/state/city tiers + all STAT-03 omit cases. |
| `src/components/SectionBanner.jsx` | Top-right population scrim + `shouldRenderStat` | ✓ VERIFIED | Inert `sr-only` slot replaced by guarded scrim per UI-SPEC; label from prop; `.toLocaleString()`; no `z-index`, no new `!important`. |
| `src/components/SectionBanner.test.js` | `shouldRenderStat` predicate tests | ✓ VERIFIED | `describe('shouldRenderStat')` with 7 cases: true for `{value:652503}`; false for null/undefined/0/NaN/string/empty-object. |
| `src/pages/Results.jsx` | `populationMap` useMemo + banner wiring | ✓ VERIFIED | Imports `resolvePopulation`; `populationMap` useMemo (`:1151-1165`) resolves 3 tiers with `browse_geo_id`; `!= null` gates; passes stats to 3 banners + `populationMap={populationMap}` to ElectionsView (`:2104`). |
| `src/components/ElectionsView.jsx` | `populationMap` pass-through | ✓ VERIFIED | Destructures `populationMap = {}` (`:287`); passes `stats={populationMap?.Local/State/Federal}` to 3 banners (`:584/592/600`). No `searchParams`/`useLocation`/`browse_geo_id`/router access — pure pass-through, so both pages resolve identically. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `gen-population.mjs` | `api.census.gov/data/2023/acs/acs5` | 3 fetch() calls with `&key=$CENSUS_API_KEY` | ✓ WIRED | All three query strings present; env key interpolated at build time only. |
| `population.js POP_BY_FIPS place keys` | browse_geo_id string format | 7-digit GEOID string, leading zeros preserved | ✓ WIRED | 4,355 place keys match `^0`; keys stored as strings. |
| `population.js` (resolver) | `data/population.js` + `buildingImages.js` | imports maps + inverts STATE_FIPS_TO_ABBREV | ✓ WIRED | `Object.fromEntries` inversion at module scope. |
| `Results.jsx populationMap` | SectionBanner `stats` prop | `resolvePopulation` per tier → `{label,value}|null` | ✓ WIRED | `stats={populationMap.Local/State/Federal}` on all 3 branches. |
| `Results.jsx` | `ElectionsView.jsx` | `populationMap={populationMap}` prop | ✓ WIRED | Confirmed at `Results.jsx:2104`; consumed at `ElectionsView.jsx:287`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| --- | --- | --- | --- | --- |
| SectionBanner scrim | `stats.value` | `populationMap` ← `resolvePopulation` ← `POP_BY_FIPS` (Census bundle) | Yes — real Census integers (LA 3,857,897; CA 39,242,785; US 332,387,540) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| --- | --- | --- | --- |
| Bundle exports real data | node import probe | US=332,387,540; 32,325 place keys; 53 state keys; leading zeros preserved | ✓ PASS |
| No hardcoded population integers in scripts/src/lib | grep `[0-9]{7,}` | Only GEOID strings in URLs/comments — no population values | ✓ PASS |
| Full test suite | `npm test` (vitest run) | 10 files, 109 tests passed | ✓ PASS |
| Commit hashes exist | `git cat-file -e` ×7 | All 7 (51d2ddb2, 581b2fe6, 13454da5, 13c9ae2b, aa0c3100, 3b3e5062, b16682d7) present | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| STAT-01 | 188-03 | Legible population fact on city/state banners | ✓ SATISFIED | Scrim render + wiring + live QA |
| STAT-02 | 188-01, 188-02 | Census-derived, FIPS-keyed, not hardcoded | ✓ SATISFIED | Generator + bundle + resolver; grep confirms no hardcoded values |
| STAT-03 | 188-02, 188-03 | Graceful omit on unavailable stat | ✓ SATISFIED | `shouldRenderStat` guard + null-on-miss resolver + live omit case |

### Anti-Patterns Found

None. Scan of all 7 modified/created files for `TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER|not yet implemented|coming soon` returned zero matches. No `z-index` or new `!important` in SectionBanner. No `Number()`/`parseInt` applied to FIPS.

### Human Verification Required

None outstanding. The Task 3 live visual checkpoint (`188-03-PLAN.md`) was already executed and operator-approved (city/state/federal tiers, both Results and Elections pages, mobile no-drop, omit case, zero new console errors). No new human-check blocks remain.

### Gaps Summary

No gaps. All three requirements (STAT-01, STAT-02, STAT-03) are fully met in the codebase, not merely superficially. The build-time Census pipeline produces a real FIPS-keyed bundle with no hardcoded population integers (STAT-02); the pure resolver returns null on every miss with a single positive-number guard, and that null flows untouched through `populationMap` to a single `shouldRenderStat` render gate (STAT-03); and the scrim renders a prop-supplied label + grouped number, wired identically through Results.jsx and a router-free ElectionsView pass-through (STAT-01). Full suite green at 109/109. Note: a non-blocking bundle-size flag (~1.16 MB minified) is carried forward for Phase 189 to evaluate a dynamic import — this does not affect any Phase 188 requirement.

---

_Verified: 2026-07-07T15:20:00Z_
_Verifier: Claude (gsd-verifier)_
