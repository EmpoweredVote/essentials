# Phase 86: Multnomah County School Districts - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Load G5420 geofences for the 6 Multnomah County school districts (Portland Public Schools, Parkrose, Reynolds, Centennial, David Douglas, Riverdale), then seed school board government bodies, board member officials, and headshots so a resident sees their school board alongside city council and county commissioners.

No election race rows, no discovery pipeline, no compass stances — officials only (OR-SCHOOL-01 through OR-SCHOOL-04).

</domain>

<decisions>
## Implementation Decisions

### Plan Structure
- **D-01:** 2 plans.
  - Plan 1: New OR UNSD loader script + G5420 geofences for all 6 districts + government bodies (chambers, districts) + board member officials + smoke test. All in one migration (migration 253).
  - Plan 2: Headshots audit-only migration (migration 254). Same pattern as migrations 245, 247 — SQL file documents source URL or 'No photo found' per official.

### G5420 Geofence Loading
- **D-02:** Write a new dedicated loader script `load-or-school-boundaries.ts` (parallel to `load-lausd-board-boundaries.ts`). Downloads the Oregon TIGER UNSD shapefile from census.gov, filters to the 6 Multnomah County school districts by GEOID/NAME, and inserts geofence_boundaries rows with `mtfcc='G5420'`, `state='41'` (OR FIPS), `source='tiger_unsd_or_2024'`.
- **D-03:** Do NOT extend `load-state-tiger-boundaries.ts` — that loader is for state political boundaries (G4110, SLDU, SLDL, CD, G4020) and should not be modified for school districts.
- **D-04:** Researcher must confirm the correct TIGER UNSD filename for Oregon (pattern: `tl_2024_41_unsd.zip` or similar — verify from census.gov TIGER2024/UNSD/ directory before coding).

### Riverdale School District
- **D-05:** Include Riverdale only if TIGER UNSD has a G5420 row for it. Researcher checks the OR UNSD shapefile for a Riverdale entry with Multnomah County overlap. If absent, document as a gap in the SUMMARY and proceed with the other 5 districts.
- **D-06:** Do NOT construct a manual polygon for Riverdale if TIGER lacks it — TIGER is authoritative; manual polygons create maintenance debt.

### Government Body Seeding
- **D-07:** Each school district gets: one `essentials.governments` row (name='[District Name]', state='OR', geo_id=TIGER GEOID or custom), one chamber (e.g., 'Portland Public Schools Board of Education'), one `essentials.districts` row with `district_type='SCHOOL'` linked to the G5420 geofence geo_id, and board member offices linked to that district row.
- **D-08:** `district_type='SCHOOL'` is mandatory — matches essentialsService.ts routing. Do NOT use 'SCHOOL_DISTRICT' (incorrect value, confirmed from LAUSD Phase 62).
- **D-09:** Researcher determines current board member names, seat counts, and terms from each district's official website. PPS has a 7-member board; other districts likely 5. Confirm per district.
- **D-10:** Office titles follow LAUSD pattern: 'Board Member' or 'Board Member (Position N)' if numbered positions exist. Researcher verifies naming convention per district.
- **D-11:** `party = NULL` for all officials (antipartisan design).
- **D-12:** `is_appointed_position = false` — board members are elected, not appointed.
- **D-13:** External_id range for Phase 86 officials: researcher assigns starting from -860001 (block clear check required before migration).

### Elections (Out of Scope)
- **D-14:** No 2026 school board race rows in this phase. Elections data is a separate future phase. OR-SCHOOL-01 through OR-SCHOOL-04 cover only geofences, officials, and headshots.

### Headshots
- **D-15:** Check each district's official website for board member photos. Official website only — no LinkedIn, local news, or social media.
- **D-16:** All images processed to 600×750 JPEG, Lanczos q90, 4:5 crop first. `type='default'` in politician_images.
- **D-17:** Migration 254 is audit-only (same pattern as 245, 247) — SQL file only, no apply script. Documents source URL or 'No photo found on official district website.' per official.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### LAUSD Pattern (primary analog for G5420 + school board seeding)
- `C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts` — Canonical G5420 loader script. `load-or-school-boundaries.ts` follows this structure exactly.
- `C:/EV-Accounts/backend/migrations/198_lausd_board_seed.sql` (or nearest LAUSD seed migration) — Canonical school board government body + officials seed pattern. Migration 253 follows this.
- `.planning/phases/83-multnomah-county-government-routing/83-PATTERNS.md` — SQL patterns for government/chamber/district/politician/office seeding (used in Phase 83 and 84 Multnomah migrations). Follow these patterns.

### Multnomah Phase Analogs
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — Government seeding pattern for Multnomah County. Migration 253 follows the same structure for school districts.
- `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` — Multi-government-body migration pattern (5 cities in one migration). Migration 253 seeds 6 school districts the same way.
- `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts` — Smoke test pattern. Plan 1 smoke test follows this structure.

### Headshot Pattern
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` — Canonical audit-only headshot migration. Migration 254 follows this pattern exactly.
- `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` — Multi-city headshot audit migration. Closest analog for a 6-district headshot migration.

### TIGER UNSD Reference
- TIGER2024 UNSD directory: `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/` — Researcher must browse this to find the correct OR UNSD filename before coding the loader.
- `.planning/STATE.md` → "v10.0 Starting Context" section — confirms `district_type='SCHOOL'`, `G5420 mtfcc`, and LAUSD loader pattern.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `load-lausd-board-boundaries.ts` — Copy as base for `load-or-school-boundaries.ts`. Change state FIPS (06→41), TIGER URL, GEOID filter.
- `smoke-multnomah-county.ts` — Copy as base for Phase 86 smoke test. Add school board assertions.

### Established Patterns
- `district_type='SCHOOL'` in `essentials.districts` — essentialsService.ts routing uses this to surface school board members in address lookups.
- `politician_images.type='default'` — UI filters with `.find(img => img.type === 'default')`; wrong type = silent invisibility.
- `WHERE NOT EXISTS` guard on `essentials.governments` (no unique constraint on geo_id — ON CONFLICT would fail).
- Audit-only headshot migrations: SQL only, no apply script, `WHERE NOT EXISTS` on politician_images.

### Integration Points
- `essentialsService.ts` — The address lookup service that returns school board members. `district_type='SCHOOL'` is the key that routes correctly; no code changes needed.
- `geofence_boundaries` table — G5420 rows go here; loader script handles this directly.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond the LAUSD pattern — use the established school board seeding approach.

</specifics>

<deferred>
## Deferred Ideas

- **School board elections (2026 race rows)** — Out of scope for this phase; add a future phase if needed. Discovery pipeline for school board candidates would be a separate phase.

</deferred>

---

*Phase: 86-multnomah-county-school-districts*
*Context gathered: 2026-06-01*
