---
gsd_state_version: 1.0
milestone: v14.0
milestone_name: MA Tier 3 City Coverage
status: executing
last_updated: "2026-06-15T22:00:00.000Z"
last_activity: 2026-06-15 -- Phase 123 Plan 04 complete — Ward councillors Choquette(W1)/Pemberton(W2)/Oliver(W3)/Baptiste(W4)/Lopes(W5)/Pereira(W6) (migrations 653-658); 3 stance rows; 0 unpaired, 0 uncited; 16 total NB stances across all 12 officials
progress:
  total_phases: 9
  completed_phases: 6
  total_plans: 26
  completed_plans: 26
  percent: 69
---

# State

## Current Position

Phase: 123 — MA Tier 3 Stances Wave 2
Plan: 05 (next)
Status: Executing — Plan 04 complete
Last activity: 2026-06-15 -- Phase 123 Plan 04 complete — Ward councillors Choquette(W1)/Pemberton(W2)/Oliver(W3)/Baptiste(W4)/Lopes(W5)/Pereira(W6) (migrations 653-658); 3 stance rows; 0 unpaired, 0 uncited; 16 total NB stances across all 12 officials
Next migration: 659

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-14 after v13.0 milestone close)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v14.0 — MA Tier 3 City Coverage

## v14.0 Roadmap Summary

| Phase | Goal | Requirements | Status |
|-------|------|--------------|--------|
| 117 — Newton Deep Seed | Mayor + council + school committee officials + headshots | NEWTON-01, NEWTON-02 | Planned (3 plans) |
| 118 — Somerville Deep Seed | Mayor + City Council + School Committee officials + headshots | SOMERVILLE-01, SOMERVILLE-02 | Not started |
| 119 — Lynn Deep Seed | Mayor + City Council officials + headshots | LYNN-01, LYNN-02 | Planned (3 plans) |
| 120 — New Bedford Deep Seed | Mayor + City Council officials + headshots | NEWBED-01, NEWBED-02 | Planned (2 plans) |
| 121 — Fall River + Medford + Waltham Deep Seeds | Officials + headshots for three smaller Tier 3 cities | FALLRIV-01/02, MEDFORD-01/02, WALTHAM-01/02 | Not started |
| 122 — MA Tier 3 Stances Wave 1 | Evidence-only stances: Newton + Somerville | NEWTON-03, SOMERVILLE-03 | Not started |
| 123 — MA Tier 3 Stances Wave 2 | Evidence-only stances: Lynn + New Bedford | LYNN-03, NEWBED-03 | Planned (5 plans) |
| 124 — MA Tier 3 Stances Wave 3 | Evidence-only stances: Fall River + Medford + Waltham | FALLRIV-03, MEDFORD-03, WALTHAM-03 | Not started |
| 125 — MA Tier 3 Playbook Retrospective | LOCATION-ONBOARDING.md GOTCHAs + 7 Cities Onboarded rows | MA-RETRO-02 | Not started |

## Key MA Facts (carry into plans)

- FIPS code: 25 (state='25' in geofence_boundaries; districts.state='ma' for STATE/COUNTY tiers, 'MA' for NATIONAL)
- 58 G4110 cities already loaded (v5.0) — assert, do not reload; 293 COUSUB towns loaded (v13.0 Phase 107)
- Boston geo_id='2507000' (G4110); Cambridge geo_id='2511000'; Worcester geo_id='2582000'
- All 7 Tier 3 cities are G4110 and already in geofences (no new TIGER load needed)
- Newton geo_id=2545560; Somerville geo_id=2562535; Lynn geo_id=2537490
- New Bedford, Fall River, Medford, Waltham: verify geo_ids from DB before seeding
- MA legislature: 40 senators + 160 house reps — all seeded with offices in v5.0; all 217 have stances (v13.0)
- MA 2026: primary 2026-09-08, general 2026-11-03
- MA city elections: typically odd-year (2025, 2027) — no city-level race rows needed for most Tier 3 cities
- Stances research: ONE at a time — never parallel; per-individual migration files; apply immediately
- Next migration: 578

## Accumulated Context

### Key Decisions (carry forward)

- MD TIGER loader scaffold complete: STATE_LAYER_ALLOWLIST/STATE_CITY_ASSERTIONS/STATE_RUN_MAKEVALID all have MD entry; EXPECTED_MD_MTFCC confirmed: cd119=8, sldu=47, sldl=71, place=157, county=24
- MD geofence_boundaries loaded (Plan 02/03 complete): 307 rows total — G4020=24, G4110=157, G5200=8, G5210=47, G5220=71
- Baltimore City dual-tier (D-01): geo_id='2404000' (G4110 incorporated place) AND geo_id='24510' (G4020 independent city-county) — CONFIRMED present in production DB
- districts.state casing confirmed per D-07: md/COUNTY=24, md/STATE_LOWER=71, md/STATE_UPPER=47, MD/NATIONAL_LOWER=8
- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Legislature-elected offices = is_appointed_position=true, zero race rows (ME/OR pattern; MD Treasurer same)
- computeDisplaySpokes() is the single source of truth for compass spoke selection; import from src/lib/compass.js
- politician_images.type must be 'default' (not 'headshot') — UI filters with .find(img => img.type === 'default')
- slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS pattern required
- Jurisdictions processed sequentially (never parallel) — exhausts Claude API rate limit quota
- STATE_EXEC district_id should be empty string (not named string) for multi-position districts (OR lesson)
- TIGER congressional shapefile key: always browse census.gov directory first; key may be 'cd119' not 'cd'

- Maryland Senate chamber name_formal='Maryland State Senate'; House of Delegates name_formal='Maryland House of Delegates' (self-qualifying, OR House precedent)
- Migration 272 applied: 2 MD legislative chambers seeded under government_id 85973301-a859-45c8-9b58-4a14ab7b44ab
- Multi-member NOT EXISTS guard for delegates: (district_id, politician_id) NOT (district_id, chamber_id) — critical for 3-office-per-whole-district model
- Migration 274 applied out-of-sequence (after 275): 141 MD delegates seeded; Supabase tracks by name; STATE.md counter (276) remains correct
- District 42A confirmed vacant (2026-06-05); seeded with is_vacant=true placeholder
- Joseline Pena-Melnyk (HD-21, Speaker) has n-tilde encoded as [char]0x00F1 in generator
- MD headshots use politician_photos bucket (NOT 'politician-headshots') + {politician_id}-headshot.jpg path — project standard
- mgaleg headshot URL discovery: always scrape roster page HTML for img src; HEAD probing alone misses higher suffixes (jackson04, watson04, harris03, young04)
- Compound last names on mgaleg: Lewis Young→young04, Fry Hester→hester01 (uses final word of compound name)
- Delegate headshots complete: 140/140 ingested (0 gaps); jacobs j.jpg has space (URL-encode as %20); pena.jpg for Peña-Melnyk
- mgaleg compound last name pattern varies: White Holland→white01 (first word), Harrison→harrison01 (last word), Palakovich Carr→palakovich01 (first word), Fraser-Hidalgo→fraser01 (first word)
- gen_migration.py generate_migration() groups by name-only (not (name, pid) tuple) — simplified CSV format for MD batches has no politician_id column
- MD exec UUIDs: Moore=21e534c8, Miller=ea9fc2d6, Brown=60329719, Lierman=b26fb5d2, Davis=75378a96
- Migration 282 applied: 5 MD execs, 74 total stances in production (Moore=21, Brown=17, Lierman=16, Miller=15, Davis=5)
- Migration 283 applied: 15 MD senators Batch A (SD-01 through SD-15), 177 stances in production
- Migration 284 applied: 16 MD senators Batch B (SD-16 through SD-31), 258 stances in production; Q2=0 Q3=0 evidence-only=0
- Batch B senator UUIDs confirmed from DB; Smith Jr. CSV quoting fix (comma in name requires quoted field)
- Migration 285 applied: 16 MD senators Batch C (SD-32 through SD-47), 220 stances in production; Q2-C=0 Q3-C=0; Q-PHASE-1=52 rows Q-PHASE-2=0 Q-PHASE-3=0; Phase 97 complete (MD-STANCES-01 + MD-STANCES-02 satisfied); Phase 98 unblocked
- Phase 99 verification sweep confirmed all 22 non-Phase-90 v11.0 requirements PASS against production; Phase 90 items deferred pending Phase 90 Plan 03 execution (see 99-01-VERIFICATION.md)
- Migration 312 applied: Alexandria city government (Mayor Gaskins + 6 council); 7 offices linked to geo_id=5101000
- Migration 313 applied: ACPS school board (9 members under SCHOOL district geo_id=5100090); G5420 geofence inserted directly per D-03
- Migration 314 applied: 7 Alexandria + 9 ACPS headshots in politician_photos bucket; VA-DEEP-03 satisfied; Sandy Marks sourced from alxnow.com (no official portrait yet on city website)

### Pending Todos

- **[MA — active]** v14.0 scope: Newton / Somerville / Lynn / New Bedford / Fall River / Medford / Waltham — all at full Tier 1 depth (officials + headshots + stances). See REQUIREMENTS.md.

- **[ME — RCV PENDING]** Phase 90: ME-02 D nominee not yet declared — RCV tabulation ongoing as of 2026-06-13; frontrunner Joe Baldacci (state senator, Bangor, ~31.5% first-round). Add to ME-02 general race_candidates once AP/official call issued. migration 574 already applied Collins+Platner (Senate) and LePage (ME-02 R).
- **[CA — JULY]** Phase 90: lavote.gov November 2026 general election CandidateList ID not yet published; filing opens mid-to-late July 2026. Update discovery_jurisdictions id=9fd492a8 source_url to new ?id=XXXX at that time.
- **[ME-01 R]** ME-01 Republican primary (Pietrowicz vs Russell) still TBD — add winner to ME-01 general race once called.

### Blockers/Concerns

None — v13.0 complete; v14.0 roadmap defined.

## Session Continuity

Last session: 2026-06-15T22:00:00.000Z
Stopped at: Phase 123 Plan 04 complete — Choquette(1) + Pemberton(0) + Oliver(1) + Baptiste(0) + Lopes(0) + Pereira(1); 3 stance rows; 0 unpaired, 0 uncited; 16 total NB stances (plans 03+04); next is Plan 05
Resume file: None

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 91 P02 | 45m | 2 tasks | 2 files |
| Phase 91 P03 | 20m | 2 tasks | 0 files (DB-only) |
| Phase 91 P04 | 15m | 2 tasks | 0 files (verification-only) |
| Phase 93 P01 | 7m | 1 task | 1 file (272_md_legislative_chambers.sql) |
| Phase 93 P02 | 18m | 2 tasks | 3 files (generate_md_senate.ps1, 273_md_state_senators.sql, _apply-migration-273.ts) |
| Phase 93 P03 | 45m | 3 tasks | 3 files (generate_md_house.ps1, 274_md_delegates.sql, _apply-migration-274.ts) |
| Phase 93 P04 | 20m | 1 task | 1 file (275_md_federal_officials.sql) |
| Phase 93 P05 | 35m | 3 tasks | 1 file (scripts/md_senators_headshots.py) |
| Phase 93 P06 | 60min | 3 tasks | 1 files |
| Phase 95 P01 | 25m | 3 tasks | 4 files |
| Phase 97 P01 | 45m | 3 tasks | 7 files (compass-topics-reference.md, 5 CSVs, 282_md_exec_stances.sql) |
| Phase 97 P03 | 60m | 3 tasks | 17 files (16 CSVs + 284_md_senators_batch_b.sql); 258 stances for SD-16 through SD-31 |
| Phase 97 P04 | 60m | 3 tasks | 17 files |
| Phase 103 P01 | 20m | 3 tasks | 1 files |
| Phase 103 P02 | 25m | 3 tasks | 1 files |
| Phase 103 P03 | 50m | 2 tasks | 2 files |
| Phase 106-va-compass-stances P07 | 35 | 3 tasks | 8 files |
| Phase 106 P08 | 2 days | 3 tasks | 20 files |
| Phase 107 P01 | 25m | 3 tasks | 1 file (107-01-VERIFICATION.md) |
| Phase 109 P06 | 60m | 2 tasks | 2 files (_tmp-ma-tier2-headshots.py, 356_ma_tier2_headshots.sql); 47/59 uploaded |
| Phase 111 P03 | 45m | 3 tasks | 1 file (365_warren_stances.sql); Warren 43 stances applied |
| Phase 111 P04 | 35m | 3 tasks | 1 file (366_markey_stances.sql); Markey 43 stances applied |
| Phase 111 P05 | ~4h | 3 tasks | 5 files (367-371 stances SQLs); 5 reps x 43 stances; multi-session |
| Phase 112 P01 | ~6h | 21 tasks | 20 files (376-395 stances SQLs); 20 senators 25D01-25D20; multi-session; 0 unpaired, 0 uncited |
| Phase 112 P02 | ~4h | 21 tasks | 20 files (396-415 stances SQLs); 20 senators 25D21-25D40; 0 unpaired, 0 uncited |
| Phase 114 P01 | ~3h | 21 tasks | 20 files (496-515 stances SQLs); 20 reps HD-81–HD-100; 289 stances; 0 unpaired, 0 uncited |
| Phase 114 P02 | ~4h | 21 tasks | 20 files (516-535 stances SQLs); 20 reps HD-101–HD-120; 138 DB rows; 0 unpaired, 0 uncited |
| Phase 114 P04 | ~2h | 18 tasks | 18 files (556-573 stances SQLs); 18 reps HD-141–HD-158; 182 DB rows; 0 unpaired, 0 uncited |
| Phase 114 P05 | 35m | 3 tasks | 1 file (114-05-SUMMARY.md); Q1=78 Q2=0 Q3=0; 1778 combined stances; compass APPROVED on Decker HD-81 |
| Phase 116-ma-playbook-retrospective P01 | 4m | 2 tasks | 1 files |
| Phase 118 P01 | 20m | 1 task | 1 file (581_somerville_city_government.sql) |
| Phase 118 P02 | 6m | 1 task | 1 file (582_somerville_school_committee.sql) |
| Phase 118 P03 | 25m | 2 tasks | 2 files (_tmp-somerville-headshots.py, 583_somerville_headshots.sql); 9/12 uploaded |
| Phase 122 P02 | 35m | 2 tasks | 8 files |
| Phase 122 P03 | 22m | 2 tasks | 10 files |
| Phase 122 P04 | ~90m | 3 tasks | 12 files |
| Phase 123 P01 | ~45m | 3 tasks | 2 files (638_mcclain_stances.sql, 639_net_stances.sql); 635-637 verified from prior session; 27 stance rows total |
| Phase 123 P02 | ~30m | 2 tasks | 7 files (640-646 ward councillors); 14 stance rows; 41 total Lynn stances |
| Phase 123 P03 | ~90m | 2 tasks | 6 files (647-652 Mayor+At-Large NB); 13 stance rows; 0 unpaired, 0 uncited |
| Phase 123 P04 | ~60m | 2 tasks | 6 files (653-658 Ward councillors NB); 3 stance rows; Choquette+Oliver immigration=4.0; Pereira economic-development=2.0; 3 blank-spoke officials |

## Decisions

- [Phase ?]: Scioscia (migration 345) had no public record — skipped per D-03/D-04; blank spoke is honest
- [Phase 107]: Verification-only: 293 G4040 rows were loaded in v5.0 (2026-05-19); re-running loader would silently skip via ON CONFLICT DO NOTHING; assert-not-reload is the correct pattern for idempotent TIGER loads
- [Phase 107]: Section-split direction: geofence NOT IN districts is the PASS signal (0 rows); reverse direction yields ~7 expected rows for statewide districts with no polygon (NOT a failure)
- [Phase 107]: G4040 districts join must be state-scoped; global join returns 54 rows from Indiana CCDs (G4040 mtfcc); MA-scoped join confirms 0 rows (writeDistrictRow=false for COUSUB)
- [Phase 109 P06]: Quincy all-GAP — quincyma.gov (Revize CMS) has no headshot images; Lowell City Manager Golden GAP (text-only CM page); Brockton Lally GAP (HTTP 403); Springfield TYPO3 _processed_ URLs accepted; 47/59 total uploaded; migration 356 applied
- [Phase 111 P03]: Warren had 30 stances pre-existing in production (prior session); migration 365 re-upserts all 30 + adds 13 new topics; same supplemental pattern as Galvin (Plan 111-02); total 43 stances, city-sanitation omitted (no federal record)
- [Phase 111 P04]: Markey had 30 stances pre-existing in production (prior session); migration 366 re-upserts all 30 (3 value corrections: climate-change/campaign-finance/social-security) + 13 new topics; total 43 stances, city-sanitation omitted (no federal record)
- [Phase 111 P05]: All 5 House reps (Neal/McGovern/Trahan/Auchincloss/Clark) had 23-30 pre-existing stances; supplemental pattern used; data-centers topic (UUID 4559b513) discovered active in DB but missing from 111-PATTERNS.md — added to all 5; each rep reached 43 total
- [Phase 111 P05]: Neal abortion=4.0 evidence-only from Catholic background; Auchincloss tariffs=1.0 explicit free-trader (outlier for MA delegation); Clark childcare=1.0 signature issue (DNC 2024)
- [Phase 112 P01]: Durant (R, SD-06) + Fattman (R, SD-05) received conservative values 4.0-5.0 with evidence; cannabis-policy topic does NOT exist in inform.compass_topics — removed from Finegold migration; state senate stances applied one-at-a-time per feedback rule
- [Phase 112 P02]: Tarr (R), O'Connor (R), Dooner (R) received conservative values with evidence; Brownsberger authored 2018 MA CJ reform (judicial-criminal-justice=1.0, judicial-bail-pretrial=1.0); Rodrigues = South Coast Rail champion + Ways & Means Chair; Montigny co-authored 2006 MA healthcare reform; 20 senators 25D21-25D40 complete; MA-STANCES-03 fully satisfied
- [Phase 114 P01]: HD-81–HD-100 complete; progressive Camberville reps (Decker/Connolly/Uyterhoeven/Barber) 25-28 stances each; Speaker Mariano (HD-96) 19 stances reflecting centrist-pragmatic leadership positions; 6 reps had pre-existing rows from prior sessions — upserted correctly; pre-existing 3.0 neutral-default rows deferred to cleanup phase
- [Phase 114 P02]: HD-101–HD-120 complete; mix of Norfolk/Plymouth districts; 5 Republican reps (Vaughn, Gaskey, DeCoste, Sweezey, Sullivan-Almeida) received conservative values with evidence; 8 reps had pre-existing rows upserted correctly; malegislature.gov bill sponsorships as sole evidence source; healthcare was most common topic (14/20 reps)
- [Phase 114 P04]: HD-141–HD-158 complete; all-Worcester County batch; 6 Republican reps received conservative values 4.0-5.0 (Berthiaume, Marsi, Frost, Soter, Muradian, McKenna); Hannah Kane treated as moderate R with 3.0 values; 7 reps had pre-existing rows upserted; migration 556 re-applied (existed on disk, 0 DB rows on resume)
- [Phase 114 P05]: Phase-wide verification PASSED; Q1=78 rows, Q2=0 uncited, Q3=0 unpaired, Q4=1778 combined stances; compass render APPROVED on Marjorie Decker HD-81; MA-STANCES-04 FULLY CLOSED (Wave 1 HD-01–HD-80 Phase 113 + Wave 2 HD-81–HD-158 Phase 114)
- [Phase 115]: Boston stances complete; 21 officials attempted (Mayor Wu 27 stances + 13 councillors + 7 SC blank per D-01); stances from bulk migration 574 (prior session) + Wu supplemental 577; Q1=21 rows, Q2=0 uncited, Q3=0 unpaired, Q4=162 total stances; compass APPROVED on Wu (21 topics); MA-STANCES-05 FULLY CLOSED; next migration=578
- [Phase ?]: [Phase 116-01]: MA-RETRO-01 closed: LOCATION-ONBOARDING.md updated with MA Quick Reference block, 2 Cities Onboarded rows (MA state + Boston), and 5 STATE-SPECIFIC MA GOTCHA callouts
- [Phase 118-01]: Somerville city government seeded — migration 581 applied; Mayor Jake Wilson + 11 City Councillors; Jake Wilson public name used (not 'Jacob D. Wilson'); Davis title='City Councilor (Ward 6)' (Council President is internal officer role only); external IDs in ward-number order
- [Phase 116]: v13.0 Massachusetts Expanded closed 2026-06-13; LOCATION-ONBOARDING.md updated with MA Quick Reference, 5 MA-specific GOTCHAs, and Cities Onboarded rows for Massachusetts state + Boston; MA-RETRO-01 satisfied
- [Phase 118-02]: Somerville School Committee seeded — migration 582 applied; TWO ex-officio pattern (Mayor Wilson + Council President Davis) established; back-fill range -2510890001..-2510890007 excludes both city ex-officio external_ids; all 10 post-verification gates passed including Gates (i)+(j) confirming city office_ids intact
- [Phase 118-03]: Somerville headshots complete — migration 583 applied; 9/12 city officials uploaded from somervillema.gov (S3 + /sites/default/files/-2022.jpg patterns); 3 city gaps (Link/Wheeler/Hardt newly-elected Nov 2025); all 7 SC members gap (no individual headshots on SPS site); Pitfall 3 avoided (Emily Hardt stale URL not attempted); SOMERVILLE-01 + SOMERVILLE-02 satisfied; Phase 118 CLOSED
- [Phase 119-01]: Lynn city government seeded — migration 584 applied; Mayor Nicholson + 4 at-large + 7 ward councilors; Alinsug title='City Councilor (Ward 3)' (not Council President); Dr. honorific excluded from Meaney first_name per DB convention; file naming conflict with pre-existing 584_lowell_stances.sql resolved by renaming Lynn file to 584_lynn_city_government.sql
- [Phase 119-02]: Lynn School Committee seeded — migration 585 applied; 6 elected SC members (Ortiz McGrath no hyphen in name; Peña with ñ character); Mayor Nicholson ex-officio via CROSS JOIN pattern; Gate (i) confirmed Mayor LOCAL_EXEC office_id preserved; autocommit pattern (no BEGIN/COMMIT) per Newton 579 analog
- [Phase 122-03]: Newton Wave 3 complete — all 25 Newton officials attempted; Baker (7 stances) richest record from Suffolk Law professor role; 6 thin-record officials (Silber/Block/Farrell/Irish/Malakie/Micley) each received 2 stances (MBTA vote evidence only); 112 total Newton stance rows; 0 unpaired, 0 uncited; psql CLI used for DB access (Supabase MCP not available in restricted executor context)
- [Phase 122-05]: Phase 122 CLOSED — 37 officials (25 Newton + 12 Somerville); 197 total stance rows (migrations 598-634); Q2=0 uncited, Q3=0 unpaired; 14 blank-spoke officials (thin record, correct per evidence-only rule); compass approved on Mayor Laredo (7 stances) + Mayor Wilson (18 DB / 13 displayed — display cap under investigation); NEWTON-03 + SOMERVILLE-03 satisfied; next migration=635
- [Phase 123-01]: Lynn At-Large stances complete — 27 rows for 5 officials (Mayor + 4 At-Large); Net (3 stances) thin record per evidence-only rule; LaPierre public-safety-approach=3.0 (center, combined enforcement+services); all 12 Lynn UUIDs recorded in 123-01-SUMMARY.md for Plans 02-05
- [Phase 122-04]: Somerville Wave 1 complete — all 12 Somerville officials attempted; Wilson (18 stances) richest record from MA State Rep tenure; Ewen-Campen (12) second richest from council resolution authorship; Hardt (2) thin record as Nov 2025 newcomer; 85 total Somerville stance rows; 0 unpaired, 0 uncited; A3 UUID mapping confirmed before any write
- [Phase 119-03]: Lynn headshots complete — migration 586 applied; 12/12 city officials uploaded (11 CivicLive CDN + Mayor from Wikipedia Commons); Wikipedia required WIKIMEDIA_HEADERS descriptive UA (Chrome UA returned 429); MegieMaddrey.png CDN filename confirmed (no hyphen despite DB last_name='Megie-Maddrey'); 6 SC gaps documented per D-01 (SchoolMessenger text-only pages); LYNN-01 + LYNN-02 satisfied; Phase 119 CLOSED
- [Phase 123-02]: All 7 Lynn ward councillors received 2 stances each (housing=2.0 + local-immigration=2.0) — only full-council votes with documented evidence; individual ward-level news quotes absent for other topics; blank spokes correct per evidence-only rule; 41 total Lynn stance rows across all 12 officials; psql CLI used for DB access (mcp__supabase-local not available in sequential executor context)
- [Phase 123-03]: NB is NOT a sanctuary city (no council immigration resolution; police cooperate with ICE per WBSM) — contrast with Lynn which passed 2025 ICE resolution; no local-immigration row for NB at-large councillors; Mitchell public-safety-approach=4.0 from former AUSA (Whitey Bulger task force) background; Burgo proposed rent stabilization ballot question 2023 (direct individual evidence → rent-regulation=2.0); Gomes voted to override Mitchell veto on rent stabilization ballot question; Choquette+Oliver (ward councillors) switched to Republican Party per WBSM — relevant for Plan 04
- [Phase 123-04]: Choquette(W1) + Oliver(W3) both received immigration=4.0 from documented non-citizen police ballot question ("Hiring non-citizens as NBPD officers is not responsible government" — Choquette WBSM quote); Pereira(W6/President) received economic-development=2.0 from renaming Labor&Industry→Economic Development Committee + creating Special Permits & Licensing to cut business wait times; Pemberton(W2) zero-INSERT (new member Nov 2025, <6 months); Baptiste(W4)+Lopes(W5) zero-INSERT (votes documented but no individual attributed policy quotes); NEWBED-03 satisfied; all 12 NB officials complete; 16 total NB stance rows
