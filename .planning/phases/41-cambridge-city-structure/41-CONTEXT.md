# Phase 41: Cambridge City Structure - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Cambridge's government row, chambers, offices, and incumbents into the database — correctly modeling its Council-Manager form of government (appointed Mayor via council vote, STV at-large elections, no ward seats). Land Cambridge on the Landing page as a browseable coverage area. Contact data populated for all officials.

Creating Cambridge elections (2025 results, 2027 placeholder) and headshots are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Councillor and School Committee office naming
- All 9 City Council office rows titled "City Councillor" — no seat numbers (Cambridge has no numbered seats)
- All 6 School Committee office rows titled "School Committee Member" — same pattern, no numbering
- Offices are differentiated by `politician_id` assignment, not by title
- Mayor office row titled "Mayor" (not "President of the City Council" — modern usage)

### Mayor dual-role modeling (Siddiqui)
**CORRECTED by research (2026-05-16):** Sumbul Siddiqui is the January 2026 Mayor (unanimous council vote Jan 5, 2026 — third term). McGovern is a regular City Councillor only.
- Mayor is the primary display title on Siddiqui's profile page
- Siddiqui is linked to both her Councillor office (elected) and the Mayor office (appointed) in the DB
- She appears in the City Councillor listing when users browse Cambridge officials — she still holds her elected councillor seat
- City Manager (Yi-An Huang) appears in the Cambridge browse listing with `is_appointed_position=true`

### Contact data fallback strategy
- `email_addresses = NULL` when an individual email isn't publicly listed — consistent with TX precedent
- Each official's bio page on cambridge.ma.gov goes in `urls[]` as the primary contact mechanism
- For School Committee members: use whichever source has better individual contact data (cambridge.ma.gov or cpsd.us — check both per member)
- No generic department emails (e.g., council@cambridgema.gov) — they route to staff, not the representative

### Landing page entry
- Label: "Cambridge, MA"
- New section heading: "Massachusetts" (separate from the TX coverage areas)
- Cambridge city browse entry only — MA state officials are already returned via geofence for any MA address; no separate MA state-level browse entry needed yet
- Entry uses `browseGovernmentList: ['2511000']` (per roadmap)

### Claude's Discretion
- Exact `browseGovernmentList` display card layout (icon, description text) — match existing city entry style
- Whether a secondary office link requires a schema change or can be handled via existing pattern
- Exact DB column mapping for McGovern's dual-office relationship

</decisions>

<specifics>
## Specific Ideas

- Cambridge is a Council-Manager city: the Mayor is appointed annually by the City Council from among its members (not a separate election). The "Mayor" title is ceremonial/presiding — real administrative authority rests with the City Manager.
- STV = Single Transferable Vote (ranked-choice proportional). All 9 Council seats + all 6 School Committee seats are filled this way in a single at-large election. No wards, no districts.
- "Councillor" spelling (not "Councilor") — Cambridge uses the British spelling. Use this in all DB titles and references.
- McGovern was re-elected as a City Councillor in Nov 2025, then appointed Mayor by the council. He simultaneously holds both roles.

</specifics>

<deferred>
## Deferred Ideas

- Massachusetts state-level browse entry (browse all MA legislators without entering an address) — noted for future, not this phase
- Additional MA cities beyond Cambridge — future expansion

</deferred>

---

*Phase: 41-cambridge-city-structure*
*Context gathered: 2026-05-16*
