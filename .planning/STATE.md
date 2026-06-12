---
gsd_state_version: 1.0
milestone: v13.0
milestone_name: Massachusetts Expanded
status: Ready to execute
last_updated: "2026-06-12T19:40:56.813Z"
progress:
  total_phases: 10
  completed_phases: 7
  total_plans: 33
  completed_plans: 31
  percent: 73
---

# State

## Current Position

Phase: 114 (ma-stances-house-wave-2) — IN PROGRESS (2/5 plans complete)
Last completed: Phase 114 Plan 02 — MA House Wave 2 HD-101–HD-120 COMPLETE (migrations 516-535, 20 reps, ~71 new stances, uncited=0 unpaired=0, 2026-06-12)
Next migration: 536

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-04 after v10.0 milestone archival)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Phase 108 — boston-deep-seed

## v13.0 Roadmap Summary

| Phase | Name | Requirements | Goal |
|-------|------|--------------|------|
| 107 | MA Town Geofences | MA-GEO-01, MA-GEO-02 | Load 293 G4040 COUSUB town boundaries so any MA address routes |
| 108 | Boston Deep Seed | MA-DEEP-01, MA-DEEP-02, MA-DEEP-03 | Seed Boston city officials + School Committee with headshots |
| 109 | MA Tier 2 Cities | MA-TIER2-01, MA-TIER2-02 | Seed Worcester + 4 Tier 2 city incumbents with best-effort headshots |
| 110 | MA 2026 Elections + Discovery | MA-ELECTIONS-01..04 | Seed MA 2026 elections, 200+ race rows, arm discovery |
| 111 | MA Stances — Execs + Federal | MA-STANCES-01, MA-STANCES-02 | Evidence-only stances: 6 execs + 11 federal (17 total, sequential) |
| 112 | MA Stances — State Senate | MA-STANCES-03 | Evidence-only stances: 40 MA state senators (sequential) |
| 113 | MA Stances — House Wave 1 | MA-STANCES-04 (Wave 1) | Evidence-only stances: MA House reps HD-01 through HD-80 |
| 114 | MA Stances — House Wave 2 | MA-STANCES-04 (Wave 2) | Evidence-only stances: MA House reps HD-81 through HD-160 — closes MA-STANCES-04 |
| 115 | MA Playbook Retrospective | MA-RETRO-01 | COUSUB GOTCHAs + Boston patterns + Cities Onboarded + v13.0 close |

## Key MA Facts (carry into plans)

- FIPS code: 25 (state='25' in geofence_boundaries; districts.state='ma' for STATE/COUNTY tiers, 'MA' for NATIONAL)
- 58 G4110 cities already loaded (v5.0) — assert, do not reload
- 293 G4040 COUSUB towns to add in Phase 107
- Boston geo_id='2507000' (G4110, already in geofences)
- MA legislature: 40 senators (40 SLDU districts) + 160 house reps (160 SLDL districts) — all seeded with offices in v5.0
- MA 2026: primary 2026-09-02, general 2026-11-03
- Stances scope: 6 execs + 11 federal + 40 senators + 160 house = 217 total; split across Phases 111–114
- Stances research: ONE at a time — never parallel; per-individual migration files; apply immediately
- Next migration: 496 (last Phase 113 migration was 495 — Rogers stances)

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

- **[ME — TIME-SENSITIVE]** Phase 90 Plan 01: After ME June 9 primary results, write migration adding D primary winners to US Senate general + ME-01 general + ME-02 general race_candidates rows
- **[CA operational note]** Phase 90 Plan 02: Update lavote.gov discovery_jurisdictions election ID for CA November 2026 general

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-06-12T00:00:00.000Z
Stopped at: Completed 114-02-PLAN.md (20 reps HD-101–HD-120, migrations 516-535)
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
