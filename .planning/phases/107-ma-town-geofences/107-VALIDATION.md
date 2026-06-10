---
phase: 107
slug: ma-town-geofences
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-06-10
---

# Phase 107 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | npx tsx (TypeScript + pg direct) |
| **Config file** | none — scripts run directly |
| **Quick run command** | `npx tsx scripts/smoke-ma-towns.ts` |
| **Full suite command** | `psql $DATABASE_URL -f scripts/verify-ma-tiger-import.sql` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/smoke-ma-towns.ts`
- **After every plan wave:** Run `psql $DATABASE_URL -f scripts/verify-ma-tiger-import.sql`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 107-01-01 | 01 | 1 | MA-GEO-01 | T-107-01 | Loader not invoked; read-only DB assertions only | verification SQL | `psql $DATABASE_URL -f scripts/verify-ma-tiger-import.sql` | ✅ | ⬜ pending |
| 107-01-02 | 01 | 1 | MA-GEO-01 | T-107-02 | PIP query uses bound params, not interpolation | smoke | `npx tsx scripts/smoke-ma-towns.ts` | ✅ | ⬜ pending |
| 107-01-03 | 01 | 1 | MA-GEO-02 | T-107-01 | Section-split check (geofence NOT IN districts) returns 0 | inline | inline npx tsx SELECT query | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements — no new test files needed.

- ✅ `C:/EV-Accounts/backend/scripts/smoke-ma-towns.ts` — PIP routing for Lexington, Concord, Cambridge exclusion
- ✅ `C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql` — MACOUSUB-01..06 SQL gates

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (no new artifacts needed)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
