# State

## Current Position

Phase: 8 of 11 (Admin Discovery UI + Dashboard)
Plan: 08-01 complete
Status: Wave 1 done — Wave 2 ready
Last activity: 2026-04-27 — plan 08-01 complete (migration 083 + discoveryService auto-upserted persistence)

Progress: [█░░░░░░░░░░░░░░░░░░░] v2.2 in progress (1/7 plans)

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-26 after v2.2 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v2.2 — Data Depth & Admin Tooling (Phase 8: Admin Discovery UI + Dashboard)

## Accumulated Context

### Key Decisions (carry forward)

- Candidate ordering is seeded-random per session (sessionStorage key `ev:election-seed`), never alphabetical
- Party data lives on races (`primary_party`), never on individual candidates — antipartisan design
- Connected users must never see address input if `me.jurisdiction` is non-null (EDOC-01)
- Elections data lives in `essentials` schema on Postgres, served by Express backend at `C:\EV-Accounts`
- Elections page is a standalone top-level route (`/elections`), not embedded in Results
- Jurisdictions processed sequentially (never parallel) — exhausts Claude API rate limit quota
- Citation required for every staged candidate — no citation = no staging entry (hallucination prevention)
- Discovery agent uses claude-sonnet-4-6 (~$0.017/run); forced tool_choice=report_candidates for typed output
- Migration numbering continues from 082 (highest existing is 082_la_city_candidate_details.sql)
- Next migration: 083

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)

### Pending Todos (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- lavote.gov election ID changes each cycle — mandatory manual update per election cycle

### Open Blockers

None.

---
*State initialized: 2026-04-12*
*Updated: 2026-04-26 — v2.2 roadmap created; Phase 8 ready to plan*
