# State

## Current Position

Phase: 58 (complete)
Plan: 02 of 2
Status: Phase 58 complete — LAUSD geofences loaded and smoke test verified
Last activity: 2026-05-21 — Completed 58-02-PLAN.md; all 3 SC pass (7 rows, downtown LA=BD2, Pasadena=0)
Progress: v7.0 Phase 58 complete. Ready for Phase 62 (LAUSD board officials ingestion).

Phase 55-01 — Elections foundation complete: migration 183 applied; Governor 5D+8R SOS-verified, Senate 3 candidates (Mills excluded), ME-01 3 candidates, ME-02 5 candidates (open seat); discovery cron armed for both 2026 ME elections
Phase 55-02 — Legislative scaffolding complete: migration 184 applied; 372 race rows (70 senate + 302 house) all with non-null office_id; district-type disambiguation confirmed
Phase 55-03 — Verification complete: all 5 SQL queries passed; 380 race rows confirmed; discovery cron IN SCOPE for both 2026 ME elections; human approved; Phase 55 closed

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20 after v6.0 milestone completion)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v7.0 California — Phase 58: LAUSD Geofences

## Accumulated Context

### Key Decisions (carry forward)

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results
- Jurisdictions processed sequentially (never parallel) — exhausts Claude API rate limit quota
- Citation required for every staged candidate — no citation = no staging entry (hallucination prevention)
- Discovery agent uses claude-sonnet-4-6 (~$0.017/run); forced tool_choice=report_candidates for typed output
- Migration numbering: 170 applied (ME federal officials); next is 185
- **Problem:** TIGER PLACE vs. COUSUB layer choice — loading only G4110 (incorporated cities) means G4040 COUSUB (towns/townships) residents get no LOCAL routing. **Solution:** Load BOTH G4110 and G4040 layers if the state has significant non-G4110 population. **Maine example:** 23 G4110 cities only loaded in Phase 49 — most ME residents live in G4040 towns NOT yet loaded. **MA example:** 58 G4110 cities + 293 G4040 COUSUB towns (Phase 48, both layers loaded).
- Cambridge congressional split (verified PostGIS): west/north = MA-05 geo_id='2505'; east/south/Inman = MA-07 geo_id='2507'
- geo_id collision between G4020 (Middlesex County='25017') and G5220 (8th Bristol District='25017') is TIGER format quirk — mtfcc always disambiguates; no routing risk
- CRITICAL: slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS pattern required for idempotent inserts
- Dual-office pattern: unique index on essentials.offices.politician_id was dropped in migration 159 — never re-add
- computeDisplaySpokes() is the single source of truth for compass spoke selection; both CompassCard and MiniCompass must import from src/lib/compass.js — never duplicate the algorithm
- Maine FIPS: 23; Portland geo_id: 2360545
- **Problem:** In some states, AG/SoS/Treasurer are elected by the legislature — not voters — and appear on no ballot. Creating race rows for them is incorrect. **Solution:** `is_appointed_position=true` on office row; NO `elections` or `races` rows. Research state constitution before assuming popular election (Wikipedia state government page is sufficient). **Maine example:** Frey (AG), Bellows (SoS), Perry (Treasurer) — all is_appointed=true; zero race rows (Phase 51-01).
- State of Maine government UUID: da88de8b-9afa-4d87-86d5-7eb83c3e9792 — use subquery by name in migrations, not hardcoded UUID
- Maine chambers (slugs): maine-senate, maine-house-of-representatives, maine-governor, maine-attorney-general, maine-secretary-of-state, maine-treasurer
- ME executive external_ids: -230001 (Mills/Governor), -230002 (Frey/AG), -230003 (Bellows/SoS), -230004 (Perry/Treasurer); politician UUIDs in 51-01-SUMMARY.md
- ME federal external_ids: -230101 (Collins R, 6b817122), -230102 (King I, 4f4b2bff), -230201 (Pingree D ME-01, 1638b2c9), -230202 (Golden D ME-02, c420f946); UUIDs in 51-02-SUMMARY.md
- **Problem:** NATIONAL_UPPER districts have 2 senators sharing one district_id — using `(district_id, chamber_id)` as uniqueness key blocks the 2nd senator INSERT. **Solution:** Office uniqueness key for senator rows is `(district_id, politician_id)` — each senator is a distinct politician. **Maine example:** Collins (R, ext=-230101) + King (I, ext=-230102) on same NATIONAL_UPPER district_id (verified Phase 51-02, migration 170).
- election_races (in plan docs) = essentials.races (actual table name) — verified in Phase 51-01
- Treasurer Joseph C. Perry (Democrat, elected Dec 2024) replaced Henry Beck who left 2025-01-06
- Maine has 23 incorporated cities (G4110 PLACE); Portland uses RCV for Mayor, Auditor, and at-large Council → election_method='rcv'
- ME smoke test confirmed: Augusta (state capital, Kennebec County) is in ME-02 (geo_id=2302), NOT ME-01; Bangor city geo_id=2302795; Augusta city geo_id=2302100
- Susan Collins is up for re-election 2026; Angus King is NOT up in 2026
- Governor Janet Mills is term-limited — 2026 Governor race is open (6D, 10R primary candidates)
- Maine state legislature website: mainelegislature.org (headshot source for senators/reps)
- geofence_boundaries.state = FIPS '23'; districts.state = abbreviation 'ME' (established pattern from TX/MA)
- **[STATE-SPECIFIC trap]** TIGER congressional shapefile naming varies by state. **Problem:** Loader key may not be `cd` — using wrong key causes silent no-op (loader runs, loads zero boundaries). **Solution:** Always browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` and check actual filename before configuring STATE_LAYER_ALLOWLIST. **Maine example:** `tl_2024_23_cd119.zip` → loader key `cd119`, not `cd`. **MA example:** uses `cd` (standard). Layers loaded for ME Phase 49-01: 23 cities (G4110), 2 CD, 35 SLDU, 151 SLDL, 16 counties.
- **Problem:** `districts.state` casing varies by district tier — wrong casing breaks routing queries. **Solution:** Lowercase (`'me'`, `'ma'`) for COUNTY/STATE_UPPER/STATE_LOWER; UPPERCASE (`'ME'`, `'MA'`) for NATIONAL_LOWER. Casing is set by loader's `abbrev` (lowercase) and `abbrevUpper` (uppercase) variables — always verify loader config and spot-check `SELECT DISTINCT state FROM essentials.districts` after running. **Maine example:** STATE_UPPER/STATE_LOWER rows use `'me'`; NATIONAL_LOWER rows use `'ME'` (Phase 49).
- Run TIGER loader from C:/EV-Accounts/backend (not C:/EV-Accounts) — dotenv looks for .env in cwd
- **CA COUSUB count in TIGER 2024 = 404** (not 1,057 from TIGERweb BAS25). All 404 are FUNCSTAT='S' CCDs. Pre-flight assertion set to 404 in load-state-tiger-boundaries.ts.
- **CA COUSUB_FUNCSTAT_STATES**: Only 'MA' in the set. CA CCDs are FUNCSTAT='S' (statistical), not FUNCSTAT='A' (active MCDs). Adding CA to this set would skip all 404 records.
- **CA districts.state casing**: 3 pre-existing LA County rows with state='CA' (uppercase, pre-Phase 57); new 57 county rows landed as state='ca' (lowercase, loader abbrev). Total 60 rows, 58 distinct counties. Pre-existing data quality issue — document but do not fix in Phase 57 scope.
- **CA city-CCD coterminous pairs**: Torrance, Santa Monica, Alameda G4110 polygons are geometrically identical to their G4040 CCD polygons in TIGER 2024. This is correct TIGER data; routing priority (G4110 > G4040) prevents routing errors.
- **geofence_boundaries state='06' after Phase 57**: G4020=58, G4040=404, G4110=482, G5200=52, G5210=40, G5220=80
- **v7.0 target city geo_ids (G4110, confirmed Phase 57-02 smoke test)**: SF=0667000, LA=0644000, SJ=0668000, SD=0666000, SAC=0664000, Fremont=0626000, Berkeley=0606000 — use for Phases 63-68 city government seeding
- **San Diego smoke test**: address returns CD-50 (not CD-51 as roadmap estimated) — TIGER geometry is authoritative
- **Phase 57 COMPLETE (2026-05-21)**: All 4 roadmap success criteria confirmed via smoke-ca-geofences.ts: SF consolidated city-county (G4110+G4020 both return), East LA unincorporated (G4040 only, no G4110), all layer counts correct, no NULL names
- **LAUSD board district geo_ids**: lausd-board-district-1 through lausd-board-district-7; mtfcc=G5420, state='06', source='lausd_geohub_board_districts_2024'; loaded 2026-05-21 (Phase 58-01)
- **CA G5420 total**: 346 TIGER UNSD + 7 LAUSD = 353; any mtfcc-level COUNT on G5420 must account for this; smoke tests must filter by geo_id LIKE 'lausd-board-district-%'
- **ArcGIS MapServer pattern**: always add outSR=4326 — LA GeoHub MapServer layers default to CA State Plane feet (SRID 2229)
- **Phase 62 LAUSD board members**: use district_type='SCHOOL' (not 'SCHOOL_DISTRICT') to match essentialsService.ts; geo_ids for boundaries are lausd-board-district-{1..7}
- **Phase 58 COMPLETE (2026-05-21)**: All 3 roadmap success criteria confirmed via smoke-lausd-geofences.ts: 7 LAUSD rows (geo_id LIKE filter), downtown LA returns lausd-board-district-2, Pasadena City Hall returns 0 rows (no false positive)
- **v7.0 CA target city geo_ids (verified 2026-05-21)**: SF=0667000, LA=0644000, SJ=0668000, SD=0666000, SAC=0664000, Fremont=0626000, Berkeley=0606000 — use for Phases 63-68
- **San Diego Balboa Park actual routing**: CD-50 (not CD-51 as estimated) — TIGER geometry is authoritative
- **East LA primary coordinate** (-118.1720, 34.0239) worked without fallback — G4040 geo_id=0603793155 (South Gate-East Los Angeles CCD), CD-34, State Senate D26, Assembly D52
- ME senator names: use official alphabetical listing (/senate/senators/9536) not individual page nicknames ('Jeff'=Jeffrey L., 'Dick'=Richard, 'Rick'=Richard A., 'Mattie'=Matthea E. L.)
- ME senator external_ids -231001..-231035 now OCCUPIED (migration 172 applied 2026-05-19)
- ME house rep external_ids -232001..-232151 now OCCUPIED (migration 173 applied 2026-05-19); -232029 intentionally absent (D29 vacant); all others populated
- ME House D94: Scott Harriman (Democrat, Lewiston) won special election 2026, external_id=-232094 — NOT vacant as research listed
- ME House D29: still vacant (Kathy Javner deceased, no special election as of 2026-05-19), office_id=ddb05295-68a1-4247-8b69-476269e13840
- ME house headshots source: /house/Repository/MemberProfiles/{uuid}_{Name}-{year}.jpg (UUID non-derivable, must visit profile per person)
- Phase 52 headshot coverage: 35/35 senators with photos, 150/150 house reps with photos; 0 gaps; house thumbnails upscaled from 152×202 (approved by user 2026-05-19); details in 52-03-SUMMARY.md
- essentials.offices has NO seat_label column and NO is_active column — use embedded title pattern: 'Council Member (Ward N)', 'Council Member (At-Large N)', 'Council Member (District N)'
- essentials.districts has no short_label column — only label
- ME 23 city governments + LOCAL districts + 206 skeletal offices seeded (migration 177 applied 2026-05-19)
- ME LOCAL districts state='me' lowercase; office district_id UPDATE uses WHERE district_id IS NULL for idempotency
- Portland 18 city officials seeded (migrations 178 + 179 applied 2026-05-19); external_ids -23601001..-23601018; all party=NULL; next migration is 180
- Portland at-large seat ordering (council): Pious Ali=AL1, April Fournier=AL2, Benjamin Grant=AL3; (school board): Maya Lena=AL1, Sarah Lentz=AL2, Usira Ali=AL3, Jayne Sawtelle=AL4
- Phase 53 Portland headshot coverage: 18/18 officials with headshots, 0 gaps; council from portlandmaine.gov/741/Council-Bios (CivicPlus API /api/apps/me-portland/all), school board from portlandschools.org/about/board-of-education/board-members (Finalsite CDN)
- Portland coverage area added to Landing.jsx COVERAGE_AREAS (2026-05-19, Phase 53); entry: { county: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' }
- Portland nonpartisan elections confirmed (party=NULL on all 18 officials)
- Migration 180 applied 2026-05-19: Lewiston (8) + Bangor (9) + South Portland (7) incumbents — 24 politicians, 25 office rows updated, Tipton dual-office (Mayor+D5), 9 Bangor emails
- Migration 181 applied 2026-05-19: Auburn (8) + Biddeford (10) incumbents — 18 politicians, 18 office rows updated; Auburn 8 emails @auburnmaine.gov; Biddeford Mayor email @biddefordmaine.org; Roger Beaupre = Ward 3 (NOT Mayor); no -230481011 row
- Migration 183 applied 2026-05-20: ME 2026 elections foundation — 3 elections, 8 races, 26 candidates, 3 discovery_jurisdictions; Governor 5D+8R SOS-verified (13 total, not 9); US Senate 3 candidates (Collins+Costello+Platner; Mills excluded withdrew Apr 30; Calabrese/Smeriglio not in SOS); ME-01 3, ME-02 5 open seat candidates; discovery cron armed for Jun 9 + Nov 3 2026
- Migration 184 applied 2026-05-20: 372 ME legislative race scaffold rows (35 senate × 2 + 151 house × 2); all 372 have non-null office_id; district-type disambiguation confirmed (Senate D1 and House D1 have distinct office_ids); PowerShell generator uses UTF-8 NoBOM via System.IO.File::WriteAllLines
- ME 2026 elections seeded: migrations 183 (elections+statewide) + 184 (372 legislative races) applied 2026-05-20; next migration 185
- Governor 2026 primary: 13 candidates (5D+8R) — Bellows (ext=-230003) linked; all others NULL politician_id
- US Senate 2026: Collins (R, incumbent) + Costello (D) + Platner (D) — 3 total; Mills withdrew Apr 30
- ME-02 open seat (Golden not running): Dunlap/Wood/Baldacci/Loud (D) + LePage (R)
- Post-June-9 follow-up migration required: add D primary winners to US Senate general + ME-01 general + ME-02 general race rows
- discovery_jurisdictions ME 2026-06-09 (20 days) and 2026-11-03 (167 days) are both IN SCOPE for Sunday cron; Portland 2027-11-02 OUT OF SCOPE until ~May 2027
- Next migration is 185
- Anna Bullett (Portland D4) CONFIRMED via Wikipedia Portland City Council (Maine) page 2026-05-19
- essentials.offices has NO email column; individual emails stored on politicians.email_addresses (TEXT[] array) as ARRAY['addr@domain'] in INSERT VALUES
- Tier 2 city external_id prefixes (5-digit): Lewiston=-23387xxxx, Bangor=-23027xxxx, SouthPortland=-23719xxxx, Auburn=-23020xxxx, Biddeford=-23048xxxx
- South Portland Elyse Tipton holds BOTH Mayor AND Council Member (District 5) via ONE politician row (external_id=-237191001); dual-office confirmed working in production
- Migration 180 applied 2026-05-19: 24 politicians (Lewiston 8 + Bangor 9 + South Portland 7), 25 office rows, idempotent
- Biddeford council seats=10 (Mayor+7W+2AL), South Portland=8 (Mayor+5D+2AL), Westbrook Council=8 (Mayor+5W+2AL) — research inventory descriptions excluded Mayor from seat totals
- Sanford/Ellsworth/Eastport mayor model = voter-elected on-council (defaulted; no council-selected evidence in research)
- Plan 53-02 UPDATE pattern: match on (chamber_id, title) to identify office rows — no seat_label column

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)
- TIGER loader: load-state-tiger-boundaries.ts — add Maine to STATE_LAYER_ALLOWLIST exactly as MA was added in Phase 38
- Next migration is 185 (182 is unapplied legacy views drop; 183 applied: ME 2026 elections foundation; 184 applied: ME 2026 legislative race scaffolding; 171 is 171_la_council_votes.sql unapplied)

### Pending Todos (accounts team backlog)

- **[ME — TIME-SENSITIVE]** Post-2026-06-09 follow-up: After ME primary results (target: week of June 9, 2026), write migration 185 to add D primary winners to US Senate general + ME-01 general + ME-02 general `race_candidates` rows. Also add R general candidates from statewide results.
- **[LA backlog]** Migration 171 (171_la_council_votes.sql) — unapplied; folded into Phase 62-01; apply when Phase 62 begins.
- **[DB — pending verification]** Migration 182 (legacy views drop) — verify applied status before Phase 62 work via `SELECT version FROM supabase_migrations.schema_migrations WHERE version='182'`.
- **[CA backlog — Phase 62]** CA Governor challenger candidates (10 filed, not yet seeded)
- **[CA backlog — Phase 62]** LAUSD sub-district geofences (Phase 58) + board officials (Phase 62)
- **[CA operational note]** lavote.gov election ID changes each cycle — mandatory manual update in Phase 62

### Parked from v2.2 (backlog — resume after v3.0)

- Phase 8-04: Human-verify checkpoint for Admin Discovery UI (blocked on Run Discovery 401 auth mismatch)
- Phase 9: Race Completeness Audit
- Phase 10: Compass Stances Integration (CA/IN local politicians)
- Phase 11: Indiana Local Races (Monroe County Commissioner, Clerk, Assessor, Township)

## Session Continuity

Last session: 2026-05-21
Stopped at: Completed 58-02-PLAN.md — LAUSD geofence smoke test; all 3 SC pass; Phase 58 closed.
Resume file: None
