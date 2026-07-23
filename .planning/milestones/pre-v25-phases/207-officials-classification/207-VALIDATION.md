---
phase: 207
slug: officials-classification
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-17
---

# Phase 207 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.4 |
| **Config file** | none — `package.json` `"test": "vitest run"` (no separate `vitest.config.*` in repo root) |
| **Quick run command** | `npx vitest run src/lib/classify.test.js -t classifyBucket` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~3-8 seconds (single test file quick run; low-single-digit seconds full suite) |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/classify.test.js`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 207-01-01 | 01 | 1 | CLASS-01 | T-207-01 | Null/missing-field rows return 'representative' without throwing (render never breaks) | unit | `npx vitest run src/lib/classify.test.js -t classifyBucket` | ❌ W0 (this task creates the classifyBucket block) | ⬜ pending |
| 207-01-02 | 01 | 1 | CLASS-01 | T-207-02 | Whitelist + additive-only overrides never misfile Attorney General / City Attorney / non-education superintendent | unit | `npx vitest run src/lib/classify.test.js -t classifyBucket` | ✅ (created in 207-01-01) | ⬜ pending |
| 207-01-03 | 01 | 1 | CLASS-01 (SC-05) | T-207-02 | Cross-location real-data fixtures (LA / Bloomington IN / AZ city + DC SBOE + SF DA) bucket correctly | unit (data-fixture) | `npm test` | ❌ W0 (this task adds the live-fixtures block) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/classify.test.js` — new `describe('classifyBucket', ...)` edge-case block (Task 207-01-01, RED-first)
- [ ] `src/lib/classify.test.js` — new `describe('classifyBucket — live location fixtures (SC-05)', ...)` block (Task 207-01-03)
- No framework/config install needed — Vitest is already configured and running.

*The test scaffold is authored inside this plan (Task 01 = RED-first). No pre-existing classifyBucket coverage exists, so Task 01 IS the Wave 0 scaffold; `wave_0_complete` flips true once that task lands.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| (optional, non-blocking) Live production spot check | CLASS-01 (SC-05) | Confirms the copied fixture field values still match live data | Read-only: run `classifyBucket` against production API rows for one location via the `?browse_geo_id=…&browse_mtfcc=…` flow; record observed bucket counts in the SUMMARY. NOT a gate — the automated live-fixtures test is the gate. No DB writes. |

*All Phase-207 gating behaviors have automated verification; the live spot check is confidence-only.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (all 3 tasks have automated vitest verify)
- [x] Wave 0 covers all MISSING references (classifyBucket test blocks authored in Task 01 / Task 03)
- [x] No watch-mode flags (`vitest run`, not watch)
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-07-17
