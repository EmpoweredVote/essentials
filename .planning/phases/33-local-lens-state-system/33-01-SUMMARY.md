---
phase: 33-local-lens-state-system
plan: 01
subsystem: ui
tags: [react, context, localstorage, compass, local-lens, uuid]

# Dependency graph
requires:
  - phase: 23-local-compass-topics
    provides: 8 LOCAL compass topic UUIDs verified in production DB (residential-zoning, civil-rights, public-safety-approach, local-immigration, economic-development, transportation-priorities, plus housing/homelessness from prior phases)
provides:
  - LOCAL_LENS_TOPICS constant (8 verified UUIDs) in compass.js
  - saveLocalLensState() and loadLocalLensState() helpers in compass.js
  - localLensActive boolean state in CompassContext (localStorage-backed)
  - toggleLocalLens() function in CompassContext
  - snapshot/restore system for pre-lens selectedTopics + invertedSpokes
  - loadCompassData re-apply guard (ref pattern for stable empty-deps callback)
  - live-sync guard preventing cross-tab evContext from overwriting lens topics
affects:
  - phase 34 (Local Lens UI controls — toggle button depends on localLensActive + toggleLocalLens)
  - phase 35+ (mini compass tiles, hover modal, global controls)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Ref pattern for stable useCallback deps: localLensActiveRef.current read inside empty-deps useCallback avoids stale closure while keeping stable reference"
    - "Snapshot/restore toggle: capture {...selectedTopics, ...invertedSpokes} on activate; restore on deactivate via preLensSnapshot state"
    - "Lazy useState initializer reading localStorage for cold-start hydration without useEffect"

key-files:
  created: []
  modified:
    - src/lib/compass.js
    - src/contexts/CompassContext.jsx

key-decisions:
  - "Used localLensActiveRef (not state) inside loadCompassData to avoid adding localLensActive to its empty deps array — preserves existing stable-callback pattern"
  - "Live-sync guard placed after setUserAnswers(apiAnswers) so cross-tab answer sync still works; only selectedTopics + invertedSpokes writes are blocked while lens active"
  - "Activation does NOT call setInvertedSpokes (LENS-03) — invertedSpokes is untouched during activation; snapshot captures it for restore but does not change it"
  - "loadLocalLensState imported into CompassContext for future use; lazy useState initializers use inline localStorage.getItem for simplicity"

patterns-established:
  - "Local Lens preset: 8-UUID array constant in compass.js, toggle in CompassContext, localStorage persistence with ev:localLensActive + ev:localLensSnapshot keys"
  - "Re-apply guard after setCompassDataLoaded(true): any loadCompassData call that completes while lens is active re-sets selectedTopics to LOCAL_LENS_TOPICS"

# Metrics
duration: 3min
completed: 2026-05-12
---

# Phase 33 Plan 01: Local Lens State System Summary

**8-topic Local Lens preset toggle in CompassContext with snapshot/restore and localStorage persistence; foundation for v4.0 Compass Experience**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-12T22:13:17Z
- **Completed:** 2026-05-12T22:16:29Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Verified all 6 partial UUIDs against production Supabase DB; assembled complete LOCAL_LENS_TOPICS array of 8 full UUIDs
- Added LOCAL_LENS_TOPICS constant plus saveLocalLensState() / loadLocalLensState() helpers to compass.js (54 lines appended, no existing exports touched)
- Wired localLensActive state, preLensSnapshot state, localLensActiveRef, toggleLocalLens(), loadCompassData re-apply guard, and live-sync guard into CompassContext.jsx (52 lines added)
- All 5 LENS success criteria satisfied; build passes with no new errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Verify UUIDs and add LOCAL_LENS_TOPICS + helpers to compass.js** - `8129480` (feat)
2. **Task 2: Wire localLensActive state and toggleLocalLens() into CompassContext.jsx** - `b1e4a96` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/lib/compass.js` — Appended LOCAL_LENS_TOPICS (8 UUIDs), LOCAL_LENS_ACTIVE_KEY, LOCAL_LENS_SNAPSHOT_KEY, saveLocalLensState(), loadLocalLensState()
- `src/contexts/CompassContext.jsx` — Added localLensActiveRef, localLensActive state, preLensSnapshot state, ref-sync useEffect, toggleLocalLens useCallback, loadCompassData re-apply guard, live-sync guard, context value exposure

## Decisions Made

- Used `localLensActiveRef` (useRef) inside `loadCompassData` instead of `localLensActive` state, preserving the stable empty-deps `useCallback` pattern. The ref is kept in sync via a `useEffect`.
- Live-sync guard placed after `setUserAnswers(apiAnswers)` — cross-tab answer updates still propagate while lens is active; only `selectedTopics` and `invertedSpokes` writes are suppressed.
- Activation does NOT call `setInvertedSpokes` (LENS-03 requirement). The snapshot captures `invertedSpokes` for restoration but does not mutate it on activation.
- `loadLocalLensState` is imported from compass.js but not yet called in CompassContext — lazy `useState` initializers use inline `localStorage.getItem` calls for clarity. The exported helper is available for future consumers.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `localLensActive` (boolean) and `toggleLocalLens()` (function) are exported from CompassContext via `useCompass()` — all downstream phases can consume them immediately
- Phase 34 (Local Lens UI controls) can now add the toggle button affordance
- localStorage keys `ev:localLensActive` and `ev:localLensSnapshot` are live; state survives page refresh
- No blockers

---
*Phase: 33-local-lens-state-system*
*Completed: 2026-05-12*
