---
phase: 75
slug: or-state-legislature
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 75 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | SQL / Supabase MCP direct queries |
| **Config file** | none — direct DB queries via mcp__supabase-local |
| **Quick run command** | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4110030 AND -4110001` |
| **Full suite command** | Section-split check + politician count + headshot count queries |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run row-count query for inserted politicians
- **After every plan wave:** Run full section-split check + counts
- **Before `/gsd-verify-work`:** All 4 success criteria SQL assertions must pass
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 75-01-01 | 01 | 1 | SC-1 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4110030 AND -4110001` = 30 | ✅ | ⬜ pending |
| 75-01-02 | 01 | 1 | SC-1 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON o.district_id=d.id WHERE d.district_type='STATE_UPPER' AND d.state='or'` = 30 | ✅ | ⬜ pending |
| 75-02-01 | 02 | 2 | SC-2 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4120060 AND -4120001` = 60 | ✅ | ⬜ pending |
| 75-02-02 | 02 | 2 | SC-2 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON o.district_id=d.id WHERE d.district_type='STATE_LOWER' AND d.state='or'` = 60 | ✅ | ⬜ pending |
| 75-03-01 | 03 | 3 | SC-3 | — | N/A | sql | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON pi.politician_id=p.id WHERE p.external_id BETWEEN -4120060 AND -4110001` = 90 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — DB migration pattern well-established from Phases 52, 61, 73, 74.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OR address lookup returns correct state senator + house rep | SC-4 | Requires live app routing test with OR address | POST /candidates/search with OR street address; verify state senator + house rep in response |
| Section-split check returns 0 rows | SC-1/2 | DB integrity check | Run section-split SQL from project docs after each migration |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
