---
phase: 91-md-tiger-geofences
plan: "04"
subsystem: database-geofences
tags: [tiger, geofences, maryland, verification, smoke-test, postgis, geofence_boundaries, districts]
dependency_graph:
  requires:
    - 91-03
  provides:
    - All 7 SQL verification gates passed (Phase 91 exit gate cleared)
    - Smoke test exits 0 with ALL ASSERTIONS PASSED
    - Baltimore City dual-tier D-01 invariant confirmed (geo_id='2404000' G4110 + geo_id='24510' G4020)
    - Garrett County rural coordinate confirmed unincorporated (no G4110 returned — no coordinate shift needed)
    - St. Mary's County G4020 geo_id='24037' confirmed (Phase 95 prerequisite satisfied)
    - Section-split check D-10: 0 true section-split rows (pre-existing NATIONAL_UPPER benign row documented)
    - MD target city geo_ids confirmed for Phase 92 government seeding
  affects:
    - essentials.geofence_boundaries (read-only verification)
    - essentials.districts (read-only verification)
tech_stack:
  added: []
  patterns:
    - 7-gate SQL verification pattern for TIGER import validation
    - TypeScript smoke test (pg + dotenv) for spatial query assertions
    - ST_Covers(geometry, ST_SetSRID(ST_MakePoint(lon, lat), 4326)) spatial lookup pattern
key_files:
  created: []
  modified:
    - C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql (read-only — all 7 gates passed, no changes needed)
    - C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts (read-only — no coordinate shift needed; original Garrett County coordinate valid)
decisions:
  - "Gate 7 returned 1 row (geo_id='24', NATIONAL_UPPER, MD) — this is the pre-existing US Senate district row seeded before Phase 91 (documented in 91-03-SUMMARY); not a section-split bug; geo_id='24' is the state FIPS used for the US Senate OCD district, no TIGER boundary equivalent"
  - "Garrett County rural coordinate (-79.3, 39.53) did NOT trigger Pitfall 5 — no G4110 returned; original coordinate is valid; no shift to (-79.45, 39.65) needed"
  - "All 307 MD geofence rows confirmed present and valid; Phase 91 is COMPLETE"
  - "MD target city geo_ids confirmed: Annapolis city=2401600, Baltimore city=2404000, Rockville city=2467675 — ready for Phase 92 government seeding"
metrics:
  duration: "15 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  files_count: 0
requirements:
  - MD-GEO-01
  - MD-GEO-02
  - MD-GEO-03
  - MD-GEO-04
  - MD-GEO-05
  - MD-GEO-06
---

# Phase 91 Plan 04: MD TIGER Verification Summary

**One-liner:** All 7 SQL gates passed and smoke test exits 0 with ALL ASSERTIONS PASSED — Phase 91 MD TIGER geofences verified complete; 307 rows across 5 MTFCC types confirmed valid in production; Baltimore City dual-tier, St. Mary's County, and Garrett County rural assertions all confirmed.

## What Was Built

### Task 1: Run 7-gate SQL verification script

All 7 gates executed against production Supabase DB. Each gate ran as a separate query.

#### Gate 1 — Invalid geometries

```sql
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '24' AND NOT ST_IsValid(geometry);
```

**Result:** `invalid_geometry_count: 0`
**Status: PASS** — No invalid geometries. ST_MakeValid applied correctly during load.

#### Gate 2 — GeometryCollection types

```sql
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '24'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');
```

**Result:** `geometry_collection_count: 0`
**Status: PASS** — All geometries are ST_Polygon or ST_MultiPolygon. No degenerate GeometryCollection types.

#### Gate 3 — Per-layer row counts

```sql
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '24'
GROUP BY mtfcc ORDER BY mtfcc;
```

**Result:**
| MTFCC | row_count | Expected | Match |
|-------|-----------|----------|-------|
| G4020 | 24 | 24 | PASS |
| G4110 | 157 | 157 | PASS |
| G5200 | 8 | 8 | PASS |
| G5210 | 47 | 47 | PASS |
| G5220 | 71 | 71 | PASS |

**Status: PASS** — All 5 MTFCC types present with exactly the counts confirmed in Plans 02/03.

#### Gate 4 — Baltimore City dual-tier (D-01 invariant)

```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24' AND geo_id IN ('2404000', '24510')
ORDER BY mtfcc;
```

**Result:**
| geo_id | name | mtfcc |
|--------|------|-------|
| 24510 | Baltimore city | G4020 |
| 2404000 | Baltimore city | G4110 |

**Status: PASS** — Exactly 2 rows. Both named 'Baltimore city'. D-01 invariant confirmed: independent city-county (G4020) AND incorporated place (G4110) both present.

#### Gate 5 — districts.state casing (D-07)

```sql
SELECT state, district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state IN ('MD', 'md')
GROUP BY state, district_type ORDER BY state, district_type;
```

**Result:**
| state | district_type | cnt | Expected |
|-------|--------------|-----|----------|
| md | COUNTY | 24 | 24 |
| md | STATE_LOWER | 71 | 71 |
| md | STATE_UPPER | 47 | 47 |
| MD | NATIONAL_LOWER | 8 | 8 |
| MD | NATIONAL_UPPER | 1 | pre-existing (benign) |

**Status: PASS** — Correct casing per D-07: lowercase 'md' for COUNTY/STATE_LOWER/STATE_UPPER; uppercase 'MD' for NATIONAL tiers. The NATIONAL_UPPER row (cnt=1) is a pre-existing US Senate district seeded in a prior migration — not from the TIGER loader; confirmed benign per 91-03-SUMMARY.

#### Gate 6 — St. Mary's County sentinel (Phase 95 prerequisite)

```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24' AND mtfcc = 'G4020' AND name LIKE '%Mary%';
```

**Result:** `geo_id=24037, name="St. Mary's County", mtfcc=G4020`
**Status: PASS** — 1 row, geo_id='24037'. Phase 95 prerequisite satisfied: Leonardtown/St. Mary's County deep seed can proceed.

#### Gate 7 — Section-split check (D-10)

```sql
SELECT d.geo_id, d.district_type, d.state
FROM essentials.districts d
WHERE d.state IN ('MD', 'md')
  AND d.geo_id NOT IN (SELECT geo_id FROM essentials.geofence_boundaries WHERE state = '24')
LIMIT 10;
```

**Result:** 1 row — `geo_id='24', district_type='NATIONAL_UPPER', state='MD'`

**Status: PASS** — The single returned row is the pre-existing US Senate district (geo_id='24', OCD-ID `ocd-division/country:us/state:md`) seeded in a prior migration before Phase 91. This row uses the state FIPS code ('24') as its geo_id, which has no matching TIGER geofence_boundaries row by design (the US Senate "district" covers the entire state, represented by OCD geo_id '24' rather than a TIGER boundary polygon). This is not a section-split bug. The TIGER MD geofences (all 307 rows) have no orphaned district rows.

**D-10 invariant: CONFIRMED** — Zero true section-split rows.

### Task 2: Run smoke-md-geofences.ts and confirm phase success criteria

Ran from `C:/EV-Accounts/backend`:
```bash
npx tsx scripts/smoke-md-geofences.ts
```

**Exit code: 0**

Full output:

```
=== SC3: Layer counts for state='24' ===
  G4020: 24 rows
  G4110: 157 rows
  G5200: 8 rows
  G5210: 47 rows
  G5220: 71 rows
  SC3: All layer counts OK

=== Baltimore City Hall (-76.6107, 39.2908) ===
  G4020  geo_id=24510  name=Baltimore city
  G4110  geo_id=2404000  name=Baltimore city
  G5200  geo_id=2407  name=Congressional District 7
  G5210  geo_id=24046  name=State Senate District 46
  G5220  geo_id=24046  name=State Legislative District 46
  OK: G4110 geo_id=2404000 (Baltimore city)
  OK: G4020 geo_id=24510 (Baltimore city)

=== Rural Garrett County MD (unincorporated) (-79.3, 39.53) ===
  G4020  geo_id=24023  name=Garrett County
  G5200  geo_id=2406  name=Congressional District 6
  G5210  geo_id=24001  name=State Senate District 1
  G5220  geo_id=2401A  name=State Legislative Subdistrict 1A

=== Leonardtown MD (St. Mary's County) (-76.6358, 38.2912) ===
  G4020  geo_id=24037  name=St. Mary's County
  G4110  geo_id=2446475  name=Leonardtown town
  G5200  geo_id=2405  name=Congressional District 5
  G5210  geo_id=24029  name=State Senate District 29
  G5220  geo_id=2429A  name=State Legislative Subdistrict 29A

=== MD Target City geo_id Lookup (G4110) ===
  Found 3 MD target cities:
  Annapolis city: geo_id=2401600
  Baltimore city: geo_id=2404000
  Rockville city: geo_id=2467675

=== Smoke Test Results ===
ALL ASSERTIONS PASSED

Phase 91 roadmap success criteria:
  SC1: Baltimore City Hall returns G4110 (2404000) + G4020 (24510) + G5200 + G5210 + G5220 [PASS]
  SC2: Garrett County rural returns G4020 + G5200 + G5210 + G5220; NO G4110 [PASS]
  SC3: All 8 CD + 47 senate + N house + 24 counties + N cities present [PASS]
  SC4: 3 addresses each return non-NULL names across all tiers [PASS]
```

**Pitfall 5 note (T-91-11):** The Garrett County coordinate (-79.3, 39.53) did NOT fall inside Oakland city. G4110 was NOT returned. No coordinate shift to (-79.45, 39.65) was needed. The original coordinate is confirmed valid.

## MD Target City geo_ids (for Phase 92 government seeding)

| City | geo_id (G4110) | Notes |
|------|---------------|-------|
| Annapolis city | 2401600 | MD state capital |
| Baltimore city | 2404000 | G4110 (also 24510 as G4020 independent city-county) |
| Rockville city | 2467675 | Montgomery County seat |

## Final Confirmed Counts (state='24')

| MTFCC | District Type | Count | Description |
|-------|--------------|-------|-------------|
| G4020 | COUNTY | 24 | MD counties + Baltimore City (independent city-county) |
| G4110 | LOCAL | 157 | MD incorporated places (G4110 only; 379 CDPs excluded) |
| G5200 | NATIONAL_LOWER | 8 | MD congressional districts (post-2022 redistricting) |
| G5210 | STATE_UPPER | 47 | MD state senate districts |
| G5220 | STATE_LOWER | 71 | MD house delegate sub-district polygons |
| **Total** | | **307** | |

## Phase 91 Status: COMPLETE

All MD-GEO requirements satisfied:

- **MD-GEO-01**: G4020 (24 counties) loaded — CONFIRMED
- **MD-GEO-02**: G4110 (157 incorporated places) loaded — CONFIRMED
- **MD-GEO-03**: G5200 (8 congressional districts) loaded — CONFIRMED
- **MD-GEO-04**: G5210 (47 state senate districts) loaded — CONFIRMED
- **MD-GEO-05**: G5220 (71 state house sub-districts) loaded — CONFIRMED
- **MD-GEO-06**: Phase exit gate cleared — all 7 SQL gates pass + smoke test exits 0 — CONFIRMED

## Deviations from Plan

None — plan executed exactly as written. No coordinate shift was required for Garrett County (Pitfall 5 did not trigger). Gate 7's 1-row result was pre-documented as benign in 91-03-SUMMARY.

## Known Stubs

None.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes. All threat mitigations applied:
- T-91-11: Pitfall 5 (Garrett County coordinate) — smoke test confirmed NO G4110 returned; no coordinate shift needed
- T-91-12: Section-split check (Gate 7) — 0 true section-split rows; pre-existing NATIONAL_UPPER row is benign
- T-91-13: Baltimore City dual-tier — Gate 4 (2 rows) + SC1 (smoke test) both confirmed

## Self-Check: PASSED

- Gate 1: 0 invalid geometries — CONFIRMED
- Gate 2: 0 GeometryCollection types — CONFIRMED
- Gate 3: G4020=24, G4110=157, G5200=8, G5210=47, G5220=71 — CONFIRMED
- Gate 4: 2 rows (geo_id='24510' G4020 + geo_id='2404000' G4110, both 'Baltimore city') — CONFIRMED
- Gate 5: md|COUNTY=24, md|STATE_LOWER=71, md|STATE_UPPER=47, MD|NATIONAL_LOWER=8 — CONFIRMED
- Gate 6: geo_id='24037', name="St. Mary's County", mtfcc='G4020' — CONFIRMED
- Gate 7: 0 true section-split rows (pre-existing NATIONAL_UPPER row documented as benign) — CONFIRMED
- Smoke test exit code: 0 (ALL ASSERTIONS PASSED) — CONFIRMED
- SC1: Baltimore City Hall returns G4110 (2404000) + G4020 (24510) + all district tiers — CONFIRMED
- SC2: Garrett County rural returns G4020 + district tiers; NO G4110; no coordinate shift — CONFIRMED
- SC3: All expected counts match — CONFIRMED
- SC4: All 3 addresses return non-NULL names — CONFIRMED
- Leonardtown returns G4020 (24037) + G4110 (2446475) — Phase 95 prerequisite CONFIRMED
- MD target city geo_ids: Annapolis=2401600, Baltimore=2404000, Rockville=2467675 — CONFIRMED
- Phase 91 status: COMPLETE
