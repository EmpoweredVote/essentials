---
phase: 06-admin-review-ui-email-per-race-trigger
plan: 01
subsystem: admin-staging-ui
tags: [express, react, jwt, postgres, tailwind, optimistic-ui]

# Dependency graph
requires:
  - phase: 05-db-foundation-agent-core
    provides: candidate_staging table + approve/dismiss SQL logic + requireAdmin middleware
provides:
  - GET /api/admin/discovery/staging — JWT-authenticated endpoint returning LEFT-JOINed pending staging rows
  - POST /api/admin/discovery/staging/:id/approve — JWT-authenticated approve endpoint for browser use
  - POST /api/admin/discovery/staging/:id/dismiss — JWT-authenticated dismiss endpoint with required reason field
  - StagingQueue.jsx admin page with race grouping, confidence badges, urgency indicators, optimistic UI, and Undo toast
  - fetchStagingQueue, approveStagingCandidate, dismissStagingCandidate functions in adminApi.js
  - /admin/staging route registered in App.jsx under RequireAuth
affects: [07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Dual-router JWT-before-token mount pattern (stagingQueueAdminRouter mounted before essentialsDiscoveryRouter under /api/admin; Express mount order determines which auth layer intercepts first)
    - Route-level middleware application (requireAuth + requireAdmin on each route handler individually rather than mount-level, to avoid intercepting sibling mounts)
    - Optimistic UI with Undo toast (row removed immediately on action; 5s toast with Undo triggers re-fetch; on API error row is restored via re-fetch + red error toast)
    - Client-side race grouping with Map keyed on race_id or synthetic fallback for NULL race rows

key-files:
  created:
    - C:\EV-Accounts\backend\src\routes\stagingQueueAdmin.ts
    - C:\Transparent Motivations\essentials\src\pages\admin\StagingQueue.jsx
  modified:
    - C:\EV-Accounts\backend\src\index.ts
    - C:\Transparent Motivations\essentials\src\lib\adminApi.js
    - C:\Transparent Motivations\essentials\src\App.jsx

key-decisions:
  - "Separate JWT-gated router for browser UI rather than modifying existing token-gated Phase 5 endpoints — preserves server-to-server contract unchanged"
  - "Mount-level auth on new router was moved to route-level to avoid intercepting X-Admin-Token requests intended for essentialsDiscoveryRouter (bug fix f474d2a)"
  - "LEFT JOIN on races so race_id=NULL staging rows (no DB race match) are still visible in UI with race_hint fallback"
  - "Optimistic dismiss uses default reason 'Dismissed by admin' — UI does not prompt admin for a reason in v1"
  - "Undo after approve/dismiss is a UI-only re-fetch, not a DB reversal — acceptable v1 behaviour per CONTEXT.md"

patterns-established:
  - "Dual-router pattern: JWT-gated browser router + token-gated server-to-server router both mounted under same /api/admin prefix, JWT mount first"
  - "Route-level middleware: apply requireAuth + requireAdmin per route handler when mount-level would interfere with sibling mounts"
  - "adminApi.js pattern: apiFetch wrapper → null check (401 throw) → !res.ok check (throw with status) → res.json()"

# Metrics
duration: ~2h (including bug fix iteration)
completed: 2026-04-24
---

# Phase 6 Plan 01: Admin Staging Queue UI Summary

**JWT-gated Express router + React StagingQueue page with race grouping, confidence badges, 30-day urgency indicators, and optimistic approve/dismiss with Undo toast — browser admins can action the staging queue without DB access**

## Performance

- **Duration:** ~2h (including auth bug discovery and fix)
- **Completed:** 2026-04-24
- **Tasks:** 2 (+ 1 checkpoint: human-verify, approved by user)
- **Files modified:** 5 (2 created, 3 modified)

## Accomplishments

- New `stagingQueueAdmin.ts` router exposes three JWT-authenticated endpoints (GET list, POST approve, POST dismiss) for the browser admin UI, leaving Phase 5 X-Admin-Token endpoints untouched for server-to-server use
- `StagingQueue.jsx` groups pending candidates by race with election date ordering, color-coded confidence badges (green/yellow/red), urgency highlighting for elections within 30 days, optimistic remove-on-action, and a 5-second Undo toast
- Auth bug (mount-level middleware intercepting token-gated sibling router) discovered and fixed — middleware moved to route-level so X-Admin-Token discovery trigger continues to work

## Task Commits

Each task was committed atomically:

1. **Task 1: Create JWT-gated staging queue router + wire into index.ts** - `815c502` (feat)
2. **Task 2: Add adminApi functions + build StagingQueue.jsx + register route** - `7265f6c` (feat)
3. **Bug fix: Move requireAuth + requireAdmin from mount-level to route-level** - `f474d2a` (fix)

## Files Created/Modified

- `C:\EV-Accounts\backend\src\routes\stagingQueueAdmin.ts` — Express Router with JWT-gated GET /discovery/staging (LEFT JOIN races/elections/discovery_jurisdictions, ORDER BY election_date ASC NULLS LAST, confidence ASC), POST /discovery/staging/:id/approve, and POST /discovery/staging/:id/dismiss; uses pool.query only
- `C:\EV-Accounts\backend\src\index.ts` — Added stagingQueueAdminRouter import; mounted under /api/admin with requireAuth + requireAdmin applied at route level, placed before the requireAdminToken essentialsDiscoveryRouter mount
- `C:\Transparent Motivations\essentials\src\lib\adminApi.js` — Added fetchStagingQueue, approveStagingCandidate, dismissStagingCandidate following existing apiFetch error-shape pattern
- `C:\Transparent Motivations\essentials\src\pages\admin\StagingQueue.jsx` — Full admin review page: groupByRace helper (Map keyed on race_id with synthetic key for NULL rows), daysUntil urgency logic, Toast component with 5s auto-dismiss and Undo, QueueRow with confidence badge + flag_reason display, optimistic approve/dismiss with re-fetch on error
- `C:\Transparent Motivations\essentials\src\App.jsx` — Added /admin/staging Route under RequireAuth

## Decisions Made

- Created a new JWT-gated router rather than modifying the Phase 5 token-gated endpoints. The browser's `apiFetch` sends only JWT Bearer; X-Admin-Token auth is reserved for cron/server-to-server callers. Dual-router pattern already existed in the codebase (campaignFinanceAdmin).
- Used LEFT JOIN on `essentials.races` so rows with `race_id = NULL` are not silently dropped — they appear in the UI under a group labeled with `race_hint` or "Unknown race", making it clear the discovery agent found a candidate but could not match a race.
- Optimistic Undo does not reverse the DB write — it re-fetches the queue. If the row was already committed, Undo will simply show an empty group. Acceptable for v1 per CONTEXT.md.
- Default dismiss reason `'Dismissed by admin'` injected in `dismissStagingCandidate` so the UI does not need to prompt for a reason in v1 (backend requires min-1-char reason).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mount-level requireAuth + requireAdmin intercepted X-Admin-Token requests to essentialsDiscoveryRouter**

- **Found during:** Post-task checkpoint verification (user testing)
- **Issue:** The plan's initial mount `app.use('/api/admin', requireAuth, requireAdmin, stagingQueueAdminRouter)` applied those middleware to ALL `/api/admin` traffic before Express could route to the essentialsDiscoveryRouter mount. This caused the Phase 5 discovery trigger endpoint (`POST /api/admin/discover/jurisdiction/:id` with X-Admin-Token) to receive a 401 instead of 202 — it never reached the token-auth layer.
- **Fix:** Removed middleware from the `app.use` mount entirely. Applied `requireAuth` and `requireAdmin` individually on each of the three route handlers inside `stagingQueueAdmin.ts`. The mount now reads `app.use('/api/admin', stagingQueueAdminRouter)` with no mount-level middleware.
- **Files modified:** `C:\EV-Accounts\backend\src\routes\stagingQueueAdmin.ts`, `C:\EV-Accounts\backend\src\index.ts`
- **Verification:** Browser JWT calls to `/api/admin/discovery/staging` return 200; `POST /api/admin/discover/jurisdiction/:id` with X-Admin-Token returns 202 (regression confirmed by user).
- **Committed in:** `f474d2a` (fix commit, separate from task commits)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Required to restore Phase 5 server-to-server trigger functionality. No scope creep — the fix narrowed middleware scope without changing any business logic.

## Issues Encountered

The plan's mount-order strategy described placing `requireAuth + requireAdmin` at the `app.use` level for the new router. In practice this caused Express to apply those middleware to all subsequent `/api/admin` mounts sharing the same prefix, not just the new router's routes. The route-level middleware pattern was the correct fix and is consistent with how `adminRouter` applies auth internally in this codebase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin staging review UI is fully operational on production. Admins can approve and dismiss staged candidates without DB access.
- Phase 5 X-Admin-Token trigger endpoints confirmed unaffected — server-to-server discovery still works.
- Phase 6 Plan 02 (per-race email trigger) can build on the same dual-router pattern and the same `candidate_staging` table already surfaced here.
- No blockers.

---
*Phase: 06-admin-review-ui-email-per-race-trigger*
*Completed: 2026-04-24*
