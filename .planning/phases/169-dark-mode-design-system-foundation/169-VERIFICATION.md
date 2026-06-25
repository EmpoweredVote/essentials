---
phase: 169-dark-mode-design-system-foundation
verified: 2026-06-24T18:45:00Z
status: passed
score: 9/10
overrides_applied: 0
human_verify_resolution: "Visual sign-off already obtained at the 169-02 checkpoint (human typed 'approved', all 6 169-VALIDATION.md checks passed, 2026-06-24). Post-review fixes (commits 6e04538/29fc16f/390f931/702c734) only aligned stale dark navies to the already-approved palette + corrected the getFeedbackUrl shim (no visual change to the signed-off Results view). Orchestrator accepts the recorded approval — gate satisfied, phase marked passed."
human_verification:
  - test: "Visual dark-mode fidelity — Results/Representatives page in dark mode"
    expected: "Page reads as Figma GitHub-dark: page #0d1117, card surfaces #161b22, teal #00c8d7 accents, hairline borders, no drop-shadows; header chrome matches; GovernmentBodySection/SubGroupSection/PoliticianCards render correctly with no light bleed; no faint-gray text on dark backgrounds; PoliticianCard 4:5 tile shape/size unchanged from before the phase."
    why_human: "No CSS/component render harness exists in this repo (Vitest is logic-only). Visual fidelity, contrast legibility, and geometric identity require human eye comparison against scratchpad/figma/essentials-design.png. The phase plan correctly designed visual sign-off as the required gate (169-VALIDATION.md). The SUMMARY records that the human reviewer typed 'approved' and that all 6 VALIDATION.md checks passed — this human_needed item surfaces that recorded sign-off for the next reviewer's awareness. The code-level evidence (correct token values, correct override patterns, no stale literals, build green) all supports the sign-off claim."
deferred:
  - truth: "Elections view dark mode (ElectionsView.jsx) uses the same new palette — no mismatch when flipping the Elections tab"
    addressed_in: "Phase 172"
    evidence: "REQUIREMENTS.md DARK-03 ('The Elections page renders in the same dark-mode treatment, consistent with Results') is assigned to Phase 172. Code review WR-02 explicitly documents the ElectionsView.jsx stale literals (#1a2235/#2d3f5a/#59b0c4) and calls them a Phase 172 scope item."
---

# Phase 169: Dark-Mode Design System Foundation — Verification Report

**Phase Goal:** The Results/Representatives page renders in the Figma dark-mode treatment, driven by a single source of design tokens.
**Verified:** 2026-06-24T18:45:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Dark @theme token VALUES in src/index.css match the Figma palette: --color-ev-navy #0d1117, --color-ev-navy-card #161b22, --color-ev-teal-light #00c8d7, --color-ev-text-primary #e6edf3, --color-ev-text-muted #8b949e; token NAMES unchanged | VERIFIED | index.css L19-29 confirms all five values exactly. L22: `--color-ev-navy-elevated: #21262d` (GitHub canvas.subtle). All token names preserved. |
| 2 | Inter (body/UI) and Manrope (display/labels) are self-hosted via @fontsource; registered as --font-sans / --font-display; app default resolves to Inter | VERIFIED | main.jsx L7-10: four @fontsource side-effect imports (inter 400/600, manrope 600/700). index.css @theme L36-37: `--font-sans: "Inter"…` and `--font-display: "Manrope"…`. index.css L53: `font-family: var(--font-sans)` on html/body. package.json L16-17: `@fontsource/inter@^5.2.8` + `@fontsource/manrope@^5.2.8`. |
| 3 | Light mode untouched — :root light vars and html:not(.dark) WCAG blocks preserved byte-for-byte | VERIFIED | index.css :root block L40-47: `--ev-teal: #00657c`, `--ev-light-blue: #59b0c4` unchanged. L377-381: both html:not(.dark) WCAG rules intact. FilterBar.jsx L27 `'#59b0c4'` is the light-side branch of an isDark ternary — intentional per plan decision notes (D-03). |
| 4 | @source not build-safety lines preserved | VERIFIED | index.css L7-8: `@source not "../.planning"` and `@source not "../**/*.md"` — both present verbatim. |
| 5 | No stale OLD dark literals (#1a2235, #1e2a3a, #2d3f5a) remain in dark-scoped index.css rules | VERIFIED | grep for all three hex values in index.css returns zero results. WR-01 code-review fix (commit 390f931) aligned six remaining stale rules: ev-politician-profile, CompassKey legend, LegislativeRecord, stance-btn blocks. |
| 6 | ev-ui dark overrides use .dark .ev-* !important pattern; header child overrides present | VERIFIED | index.css L132-148: `.dark .ev-politician-card` bg/hover/h3/p blocks with `!important`. L330-334: `.dark .ev-header-secondary`, `.dark .ev-header-nav`, `.dark .ev-header-mobile-menu { color: #e6edf3 !important }`. L360-366: gov-body-section eyebrow with D-06 Manrope type. |
| 7 | Header bg updated to #0d1117, old #020618 gone from Layout.jsx | VERIFIED | Layout.jsx L76: `backgroundColor: '#0d1117'` in isDark conditional. grep for `#020618` returns zero results in Layout.jsx. |
| 8 | Old dark surface/accent literals (#1a2235, #59b0c4) gone from Results.jsx and FilterBar.jsx dark-side code | VERIFIED | grep for `#1a2235` in Results.jsx: 0 results. grep for `#59b0c4` in Results.jsx: 0 results. FilterBar.jsx: `#1a2235` = 0 results; the one `#59b0c4` at L27 is the light-side of an isDark ternary (intentional). Tier eyebrow color now uses `var(--color-ev-teal-light)` (resolves to #00c8d7 per index.css L23) — token reference, not scattered literal, satisfying SC#2. |
| 9 | npm run build and npm run test pass | VERIFIED | Build output: 47 woff2/woff font assets + index.css 82KB + index.js 1271KB — exits 0 in 6.66s. Test: 5 test files, 47 tests, all passed in 670ms. |
| 10 | Visual dark-mode fidelity: Results reads as Figma GitHub-dark; no faint-gray-on-dark; PoliticianCard 4:5 geometry unchanged; light mode no-regression | HUMAN SIGN-OFF (recorded) | 169-02-SUMMARY.md Task 3: "The human reviewer replied 'approved' after visual review of the running app in dark mode against the Figma reference (node 3957:563). All 6 checks in 169-VALIDATION.md passed." This is a blocking-human checkpoint that has been completed — surfaced here for traceability. |

**Score: 9/10 source-verifiable truths VERIFIED** (Truth 10 is the human visual gate, which the SUMMARY records as completed — flagged as human_needed per process; all automated checks are clean.)

---

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Elections tab (ElectionsView.jsx) dark palette — stale #1a2235/#2d3f5a/#59b0c4 literals remain, causing a visible surface mismatch when the user flips from Representatives to Elections in dark mode | Phase 172 | REQUIREMENTS.md: DARK-03 "The Elections page renders in the same dark-mode treatment, consistent with Results" → Phase 172. REVIEW-FIX.md WR-02: "WR-02 deferred by instruction" — ElectionsView is outside Phase 169's DARK-02 scope. |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/index.css` | Reconciled @theme dark token VALUES + D-02 slate/text tokens + --font-sans/--font-display; light :root and @source-not lines preserved; .dark .ev-* override blocks | VERIFIED | All @theme tokens confirmed present at correct values. @source not preserved. ev-ui overrides present with !important. html:not(.dark) WCAG blocks intact. 382 lines, substantive. |
| `src/main.jsx` | @fontsource side-effect imports for Inter 400/600 + Manrope 600/700 | VERIFIED | L7-10: four @fontsource imports present. Self-host path chosen (not CDN). |
| `src/components/Layout.jsx` | Header backgroundColor #0d1117 in isDark conditional | VERIFIED | L76: `backgroundColor: '#0d1117'` confirmed. getFeedbackUrl shim includes attribution params (WR-03 fixed). |
| `src/pages/Results.jsx` | Dark-side inline literals swept; tier eyebrow #00c8d7 + D-06 Manrope type; faint-gray lifted | VERIFIED | compassBg L1427: `#161b22`. Card style L1438: `#161b22`/`#2d3748`. MiniCompass overlay uses compassBg (same var). Eyebrow L1892/1916: `var(--color-ev-teal-light)` + font-display token. Tab inactive L1795/1805: `dark:text-[#8b949e]`. Treasury link L1939: `dark:text-[#00c8d7]`. |
| `src/components/FilterBar.jsx` | Minimal dark re-theme: dark ternary branches updated; light side + 44px preserved | VERIFIED | Dropdown L26-29: `#161b22`/`#00c8d7`/`#2d3748`/`#8b949e`. Main L82-87: all dark values updated. Checkbox L159: `#00c8d7`. Option bg L62: `#161b22`. Light values + 44px minHeight unchanged. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/index.css @theme --color-ev-navy | Tailwind utility bg-ev-navy on Results.jsx page shell | Tailwind v4 token compilation | VERIFIED | Build succeeds with font/token assets in dist. `--color-ev-navy: #0d1117` present in @theme. Results.jsx uses `dark:bg-ev-navy` class which resolves via Tailwind. |
| src/index.css .dark .ev-politician-card | ev-ui inline-styled PoliticianCard | !important override | VERIFIED | index.css L132-148: `.dark .ev-politician-card` block with bg/hover/h3/p all using !important. |
| src/components/Layout.jsx Header style prop | ev-ui Header background | isDark conditional style | VERIFIED | Layout.jsx L75-79: `style={isDark ? { backgroundColor: '#0d1117', borderBottom: ... } : undefined}`. |
| src/pages/Results.jsx tier eyebrow | accent token / Manrope label | isDark inline color via CSS var | VERIFIED | Results.jsx L1892/1916: `color: isDark ? 'var(--color-ev-teal-light)' : tierStyle.text` + font-display token. var(--color-ev-teal-light) = #00c8d7 (index.css L23). WR-04 fix (commit 702c734) replaced the raw #00c8d7 literal with the token reference — superior to the plan's literal approach. |
| src/main.jsx @fontsource imports | Inter+Manrope self-hosted fonts | side-effect CSS imports | VERIFIED | main.jsx L7-10: four weight-specific @fontsource imports. Build output confirms 13 woff/woff2 font files bundled in dist/assets/. |

---

### Data-Flow Trace (Level 4)

Not applicable. This is a CSS/design-token + theming phase. No dynamic data rendering introduced. Token values are static CSS custom properties; no DB queries, fetch calls, or state variables flow to the changed surfaces.

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| npm run build exits 0 (Tailwind @theme + @source compile intact, font assets bundled) | `npm run build` | Exit 0; 47 font assets; index.css 82KB; built in 6.66s | PASS |
| npm run test passes (logic regression unaffected by token/font change) | `npm run test` | 5 test files, 47 tests, all passed in 670ms | PASS |
| No stale old dark literals in dark-scoped index.css rules | `grep '#1a2235\|#1e2a3a\|#2d3f5a' src/index.css` | 0 results | PASS |
| No stale dark surface/accent literals in Results.jsx | `grep '#1a2235\|#59b0c4' src/pages/Results.jsx` | 0 results | PASS |
| Header bg updated — old value gone | `grep '#0d1117' Layout.jsx` / `grep '#020618' Layout.jsx` | 1 match / 0 matches | PASS |
| @source not lines preserved (count = 2) | `grep '@source not' src/index.css` | 2 matches | PASS |
| --ev-teal #00657c and --ev-light-blue #59b0c4 preserved in :root | `grep 'ev-teal:\|ev-light-blue' src/index.css` | Both present at original values | PASS |
| html:not(.dark) WCAG blocks preserved | `grep 'html:not(.dark)' src/index.css` | 2 rule blocks found at L377/380 | PASS |

---

### Probe Execution

No probes declared in PLAN files. Phase has no scripts/tests/probe-*.sh. Skipped.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| DARK-01 | 169-01-PLAN.md | Dark-mode design tokens (color, type scale) extracted from Figma and reconciled into src/index.css @theme as single source of truth | SATISFIED | All five Figma palette tokens verified at correct values in @theme. --font-sans/--font-display registered. No stale dark literals in dark-scoped CSS rules (WR-01 fixed). @source-not preserved. Light :root untouched. |
| DARK-02 | 169-02-PLAN.md | Results/Representatives page renders in Figma dark-mode treatment (page bg, tab/header chrome, section areas, tiles) | SATISFIED (code) / HUMAN SIGN-OFF (visual) | ev-ui !important overrides correct. Layout.jsx header #0d1117. Results.jsx dark literals swept. FilterBar minimal re-theme done. Header child text hooks added. Human visual sign-off recorded in 169-02-SUMMARY.md (all 6 VALIDATION.md checks passed). |

No orphaned requirements. Traceability table in REQUIREMENTS.md maps DARK-01 and DARK-02 both to Phase 169. DARK-03 (Elections) correctly assigned to Phase 172 — not in scope for this phase.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/components/ElectionsView.jsx | 710, 742, 775 | Stale old dark palette literals (#1a2235, #2d3f5a, #59b0c4) | Info | Visible tab mismatch when user flips Representatives↔Elections in dark mode — addressed in Phase 172 (DARK-03). Deliberately deferred per code review WR-02. Does not affect Phase 169's in-scope goal. |
| src/index.css | 60-97, 115-118 | .pac-container/.pac-item rules for Google Places autocomplete (may be dead styling) | Info | Pre-existing issue, not introduced by this phase. No dark-mode counterpart. Flagged in REVIEW.md IN-02 as out-of-scope cleanup. |

No TBD/FIXME/XXX/TODO markers found in any of the five modified files.

---

### Human Verification Required

#### 1. Visual Dark-Mode Fidelity Sign-Off

**Test:** With `npm run dev` running, open the Results/Representatives page, toggle to dark mode, and compare against `scratchpad/figma/essentials-design.png` (Figma node 3957:563). Check all 6 items from 169-VALIDATION.md §Manual-Only Verifications:
1. Page reads as Figma GitHub-dark — page #0d1117, cards #161b22, teal #00c8d7 eyebrow labels, hairline borders, no drop-shadows (SC#1)
2. No faint-gray-on-dark — inactive tab labels and empty-state copy legible (SC#1)
3. Color/type on Results traces to index.css tokens (SC#2)
4. Global header chrome matches the dark page — no navy-blue mismatch, no light bleed (SC#3)
5. PoliticianCard 4:5 tile shape/size unchanged from before the phase (SC#4)
6. Toggle to light mode on Results + Landing + a politician profile — confirm identical to pre-change; light teal #00657c unchanged (SC#5)

**Expected:** All 6 checks pass. No visual regressions. Dark mode reads as the Figma design.

**Why human:** No CSS/component render harness exists (Vitest is logic-only per 169-VALIDATION.md). Visual fidelity and contrast legibility cannot be verified programmatically.

**Note:** The 169-02-SUMMARY.md records that the human reviewer typed "approved" on 2026-06-24 and confirmed all 6 checks passed. This item is surfaced for process completeness (the blocking-human checkpoint was designed to gate the phase). If the recorded sign-off is accepted as satisfying this requirement, status may be upgraded to `passed`.

---

### Gaps Summary

No blocking gaps. All source-verifiable must-haves are VERIFIED:
- Figma dark palette tokens at correct values in @theme
- Inter + Manrope self-hosted and registered as font tokens
- Global default font is var(--font-sans) = Inter
- Light-mode values untouched (D-03)
- @source-not build-safety lines preserved
- No stale old dark literals in dark-scoped CSS (WR-01 fixed post-review)
- ev-ui !important overrides correct (PoliticianCard, gov-body-section, header child)
- Layout.jsx header #0d1117 (correct)
- Results.jsx and FilterBar.jsx dark literals swept; faint-gray lifted
- Build exits 0; 47 logic tests pass

The one remaining status gate is the human visual sign-off (Truth 10 / SC#1 / SC#4 / SC#5), which the SUMMARY documents as having been received. The ElectionsView mismatch is correctly deferred to Phase 172 (DARK-03).

---

_Verified: 2026-06-24T18:45:00Z_
_Verifier: Claude (gsd-verifier)_
