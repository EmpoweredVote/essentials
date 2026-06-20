---
phase: 146-palmdale-deep-seed
plan: 01
subsystem: database
tags: [reconcile, structural-migration, palmdale, ca, chamber-merge, district-relabel]
dependency_graph:
  requires: []
  provides: [palmdale-gov-geo_id, palmdale-single-chamber, palmdale-district-structure]
  affects: [essentials.governments, essentials.chambers, essentials.offices, essentials.districts, supabase_migrations.schema_migrations]
tech_stack:
  added: []
  patterns: [move-then-delete-chamber, district-relabel-by-uuid, not-exists-district-create, schema_migrations-registration]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/918_palmdale_reconcile.sql
  modified: []
decisions:
  - "D-03: geo_id='0655156' backfilled on gov 4f59ebad (guarded WHERE geo_id IS NULL; applied once, 0 rows on re-run)"
  - "D-04: duplicate chamber c8e8d31e deleted after moving Bishop's office 198661de into survivor 000d672d; inline DO $$ assert confirmed 0 offices before delete"
  - "D-02: 4 At-Large district rows relabeled f61fd139→D1, 6ad1e005→D2, a1d3e3bf→D4, 7fe09a06→D5; new District 3 row created (UUID 21d57fc7-7c70-44ad-acd6-760842c72324)"
  - "official_count set to 4 on survivor 000d672d (accurate pre-Plan-02 count; Plan 02 sets 5)"
  - "schema_migrations registered 918 as structural (on-disk MAX was 917 audit-only; structural ledger MAX was 911)"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-20"
  tasks_completed: 2
  files_changed: 1
---

# Phase 146 Plan 01: Palmdale Reconcile (Wave 1 Structural) Summary

Idempotent structural migration 918 reconciles the pre-existing partial, duplicate-chamber Palmdale seed: backfills geo_id, merges the duplicate 'City Council' chamber via move-then-delete, relabels 4 At-Large district rows to D1/D2/D4/D5, and creates a new District 3 row for Bettencourt.

## What Was Built

Migration `918_palmdale_reconcile.sql` applied to production Supabase. Three structural fixes in one idempotent BEGIN/COMMIT block:

1. **geo_id backfill** — `essentials.governments` row `4f59ebad` now has `geo_id='0655156'` (was NULL).
2. **Chamber merge (move-then-delete)** — Bishop's office `198661de` moved from duplicate `c8e8d31e` into survivor `000d672d`; inline DO $$ assert confirmed 0 offices remaining; duplicate chamber deleted. End state: exactly ONE 'City Council' chamber (`000d672d`) with 4 offices.
3. **District relabel + create** — 4 At-Large rows relabeled to their occupant's real district (f61fd139→D1, 6ad1e005→D2, a1d3e3bf→D4, 7fe09a06→D5); new District 3 row created for Bettencourt (UUID recorded below).

## New District 3 UUID (Required by Plan 02)

**`21d57fc7-7c70-44ad-acd6-760842c72324`**

Plan 02 (migration 919) must use this UUID when creating Bettencourt's council office row:
```sql
INSERT INTO essentials.offices (chamber_id, district_id, title, politician_id)
VALUES ('000d672d-97f1-4f1f-af61-9eb6f008c4fd',
        '21d57fc7-7c70-44ad-acd6-760842c72324',
        'Councilmember',
        '<new-bettencourt-politician-uuid>');
```

## Post-Verification Results

All 7 Wave 1 assertions passed immediately after COMMIT:

| Check | Query Result | Expected | Pass? |
|-------|-------------|----------|-------|
| geo_id on gov 4f59ebad | '0655156' | '0655156' | ✓ |
| Chamber count (City Council, gov 4f59ebad) | 1 | 1 | ✓ |
| Duplicate c8e8d31e gone | 0 rows | 0 | ✓ |
| Offices under survivor 000d672d | 4 | 4 | ✓ |
| District rows D1/D2/D3/D4/D5 (all LOCAL/0655156/CA) | 5 rows | 5 | ✓ |
| Split-section check (Palmdale, duplicate chamber names) | 0 rows | 0 | ✓ |
| schema_migrations version 918 registered | 1 row | 1 | ✓ |

## Pre-Flight Results (Task 1)

All CONTEXT §db_precheck LOCKED values confirmed against live DB before any write:

| Check | Live Value | Locked Value | Match? |
|-------|-----------|-------------|--------|
| gov 4f59ebad geo_id | NULL | NULL | ✓ |
| gov 4f59ebad state | 'CA' | 'CA' | ✓ |
| Survivor chamber 000d672d offices | 3 | 3 | ✓ |
| Duplicate chamber c8e8d31e offices | 1 (198661de/Bishop) | 1 | ✓ |
| Bishop ext_id in c8e8d31e | -201331 | -201331 | ✓ |
| Bishop politicians.office_id | NULL | NULL (broken) | ✓ |
| 4 district rows label | 'At-Large' | 'At-Large' | ✓ |
| No District 3 row at geo_id 0655156 | 0 rows | 0 | ✓ |
| schema_migrations structural MAX | 911 | 911 (912-917 audit-only) | ✓ |
| Current Mayor | Ohlsen D4 (confirmed RESEARCH §1, multiple official sources) | Ohlsen | ✓ |

No drift detected. STOP-on-drift not triggered.

## Deviations from Plan

None — plan executed exactly as written. The 910_lancaster_reconcile.sql template was followed precisely. All guards (geo_id IS NULL, label IS DISTINCT FROM, NOT EXISTS, DO $$ assert) applied as specified.

## Known Stubs

None — this is a structural migration only. No UI-facing data (roster, headshots, stances) is affected by this wave.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. Migration SQL applied directly by operator via psql to production Supabase. No new attack surface introduced.

## Self-Check

- [x] Migration file exists: `C:/EV-Accounts/backend/migrations/918_palmdale_reconcile.sql`
- [x] All post-verification queries confirmed green (output above)
- [x] District 3 UUID `21d57fc7-7c70-44ad-acd6-760842c72324` recorded for Plan 02
- [x] No git operations in C:/EV-Accounts
- [x] STATE.md / ROADMAP.md NOT modified (orchestrator owns those writes)

## Self-Check: PASSED
