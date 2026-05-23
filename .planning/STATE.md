# State

## Current Position

Phase: 64 (COMPLETE)
Plan: 03 of 3 complete
Status: Phase 64 FULLY COMPLETE — all 4 roadmap success criteria confirmed; 11/11 headshots uploaded; Tordillos portrait replaced; Mahan duplicate merged
Last activity: 2026-05-23 — Completed 64-03 SJ headshots; Phase 64 closed
Progress: v7.0 Phase 64 complete. Next: Phase 66 (Sacramento, geo_id=0664000). Then Phase 69 (Landing + Elections + Discovery).

Phase 68 (COMPLETE) — 10 Berkeley officials seeded + headshots uploaded; migrations 213-214 applied; end-to-end routing confirmed; profile pages show headshots
Phase 62-01 — Pre-flight complete: migration 196 applied (no-op, 171 already present); migration 182 confirmed applied; 6-tier smoke test surfaced 2 gaps: (1) LA County Supervisor districts have 0 geofence_boundaries rows — supervisor routing broken for all LA addresses; (2) LAUSD board members attached to whole-district geofence 0622710, not sub-district lausd-board-district-N — Plan 03 must create essentials.districts rows for lausd-board-district-{1-7}

Phase 55-01 — Elections foundation complete: migration 183 applied; Governor 5D+8R SOS-verified, Senate 3 candidates (Mills excluded), ME-01 3 candidates, ME-02 5 candidates (open seat); discovery cron armed for both 2026 ME elections
Phase 55-02 — Legislative scaffolding complete: migration 184 applied; 372 race rows (70 senate + 302 house) all with non-null office_id; district-type disambiguation confirmed
Phase 55-03 — Verification complete: all 5 SQL queries passed; 380 race rows confirmed; discovery cron IN SCOPE for both 2026 ME elections; human approved; Phase 55 closed

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-20 after v6.0 milestone completion)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v7.0 California — Phase 65 complete; next city phase TBD (San Jose, Sacramento, Fremont, Berkeley, or LA deep seed)

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
- **LAUSD geofences (Phase 58 complete 2026-05-21)**: 7 rows in geofence_boundaries, geo_id='lausd-board-district-{1-7}', mtfcc='G5420', state='06', source='lausd_geohub_board_districts_2024'. Loader: load-lausd-board-boundaries.ts (C:/EV-Accounts/backend/scripts). CRITICAL: CA G5420 total is now 692 (346 TIGER UNSD CA + other states + 7 LAUSD) — always filter by geo_id LIKE 'lausd-board-district-%', never raw mtfcc count. Downtown LA (-118.2437, 34.0522) → Board District 2. Pasadena → 0 rows.
- **Phase 62 LAUSD note**: when creating districts rows for LAUSD board members, use district_type='SCHOOL' (not 'SCHOOL_DISTRICT') to match essentialsService.ts
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
- ME 2026 elections seeded: migrations 183 (elections+statewide) + 184 (372 legislative races) applied 2026-05-20
- Governor 2026 primary: 13 candidates (5D+8R) — Bellows (ext=-230003) linked; all others NULL politician_id
- US Senate 2026: Collins (R, incumbent) + Costello (D) + Platner (D) — 3 total; Mills withdrew Apr 30
- ME-02 open seat (Golden not running): Dunlap/Wood/Baldacci/Loud (D) + LePage (R)
- Post-June-9 follow-up migration required: add D primary winners to US Senate general + ME-01 general + ME-02 general race rows
- discovery_jurisdictions ME 2026-06-09 (20 days) and 2026-11-03 (167 days) are both IN SCOPE for Sunday cron; Portland 2027-11-02 OUT OF SCOPE until ~May 2027
- Migration 189 applied 2026-05-21: CA government row geo_id fixed to '06' (was NULL); 8 CA executive chambers confirmed (pre-existed with short names — no "California" prefix); next migration is 190
- **CA government UUID**: e0f33bda-bfb5-4dd0-9816-576e6ce35fac — use subquery by name in migrations
- **CA chamber short names** (use in WHERE clauses, not "California {Role}"): Governor, Lieutenant Governor, Attorney General, Secretary of State, Controller, Treasurer, Commissioner of Insurance, Superintendent of Public Instruction
- **CA chamber slugs**: california-governor, california-lieutenant-governor, attorney-general-of-the-state-of-california, california-secretary-of-state, california-state-controller, california-state-treasurer, california-commissioner-of-insurance, california-superintendent-of-public-instruction
- **CA constitutional officer external_ids**: Newsom=-6000101, Kounalakis=-6000102, Bonta=-6000103, Weber=-6000104, Cohen=-6000105, Ma=-6000106, Lara=-6000107, Thurmond=-6000108
- **CA exec pre-existing seed**: all 8 CA constitutional officers were already seeded before Phase 59 with positive external_ids; Phase 59 deduped and updated to -06000xxx scheme (migration 192). 7/8 had headshots already; Lara uploaded in Phase 59-03.
- **[GOTCHA] CA gov pre-existing rows**: before writing migrations for any CA state-level entity, always pre-check whether it already exists — CA had a government row, chambers, and all 8 exec politicians seeded from prior work.
- **Berkeley council district geofences (Phase 68-01 complete 2026-05-22)**: 8 rows in geofence_boundaries, geo_id='berkeley-council-district-{1-8}', mtfcc='X0009', state='06', source='berkeley_city_council_districts'. Loader: load-berkeley-council-boundaries.ts (C:/EV-Accounts/backend/scripts). CRITICAL: Socrata endpoint (data.cityofberkeley.info) — NO outSR=4326 (returns native WGS84). Field is 'district' (lowercase, string values "1"-"8") — NOT 'DISTRICT' (ArcGIS) or 'sup_dist_num' (SF DataSF). Berkeley City Hall (-122.2726, 37.8709) → berkeley-council-district-4 (District 4).
- **X0009 MTFCC**: claimed for Berkeley council districts (X0005=LA County supervisors, X0006=SF supervisors, X0007=SD council, X0008=Fremont council, X0009=Berkeley council). X0010 is next available.
- **Berkeley government structure (migration 213 applied 2026-05-22)**: 1 government (name='City of Berkeley', state='CA', geo_id='0606000'), 3 chambers (Mayor + City Council + City Auditor — ALL with Phase 69 RCV TODO comment), 8 LOCAL districts (berkeley-council-district-{1-8}), 1 LOCAL_EXEC district (geo_id='0606000'). NO City Attorney chamber (appointed). BOTH Mayor and Auditor share the single LOCAL_EXEC district.
- **Berkeley officials seeded (Phase 68-02 complete 2026-05-22)**: 10 politicians; external_ids -680001 (Mayor Ishii), -680002 (Auditor Jenny Wong — NOT Hogan), -680010..-680017 (council D1-D8: Kesarwani/Taplin/Bartlett/Tregub/O'Keefe/Blackaby/Lunaparra/Humbert); all 10 have office_id back-filled; all offices is_appointed_position=false; council titles 'Council Member (District N)'; Mayor+Auditor linked to geo_id='0606000' LOCAL_EXEC; Berkeley City Hall routing confirmed: ST_Covers (-122.2726, 37.8709) → berkeley-council-district-4 → Igor Tregub; section-split detector 0 rows; NO City Attorney (appointed, not elected)
- **Berkeley -680xxx external_id range**: pre-flight confirmed clear (0 rows 2026-05-22) — reserved for 68-02 officials seed (-680001=Mayor, -680002=Auditor, -680010..-680017=council D1-D8)
- **Next migration is 215** (214 applied 2026-05-22: Berkeley officials seed — 10 politicians + 10 offices + office_id back-fill; 213 applied 2026-05-22: Berkeley govt structure; 212_fremont_headshots.sql is AUDIT-ONLY, not in ledger sequence; 211 applied 2026-05-22: Fremont officials seed — 7 politicians + 7 offices + office_id back-fill; 210 applied 2026-05-22: Fremont government structure — 1 government, 2 chambers, 6 LOCAL districts + 1 LOCAL_EXEC district; 209_sd_headshots.sql is AUDIT-ONLY, not in ledger sequence; 208 applied 2026-05-22: SD officials seed — 11 politicians + 11 offices + office_id back-fill; 207 applied 2026-05-22: SD government structure — 1 government, 3 chambers, 10 districts; 206 applied 2026-05-22: SF officials seed — 20 politicians + 20 offices; 205 applied 2026-05-22: SF government structure — 1 government, 10 chambers, 12 districts; 200 applied 2026-05-22: SF headshots audit-only — 20 politician_images INSERTs; 198_lausd_board_seed.sql exists in supabase/migrations but was never applied — skip it)
- **SD council district geofences (Phase 65-01 complete 2026-05-22)**: 9 rows in geofence_boundaries, geo_id='sd-council-district-{1-9}', mtfcc='X0007', state='06', source='sd_city_council_districts_2022'. Loader: load-sd-council-boundaries.ts (C:/EV-Accounts/backend/scripts). CRITICAL: outSR=4326 required — webmaps.sandiego.gov uses State Plane WKID 2230 (feet). DISTRICT integer field used for name (NOT NAME field — holds council member name, changes with elections).
- **SD government UUID**: 7efdfa12-88b2-482d-9379-84a7341bebc5 — use subquery by name in migrations, not hardcoded UUID
- **SD chambers created**: City Council (name='City Council', name_formal='San Diego City Council'), Mayor (name='Mayor', name_formal='Mayor of San Diego'), City Attorney (name='City Attorney', name_formal='San Diego City Attorney') — all under SD government
- **SD districts created**: 9 LOCAL (sd-council-district-1 through 9, state='CA') + 1 LOCAL_EXEC (geo_id='0666000', label='San Diego (Citywide)', state='CA') for Mayor + City Attorney offices
- **SD City Hall routing confirmed**: (-117.1546, 32.7157) -> sd-council-district-3 (District 3 — Stephen Whitburn); use in 65-02 routing verification
- **X0007 MTFCC**: claimed for SD council districts (X0005=LA County supervisors, X0006=SF supervisors, X0007=SD council)
- **SD external_id range -651000..-650000**: confirmed clear (0 rows pre-flight 2026-05-22) — reserved for 65-02 SD officials seed
- **SD officials seeded (Phase 65-02 complete 2026-05-22)**: 11 politicians; external_ids -650001 (Mayor Gloria), -650002 (City Attorney Ferbert), -650010..-650018 (council D1-D9); all 11 have office_id back-filled; all offices is_appointed_position=false; titles: Mayor/City Attorney/Council Member (9x); SD City Hall routing confirmed: ST_Covers (-117.1546, 32.7157) → sd-council-district-3 → Stephen Whitburn (end-to-end); section-split detector 0 rows; next migration is 209
- **Fremont geofences (Phase 67-01 complete 2026-05-22)**: 6 rows in geofence_boundaries, geo_id='fremont-council-district-{1-6}', mtfcc='X0008', state='06', source='fremont_city_council_districts_2022'. Loader: load-fremont-council-boundaries.ts (C:/EV-Accounts/backend/scripts). CRITICAL: outSR=4326 required — Fremont ArcGIS uses State Plane CA Zone 3 (WKID 102643). DISTRICT integer field used (NOT MAP_LABEL — holds council member name, changes with elections). Fremont City Hall (-121.9886, 37.5483) → fremont-council-district-3.
- **Fremont government structure (migration 210 applied 2026-05-22)**: 1 government (name='City of Fremont', state='CA', geo_id='0626000'), 2 chambers (City Council + Mayor — NO City Attorney, appointed position), 6 LOCAL districts (fremont-council-district-{1-6}), 1 LOCAL_EXEC district (geo_id='0626000'). Next migration is 212.
- **Fremont officials seeded (Phase 67-02 complete 2026-05-22)**: 7 politicians; external_ids -670001 (Mayor Salwan), -670010..-670015 (council D1-D6: Keng/Campbell/Kimberlin/Shao/Zhang/Liu); all 7 have office_id back-filled; all offices is_appointed_position=false; titles: Mayor/Council Member (6x); Fremont City Hall routing confirmed: ST_Covers (-121.9886, 37.5483) → fremont-council-district-3 → Kathy Kimberlin (end-to-end); section-split detector 0 rows
- **Fremont headshots complete (Phase 67-03 complete 2026-05-22)**: 7/7 officials; all from fremont.gov (public_domain); fremont.gov 403 bypassed via Node.js browser User-Agent + Referer header — extracted /home/showpublishedimage/{id}/{timestamp} CDN paths, confirmed downloadable; source originals 400x600 (2:3), cropped from top to 400x500 (4:5), resized to 600x750 Lanczos q90; Raj Salwan Wikipedia CC0 verified but fremont.gov portrait used; Storage path {politician_id}-headshot.jpg; 212_fremont_headshots.sql is AUDIT-ONLY; next applied Supabase migration is 213; Phase 67 fully complete
- **X0008 MTFCC**: claimed for Fremont council districts (X0005=LA County supervisors, X0006=SF supervisors, X0007=SD council, X0008=Fremont council)
- **X0010 MTFCC**: claimed for SJ council districts; geo_ids='sj-council-district-{1-10}'; state='06'; source='sj_city_council_districts_2022'; ArcGIS field is DISTRICTINT (integer 1-10, not DISTRICT); outSR=4326 required (WKID 102643 native); SJ City Hall (-121.88, 37.335) → sj-council-district-3; Oakland → 0 rows (Phase 64-01 complete 2026-05-23)
- **SJ government structure (migration 217 applied 2026-05-23)**: 1 government (name='City of San Jose', state='CA', geo_id='0668000'), 2 chambers ONLY (Mayor + City Council — City Attorney AND City Auditor are APPOINTED per SJ Charter, no chambers for either), 10 LOCAL districts (sj-council-district-{1-10}), 1 LOCAL_EXEC district (geo_id='0668000', label='San Jose (Citywide)'). TODO Phase 69: set election_method='RCV' on both chambers (SJ uses RCV)
- **SJ external_id range**: Mayor=-640001, Council D1-D10=-640010..-640019; confirmed clear pre-flight (64-RESEARCH.md 2026-05-22)
- **SJ ArcGIS endpoint**: geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120 — returns DISTRICTINT + COUNCILMEMBER fields; 10 features; outSR=4326 required
- **SJ officials seeded (Phase 64-02 complete 2026-05-23)**: 11 politicians; external_ids -640001 (Mayor Mahan), -640010..-640019 (council D1-D10: Kamei/Campos/Tordillos/Cohen/Ortiz/Mulcahy/Doan/Candelas/Foley/Casey); all 11 have office_id back-filled; all offices is_appointed_position=false; council titles 'Council Member (District N)'; Mayor linked to geo_id='0668000' LOCAL_EXEC; SJ City Hall routing confirmed: ST_Covers (-121.88, 37.335) → sj-council-district-3 → Anthony Tordillos; Mayor routing confirmed: Matt Mahan via geo_id=0668000; section-split detector 0 rows; NO City Attorney/Auditor (both appointed per SJ Charter); CRITICAL: geofence_boundaries.state='06' does NOT match districts.state='CA' — routing join must be on geo_id only, not state
- **SJ government UUID**: 47c9ce0a-401e-46d8-ae63-89266584b39a ΓÇö use subquery by name in migrations, not hardcoded UUID
- **SJ headshots complete (Phase 64-03 complete 2026-05-23)**: 11/11 officials; Mayor Mahan from Wikimedia Commons (cc-by-sa-4.0); D1 Kamei + D6 Mulcahy from sanjoseca.gov (public_domain); D2 Campos from sjdistrict2.org (public_domain); D3 Tordillos from runonclimate.org (cc-by-sa-4.0, replaced post-upload); D4 Cohen from sanjosedistrict4.com (public_domain); D5 Ortiz + D7 Doan + D8 Candelas + D9 Foley from Wikimedia Commons (public_domain); D10 Casey from sjdistrict10.org (public_domain); all 600x750 JPEG q90 in Storage at {politician_id}-headshot.jpg; sj_headshots.sql written as audit-only; Matt Mahan duplicate (bb642e24 from Phase 62 CA Gov challenger) deleted + race_candidates re-pointed to canonical 41949a2b; Phase 64 FULLY COMPLETE
- **Fremont City Attorney Rafael E. Alvarado Jr. is APPOINTED** by City Council — do NOT create City Attorney chamber or office row in any Fremont migration
- **SD headshots complete (Phase 65-03 2026-05-22)**: 11/11 officials; all from official sandiego.gov (public_domain); all 600x750 JPEG; D4 Foster headshot confirmed correct despite cd7-henry-foster-iii.png CMS filename anomaly; Storage path {politician_id}-headshot.jpg; 209_sd_headshots.sql is AUDIT-ONLY (mirrors 200_sf_headshots.sql pattern); next applied Supabase migration is 210
- **politician_images URLs for SD**: kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg
- **SF officials seeded (Phase 63-02)**: 11 supervisors (ext -630001..-630011) + 7 citywide elected (ext -630020..-630026) + 2 appointed (ext -630027..-630028 Controller=Wagner, CityAdmin=Chu); is_appointed_position=true ONLY on Wagner+Chu; Mandelman has 1 office only (D8 Supervisor, no separate Board President row); next available ext is -630029
- **SF headshots complete (Phase 63-03 2026-05-22)**: 20/20 officials; supervisors from sf.gov circular _profile.png (RGBA alpha=0 corners are outside 4:5 center crop -- no artifact); Miyamoto from Wikimedia Commons official SFSO portrait (public domain, 650x867); all other officials from media.api.sf.gov; sftreasurer.org for Cisneros; all 600x750 JPEG in Storage at {politician_id}-headshot.jpg; 200_sf_headshots.sql written as audit-only
- **SF City Hall routing confirmed twice**: (-122.4194, 37.7793) → sf-supervisor-district-5 → Bilal Mahmood (D5 incumbent)
- **SF government UUID**: bc3d780d-941e-475b-b07f-bc8dbcd300d3 — use subquery by name in migrations
- **SF City Hall routing**: (-122.4194, 37.7793) → sf-supervisor-district-5 (District 5, Matt Dorsey territory — Civic Center/Hayes Valley)
- **SF X0006 MTFCC**: claimed for SF supervisor districts (non-colliding with X0005=LA County)
- **DataSF Socrata pattern confirmed**: no outSR=4326; sup_dist_num returns float (11.0); parseInt(String()) handles correctly
- **essentials.districts confirmed schema**: column is 'label' not 'name'; no unique constraint on (geo_id, district_type) — use WHERE NOT EXISTS guards
- **CA Governor challengers external_ids**: Becerra=-6003001, Bianco=-6003002, Hilton=-6003003, Mahan=-6003004, Porter=-6003005, Steyer=-6003006, Villaraigosa=-6003007, Yee=-6003008; slots -6003009..-6003013 reserved
- **CA Governor race_candidates**: 43+ linked (all 9 Calmatters-sourced confirmed linked with correct external_ids as of migration 197)
- **lavote.gov discovery row (migration 197)**: id=9fd492a8-895e-4bd7-91e7-81f9bfa2b3e2, jurisdiction_geoid='06037', election_date=2026-06-03, source_url contains ?id=4338; post-June-3 follow-up required for November general
- **[GOTCHA] discovery agent creates politician rows with external_id=NULL** — before writing INSERT migrations for politicians, pre-check if rows already exist; use UPDATE to assign external_id, not INSERT
- **[GOTCHA] discovery_jurisdictions requires junction_geoid (NOT NULL) and election_date (NOT NULL)** — always include both in INSERTs
- **[POST-JUNE BACKLOG]** lavote.gov source_url needs new election ID for November 2026 general — update discovery_jurisdictions row id=9fd492a8
- **CA State Senate senator external_ids: -6001001 (SD-01) through -6001040 (SD-40)** — migration 194 applied 2026-05-21
- **CA Assembly member external_ids: -6002001 (AD-01) through -6002080 (AD-80)** — migration 195 applied 2026-05-21
- **CA Assembly chamber**: name='California State Assembly', slug='california-state-assembly'; was seeded as 'Assembly' in pre-existing data — migration 195 renamed it to canonical form
- **CA STATE_LOWER districts**: state='CA' (uppercase) — same pre-existing data pattern as STATE_UPPER; geo_id='06001'..'06080'; geofence_boundaries mtfcc='G5220'
- **CA Assembly geo_id formula**: '06' || lpad(district_num::text, 3, '0') (e.g., AD-17 -> '06017')
- **CA Assembly external_id formula**: -6002000 - district_num (e.g., AD-17 -> -6002017)
- **Phase 61 COMPLETE (2026-05-21)**: 40 senators (-6001001..-6001040) + 80 assembly members (-6002001..-6002080) seeded; 120 headshots uploaded; SF routing verified (Wiener SD-11, Haney AD-17); 12/12 must-haves pass
- **politician_images schema**: columns are id, politician_id, url, type, photo_license, focal_point — NO photo_origin_url column (plan docs were wrong; never use photo_origin_url)
- **senate.ca.gov headshot source**: www.senate.ca.gov/senators page has all 40 senator headshots in data-src lazy-load attributes; use %25xx paths verbatim (double-encoded; do NOT decode); img.src contains 1x1 GIF placeholder
- **SD-37 (Steven Choi) senate page**: sd37.senate.ca.gov redirects to senate.ca.gov — use centralized senators page instead
- **CA Assembly headshots**: sourced from webapi.assembly.ca.gov/district-media/assets/members/assembly_member_NN.jpg (500×500 square, crop center to 400×500 then resize to 600×750)
- **SF City Hall routing**: (-122.4191, 37.7792) -> Matt Haney (AD-17, geo_id='06017') — assembly routing confirmed 2026-05-21
- **CA STATE_UPPER districts state='CA' (uppercase)** — pre-existing data loaded before TIGER loader; migration 194 uses state='CA' in WHERE clause for districts join
- **CA districts.mtfcc is swapped**: STATE_UPPER has G5220, STATE_LOWER has G5210 (inverse of TIGER codes). Pre-existing data quality issue. Routing unaffected — essentialsService.ts joins on gb.mtfcc not d.mtfcc. Smoke tests must use the essentialsService join pattern, not raw d.mtfcc join.
- **CA House rep external_ids use -60003xx scheme**: -6000301 (CD-01) through -6000352 (CD-52); the -100049..-100119 range is occupied by CA State Assembly members (pre-existing seed). Use -60003xx for all future CA House rep references.
- **CA federal headshots (Phase 60 complete 2026-05-21)**: 35 headshots uploaded; unitedstates/images (450×550, public domain) for 30 reps; clerk.house.gov fallback for 5 new 119th Congress members not yet indexed (Simon, Gray, Liccardo, Fong, Min); storage path pattern: `{politician_id}-headshot.jpg`; politician_images uses `url` + `type` columns (not storage_path/is_primary)
- **Pete Aguilar external_id is -6000204** (not -100097 as originally planned; -100097 = Josh Lowenthal CA Assembly)
- **All 52 CA NATIONAL_LOWER CDs have office rows confirmed** (migration 193 applied 2026-05-21); total count is 53 because CD-29 has 2 rows (Luz Rivas active + Tony Cárdenas deactivated/is_vacant=true)
- **SF Civic Center routing confirmed**: (-122.4191, 37.7792) → geofence_boundaries 0611 → districts NATIONAL_LOWER → offices → Nancy Pelosi (CD-11); column is `geometry` not `geom`
- **Pete Aguilar external_id is -6000204** (not -100097 as originally planned; -100097 = Josh Lowenthal CA Assembly)
- **Tony Cárdenas external_id is -6000203**; his CD-29 office row is_vacant=true; real CD-29 rep is Luz Maria Rivas (-100021)
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
- **Next migration is 219** (migration history: 196=la_council_votes backfill no-op; 197=CA Governor challengers; 198=LAUSD board seed (chamber+7 districts+7 politicians+7 offices); 199=LAUSD dedup old at-large chamber; 200=LA County DA/Sheriff chambers; 201=remove stale CA Senate; 202-203=CA grouping fixes; 204=districtless orphan office fix; 205=SF government structure; 206=SF officials; 207=SD government structure; 208=SD officials; 210=Fremont government structure; 211=Fremont officials; 213=Berkeley government structure; 214=Berkeley officials; 215=Berkeley headshots AUDIT-ONLY; 216=SF officials stances; 217=SJ government structure; 218=SJ officials; 209/212/200/215/sj_headshots.sql are audit-only headshots sql)
  - **[GOTCHA] When seeding city officials, pre-check for name collisions with existing race_candidates rows**: ON CONFLICT on external_id does NOT catch same-person rows seeded under different external_ids. Run: SELECT full_name, COUNT(*) FROM essentials.politicians WHERE full_name IN (...new names...) GROUP BY full_name HAVING COUNT(*) > 1 -- Matt Mahan example: Phase 62 seeded -6003004/bb642e24 (CA Gov challenger); Phase 64 seeded -640001/41949a2b (SJ Mayor); required manual merge (race_candidates re-pointed + stale row deleted).
- **LAUSD RESOLVED (Phase 62-03 complete 2026-05-22)**: Migration 198 applied; LAUSD Board of Education chamber + 7 SCHOOL districts (lausd-board-district-{1-7}) + 7 politicians (-6004001..-6004007) + 7 offices correctly linked; D2=Rivas, D3=Schmerelson; 7 headshots 600x750 with type='default' in politician_images
- **[CRITICAL PATTERN] politician_images.type must be 'default'**: UI (Profile.jsx, Results.jsx) filters with `.find(img => img.type === 'default')`. Using type='headshot' causes silent invisibility. Always use type='default'.
- **LA County Supervisor geofences (loaded 2026-05-21)**: 5 rows in geofence_boundaries, geo_id='ocd-division/country:us/state:ca/county:los_angeles/council_district:{1-5}', mtfcc='X0005', state='06', source='la_county_geohub_supervisor_districts_2024'. Loader: load-la-county-supervisor-boundaries.ts (C:/EV-Accounts/backend/scripts). X0005 hits the X% fallback in essentialsService.ts → district_type IN ('LOCAL','COUNTY'). Downtown LA (-118.2437, 34.0522) → District 1 (Solis) confirmed.
- **SCHEMA**: essentials.politician_images columns are: id, politician_id, url, type, photo_license, focal_point — NO photo_origin_url column; plan docs that reference photo_origin_url are incorrect
- **CA headshots complete (Phase 61-03 2026-05-21)**: 80 Assembly from webapi.assembly.ca.gov/district-media/assets/members/assembly_member_NN.jpg; 40 Senate from www.senate.ca.gov/senators (data-src lazy-load, double-encoded %25xx paths must be used verbatim); all 120 are 600x750 JPEG in Storage at {politician_id}-headshot.jpg

### Pending Todos (accounts team backlog)

- **[ME — TIME-SENSITIVE]** Post-2026-06-09 follow-up: After ME primary results (target: week of June 9, 2026), write migration 185 to add D primary winners to US Senate general + ME-01 general + ME-02 general `race_candidates` rows. Also add R general candidates from statewide results.
- **[LA backlog — RESOLVED 2026-05-22]** Migration 171 (meetings.la_council_votes + la_council_agenda_items) — was already applied outside ledger; migration 196 applied as no-op audit trail (version='196' in ledger).
- **[DB — RESOLVED 2026-05-22]** Migration 182 (fix_security_invoker_public_views) — confirmed applied as ledger version '20260520191454'.
- **[LA gap — RESOLVED 2026-05-21]** LA County Supervisor sub-districts — 5 geofence_boundaries rows loaded (mtfcc='X0005'); routing now live. Loader: load-la-county-supervisor-boundaries.ts.
- **[LA gap — Phase 62-03]** LAUSD board members attached to whole-district geofence (geo_id=0622710, label='Los Angeles Unified Board'); Plan 03 must create 7 essentials.districts rows for lausd-board-district-{1-7} and link offices to those sub-district ids.
- **[CA backlog — RESOLVED 2026-05-22 Phase 62-02]** CA Governor challenger candidates — 8 challengers assigned -6003001..-6003008; all 9 Calmatters race_candidates linked; lavote.gov discovery row inserted
- **[CA backlog — Phase 62-03]** LAUSD sub-district geofences (Phase 58) + board officials (Phase 62)
- **[CA operational note — POST-JUNE]** lavote.gov election ID changes each cycle — update discovery_jurisdictions row id=9fd492a8 after June 3 primary for November general

### Parked from v2.2 (backlog — resume after v3.0)

- Phase 8-04: Human-verify checkpoint for Admin Discovery UI (blocked on Run Discovery 401 auth mismatch)
- Phase 9: Race Completeness Audit
- Phase 10: Compass Stances Integration (CA/IN local politicians)
- Phase 11: Indiana Local Races (Monroe County Commissioner, Clerk, Assessor, Township)

## Session Continuity

Last session: 2026-05-23
Stopped at: Completed 64-03-PLAN.md; Phase 64 San Jose deep seed fully complete (geofences + government structure + officials + headshots). Next: Phase 66 Sacramento.
Resume file: None
