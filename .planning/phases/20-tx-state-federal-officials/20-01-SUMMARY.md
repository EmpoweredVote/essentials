---
phase: 20-tx-state-federal-officials
plan: 01
subsystem: essentials-data
tags: [postgres, sql, migration, backfill, chambers, politicians, office_id]

# Dependency graph
requires:
  - phase: 17-headshots
    provides: migration 106 pattern for office_id back-fill (politicians.office_id via offices.politician_id join)
  - phase: 19-tx-congressional-seats-geofences
    provides: migration 103 context (original 8 TX state/federal politician + office inserts)
provides:
  - 6 TX executive chambers with name_formal populated (Texas Governor, Lt. Governor, AG, Comptroller, Land Commissioner, Agriculture Commissioner)
  - 8 TX state/federal politicians with office_id set (Cruz, Cornyn, Abbott, Patrick, Paxton, Hegar, Buckingham, Miller)
  - Migration 107 applied and verified idempotent
affects:
  - phase-20-plan-02-headshots
  - any profile page rendering for TX state/federal officials

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "office_id back-fill: UPDATE politicians p SET office_id = o.id FROM offices o WHERE o.politician_id = p.id (same pattern as migration 106)"
    - "name_formal back-fill: UPDATE chambers SET name_formal = name WHERE name_formal = '' AND id IN (...) — UUID-scoped, idempotent"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/107_tx_state_officials_office_id_backfill.sql
  modified: []

key-decisions:
  - "BETWEEN -100210 AND -100199 provides headroom beyond the 8 actual external_ids (-100200..-100207) in case more stubs are added in same numeric block"
  - "US Senate chamber (7cbe07bc-...) excluded from name_formal UPDATE — its name_formal was already correctly populated by migration 103"
  - "name_formal = name is the established convention: the formal name matches the display name for all TX executive chambers"

patterns-established:
  - "chambers name_formal back-fill: WHERE name_formal = '' AND id IN (explicit UUIDs) — never rely on name matching alone"
  - "politicians office_id back-fill: FROM offices o WHERE o.politician_id = p.id AND p.external_id BETWEEN X AND Y AND p.office_id IS NULL"

# Metrics
duration: 2min
completed: 2026-05-04
---

# Phase 20 Plan 01: TX State/Federal Officials Structural Gaps Summary

**Migration 107 applied: 6 TX executive chambers get name_formal populated + 8 state/federal politicians get office_id backfilled, unblocking profile page rendering**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-04T00:13:33Z
- **Completed:** 2026-05-04T00:15:42Z
- **Tasks:** 2
- **Files modified:** 1 (migration SQL file)

## Accomplishments

- Wrote migration 107 with two scoped, idempotent UPDATE statements in a single transaction
- Applied migration: `UPDATE 6` (chambers) then `UPDATE 8` (politicians) — exactly the expected counts
- Confirmed idempotent re-run: `UPDATE 0` and `UPDATE 0`

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 107 SQL file** - `f98d9a2` (chore — migration file creation)
2. **Task 2: Apply migration 107 and verify** - DB-only operation; verification results below; no new code files

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/107_tx_state_officials_office_id_backfill.sql` (2722 bytes) — Two-fix transaction: chambers name_formal + politicians office_id back-fill

## Verification Query Outputs

### First-run migration output

```
BEGIN
UPDATE 6
UPDATE 8
COMMIT
```

### Query 1: 6 TX executive chambers with name_formal populated

```
                  id                  |              name              |          name_formal
--------------------------------------+--------------------------------+--------------------------------
 b9fca92c-68d9-4031-bb50-ae3cf093daa8 | Texas Agriculture Commissioner | Texas Agriculture Commissioner
 621bfcf4-11d7-4c7a-a434-8f887ad51dcf | Texas Attorney General         | Texas Attorney General
 f599d3e2-140c-46a1-9f6b-3efcd3acf919 | Texas Comptroller              | Texas Comptroller
 4c0bbd02-ecd2-4e9d-b7bc-4e03b05a3739 | Texas Governor                 | Texas Governor
 65cb5326-6e24-448a-9199-86de75274a86 | Texas Land Commissioner        | Texas Land Commissioner
 d661b79d-679d-4f08-89b1-e04d36e4bb95 | Texas Lieutenant Governor      | Texas Lieutenant Governor
(6 rows)
```

All 6 rows: `name_formal = name` (non-empty).

### Query 2: 8 TX state/federal politicians with office_id set

```
 external_id |    full_name    |              office_id               |             title
-------------+-----------------+--------------------------------------+--------------------------------
     -100200 | Ted Cruz        | dbe83620-a948-4529-ab5b-c52b57fac294 | Senator
     -100201 | John Cornyn     | 61aa4e58-15d9-43ad-857a-72c624f7d8df | Senator
     -100202 | Greg Abbott     | d660034d-4215-47b0-bb59-3e1616fab09d | Texas Governor
     -100203 | Dan Patrick     | ecfc1979-4edc-4232-bc4c-381ecbc6a516 | Texas Lieutenant Governor
     -100204 | Ken Paxton      | 12a2385f-4dbc-4de3-9eaf-935c6fc58a8f | Texas Attorney General
     -100205 | Glenn Hegar     | d50da2bc-0e8f-4d70-ba6c-d0dfcd0613b2 | Texas Comptroller
     -100206 | Dawn Buckingham | 0bf99572-2eee-4183-97bf-721501889dbc | Texas Land Commissioner
     -100207 | Sid Miller      | 5e752883-f21c-4abf-9de8-80b5d1247929 | Texas Agriculture Commissioner
(8 rows)
```

All 8 rows: `office_id` non-null, UUIDs match expected plan values exactly.

### Query 3: Idempotency re-run

```
BEGIN
UPDATE 0
UPDATE 0
COMMIT
```

Migration is a no-op on re-run — both guards (`name_formal = ''` and `p.office_id IS NULL`) correctly prevent double-application.

## Decisions Made

- `BETWEEN -100210 AND -100199` range (not exact IDs) provides headroom for future state/federal stubs in the same numeric block before another back-fill cycle
- US Senate chamber excluded from name_formal UPDATE — migration 103 already populated it correctly; explicitly NOT in the IN() list
- name_formal = name convention: for TX executive chambers, formal name equals display name (no "of Texas" suffix needed)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — migration applied directly to the live DB via psql. No environment changes needed.

## Next Phase Readiness

- Plan 20-02 (TX state/federal headshots) is fully unblocked — profile pages now have chamber title line populated
- Profile pages for Abbott, Patrick, Paxton, Hegar, Buckingham, Miller, Cruz, Cornyn will render correctly once headshots are added
- No blockers

---
*Phase: 20-tx-state-federal-officials*
*Completed: 2026-05-04*
