---
phase: 188-location-stats-strip
plan: 01
subsystem: data
tags: [census, fips, static-data-bundle, node-esm, build-time-generator]

# Dependency graph
requires:
  - phase: 187-tethered-feature-icon-row
    provides: SectionBanner scrim/chip visual treatment family (rgba(13,17,23,0.55) + blur(2px)) reused for the stats scrim
provides:
  - "scripts/gen-population.mjs — rebuildable Node ESM generator pulling ACS5 2023 population (places/states/US) into a committed bundle"
  - "src/data/population.js — committed POP_BY_FIPS (32,378 entries) + NAME_STATE_TO_FIPS (31,915 entries) bundle"
  - "STATE_FIPS_TO_ABBREV exported from src/lib/buildingImages.js (single source of truth for FIPS<->abbrev inversion)"
affects: [188-02, 188-03, 189-smart-banner-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Build-time-only Census data pull (no runtime network, no runtime key) — static bundle regenerated via npm run gen:population"
    - "FIPS keys always kept as strings with leading zeros preserved; never coerced to Number"

key-files:
  created:
    - scripts/gen-population.mjs
    - src/data/population.js
  modified:
    - src/lib/buildingImages.js
    - package.json

key-decisions:
  - "Minified bundle size (~1.19 MB) exceeds the ~600KB flag threshold from RESEARCH Open Question #1 — flagging dynamic-import fallback for Plan 03 to consider; static export kept as default per plan instruction"
  - "src/data/ directory did not exist; generator creates it via mkdirSync(recursive:true) before writing (Rule 3 auto-fix)"

patterns-established:
  - "Pattern 1: Census ACS5 generator script structure (constants -> pull() helper -> 3 fetches -> build maps -> fail-fast assertions -> write with provenance header) — reusable if a second Census variable is ever added"

requirements-completed: [STAT-02]

# Metrics
duration: 25min
completed: 2026-07-07
---

# Phase 188 Plan 01: Census Population Data Pipeline Summary

**Build-time Node ESM generator pulling live US Census ACS5 2023 population for all ~32K places + 52 states/territories + the national total into a committed FIPS-keyed bundle, with `STATE_FIPS_TO_ABBREV` promoted to an exported single source of truth.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-07 (session start)
- **Completed:** 2026-07-07
- **Tasks:** 3 (Task 2 checkpoint pre-satisfied out-of-band; Tasks 1 and 3 executed)
- **Files modified:** 4 (2 created, 2 modified)

## Accomplishments
- Authored `scripts/gen-population.mjs`, a zero-dependency Node ESM generator that fetches ACS5 2023 `B01003_001E` (Total Population) for all US places (`for=place:*&in=state:*`), all states (`for=state:*`), and the national total (`for=us:1`), then writes a committed static bundle.
- Ran the generator against live Census data and committed the resulting `src/data/population.js`: **32,325 place rows**, **52 state/territory rows** (50 states + DC + PR), and the US national total, producing **32,378 `POP_BY_FIPS` entries** and **31,915 `NAME_STATE_TO_FIPS` entries**.
- Exported `STATE_FIPS_TO_ABBREV` from `src/lib/buildingImages.js` (single-line change, no other edits) so the generator and the future resolver (Plan 02) can both derive from the one 51-entry table instead of re-typing it.
- Added `npm run gen:population` for future regeneration.
- All row-count / leading-zero / format assertions pass (verified below).

## Task Commits

Each task was committed atomically:

1. **Task 1: Export STATE_FIPS_TO_ABBREV and author the Census generator** - `51d2ddb2` (feat)
   - Follow-up blocking-issue fix (Rule 3, `src/data/` didn't exist yet): `581b2fe6` (fix)
2. **Task 2: Operator obtains the free Census API key** - pre-satisfied out-of-band by the operator; no commit (checkpoint, not code)
3. **Task 3: Generate, validate, and commit the population bundle** - `13454da5` (feat)

_Note: Task 1 required one immediate follow-up fix commit (directory-creation) discovered while preparing to run Task 3 — see Deviations._

## Files Created/Modified
- `scripts/gen-population.mjs` - Node ESM generator: reads `CENSUS_API_KEY` from env (fails fast if unset), makes 3 Census fetches, builds `POP_BY_FIPS`/`NAME_STATE_TO_FIPS`, asserts row-count thresholds, writes `src/data/population.js` with a provenance header. Never writes the key to disk.
- `src/data/population.js` - Committed, auto-generated bundle. Exports `POP_BY_FIPS` (FIPS/`"US"` -> population number, string keys with leading zeros preserved) and `NAME_STATE_TO_FIPS` (`"name|ST"` -> 7-digit place GEOID).
- `src/lib/buildingImages.js` - Added `export` keyword before `STATE_FIPS_TO_ABBREV` (line 66). No other change.
- `package.json` - Added `"gen:population": "node scripts/gen-population.mjs"` script.

## Bundle Size (recorded per Task 3 acceptance criteria)

| Form | Size |
|------|------|
| Raw (`src/data/population.js`) | 1,278,708 bytes (~1.22 MB) |
| Minified (esbuild `--minify`) | 1,221,269 bytes (~1.16 MB) |
| Gzipped (raw) | 429,529 bytes (~420 KB) |
| Gzipped (minified) | 426,154 bytes (~416 KB) |

**Row counts:** places = 32,325 · states/territories = 52 (50 states + DC + PR) · us = 1 · `POP_BY_FIPS` total entries = 32,378 · `NAME_STATE_TO_FIPS` entries = 31,915 (118 name+state collisions logged and skipped, first-write-wins — non-fatal, D-05's geo_id path is the primary lookup and is unaffected).

**Bundle-size flag (RESEARCH Open Question #1):** Minified size (~1.16 MB) exceeds the ~600 KB threshold the research flagged for reconsidering a dynamic-import fallback. Per plan instruction, the static `export const` bundle is kept as the default for this plan; **Plan 03 (or later) should evaluate switching the frontend import to `await import('../data/population.js')`** so Vite code-splits it out of the main chunk, since gzip-over-the-wire (~420 KB) is reasonable but the minified/parsed size is non-trivial for a chunk always in the initial bundle.

## Spot-Checks (live data, not hardcoded)

- `POP_BY_FIPS["US"]` = 332,387,540 (number, > 0)
- `POP_BY_FIPS["48"]` (Texas) = 29,640,343 (number, > 20,000,000)
- `POP_BY_FIPS["0644000"]` (Los Angeles) = 3,857,897 (number; key is the string `"0644000"`, leading zero preserved — not coerced to `644000`)
- `NAME_STATE_TO_FIPS["los angeles|CA"]` === `"0644000"`

## Decisions Made
- Kept the static `export const` bundle as the default despite exceeding the ~600 KB minified-size research flag, per explicit plan instruction ("keep the static export as the default") — documented the flag for Plan 03/189 to weigh a dynamic-import switch.
- Generator creates `src/data/` via `mkdirSync(recursive:true)` before writing, since the directory did not exist in the repo (Rule 3 blocking-issue auto-fix).
- Collisions in the `NAME_STATE_TO_FIPS` index (118 total, e.g. two "Fairview"s in the same state) are logged as warnings and resolved first-write-wins, per RESEARCH Pitfall 4 — the browse `geo_id` path (D-05 primary) is unaffected by any index collision.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created src/data/ directory before writing the bundle**
- **Found during:** Task 1 (immediately after authoring the generator, before running Task 3)
- **Issue:** `src/data/` did not exist anywhere in the repo; `writeFileSync(OUT_PATH, ...)` would fail with `ENOENT` on first run since Node does not auto-create parent directories.
- **Fix:** Added `mkdirSync(dirname(OUT_PATH), { recursive: true })` immediately before the `writeFileSync` call.
- **Files modified:** `scripts/gen-population.mjs`
- **Verification:** `node --check scripts/gen-population.mjs` passed; the subsequent live run in Task 3 successfully created `src/data/` and wrote the bundle with no errors.
- **Committed in:** `581b2fe6` (separate fix commit, since Task 1's feature commit had already landed)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the generator to function at all on a fresh checkout of this repo; no scope creep — no other behavior changed.

## Issues Encountered
None beyond the directory-creation fix above. The Census API returned the expected shapes on the first live attempt; no retries were needed.

## User Setup Required
None for this plan going forward — the operator already obtained and supplied `CENSUS_API_KEY` out-of-band for the one-time generation run in Task 3. The key was never written to disk, never logged in a committed file, and is confirmed absent from all git-tracked content via `git grep` (no matches). Future regenerations require the operator to export `CENSUS_API_KEY` again (free key: https://api.census.gov/data/key_signup.html) and run `npm run gen:population`.

## Next Phase Readiness
- `POP_BY_FIPS` + `NAME_STATE_TO_FIPS` are committed and importable at `../data/population.js`; `STATE_FIPS_TO_ABBREV` is exported and importable at `./buildingImages.js`.
- Plan 02 can now build `resolvePopulation({tier, geoId, city, stateAbbrev})` in `src/lib/population.js` exactly per RESEARCH.md's reference implementation, inverting `STATE_FIPS_TO_ABBREV` for the state-tier forward map.
- Flag carried forward: bundle minified size (~1.16 MB) exceeds the ~600 KB research threshold — Plan 03/189 should evaluate a dynamic `import()` if initial-bundle size becomes a concern; not blocking for Plan 02's resolver work.

---
*Phase: 188-location-stats-strip*
*Completed: 2026-07-07*

## Self-Check: PASSED

All claimed files (`scripts/gen-population.mjs`, `src/data/population.js`, this SUMMARY.md) and all four commit hashes (`51d2ddb2`, `581b2fe6`, `13454da5`, `1058d279`) verified present in the repo/git history.
