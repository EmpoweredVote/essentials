---
phase: 203-indio-deep-seed
plan: 01
status: complete
completed: 2026-07-13
requirements: [CV-03]
---

# 203-01 Summary — Indio Council-District Geofences (X0023)

## Outcome
5 valid WGS84 council-district geofences live in production, gating Plan 02.

## What was built
- `C:/EV-Accounts/backend/scripts/load-indio-council-boundaries.ts` — ArcGIS `f=geojson`+`outSR=4326`
  loader; parameterized INSERT `ON CONFLICT (geo_id, mtfcc) DO NOTHING`; GeoJSON pass-through primary
  path + defensive Esri-rings fallback (D-09); `ST_MakeValid` guard; `EXPECTED_COUNT=5` hard-abort.
  Committed to `C:/EV-Accounts` (master→Render) as `b99c6577`.

## Key results (production `essentials.geofence_boundaries`, mtfcc='X0023', state='ca')
| geo_id | geometry | valid | centroid (lon, lat) |
|--------|----------|-------|---------------------|
| indio-ca-council-district-1 | ST_MultiPolygon | true | -116.2649, 33.7612 |
| indio-ca-council-district-2 | ST_MultiPolygon | true | -116.2211, 33.7376 |
| indio-ca-council-district-3 | ST_MultiPolygon | true | -116.1921, 33.7346 |
| indio-ca-council-district-4 | ST_MultiPolygon | true | -116.2454, 33.7170 |
| indio-ca-council-district-5 | ST_MultiPolygon | true | -116.2403, 33.6904 |

Combined boolean assertion (count=5, all valid, all centroids in Indio WGS84 range) → `t`.
X-code **X0023** DB-verified unused (0 rows) before load; prior max was X0022.

## DEVIATION (source) — flag for the record
- CONTEXT.md **D-07** named a city self-hosted server `gis.indio.org` as the primary source.
  **At execute time `gis.indio.org` does NOT resolve (NXDOMAIN)** — the host does not exist.
- Adopted source used instead: the officially adopted **2022 redistricting map, "Indio Approved
  Map 108"**, published by **National Demographics Corporation (NDC)** — Indio's official districting
  vendor. Its single operational layer:
  `https://services8.arcgis.com/fpjs8A5Vtkshblnd/arcgis/rest/services/Indio_Plan_108/FeatureServer/0`
  (native SRID 3857 Web Mercator → `outSR=4326` mandatory; `DISTRICT` string "1".."5").
- Cross-checks: feature count = 5; balanced populations (~17.2k–18.9k, ~89.5k total ≈ Indio's ~90k);
  all centroids in the Indio range. This is analogous to the prior CV city, whose adopted districts
  also lived on a hosted `services*.arcgis.com` FeatureServer rather than a city-owned server.
- The layer's `NAME` attribute is blank, so there is **no councilmember name cross-check** from the
  geometry source (the prior CV city's layer had one). Roster cross-check deferred to Plan 02 against
  the live city profile (D-04/D-06).
- D-09 PDF-digitize fallback was **not** needed — the hosted FeatureServer returned clean GeoJSON.

## Self-Check: PASSED
- [x] Loader authored + Task-1 acceptance grep PASS (no forbidden X0022/X0021/X0020/palm-springs/riverside-ca tokens)
- [x] 5 X0023/state='ca' geofences present, all `ST_IsValid`, centroids in Indio WGS84 range
- [x] geo_ids exactly `indio-ca-council-district-1..5`
- [x] Loader committed to `C:/EV-Accounts`; pre-existing city boundary 0636448 untouched
