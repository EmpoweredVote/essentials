# State

## Current Position

Phase: 5 of 7 — DB Foundation + Agent Core (v2.1)
Plan: 2 of 4 in current phase
Status: In progress
Last activity: 2026-04-23 — Completed 05-02 discoveryAgentRunner plan

Progress: [█████████░░░░░░░░░░░] v2.1 phase 5 in progress (2/4 plans done)

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-23 after v2.1 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v2.1 — Phase 5: DB Foundation + Agent Core

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

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- node-cron 4.2.1 already installed in backend — no new infra for scheduling
- emailService.ts already exists — import sendEmail() directly
- race_candidates already supports NULL politician_id for challengers (migration 042)
- New packages needed: @anthropic-ai/sdk v0.91.0, resend v6.12.0
- New backend files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, routes/essentialsDiscovery.ts, cron/discoveryCron.ts

### Pending Todos (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- CA SoS challenger ingestion in progress
- Anthropic Console: enable web search org-wide before Phase 5 execute (console.anthropic.com/settings/privacy)

### Blockers/Concerns

- Phase 1 planning flag: validate Anthropic rate limit headroom with a 3-jurisdiction test before Phase 7 cron sweep
- lavote.gov election ID (id query parameter) changes each cycle — document as mandatory manual update per election cycle

---
*State initialized: 2026-04-12*
*Updated: 2026-04-23 — Completed 05-02 discoveryAgentRunner plan*
