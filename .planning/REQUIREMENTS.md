# Requirements: Essentials — Empowered Vote v2.2

**Defined:** 2026-04-26
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v2.2 Requirements

### AUDIT — Race Completeness Audit

- [ ] **AUDIT-01**: Admin can trigger a race completeness check for a given election that fetches the authoritative candidate list and identifies offices on the official ballot with no matching race row in `essentials.races`
- [ ] **AUDIT-02**: Race completeness results surface missing races (not missing candidates) with the office name and source citation
- [ ] **AUDIT-03**: Admin can see completeness audit output in the admin UI without writing SQL

### ADMUI — Admin Discovery UI

- [ ] **ADMUI-01**: Admin can view all rows in `discovery_jurisdictions` in the admin UI with jurisdiction name, election date, last run status, and last run timestamp
- [ ] **ADMUI-02**: Admin can trigger a discovery run for any jurisdiction from the admin UI via a Run Discovery button (calls existing `POST /api/admin/discover/jurisdiction/:id`)
- [ ] **ADMUI-03**: Admin sees run progress feedback (spinner while lock is held, result when complete)

### DASH — Admin Discovery Dashboard

- [ ] **DASH-01**: Admin can view the full discovery run history across all jurisdictions
- [ ] **DASH-02**: Each run entry shows: jurisdiction name, run date/time, candidates found, candidates staged, candidates auto-upserted, status (success/failed/running)
- [ ] **DASH-03**: Admin can see per-jurisdiction coverage health — total races, races with ≥1 candidate, races with 0 candidates

### STANCE — Compass Stances Integration

- [ ] **STANCE-01**: Each politician in `essentials.politicians` who has a stance research file can be linked to a record in `inform.politicians` (create if not exists)
- [ ] **STANCE-02**: Stance research values (1-5 scale) can be converted and inserted into `inform.politician_answers` for each covered topic
- [ ] **STANCE-03**: The political compass renders correctly for politicians sourced from LA County and Monroe County (not just those with pre-existing `inform.politicians` records)
- [ ] **STANCE-04**: Admin can trigger or run the stance ingestion for a batch of politicians without manual SQL

### INDIANA — Indiana Local Races

- [ ] **INDIANA-01**: Monroe County local races (Commissioner, Clerk, Assessor, and Township races) are seeded into `essentials.races` with correct `election_id` for the May 5, 2026 Indiana Primary
- [ ] **INDIANA-02**: Candidates for Monroe County local races are seeded into `essentials.race_candidates` with designations and source
- [ ] **INDIANA-03**: Monroe County is added to `discovery_jurisdictions` with the county clerk as the `source_url` so the discovery pipeline can keep it current

## Future Requirements

### Deeper compass coverage

- **STANCE-F01**: Candidate stances (race_candidates with no politician_id) can also be represented in the compass via a lightweight profile
- **STANCE-F02**: Stance confidence levels displayed to user ("Based on public statements" vs "Verified questionnaire")

### Race audit automation

- **AUDIT-F01**: Race completeness audit runs automatically as part of the weekly cron sweep, not just on admin demand
- **AUDIT-F02**: Admin receives email when audit detects a missing high-profile race (e.g. citywide Mayor, At-Large Council)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Candidate-level compass scores from discovery agent | Agent output is candidate names/designations only, not policy stances — different source of truth |
| State/federal politician stance ingestion | Existing inform.politicians records already cover these; this milestone is local-only |
| Real-time cron dashboard (websocket) | Polling every 5s on page open is sufficient for admin tool; complexity not justified |
| Avalon/Covina/Pomona/Beverly Hills/Glendale stances | No stance research files exist for these cities yet; out of scope for v2.2 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 9 | Pending |
| AUDIT-02 | Phase 9 | Pending |
| AUDIT-03 | Phase 9 | Pending |
| ADMUI-01 | Phase 8 | Pending |
| ADMUI-02 | Phase 8 | Pending |
| ADMUI-03 | Phase 8 | Pending |
| DASH-01 | Phase 8 | Pending |
| DASH-02 | Phase 8 | Pending |
| DASH-03 | Phase 8 | Pending |
| STANCE-01 | Phase 10 | Pending |
| STANCE-02 | Phase 10 | Pending |
| STANCE-03 | Phase 10 | Pending |
| STANCE-04 | Phase 10 | Pending |
| INDIANA-01 | Phase 11 | Pending |
| INDIANA-02 | Phase 11 | Pending |
| INDIANA-03 | Phase 11 | Pending |

**Coverage:**
- v2.2 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 — traceability filled after v2.2 roadmap creation*
