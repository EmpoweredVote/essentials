# Phase 53: Portland City Structure + All 23 City Scaffolding + Landing - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Scaffold all 23 Maine incorporated city governments in the database; deeply seed Portland (Mayor, City Council, School Board) with incumbents and headshots; add Maine to Landing.jsx. Creating incumbents for the other 22 cities and seeding election races are separate phases (54 and 55).

</domain>

<decisions>
## Implementation Decisions

### Portland City Council Structure
- Researcher must verify Portland's current charter: number of seats, at-large vs district breakdown, and whether seats changed under the 2023 charter reform
- Mayor modeling rule (applies to all 23 cities): if Mayor votes on City Council, seat them first in the Council chamber with title `Mayor`; if Mayor is a separate executive (no council vote), create a separate executive chamber — researcher verifies Portland's model
- RCV scope: researcher verifies exactly which Portland offices use `election_method='rcv'` — do not assume it applies to all offices; may be Council only, or Council + Mayor, etc.
- Include ALL directly elected Portland officials (not just Mayor + Council + School Board) — any office where Portland residents vote goes in; appointed officials (City Manager, City Clerk) are excluded this phase

### Portland School Board
- Researcher verifies seat structure (at-large vs district, how many seats)
- Model as a separate chamber under Portland city government: `Portland School Board`
- If seats are district-based, load TIGER sub-district boundaries this phase — strong preference for loading TIGER rather than leaving routing as gap
- Headshot pass in Plan 53-03 includes School Board members alongside Council; sources: portlandmaine.gov + portland.k12.me.us; document gaps where photos not available online

### Skeletal City Scaffolding (22 non-Portland cities)
- Depth: government row + chambers + blank offices (politician_id=NULL) for all 22 cities — not chambers-only; Phase 54 fills in incumbents
- Researcher builds city-by-city office inventory for all 22 cities — each city gets the correct number and type of seats matching its actual charter structure, not a generic template
- School boards/committees: create school chamber only where researcher confirms the body is directly elected by city residents; skip where school governance is not a city-elected body
- Election method: researcher checks `election_method` per city for all 23 cities — any confirmed RCV cities get `election_method='rcv'` from the start, not deferred to Phase 55
- Mayor modeling rule (same as Portland): if Mayor votes on Council → first council row with title `Mayor`; if separate executive → own chamber

### Landing.jsx Maine Entry
- Add Maine to COVERAGE_AREAS array in Landing.jsx with:
  - `browseGovernmentList: ['2360545']` — Portland city browse (geo_id for Portland, ME)
  - `browseStateAbbrev: 'ME'` — ME state browse
  - Display: `county: 'Portland'` (or match the label style used by Cambridge/Collin County entries)
- Visual treatment: same as MA and TX — no Maine-specific photo needed, match existing card pattern
- Frontend-only change — no new API endpoints; COVERAGE_AREAS is a static config array
- Landing.jsx change goes in Plan 53-03 alongside headshots

### Claude's Discretion
- Exact chamber slug format for the 22 non-Portland cities (follow existing slug generation pattern)
- Whether to use `county` label for "Portland" or a different display name — look at how Cambridge is labeled vs Collin County
- School board chamber naming (e.g., `portland-school-board` vs `portland-school-committee`)
- Migration numbering (next available after 173)

</decisions>

<specifics>
## Specific Ideas

- Mayor-on-council rule: "if he is and votes on council stuff, then put them first in the Council Section with the title 'Mayor'" — applies universally to all 23 cities
- "I'd rather have more TIGER boundaries setup than not" — if Portland School Board has district seats, load TIGER boundaries rather than routing all seats citywide
- Landing.jsx pattern confirmed: `browseGovernmentList` + `browseStateAbbrev` is the right shape — matches Cambridge (browseGovernmentList + browseStateAbbrev) and Collin County entries

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 53-portland-city-structure*
*Context gathered: 2026-05-19*
