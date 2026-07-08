---
phase: 189
slug: smart-banner-integration-graceful-degradation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-08
---

# Phase 189 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing) |
| **Config file** | `vite.config.js` (vitest config) — already present |
| **Quick run command** | `npx vitest run src/lib/bannerProps.test.js src/components/SectionBanner.test.js` |
| **Full suite command** | `npm test` (`vitest run`) |
| **Estimated runtime** | ~10 seconds (full suite: 10 files / ~109 tests baseline) |

---

## Sampling Rate

- **After every task commit:** Run the quick command for the touched unit.
- **After every plan wave:** Run `npm test` (full suite).
- **Before `/gsd:verify-work`:** Full suite green + the D-04 live no-data spot-check.
- **Max feedback latency:** ~10 seconds.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 189-01-xx | 01 | 1 | SBAN-03 | — | `buildBannerProps(tier, ctx)` returns identical props for a given tier+ctx regardless of caller | unit | `npx vitest run src/lib/bannerProps.test.js` | ❌ W0 | ⬜ pending |
| 189-01-xx | 01 | 1 | SBAN-04 | T-189-01 | `shouldRenderStat` / `shouldRenderIcons` omit blocks for null/0/NaN/empty | unit | `npx vitest run src/components/SectionBanner.test.js` | ✅ | ⬜ pending |
| 189-02-xx | 02 | 2 | SBAN-01, SBAN-02 | — | Both Results + ElectionsView render all 3 tiers via `buildBannerProps` (no page-specific branch) | unit+lint | `npm run lint && npm test` | ✅ | ⬜ pending |
| 189-02-xx | 02 | 2 | SBAN-01 | — | D-05 reposition: stat renders mid-left, no title/icon collision at 120px & 180px | manual | live spot-check (see below) | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/bannerProps.test.js` — new; unit tests for `buildBannerProps(tier, ctx)` (fixture-injected, no real bundle) covering all 3 tiers + the `locationName` fold-in.
- [ ] (Optional, research-recommended) extract + test `shouldRenderIcons(featureIcons)` in `SectionBanner.test.js`.

*vitest is already installed and configured — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| D-05 mid-left placement + no collision, both breakpoints, both pages | SBAN-01/02 | Visual layout over a banner image | Load a covered city on Results and Elections at 390px & 1280px; confirm the POPULATION scrim floats mid-left (desktop) / upper-left (mobile), left-aligned to the title, clear of title + feature-icon row. |
| SBAN-04 empty-state parity | SBAN-04 | v19.0 visual parity of a no-data banner | Load a city-tier location that resolves NEITHER a population nor any feature icon (Open Question: identify one — Federal always resolves both); confirm title + art only, no empty scrim/row, zero console errors. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (`bannerProps.test.js`)
- [ ] No watch-mode flags (use `vitest run`, not `vitest`)
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
