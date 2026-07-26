---
phase: 207-officials-classification
plan: 01
subsystem: ui
tags: [react, classification, frontend, vitest]

# Dependency graph
requires: []
provides:
  - "classifyBucket(pol) single source of truth in src/lib/classify.js — buckets any office-holder row into 'representative' | 'educator' | 'judge'"
  - "42 unit tests + 12 cross-location fixture tests covering all district_type literals, DA/PD override, superintendent override, LOCAL-mistyped school board, judge/justice title fallback, additive-only invariant, and null-safety"
affects: [208-educators-judges-tabs, 210-per-tab-lens-defaults]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "district_type base + additive-only title/chamber override precedence (D-07/D-08) reused from classifyCategory's existing early-return style"
    - "Module-level const regex (..._RE) + RegExp.test() for guarded overrides, mirroring computeVariant's existing style — not hasAny (its substring-only match would catch 'Attorney General' via a bare 'attorney' test)"

key-files:
  created: []
  modified:
    - src/lib/classify.js
    - src/lib/classify.test.js

key-decisions:
  - "SCHOOL_BOARD added to the Educator district_type set alongside SCHOOL/STATE_BOARD (live-DB correction to D-04's literal list — DC's 9 SBOE members)"
  - "DA/PD/prosecutor override checked regardless of base district_type, not scoped to COUNTY only (Pitfall 1 — SF's DA/PD/City Prosecutor are LOCAL_EXEC)"
  - "classifyBucket reads district_type/office_title/chamber_name(_formal) directly rather than calling classifyCategory/getBranch/getTier — avoids importing display-oriented modules with unrelated side effects (RESEARCH.md Reuse Recommendation)"

patterns-established:
  - "classifyBucket as the canonical 3-bucket classifier — future consumers (Phase 208 tabs) must call this function, never re-derive bucket logic from district_type directly"

requirements-completed: [CLASS-01]

# Metrics
duration: 3min
completed: 2026-07-18
---

# Phase 207 Plan 01: Officials Classification (classifyBucket) Summary

**Single-source-of-truth `classifyBucket(pol)` classifier added to `src/lib/classify.js` — buckets every office-holder into representative/educator/judge via district_type base + additive-only title/chamber overrides, verified with 54 new unit tests across 3 real contrasting locations.**

## Performance

- **Duration:** 3 min (207 seconds)
- **Started:** 2026-07-18T03:18:20Z
- **Completed:** 2026-07-18T03:21:47Z
- **Tasks:** 3 completed (RED / GREEN / cross-location fixtures)
- **Files modified:** 2

## Accomplishments
- `classifyBucket(pol)` exported from `src/lib/classify.js` as the single function both today's Results grouping and Phase 208's future Educators & Judges tabs will call — classification can never drift between the two consumers (D-06).
- All 15 live `district_type` literals correctly bucketed, including the two literals (`SCHOOL_BOARD`, `CITY_COUNCIL`) that no existing frontend code recognized before this plan.
- Four additive-only title/chamber overrides implemented and negative-guarded: DA/prosecutor/public-defender → judge (excludes Attorney General/City Attorney), judge/justice title fallback, school-superintendent → educator (excludes non-education superintendents), school-board/board-of-education text → educator (rescues Portland-ME's LOCAL-mistyped board).
- Verified against real, live-DB-shaped fixture data across 3 contrasting locations (LA, Bloomington/Monroe County IN, an AZ city) plus DC and SF live-data-correction guards — 195/195 tests green, zero regressions to `classifyCategory`/`computeVariant`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing classifyBucket unit tests (RED)** - `37acb42b` (test)
2. **Task 2: Implement classifyBucket in classify.js (GREEN)** - `683fdbce` (feat)
3. **Task 3: Cross-location fixtures verification (SC-05 / D-11)** - `3d0bfd92` (test)

**Plan metadata:** (this commit) (docs: complete plan)

## Files Created/Modified
- `src/lib/classify.js` — added `classifyBucket(pol)` plus 5 module-level constants (`JUDGE_DISTRICT_TYPES`, `EDUCATOR_DISTRICT_TYPES`, `PROSECUTOR_DEFENDER_TITLE_RE`, `JUDGE_TITLE_RE`, `SCHOOL_SUPERINTENDENT_TITLE_RE`, `SCHOOL_BOARD_TEXT_RE`), inserted directly below `classifyCategory`. No existing export touched.
- `src/lib/classify.test.js` — extended the named import to include `classifyBucket`; appended `describe('classifyBucket', ...)` (base cases, overrides, negative guards, additive-only invariant, null-safety) and `describe('classifyBucket — live location fixtures (SC-05)', ...)` (LA / Bloomington-IN / AZ city + DC/SF guards) blocks.

## Decisions Made
- SCHOOL_BOARD included in the Educator base set from the start (RESEARCH.md flagged this as mandatory, not optional — omitting it would violate SC-02 for every DC address).
- DA/PD override tested against both `COUNTY` and `LOCAL_EXEC` base district_types in every test (Pitfall 1), not just COUNTY as CONTEXT.md's rationale text implied.
- Regex-based overrides (not the file's existing `hasAny` substring helper) used for all four additive overrides, matching `computeVariant`'s existing precedent and avoiding Pitfall 3 (a bare "attorney" substring test would wrongly match "Attorney General").

## Deviations from Plan

None - plan executed exactly as written. All three tasks' acceptance criteria were met without needing Rule 1-4 auto-fixes; the plan's own text already incorporated the RESEARCH.md-verified live-data corrections (SCHOOL_BOARD literal, LOCAL_EXEC DA titles, Portland-ME LOCAL-mistyped school board), so no additional deviation was required during implementation.

## Issues Encountered

None. The non-blocking confidence step mentioned in Task 3's action ("the executor MAY run a read-only live spot check against the production search / browse_geo_id flow for one location") was not performed — it is explicitly optional and non-blocking per the plan, and all required assertions are already covered by the automated fixture tests, which is the actual gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- `classifyBucket` is ready for Phase 208 to import and use for the Educators & Judges tab split — no further classification work needed.
- Full test suite (195 tests, 11 files) green; `classifyCategory` and `computeVariant` untouched and unaffected.
- No DB writes, no backend/API changes, no tabs UI built in this phase — matches phase boundary exactly.

## Self-Check: PASSED

- FOUND: src/lib/classify.js
- FOUND: src/lib/classify.test.js
- FOUND: .planning/phases/207-officials-classification/207-01-SUMMARY.md
- FOUND: 37acb42b (Task 1 commit)
- FOUND: 683fdbce (Task 2 commit)
- FOUND: 3d0bfd92 (Task 3 commit)

---
*Phase: 207-officials-classification*
*Completed: 2026-07-18*
