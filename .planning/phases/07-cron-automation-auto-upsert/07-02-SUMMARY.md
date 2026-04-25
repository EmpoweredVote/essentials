---
phase: 07-cron-automation-auto-upsert
plan: 02
subsystem: infra
tags: [node-cron, cron, discovery, typescript, express, resend, email]

# Dependency graph
requires:
  - phase: 07-cron-automation-auto-upsert
    plan: 01
    provides: runDiscoveryForJurisdiction with autoUpsert + suppressRunEmail opts; DiscoveryRunSummary with autoUpserted field
provides:
  - discoveryCron.ts: acquireRunLock/releaseRunLock/isRunLockHeld/runDiscoverySweep exports
  - discoverySweep.ts: node-cron thin wrapper, Sunday 02:00 UTC weekly schedule
  - 409 ALREADY_RUNNING guard on both manual trigger routes
  - Sweep-summary email: per-jurisdiction breakdown of auto-upserted, uncertain, and failed outcomes
affects: [future-discovery-phases, deploy-ops, admin-review-workflow]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "In-process boolean lock with TTL timer for single-instance Render deployment (no Redis)"
    - "withRetry helper: exponential backoff (1s/2s/4s) on transient HTTP/network errors"
    - "Thin cron wrapper pattern: registration file imports service function, schedules, logs"
    - "Fire-and-forget + .finally() for lock release on background routes"

key-files:
  created:
    - C:/EV-Accounts/backend/src/lib/discoveryCron.ts
    - C:/EV-Accounts/backend/src/cron/discoverySweep.ts
  modified:
    - C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts
    - C:/EV-Accounts/backend/src/index.ts

key-decisions:
  - "In-process lock (not Redis) — correct for single-instance Render; process restart clears lock naturally"
  - "2-hour TTL on lock timer — guards slow sweeps; lock auto-expires and logs a warning"
  - "Sequential for...of over jurisdictions — never Promise.all; protects Anthropic rate limit quota"
  - "Sweep-summary email suppressed when all outcome lists are empty (no noise on clean sweeps)"
  - "Routes use acquireRunLock() not isRunLockHeld() + acquire — atomic check-and-set prevents TOCTOU"
  - "Lock released in .finally() on fire-and-forget promise chain — no leak on background run failure"
  - "Cron at '0 2 * * 0' (Sunday 02:00 UTC) — one hour before districtStaleness ('0 3 * * 0')"

patterns-established:
  - "Lock pattern: acquireRunLock() returns bool; routes return 409 ALREADY_RUNNING if false"
  - "Sweep email builder: HTML sections only rendered for non-empty outcome lists"
  - "RETRY_DELAYS_MS = [1000, 2000, 4000]: 3 attempts max; only retries on transient errors"

# Metrics
duration: 4min
completed: 2026-04-25
---

# Phase 7 Plan 02: Cron Sweep Orchestrator Summary

**Weekly discovery cron: node-cron sweep at Sunday 02:00 UTC with in-process lock, sequential jurisdiction processing, 3-attempt transient retry, and HTML sweep-summary email**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-25T21:50:40Z
- **Completed:** 2026-04-25T21:54:32Z
- **Tasks:** 3
- **Files modified:** 4 (2 created, 2 edited)

## Accomplishments

- Created `discoveryCron.ts` — the sweep orchestrator with 4 exports: acquireRunLock, releaseRunLock, isRunLockHeld, runDiscoverySweep; processes jurisdictions sequentially with withRetry backoff and builds per-section sweep-summary email
- Created `discoverySweep.ts` — thin node-cron wrapper wired into index.ts startup alongside 3 existing cron jobs, scheduled Sunday 02:00 UTC (one hour before districtStaleness)
- Added 409 ALREADY_RUNNING lock guards to both manual trigger routes (POST /discover/jurisdiction/:id and POST /discover/race/:id) using atomic acquireRunLock + .finally(releaseRunLock)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create discoveryCron.ts** — `6dce38e` (feat)
2. **Task 2: Create discoverySweep.ts and wire index.ts** — `fcf9641` (feat)
3. **Task 3: Add run-lock guards to manual trigger routes** — `5d36f36` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `C:/EV-Accounts/backend/src/lib/discoveryCron.ts` — Sweep orchestrator: lock API, withRetry helper, buildSweepSummaryEmail, runDiscoverySweep
- `C:/EV-Accounts/backend/src/cron/discoverySweep.ts` — node-cron registration thin wrapper (matches districtStaleness.ts pattern)
- `C:/EV-Accounts/backend/src/routes/essentialsDiscovery.ts` — Added acquireRunLock/releaseRunLock guards to both fire-and-forget trigger routes; 409 response on collision
- `C:/EV-Accounts/backend/src/index.ts` — Added import + startDiscoverySweepCron() call in startup block

## Decisions Made

- **In-process lock, not Redis** — Single-instance Render deployment; process restart clears the lock; 2h TTL timer guards against slow sweeps hanging the lock indefinitely
- **Sweep-summary email silence guard** — Email suppressed entirely when autoUpsertedByJurisdiction, uncertainPending, and failedJurisdictions are all empty; avoids noise on clean weeks
- **acquireRunLock() atomic check** — Routes call acquireRunLock() (atomic check-and-set) not isRunLockHeld() then acquireRunLock() (TOCTOU race) — isRunLockHeld exported as debugging aid only
- **Cron at 02:00 UTC Sunday** — One hour before districtStaleness (03:00 UTC); gives each cron breathing room; discovery sweep is heavier (Anthropic API calls) so runs first

## Deviations from Plan

None — plan executed exactly as written. The `export function` count in verification (3 vs expected 4) was a grep artifact: `runDiscoverySweep` is `export async function` and was not matched by the `export function` pattern; all 4 exports are present. TypeScript compiled cleanly throughout all three tasks.

## Issues Encountered

None — all three tasks completed without blocking issues. Build passed cleanly after each task.

## User Setup Required

None — no new environment variables or external services. ADMIN_EMAIL and ADMIN_REVIEW_URL are already documented from prior phases. The sweep-summary email uses the existing sendEmail/Resend integration established in Phase 6.

## Next Phase Readiness

Phase 7 is now complete. Both STAG-02 (auto-upsert for high-confidence candidates) and SCHED-03 (weekly cron sweep) are satisfied:

- STAG-02: autoUpsertToRaceCandidates() + audit trail in candidate_staging (07-01)
- SCHED-03: runDiscoverySweep() weekly cron with lock, retry, and summary email (07-02)

Post-deploy smoke test recommended: trigger a manual run via POST /discover/jurisdiction/:id, then POST a second time while the first is running — confirm 409 ALREADY_RUNNING is returned. Check server logs for `[cron] Discovery sweep registered` on startup.

---
*Phase: 07-cron-automation-auto-upsert*
*Completed: 2026-04-25*
