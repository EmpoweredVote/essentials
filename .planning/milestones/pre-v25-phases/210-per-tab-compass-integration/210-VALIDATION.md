---
phase: 210
slug: per-tab-compass-integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-19
---

# Phase 210 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (existing) |
| **Config file** | vite.config.js (vitest via vite); existing suite in `src/lib/*.test.js` |
| **Quick run command** | `npx vitest run src/lib/compass.test.js` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~2 seconds (203 tests today) |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the touched module (`compass.test.js`) plus `npm run build`.
- **After every plan wave:** Run `npx vitest run` (full suite) + `npm run build`.
- **Before verify/UAT:** Full suite green + `npm run build` exits 0.
- **Max feedback latency:** ~10 seconds.

---

## Per-Task Verification Map

> Populated by the planner/executor with real task IDs. Automatable logic in this
> phase is the **pure** `resolveTabLens()` helper; the per-tab memory effect and
> reset-on-reload are React-runtime behaviors verified via human/UAT (Manual-Only).

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 210-01-xx | 01 | 1 | CMP-01/CMP-02 | T-210-01 (stale ?view= / unresolved lens key) | Unknown/unlit lens key resolves to 'custom'/best-available, never an unresolved key | unit | `npx vitest run src/lib/compass.test.js` | ❌ W0 (add resolveTabLens tests) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/compass.test.js` — add cases for `resolveTabLens(tab, tabLensMemory, lenses, isLensCalibrated)`: Judges→'judicial' when calibrated, Educators→'education' resolving to 'custom' while unlit/absent, Representatives→best-available, explicit-pick precedence, unknown key → 'custom'.

*Existing vitest infrastructure covers the unit surface; only the new pure helper needs test stubs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Switching tabs applies each tab's remembered lens (Judges→Judicial, Educators→best-available, Reps→Best Match) | CMP-01/CMP-02 | React runtime + lens-switcher UI highlight; no headless assertion | On a location with judges, switch Reps→Judges: Judicial chip highlights and judicial spokes render; switch back to Reps: Best Match/prior restored |
| Explicit lens pick overrides + is remembered per tab | CMP-02 | UI interaction + session state | Pick Custom on Judges, leave and return → Judges shows Custom; other tabs unaffected |
| Reset-on-reload (no localStorage) | CMP-02 | Requires full page reload | After picking Custom on Judges, reload → Judges back to Judicial default |
| Educators best-available honest blanks (no educator stance data) | CMP-01 | Depends on live data | Educators tab shows no-stances plate / best-available, never a broken/empty compass |
| No unhighlighted-chip state during fallback | CMP-01 | LensChipRow visual | On a no-judges location with stale `?view=judges`, the resolved tab's chip is highlighted (resolveTabLens → 'custom', not a raw absent key) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify (pure helper) or Manual-Only entry (React/UI behaviors)
- [ ] Sampling continuity: build + compass.test.js after each task
- [ ] Wave 0 covers the new `resolveTabLens` unit tests
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set once Wave 0 test stubs exist

**Approval:** pending
