# Roadmap: Essentials — Empowered Vote

## Milestones

- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- 🚧 **v2.1 Claude Candidate Discovery** - Phases 5-7 (in progress)

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

---

### 🚧 v2.1 Claude Candidate Discovery (In Progress)

**Milestone Goal:** Replace manual candidate seeding with a Claude-powered discovery pipeline that scales to any jurisdiction by adding a single config row.

---

#### Phase 5: DB Foundation + Agent Core

**Goal**: A discovery agent can find candidates from official election authority sources, normalize names, score confidence, detect withdrawals, and persist results to a staging table — all triggerable on demand from the command line.

**Depends on**: Phases 1-4 (v2.0 complete)

**Requirements**: REG-01, REG-02, AGENT-01, AGENT-02, AGENT-03, AGENT-04, STAG-01, STAG-03, STAG-04, STAG-05, OBS-01, SCHED-01

**Success Criteria** (what must be TRUE when Phase 5 completes):
  1. Admin can trigger discovery for any registered jurisdiction via `POST /admin/discover/jurisdiction/:id` and receive a 202 response; results appear in `candidate_staging` within seconds
  2. Every staged candidate row has a citation URL linking to an official source page where the candidate name appears verbatim — no citation means no staging entry
  3. Every staged candidate has a confidence label (`official`, `matched`, or `uncertain`) derived from two signals: source domain against the jurisdiction allowlist AND fuzzy match against existing race rows
  4. Candidates currently in `race_candidates` but absent from the agent's discovered list are flagged in staging with reason "no longer appears on official source" — the pipeline is never add-only
  5. Every discovery run produces a row in `discovery_runs` with jurisdiction, timestamp, counts (found / staged / error), status, and raw agent JSONB output for hallucination audit

**Plans**: 4 plans

Plans:
- [x] 05-01: DB migrations — discovery_jurisdictions, candidate_staging, discovery_runs tables
- [x] 05-02: discoveryAgentRunner.ts — Anthropic SDK wrapper with citation-required output schema
- [x] 05-03: discoveryService.ts — orchestration, name normalization, confidence scoring, withdrawal diff, staging writes, run log
- [x] 05-04: SCHED-01 + STAG-04 + STAG-05 — on-demand trigger endpoint + approve/dismiss API endpoints

---

#### ✅ Phase 6: Admin Review UI + Email + Per-Race Trigger

**Goal**: Admin can review, approve, and dismiss staged candidates through a browser UI, receives email when items need attention, and can trigger discovery for individual races.

**Depends on**: Phase 5 (working agent with staging rows to review)

**Requirements**: STAG-06, OBS-02, OBS-03, SCHED-02

**Success Criteria** (what must be TRUE when Phase 6 completes):
  1. Admin can open a review page, see all staged candidates with race context and a clickable source URL, and approve or dismiss each item with a single action — no DB access required
  2. When uncertain candidates are queued after a discovery run, admin receives an email summarizing how many items need review; items for elections within 30 days are visually flagged as urgent in the email subject and body
  3. Admin receives an error email when a discovery run fails or returns zero candidates for a jurisdiction that previously returned non-zero results
  4. Admin can trigger discovery for a single race via `POST /admin/discover/race/:id` and see results appear in the staging queue within seconds

**Plans**: 3 plans

Plans:
- [x] 06-01: Admin staging review UI — extends UnresolvedQueue.jsx pattern; per-item race context, source URL link, approve/dismiss actions
- [x] 06-02: Email notifications — Resend via existing emailService.ts; urgency-aware subject; zero-candidate regression alert
- [x] 06-03: SCHED-02 — per-race on-demand trigger endpoint

---

#### Phase 7: Cron Automation + Auto-Upsert

**Goal**: Discovery runs automatically on a weekly schedule for all registered jurisdictions, and high-confidence candidates are upserted to race_candidates without requiring manual approval.

**Depends on**: Phase 6 (confidence scoring validated against real data via human review)

**Requirements**: STAG-02, SCHED-03

**Success Criteria** (what must be TRUE when Phase 7 completes):
  1. Discovery runs automatically each week for all jurisdictions with elections within 6 months, processing them one at a time — no manual trigger required, no parallel runs
  2. Candidates with `official` or `matched` confidence are automatically upserted to `race_candidates` with admin notified after the fact; only `uncertain` candidates require human approval
  3. Simultaneous cron and manual trigger runs cannot occur — a run lock prevents overlap and the second caller receives a clear "already running" response

**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md — Auto-upsert branch + email-suppress flag in discoveryService.ts
- [ ] 07-02-PLAN.md — discoveryCron.ts (sweep + lock + sweep-summary email), thin cron wrapper, index.ts wiring, route 409 guards

---

---

## Backlog

These are known gaps that are not yet scoped into a milestone. They should inform future milestone planning.

### Race Completeness Audit (high priority)

**Problem:** There is no systematic way to detect missing races. The candidate discovery pipeline finds candidates for races that already exist in `essentials.races`, but does not surface races that are on an official ballot but absent from the DB. Gaps are only discovered by chance (e.g. noticing a high-profile race is missing).

**Why it matters:** An LA Mayor race was missing despite LA City Attorney, LA City Controller, and all City Council districts being present. The only reason it was caught is that a team member lives in LA. There is no visibility into what else might be missing for jurisdictions we are less familiar with.

**What the fix looks like:** A race audit tool that, for a given election, fetches the authoritative candidate filing list (LA City Clerk, California SoS, etc.) and diffs it against `essentials.races` — surfacing offices on the official ballot that have no race row in the DB. This is distinct from candidate discovery; it answers "what races are we missing?" not "what candidates are we missing?"

**Possible implementation:** A new admin endpoint or script that takes an election_id, hits the relevant official source, and returns a list of unregistered races. Could be Claude-powered (same pattern as candidate discovery) or a direct scrape.

---

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 → 7

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Left Join + Elections API | v2.0 | 1/1 | Complete | 2026-04-13 |
| 2. Connected User Auto-Load | v2.0 | 1/1 | Complete | 2026-04-13 |
| 3. Elections Page — Full Rendering | v2.0 | 1/1 | Complete | 2026-04-13 |
| 4. Navigation + Discoverability | v2.0 | 1/1 | Complete | 2026-04-13 |
| 5. DB Foundation + Agent Core | v2.1 | 4/4 | Complete | 2026-04-24 |
| 6. Admin Review UI + Email + Per-Race Trigger | v2.1 | 3/3 | Complete | 2026-04-25 |
| 7. Cron Automation + Auto-Upsert | v2.1 | 0/2 | Not started | - |
