---
phase: 214-unified-location-combobox-google-places-removal
plan: 03
subsystem: ui
tags: [react, floating-ui, combobox, coordinate-lookup, google-places-removal]

# Dependency graph
requires:
  - phase: 214-02
    provides: "LocationCombobox component (value/onChange/onSubmitAddress/onSubmitCoordinate/onSelectCandidate/errorRow contract); localitySearch.js browseAreaRoute(candidate) + coordinateRoute(lat,lng,raw) (lat/lng/coord_raw param names)"
  - phase: 214-01
    provides: "classifyInput() classifier (consumed internally by LocationCombobox); api.jsx lookupCoordinate(lat,lng) -> {data,error,code,formattedAddress}"
provides:
  - "src/pages/Results.jsx header rewired to a single always-editable <LocationCombobox> — Address/Browse mode toggle, address <input>, <LocalityMatches>, and <LocationBrowser> tree all removed"
  - "Shared resolveCoordinate(lat, lng, raw, {method}) — ONE coordinate render path serving both the in-page onSubmitCoordinate callback and the on-mount lat/lng/coord_raw URL-param reader (the Plan 02 coordinateRoute hand-off contract from Landing)"
  - "representingCity banner-hijack guard extended with an explicit mode === 'coordinate' branch (returns null, never falls through to record-derivation)"
affects: [214-04, 214-06, results-page, landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Direct-injection coordinate results reuse the existing browseResults/browseLoading state (same mechanism 'browse' mode uses) rather than a third fetch hook"
    - "Single shared resolveCoordinate() function invoked from two entry points (in-page submit + on-mount URL-param read) to avoid duplicated lookup/injection/label logic — the pattern Plan 04 (Landing) should also respect when it builds coordinateRoute navigation"

key-files:
  modified:
    - src/pages/Results.jsx

key-decisions:
  - "The collapsed-chip/pencil-edit toggle (editingSearch state, gated 'chip vs full form' rendering) was removed entirely, not just the mode-toggle buttons inside it. 214-CONTEXT.md D-03 explicitly rejects a 'pill->input display/edit toggle' ('adds a state machine for no real gain and reads less honestly against always-editable') and the plan's own must-haves truth says the header shows ONE pre-filled, click-to-edit LocationCombobox. PATTERNS.md's line-numbered removal targets (pre-edit reference, expected to drift per the plan's own note) only enumerated the toggle+input+LocalityMatches+LocationBrowser block, but leaving the outer chip/pencil mechanism in place would have produced a two-state UI that directly contradicts D-03. The tribal-land badge and elections-summary content that lived inside the old chip now render as an unconditional secondary info row below the combobox, gated on the same underlying data being present (tribalLand?.on_reservation / electionsLabelSuffix) rather than on a chip/edit-mode flag — so no information was dropped, only the toggle mechanism."
  - "Coordinate mode does not write lat/lng into the URL for in-page submits (only the Plan 02 coordinateRoute-driven Landing hand-off ever puts them there, and resolveCoordinate strips them again once consumed) — matches the plan's explicit instruction that coordinate results have no geo_id to browse-by-area with, so no shareable/bookmarkable URL shape was specified for this plan and none was invented."
  - "representingCity's new mode === 'coordinate' branch returns null rather than deriving any label from the typed coordinates. A raw lat/lng has no resolved place name (D-05 — the server never echoes an address), so there is no trustworthy label-of-record for the CITY BANNER (a separate surface from the D-05 input resting label, which IS the typed text) — returning null cleanly omits the local-tier city banner for coordinate searches rather than fabricating one or risking a neighbor-jurisdiction hijack."
  - "locationKey (the stancesByPolId cache-reset key) was extended to include the coordinate's typed label when searchMode === 'coordinate'. Without this, two different coordinate searches in a row would share the same cache key (searchMode/activeQuery/browseArea all held constant across coordinate searches, since coordinate results carry no geo_id/mtfcc and no q param) and stale per-politician stance data from the first search would bleed into the second — an actual bug this plan's own new mode value would have introduced, fixed inline per deviation Rule 1."

patterns-established:
  - "Coordinate-shaped location results are 'browse with no geo_id' — inject directly into browseResults/browseLoading, add a mode value to searchMode, and extend every guard that already special-cases searchMode === 'browse' (list/phase derivation, representingCity, locationKey, auto-save-location skip) rather than introducing a parallel state machine."

requirements-completed: [SRCH-01, SRCH-05]

# Metrics
duration: 20min
completed: 2026-07-21
---

# Phase 214 Plan 03: Results LocationCombobox & Shared Coordinate Render Path Summary

**Results header rewired to one always-editable `<LocationCombobox>` (Address/Browse toggle, address `<input>`, `<LocalityMatches>`, and `<LocationBrowser>` all removed) plus a single shared `resolveCoordinate()` that serves both the in-page coordinate submit and the on-mount `lat`/`lng`/`coord_raw` Landing hand-off, direct-injecting officials into the existing `browseResults` state with a client-sourced (D-05) resting label and banner guard.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-21 (immediately following 214-02's plan-finalize commit)
- **Completed:** 2026-07-21
- **Tasks:** 3 completed
- **Files modified:** 1 (`src/pages/Results.jsx`)

## Accomplishments
- Removed `useGooglePlacesAutocomplete` (+ its `addressInputRef` DOM-ref workaround), `LocationBrowser`, and `LocalityMatches` imports/usage entirely; `handleAddressSearch` now reads the controlled `addressInput` state directly instead of a DOM ref.
- Replaced the Address/Browse mode-toggle buttons, address `<input>`, and both listbox components with a single `<LocationCombobox value={addressInput} onChange=... onSubmitAddress=... onSubmitCoordinate=... onSelectCandidate=... errorRow={coordError} />`. Also removed the pre-existing collapsed-chip/pencil-edit toggle (`editingSearch` state) per D-03's explicit "no pill->input toggle" directive — the tribal-land badge and elections summary that lived inside that chip now render as an unconditional secondary info row.
- `onSelectCandidate` navigates via `browseAreaRoute(candidate)` (Plan 02); `onSubmitAddress` calls the unchanged `handleAddressSearch` body (still runs the `resolveLocalityRoute` locality-shortcut check before falling through to the Census address path).
- Added a single shared `async function resolveCoordinate(lat, lng, raw, {method})`: captures the typed `raw` text into `addressInput` (D-05, before the fetch), sets `searchMode = 'coordinate'`, direct-injects into `browseResults`/`browseLoading` (the same mechanism `'browse'` mode uses), strips conflicting address/browse/hand-off URL params, calls `lookupCoordinate(lat, lng)`, and on a 422 renders the matching D-08 coral message via the combobox's `errorRow` (no navigation, input stays as typed) or on success populates `browseResults` with the returned officials.
- Added an on-mount effect reading `lat`/`lng`/`coord_raw` (the Plan 02 `coordinateRoute` contract) that calls the SAME `resolveCoordinate` — the concrete Landing→Results coordinate hand-off, guarded to fire once per mount like every other `browse_*` on-mount reader in this file.
- Extended `list`/`phase` derivation, the `representingCity` banner-hijack guard (new `mode === 'coordinate'` branch returning `null`, mirroring the `'browse'` branch), the `locationKey` stance-cache key, and the auto-save-location skip guard to all recognize the new `'coordinate'` `searchMode` value.
- `essentials_coordinate_searched` PostHog event captures `{method, outcome, code?}` only — no raw `{lat, lng}` on either entry point (T-214-02).
- Full production build green; full Vitest suite green (256/256, 14 files).

## Task Commits

All three tasks were implemented as one cohesive, atomic change (see Deviations — Task 1's combobox wiring calls `resolveCoordinate` from Task 2, and Task 3 calls that same shared function, so a buildable intermediate state per task did not exist within this single-file plan):

1. **Tasks 1-3: LocationCombobox header swap + shared resolveCoordinate render path (SRCH-01, SRCH-05)** - `7d48f959` (feat)

_No plan-metadata commit yet — this SUMMARY/STATE/ROADMAP commit follows below per the executor's final_commit step._

## Files Created/Modified
- `src/pages/Results.jsx` - Header rewired to a single `<LocationCombobox>`; Google Places hook/ref, `LocationBrowser`, `LocalityMatches`, and the mode-toggle/chip-edit UI all removed; shared `resolveCoordinate()` + on-mount `lat`/`lng`/`coord_raw` reader added; `representingCity`/`list`/`phase`/`locationKey`/auto-save guards extended for the new `'coordinate'` mode.

## Decisions Made
See frontmatter `key-decisions` for full rationale. Summary:
- Removed the collapsed-chip/pencil-edit toggle entirely (not just the mode-toggle buttons) per D-03's explicit rejection of a pill→input display/edit state machine; tribal-land badge + elections summary preserved as an unconditional info row.
- Coordinate mode does not write `lat`/`lng` into the URL for in-page submits — only the Landing hand-off does, and `resolveCoordinate` strips those params once consumed.
- `representingCity`'s coordinate branch returns `null` (no fabricated banner label) rather than deriving anything from the typed coordinates — a different surface from the D-05 input resting label.
- Extended `locationKey` to include the coordinate label so consecutive different coordinate searches don't share a stale stance cache.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Extended `locationKey`'s stance-cache-reset key for coordinate mode**
- **Found during:** Task 2 (wiring `resolveCoordinate`'s direct-injection into the existing `browseResults` mechanism)
- **Issue:** `locationKey` (`${searchMode}|${activeQuery}|${browseArea?.geo_id}|${browseArea?.mtfcc}`) resets the per-politician `stancesByPolId` cache on location change. Coordinate results carry no `geo_id`/`mtfcc`/`q` param, so two different coordinate searches back-to-back would produce an IDENTICAL key (`coordinate||||`) and the second search's cards would render the first search's stale cached stances.
- **Fix:** Appended the typed coordinate label (`addressInput` when `searchMode === 'coordinate'`) to `locationKey` so each distinct coordinate search gets a distinct cache-reset key.
- **Files modified:** `src/pages/Results.jsx`
- **Verification:** `npm run build` + `npm test` (256/256) green; manual code-path trace confirmed the key now differs across two different typed coordinates.
- **Committed in:** `7d48f959`

**2. [Rule 1 - Bug] Removed a now-stale `LocationBrowser` reference inside an unrelated code comment**
- **Found during:** Self-check grep for the Task 1 acceptance criterion (`LocationBrowser` must return zero matches)
- **Issue:** A comment on the `browseArea` state declaration ("captured from URL shortcut params OR from the LocationBrowser callback") still referenced the deleted `LocationBrowser` component after its only call site was removed, which would have failed the plan's own acceptance-criteria grep.
- **Fix:** Rewrote the comment to drop the dangling reference.
- **Files modified:** `src/pages/Results.jsx`
- **Verification:** `grep -n "LocationBrowser\|useGooglePlacesAutocomplete\|<LocalityMatches" src/pages/Results.jsx` returns zero.
- **Committed in:** `7d48f959`

**3. [Process note] Tasks 1-3 landed in a single commit, not three**
- **Found during:** Pre-commit review
- **Issue:** The plan's `<task_commit_protocol>` calls for a commit per task, but Task 1's JSX wires `onSubmitCoordinate` to `resolveCoordinate` (defined in Task 2), and Task 3's on-mount effect calls that same shared function. Committing Task 1 alone would have left `resolveCoordinate` referenced-but-undefined at that commit — not a genuinely buildable intermediate state, and the plan's own design intent (ONE shared function, no duplicated logic) makes the three tasks a single indivisible unit within this one file.
- **Resolution:** Implemented and verified (`npm run build` + `npm test`) all three tasks together, then made one atomic commit covering all three. All three tasks' acceptance criteria were individually grep-verified against the final state (see Self-Check).
- **Impact:** No scope or behavior change — purely a commit-granularity accommodation forced by the tasks' designed interdependency.

---

**Total deviations:** 2 auto-fixed (2 bugs), 1 process note (commit granularity)
**Impact on plan:** Both auto-fixes were necessary corrections directly caused by this plan's own new `'coordinate'` mode value; no scope creep beyond `src/pages/Results.jsx`.

## Issues Encountered
None beyond the items documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Results.jsx now consumes `LocationCombobox`, `browseAreaRoute`, and `lookupCoordinate` exactly per the Plan 01/02 contracts; no changes needed to those exports.
- The on-mount reader confirms the Plan 02 `coordinateRoute` param names (`lat`/`lng`/`coord_raw`) work end-to-end — Plan 04 (Landing, the `coordinateRoute` writer) can build its navigation call with confidence this contract is live-tested from the reading side.
- `resolveCoordinate`'s `{method}` option (`'combobox'` vs `'url_handoff'`) is available if Plan 06's verification wants to distinguish entry points in analytics review.
- No blockers for Plan 04 (Landing LocationCombobox adoption) or Plan 05 (final Google Places deletions — `useGooglePlacesAutocomplete.js`, `.pac-container` CSS, `@googlemaps/js-api-loader` uninstall, `LocationBrowser.jsx`/`LocalityMatches.jsx` deletion). Results.jsx no longer imports any of those four files, so Plan 05 can delete them without touching this file again.

## Known Stubs
None - the coordinate render path is fully wired end-to-end (lookup, direct-injection render, error messaging, banner guard); no placeholder data paths or TODO copy introduced.

## Threat Flags
None beyond this plan's own `<threat_model>` (T-214-02/T-214-05/T-214-06, all mitigated per the acceptance-criteria greps above — no raw-coordinate telemetry, no attacker-controlled navigation target, explicit coordinate-mode banner guard).

## Self-Check: PASSED

- FOUND: src/pages/Results.jsx
- FOUND commit: 7d48f959
- `grep -n "LocationBrowser\|useGooglePlacesAutocomplete\|<LocalityMatches" src/pages/Results.jsx` → zero matches
- `grep -c "<LocationCombobox" src/pages/Results.jsx` → 1
- `grep -n "addressInputRef" src/pages/Results.jsx` → zero matches
- `grep -n "resolveCoordinate" src/pages/Results.jsx` → single definition + 2 call sites (combobox submit, on-mount reader)
- `grep -n "lookupCoordinate" src/pages/Results.jsx` → single call site, inside `resolveCoordinate`
- `grep -n "coord_raw" src/pages/Results.jsx` → on-mount effect reads it alongside `lat`/`lng`
- `grep -niE "capture\(|posthog" src/pages/Results.jsx | grep -i coord` → only `essentials_coordinate_searched` with `{method, outcome, code?}`, no raw lat/lng
- `npm run build` → succeeds
- `npm test` → 256/256 passed (14 files)

---
*Phase: 214-unified-location-combobox-google-places-removal*
*Completed: 2026-07-21*
