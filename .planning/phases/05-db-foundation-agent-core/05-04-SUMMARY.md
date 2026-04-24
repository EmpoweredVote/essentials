---
phase: 05-db-foundation-agent-core
plan: 04
subsystem: discovery-pipeline
tags: [express, typescript, admin-api, postgres]
requires:
  - phase: 05-03
    provides: runDiscoveryForJurisdiction orchestrator
provides:
  - POST /api/admin/discover/jurisdiction/:id — trigger discovery run
  - POST /api/admin/discovery/staging/:id/approve — approve staging row
  - POST /api/admin/discovery/staging/:id/dismiss — dismiss staging row with reason
affects: [06, 07]
tech-stack:
  added: []
  patterns:
    - "fire-and-forget trigger with .catch handler for 202 response"
    - "requireAdminToken mounted before JWT adminRouter to avoid middleware interception"
    - "409 ALREADY_REVIEWED for idempotent state transitions"
key-files:
  created: [backend/src/routes/essentialsDiscovery.ts]
  modified: [backend/src/index.ts]
key-decisions:
  - "Discovery router mounted BEFORE adminRouter in index.ts — adminRouter's JWT middleware would intercept token-auth requests at the same /api/admin path"
  - "requireAdminToken applied at mount (index.ts), not inside the router file — consistent with batchIngestHandler pattern"
  - "202 fire-and-forget — discovery runs take 30-60s; awaiting before respond would time out clients"
  - "409 for already-reviewed rows — not 400; idempotency guard"
  - "approve when race_id=NULL succeeds with warning — doesn't block workflow, just flags that Phase 7 auto-upsert won't work until a race row exists"
duration: 25min
completed: 2026-04-24
---

# Phase 5 Plan 04: Admin HTTP Endpoints Summary

**Three X-Admin-Token-gated endpoints completing the Phase 5 command-line discovery loop: trigger a background run (202), approve a staging row (200), dismiss with reason (200) — wired before JWT adminRouter to avoid middleware interception**

## Performance

- **Duration:** ~25 min
- **Tasks:** 2 auto + 1 checkpoint
- **Files modified:** 2

## Accomplishments

- Created essentialsDiscovery.ts router with three POST endpoints, zero auth wiring inside the file
- Mounted discovery router BEFORE adminRouter in index.ts — discovery routes checked first; unmatched requests fall through to JWT-auth adminRouter
- 202 fire-and-forget trigger: discovery runs 30-60s; immediate response with .catch handler preventing process crash on background failure
- 409 ALREADY_REVIEWED for double-approve/dismiss — idempotency without silent re-stamping
- Fixed TypeScript: req.params destructuring produces `string | string[]` in this project's tsconfig — cast to `as string` consistent with all other routes in the codebase

## Task Commits

1. **Task 1: Create essentialsDiscovery router** — `16613ac` (feat)
2. **Task 2: Wire into index.ts** — `dc01b5c` (feat)

## Files Created/Modified

- `C:\EV-Accounts\backend\src\routes\essentialsDiscovery.ts` — three POST endpoints
- `C:\EV-Accounts\backend\src\index.ts` — import + mount before adminRouter

## Decisions Made

- Discovery router mounted before adminRouter: adminRouter applies `router.use(requireAuth, requireAdmin)` to ALL /api/admin/* requests — if discovery router were mounted after, JWT middleware would intercept and 401 all token-auth requests
- requireAdminToken not in the router file: consistent with batchIngestHandler pattern (auth at app.use level, not router level)
- approve succeeds when race_id=NULL but includes warning field: don't block the workflow; Phase 7 auto-upsert handles promotion when race exists

## Deviations from Plan

**1. [Rule 1 - Bug] Fixed TypeScript `req.params` destructuring type error**

- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** `const { id } = req.params` produces `string | string[]` which doesn't satisfy the `string` parameter expected by `UUID_REGEX.test()` and `pool.query()`. Four occurrences across three route handlers.
- **Fix:** Changed all four destructuring assignments to `const id = req.params.id as string` — consistent with the pattern used throughout all other routes in this codebase (confirmed in essentialsPoliticians.ts).
- **Files modified:** backend/src/routes/essentialsDiscovery.ts
- **Verification:** tsc --noEmit passes with zero errors

## Issues Encountered

None beyond the TypeScript params type fix above.

## Next Phase Readiness

Phase 5 complete. Full command-line loop works: register jurisdiction → trigger run → stage candidates → approve/dismiss. Phase 6 can build the Admin Review UI on top of these APIs.
