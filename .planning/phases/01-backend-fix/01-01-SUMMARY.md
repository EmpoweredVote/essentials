---
phase: 01-backend-fix
plan: 01
subsystem: api
tags: [postgres, left-join, typescript, vitest]

requires: []
provides:
  - Elections API returns races with zero candidates (empty candidates array)
  - Shape contract test asserting race.candidates is always an array
affects:
  - Phase 3 (Unopposed and Empty Race UX) — can now render "No candidates have filed" for 0-candidate races

tech-stack:
  added: []
  patterns:
    - LEFT JOIN with filter in ON clause (not WHERE) to preserve NULL rows
    - Null guard before candidate push in grouping loop

key-files:
  created: []
  modified:
    - C:/EV-Accounts/backend/src/lib/electionService.ts
    - C:/EV-Accounts/tests/integration/essentials-elections.test.ts

key-decisions:
  - "Move candidate_status != 'withdrawn' filter from WHERE to ON clause to preserve 0-candidate race rows"
  - "Null guard in dedup filter: skip Set operations for NULL candidate_id"
  - "Null guard in grouping loop: only push candidate object when candidate_id is non-null"

patterns-established:
  - "LEFT JOIN with status filter in ON clause: standard pattern for optional relationships in this codebase"

duration: 4m29s
completed: 2026-04-12
---

# Plan 01-01: Fix LEFT JOIN + null-safe dedup/grouping + shape test

**LEFT JOIN on race_candidates in both geofence and statewide queries, with null-safe TypeScript dedup/grouping and a shape contract integration test confirming race.candidates is always an array.**

## Performance

- **Duration:** 4m29s
- **Started:** 2026-04-13T05:46:05Z
- **Completed:** 2026-04-13T05:50:34Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- LEFT JOIN on essentials.race_candidates in both Part A (geofence) and Part B (statewide) queries
- Moved `candidate_status != 'withdrawn'` filter from WHERE clause to ON clause in both queries
- Null-safe deduplication filter: NULL candidate_id values bypass the Set tracking
- Null-safe grouping loop: candidate push guarded behind `candidate_id !== null` check
- ElectionRow interface updated: candidate_id, full_name, is_incumbent, candidate_status marked nullable
- Integration test extended with shape assertion: every race has a candidates array

## Task Commits

1. **Task 1: Fix electionService.ts** - `903018d` (fix)
2. **Task 2: Extend integration test** - `3fdc242` (test)

**Plan metadata:** `d711180` (docs: complete plan)

## Files Created/Modified
- `C:/EV-Accounts/backend/src/lib/electionService.ts` - LEFT JOIN + null-safe dedup and grouping
- `C:/EV-Accounts/tests/integration/essentials-elections.test.ts` - Shape assertion test added

## Decisions Made
- Moved `candidate_status != 'withdrawn'` from WHERE to ON clause — keeping it in WHERE would turn LEFT JOIN back into effective INNER JOIN (NULL != 'withdrawn' evaluates to NULL/falsy in PostgreSQL)

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None. TypeScript compiled cleanly on first pass after changes. All 9 tests passed (8 pre-existing + 1 new).

## Next Phase Readiness
Backend now returns 0-candidate races with empty candidates array. Phase 3 can render "No candidates have filed" notices. Phase 2 (Elections Page) can proceed in parallel — it doesn't depend on 0-candidate race rendering.

---
*Phase: 01-backend-fix*
*Completed: 2026-04-12*
