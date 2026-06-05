---
gsd_state_version: 1.0
milestone: v11.0
milestone_name: Maryland Essentials
status: ready_to_plan
last_updated: 2026-06-05T18:45:29.283Z
last_activity: 2026-06-05 -- Phase 92 execution started
progress:
  total_phases: 10
  completed_phases: 1
  total_plans: 9
  completed_plans: 8
  percent: 10
stopped_at: Phase 92 complete (2/2) — ready to discuss Phase 93
---

# State

## Current Position

Phase: 93
Plan: Not started
Status: Ready to plan
Last activity: 2026-06-05

Progress: [█████████░] 86%

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-04 after v10.0 milestone archival)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Phase 93 — md legislature + federal officials

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
- Next migration: 268

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

### Pending Todos

- **[ME — TIME-SENSITIVE]** Phase 90 Plan 01: After ME June 9 primary results, write migration adding D primary winners to US Senate general + ME-01 general + ME-02 general race_candidates rows
- **[CA operational note]** Phase 90 Plan 02: Update lavote.gov discovery_jurisdictions election ID for CA November 2026 general

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-06-05T17:15:57.232Z
Stopped at: Phase 92 context gathered
Resume file: .planning/phases/92-md-state-government-db/92-CONTEXT.md

## Performance Metrics

| Phase | Plan | Duration | Notes |
|-------|------|----------|-------|
| Phase 91 P02 | 45m | 2 tasks | 2 files |
| Phase 91 P03 | 20m | 2 tasks | 0 files (DB-only) |
| Phase 91 P04 | 15m | 2 tasks | 0 files (verification-only) |
