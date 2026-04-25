# Phase 7: Cron Automation + Auto-Upsert - Research

**Researched:** 2026-04-25
**Domain:** node-cron scheduling, in-process run lock, auto-upsert pattern, sweep-summary email
**Confidence:** HIGH

## Summary

Phase 7 adds two things: a weekly cron sweep of all registered jurisdictions, and an auto-upsert branch that writes `official`/`matched` candidates directly to `race_candidates` without manual approval. Both can be built entirely from existing infrastructure — no new packages needed.

The cron pattern is already established in this codebase (three prior cron jobs: `calibrationLapse`, `campaignFinanceCron`, `districtStaleness`). The file structure is clear: create `src/cron/discoverySweep.ts` (the cron registration) and `src/lib/discoveryCron.ts` (the sweep logic). The in-process lock follows the exact in-process Map fallback already used by `campaignFinanceScheduler.ts`; for a single-instance Render deployment there is no need for Redis — a module-level `Map<string, boolean>` with a TTL timer is the right choice. The auto-upsert branch goes into `discoveryService.ts`: after confidence scoring, if confidence is `official` or `matched`, skip `candidate_staging` and INSERT directly to `essentials.race_candidates`. The sweep-summary email follows the same `sendEmail()` pattern as Phase 6's per-run email.

**Primary recommendation:** Build discoveryCron.ts as the sweep orchestrator (holds the lock, iterates jurisdictions sequentially, collects results) and add a short `autoUpsertCandidate()` helper in discoveryService.ts that the sweep calls via the existing `runDiscoveryForJurisdiction()` pipeline with a new `opts.autoUpsert = true` flag.

## Standard Stack

All libraries are already installed. No new dependencies.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node-cron | 4.2.1 | Cron scheduling | Already installed; three existing cron jobs use it |
| pg (pool) | 8.13.x | Direct postgres for essentials schema | essentials schema not in PostgREST — must use pool.query() |
| emailService.ts | internal | Sweep-summary email | sendEmail() already wraps Resend; used in Phase 6 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @anthropic-ai/sdk | 0.91.x | Discovery agent | Already called via discoveryAgentRunner.ts — no changes needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-process Map lock | Redis (Upstash) | Redis requires env var, adds latency; single-instance Render doesn't need distributed lock — use in-process Map like campaignFinanceScheduler already does |
| In-process Map lock | DB row lock | DB lock is more durable but adds round-trip; overkill for single-instance cron |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure

New files follow the established pattern:

```
src/
├── cron/
│   ├── calibrationLapse.ts      # existing
│   ├── campaignFinanceCron.ts   # existing
│   ├── districtStaleness.ts     # existing
│   └── discoverySweep.ts        # NEW — cron registration only (thin wrapper)
├── lib/
│   ├── discoveryService.ts      # MODIFIED — add autoUpsertCandidate() helper + opts.autoUpsert
│   └── discoveryCron.ts         # NEW — sweep orchestrator, lock logic, summary email
```

`index.ts` gets one new import + one new call inside the startup block (same pattern as the three existing crons).

### Pattern 1: Cron Registration (Thin Wrapper)

**What:** A file in `src/cron/` registers the schedule and calls the service. Zero business logic here.
**When to use:** Always — matches every existing cron file in the codebase.

```typescript
// Source: established pattern from src/cron/districtStaleness.ts
import cron from 'node-cron';
import { runDiscoverySweep } from '../lib/discoveryCron.js';

export function startDiscoverySweepCron(): void {
  cron.schedule(
    '0 2 * * 0', // Sunday 02:00 UTC
    async () => {
      try {
        await runDiscoverySweep();
      } catch (err) {
        console.error('[cron] Unhandled error in discovery sweep:', err);
      }
    },
    {
      timezone: 'UTC',
      name: 'discovery-sweep',
    }
  );
  console.log('[cron] Discovery sweep registered (weekly Sunday 02:00 UTC)');
}
```

The cron expression for "Sunday at 2am UTC" is `'0 2 * * 0'`.
`districtStaleness.ts` uses `'0 3 * * 0'` (Sunday 03:00 UTC) — the new sweep uses `'0 2 * * 0'` (one hour earlier, no conflict).

### Pattern 2: In-Process Run Lock

**What:** Module-level `Map<string, boolean>` with TTL timer, exposing `acquireRunLock()` / `releaseRunLock()`. Returns `false` immediately if lock is held.
**When to use:** For single-instance Render deployment — no Redis needed.

This is the same pattern as `campaignFinanceScheduler.ts` lines 94-126 (the in-process fallback that already exists). The discovery lock is simpler because there is no Redis tier — it's always in-process.

```typescript
// Source: adapted from campaignFinanceScheduler.ts in-process fallback
const LOCK_KEY = 'discovery-sweep';
const LOCK_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

let lockHeld = false;
let lockTimer: ReturnType<typeof setTimeout> | null = null;

export function acquireRunLock(): boolean {
  if (lockHeld) return false;
  lockHeld = true;
  lockTimer = setTimeout(() => {
    lockHeld = false;
    lockTimer = null;
    console.warn('[discoveryCron] Run lock auto-expired after 2h TTL');
  }, LOCK_TTL_MS);
  return true;
}

export function releaseRunLock(): void {
  lockHeld = false;
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
}

export function isRunLockHeld(): boolean {
  return lockHeld;
}
```

The `isRunLockHeld()` export is needed so API routes can check and return 409. Routes that check: `POST /admin/discover/jurisdiction/:id` and `POST /admin/discover/race/:id` (already in `essentialsDiscovery.ts`) must be patched to call `isRunLockHeld()` first.

### Pattern 3: Sequential Sweep with Exponential Backoff

**What:** `for...of` over all jurisdictions within SWEEP_HORIZON_DAYS. Each jurisdiction calls `runDiscoveryForJurisdiction()`. On transient errors (429, 5xx, network), retry up to 3 times with exponential backoff before marking failed.
**When to use:** Always — user decided no parallel runs.

```typescript
// Source: pattern adapted from campaignFinanceScheduler.ts runAdapterForAll()
const SWEEP_HORIZON_DAYS = 180;

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000]; // 3 attempts, doubles each time

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < RETRY_DELAYS_MS.length && isTransient(err)) {
        const delay = RETRY_DELAYS_MS[attempt];
        console.warn(`[discoveryCron] ${label}: transient error, retrying in ${delay}ms`, err);
        await sleep(delay);
      } else {
        break;
      }
    }
  }
  throw lastErr;
}

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // 429 rate limit, 5xx server errors, network timeouts
  return /429|5\d\d|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed/i.test(msg);
}
```

### Pattern 4: Auto-Upsert Branch in discoveryService.ts

**What:** After confidence scoring, candidates with `official` or `matched` confidence are inserted directly into `essentials.race_candidates` instead of `essentials.candidate_staging`. The staging insert still happens for bookkeeping, but with `status='auto_approved'` (or equivalently, set `status='approved'` and `reviewed_by='cron'`).

**Key constraint from prior decisions:** `approveCandidate()` (the existing approval flow) requires a pre-existing race row. The auto-upsert must also enforce this: `race_id IS NULL` candidates get flagged as before — they cannot be auto-upserted and must go to `candidate_staging` with `flagged=true` regardless of confidence.

**When to use:** Only when `opts.autoUpsert === true` AND confidence is `official` or `matched` AND `raceId !== null`.

The INSERT to `race_candidates` should use `ON CONFLICT DO NOTHING` on `(race_id, normalized_name)` or similar unique constraint. Check what unique constraints exist on `race_candidates` before writing the upsert.

```typescript
// Source: pattern adapted from stagingService.ts promoteToEssentials()
// Called inside discoveryService.ts step 5 loop when opts.autoUpsert === true
async function autoUpsertToRaceCandidates(args: {
  runId: string;
  jurisdictionId: string;
  raceId: string;
  fullName: string;
  normalizedName: string;
  citationUrl: string;
  confidence: 'official' | 'matched';
}): Promise<'inserted' | 'skipped'> {
  // Insert to race_candidates — ON CONFLICT DO NOTHING prevents duplicates
  const result = await pool.query(
    `INSERT INTO essentials.race_candidates (race_id, full_name, normalized_name, ...)
     VALUES ($1, $2, $3, ...)
     ON CONFLICT (...) DO NOTHING
     RETURNING id`,
    [args.raceId, args.fullName, args.normalizedName, ...]
  );

  // Regardless of insert outcome, write a staging row for audit trail
  await pool.query(
    `INSERT INTO essentials.candidate_staging
       (run_id, discovery_jurisdiction_id, full_name, normalized_name,
        citation_url, race_hint, race_id, confidence, action, status, reviewed_by, reviewed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'new', 'approved', 'cron', now())`,
    [args.runId, args.jurisdictionId, ...]
  );

  return result.rows.length > 0 ? 'inserted' : 'skipped';
}
```

**CRITICAL: Verify race_candidates schema before writing the INSERT.** Read the actual table DDL to confirm column names and any unique constraints. The migration that created `race_candidates` needs to be located and read.

### Pattern 5: Sweep-Summary Email

**What:** One combined email after the entire sweep completes, covering all three outcomes (auto-upserted, uncertain pending review, jurisdictions failed). Only sent if at least one of those outcomes is non-empty.

**Structure:** Mirrors Phase 6's `buildReviewEmailHtml()` in `discoveryService.ts` — same CSS style (`font-family: system-ui, sans-serif; max-width: 560px`), same `sendEmail()` call.

```typescript
// Source: pattern from discoveryService.ts buildReviewEmailHtml()
function buildSweepSummaryEmail(args: {
  autoUpserted: Array<{ name: string; race: string; jurisdiction: string; confidence: string }>;
  uncertainPending: Array<{ jurisdictionName: string; count: number }>;
  failedJurisdictions: Array<{ jurisdictionName: string; error: string }>;
  reviewUrl: string;
}): string {
  // Only called when at least one list is non-empty
  // Grouped by jurisdiction for auto-upserted items
  // ...
}
```

Email is NOT sent if all three lists are empty (no upserts, no uncertain, no failures).

### Pattern 6: discoveryService.ts Modifications

The sweep calls `runDiscoveryForJurisdiction()` but needs auto-upsert behavior. Two design options:

**Option A (recommended):** Add `opts.autoUpsert?: boolean` to `runDiscoveryForJurisdiction()`. When `true`, high-confidence candidates with `race_id !== null` skip the staging INSERT and go directly to `race_candidates`. The function's `DiscoveryRunSummary` return type gains `autoUpserted: number`.

**Option B:** Create a separate `runDiscoveryForJurisdictionWithAutoUpsert()`. Duplicates most of the function body — worse.

The per-run email at the end of `runDiscoveryForJurisdiction()` (step 7b) must NOT fire for cron-triggered runs because the sweep sends its own combined summary. Add a guard: if `opts.triggeredBy === 'cron'`, skip the per-run email. The zero-candidate regression alert can still fire (it's not superseded by the sweep-summary).

### Anti-Patterns to Avoid

- **Sending per-run emails from cron-triggered runs:** The existing email in `discoveryService.ts` step 7b fires for every run including cron. Guard it with `if (opts.triggeredBy !== 'cron')` or a new `opts.suppressEmail` flag.
- **Setting lock before existence check in API routes:** Check lock status before the DB `SELECT 1 FROM discovery_jurisdictions WHERE id = $1` — avoids 202-then-409 confusion.
- **Auto-upserting flagged candidates:** Candidates with `race_id === null` (flagged=true) must NEVER be auto-upserted regardless of confidence. Always check `raceId !== null` before auto-upsert path.
- **Hardcoding SWEEP_HORIZON_DAYS:** Must be a named constant, not `180` in a WHERE clause. User decided this is configurable.
- **Wrapping sweep in a transaction:** The sweep is intentionally non-transactional (same design rationale as discoveryService.ts "NO TRANSACTION" comment). Partial success is acceptable.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling | Custom setTimeout loop | node-cron 4.2.1 (already installed) | Handles DST, timezone, missed runs correctly |
| Exponential backoff | Custom sleep loop | Pattern already in campaignFinanceScheduler.ts | Consistent with existing code; extract the helper |
| Distributed lock | Redis-backed lock | In-process Map with TTL | Single-instance Render; Redis is overkill and adds failure mode |
| Email sending | Direct Resend fetch | sendEmail() from emailService.ts | Already wraps error handling, fire-and-forget semantics |

**Key insight:** Everything needed already exists in the codebase. The only net-new logic is: sweep orchestrator, lock module, auto-upsert branch, and sweep-summary email builder.

## Common Pitfalls

### Pitfall 1: Per-Run Email Firing During Cron Sweep

**What goes wrong:** The existing `discoveryService.ts` sends an email after each run (step 7b). If the cron runs 10 jurisdictions, the admin gets 10 individual emails PLUS the sweep-summary.
**Why it happens:** The cron calls `runDiscoveryForJurisdiction()` which unconditionally emails on completion.
**How to avoid:** Add `opts.suppressRunEmail?: boolean` (or use `triggeredBy === 'cron'` check) to skip the per-run email in step 7b. The zero-candidate regression alert at step 7b is separate and should still fire.
**Warning signs:** Admin receives per-run emails during a cron sweep run.

### Pitfall 2: Race Condition Between Lock Check and Execution Start

**What goes wrong:** Two simultaneous requests to `POST /admin/discover/jurisdiction/:id` both pass the `isRunLockHeld()` check before either acquires the lock.
**Why it happens:** Check-then-act is not atomic with the lock acquisition.
**How to avoid:** The API route should call `acquireRunLock()` directly (which atomically checks and sets), not call `isRunLockHeld()` then `acquireRunLock()` separately. Return 409 immediately if `acquireRunLock()` returns `false`.
**Warning signs:** Two runs show `status='running'` simultaneously in `discovery_runs`.

### Pitfall 3: Auto-Upsert Without race_id

**What goes wrong:** A candidate with `official` confidence but no matching race gets auto-inserted to `race_candidates` with a NULL `race_id` (violates FK), or the INSERT fails with a constraint error at runtime.
**Why it happens:** The `official` confidence check doesn't account for the `flagged=true` path.
**How to avoid:** The auto-upsert guard must be: `confidence !== 'uncertain' && raceId !== null`. Always check `raceId` before auto-upsert branch.
**Warning signs:** `race_candidates` FK violations in logs, or flagged candidates silently not upserted.

### Pitfall 4: Lock Not Released on Crash

**What goes wrong:** The server crashes mid-sweep; the in-process lock is held forever (process memory lost means lock is gone, but a new server instance starts fresh with no lock — this is actually fine for in-process lock).
**Why it happens:** In-process lock doesn't survive process restart.
**How to avoid:** This is actually correct behavior: if the process crashes, Render restarts it, the new process has no lock held, and the next Sunday's cron fires normally. The 2-hour TTL guards against a slow sweep (not a crash). Document this explicitly.
**Warning signs:** Not a bug — document it.

### Pitfall 5: Sweep Horizon Query Returning Jurisdictions Without Matching Elections

**What goes wrong:** `discovery_jurisdictions.election_date` is in the past (old election cycles), and the sweep processes them unnecessarily.
**Why it happens:** `discovery_jurisdictions` rows are not cleaned up after elections.
**How to avoid:** The WHERE clause must filter by `election_date > now()` AND `election_date <= now() + SWEEP_HORIZON_DAYS days`. The cron always works forward: it finds elections that WILL happen within the horizon, not elections that already passed.
**Warning signs:** The sweep processes jurisdictions with past election dates.

### Pitfall 6: Missing race_candidates Schema Knowledge

**What goes wrong:** The auto-upsert INSERT fails at runtime because column names or unique constraints are wrong.
**Why it happens:** race_candidates DDL was never read during planning.
**How to avoid:** Read the `race_candidates` table DDL before writing the INSERT. Find it in the backend migrations directory. The migration number is not known — grep for `CREATE TABLE.*race_candidates`.
**Warning signs:** Runtime SQL errors on the auto-upsert path.

## Code Examples

### Cron Expression: Sunday 02:00 UTC

```typescript
// Source: districtStaleness.ts uses '0 3 * * 0' (Sunday 03:00 UTC)
// New discovery sweep: '0 2 * * 0' (Sunday 02:00 UTC)
// node-cron field order: minute hour day-of-month month day-of-week
// day-of-week: 0 or 7 = Sunday
cron.schedule('0 2 * * 0', handler, { timezone: 'UTC', name: 'discovery-sweep' });
```

### Jurisdiction Query with Horizon Filter

```typescript
// Source: pattern adapted from discoveryService.ts step 1
const horizonDate = new Date();
horizonDate.setDate(horizonDate.getDate() + SWEEP_HORIZON_DAYS);

const result = await pool.query<{ id: string; jurisdiction_name: string }>(
  `SELECT id, jurisdiction_name
     FROM essentials.discovery_jurisdictions
    WHERE election_date > now()
      AND election_date <= $1
    ORDER BY election_date ASC`,
  [horizonDate]
);
```

### Lock Check at API Routes (409 Response)

```typescript
// Source: pattern from campaignFinanceScheduler.ts acquireLock() usage
import { acquireRunLock, releaseRunLock, isRunLockHeld } from '../lib/discoveryCron.js';

// In POST /discover/jurisdiction/:id handler (essentialsDiscovery.ts):
if (isRunLockHeld()) {
  res.status(409).json({ code: 'ALREADY_RUNNING', message: 'A discovery sweep is already running' });
  return;
}
```

### Suppress Per-Run Email for Cron Runs

```typescript
// In discoveryService.ts step 7b — add guard before the candidatesStaged email:
if (adminEmail && opts.triggeredBy !== 'cron') {
  // ... existing per-run email logic ...
}
// Zero-candidate regression alert still fires regardless of triggeredBy:
if (agentResult.candidates.length === 0) {
  // ... existing regression alert ...
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual-only discovery triggers | Weekly cron sweep | Phase 7 | Admin no longer needs to trigger per jurisdiction |
| All candidates go to staging | High-confidence auto-upserted | Phase 7 | Only uncertain candidates require human review |
| Per-run uncertain email | Combined sweep-summary email | Phase 7 | One email per sweep instead of one per jurisdiction |

**Not deprecated:** The existing per-run email in discoveryService.ts stays active for manual (on_demand) triggers. Only suppressed for `triggeredBy === 'cron'` runs.

## Open Questions

1. **race_candidates table schema**
   - What we know: `race_candidates` referenced in discoveryService.ts as `essentials.race_candidates`, has `full_name` and `race_id` columns
   - What's unclear: Exact column list, which unique constraint to use for `ON CONFLICT` in auto-upsert
   - Recommendation: Planner must include a task to read the `race_candidates` DDL migration before writing the auto-upsert INSERT. Grep `backend/migrations/` for `CREATE TABLE.*race_candidates`.

2. **candidate_staging status for auto-upserted rows**
   - What we know: Staging status CHECK is `('pending','approved','dismissed')` (migration 070)
   - What's unclear: Should auto-upserted candidates write a staging row with `status='approved'` and `reviewed_by='cron'`? Or skip staging entirely?
   - Recommendation: Write a staging row with `status='approved', reviewed_by='cron'` for full audit trail. This is consistent with the existing approval flow and keeps the discovery_runs counts accurate.

3. **ADMIN_EMAIL and ADMIN_REVIEW_URL env vars for sweep-summary**
   - What we know: These are used in discoveryService.ts step 7b
   - What's unclear: Are they already in the Render env or do they need adding?
   - Recommendation: Planner notes they are already used by Phase 6 — assume they exist. discoveryCron.ts reads `process.env.ADMIN_EMAIL` and `process.env.ADMIN_REVIEW_URL` the same way.

## Sources

### Primary (HIGH confidence)
- Direct codebase read: `src/cron/calibrationLapse.ts`, `src/cron/districtStaleness.ts` — establishes cron registration pattern
- Direct codebase read: `src/cron/campaignFinanceCron.ts` — establishes multi-job cron pattern
- Direct codebase read: `src/lib/campaignFinanceScheduler.ts` lines 94-146 — in-process Map lock pattern
- Direct codebase read: `src/lib/discoveryService.ts` — full pipeline, email, run summary
- Direct codebase read: `src/lib/discoveryAgentRunner.ts` — agent interface (no changes needed)
- Direct codebase read: `src/routes/essentialsDiscovery.ts` — existing trigger routes (need lock check added)
- Direct codebase read: `src/index.ts` — cron startup registration pattern
- Direct codebase read: `backend/migrations/070_discovery_tables.sql` — exact schema for all three discovery tables
- Direct codebase read: `node_modules/node-cron/package.json` — confirms version 4.2.1
- Direct codebase read: `node_modules/node-cron/README.md` — cron syntax reference

### Secondary (MEDIUM confidence)
- Context inferred from prior phase decisions: auto-upsert path was deferred from Phase 6 (comment in discoveryService.ts step 7 and in essentialsDiscovery.ts approve endpoint)

### Tertiary (LOW confidence)
- None. All findings sourced from codebase directly.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already in package.json, confirmed in source
- Architecture: HIGH — patterns read directly from three existing cron jobs and campaignFinanceScheduler
- Pitfalls: HIGH — derived from code comments, schema constraints, and existing guard logic in discoveryService.ts
- Auto-upsert column list: LOW — race_candidates DDL not yet read; must be found before writing INSERT

**Research date:** 2026-04-25
**Valid until:** 2026-05-25 (stable codebase, no fast-moving external dependencies)
