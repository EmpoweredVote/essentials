# Phase 57: CA Geofences - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Load TIGER geofence boundaries for all California government tiers: G4110 (all incorporated cities), G4040 (unincorporated COUSUBs statewide), SLDU (40 senate districts), SLDL (80 assembly districts), CD (52 congressional districts), G4020 (58 counties). Any CA address should route to the correct boundary rows. City governments, state officials, and federal officials are seeded in subsequent phases — this phase is boundaries only.

</domain>

<decisions>
## Implementation Decisions

### G4110 City Scope
- Load ALL ~480 CA incorporated cities — not just the 7 v7.0 target cities
- Exact count gate: researcher verifies expected total from TIGER; SQL assert must match exactly (catches partial loads)
- San Francisco consolidated city-county: load both G4110 (city) and G4020 (county) rows — mtfcc field distinguishes them; no special loader handling needed
- After smoke test in 57-02: capture and document geo_ids for all 7 v7.0 target cities (SF, LA, San Jose, San Diego, Sacramento, Fremont, Berkeley) in the plan summary for use by Phases 63-68

### G4040 COUSUB Scope
- Load statewide — all 58 CA counties (not just counties near our 7 target cities)
- Exact count gate: researcher verifies expected CA COUSUB total from TIGER
- Routing intent for unincorporated addresses: county government (e.g., East LA residents → LA County Board of Supervisors as LOCAL officials). County governments are a future seeding phase but the routing path is established by this boundary load.
- Add overlap verification: SQL check that no geo_id appears in both G4110 and G4040 layers for CA (ensures no address accidentally returns both a city and a COUSUB boundary)

### Smoke Test Addresses
- **Urban (address 1):** San Francisco — exercises the consolidated city-county edge case (should return both G4110 city boundary and G4020 county boundary from same address)
- **Suburban (address 2):** San Diego — southern CA, different congressional/assembly districts from SF, good geographic diversity
- **Unincorporated (address 3):** East Los Angeles, LA County — high-population G4040 community often confused with City of LA; verifies that an address inside LA County but outside City of LA returns G4040 COUSUB (not G4110 city) as the LOCAL tier
- **Assertion precision:** Assert specific district values for each address — researcher pre-identifies the correct CD/SLDU/SLDL/county district names; SQL gates assert those exact values. Non-NULL alone is insufficient (would pass routing to the wrong district).

### Claude's Discretion
- Exact TIGER layer key for CA congressional districts (check TIGER2024/CD/ directory before configuring — ME used `cd119` not `cd`)
- `districts.state` casing per established pattern (lowercase for COUNTY/STATE_UPPER/STATE_LOWER; UPPERCASE for NATIONAL_LOWER)
- Loader run order and any state-specific TIGER filename quirks
- Specific street addresses within SF, San Diego, and East LA for the 3 smoke test queries

</decisions>

<specifics>
## Specific Ideas

- East LA unincorporated is a high-value test because many users would enter an East LA address thinking they're in the City of Los Angeles — the test verifies the boundary layer correctly distinguishes them
- G4040 in CA is NOT like MA/ME towns (which are governing municipalities) — CA G4040 COUSUBs are county subdivisions without their own government; routing them to county government is the correct intent

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 57-ca-geofences*
*Context gathered: 2026-05-21*
