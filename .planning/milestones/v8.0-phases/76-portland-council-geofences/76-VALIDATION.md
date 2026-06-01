---
phase: 76
slug: portland-council-geofences
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-29
---

# Phase 76 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom TypeScript smoke tests (no jest/vitest) + SQL verification gates |
| **Config file** | none — scripts run directly with `npx tsx` |
| **Quick run command** | `cd C:/EV-Accounts/backend && npx tsx scripts/smoke-portland-council-geofences.ts` |
| **Full suite command** | Same — smoke test covers all 4 gates |
| **Estimated runtime** | ~15 seconds (smoke test); ~5 seconds (SQL gates inline) |

---

## Sampling Rate

- **After every task commit:** `cd C:/EV-Accounts && npx tsc --noEmit`
- **After every plan wave:** Full smoke test (4 gates)
- **Before `/gsd-verify-work`:** All 4 smoke gates must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 76-01-01 | 01 | 1 | SC-1, SC-2, SC-4 | — | N/A (public city GIS data) | compile | `cd C:/EV-Accounts && npx tsc --noEmit` | ✅ | ⬜ pending |
| 76-01-02 | 01 | 1 | SC-1, SC-2, SC-3, SC-4 | — | N/A | smoke | `npx tsx scripts/smoke-portland-council-geofences.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts` — PortlandMaps ArcGIS per-OBJECTID loader (SC-1)
- [ ] `C:/EV-Accounts/backend/scripts/smoke-portland-council-geofences.ts` — 4-gate smoke test: count, Portland City Hall positive, Salem negative, section-split (SC-2, SC-3, SC-4)
- [ ] `C:/EV-Accounts/backend/migrations/229_portland_council_districts.sql` — 4 essentials.districts rows (SC-1, SC-4)

All 3 files are created as part of Phase 76 execution (Task 1). TypeScript compile check uses pre-existing `C:/EV-Accounts/backend/tsconfig.json`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PortlandMaps ArcGIS returns 4 features per per-OBJECTID loop | SC-1 | Live network; bulk query silently truncates to 3 | Loader logs each OBJECTID fetch result; confirm 4 rows loaded in output |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
