---
phase: 61-ca-state-legislature
plan: 01
subsystem: database
tags: [postgres, migration, california, state-senate, geofence, districts]

# Dependency graph
requires:
  - phase: 57-ca-tiger-geofences
    provides: 40 CA STATE_UPPER district rows (geo_id '06001'..'06040') + G5210 geofence_boundaries
  - phase: 59-ca-executives
    provides: CA government row + 8 executive chambers established
provides:
  - CA State Senate chamber (essentials.chambers, slug='california-state-senate')
  - 40 senator politician rows (external_ids -6001001 through -6001040)
  - 40 office rows linking senators to STATE_UPPER districts
  - Address routing for CA Senate districts via SF → Scott Wiener (SD-11) confirmed
affects:
  - 61-02 (CA Assembly — needs chamber pattern, confirmed pre-existing assembly seed approach)
  - 61-03 (CA headshots — needs politician UUIDs from this plan)
  - 62-lausd (routing pattern confirmation)
  - 69-ca-elections (senator office_ids needed for race rows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - CTE pattern for politician+office atomic insert (INSERT ... RETURNING id CROSS JOIN)
    - WHERE NOT EXISTS idempotency guard on chamber INSERT (no slug column ever)
    - office_id backfill UPDATE after all 40 CTEs complete
    - UTF-8 explicit encoding for migration files with accented senator names

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/194_ca_state_senators.sql

key-decisions:
  - "CA STATE_UPPER districts use state='CA' (uppercase), not 'ca' — pre-existing data loaded before TIGER loader pattern was established; migration uses state='CA' to match"
  - "CA districts.mtfcc is swapped (STATE_UPPER has G5220, STATE_LOWER has G5210) but routing service joins on gb.mtfcc not d.mtfcc — this pre-existing data quality issue does not break routing"
  - "SD-37 Steven Choi full_name stored as 'Steven \"Steve\" Choi' matching official CA Senate website; double quotes safe in SQL string literals"
  - "Smoke test query from plan used wrong join (d.mtfcc = gb.mtfcc) — corrected to match essentialsService.ts actual join pattern (gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')"

patterns-established:
  - "CA Senate senator external_id scheme: -6001001 (SD-01) through -6001040 (SD-40)"
  - "CA Senate geo_id formula: '06' + zero-padded 3-digit district number (06001..06040)"

# Metrics
duration: 14min
completed: 2026-05-21
---

# Phase 61 Plan 01: CA State Senate Senators Summary

**California State Senate chamber seeded with all 40 senators (SD-01 through SD-40), office rows linked to Phase 57 SLDU districts, and SF City Hall routing confirmed to Scott Wiener in SD-11**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-21T23:24:04Z
- **Completed:** 2026-05-21T23:37:55Z
- **Tasks:** 2/2
- **Files modified:** 1 (migration created)

## Accomplishments
- Created CA State Senate chamber row with auto-generated slug 'california-state-senate'
- Seeded all 40 current CA State Senators (SD-01 through SD-40) fetched from senate.ca.gov/senators
- Inserted 40 office rows linking each senator to their STATE_UPPER district via geo_id join
- Completed office_id backfill (0 nulls in -6001001..-6001040 range)
- Confirmed production routing: SF City Hall (-122.4191, 37.7792) → Scott Wiener (SD-11, geo_id='06011')

## Task Commits

Each task was committed atomically:

1. **Task 1: Pre-checks and senator roster fetch** - (no commit — read-only queries and web fetch; included in Task 2 commit)
2. **Task 2: Generate and apply Migration 194** - `feat(61-01): seed CA State Senate chamber and 40 senators`

**Plan metadata:** see docs commit below

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/194_ca_state_senators.sql` - Migration 194: CA State Senate chamber + 40 senators + 40 offices + office_id backfill

## Decisions Made

1. **CA STATE_UPPER districts use state='CA' (uppercase)** — Pre-check 3 failed for `state='ca'` (0 rows); investigation revealed pre-existing CA districts were loaded before the TIGER loader lowercase-abbrev pattern was established. Found 40 STATE_UPPER rows with `state='CA'`. Migration uses `state='CA'` to match actual DB data. [Rule 1 - Bug fix in plan spec]

2. **districts.mtfcc swapped for CA state legislature** — CA STATE_UPPER has `mtfcc='G5220'` and STATE_LOWER has `mtfcc='G5210'` (inverse of TIGER codes). This is a pre-existing data quality issue. The routing service (`essentialsService.ts` line 567) joins using `gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER'` — it does not join on `d.mtfcc`. Routing works correctly; the `d.mtfcc` column value is irrelevant to address routing. No fix required in scope.

3. **Steven Choi full_name** — Official name on senate.ca.gov is `Steven "Steve" Choi`. Stored with double quotes in SQL string literal (safe, no escaping needed). First_name='Steven', Last_name='Choi'.

4. **Smoke test query corrected** — The plan's smoke test query used `AND d.mtfcc = gb.mtfcc` in the JOIN which produced the wrong result (returned John Laird for SD-17 instead of Scott Wiener for SD-11). The corrected join matches essentialsService.ts: `JOIN essentials.districts d ON d.geo_id = gb.geo_id AND (gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')`. Corrected query confirms Scott Wiener / geo_id='06011'.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CA STATE_UPPER districts use state='CA' not 'ca'**
- **Found during:** Task 1 (Pre-check 3)
- **Issue:** Plan pre-check used `state = 'ca'` (lowercase); DB has `state = 'CA'` (uppercase) for the 40 pre-existing CA STATE_UPPER districts — returned 0 instead of 40
- **Fix:** Migration SQL updated to use `state = 'CA'` in the WHERE clause for districts join
- **Files modified:** 194_ca_state_senators.sql
- **Verification:** 40 office rows created and linked correctly; SF smoke test passes
- **Committed in:** feat(61-01) task commit

**2. [Rule 1 - Bug] Migration file encoding**
- **Found during:** Task 2 (first apply attempt)
- **Issue:** Python `print()` on Windows defaulted to system encoding (cp1252/Latin-1) for accented characters in senator names (Arreguín, Limón, Gómez, Pérez, Renée). DB rejected the invalid UTF-8 byte sequences
- **Fix:** Regenerated file using `open(..., encoding='utf-8')` in Python; verified `\xc3\xae` (UTF-8 ñ) present
- **Files modified:** 194_ca_state_senators.sql
- **Verification:** Migration applied with `BEGIN...COMMIT` success; all 40 senators including accented names confirmed
- **Committed in:** feat(61-01) task commit

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- Pre-check 3 expected lowercase `state='ca'` but actual data uses `state='CA'` — pre-existing data predates TIGER loader pattern
- CA senate.ca.gov senators page uses JavaScript for the list rendering but the list is also present in server-rendered HTML; extractable via regex targeting `member__name`, `member__party`, and `data-district` attributes
- First migration apply failed due to Windows encoding issue with accented characters — fixed by explicit UTF-8 file write

## Next Phase Readiness
- CA State Senate foundation complete; Plan 02 (CA Assembly dedup + offices) can proceed
- Plan 03 (headshots) needs this plan's politician UUIDs — queryable by external_id range -6001001..-6001040
- No blockers for Phase 61 continuation
- Note for STATE.md: districts.mtfcc is swapped for CA (STATE_UPPER=G5220, STATE_LOWER=G5210) — document as known data quality issue; routing is unaffected

---
*Phase: 61-ca-state-legislature*
*Completed: 2026-05-21*
