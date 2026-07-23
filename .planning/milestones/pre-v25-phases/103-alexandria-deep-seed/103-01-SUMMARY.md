---
phase: 103-alexandria-deep-seed
plan: "01"
subsystem: database
tags:
  - virginia
  - alexandria
  - city-government
  - migration
dependency_graph:
  requires:
    - Phase 100 (VA TIGER geofences — geo_id=5101000 G4110 already loaded)
    - Phase 101/102 (VA state government seeded; VA convention decisions D-10..D-18)
  provides:
    - Alexandria city government UUID (government row geo_id=5101000)
    - 7 politician UUIDs for Plan 02 (ACPS) and Plan 03 (headshots) — see below
    - LOCAL_EXEC district UUID (Alexandria Citywide) — for Plan 03 headshot linkage
    - LOCAL district UUID (Alexandria At-Large) — for Plan 03 headshot linkage
  affects:
    - essentials.governments (1 row added)
    - essentials.chambers (1 row added)
    - essentials.districts (2 rows added: LOCAL_EXEC + LOCAL for geo_id=5101000)
    - essentials.politicians (7 rows added)
    - essentials.offices (7 rows added)
tech_stack:
  added: []
  patterns:
    - WITH ins_p CTE + CROSS JOIN + NOT EXISTS office guard (Leonardtown pattern, migration 277)
    - 4-gate post-verification DO block (gates a/b/c/d)
    - office_id back-fill UPDATE
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/312_alexandria_government.sql
  modified:
    - C:/Transparent Motivations/essentials/.planning/STATE.md
decisions:
  - "External_id ordering: Mayor Gaskins=-5101000001; council alphabetical by last name: Aguirre=-5101000002, Bagley=-5101000003, Chapman=-5101000004, Elnoubi=-5101000005, Greene=-5101000006, Marks=-5101000007"
  - "Vice Mayor title: Sarah Bagley is procedural Vice Mayor — seeded with title='Council Member' (procedural role, not a separate elected office)"
  - "Roster source: alexandriava.gov/Council verified 2026-06-08; Abdel-Rahman Elnoubi confirmed hyphenated first name"
metrics:
  duration: "~20m"
  completed: "2026-06-08"
  tasks_completed: 3
  files_created: 1
  files_modified: 1
---

# Phase 103 Plan 01: Alexandria City Government Summary

**One-liner:** Alexandria city government seeded — Mayor Alyia Gaskins (LOCAL_EXEC) + 6 at-large council members (LOCAL) under geo_id=5101000 via migration 312.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Verify Alexandria geofence + roster | Done | (read-only, no commit) |
| 2 | Write migration 312_alexandria_government.sql | Done | 2fe63fe |
| 3 | Apply migration 312 + spot-check verification | Done | 7beba03 |

## Politician UUIDs (Required by Plans 02 and 03)

| external_id | full_name | UUID | title |
|-------------|-----------|------|-------|
| -5101000001 | Alyia Gaskins | c217f344-476f-4b84-90bc-6c731bfb4161 | Mayor (LOCAL_EXEC) |
| -5101000002 | Canek Aguirre | b5ff1baa-42fa-440d-a9a5-e84ded256ac1 | Council Member (LOCAL) |
| -5101000003 | Sarah Bagley | ce2be866-a3aa-493b-8475-4a051bcc2461 | Council Member (LOCAL) |
| -5101000004 | John Chapman | 5054e061-1c2b-4158-bfd7-b4ed36b544a0 | Council Member (LOCAL) |
| -5101000005 | Abdel-Rahman Elnoubi | ffd87afa-bc0a-43b8-a15c-2eb3f2f83186 | Council Member (LOCAL) |
| -5101000006 | Jacinta E. Greene | cc96438c-0f0f-4824-98ae-8997aedfa496 | Council Member (LOCAL) |
| -5101000007 | Sandy Marks | edbf3aa4-b992-4ed8-85a9-7189642b517c | Council Member (LOCAL) |

## Spot-Check Query Results

All 5 queries passed after migration 312 applied:

| Query | Expected | Actual | Status |
|-------|----------|--------|--------|
| A: government row count | 1 | 1 | PASS |
| B: district rows (LOCAL + LOCAL_EXEC, geo_id=5101000, state='va') | 2 | 2 | PASS |
| C: politicians + offices joined (7 rows, Mayor=LOCAL_EXEC, Council=LOCAL) | 7 | 7 | PASS |
| D: politicians with NULL office_id in range | 0 | 0 | PASS |
| E: section-split orphans (G4110, geo_id=5101000) | 0 | 0 | PASS |

## Migration 312 Applied

- **File:** C:/EV-Accounts/backend/migrations/312_alexandria_government.sql
- **Applied:** 2026-06-08 via Supabase CLI (`npx supabase db query --linked --file`)
- **Supabase migration ledger:** version '312' inserted into `supabase_migrations.schema_migrations`
- **Post-verification:** 4-gate DO block PASSED (gov_count=1, office_count=7, split_orphans=0, null_office_ids=0)

## Deviations from Plan

None - plan executed exactly as written. Task 1 was verification-only (no commit needed per task spec).

## Known Stubs

None. All 7 officials seeded with full_name, first_name, last_name, and office_id populated. No placeholder data.

## Threat Flags

No new security-relevant surface beyond what the threat model documented. Migration uses idempotent WHERE NOT EXISTS guards throughout; post-verification DO block enforces all 4 gates.

## Self-Check: PASSED

File check:
- C:/EV-Accounts/backend/migrations/312_alexandria_government.sql: FOUND

Commit check:
- 2fe63fe (feat(103-01): write migration 312): FOUND
- 7beba03 (feat(103-01): apply migration 312 + advance STATE.md): FOUND

DB spot-check: All 5 queries pass (A=1, B=2 rows, C=7 rows, D=0, E=0).
