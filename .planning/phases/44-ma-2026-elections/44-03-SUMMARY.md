---
phase: 44
plan: "03"
subsystem: elections-data
tags: [ma, elections, discovery, cambridge, migration, cron]
one-liner: "Four rows seeded — two MA state discovery_jurisdictions rows (primary 2026-09-01 + general 2026-11-03) and 2027 Cambridge Municipal Election placeholder with its discovery row outside the 180-day cron horizon"

dependency-graph:
  requires:
    - "44-01 (MA 2026 election rows in essentials.elections)"
    - "38-ma-geofences (Cambridge geo_id='2511000' established as G4110 FIPS place code)"
  provides:
    - "essentials.discovery_jurisdictions: 2 rows for jurisdiction_geoid='25' (MA primary + general 2026)"
    - "essentials.discovery_jurisdictions: 1 row for jurisdiction_geoid='2511000' (Cambridge 2027 placeholder)"
    - "essentials.elections: 2027 Cambridge Municipal Election placeholder row"
  affects:
    - "Discovery cron (Sunday 02:00 UTC): now armed to sweep MA state-level candidates from Sep 2026 onward"
    - "Cambridge 2027 row will enter cron sweep horizon ~May 2027 (180 days before Nov 2, 2027)"

tech-stack:
  added: []
  patterns:
    - "ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING — idempotent discovery row inserts"
    - "ON CONFLICT (name, election_date, state) DO NOTHING — idempotent elections row inserts"
    - "180-day cron horizon exclusion verified via SQL: (election_date <= CURRENT_DATE + INTERVAL '180 days')"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/164_ma_discovery_jurisdictions_cambridge_placeholder.sql"
  modified: []

decisions:
  - decision: "All four rows written in a single migration file (164) rather than two separate files"
    rationale: "Tasks 1 and 2 both modify the same file per the plan spec; logically one atomic migration covers all four inserts cleanly"
    impact: "Single migration registered as version 20260517164000 in schema_migrations"
  - decision: "Cambridge 2027 discovery row uses election_date='2027-11-02' intentionally"
    rationale: "First Tuesday after first Monday in November 2027: Nov 1=Monday, so Nov 2 is correct. Row is ~535 days from May 17, 2026 — well outside 180-day horizon"
    impact: "Cambridge row will not trigger premature discovery sweeps; enters cron scope naturally around May 2027"
  - decision: "MA general election 2026-11-03 is already within 180-day horizon as of May 17, 2026"
    rationale: "170 days from today — technically within 180-day sweep window. This is correct behavior: cron will sweep both 2026 rows once discovery runs are triggered"
    impact: "Both MA 2026 rows will be swept by Sunday cron; this is the intended behavior for the discovery pipeline"

metrics:
  tasks-completed: 3
  tasks-total: 3
  duration: "~2 minutes"
  completed: "2026-05-17"

commits:
  - hash: "f0d3111"
    message: "feat(44-03): write migration 164 — MA discovery_jurisdictions rows + 2027 Cambridge placeholder"
    tasks: [1, 2, 3]
---

# Phase 44 Plan 03: MA Discovery Jurisdictions + Cambridge Placeholder Summary

Four rows seeded — two MA state discovery_jurisdictions rows (primary 2026-09-01 + general 2026-11-03) and a 2027 Cambridge Municipal Election placeholder with its discovery row intentionally outside the 180-day cron horizon.

## What Was Done

### Task 1: Write migration 164 Part A — MA state discovery_jurisdictions rows

Confirmed actual schema of `essentials.discovery_jurisdictions` before writing:
- Column names verified: `jurisdiction_geoid`, `jurisdiction_name`, `state (char 2)`, `election_date`, `source_url`, `allowed_domains (text[])`
- Unique index: `idx_discovery_jurisdictions_geoid_date UNIQUE (jurisdiction_geoid, election_date)`

Created `C:/EV-Accounts/backend/migrations/164_ma_discovery_jurisdictions_cambridge_placeholder.sql` with two inserts:

- `jurisdiction_geoid='25'`, `election_date='2026-09-01'` — Commonwealth of Massachusetts, MA primary
- `jurisdiction_geoid='25'`, `election_date='2026-11-03'` — Commonwealth of Massachusetts, MA general

Both use `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` for idempotency. Both point to `sec.state.ma.us` as source with `allowed_domains=['sec.state.ma.us', 'ballotpedia.org', 'malegislature.gov']`.

### Task 2: Append to migration 164 — 2027 Cambridge placeholder

Appended to the same migration file:

- `essentials.elections` INSERT: `'2027 Cambridge Municipal Election'`, `election_date='2027-11-02'`, `election_type='general'`, `jurisdiction_level='city'`, `state='MA'`
- `essentials.discovery_jurisdictions` INSERT: `jurisdiction_geoid='2511000'` (Cambridge G4110 FIPS, confirmed Phase 38), `election_date='2027-11-02'`, `allowed_domains=['cambridgema.gov', 'cambridgecivic.com', 'ballotpedia.org']`

November 2027 date calculation: Nov 1, 2027 = Monday → first Tuesday after first Monday = Nov 2, 2027.

### Task 3: Apply migration 164 and verify cron horizon exclusion

Applied migration via psql — output: `INSERT 0 1` × 4 (all four rows inserted).

Re-run confirmed idempotency: `INSERT 0 0` × 4 (zero new rows).

Registered in `supabase_migrations.schema_migrations` as version `20260517164000`.

180-day cron horizon verification results (as of 2026-05-17):

| jurisdiction_geoid | jurisdiction_name             | election_date | would_be_swept |
|--------------------|-------------------------------|---------------|----------------|
| 25                 | Commonwealth of Massachusetts | 2026-09-01    | true           |
| 25                 | Commonwealth of Massachusetts | 2026-11-03    | true           |
| 2511000            | City of Cambridge             | 2027-11-02    | false          |

Cambridge confirmed outside 180-day horizon — will not trigger premature discovery sweeps.

## Verification Results

All plan success criteria confirmed:

1. `essentials.discovery_jurisdictions` has row for `jurisdiction_geoid='25'` with `election_date='2026-09-01'` — PASS
2. `essentials.discovery_jurisdictions` has row for `jurisdiction_geoid='25'` with `election_date='2026-11-03'` — PASS
3. `essentials.elections` has `'2027 Cambridge Municipal Election'`, `election_date='2027-11-02'`, `election_type='general'`, `jurisdiction_level='city'`, `state='MA'` — PASS
4. `essentials.discovery_jurisdictions` has row for `jurisdiction_geoid='2511000'` with `election_date='2027-11-02'` and `allowed_domains` includes `cambridgema.gov` — PASS
5. Cambridge `would_be_swept=false` (180-day horizon exclusion confirmed) — PASS
6. Migration idempotent (re-run: 0 new rows, no errors) — PASS

## Deviations from Plan

None — plan executed exactly as written. Schema inspection confirmed column names matched the plan's assumptions exactly.

## Next Phase Readiness

Phase 44 is complete (3/3 plans):
- Plan 44-01: MA 2026 elections foundation (migration 162 applied)
- Plan 44-02: Additional MA 2026 races (migration 163 — runs in parallel)
- Plan 44-03: MA discovery_jurisdictions + Cambridge 2027 placeholder (migration 164 applied)

The discovery cron (Sunday 02:00 UTC) is now armed to sweep MA state-level candidates for both the September 1 primary and November 3 general on their natural cadence. Cambridge 2027 will enter cron scope ~May 2027.
