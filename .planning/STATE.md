---
gsd_state_version: 1.0
milestone: v10.0
milestone_name: Multnomah County & School Boards
status: planning
last_updated: "2026-06-01T23:29:54.283Z"
last_activity: 2026-06-01
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 7
  completed_plans: 7
  percent: 43
---

# State

## Current Position

Phase: 86
Plan: Not started
Status: Ready to plan
Last activity: 2026-06-01

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-31 after v7.0 + v8.0 milestone archival)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Phase 86 — multnomah county school districts

## Accumulated Context

### Roadmap Evolution

- Phase 77.1 inserted after Phase 77: Fix Phase 77 data: set politicians.is_appointed=true for Lee III and Taylor (URGENT)
- Phase 82 added: OR State Legislature Compass Stances
- Phase 82 fleshed out (2026-05-31): 3 plans, wave structure (Wave 1 = senators, Wave 2 = house reps, Wave 3 = verification)
- Phase 82 COMPLETE (2026-05-31): all 7 requirements PASS; v9.0 shipped
- Phases 83–89 roadmapped (2026-05-31): 7 phases, 33 requirements mapped, v10.0 roadmap complete

### v10.0 Roadmap Summary

| Phase | Name | Requirements | Goal |
|-------|------|--------------|------|
| 83 | Multnomah County Government + Routing | COUNTY-01..03, ROUTING-01 | County government body + 6 commissioners seeded; unincorporated routing clean |
| 84 | Multnomah Smaller Cities | CITIES-01..06 | 5 city governments (Gresham/Troutdale/Fairview/Wood Village/Maywood Park) seeded |
| 85 | Multnomah Elections + Discovery | ELECTIONS-01..03 | County + city 2026 race rows + discovery pipeline armed |
| 86 | Multnomah County School Districts | OR-SCHOOL-01..04 | 6 school district G5420 geofences + board members seeded |
| 87 | CA City School Boards | CA-SCHOOL-01..06 | 6 CA city school board G5420 geofences + board members seeded |
| 88 | TX Collin County School Boards | TX-SCHOOL-01..05 | 5 Collin County ISD G5420 geofences + board members seeded |
| 89 | IN + ME School Board Completion | IN-SCHOOL-01..02, ME-SCHOOL-01..03 | IPS 7 seats + Monroe County + 5 ME city school boards seeded |

### v9.0 Phase 82 Key Outcomes

- **Total legislators covered:** 90 (30 senators + 60 house reps)
- **Total stance rows ingested:** 536 (215 senators via migration 242 + 321 house reps via migration 243)
- **Citation parity:** 536/536 (100% — 0 uncited answers; QUALITY-01 PASS)
- **Not-found legislators:** 0 — OLIS floor vote records provided minimum evidence for all 90
- **Sequential research runs:** 90 (10 sub-batches; QUALITY-02 PASS)
- **Compass render spot-check:** 6/6 profiles PASS (3 senators + 3 house reps; STANCE-04 PASS)
- **Oregon is the first US state with full legislature-wide compass coverage**
- **Migrations:** 242 (OR senate) + 243 (OR house) applied to production

### v9.0 Phase 82 Key Facts

- 90 legislators already seeded in DB from Phase 75 (30 senators + 60 house reps); all have politician_ids
- External_id ranges: OR senators seeded in migration 226; OR house reps seeded in migration 227
- Next migration number: 244 (migrations 242 + 243 consumed by Phase 82)
- Stance values are integers 1-5, written to inform.politician_answers
- Evidence-only standard: every stance requires a citation URL from public record
- Agents run ONE AT A TIME — never parallel (hard project constraint; rate limit enforcement)
- Legislators with zero discoverable stances are documented as not-found — this is acceptable
- Wave 1: 30 senators (82-01-PLAN.md) — migration 242
- Wave 2: 60 house reps (82-02-PLAN.md) — migration 243
- Wave 3: verification + spot-check (82-03-PLAN.md)
- Prior comparable phases: Phase 80 (24 OR officials, 4 plans, 321 stances); Phase 70 (68 CA officials, 3 plans, 965 stances)
- oregonlegislature.gov is the authoritative source for legislator bios and policy records

### Key Decisions (carry forward)

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results
- Jurisdictions processed sequentially (never parallel) — exhausts Claude API rate limit quota
- Citation required for every staged candidate — no citation = no staging entry (hallucination prevention)
- Discovery agent uses claude-sonnet-4-6 (~$0.017/run); forced tool_choice=report_candidates for typed output
- Migration numbering: next is 244 (242=OR senators, 243=OR house reps applied in Phase 82)
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
- **Next migration is 244** (migration history: 196=la_council_votes backfill no-op; 197=CA Governor challengers; 198=LAUSD board seed (chamber+7 districts+7 politicians+7 offices); 199=LAUSD dedup old at-large chamber; 200=LA County DA/Sheriff chambers; 201=remove stale CA Senate; 202-203=CA grouping fixes; 204=districtless orphan office fix; 205=SF government structure; 206=SF officials; 207=SD government structure; 208=SD officials; 210=Fremont government structure; 211=Fremont officials; 213=Berkeley government structure; 214=Berkeley officials; 215=Berkeley headshots AUDIT-ONLY; 216=SF officials stances; 217=SJ government structure; 218=SJ officials; 219=Sacramento government structure; 220=Sacramento officials; 221=SJ stances; 222=OR government chambers; 223a=OR executive district fix; 223=OR executive officials; 224=OR federal officials; 225=OR executive headshots AUDIT-ONLY; 226=OR state senators (30); 227=OR state house (60); 228=OR legislature headshots AUDIT-ONLY; 209/212/200/215/225/228 are audit-only headshot sql; 242=OR senate stances; 243=OR house stances)
- **Sacramento officials seeded (migration 220, 2026-05-23)**: 9 politicians — Mayor Kevin McCarty (-660001), Council Members Lisa Kaplan (-660010, D1), Roger Dickinson (-660011, D2), Karina Talamantes (-660012, D3), Phil Pluckebaum (-660013, D4), Caity Maple (-660014, D5), Eric Guerra (-660015, D6), Rick Jennings II (-660016, D7), Mai Vang (-660017, D8); all 9 office_ids non-null; City Hall (-121.4944, 38.5816) routes to Phil Pluckebaum (D4); Mayor routes via LOCAL_EXEC district (geo_id='0664000'); Rick Jennings II: last_name='Jennings II' (generational suffix in both fields)
- **Sacramento external_id range CONFIRMED**: Mayor=-660001, Council D1-D8=-660010..-660017 (migration 220 applied)
- **Sacramento headshots complete (Phase 66-03 complete 2026-05-28)**: 9/9 officials; all from cityofsacramento.gov (public_domain); CSS background-image pattern (AEM/CQ5 CMS — WebFetch can't extract; raw curl+grep required); square sources (McCarty/Pluckebaum/Jennings 514x514, Talamantes/Guerra/Vang 500x500) center-cropped to 4:5; tall sources top-cropped; all 600x750 JPEG q90; sac_headshots.sql is AUDIT-ONLY
  - **[GOTCHA] When seeding city officials, pre-check for name collisions with existing race_candidates rows**: ON CONFLICT on external_id does NOT catch same-person rows seeded under different external_ids. Run: SELECT full_name, COUNT(*) FROM essentials.politicians WHERE full_name IN (...new names...) GROUP BY full_name HAVING COUNT(*) > 1 -- Matt Mahan example: Phase 62 seeded -6003004/bb642e24 (CA Gov challenger); Phase 64 seeded -640001/41949a2b (SJ Mayor); required manual merge (race_candidates re-pointed + stale row deleted).
- **LAUSD RESOLVED (Phase 62-03 complete 2026-05-22)**: Migration 198 applied; LAUSD Board of Education chamber + 7 SCHOOL districts (lausd-board-district-{1-7}) + 7 politicians (-6004001..-6004007) + 7 offices correctly linked; D2=Rivas, D3=Schmerelson; 7 headshots 600x750 with type='default' in politician_images
- **[CRITICAL PATTERN] politician_images.type must be 'default'**: UI (Profile.jsx, Results.jsx) filters with `.find(img => img.type === 'default')`. Using type='headshot' causes silent invisibility. Always use type='default'.
- **LA County Supervisor geofences (loaded 2026-05-21)**: 5 rows in geofence_boundaries, geo_id='ocd-division/country:us/state:ca/county:los_angeles/council_district:{1-5}', mtfcc='X0005', state='06', source='la_county_geohub_supervisor_districts_2024'. Loader: load-la-county-supervisor-boundaries.ts (C:/EV-Accounts/backend/scripts). X0005 hits the X% fallback in essentialsService.ts → district_type IN ('LOCAL','COUNTY'). Downtown LA (-118.2437, 34.0522) → District 1 (Solis) confirmed.
- **SCHEMA**: essentials.politician_images columns are: id, politician_id, url, type, photo_license, focal_point — NO photo_origin_url column; plan docs that reference photo_origin_url are incorrect
- **CA headshots complete (Phase 61-03 2026-05-21)**: 80 Assembly from webapi.assembly.ca.gov/district-media/assets/members/assembly_member_NN.jpg; 40 Senate from www.senate.ca.gov/senators (data-src lazy-load, double-encoded %25xx paths must be used verbatim); all 120 are 600x750 JPEG in Storage at {politician_id}-headshot.jpg
- **Phase 75 headshot coverage (2026-05-29)**: 30/30 senators with photos, 60/60 house reps with photos; 0 documented gaps; oregonlegislature.gov MemberPhotos source; all 600x750 LANCZOS q90 upscale from ~115x130 (per D-05/D-06); non-obvious filename overrides: smithdb.jpg (SD-01), robinsonn.jpg (SD-02), andersond.jpg (SD-05), gelser.jpg (SD-08), starrb.jpg (SD-12), neron.jpg (SD-13), levye.jpg (HD-53 Emerson Levy), nguyend.jpg (HD-38 Daniel Nguyễn)
- **Phase 82 Plan 82-01 (senators) complete (2026-05-31)**: 215 stances for 30 OR senators (SD-01..SD-30); migration 242 applied; all 30 senators have >= 3 stances; HIGH evidence senators (Sara Gelser Blouin, Rob Wagner, Lew Frederick, Christine Drazan) reached 10-12 stances
- **Phase 82 Plan 82-02 (house reps) complete (2026-05-31)**: 321 stances for 60 OR house reps (HD-01..HD-60); migration 243 applied; all 60 house reps have >= 3 stances; HIGH evidence reps (Mark Gamba=9, Rob Nosse=9, Tawna Sanchez=9, Julie Fahey=10); Eastern OR members (HD-55..HD-60) capped at 3 per D-10 guidance; NO not-found CSVs — OLIS floor votes provided minimum evidence for all; Oregon is first state with full legislature-wide compass coverage (90 legislators, 536 stances combined)

### v10.0 Starting Context

- **Multnomah County geo_id**: 41051 (confirmed from OR TIGER load Phase 72-02)
- **Portland geo_id**: 4159000 (G4110, confirmed Phase 72-02)
- **OR TIGER already loaded** (Phase 72): all OR G4110 cities including Gresham (geo_id=4129850), Troutdale (4174950), Fairview (4123700), Wood Village (4183650), Maywood Park (4146100) — verify exact geo_ids via DB query before Phase 84 migrations
- **district_type='SCHOOL'** is the correct value for school board districts (confirmed Phase 62-03 LAUSD pattern; essentialsService.ts uses this value)
- **G5420 mtfcc** is the school district geofence type in TIGER UNSD files; TIGER UNSD = Unified School Districts shapefile; separate download from TIGER place/county/legislative files
- **LAUSD pattern** (Phase 58/62): source shapefiles → load as distinct mtfcc (G5420) → create districts rows (district_type='SCHOOL') → create chamber + offices → link offices to district rows; same pattern applies to all v10.0 school boards
- **Next migration**: 244

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

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)
- TIGER loader: load-state-tiger-boundaries.ts — add Maine to STATE_LAYER_ALLOWLIST exactly as MA was added in Phase 38

## Session Continuity

Last session: 2026-06-01T23:29:54.272Z
Stopped at: Phase 86 context gathered
Resume file: .planning/phases/86-multnomah-county-school-districts/86-CONTEXT.md
