---
phase: 34-mini-compass-tile-component
plan: "01"
name: extract-computeDisplaySpokes
subsystem: compass
tags: [compass, refactor, pure-function, spoke-selection, local-lens]
status: complete
completed: "2026-05-13"
duration: "~2 minutes"

dependency-graph:
  requires:
    - "33-local-lens-state-system"  # LOCAL_LENS_TOPICS, localLensActive wired in context
  provides:
    - "computeDisplaySpokes() exported from src/lib/compass.js"
    - "CompassCard.jsx consumes shared function — inline algorithm removed"
  affects:
    - "34-02"  # MiniCompass will import and call computeDisplaySpokes()
    - "34-03"  # ElectionsView wiring uses same shared function

tech-stack:
  added: []
  patterns:
    - "Pure function extraction from React component — logic/presentation separation"
    - "Lens-aware algorithm via boolean parameter (localLensActive) rather than branch in caller"

file-tracking:
  created: []
  modified:
    - src/lib/compass.js
    - src/components/CompassCard.jsx

decisions:
  - id: "34-01-A"
    choice: "hasEnoughSpokes init in CompassCard changed from true to false"
    rationale: "The original code initialized hasEnoughSpokes=true and then the guard block overwrote it. computeDisplaySpokes returns false when polAnswers is null/empty (fast path), so the caller's default is now false — semantically correct and eliminates the misleading true default."
    alternatives: "Keep true default, but that could cause stale render on loading edge cases."

metrics:
  tasks-completed: 2
  tasks-total: 2
  commits: 2
---

# Phase 34 Plan 01: Extract computeDisplaySpokes Summary

**One-liner:** Bilateral spoke-selection algorithm extracted from CompassCard into pure `computeDisplaySpokes()` with lens-aware `localLensActive` branch in `src/lib/compass.js`.

## What Was Done

### Task 1 — Add computeDisplaySpokes() to src/lib/compass.js

Appended a new exported pure function after the `loadLocalLensState` function (the last function in the Local Lens preset section). The function has no React hooks, no side effects, no I/O.

**Final function signature:**

```js
export function computeDisplaySpokes({
  selectedTopics,       // string[] — user calibration topic UUIDs (capped internally at maxSpokes)
  userAnswers,          // [{ topic_id, value }, ...]
  polAnswers,           // [{ topic_id, value }, ...] — null/undefined safe
  scopedTopics,         // topic objects pre-filtered by districtScope
  maxSpokes = 8,
  localLensActive = false,
})
// Returns:
// {
//   displayTopicIds: string[],
//   replacedSpokes: { [short_title]: boolean },
//   hasEnoughSpokes: boolean,
// }
```

**Algorithm paths:**
1. Fast path: if `!polAnswers || scopedTopics.length === 0` → return empty result
2. Lens path: if `localLensActive === true` → `preferredIds = LOCAL_LENS_TOPICS.slice(0, maxSpokes)`
3. Selected path: if `selectedTopics.length > 0` → `preferredIds = selectedTopics.slice(0, maxSpokes)`
4. Fallback: bilateral overlap — topics where both user and politician have answered

**Critical constraints preserved:**
- `selectedTopics.slice(0, maxSpokes)` cap — guards against post-calibration bug that sets all 36 topics selected
- `polAnswers.filter((a) => a.value > 0)` — `value > 0` not just `value` (exact match to original)
- `String(id)` coercion throughout — defensive, matches original implementation

### Task 2 — Refactor CompassCard.jsx

Changes made:
1. Added `computeDisplaySpokes` to the import from `'../lib/compass'`
2. Added `localLensActive` to the `useCompass()` destructure
3. Replaced 77 lines of inline algorithm with a single `computeDisplaySpokes()` call (15 lines including the buildAnswerMapByShortTitle calls)
4. Changed `hasEnoughSpokes` initialization from `true` to `false` (see Decisions)

**CompassCard refactor diff (summary):**
- **Removed:** `polAnsweredSet`, `userAnsweredSet`, `preferredIds`, `preferredSet`, `replacementPool`, `displayTopicIds`, `newReplacedSpokes`, `ri` — all local to the inline algorithm
- **Added:** Single `computeDisplaySpokes({...})` call; destructures `hasEnoughSpokes`, `replacedSpokes`, `displayTopicIds` from result
- **Preserved:** All `buildAnswerMapByShortTitle` calls, all render JSX, `allPolTopics` computation, `missingTopicCount`, Min/Max handlers — untouched

## Behavior Preserved

The refactored CompassCard is behaviorally identical to the original:
- Same spoke order (preferredIds order → replacement order)
- Same MAX_SPOKES=8 cap
- Same `value > 0` filter on politician answers
- Same String() coercion on all UUID comparisons
- Same bilateral fallback when no selectedTopics
- Lens toggle works as in Phase 33 (when `localLensActive=true`, `selectedTopics === LOCAL_LENS_TOPICS` at context level AND `localLensActive` is now passed to computeDisplaySpokes for API symmetry with MiniCompass)

## Build Output

```
vite v7.3.1 building client environment for production...
✓ 750 modules transformed.
✓ built in 5.07s
```

Pre-existing warnings only (ev-ui dynamic import, chunk size). No new warnings or errors.

## Deviations from Plan

None — plan executed exactly as written.

## Subtle Behaviors Noted During Porting

1. **hasEnoughSpokes default:** Original CompassCard initialized `hasEnoughSpokes = true` outside the guard block, then the guard would overwrite it. The pure function correctly returns `hasEnoughSpokes: false` in all non-rendering states. Caller now initializes to `false` — semantically cleaner.

2. **localLensActive already redundant for CompassCard:** Phase 33 wired the context so when `localLensActive=true`, `selectedTopics` is already set to `LOCAL_LENS_TOPICS`. Passing `localLensActive` separately to `computeDisplaySpokes` from CompassCard is therefore redundant (the selected path would pick LOCAL_LENS_TOPICS anyway). However, passing it explicitly is required for API symmetry — MiniCompass will not have `selectedTopics` wired to LOCAL_LENS_TOPICS (it will call computeDisplaySpokes directly) and needs the lens-aware branch.

3. **String() coercion:** LOCAL_LENS_TOPICS entries are already string literals, so the `preferredIds.map(String)` for the lens path is technically a no-op. Preserved anyway per plan constraints — uniformity matters more than micro-optimization here.

## Ready for Plan 34-02

`computeDisplaySpokes` is now the shared foundation. Plan 34-02 (MiniCompass component) can import and call it directly without any additional changes to this function.
