# Pitfalls Research

**Domain:** Unified location search (address / city-state-county / lat-lng → officials, with national state+federal fallback) + header/filter declutter, added to an existing React 19 / Express+Postgres/PostGIS civic-officials app (Essentials, v24.0)
**Researched:** 2026-07-20
**Confidence:** HIGH (all pitfalls below are grounded in this repo's actual source — `Results.jsx`, `FilterBar.jsx`, `localitySearch.js`, `LocalityMatches.jsx`, `coverage.js`, `essentialsBrowseService.ts`, `geocodingService.ts`, `essentialsService.ts` — plus this project's own memory of prior live incidents, not generic web-search advice)

## Critical Pitfalls

### Pitfall 1: National fallback confidently shows the WRONG state's officials

**What goes wrong:**
A location query that resolves ambiguously (or resolves to the wrong state) returns a *confident, fully-rendered* state+federal officials list under the wrong state's banner — the user has no way to tell these aren't their real senators/representative. This is strictly worse than an error, because the UI presents wrong data with full visual authority.

**Why it happens:**
This exact failure mode has already happened twice in this codebase, for two different root causes — both instructive for the new search:
1. **Stale-state bleed** (`project_browse_government_list_state_leak`, fixed 2026-06-28): an LA address search followed by drilling into an unseeded NV city left `?q=los angeles` in the URL alongside `?browse_geo_id=...`; on reload both fetches ran, and when the NV browse returned empty, the code fell back to the stale CA `hookData` while the banner correctly showed NV — "Los Angeles, NV" with California politicians.
2. **Stray derived-location field bleed** (`project_representing_city_banner_hijack`, fixed 2026-07-12): a statewide/federal office (Sen. Padilla) carried a leftover `representing_city='Inglewood'` from an old record. Because that office's district is the whole state, it "wins" for every CA address whose real local officials have `representing_city=NULL` — a Corona address showed the Inglewood banner.
Both bugs share a root cause pattern: **a fallback/default value silently wins when the correct value is empty or ambiguous**, and nothing forces the UI to show "we don't know" instead. A new national-fallback path is a *new* place this pattern can recur: if the state abbreviation used to fetch state+federal officials is derived from an ambiguous or partial name match (see Pitfall 8), the wrong state's Senators/House member will render with full confidence.

**How to avoid:**
- Never derive the fallback state from a "best guess" string match alone — require the backend name-resolver to return a *confidence/ambiguity signal* (exact match vs. fuzzy match vs. multiple candidates), and force a disambiguation UI (not a silent pick) whenever more than one candidate exists.
- When entering national-fallback mode, follow the same defensive pattern already applied to the browse state-leak fix: (a) delete any stale `q=`/prior address params so old data can't bleed through on a re-render of the same route, (b) never fall back to cached/prior-location data when the *current* mode returns empty — an empty/ambiguous fallback must render "we couldn't confidently place you," not stale officials.
- Reuse the existing hardened `representingCity`/`userState` derivation pattern (skip `NATIONAL_*`/`STATE_*` district types when deriving *local* display fields) — and apply the mirror-image rule for state derivation: the state used to key state+federal fallback officials must come from the *resolver's own geo match* (state FIPS/abbrev of the matched place), never from a loosely parsed substring of the raw query.
- Add a regression test analogous to the existing `stateAbbrevFromGeoId('3231900') -> NV` test: given an ambiguous or multi-state name, assert the resolver returns disambiguation candidates, not a silent single pick.

**Warning signs:**
- Any code path that has an `||` or `??` fallback to a previous state/list variable inside the fallback-rendering logic.
- A resolver function that returns a single string/geo_id even when its internal match logic considered multiple candidates.
- Manual QA: search "Franklin, VA" (an independent city AND a county both named Franklin exist in Virginia) or "Baltimore" (city AND county, adjacent but legally separate — this codebase already models Baltimore City as a *dual-tier* geofence, G4110=2404000 **and** G4020=24510) and confirm the UI asks which one, or clearly labels which one it picked, rather than silently choosing.

**Phase to address:**
The backend name-resolver / national-fallback phase (the phase implementing "own the search stack" + "national fallback"). Disambiguation UX should ship in the same phase as the resolver, not deferred — a resolver without disambiguation is the bug waiting to happen.

---

### Pitfall 2: Defaulting the type filter to "Elected" silently empties the Judges tab

**What goes wrong:**
The milestone explicitly wants "default Elected... except keep appointed on the Judges tab." But the current implementation shares **one global `appointedFilter` state variable** across all three people-tabs. In `Results.jsx`:
```js
const applyAppointedFilteredHierarchy = useMemo(
  () => applyAppointedFilter(hierarchy, appointedFilter), ...);
const educatorsHierarchyFiltered = useMemo(
  () => applyAppointedFilter(educatorsHierarchy, appointedFilter), ...);
const judgesHierarchyFiltered = useMemo(
  () => applyAppointedFilter(judgesHierarchy, appointedFilter), ...);
```
`applyAppointedFilter` and `matchesAppointedFilter` are reused byte-identical across Representatives, Educators, and Judges (comment: "generalized into a map/filter body... reused unchanged"). If the default flips from `'All'` to `'Elected'` at this single shared state's initialization, switching to the Judges tab inherits `'Elected'` too — and `matchesAppointedFilter` resolves many real judges as non-elected: `resolveIsAppointed` returns true unless the individual politician record has an override, and `matchesAppointedFilter('Elected', ...)` only passes appointed judges through if `faces_retention_vote === true`. Judges who are appointed (merit selection, interim, or simply not yet facing a retention vote) disappear entirely the moment a user opens the Judges tab, with no indication anything was filtered.

**Why it happens:**
The filter was built as one shared control because Representatives/Educators/Judges deliberately reuse one render pipeline ("Phase 208 (D-09): Representatives, Educators, and Judges reuse this single render pipeline byte-identical"). That's the right call for the pipeline, but the *filter default* is a per-tab concern that piggybacked on a shared state variable — changing the default without splitting the state (or without special-casing Judges) breaks the very tab this milestone calls out as the exception.

**How to avoid:**
- Do not simply change the `useState('All')` initializer to `'Elected'`. Either (a) key the filter state per tab (`{representatives: 'Elected', educators: 'Elected', judges: 'All'}`) and switch which value `FilterBar` reads/writes based on `effectiveActiveView`, or (b) keep one state variable but force-override the effective filter to `'All'` whenever `effectiveActiveView === 'judges'`, independent of what the user last picked on another tab.
- Confirm the override survives tab-switch-and-back: if a user manually sets "Elected" while ON the Judges tab, decide (and document) whether that's honored or whether Judges always ignores the type filter entirely (simpler, matches "keep appointed" language literally).
- Since CA's ~504 judicial districts have NULL `geo_id` (a *separate*, pre-existing data gap — see `project_ca_judicial_districts_null_geoid`), test this specifically against Bloomington, IN (`401 N Morton St, Bloomington, IN 47404`), which is the one location known to have geo-linked judges today — testing only in CA will show an empty Judges tab regardless of the filter bug and mask this regression.

**Warning signs:**
- Any diff that changes `useState('All')` to `useState('Elected')` without touching `FilterBar`'s consumer wiring or `applyAppointedFilter` call sites.
- QA on Bloomington, IN: Judges tab shows 0 results with default filter, but shows judges when Type is manually switched to "All" — that is exactly this bug reproduced.

**Phase to address:**
The header/type-filter declutter phase (default-Elected + remove All/Appointed dropdown). Must ship together with the per-tab exception, not as a follow-up fix — this is explicitly called out in the milestone goal, so shipping the default without the exception is a same-phase regression, not a future one.

---

### Pitfall 3: Census one-line geocoder can't do what the current Google Geocoder does — the "classify this query" logic breaks silently

**What goes wrong:**
`src/lib/localitySearch.js`'s `classifyQuery()` — the function that currently decides whether free text is an `address` / `city` / `county` / `state` — is built entirely on **Google's Geocoder** (`@googlemaps/js-api-loader`, `Geocoder.geocode()`), reading structured `address_components` (`administrative_area_level_1/2`, `locality`, `postal_code`, etc.) and `types[]`. The milestone says to drop Google Places entirely and use the free US Census geocoder instead. But the Census `onelineaddress` endpoint (the one already integrated in `backend/src/lib/geocodingService.ts`) is an **address matcher, not a places/administrative-boundary API** — it is tuned to resolve full street addresses against TIGER address ranges, has no concept of "this is a bare city name" vs. "this is a county name" vs. "this is a state name," and frequently returns **zero matches** for a bare city/county/state string (which is exactly the "city/county failures" the milestone must handle, since one of the three supported input shapes is "city/state/county" with no street). A naive swap of Google's Geocoder for a raw call to the Census endpoint will silently degrade every non-address query in this function to "no match" → `{ kind: 'address' }` fallback → normal street-address search → `ADDRESS_NOT_FOUND` error, even though the milestone's whole point is that city/state/county queries should work.

**Why it happens:**
Google's structured Geocoding API and the Census one-line address matcher solve different problems and are not drop-in replacements. Google returns typed administrative boundaries for partial queries; Census's public geocoder is optimized for street-level address-to-coordinate resolution and (per this project's own backend comment) is "known to occasionally return city-level precision instead of street-level for some addresses" — i.e., even for addresses it's not always exact, let alone for bare place names.

**How to avoid:**
- Do not attempt to reuse the Census *address* endpoint for city/county/state classification. Build the new backend name-resolver (already scoped in the milestone) as a **place-name lookup against `essentials.geofence_boundaries`/`essentials.governments`** (this project's own DB, which already has authoritative city/county/state names and FIPS geo_ids) for the city/state/county input shape, and reserve the Census geocoder call specifically for the "this looks like a street address" shape.
- Classify input *shape* locally/heuristically first (has a street number/street-suffix token → address; else → try DB place-name match; else → try Census as last resort for edge cases like a bare ZIP-adjacent string), rather than routing every query through Census and hoping it classifies correctly.
- Preserve the "never throw — fall back to address kind" resilience pattern already in `classifyQuery`/`resolveLocalityRoute` (`Never throws — any failure resolves to { kind: 'address' }`), but recognize that with Census swapped in, "falls back to address kind" now means "falls back to a search that itself commonly 422s" — so the ultimate empty-state message must say something more useful than the current 422 `ADDRESS_NOT_FOUND` copy for a query that was actually a valid city name.
- Explicitly handle the documented Census gaps: PO boxes (already rejected pre-flight in `geocodingService.ts`), rural/non-standard addresses (no TIGER address-range match — common in rural counties), and apartment/unit-heavy addresses (Census sometimes matches the base street but drops unit numbers, which doesn't affect point-in-polygon lookup but can affect the "matchedAddress" display shown back to the user).

**Warning signs:**
- QA "Springfield, IL" (or any covered city with no street number) and confirm it resolves to a city-browse view, not a 422 error. This is the highest-value single regression test for this pitfall.
- Any place where the new frontend directly calls the Census endpoint for a query that has no digits.

**Phase to address:**
The "own the search stack" backend name-resolver phase. This is the single highest-risk phase in the milestone — it should be scoped and built (and unit-tested against a matrix of address/city/county/state/coords inputs) before the frontend combobox phase starts consuming it, since the frontend can't be tested meaningfully against a resolver that misclassifies half its inputs.

---

### Pitfall 4: Census geocoder benchmark/vintage drift breaks silently, with no visible symptom until it does

**What goes wrong:**
`geocodingService.ts` hardcodes `benchmark=Public_AR_Current`. Census periodically retires/renames benchmarks (e.g., rolls a new vintage forward and eventually deprecates the old "Current" alias, or the underlying TIGER vintage shifts under a stable-looking name). Because the current integration has **no retry-with-fallback-benchmark logic** and treats any non-2xx or unparseable response as a generic `GEOCODER_UNAVAILABLE`, a benchmark rename on Census's side degrades straight to every address search failing with the same unhelpful "Address lookup temporarily unavailable" message — indistinguishable from a transient network blip, so it's easy to miss in monitoring until user reports pile up.

**Why it happens:**
The integration was built once (Phase 38, per the code comment) against a snapshot of Census's API and never revisited. There's no scheduled health-check hitting the live endpoint with a known-good address, and no log field distinguishing "Census returned 0 matches" from "Census's benchmark parameter itself is now invalid" (Census actually returns a 200 with an error body for some bad-parameter cases, not a clean 4xx — the current code's `!response.ok` check may not even catch it).
Additionally, the SAME hardcoded benchmark risk now applies to a NEW consumer: today only the authenticated `/set-location` flow calls `geocodeAddress`; v24.0 adds the public, anonymous, high-traffic unified search box as a second (much higher-volume) caller of the same function. A benchmark break now takes down the primary discovery surface of the app, not just an edge flow.

**How to avoid:**
- Add a lightweight startup/scheduled smoke test (or a cheap synthetic check inside the cron infra this project already has for discovery) that geocodes one known address and alerts if it fails.
- Log the raw Census response body (not just the derived error code) on `GEOCODER_UNAVAILABLE` so a benchmark-name problem is diagnosable from logs, not just "it's down."
- Consider a documented, versioned constant (`CENSUS_BENCHMARK = 'Public_AR_Current'`) with a comment pointing at Census's benchmark-list endpoint, so a future drift is a one-line fix, not an investigation.

**Warning signs:**
- A spike in `GEOCODER_UNAVAILABLE` (not `ADDRESS_NOT_FOUND`) across *all* addresses, including ones that worked yesterday.

**Phase to address:**
Backend name-resolver / geocoder-integration phase — add the smoke test and richer error logging as part of hardening the (now much higher-traffic) existing `geocodingService.ts`, even though this file itself isn't new.

---

### Pitfall 5: Live Census calls on every keystroke will get the shared IP rate-limited or throttled — for every user of the app

**What goes wrong:**
The Census geocoder is free and keyless, which also means there is no per-caller quota isolation — Render's backend makes every request from a small, shared pool of egress IPs. If the new unified search calls the Census endpoint live as the user types (typeahead-style), rather than only on submit, request volume multiplies by keystroke count, and Census is known in practice to throttle or intermittently reject bursty callers from a single IP. Because this project's backend is a single shared Express service, a burst from ONE user's fast typing (or a bot) can degrade or rate-limit the geocoder for ALL concurrent users.

**Why it happens:**
"Typeahead" naturally implies "fire a request per input change," and the existing 24-hour Redis cache (`geocode:v1:<address>`) only helps for *repeated identical* queries — it does nothing for the strictly-increasing prefixes typed on the way to a final address ("1", "12", "120", "1200"...), which are each a cache miss.

**How to avoid:**
- Never call the Census *address* endpoint live-as-typed. Debounce heavily (e.g., only fire on blur/submit/explicit "search" action, or after a long pause + minimum length), and route incremental typeahead suggestions through the DB-backed place-name resolver (Pitfall 3) or the curated catalog (both free of external rate limits) instead.
- If any live-as-typed suggestion experience is required, back it with the local `essentials.geofence_boundaries`/curated-catalog matching this app already does in `LocalityMatches.jsx`/`searchCoverageAreas` (in-memory, zero external calls), not a network geocoder call.
- Keep (and extend) the existing 24h cache TTL pattern for the final submitted-address case.

**Warning signs:**
- Backend logs showing Census request volume proportional to keystrokes, not to submitted searches.
- A user-report cluster of "address lookup temporarily unavailable" that correlates with one heavy-typing session, not a real Census outage.

**Phase to address:**
The frontend unified-search-UI phase, in coordination with whichever phase defines the debounce contract with the backend resolver. This should be a stated architectural constraint going into that phase's plan, not discovered during build.

---

### Pitfall 6: Coordinate-lookup endpoint reuses the wrong privacy model (vault-and-derive) — or skips privacy handling entirely

**What goes wrong:**
This project has a well-established, deliberately narrow privacy contract for location data (`project_ev_privacy_model`): coordinates are **only ever persisted** for an authenticated Connected user, encrypted via Supabase Vault, with derivation happening once at `set-location` time, and the frontend "must not store or display raw address... never receives raw coordinates" back from the backend. The existing coordinate-based lookup path (`connect.resolve_user_local_officials` RPC, `essentialsService.ts` ~line 1733) is built entirely around *already-vaulted, already-consented* coordinates for a known user — it is not a generic "look up officials from a raw lat/lng" endpoint.
The new milestone's "coordinate lookup endpoint" is a fundamentally different surface: an **anonymous, unauthenticated** endpoint accepting raw lat/lng typed by any visitor into a search box, for a one-off lookup with no account and no consent to store anything. Two ways this goes wrong:
1. The endpoint is implemented by reusing/adapting the vault-write path, so a mere search visit ends up silently writing an encrypted location row for a session/anonymous identity — violating "should only be saved with user intent (not silently on every search)."
2. The endpoint is implemented ad hoc with no privacy review at all — logging raw coordinates in request logs, echoing them back in API responses, or exposing precise-enough coordinates in a shareable URL query string (`?lat=...&lng=...`) that then gets logged by analytics/PostHog (this app already fires `posthog?.capture(...)` on search events) or leaks via Referer headers to any third party the page talks to.

**Why it happens:**
It's easy to treat "coordinate lookup" as a small variation of the existing address-lookup or the existing vaulted-coordinate RPC, when it is actually a new, anonymous, ephemeral, ST_Covers-only query that should touch none of the vault/consent machinery.

**How to avoid:**
- Build the coordinate-lookup endpoint as a **pure, stateless** `ST_Covers`/`ST_MakePoint(lng, lat)` query against `geofence_boundaries` — same spatial primitive as the existing address flow's PostGIS step, but with no write path, no vault call, no user_id parameter at all for anonymous callers.
- Never log raw lat/lng server-side beyond transient request-scoped use; never include them in the JSON response beyond what's needed to render (the existing `X-Formatted-Address` city+state pattern is the right precedent — return a display-safe label, not the raw coordinates).
- If the coordinate search result triggers a `saveMyLocation`-style follow-up for a Connected user, apply the exact same `set-location` consent/overwrite-guard (`409 LOCATION_ALREADY_SET` unless `force:true`) already enforced elsewhere — do not let the new anonymous entry point bypass it.
- Keep coordinates out of the browser URL if at all avoidable (prefer POST body over `?lat=&lng=` query params) specifically because query strings get logged, cached, and shared far more readily than POST bodies — and this app already treats "URL carries stale state" as a real bug class (Pitfall 1's browse-leak fix was exactly about stale URL params).

**Warning signs:**
- Any new endpoint whose request handler calls the vault-decrypt RPC or writes to `connect.connected_profiles`/vault tables for an unauthenticated caller.
- Raw `lat`/`lng` values appearing in PostHog event payloads, server access logs, or the browser address bar.

**Phase to address:**
The "own the search stack" / coordinate-lookup-endpoint phase (backend). Privacy review should be an explicit success criterion of that phase's plan, not an afterthought — this project has a documented privacy model precisely because it got this wrong before with `home_address` (removed 2026-04-11).

---

### Pitfall 7: Coordinate input — swapped lat/lng and out-of-US points render silently wrong or empty results

**What goes wrong:**
The existing `geocodingService.ts` comment flags, in caps, that Census returns `x=longitude, y=latitude` — "opposite of the common lat/lng convention" — and that PostGIS `ST_MakePoint` takes the same `(lng, lat)` order. This is already a known footgun *inside this codebase*, and the new coordinate-lookup endpoint is a brand-new place a human (or a copy-pasted snippet) can get the order backwards. Because latitude and longitude are both plausible-looking floats, a swapped pair doesn't error — it just queries a point that's very likely outside any US geofence (silently returns "no results," which for a *national fallback* feature reads as "location not covered" rather than "you swapped your inputs"), or, in unlucky cases where |lat| and |lng| are both small, could resolve to a real but wrong "nearest" polygon on some other continent's coordinate range if bounds aren't enforced.

**Why it happens:**
Every layer touching a coordinate pair (frontend input parsing, the new endpoint, the SQL call) is a fresh chance to get the order wrong, and JS/TS give zero type-level protection between two bare `number`s.

**How to avoid:**
- Validate coordinate bounds server-side before any spatial query: reject (with a specific, actionable error) any pair where `lat` is outside roughly `[18, 72]` and `lng` outside roughly `[-180, -65]` (continental US + AK/HI/territories) — this both catches swapped pairs (most US lng values are large negative numbers, most US lat values are small positive numbers, so a swap is usually detectable) and catches genuinely out-of-US input (e.g., a bot or copy-paste of a non-US location) with a clear "we don't have coverage outside the US" message rather than a bare empty-results screen.
- Name function parameters and object keys unambiguously (`{ lat, lng }`, never a bare `[a, b]` tuple) all the way from the frontend form to the SQL call, and add one inline comment at the `ST_MakePoint` call site (mirroring the existing one in `geocodingService.ts`) reminding future editors of the order.
- Add a unit test asserting a known real US coordinate resolves correctly and a swapped version of that same coordinate is rejected by the bounds check, not silently queried.

**Warning signs:**
- Coordinate searches that return empty results at a suspiciously high rate compared to address searches for similar real-world locations.
- Any function signature taking `(a, b)` or `[lat, lng]` without named fields.

**Phase to address:**
The coordinate-lookup-endpoint phase (backend), as an explicit input-validation requirement in that phase's plan/success criteria.

---

### Pitfall 8: "Springfield problem" — same-named places and county/city collisions resolve to a plausible-but-wrong candidate

**What goes wrong:**
A bare city name (or a county name that's also a city name) can match multiple real places. This project's own data already contains a live example of the county/city collision: **Baltimore City is a legally separate, dual-tier entity from Baltimore County** (`geofence_boundaries` models it as BOTH `G4110=2404000` city AND `G4020=24510` county-equivalent) — and San Francisco is a consolidated city-county (both G4110 and G4020 rows for the same place). A resolver that isn't explicitly aware of these dual-tier/consolidated patterns, or that just takes the first `ILIKE` match by name, will non-deterministically pick "Baltimore the city" or "Baltimore the county" (or worst case, pick whichever happens to sort first alphabetically/by insertion order) with no signal to the user that a choice was even made. Same-named cities across states ("Springfield" exists in a dozen-plus states, several of them in this app's covered footprint — MA, OR, and others) are the more obvious version of the same failure: if the resolver doesn't require (or infer) a state qualifier, "Springfield" alone is inherently ambiguous, and returning a single result is a coin flip presented as fact.

**Why it happens:**
The existing static-catalog typeahead (`coverage.js` `searchCoverageAreas`) sidesteps this today because it's a small, hand-curated list where collisions are rare and eyeballed away during onboarding; scaling name-matching up to the full `essentials.geofence_boundaries` table (8,000+ rows, growing with every new state) makes collisions common and un-eyeballable.

**How to avoid:**
- The name resolver must always return a *ranked list of candidates* (not a single best guess) whenever more than one geofence row matches a bare name, disambiguated by state (and, for city/county collisions, by area type) — and the frontend must show that list for the user to pick from rather than auto-navigating to result #1, exactly the same UX shape already built for `LocalityMatches`.
- Treat "same name, different `mtfcc`/area_type in the same state" (Baltimore city vs. county; any consolidated city-county) as a first-class disambiguation case, not just "same name, different state."
- When a query includes a state qualifier ("Springfield, MA"), the resolver should filter to that state before ranking — don't discard the state token as noise.

**Warning signs:**
- A resolver function whose SQL is `... WHERE name ILIKE $1 ORDER BY <something arbitrary> LIMIT 1` with no state-scoping and no returned-candidate-count check.
- QA: query "Baltimore" with no state and confirm the UI offers both the city and the county (or a "did you mean" split) rather than picking one.

**Phase to address:**
Backend name-resolver phase (same phase as Pitfall 1 and Pitfall 3 — this is really one connected risk cluster: ambiguity handling in the resolver). The frontend combobox phase must build disambiguation UI against this contract from the start, not retrofit it.

---

### Pitfall 9: Curated typeahead catalog quietly diverges from "any resolvable US location"

**What goes wrong:**
The milestone's stated typeahead source is "DB place-names + curated catalog." Today, `LocalityMatches`/`searchCoverageAreas` runs *only* against the hand-maintained `coverage.js` static arrays (`COVERAGE_STATES`, `COVERAGE_COUNTIES`, `COVERAGE_SCHOOL_DISTRICTS`, plus the state-officials list built from `STATE_NAME_TO_ABBREV`) — a curated list of the ~100 deep-seeded cities/counties this project has manually onboarded, **not** a query against the full `essentials.geofence_boundaries` table (which has 8,000+ TIGER-loaded places across every covered state, most of which have geofences and state/federal routing but no deep-seeded local officials). If the new unified typeahead keeps using only the curated catalog as its suggestion source, it will fail to suggest — and therefore fail to help users reach — the vast majority of places that the national-fallback feature is *supposed* to cover (any US address should get at least state+federal). Conversely, if it's switched to suggest from the full DB table without any distinction, users will frequently pick a suggested place that has no local officials at all (a skeletal government row), landing on a confusingly empty local page with no signal that "no local data" is expected/normal there vs. a bug.
Additional review of this codebase's own habits reinforces the risk: after essentially every new-state onboarding milestone (CA, OR, MA, ME, MD, VA, AZ...), the team has needed a "playbook retrospective" specifically to reconcile the curated catalog against DB reality — this is a known recurring maintenance burden, not a one-off risk.

**Why it happens:**
The curated catalog and the DB table serve different historical purposes (the catalog was built to drive the Landing page's "browse this city" chips for cities that have real content; the DB table is the geospatial substrate for point-in-polygon routing) and were never meant to be a single source of truth for "what can I type into search."

**How to avoid:**
- Make the typeahead source explicitly two-tiered and *visually distinguishable*: curated/deep-seeded matches (which have local officials + a purple "coverage chip" per this project's existing convention) ranked/labeled differently from bare DB place-name matches that will route to a national-fallback (state+federal-only) result.
- Query the DB table directly for the typeahead (with a proper index — see Pitfall 10) rather than shipping a second hand-maintained list; reserve `coverage.js`'s curated array for what it already does well (Landing page chips), and don't let the new search silently depend on keeping that array exhaustively in sync with the DB going forward.
- QA a location that is deliberately *not* in the curated catalog but *is* in `geofence_boundaries` (e.g., a small unseeded city in an otherwise-covered state) and confirm it (a) appears in the new typeahead and (b) lands on a clearly-labeled national/state-fallback view, not a blank page.

**Phase to address:**
Frontend unified-search-UI phase, informed by the backend name-resolver's output shape (which tier a given match belongs to) from the resolver phase.

---

### Pitfall 10: No fuzzy/trigram index exists — naive nationwide name search will be slow and rank poorly

**What goes wrong:**
This project's Postgres/PostGIS instance has **no `pg_trgm` extension or trigram index** on any name column today (confirmed absent from the migration history). The only existing name-lookup query, `getAreasForState` in `essentialsBrowseService.ts`, does an exact `WHERE gb.state = $1` scoped to one state — it never does a free-text name search across the whole table. A new nationwide "type a city/county name" resolver that does `WHERE name ILIKE '%query%'` (or worse, a leading-wildcard `LIKE`) across the full, ever-growing `geofence_boundaries` table has no index to use — Postgres will sequential-scan the whole table on every keystroke-adjacent query, and this project has *already* hit and fixed an almost-identical class of bug once (`project_geofence_overlap_perf`: an unindexed spatial `OR` caused a 4.3s stall that had to be rewritten to be index-driven). A naive text-search version of the same mistake is highly likely without deliberate index work, and it will get worse every time a new state/city is onboarded (this app adds thousands of new geofence rows per state).

**Why it happens:**
Point-in-polygon spatial queries (the app's bread and butter) use PostGIS GIST indexes, which don't help at all for free-text name matching — trigram search is a separate extension/index type that nothing in this codebase has needed before now.

**How to avoid:**
- Add `CREATE EXTENSION IF NOT EXISTS pg_trgm;` and a `GIN (name gin_trgm_ops)` index on `essentials.geofence_boundaries.name` (and `essentials.governments.name` if that's also searched) as a migration in the name-resolver phase, before writing the query, not after noticing it's slow.
- Prefer `similarity(name, $1) > threshold ORDER BY similarity(...) DESC LIMIT N` (trigram-index-driven) over `ILIKE '%...%'` for ranking quality as well as performance — `ILIKE` with a leading wildcard can't use a trigram index efficiently either, so the query shape itself needs to be trigram-idiomatic (`%`-anchored `ILIKE` or `similarity()`/`word_similarity()`), not just "add an index and hope."
- Reuse this project's existing "no Seq Scan" validation habit (`backend/validate_pipeline.py:415` already asserts this for the spatial query) — add an equivalent `EXPLAIN`-based assertion for the new name-search query once built.

**Warning signs:**
- `EXPLAIN ANALYZE` on the new name-search query showing `Seq Scan` on `geofence_boundaries`.
- Search latency that grows measurably worse after each new-state onboarding milestone (a symptom the team has directly experienced before with the unrelated overlap-query bug).

**Phase to address:**
Backend name-resolver phase — the index migration should ship in the same phase/PR as the query that needs it.

---

### Pitfall 11: Removing Google Places leaves behind Google-specific hacks that quietly break the new combobox

**What goes wrong:**
The current address-search UI has real, deliberate hacks built specifically around Google Places' behavior:
- `LocalityMatches.jsx` installs a **document-level, capture-phase keydown listener** whose entire purpose is to intercept ArrowUp/ArrowDown/Enter *before Google's own Places listener on the same `<input>` sees them* ("this fires before Google's keydown listener... otherwise Google would silently grab the keys").
- It also injects a raw `<style>{'.pac-container { display: none !important; }'}</style>` to hide Google's own suggestion dropdown so it doesn't overlap the app's own list.
- `localitySearch.js`'s `classifyQuery` explicitly early-throws `if (!API_KEY) throw new Error('no maps key')`, which is *already* the live path in production per this project's own memory (`feedback_no_google_places`: no `VITE_GOOGLE_MAPS_API_KEY` is configured, so this whole function has been silently no-op-ing to the try/catch fallback in production already).
If the new combobox is built by literally deleting `useGooglePlacesAutocomplete` and the Google Geocoder call without also removing (or deliberately re-justifying) the keydown-race listener and the `pac-container` CSS suppression, those become **dead defensive code with no adversary left to defend against** — harmless on their own, but a source of confusion for the next engineer, and a sign the removal was incomplete if any half-updated remnant still references `window.google`.

**Why it happens:**
The Google-specific hacks are deeply interleaved with the *working* logic (locality matching, keyboard navigation) in the same files, so a partial removal is easy: someone deletes the autocomplete *hook* but leaves the keydown race/CSS suppression that was built to fight it, or vice versa.

**How to avoid:**
- Treat "remove Google Places" as a full audit of `useGooglePlacesAutocomplete.js`, `localitySearch.js` (`classifyQuery`'s Google Geocoder call), `LocalityMatches.jsx` (keydown race + `pac-container` CSS), and `Landing.jsx`/`Results.jsx`'s `addressInputRef` wiring — not just the hook import. Grep for `google`, `pac-container`, and `window.google` across the frontend at the end of this phase and expect zero hits outside removed/replaced files.
- Since the Google Geocoder call in `classifyQuery` has been dead-in-production already (no API key), the *actual* behavior users have been getting is 100% the `{ kind: 'address' }` fallback — meaning today's "city/county/state" classification literally doesn't work in production at all right now. This raises the bar for the new resolver: it's not replacing a working feature with an equivalent one, it's *shipping the feature for the first time in production*, so budget QA time accordingly rather than assuming parity-testing against "current behavior" is sufficient.

**Warning signs:**
- Any remaining reference to `window.google`, `pac-container`, or `@googlemaps/js-api-loader` after this milestone ships.
- `VITE_GOOGLE_MAPS_API_KEY` absent from Render env vars, confirming today's classify-query path has never actually run in prod (worth confirming explicitly at kickoff so scope/QA expectations are set correctly).

**Phase to address:**
The frontend unified-search-UI phase (the phase that literally removes Google Places and builds the new combobox).

---

### Pitfall 12: Compacting compass lenses to icon-only buttons drops accessible names and the mobile tap-to-reveal affordance

**What goes wrong:**
`LensChipRow.jsx` currently renders icon **plus visible text label** chips, with a two-step mobile interaction: a first tap reveals a "prompt" (calibration nudge or confirmation), and either hovering (desktop) or a second tap (mobile) actually selects the lens — deliberately built ("Desktop hover state... and mobile first-tap state... are tracked separately — the two affordances never overlap on a single device"). The milestone wants "compass lenses → icon buttons + tooltips (gavel for Judicial)." If this is implemented by simply dropping the visible text label and keeping only the SVG icon inside the same button, two things break: (1) screen readers announce nothing meaningful for the button unless an explicit `aria-label` is added (a plain icon-only `<button>` with no `aria-label` is an accessibility regression, and `title` attributes alone are inconsistently announced across screen-reader/browser combinations); (2) removing the visible label removes the main visual cue that told mobile users "tap again to confirm" — if the tooltip-reveal-on-first-tap logic isn't explicitly carried over to the icon-only version, a mobile user's first tap may silently register as a selection (or silently do nothing) with no way to discover what the icon even means before committing.

**Why it happens:**
"Icon buttons + tooltips" reads like a simple visual simplification, but the current component's interaction model was deliberately built to avoid exactly the ambiguity that icon-only compacting reintroduces — hover/tooltip works for desktop mouse users but does nothing for touch or keyboard-only users, who need either a persistent focus-visible tooltip or a real `aria-label`.

**How to avoid:**
- Every icon-only lens button must carry an `aria-label` (e.g. `aria-label="Judicial lens"`), independent of whatever hover/focus tooltip is shown visually — this is required regardless of whether `title` is also present, since AT support for `title` is unreliable.
- Preserve (don't silently drop) the existing "tap doesn't immediately commit on mobile" affordance from the current chip row — either keep the two-tap pattern for icon buttons, or explicitly decide (and document) that icon buttons commit on a single tap and rely on the tooltip appearing on focus (which works for touch via the OS-level "tap to focus, tap again to activate" pattern only if implemented with real focus events, not synthetic hover-only CSS).
- Reuse the existing `renderLensIcon(lens)` SVGs (they're already built per-lens, including the gavel for judicial) rather than re-deriving icon choices — the milestone's "gavel for Judicial" ask is already satisfied by existing code; the risk is entirely in the interaction/accessibility layer around it, not the iconography.

**Warning signs:**
- A code review diff that removes the `<span>` label text from a chip but doesn't add an `aria-label` to the surrounding button.
- Manual test: tab to a lens button with keyboard only and confirm a screen reader (or the accessibility tree in devtools) announces something more useful than "button."

**Phase to address:**
The compass-lens icon-button phase (header declutter track). Accessibility parity with the existing chip row should be an explicit acceptance criterion.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|-----------------|------------------|
| Route every free-text query through the Census address endpoint and treat "no match" as "not a valid input" | Fast to build, one code path | Silently breaks the city/county/state input shape the milestone explicitly promises (Pitfall 3) | Never — this is the core feature, not an edge case |
| Ship the name resolver returning a single best-guess match (no candidate list) | Simpler frontend (no disambiguation UI) | Wrong-state officials shown with false confidence (Pitfall 1, 8) | Never for ambiguous inputs; acceptable only for a query that matches exactly one row |
| Keep one shared `appointedFilter` state across all three tabs and special-case Judges only in the render call, not the state model | Smallest diff to `Results.jsx` | Fragile — any future tab-specific filter behavior repeats this same landmine | Acceptable only if the per-tab override is centralized in one clearly-commented function, not scattered inline |
| Call the Census geocoder live-as-typed for a "smart" typeahead feel | Feels responsive during development/demo | Shared-IP rate limiting degrades the geocoder for every concurrent user (Pitfall 5) | Never in production; fine only behind a local dev flag with a fake/mocked geocoder |
| Skip the `pg_trgm` index and ship `ILIKE '%...%'` for the MVP demo | Nothing to migrate, works fine with today's data volume | Degrades further with every new state onboarded; matches this app's own prior overlap-query incident | Acceptable only as an explicitly time-boxed spike, never merged to the phase that ships to real users |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|-----------------|-------------------|
| US Census one-line geocoder | Assuming it classifies/handles bare city, county, or state names the way Google's structured Geocoder did | Use it only for street-address-shaped input; resolve city/county/state names against this project's own `geofence_boundaries`/`governments` tables |
| US Census one-line geocoder | Calling it on every keystroke for a typeahead feel | Debounce to submit/blur only; back live suggestions with local DB/catalog data, not the network geocoder |
| US Census one-line geocoder | Trusting the hardcoded `benchmark=Public_AR_Current` string will never change | Add a smoke test + richer error logging that distinguishes "0 matches" from "benchmark/param rejected" |
| PostGIS `ST_MakePoint`/Census coordinates | Passing `(lat, lng)` order when Census/PostGIS both expect `(lng, lat)` = `(x, y)` | Name every coordinate field explicitly (`{lat, lng}` objects, never bare tuples); comment the order at every call site, as `geocodingService.ts` already does |
| Existing vaulted-coordinate RPC (`connect.resolve_user_local_officials`) | Reusing/adapting it for the new anonymous coordinate-lookup endpoint | Build a separate, stateless, no-write query for anonymous coordinate lookups; keep the vault RPC exclusively for authenticated, consented Connected-user flows |
| Google Places removal | Deleting the autocomplete hook but leaving the `pac-container` CSS suppression and document-level keydown race listener that were built specifically to fight it | Full-repo grep for `google`/`pac-container`/`window.google` at the end of the removal phase; expect zero hits |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|-----------------|
| Nationwide `ILIKE '%query%'` name search with no trigram index | Search latency climbs; `EXPLAIN` shows `Seq Scan` on `geofence_boundaries` | `pg_trgm` extension + `GIN` trigram index on the name column(s), trigram-idiomatic query shape | Noticeable even at today's row count (8,000+); gets materially worse after every new-state onboarding milestone |
| Live geocoder calls per keystroke | Backend Census-call volume tracks keystrokes, not searches; occasional throttling under load | Debounce to submit/blur; typeahead backed by local data only | As soon as more than a handful of concurrent users type into the box at once — this is a shared-IP resource |
| Repeating the pre-fixed spatial-`OR` mistake in a new query (e.g. a combined address+coordinate+name lookup written as one query with mixed predicates joined by `OR`) | 4+ second stalls on a query that should be tens of milliseconds (this exact symptom already happened once in this codebase) | One predicate structure per `UNION ALL` branch with a `&&` bounding-box pre-filter, mirroring `resolveOverlappingGeoPairs` | Any time a new query mixes spatial predicate directions under `OR` instead of `UNION ALL` |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Echoing raw submitted coordinates back in the API response or logging them server-side for the new anonymous coordinate endpoint | Leaks precise user location into logs/analytics that this project's privacy model explicitly says should never happen for casual, non-consented lookups | Return only a display-safe label (mirroring the existing `X-Formatted-Address` city+state pattern); never log raw lat/lng beyond transient in-request use |
| Putting raw coordinates in the browser URL query string (`?lat=&lng=`) for the new coordinate search | URLs get logged, cached, shared, and picked up by analytics/Referer headers far more readily than POST bodies | Prefer POST body for the coordinate-lookup request; if a shareable URL is needed, encode a resolved place/geo_id, not raw coordinates |
| Treating the new coordinate endpoint as implicitly authenticated because it "looks like" the existing `set-location` flow | Silent unconsented writes to vault/profile tables for anonymous visitors | Explicitly build the anonymous coordinate-lookup path with zero writes; keep it structurally separate from the authenticated `set-location`/vault RPC code |
| No input validation on submitted coordinates | Out-of-bounds or swapped lat/lng silently queries an unintended point (Pitfall 7); also a potential injection/DoS surface if raw strings are passed unchecked into numeric SQL parameters | Server-side numeric type check + US bounding-box range check before any spatial query |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-------------------|
| National-fallback (state+federal-only) result rendered with the same visual weight as a full local match | User believes they've seen their complete representation when their city/county actually wasn't resolvable | Visually and textually distinguish "we found your state + federal officials, but couldn't pinpoint your local government" from a full match |
| Ambiguous place name silently auto-resolved to one candidate | User sees a plausible-but-possibly-wrong set of officials with no way to know a choice was made for them | Always show a disambiguation list when more than one real candidate matches (state pairs, city/county collisions) |
| Icon-only compass lens buttons with no visible label and unreliable tooltip-on-touch | Touch/keyboard/screen-reader users can't tell what a lens icon does before activating it | `aria-label` on every icon button; explicit focus/tap-reveal tooltip behavior, not hover-only CSS |
| Judges tab silently empty after the type-filter default changes | User assumes there are no judges for their location at all, when really the default filter hid appointed ones | Force the Judges tab's effective filter to include appointed judges regardless of the global default (Pitfall 2) |
| Typeahead suggests a place with no local officials, landing on an empty page with no explanation | User thinks the app is broken | Label DB-only (no-deep-seed) suggestions distinctly, and make the landing page for such a pick explicitly say "we have state + federal officials for this area; local officials aren't in our database yet" |

## "Looks Done But Isn't" Checklist

- [ ] **Unified search field:** Often missing disambiguation UI for ambiguous matches — verify a same-named-city-in-two-states query and a city/county-collision query (e.g. "Baltimore") both surface a choice, not a silent pick.
- [ ] **National fallback:** Often missing a clear "this is a fallback, not your full local result" visual/textual distinction — verify a genuinely uncovered/unresolvable local address still shows state+federal with an honest caption, not a page that looks identical to a full local match.
- [ ] **Type filter default to Elected:** Often missing the Judges-tab exception at the *state* level (not just the render call) — verify switching to Judges shows appointed judges by default even after the global default changes, and verify at Bloomington, IN (a location with actual geo-linked judge data), not just CA (which is empty regardless due to the separate NULL-geo_id gap).
- [ ] **Coordinate-lookup endpoint:** Often missing bounds validation and privacy review — verify out-of-US and swapped lat/lng inputs are rejected with a clear message, and verify no raw coordinates appear in logs, analytics events, or the response body.
- [ ] **Census geocoder swap-in:** Often missing a working city/county/state classification path — verify a bare city name (no street number) resolves usefully; do not assume "the geocoder works" from address-only testing.
- [ ] **Google Places removal:** Often leaves dead CSS/keydown-race code behind — grep the whole frontend for `google`/`pac-container`/`window.google` after the removal phase and confirm zero hits.
- [ ] **Compass lens icon buttons:** Often missing `aria-label` and a touch-usable tooltip affordance — verify with keyboard-only navigation and a screen reader, not just visual/mouse QA.
- [ ] **Name-search performance:** Often missing the `pg_trgm` index until it's slow in production — verify `EXPLAIN ANALYZE` shows an index scan, not a sequential scan, before shipping.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|-----------------|-----------------|
| Wrong-state officials shown via national fallback (Pitfall 1) | LOW–MEDIUM | Same pattern as the two prior live incidents: (1) audit for a silent fallback-to-stale-state value, (2) force the resolver's own matched geo/state to be the sole source of truth for fallback state, (3) add a regression test for the specific query that broke |
| Judges tab emptied by Elected default (Pitfall 2) | LOW | Add the per-tab filter override (or split the state); no data migration needed since this is a pure frontend logic fix |
| Census geocoder benchmark drift (Pitfall 4) | LOW | Update the hardcoded benchmark constant; add the smoke test that would have caught it sooner next time |
| Nationwide name search is slow (Pitfall 10) | LOW–MEDIUM | Add the `pg_trgm` extension + index via migration; rewrite the query to be trigram-idiomatic; no data loss risk |
| Coordinate endpoint accidentally wrote to vault/profile tables for anonymous users (Pitfall 6) | MEDIUM–HIGH | Audit and delete any anonymous-session rows created; separate the anonymous path from the authenticated vault RPC entirely; this is the class of mistake that previously required removing the `home_address` column outright, so treat any recurrence seriously |
| Google-Places dead code left behind (Pitfall 11) | LOW | Repo-wide grep and delete; no runtime risk, just cleanup debt |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|-------------------|----------------|
| Wrong-state officials via national fallback (1) | Backend name-resolver / national-fallback phase | Query an ambiguous same-named-city pair and a city/county collision ("Baltimore"); confirm disambiguation, not a silent pick |
| Elected-default hides appointed judges (2) | Header/type-filter declutter phase | Bloomington, IN Judges tab shows appointed judges with the new default active, without manually switching Type to All |
| Census geocoder can't classify bare city/county/state (3) | Backend name-resolver phase | Query "Springfield, IL" (no street number) and confirm a useful result, not a 422 |
| Census benchmark/vintage drift (4) | Backend name-resolver / geocoder-hardening phase | Smoke test on a known address passes in CI/monitoring; error logs distinguish 0-match from param-rejected |
| Live geocoder calls per keystroke exhaust shared rate limit (5) | Frontend unified-search-UI phase (contract with backend resolver) | Backend request logs show Census calls tracking submitted searches, not keystrokes |
| Coordinate endpoint privacy/consent violation (6) | Coordinate-lookup-endpoint phase (backend) | Code review confirms no vault/profile writes for anonymous callers; no raw coordinates in logs/responses/analytics |
| Swapped lat/lng or out-of-US coordinates (7) | Coordinate-lookup-endpoint phase (backend) | Unit test: known-good US coordinate passes; its lat/lng-swapped version is rejected by bounds check |
| Same-named-place / city-county collision ambiguity (8) | Backend name-resolver phase | Resolver returns ranked candidates (not a single row) for "Baltimore" and for a cross-state same-named city |
| Curated catalog diverges from full DB coverage (9) | Frontend unified-search-UI phase | A non-curated, DB-only city (not in `coverage.js`) appears in typeahead and lands on a clearly-labeled fallback view |
| No trigram index for name search (10) | Backend name-resolver phase | `EXPLAIN ANALYZE` on the shipped query shows an index scan |
| Google Places removal leaves dead hacks (11) | Frontend unified-search-UI phase | Repo-wide grep for `google`/`pac-container`/`window.google` returns zero hits post-merge |
| Icon-only lens buttons lose accessible name/touch affordance (12) | Compass-lens icon-button phase | Keyboard-only + screen-reader pass on every lens button; each has an `aria-label` |

## Sources

- This repository's own source, read directly: `src/pages/Results.jsx`, `src/components/FilterBar.jsx`, `src/components/LocationBrowser.jsx`, `src/components/LocalityMatches.jsx`, `src/components/CompassControlsBar.jsx`, `src/components/LensChipRow.jsx`, `src/lib/localitySearch.js`, `src/lib/coverage.js` (essentials repo)
- `backend/src/lib/geocodingService.ts`, `backend/src/lib/essentialsBrowseService.ts`, `backend/src/lib/essentialsService.ts` (EV-Accounts repo)
- Project memory (prior live incidents in this exact codebase, all first-party, not generic web advice): `project_browse_government_list_state_leak`, `project_representing_city_banner_hijack`, `project_geofence_overlap_perf`, `project_ca_judicial_districts_null_geoid`, `project_ev_privacy_model`, `project_search_api_contract`, `project_backend_architecture`, `feedback_no_google_places`, `project_v230_educators_judges_tabs`, `project_elections_view_display_rules`
- `.planning/PROJECT.md` (this project's own requirements/context/decisions log)
- US Census Bureau Geocoder documentation (`geocoding.geo.census.gov/geocoder/`) — one-line address matcher behavior, benchmark/vintage concept, general knowledge of its address-only design intent (not independently re-verified against live docs in this research pass; flagged where relevant as design-intent inference from the existing integration's own code comments, which is HIGH confidence since it's this project's working integration, not a third-party claim)

---
*Pitfalls research for: Unified location search & header overhaul (v24.0), Essentials civic-officials app*
*Researched: 2026-07-20*
