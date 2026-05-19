---
phase: 51-me-executives-federal-headshots
plan: 01
subsystem: essentials-data
tags: [postgres, migration, maine, state-executives, districts, politicians, offices]

# Dependency graph
requires:
  - phase: phase-50-plan-01
    provides: State of Maine government row + 6 executive chambers (migration 168)
provides:
  - 4 ME STATE_EXEC districts (Governor, AG, SoS, Treasurer)
  - 4 ME executive politicians (Mills, Frey, Bellows, Perry) with correct is_appointed flags
  - 4 ME offices linked to Phase 50 chambers with correct is_appointed_position flags
  - office_id back-filled on all 4 politicians
  - Fully idempotent migration 169
affects: [phase-51-plan-03-headshots, phase-52-me-legislature]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "STATE_EXEC district pattern for ME: state='ME' uppercase, geo_id='23', label='Maine {Role}'"
    - "Legislature-elected offices modeled as is_appointed_position=true (AG/SoS/Treasurer in ME)"
    - "ME executive external_id range: -230001 (Mills) through -230004 (Perry)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/169_me_state_executives.sql
  modified: []

key-decisions:
  - "Maine AG/SoS/Treasurer are legislature-elected (Joint Convention), NOT voter-elected — is_appointed_position=true, no races rows ever"
  - "Treasurer = Joseph C. Perry (NOT Henry Beck who left office 2025-01-06, elected by Legislature Dec 2024)"
  - "Governor Mills is_appointed=false, is_appointed_position=false (elected by voters statewide)"
  - "role_canonical=NULL for all 4 ME executives (cross-state mapping deferred to later phase)"
  - "election_races table is actually essentials.races (not essentials.election_races) — verified Q5 with corrected name"

patterns-established:
  - "ME executive external_ids: -230001 (Mills/Governor), -230002 (Frey/AG), -230003 (Bellows/SoS), -230004 (Perry/Treasurer)"
  - "ME STATE_EXEC districts use geo_id='23' (state FIPS), district_id='', mtfcc=''"
  - "Chamber lookup guard: WHERE name='Maine {Role}' AND government_id=(SELECT id FROM essentials.governments WHERE name='State of Maine')"

# Metrics
duration: 5min
completed: 2026-05-19
---

# Phase 51 Plan 01: ME State Executives Summary

**4 ME STATE_EXEC districts + 4 executive politicians/offices seeded via idempotent migration 169; AG/SoS/Treasurer correctly modeled as legislature-elected (is_appointed_position=true), Treasurer = Joseph C. Perry**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-19T07:04:31Z
- **Completed:** 2026-05-19T07:08:53Z
- **Tasks:** 2 of 2
- **Files modified:** 1 (migration SQL created)

## Accomplishments

- Migration 169 written and applied to live production DB
- 4 STATE_EXEC districts created (state='ME' uppercase, geo_id='23')
- 4 ME executive politicians seeded: Mills (-230001), Frey (-230002), Bellows (-230003), Perry (-230004)
- 4 offices created with correct is_appointed_position flags (false for Governor, true for AG/SoS/Treasurer)
- office_id back-filled on all 4 politicians — profile pages can now render title + chamber
- Migration confirmed fully idempotent (second run: INSERT 0 0 x8, UPDATE 0)
- Zero new chambers created (Phase 50 chambers untouched — count still 6)
- Zero races rows created for these officials

## Task Commits

1. **Task 1: Write migration 169** - `d9394b6` (feat)
2. **Task 2: Apply migration 169** - (DB operation, no file commit)

**Plan metadata:** see docs commit below

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/169_me_state_executives.sql` - Full idempotent migration for ME state executives

## Migration Execution Output

### First Run (live DB)
```
BEGIN
INSERT 0 1   -- Maine Governor district
INSERT 0 1   -- Maine Attorney General district
INSERT 0 1   -- Maine Secretary of State district
INSERT 0 1   -- Maine Treasurer district
INSERT 0 1   -- Janet T. Mills (politician + office)
INSERT 0 1   -- Aaron M. Frey (politician + office)
INSERT 0 1   -- Shenna Bellows (politician + office)
INSERT 0 1   -- Joseph C. Perry (politician + office)
UPDATE 4     -- office_id back-fill
COMMIT
```

### Re-run (idempotency check)
```
BEGIN
INSERT 0 0 x8
UPDATE 0
COMMIT
```

## Verification Query Outputs

### Query 1: ME STATE_EXEC Districts
```
          label           | state | geo_id
--------------------------+-------+--------
 Maine Attorney General   | ME    | 23
 Maine Governor           | ME    | 23
 Maine Secretary of State | ME    | 23
 Maine Treasurer          | ME    | 23
(4 rows)
```

### Query 2: Politicians + Offices with Flags
```
 external_id |    full_name    |  party   | is_appointed | has_office_id |       title        | is_appointed_position | role_canonical |         chamber          | district_type | district_state
-------------+-----------------+----------+--------------+---------------+--------------------+-----------------------+----------------+--------------------------+---------------+----------------
     -230004 | Joseph C. Perry | Democrat | t            | t             | Treasurer          | t                     |                | Maine Treasurer          | STATE_EXEC    | ME
     -230003 | Shenna Bellows  | Democrat | t            | t             | Secretary of State | t                     |                | Maine Secretary of State | STATE_EXEC    | ME
     -230002 | Aaron M. Frey   | Democrat | t            | t             | Attorney General   | t                     |                | Maine Attorney General   | STATE_EXEC    | ME
     -230001 | Janet T. Mills  | Democrat | f            | t             | Governor           | f                     |                | Maine Governor           | STATE_EXEC    | ME
(4 rows)
```

### Query 3: Treasurer Name Confirmation
```
    full_name
-----------------
 Joseph C. Perry
(1 row)
```
Confirmed: NOT Henry Beck.

### Query 4: Chamber Count Unchanged
```
 count
-------
     6
(1 row)
```
All 6 Phase 50 chambers untouched.

### Query 5: No Races Rows
```
 count
-------
     0
(1 row)
```
Note: table is `essentials.races` (not `essentials.election_races`).

### Query 6: Statehouse Smoke Test
```
    full_name    |       title        |         chamber
-----------------+--------------------+--------------------------
 Aaron M. Frey   | Attorney General   | Maine Attorney General
 Janet T. Mills  | Governor           | Maine Governor
 Joseph C. Perry | Treasurer          | Maine Treasurer
 Shenna Bellows  | Secretary of State | Maine Secretary of State
(4 rows)
```
All 4 ME executives returned via STATE_EXEC district query.

## Politician/Office UUIDs (for Plan 51-03 headshots)

| full_name       | external_id | politician_id                        | office_id                            |
|-----------------|-------------|--------------------------------------|--------------------------------------|
| Janet T. Mills  | -230001     | baffe39e-4bf9-4956-9d59-92fe8d473fd8 | 95700fc5-2800-4766-9005-38dc7237c455 |
| Aaron M. Frey   | -230002     | ab5f50b9-ba9d-4a6a-9f3e-1ff966395fe0 | 9c73cf3a-4186-404b-9f34-eae9c0b32308 |
| Shenna Bellows  | -230003     | 053b2bdf-2845-4cee-ac3a-5264059d3eaa | 9b1bbcb3-b9b3-4b35-8d2b-2799f3eed24c |
| Joseph C. Perry | -230004     | 07dea81a-1a26-4428-b871-8de115e050f0 | 5fee6118-e00b-477e-b692-37080de96f66 |

## Decisions Made

- Maine AG/SoS/Treasurer are legislature-elected via Joint Convention every 2 years — modeled as is_appointed_position=true with no races rows, so they never appear as voter elections.
- Treasurer is Joseph C. Perry (Democrat, elected by ME Legislature December 2024). Henry Beck left office 2025-01-06.
- Governor Mills is_appointed_position=false (voters elect Governor statewide). Mills is term-limited; no re-election race is in scope for this migration.
- role_canonical=NULL for all 4 executives — cross-state role mapping is deferred.
- election_races is actually `essentials.races` — key schema correction for future plan queries.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Query 5 used table name `essentials.election_races` which does not exist — actual table is `essentials.races`. Corrected inline. Zero races rows confirmed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 51-03 (ME executive headshots) is unblocked — all 4 politician UUIDs are documented above
- Plan 51-02 (ME federal officials) can proceed independently
- ME address lookups will now return Governor Mills, AG Frey, SoS Bellows, and Treasurer Perry for any Maine address

---
*Phase: 51-me-executives-federal-headshots*
*Completed: 2026-05-19*
