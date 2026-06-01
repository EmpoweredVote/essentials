# Phase 58: LAUSD Geofences - Research

**Researched:** 2026-05-21
**Domain:** LAUSD GIS portal, ArcGIS REST API, PostGIS geofence_boundaries loader pattern
**Confidence:** HIGH

---

## Summary

Phase 58 loads 7 LAUSD Board of Education district boundaries into `essentials.geofence_boundaries` so any LA address can identify its LAUSD board district. The data source is the LA GeoHub ArcGIS FeatureServer (publicly accessible, no auth) at `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7`. The loader follows the `load-la-city-council-boundaries.ts` pattern exactly: fetch GeoJSON with `outSR=4326` (forcing WGS84 reprojection on the server), insert into `geofence_boundaries` with `ON CONFLICT (geo_id, mtfcc) DO NOTHING`.

The critical design decision already locked in CONTEXT.md is `mtfcc = 'G5420'`. This collides with existing TIGER UNSD (Unified School District) rows for CA — there are already 346 G5420 rows for `state = '06'`. However, since the conflict key is `(geo_id, mtfcc)` and LAUSD board districts use a distinct `geo_id` format, there is no actual collision. The 7 new rows will coexist alongside the 346 TIGER UNSD rows.

**Critical finding:** The CONTEXT.md specifies `district_type = 'SCHOOL_DISTRICT'` but the entire existing codebase (`essentials_service.ts`, all RPCs, all migrations) uses `district_type = 'SCHOOL'` for school-related geofences. The `geofence_boundaries` table has no `district_type` column — `district_type` lives in `essentials.districts`, not `geofence_boundaries`. Since Phase 58 inserts only into `geofence_boundaries` (no `districts` row), the `district_type` designation does not matter for this phase. Phase 62 (LAUSD officials) will create the `districts` row; at that time `district_type = 'SCHOOL'` must be used to integrate with the existing `getRepresentativesByAddress` query.

**Primary recommendation:** Use `load-la-city-council-boundaries.ts` as the template. Fetch from the ArcGIS MapServer REST API with `outSR=4326`. Use `geo_id = 'lausd-board-district-{N}'`, `mtfcc = 'G5420'`, `state = '06'`, `source = 'lausd_geohub_board_districts_2024'`. The smoke test mirrors `smoke-ca-geofences.ts`.

---

## Standard Stack

### Core

| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-lausd-board-boundaries.ts` | new | Fetches LAUSD GIS data, upserts 7 rows into geofence_boundaries | Standalone TypeScript loader — same pattern as load-la-city-council-boundaries.ts |
| `pg` (Pool/Client) | existing | PostgreSQL client for upserts | Already in package.json |
| Node.js `https` module | built-in | Fetches GeoJSON from ArcGIS REST API | No external HTTP library needed — same as existing loaders |
| `dotenv` | existing | Loads DATABASE_URL from .env | Standard pattern throughout backend |

### Data Source

| Resource | URL | Format | Auth |
|---------|-----|--------|------|
| LAUSD Board Districts FeatureServer | `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7` | ArcGIS MapServer | None (public) |
| GeoJSON query endpoint | `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7/query?where=1%3D1&outFields=*&outSR=4326&f=geojson` | GeoJSON in WGS84 | None |
| LA GeoHub dataset page | `https://geohub.lacity.org/datasets/lahub::lausd-board-of-education-districts` | Reference only | None |
| ArcGIS Hub | `https://hub.arcgis.com/datasets/lahub::lausd-board-of-education-districts/about` | Reference only | None |

### Source Data Fields (confirmed from MapServer metadata)

| Field | Type | Purpose |
|-------|------|---------|
| OBJECTID | Integer | ArcGIS internal ID (ignore) |
| ID | Integer | District identifier |
| DISTRICT | Integer | Board district number (1–7) |
| MEMBER | String(50) | Board member name |
| TOOLTIP | String(1) | Internal, ignore |
| NLA_URL | String(1) | Internal, ignore |

**Source CRS:** WKID 102645 (California State Plane, Zone 5 in US survey feet). Using `outSR=4326` in the query URL forces the API to reproject to WGS84 before returning GeoJSON — no client-side reprojection needed.

**Feature count:** Exactly 7 (confirmed via `/query?where=1%3D1&f=json&returnCountOnly=true` → `{"count":7}`).

**Installation:** No new packages required.

---

## Current DB State (confirmed from Phase 57 RESEARCH.md)

```
essentials.geofence_boundaries WHERE state='06':
  G4020: 58   (CA counties — loaded in Phase 57)
  G4040: 1057  (CA CCDs — loaded in Phase 57)
  G4110: 482   (incorporated cities)
  G5200: 52    (congressional districts)
  G5210: 40    (state senate districts)
  G5220: 80    (state assembly districts)
  G5420: 346   (TIGER UNSD — unified school districts, loaded pre-Phase 57)
```

**After Phase 58:** G5420 grows from 346 to 353 (7 new LAUSD board district rows alongside existing TIGER UNSD rows). The 346 TIGER UNSD rows have `geo_id` values following FIPS GEOID format (e.g., `'0621390'` for Compton USD). The 7 LAUSD rows use `lausd-board-district-{N}` format — no conflict.

---

## The 7 LAUSD Board Districts (confirmed from LAUSD website 2025)

| District Number | Board Member | name field |
|----------------|-------------|------------|
| 1 | Sherlett Hendy Newbill | Board District 1 |
| 2 | Dr. Rocio Rivas | Board District 2 |
| 3 | Scott Schmerelson | Board District 3 |
| 4 | Nick Melvoin | Board District 4 |
| 5 | Karla Griego | Board District 5 |
| 6 | Kelly Gonez | Board District 6 |
| 7 | Tanya Ortiz Franklin | Board District 7 |

**Note:** Board member names change with elections. The `name` field in `geofence_boundaries` should be `'Board District {N}'` (not the member's name) so it remains accurate after member turnover. The `MEMBER` field in the source data is the current board member name — use DISTRICT number, not member name, for the canonical `name`.

**geo_id pattern:** `'lausd-board-district-{N}'` (e.g., `'lausd-board-district-1'`) — unique, deterministic, not collision-prone.

---

## Architecture Patterns

### Recommended File Structure

```
C:/EV-Accounts/backend/scripts/
├── load-lausd-board-boundaries.ts   # NEW: LAUSD loader (follows load-la-city-council-boundaries.ts pattern)
└── smoke-lausd-geofences.ts         # NEW: Smoke test (follows smoke-ca-geofences.ts pattern)
```

### Pattern 1: ArcGIS REST GeoJSON Fetch with outSR=4326

Use the `outSR=4326` parameter so the ArcGIS server reprojects from CA State Plane (WKID 102645) to WGS84 before returning the GeoJSON. The DB stores geometry in SRID 4326 — no client-side reprojection needed.

```typescript
// Source: confirmed from load-la-city-council-boundaries.ts (same service, same network pattern)
const ARCGIS_URL =
  'https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7/query' +
  '?where=1%3D1&outFields=DISTRICT,MEMBER&outSR=4326&f=geojson';
```

### Pattern 2: Loader Structure (from load-la-city-council-boundaries.ts)

```typescript
// Source: C:/EV-Accounts/backend/scripts/load-la-city-council-boundaries.ts
import 'dotenv/config';
import { Pool } from 'pg';
import * as https from 'https';

const MTFCC   = 'G5420';
const STATE   = '06';
const SOURCE  = 'lausd_geohub_board_districts_2024';
const DRY_RUN = process.argv.includes('--dry-run');

// Step 1: fetchJson() — same helper as load-la-city-council-boundaries.ts
// Step 2: iterate features, extract DISTRICT number (1-7)
// Step 3: for each district, build geo_id and INSERT with ON CONFLICT DO NOTHING
// Step 4: verify COUNT=7
```

### Pattern 3: Insert SQL

```typescript
// Source: C:/EV-Accounts/backend/scripts/load-la-city-council-boundaries.ts:166-185 (same pattern)
await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES (
    $1, $2, $3, $4, $5,
    public.ST_ForcePolygonCCW(
      public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
    ),
    $7, now()
  )
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]);
```

**Geometry transforms used:**
- `ST_GeomFromGeoJSON` — parse GeoJSON geometry
- `ST_Force2D` — strip Z coordinates (safe, TIGER and ArcGIS data sometimes has Z=0)
- `ST_SetSRID(..., 4326)` — tag as WGS84 (already reprojected by `outSR=4326`)
- `ST_ForcePolygonCCW` — enforce CCW winding for PostGIS convention

Note: `ST_MakeValid` is NOT used here (unlike TIGER county/cousub layers). LAUSD board district polygons from ArcGIS are expected to be valid. If any polygon fails the geometry validity check in the smoke test, add `ST_MakeValid()` wrapping.

### Pattern 4: geo_id Construction

```typescript
// Each of the 7 LAUSD board district rows:
const districtNum = feature.properties.DISTRICT; // integer 1-7
const geoId = `lausd-board-district-${districtNum}`;
const name  = `Board District ${districtNum}`;
// ocd_id: same as geo_id (no formal OCD division exists for LAUSD board districts)
```

**Why not OCD format?** OCD-ID syntax requires registered divisions. LAUSD board districts are not registered in the OCD division registry. Use the `lausd-board-district-{N}` format, same way LA City Council uses `ocd-division/country:us/state:ca/place:los_angeles/council_district:{N}` which IS in the registry. LAUSD board districts are not — so use the simplified format.

### Pattern 5: Smoke Test Structure (from smoke-ca-geofences.ts)

```typescript
// Source: C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts
// Three test assertions (from CONTEXT.md):
// 1. SQL gate: COUNT=7 WHERE district_type='SCHOOL_DISTRICT' (see CRITICAL NOTE below)
// 2. Positive: downtown LA (-118.2437, 34.0522) → SCHOOL_DISTRICT row returned
// 3. Negative: Pasadena (around -118.1437, 34.1478) → NO SCHOOL_DISTRICT row

const SMOKE_QUERY = `
  SELECT geo_id, name, mtfcc
  FROM essentials.geofence_boundaries
  WHERE state = '06'
    AND mtfcc = 'G5420'
    AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
    AND geo_id LIKE 'lausd-board-district-%'
  ORDER BY geo_id
`;
```

**CRITICAL NOTE on smoke test gate phrasing:** CONTEXT.md says "assert `COUNT=7` in `geofence_boundaries WHERE district_type='SCHOOL_DISTRICT'`". However, `geofence_boundaries` has NO `district_type` column. The correct gate is:
```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE state = '06' AND mtfcc = 'G5420' AND geo_id LIKE 'lausd-board-district-%';
-- Expected: 7
```
This is equivalent in intent. The `geo_id LIKE 'lausd-board-district-%'` filter distinguishes the 7 LAUSD rows from the 346 TIGER UNSD rows that also have `mtfcc = 'G5420'`.

### Pattern 6: Pasadena Negative Test Coordinate

Pasadena is NOT part of LAUSD. A Pasadena address should return zero LAUSD board district rows. The City of Pasadena has its own school district (Pasadena Unified School District). A reliable Pasadena coordinate inside PUSD but outside LAUSD:

**Pasadena City Hall:** lon = -118.1437, lat = 34.1478 (City Hall at 100 N Garfield Ave, Pasadena, CA 91101)

**Downtown LA (inside LAUSD):** lon = -118.2437, lat = 34.0522 (per CONTEXT.md, LA City Hall area — Board District 2 territory)

### Anti-Patterns to Avoid

- **Using ST_Within instead of ST_Covers:** ST_Covers is the established pattern in this codebase (handles boundary-coincident points). All existing loaders and smoke tests use ST_Covers.
- **Using the TIGER UNSD rows as the G5420 template:** TIGER UNSD rows have FIPS GEOID-format `geo_id`s. LAUSD rows use a different format. The COUNT gate must filter by `geo_id LIKE 'lausd-board-district-%'` to target only the 7 new rows.
- **Not using outSR=4326:** The native CRS is WKID 102645 (CA State Plane). Without `outSR=4326` in the ArcGIS query, the coordinates come back in feet-based State Plane units that will not insert correctly into the WGS84 geometry column.
- **Expecting a `district_type` column on geofence_boundaries:** There is none. The table columns are: `geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at`. The `district_type` concept belongs to `essentials.districts` (Phase 62 concern).
- **Using district_type='SCHOOL_DISTRICT' in districts:** The entire codebase maps `G5420` to `district_type = 'SCHOOL'`. When Phase 62 creates the districts rows, use `district_type = 'SCHOOL'` to match existing service code — NOT 'SCHOOL_DISTRICT'. The CONTEXT.md references 'SCHOOL_DISTRICT' as a conceptual label, but the implementation value is 'SCHOOL'.
- **Using a districts row in Phase 58:** This phase only loads geofence_boundaries. No districts row. No offices. No officials. Officials and districts come in Phase 62.
- **Assuming LAUSD has an official Shapefile download:** The authoritative source is the ArcGIS REST API. While the LA GeoHub shows download options (Shapefile, CSV, KMZ), the API approach is preferred because it (a) is repeatable programmatically, (b) handles reprojection server-side, and (c) avoids downloading and unzipping a shapefile.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP fetch with redirect | Custom retry loop | `fetchJson()` helper from load-la-city-council-boundaries.ts | Already handles 301/302; battle-tested in production |
| CRS reprojection | proj4 library or manual math | `outSR=4326` ArcGIS query param | Server does reprojection; client receives clean WGS84 |
| Geometry validation | Custom winding check | `ST_ForcePolygonCCW` + `ST_Force2D` + `ST_SetSRID` in INSERT | Same PostGIS pipeline as all other loaders |
| Idempotent insert | DELETE then INSERT | `ON CONFLICT (geo_id, mtfcc) DO NOTHING` | Established pattern; safe to re-run |

**Key insight:** ArcGIS REST API with `outSR=4326` and `f=geojson` is equivalent to downloading a shapefile and reprojecting — but automated, no file management needed.

---

## Common Pitfalls

### Pitfall 1: G5420 Already Has 346 TIGER UNSD Rows — Count Gate Must Filter

**What goes wrong:** Smoke test asserts `COUNT(*) WHERE mtfcc='G5420' = 7` but returns 353 (346 existing TIGER rows + 7 new LAUSD rows), causing the gate to fail.
**Why it happens:** Phase 57 notes G5420=346 already exists for CA. Adding 7 LAUSD rows brings the total to 353.
**How to avoid:** The COUNT gate must filter by `geo_id LIKE 'lausd-board-district-%'` to count only the 7 new rows, not all 353 G5420 rows.
**Warning signs:** Count gate returns 353 instead of 7.

### Pitfall 2: Source CRS Is CA State Plane, Not WGS84

**What goes wrong:** Loader fetches from the ArcGIS API without `outSR=4326`, receives coordinates in CA State Plane (US survey feet, units ~millions), inserts corrupted geometry, PostGIS ST_IsValid() returns false or geometry is placed in wrong location.
**Why it happens:** Native CRS is WKID 102645. Without the outSR parameter, ArcGIS returns coordinates in their native units.
**How to avoid:** Always include `outSR=4326` in the ArcGIS query URL.
**Warning signs:** Smoke test coordinates fail to match any boundary; ST_IsValid returns false; geometry extent is far from Southern California.

### Pitfall 3: district_type='SCHOOL_DISTRICT' Is Not a Valid Value in Live Code

**What goes wrong:** Phase 62 (future) creates a `districts` row with `district_type='SCHOOL_DISTRICT'` instead of `district_type='SCHOOL'`. The `getRepresentativesByAddress` service maps `G5420` to `d.district_type = 'SCHOOL'` — so LAUSD officials would never surface in address lookups.
**Why it happens:** CONTEXT.md uses 'SCHOOL_DISTRICT' as a conceptual name. The implementation constant is 'SCHOOL'.
**How to avoid:** In Phase 58 (geofence only), this doesn't matter. In Phase 62 (districts + officials), use `district_type = 'SCHOOL'`. Flag this risk in the Phase 58 SUMMARY so Phase 62 planners know.
**Warning signs:** Officials loaded in Phase 62 don't appear in /representatives/me results for LA addresses.

### Pitfall 4: Pasadena Coordinate Inside LAUSD Overlap Zone

**What goes wrong:** The Pasadena negative test coordinate accidentally falls inside an LAUSD board district boundary (if LAUSD territory overlaps near city borders), causing the negative test to fail.
**Why it happens:** The LAUSD boundary roughly follows the City of LA + unincorporated LA County boundaries but has irregular edges. City Hall at 100 N Garfield Ave, Pasadena is reliably inside PUSD territory.
**How to avoid:** Use Pasadena City Hall (lon=-118.1437, lat=34.1478) as the negative test coordinate — this is solidly inside Pasadena Unified, not LAUSD.
**Warning signs:** Negative test returns a LAUSD board district row for the Pasadena coordinate.

### Pitfall 5: LAUSD Polygon Edges Include Partial-Coverage Cities

**What goes wrong:** Cities like Beverly Hills, Santa Monica, Culver City that are physically inside the LAUSD service area boundary may or may not be within the LAUSD board district polygons. A test coordinate in those cities may or may not return a LAUSD row depending on the exact polygon boundaries.
**Why it happens:** Some cities have their own independent school districts (Beverly Hills USD, Santa Monica-Malibu USD, Culver City USD) and their geographic boundaries are excluded from LAUSD polygon coverage.
**How to avoid:** Use Downtown LA (lon=-118.2437, lat=34.0522) for the positive test — this is solidly inside LAUSD (Board District 2 territory, very dense LAUSD-served area).
**Warning signs:** Positive test with an atypical LA address (Beverly Hills, Santa Monica, Culver City) fails to return a LAUSD row.

### Pitfall 6: LAUSD Has More Than 7 Board Districts (Local Districts vs. Board Districts Confusion)

**What goes wrong:** Developer loads LAUSD "Local Districts" layer (which has more than 7 districts — these are administrative local districts, not board districts) instead of the Board of Education districts.
**Why it happens:** LA GeoHub has two separate LAUSD layers: "LAUSD Board of Education Districts" (7 rows — correct) and "LAUSD Local Districts" (more rows — wrong). The MapServer has both.
**How to avoid:** Use Layer 7 (`/MapServer/7`) which is confirmed to have exactly 7 features. The LAUSD Local Districts are a separate administrative layer at a different MapServer ID.
**Warning signs:** Count is not 7; district numbers are not 1-7.

---

## Code Examples

### Full ArcGIS Query URL (verified returns GeoJSON in WGS84)

```
https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7/query?where=1%3D1&outFields=DISTRICT,MEMBER&outSR=4326&f=geojson
```

### Loader Core Loop (adapted from load-la-city-council-boundaries.ts)

```typescript
// Source: C:/EV-Accounts/backend/scripts/load-la-city-council-boundaries.ts — adapted pattern

for (const feature of geojson.features) {
  const props = feature.properties || {};
  const districtNum = Number(props['DISTRICT']);
  if (!districtNum || districtNum < 1 || districtNum > 7) {
    console.warn(`WARNING: unexpected DISTRICT value: ${props['DISTRICT']}`);
    continue;
  }
  const geoId       = `lausd-board-district-${districtNum}`;
  const name        = `Board District ${districtNum}`;
  const geometryJson = JSON.stringify(feature.geometry);

  const result = await pool.query(`
    INSERT INTO essentials.geofence_boundaries
      (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
    VALUES ($1, $2, $3, $4, $5,
      public.ST_ForcePolygonCCW(
        public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
      ),
      $7, now())
    ON CONFLICT (geo_id, mtfcc) DO NOTHING
  `, [geoId, geoId, name, '06', 'G5420', geometryJson, 'lausd_geohub_board_districts_2024']);
}
```

### Smoke Test Gate SQL

```sql
-- Gate 1: Exactly 7 LAUSD board district rows
SELECT COUNT(*) AS lausd_count
FROM essentials.geofence_boundaries
WHERE state = '06'
  AND mtfcc = 'G5420'
  AND geo_id LIKE 'lausd-board-district-%';
-- Expected: 7

-- Gate 2: Positive test — downtown LA is inside LAUSD
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '06'
  AND mtfcc = 'G5420'
  AND geo_id LIKE 'lausd-board-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-118.2437, 34.0522), 4326));
-- Expected: 1 row (Board District 2 expected for LA City Hall area)

-- Gate 3: Negative test — Pasadena is NOT inside LAUSD
SELECT COUNT(*) AS should_be_zero
FROM essentials.geofence_boundaries
WHERE state = '06'
  AND mtfcc = 'G5420'
  AND geo_id LIKE 'lausd-board-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-118.1437, 34.1478), 4326));
-- Expected: 0
```

### Smoke Test TypeScript Structure (mirrors smoke-ca-geofences.ts)

```typescript
// Source: C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts — adapted structure
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const LAUSD_GEO_ID_PATTERN = 'lausd-board-district-%';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let failures = 0;
  const errors: string[] = [];

  try {
    // Gate 1: Count = 7
    const countRes = await client.query(
      `SELECT COUNT(*) AS cnt FROM essentials.geofence_boundaries
       WHERE state = '06' AND mtfcc = 'G5420' AND geo_id LIKE $1`,
      [LAUSD_GEO_ID_PATTERN]
    );
    const count = parseInt(countRes.rows[0].cnt, 10);
    console.log(`Gate 1: LAUSD boundary count = ${count} (expected 7)`);
    if (count !== 7) { errors.push(`Count expected 7, got ${count}`); failures++; }

    // Gate 2: Positive test — downtown LA
    const posRes = await client.query(
      `SELECT geo_id, name FROM essentials.geofence_boundaries
       WHERE state = '06' AND mtfcc = 'G5420' AND geo_id LIKE $1
         AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($2, $3), 4326))`,
      [LAUSD_GEO_ID_PATTERN, -118.2437, 34.0522]
    );
    console.log(`Gate 2: Downtown LA → ${posRes.rows.length} LAUSD row(s): ${posRes.rows.map(r => r.name).join(', ')}`);
    if (posRes.rows.length === 0) { errors.push('Positive test: downtown LA returned no LAUSD row'); failures++; }

    // Gate 3: Negative test — Pasadena City Hall
    const negRes = await client.query(
      `SELECT COUNT(*) AS cnt FROM essentials.geofence_boundaries
       WHERE state = '06' AND mtfcc = 'G5420' AND geo_id LIKE $1
         AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($2, $3), 4326))`,
      [LAUSD_GEO_ID_PATTERN, -118.1437, 34.1478]
    );
    const negCount = parseInt(negRes.rows[0].cnt, 10);
    console.log(`Gate 3: Pasadena City Hall → ${negCount} LAUSD row(s) (expected 0)`);
    if (negCount !== 0) { errors.push(`Negative test: Pasadena returned ${negCount} LAUSD rows`); failures++; }

  } finally {
    await client.end();
  }

  if (failures === 0) {
    console.log('PASSED. All 3 LAUSD smoke test gates pass.');
    process.exit(0);
  } else {
    console.error(`FAILED (${failures} assertion(s)): ${errors.join('; ')}`);
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| TIGER UNSD (G5420) only | TIGER UNSD (G5420) + LAUSD board district polygons (G5420) | LAUSD board districts identifiable by address lookup |
| ArcGIS Shapefiles (requires download + ogr2ogr) | ArcGIS REST API GeoJSON with outSR=4326 | No shapefile tooling needed; pure TypeScript |
| Manual geo_id assignment | Deterministic `lausd-board-district-{N}` pattern | Safe re-runs; idempotent |

---

## Open Questions

1. **Which board district does downtown LA (lon=-118.2437, lat=34.0522) fall in?**
   - What we know: From the MEMBER data, the 7 board members are confirmed. Downtown LA / LA City Hall area is historically Board District 2 territory.
   - What's unclear: The exact boundary — verify from the smoke test output.
   - Recommendation: Don't hard-code the expected district in the smoke test. Just assert `rowCount > 0`. The exact board district can be logged and confirmed from smoke test output.

2. **Does the LAUSD polygon actually exclude Pasadena fully?**
   - What we know: Pasadena Unified School District is independent from LAUSD. Pasadena City Hall is at 100 N Garfield Ave, Pasadena — well inside PUSD.
   - What's unclear: Whether the LAUSD polygon has any odd extensions near the Pasadena border.
   - Recommendation: The coordinate (lon=-118.1437, lat=34.1478) is the center of Pasadena City Hall — reliable. If the negative test fails, shift south to a more central Pasadena location.

3. **Are Beverly Hills / Santa Monica addresses correctly excluded from LAUSD polygons?**
   - What we know: Beverly Hills USD, Santa Monica-Malibu USD, and Culver City USD are independent. The LAUSD boundary excludes these cities.
   - What's unclear: Whether the ArcGIS polygon accurately reflects these exclusions or if there are boundary imprecisions.
   - Recommendation: Not a test requirement for Phase 58. Use only the two required test addresses. Log as a known edge case for Phase 62 (officials) where incorrect routing would manifest.

4. **Does `ST_ForcePolygonCCW` work correctly for MultiPolygon geometries?**
   - What we know: The ArcGIS MapServer returns `esriGeometryPolygon` type. Board district boundaries are likely simple polygons, not MultiPolygons (they are contiguous geographic areas).
   - What's unclear: Whether any of the 7 districts are non-contiguous (unlikely for board districts).
   - Recommendation: The `ST_Force2D` + `ST_SetSRID` + `ST_ForcePolygonCCW` pipeline handles both Polygon and MultiPolygon types in PostGIS. No special casing needed.

---

## Sources

### Primary (HIGH confidence)

- `C:/EV-Accounts/backend/scripts/load-la-city-council-boundaries.ts` — read in full; confirmed ArcGIS GeoJSON fetch pattern with `outSR=4326`, `ON CONFLICT (geo_id, mtfcc) DO NOTHING`, Pool client pattern
- `C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts` — read in full; confirmed smoke test structure with gates, positive/negative tests, TypeScript/pg pattern
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — read relevant sections; confirmed `geofence_boundaries` INSERT columns: `(geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)`; confirmed `unsd` layer uses `mtfcc = 'G5420'` and `district_type = 'SCHOOL'`
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` — confirmed `getRepresentativesByAddress` maps `G5420` to `district_type = 'SCHOOL'` (not SCHOOL_DISTRICT)
- `C:/EV-Accounts/backend/migrations/066_update_resolve_user_jurisdiction_municipality.sql` — confirmed `resolve_user_jurisdiction` maps G5420 to `district_type = 'SCHOOL'`
- `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7?f=json` — confirmed layer name, geometry type, native WKID 102645, all field names (DISTRICT, MEMBER, ID, TOOLTIP, NLA_URL)
- `https://maps.lacity.org/lahub/rest/services/LAUSD_Schools/MapServer/7/query?where=1%3D1&f=json&returnCountOnly=true` — confirmed count=7
- Phase 57 RESEARCH.md — confirmed G5420=346 already in DB for state='06'; confirmed geofence_boundaries INSERT pattern; confirmed smoke test format

### Secondary (MEDIUM confidence)

- LAUSD Board of Education official website + WebSearch 2025 — confirmed 7 board districts with current member names (Newbill, Rivas, Schmerelson, Melvoin, Griego, Gonez, Franklin)
- WebSearch for LA GeoHub dataset page — confirmed `https://geohub.lacity.org/datasets/lahub::lausd-board-of-education-districts` is the canonical dataset page

### Tertiary (LOW confidence)

- Downtown LA positive test coordinate (lon=-118.2437, lat=34.0522 per CONTEXT.md) is within LAUSD Board District 2 territory — assumed from geography, not confirmed from actual polygon query
- Pasadena negative test coordinate reliability — assumed from city boundary knowledge; PUSD and LAUSD are separate systems

---

## Metadata

**Confidence breakdown:**
- Data source (LA GeoHub MapServer): HIGH — ArcGIS REST API confirmed accessible, count=7 confirmed, field names confirmed
- Loader pattern: HIGH — directly adapted from load-la-city-council-boundaries.ts which is production code
- geo_id format (`lausd-board-district-{N}`): HIGH — follows internal convention; no collision with TIGER UNSD GEOIDs
- district_type conflict warning: HIGH — confirmed from reading essentialsService.ts source
- Board district names: MEDIUM — from LAUSD website + WebSearch; members change with elections (data is current for 2025)
- Positive/negative test coordinates: MEDIUM — coordinates from CONTEXT.md + known geography; verify from smoke test output

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (LAUSD board district boundaries are stable; members change on election cycles but names are not stored in geofence_boundaries)
