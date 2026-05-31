---
phase: 66-sacramento-deep-seed
plan: 02
subsystem: database
tags: [postgres, postgis, sacramento, supabase, politicians, offices, migration]

# Dependency graph
requires:
  - phase: 66-01
    provides: Sacramento government structure (government, chambers, districts), geofence_boundaries (X0011), migration 219 applied
  - phase: 64-san-jose-deep-seed
    provides: WITH ins_p CTE pattern for politician+office seeding, office_id back-fill UPDATE pattern
provides:
  - 9 Sacramento politicians: Mayor Kevin McCarty (-660001) + 8 Council Members (-660010 to -660017)
  - 9 essentials.offices rows linked to correct chambers and districts
  - All 9 politicians.office_id back-filled (non-null)
  - Migration 220 applied to production Supabase
  - End-to-end routing verified: Sacramento City Hall -> Phil Pluckebaum (District 4)
affects: [66-03, phase-69-elections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sacramento official seeding uses same WITH ins_p CTE pattern as SJ migration 218
    - Rick Jennings II: last_name='Jennings II' to preserve generational suffix in DB
    - Mayor linked to LOCAL_EXEC district (geo_id='0664000') — same pattern as SJ Mayor
    - Appointed charter officers (City Attorney, Auditor, Treasurer, Clerk) excluded — no politician or office rows

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/220_sacramento_officials.sql
  modified: []

key-decisions:
  - "9 politicians total (Mayor + 8 Council Members) — NOT 13; City Attorney/Auditor/Treasurer/Clerk are appointed per charter and excluded"
  - "Rick Jennings II stored as last_name='Jennings II' — confirmed by ArcGIS COUNCIL field; anti-pattern is truncating to 'Jennings'"
  - "Mayor uses LOCAL_EXEC district (geo_id='0664000') — consistent with SJ Mayor pattern using '0668000'"
  - "external_id range -660xxx reserved for Sacramento (avoids collision with -640xxx SJ, -650xxx SD)"

patterns-established:
  - "Sacramento official external_id range: -660001 (Mayor), -660010 to -660017 (council D1-D8)"
  - "Generational suffix (II) belongs in both full_name AND last_name for correct display"

# Metrics
duration: 5min
completed: 2026-05-23
---

# Phase 66 Plan 02: Sacramento Officials Seed Summary

**9 Sacramento officials (Mayor McCarty + 8 Council Members) seeded via migration 220 with office rows, district links, and back-filled office_ids; PostGIS routing verified**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-23T17:19:45Z
- **Completed:** 2026-05-23T17:24:59Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Wrote and applied migration 220: 9 Sacramento politicians + 9 offices using WITH ins_p CTE pattern
- All 9 office_ids back-filled — 0 NULL office_ids remaining
- Gate A passed: Sacramento City Hall (-121.4944, 38.5816) routes to Phil Pluckebaum (District 4) via ST_Covers on X0011 geofences
- Gate B passed: Kevin McCarty routes via LOCAL_EXEC district (geo_id='0664000')
- Gate C passed: Section-split check returns 0 rows — no Sacramento politician linked to multiple governments
- Charter officer exclusion verified: Gustavo Martinez, Farishta Ahrary, John Colville, Mindy Cuppy = 0 rows in DB
- Rick Jennings II suffix preserved: full_name='Rick Jennings II', last_name='Jennings II'

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: Pre-flight check, write+apply migration 220, routing verification** - `3db0162` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/220_sacramento_officials.sql` - 9 Sacramento officials (Mayor + 8 Council Members), WITH ins_p CTE pattern, office_id back-fill UPDATE

## Decisions Made
- **Excluded appointed charter officers:** City Attorney (Gustavo Martinez, appointed Feb 2026), City Auditor (Farishta Ahrary, appointed Oct 2024), City Treasurer (John Colville), City Clerk (Mindy Cuppy) — all 4 are appointed, not elected; 9 politicians total not 13
- **Rick Jennings II last_name='Jennings II':** Generational suffix is part of identity; storing only 'Jennings' would cause incorrect display and future confusion. Both full_name and last_name include 'II'.
- **Mayor chamber name 'Mayor' (not 'Mayor of Sacramento'):** Matched the chamber name inserted in migration 219 from plan 66-01 research

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — pre-flight checks returned 0 existing politicians in the external_id range and 0 name collisions. Migration applied cleanly in one pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Migration 220 applied; 9 Sacramento politicians + offices fully linked with non-null office_ids
- Plan 66-03 (headshots) can query `politicians JOIN offices ON o.id = p.office_id WHERE external_id BETWEEN -660020 AND -660001` to build its headshot work-list — office_id back-fill is complete
- Sacramento government structure (migration 219 + 220) is complete: geofences, government, chambers, districts, politicians, offices all in place
- No blockers for phase 66-03

---
*Phase: 66-sacramento-deep-seed*
*Completed: 2026-05-23*
