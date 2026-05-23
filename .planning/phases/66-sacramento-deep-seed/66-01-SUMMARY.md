---
phase: 66-sacramento-deep-seed
plan: 01
subsystem: database
tags: [postgres, postgis, geofences, arcgis, sacramento, supabase]

# Dependency graph
requires:
  - phase: 64-san-jose-deep-seed
    provides: SJ geofence loader pattern (ArcGIS MapServer, outSR=4326, ON CONFLICT idempotency), SJ government structure migration pattern (WHERE NOT EXISTS, GENERATED slug column rule)
  - phase: 67-fremont-deep-seed
    provides: X0008 MTFCC claim pattern, Fremont loader confirming DISTRICTINT field name variant per city
provides:
  - 8 sacramento-council-district-{1-8} geofence_boundaries rows (mtfcc=X0011, state='06', WGS-84)
  - City of Sacramento government row (geo_id='0664000', type=LOCAL, state=CA)
  - 2 chambers: Mayor (Mayor of Sacramento) + City Council (Sacramento City Council)
  - 8 LOCAL districts: sacramento-council-district-{1-8} in essentials.districts (state=CA)
  - 1 LOCAL_EXEC district: geo_id='0664000', Sacramento (Citywide), state=CA
  - Migration 219 applied to production Supabase
affects: [66-02, 66-03, phase-69-elections]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ArcGIS MapServer loader (saccounty.net endpoint, DISTNUM field, outSR=4326 required)
    - X0011 MTFCC claimed for Sacramento council districts (sequential: X0010=SJ, X0011=Sacramento)
    - Two-round runoff note in migration (no RCV TODO until initiative passes)

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-sacramento-council-boundaries.ts
    - C:/EV-Accounts/backend/scripts/smoke-sacramento-geofences.ts
    - C:/EV-Accounts/backend/migrations/219_sacramento_government_structure.sql
  modified:
    - .planning/phases/66-sacramento-deep-seed/66-CONTEXT.md (LF normalization only)

key-decisions:
  - "X0011 claimed for Sacramento council districts (next available after SJ=X0010)"
  - "MTFCC field is DISTNUM in Sacramento ArcGIS source (not DISTRICTINT like SJ)"
  - "Sacramento ArcGIS source at mapservices.gis.saccounty.net/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5"
  - "2 chambers only: Mayor + City Council; City Attorney/Auditor/Treasurer/Clerk all appointed"
  - "No RCV comment in migration; Sacramento uses two-round runoff; Better Ballot Sacramento initiative not yet on ballot as of 2026-05-23"
  - "Sacramento City Hall (-121.4944, 38.5816) resolves to sacramento-council-district-4"

patterns-established:
  - "Sacramento ArcGIS source: mapservices.gis.saccounty.net (county portal hosts city layers)"
  - "DISTNUM field (not DISTRICTINT) for Sacramento council districts"

# Metrics
duration: 7min
completed: 2026-05-23
---

# Phase 66 Plan 01: Sacramento Government Structure Summary

**8 Sacramento council district geofences (X0011) loaded from saccounty.net ArcGIS, smoke tested, and migration 219 applied creating City of Sacramento government with 2 chambers and 9 districts**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-23T17:08:23Z
- **Completed:** 2026-05-23T17:15:25Z
- **Tasks:** 2
- **Files modified:** 3 created + 1 modified

## Accomplishments
- Loaded 8 Sacramento council district geofences from Sacramento County ArcGIS (MapServer/5) — WGS-84 coordinates verified, all 8 districts inserted with mtfcc=X0011, state='06'
- Smoke test passed all 3 gates: count=8, Sacramento City Hall resolves to District 4, San Jose City Hall returns 0 rows
- Migration 219 applied: 1 government (City of Sacramento, geo_id='0664000'), 2 chambers (Mayor + City Council), 8 LOCAL districts, 1 LOCAL_EXEC district

## Task Commits

Each task was committed atomically:

1. **Task 1: Load Sacramento council district geofences** - `8d63d41` (feat)
2. **Task 2: Smoke test + migration 219** - `cde30be` (feat)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/load-sacramento-council-boundaries.ts` - ArcGIS loader for 8 Sacramento council district boundaries; DISTNUM field; X0011 MTFCC; outSR=4326 required
- `C:/EV-Accounts/backend/scripts/smoke-sacramento-geofences.ts` - 3-gate smoke test: count, City Hall hit, SJ negative
- `C:/EV-Accounts/backend/migrations/219_sacramento_government_structure.sql` - Migration creating government/chambers/districts for Sacramento; WHERE NOT EXISTS idempotency guards
- `.planning/phases/66-sacramento-deep-seed/66-CONTEXT.md` - LF line ending normalization (no content change)

## Decisions Made
- ArcGIS source at `mapservices.gis.saccounty.net` (Sacramento County GIS portal hosts City of Sacramento layers at MapServer/5)
- District number field is `DISTNUM` in Sacramento source (SJ uses `DISTRICTINT`, Fremont uses `DISTRICT` — each city differs)
- COUNCIL field in Sacramento source holds council member names — not used for boundary name (changes with elections)
- X0011 claimed for Sacramento council districts, continuing sequential pattern (X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont, X0009=Berkeley, X0010=SJ, X0011=Sacramento)
- Migration uses two-round runoff comment (not RCV TODO) because Better Ballot Sacramento initiative was still collecting signatures as of 2026-05-23, not yet on ballot
- Exactly 2 chambers: City Attorney, Auditor, Treasurer, and Clerk are all appointed per Sacramento City Charter (confirmed by appointment records)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The ArcGIS endpoint returned all 8 features in correct WGS-84 coordinates on first attempt (outSR=4326 was included in the URL). Pre-existing split-section detector rows (CA and TX counties) were confirmed as pre-existing artifacts unrelated to migration 219.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Geofences ready: any Sacramento address can now be matched against 8 council district boundaries
- Government structure ready: plan 66-02 can seed all 9 politicians (Mayor Kevin McCarty + 8 Council Members) with office rows linked to the City of Sacramento government
- Chamber IDs for Mayor and City Council can be retrieved by: `SELECT id, name FROM essentials.chambers c JOIN essentials.governments g ON c.government_id = g.id WHERE g.name = 'City of Sacramento'`
- No blockers

---
*Phase: 66-sacramento-deep-seed*
*Completed: 2026-05-23*
