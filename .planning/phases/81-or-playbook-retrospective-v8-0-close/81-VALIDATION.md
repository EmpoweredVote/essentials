---
phase: 81
slug: or-playbook-retrospective-v8-0-close
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-30
---

# Phase 81 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — documentation-only phase |
| **Config file** | none |
| **Quick run command** | `grep -c "\[GOTCHA\]" LOCATION-ONBOARDING.md` |
| **Full suite command** | Manual review of LOCATION-ONBOARDING.md OR section |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `grep -c "\[GOTCHA\]" LOCATION-ONBOARDING.md` (count should increase)
- **After every plan wave:** Review OR section completeness manually
- **Before `/gsd-verify-work`:** All success criteria confirmed via grep + file inspection
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 81-01-01 | 01 | 1 | SC-1 | — | N/A | manual | `grep "OR Quick Reference" LOCATION-ONBOARDING.md` | ✅ | ⬜ pending |
| 81-01-02 | 01 | 1 | SC-1 | — | N/A | manual | `grep "ArcGIS MapServer" LOCATION-ONBOARDING.md` | ✅ | ⬜ pending |
| 81-01-03 | 01 | 1 | SC-1 | — | N/A | manual | `grep "charter reform" LOCATION-ONBOARDING.md` | ✅ | ⬜ pending |
| 81-01-04 | 01 | 1 | SC-1 | — | N/A | manual | `grep "char]0x" LOCATION-ONBOARDING.md` | ✅ | ⬜ pending |
| 81-02-01 | 02 | 2 | SC-3 | — | N/A | manual | `grep "v8.0" .planning/ROADMAP.md \| grep -i "shipped\|complete"` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. This is a documentation phase — no test files or framework installation needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| OR Quick Reference block present and accurate | SC-1 | Content review required | Open LOCATION-ONBOARDING.md, find "Oregon Quick Reference", verify 8+ trap rows present |
| All 9 GOTCHAs documented inline | SC-1, SC-2 | Count and content review | Grep for `[GOTCHA]` tags, verify OR-specific ones added |
| Cities Onboarded table updated | SC-2 | Table content review | Find Cities Onboarded table, confirm Oregon (state) and Portland rows |
| v8.0 milestone marked shipped | SC-3 | Multi-file check | Verify ROADMAP.md `🚧` → `✅`, STATE.md updated, PROJECT.md validated list updated |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
