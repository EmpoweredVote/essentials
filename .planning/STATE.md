# State

## Current Position

Phase: Not started (roadmap created)
Plan: —
Status: Roadmap created
Last activity: 2026-05-18 — v6.0 Maine Essentials roadmap written (Phases 49-55)

Progress: v6.0 in progress — 0 phases complete, 8 phases planned (49-56)

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18 after v6.0 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v6.0 Maine Essentials — Plan Phase 49 (ME Geofences) is next

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
- Migration numbering continues from 167 (highest applied is 167_cambridge_district_backfill.sql) — next is 168
- MA TIGER G4110=58 (not 351): 58 incorporated cities with charters; 293 MA towns are G4040 COUSUB (loaded Phase 48)
- Cambridge congressional split (verified PostGIS): west/north = MA-05 geo_id='2505'; east/south/Inman = MA-07 geo_id='2507'
- geo_id collision between G4020 (Middlesex County='25017') and G5220 (8th Bristol District='25017') is TIGER format quirk — mtfcc always disambiguates; no routing risk
- CRITICAL: slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS pattern required for idempotent inserts
- Dual-office pattern: unique index on essentials.offices.politician_id was dropped in migration 159 — never re-add
- computeDisplaySpokes() is the single source of truth for compass spoke selection; both CompassCard and MiniCompass must import from src/lib/compass.js — never duplicate the algorithm
- Maine FIPS: 23; Portland geo_id: 2360545; Maine AG/SoS/Treasurer are legislature-elected → is_appointed_position=true, no election race rows
- Maine has 23 incorporated cities (G4110 PLACE); Portland uses RCV for Mayor, Auditor, and at-large Council → election_method='rcv'
- Susan Collins is up for re-election 2026; Angus King is NOT up in 2026
- Governor Janet Mills is term-limited — 2026 Governor race is open (6D, 10R primary candidates)
- Maine state legislature website: mainelegislature.org (headshot source for senators/reps)
- geofence_boundaries.state = FIPS '23'; districts.state = abbreviation 'ME' (established pattern from TX/MA)

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)
- TIGER loader: load-state-tiger-boundaries.ts — add Maine to STATE_LAYER_ALLOWLIST exactly as MA was added in Phase 38
- Next migration is 168 (167 applied 2026-05-18: Cambridge district_id back-fill)

### Pending Todos (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- lavote.gov election ID changes each cycle — mandatory manual update per election cycle

### Parked from v2.2 (backlog — resume after v3.0)

- Phase 8-04: Human-verify checkpoint for Admin Discovery UI (blocked on Run Discovery 401 auth mismatch)
- Phase 9: Race Completeness Audit
- Phase 10: Compass Stances Integration (CA/IN local politicians)
- Phase 11: Indiana Local Races (Monroe County Commissioner, Clerk, Assessor, Township)

## Session Continuity

Last session: 2026-05-18
Stopped at: v6.0 Maine Essentials roadmap created (Phases 49-55, 30/30 requirements mapped); Phase 48 MA Towns complete; ready to plan Phase 49
Resume file: None
