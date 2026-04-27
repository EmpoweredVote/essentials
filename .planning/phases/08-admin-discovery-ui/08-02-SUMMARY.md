---
phase: 08-admin-discovery-ui
plan: 02
subsystem: api
tags: [typescript, express, discovery, admin]

# Dependency graph
requires:
  - phase: 08-01
    provides: candidates_auto_upserted column on discovery_runs
provides:
  - GET /api/admin/discovery/jurisdictions — jurisdictions list with last-run summary and approved candidate count
  - GET /api/admin/discovery/runs — paginated run history with auto-upserted count
  - GET /api/admin/discovery/coverage — per-jurisdiction race coverage health

key-files:
  created:
    - C:/EV-Accounts/backend/src/routes/discoveryDashboard.ts
  modified:
    - C:/EV-Accounts/backend/src/index.ts

# Metrics
duration: ~10min
completed: 2026-04-27T01:07:38Z
---

# Phase 8 Plan 02: Discovery Dashboard Backend Summary

Three JWT-gated GET endpoints for the admin discovery dashboard read-side API, with SQL corrected to match actual schema column names and join paths.

## Accomplishments

- Created `discoveryDashboard.ts` with three endpoints gated per-route via `requireAuth + requireAdmin`
- Corrected schema deviations from plan: `discovery_jurisdiction_id` FK (not `jurisdiction_id`), `jurisdiction_name` column (not `name`), races joined via `elections` table (not direct `jurisdiction_id` on races)
- Added UUID validation on the optional `jurisdiction_id` query param in `/discovery/runs`
- Mounted router in `index.ts` after `stagingQueueAdminRouter` and before `essentialsDiscoveryRouter`, preserving dual-router JWT/X-Admin-Token ordering
- Build passes clean (no TypeScript errors)

## Task Commits

1. **Task 1: discoveryDashboard.ts** - `95a6de2` (feat)
2. **Task 2: index.ts mount** - `af0da56` (feat)

## Files Created/Modified

- `C:/EV-Accounts/backend/src/routes/discoveryDashboard.ts` — New router with GET /discovery/jurisdictions, /discovery/runs, /discovery/coverage; all JWT-gated per-route; pool.query() direct SQL
- `C:/EV-Accounts/backend/src/index.ts` — Added import + `app.use('/api/admin', discoveryDashboardRouter)` mount between stagingQueueAdminRouter and essentialsDiscoveryRouter

## Deviations from Plan

### Auto-fixed Schema Mismatches

**1. [Rule 1 - Bug] FK column is `discovery_jurisdiction_id`, not `jurisdiction_id`**

- **Found during:** Task 1, schema verification of migration 070
- **Issue:** Plan SQL used `WHERE jurisdiction_id = dj.id` but the actual column is `discovery_jurisdiction_id` throughout `discovery_runs` and `candidate_staging`
- **Fix:** Updated all three endpoints to use `discovery_jurisdiction_id`
- **Files modified:** `discoveryDashboard.ts`

**2. [Rule 1 - Bug] Column is `jurisdiction_name`, not `name`**

- **Found during:** Task 1, reading migration 070 CREATE TABLE statement
- **Issue:** Plan SQL selected `dj.name` but the column is `dj.jurisdiction_name`
- **Fix:** Used `dj.jurisdiction_name AS name` to preserve the expected JSON shape while matching actual schema
- **Files modified:** `discoveryDashboard.ts`

**3. [Rule 1 - Bug] Coverage query: races join via elections, not direct jurisdiction_id**

- **Found during:** Task 1, checking migration 042 (races table has no `jurisdiction_id` column)
- **Issue:** Plan SQL had `LEFT JOIN essentials.races r ON r.jurisdiction_id = dj.id` but `races` only has `election_id`; the join path is `discovery_jurisdictions → elections (via election_date + state) → races`
- **Fix:** Rewrote coverage join to `LEFT JOIN elections e ON e.election_date = dj.election_date AND e.state = dj.state`, then `LEFT JOIN races r ON r.election_id = e.id`; replaced LATERAL EXISTS with correlated EXISTS in CASE expressions to avoid null-row edge cases
- **Files modified:** `discoveryDashboard.ts`

## Next Phase Readiness

Wave 3 (frontend dashboard UI) can begin immediately. The three endpoints are live on the same JWT auth pattern as stagingQueueAdmin. No blockers.
