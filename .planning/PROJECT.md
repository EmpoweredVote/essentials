# Essentials — Empowered Vote

## What This Is

Essentials is a civic engagement web app that helps people discover who represents them and who is running in upcoming elections. It covers Monroe County, IN, Los Angeles County, CA (12-city LA-area stance coverage), Collin County, TX, Cambridge + 14 more Massachusetts cities, all of Maine, all of California (7 deep-seeded cities), all of Oregon (Portland deep seed), Multnomah County, OR including 22 school districts across 4 states, all of Maryland (St. Mary's County + Leonardtown deep seed), Virginia (Alexandria deep seed), and Utah (all 10 largest cities deep-seeded + full 104-member state legislature with compass stances). It works fully for anonymous users (Inform tier) and provides enhanced jurisdiction-aware experiences for Connected accounts. A dedicated Elections page at `/elections` gives any user instant access to their local ballot. Candidate data is populated by a Claude-powered discovery pipeline. The political compass includes 10 LOCAL-scope topics and 8 JUDICIAL-scope topics, with scope filtering so each politician type sees only relevant questions. Legal candidate profiles surface bar evaluation data (LACBA ratings, CJP discipline), judicial compass stances, and legal donor activity — all from free/public sources. A cold-start playbook (`LOCATION-ONBOARDING.md` + 6 templates) documents how to onboard any US city from scratch.

## Core Value

A resident can look up who represents them — and who is on their ballot — without creating an account.

## Current State

**Shipped v24.0 Results-Page Search & Header Overhaul (2026-07-23).** The cluttered multi-row results
header is replaced by one always-editable `<LocationCombobox>` that silently classifies address /
bare place-name / decimal-coordinate input and routes to the right resolver. The milestone "owns the
search stack": Google Places is fully retired in favor of a backend DB place-name resolver (pg_trgm
over `governments`/`geofence_boundaries` + a nationwide Census Gazetteer ingest) and a new anonymous,
stateless `POST /api/essentials/coordinate-lookup` endpoint — with a national fallback guaranteeing at
least US Senators + Governor/state execs + county officials anywhere in the US. The header also
declutters: the type filter defaults to Elected (Judges keep Appointed so that tab is never emptied),
compass lenses became accessible icon buttons with name + plain-language focus-summary tooltips, and
the redundant name-search box is gone. Phase 216 added the "Unincorporated {County}, {ST}" locality
label. Bare place-name labels ("Bloomington, IN") and the lens-tooltip summaries were the final polish.
Spans essentials (frontend) + accounts-api (backend). See the v24.0 block + `milestones/v24.0-*`.

**Shipped v23.0 Educators & Judges Tabs (2026-07-20).** The results/officials view now carries
**Educators** (school-board) and **Judges** as first-class, compass-integrated tabs beside
**Representatives** and **Elections**. A single-source `classifyBucket` engine partitions every
office-holder into representative/educator/judge from existing chamber/office/geo-type data; school-board
and judicial office-holders are pulled out of the Representatives list (fixing the LA school-board
sprawl), empty tabs hide entirely, and the default compass lens shifts per tab (Judges → Judicial,
Educators → Education-scaffolding with honest best-available fallback, Reps → Best Match) with explicit
picks remembered per tab. A deep-dive stance pass gave Trump / Vance / Rubio full, 100%-cited compasses.
Frontend/data only — no new geographic/seeding data. Phase 209 (Education lens authoring) was deferred
by design. See the v23.0 block below + `milestones/v23.0-*`.

**Shipped v22.0 Tucson & Arizona (2026-07-23).** Arizona opened as a fully-covered new state (TIGER
geofences → state/federal government → 90-member legislature) with Tucson-metro (Pima County + Tucson +
Oro Valley + Marana + Sahuarita + South Tucson) and Coachella Valley (Riverside County + Palm Springs +
Indio) deep-seeded end-to-end, plus AZ 2026 race discovery (82 shells). Formally closed on its shipped
scope (Phases 190–203). **One follow-up is scheduled, not done:** the AZ 2026 candidate reconcile
(Phase 206) + the Sahuarita/South Tucson (197/198) title reconcile are deferred to a **post-Aug-6**
pass — the primary held 2026-07-21 doesn't certify until the ~Aug-6 state canvass, so seeding nominees
now would write data that can still change through Aug 11. Phase 206's RESEARCH.md + CONTEXT.md are
written and execution-ready. See the v22.0 block below + `milestones/v22.0-*`.

## Current Focus

**v24.0 and v22.0 both closed 2026-07-23.** No milestone is currently active — next is planning the
next one. The one concrete scheduled follow-up is the **post-Aug-6 AZ 2026 candidate reconcile**
(Phase 206, roster-only, no stances) once the state canvass certifies nominees.

<details>
<summary>v24.0 Results-Page Search & Header Overhaul — goal & target features (shipped)</summary>

**Goal:** Replace the cluttered multi-row results header with a single compact, always-editable location search so anyone in the US can reach a location profile from an address, a city/state/county, or coordinates — with a national fallback to state + federal officials — while decluttering the type filter and compass controls.

**Target features:**
- **Unified location search** — one field, pre-filled + click-to-edit; accepts full address / city-state-county / lat-lng → routes to the correct location profile
- **National fallback** — any resolvable US input returns at least state + federal (Senate/House) officials
- **Own the search stack** — drop Google Places entirely; our own typeahead (DB place-names + curated catalog) + free US Census geocoder + a new backend name resolver + a coordinate lookup endpoint; no third-party ads/branding on our forms
- **Type filter** — default Elected, remove the All/Appointed dropdown, *except* keep appointed on the Judges tab
- **Compass lenses → icon buttons + tooltips** (gavel for Judicial); reclaim the header's "unorganized space"
- **Remove "Search by name"** results filter (for now)

Spans essentials (frontend) + accounts-api (backend), both auto-deploy from their default branch on Render. Continues phase numbering after v23.0's Phase 211.

**Outcome:** All six target features shipped and live-verified (Phases 212–216). Backend search stack (place-name resolver + national fallback + anonymous coordinate lookup) landed first on accounts-api; the shared `<LocationCombobox>` + Google Places removal followed on essentials; header declutter (Elected default, icon lenses, name-search removal) and the unincorporated-locality label completed the set.

</details>

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Backend place-name resolver + national fallback — `searchPlaceNames()` pg_trgm over `governments`/`geofence_boundaries` + nationwide Census Gazetteer, ranked/disambiguated candidates, wrong-state guard, `/resolve` floor (US Senators + Governor/state execs + county + single-CD House when determinable) — v24.0 (RSLV-01/02/04/05/06/07)
- ✓ Anonymous coordinate-lookup endpoint — `POST /api/essentials/coordinate-lookup`, PostGIS `ST_Covers`, US bbox + swap-guard, zero auth/writes/coordinate-echo — v24.0 (RSLV-03)
- ✓ Unified location combobox + Google Places removal — one shared WAI-ARIA `<LocationCombobox>` on Results + Landing classifying address/place-name/coordinate input; `@googlemaps/js-api-loader` fully retired — v24.0 (SRCH-01/02/03/04/05/06/08)
- ✓ Header declutter — type filter defaults to Elected (Judges keep Appointed, never emptied), compass lenses as accessible icon buttons with name + focus-summary tooltips (gavel for Judicial), "Search by name" filter removed — v24.0 (SRCH-07, HDR-01/02/03)
- ✓ Unincorporated locality label — results banner reads "Unincorporated {County}, {ST}" for a point outside any incorporated place, gated to the 11 place-loaded states — v24.0 (LOC-01/02/03/04)
- ✓ Bare place-name labels — resolver labels read "Bloomington, IN" (not "City of Bloomington, Indiana, US, IN") via `cleanPlaceName()` — v24.0 (close-time polish)
- ✓ Arizona new-state coverage — TIGER geofences + state/federal government + 90-member legislature, so any AZ address routes to its federal/state/county/city reps — v22.0 (AZ-GEO-01, AZ-STATE-01/02, AZ-LEG-01)
- ✓ Tucson-metro + Coachella Valley deep-seeds — Pima County + Tucson + Oro Valley + Marana + Sahuarita + South Tucson + Riverside County + Palm Springs + Indio, each with roster + headshots + evidence-only compass + licensed community banner — v22.0
- ✓ AZ 2026 election race discovery — 82 Nov-2026 race shells seeded (nominee reconcile deferred to a post-Aug-6 pass, Phase 206) — v22.0 (AZ-ELEC-01, discovery portion)
- ✓ Officials classification engine — single-source `classifyBucket(pol)` buckets every office-holder as Representative / Educator / Judge from existing chamber/office/geo-type data (additive-only overrides; null-safe; verified across 3 real locations) — v23.0 (CLASS-01)
- ✓ Educators & Judges tabs — school-board and judicial office-holders pulled into their own compass-integrated tabs beside Representatives & Elections, Representatives decluttered, empty tabs hidden, stale-`?view=` fallback to Representatives — v23.0 (TAB-01/02/03)
- ✓ Per-tab compass integration — Compass works identically in Educators/Judges tabs; default lens shifts per tab (Judges → Judicial, Educators → Education-scaffolding/best-available fallback, Reps → Best Match); explicit pick overrides + remembered per tab, resets on reload — v23.0 (CMP-01/02)
- ✓ Deep-dive federal stances — Trump / Vance / Rubio full-compass, 100%-cited, no-defaults, honest blank spokes; all three compasses render live — v23.0 (RES-01)
- ✓ Tethered feature-icon row on section banners — per-tier Treasury deep-links carrying the banner's own location, accessible hover/focus tooltip, context-aware (no dead links / no greyed placeholders) — v21.0 (ICON-01/02/03, TETH-01/02/03/04)
- ✓ Census-sourced population strip on city/state banners — build-time ACS5 bundle keyed to FIPS/geo identifier, pure `resolvePopulation` with graceful null-on-miss omission — v21.0 (STAT-01/02/03)
- ✓ Shared smart-banner integration — `buildBannerProps` single source of truth consumed identically by Results + Elections across all three tiers; empty-state parity with v19.0 (no empty containers, layout shift, or console errors) — v21.0 (SBAN-01/02/03/04)
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

### v21.0 Smart Banners (Shipped: 2026-07-08)

**Delivered:** Filled v19.0's two deliberately-inert `SectionBanner` scaffolding slots (`featureIcons`
+ `stats`), turning every section banner into a location-aware hub — frontend-only, no backend/DB
changes. **Phase 187:** per-tier Treasury deep-link resolvers (`findMatchingMunicipality` /
`findStateTreasuryEntity` / `findFederalTreasuryEntity`) that build a `financials.empowered.vote/?entity=<name-state>`
link carrying the banner's own location, surfaced as a bottom-right chip with an @floating-ui
hover/focus tooltip, omitted entirely on no-match. **Phase 188:** a build-time Census ACS5-2023
generator (`scripts/gen-population.mjs`) producing a committed FIPS-keyed population bundle
(~32K places + 52 states/territories + national), a pure `resolvePopulation` resolver with an
injectable maps seam + 13-case Vitest matrix, and a top-right population scrim gated by
`shouldRenderStat` (clean omission on any miss). **Phase 189:** a `buildBannerProps` helper unifying
all 6 hand-assembled `<SectionBanner>` call sites into uniform one-liners across Results + Elections,
closing the last page-specific divergence, verified PASS 8/8 (operator-approved live) including
empty-state parity with v19.0. 3 phases (187–189), 8 plans, 14/14 requirements. See
`.planning/milestones/v21.0-ROADMAP.md`.

### v12.0 Virginia Essentials (Shipped: 2026-06-10)

**Delivered:** VA TIGER geofences (511 geofence_boundaries rows across 5 MTFCC types), state government DB (3 executives + 40 senators + 100 delegates), VA federal officials (Warner + Kaine + 11 US House reps), Alexandria deep seed (Mayor + 6 city council + ACPS 9 board members with headshots), VA 2026 elections (12 race rows + discovery), compass stances for 3 execs + 2 US Senators + 7 Alexandria council + 8 ACPS board members.

### v13.0 Massachusetts Expanded (Shipped: 2026-06-13)

**Delivered:** MA town geofences (293 G4040 COUSUB boundaries), Boston deep seed (Mayor Wu + 13 City Councillors + School Committee with headshots), MA Tier 2 cities (Worcester + Springfield + Lowell + Brockton + Quincy), MA 2026 elections (240+ race rows + discovery armed), compass stances for all 217 MA officials (6 execs + 11 federal + 40 senators + 160 house reps), and MA playbook retrospective.

### v19.0 Essentials Dark-Mode Redesign & Section Banners (Shipped: 2026-06-28 · closed 2026-07-05)

**Delivered:** Frontend-only detour — adopted the Figma dark-mode design across Results/Representatives +
Elections and replaced Local/State/National tier sort buttons with scrollable, location-aware
`SectionBanner` dividers between City → State → Federal (Aditi's Bloomington treatment) as a reusable,
data-ready system. Figma dark tokens migrated to `src/index.css` `@theme` (single source of truth,
GitHub-dark palette); reusable `SectionBanner` + continuous scroll + sort-button removal; banner asset
pipeline (`docs/banner-asset-pipeline.md` + `scripts/banners/`) with 2 exemplar sets (Bloomington/IN/US +
LA/CA/US); Elections parity. **4 phases (169–172), 9 plans, 11/11 requirements**; frontend-only, no
backend/DB changes. Build 2026-06-25 → 06-28 (verified + deployed); formal close 2026-07-05. Deferred (out
of scope): live banner stats, feature-icon links, remaining-state art, Landing/profile dark mode. See
`.planning/milestones/v19.0-MILESTONE-AUDIT.md`.

### v20.0 West-Metro Washington County, OR (Shipped: 2026-07-05)

**Delivered:** The Washington County / west-metro Portland local layer deep-seeded onto Oregon's existing
state foundation — west-metro school-district G5420 geofences (Phase 174) → Washington County Board of
Commissioners (standalone county, geo_id 41067) → 7 city deep-seeds (Beaverton flagship, Hillsboro, Tigard,
Tualatin, Forest Grove, Sherwood, Cornelius) → 5 school-district boards (roster + headshots, 0 compass by
design) → 2026 elections + confirmed candidate slate + armed discovery → playbook retrospective + close.
**80 seated officials, 79/80 headshots, 391 city/county stance rows, 50/51 city/county officials with
evidence-only stances; 25 race rows + 12 candidates/8 races + 8 discovery jurisdictions + 1 live run.** All
8 city/county jurisdictions carry the DB-honest purple chip; 5 school districts plain + search-only.
13 phases (174–186). See `.planning/milestones/v20.0-MILESTONE-AUDIT.md`.

### v18.0 Las Vegas & Clark County, NV (Shipped: 2026-06-30)

**Delivered:** Nevada opened as a fully-covered new state — TIGER geofences → State of Nevada government
(Governor + constitutional officers + federal delegation) → 63 state legislators (seed + headshots) →
Clark County Commission + 4 Clark County metro cities (Las Vegas, Henderson, North Las Vegas, Boulder
City) + CCSD Board of Trustees deep-seeded → NV 2026 elections + discovery armed → milestone close.
40 metro officials, 36/40 headshots, 133 metro stance rows, 5/6 purple chip, 0 split-section defects.
11 data phases (158–168) + close-out 173. See `.planning/v18.0-MILESTONE-AUDIT.md`.

### v17.0 LA County City Coverage — Wave 2 (Shipped: 2026-06-22)

**Delivered:** 15 LA County cities deep-seeded end-to-end (government + roster → 600×750 headshots →
evidence-only compass stances) and surfaced on the Landing page — Long Beach, Santa Clarita, Glendale,
Lancaster, Palmdale, Pomona, Torrance, Pasadena, Downey, El Monte, West Covina, Inglewood, Burbank,
Norwalk, Bellflower. 92 officials, 91/92 headshots, 445 stance rows; all 15 carry the purple chip.
Reconcile-heavy wave (duplicate-chamber merges, At-Large→by-district relabels, June-2026 reseating).
16 phases (142–156 one-per-city + 157 close-out). See `.planning/v17.0-MILESTONE-AUDIT.md`.

### Active

- **Education lens authoring (deferred from v23.0 / Phase 209 — EDU-01/EDU-02):** author the ~8
  Education-lens compass topics (book bans, religious texts in public schools, trans athletes,
  curriculum standards, school choice/vouchers, …) with their 1–5 answer chairs, seeded as live compass
  topics so the Educators-tab lens lights via the existing data-only path (no code change). Blocked on
  educator stance research + defined spectrum values; the Educators tab already degrades gracefully to
  Custom overlap until this lands.
- **AZ 2026 candidate reconcile (Phase 206, deferred from v22.0 → post-Aug-6):** seed the certified
  Nov-2026 general-election nominees onto the 73 empty AZ race shells (roster-only, NO stances); fold in
  the Sahuarita/South Tucson (197/198) title reconcile. Gated on the ~Aug-6 state canvass (primary held
  2026-07-21; challenge window closes Aug 11). RESEARCH.md + CONTEXT.md written and execution-ready.
- **Candidate for a next milestone — reciprocal + richer smart banners (deferred from v21.0):** reciprocal
  tethering (the Essentials icon on *other* EV apps' banners), per-location Compass / Read & Rank contracts
  once those apps accept a location URL, richer per-tier stats beyond population, and promoting the
  `buildBannerProps`/`SectionBanner` smart-banner component into `@empoweredvote/ev-ui`.
- **Still-deferred v19.0 frontend track:** banner art for the ~10 remaining covered states, and
  Landing + politician-profile dark-mode treatment.
- Carry-forward (not blocking): split-section cleanup for 5 NON-Wave-2 councils (Whittier/Compton/Carson/
  South El Monte/South Pasadena); groupHierarchy.js Mayor>MPT fix deploy pending; Lancaster Ken Mann headshot;
  SLC D4 Napier-Pearce portrait + stances; Beverly Hills ~July-7 council reorg.

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
| Banner deep-links carry the banner's OWN location, never the user's | Opposite of the `ev-context` broker's "inherit current location" — the Texas banner must link to Texas Treasury, the Plano banner to Plano; verified against a banner whose location differs from the user's | ✓ Good — v21.0 (TETH-01) |
| Context-aware icon visibility (omit, never grey out) | An icon renders only when a valid per-location deep-link can be built; no dead links, no disabled/greyed placeholders — reuses `treasury.js` has-data predicate, extended to state-GF/federal tiers | ✓ Good — v21.0 (TETH-03/04) |
| Census population as a committed build-time bundle, not a runtime fetch | `scripts/gen-population.mjs` pulls ACS5-2023 once into `src/data/population.js` (FIPS-keyed, ~32K places); frontend does a pure lookup — no per-render API call, no runtime failure surface; `STATE_FIPS_TO_ABBREV` exported as single source of truth | ✓ Good — v21.0 (STAT-02) |
| `resolvePopulation` null-on-any-miss with an injectable maps seam | Pure resolver returns null on any lookup miss so `shouldRenderStat` omits cleanly (no zeros/undefined/broken labels); the maps seam makes it fixture-testable (13-case Vitest matrix) | ✓ Good — v21.0 (STAT-03) |
| `buildBannerProps(tier, ctx)` as the single banner-prop assembly point | Replaced 6 hand-assembled `<SectionBanner>` call sites (3 per page) with uniform one-liners; folds locationName construction in too — closes SBAN-03 (single source of truth) and eliminates Results/Elections divergence, promotable to `@empoweredvote/ev-ui` | ✓ Good — v21.0 (SBAN-03) |
| Population stat repositioned mid-left (supersedes 188's top-right D-11) | Mid-left placement avoids collision with both the location title and the bottom-right feature-icon chip; decided in Phase 189 after both slots coexisted | ✓ Good — v21.0 (D-05) |
| Bare place-name queries never touch the Census address geocoder | Census one-line geocoder is an address matcher, not a places API; place/county/state classification is the DB resolver's job — keeps wrong-state guarantees intact | ✓ Good — v24.0 (RSLV) |
| Disambiguation always returns a ranked, state-qualified candidate list — never a silent best guess | Direct regression guard against two prior wrong-state-officials incidents; same-named cities and city/county collisions surface every match | ✓ Good — v24.0 (RSLV-07) |
| Anonymous coordinate lookup is stateless — zero auth, zero writes, no coordinate echo/log | Privacy contract: a raw lat/lng must never be persisted or reflected; response is officials-only | ✓ Good — v24.0 (RSLV-03) |
| Elected-default + Judges-appointed-exception ship together, atomically | Defaulting to Elected without the Judges exception would silently empty the Judges tab; per-bucket TAB_TYPE_DEFAULTS constants filter each hierarchy independently (no shared state) | ✓ Good — v24.0 (HDR-01/02) |
| `cleanPlaceName()` normalizes both source name shapes at label-build time | Curated `governments.name` ("City of Bloomington, Indiana, US") and Census gazetteer names ("Bloomington city") both over-qualify; strip in the resolver so the label reads "Bloomington, IN" everywhere (combobox/banner/heading read one `browse_label`); County/Township/Unified + mid-name capitals ("Kansas City") preserved | ✓ Good — v24.0 (close-time) |
| Lens tooltip = lens name + plain-language focus summary (frontend copy map) | The API description alone ("8 questions for judicial and DA candidates") reads as jargon; a keyed `LENS_SUMMARIES` map gives "Judicial Lens — How judges & DAs approach the law", falling back to the API description for unknown keys | ✓ Good — v24.0 (close-time) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-23 — **v24.0 Results-Page Search & Header Overhaul SHIPPED (Phases 212–216).**
One always-editable `<LocationCombobox>` classifies address / place-name / coordinate input; the backend
"owns the search stack" (pg_trgm place-name resolver + nationwide Census Gazetteer + national fallback +
anonymous stateless coordinate-lookup endpoint), Google Places fully retired. Header decluttered: Elected
default with the Judges-appointed exception, compass lenses as icon buttons with name + focus-summary
tooltips, name-search removed. Phase 216 added the "Unincorporated {County}, {ST}" label; close-time polish
gave bare place-name labels ("Bloomington, IN") and the lens-tooltip summaries. All phases verified passed;
override_closeout with 12 pre-existing items deferred (STATE.md → Deferred Items). **v22.0 Tucson &
Arizona also formally closed 2026-07-23** on its shipped scope (190–203) — the AZ 2026 candidate
reconcile (Phase 206) + 197/198 title reconcile are the one scheduled follow-up, gated on the ~Aug-6 AZ
certification. No milestone is currently active; next is planning the next one.*

<details>
<summary>Earlier footer — v23.0 close (2026-07-20)</summary>

*v23.0 Educators & Judges Tabs SHIPPED. Educators (school-board) and Judges are now first-class,
compass-integrated tabs beside Representatives & Elections, driven by a single-source `classifyBucket`
engine; Representatives decluttered, empty tabs hidden, default compass lens shifts per tab, and
Trump/Vance/Rubio carry full 100%-cited compasses. Frontend/data only. In-scope requirements 7/7 satisfied
(CLASS-01, TAB-01/02/03, CMP-01/02, RES-01); EDU-01/02 (Education lens authoring, Phase 209) deferred by
design. Archived to `milestones/v23.0-*` and tagged v23.0.*

</details>

<details>
<summary>Earlier footer — v23.0 opened (2026-07-17)</summary>

*v23.0 Educators & Judges Tabs OPENED (2026-07-17). Feature milestone: add Educators (school-board leads)
and Judges as first-class, compass-integrated tabs beside Representatives & Elections, filtering those
office-holders out of the Representatives list, greying out where no data exists, and shifting the default
compass lens per tab. Includes a deep-dive full-compass evidence-cited stance research phase for Trump,
Vance & Rubio. Ran alongside the held v22.0 close.*

</details>

<details>
<summary>Earlier footer — v22.0 open (2026-07-08)</summary>

*v22.0 Tucson & Arizona OPENED. New-state coverage milestone: Arizona foundation (TIGER geofences +
Hobbs/constitutional officers + 2 US Senators + 9 US House + 90-member legislature seed & headshots,
stances deferred) → Pima County Board of Supervisors → City of Tucson flagship deep-seed → 4 Tucson-metro
suburbs (Oro Valley, Marana, Sahuarita, South Tucson) → AZ 2026 elections + discovery → playbook
retrospective + close. Phases continue from v21.0 (closed at 189), starting at 190.*

</details>

<details>
<summary>Earlier footer — v21.0 close (2026-07-08)</summary>

*v21.0 Smart Banners SHIPPED & ARCHIVED.* Section banners are now
location-aware hubs across Results + Elections: tethered Treasury deep-links carrying each banner's
own location (context-aware, no dead links), a Census-sourced population strip (build-time FIPS bundle,
graceful null-on-miss), and a shared `buildBannerProps` single source of truth — all verified PASS 8/8
with live operator sign-off and empty-state parity with v19.0. 3 phases (187–189), 8 plans, 14/14
requirements, frontend-only. Archived to `milestones/v21.0-{ROADMAP,REQUIREMENTS}.md`. 12 pre-acknowledged
cross-milestone artifacts remain deferred (see STATE.md). No active milestone — next opens via
`/gsd-new-milestone`. Prior close: v20.0 Beaverton & Washington County, OR (2026-07-05).*

<details>
<summary>Earlier footer — v21.0 Phase 187 checkpoint (2026-07-07)</summary>

*v21.0 Phase 187 (Tethered Feature-Icon Row) COMPLETE (2/2 plans, verified 11/11 must-haves; human-approved checkpoint). Every section banner now shows a bottom-right Treasury chip deep-linking the banner's OWN location into financials.empowered.vote (TETH-01), with an accessible hover+focus tooltip and no chip when no per-location dataset exists (TETH-03). Requirements ICON-01/02/03 + TETH-01/02/03/04 satisfied. Next: Phase 188 (Location Stats Strip). **v21.0 Smart Banners OPENED** (phases start at 187). Turns SectionBanner into a location-aware hub: tethered product-icon row (deep-links each banner's own location into other EV products, context-aware) + Census stats strip; fills v19.0's `stats`/`featureIcons` scaffolding slots; Essentials-only reusable component. Treasury contract = financials.empowered.vote/?entity=<name-state>. Prior: **v20.0 Beaverton & Washington County, OR SHIPPED** (Phase 186 close-out complete). Final DB-verified state: Washington County + 7 west-metro cities + 5 school-district boards; 80 seated officials, 79/80 headshots, 50/51 city/county officials with evidence-only stances (391 rows), school boards deferred by design; 2026 layer = 25 races + 12 candidates/8 races + 8 discovery jurisdictions + 1 live discovery run. Coverage.js reconciled (all 8 city/county purple chips DB-honest, no edits), LOCATION-ONBOARDING.md playbook updated (13 Cities Onboarded rows + West-Metro Quick Reference), v20.0-MILESTONE-AUDIT.md written. Non-blocking follow-ups: Cornelius thin stances, FG SD-15 headshot gap, 2 new-challenger headshots, ongoing 2026 candidate discovery. Next: v19.0 Dark-Mode Redesign remains parked (169–172), or open a new milestone; v18.0 NV shipped*

</details>

</details>
