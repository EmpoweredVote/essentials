---
status: passed
---

# Phase 7 Verification

**Phase Goal:** Discovery runs automatically on a weekly schedule for all registered jurisdictions, and high-confidence candidates are upserted to race_candidates without requiring manual approval.

**Verified:** 2026-04-25T00:00:00Z

## Must-Haves

| # | Check | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sunday 02:00 UTC cron + for...of loop + election_date horizon query | ✓ | `cron.schedule('0 2 * * 0', ...)` in discoverySweep.ts:21; `for (const j of jurisdictions)` in discoveryCron.ts:226; SQL `WHERE election_date > now() AND election_date <= $1` in discoveryCron.ts:204-207 |
| 2 | Both POST routes return HTTP 409 ALREADY_RUNNING via acquireRunLock() before fire-and-forget | ✓ | `acquireRunLock()` called at line 65 and 150 in essentialsDiscovery.ts; 409 with `code: 'ALREADY_RUNNING'` returned at lines 66-70 and 151-155 |
| 3 | Sweep skips when lock held, with console warning | ✓ | `if (!acquireRunLock()) { console.warn('...Skipping sweep...'); return; }` at discoveryCron.ts:192-195 |
| 4 | Single combined sweep-summary email sent once at end via buildSweepSummaryEmail | ✓ | `buildSweepSummaryEmail` defined at discoveryCron.ts:125; `sendEmail` called exactly once at line 290, after the `for...of` loop completes |
| 5 | No email sent when zero auto-upserts, zero uncertain, zero failures | ✓ | `hasContent` guard at discoveryCron.ts:275-280: `if (adminEmail && hasContent)` gates the sendEmail call |
| 6 | Up to 3 retries on transient errors with [1000, 2000, 4000]ms backoff | ✓ | `RETRY_DELAYS_MS = [1_000, 2_000, 4_000]` at line 34; `isTransient` checks `/\b429\b|\b5\d\d\b|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|rate.?limit/i` at line 88; `withRetry` loops `attempt <= RETRY_DELAYS_MS.length` (4 total attempts = 3 retries) at line 95 |
| 7 | Lock TTL is 2 hours | ✓ | `LOCK_TTL_MS = 2 * 60 * 60 * 1000` at discoveryCron.ts:33 |
| 8 | autoUpsert=true passed to runDiscoveryForJurisdiction in sweep; autoUpsertToRaceCandidates helper exists; eligibility condition correct | ✓ | `autoUpsert: true` passed at discoveryCron.ts:231; `autoUpsertToRaceCandidates` defined at discoveryService.ts:137-162; eligibility condition `opts.autoUpsert === true && raceId !== null && (confidence === 'official' || confidence === 'matched')` at discoveryService.ts:365-368 |
| 9 | Uncertain candidates go to candidate_staging with status='pending' (not auto-upserted) | ✓ | `eligibleForAutoUpsert` is false when `confidence === 'uncertain'`; else branch at discoveryService.ts:395-417 inserts with `status='pending'`; uncertain candidates counted at line 419 but never routed through auto-upsert path |
| 10 | Build compiles cleanly | ✓ | `npm run build` exits with no errors or warnings (tsc output: empty, exit 0) |

## Gaps

None. All 10 must-haves verified in code.

## Human Verification Required

The following cannot be verified programmatically and require a live environment test if desired:

1. **Cron fires at 02:00 UTC Sunday** — Confirm the cron job actually triggers in the Render production environment at the correct time. The schedule string `'0 2 * * 0'` with `timezone: 'UTC'` is correct but requires a live Sunday to confirm end-to-end.

2. **Lock prevents concurrent runs across real async timing** — The in-process boolean lock is correct for single-instance Node.js but requires runtime confirmation that a real concurrent HTTP request during a live sweep returns 409.

3. **Email delivery** — `sendEmail` is called correctly but actual delivery depends on `ADMIN_EMAIL` env var being set and the email service being configured in production.

These are runtime/environment concerns, not code correctness gaps. The implementation is verified correct.
