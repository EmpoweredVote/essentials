# State

## Current Position

Phase: 13 — Tier 1 Officials — Plano + McKinney (complete ✓)
Plan: 2/2 complete
Status: Both 13-01 (Plano) and 13-02 (McKinney) complete — 15 politicians seeded (8 Plano + 7 McKinney)
Last activity: 2026-05-01 — Completed 13-02-PLAN.md (migration 092 applied, 7 McKinney incumbents seeded)

Progress: [████░░░░░░░░░░░░░░░░] v3.0 2/7 phases complete

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
- Next migration: 094 (091 = Plano politicians, 092 = McKinney politicians, 093 = McKinney emails; always verify with `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5`)
- McKinney email pattern: role-based `{role}@mckinneytexas.org` — mayor, AtLarge1, AtLarge2, District1–4
- email_addresses = NULL is acceptable when CloudFlare or other protection prevents email verification — bio URL (urls[]) satisfies 80% contact coverage target

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
- Migration numbering: next migration is 094 (093 used for McKinney email backfill)
- Phase 12 (TX DB Foundation) has no code dependencies — can start immediately
- Phase 16 (Discovery Jurisdiction Setup) depends only on Phase 12 — can run in parallel with Phases 13-15
- CRITICAL: slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- Migration 088 (Tier 1 cities): slug bug fixed and migration applied 2026-05-01; 4 cities, 30 offices verified
- Migration 091 (Plano politicians): applied 2026-05-01; 8 incumbents seeded, Place 6 vacant, 100% email+bio coverage
- Migration 092 (McKinney politicians): applied 2026-05-01; 7 incumbents seeded, 100% email (role-based), 100% bio URL
- Migration 093 (McKinney emails): applied 2026-05-01; email_addresses added to all 7 McKinney politicians (role-based: mayor/AtLarge1/AtLarge2/District1-4@mckinneytexas.org)
- McKinney At-Large offices: DB titles are 'Council Member At-Large Place 1/2' (not 'At-Large 1/2') — use exact DB titles in WHERE clauses
- supabase CLI v2.75.0 has NO 'db query' command — use psql with DATABASE_URL from backend/.env instead
- Prosper is legally a Town — use 'Town of Prosper' and 'Town Council' everywhere
- Fairview is legally a Town — use 'Town of Fairview' and 'Town Council' everywhere
- Princeton has 8 council seats (Mayor + Place 1-7), confirmed
- Copeville (GEOID 4816600) excluded — may be unincorporated CDP; add in follow-up if confirmed incorporated
- Tier 3-4 seeding complete: Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville, Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge

---
*State initialized: 2026-04-12*
*Updated: 2026-05-01 — Phase 13 complete; migrations 091-093 applied; 15 Tier 1 politicians seeded with full email + bio URL coverage*
