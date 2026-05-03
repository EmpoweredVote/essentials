# State

## Current Position

Phase: 19 — TX Congressional Seats + Geofences (complete)
Plan: 5/5 complete
Status: Phase 19 complete — full TX congressional rep integration; Collin County shows 5 US House reps via PostGIS; verified on production
Last activity: 2026-05-03 — Completed 19-05 (frontend wiring api.jsx + Landing.jsx + Results.jsx; user verified on production)

Progress: [█████████░░░░░░░░░░░] v3.0 — Phase 19 complete (5/5 plans done)

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
- Migration numbering continues from 099 (highest existing is 099_collin_county_discovery_jurisdictions.sql) — next is 100
- TX election date confirmed: 2026-05-02 (NOT May 3 as CONTEXT.md stated — all official sources confirm May 2)
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

- TX election row in DB: '2026 Texas Municipal General', election_date='2026-05-02', election_type='general', jurisdiction_level='city', state='TX'
- Texas municipal elections are nonpartisan — no party affiliation on ballot or in DB
- May 2, 2026 TX uniform election just happened — research winners as new incumbents
- Collin County Elections primary source: collincountytx.gov (NOT collincountyvotes.gov — that domain does not exist)
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
- Migration 094 (Allen+Frisco politicians): applied 2026-05-01; 14 incumbents seeded (Allen 7/7 email, Frisco 0/7 CloudFlare)
- Migration 095 (Richardson politicians): applied 2026-05-01; 7 incumbents seeded, 2-year terms valid_from='2025-05-01', all 7/7 email (Firstname.Lastname@cor.gov)
- Migration 096 (Murphy+Celina+Prosper politicians): applied 2026-05-01; 21 incumbents seeded (only Celina Mayor has email: rtubbs@celina-tx.gov)
- Richardson DB office titles: 'Council Member District 1-4' (geographic residency districts, not 'Place 1-4') — matches migration 089 decisions
- Richardson email pattern: Firstname.Lastname@cor.gov — confirmed by user; all 7 rows populated
- Post-election flags (May 3, 2026 TX uniform election): 7+ seats across Allen/Frisco/Murphy/Celina to update after results certified; Prosper races were uncontested cancellations (already definitive); Amy Bartley (Prosper Place 3) new term begins 2026-05-12
- Jené Butler (Celina Place 1): é accent in full_name — UTF-8 preserved in migration 096
- supabase CLI v2.75.0 has NO 'db query' command — use psql with DATABASE_URL from backend/.env instead
- Prosper is legally a Town — use 'Town of Prosper' and 'Town Council' everywhere
- Fairview is legally a Town — use 'Town of Fairview' and 'Town Council' everywhere
- Princeton has 8 council seats (Mayor + Place 1-7), confirmed
- Copeville (GEOID 4816600) excluded — may be unincorporated CDP; add in follow-up if confirmed incorporated
- Tier 3-4 seeding complete: Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville, Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge
- Phase 16-02 discovery test run: Allen run (run_id=47c4085a-cc46-47f8-ba21-f1726cf44799) returned 2 staged Mayor candidates — Chris Schulmeister + Dave Shafer — from collincountytx.gov sample ballot PDF; DISC-03 satisfied
- Plano returned 0 candidates (expected — odd-year city; next general May 2027); Allen chosen as DISC-03 verification target
- Domain whitelist enforcement confirmed: 0 violations across both runs; weekly cron now armed for all 23 TX cities (Sunday 02:00 UTC)

### Phase 19 Notes

- geo_id pattern confirmed: STATEFP(2) + CD119FP(zero-padded 2 digits) = 4-char string ('4803' for TX-3)
- district_id backfill: LTRIM(SUBSTRING(geo_id FROM 3), '0') — strips '48' prefix then leading zeros
- Migration 104 (district_id backfill): applied 2026-05-03; UPDATE 38 first run, UPDATE 0 re-run; idempotent
- Congressional boundaries already loaded (all 50 states prior run); load-us-congressional-boundaries.ts is safe to re-run
- Collin County G4020 boundary loaded 2026-05-03: geo_id='48085', state='48', geom=ST_Polygon, srid=4326, valid=t; 3235 county records scanned; idempotent
- Migration 105 applied 2026-05-03: 37 TX House politicians + 38 offices (37 active + 1 vacant TX-23); chamber_id=c2facc31; external_ids -100301..-100338 (skip -100323); idempotent
- US House chamber UUID confirmed: c2facc31-7b13-428c-b7b9-32d0d3b95f76 (chamber.name_formal = 'United States House of Representatives')
- 19-04 complete 2026-05-03: getPoliticiansByGovernmentList extended with countyGeoId option; PostGIS G4020↔G5200 intersection query; route /by-government-list accepts county_geo_id; smoke test: 5 NATIONAL_LOWER reps for Collin County (Keith Self TX-3, Pat Fallon TX-4, +3 others); LA County unchanged (55 politicians); invalid input → 400
- 19-05 complete 2026-05-03: frontend wired — api.jsx browseByGovernmentList +countyGeoId; Landing.jsx Collin County +browseCountyGeoId='48085'; Results.jsx reads browse_county_geo_id URL param; user verified on production (5 reps: Keith Self TX-3, Pat Fallon TX-4, Lance Gooden TX-5, Brandon Gill TX-26, Julie Johnson TX-32); LA/IN unaffected
- G4020 county boundary intersection PATTERN ESTABLISHED: to add congressional rep lookup for any TX county, (a) load county G4020 boundary into DB, (b) add browseCountyGeoId to COVERAGE_AREAS entry in Landing.jsx — no other code changes needed
- Priority TX counties for future expansion: Dallas (48113), Tarrant (48439), Bexar (48029), Travis (48453)

---
*State initialized: 2026-04-12*
*Updated: 2026-05-01 — Phase 15 complete; migrations 097-098 applied; 74 Tier 3-4 politicians seeded across 15 cities (45 Tier 3 + 29 Tier 4); 19 stubs for May 3 election seats; Copeville excluded*
*Updated: 2026-05-01 — Phase 16-01 complete; migration 099 applied; TX election row seeded (2026-05-02); 23 Collin County cities in discovery_jurisdictions; 23/23 governments matched*
*Updated: 2026-05-01 — Phase 16 complete (2/2 plans); DISC-01, DISC-02, DISC-03 all satisfied; Allen test run produced 2 staged Mayor candidates; Phase 16 done*
*Updated: 2026-05-03 — Phase 19-01 complete; 38 TX G5200 boundaries + 38 NATIONAL_LOWER districts confirmed; migration 104 applied (district_id backfill UPDATE 38)*
*Updated: 2026-05-03 — Phase 19-02 complete; Collin County G4020 boundary inserted (geo_id=48085, state=48, srid=4326, valid); 3235 records scanned; idempotent*
*Updated: 2026-05-03 — Phase 19-03 complete; migration 105 applied; 37 TX House politicians + 38 offices (TX-23 vacant); chamber c2facc31; all idempotent*
*Updated: 2026-05-03 — Phase 19-04 complete; PostGIS G4020↔G5200 backend wired; getPoliticiansByGovernmentList +countyGeoId; smoke test passed (5 US House reps for Collin County)*
*Updated: 2026-05-03 — Phase 19 complete (5/5 plans); frontend wired api.jsx+Landing.jsx+Results.jsx; production verified; G4020 county intersection pattern documented; Dallas/Tarrant/Bexar/Travis queued for future expansion*
