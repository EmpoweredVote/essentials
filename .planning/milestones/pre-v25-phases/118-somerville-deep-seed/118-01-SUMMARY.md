---
phase: 118-somerville-deep-seed
plan: "01"
subsystem: database
tags: [somerville, ma, migration, local-government, city-council]
dependency_graph:
  requires: [v5.0-ma-tiger-geofences]
  provides: [somerville-city-government, somerville-officials-12, somerville-districts-2]
  affects: [essentials.governments, essentials.chambers, essentials.districts, essentials.politicians, essentials.offices]
tech_stack:
  added: []
  patterns: [newton-flat-district-pattern, with-ins_p-politician-office-block, post-verification-do-block]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql
  modified: []
decisions:
  - "Jake Wilson full_name='Jake Wilson' (not 'Jacob D. Wilson') — city uses public name in all official contexts"
  - "Lance Davis title='City Councilor (Ward 6)' — Council President is internal officer role, not charter office; ex-officio SC office in migration 582 uses 'City Council President (ex officio)'"
  - "External IDs assigned in ward-number order: McLaughlin=-2562535006 through Hardt=-2562535012"
metrics:
  duration: 20m
  completed: "2026-06-14"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 118 Plan 01: Somerville City Government Seed Summary

Somerville city government seeded via migration 581 — Mayor Jake Wilson (LOCAL_EXEC) + 11 City Councillors (4 at-large + 7 ward) = 12 officials across 1 government row, 1 chamber, 2 districts, 12 offices.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write and apply migration 581 | (see below) | C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql |

## Verification Results

Migration 581 post-verification PASSED: gov=1, chambers=1, districts=2, politicians=12, offices=12, split_orphans=0, null_office_ids=0

Spot-check results:
- 12 politicians in external_id range -2562535012 to -2562535001
- 12 offices: 1 LOCAL_EXEC (Mayor) + 11 LOCAL (councillors)
- Section-split check = 0 (G4110 geofence has matching districts)
- Mayor Jake Wilson (external_id=-2562535001) title = 'Mayor'
- Lance Davis (external_id=-2562535011) title = 'City Councilor (Ward 6)' — NOT 'City Council President'
- Jon Link (external_id=-2562535002) title = 'City Councilor' — American spelling confirmed
- Ledger entry '581' present in supabase_migrations.schema_migrations

## Deviations from Plan

None — plan executed exactly as written.

All pitfalls avoided:
- Pitfall 1 (Davis title): title='City Councilor (Ward 6)' verified in DB
- Pitfall 7 (slug column): not included in chambers INSERT
- Pitfall 8 (Ballantyne): not seeded
- Pitfall 10 (WHERE NOT EXISTS guard): applied to governments INSERT

## Known Stubs

None. All 12 politician+office rows fully wired with non-NULL office_ids.

## Threat Flags

None. Migration uses WHERE NOT EXISTS + ON CONFLICT DO NOTHING guards (T-118-01 mitigated). Office_id back-fill uses WHERE office_id IS NULL for idempotency (T-118-02 mitigated). Davis Ward 6 title confirmed 'City Councilor (Ward 6)' in DB (T-118-03 mitigated).

## Self-Check: PASSED

- C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql — FOUND (created)
- essentials.governments WHERE name = 'City of Somerville, Massachusetts, US' — 1 row
- essentials.politicians WHERE external_id BETWEEN -2562535012 AND -2562535001 — 12 rows
- essentials.offices (Somerville districts) — 12 rows
- section-split (geo_id=2562535, mtfcc=G4110) — 0 orphans
- null office_ids in range — 0
- supabase_migrations.schema_migrations version='581' — present
