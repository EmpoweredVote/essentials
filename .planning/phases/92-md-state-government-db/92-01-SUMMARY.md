---
phase: 92-md-state-government-db
plan: "01"
subsystem: database
tags:
  - maryland
  - state-government
  - chambers
  - migration
dependency_graph:
  requires:
    - "Phase 91 Plan 02/03: MD TIGER geofences loaded"
    - "Migration 174: State of Maryland government row (pre-existing)"
  provides:
    - "5 MD executive chambers under State of Maryland government row"
    - "Migration 269 applied to production DB"
  affects:
    - "Phase 93 (MD Legislature) — can now add legislative chambers under same government_id"
    - "Phase 96 (MD Elections) — government row available for discovery_jurisdictions link"
tech_stack:
  added: []
  patterns:
    - "OR migration 222 pre-flight assert pattern (ASSERT gov row exists, not INSERT)"
    - "WHERE NOT EXISTS guard on (name + government_id) for idempotent chamber inserts"
    - "BEGIN/COMMIT transaction wrapper"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql"
  modified: []
decisions:
  - "D-01 satisfied: Lieutenant Governor gets standalone chamber (not under Governor) — 5 chambers total"
  - "State Treasurer uses asymmetric name_formal 'Maryland State Treasurer' per OR 222 precedent"
  - "Pre-flight asserts exactly 1 State of Maryland row (migration 174 pre-existing) — no INSERT into governments"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  files_created: 1
  db_rows_inserted: 5
---

# Phase 92 Plan 01: MD Government Chambers Summary

**One-liner:** 5 MD executive chambers seeded under pre-existing State of Maryland government row via idempotent migration 269 with pre-flight assertion.

## What Was Built

Migration `269_md_government_chambers.sql` creates 5 constitutional officer chamber scaffolds under the pre-existing `essentials.governments` row for State of Maryland (UUID: `85973301-a859-45c8-9b58-4a14ab7b44ab`, from migration 174).

### Migration 269 File Path

`C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql`

### Apply Status

**Success** — applied to production Supabase DB 2026-06-05 via psql.

Output:
```
BEGIN
DO       -- pre-flight assertion passed (exactly 1 State of Maryland row)
INSERT 0 1  -- Governor
INSERT 0 1  -- Lieutenant Governor
INSERT 0 1  -- Attorney General
INSERT 0 1  -- Comptroller
INSERT 0 1  -- State Treasurer
COMMIT
```

### Final Chamber Roster (5 rows)

| name | name_formal |
|------|-------------|
| Attorney General | Attorney General of Maryland |
| Comptroller | Comptroller of Maryland |
| Governor | Governor of Maryland |
| Lieutenant Governor | Lieutenant Governor of Maryland |
| State Treasurer | Maryland State Treasurer |

All 5 chambers joined via `government_id` to the State of Maryland government row (`state='MD'`, `geo_id='24'`).

### Idempotency Confirmation

Migration re-applied a second time — all 5 INSERTs returned `INSERT 0 0` (zero new rows). Chamber count remained exactly 5. Idempotency confirmed.

## Verification Query Results

| Query | Expected | Actual | Status |
|-------|----------|--------|--------|
| Gov row count (name='State of Maryland' AND state='MD') | 1 | 1 | PASS |
| Chamber count under State of Maryland | 5 | 5 | PASS |
| Roster (alphabetical): Attorney General, Comptroller, Governor, Lieutenant Governor, State Treasurer | 5 rows | 5 rows | PASS |
| State Treasurer name_formal | 'Maryland State Treasurer' | 'Maryland State Treasurer' | PASS |
| Lieutenant Governor name_formal (D-01) | 'Lieutenant Governor of Maryland' | 'Lieutenant Governor of Maryland' | PASS |
| Idempotency re-run chamber count | 5 | 5 | PASS |

## Commits

| Task | Description | Hash | Repo |
|------|-------------|------|------|
| Task 1 | Write migration 269_md_government_chambers.sql | 70145e1 | EV-Accounts |
| Task 2 | Apply + verify (DB-only, no file changes) | — | production DB |

## Deviations from Plan

None — plan executed exactly as written.

The migration structure followed OR migration 222 exactly:
- Pre-flight DO block asserts State of Maryland row count = 1 (RAISE EXCEPTION on failure)
- 5 chamber INSERTs with WHERE NOT EXISTS (name + government_id) guards
- BEGIN/COMMIT wrapper
- No INSERT INTO essentials.governments
- No `slug` column in any INSERT (GENERATED ALWAYS)

## Known Stubs

None — migration inserts complete chamber rows; no placeholder data.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. Pure DB seeding of public government data (constitutional officer titles). T-92-01-01 (pre-flight assert) and T-92-01-02 (WHERE NOT EXISTS guards) both implemented as planned.

## Self-Check

- [x] Migration file exists: `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql`
- [x] Task 1 commit exists: `70145e1` in EV-Accounts repo
- [x] Gov row count = 1
- [x] Chamber count = 5
- [x] All 5 name/name_formal pairs correct
- [x] Idempotency confirmed

## Self-Check: PASSED
