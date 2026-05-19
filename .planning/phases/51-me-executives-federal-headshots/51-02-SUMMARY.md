---
phase: 51-me-executives-federal-headshots
plan: 02
subsystem: essentials-data
tags: [postgres, migration, federal-officials, us-senate, us-house, maine, districts]

# Dependency graph
requires:
  - phase: phase-49-plan-01
    provides: ME NATIONAL_LOWER districts (geo_ids 2301, 2302) that house reps link to
provides:
  - ME NATIONAL_UPPER district (geo_id='23', state='ME', shared by Collins + King)
  - Susan M. Collins politician + Senator office (-230101, Republican)
  - Angus S. King, Jr. politician + Senator office (-230102, Independent)
  - Chellie Pingree politician + Representative office (-230201, Democrat, ME-01)
  - Jared Golden politician + Representative office (-230202, Democrat, ME-02)
  - office_id back-fill for all 4 federal officials
affects:
  - phase-51-plan-03-headshots
  - phase-52-me-state-legislature

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Senator office uniqueness key = (district_id, politician_id) not (district_id, chamber_id) — both senators share same NATIONAL_UPPER district"
    - "NATIONAL_UPPER district created in federal-officials migration (not executives migration) for states without a separate executives plan"
    - "Shared federal chambers (U.S. Senate 7cbe07bc, U.S. House c2facc31) referenced by hardcoded UUID — never duplicated per state"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql
  modified: []

key-decisions:
  - "Senator office uniqueness guard uses (district_id, politician_id) not (district_id, chamber_id) — prevents second senator being blocked"
  - "ME NATIONAL_UPPER district created in Plan 51-02 (not a separate executives migration like MA) — cleaner for a small 2-senator state"
  - "Collins=Republican, King=Independent, Pingree=Democrat, Golden=Democrat — party assigned at politician level per antipartisan display rule"
  - "is_appointed_position=false on all 4 offices — all are voter-elected (not legislature-appointed like ME AG/SoS/Treasurer)"
  - "election_races table does not exist in this schema version — structural-only migration confirmed correct"

patterns-established:
  - "Pattern: federal-officials migration for state = NATIONAL_UPPER creation + senators (CTE pattern) + house reps (CTE pattern) + office_id back-fill in one transaction"

# Metrics
duration: 4min
completed: 2026-05-19
---

# Phase 51 Plan 02: ME Federal Officials Summary

**Migration 170 seeds Collins (R), King (I), Pingree (D ME-01), and Golden (D ME-02) with offices wired to shared U.S. Senate/House chambers and correct ME districts, completing the federal layer for any Maine address**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-19T07:06:02Z
- **Completed:** 2026-05-19T07:10:05Z
- **Tasks:** 2
- **Files modified:** 1 (migration file created)

## Accomplishments
- Created migration 170 with ME NATIONAL_UPPER district + 4 federal politician+office CTE blocks + office_id back-fill
- Applied migration to live production DB — first run: INSERT 0 1 x5, UPDATE 4
- Confirmed idempotency — re-run: INSERT 0 0 x5, UPDATE 0
- Verified all 4 officials fully wired (correct chambers, districts, parties, is_appointed_position=false)
- Portland smoke test (ME-01/Pingree) and Bangor smoke test (ME-02/Golden) both pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 170** - `51c27d9` (feat)
2. **Task 2: Apply migration 170 + verify** - (DB operation only — no file commit for task 2)

**Plan metadata:** (docs commit follows)

## Migration Results

### First Run (applied to live DB)
```
BEGIN
INSERT 0 1    -- NATIONAL_UPPER district
INSERT 0 1    -- Collins politician + office
INSERT 0 1    -- King politician + office
INSERT 0 1    -- Pingree politician + office
INSERT 0 1    -- Golden politician + office
UPDATE 4      -- office_id back-fill
COMMIT
```

### Re-run (idempotency confirmed)
```
BEGIN
INSERT 0 0    -- district already exists
INSERT 0 0    -- Collins conflict DO NOTHING
INSERT 0 0    -- King conflict DO NOTHING
INSERT 0 0    -- Pingree conflict DO NOTHING
INSERT 0 0    -- Golden conflict DO NOTHING
UPDATE 0      -- office_id already set
COMMIT
```

## Verification Query Results

### Query 1 — ME NATIONAL_UPPER district
```
 district_type  | state | geo_id | label | district_id
----------------+-------+--------+-------+-------------
 NATIONAL_UPPER | ME    | 23     | Maine | Maine
(1 row)
```

### Query 2 — 2 senators wired to ME NATIONAL_UPPER + U.S. Senate chamber
```
     full_name      | external_id |    party    |  title  | is_appointed_position | representing_state |              chamber_id              | district_type  | state
--------------------+-------------+-------------+---------+-----------------------+--------------------+--------------------------------------+----------------+-------
 Angus S. King, Jr. |     -230102 | Independent | Senator | f                     | ME                 | 7cbe07bc-84b8-433b-952b-540e7de18a92 | NATIONAL_UPPER | ME
 Susan M. Collins   |     -230101 | Republican  | Senator | f                     | ME                 | 7cbe07bc-84b8-433b-952b-540e7de18a92 | NATIONAL_UPPER | ME
(2 rows)
```

### Query 3 — 2 house reps wired to correct NATIONAL_LOWER districts + U.S. House chamber
```
    full_name    | external_id |  party   |     title      |              chamber_id              | geo_id | district_type  | state
-----------------+-------------+----------+----------------+--------------------------------------+--------+----------------+-------
 Jared Golden    |     -230202 | Democrat | Representative | c2facc31-7b13-428c-b7b9-32d0d3b95f76 | 2302   | NATIONAL_LOWER | ME
 Chellie Pingree |     -230201 | Democrat | Representative | c2facc31-7b13-428c-b7b9-32d0d3b95f76 | 2301   | NATIONAL_LOWER | ME
(2 rows)
```

### Query 4 — office_id back-fill (all 4 politicians)
```
 external_id |     full_name      | has_office_id
-------------+--------------------+---------------
     -230202 | Jared Golden       | t
     -230201 | Chellie Pingree    | t
     -230102 | Angus S. King, Jr. | t
     -230101 | Susan M. Collins   | t
(4 rows)
```

### Query 5 — U.S.* chamber count (unchanged)
```
 count
-------
     9
(1 row)
```
Note: 9 total chambers matching U.S.* pattern in DB (includes Indiana-specific chambers and U.S. Supreme Court from prior phases). The 2 shared federal chambers used by ME officials (7cbe07bc, c2facc31) are unchanged — no new chambers created.

### Query 6 — State of Maine chamber count (Phase 50 preserved)
```
 count
-------
     6
(1 row)
```

### Query 7 — election_races for ME federal officials
Table `essentials.election_races` does not exist in this schema version — structural-only migration confirmed correct. Zero election races created.

### Query 8 — Portland/ME-01 smoke test (Pingree)
```
    full_name    |     title      | geo_id | district_type
-----------------+----------------+--------+----------------
 Chellie Pingree | Representative | 2301   | NATIONAL_LOWER
(1 row)
```

### Query 9 — Bangor/ME-02 smoke test (Golden)
```
  full_name   |     title      | geo_id | district_type
--------------+----------------+--------+----------------
 Jared Golden | Representative | 2302   | NATIONAL_LOWER
(1 row)
```

### Query 10 (idempotency) — see Re-run results above

### Final Verification — all 4 officials fully wired
```
     full_name      | external_id |    party    |     title      | representing_state | is_appointed_position |            chamber            | district_type  | geo_id | district_state
--------------------+-------------+-------------+----------------+--------------------+-----------------------+-------------------------------+----------------+--------+----------------
 Jared Golden       |     -230202 | Democrat    | Representative | ME                 | f                     | U.S. House of Representatives | NATIONAL_LOWER | 2302   | ME
 Chellie Pingree    |     -230201 | Democrat    | Representative | ME                 | f                     | U.S. House of Representatives | NATIONAL_LOWER | 2301   | ME
 Angus S. King, Jr. |     -230102 | Independent | Senator        | ME                 | f                     | U.S. Senate                   | NATIONAL_UPPER | 23     | ME
 Susan M. Collins   |     -230101 | Republican  | Senator        | ME                 | f                     | U.S. Senate                   | NATIONAL_UPPER | 23     | ME
(4 rows)
```

## Politician + Office UUIDs (for Plan 51-03 Headshots)

| full_name           | external_id | politician_id                        | office_id                            |
|---------------------|-------------|--------------------------------------|--------------------------------------|
| Susan M. Collins    | -230101     | 6b817122-f196-4b72-b0b4-2d9763c4be47 | 50b86543-956e-40a1-9e17-7fb9a6f7561d |
| Angus S. King, Jr.  | -230102     | 4f4b2bff-0054-475f-8687-e83f68085f15 | 9b5801b9-654d-4135-bb85-e5b270679035 |
| Chellie Pingree     | -230201     | 1638b2c9-4811-466d-bb24-44c6cece8cda | cba542ab-7376-4643-816c-6dbe05db3e82 |
| Jared Golden        | -230202     | c420f946-332c-46ed-be88-4cd11aa47543 | 35cd49e7-ebad-4b75-a817-bb420bcba28c |

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql` - ME NATIONAL_UPPER district + 2 senators (Collins R, King I) + 2 house reps (Pingree D ME-01, Golden D ME-02) + office_id back-fill

## Decisions Made
- Senator office uniqueness guard uses (district_id, politician_id) not (district_id, chamber_id) — two senators share the same NATIONAL_UPPER district so chamber_id-based uniqueness would block the second senator
- ME NATIONAL_UPPER district created in this federal-officials migration (not a prior executives migration) — appropriate for Maine which has no separate executives plan hosting it
- is_appointed_position=false on all 4 offices — federal officials are voter-elected, unlike ME AG/SoS/Treasurer which are legislature-appointed
- election_races table confirmed absent from schema — structural-only migration is correct

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
- Query 5 count pattern returned 9 (not 2) because the LIKE '%U.S.%' pattern also matches Indiana-specific chambers and the U.S. Supreme Court created in prior phases. The 2 shared federal chambers used here are unchanged — no new chambers were created. This is expected behavior, not a defect.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Plan 51-03 (federal headshots) is unblocked — all 4 politician_id/office_id UUIDs documented above
- Any Maine address now returns Collins + King via NATIONAL_UPPER district resolution
- Portland addresses return Pingree (ME-01, geo_id=2301); Bangor/rural ME returns Golden (ME-02, geo_id=2302)
- Phase 52 (ME State Legislature) can proceed in parallel — no dependency on this plan

---
*Phase: 51-me-executives-federal-headshots*
*Completed: 2026-05-19*
