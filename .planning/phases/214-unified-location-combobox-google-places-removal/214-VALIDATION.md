---
phase: 214
slug: unified-location-combobox-google-places-removal
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-07-21
---

# Phase 214 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Ported from 214-RESEARCH.md "Validation Architecture" (lines 827-877).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.4 (already a devDependency; `npm test` → `vitest run`) |
| **Config file** | none — no `vitest.config.*`; Vitest runs with defaults via the Vite config/CLI. Existing tests (`classify.test.js`, `compass.test.js`, `groupHierarchy.test.js`, `treasury.test.js`, `bannerProps.test.js`) are all pure-function unit tests, no jsdom/DOM dependency |
| **Quick run command** | `npx vitest run src/lib/inputClassifier.test.js src/lib/api.test.js` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5s quick run · ~15s full suite (pure-function suite, no DOM boot) |

**Infra gap (accepted, not a Wave 0 blocker):** no `@testing-library/react` / `jsdom` is configured — no prior phase has automated component-render tests. This phase's LOGIC (classifier + the two `api.jsx` functions with mocked `fetch`) fits the existing pure-function test pattern and needs NO new infra. Component-level ARIA/keyboard behavior for `<LocationCombobox>` is verified via the Plan 06 manual checkpoint, consistent with how UI has always been validated in this codebase. Introducing jsdom here would be disproportionate scope creep.

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/inputClassifier.test.js src/lib/api.test.js` (fast, no DOM). For component/page-edit tasks with no unit target (Plans 02/03/04), `npm run build` is the per-task gate.
- **After every plan wave:** Run `npm test` (full suite) + the scoped SRCH-08 grep gate.
- **Before `/gsd:verify-work`:** Full suite green + scoped grep gate empty + live manual combobox keyboard/screen-reader check on both Results and Landing.
- **Max feedback latency:** ~15 seconds (full suite).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 214-01-01 | 01 | 1 | SRCH-03 | T-214-01 | Client classification is UX-only, never a security boundary (ASVS V5) | unit | `npx vitest run src/lib/inputClassifier.test.js` | ❌ W0 → created by this task | ⬜ pending |
| 214-01-02 | 01 | 1 | SRCH-04, SRCH-05 | T-214-01 / T-214-02 | publicFetch (no 401→login redirect); 3 distinct 422 codes threaded; no coordinate logged | unit | `npx vitest run src/lib/api.test.js` | ❌ W0 → created by this task | ⬜ pending |
| 214-02-01 | 02 | 2 | SRCH-02, SRCH-03, SRCH-04 | T-214-03 / T-214-04 | No dangerouslySetInnerHTML (React auto-escape); debounce gated on kind==='name' + ≥3 chars | build + manual | `npm run build` (ARIA/keyboard → 214-06-01) | ✅ shell | ⬜ pending |
| 214-02-02 | 02 | 2 | SRCH-04, SRCH-05 | T-214-05 | browseAreaRoute + coordinateRoute build INTERNAL /results URLs via URLSearchParams only | build | `npm run build` | ✅ shell | ⬜ pending |
| 214-03-01 | 03 | 3 | SRCH-01 | — | Fully-controlled input; no addressInputRef ref-read workaround | build | `npm run build` | ✅ shell | ⬜ pending |
| 214-03-02 | 03 | 3 | SRCH-05 | T-214-02 / T-214-05 / T-214-06 | Shared resolveCoordinate; D-05 client-sourced label; representingCity guard; no raw-coord telemetry | build | `npm run build` | ✅ shell | ⬜ pending |
| 214-03-03 | 03 | 3 | SRCH-05 | T-214-02 / T-214-06 | On-mount lat/lng/coord_raw reader calls SHARED resolveCoordinate; label client-sourced; no telemetry | build | `npm run build` | ✅ shell | ⬜ pending |
| 214-04-01 | 04 | 3 | SRCH-05, SRCH-06 | T-214-05 / T-214-02 / T-214-07 | Coordinate hand-off via internal coordinateRoute URL only; name-search feature untouched | build | `npm run build` | ✅ shell | ⬜ pending |
| 214-05-01 | 05 | 4 | SRCH-08 | T-214-SC / T-214-08 | Removal-only (no install); .pac two-edit delete keeps ev-candidate-enter | build | `npm run build` | ✅ shell | ⬜ pending |
| 214-05-02 | 05 | 4 | SRCH-08 | T-214-08 | Scoped grep gate (not bare `google`) so Civic API feature is not false-failed | automated (shell) | `grep -rnE "pac-container\|pac-item\|window[.]google\|@googlemaps" src/ package.json package-lock.json` (expect empty) + `npm test` | ✅ shell | ⬜ pending |
| 214-06-01 | 06 | 5 | SRCH-01, SRCH-02, SRCH-04, SRCH-05, SRCH-06 | T-214-02 | Operator confirms resting label is client-typed coord (never server address) | manual-only | — (live browser + keyboard/screen-reader on Results + Landing) | N/A — manual | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/inputClassifier.test.js` — stubs/coverage for SRCH-03 (classification correctness + documented edge cases from RESEARCH Open Questions 1/2). Owned by task **214-01-01** (TDD, runs Wave 1 before any consumer).
- [x] `src/lib/api.test.js` — stubs/coverage for SRCH-04/SRCH-05 (`searchLocationsByName`/`lookupCoordinate` response-shape handling + 422-code mapping) via mocked `global.fetch`. New file, owned by task **214-01-02** (TDD, runs Wave 1).
- [x] Framework install: none needed — Vitest 4.1.4 already configured and running.

*Both MISSING test references are owned by Plan 01's TDD tasks, which execute first (Wave 1) ahead of every combobox/page consumer — so Wave 0 is fully planned. No component-test infra is introduced (see Infra gap above).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Combobox ARIA (`role=combobox`, `aria-expanded`, `aria-activedescendant`) + full keyboard nav (ArrowUp/Down/Home/End/Enter/Escape, focus stays in input) | SRCH-02 | No jsdom/testing-library infra in this repo; no component-test precedent to extend | Plan 06 step 2: with a name dropdown open, arrow-navigate rows, confirm focus stays in the input, Enter selects, Escape dismisses |
| Same `<LocationCombobox>` renders + behaves identically in the Results header and the Landing search bar | SRCH-01, SRCH-06 | Cross-page render parity is a live-browser observation | Plan 06: run steps 1/4/5 on Results, then repeat on Landing; confirm identical behavior and same import path |
| Ambiguous place names surface a state-qualified picker (City, ST / County, ST / ST) + Stances badge; never auto-picks | SRCH-04 | Depends on live resolver ranking + rendered listbox | Plan 06 steps 1 & 3: type "Springfield", confirm multiple state-qualified rows with Stances badges on covered areas |
| Coordinate resting label = the typed `lat, lng` (D-05), NOT a server address; boundary coordinate shows the correct banner | SRCH-05 | Privacy/label behavior + banner-hijack guard only observable at runtime | Plan 06 step 5: type "39.17, -86.52", confirm resting label is exactly that text and the banner is correct for the point |
| Landing→Results coordinate hand-off resolves after navigation (via lat/lng/coord_raw params) | SRCH-05 | End-to-end navigation behavior; not unit-testable without page-render infra | Plan 06 (Landing step 5): submit a coordinate on Landing, confirm Results resolves it and shows the typed label |
| Combobox themes correctly in light AND dark mode (input, dropdown, hint row, coral error row) | SRCH-02 | Visual contrast is a human judgment | Plan 06 dark-mode step: toggle dark mode, confirm no unreadable contrast |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (Plans 01/02/03/04/05 all have `<automated>`; Plan 06 is the manual UI gate for behaviors with no repo test infra)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify (every non-checkpoint task runs `npm run build`/`vitest`/grep)
- [x] Wave 0 covers all MISSING references (inputClassifier.test.js + api.test.js, both owned by Plan 01 TDD tasks)
- [x] No watch-mode flags (all commands use `vitest run` / `npm test`, never `vitest --watch`)
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (validation strategy complete; ported from RESEARCH.md Validation Architecture)
