# Essentials — Empowered Vote

## What This Is

Essentials is a civic engagement web app that helps people discover who represents them and who is running in upcoming elections. It covers Monroe County, IN, Los Angeles County, CA (12-city LA-area stance coverage), Collin County, TX, Cambridge + 14 more Massachusetts cities, all of Maine, all of California (7 deep-seeded cities), all of Oregon (Portland deep seed), Multnomah County, OR including 22 school districts across 4 states, all of Maryland (St. Mary's County + Leonardtown deep seed), Virginia (Alexandria deep seed), and Utah (all 10 largest cities deep-seeded + full 104-member state legislature with compass stances). It works fully for anonymous users (Inform tier) and provides enhanced jurisdiction-aware experiences for Connected accounts. A dedicated Elections page at `/elections` gives any user instant access to their local ballot. Candidate data is populated by a Claude-powered discovery pipeline. The political compass includes 10 LOCAL-scope topics and 8 JUDICIAL-scope topics, with scope filtering so each politician type sees only relevant questions. Legal candidate profiles surface bar evaluation data (LACBA ratings, CJP discipline), judicial compass stances, and legal donor activity — all from free/public sources. A cold-start playbook (`LOCATION-ONBOARDING.md` + 6 templates) documents how to onboard any US city from scratch.

## Core Value

A resident can look up who represents them — and who is on their ballot — without creating an account.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Representatives lookup by address — geocodes to politicians via PostGIS geofence matching
- ✓ Politician profile pages (bio, legislative record, judicial scorecard)
- ✓ Candidate profile pages linked from election races
- ✓ Elections tab in Results — address-driven, fetches via `/essentials/elections-by-address`
- ✓ `ElectionsView.jsx` — randomized candidate ordering (session-seeded shuffle), grouped by tier → government body → race
- ✓ Connected user jurisdiction auto-populate — no address re-entry for known location
- ✓ Auth flow — redirect to Auth Hub, hash-fragment token extraction, `ev_token` in localStorage
- ✓ Three-tier detection — Inform / Connected-with-jurisdiction / Connected-no-jurisdiction
- ✓ Political Compass integration (via CompassContext)
- ✓ XP/gem awards for Connected users (service-to-service, idempotent)
- ✓ Coverage for Monroe County, IN and Los Angeles County, CA (data + geofences)
- ✓ Dedicated `/elections` top-level page — standalone route, not buried in Results — v2.0
- ✓ Connected user auto-forward on Elections page — jurisdiction → immediate fetch via `elections/me`, no address input — v2.0
- ✓ Inform/no-jurisdiction users see address input on Elections page with Monroe County and LA County shortcuts — v2.0
- ✓ Unopposed race handling — "Running Unopposed" photo overlay for 1-candidate races — v2.0
- ✓ No-candidates race handling — "No candidates have filed" coral notice for 0-candidate races — v2.0
- ✓ Backend LEFT JOIN fix — races with 0 candidates returned with `candidates: []`, not silently dropped — v2.0
- ✓ Navigation entries — "Upcoming Elections" card on Landing page + "Elections" item in site header — v2.0
- ✓ Jurisdiction registry — config-driven table of covered areas with election authority URLs — v2.1
- ✓ Claude discovery agent — citation-required structured output via forced tool_choice; finds candidates from official sources — v2.1
- ✓ Confidence scoring — official (domain allowlist), matched (fuzzy name ≥85%), uncertain (neither) — v2.1
- ✓ Staging queue — candidate_staging table; uncertain candidates held for admin approval — v2.1
- ✓ Auto-upsert — official/matched candidates with resolved race_id upserted directly to race_candidates — v2.1
- ✓ Admin approve/dismiss endpoints — approve triggers upsert to race_candidates; dismiss records reason — v2.1
- ✓ Admin staging review UI — JWT-gated React page with race grouping, confidence badges, urgency indicators, optimistic actions — v2.1
- ✓ On-demand discovery trigger — POST /admin/discover/jurisdiction/:id and /discover/race/:id — v2.1
- ✓ Weekly cron discovery — Sunday 02:00 UTC, sequential processing, in-process lock, auto-upsert enabled — v2.1
- ✓ Discovery run log — every run recorded to discovery_runs with status, counts, raw agent JSONB — v2.1
- ✓ Admin email notifications — urgency-aware review email, zero-candidate regression alert, failure alert — v2.1
- ✓ New jurisdiction onboarding — adding a discovery_jurisdictions row is sufficient to enable discovery and scheduling — v2.1
- ✓ Proximity-aware cron — daily cadence within 30 days of election, configurable per jurisdiction — v2.1
- ✓ 10 new LOCAL compass topics with full 5-stance metadata (50 stances, 14 scope-role rows) in production `inform` schema — v3.1
- ✓ 10 companion Focused Communities in `connect.communities` with authored descriptions, all live at fc.empowered.vote — v3.1
- ✓ LOCAL scope tagging audit — Affordable Housing gap closed; all 5 LOCAL-applicable existing topics confirmed correct — v3.1
- ✓ `districtScope` filtering in CompassCard/Profile/CandidateProfile.jsx — local politicians see only LOCAL-applicable compass topics — v3.1
- ✓ "Criminalization of Homelessness" keep-both decision documented (42 existing politician answers; complementary framing to Homelessness Response) — v3.1
- ✓ 8 judicial compass topics (4 universal + 2 judge-specific + 2 City Attorney/DA-specific) with 40 stances, scoped to legal offices only via 'judicial' role_scope — v3.2
- ✓ JudicialCompassSection.jsx with sub-role filtering (judge/city_attorney_da), burnt orange treatment, empty notch UI — v3.2
- ✓ 8 companion Focused Communities for judicial topics; fc_community_slug populated on all 8 — v3.2
- ✓ Bar evaluation data: 32 LACBA ratings + 2 CJP disciplinary records (Connolly) with plain-language descriptions; BarEvaluationSection.jsx on all legal profiles — v3.2
- ✓ Judicial compass stances for 3 LA City Attorney candidates: Ashouri 6/6, McKinney 5/6, Roy 5/6, all sourced from public record — v3.2
- ✓ Campaign finance gap closed: 16 active LA candidates have la_socrata sources; 246 sources ingested; maintenance procedure documented — v3.2
- ✓ Legal Donor Activity: firm-level legal-professional donor data for 4 LA candidates; LegalDonorActivitySection.jsx on all legal profiles (candidate + politician) — v3.2
- ✓ isLegalCandidate 6-condition parity across Profile.jsx + CandidateProfile.jsx — v3.2
- ✓ Collin County, TX government structure — 23 cities, 23 chambers, 151 offices with Census FIPS codes (Copeville excluded pending incorporation verification) — v3.0
- ✓ Tier 1+2 Collin County incumbents — 57 rows across 8 cities with is_active + is_incumbent; 100% contact info coverage — v3.0
- ✓ Tier 3-4 Collin County incumbents — 74 rows across 15 cities; sparse Tier 4 coverage documented (small digital footprint expected) — v3.0
- ✓ Discovery pipeline armed for 23 TX cities — test run confirmed; weekly cron at Sunday 02:00 UTC; collincountytx.gov domain enforced — v3.0
- ✓ Tier 1+2 headshots — 57 politicians at 600×750 in Supabase Storage; 34 Tier 3/4 gaps confirmed unavailable by user — v3.0
- ✓ Compass stances for 5 TX cities — 26 rows in inform.politician_answers; renders on Plano/McKinney/Allen profiles (human-verified); sparse cities documented — v3.0
- ✓ 38 TX US House members as NATIONAL_LOWER + Collin County G4020 geofence; PostGIS county-congressional intersection live in production — v3.0
- ✓ 8 TX state/federal executives (Abbott, Patrick, Paxton, Hegar, Buckingham, Miller, Cornyn, Cruz) with chambers, offices, Wikipedia headshots — v3.0
- ✓ 31 TX senators + 150 TX state reps with 181 geofence boundaries; any TX address returns correct STATE_UPPER + STATE_LOWER — v3.0
- ✓ `LOCAL_LENS_TOPICS` (8 UUIDs) + `toggleLocalLens()` in CompassContext with snapshot/restore and localStorage persistence — one-click preset for local governance topics — v4.0
- ✓ `computeDisplaySpokes()` pure function in `compass.js` — single source of truth for lens-aware bilateral spoke selection shared by CompassCard and MiniCompass — v4.0
- ✓ `MiniCompass.jsx` — label-free RadarChartCore tile with portal tooltip, silent absence below 3 bilateral spokes, container opacity signal for lens-on replacement spokes — v4.0
- ✓ Mini compass wired into Elections + Representatives candidate tiles — overlay pattern, per-race scope filtering, portal tooltip, race deduplication — v4.0
- ✓ `CompassControlsBar.jsx` shared sticky component — Min/Max (Heroicon SVGs) + Local Lens + Judicial Lens toggle; single source of truth for controls on both pages — v4.0
- ✓ Compass-default mode — calibrated users (≥3 answers) auto-enable compass on `/elections` and Results pages; localStorage null-check; explicit `'false'` suppresses re-enable — v4.0
- ✓ `LOCATION-ONBOARDING.md` cold-start playbook (8 steps, 6 templates, 13 Cambridge learnings with [GOTCHA] callouts) — repeatable process for onboarding any US city; `elections-seed.md` template added — v5.0
- ✓ Massachusetts state layer — 281 geofence boundaries (58 G4110 cities + 40 Senate + 160 House + 9 congressional + 14 county); 200 MA legislators + 6 executives + 11 federal officials with headshots at 600×750 — v5.0
- ✓ Cambridge, MA city structure — 9-seat at-large City Council (stv_proportional), School Committee, City Manager, Mayor (appointed council-internal title, not LOCAL_EXEC); 16 incumbents seeded with contact data; Landing page entry — v5.0
- ✓ Cambridge headshots — 15/16 officials at 600×750 JPEG in Supabase Storage (Luisa de Paula Santos genuine unavailability documented) — v5.0
- ✓ MA 2026 elections + discovery pipeline — primary (2026-09-01) + general (2026-11-03) seeded; 10+ Cambridge-area district races; Azeem 2nd Middlesex primary linked (politician_id=d2358e54); MA discovery_jurisdictions cron_active=true; Cambridge 2027 placeholder inactive — v5.0
- ✓ Cambridge compass stances — 162 stance values for 8/9 councillors + City Manager, all cited from public record; compass renders correctly on councillor profiles (human-verified) — v5.0
- ✓ Playbook retrospective — LOCATION-ONBOARDING.md + 6 templates updated with Cambridge execution learnings; wrong pg_constraint query removed; 7 [GOTCHA] callouts documented — v5.0
- ✓ Maine TIGER geofences — 23 G4110 cities + 2 CD + 35 SLDU + 151 SLDL + 16 G4020 counties; any ME address routes to correct federal, state, and city representatives — v6.0
- ✓ Maine state + federal government DB — Governor Mills, legislature-elected AG/SoS/Treasurer (is_appointed_position=true), Collins + King (NATIONAL_UPPER), Pingree (ME-01) + Golden (ME-02); 6 chambers, all with headshots at 600×750 — v6.0
- ✓ 35 ME state senators + 151 ME house reps with offices linked to geofence districts; 185/185 headshots (senators full-res, house upscaled from 152×202 with approval) — v6.0
- ✓ All 23 ME city governments scaffolded; Portland deep seed (18 officials, RCV chambers, headshots); 5 Tier 2 cities (Lewiston/Bangor/South Portland/Auburn/Biddeford) with incumbents; 18 skeletal cities documented as known gaps — v6.0
- ✓ 380 ME race rows for 2026 elections — 13 Governor candidates (open seat, SOS-verified), US Senate (Collins + 2 challengers), 2 US House races, 372 legislative scaffold rows; discovery cron armed for 2026-06-09 + 2026-11-03 — v6.0
- ✓ ME Playbook retrospective — 9 Maine GOTCHAs added to LOCATION-ONBOARDING.md; 5 templates updated (legislature headshots, multi-tier seeding, PowerShell generator, RCV chamber, legislature-elected=appointed) — v6.0
- ✓ Landing.jsx Maine entry — Portland city browse (browseGovernmentList=['2360545']) + ME state browse (browseStateAbbrev='ME') — v6.0
- ✓ CA TIGER geofences — 482 G4110 cities + 404 G4040 CCDs + 80 SLDU + 40 SLDL + 52 CD + 58 G4020 counties; SF consolidated city-county (G4110+G4020 both returned); any CA address routes to correct tiers — v7.0
- ✓ LAUSD board district geofences (7 districts, mtfcc=G5420) + 7 LAUSD board member officials with offices linked to sub-district boundaries; LA address returns correct LAUSD board member — v7.0
- ✓ State of California government DB — 8 constitutional officers (pre-existing seed fixed: NULL geo_id updated to '06'); 120 CA state legislators (40 senators + 80 assembly); 54 federal officials (2 senators + 52 US House reps) — all with headshots at 600×750 — v7.0
- ✓ LA backlog closure — CA Governor 2026 race with all SOS-verified challenger candidates; lavote.gov election ID current (id=4338); LAUSD officials seeded; LA city structure gaps closed — v7.0
- ✓ 6 CA city deep seeds at full Tier 1 depth — SF (20 officials, 10 chambers, RCV, DataSF Socrata loader), San Jose (11 officials, RCV, ArcGIS DISTRICTINT), San Diego (11 officials, ArcGIS WKID 2230), Sacramento (9 officials, AEM/CQ5 curl+grep headshots), Fremont (7 officials, fremont.gov 403 workaround), Berkeley (10 officials, RCV, Socrata 'district' field) — v7.0
- ✓ CA 2026 elections — Governor race + 52 US House races + discovery pipeline armed (cron_active=true); lavote.gov discovery row; 7 CA city discovery_jurisdictions rows — v7.0
- ✓ 965 compass stances across 68 CA officials — SF 366, San Diego 164, Berkeley 126, San Jose 133, Sacramento 120, Fremont 56; all cited from public record — v7.0
- ✓ CA Playbook retrospective — 11 CA-specific GOTCHAs added to LOCATION-ONBOARDING.md; California Quick Reference block added; 7 new rows in Cities Onboarded table; v7.0 milestone closed — v7.0
- ✓ Oregon TIGER geofences — 241 G4110 cities + 30 SLDU + 60 SLDL + 6 CD + 36 G4020 counties; Portland geo_id=4159000; any OR address routes to correct federal, state, and local representatives; cd119 TIGER key — v8.0
- ✓ Oregon state government DB — 5 voter-elected constitutional officers (Kotek/Rayfield/Read/Steiner/Stephenson) + 30 state senators + 60 house reps + 2 US Senators + 6 US House reps; all 90 legislators from oregonlegislature.gov with headshots at 600×750 — v8.0
- ✓ Portland deep seed — 2024 charter reform: 4-district × 3-seat RCV council (12 officials) + Mayor + City Auditor + 2 appointed (City Administrator, City Attorney); council district boundaries from PortlandMaps ArcGIS (not TIGER); 14 elected officials with headshots from portland.gov 1_1_320w style URLs — v8.0
- ✓ OR 2026 elections + discovery pipeline — 105 race rows (1 Governor + 1 US Senate + 6 US House + 30 OR Senate + 60 OR House + 7 Portland City); discovery_jurisdictions for OR statewide + Portland; armed via election_date 180-day cron window — v8.0
- ✓ 321 compass stances across 24 OR officials — Kotek 31, Rayfield 24, Bonamici 24, Bentz 21, Hoyle 20, Steiner 13, Salinas 18, Bynum 13, Read 12, Dexter 12, Stephenson 10, Wilson 10; all cited; compass renders on Kotek profile — v8.0
- ✓ OR Playbook retrospective — 9 OR-specific GOTCHAs added to LOCATION-ONBOARDING.md; Oregon Quick Reference block; 2 new Cities Onboarded rows (Oregon state + Portland); v8.0 milestone closed — v8.0
- ✓ 536 compass stances for all 90 OR state legislators (30 senators + 60 house reps); 100% citation rate (536/536); Oregon first US state with full legislature-wide compass coverage — v9.0
- ✓ Multnomah County Board of Commissioners government body + 5 commissioners + Chair seeded with headshots; unincorporated OR address routing fixed (no empty LOCAL city section) — v10.0
- ✓ 5 smaller Multnomah cities seeded — Gresham/Troutdale/Fairview/Wood Village/Maywood Park with officials + available headshots; ENCLAVE_CITY_ALIASES deployed for Maywood Park routing — v10.0
- ✓ 18 Multnomah 2026 race rows + discovery_jurisdictions armed for Multnomah County (geo_id=41051) — v10.0
- ✓ 6 Multnomah County school district G5420 geofences + 38 board members seeded (PPS/Parkrose/Reynolds/Centennial/David Douglas/Riverdale); TIGER UNSD G5420 school board pattern established — v10.0
- ✓ 6 CA city school boards seeded — SFUSD/SDUSD/SCUSD/SJUSD/FUSD/BUSD (34 officials); office titles per district convention (Commissioner/Director/Trustee) — v10.0
- ✓ 5 Collin County TX ISDs seeded — Plano/McKinney/Allen/Frisco/Richardson (35 board members); Richardson hybrid Place ordering; groupHierarchy.js mayor-first + seat-label sort fixes — v10.0
- ✓ IPS all 7 seats wired + MCCSC D7 updated; 5 ME city school boards seeded — Lewiston/Bangor/South Portland/Auburn/Biddeford (37 officials) — v10.0
- ✓ MD TIGER geofences — 307 geofence_boundaries rows for state='24': 157 G4110 cities, 24 G4020 counties, 8 G5200 CDs, 47 G5210 senate, 71 G5220 SLDL sub-districts; Baltimore City dual-tier (G4110=2404000 + G4020=24510); any MD address routes to correct tiers; St. Mary's County geo_id=24037 (Phase 95 prerequisite) — v11.0
- ✓ MD state government foundation — State of Maryland government row asserted (migration 174); 5 constitutional officer chambers (Governor, LG, AG, Comptroller, State Treasurer); 5 executive officials (Wes Moore, Aruna Miller, Anthony G. Brown, Brooke Lierman, Dereck E. Davis) with STATE_EXEC districts, offices, office_id back-fill, and headshots at 600×750; Davis is_appointed=true (D-03); LG has standalone chamber + district (D-01) — v11.0
- ✓ Maryland state coverage: 307 geofence boundaries; 47 senators + 141 delegates + 10 federal officials; 202 officials with headshots; 1516+ compass stances; 130 race rows + discovery pipeline — v11.0
- ✓ St. Mary's County + Leonardtown deep seed: county commission + town council seeded with headshots — v11.0
- ✓ MiniCompass compact overlay: dotRadius=2.5 + showLabels=false — v11.0

- ✓ VA TIGER geofences — 511 geofence_boundaries rows for state='51': 227 G4110 cities, 133 G4020 counties/independent cities, 11 G5200 CDs, 40 G5210 senate, 100 G5220 SLDL; Alexandria dual-tier (G4110=5101000 + G4020=51510); Fairfax County + Fairfax city separate G4020 rows; any VA address routes to correct tiers; Gate 7 section-split clean — v12.0
- ✓ MA town geofences — 293 G4040 COUSUB boundaries confirmed in production (state='25'); Concord/Brookline/Lexington PIP routing verified (G4040+G5200+G5210+G5220 tier chain); Boston FUNCSTAT exclusion intact (routes via G4110 only); section-split clean (0 rows); MA-GEO-01 + MA-GEO-02 closed — v13.0 Phase 107

### v12.0 Virginia Essentials (Shipped: 2026-06-10)

**Delivered:** VA TIGER geofences (511 geofence_boundaries rows across 5 MTFCC types), state government DB (3 executives + 40 senators + 100 delegates), VA federal officials (Warner + Kaine + 11 US House reps), Alexandria deep seed (Mayor + 6 city council + ACPS 9 board members with headshots), VA 2026 elections (12 race rows + discovery), compass stances for 3 execs + 2 US Senators + 7 Alexandria council + 8 ACPS board members.

### v13.0 Massachusetts Expanded (Shipped: 2026-06-13)

**Delivered:** MA town geofences (293 G4040 COUSUB boundaries), Boston deep seed (Mayor Wu + 13 City Councillors + School Committee with headshots), MA Tier 2 cities (Worcester + Springfield + Lowell + Brockton + Quincy), MA 2026 elections (240+ race rows + discovery armed), compass stances for all 217 MA officials (6 execs + 11 federal + 40 senators + 160 house reps), and MA playbook retrospective.

### Current Milestone: none — v16.0 Utah Coverage closed 2026-06-18; awaiting next milestone direction

**Most recent (v16.0 Utah Coverage, shipped 2026-06-18):** All 10 largest Utah cities
deep-seeded (roster → headshots → evidence-only stances) + full compass coverage for the
104-member Utah state legislature (29 Senate + 75 House; 955 stance rows). Utah is the third
US state with full legislature-wide compass coverage. See `.planning/v16.0-MILESTONE-AUDIT.md`.

**Open carry-forward:** SLC/Ogden/Layton duplicate council office rows (cleanup migration
pending — audit UT-CITY-01); SLC D4 Napier-Pearce portrait + stances; Beverly Hills ~July-7
council reorg follow-up (STATE.md Pending Todos).

### Active

- None — awaiting next milestone direction. Run `/gsd:new-milestone` to scope the next one.

### Out of Scope

<!-- Explicit boundaries. -->

- Incumbency highlighting — deliberately excluded; anti-partisan mission, no "pole position"
- Alphabetical ordering — explicitly excluded; all candidate ordering is randomized per session seed
- Hiding empty/unopposed races — user confirmed wrong direction; all races must surface
- Real-time chat or notifications — not a civic lookup product
- Mobile app — web-first

## Context

- **Stack**: React 19 + Vite + Tailwind CSS 4 + React Router 7. UI components from `@empoweredvote/ev-ui`.
- **Backend**: Express API (`C:\EV-Accounts`), deployed via Render push to master. Database: Postgres with PostGIS in `essentials` schema.
- **Shipped v2.0**: Dedicated Elections page at `/elections` — 4 phases, 4 plans complete (2026-04-13).
- **Shipped v2.1**: Claude candidate discovery pipeline — 3 phases, 9 plans, 18/18 requirements (2026-04-25). ~1,733 LOC TypeScript in 6 core discovery files.
- **Shipped v3.0**: Collin County, TX coverage — 10 phases, 33 plans, 22/22 requirements (2026-04-30 → 2026-05-12). 23 TX cities seeded (151 offices, 120+ politicians). 38 US House + 31 senators + 150 state reps with full geofence boundaries. 26 compass stances for 19 TX politicians.
- **Shipped v3.1**: Local Compass Expansion — 4 phases, 7 plans, 25/26 requirements (2026-05-05). 10 LOCAL topics + 10 FC communities + scope filtering wired in essentials frontend.
- **Shipped v3.2**: Legal Candidate Evaluation Framework — 7 phases, 17 plans, 15/15 active requirements (2026-05-10). Judicial compass, bar evaluation data, stance research for 3 LA City Attorney candidates, legal donor activity. 67 files, ~11k LOC delta.
- **Shipped v4.0**: Compass Experience — 4 phases (3 active + 1 parked), 7 plans, all requirements satisfied (2026-05-12 → 2026-05-14). 32 files changed, 4,919 insertions. MiniCompass tiles, Local Lens preset, CompassControlsBar shared component, compass-default mode for calibrated users.
- **Shipped v5.0**: Location Onboarding Playbook — Cambridge, MA proof-of-concept (10 active phases + 1 skipped, 21 plans, 4 days; 2026-05-15 → 2026-05-18). 91 files changed (17,480 insertions). MA state layer (281 geofences, 200+ legislators + executives + federal officials), Cambridge city structure + 15/16 headshots + MA 2026 elections + 162 compass stances. Cold-start playbook (`LOCATION-ONBOARDING.md` + 6 templates) now available for any US city.
- **Shipped v6.0**: Maine Essentials — 8 phases (49-56), 20 plans, 2 days (2026-05-18 → 2026-05-20). 70 files changed (17,058 insertions). 227 ME geofences, State of Maine DB (6 chambers), 35 senators + 151 house reps + 185 headshots, Portland deep seed (18 officials), 5 Tier 2 cities, 380 race rows for 2026 elections, discovery cron armed. Playbook retrofitted with 9 Maine GOTCHAs + 5 template updates.
- **Shipped v7.0**: California — 14 active phases (57-70, 78), 42 plans, 8 days (2026-05-21 → 2026-05-29). CA TIGER geofences (482 G4110 + 404 G4040 + 52 CD + 80 SLDU + 40 SLDL + 58 counties); LAUSD board district geofences; State of CA government DB (8 constitutional officers + 120 state legislators + 54 federal officials); LA backlog closed; 6 CA city deep seeds (SF/SJ/SD/SAC/Fremont/Berkeley) with council district geofences; CA 2026 elections + discovery armed; 965 compass stances across 68 CA officials. Playbook updated with 11 CA-specific GOTCHAs + California Quick Reference.
- **Shipped v8.0**: Oregon — 10 phases + 1 inserted (72-81, 77.1), 25 plans, 9 days (2026-05-28 → 2026-05-31). OR TIGER geofences (241 G4110 + 6 CD + 30 SLDU + 60 SLDL + 36 counties; cd119 key); 5 OR constitutional officers + 90 legislators + 8 federal officials; Portland deep seed (2024 charter reform: 4-district × 3-seat RCV council, ArcGIS-sourced geofences, 14 headshots); 105 OR 2026 race rows + discovery pipeline; 321 compass stances across 24 OR officials. Playbook updated with 9 OR-specific GOTCHAs + Oregon Quick Reference.
- **Discovery cost**: ~$0.017/run with claude-sonnet-4-6; $20 API credits loaded 2026-04-24.
- **Database state (v10.0)**: 7+ elections; 450+ races; 140+ candidates; 8,000+ geofence boundaries. 22 school districts seeded across OR/CA/TX/IN/ME (G5420 TIGER UNSD pattern). Discovery pipeline covers 23 TX cities + CA + OR + IN + MA 2026 + ME 2026. Next migration: 268.
- **Data gaps (accounts team backlog)**: CA Governor challenger candidates (10 filed, not seeded); LAUSD sub-district geofences pending; lavote.gov election ID changes each cycle (mandatory manual update).
- **Auth**: Redirect-only flow via Auth Hub (`accounts.empowered.vote`). No direct login from Essentials.
- **Anti-patterns enforced**: No Google Places autocomplete. No address re-entry for Connected users. Party data on races only, never on candidates.

## Constraints

- **Tech stack**: React/JSX (not TypeScript on frontend). Backend is TypeScript.
- **Auth model**: Connected users must never be prompted for their address if `jurisdiction` is non-null — EDOC-01.
- **Data**: Candidate randomization is per-session (seeded shuffle in sessionStorage), not per-page-load.
- **Backend deploy**: Changes to backend require push to `master` branch at `C:\EV-Accounts` for Render deploy.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Seeded-shuffle candidate ordering | Antipartisan — prevents alphabetical bias across refreshes within a session | ✓ Good |
| Party affiliation on races, not candidates | Antipartisan mission — primary party context without candidate-level party display | ✓ Good |
| Hash-fragment token delivery | Prevents token leakage in server/CDN logs | ✓ Good |
| Elections as separate page (not in Results) | Users shouldn't need to "find" elections buried under address search | ✓ Good — v2.0 |
| `elections/me` for Connected auto-load | Census Geocoder unreliable with city+state; also returns wrong-district races | ✓ Good — v2.0 |
| Elections page view-only (no saveMyLocation) | Elections is a lookup destination, not a location-setting flow | ✓ Good — v2.0 |
| "Running Unopposed" as photo overlay | SubGroupSection has no badge slot; overlay consistent with Withdrawn banner pattern | ✓ Good — v2.0 |
| Left-border zebra stripe over background fill | rgba(0,0,0,0.03) invisible on all tier backgrounds; 2px #E5E7EB border is visible | ✓ Good — v2.0 |
| Local tier skips branch-first sort | BRANCH_ORDER correct for State/Federal but wrong for Local civic priority | ✓ Good — v2.0 |
| navItems two-step in Layout.jsx | Clean separation of Read & Rank injection from Elections append; no defaultNavItems mutation | ✓ Good — v2.0 |
| Forced tool_choice=report_candidates | 'any'/'auto' lets Claude pick web_search as final call, producing no typed results — forced tool is the only reliable citation-required output | ✓ Good — v2.1 |
| NAME_MATCH_THRESHOLD = 0.85 | 0.80 produced too many false-positive matches; 0.85 locked as project-wide constant | ✓ Good — v2.1 |
| No Postgres transaction in discovery orchestrator | Run row IS the audit trail; partial staging failures preserved and visible, not rolled back | ✓ Good — v2.1 |
| confidence + flagged computed independently | official + flagged=true = official source with no race in DB (ballot-completeness radar) | ✓ Good — v2.1 |
| Dual-router JWT+token staging pattern | JWT-gated browser router + X-Admin-Token server-to-server router under same prefix; auth at route level not mount level | ✓ Good — v2.1 |
| In-process lock (not Redis) for discovery sweep | Single-instance Render deployment; process restart clears lock; 2h TTL guards slow sweeps | ✓ Good — v2.1 |
| Sequential jurisdiction processing in cron | Never Promise.all — exhausts Anthropic rate limit quota with no usable output | ✓ Good — v2.1 |
| web_search max_uses: 1 (with sourceUrl) / 2 (without) | Prevents quota exhaustion per discovery run | ✓ Good — v2.1 |
| Compass scope in compass_topic_roles (not compass_stances) | compass_stances has no scope column; scope is a join table — audited Phase 22 | ✓ Good — v3.1 |
| Keep both "Criminalization of Homelessness" + "Homelessness Response" | 42 existing politician answers; complementary framing (enforcement vs. service delivery) — retiring would orphan real data | ✓ Good — v3.1 |
| 4 of 10 new topics get LOCAL+STATE dual scope | Topics where state co-governs (transportation, environment, public safety, homelessness services) warrant state scope too | ✓ Good — v3.1 |
| local-immigration topic_key → immigration-policy slug | Decouples public FC URL from internal key; prevents confusion with existing federal Immigration topic | ✓ Good — v3.1 |
| `t[key] !== false` in CompassCard scope filter | Cross-cutting topics (no scope rows, undefined flags) correctly pass all tier filters — `=== true` would break them | ✓ Good — v3.1 |
| 'judicial' role_scope in compass_topic_roles + judicial_role column on compass_topics | Clean separation from legislative topics; judicial_role=NULL for universal topics, 'judge'/'city_attorney_da' for sub-role filtering | ✓ Good — v3.2 |
| applies_judicial defaults to false in compassService.ts | Existing cross-cutting topics must NOT appear on judicial profiles; explicit opt-in required | ✓ Good — v3.2 |
| Option C pivot for donor data — Legal Donor Activity without court cross-reference | lacourt.org PAOS charges $1–$4.75/search; ~237 firms not worth manual cost for MVP; firm-level transparency still meaningful | ✓ Good — v3.2 |
| BarEvaluationSection omits clean-record rows | "Active — no discipline" rows have zero voter signal; section links to CJP UI for full history | ✓ Good — v3.2 |
| Plain-language description standard for judicial_disciplinary_records | Voter-facing summary of what judge did, not bureaucratic label; description field is primary p-tag | ✓ Good — v3.2 |
| isLegalCandidate 6-condition parity across Profile.jsx + CandidateProfile.jsx | Incumbents use office_title; candidates need position_name as additional signal — intentional asymmetry documented | ✓ Good — v3.2 |
| dScope fallback: isLegalCandidate ? 'judicial' : null | Catches city attorney candidates with null district_type; prevents CompassCard from rendering legislative topics | ✓ Good — v3.2 |
| computeDisplaySpokes() as single source of truth | Extracted from CompassCard to compass.js; both CompassCard and MiniCompass share lens-aware bilateral spoke selection — never duplicate this algorithm | ✓ Good — v4.0 |
| INNER_SVG_SIZE=200 with CSS-constrained container | RadarChartCore foreignObjects (190px) and hit-dots (r=14) do not scale with size prop; always pass 200 internally, constrain via CSS outer div | ✓ Good — v4.0 |
| Container opacity 0.7 only when (hasReplacedSpokes && localLensActive) | Replacement spokes only need visual signal when Lens forces the topic set; when Lens is OFF, replacements are normal user-selected fallbacks | ✓ Good — v4.0 |
| marginBottom: -70 load-bearing sticky overlay | Must not be removed — scroll behavior for controls bar breaks without it | ✓ Good — v4.0 |
| MINI-05/06 per-tile Lens icon superseded by CTRL-02 | Global controls bar is the sole Local Lens entry point; per-tile magnifying-glass accepted as design change 2026-05-14 | ✓ Good — v4.0 |
| Phase 35 Hover Modal parked | Spoke tooltips (Phase 34) + full-page compass navigation serve the information need; hover modal would conflict with tooltip layer | ✓ Good — v4.0 |
| localStorage null-check auto-enable pattern | ev:compassMode absent → auto-enable; explicit 'false' suppresses re-enable on reload — canonical pattern for both Elections.jsx and Results.jsx | ✓ Good — v4.0 |
| Cambridge Mayor as appointed council-internal (not LOCAL_EXEC) | Cambridge Mayor is elected by councillors annually — is_appointed_position=true, district_type=LOCAL; no separate election race row; prevents incorrect "Local Executive" routing | ✓ Good — v5.0 |
| Unique index on offices.politician_id dropped for Council-Manager cities | Siddiqui holds both Mayor + City Councillor office; unique index blocks this valid dual-office pattern; non-unique index created for join performance | ✓ Good — v5.0 |
| MA TIGER G4110 for 58 incorporated cities; G4040 COUSUB deferred | 58 MA cities use G4110 in TIGER; 293 towns use G4040 COUSUB — towns deferred to v5.1+ Phase 48; MTFCC pre-flight assertion pattern established | ✓ Good — v5.0 |
| Phase 43 (2025 Cambridge elections) N/A by design | UI shows upcoming elections only; 2025 historical results have no user-facing impact; scope folded into Phase 44 | ✓ Good — v5.0 |
| Cambridge headshot license = press_use for all | cambridgema.gov + cpsd.us official bio photos are press/government-use photos, not public domain works — attribution required | ✓ Good — v5.0 |
| election_method is TEXT on essentials.chambers | Added via migration 157; no pg_constraint — future plans must not query pg_constraint to discover valid values | ✓ Good — v5.0 |
| governments INSERT uses WHERE NOT EXISTS (not ON CONFLICT) | essentials.governments has no unique constraint on geo_id — ON CONFLICT (geo_id) would fail; WHERE NOT EXISTS is the only idempotent pattern | ✓ Good — v5.0 |
| TIGER loader key must be verified per state — `cd119` not `cd` for Maine | Loader key comes from zip filename in TIGER2024/CD/; wrong key = silent no-op; always browse census.gov directory first | ✓ Good — v6.0 |
| `districts.state` casing: lowercase for STATE/COUNTY, UPPERCASE for NATIONAL | Casing determines which queries match; set by loader `abbrev` vs `abbrevUpper` variables; spot-check after every state load | ✓ Good — v6.0 |
| Legislature-elected offices = `is_appointed_position=true`, zero race rows | AG/SoS/Treasurer in Maine elected by legislature, not voters — creating race rows would be incorrect; always research state constitution | ✓ Good — v6.0 |
| NATIONAL_UPPER senator uniqueness key = `(district_id, politician_id)` | `(district_id, chamber_id)` blocks 2nd senator INSERT (both senators share one district); politician_id is the correct discriminator | ✓ Good — v6.0 |
| House headshot thumbnails upscaled from 152×202 to 600×750 | mainelegislature.org only provides thumbnails; upscaling with Lanczos acceptable for government-style headshots; user sign-off required | ✓ Good — v6.0 |
| Multi-tier city seeding: skeletal INSERT then UPDATE by (chamber_id, title) | No seat_label column on essentials.offices; UPDATE pattern matches on chamber+title to link politician_id to existing office rows | ✓ Good — v6.0 |
| STATE_EXEC `districts.state` must be uppercase 'OR' not 'or' | Casing rule: STATE/COUNTY tiers use lowercase in TIGER loader but STATE_EXEC is manually inserted — must match uppercase postal code that backend queries use; lowercase causes silent exclusion | ✓ Good — v7.0 (Phase 74 lesson) |
| STATE_EXEC `district_id` should be empty string for shared multi-position districts | OR STATE_EXEC initially used 'Oregon (Statewide)' as district_id; MA/ME/TX multi-position pattern uses ''; corrected in migration 223a | ✓ Good — v7.0 (Phase 74 lesson) |
| groupHierarchy.js Rule 3.5: chamber_name fallback in getSubGroupLabel() | School board cards rendered with no subtitle when qualifyLocalTitle() returns empty; fallback ensures chamber label always appears | ✓ Good — v10.0 (Phase 88 gap) |
| SFUSD office title 'Commissioner'; BUSD office title 'Director' | Each school board uses its own official term; never assume 'Board Member' — always verify from official district page | ✓ Good — v10.0 (Phase 87) |
| ENCLAVE_CITY_ALIASES backend env var for Maywood Park | Small enclave cities surrounded by Portland (TIGER G4110 boundary exists) need explicit alias to override larger-city geofence match | ✓ Good — v10.0 (Phase 84) |
| G5420 TIGER UNSD school district pattern: 4 state loaders established | TIGER UNSD zip per state → filter to target GEOIDs → G5420 geofence_boundaries → district_type='SCHOOL' districts → chamber + officials; pattern repeatable for any future school board | ✓ Good — v10.0 |

---
*Last updated: 2026-06-18 — v16.0 Utah Coverage milestone closed (formalized retroactively)*
