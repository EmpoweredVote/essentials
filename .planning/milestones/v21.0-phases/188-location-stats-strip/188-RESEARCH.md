# Phase 188: Location Stats Strip - Research

**Researched:** 2026-07-07
**Domain:** Static Census-population bundle generation + a pure geo-id → population resolver feeding `SectionBanner.jsx`'s top-right stat slot
**Confidence:** HIGH (codebase claims verified against source; Census API verified against live endpoints)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Population lives in a **static, pre-generated JSON bundle committed to the repo**, keyed by **Census FIPS geo identifier**. No live Census API at runtime, no backend endpoint, no API key / CORS / rate-limit handling at runtime.
- **D-02:** Bundle produced by a **rebuildable generator script** (committed, e.g. under `scripts/`) that pulls population for **all US places + all 50 states** from the **latest ACS 5-year estimates** (2023: `api.census.gov/data/2023/acs/acs5`, variable `B01003_001E`, `for=place:*&in=state:*` plus `for=state:*`). National (US) total included for federal tier.
- **D-03:** Bundle carries **two structures**: (a) `POP_BY_FIPS` — FIPS → population; (b) a **`name+state → place-FIPS` index** so address-search city banners resolve. Key normalization mirrors `getBuildingImages` (lowercased city name + 2-letter state).
- **D-04:** **State tier always resolves** — state abbrev → state FIPS → lookup. Inverse of `STATE_FIPS_TO_ABBREV`; derive the forward direction.
- **D-05:** **City tier resolves via** the browse `geo_id` (place FIPS in browse mode) **OR** the `name+state → FIPS` index (address-search mode). Whichever is available.
- **D-06:** **Federal tier always resolves** — national population keyed to the US geo. No omit case.
- **D-07:** **Graceful omit (STAT-03):** any location that doesn't resolve renders **no stat at all** — no placeholder, no zero, no broken label. Mirror `imageFailed` posture.
- **D-08:** **Population only** this phase. One fact.
- **D-09:** Display as **uppercase label + full grouped number** — `POPULATION` line, number via `toLocaleString`. No abbreviation, no suffix.
- **D-10:** **All three tiers show both lines** (label + number), including mobile 120px banner.
- **D-11:** Stat renders **top-right**, right-aligned, on a **rounded semi-transparent navy scrim** (`rgba(13,17,23,~0.55)` + slight `backdropFilter: blur`), same family as 187's `FeatureIconChip`.
- **D-12:** Kept **clear of the very corner**; never overlaps bottom-left title or bottom-right icon row.
- **D-13:** All color/type traces to `src/index.css` `@theme` tokens (DARK-01). Dark-mode only. No `!important`.

### Claude's Discretion
- Exact scrim padding, corner radius, opacity, blur, label font-size/tracking, number font-size (constrained by UI-SPEC — see below).
- Exact shape of the JSON bundle files and the generator script's location/structure, provided D-01/D-02/D-03 hold and it's regenerable.
- Whether resolution logic lives inside `SectionBanner` or is passed in via a resolved `stats` prop from the parent — keeping Phase 189's "one shared component, no page-specific divergence" goal in mind.
- Fetch/lookup caching strategy across the 3 stacked banners (static bundle = synchronous in-memory lookup, so trivial).

### Deferred Ideas (OUT OF SCOPE)
- Second/third stats (median household income, land area, density, etc.).
- Live Census API / backend proxy at runtime.
- Shared-component consolidation across Results + Elections — Phase 189.
- Reciprocal/enhanced banner treatments on other EV apps.

**Note:** The UI-SPEC (`188-UI-SPEC.md`) fully locks styling: scrim `rgba(13,17,23,0.55)` + `blur(2px)`, radius `10px`, padding `4px 12px`, `top:16px right:16px`, right-aligned flex column `gap:4px`; label 11px/600/13px/1px-tracking uppercase `--color-ev-text-muted`, number 20px/700/22px `--color-ev-text-primary`, both `--font-sans`. Render only when `typeof stats.value === 'number' && stats.value > 0`. **Do not re-research styling.**
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| STAT-01 | User sees at least one legible fact (population) on city + state banners | Bundle + resolver + `stats` prop render (this doc §Standard Stack, §Resolver) |
| STAT-02 | Stats sourced from Census keyed to the banner location's geo identifier (FIPS/geo_id), not hardcoded per city | Generator script pulls ACS5 `B01003_001E` for all places/states/US; `POP_BY_FIPS` keyed by FIPS (this doc §Census API, §Bundle Shape) |
| STAT-03 | Unavailable stat omitted gracefully — no zeros/nulls/undefined/broken labels | `resolvePopulation()` returns `null` on miss; render-guard `stats?.value > 0` (this doc §Resolver, §Pitfalls) |
</phase_requirements>

## Summary

This is a frontend-only phase with two build artifacts: (1) a **committed static JSON/JS population bundle** keyed by Census FIPS, and (2) a **pure `resolvePopulation()` helper** that maps each banner's location identity (tier + geo_id or city+state) to a population number, returning `null` on any miss. The `SectionBanner` `stats` prop, currently inert (`SectionBanner.jsx:214`), becomes a real `{ label, value }` object rendered in the top-right scrim per the locked UI-SPEC.

The single genuine external unknown — the Census ACS API — was verified against live endpoints. **As of 2026-05-12 the Census Data API requires a free API key for every request** (confirmed: every unauthenticated call to `api.census.gov/data/2023/acs/acs5?...` returns `"A valid _key_ must be included with each data API request."`). This only affects the **generator script at build time**, not runtime (D-01 already mandates a static bundle, so runtime never touches Census). The query `for=place:*&in=state:*` is valid syntax that pulls **all ~32,000 places in the country in one request** (place geography allows a `*` wildcard for the required `state` predicate), so the whole bundle is 3 requests total: all places, all 50 states, and the national US total.

**Primary recommendation:** Write a **Node ESM generator** at `scripts/gen-population.mjs` that reads a `CENSUS_API_KEY` env var, makes 3 fetches (places / states / us), and emits `src/data/population.js` exporting `POP_BY_FIPS` + `NAME_STATE_TO_FIPS`. Add a pure `resolvePopulation({ tier, geoId, city, stateAbbrev })` to a new `src/lib/population.js` (imports the bundle + inverts `STATE_FIPS_TO_ABBREV`). **Resolve population in the parents** (`Results.jsx` / `ElectionsView.jsx`), mirroring the existing `buildingImageMap`/`featureIconMap` pattern, and pass a resolved `{ label:'POPULATION', value }` (or `null`) as the `stats` prop — this keeps `SectionBanner` a pure presentational component and does not fight Phase 189's single-shared-component goal.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pull ACS5 population from Census | Build-time script (Node) | — | D-01/D-02: no runtime Census; regenerable committed artifact |
| Store population keyed by FIPS | Static data module (`src/data/`) | — | Zero-latency synchronous lookup; version-controlled |
| Resolve location identity → population number | Frontend pure lib (`src/lib/`) | — | Testable pure function; no I/O |
| Decide which banner shows which stat | Page/parent (`Results.jsx`, `ElectionsView.jsx`) | — | Parents already own `representingCity`/`userState`/`geo_id` identity plumbing (matches `buildingImageMap`/`featureIconMap`) |
| Render the stat scrim | Presentational component (`SectionBanner.jsx`) | — | Dark-mode-only, token-based, shared by both pages (Phase 189) |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node built-in `fetch` | Node 24.13 (installed) `[VERIFIED: node --version]` | Generator fetches Census JSON | Global `fetch` stable since Node 18; no dependency needed |
| Vite static import | vite ^7.1.2 `[VERIFIED: package.json:40]` | Frontend imports the committed JS bundle | Already the build tool; `import { POP_BY_FIPS } from '../data/population.js'` is tree-shaken/bundled at build |
| Vitest | ^4.1.4 `[VERIFIED: package.json:41]` | Unit-test the pure resolver | Repo's existing test runner (`npm test` = `vitest run`, `package.json:11`) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | This phase adds **zero** new dependencies. Everything (fetch, JSON, Vitest) already exists. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node generator (`.mjs`) | Python generator under `scripts/` (precedented: `scripts/banners/*.py`, `scripts/*.py`) | Python is precedented for **image** tooling (uses `requests`, PIL). But the *output* here is a JS module the frontend imports; a Node generator writing `src/data/population.js` keeps the whole data pipeline in one language, needs no `requests` install, and can `import` the same bundle to self-verify. Recommend Node. |
| Committed `.js` module (`export const POP_BY_FIPS = {...}`) | Committed `.json` + `import ... assert { type: 'json' }` | A `.js` module is simpler to import in Vite/React with no import-assertion caveats, and lets the file carry a header comment (vintage, regen command, row counts) like `buildingImages.js` does. Recommend `.js`. |
| Single bundle file | Split places vs. states/us | Places dominate size (~32k rows). Could split, but a single minified `population.js` is simplest and Vite code-splits lazily if the import is dynamic. Recommend single file; revisit only if bundle-size budget is exceeded (see §Bundle Shape estimate). |

**Installation:**
```bash
# No install needed. Generator uses Node's built-in fetch.
# Free Census API key (build-time only): https://api.census.gov/data/key_signup.html
export CENSUS_API_KEY=...   # then: node scripts/gen-population.mjs
```

**Version verification:**
- Node 24.13.0 installed `[VERIFIED: Bash node --version]` — built-in `fetch` available.
- Vite ^7.1.2, Vitest ^4.1.4 `[VERIFIED: package.json:40-41]`.
- ACS 5-year **2023** vintage confirmed live: `api.census.gov/data/2023/acs/acs5` accepts the query and `B01003_001E` resolves to a real variable `[VERIFIED: api.census.gov endpoint checks]`.

## Package Legitimacy Audit

> This phase installs **no external packages** — all tooling (Node built-in `fetch`, Vite, Vitest) is already present in `package.json`. Package Legitimacy Gate is **not applicable**. The only external artifact is the free Census API key, obtained from the official government domain `api.census.gov/data/key_signup.html`.

## Census ACS API — Verified Mechanics

> All claims below verified 2026-07-07 against live `api.census.gov` endpoints and official docs, not training memory.

### API key requirement (the one real gotcha)
- **A valid API key is REQUIRED for every request as of 2026-05-12.** `[VERIFIED: live endpoint]` Every unauthenticated call — including `?get=NAME,B01003_001E&for=us:1`, `for=state:*`, and `for=place:*&in=state:*` — returns the exact body: `"A valid _key_ must be included with each data API request."` `[VERIFIED: multiple live endpoint checks]`
- Keys are **free** and issued via an automated email flow at `https://api.census.gov/data/key_signup.html` (email must end `.com/.net/.org/.gov/.edu`). `[CITED: census.gov key_signup]`
- **Impact on this phase: build-time only.** D-01 mandates a static committed bundle, so the runtime app never calls Census. The generator script reads the key from an env var (`CENSUS_API_KEY`) — **never commit the key**. Rate limit is 500 queries/IP/day without extra concern; this generator makes **3 requests total**, far under any limit. `[CITED: census.gov api-user-guide]`

### Query syntax is valid (single nationwide place pull works)
The missing-key error is returned *instead of* a syntax error, which confirms the query parsing succeeded. `[VERIFIED: the API distinguishes malformed-geo errors from missing-key errors]` The `place` geography's metadata confirms a nationwide wildcard pull is legal:
- `place` geography: `requires: ["state"]`, `wildcard: ["state"]`, `optionalWithWCFor: "state"` `[VERIFIED: api.census.gov/data/2023/acs/acs5/geography.json]` — i.e. `for=place:*&in=state:*` returns **every place in every state in one response**. (Note: an earlier general-search snippet claimed the `in=` wildcard is invalid; the authoritative geography.json metadata and the live endpoint both accept `in=state:*` for the `place` level. Trust the metadata.)

### Exact request URLs
Append `&key=$CENSUS_API_KEY` to each:

```
# (a) All places, nationwide (~32,000 rows):
https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=place:*&in=state:*

# (b) All 50 states (+ DC, PR):
https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=state:*

# (c) National US total (single row, e.g. 334,914,895):
https://api.census.gov/data/2023/acs/acs5?get=NAME,B01003_001E&for=us:1
```

- `B01003_001E` = **Total Population**, `predicateType: "int"`, concept "Total Population". `[VERIFIED: api.census.gov/data/2023/acs/acs5/variables/B01003_001E.json]`
- You may also request `GEO_ID` (`predicateType: "string"`) but it is redundant with the trailing `state`/`place` columns (see below), so `get=NAME,B01003_001E` is sufficient. `[VERIFIED: variables/GEO_ID.json]`

### JSON response format + which column carries the FIPS
The API returns a **2-D JSON array: the first row is the header, subsequent rows are data.** `[VERIFIED: census.gov api-user-guide]` For each query the trailing columns are the geography codes:

```json
// (a) places — columns: ["NAME","B01003_001E","state","place"]
[
  ["NAME","B01003_001E","state","place"],
  ["Plano city, Texas","285494","48","58016"],
  ["Los Angeles city, California","3898747","06","44000"]
]
// FIPS place GEOID = state (2) + place (5) concatenated → "4858016", "0644000"

// (b) states — columns: ["NAME","B01003_001E","state"]
[["NAME","B01003_001E","state"], ["Texas","30503301","48"], ["California","38965193","06"]]
// state FIPS = the "state" column, 2 digits → "48", "06"

// (c) us — columns: ["NAME","B01003_001E","us"]
[["NAME","B01003_001E","us"], ["United States","334914895","1"]]
```

> Population values above are illustrative order-of-magnitude examples `[ASSUMED]` — the generator writes whatever the live API returns; do not hardcode these numbers.

**Composing the place FIPS key:** concatenate the `state` column (2 digits) + the `place` column (5 digits) = the **7-digit place GEOID** (e.g. `06` + `44000` = `0644000`). This is **exactly** the format `browse_geo_id` supplies and that `stateAbbrevFromGeoId` slices (`buildingImages.js:85-89` reads `.slice(0,2)`). `[VERIFIED: buildingImages.js:85-89]`

### Latest vintage
- **2023** ACS5 is confirmed live and is the appropriate target for D-02. `[VERIFIED: 2023/acs/acs5 endpoints respond]` There is **no `latest` alias** for ACS5 — the year is part of the path. Hardcode `2023` in the generator with a top-of-file comment noting the regen date; bump the year manually when a newer 5-year vintage ships (ACS5 releases ~December each year). `[ASSUMED — release cadence from training; verify at regen time]`

### Data volume / bundle-size relevance
- **~32,000 place rows** nationwide (incorporated places + CDPs; a 1990 tally listed 23,435 and the count has grown). `[ASSUMED — order of magnitude; exact count is whatever the live pull returns]`
- Raw `POP_BY_FIPS` as `{"0644000":3898747, ...}` ≈ 32k × ~22 bytes ≈ **~700 KB raw**, **~400-500 KB minified**, and **far smaller gzipped over the wire** (numeric-heavy JSON compresses well, typically 5-8×, so ~60-100 KB gzipped). The `NAME_STATE_TO_FIPS` index roughly doubles the raw source but compresses similarly. This is acceptable for a committed data module but is the one size consideration to flag; if the planner wants to trim, filter the places pull to only places with population above a threshold **only if** it never drops a covered city (risky — recommend keeping all rows). `[ASSUMED — size estimate; verify actual file size after first generation]`

## Bundle Shape (D-03)

Recommended single committed module `src/data/population.js`:

```js
// AUTO-GENERATED by scripts/gen-population.mjs — DO NOT EDIT BY HAND.
// Source: US Census ACS 5-Year 2023 (B01003_001E). Regenerated: 2026-07-07.
// Rows: places=<N>, states=52 (50 + DC + PR), us=1.
// Regenerate: CENSUS_API_KEY=... node scripts/gen-population.mjs

// FIPS → population. Keys:
//   place  = 7-digit place GEOID (2-digit state FIPS + 5-digit place FIPS), e.g. "0644000"
//   state  = 2-digit state FIPS, e.g. "48"
//   nation = the literal "US"
export const POP_BY_FIPS = {
  "US": 334914895,
  "48": 30503301,
  "06": 38965193,
  "0644000": 3898747,
  "4858016": 285494,
  // ...~32k place rows
};

// name+state → place GEOID. Mirrors getBuildingImages key normalization:
// lowercased place name (Census "NAME" with the " city, State" / " town, State"
// / " CDP, State" suffix stripped) + "|" + 2-letter state abbrev.
// e.g. "plano|TX" → "4858016", "los angeles|CA" → "0644000".
export const NAME_STATE_TO_FIPS = {
  "plano|TX": "4858016",
  "los angeles|CA": "0644000",
  // ...
};
```

**Key-format contract (critical):**
- `POP_BY_FIPS` place keys are the **7-digit place GEOID** with **leading zeros preserved as string keys** (`"0644000"`, not `644000`). `browse_geo_id` arrives as a string already (`searchParams.get('browse_geo_id')`, `Results.jsx:386`), so no numeric coercion — match on the string verbatim. `[VERIFIED: Results.jsx:386-388, 823]`
- State keys are the **2-digit state FIPS** (`"48"`), matching the inverse of `STATE_FIPS_TO_ABBREV` (`buildingImages.js:66-75`). `[VERIFIED: buildingImages.js:66-75]`
- Nation key is the literal `"US"`.
- `NAME_STATE_TO_FIPS` normalization must mirror `getBuildingImages`: `(city||'').toLowerCase()` + state `.toUpperCase()` (`buildingImages.js:491-492`). Strip the Census `NAME` suffixes (`" city, X"`, `" town, X"`, `" village, X"`, `" CDP, X"`, `" (balance), X"`) in the generator so the index key is the bare lowercased place name. `[VERIFIED: buildingImages.js:491-492]`

## Geo-id Resolution Across Modes (the core plumbing)

### Location identity available at each call site

**Results.jsx** (`Results.jsx:1950-1971`):
| Tier | Prop passed to SectionBanner | Underlying variable | Population resolution path (D-04/05/06) |
|------|------------------------------|---------------------|------------------------------------------|
| `city` (Local) | `locationName={representingCity && userState ? ...}` | `representingCity` (`:1071-1100`), `userState` (`:1104-1138`) | **D-05.** Prefer place FIPS: in browse mode `searchParams.get('browse_geo_id')` is the 7-digit place GEOID → `POP_BY_FIPS[geoId]`. Else `NAME_STATE_TO_FIPS[\`${representingCity.toLowerCase()}|${userState}\`]` → `POP_BY_FIPS[fips]`. |
| `state` | `locationName={STATE_NAMES[userState] ...}` | `userState` (2-letter abbrev) | **D-04.** `abbrev → state FIPS` (forward inverse of `STATE_FIPS_TO_ABBREV`) → `POP_BY_FIPS[stateFips]`. Always resolves for the 50 states + DC. |
| `federal` | `locationName="United States"` | (constant) | **D-06.** `POP_BY_FIPS["US"]`. Always resolves. |

- `browse_geo_id` is captured at `Results.jsx:386-388` into `browseArea` and re-read from `searchParams` at `:823`. In browse-by-area mode it is the place FIPS (7-digit place GEOID). `[VERIFIED: Results.jsx:386-388, 748, 823-835]`
- `representingCity`: browse mode uses `browse_label` (`:1076-1079`); else politician `representing_city`; else parsed from address (`parseCityFromAddress`, `:1097`). `[VERIFIED: Results.jsx:1071-1100]`
- `userState`: address parse → geo-id FIPS prefix (`stateAbbrevFromGeoId`) → government-list FIPS → `browse_state` param (`:1104-1138`). Authoritative 2-letter abbrev. `[VERIFIED: Results.jsx:1104-1138]`
- **Note:** `browse_government_list` mode (e.g. Collin County) has **no `browse_geo_id`**; its city banner will fall back to the `NAME_STATE_TO_FIPS` index path (D-05 "whichever is available"). This is the correct graceful path.

**ElectionsView.jsx** (`ElectionsView.jsx:577-598`): receives `representingCity`, `userState`, `buildingImageMap`, `featureIconMap` as **props from Results.jsx** (`Results.jsx:2082-2086`). `[VERIFIED: Results.jsx:2082-2086, ElectionsView.jsx:277 signature, :577-598 usage]` It does **not** independently read `browse_geo_id`. This is why resolving in the parent is cleaner: Results.jsx already computes the identity once and passes it down; add a `populationMap` (or per-tier resolved `stats`) prop alongside the existing `buildingImageMap`/`featureIconMap` props.

### The single helper the planner should write

```js
// src/lib/population.js
import { POP_BY_FIPS, NAME_STATE_TO_FIPS } from '../data/population.js';
import { STATE_FIPS_TO_ABBREV } from './buildingImages.js'; // must be EXPORTED (see §FIPS helpers)

// Forward map derived once: abbrev → 2-digit state FIPS (D-04 inverse).
const ABBREV_TO_STATE_FIPS = Object.fromEntries(
  Object.entries(STATE_FIPS_TO_ABBREV).map(([fips, abbrev]) => [abbrev, fips])
);

/**
 * Pure. Returns a positive population number, or null on any miss (STAT-03).
 * @param {{tier:'city'|'state'|'federal', geoId?:string, city?:string, stateAbbrev?:string}} loc
 */
export function resolvePopulation({ tier, geoId, city, stateAbbrev } = {}) {
  let fips = null;
  if (tier === 'federal') {
    fips = 'US';
  } else if (tier === 'state') {
    fips = ABBREV_TO_STATE_FIPS[(stateAbbrev || '').toUpperCase()] || null;
  } else if (tier === 'city') {
    if (geoId && POP_BY_FIPS[String(geoId)] != null) {
      fips = String(geoId);
    } else if (city && stateAbbrev) {
      fips = NAME_STATE_TO_FIPS[`${city.toLowerCase()}|${stateAbbrev.toUpperCase()}`] || null;
    }
  }
  const pop = fips != null ? POP_BY_FIPS[fips] : null;
  return typeof pop === 'number' && pop > 0 ? pop : null;
}
```

Parents then build the `stats` prop:
```js
const cityStat = (() => {
  const v = resolvePopulation({ tier:'city', geoId: searchParams.get('browse_geo_id'), city: representingCity, stateAbbrev: userState });
  return v != null ? { label: 'POPULATION', value: v } : null;
})();
// pass stats={cityStat} / stats={stateStat} / stats={federalStat}
```

## FIPS Helpers — Reuse vs. Invert

| Helper | Location | Current shape | Action for Phase 188 |
|--------|----------|---------------|----------------------|
| `STATE_FIPS_TO_ABBREV` | `buildingImages.js:66-75` | `{ '48':'TX', '06':'CA', ... }` (51 entries incl. DC; **module-private, NOT exported**) | **Export it** (add `export`), then derive `ABBREV_TO_STATE_FIPS` via `Object.fromEntries(...map(reverse))` in `population.js`. Do NOT re-type the 51 pairs. `[VERIFIED: buildingImages.js:66-75 — no export keyword]` |
| `stateAbbrevFromGeoId(geoId)` | `buildingImages.js:85-89` (exported) | Slices first 2 chars → `STATE_FIPS_TO_ABBREV[prefix]` | Reuse as-is if ever needed to get an abbrev from a geo_id; **not required** for the resolver above (state tier already has `userState`). |
| `getBuildingImages` name/state matching | `buildingImages.js:490-531` | `(city||'').toLowerCase()`, `abbrev.toUpperCase()`, longest-key-first | Mirror this normalization in the generator's `NAME_STATE_TO_FIPS` key construction and in the resolver's index lookup. `[VERIFIED: buildingImages.js:491-518]` |

**Note (DC/PR):** `STATE_FIPS_TO_ABBREV` includes `'11':'DC'` but the `STATE_CAPITOLS`/`STATE_NAMES` sets are 50-state. The `for=state:*` Census pull returns DC (`11`) and Puerto Rico (`72`); include them in `POP_BY_FIPS` harmlessly — they simply resolve if a banner ever targets them, and are omitted otherwise (STAT-03).

## Where the Resolver Lives (Discretion → recommendation)

**Recommendation: resolve in the parent, pass a resolved `stats` prop.** Rationale:
- Mirrors the **already-shipped** pattern: `buildingImageMap` (`Results.jsx:1140-1143`) and `featureIconMap` (`Results.jsx:1145-1148`) are both computed in `Results.jsx` via `useMemo` and passed down — to `SectionBanner` directly and to `ElectionsView` as props (`Results.jsx:2082-2083`). `[VERIFIED: Results.jsx:1140-1148, 2082-2086]` A `populationMap`/resolved-`stats` follows the identical shape with zero new architectural surface.
- Keeps `SectionBanner` a **pure presentational** component (it already takes `stats` as data per UI-SPEC §"Data / Rendering Contract"). This is exactly what Phase 189's "one shared component, no page-specific divergence" wants — the shared component receives resolved data, both pages resolve identically because both use the same `resolvePopulation()` + the same identity variables.
- `SectionBanner` cannot cleanly read `browse_geo_id` itself (it has no router access and ElectionsView doesn't pass geo_id down today) — so self-resolution inside the component would require threading new props anyway. Resolving in the parent avoids that.

**Phase 189 alignment:** 189 will unify both call sites into one shared component. Passing resolved `stats` now means 189 only has to standardize *how the parent computes it* (a shared hook/util), not refactor component internals. This is strictly the lower-risk path.

## Generator Script Conventions

- **`scripts/` precedent:** the repo has `scripts/banners/*.py` (Python + `requests` + PIL) and many `scripts/*.py` for image/DB work, plus a **Node** example `scripts/lausd-headshots/download.js` / `process.js`. `[VERIFIED: Glob scripts/**]` So both languages are precedented; there is no lint/test gate on `scripts/`.
- **Recommendation: Node ESM `scripts/gen-population.mjs`.** The output is a JS module the frontend imports; keeping the generator in Node means it can `import('../src/data/population.js')` to self-verify counts, uses the built-in `fetch` (Node 24.13, `[VERIFIED]`) with no `requests`/pip install, and matches `type: "module"` (`package.json:5`). Python would work but adds a language boundary for a pure JSON-shaping task.
- Script responsibilities: read `process.env.CENSUS_API_KEY` (fail fast with a clear message if unset); 3 `fetch`es; skip header row; build both maps; strip Census NAME suffixes for the index; write `src/data/population.js` with a generated-file header (vintage, regen date, row counts, regen command). Consider adding an npm script `"gen:population": "node scripts/gen-population.mjs"` to `package.json`.

## Architecture Patterns

### System Architecture Diagram
```
BUILD TIME (occasional, manual):
  CENSUS_API_KEY ──▶ scripts/gen-population.mjs
                        │  fetch ×3 (places / states / us)  ← api.census.gov/data/2023/acs/acs5
                        ▼
                     src/data/population.js   (committed: POP_BY_FIPS + NAME_STATE_TO_FIPS)

RUNTIME (every banner render, synchronous, no network):
  Results.jsx / ElectionsView.jsx
     ├─ identity: representingCity, userState, browse_geo_id
     ▼
  resolvePopulation({tier, geoId, city, stateAbbrev})  ← src/lib/population.js
     │  (imports POP_BY_FIPS + inverted STATE_FIPS_TO_ABBREV)
     ▼  number | null
  stats = value ? {label:'POPULATION', value} : null
     ▼
  <SectionBanner stats={stats} ... />  → renders top-right scrim only when stats.value > 0
```

### Recommended Project Structure
```
scripts/
└── gen-population.mjs      # NEW — build-time generator (Node ESM)
src/
├── data/
│   └── population.js       # NEW — committed auto-generated bundle
├── lib/
│   ├── population.js       # NEW — pure resolvePopulation()
│   ├── population.test.js  # NEW — Vitest unit tests
│   └── buildingImages.js   # EDIT — add `export` to STATE_FIPS_TO_ABBREV
├── pages/Results.jsx       # EDIT — compute stats, pass to banners + ElectionsView
└── components/
    ├── SectionBanner.jsx   # EDIT — render stats scrim (replace :214 sr-only)
    └── ElectionsView.jsx   # EDIT — accept + pass stats prop to its banners
```

### Anti-Patterns to Avoid
- **Fetching Census at runtime.** Forbidden by D-01 and now blocked anyway (key required). All Census access is build-time.
- **Numeric FIPS keys.** Leading zeros (`0644000`, `06`) must be string keys; `browse_geo_id` is a string — never `parseInt` it.
- **Hardcoding population numbers** (e.g. the federal total) in component/lib source — that would violate STAT-02 ("not hardcoded per city/state"). The federal total must come from `POP_BY_FIPS["US"]` populated by the generator.
- **Self-resolving inside `SectionBanner`** by reading the router — the component has no router context in `ElectionsView` and must stay presentational (fights Phase 189).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| FIPS ↔ state abbrev map | A new 51-entry table | Export + invert existing `STATE_FIPS_TO_ABBREV` (`buildingImages.js:66-75`) | Single source of truth; a second copy will drift |
| City name + state normalization | Novel matching logic | Mirror `getBuildingImages` lowercase/uppercase (`buildingImages.js:491-492`) | Consistency with banner-art resolution; users get the same match behavior |
| Number formatting (`652,503`) | Manual comma insertion | `value.toLocaleString()` (UI-SPEC D-09) | Locale-correct, already specified |
| Parent→ElectionsView data hand-off | New context/prop plumbing | Add a prop next to existing `buildingImageMap`/`featureIconMap` (`Results.jsx:2082-2083`) | Proven pattern already wired for both maps |

**Key insight:** Every hard part of this phase (FIPS mapping, name matching, parent→child identity plumbing, graceful-omit posture) already exists in the codebase from the banner-art and feature-icon work. Phase 188 is mostly *composition* of existing patterns + one build-time data pull.

## Common Pitfalls

### Pitfall 1: Missing/expired Census API key at generation time
**What goes wrong:** Generator gets `"A valid _key_ must be included"` and writes an empty/garbage bundle. `[VERIFIED: live endpoint behavior]`
**How to avoid:** Fail fast if `CENSUS_API_KEY` unset; assert each fetch returns a JSON array whose first element is a header row and whose length > expected minimum (e.g. places > 20000, states >= 50) before writing the file.
**Warning signs:** Bundle file suddenly tiny; all banners omit population.

### Pitfall 2: Leading-zero FIPS coerced to number
**What goes wrong:** `06`→`6`, `0644000`→`644000`; lookups miss for every state 01-09 and every place in those states.
**How to avoid:** Keep all FIPS as string keys everywhere; never `Number()`/`parseInt` a geo_id. `browse_geo_id` is already a string (`Results.jsx:386`). `[VERIFIED]`

### Pitfall 3: Census NAME suffix pollutes the name index
**What goes wrong:** Index key becomes `"plano city, texas"` instead of `"plano"`, so `NAME_STATE_TO_FIPS["plano|TX"]` misses.
**How to avoid:** Strip `" (city|town|village|borough|CDP|...)\b.*"` suffix from Census `NAME` in the generator; store bare lowercased place name + `|` + abbrev.
**Warning signs:** Browse-mode cities show population (geo_id path works) but address-search cities of the same name do not (index path misses).

### Pitfall 4: Duplicate place names within a state collapsing in the index
**What goes wrong:** Two places normalize to the same `name|state` key; last-write-wins picks the wrong FIPS.
**How to avoid:** The geo_id path (D-05 primary) is unaffected. For the index, this is an acceptable rare edge (matches the existing `getBuildingImages` substring-match tolerance). Log collisions during generation; the graceful-omit contract (STAT-03) means a wrong-but-plausible population is the only risk, and browse mode (with real geo_id) always wins when available.

## Code Examples

### Generator core (Node ESM)
```js
// scripts/gen-population.mjs
const KEY = process.env.CENSUS_API_KEY;
if (!KEY) { console.error('Set CENSUS_API_KEY (free: api.census.gov/data/key_signup.html)'); process.exit(1); }
const BASE = 'https://api.census.gov/data/2023/acs/acs5';
const V = 'B01003_001E';
async function pull(qs) {
  const res = await fetch(`${BASE}?get=NAME,${V}&${qs}&key=${KEY}`);
  const rows = await res.json();            // [header, ...data]  [VERIFIED: array-of-arrays]
  return rows.slice(1);                     // drop header
}
const places = await pull('for=place:*&in=state:*'); // cols: NAME, pop, state, place
const states = await pull('for=state:*');            // cols: NAME, pop, state
const us     = await pull('for=us:1');               // cols: NAME, pop, us
```

### Render guard in SectionBanner (per UI-SPEC)
```jsx
// Replaces the inert {stats && <div className="sr-only" .../>} at SectionBanner.jsx:214
{typeof stats?.value === 'number' && stats.value > 0 && (
  <div data-slot="stats" style={{ position:'absolute', top:'16px', right:'16px',
    display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px',
    background:'rgba(13,17,23,0.55)', backdropFilter:'blur(2px)',
    borderRadius:'10px', padding:'4px 12px' }}>
    <span style={{ fontFamily:'var(--font-sans)', fontSize:'11px', fontWeight:600,
      lineHeight:'13px', letterSpacing:'1px', textTransform:'uppercase',
      color:'var(--color-ev-text-muted)' }}>{stats.label}</span>
    <span style={{ fontFamily:'var(--font-sans)', fontSize:'20px', fontWeight:700,
      lineHeight:'22px', color:'var(--color-ev-text-primary)' }}>
      {stats.value.toLocaleString()}
    </span>
  </div>
)}
```
> Source: values from `188-UI-SPEC.md` §Layout/§Typography (locked). `[CITED: 188-UI-SPEC.md]`

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Census API open (key optional) | **Key REQUIRED for all requests** | 2026-05-12 | Generator must supply `CENSUS_API_KEY`; runtime unaffected (static bundle) `[VERIFIED]` |
| `stats` prop inert `sr-only` (BANR-04) | `stats` = `{label,value}` rendered scrim | This phase | `SectionBanner.jsx:214` becomes real markup |

## Runtime State Inventory

> Not a rename/refactor/migration phase — this section is N/A. No stored data, live-service config, OS-registered state, secrets, or build artifacts embed a renamed string. The only new secret is the build-time `CENSUS_API_KEY` env var (never committed; used only by the generator).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js (built-in `fetch`) | Generator script | ✓ | 24.13.0 `[VERIFIED]` | — |
| Vitest | Resolver unit tests | ✓ | ^4.1.4 `[VERIFIED: package.json]` | — |
| Census API key | Generator (build-time only) | ✗ (must be obtained) | free | **Blocking for regeneration only** — obtain at api.census.gov/data/key_signup.html. Runtime is unaffected once bundle is committed. |
| Internet access to api.census.gov | Generator (build-time only) | assumed | — | Run generator from a networked machine; the committed output needs no network |

**Missing dependencies with no fallback:** None for runtime. The Census API key is required to *(re)generate* the bundle — plan a task to obtain it before the generation task, or the operator supplies it as an env var.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.4 `[VERIFIED: package.json:41]` |
| Config file | none — Vitest runs with Vite defaults; test files are colocated `src/**/*.test.js` `[VERIFIED: Glob — no vitest.config.*]` |
| Quick run command | `npx vitest run src/lib/population.test.js` |
| Full suite command | `npm test` (= `vitest run`, `package.json:11`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| STAT-02 | `resolvePopulation` federal → US total | unit | `npx vitest run src/lib/population.test.js` | ❌ Wave 0 |
| STAT-02 | state abbrev → state FIPS → pop (D-04) | unit | same | ❌ Wave 0 |
| STAT-02 | city geo_id (place FIPS) → pop (D-05 primary) | unit | same | ❌ Wave 0 |
| STAT-02 | city name+state → index → pop (D-05 fallback) | unit | same | ❌ Wave 0 |
| STAT-03 | unknown geo_id / bad abbrev / missing city → `null` | unit | same | ❌ Wave 0 |
| STAT-03 | population 0 / NaN / non-number → `null` | unit | same | ❌ Wave 0 |
| STAT-01/03 | `SectionBanner` renders scrim iff `stats.value>0` | (pure-logic only; repo convention avoids jsdom render — assert via the render-guard predicate extracted as a tiny pure helper, matching `SectionBanner.test.js` which tests `FALLBACK_GRADIENTS`, not DOM) | same pattern | ❌ Wave 0 |

> The repo's test convention is **pure-logic only, no jsdom/React render** (see `SectionBanner.test.js:1-10`, `featureIcons.test.js:1-9`). Follow it: test `resolvePopulation()` directly with a small in-test `POP_BY_FIPS`/`NAME_STATE_TO_FIPS` fixture (mirroring how `featureIcons.test.js` uses a `CITIES` fixture). If the render-guard logic needs coverage, extract it as a pure predicate (e.g. `shouldRenderStat(stats)`) exported from `SectionBanner.jsx` and unit-test that, exactly as `FALLBACK_GRADIENTS` is exported and tested.

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/population.test.js`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/population.test.js` — covers STAT-02/STAT-03 resolver behavior (with inline fixture; do not import the ~700KB real bundle into tests — inject or fixture the maps)
- [ ] Framework install: none needed (Vitest present)
- [ ] Generator has no unit test (build-time I/O script); instead add an in-script post-fetch **assertion** (row counts > thresholds, header-row shape) that fails loudly rather than writing a bad bundle

## Security Domain

> `security_enforcement` config not located in this session; treating as enabled and reporting the minimal applicable surface. This is a read-only static-data + pure-function frontend phase with no auth/session/PII.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in this phase |
| V3 Session Management | no | — |
| V4 Access Control | no | Public population data |
| V5 Input Validation | yes | Resolver treats all inputs as untrusted strings; returns `null` on any non-match (no injection surface — data is object-key lookup, not query) |
| V6 Cryptography | no | — |
| V7 Secrets | yes | `CENSUS_API_KEY` is build-time only; must be an env var, never committed, never shipped to the client bundle |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Committing the Census API key | Information Disclosure | Read from `process.env.CENSUS_API_KEY`; key never enters `src/`; add to any `.env`-ignore if a `.env` is used |
| Prototype-pollution via object-key lookup | Tampering | Keys are FIPS/`name|state` strings from trusted generated data; user-supplied `geoId`/`city` only *read* keys, never write. Optionally use `Object.hasOwn(POP_BY_FIPS, k)` / a `Map` if paranoid, but risk is negligible |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ~32,000 US place rows; bundle ~400-500KB minified / ~60-100KB gzipped | Census API / Bundle Shape | If much larger, planner may need to split or filter the bundle; verify actual file size after first generation |
| A2 | 2023 is the current ACS5 vintage; no `latest` alias; new vintage ~each December | Census API | If a 2024 ACS5 shipped, generator should target it; verify `/data/2024/acs/acs5` at generation time |
| A3 | Example population values (Plano/LA/US) are illustrative | Census API | Do not hardcode; generator writes live values |
| A4 | Puerto Rico (72) returned by `for=state:*` | FIPS helpers | Harmless if present/absent; no banner targets PR today |

## Open Questions (RESOLVED)

1. **Exact live place-row count and resulting committed file size.** — `RESOLVED: 188-01 Task 3`
   - What we know: order-of-magnitude ~32k rows; compresses well.
   - What's unclear: the precise byte size until the generator runs once.
   - Recommendation: run the generator early in the phase; if minified size exceeds a repo budget the planner cares about, switch the frontend import to dynamic (`await import('../data/population.js')`) so Vite code-splits it out of the main chunk.
   - Resolution: Plan 188-01 Task 3 records the raw/min/gzip bundle size in the SUMMARY and flags the dynamic-import fallback if size exceeds ~600KB.

2. **Who supplies the Census API key.** — `RESOLVED: 188-01 Task 2`
   - What we know: free, build-time only, required since 2026-05-12.
   - Recommendation: add an explicit task/checkpoint for the operator to obtain and export `CENSUS_API_KEY` before the generation task runs.
   - Resolution: Plan 188-01 Task 2 is a `checkpoint:human-action` where the operator obtains and exports `CENSUS_API_KEY` before the generation task.

## Sources

### Primary (HIGH confidence)
- Live `api.census.gov/data/2023/acs/acs5` endpoint probes (missing-key error confirms key requirement + valid syntax) — 2026-07-07
- `api.census.gov/data/2023/acs/acs5/geography.json` — place `requires/wildcard: ["state"]`
- `api.census.gov/data/2023/acs/acs5/variables/B01003_001E.json` — Total Population, int
- `api.census.gov/data/2023/acs/acs5/variables/GEO_ID.json` — string geo identifier
- Codebase (verified by direct read): `SectionBanner.jsx`, `buildingImages.js:66-89,490-531`, `Results.jsx:386-388,748,823-835,1071-1148,1950-1971,2082-2086`, `ElectionsView.jsx:277,577-598`, `featureIcons.js`, `treasury.js`, `featureIcons.test.js`, `SectionBanner.test.js`, `package.json`

### Secondary (MEDIUM confidence)
- census.gov API User Guide — key required 2026-05-12, 500 queries/day, array-of-arrays response format
- census.gov key_signup — free key issuance flow

### Tertiary (LOW confidence)
- WebSearch on total US place count (1990 tally 23,435; current higher) — order-of-magnitude only

## Metadata

**Confidence breakdown:**
- Census API mechanics: HIGH — verified against live endpoints + geography metadata (key requirement, valid nationwide place query, response shape, FIPS composition, variable definition).
- Bundle shape / FIPS key format: HIGH — cross-checked against `browse_geo_id` string handling and `stateAbbrevFromGeoId` slicing in code.
- Call-site resolution plumbing: HIGH — every prop/variable/line verified by direct read.
- Bundle size estimate: MEDIUM — arithmetic estimate; exact size pending first generation.
- ACS5 vintage currency: MEDIUM — 2023 confirmed live; newer-vintage timing from training.

**Research date:** 2026-07-07
**Valid until:** ~2026-08-07 (stable; re-check Census vintage/key policy if the generator is run months later)
