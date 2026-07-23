# Phase 212: Backend Place-Name Resolver & National Fallback - Research

**Researched:** 2026-07-20
**Domain:** Backend place-name search (pg_trgm) + Census Gazetteer ingest + nationwide congressional-district overlap resolution, in the accounts-api Express/PostGIS backend (`C:\EV-Accounts`)
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Hard, never-empty nationwide floor = **US Senators + Governor/state executives + US House**. Statewide + Senate already run free (the `essentialsBrowseService.ts` `getStatewideOfficials`/`getFederalOfficials` queries fire unconditionally once a state is known).
- **D-02:** **US House is completed to nationwide guarantee** by folding a single-file national congressional-district geofence ingest (`cd119` nationwide TIGER file — all 435 districts in one file) into this phase's scope. A city/county-name profile lists **every** overlapping CD with the explicit "we need an exact address to tell you which one" note (Criterion 4) — now genuinely deliverable everywhere, not caveated-away.
  > **Research correction — read before planning D-02's tasks:** this session's direct investigation of `C:\EV-Accounts` found that the nationwide `cd119` geofence ingest described here as new scope **already shipped and was verified live in production** by Phase 116 (v2.11, verified 2026-06-12) and Phase 125 (v2.15, completed 2026-06-16) — see Summary and Pitfall 1 below. Also, Census does **not** publish a single-file nationwide `cd119` shapefile (the "all 435 districts in one file" premise); TIGER ships per-state files only, and this codebase already has a working per-state-iteration script that correctly handles that. This decision's *intent* (guarantee House nationwide, list every overlapping CD) is still the goal — but the *mechanism* D-02 describes (new single-file ingest) is very likely already satisfied. The planner should convert D-02 into a Wave 0 DB pre-flight verification task, then scope only the genuinely-missing piece: a small new signal that counts overlapping CDs and surfaces the "needs exact address" note (Pattern 1 in this document).
- **D-03:** **County officials = best-effort, NOT gated.** Rendered only where a county government row has been deep-seeded (Pima, Clark, Riverside, WashCo, …); honest note where absent. RSLV-05's "county officials" is reinterpreted as **"county officials where a county government exists."** Seeding ~3,143 county rosters nationwide is out of scope (that is seeding labor, not a boundary file). → **Requirement wording softens: RSLV-05 → "…county officials where available."**
- **D-04:** No milestone gate — 212 ships with House guaranteed nationwide and county best-effort. (User: "do all the congress, and wait for county.")
- **D-05:** **Label format** per candidate row = `Name, ST · <City|County|State>` (e.g. `Springfield, IL · City`, `Baltimore, MD · County`, `Illinois · State`). Area-type tag is mandatory — it is the disambiguator for city/county collisions (Baltimore city vs. county) that a bare `Name, ST` cannot resolve.
- **D-06:** **Ranking** = trigram similarity as the base score, with **curated/deep-seeded places boosted above bare Gazetteer-only matches** (typing "Tucson" surfaces the fully-seeded Tucson first). Ties broken by exact-match, then name A→Z. *(Amended 2026-07-20 in CONTEXT.md: the original tertiary tiebreak was "population", but the Gazetteer Places/Counties files carry no population column — user approved switching to alphabetical name. No population dataset is ingested.)*
- **D-07:** Extend the RSLV-01 candidate shape (`{geo_id, mtfcc, label, state}`) with a **per-candidate coverage signal** now — e.g. `has_local_data: boolean` (or `coverage: "local" | "fallback"`), where `local` = a seeded roster exists and `fallback` = state + federal only. Nearly free (ranking already computes curated status) and prevents a Phase 214 contract re-do. Finer stances-badge / `hasContext` styling is deferred to Phase 214.
- **D-08:** Ingest the **full Census Gazetteer Places file (incorporated places AND Census Designated Places — they ship in one file) + the Counties file**. CDPs come for free and catch unincorporated communities people actually search ("Sun City", "Paradise", "East Los Angeles").
- **D-09:** **Exclude** county subdivisions / townships / MCDs (a separate file; adds complexity and no national-fallback benefit until those jurisdictions are seeded). Deferred.
- **D-10:** **Vintage** = latest published Gazetteer, **matched to the TIGER vintage already used for geofences** (the `cd119` / 2023-era set) so boundary names line up.
- **D-11:** Ingest is **idempotent and re-runnable** (truncate+reload or upsert) — not a one-shot script — so an annual refresh stays trivial.
- **D-12:** Always return a ranked candidate list; **never a silent best guess**. State binding is explicit on every candidate. Regression-test against the two prior live incidents: browse `?q=` state-leak (fixed 2026-06-28) and stray `representing_city` banner-hijack (fixed 2026-07-12). Test collision cases: "Springfield" (41+ across states), "Baltimore" (city + county dual-tier), "Franklin, VA".

### Claude's Discretion

- Exact SQL shape of the `word_similarity()` / `%>` trigram query, index definitions, table/column names for the Gazetteer reference table, and the precise numeric boost weights for curated-vs-Gazetteer ranking — all follow the existing `campaignFinanceSearchService.ts` idioms; planner/researcher to finalize.
- Exact JSON key names for the coverage signal (`has_local_data` vs `coverage` enum) — pick whichever reads cleanest for the Phase 214 consumer; keep it a single honest binary at the 212 layer.

### Deferred Ideas (OUT OF SCOPE)

- **County-subdivision / township (MCD) Gazetteer ingest** — meaningful in New England / NY / PA / mid-Atlantic; deferred (D-09). Revisit if/when those jurisdictions get seeded.
- **Nationwide county roster seeding** — would make RSLV-05's "county officials" literally guaranteed; out of scope, tracked as best-effort (D-03). Future seeding milestones, not v24.0.
- **DB-only-fallback landing UX** (badge copy, chip styling for a place with no local officials) — Phase 214 design decision; 212 only emits the `has_local_data` signal (D-07).
- **Stances/`hasContext` badge granularity** in the resolver response — deferred to Phase 214.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| RSLV-01 | DB place-name resolver endpoint returns ranked candidates `{geo_id, mtfcc, label, state}` via pg_trgm/f_unaccent over `geofence_boundaries`+`governments`, with GIN trigram indexes added | Pattern 2 (UNION query + index DDL), Code Examples (verbatim query/index idiom to mirror), Pitfall 4 (index-in-same-PR discipline) |
| RSLV-02 | Build-time Census Gazetteer (Places+Counties) ingest populates a reference table for nationwide place coverage beyond `coverage.js` | Standard Stack (adm-zip already available, no new deps), Code Examples (record layout), Pitfall 2 (per-file URL nuance), Open Question 3 (vintage/layout confirmation) |
| RSLV-04 | Census one-line geocoder used only for full street addresses, never bare place names | Architectural Responsibility Map, Validation Architecture test map (assertion that resolver never imports `geocodeAddress`) — confirms existing `geocodingService.ts` scope is already correct and must not be widened |
| RSLV-05 | National fallback (US Senators + Governor/state execs + US House, + county where seeded) for any resolved location | Pattern 3 (reuse `getStatewideOfficials`/`getFederalOfficials`/`getOverlappingGeoIdsForArea` — these already run nationwide) |
| RSLV-06 | City/county profile lists every overlapping US House district with an "exact address" note | Pattern 1 (reuse `getOverlappingGeoIdsForArea`; new `getCongressionalOverlapNote` helper), Summary's central finding (CD data already nationwide) |
| RSLV-07 | Wrong-state guard — never a different state's officials; always a candidate list | Pitfall 3 (concrete regression cases + root-cause pattern from two prior live incidents), Pattern 2 (state sourced from matched row, never the query string) |
</phase_requirements>

## Summary

This phase's biggest risk is not the pg_trgm query (that pattern is mature and proven in this codebase) — it is a **stale premise baked into 212-CONTEXT.md's D-02**. The context describes D-02 as "folding a single-file national congressional-district geofence ingest (`cd119` nationwide TIGER file — all 435 districts in one file) into this phase's scope," as if it were new work. Direct investigation of `C:\EV-Accounts` shows this is **already done, live, and verified in production** by two prior phases in an earlier milestone (v2.11 Phase 116, verified 2026-06-12; v2.15 Phase 125, completed 2026-06-16): all 435+ US House congressional districts exist as `essentials.geofence_boundaries` rows (`mtfcc='G5200'`) and `essentials.geo_districts` rows (`layer='us_house'`), every `essentials.districts` row with `district_type='NATIONAL_LOWER'` has `tiger_geoid` populated, and 299+137 real House representatives are seeded and FK-linked (3 known vacancies: FL-20, GA-13, TX-23 — unseeded by design, not a gap). The existing overlap-resolution helper `resolveOverlappingGeoPairs()` (`essentialsBrowseService.ts`) already includes `G5200` in its "Branch 3" interior-overlap query, so **any city/county area browse in this codebase today already surfaces every overlapping US House rep nationwide** as a side effect of infrastructure that predates this phase. Also material: Census does **not** publish a single-file nationwide `cd119` shapefile — TIGER only ships per-state files (51: 50 states + DC) — and the codebase already has a working per-state-iteration script (`load-national-house-districts.ts`) that correctly handles this, discovered as a "deviation from plan" during Phase 116.

This does not mean Phase 212 has no CD-related work — it means the work is **narrower** than D-02 implies. The genuinely new work is: (1) the place-name resolver itself (`locationSearchService.ts`, pg_trgm over `geofence_boundaries`/`governments`, modeled on the proven `campaignFinanceSearchService.ts` idiom); (2) the Census Gazetteer Places+Counties ingest for nationwide place-name coverage beyond curated `governments` rows; (3) wiring a resolved place into the *existing* `getStatewideOfficials`/`getFederalOfficials`/`getOverlappingGeoIdsForArea` pipeline for the national fallback (RSLV-05); (4) a new, small "ambiguous CD count" signal so the frontend can render the "we need an exact address" note (RSLV-06) — today's overlap functions return a flat politician list with no such count; and (5) the wrong-state guard and disambiguation contract in the new resolver (RSLV-07). The planner should verify current CD/House-seeding completeness with a live DB pre-flight query at the start of Wave 0 (row counts against `essentials.geofence_boundaries WHERE mtfcc='G5200'` and `essentials.districts WHERE district_type='NATIONAL_LOWER'`) rather than assume either this research's finding or D-02's premise — both are strong claims that deserve a cheap, direct check before tasks are written.

**Primary recommendation:** Treat D-02 as "verify + wire into the resolver," not "ingest from scratch" — spend the D-02 budget on the new CD-overlap-count signal and Gazetteer/name-resolver work, and gate any actual re-ingest behind a pre-flight DB audit confirming the prior phases' claims are stale/incomplete before writing ingest tasks.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Place-name → ranked candidates (RSLV-01) | API / Backend (`locationSearchService.ts`) | Database (pg_trgm GIN indexes) | Fuzzy text ranking must run in Postgres via `pg_trgm`, not client-side — the candidate set (curated + Gazetteer) is tens of thousands of rows |
| Nationwide Gazetteer place coverage (RSLV-02) | Database / Storage (new reference table) | API (ingest script invoked at build/deploy time, not request time) | Static reference data, refreshed rarely (D-11 idempotent re-run); no request-time network call |
| Address-only geocoding (RSLV-04) | API / Backend (`geocodingService.ts`, unchanged) | — | Already correctly scoped; this phase only adds a *sibling* path, never widens Census's role |
| National fallback officials (RSLV-05) | API / Backend (existing `essentialsBrowseService.ts` functions, reused) | Database (existing `essentials.districts`/`offices`/`politicians` joins) | `getStatewideOfficials`/`getFederalOfficials` already run unconditionally on state — no new tier needed, just a new caller |
| CD-overlap list + ambiguity note (RSLV-06) | API / Backend (new signal on top of `getOverlappingGeoIdsForArea`) | Database (existing G5200 geofences + GIST index, already loaded nationwide) | The geometry work is done; only the API-shape work (surfacing count + note) is new |
| Wrong-state guard (RSLV-07) | API / Backend (`locationSearchService.ts` response contract) | — | Must be enforced at the resolver boundary — never inferred downstream from a loose string match |

## Standard Stack

### Core

| Library / Extension | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pg_trgm` (Postgres contrib) | Already enabled (migration `040_pg_trgm_search.sql`) [VERIFIED: direct file read] | Trigram fuzzy match for place names | Already the proven pattern for `essentials.politicians.full_name`; this phase extends it to two new columns, no new extension |
| `unaccent` + `public.f_unaccent()` (IMMUTABLE wrapper) | Already enabled (same migration) [VERIFIED: direct file read] | Accent-insensitive matching, indexable | Raw `unaccent()` is STABLE and cannot back a GIN expression index — the existing wrapper is required and must be reused verbatim, not re-created |
| PostGIS `ST_Intersects` / `&&` (GIST-indexed) | Already in use (`resolveOverlappingGeoPairs`) [VERIFIED: direct file read] | CD-overlap resolution for RSLV-06 | Existing Branch-3 logic in `essentialsBrowseService.ts` already includes `G5200` in its overlap set; reuse `getOverlappingGeoIdsForArea()` rather than writing a new overlap query |
| `adm-zip` (^0.5.16), `shapefile` (^0.6.6) | Already backend deps [VERIFIED: package.json read] | Unzip + stream TIGER/Gazetteer files | Both already used by `load-state-tiger-boundaries.ts` and `load-national-house-districts.ts`; the Gazetteer files are plain pipe-delimited text inside a zip, so `adm-zip` alone (no shapefile parsing needed) suffices for the ingest script |
| `pg` (^8.13.0) | Already backend dep | DB pool / client | Unchanged |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| *(none — hand-parse)* | — | Pipe-delimited Gazetteer line parsing | `line.split('|').map(s => s.trim())` is sufficient — Gazetteer files are fixed-column pipe-delimited text, not a format needing a dedicated parser library |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pg_trgm `word_similarity()` ranked query | Postgres full-text search (`tsvector`) | Not needed — place names are short, low-cardinality strings; trigram is the already-proven tool in this exact codebase for exactly this shape of query |
| Reusing `getOverlappingGeoIdsForArea()` for RSLV-06 | Writing a new, parallel CD-only overlap query | Reuse is strictly better — the existing function already has the `&&` pre-filter + GIST-index-driven shape this project's own `project_geofence_overlap_perf` incident requires; a parallel implementation risks reintroducing the unindexed-OR mistake |

**Installation:**
```bash
# No new npm packages required for this phase (backend or frontend).
# pg_trgm / unaccent / f_unaccent already live (migration 040).
# adm-zip / shapefile / pg already installed backend dependencies.
```

**Version verification:** No new packages to verify. Extension versions (`pg_trgm`, `unaccent`) are Postgres-core `contrib` modules with no separate version-pinning risk; already confirmed live via direct read of `backend/migrations/040_pg_trgm_search.sql`.

## Package Legitimacy Audit

**Not applicable — this phase installs zero new external packages.** Every tool it needs (`pg_trgm`, `unaccent`, `adm-zip`, `shapefile`, `pg`) is already an enabled Postgres extension or an existing `package.json` dependency, confirmed via direct file reads. No `npm install` step, no slopcheck run, no registry verification needed. If a future planning pass introduces a new package (e.g., a dedicated pipe-delimited CSV parser), re-run the Package Legitimacy Gate at that time.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │  GET /essentials/location-search?q=         │
                    │  (NEW route, essentialsBrowse.ts or new file)│
                    └───────────────────┬───────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  locationSearchService.ts (NEW)              │
                    │  searchPlaceNames(query, limit)               │
                    │   1. UNION query: governments (curated, boost)│
                    │      + gazetteer_places/gazetteer_counties    │
                    │      (nationwide fallback) via pg_trgm         │
                    │   2. Static 50-state name/abbrev exact match  │
                    │   3. Rank: curated boost > exact > population │
                    │   4. Label: "Name, ST · City|County|State"    │
                    │   5. Coverage signal: has_local_data / coverage│
                    └───────┬───────────────────────┬───────────────┘
                            │ (curated hit)          │ (Gazetteer-only hit)
                            ▼                        ▼
              ┌─────────────────────┐   ┌─────────────────────────────┐
              │ existing government │   │ new gazetteer_places /       │
              │ row → chamber/office│   │ gazetteer_counties ref tables │
              │ pipeline (unchanged)│   │ (build-time ingest, D-08/D-11)│
              └─────────────────────┘   └─────────────────────────────┘
                            │                        │
                            └───────────┬────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  National-fallback wiring (mostly REUSE)      │
                    │  getStatewideOfficials(state)  [UNCHANGED]     │
                    │  getFederalOfficials()          [UNCHANGED]    │
                    │  getOverlappingGeoIdsForArea(geoId, mtfcc)     │
                    │    [UNCHANGED — already includes G5200]        │
                    │  + NEW: count distinct NATIONAL_LOWER matches  │
                    │    → surface "needs exact address" note        │
                    └───────────────────┬───────────────────────────┘
                                        ▼
                    ┌─────────────────────────────────────────────┐
                    │  Postgres/PostGIS                             │
                    │  essentials.geofence_boundaries (mtfcc=G5200  │
                    │    already loaded nationwide — Phase 116)      │
                    │  essentials.districts (NATIONAL_LOWER,         │
                    │    tiger_geoid — already backfilled — Ph 116)  │
                    │  essentials.governments / .districts / .offices│
                    │  NEW: gazetteer_places, gazetteer_counties      │
                    │  NEW: GIN trgm indexes on governments.name,    │
                    │    geofence_boundaries.name, gazetteer tables  │
                    └─────────────────────────────────────────────┘
```

A resident types a bare city/county/state name → the new route ranks candidates from curated `governments` rows (boosted) and the new nationwide Gazetteer tables → the frontend (Phase 214, out of scope here) will show a disambiguated list → once a candidate's `geo_id`/`state` is chosen, the *existing, unmodified* national-fallback machinery (`getStatewideOfficials`, `getFederalOfficials`, `getOverlappingGeoIdsForArea`) resolves officials, already including nationwide US House via infrastructure this phase does not need to rebuild.

### Recommended Project Structure

```
backend/src/
├── lib/
│   ├── locationSearchService.ts     # NEW — searchPlaceNames(query, limit)
│   ├── essentialsBrowseService.ts   # MODIFIED (small) — add a helper that
│   │                                 #   counts distinct NATIONAL_LOWER geo_ids
│   │                                 #   in an overlap result set (RSLV-06 signal)
│   ├── campaignFinanceSearchService.ts  # UNCHANGED — pattern to mirror, not import from
│   └── geocodingService.ts          # UNCHANGED — confirm scope stays address-only
├── routes/
│   └── essentialsBrowse.ts          # MODIFIED — + GET /location-search?q=
│       (or a new essentialsLocationSearch.ts route file, per existing
│        one-route-file-per-concern convention)
└── migrations/  (or supabase/migrations/, per current convention — confirm at
                   plan time which directory is live; backend/migrations/ was
                   used through at least migration 1376)
    ├── 1377_location_search_trgm_indexes.sql   # GIN indexes: governments.name,
    │                                            # geofence_boundaries.name
    └── 1378_gazetteer_places_counties.sql       # New reference tables

backend/scripts/
└── ingest-gazetteer-places-counties.ts   # NEW — idempotent (D-11) build-time
                                            # ingest, modeled on
                                            # load-national-house-districts.ts's
                                            # download/extract/stream/upsert shape
                                            # (minus the shapefile parsing —
                                            # Gazetteer is flat pipe-delimited text)
```

### Pattern 1: Reuse the existing overlap machinery for RSLV-06 — do not write a new CD query

**What:** `getOverlappingGeoIdsForArea(geoId, mtfcc)` (`essentialsBrowseService.ts`) already resolves every geofence — including `G5200` congressional districts — that overlaps a given area, via `resolveOverlappingGeoPairs()`'s Branch 3 (`ST_Intersects` + `&&` pre-filter, GIST-index-driven). This is the exact "every overlapping CD" computation RSLV-06 needs.
**When to use:** Any time the resolver needs "which US House district(s) overlap this place." Call the existing function; do not duplicate its SQL.
**Trade-offs:** The function currently returns geo_id/mtfcc pairs and (via callers) a flat politician list — it does not surface a distinct-count of `NATIONAL_LOWER` matches. Add a thin wrapper: after resolving `geoPairs`, filter to `mtfcc==='G5200'`, count distinct pairs, and if count > 1, set the response's ambiguity note. If count === 0 (unlikely nationwide now, but possible for a not-yet-audited edge case), honestly omit House rather than fabricate.

```typescript
// NEW small helper — essentialsBrowseService.ts (or locationSearchService.ts)
export async function getCongressionalOverlapNote(
  geoId: string,
  mtfcc: string
): Promise<{ cdGeoIds: string[]; needsExactAddress: boolean }> {
  const { geoPairs } = await getOverlappingGeoIdsForArea(geoId, mtfcc);
  const cdPairs = geoPairs.filter((p) => p.mtfcc === 'G5200');
  return {
    cdGeoIds: cdPairs.map((p) => p.geo_id),
    needsExactAddress: cdPairs.length > 1,
  };
}
```

### Pattern 2: Place-name resolver as UNION of curated `governments` + new Gazetteer tables

**What:** Model `locationSearchService.ts` directly on `campaignFinanceSearchService.ts`'s `word_similarity()` + `f_unaccent()` + GIN-index + length-calibrated-threshold idiom, but UNION two sources so curated rows outrank Gazetteer-only rows (D-06):
```sql
-- Source: modeled on campaignFinanceSearchService.ts (backend/src/lib/campaignFinanceSearchService.ts)
WITH curated AS (
  SELECT g.geo_id, g.name, g.type AS area_type, g.state,
         extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(g.name))) AS sim,
         1 AS source_boost  -- curated rows rank above Gazetteer-only rows (D-06)
  FROM essentials.governments g
  WHERE public.f_unaccent(lower(g.name)) operator(extensions.%>) public.f_unaccent(lower($1))
    AND extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(g.name))) >= <threshold>
),
gazetteer AS (
  SELECT gp.geo_id, gp.name, 'place'::text AS area_type, gp.state,
         extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(gp.name))) AS sim,
         0 AS source_boost
  FROM essentials.gazetteer_places gp
  WHERE public.f_unaccent(lower(gp.name)) operator(extensions.%>) public.f_unaccent(lower($1))
    AND extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(gp.name))) >= <threshold>
  UNION ALL
  SELECT gc.geo_id, gc.name, 'county'::text, gc.state,
         extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(gc.name))),
         0
  FROM essentials.gazetteer_counties gc
  WHERE public.f_unaccent(lower(gc.name)) operator(extensions.%>) public.f_unaccent(lower($1))
    AND extensions.word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(gc.name))) >= <threshold>
)
SELECT * FROM curated
UNION ALL
SELECT * FROM gazetteer
ORDER BY source_boost DESC, sim DESC, name ASC
LIMIT $2;
```
**When to use:** This is the core RSLV-01 query. The threshold calibration (2-4/5-7/8+ char tiers from `campaignFinanceSearchService.ts`) should be copied verbatim as a starting point, then re-tuned if place-name false-positive/negative rates differ from politician-name rates.
**Trade-offs:** `essentials.governments` has **no unique constraint on `geo_id`** [VERIFIED: comment in `backend/migrations/1288_pima_county_board_of_supervisors.sql`, line 31] — a UNION against it for text search is fine (no write happens here), but do not assume `geo_id` uniqueness when joining back to other tables from a `governments` match; join on `governments.id` (the real PK) if a second join is ever needed, not `geo_id`.

### Pattern 3: National fallback = call existing functions, do not reimplement

**What:** Once the resolver returns a candidate's `{geo_id, mtfcc, state}`, feed `state` into the **unchanged** `getStatewideOfficials(state)` and `getFederalOfficials()`, and feed `{geo_id, mtfcc}` into the **unchanged** `getOverlappingGeoIdsForArea()` / `getPoliticiansByArea()` (or `getPoliticiansByGovernmentList()` for a government-only row with no geofence). This is the "mostly already free" pattern documented in the milestone-wide ARCHITECTURE.md and confirmed correct by this phase's own deep-dive.
**When to use:** Every national-fallback response.
**Trade-offs:** None net-new — the risk is purely in *not* reusing these functions (reimplementing the statewide/federal/overlap SQL is the actual pitfall; see Pitfall 1 below).

### Anti-Patterns to Avoid

- **Re-ingesting nationwide CD119 geometry from scratch:** D-02's literal wording implies new ingest work. Do not write a new nationwide CD119 loader task without first running a live-DB pre-flight count (`SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='G5200'` — expect ≥435; `SELECT COUNT(*) FROM essentials.districts WHERE district_type='NATIONAL_LOWER' AND tiger_geoid IS NOT NULL` — expect ≥435). If the counts confirm completeness (as this research strongly indicates), D-02's task list should be "verify + wire the overlap-count signal," not "ingest."
- **Assuming Census publishes `tl_2024_us_cd119.zip`:** it does not. Confirmed twice in this codebase's own history (Phase 116's "Deviation 1," and the standalone comment at the top of `load-national-house-districts.ts`). Any new ingest script (Gazetteer or otherwise) that assumes a single nationwide file for a TIGER-style congressional layer will 404.
- **Joining CD overlap logic against `mtfcc='G5200V26'`:** `geoIdGuard.ts` explicitly excludes this MTFCC from the general-purpose guard, reserving it for a separate 2026-redistricting-vintage election-matching join in `electionService.ts`. RSLV-06's "who represents you now" query must use `G5200` (current officeholder vintage), not the newer redistricting-vintage boundaries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy place-name matching | A custom Levenshtein/substring scorer | `pg_trgm` `word_similarity()` + GIN index | Already the proven, indexed, sub-100ms pattern in this exact DB for the identical problem shape (politician names) |
| "Which CDs overlap this area" | A new PostGIS query | `getOverlappingGeoIdsForArea()` (existing) | Already GIST-index-driven and already includes G5200; a fresh implementation risks repeating the unindexed-`OR` mistake this project already fixed once (`project_geofence_overlap_perf`) |
| Nationwide congressional-district data | A new ingest pipeline | Verify existing `essentials.geofence_boundaries`/`essentials.districts` rows from Phase 116/125 first | The work may already be done; confirm before building |
| Pipe-delimited Gazetteer parsing | A dedicated CSV/TSV npm package | `line.split('|')` | The format is trivial fixed-column pipe-delimited text; a library adds a dependency for no real benefit |

**Key insight:** This phase's dominant risk is *underestimating what's already built* (redoing Phase 116/125's work) and *overestimating what's safe to skip* (the new ambiguity-count signal, the Gazetteer ingest, and the resolver's own disambiguation contract are genuinely new and must not be shortcut).

## Common Pitfalls

### Pitfall 1: Redoing the nationwide CD119 ingest that Phase 116/125 already shipped
**What goes wrong:** A plan writes a new "download all 51 state cd119 files and load them" task, duplicating `load-national-house-districts.ts`'s already-completed, already-verified work — burning a wave of execution time and risking a regression (e.g., accidentally re-deriving `SKIP_CODES` including `'00'`, a bug Phase 116 already hit and fixed for at-large states).
**Why it happens:** D-02 in 212-CONTEXT.md is written as if this were new scope; the milestone-wide research (SUMMARY/ARCHITECTURE/PITFALLS/STACK/FEATURES, all dated 2026-07-20) did not discover this prior EV-Accounts milestone history because it focused on the essentials frontend + a shallower backend read.
**How to avoid:** Wave 0 of this phase should include a DB pre-flight audit (row counts against `geofence_boundaries`/`districts`/`geo_districts` as specified in Pitfall/Anti-Pattern above) before any ingest task is written. If the audit confirms completeness, D-02's actual deliverable becomes the RSLV-06 overlap-count signal (Pattern 1 above), not new ingest.
**Warning signs:** A plan task titled "load nationwide cd119 boundaries" with no preceding DB-verification step.
**Phase to address:** This phase, Wave 0.

### Pitfall 2: Assuming a single nationwide TIGER file exists for any per-state-published layer
**What goes wrong:** A new script (e.g., for a hypothetical future re-ingest, or for the Gazetteer ingest itself if a wrong assumption transfers) requests `tl_2024_us_cd119.zip` or similar and gets a 404, discovered only at execution time.
**Why it happens:** TIGER's naming convention *looks* like it should have a national file (many TIGER products do — e.g., the `county` layer's `tl_${v}_us_county.zip` genuinely exists), but `cd`/`cd119` does not; this asymmetry has already bitten this exact codebase once (Phase 116 Deviation 1).
**How to avoid:** The Census **Gazetteer** files (needed for D-08) genuinely DO ship as single national files (`2024_Gaz_place_national.zip`, `2024_Gaz_counties_national.zip`) — confirmed via the official Census Gazetteer Files page [CITED: census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html]. Do not confuse this with TIGER shapefile products, which are per-state for `cd`/`cd119`/`sldu`/`sldl` and ALSO per-state for `place` (confirmed by `load-state-tiger-boundaries.ts`'s per-state `place` urlTemplate) — only `county` has a genuine `_us_` national TIGER file among the layers this codebase has needed so far. Verify per-layer before assuming.
**Warning signs:** Any new script hardcoding a `_us_` URL for a layer not previously confirmed to publish one.
**Phase to address:** This phase (Gazetteer ingest task) and any future TIGER-layer work.

### Pitfall 3: Wrong-state fallback via loose string matching (repeat of two prior live incidents)
**What goes wrong:** The resolver derives a fallback state from a substring/loose match rather than the actual matched geo_id's own `state` column, reproducing the exact failure shape of two prior live bugs in this codebase: the browse `?q=` state-leak (fixed 2026-06-28) and the `representing_city` banner hijack (fixed 2026-07-12).
**Why it happens:** Both prior bugs shared the root cause "a fallback/default value silently wins when the correct value is empty or ambiguous." A hastily-written resolver that falls back to a "best guess" row instead of forcing disambiguation recreates this pattern in a brand-new code path.
**How to avoid:** Every candidate row returned by `locationSearchService.ts` must carry its `state` sourced directly from the matched `governments.state` or `gazetteer_places/gazetteer_counties.state` column (from the Gazetteer `USPS` column, per record layout below) — never inferred from the query string. When more than one candidate exists, the API must return the full ranked list; it must never silently collapse to one row. Add explicit regression test cases for "Springfield" (cross-state collision), "Baltimore" (city/county dual-tier — this codebase already models Baltimore as both `G4110=2404000` and its county-equivalent), and "Franklin, VA" (independent city + county both named Franklin).
**Warning signs:** Any resolver code path with `||`/`??` fallback to a "best" or "first" row when multiple matches exist.
**Phase to address:** This phase — must ship the disambiguation contract in the same PR as the resolver, not as a follow-up.

### Pitfall 4: Shipping the pg_trgm query without the GIN index in the same migration
**What goes wrong:** The resolver query works correctly but sequentially scans `essentials.governments`/the new Gazetteer tables on every keystroke-adjacent request, repeating this project's own prior `project_geofence_overlap_perf` incident pattern (an unindexed query that caused a 4+ second stall).
**Why it happens:** It's easy to write and test the query against a small local dataset where the missing index isn't noticeable, then ship without the index migration.
**How to avoid:** The GIN trgm index migration (on `governments.name`, `geofence_boundaries.name` if used, and both new Gazetteer tables) must be in the **same PR** as the query, mirroring migration `040_pg_trgm_search.sql`'s pattern exactly (`gin_trgm_ops` on `public.f_unaccent(lower(name))`). Run `EXPLAIN ANALYZE` on the shipped query and confirm an index scan, not a sequential scan, before calling the task done.
**Warning signs:** A migration PR that adds only the query, or an index PR that lands in a later wave.
**Phase to address:** This phase, same wave as the resolver.

### Pitfall 5: Curated-catalog / DB-truth divergence for the coverage signal (D-07)
**What goes wrong:** The `has_local_data`/`coverage` signal is derived from the frontend's static `coverage.js` catalog (or a similarly hand-maintained list) instead of live DB state, and drifts — a jurisdiction that's actually been deep-seeded shows as `fallback`, or vice versa.
**Why it happens:** `coverage.js` is a legitimate, separate artifact (drives the Landing-page grid) that has drifted from DB truth before (multiple "coverage.js reconciled" milestone-close line items in project history) — but it is the *wrong* source of truth for a backend API's coverage signal.
**How to avoid:** Compute the coverage signal from a live query — e.g., `EXISTS (SELECT 1 FROM essentials.chambers ch JOIN essentials.governments g ON g.id = ch.government_id WHERE g.geo_id = $1)` or an equivalent "does this geo_id have at least one office/chamber" check — never from `coverage.js`. This satisfies D-06's ranking boost and D-07's coverage signal from the same underlying fact.
**Warning signs:** Any backend code importing or duplicating `coverage.js`'s arrays.
**Phase to address:** This phase (RSLV-01 response contract).

## Code Examples

### Existing pg_trgm fuzzy-search pattern to mirror (verbatim structure)
```typescript
// Source: C:\EV-Accounts\backend\src\lib\campaignFinanceSearchService.ts (direct read)
const threshold = query.length <= 4 ? 0.15 : query.length <= 7 ? 0.25 : 0.30;
// ... word_similarity(public.f_unaccent(lower($1)), public.f_unaccent(lower(col))) AS sim
// ... WHERE public.f_unaccent(lower(col)) operator(extensions.%>) public.f_unaccent(lower($1))
// ...   AND extensions.word_similarity(...) >= ${threshold}
// ... ORDER BY sim DESC, <tiebreak> ASC
```

### Existing GIN index pattern to mirror (verbatim structure)
```sql
-- Source: C:\EV-Accounts\backend\migrations\040_pg_trgm_search.sql (direct read)
CREATE INDEX IF NOT EXISTS idx_governments_name_trgm
  ON essentials.governments
  USING GIN (public.f_unaccent(lower(name)) extensions.gin_trgm_ops);
-- Repeat for essentials.gazetteer_places.name and essentials.gazetteer_counties.name.
```

### Existing overlap-resolution call to reuse for RSLV-06
```typescript
// Source: C:\EV-Accounts\backend\src\lib\essentialsBrowseService.ts (direct read)
const { geoPairs, stateAbbrev } = await getOverlappingGeoIdsForArea(geoId, mtfcc);
const cdPairs = geoPairs.filter((p) => p.mtfcc === 'G5200');
// cdPairs.length > 1 => surface "we need an exact address to tell you which one"
```

### Gazetteer record layout (for the new ingest script)
```
Places file columns (pipe-delimited, in order):
  USPS | GEOID | ANSICODE | NAME | LSAD | FUNCSTAT | ALAND | AWATER | ALAND_SQMI | AWATER_SQMI | INTPTLAT | INTPTLONG

Counties file columns (pipe-delimited, in order):
  USPS | GEOID | ANSICODE | NAME | ALAND | AWATER | ALAND_SQMI | AWATER_SQMI | INTPTLAT | INTPTLONG
```
[CITED: census.gov/programs-surveys/geography/technical-documentation/records-layout/gaz-record-layouts/gaz23-record-layouts.html — 2023 layout fetched directly; column set has been stable across recent vintages per Census's own "2012-2024" layout index page, but the exact 2024/2025 layout page returned 404 on direct fetch and was not independently re-verified this session — see Assumptions Log A2]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Per-state `cd119` load only for onboarded states (`load-state-tiger-boundaries.ts` STATE_LAYER_ALLOWLIST: CA, TX, UT, IN, MA, ME, OR, MD, VA, NV, AZ, DC) | Nationwide `cd119` load for ALL 50 states + DC via a dedicated script (`load-national-house-districts.ts`) | Phase 116, verified 2026-06-12 | Every US location — not just onboarded states — already resolves its US House rep via the district point-in-polygon query and, per Pattern 1 above, via area overlap too |
| No House-rep officials for most states | 299 new House-rep politician/office rows seeded, FK-linked via `tiger_geoid`, nationwide (minus 3 known vacancies) | Phase 125, completed 2026-06-16 | The "national fallback returns real people, not just geometry" claim is already substantively true for US House |

**Deprecated/outdated:**
- Treating "nationwide CD coverage" as an open milestone-level risk (as the milestone-wide SUMMARY.md's "Open Question 1" frames it) — this phase's direct investigation resolves that question for US House specifically: coverage already exists. The milestone-wide research's framing should be considered superseded by this phase-level finding for RSLV-05/06 purposes.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The nationwide CD119/House-rep data (Phase 116/125) remains complete and unregressed as of this phase's execution (no schema drift, no rows deleted since 2026-06-16) | Summary, Pitfall 1, Anti-Patterns | If wrong, D-02 genuinely needs new/repair ingest work — mitigated by the recommended Wave 0 DB pre-flight audit, which converts this from an assumption into a verified fact before any task execution |
| A2 | The exact 2024/2025 Gazetteer file column layout matches the fetched 2023 layout (USPS/GEOID/ANSICODE/NAME/[LSAD/FUNCSTAT for places]/ALAND/AWATER/ALAND_SQMI/AWATER_SQMI/INTPTLAT/INTPTLONG) | Code Examples, Pitfall 2 | Low risk — Census's own documentation index groups 2012-2024 layouts together, suggesting stability, but the exact current-year page 404'd on direct fetch this session; verify against the actual downloaded file's header row (if present) or the current-year record-layout page before writing the ingest script's column mapping |
| A3 | `essentials.geofence_boundaries` and `essentials.governments` schemas (columns: geo_id/ocd_id/name/state/mtfcc/geometry/source/imported_at and id/name/type/state/city/geo_id respectively) are current — inferred from query/insert code reads, not a live `\d` schema dump | Standard Stack, Pattern 2 | Low risk — these columns are used consistently across dozens of files read directly in this session; a live schema check at plan/execute time is still good practice but unlikely to surface surprises |

## Open Questions

1. **Is the Phase 116/125 nationwide House data still complete?**
   - What we know: Verified complete and passing as of 2026-06-12 (Phase 116) and 2026-06-16 (Phase 125), per this session's direct reads of `116-VERIFICATION.md` and `125-02-SUMMARY.md`.
   - What's unclear: Whether any subsequent migration, rollback, or data-hygiene pass since then touched `mtfcc='G5200'` rows or `district_type='NATIONAL_LOWER'` rows.
   - Recommendation: Wave 0 pre-flight DB count query (see Anti-Patterns) — cheap, decisive, should run before any D-02 task is finalized.
   - **RESOLVED:** Addressed by the Wave-0 DB pre-flight audit in Plan 01 Task 1 (212-01) — the G5200 / NATIONAL_LOWER row counts are verified live before any dependent work, converting this assumption into a checked fact.

2. **Which migrations directory is currently authoritative — `backend/migrations/` or `supabase/migrations/`?**
   - What we know: Both directories exist and have been actively used across this project's history (e.g., migration 342 lives in `supabase/migrations/`, migration 1376 in `backend/migrations/`); recent city deep-seed phases (1288-1376) used `backend/migrations/`.
   - What's unclear: Whether there's a current single-source-of-truth convention as of the most recent phases, or whether this varies by change type (structural DDL vs. RLS vs. seed data).
   - Recommendation: Confirm at plan time by checking the most recent 2-3 committed migrations' directory and any `CLAUDE.md`/`PROJECT.md` convention note in `C:\EV-Accounts`.
   - **RESOLVED:** `C:/EV-Accounts/backend/migrations/` is adopted as authoritative for this phase (it carried migrations through 1376); Plans 01/03 author + apply 1377 and 1378 there.

3. **Exact 2024/2025 Gazetteer file column layout**
   - What we know: 2023 layout (fetched directly) is `USPS|GEOID|ANSICODE|NAME|LSAD|FUNCSTAT|ALAND|AWATER|ALAND_SQMI|AWATER_SQMI|INTPTLAT|INTPTLONG` for Places, and the same minus LSAD/FUNCSTAT for Counties.
   - What's unclear: Whether the 2024/2025 vintage adds/removes/reorders any column (the direct record-layout page for those years 404'd during this session).
   - Recommendation: When the ingest script is written, parse the header row if the downloaded file includes one, or fetch `https://www.census.gov/programs-surveys/geography/technical-documentation/records-layout/gaz-record-layouts/gaz24-record-layouts.html` (or the 2025 equivalent) at execution time to confirm before finalizing the column-mapping code.
   - **RESOLVED:** Plan 02 Task 1 (212-02) verifies the Gazetteer column layout against the downloaded file’s own header row at run time and never hardcodes an unverified vintage — the ingest maps columns by verified header index.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `pg_trgm` Postgres extension | RSLV-01 resolver query | ✓ | Already enabled (migration 040) | — |
| `unaccent` + `f_unaccent()` | RSLV-01 resolver query | ✓ | Already enabled (migration 040) | — |
| `adm-zip` npm package | Gazetteer ingest script | ✓ | ^0.5.16 (existing dep) | — |
| `shapefile` npm package | Not needed for Gazetteer (plain text); already used elsewhere | ✓ | ^0.6.6 (existing dep) | N/A — not required for this phase's ingest |
| Census Gazetteer Files download endpoint (`www2.census.gov`) | RSLV-02 ingest | ✓ (public, no key) | 2024/2025 vintage available | None needed — free, no auth |
| Live Postgres write access for migrations | All new DDL/DML | Assumed ✓ (existing deploy pipeline) | — | — |

**Missing dependencies with no fallback:** None identified.
**Missing dependencies with fallback:** None identified — this phase adds zero new external service dependencies.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.0 (backend) [VERIFIED: package.json read] |
| Config file | `backend/vitest.config.ts` (assumed present per existing `test`/`test:unit` scripts — not independently opened this session) |
| Quick run command | `npm run test:unit -- src/lib/locationSearchService` (once the new test file exists) |
| Full suite command | `npm run test` (from `backend/`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RSLV-01 | Ranked candidates for a bare place-name query | unit | `vitest run src/lib/locationSearchService.test.ts` | ❌ Wave 0 |
| RSLV-02 | Gazetteer ingest is idempotent (re-run produces 0 new inserts) | unit/integration | `vitest run scripts/ingest-gazetteer-places-counties.test.ts` | ❌ Wave 0 |
| RSLV-04 | Census geocoder never invoked for non-address input | unit | Existing `geocodingService` test suite (confirm no call-site addition) + a new assertion in the resolver's own tests that it never imports `geocodeAddress` for name-shaped input | ❌ Wave 0 (new assertion) |
| RSLV-05 | National fallback returns state+federal for a Gazetteer-only (non-curated) place | integration | `vitest run src/lib/locationSearchService.test.ts` (fallback branch) | ❌ Wave 0 |
| RSLV-06 | Multi-CD overlap returns `needsExactAddress: true`; single-CD returns the exact rep | unit | `vitest run src/lib/essentialsBrowseService.test.ts` (new `getCongressionalOverlapNote` cases) | ❌ Wave 0 |
| RSLV-07 | "Springfield"/"Baltimore"/"Franklin, VA" all return multiple disambiguated candidates, never a silent pick | unit | `vitest run src/lib/locationSearchService.test.ts` (disambiguation cases) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `vitest run src/lib/locationSearchService.test.ts` (or the relevant new/modified test file)
- **Per wave merge:** `npm run test` (full backend suite)
- **Phase gate:** Full suite green + live curl/psql smoke test (no Supabase MCP available to gsd-executor per project convention) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/lib/locationSearchService.test.ts` — covers RSLV-01, RSLV-05, RSLV-07
- [ ] `backend/scripts/ingest-gazetteer-places-counties.test.ts` — covers RSLV-02 idempotency (D-11)
- [ ] New test cases in `backend/src/lib/essentialsBrowseService.test.ts` (or equivalent) — covers RSLV-06's `getCongressionalOverlapNote` helper
- [ ] DB pre-flight audit script/query (not a test file — an inline psql/curl check run once at Wave 0 start) confirming Phase 116/125 completeness before any ingest task is scoped

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | This is a public, unauthenticated read endpoint (`optionalAuth`, matching existing browse routes) |
| V3 Session Management | No | Stateless GET, no session state |
| V4 Access Control | No | No resource-level access control needed — all data returned is already public |
| V5 Input Validation | Yes | Query length validation (`q.length >= 2`, matching `search-by-name`'s existing 422 convention); reject/ignore non-string query params |
| V6 Cryptography | No | No secrets/crypto involved |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection via the search query string | Tampering | Parameterized queries only (`$1`, `$2`, ...) — the existing `campaignFinanceSearchService.ts` pattern already interpolates only code-derived values (the threshold), never user input, directly into SQL; the new resolver must follow the identical discipline |
| Information disclosure via internal IDs | Information Disclosure | Explicit field whitelists in the response mapping (mirroring `campaignFinanceSearchService.ts`'s "never object spread" convention) — never return raw DB internal columns (e.g., `governments.id` UUID) unless the frontend contract requires it |
| Unindexed-query DoS (a keystroke-driven typeahead hammering an unindexed table) | Denial of Service | GIN trgm index shipped in the same PR as the query (Pitfall 4); rate limiting is out of scope for this phase but worth flagging to Phase 214 for the frontend debounce contract |

## Sources

### Primary (HIGH confidence — direct repo reads this session)
- `C:\EV-Accounts\backend\migrations\040_pg_trgm_search.sql` — pg_trgm/unaccent/f_unaccent already live
- `C:\EV-Accounts\backend\src\lib\campaignFinanceSearchService.ts` — fuzzy-search query idiom to mirror
- `C:\EV-Accounts\backend\src\lib\geocodingService.ts` — confirmed address-only scope (RSLV-04)
- `C:\EV-Accounts\backend\src\lib\essentialsBrowseService.ts` — `getStatewideOfficials`, `getFederalOfficials`, `resolveOverlappingGeoPairs`, `getOverlappingGeoIdsForArea`, `getPoliticiansByGovernmentList` (all reusable as-is)
- `C:\EV-Accounts\backend\src\routes\essentialsBrowse.ts` — existing route conventions to mirror for the new `/location-search` route
- `C:\EV-Accounts\backend\src\routes\essentialsCandidates.ts` — `search-by-name` route convention (422 on short query, `optionalAuth`, `Cache-Control`)
- `C:\EV-Accounts\backend\src\lib\geoIdGuard.ts` — `MTFCC_DISTRICT_TYPE_GUARD`, confirms `G5200`→`NATIONAL_LOWER` and the separate `G5200V26` election-vintage exclusion
- `C:\EV-Accounts\backend\scripts\load-state-tiger-boundaries.ts` — per-state TIGER loader, `STATE_LAYER_ALLOWLIST`, nationwide-county precedent (`processNationwideCounty`)
- `C:\EV-Accounts\backend\scripts\load-national-house-districts.ts` — **already-shipped nationwide cd119 per-state-iteration loader**, with its own documented "Census does not publish a single national file" deviation note
- `C:\EV-Accounts\backend\test\load-state-tiger-boundaries-nationwide.test.ts` — confirms nationwide mode is currently gated to the `county` layer only in the generalized loader
- `C:\EV-Accounts\.planning\milestones\v2.11-phases\116-national-us-house-tiger\116-VERIFICATION.md` — PASSED, 4/4 truths verified, nationwide CD119 + tiger_geoid backfill complete (2026-06-12)
- `C:\EV-Accounts\.planning\milestones\v2.15-phases\125-national-house-rep-ingestion\125-02-SUMMARY.md` — 299 House reps seeded/linked nationwide, 3 known vacancies (2026-06-16)
- `C:\EV-Accounts\supabase\migrations\20260612000001_342_national_house_tiger_geoid_backfill.sql` — self-asserting migration confirming ≥435 NATIONAL_LOWER rows, applied to production
- `C:\EV-Accounts\backend\migrations\1288_pima_county_board_of_supervisors.sql` — confirms `essentials.governments` columns and "no unique constraint on geo_id"
- `backend/package.json` — confirms `adm-zip`, `shapefile`, `pg`, `vitest` already present; no new deps needed
- `C:\EV-Accounts\backend\.tmp-national-cd119\` — cached, already-downloaded per-state cd119 shapefiles (50 states + DC), corroborating the completed prior ingest

### Secondary (MEDIUM confidence)
- Census Gazetteer Files official page (`census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html`) — confirms pipe-delimited format, 2025 URL pattern; 2024-specific page not independently re-verified
- 2023 Gazetteer record layout page (`census.gov/programs-surveys/geography/technical-documentation/records-layout/gaz-record-layouts/gaz23-record-layouts.html`) — column layout for Places/Counties files, used as a stand-in for the 2024/2025 layout (see Assumptions Log A2)

### Tertiary (LOW confidence)
- None — all claims in this document are either direct repo reads or officially-cited Census documentation, with uncertainty explicitly flagged in the Assumptions Log where a same-year source could not be directly confirmed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new dependencies, every recommendation grounded in direct reads of live, already-proven code in this exact repo
- Architecture: HIGH — the single most important finding (nationwide House data already complete) is corroborated by three independent artifacts (verification report, summary report, and a self-asserting production migration), not a single source
- Pitfalls: HIGH — every pitfall is grounded in this project's own source and its own documented prior incidents, matching the milestone-wide research's existing pitfall style
- Gazetteer file format: MEDIUM — column layout confirmed for 2023 vintage via direct fetch; 2024/2025-specific layout page returned 404 this session and should be re-confirmed at execution time

**Research date:** 2026-07-20
**Valid until:** 30 days (stable domain — Postgres extensions and this project's own already-shipped infrastructure do not change quickly; the one fast-moving fact — live DB row counts — is explicitly gated behind a Wave 0 pre-flight check rather than treated as permanently valid)
