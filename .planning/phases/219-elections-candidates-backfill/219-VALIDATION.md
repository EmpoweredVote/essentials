---
phase: 219
slug: elections-candidates-backfill
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-23
---

# Phase 219 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Data-only phase:** validation is SQL verification against the live essentials DB, not a code test suite.
> Authoritative detail lives in `219-RESEARCH.md` §"Validation Architecture" — this file seeds the sampling contract; `/gsd-verify-work` fleshes it out.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL verification queries (no code test framework — data-only seeding) |
| **Config file** | none — verification is inline SQL run by the operator (gsd-executor has NO Supabase MCP) |
| **Quick run command** | Split-section check + per-government race/candidate count query (see RESEARCH.md §Validation Architecture) |
| **Full suite command** | 23-government coverage sweep: every resolving Collin gov has ≥1 race or a documented legitimate gap; zero-candidate-shell check; split-section check |
| **Estimated runtime** | ~seconds per query (operator-run) |

---

## Sampling Rate

- **After every seeding migration (task commit):** operator runs the per-government race/candidate count query for the cities that migration touched.
- **After every plan wave:** run the split-section SQL check + zero-candidate-shell check across all touched governments.
- **Before `/gsd-verify-work`:** full 23-government coverage sweep must be clean — no split-section defects, no zero-candidate shells masking a real race.
- **Max feedback latency:** one operator SQL round-trip (seconds).

---

## Per-Task Verification Map

> Populated by the planner from PLAN.md tasks. Each seeding task maps to a requirement (COLLIN-ELECT-01/02/03) and an inline SQL verify step the operator runs (gsd-executor cannot query the DB itself).

| Task ID | Plan | Wave | Requirement | Verify Type | Inline SQL Verify | Status |
|---------|------|------|-------------|-------------|-------------------|--------|
| TBD | TBD | TBD | COLLIN-ELECT-0X | SQL count / split-section | `SELECT … WHERE geo_id = …` (per plan) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Confirm the shared `2026-05-02` `elections.id` (and any per-city fallback election rows) exist before races reference them — the SQL to run is in RESEARCH.md.
- [ ] Confirm the current migration-ledger counter in `C:\EV-Accounts` so seeding migrations use the correct next numbers.
- [ ] Probe `essentials.candidate_staging` for existing usable proposals (RESEARCH.md open question #4) — operator runs the provided SQL first.

*Existing schema/tables cover all seeding targets (governments/chambers/offices already seated by Phase 218). No framework install needed — this is data-only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| A resident browsing each of the 23 resolving Collin govs sees their actual current/next municipal race (not an empty Elections section) | COLLIN-ELECT / SC #4 | Renders through `/results` browse-by-government-list; visual confirmation | Browse each seeded government on `/results` and confirm the Elections section shows the seeded races + candidates |
| Legitimately-empty seats (a seat with no election in the reference cycle) are documented, not fabricated | COLLIN-ELECT / D-03 | "No election held" is an evidence judgment, not a query result | Cross-check documented gaps in PLAN/SUMMARY against cited sources |

---

## Validation Sign-Off

- [ ] Every seeding task has an inline SQL verify step (operator-run) or a Wave 0 dependency
- [ ] Sampling continuity: split-section + zero-candidate-shell checks run after each wave
- [ ] Wave 0 confirms shared election row + migration counter + candidate_staging probe
- [ ] 23-government coverage sweep green before `/gsd-verify-work`
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
