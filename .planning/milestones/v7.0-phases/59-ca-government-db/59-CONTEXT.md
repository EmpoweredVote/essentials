# Phase 59: CA Government DB Foundation - Context

**Gathered:** 2026-05-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the State of California government row, all 8 constitutional officer chambers with correct `is_appointed_position` flags, seed current officeholders as politicians with linked offices, and upload headshots at 600×750. Geofences (Phase 57) and downstream federal/legislative seeding (Phases 60-61) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Constitutional Officer Chambers
- All 8 chambers are popularly elected — `is_appointed_position=false` for all
- Chambers: Governor, Lieutenant Governor, Attorney General, Secretary of State, Controller, Treasurer, Insurance Commissioner, Superintendent of Public Instruction
- No constitutional research step needed — elected status confirmed; researcher can skip CA constitution verification
- Board of Equalization (4 elected members by district) is **deferred** — BOE district geo_ids are not in TIGER boundaries and require a separate shapefile source; fold into a future CA backlog phase

### Officials to Seed (59-02)
- Seed ALL 8 currently-serving constitutional officers as politicians with linked office rows
- Do not limit to Governor only; all 8 get politician + office rows in this phase

### Headshot Sourcing (59-03)
- Priority order: official CA government sites first (governor.ca.gov, ag.ca.gov, etc.), then Wikipedia Commons as fallback
- **IMPORTANT: check Supabase Storage for existing headshots before sourcing** — user has done prior CA work and headshots may already exist at 600×750; if present, use as-is and skip upload for those officials
- If existing headshots are found: use them, skip re-upload
- All 8 headshots should be present (or sourced) by end of 59-03

### Party Data
- Store `party='Democrat'` on politician rows for all current CA constitutional officers
- Consistent with antipartisan rule: store in DB, never display on profiles
- Future CA politicians should also have party stored when known

### External ID Convention
- CA executives: `-060001xx` (CA FIPS=06, exec tier=0001, person suffix 01–99)
  - Example: -06000101 = first CA executive (Governor Newsom)
- Federal tier (Phases 60+): senators=-060101xx, US House reps=-060201xx
- State legislature (Phase 61): State Senators=-0606xxxx, Assembly Members=-0607xxxx
- This mirrors the Maine pattern (-23xxxxx) with CA FIPS=06 prefix
- Document the occupied ranges in phase summaries as each migration is applied

### Claude's Discretion
- CA government row geo_id format (follow established FIPS-based pattern from prior states)
- Migration numbering (next is 185 per STATE.md)
- Exact slug format for CA chambers (follow Maine pattern: california-governor, california-attorney-general, etc.)

</decisions>

<specifics>
## Specific Ideas

- User has done prior California work — headshots for constitutional officers may already be in Supabase Storage; thorough pre-check is required before creating any new upload tasks
- Maine gov UUID was da88de8b-9afa-4d87-86d5-7eb83c3e9792; CA government UUID will be a new UUID from the migration

</specifics>

<deferred>
## Deferred Ideas

- Board of Equalization (4 elected members, 4 geographic districts) — needs separate shapefile source for district boundaries; defer to CA backlog phase (possibly fold into Phase 62 or create a new phase)

</deferred>

---

*Phase: 59-ca-government-db*
*Context gathered: 2026-05-21*
