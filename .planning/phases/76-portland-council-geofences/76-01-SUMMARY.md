---
phase: 76-portland-council-geofences
plan: "01"
subsystem: essentials-data
tags: [geofences, portland, oregon, arcgis, postgis, districts, council]
dependency_graph:
  requires: [phase-72-or-geofences, phase-73-or-chambers]
  provides: [portland-or-council-district-1, portland-or-council-district-2, portland-or-council-district-3, portland-or-council-district-4]
  affects: [essentials.geofence_boundaries, essentials.districts]
tech_stack:
  added: []
  patterns: [arcgis-per-objectid-fetch, st-makevalid-geometry-repair, where-not-exists-idempotency]
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts
    - C:/EV-Accounts/backend/scripts/smoke-portland-council-geofences.ts
    - C:/EV-Accounts/backend/migrations/229_portland_council_districts.sql
  modified: []
decisions:
  - "Portland City Hall resolves to District 4 (geo_id=portland-or-council-district-4)"
  - "ST_MakeValid required for Portland OR council districts — D1 and D4 have source GeoJSON self-intersections"
  - "X0012 MTFCC claimed for Portland OR council districts; next available is X0013"
  - "Migration 229 added to supabase_migrations.schema_migrations ledger (structural migration)"
metrics:
  duration: "11 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_changed: 3
---

# Phase 76 Plan 01: Portland OR Council District Geofences Summary

Loaded 4 Portland OR council district polygons from PortlandMaps ArcGIS MapServer Layer 17 into `essentials.geofence_boundaries` with `mtfcc='X0012'`; created 4 matching `essentials.districts` rows via migration 229; all 4 smoke test gates pass.

## Tasks Completed

### Task 1: load-portland-council-boundaries.ts + 4 districts loaded (commit c9c5162)

Created `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts` modeled on the Fremont loader analog with per-OBJECTID fetch loop (4 separate HTTP calls). Live run output:

```
[load-portland-council-boundaries] Fetching Portland OR City Council district boundaries
  Pre-flight: X0012 is unclaimed — proceeding

  Fetching OBJECTID=1: ...?where=OBJECTID%3D1&outFields=DISTRICT&outSR=4326&f=geojson
  Available fields: DISTRICT
  District 1: found (DISTRICT=1)
  [... OBJECTID 2, 3, 4 fetched ...]
  Mapped 4 / 4 districts
  Inserted: District 1 (portland-or-council-district-1)
  Inserted: District 2 (portland-or-council-district-2)
  Inserted: District 3 (portland-or-council-district-3)
  Inserted: District 4 (portland-or-council-district-4)

  Summary:
    Inserted: 4
    Skipped (already existed): 0
  Total Portland OR council district rows in geofence_boundaries: 4
  All 4 Portland OR council districts loaded successfully.
```

Idempotency re-run:
```
  Summary:
    Inserted: 0
    Skipped (already existed): 4
  All 4 Portland OR council districts loaded successfully.
```

### Task 2: Migration 229 + smoke test (commit 8590a5f)

**Migration 229 output:** INSERT rowCount=4 on first apply; re-apply rowCount=0 (WHERE NOT EXISTS guard confirmed). Ledger entry added to `supabase_migrations.schema_migrations` as version '229'.

**Smoke test full output:**
```
=== SC1: Portland OR council district boundary count ===
  Portland OR council district rows: 4
  SC1: Count OK (4 rows)

=== SC2: Portland City Hall (-122.6794, 45.5231) ===
  Rows returned: 1
  district: geo_id=portland-or-council-district-4  name=District 4
  SC2: Portland City Hall → portland-or-council-district-4 (District 4)

=== SC3: Salem OR (-123.0351, 44.9429) ===
  Rows returned: 0
  SC3: Negative test OK (Salem returns 0 Portland council districts)

=== SC4: Section-split check ===
  SC4: Section-split check OK (0 orphans — geofences ↔ districts paired)

=== Smoke Test Results ===

ALL ASSERTIONS PASSED
  SC1 [PASS] — 4 Portland OR council district rows present
  SC2 [PASS] — Portland City Hall resolves to 1 council district
  SC3 [PASS] — Salem OR returns 0 Portland council districts
  SC4 [PASS] — Section-split check returns 0 orphans
Exit: 0
```

## Verification Gate Outputs

### SC-1: 4 geofence_boundaries rows (mtfcc='X0012', state='41')
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE geo_id LIKE 'portland-or-council-district-%' AND mtfcc='X0012' AND state='41';
-- Result: 4
```

### SC-4: All 4 geo_ids confirmed
```sql
SELECT geo_id FROM essentials.geofence_boundaries WHERE mtfcc='X0012' ORDER BY geo_id;
-- portland-or-council-district-1
-- portland-or-council-district-2
-- portland-or-council-district-3
-- portland-or-council-district-4
```

### SC-3: Districts rows + section-split check = 0 orphans
```sql
SELECT COUNT(*) FROM essentials.districts
WHERE geo_id LIKE 'portland-or-council-district-%' AND district_type='LOCAL' AND state='or';
-- Result: 4

SELECT gb.geo_id FROM essentials.geofence_boundaries gb
WHERE gb.geo_id LIKE 'portland-or-council-district-%' AND gb.mtfcc = 'X0012'
  AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.district_type='LOCAL' AND d.state='or');
-- Result: 0 rows (clean)
```

### SC-2: Portland City Hall positive + Salem negative
```sql
SELECT geo_id FROM essentials.geofence_boundaries WHERE mtfcc='X0012'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.6794, 45.5231), 4326));
-- Result: portland-or-council-district-4

SELECT geo_id FROM essentials.geofence_boundaries WHERE mtfcc='X0012'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-123.0351, 44.9429), 4326));
-- Result: 0 rows
```

### WGS84 centroid spot-check (proves outSR=4326 worked)
```sql
SELECT geo_id, ST_AsText(ST_Centroid(geometry)) AS centroid
FROM essentials.geofence_boundaries WHERE mtfcc='X0012' ORDER BY geo_id;
```
Results — all in WGS84 degrees (lon near -122.5 to -122.7, lat near 45.5):
- D1: POINT(-122.5426 45.5281)
- D2: POINT(-122.6900 45.5847)
- D3: POINT(-122.6083 45.5101)
- D4: POINT(-122.7202 45.5134)

## Key Answer: Portland City Hall District

**Portland City Hall (lon=-122.6794, lat=45.5231) → portland-or-council-district-4 (District 4)**

This answers RESEARCH.md Open Question O-1. Phase 77 can use this for routing verification.

## MTFCC Registry Update

X0012 is now claimed for Portland OR council districts:
- X0005 = LA County supervisors
- X0006 = SF supervisors
- X0007 = SD council
- X0008 = Fremont council
- X0009 = Berkeley council
- X0010 = SJ council
- X0011 = Sacramento council
- **X0012 = Portland OR council** (this phase)
- X0013 = next available

## Migration Ledger Status

Migration 229 is a **structural migration** (creates essentials.districts rows). It was added to `supabase_migrations.schema_migrations` as version '229'. This follows the same pattern as migrations 224, 223, etc. (differs from audit-only headshot migrations 225, 228 which were NOT added to the ledger).

## Forward Note for Phase 77

Portland city government row does NOT yet exist. Phase 77 must create:
- 1 government row: name='City of Portland', state='OR' (uppercase per project pattern), geo_id='4159000'
- Chambers: Mayor + City Council (12 offices across 4 multi-member districts) + City Attorney + City Administrator
- 1 LOCAL_EXEC district (geo_id='4159000', label='Portland (Citywide)', state='or') for Mayor + City Attorney + City Administrator
- 14 politicians + offices: Mayor + 12 council members + City Attorney; City Administrator = is_appointed_position=true
- Portland City Hall routing confirmed: District 4 (geo_id=portland-or-council-district-4)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ST_MakeValid required for District 1 and District 4**
- **Found during:** Task 2 - SC2 smoke gate failed (Portland City Hall returned 0 rows)
- **Issue:** Loader used `ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON())))` without `ST_MakeValid`. Portland OR council districts D1 and D4 contain self-intersections in the source GeoJSON (ST_IsValid returned false). Invalid geometries cause ST_Covers to return incorrect results.
- **Fix:** Added `ST_MakeValid()` wrapper in the INSERT SQL around the existing geometry pipeline. Also applied `UPDATE ... SET geometry = ST_MakeValid(geometry)` to the already-stored D1 and D4 rows in the DB.
- **Verification:** All 4 districts now ST_IsValid=true; smoke test SC2 passes; City Hall resolves to D4.
- **Files modified:** C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts
- **Commit:** 8590a5f (included in Task 2 commit)

## Self-Check: PASSED

- [x] C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts — EXISTS (commit c9c5162, updated 8590a5f)
- [x] C:/EV-Accounts/backend/scripts/smoke-portland-council-geofences.ts — EXISTS (commit 8590a5f)
- [x] C:/EV-Accounts/backend/migrations/229_portland_council_districts.sql — EXISTS (commit 8590a5f)
- [x] Task 1 commit c9c5162 — CONFIRMED
- [x] Task 2 commit 8590a5f — CONFIRMED
- [x] 4 geofence_boundaries rows with mtfcc='X0012' — CONFIRMED
- [x] 4 districts rows with district_type='LOCAL', state='or' — CONFIRMED
- [x] All 4 smoke test gates pass — CONFIRMED (exit 0)
- [x] Portland City Hall → portland-or-council-district-4 — CONFIRMED
