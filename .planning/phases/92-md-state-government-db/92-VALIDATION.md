---
phase: 92
slug: md-state-government-db
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-05
---

# Phase 92 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL assertions via mcp__supabase-local__execute_sql |
| **Config file** | none — validation is live DB queries |
| **Quick run command** | `SELECT COUNT(*) FROM essentials.governments WHERE name='State of Maryland'` |
| **Full suite command** | See Per-Task Verification Map below |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick DB count query for the inserted rows
- **After every plan wave:** Run full verification queries covering all 5 chambers + 5 politicians + 5 headshots
- **Before `/gsd-verify-work`:** All verification queries must return expected counts
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|--------|
| 92-01-01 | 01 | 1 | MD-GOV-01 | — | N/A | sql-assert | `SELECT COUNT(*) FROM essentials.governments WHERE name='State of Maryland' AND geo_id='24'` — expect 1 | ⬜ pending |
| 92-01-02 | 01 | 1 | MD-GOV-01 | — | N/A | sql-assert | `SELECT COUNT(*) FROM essentials.chambers c JOIN essentials.governments g ON g.id=c.government_id WHERE g.name='State of Maryland'` — expect 5 | ⬜ pending |
| 92-01-03 | 01 | 1 | MD-GOV-01 | — | N/A | sql-assert | `SELECT COUNT(*) FROM essentials.districts WHERE district_type='STATE_EXEC' AND state='MD'` — expect 5 | ⬜ pending |
| 92-02-01 | 02 | 2 | MD-GOV-02 | — | N/A | sql-assert | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -240005 AND -240001` — expect 5 | ⬜ pending |
| 92-02-02 | 02 | 2 | MD-GOV-02 | — | N/A | sql-assert | `SELECT COUNT(*) FROM essentials.offices WHERE representing_state='MD'` — expect 5 | ⬜ pending |
| 92-02-03 | 02 | 2 | MD-GOV-06 | — | N/A | sql-assert | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -240005 AND -240001` — expect 5 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements (pure SQL migration — no test framework setup needed).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshots display correctly at 600×750 in the UI | MD-GOV-06 | Visual verification of crop, aspect ratio, and image quality | Load each politician's profile page and confirm photo renders without distortion |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
