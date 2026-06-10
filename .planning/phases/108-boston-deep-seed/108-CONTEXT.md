# Phase 108: Boston Deep Seed - Context

**Gathered:** 2026-06-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Boston city government (Mayor Wu + 13 City Councillors + Boston School Committee) with headshots so any Boston address returns a complete LOCAL + SCHOOL section. 3 plans: city government structure (Plan 01), school committee (Plan 02), headshots (Plan 03). Closes MA-DEEP-01, MA-DEEP-02, MA-DEEP-03.

</domain>

<decisions>
## Implementation Decisions

### Plan Structure
- **D-01:** **3 plans** — mirrors Alexandria (Phase 103) exactly:
  - Plan 01: City government structure (Mayor Wu + 13 City Councillors, chambers, offices, LOCAL + LOCAL_EXEC districts under geo_id='2507000')
  - Plan 02: Boston School Committee (SCHOOL district, chamber, 13 officials)
  - Plan 03: Headshots (both city council + school committee at 600×750)
- **D-02:** Starting migration: **347** (last v12.0 migration was 346; Phase 107 was verification-only — no migrations)

### Boston School Committee Structure
- **D-03:** Researcher must determine election topology from the November 2024 Boston ballot measure (Question 5). Key question: **are the 13 members all at-large (1 SCHOOL district, ACPS pattern) or is it 7 district representatives + 6 at-large (LAUSD pattern)?**
  - If at-large → 1 SCHOOL district row, 1 G5420 geofence (geo_id = BPS TIGER UNSD geo_id), 13 offices
  - If hybrid → multiple SCHOOL sub-district geo_ids needed; researcher finds all from Census TIGER UNSD MA data
- **D-04:** Researcher must find the Boston Public Schools TIGER UNSD geo_id from census.gov. It will be a Massachusetts LEAID / NCES code in the TIGER UNSD shapefiles. External ID range for school committee members: `-{bps_geo_id}001` through `-{bps_geo_id}013`.
- **D-05:** G5420 geofence(s) inserted **directly in the Plan 02 migration** — no MA G5420 loader exists yet. Same pattern as ACPS (D-03 there).

### Election Methods
- **D-06:** Researcher confirms `election_method` values for both chambers from official Boston sources before writing migrations. Do not assume. Prior precedent: Cambridge = `'stv_proportional'`; Portland council = `'rcv_bloc_voting'`. Boston City Council uses plurality-at-large in normal elections (no RCV confirmed as of 2026) — but researcher verifies. School Committee election method under the new 2024 model is unknown — researcher finds and documents.

### City Council (at-large, no district seats)
- **D-07:** Boston City Council is **at-large** — all 13 councillors represent the whole city. No per-district geofences needed. All 13 offices link to a single LOCAL district row under geo_id='2507000', mtfcc=NULL.
- **D-08:** External ID scheme for city officials: Mayor Wu = `-2507000001`, Councillors = `-2507000002` through `-2507000014` (geo_id-based scheme matching Leonardtown + Leonardtown pattern).
- **D-09:** Mayor Wu is LOCAL_EXEC district_type (same as other Mayors). City Councillors are LOCAL district_type.

### DB Conventions (carry forward — all from established MA/v5.0 patterns)
- **D-10:** `districts.state = 'ma'` (lowercase) for LOCAL, LOCAL_EXEC, SCHOOL — matches routing queries
- **D-11:** `governments.state = 'MA'` (uppercase); `offices.representing_state = 'MA'` (uppercase)
- **D-12:** `mtfcc=NULL` on LOCAL and LOCAL_EXEC district rows
- **D-13:** `slug` is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list
- **D-14:** `essentials.governments` has no unique constraint on geo_id — WHERE NOT EXISTS guard required on all government INSERTs
- **D-15:** `party=NULL` on all politicians (antipartisan design)
- **D-16:** `is_appointed=false, is_appointed_position=false` for all (Mayor, councillors, school committee are all voter-elected in current model)
- **D-17:** `politician_images.type = 'default'` (not 'headshot') — UI filters with .find(img => img.type === 'default')
- **D-18:** Boston geo_id='2507000' (G4110) is already present in geofence_boundaries (loaded in v5.0) — do NOT re-insert. Assert presence in pre-flight.
- **D-19:** Boston government row name: `'City of Boston, Massachusetts, US'` (type='LOCAL', state='MA', city='Boston', geo_id='2507000')
- **D-20:** `geofence_boundaries.state = '25'` (FIPS numeric string for Massachusetts — matches all MA rows)

### Headshots
- **D-21:** Headshot sources per ROADMAP: `boston.gov/city-council` (council), `bostonschoolcommittee.org` or `bps.boston.gov` (school committee)
- **D-22:** 600×750, Lanczos, q90; crop 4:5 ratio first — never stretch. Upload to `politician_photos` bucket as `{politician_id}-headshot.jpg`
- **D-23:** Best-effort for school committee members — document gaps for any officials without findable photos (not a blocker for MA-DEEP-02 if genuinely unavailable)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 108 — Goal, key facts (geo_ids, roster, headshot sources), success criteria
- `.planning/REQUIREMENTS.md` §MA-DEEP-01, MA-DEEP-02, MA-DEEP-03 — 3 requirements this phase closes

### Pattern Reference Migrations (closest analogs — copy structure)
- `C:/EV-Accounts/backend/migrations/157_cambridge_government_chambers.sql` — Cambridge city government + School Committee chambers under single government row; WHERE NOT EXISTS pattern; election_method column; MA conventions
- `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql` — LOCAL_EXEC + LOCAL district pattern, external ID scheme (-geo_id001 format), office_id back-fill, pre-flight guards
- `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` — **SCHOOL district pattern**: G5420 geofence direct INSERT, SCHOOL district row, school board chamber, pre-flight external_id clear check; use this if Boston SC is at-large (single SCHOOL district)
- `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` — secondary SCHOOL pattern; also covers multi-member school board offices

### Prior MA Phase Context
- `.planning/phases/103-alexandria-deep-seed/103-CONTEXT.md` — full decision log for equivalent Alexandria deep seed (D-01 through D-20 are the authoritative reference for city deep seed decisions)

### Headshot Upload Pattern
- `C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql` — headshot batch SQL: UPDATE politician_images via `politician_photos` bucket, type='default', photo_origin_url pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/157_cambridge_government_chambers.sql` — Cambridge MA city government structure (same state conventions, similar at-large model, School Committee chamber)
- `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` — SCHOOL district + G5420 geofence migration template (adapt for Boston Public Schools geo_id)

### Established Patterns
- **WHERE NOT EXISTS guard**: all governments INSERTs use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no ON CONFLICT
- **school board G5420 insertion**: always direct INSERT into geofence_boundaries (no loader); state='25' for MA; mtfcc='G5420'
- **External ID scheme**: city officials use `-{geo_id}001`, `-{geo_id}002`, etc. (Leonardtown + Alexandria pattern)
- **office_id back-fill**: after INSERT into offices, UPDATE politicians SET office_id = ... WHERE external_id = ...

### Integration Points
- `essentials.geofence_boundaries (geo_id='2507000', state='25')` — Boston's G4110 geofence, already present; do NOT re-insert
- `essentials.districts` — create LOCAL_EXEC, LOCAL, and SCHOOL district rows under geo_id='2507000' (and BPS geo_id for SCHOOL)
- `essentials.offices` — link all officials to their respective district rows
- `inform.politician_answers` / `inform.politician_context` — stances NOT in scope for Phase 108 (deferred to Phase 111+)

</code_context>

<specifics>
## Specific Ideas

- Roster (from ROADMAP, researcher verifies current officeholders): Mayor Michelle Wu (LOCAL_EXEC); 13 City Councillors (at-large, LOCAL); 13 School Committee members (SCHOOL). Researcher finds full names and verifies all are current as of execution date.
- Boston changed to an elected School Committee via November 2024 ballot measure. As of seeding, the elected committee may not have been seated yet or may be newly seated — researcher confirms current roster from bostonschoolcommittee.org.

</specifics>

<deferred>
## Deferred Ideas

- Compass stances for Mayor Wu + councillors + school committee members — deferred to Phase 111+ (MA Stances phases)
- MA elections (race rows, discovery pipeline) — deferred to Phase 110

</deferred>

---

*Phase: 108-Boston Deep Seed*
*Context gathered: 2026-06-10*
