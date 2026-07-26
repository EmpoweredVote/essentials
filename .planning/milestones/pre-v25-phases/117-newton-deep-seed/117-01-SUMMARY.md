---
phase: 117-newton-deep-seed
plan: "01"
subsystem: database
tags: [newton, massachusetts, local-government, migration, seed]
dependency_graph:
  requires: [v5.0-ma-tiger-geofences]
  provides: [newton-city-government, newton-city-council]
  affects: [essentials.governments, essentials.chambers, essentials.districts, essentials.politicians, essentials.offices]
tech_stack:
  added: []
  patterns: [worcester-flat-district-pattern, WITH-ins-p-CTE-office-insert, post-verification-DO-block]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/578_newton_city_government.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-578.ts
  modified: []
decisions:
  - "Used Worcester 351 flat-district pattern (all 24 councillors link to single LOCAL district); ward encoded in office title string 'City Councilor (Ward N)'"
  - "Title spelling 'City Councilor' (American) not 'City Councillor' (British) per Newton charter usage"
  - "Mayor Marc C. Laredo seeded as is_appointed=false (popularly elected); external_id=-2545560001"
  - "At-large councillors external_id -2545560002..-2545560017; ward councillors -2545560018..-2545560025"
  - "R. Lisle Baker: full_name='R. Lisle Baker', first_name='Lisle' (uses middle name publicly)"
metrics:
  duration: "~15m"
  completed: "2026-06-14"
  tasks_completed: 1
  files_created: 2
---

# Phase 117 Plan 01: Newton City Government Seed Summary

**One-liner:** Newton city government seeded — Mayor Laredo + 24 City Councillors (16 at-large + 8 ward) via migration 578, flat-district pattern, 25 politicians + 25 offices + section-split clean.

## What Was Built

Migration 578 (`578_newton_city_government.sql`) seeds the City of Newton, Massachusetts government:

- 1 `essentials.governments` row: `City of Newton, Massachusetts, US` (type=LOCAL, state=MA, geo_id=2545560)
- 1 `essentials.chambers` row: `City Council` / `Newton City Council`
- 2 `essentials.districts` rows: LOCAL_EXEC (Newton Citywide) + LOCAL (Newton), both geo_id=2545560, state=ma
- 25 `essentials.politicians` rows: Mayor Marc C. Laredo (-2545560001) + 24 City Councillors (-2545560002 to -2545560025)
- 25 `essentials.offices` rows: 1 Mayor linked to LOCAL_EXEC + 24 councillors linked to LOCAL
- office_id back-fill: all 25 politicians have non-NULL office_id

**Council structure:** 16 at-large councillors (2 per ward, 8 wards) + 8 ward councillors (1 per ward) = 24. All use title 'City Councilor' (at-large) or 'City Councilor (Ward N)' (ward seats). American spelling confirmed.

## Verification Results

Post-verification DO block (7 gates) + 9 smoke tests all PASSED:

| Check | Result | Expected |
|-------|--------|----------|
| Government rows | 1 | 1 |
| Chamber rows | 1 | 1 |
| District rows | 2 | 2 |
| Politicians | 25 | 25 |
| Offices | 25 | 25 |
| Section-split orphans | 0 | 0 |
| NULL office_ids | 0 | 0 |
| Mayor title | 'Mayor' | 'Mayor' |
| Baker title | 'City Councilor (Ward 7)' | 'City Councilor (Ward 7)' |
| Ledger entry 578 | PRESENT | PRESENT |

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write + apply migration 578 | (SUMMARY commit) | 578_newton_city_government.sql, _apply-migration-578.ts |

Note: Migration file is in C:/EV-Accounts/backend/migrations/ (not a git repo per project rules). Planning artifacts committed to essentials repo.

## Deviations from Plan

None — plan executed exactly as written. Worcester 351 pattern applied cleanly for 25 politicians. All pre-flight, transaction, post-verification, and smoke-test gates passed on first run.

## Known Stubs

None — all 25 officials seeded with correct titles, names, and office linkages. Migration 578 is a complete, self-verified deliverable.

## Threat Flags

No new security-relevant surface introduced. Migration 578 is INSERT-only SQL with WHERE NOT EXISTS idempotency guards. Pre-flight RAISE EXCEPTION blocks abort on dirty state (T-117-01 mitigated). office_id back-fill uses WHERE office_id IS NULL for idempotency (T-117-02 mitigated). No new network endpoints or auth paths.

## Self-Check

- [x] Migration file exists: C:/EV-Accounts/backend/migrations/578_newton_city_government.sql
- [x] Apply script exists: C:/EV-Accounts/backend/scripts/_apply-migration-578.ts
- [x] Migration applied to production DB (all 9 smoke tests passed)
- [x] Post-verification DO block raised NOTICE (all 7 gates passed)
- [x] 25 politicians in external_id range -2545560001..-2545560025
- [x] 25 offices linked to geo_id=2545560 districts
- [x] Section-split = 0 (Newton G4110 geofence has matching district rows)
- [x] 0 NULL office_ids
- [x] Title spelling 'City Councilor' (not 'City Councillor') confirmed

## Self-Check: PASSED
