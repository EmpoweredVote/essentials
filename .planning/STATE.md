---
gsd_state_version: 1.0
milestone: v11.0
milestone_name: Maryland Essentials
status: executing
last_updated: "2026-06-05T00:24:41.079Z"
last_activity: 2026-06-05 -- Phase 90 execution started
progress:
  total_phases: 10
  completed_phases: 0
  total_plans: 3
  completed_plans: 0
  percent: 0
---

# State

## Current Position

Phase: 90 (Post-Election Follow-up + MiniCompass UI) — EXECUTING
Plan: 1 of 3
Status: Executing Phase 90
Last activity: 2026-06-05 -- Phase 90 execution started

Progress: [░░░░░░░░░░] 0%

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-04 after v10.0 milestone archival)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** Phase 90 — Post-Election Follow-up + MiniCompass UI

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

Last session: 2026-06-04T22:41:11.649Z
Stopped at: Phase 90 context gathered
Resume file: .planning/phases/90-post-election-follow-up-minicompass-ui/90-CONTEXT.md
