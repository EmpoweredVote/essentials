# Requirements: Essentials — v2.1 Claude Candidate Discovery

**Defined:** 2026-04-23
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v2.1 Requirements

Requirements for the Claude Candidate Discovery milestone. Builds on the elections infrastructure shipped in v2.0.

### Registry

- [ ] **REG-01**: Jurisdiction registry table stores geo_id, election-specific authority URLs, official domain allowlist for confidence scoring, and office types to track per jurisdiction
- [ ] **REG-02**: Adding a jurisdiction row with URLs is sufficient to make a city discoverable and schedulable — no code change required

### Agent Core

- [ ] **AGENT-01**: Discovery agent, given a jurisdiction, returns a structured list of races and candidates with a citation URL per candidate (source page must contain candidate name verbatim — hallucination prevention)
- [ ] **AGENT-02**: Agent applies canonical name normalization (first + last, title case, no middle initials or suffixes) before returning results — deduplication linchpin
- [ ] **AGENT-03**: Agent assigns a confidence level per candidate: `official` (source domain in jurisdiction allowlist), `matched` (candidate name + office cleanly matches existing race in DB), or `uncertain` (neither condition met)
- [ ] **AGENT-04**: Agent diffs discovered candidates against current DB state per race and flags removals (withdrawn candidates) for admin review — not an add-only pipeline

### Staging Queue

- [ ] **STAG-01**: Every discovered candidate lands in a `candidate_staging` table first — never written directly to `race_candidates`
- [ ] **STAG-02**: High-confidence candidates (`official` OR `matched`) are auto-upserted to `race_candidates` and admin is notified after the fact
- [ ] **STAG-03**: `uncertain` candidates remain in staging and require explicit admin action before going live
- [ ] **STAG-04**: Admin can approve a staged candidate via API endpoint (triggers upsert to `race_candidates`)
- [ ] **STAG-05**: Admin can dismiss a staged candidate via API endpoint with a reason recorded
- [ ] **STAG-06**: Admin can view and action staged candidates via a review UI (extending the existing UnresolvedQueue.jsx pattern in the frontend)

### Scheduling

- [ ] **SCHED-01**: Admin can trigger discovery for an entire jurisdiction on-demand via `POST /admin/discover/jurisdiction/:id`
- [ ] **SCHED-02**: Admin can trigger discovery for a single race on-demand via `POST /admin/discover/race/:id`
- [ ] **SCHED-03**: Weekly cron runs discovery for all jurisdictions with elections within 6 months, processing jurisdictions sequentially (never parallel — rate limit constraint)

### Observability

- [ ] **OBS-01**: Every discovery run is logged to a `discovery_runs` table (jurisdiction, timestamp, candidates found, auto-upserted count, staged count, error count, status)
- [ ] **OBS-02**: Admin receives email when uncertain candidates are queued for review (urgency-aware — elections within 30 days flagged as urgent)
- [ ] **OBS-03**: Admin receives email when a discovery run fails or returns unexpectedly zero results for a known-active race

## Future Requirements

### v2.2 — Proximity-Aware Scheduling

- **SCHED-F01**: Cron runs daily (not weekly) once past filing deadline and within 30 days of an election date
- **SCHED-F02**: Proximity cadence is configurable per jurisdiction (some filing windows are longer)

### v2.2 — Indiana Local Races

- **SCALE-F01**: Indiana local races (Monroe County Commissioner, Clerk, Assessor, Township) discovered from county clerk site (`co.monroe.in.us`) — IN SoS Excel download covers state+federal only
- **SCALE-F02**: Jurisdiction registry supports a separate `local_races_source` field for jurisdictions where local and state/federal data live at different URLs

### v2.2 — Admin Dashboard

- **OBS-F01**: Admin can see discovery run history with per-run stats (not just email summaries)
- **OBS-F02**: Admin can see coverage health per jurisdiction: races tracked, candidates found, last run, next scheduled run

## Out of Scope

| Feature | Reason |
|---------|--------|
| CAL-ACCESS bulk download integration | Tab-delimited daily dumps require join logic across multiple tables; web search agent covers the same data more simply for v2.1 |
| Fully automated upsert with no staging | Too risky for civic data before confidence scoring is validated against real election data |
| Indiana local races (v2.1) | County clerk sites require separate `local_races_source` field and strategy — scoped to v2.2 |
| Proximity-aware daily cron | Flat weekly cadence sufficient for v2.1; proximity logic is a v2.2 differentiator |
| Parallel jurisdiction processing | Explicitly excluded — exhausts Claude API rate limit quota with no usable output |
| Third-party civic data API fallback | Cicero handles incumbents; Claude web search handles challengers; no additional paid APIs in v2.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| REG-01 | Phase 5 | Pending |
| REG-02 | Phase 5 | Pending |
| AGENT-01 | Phase 5 | Pending |
| AGENT-02 | Phase 5 | Pending |
| AGENT-03 | Phase 5 | Pending |
| AGENT-04 | Phase 5 | Pending |
| STAG-01 | Phase 5 | Pending |
| STAG-02 | Phase 7 | Pending |
| STAG-03 | Phase 5 | Pending |
| STAG-04 | Phase 5 | Pending |
| STAG-05 | Phase 5 | Pending |
| STAG-06 | Phase 6 | Pending |
| SCHED-01 | Phase 5 | Pending |
| SCHED-02 | Phase 6 | Pending |
| SCHED-03 | Phase 7 | Pending |
| OBS-01 | Phase 5 | Pending |
| OBS-02 | Phase 6 | Pending |
| OBS-03 | Phase 6 | Pending |

**Coverage:**
- v2.1 requirements: 18 total
- Mapped to phases: 18/18 ✓
- Unmapped: 0

---
*Requirements defined: 2026-04-23*
*Last updated: 2026-04-23 — traceability filled after roadmap creation*
