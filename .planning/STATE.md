# State

## Current Position

Phase: — (v5.0 milestone complete — next milestone not yet started)
Plan: Not started
Status: Ready to plan next milestone
Last activity: 2026-05-18 — v5.0 milestone archived; git tag v5.0 created

Progress: v5.0 SHIPPED ✅ — start v6.0 with `/gsd:new-milestone`

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18 after v5.0 milestone)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Planning next milestone (`/gsd:new-milestone`)

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
- Migration numbering continues from 099 (highest existing is 099_collin_county_discovery_jurisdictions.sql) — next is 111
- TX election date confirmed: 2026-05-02 (NOT May 3 as CONTEXT.md stated — all official sources confirm May 2)
- McKinney email pattern: role-based `{role}@mckinneytexas.org` — mayor, AtLarge1, AtLarge2, District1–4
- MA TIGER G4110=58 (not 351): 58 incorporated cities with charters; 293 MA towns are G4040 COUSUB (not loaded in Phase 38)
- Cambridge congressional split (verified PostGIS): west/north = MA-05 geo_id='2505'; east/south/Inman = MA-07 geo_id='2507'
- Middlesex County G4020 geo_id='25017' intersects 8 G5200 districts (MA-02 through MA-08 + NH-02 border artifact)
- geo_id collision between G4020 (Middlesex County='25017') and G5220 (8th Bristol District='25017') is TIGER format quirk — mtfcc always disambiguates; no routing risk
- Cambridge area MA Senate geo_ids: 25D26 (Middlesex and Suffolk), 25D27 (Second Middlesex), 25D28 (Suffolk and Middlesex)
- Cambridge area MA House geo_ids: 25083 (25th Middlesex), 25084 (26th Middlesex)
- Cambridge headshot source priority: cambridgema.gov/Departments/citycouncil/members for Councillors; cpsd.us for School Committee; news/civic sites only when official source unavailable
- Cambridge headshots photo_license='press_use' for all (cambridgema.gov + cpsd.us bio photos are press/official bio photos, not public domain government works)
- Group photos yielding <200px per person are rejected for headshot import — document in gap section
- email_addresses = NULL is acceptable when CloudFlare or other protection prevents email verification — bio URL (urls[]) satisfies 80% contact coverage target
- role_canonical column on essentials.offices: populated only for Secretary of Commonwealth ('secretary_of_state') and Treasurer ('treasurer'); all other offices NULL
- MA executive external_id range: -200001 through -200007 (skipping -200002 which belongs to Curren D. Price Jr., CA)
- Back-fill UPDATE range -200010..-200001 is intentionally wide (headroom); -200002 (Curren D. Price Jr.) was incidentally back-filled — his office_id now set
- MA federal senators share ONE NATIONAL_UPPER district — uniqueness key is (district_id, politician_id) not (district_id, chamber_id)
- MA federal house reps each have unique NATIONAL_LOWER district — uniqueness key is (district_id, chamber_id)
- MA federal external_id ranges: senators -200101..-200102; house reps -200201..-200209
- 119th Congress MA House roster: all 9 seats Democrat (Neal/McGovern/Trahan/Auchincloss/Clark/Moulton/Pressley/Lynch/Keating), unchanged from 118th

- Elections.jsx shortcuts (Monroe County, LA County) were intentionally retired — page was dead code; /elections Navigate-redirects to /results; shortcuts were never user-visible
- Results.jsx SHORTCUTS pattern: module-level const array before export default function; Cambridge entry uses browse_government_list=2511000; shortcut only renders in address mode (searchMode === 'address')

- computeDisplaySpokes() is the single source of truth for compass spoke selection; both CompassCard and MiniCompass must import from src/lib/compass.js — never duplicate the algorithm
- When localLensActive=true, computeDisplaySpokes uses LOCAL_LENS_TOPICS.slice(0, maxSpokes) as preferredIds regardless of selectedTopics value
- MiniCompass prop contract: userAnswers, polAnswers, selectedTopics, scopedTopics, invertedSpokes, localLensActive, isDark, size=120 — all data passed in by parent; no internal fetching
- INNER_SVG_SIZE=200 with CSS-constrained container (size px, default 120): RadarChartCore foreignObjects (190px) and hit-dots (r=14) do not scale with size prop — always pass 200 internally, constrain via CSS
- MiniCompass container requires overflow:hidden to clip SVG bleed beyond circular border
- Container opacity 0.7 ONLY when (hasReplacedSpokes && localLensActive) — when Lens is OFF, replacement spokes need no visual distinction

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)
- Campaign finance gap script: `C:\EV-Accounts\backend\scripts\audit-la-socrata-gaps.ts` (run with --fix --ingest)
- Contribution data: `transparent_motivations.contributions` table; `con_emp` (employer) + `con_occp` (occupation) identify law firm donors
- Compass scope: lives in `inform.compass_topic_roles` (role_scope CHECK constraint: 'federal'|'state'|'local'|'judicial' — 'judicial' added by migration 112 in Phase 27-01)
- districtScope derivation: LOCAL/LOCAL_EXEC/COUNTY→'local', STATE_*→'state', JUDICIAL/NATIONAL_JUDICIAL→'judicial', NATIONAL_*→'federal', null/other→null (LIVE as of Plan 27-03)
- judicial_role column on inform.compass_topics: NULL=universal, 'judge'=judge-only, 'city_attorney_da'=DA/City Attorney only (added migration 112, applied 2026-05-07)
- Migration 113 APPLIED 2026-05-07: 8 topics + 40 stances + 8 role rows all role_scope='judicial'; 0 non-judicial contamination
- applies_judicial flag: in compassService.ts getCompassTopics() and tierFlagsFor(); fallback=false (cross-cutting topics excluded from judicial profiles)
- CompassCard.jsx scope key: four-arm ternary; 'judicial'→'applies_judicial'; fallback remains 'applies_federal'
- judicial_role='judge' scopes Topics 5-6 (Judicial Interpretation, Bail & Pretrial) to judges only
- judicial_role='city_attorney_da' scopes Topics 7-8 (Prosecution Priorities, Police Accountability) to DA/City Attorney only
- All 8 judicial topics use role_scope='judicial' in compass_topic_roles; Phase 27 COMPLETE

### Pending Todos (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- lavote.gov election ID changes each cycle — mandatory manual update per election cycle

### Parked from v2.2 (backlog — resume after v3.0)

- Phase 8-04: Human-verify checkpoint for Admin Discovery UI (blocked on Run Discovery 401 auth mismatch)
- Phase 9: Race Completeness Audit
- Phase 10: Compass Stances Integration (CA/IN local politicians)
- Phase 11: Indiana Local Races (Monroe County Commissioner, Clerk, Assessor, Township)
- Blocker: POST /admin/discover/jurisdiction/:id uses X-Admin-Token; apiFetch sends JWT Bearer — needs JWT-gated trigger endpoint

### TX v3.0 Notes

- TX election row in DB: '2026 Texas Municipal General', election_date='2026-05-02', election_type='general', jurisdiction_level='city', state='TX'
- Texas municipal elections are nonpartisan — no party affiliation on ballot or in DB
- May 2, 2026 TX uniform election just happened — research winners as new incumbents
- Collin County Elections primary source: collincountytx.gov (NOT collincountyvotes.gov — that domain does not exist)
- Stance research sparse for Tier 3-4 cities (small digital footprint expected)
- Migration numbering: next migration is 111 (110 applied 2026-05-04: 150 TX state reps)
- Phase 12 (TX DB Foundation) has no code dependencies — can start immediately
- Phase 16 (Discovery Jurisdiction Setup) depends only on Phase 12 — can run in parallel with Phases 13-15
- CRITICAL: slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- Migration 088 (Tier 1 cities): slug bug fixed and migration applied 2026-05-01; 4 cities, 30 offices verified
- Migration 091 (Plano politicians): applied 2026-05-01; 8 incumbents seeded, Place 6 vacant, 100% email+bio coverage
- Migration 092 (McKinney politicians): applied 2026-05-01; 7 incumbents seeded, 100% email (role-based), 100% bio URL
- Migration 093 (McKinney emails): applied 2026-05-01; email_addresses added to all 7 McKinney politicians (role-based: mayor/AtLarge1/AtLarge2/District1-4@mckinneytexas.org)
- McKinney At-Large offices: DB titles are 'Council Member At-Large Place 1/2' (not 'At-Large 1/2') — use exact DB titles in WHERE clauses
- Migration 094 (Allen+Frisco politicians): applied 2026-05-01; 14 incumbents seeded (Allen 7/7 email, Frisco 0/7 CloudFlare)
- Migration 095 (Richardson politicians): applied 2026-05-01; 7 incumbents seeded, 2-year terms valid_from='2025-05-01', all 7/7 email (Firstname.Lastname@cor.gov)
- Migration 096 (Murphy+Celina+Prosper politicians): applied 2026-05-01; 21 incumbents seeded (only Celina Mayor has email: rtubbs@celina-tx.gov)
- Richardson DB office titles: 'Council Member District 1-4' (geographic residency districts, not 'Place 1-4') — matches migration 089 decisions
- Richardson email pattern: Firstname.Lastname@cor.gov — confirmed by user; all 7 rows populated
- Post-election flags (May 3, 2026 TX uniform election): 7+ seats across Allen/Frisco/Murphy/Celina to update after results certified; Prosper races were uncontested cancellations (already definitive); Amy Bartley (Prosper Place 3) new term begins 2026-05-12
- Jené Butler (Celina Place 1): é accent in full_name — UTF-8 preserved in migration 096
- supabase CLI v2.75.0 has NO 'db query' command — use psql with DATABASE_URL from backend/.env instead
- MA 2026 elections in DB: primary (2026-09-01), general (2026-11-03); use these for all Phase 44 race seeding
- MA discovery_jurisdictions: 2 rows for geoid='25' (primary + general 2026); 1 row for geoid='2511000' (Cambridge 2027-11-02, outside 180-day cron horizon until ~May 2027)
- 2027 Cambridge Municipal Election placeholder: election_date='2027-11-02' (Nov 1=Monday → Nov 2 is correct first-Tuesday-after-first-Monday); election_type='general', jurisdiction_level='city'
- Migration 164 applied 2026-05-17; version in schema_migrations: 20260517164000
- Phase 44 COMPLETE (3/3 plans); all MA 2026 discovery infrastructure in place
- race_candidates has NO unique constraint on (race_id, full_name) — use WHERE NOT EXISTS guards, not ON CONFLICT DO NOTHING
- Azeem 2nd Middlesex race: is_incumbent=false (open seat — Jehlen retiring); office_id=b1ed4e2a-4a9c-4b41-9e46-8500f608e026 (25D27)
- Migration 162 applied 2026-05-17; version in schema_migrations: 20260517162000
- Migration 163 applied 2026-05-17; Markey primary (4 candidates) + general (3 candidates) statewide (office_id=NULL); 7 Cambridge-area district general races; 2nd Middlesex general race has 0 candidates (open seat — primary winner TBD)
- Statewide race sentinel: office_id=NULL in essentials.races + e.state='MA' in elections = appears for all MA users via statewide query path
- Seth Moulton (primary challenger) has politician_id=NULL in race_candidates — he's a sitting US Rep (MA-06) but his politician_id was not verified pre-migration; backfill optional in 44-03
- Prosper is legally a Town — use 'Town of Prosper' and 'Town Council' everywhere
- Fairview is legally a Town — use 'Town of Fairview' and 'Town Council' everywhere
- Princeton has 8 council seats (Mayor + Place 1-7), confirmed
- Copeville (GEOID 4816600) excluded — may be unincorporated CDP; add in follow-up if confirmed incorporated
- Tier 3-4 seeding complete: Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville, Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge
- Phase 16-02 discovery test run: Allen run (run_id=47c4085a-cc46-47f8-ba21-f1726cf44799) returned 2 staged Mayor candidates — Chris Schulmeister + Dave Shafer — from collincountytx.gov sample ballot PDF; DISC-03 satisfied
- Plano returned 0 candidates (expected — odd-year city; next general May 2027); Allen chosen as DISC-03 verification target
- Domain whitelist enforcement confirmed: 0 violations across both runs; weekly cron now armed for all 23 TX cities (Sunday 02:00 UTC)

### Phase 19 Notes

- geo_id pattern confirmed: STATEFP(2) + CD119FP(zero-padded 2 digits) = 4-char string ('4803' for TX-3)
- district_id backfill: LTRIM(SUBSTRING(geo_id FROM 3), '0') — strips '48' prefix then leading zeros
- Migration 104 (district_id backfill): applied 2026-05-03; UPDATE 38 first run, UPDATE 0 re-run; idempotent
- Congressional boundaries already loaded (all 50 states prior run); load-us-congressional-boundaries.ts is safe to re-run
- Collin County G4020 boundary loaded 2026-05-03: geo_id='48085', state='48', geom=ST_Polygon, srid=4326, valid=t; 3235 county records scanned; idempotent
- Migration 105 applied 2026-05-03: 37 TX House politicians + 38 offices (37 active + 1 vacant TX-23); chamber_id=c2facc31; external_ids -100301..-100338 (skip -100323); idempotent
- US House chamber UUID confirmed: c2facc31-7b13-428c-b7b9-32d0d3b95f76 (chamber.name_formal = 'United States House of Representatives')
- 19-04 complete 2026-05-03: getPoliticiansByGovernmentList extended with countyGeoId option; PostGIS G4020↔G5200 intersection query; route /by-government-list accepts county_geo_id; smoke test: 5 NATIONAL_LOWER reps for Collin County (Keith Self TX-3, Pat Fallon TX-4, +3 others); LA County unchanged (55 politicians); invalid input → 400
- 19-05 complete 2026-05-03: frontend wired — api.jsx browseByGovernmentList +countyGeoId; Landing.jsx Collin County +browseCountyGeoId='48085'; Results.jsx reads browse_county_geo_id URL param; user verified on production (5 reps: Keith Self TX-3, Pat Fallon TX-4, Lance Gooden TX-5, Brandon Gill TX-26, Julie Johnson TX-32); LA/IN unaffected
- G4020 county boundary intersection PATTERN ESTABLISHED: to add congressional rep lookup for any TX county, (a) load county G4020 boundary into DB, (b) add browseCountyGeoId to COVERAGE_AREAS entry in Landing.jsx — no other code changes needed
- Priority TX counties for future expansion: Dallas (48113), Tarrant (48439), Bexar (48029), Travis (48453)

### Phase 21 Notes

- MTFCC mapping RESOLVED: G5210=Senate=STATE_UPPER (SLDU/31), G5220=House=STATE_LOWER (SLDL/150) — matches TIGER spec AND essentialsService.ts:567-568
- geofence_boundaries.state = FIPS '48'; districts.state = abbreviation 'TX' (intentionally different — established pattern)
- load-tx-state-boundaries.ts: auto-download pattern modeled on load-us-congressional-boundaries.ts (NOT load-ca-state-boundaries.ts — that has inverted MTFCC bug)
- 181 boundaries + 181 districts loaded 2026-05-04; idempotent re-run confirmed (Already existed: 181)
- Script cached TIGER ZIPs locally; clean re-run will skip downloads and re-extract
- Texas State Senate chamber UUID: 0b970b1c-5308-4a56-bfe9-b74ae9e58ea2 (Plans 21-03 must use this)
- Texas House of Representatives chamber UUID: 5ac03af0-938f-4a31-84f1-e7a644711e0e (Plans 21-04 must use this)
- Migration 108 applied 2026-05-04: 2 TX legislative chambers created; name_formal=name; slug auto-generated; idempotent re-run INSERT 0 0
- Migration 109 applied 2026-05-04: 30 TX state senators + 31 senate offices (D4 vacant); external_ids -100401..-100403, -100405..-100431; all 30 office_id back-filled; idempotent re-run 0 changes
- D9 senator name confirmed: Taylor Rehmet (not Rehmert) — verified from official senate.texas.gov source
- TX Senate vacancy pattern: D4 office has politician_id NULL, is_vacant=true; external_id -100404 intentionally unused; matches TX-23 US House vacancy pattern from migration 105/0 0
- Migration 110 applied 2026-05-04: 150 TX House reps + 150 offices; chamber 5ac03af0; external_ids -100501..-100650; idempotent; D115 full name 'Cassandra Garcia Hernandez' (compound last name); 88R/62D
- Phase 21 verified 2026-05-04: all 4 roadmap success criteria PASS — 31 G5210 + 150 G5220 boundaries valid, 31 STATE_UPPER + 150 STATE_LOWER districts matched, 30 senators + 150 reps with 100% office_id back-fill, 5 TX addresses each returned 1 STATE_UPPER + 1 STATE_LOWER row
- Regression check 2026-05-04: 11-row query at Capitol Austin clean — Lloyd Doggett (TX-37), Sarah Eckhardt (D14), Gina Hinojosa (D49), Cruz/Cornyn, Abbott/Patrick/Paxton/Hegar/Buckingham/Miller all present
- Point query notes: Senate predictions 5/5 exact; House 2/5 exact (Austin + Houston); Dallas D114/San Antonio D123/McKinney D61 returned instead of estimated D100/D125/D89 — TIGER geometry is authoritative, all correct-area reps
- Next migration is 111 (110 applied 2026-05-04: 150 TX state reps)
- Phase 21 complete 2026-05-04 — TX state legislators now appear in point queries alongside federal officials

### Phase 20 Notes

- Migration 107 applied 2026-05-04: 6 TX executive chambers name_formal populated (Texas Governor, Lt. Governor, AG, Comptroller, Land Commissioner, Agriculture Commissioner); 8 TX state/federal politicians office_id backfilled (external_id -100200..-100207)
- chambers name_formal back-fill pattern: WHERE name_formal = '' AND id IN (explicit UUIDs) — never name matching
- politicians office_id back-fill pattern: BETWEEN range (-100210..-100199) provides headroom; guarded by IS NULL
- All 8 office_id UUIDs verified against expected values from migration 103
- Plan 20-02 complete 2026-05-04: 8 Wikipedia headshots imported (cc_by_sa); all 600×750 via LANCZOS; PIL spot-check passed; zero orphans; profile pages now render title + chamber + photo
- Sid Miller disambiguation: correct Wikipedia article is /wiki/Sid_Miller_(politician) (not /wiki/Sid_Miller which is a disambiguation page)

### Phase 23 Notes

- Phase 23 migration applied 2026-05-04: 20260504000001_phase23_local_compass_topics.sql via supabase db push
- 10 LOCAL topic_keys live (is_live=true, went_live_at set): residential-zoning, growth-and-development, public-safety-approach, homelessness-response, economic-development, transportation-priorities, local-environment, rent-regulation, local-immigration, city-sanitation
- All 50 stances confirmed present + content-complete (text, description, 3+ supporting_points, 3+ example_perspectives)
- 14 scope-role rows in compass_topic_roles: 10 local (all topics) + 4 state (growth-and-development, economic-development, transportation-priorities, rent-regulation)
- fc_community_slug is NULL for all 10 topics — Phase 24 must populate
- Migration history repair pattern: remote-only phantom versions → reverted; locally-applied untracked → applied; then push succeeds
- compassService.ts already surfaces these topics to local politicians without code changes (scope filtering wired in compass_topic_roles)

### Phase 25 Notes

- districtScope prop pattern: CompassCard accepts 'local'|'state'|'federal'|null; null = show all topics (safe default)
- Scope key mapping: 'local'→applies_local, 'state'→applies_state, 'federal'→applies_federal (t[key] !== false — treats undefined as true for cross-cutting topics)
- district_type mapping: LOCAL/LOCAL_EXEC/COUNTY→'local', STATE_*→'state', NATIONAL_*→'federal', null/JUDICIAL/other→null
- CandidateProfile challenger case: pol.district_type is undefined for challenger minimal obj → derivation returns null → all topics shown (correct safe default)
- Pre-existing main.jsx breakage fixed: ThemeProvider was imported from ev-ui but not exported (build blocker, reverted)
- Plan 25-02 complete 2026-05-05: districtScope filtering wired; local officials now see only LOCAL-applicable compass topics

### Phase 22 Notes

**AUDIT-01 — Scope Mechanism:**
- `inform.compass_stances` has NO scope/level/race_type column. The table holds only stance text content (id, topic_id, value, text, supporting_points, description, example_perspectives).
- Scope filtering lives in `inform.compass_topic_roles` — a join table with columns (topic_id UUID, role_scope TEXT, is_required BOOLEAN). Valid role_scope values: 'federal', 'state', 'local'. Constrained by CHECK (role_scope IN ('federal', 'state', 'local')) per migration 059.
- `inform.compass_topics.office_scope` (TEXT[]) exists but is informational only — never used as a render filter. All 26 live topics currently have office_scope = NULL.
- compassService.ts `getCompassTopics()` converts compass_topic_roles rows to three booleans (applies_federal, applies_state, applies_local) at query time. Topics with ZERO rows in compass_topic_roles default to all three tiers = true (cross-cutting behavior).
- Six live topics are currently cross-cutting (no compass_topic_roles rows): Affordable Housing, AI Oversight, Deportation Priorities, Healthcare Access, Immigration and Treatment, Taxation and Public Spending.
- The frontend (src/lib/compass.js) does NOT currently filter displayed topics by these boolean flags — the flags are returned in the API response but filtering is not enforced in the essentials UI.
- Pattern to add LOCAL scope to a new topic (from migration 063): INSERT INTO inform.compass_topic_roles (topic_id, role_scope, is_required) VALUES ('<uuid>', 'local', true) ON CONFLICT (topic_id, role_scope) DO NOTHING;

**AUDIT-02 — "Criminalization of Homelessness" Answer Count:**
- topic_id: 4938766b-b45a-46e3-93bd-b8b30651271a
- topic_key: homelessness
- is_live: true
- fc_community_slug: criminalization-of-homelessness
- tier roles: federal, state, local (3 rows in compass_topic_roles — all tiers)
- office_scope: NULL
- Politician answer count: 42 (confirmed via live COUNT(*) on inform.politician_answers)
- Value distribution: 3× value=1, 27× value=2, 6× value=3, 4× value=4, 1× value=5
- Politicians span LA council members, CA statewide officials, and Indiana politicians
- topic_rewrites: 0 rows (no active or historical rewrite for this topic)
- companion connect.communities row exists (slug: criminalization-of-homelessness); 0 members, 0 threads

**RETIRE-01 — Retirement Decision: KEEP BOTH**
- Reasoning: 42 politician answers is substantial data spanning real politicians with a diverse value distribution (1–5). Retiring would orphan all 42 politician_answers rows.
- "Criminalization of Homelessness" (rights/enforcement frame: should sleeping in public spaces be criminalized?) is complementary to, not duplicative of, the proposed Phase 23 "Homelessness Response" topic (service delivery frame: what is the primary strategy for addressing homelessness?).
- No retirement action is warranted. Both topics should remain live.
- Pure retirement pattern (for reference only): UPDATE inform.compass_topics SET is_live = false WHERE id = '<topic_id>'; — no topic_rewrites row needed for pure retirement.
- slug_history is a TEXT[] column on the connect.communities row itself (NOT a separate table — ROADMAP.md had this wrong).

### Phase 24 Notes

- Migration 20260504000002_phase24_companion_communities.sql applied 2026-05-05: 10 connect.communities rows seeded + fc_community_slug populated for all 10 LOCAL topic_keys
- local-immigration topic_key → immigration-policy slug exception verified live at fc.empowered.vote/communities/immigration-policy
- All 4 verification queries passed: 10 communities, 0 orphans, 50 stances all with descriptions, 10 non-null fc_community_slug rows
- Correct FC community URL pattern: /communities/:slug (NOT /:slug — plan had wrong paths)

### Phase 25 Notes

- Migration 20260505000001_phase25_scope_audit.sql applied 2026-05-05: local scope row added for Affordable Housing (topic_key='housing', UUID 669cac97-66a6-4087-b036-936fbe62efb3)
- Audit finding: plan used wrong topic_keys (affordable-housing, childcare-affordability, data-center-development) — actual DB keys are 'housing', 'childcare', 'data-centers'
- childcare + data-centers: already had federal+local+state scope rows — no change needed
- homelessness: still has federal+local+state — RETIRE-01 keep-both decision preserved
- jail-capacity: already had local+state — no change needed
- Post-migration verification: all 5 topics show has_local=true; 12 total rows in compass_topic_roles for these 5 topics
- Topic UUID reference: housing=669cac97, childcare=c1ac1330, data-centers=4559b513, homelessness=4938766b, jail-capacity=c267e137
- DATABASE_URL stored at C:/Users/Chris/AppData/Local/Temp/backend.env (not C:\Focused Communities\backend\.env which does not exist)

---
### Phase 18 Notes

- Scale direction confirmed from live DB: 1=progressive, 5=conservative (Adam B. Schiff value=1 on taxes/healthcare/abortion; Adam Miller value=4 on housing/taxes)
- Apply script pattern: import 'dotenv/config' + csv-parse/sync + pg Pool + upsert ON CONFLICT DO UPDATE; run with npx tsx from C:\EV-Accounts\backend
- Use parseInt(r.value) directly — NOT 3 - parseInt(r.value) (old scripts like apply-malik-stances.ts used inversion; newer scripts and Phase 18 use direct value)
- CSV files gitignored by EV-Accounts/.gitignore (backend/data/stance-research/*.csv); only apply scripts committed to backend repo
- 18-01 complete 2026-05-12: 7 rows for 6 Plano politicians (Shun Thomas housing=3; Steve Lavine housing=3 + taxes=4; Bob Kehr housing=3; Chris Krupa Downs housing=4; Vidal Quintanilla housing=3; John B. Muns housing=3)
- Maria Tu (d6bf8d34) + Rick Horne (bc4a88d7): excluded — no evidenced stances
- 18-02 complete 2026-05-12: 9 rows — 6 McKinney housing stances (values: 2,3,3,3,3,4) + 3 Allen rows (Schaeffer housing=4 + taxes=4; Brooks housing=3)
- Michael Jones (McKinney) + Tommy Baril/Ken Cook/Amy Gnadt/Carl Clemencich/Ben Trahan (Allen): excluded — no evidenced stances
- Frisco: 8 rows ingested (Ann Anderson housing=3; Angelia Pelham taxes=4; Burt Thakur housing=4 + taxes=4; Laura Rummel housing=4 + taxes=4; Brian Livingston housing=4; Jeff Cheney taxes=4); Jared Elad skipped (no evidence)
- Richardson: 2 rows ingested (Amir Omar housing=3 + taxes=3)
- Murphy: NO stance evidence found — nonpartisan small-city council; no LWV guide; no candidate Q&A articles; documented as sparse
- Celina: NO stance evidence found — same pattern as Murphy; documented as sparse
- Prosper: NO stance evidence found — Town Council has no documented policy positions in any public source; documented as sparse
- Housing topic UUID: 669cac97-66a6-4087-b036-936fbe62efb3 (Affordable Housing)
- Taxes topic UUID: f7e5678d-dadd-4556-a2fc-446e24642ceb (Taxation and Public Spending)
- Phase 18 total: 26 rows across 19 Collin County TX politicians in inform.politician_answers
- Apply scripts stored in C:\EV-Accounts\backend\scripts for audit trail
- apply script path pattern: path.join(__dirname, '..', 'data', 'stance-research', filename) — use for all future apply scripts

### Phase 41 Notes

- Migration 157 applied 2026-05-17: election_method TEXT column added to essentials.chambers; Cambridge LOCAL government (geo_id='2511000') + City Council (9 seats, stv_proportional) + School Committee (6 seats, stv_proportional) seeded
- Cambridge government UUID: 6f7d55bc-d50c-47ff-b521-5767d1f763fb
- City Council chamber UUID: b4b8c0a1-2658-4df4-9196-9646c99d173c (slug: cambridge-city-council)
- School Committee chamber UUID: 41846a49-e5d5-460d-b2c2-0f4f8130b949 (slug: cambridge-school-committee)
- essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS pattern required for idempotent inserts (ON CONFLICT (geo_id) would fail)
- Migration 158 applied 2026-05-17: 17 Cambridge offices seeded — 9 City Councillor + 1 Mayor (is_appointed=true) + 1 City Manager (is_appointed=true) in City Council chamber; 6 School Committee Member in School Committee chamber; all politician_id=NULL
- Cambridge office count is 17 (plan docs said 16 — arithmetic error in plan; 9+1+1+6=17 is correct)
- City Councillor double-L British spelling confirmed in DB; migration 159 WHERE clauses must use "City Councillor" (not "City Councilor")
- generate_series(1, N) pattern established for N identical at-large office rows
- Migration 159 applied 2026-05-17: 16 Cambridge incumbents seeded; unique index on offices.politician_id dropped (was blocking dual-office); Siddiqui dual-office: office_id=Mayor (primary), City Councillor office also wired; Yi-An Huang City Manager is_appointed=true; all 17 offices assigned; 0 unassigned
- Dual-office pattern: politicians.office_id=primary display title; offices.politician_id=secondary can be same politician (bidirectional); unique index on offices.politician_id must be dropped for Council-Manager cities
- Cambridge added to Landing.jsx COVERAGE_AREAS: browseGovernmentList=['2511000'], browseStateAbbrev='MA'
- Phase 41 COMPLETE (3/3 plans); next migration is 160
- offices.politician_id column has NO unique constraint after migration 159 (intentionally dropped; geofence routing unaffected)

### Phase 40 Notes

- Migration 154 applied 2026-05-16: role_canonical column added to essentials.offices; 1 NATIONAL_UPPER district (state='MA', geo_id='25'); 6 STATE_EXEC districts; 6 MA executive chambers; 6 politicians (Healey/Driscoll/Campbell/Goldberg/DiZoglio/Galvin, external_ids -200001/-200003 to -200007); office_id back-fill range -200010..-200001
- Migration 155 applied 2026-05-16: Warren (-200101) + Markey (-200102) seeded as NATIONAL_UPPER; shared US Senate chamber 7cbe07bc
- Migration 156 applied 2026-05-16: 9 US House reps Neal-Keating (-200201..-200209); each linked to existing NATIONAL_LOWER districts 2501-2509 (Phase 38); US House chamber c2facc31
- Headshots: 6 MA executives + 11 MA federal officials = 17 total; all 600×750 JPEG (Lanczos q90, 4:5 crop first)
- photo_license: Healey=public_domain (MA.gov); Driscoll/Campbell/Goldberg/DiZoglio/Galvin + Lynch=cc_by_sa; Warren/Markey/Neal/McGovern/Trahan/Auchincloss/Clark/Moulton/Pressley/Keating=public_domain (congressional portraits)
- Cambridge ground-truth: west/north (Porter/Harvard) → Clark MA-05 geo_id=2505; east/south/Inman → Pressley MA-07 geo_id=2507
- Next migration is 157

### Phase 38 Notes

- MA TIGER 2024 PLACE layer has 58 G4110 incorporated cities; 293 MA towns are G4040 COUSUB (not loaded in Phase 38)
- Cambridge place boundary loaded: geo_id='2511000', name='Cambridge city', mtfcc='G4110'
- MA geofence_boundaries: state='25' (FIPS); MA districts: state='ma' (lowercase abbrev) except NATIONAL_LOWER which uses 'MA' (uppercase — loaded via cd layer in prior run)
- Total MA boundaries: 58 G4110 + 9 G5200 + 40 G5210 + 160 G5220 + 14 G4020 = 281 rows
- Cambridge district routing confirmed (Phase 39 ground truth): Porter Square/Harvard Sq → MA-05 (G5200 geo_id='2505'); Kendall/Inman → MA-07 (geo_id='2507')
- Cambridge state districts confirmed: Porter Sq/Harvard Sq → 25th Middlesex House (G5220 geo_id='25083'); Kendall/Inman → 26th Middlesex House (geo_id='25084')
- Cambridge senate districts: Porter Sq → Second Middlesex (G5210 geo_id='25D27'); Harvard Sq → Suffolk and Middlesex (geo_id='25D28'); Kendall/Inman → Middlesex and Suffolk (geo_id='25D26')
- Middlesex County G4020 (geo_id='25017') intersects 8 G5200 rows: MA-02 through MA-08 + NH-02 border artifact (state='33', not a routing row)
- MA districts.state column uses lowercase 'ma' (from FIPS_TO_STATE map in loader); geofence_boundaries.state='25' (FIPS)
- Total MA districts: 9 NATIONAL_LOWER + 40 STATE_UPPER + 160 STATE_LOWER + 14 COUNTY = 223 rows
- Middlesex County boundary loaded: geo_id='25017' (G4020) — county intersection pattern (Phase 19) applies
- 293 MA towns (G4040 COUSUB) deferred as future work — non-city MA addresses won't return LOCAL boundary row
- MTFCC pre-flight assertion pattern established: fires before upsert pass, throws named MtfccAssertionError; catches TIGER file surprises before any DB write
- Backend commits: 015599b (initial MA registration) + a9acb49 (place count fix 351→58)

### Phase 30 Notes

- Migration 119 applied 2026-05-09: Ashouri 6 politician_answers + 6 politician_context rows; all judicial topics placed (no not-found rows)
- Ashouri had 11 pre-existing politician_answers/context rows for other topics; judicial rows bring total to 17
- Value placements: access-to-justice=1, criminal-justice=2, govt-deference=1 (inferred), transparency=2 (inferred), police-accountability=1, prosecution-priorities=1
- Inference flag pattern: reasoning prefixed "Inferred from overall platform framing" when no direct quote; two topics flagged (govt-deference, transparency)
- Patch Q&A (April 30, 2026) is highest-quality source for City Attorney candidates — structured interview with direct policy quotes
- DSA-LA PDF (126 pages): minimal Ashouri content (no endorsement; limited policy detail)
- Migration 120 applied 2026-05-09: McKinney 5 politician_answers + 6 politician_context rows; judicial-transparency not found (context-only); values: prosecution-priorities=4, criminal-justice=4, police-accountability=4, access-to-justice=3, government-deference=3
- Migration 121 applied 2026-05-10: Roy 5 politician_answers + 6 politician_context rows; judicial-transparency not found (context-only); values: prosecution-priorities=2, criminal-justice=2, police-accountability=2, access-to-justice=1, government-deference=1
- judicial-transparency not-found pattern: general 'office integrity/accountability' framing (used by both McKinney and Roy) does not map to court proceedings transparency — the topic requires specific positions on open hearings, record sealing, evidence access
- Fixed 4-category source checklist COMPLETE for all 3 LA City Attorney candidates: LACBA/JEEC (not applicable), LAist voter guide (primary), Vote411/LWV (not indexed), endorsing org questionnaires (LA Forward, Patch Q&A highest-quality)
- Phase 30 COMPLETE; next migration is 122

### Phase 31 Notes

- identify-legal-donors.ts: 32 LEGAL_CANDIDATES from migration 117 (4 CAs + 28 judges); --probe + extraction modes
- 4 candidates with confirmed contribution data: Feldstein Soto (2631 rows), Roy (1270), McKinney (125), Ashouri (71)
- 28 judge challengers: skipped (no confirmed contributions — LA Ethics Commission data not ingested for judicial races)
- Employer field: COALESCE(c.raw_record->>'contributor_employer', c.raw_record->>'con_empr', '') — NEVER con_emp
- Occupation field: COALESCE(c.raw_record->>'contributor_occupation', c.raw_record->>'con_occp', '')
- "associate" bare occupation excluded (too many non-legal collisions confirmed in Roy data: 9 rows)
- Fuzzy dedup: fastest-levenshtein distance<=3 merge, 4-6 flag needs_review (same-first-letter pairs only)
- 15% threshold: cumulative dollar walk, not percentile of donor count
- court-research-input.json: 32 entries, 4 with firms, 28 empty; deterministic on re-run
- Top firms: Ashouri=Life Sciences Patent Law Firm ($300), McKinney=LA County DA's Office ($5,400), Roy=California DOJ ($41,053), Feldstein Soto=City of LA ($75,774)
- Anomaly: "City of Los Angeles" is top donor for Feldstein Soto (incumbent CA office colleagues) — not a court conflict; Plan 02 researcher should apply conflict framing only to private law firms

### Phase 29 Notes

- Migration 117 applied 2026-05-09: 11 LA Superior Court contested races (Offices 2/14/64/65/66/81/87/116/131/176/181) for election_id 1ebca37f-cf96-47f4-bc2b-47ef266721fe
- 25 challenger politicians created (attorneys, is_incumbent=false, is_active=true, data_source='LACBA 2026 JEEC Ratings')
- 28 race_candidates rows: 25 challengers via full_name subquery + 3 incumbents via hardcoded UUID (Draper→Office 2, Walgren→Office 81, Connolly→Office 116)
- 32 judicial_evaluations rows: source='LACBA JEEC', rating_date='2026-01-01'; 28 rated + 4 City Attorney "Not evaluated — office not covered by LACBA JEEC"
- IDEMPOTENCY PATTERN: politicians table has NO unique constraint on full_name; use INSERT...SELECT...WHERE NOT EXISTS instead of ON CONFLICT DO NOTHING for politician inserts
- All Superior Court races use office_id=NULL (no office records exist for these positions in the current schema)
- City Attorney "not evaluated" source_url='https://www.lacba.org' (their evaluation page returns HTTP 403)
- Patrick Connolly has 2 CJP public admonishments in judicial_disciplinary_records (2016-03-23 + 2021-04-02); plain-language descriptions
- Plain-language description standard: description field = voter-facing summary of what judge did; established in migration 118
- isLegalCandidate detection: district_type JUDICIAL/NATIONAL_JUDICIAL OR office_title includes 'city attorney'/'district attorney'/'judge'/'justice' — 6 conditions; Profile.jsx and CandidateProfile.jsx must stay in parity (Phase 32-01)
- dScope fallback: CandidateProfile.jsx dScope ternary ends `: isLegalCandidate ? 'judicial' : null` — catches city attorney candidates with null district_type (COMPASS-05 fix, Phase 32-01)
- Profile.jsx isLegalPolitician: state var set true when isLegalCandidate; gates LegalDonorActivitySection render (DONOR-04 fix, Phase 32-01)
- BarEvaluationSection.jsx: renders after JudicialCompassSection, before CampaignFinanceSection; returns null when no data (no empty sections)
- Draper pending CJP proceedings: NOT documented (no imposed discipline; omit pending proceedings)
- State Bar status rows + CJP N/A rows: SKIP (no voter signal without discipline; BarEvaluationSection links to CJP UI instead)
- judicial_disciplinary_records pre-existing rows: 3 (other judges); 5 total after migration 118

### Phase 28 Notes

- JudicialCompassSection.jsx: filters allTopics by applies_judicial===true, then by judicialSubRole (from officeTitle string match); renderss empty notch UI with 'Stance research in progress' label
- deriveJudicialSubRole: 'judge' if officeTitle includes 'judge'; 'city_attorney_da' if includes 'city attorney' or 'district attorney'; null for unknown → shows all judicial topics (safe default)
- filterJudicialTopics: judicial_role===null|undefined = universal (show for all sub-roles); strict sub-role match otherwise
- isJudge guard removed from Profile.jsx (was static placeholder text); replaced by JudicialCompassSection routing
- CandidateProfile.jsx: JUDICIAL arm added to districtScope derivation (before NATIONAL_ catch-all — critical ordering)
- compassService.ts: judicial_role added to SELECT; backend deployed to Render (push to master 14b27b1)
- Frontend deployed to Render (push to main 649113a, post-rebase after 21 remote commits)
- fc_community_slug NULL on all 8 judicial topics — Phase 28-02 must populate for community links to appear
- Migration 20260506000001_phase28_judicial_communities.sql applied 2026-05-07: 8 connect.communities seeded (judicial compass communities, simplified plain-language descriptions); fc_community_slug populated on all 8 judicial topics; COMPASS-06 satisfied
- Phase 28 COMPLETE (2/2 plans)

*State initialized: 2026-04-12*
*Updated: 2026-05-01 — Phase 15 complete; migrations 097-098 applied; 74 Tier 3-4 politicians seeded across 15 cities (45 Tier 3 + 29 Tier 4); 19 stubs for May 3 election seats; Copeville excluded*
*Updated: 2026-05-01 — Phase 16-01 complete; migration 099 applied; TX election row seeded (2026-05-02); 23 Collin County cities in discovery_jurisdictions; 23/23 governments matched*
*Updated: 2026-05-01 — Phase 16 complete (2/2 plans); DISC-01, DISC-02, DISC-03 all satisfied; Allen test run produced 2 staged Mayor candidates; Phase 16 done*
*Updated: 2026-05-03 — Phase 19-01 complete; 38 TX G5200 boundaries + 38 NATIONAL_LOWER districts confirmed; migration 104 applied (district_id backfill UPDATE 38)*
*Updated: 2026-05-03 — Phase 19-02 complete; Collin County G4020 boundary inserted (geo_id=48085, state=48, srid=4326, valid); 3235 records scanned; idempotent*
*Updated: 2026-05-03 — Phase 19-03 complete; migration 105 applied; 37 TX House politicians + 38 offices (TX-23 vacant); chamber c2facc31; all idempotent*
*Updated: 2026-05-03 — Phase 19-04 complete; PostGIS G4020↔G5200 backend wired; getPoliticiansByGovernmentList +countyGeoId; smoke test passed (5 US House reps for Collin County)*
*Updated: 2026-05-03 — Phase 19 complete (5/5 plans); frontend wired api.jsx+Landing.jsx+Results.jsx; production verified; G4020 county intersection pattern documented; Dallas/Tarrant/Bexar/Travis queued for future expansion*
*Updated: 2026-05-03 — Phase 17 complete (4/4 plans); 37/37 TX House reps + Sonderling imaged via Wikipedia; migration 106 applied (office_id backfill + Labor Secretary transition); 57/75 Tier 3/4 imaged (34 confirmed gaps)*
*Updated: 2026-05-04 — Phase 20-01 complete; migration 107 applied; 6 TX executive chambers name_formal populated; 8 TX state/federal politicians office_id backfilled (Cruz/Cornyn/Abbott/Patrick/Paxton/Hegar/Buckingham/Miller); idempotent re-run confirmed UPDATE 0/0*
*Updated: 2026-05-04 — Phase 20 complete (2/2 plans); 8 Wikipedia headshots imported (cc_by_sa, 600×750); all profile pages now render title + chamber + photo; Phase 18 (Compass Stances) is next*
*Updated: 2026-05-04 — Phase 21-01 complete; 181 TX state legislative boundaries loaded (31 G5210/STATE_UPPER Senate + 150 G5220/STATE_LOWER House); essentials.geofence_boundaries state='48', essentials.districts state='TX'; SRID 4326 all valid; idempotent*
*Updated: 2026-05-04 — Phase 21-02 complete; migration 108 applied; Texas State Senate (0b970b1c) + Texas House of Representatives (5ac03af0) chambers created; name_formal=name; slug auto-generated; idempotent re-run confirmed INSERT 0 0*
*Updated: 2026-05-04 — Phase 21-03 complete; migration 109 applied; 30 TX state senators + 31 senate offices (D4 vacant, is_vacant=true); all 30 politicians office_id back-filled; idempotent; senate half of Phase 21 complete*
*Updated: 2026-05-04 — Phase 21-04 complete; migration 110 applied; 150 TX House reps + 150 offices (no vacancies); chamber 5ac03af0; external_ids -100501..-100650; 88R/62D; all 150 office_id back-filled; idempotent; house half of Phase 21 complete*
*Updated: 2026-05-04 — Phase 21 complete (5/5 plans); end-to-end verification passed; all 4 roadmap success criteria PASS; 5 TX addresses each return 1 STATE_UPPER + 1 STATE_LOWER; 11-row regression clean (Phase 19/20 intact); next migration is 111
*Updated: 2026-05-04 — Milestone v3.1 Local Compass Expansion defined; 26 requirements across 4 phases (22-25); primary execution in C:\Focused Communities\supabase\migrations\*
*Updated: 2026-05-04 — Phase 22 complete (1/1 plans); compass schema audit done; AUDIT-01: scope lives in compass_topic_roles (not compass_stances); AUDIT-02: 42 politician answers for Criminalization of Homelessness; RETIRE-01: keep both (complementary framing); next migration is 111*
*Updated: 2026-05-04 — Phase 23-01 complete; 50 LOCAL compass stances authored across 10 topics; migration 20260504000001_phase23_local_compass_topics.sql written + user-approved via checkpoint; 6 LOCAL-only + 4 LOCAL+STATE topics; local-immigration isolated from federal topic; ready for supabase db push in Plan 23-02*
*Updated: 2026-05-04 — Phase 23 complete (2/2 plans); migration applied via supabase db push (with migration history repair); 10 topics + 50 stances + 14 scope-role rows confirmed via psql; fc_community_slug NULL for all 10 topics — Phase 24 next*
*Updated: 2026-05-04 — Phase 24-01 complete; 10 companion community descriptions authored and user-approved at checkpoint (zero edits); migration 20260504000002_phase24_companion_communities.sql written (10 INSERTs + 10 UPDATEs, all 7 verification checks pass); immigration-policy slug decoupled from local-immigration topic_key; ready for supabase db push in Plan 24-02*
*Updated: 2026-05-05 — Phase 24 complete (2/2 plans); migration applied via supabase db push; 10 connect.communities rows seeded; fc_community_slug populated for all 10 LOCAL topic_keys; immigration-policy slug exception verified live; Phase 25 next*
*Updated: 2026-05-05 — Phase 25-02 complete; CompassCard districtScope filtering wired; Profile.jsx + CandidateProfile.jsx thread districtScope from pol.district_type; build passes; local officials now see only LOCAL-applicable compass topics*
*Updated: 2026-05-05 — Phase 25-01 complete (executed after 25-02); migration 20260505000001_phase25_scope_audit.sql applied; Affordable Housing local scope added; all 5 target topics confirmed has_local=true; plan's topic_keys corrected (housing/childcare/data-centers)*
*Updated: 2026-05-05 — Phase 25 complete (2/2 plans); verification 4/4 passed; SCOPE-02 satisfied (all 5 LOCAL-applicable topics have local scope tags); RETIRE-01 kept both (42 politician answers intact); districtScope filtering live in essentials frontend; v3.1 milestone COMPLETE*
*Updated: 2026-05-06 — v3.2 Legal Candidate Evaluation Framework roadmap created; Phases 26-31 defined; 19/19 requirements mapped; Phase 26 Campaign Finance Gap Closure is next*
*Updated: 2026-05-07 — Phase 26 complete (1/1 plans); 16 active LA City race candidates seeded with la_socrata sources (13 auto + 3 manual); 15 legitimate_no_filers documented (9 County BOS candidates outside City Ethics jurisdiction + 6 City/Mayoral no-committees); Morgan Oyler deferred (null cmt_id in Socrata); 6 bad --fix source rows + 358 contaminated contributions cleaned up; run-la-socrata-ingest.ts created for ingest-only re-runs; FINANCE-01 + FINANCE-02 satisfied; Estuardo Mazariegos shared cmt_id issue (1479131 also linked to Ross J. Maza) documented as open item; Phase 27 Judicial Compass DB is next*
*Updated: 2026-05-07 — Phase 27-01 complete; migration 112 applied to production: judicial_role nullable TEXT column on inform.compass_topics (CHECK judge|city_attorney_da); chk_role_scope_tier expanded to include 'judicial'; migration 113 Part A authored with 4 universal topics (judicial-criminal-justice, judicial-access-to-justice, judicial-government-deference, judicial-transparency) + 20 stances + 4 role rows (judicial_role=NULL); _apply-migration-112.ts created and run ("All checks passed."); migration 113 not yet applied — Plan 27-02 extends file, Plan 27-03 applies*
*Updated: 2026-05-07 — Phase 27-02 complete; migration 113 Part B appended: Topics 5-6 judge-specific (judicial-interpretation, judicial-bail-pretrial) + Topics 7-8 city_attorney_da-specific (judicial-prosecution-priorities, judicial-police-accountability); migration 113 now complete with 8 topics + 40 stances + 8 role rows; all idempotent via topic_key guard; Plan 27-03 applies to production*
*Updated: 2026-05-06 — Phase 27 complete (3/3 plans); migration 113 applied (8 topics, 40 stances, 8 judicial role rows, 0 contamination); compassService.ts applies_judicial exposed with false fallback; Profile.jsx JUDICIAL/NATIONAL_JUDICIAL → 'judicial' scope (before NATIONAL_ catch-all); CompassCard.jsx maps 'judicial' → 'applies_judicial' key; TypeScript + build pass; verified 6/6; COMPASS-01/02/03/04 complete; Phase 28 next*
*Updated: 2026-05-07 — Phase 27-03 complete; migration 113 applied (8 topics + 40 stances + 8 judicial role rows confirmed); compassService.ts applies_judicial flag live (false fallback); Profile.jsx JUDICIAL/NATIONAL_JUDICIAL→'judicial' scope (ordered before NATIONAL_ prefix); CompassCard.jsx four-arm ternary 'judicial'→'applies_judicial'; TypeScript + build pass; Phase 27 COMPLETE*
*Updated: 2026-05-07 — Phase 28-01 complete; JudicialCompassSection.jsx built (burnt orange, scale icon, empty notch UI, deriveJudicialSubRole, filterJudicialTopics); compassService.ts judicial_role in SELECT (deployed to Render); Profile.jsx isJudge guard removed + JudicialCompassSection wired; CandidateProfile.jsx JUDICIAL arm added before NATIONAL_ check; frontend deployed to Render; COMPASS-05 satisfied; Phase 28-02 next*
*Updated: 2026-05-07 — Phase 28-02 complete; migration 20260506000001_phase28_judicial_communities.sql applied via supabase db push (clean, no repair); 8 judicial connect.communities seeded (simplified plain-language descriptions); fc_community_slug populated on all 8 judicial compass_topics rows; 4/4 verification queries pass; COMPASS-06 satisfied; Phase 28 COMPLETE*
*Updated: 2026-05-07 — Phase 28 complete (2/2 plans); verification 4/4 passed; COMPASS-05 + COMPASS-06 satisfied; JudicialCompassSection live with burnt orange treatment; judicial sub-role filtering (judge→6 topics, DA/City Attorney→6 topics, fallback→8); database.types.ts patched with judicial_role column; 8 companion communities live; Phase 29 Bar Evaluation Data is next*
*Updated: 2026-05-09 — Phase 29 complete (3/3 plans); migration 117 applied (11 Superior Court races + 25 challenger politicians + 32 LACBA evaluations including 4 City Attorney "not evaluated"); migration 118 applied (2 Connolly CJP admonishments with plain-language descriptions — description field standard established); BarEvaluationSection.jsx built + deployed (LACBA rating badges + CJP discipline cards, description as primary voter-facing content); judicialRecord gate fixed from broken is_judicial to isLegalCandidate; BAR-01/02/03/04 satisfied; verification 4/4 passed; Phase 30 Legal Candidate Stance Research is next*
*Updated: 2026-05-09 — Phase 29-01 complete; migration 117 applied to production; 11 LA Superior Court races (Offices 2/14/64/65/66/81/87/116/131/176/181) seeded for June 2026 election; 25 challenger politicians created; 28 race_candidates rows linked; 32 judicial_evaluations rows (28 LACBA-rated + 4 City Attorney not-evaluated); fully idempotent (WHERE NOT EXISTS guard for politicians); BAR-01 data foundation satisfied; Phase 29-02 next (CJP disciplinary records + BarEvaluationSection UI)
*Updated: 2026-05-09 — Phase 29-02 complete; migration 118 applied; 2 Connolly CJP admonishment rows (2016-03-23 + 2021-04-02) with plain-language voter-facing descriptions; scope narrowed from plan (no bulk State Bar/CJP N/A rows — zero voter signal); plain-language description standard established; Phase 29 COMPLETE (2/2 plans)*
*Updated: 2026-05-09 — Phase 29-03 complete; BarEvaluationSection.jsx created (LACBA color-coded rating badges + CJP discipline cards); is_judicial gate fixed to isLegalCandidate in Profile.jsx + CandidateProfile.jsx; both pages import + render BarEvaluationSection; build pass; pushed 93df9b0 to main (Render auto-deploy); BAR-04 satisfied; Phase 29 COMPLETE (3/3 plans)*
*Updated: 2026-05-09 — Phase 30-01 complete; Ashouri 6/6 judicial compass topics placed (no not-found); migration 119 applied to production; values: access-to-justice=1, criminal-justice=2, govt-deference=1, transparency=2, police-accountability=1, prosecution-priorities=1; inference-flagged: govt-deference + transparency; primary source: Patch Q&A; STANCE-01 partially satisfied (Ashouri done); Phase 30-02 (McKinney) next*
*Updated: 2026-05-09 — Phase 30-02 complete; McKinney 5/6 judicial compass topics placed (judicial-transparency not found — no court proceedings statements in any source); migration 120 applied to production; values: prosecution-priorities=4, criminal-justice=4, police-accountability=4, access-to-justice=3, government-deference=3 (inferred); LA Forward/DSA-LA characterizations excluded per rules; Patch Q&A + mckinney4la.com/issues are highest-quality sources; STANCE-02 satisfied; Phase 30-03 (Roy) next*
*Updated: 2026-05-10 — Phase 30-03 complete; Roy 5/6 judicial compass topics placed (judicial-transparency not found — same as McKinney; 'accountability and integrity' framing is about office culture, not court proceedings); migration 121 applied to production; values: prosecution-priorities=2, criminal-justice=2, police-accountability=2, access-to-justice=1, government-deference=1 (inferred); STANCE-03 satisfied; Phase 30 COMPLETE (3/3 plans); phase-wide: Ashouri 6/6, McKinney 5/6, Roy 5/6; 18 judicial context rows; all 15 placed stances have source citations (n_sources >= 3)*
*Updated: 2026-05-09 — Phase 31-01 complete; identify-legal-donors.ts built (32 UUIDs from migration 117, --probe + extraction modes); court-research-input.json written; 4 CAs with data (Feldstein Soto=2631 rows, Roy=1270, McKinney=125, Ashouri=71); 28 judge challengers skipped (no confirmed contributions); top firms: Ashouri=Life Sciences Patent Law Firm ($300), McKinney=LA County DA's Office ($5,400), Roy=California DOJ ($41,053), Feldstein Soto=City of Los Angeles ($75,774); deterministic on re-run; ESM __dirname fix applied*
*Updated: 2026-05-09 — Phase 31-04 complete (pivot from Donor-Court Conflicts to Legal Donor Activity — Option C); getLegalDonorFirms() + /legal-donor-activity route (backend commit 43c757b, deployed to Render); fetchLegalDonorActivity() + LegalDonorActivitySection.jsx + CandidateProfile.jsx wired (frontend commit e466d42, deployed to Render); isLegalCandidate gate: JUDICIAL/NATIONAL_JUDICIAL/city attorney/district attorney only; smoke test: Ashouri 200 with 8 firms; no migration needed; Phase 31 COMPLETE (4/4 plans — Plans 02/03 skipped by Option C pivot)*
*Updated: 2026-05-09 — Phase 31 COMPLETE; isLegalCandidate bug fixed for challengers (position_name fallback — commit 6828d46); Andrej Selivra duplicate merged + autoUpsertToRaceCandidates patched with stripMiddleInitials() + regexp_replace stored-name normalization (backend commit c9736d0); v3.2 Legal Candidate Evaluation Framework COMPLETE (6/6 phases: 26 Campaign Finance Gap, 27 Judicial Compass DB, 28 Judicial Compass UI, 29 Bar Evaluation Data, 30 Stance Research, 31 Legal Donor Activity)*
*Updated: 2026-05-12 — Phase 18 Plans 02+03 complete; McKinney 6 rows + Allen 3 rows + Frisco 8 rows + Richardson 2 rows ingested; Murphy/Celina/Prosper documented sparse; Phase 18 total: 26 rows across 19 Collin County TX politicians*
*Updated: 2026-05-12 — Phase 18-02 complete; 6 McKinney housing stances (backend commit 28a0ae8) + 3 Allen stances (backend commit 11d3a3e) ingested; Phase 18 total: 16 rows; Michael Jones + 5 Allen members correctly absent; apply script path pattern (path.join __dirname) documented*
*Updated: 2026-05-12 — Phase 18 COMPLETE (4/4 plans); compass renders on John B. Muns (Plano), Bill Cox (McKinney), Michael Schaeffer (Allen) — human verified; 26 rows across 19 politicians (Plano 7, McKinney 6, Allen 3, Frisco 8, Richardson 2); v3.0 milestone shipped — all Phases 12-21 complete; follow-up items: office title display (Mayor→"City Council"), city name header, Maria Tu pre-existing stances*
*Updated: 2026-05-12 — Phase 33-01 COMPLETE; LOCAL_LENS_TOPICS (8 verified UUIDs) + saveLocalLensState/loadLocalLensState added to compass.js; localLensActive state + toggleLocalLens() + loadCompassData re-apply guard + live-sync guard wired into CompassContext; ref pattern for stable empty-deps callback established; LENS-01/02/03/04/05 all satisfied; build passes; Phase 34 Mini Compass Tile is next*
*Updated: 2026-05-13 — Phase 34-02 COMPLETE; MiniCompass.jsx created (138 lines); pure-presentational label-free RadarChartCore tile; INNER_SVG_SIZE=200 with CSS-constrained 120px container; labelFontSize=0+tightFit=true+padding=10; silent absence (return null) when <3 spokes; container opacity 0.7 when hasReplacedSpokes&&localLensActive; overflow:hidden added for circular clip; build passes; commit b14d0ec; Plan 34-03 ElectionsView wiring is next*
*Updated: 2026-05-13 — Phase 34 COMPLETE (3/3 plans); MiniCompass overlaid on candidate tiles in Elections + Representatives pages (size=190px); portal tooltip (createPortal to document.body, getScreenCTM() dot hit-detection); ringColor=transparent removes guide rings; transparent event-capture overlay suppresses built-in SVG tooltip; wrapper div borderRadius:10px+overflow:hidden clips gradient to card boundary; CompassKey dark mode + "Topic=no stance" hidden via CSS; race deduplication by candidate-ID set; auto-enable compass for calibrated users (localStorage null check); commits fca5adc–82ca916; Phase 35 Hover Modal is next*
*Updated: 2026-05-14 — Phase 36-01 COMPLETE; CompassControlsBar.jsx created (62 lines, pure presentational); extracted from Elections.jsx lines 226-271 + Results.jsx lines 1526-1575; showStanceButtons >= 3 (Results.jsx defensive pattern); marginBottom:-70 load-bearing preserved; no compassMode prop (parent gates render); build passes; commit a287283; Plans 36-02/03 will wire consumers*
*Updated: 2026-05-14 — Phase 36-03 COMPLETE; Results.jsx inline sticky controls block (~50 lines) replaced with <CompassControlsBar />; controls block kept OUTSIDE activeView ternary (covers both Representatives + Elections tabs); (activeQuery || browseResults) guard preserved; CompassKey import removed; all 6 human verification tests passed; DEFAULT-02/03/05 satisfied; CTRL-01/02 satisfied; Min/Max Heroicon SVG update applied to CompassControlsBar.jsx by orchestrator (commit 77b3d77); task commit 27d8385*
*Updated: 2026-05-14 — Phase 36-02 COMPLETE (SUMMARY created); Elections.jsx compassMode refactored from pure derivation to stateful localStorage null-check auto-enable; handleCompassModeChange + auto-enable useEffect added; Compass checkbox added to filter controls row; inline 47-line controls block replaced by <CompassControlsBar />; 5/5 human checkpoint tests passed; DEFAULT-01/DEFAULT-04 satisfied; Heroicon SVG fix applied to shared CompassControlsBar.jsx (77b3d77); task commits 052fd81 + a088139; Phase 36 COMPLETE (3/3 plans)*
*Updated: 2026-05-15 — v5.0 milestone roadmap created; 10 phases (37-46), 28/28 requirements mapped; Phase 37 Playbook Draft is first phase*
*Updated: 2026-05-16 — Phase 37-01 COMPLETE; LOCATION-ONBOARDING.md cold-start checklist (8 steps, Cambridge annotations) + 5 phase templates in .planning/templates/ (db-foundation, officials-seed, headshots, discovery-setup, compass-stances); PLAY-01 + PLAY-02 satisfied; Phase 38 MA Geofences is next*
*Updated: 2026-05-16 — Phase 38-01 COMPLETE; MA registered in load-state-tiger-boundaries.ts (STATE_LAYER_ALLOWLIST + STATE_CITY_ASSERTIONS + STATE_RUN_MAKEVALID); MTFCC pre-flight assertion added; all 5 layers loaded: G4020=14, G4110=58, G5200=9, G5210=40, G5220=160; Cambridge geo_id='2511000' confirmed; 0 invalid geometries; place count corrected 351→58 (MA has 58 G4110 cities; 293 towns are G4040 COUSUB); 38-02 smoke test is next*
*Updated: 2026-05-16 — Phase 38-02 COMPLETE; PostGIS spot checks verified for 4 Cambridge addresses; MA-05/MA-07 split confirmed (north=2505, east/south=2507); all Cambridge addresses return Cambridge city G4110=2511000 not Somerville; Middlesex intersects 8 G5200 districts; verify-ma-tiger-import.sql + smoke-ma-geofences.ts created; Phase 38 COMPLETE; Phase 39 MA politicians is next*
*Updated: 2026-05-16 — Phase 39-01 COMPLETE; migration 150 applied; Commonwealth of Massachusetts government row + MA Senate + MA House of Representatives chambers seeded*
*Updated: 2026-05-16 — Phase 39-02 COMPLETE; migration 151 applied; 40 MA state senators + 40 STATE_UPPER offices seeded; 25D11 Vanna Howard vacancy confirmed*
*Updated: 2026-05-16 — Phase 39-03 COMPLETE; migration 152 applied via generate_ma_house.ps1 generator script; 158 named MA house reps + 160 STATE_LOWER offices seeded; 2 vacancies (25042 1st Franklin, 25075 17th Middlesex); Cambridge reps Rogers/Decker/Connolly have email_addresses; idempotent; generator script pattern established for future state legislative bodies; Phase 39 COMPLETE; Phase 40 MA Executives + Federal Officials is next*
*Updated: 2026-05-16 — Phase 40 COMPLETE (4/4 plans); migrations 154-156 applied; 6 MA executives + 11 MA federal officials seeded; 17 headshots (600×750) uploaded to Supabase Storage; Cambridge MA-05/MA-07 split verified; MADB-04/FED-01/FED-02 satisfied; next migration is 157; Phase 41 Cambridge City Structure is next*
*Updated: 2026-05-17 — Phase 41-01 COMPLETE; migration 157 applied; election_method column added to essentials.chambers; Cambridge LOCAL government (geo_id=2511000) + City Council (9 seats, stv_proportional) + School Committee (6 seats, stv_proportional) seeded; idempotency verified (gov count=1, chamber count=2 on re-run); government UUID=6f7d55bc; City Council UUID=b4b8c0a1; School Committee UUID=41846a49; next migration is 158*
*Updated: 2026-05-17 — Phase 41-02 COMPLETE; migration 158 applied; 17 Cambridge offices seeded (9 City Councillor + 1 Mayor is_appointed=true + 1 City Manager is_appointed=true + 6 School Committee Member); all politician_id=NULL; "Councillor" double-L verified; plan docs had arithmetic error (said 16, correct count is 17); next migration is 159*
*Updated: 2026-05-17 — Phase 41-03 COMPLETE; migration 159 applied; 16 Cambridge incumbents seeded; unique index on offices.politician_id dropped (dual-office pattern for Council-Manager cities); Siddiqui dual-office (Mayor primary, Councillor secondary); Yi-An Huang City Manager; all 17 offices assigned; Cambridge added to Landing.jsx COVERAGE_AREAS (browseGovernmentList=['2511000']); Phase 41 COMPLETE (3/3 plans); next migration is 160*

### Phase 41 Notes

- essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard for idempotent inserts (ON CONFLICT (geo_id) would fail)
- election_method TEXT column added to essentials.chambers in migration 157 — first usage for Cambridge STV elections
- Cambridge slug auto-generated: cambridge-city-council / cambridge-school-committee (GENERATED ALWAYS column — never include in INSERT)
- Cambridge total offices = 17 (9 Councillor + 1 Mayor + 1 City Manager + 6 School Committee), NOT 16 — plan docs had arithmetic error
- Cambridge total politicians = 16 (Siddiqui fills 2 offices but is 1 politician)
- Cambridge Mayor is Sumbul Siddiqui (NOT McGovern — ROADMAP.md had outdated info); Siddiqui was unanimously elected Mayor by council on 2026-01-05 (third term)
- Dual-office pattern: unique index on essentials.offices.politician_id was dropped in migration 159 to support Council-Manager structure where Mayor+Councillor can be the same person
- Non-unique index on offices.politician_id created for join performance after unique index drop
- Siddiqui's office_id = Mayor (primary display), City Councillor office also wired to her politician_id
- Cambridge government UUID: 6f7d55bc-d50c-47ff-b521-5767d1f763fb
- City Council chamber UUID: b4b8c0a1-2658-4df4-9196-9646c99d173c
- School Committee chamber UUID: 41846a49-e5d5-460d-b2c2-0f4f8130b949
- Next migration is 160

### Phase 44 Notes

- Migration 162 applied 2026-05-17: 2026 MA primary (2026-09-01) + general (2026-11-03) election rows; 2nd Middlesex Democratic primary race; 5 candidates (Azeem politician_id=d2358e54, is_incumbent=false; Barber/Hopcroft/McLaughlin/Uyterhoeven); WHERE NOT EXISTS guards for idempotency
- Azeem is NOT incumbent — open seat (Patricia Jehlen retiring); is_incumbent=false is correct
- Migration 163 applied 2026-05-17: Markey Senate primary (Markey/Moulton/Gates/Rikleen) + general (Markey/Bech/Deaton), office_id=NULL statewide; 7 Cambridge-area district general races with correct office_ids
- ON CONFLICT for general races uses partial index syntax: ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL
- 25D27 general race has 0 candidates — intentional (open seat, winner of Sep primary TBD)
- Migration 164 applied 2026-05-17: 2 MA discovery_jurisdictions rows (geoid='25', 2026-09-01 + 2026-11-03, would_be_swept=true); 2027 Cambridge Municipal Election (2027-11-02, city, general); Cambridge discovery row (geoid='2511000', 2027-11-02, would_be_swept=false)
- discovery_jurisdictions unique constraint: UNIQUE (jurisdiction_geoid, election_date)
- Discovery cron horizon: election_date <= CURRENT_DATE + INTERVAL '180 days'; Cambridge 2027 intentionally outside
- Next migration after 164 is 165
- Phase 44 verified 5/5: general election exists, Azeem primary with 5 candidates + linked politician_id, MA discovery armed, Cambridge races with candidates, 2027 placeholder + discovery row

## Session Continuity

Last session: 2026-05-18
Stopped at: Phase 47 Plan 01 complete — v5.0 tech debt cleanup (Elections.jsx deleted, Cambridge shortcut in Results.jsx, 39-VERIFICATION.md created, 42-VERIFICATION.md updated)
Resume file: None
