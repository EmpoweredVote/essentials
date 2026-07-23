# Project Research Summary

**Project:** Essentials — Results-Page Search & Header Overhaul (v24.0)
**Domain:** Unified civic location search (single combobox resolving address / city-county-state name / coordinates → officials profile) + header/filter declutter, added to an existing React 19 + Express/PostGIS civic-officials app
**Researched:** 2026-07-20
**Confidence:** HIGH

## Executive Summary

v24.0 replaces Essentials' cluttered multi-row results header with one always-editable combobox that must silently dispatch any US-shaped input — full street address, bare city/county/state name, or raw coordinates — to the right resolver and land the user on a coherent location profile, guaranteeing at minimum state + federal officials anywhere in the US. This is not a single-geocoder problem: it is a **clean three-way branch**. Coordinates skip geocoding entirely and go straight to the existing PostGIS `ST_Covers` pattern (`getElectionsByCoordinate`). Full street addresses keep using the existing, proven, free US Census one-line geocoder unchanged. Bare city/county/state names — explicitly *not* street addresses — must NOT be routed through the Census address endpoint (already burned once, on record in Key Decisions: "Census Geocoder unreliable with city+state; also returns wrong-district races") and instead need a brand-new backend name-resolver querying the project's own `essentials.governments`/`geofence_boundaries` tables via the already-proven `pg_trgm`/`unaccent` fuzzy-match pattern from `campaignFinanceSearchService.ts`, extended with a one-time Census Gazetteer ingest for nationwide place coverage beyond the ~20 states already deep-seeded.

The recommended approach requires almost no new infrastructure: zero new Postgres extensions (pg_trgm/unaccent are already live via migration 040), one new frontend dependency (`@headlessui/react` for an accessible Combobox — ev-ui ships no combobox primitive), a build-time ingest of the free US Census Gazetteer Files, and a handful of new/extracted backend functions that reuse existing SQL almost verbatim. The national-fallback promise is *mostly already free*: the statewide query (Senate + state execs) already runs unconditionally whenever a state is known, independent of whether local geofences exist. The one honest, documented gap is US House — it requires G5200 congressional-district geofences per state, and where those aren't loaded, House is correctly omitted (null-on-miss), not fabricated. This is a scope/caveat decision for the roadmapper, not a blocker.

The dominant risk is not the technology — it's **repeating this codebase's own prior incidents**: silently rendering the wrong state's officials with full visual confidence (has already happened twice, for two different root causes), and silently emptying a tab via a shared filter-default when the milestone explicitly calls out an exception for it (the Judges tab). Both failure modes are well-understood and preventable with disambiguation-by-design and per-tab state, respectively — but only if the roadmap ships the guardrail in the *same* phase as the feature that creates the risk, not as a follow-up fix.

## Key Findings

### Recommended Stack

This milestone needs **at most one new npm dependency and zero new Postgres extensions.** `pg_trgm` + `unaccent` are already enabled in production and already power a mature fuzzy-name-search pattern that should be extended (not reinvented) to place names. Coordinate lookup reuses the existing `ST_Covers` pattern with no geocoder involved at all. The single real capability gap — national fallback for places outside the curated catalog — is solved with a build-time Census Gazetteer ingest, not a live third-party geocoder.

**Core technologies:**
- `@headlessui/react` (^2.2.10) — accessible `Combobox` primitive for the unified field; ev-ui@0.9.8 exports no combobox/listbox primitive (verified by full named-export enumeration); built by the Tailwind team, so it slots under existing Tailwind/ev-ui tokens with zero design conflict; confirmed peer-compatible with React 19.
- PostgreSQL `pg_trgm` + `unaccent`/`f_unaccent()` — already live since migration 040; reuse verbatim; extend the exact `word_similarity()` + GIN-index pattern from `campaignFinanceSearchService.ts` to `essentials.governments.name` and the new Gazetteer table (new migration, not a new extension).
- PostGIS `ST_Covers` — already in use via `getElectionsByCoordinate`; the new coordinate endpoint reuses this exact geometry-matching pattern for officials, since coordinates are already a point with nothing left to geocode.
- US Census one-line address geocoder — keep scope unchanged; already reliable for genuine street addresses; do not widen its use to city/county/state-only queries (burned once already, on record).
- US Census Gazetteer Files (Places + Counties) — new, but free/no-key/zero-dependency; ingested once into a small reference table with the same pg_trgm GIN pattern; this is the actual mechanism that makes "Springfield, IL" (a state Essentials hasn't deep-seeded) resolve to at least IL's state+federal officials, since the curated catalog only covers ~20 states but the Gazetteer covers all ~29,000 incorporated places + all 3,143 counties.
- Removal: `@googlemaps/js-api-loader` — dead Google Places remnant still present in `essentials/package.json`; uninstall as part of this milestone's cleanup.
- Explicitly rejected: any paid geocoder (Mapbox/HERE/Geocodio/SmartyStreets), Nominatim as a live dependency, a dedicated search engine (Algolia/Typesense/Elasticsearch), `react-select`/MUI Autocomplete/`cmdk`, and micro-packages for coordinate parsing (hand-write a ~30-line parser instead).

### Expected Features

**Must have (table stakes):**
- Single field accepts address, city, city+state, county, state, and coordinates with no mode switch — requires an input classifier that routes before hitting any single resolver.
- Typeahead suggestions while typing, debounced 200-300ms, capped ~5-8 results.
- Disambiguation of duplicate place names with `City, ST` / `County, ST` / `ST` labels in every suggestion row — never a bare ambiguous name (the "Springfield problem": 41+ US Springfields).
- Graceful "no match" state — never a silent blank result or crash.
- Enter-to-submit raw text without requiring a dropdown click.
- Pre-filled, instantly-editable "current location" affordance (the milestone's explicit design goal).
- National fallback: any resolvable US input returns at least state + federal officials — flagged as a dependency gap pending 50-state CD/state geofence confirmation, not an assumption to bake in blindly.
- Basic ARIA combobox semantics from day one (role, aria-expanded/controls/activedescendant, keyboard nav) — not a bolt-on.

**Should have (differentiators):**
- One field truly unifying all input types with silent classification (the actual point of v24.0 — the field itself is the differentiator).
- Coordinate paste support (decimal degrees now; DMS as a v1.x stretch).
- Own-data typeahead replacing Google Places entirely (trust/privacy positioning, matches existing "No Google Places" constraint).
- Anonymous-first — no forced geolocation prompt on load; opt-in icon only, consistent with the existing `ev:autoOpenMyLocation` opt-in precedent.

**Defer (v2+):**
- DMS coordinate parsing, opt-in "use my location" button, suggestion-list virtualization, cross-street/intersection parsing, promoting the component into `@empoweredvote/ev-ui`.

**Anti-features to explicitly avoid:** auto-triggering the browser geolocation prompt on load; requiring a suggestion pick before submit; ZIP-only as the primary input signal; re-adding "Search by name" inside the location field; restoring the old LocationBrowser tree "as a safety net"; international address support.

### Architecture Approach

This is a refactor/integration question, not a greenfield build — all findings are grounded in direct reads of both repos. `LocationSearch.jsx` (new) becomes one component with one `onResolve({kind, ...})` callback replacing today's four coordinated moving parts (mode toggle, Google-bound address input, `LocalityMatches`, `LocationBrowser`); it is a **pure dispatcher** that decides which existing URL/fetch path applies and never fetches representatives itself for name/state matches, keeping `Results.jsx`'s large existing URL-param-driven fetch-effect hierarchy untouched. On the backend, `getRepresentativesByAddress` is split so job (2) — running the district/statewide/tribal PostGIS queries against a point — is factored into a new standalone `getRepresentativesByCoordinate(lat, lng, {state?})`, with `getRepresentativesByAddress` becoming a thin `geocodeAddress()` -> delegate wrapper. A new `locationSearchService.ts` (its own file, since it returns place names not politicians) runs the pg_trgm/word_similarity query over `geofence_boundaries` + `governments`, exposed via a new `GET /essentials/location-search` route, alongside a new dedicated `POST /candidates/by-coordinate` route (never overloading `/candidates/search`'s address-string-specific contract with shape-sniffing).

**Major components:**
1. `LocationSearch.jsx` (frontend, new) — single combobox; classifies input; dispatches to name-resolver, coordinate endpoint, or address search; renders inline matches.
2. `src/lib/placeSearch.js` (frontend, new) — pure input classifier (address-shaped vs. name-shaped heuristic, e.g. leading digit) + thin API wrappers; kept separate from `coverage.js` (the static, hand-curated Landing-page catalog) to avoid conflating "curated grid" with "live DB-truth search."
3. `getRepresentativesByCoordinate()` (backend, new/extracted, in `essentialsService.ts`) — shares helpers/SQL with `getRepresentativesByAddress`; the enclave-alias correction (`ENCLAVE_CITY_ALIASES`) stays address-string-only since a raw coordinate or resolved place has no address string to pattern-match — a known, small, documented gap.
4. `locationSearchService.ts` (backend, new) — pg_trgm-ranked place-name search over `geofence_boundaries` + `governments`, unioned with a static 50-state name/abbreviation list for exact state resolution.
5. `essentialsBrowseService.ts` (`getStatewideOfficials`/`getFederalOfficials`, unchanged) — reused as-is as the national-fallback data source; the statewide query already runs unconditionally on state, independent of district-row results.

**Suggested backend -> frontend build order** (from ARCHITECTURE.md, respecting the cross-repo Render-deploy dependency — backend must ship and be smoke-tested before frontend consumes it):
1. Migration: pg_trgm GIN indexes on `geofence_boundaries.name` and `governments.name`.
2. Extract `getRepresentativesByCoordinate()` from `getRepresentativesByAddress()`; regression-safe, no route change yet.
3. New routes `POST /candidates/by-coordinate` and `GET /location-search`; deploy + curl/Postman smoke-test before any frontend work starts.
4. Frontend library layer: `placeSearch.js` + 2 new `api.jsx` functions, unit-testable against the live backend with no UI changes.
5. Build `LocationSearch.jsx` against the library layer; wire alongside (not yet replacing) the old header; add the new `?lat=&lng=` URL-param fetch branch.
6. Swap-in + retire: replace the old header block, delete `LocalityMatches.jsx`/`LocationBrowser.jsx`/`useGooglePlacesAutocomplete.js`/`localitySearch.js`, remove the Google dependency + env var.
7. `Landing.jsx` parity — point its search bar at the same `LocationSearch`/`placeSearch.js` stack (required, not optional — see Pitfalls/Anti-Pattern 1 below).
8. Header-decluttering pass (can parallelize with 5-7, no dependency on the search rewrite): `FilterBar.jsx` default-Elected + Judges exception, remove "Search by name," compass lenses -> icon buttons + tooltips.

### Critical Pitfalls

1. **National fallback confidently shows the WRONG state's officials** — this exact failure mode has already happened *twice* in this codebase for two different root causes (stale-state URL-param bleed fixed 2026-06-28; stray `representing_city` banner hijack fixed 2026-07-12), both sharing the pattern "a fallback/default value silently wins when the correct value is empty or ambiguous." The name-resolver must return a confidence/ambiguity signal and force a disambiguation UI whenever more than one candidate exists — never derive the fallback state from a loose substring match. Test against "Franklin, VA" and "Baltimore" (dual-tier: G4110 city + G4020 county). Owned by the backend name-resolver / national-fallback phase; disambiguation UX must ship in the *same* phase as the resolver.

2. **Defaulting the type filter to "Elected" silently empties the Judges tab** — Representatives/Educators/Judges share **one global `appointedFilter` state variable**; flipping the default to `'Elected'` without splitting per-tab state or force-overriding Judges to `'All'` will hide appointed judges (merit selection, interim, not-yet-facing-retention) with no indication anything was filtered. Must ship the per-tab exception in the *same phase* as the default change — this is explicitly called out in the milestone goal, so shipping one without the other is a same-phase regression, not a future fix. Test at Bloomington, IN (a location with real geo-linked judge data) — CA's Judges tab is empty regardless due to a separate NULL-`geo_id` gap and will mask this regression.

3. **Census one-line geocoder can't classify bare city/county/state input** — it is an address matcher tuned to TIGER address ranges, not a places/administrative-boundary API; a naive swap-in for Google's structured Geocoder will silently degrade every non-address query to "no match" -> address-search fallback -> `ADDRESS_NOT_FOUND`, defeating the milestone's core promise. Classify input shape locally first (leading digit/street-suffix -> address; else -> DB place-name resolver); reserve Census strictly for street-address-shaped input. Test "Springfield, IL" (no street number) resolves usefully, not a 422.

4. **No `pg_trgm`/trigram index exists yet for name search** — the only existing name-lookup query does an exact state-scoped match; a naive nationwide `ILIKE '%query%'` sequential-scans the whole `geofence_boundaries` table on every keystroke-adjacent query, and this project has already hit and fixed a near-identical unindexed-query performance incident once (`project_geofence_overlap_perf`). Ship the GIN trgm index migration in the *same* phase/PR as the query that needs it, and use `word_similarity()`/`%>`-style trigram-idiomatic queries, not leading-wildcard `ILIKE`.

5. **Anonymous coordinate endpoint reuses the wrong privacy model, or mishandles lat/lng order** — the existing coordinate-based RPC (`connect.resolve_user_local_officials`) is built entirely around already-vaulted, already-consented coordinates for a known Connected user; the new endpoint is a fundamentally different, anonymous, stateless surface and must never touch vault/write paths, must validate US bounding-box ranges server-side (catching swapped `lat`/`lng` — Census/PostGIS both expect `(lng, lat)` order, already a documented in-repo footgun), and should prefer POST body over `?lat=&lng=` query params to avoid coordinate leakage into logs/analytics/Referer headers.

## Implications for Roadmap

Based on combined research, the milestone naturally splits into a backend-first "own the search stack" track (highest risk, must be built and unit-tested before frontend consumes it) and a largely-independent header-declutter track (lower risk, can run in parallel).

### Phase 1: Backend name-resolver + Gazetteer ingest + pg_trgm indexing
**Rationale:** This is the single highest-risk piece of the milestone (Pitfall 3) and the true "own the search stack" deliverable — it must exist and be unit-tested against a full input matrix (address/city/county/state/coords) before the frontend combobox has anything real to consume. Also the natural home for the pg_trgm index migration (Pitfall 4/10), which must ship in the same PR as the query that needs it.
**Delivers:** `NNN_place_name_trgm_search.sql` migration (GIN indexes on `geofence_boundaries.name` and `governments.name`); one-time Census Gazetteer Places+Counties ingest into a new reference table; `locationSearchService.ts::searchPlaceNames()` returning ranked candidates with a confidence/ambiguity signal, disambiguated by state and area-type (Baltimore city vs. county; consolidated city-counties); `GET /essentials/location-search?q=` route, modeled on the existing `search-by-name` typeahead pattern.
**Addresses:** Table-stakes disambiguation, national fallback place coverage, own-data typeahead (FEATURES.md).
**Avoids:** Pitfall 1 (wrong-state fallback), Pitfall 3 (Census misclassification), Pitfall 4/10 (no trigram index), Pitfall 8 (Springfield/Baltimore collisions), Pitfall 9 (curated catalog divergence — must query the DB table directly, not a second hand-maintained list).

### Phase 2: Coordinate lookup endpoint (own backend surface)
**Rationale:** A structurally distinct anonymous, stateless surface from both the address path and the existing authenticated vaulted-coordinate RPC — deserves its own phase with privacy review and bounds-validation as explicit success criteria, not folded into Phase 1's name-resolver work.
**Delivers:** `getRepresentativesByCoordinate()` extracted from `getRepresentativesByAddress()` in `essentialsService.ts` (same file, shared helpers, enclave-alias correction stays address-only); new `POST /candidates/by-coordinate` route; US bounding-box validation catching swapped lat/lng; no vault writes, no raw-coordinate logging/echoing, POST body (not query string) for the request.
**Uses:** PostGIS `ST_Covers`, modeled directly on `getElectionsByCoordinate` (STACK.md, ARCHITECTURE.md Pattern 1/3).
**Avoids:** Pitfall 6 (privacy-model misuse), Pitfall 7 (swapped/out-of-bounds coordinates).

### Phase 3: Frontend unified combobox + Google Places removal (Results.jsx + Landing.jsx)
**Rationale:** Cannot start meaningfully until Phase 1 and 2 are live and smoke-tested (cross-repo Render-deploy dependency). Must cover both `Results.jsx` and `Landing.jsx` in the same phase — they share the exact same Google-bound modules (`useGooglePlacesAutocomplete.js`, `localitySearch.js`, `LocalityMatches.jsx`); leaving `Landing.jsx` on the old stack means Google Places is not actually "dropped entirely" per the milestone goal, and `Landing.jsx` will break outright if those modules are deleted out from under it.
**Delivers:** `LocationSearch.jsx` (`@headlessui/react` Combobox) wired into `Results.jsx`'s existing URL-param branching via `onResolve` + `navigate()`; new `?lat=&lng=` fetch branch; `placeSearch.js` input classifier; `searchPlaceNames()`/`fetchRepresentativesByCoordinate()` added to `api.jsx`; deletion of `LocalityMatches.jsx`, `LocationBrowser.jsx`, `useGooglePlacesAutocomplete.js`, `localitySearch.js`; `@googlemaps/js-api-loader` uninstalled; `Landing.jsx` search bar repointed at the same stack; full-repo grep for `google`/`pac-container`/`window.google` returning zero hits.
**Implements:** ARCHITECTURE.md's "combobox as pure dispatcher" pattern; FEATURES.md's P1 table-stakes list (typeahead, disambiguation UI, Enter-to-submit, pre-filled/editable field, ARIA combobox semantics from day one).
**Avoids:** Pitfall 5 (live Census calls per keystroke — debounce contract with the backend resolver must be explicit going in), Pitfall 11 (Google-specific hacks left behind: the keydown-race listener and `pac-container` CSS suppression built to fight Google's own dropdown), Pitfall 9 (must visually distinguish curated/deep-seeded matches from bare DB-only fallback matches).

### Phase 4: Header/filter declutter (default Elected + Judges exception, compass lens icon buttons, remove Search-by-name)
**Rationale:** Touches `FilterBar.jsx`/`CompassControlsBar.jsx`/`LensChipRow.jsx` only, with no dependency on the search rewrite — can be planned and built in parallel with Phases 1-3, but must ship the Elected-default and the Judges exception together (Pitfall 2) as a single atomic change, not sequenced as "default now, exception later."
**Delivers:** Per-tab `appointedFilter` state (or a centralized force-override for `effectiveActiveView === 'judges'`); removed All/Appointed dropdown outside Judges; compass lens chips converted to icon-only buttons with explicit `aria-label`s (gavel already exists in `renderLensIcon` for Judicial — no new iconography needed) and a preserved tap-to-reveal/focus-tooltip affordance for touch and keyboard users; removed "Search by name" filter input.
**Avoids:** Pitfall 2 (Judges tab silently emptied), Pitfall 12 (icon-only buttons losing accessible names/touch affordance).

### Phase Ordering Rationale

- **Backend-before-frontend is the one hard dependency** the research surfaces repeatedly: both new backend endpoints must ship and be Render-deployed before the frontend combobox can be meaningfully built or tested against them (cross-repo constraint already documented in PROJECT.md).
- **Name-resolver before coordinate-endpoint, both before frontend:** the name-resolver is the highest-risk piece (Census can't classify bare place names; disambiguation is architecturally load-bearing) and should be proven with unit tests against a full input matrix before any UI depends on it. The coordinate endpoint is architecturally simpler (pure `ST_Covers`, no text classification) but has its own dedicated privacy/bounds-validation risk cluster, so it's cleaner as its own phase rather than folded into the resolver phase.
- **Landing.jsx must ride along with the Results.jsx combobox phase, not a separate later phase** — see Anti-Pattern 1 in PITFALLS.md/ARCHITECTURE.md: both pages import the exact same Google-bound modules, so a partial removal leaves Landing.jsx broken or leaves Google Places only half-dropped.
- **Header declutter is deliberately decoupled** so it doesn't block or get blocked by the search rewrite — it can be planned, built, and even shipped independently, as long as its own internal atomicity rule (Elected-default + Judges exception together) is respected.

### Research Flags

Phases likely needing deeper research during planning (`/gsd:plan-phase --research-phase <N>`):
- **Backend name-resolver phase (Phase 1):** the disambiguation-candidate contract (what fields/confidence signal the frontend needs), the exact Gazetteer ingest schema/vintage choice, and the ranking formula for curated-vs-Gazetteer-vs-exact-state matches all need concrete design decisions before coding, not just "extend the existing pattern."
- **Frontend combobox phase (Phase 3):** the debounce/live-typeahead contract between frontend and backend (Pitfall 5) and the exact visual treatment for "this is a fallback, not a full local match" (UX Pitfalls table) need explicit design before build, since both are easy to get subtly wrong.

Phases with standard, well-documented patterns (can skip a dedicated research-phase pass):
- **Coordinate lookup endpoint (Phase 2):** directly modeled on `getElectionsByCoordinate`, an existing in-repo pattern; the main net-new work (bounds validation, privacy separation) is a checklist, not an open design question.
- **Header/filter declutter (Phase 4):** the gavel icon and per-lens SVGs already exist (`renderLensIcon`); the filter-state fix is a known, bounded refactor with a clear regression test (Bloomington, IN Judges tab).

## Open Questions for the Roadmapper

1. **Nationwide congressional-district (G5200) coverage — gate vs. caveat?** The "any resolvable US input returns at least state + federal officials" claim is only *fully* true for US House where CD geofences are already loaded; for states without them, House is honestly omitted (null-on-miss, matching existing `tribal_land`/`resolvePopulation` convention) while Senate + state execs still render. Decide explicitly: ship with an honest Senate-only fallback caveat in ungeofenced states now, or treat full 50-state CD coverage as a pre-flight gate before claiming "guaranteed state + federal" in the milestone's own language. This is a data-completeness decision, not a code dependency, and research strongly recommends *not* silently assuming coverage is complete.
2. **Does `Landing.jsx` get its own phase, or ride along inside the combobox-removal phase?** Both approaches are defensible from a planning-granularity standpoint, but architecturally it must NOT be deferred past the phase that deletes the shared Google-bound modules — whichever phase structure the roadmapper picks, `Landing.jsx` parity must complete in the same milestone, ideally the same phase as the `Results.jsx` swap-in.
3. **What happens to `hasContext`/Stances badge fate for DB-only (non-curated) matches?** FEATURES.md and PITFALLS.md both flag that suggesting a place with no local officials (a skeletal government row surfaced only via the Gazetteer/DB fallback) needs a clearly-labeled, honest landing experience distinct from a full local match — but the exact UI treatment (badge copy, chip styling, whether it reuses the existing purple "coverage chip" convention inverted, or is a wholly new visual state) is not settled by research and should be a roadmap/design decision, not left implicit.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Every recommendation is grounded in direct reads of the live production codebase (migration 040, `campaignFinanceSearchService.ts`, `geocodingService.ts`, `electionService.ts`) plus live npm-registry version/peer-dependency checks; the one external addition (`@headlessui/react`) was verified for React 19 compatibility directly. |
| Features | MEDIUM | WAI-ARIA/geocoding mechanics are HIGH (W3C/Census official docs); competitive-UX conclusions (typeahead debounce timing, disambiguation norms, ZIP-accuracy risk) rest on multiple corroborating secondary sources (5 Calls, house.gov, UX pattern libraries) rather than a single authoritative spec — reasonable but not primary-source-grade for every claim. |
| Architecture | HIGH | All findings are direct reads of both repos' current source (essentials frontend + accounts-api backend); this was an integration/refactor question answerable entirely from the existing codebase, not an external-ecosystem question. |
| Pitfalls | HIGH | Every pitfall is grounded in this project's own source code and, notably, its own documented prior incidents (two real live bugs matching the exact new failure-mode shape, one real prior performance incident matching the exact new query-pattern risk) — not generic web-search advice. |

**Overall confidence:** HIGH

### Gaps to Address

- **50-state congressional-district (G5200) geofence coverage is not confirmed complete** — FEATURES.md and ARCHITECTURE.md both flag this as the single biggest hidden dependency for the "guaranteed state + federal" claim. Treat as a pre-flight audit item in Phase 1's planning, not an assumption; resolve via Open Question 1 above.
- **Exact API response shape for disambiguation candidates** (what the name-resolver returns when multiple matches exist — field names, confidence scoring, ranking tie-breaks for city/county collisions) is described conceptually across STACK/ARCHITECTURE/PITFALLS but not fully specified as a contract; needs to be nailed down at the start of Phase 1's planning so the frontend combobox (Phase 3) isn't guessing at a moving target.
- **Visual/copy treatment for national-fallback vs. full-local-match vs. DB-only-no-local-data states** is identified as necessary (three distinct UX states) but not designed; flagged as a Phase 3 research item.
- **Debounce/rate-limit contract between frontend typeahead and backend** (which calls are safe to fire per-keystroke vs. submit-only) is described as an architectural constraint that must be *stated* going into the frontend phase, not discovered during build — no concrete numbers are locked yet beyond industry-convention ranges (200-300ms, min 2-3 chars).

## Sources

### Primary (HIGH confidence)
- Direct repo reads: `C:\EV-Accounts\backend\migrations\040_pg_trgm_search.sql`, `src\lib\campaignFinanceSearchService.ts`, `src\lib\geocodingService.ts`, `src\lib\essentialsService.ts`, `src\lib\electionService.ts`, `src\lib\essentialsBrowseService.ts`, `src\routes\{essentialsCandidates,essentialsBrowse}.ts`
- Direct repo reads: `C:\Transparent Motivations\essentials\src\pages\{Results,Landing}.jsx`, `src\lib\{coverage,api,localitySearch}.js`, `src\hooks\useGooglePlacesAutocomplete.js`, `src\components\{LocalityMatches,LocationBrowser,FilterBar,CompassControlsBar,LensChipRow}.jsx`
- `node_modules/@empoweredvote/ev-ui` package inspection (v0.9.8, full named-export enumeration)
- `npm view` live registry queries for `@headlessui/react`, `downshift`, `@floating-ui/react`, `coordinate-parser`, `parse-dms`
- US Census Geocoding Services API official docs; Census Gazetteer Files official download page
- `.planning/PROJECT.md` — Key Decisions table, milestone goal/scope, constraint history

### Secondary (MEDIUM confidence)
- W3C WAI-ARIA APG Combobox Pattern + MDN ARIA combobox role (HIGH for spec, cited here for feature-completeness cross-check)
- 5 Calls / house.gov / My Reps (DataMade) / Common Cause competitor documentation — ZIP-accuracy risk, opt-in geolocation norms, national-fallback expectations
- Map UI Patterns, UXmatters, Yext — location-search UX convention corroboration
- SystemDesignSchool / Atomic Object — typeahead debounce/minLength industry conventions

### Tertiary (LOW confidence)
- None flagged — all research legs cite HIGH or MEDIUM sources; no single-source/unverified claims were carried into this summary's roadmap implications.

---
*Research completed: 2026-07-20*
*Ready for roadmap: yes*
