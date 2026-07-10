---
phase: 169-dark-mode-design-system-foundation
plan: 01
subsystem: ui
tags: [tailwind, css-tokens, dark-mode, fontsource, inter, manrope, design-system]

# Dependency graph
requires: []
provides:
  - "@theme dark token VALUES reconciled to Figma GitHub-dark palette in src/index.css"
  - "--color-ev-navy #0d1117, --color-ev-navy-card #161b22, --color-ev-teal-light #00c8d7"
  - "--color-ev-text-primary #e6edf3, --color-ev-text-muted #8b949e (new D-02 tokens)"
  - "--color-ev-slate #2d3748, --color-ev-slate-strong #4a5568 (new divider tokens)"
  - "--font-sans (Inter) and --font-display (Manrope) type tokens registered in @theme"
  - "Self-hosted Inter 400/600 + Manrope 600/700 via @fontsource in main.jsx"
  - "Global app default font switched to var(--font-sans) = Inter"
  - "Layout.jsx header backgroundColor updated to #0d1117 (was #020618)"
  - "Light-mode :root block unchanged (D-03 preserved)"
affects: [169-02, 170, 171, 172]

# Tech tracking
tech-stack:
  added:
    - "@fontsource/inter@5.2.8 (self-hosted Inter font, weights 400+600)"
    - "@fontsource/manrope@5.2.8 (self-hosted Manrope font, weights 600+700)"
  patterns:
    - "Keep-names/change-values: @theme token names unchanged, only dark VALUES updated"
    - "Self-host via @fontsource side-effect imports in main.jsx (mirrors existing index.css import shape)"
    - "Tailwind v4 --font-* namespace for type tokens (generates font-sans/font-display utilities)"

key-files:
  created: []
  modified:
    - src/index.css
    - src/main.jsx
    - src/components/Layout.jsx
    - package.json
    - package-lock.json

key-decisions:
  - "Self-host path chosen for Inter+Manrope via @fontsource (over CDN); removes Google Fonts runtime network dependency"
  - "getFeedbackUrl inlined in Layout.jsx as a local constant (local ev-ui build 0.7.2 predates the 0.9.5 export; unblocks build without ev-ui repo change)"
  - "--color-ev-navy-elevated set to #21262d (GitHub canvas.subtle, resolves RESEARCH Open Q1)"

patterns-established:
  - "Dark @theme token pattern: token NAMES preserved; only VALUES change when Figma palette updates"
  - "@fontsource side-effect import in main.jsx for self-hosted fonts (Inter/Manrope weight-specific CSS)"
  - "getFeedbackUrl local inline for ev-ui version delta resilience"

requirements-completed: [DARK-01]

# Metrics
duration: 8min
completed: 2026-06-24
---

# Phase 169 Plan 01: Dark-Mode Design System Foundation Summary

**GitHub-dark token palette (#0d1117/#161b22/#00c8d7/#e6edf3/#8b949e) wired as single source of truth in @theme; Inter+Manrope self-hosted via @fontsource and registered as --font-sans/--font-display type tokens**

## Performance

- **Duration:** 8 min
- **Started:** 2026-06-24T23:33:44Z
- **Completed:** 2026-06-24T23:41:08Z
- **Tasks:** 3 (Task 1 = pre-approved checkpoint, Tasks 2+3 = auto)
- **Files modified:** 5

## Accomplishments

- Reconciled all five dark @theme color token VALUES to the Figma GitHub-dark palette while preserving all token names (D-01 single source of truth)
- Added six new tokens: --color-ev-text-primary, --color-ev-text-muted, --color-ev-slate, --color-ev-slate-strong, --font-sans, --font-display
- Self-hosted Inter (400/600) + Manrope (600/700) via @fontsource, eliminated Google Fonts CDN runtime dependency, switched global default to var(--font-sans) = Inter
- Light mode completely untouched: --ev-teal #00657c, --ev-light-blue #59b0c4, and all :root vars verified unchanged; @source-not build-safety lines preserved

## Task Commits

1. **Task 1: Font legitimacy gate** - Pre-approved by orchestrator (npm view confirmed @fontsource/inter@5.2.8 + @fontsource/manrope@5.2.8 on registry); self-host path selected
2. **Task 2: @theme dark token reconciliation** - `f2c6825` (feat)
3. **Task 3: Self-host fonts + global default switch** - `8686339` (feat)

## Files Created/Modified

- `src/index.css` - @theme dark VALUES updated; new D-02 text/slate/font tokens added; Google Fonts @import removed; global font-family switched to var(--font-sans)
- `src/main.jsx` - Added @fontsource side-effect imports for Inter 400/600 + Manrope 600/700
- `src/components/Layout.jsx` - getFeedbackUrl inlined (Rule 3 fix); header backgroundColor #020618→#0d1117
- `package.json` / `package-lock.json` - @fontsource/inter + @fontsource/manrope added as dependencies

## Decisions Made

- **Self-host path:** @fontsource packages confirmed legitimate (5.2.8, github.com/fontsource/fontsource, millions of downloads). Self-host chosen over CDN for performance/offline-resilience/privacy.
- **--color-ev-navy-elevated:** Set to #21262d (GitHub canvas.subtle) — resolves RESEARCH Open Q1 with a value that stays in the GitHub-dark family and provides subtle hover depth.
- **getFeedbackUrl inlined:** Local ev-ui build at ../ev-ui is version 0.7.2; npm package is 0.9.5. Rather than updating the local build (outside this phase's scope), inlined the trivial URL function to unblock the build without touching ev-ui.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing build failure: getFeedbackUrl not in local ev-ui dist**
- **Found during:** Task 2 verification (npm run build)
- **Issue:** Layout.jsx imported `getFeedbackUrl` from `@empoweredvote/ev-ui`, but vite.config.js aliases the package to `../ev-ui/dist` (the local build at version 0.7.2). That build predates the 0.9.5 export. Build was already failing before any changes in this plan.
- **Fix:** Inlined `const getFeedbackUrl = () => "https://empowered.vote/feedback";` in Layout.jsx; removed the named import from ev-ui. Preserves correct behavior (the default URL was the only call site).
- **Files modified:** `src/components/Layout.jsx`
- **Verification:** `npm run build` exits 0 after fix
- **Committed in:** f2c6825 (Task 2 commit, bundled as part of Layout.jsx header bg update)

**2. [Rule 1 - Bug] Header backgroundColor updated alongside @theme reconciliation**
- **Found during:** Task 2 (PATTERNS.md specifies header bg as part of the dark palette update)
- **Issue:** Layout.jsx had `backgroundColor: '#020618'` in the Header `style` prop — the old dark page bg. This would leave the header mismatched against the new #0d1117 page background.
- **Fix:** Updated to `backgroundColor: '#0d1117'` in the isDark conditional. PATTERNS.md identifies this as the one-line value swap for the header chrome.
- **Files modified:** `src/components/Layout.jsx`
- **Verification:** Visual alignment with PATTERNS.md spec; build green
- **Committed in:** f2c6825 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking pre-existing, 1 bug in scope)
**Impact on plan:** Both fixes necessary for correct operation. No scope creep. Build was broken before this plan; fixing it was required to execute any verification.

## Issues Encountered

- Local ev-ui build (../ev-ui/dist) is version 0.7.2 vs npm package 0.9.5. The vite.config.js local-build alias causes Rollup to use the local dist, which is missing the `getFeedbackUrl` export. This is a project carry-forward issue; the local build needs updating to 0.9.5 when the next ev-ui deploy happens. Inlining the URL is a safe short-term fix.

## Known Stubs

None. This plan establishes token values and font loading only — no UI rendering, no data paths, no placeholder content.

## Threat Flags

None. This is a CSS token + font-loading change only. No new network endpoints, auth paths, file access patterns, or schema changes. The @fontsource packages were verified on npm before install (Task 1 gate).

## Next Phase Readiness

- Phase 169-02 (Results re-theme) can now consume all dark tokens as Tailwind utilities (`bg-ev-navy`, `text-ev-teal-light`, `font-sans`, `font-display`, etc.) and CSS vars (`var(--color-ev-navy)`, `var(--color-ev-text-primary)`, etc.)
- The `--color-ev-text-muted` floor (#8b949e) and `--color-ev-slate` dividers are ready for use on Results surfaces
- All existing dark-mode override blocks in index.css that use old hex literals (#1a2235, #59b0c4, etc.) remain to be updated in Plan 02 (Results re-theme)

## Self-Check: PASSED

- `src/index.css` exists and contains `--color-ev-navy: #0d1117` (verified)
- `src/main.jsx` contains @fontsource imports (verified)
- `src/components/Layout.jsx` contains inlined getFeedbackUrl (verified)
- Commits f2c6825 and 8686339 exist in git log (verified)
- npm run build exits 0 (verified)

---
*Phase: 169-dark-mode-design-system-foundation*
*Completed: 2026-06-24*
