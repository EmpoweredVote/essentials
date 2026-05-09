---
phase: 29-bar-evaluation-data
plan: 01
subsystem: database
tags: [postgres, migrations, judicial, lacba, elections, race-candidates]

# Dependency graph
requires:
  - phase: 28-judicial-compass
    provides: judicial_evaluations table schema + incumbent judge politician IDs
  - phase: 25-la-elections
    provides: June 2026 LA County Primary election_id + City Attorney politician IDs
provides:
  - 11 contested LA Superior Court races seeded for June 2026 election
  - 25 challenger politician records (attorneys, is_incumbent=false)
  - 28 race_candidates rows linking all candidates to races
  - 32 judicial_evaluations rows (28 LACBA-rated + 4 City Attorney not-evaluated)
affects: [29-02, BarEvaluationSection rendering, judicial profile pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WHERE NOT EXISTS guard for politician inserts (no unique constraint on full_name)"
    - "INSERT ... SELECT ... WHERE NOT EXISTS for race_candidates idempotency"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/117_la_superior_court_june2026_races.sql
  modified: []

key-decisions:
  - "Used WHERE NOT EXISTS instead of ON CONFLICT DO NOTHING for politician inserts — politicians table has no unique constraint on full_name"
  - "All 11 Superior Court races use office_id=NULL (no office records exist for these Superior Court positions)"
  - "LACBA JEEC used as source string; rating_date='2026-01-01' for all 2026 cycle ratings"
  - "City Attorney candidates get Not evaluated entry with source_url='https://www.lacba.org' (their evaluation page returns 403)"

patterns-established:
  - "Pattern: challenger politicians always is_incumbent=false, is_active=true, data_source from rating source"
  - "Pattern: judicial_evaluations deduped on (politician_id, source, rating_date) unique index"

# Metrics
duration: 10min
completed: 2026-05-09
---

# Phase 29 Plan 01: Bar Evaluation Data — Seed Summary

**Migration 117 applied: 11 LA Superior Court races, 25 challenger politicians, 28 race_candidate links, 32 LACBA judicial_evaluations rows seeded for June 2026**

## Performance

- **Duration:** 10 min
- **Started:** 2026-05-09T19:54:20Z
- **Completed:** 2026-05-09T20:05:12Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Created migration 117 with full idempotency (all 83 INSERTs return 0 rows on re-run)
- 11 contested Superior Court races seeded for election_id 1ebca37f-cf96-47f4-bc2b-47ef266721fe
- 25 challenger politician records created (attorneys challenging incumbents)
- 28 race_candidates rows linking all rated candidates to their races (25 challengers + 3 incumbents)
- 32 judicial_evaluations rows: 28 LACBA-rated entries + 4 City Attorney "not evaluated" entries

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 117** - `8ce08ba` (feat)
2. **Task 2: Apply migration + idempotency fix** - `d83580e` (fix)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/117_la_superior_court_june2026_races.sql` - Full migration: races, challenger politicians, race_candidates, judicial_evaluations

## Decisions Made
- Used `WHERE NOT EXISTS` guard for all politician INSERTs because the `essentials.politicians` table has no unique constraint on `full_name`. The `ON CONFLICT DO NOTHING` syntax without a conflict target is syntactically valid but doesn't prevent duplicate inserts when no applicable unique constraint exists.
- Superior Court races use `office_id=NULL` — no office records exist for these positions (they're not linked to a chambers/government hierarchy in the current schema).
- Incumbent judges (Draper, Walgren, Connolly) use their hardcoded UUIDs for race_candidates rather than a name lookup to avoid ambiguity.
- City Attorney "not evaluated" source_url is `https://www.lacba.org` because the specific LACBA evaluation page returns HTTP 403.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed idempotency failure for politician INSERTs**
- **Found during:** Task 2 (applying migration to production — idempotency test)
- **Issue:** `ON CONFLICT DO NOTHING` without a conflict target on politicians table has no unique constraint on `full_name`, so re-running the migration inserted 25 duplicate politician rows
- **Fix:** Replaced all 25 politician INSERT...VALUES with INSERT...SELECT...WHERE NOT EXISTS pattern; deleted 25 duplicate records that the idempotency test had created (also removed their linked race_candidates and judicial_evaluations orphans)
- **Files modified:** 117_la_superior_court_june2026_races.sql
- **Verification:** Third run of migration shows `INSERT 0 0` on all 83 statements
- **Committed in:** d83580e

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Critical fix for migration correctness. Migration now fully idempotent as required.

## Issues Encountered
- Second run of migration during idempotency testing created 25 duplicate politicians (before fix was applied). Cleaned up immediately with a targeted DELETE using ctid ordering to identify the later-inserted rows. All counts verified correct after cleanup.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- LACBA ratings data is in judicial_evaluations and ready for BarEvaluationSection to render
- Plan 29-02 can proceed: CJP disciplinary records for Patrick Connolly (3 confirmed actions) + building BarEvaluationSection UI component
- No blockers

---
*Phase: 29-bar-evaluation-data*
*Completed: 2026-05-09*
