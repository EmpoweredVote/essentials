---
phase: 18-compass-stances
plan: 02
subsystem: database
tags: [postgres, compass, stances, politician_answers, mckinney, allen, housing, taxes]

# Dependency graph
requires:
  - phase: 18-01
    provides: Scale direction confirmed (1=progressive, 5=conservative), apply script pattern, housing+taxes topic UUIDs
provides:
  - 6 McKinney council housing stances in inform.politician_answers
  - 3 Allen council stances (Schaeffer housing+taxes, Brooks housing) in inform.politician_answers
affects: [18-03, compass-display, profile-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: ["CSV-driven stance ingestion with tsx apply scripts (path.join __dirname pattern for cross-platform paths)"]

key-files:
  created:
    - C:\EV-Accounts\backend\scripts\apply-mckinney-stances.ts
    - C:\EV-Accounts\backend\scripts\apply-allen-stances.ts
    - C:\EV-Accounts\backend\data\stance-research\2026-05-12-mckinney-council.csv
    - C:\EV-Accounts\backend\data\stance-research\2026-05-12-allen-council.csv
  modified: []

key-decisions:
  - "Michael Jones (McKinney) intentionally absent — no evidenced stances found"
  - "Tommy Baril, Ken Cook, Amy Gnadt, Carl Clemencich, Ben Trahan (Allen) intentionally absent — no evidenced stances found"
  - "Allen Schaeffer (c7a0ecf6) placed at 4 on both housing and taxes — anti-mandate housing + explicit tax-rate-lowering pledge"
  - "Allen Brooks (3e616ef8) placed at 3 on housing — mixed-use private development, neighborhood character balance"

patterns-established:
  - "Apply scripts use path.join(__dirname, '..', 'data', 'stance-research', filename) for reliable cross-platform path resolution"
  - "Verification scripts (.ts) written alongside apply scripts to confirm exact DB state post-ingestion"

# Metrics
duration: 10min
completed: 2026-05-12
---

# Phase 18 Plan 02: McKinney + Allen Council Compass Stances Summary

**6 McKinney housing stances and 3 Allen stances (Schaeffer housing+taxes, Brooks housing) ingested into inform.politician_answers via CSV apply scripts**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-05-12T00:00:00Z
- **Completed:** 2026-05-12T00:10:00Z
- **Tasks:** 2
- **Files modified:** 4 created (2 CSVs, 2 scripts)

## Accomplishments

- 6 McKinney council members now have housing topic stances (values: 2, 3, 3, 3, 3, 4 — balanced spread)
- Schaeffer (Allen) has housing=4 (anti-mandate) and taxes=4 (lower-rate pledge) — first Allen politician with two compass spokes
- Brooks (Allen) has housing=3 (mixed-use, neighborhood-character balanced)
- Michael Jones and 5 unresearched Allen members correctly absent per evidence-only rule

## Task Commits

Each task was committed atomically (in C:\EV-Accounts\backend repo):

1. **Task 1: McKinney CSV + apply script + run ingestion** - `28a0ae8` (feat)
2. **Task 2: Allen CSV + apply script + run ingestion** - `11d3a3e` (feat)

**Plan metadata:** (committed in essentials repo — docs(18-02))

## Files Created/Modified

- `C:\EV-Accounts\backend\scripts\apply-mckinney-stances.ts` — Upserts 6 McKinney housing rows
- `C:\EV-Accounts\backend\data\stance-research\2026-05-12-mckinney-council.csv` — 6 McKinney rows (gitignored)
- `C:\EV-Accounts\backend\scripts\apply-allen-stances.ts` — Upserts 3 Allen rows
- `C:\EV-Accounts\backend\data\stance-research\2026-05-12-allen-council.csv` — 3 Allen rows (gitignored)

## Decisions Made

- **Evidence-only rule enforced:** Michael Jones (McKinney) has no public stance evidence on housing — correctly absent. Same for 5 Allen members with no sourced positions.
- **Allen Schaeffer at 4 on taxes:** mike4allen.com explicitly pledges to continue lowering the tax rate — consistent conservative fiscal stance.
- **Allen Schaeffer at 4 on housing:** Platform opposes inclusionary mandates and states "never approved an apartment" — developer-led, anti-mandate position maps to 4.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

- Initial DB count check returned 33 (not 6) for McKinney politicians — these IDs have rows from other compass topics from prior phases. Filtered specifically by `topic_id = housing_uuid` confirmed exactly 6 correct rows. Not a bug.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Plan 18-02 complete: 9 total rows ingested (6 McKinney + 3 Allen)
- Combined with Plan 18-01 (7 Plano rows), Phase 18 now has 16 rows in inform.politician_answers across Plano, McKinney, Allen
- Ready for Plan 18-03 (remaining cities: Frisco, Richardson, or any other Collin County cities with evidenced stances)
- No blockers

---
*Phase: 18-compass-stances*
*Completed: 2026-05-12*
