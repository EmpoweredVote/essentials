---
phase: 125
slug: ma-tier-3-playbook-retrospective
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-06-15
---

# Phase 125 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — documentation-only phase |
| **Config file** | none |
| **Quick run command** | `grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md` |
| **Full suite command** | see Manual-Only Verifications below |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md`
- **After every plan wave:** Run full grep verification suite (see Manual-Only Verifications)
- **Before `/gsd:verify-work`:** Full grep suite must pass
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 125-01-01 | 01 | 1 | MA-RETRO-02 | — | N/A | manual | `grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md` >= 8 | ✅ | ⬜ pending |
| 125-01-02 | 01 | 1 | MA-RETRO-02 | — | N/A | manual | `grep -c "2026-06-1[4-5].*MA" LOCATION-ONBOARDING.md` >= 7 | ✅ | ⬜ pending |
| 125-02-01 | 02 | 2 | MA-RETRO-02 | — | N/A | manual | `grep "v14.0.*shipped\|v14.0.*complete" .planning/ROADMAP.md` | ✅ | ⬜ pending |
| 125-02-02 | 02 | 2 | MA-RETRO-02 | — | N/A | manual | `grep -c "\[x\]" .planning/REQUIREMENTS.md` == 22 | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing infrastructure covers all phase requirements. Documentation-only phase; no test framework installation needed.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LOCATION-ONBOARDING.md has 3+ new MA Tier 3 GOTCHAs | MA-RETRO-02 | grep count check on STATE-SPECIFIC: MA markers | `grep -c "STATE-SPECIFIC: MA" LOCATION-ONBOARDING.md` should be ≥ 8 (5 baseline from Phase 116 + 3 new) |
| 7 new city rows added to Cities Onboarded table | MA-RETRO-02 | grep count on 2026-06-14/15 MA rows | `grep -c "2026-06-1[4-5].*MA" LOCATION-ONBOARDING.md` should be ≥ 7 |
| v14.0 marked complete in ROADMAP.md | MA-RETRO-02 | string search | `grep "v14.0" .planning/ROADMAP.md` shows ✅ or "shipped" |
| v14.0 milestone marked complete in STATE.md | MA-RETRO-02 | string search | `grep "v14.0" .planning/STATE.md` shows complete status |
| All 22 v14.0 reqs marked complete in REQUIREMENTS.md | MA-RETRO-02 | checkbox count | `grep -c "\[x\]" .planning/REQUIREMENTS.md` == 22 |

---

## Validation Sign-Off

- [x] All tasks have grep verify gates or Manual-Only entries
- [x] Sampling continuity: documentation-only phase; all verification is deterministic grep
- [x] Wave 0 not needed (no test stubs required)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
