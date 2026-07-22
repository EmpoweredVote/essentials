---
phase: 215-header-declutter
plan: 02
subsystem: ui
tags: [react, results-page, filter-bar, header-declutter]

# Dependency graph
requires:
  - phase: 215-header-declutter (plan 01)
    provides: TAB_TYPE_DEFAULTS / matchesAppointedFilter / resolveIsAppointed in src/lib/classify.js
provides:
  - Per-bucket TAB_TYPE_DEFAULTS filtering applied independently to representatives/educators/judges hierarchies in Results.jsx
  - FilterBar reduced to only the Compass on/off toggle (type dropdown and name-search input removed)
  - Deletion of LocalFilterSidebar.jsx, ResultsHeader.jsx, SegmentedControl.jsx (dead code)
affects: [215-header-declutter]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fixed per-bucket type-filter constant applied independently per tab hierarchy (no shared filter state), structurally preventing one tab's selection from emptying another"

key-files:
  created: []
  modified:
    - src/pages/Results.jsx
    - src/components/FilterBar.jsx
  deleted:
    - src/components/LocalFilterSidebar.jsx
    - src/components/ResultsHeader.jsx
    - src/components/SegmentedControl.jsx

key-decisions:
  - "Did not import resolveIsAppointed into Results.jsx even though it is exported from classify.js — it was only used internally by the now-deleted inline matchesAppointedFilter; importing it unused would fail the lint no-unused-vars gate for Pitfall 4"
  - "filteredPols simplified from a useMemo wrapping visibleList to a plain `const filteredPols = list;` alias, since there is no longer any name-search narrowing to memoize"

patterns-established:
  - "Pattern: each of the three tab hierarchies (representatives/educators/judges) is filtered independently by its own TAB_TYPE_DEFAULTS constant, never a shared state value — this is the structural guarantee that the Judges tab's Appointed default can't be emptied by another tab"

requirements-completed: []  # HDR-01/HDR-02/SRCH-07 intentionally NOT marked complete — Task 4 (human-verify checkpoint at Bloomington, IN) is still pending

coverage:
  - id: D1
    description: "Reps/Educators tabs filter by TAB_TYPE_DEFAULTS.representatives/educators ('Elected'); Judges tab filters by TAB_TYPE_DEFAULTS.judges ('Appointed'); each hierarchy memo passes its own fixed constant independently (no shared appointedFilter state)"
    requirement: "HDR-01"
    verification:
      - kind: unit
        ref: "npx vitest run (268 tests passed, includes existing hierarchy/filter coverage)"
        status: pass
      - kind: other
        ref: "grep -c 'TAB_TYPE_DEFAULTS.representatives\\|TAB_TYPE_DEFAULTS.educators\\|TAB_TYPE_DEFAULTS.judges' src/pages/Results.jsx == 3; grep -c 'appointedFilter' src/pages/Results.jsx == 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The All/Appointed type dropdown no longer appears in the UI anywhere (FilterBar renders only the Compass toggle)"
    requirement: "HDR-01"
    verification:
      - kind: other
        ref: "grep -c 'TYPE_OPTIONS\\|All types' src/components/FilterBar.jsx == 0; grep -c 'function Dropdown\\|<Dropdown' src/components/FilterBar.jsx == 0; npm run lint (0 new errors in FilterBar.jsx)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The name-search filter box (input, magnifier icon, no-matches state) is removed entirely from FilterBar.jsx and Results.jsx"
    requirement: "SRCH-07"
    verification:
      - kind: other
        ref: "grep -c 'Search by name' src/components/FilterBar.jsx == 0; grep -c 'searchQuery\\|deferredQuery\\|trimmedSearch\\|visibleList' src/pages/Results.jsx == 0"
        status: pass
    human_judgment: false
  - id: D4
    description: "Dead component files LocalFilterSidebar.jsx, ResultsHeader.jsx, SegmentedControl.jsx deleted with no dangling imports; app builds"
    verification:
      - kind: other
        ref: "grep -rn 'LocalFilterSidebar\\|ResultsHeader\\|SegmentedControl' src/ (0 hits); npm run build (succeeds)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Live smoke at Bloomington, IN: Representatives/Educators default to Elected, Judges tab shows at least one Appointed judge and is NOT empty, no type dropdown or name-search box at desktop or mobile width (D-08)"
    requirement: "HDR-02"
    verification: []
    human_judgment: true
    rationale: "Requires the running app driven to a real geo-linked-judges fixture (Bloomington, IN) at two viewport widths — genuine human/visual judgment that source-level assertions cannot substitute for. This is Task 4, a blocking human-verify checkpoint, and has NOT yet been performed by this sequential (non-worktree) executor."

# Metrics
duration: ~25min
completed: 2026-07-21
status: pending-human-verify
---

# Phase 215 Plan 02: Elected-Default Filter + FilterBar Declutter Summary

**Results.jsx now filters each of the three tab hierarchies (representatives/educators/judges) independently by its own fixed TAB_TYPE_DEFAULTS constant instead of one shared appointedFilter state, FilterBar.jsx is reduced to only the Compass toggle, and three dead filter component files are deleted — Task 4 (live Bloomington, IN smoke test) is still pending.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-21T23:50:00-07:00 (approx)
- **Completed:** 2026-07-22T00:15:00-07:00 (Tasks 1-3 only — Task 4 pending)
- **Tasks:** 3 of 4 completed (Task 4 is a blocking human-verify checkpoint)
- **Files modified:** 2 modified, 3 deleted

## Accomplishments
- Results.jsx imports `TAB_TYPE_DEFAULTS`, `matchesAppointedFilter` from `../lib/classify` and deletes the now-duplicated inline `resolveIsAppointed`/`matchesAppointedFilter` definitions.
- The `appointedFilter`/`setAppointedFilter` useState is gone entirely — there is no surviving override affordance (D-04/D-06). The sessionStorage cache write and its effect's dependency array no longer reference it.
- Each of the three hierarchy memos now applies its own fixed bucket constant independently: `filteredHierarchy` uses `TAB_TYPE_DEFAULTS.representatives` ('Elected'), `educatorsFilteredHierarchy` uses `TAB_TYPE_DEFAULTS.educators` ('Elected'), `judgesFilteredHierarchy` uses `TAB_TYPE_DEFAULTS.judges` ('Appointed') — with no shared state dependency, so a selection on one tab can structurally never affect another.
- All name-search machinery removed: `searchQuery`/`setSearchQuery`, `deferredQuery` (`useDeferredValue`), `trimmedSearch`, `visibleList`, and the now-unused `useDeferredValue` React import. `filteredPols` simplified to `const filteredPols = list;`.
- Empty-state strings updated: the per-tier empty message and the filter-aware empty state both now derive their label from `TAB_TYPE_DEFAULTS[viewName].toLowerCase()` (always active, never `'All'`); the name-search "no matches" block is deleted.
- `FilterBar` call site in Results.jsx now passes only `compassMode`, `onCompassModeChange`, `isDark`.
- FilterBar.jsx: the `Dropdown` component, `TYPE_OPTIONS` array, and the entire name-search `<input>` block (including magnifier SVG) are removed. Prop signature reduced to `{ compassMode, onCompassModeChange, isDark }`. Head JSDoc rewritten to describe only the Compass toggle. `StickyCompassKey` export untouched.
- `LocalFilterSidebar.jsx`, `ResultsHeader.jsx`, `SegmentedControl.jsx` deleted along with their dead imports in Results.jsx (`SegmentedControl` was used only inside the now-deleted `LocalFilterSidebar`). Repo-wide grep confirms 0 remaining references.

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace appointedFilter state with per-bucket TAB_TYPE_DEFAULTS + remove name-search machinery in Results.jsx** - `8ff603c6` (feat)
2. **Task 2: Strip the type dropdown and name-search input from FilterBar.jsx** - `0f2a5ce9` (feat)
3. **Task 3: Delete the dead filter component files** - `28ecef45` (chore)

**Plan metadata:** pending (this SUMMARY's own doc commit, made immediately after this file)

4. **Task 4: Live smoke at Bloomington, IN — Judges tab not emptied by the Elected default (D-08)** - PENDING (`checkpoint:human-verify`, `gate="blocking"`) — not yet performed. See "Checkpoint Pending" below for exact steps.

## Files Created/Modified
- `src/pages/Results.jsx` - Imports TAB_TYPE_DEFAULTS/matchesAppointedFilter from classify.js; removed appointedFilter state, name-search state, inline filter functions; three hierarchy memos now filter independently by fixed per-tab constants; empty-state strings updated; FilterBar call site and dead imports (LocalFilterSidebar, SegmentedControl) removed.
- `src/components/FilterBar.jsx` - Removed Dropdown component, TYPE_OPTIONS, name-search input; renders only the Compass toggle; prop signature reduced.
- `src/components/LocalFilterSidebar.jsx` - Deleted (never rendered).
- `src/components/ResultsHeader.jsx` - Deleted (fully orphaned).
- `src/components/SegmentedControl.jsx` - Deleted (used only by the deleted LocalFilterSidebar).

## Decisions Made
- Did not import `resolveIsAppointed` into Results.jsx despite the plan's read_first note listing it as an available export — it was only referenced by the deleted inline `matchesAppointedFilter`, and importing it unused would trip the `no-unused-vars` lint rule (Pitfall 4 requires zero unused-variable errors). The imported `matchesAppointedFilter` from classify.js uses its own internal `resolveIsAppointed`, so no functionality is lost.
- Simplified `filteredPols` from a `useMemo` wrapping the now-deleted `visibleList` to a plain `const filteredPols = list;` alias — there is no longer any name-search narrowing to memoize.

## Deviations from Plan

None - plan executed exactly as written for Tasks 1-3. Task 4 is an inherent human-verify checkpoint that this sequential (non-worktree) executor cannot perform itself against a running app; per the orchestrator's explicit checkpoint-handling instructions for this plan, it is left PENDING rather than blocking the return.

## Issues Encountered
None caused by this plan's changes. `npm run lint` reports the same 46 pre-existing errors / 16 warnings baseline (confirmed via `git stash`/lint/`git stash pop` diff before editing) across unrelated files (CompassContext.jsx, compass.js, groupHierarchy.js, Profile.jsx, IconOverlay.jsx, JudicialCompassSection.jsx, LocationCard.jsx, PoliticianCard.jsx, PoliticianGrid.jsx, vite.config.js) plus a small pre-existing set within Results.jsx itself (`computeVariant`, `deriveScopedTopics`, `isLocalDistrict`, `getImageUrl`, `formatElectionDate`, `formatLegendName` unused imports; `filteredAnswers` unused; 3 empty-block statements) — none introduced by this plan's edits, confirmed identical error count before/after. Out of scope per the deviation-rules scope boundary; not fixed.

## Checkpoint Pending: Task 4 (human-verify, gate=blocking)

**What was built:** Elected-by-default type filter with the dropdown removed (HDR-01), the Judges tab keeping its Appointed default via a per-bucket constant (HDR-02), and the name-search box removed (SRCH-07).

**Exact steps a human must perform against the running app** (essentials dev server or essentials.empowered.vote), searching/browsing to **Bloomington, IN** (the D-08 fixture with real geo-linked judges — CA is invalid: NULL geo_id judicial districts empty the Judges tab):
1. Representatives tab: only Elected officials shown; there is NO type dropdown in the header anywhere.
2. Educators tab (if present for the location): defaults to Elected officials.
3. Judges tab: shows at least one APPOINTED judge by default, with zero manual filter interaction — the tab is NOT empty. (This is the criterion the whole plan exists to protect.)
4. No "search by name" text input appears in the header on any tab.
5. Repeat once at desktop width and once at mobile width to confirm neither the dropdown nor the search box reappears in either layout.

**Resume signal:** Type "approved" or describe the issue (e.g. "Judges tab empty at Bloomington").

**Requirements HDR-01, HDR-02, SRCH-07 are intentionally left unmarked in REQUIREMENTS.md** until this checkpoint is approved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Code for HDR-01/HDR-02/SRCH-07 is complete and green on lint/vitest/build; only live human verification (Task 4) remains before this plan can be considered fully done and the requirements marked complete.
- No blockers for 215-03 — that plan's file (`LensChipRow.jsx`) is not a dependency of 215-02's files, and 215-02's changes (Results.jsx, FilterBar.jsx) don't touch LensChipRow.jsx.

---
*Phase: 215-header-declutter*
*Completed: 2026-07-21 (Tasks 1-3 only; Task 4 pending human verification)*

## Self-Check: PASSED

- FOUND: src/pages/Results.jsx
- FOUND: src/components/FilterBar.jsx
- CONFIRMED DELETED: src/components/LocalFilterSidebar.jsx
- CONFIRMED DELETED: src/components/ResultsHeader.jsx
- CONFIRMED DELETED: src/components/SegmentedControl.jsx
- FOUND commit: 8ff603c6 (Task 1)
- FOUND commit: 0f2a5ce9 (Task 2)
- FOUND commit: 28ecef45 (Task 3)
