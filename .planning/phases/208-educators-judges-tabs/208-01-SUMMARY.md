---
phase: 208-educators-judges-tabs
plan: 01
subsystem: ui
tags: [react, results-page, tabs, classify, officials-view]

# Dependency graph
requires:
  - phase: 207-officials-classification
    provides: classifyBucket(pol) -> 'representative' | 'educator' | 'judge' (src/lib/classify.js:306), null-safe, single source of truth for tab routing
provides:
  - Four-tab officials view (Representatives, Educators, Judges, Elections) in src/pages/Results.jsx
  - classifyBucket-driven partition of deduped politicians into three buckets, feeding three parallel groupIntoHierarchy pipelines
  - hasEducators/hasJudges empty-bucket flags (pre-appointed-filter) driving hide-when-empty tab buttons
  - effectiveActiveView fallback resolving stale/unknown ?view= and empty-bucket tabs to 'representatives'
  - renderPeopleTab(hier, fallbackListLength, viewName) shared render pipeline for full parity across all three people-tabs
  - Relocated election summary + day-pill in the location-header chip row (persists across all four tabs)
affects: [208-02, 210-per-tab-lens-shift]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bucket partition via classifyBucket -> three parallel groupIntoHierarchy pipelines (one per bucket), never duplicated tab-membership logic"
    - "applyAppointedFilter(hierarchy, filter) helper generalizing the appointed/elected filter across all three bucket hierarchies"
    - "effectiveActiveView switch-statement fallback: sole legitimate reader of the raw ?view= param; every render branch and tab button downstream reads effectiveActiveView, never activeView directly"
    - "renderPeopleTab(hier, fallbackListLength, viewName) closure-based render helper for byte-identical tab parity"
    - "tabButtonClass(isActive) shared className helper across all four tab buttons"

key-files:
  created: []
  modified:
    - src/pages/Results.jsx

key-decisions:
  - "effectiveActiveView implemented as a switch statement (not repeated activeView === '...' comparisons) so it remains the single legitimate reader of the raw ?view= param, satisfying the plan's grep-verified invariant that no other code compares against raw activeView"
  - "Tier-empty message wording gated on viewName === 'representatives' ? 'representative' : 'official' to prevent 'representative data' from ever rendering on Educators/Judges tabs"
  - "Location-level scaffolding (error banner, ADR-0001 precision banner) kept representatives-only inside renderPeopleTab, since they're location-level and Representatives is the always-present tab (D-07)"

patterns-established:
  - "renderPeopleTab helper pattern: any future third+ tab reusing the same tiered render pipeline should extend this helper's call sites rather than duplicating JSX"

requirements-completed: [TAB-01, TAB-02, TAB-03]

# Metrics
duration: 11min
completed: 2026-07-18
---

# Phase 208 Plan 01: Bucket-Partition Tabs, Render Parity & Header Relocation Summary

**Added Educators and Judges tabs to Results.jsx by partitioning office-holders through Phase 207's `classifyBucket`, extracting a shared `renderPeopleTab` pipeline for full three-tab parity, and relocating the Elections summary text/day-pill to the location-header row.**

## Performance

- **Duration:** ~11 min
- **Started:** 2026-07-18T16:58:14Z
- **Completed:** 2026-07-18T17:09:29Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- `deduped` politicians are now partitioned by `classifyBucket` into `representative`/`educator`/`judge` buckets (the ONLY call site of `classifyBucket` in the file), each bucket flowing through its own `groupIntoHierarchy` + `applyAppointedFilter` pipeline.
- `renderPeopleTab(hier, fallbackListLength, viewName)` extracts the full Representatives render pipeline (tier banners, `GovernmentBodySection`/`SubGroupSection`/`renderSeatGroup`, compass slot, empty states) so Educators and Judges render byte-identically, just fed their own bucket's hierarchy.
- Four-button tab row (Representatives · Educators · Judges · Elections) with `hasEducators`/`hasJudges` conditional rendering (hidden, not disabled, per D-05/D-06) and a shared `tabButtonClass(isActive)` helper; all four buttons derive active state from `effectiveActiveView`.
- `effectiveActiveView` (switch-statement derivation) resolves any unknown or bucket-empty `?view=` value to `'representatives'`, satisfying D-08's fallback rule and the T-208-01/T-208-02 tampering/DoS mitigations.
- Elections tab label collapsed to plain "Elections"; the election summary text + yellow day-pill now render once in the location-header chip row (guarded on `electionsLabelSuffix`), visible across all four tabs.

## Task Commits

Each task was committed atomically:

1. **Task 1: Bucket-partition data layer + empty-bucket flags + active-tab fallback** - `ccbe5c73` (feat)
2. **Task 2: Extract renderPeopleTab helper and render all three people-tabs with full parity** - `946b7388` (feat)
3. **Task 3: Four-button tab row (hide-when-empty) + relocate election summary to header** - `14740cf2` (feat)

**Plan metadata:** (this commit, docs: complete plan)

## Files Created/Modified
- `src/pages/Results.jsx` - Bucket partition (`bucketed`/`hasEducators`/`hasJudges`/`effectiveActiveView`), `renderPeopleTab` helper, four-button tab row, relocated election summary in the location-header row.

## Decisions Made
- Used a `switch (activeView)` statement for `effectiveActiveView` rather than repeated `activeView === '...'` comparisons, keeping it the single legitimate reader of the raw `?view=` param — this also cleanly satisfies the plan's `grep "activeView ==="` zero-match acceptance check without weakening the fallback logic.
- Kept the location-level error banner and ADR-0001 precision banner scoped to the `representatives` viewName inside `renderPeopleTab`, since they describe the whole location (not a bucket) and Representatives is the tab that's always present (D-07).
- Generic "official data is not yet available" wording used for Educators/Judges tier-empty messages (representatives keeps "representative data") to avoid a literal "representative" string leaking onto the wrong tab.

## Deviations from Plan

None - plan executed exactly as written. One in-flight self-correction: the initial `effectiveActiveView` derivation used `if (activeView === 'educators' ...)` guard clauses (matching the plan's suggested shape); before committing Task 3 this was rewritten to a `switch` statement so the file-wide `grep -n "activeView ==="` acceptance check (Task 3) returns zero matches, including in comments. This is a same-task refinement, not a deviation from the plan's intent — the plan explicitly requires `effectiveActiveView`/tab buttons never to read raw `activeView` via `===`.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `src/pages/Results.jsx` builds clean (`npm run build` exit 0) and `npm run lint` shows zero new errors (10 pre-existing errors unchanged, verified byte-for-byte against the pre-Task-1 baseline).
- Full visual/behavioral verification (tab switching, hide-when-empty on real data, mobile fit at ~280px, compass control on each tab) is deferred to Plan 208-02 (human-verify checkpoint), as scoped.
- Phase 210 (per-tab default-lens shift) can build directly on `effectiveActiveView` to add lens-switching side effects per tab.

---
*Phase: 208-educators-judges-tabs*
*Completed: 2026-07-18*
