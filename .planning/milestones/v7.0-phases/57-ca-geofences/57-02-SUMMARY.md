---
phase: 57-ca-geofences
plan: 02
subsystem: database
tags: [postgis, geofence, california, tiger, point-in-polygon, smoke-test]

# Dependency graph
requires:
  - phase: 57-01
    provides: CA county (G4020) + CCD (G4040) TIGER rows loaded; 7 v7.0 target city geo_ids confirmed
provides:
  - Point-in-polygon smoke test (smoke-ca-geofences.ts) confirming CA geofence routing works end-to-end
  - Confirmed G4040 unincorporated routing for East LA (no G4110 false-positive)
  - Confirmed SF consolidated city-county returns both G4110 + G4020
  - All 7 v7.0 target city geo_ids verified against production DB
affects:
  - phases 63-68 (v7.0 CA city government ingestion — use geo_ids from this summary)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CA geofence smoke test pattern: pg Client + dotenv + expectedMtfcc + forbiddenMtfcc assertions + process.exit(1) on failure"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts
  modified: []

key-decisions:
  - "San Diego Balboa Park returns CD-50 (not CD-51 as plan estimated) — actual TIGER geometry is authoritative; no correction needed"
  - "East LA primary coordinate (-118.1720, 34.0239) worked without fallback — no G4110 returned"
  - "SF City Hall also returned G4040 (Downtown-Northeast CCD) and G5420 (school district) — extra rows are harmless, assertions only check expectedMtfcc subset"

patterns-established:
  - "CA smoke test pattern: 3 representative addresses (consolidated city-county, incorporated city, unincorporated CCD) cover all routing edge cases"

# Metrics
duration: 15min
completed: 2026-05-21
---

# Phase 57 Plan 02: CA Geofences Smoke Test Summary

**PostGIS point-in-polygon routing confirmed for 3 CA addresses across all 5+ tiers; all 4 Phase 57 success criteria pass; 7 v7.0 target city geo_ids verified in production**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-21T15:10:00Z
- **Completed:** 2026-05-21T15:22:33Z
- **Tasks:** 2
- **Files modified:** 1 (created smoke-ca-geofences.ts)

## Accomplishments

- Wrote `smoke-ca-geofences.ts` following the smoke-me-geofences.ts pattern with self-asserting exit codes
- Ran the smoke test against production DB — all assertions passed, exit 0
- Confirmed all 4 Phase 57 roadmap success criteria TRUE
- All 7 v7.0 target city geo_ids verified against production DB

## Task Commits

Each task was committed atomically:

1. **Task 1: Write smoke-ca-geofences.ts** - (chore, EV-Accounts — not in essentials git)
2. **Task 2: Run smoke test and confirm success criteria** - (documented in planning commit)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts` - Self-asserting CA geofence smoke test; 3 addresses + target city lookup; exits 0 on pass, 1 on failure

## Full Smoke Test Output

```
=== SC3: Layer counts for state='06' ===
  G4020: 58 rows
  G4040: 404 rows
  G4110: 482 rows
  G5200: 52 rows
  G5210: 40 rows
  G5220: 80 rows
  SC3: All layer counts OK

=== SF City Hall (consolidated city-county) (-122.4191, 37.7792) ===
  G4020  geo_id=06075  name=San Francisco County
  G4040  geo_id=0607590734  name=Downtown-Northeast Neighborhoods-Treasure Island CCD
  G4110  geo_id=0667000  name=San Francisco city
  G5200  geo_id=0611  name=Congressional District 11
  G5210  geo_id=06011  name=State Senate District 11
  G5220  geo_id=06017  name=Assembly District 17
  G5420  geo_id=0634410  name=San Francisco Unified School District
  OK: G4110 geo_id=0667000 (San Francisco city)
  OK: G4020 geo_id=06075 (San Francisco County)

=== San Diego Balboa Park (incorporated city) (-117.1425, 32.7308) ===
  G4020  geo_id=06073  name=San Diego County
  G4040  geo_id=0607392780  name=San Diego CCD
  G4110  geo_id=0666000  name=San Diego city
  G5200  geo_id=0650  name=Congressional District 50
  G5210  geo_id=06039  name=State Senate District 39
  G5220  geo_id=06078  name=Assembly District 78
  G5420  geo_id=0634320  name=San Diego City Unified School District
  OK: G4110 geo_id=0666000 (San Diego city)
  OK: G4020 geo_id=06073 (San Diego County)

=== East Los Angeles (unincorporated CCD) (-118.172, 34.0239) ===
  G4020  geo_id=06037  name=Los Angeles County
  G4040  geo_id=0603793155  name=South Gate-East Los Angeles CCD
  G5200  geo_id=0634  name=Congressional District 34
  G5210  geo_id=06026  name=State Senate District 26
  G5220  geo_id=06052  name=Assembly District 52
  G5420  geo_id=0622710  name=Los Angeles Unified School District
  OK: G4020 geo_id=06037 (Los Angeles County)

=== v7.0 Target City geo_id Lookup (G4110) ===
  Found 7 of 7 expected target cities:
  [OK] Berkeley city: geo_id=0606000
  [OK] Fremont city: geo_id=0626000
  [OK] Los Angeles city: geo_id=0644000
  [OK] Sacramento city: geo_id=0664000
  [OK] San Diego city: geo_id=0666000
  [OK] San Francisco city: geo_id=0667000
  [OK] San Jose city: geo_id=0668000

=== Smoke Test Results ===
ALL ASSERTIONS PASSED

Phase 57 roadmap success criteria:
  SC1: SF City Hall returns G4110 (0667000) + G4020 (06075) + G5200 + G5210 + G5220 [PASS]
  SC2: East LA returns G4040 + G4020 + G5200 + G5210 + G5220; NO G4110 [PASS]
  SC3: All 52 CD + 40 senate + 80 assembly + 58 counties present [PASS]
  SC4: 3 addresses each return non-NULL names across all tiers [PASS]
```

## Phase 57 Roadmap Success Criteria Confirmation

| Criterion | Status | Evidence |
|-----------|--------|---------|
| SC1: SF consolidated city-county returns G4110 + G4020 | PASS | G4110 geo_id=0667000 (SF city) + G4020 geo_id=06075 (SF County) both returned |
| SC2: East LA (unincorporated) returns G4040, no G4110 | PASS | G4040 geo_id=0603793155 (South Gate-East LA CCD); no G4110 row returned |
| SC3: All layer counts correct | PASS | 52 CD + 40 senate + 80 assembly + 58 counties + 482 cities + 404 CCDs |
| SC4: 3 addresses return non-NULL names across all tiers | PASS | All 3 addresses: all name fields populated |

## v7.0 Target City geo_id Reference Table

**For Phases 63-68 to consume — geo_ids verified against production DB 2026-05-21:**

| City | Name in DB | geo_id (G4110) |
|------|-----------|---------------|
| San Francisco | San Francisco city | 0667000 |
| Los Angeles | Los Angeles city | 0644000 |
| San Jose | San Jose city | 0668000 |
| San Diego | San Diego city | 0666000 |
| Sacramento | Sacramento city | 0664000 |
| Fremont | Fremont city | 0626000 |
| Berkeley | Berkeley city | 0606000 |

## Address Routing Results

### SF City Hall (lon=-122.4191, lat=37.7792)
Consolidated city-county edge case — returns BOTH city (G4110) and county (G4020):

| MTFCC | geo_id | name |
|-------|--------|------|
| G4020 | 06075 | San Francisco County |
| G4040 | 0607590734 | Downtown-Northeast Neighborhoods-Treasure Island CCD |
| G4110 | 0667000 | San Francisco city |
| G5200 | 0611 | Congressional District 11 |
| G5210 | 06011 | State Senate District 11 |
| G5220 | 06017 | Assembly District 17 |
| G5420 | 0634410 | San Francisco Unified School District |

### San Diego Balboa Park (lon=-117.1425, lat=32.7308)
Incorporated city in a non-consolidated county:

| MTFCC | geo_id | name |
|-------|--------|------|
| G4020 | 06073 | San Diego County |
| G4040 | 0607392780 | San Diego CCD |
| G4110 | 0666000 | San Diego city |
| G5200 | 0650 | Congressional District 50 |
| G5210 | 06039 | State Senate District 39 |
| G5220 | 06078 | Assembly District 78 |
| G5420 | 0634320 | San Diego City Unified School District |

Note: Plan estimated CD-51 for this location; actual TIGER geometry returns CD-50. Coordinates are at Balboa Park which straddles the CD-50/CD-51 boundary.

### East Los Angeles (lon=-118.1720, lat=34.0239) — Primary coordinate, no fallback needed
Unincorporated CCD — returns G4040, correctly returns NO G4110:

| MTFCC | geo_id | name |
|-------|--------|------|
| G4020 | 06037 | Los Angeles County |
| G4040 | 0603793155 | South Gate-East Los Angeles CCD |
| G5200 | 0634 | Congressional District 34 |
| G5210 | 06026 | State Senate District 26 |
| G5220 | 06052 | Assembly District 52 |
| G5420 | 0622710 | Los Angeles Unified School District |

## Coordinate Fallbacks Used

None — East LA primary coordinate (-118.1720, 34.0239) returned no G4110, so fallback (-118.1629, 34.0214) was not needed.

## Decisions Made

- San Diego Balboa Park returns CD-50 (not CD-51 as the plan noted for "CD-51 area") — TIGER geometry is authoritative; this is not a data error
- SF City Hall also returns G4040 and G5420 (extra rows) — assertions only check that expected MTFCC codes are present, so extra rows pass correctly
- EV-Accounts is not a git repo, so smoke-ca-geofences.ts is tracked via the planning/docs commit in the essentials repo

## Deviations from Plan

None — plan executed exactly as written. All 4 success criteria passed on first run.

## Known Issues Carried Forward

- **districts.state casing inconsistency**: 3 pre-existing LA County rows with `state='CA'` (uppercase, pre-Phase 57); new 57 county rows landed as `state='ca'` (lowercase, loader abbrev). Total 60 rows, 58 distinct counties. This is a pre-existing data quality issue — document but do not fix in Phase 57 scope. Flagged for future cleanup.

## Issues Encountered

None.

## Next Phase Readiness

Phase 57 complete. All CA geofence data is loaded and routing is confirmed working. Ready for:
- Phase 58: LAUSD sub-district geofences (from CA backlog)
- Phases 63-68: v7.0 CA city government ingestion — use the geo_id reference table above

The 7 v7.0 target city geo_ids are now definitive references for downstream phases.

---
*Phase: 57-ca-geofences*
*Completed: 2026-05-21*
