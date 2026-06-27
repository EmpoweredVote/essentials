---
phase: 172
slug: elections-page-parity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-27
---

# Phase 172 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (present; covers lib units only) + manual/visual (primary, matches 169/170 sign-off) |
| **Config file** | `vite.config.js` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run && npx vite build` |
| **Estimated runtime** | ~12 s (suite + build) |

---

## Sampling Rate

- **After every task commit:** `npx vitest run` (guards lib + prevents regressions)
- **After every plan wave:** `npx vitest run && npx vite build`
- **Before sign-off:** Full suite green + build green + human visual parity check
- **Max feedback latency:** ~12 s

---

## Per-Task Verification Map

> ElectionsView re-theming + banner insertion is inherently visual (no component-render test
> harness is wired — same convention as Phases 169/170). Automated coverage applies to lib-level
> inputs (getBuildingImages) and the build/lint gate; the rest is human visual parity.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (planner fills) | — | — | DARK-03 / BANR-05 | — | N/A | build + visual | `npx vitest run && npx vite build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all automatable phase inputs (vitest + vite build). No Wave 0 framework install needed — visual parity is verified at the human checkpoint.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Elections page renders in the Figma dark treatment matching Results | DARK-03 | Visual fidelity (no screenshot-diff harness) | Toggle dark mode; compare Elections vs Results background/chrome/tiles |
| SectionBanner dividers appear between City→State→Federal on Elections, location-aware + graceful fallback | BANR-05 | Visual + per-jurisdiction | Browse a curated city (banner shows) and an art-less jurisdiction (gradient fallback) |
| Randomized per-session ordering, unopposed / no-candidate states, `elections/me` auto-load preserved | DARK-03 (regression) | Behavioral, session-dependent | Reload (seed persists); view an unopposed race + a no-filings body; Connected auto-load |
| Compass / MiniCompass overlay legible on dark | DARK-03 | Visual legibility | Open Compass on Elections in dark mode; confirm no faint-gray-on-dark |

---

## Validation Sign-Off

- [ ] vitest suite green + `vite build` green after each wave
- [ ] No regression in the 4 preserved Elections behaviors
- [ ] Human visual parity check (Elections vs Results, dark + banners)
- [ ] `nyquist_compliant: true` set when above hold

**Approval:** pending
