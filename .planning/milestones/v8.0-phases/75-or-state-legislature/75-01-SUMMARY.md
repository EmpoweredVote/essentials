---
phase: 75-or-state-legislature
plan: 01
subsystem: essentials-data
tags: [postgres, migration, supabase, oregon, senate, state-legislature, politicians, offices]

# Dependency graph
requires:
  - phase: 72-portland-or
    provides: OR TIGER geofences + STATE_UPPER/STATE_LOWER districts (state='or')
  - phase: 73-or-government-db
    provides: Oregon Senate chamber under State of Oregon government

provides:
  - 30 OR State Senators seeded in essentials.politicians (external_id -4110001..-4110030)
  - 30 offices linked to STATE_UPPER districts via Oregon Senate chamber
  - Migration 226 applied and verified idempotent
  - Generator script generate_or_senate.ps1 for future reference

affects:
  - phase-75-plan-02 (OR House Reps — uses same pattern, STATE_LOWER, external_id -4120001..-4120060)
  - phase-75-plan-03 (OR Legislature Headshots — needs politician UUIDs from this plan)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CTE block per politician (ins_p RETURNING id -> CROSS JOIN for office INSERT)"
    - "WHERE NOT EXISTS guard on office INSERT — no unique constraint on offices"
    - "ON CONFLICT (external_id) DO NOTHING — idempotent politician INSERT"
    - "office_id back-fill UPDATE at end of migration"
    - "d.state = 'or' (lowercase) for STATE_UPPER/STATE_LOWER — TIGER loader casing"
    - "district_type = 'STATE_UPPER' mandatory — geo_ids 41001-41030 exist in both STATE_UPPER and STATE_LOWER"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/226_or_state_senators.sql
    - C:/EV-Accounts/backend/migrations/generate_or_senate.ps1

requirements-completed:
  - D-01: 30 OR State Senators linked to STATE_UPPER districts state='or'
  - D-08: All legislators from oregonlegislature.gov authoritative roster seeded
  - D-10: external_id range -4110001..-4110030 fully occupied

# Metrics
duration: ~20min
completed: 2026-05-29
---

# Phase 75 Plan 01: OR State Senate Officials Summary

**Migration 226 seeds all 30 Oregon State Senators into essentials.politicians + essentials.offices, linking each office to the correct STATE_UPPER district via the Oregon Senate chamber. All 10 verification gates pass. Section-split check clean. Idempotency confirmed.**

## Pre-Flight Check Results

| Check | Query | Expected | Actual | Status |
|-------|-------|----------|--------|--------|
| PRE-CHECK 1: No existing rows in target range | COUNT WHERE external_id BETWEEN -4110030 AND -4110001 | 0 | 0 | PASS |
| PRE-CHECK 2: Oregon Senate chamber exists | JOIN governments + chambers WHERE name = 'Oregon Senate' | 1 row | 1 row (id: 094f597b-2cf9-4aa8-9c38-a64f651bb95a) | PASS |
| PRE-CHECK 3: 30 STATE_UPPER districts exist | COUNT WHERE district_type='STATE_UPPER' AND state='or' | 30 | 30 | PASS |

## Migration Apply Log

- **Migration name:** 226_or_state_senators
- **Apply result:** `{"success":true}`
- **Idempotency re-apply result:** `{"success":true}` (all INSERTs produced 0 new rows; UPDATE produced 0 rows)

## Verification Query Results (Q1–Q10)

| Q# | Query Description | Expected | Actual | Status |
|----|-------------------|----------|--------|--------|
| Q1 | COUNT politicians WHERE external_id BETWEEN -4110030 AND -4110001 | 30 | 30 | PASS |
| Q2 | COUNT offices joined to Oregon Senate chamber | 30 | 30 | PASS |
| Q3 | COUNT politicians in range WHERE office_id IS NULL | 0 | 0 | PASS |
| Q4 | COUNT offices joined to Oregon Senate + STATE_UPPER + state='or' | 30 | 30 | PASS |
| Q5 | DISTINCT title from Oregon Senate offices | 'Senator' | 'Senator' | PASS |
| Q6 | DISTINCT representing_state from Oregon Senate offices | 'OR' | 'OR' | PASS |
| Q7 | Spot-check 5 senators (SD-01, SD-03, SD-17, SD-19, SD-30) | 5 rows with correct name/party/geo_id | See table below | PASS |
| Q8 | COUNT Oregon Senate offices with NULL district_id or politician_id | 0 | 0 | PASS |
| Q9 | COUNT Oregon Senate offices linked to STATE_LOWER districts | 0 | 0 | PASS |
| Q10 | Portland coords (-122.6794, 45.5231) -> Oregon Senate senator | Lisa Reynolds, -4110017, 41017 | Lisa Reynolds, -4110017, 41017 | PASS |

### Q7 Spot-Check Detail

| external_id | full_name | party | title | geo_id |
|-------------|-----------|-------|-------|--------|
| -4110001 | David Brock Smith | Republican | Senator | 41001 |
| -4110003 | Jeff Golden | Democratic | Senator | 41003 |
| -4110017 | Lisa Reynolds | Democratic | Senator | 41017 |
| -4110019 | Rob Wagner | Democratic | Senator | 41019 |
| -4110030 | Mike McLane | Republican | Senator | 41030 |

## Section-Split Check

```sql
SELECT gb.geo_id FROM essentials.geofence_boundaries gb
WHERE gb.state = '41' AND gb.mtfcc = 'G5210'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id AND d.district_type = 'STATE_UPPER' AND d.state = 'or'
  );
```

**Result: 0 rows — CLEAN**

## Idempotency Re-Apply

- Re-applied migration 226_or_state_senators a second time
- Result: `{"success":true}` with no errors
- Q1 post-re-apply: COUNT = **30** (unchanged)
- Q4 post-re-apply: COUNT = **30** (unchanged)
- Confirms: ON CONFLICT (external_id) DO NOTHING + WHERE NOT EXISTS guards working correctly

## Files Created

- `C:/EV-Accounts/backend/migrations/generate_or_senate.ps1` — PowerShell generator; roster of 30 senators hardcoded; writes 226_or_state_senators.sql; UTF-8 without BOM
- `C:/EV-Accounts/backend/migrations/226_or_state_senators.sql` — Applied migration: 30 CTE blocks + office_id back-fill; wrapped in BEGIN/COMMIT

## Complete Roster Table (for Plans 75-02 and 75-03)

All 30 senators with their production UUIDs can be retrieved via:
```sql
SELECT p.id, p.full_name, p.external_id, d.geo_id
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -4110030 AND -4110001
ORDER BY p.external_id DESC;
```

| external_id | full_name | District geo_id | Party |
|-------------|-----------|-----------------|-------|
| -4110001 | David Brock Smith | 41001 | Republican |
| -4110002 | Noah Robinson | 41002 | Republican |
| -4110003 | Jeff Golden | 41003 | Democratic |
| -4110004 | Floyd Prozanski | 41004 | Democratic |
| -4110005 | Dick Anderson | 41005 | Republican |
| -4110006 | Cedric Hayden | 41006 | Republican |
| -4110007 | James I. Manning Jr. | 41007 | Democratic |
| -4110008 | Sara Gelser Blouin | 41008 | Democratic |
| -4110009 | Fred Girod | 41009 | Republican |
| -4110010 | Deb Patterson | 41010 | Democratic |
| -4110011 | Kim Thatcher | 41011 | Republican |
| -4110012 | Bruce Starr | 41012 | Republican |
| -4110013 | Courtney Neron Misslin | 41013 | Democratic |
| -4110014 | Kate Lieber | 41014 | Democratic |
| -4110015 | Janeen Sollman | 41015 | Democratic |
| -4110016 | Suzanne Weber | 41016 | Republican |
| -4110017 | Lisa Reynolds | 41017 | Democratic |
| -4110018 | Wlnsvey Campos | 41018 | Democratic |
| -4110019 | Rob Wagner | 41019 | Democratic |
| -4110020 | Mark Meek | 41020 | Democratic |
| -4110021 | Kathleen Taylor | 41021 | Democratic |
| -4110022 | Lew Frederick | 41022 | Democratic |
| -4110023 | Khanh Pham | 41023 | Democratic |
| -4110024 | Kayse Jama | 41024 | Democratic |
| -4110025 | Chris Gorsek | 41025 | Democratic |
| -4110026 | Christine Drazan | 41026 | Republican |
| -4110027 | Anthony Broadman | 41027 | Democratic |
| -4110028 | Diane Linthicum | 41028 | Republican |
| -4110029 | Todd Nash | 41029 | Republican |
| -4110030 | Mike McLane | 41030 | Republican |

**Total: 30 senators. 20 Democratic, 10 Republican. No vacancies.**

## Key Decisions

- SD-01 David Brock Smith: `last_name='Brock Smith'` (compound) — matches full_name pattern used for Sara Gelser Blouin (SD-08) and Courtney Neron Misslin (SD-13)
- SD-07 James I. Manning Jr.: `last_name='Manning'` (suffix stripped for last_name column; full_name retains "Jr.")
- Party values stored as 'Democratic' and 'Republican' (full word, no abbreviation) — consistent with all prior state legislature migrations

## Deviations from Plan

None. The plan's structural verification check used `Count -eq 30` for `d.state = 'or'` occurrences; actual count was 31 because the SQL header comments also contain the string. Refined check to match only WHERE clause occurrences — all 30 functional clauses confirmed present. The em-dash characters in the generator script's `AppendLine` calls caused a PowerShell parse error on Windows PowerShell 5.1; replaced with hyphens in comment text.

## Next Phase Readiness

- Plan 75-02 (OR House Reps): Use `generate_or_house.ps1` pattern; 60 STATE_LOWER districts; external_id -4120001..-4120060; migration 227
- Plan 75-03 (OR Legislature Headshots): UUIDs retrievable via roster query above; headshot URL pattern `oregonlegislature.gov/senate/MemberPhotos/{lastname}.jpg`

---
*Phase: 75-or-state-legislature*
*Plan: 01*
*Completed: 2026-05-29*
