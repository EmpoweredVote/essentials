---
phase: 86
slug: multnomah-county-school-districts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-01
---

# Phase 86 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke test script (ts-node) |
| **Config file** | C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts (analog) |
| **Quick run command** | `npx ts-node scripts/smoke-phase86.ts` |
| **Full suite command** | `npx ts-node scripts/smoke-phase86.ts` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx ts-node scripts/smoke-phase86.ts`
- **After every plan wave:** Run `npx ts-node scripts/smoke-phase86.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 86-01-01 | 01 | 1 | OR-SCHOOL-01 | — | N/A | smoke | `npx ts-node scripts/load-or-school-boundaries.ts --dry-run` | ❌ W0 | ⬜ pending |
| 86-01-02 | 01 | 1 | OR-SCHOOL-01 | — | N/A | sql-check | `psql: SELECT count(*) FROM geofence_boundaries WHERE mtfcc='G5420' AND state='41'` | ✅ | ⬜ pending |
| 86-01-03 | 01 | 1 | OR-SCHOOL-02 | — | N/A | sql-check | `psql: SELECT count(*) FROM essentials.governments WHERE ...` | ✅ | ⬜ pending |
| 86-01-04 | 01 | 1 | OR-SCHOOL-03 | — | N/A | smoke | `npx ts-node scripts/smoke-phase86.ts` | ❌ W0 | ⬜ pending |
| 86-02-01 | 02 | 2 | OR-SCHOOL-04 | — | N/A | manual | Review migration 254 SQL documents all 38 officials | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-phase86.ts` — smoke test verifying PPS address lookup returns school board members

*Smoke test copies from `smoke-multnomah-county.ts` with school board assertions added.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshots render at 600×750 in UI | OR-SCHOOL-04 | Visual verification required | Load a PPS board member profile; inspect politician_images rows |
| Riverdale included if TIGER has it | OR-SCHOOL-01 | Conditional on TIGER data | Confirmed: Riverdale GEOID=4110560 is in TIGER; include all 6 districts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
