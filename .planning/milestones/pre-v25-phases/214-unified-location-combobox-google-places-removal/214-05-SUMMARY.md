---
phase: 214-unified-location-combobox-google-places-removal
plan: 05
subsystem: ui
tags: [google-places-removal, css, npm-uninstall, dead-code-deletion]

# Dependency graph
requires:
  - phase: 214-03
    provides: "Results.jsx rewired to shared LocationCombobox; no remaining imports of useGooglePlacesAutocomplete/LocationBrowser/LocalityMatches"
  - phase: 214-04
    provides: "Landing.jsx rewired to shared LocationCombobox; no remaining imports of useGooglePlacesAutocomplete/LocalityMatches"
provides:
  - "Google Places retirement complete: useGooglePlacesAutocomplete.js, LocationBrowser.jsx, LocalityMatches.jsx deleted (zero remaining consumers)"
  - "src/index.css Google-free — .pac-container/.pac-item*/.pac-icon/.pac-matched block removed in two non-contiguous edits, .ev-candidate-enter animation intact"
  - "@googlemaps/js-api-loader uninstalled from package.json + package-lock.json (npm uninstall, clean regeneration)"
  - "src/lib/coverage.js stale 'Google address autocomplete' comment reworded"
  - "SRCH-08 scoped acceptance gate (pac-container|pac-item|window.google|@googlemaps) verified zero hits across src/, package.json, package-lock.json"
  - "Secondary bare-word 'google' sanity grep across src/ verified to match ONLY the documented Google Civic Information API surface (VoterResourcesCard.jsx, voterResourceLinks.js, buildingImages.js)"
affects: [214-06]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  modified:
    - src/index.css
    - src/lib/coverage.js
    - src/lib/localitySearch.js
    - src/pages/Landing.jsx
    - package.json
    - package-lock.json
  deleted:
    - src/hooks/useGooglePlacesAutocomplete.js
    - src/components/LocationBrowser.jsx
    - src/components/LocalityMatches.jsx

key-decisions:
  - "The plan's own acceptance criteria for the Task 2 secondary sanity grep enumerate an exact allow-list of files permitted to still say 'google' (the unrelated Google Civic Information API surface). Two files outside that list — src/lib/localitySearch.js and src/pages/Landing.jsx — turned up because Plans 03/04 left explanatory comments that name-checked 'Google' while describing its retirement (e.g. 'Google Geocoder', 'resolveLocalityRoute Google detour'). Treated as a Rule 1 auto-fix: reworded both comments to describe the retired third-party geocoder without naming it, rather than treating the plan's allow-list as merely illustrative. This keeps the SRCH-08 gate meaningfully strict (a future stray Google reference will still be caught) rather than quietly expanding the allow-list to match what happened to be present."

patterns-established: []

requirements-completed: [SRCH-08]

# Metrics
duration: 25min
completed: 2026-07-21
---

# Phase 214 Plan 05: Google Places Retirement & SRCH-08 Acceptance Gate Summary

**Deleted the three now-orphaned Google Places modules (`useGooglePlacesAutocomplete.js`, `LocationBrowser.jsx`, `LocalityMatches.jsx`), removed the non-contiguous `.pac-container` CSS block from `index.css` while preserving the unrelated `.ev-candidate-enter` animation, uninstalled `@googlemaps/js-api-loader` via `npm uninstall`, and ran the SRCH-08 scoped + secondary sanity grep gates (fixing two stray comment references outside the documented Civic-API allow-list) — full build and 256/256 test suite green.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-21 (immediately following 214-04's completion)
- **Completed:** 2026-07-21T18:49:23Z
- **Tasks:** 2 completed
- **Files modified:** 8 (3 deleted, 5 modified)

## Accomplishments
- Confirmed via re-grep that `useGooglePlacesAutocomplete`, `LocationBrowser`, and `LocalityMatches` had zero remaining consumers after Plans 03/04, then deleted all three files (`git rm`).
- Removed the `.pac-container` / `.pac-item` / `.pac-item:first-child` / `.pac-item:hover` / `.pac-item-selected` / `.pac-matched` / `.pac-icon` rules AND the separate, non-contiguous `.pac-item-query` rule from `src/index.css` as two distinct edits — the `.ev-candidate-enter` keyframes/class sandwiched between them survived untouched (verified by grep before and after).
- Reworded the stale `src/lib/coverage.js` comment ("Google address autocomplete owns that path") to describe the leading-digit skip behavior generically, with zero change to `searchCoverageAreas`'s logic.
- Ran `npm uninstall @googlemaps/js-api-loader` (not a manual edit) — `package.json` and `package-lock.json` both regenerated with zero `@googlemaps` references.
- `npm run build` succeeded after all deletions (no dangling imports).
- Ran the SRCH-08 scoped acceptance gate (`pac-container|pac-item|window.google|@googlemaps` across `src/`, `package.json`, `package-lock.json`) — zero hits.
- Ran the secondary bare-word `google` sanity grep across `src/` — initially caught two undocumented files (`src/lib/localitySearch.js`, `src/pages/Landing.jsx`) with explanatory comments left over from Plans 03/04 that name-checked "Google" while describing its retirement. Reworded both (Rule 1 auto-fix) so the secondary grep now matches ONLY the plan's documented allow-list.
- Full Vitest suite green (256/256, 14 files) after both tasks.

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete orphaned Google modules, remove .pac CSS block, reword coverage.js comment, uninstall dependency** - `c0fc0d64` (feat)
2. **Task 2: SRCH-08 scoped grep gate + full-suite regression (incl. Rule 1 comment-reword fix)** - `30bd3de9` (fix)

_No plan-metadata commit yet — this SUMMARY/STATE/ROADMAP commit follows below per the executor's final_commit step._

## Files Created/Modified
- `src/hooks/useGooglePlacesAutocomplete.js` - DELETED (orphaned, zero consumers)
- `src/components/LocationBrowser.jsx` - DELETED (orphaned, zero consumers)
- `src/components/LocalityMatches.jsx` - DELETED (orphaned, zero consumers)
- `src/index.css` - `.pac-container`/`.pac-item*`/`.pac-icon`/`.pac-matched`/`.pac-item-query` block removed in two non-contiguous edits; `.ev-candidate-enter` animation preserved
- `src/lib/coverage.js` - Stale "Google address autocomplete" comment reworded; no logic change
- `src/lib/localitySearch.js` - Two comments reworded to drop stray "Google"/"Google Geocoder" references (Rule 1 fix, Task 2)
- `src/pages/Landing.jsx` - One comment reworded to drop a stray "Google detour" reference (Rule 1 fix, Task 2)
- `package.json` / `package-lock.json` - `@googlemaps/js-api-loader` uninstalled via `npm uninstall`

## Decisions Made
See frontmatter `key-decisions` for full rationale. Summary: treated the plan's Task 2 allow-list (VoterResourcesCard.jsx, voterResourceLinks.js, buildingImages.js) as an exact list to enforce, not a loose example — two stray comment references outside it were reworded rather than left in place or used to justify expanding the allow-list.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Reworded stray "Google" references in two undocumented files caught by the secondary sanity grep**
- **Found during:** Task 2 (running the secondary bare-word `grep -rin google src/` sanity check)
- **Issue:** The plan's Task 2 acceptance criteria require the secondary grep to list ONLY `VoterResourcesCard.jsx`, `voterResourceLinks.js`, and optionally `buildingImages.js`. The actual grep also matched `src/lib/localitySearch.js` (three comments: "Google Places' Geocoder classification is retired", "Two Google-free routing helpers", "instead of the Google Geocoder") and `src/pages/Landing.jsx` (one comment: "resolveLocalityRoute Google detour"). These were explanatory comments added by Plans 03/04 while documenting the retirement of Google-based classification — not actual Google Places code — but they violated the plan's own acceptance gate as written.
- **Fix:** Reworded all four comment lines across the two files to describe the retired third-party geocoder generically ("the third-party geocoder-based classification", "the retired third-party geocoder", "resolveLocalityRoute third-party-geocoder detour") without naming Google, preserving the exact same explanatory content and intent.
- **Files modified:** `src/lib/localitySearch.js`, `src/pages/Landing.jsx`
- **Verification:** `grep -rin google src/` re-run — now lists exactly `VoterResourcesCard.jsx`, `voterResourceLinks.js`, `buildingImages.js`, matching the plan's allow-list precisely. `npm run build` + `npm test` (256/256) re-verified green after the fix.
- **Committed in:** `30bd3de9` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary correction to satisfy the plan's own Task 2 acceptance criteria exactly as written. No scope creep — only comment text changed, zero logic/behavior change in either file.

## Issues Encountered
None beyond the item documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Google Places is fully retired end-to-end: no orphaned modules, no `.pac-container`/`.pac-item*` CSS, no `@googlemaps` dependency in `package.json`/`package-lock.json`, and the scoped + secondary SRCH-08 grep gates both pass cleanly.
- The only remaining "google" hits anywhere in `src/` are the unrelated, intentionally-kept Google Civic Information API surface (`VoterResourcesCard.jsx`, `voterResourceLinks.js`, `buildingImages.js`'s address-format comment) — a genuinely different feature, untouched by this plan.
- Full production build and full Vitest suite (256/256) are green — no blockers for Plan 06 (final phase-level manual smoke checkpoint).

## SRCH-08 Acceptance Evidence

**Scoped gate** (`grep -rnE "pac-container|pac-item|window[.]google|@googlemaps" src/ package.json package-lock.json`):
```
SRCH-08 SCOPED GATE: PASS (zero hits)
```

**Secondary sanity grep** (`grep -rin "google" src/`), after the Rule 1 comment-reword fix:
```
src/components/VoterResourcesCard.jsx:6: * (any US address). Data: /api/essentials/voter-info (Google Civic / Voting
src/components/VoterResourcesCard.jsx:10: *   - pollingLocations  = Election Day. In precinct-based states Google returns
src/components/VoterResourcesCard.jsx:60:  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
src/components/VoterResourcesCard.jsx:249:            Voting-location data comes from the Voting Information Project via the Google Civic Information API, which controls when it's released.
src/lib/buildingImages.js:663:  // 80202", and Google's "…, CO 80202, USA".
src/lib/voterResourceLinks.js:4: * Used by VoterResourcesCard as the always-available fallback when the Google
```
Matches exactly the plan's documented allow-list — no other file.

**Full test suite** (`npm test`):
```
 Test Files  14 passed (14)
      Tests  256 passed (256)
```

## Known Stubs
None - all deletions and edits are complete, functional changes with no placeholder data paths.

## Threat Flags
None beyond this plan's own `<threat_model>` (T-214-SC accepted — npm uninstall removes an existing dependency, introduces nothing new; T-214-08 mitigated — the two-edit `.pac-container` deletion preserved `.ev-candidate-enter`, verified by grep before/after each edit).

## Self-Check: PASSED

- MISSING (expected — deleted by design): src/hooks/useGooglePlacesAutocomplete.js
- MISSING (expected — deleted by design): src/components/LocationBrowser.jsx
- MISSING (expected — deleted by design): src/components/LocalityMatches.jsx
- FOUND commit: c0fc0d64
- FOUND commit: 30bd3de9
- `grep -nE "pac-container|pac-item|pac-icon|pac-matched" src/index.css` → zero matches
- `grep -n "ev-candidate-enter" src/index.css` → 3 hits (keyframes + class + animation property) — animation intact
- `grep -in "google" src/lib/coverage.js` → zero matches
- `grep -n "@googlemaps" package.json package-lock.json` → zero matches
- `grep -rnE "pac-container|pac-item|window[.]google|@googlemaps" src/ package.json package-lock.json` → zero matches
- `grep -rin "google" src/` → exactly VoterResourcesCard.jsx (4 lines), buildingImages.js (1 line), voterResourceLinks.js (1 line) — no other file
- `npm run build` → succeeds
- `npm test` → 256/256 passed (14 files)

---
*Phase: 214-unified-location-combobox-google-places-removal*
*Completed: 2026-07-21*
