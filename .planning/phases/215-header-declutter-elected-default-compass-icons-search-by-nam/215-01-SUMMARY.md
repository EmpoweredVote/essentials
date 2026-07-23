---
phase: 215-header-declutter
plan: 01
subsystem: ui
tags: [classify, filters, vitest, tdd]

# Dependency graph
requires:
  - phase: 208-four-tab-officials-view
    provides: classify.js classifyBucket() single source of truth for representative/educator/judge routing
provides:
  - "TAB_TYPE_DEFAULTS exported constant map (representatives/educators=Elected, judges=Appointed)"
  - "resolveIsAppointed and matchesAppointedFilter exported as pure, unit-tested functions from classify.js"
affects: [215-02, 215-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-tab policy constants (TAB_TYPE_DEFAULTS) live alongside FEDERAL_ORDER/STATE_ORDER/LOCAL_ORDER in classify.js as the single source of truth for tab-level display defaults"

key-files:
  created: []
  modified:
    - src/lib/classify.js
    - src/lib/classify.test.js

key-decisions:
  - "TAB_TYPE_DEFAULTS.judges = 'Appointed' is the exact value that keeps the Judges tab non-empty under the phase's Elected-by-default policy (HDR-02)"
  - "resolveIsAppointed/matchesAppointedFilter moved verbatim (byte-identical logic) from Results.jsx into classify.js as named exports; inline copies intentionally left in Results.jsx for Plan 02 to remove, per this plan's explicit scope boundary"

patterns-established:
  - "Pure filter/classification helpers live in src/lib/classify.js, not inline in page components, so they are directly unit-testable"

requirements-completed: [HDR-01, HDR-02]

coverage:
  - id: D1
    description: "TAB_TYPE_DEFAULTS exported with representatives/educators='Elected', judges='Appointed'"
    requirement: "HDR-02"
    verification:
      - kind: unit
        ref: "src/lib/classify.test.js#TAB_TYPE_DEFAULTS + appointed-filter logic > TAB_TYPE_DEFAULTS.judges is \"Appointed\" (HDR-02: keeps the Judges tab populated)"
        status: pass
    human_judgment: false
  - id: D2
    description: "resolveIsAppointed and matchesAppointedFilter extracted to classify.js as pure, exported, unit-tested functions (individual override, retention-vote judges surfacing under Elected, All-filter pass-through)"
    requirement: "HDR-01"
    verification:
      - kind: unit
        ref: "src/lib/classify.test.js#TAB_TYPE_DEFAULTS + appointed-filter logic (12 test cases, all pass)"
        status: pass
    human_judgment: false

duration: 10min
completed: 2026-07-22
status: complete
---

# Phase 215 Plan 01: TAB_TYPE_DEFAULTS + Appointed-Filter Extraction Summary

**Added TAB_TYPE_DEFAULTS constant and extracted resolveIsAppointed/matchesAppointedFilter from Results.jsx into classify.js as unit-tested exports, proving the Judges=Appointed exception with an automated assertion instead of code inspection.**

## Performance

- **Duration:** 10 min
- **Started:** 2026-07-22T06:36:02Z
- **Completed:** 2026-07-22T06:39:42Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- `TAB_TYPE_DEFAULTS` exported from `src/lib/classify.js`: `{ representatives: 'Elected', educators: 'Elected', judges: 'Appointed' }`
- `resolveIsAppointed(pol)` and `matchesAppointedFilter(pol, filter)` moved verbatim (byte-identical logic) from `Results.jsx` lines 1096-1114 into `classify.js` as named exports
- New `describe('TAB_TYPE_DEFAULTS + appointed-filter logic')` block in `classify.test.js` with 12 passing test cases covering every behavior in the plan, including the retention-vote-judge-surfaces-under-Elected case and the legacy `'All'` pass-through
- Full `classify.test.js` suite green: 100/100 tests pass (88 pre-existing + 12 new), zero regressions

## Task Commits

Each task was committed atomically (TDD RED then GREEN):

1. **Task 1 RED: add failing TAB_TYPE_DEFAULTS + appointed-filter tests** - `c47dda6e` (test) — confirmed 12 failures (`TypeError: ... is not a function`) before any implementation existed
2. **Task 1 GREEN: add TAB_TYPE_DEFAULTS + extract appointed-filter functions to classify.js** - `264ff94e` (feat) — all 12 new tests pass, no regression to the other 88

_TDD Gate Compliance: both RED and GREEN commits present in git log, in the correct order. No REFACTOR commit needed (no cleanup required after GREEN)._

## Files Created/Modified
- `src/lib/classify.js` - Added `TAB_TYPE_DEFAULTS` constant map and exported `resolveIsAppointed`/`matchesAppointedFilter` pure functions (alongside existing FEDERAL_ORDER/STATE_ORDER/LOCAL_ORDER constants)
- `src/lib/classify.test.js` - Added `describe('TAB_TYPE_DEFAULTS + appointed-filter logic')` block with 12 test cases; updated the top-of-file import to pull in the three new symbols

## Decisions Made
- Left the inline duplicate definitions of `resolveIsAppointed`/`matchesAppointedFilter` in `Results.jsx` untouched — this plan's explicit scope boundary (per PLAN.md) is additive-only, so the plan stays independently green; Plan 02 (which depends on this plan) removes the duplicates and switches `Results.jsx` to import from `classify.js`.

## Deviations from Plan

None - plan executed exactly as written. RED confirmed all 12 new assertions failed with "is not a function" before GREEN; GREEN made all 12 pass without touching the other 88 existing tests.

## Known Stubs

None - this plan adds pure functions and a constant map only; no UI-facing stubs introduced.

## Threat Flags

None - no new network endpoints, auth paths, file access, or schema changes. Matches the plan's threat_model (T-215-01: display-only default, no authorization boundary).

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
`classify.js` now exports `TAB_TYPE_DEFAULTS`, `resolveIsAppointed`, and `matchesAppointedFilter`, giving Plan 02 a stable import to switch `Results.jsx` over to (removing the now-duplicated inline definitions) and to wire the per-tab type-filter default into the tab UI. No blockers.

---
*Phase: 215-header-declutter-elected-default-compass-icons-search-by-nam*
*Completed: 2026-07-22*

## Self-Check: PASSED

- FOUND: src/lib/classify.js
- FOUND: src/lib/classify.test.js
- FOUND: .planning/phases/215-header-declutter-elected-default-compass-icons-search-by-nam/215-01-SUMMARY.md
- FOUND commit: c47dda6e (test RED)
- FOUND commit: 264ff94e (feat GREEN)
- FOUND commit: ed9a2e3d (docs SUMMARY)
