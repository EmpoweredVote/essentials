# Requirements: v9.0 Oregon Legislature Stances

**Milestone:** v9.0  
**Goal:** Research and ingest compass stance values for all 90 OR state legislators (30 senators + 60 house reps), making Oregon the first state with full legislature-wide compass coverage.  
**Status:** Active

---

## Requirements

### Stance Ingestion

- [ ] **STANCE-01**: All 30 OR state senators have compass stance research completed and values ingested into inform.politician_answers (evidence-only, public record citations required)
- [ ] **STANCE-02**: All 60 OR house reps have compass stance research completed and values ingested into inform.politician_answers (evidence-only, public record citations required)
- [ ] **STANCE-03**: All ingested stance values are written to production via a numbered SQL migration (starting at migration 242)
- [ ] **STANCE-04**: The compass renders correctly on at least 3 senator and 3 house rep profile pages without errors (human-verified spot-check)

### Quality Standards

- [ ] **QUALITY-01**: Every ingested stance includes a verifiable citation URL from public record — no stance ingested without evidence
- [ ] **QUALITY-02**: Stance research agents run sequentially (one at a time) — never in parallel — per API rate limit enforcement
- [ ] **QUALITY-03**: Legislators with no discoverable public stance record are documented as not-found; zero stances is acceptable and explicitly not a failure

---

## Future Requirements (Deferred)

These are known needs deferred to subsequent milestones:

- CA state legislature stances (40 senators + 80 assembly members) — v10.0+
- ME state legislature stances (35 senators + 151 house reps) — v10.0+
- TX state legislature stances (31 senators + 150 reps) — future
- Post-June-9 ME primary winners migration (add D primary winners to US Senate / ME-01 / ME-02 general race rows) — handle as a standalone migration when SOS results publish

---

## Out of Scope

- New state geofences or government seeding — strictly a stances milestone
- City council stances for OR cities (Portland council stances completed in v8.0 Phase 80)
- OR state executive stances (Kotek, Rayfield, etc. completed in v8.0 Phase 80)
- Oregon US Senate / US House stances (Wyden, Merkley, Bonamici, etc. completed in v8.0 Phase 80)
- Any frontend UI changes — stance data surfaces automatically on existing profile pages
- ME primary winners migration — explicitly deferred by user on 2026-05-31

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STANCE-01 | Phase 82: OR State Legislature Compass Stances | Pending |
| STANCE-02 | Phase 82: OR State Legislature Compass Stances | Pending |
| STANCE-03 | Phase 82: OR State Legislature Compass Stances | Pending |
| STANCE-04 | Phase 82: OR State Legislature Compass Stances | Pending |
| QUALITY-01 | Phase 82: OR State Legislature Compass Stances | Pending |
| QUALITY-02 | Phase 82: OR State Legislature Compass Stances | Pending |
| QUALITY-03 | Phase 82: OR State Legislature Compass Stances | Pending |

**Coverage:** 7/7 requirements mapped — 100%

---

*Created: 2026-05-31 — v9.0 Oregon Legislature Stances*
*Traceability updated: 2026-05-31 — Phase 82 roadmap defined*
