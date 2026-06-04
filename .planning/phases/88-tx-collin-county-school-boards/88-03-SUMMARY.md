---
phase: 88-tx-collin-county-school-boards
plan: "03"
subsystem: ui
tags: [react, groupHierarchy, ordering, labeling, tx, collin-county, school-boards]

# Dependency graph
requires:
  - phase: 88-tx-collin-county-school-boards
    provides: TX ISD board members seeded in DB (Plan 01); headshots audited (Plan 02)
provides:
  - Three targeted fixes in groupHierarchy.js closing GAP 1, GAP 2, GAP 4 from Phase 88 UAT
  - School board members now sort numerically by Place/District number
  - TX city mayors now appear first in city section regardless of district_type
  - TX city council sections now labeled by chamber name instead of 'Council Place N'
affects: [groupHierarchy, tx-city-reps, school-board-ordering, chamber-label-fallback]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rule 3.5 pattern: chamber_name_formal/chamber_name fallback for body-less LOCAL groups in getSubGroupLabel()"
    - "LOCAL_EXEC_TITLE_RE.test guard in subGroupOrderScore() for LOCAL-district mayors"

key-files:
  created: []
  modified:
    - src/lib/groupHierarchy.js

key-decisions:
  - "Use LOCAL_EXEC_TITLE_RE.test guard (not district_type check alone) so TX mayors sort first regardless of district_type"
  - "Rule 3.5 fires only for LOCAL/LOCAL_EXEC with no body — does not affect CA/OR/IN/ME which have government_bodies rows"
  - "Place added to sortPoliticians() title-regex alongside district/seat/ward — all 5 Collin County ISDs use Place N titles"

patterns-established:
  - "Rule 3.5: For LOCAL groups with no government_bodies row, fall back to chamber_name_formal then chamber_name as the section label"

requirements-completed: [TX-SCHOOL-01, TX-SCHOOL-02, TX-SCHOOL-03, TX-SCHOOL-04, TX-SCHOOL-05]

# Metrics
duration: 3min
completed: "2026-06-04"
---

# Phase 88 Plan 03: groupHierarchy.js — 3 GAP-Closure Fixes Summary

**Three targeted JS edits close GAP 1/2/4 from Phase 88 UAT: school board Place N numeric sort, TX mayor section-first ordering, and Frisco/Plano city council correct section label via chamber_name fallback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-06-04T05:53:12Z
- **Completed:** 2026-06-04T05:56:00Z
- **Tasks:** 3
- **Files modified:** 1

## Accomplishments
- GAP 1 closed: /(?:district|place|seat|ward)\s+(\d+)/i in both aTitleNum/bTitleNum sort lines — Plano/McKinney/Allen/Frisco ISD board members now sort Place 1, 2, 3... numerically
- GAP 2 closed: subGroupOrderScore() score-10 branch now accepts LOCAL-district mayors via LOCAL_EXEC_TITLE_RE.test guard — Mayor John Muns (Plano) appears first in city section
- GAP 4 closed: getSubGroupLabel() Rule 3.5 returns chamber_name_formal || chamber_name for body-less LOCAL groups — Frisco/Plano city council shows "Plano City Council" instead of "Council Place N"

## Task Commits

Each task was committed atomically:

1. **Task 1: Add 'place' to office_title sort regex in sortPoliticians()** - `e5d9e44` (fix)
2. **Task 2: Relax subGroupOrderScore() to score mayors by title, not district_type** - `918c4ef` (fix)
3. **Task 3: Add chamber_name_formal fallback Rule 3.5 in getSubGroupLabel()** - `36e5f32` (fix)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/lib/groupHierarchy.js` - Three targeted line-level fixes: sort regex, mayor score guard, chamber_name label fallback

## Decisions Made
- Chose LOCAL_EXEC_TITLE_RE.test as the title check for GAP 2 — this regex is already defined at line 145 and matches /\b(mayor|governor)\b/i, which is exactly the right scope; no new constant needed
- Rule 3.5 positioned AFTER `if (body)` block and BEFORE Rule 4 (`const rawTitle`) so it only fires when government_bodies is absent; existing cities with government_bodies rows remain unaffected

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

One setup issue: initial Edit used the main-repo path (`C:/Transparent Motivations/essentials/src/lib/groupHierarchy.js`) instead of the worktree path. Detected immediately via git add error ("outside repository"), reverted the main-repo change, and applied the edit to the correct worktree path. No data loss; no incorrect commits.

## User Setup Required

None - no external service configuration required. Visual verification is recommended per the plan's verification section:
1. Plano TX address → ISD board members in Place 1, 2, 3... order
2. Plano TX address → Mayor John Muns appears FIRST in Plano city section
3. Frisco TX address → city council labeled "Frisco City Council" (not "Council Place N")
4. Richardson ISD → District 1-5 before Place 6-7 numerically

## Next Phase Readiness

- All three GAP 1/2/4 code fixes shipped; ready for human visual UAT verification
- No DB migration required; changes are pure frontend JS
- Richardson ISD hybrid order (District 1-5 then Place 6-7) will work correctly because the regex now extracts numbers from both "Board Member, District N" and "Board Member, Place N" titles, and all 7 members share the same district_id (UUID, non-numeric NaN), so the title-extracted number is the sole numeric sort key

---
*Phase: 88-tx-collin-county-school-boards*
*Completed: 2026-06-04*
