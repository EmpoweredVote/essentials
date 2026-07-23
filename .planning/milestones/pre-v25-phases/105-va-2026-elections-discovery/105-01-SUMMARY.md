---
plan: 105-01
phase: 105-va-2026-elections-discovery
status: complete
completed: 2026-06-09
duration: 6m
tasks_completed: 1
files_created: 2
requirements:
  - VA-ELECTIONS-01
tags:
  - elections
  - sql
  - virginia
  - va-2026
key_decisions:
  - "Migration 322 follows MD pattern (278) verbatim; tsx run from C:/EV-Accounts/backend (not C:/EV-Accounts root) to resolve migrations/ path"
---

# Phase 105 Plan 01: VA 2026 Elections Seed (Migration 322)

## What Was Built

Migration 322 seeds the two Virginia 2026 election rows into `essentials.elections`. These are the FK target rows that downstream plans (105-02 race rows, 105-03 discovery) reference via subquery against the general election name.

## Files Created

- `C:/EV-Accounts/backend/migrations/322_va_2026_elections.sql` — Two INSERT statements (primary + general) with `ON CONFLICT (name, election_date, state) DO NOTHING` idempotency guard + ledger INSERT into `supabase_migrations.schema_migrations`
- `C:/EV-Accounts/backend/scripts/_apply-migration-322.ts` — Apply script with 4 verification smoke tests; applied to production

## Verified Election UUIDs

| Name | UUID | election_date | election_type |
|------|------|---------------|---------------|
| 2026 Virginia State Primary | d03ef6ff-303b-46bf-b610-7834e65a1d2d | 2026-08-04 | primary |
| 2026 Virginia General Election | a820319c-d64f-4f6b-b173-2fcc06fab95b | 2026-11-03 | general |

## Acceptance Criteria — All Passed

- [x] File `C:/EV-Accounts/backend/migrations/322_va_2026_elections.sql` exists
- [x] SQL contains `'2026 Virginia State Primary'`
- [x] SQL contains `'2026 Virginia General Election'`
- [x] SQL contains `'2026-08-04'`
- [x] SQL contains `'2026-11-03'`
- [x] SQL contains `ON CONFLICT (name, election_date, state) DO NOTHING`
- [x] SQL contains `INSERT INTO supabase_migrations.schema_migrations (version)` with `VALUES ('322')`
- [x] File `C:/EV-Accounts/backend/scripts/_apply-migration-322.ts` exists and references `322_va_2026_elections.sql`
- [x] Apply script prints `VA 2026 election rows: 2 (expected 2)`
- [x] Apply script prints `Primary election_date: 2026-08-04` (timestamp includes UTC offset; grep passes)
- [x] Apply script prints `General election_date: 2026-11-03` (timestamp includes UTC offset; grep passes)
- [x] Apply script prints `Ledger entry 322: PRESENT`
- [x] Re-running apply script keeps row count at 2 (idempotency confirmed — ON CONFLICT DO NOTHING)
- [x] Production DB: `SELECT COUNT(*) FROM essentials.elections WHERE state='VA' AND election_date IN ('2026-08-04','2026-11-03')` = 2

## Plan 02 FK Resolution

Plan 02 race INSERTs can now resolve:
```sql
(SELECT id FROM essentials.elections WHERE name = '2026 Virginia General Election' AND state = 'VA')
```
Returns UUID: `a820319c-d64f-4f6b-b173-2fcc06fab95b`

## Deviations

None — plan executed exactly as written. Pattern mirrors MD migration 278 verbatim. tsx invoked from `C:/EV-Accounts/backend` (not root) to satisfy `process.cwd() + 'migrations/'` path resolution.

## Self-Check: PASSED

Both VA 2026 election rows exist in production `essentials.elections`. Migration 322 recorded in `supabase_migrations.schema_migrations`. VA-ELECTIONS-01 satisfied. Downstream Plan 02 unblocked.
