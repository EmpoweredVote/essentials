---
phase: 98
slug: md-compass-stances-house-delegates-wave-2
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-07
---

# Phase 98 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL migration verification (mcp__supabase-local__execute_sql) |
| **Config file** | none — all verification is DB-query-based |
| **Quick run command** | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id = p.id JOIN essentials.offices o ON o.politician_id = p.id JOIN essentials.districts d ON d.id = o.district_id WHERE d.district_type = 'STATE_LOWER' AND d.state = 'md'` |
| **Full suite command** | Same query, expected count grows per batch |
| **Estimated runtime** | ~5 seconds per query |

---

## Sampling Rate

- **After every task commit:** Run row-count query for the batch just applied
- **After every plan wave:** Verify total MD delegate stance count matches expected cumulative total
- **Before `/gsd-verify-work`:** All 7 migrations applied; compass renders on 3 senators + 3 delegates verified
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 98-01-* | 01 | 1 | MD-STANCES-03 | — | source_url non-null on all rows | db-query | Row count + source_url NOT NULL check | ✅ | ⬜ pending |
| 98-02-* | 02 | 1 | MD-STANCES-03 | — | source_url non-null on all rows | db-query | Cumulative count query | ✅ | ⬜ pending |
| 98-03-* | 03 | 1 | MD-STANCES-03 | — | source_url non-null on all rows | db-query | Cumulative count query | ✅ | ⬜ pending |
| 98-04-* | 04 | 1 | MD-STANCES-03 | — | source_url non-null on all rows | db-query | Cumulative count query | ✅ | ⬜ pending |
| 98-05-* | 05 | 1 | MD-STANCES-03 | — | source_url non-null on all rows | db-query | Cumulative count query | ✅ | ⬜ pending |
| 98-06-* | 06 | 1 | MD-STANCES-03 | — | source_url non-null on all rows | db-query | Cumulative count query | ✅ | ⬜ pending |
| 98-07-* | 07 | 1 | MD-STANCES-04 | — | Compass renders on spot-check profiles | manual | UI spot-check + db-query final count | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test stubs needed — verification is DB-query-based.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Compass renders correctly on delegate profiles | MD-STANCES-04 | UI rendering requires browser | Load 3 delegate profile pages; confirm compass spokes are populated |
| Source URLs are valid (non-404) | MD-STANCES-03 | Link-checking not automated | Spot-check 5 source_url values from the final migration batch |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
