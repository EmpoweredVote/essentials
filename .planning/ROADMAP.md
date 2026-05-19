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

## Backlog

These are known gaps that are not yet scoped into a milestone.

### ✅ Phase 48: MA Towns (G4040 COUSUB Boundaries) — COMPLETE 2026-05-18
**Goal**: Load G4040 COUSUB boundaries for all 293 MA towns (Lexington, Concord, Belmont, etc.) so non-city MA residents get a LOCAL boundary row and city officials routing
**Depends on**: Phase 38 (MA TIGER loader established)
**Note**: Cambridge (G4110) and all 57 other MA incorporated cities are already covered. This phase extends coverage to the 293 towns that use G4040 COUSUB instead of G4110 in TIGER.
**Plans**: 2 plans

Plans:
- [x] 48-01-PLAN.md — Add cousub to loader; run load (293 MA towns)
- [x] 48-02-PLAN.md — Verification SQL gates + Lexington/Concord smoke test

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
| 48. MA Towns (G4040 COUSUB) | v5.1+ | 2/2 | Complete | 2026-05-18 |
