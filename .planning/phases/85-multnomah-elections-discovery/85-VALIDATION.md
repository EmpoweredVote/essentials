---
phase: 85
slug: multnomah-elections-discovery
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-01
---

# Phase 85 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (C:/EV-Accounts/backend/vitest.config.ts) + manual smoke scripts |
| **Config file** | `C:/EV-Accounts/backend/vitest.config.ts` |
| **Quick run command** | `npx tsx scripts/_apply-migration-252.ts` (apply + verify) |
| **Full suite command** | `npx tsx scripts/smoke-multnomah-elections.ts` (races + discovery verification) |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/_apply-migration-251.ts` or `_apply-migration-252.ts` depending on plan
- **After every plan wave:** Run `npx tsx scripts/smoke-multnomah-elections.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 85-01-01 | 01 | 1 | ELECTIONS-01 | — | N/A | smoke/SQL count | Post-verify DO block in migration 251 | ❌ W0 | ⬜ pending |
| 85-01-02 | 01 | 1 | ELECTIONS-02 | — | N/A | smoke/SQL count | Post-verify DO block in migration 251 | ❌ W0 | ⬜ pending |
| 85-02-01 | 02 | 2 | ELECTIONS-03 | — | N/A | smoke/SQL count | Post-verify in migration 252 | ❌ W0 | ⬜ pending |
| 85-02-02 | 02 | 2 | D-14 | — | N/A | smoke | `npx tsx scripts/smoke-multnomah-elections.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-multnomah-elections.ts` — covers ELECTIONS-01/02/03 + D-14 (Multnomah County address returns races)
- [ ] `scripts/_apply-migration-251.ts` — apply script for Plan 01 (race rows)
- [ ] `scripts/_apply-migration-252.ts` — apply script for Plan 02 (discovery jurisdiction)

*These scripts must exist before Plans 01 and 02 can be verified.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Elections page shows Multnomah County races in browser | ELECTIONS-01/02 | UI rendering requires browser + auth | Visit Elections page with unincorporated Multnomah County address (Corbett, OR); confirm county commissioner + city council races appear |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
