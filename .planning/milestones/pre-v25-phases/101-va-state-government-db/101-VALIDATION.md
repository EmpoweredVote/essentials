---
phase: 101
slug: va-state-government-db
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-08
---

# Phase 101 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Supabase SQL (direct query assertions) |
| **Config file** | none — SQL assertions run via mcp__supabase-local__execute_sql |
| **Quick run command** | `SELECT COUNT(*) FROM governments WHERE state='VA'` |
| **Full suite command** | See Per-Task Verification Map below |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick row-count assertion
- **After every plan wave:** Run full row-count + section-split check
- **Before `/gsd-verify-work`:** All counts verified + section-split returns 0 rows
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 101-01-01 | 01 | 1 | VA-GOV-01 | — | N/A | query | `SELECT COUNT(*) FROM governments WHERE geo_id='51'` | ✅ | ⬜ pending |
| 101-01-02 | 01 | 1 | VA-GOV-01 | — | N/A | query | `SELECT COUNT(*) FROM government_bodies WHERE government_id='bf1095e6-8f88-41cd-b758-23c1ba1297b5'` | ✅ | ⬜ pending |
| 101-02-01 | 02 | 1 | VA-GOV-02 | — | N/A | query | `SELECT COUNT(*) FROM politicians WHERE government_id='bf1095e6-8f88-41cd-b758-23c1ba1297b5' AND district_type='STATE_EXEC'` | ✅ | ⬜ pending |
| 101-03-01 | 03 | 2 | VA-GOV-03 | — | N/A | query | `SELECT COUNT(*) FROM politicians WHERE government_id='bf1095e6-8f88-41cd-b758-23c1ba1297b5' AND district_type='STATE_UPPER'` | ✅ | ⬜ pending |
| 101-04-01 | 04 | 2 | VA-GOV-04 | — | N/A | query | `SELECT COUNT(*) FROM politicians WHERE government_id='bf1095e6-8f88-41cd-b758-23c1ba1297b5' AND district_type='STATE_LOWER'` | ✅ | ⬜ pending |
| 101-04-02 | 04 | 2 | VA-GOV-05 | — | N/A | query | Section-split check: `SELECT ... WHERE ... = 0` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test files needed — all verification is SQL assertions via Supabase MCP.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| HD-20 vacant seat correct | VA-GOV-04 | Requires visual spot-check | Verify `full_name='Vacant', is_active=false, is_vacant=true` for district 51-SLDL-20 |
| Party spot-check HD-31+ | VA-GOV-04 | Individual party assignments not from single source | Spot-check 5 random delegates against elections.virginia.gov |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
