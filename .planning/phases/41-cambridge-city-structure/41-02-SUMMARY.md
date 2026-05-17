---
phase: 41-cambridge-city-structure
plan: 02
subsystem: database
tags: [postgres, migrations, cambridge, offices, supabase]

# Dependency graph
requires:
  - phase: 41-01
    provides: Cambridge LOCAL government (geo_id=2511000) + City Council chamber + School Committee chamber via migration 157
provides:
  - 17 Cambridge office rows: 9 City Councillor + 1 Mayor + 1 City Manager + 6 School Committee Member
  - All offices with is_appointed_position correctly set (Mayor + City Manager = true; all others = false)
  - All politician_id = NULL, ready for migration 159 to assign incumbents
affects:
  - 41-03 (migration 159 assigns incumbents to these offices by title lookup)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "generate_series(1, N) pattern for creating N identical office rows"
    - "Chamber UUID resolved at runtime via geo_id + name lookup (no hardcoded UUIDs)"
    - "Idempotency guard via RAISE EXCEPTION if dependency chambers missing"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/158_cambridge_offices.sql
  modified: []

key-decisions:
  - "Total office count is 17 (not 16 as stated in plan comments) — 9+1+1+6 = 17; plan docs had arithmetic error"
  - "normalized_position_name populated (column exists on essentials.offices)"
  - "Mayor and City Manager placed in City Council chamber (v_council_id), not a separate chamber"
  - "No district_id on any office (at-large seats; geofenced via G4110 Cambridge boundary)"

patterns-established:
  - "generate_series(1, N): creates N identical at-large office rows differentiated later by politician_id"

# Metrics
duration: 2min
completed: 2026-05-17
---

# Phase 41 Plan 02: Cambridge Offices Summary

**17 Cambridge office rows seeded via migration 158: 9 City Councillors + Mayor + City Manager (City Council chamber) + 6 School Committee Members; all politician_id NULL pending migration 159**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-17T02:49:20Z
- **Completed:** 2026-05-17T02:51:30Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Migration 158 written and applied to production without errors
- 17 office rows seeded across two chambers (11 in City Council, 6 in School Committee)
- British "Councillor" double-L spelling confirmed in all 9 City Councillor rows
- Mayor and City Manager correctly flagged is_appointed_position=true
- All 17 offices have politician_id=NULL, ready for migration 159

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 158 — all Cambridge offices** - `644dfb6` (feat) — EV-Accounts repo
2. **Task 2: Verify all 16 offices correctly structured** — verification only, no files modified

**Plan metadata:** _(see docs commit below)_

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/158_cambridge_offices.sql` - Seeds 17 Cambridge offices via DO block with runtime chamber UUID resolution

## Decisions Made

- **Office count is 17, not 16:** The plan objective says "16 Cambridge offices" but lists 9+1+1+6=17 components. The arithmetic error is in the plan docs. The migration correctly produces 17 rows matching the Cambridge city structure (9 councillors, Mayor, City Manager, 6 School Committee members).
- **normalized_position_name populated:** Column exists on essentials.offices; included in INSERT to match schema expectations.
- **Chamber UUIDs resolved at runtime:** Used geo_id='2511000' lookup rather than hardcoding UUIDs, so the migration is portable and self-verifying.

## Deviations from Plan

None - plan executed exactly as written. The "16 vs 17" discrepancy is a documentation error in the plan (not a migration error) — all components described in the plan are present in the migration output.

## Issues Encountered

None. Migration applied cleanly on first run. RAISE NOTICE confirmed both chamber UUIDs (council: b4b8c0a1, school: 41846a49) matching Phase 41-01 ground truth.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 17 Cambridge office rows exist with politician_id=NULL
- Migration 159 can run immediately — it will look up offices by title and chamber to assign incumbents (Yi-An Huang as City Manager, Siddiqui as Mayor, 9 councillors, 6 school committee members)
- "Councillor" double-L spelling verified — migration 159 WHERE clauses must use exact same spelling

---
*Phase: 41-cambridge-city-structure*
*Completed: 2026-05-17*
