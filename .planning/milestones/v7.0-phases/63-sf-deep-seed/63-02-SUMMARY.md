---
phase: 63-sf-deep-seed
plan: "02"
subsystem: database
tags: [postgres, supabase, san-francisco, politicians, offices, geofencing, migration]

# Dependency graph
requires:
  - phase: 63-01
    provides: SF government row, 10 chambers, 11 supervisor district rows + 1 LOCAL_EXEC district (geo_id=0667000), X0006 geofence boundaries
provides:
  - 20 SF politicians seeded (external_ids -630001..-630011 and -630020..-630028)
  - 20 office rows: 11 linked to supervisor districts, 9 linked to SF-wide LOCAL_EXEC district
  - is_appointed_position=true on Controller (Wagner) + City Administrator (Chu) offices only
  - Migration 199_sf_officials.sql written, applied as DB version 206
  - All 7 verification queries pass including section-split=0 and end-to-end routing
affects:
  - 63-03 (SF headshots — 20 politicians ready for photos)
  - Any phase that queries SF government for local representatives

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WITH ins_p AS CTE pattern: INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id, then INSERT offices from CROSS JOIN ins_p — ensures idempotent politician+office seed in one atomic block"
    - "Supervisor geo_id join: use geo_id='sf-supervisor-district-N' with district_type='LOCAL' for district FK resolution"
    - "Citywide geo_id join: use geo_id='0667000' with district_type IN ('LOCAL','LOCAL_EXEC') for SF-wide offices"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/199_sf_officials.sql
  modified: []

key-decisions:
  - "Board President is a role on Mandelman, NOT a separate office row — he has exactly 1 office (District 8 Supervisor)"
  - "Controller (Wagner) and City Administrator (Chu) use is_appointed_position=true; all 18 other offices use false"
  - "district_type='LOCAL' for sf-supervisor-district-N lookups; district_type IN ('LOCAL','LOCAL_EXEC') for geo_id=0667000 lookups"
  - "Migration file named 199_sf_officials.sql per plan spec; applied as DB ledger version 206 (next after 205)"
  - "SF City Hall (-122.4194, 37.7793) routes to District 5 (Bilal Mahmood) — confirmed consistent with 63-01 smoke test"

patterns-established:
  - "SF supervisor external_id range: -630001 (D1) to -630011 (D11)"
  - "SF citywide external_id range: -630020 (Mayor) to -630026 (Public Defender)"
  - "SF appointed external_id range: -630027 (Controller) to -630028 (City Administrator)"
  - "Next available SF external_id: -630029 onward"

# Metrics
duration: 5min
completed: 2026-05-22
---

# Phase 63 Plan 02: SF Officials Seed Summary

**20 SF officials seeded via WITH ins_p CTE pattern: 11 Board of Supervisors (district-linked) + 7 citywide elected + 2 appointed (Wagner/Chu) — migration 199 written, applied as DB version 206, all 7 verification queries pass**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-22T06:18:35Z
- **Completed:** 2026-05-22T06:24:00Z
- **Tasks:** 2/2
- **Files modified:** 1 created (199_sf_officials.sql)

## Accomplishments
- 20 SF politicians seeded with external_ids in -630001..-630028 range, all is_active=true, is_incumbent=true, party=NULL
- 20 office rows created: 11 linked to sf-supervisor-district-1..11, 9 linked to geo_id='0667000' (LOCAL_EXEC)
- Only Wagner (Controller) + Chu (City Administrator) have is_appointed_position=true — all 18 others false
- Mandelman has exactly 1 office (District 8 Supervisor) — Board President title not represented as separate office
- Section-split detector returns 0 rows (clean)
- End-to-end routing confirmed: SF City Hall (-122.4194, 37.7793) → sf-supervisor-district-5 → Bilal Mahmood

## Task Commits

Each task was committed atomically:

1. **Task 1: Pre-flight checks + write migration 199_sf_officials.sql** - (feat) — migration file written, 4/4 pre-flight checks passed
2. **Task 2: Apply migration 199 + run all 7 verification queries** - (feat) — applied to DB as version 206, all 7 queries pass

**Plan metadata:** (docs: complete 63-02 plan)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/199_sf_officials.sql` - 20 WITH ins_p CTE blocks seeding all SF officials; applied as DB version 206

## Verification Query Outputs

### Query 1: Politicians (20 rows, all active+incumbent)
```
external_id | full_name       | is_active | is_incumbent
-630028     | Carmen Chu      | true      | true
-630027     | Greg Wagner     | true      | true
-630026     | Manohar Raju    | true      | true
-630025     | José Cisneros   | true      | true
-630024     | Joaquín Torres  | true      | true
-630023     | Paul Miyamoto   | true      | true
-630022     | Brooke Jenkins  | true      | true
-630021     | David Chiu      | true      | true
-630020     | Daniel Lurie    | true      | true
-630011     | Chyanne Chen    | true      | true
-630010     | Shamann Walton  | true      | true
-630009     | Jackie Fielder  | true      | true
-630008     | Rafael Mandelman| true      | true
-630007     | Myrna Melgar    | true      | true
-630006     | Matt Dorsey     | true      | true
-630005     | Bilal Mahmood   | true      | true
-630004     | Alan Wong       | true      | true
-630003     | Danny Sauter    | true      | true
-630002     | Stephen Sherrill| true      | true
-630001     | Connie Chan     | true      | true
```
PASS: 20 rows, all is_active=true, is_incumbent=true

### Query 2: Chamber Distribution (10 chambers)
```
Assessor-Recorder   : 1
Board of Supervisors: 11
City Administrator  : 1
City Attorney       : 1
Controller          : 1
District Attorney   : 1
Mayor               : 1
Public Defender     : 1
Sheriff             : 1
Treasurer           : 1
```
PASS: 10 chambers, Board of Supervisors=11, all others=1

### Query 3: Appointed Positions
```
Carmen Chu        | City Administrator | is_appointed_position: true
Greg Wagner       | Controller         | is_appointed_position: true
[18 others]                            | is_appointed_position: false
```
PASS: 2 with is_appointed_position=true (Wagner, Chu), 18 false

### Query 4: Mandelman — exactly 1 office
```
Rafael Mandelman | Supervisor | sf-supervisor-district-8
```
PASS: 1 row, District 8 Supervisor only, no Board President office

### Query 5: All 11 Supervisor Districts
```
sf-supervisor-district-1  | Connie Chan       | Supervisor
sf-supervisor-district-2  | Stephen Sherrill  | Supervisor
sf-supervisor-district-3  | Danny Sauter      | Supervisor
sf-supervisor-district-4  | Alan Wong         | Supervisor
sf-supervisor-district-5  | Bilal Mahmood     | Supervisor
sf-supervisor-district-6  | Matt Dorsey       | Supervisor
sf-supervisor-district-7  | Myrna Melgar      | Supervisor
sf-supervisor-district-8  | Rafael Mandelman  | Supervisor
sf-supervisor-district-9  | Jackie Fielder    | Supervisor
sf-supervisor-district-10 | Shamann Walton    | Supervisor
sf-supervisor-district-11 | Chyanne Chen      | Supervisor
```
PASS: 11 rows, districts 1-11 each with correct incumbent

### Query 6: Section-Split Detector
```
0 rows
```
PASS: Zero rows — no section-split bugs

### Query 7: End-to-End Routing (SF City Hall)
```
Bilal Mahmood | sf-supervisor-district-5 | Supervisor
```
PASS: 1 row — SF City Hall routes to District 5 (Bilal Mahmood), consistent with 63-01 smoke test

## Full SF Officials Roster

### Board of Supervisors (11)
| District | Supervisor          | external_id |
|----------|---------------------|-------------|
| D1       | Connie Chan         | -630001     |
| D2       | Stephen Sherrill    | -630002     |
| D3       | Danny Sauter        | -630003     |
| D4       | Alan Wong           | -630004     |
| D5       | Bilal Mahmood       | -630005     |
| D6       | Matt Dorsey         | -630006     |
| D7       | Myrna Melgar        | -630007     |
| D8       | Rafael Mandelman    | -630008     |
| D9       | Jackie Fielder      | -630009     |
| D10      | Shamann Walton      | -630010     |
| D11      | Chyanne Chen        | -630011     |

### Citywide Elected (7)
| Office           | Official          | external_id |
|------------------|-------------------|-------------|
| Mayor            | Daniel Lurie      | -630020     |
| City Attorney    | David Chiu        | -630021     |
| District Attorney| Brooke Jenkins    | -630022     |
| Sheriff          | Paul Miyamoto     | -630023     |
| Assessor-Recorder| Joaquín Torres    | -630024     |
| Treasurer        | José Cisneros     | -630025     |
| Public Defender  | Manohar Raju      | -630026     |

### Appointed (2)
| Office             | Official    | external_id | is_appointed_position |
|--------------------|-------------|-------------|-----------------------|
| Controller         | Greg Wagner | -630027     | true                  |
| City Administrator | Carmen Chu  | -630028     | true                  |

## Decisions Made
- Board President is a role Mandelman holds on the existing Board, not a separate office. He has exactly 1 office row.
- Controller and City Administrator are appointed by the Mayor (SF Charter) — is_appointed_position=true, is_appointed=false on politician row (correct pattern per ME precedent)
- Migration file named per plan spec (199_sf_officials.sql) but applied to DB as ledger version 206 (next sequential after 205)

## Deviations from Plan

None - plan executed exactly as written. All 4 pre-flight checks passed before writing migration. All 7 verification queries returned expected results on first run.

## Issues Encountered
None

## Next Phase Readiness
- 20 SF politicians ready for headshots in Phase 63-03
- External_ids for headshot URL construction: -630001..-630011 (supervisors) + -630020..-630028 (citywide+appointed)
- Next available SF external_id: -630029 onward
- Migration numbering: next is 207

---
*Phase: 63-sf-deep-seed*
*Completed: 2026-05-22*
