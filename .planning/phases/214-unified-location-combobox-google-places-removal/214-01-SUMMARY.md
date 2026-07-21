---
phase: 214-unified-location-combobox-google-places-removal
plan: 01
subsystem: api
tags: [vitest, publicFetch, classifier, location-search, coordinate-lookup]

# Dependency graph
requires:
  - phase: 212-backend-place-name-resolver
    provides: "Live GET /essentials/location-search resolver endpoint"
  - phase: 213-anonymous-coordinate-lookup-endpoint
    provides: "Live POST /essentials/coordinate-lookup endpoint"
provides:
  - "src/lib/inputClassifier.js — pure classifyInput(raw) contract for the combobox"
  - "src/lib/api.jsx searchLocationsByName() + lookupCoordinate() client functions"
  - "Colocated Vitest coverage for both, closing the Wave 0 test gaps"
affects: [214-02, 214-03, 214-04, 214-05, 214-06, location-combobox, results-page, landing-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure, zero-import classifier module tested with colocated Vitest (mirrors src/lib/classify.js)"
    - "api.jsx network functions mocked via vi.mock('./auth') rather than global.fetch"

key-files:
  created:
    - src/lib/inputClassifier.js
    - src/lib/inputClassifier.test.js
    - src/lib/api.test.js
  modified:
    - src/lib/api.jsx

key-decisions:
  - "ADDRESS_LEADING_DIGIT_RE widened to /^\\s*-?\\d+(?:\\.\\d+)?\\s+\\S/ (adds an optional decimal group) so a comma-less coordinate pair like \"39.17 -86.52\" classifies as address per the plan's documented-gap acceptance criterion — RESEARCH.md's manual trace of the original integer-only regex was incorrect (it does not match decimal-leading strings)."
  - "Guarded api.jsx's top-level window.__API_LOGGED__ debug block with typeof window !== 'undefined' so the module can be imported under Vitest's default node test environment (no jsdom dependency added)."
  - "api.test.js mocks the ./auth module's publicFetch directly (vi.mock) rather than global.fetch — avoids needing to reconstruct API_BASE/Vite-proxy behavior in the test."

patterns-established:
  - "Pure classifier + colocated Vitest test, zero DOM, zero imports — reusable template for future client-side classifiers."
  - "vi.mock('./auth') as the standard way to unit-test any api.jsx function without hitting the network."

requirements-completed: [SRCH-03, SRCH-04, SRCH-05]

# Metrics
duration: 22min
completed: 2026-07-21
---

# Phase 214 Plan 01: Input Classifier & API Client Foundations Summary

**Pure `classifyInput()` combobox classifier plus `searchLocationsByName`/`lookupCoordinate` anonymous `api.jsx` client functions, both live-curl-verified against the real Phase 212/213 endpoints and fully covered by 29 new colocated Vitest cases.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-07-21T17:18:50Z (approx, from prior plan-finalize commit)
- **Completed:** 2026-07-21T17:40:34Z
- **Tasks:** 2 completed
- **Files modified:** 4 (2 created classifier pair, 1 created test, 1 modified + 1 created for api)

## Accomplishments
- `classifyInput(raw)` buckets any string into `empty` / `coordinate` / `address` / `name`, zero imports, zero side effects, 14 passing Vitest cases including the two documented v1-tradeoff edge cases ("5 Points", comma-less coordinates).
- `searchLocationsByName()` and `lookupCoordinate()` appended to `api.jsx`, both using `publicFetch` (never `apiFetch`), both live-curl-verified against `accounts-api.empowered.vote` to confirm the exact response envelope shape.
- 15 new Vitest cases in `api.test.js` cover both response envelopes for `searchLocationsByName`, all 3 coordinate 422 codes plus the unparseable/missing-code default, the non-422 non-ok path, and the thrown-fetch path for both functions.
- Full suite (256 tests, 14 files) and production build both green after the additions.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure input classifier + unit tests (SRCH-03)** - `074f6735` (feat)
2. **Task 2: searchLocationsByName + lookupCoordinate api clients + tests (SRCH-04, SRCH-05)** - `316a568f` (feat)

_No plan-metadata commit yet — this SUMMARY/STATE/ROADMAP commit follows below per the executor's final_commit step._

## Files Created/Modified
- `src/lib/inputClassifier.js` - Pure `classifyInput(raw)` -> `{kind, lat?, lng?}` classifier; no imports.
- `src/lib/inputClassifier.test.js` - 14 Vitest cases, one `describe` per kind plus a documented-gap block.
- `src/lib/api.jsx` - Added `searchLocationsByName(query)` and `lookupCoordinate(lat, lng)`; guarded the top-level `window.__API_LOGGED__` debug block for non-browser import contexts.
- `src/lib/api.test.js` - New file; 15 Vitest cases mocking `./auth`'s `publicFetch`.

## Decisions Made
- Widened `ADDRESS_LEADING_DIGIT_RE` to accept an optional decimal component so a comma-less coordinate pair classifies as `address` (matches the plan's explicit behavior-block acceptance criterion; RESEARCH.md's hand-traced regex behavior for this case was wrong — verified by running the original regex and observing `name` instead of the specified `address`).
- Live-curl spot-check performed for both endpoints (RESEARCH A1/A2/A3):
  - `GET /essentials/location-search?q=Springfield` → 200, bare JSON array (each candidate additionally carries an `area_type` field not in the documented contract — harmless extra field, defensive unwrap ignores it).
  - `POST /essentials/coordinate-lookup {lat:39.17,lng:-86.52}` → 200, `{politicians:[...], matchedAddress:"", ...}` shape, confirming the wrapped-object unwrap path (not the flat-array path) is what production actually returns for this endpoint today.
  - No adjustment to the defensive unwrap was needed — both shapes were already tolerated.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Guarded api.jsx's top-level `window` reference so the module is importable under Vitest's default (node) test environment**
- **Found during:** Task 2 (writing `api.test.js`)
- **Issue:** `src/lib/api.jsx` line 4 unconditionally reads `window.__API_LOGGED__` at module load. Vitest's default environment for this project is `node` (no jsdom dependency installed), so `import ... from './api.jsx'` threw `ReferenceError: window is not defined` before any test could even run — this blocked writing the task's required `api.test.js` entirely.
- **Fix:** Wrapped the debug-log block in `typeof window !== 'undefined' && ...`. No behavior change in the browser (still logs exactly once); safe no-op under Node.
- **Files modified:** `src/lib/api.jsx`
- **Verification:** `npx vitest run src/lib/api.test.js` (15/15 pass) and full `npm test` (256/256 pass).
- **Committed in:** `316a568f` (Task 2 commit)

**2. [Rule 1 - Bug] Widened `ADDRESS_LEADING_DIGIT_RE` to include an optional decimal group**
- **Found during:** Task 1 (writing `inputClassifier.test.js`'s documented-gap case for "39.17 -86.52")
- **Issue:** The plan's behavior block requires `"39.17 -86.52"` (no comma) to classify as `address` per Open Question 2. RESEARCH.md's drafted regex `/^\s*\d+\s+\S/` was hand-traced in the research doc as matching this case, but `\d+` only matches integer digits — it stops at the decimal point in `"39.17"`, so the required trailing `\s+` never lines up and the original regex actually falls through to `name`. Running the regex confirmed the mismatch against the plan's specified acceptance criterion.
- **Fix:** Changed the regex to `/^\s*-?\d+(?:\.\d+)?\s+\S/` (optional leading `-`, optional decimal fraction). Re-verified all other behavior-block cases still pass (leading street numbers, "5 Points", "5th Ward", bare ZIPs, comma-separated coordinates checked first by `COORDINATE_RE`).
- **Files modified:** `src/lib/inputClassifier.js`
- **Verification:** `npx vitest run src/lib/inputClassifier.test.js` (14/14 pass, including both documented-gap cases).
- **Committed in:** `074f6735` (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary to satisfy this plan's own stated acceptance criteria and unblock the required test deliverables. No scope creep — neither touched any file outside this plan's `files_modified` list.

## Issues Encountered
None beyond the two auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `classifyInput()` and both `api.jsx` client functions exist with the exact contracts specified in this plan's `<interfaces>` block, ready for `LocationCombobox.jsx` (214-02+) to import directly.
- Live envelope shapes for both Phase 212/213 endpoints are confirmed (bare array for location-search; `{politicians, matchedAddress}` for coordinate-lookup) — downstream plans do not need to re-verify this.
- No blockers for Wave 1+ (LocationCombobox component build, Results/Landing wiring, Google Places removal).

## Known Stubs
None - both new modules are fully wired, pure/network functions with no placeholder data paths.

## Threat Flags
None - both new functions operate strictly within the trust boundary already registered in this plan's `<threat_model>` (T-214-01/T-214-02); no new endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- FOUND: src/lib/inputClassifier.js
- FOUND: src/lib/inputClassifier.test.js
- FOUND: src/lib/api.jsx
- FOUND: src/lib/api.test.js
- FOUND: .planning/phases/214-unified-location-combobox-google-places-removal/214-01-SUMMARY.md
- FOUND commit: 074f6735
- FOUND commit: 316a568f

---
*Phase: 214-unified-location-combobox-google-places-removal*
*Completed: 2026-07-21*
