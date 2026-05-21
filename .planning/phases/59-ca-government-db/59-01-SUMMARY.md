---
phase: 59-ca-government-db
plan: 01
subsystem: essentials-data
tags: [supabase, postgres, sql, migration, california, government, chambers]

# Dependency graph
requires: []
provides:
  - "State of California government row with geo_id='06' in essentials.governments"
  - "8 CA constitutional officer chambers in essentials.chambers with non-null slugs"
  - "Migration 189 applied to production — CA DB foundation scaffolded"
affects: [phase-59-plan-02, phase-59-plan-03, phase-62-lausd, phase-63-sf, phase-64-la, phase-65-sj, phase-66-sd, phase-67-sac, phase-68-others]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CA chamber naming: short names without 'California' prefix (Governor, not California Governor) — pre-existing convention in production; future plans must use short names in WHERE clauses"
    - "geo_id UPDATE pattern for idempotent correction: UPDATE ... SET geo_id='06' WHERE name='...' AND (geo_id IS NULL OR geo_id='')"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/189_ca_government_chambers.sql"
  modified: []

key-decisions:
  - "Migration numbered 189 (not 185 as planned) — migrations 185-188 were already occupied by Longview TX migrations"
  - "CA government row and 8 chambers pre-existed in production with different naming (short names without 'California' prefix); migration updated to fix geo_id=NULL and use WHERE NOT EXISTS with short names"
  - "CA chamber short names to use in future plans: Governor, Lieutenant Governor, Attorney General, Secretary of State, Controller, Treasurer, Commissioner of Insurance, Superintendent of Public Instruction"
  - "geo_id was NULL on pre-existing CA government row — fixed to '06' via UPDATE in migration"

patterns-established:
  - "CA gov_id subquery: SELECT id FROM essentials.governments WHERE name = 'State of California'"
  - "CA chamber reference: WHERE name = 'Governor' AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of California')"

# Metrics
duration: 9min
completed: 2026-05-21
---

# Phase 59 Plan 01: CA Government DB Foundation Summary

**State of California government row geo_id fixed to '06' and 8 pre-existing constitutional officer chambers verified — CA DB foundation ready for Phase 59-02 politicians/offices**

## Performance

- **Duration:** 9 min
- **Started:** 2026-05-21T17:53:20Z
- **Completed:** 2026-05-21T18:02:15Z
- **Tasks:** 2
- **Files modified:** 1 (migration file created)

## Accomplishments
- Migration 189 written and applied to production Supabase
- CA government row geo_id updated from NULL to '06' (was previously missing)
- All 8 CA constitutional officer chambers confirmed present with non-null slugs
- Migration verified idempotent — re-run produces 0 inserts, 0 updates

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 189** - committed with SUMMARY.md (docs commit)
2. **Task 2: Apply migration 189 and verify** - applied via psql; verified via SQL queries

**Plan metadata:** committed via final docs commit

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/189_ca_government_chambers.sql` - Migration 189: fixes CA geo_id + guards 8 executive chamber inserts

## Decisions Made

**Migration number 189 (not 185):** Migrations 185-188 were already occupied by Longview TX migrations (185_longview_tx_government.sql through 188_longview_tx_extended_stances.sql) created in a parallel work stream. Migration 185 could not be used. STATE.md noted "next migration is 185" but that was before the Longview TX work was added.

**CA government row pre-existed with NULL geo_id:** The production DB already had a "State of California" row (id=e0f33bda-bfb5-4dd0-9816-576e6ce35fac) but geo_id was NULL. The migration was updated to include an UPDATE statement: `UPDATE essentials.governments SET geo_id = '06' WHERE name = 'State of California' AND (geo_id IS NULL OR geo_id = '')`.

**CA chambers use short names (no "California" prefix):** All 8 chambers pre-existed in production under short names (e.g., "Governor" not "California Governor"). The migration was updated to use these short names in WHERE NOT EXISTS guards and INSERT statements. Future plans (59-02+) must reference chambers using the short name convention.

## Government Row Verification

```
        name         | type  | state | city | geo_id 
---------------------+-------+-------+------+--------
 State of California | STATE | CA    |      | 06
(1 row)
```

## Chamber Listing (8 rows, all slugs non-null)

```
                 name                 |                      slug                       |                   name_formal                   
--------------------------------------+-------------------------------------------------+-------------------------------------------------
 Attorney General                     | attorney-general-of-the-state-of-california     | Attorney General of the State of California
 Commissioner of Insurance            | california-commissioner-of-insurance            | California Commissioner of Insurance
 Controller                           | california-state-controller                     | California State Controller
 Governor                             | california-governor                             | California Governor
 Lieutenant Governor                  | california-lieutenant-governor                  | California Lieutenant Governor
 Secretary of State                   | california-secretary-of-state                   | California Secretary of State
 Superintendent of Public Instruction | california-superintendent-of-public-instruction | California Superintendent of Public Instruction
 Treasurer                            | california-state-treasurer                      | California State Treasurer
(8 rows)
```

## Idempotency Re-run Confirmation

Second run of migration 189 produced: `INSERT 0 0` (government, all 8 chambers), `UPDATE 0` (geo_id already '06'). Count query still returns 8.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CA government geo_id was NULL in production**
- **Found during:** Task 2 (Apply migration 185 and verify via SQL — pre-check)
- **Issue:** Production DB already had a "State of California" row but geo_id was NULL. The migration's WHERE NOT EXISTS guard for the INSERT would have fired (skipping insert), but geo_id would remain NULL without an explicit UPDATE.
- **Fix:** Added `UPDATE essentials.governments SET geo_id = '06' WHERE name = 'State of California' AND (geo_id IS NULL OR geo_id = '')` to the migration.
- **Files modified:** C:/EV-Accounts/backend/migrations/189_ca_government_chambers.sql
- **Verification:** Post-migration SELECT confirms geo_id='06'.
- **Committed in:** Task 1 migration file (migration file updated before commit)

**2. [Rule 1 - Bug] CA chambers pre-existed under short names, not "California {Role}" names**
- **Found during:** Task 2 (pre-check revealed 16 existing chambers under different naming convention)
- **Issue:** Plan specified chamber names like "California Governor" but production had "Governor", "Attorney General", etc. (short names without "California" prefix). Running the migration as written would have created 8 duplicate chambers with "California {Role}" names alongside the existing ones.
- **Fix:** Updated migration to use short names in INSERT/WHERE NOT EXISTS guards. All 8 chamber INSERTs became no-ops (correctly).
- **Files modified:** C:/EV-Accounts/backend/migrations/189_ca_government_chambers.sql
- **Verification:** Chamber count stays at 8 after migration; no duplicates.
- **Committed in:** Task 1 migration file (migration file updated before commit)

**3. [Rule 3 - Blocking] Migration number collision — 185-188 occupied by Longview TX**
- **Found during:** Task 1 (directory listing showed 185-188 already exist)
- **Issue:** Plan specified migration 185 but files 185-188 were already created for Longview TX (parallel work stream). Could not use 185.
- **Fix:** Used 189 as the next available migration number.
- **Files modified:** C:/EV-Accounts/backend/migrations/189_ca_government_chambers.sql (filename)
- **Committed in:** Task 1 migration file

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. Migration 189 is fully equivalent to planned migration 185 — same content, different number. CA DB foundation is complete and ready for 59-02.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- CA government row: `e0f33bda-bfb5-4dd0-9816-576e6ce35fac` (or use subquery by name)
- All 8 CA executive chambers present with correct slugs
- Phase 59-02 pre-condition met: "State of California" government row accessible via subquery
- **IMPORTANT for 59-02+**: Use short chamber names in WHERE clauses (e.g., `WHERE name = 'Governor'` not `WHERE name = 'California Governor'`)
- Next migration number: 190

---
*Phase: 59-ca-government-db*
*Completed: 2026-05-21*
