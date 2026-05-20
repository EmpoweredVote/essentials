# Phase 55: ME 2026 Elections + Discovery Pipeline - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Maine 2026 Primary (June 9) and General (November 3) election rows with known statewide candidates (Governor, US Senate, Congressional), scaffold all 186 legislative race rows, configure discovery_jurisdictions for ongoing automated candidate discovery, and create a Portland 2027 municipal election placeholder. Legislature-level candidate seeding is left entirely to the discovery pipeline.

</domain>

<decisions>
## Implementation Decisions

### State Legislative Races Scope
- Seed all 186 races (35 Senate + 151 House) as empty scaffolding for both Primary AND General — 372 total race rows
- No candidates manually seeded into legislative races; discovery cron handles all candidate linking
- No incumbent pre-linking from Phase 52 data — let discovery do it cleanly
- `election_method='plurality'` for all 186 state legislative races
- `election_method='rcv'` for Governor and federal offices (US Senate, ME-01, ME-02)

### Candidate Sourcing Standard
- Filed-with-Maine-SOS only — no "announced but not filed" candidates
- Citation format: Maine SOS candidate list page URL for all entries (one shared source per race, not individual campaign URLs)
- Governor 2026 Primary: **one race row** with all 16 candidates (6D + 10R combined, no primary_party split)
- US Senate and Congressional primaries: same model — one row per office per election cycle, not split by party primary
- This applies to Primary races; General races are separate rows

### Discovery Jurisdiction Granularity
- Two active `discovery_jurisdictions` rows for Maine 2026:
  - One for ME Primary (June 9 election), `geoid='23'`, `cron_active=true`
  - One for ME General (Nov 3 election), `geoid='23'`, `cron_active=true`
- Both active immediately from migration day — June 9 primary is imminent
- `source_url` = Maine SOS candidate list page for both rows
- Separate inactive row for Portland 2027 (see below)
- **Research flag:** Note for researcher that the discovery sweep will cover ~375 races (all legislative + statewide) — verify discovery agent handles this scale without burning API quota before finalizing the plan

### Portland 2027 Placeholder
- One `discovery_jurisdictions` row: `geoid='2360545'` (Portland city geoid), `cron_active=false`
- One bare `essentials.elections` row: `election_date='2027-11-02'` (first Tuesday of November 2027)
- No races created yet — wait until closer to 2027 when seat configuration is confirmed
- `source_url` on discovery row = Portland city clerk/elections page (set now while context is loaded)

### Claude's Discretion
- Exact migration structure for 372 legislative race rows (batching strategy, generator script vs. manual)
- How to link the 372 race rows to the correct election_id and office_id (query-by-district pattern vs. hardcoded UUIDs)
- Handling of ME House D29 vacancy in race scaffolding
- Specific Portland elections clerk URL (researcher to confirm)
- Exact Maine SOS candidate list URL (researcher to confirm)

</decisions>

<specifics>
## Specific Ideas

- Governor 2026 is an open seat (Mills term-limited) — 6D and 10R candidates already documented in STATE.md
- Graham Platner is a named challenger for Susan Collins' US Senate seat — verify he's SOS-filed
- Susan Collins is up for re-election 2026 (Angus King is NOT — King's seat is 2030)
- ME House D29 is vacant (Kathy Javner deceased) — create the race row but expect no incumbent candidate

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 55-me-2026-elections-discovery*
*Context gathered: 2026-05-19*
