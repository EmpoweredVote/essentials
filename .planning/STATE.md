# State

## Current Position

Phase: 25 — Scope Audit + Retirement (in progress)
Plan: 2 of ? (plans 25-01 + 25-02 complete)
Status: In progress — Phase 25 scope tags corrected + scope filtering wired; any remaining plans next
Last activity: 2026-05-05 — Completed 25-01-PLAN.md (scope audit migration applied; Affordable Housing local scope added)

v3.0 remaining: Phase 17 (Headshots — 4 plans) + Phase 18 (Compass Stances — TBD plans) still pending
v3.1 progress: [████████░░░░░░░░░░░░] Phases 22 + 23 + 24 + 25-01 + 25-02 done

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30 after v3.0 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v3.0 — Collin County, TX Coverage (greenfield TX data expansion)

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
- Migration numbering continues from 099 (highest existing is 099_collin_county_discovery_jurisdictions.sql) — next is 100
- TX election date confirmed: 2026-05-02 (NOT May 3 as CONTEXT.md stated — all official sources confirm May 2)
- McKinney email pattern: role-based `{role}@mckinneytexas.org` — mayor, AtLarge1, AtLarge2, District1–4
- email_addresses = NULL is acceptable when CloudFlare or other protection prevents email verification — bio URL (urls[]) satisfies 80% contact coverage target

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)

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
- Migration numbering: next migration is 108 (107 applied 2026-05-04: chambers name_formal + politicians office_id backfill for TX state/federal officials)
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
