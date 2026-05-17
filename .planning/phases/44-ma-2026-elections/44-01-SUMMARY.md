---
phase: 44
plan: "01"
subsystem: elections-data
tags: [ma, elections, state-senate, azeem, cambridge, migration, race-candidates]
one-liner: "Two MA 2026 election rows seeded (primary Sep 1, general Nov 3) + 2nd Middlesex Democratic primary race with 5 candidates including Burhan Azeem linked to Cambridge Councillor politician_id"

dependency-graph:
  requires:
    - "41-cambridge-city-structure (Cambridge offices and politicians including Azeem's politician row)"
    - "39-ma-government-db (MA geofences and district offices, including 25D27 2nd Middlesex office)"
  provides:
    - "essentials.elections: 2026 MA primary (2026-09-01) and general (2026-11-03) rows"
    - "essentials.races: 2nd Middlesex Democratic primary race linked to office b1ed4e2a-4a9c-4b41-9e46-8500f608e026"
    - "essentials.race_candidates: 5 rows for Azeem (linked), Barber, Hopcroft, McLaughlin, Uyterhoeven"
  affects:
    - "44-02 (additional MA 2026 races will use the election UUIDs created here)"
    - "44-03 (Cambridge challenger candidates — Azeem's race is the anchor)"

tech-stack:
  added: []
  patterns:
    - "WHERE NOT EXISTS idempotency guard for race_candidates (no partial unique index on full_name+race_id)"
    - "DO $$ DECLARE block to chain election lookup → race insert → candidate inserts in single transaction"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/162_ma_2026_elections_foundation.sql"
  modified: []

decisions:
  - decision: "Used WHERE NOT EXISTS guards on all 5 race_candidates inserts instead of ON CONFLICT DO NOTHING"
    rationale: "race_candidates has no unique constraint on (race_id, full_name) — only a partial index on external_id WHERE NOT NULL. ON CONFLICT DO NOTHING would silently produce duplicates on re-run."
    impact: "Migration is fully idempotent; re-run produces INSERT 0 0 for elections and no new candidate rows."
  - decision: "is_incumbent=false for all 5 candidates including Azeem"
    rationale: "This is an open seat — Patricia Jehlen is retiring. Azeem is a Cambridge City Councillor running for the Senate seat, not an incumbent senator."
    impact: "Correct representation in the elections view; no incumbent badge shown."
  - decision: "primary_party='Democratic' required on the races row"
    rationale: "Unique constraint on races is (election_id, position_name, primary_party). Without it the row cannot be found reliably on re-run."
    impact: "Race correctly identified as a Democratic primary; general election race (if needed) would be a separate row."

metrics:
  tasks-completed: 3
  tasks-total: 3
  duration: "~12 minutes"
  completed: "2026-05-17"

commits:
  - hash: "5b52871"
    message: "feat(44-01): write migration 162 — MA 2026 election rows + 2nd Middlesex primary race"
    tasks: [1, 2]
---

# Phase 44 Plan 01: MA 2026 Elections Foundation Summary

Two MA 2026 election rows seeded (primary Sep 1, general Nov 3) plus the 2nd Middlesex Democratic primary race with all 5 known candidates, anchored by Burhan Azeem linked to his Cambridge City Councillor politician_id.

## What Was Done

### Task 1: Write migration 162 Part A — election rows
Created `C:/EV-Accounts/backend/migrations/162_ma_2026_elections_foundation.sql` with two idempotent INSERTs targeting the `UNIQUE (name, election_date, state)` constraint:

- `2026 Massachusetts State Primary` — election_type='primary', election_date='2026-09-01', jurisdiction_level='state', state='MA'
- `2026 Massachusetts General Election` — election_type='general', election_date='2026-11-03', jurisdiction_level='state', state='MA'

### Task 2: Write migration 162 Part B — race and candidates
Appended a `DO $$ DECLARE` block that:
1. Looks up the primary election UUID
2. Inserts the 2nd Middlesex Democratic primary race (ON CONFLICT DO NOTHING using the UNIQUE constraint on `election_id, position_name, primary_party`)
3. Inserts 5 candidates using `WHERE NOT EXISTS (SELECT 1 ... WHERE race_id=v_race AND full_name=...)` guards

Azeem's row links `politician_id = d2358e54-6860-4382-8c8d-95a3dabea874` (his Cambridge City Councillor record) with `is_incumbent = false` (open seat).

### Task 3: Apply migration via psql
- Applied migration — output: `INSERT 0 1 / INSERT 0 1 / DO`
- Verified idempotency — re-run output: `INSERT 0 0 / INSERT 0 0 / DO` (no duplicates)
- Registered in `supabase_migrations.schema_migrations` as version `20260517162000`

## Verification Results

All plan success criteria confirmed:

1. `essentials.elections` has exactly 2 MA rows: primary (2026-09-01) + general (2026-11-03) — PASS
2. `essentials.races` has 1 row for '2nd Middlesex District' with primary_party='Democratic', office_id='b1ed4e2a-4a9c-4b41-9e46-8500f608e026', linked to September primary — PASS
3. `essentials.race_candidates` has 5 rows; Azeem's row has politician_id='d2358e54-6860-4382-8c8d-95a3dabea874' and is_incumbent=false — PASS
4. Migration is idempotent (re-run: 0 elections inserted, 0 candidates inserted, no errors) — PASS

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Used WHERE NOT EXISTS instead of ON CONFLICT DO NOTHING for race_candidates**

- **Found during:** Task 2 (schema inspection before writing migration)
- **Issue:** The plan specified `ON CONFLICT DO NOTHING` for race_candidates, but the table has NO unique constraint on (race_id, full_name) — only a partial index on external_id where not null. ON CONFLICT DO NOTHING would have silently produced 5 duplicate rows on every re-run.
- **Fix:** Replaced with individual `INSERT ... SELECT ... WHERE NOT EXISTS` guards, one per candidate.
- **Files modified:** `C:/EV-Accounts/backend/migrations/162_ma_2026_elections_foundation.sql`
- **Commit:** 5b52871

## Next Phase Readiness

Plan 44-02 can begin immediately. It will need:
- The primary election UUID (query: `SELECT id FROM essentials.elections WHERE name='2026 Massachusetts State Primary' AND state='MA'`)
- Additional MA 2026 state races (other Senate districts, House districts, Governor's race, etc.)

No blockers for 44-02 or 44-03.
