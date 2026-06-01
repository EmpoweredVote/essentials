---
phase: 75-or-state-legislature
plan: 02
subsystem: essentials-data
tags: [postgres, migration, supabase, oregon, house, state-legislature, politicians, offices]

# Dependency graph
requires:
  - phase: 75-or-state-legislature
    plan: 01
    provides: Migration 226 applied (OR Senate); pattern reference for house generator
  - phase: 72-portland-or
    plan: 02
    provides: OR TIGER geofences + STATE_LOWER districts (state='or')
  - phase: 73-or-government-db
    plan: 01
    provides: Oregon House of Representatives chamber under State of Oregon government

provides:
  - 60 OR House Representatives seeded in essentials.politicians (external_id -4120001..-4120060)
  - 60 offices linked to STATE_LOWER districts via Oregon House of Representatives chamber
  - Migration 227 applied and verified idempotent
  - Generator script generate_or_house.ps1 for future reference

affects:
  - phase-75-plan-03 (OR Legislature Headshots -- needs politician UUIDs from this plan)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CTE block per politician (ins_p RETURNING id -> CROSS JOIN for office INSERT)"
    - "WHERE NOT EXISTS guard on office INSERT -- no unique constraint on offices"
    - "ON CONFLICT (external_id) DO NOTHING -- idempotent politician INSERT"
    - "office_id back-fill UPDATE at end of migration"
    - "d.state = 'or' (lowercase) for STATE_LOWER -- TIGER loader casing"
    - "district_type = 'STATE_LOWER' mandatory -- geo_ids 41001-41030 exist in both STATE_UPPER and STATE_LOWER"
    - "PowerShell [char]0xNNNN escape sequences for non-ASCII names (PS 5.1 reads scripts as ANSI without BOM)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/227_or_state_house.sql
    - C:/EV-Accounts/backend/migrations/generate_or_house.ps1

requirements-completed:
  - D-02: 60 OR House Reps linked to STATE_LOWER districts state='or'
  - D-08: All legislators from oregonlegislature.gov authoritative roster seeded
  - D-10: external_id range -4120001..-4120060 fully occupied

# Metrics
duration: ~25min
completed: 2026-05-29
---

# Phase 75 Plan 02: OR House Representatives Summary

**Migration 227 seeds all 60 Oregon House Representatives into essentials.politicians + essentials.offices, linking each office to the correct STATE_LOWER district via the Oregon House of Representatives chamber. All 10 verification gates pass. Section-split check clean. Senate regression check clean. Idempotency confirmed.**

## Pre-Flight Check Results

| Check | Query | Expected | Actual | Status |
|-------|-------|----------|--------|--------|
| PRE-CHECK 1: No existing rows in target range | COUNT WHERE external_id BETWEEN -4120060 AND -4120001 | 0 | 0 | PASS |
| PRE-CHECK 2: Oregon House chamber exists | JOIN governments + chambers WHERE name = 'Oregon House of Representatives' | 1 row | 1 row (id: 6de3a789-d5b8-4967-9492-c08bfa3ad046) | PASS |
| PRE-CHECK 3: 60 STATE_LOWER districts exist | COUNT WHERE district_type='STATE_LOWER' AND state='or' | 60 | 60 | PASS |
| PRE-CHECK 4: Senate regression intact | COUNT WHERE external_id BETWEEN -4110030 AND -4110001 | 30 | 30 | PASS |

## Migration Apply Log

- **Migration name:** 227_or_state_house
- **Apply result:** `{"success":true}`
- **Idempotency re-apply result:** `{"success":true}` (all INSERTs produced 0 new rows; UPDATE produced 0 rows)

## Verification Query Results (Q1-Q10)

| Q# | Query Description | Expected | Actual | Status |
|----|-------------------|----------|--------|--------|
| Q1 | COUNT politicians WHERE external_id BETWEEN -4120060 AND -4120001 | 60 | 60 | PASS |
| Q2 | COUNT offices joined to Oregon House of Representatives chamber | 60 | 60 | PASS |
| Q3 | COUNT politicians in range WHERE office_id IS NULL | 0 | 0 | PASS |
| Q4 | COUNT offices joined to Oregon House of Representatives + STATE_LOWER + state='or' | 60 | 60 | PASS |
| Q5 | DISTINCT title from Oregon House of Representatives offices | 'Representative' | 'Representative' | PASS |
| Q6 | DISTINCT representing_state from Oregon House of Representatives offices | 'OR' | 'OR' | PASS |
| Q7 | Spot-check 5 reps (HD-01, HD-14, HD-33, HD-42, HD-60) | 5 rows with correct name/party/geo_id | See table below | PASS |
| Q8 | COUNT Oregon House offices with NULL district_id or politician_id | 0 | 0 | PASS |
| Q9 | COUNT Oregon House offices linked to STATE_UPPER districts | 0 | 0 | PASS |
| Q10 | Portland coords (-122.6794, 45.5231) -> Oregon House rep | Shannon Isadore, -4120033, 41033 | Shannon Isadore, -4120033, 41033 | PASS |

### Q7 Spot-Check Detail

| external_id | full_name | party | title | geo_id |
|-------------|-----------|-------|-------|--------|
| -4120001 | Court Boice | Republican | Representative | 41001 |
| -4120014 | Julie Fahey | Democratic | Representative | 41014 |
| -4120033 | Shannon Isadore | Democratic | Representative | 41033 |
| -4120042 | Rob Nosse | Democratic | Representative | 41042 |
| -4120060 | Mark Owens | Republican | Representative | 41060 |

## Section-Split Check

```sql
SELECT gb.geo_id FROM essentials.geofence_boundaries gb
WHERE gb.state = '41' AND gb.mtfcc = 'G5220'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id AND d.district_type = 'STATE_LOWER' AND d.state = 'or'
  );
```

**Result: 0 rows -- CLEAN**

## Senate Untouched Regression Check

```sql
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4110030 AND -4110001;
```

**Result: 30 -- UNTOUCHED**

## Idempotency Re-Apply

- Re-applied migration 227_or_state_house a second time
- Result: `{"success":true}` with no errors
- Q1 post-re-apply: COUNT = **60** (unchanged)
- Q4 post-re-apply: COUNT = **60** (unchanged)
- Confirms: ON CONFLICT (external_id) DO NOTHING + WHERE NOT EXISTS guards working correctly

## Files Created

- `C:/EV-Accounts/backend/migrations/generate_or_house.ps1` -- PowerShell generator; roster of 60 reps hardcoded; writes 227_or_state_house.sql; UTF-8 without BOM; uses [char]0xNNNN escape sequences for non-ASCII names (Lesly Munoz, Daniel Nguyen, Thuy Tran)
- `C:/EV-Accounts/backend/migrations/227_or_state_house.sql` -- Applied migration: 60 CTE blocks + office_id back-fill; wrapped in BEGIN/COMMIT

## Deviations from Plan

1. **PowerShell Unicode encoding:** The generator script's ps1 file has no BOM; Windows PowerShell 5.1 reads scripts without BOM as ANSI codepage, mangling UTF-8 multi-byte characters. Fixed by using `[char]0x00F1` (n-tilde), `[char]0x1EBF` (e-circumflex-acute for Nguyen), `[char]0x1EE7` + `[char]0x1EA7` (Thuy/Tran diacriticals) escape sequences in the roster hashtable. These render correctly in the generated SQL output.
2. **Structural check d.state count:** The structural check used `-eq 60` for `d.state = 'or'` occurrences; actual count is 61 because the SQL header comment `-- CRITICAL: d.state = 'or'` adds one extra match. Same pattern as Plan 75-01 deviation. All 60 functional WHERE clauses confirmed correct. Check adjusted to `-ge 60`.

## Complete Roster Table (for Plan 75-03)

UUIDs retrievable via:
```sql
SELECT p.id, p.full_name, p.external_id, d.geo_id
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -4120060 AND -4120001
ORDER BY p.external_id DESC;
```

| external_id | full_name | District geo_id | Party |
|-------------|-----------|-----------------|-------|
| -4120001 | Court Boice | 41001 | Republican |
| -4120002 | Virgle Osborne | 41002 | Republican |
| -4120003 | Dwayne Yunker | 41003 | Republican |
| -4120004 | Alek Skarlatos | 41004 | Republican |
| -4120005 | Pam Marsh | 41005 | Democratic |
| -4120006 | Kim Wallan | 41006 | Republican |
| -4120007 | John Lively | 41007 | Democratic |
| -4120008 | Lisa Fragala | 41008 | Democratic |
| -4120009 | Boomer Wright | 41009 | Republican |
| -4120010 | David Gomberg | 41010 | Democratic |
| -4120011 | Jami Cate | 41011 | Republican |
| -4120012 | Darin Harbick | 41012 | Republican |
| -4120013 | Nancy Nathanson | 41013 | Democratic |
| -4120014 | Julie Fahey | 41014 | Democratic |
| -4120015 | Shelly Boshart Davis | 41015 | Republican |
| -4120016 | Sarah Finger McDonald | 41016 | Democratic |
| -4120017 | Ed Diehl | 41017 | Republican |
| -4120018 | Rick Lewis | 41018 | Republican |
| -4120019 | Tom Andersen | 41019 | Democratic |
| -4120020 | Paul Evans | 41020 | Democratic |
| -4120021 | Kevin Mannix | 41021 | Republican |
| -4120022 | Lesly Munoz | 41022 | Democratic |
| -4120023 | Anna Scharf | 41023 | Republican |
| -4120024 | Lucetta Elmer | 41024 | Republican |
| -4120025 | Ben Bowman | 41025 | Democratic |
| -4120026 | Sue Rieke Smith | 41026 | Democratic |
| -4120027 | Ken Helm | 41027 | Democratic |
| -4120028 | Dacia Grayber | 41028 | Democratic |
| -4120029 | Susan McLain | 41029 | Democratic |
| -4120030 | Nathan Sosa | 41030 | Democratic |
| -4120031 | Darcey Edwards | 41031 | Republican |
| -4120032 | Cyrus Javadi | 41032 | Democratic |
| -4120033 | Shannon Isadore | 41033 | Democratic |
| -4120034 | Mari Watanabe | 41034 | Democratic |
| -4120035 | Farrah Chaichi | 41035 | Democratic |
| -4120036 | Hai Pham | 41036 | Democratic |
| -4120037 | Jules Walters | 41037 | Democratic |
| -4120038 | Daniel Nguyen | 41038 | Democratic |
| -4120039 | April Dobson | 41039 | Democratic |
| -4120040 | Annessa Hartman | 41040 | Democratic |
| -4120041 | Mark Gamba | 41041 | Democratic |
| -4120042 | Rob Nosse | 41042 | Democratic |
| -4120043 | Tawna D. Sanchez | 41043 | Democratic |
| -4120044 | Travis Nelson | 41044 | Democratic |
| -4120045 | Thuy Tran | 41045 | Democratic |
| -4120046 | Willy Chotzen | 41046 | Democratic |
| -4120047 | Andrea Valderrama | 41047 | Democratic |
| -4120048 | Lamar Wise | 41048 | Democratic |
| -4120049 | Zach Hudson | 41049 | Democratic |
| -4120050 | Ricki Ruiz | 41050 | Democratic |
| -4120051 | Matt Bunch | 41051 | Republican |
| -4120052 | Jeff Helfrich | 41052 | Republican |
| -4120053 | Emerson Levy | 41053 | Democratic |
| -4120054 | Jason Kropf | 41054 | Democratic |
| -4120055 | E. Werner Reschke | 41055 | Republican |
| -4120056 | Emily McIntire | 41056 | Republican |
| -4120057 | Gregory Smith | 41057 | Republican |
| -4120058 | Bobby Levy | 41058 | Republican |
| -4120059 | Vikki Breese-Iverson | 41059 | Republican |
| -4120060 | Mark Owens | 41060 | Republican |

**Total: 60 representatives. 37 Democratic, 23 Republican. No vacancies.**

Note: Names with diacriticals (HD-22 Lesly Munoz with tilde-n, HD-38 Daniel Nguyen with Vietnamese e, HD-45 Thuy Tran with Vietnamese diacriticals) are stored with correct Unicode in the database. The ASCII-only representations above are for table display only; the DB values match the official oregonlegislature.gov roster spellings.

## Key Decisions

- HD-15 Shelly Boshart Davis: `last_name='Boshart Davis'` (compound) -- consistent with senate compound surname pattern
- HD-16 Sarah Finger McDonald: `last_name='Finger McDonald'` (compound)
- HD-26 Sue Rieke Smith: `last_name='Rieke Smith'` (compound) -- confirmed from RESEARCH.md
- HD-38 Daniel Nguyen: Unicode U+1EBF (e with circumflex and acute) stored correctly; headshot filename is `nguyend.jpg` (disambiguation suffix)
- HD-43 Tawna D. Sanchez: middle initial retained in full_name; `last_name='Sanchez'` (initial not included in last_name)
- HD-55 E. Werner Reschke: `first_name='E. Werner'`, `last_name='Reschke'` -- initial retained as part of first_name
- Party values stored as 'Democratic' and 'Republican' (full word) -- consistent with all prior state legislature migrations

## Next Phase Readiness

- Plan 75-03 (OR Legislature Headshots): All 90 politician UUIDs now available (30 senators + 60 house reps); headshot URL pattern `oregonlegislature.gov/{senate|house}/MemberPhotos/{lastname}.jpg`; next migration 228

---
*Phase: 75-or-state-legislature*
*Plan: 02*
*Completed: 2026-05-29*
