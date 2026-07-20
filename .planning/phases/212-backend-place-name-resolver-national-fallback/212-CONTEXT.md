# Phase 212: Backend Place-Name Resolver & National Fallback - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

A DB-truth backend place-name search endpoint (`GET /essentials/location-search`) that:
- Takes a bare city / county / state name and returns **ranked, disambiguated candidate locations** via `pg_trgm` / `f_unaccent` over `essentials.geofence_boundaries` + `essentials.governments` (GIN trigram indexes added in the same migration — no new extension; extends the proven `campaignFinanceSearchService.ts` pattern).
- Is backed by a build-time **US Census Gazetteer ingest** for nationwide place coverage beyond the ~20 curated deep-seeded states.
- Guarantees a **national fallback** to state + federal officials for any resolved US location, with a hard **wrong-state guard** (always a candidate list, never a silent best guess).

**Backend repo:** `C:\EV-Accounts` (accounts-api; Render deploy on push to `master`). This phase is **backend-only** — it must ship and be smoke-tested live (curl/Postman) before Phase 214 (frontend combobox) consumes it.

**This phase does NOT:** touch any frontend, build the combobox UI, or handle coordinate lookup (that is Phase 213). It does NOT invoke the Census one-line address geocoder for place-name queries (RSLV-04 — that geocoder stays street-address-only).

</domain>

<decisions>
## Implementation Decisions

### National-fallback floor (RSLV-05, RSLV-06 — Success Criteria 3 & 4)
- **D-01:** Hard, never-empty nationwide floor = **US Senators + Governor/state executives + US House**. Statewide + Senate already run free (the `essentialsBrowseService.ts` `getStatewideOfficials`/`getFederalOfficials` queries fire unconditionally once a state is known).
- **D-02:** **US House is completed to nationwide guarantee** by folding a single-file national congressional-district geofence ingest (`cd119` nationwide TIGER file — all 435 districts in one file) into this phase's scope. A city/county-name profile lists **every** overlapping CD with the explicit "we need an exact address to tell you which one" note (Criterion 4) — now genuinely deliverable everywhere, not caveated-away.
- **D-03:** **County officials = best-effort, NOT gated.** Rendered only where a county government row has been deep-seeded (Pima, Clark, Riverside, WashCo, …); honest note where absent. RSLV-05's "county officials" is reinterpreted as **"county officials where a county government exists."** Seeding ~3,143 county rosters nationwide is out of scope (that is seeding labor, not a boundary file). → **Requirement wording softens: RSLV-05 → "…county officials where available."**
- **D-04:** No milestone gate — 212 ships with House guaranteed nationwide and county best-effort. (User: "do all the congress, and wait for county.")

### Candidate ranking & labeling (RSLV-01)
- **D-05:** **Label format** per candidate row = `Name, ST · <City|County|State>` (e.g. `Springfield, IL · City`, `Baltimore, MD · County`, `Illinois · State`). Area-type tag is mandatory — it is the disambiguator for city/county collisions (Baltimore city vs. county) that a bare `Name, ST` cannot resolve.
- **D-06:** **Ranking** = trigram similarity as the base score, with **curated/deep-seeded places boosted above bare Gazetteer-only matches** (typing "Tucson" surfaces the fully-seeded Tucson first). Ties broken by exact-match, then population.

### Response contract / coverage signal (RSLV-01)
- **D-07:** Extend the RSLV-01 candidate shape (`{geo_id, mtfcc, label, state}`) with a **per-candidate coverage signal** now — e.g. `has_local_data: boolean` (or `coverage: "local" | "fallback"`), where `local` = a seeded roster exists and `fallback` = state + federal only. Nearly free (ranking already computes curated status) and prevents a Phase 214 contract re-do. Finer stances-badge / `hasContext` styling is deferred to Phase 214.

### Gazetteer ingest scope (RSLV-02)
- **D-08:** Ingest the **full Census Gazetteer Places file (incorporated places AND Census Designated Places — they ship in one file) + the Counties file**. CDPs come for free and catch unincorporated communities people actually search ("Sun City", "Paradise", "East Los Angeles").
- **D-09:** **Exclude** county subdivisions / townships / MCDs (a separate file; adds complexity and no national-fallback benefit until those jurisdictions are seeded). Deferred.
- **D-10:** **Vintage** = latest published Gazetteer, **matched to the TIGER vintage already used for geofences** (the `cd119` / 2023-era set) so boundary names line up.
- **D-11:** Ingest is **idempotent and re-runnable** (truncate+reload or upsert) — not a one-shot script — so an annual refresh stays trivial.

### Wrong-state guard (RSLV-07)
- **D-12:** Always return a ranked candidate list; **never a silent best guess**. State binding is explicit on every candidate. Regression-test against the two prior live incidents: browse `?q=` state-leak (fixed 2026-06-28) and stray `representing_city` banner-hijack (fixed 2026-07-12). Test collision cases: "Springfield" (41+ across states), "Baltimore" (city + county dual-tier), "Franklin, VA".

### Claude's Discretion
- Exact SQL shape of the `word_similarity()` / `%>` trigram query, index definitions, table/column names for the Gazetteer reference table, and the precise numeric boost weights for curated-vs-Gazetteer ranking — all follow the existing `campaignFinanceSearchService.ts` idioms; planner/researcher to finalize.
- Exact JSON key names for the coverage signal (`has_local_data` vs `coverage` enum) — pick whichever reads cleanest for the Phase 214 consumer; keep it a single honest binary at the 212 layer.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone research (READ FIRST — highest-value, grounded in direct repo reads)
- `.planning/research/SUMMARY.md` — milestone-wide findings; §"Phase 1" is this phase; the three "Open Questions for the Roadmapper" (CD coverage gate, Landing.jsx, DB-only badge) are directly relevant.
- `.planning/research/ARCHITECTURE.md` — `locationSearchService.ts` design, split of `getRepresentativesByAddress`, backend→frontend build order.
- `.planning/research/PITFALLS.md` — Pitfalls 1 (wrong-state fallback), 3 (Census can't classify place names), 4/10 (no trigram index yet), 8 (Springfield/Baltimore collisions), 9 (curated-catalog divergence).
- `.planning/research/STACK.md` — pg_trgm/unaccent + Gazetteer stack; no new Postgres extension.
- `.planning/research/FEATURES.md` — disambiguation table-stakes, national-fallback expectations.

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §RSLV — RSLV-01, 02, 04, 05, 06, 07 (note D-03 softens RSLV-05 to "county officials where available").
- `.planning/ROADMAP.md` §"Phase 212" — goal, success criteria, milestone-wide conventions (backend-before-frontend, never route place names through Census, ambiguity always surfaces a candidate list).

### Existing code to extend (backend repo `C:\EV-Accounts`)
- `backend/migrations/040_pg_trgm_search.sql` — the live pg_trgm/unaccent setup to reuse (do NOT re-add the extension).
- `src/lib/campaignFinanceSearchService.ts` — the `word_similarity()` + GIN-index fuzzy-name pattern to extend to place names.
- `src/lib/essentialsBrowseService.ts` — `getStatewideOfficials` / `getFederalOfficials`: the national-fallback data source (runs unconditionally on state).
- `src/lib/geocodingService.ts` — Census one-line geocoder; confirm it stays street-address-only (RSLV-04 guard).
- `src/routes/essentialsBrowse.ts` — where the new `GET /essentials/location-search` route lands.

### Related memories (project GOTCHAs)
- `project_geofence_overlap_perf.md` — the prior unindexed-query performance incident; keep the overlap query index-driven.
- `project_search_api_contract.md`, `project_ca_judicial_districts_null_geoid.md`, `project_representing_city_banner_hijack.md` — prior state-leak / geo_id-null footguns feeding the wrong-state guard tests.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `campaignFinanceSearchService.ts` — near-verbatim template for the pg_trgm `word_similarity()` ranked query + GIN index.
- `essentialsBrowseService.ts::getStatewideOfficials`/`getFederalOfficials` — reused as-is for the state+federal national fallback; no changes needed.
- Existing TIGER loader (loaded `cd119` per-state for AZ, per `project_phase190`/AZ geofence work) — extend to a single nationwide `cd119` load for D-02.

### Established Patterns
- pg_trgm/`f_unaccent` live since migration 040 — extension already enabled; only new GIN indexes + queries are needed.
- Geofence overlap queries must stay GIST/GIN-index-driven (UNION ALL + `&&`) per `project_geofence_overlap_perf` — applies to the CD-overlap list in D-02.
- gsd-executor has **no Supabase MCP** — DB-verify/smoke steps run inline (curl/psql) within the phase.

### Integration Points
- New route `GET /essentials/location-search` in `src/routes/essentialsBrowse.ts`.
- New `locationSearchService.ts` (its own file — returns place names, not politicians).
- New migration: GIN trigram indexes on `geofence_boundaries.name` + `governments.name`, ship in the SAME PR as the query (Pitfall 4).
- New Gazetteer reference table + idempotent ingest script (D-08–D-11).
- Nationwide `cd119` congressional-district geofence load (D-02).

</code_context>

<specifics>
## Specific Ideas

- User's framing for the fallback floor (verbatim): **"Can we do all the congress, and wait for county?"** → guarantee House nationwide (cheap: one CD file), defer county rosters (expensive: ~3,143 rosters of real people). Captured as D-01–D-04.
- Curated places must win the ranking so our best data (deep-seeded rosters + stances + banners) surfaces first — not buried under a closer bare-string Gazetteer match (D-06).

</specifics>

<deferred>
## Deferred Ideas

- **County-subdivision / township (MCD) Gazetteer ingest** — meaningful in New England / NY / PA / mid-Atlantic; deferred (D-09). Revisit if/when those jurisdictions get seeded.
- **Nationwide county roster seeding** — would make RSLV-05's "county officials" literally guaranteed; out of scope, tracked as best-effort (D-03). Future seeding milestones, not v24.0.
- **DB-only-fallback landing UX** (badge copy, chip styling for a place with no local officials) — Phase 214 design decision; 212 only emits the `has_local_data` signal (D-07).
- **Stances/`hasContext` badge granularity** in the resolver response — deferred to Phase 214.

</deferred>

---

*Phase: 212-backend-place-name-resolver-national-fallback*
*Context gathered: 2026-07-20*
