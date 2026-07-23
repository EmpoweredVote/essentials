---
phase: 110-ma-2026-elections
plan: 01
subsystem: database
tags: [postgres, elections, races, race-candidates, migration]

# Dependency graph
requires:
  - phase: 108-boston-deep-seed
    provides: Boston city government seed + MA 2026 elections/discovery rows pre-existing from v5.0
  - phase: 109-ma-tier-2-cities
    provides: Migration counter at 356; MA context established
provides:
  - Migration 357 applied: 2 NULL office_id US Senate MA races fixed; Governor of Massachusetts race seeded; 7 missing US House MA races seeded; Healey in race_candidates
  - 11 MA 2026 general election statewide/federal races all with non-null office_ids
  - MA-ELECTIONS-01 asserted (2 election rows exist, no new insert)
  - MA-ELECTIONS-04 asserted (2 discovery_jurisdictions rows exist, no new insert)
  - MA-ELECTIONS-02 partially satisfied (Senate fixed, Governor + House seeded, Healey as candidate)
affects:
  - 110-02 (legislative races, depends on Plan 01's races existing)
  - 110-03 (Landing.jsx, downstream)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "UPDATE-before-INSERT pattern for NULL office_id repair on existing race rows"
    - "WITH gen_elec CTE + VALUES multi-row INSERT for statewide/federal races"
    - "race_candidates INSERT requires full_name (NOT NULL) — derive from politicians table JOIN"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/357_ma_2026_statewide_races.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-357.ts"
  modified: []

key-decisions:
  - "race_candidates INSERT must JOIN essentials.politicians to supply full_name (NOT NULL constraint not in RESEARCH.md)"
  - "TX file for apply script uses node node_modules/tsx/dist/cli.cjs (npx tsx not in PATH on this machine)"
  - "Governor general race only (no primary row) — matches MD/VA pattern; discovery handles primary candidates"

patterns-established:
  - "Pattern: race_candidates INSERT — always JOIN politicians table to get full_name/first_name/last_name instead of hardcoding"
  - "Pattern: Apply scripts run via node node_modules/tsx/dist/cli.cjs on this machine (not npx tsx)"

requirements-completed: [MA-ELECTIONS-01, MA-ELECTIONS-02, MA-ELECTIONS-04]

# Metrics
duration: 7min
completed: 2026-06-11
---

# Phase 110 Plan 01: MA 2026 Statewide Races Summary

**Migration 357 fixes 2 NULL office_id Senate races, seeds Governor of Massachusetts + 7 US House races, and adds Healey as incumbent candidate — 11 MA 2026 general election statewide/federal races all linked to offices**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-06-11T00:58:00Z
- **Completed:** 2026-06-11T01:05:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- DB assertions confirmed: 2 MA 2026 election rows exist (MA-ELECTIONS-01 ASSERTED), 2 MA discovery_jurisdictions rows exist for geo_id='25' (MA-ELECTIONS-04 ASSERTED)
- Migration 357 applied successfully: UPDATE fixed 2 NULL office_id rows on U.S. Senate Massachusetts races; INSERT seeded Governor of Massachusetts + 9 US House races (MA-01 through MA-09, with ON CONFLICT guard for existing MA-05/MA-07); Healey added to race_candidates
- All 4 smoke tests pass: 0 NULL office_ids, 11 statewide/federal races, Healey in race_candidates=1, ledger 357 PRESENT

## Task Commits

Tasks 1 and 2 are committed together in the plan metadata commit (migration files live in C:/EV-Accounts/backend, outside the essentials git repo — applied directly to production DB).

**Plan metadata:** committed with SUMMARY.md

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/357_ma_2026_statewide_races.sql` — SQL migration: UPDATE Senate office_ids + INSERT Governor/House races + race_candidates Healey + ledger + post-verify DO $$ block
- `C:/EV-Accounts/backend/scripts/_apply-migration-357.ts` — Apply script with 4 smoke tests (NULL count, race count, Healey candidate, ledger)

## Decisions Made

- race_candidates INSERT requires JOIN on `essentials.politicians` to supply `full_name`, `first_name`, `last_name` (full_name is NOT NULL — not documented in RESEARCH.md pattern)
- No primary race row for Governor (general only) — consistent with MD/VA pattern; discovery agent handles primary candidates
- Applied via `node node_modules/tsx/dist/cli.cjs` since `npx tsx` is not in PATH on this machine

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] race_candidates INSERT missing required full_name field**
- **Found during:** Task 2 (run apply script)
- **Issue:** The plan's race_candidates INSERT pattern only included (race_id, politician_id, is_incumbent) but `full_name` is NOT NULL in the table schema — migration failed with null constraint violation on first run
- **Fix:** Updated Section 3 of migration SQL to JOIN `essentials.politicians` on politician_id and SELECT `p.full_name`, `p.first_name`, `p.last_name` alongside `p.id`
- **Files modified:** `C:/EV-Accounts/backend/migrations/357_ma_2026_statewide_races.sql`
- **Verification:** Migration re-ran successfully; Healey smoke test shows 1 (expected 1)
- **Committed in:** plan metadata commit

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for correctness. No scope creep.

## Issues Encountered

- `npx tsx` command not found in PATH; resolved by invoking `node node_modules/tsx/dist/cli.cjs` directly from the C:/EV-Accounts/backend directory

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. Migration is a pure SQL UPDATE + INSERT on existing tables with verified FK constraints.

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/357_ma_2026_statewide_races.sql` — exists, verified
- [x] `C:/EV-Accounts/backend/scripts/_apply-migration-357.ts` — exists, verified
- [x] All 4 smoke tests passed: NULL office_id=0, statewide/federal races=11, Healey=1, ledger=PRESENT
- [x] MA-ELECTIONS-01 asserted (2 election rows)
- [x] MA-ELECTIONS-04 asserted (2 discovery_jurisdictions rows)
- [x] MA-ELECTIONS-02 partially satisfied (Senate fixed, Governor+House seeded, Healey as candidate)

## Next Phase Readiness

- Plan 02 (Migration 358: 200 MA legislative race scaffold) can proceed — statewide/federal races are complete
- Plan 03 (Landing.jsx Boston entry) can proceed independently
- Markey race_candidates already existed from v5.0 (no change needed for Senator)

---
*Phase: 110-ma-2026-elections*
*Completed: 2026-06-11*
