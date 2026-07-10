---
phase: 170-section-banners-continuous-scroll-results
plan: "01"
subsystem: frontend-components
tags: [section-banner, dark-mode, figma, reusable-component, vitest]
dependency_graph:
  requires: [169-dark-mode-design-system]
  provides: [SectionBanner component, EYEBROW_TEXT map, FALLBACK_GRADIENTS map]
  affects: [src/pages/Results.jsx (Plan 170-03), src/pages/ElectionsView.jsx (Phase 172)]
tech_stack:
  added: []
  patterns:
    - "full-bleed negative-margin layout (-mx-6 md:-mx-12 with px-6 md:px-12 text re-pad)"
    - "dark-only first-party inline-style component (no ev-ui imports, no !important)"
    - "eslint-disable-next-line react-refresh/only-export-components for constant exports alongside default component"
key_files:
  created:
    - src/components/SectionBanner.jsx
    - src/components/SectionBanner.test.js
  modified: []
decisions:
  - "eslint-disable-next-line used on EYEBROW_TEXT + FALLBACK_GRADIENTS exports — react-refresh rule does not allowConstantExport for object literals alongside a component default export; disable is intentional and scoped to the two constant lines"
  - "JSDoc comment placed before eslint-disable-next-line, not between disable and export, so disable applies to the export line itself"
metrics:
  duration: "~10 minutes"
  completed: "2026-06-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 170 Plan 01: SectionBanner Component Summary

**One-liner:** Reusable dark-band `SectionBanner` component with tier-tinted fallback gradients, coral SVG pin, teal eyebrow, and scaffolding slots — pure-logic unit tests pass.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create SectionBanner component with image + fallback variants | 3a4e32b | src/components/SectionBanner.jsx |
| 2 | Unit-test tier→eyebrow and tier→fallback-gradient maps | 6eebcfe | src/components/SectionBanner.test.js |

## What Was Built

### SectionBanner.jsx

A new first-party React component (no ev-ui imports) that renders a compact full-bleed dark band for any of the three Results tiers (city / state / federal). Key design decisions:

- **Full-bleed layout** via `-mx-6 md:-mx-12 relative overflow-hidden h-[120px] md:h-[180px]` — proven idiom from Results.jsx tier sections.
- **Image variant**: absolutely-positioned `<img>` (objectFit cover, inset 0) plus a mandatory dark gradient overlay (`rgba(13,17,23,0.90)` at bottom → `rgba(13,17,23,0.10)` at top) for guaranteed title legibility.
- **Fallback variant**: tier-tinted dark gradient band when `imageUrl` is null — distinct hue per tier (blue-navy/green-teal/amber-warm) all rooted at `#0d1117`.
- **Eyebrow**: `YOUR CITY` / `YOUR STATE` / `FEDERAL` (D-02) using `var(--color-ev-teal-light)` and `var(--font-display)` Manrope 600 12px uppercase 1.2px tracking.
- **Title**: coral pin SVG (`/images/noun-location-7814384-FF5740.svg`, no CSS filter) + `locationName` in Manrope 700 30px `var(--color-ev-text-primary)`.
- **Scaffolding slots**: `stats` and `featureIcons` props render `sr-only` DOM anchors when non-null — zero visual impact (BANR-04).
- Exports `EYEBROW_TEXT` and `FALLBACK_GRADIENTS` named maps for pure-logic unit testing.

### SectionBanner.test.js

10 vitest assertions covering:
- `EYEBROW_TEXT.city/state/federal` exact string values (D-02 casing)
- `FALLBACK_GRADIENTS` all three tiers defined, mutually distinct, each containing `135deg` and `#0d1117`
- Pure-logic only — no React render, no jsdom (mirrors `groupHierarchy.test.js` pattern)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] eslint-disable needed for `react-refresh/only-export-components`**

- **Found during:** Task 1 — lint verification step
- **Issue:** The `react-refresh/only-export-components` rule (set to `error` with `allowConstantExport: true` in this project) does not allow object literal exports (`{}`) alongside a default component export — only literals, unary expressions, template literals, and binary expressions qualify for `allowConstantExport`. The plan requires both `EYEBROW_TEXT` and `FALLBACK_GRADIENTS` (both objects) to be exported from the same file as the default component.
- **Fix:** Added `// eslint-disable-next-line react-refresh/only-export-components` immediately before each `export const` line. Scoped per-line, not file-wide. The JSDoc comments are placed before the disable directive (not between it and the export).
- **Files modified:** src/components/SectionBanner.jsx
- **Commit:** 3a4e32b (included in Task 1 commit)

## Verification

- `npx eslint src/components/SectionBanner.jsx` → exit 0, no errors or warnings
- `npm test -- src/components/SectionBanner.test.js` → 10/10 assertions pass
- Grep confirms: `EYEBROW_TEXT`, `FALLBACK_GRADIENTS`, `rgba(13,17,23,0.90)`, `noun-location-7814384-FF5740.svg`, `var(--color-ev-teal-light)`, `var(--color-ev-text-primary)`, `-mx-6 md:-mx-12` all present
- Grep confirms: no `boxShadow`, no `filter:` on pin img

## Known Stubs

None — this plan builds the component in isolation with scaffolding slots that render nothing. Slots are intentionally empty; live data wiring is deferred to a follow-up milestone (documented in plan frontmatter as BANR-04 scaffolding).

## Threat Flags

None. `locationName` is React-escaped text (T-170-01 accepted). Scaffolding slots render nothing (T-170-02 accepted).

## Self-Check: PASSED

- [x] `src/components/SectionBanner.jsx` exists (3a4e32b)
- [x] `src/components/SectionBanner.test.js` exists (6eebcfe)
- [x] Both commits confirmed in `git log --oneline`
- [x] All 10 unit tests pass
- [x] ESLint exits 0
