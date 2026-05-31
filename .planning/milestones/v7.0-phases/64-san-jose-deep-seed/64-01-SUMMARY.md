---
phase: 64-san-jose-deep-seed
plan: 01
subsystem: database
tags: [postgis, arcgis, geofences, san-jose, government-structure, migrations]

# Dependency graph
requires:
  - phase: 57-tiger-boundaries
    provides: SJ city boundary geo_id='0668000' already loaded as G4110 TIGER row
  - phase: 68-berkeley-deep-seed
    provides: ArcGIS outSR=4326 loader pattern (load-fremont/berkeley) + government structure migration pattern (213)
provides:
  - 10 SJ council district geofences in geofence_boundaries (mtfcc=X0010, state='06')
  - load-sj-council-boundaries.ts ArcGIS loader script
  - smoke-sj-geofences.ts smoke test (SC1/SC2/SC3 all pass)
  - essentials.governments row: City of San Jose (geo_id='0668000')
  - 2 chambers: Mayor of San Jose + San Jose City Council
  - 10 LOCAL districts: sj-council-district-1..10 (state='CA')
  - 1 LOCAL_EXEC district: geo_id='0668000' (San Jose Citywide)
affects: [64-02-sj-officials, 64-03-sj-headshots, 69-landing-elections-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ArcGIS MapServer loader with outSR=4326 (State Plane CA Zone 3 WKID 102643 → WGS84)
    - DISTRICTINT integer field parsing (SJ-specific field name vs DISTRICT in Fremont)
    - WHERE NOT EXISTS guards for governments + districts (no unique constraints)
    - Chambers slug is GENERATED — never include in INSERT columns

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-sj-council-boundaries.ts
    - C:/EV-Accounts/backend/scripts/smoke-sj-geofences.ts
    - C:/EV-Accounts/backend/migrations/217_sj_government_structure.sql
  modified: []

key-decisions:
  - "MTFCC X0010 claimed for SJ council districts (X0009=Berkeley, X0008=Fremont)"
  - "City Attorney and City Auditor are APPOINTED — no chambers for either (SJ Charter confirmed)"
  - "Only 2 chambers: Mayor + City Council (vs Berkeley's 3 with City Auditor)"
  - "Migration 217 used (215=Berkeley headshots, 216=SF stances — both taken)"
  - "ArcGIS field is DISTRICTINT (integer) not DISTRICT — different from Fremont"

patterns-established:
  - "SJ ArcGIS endpoint: geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120"
  - "Pre-flight guard: assert X0010 is unclaimed or only has sj-council-district rows"
  - "geo_id format: sj-council-district-{N} (N=1..10)"

# Metrics
duration: 5min
completed: 2026-05-23
---

# Phase 64 Plan 01: San Jose Deep Seed - Geofences + Government Structure Summary

**10 SJ council district geofences loaded via ArcGIS (X0010) + migration 217 creating government row, Mayor + City Council chambers, and 11 districts (10 LOCAL + 1 LOCAL_EXEC)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-23T07:14:26Z
- **Completed:** 2026-05-23T07:19:44Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Inserted 10 `sj-council-district-{1..10}` rows into `essentials.geofence_boundaries` (mtfcc=X0010, state='06')
- Smoke test: SC1 (10 rows), SC2 (SJ City Hall → sj-council-district-3), SC3 (Oakland → 0 rows) — all PASS
- Migration 217 applied: 1 government + 2 chambers + 10 LOCAL districts + 1 LOCAL_EXEC district
- Section-split detector: 0 rows (clean before officials seeded)

## Task Commits

Each task was committed atomically:

1. **Task 1: Load SJ council district geofences** - `340c313` (feat)
2. **Task 2: Apply migration 217 — SJ government structure** - `e65adb7` (feat)

**Plan metadata:** see final commit below

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/load-sj-council-boundaries.ts` - ArcGIS loader; fetches 10 districts from geo.sanjoseca.gov; DISTRICTINT field; outSR=4326 required; X0010 pre-flight guard
- `C:/EV-Accounts/backend/scripts/smoke-sj-geofences.ts` - Phase 64-01 smoke test; SC1 (10 rows), SC2 (City Hall → D3), SC3 (Oakland → 0)
- `C:/EV-Accounts/backend/migrations/217_sj_government_structure.sql` - Government + 2 chambers + 11 districts; WHERE NOT EXISTS guards; no City Attorney/City Auditor chambers

## Decisions Made
- **No City Attorney or City Auditor chambers:** Both are appointed by the City Council per the San Jose City Charter. The plan explicitly called this out; confirmed via RESEARCH.md cross-referencing Wikipedia and the Charter.
- **Migration 217 (not 215/216):** RESEARCH.md flagged that 215=Berkeley headshots and 216=SF stances are already taken. Verified before writing.
- **ArcGIS field is DISTRICTINT:** SJ uses `DISTRICTINT` (integer) rather than `DISTRICT` — plan specified this explicitly. Dry-run confirmed field name returned in `Available fields: DISTRICTINT, COUNCILMEMBER`.
- **outSR=4326 retained:** Native CRS is WKID 102643 (State Plane CA Zone 3, feet). Smoke test SC2 confirms correct WGS84 storage — SJ City Hall correctly resolves to sj-council-district-3.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. ArcGIS endpoint returned all 10 features cleanly on first fetch. Pre-flight confirmed X0010 unclaimed. Migration applied idempotently on first run.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- **Plan 64-02 (SJ Officials):** All prerequisites met. `essentials.districts` rows for sj-council-district-1..10 and geo_id='0668000' (LOCAL_EXEC) now exist. External ID range -640001..-640019 confirmed clear. Mayor + City Council chambers ready to receive office rows.
- **No blockers.**

---
*Phase: 64-san-jose-deep-seed*
*Completed: 2026-05-23*
