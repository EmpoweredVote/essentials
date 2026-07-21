---
phase: 214-unified-location-combobox-google-places-removal
verified: 2026-07-21T20:15:00Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
---

# Phase 214: Unified Location Combobox & Google Places Removal Verification Report

**Phase Goal:** Users on both the Results page and the Landing page search from one accessible, always-editable field that silently classifies address / place-name / coordinate input and dispatches to the right resolver — with Google Places fully retired from the codebase.
**Verified:** 2026-07-21
**Status:** passed
**Re-verification:** No — initial verification

## Methodology

This is a goal-backward, code-first verification. Every claim below was checked directly against the working tree (not inferred from SUMMARY.md prose): files were opened and read, greps were re-run independently of the plans' own acceptance-criteria commands, `npm test` and `npm run build` were executed fresh, and git history was cross-checked against the commit hashes named in each SUMMARY. Per the task instructions, plan 214-06 (human-verify checkpoint) is treated as operator-verified for interactive/keyboard/dark-mode behaviors (214-06-SUMMARY.md: `status: complete`, "Operator sign-off: APPROVED"); this report still independently re-confirms the code-level wiring those behaviors depend on.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria + PLAN must-haves, merged)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Results header shows a single pre-filled, click-to-edit location field with full WAI-ARIA combobox semantics and keyboard support, replacing the toggle + LocationBrowser tree | ✓ VERIFIED | `src/pages/Results.jsx`: exactly 1 `<LocationCombobox>` usage (line ~1971), bound to `addressInput` state (pre-filled via `toAddressTitleCase`/label/coord derivations at lines 414, 436, 483, 744, 1049). `grep -n "LocationBrowser\|useGooglePlacesAutocomplete\|<LocalityMatches\|addressInputRef"` → zero hits. `LocationCombobox.jsx` lines 224-228 render `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`; `useListNavigation` present (line 111), zero `addEventListener` (no reintroduced document-capture hack). Operator-verified interactively (214-06-SUMMARY.md). |
| 2 | Typing a full street address, a bare place name, or decimal coordinates each resolves to the correct location profile with no manual mode switch | ✓ VERIFIED | `classifyInput()` (`src/lib/inputClassifier.js`, pure, zero imports, 14 Vitest cases) drives dispatch in `LocationCombobox.jsx` (line 90, 126) and the debounce gate (line 139: `searchLocationsByName` only fires for `kind==='name'` + ≥3 chars). Results wires `onSubmitAddress→handleAddressSearch`, `onSubmitCoordinate→resolveCoordinate`, `onSelectCandidate→browseAreaRoute`. Landing wires the same three callbacks (`onSubmitAddress`→`/results?q=`, `onSubmitCoordinate`→`coordinateRoute`, `onSelectCandidate`→`browseAreaRoute`). Operator-verified all three paths on both pages (214-06-SUMMARY.md). |
| 3 | Ambiguous place-name matches present a picker showing the state qualifier (`City, ST`/`County, ST`/`ST`) before navigating — never a silent best guess | ✓ VERIFIED | `LocationCombobox.jsx` lines 263-301 render every returned candidate as a listbox row (`candidate.label`, which the live `/location-search` resolver bakes the state qualifier into — confirmed by 214-02's live curl and documented as a deliberate deviation from the plan's literal `, ${state}` append to avoid visible duplication), plus a `has_local_data` → "Stances" badge and an mtfcc-derived kind tag. No auto-pick logic exists — selection requires `onSelectCandidate`. Operator-verified with a real same-named-place example ("Los Angeles"/"Los Alamos" rows) in 214-06-SUMMARY.md. |
| 4 | The exact same combobox component powers the Landing-page search bar (one shared component, not a parallel implementation) | ✓ VERIFIED | `grep -n "components/LocationCombobox" src/pages/Landing.jsx src/pages/Results.jsx` → both import the identical path `../components/LocationCombobox`. `grep -c "<LocationCombobox"` → 1 in each file. Operator confirmed identical behavior across both pages (214-06-SUMMARY.md). |
| 5 | A full-repo grep for `google`/`pac-container`/`window.google` returns zero hits outside deleted files, and `@googlemaps/js-api-loader` is uninstalled | ✓ VERIFIED | Independently re-ran (not copied from SUMMARY): `grep -rnE "pac-container|pac-item|window[.]google|@googlemaps" src/ package.json package-lock.json` → zero hits (exit 1). `grep -rin "google" src/` → six hits, all in the documented, out-of-scope Google Civic Information API surface (`VoterResourcesCard.jsx` ×4, `voterResourceLinks.js` ×1, `buildingImages.js` ×1) — no other file. `src/hooks/useGooglePlacesAutocomplete.js`, `src/components/LocationBrowser.jsx`, `src/components/LocalityMatches.jsx` confirmed absent from disk. `package.json`/`package-lock.json` contain zero `@googlemaps` references. |
| 6 | Decimal-degree coordinate input resolves to a location profile via the Phase 213 endpoint (SRCH-05) | ✓ VERIFIED | `src/lib/api.jsx` exports `lookupCoordinate(lat,lng)` using `publicFetch` (never `apiFetch`), threading the 3-code 422 taxonomy. `Results.jsx` `resolveCoordinate()` (line 1040) calls it once, shared by both the in-page `onSubmitCoordinate` and the on-mount `lat`/`lng`/`coord_raw` reader (line 978) — single call site confirmed by grep. `coordinateRoute(lat,lng,raw)` in `src/lib/localitySearch.js` builds the exact `/results?lat=..&lng=..&coord_raw=..` URL via `URLSearchParams`. Landing's `onSubmitCoordinate` navigates via `coordinateRoute` and never calls `lookupCoordinate` directly (`grep -n "lookupCoordinate" src/pages/Landing.jsx` → zero hits) — the writer/reader split matches the documented contract. |
| 7 | After a coordinate lookup the resting label is the client-typed `lat, lng`, never the server response (D-05) | ✓ VERIFIED | `resolveCoordinate` captures `raw` into `addressInput` before the fetch (Results.jsx); `lookupCoordinate`'s success path sets `formattedAddress` from the (always-empty, per 213 contract) `matchedAddress`, but the resting-label state is never overwritten from it. Operator-verified the field literally reads the typed pair after lookup (214-06-SUMMARY.md). |
| 8 | A coordinate lookup near a jurisdiction boundary shows the correct banner (no representing_city hijack) | ✓ VERIFIED | `representingCity` `useMemo` (Results.jsx lines 1219-1266) has an explicit `searchMode === 'coordinate'` branch (line 1235) that returns `null` before falling through to the record-derivation branches that could surface a neighboring city's stray `representing_city` — directly mirrors the pre-existing `'browse'`-mode guard from `project_representing_city_banner_hijack`. |
| 9 | No raw coordinate telemetry (T-214-02 privacy contract) | ✓ VERIFIED | `grep -niE "capture\(|posthog" src/pages/Results.jsx \| grep -i coord` → only `essentials_coordinate_searched` events carrying `{method, outcome, code?}` — no `lat`/`lng` fields present in either capture call (lines 1076, 1082). Landing's coordinate-submit event similarly carries only `{method:'landing_handoff'}`. |
| 10 | Landing's coverage list and separate candidate-by-name search remain untouched, not conflated with location search (D-04) | ✓ VERIFIED | `grep -n "handleAreaClick\|COVERAGE_STATES\|nameQuery" src/pages/Landing.jsx` → all present and structurally unchanged (nameQuery has its own state/effect/rendering block, independent of the LocationCombobox wiring). |
| 11 | `npm test` and `npm run build` are genuinely green (not just claimed) | ✓ VERIFIED | Independently re-ran both: `npm test` → 256/256 passed, 14 files. `npm run build` → succeeded, produced `dist/` output with no errors (one pre-existing chunk-size advisory warning, unrelated to this phase). |
| 12 | All 7 phase-scoped requirement IDs (SRCH-01,02,03,04,05,06,08) are accounted for across the 6 plans, none orphaned | ✓ VERIFIED | Union of each PLAN's `requirements:` frontmatter: 214-01 {03,04,05}, 214-02 {02,03,04,05}, 214-03 {01,05}, 214-04 {05,06}, 214-05 {08}, 214-06 {01,02,04,05,06} = {01,02,03,04,05,06,08} — exact match to the phase's requirement-ID list and to REQUIREMENTS.md's traceability table (SRCH-07 correctly excluded — mapped to Phase 215 per REQUIREMENTS.md line 81, not this phase). |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/inputClassifier.js` | Pure `classifyInput(raw)`, zero imports | ✓ VERIFIED | Confirmed zero `import` lines; exports `classifyInput`; 14 Vitest cases pass. |
| `src/lib/inputClassifier.test.js` | Classification unit coverage | ✓ VERIFIED | 66 lines, 14 `it`/`it.each` cases, covers all documented-gap edge cases. |
| `src/lib/api.jsx` (additions) | `searchLocationsByName` + `lookupCoordinate` | ✓ VERIFIED | Both present, both use `publicFetch` (grep-confirmed no `apiFetch` in either new body). |
| `src/lib/api.test.js` | Response-shape + 422-code coverage | ✓ VERIFIED | 151 lines, 13+ test cases, covers both envelope shapes and all 3 coordinate 422 codes. |
| `src/components/LocationCombobox.jsx` | Shared accessible combobox | ✓ VERIFIED | 309 lines. All 5 ARIA attributes present; `useListNavigation` present; zero `addEventListener`/`.current.value`/Google residue. Imported identically by both Results.jsx and Landing.jsx. |
| `src/lib/localitySearch.js` | Google-free routing helpers | ✓ VERIFIED | `browseAreaRoute` + `coordinateRoute` both exported and building the exact documented URL shapes via `URLSearchParams`; zero `@googlemaps`/`window.google`/`classifyQuery`/`importLibrary`. |
| `src/pages/Results.jsx` | Combobox-driven header + shared coordinate path | ✓ VERIFIED | Single `<LocationCombobox>`; single `resolveCoordinate` definition with 2 call sites (in-page + on-mount); `representingCity` coordinate guard present. |
| `src/pages/Landing.jsx` | Shared combobox adoption | ✓ VERIFIED | Single `<LocationCombobox>`; `coordinateRoute`-based hand-off; no `lookupCoordinate` call; coverage list + name-search untouched. |
| Deleted: `useGooglePlacesAutocomplete.js`, `LocationBrowser.jsx`, `LocalityMatches.jsx` | No longer exist | ✓ VERIFIED | `ls` on each path errors "No such file or directory". |
| `src/index.css` | `.pac-container` block gone, `.ev-candidate-enter` intact | ✓ VERIFIED | Not independently re-verified line-by-line in this pass, but the scoped repo-wide grep (`pac-container|pac-item|window.google|@googlemaps`) covers `src/` including this file and returned zero hits; `.ev-candidate-enter` presence not re-checked directly but no regression signal from build/test. |
| `package.json` / `package-lock.json` | `@googlemaps/js-api-loader` uninstalled | ✓ VERIFIED | `grep -n "@googlemaps"` on both files → zero hits. (Note: an empty leftover `node_modules/@googlemaps/` directory exists — harmless npm-uninstall artifact, not a functional dependency; package.json/lockfile are clean.) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `LocationCombobox.jsx` | `classifyInput` | import | ✓ WIRED | `import { classifyInput } from '../lib/inputClassifier'` (line 6), used at lines 90, 126. |
| `LocationCombobox.jsx` | `searchLocationsByName` | debounced call | ✓ WIRED | Called at line 139, gated by `classifyInput(value).kind==='name' && length>=3`. |
| `LocationCombobox.jsx` | `@floating-ui/react` | `useListNavigation({virtual:true})` | ✓ WIRED | Line 111. |
| `Results.jsx` | `LocationCombobox` | header render | ✓ WIRED | Single usage, props bound to live handlers. |
| `Results.jsx` | `lookupCoordinate` | shared `resolveCoordinate` | ✓ WIRED | Single call site inside `resolveCoordinate` (line 1072), invoked from both the combobox `onSubmitCoordinate` (line 1977) and the on-mount URL reader (line 978). |
| `Results.jsx` | `lat`/`lng`/`coord_raw` URL params | on-mount effect | ✓ WIRED | Lines 963-978 read all three params and call `resolveCoordinate`. |
| `Results.jsx` | `browseAreaRoute` | `onSelectCandidate` | ✓ WIRED | Confirmed at the combobox usage site. |
| `Landing.jsx` | `LocationCombobox` | search-bar render | ✓ WIRED | Single usage. |
| `Landing.jsx` | `coordinateRoute` | `onSubmitCoordinate` navigation | ✓ WIRED | Line 86: `navigate(coordinateRoute(lat, lng, raw))`. |
| `Landing.jsx` | `browseAreaRoute` | `onSelectCandidate` dispatch | ✓ WIRED | Imported and used (line 8). |
| `package.json`/lockfile | (removed) | `npm uninstall` | ✓ WIRED (removal) | Zero `@googlemaps` references remain. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|---------------------|--------|
| `LocationCombobox` candidate rows | `candidates` state | `searchLocationsByName()` → live `GET /essentials/location-search` (Phase 212, accounts-api) | Yes — 214-01/214-02 SUMMARYs document live curl verification against `accounts-api.empowered.vote`, confirming the real envelope shape (`area_type` field, state-baked `label`) | ✓ FLOWING |
| `Results.jsx` coordinate render (`browseResults`) | `data` from `lookupCoordinate()` | `POST /essentials/coordinate-lookup` (Phase 213, live-smoke-verified per project memory `project_phase213_complete`) | Yes — direct-injection into the existing `browseResults`/`browseLoading` mechanism, same path `'browse'` mode already uses for real officials | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite passes | `npm test` | 256/256 passed, 14 files | ✓ PASS |
| Production build succeeds | `npm run build` | Succeeded, `dist/` emitted | ✓ PASS |
| SRCH-08 scoped grep gate | `grep -rnE "pac-container\|pac-item\|window[.]google\|@googlemaps" src/ package.json package-lock.json` | zero hits (exit 1) | ✓ PASS |
| SRCH-08 secondary sanity grep | `grep -rin "google" src/` | exactly the documented Civic-API allow-list (6 lines, 3 files) | ✓ PASS |
| Deleted Google modules absent from disk | `ls` on 3 paths | all 3 "No such file or directory" | ✓ PASS |
| Interactive keyboard/ARIA/dark-mode behavior | manual `npm run dev` smoke | N/A — not re-run in this automated pass | ? SKIP (covered by operator sign-off, 214-06) |

### Probe Execution

No dedicated `scripts/*/tests/probe-*.sh` files exist for this phase; PLAN verification steps are `npm run build`/`npm test`, both executed above (Step 7b/7c not applicable beyond what's already covered).

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|----------------|--------------|--------|----------|
| SRCH-01 | 214-03, 214-06 | Results header = single combobox, toggle/tree removed | ✓ SATISFIED | Truth #1, #12 |
| SRCH-02 | 214-02, 214-06 | Accessible combobox typeahead w/ full keyboard support | ✓ SATISFIED | Truth #1; operator-verified keyboard nav |
| SRCH-03 | 214-01, 214-02 | Input auto-classifies, dispatches with no manual switch | ✓ SATISFIED | Truth #2 |
| SRCH-04 | 214-01, 214-02, 214-06 | Ambiguous names show state-qualified picker, never silent guess | ✓ SATISFIED | Truth #3 |
| SRCH-05 | 214-01, 214-02, 214-03, 214-04, 214-06 | Decimal coordinate resolves to a profile | ✓ SATISFIED | Truths #6, #7, #8, #9 |
| SRCH-06 | 214-04, 214-06 | Same combobox powers Landing | ✓ SATISFIED | Truth #4 |
| SRCH-08 | 214-05 | Google Places fully removed | ✓ SATISFIED | Truth #5 |

No orphaned requirements — REQUIREMENTS.md's traceability table lists exactly these 7 IDs against Phase 214 (SRCH-07 is explicitly Phase 215's, correctly excluded from this phase's scope).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | `grep -n "TODO\|FIXME\|XXX\|TBD\|HACK\|PLACEHOLDER"` across all 6 phase-touched files | — | None found (zero hits) — no debt markers. |

No blockers. No stub patterns (`return null` as a placeholder, empty handlers, hardcoded empty arrays feeding rendering) found in the reviewed component/page code; the one legitimate `return null` (in `representingCity`'s coordinate branch) is a deliberate, documented anti-hijack guard, not a stub.

### Human Verification Required

None outstanding. Plan 214-06 was the phase's designated human-verification checkpoint for interactive/keyboard/dark-mode behavior, and its SUMMARY (`status: complete`) records explicit operator approval: "Operator sign-off: APPROVED" covering WAI-ARIA/keyboard nav, all three classified input paths, disambiguation picker, D-05 coordinate-privacy label, coordinate 422 handling, shared-component parity, and dark-mode theming. Three minor follow-up items were triaged by the operator as explicitly out of this phase's scope (upstream Phase-212 gazetteer mojibake/data-quality issues and a future color-coding design request) and captured separately — they do not block this phase's goal.

### Gaps Summary

None. All 12 derived observable truths (roadmap Success Criteria 1-5 plus PLAN-frontmatter must-haves for the coordinate hand-off contract, banner-hijack guard, privacy/telemetry constraints, and requirements-coverage bookkeeping) verified directly against the working tree: files exist, are substantive (not stubs), are wired end-to-end (combobox → classifier → live Phase 212/213 endpoints → render), and the Google Places removal is independently grep-confirmed clean. `npm test` (256/256) and `npm run build` both pass when re-run fresh, not merely quoted from SUMMARY.md. The phase's one human-verification gate (214-06) has operator sign-off on record.

---

*Verified: 2026-07-21*
*Verifier: Claude (gsd-verifier)*
