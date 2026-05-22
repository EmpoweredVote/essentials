---
phase: 65-sd-deep-seed
plan: "01"
subsystem: essentials-data
tags: [postgis, arcgis, geofences, san-diego, government-structure, migrations]

# Dependency graph
requires:
  - phase: 57-ca-tiger-geofences
    provides: SD city TIGER boundary (geo_id='0666000', G4110) already in geofence_boundaries
provides:
  - 9 SD council district boundary polygons (X0007) in geofence_boundaries
  - SD government row (City of San Diego, LOCAL, CA, geo_id='0666000')
  - 3 chambers: City Council, Mayor, City Attorney under SD government
  - 9 LOCAL district rows (sd-council-district-1 through 9) in essentials.districts
  - 1 LOCAL_EXEC district row (geo_id='0666000') for citywide offices
affects:
  - 65-02 (SD officials seed — consumes chambers + district rows; external_id range -651000..-650000 confirmed clear)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ArcGIS MapServer loader with outSR=4326 for State Plane feet -> WGS84 conversion (X0007 variant)"
    - "WHERE NOT EXISTS idempotency for governments + districts (no unique constraints on those tables)"
    - "Per-chamber rows for citywide elected offices (Mayor + City Attorney) per SF 198 pattern"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-sd-council-boundaries.ts
    - C:/EV-Accounts/backend/scripts/smoke-sd-geofences.ts
    - C:/EV-Accounts/backend/migrations/207_sd_government_structure.sql
  modified: []

key-decisions:
  - "mtfcc=X0007 claimed for SD council districts (X0005=LA County supervisors, X0006=SF supervisors)"
  - "DISTRICT integer field used for boundary name (not NAME field which holds council member name — changes with elections)"
  - "SD City Hall resolves to sd-council-district-3 (District 3 — Stephen Whitburn); confirmed by smoke test"
  - "SD government UUID: 7efdfa12-88b2-482d-9379-84a7341bebc5"
  - "Next migration is 208"

patterns-established:
  - "ArcGIS outSR=4326 pattern: always required for webmaps.sandiego.gov (State Plane WKID 2230, feet); DO NOT omit"

# Metrics
duration: 5min
completed: 2026-05-22
---

# Phase 65 Plan 01: San Diego Government Structure Summary

**9 SD council district geofences (X0007) loaded from DoIT ArcGIS + government/chamber/district scaffold via migration 207; City Hall routes to District 3**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-22T18:20:01Z
- **Completed:** 2026-05-22T18:24:34Z
- **Tasks:** 3
- **Files modified:** 3 (all in C:/EV-Accounts/backend, outside essentials git repo)

## Accomplishments

- Loaded 9 SD council district polygons (post-2022 redistricting) from webmaps.sandiego.gov ArcGIS MapServer into essentials.geofence_boundaries with mtfcc='X0007', state='06'
- Applied migration 207 creating SD government row, 3 chambers (City Council, Mayor, City Attorney), 9 LOCAL district rows, and 1 LOCAL_EXEC citywide district
- Smoke test (3 gates) passed: count=9, City Hall -> District 3, Tijuana -> 0 rows (no false positive)

## Loader Run Output

**First run (live):**
```
Pre-flight: X0007 is unclaimed — proceeding
Received 9 features
Available fields: DISTRICT, NAME
District 2: found ... District 5: found (all 9 mapped)
Inserted: District 1 ... Inserted: District 9
Summary: Inserted: 9 / Skipped: 0
Total SD council district rows in geofence_boundaries: 9
All 9 SD council districts loaded successfully.
```

**Second run (idempotency):**
```
Pre-flight: X0007 has 9 existing SD rows — re-run OK
Skipped (already exists): District 1 ... District 9
Summary: Inserted: 0 / Skipped: 9
```

## Pre-flight Results

**X0007 mtfcc (before first run):** 0 rows — unclaimed, safe to use

**external_id range -651000 to -650000:** 0 rows — clear for plan 65-02 use

## Centroid Spot-check (WGS84 degrees confirmed)

```
geo_id=sd-council-district-1
centroid=POINT(-117.22692374468735 32.90431361404923)
```
Longitude near -117, latitude near 32-33 — confirms outSR=4326 worked correctly (NOT six-digit feet values).

## Migration 207 Gate Results

**Gate A (government row):**
```json
[{"id": "7efdfa12-88b2-482d-9379-84a7341bebc5", "name": "City of San Diego",
  "type": "LOCAL", "state": "CA", "geo_id": "0666000"}]
```

**Gate B (3 chambers):**
```json
[{"name": "City Attorney", "name_formal": "San Diego City Attorney"},
 {"name": "City Council",  "name_formal": "San Diego City Council"},
 {"name": "Mayor",         "name_formal": "Mayor of San Diego"}]
```

**Gate C (council district count):** 9

**Gate D (citywide district):**
```json
[{"geo_id": "0666000", "district_type": "LOCAL_EXEC"}]
```

**Gate E (idempotency):** Re-applied with no errors; governments=1, chambers=3, council districts=9 (no duplicates).

## Smoke Test Output

```
=== SC1: SD council district boundary count ===
  SD council district rows: 9
  SC1: PASS (9 rows)

=== SC2: San Diego City Hall (-117.1546, 32.7157) ===
  Rows returned: 1
  district: geo_id=sd-council-district-3  name=District 3
  SC2: PASS (SD City Hall → sd-council-district-3 / District 3)

=== SC3: Tijuana, Mexico (-117.0382, 32.5149) ===
  Rows returned: 0
  SC3: PASS (Tijuana returns 0 rows — no false positive)

=== Smoke Test Results ===
ALL ASSERTIONS PASSED

Phase 65-01 smoke test success criteria:
  SC1: 9 SD council district rows in geofence_boundaries (X0007) [PASS]
  SC2: San Diego City Hall resolves to exactly 1 council district [PASS]
  SC3: Tijuana returns 0 SD council district rows (no false positive) [PASS]
```

**SD City Hall resolved to: sd-council-district-3 (District 3 — Stephen Whitburn)** — use this in 65-02 routing verification.

## Task Commits

Tasks 1-3 had no committable files in the essentials git repo (all scripts/migrations live in C:/EV-Accounts/backend which is not a git repo).

**Plan metadata:** (this commit)

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/load-sd-council-boundaries.ts` — ArcGIS GeoJSON loader for 9 SD council districts (outSR=4326, X0007, idempotent)
- `C:/EV-Accounts/backend/scripts/smoke-sd-geofences.ts` — 3-gate smoke test (count, City Hall positive, Tijuana negative)
- `C:/EV-Accounts/backend/migrations/207_sd_government_structure.sql` — Government + chambers + 10 district rows (WHERE NOT EXISTS, applied to live DB)

## Decisions Made

- **X0007 claimed for SD council districts.** Previous MTFCC assignments: X0005=LA County supervisors (5 districts), X0006=SF supervisors (11 districts). X0007 is the next sequential value and does not conflict.
- **DISTRICT field (integer) used for geoId, not NAME field** — NAME holds the council member's current name (e.g. "Joe LaCava") which changes with elections. Using NAME would require re-loading boundaries on every election cycle.
- **SD government UUID captured**: 7efdfa12-88b2-482d-9379-84a7341bebc5 — use subquery by name in future migrations, not hardcoded UUID.
- **Per-chamber rows for Mayor and City Attorney** — mirrors SF 198 pattern; separates citywide elected offices from the district-based City Council chamber.

## Deviations from Plan

None — plan executed exactly as written. Pre-flight checks passed before first operation. All 3 tasks completed successfully without deviation.

## Issues Encountered

None. The webmaps.sandiego.gov ArcGIS endpoint returned all 9 districts cleanly. The DISTRICT integer field was present and correct. outSR=4326 worked as expected. Migration 207 applied without conflict.

## Next Phase Readiness

- 65-02 (SD officials seed) is ready to proceed:
  - 9 LOCAL district rows exist (sd-council-district-{1-9}) for council member offices
  - 1 LOCAL_EXEC district row exists (geo_id='0666000') for Mayor + City Attorney offices
  - 3 chambers created (City Council, Mayor, City Attorney) — use WHERE name=... AND government_id=... to get IDs
  - external_id range -651000 to -650000 confirmed clear for 65-02 use
  - SD City Hall routing confirmed: -> sd-council-district-3 (District 3) — use in 65-02 routing verification
  - Next migration is 208

---
*Phase: 65-sd-deep-seed*
*Completed: 2026-05-22*
