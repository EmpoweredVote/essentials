---
phase: 214-unified-location-combobox-google-places-removal
plan: 02
subsystem: ui
tags: [react, floating-ui, combobox, wai-aria, google-places-removal]

# Dependency graph
requires:
  - phase: 214-01
    provides: "classifyInput() classifier + searchLocationsByName()/lookupCoordinate() api.jsx client functions"
provides:
  - "src/components/LocationCombobox.jsx — shared, fully-controlled WAI-ARIA combobox for Results header + Landing search bar"
  - "src/lib/localitySearch.js — Google-free; browseAreaRoute(candidate) + coordinateRoute(lat,lng,raw) cross-page hand-off contract"
affects: [214-03, 214-04, 214-05, 214-06, results-page, landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useListNavigation({virtual:true}) + useRole('listbox') as the project's canonical accessible-combobox pattern, superseding LocalityMatches' document-level keydown-capture hack"
    - "Network-call gating: debounce effect checks classifyInput(value).kind before the setTimeout fires, not just before rendering — prevents address/coordinate keystrokes from ever reaching the resolver"

key-files:
  created:
    - src/components/LocationCombobox.jsx
  modified:
    - src/lib/localitySearch.js

key-decisions:
  - "resolveLocalityRoute() was REFACTORED IN PLACE, not deleted: Results.jsx and Landing.jsx (files_modified in Plans 03/04, not this plan) both currently `import { resolveLocalityRoute }` and call it synchronously in their existing handleAddressSearch/handleSearch flows. Deleting the export would break `npm run build` for this plan today, before those pages are rewired. The function's Google Geocoder classification step was replaced with classifyInput() + a live searchLocationsByName() lookup, but its outer {kind:'address'|'browse'|'coverage', to} contract is unchanged, so the current call sites keep working unmodified until Plans 03/04 replace them outright."
  - "coordinateRoute's exact URL-param names are lat, lng, coord_raw — built via URLSearchParams (not manual encodeURIComponent + string concatenation) so every value is percent-encoded automatically. Plans 03/04 MUST wire against these exact three param names."
  - "browseAreaRoute(candidate) now consumes the LIVE /location-search candidate shape directly ({geo_id, mtfcc, label, state, has_local_data}) and no longer strips TIGER suffixes via cleanAreaName() — the resolver's `label` field is already the clean, fully-composed display string (confirmed via a live curl: e.g. \"City of Springfield, Massachusetts, US, MA · City\")."
  - "LocationCombobox's candidate row renders candidate.label as a single bold-teal string WITHOUT appending a separate `, {state}` qualifier. The live resolver's label already bakes in the state and area-type suffix (see decision above) — appending it again would visibly duplicate the state abbreviation right after itself. This is a deliberate, documented divergence from the plan's literal 'bold teal label + `, ${state}`' phrasing (written before the live label format was curl-verified in 214-01), applying deviation Rule 1 (visible UI defect). The separately-specified area-type tag and Stances badge (both explicit UI-SPEC requirements, independent of what's baked into label text) are still rendered as distinct elements."
  - "Candidate row area-type tag is derived from mtfcc (G4110/G4120->city, G4020->county, empty/other->state/area) per the plan's explicit instruction, hidden for 'city' (the overwhelmingly common case) exactly matching LocalityMatches' original display rule."

patterns-established:
  - "useFloating({placement:'bottom-start', middleware:[offset(4), flip({padding:8}), size({apply...})], whileElementsMounted: autoUpdate}) + useListNavigation({virtual:true}) as the reusable accessible-listbox skeleton for any future combobox in this codebase."

requirements-completed: [SRCH-02, SRCH-03, SRCH-04, SRCH-05]

# Metrics
duration: 10min
completed: 2026-07-21
---

# Phase 214 Plan 02: LocationCombobox & Google-Free Locality Routing Summary

**Shared, fully-controlled `<LocationCombobox>` (WAI-ARIA combobox + `useListNavigation({virtual:true})`) wired to the Plan 01 classifier/API client, plus a Google-free `localitySearch.js` exposing `browseAreaRoute` and the new `coordinateRoute` cross-page hand-off contract (`lat`/`lng`/`coord_raw`).**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-21T10:49:27-07:00 (prior plan-finalize commit)
- **Completed:** 2026-07-21T10:59:29-07:00
- **Tasks:** 2 completed
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- `src/components/LocationCombobox.jsx` — a new, fully-controlled (`value`/`onChange` only, zero imperative DOM writes) accessible combobox with `role="combobox"` + `aria-expanded`/`aria-controls`/`aria-autocomplete`/`aria-activedescendant`, positioned via `@floating-ui/react`'s `useFloating` (bottom-start, `offset(4)`/`flip({padding:8})`/`size()` width-match) and keyboard-navigated via `useListNavigation({virtual:true})` — no reintroduced document-level keydown capture.
- Debounced (~250ms) name-search gated on `classifyInput(value).kind === 'name' && length >= 3`, calling the Plan 01 `searchLocationsByName()`; candidate rows lift `LocalityMatches`' visual markup (bold teal label, mtfcc-derived area-type tag, `has_local_data` → "Stances" badge).
- Inline hint rows: "Press Enter to look up this address" / "...this location" for address/coordinate-classified input (no resolver call fires for either), a coral no-match row with the exact UI-SPEC copy for zero-candidate name queries, and a host-supplied `errorRow` slot for coordinate 422s.
- Enter/Search-click dispatches by classified kind: `onSubmitAddress(raw)`, `onSubmitCoordinate(lat, lng, raw)`, or `onSelectCandidate(candidate)` (name kind with an active/first row).
- `src/lib/localitySearch.js` refactored: the `@googlemaps/js-api-loader` import and the Geocoder-based `classifyQuery()` are gone entirely. Added `coordinateRoute(lat, lng, raw)` — the single SRCH-05 cross-page coordinate hand-off URL (`/results?lat=...&lng=...&coord_raw=...`, built via `URLSearchParams` so all values are percent-encoded). `browseAreaRoute(candidate)` now exported and adapted to the live `/location-search` candidate shape.
- Full production build green; full Vitest suite green (256/256, 14 files) after both changes.

## Task Commits

Each task was committed atomically:

1. **Task 1: LocationCombobox accessible component (SRCH-02/03/04)** - `7b2716ee` (feat)
2. **Task 2: Refactor localitySearch.js — drop Google classifyQuery, expose browseAreaRoute + coordinateRoute** - `3e326337` (refactor)

_No plan-metadata commit yet — this SUMMARY/STATE/ROADMAP commit follows below per the executor's final_commit step._

## Files Created/Modified
- `src/components/LocationCombobox.jsx` - New shared accessible combobox (Results header + Landing search bar).
- `src/lib/localitySearch.js` - Google dependency removed; `browseAreaRoute` exported/adapted; `coordinateRoute` added; `resolveLocalityRoute` refactored in place (Google Geocoder → classifyInput + live resolver), outer contract unchanged.

## Decisions Made
See frontmatter `key-decisions` for full rationale. Summary:
- `resolveLocalityRoute` kept (refactored, not deleted) — Results.jsx/Landing.jsx still call it today and aren't rewired until Plans 03/04; deleting it would have broken this plan's own `npm run build` gate.
- `coordinateRoute`'s exact param names for Plans 03/04 to wire against: **`lat`, `lng`, `coord_raw`**.
- Candidate row rendering drops the plan's literal `, ${state}` append since the live resolver's `label` field already bakes in the state + area-type suffix (curl-verified against production); appending it again visibly duplicated the state abbreviation. Area-type tag and Stances badge are still rendered as separate elements per UI-SPEC.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Dropped the literal `, ${state}` append in candidate rows to avoid visible state-abbreviation duplication**
- **Found during:** Task 1 (building the candidate-row markup)
- **Issue:** The plan's Task 1 action text says to render "bold teal label + `, ${state}`" (mirroring `LocalityMatches`' old static-catalog markup, where `area.label` was a bare name with no state suffix). A live curl of the production `/location-search` endpoint (`GET .../location-search?q=Springfield`) showed the actual `label` field already contains the full composed string, e.g. `"City of Springfield, Massachusetts, US, MA · City"` — appending `, ${candidate.state}` on top would render `"...US, MA · City, MA"`, a visible duplicate of the state abbreviation immediately after itself.
- **Fix:** Render `candidate.label` alone as the bold teal text; kept the separately-specified area-type tag (mtfcc-derived) and `has_local_data` "Stances" badge as distinct elements, since UI-SPEC requires those as independent rendered elements regardless of what's baked into the label text.
- **Files modified:** `src/components/LocationCombobox.jsx`
- **Verification:** Visual review of the rendered candidate row string against the live curl response; `npm run build` green.
- **Committed in:** `7b2716ee` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Cosmetic-correctness fix only; no scope creep, no change to the component's props/exports contract, no change to any acceptance-criteria grep target.

## Issues Encountered
None beyond the one auto-fixed deviation above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `<LocationCombobox>` exports exactly the props contract Plans 03/04 need (`value`, `onChange`, `onSubmitAddress`, `onSubmitCoordinate`, `onSelectCandidate`, `placeholder?`, `ariaLabel?`, `errorRow?`) and is ready to drop into `Results.jsx`/`Landing.jsx`.
- `coordinateRoute(lat, lng, raw)` is live with confirmed param names `lat`/`lng`/`coord_raw` — Plan 03 (Results, the reader) and Plan 04 (Landing, the writer) can both build against this without depending on each other in the same wave.
- `browseAreaRoute(candidate)` is exported and already adapted to the live candidate shape — ready for Plans 03/04's candidate-select dispatch.
- `resolveLocalityRoute` still works (Google-free) for the CURRENT, not-yet-rewired `Results.jsx`/`Landing.jsx` call sites; Plans 03/04 are expected to bypass it in favor of the combobox's own dispatch, per RESEARCH.md's Dispatch Wiring section — no action required here, just noting it remains a live, working fallback path in the interim.
- No blockers for Wave 2+ (Results.jsx / Landing.jsx wiring, remaining Google-removal deletions: `useGooglePlacesAutocomplete.js`, `.pac-container` CSS, `@googlemaps/js-api-loader` uninstall, `LocationBrowser.jsx` deletion — all out of this plan's `files_modified` scope).

## Known Stubs
None - `LocationCombobox.jsx` is not yet mounted on any page (that's Plans 03/04's job), but it contains no placeholder data paths, hardcoded empty values, or TODO/coming-soon copy — it is a complete, self-contained component ready for host wiring.

## Threat Flags
None beyond what this plan's own `<threat_model>` already registers (T-214-03/04/05, all mitigated per the acceptance-criteria greps and the `URLSearchParams`-only construction of both routing helpers). No new endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- FOUND: src/components/LocationCombobox.jsx
- FOUND: src/lib/localitySearch.js
- FOUND commit: 7b2716ee
- FOUND commit: 3e326337

---
*Phase: 214-unified-location-combobox-google-places-removal*
*Completed: 2026-07-21*
