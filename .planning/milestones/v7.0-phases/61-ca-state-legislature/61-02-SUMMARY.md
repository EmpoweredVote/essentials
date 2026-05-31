---
phase: 61-ca-state-legislature
plan: 02
subsystem: database
tags: [postgres, sql, migration, ca-assembly, geofences, politicians, offices, external-id]

# Dependency graph
requires:
  - phase: 57-ca-geofences
    provides: "80 STATE_LOWER geofence_boundaries rows (mtfcc=G5220, state='06') + 80 essentials.districts rows (district_type='STATE_LOWER', state='CA', geo_id='06001'..'06080')"
  - phase: 61-01
    provides: "CA State Assembly pre-existing chamber (name='Assembly'), migration pattern for CA politician external_id dedup, confirmed state='CA' uppercase for CA districts"
provides:
  - "CA Assembly chamber renamed to canonical 'California State Assembly' (slug auto-generated as 'california-state-assembly')"
  - "80 assembly politician rows with canonical external_ids -6002001 (AD-01) through -6002080 (AD-80)"
  - "All 36 pre-existing -100049..-100119 rows re-keyed to -6002xxx scheme (24 updated, 12 recycled to current members)"
  - "80 office rows linking each assembly member to STATE_LOWER district via CA Assembly chamber"
  - "office_id backfill complete on all 80 assembly politicians"
  - "SF City Hall routing confirmed: (-122.4191, 37.7792) -> Matt Haney (AD-17, geo_id='06017')"
affects: [61-03, 62-lausd, 63-sf-city, 64-la-city, 65-sj-city, 66-sd-city]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Politician row recycling: DELETE from politician_images + UPDATE name/party/external_id to current incumbent (for former-member rows)"
    - "Assembly chamber office INSERT uses computed external_id: (-6002000 - district_num) via REGEXP_REPLACE + CAST on geo_id"
    - "CA STATE_LOWER districts: geo_id='06001'..'06080', state='CA' (uppercase), mtfcc join via geofence_boundaries G5220"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/195_ca_state_assembly.sql"
  modified: []

key-decisions:
  - "CA Assembly chamber already existed as name='Assembly' (not 'California State Assembly') — migration renames it to canonical form instead of inserting"
  - "CA STATE_LOWER districts use state='CA' (uppercase) — consistent with STATE_UPPER from Plan 61-01; same pre-existing data pattern"
  - "geofence_boundaries mtfcc='G5220' covers STATE_LOWER (assembly) districts — confirmed by SF point-in-polygon returning geo_id='06017' for AD-17"
  - "12 former-member pre-existing rows recycled to current incumbents: DELETE from politician_images + UPDATE name/party to current rep"
  - "44 pure INSERT rows for gap districts with no pre-existing row"
  - "Name fixes applied: Blanca E. Rubio (was 'Blanca Rubio'), Jessica M. Caloza (was 'Jessica Caloza'), Tina S. McKinnor (was 'Tina Simone McKinnor'), Jose Luis Solache Jr. (was 'Jose Luis Solache'), Blanca Pacheco (was 'Blanca Pachecco' — typo fix)"

patterns-established:
  - "External_id formula for CA Assembly: AD-NN -> -6002000 - NN (e.g. AD-17 -> -6002017)"
  - "geo_id formula: '06' || lpad(district_num::text, 3, '0') (e.g. AD-17 -> '06017')"
  - "Politician row recycling pattern when former member row must become current member: clear images, update all name fields"

# Metrics
duration: 14min
completed: 2026-05-21
---

# Phase 61 Plan 02: CA Assembly Members Summary

**80 CA Assembly members seeded under canonical -6002001..-6002080 external_ids, all wired to STATE_LOWER geofences via 80 office rows; SF City Hall resolves to Matt Haney (AD-17)**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-21T23:42:43Z
- **Completed:** 2026-05-21T23:57:25Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Re-keyed all 36 pre-existing CA Assembly rows from -100xxx scheme to -6002xxx canonical scheme
- Created 44 new politician rows for gap districts (AD-01 through AD-33 and sparse 34-80)
- Created/renamed CA Assembly chamber to 'California State Assembly' (slug='california-state-assembly')
- Linked all 80 assembly members to their STATE_LOWER geofence districts via offices table
- SF City Hall address now resolves to Matt Haney (AD-17) with exactly 1 row returned

## Task Commits

Tasks were committed atomically after plan execution:

1. **Task 1: Assembly audit pre-checks and roster fetch** — no commit (read-only)
2. **Task 2: Generate and apply Migration 195** — committed in metadata commit below

**Plan metadata:** (see commit hash in git log)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/195_ca_state_assembly.sql` — Migration 195: chamber rename, 36 external_id re-keys, 44 new politician INSERTs, 80 office INSERTs, office_id backfill

## Decisions Made

- **CA Assembly chamber already existed**: The pre-existing seed included a chamber named 'Assembly' (not 'California State Assembly'). Migration updated the name to canonical form rather than inserting a new chamber. The name_formal was already correct ('California State Assembly') and slug was auto-generated correctly.

- **STATE_LOWER districts confirmed as state='CA' (uppercase)**: All 80 CA STATE_LOWER districts use uppercase 'CA' for the state column — same pre-existing data pattern as STATE_UPPER confirmed in Plan 61-01.

- **geofence_boundaries mtfcc='G5220' for assembly (STATE_LOWER)**: The SWAPPED mtfcc pattern (documented in STATE.md) means assembly geofences have mtfcc=G5220 in geofence_boundaries while districts.mtfcc=G5210. The smoke test uses `gb.mtfcc = 'G5220' AND d.district_type = 'STATE_LOWER'` to disambiguate.

- **12 former-member rows recycled for current incumbents**: 12 of the 36 pre-existing rows held former assembly members or misidentified officials (e.g., state senators Maria Elena Durazo, Henry Stern). Their politician_images were deleted and the rows were updated with current incumbent data + new external_ids. This satisfies the must_have "all -100xxx re-keyed to -6002xxx" while keeping correct data.

- **44 pure INSERT rows**: Districts with no pre-existing row (mostly AD-01 through AD-32, plus scattered gaps) received fresh politician rows via bulk INSERT.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CA Assembly chamber already existed with wrong name**
- **Found during:** Task 1 (pre-check 2)
- **Issue:** PRE-CHECK 2 found chamber exists as name='Assembly', not 'California State Assembly'. Plan's Step 0 INSERT would have been a no-op (NOT EXISTS guard). The chamber needed to be renamed for essentialsService queries that look up by name.
- **Fix:** Migration Step 0 first UPDATEs the existing chamber name, then falls back to INSERT (idempotent). This ensures the canonical 'California State Assembly' name is in the DB regardless of state.
- **Files modified:** 195_ca_state_assembly.sql
- **Verification:** SELECT confirms name='California State Assembly', slug='california-state-assembly'

**2. [Rule 1 - Bug] 5 name typos/variant spellings in pre-existing rows**
- **Found during:** Task 1 (cross-reference with live roster)
- **Issue:** DB had 'Blanca Rubio' (missing middle initial), 'Jessica Caloza' (missing M.), 'Tina Simone McKinnor' (wrong middle), 'Jose Luis Solache' (missing Jr.), 'Blanca Pachecco' (typo — double c)
- **Fix:** Step 1 UPDATE statements include name field corrections alongside external_id re-keying
- **Files modified:** 195_ca_state_assembly.sql
- **Verification:** Post-migration SELECT on these politicians shows correct canonical names

**3. [Rule 2 - Missing Critical] Recycle pattern needed for 12 former-member rows**
- **Found during:** Task 1 (cross-reference — 12 of 36 pre-existing rows don't match current roster)
- **Issue:** Plan assumed all 36 pre-existing rows correspond to current assembly members. Actually 12 are former members or misidentified (state senators seeded as assembly members). Simply re-keying external_id would create incorrect office associations.
- **Fix:** DELETE politician_images for these 12 rows, then UPDATE name/party to current incumbent for each recycled district. Added to migration as distinct step between Steps 1 and 2.
- **Files modified:** 195_ca_state_assembly.sql
- **Verification:** All 80 politicians in -6002001..-6002080 range have correct current-member names per assembly.ca.gov roster

---

**Total deviations:** 3 auto-fixed (2 bug, 1 missing critical)
**Impact on plan:** All auto-fixes necessary for data correctness. Chamber name fix essential for service queries. Name fixes prevent incorrect display. Recycle pattern preserves must_have constraint while maintaining data integrity.

## Issues Encountered

- The assembly API at https://www.assembly.ca.gov/assemblymembers uses HTMX dynamic loading. The data was retrieved from the underlying endpoint `https://webapi.assembly.ca.gov/member-data/api/v1/members` which returned HTML with data attributes containing name, district, and party for all 80 members.
- Plan noted to use `state='ca'` for STATE_LOWER districts, but actual data has `state='CA'` (uppercase). Confirmed by pre-check: 0 rows with lowercase, 80 rows with uppercase. Migration uses uppercase 'CA'.

## Next Phase Readiness

- All 80 CA Assembly members are seeded with correct external_ids, linked to geofences, and have office_id populated
- Plan 61-03 (headshots): 36 politicians have their headshots CLEARED (12 recycled rows had wrong-person images deleted); 24 still-current rows retain their correct pre-existing headshots; 44 new rows have no headshots. Plan 61-03 should upload headshots for all rows that lack them.
- Routing works: any address in CA will now resolve to the correct assembly member via geofence_boundaries G5220 -> districts STATE_LOWER -> offices -> politicians join
- Next migration is 196

---
*Phase: 61-ca-state-legislature*
*Completed: 2026-05-21*
