# Phase 39: MA Government DB - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed the Commonwealth of Massachusetts government row, both legislative chambers (Massachusetts Senate + Massachusetts House of Representatives), and all 200 state legislators (40 senators + 160 representatives) with correct district assignments — unblocking state-level lookups for any MA address. Headshots, elections, and Cambridge city structure are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Data source
- Source: malegislature.gov member directory (official — not Wikipedia, Open States, or scraper)
- Researcher compiles a verified seed list (names, districts, bio_url) — planner builds migrations from that list; no live scraper
- Legislators matched to districts by district name string (match against geofence_boundaries.name where state='25')
- Researcher must confirm current Cambridge-area incumbents before migration is written: Rogers/Decker/Connolly for House; current 2nd Middlesex senator for Senate (Azeem is a 2026 challenger, not yet seated)

### Office title conventions
- office_title format: `"Senator, [Full District Name]"` / `"Representative, [Full District Name]"` — role + district (e.g., "Senator, Second Middlesex District")
- Government row name: `"Commonwealth of Massachusetts"` (not "State of Massachusetts")
- Chamber name_formal: `"Massachusetts Senate"` + `"Massachusetts House of Representatives"` (no "State" prefix — official MA names)

### Contact data scope
- bio_url: seed for all 200 legislators — URL pattern mechanically derivable from malegislature.gov member directory
- Email addresses: seed only for Cambridge-area legislators (~5 people: senators + representatives covering Cambridge wards)
- Fallback: email_addresses=NULL is acceptable when email isn't publicly listed — bio_url satisfies 80% contact coverage target
- Defer email research for all other 195+ legislators to a later phase

### Vacancy handling
- Use TX pattern: `is_vacant=true`, `politician_id=NULL` for any vacant seats — office row must still exist for district-linked geofence lookup to work
- Researcher investigates current MA vacancies; seeds confirmed 2026 special election winners as incumbents if election is complete
- Seats with pending special elections → `is_vacant=true` (do not guess winners)
- 2nd Middlesex Senate district: researcher confirms current incumbent's name (Azeem is a September 2026 challenger — seat is occupied by a sitting senator)

### Claude's Discretion
- external_id numbering range for MA politicians (follow TX pattern: -100xxx; researcher may suggest a range)
- Exact migration file naming and count (3 plans in ROADMAP.md: 39-01 government row + chambers; 39-02 senators; 39-03 representatives)
- Whether district name includes "District" suffix in office_title (e.g., "Second Middlesex District" vs "Second Middlesex") — match official malegislature.gov display

</decisions>

<specifics>
## Specific Ideas

- Cambridge ground truth from Phase 38 (use as primary verification targets): Porter Sq/Harvard Sq → 25th Middlesex House (geo_id='25083'); Kendall/Inman → 26th Middlesex House (geo_id='25084'); Porter Sq → Second Middlesex Senate (geo_id='25D27'); Harvard Sq → Suffolk and Middlesex Senate (geo_id='25D28'); Kendall/Inman → Middlesex and Suffolk Senate (geo_id='25D26')
- Roadmap success criteria name the expected Cambridge representatives: Rogers, Decker, or Connolly for central Cambridge House addresses — researcher must confirm which maps to which district
- TX analogue: migration 109 (30 TX senators) + migration 110 (150 TX House reps) — MA will follow same pattern split across 39-02 and 39-03

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 39-ma-government-db*
*Context gathered: 2026-05-16*
