---
gsd_state_version: 1.0
milestone: v11.0
milestone_name: Maryland Essentials
status: executing
last_updated: "2026-06-06T06:42:59.069Z"
last_activity: 2026-06-06 -- Phase 95 planning complete
progress:
  total_phases: 10
  completed_phases: 4
  total_plans: 19
  completed_plans: 17
  percent: 40
---

# State

## Current Position

Phase: 95
Plan: 01 COMPLETE
Status: Executing (Plan 02 next)
Last activity: 2026-06-06 -- Phase 95 Plan 01 complete — St. Mary's County + Leonardtown seeded

Progress: [█████████░] 89%

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-04 after v10.0 milestone archival)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Phase 95 — leonardtown / st. mary's county deep seed

## v11.0 Roadmap Summary

| Phase | Name | Requirements | Goal |
|-------|------|--------------|------|
| 90 | Post-Election Follow-up + MiniCompass UI | POST-ELECTION-01/02, UI-01/02 | ME primary winners + CA election ID + MiniCompass compact overlay |
| 91 | MD TIGER Geofences | MD-GEO-01..06 | All MD address tiers routable via PostGIS |
| 92 | MD State Government DB | MD-GOV-01/02, MD-GOV-06 (execs) | State of Maryland row + 4 exec chambers + officials + headshots |
| 93 | MD Legislature + Federal Officials | MD-GOV-03/04/05, MD-GOV-06 (legislature) | 47 senators + 141 delegates + 10 federal officials seeded |
| 94 | MD Headshots | MD-GOV-06 | 100% headshot coverage verified + gap-filled |
| 95 | Leonardtown / St. Mary's County Deep Seed | MD-DEEP-01..03 | County commission + Leonardtown town officials seeded |
| 96 | MD 2026 Elections + Discovery + Landing | MD-ELECTIONS-01..03 | 198 race rows + discovery armed + Landing.jsx entry |
| 97 | MD Compass Stances — Executives + Senators | MD-STANCES-01/02 | 4 exec + 47 senator stances (Wave 1) |
| 98 | MD Compass Stances — House Delegates | MD-STANCES-03/04 | 141 delegate stances (Wave 2) + compass render verified |
| 99 | MD Verification + Playbook Retrospective | (cross-cutting all 26) | All 26 reqs verified + playbook updated + v11.0 closed |

## Key MD Facts (carry into plans)

- FIPS code: 24 (state='24' in geofence_boundaries; districts.state='md' for STATE tiers, 'MD' for NATIONAL)
- 47 SLDU senate districts (1 senator each); 141 SLDL house delegate positions across 47 districts (multi-member, typically 3; some A/B subdistricts)
- 24 G4020 counties; 8 congressional districts
- Constitutional officers (voter-elected): Governor, LG, AG, Comptroller
- State Treasurer: elected by General Assembly → is_appointed_position=true (ME/OR pattern)
- Stances research scope: 4 exec + 47 senators + 141 delegates = 192 officials
- Next migration: 278
- St. Mary's County geo_id='24037' CONFIRMED; Leonardtown geo_id='2446475' CONFIRMED
- Migrations 276 (St. Mary's County) + 277 (Leonardtown) applied; MD-DEEP-01 and MD-DEEP-03 data side complete
- Leonardtown: LOCAL_EXEC for Mayor + LOCAL for 5 council members; mtfcc=NULL on both district rows (migration 246 pattern)
- D-05 confirmed Option A: all 5 St. Mary's commissioners share one COUNTY district (county-wide election model)

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

### Pending Todos

- **[ME — TIME-SENSITIVE]** Phase 90 Plan 01: After ME June 9 primary results, write migration adding D primary winners to US Senate general + ME-01 general + ME-02 general race_candidates rows
- **[CA operational note]** Phase 90 Plan 02: Update lavote.gov discovery_jurisdictions election ID for CA November 2026 general

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-06-06T06:42:59.042Z
Stopped at: Phase 95 context gathered
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
