# Milestones

## v8.0 Oregon (Shipped: 2026-05-31)

**Delivered:** Full Oregon state coverage — TIGER geofences, government structure with 5 voter-elected constitutional officers, 90 state legislators with headshots from oregonlegislature.gov, Portland deep seed (2024 charter reform: 4-district × 3-seat RCV council), OR 2026 elections + discovery pipeline (105 race rows), 321 compass stances across 24 OR officials, and OR-specific GOTCHAs documented in the playbook.

**Phases completed:** 72-81 + 77.1 inserted (25 plans total)

**Key accomplishments:**

- Oregon TIGER boundaries loaded — 241 G4110 cities + 6 CD (cd119 key) + 30 SLDU + 60 SLDL + 36 G4020 counties; Portland geo_id=4159000 confirmed; any OR address routes to correct federal, state, and local representatives (Phase 72)
- OR state government scaffolded — 5 voter-elected constitutional officers (Kotek, Rayfield, Read, Steiner, Stephenson), 2 US Senators (Wyden + Merkley), 6 US House reps; all 13 with headshots (Phases 73-74)
- 30 OR state senators + 60 OR house reps seeded with offices linked to STATE districts; 90/90 headshots from oregonlegislature.gov; Portland City Hall → Lisa Reynolds (SD-17) + Shannon Isadore (HD-33) end-to-end (Phase 75)
- Portland deep seed — 2024 charter reform: 4 multi-member council districts (3 seats each, RCV), Mayor Wilson + 12 council + City Auditor Rede + 2 appointed officials; council district boundaries from PortlandMaps ArcGIS (not TIGER); 14 headshots from portland.gov 1_1_320w URLs; Phase 77.1 fixed is_appointed=true omission (Phases 76-77, 77.1)
- OR 2026 elections + discovery pipeline — 105 race rows (Governor + Senate + 6 US House + 30 OR Senate + 60 OR House + 7 Portland City); discovery_jurisdictions for OR statewide + Portland (Phases 79)
- 321 compass stances across 24 OR officials — Kotek 31, Rayfield 24, Bonamici 24, Bentz 21, Hoyle 20; all cited from public record; compass renders on Kotek profile (Phase 80)
- OR Playbook retrospective — 9 OR-specific GOTCHAs (Portland charter reform, per-OBJECTID ArcGIS load, PowerShell Unicode encoding), Oregon Quick Reference block, 2 new Cities Onboarded rows (Phase 81)

**Stats:**

- 10 phases (+ 1 inserted: 77.1), 25 plans
- 9 days (2026-05-28 → 2026-05-31) active; geofences prepared 2026-05-28
- Next migration: 242

**Acknowledged at close:** Phase 75 audit trail gap (6-profile visual spot-check not formally recorded; DB state verified correct). GAP-1 (is_appointed=false on Lee III/Taylor) resolved by Phase 77.1 before close.

**Archive:** [milestones/v8.0-ROADMAP.md](milestones/v8.0-ROADMAP.md) | Audit: [milestones/v8.0-MILESTONE-AUDIT.md](milestones/v8.0-MILESTONE-AUDIT.md)

---

## v7.0 California (Shipped: 2026-05-29)

**Delivered:** Full California state coverage — TIGER geofences for all tiers + LAUSD school board, State of California government DB (8 constitutional officers + 120 state legislators + 54 federal officials), LA backlog closure, 6 CA city deep seeds at full Tier 1 depth (SF/SJ/SD/SAC/Fremont/Berkeley), CA 2026 elections + discovery pipeline armed, 965 compass stances across 68 CA officials, and CA-specific GOTCHAs documented in the playbook.

**Phases completed:** 57-70, 78 (~~71 folded into 78~~) — 42 plans total

**Key accomplishments:**

- California TIGER boundaries loaded — 482 G4110 cities + 404 G4040 CCDs + 80 SLDU + 40 SLDL + 52 CD + 58 G4020 counties; SF consolidated city-county + East LA unincorporated routing confirmed; LAUSD 7 board district geofences (mtfcc=G5420) (Phases 57-58)
- State of California government DB — 8 constitutional officers (deduped from pre-existing seed), 40 CA senators + 80 assembly members with offices linked to STATE districts, 2 US Senators + 52 US House reps; all 174 officials with headshots at 600×750 (Phases 59-61)
- LA backlog closed — CA Governor 2026 race (all SOS-verified challenger candidates), lavote.gov election ID current, 7 LAUSD board members seeded with headshots, LA city structure gaps resolved (Phase 62)
- 6 CA city deep seeds — SF (20 officials, DataSF Socrata, RCV), San Jose (11 officials, ArcGIS DISTRICTINT, RCV), San Diego (11 officials, WKID 2230), Sacramento (9 officials, AEM/CQ5 curl+grep), Fremont (7 officials, 403 workaround), Berkeley (10 officials, Socrata, RCV); all cities with council district geofences + headshots (Phases 63-68)
- CA 2026 elections + discovery — 2 election rows, Governor race + 52 US House races, lavote.gov discovery row, 7 city discovery_jurisdictions rows; all cron_active (Phase 69)
- 965 compass stances across 68 CA officials — SF 366, San Diego 164, Berkeley 126, San Jose 133, Sacramento 120, Fremont 56; all cited from public record (Phase 70)
- CA Playbook retrospective — 11 CA-specific GOTCHAs (charter vs general law cities, RCV jurisdictions, AEM/CQ5 headshot pattern, lavote.gov election ID cycle, LAUSD sub-district pattern), California Quick Reference block, 7 new Cities Onboarded rows (Phase 78)

**Stats:**

- 14 active phases (+ 1 folded: 71), 42 plans
- 8 days active (2026-05-21 → 2026-05-29)
- Next migration: 242 (v8.0 started immediately after)

**Archive:** [milestones/v7.0-ROADMAP.md](milestones/v7.0-ROADMAP.md) | Requirements: [milestones/v7.0-REQUIREMENTS.md](milestones/v7.0-REQUIREMENTS.md)

---

## v6.0 Maine Essentials (Shipped: 2026-05-20)

**Delivered:** Full Maine state coverage — geofences, government structure, executives, 186 state legislators with headshots, Portland deep seed + Tier 2 city incumbents, 380 race rows for 2026 elections with discovery cron armed, and a playbook retrospective that captured 9 Maine GOTCHAs into LOCATION-ONBOARDING.md + 5 updated templates.

**Phases completed:** 49-56 (20 plans total)

**Key accomplishments:**

- Maine TIGER boundaries loaded — 23 cities (G4110) + 2 CD + 35 SLDU + 151 SLDL + 16 counties; any ME address correctly routes to federal, state, and city representatives (Phase 49)
- State of Maine government scaffolded — 6 chambers, 4 executive constitutional officers (Governor Mills + legislature-elected AG/SoS/Treasurer), 2 US Senators (Collins + King), 2 US House reps (Pingree ME-01 + Golden ME-02); all 8 with headshots (Phases 50-51)
- 35 ME state senators + 151 ME house reps seeded with offices + 185 headshots (100% coverage; house thumbnails upscaled from 152×202 with user sign-off) (Phase 52)
- Portland Tier 1 deep seed — 18 officials (Mayor + 9 Council + 4 School Board + Auditor + City Manager + City Clerk), RCV chambers, headshots, Landing.jsx entry (Phase 53)
- Tier 2 city incumbents — Lewiston (8), Bangor (9), South Portland (7), Auburn (8), Biddeford (10); 18 skeletal cities documented as known gaps (Phase 54)
- 380 ME race rows for 2026 — Governor (13 candidates, open seat), US Senate (3 candidates, Collins incumbent), 2 US House races, 372 legislative scaffolding rows with non-null office_id; discovery cron armed for 2026-06-09 + 2026-11-03 (Phase 55)
- LOCATION-ONBOARDING.md retrofitted with 9 Maine GOTCHAs inline at correct steps + Maine in Cities Onboarded + Compass/Treasury stubs; 5 templates updated with state legislature headshots, multi-tier seeding, PowerShell generator, RCV chamber, legislature-elected = appointed (Phase 56)

**Stats:**

- 8 phases (49-56), 14 plans
- Next migration: 185 (post-June-9 ME primary winners follow-up)

**Sign-off:** Human approved Phase 56-02 verification (see .planning/phases/56-me-playbook-retrospective/56-02-VERIFICATION.md)

**What's next:** v6.1 scope TBD — candidates: post-June-9 D primary winners migration, ME G4040 COUSUB town coverage, Compass/Treasury team playbook contributions

---

## v5.0 Location Onboarding Playbook (Shipped: 2026-05-18)

**Delivered:** Built a cold-start, repeatable playbook for onboarding any US city, then proved it by taking Cambridge, MA to Indiana/LA caliber coverage — geofences, government structure, incumbents, headshots, elections, discovery pipeline, and compass stances. The playbook (LOCATION-ONBOARDING.md + 6 templates) is now generalized for any US city.

**Phases completed:** 37-47 (21 plans total; Phase 43 intentionally folded into Phase 44)

**Key accomplishments:**

- `LOCATION-ONBOARDING.md` cold-start playbook (8 steps, 6 templates, 13 Cambridge learnings with [GOTCHA] callouts) — repeatable process for onboarding any US city with no local insider knowledge; new `elections-seed.md` template captures patterns missing before v5.0
- Massachusetts state layer — 281 geofence boundaries (58 G4110 cities + 40 Senate + 160 House + 9 congressional + 14 county); 200 MA legislators + 6 executives + 11 federal officials with 17 headshots at 600×750
- Cambridge city structure — 9-seat at-large City Council (stv_proportional), School Committee, Mayor correctly modeled as council-internal appointed title (not a separately elected exec), City Manager, 16 incumbents with full contact data, Landing page entry
- Cambridge headshots — 15/16 officials at 600×750 JPEG in Supabase Storage; Luisa de Paula Santos confirmed genuine unavailability (group photo ~85px/person)
- MA 2026 elections + discovery pipeline — primary (2026-09-01) + general (2026-11-03) election rows, 10+ Cambridge-area district races, Azeem 2nd Middlesex primary explicitly seeded with politician_id linked, discovery pipeline armed (cron_active=true for geoid='25')
- Cambridge compass stances — 162 stance values for 8/9 councillors + City Manager (10 politicians), all cited from public record; compass renders correctly on councillor profiles (human-verified)

**Stats:**

- 91 files changed (17,480 insertions, 1,340 deletions)
- 10 active phases (+ 1 skipped by design), 21 plans
- 4 days (2026-05-15 → 2026-05-18)

**Git range:** `bda422b` (docs: start milestone v5.0) → `20f0d17` (docs(47): complete phase)

**What's next:** Planning next milestone — `/gsd:new-milestone`

---

## v4.0 Compass Experience (Shipped: 2026-05-14)

**Delivered:** Turned the political compass from an opt-in checkbox into the primary experience for calibrated users — mini compasses on every candidate tile, a Local Lens preset that snaps to 8 curated local topics, synchronized global Min/Max + Lens controls, and automatic compass-default mode on the Elections and Results pages.

**Phases completed:** 33-36 (7 plans total; Phase 35 Hover Modal intentionally parked)

**Key accomplishments:**

- `LOCAL_LENS_TOPICS` (8 verified UUIDs) + `toggleLocalLens()` in CompassContext with snapshot/restore and localStorage persistence — one click to filter all compasses to housing/homelessness/public safety/immigration/transportation topics
- `computeDisplaySpokes()` extracted as a shared pure function in `compass.js` — single source of truth for lens-aware bilateral spoke selection across CompassCard and MiniCompass; fallback algorithm and maxSpokes cap preserved
- `MiniCompass.jsx` — label-free `RadarChartCore` tile with portal tooltip (getScreenCTM dot hit-detection), silent absence below 3 bilateral spokes, and container opacity 0.7 when replacement spokes are present with Lens active
- Mini compass wired into Elections + Representatives candidate tiles via overlay pattern — gradient fade, per-race scope filtering, race deduplication, auto-enable for calibrated users
- `CompassControlsBar.jsx` shared component — sticky Min/Max (Heroicon SVG arrows-pointing-in/out) + Local Lens + Judicial Lens toggle bar extracted from both pages; single source of truth for controls
- Calibrated users (≥3 answers) arrive at `/elections` and Results in compass mode automatically — localStorage null-check auto-enable; explicit `'false'` suppresses re-enable; dual-tab parity verified (Elections + Reps tabs)

**Stats:**

- 32 files changed (4,919 insertions, 221 deletions)
- 3 days (2026-05-12 → 2026-05-14)
- 4 phases (3 active + 1 parked), 7 plans

**Git range:** `f4299302` (docs(33): research phase) → `fa88e8c` (docs(36): complete phase)

**What's next:** Planning next milestone — `/gsd:new-milestone`

---

## v3.0 Collin County, TX Coverage (Shipped: 2026-05-12)

**Delivered:** Populated the Essentials + Compass database for 23 Collin County, TX cities — government structures, 120+ incumbent officials across all tiers, discovery pipeline setup, headshots for Tier 1+2, compass stances where public record exists, and full TX state/federal coverage including 38 US House members and all 31 senators + 150 state reps with geofence boundaries.

**Phases completed:** 12-21 (33 plans total)

**Key accomplishments:**

- Seeded 23 Collin County TX city/town governments with complete structure (23 chambers, 151 offices, all Census FIPS codes); 120+ incumbent politicians across 4 tiers with is_active + is_incumbent flags
- Discovery pipeline armed for 23 TX cities — test run confirmed working (2 Allen Mayor candidates staged from collincountytx.gov); weekly cron at Sunday 02:00 UTC; county domain allowlist enforced
- 100% Tier 1+2 headshot coverage (57 politicians at 600×750 in Supabase Storage); Tier 3/4 best-effort — 34 confirmed online gaps user-verified as unavailable
- 26 compass stance rows for 19 Collin County politicians across 5 cities (Plano, McKinney, Allen, Frisco, Richardson); compass widget renders on all three required profiles (human-verified)
- 38 TX US House members seeded with NATIONAL_LOWER districts + Collin County G4020 geofence; PostGIS county-congressional intersection wired end-to-end — browsing Collin County shows 5 correct US reps in production
- 8 TX state/federal executives (Abbott, Patrick, Paxton, Hegar, Buckingham, Miller, Cornyn, Cruz) with chambers, offices, Wikipedia headshots — all 8 profile pages render correctly
- 31 TX senators + 150 TX state reps with 181 geofence boundaries loaded; any TX address point query returns correct STATE_UPPER + STATE_LOWER results (verified 5 addresses)

**Stats:**

- ~12,590 total LOC (JS/JSX/TS, frontend)
- 10 phases, 33 plans
- 12 days (2026-04-30 → 2026-05-12)

**Git range:** `94e4aa8` (docs(12): research phase TX DB Foundation) → `8657219` (docs(18): add phase verification — 5/5 must-haves passed)

**What's next:** Planning next milestone — `/gsd:new-milestone`

---

## v3.2 Legal Candidate Evaluation Framework (Shipped: 2026-05-10)

**Delivered:** Built civic infrastructure for evaluating judges and City Attorney/DA candidates — an 8-topic judicial compass, bar evaluation data from LACBA/CJP, stance research for 3 LA City Attorney candidates, legal donor activity display, and campaign finance gap closure — all from free/public sources.

**Phases completed:** 26-32 (17 plans total)

**Key accomplishments:**

- Built complete judicial compass DB — 8 topics, 40 stances, 'judicial' role_scope in `compass_topic_roles`; `judicial_role` column on topics enables judge vs. City Attorney/DA sub-role filtering
- JudicialCompassSection.jsx with burnt orange styling, deriveJudicialSubRole, filterJudicialTopics, and EmptyNotchRow for "Stance research in progress"; deployed to production
- Bar evaluation data surfaced — 32 LACBA ratings for LA legal candidates, 2 CJP disciplinary records for Patrick Connolly with plain-language voter-facing descriptions; BarEvaluationSection.jsx on all legal profiles
- Stance research complete for all 3 LA City Attorney candidates — 16 judicial compass stances with source citations from public record (Ashouri 6/6, McKinney 5/6, Roy 5/6)
- Legal Donor Activity — firm-level legal-professional donor data for 4 candidates via real-time contributions query; LegalDonorActivitySection.jsx deployed; no paid APIs required
- Campaign finance gap closed — 16 active LA candidates with la_socrata sources; 246 sources ingested; reusable maintenance procedure documented

**Stats:**

- 67 files created/modified (+11,268 / -200 lines)
- ~12,489 total LOC (JS/JSX/TS, frontend)
- 7 phases, 17 plans
- 4 days (2026-05-06 → 2026-05-10)

**Git range:** `ee6ede1` (docs(26): research campaign finance gap) → `edd560d` (docs(32): complete legal-profile-fixes phase)

**What's next:** v3.0 remaining — Collin County headshots (Phase 17) and compass stances ingestion for Plano/McKinney/Allen (Phase 18)

---

## v3.1 Local Compass Expansion (Shipped: 2026-05-05)

**Delivered:** Expanded the political compass with 10 new LOCAL-scope topics and 10 companion Focused Communities, and wired frontend scope filtering so city council profiles show only locally-relevant questions.

**Phases completed:** 22-25 (7 plans total)

**Key accomplishments:**

- Audited compass scope mechanism — confirmed scope lives in `compass_topic_roles` join table (not `compass_stances`); 42 existing politician answers for "Criminalization of Homelessness" → keep-both decision documented
- Added 10 new LOCAL-scope compass topics with full 5-stance metadata — 50 stance rows and 14 scope-role rows applied to production `inform` schema via Supabase migration
- Seeded 10 companion Focused Communities in `connect.communities` with authored descriptions and `fc_community_slug` backfill — all 10 live at fc.empowered.vote
- Closed Affordable Housing LOCAL scope gap — topic was missing local scope row; migration 20260505000001 added it
- Wired `districtScope` filtering in CompassCard/Profile/CandidateProfile.jsx — local politicians now see only LOCAL-applicable compass topics; cross-cutting topics correctly default to all tiers

**Stats:**

- 29 files created/modified (4,510 insertions, 49 deletions)
- 11,658 total LOC JSX/JS (frontend)
- 4 phases, 7 plans
- 2 days (2026-05-04 → 2026-05-05)

**Git range:** `e2332c1` (docs: start milestone v3.1) → `63512af` (docs(25): complete scope-audit-retirement phase)

**What's next:** v3.0 remaining — Collin County headshots (Phase 17) and compass stances ingestion for Plano/McKinney/Allen (Phase 18)

---

## v2.1 Claude Candidate Discovery (Shipped: 2026-04-25)

**Delivered:** A Claude-powered candidate discovery pipeline that finds, scores, and stages candidates from official election authority sources — scaling to any jurisdiction by adding a single config row, with admin review UI, email alerts, and weekly automated discovery.

**Phases completed:** 5-7 (9 plans total)

**Key accomplishments:**

- 3-table DB schema (discovery_jurisdictions, candidate_staging, discovery_runs) with `citation_url NOT NULL` enforcing hallucination prevention at the schema layer
- Claude agent runner with forced `tool_choice=report_candidates` citation output and server-side web_search — every discovered candidate has a verifiable source URL before reaching the service layer
- Discovery orchestrator with Levenshtein fuzzy name matching at 85% threshold, three-tier confidence scoring (official/matched/uncertain), and withdrawal detection diffed against existing race_candidates
- Admin staging queue — JWT-gated React UI with race grouping, confidence badges, 30-day urgency indicators, and optimistic approve/dismiss with Undo toast
- Email notifications — urgency-aware review email, zero-candidate regression alert, and failure alert via Resend
- Weekly cron sweep at Sunday 02:00 UTC with in-process lock, sequential jurisdiction processing, auto-upsert for official/matched candidates, and sweep-summary email

**Stats:**

- ~57 files created/modified across backend + frontend
- ~1,733 LOC TypeScript (6 core discovery-layer files)
- 3 phases, 9 plans
- 3 days (2026-04-23 → 2026-04-25)

**Git range (backend):** `36cb281` chore(05-01) → `0d89b91` fix(stag-04)

**What's next:** Race completeness audit — detect missing races (not just missing candidates) from official ballot data

---

## v2.0 Elections Page (Shipped: 2026-04-13)

**Delivered:** A dedicated `/elections` page that gives any user instant access to their local ballot — Connected users auto-load with no address input, Inform users get address entry with county shortcuts, and all races surface regardless of candidate count.

**Phases completed:** 1-4 (4 plans total)

**Key accomplishments:**

- Fixed backend LEFT JOIN so races with zero filed candidates are returned with `candidates: []` — not silently dropped by INNER JOIN
- Built standalone `/elections` page with tier-aware auto-load: Connected users with stored jurisdiction see their races instantly via `elections/me`; Inform and no-jurisdiction users get address input with Monroe County and LA County shortcuts
- Fixed hardcoded Indiana state labels in ElectionsView — "State Legislature" / "State Executive" now render correctly for all states
- Three-state race rendering: contested (normal), unopposed ("Running Unopposed" photo overlay), empty ("No candidates have filed" coral notice box)
- Branch-priority ordering within government bodies (Executive → Legislative → Judicial) plus civic-priority Local tier ordering (Mayor → City Council → Township → County → Courts)
- Two discoverability entry points: "Upcoming Elections" landing card and "Elections" header nav item on all pages

**Stats:**

- 28 files created/modified
- ~9,769 lines of JSX/JS/TS (frontend)
- 4 phases, 4 plans
- 2 days (2026-04-12 → 2026-04-13)

**Git range:** `3cbf840` → `45e8389`

**What's next:** Data completeness (CA/IN candidate ingestion, headshots) and Elections page enhancements (tier filter, deep links)

---

## v1.9 Compare UX & Search Fixes (Shipped: 2026-03-01)

**Phases completed:** 0 phases, 0 plans, 0 tasks

**Key accomplishments:**
- (none recorded)

---

