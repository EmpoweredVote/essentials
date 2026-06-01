# Phase 67: Fremont Deep Seed - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Fremont city government — structure, incumbents, and headshots — so a Fremont address returns a complete local officials list. The Fremont G4110 city boundary (geo_id=0626000) is already loaded from Phase 57. This phase adds government scaffold, officials, and (if district-based) sub-district geofences.

</domain>

<decisions>
## Implementation Decisions

### Council model
- The researcher must confirm whether Fremont uses a district-based or at-large council model — not assumed in advance
- **If district-based**: load sub-district geofences in Plan 01 alongside government structure (same pattern as SD Phase 65-01); claim MTFCC=X0008 for Fremont council districts; researcher finds the shapefile source (city portal, Alameda County GIS, or best available)
- **If at-large**: no sub-district geofences needed; all council seats share one LOCAL district (geo_id=0626000)
- Smoke test for Plan 01: confirm a Fremont address returns city officials (G4110 routing baseline); district-level routing verified separately if applicable

### Elected vs appointed offices
- Researcher audits the full elected slate from Fremont's charter or city elections page — do not assume Mayor + Council only
- Check whether City Clerk, City Treasurer, or other offices are popularly elected in Fremont (CA general law city may hold those elections)
- Seed all elected offices found; also seed prominent appointed offices (City Attorney, etc.) with is_appointed_position=true — same pattern as SF (Controller + City Admin)

### Geofence strategy
- City boundary already loaded (Phase 57); Plan 01 only adds sub-district rows if district-based
- Researcher selects best available shapefile source for council districts if needed
- No MTFCC collision risk: X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont (reserved)

### Headshot sourcing
- Primary source: fremont.gov official elected officials / council bios page
- Fallback: city news releases or press photos for anyone missing from the main bio page
- photo_license: public_domain for all fremont.gov government-produced official portraits
- All headshots resized to 600×750 JPEG before upload

### Claude's Discretion
- External_id range assignment for Fremont officials (follow established city prefix pattern)
- Exact chamber names and formal names (researcher derives from fremont.gov)
- office title wording for council members (e.g., "Council Member (District N)" vs "Council Member (At-Large N)")

</decisions>

<specifics>
## Specific Ideas

- The district-vs-at-large question is the single biggest unknown and must be resolved first in research — it determines plan shape entirely
- Follow SF/SD pattern: Plan 01 = structure + geofences, Plan 02 = incumbents + office links, Plan 03 = headshots

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 67-fremont-deep-seed*
*Context gathered: 2026-05-22*
