# Roadmap: Essentials — Empowered Vote

## Milestones

- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- ✅ **v2.1 Claude Candidate Discovery** — Phases 5-7 (shipped 2026-04-25) — [archive](milestones/v2.1-ROADMAP.md)
- 🚧 **v2.2 Data Depth & Admin Tooling** — Phases 8-11 (parked)
- ✅ **v3.0 Collin County, TX Coverage** — Phases 12-21 (shipped 2026-05-12)
- ✅ **v3.1 Local Compass Expansion** — Phases 22-25 (shipped 2026-05-05) — [archive](milestones/v3.1-ROADMAP.md)
- ✅ **v3.2 Legal Candidate Evaluation Framework** — Phases 26-32 (shipped 2026-05-10) — [archive](milestones/v3.2-ROADMAP.md)
- ✅ **v4.0 Compass Experience** — Phases 33-36 (shipped 2026-05-14) — [archive](milestones/v4.0-ROADMAP.md)
- 🚧 **v5.0 Location Onboarding Playbook** — Phases 37-46 (in progress)

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
**Plans**: TBD

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
**Plans**: TBD

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
**Plans**: TBD

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

### 🚧 v5.0 Location Onboarding Playbook (In Progress)

**Milestone Goal:** Build a cold-start, repeatable playbook for onboarding any US city — then prove it by taking Cambridge, MA to Indiana/LA caliber coverage. Every step is documented so future cities can be added without local insider knowledge.

#### Phase 37: Playbook Draft
**Goal**: A reusable location onboarding checklist and phase templates exist before Cambridge execution begins, so that every Cambridge phase can be documented against the playbook in real time
**Depends on**: Nothing (first phase — no Cambridge data needed)
**Requirements**: PLAY-01, PLAY-02
**Success Criteria** (what must be TRUE):
  1. `LOCATION-ONBOARDING.md` exists at project root with a complete cold-start checklist covering geofences, government DB, officials seed, headshots, elections, discovery setup, and compass stances — using only public sources
  2. Phase templates exist in `.planning/templates/` for at least: DB foundation, officials seed, headshots, discovery setup, and compass stances
  3. Both artifacts reference Cambridge-specific decisions (Mayor is appointed, odd-year elections, STV election method, Councillor spelling) as example annotations
**Plans**: TBD

Plans:
- [ ] 37-01: LOCATION-ONBOARDING.md checklist + .planning/templates/ phase templates

#### Phase 38: MA Geofences
**Goal**: All Massachusetts geofence boundaries are loaded into the database so that any MA address can be routed to the correct state legislators, congressional representative, city, and county
**Depends on**: Nothing (no blocking DB dependencies — runs in parallel with Phase 39)
**Requirements**: MAGEO-01, MAGEO-02, MAGEO-03, MAGEO-04
**Success Criteria** (what must be TRUE):
  1. A Cambridge address returns the correct STATE_UPPER district (one of the confirmed MA Senate districts covering the city)
  2. A Cambridge address returns the correct STATE_LOWER district (one of the 24th/25th/26th Middlesex districts)
  3. A Cambridge address returns the correct NATIONAL_LOWER district (MA-05 or MA-07 depending on ward)
  4. The Cambridge place boundary (GEOID 2511000) is loaded and a Cambridge address returns Cambridge city officials — not Boston or Somerville
  5. The Middlesex County G4020 boundary (FIPS 25017) is loaded for congressional intersection support
**Plans**: TBD

Plans:
- [ ] 38-01: MA allowlist addition to load-state-tiger-boundaries.ts + run --state MA --fips 25 --layers cd,sldu,sldl,place
- [ ] 38-02: Verify boundaries via FindMyLegislator on 4+ Cambridge addresses; fall back to MassGIS if mismatch; load Middlesex County G4020

#### Phase 39: MA Government DB
**Goal**: The Commonwealth of Massachusetts government row and all 200 state legislators are seeded in the database with correct district assignments, unblocking state-level lookups for any MA address
**Depends on**: Phase 38 (districts must exist before politicians link to them)
**Requirements**: MADB-01, MADB-02, MADB-03
**Success Criteria** (what must be TRUE):
  1. A point query at any Cambridge address returns the correct MA State Senator by name (matched to their district geofence)
  2. A point query at any Cambridge address returns the correct MA State Representative by name (one of Rogers/Decker/Connolly for central Cambridge addresses)
  3. The Commonwealth of Massachusetts government row uses the correct name ("Commonwealth of Massachusetts") and both legislative chambers (Senate + House of Representatives) exist
**Plans**: TBD

Plans:
- [ ] 39-01: Commonwealth government row + MA Senate + MA House of Representatives chambers
- [ ] 39-02: 40 MA state senators + 40 offices seeded (STATE_UPPER, district-linked)
- [ ] 39-03: 160 MA state representatives + 160 offices seeded (STATE_LOWER, district-linked)

#### Phase 40: MA Executives + Federal Officials
**Goal**: MA statewide executives and all federal officials representing MA addresses are seeded with headshots, completing the full state/federal layer for any Massachusetts address lookup
**Depends on**: Phase 38 (congressional geofences must exist), Phase 39 (government row must exist)
**Requirements**: MADB-04, FED-01, FED-02
**Success Criteria** (what must be TRUE):
  1. Governor Healey's profile page renders with headshot, title, and chamber
  2. A Cambridge address lookup returns US Senators Warren and Markey
  3. A Cambridge address lookup returns the correct US House representative (MA-05 Clark or MA-07 Pressley depending on ward — verified against Cambridge GIS)
  4. All 6 MA executives + 2 US Senators + 9 US House reps have headshots at 600×750 in Supabase Storage
**Plans**: TBD

Plans:
- [ ] 40-01: MA statewide executives seeded — Governor, Lt. Gov, AG, Treasurer, Auditor, Secretary of State — with chambers, offices, Wikipedia headshots
- [ ] 40-02: MA US Senators Warren + Markey + 9 US House reps seeded (NATIONAL_UPPER/NATIONAL_LOWER) with Wikipedia headshots

#### Phase 41: Cambridge City Structure
**Goal**: Cambridge's government, chambers, offices, incumbents, and contact data are fully seeded in the database — with the Mayor correctly modeled as an appointed council-internal title, not a separately elected executive; Cambridge appears on the Landing page
**Depends on**: Phase 39 (Cambridge government row needs Commonwealth as parent context)
**Requirements**: CAMB-01, CAMB-02, CAMB-03, CAMB-04, CAMB-05, CAMB-06, CAMB-07, LAND-01
**Success Criteria** (what must be TRUE):
  1. Cambridge government row exists with geo_id=2511000, state=MA, correct county reference
  2. City Council chamber exists with 9 at-large seats and election_method=stv_proportional; School Committee chamber exists with 6 elected seats
  3. Mayor office row has is_appointed_position=true and district_type=LOCAL (not LOCAL_EXEC); no election race row exists for Mayor; McGovern is linked to both his Councillor office and the Mayor office
  4. City Manager office row has is_appointed_position=true with Yi-An Huang seeded as incumbent
  5. All 9 Councillor offices and 6 School Committee offices have January 2026 incumbents (post-Nov 2025 seating)
  6. Contact data (email + website URL) is populated for all Cambridge incumbents from cambridge.ma.gov
  7. Cambridge appears as a browseable coverage area on the Landing page (COVERAGE_AREAS entry with browseGovernmentList: ['2511000'])
**Plans**: TBD

Plans:
- [ ] 41-01: Cambridge government row + City Council + School Committee chambers
- [ ] 41-02: 9 Councillor offices + 6 School Committee offices + Mayor office (appointed) + City Manager office (appointed)
- [ ] 41-03: All incumbents seeded with contact data (9 councillors + 6 school committee + city manager) + Landing.jsx COVERAGE_AREAS entry

#### Phase 42: Cambridge Headshots
**Goal**: All Cambridge officials have headshots at project standard (600×750 JPEG) in Supabase Storage, making every Cambridge profile page visually complete
**Depends on**: Phase 41 (politician rows must exist before photos can be linked)
**Requirements**: CAMB-08
**Success Criteria** (what must be TRUE):
  1. All 9 City Councillors have headshots at 600×750 in Supabase Storage (source: cambridgema.gov/Departments/citycouncil/members or vote.cambridgecivic.com)
  2. All 6 School Committee members have headshots at 600×750 in Supabase Storage
  3. City Manager Yi-An Huang has a headshot at 600×750 in Supabase Storage
  4. No headshot has superimposed text, banners, or graphics over the face; all are cropped to 4:5 ratio before resize
**Plans**: TBD

Plans:
- [ ] 42-01: Headshots for all 16 Cambridge officials (9 councillors + 6 school committee + 1 city manager)

#### Phase 43: Cambridge Elections
**Goal**: The 2025 Cambridge election results are seeded as historical data, a 2027 placeholder is ready for future use, and the discovery pipeline is configured — but inactive until 2027 filing opens
**Depends on**: Phase 41 (government structure must exist), Phase 38 (Cambridge geofence must exist)
**Requirements**: CAMB-09, CAMB-10, CAMB-11, CAMB-12
**Success Criteria** (what must be TRUE):
  1. The November 4, 2025 Cambridge City Council election appears in the elections view with all 20 candidates as race_candidate rows
  2. The November 4, 2025 Cambridge School Committee election appears with all 18 candidates as race_candidate rows
  3. A Cambridge address lookup returns both 2025 races — the UI renders correctly at 20-candidate and 18-candidate scale (visual verification required)
  4. A 2027 Cambridge election placeholder row exists; the discovery_jurisdictions row for Cambridge is present with cambridgema.gov domain but marked inactive
**Plans**: TBD

Plans:
- [ ] 43-01: 2025 City Council election row + all 20 candidates as race_candidates
- [ ] 43-02: 2025 School Committee election row + all 18 candidates as race_candidates; visual UI verification at 38-candidate total scale
- [ ] 43-03: 2027 election placeholder + Cambridge discovery_jurisdictions row (inactive)

#### Phase 44: Cambridge Compass Stances
**Goal**: Cambridge City Councillors have compass stances on the housing/zoning topic researched from public record, making the political compass useful for the most locally-relevant issue
**Depends on**: Phase 41 (politician rows must exist and be linked to inform.politicians)
**Requirements**: CAMB-13
**Success Criteria** (what must be TRUE):
  1. At least 5 of the 9 Cambridge City Councillors have at least one compass stance value in inform.politician_answers sourced from public record (voting record, candidate questionnaires, public statements)
  2. Each ingested stance has a source citation; no value is inferred without explicit documentation in the politician_context row
  3. The political compass renders on at least one Cambridge councillor's profile page (human-verified)
**Plans**: TBD

Plans:
- [ ] 44-01: Compass stance research + ingestion for Cambridge councillors — one at a time per rate-limit policy (housing/zoning primary topic)

#### Phase 45: MA 2026 Elections + Challengers
**Goal**: All November 2026 Massachusetts state and federal races are seeded with challenger candidates, making the ballot visible to any MA resident — with Azeem's September 2026 state senate primary explicitly named
**Depends on**: Phase 39 (MA legislators must exist as incumbents), Phase 40 (federal incumbents must exist)
**Requirements**: MA26-01, MA26-02, MA26-03
**Success Criteria** (what must be TRUE):
  1. A November 2026 Massachusetts General Election row exists in essentials.elections
  2. Burhan Azeem's 2nd Middlesex State Senate primary (September 1, 2026) is seeded as a named race with known candidates — cross-referencing his existing Cambridge Councillor politician row
  3. The discovery pipeline has been run (or manually seeded) for MA state senate, state house, and federal races; staged challengers are visible in the admin queue
  4. At least the congressional and senate races covering Cambridge (MA-05/MA-07, 2nd Middlesex, Middlesex + Suffolk) have candidates seeded from official MA SoS filings
**Plans**: TBD

Plans:
- [ ] 45-01: 2026 MA election row + Azeem senate primary race + known candidates from official MA SoS filings
- [ ] 45-02: MA discovery jurisdictions setup + discovery run for remaining 2026 MA state/federal races

#### Phase 46: Playbook Retrospective
**Goal**: The LOCATION-ONBOARDING.md checklist and phase templates are updated from Cambridge execution learnings so the next city onboarding is faster and avoids the pitfalls Cambridge surfaced
**Depends on**: All Cambridge phases complete (41-45); Phase 37 (original playbook draft)
**Requirements**: PLAY-03
**Success Criteria** (what must be TRUE):
  1. LOCATION-ONBOARDING.md reflects at least 3 Cambridge-specific learnings (e.g., election_method enum verification step, Mayor office modeling decision, FindMyLegislator boundary verification workflow)
  2. Phase templates in .planning/templates/ are updated with any new patterns discovered during Cambridge (e.g., stv_proportional election method, at-large seat numbering, Council-Manager structure)
  3. Checklist includes explicit pre-migration verification steps for: next election year (odd vs. even), Mayor election status, and boundary source accuracy
**Plans**: TBD

Plans:
- [ ] 46-01: Playbook retrospective — update LOCATION-ONBOARDING.md + templates from Cambridge learnings

---

## Backlog

These are known gaps that are not yet scoped into a milestone.

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
v5.0: 37 → 38+39 (parallel) → 40 (after 38+39) → 41 (after 39) → 42+44 (after 41) → 43 (after 41+38) → 45 (after 41+43) → 46 (after all Cambridge phases)

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
| 37. Playbook Draft | v5.0 | 0/TBD | Not started | - |
| 38. MA Geofences | v5.0 | 0/TBD | Not started | - |
| 39. MA Government DB | v5.0 | 0/TBD | Not started | - |
| 40. MA Executives + Federal Officials | v5.0 | 0/TBD | Not started | - |
| 41. Cambridge City Structure | v5.0 | 0/TBD | Not started | - |
| 42. Cambridge Headshots | v5.0 | 0/TBD | Not started | - |
| 43. Cambridge Elections | v5.0 | 0/TBD | Not started | - |
| 44. Cambridge Compass Stances | v5.0 | 0/TBD | Not started | - |
| 45. Landing + Navigation | v5.0 | 0/TBD | Not started | - |
| 46. Playbook Retrospective | v5.0 | 0/TBD | Not started | - |
