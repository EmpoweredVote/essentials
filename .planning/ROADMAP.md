# Roadmap: Essentials — Empowered Vote

## Milestones

- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- ✅ **v2.1 Claude Candidate Discovery** — Phases 5-7 (shipped 2026-04-25) — [archive](milestones/v2.1-ROADMAP.md)
- 🚧 **v2.2 Data Depth & Admin Tooling** — Phases 8-11 (parked)
- ✅ **v3.0 Collin County, TX Coverage** — Phases 12-21 (shipped 2026-05-12)
- ✅ **v3.1 Local Compass Expansion** — Phases 22-25 (shipped 2026-05-05) — [archive](milestones/v3.1-ROADMAP.md)
- ✅ **v3.2 Legal Candidate Evaluation Framework** — Phases 26-32 (shipped 2026-05-10) — [archive](milestones/v3.2-ROADMAP.md)
- ✅ **v4.0 Compass Experience** — Phases 33-36 (shipped 2026-05-14) — [archive](milestones/v4.0-ROADMAP.md)
- ✅ **v5.0 Location Onboarding Playbook** — Phases 37-47 (shipped 2026-05-18) — [archive](milestones/v5.0-ROADMAP.md)
- ✅ **v6.0 Maine Essentials** — Phases 49-56 (shipped 2026-05-20) — [archive](milestones/v6.0-ROADMAP.md)
- 🚧 **v7.0 California** — Phases 57-71 (in progress)

## Phases

<details>
<summary>✅ v2.0 Elections Page (Phases 1-4) - SHIPPED 2026-04-13</summary>

### Phase 1: Backend Left Join + Elections API
**Goal**: Backend returns all races including those with zero filed candidates
**Plans**: 3 plans

Plans:
- [x] 01-01: LEFT JOIN fix + elections-by-address endpoint

### Phase 2: Connected User Auto-Load
**Goal**: Connected users with a stored jurisdiction see their ballot races immediately on /elections
**Plans**: 3 plans

Plans:
- [x] 02-01: elections/me endpoint + Connected auto-forward on Elections page

### Phase 3: Elections Page — Full Rendering
**Goal**: All users can see their ballot with correct race grouping, candidate ordering, and three-state race display
**Plans**: 3 plans

Plans:
- [x] 03-01: ElectionsView.jsx — tier grouping, branch sort, unopposed/empty overlays

### Phase 4: Navigation + Discoverability
**Goal**: Users can reach the Elections page from the landing page and site header
**Plans**: 3 plans

Plans:
- [x] 04-01: "Upcoming Elections" landing card + "Elections" header nav item

</details>

<details>
<summary>✅ v2.1 Claude Candidate Discovery (Phases 5-7) — SHIPPED 2026-04-25</summary>

- [x] Phase 5: DB Foundation + Agent Core (4/4 plans) — completed 2026-04-24
- [x] Phase 6: Admin Review UI + Email + Per-Race Trigger (3/3 plans) — completed 2026-04-25
- [x] Phase 7: Cron Automation + Auto-Upsert (2/2 plans) — completed 2026-04-25

Full details: [milestones/v2.1-ROADMAP.md](milestones/v2.1-ROADMAP.md)

</details>

---

### 🚧 v2.2 Data Depth & Admin Tooling (Parked — resume after v3.0)

**Milestone Goal:** Surface data gaps proactively, make compass work for local politicians, and give admins the tools to manage discovery without touching the terminal.

#### Phase 8: Admin Discovery UI + Dashboard
**Goal**: Admins can manage discovery runs and monitor coverage health entirely from the admin UI — no curl, no terminal
**Depends on**: Phase 7
**Requirements**: ADMUI-01, ADMUI-02, ADMUI-03, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Admin can see all discovery_jurisdictions rows in the UI with name, election date, last run status, and last run timestamp
  2. Admin can trigger a discovery run for any jurisdiction by clicking Run Discovery and sees a spinner while the run is in progress
  3. Admin can view the full discovery run history with per-run stats (jurisdiction, date/time, candidates found, staged, auto-upserted, status)
  4. Admin can see per-jurisdiction coverage health showing total races, races with candidates, and races with zero candidates
**Plans**: 4 plans

Plans:
- [ ] 08-01-PLAN.md — Migration 083 + persist autoUpserted in discoveryService.ts
- [ ] 08-02-PLAN.md — Backend GET endpoints (jurisdictions, runs, coverage) on JWT-gated router
- [ ] 08-03-PLAN.md — DiscoveryDashboard.jsx page + adminApi helpers + /admin/discovery route
- [ ] 08-04-PLAN.md — Human-verify checkpoint for end-to-end UI flow

#### Phase 9: Race Completeness Audit
**Goal**: Admins can detect races that exist on the official ballot but are missing from the database, without writing SQL
**Depends on**: Phase 8
**Requirements**: AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):
  1. Admin can trigger a race completeness check for a given election from the admin UI
  2. The audit result lists office names that appear on the official ballot but have no matching row in essentials.races, each with a source citation
  3. Admin can view completeness audit output in the admin UI without any terminal access or SQL
**Plans**: 3 plans

Plans:
- [ ] 09-01: Race audit backend — fetch authoritative ballot, diff against essentials.races, return missing offices with citations
- [ ] 09-02: Race audit admin UI — trigger + results display

#### Phase 10: Compass Stances Integration
**Goal**: The political compass renders correctly for local politicians (LA County + Monroe County) whose stances come from research files rather than pre-existing inform.politicians records
**Depends on**: Phase 8
**Requirements**: STANCE-01, STANCE-02, STANCE-03, STANCE-04
**Success Criteria** (what must be TRUE):
  1. Each essentials.politicians record with a stance research file is linked to an inform.politicians record (created if not exists)
  2. Stance values from research files (1-5 scale) are inserted into inform.politician_answers for all covered compass topics
  3. The political compass renders correctly on politician pages for LA County and Monroe County politicians sourced via the discovery pipeline
  4. Admin can run stance ingestion for a batch of politicians from the admin UI without manual SQL or terminal access
**Plans**: 3 plans

Plans:
- [ ] 10-01: Essentials-to-inform bridge — schema mapping, upsert logic for inform.politicians + inform.politician_answers
- [ ] 10-02: Stance file ingestion — convert research file values, batch ingest ~25 politicians, admin trigger UI

#### Phase 11: Indiana Local Races
**Goal**: Monroe County local races (Commissioner, Clerk, Assessor, Township) are seeded and kept current by the discovery pipeline
**Depends on**: Phase 10
**Requirements**: INDIANA-01, INDIANA-02, INDIANA-03
**Success Criteria** (what must be TRUE):
  1. Monroe County local races (Commissioner, Clerk, Assessor, Township) appear in essentials.races with the correct May 5 2026 Indiana Primary election_id
  2. Candidates for those races appear in essentials.race_candidates with designations and source
  3. Monroe County appears in discovery_jurisdictions with the county clerk source URL so the weekly cron will keep it current
**Plans**: 3 plans

Plans:
- [ ] 11-01: Monroe County local races seed + discovery_jurisdictions registration

---

<details>
<summary>✅ v3.0 Collin County, TX Coverage (Phases 12-21) — SHIPPED 2026-05-12</summary>

- [x] Phase 12: TX DB Foundation (4/4 plans) — completed 2026-04-30
- [x] Phase 13: Tier 1 Officials — Plano + McKinney (2/2 plans) — completed 2026-05-01
- [x] Phase 14: Tier 2 Officials — Allen, Frisco, Murphy, Celina, Prosper, Richardson (3/3 plans) — completed 2026-05-01
- [x] Phase 15: Tier 3-4 Officials — Remaining 16 Cities (2/2 plans) — completed 2026-05-01
- [x] Phase 16: Discovery Jurisdiction Setup (2/2 plans) — completed 2026-05-01
- [x] Phase 17: Headshots (4/4 plans) — completed 2026-05-10
- [x] Phase 18: Compass Stances (4/4 plans) — completed 2026-05-12
- [x] Phase 19: TX Congressional Seats + Geofences (5/5 plans) — completed 2026-05-03
- [x] Phase 20: TX State + Federal Officials — Offices and Headshots (2/2 plans) — completed 2026-05-04
- [x] Phase 21: TX State Legislature — Boundaries + Officials (5/5 plans) — completed 2026-05-04

Full details: [milestones/v3.0-ROADMAP.md](milestones/v3.0-ROADMAP.md)

</details>

<details>
<summary>✅ v3.1 Local Compass Expansion (Phases 22-25) — SHIPPED 2026-05-05</summary>

- [x] Phase 22: Compass Schema Audit (1/1 plans) — completed 2026-05-04
- [x] Phase 23: New LOCAL Compass Topics (2/2 plans) — completed 2026-05-05
- [x] Phase 24: Companion Focused Communities (2/2 plans) — completed 2026-05-05
- [x] Phase 25: Scope Audit + Retirement (2/2 plans) — completed 2026-05-05

Full details: [milestones/v3.1-ROADMAP.md](milestones/v3.1-ROADMAP.md)

</details>

<details>
<summary>✅ v3.2 Legal Candidate Evaluation Framework (Phases 26-32) — SHIPPED 2026-05-10</summary>

- [x] Phase 26: Campaign Finance Gap Closure (1/1 plans) — completed 2026-05-07
- [x] Phase 27: Judicial Compass DB (3/3 plans) — completed 2026-05-06
- [x] Phase 28: Judicial Compass Frontend + Communities (2/2 plans) — completed 2026-05-07
- [x] Phase 29: Bar Evaluation Data (3/3 plans) — completed 2026-05-09
- [x] Phase 30: Legal Candidate Stance Research (3/3 plans) — completed 2026-05-09
- [x] Phase 31: Legal Donor Activity (4/4 plans) — completed 2026-05-09
- [x] Phase 32: Legal Profile Page Fixes (1/1 plans) — completed 2026-05-10

Full details: [milestones/v3.2-ROADMAP.md](milestones/v3.2-ROADMAP.md)

</details>

---

<details>
<summary>✅ v4.0 Compass Experience (Phases 33-36) — SHIPPED 2026-05-14</summary>

- [x] Phase 33: Local Lens State System (1/1 plans) — completed 2026-05-12
- [x] Phase 34: Mini Compass Tile Component (3/3 plans) — completed 2026-05-13
- [ ] Phase 35: Hover Modal (0/TBD) — PARKED (design superseded by spoke tooltips)
- [x] Phase 36: Global Controls Bar + Compass-Default Mode (3/3 plans) — completed 2026-05-14

Full details: [milestones/v4.0-ROADMAP.md](milestones/v4.0-ROADMAP.md)

</details>

---

<details>
<summary>✅ v5.0 Location Onboarding Playbook (Phases 37-47) — SHIPPED 2026-05-18</summary>

- [x] Phase 37: Playbook Draft (1/1 plans) — completed 2026-05-16
- [x] Phase 38: MA Geofences (2/2 plans) — completed 2026-05-16
- [x] Phase 39: MA Government DB (3/3 plans) — completed 2026-05-16
- [x] Phase 40: MA Executives + Federal Officials (4/4 plans) — completed 2026-05-16
- [x] Phase 41: Cambridge City Structure (3/3 plans) — completed 2026-05-17
- [x] Phase 42: Cambridge Headshots (1/1 plans) — completed 2026-05-17
- ~~Phase 43: Cambridge Elections~~ — folded into Phase 44 (by design)
- [x] Phase 44: MA 2026 Elections + Challengers (3/3 plans) — completed 2026-05-17
- [x] Phase 45: Playbook Retrospective (2/2 plans) — completed 2026-05-17
- [x] Phase 46: Cambridge Compass Stances (1/1 plans) — completed 2026-05-18
- [x] Phase 47: v5.0 Tech Debt Cleanup (1/1 plans) — completed 2026-05-18

Full details: [milestones/v5.0-ROADMAP.md](milestones/v5.0-ROADMAP.md)

</details>

<details>
<summary>✅ v6.0 Maine Essentials (Phases 49-56) — SHIPPED 2026-05-20</summary>

- [x] Phase 49: ME Geofences (2/2 plans) — completed 2026-05-18
- [x] Phase 50: ME Government DB Foundation (1/1 plans) — completed 2026-05-18
- [x] Phase 51: ME Executives + Federal Officials + Headshots (3/3 plans) — completed 2026-05-19
- [x] Phase 52: ME State Legislature + Headshots (3/3 plans) — completed 2026-05-19
- [x] Phase 53: Portland City Structure + All 23 Cities + Landing (3/3 plans) — completed 2026-05-19
- [x] Phase 54: ME City Officials Tiers 2-4 (3/3 plans) — completed 2026-05-19
- [x] Phase 55: ME 2026 Elections + Discovery Pipeline (3/3 plans) — completed 2026-05-20
- [x] Phase 56: ME Playbook Retrospective (2/2 plans) — completed 2026-05-20

Full details: [milestones/v6.0-ROADMAP.md](milestones/v6.0-ROADMAP.md)

</details>

---

<details>
<summary>🚧 v7.0 California (Phases 57-71) — IN PROGRESS</summary>

### Phase 57: CA Geofences
**Goal**: Any California address routes correctly to all government tiers — city, county, state legislative, and congressional
**Depends on**: Phase 56 (established TIGER loader pattern)
**Requirements**: GEO-01
**Success Criteria** (what must be TRUE):
  1. A San Francisco address returns LOCAL (G4110 city), COUNTY (G4020), STATE_UPPER (SLDU), STATE_LOWER (SLDL), and NATIONAL_LOWER (CD) boundary rows
  2. A rural unincorporated address returns G4040 COUSUB + county + legislative + congressional boundaries (no LOCAL gap)
  3. All 52 congressional districts, 40 senate districts, 80 assembly districts, and 58 counties have boundary rows in geofence_boundaries
  4. Smoke test: 3 different CA addresses (urban city, suburban city, unincorporated) each return the correct district names with zero NULL tiers

Plans:
- [x] 57-01-PLAN.md — Patch TIGER loader for CA (add county+cousub layers, state-conditional FUNCSTAT, fipsArg=06 pre-flight); load G4020 (58) + G4040 (404 CCDs); SQL gates pass
- [x] 57-02-PLAN.md — Smoke test 3 CA addresses (SF consolidated, San Diego, East LA unincorporated); document v7.0 target city geo_ids for Phases 63-68

### Phase 58: LAUSD Geofences
**Goal**: LA Unified School District board district boundaries are loaded so any LA address also returns the resident's LAUSD board district
**Depends on**: Phase 57 (CA geofences foundation)
**Requirements**: GEO-02
**Success Criteria** (what must be TRUE):
  1. All 7 LAUSD board district boundaries exist in geofence_boundaries with a distinct mtfcc or district_type that does not collide with city/county tiers
  2. An LA address within LAUSD territory returns the correct board district row alongside city and county tiers
  3. An address outside LAUSD territory (e.g. Pasadena Unified) returns no LAUSD row (no false positives)

Plans:
- [x] 58-01-PLAN.md — Source LAUSD district shapefiles; load as distinct geofence type; verify 7 boundaries present
- [x] 58-02-PLAN.md — Routing integration test: LA address returns LAUSD district; Pasadena address does not

### Phase 59: CA Government DB Foundation
**Goal**: The State of California government row and all constitutional officer chambers exist with correct is_appointed_position flags, ready to receive officials
**Depends on**: Phase 57
**Requirements**: GOVDB-01, GOVDB-02
**Success Criteria** (what must be TRUE):
  1. essentials.governments has a "State of California" row with FIPS-based geo_id
  2. All CA constitutional officer chambers exist (Governor, Lieutenant Governor, Attorney General, Secretary of State, Controller, Treasurer, Insurance Commissioner, Superintendent of Public Instruction) with correct is_appointed_position per CA constitution
  3. Governor Newsom + all popularly-elected constitutional officers are seeded as politicians with offices linked to their chambers
  4. All seeded executives have headshots uploaded to Supabase Storage at 600×750

Plans:
- [ ] 59-01-PLAN.md — Migration: CA government row + all chambers; research CA constitution for appointed vs. elected distinction
- [ ] 59-02-PLAN.md — Migration: Governor Newsom + constitutional officer politicians + office rows
- [ ] 59-03-PLAN.md — Headshots: source + upload 600×750 for all CA executives

### Phase 60: CA Executives + Federal Officials
**Goal**: California's 2 US Senators and all 52 US House representatives are seeded with offices linked to the correct NATIONAL districts and have headshots
**Depends on**: Phase 57 (congressional boundaries loaded)
**Requirements**: GOVDB-03
**Success Criteria** (what must be TRUE):
  1. Both CA US Senators (Padilla + Schiff) are seeded with offices linked to the NATIONAL_UPPER district
  2. All 52 US House representatives are seeded with offices each linked to the correct NATIONAL_LOWER district (CD-01 through CD-52)
  3. Every federal official has a headshot in Supabase Storage at 600×750
  4. A lookup for a CA address returns the correct US Representative name matching the congressional district boundary

Plans:
- [ ] 60-01-PLAN.md — Migration: 2 CA senators + 52 US House reps + office rows linked to NATIONAL districts
- [ ] 60-02-PLAN.md — Headshots: source + upload 600×750 for all 54 federal officials

### Phase 61: CA State Legislature
**Goal**: All 80 Assembly members and 40 State Senators are seeded with offices linked to the correct STATE geofence districts and have headshots
**Depends on**: Phase 57 (SLDL + SLDU boundaries loaded), Phase 59 (chambers exist)
**Requirements**: GOVDB-04
**Success Criteria** (what must be TRUE):
  1. All 80 Assembly members are seeded with offices linked to SLDL districts AD-01 through AD-80
  2. All 40 State Senators are seeded with offices linked to SLDU districts SD-01 through SD-40
  3. Every legislator has a headshot in Supabase Storage at 600×750
  4. A lookup for a CA address returns the correct Assembly member and State Senator names matching the district boundaries

Plans:
- [ ] 61-01-PLAN.md — Migration: 40 CA State Senators + office rows linked to SLDU districts
- [ ] 61-02-PLAN.md — Migration: 80 CA Assembly members + office rows linked to SLDL districts
- [ ] 61-03-PLAN.md — Headshots: source + upload 600×750 for all 120 state legislators

### Phase 62: LA Backlog Closure
**Goal**: The existing LA seed is complete — LAUSD officials are seeded, the Governor race has all filed candidates, the lavote.gov election ID is current, and any city structure gaps are closed
**Depends on**: Phase 58 (LAUSD geofences), Phase 59 (CA government chambers exist)
**Requirements**: LA-01, LA-02, LA-03, LA-04
**Success Criteria** (what must be TRUE):
  1. The CA Governor 2026 race row has all 10 SOS-verified challenger candidates seeded as race_candidates
  2. The lavote.gov election ID in the database matches the current election cycle (no stale ID)
  3. All 7 LAUSD board members are seeded with offices linked to LAUSD geofence districts and have headshots at 600×750
  4. An LA address lookup returns a complete set of local officials — no missing chambers or office gaps visible in the UI

Plans:
- [ ] 62-01-PLAN.md — Migration 171 (la_council_votes, unapplied backlog); LA city structure audit + gap-close migration
- [ ] 62-02-PLAN.md — CA Governor challenger candidates migration; lavote.gov election ID update
- [ ] 62-03-PLAN.md — LAUSD board member seed + office rows linked to LAUSD districts; headshots 600×750

### Phase 63: San Francisco Deep Seed
**Goal**: San Francisco is fully seeded — government structure, all Tier 1-4 incumbents, and headshots — so an SF address returns a complete local officials list
**Depends on**: Phase 57 (SF city boundary loaded)
**Requirements**: CITIES-01
**Success Criteria** (what must be TRUE):
  1. SF government row exists with chambers for Mayor, Board of Supervisors (11 districts), City Attorney, DA, and any other Tier 1 offices
  2. All 11 District Supervisors + Mayor + City Attorney + DA are seeded as politicians with linked office rows
  3. An SF address lookup returns the correct District Supervisor for that address
  4. All seeded SF officials have headshots at 600×750 in Supabase Storage

Plans:
- [ ] 63-01-PLAN.md — SF government structure: government row + chambers + 11 supervisor district offices + mayor/CA/DA offices
- [ ] 63-02-PLAN.md — SF incumbents: Mayor + 11 supervisors + City Attorney + DA politician rows + office links
- [ ] 63-03-PLAN.md — SF headshots: source + upload 600×750 for all SF officials

### Phase 64: San Jose Deep Seed
**Goal**: San Jose is fully seeded — government structure, all Tier 1-4 incumbents, and headshots — so a San Jose address returns a complete local officials list
**Depends on**: Phase 57 (San Jose city boundary loaded)
**Requirements**: CITIES-02
**Success Criteria** (what must be TRUE):
  1. San Jose government row exists with chambers for Mayor and City Council (10 districts)
  2. Mayor + all 10 Council Members are seeded as politicians with linked office rows
  3. A San Jose address lookup returns the correct Council Member for that address
  4. All seeded San Jose officials have headshots at 600×750 in Supabase Storage

Plans:
- [ ] 64-01-PLAN.md — San Jose government structure + chambers + offices
- [ ] 64-02-PLAN.md — San Jose incumbents: Mayor + 10 council members + office links
- [ ] 64-03-PLAN.md — San Jose headshots: source + upload 600×750

### Phase 65: San Diego Deep Seed
**Goal**: San Diego is fully seeded — government structure, all Tier 1-4 incumbents, and headshots — so a San Diego address returns a complete local officials list
**Depends on**: Phase 57 (San Diego city boundary loaded)
**Requirements**: CITIES-03
**Success Criteria** (what must be TRUE):
  1. San Diego government row exists with chambers for Mayor, City Council (9 districts), City Attorney, and relevant Tier 2-4 offices
  2. Mayor + all 9 Council Members + City Attorney are seeded as politicians with linked office rows
  3. A San Diego address lookup returns the correct Council Member for that address
  4. All seeded San Diego officials have headshots at 600×750 in Supabase Storage

Plans:
- [ ] 65-01-PLAN.md — San Diego government structure + chambers + offices
- [ ] 65-02-PLAN.md — San Diego incumbents + office links
- [ ] 65-03-PLAN.md — San Diego headshots: source + upload 600×750

### Phase 66: Sacramento Deep Seed
**Goal**: Sacramento is fully seeded — government structure, all Tier 1-4 incumbents, and headshots — so a Sacramento address returns a complete local officials list
**Depends on**: Phase 57 (Sacramento city boundary loaded)
**Requirements**: CITIES-04
**Success Criteria** (what must be TRUE):
  1. Sacramento government row exists with chambers for Mayor and City Council (8 districts)
  2. Mayor + all 8 Council Members are seeded as politicians with linked office rows
  3. A Sacramento address lookup returns the correct Council Member for that address
  4. All seeded Sacramento officials have headshots at 600×750 in Supabase Storage

Plans:
- [ ] 66-01-PLAN.md — Sacramento government structure + chambers + offices
- [ ] 66-02-PLAN.md — Sacramento incumbents + office links
- [ ] 66-03-PLAN.md — Sacramento headshots: source + upload 600×750

### Phase 67: Fremont Deep Seed
**Goal**: Fremont is fully seeded — government structure, all Tier 1-4 incumbents, and headshots — so a Fremont address returns a complete local officials list
**Depends on**: Phase 57 (Fremont city boundary loaded)
**Requirements**: CITIES-05
**Success Criteria** (what must be TRUE):
  1. Fremont government row exists with chambers for Mayor and City Council (at-large or district model confirmed)
  2. Mayor + all Council Members are seeded as politicians with linked office rows
  3. A Fremont address lookup returns city officials without routing errors
  4. All seeded Fremont officials have headshots at 600×750 in Supabase Storage

Plans:
- [ ] 67-01-PLAN.md — Fremont government structure + chambers + offices
- [ ] 67-02-PLAN.md — Fremont incumbents + office links
- [ ] 67-03-PLAN.md — Fremont headshots: source + upload 600×750

### Phase 68: Berkeley Deep Seed
**Goal**: Berkeley is fully seeded — government structure, all Tier 1-4 incumbents, and headshots — so a Berkeley address returns a complete local officials list; RCV election_method flagged for Mayor
**Depends on**: Phase 57 (Berkeley city boundary loaded)
**Requirements**: CITIES-06
**Success Criteria** (what must be TRUE):
  1. Berkeley government row exists with chambers for Mayor and City Council (8 districts + at-large seats per Berkeley charter)
  2. Mayor + all Council Members are seeded as politicians with linked office rows; Mayor office has election_method='rcv' noted for future elections
  3. A Berkeley address lookup returns the correct District Council Member for that address
  4. All seeded Berkeley officials have headshots at 600×750 in Supabase Storage

Plans:
- [ ] 68-01-PLAN.md — Berkeley government structure + chambers + offices; confirm RCV offices
- [ ] 68-02-PLAN.md — Berkeley incumbents + office links
- [ ] 68-03-PLAN.md — Berkeley headshots: source + upload 600×750

### Phase 69: Landing + Elections + Discovery
**Goal**: All 7 CA cities appear in the coverage map, CA 2026 election rows are seeded, and discovery is armed for the June 3 primary and all covered cities
**Depends on**: Phases 62-68 (all city seeds complete)
**Requirements**: CITIES-07, ELECT-01, ELECT-02, ELECT-03, ELECT-04
**Success Criteria** (what must be TRUE):
  1. Landing.jsx COVERAGE_AREAS includes all 7 CA cities (LA + SF + San Jose + San Diego + Sacramento + Fremont + Berkeley) with correct browseGovernmentList IDs
  2. CA 2026 primary (June 3) and general (November 4) election rows exist in essentials.elections
  3. The CA Governor 2026 open-seat race exists with all SOS-verified candidates and cron_active=true discovery armed
  4. All 52 CA US House 2026 race rows exist (one per CD) with cron_active=true discovery armed
  5. discovery_jurisdictions rows with cron_active=true exist for all 7 covered CA cities

Plans:
- [ ] 69-01-PLAN.md — Landing.jsx COVERAGE_AREAS update for all 7 CA cities
- [ ] 69-02-PLAN.md — CA elections foundation: 2 election rows + Governor race + Governor candidates migration
- [ ] 69-03-PLAN.md — CA US House 52 race rows migration + discovery_jurisdictions armed
- [ ] 69-04-PLAN.md — City discovery_jurisdictions rows (7 cities) + smoke test all cron_active rows

### Phase 70: Compass Stances
**Goal**: Compass stances are ingested for CA constitutional officers, federal officials, and city council members across all 7 CA cities where public record exists
**Depends on**: Phases 59-68 (all officials seeded), Phase 69 (discovery armed)
**Requirements**: COMPASS-01, COMPASS-02
**Success Criteria** (what must be TRUE):
  1. Every CA constitutional officer and US Senator/Rep with a verifiable public stance record has at least one compass answer ingested
  2. City council officials across all 7 CA cities with discoverable public stance records have compass answers ingested
  3. All stance ingestion ran one-at-a-time (rate-limit rule honored); no bulk parallel runs
  4. The compass renders on politician profile pages for at least one official per city without errors

Plans:
- [ ] 70-01-PLAN.md — Stance research + ingestion: CA constitutional officers + 2 US Senators (one at a time)
- [ ] 70-02-PLAN.md — Stance research + ingestion: CA US House reps (one at a time, prioritize high-profile districts)
- [ ] 70-03-PLAN.md — Stance research + ingestion: city council officials across all 7 CA cities (one at a time)

### Phase 71: Playbook Retrospective
**Goal**: The location onboarding playbook is updated with all CA-specific GOTCHAs discovered during v7.0 so future state onboarding is faster
**Depends on**: Phases 57-70 (entire v7.0 complete)
**Requirements**: PLAYBOOK-01
**Success Criteria** (what must be TRUE):
  1. LOCATION-ONBOARDING.md has a CA-specific GOTCHA section covering: charter vs. general law city structure differences, RCV cities (SF/Berkeley), TIGER CD key verification for CA, LAUSD sub-district geofence pattern, and lavote.gov election ID maintenance
  2. Any trap encountered during v7.0 phases that is not already in the playbook is documented with the problem, solution, and CA example
  3. The playbook entry is written so a future agent can onboard a new CA city without repeating any v7.0 mistakes

Plans:
- [ ] 71-01-PLAN.md — Playbook retrospective: audit v7.0 phase summaries for GOTCHAs; write CA section in LOCATION-ONBOARDING.md

</details>

---

## Backlog

These are known gaps that are not yet scoped into a milestone.

### ✅ Phase 48: MA Towns (G4040 COUSUB Boundaries) — COMPLETE 2026-05-18
**Goal**: Load G4040 COUSUB boundaries for all 293 MA towns (Lexington, Concord, Belmont, etc.) so non-city MA residents get a LOCAL boundary row and city officials routing
**Depends on**: Phase 38 (MA TIGER loader established)
**Note**: Cambridge (G4110) and all 57 other MA incorporated cities are already covered. This phase extends coverage to the 293 towns that use G4040 COUSUB instead of G4110 in TIGER.
**Plans**: 3 plans

Plans:
- [x] 48-01-PLAN.md — Add cousub to loader; run load (293 MA towns)
- [x] 48-02-PLAN.md — Verification SQL gates + Lexington/Concord smoke test
- [x] 48-03-PLAN.md — Cambridge district_id back-fill (gap closure: address lookup now returns local officials)

### Data Gaps (accounts team backlog)

- Migration 171 (171_la_council_votes.sql) — unapplied; folded into Phase 62
- Migration 182 (legacy views drop) — verify applied status before Phase 62 work

---

## Progress

**Execution Order:**
v2.2 (parked): 8 → 9 → 10 → 11
v3.0: 12 → 13 → 14 → 15 (and 12 → 16 in parallel) → 17 (after 14) → 18 (after 13)
v3.1: 22 → 23 → 24 → 25 (25 gated on 22 retirement decision)
v3.2: 26 → 27 → 28 (after 27) → 29 (after 27) → 30 (after 27) → 31 (after 29) → 32 (after 28+31)
v5.0: 37 → 38+39 (parallel) → 40 (after 38+39) → 41 (after 39) → 42 (after 41) → 44 (after 41+38) → 45 (after 44) → 46 (when accounts team delivers stances) → 47 (cleanup, after 46)
v6.0: 49 → 50 (after 49) → 51+52 (parallel, both after 50) → 53 (after 49+50) → 54+55 (parallel, both after 53) → 56 (after all)
v7.0: 57 → 58 (after 57) → 59+60 (parallel, both after 57) → 61 (after 57+59) → 62 (after 58+59) → 63→64→65→66→67→68 (each after 57; sequential by convention) → 69 (after 62-68) → 70 (after 69) → 71 (after 70)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Left Join + Elections API | v2.0 | 1/1 | Complete | 2026-04-13 |
| 2. Connected User Auto-Load | v2.0 | 1/1 | Complete | 2026-04-13 |
| 3. Elections Page — Full Rendering | v2.0 | 1/1 | Complete | 2026-04-13 |
| 4. Navigation + Discoverability | v2.0 | 1/1 | Complete | 2026-04-13 |
| 5. DB Foundation + Agent Core | v2.1 | 4/4 | Complete | 2026-04-24 |
| 6. Admin Review UI + Email + Per-Race Trigger | v2.1 | 3/3 | Complete | 2026-04-25 |
| 7. Cron Automation + Auto-Upsert | v2.1 | 2/2 | Complete | 2026-04-25 |
| 8. Admin Discovery UI + Dashboard | v2.2 | 0/4 | Parked | - |
| 9. Race Completeness Audit | v2.2 | 0/2 | Parked | - |
| 10. Compass Stances Integration | v2.2 | 0/2 | Parked | - |
| 11. Indiana Local Races | v2.2 | 0/1 | Parked | - |
| 12. TX DB Foundation | v3.0 | 4/4 | Complete | 2026-04-30 |
| 13. Tier 1 Officials — Plano + McKinney | v3.0 | 2/2 | Complete | 2026-05-01 |
| 14. Tier 2 Officials — Allen, Frisco, Murphy, Celina, Prosper, Richardson | v3.0 | 3/3 | Complete | 2026-05-01 |
| 15. Tier 3-4 Officials — Remaining 16 Cities | v3.0 | 2/2 | Complete | 2026-05-01 |
| 16. Discovery Jurisdiction Setup | v3.0 | 2/2 | Complete | 2026-05-01 |
| 17. Headshots | v3.0 | 4/4 | Complete | 2026-05-10 |
| 18. Compass Stances | v3.0 | 4/4 | Complete | 2026-05-12 |
| 19. TX Congressional Seats + Geofences | v3.0 | 5/5 | Complete | 2026-05-03 |
| 20. TX State + Federal Officials — Offices and Headshots | v3.0 | 2/2 | Complete | 2026-05-04 |
| 21. TX State Legislature — Boundaries + Officials | v3.0 | 5/5 | Complete | 2026-05-04 |
| 22. Compass Schema Audit | v3.1 | 1/1 | Complete | 2026-05-04 |
| 23. New LOCAL Compass Topics | v3.1 | 2/2 | Complete | 2026-05-05 |
| 24. Companion Focused Communities | v3.1 | 2/2 | Complete | 2026-05-05 |
| 25. Scope Audit + Retirement | v3.1 | 2/2 | Complete | 2026-05-05 |
| 26. Campaign Finance Gap Closure | v3.2 ✅ | 1/1 | Complete | 2026-05-07 |
| 27. Judicial Compass DB | v3.2 ✅ | 3/3 | Complete | 2026-05-06 |
| 28. Judicial Compass Frontend + Communities | v3.2 ✅ | 2/2 | Complete | 2026-05-07 |
| 29. Bar Evaluation Data | v3.2 ✅ | 3/3 | Complete | 2026-05-09 |
| 30. Legal Candidate Stance Research | v3.2 ✅ | 3/3 | Complete | 2026-05-09 |
| 31. Legal Donor Activity | v3.2 ✅ | 4/4 | Complete | 2026-05-09 |
| 32. Legal Profile Page Fixes | v3.2 ✅ | 1/1 | Complete | 2026-05-10 |
| 33. Local Lens State System | v4.0 ✅ | 1/1 | Complete | 2026-05-12 |
| 34. Mini Compass Tile Component | v4.0 ✅ | 3/3 | Complete | 2026-05-13 |
| 35. Hover Modal — Full Compass | v4.0 ✅ | 0/TBD | Parked | - |
| 36. Global Controls + Compass Default | v4.0 ✅ | 3/3 | Complete | 2026-05-14 |
| 37. Playbook Draft | v5.0 | 1/1 | Complete | 2026-05-16 |
| 38. MA Geofences | v5.0 | 2/2 | Complete | 2026-05-16 |
| 39. MA Government DB | v5.0 | 3/3 | Complete | 2026-05-16 |
| 40. MA Executives + Federal Officials | v5.0 | 4/4 | Complete | 2026-05-16 |
| 41. Cambridge City Structure | v5.0 | 3/3 | Complete | 2026-05-17 |
| 42. Cambridge Headshots | v5.0 | 1/1 | Complete | 2026-05-17 |
| ~~43. Cambridge Elections~~ | v5.0 | - | Folded into Phase 44 | 2026-05-17 |
| 44. MA 2026 Elections + Challengers | v5.0 | 3/3 | Complete | 2026-05-17 |
| 45. Playbook Retrospective | v5.0 | 2/2 | Complete | 2026-05-17 |
| 46. Cambridge Compass Stances | v5.0 | 1/1 | Complete | 2026-05-18 |
| 47. v5.0 Tech Debt Cleanup | v5.0 | 1/1 | Complete | 2026-05-18 |
| 48. MA Towns (G4040 COUSUB) | v5.1+ | 3/3 | Complete | 2026-05-18 |
| 49. ME Geofences | v6.0 | 2/2 | Complete | 2026-05-18 |
| 50. ME Government DB Foundation | v6.0 | 1/1 | Complete | 2026-05-18 |
| 51. ME Executives + Federal Officials + Headshots | v6.0 | 3/3 | Complete | 2026-05-19 |
| 52. ME State Legislature + Headshots | v6.0 | 3/3 | Complete | 2026-05-19 |
| 53. Portland City Structure + All 23 Cities + Landing | v6.0 | 3/3 | Complete | 2026-05-19 |
| 54. ME City Officials Tiers 2-4 | v6.0 | 3/3 | Complete | 2026-05-19 |
| 55. ME 2026 Elections + Discovery Pipeline | v6.0 | 3/3 | Complete | 2026-05-20 |
| 56. ME Playbook Retrospective | v6.0 | 2/2 | Complete | 2026-05-20 |
| 57. CA Geofences | v7.0 | 2/2 | Complete | 2026-05-21 |
| 58. LAUSD Geofences | v7.0 | 2/2 | Complete | 2026-05-21 |
| 59. CA Government DB Foundation | v7.0 | 3/3 | Complete | 2026-05-21 |
| 60. CA Executives + Federal Officials | v7.0 | 0/2 | Pending | - |
| 61. CA State Legislature | v7.0 | 0/3 | Pending | - |
| 62. LA Backlog Closure | v7.0 | 0/3 | Pending | - |
| 63. San Francisco Deep Seed | v7.0 | 0/3 | Pending | - |
| 64. San Jose Deep Seed | v7.0 | 0/3 | Pending | - |
| 65. San Diego Deep Seed | v7.0 | 0/3 | Pending | - |
| 66. Sacramento Deep Seed | v7.0 | 0/3 | Pending | - |
| 67. Fremont Deep Seed | v7.0 | 0/3 | Pending | - |
| 68. Berkeley Deep Seed | v7.0 | 0/3 | Pending | - |
| 69. Landing + Elections + Discovery | v7.0 | 0/4 | Pending | - |
| 70. Compass Stances | v7.0 | 0/3 | Pending | - |
| 71. Playbook Retrospective | v7.0 | 0/1 | Pending | - |
