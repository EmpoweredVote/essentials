---
phase: 06-admin-review-ui-email-per-race-trigger
plan: 02
subsystem: discovery-notifications
tags: [resend, email, discoveryService, typescript, confidence-scoring]

# Dependency graph
requires:
  - phase: 05-db-foundation-agent-core
    provides: discoveryService.ts orchestrator with staging loop, emailService.ts no-throw sendEmail
provides:
  - review notification email (urgency-aware subject, per-confidence-tier counts, link to /admin/staging)
  - failure alert email (jurisdiction name, run ID, error message in body)
  - zero-candidate regression alert (fires only when current run = 0 AND prior completed run > 0)
  - uncertainStaged, matchedStaged, officialStaged counters on DiscoveryRunSummary interface
affects: [07]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - post-UPDATE email placement (email fires AFTER run row is finalized, preventing double-finalization on send failure)
    - no-throw sendEmail await pattern (sendEmail has internal try/catch; safe to await without wrapping)
    - prior-run lookup for regression detection (SELECT candidates_found WHERE status='completed' AND id <> $runId ORDER BY completed_at DESC LIMIT 1)

key-files:
  created: []
  modified:
    - C:\EV-Accounts\backend\src\lib\discoveryService.ts

key-decisions:
  - "Use uncertainStaged (not candidatesStaged) as X in the review email subject — 'need review' semantically maps to the uncertain bucket; official and matched may auto-promote in Phase 7"
  - "Email block placed AFTER step 7 UPDATE (run marked completed) and BEFORE return — ensures email fires only on finalized runs; a send failure cannot cause re-finalization"
  - "Failure email placed AFTER catch-block UPDATE to 'failed' and BEFORE throw err — run is persisted as failed regardless of email outcome"
  - "ADMIN_REVIEW_URL env var falls back to production URL https://essentials.empowered.vote/admin/staging"
  - "Zero-regression alert uses prior-run DB lookup at send time rather than caching, keeping logic simple and avoiding stale state"

patterns-established:
  - "No-throw email await: await sendEmail() inside discovery orchestrator without try/catch because emailService guarantees internal catch"
  - "Post-finalization notification: all emails fire after the run row status is written to DB so row state is always correct even if email fails"

# Metrics
duration: ~30min
completed: 2026-04-24
---

# Phase 06 Plan 02: Email Notifications Summary

**Discovery pipeline extended with three email triggers — urgency-aware review notification, failure alert, and zero-candidate regression alert — all using the existing no-throw emailService with no new dependencies.**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-04-24
- **Completed:** 2026-04-24
- **Tasks:** 3 (plus checkpoint verified by user)
- **Files modified:** 1

## Accomplishments

- Extended `DiscoveryRunSummary` with per-confidence counters (`uncertainStaged`, `matchedStaged`, `officialStaged`) populated inside the existing staging loop
- Added success-branch email block: review notification fires when `candidatesStaged > 0`; subject is `[URGENT] X candidates need review — [J] election in N days` when election is within 30 days, else `X candidates need review — [J]`; body lists all three confidence counts plus a direct link to the review queue
- Added success-branch zero-candidate regression alert: queries prior completed run for the same jurisdiction and fires when current run returns 0 candidates but prior run had > 0
- Added failure-branch email in catch block: fires after `UPDATE ... SET status = 'failed'` and before `throw err`, including jurisdiction name, run ID, and error message
- User verified zero-regression alert end-to-end: Pasadena returned 0 vs 3 previously; email received at correct sender with correct subject and body

## Task Commits

Each task was committed atomically:

1. **Task 1: Add three-way confidence counters + DiscoveryRunSummary extension** - `363d955` (feat)
2. **Task 2: Add review-notification email + zero-candidate regression alert in success branch** - `b509bfa` (feat)
3. **Task 3: Add failure-branch email in catch block** - `58af767` (feat)

## Files Created/Modified

- `C:\EV-Accounts\backend\src\lib\discoveryService.ts` — Extended `DiscoveryRunSummary` interface; added `uncertainStaged`/`matchedStaged`/`officialStaged` counters to staging loop; added `buildReviewEmailHtml` helper; added three email trigger blocks (review notification, zero-regression alert, failure alert); added `import { sendEmail }` from emailService

## Decisions Made

**Use `uncertainStaged` as X in the review subject line.** The plan's CONTEXT.md specifies `X candidates need review` in the subject but does not define whether X is the uncertain count alone or all staged candidates. "Need review" semantically maps to the uncertain bucket — official and matched candidates may auto-promote in Phase 7 without admin interaction. Using the uncertain count sets accurate expectations about how many items actually require a human decision. This is a one-line change if the preference shifts to total staged.

**Email placement: post-UPDATE, pre-return (success) / post-UPDATE, pre-throw (failure).** All email calls are placed after the discovery_runs row is finalized in the database. If sendEmail itself throws (it won't, but defensively), the run status is already correct in the DB. The email block is outside any further transaction work, so send failures cannot cause partial state.

**No new dependencies.** The existing `emailService.sendEmail` raw-fetch Resend wrapper is used as-is. No templating engine, no additional npm packages.

**ADMIN_REVIEW_URL env var with fallback.** The review link in the notification email uses `process.env.ADMIN_REVIEW_URL` if set, otherwise falls back to `https://essentials.empowered.vote/admin/staging`. This allows staging environments to override without code changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled cleanly after each task. User verification confirmed end-to-end email delivery via Resend with `ADMIN_EMAIL` and `RESEND_API_KEY` set on the Render ev-accounts-api service.

## User Setup Required

Two environment variables must be set on the Render `ev-accounts-api` service (user confirmed both are already set):

- `ADMIN_EMAIL` — destination address for all three notification types; if unset, all email blocks are skipped silently and discovery runs proceed normally
- `RESEND_API_KEY` — Resend API key; if unset, `emailService` logs a warning and no-ops without throwing
- `ADMIN_REVIEW_URL` (optional) — override for the review link in the notification body; defaults to `https://essentials.empowered.vote/admin/staging`

## Next Phase Readiness

- Phase 6 OBS-02 and OBS-03 success criteria are met
- `DiscoveryRunSummary` now exposes `uncertainStaged`, `matchedStaged`, `officialStaged` — Phase 7 can consume these counters if it needs to drive auto-promotion logic or display breakdowns in the admin UI
- No blockers for Phase 07

---
*Phase: 06-admin-review-ui-email-per-race-trigger*
*Completed: 2026-04-24*
