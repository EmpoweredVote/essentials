# Phase 52: ME State Legislature + Headshots - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed all 35 Maine state senators (131st Legislature) and 151 house representatives with politicians, offices, and district links to the SLDU/SLDL geofence rows loaded in Phase 49. Upload headshots for all 186 from mainelegislature.org. Legislature-elected offices (AG, SoS, Treasurer) were handled in Phase 51 and are out of scope here.

</domain>

<decisions>
## Implementation Decisions

### Headshot scale strategy
- Senators first (35), then house reps (151) — two separate passes
- mainelegislature.org headshots are auto-approved (official legislature portraits); exceptions flagged manually
- Best effort coverage — upload every available headshot; missing ones documented, not blocking
- If a headshot is poor quality or below 600x750 usable resolution: flag it, skip it, treat as missing (no bad photos)
- Plan structure: 52-01 (senators migration), 52-02 (reps migration), 52-03 (headshots) — separate atomic steps

### Data sourcing
- mainelegislature.org is the sole data source for all 186 legislators
- External ID pattern: senators `-231001` through `-231035`; reps `-232001` through `-232151` (continues established ME `-23XXXX` convention)
- Party stored in DB for internal use (consistent with all other legislators); never displayed — antipartisan design
- Target session: 132nd Maine Legislature (current incumbents — started January 2025; researcher confirmed 131st was stale)

### Gap handling
- Missing headshots: note in migration + update STATE.md with coverage count and list of missing names
- Quality threshold: if we can't get a good 600x750 crop, treat as missing rather than upload a bad image
- Vacant seats: seed office with `politician_id=NULL` (consistent with Tier 3-4 city pattern from v3.0)
- "Coverage gaps documented" means: STATE.md entry with count + names of missing legislators

### District-to-office linking
- District mapping: GEOID subquery — `WHERE geoid = '23' || lpad(district_number, 3, '0')` pattern (same as TX legislature Phase 21)
- Researcher must verify ME SLDU/SLDL TIGER GEOID format with a sample query before plan is written
- Plan structure confirmed: 52-01 senators, 52-02 reps, 52-03 headshots (no 4th verification plan needed)
- Back-fill pattern: reuse Phase 39 (MA) generator script approach for `office_id` back-fill on politicians

</decisions>

<specifics>
## Specific Ideas

- "My expectation and hope is to find them all" — user wants full coverage; gaps are acceptable but the goal is 186/186
- When headshots fall short, user is willing to help source missing ones (flag and ask)
- mainelegislature.org is established as the headshot source for ME legislators (noted in STATE.md from Phase 51)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 52-me-state-legislature*
*Context gathered: 2026-05-19*
