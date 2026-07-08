---
phase: 169-dark-mode-design-system-foundation
plan: 02
subsystem: ui
tags: [tailwind, css-overrides, dark-mode, ev-ui, results, filterbar, inline-literals, design-system]

# Dependency graph
requires:
  - phase: 169-01
    provides: "@theme dark token VALUES (#0d1117/#161b22/#00c8d7/#e6edf3/#8b949e) + --font-display (Manrope) token registered"
provides:
  - ".dark .ev-* override blocks in index.css repointed to Figma GitHub-dark palette (#161b22 surface, #00c8d7 accent, #8b949e muted)"
  - "ev-ui header child hooks (.dark .ev-header-secondary/nav/mobile-menu) added for correct dark text colors"
  - "Results.jsx dark-side inline literals swept: compassBg, card bg/border, MiniCompass overlays, tier eyebrows, treasury link"
  - "Tier eyebrow labels get Manrope D-06 type treatment (font-display 600 uppercase 1.2px letter-spacing) in dark mode"
  - "FilterBar.jsx minimal dark re-theme (dark ternary branches only; light side + 44px geometry preserved)"
  - "Faint-gray-on-dark eliminated: tab-inactive dark:text-gray-500 lifted to dark:text-[#8b949e]"
  - "Manual visual sign-off: all 6 Figma dark match checks passed; light-mode no-regression confirmed"
affects: [170, 171, 172]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ev-ui !important override spine: .dark .ev-<component> { property: value !important } — mandatory because ev-ui ships inline styles"
    - "Dark-only ternary swap: change isDark ? <dark-value> : <light-value> — ONLY the dark branch, never the light branch (D-03)"
    - "Header child text hooks via class selectors (.ev-header-secondary etc.) because <header> root has no class; bg is owned by Layout style prop"
    - "D-06 eyebrow type via inline fontFamily/fontWeight/textTransform/letterSpacing on dark branch of tier eyebrow labels"

key-files:
  created: []
  modified:
    - src/index.css
    - src/components/FilterBar.jsx
    - src/pages/Results.jsx

key-decisions:
  - "FilterBar remaining #59b0c4 in light-side ternary branch is correct — it is the light-mode active border (light teal #59b0c4) which must NOT be changed per D-03; only the dark branch was swapped to #00c8d7"
  - "dark:text-gray-500 faint-gray lifted to dark:text-[#8b949e] (the muted token floor) on tab-inactive labels — dark:text-gray-400 on empty-state also lifted"
  - "Task 3 manual-visual sign-off accepted as human 'approved' — all 6 VALIDATION.md checks confirmed passed by the human reviewer"

patterns-established:
  - "ev-ui dark override spine: only add !important overrides for dark theme; never add box-shadow to dark overrides (GitHub-dark = hairlines, no shadows)"
  - "Light ternary branch preservation: when sweeping dark-side literals, always check isDark ? [dark] : [light] and leave the light branch verbatim"

requirements-completed: [DARK-02]

# Metrics
duration: ~25min
completed: 2026-06-24
---

# Phase 169 Plan 02: Dark-Mode Design System Foundation Summary

**Results + global header chrome now render in the Figma GitHub-dark treatment via ev-ui !important overrides, swept inline literals, and Manrope D-06 eyebrow type — human visual sign-off confirmed, light mode unchanged**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-24 (continuation agent)
- **Completed:** 2026-06-24
- **Tasks:** 3 (Task 1 = auto, Task 2 = auto, Task 3 = manual-visual checkpoint — human approved)
- **Files modified:** 3

## Accomplishments

- Repointed all in-scope `.dark .ev-*` override blocks in `index.css` to the Figma GitHub-dark palette: PoliticianCard surface #161b22, hover #21262d, h3 #e6edf3, p #8b949e; gov-body-section eyebrow #00c8d7 with D-06 Manrope 600 uppercase 1.2px type treatment
- Added header child text hooks (`.dark .ev-header-secondary`, `.dark .ev-header-nav`, `.dark .ev-header-mobile-menu { color: #e6edf3 !important }`) — ev-ui hardcodes the old palette internally so these overrides are required
- Swept Results.jsx dark-side inline literals: compassBg, card bg (#161b22) + border (#2d3748), MiniCompass overlays, tier eyebrow color (#00c8d7 + Manrope D-06 style), treasury link dark:text-[#00c8d7]; lifted tab-inactive faint-gray (dark:text-gray-500 → dark:text-[#8b949e]) and empty-state dark:text-gray-400
- Applied FilterBar.jsx minimal dark re-theme (D-09): swapped all dark-side ternary values (#1a2235→#161b22, #59b0c4→#00c8d7, #d1d5db→#8b949e, #2d3f5a→#2d3748) while preserving light branches and all 44px geometry
- Human visual sign-off (Task 3): all 6 checks in 169-VALIDATION.md passed — Figma dark match, header chrome, ev-ui sections/cards, no faint-gray-on-dark, PoliticianCard 4:5 geometry unchanged, light-mode no-regression

## Task Commits

1. **Task 1: Repoint .dark .ev-* overrides + header child text to new palette** - `3d74064` (feat)
2. **Task 2: Sweep Results.jsx inline literals + eyebrow type, minimal FilterBar dark re-theme** - `3145099` (feat)
3. **Task 3: Manual-visual verification** — human approved; all 6 checks passed (no code commit — checkpoint only)

## Files Created/Modified

- `src/index.css` — `.dark .ev-politician-card` block repointed; gov-body-section eyebrow + D-06 type; `.dark .ev-header-secondary/nav/mobile-menu` added; light `html:not(.dark)` WCAG blocks and `@source not` lines preserved verbatim
- `src/pages/Results.jsx` — dark-side inline literals swept to new palette; D-06 eyebrow type applied; faint-gray tab-inactive + empty-state lifted to #8b949e floor; light branches untouched
- `src/components/FilterBar.jsx` — dark-side ternary branches updated across Dropdown + main palette vars + checkbox accentColor + option bg; light side + 44px touch targets unchanged

## Decisions Made

- **FilterBar remaining #59b0c4:** The one remaining `#59b0c4` in FilterBar.jsx is the light-mode active border color in an `isDark ? '#00c8d7' : '#59b0c4'` ternary — this is correct and intentional. The light teal `#59b0c4` must not be changed (D-03 rule). Only the dark branch was swapped.
- **D-06 eyebrow type via inline style:** Applied `fontFamily: 'var(--font-display)'`, `fontWeight: 600`, `textTransform: 'uppercase'`, `letterSpacing: '1.2px'` directly on the dark-branch tier eyebrow style object in Results.jsx, consistent with existing pattern of inline style objects.
- **Task 3 verification evidence:** The human reviewer replied "approved" after visual review of the running app in dark mode against the Figma reference (node 3957:563). All 6 checks in 169-VALIDATION.md passed.

## Deviations from Plan

None — plan executed exactly as written. The one source assertion that appeared to fail (`grep -c '#59b0c4' src/components/FilterBar.jsx` = 1 instead of 0) is a correct outcome: the remaining instance is the light-side ternary branch that must be preserved per D-03. The plan's acceptance criterion was written for the dark-side literal (which is gone); the light-side branch is intended to survive.

## Issues Encountered

None. Both auto-tasks built clean. The FilterBar `#59b0c4` light-branch confusion was resolved by reading the actual line in context — it is correct behavior.

## User Setup Required

None — no external service configuration required.

## Known Stubs

None. All dark-mode surfaces in scope are wired to real palette values; no placeholder colors or hardcoded fallbacks that flow to UI rendering.

## Threat Flags

None. This plan made client-side CSS/JSX theming changes only. No new network endpoints, auth paths, file access patterns, or schema changes. The only correctness risk (light-mode regression) was mitigated by D-03 (light ternary branch preservation) and confirmed by the Task 3 human visual sign-off.

## Next Phase Readiness

- Phase 169 is fully complete (both plans done, DARK-01 + DARK-02 satisfied)
- Phase 170 (Section Banners & Continuous Scroll) can begin — it depends on Phase 169 tokens being live, which they now are
- The `--font-display` (Manrope) and dark palette tokens are available as Tailwind utilities for Phase 170 `SectionBanner` component

## Self-Check: PASSED

- `src/index.css` exists and contains `.dark .ev-politician-card` blocks (grep: 4 matches) — FOUND
- `src/index.css` contains `.ev-header-secondary` header child override (grep: 3 matches including nav/mobile-menu) — FOUND
- `src/pages/Results.jsx` contains `#00c8d7` (3 matches) and `#161b22` (2 matches) — FOUND
- `src/pages/Results.jsx` contains 0 instances of `#1a2235` or `#59b0c4` (old dark literals) — CLEAN
- `src/components/FilterBar.jsx` contains 0 instances of `#1a2235` (old dark surface) — CLEAN
- `src/components/Layout.jsx` contains `#0d1117` (1 match) and 0 instances of `#020618` — FOUND/CLEAN
- `html:not(.dark)` preserved in index.css (3 matches) — PRESERVED
- `@source not` preserved in index.css (2 matches) — PRESERVED
- `dark:text-gray-500` lifted from Results.jsx (0 matches) — LIFTED
- Commits 3d74064 and 3145099 exist in git log — CONFIRMED
- `npm run build` exits 0 — CONFIRMED

---
*Phase: 169-dark-mode-design-system-foundation*
*Completed: 2026-06-24*
