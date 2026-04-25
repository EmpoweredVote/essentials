# Phase 7: Cron Automation + Auto-Upsert - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace manual discovery triggers with a weekly cron sweep across all registered jurisdictions, and bypass the human approval queue for high-confidence candidates (official/matched) by auto-upserting them directly to `race_candidates`. Only `uncertain` candidates still require manual review. Admin is notified after the fact via a sweep-summary email.

</domain>

<decisions>
## Implementation Decisions

### Cron Schedule
- Run weekly: **Sunday at 2am**
- Election window filter: configurable constant `SWEEP_HORIZON_DAYS = 180` (not hardcoded)
- Missed run (server was down): skip it, wait for next Sunday — no catch-up logic needed
- Jurisdiction failure during sweep: log it, skip to the next jurisdiction, continue the sweep

### Retry Policy
- Retry on all transient errors: 429 rate limit, 5xx server errors, network timeouts
- Exponential backoff on all transient errors (not just 429)
- **3 retry attempts** before marking the jurisdiction as failed and moving on

### Failure Handling
- A jurisdiction "fails" only when the agent throws an error — zero candidates is handled separately by the existing Phase 6 regression alert (not treated as a failure here)
- Failed jurisdictions are logged to `discovery_runs` with error status
- No auto-disable or escalation for repeated failures — re-try each Sunday, sweep-summary email surfaces the pattern

### Admin Notification
- **One combined sweep-summary email** sent after the full sweep completes
- Email covers all three outcomes in one place: auto-upserted candidates, uncertain candidates pending review, and jurisdictions that failed
- Email content for auto-upserted candidates: candidate name + race + confidence label, grouped by jurisdiction
- **No email if nothing happened** — no upserts, no uncertain items, no failures = silence
- This replaces the per-run uncertain-candidate email from Phase 6 for cron-triggered runs

### Run Lock
- All concurrent runs are blocked — full sweep, per-jurisdiction manual trigger, and per-race trigger (`POST /admin/discover/race/:id`)
- Second caller receives **HTTP 409 "already running"** response immediately (no queuing)
- Lock has a **2-hour TTL** — auto-expires if the server crashes mid-sweep without releasing the lock
- No admin notification for lock collisions — the 409 in the UI is sufficient

### Claude's Discretion
- In-memory vs. DB-backed lock storage (in-memory is fine for single-instance Render deployment)
- Exact backoff intervals (e.g. 1s, 2s, 4s for 3 retries)
- Email HTML structure and formatting (consistent with Phase 6 email style)
- Discovery_runs row schema for recording sweep-level vs. jurisdiction-level results

</decisions>

<specifics>
## Specific Ideas

- No specific references or "I want it like X" moments — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-cron-automation-auto-upsert*
*Context gathered: 2026-04-25*
