# State

## Current Position

Phase: 7 of 7 — Cron Automation + Auto-Upsert (v2.1)
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-04-25 — Completed 07-02 (discoveryCron.ts sweep orchestrator + lock guards + cron wiring)

Progress: [████████████████████] v2.1 phase 7 COMPLETE (2/2 plans in phase 7)

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23 after v2.1 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v2.1 — Phase 7: Cron Automation + Auto-Upsert

## Accumulated Context

### Key Decisions (carry forward)

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results
- Jurisdictions processed sequentially (never parallel) — exhausts Claude API rate limit quota
- Auto-upsert (STAG-02) deferred to Phase 7 — must not enable before confidence scoring validated against real data
- approveCandidate() requires pre-existing race row — staging rows with no match flagged as flagged=true, flag_reason "no matching race in DB"
- Citation required for every staged candidate — no citation = no staging entry (hallucination prevention)
- Migration numbering starts at 070 (highest existing is 069_donor_name_normalized.sql)
- Discovery agent model: claude-sonnet-4-6 (Haiku doesn't support web_search_20250305; Opus too expensive)
- Discovery agent cost: ~$0.017/run with Sonnet; $20 API credits added 2026-04-24

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- node-cron 4.2.1 already installed in backend — no new infra for scheduling
- emailService.ts already exists — import sendEmail() directly
- race_candidates already supports NULL politician_id for challengers (migration 042)
- New packages needed: resend v6.12.0 (for Phase 6 email; @anthropic-ai/sdk already installed in Phase 5)
- Phase 5 files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, routes/essentialsDiscovery.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- tool_choice: any on first turn, forced report_candidates on continuation turns (pause_turn loop pattern)

### Pending Todos (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- CA SoS challenger ingestion in progress

### Blockers/Concerns

- Phase 1 planning flag: validate Anthropic rate limit headroom with a 3-jurisdiction test before Phase 7 cron sweep
- lavote.gov election ID (id query parameter) changes each cycle — document as mandatory manual update per election cycle

### Key Decisions Added — Phase 7 Plan 01

- autoUpsert eligibility: `raceId !== null && (confidence === 'official' || confidence === 'matched')` — uncertain and unmatched-race candidates always go pending
- SELECT-then-INSERT idempotency (not ON CONFLICT) — race_candidates has no unique index on (race_id, full_name)
- Auto-upserted candidates always get a candidate_staging audit row: status='approved', reviewed_by='cron'
- suppressRunEmail only gates per-run review notification; zero-candidate regression + failure emails always fire
- Cron callers will pass: `{ triggeredBy: 'cron', autoUpsert: true, suppressRunEmail: true }`

### Key Decisions Added — Phase 7 Plan 02

- In-process boolean lock (not Redis) — single-instance Render deployment; process restart clears lock naturally; 2h TTL timer guards slow sweeps
- Routes use acquireRunLock() (atomic check-and-set), not isRunLockHeld() — prevents TOCTOU race; isRunLockHeld exported as debugging aid only
- Lock released in .finally() on fire-and-forget promise chains — no leak on background run failure
- Sweep-summary email silence guard — suppressed when all outcome lists empty (no noise on clean weeks)
- Cron scheduled at '0 2 * * 0' (Sunday 02:00 UTC) — one hour before districtStaleness (03:00 UTC)
- STAG-02 + SCHED-03 requirements both satisfied; Phase 7 complete

### Session Continuity

Last session: 2026-04-25T21:54:32Z
Stopped at: Completed 07-02-PLAN.md (Phase 7 final plan)
Resume file: None — Phase 7 fully complete

---
*State initialized: 2026-04-12*
*Updated: 2026-04-25 — Plan 07-02 complete; Phase 7 fully complete; discoveryCron.ts + discoverySweep.ts + route lock guards wired and committed*
