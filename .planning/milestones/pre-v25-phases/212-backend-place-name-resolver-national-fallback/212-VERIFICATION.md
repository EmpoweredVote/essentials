---
phase: 212-backend-place-name-resolver-national-fallback
verified: 2026-07-21T02:30:00Z
status: passed
score: 7/7 must-haves verified (2 gaps closed by gap-closure 212-07)
overrides_applied: 0
resolution: >
  Both BLOCKER gaps were fixed in gap-closure 212-07 (commit bfc10673, deployed live)
  and re-verified read-only against production:
  (1) State-tier resolve — 'G4000' added to KNOWN_MTFCCS; IL (geo_id 17) and AZ (geo_id 04)
      now return HTTP 200 with a non-empty statewide+federal floor (no more 422).
  (2) Nationwide House guarantee for Gazetteer-only places — getCongressionalOverlapNote now
      falls back to a GIST-index-driven point-in-polygon lookup (gazetteer centroid
      intptlong/intptlat -> ST_Contains against G5200 boundaries) when the geometry overlap
      is empty. Live-confirmed: Paradise CDP CA (0655528) -> CD 0603 / Kevin Kiley;
      Sun City CDP AZ (0470320) -> CD 0408 / Abraham J. Hamadeh; both NATIONAL_LOWER.
  Backend unit suite 322/322 green post-fix.
gaps:
  - truth: "SC4 — A city/county-name profile lists every US House district whose boundary overlaps the area, with an explicit 'we need an exact address' note when ambiguous"
    status: failed
    reason: >
      getCongressionalOverlapNote()/resolveOverlappingGeoPairs() computes CD overlap by
      spatially intersecting the queried area's OWN essentials.geofence_boundaries polygon
      against G5200 district polygons. Curated/deep-seeded places (~194 cities across the
      curated coverage.js states) have that polygon. The 32,333-row Gazetteer Places table
      (and CDP rows) ingested by this phase (migration 1378 / D-08) carries NO geometry
      column at all (geo_id/name/state/lsad/aland_sqmi/intptlat/intptlong only) — so for any
      Gazetteer-only PLACE-level candidate (the majority of the nationwide coverage this
      phase exists to add), the spatial join finds zero rows and getCongressionalOverlapNote
      silently returns {cdGeoIds: [], needsExactAddress: false}. This is indistinguishable
      from "genuinely zero overlapping districts" (which never happens for a real US
      location) and is returned instead of either the correct single House rep or an
      honest "cannot determine" signal. Verified live (read-only GET) against production
      for THREE independent Gazetteer-only places in three different states — Paradise CDP
      CA (0655528/G4110), Sun City CDP AZ (0470320/G4110), North Springfield CDP VT
      (5051925/G4110) — all three returned `congressional: {cdGeoIds: [], needsExactAddress:
      false, representative: null}`. By contrast, County-tier Gazetteer candidates (G4020)
      DO work (Alpine County CA 06003 correctly returned CD 3 / Rep. Kevin Kiley) because
      nationwide county polygons were already loaded in an earlier, unrelated phase — this
      is not evidence the place-level gap is fixed, it's evidence the fix only works when a
      polygon happens to pre-exist for other reasons.
    artifacts:
      - path: "C:/EV-Accounts/backend/migrations/1378_gazetteer_places_counties.sql"
        issue: "gazetteer_places/gazetteer_counties carry no geometry column — by design (D-08), but this silently breaks CD-overlap computation for every place-level row in these tables"
      - path: "C:/EV-Accounts/backend/src/lib/essentialsBrowseService.ts"
        issue: "getCongressionalOverlapNote()/resolveOverlappingGeoPairs() require a essentials.geofence_boundaries row for the queried geo_id/mtfcc; no point-in-polygon fallback exists for Gazetteer-only (no-geometry) place candidates"
    missing:
      - "A point-in-polygon fallback path (ST_Contains(cd_polygon, ST_MakePoint(intptlong, intptlat))) using gazetteer_places.intptlat/intptlong for candidates with no essentials.geofence_boundaries row, OR an explicit third response state (e.g. cdGeoIds:null / a 'coverage_unavailable' flag) so the frontend does not silently render 'no House district' for these locations."
      - "Live-smoke-test coverage for at least one genuinely Gazetteer-only (non-curated) place candidate's /resolve congressional payload — the Plan 05/06 smoke tests exercised only curated geo_ids (Marana AZ, a MA locality), which all have pre-existing geofence polygons and therefore could not have caught this."
  - truth: "GET /location-search candidates are always resolvable via GET /location-search/resolve (response-contract self-consistency, underpins RSLV-05's guaranteed state+federal floor for a plain state-name query)"
    status: failed
    reason: >
      locationSearchService.ts's mapRow() emits the matched row's own geofence_boundaries.mtfcc
      verbatim. For every State-tier candidate (any bare state name/abbrev query, e.g.
      "Illinois", "IL", "Arizona", "Texas") the paired geofence row's mtfcc is "G4000" (state
      boundary), NOT the empty-string sentinel the file's own doc comment assumes ("State-type
      governments row has no paired geofence_boundaries row" — false in production data).
      essentialsLocationSearch.ts's /resolve route validates mtfcc against a KNOWN_MTFCCS set
      that does not include "G4000" ('', G4110, G4120, G4020, G4040, G5200, G5210, G5220,
      G5400, G5410, G5420 only). Passing a State-tier candidate's own geo_id/mtfcc/state
      (exactly the round-trip the API contract implies: call GET /, take a candidate, call
      GET /resolve with its fields) into /resolve therefore ALWAYS returns 422
      VALIDATION_ERROR — for literally every one of the 50 states + DC. Verified live
      (read-only GET) for two independent states: geo_id=17/mtfcc=G4000/state=IL and
      geo_id=04/mtfcc=G4000/state=AZ — both rejected with `{"code":"VALIDATION_ERROR",
      "message":"mtfcc must be a known MTFCC value"}` / HTTP 422. This breaks the Phase 212
      goal statement's own explicit "bare city, county, OR STATE name" promise at the most
      basic tier (a plain state-name search can never reach the guaranteed statewide+federal
      floor via the documented candidate-to-resolve flow).
    artifacts:
      - path: "C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.ts"
        issue: "KNOWN_MTFCCS set (line ~70-79) omits 'G4000', the actual mtfcc value GET / emits for every State-tier candidate"
    missing:
      - "Add 'G4000' to KNOWN_MTFCCS (or re-derive the set programmatically from the same source locationSearchService.ts's deriveAreaType/mapRow logic actually emits, so the two files can never drift again)."
      - "A live smoke-test case for a bare state-name query end-to-end through /resolve — the Plan 05/06 smoke tests did not include this case."
deferred: []
human_verification: []
---

# Phase 212: Backend Place-Name Resolver & National Fallback Verification Report

**Phase Goal:** Anyone can look up a bare city, county, or state name against the API and get back accurate, disambiguated location data with a guaranteed national fallback to state + federal officials — backed by nationwide Census place coverage, never a different state's officials by mistake.
**Verified:** 2026-07-21T02:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (Roadmap Success Criterion) | Status | Evidence |
|---|---|---|---|
| 1 (SC1) | Bare city/county/state query returns ranked, state-qualified candidates via pg_trgm — never a single silent guess | ✓ VERIFIED | Live GET `/location-search?q=Springfield` → 6 ranked candidates across MA/MO/OH/VT + a school district, each with `state`/`area_type`/`label`. Live GET `?q=Baltimore` → City + County MD candidates. Live GET `?q=Paradise` → 6 CDPs across HI/CA/MT/MO/NV/PA. `locationSearchService.ts` SQL confirmed parameterized ($1 query, $2 limit only), GIN-trgm-indexed (migration 1377/1378 applied live, confirmed via `pg_indexes` catalog query in 212-03-SUMMARY). |
| 2 (SC2) | Same-named-place ("Springfield") and city/county ("Baltimore") collisions each return multiple disambiguated, state/type-labeled candidates, never auto-picked | ✓ VERIFIED | Same live evidence as #1 — Springfield returns 3+ states, Baltimore returns both `· City` and `· County` MD rows with distinct geo_ids (2404000 vs 24510/24005). `deduped`/`DISTINCT ON (geo_id)` CTE confirmed in source; unit tests (`locationSearchService.test.ts`, 25 green) explicitly assert the Springfield/Baltimore/Franklin-VA cases. |
| 3 (SC3) | A Gazetteer-only location (outside curated `coverage.js`) still returns at minimum Senators + Governor/state execs (+ county officials, best-effort per D-03) | ✓ VERIFIED | Live `/resolve` for Paradise CDP (CA, has_local_data:false) and Sun City CDP (AZ, has_local_data:false) both returned non-empty `statewide` (Governor, Lt. Gov, statewide execs, state supreme court) and `federal` (President, Cabinet, US Senators) arrays unconditionally. `county` empty for these (no seeded county roster there) — expected/accepted per D-03 "best-effort, not gated." |
| 4 (SC4) | A city/county profile lists **every** overlapping US House district, with an explicit "need an exact address" note when ambiguous | ✗ **FAILED** | See gap #1 below. Works only for curated/deep-seeded places and for ALL counties (pre-existing nationwide county polygon layer); silently returns `cdGeoIds: []` / `needsExactAddress: false` (a false "no overlap," not a real answer) for Gazetteer-only place-level (G4110) candidates — the majority of this phase's new coverage. Verified live for 3 independent Gazetteer-only places in 3 states. |
| 5 (SC5) | No resolved location ever returns officials bound to a different state (wrong-state guard) | ✓ VERIFIED | `resolveStateAbbrev()` sources state exclusively from the matched row's own `gov_state`/`geofence_state_fips` (mapped via `FIPS_TO_ABBREV`), never from the query string. Live tests: Springfield MA/MO/OH/VT candidates each correctly tagged with their own state; `/resolve` always uses caller-supplied resolved-candidate state, never re-derives from a name. `essentialsLocationSearch.ts` also validates `state` is a strict `^[A-Z]{2}$` before any DB call. |
| 6 (SC6) | The Census one-line geocoder is never invoked for a bare place-name query | ✓ VERIFIED | `grep -rn "geocodeAddress"` against `locationSearchService.ts`, `essentialsLocationSearch.ts`, and the reused `essentialsBrowseService.ts` functions returns zero matches. `geocodeAddress` exists only in the untouched, unrelated `geocodingService.ts` (street-address-only, per its own exported signature `geocodeAddress(address: string)`). |
| 7 (derived — response-contract self-consistency) | Every candidate `GET /location-search` emits can be successfully round-tripped into `GET /location-search/resolve` | ✗ **FAILED** | See gap #2 below. `mapRow()` emits the real geofence `mtfcc` for State-tier rows (`"G4000"`, not the `''` sentinel the code comments assume), but `/resolve`'s `KNOWN_MTFCCS` validation set omits `"G4000"` — every bare state-name candidate (all 50 states + DC) is rejected by `/resolve` with a 422. Verified live for IL (geo_id 17) and AZ (geo_id 04). |

**Score:** 5/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1377_location_search_trgm_indexes.sql` | GIN trgm indexes on governments.name + geofence_boundaries.name | ✓ VERIFIED | Applied live; 4/4 indexes confirmed via `pg_indexes` catalog (212-03-SUMMARY, verbatim). |
| `C:/EV-Accounts/backend/migrations/1378_gazetteer_places_counties.sql` | Nationwide Gazetteer reference tables | ✓ VERIFIED (with residual) | Applied live; `to_regclass` confirms both tables. **No geometry column exists** — this is the direct root cause of gap #1 (SC4 failure), not a separate defect in the migration itself (D-08 didn't scope geometry ingest). |
| `C:/EV-Accounts/backend/scripts/ingest-gazetteer-places-counties.ts` | Idempotent Places+Counties ingest | ✓ VERIFIED | 32,333 places / 3,222 counties live; second run delta==0 (212-03-SUMMARY). 18/18 unit tests green (re-run independently, confirmed). |
| `C:/EV-Accounts/backend/src/lib/locationSearchService.ts` | `searchPlaceNames()` resolver | ✓ VERIFIED, WIRED, DATA FLOWING | Live-queried 6+ times against production with varied inputs (Springfield/Baltimore/Paradise/Sun City/IL/Texas/Arizona/Bloomington) — real ranked, trgm-scored, deduped results every time. 25/25 unit tests green (independently re-run). |
| `C:/EV-Accounts/backend/src/lib/essentialsBrowseService.ts::getCongressionalOverlapNote` | RSLV-06 CD-overlap signal | ⚠️ WIRED but **HOLLOW for Gazetteer-only places** | Function exists, is called, returns a well-typed shape — but see gap #1: for the majority of newly-added nationwide coverage it returns a structurally-valid but factually-wrong empty result, because its only data source (`essentials.geofence_boundaries` polygons) was never extended to cover Gazetteer-only rows. |
| `C:/EV-Accounts/backend/src/routes/essentialsLocationSearch.ts` | `GET /` + `GET /resolve` routes, mounted | ✓ VERIFIED mount, ⚠️ **contract bug** on resolve | Mounted before the `/api/essentials` catch-all (confirmed in `index.ts`, live). `GET /` fully functional live. `GET /resolve` functional for City/County/Township geo_ids but see gap #2: rejects every State-tier candidate with 422. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `index.ts` | `essentialsLocationSearch.ts` | `app.use('/api/essentials/location-search', ...)` before catch-all | ✓ WIRED | Confirmed live (curl 200s on both sub-routes) and in source (mount order correct). |
| `essentialsLocationSearch.ts` | `locationSearchService.ts::searchPlaceNames` | direct import + call | ✓ WIRED | Live GET `/` returns real ranked results. |
| `essentialsLocationSearch.ts` | `essentialsBrowseService.ts::getStatewideOfficials/getFederalOfficials` | `Promise.all` in `/resolve` | ✓ WIRED, DATA FLOWING | Live `/resolve` for Marana AZ and Paradise CDP CA both returned populated statewide/federal official arrays with real names/photos/finance data. |
| `essentialsLocationSearch.ts` | `essentialsBrowseService.ts::getCongressionalOverlapNote` + `getPoliticiansByArea` + `pickHouseRep` | `/resolve` House-rep gate | ✓ WIRED for curated geo_ids; ⚠️ **HOLLOW for Gazetteer-only geo_ids** | Marana AZ → correctly returns Rep. Juan Ciscomani (NATIONAL_LOWER, CD 6). Alpine County CA → correctly returns Rep. Kevin Kiley (CD 3). Paradise CDP CA / Sun City CDP AZ / North Springfield CDP VT → `cdGeoIds: []`, `representative: null` (should not be empty — see gap #1). |
| `essentialsLocationSearch.ts` | `essentialsBrowseService.ts::getPoliticiansByGovernmentList` | `/resolve` county field | ✓ WIRED (best-effort, honest) | Returns `[]` for ungeoseeded counties, real rosters for seeded ones — matches D-03. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|---|---|---|---|---|
| `searchPlaceNames()` candidates | `rows` from live pg_trgm UNION query | `essentials.governments` + `essentials.gazetteer_places/counties` | Yes — 32,333/3,222 real rows confirmed live | ✓ FLOWING |
| `/resolve` `statewide`/`federal` | `getStatewideOfficials(state)`/`getFederalOfficials()` | pre-existing, unmodified live queries | Yes — real officeholders with photos/finance | ✓ FLOWING |
| `/resolve` `congressional.cdGeoIds` (place-level, Gazetteer-only) | `getOverlappingGeoIdsForArea` → `essentials.geofence_boundaries` spatial join | No polygon row exists for the queried geo_id | No — always empty, not because no CD overlaps, but because no geometry exists to compute against | ✗ **DISCONNECTED** for this candidate class |
| `/resolve` `congressional.cdGeoIds` (curated place / any county) | same function | polygon row exists (curated place, or pre-existing nationwide county layer) | Yes | ✓ FLOWING |

### Behavioral Spot-Checks (live, read-only, non-destructive GETs against production)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Springfield multi-state disambiguation | `GET /location-search?q=Springfield&limit=6` | 6 candidates, 4 distinct states/school-district | ✓ PASS |
| Baltimore city/county dual-tier | `GET /location-search?q=Baltimore&limit=5` | City + County MD rows, distinct geo_ids | ✓ PASS |
| Gazetteer-only floor (Paradise CDP) | `GET /resolve?geo_id=0655528&mtfcc=G4110&state=CA` | statewide+federal populated, county empty (honest) | ✓ PASS |
| D-01/212-06 single-CD House-rep fix (Marana AZ) | `GET /resolve?geo_id=0444270&mtfcc=G4110&state=AZ` | `representative` = Juan Ciscomani, NATIONAL_LOWER, CD 6 | ✓ PASS |
| D-01/212-06 fix (Alpine County CA) | `GET /resolve?geo_id=06003&mtfcc=G4020&state=CA` | `representative` = Kevin Kiley, CD 3 | ✓ PASS |
| 212-06 curated null-geo_id LATERAL fix (Bloomington IN) | `GET /location-search?q=Bloomington&limit=6` | `City of Bloomington, Indiana` resolves to `geo_id: "1805860"` (was previously unresolvable/duplicated); the separate `Bloomington Township` row correctly still shows `geo_id: null` (accepted D-09 residual, township has no G4110/G4020 link) | ✓ PASS |
| Gazetteer-only CD overlap (Sun City CDP AZ, North Springfield CDP VT) | `GET /resolve?geo_id=0470320&mtfcc=G4110&state=AZ`, `...5051925&mtfcc=G4110&state=VT` | Both return `cdGeoIds: []`, `representative: null` — no real CD is ever surfaced for these | ✗ **FAIL** (gap #1) |
| State-tier resolve round-trip (IL, AZ) | `GET /resolve?geo_id=17&mtfcc=G4000&state=IL`, `...geo_id=04&mtfcc=G4000&state=AZ` | Both return HTTP 422 `VALIDATION_ERROR: mtfcc must be a known MTFCC value` | ✗ **FAIL** (gap #2) |
| Short-query validation | `GET /location-search?q=x` | HTTP 422 `VALIDATION_ERROR` | ✓ PASS |
| Backend unit suite | `npm run test:unit` (independently re-run, not trusting SUMMARY) | 25 files / 316 tests passed | ✓ PASS |

### Probe Execution

No `scripts/*/tests/probe-*.sh` convention or explicit probe declarations found in this phase's PLAN/SUMMARY files. Step 7c: SKIPPED (no declared probes; live curl spot-checks in the section above substitute for this phase's own smoke-test convention, per its explicit "no Supabase MCP for gsd-executor" project convention).

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|---|---|---|---|---|
| RSLV-01 | 212-01, 04, 05, 06 | Ranked candidate resolver, pg_trgm/f_unaccent, GIN indexes | ✓ SATISFIED (with gap #2 caveat on contract round-trip for State-tier) | Live-verified candidate output; indexes applied. |
| RSLV-02 | 212-01, 02, 03 | Build-time Census Gazetteer ingest (Places+Counties) | ✓ SATISFIED | 32,333/3,222 live rows, idempotent (delta==0 on re-run), 18/18 unit tests. |
| RSLV-04 | 212-04, 05 | Census one-line geocoder never used for place-name queries | ✓ SATISFIED | Zero `geocodeAddress` references in the resolver/route files; geocoder untouched, address-only. |
| RSLV-05 | 212-01, 05, 06 | National fallback floor (Senators+Governor/execs+House, best-effort county) | ⚠️ **PARTIALLY SATISFIED** | Statewide+federal floor unconditionally works (VERIFIED). House guarantee ("every overlapping congressional district ... nationwide") **fails for Gazetteer-only place-level candidates** (gap #1) and **fails entirely for State-tier candidates via the documented API round-trip** (gap #2). |
| RSLV-06 | 212-04, 05, 06 | City/county profile lists every overlapping US House district + exact-address note | ✗ **BLOCKED for Gazetteer-only places** | Same as gap #1 — the note/list is silently absent (not present as an honest "can't determine," and not a real list) for the majority of the nationwide place coverage this phase was built to add. |
| RSLV-07 | 212-04, 05 | Wrong-state guard, regression-tested against prior incidents | ✓ SATISFIED | State always row-sourced; Springfield/Baltimore/Franklin cases live-verified correct; unit + live evidence consistent. |

No orphaned requirements found — RSLV-01/02/04/05/06/07 all appear in at least one plan's `requirements` frontmatter, matching ROADMAP.md's Phase 212 requirements list exactly. (RSLV-03 is correctly scoped to Phase 213, not this phase.)

### Anti-Patterns Found

None. Grep for `TODO|FIXME|XXX|TBD|HACK|PLACEHOLDER|not yet implemented|coming soon` across all Phase-212-touched files (`locationSearchService.ts`, `essentialsLocationSearch.ts`, `essentialsBrowseService.ts`'s new export, the ingest script, both migrations) returned zero debt markers. The one incidental match (a doc comment containing the word "placeholder" in a sentence about *not* fabricating one) is prose, not a marker.

### Human Verification Required

None. Both gaps found are deterministically reproducible via read-only HTTP GETs against the live production API (commands documented above) — no visual, real-time, or subjective judgment is needed to confirm or refute them.

### Gaps Summary

Two live-reproduced, BLOCKER-level gaps were found by testing the deployed resolver against inputs the phase's own live smoke tests (Plans 05/06) did not exercise — both smoke tests validated only curated/deep-seeded geo_ids (Marana AZ, a MA locality) and never a genuinely Gazetteer-only place-level candidate or a bare state-name round-trip:

1. **RSLV-05/RSLV-06/SC4 — nationwide US House guarantee does not actually reach Gazetteer-only places.** The 32,333-row Gazetteer Places table (this phase's headline nationwide-coverage deliverable, D-08) has no geometry column, so the CD-overlap spatial join that both the House-rep guarantee and the "every overlapping district" listing depend on silently returns empty for any Gazetteer-only place-level candidate — a false "no overlap" rather than the real district or an honest "can't determine." Verified live for 3 places in 3 states. Counties are unaffected (pre-existing nationwide county polygon layer already covers them), which is precisely why the phase's own smoke tests — which happened to test a county (Alpine, via the earlier gap-closure) and curated cities — didn't surface this.

2. **Response-contract round-trip is broken for every state.** `GET /location-search` emits `mtfcc: "G4000"` for every State-tier candidate (confirmed IL, AZ, and implied for all 50 states + DC by the shared code path), but `GET /location-search/resolve`'s input-validation allowlist omits `"G4000"`, so passing a state candidate straight back into `/resolve` — the documented, intended flow — always 422s. This means a plain "search a state name" query, the simplest case in the Phase Goal statement itself, can never reach the guaranteed statewide+federal floor via the API as shipped.

Both are narrowly-scoped, mechanical fixes (add `'G4000'` to the known-MTFCC set; add a point-in-polygon or explicit "coverage unavailable" fallback for geometry-less Gazetteer rows) — neither requires new architecture. Recommend routing back through `/gsd:plan-phase --gaps` for a small gap-closure plan (212-07) before Phase 214 (frontend combobox) begins consuming this endpoint, since 214 explicitly depends on 212 being fully live and smoke-tested.

Everything else — disambiguation (SC1/SC2), the Gazetteer-only statewide+federal floor (SC3), the wrong-state guard (SC5), and the geocoder boundary (SC6) — is genuinely, live-verifiably working, not just claimed in the SUMMARYs. The 212-06 gap-closure fixes (House-rep selection via `pickHouseRep`, curated null-geo_id LATERAL resolution) are also independently confirmed live and correct.

---

_Verified: 2026-07-21T02:30:00Z_
_Verifier: Claude (gsd-verifier)_
