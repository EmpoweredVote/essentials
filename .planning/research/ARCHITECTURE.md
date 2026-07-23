# Architecture Research

**Domain:** Unified location search & header overhaul — civic-lookup app (essentials frontend + accounts-api backend)
**Researched:** 2026-07-20
**Confidence:** HIGH (all findings grounded in direct reads of the current codebase in both repos — no external ecosystem research was needed; this is an integration/refactor question, not a "what exists in the wild" question)

## Standard Architecture

### System Overview

```
┌───────────────────────────────────────────────────────────────────────────┐
│  essentials (frontend, React 19 + Vite, Render)                           │
│                                                                             │
│  ┌───────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │ LocationSearch (NEW)      │   │ Results.jsx (MODIFIED, not rewritten)│  │
│  │ single combobox            │──▶│  URL-param-driven fetch effects:    │  │
│  │  - address heuristic       │   │   ?q=            -> address branch  │  │
│  │  - name-resolver calls     │   │   ?browse_geo_id= -> area branch    │  │
│  │  - "use my location"       │   │   ?browse_government_list=          │  │
│  │  - inline match dropdown   │   │   ?browse_state_officials=          │  │
│  └───────────┬────────────────┘   │   ?lat=&lng=      -> NEW coord branch│  │
│              │                    └───────────────┬─────────────────────┘  │
│              ▼                                    ▼                        │
│  ┌───────────────────────────┐   ┌─────────────────────────────────────┐  │
│  │ src/lib/placeSearch.js     │   │ src/lib/api.jsx (MODIFIED: 2 new fns)│  │
│  │ (NEW) input classifier:    │   │  searchPlaceNames()                 │  │
│  │  digit-leading -> address  │   │  fetchRepresentativesByCoordinate() │  │
│  │  else -> name resolver     │   └───────────────┬─────────────────────┘  │
│  └────────────────────────────┘                   │                        │
│  RETIRED: useGooglePlacesAutocomplete.js,          │                        │
│  localitySearch.js, LocalityMatches.jsx,           │                        │
│  LocationBrowser.jsx                               │                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                                     │ HTTPS (publicFetch/apiFetch)
                                                     ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  accounts-api (backend, Express/TS, Render, C:\EV-Accounts)               │
│                                                                             │
│  ┌────────────────────────────────┐  ┌───────────────────────────────┐    │
│  │ essentialsCandidates.ts         │  │ essentialsBrowse.ts (existing)│    │
│  │  POST /candidates/search        │  │  GET  /browse/states/:s/areas │    │
│  │  POST /candidates/by-coordinate │  │  GET  /browse/states/:s/officials│ │
│  │  (NEW)                          │  │  GET  /browse/federal/officials│   │
│  │  GET  /location-search (NEW,    │  │  POST /browse/by-area          │  │
│  │   or new route file)            │  │  POST /browse/by-government-list│ │
│  └──────────────┬───────────────────┘  └───────────────┬────────────────┘  │
│                 ▼                                       │                  │
│  ┌────────────────────────────────┐                     │                  │
│  │ essentialsService.ts            │                     │                  │
│  │  geocodeAddress() [Census]      │                     │                  │
│  │  getRepresentativesByAddress()  │                     │                  │
│  │    -> thin wrapper (MODIFIED)   │                     │                  │
│  │  getRepresentativesByCoordinate │                     │                  │
│  │    (NEW — factored out)         │                     │                  │
│  └──────────────┬───────────────────┘                     ▼                 │
│                 ▼                          ┌───────────────────────────┐    │
│  ┌────────────────────────────────┐        │ essentialsBrowseService.ts│    │
│  │ locationSearchService.ts (NEW)  │        │  getStatewideOfficials()  │    │
│  │  searchPlaceNames() — pg_trgm   │        │  getFederalOfficials()    │    │
│  │  ILIKE/word_similarity over     │        │  getAreasForState()       │    │
│  │  geofence_boundaries + governments│      │  (existing — national     │    │
│  └──────────────┬───────────────────┘        │  fallback reuses these)  │    │
│                 ▼                             └───────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ Postgres/PostGIS — essentials.geofence_boundaries, .governments,      │   │
│  │ .districts, .offices, .politicians  (+ NEW: pg_trgm GIN indexes on    │   │
│  │ geofence_boundaries.name / governments.name)                          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Repo | Responsibility | New / Modified |
|-----------|------|-----------------|-----------------|
| `LocationSearch.jsx` | essentials | Single always-editable combobox; classifies input, dispatches to the right fetch path, renders inline typeahead matches | **NEW** |
| `src/lib/placeSearch.js` | essentials | Pure input classifier (address-shaped vs name-shaped) + thin wrappers for the 2 new backend calls | **NEW** |
| `Results.jsx` header block (~1955–2104) | essentials | Hosts the combobox; owns the URL-param → fetch-effect branching that already exists | **MODIFIED** (extend, not rewrite) |
| `FilterBar.jsx` | essentials | Type dropdown + name search + compass toggle | **MODIFIED** (default Elected, hide dropdown except Judges tab, drop name search) |
| `GET /essentials/location-search` | accounts-api | Place-name → ranked `{geo_id, mtfcc, label, state, kind}` candidates | **NEW** route |
| `POST /essentials/candidates/by-coordinate` | accounts-api | `{lat,lng,state?}` → representatives, same response contract as `/search` | **NEW** route |
| `locationSearchService.ts` | accounts-api | pg_trgm/ILIKE query over `geofence_boundaries` + `governments` | **NEW** service |
| `getRepresentativesByCoordinate()` | accounts-api | Point-in-polygon district/statewide/tribal query, factored out of the address path | **NEW** function (extraction) |
| `getRepresentativesByAddress()` | accounts-api | Geocode → delegate to `getRepresentativesByCoordinate` | **MODIFIED** (becomes thin wrapper) |
| `getStatewideOfficials()` / `getFederalOfficials()` | accounts-api | Statewide (Senate + state exec) / all-federal rosters | **UNCHANGED** — reused as the national-fallback data source |
| `useGooglePlacesAutocomplete.js`, `localitySearch.js`, `LocalityMatches.jsx`, `LocationBrowser.jsx` | essentials | Google Places binding, Google-Geocoder-based classifier, keyboard-capture typeahead, cascading dropdowns | **RETIRED** (deleted) |

## Recommended Project Structure

```
essentials/src/
├── components/
│   ├── LocationSearch.jsx        # NEW — replaces mode-toggle + address input +
│   │                             #   LocalityMatches + LocationBrowser as one unit
│   ├── FilterBar.jsx              # MODIFIED — per-tab type-filter default, drop name search
│   ├── LocalityMatches.jsx        # DELETE (folded into LocationSearch's match list)
│   └── LocationBrowser.jsx        # DELETE (folded into LocationSearch + existing coverage catalog)
├── lib/
│   ├── placeSearch.js             # NEW — isAddressLike(query), searchPlaceNames(), routing helper
│   ├── coverage.js                 # KEEP, narrowed scope — still backs the Landing page grid;
│   │                               #   its typeahead role (searchCoverageAreas) is superseded by
│   │                               #   the DB-backed resolver
│   ├── localitySearch.js          # DELETE (classifyQuery/resolveLocalityRoute — Google-based)
│   └── api.jsx                     # MODIFIED — + searchPlaceNames(), + fetchRepresentativesByCoordinate()
├── hooks/
│   └── useGooglePlacesAutocomplete.js  # DELETE
└── pages/
    ├── Results.jsx                 # MODIFIED — swap header block; add coordinate fetch branch
    └── Landing.jsx                 # MODIFIED (same-scope necessity — see Anti-Pattern note below)

accounts-api (C:/EV-Accounts/backend)/src/
├── routes/
│   ├── essentialsCandidates.ts      # MODIFIED — + POST /candidates/by-coordinate
│   ├── essentialsLocationSearch.ts  # NEW — GET /location-search?q=  (or fold into essentialsBrowse.ts)
│   └── essentialsBrowse.ts          # UNCHANGED — already provides the national-fallback endpoints
├── lib/
│   ├── essentialsService.ts         # MODIFIED — extract getRepresentativesByCoordinate()
│   ├── locationSearchService.ts     # NEW — searchPlaceNames(query, limit)
│   ├── essentialsBrowseService.ts   # UNCHANGED — getStatewideOfficials/getFederalOfficials reused
│   └── geocodingService.ts          # UNCHANGED — Census one-line geocoder, already Google-free
└── migrations/
    └── NNN_place_name_trgm_search.sql  # NEW — pg_trgm GIN indexes (models migration 040)
```

### Structure Rationale

- **`LocationSearch.jsx` as one new component, not three:** the current header has 4 moving parts (mode toggle, address input + Google autocomplete, `LocalityMatches`, `LocationBrowser`) coordinated entirely by `Results.jsx`'s local state (`searchMode`, `editingSearch`, `browseResults`). Collapsing them into one component with one `onResolve({kind, ...})` callback keeps `Results.jsx`'s existing URL-param branching (the real architecture of the page) untouched — the combobox only decides *which* URL to navigate to or *which* fetch to trigger; it does not own results rendering.
- **`placeSearch.js` separate from `coverage.js`:** `coverage.js` is a static, hand-maintained catalog (`COVERAGE_STATES`/`COVERAGE_COUNTIES`/`COVERAGE_SCHOOL_DISTRICTS`) that has drifted from the DB before (see "coverage.js reconciled" line items in project history) and is also the Landing-page grid's data source — a separate, legitimate use. The new name-resolver is DB-truth and typeahead-only; keeping it in its own module avoids conflating "curated landing grid" with "live search."
- **`getRepresentativesByCoordinate()` lives in `essentialsService.ts`, not a new file:** it shares `AddressSearchResult`, `PoliticianFlatRecord`, `pickCountyFromDistrictRows`, `pickJurisdictionFromDistrictRows`, `ENCLAVE_CITY_ALIASES`, and the district/statewide/tribal SQL text with `getRepresentativesByAddress` — same file as today, same precedent as `getElectionsByCoordinate` sitting next to `getElectionsByGeoIds` in `electionService.ts`.
- **`locationSearchService.ts` as its own file:** it queries different tables (`geofence_boundaries`, `governments`) than `essentialsService.ts`'s district/office/politician joins, and is conceptually closer to `essentialsBrowseService.ts` (browse/catalog concerns) — but since it returns raw *names*, not politicians, a dedicated small file avoids bloating either existing service file.

## Architectural Patterns

### Pattern 1: Factor "resolve identity" out of "resolve representatives"

**What:** `getRepresentativesByAddress(address)` currently does two jobs in one function: (1) turn an address string into `{lat, lng, state, city}` via `geocodeAddress()`, then (2) run the district/statewide/tribal PostGIS queries against that point. Split job (2) into `getRepresentativesByCoordinate(lat, lng, {state?, includeChallengers?})` and make job (1) a thin caller.
**When to use:** Any time multiple *input types* (address, coordinate, resolved place) need to reach the same *output* (representatives for a point). This is the same shape as `electionService.ts` already uses: `getElectionsByCoordinate(lat, lng)` exists standalone and `fetchDistrictRaceRows`/`fetchStatewideRaceRows` are shared helpers underneath it — precedent already lives in this codebase.
**Trade-offs:** The enclave-alias correction (`ENCLAVE_CITY_ALIASES`) is keyed on the *raw address string* ("if the address text names Maywood Park but Census returned Portland, substitute coordinates") — this logic is address-specific and must stay in `getRepresentativesByAddress`, not move into the coordinate function. A raw-coordinate or name-resolved input has no address string to pattern-match, so enclave correction is honestly skipped for those paths in v24.0 — a known, small, documented gap (enclave cities are rare; flag as a follow-up if a report surfaces).

**Example:**
```typescript
// essentialsService.ts — AFTER
export async function getRepresentativesByCoordinate(
  lat: number, lng: number,
  { state, includeChallengers = false }: { state?: string; includeChallengers?: boolean } = {}
): Promise<AddressSearchResult> {
  // districtQueryText / statewideQueryText / tribalQueryText — UNCHANGED SQL,
  // just parameterized directly on (lng, lat, state) instead of derived from geocodeAddress().
  const [districtResult, statewideResult, tribalResult] = await Promise.all([
    pool.query(districtQueryText, [lng, lat]),
    state ? pool.query(statewideQueryText, [state]) : Promise.resolve({ rows: [] }),
    pool.query(tribalQueryText, [lng, lat]),
  ]);
  // ... identical row-mapping / county / jurisdiction logic as today, returns AddressSearchResult
}

export async function getRepresentativesByAddress(
  address: string,
  opts: { includeChallengers?: boolean } = {}
): Promise<AddressSearchResult> {
  const { lat, lng, matchedAddress, state, city } = await geocodeAddress(address);
  const { lat: rLat, lng: rLng } = applyEnclaveAlias(address, lat, lng, matchedAddress, city); // address-only correction stays here
  const result = await getRepresentativesByCoordinate(rLat, rLng, { state, includeChallengers: opts.includeChallengers });
  return { ...result, matchedAddress };
}
```

### Pattern 2: Name resolver as a thin, dedicated ranked-search endpoint (not folded into `/candidates/search`)

**What:** A `GET /essentials/location-search?q=` endpoint that returns *places*, not *politicians* — modeled directly on the existing `GET /essentials/candidates/search-by-name?q=` (politician typeahead) and the pg_trgm pattern already proven in `campaignFinanceSearchService.ts` / migration `040_pg_trgm_search.sql`.
**When to use:** Any typeahead-shaped lookup where the caller types partial text and expects ranked candidates back on every keystroke (as opposed to a single geocode-and-commit action like address search).
**Trade-offs:** Requires a new pg_trgm GIN index (cheap, proven pattern already in this DB) on `geofence_boundaries.name` and `governments.name`. ILIKE alone (no index) would work correctly but degrade badly at scale as more states/cities get seeded — given the project has been adding ~10–30 new place rows per phase for over a year, indexing from day one avoids a future perf-pitfall phase.

**Example (query shape, modeled on `campaignFinanceSearchService.ts`):**
```sql
SELECT geo_id, name AS label, mtfcc, state, 'geofence' AS source,
       extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(name))) AS sim
FROM essentials.geofence_boundaries
WHERE mtfcc IN ('G4020','G4110','G4120','G4040','X0001','X0002','X0003')  -- same AREA_SEED_MTFCCS as getAreasForState
  AND public.f_unaccent(lower(name)) operator(extensions.%>) public.f_unaccent(lower($1))
UNION ALL
SELECT geo_id, name AS label, NULL AS mtfcc, state, 'government' AS source,
       extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(name))) AS sim
FROM essentials.governments
WHERE public.f_unaccent(lower(name)) operator(extensions.%>) public.f_unaccent(lower($1))
ORDER BY sim DESC
LIMIT 10;
```
Plus a hardcoded 50-state (+DC) name/abbreviation list (already exists client-side as `STATE_NAME_TO_ABBREV` in `coverage.js`; the equivalent constant already exists server-side in `essentialsBrowse.ts` as `STATE_FIPS`) unioned in or checked first, so "Texas" / "TX" resolves to `kind: 'state'` without needing a DB row.

### Pattern 3: National fallback = "statewide query already runs unconditionally" (mostly free)

**What:** In `getRepresentativesByAddress` today, the statewide query (`d.district_type IN ('NATIONAL_UPPER','NATIONAL_EXEC','STATE_EXEC','NATIONAL_JUDICIAL','JUDICIAL')`) runs *whenever `state` is known*, completely independent of whether the district/geofence query found any local rows. This means **Senate + state executives already come back "for free" as a fallback** in any state whose government has been seeded, even for a point with zero local geofence coverage — no new code needed for that half of "state + federal."
**When to use:** This is the shape to preserve in `getRepresentativesByCoordinate` — do not gate the statewide query on `districtResult.rows.length > 0`.
**Trade-offs — the real gap:** `getStatewideOfficials`/the statewide query intentionally **exclude `NATIONAL_LOWER` (US House)** because House membership is district-specific and can only be resolved via a congressional-district (G5200) point-in-polygon match — which is already inside the *district* query, not the *statewide* query. So:
  - If a state's CD (G5200) geofences ARE loaded, a point inside one already returns its House member through the normal district query — "no local rows" essentially can't happen there.
  - If a state's CD geofences are NOT loaded (true for many not-yet-onboarded states), House is honestly omitted — same "null-on-miss" convention already used for `tribal_land` and `resolvePopulation`. Do not fabricate a House member without geometry.
  - **This is a data-completeness dependency, not a code dependency.** If the roadmap's "at least state + federal (Senate/House)" claim must hold for literally any resolvable US address, nationwide CD geofence coverage becomes a prerequisite — flag this explicitly for the roadmapper as a scope decision (ship with honest Senate-only fallback in ungeofenced states now vs. gate on CD backfill first).

### Pattern 4: Combobox as a pure dispatcher over existing fetch paths

**What:** `LocationSearch` does not fetch representatives itself for name/state matches — it only figures out *which existing URL/fetch path* applies and either navigates (`coverageAreaToPath`-style, for browse targets) or calls one of `searchPoliticians()` / the new `fetchRepresentativesByCoordinate()` (for address/coordinate targets), exactly mirroring what `resolveLocalityRoute` + `handleAddressSearch` + `LocationBrowser.handleBrowse` do today, just unified behind one input.
**When to use:** Whenever a UI consolidation must not touch a large, already-correct downstream pipeline (here: `Results.jsx`'s 2,368-line hierarchy/tab/compass/filter machinery, which reads only `list`/`phase`/`browseResults`/`browseArea` — the combobox's job ends at producing those).
**Trade-offs:** Requires the combobox to replicate today's client-side heuristic for "does this look like a street address" (`/^\d/.test(raw)` in `coverage.js`) since name-resolver calls should not fire on every keystroke of a full address (wasted DB queries) and address-geocode calls should not fire on every keystroke of a place name (Census rate limits / latency). Keep this heuristic in `placeSearch.js`, not duplicated in the component.

## Data Flow

### Input Type 1 — Full street address

```
User types "123 Main St, Bloomington, IN"
    ↓ (Enter / debounced heuristic: leading digit -> address-shaped, skip name-resolver calls)
LocationSearch -> api.jsx searchPoliticians(query)
    ↓ POST /essentials/candidates/search  { query }        [UNCHANGED — already Google-free]
essentialsCandidates.ts -> getRepresentativesByAddress(query)
    ↓ geocodeAddress(query)  [Census one-line geocoder]     [UNCHANGED]
    ↓ getRepresentativesByCoordinate(lat, lng, {state})     [NEW factoring, same SQL]
    ↓ district + statewide + tribal PostGIS queries
Response: { politicians, tribal_land, county, jurisdiction } + X-Formatted-Address header
Results.jsx: same ?q= URL param branch as today, unchanged downstream rendering
```

### Input Type 2 — City / state / county name ("Bloomington", "Texas", "Pima County")

```
User types "Bloomington" (debounced ~250ms, non-digit-leading)
    ↓
LocationSearch -> api.jsx searchPlaceNames(query)
    ↓ GET /essentials/location-search?q=Bloomington          [NEW]
essentialsLocationSearch.ts -> locationSearchService.searchPlaceNames()
    ↓ pg_trgm/ILIKE over geofence_boundaries + governments + static state list
Response: ranked [{ geo_id, mtfcc, label, state, kind }]
LocationSearch renders inline matches (replaces LocalityMatches' role)
    ↓ user selects a match
  kind === 'state'                -> navigate(/results?browse_state_officials=<abbrev>)      [UNCHANGED endpoint]
  kind in {city,county,township…} -> navigate(/results?browse_geo_id=&browse_mtfcc=)          [UNCHANGED endpoint]
                                   -> or browse_government_list= for government-only rows       [UNCHANGED endpoint]
Results.jsx: existing browse-by-area / browse-by-government-list / browse-by-state
             URL-param branches, unchanged downstream rendering
```

### Input Type 3 — Raw coordinates ("Use my location" / lat,lng paste)

```
User clicks "Use my location"
    ↓ navigator.geolocation.getCurrentPosition()
LocationSearch -> api.jsx fetchRepresentativesByCoordinate(lat, lng)
    ↓ POST /essentials/candidates/by-coordinate  { lat, lng }      [NEW]
essentialsCandidates.ts -> getRepresentativesByCoordinate(lat, lng, {state: undefined})
    ↓ district query runs immediately (no geocode network round-trip needed)
    ↓ state derived the same way getElectionsByCoordinate derives it today:
       SELECT DISTINCT d.state FROM geofence_boundaries JOIN districts
       WHERE ST_Covers(geometry, ST_MakePoint(lng,lat))  LIMIT 1
    ↓ statewide query runs once state is known
Response: same wrapped shape as /candidates/search (no X-Formatted-Address — no address string exists;
          frontend uses a client-side reverse label or a generic "Your Location" chip)
Results.jsx: NEW ?lat=&lng= URL param branch, feeds the SAME list/phase state as the address branch
```

### Input Type 4 — National fallback (point/name resolves to a state, no local rows)

```
Any of the 3 flows above resolves lat/lng + state, but the district query returns 0 rows
    ↓ (this already happens automatically — statewide query is unconditional on state, not on district rows)
Response already includes: NATIONAL_UPPER (2 Senators) + STATE_EXEC + NATIONAL_EXEC + NATIONAL_JUDICIAL
Gap: NATIONAL_LOWER (US House) requires the SAME point to also fall inside a loaded G5200
     congressional-district geofence — if that geofence doesn't exist for this state, House
     is honestly omitted (matches tribal_land / resolvePopulation null-on-miss convention).
For NAME-ONLY state input (no point at all, e.g. typed "Texas" with no address):
     -> reuses the EXISTING browseByState() -> GET /browse/states/:state/officials
        (getStatewideOfficials) path unchanged — no new backend code needed for this sub-case.
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current (~8,000+ geofence rows, ~30 states partially seeded) | ILIKE + a GIN trigram index is more than sufficient; typeahead latency dominated by network round-trip, not query cost |
| All 50 states + DC seeded (project's stated long-term direction) | Same index scales fine (trigram GIN indexes are designed for exactly this — the politician full_name index already proves the pattern at comparable row counts) |
| Nationwide CD-geofence completion (needed for guaranteed House fallback) | Not a scaling concern — a data-completeness milestone, independent of the search architecture |

### Scaling Priorities

1. **First bottleneck:** none expected from this feature at current scale — the new endpoints are read-only, cached-header-friendly (`Cache-Control: public, max-age=30-60`, same convention as `search-by-name`), and reuse existing connection pooling.
2. **Second bottleneck (future):** if the name resolver's `governments` UNION branch grows to thousands of rows without a dedicated index (today it likely has none, since it wasn't previously queried by name at typeahead speed) — add a matching GIN trgm index on `governments.name` in the same migration as the geofence index, not as an afterthought.

## Anti-Patterns

### Anti-Pattern 1: Retiring the shared Google-Places infrastructure from Results.jsx only

**What people do:** Treat this as a "Results-page" milestone and leave `Landing.jsx` on the old `useGooglePlacesAutocomplete` / `resolveLocalityRoute` / `LocalityMatches` stack because it wasn't named in the milestone title.
**Why it's wrong:** `Landing.jsx` imports the exact same three modules (`useGooglePlacesAutocomplete`, `localitySearch.js`, `LocalityMatches.jsx`) as `Results.jsx`. If those modules are deleted (per the milestone's explicit "drop Google Places entirely" goal), `Landing.jsx` breaks. If they're kept "just for Landing," the milestone has NOT actually dropped Google Places — the `VITE_GOOGLE_MAPS_API_KEY`/`@googlemaps/js-api-loader` dependency and cost/ToS exposure remain.
**Do this instead:** Fold `Landing.jsx`'s search bar onto the same new `LocationSearch` component (or a shared subset of it) in this milestone. This is a small addition to build order, not a new feature — it is the other caller of the exact code being deleted.

### Anti-Pattern 2: Making the coordinate path re-derive an address string

**What people do:** Reverse-geocode every coordinate back to a formatted address (via Census or another service) just so `matchedAddress`/`X-Formatted-Address` keeps working identically for the "Use my location" flow.
**Why it's wrong:** Adds a network round-trip and a new failure mode (reverse-geocode timeout) to a flow whose entire value proposition is *skipping* address entry. `getElectionsByCoordinate` already proves the codebase is comfortable returning coordinate-driven results without a formatted-address string.
**Do this instead:** Let the coordinate response omit `matchedAddress` (or return an empty string) and have the frontend show a neutral label ("Your Location") or the resolved place name if the coordinate came from a name-resolver selection (which already has a `label`). Never block the response on a reverse-geocode call.

### Anti-Pattern 3: Overloading `/candidates/search`'s body shape for coordinates

**What people do:** Add an optional `{lat, lng}` alternative to the existing `POST /candidates/search { query }` contract to avoid adding a new route.
**Why it's wrong:** `/candidates/search`'s response contract (`X-Formatted-Address` header, `ADDRESS_NOT_FOUND`/`PO_BOX_REJECTED` error codes) is address-string-specific and consumed by `api.jsx`'s `searchPoliticians()` in several places (including `fetchCandidates`). Branching the same endpoint on body shape silently couples two different semantics and risks regressing the well-tested address path.
**Do this instead:** A new dedicated route (`POST /candidates/by-coordinate`), exactly as `/browse/by-area` is separate from `/candidates/search` today — this codebase already prefers one route per input shape over shape-sniffing a shared route.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| US Census Geocoder (`geocoding.geo.census.gov/geocoder/locations/onelineaddress`) | Existing `geocodingService.ts`, 24h Redis cache, 5s timeout | **UNCHANGED** — already the sole address-geocoding path since Phase 38 replaced Google Maps Geocoding; this milestone finishes the Google removal on the *frontend typeahead* side (Places Autocomplete), not the backend geocode side (already Census) |
| Google Maps Places Autocomplete (`@googlemaps/js-api-loader`) | Currently bound via `useGooglePlacesAutocomplete.js` in both `Results.jsx` and `Landing.jsx` | **RETIRED this milestone** — remove the hook, the npm dependency (after confirming no other call sites), and `VITE_GOOGLE_MAPS_API_KEY` |
| Browser Geolocation API (`navigator.geolocation`) | New, frontend-only, no backend dependency until a coordinate is produced | Standard permission-prompt UX; must handle denial/timeout gracefully (fall back to manual entry, do not block the combobox) |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `essentials` (frontend) ↔ `accounts-api` (backend) | HTTPS via `apiFetch`/`publicFetch` wrappers in `src/lib/auth.js` | Backend changes require a push to `master` at `C:\EV-Accounts` for Render auto-deploy — **backend endpoints must ship and be verified live before the frontend combobox can be wired to them** (standard cross-repo dependency already documented in PROJECT.md constraints) |
| `getRepresentativesByAddress` ↔ `getRepresentativesByCoordinate` | Direct in-process function call, same file | No network hop; keeps enclave-alias correction address-side only |
| `essentialsCandidates.ts` (routes) ↔ `essentialsService.ts` / `locationSearchService.ts` (lib) | Direct import, no service-role client in routes (architecture.test.ts already enforces this — new code must follow it) | New route file(s) must go through `lib/`, never query Postgres directly |
| `LocationSearch.jsx` ↔ `Results.jsx` | Callback prop (`onResolve`) + `navigate()` for browse targets; no shared state beyond what `Results.jsx` already reads from URL params | Keeps the combobox stateless with respect to `Results.jsx`'s hierarchy/tab/compass pipeline — the single biggest risk-reducer for this refactor |
| `LocationSearch.jsx` ↔ `Landing.jsx` | Same component (or shared sub-module), separate call sites | See Anti-Pattern 1 — must be addressed in the same milestone to fully retire Google Places |

## Suggested Build Order (backend → frontend, per repo constraint)

1. **Migration:** pg_trgm GIN indexes on `geofence_boundaries.name` and `governments.name` (models migration `040_pg_trgm_search.sql`) — accounts-api, ships to Render first, zero behavior change until queried.
2. **Backend — factor the coordinate path:** extract `getRepresentativesByCoordinate()` from `getRepresentativesByAddress()` in `essentialsService.ts`; verify `getRepresentativesByAddress` still passes existing behavior (regression-safe, no route change yet).
3. **Backend — new routes:** `POST /candidates/by-coordinate` and `GET /location-search`; deploy and smoke-test both directly (curl/Postman) before any frontend work starts — this is the natural verification gate given the cross-repo Render-deploy dependency.
4. **Frontend — new library layer:** `src/lib/placeSearch.js` (input classifier) + 2 new `api.jsx` functions, unit-testable against the now-live backend endpoints with no UI changes yet.
5. **Frontend — `LocationSearch.jsx`:** build the combobox against the library layer; wire into `Results.jsx` alongside (not yet replacing) the old header block behind a feature check, add the new `?lat=&lng=` URL-param fetch branch.
6. **Frontend — swap-in + retire:** replace the old header block in `Results.jsx`, delete `LocalityMatches.jsx`/`LocationBrowser.jsx`/`useGooglePlacesAutocomplete.js`/`localitySearch.js`, remove the Google Maps dependency + env var.
7. **Frontend — `Landing.jsx` parity:** point its search bar at the same `LocationSearch`/`placeSearch.js` stack (required to actually finish "drop Google Places entirely" — see Anti-Pattern 1).
8. **Frontend — decluttering pass (lower risk, can parallelize with 5–7):** `FilterBar.jsx` default-Elected + Judges-tab exception, remove "Search by name" input, convert compass-lens bar to icon buttons + tooltips (gavel icon for Judicial) — these touch `FilterBar.jsx`/`CompassControlsBar.jsx` only and have no dependency on the search work, so they can be built as an independent phase/track.

This order respects the one hard dependency in the milestone (backend endpoints must exist and be deployed before the frontend can call them) while keeping the header-decluttering items (step 8) decoupled so they don't block or get blocked by the search rewrite.

## Sources

- Direct reads of `C:\Transparent Motivations\essentials\src\pages\Results.jsx`, `src\lib\coverage.js`, `src\lib\api.jsx`, `src\lib\localitySearch.js`, `src\hooks\useGooglePlacesAutocomplete.js`, `src\components\{LocalityMatches,LocationBrowser,FilterBar}.jsx`, `src\pages\Landing.jsx` — HIGH confidence, current code.
- Direct reads of `C:\EV-Accounts\backend\src\routes\{essentialsCandidates,essentialsBrowse}.ts`, `src\lib\{geocodingService,essentialsService,essentialsBrowseService,electionService,campaignFinanceSearchService}.ts`, `migrations\040_pg_trgm_search.sql` — HIGH confidence, current code.
- `.planning/PROJECT.md` — milestone goal, constraints, and cross-repo deploy model.

---
*Architecture research for: Essentials v24.0 Results-Page Search & Header Overhaul*
*Researched: 2026-07-20*
