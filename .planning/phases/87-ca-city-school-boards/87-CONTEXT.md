# Phase 87: CA City School Boards - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed school board government bodies, chambers, districts, officials, and headshots for the 6 covered CA cities (San Francisco, San Diego, Sacramento, San Jose, Fremont, Berkeley) so a resident at any covered address sees their school board alongside city council and state officials.

No election race rows, no discovery pipeline, no compass stances — officials only (CA-SCHOOL-01 through CA-SCHOOL-06).

**Critical pre-confirmed fact:** All 6 G5420 geofences already exist in the DB (`census_tiger_2024` — 353 total CA rows). No loader script is needed. Plan 1 is pure SQL.

Confirmed GEOIDs (use these directly in the seed migration):
- San Francisco Unified SD: `0634410`
- San Diego City Unified SD: `0634320` (TIGER name; official name "San Diego Unified" — use official)
- Sacramento City Unified SD: `0633840`
- San Jose Unified SD: `0634590`
- Fremont Unified SD: `0614400`
- Berkeley Unified SD: `0604740`

</domain>

<decisions>
## Implementation Decisions

### Plan Structure
- **D-01:** 2 plans.
  - Plan 1 (migration 257): All 6 government bodies + chambers + districts (district_type='SCHOOL') + board member officials + offices in a single SQL migration, plus smoke test.
  - Plan 2 (migration 258): Headshots audit-only (same pattern as migrations 245, 247, 255 — SQL only, no apply script).

### Geofence Loading
- **D-02:** No loader script needed — all 6 G5420 geofences already exist in the DB with geo_ids confirmed above. Plan 1 seed SQL references these existing geo_ids directly.
- **D-03:** San Diego's TIGER geo_id is `0634320` ("San Diego City Unified School District"). The government body name should use the district's official name from their website (commonly "San Diego Unified School District" / SDUSD). Researcher confirms official name.

### Government Body Seeding
- **D-04:** Each district gets: one `essentials.governments` row, one chamber (e.g., 'San Francisco Unified School District Board of Education'), one `essentials.districts` row with `district_type='SCHOOL'` linked to its G5420 geo_id, and board member offices linked to that district row.
- **D-05:** `district_type='SCHOOL'` is mandatory — matches essentialsService.ts routing. Do NOT use 'SCHOOL_DISTRICT'.
- **D-06:** Researcher determines current board member names, seat counts, and terms from each district's official website. SF Unified has 7 members; other districts vary (researcher verifies).
- **D-07:** Office titles follow OR Phase 86 pattern: 'Board Member' or 'Board Member (District N)' if numbered positions exist. Researcher verifies naming convention per district.
- **D-08:** `party = NULL` for all officials (antipartisan design).
- **D-09:** `is_appointed = false`, `is_appointed_position = false` — board members are elected.
- **D-10:** External_id range for Phase 87 officials: starts at -870001. Researcher confirms the block is clear before migration.
- **D-11:** governments.state = 'CA' (uppercase). districts.state = 'ca' (lowercase — routing convention). offices.representing_state = 'CA' (uppercase).

### Multi-ISD Coverage Gap
- **D-12:** Seed only the 6 named districts per requirements (CA-SCHOOL-01 through CA-SCHOOL-06). Do NOT expand scope to secondary ISDs (East Side Union, Evergreen, Natomas, Twin Rivers, etc.).
- **D-13:** Document the coverage gap in a migration comment: "SJUSD covers the southern/central core of San Jose; residents in other SJ ISDs will not see a SCHOOL section in Phase 87." Same note for Sacramento City Unified. A future phase could add secondary ISDs.
- **D-14:** A resident at a non-SJUSD San Jose address or non-Sacramento CU address seeing no SCHOOL section is acceptable for Phase 87 — same behavior as any uncovered city.

### Headshots
- **D-15:** Check each district's official website for board member photos. Official website only — no LinkedIn, local news, or social media.
- **D-16:** All images processed to 600×750 JPEG, Lanczos q90, 4:5 crop first. `type='default'` in politician_images.
- **D-17:** Migration 258 is audit-only — SQL file only, no apply script. Documents source URL or 'No photo found on official district website.' per official.

### Elections (Out of Scope)
- **D-18:** No 2026 school board race rows in this phase. Elections data is a separate future phase.

### Post-seeding
- **D-19:** Run section split check query after migration 257 applies to verify no split-section bugs. Query: check for addresses that return two rows for the same government body (from feedback_section_split_check.md pattern).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Pattern (Phase 86 OR School Districts — direct analog)
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — Canonical school board seed SQL pattern. Migration 257 follows this structure exactly (swap state 'OR'/'41'/'or' for 'CA'/'06'/'ca', swap GEOIDs and names for the 6 CA districts).
- `C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql` — Canonical audit-only headshot migration. Migration 258 follows this pattern.
- `.planning/phases/86-multnomah-county-school-districts/86-CONTEXT.md` — Full decision set from Phase 86 (most decisions carry forward directly).

### LAUSD Pattern (alternate CA school analog)
- `C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts` — Note: LAUSD used ArcGIS GeoHub for board district sub-boundaries (7 board districts within LAUSD). Phase 87 does NOT need a loader — it uses the TIGER UNSD geo_ids directly. Skim for context only.

### Multnomah Headshot Migrations (additional audit pattern analogs)
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql`
- `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql`

### CA City Government Patterns (for consistency with existing CA seeding)
- `C:/EV-Accounts/backend/migrations/199_sf_officials.sql` — SF government/chamber/officials seeding pattern. Migration 257 must be consistent with existing SF government structure.
- `C:/EV-Accounts/backend/migrations/213_berkeley_government_structure.sql` — Berkeley government structure (Phase 68). Researcher verifies no conflicting government body names.
- `C:/EV-Accounts/backend/migrations/217_sj_government_structure.sql` — San Jose government structure (Phase reference).
- `C:/EV-Accounts/backend/migrations/219_sacramento_government_structure.sql` — Sacramento government structure (Phase reference).

### GEOIDs (pre-verified, confirmed from production DB)
- All 6 G5420 geofences confirmed present via SQL on 2026-06-01. GEOIDs listed in `<domain>` section above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `migrations/254_or_school_districts.sql` — Copy as structural template for migration 257. Change: state values ('OR'/'or'/'41' → 'CA'/'ca'/'06'), geo_ids (OR GEOIDs → CA GEOIDs), government/chamber/official names, external_id block (-860xxx → -870xxx), migration idempotency guard (government names).
- `migrations/255_or_school_headshots.sql` — Copy as template for migration 258.

### Established Patterns
- `district_type='SCHOOL'` in `essentials.districts` — essentialsService.ts routing uses this to surface school board members.
- `politician_images.type='default'` — UI filters with `.find(img => img.type === 'default')`; wrong type = silent invisibility.
- `WHERE NOT EXISTS` guard on `essentials.governments` — no unique constraint on geo_id; ON CONFLICT would fail.
- Audit-only headshot migrations: SQL only, no apply script, `WHERE NOT EXISTS` on politician_images.
- `districts.state` must be lowercase 'ca' (routing query convention), while `governments.state` and `offices.representing_state` are uppercase 'CA'.
- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.

### Integration Points
- `essentialsService.ts` — Address lookup service that returns school board members. `district_type='SCHOOL'` is the routing key; no code changes needed.
- `geofence_boundaries` table — G5420 rows already present; no inserts required.
- Existing SF/SD/Sacramento/SJ/Fremont/Berkeley government structures — migration 257 must not conflict with already-seeded city governments.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond following the Phase 86 OR pattern and using the pre-confirmed CA GEOIDs.

</specifics>

<deferred>
## Deferred Ideas

- **Secondary ISDs for SJ and Sacramento** — East Side Union High School District, Evergreen, Natomas USD, Twin Rivers USD, etc. Users at non-SJUSD/non-SacCU addresses won't see a SCHOOL section. Future phase if needed.
- **School board elections (2026 race rows)** — Out of scope for this phase; add a future phase if needed.

</deferred>

---

*Phase: 87-ca-city-school-boards*
*Context gathered: 2026-06-01*
