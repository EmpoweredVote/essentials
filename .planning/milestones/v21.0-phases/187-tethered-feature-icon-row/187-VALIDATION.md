---
phase: 187
slug: tethered-feature-icon-row
status: planned
nyquist_compliant: true
wave_0_complete: false  # test files created within plan 187-01 (wave 1)
created: 2026-07-07
---

# Phase 187 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from 187-RESEARCH.md § Validation Architecture (live-API-confirmed).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (`vitest run`, per `package.json` `"test"` script) |
| **Config file** | None dedicated — Vitest runs via Vite's config; no `jsdom`/`@testing-library` in this repo |
| **Quick run command** | `npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js` |
| **Full suite command** | `npm test` (`vitest run` across the whole repo) |
| **Estimated runtime** | ~5–15 seconds (pure-logic tests only) |

**Harness constraint (confirmed by inspection):** this repo's test convention is pure-logic Vitest tests
only — `SectionBanner.test.js` documents "no jsdom, no React render." Component rendering, tooltip
hover/focus behavior, and chip visual legibility are **not** automatable here and must be verified
manually (roadmap marks this phase "UI hint: yes").

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js`
- **After every plan wave:** Run `npm test` (full suite)
- **Before `/gsd:verify-work`:** Full suite must be green **plus** a manual visual-QA pass (tooltip
  hover/focus, chip placement bottom-right, cross-tier click-through)
- **Max feedback latency:** ~15 seconds (automated portion)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (Wave 0) | — | 0 | TETH-02/03/04 | — | N/A | unit | `npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js` | ❌ W0 | ⬜ pending |
| 187-01-T1 | 187-01 | 1 | TETH-02 | — | State resolver returns TX entity; wrong state → null | unit | `npx vitest run src/lib/treasury.test.js` | ❌ W0 | ⬜ pending |
| 187-01-T1 | 187-01 | 1 | TETH-04 | — | Federal resolver returns "United States"; empty list → null | unit | `npx vitest run src/lib/treasury.test.js` | ❌ W0 | ⬜ pending |
| 187-01-T2 | 187-01 | 1 | TETH-03 | — | No matching entity / empty datasets → `null` (icon omitted) | unit | `npx vitest run src/lib/featureIcons.test.js` | ❌ W0 | ⬜ pending |
| 187-01-T1 | 187-01 | 1 | TETH-02 | — | Slug for a real record is `<name>-<state>` lowercase-dash | unit | `npx vitest run src/lib/treasury.test.js` | ✅ extend | ⬜ pending |
| 187-02-T1/T3 | 187-02 | 2 | ICON-01/02/03 | — | Chip renders only for resolved icons; tooltip on hover+focus; bottom-right, no title overlap | manual | N/A (no render harness) | N/A | ⬜ pending |
| 187-02-T2/T3 | 187-02 | 2 | TETH-01 | — | Banner whose location ≠ user's opens a link carrying the **banner's** location | manual | N/A (visual QA, two known-different locations) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky. Concrete task IDs assigned by the planner.*

---

## Wave 0 Requirements

- [ ] `src/lib/featureIcons.test.js` — **new file.** Covers TETH-03 (registry omits products with no
      resolvable per-location link) and the reserved registry ordering (D-01/D-03: Treasury → Compass →
      Read&Rank).
- [ ] Extend `src/lib/treasury.test.js` — add `findStateTreasuryEntity` / `findFederalTreasuryEntity`
      cases using the real Texas / "United States" records captured in RESEARCH.md Code Examples (or a
      minimal synthetic slice mirroring their shape, matching this file's existing convention).
- [ ] No framework install needed — Vitest already configured and running.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chip renders only for resolved icons; correct bottom-right placement; no title overlap | ICON-01, ICON-03 | No component-render harness (no jsdom in repo) | Load `/results` for a location with Treasury data; confirm a single Treasury chip appears bottom-right, does not overlap the bottom-left title, legible on banner art. |
| Tooltip shows on hover AND keyboard focus, names "Treasury Tracker"; `aria-label` present | ICON-02 | Interaction/a11y behavior, not unit-testable here | Hover the chip → tooltip. Tab to the chip → same tooltip on focus. Inspect DOM for `aria-label`. |
| Cross-location tether: banner link carries the banner's own location, not the user's | TETH-01 | Requires two known-different locations in a live session | Set user location to City A, view a banner for City B, click Treasury icon, confirm URL entity = City B (not A). Repeat for a state-tier and (if present) federal-tier banner. |
| Icon absent when no Treasury entity exists — no greyed/dead icon | TETH-03 | Visual absence check | View a banner for a location with no Treasury dataset; confirm zero Treasury chip (not a disabled one). |

---

## Validation Sign-Off

- [ ] All logic tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify (UI-only tasks flagged manual)
- [ ] Wave 0 covers all MISSING references (`featureIcons.test.js` + `treasury.test.js` extensions)
- [ ] No watch-mode flags (`vitest run`, not `vitest`)
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter (after planner assigns concrete task IDs)

**Approval:** planner-assigned (task IDs mapped 2026-07-07; manual-only rows gated by 187-02 Task 3 checkpoint)
