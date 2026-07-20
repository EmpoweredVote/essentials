# Stack Research

**Domain:** Unified location search (combobox + address/coordinate/place-name resolution) for an existing React 19 + Express/PostGIS civic app
**Researched:** 2026-07-20
**Confidence:** HIGH

## Headline Finding

**This milestone needs at most ONE new npm dependency (frontend) and ZERO new Postgres extensions.**
`pg_trgm` + `unaccent` are already enabled in production (migration `040_pg_trgm_search.sql`) and already
power a mature fuzzy-name-search pattern (`campaignFinanceSearchService.ts` — `word_similarity()` +
`public.f_unaccent()` + length-calibrated threshold + GIN index) that should be extended, not reinvented,
for place names. Coordinate lookup should reuse the existing PostGIS `ST_Covers` pattern
(`getElectionsByCoordinate`) — no geocoder involved at all for lat/lng input. The only real gap is
**national fallback coverage for places we haven't deep-seeded** — solved with a build-time Census
Gazetteer ingest (same philosophy as the existing `scripts/gen-population.mjs` ACS5 bundle), not a live
third-party geocoder.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `@headlessui/react` | `^2.2.10` | Accessible `Combobox` primitive for the unified search field | `ev-ui@0.9.8` exports **no** combobox/listbox/autocomplete primitive (verified — enumerated the full named-export list: `AuthForm`, `PoliticianCard`, `FilterSidebar`, `Header`, `SiteHeader`, etc. — nothing combobox-shaped). Hand-rolling a WAI-ARIA-APG-correct combobox (role management, `aria-activedescendant`, roving focus, listbox popup, keyboard nav, screen-reader announcements) is high-risk to get right for a one-off. Headless UI is built by the Tailwind CSS team specifically to compose with Tailwind (already the project's styling system) and ships unstyled, so it slots under existing Tailwind/ev-ui visual tokens with zero design-system conflict. `2.2.10`'s peer dep is `react: "^18 \|\| ^19 \|\| ^19.0.0-rc"` — confirmed compatible with the pinned `react@^19.1.1`. |
| PostgreSQL `pg_trgm` extension | already enabled (Postgres core `contrib`) | Trigram similarity for fuzzy place-name matching | **Already live** — `CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;` ran in migration 040. Currently indexes only `essentials.politicians.full_name`; the identical index/query pattern needs to be added for `essentials.governments.name` (a new migration, not a new extension). |
| PostgreSQL `unaccent` extension + `public.f_unaccent()` | already enabled | Accent-insensitive matching | **Already live** — same migration 040 created the `IMMUTABLE` wrapper `public.f_unaccent(text)`, required because raw `unaccent()` is `STABLE` and can't be used in a GIN index expression. Reuse verbatim; do not create a second wrapper. |
| PostGIS `ST_Covers` point-in-polygon | already in use | Coordinate → jurisdiction resolution | `getElectionsByCoordinate` (`electionService.ts`) already runs `ST_Covers(geometry, ST_SetSRID(ST_MakePoint($lng,$lat),4326))` against `essentials.geofence_boundaries`. The new coordinate-lookup endpoint should reuse this exact geometry-matching pattern for officials — no geocoder needed for lat/lng input at all, since it's already a point, not text to resolve. |
| US Census one-line address geocoder | already in use, keep scope unchanged | Full street-address → lat/lng | `geocodingService.ts::geocodeAddress()` already does this well and is free/no-key. **Do not widen its use** to city/county/state-only queries — there's a Key Decision already on record (v2.0): "Census Geocoder unreliable with city+state; also returns wrong-district races," which is why `elections/me` avoids it for Connected users. Keep it scoped to genuine street addresses (leading house number) exactly as it works today. |
| US Census Gazetteer Files (Places + Counties, current vintage) | static data, ingested once (one-time script/migration) | National place-name + centroid coverage beyond our curated catalog — the actual mechanism for "any resolvable US input" | **New**, but zero-dependency: free, no API key, official (`www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_place_national.zip` + `..._counties_national.zip`, pipe-delimited text). Ingest once into a small new reference table (e.g. `essentials.gazetteer_places(geoid, name, state, lat, lng)`) with the same `pg_trgm` GIN pattern. This is what makes "Springfield, IL" (a state Essentials hasn't deep-seeded) resolve to *at least* IL's state+federal officials — the curated `essentials.governments`/`coverage.js` catalog only covers ~20 states, but the Gazetteer covers all ~29,000 incorporated US places + all 3,143 counties. Same build-time-bundle philosophy already established for `scripts/gen-population.mjs` (Census ACS5 → committed bundle; Key Decision v21.0/STAT-02) — a DB table instead of a JS bundle here specifically because the fuzzy match itself needs to run in Postgres via `pg_trgm`, not in the browser. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none — hand-write)* | — | Coordinate string parsing (`"39.1, -86.5"`, `"39.1 -86.5"`, optional N/S/E/W suffix) | A ~30-line regex-based parser (split on comma/whitespace, trim, `parseFloat`, range-validate `-90..90`/`-180..180`, optional N/S/E/W suffix strip) is simpler, more testable, and carries no supply-chain risk versus a micro-package. See "What NOT to Use" for the packages considered and rejected. |
| *(none — hand-write)* | — | Debounce the combobox's as-you-type DB query | A ~10-line `useDebouncedValue` hook is standard React and avoids adding `lodash.debounce`/`use-debounce` for one call site. The already-installed `@floating-ui/react` (used for the Treasury-chip tooltip) is not needed for combobox positioning either — Headless UI v2's `ComboboxOptions` ships its own built-in `anchor` prop (confirmed via docs: uses its own CSS-anchor-based positioning, not `@floating-ui/react`, for that feature). |
| `fastest-levenshtein` | `^1.0.16` (already a backend dependency) | Optional secondary distance check | Already installed for the discovery pipeline's `NAME_MATCH_THRESHOLD=0.85` politician matching. Not required for place-name search — `pg_trgm`'s `word_similarity()` already ranks server-side — but available if a specific edge case (e.g. transposed city/state word order) ever needs a tie-break. Do not add a second Levenshtein package. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| *(none new)* | — | No new dev tooling required. Existing Vitest (`^4.1.4` frontend, `^2.1.0` backend) covers unit tests for the coordinate parser and the resolver's threshold/ranking logic, mirroring the existing 13-case Vitest matrix precedent used for `resolvePopulation`. |

## Installation

```bash
# Frontend (essentials/) — the only new npm dependency this milestone needs
npm install @headlessui/react@^2.2.10

# Also remove the dead Google Places remnant while touching this area (see "What NOT to Use"):
npm uninstall @googlemaps/js-api-loader

# Backend (EV-Accounts/backend/) — no new npm packages.
# pg_trgm / unaccent / f_unaccent already live (migration 040). New work is:
#   1. a migration adding a GIN trgm index on essentials.governments.name
#      (mirror idx_politicians_full_name_trgm exactly)
#   2. a one-time ingest script/migration loading the Census Gazetteer
#      Places + Counties files into a new small reference table
```

No `npm install -D` additions — existing Vitest/ESLint/TypeScript tooling covers this feature.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|--------------------------|
| `@headlessui/react` `Combobox` | Hand-rolled ARIA combobox on top of the already-installed `@floating-ui/react` | Only if the team wants literally zero new npm packages and is willing to own full WAI-ARIA APG combobox correctness (roving `aria-activedescendant`, listbox semantics, screen-reader announcements) in-house. Higher implementation + QA cost for a one-field feature; not recommended given how thin the win is. |
| `@headlessui/react` `Combobox` | `downshift` (`^9.4.0`, hooks-only, unstyled) | If the team specifically wants a lower-level, render-prop-style primitive with a narrower dependency tree (`downshift` has zero runtime deps, vs. Headless UI's five transitive deps — `@react-aria/focus`, `@react-aria/interactions`, `@floating-ui/react`, `@tanstack/react-virtual`, `use-sync-external-store`). Reasonable second choice; Headless UI is preferred here mainly because it's from the same team as Tailwind (already the styling system) and its docs/examples are Tailwind-native. |
| `@headlessui/react` `Combobox` | `react-aria`/`react-aria-components` (`useComboBox`) | If accessibility rigor needs to go beyond WAI-ARIA APG basics (Adobe's React Aria has the deepest cross-screen-reader test matrix in the ecosystem). Heavier to adopt piecemeal; overkill for one field in an otherwise Tailwind-first codebase. |
| Census Gazetteer build-time/DB ingest | Nominatim (OpenStreetMap) live geocoding for city/county/state text | Only if/when a genuinely different capability is needed later (e.g., free-text fuzzy geocoding of places *not* in the Gazetteer, like informal neighborhood names). The public Nominatim instance's usage policy caps at ~1 req/sec and requires attribution — not suitable as a production-path dependency for this milestone; self-hosting Nominatim is a real infra project, out of scope here. |
| `pg_trgm` fuzzy match on `essentials.governments` + Gazetteer table | Postgres full-text search (`tsvector`/`tsquery`) | If place names needed multi-word relevance ranking beyond typo-tolerance (they don't — city/county/state names are short, low-cardinality strings; trigram similarity is the standard, already-proven-in-this-codebase tool for exactly this). |
| Server-side `pg_trgm` ranking | Client-side fuzzy search (`fuse.js`, `match-sorter`) over a shipped place list | Only if the candidate list were small enough to ship to the browser (it isn't — the Gazetteer alone is ~29K places). Shipping the whole catalog client-side to fuzzy-match in JS would also duplicate ranking logic the DB already does well and bloat the bundle for no benefit. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|--------------|
| Google Places Autocomplete / Places API | Explicit project decision (already dead — no API key, `loadError`) and the milestone explicitly drops it: paid, carries Google branding/ToS attribution requirements on results, antithetical to "no third-party ads/branding on our forms." **`@googlemaps/js-api-loader@^2.0.2` is still present in `essentials/package.json` dependencies right now — this is the dead Google Places remnant and should be removed as part of this milestone's cleanup**, not carried forward. | `@headlessui/react` `Combobox` + our own DB-backed resolver |
| Mapbox Geocoding API / any other paid geocoder (HERE, LocationIQ paid tier, Geocodio, SmartyStreets, etc.) | All are paid-tier-gated at any meaningful volume and/or carry branding requirements on free tiers — same objection as Google. | US Census one-line geocoder (addresses, already in use) + Census Gazetteer (places/counties, new ingest) + our own `pg_trgm` catalog |
| Nominatim (OSM) as a live, request-time dependency for this milestone | Public instance ToS limits to ~1 req/sec with mandatory attribution; not designed to sit behind user-facing production traffic without self-hosting, which is out of scope here. | Census Gazetteer static ingest (answers exactly the "does this US place exist, what state is it in" question this milestone needs) |
| `coordinate-parser` (npm, `1.0.7`) / `parse-dms` (npm, `0.0.5`) | Both are effectively unmaintained micro-packages (years-old last publish; `parse-dms` is pre-1.0/alpha-quality). Not worth the supply-chain surface for a ~30-line parsing problem. | Hand-written regex-based coordinate parser (decimal `"lat,lng"` / `"lat lng"`, optional N/S/E/W suffix, range validation) |
| `react-select`, `react-select-async-paginate`, MUI `Autocomplete`, `cmdk` (command-palette pattern) | All impose their own visual design system, or (in `cmdk`'s case) a command-palette UX model that doesn't match a single inline search field; `react-select`/MUI would need substantial override work to look native inside the existing Tailwind + ev-ui design language. | `@headlessui/react` `Combobox` (unstyled, Tailwind-native) |
| A dedicated search engine (Algolia, Typesense, Elasticsearch/OpenSearch, Meilisearch) | Enormous operational overkill for a catalog in the low tens-of-thousands of rows that Postgres `pg_trgm` already handles at sub-100ms per the existing SRCH-01 precedent (same data-scale class, GIN-indexed). Adds a whole new managed service + billing surface for a problem already solved in-place. | `pg_trgm` GIN index on `essentials.governments.name` (+ new Gazetteer reference table) |
| Repurposing the Census one-line address geocoder for city/county/state-only text queries | Already burned once — Key Decision on record: "Census Geocoder unreliable with city+state; also returns wrong-district races." This is exactly the class of input the new unified search must also accept, so don't re-introduce the same known failure mode. | Server-side fuzzy match against `essentials.governments` (curated) → Gazetteer reference table (national fallback), text-based, never re-hitting Census for non-address input |

## Stack Patterns by Variant

**If the input string parses cleanly as `lat,lng` (or `lat lng`, decimal, in-range):**
- Skip all name/address resolution entirely.
- Go straight to the PostGIS `ST_Covers` coordinate-lookup endpoint (mirrors `getElectionsByCoordinate`'s geometry-matching pattern, but for officials).
- Because coordinates are already a point — geocoding a point would be a category error; there is nothing left to resolve except which polygon(s) it falls inside.

**If the input string looks like a full street address (leading house number + street-suffix-ish token):**
- Route to the existing `geocodeAddress()` (US Census one-line geocoder) — unchanged, already reliable for this exact input shape.
- Then feed the returned `{lat, lng, state}` into the same `ST_Covers` polygon match used above.
- Because this is the one input shape Census's geocoder is actually designed for and proven (in this codebase) to handle well.

**Otherwise (bare city / "city, state" / county / state name):**
- Try `essentials.governments` first via the extended `pg_trgm` + `f_unaccent` pattern (curated catalog — gets `hasContext`-quality routing for anywhere already deep-seeded).
- On no confident match, fall through to the new Gazetteer reference table (national — resolves to *at minimum* a state abbreviation, enough for the required "state + federal officials" fallback).
- On no match anywhere, fail gracefully with a plain "we couldn't find that location" message — do not chain to a third, paid API as a last resort.
- Because this input class is precisely where Census's address geocoder is known-unreliable, and precisely the shape our own curated + Gazetteer data is built to answer without any network call.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|------------------|-------|
| `@headlessui/react@2.2.10` | `react@^19.1.1`, `react-dom@^19.1.1` | Peer dep is `"react": "^18 \|\| ^19 \|\| ^19.0.0-rc"` — verified via `npm view`; no conflict with the pinned versions. |
| `@headlessui/react@2.2.10` (transitive `@floating-ui/react@^0.26.16`) | project's own `@floating-ui/react@^0.27.19` | Not a peer dependency — npm resolves/nests both ranges independently, no version-conflict error. The two won't collide because Headless UI's `Combobox` positioning is self-contained (its own `anchor` prop, confirmed via docs to not be floating-ui-backed for that feature) and shares no instance with the app's existing `@floating-ui/react` usage (Treasury-chip tooltip). |
| `pg_trgm` / `unaccent` (Postgres contrib extensions) | Any Postgres ≥ 9.1 (already running in production since migration 040) | Ships in Postgres core `contrib`; no version-pinning risk. Both already installed under the `extensions` schema (the exact schema qualifier used throughout `campaignFinanceSearchService.ts`). |
| Census Gazetteer 2025 vintage | No code dependency — pure static data | Use the same-or-adjacent vintage year as the most recent TIGER geofence load already in the repo for internal consistency (project currently on `TIGER2024`/`cd119`); a one-year gap between Gazetteer and TIGER vintages is immaterial here (only centroid + state/GEOID are needed, not precise boundaries). |

## Sources

- `C:\EV-Accounts\backend\migrations\040_pg_trgm_search.sql` — confirmed `pg_trgm` + `unaccent` + `public.f_unaccent()` already live in production (HIGH — direct repo read)
- `C:\EV-Accounts\backend\src\lib\campaignFinanceSearchService.ts` — confirmed the exact production-proven `word_similarity()` + length-calibrated threshold + GIN-index fuzzy search pattern to extend (HIGH — direct repo read)
- `C:\EV-Accounts\backend\src\lib\geocodingService.ts` — confirmed current Census one-line geocoder usage/scope, PO Box/timeout/error handling already in place (HIGH — direct repo read)
- `C:\EV-Accounts\backend\src\lib\electionService.ts` (`getElectionsByCoordinate`) — confirmed existing `ST_Covers` coordinate-lookup pattern to reuse (HIGH — direct repo read)
- `node_modules/@empoweredvote/ev-ui` (`package.json` v0.9.8, full named-export enumeration via Node) — confirmed no combobox/autocomplete primitive exists in ev-ui today (HIGH — direct inspection)
- `essentials/package.json` — confirmed `@googlemaps/js-api-loader@^2.0.2` still present as a dead Google Places remnant to remove (HIGH — direct repo read)
- `npm view @headlessui/react@latest version peerDependencies dependencies` — v2.2.10, React 18/19 peer support, transitive deps enumerated (HIGH — live registry query)
- `npm view downshift@latest version peerDependencies` — v9.4.0, `react: ">=16.12.0"` (HIGH — live registry query)
- `npm view @floating-ui/react@latest` / `npm view coordinate-parser@latest` / `npm view parse-dms@latest` — version currency checks (HIGH — live registry query)
- https://headlessui.com/react/combobox — confirmed `Combobox`/`ComboboxInput`/`ComboboxOptions`/`ComboboxOption` API and built-in `anchor` positioning prop (MEDIUM — WebFetch of official docs; registry `dependencies` field cross-confirmed it is not floating-ui-backed for that feature)
- https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html — confirmed official Gazetteer Files download location, `2025_Gaz_place_national.zip` / `2025_Gaz_counties_national.zip` URL pattern, pipe-delimited format (HIGH — official government source)
- Project `.planning/PROJECT.md` Key Decisions table — "Census Geocoder unreliable with city+state; also returns wrong-district races" (v2.0) — the specific prior-art reason city/county text queries must not be routed through the address geocoder (HIGH — internal project record)

---
*Stack research for: Essentials Results-Page Search & Header Overhaul (v24.0) — unified location search*
*Researched: 2026-07-20*
