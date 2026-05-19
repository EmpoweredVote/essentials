# State

## Current Position

Phase: 51 of 56 (ME Executives + Federal Officials + Headshots)
Plan: 01 of 03 complete
Status: In progress
Last activity: 2026-05-19 — Completed 51-01-PLAN.md (migration 169 — 4 ME STATE_EXEC districts + 4 executive politicians/offices applied and verified)

Progress: v6.0 in progress — Phase 51 in progress (1/3 plans done)

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18 after v6.0 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v6.0 Maine Essentials — Phase 51 in progress (Plan 01 complete); Plans 51-02 (federal officials) and 51-03 (headshots) next

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
- Migration numbering: 169 applied (ME state executives); next is 170
- MA TIGER G4110=58 (not 351): 58 incorporated cities with charters; 293 MA towns are G4040 COUSUB (loaded Phase 48)
- Cambridge congressional split (verified PostGIS): west/north = MA-05 geo_id='2505'; east/south/Inman = MA-07 geo_id='2507'
- geo_id collision between G4020 (Middlesex County='25017') and G5220 (8th Bristol District='25017') is TIGER format quirk — mtfcc always disambiguates; no routing risk
- CRITICAL: slug is a GENERATED column on essentials.chambers — never include in INSERT statements
- essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS pattern required for idempotent inserts
- Dual-office pattern: unique index on essentials.offices.politician_id was dropped in migration 159 — never re-add
- computeDisplaySpokes() is the single source of truth for compass spoke selection; both CompassCard and MiniCompass must import from src/lib/compass.js — never duplicate the algorithm
- Maine FIPS: 23; Portland geo_id: 2360545; Maine AG/SoS/Treasurer are legislature-elected → is_appointed_position=true, no election race rows
- State of Maine government UUID: da88de8b-9afa-4d87-86d5-7eb83c3e9792 — use subquery by name in migrations, not hardcoded UUID
- Maine chambers (slugs): maine-senate, maine-house-of-representatives, maine-governor, maine-attorney-general, maine-secretary-of-state, maine-treasurer
- ME executive external_ids: -230001 (Mills/Governor), -230002 (Frey/AG), -230003 (Bellows/SoS), -230004 (Perry/Treasurer); politician UUIDs in 51-01-SUMMARY.md
- election_races (in plan docs) = essentials.races (actual table name) — verified in Phase 51-01
- Treasurer Joseph C. Perry (Democrat, elected Dec 2024) replaced Henry Beck who left 2025-01-06
- Maine has 23 incorporated cities (G4110 PLACE); Portland uses RCV for Mayor, Auditor, and at-large Council → election_method='rcv'
- ME smoke test confirmed: Augusta (state capital, Kennebec County) is in ME-02 (geo_id=2302), NOT ME-01; Bangor city geo_id=2302795; Augusta city geo_id=2302100
- Susan Collins is up for re-election 2026; Angus King is NOT up in 2026
- Governor Janet Mills is term-limited — 2026 Governor race is open (6D, 10R primary candidates)
- Maine state legislature website: mainelegislature.org (headshot source for senators/reps)
- geofence_boundaries.state = FIPS '23'; districts.state = abbreviation 'ME' (established pattern from TX/MA)
- ME TIGER uses cd119 (not cd) — file is tl_2024_23_cd119.zip; 23 cities (G4110), 2 CD, 35 SLDU, 151 SLDL, 16 counties loaded (Phase 49-01)
- districts.state for ME: lowercase 'me' for COUNTY/STATE_UPPER/STATE_LOWER; uppercase 'ME' for NATIONAL_LOWER (loader abbrev/abbrevUpper pattern)
- Run TIGER loader from C:/EV-Accounts/backend (not C:/EV-Accounts) — dotenv looks for .env in cwd

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)
- TIGER loader: load-state-tiger-boundaries.ts — add Maine to STATE_LAYER_ALLOWLIST exactly as MA was added in Phase 38
- Next migration is 170 (169 applied 2026-05-19: ME state executives — Mills/Frey/Bellows/Perry)

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

Last session: 2026-05-19
Stopped at: Completed 51-01-PLAN.md — Migration 169 applied; 4 ME STATE_EXEC districts + 4 executive politicians/offices (Mills/Frey/Bellows/Perry); Plans 51-02 and 51-03 next
Resume file: None
