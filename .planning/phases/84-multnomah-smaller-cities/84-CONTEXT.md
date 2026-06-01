# Phase 84: Multnomah Smaller Cities - Context

**Gathered:** 2026-05-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed government bodies and elected officials for all 5 incorporated Multnomah County cities outside Portland (Gresham, Troutdale, Fairview, Wood Village, Maywood Park) so that residents at any address within those city boundaries see their LOCAL representatives alongside county and state officials. Includes headshot upload where a public online source exists on each city's official website.

No elections data, no compass stances, no school districts — those are Phases 85–86.

</domain>

<decisions>
## Implementation Decisions

### Plan Structure
- **D-01:** 2 plans: Plan 1 = all 5 city governments (migration 246 + Gresham ward geofences + smoke test), Plan 2 = headshots (migration 247, audit-only).
- **D-02:** Plan 1 uses a single migration (migration 246) covering all 5 cities in one BEGIN/COMMIT transaction. No splitting by city.
- **D-03:** One smoke test script (`smoke-multnomah-cities.ts`) with one test address per city (5 total). Verifies G4110 boundary match + LOCAL/LOCAL_EXEC officials returned. Section-split check for all 5 city geo_ids.

### Mayor and Council Structure
- **D-04:** Mayor → `district_type=LOCAL_EXEC`, same geo_id as city's G4110 geo_id, `mtfcc=null`, `label='[CityName] (Citywide)'`. Matches Portland Mayor pattern (Keith Wilson: geo_id='4159000', district_type=LOCAL_EXEC, mtfcc=null).
- **D-05:** Gresham council (6 ward-elected seats) → Ward-based LOCAL districts. Researcher must find Gresham ward boundary GIS data (city GIS portal or Oregon GIS portal) and load 6 custom polygon geofences with new geo_ids (e.g., 'gresham-or-ward-1' through 'gresham-or-ward-6'). Next available MTFCC is X0013; assign X0013–X0018 for Gresham wards 1–6.
- **D-06:** Troutdale, Fairview, Wood Village, Maywood Park councils → At-large: one `district_type=LOCAL` district per city using the city's G4110 geo_id, `mtfcc=null`. All council members for a given city link to the same district row.
- **D-07:** All 5 cities get a Mayor (LOCAL_EXEC) + City Council chamber (LOCAL or ward-based). Researcher must verify exact council seat counts per city from official sources.

### Headshot Sourcing
- **D-08:** Official city website only — check each city's official site for headshots. If no photo found there, mark as unavailable. No LinkedIn, local news, social media, or other sources.
- **D-09:** Every official documented in migration 247 (audit-only): either a source URL (Supabase Storage path) or a comment 'No photo found on official city website.' Same pattern as `245_multnomah_county_headshots.sql`.
- **D-10:** Headshots processed to 600×750 JPEG, Lanczos q90, crop 4:5 first, `type='default'` in politician_images. No deviation from standard pattern.

### Casing and Idempotency (carried from Phase 83)
- **D-11:** `governments.state = 'OR'` (uppercase), `districts.state = 'or'` (lowercase), `offices.representing_state = 'OR'` (uppercase).
- **D-12:** `party = NULL` for all officials (antipartisan design).
- **D-13:** Idempotency: `ON CONFLICT (external_id) DO NOTHING` for politicians; `WHERE NOT EXISTS` guards for governments, chambers, districts.
- **D-14:** `office_id` back-fill UPDATE at end of migration (before COMMIT).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 83 Patterns (primary analog)
- `.planning/phases/83-multnomah-county-government-routing/83-PATTERNS.md` — Complete SQL and TypeScript patterns for government/chamber/district/politician/office seeding. All patterns in migration 246 must follow these templates. MUST READ.
- `.planning/phases/83-multnomah-county-government-routing/83-01-SUMMARY.md` — Migration 244 structure and production DB IDs for Multnomah County (parent government row, Board of Commissioners chamber, COUNTY district). Phase 84 governments must link correctly alongside this.
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — Canonical migration for reference; migration 246 follows the same structure.

### Phase 83 Routing Verification
- `.planning/phases/83-multnomah-county-government-routing/83-RESEARCH.md` — Routing architecture explanation: how G4110 → LOCAL district query works; why districts.state must be lowercase 'or'. Critical for smoke test design.
- `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts` — Primary smoke test analog for `smoke-multnomah-cities.ts`. Follow its structure: AddressTest interface, queryBoundaries, queryLocalOfficials, section-split check, allPassed/errors pattern.

### Prior OR City Analogues (headshot pattern)
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` — Closest headshot migration analog (audit-only, covers small set of officials). Follow its header, per-official commented structure, and WHERE NOT EXISTS guard.
- `C:/EV-Accounts/backend/migrations/225_or_headshots.sql` — OR headshot migration for state officials; same audit-only pattern.

### Portland Ward Analog (for Gresham wards)
- `C:/EV-Accounts/backend/migrations/230_portland_government_structure.sql` — Portland's government + chamber + district setup. Reference for how Portland's ward-based districts are structured (custom geo_ids, mtfcc=null for LOCAL districts that back custom polygon geofences).
- `C:/EV-Accounts/backend/migrations/231_portland_officials.sql` — WITH ins_p CTE pattern canonical source. All 5 city politician + office blocks must use this pattern.

### Confirmed DB State
- Geo IDs confirmed in production geofence_boundaries (all G4110, state='41'):
  - Gresham: '4131250'
  - Troutdale: '4174850'
  - Fairview: '4124250'
  - Wood Village: '4183950'
  - Maywood Park: '4146730'
- Next available MTFCC for custom geofences: X0013 (X0001–X0012 are all claimed)
- Multnomah County government ID: ad7f068e-7628-4e9e-b032-5d688b804239
- Board of Commissioners chamber ID: 57ac3d4d-7769-4a7a-af84-e2d22a6a109c
- No existing government rows or district rows for any of the 5 cities (confirmed clean slate)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts` — Near-copy template for `smoke-multnomah-cities.ts`. Replace county-specific queries with LOCAL/LOCAL_EXEC district queries per G4110 geo_id.
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — Structural template for migration 246. Replace geo_id, names, external_ids, titles.

### Established Patterns
- WITH ins_p CTE for atomic politician + office insert (from 231_portland_officials.sql)
- WHERE NOT EXISTS idempotency on governments + chambers + districts (no unique constraints on these tables)
- ON CONFLICT (external_id) DO NOTHING on politicians (unique constraint exists)
- office_id back-fill UPDATE at end of migration, before COMMIT
- districts.state='or' (lowercase) matches routing query; governments.state='OR' (uppercase)
- LOCAL_EXEC district for Mayor: same geo_id as city's G4110, mtfcc=null — matches Portland Mayor (Keith Wilson: geo_id='4159000', district_type='LOCAL_EXEC', mtfcc=null)
- Headshot migration is AUDIT-ONLY: not applied via Supabase ledger; actual writes happen live via upload script

### Integration Points
- `essentials.governments` ← new city government rows (5 rows, type='City', state='OR')
- `essentials.chambers` ← new City Council chamber per city (5 chambers)
- `essentials.districts` ← LOCAL_EXEC (Mayor, 5 rows) + LOCAL (council, 4 at-large + 6 Gresham ward rows)
- `essentials.geofence_boundaries` ← new polygon rows for Gresham's 6 wards (X0013–X0018 MTFCC)
- `essentials.politicians` ← new official rows per city
- `essentials.offices` ← one office per official, linked to their district
- `essentials.politician_images` ← headshot rows where photo found on official city site

</code_context>

<specifics>
## Specific Ideas

- Gresham ward boundary data: researcher should check greshamoregon.gov GIS resources, Oregon Spatial Data Library, or Oregon Secretary of State precinct maps as sources. Ward boundaries for a ~115k-resident city are likely available as GeoJSON or Shapefile.
- Researcher must verify exact council seat counts and current incumbents for all 5 cities from official city websites before migration is written.
- External ID scheme for Phase 84 officials: researcher should propose a scheme consistent with existing OR patterns (state legislators use -4110xxx / -4120xxx; county uses -410001; Portland uses -6900xx). Suggested: derive from city geo_id — e.g., Gresham -413125x, Troutdale -417485x, etc. Planner to confirm and establish.
- Smoke test test addresses: researcher must find real street addresses (or known coordinates) for each of the 5 cities that are clearly within each G4110 boundary and NOT in Portland. Verify each coordinate returns the expected G4110 geo_id before finalizing.

</specifics>

<deferred>
## Deferred Ideas

- **Per-ward sub-routing for Troutdale/Fairview/Wood Village/Maywood Park** — These are at-large for Phase 84. If they ever adopt ward systems, it would need a future phase.
- **Compass stances for smaller city officials** — Out of scope for Phase 84; may be covered in a future phase (see OR-CITIES-01 in backlog).
- **Maywood Park contact data** — Maywood Park is very small (~700 residents) and may have limited online presence. Contact data gaps are expected and don't block Phase 84.

</deferred>

---

*Phase: 84-Multnomah Smaller Cities*
*Context gathered: 2026-05-31*
