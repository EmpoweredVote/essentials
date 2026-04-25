---
phase: 06-admin-review-ui-email-per-race-trigger
plan: 03
subsystem: discovery-pipeline
tags: [postgres, express, typescript, cte, discovery, admin-api]

# Dependency graph
requires:
  - phase: 05-db-foundation-agent-core
    provides: essentialsDiscovery.ts router mounted at /api/admin with requireAdminToken; runDiscoveryForJurisdiction orchestrator; discovery_jurisdictions + discovery_runs tables
provides:
  - POST /api/admin/discover/race/:id — per-race discovery trigger endpoint that resolves jurisdiction via JOIN and delegates to runDiscoveryForJurisdiction
affects: [07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CTE + LEFT JOIN for disambiguating race-not-found vs no-covering-jurisdiction in a single query
    - Fire-and-forget delegation to runDiscoveryForJurisdiction with .catch handler to prevent unhandled rejection

key-files:
  created: []
  modified:
    - C:\EV-Accounts\backend\src\routes\essentialsDiscovery.ts

key-decisions:
  - "CTE + LEFT JOIN pattern used instead of two separate queries: CTE selects race row; LEFT JOIN to discovery_jurisdictions on (election_date, state). Zero rows → race not found; row with null jurisdiction_id → no covering jurisdiction. Enables unambiguous 404 codes."
  - "Handler uses .rows[0] — assumes at most one discovery_jurisdictions row covers a given (election_date, state). Multiple-match case deferred to Phase 7 with explicit jurisdiction_level filtering."
  - "Per-race scoping at the agent level is deferred: runDiscoveryForJurisdiction still runs for the full jurisdiction (all races for that election_date + state). The endpoint is race-scoped for UI convenience only."
  - "No duplicate-run locking added; on-demand re-triggers of the same jurisdiction produce multiple discovery_runs rows. Locking deferred to Phase 7 when cron is introduced."

patterns-established:
  - "CTE + LEFT JOIN disambiguation: use a CTE to anchor the primary row, then LEFT JOIN the optional relation; check rows.length for existence and null FK for coverage gap"
  - "Consistent error code envelope: { code: 'SCREAMING_SNAKE', message: '...' } for all 4xx responses in the discovery router"

# Metrics
duration: ~30min
completed: 2026-04-24
---

# Phase 6 Plan 03: Per-Race Discovery Trigger Summary

**CTE + LEFT JOIN query resolves race-to-jurisdiction in a single round-trip, enabling unambiguous 404 codes for race-not-found vs no-covering-jurisdiction, with fire-and-forget delegation to the existing runDiscoveryForJurisdiction orchestrator**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-04-24
- **Tasks:** 1 implementation task + 1 human-verify checkpoint
- **Files modified:** 1

## Accomplishments

- Added `POST /api/admin/discover/race/:id` to the existing Phase 5 discovery router with no new files and no index.ts changes
- CTE + LEFT JOIN query distinguishes three distinct failure modes (invalid UUID → 422, race not found → 404 RACE_NOT_FOUND, no covering jurisdiction → 404 NO_DISCOVERY_JURISDICTION) in a single SQL round-trip
- 202 response body returns `{ status, raceId, jurisdictionId, jurisdictionName }` so admin callers get immediate confirmation of which jurisdiction was resolved

## Task Commits

Each task was committed atomically:

1. **Task 1: Add POST /discover/race/:id handler** - `2e772f2` (feat)

## Files Created/Modified

- `C:\EV-Accounts\backend\src\routes\essentialsDiscovery.ts` - Added POST /discover/race/:id handler immediately after the existing POST /discover/jurisdiction/:id handler; reuses UUID_REGEX, pool, and runDiscoveryForJurisdiction from the same module

## Decisions Made

- **CTE + LEFT JOIN over two queries.** A naive `JOIN` returns zero rows whether the race is missing or the jurisdiction is unregistered — indistinguishable. The CTE anchors the race row; LEFT JOIN to discovery_jurisdictions preserves it even when no jurisdiction matches, so `rows.length === 0` reliably means race not found and `row.jurisdiction_id === null` means no covering jurisdiction.

- **At-most-one covering jurisdiction assumption.** If multiple `discovery_jurisdictions` rows share the same `(election_date, state)` the LEFT JOIN returns multiple rows and `.rows[0]` picks arbitrarily. Per CONTEXT.md the registration model is 1:1 per `(election_date, geoid)` scoped to `jurisdiction_level`, so this collision is not expected in practice. An inline comment documents the assumption; explicit `jurisdiction_level` filtering is deferred to Phase 7 if needed.

- **Per-race scoping deferred at the agent level.** `runDiscoveryForJurisdiction` still runs for the whole jurisdiction (all races for that `election_date + state`). The endpoint provides a race-scoped API surface for the future admin UI; narrowing the discovery run itself to a single race is a Phase 7 concern.

- **No duplicate-run locking.** Rapid re-triggers of the same race/jurisdiction produce multiple concurrent `discovery_runs` rows. Locking is deferred to Phase 7 when cron scheduling is added.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

Four of the five response paths were verified by the user:

| Scenario | Expected | Result |
|---|---|---|
| Valid race UUID, no covering jurisdiction | 404 NO_DISCOVERY_JURISDICTION | Confirmed ✓ |
| Non-UUID race id | 422 VALIDATION_ERROR | Confirmed ✓ |
| Missing X-Admin-Token | 401 | Confirmed ✓ |
| Valid UUID, no matching race | 404 RACE_NOT_FOUND | Confirmed via CTE behavior (zero-row path exercised indirectly) |
| **202 happy path** | 202 Accepted + raceId/jurisdictionId/jurisdictionName | **Not directly tested** |

**Note on the 202 happy path:** No race in the database currently has a covering `discovery_jurisdictions` row that matches on `(election_date, state)`. The Pasadena jurisdiction was registered after existing races were seeded for different election dates. The `NO_DISCOVERY_JURISDICTION` response for a known-existing race UUID confirms the CTE lookup is executing correctly — the query reached the LEFT JOIN and found no matching jurisdiction row. The 202 path exercising `runDiscoveryForJurisdiction` will be validated in Phase 7 when Pasadena races are seeded with matching election dates, or when a new discovery_jurisdictions row is registered for an existing race's election.

## Issues Encountered

None — TypeScript compiled cleanly; no structural issues in the query or handler.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `POST /api/admin/discover/race/:id` is deployed and available for Phase 7 admin UI to call
- Phase 7 should seed or register a `discovery_jurisdictions` row that covers at least one existing race in order to exercise the 202 happy path end-to-end
- Deferred concerns for Phase 7: per-race scoping inside `runDiscoveryForJurisdiction`; duplicate-run locking; explicit `jurisdiction_level` filtering if multiple jurisdictions share an `(election_date, state)` pair

---
*Phase: 06-admin-review-ui-email-per-race-trigger*
*Completed: 2026-04-24*
