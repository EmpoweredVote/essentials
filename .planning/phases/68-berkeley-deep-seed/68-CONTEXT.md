# Phase 68: Berkeley Deep Seed - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Berkeley's government structure, all popularly-elected incumbents, and headshots so a Berkeley address returns a complete local officials list. Council district geofences are included. RCV election_method is noted in migration comments for Phase 69 to set on race rows — not stored on office rows.

</domain>

<decisions>
## Implementation Decisions

### Council Structure
- Title format: `Council Member (District N)` — matches Fremont pattern
- External ID scheme: Mayor=-680001, Council D1–D8=-680010 through -680017 (pre-flight check that range is clear before committing)
- Whether Berkeley has at-large seats beyond 8 districts: **research it** from Berkeley city charter (cityofberkeley.info)
- Whether Berkeley has a formal City Council President role: **research it** — if exists, no separate office row (same as SF Mandelman pattern: role only, not a row)

### Citywide Elected Offices
- Include **all popularly-elected citywide offices** — not just Mayor + Council
- City Auditor (Ann-Marie Hogan) is elected → **seed her** with office row
- Researcher must check Berkeley charter for all elected vs. appointed citywide offices
- Appointed citywide offices (e.g., City Manager, City Attorney if appointed): **seed them** with `is_appointed_position=true` — matches SF Controller/City Admin pattern
- Do not create race rows for appointed positions (no ballot entry)

### Geofence Source
- MTFCC: **X0009** (next in sequence: X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont, X0009=Berkeley)
- geo_id format: **research official district naming** from Berkeley's GIS portal (cityofberkeley.info) — likely `berkeley-council-district-{1-8}` but confirm
- ArcGIS field name for district number extraction: **research it** — Fremont used `DISTRICT` integer field but Berkeley's field name may differ
- Always add `outSR=4326` to ArcGIS requests (CA State Plane default)
- Loader script: `load-berkeley-council-boundaries.ts` (follow Fremont loader pattern)

### Mayor RCV Handling
- Mayor district type: **LOCAL_EXEC**, geo_id='0606000' (Berkeley city geo_id — matches Fremont pattern with '0626000')
- `election_method='rcv'` lives on `races` table — not stored on office rows; no schema change needed here
- **Add SQL comments** in the migration for every Berkeley office that uses RCV — flags them for Phase 69 elections seeding
- Researcher should confirm which Berkeley offices use RCV (Mayor + City Auditor expected; confirm others)

### Claude's Discretion
- Exact ArcGIS endpoint URL for Berkeley council district boundaries
- Whether to split geofences + government structure into separate migrations or combine (follow prior city patterns)
- Migration numbering (next is 213 per STATE.md)

</decisions>

<specifics>
## Specific Ideas

- Fremont loader (load-fremont-council-boundaries.ts) is the closest prior pattern — use it as the template for the Berkeley loader
- Berkeley city geo_id for LOCAL_EXEC district is confirmed as 0606000 (from v7.0 target city geo_ids in STATE.md)
- The `is_appointed_position=true` pattern for appointed offices is established from Fremont City Attorney (excluded entirely) and SF Controller/City Admin (included with flag) — Berkeley follows the include-with-flag approach

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 68-berkeley-deep-seed*
*Context gathered: 2026-05-22*
