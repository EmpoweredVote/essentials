---
phase: 19-tx-congressional-seats-geofences
plan: 03
subsystem: database
tags: [postgres, migration, politicians, offices, districts, tx, congress, national_lower]

requires:
  - phase: 19-01
    provides: 38 NATIONAL_LOWER TX districts (geo_ids 4801..4838) + district_id backfill

provides:
  - 37 active TX US House politician rows (119th Congress, TX-1..TX-22 + TX-24..TX-38)
  - 38 TX US House office rows (37 active + 1 vacant for TX-23)
  - FK chain: districts -> offices -> politicians -> chambers (US House)

affects: [19-04-geofence-intersection, representatives-api]

tech-stack:
  added: []
  patterns:
    - "CTE-per-district pattern: WITH ins_p AS (INSERT ... RETURNING id) INSERT INTO offices CROSS JOIN ins_p"
    - "Idempotency: ON CONFLICT (external_id) DO NOTHING + NOT EXISTS office guard"
    - "Vacancy pattern: standalone INSERT with is_vacant=true and politician_id=NULL (no politician CTE)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/105_tx_congressional_house_officials.sql
  modified: []

key-decisions:
  - "US House chamber UUID: c2facc31-7b13-428c-b7b9-32d0d3b95f76 (hardcoded in migration)"
  - "external_id series -100301..-100338; slot -100323 intentionally skipped (TX-23 vacancy)"
  - "TX-23 vacancy modeled as office-only row (is_vacant=true, politician_id=NULL) — no politician record"
  - "CTE CROSS JOIN pattern: if politician INSERT is a no-op, CROSS JOIN returns 0 rows so office INSERT is also no-op"

patterns-established:
  - "District-scoped idempotency: NOT EXISTS WHERE district_id + chamber_id prevents duplicate offices on re-run"

duration: 4min
completed: 2026-05-03
---

# Phase 19 Plan 03: TX US House Officials Migration Summary

**Migration 105 seeds 37 TX US House Representatives (119th Congress, TX-1..TX-38 minus vacant TX-23) with 38 offices linking to NATIONAL_LOWER districts via chamber UUID c2facc31**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-03T21:31:18Z
- **Completed:** 2026-05-03T21:35:38Z
- **Tasks:** 3 (Task 1 read-only, Task 2 file write, Task 3 DB apply)
- **Files modified:** 1

## Accomplishments

- Resolved US House chamber UUID `c2facc31-7b13-428c-b7b9-32d0d3b95f76` from live DB (chamber.name_formal = 'United States House of Representatives', government_id = 0a6b51aa)
- Wrote and applied migration 105: 37 politicians + 38 offices inserted on first run, all `INSERT 0 0` on re-run (idempotent)
- TX-23 seat correctly modeled as vacant office with `is_vacant=true` and `politician_id=NULL`; external_id -100323 intentionally unused
- PostGIS intersection chain now complete for TX US House: districts -> offices -> politicians ready for Plan 19-04

## Task Commits

Each task was committed atomically:

1. **Task 1: Resolve US House chamber UUID** - read-only, no commit needed
2. **Task 2: Write migration 105** - `b68a8e1` (feat)
3. **Task 3: Apply migration 105** - DB-only, no file changes

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/105_tx_congressional_house_officials.sql` — seeds 37 TX House politicians + 38 offices; 771 lines; wrapped in BEGIN/COMMIT; fully idempotent

## Decisions Made

- **US House chamber UUID hardcoded:** `c2facc31-7b13-428c-b7b9-32d0d3b95f76` — same approach as migration 103 which hardcodes the Senate UUID `7cbe07bc`
- **external_id series:** -100301 through -100338; -100323 skipped for TX-23 vacancy (no politician row exists for that slot)
- **CTE CROSS JOIN idempotency:** If `ON CONFLICT (external_id) DO NOTHING` causes the politician INSERT to return 0 rows, the CROSS JOIN with `ins_p` produces 0 rows and the office INSERT is also a no-op. This is the correct behavior — first run creates both rows, subsequent runs do nothing.
- **TX-23 vacancy:** Standalone INSERT (no politician CTE) with `is_vacant=true` and `politician_id=NULL`. The `NOT EXISTS` guard on district_id + chamber_id ensures idempotency.
- **No party corrections or name spelling adjustments needed** — all 37 names verified against 119th Congress Wikipedia member list

## Verification Results

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| TX House politician count | 37 | 37 | Yes |
| TX House office total | 38 | 38 | Yes |
| Active offices | 37 | 37 | Yes |
| Vacant offices | 1 | 1 | Yes |
| TX-23 is_vacant | true | true | Yes |
| TX-23 politician_id | NULL | NULL | Yes |
| TX-3 (Keith Self, Republican) | match | match | Yes |
| TX-4 (Pat Fallon, Republican) | match | match | Yes |
| Re-apply duplicates | 0 | 0 | Yes |
| Placeholder UUIDs in file | 0 | 0 | Yes |
| -100323 in data | 0 | 0 in data (2 in comments) | Yes |
| slug references | 0 | 0 | Yes |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — migration applied cleanly on first run, all 75 INSERTs (37 politicians + 38 offices) succeeded, idempotency confirmed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Migration 105 applied; 37 active politicians + 38 offices (37 active + 1 vacant TX-23) are live in the DB
- FK chain is complete: districts (geo_id '4801'..'4838') -> offices (chamber_id c2facc31) -> politicians
- Ready for Plan 19-04: PostGIS intersection query that joins Collin County boundary (geo_id=48085) against NATIONAL_LOWER districts to return TX-3 (Keith Self) and TX-4 (Pat Fallon) as the reps for Collin County addresses

---
*Phase: 19-tx-congressional-seats-geofences*
*Completed: 2026-05-03*
