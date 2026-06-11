---
phase: 110-ma-2026-elections
plan: 02
subsystem: database
tags: [postgres, elections, races, migration, legislative]

# Dependency graph
requires:
  - phase: 110-ma-2026-elections
    plan: 01
    provides: 11 MA 2026 statewide/federal races with non-null office_ids; migration counter at 357
provides:
  - Migration 358 applied: 200 MA 2026 general election legislative race rows (40 Senate + 160 House) all with non-null office_ids
  - MA-ELECTIONS-03 satisfied: exactly 200 MA legislative races exist with correct position_name derivation from office titles
  - Pre-existing "2nd Middlesex" race name corrected to "Second Middlesex" to match office title convention
affects:
  - 110-03 (Landing.jsx Boston entry — can proceed)
  - Discovery pipeline: all 200 MA legislative races now have scaffolded rows for candidate attachment

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CTE-JOIN INSERT for title-derived position names (MA pattern, NOT the per-DO-$$ MD pattern)"
    - "Pre-migration UPDATE to fix position_name mismatch between seeded data and office title convention"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/358_ma_2026_legislative_races.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-358.ts"
  modified: []

key-decisions:
  - "Pre-existing 'MA State Senate 2nd Middlesex District' races renamed to 'MA State Senate Second Middlesex District' to match office title convention — added as SECTION 0 UPDATE before the main INSERT"
  - "Applied via node node_modules/tsx/dist/cli.cjs (not npx tsx) — consistent with Plan 01 pattern on this machine"
  - "ON CONFLICT guard correctly handles all 5 pre-existing rows after position_name fix (4 matched without fix, 5 match after fix)"

requirements-completed: [MA-ELECTIONS-03]

# Metrics
duration: 10min
completed: 2026-06-11
---

# Phase 110 Plan 02: MA 2026 Legislative Race Scaffold Summary

**Migration 358 seeds all 200 MA 2026 general election legislative races via single-statement CTE-JOIN INSERT on office titles — 40 State Senate + 160 House of Representatives, all with non-null office_ids**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-06-11T01:10:00Z
- **Completed:** 2026-06-11T01:20:00Z
- **Tasks:** 2
- **Files created:** 2 (migration SQL + apply script)

## Accomplishments

- Migration 358 written as single-statement CTE-JOIN INSERT (NOT per-DO-$$ MD pattern) — derives all 200 position_names from `offices.title` via `regexp_replace` at query time
- Chamber filter uses `ch.name IN ('Massachusetts Senate', 'Massachusetts House of Representatives')` (safe guard avoiding the dual-government geo_id='25' pitfall)
- Pre-existing "MA State Senate 2nd Middlesex District" race renamed to "MA State Senate Second Middlesex District" to match office title convention ("Senator, Second Middlesex District") — both general and primary election rows updated
- All 5 smoke tests pass: Senate=40, House=160, total=200, NULL office_id=0, ledger 358=PRESENT
- Post-verify DO $$ block ran without exception — MA-ELECTIONS-03 satisfied

## Task Commits

Tasks 1 and 2 are committed together in the plan metadata commit (migration files live in C:/EV-Accounts/backend, outside the essentials git repo — applied directly to production DB).

**Plan metadata:** committed with SUMMARY.md

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/358_ma_2026_legislative_races.sql` — SQL migration: SECTION 0 (UPDATE to fix 2nd→Second Middlesex), SECTION 1 (CTE-JOIN INSERT for 200 races), SECTION 2 (ledger), SECTION 3 (post-verify DO $$ block)
- `C:/EV-Accounts/backend/scripts/_apply-migration-358.ts` — Apply script with 5 smoke tests (Senate=40, House=160, total=200, NULL=0, ledger=PRESENT); try/catch/finally style with pool.end() in finally

## Decisions Made

- Added SECTION 0 UPDATE to rename "MA State Senate 2nd Middlesex District" to "MA State Senate Second Middlesex District" — the pre-seeded row used abbreviated "2nd" but the office title uses spelled-out "Second"; the CTE derives from the office title so they must match
- Applied via `node node_modules/tsx/dist/cli.cjs` (not `npx tsx`) — consistent with Plan 01 pattern
- Both primary AND general election "2nd Middlesex" rows updated (both existed from v5.0 seeding)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Pre-existing race position_name mismatch: "2nd Middlesex" vs "Second Middlesex"**
- **Found during:** Task 2 (first migration run failed with count=201, expected 200)
- **Issue:** The pre-existing "MA State Senate 2nd Middlesex District" race row was seeded with abbreviated "2nd" but the office title is "Senator, Second Middlesex District". The CTE-JOIN produces "MA State Senate Second Middlesex District". Because these strings differ, ON CONFLICT did not fire for that row — instead a new row was inserted, creating a duplicate district with count=201.
- **Fix:** Added SECTION 0 UPDATE at the start of migration 358 SQL to rename both the general and primary election rows from "...2nd Middlesex District" to "...Second Middlesex District". After this fix, all 5 pre-existing conflicts fire correctly and the count lands at exactly 200.
- **Files modified:** `C:/EV-Accounts/backend/migrations/358_ma_2026_legislative_races.sql`
- **Verification:** Migration re-ran with all 5 smoke tests passing (200 total, 0 NULL office_id)
- **Committed in:** plan metadata commit

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for correctness. No scope creep.

## Verification Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| MA State Senate races (general) | 40 | 40 | PASS |
| MA House races (general) | 160 | 160 | PASS |
| Total MA legislative races | 200 | 200 | PASS |
| MA races with NULL office_id | 0 | 0 | PASS |
| Ledger entry 358 | PRESENT | PRESENT | PASS |
| Post-verify DO $$ block | no exception | no exception | PASS |

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced beyond the planned INSERT. The UPDATE in SECTION 0 modifies 2 existing pre-seeded rows' position_name to match the canonical office title convention — this is corrective, not additive.

## Known Stubs

None — all 200 race rows have real office_ids derived from the actual MA legislature office records in the DB.

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/358_ma_2026_legislative_races.sql` — exists
- [x] `C:/EV-Accounts/backend/scripts/_apply-migration-358.ts` — exists
- [x] All 5 smoke tests pass
- [x] Post-verify block: no exception
- [x] MA-ELECTIONS-03 satisfied: 200 legislative races, 0 NULL office_ids
- [x] Ledger 358 PRESENT

## Next Phase Readiness

- Plan 03 (Landing.jsx Boston entry) can proceed — no dependencies on this plan's data
- MA 2026 discovery pipeline now fully armed: all races scaffolded for candidate attachment
- Total MA 2026 general election races: 16 statewide/federal + 200 legislative = 216 rows

## Self-Check: PASSED

- `C:/EV-Accounts/backend/migrations/358_ma_2026_legislative_races.sql` — FOUND
- `C:/EV-Accounts/backend/scripts/_apply-migration-358.ts` — FOUND
- `.planning/phases/110-ma-2026-elections/110-02-SUMMARY.md` — FOUND
- Commit eebe7d2 — FOUND

---
*Phase: 110-ma-2026-elections*
*Completed: 2026-06-11*
