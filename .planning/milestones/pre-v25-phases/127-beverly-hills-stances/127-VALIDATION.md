---
phase: 127
slug: beverly-hills-stances
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-16
---

# Phase 127 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL verification queries (no automated test framework — stance migration phase) |
| **Config file** | none — queries run inline via psql CLI or mcp__supabase-local |
| **Quick run command** | per-person SQL queries (row count + unpaired + uncited) |
| **Full suite command** | phase-wide Q1–Q5 across all 5 officials |
| **Estimated runtime** | ~5 seconds per SQL query set |

---

## Sampling Rate

- **After every migration applied:** Run per-person Q1 (row count), Q2 (unpaired), Q3 (uncited) — three queries
- **After each plan wave:** Run full phase-wide Q1–Q5 across all 5 officials
- **Before `/gsd:verify-work`:** Full Q1–Q5 must be green + compass render checkpoint
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 127-01-01 | 01 | 0 | BEVHILLS-01 | — | Wave 0 pre-flight confirms UUIDs, migration counter, topic count | SQL | pre-flight Q1–Q8 | ⬜ pending |
| 127-01-02 | 01 | 1 | BEVHILLS-01 | — | Friedman migration: 0 unpaired, 0 uncited, all float literals | SQL | per-person Q1–Q3 | ⬜ pending |
| 127-01-03 | 01 | 1 | BEVHILLS-01 | — | Corman migration: 0 unpaired, 0 uncited | SQL | per-person Q1–Q3 | ⬜ pending |
| 127-02-01 | 02 | 2 | BEVHILLS-01 | — | Mirisch migration: 0 unpaired, 0 uncited | SQL | per-person Q1–Q3 | ⬜ pending |
| 127-02-02 | 02 | 2 | BEVHILLS-01 | — | Nazarian migration: 0 unpaired, 0 uncited | SQL | per-person Q1–Q3 | ⬜ pending |
| 127-02-03 | 02 | 2 | BEVHILLS-01 | — | Wells migration: 0 unpaired, 0 uncited | SQL | per-person Q1–Q3 | ⬜ pending |
| 127-03-01 | 03 | 3 | BEVHILLS-01 | — | Phase-wide Q1–Q5 all green; Fisher has 0 rows; compass renders | SQL | phase-wide Q1–Q5 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test framework installation needed.

Wave 0 pre-flight SQL queries (run before writing any migration):

1. Confirm highest applied integer migration → starting number
2. Confirm 710–713 specifically applied
3. Confirm active topic count = 44
4. Resolve all 5 Beverly Hills target UUIDs
5. Confirm Howard Fisher UUID (exclude from stances)
6. Check for pre-existing BH stance rows (upsert handles them; informational)
7. Confirm Mayor Friedman LOCAL_EXEC district
8. Confirm BH City Council chamber

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compass renders on ≥1 BH official profile | BEVHILLS-01 success criterion 3 | Requires browser + live UI | Navigate to Beverly Hills official profile in Essentials app; confirm compass chart shows at least 1 spoke |

---

## Validation Sign-Off

- [ ] All tasks have SQL verification queries inline
- [ ] Sampling continuity: per-person queries after every migration
- [ ] Wave 0 pre-flight resolves all open assumptions (migration counter, UUIDs, topic count)
- [ ] Phase-wide Q1–Q5 green before marking BEVHILLS-01 closed
- [ ] Fisher exclusion verified (Q5 returns 0)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
