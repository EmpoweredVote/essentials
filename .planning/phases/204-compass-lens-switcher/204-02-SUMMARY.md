---
phase: 204-compass-lens-switcher
plan: 02
subsystem: compass

tags: [react, context, compass, lens-switcher, persistence]

# Dependency graph
requires:
  - "204-01: LENS_FALLBACKS, normalizeApiLens, isLensCalibrated, LENS_SELECTION_KEY/LENS_PENDING_KEY + save/load/clear helpers, Req 9-compliant computeDisplaySpokes"
provides:
  - "CompassContext.activeLensKey (persisted, default 'custom') + setActiveLens"
  - "CompassContext.lenses hydrated with name/description via LENS_FALLBACKS + normalizeApiLens"
  - "CompassContext.isLensCalibrated re-exported for the grid/switcher"
  - "Auto-select-on-return-from-calibration effect (D-12) keyed on ev:compassLensPending"
affects: [204-03, 204-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global persisted selection lives in CompassContext (not page-local), mirroring the existing ev:compassMode persisted-boolean idiom but for a validated lens key"
    - "Per-office auto-lensing helpers (getEffectiveLens/getEffectiveLensKey/toggleLens/toggleLocalLens/setLocalLens) retained verbatim as functional shims for out-of-scope consumers, with a code comment marking them deprecated-for-the-grid"

key-files:
  created: []
  modified:
    - src/contexts/CompassContext.jsx

key-decisions:
  - "Fallback lenses array replaced with LENS_FALLBACKS import wholesale (rather than hand-adding name/description fields to the existing literal) — single source of truth already established in Plan 01"
  - "Removed now-unused LOCAL_LENS_TOPICS/FEDERAL_LENS_TOPICS/JUDICIAL_LENS_TOPICS imports after the fallback array was replaced by LENS_FALLBACKS (Rule 1 — dead import cleanup, build would otherwise carry unused symbols)"
  - "Auto-select effect placed as its own useEffect (not folded into the existing cross-subdomain live-sync effect) for a narrow, single-purpose dependency array (compassDataLoaded, userAnswers, lenses, setActiveLens) and to keep the D-12 loop-guard (clearLensPending) easy to audit in isolation"
  - "Per SPEC Req 8 / plan instruction, getEffectiveLens/getEffectiveLensKey/toggleLens/toggleLocalLens/setLocalLens are left fully functional and unchanged in behavior — only a code comment was added noting the grid no longer consumes them; profile CompassCard and ElectionsView are untouched and still import/call them successfully"

requirements-completed: [LENS-01]

# Metrics
duration: 5min
completed: 2026-07-14
---

# Phase 204 Plan 02: Compass Lens Switcher — CompassContext State Layer Summary

**Turned the latent per-office lens data model into an explicit, persisted, global `activeLensKey` in `CompassContext`, with normalized API hydration and a calibration-return auto-select effect (D-12), while leaving the legacy per-office shims (`getEffectiveLens`/`getEffectiveLensKey`/`toggleLens`) fully functional for out-of-scope profile/elections consumers.**

## Performance

- **Duration:** ~5 min (13:29:03 base → 13:33:31 final commit, 2 commits)
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- Replaced the hand-rolled fallback `lenses` array with the Plan-01 `LENS_FALLBACKS` constant (adds `name`/`description` per lens)
- Wired `fetchLenses()` hydration through `normalizeApiLens` so API-fetched rows are shape-defensive and color-sanitized before entering state
- Added persisted `activeLensKey` (default `'custom'`, validated against known lens keys via `loadLensSelection`) + `setActiveLens` setter that writes through to `localStorage['ev:compassLens']`
- Added `activeLensKey`, `setActiveLens`, and `isLensCalibrated` to the context's `value` memo object and its dependency array
- Added a new `useEffect` implementing D-12: on return from calibration, if `ev:compassLensPending` names a lens that is now calibrated, the effect calls `setActiveLens` and clears the pending marker; if not yet calibrated, the marker is left for a later visit
- Verified `npm run build` exits 0 and the full Vitest suite (139/139) still passes with zero regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Global activeLensKey state, setActiveLens, metadata fallback, normalized hydration** - `48615760` (feat)
2. **Task 2: Auto-select the lens on return from calibration (D-12)** - `9d225ac3` (feat)

## Files Created/Modified
- `src/contexts/CompassContext.jsx` — Added `LENS_FALLBACKS`/`normalizeApiLens`/`isLensCalibrated`/`saveLensSelection`/`loadLensSelection`/`loadLensPending`/`clearLensPending` imports; replaced the fallback `lenses` array with `LENS_FALLBACKS`; added persisted `activeLensKey` state + `setActiveLens`; mapped `fetchLenses()` rows through `normalizeApiLens`; added a retirement comment on the per-office auto-lensing block; added `activeLensKey`/`setActiveLens`/`isLensCalibrated` to the context value memo + deps; added the D-12 auto-select-on-return `useEffect`; removed now-dead `LOCAL_LENS_TOPICS`/`FEDERAL_LENS_TOPICS`/`JUDICIAL_LENS_TOPICS` imports.

## Decisions Made
- Used `LENS_FALLBACKS` directly rather than manually appending `name`/`description` to the pre-existing inline array literal — Plan 01 already produced the canonical fallback constant with the exact shape needed, so importing it is both less code and a single source of truth.
- The D-12 auto-select effect is its own `useEffect` (distinct from the cross-subdomain live-sync effect above it) with a narrow, self-contained dependency array and an explicit loop guard (`clearLensPending()` on apply) — kept separate for auditability rather than folding calibration-return logic into an unrelated existing effect.
- `getEffectiveLens`/`getEffectiveLensKey`/`toggleLens`/`toggleLocalLens`/`setLocalLens` were left byte-for-byte behaviorally unchanged (only a doc comment added) per the plan's explicit instruction to retire the *grid's* consumption of per-office auto-lensing without regressing the out-of-scope profile `CompassCard` (L52-69/L297) and `ElectionsView` (L293/L758) consumers, both confirmed still importing/calling these functions unmodified.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed unused `LOCAL_LENS_TOPICS`/`FEDERAL_LENS_TOPICS`/`JUDICIAL_LENS_TOPICS` imports**
- **Found during:** Task 1
- **Issue:** Replacing the inline fallback `lenses` array literal (which referenced these three imported constants) with the `LENS_FALLBACKS` import left the three original imports unused in the file.
- **Fix:** Removed the three now-dead named imports from the `../lib/compass` import block.
- **Files modified:** src/contexts/CompassContext.jsx
- **Verification:** `npm run build` exits 0; no unused-import warnings.
- **Committed in:** 48615760 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 dead-import cleanup)
**Impact on plan:** Cosmetic/hygiene only — no scope creep, no behavior change, no new dependencies.

## Issues Encountered
None beyond the item documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `CompassContext` now exports everything the LensChipRow/CompassControlsBar UI work (Plans 03/04) needs: `lenses` (name/description/color-normalized), `activeLensKey`, `setActiveLens`, `isLensCalibrated`.
- The D-12 calibration-return contract is fully wired context-side: Plan 04's grid `onCalibrate` handler only needs to call `saveLensPending(lensKey)` (already exported from `compass.js` per Plan 01) before navigating to `compass.empowered.vote`; this context will pick it up and auto-select on the next `compassDataLoaded` cycle.
- No blockers. `getEffectiveLens`/`getEffectiveLensKey`/`toggleLens`/`toggleLocalLens`/`setLocalLens` remain live and unchanged for `CompassCard.jsx` and `ElectionsView.jsx` — Plan 04's Results.jsx migration to `activeLensKey` for the grid does not need to modify either of those files.

---
*Phase: 204-compass-lens-switcher*
*Completed: 2026-07-14*

## Self-Check: PASSED

All modified files and both task commit hashes verified present.
