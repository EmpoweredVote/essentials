---
phase: 72
slug: portland-or
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-28
---

# Phase 72 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Custom TypeScript smoke tests (no jest/vitest) + SQL verification gates |
| **Config file** | none — scripts run directly with `npx tsx` |
| **Quick run command** | `cd C:/EV-Accounts/backend && npx tsx scripts/smoke-or-geofences.ts` |
| **Full suite command** | `psql $DATABASE_URL -f scripts/verify-or-tiger-import.sql` |
| **Estimated runtime** | ~30 seconds (SQL gates); ~10 seconds (smoke test) |

---

## Sampling Rate

- **After every task commit:** `cd C:/EV-Accounts && npx tsc --noEmit`
- **After every plan wave:** Full SQL verification gates + smoke test
- **Before `/gsd-verify-work`:** All SQL gates + smoke test must be green
- **Max feedback latency:** ~60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 72-01-01 | 01 | 1 | GEO-OR-01 | — | N/A (public Census data) | compile | `cd C:/EV-Accounts && npx tsc --noEmit` | ✅ | ⬜ pending |
| 72-01-02 | 01 | 1 | GEO-OR-01 | — | N/A | smoke | `npx tsx scripts/smoke-or-geofences.ts` | ❌ W0 | ⬜ pending |
| 72-01-03 | 01 | 1 | GEO-OR-01–06 | — | N/A | sql | `psql $DATABASE_URL -f scripts/verify-or-tiger-import.sql` | ❌ W0 | ⬜ pending |
| 72-01-04 | 01 | 1 | GEO-OR-02–04 | — | N/A | smoke | `npx tsx scripts/smoke-or-geofences.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` — 7-gate SQL verification (GEO-OR-01, GEO-OR-05, GEO-OR-06)
- [ ] `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` — address smoke test for Portland + Bend + Salem (GEO-OR-02, GEO-OR-03, GEO-OR-04)

Both scripts are created as part of Phase 72 execution. TypeScript compile check uses pre-existing `C:/EV-Accounts/backend/tsconfig.json`.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| TIGER ZIP downloads succeed from Census server | GEO-OR-01 | Network-dependent; no mock available | Run loader with `--dry-run` first; confirm all 5 layers download without HTTP errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
