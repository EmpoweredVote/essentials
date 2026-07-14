---
phase: 204-compass-lens-switcher
plan: 01
subsystem: compass

tags: [react, vitest, compass, lens-switcher, pure-functions]

# Dependency graph
requires: []
provides:
  - "LENS_FALLBACKS: name/description/color/topicIds/autoDistrictTypes for local/federal/judicial, mirroring EV-CompassV2 lenses.js"
  - "sanitizeLensColor: hex-only allowlist for API-supplied lens colors (T-204-02)"
  - "normalizeApiLens: defensive shape mapper for GET /compass/lenses rows"
  - "isLensCalibrated: min(8, lens.topicIds.length) calibration-readiness check (Req 4)"
  - "ev:compassLens / ev:compassLensPending persistence helpers (saveLensSelection/loadLensSelection/saveLensPending/loadLensPending/clearLensPending) with knownKeys validation (T-204-01, Req 11)"
  - "Best Match (custom overlap) biggest-disagreement fill in computeDisplaySpokes (Req 9)"
affects: [204-02, 204-03, 204-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Lens metadata/calibration/persistence helpers live in src/lib/compass.js beside computeDisplaySpokes, as pure/testable functions — not inlined into components"
    - "localStorage helpers always wrap read/write in try/catch and validate persisted values before trusting them (loadLensSelection falls back to 'custom' for unknown keys)"

key-files:
  created: []
  modified:
    - src/lib/compass.js
    - src/lib/compass.test.js

key-decisions:
  - "Best Match fill pass only applies to the 'no explicit lens, local lens off, selectedTopics present' branch — the explicit-lensTopicIds branch, the localLensActive branch, and the empty-preferred fallback are unchanged, per plan instruction"
  - "Updated 3 pre-existing tests that encoded the prior 'no auto-substitution' model for the selectedTopics branch — SPEC.md Req 9's background section explicitly documents the fill as the target behavior replacing that model, so this is an intentional behavior change, not a regression"
  - "isLensCalibrated only handles named lenses with a topicIds array; Custom/Best Match readiness (>=3 answers) is left to the caller (Req 5), as specified in the plan"
  - "Test-only in-memory localStorage shim added to compass.test.js since vitest's default environment here is 'node' (no jsdom) and no test-environment config/dependency exists in this repo; avoids introducing a new package dependency"

patterns-established:
  - "normalizeApiLens / sanitizeLensColor pattern for defensively consuming untrusted API-supplied display data (color, name) before it reaches an inline style"

requirements-completed: [LENS-01]

# Metrics
duration: 6min
completed: 2026-07-14
---

# Phase 204 Plan 01: Compass Lens Switcher — Pure Data/Algorithm Layer Summary

**Lens metadata fallbacks + defensive API normalizer, min(8,size) calibration check, validated `ev:compassLens` persistence, and the Best Match biggest-disagreement fill in `computeDisplaySpokes`, all in `src/lib/compass.js` with 27 new/updated unit tests.**

## Performance

- **Duration:** ~6 min (13:19:55 → 13:25:16 across 3 commits)
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Added `LENS_FALLBACKS`, `sanitizeLensColor`, `normalizeApiLens`, `isLensCalibrated`, and the `ev:compassLens`/`ev:compassLensPending` persistence helper pair to `src/lib/compass.js`
- Implemented the Req 9 Best Match (custom overlap) biggest-disagreement fill inside `computeDisplaySpokes`, following full TDD (RED → GREEN) for the behavior-adding task
- Full `compass.test.js` suite (27 tests) and the full project test suite (139 tests across 11 files) pass with no regressions outside the intentional Req-9 behavior change

## Task Commits

Each task was committed atomically:

1. **Task 1: Lens metadata, calibration check, color sanitizer, and persistence helpers** - `b0c666fa` (feat)
2. **Task 2: Best Match biggest-disagreement fill in computeDisplaySpokes (Req 9)** - `4bd5deb9` (test, RED) → `bca3b502` (feat, GREEN)

_TDD task (Task 2) has two commits: failing test first, then the implementation that turns it green._

## Files Created/Modified
- `src/lib/compass.js` - Added `LENS_FALLBACKS`, `sanitizeLensColor`, `normalizeApiLens`, `isLensCalibrated`, `LENS_SELECTION_KEY`/`LENS_PENDING_KEY` + save/load/clear helpers; extended `computeDisplaySpokes` with the Req 9 Best Match fill pass
- `src/lib/compass.test.js` - Added 23 new tests for the Task 1 exports; added 4 new tests + updated 3 pre-existing tests for the Req 9 fill pass (27 tests total)

## Decisions Made
- The Best Match fill pass is scoped strictly to the "no explicit lens, local lens off, user has selectedTopics" branch — verified by dedicated tests that the explicit-lens and local-lens branches never fill.
- Three pre-existing tests asserted the old "selectedTopics ∩ both-answered, no substitution" behavior for the exact branch Req 9 changes. Per SPEC.md's own description of Req 9 ("Current: ... no fill from other overlaps. Target: ... fill remaining slots ..."), this is the documented target behavior, so those tests were updated (not left failing, not worked around) to assert the new fill-inclusive output.
- Added a minimal in-memory `localStorage` shim local to the test file (not a new dependency) to exercise the real save/load code paths for the persisted lens-selection helpers, since this repo's vitest config has no jsdom/browser environment configured.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated 3 pre-existing compass.test.js fixtures to match the new Req 9 Best Match behavior**
- **Found during:** Task 2 (GREEN phase — implementing the fill pass)
- **Issue:** Implementing the Req 9 fill pass as specified caused 3 pre-existing tests (encoding the prior "no auto-substitution" model for the same selectedTopics branch) to fail. SPEC.md Req 9's own "Current vs Target" framing confirms this is the intended, in-scope behavior change for this exact code path, not a side effect to work around.
- **Fix:** Updated the 3 tests' expected `displayTopicIds`/`hasEnoughSpokes` values (and renamed two describe/it titles for accuracy) to reflect the new fill-inclusive output; updated the file's top docstring to describe the per-branch fill semantics accurately.
- **Files modified:** src/lib/compass.test.js
- **Verification:** Full `compass.test.js` suite (27/27) and full project suite (139/139) pass.
- **Committed in:** bca3b502 (Task 2 GREEN commit)

**2. [Rule 3 - Blocking] Added a test-only in-memory localStorage shim**
- **Found during:** Task 1 (persistence helper tests)
- **Issue:** vitest's default environment in this repo is 'node' (no jsdom configured), so the global `localStorage` used by `saveLensSelection`/`loadLensSelection`/etc. is undefined at test time, causing a `ReferenceError` when tests tried to exercise real persistence round-trips.
- **Fix:** Added a minimal `createMemoryStorage()` helper local to `compass.test.js` and assigned it to `globalThis.localStorage` in a `beforeEach` for the persistence describe block. No new package dependency introduced.
- **Files modified:** src/lib/compass.test.js
- **Verification:** Persistence tests pass, exercising the real save/load try/catch code paths.
- **Committed in:** b0c666fa (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug-fix-in-tests, 1 Rule 3 blocking-issue workaround)
**Impact on plan:** Both changes were necessary to make the plan's own specified behavior testable and green; no scope creep — no new files, no new dependencies, no architecture changes.

## Issues Encountered
None beyond the two items documented above.

## TDD Gate Compliance

Task 2 (`tdd="true"`) followed the full RED → GREEN cycle:
- RED: `4bd5deb9` `test(204-01): add failing tests for Best Match biggest-disagreement fill (Req 9)` — confirmed 2 genuine failures (the unimplemented fill behavior) before any implementation; a 3rd initial failure was a test-authoring bug (wrong expected `hasEnoughSpokes` value) fixed before the RED commit.
- GREEN: `bca3b502` `feat(204-01): implement Best Match biggest-disagreement fill in computeDisplaySpokes` — all tests pass.
- No REFACTOR commit was needed; the implementation required no follow-up cleanup.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `src/lib/compass.js` now exports everything Plan 02 (state layer — `CompassContext.jsx`) needs: `LENS_FALLBACKS`, `normalizeApiLens`, `isLensCalibrated`, `LENS_SELECTION_KEY`/`LENS_PENDING_KEY` + the full save/load/clear helper set, and the Req 9-compliant `computeDisplaySpokes`.
- No blockers. Plan 02 can wire these into `CompassContext.jsx`'s persisted `activeLensKey` state and retire the per-office `getEffectiveLensKey` auto-lensing as scoped in SPEC.md Req 8, using `isLensCalibrated`/`loadLensSelection` as the new source of truth.
- Plans 03/04 (UI: `LensChipRow`/`CompassControlsBar`) can rely on `normalizeApiLens`/`sanitizeLensColor` for safely rendering API-supplied `name`/`color` per chip.

---
*Phase: 204-compass-lens-switcher*
*Completed: 2026-07-14*

## Self-Check: PASSED

All created/modified files and all 3 task commit hashes verified present.
