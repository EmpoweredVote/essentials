# Milestones

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

