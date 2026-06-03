# Phase 88: TX Collin County School Boards - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Write a new `load-tx-school-boundaries.ts` loader to insert G5420 geofences for 5 Collin County ISDs (Plano, McKinney, Allen, Frisco, Richardson), then seed school board government bodies, chambers, districts, officials, and offices so a TX resident sees their school board alongside city council and state officials.

No election race rows, no discovery pipeline, no compass stances — officials only (TX-SCHOOL-01 through TX-SCHOOL-05).

**Critical pre-confirmed fact:** No G5420 rows exist for TX (state='48', mtfcc='G5420' returns 0 rows in production). A loader script IS required. `load-state-tiger-boundaries.ts` does NOT include 'unsd' in TX's layer set — do not modify it.

**External_id block:** -880001 onwards is clear (confirmed). Phase 87 used -870001..-870034.

**Next migration numbers:** 261 (seed) + 262 (headshots audit).

</domain>

<decisions>
## Implementation Decisions

### Geofence Loader
- **D-01:** Write a new dedicated `load-tx-school-boundaries.ts` script (parallel to `load-or-school-boundaries.ts`). Do NOT extend `load-state-tiger-boundaries.ts` — that shared script supports TX but does not include 'unsd' in its TX layer set, and modifying it for a 5-ISD seed would be higher risk.
- **D-02:** Loader downloads `tl_2024_48_unsd.zip` from census.gov TIGER2024/UNSD/, filters to the 5 target GEOIDs, inserts into `essentials.geofence_boundaries` with `mtfcc='G5420'`, `state='48'`, `source='tiger_unsd_tx_2024'`. Safe to re-run via `ON CONFLICT (geo_id, mtfcc) DO NOTHING`.
- **D-03:** Researcher must confirm the 5 GEOIDs from TIGERweb or census.gov TIGER2024 before coding the loader. Pattern from OR: `4110040` → Portland Public Schools. TX GEOIDs follow a different format — researcher verifies.

### Plan Structure
- **D-04:** 2 plans.
  - Plan 1: New `load-tx-school-boundaries.ts` loader (run first) + migration 261: 5 government bodies + chambers + districts (`district_type='SCHOOL'`) + officials + offices + smoke test. All seed SQL in one migration.
  - Plan 2: Migration 262: Headshots audit-only (SQL only, no apply script — same pattern as migrations 255, 258).

### Government Body Seeding
- **D-05:** Each ISD gets: one `essentials.governments` row (`state='TX'`), one chamber (e.g., 'Plano Independent School District Board of Trustees'), one `essentials.districts` row with `district_type='SCHOOL'` linked to the G5420 geo_id, and board member offices linked to that district row.
- **D-06:** `district_type='SCHOOL'` is mandatory — matches essentialsService.ts routing. Do NOT use 'SCHOOL_DISTRICT'.
- **D-07:** `districts.state` = `'tx'` (lowercase — routing query convention). `governments.state` = `'TX'` (uppercase). `offices.representing_state` = `'TX'` (uppercase).
- **D-08:** Researcher determines current board member names, seat counts, and terms from each ISD's official website. TX ISDs typically have 7-member boards with numbered place positions. Researcher verifies per ISD.
- **D-09:** Office titles: TX school boards use 'Board Member, Place [N]' for numbered positions or 'Board Member' for at-large. Researcher confirms per ISD — do not guess.
- **D-10:** `party = NULL` for all officials (antipartisan design).
- **D-11:** `is_appointed = false`, `is_appointed_position = false` — board members are elected.
- **D-12:** External_id range: starts at -880001. Researcher confirms the block is clear before migration. Estimate: 5 ISDs × ~7 members = ~35 politicians, so block -880001..-880035 approximately.

### Cross-County ISD Coverage
- **D-13:** Use the full TIGER G5420 polygon for Frisco ISD (Collin+Denton) and Richardson ISD (Collin+Dallas). Geographically accurate — if you live in Frisco ISD territory, you should see Frisco ISD board members regardless of county. No clipping needed.
- **D-14:** Richardson ISD extends into Dallas County (parts of Richardson, Garland, and Dallas cities). Residents in those Dallas County portions of Richardson ISD will also see Richardson ISD board — this is the correct behavior.

### ISD Scope
- **D-15:** Seed only the 5 named ISDs per requirements (TX-SCHOOL-01 through TX-SCHOOL-05). Do NOT expand scope to secondary Collin County ISDs (Prosper ISD, Wylie ISD, Celina ISD, Lovejoy ISD, Princeton ISD, etc.).
- **D-16:** Document the coverage gap in a migration comment: "Residents in smaller Collin County ISDs (Prosper, Wylie, Celina, Lovejoy, Princeton, etc.) will not see a SCHOOL section in Phase 88. A future phase could add these if needed."

### Headshots
- **D-17:** Check each ISD's official website for board member photos. Official website only — no LinkedIn, local news, or social media.
- **D-18:** All images processed to 600×750 JPEG, Lanczos q90, 4:5 crop first. `type='default'` in politician_images.
- **D-19:** Migration 262 is audit-only — SQL file only, no apply script. Documents source URL or 'No photo found on official ISD website.' per official.

### Elections (Out of Scope)
- **D-20:** No 2026 school board race rows in this phase. Elections data is a separate future phase.

### Post-seeding
- **D-21:** Run section split check query after migration 261 applies to verify no split-section bugs (from feedback_section_split_check.md pattern).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Pattern (Phase 87 CA School Boards — direct analog)
- `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` — Canonical school board seed SQL pattern. Migration 261 follows this structure exactly (swap state 'CA'/'ca'/'06' for 'TX'/'tx'/'48', swap GEOIDs and names for the 5 TX ISDs).
- `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql` — Canonical audit-only headshot migration. Migration 262 follows this pattern.
- `.planning/phases/87-ca-city-school-boards/87-CONTEXT.md` — Full decision set from Phase 87 (most decisions carry forward directly).

### Geofence Loader Pattern (Phase 86 OR School Districts)
- `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` — Canonical UNSD loader script. `load-tx-school-boundaries.ts` follows this structure exactly (swap FIPS 41→48, URL to tl_2024_48_unsd.zip, TARGET_GEOIDS map to the 5 TX ISDs, SOURCE to 'tiger_unsd_tx_2024').
- `.planning/phases/86-multnomah-county-school-districts/86-CONTEXT.md` — Phase 86 context (loader design decisions).

### TX Existing Government Patterns (for consistency)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — NOTE: TX supports ['cd', 'sldu', 'sldl', 'county', 'place'] but NOT 'unsd'. Do NOT modify this script for Phase 88. Skim for TX FIPS reference (48) and existing TX layer patterns only.

### TIGER UNSD Reference
- `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/` — Researcher must browse this directory to find `tl_2024_48_unsd.zip` and confirm the 5 target GEOIDs from the TX UNSD shapefile before coding the loader.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `load-or-school-boundaries.ts` — Copy as base for `load-tx-school-boundaries.ts`. Change: TIGER_URL (41→48), STATE ('41'→'48'), SOURCE ('tiger_unsd_or_2024'→'tiger_unsd_tx_2024'), TARGET_GEOIDS map (6 OR entries → 5 TX entries), baseName/tmpRoot.
- `migrations/257_ca_city_school_boards.sql` — Copy as structural template for migration 261. Change: state values ('CA'/'ca'/'06' → 'TX'/'tx'/'48'), GEOIDs (CA → TX), government/chamber/official names, external_id block (-870xxx → -880xxx), migration idempotency guard (government names).
- `migrations/258_ca_city_school_headshots.sql` — Copy as template for migration 262.

### Established Patterns
- `district_type='SCHOOL'` in `essentials.districts` — essentialsService.ts routing uses this to surface school board members.
- `politician_images.type='default'` — UI filters with `.find(img => img.type === 'default')`; wrong type = silent invisibility.
- `WHERE NOT EXISTS` guard on `essentials.governments` — no unique constraint on geo_id; ON CONFLICT would fail.
- Audit-only headshot migrations: SQL only, no apply script, `WHERE NOT EXISTS` on politician_images.
- `districts.state` must be lowercase 'tx' (routing query convention), while `governments.state` and `offices.representing_state` are uppercase 'TX'.
- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.

### Integration Points
- `essentialsService.ts` — Address lookup service that returns school board members. `district_type='SCHOOL'` is the routing key; no code changes needed.
- `geofence_boundaries` table — G5420 rows go here; the new loader script handles inserts directly.
- Existing TX government structures (Plano, McKinney, Allen, Frisco, Richardson city councils already seeded) — migration 261 must not conflict.

</code_context>

<specifics>
## Specific Ideas

No specific requirements beyond following the Phase 87 CA pattern and the Phase 86 OR loader pattern.

</specifics>

<deferred>
## Deferred Ideas

- **Secondary Collin County ISDs** — Prosper ISD, Wylie ISD, Celina ISD, Lovejoy ISD, Princeton ISD, etc. Residents in these ISDs won't see a SCHOOL section. Future phase if needed.
- **TX school board elections (2026 race rows)** — Out of scope for this phase; separate future phase if needed.

</deferred>

---

*Phase: 88-tx-collin-county-school-boards*
*Context gathered: 2026-06-02*
