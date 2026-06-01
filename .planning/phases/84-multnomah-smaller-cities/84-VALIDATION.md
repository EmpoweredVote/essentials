---
phase: 84
slug: multnomah-smaller-cities
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-31
---

# Phase 84 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript smoke test via `npx tsx` |
| **Config file** | none — ad hoc script per phase |
| **Quick run command** | `npx tsx scripts/smoke-multnomah-cities.ts` |
| **Full suite command** | `npx tsx scripts/smoke-multnomah-cities.ts` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/smoke-multnomah-cities.ts`
- **After every plan wave:** Run `npx tsx scripts/smoke-multnomah-cities.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 84-01-01 | 01 | 1 | CITIES-01..05 | — | N/A | smoke | `npx tsx scripts/smoke-multnomah-cities.ts` | ❌ W0 | ⬜ pending |
| 84-01-02 | 01 | 1 | CITIES-01..05 | — | N/A | smoke | same | ❌ W0 | ⬜ pending |
| 84-02-01 | 02 | 2 | CITIES-06 | — | N/A | manual | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts` — covers CITIES-01..05; follows smoke-multnomah-county.ts structure with 5 city test coordinates

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Headshots visible at 600×750 in politician_images | CITIES-06 | Upload requires Python script + Supabase Storage API; no automated assertion exists | After Plan 2 upload script runs, query `SELECT count(*) FROM essentials.politician_images WHERE type='default'` for each official by external_id range |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
