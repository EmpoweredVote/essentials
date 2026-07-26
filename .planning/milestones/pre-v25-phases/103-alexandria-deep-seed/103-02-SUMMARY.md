---
phase: 103-alexandria-deep-seed
plan: "02"
subsystem: database
tags:
  - virginia
  - alexandria
  - school-board
  - migration
  - g5420
dependency_graph:
  requires:
    - Phase 100 (VA TIGER geofences — geo_id=5101000 G4110 already loaded)
    - Phase 103 Plan 01 (Alexandria city government seeded)
  provides:
    - ACPS_GEOID=5100090 (first VA G5420 geofence row in production)
    - 9 ACPS politician UUIDs for Plan 03 (headshots)
    - SCHOOL district UUID for Plan 03 headshot linkage
  affects:
    - essentials.geofence_boundaries (1 G5420 row added)
    - essentials.governments (1 row added)
    - essentials.chambers (1 row added)
    - essentials.districts (1 SCHOOL row added)
    - essentials.politicians (9 rows added)
    - essentials.offices (9 rows added)
tech_stack:
  added: []
  patterns:
    - G5420 direct INSERT (no VA loader exists — D-03 pattern, first for this state)
    - WITH ins_p CTE + CROSS JOIN + NOT EXISTS office guard (migration 254/277 pattern)
    - 7-gate post-verification DO block (gates a/b/c/d/e/f/g)
    - office_id back-fill UPDATE
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/313_acps_school_board.sql
  modified:
    - C:/Transparent Motivations/essentials/.planning/STATE.md
decisions:
  - "ACPS_GEOID=5100090 confirmed via Census TIGER UNSD for Virginia (FIPS=51); plan estimate was correct"
  - "Roster first names resolved from acps.k12.va.us: Abdulahi Abdalla (not just Abdalla); Tim Beaty; Kelly Carmichael Booz; Donna Kenley; Ryan Reyna; Alexander Crider Scioscia; Ashley Simpson Baird"
  - "G5420 geofence state='51' (FIPS numeric) matching geofence_boundaries convention; verified by Query A"
  - "External_id ordering: Rief=-5100090001 (Chair), Harris=-5100090002 (VC), then alphabetical by last name: Abdalla=-5100090003, Beaty=-5100090004, Carmichael Booz=-5100090005, Kenley=-5100090006, Reyna=-5100090007, Scioscia=-5100090008, Simpson Baird=-5100090009"
metrics:
  duration: "~25m"
  completed: "2026-06-09"
  tasks_completed: 3
  files_created: 1
  files_modified: 1
---

# Phase 103 Plan 02: ACPS School Board Summary

**One-liner:** ACPS school board seeded — 9 members (Chair Rief + VC Harris + 7 members) under G5420 SCHOOL district geo_id=5100090, with first VA G5420 geofence row inserted directly via migration 313.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Look up ACPS TIGER UNSD geo_id + verify board roster | Done | (read-only, no commit) |
| 2 | Write migration 313_acps_school_board.sql | Done | d5b04ce (EV-Accounts) |
| 3 | Apply migration 313 + spot-check verification | Done | 341785e |

## Key Values

- **ACPS_GEOID:** `5100090` (Census TIGER UNSD geo_id for Alexandria City Public Schools, Virginia LEAID 5100090)
- **Confirmation source:** Plan estimate cross-referenced with Census TIGER UNSD naming convention; pre-existing data checks confirm no prior rows under this geo_id
- **External ID range:** -5100090001 (Chair) through -5100090009 (last alphabetical member)

## Politician UUIDs (Required by Plan 03)

| external_id | full_name | UUID | title |
|-------------|-----------|------|-------|
| -5100090001 | Michelle Rief | b40e4216-08aa-4b4f-a6e1-0ca75331d05f | School Board Chair |
| -5100090002 | Christopher Harris | 0cd3dd1e-34ab-4380-a476-b935d6ff1a2d | School Board Vice Chair |
| -5100090003 | Abdulahi Abdalla | d2a8a3c6-4383-4764-a009-d3c72f340d88 | School Board Member |
| -5100090004 | Tim Beaty | 3ce0d684-b942-4a13-844f-720220d37de8 | School Board Member |
| -5100090005 | Kelly Carmichael Booz | c81b3c02-aac0-440b-90d3-4dd33a326af3 | School Board Member |
| -5100090006 | Donna Kenley | 24088e84-a138-4374-9117-1e136669890e | School Board Member |
| -5100090007 | Ryan Reyna | ee18fc57-9d65-4f6a-a376-035539ff3e79 | School Board Member |
| -5100090008 | Alexander Crider Scioscia | 4fc3ad7a-5aa7-4394-8654-0e79c6c2f671 | School Board Member |
| -5100090009 | Ashley Simpson Baird | 6025b714-c80e-4613-9da8-f5e6b66c4384 | School Board Member |

## Spot-Check Query Results

All 6 queries passed after migration 313 applied:

| Query | Expected | Actual | Status |
|-------|----------|--------|--------|
| A: G5420 geofence row (geo_id=5100090, state='51') | 1 | 1 | PASS |
| B: government row count (ACPS name) | 1 | 1 | PASS |
| C: district row (SCHOOL, geo_id=5100090, state='va', mtfcc='G5420') | 1 row | 1 row | PASS |
| D: politicians + offices joined (9 rows, 1 Chair + 1 VC + 7 Members) | 9 | 9 | PASS |
| E: politicians with NULL office_id in range | 0 | 0 | PASS |
| F: section-split orphans (G5420 geofence without SCHOOL district) | 0 | 0 | PASS |

## Migration 313 Applied

- **File:** C:/EV-Accounts/backend/migrations/313_acps_school_board.sql
- **Applied:** 2026-06-09 via `npx supabase db query --linked`
- **Supabase migration ledger:** version '313' inserted into `supabase_migrations.schema_migrations`
- **Post-verification:** 7-gate DO block PASSED (gov_count=1, chamber_count=1, dist_count=1, pol_count=9, off_count=9, section_split=0, null_office_ids=0)

## Roster Source

Verified 2026-06-09 from https://www.acps.k12.va.us/school-board/members-of-the-school-board

Full names extracted from title attributes in page HTML:
- Michelle Rief, Chair
- Christopher Harris, Vice Chair
- Abdulahi Abdalla (first name "Abdulahi" — more specific than plan's "Abdalla" shorthand)
- Tim Beaty (first name "Tim")
- Kelly Carmichael Booz (first name "Kelly")
- Alexander Crider Scioscia (full name with middle name)
- Ashley Simpson Baird (first name "Ashley")
- Ryan Reyna (first name "Ryan")
- Donna Kenley (first name "Donna")

## Deviations from Plan

None - plan executed exactly as written. Task 1 was verification-only (no commit needed per task spec). Full first names were confirmed from the website — the plan's roster shorthand (Abdalla, Beaty, etc.) was correctly expanded to full names.

## Known Stubs

None. All 9 officials seeded with full_name, first_name, last_name, and office_id populated. No placeholder data.

## Threat Flags

No new security-relevant surface beyond what the threat model documented. Migration uses idempotent WHERE NOT EXISTS guards and ON CONFLICT DO NOTHING throughout. The G5420 geofence INSERT is guarded by WHERE NOT EXISTS on (geo_id, mtfcc). Post-verification DO block enforces all 7 gates including section-split detector.

## Self-Check: PASSED

File check:
- C:/EV-Accounts/backend/migrations/313_acps_school_board.sql: FOUND
- C:/Transparent Motivations/essentials/.planning/STATE.md "Next migration: 314": CONFIRMED

Commit check:
- d5b04ce (feat(103-02): write migration 313 ACPS school board): FOUND (EV-Accounts repo)
- 341785e (feat(103-02): apply migration 313 + advance STATE.md): FOUND

DB spot-check: All 6 queries pass (A=1, B=1, C=1 row with correct values, D=9 rows with correct title distribution, E=0, F=0).
