# Roadmap: Essentials — Empowered Vote

## Milestones

- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- ✅ **v2.1 Claude Candidate Discovery** — Phases 5-7 (shipped 2026-04-25) — [archive](milestones/v2.1-ROADMAP.md)
- 🚧 **v2.2 Data Depth & Admin Tooling** — Phases 8-11 (in progress)

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

### 🚧 v2.2 Data Depth & Admin Tooling (In Progress)

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
**Plans**: TBD

Plans:
- [ ] 08-01: Jurisdictions panel — GET endpoint + admin UI list with Run Discovery trigger + progress feedback
- [ ] 08-02: Discovery run history dashboard + per-jurisdiction coverage health

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

## Backlog

These are known gaps that are not yet scoped into a milestone.

### Data Gaps (accounts team backlog)

- CA Governor challenger candidates (10 filed, not yet seeded)
- LAUSD sub-district geofences pending
- lavote.gov election ID changes each cycle — mandatory manual update per election cycle

---

## Progress

**Execution Order:**
Phases execute in numeric order: 8 → 9 → 10 → 11

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Left Join + Elections API | v2.0 | 1/1 | Complete | 2026-04-13 |
| 2. Connected User Auto-Load | v2.0 | 1/1 | Complete | 2026-04-13 |
| 3. Elections Page — Full Rendering | v2.0 | 1/1 | Complete | 2026-04-13 |
| 4. Navigation + Discoverability | v2.0 | 1/1 | Complete | 2026-04-13 |
| 5. DB Foundation + Agent Core | v2.1 | 4/4 | Complete | 2026-04-24 |
| 6. Admin Review UI + Email + Per-Race Trigger | v2.1 | 3/3 | Complete | 2026-04-25 |
| 7. Cron Automation + Auto-Upsert | v2.1 | 2/2 | Complete | 2026-04-25 |
| 8. Admin Discovery UI + Dashboard | v2.2 | 0/2 | Not started | - |
| 9. Race Completeness Audit | v2.2 | 0/2 | Not started | - |
| 10. Compass Stances Integration | v2.2 | 0/2 | Not started | - |
| 11. Indiana Local Races | v2.2 | 0/1 | Not started | - |
