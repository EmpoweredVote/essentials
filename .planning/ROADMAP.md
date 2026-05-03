# Roadmap: Essentials — Empowered Vote

## Milestones

- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- ✅ **v2.1 Claude Candidate Discovery** — Phases 5-7 (shipped 2026-04-25) — [archive](milestones/v2.1-ROADMAP.md)
- 🚧 **v2.2 Data Depth & Admin Tooling** — Phases 8-11 (parked)
- 🚧 **v3.0 Collin County, TX Coverage** — Phases 12-18 (in progress)

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

### 🚧 v3.0 Collin County, TX Coverage (In Progress)

**Milestone Goal:** Populate the Essentials + Compass database for 24 Collin County, TX cities — government structures, current incumbents, discovery jurisdiction setup, headshots, and Compass stances where public record exists.

#### Phase 12: TX DB Foundation
**Goal**: Texas state, Collin County, and all 24 target cities have government, chamber, and office rows in the essentials schema with correct FIPS identifiers
**Depends on**: Phase 11 (v2.2 backlog) — can start independently; no code dependencies
**Requirements**: GEO-01, GEO-02, GEO-03, GEO-04
**Success Criteria** (what must be TRUE):
  1. `essentials.governments` contains a Texas state row with the correct FIPS geo_id and a Collin County row with geo_id `48085`
  2. All 23 incorporated target city governments have rows in `essentials.governments` with their Census place FIPS codes (Copeville excluded pending municipal incorporation verification)
  3. Each city government has at least one `essentials.chambers` row (City Council) and seat-level `essentials.offices` rows for Mayor and each Council seat
  4. A SQL query joining governments → chambers → offices for any of the 24 cities returns complete, non-null results with no orphaned rows
**Plans**: 4 plans

Plans:
- [x] 12-01-PLAN.md — Migration 087: ALTER TABLE geo_id + TX state + Collin County (wave 1)
- [x] 12-02-PLAN.md — Migration 088: Tier 1 cities — Plano, McKinney, Allen, Frisco (wave 2)
- [x] 12-03-PLAN.md — Migration 089: Tier 2 cities — Murphy, Celina, Prosper, Richardson (wave 2)
- [x] 12-04-PLAN.md — Migration 090: Tier 3-4 cities — Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville, Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge (wave 2)

#### Phase 13: Tier 1 Officials — Plano + McKinney
**Goal**: All incumbent mayor and council members for Plano and McKinney are in the database, linked to their office rows, with available contact information
**Depends on**: Phase 12
**Requirements**: OFF-01, OFF-02
**Success Criteria** (what must be TRUE):
  1. `essentials.politicians` has a row for every current Plano incumbent (mayor + all council seats) with `is_active=true` and `is_incumbent=true`
  2. `essentials.politicians` has a row for every current McKinney incumbent with `is_active=true` and `is_incumbent=true`
  3. Every politician row is linked via `office_id` to a valid `essentials.offices` row created in Phase 12
  4. Email and/or official URL contact fields are populated for at least 80% of Tier 1 politicians where publicly available on city websites
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md — Migration 091: Plano incumbent politicians (Mayor + Place 1-5, 7-8) with bio URLs + emails
- [x] 13-02-PLAN.md — Migration 092: McKinney incumbent politicians (Mayor + At-Large 1-2 + District 1-4) with bio URL anchors

#### Phase 14: Tier 2 Officials — Allen, Frisco, Murphy, Celina, Prosper, Richardson
**Goal**: All incumbent mayor and council members for the six Tier 2 cities are in the database, linked to their office rows
**Depends on**: Phase 13
**Requirements**: OFF-03, OFF-04, OFF-05, OFF-06, OFF-07, OFF-08
**Success Criteria** (what must be TRUE):
  1. `essentials.politicians` has incumbent rows for all six Tier 2 cities (Allen, Frisco, Murphy, Celina, Prosper, Richardson) with `is_active=true` and `is_incumbent=true`
  2. Every Tier 2 politician row is linked via `office_id` to a valid `essentials.offices` row
  3. Contact info (email or URL) is populated where publicly listed on each city's official website
**Plans**: 3 plans

Plans:
- [x] 14-01-PLAN.md — Migration 094: Allen + Frisco incumbent politicians (Mayor + Place 1-6 each, 14 rows)
- [x] 14-02-PLAN.md — Migration 095: Richardson incumbent politicians (Mayor + District 1-4 + Place 5-6, 7 rows, 2-year terms)
- [x] 14-03-PLAN.md — Migration 096: Murphy + Celina + Prosper incumbent politicians (Mayor + Place 1-6 each, 21 rows)

#### Phase 15: Tier 3-4 Officials — Remaining 16 Cities
**Goal**: Incumbent officials for all 16 Tier 3-4 cities are in the database where findable from official city websites or Collin County records
**Depends on**: Phase 14
**Requirements**: OFF-09, OFF-10
**Success Criteria** (what must be TRUE):
  1. All 8 Tier 3 cities (Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville) have at least one politician row in `essentials.politicians`, or are documented as having no findable public roster
  2. All 8 Tier 4 cities (Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge, Copeville) are attempted; sparse results are expected and acceptable
  3. Every politician row that was created has `is_active=true`, `is_incumbent=true`, and a valid `office_id` link
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md — Migration 097: Tier 3 cities (Anna, Fairview, Farmersville, Lavon, Lucas, Melissa, Princeton, Van Alstyne) — 45 seed-now rows + 10 election stubs
- [x] 15-02-PLAN.md — Migration 098: Tier 4 cities (Blue Ridge, Josephine, Lowry Crossing, Nevada, Parker, Saint Paul, Weston) — election stubs + DB gap docs

#### Phase 16: Discovery Jurisdiction Setup ✅ Complete (2026-05-01)
**Goal**: All 23 confirmed-incorporated Collin County cities are registered in the discovery pipeline so the weekly cron will find candidates from collincountytx.gov (Copeville excluded pending incorporation verification; domain corrected from collincountyvotes.gov per phase 16 research)
**Depends on**: Phase 12
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. All 23 cities have rows in `essentials.discovery_jurisdictions` with `source_url` on the city's official elections page and correct Census `jurisdiction_geoid`
  2. Each row has `allowed_domains` containing `{collincountytx.gov, co.collin.tx.us, <city-official-domain>}` (no news, no third-party sources)
  3. A test discovery run triggered for Plano completes without error and produces at least one staged candidate entry with a valid `citation_url` from an allowed domain
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md — Migration 099: 23 Collin County cities seeded into essentials.discovery_jurisdictions (DISC-01, DISC-02)
- [x] 16-02-PLAN.md — Test discovery run for Plano: trigger POST /discover/jurisdiction/:id, verify discovery_runs + candidate_staging rows, human-verify in admin UI (DISC-03)

#### Phase 17: Headshots
**Goal**: Official headshot photos for Tier 1 and Tier 2 politicians are found, correctly resized, and stored in Supabase Storage with politician_images rows
**Depends on**: Phase 14
**Requirements**: HEAD-01, HEAD-02, HEAD-03
**Success Criteria** (what must be TRUE):
  1. All Tier 1 politicians (Plano, McKinney, Allen, Frisco) have a `politician_images` row; each stored image is confirmed at 600×750 pixels in Supabase Storage
  2. Tier 2 politicians (Murphy, Celina, Prosper, Richardson) have headshots uploaded where a public photo exists on the city website or official bio page
  3. Tier 3-4 headshots are attempted; any found are resized and uploaded; cities with no findable photo are noted
  4. No uploaded image has superimposed text, campaign graphics, or banners over the politician's face
**Plans**: 4 plans

Plans:
- [ ] 17-01-PLAN.md — Tier 1 headshots (Plano, McKinney, Allen, Frisco) — required-100% coverage; Frisco via Ballotpedia (CloudFlare bypass)
- [ ] 17-02-PLAN.md — Tier 2 headshots (Murphy, Celina, Prosper, Richardson) — best-effort; Richardson via Ballotpedia (cor.net 403 bypass)
- [ ] 17-03-PLAN.md — Tier 3-4 sweep (15 cities) — 2-source ceiling per politician; sparse coverage expected
- [ ] 17-04-PLAN.md — Phase-wide coverage roll-up + cross-tier sampling + STATE.md update

#### Phase 19: TX Congressional Seats + Geofences
**Goal**: All 38 TX US House members are loaded as NATIONAL_LOWER politician records; TX county geofences (G4020) are loaded into geofence_boundaries; the by-government-list supplemental query is extended to include NATIONAL_LOWER reps via county geofence intersection — so browsing any TX government-list area automatically shows the correct congressional reps.
**Depends on**: Phase 12
**Success Criteria** (what must be TRUE):
  1. All 38 TX US House members exist in `essentials.politicians` with correct `NATIONAL_LOWER` district records and `d.state = 'TX'`
  2. Collin County geofence (geo_id `48085`, MTFCC `G4020`) exists in `essentials.geofence_boundaries` with valid PostGIS geometry
  3. The `by-government-list` supplemental query returns the correct TX congressional reps (TX-3, TX-4, etc.) when browsing Collin County
  4. No regressions — LA County and Indiana browse still return their congressional reps correctly
**Plans**: 5 plans

Plans:
- [x] 19-01-PLAN.md — Load TX congressional district boundaries (G5200) and backfill district_id
- [x] 19-02-PLAN.md — Load Collin County G4020 geofence boundary
- [x] 19-03-PLAN.md — Migration 105: seed 37 TX House politicians + TX-23 vacancy
- [x] 19-04-PLAN.md — Backend: extend getPoliticiansByGovernmentList with countyGeoId PostGIS intersection
- [ ] 19-05-PLAN.md — Frontend: thread browseCountyGeoId from Landing through Results to API + user verify

---

#### Phase 18: Compass Stances
**Goal**: Compass stance data for Plano, McKinney, and Allen council members is ingested into inform.politician_answers so the political compass renders on their profiles
**Depends on**: Phase 13
**Requirements**: COMP-01, COMP-02, COMP-03, COMP-04
**Success Criteria** (what must be TRUE):
  1. `inform.politician_answers` rows exist for Plano council members for all compass topics where a public record stance was found
  2. `inform.politician_answers` rows exist for McKinney council members where public record exists
  3. `inform.politician_answers` rows exist for Allen council members where public record exists
  4. The political compass widget renders without error on the profile page of at least one Plano, one McKinney, and one Allen politician
  5. Frisco, Murphy, Celina, and Richardson stances are ingested where research found viable data; cities with no viable stances are documented as sparse
**Plans**: TBD

Plans:
- [ ] 18-01: TBD

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
| 17. Headshots | v3.0 | 0/4 | Not started | - |
| 18. Compass Stances | v3.0 | 0/TBD | Not started | - |
| 19. TX Congressional Seats + Geofences | v3.0 | 4/5 | In progress | - |
