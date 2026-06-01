---
phase: 68-berkeley-deep-seed
plan: "02"
subsystem: essentials-data
tags: [postgresql, supabase, berkeley, politicians, offices, migration, rcv]

# Dependency graph
requires:
  - phase: 68-01
    provides: Berkeley govt scaffolding — 1 government, 3 chambers (Mayor/City Council/City Auditor), 8 LOCAL council districts, 1 LOCAL_EXEC district (geo_id=0606000), 8 X0009 geofence boundaries
provides:
  - 10 essentials.politicians rows (-680001 Mayor Ishii, -680002 Auditor Wong, -680010..-680017 council D1-D8)
  - 10 essentials.offices rows (8 council + 1 Mayor + 1 City Auditor)
  - politicians.office_id back-filled for all 10
  - End-to-end routing: Berkeley address → geofence → district → office → politician
affects:
  - 68-03 (headshot uploads — needs politician.id values captured here)
  - phase-69 (Berkeley RCV election_method TODO on all 3 chambers)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WITH ins_p CTE + CROSS JOIN + NOT EXISTS idempotency pattern for politician+office seeding"
    - "Both citywide offices (Mayor + City Auditor) share single LOCAL_EXEC district row (geo_id=0606000)"
    - "Council title format: 'Council Member (District N)' with district number in parentheses (Berkeley convention)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/214_berkeley_officials.sql"
  modified:
    - "essentials.politicians (10 new rows)"
    - "essentials.offices (10 new rows)"

key-decisions:
  - "Berkeley Council titles use 'Council Member (District N)' format — distinct from SD/Fremont plain 'Council Member'"
  - "Jenny Wong is City Auditor (NOT Ann-Marie Hogan who retired Nov 2022; Wong elected Nov 2022)"
  - "NO City Attorney row — Berkeley City Attorney is appointed, not elected; excluded from Phase 68 scope"
  - "All 10 offices is_appointed_position=false — all Berkeley Tier-1 officials elected via RCV"
  - "Mayor and City Auditor both FK to geo_id='0606000' LOCAL_EXEC district — two citywide offices share one district row"

patterns-established:
  - "Berkeley -680xxx external_id scheme: -680001=Mayor, -680002=Auditor, -680010..-680017=council D1-D8"

# Metrics
duration: 8min
completed: 2026-05-22
---

# Phase 68 Plan 02: Berkeley Officials Seed Summary

**10 Berkeley officials (Mayor Ishii, Auditor Wong, 8 council members D1-D8) seeded via CTE pattern; office_id back-filled; end-to-end routing verified from City Hall to Igor Tregub D4**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-22T20:51:32Z
- **Completed:** 2026-05-22T20:59:28Z
- **Tasks:** 2
- **Files modified:** 1 (migration 214)

## Accomplishments

- All 5 pre-flight checks passed before writing migration (range clear, 3 chambers exist, 8 districts exist, LOCAL_EXEC exists, 8 geofences exist)
- 10 politicians seeded with correct external_ids, names, and attributes; all is_active/is_incumbent=true, is_appointed=false, party=NULL
- 10 office rows seeded — 8 linked to council districts, 2 linked to Berkeley-wide LOCAL_EXEC (geo_id=0606000)
- Section-split detector returned 0 rows — no split-section bug
- End-to-end routing confirmed: Berkeley City Hall (-122.2726, 37.8709) → berkeley-council-district-4 → Igor Tregub "Council Member (District 4)"

## Pre-flight Check Results

All 5 checks passed before migration was written:

| Check | Query | Expected | Result |
|---|---|---|---|
| 1 | -680xxx range clear | 0 rows | 0 rows PASS |
| 2 | 3 Berkeley chambers | City Auditor, City Council, Mayor | All 3 present PASS |
| 3 | 8 council districts | count=8 | count=8 PASS |
| 4 | LOCAL_EXEC district | geo_id='0606000', district_type='LOCAL_EXEC' | 1 row PASS |
| 5 | 8 X0009 geofences | count=8 | count=8 PASS |

## Full Berkeley Officials Roster (Verification Query Output)

| chamber | full_name | title | is_appointed_position | district_geo_id | external_id | politician_id |
|---|---|---|---|---|---|---|
| City Auditor | Jenny Wong | City Auditor | false | 0606000 | -680002 | 3342ae40-cc86-43e5-8581-3237b6aa8f08 |
| City Council | Mark Humbert | Council Member (District 8) | false | berkeley-council-district-8 | -680017 | 7833be90-c693-40b8-a309-61ee77b4ba03 |
| City Council | Cecilia Lunaparra | Council Member (District 7) | false | berkeley-council-district-7 | -680016 | 116aace8-9440-498b-bf1d-ebb196727c85 |
| City Council | Brent Blackaby | Council Member (District 6) | false | berkeley-council-district-6 | -680015 | 424eb63b-9976-4059-8049-365c09719cc6 |
| City Council | Shoshana O'Keefe | Council Member (District 5) | false | berkeley-council-district-5 | -680014 | 8cc1c412-fe14-4bc6-b1e2-02d95997fd47 |
| City Council | Igor Tregub | Council Member (District 4) | false | berkeley-council-district-4 | -680013 | 9f9a35a9-0226-45f0-9fd8-ef46163f7245 |
| City Council | Ben Bartlett | Council Member (District 3) | false | berkeley-council-district-3 | -680012 | eaab41f8-71c8-47db-bd0b-62da46b5607b |
| City Council | Terry Taplin | Council Member (District 2) | false | berkeley-council-district-2 | -680011 | bcdb549a-48bf-400f-9d23-c93e2e71007c |
| City Council | Rashi Kesarwani | Council Member (District 1) | false | berkeley-council-district-1 | -680010 | d2013613-769f-4374-809e-a018dbc1e683 |
| Mayor | Adena Ishii | Mayor | false | 0606000 | -680001 | 965de422-660e-4e24-9fe6-717cc0313403 |

**10 rows. City Auditor=Jenny Wong (NOT Hogan). All is_appointed_position=false. NO City Attorney.**

## Section-Split Detector Output

```sql
-- Query 6 result: 0 rows
-- No split-section bugs detected for Berkeley chambers
```

## Berkeley City Hall Routing Output

**Query 7: ST_Covers(-122.2726, 37.8709)**

```
full_name: Igor Tregub
geo_id: berkeley-council-district-4
title: Council Member (District 4)
```

Exactly 1 row — District 4 confirmed (consistent with 68-01 smoke test).

## Mayor Routing Output

**Query 8: LOCAL_EXEC for external_id=-680001**

```
full_name: Adena Ishii
title: Mayor
geo_id: 0606000
district_type: LOCAL_EXEC
```

## City Auditor Routing Output

**Query 9: LOCAL_EXEC for external_id=-680002**

```
full_name: Jenny Wong
title: City Auditor
geo_id: 0606000
district_type: LOCAL_EXEC
```

## Task Commits

No task-specific commits — migration 214 is applied directly to Supabase (C:/EV-Accounts is not a git repo).

**Plan metadata:** committed in planning docs commit

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/214_berkeley_officials.sql` — 10 Berkeley politicians + offices via WITH ins_p CTE pattern + office_id back-fill; idempotent
- `essentials.politicians` — 10 new rows inserted
- `essentials.offices` — 10 new rows inserted

## Decisions Made

- Jenny Wong is the correct City Auditor (Hogan retired Nov 2022; Wong elected Nov 2022, term expires Nov 2026)
- No City Attorney seeded — Berkeley City Attorney (DeNichilo) is appointed by City Manager, not elected
- Council titles include district number in parentheses: 'Council Member (District N)' — Berkeley convention per city website
- All 10 offices is_appointed_position=false — Berkeley uses RCV for all Tier-1 elected officials including Mayor, Auditor, and all council members
- Migration 214 executed statement-by-statement via Supabase Management API (BEGIN/COMMIT block not supported for multi-statement transactions via the API)

## Deviations from Plan

None — plan executed exactly as written. The only note is that the Supabase Management API requires individual statement execution rather than a full BEGIN/COMMIT block transaction. All 11 statements executed individually and succeeded.

## Issues Encountered

- **Query 4 range direction**: The plan's verification Query 4 uses `WHERE external_id BETWEEN -680010 AND -680017` which returns 0 rows for negative numbers (in SQL, BETWEEN is inclusive low-to-high, and -680010 > -680017 numerically). The correct range is `BETWEEN -680017 AND -680010`. This is a plan documentation issue only — the underlying data is correct (all 8 council offices verified with the corrected range query and via the full roster query).

## Notes for 68-03: Politician IDs for Headshot Upload

All 10 Berkeley politicians ready for headshot upload. IDs from live DB:

| external_id | full_name | politician_id |
|---|---|---|
| -680001 | Adena Ishii (Mayor) | 965de422-660e-4e24-9fe6-717cc0313403 |
| -680002 | Jenny Wong (City Auditor) | 3342ae40-cc86-43e5-8581-3237b6aa8f08 |
| -680010 | Rashi Kesarwani (D1) | d2013613-769f-4374-809e-a018dbc1e683 |
| -680011 | Terry Taplin (D2) | bcdb549a-48bf-400f-9d23-c93e2e71007c |
| -680012 | Ben Bartlett (D3) | eaab41f8-71c8-47db-bd0b-62da46b5607b |
| -680013 | Igor Tregub (D4) | 9f9a35a9-0226-45f0-9fd8-ef46163f7245 |
| -680014 | Shoshana O'Keefe (D5) | 8cc1c412-fe14-4bc6-b1e2-02d95997fd47 |
| -680015 | Brent Blackaby (D6) | 424eb63b-9976-4059-8049-365c09719cc6 |
| -680016 | Cecilia Lunaparra (D7) | 116aace8-9440-498b-bf1d-ebb196727c85 |
| -680017 | Mark Humbert (D8) | 7833be90-c693-40b8-a309-61ee77b4ba03 |

Storage path pattern: `{politician_id}-headshot.jpg`

## Next Phase Readiness

68-03 (headshots) is fully unblocked:
- All 10 politician IDs captured above
- All 10 office_id values back-filled (verified Q1: has_office_id=true for all)
- Berkeley website (cityofberkeley.info) is the primary headshot source per plan research
- Next migration is 215 (214 applied 2026-05-22)

---
*Phase: 68-berkeley-deep-seed*
*Completed: 2026-05-22*
