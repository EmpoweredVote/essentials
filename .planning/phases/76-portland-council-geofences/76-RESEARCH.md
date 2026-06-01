# Phase 76: Portland City Council District Geofences - Research

**Researched:** 2026-05-29
**Domain:** ArcGIS MapServer, PostGIS geofence loading, Portland OR charter reform districts
**Confidence:** HIGH

---

## Summary

Portland's 2024 charter reform (Measure 26-228, approved Nov 2022) created 4 multi-member city council districts effective January 2025. These districts are NOT in TIGER 2024 and must be sourced from the City of Portland's ArcGIS infrastructure. The authoritative source is the PortlandMaps.com Public/Boundaries MapServer, Layer 17 ("City of Portland Council Districts"), which returns 4 polygon features with a `DISTRICT` string field containing values `"1"`, `"2"`, `"3"`, `"4"`.

The layer uses Web Mercator (WKID 102100 / EPSG:3857) natively, but the ArcGIS `outSR=4326` parameter projects correctly to WGS84 for storage in PostGIS. This is the same outSR pattern used by Fremont, SD, SJ, and Sacramento loaders in this project.

A critical implementation detail: querying all 4 features in a single GeoJSON request returns only 3 features (geometry size causes the service to truncate silently with no `exceededTransferLimit` flag). The loader must fetch each district individually by OBJECTID (1–4), or use DISTRICT-by-DISTRICT queries.

**Primary recommendation:** Write `load-portland-council-boundaries.ts` modeled on `load-fremont-council-boundaries.ts`, using OBJECTID-by-OBJECTID queries (4 separate HTTP calls), outSR=4326, DISTRICT string field parsed to integer, geo_ids `portland-or-council-district-{1-4}`, mtfcc=X0012, state='41', migration 229.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Geofence boundary loading | Database / Storage | API / Backend (loader script) | Boundaries are PostGIS polygons; loader is a one-shot Node.js script, not a live endpoint |
| District routing (address → council district) | API / Backend | — | essentialsService.ts `getRepresentativesByAddress` does the ST_Covers join |
| district_type enforcement | API / Backend | — | The X% fallback rule in essentialsService.ts determines which district_type is matched |
| Migration tracking | Database / Storage | — | Supabase migration ledger tracks structural changes |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js https | built-in | Fetch GeoJSON from ArcGIS MapServer | Same pattern as all existing boundary loaders |
| pg (Pool) | project version | PostgreSQL writes to geofence_boundaries | Project standard |
| dotenv | project version | DATABASE_URL from .env | Project standard |
| PostGIS ST_ForcePolygonCCW + ST_SetSRID + ST_Force2D + ST_GeomFromGeoJSON | PostGIS | Store geometry | Established project pattern for all custom loaders |

### No new packages needed
All dependencies are already present in `C:/EV-Accounts/backend`. No npm installs required.

---

## Package Legitimacy Audit

> No new packages are installed in this phase — all dependencies are pre-existing project libraries. This section is N/A.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
PortlandMaps ArcGIS MapServer (Layer 17)
  https://www.portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17
  |
  | 4 × individual OBJECTID queries (outSR=4326, f=geojson)
  v
load-portland-council-boundaries.ts
  | parse DISTRICT string -> int (1-4)
  | geo_id = 'portland-or-council-district-{N}'
  | ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON()), 4326))
  v
essentials.geofence_boundaries
  geo_id='portland-or-council-district-{N}'
  mtfcc='X0012'
  state='41'
  source='portland_city_council_districts_2024'
  |
  | essentialsService.ts X% fallback rule:
  |   mtfcc LIKE 'X%' AND NOT IN (...special cases...) -> district_type IN ('LOCAL','COUNTY')
  v
essentials.districts (Phase 77 creates these rows)
  geo_id='portland-or-council-district-{N}'
  district_type='LOCAL'
  state='or'
```

### Recommended Project Structure
```
C:/EV-Accounts/backend/
├── scripts/
│   └── load-portland-council-boundaries.ts   # NEW: boundary loader script
├── migrations/
│   └── 229_portland_council_geofences.sql    # optional: audit-only migration or N/A (loader writes directly)
```

Note: The loader writes directly to the DB (no migration file for geofence_boundaries rows — established pattern). Migration 229 is reserved for Phase 76 if needed, but prior phases (68, 67, 66, 65, 64) wrote geofences via loader scripts with no corresponding migration file.

### Pattern: Per-OBJECTID ArcGIS Query (CRITICAL)

**What:** Query each of the 4 Portland council districts individually by OBJECTID instead of all at once.
**When to use:** Required for this service — bulk GeoJSON query silently returns only 3 of 4 features (geometry size limit with no `exceededTransferLimit` flag).
**Example:**

```typescript
// Source: verified 2026-05-29 against portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17
// CRITICAL: Do NOT query all 4 at once (where=1=1) — only 3 features are returned silently.
// Must fetch by individual OBJECTID (1-4) or by individual DISTRICT value.

const BASE_URL = 'https://www.portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17/query';

for (let objectId = 1; objectId <= 4; objectId++) {
  const url = `${BASE_URL}?where=OBJECTID%3D${objectId}&outFields=DISTRICT&outSR=4326&f=geojson`;
  const geojson = await fetchJson(url);
  const feature = geojson.features[0];
  const distNum = parseInt(String(feature.properties['DISTRICT'] ?? ''), 10);
  // distNum will be 1, 2, 3, or 4 (matches OBJECTID for this dataset)
}
```

### Pattern: Loader Script Structure (from fremont analog)

```typescript
// Source: C:/EV-Accounts/backend/scripts/load-fremont-council-boundaries.ts (verified working)

const ARCGIS_BASE = 'https://www.portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17/query';
const MTFCC          = 'X0012';
const STATE          = '41';          // Oregon FIPS — NOT '41' string from districts, this is geofence_boundaries.state
const SOURCE         = 'portland_city_council_districts_2024';
const EXPECTED_COUNT = 4;

// INSERT pattern (same as all other custom district loaders):
await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES ($1, $2, $3, $4, $5,
    public.ST_ForcePolygonCCW(
      public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
    ),
    $7, now())
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]);
```

### Pattern: district_type = 'LOCAL' (verified from essentialsService.ts)

The routing query in `essentialsService.ts` (line ~579) has:
```sql
OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))
```

X0012 falls through this X% fallback rule. **Phase 77 must create `essentials.districts` rows with `district_type='LOCAL'`** (not 'LOCAL_LOWER', not 'LOCAL_EXEC') for the 4 Portland council districts. This matches all prior CA city council district patterns (SD, Fremont, Berkeley, SJ, Sacramento all use 'LOCAL').

The ROADMAP note "LOCAL_LOWER geofences" is incorrect — the correct value is 'LOCAL' based on the routing code and all established precedents.

### Anti-Patterns to Avoid
- **Bulk GeoJSON query (where=1=1):** Returns only 3 of 4 features silently. Always fetch by individual OBJECTID.
- **Using district_type='LOCAL_LOWER':** This type does not appear in the essentialsService.ts X% fallback rule; council districts must use 'LOCAL'.
- **Omitting outSR=4326:** The service uses Web Mercator (WKID 102100); without outSR, coordinates are in meters (large integers), PostGIS stores garbage geometry, ST_Covers returns 0 rows.
- **Using geo_ids like 'portland-council-district-{N}':** Portland Maine already uses 'portland-...' prefix (established in Phase 53). All Portland OR geo_ids must use 'portland-or-...' prefix to prevent collisions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Coordinate projection | Manual coordinate math | outSR=4326 ArcGIS param | ArcGIS server-side projection is exact; hand-rolling introduces rounding errors |
| Polygon winding | Manual ring reversal | ST_ForcePolygonCCW | PostGIS function handles all edge cases; established project pattern |
| Geometry validity | Manual validation | ST_Force2D | Strips Z coordinates that cause ST_GeomFromGeoJSON to fail |
| Idempotency | Custom existence check | ON CONFLICT (geo_id, mtfcc) DO NOTHING | Established pattern across all 7 prior custom loaders |

---

## Key Research Answers

### Q1: Exact API endpoint URL
```
https://www.portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17/query
```
- Layer 17 = "City of Portland Council Districts" [VERIFIED: WebFetch against portlandmaps.com]
- Service: Public/Boundaries MapServer (not FeatureServer — FeatureServer variant returns HTTP 500)
- Total feature count: 4 [VERIFIED: returnCountOnly=true query returned {"count":4}]

### Q2: Coordinate system / outSR requirement
- Native projection: WKID 102100 (Web Mercator / EPSG:3857) [VERIFIED: layer metadata]
- outSR=4326 IS REQUIRED — same as Fremont, SD, SJ, Sacramento loaders
- Verified: with outSR=4326, OBJECTID=1 returns lon≈-122.56 to -122.47, lat≈45.46 to 45.55 (correct for Portland OR) [VERIFIED: WebFetch]

### Q3: District number field
- Field name: `DISTRICT` (uppercase, string type, 255 chars) [VERIFIED: layer metadata]
- Values: `"1"`, `"2"`, `"3"`, `"4"` (string integers, no prefix) [VERIFIED: attributes-only query]
- OBJECTIDs: 1, 2, 3, 4 (happen to match district numbers for this dataset)
- Parse with: `parseInt(String(feature.properties['DISTRICT'] ?? ''), 10)`

### Q4: district_type
- **'LOCAL'** — confirmed from essentialsService.ts X% fallback rule [VERIFIED: source code]
- ROADMAP note "LOCAL_LOWER" is incorrect; no such type in the X% branch
- All CA city council districts (SD, Fremont, Berkeley, SJ, Sacramento) use 'LOCAL' [VERIFIED: STATE.md]

### Q5: geo_id pattern
- Pattern: `portland-or-council-district-{1,2,3,4}`
- Rationale: Portland ME already uses 'portland-...' prefix; must use 'portland-or-' to avoid collision
- No existing Portland OR council district rows in DB [VERIFIED: DB query returned 0 rows]

### Q6: Next migration number
- **229** — confirmed [VERIFIED: DB query shows max applied = 224; migrations 225-228 are AUDIT-ONLY headshot files not tracked in schema_migrations; STATE.md explicitly states "Next migration is 229"]

### Q7: Pre-existing Portland OR council district rows
- **None** — 0 rows in geofence_boundaries matching 'portland%council%' or 'portland-or%' [VERIFIED: DB query]
- Portland OR city government row does NOT yet exist — only 'State of Oregon' (geo_id='41') is in essentials.governments for Oregon state [VERIFIED: DB query]
- The Portland city government row will be created in Phase 77

---

## Common Pitfalls

### Pitfall 1: Silent Geometry Truncation
**What goes wrong:** The bulk `where=1=1` GeoJSON query to MapServer Layer 17 returns only 3 of 4 features with no error and no `exceededTransferLimit` flag. District 4 is silently missing.
**Why it happens:** MapServer has a GeoJSON transfer size limit that triggers before the `maxRecordCount=4000` record limit. The response looks complete because there is no pagination indicator.
**How to avoid:** Always query by individual OBJECTID (or by DISTRICT value). 4 HTTP calls to fetch 4 districts. Verify `districtMap.size === EXPECTED_COUNT` before inserting.
**Warning signs:** Post-insert count shows 3 instead of 4; smoke test for a D4 Portland address returns 0 rows.

### Pitfall 2: outSR=4326 Omission
**What goes wrong:** Without outSR=4326, ArcGIS returns coordinates in Web Mercator meters (values like 6-7 digit numbers). ST_GeomFromGeoJSON may accept them, but ST_Covers returns 0 rows for any lat/lon query.
**Why it happens:** WKID 102100 is the layer's native projection.
**How to avoid:** Always append `&outSR=4326` to all query URLs. Verify loaded geometry by checking coordinate ranges via PostGIS ST_Extent.

### Pitfall 3: geo_id Collision with Portland Maine
**What goes wrong:** Using `geo_id='portland-council-district-1'` (no state qualifier) would collide with Portland ME's existing geo_id namespace (Phase 53 used 'portland-...' for Maine city officials).
**Why it happens:** Two cities named Portland exist in the system.
**How to avoid:** Always use `portland-or-council-district-{N}` with the '-or-' state qualifier.

### Pitfall 4: district_type='LOCAL_LOWER' or 'LOCAL_EXEC'
**What goes wrong:** Routing query in essentialsService.ts won't match X0012 boundaries to district rows unless `district_type='LOCAL'` or `'COUNTY'`.
**Why it happens:** ROADMAP description says "LOCAL_LOWER" but that type is not in the X% fallback rule branch.
**How to avoid:** Phase 77 must use `district_type='LOCAL'` for all 4 Portland council district rows.

### Pitfall 5: No Portland OR city government row yet
**What goes wrong:** Phase 77 plans that assume a Portland OR city government row exists will fail — it must be created in Phase 77.
**Why it happens:** Phase 73 only created the State of Oregon government + chambers. No Portland city government was seeded.
**How to avoid:** Phase 76 scope is geofences only. Phase 77 creates the government row, chambers, districts, and officials.

---

## Code Examples

### Full loader URL pattern
```typescript
// Source: verified 2026-05-29 against portlandmaps.com MapServer Layer 17
// One URL per district — fetch 4 separately to avoid geometry truncation

const BASE = 'https://www.portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17/query';

// Fetch by OBJECTID (1-4):
const url = `${BASE}?where=OBJECTID%3D${objectId}&outFields=DISTRICT&outSR=4326&f=geojson`;

// Alternative: fetch by DISTRICT value (equivalent, same 1 feature returned):
const url2 = `${BASE}?where=DISTRICT%3D%27${distNum}%27&outFields=DISTRICT&outSR=4326&f=geojson`;
```

### INSERT SQL pattern
```sql
-- Source: established pattern from load-fremont-council-boundaries.ts (verified working)
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES (
  'portland-or-council-district-1',    -- geo_id
  'portland-or-council-district-1',    -- ocd_id (mirrors geo_id for custom districts)
  'District 1',                         -- name
  '41',                                 -- state = Oregon FIPS
  'X0012',                              -- mtfcc = next custom code
  public.ST_ForcePolygonCCW(
    public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($geometry)), 4326)
  ),
  'portland_city_council_districts_2024',
  now()
)
ON CONFLICT (geo_id, mtfcc) DO NOTHING;
```

### Pre-flight check (X0012 availability)
```typescript
// Verify X0012 is unclaimed before loading:
const precheck = await pool.query(
  `SELECT COUNT(*) AS cnt FROM essentials.geofence_boundaries WHERE mtfcc='X0012'`
);
// If cnt > 0: check they are all portland-or-council-district rows (idempotency re-run)
```

### Smoke test coordinate
```typescript
// Portland City Hall: lon=-122.6794, lat=45.5231
// Source: confirmed Phase 72-02 smoke test (72-02-SUMMARY.md)
// Expected: returns portland-or-council-district-? (district TBD — run after load to confirm)
const result = await pool.query(`
  SELECT geo_id, name
  FROM essentials.geofence_boundaries
  WHERE mtfcc = 'X0012'
    AND public.ST_Covers(
      geometry,
      public.ST_SetSRID(public.ST_MakePoint(-122.6794, 45.5231), 4326)
    )
`);
// Must return exactly 1 row (1 district for City Hall address)
```

### Section-split check (run after loading)
```sql
-- Source: established project pattern (feedback_section_split_check.md memory)
-- Must return 0 rows after geofences loaded
SELECT gb.geo_id
FROM essentials.geofence_boundaries gb
WHERE gb.geo_id LIKE 'portland-or-council-district-%'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id
  );
-- EXPECTED: 0 rows (districts created in Phase 77, so this check runs AFTER Phase 77)
-- In Phase 76 scope: run against all geofence_boundaries to confirm no NEW splits introduced
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single bulk `where=1=1` query | Per-OBJECTID query loop | This phase (discovered) | Prevents silent District 4 omission |
| Hand-drawn/Census districts | Portland charter reform commission districts | Aug 2023 adoption | Only source is PortlandMaps ArcGIS |

**Deprecated/outdated:**
- TIGER 2024 has no Portland council district data — it only has the city boundary (geo_id=4159000, G4110). The 4 sub-city districts are purely charter-reform constructs not in TIGER.

---

## Runtime State Inventory

> Phase 76 is a greenfield geofence load — no rename/refactor scope. This section is N/A.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Loader script | Yes | Project version | — |
| DATABASE_URL env | Loader DB writes | Yes | Set in C:/EV-Accounts/backend/.env | — |
| portlandmaps.com ArcGIS MapServer | Boundary data | Yes (verified 2026-05-29) | Layer 17 returns 4 features | No known fallback needed |
| PostGIS | Geometry storage | Yes | Project standard | — |

**Missing dependencies with no fallback:** None.

**Source reachability:** Verified — portlandmaps.com MapServer Layer 17 responded to all test queries on 2026-05-29.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js / tsx (project pattern — no formal test runner for loader scripts) |
| Quick run command | `npx tsx scripts/load-portland-council-boundaries.ts --dry-run` |
| Full run command | `npx tsx scripts/load-portland-council-boundaries.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| SC-1 | 4 geofence rows loaded | smoke | PostGIS COUNT query in loader post-insert | Built into loader verify step |
| SC-2 | Portland address → correct district | smoke | Manual SQL ST_Covers query | Run after load |
| SC-3 | Section-split check returns 0 rows | smoke | SQL from feedback memory | Run after Phase 77 adds districts rows |
| SC-4 | All 4 district geo_ids confirmed | smoke | SELECT geo_id FROM geofence_boundaries WHERE mtfcc='X0012' | Built into loader |

### Sampling Rate
- **During load:** Loader script post-insert verification (count gate)
- **After load:** Manual smoke test SQL at Portland City Hall coordinate

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OBJECTIDs 1-4 permanently match district numbers 1-4 for this dataset | Code Examples | If ArcGIS re-sequences OBJECTIDs, the OBJECTID-loop approach still works because we read the DISTRICT field value, not the OBJECTID itself |
| A2 | portlandmaps.com MapServer Layer 17 contains the 2024 charter reform districts (not older ward boundaries) | Standard Stack | Verified by coordinate range (outSR=4326 returns Portland-range coords), district count=4, and PortlandMaps public description "City of Portland Council Districts" |
| A3 | Phase 77 will create districts rows with district_type='LOCAL' | Architecture Patterns | If Phase 77 uses different district_type, the X% routing rule won't match — but this is Phase 77's responsibility |

**All factual claims about the ArcGIS endpoint, fields, feature count, and coordinate system are VERIFIED via direct HTTP queries on 2026-05-29.**

---

## Open Questions

1. **Which council district covers Portland City Hall?**
   - What we know: Portland City Hall is at lon=-122.6794, lat=45.5231
   - What's unclear: The specific district number is not known until geofences are loaded and ST_Covers is run
   - Recommendation: Run smoke test after load; document result in SUMMARY.md for Phase 77 reference

2. **Does the DISTRICT string value always match the OBJECTID?**
   - What we know: In the attributes-only query, OBJECTID 1 = DISTRICT "1", OBJECTID 2 = DISTRICT "2", etc.
   - What's unclear: Whether this is a stable property of the dataset
   - Recommendation: Always read DISTRICT field, not OBJECTID — safe regardless

---

## Sources

### Primary (HIGH confidence)
- PortlandMaps ArcGIS MapServer Layer 17 metadata — `https://www.portlandmaps.com/arcgis/rest/services/Public/Boundaries/MapServer/17?f=json` — field names, spatial ref, maxRecordCount
- PortlandMaps MapServer Layer 17 count query — `?where=1%3D1&returnCountOnly=true&f=json` — confirmed 4 features
- PortlandMaps MapServer Layer 17 attribute query — `?where=1%3D1&outFields=OBJECTID%2CDISTRICT&returnGeometry=false&f=json` — DISTRICT values "1"-"4"
- PortlandMaps MapServer Layer 17 geometry query per OBJECTID — `?where=OBJECTID%3D1&outFields=DISTRICT&outSR=4326&f=geojson` — WGS84 coordinates confirmed
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` (lines 567-583) — X% fallback rule, district_type='LOCAL' confirmed
- `C:/EV-Accounts/backend/scripts/load-berkeley-council-boundaries.ts` — Socrata loader pattern
- `C:/EV-Accounts/backend/scripts/load-fremont-council-boundaries.ts` — ArcGIS FeatureServer loader pattern (primary template)
- STATE.md — mtfcc registry (X0005-X0011), migration history, next migration 229

### Secondary (MEDIUM confidence)
- Portland.gov transition districts page — `https://www.portland.gov/transition/districts` — confirms 4-district charter reform context
- gis-pdx.opendata.arcgis.com — City of Portland open data portal, confirms dataset exists

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- ArcGIS endpoint URL and fields: HIGH — verified via direct HTTP calls 2026-05-29
- Coordinate system (outSR=4326 required): HIGH — layer metadata confirms WKID 102100 native
- Feature truncation bug (bulk=3, per-OBJECTID=4): HIGH — tested both approaches directly
- district_type='LOCAL': HIGH — essentialsService.ts source code verified
- geo_id pattern ('portland-or-council-district-{N}'): HIGH — STATE.md confirms Portland ME collision risk
- Migration 229: HIGH — DB query + STATE.md + migration file inventory all agree
- No pre-existing Portland OR council rows: HIGH — DB query confirmed 0 rows

**Research date:** 2026-05-29
**Valid until:** 2026-08-29 (stable — ArcGIS endpoints rarely change; charter reform districts are fixed for 4 years)
