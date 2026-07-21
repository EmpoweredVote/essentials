# Phase 213: Anonymous Coordinate Lookup Endpoint - Context

**Gathered:** 2026-07-20
**Status:** Ready for planning

<domain>
## Phase Boundary

A stateless, unauthenticated backend endpoint that takes raw decimal `lat`/`lng` and returns officials for that point via PostGIS `ST_Covers` — with **zero auth, zero DB writes, US bounding-box + swapped-coordinate validation, and no coordinate leakage** into responses, logs, or analytics.

**Backend repo:** `C:\EV-Accounts` (accounts-api; Render deploy on push to `master`). This phase is **backend-only** and must ship + be smoke-tested live (curl/Postman) before Phase 214 (frontend combobox) consumes it. It is structurally independent of Phase 212's text-search surface (can build in parallel once planned).

**This phase does NOT:** touch any frontend, build the combobox UI (Phase 214), geocode addresses (the point is already precise — no Census call), or persist/cache the submitted coordinate anywhere.

</domain>

<decisions>
## Implementation Decisions

### Request shape & transport privacy (Criterion 3)
- **D-01:** **`POST` with a JSON body `{ lat, lng }`** — matches the roadmap's "Posting a valid US decimal lat/lng" wording and keeps coordinates out of Render/proxy access logs by default (GET query params would be written verbatim, forcing extra log-scrubbing). Exact route path is planner discretion (e.g. `POST /api/essentials/coordinate-lookup`).

### US bounding box & swap guard (Criterion 2)
- **D-02:** **Generous US scope = all 50 states + DC + PR/territories.** The bbox must NOT silently reject legitimate Alaska/Hawaii/Puerto Rico lookups. Planner picks the exact bbox constants (mind Alaska's Aleutians crossing the antimeridian).
- **D-03:** **Swap guard = reject a point that is only valid when lat/lng are swapped** (i.e. `(lat,lng)` is outside the US box but `(lng,lat)` is inside). This is a distinct, specific rejection from a plain out-of-box point — never silently query the swapped point as if valid.

### Response contract & fallback floor (Criteria 1 & 3)
- **D-04:** **Reuse the `getRepresentativesByAddress` / `AddressSearchResult` response shape.** A coordinate is just a pre-geocoded address, so it flows through the same `ST_Covers` politician query and returns the **exact single US House rep** for the precise point (RSLV-05). Factor the coordinate-only core out of `getRepresentativesByAddress` so it does NOT re-geocode.
- **D-05:** **Apply Phase 212's state+federal fallback floor** (`getStatewideOfficials` / `getFederalOfficials`) so a valid US point never returns empty — a coordinate in an unseeded area still yields US Senators + Governor/state execs + US House.
- **D-06:** **Never echo the raw submitted coordinate back.** `AddressSearchResult` carries no lat/lng today (verified); the coordinate path must also leave `matchedAddress` empty/null (there is no reverse-geocode) rather than reflecting the input.

### Errors & telemetry (Criteria 2 & 3)
- **D-07:** **Distinct `422` validation codes** — `OUTSIDE_US_BOUNDS` / `SWAPPED_COORDINATES` / `INVALID_COORDINATES` (malformed/non-numeric) — so the Phase 214 frontend can message precisely. Mirrors the existing `422 VALIDATION_ERROR` family on `/essentials/elections`.
- **D-08:** **Zero coordinate-bearing telemetry.** Emit NO analytics event that carries the coordinate (the strictest reading of Criterion 3). If any usage metric is ever wanted, it must be coordinate-free — but none is required for this phase.

### Claude's Discretion
- Exact route path/name, the precise refactor that exposes a coordinate-only core of `getRepresentativesByAddress` (vs. a shared private helper both call), and the exact US bbox numeric constants.
- Whether to add `express-rate-limit` to the anonymous endpoint (the middleware is already used on other anonymous routes — see code_context). Not a locked requirement; planner may add basic abuse protection if cheap.
- Exact JSON error envelope fields beyond the code string.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` §RSLV-03 — the anonymous, stateless coordinate lookup requirement (ST_Covers, US bbox, swap guard, no writes). Also RSLV-05 (exact House rep when a precise point is available; state+federal floor).
- `.planning/ROADMAP.md` §"Phase 213" — goal + the 3 success criteria that bound this phase, and the milestone-wide conventions (backend-before-frontend hard dependency; ambiguity/validation never silent).

### Existing code to extend/reuse (backend repo `C:\EV-Accounts`)
- `backend/src/lib/essentialsService.ts` — `getRepresentativesByAddress` (lines ~566–804): the `ST_Covers` politician query + `AddressSearchResult` shape (line 153) to reuse; the `ST_MakePoint($1=lng, $2=lat)` coordinate-order footgun is documented inline (lines 573–576, 647–648) — **$1 is ALWAYS longitude**.
- `backend/src/routes/essentials.ts` — `GET /api/essentials/elections?lat=&lng=` (lines ~129–149): the existing **anonymous coordinate endpoint precedent** — coordinate validation + `422 VALIDATION_ERROR` pattern to mirror (D-07).
- `backend/src/lib/essentialsBrowseService.ts` — `getStatewideOfficials` / `getFederalOfficials`: the Phase 212 state+federal fallback floor to apply (D-05).
- `backend/src/index.ts` — app wiring + existing `express-rate-limit` usage (also `routes/events.ts`, `routes/feedback.ts`, `routes/auth.ts`) — reusable abuse-protection pattern (Claude's discretion, D-07 note).

### Prior-phase context
- `.planning/phases/212-backend-place-name-resolver-national-fallback/212-CONTEXT.md` — the national-fallback floor design (D-01/D-02 there), coordinate-order and geofence-overlap footguns; 213 is the coordinate sibling of that text-search surface.

### Related memories (project GOTCHAs)
- `project_geofence_overlap_perf.md` — keep the overlap/`ST_Covers` query GIST-index-driven.
- `project_ca_judicial_districts_null_geoid.md`, `project_representing_city_banner_hijack.md` — prior wrong-location incidents; the swap guard + explicit state binding are the regression guards.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getRepresentativesByAddress` (`essentialsService.ts:620`) — its `ST_Covers` `districtQueryText` block IS the coordinate→officials core. Factor a coordinate-only entry point so the anonymous endpoint skips the Census geocode.
- `AddressSearchResult` interface (`essentialsService.ts:153`) — reuse verbatim; it carries no raw lat/lng, so Criterion 3 holds as long as the coordinate path leaves `matchedAddress` empty.
- `getStatewideOfficials` / `getFederalOfficials` (`essentialsBrowseService.ts`) — the Phase 212 fallback floor, applied as-is.
- `GET /essentials/elections?lat=&lng=` handler (`routes/essentials.ts:129`) — template for anonymous coordinate validation + `422` responses.
- `express-rate-limit` — already imported/used on anonymous routes; available if the planner wants abuse protection.

### Established Patterns
- `ST_MakePoint($1::float8, $2::float8)` = **(longitude, latitude)** — $1 longitude, $2 latitude. Non-negotiable coordinate order (documented footgun).
- Geofence overlap/covering queries stay GIST-index-driven (`project_geofence_overlap_perf`).
- gsd-executor has **no Supabase MCP** — DB-verify/smoke steps run inline (curl/psql) within the phase.

### Integration Points
- New route: `POST /api/essentials/coordinate-lookup` (path TBD) mounted in the essentials route surface + `index.ts`.
- Reuses the essentials `ST_Covers` politician query and the 212 statewide/federal fallback — no new tables, no migrations expected (verify during planning).

</code_context>

<specifics>
## Specific Ideas

- The endpoint is the "precise point" counterpart to Phase 212's fuzzy place-name search: a coordinate resolves the **exact** US House district (RSLV-05), where a bare city name can only list every overlapping district.
- Criterion 3 is treated as a hard privacy contract: POST body (not query), no coord echo (empty `matchedAddress`), and no coordinate in any log or analytics event.

</specifics>

<deferred>
## Deferred Ideas

- **Reverse-geocoding a human-readable place label for the coordinate** — out of scope; the response intentionally omits a matched address to avoid echoing/deriving location text from the raw point.
- **Usage analytics for coordinate lookups** — deferred entirely (D-08); if ever added it must be coordinate-free.
- **Rate-limiting / abuse hardening** — noted as available (`express-rate-limit`) but not a locked requirement; planner's discretion.

None of these expand the phase boundary — discussion stayed within scope.

</deferred>

---

*Phase: 213-anonymous-coordinate-lookup-endpoint*
*Context gathered: 2026-07-20*
