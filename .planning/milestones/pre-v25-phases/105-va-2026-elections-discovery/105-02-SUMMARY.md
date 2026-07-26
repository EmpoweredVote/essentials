---
plan: 105-02
phase: 105-va-2026-elections-discovery
status: complete
completed: 2026-06-09
duration: 15m
tasks_completed: 2
files_created: 2
requirements:
  - VA-ELECTIONS-02
tags:
  - races
  - sql
  - virginia
  - va-2026
key_decisions:
  - "Migration 324 follows MD pattern (279) verbatim; office_ids hardcoded as literals after live DB resolution"
  - "Warner external_id=-400080 confirmed; no deviation from plan"
  - "tx script invoked via node tsx/dist/cli.mjs (tsx not on PATH; no node_modules/.bin)"
---

# Phase 105 Plan 02: VA 2026 Federal Races Migration (Migration 324)

## What Was Built

Migration 324 seeds 12 Virginia 2026 race rows into `essentials.races`. These link to the 2026 Virginia General Election row seeded in Plan 01 (migration 322), resolved via subquery on election name.

- 1 U.S. Senate Virginia row (Mark Warner, Class 2, up in 2026)
- 11 U.S. House rows (VA-01 through VA-11, zero-padded per MD migration 279 convention)
- All 12 rows have non-null office_ids, confirmed idempotent

## Files Created

- `C:/EV-Accounts/backend/migrations/324_va_2026_races.sql` — WITH gen_elec CTE + 12 VALUES tuples + ON CONFLICT DO NOTHING + ledger INSERT + DO $$ post-verify block
- `C:/EV-Accounts/backend/scripts/_apply-migration-324.ts` — Apply script with 4 smoke tests; applied to production

## Resolved Office UUIDs

| # | Position Name | Office UUID | Politician | geo_id |
|---|--------------|-------------|-----------|--------|
| 1 | U.S. Senate Virginia | 6204cbda-f055-46db-962d-98ddf945060e | Mark Warner | — |
| 2 | U.S. House VA-01 | 7606b2c5-9628-4f3b-a3da-18f4296e3195 | Rob Wittman | 5101 |
| 3 | U.S. House VA-02 | 1439154d-60ef-4186-bff5-8e37465dd596 | Jen Kiggans | 5102 |
| 4 | U.S. House VA-03 | b6343762-c378-4684-ae88-1749b3eefee5 | Bobby Scott | 5103 |
| 5 | U.S. House VA-04 | baf80dc1-633b-4774-9f9e-701cd50844df | Jennifer McClellan | 5104 |
| 6 | U.S. House VA-05 | 39211b8a-e499-4afd-be63-080dda9a68f5 | Ben Cline | 5105 |
| 7 | U.S. House VA-06 | 5f797901-0cbd-45d9-81f1-060daeee3f1d | Morgan Griffith | 5106 |
| 8 | U.S. House VA-07 | 86664ec7-aabe-46c7-a1a0-dded71fccfc2 | Eugene Vindman | 5107 |
| 9 | U.S. House VA-08 | 3c3b3be6-5390-4748-ae16-553feb2f61bb | Don Beyer | 5108 |
| 10 | U.S. House VA-09 | 1e2d3f80-252f-48a2-a1bf-b2470436340c | John McGuire | 5109 |
| 11 | U.S. House VA-10 | 5bc6c218-6992-4ff8-b982-d2d0d17a4b70 | Suhas Subramanyam | 5110 |
| 12 | U.S. House VA-11 | c4119341-e717-483c-b295-8e117125e046 | James Walkinshaw | 5111 |

## Apply Script Output

```
Migration 324 applied successfully
VA 2026 race rows: 12 (expected 12)
NULL office_id count: 0 (expected 0)
VA 2026 race rows (all 12):
 - U.S. House VA-01: office_id=PRESENT
 - U.S. House VA-02: office_id=PRESENT
 - U.S. House VA-03: office_id=PRESENT
 - U.S. House VA-04: office_id=PRESENT
 - U.S. House VA-05: office_id=PRESENT
 - U.S. House VA-06: office_id=PRESENT
 - U.S. House VA-07: office_id=PRESENT
 - U.S. House VA-08: office_id=PRESENT
 - U.S. House VA-09: office_id=PRESENT
 - U.S. House VA-10: office_id=PRESENT
 - U.S. House VA-11: office_id=PRESENT
 - U.S. Senate Virginia: office_id=PRESENT
Ledger entry 324: PRESENT
```

Idempotency confirmed: re-running apply script keeps count at 12 (ON CONFLICT DO NOTHING).

## Acceptance Criteria — All Passed

- [x] File `C:/EV-Accounts/backend/migrations/324_va_2026_races.sql` exists
- [x] SQL contains `WITH gen_elec AS (SELECT id FROM essentials.elections WHERE name = '2026 Virginia General Election' AND state = 'VA')`
- [x] SQL contains the literal `'U.S. Senate Virginia'`
- [x] SQL contains all 11 literals: `'U.S. House VA-01'` through `'U.S. House VA-11'` (zero-padded)
- [x] SQL contains `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`
- [x] SQL contains `RAISE EXCEPTION 'Expected 12 VA 2026 federal race rows`
- [x] SQL contains `VALUES ('324')` (ledger entry)
- [x] File `C:/EV-Accounts/backend/scripts/_apply-migration-324.ts` exists and references `324_va_2026_races.sql`
- [x] Apply script prints `VA 2026 race rows: 12 (expected 12)`
- [x] Apply script prints `NULL office_id count: 0 (expected 0)`
- [x] Apply script prints `Ledger entry 324: PRESENT`
- [x] Re-running apply script keeps row count at 12 (idempotency confirmed)
- [x] Warner external_id=-400080 confirmed — no deviation
- [x] All 11 VA House geo_ids 5101-5111 confirmed

## Deviations

None — plan executed exactly as written.

- Warner external_id is -400080 as expected; no fallback name-based query required.
- tsx invoked via `node node_modules/tsx/dist/cli.mjs` (tsx not on PATH and no `.bin` symlink in this Node environment; same workaround as Plan 01's backend directory invocation pattern).

## Self-Check: PASSED

All 12 VA 2026 race rows exist in production `essentials.races` with non-null office_ids. Migration 324 recorded in `supabase_migrations.schema_migrations`. VA-ELECTIONS-02 satisfied. Downstream Plan 03 (discovery + Landing.jsx) unblocked.
