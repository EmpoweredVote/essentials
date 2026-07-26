# Phase 103: Alexandria Deep Seed - Context

**Gathered:** 2026-06-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Seed Alexandria city government (Mayor Gaskins + 6 at-large council) under geo_id='5101000' and ACPS school board (9 members) under a single TIGER UNSD SCHOOL district. Includes headshots for council (600×750) and best-effort headshots for ACPS board. Three plans: city government (01), ACPS school board (02), headshots (03).

</domain>

<decisions>
## Implementation Decisions

### ACPS School Board Structure
- **D-01:** ACPS uses **1 SCHOOL district** (single TIGER UNSD covering all of Alexandria) — all 9 board members link to the same SCHOOL district row. Any Alexandria resident sees all 9 members. The "3 school districts" in the ROADMAP refers to internal electoral zones, not separate TIGER geo_ids.
- **D-02:** Researcher must find the Alexandria City SD TIGER UNSD geo_id from census.gov TIGER data. This geo_id is needed for both the geofence_boundaries INSERT (Plan 02) and the essentials.districts SCHOOL district row.

### G5420 Geofence Loading
- **D-03:** ACPS G5420 geofence row inserted **directly in the Plan 02 migration** (no TIGER loader re-run). Keeps Phase 103 self-contained. VA statewide G5420 loader coverage is deferred to a future phase. The VA TIGER loader (Phase 100) does not currently include G5420 — confirmed no VA G5420 rows in geofence_boundaries.

### Migration Structure
- **D-04:** **3 plans** — city government (Plan 01 = migration 312), ACPS school board (Plan 02 = migration 313), headshots (Plan 03 = migration 314). Each is independently verifiable. Matches SF/SD/Fremont pattern of separating structure from headshots.

### DB State (pre-confirmed, no research needed)
- **D-05:** `geo_id='5101000'` (G4110) is present in geofence_boundaries (state='51') — the LOCAL routing tier for Alexandria. Do NOT use '51510' (that's the COUNTY tier already seeded).
- **D-06:** `geo_id='51510'` already has a COUNTY district row — no INSERT needed for that tier.
- **D-07:** No Alexandria government, LOCAL, LOCAL_EXEC, or SCHOOL district rows exist yet — all need to be created.
- **D-08:** `tiger_geoid` column exists on essentials.districts (nullable). New Alexandria LOCAL/LOCAL_EXEC/SCHOOL districts should insert with `tiger_geoid=NULL` — VAGE-03 backfill (Accounts v2.10) covers SLDL/SLDU only.

### Accounts v2.10 Coordination
- **D-09:** Phase 103 is **fully independent** of Accounts v2.10 (VAIN/VAGE/VAST/VAFI). The new schema columns (`tiger_geoid`, `geo_districts`) are already in place and won't conflict. `photo_origin_url` doesn't exist on politician_images yet and VAIN-03 targets state/federal officials — not Alexandria council or ACPS board. No ordering dependency.

### VA Conventions (carry forward from Phase 101/102)
- **D-10:** `districts.state = 'va'` (lowercase) for LOCAL, LOCAL_EXEC, SCHOOL — matches routing queries
- **D-11:** `governments.state = 'VA'` (uppercase) — governments table convention
- **D-12:** `offices.representing_state = 'VA'` (uppercase) — offices table convention
- **D-13:** `mtfcc=NULL` on LOCAL and LOCAL_EXEC district rows (migration 246/277 pattern)
- **D-14:** `slug` is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list
- **D-15:** `essentials.governments` has no unique constraint on geo_id — WHERE NOT EXISTS guard required on all government INSERTs
- **D-16:** `party=NULL` on all politicians (antipartisan design)
- **D-17:** `is_appointed=false, is_appointed_position=false` for all (Mayor, council, ACPS board are all voter-elected)
- **D-18:** `politician_images.type = 'default'` (not 'headshot') — UI filters with .find(img => img.type === 'default')

### External ID Scheme
- **D-19:** Alexandria city officials: `-5101000001` (Mayor Gaskins) through `-5101000007` (6th council member) — geo_id-based scheme matching Leonardtown pattern (-2446475001..-2446475006)
- **D-20:** ACPS board members: `-{ACPS_geo_id}001` through `-{ACPS_geo_id}009` — researcher fills in ACPS geo_id after TIGER lookup

### Roster (from ROADMAP — researcher verifies full names and titles)
- Mayor: Alyia Gaskins → LOCAL_EXEC district, title='Mayor'
- Council (6 at-large): Bagley, Aguirre, Chapman, Elnoubi, Greene, Marks → LOCAL district, title='Council Member'
- ACPS Chair: Michelle Rief; VC: Christopher Harris; members: Abdalla, Beaty, Carmichael Booz, Kenley, Reyna, Scioscia, Simpson Baird → SCHOOL district, title='School Board Member' (verify official titles)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 103 — Goal, key facts (geo_ids, roster), success criteria
- `.planning/REQUIREMENTS.md` §VA-DEEP-01, VA-DEEP-02, VA-DEEP-03

### Pattern Reference Migrations
- `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql` — **closest match for city government plan** (LOCAL_EXEC + LOCAL, mtfcc=NULL, WHERE NOT EXISTS, WITH ins_p / NOT EXISTS office guard, office_id backfill, post-verification DO block)
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — **closest match for ACPS plan** (SCHOOL district_type, G5420 geofence pre-flight, single SCHOOL district per institution, school government structure)
- `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` — secondary SCHOOL pattern (office title conventions per district, pre-flight external_id clear check)

### Prior VA Phase Context
- `.planning/phases/101-va-state-government-db/` — VA government UUID (`bf1095e6`), confirmed district.state='va' convention, is_appointed_position=false for voter-elected

### Headshot Sources (for Plan 03 researcher)
- alexandriava.gov — Alexandria city council headshots
- acps.k12.va.us/school-board/members-of-the-school-board — ACPS board member headshots

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql` — Copy the WITH ins_p / CROSS JOIN / NOT EXISTS office guard structure; adapt geo_id from '2446475' → '5101000', state from 'md' → 'va'
- `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` — Copy the G5420 geofence pre-flight + SCHOOL district block structure for ACPS Plan 02

### Established Patterns
- **City government CTE pattern**: `WITH ins_p AS (INSERT...ON CONFLICT (external_id) DO NOTHING RETURNING id) INSERT INTO offices FROM districts CROSS JOIN ins_p WHERE geo_id='5101000' AND district_type='LOCAL_EXEC'/'LOCAL' AND state='va' AND p.id IS NOT NULL AND NOT EXISTS (...)`
- **G5420 direct insert**: Since no VA G5420 geofences exist, Plan 02 must INSERT INTO geofence_boundaries (geo_id, mtfcc, state) with the ACPS UNSD geo_id BEFORE the districts/offices blocks
- **Post-verification DO block**: Gate (a) government count, Gate (b) total office count for the geo_id, Gate (c) section-split detector — same pattern as migration 277
- **Headshot bucket**: `politician_photos` bucket (NOT 'politician-headshots'), path `{politician_id}-headshot.jpg` — project standard

### Integration Points
- Alexandria LOCAL officials link to `geo_id='5101000'` — matches the G4110 geofence already in production
- Section-split detector for Plan 01: check geo_id='5101000', mtfcc='G4110', state='va' → must have LOCAL/LOCAL_EXEC districts after migration
- Section-split detector for Plan 02: check ACPS geo_id, mtfcc='G5420' → must have SCHOOL district after migration

</code_context>

<specifics>
## Specific Ideas

- Alexandria is an independent city — no county layer above it for LOCAL routing; geo_id='5101000' (G4110) is the canonical LOCAL geo_id, NOT '51510' (COUNTY tier)
- Accounts v2.10 requirements were reviewed: VAIN-02 (migration 311) already applied by Phase 102; VAGE work targets SLDL/SLDU only; Phase 103 officials are outside VAIN-03 scope
- `tiger_geoid` is already a column on essentials.districts — new Alexandria/ACPS districts insert with NULL (consistent with all other LOCAL/SCHOOL districts across all states)

</specifics>

<deferred>
## Deferred Ideas

- VA statewide G5420 loading (all ~130 VA school divisions) — future phase; not needed for Phase 103
- `photo_origin_url` population for Alexandria officials — column not yet added by Accounts team; can be backfilled once VAIN-03 ships

</deferred>

---

*Phase: 103-Alexandria Deep Seed*
*Context gathered: 2026-06-08*
