---
phase: 169
slug: dark-mode-design-system-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-24
---

# Phase 169 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Phase nature:** CSS/design-token + theming work. Per RESEARCH.md, there is NO CSS/component
> render harness in this repo (Vitest is logic-only: `src/lib/*.test.js`) and none should be built
> for this phase. Validation is therefore **build-gated + regression-gated + manual-visual**, mapping
> 1:1 to the 5 ROADMAP success criteria. This is the honest, realistic contract for token/CSS work.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (logic-only; no DOM/CSS render harness) + `npm run build` (Tailwind v4 compile) |
| **Config file** | vite.config / vitest config (existing); `src/index.css` is the Tailwind v4 token source |
| **Quick run command** | `npm run build` (catches Tailwind `@theme` / `@source` compile breakage) |
| **Full suite command** | `npm run build && npm run test` (build + existing logic regression) |
| **Estimated runtime** | ~30–60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (token/CSS changes must always still compile —
  the `@source not` hardening + `@theme` block are build-fragile).
- **After every plan wave:** Run `npm run build && npm run test`.
- **Before `/gsd:verify-work`:** Build green, existing tests green, manual visual checklist below complete.
- **Max feedback latency:** ~60 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| {tokens} | 01 | 1 | DARK-01 | — | N/A (no auth/data) | build | `npm run build` | ✅ | ⬜ pending |
| {fonts}  | 01 | 1 | DARK-01 | — | N/A | build | `npm run build` | ✅ | ⬜ pending |
| {results+header theming} | — | 2 | DARK-02 | — | N/A | build+manual | `npm run build` + visual checklist | ✅ | ⬜ pending |
| {regression} | — | 2 | DARK-01/02 | — | N/A | regression | `npm run test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Plan/Task IDs finalized by the planner.*

---

## Wave 0 Requirements

- [ ] No new test framework needed — `npm run build` + existing Vitest logic suite cover automated gating.
- [ ] If fonts are self-hosted: `@fontsource/inter` + `@fontsource/manrope` installed (verify exact
      package names on npm at install time — RESEARCH flagged these as `[ASSUMED]`; CDN `@import` is the
      known-working fallback).

*A CSS/component render harness is intentionally NOT built for this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Results in dark mode reads as the Figma style-guide treatment (page `#0d1117`, card `#161b22`, header chrome, section areas, tiles) | DARK-02 (SC#1) | No visual render harness; cinematic/visual fidelity is human-judged | Run app, toggle dark mode, open Results — compare against `scratchpad/figma/essentials-design.png` |
| No faint-gray-on-dark; muted text bottoms out at `#8b949e` and stays legible | DARK-02 (SC#1) | Contrast legibility is visual | Inspect muted/secondary text on `#0d1117`/`#161b22`; confirm readable |
| Color/type/spacing on Results trace to `index.css` tokens (no scattered inline literals) | DARK-01/02 (SC#2) | Source-structure assertion | Grep Results.jsx for the migrated hex literals (`#1a2235`,`#59b0c4`,`#f3f4f6`,`#d1d5db`,`#020618`) → should be gone / token-driven |
| ev-ui `GovernmentBodySection`/`SubGroupSection`/`Header` display correctly on dark via `!important` (no light bleed) | DARK-02 (SC#3) | ev-ui inline styles; visual | Inspect section headers + global header in dark — no light-mode color bleed |
| `PoliticianCard` 4:5 tile unchanged in shape/size (re-color only) | DARK-02 (SC#4) | Visual + layout | Compare tile dimensions/aspect before vs after; only colors differ |
| **Light mode renders unchanged (no regression)** | DARK-01 (SC#5) | The core risk of a global token change | Toggle to light mode on Results + Landing + a profile page; confirm identical to pre-change; confirm light teal `#00657c` / `--ev-light-blue` untouched |

---

## Validation Sign-Off

- [ ] `npm run build` green (Tailwind `@theme` + `@source` compile intact)
- [ ] `npm run test` green (existing logic regression unaffected)
- [ ] All 6 manual visual checks above pass (esp. light-mode no-regression — SC#5)
- [ ] No light-mode token value changed (only dark values; names preserved)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
