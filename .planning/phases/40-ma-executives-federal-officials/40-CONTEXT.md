# Phase 40: MA Executives + Federal Officials - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed MA statewide executives (6 offices) and federal officials representing MA (2 US Senators + 9 US House reps) — all with headshots — completing the full state/federal layer for any Massachusetts address lookup. Schema also gets a `role_canonical` column on offices for cross-state role equivalency queries.

</domain>

<decisions>
## Implementation Decisions

### MA Executive Title Conventions
- Display titles use **official MA titles**: "Secretary of the Commonwealth" (not "Secretary of State"), "Treasurer and Receiver-General" (not "State Treasurer")
- Governor, Lieutenant Governor, Attorney General, and Auditor use their common names — no alias needed (they match standard naming)
- A new `role_canonical` TEXT column is added to the offices table for cross-state role queries
- `role_canonical` is added only where MA's official title differs from the common name:
  - Secretary of the Commonwealth → `role_canonical='secretary_of_state'`
  - Treasurer and Receiver-General → `role_canonical='treasurer'`
  - All other MA executives: `role_canonical` = NULL (not needed)

### Executive Chamber Structure
- One chamber per executive office — matching the TX pattern from Phase 20
- Chamber name_formal format: **"Massachusetts [Role]"** (e.g., "Massachusetts Governor", "Massachusetts Attorney General", "Massachusetts Secretary of the Commonwealth")
- 6 new chambers total

### Federal Official Handling
- New **-2xxxxx external_id block** for all MA officials (clean separation from TX's -1xxxxx block):
  - MA executives: `-200001` to `-200006`
  - MA US Senators: `-200101` (Warren), `-200102` (Markey)
  - MA US House reps: `-200201` to `-200209` (MA-01 through MA-09)
- US Senators use `district_type = NATIONAL_UPPER` (standard pattern — any MA address returns both)
- MA House reps link to existing MA congressional geofences (geo_ids '2501'–'2509' already loaded in Phase 38)
- All inserts use `WHERE NOT EXISTS` guards — idempotent on re-run

### Headshot Sourcing
- **Federal officials (11: Warren, Markey, 9 House reps):** Congressional press gallery first → Wikipedia as fallback
- **MA state executives (6):** Official MA.gov executive pages first → Wikipedia as fallback
- Quality rule: if any source photo has superimposed text, campaign banners, or watermarks over the face — skip it and try the next source; flag as a gap if all sources fail
- All headshots resized to 600×750 (4:5, Lanczos, q90) before upload — no exceptions

### Claude's Discretion
- Exact office title for Auditor (check MA official site for "State Auditor" vs "Auditor of the Commonwealth")
- Script structure for headshot import (inline PIL or reuse existing pattern)
- Migration numbering (next is 153 based on Phase 39-03 applying 152)

</decisions>

<specifics>
## Specific Ideas

- The `role_canonical` column enables future cross-state queries like "show all secretary_of_state offices" — this should be accounted for in the migration that adds the column (default NULL, nullable, no FK constraint)
- Headshot source priority differs by tier: federal officials have highly standardized congressional press gallery photos; state executives are best served by official MA.gov which has current professional portraits

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 40-ma-executives-federal-officials*
*Context gathered: 2026-05-16*
