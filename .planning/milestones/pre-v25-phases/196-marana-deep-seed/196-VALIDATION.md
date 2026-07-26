---
phase: 196
slug: marana-deep-seed
status: approved
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-15
---

> **Plan-checker disposition (2026-07-15):** Plans 196-01..04 verified — every non-checkpoint task carries a fast automated `<automated>` verify (grep/psql, no watch-mode), every migration has a BLOCKING apply-and-row-assert checkpoint, no unresolved Wave-0/MISSING references. The Per-Task Verification Map below is representative; execute-phase tracks the concrete 11-task status.

# Phase 196 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — data-seeding phase; verification is SQL row-assertion + asset property checks |
| **Config file** | none |
| **Quick run command** | inline `psql` / Supabase MCP `execute_sql` row-count assertions |
| **Full suite command** | full DB-verify block (governments/chamber/district/officials/images/stances) + banner ratio + coverage grep |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task's inline DB-verify assertion (row exists / count matches)
- **After every plan wave:** Run the full DB-verify block for rows created so far
- **Before `/gsd:verify-work`:** All row assertions green, headshots 600×750, banner 3.15:1, coverage chip present
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 196-01-XX | 01 | 1 | SUB-02 | — | N/A | db-assert | inline `psql`/MCP row-count | ❌ W0 | ⬜ pending |
| 196-01-XX | 01 | 1 | BANR-01 | — | N/A | asset-check | image dimension/ratio check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky · Planner to expand rows per task.*

---

## Wave 0 Requirements

- [ ] Confirm Marana TIGER place geo_id `0444270` resolves before seeding (Phase 190 dependency)
- [ ] Confirm 0 pre-existing `essentials.governments` rows for Marana (greenfield idempotency)

*Data-seeding phase — no test framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Roster currency (2026 primary July 21) | SUB-02 | Live election window — DB cannot assert "current" | BLOCKING re-verify roster against marana.gov before apply |
| Banner licensing + no-Catalinas/no-aerial | BANR-01 | License + visual-identity judgment | Human review of candidate photo + attribution before wiring |
| Headshot crop quality (eyes ~1/3, no distortion) | SUB-02 | Visual judgment | Human/QA-artifact review of 600×750 crops |

---

## Validation Sign-Off

- [ ] All tasks have inline DB-assert verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers geo_id + greenfield pre-checks
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-15 (plan-checker VERIFICATION PASSED)
