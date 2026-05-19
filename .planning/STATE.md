# State

## Current Position

Phase: 54 of 56 (ME City Officials Tiers 2-4) — NOT STARTED
Plan: 0/TBD for phase 54
Status: Phase 53 complete (verified 7/7) — Phase 54 is next
Last activity: 2026-05-19 — Phase 53 complete: 23 ME city scaffolding (177), Portland incumbents (178+179), 18 headshots, Landing.jsx Maine entry; all verified

Progress: v6.0 in progress — Phases 49-53 complete; Phase 54 next

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18 after v6.0 milestone start)

**Core value:** A resident can look up who represents them — and who is on their ballot — without creating an account.
**Current focus:** v6.0 Maine Essentials — Phase 52 (ME State Legislature + Headshots) next; depends only on Phase 50 (complete)

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
- Migration numbering: 170 applied (ME federal officials); next is 171
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
- ME federal external_ids: -230101 (Collins R, 6b817122), -230102 (King I, 4f4b2bff), -230201 (Pingree D ME-01, 1638b2c9), -230202 (Golden D ME-02, c420f946); UUIDs in 51-02-SUMMARY.md
- Senator office uniqueness key = (district_id, politician_id) not (district_id, chamber_id) — two senators share same NATIONAL_UPPER district; chamber_id uniqueness would block 2nd senator
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
- ME senator names: use official alphabetical listing (/senate/senators/9536) not individual page nicknames ('Jeff'=Jeffrey L., 'Dick'=Richard, 'Rick'=Richard A., 'Mattie'=Matthea E. L.)
- ME senator external_ids -231001..-231035 now OCCUPIED (migration 172 applied 2026-05-19)
- ME house rep external_ids -232001..-232151 now OCCUPIED (migration 173 applied 2026-05-19); -232029 intentionally absent (D29 vacant); all others populated
- ME House D94: Scott Harriman (Democrat, Lewiston) won special election 2026, external_id=-232094 — NOT vacant as research listed
- ME House D29: still vacant (Kathy Javner deceased, no special election as of 2026-05-19), office_id=ddb05295-68a1-4247-8b69-476269e13840
- ME house headshots source: /house/Repository/MemberProfiles/{uuid}_{Name}-{year}.jpg (UUID non-derivable, must visit profile per person)
- Phase 52 headshot coverage: 35/35 senators with photos, 150/150 house reps with photos; 0 gaps; house thumbnails upscaled from 152×202 (approved by user 2026-05-19); details in 52-03-SUMMARY.md
- essentials.offices has NO seat_label column and NO is_active column — use embedded title pattern: 'Council Member (Ward N)', 'Council Member (At-Large N)', 'Council Member (District N)'
- essentials.districts has no short_label column — only label
- ME 23 city governments + LOCAL districts + 206 skeletal offices seeded (migration 177 applied 2026-05-19)
- ME LOCAL districts state='me' lowercase; office district_id UPDATE uses WHERE district_id IS NULL for idempotency
- Portland 18 city officials seeded (migrations 178 + 179 applied 2026-05-19); external_ids -23601001..-23601018; all party=NULL; next migration is 180
- Portland at-large seat ordering (council): Pious Ali=AL1, April Fournier=AL2, Benjamin Grant=AL3; (school board): Maya Lena=AL1, Sarah Lentz=AL2, Usira Ali=AL3, Jayne Sawtelle=AL4
- Phase 53 Portland headshot coverage: 18/18 officials with headshots, 0 gaps; council from portlandmaine.gov/741/Council-Bios (CivicPlus API /api/apps/me-portland/all), school board from portlandschools.org/about/board-of-education/board-members (Finalsite CDN)
- Portland coverage area added to Landing.jsx COVERAGE_AREAS (2026-05-19, Phase 53); entry: { county: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' }
- Portland nonpartisan elections confirmed (party=NULL on all 18 officials)
- Next migration is 180 (177+178+179 applied in Phase 53)
- Anna Bullett (Portland D4) CONFIRMED via Wikipedia Portland City Council (Maine) page 2026-05-19
- Biddeford council seats=10 (Mayor+7W+2AL), South Portland=8 (Mayor+5D+2AL), Westbrook Council=8 (Mayor+5W+2AL) — research inventory descriptions excluded Mayor from seat totals
- Sanford/Ellsworth/Eastport mayor model = voter-elected on-council (defaulted; no council-selected evidence in research)
- Plan 53-02 UPDATE pattern: match on (chamber_id, title) to identify office rows — no seat_label column

### Known Architecture

- Frontend: React 19/JSX + Vite + Tailwind CSS 4, deployed to Render
- Backend: Express TypeScript at `C:\EV-Accounts`, deployed via Render push to `master`
- Discovery files: lib/discoveryService.ts, lib/discoveryAgentRunner.ts, lib/discoveryCron.ts, cron/discoverySweep.ts, routes/essentialsDiscovery.ts, routes/stagingQueueAdmin.ts
- Discovery routes mounted BEFORE adminRouter in index.ts (JWT interception prevention)
- Cron schedule: Sunday 02:00 UTC (one hour before districtStaleness at 03:00 UTC)
- TIGER loader: load-state-tiger-boundaries.ts — add Maine to STATE_LAYER_ALLOWLIST exactly as MA was added in Phase 38
- Next migration is 180 (177 applied 2026-05-19: ME 23-city scaffolding; 178+179 applied 2026-05-19: Portland incumbents; 171 is 171_la_council_votes.sql unapplied)

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
Stopped at: Completed 53-03-PLAN.md — Phase 53 complete; 18 Portland headshots uploaded (council + school board, 0 gaps); Landing.jsx updated with Maine/Portland
Resume file: None
