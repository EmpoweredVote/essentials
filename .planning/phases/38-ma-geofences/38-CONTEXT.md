# Phase 38: MA Geofences - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Load all Massachusetts TIGER boundary data (congressional districts, state legislative districts, city/town place boundaries, and county boundaries) into the database so that any MA address resolves correctly via point-in-polygon queries. No government rows, officials, or Landing page changes — this phase is pure geometry loading and verification.

</domain>

<decisions>
## Implementation Decisions

### Place boundary scope
- Load all 351 MA incorporated municipalities (cities and towns), not just Cambridge's GEOID 2511000
- Filter to incorporated places only — exclude Census-Designated Places (CDPs like Kendall Square, East Cambridge) which are statistical areas with no government or officials
- Routing mechanism: geofence intersection (PostGIS point-in-polygon against PLACE boundary), not browseGovernmentList
- Raw geometries only — no pre-linking to government rows; linkage to Cambridge government row happens in Phase 41

### County boundary strategy
- Load all 14 MA counties, not just Middlesex (FIPS 25017)
- Includes island counties: Nantucket (25019) and Dukes/Martha's Vineyard (25007) — PostGIS handles island polygons correctly
- No Landing.jsx changes in Phase 38 — no browse button or coverage area entry yet; Cambridge appears "under the radar" until Phase 41
- Include a backend smoke test after loading Middlesex County: verify a Cambridge address returns the correct US House representative via the county G4020 intersection query (same pattern as Collin County TX smoke test)

### Verification addresses
- Use 4+ Cambridge addresses that probe different district boundaries — not just central Cambridge
- Must include an address that crosses the MA-05/MA-07 congressional boundary within Cambridge (Cambridge straddles both districts)
- Must include a Cambridge/Somerville border address to confirm the PLACE boundary correctly disambiguates — roadmap success criteria explicitly requires "not Boston or Somerville"
- Threshold: any single mismatch between TIGER and FindMyLegislator triggers MassGIS fallback investigation (zero tolerance)
- Document exact district names returned by FindMyLegislator for each test address as ground truth (e.g., "2nd Middlesex Senate District", "25th Middlesex House District", "MA-07") — carry these into Phases 39 and 40 to eliminate research duplication

### MTFCC accuracy check
- Add a hard assertion BEFORE any DB upsert — script must halt if counts are wrong
- Exact expected counts: 9 congressional (CD layer), 40 SLDU (G5210 = STATE_UPPER), 160 SLDL (G5220 = STATE_LOWER), 351 incorporated places
- All four layers asserted, not just legislative
- Assertion failure produces a named error with expected vs. actual counts and the TIGER file reference (e.g., "Expected 40 SLDU, got 38 — check TIGER file for state 25") — no generic throws

### Claude's Discretion
- Script architecture (new generic script vs. TX pattern extension with state flag)
- TIGER file download and caching approach
- geofence_boundaries.state value for MA (expected: '25' per established FIPS pattern)
- Idempotency guard implementation (ON CONFLICT DO NOTHING or equivalent)
- Whether to use separate script invocations per layer or a single --layers flag

</decisions>

<specifics>
## Specific Ideas

- The CA state boundaries script had an inverted MTFCC bug (SLDU/SLDL swapped). TX script was modeled on the known-good US congressional script. The MTFCC assertion is explicitly to prevent this class of bug from silently landing wrong-type rows.
- Cambridge straddles MA-05 (Clark) and MA-07 (Pressley) — the congressional boundary verification is not an edge case, it's a documented success criterion.
- County geo_id format follows established pattern: state FIPS + county FIPS (e.g., Middlesex = '25017')

</specifics>

<deferred>
## Deferred Ideas

- Landing.jsx Cambridge coverage area card — Phase 41
- Wiring Middlesex County's browseCountyGeoId into Landing.jsx — Phase 41 (after Cambridge goes public)
- Future MA county G4020 wiring for other cities (Boston/Suffolk, Worcester, etc.) — future expansion phases

</deferred>

---

*Phase: 38-ma-geofences*
*Context gathered: 2026-05-16*
