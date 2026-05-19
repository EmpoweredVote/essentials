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
- 🚧 **v6.0 Maine Essentials** — Phases 49-56 (in progress)

## Phases

<details>
<summary>✅ v2.0 Elections Page (Phases 1-4) - SHIPPED 2026-04-13</summary>

### Phase 1: Backend Left Join + Elections API
**Goal**: Backend returns all races including those with zero filed candidates
**Plans**: 1 plan

Plans:
- [x] 01-01: LEFT JOIN fix + elections-by-address endpoint

### Phase 2: Connected User Auto-Load
**Goal**: Connected users with a stored jurisdiction see their ballot races immediately on /elections
**Plans**: 1 plan

Plans:
- [x] 02-01: elections/me endpoint + Connected auto-forward on Elections page

### Phase 3: Elections Page — Full Rendering
**Goal**: All users can see their ballot with correct race grouping, candidate ordering, and three-state race display
**Plans**: 1 plan

Plans:
- [x] 03-01: ElectionsView.jsx — tier grouping, branch sort, unopposed/empty overlays

### Phase 4: Navigation + Discoverability
**Goal**: Users can reach the Elections page from the landing page and site header
**Plans**: 1 plan

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
**Plans**: 1 plan

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
**Plans**: 1 plan

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
**Plans**: 1 plan

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

---

### 🚧 v6.0 Maine Essentials (Phases 49-56) — In Progress

**Milestone Goal:** Any Maine resident can look up their congressional, state legislative, and city representatives — and see who is on their 2026 ballot — without creating an account.

#### Phase 49: ME Geofences
**Goal**: Maine TIGER boundaries are loaded and any Maine address correctly routes to federal, state, and city representatives
**Depends on**: Phase 38 (MA TIGER loader established; add Maine FIPS 23 using same pattern)
**Requirements**: GEO-01, GEO-02, GEO-03, GEO-04, GEO-05
**Success Criteria** (what must be TRUE):
  1. All 23 Maine city G4110 PLACE boundaries, 2 congressional CD boundaries, 35 SLDU senate boundaries, 151 SLDL house boundaries, and county G4020 boundaries are loaded in essentials.geofence_boundaries with state='23'
  2. A Portland address returns ME-01 (NATIONAL_LOWER) when queried
  3. A Bangor address returns the correct STATE_UPPER senate district and STATE_LOWER house district
  4. A Portland address returns LOCAL city boundary row (geo_id='2360545')
  5. A rural Maine address outside any city returns the correct congressional and state legislative districts with no LOCAL row
**Plans**: 2 plans

Plans:
- [x] 49-01-PLAN.md — Register Maine (FIPS 23) in STATE_LAYER_ALLOWLIST + STATE_CITY_ASSERTIONS; run loader for all 5 layers; verification SQL gates
- [x] 49-02-PLAN.md — Smoke test: Portland/Bangor/Augusta addresses return correct representatives; county G4020 intersection confirmed

#### Phase 50: ME Government DB Foundation
**Goal**: Maine's state government row, legislative chambers, and executive chambers exist in the database as the scaffolding all subsequent phases build on
**Depends on**: Phase 49
**Requirements**: MGOV-01, MGOV-02
**Success Criteria** (what must be TRUE):
  1. A `State of Maine` government row exists in essentials.governments with state='ME', geo_id='23'
  2. Maine Senate and Maine House of Representatives chamber rows exist, linked to the Maine government
  3. Maine executive chamber rows exist (Governor, Attorney General, Secretary of State, Treasurer)
  4. All chamber slugs are auto-generated (not manually inserted) and unique
**Plans**: 1 plan

Plans:
- [ ] 50-01-PLAN.md — Migration: Maine government row + 2 legislative chambers + 4 executive chambers; idempotency guards

#### Phase 51: ME Executives + Federal Officials + Headshots
**Goal**: Maine's Governor, AG, Secretary of State, Treasurer, US Senators, and US House members are seeded with offices and headshots; legislature-elected offices are correctly modeled as appointed
**Depends on**: Phase 50
**Requirements**: MGOV-03, MGOV-04, MGOV-05, HEAD-01, HEAD-02
**Success Criteria** (what must be TRUE):
  1. Governor Janet Mills appears on a Statehouse address query with office title 'Governor'
  2. AG, Secretary of State, and Treasurer offices have is_appointed_position=true; no election race rows exist for these offices
  3. Susan Collins (US Senate, NATIONAL_UPPER) and Angus King (US Senate, NATIONAL_UPPER) appear on any Maine address query
  4. Chellie Pingree (ME-01, NATIONAL_LOWER) appears on a Portland address query; Jared Golden (ME-02) appears on a Bangor address query
  5. Headshots for all 8 officials are uploaded at 600x750 (maine.gov / Wikipedia sources)
**Plans**: 1 plan

Plans:
- [ ] 51-01-PLAN.md — Migration: Governor/AG/SoS/Treasurer offices + incumbents (is_appointed_position=true for AG/SoS/Treasurer); external_id range TBD
- [ ] 51-02-PLAN.md — Migration: 2 US Senators (NATIONAL_UPPER shared district) + 2 US House members (ME-01/ME-02 NATIONAL_LOWER districts)
- [ ] 51-03-PLAN.md — Headshots: 4 ME executives + 4 federal officials from maine.gov/Wikipedia (600x750, 4:5 crop first)

#### Phase 52: ME State Legislature + Headshots
**Goal**: All 35 Maine state senators and 151 house representatives are seeded with offices, linked to their geofence districts, and have headshots where available from mainelegislature.org
**Depends on**: Phase 50
**Requirements**: MGOV-06, MGOV-07, HEAD-03
**Success Criteria** (what must be TRUE):
  1. 35 STATE_UPPER offices exist in the Maine Senate chamber, each linked to the correct SLDU district
  2. 151 STATE_LOWER offices exist in the Maine House of Representatives chamber, each linked to the correct SLDL district
  3. Any Maine address returns exactly 1 STATE_UPPER and 1 STATE_LOWER legislator
  4. Headshots for available senators and house reps are uploaded from mainelegislature.org at 600x750; coverage gaps documented
**Plans**: 1 plan

Plans:
- [ ] 52-01-PLAN.md — Migration: 35 ME state senators + 35 STATE_UPPER offices; office_id back-fill
- [ ] 52-02-PLAN.md — Migration: 151 ME house reps + 151 STATE_LOWER offices; office_id back-fill (generator script pattern from Phase 39)
- [ ] 52-03-PLAN.md — Headshots: bulk import from mainelegislature.org; document gaps

#### Phase 53: Portland City Structure + All 23 City Scaffolding + Landing
**Goal**: All 23 Maine incorporated city governments are scaffolded; Portland is deeply seeded with incumbents and headshots; Maine appears in Landing.jsx
**Depends on**: Phase 49, Phase 50
**Requirements**: MCITY-01, MCITY-02, HEAD-04, LAND-01
**Success Criteria** (what must be TRUE):
  1. All 23 Maine city government rows, chambers, and offices exist in the database
  2. Portland Mayor and all 9 City Council seats have incumbents seeded; Portland City Council chamber has election_method='rcv'
  3. Portland School Board incumbents are seeded
  4. A Portland address query returns Portland city officials (LOCAL boundary routes correctly through geo_id='2360545')
  5. Maine appears in Landing.jsx COVERAGE_AREAS with Portland city browse and ME state browse shortcuts
  6. Portland city official headshots are uploaded from portlandmaine.gov at 600x750
**Plans**: 1 plan

Plans:
- [ ] 53-01-PLAN.md — Migration: all 23 ME city governments + chambers + offices (Portland deep, others skeletal); election_method='rcv' on Portland City Council
- [ ] 53-02-PLAN.md — Migration: Portland Mayor + City Council + School Board incumbents seeded
- [ ] 53-03-PLAN.md — Headshots: Portland city officials from portlandmaine.gov; Landing.jsx Maine entry added

#### Phase 54: ME City Officials Tiers 2-4
**Goal**: Lewiston, Bangor, South Portland, Auburn, and Biddeford incumbents are seeded; remaining 18 cities have documented coverage gaps
**Depends on**: Phase 53
**Requirements**: MCITY-03, MCITY-04, HEAD-05
**Success Criteria** (what must be TRUE):
  1. Lewiston, Bangor, South Portland, Auburn, and Biddeford each have Mayor and Council incumbents seeded with available contact data
  2. Remaining 18 cities have offices present in the DB; politician_id=NULL vacancies are documented as known gaps, not silent omissions
  3. Headshots for Tier 2 city officials are uploaded where available online; gaps documented with source-not-found notation
**Plans**: 1 plan

Plans:
- [ ] 54-01-PLAN.md — Migration: Lewiston + Bangor + South Portland incumbents
- [ ] 54-02-PLAN.md — Migration: Auburn + Biddeford incumbents; remaining 18 cities gap documentation
- [ ] 54-03-PLAN.md — Headshots: Tier 2 cities from official city websites; gap log

#### Phase 55: ME 2026 Elections + Discovery Pipeline
**Goal**: Maine 2026 Primary and General election rows are seeded with known candidates, discovery_jurisdictions are armed for ongoing candidate discovery, and the cron sweep is verified active for Maine
**Depends on**: Phase 53
**Requirements**: ELEC-01, ELEC-02, ELEC-03, ELEC-04, ELEC-05, ELEC-06, ELEC-07, DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. 2026 Maine Primary (June 9) and General (November 3) election rows exist in essentials.elections
  2. Governor primary races show 6D and 10R candidates (open seat — Mills term-limited)
  3. US Senate race shows Susan Collins + primary challengers including Graham Platner
  4. ME-01 and ME-02 congressional races show Pingree and Golden as incumbents with any known primary challengers
  5. Key competitive state legislative primary races are seeded; discovery_jurisdictions rows (geoid='23') are active for both 2026 elections
  6. Portland 2027 municipal election placeholder exists with a discovery_jurisdictions row (cron_active=false)
  7. Discovery cron sweep is confirmed to include Maine 2026 elections (test run or would_be_swept verification)
**Plans**: 1 plan

Plans:
- [ ] 55-01-PLAN.md — Migration: 2026 ME Primary + General election rows; Governor races (open seat, 16 candidates); US Senate (Collins + challengers)
- [ ] 55-02-PLAN.md — Migration: ME-01/ME-02 congressional races; key state legislative primary races; Portland 2027 municipal placeholder
- [ ] 55-03-PLAN.md — Migration: discovery_jurisdictions rows (geoid='23', both elections + Portland 2027 inactive); cron sweep verification

#### Phase 56: ME Playbook Retrospective
**Goal**: Capture Maine-specific learnings back into LOCATION-ONBOARDING.md and phase templates so the next state onboarding starts with Maine's hard-won knowledge built in
**Depends on**: Phases 49-55 complete
**Requirements**: (non-functional — milestone closure artifact)
**Success Criteria** (what must be TRUE):
  1. LOCATION-ONBOARDING.md updated with Maine-specific [GOTCHA] callouts (RCV chamber modeling, legislature-elected appointed offices, 23-city PLACE layer vs. towns, mainelegislature.org headshot patterns)
  2. Phase templates updated to reflect any new patterns established during Maine (e.g., multi-tier city seeding with documented gaps, RCV election_method)
  3. Any new migration patterns or schema decisions added to STATE.md Accumulated Context
  4. Playbook is demonstrably more useful for the next state (Alaska, SF, MO, etc.) than it was before Maine
**Plans**: 2 plans

Plans:
- [ ] 56-01-PLAN.md — Review Maine execution learnings; author [GOTCHA] callouts for LOCATION-ONBOARDING.md; update phase templates
- [ ] 56-02-PLAN.md — Final v6.0 verification: smoke test ME address lookups, confirm discovery sweep, sign off milestone

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

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- lavote.gov election ID changes each cycle — mandatory manual update per election cycle

---

## Progress

**Execution Order:**
v2.2 (parked): 8 → 9 → 10 → 11
v3.0: 12 → 13 → 14 → 15 (and 12 → 16 in parallel) → 17 (after 14) → 18 (after 13)
v3.1: 22 → 23 → 24 → 25 (25 gated on 22 retirement decision)
v3.2: 26 → 27 → 28 (after 27) → 29 (after 27) → 30 (after 27) → 31 (after 29) → 32 (after 28+31)
v5.0: 37 → 38+39 (parallel) → 40 (after 38+39) → 41 (after 39) → 42 (after 41) → 44 (after 41+38) → 45 (after 44) → 46 (when accounts team delivers stances) → 47 (cleanup, after 46)
v6.0: 49 → 50 (after 49) → 51+52 (parallel, both after 50) → 53 (after 49+50) → 54+55 (parallel, both after 53) → 56 (after all)

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
| 50. ME Government DB Foundation | v6.0 | 0/TBD | Not started | - |
| 51. ME Executives + Federal Officials + Headshots | v6.0 | 0/TBD | Not started | - |
| 52. ME State Legislature + Headshots | v6.0 | 0/TBD | Not started | - |
| 53. Portland City Structure + All 23 Cities + Landing | v6.0 | 0/TBD | Not started | - |
| 54. ME City Officials Tiers 2-4 | v6.0 | 0/TBD | Not started | - |
| 55. ME 2026 Elections + Discovery Pipeline | v6.0 | 0/TBD | Not started | - |
| 56. ME Playbook Retrospective | v6.0 | 0/2 | Not started | - |
