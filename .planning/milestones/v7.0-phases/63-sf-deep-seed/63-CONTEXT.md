# Phase 63: San Francisco Deep Seed - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the City and County of San Francisco government structure, all elected and key appointed incumbents, and headshots — so any SF address returns a complete local officials list. Supervisor district geofence boundaries must be loaded as part of this phase to enable per-district routing. SFUSD and City College Board of Trustees are separate government entities and are NOT in scope.

</domain>

<decisions>
## Implementation Decisions

### Office scope
- Seed all 7 citywide elected offices: Mayor, City Attorney, District Attorney, Sheriff, Assessor-Recorder, Treasurer, Public Defender
- Seed all 11 District Supervisors (Board of Supervisors)
- Seed 2 appointed offices with is_appointed_position=true: Controller, City Administrator
- Total: 20 officials
- SF Superior Court judges: out of scope for Phase 63
- Board of Supervisors President: internal governance role elected by board members, NOT a separate office row — each supervisor holds one office tied to their district only

### Government structure
- One government row: "City and County of San Francisco" — consolidates city + county roles under one entity
- Chamber name: "Board of Supervisors" (no "San Francisco" prefix — it's under the SF government row)
- County-role offices (Sheriff, Assessor-Recorder) hang off the same consolidated government row — no separate county government row

### Supervisor district routing
- Load SF Board of Supervisors district boundaries as a custom geofence layer from DataSF (data.sfgov.org), parallel to how LAUSD board districts were loaded in Phase 58
- This should be handled in plan 63-01 alongside government structure setup
- district_type='LOCAL' for SF supervisor districts — consistent with TX/MA city council district pattern
- mtfcc: Claude's discretion — use X00xx custom pattern, non-colliding with X0005 (LA County supervisors)
- source label: 'sf_supervisor_districts_2022' (or current DataSF vintage)
- Use current (post-2022 redistricting) district boundaries

### Headshot sourcing
- Primary source: official SF government sites — sfbos.org bios for all 11 supervisors; sf.gov for Mayor; individual department/office sites for DA, City Attorney, Sheriff, Assessor-Recorder, Treasurer, Public Defender, Controller, City Administrator
- Fallback: news/press release photos if no clean photo on official site
- Plan structure: 3 plans (63-01: structure + geofences, 63-02: incumbents, 63-03: headshots)
- All headshots at 600×750, Lanczos, q90 per established standard

### Claude's Discretion
- Exact mtfcc code for SF supervisor boundaries (X00xx non-colliding)
- How to model is_appointed_position for Controller vs. City Administrator (both are appointed)
- External_id numbering scheme for SF officials (follow CA city pattern)
- Whether to add a 63-00 plan for geofence loading or fold it into 63-01

</decisions>

<specifics>
## Specific Ideas

- SF supervisor boundaries must use post-2022 redistricting map — the 2020 lines are outdated
- "City and County of San Francisco" is the official legal name — use that verbatim for the government row
- The Board of Supervisors President is elected internally by the 11 members; do not create a separate office row for this role

</specifics>

<deferred>
## Deferred Ideas

- SFUSD Board of Education seed — separate government entity, own phase
- SF City College Board of Trustees — separate government entity, own phase
- SF Superior Court judges — judicial phase if ever pursued
- SF 2026 local elections (Supervisor races, DA race) — Phase 69 scope

</deferred>

---

*Phase: 63-sf-deep-seed*
*Context gathered: 2026-05-21*
