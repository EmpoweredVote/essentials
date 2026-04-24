---
phase: 05-db-foundation-agent-core
plan: 01
subsystem: database
tags: [postgres, migrations, discovery-pipeline]
requires: []
provides:
  - discovery_jurisdictions table in essentials schema
  - discovery_runs table in essentials schema
  - candidate_staging table in essentials schema
affects: [05-02, 05-03, 05-04, 06, 07]
tech-stack:
  added: []
  patterns: ["BEGIN/COMMIT idempotent migration with IF NOT EXISTS"]
key-files:
  created: [backend/migrations/070_discovery_tables.sql]
  modified: []
key-decisions:
  - "jurisdiction_geoid stored as text (no FK) — no essentials.jurisdictions table exists; matches existing codebase pattern"
  - "discovery_runs created before candidate_staging due to FK ordering requirement"
  - "citation_url NOT NULL enforces hallucination prevention at the schema layer"
  - "raw_output nullable — rows inserted with status=running BEFORE agent returns"
duration: 15min
completed: 2026-04-23
---

# Phase 5 Plan 01: DB Migrations Summary

**Migration 070 adds three essentials-schema tables forming the storage backbone for Claude-powered candidate discovery: jurisdiction registry, per-run audit log, and citation-required candidate staging queue**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-23T23:30:00Z
- **Completed:** 2026-04-23T23:45:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created `essentials.discovery_jurisdictions` — registry of (jurisdiction_geoid, election_date) pairs, with source_url and allowed_domains for agent configuration
- Created `essentials.discovery_runs` — one row per agent invocation tracking status, candidate counts, and raw JSONB output for hallucination audit
- Created `essentials.candidate_staging` — pending candidate queue with citation_url NOT NULL, confidence CHECK, action CHECK, and status CHECK constraints
- Unique index on (jurisdiction_geoid, election_date) prevents duplicate jurisdiction registrations
- Partial indexes on status='pending' and flagged=true for efficient admin queue queries

## Task Commits

1. **Task 1: Create migration 070** — `36cb281` (chore)

## Files Created/Modified

- `C:\EV-Accounts\backend\migrations\070_discovery_tables.sql` — Migration creating three discovery tables in essentials schema with all constraints, FKs, and indexes

## Decisions Made

- `jurisdiction_geoid text NOT NULL` instead of a UUID FK — there is no `essentials.jurisdictions` table in this codebase; geoid text matches the convention used in adminService, roleService, stanceService
- `discovery_runs` created before `candidate_staging` — FK dependency (`candidate_staging.run_id → discovery_runs.id`) requires this ordering
- `raw_output jsonb` is NOT NULL-constrained — rows are inserted with `status='running'` before the agent returns, so raw_output starts NULL; adding NOT NULL would require a two-step insert/update
- `citation_url text NOT NULL` on candidate_staging — hallucination prevention enforced at the schema layer, not just in service code

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

All three tables exist in the essentials schema. Plans 05-02 through 05-04 can now proceed. The tables are empty and ready to be populated by discoveryService.ts (Plan 05-03) and queried by essentialsDiscovery.ts (Plan 05-04).

---
*Phase: 05-db-foundation-agent-core*
*Completed: 2026-04-23*
