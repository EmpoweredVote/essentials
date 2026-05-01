# State

## Current Position

Phase: 12 — TX DB Foundation (next)
Plan: —
Status: Roadmap defined; Phase 12 ready to plan
Last activity: 2026-04-30 — v3.0 roadmap created (Phases 12-18); Phase 12 is next

Progress: [░░░░░░░░░░░░░░░░░░░░] v3.0 0/7 phases complete

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-30 after v3.0 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v3.0 — Collin County, TX Coverage (greenfield TX data expansion)

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
- Next migration: 085 (083 used by plan 08-01, 084 used by plan 08-02 — check before writing)

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

### Parked from v2.2 (backlog — resume after v3.0)

- Phase 8-04: Human-verify checkpoint for Admin Discovery UI (blocked on Run Discovery 401 auth mismatch)
- Phase 9: Race Completeness Audit
- Phase 10: Compass Stances Integration (CA/IN local politicians)
- Phase 11: Indiana Local Races (Monroe County Commissioner, Clerk, Assessor, Township)
- Blocker: POST /admin/discover/jurisdiction/:id uses X-Admin-Token; apiFetch sends JWT Bearer — needs JWT-gated trigger endpoint

### TX v3.0 Notes

- Zero TX records in essentials schema today — fully greenfield
- Texas municipal elections are nonpartisan — no party affiliation on ballot or in DB
- May 3, 2026 TX uniform election just happened — research winners as new incumbents
- Collin County Elections primary source: collincountyvotes.gov
- Stance research sparse for Tier 3-4 cities (small digital footprint expected)
- Migration numbering: next migration is 085 (084 used by plan 08-02, check before writing)
- Phase 12 (TX DB Foundation) has no code dependencies — can start immediately
- Phase 16 (Discovery Jurisdiction Setup) depends only on Phase 12 — can run in parallel with Phases 13-15

---
*State initialized: 2026-04-12*
*Updated: 2026-04-30 — v3.0 roadmap created; Phases 12-18 defined; Phase 12 is next*
