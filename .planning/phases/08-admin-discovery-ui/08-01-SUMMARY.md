---
phase: 08-admin-discovery-ui
plan: 01
subsystem: api
tags: [typescript, postgres, migration, discovery]

# Dependency graph
requires:
  - phase: 07-cron-automation-auto-upsert
    provides: autoUpserted tracking in discoveryService.ts
provides:
  - candidates_auto_upserted column on essentials.discovery_runs
  - discoveryService.ts persists autoUpserted count on run completion

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive migration with IF NOT EXISTS for idempotency"
    - "Parameterized UPDATE extending existing run-completion query"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/083_discovery_runs_auto_upserted.sql
  modified:
    - C:/EV-Accounts/backend/src/lib/discoveryService.ts

key-decisions:
  - "DEFAULT 0 covers backfill — historical runs predate auto-upsert so 0 is semantically correct"

# Metrics
duration: 2min
completed: 2026-04-27T01:02:12Z
---

# Phase 8 Plan 01: Migration 083 + Auto-Upserted Persistence Summary

Added `candidates_auto_upserted INT NOT NULL DEFAULT 0` to `essentials.discovery_runs` and wired `discoveryService.ts` to persist the in-memory `autoUpserted` count to that column on run completion.

## Performance

- **Duration:** 2 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created and applied migration 083 which adds `candidates_auto_upserted` column to `essentials.discovery_runs` with `IF NOT EXISTS` idempotency guard
- Updated success-path UPDATE in `discoveryService.ts` to include `candidates_auto_upserted = $5` and renumbered `raw_output` from `$5` to `$6`
- Phase 7's in-memory `autoUpserted` counter is now durably persisted to the database on every completed run
- Migration verified against live database: column type `integer`, `not null`, default `0`
- Build passes with 0 TypeScript errors

## Task Commits

1. **Task 1: Migration 083** - `3fa2340` (chore)
2. **Task 2: discoveryService.ts UPDATE** - `cbac75f` (feat)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/083_discovery_runs_auto_upserted.sql` — Additive migration adding `candidates_auto_upserted INT NOT NULL DEFAULT 0` to `essentials.discovery_runs`, wrapped in `BEGIN;/COMMIT;` with `IF NOT EXISTS`
- `C:/EV-Accounts/backend/src/lib/discoveryService.ts` — Extended success-path UPDATE to set `candidates_auto_upserted` from in-memory `autoUpserted` variable; renumbered `raw_output` param from `$5` to `$6`

## Deviations from Plan

None — plan executed exactly as written.
