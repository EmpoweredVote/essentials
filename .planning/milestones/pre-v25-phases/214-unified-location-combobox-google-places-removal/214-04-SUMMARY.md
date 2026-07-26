---
phase: 214-unified-location-combobox-google-places-removal
plan: 04
subsystem: ui
tags: [react, floating-ui, combobox, google-places-removal, landing-page]

# Dependency graph
requires:
  - phase: 214-02
    provides: "LocationCombobox component (value/onChange/onSubmitAddress/onSubmitCoordinate/onSelectCandidate/errorRow contract); localitySearch.js browseAreaRoute(candidate) + coordinateRoute(lat,lng,raw) (lat/lng/coord_raw param names)"
provides:
  - "src/pages/Landing.jsx search bar rewired to the SAME shared <LocationCombobox> instance Results uses — Google Places hook + LocalityMatches usage removed"
  - "Landing-side coordinate hand-off: onSubmitCoordinate navigates via the Plan 02 coordinateRoute(lat,lng,raw) contract — the concrete Landing->Results seam Results' on-mount reader (Plan 03) already consumes"
  - "Address-classified submits skip the old resolveLocalityRoute Google detour entirely, going straight to /results?q=..."
affects: [214-05, 214-06, landing-page, results-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wrapper-div ref + querySelector('input') to scroll/focus into a host-owned (non-forwardRef) shared component, avoiding any change to LocationCombobox.jsx (out of this plan's files_modified scope)"

key-files:
  modified:
    - src/pages/Landing.jsx

key-decisions:
  - "handleAreaStepClick (the 'Choose Your Area' step-card click target) previously called addressInputRef.current?.scrollIntoView/.focus() directly against the raw <input> DOM ref. LocationCombobox does not accept or forward a ref (it's a plain controlled component, and forwardRef support was out of scope for this plan's files_modified: [src/pages/Landing.jsx] only). Replaced with a wrapper <div ref={comboboxWrapperRef}> around the <LocationCombobox> and used comboboxWrapperRef.current?.querySelector('input') to reach the combobox's internal input for .focus() — preserves the exact prior UX (scroll + focus on step-card click) with zero changes to LocationCombobox.jsx."
  - "Dropped the addressInputRef-based 'read the live DOM value, not React state' workaround in the old handleSearch — that workaround existed ONLY because Google Places Autocomplete wrote directly to the input DOM node bypassing React's onChange. LocationCombobox is fully controlled (value/onChange only, no imperative DOM writes), so addressInput state is now always the source of truth; the workaround comment and code no longer apply and were removed rather than carried forward as dead code."
  - "Removed the local 'searching' state and its disabled-button gating. It only existed to disable the old manual <button onClick={handleSearch}> during the async resolveLocalityRoute call. Per the plan's Dispatch Wiring, address submits no longer await any resolver call before navigating (immediate navigate('/results?q=...')), so there is no async window left to guard against double-submission; LocationCombobox's own dispatchSubmit/Enter handling replaces the old button entirely."
  - "Landing's coordinate-submit posthog event uses essentials_coordinate_searched with {method: 'landing_handoff'} only — no lat/lng, no outcome. Outcome (success/error/code) is captured exclusively by Results' resolveCoordinate on the reading side (Plan 03) once the hand-off resolves; duplicating an unresolved 'landing-side' outcome would be premature and diverge from Results' own {method, outcome, code?} event shape."

patterns-established: []

requirements-completed: [SRCH-05, SRCH-06]

# Metrics
duration: 12min
completed: 2026-07-21
---

# Phase 214 Plan 04: Landing LocationCombobox Adoption Summary

**Landing.jsx's search bar now renders the identical shared `<LocationCombobox>` instance powering Results, with its coordinate submit handing off to Results via the Plan 02 `coordinateRoute(lat,lng,raw)` contract; Google Places autocomplete and `LocalityMatches` usage fully removed from Landing, coverage list and candidate-by-name search untouched.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-21 (immediately following 214-03's completion)
- **Completed:** 2026-07-21
- **Tasks:** 1 completed
- **Files modified:** 1 (`src/pages/Landing.jsx`)

## Accomplishments
- Removed `useGooglePlacesAutocomplete` import + its bind call, `LocalityMatches` import + its JSX usage, and the `resolveLocalityRoute`/`coverageAreaToPath` call sites from Landing.jsx (both imports dropped as unused once their only call sites were removed).
- Added `<LocationCombobox value={addressInput} onChange={setAddressInput} onSubmitAddress={...} onSubmitCoordinate={...} onSelectCandidate={...} .../>` as the single search-bar component — the exact same import path (`../components/LocationCombobox`) and prop contract Results.jsx uses.
- `onSubmitAddress(raw)` navigates directly to `/results?q=<raw>` (no resolver detour — address-classified input skips straight to the Census address path, matching RESEARCH's Dispatch Wiring).
- `onSubmitCoordinate(lat, lng, raw)` navigates via `coordinateRoute(lat, lng, raw)` from `src/lib/localitySearch.js` (Plan 02) — the exact hand-off contract Results' on-mount `lat`/`lng`/`coord_raw` reader (Plan 03) already consumes and live-tested.
- `onSelectCandidate(candidate)` navigates via `browseAreaRoute(candidate)` (Plan 02), replacing the old `coverageAreaToPath(area)` call which expected the retired static-catalog area shape.
- Preserved, byte-for-byte unchanged: `handleAreaClick` + the full Alpha-Communities coverage-list rendering (D-04 browse entry point), and the entire `nameQuery`/`nameResults`/`nameSearchResults` candidate-by-name search feature (explicitly a separate, non-conflated feature per RESEARCH.md).
- `handleAreaStepClick` (the "Choose Your Area" step card) now scrolls/focuses via a wrapper-div ref + `querySelector('input')` instead of a raw `<input>` ref, since `LocationCombobox` doesn't forward refs and wasn't in this plan's edit scope.
- `npm run build` succeeds; full Vitest suite green (256/256, 14 files).

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace Landing search bar with shared LocationCombobox + coordinate hand-off (SRCH-06/05)** - `2228a168` (feat)

_No plan-metadata commit yet — this SUMMARY/STATE/ROADMAP commit follows below per the executor's final_commit step._

## Files Created/Modified
- `src/pages/Landing.jsx` - Google Places hook + `LocalityMatches` removed; `<LocationCombobox>` adopted as the shared search bar with address/coordinate/candidate dispatch handlers; coverage list (`handleAreaClick`) and candidate-by-name search (`nameQuery`) left untouched; `handleAreaStepClick` re-targeted at a wrapper-div ref.

## Decisions Made
See frontmatter `key-decisions` for full rationale. Summary:
- `handleAreaStepClick` uses a wrapper `<div ref>` + `querySelector('input')` to reach LocationCombobox's internal input for focus, since the component doesn't forward refs and wasn't in scope to modify.
- Dropped the `addressInputRef`-based DOM-read workaround and the `searching` state — both existed only to compensate for Google Places' direct DOM writes and the old async resolver-gated submit button, neither of which apply to the fully-controlled combobox's immediate-navigate dispatch.
- Landing's coordinate-submit telemetry event (`essentials_coordinate_searched`, `{method: 'landing_handoff'}`) carries no lat/lng and no outcome — outcome capture is Results' job on the reading side (Plan 03), avoiding a premature/duplicate event.

## Deviations from Plan

None - plan executed exactly as written. The three key-decisions above are implementation details required to translate the plan's action text into working code (ref-forwarding limitation, dead-code removal for a workaround that no longer applies) rather than deviations from the plan's intent — no acceptance criterion, must-have, or threat-model disposition was altered.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Landing.jsx and Results.jsx now both import the identical `LocationCombobox` component and both consume `browseAreaRoute`/`coordinateRoute` from the same `src/lib/localitySearch.js` module — the SRCH-06 "one shared implementation" requirement is satisfied end-to-end across both pages.
- The Plan 02 `coordinateRoute` contract is now exercised from BOTH sides: Landing writes it (this plan), Results reads it on mount (Plan 03, already live-tested) — the full Landing→Results coordinate hand-off is wired and ready for Plan 06's manual smoke checkpoint.
- No blockers for Plan 05 (final Google Places deletions: `useGooglePlacesAutocomplete.js`, `.pac-container` CSS, `@googlemaps/js-api-loader` uninstall, `LocationBrowser.jsx`/`LocalityMatches.jsx` file deletion). Landing.jsx no longer imports any of those files, so Plan 05 can delete them without touching Landing.jsx again.

## Known Stubs
None - the combobox is fully wired to live navigation targets (address/coordinate/candidate), and the coverage list + name-search features are unchanged, fully functional code paths.

## Threat Flags
None beyond this plan's own `<threat_model>` (T-214-05/T-214-02/T-214-07, all mitigated per the acceptance-criteria greps above — all navigation targets are internal `/results?...` built via `browseAreaRoute`/`coordinateRoute` + `URLSearchParams`/`encodeURIComponent`; no raw-coordinate telemetry; candidate-by-name search left untouched).

## Self-Check: PASSED

- FOUND: src/pages/Landing.jsx
- FOUND commit: 2228a168
- `grep -n "useGooglePlacesAutocomplete\|<LocalityMatches\|import LocalityMatches" src/pages/Landing.jsx` → zero matches
- `grep -c "<LocationCombobox" src/pages/Landing.jsx` → 1
- `grep -n "components/LocationCombobox" src/pages/Landing.jsx src/pages/Results.jsx` → both import the same path
- `grep -n "coordinateRoute" src/pages/Landing.jsx` → import + onSubmitCoordinate call site
- `grep -n "lookupCoordinate" src/pages/Landing.jsx` → zero matches
- `grep -n "handleAreaClick\|COVERAGE_STATES\|nameQuery" src/pages/Landing.jsx` → all present
- `npm run build` → succeeds
- `npm test` → 256/256 passed (14 files)

---
*Phase: 214-unified-location-combobox-google-places-removal*
*Completed: 2026-07-21*
