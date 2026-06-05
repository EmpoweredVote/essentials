# Phase 91: MD TIGER Geofences - Research

**Researched:** 2026-06-05
**Domain:** TIGER 2024 boundary loading, PostGIS geofencing, Maryland legislative district structure
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Baltimore City is a Maryland independent city coextensive with a county. For any Baltimore City address, routing MUST return BOTH a G4110 row (LOCAL tier) AND a G4020 row (COUNTY tier). Smoke test must assert both rows.
- **D-02:** Baltimore County (separate G4020 entity surrounding but excluding Baltimore City) is a normal county row. A Baltimore County address must NOT return the G4110 Baltimore City row.
- **D-03:** Load one `geofence_boundaries` row per letter-district (47A and 47B are separate rows, not merged into district 47).
- **D-04:** Researcher must confirm actual SLDL boundary row count from TIGER file. Pre-flight assertion must use confirmed count, not hardcoded 47.
- **D-05:** Skip MD G4040 COUSUB entirely — explicitly out of scope for v11.0.
- **D-06:** `geofence_boundaries.state = '24'` (FIPS as string).
- **D-07:** `districts.state = 'md'` (lowercase) for COUNTY, STATE_UPPER, STATE_LOWER tiers; `districts.state = 'MD'` (uppercase) for NATIONAL_LOWER — same pattern as OR/MA/ME.
- **D-08:** Congressional districts use `cd119` loader key — TIGER 2024 file is `tl_2024_24_cd119.zip` (confirmed).
- **D-09:** G4110 layer must be dry-run first to confirm actual incorporated city count before live run.
- **D-10:** Section split check (0 rows = clean) MUST be run after all layers are loaded.

### Claude's Discretion

- Specific smoke test addresses (Baltimore City, rural MD county, Leonardtown/St. Mary's County)
- Exact MTFCC codes to claim for each layer
- Pre-flight assertion structure (follow OR/MA pattern: dry-run count assertions before live load)

### Deferred Ideas (OUT OF SCOPE)

- MD COUSUB (G4040 towns) — explicitly out of scope for v11.0; tracked in REQUIREMENTS.md Future Requirements for v12.0
- MD COUSUB coverage gap analysis — skipped per D-05
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MD-GEO-01 | MD TIGER G4110 incorporated cities loaded into geofence_boundaries (state='24') | TIGER URL confirmed; dry-run count approach; G4110 filter in loader |
| MD-GEO-02 | MD TIGER G4020 counties loaded (24 counties, state='24') | 24-county count confirmed from Maryland government structure; county TIGER URL confirmed |
| MD-GEO-03 | MD TIGER SLDU loaded (47 state senate districts) | 47-district count confirmed from official MD General Assembly structure |
| MD-GEO-04 | MD TIGER SLDL loaded (141 house delegate sub-district boundaries) | Actual boundary count confirmed as ~71 polygons (not 141); requirement description conflates delegate count with polygon count; see SLDL section |
| MD-GEO-05 | MD TIGER CD loaded (8 congressional districts) | 8-district count confirmed; cd119 key confirmed from actual URL |
| MD-GEO-06 | Any MD address returns correct federal, state, county, and local tiers via PostGIS routing | Baltimore City dual-tier invariant researched; smoke test addresses documented |
</phase_requirements>

---

## Summary

Phase 91 loads all Maryland TIGER 2024 boundary layers into `essentials.geofence_boundaries` with `state='24'` using the existing `load-state-tiger-boundaries.ts` generalized loader. The loader is NOT yet configured for Maryland — it must be added to `STATE_LAYER_ALLOWLIST`, `STATE_RUN_MAKEVALID`, `STATE_CITY_ASSERTIONS`, and a new `EXPECTED_MD_MTFCC` pre-flight assertion block must be added to `processLayer()`. This is the same pattern used for OR (Phase 72), MA (Phase 38), and ME (Phase 49).

The most important Maryland-specific requirement is the Baltimore City dual-tier: Baltimore City is an independent city coextensive with a county, analogous to San Francisco in California. Any Baltimore City address must return both a G4110 row (LOCAL, incorporated place) and a G4020 row (COUNTY, independent city-as-county). The loader handles this automatically because both the PLACE and COUNTY layers are loaded — the G4110 row comes from the PLACE shapefile and the G4020 row comes from the national COUNTY shapefile. No special handling is required in the loader itself; the smoke test must assert both rows.

The REQUIREMENTS.md says "141 house delegate sub-district boundaries" for MD-GEO-04 but this conflates delegate count (141 people) with polygon count. The TIGER SLDL shapefile has approximately 71 distinct polygon boundaries (one per letter-sub-district designation like 1A, 1B, 1C, 3, 4, 47A, 47B). The pre-flight assertion must use the confirmed dry-run count, not 141.

**Primary recommendation:** Add MD to the loader allowlist, add pre-flight assertion block, dry-run all layers to confirm counts, then live-load all five layers in a single command, then run the 7-gate verify SQL and the smoke test TypeScript.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TIGER file download | Script (Node.js) | — | Loader handles HTTP download with redirect following |
| Shapefile parsing | Script (Node.js) | — | `shapefile` npm package streams .shp/.dbf |
| Geometry storage | Database (PostGIS) | — | ST_SetSRID + ST_Force2D + optional ST_MakeValid on insert |
| Routing (address-to-district) | Database (PostGIS) | — | ST_Covers spatial query in essentialsService |
| District metadata | Database (districts table) | — | Written by loader alongside geofence_boundaries |
| Smoke test | Script (TypeScript/pg) | — | Adapted from OR pattern: smoke-or-geofences.ts |
| Verification SQL | Database (read-only queries) | — | Adapted from verify-or-tiger-import.sql |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | existing | TIGER loader — download, parse, upsert geofences + districts | Established loader for CA/TX/UT/IN/MA/ME/OR; adapting it for MD is the pattern |
| `shapefile` (npm) | existing | Streams .shp/.dbf records from extracted TIGER zip | Already installed in EV-Accounts backend |
| `adm-zip` (npm) | existing | Extracts TIGER zip files | Already installed |
| `pg` (npm) | existing | PostgreSQL client for upserts | Already installed |
| PostGIS | production Supabase | Stores geometries; ST_Covers for routing | Production DB |

### Loader Command Pattern (from OR Phase 72)

```bash
# Dry-run (no DB writes) — confirm layer counts before live load
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MD --fips 24 \
  --layers cd119,sldu,sldl,place,county \
  --dry-run

# Live load (after dry-run counts confirmed)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MD --fips 24 \
  --layers cd119,sldu,sldl,place,county
```

**Installation:** No new packages needed — all dependencies exist in EV-Accounts backend. [VERIFIED: loader script codebase inspection]

---

## Package Legitimacy Audit

> No new packages are installed in this phase. All code changes are to existing files in the EV-Accounts backend. This section is not applicable.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
Census TIGER 2024 URLs
        |
        v (HTTPS download, redirect-following)
  .tmp-tiger-2024-24/
  ├── tl_2024_24_cd119.zip  → extracted → .shp/.dbf
  ├── tl_2024_24_sldu.zip   → extracted → .shp/.dbf
  ├── tl_2024_24_sldl.zip   → extracted → .shp/.dbf
  ├── tl_2024_24_place.zip  → extracted → .shp/.dbf
  └── tl_2024_us_county.zip → extracted → .shp/.dbf (filtered STATEFP='24')
        |
        v (shapefile stream, per-record processing)
  processLayer()
  ├── STATEFP filter (county layer: filterByStatefp=true)
  ├── G4110 MTFCC filter (place layer only)
  ├── skipDistrictCodes filter (ZZZ/000 placeholder codes)
  ├── EXPECTED_MD_MTFCC pre-flight assertion [NEW — see Code Examples]
  └── upsertGeofence() → essentials.geofence_boundaries (state='24')
          + insertDistrictIfMissing() → essentials.districts (state='md'/'MD')
        |
        v (after all layers loaded)
  verify-md-tiger-import.sql  (7-gate SQL verification)
  smoke-md-geofences.ts       (3-address PostGIS routing test)
```

### Recommended Project Structure

No new directory structure needed. Files to create or modify:

```
C:/EV-Accounts/backend/scripts/
├── load-state-tiger-boundaries.ts   [MODIFY — add MD to 4 config blocks]
├── verify-md-tiger-import.sql       [CREATE — adapted from verify-or-tiger-import.sql]
└── smoke-md-geofences.ts            [CREATE — adapted from smoke-or-geofences.ts]
```

### Pattern 1: Adding a New State to the TIGER Loader

**What:** Four code changes required in `load-state-tiger-boundaries.ts` to support a new state.

**When to use:** Every new state onboarding (MD is the 8th state after CA/TX/UT/IN/MA/ME/OR).

**Changes required:**

```typescript
// 1. STATE_LAYER_ALLOWLIST — which layers are safe for this state
// Source: D-08 (cd119 key confirmed), D-05 (no cousub)
MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),

// 2. STATE_CITY_ASSERTIONS — sentinel city verification before write
// Source: D-01 (Baltimore City must exist in place layer)
MD: ['Baltimore city'],

// 3. STATE_RUN_MAKEVALID — which layers get ST_MakeValid wrapping
// Source: OR pattern (same 5 layers all get MakeValid)
MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),

// 4. EXPECTED_MD_MTFCC block inside processLayer() — pre-flight assertion
// Source: D-04 (confirmed counts from dry-run; see Pitfall 1)
if (fipsArg === '24') {
  const EXPECTED_MD_MTFCC: Record<string, number> = {
    cd119:  8,   // 8 MD congressional districts (post-2022 redistricting)
    sldu:  47,   // 47 MD Senate districts (1 senator each)
    sldl:  TBD,  // confirmed via dry-run — see D-04; expected ~71
    place: TBD,  // confirmed via dry-run — see D-09; expected ~311
    county: 24,  // 24 MD counties (including Baltimore City independent city)
  };
  // ... same assertion pattern as OR/MA/ME blocks
}
```

### Pattern 2: Baltimore City Dual-Tier (D-01 Invariant)

**What:** Baltimore City appears in BOTH the PLACE layer (G4110) AND the COUNTY layer (G4020). The loader handles this automatically — no special code needed.

**How it works in TIGER:**
- PLACE shapefile: contains `Baltimore city` with `MTFCC='G4110'`, `GEOID='2404000'`
- COUNTY shapefile: contains `Baltimore city` (as independent city/county) with `MTFCC='G4020'`, `GEOID='24510'`
- Both records pass through `upsertGeofence()` normally — they have different `(geo_id, mtfcc)` pairs so there is no conflict

**Smoke test assertion:** For any Baltimore City coordinate, both of these rows must be returned:

```sql
-- Expected rows for a Baltimore City address:
-- geo_id='2404000', mtfcc='G4110' (LOCAL tier — incorporated city)
-- geo_id='24510',   mtfcc='G4020' (COUNTY tier — independent city-as-county)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-76.6107, 39.2908), 4326))
ORDER BY mtfcc;
-- Expected: G4020 (24510), G4110 (2404000), G5200, G5210, G5220 — 5 rows total
```

**Baltimore County distinction (D-02):** Baltimore County has GEOID `24005`. A coordinate inside Baltimore County (e.g., Towson) must NOT return the G4110 row with geo_id='2404000'. Only coordinates inside the Baltimore City incorporated place boundary return that row.

### Anti-Patterns to Avoid

- **Hardcoding 47 as the SLDL count:** MD SLDL has ~71 polygons (sub-districts), not 47 (senate districts) and not 141 (delegates). Hardcoding any of these without a dry-run confirmation creates a silent load failure. Always dry-run first.
- **Adding `cousub` to MD allowlist:** D-05 explicitly prohibits this. Do not add `cousub` to `STATE_LAYER_ALLOWLIST['MD']`.
- **Using `cd` instead of `cd119`:** The congressional file is `tl_2024_24_cd119.zip`. The loader key must be `cd119`. Using `cd` causes a 404 download failure.
- **Omitting MD from `STATE_RUN_MAKEVALID`:** Without `ST_MakeValid`, invalid geometries may be inserted. The PLACE layer in particular may have self-intersections. Follow OR pattern: all 5 layers get `ST_MakeValid`.
- **Confusing Baltimore City (G4110 geo_id=2404000) with Baltimore City-as-county (G4020 geo_id=24510):** These are two separate rows with different geo_ids and mtfcc values. Both must exist. See D-01 invariant.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER file download | Custom HTTP client | `downloadWithRedirects()` in loader | Already handles redirects, caching, error cleanup |
| Shapefile parsing | Custom .dbf reader | `shapefile` npm package | TIGER .dbf has encoding quirks; loader uses utf-8 option |
| Geometry insert | Raw WKT SQL | `upsertGeofence()` helper | Handles ST_MakeValid, ST_Force2D, ON CONFLICT, state/mtfcc correctly |
| District row insert | Manual INSERT | `insertDistrictIfMissing()` helper | WHERE NOT EXISTS guard, correct state casing (abbrev vs abbrevUpper) |
| Column name resolution | Hardcoded field names | `resolveColumn()` with candidates | TIGER field names drift between vintages (GEOID vs GEOID20 vs GEOID10) |

**Key insight:** The loader script already handles all TIGER-specific complexity. The only implementation work is adding MD to four configuration blocks and writing the verification/smoke scripts.

---

## TIGER Layer Specifications

### Confirmed TIGER 2024 URLs for Maryland (FIPS 24)

| Layer | Loader Key | MTFCC | URL | File Size | district_type |
|-------|-----------|-------|-----|-----------|---------------|
| Congressional | `cd119` | G5200 | `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_24_cd119.zip` | 711K | NATIONAL_LOWER |
| State Senate | `sldu` | G5210 | `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_24_sldu.zip` | 1.6M | STATE_UPPER |
| State House | `sldl` | G5220 | `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_24_sldl.zip` | 2.1M | STATE_LOWER |
| Incorporated Places | `place` | G4110 | `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_24_place.zip` | 2.6M | LOCAL |
| Counties | `county` | G4020 | `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip` | (US-wide, filtered by STATEFP='24') | COUNTY |

All URLs verified as existing files on census.gov. [VERIFIED: WebFetch of each TIGER directory]

### MTFCC Codes per Layer

| MTFCC | Standard Meaning | MD Usage |
|-------|-----------------|----------|
| G5200 | Congressional District | 8 MD CDs |
| G5210 | State Senate District (SLDU) | 47 MD senate districts |
| G5220 | State House District (SLDL) | ~71 MD delegate sub-districts |
| G4110 | Incorporated Place | MD cities and towns (count TBD by dry-run) |
| G4020 | County | 24 MD counties + Baltimore City (as independent city-county) |

Note: MD follows the STANDARD TIGER mtfcc pattern (G5210=STATE_UPPER, G5220=STATE_LOWER). This is the inverse of pre-existing CA rows (which use G5220=STATE_UPPER, G5210=STATE_LOWER due to historical ingest). MD has no pre-existing rows, so the standard pattern applies. [ASSUMED — no pre-existing MD rows confirmed from loader script inspection showing MD not in allowlist]

---

## Confirmed Counts

### Counts Confirmed from Authoritative Sources

| Layer | Count | Source | Confidence |
|-------|-------|--------|------------|
| G4020 counties | 24 | Maryland government official count; 23 counties + Baltimore City independent city | [VERIFIED: official MD state docs pattern] |
| SLDU senate districts | 47 | Maryland General Assembly official structure | [VERIFIED: mgaleg.maryland.gov] |
| CD congressional | 8 | Post-2022 redistricting; confirmed from TIGER URL path | [VERIFIED: census.gov TIGER directory] |

### Counts Requiring Dry-Run Confirmation (D-04, D-09)

| Layer | Expected Range | Notes |
|-------|----------------|-------|
| SLDL (G5220) | ~71 | MSA Maryland manual lists 71 sub-district designations. REQUIREMENTS.md says "141" but that is the delegate count, not polygon count. Each sub-district like 1A, 1B, 47A, 47B is one polygon; whole-district designations like 3, 4 are also one polygon each. Dry-run MUST confirm exact count. |
| Place (G4110) | ~311 | TIGERweb ACS24 BAS25 table for MD shows 311 rows all tagged G4110. Earlier query returned 243 (possibly a different vintage or filtering). Dry-run MUST confirm exact count. |

**Action required:** Set `EXPECTED_MD_MTFCC` with placeholder values of `TBD` comments; replace after dry-run produces `MtfccAssertionError` with the actual count.

---

## Sub-District Breakdown (SLDL D-03/D-04)

The 71 SLDL polygon designations from MSA Maryland (msa.maryland.gov, official):

```
1A, 1B, 1C, 2A, 2B, 3, 4, 5, 6, 7A, 7B, 8, 9A, 9B, 10,
11A, 11B, 12A, 12B, 13, 14, 15, 16, 17, 18, 19, 20, 21,
22, 23, 24, 25, 26, 27A, 27B, 27C, 28, 29A, 29B, 29C,
30A, 30B, 31, 32, 33A, 33B, 33C, 34A, 34B, 35A, 35B,
36, 37A, 37B, 38A, 38B, 38C, 39, 40, 41, 42A, 42B, 42C,
43A, 43B, 44A, 44B, 45, 46, 47A, 47B
```

Count: 71 sub-district designations. [CITED: msa.maryland.gov/msa/mdmanual/06hse/html/hsedist.html]

Districts with sub-letters: 1 (3 subs), 2 (2), 7 (2), 9 (2), 11 (2), 12 (2), 27 (3), 29 (3), 30 (2), 33 (3), 34 (2), 35 (2), 37 (2), 38 (3), 42 (3), 43 (2), 44 (2), 47 (2) = 18 districts with sub-letters
Districts without sub-letters: 29 single-polygon districts

Each row in the TIGER SLDL file corresponds to one of these 71 designations. The SLDLST field in the shapefile encodes the suffix (e.g., "001A" for 1A, "047B" for 47B). The loader's `districtNumField: ['SLDLST']` reads this field; `skipDistrictCodes: new Set(['ZZZ', '000'])` filters placeholder rows.

---

## Baltimore City Sentinel Values

| Tier | geo_id | mtfcc | Name in TIGER | How obtained |
|------|--------|-------|---------------|-------------|
| G4110 (LOCAL) | `2404000` | G4110 | `Baltimore city` | STATEFP=24 + PLACEFP=04000; confirmed via Data Commons + Geocodio |
| G4020 (COUNTY) | `24510` | G4020 | `Baltimore city` | State FIPS 24 + County FIPS 510; confirmed via Geocodio + FIPS tables |

[CITED: datacommons.org/place/geoId/2404000, geocod.io/geoids/maryland/baltimore-city-24510/]

Baltimore County (separate entity, surrounds the city): geo_id = `24005` (FIPS 24 + county code 005). Smoke test must confirm a Towson (Baltimore County) coordinate does NOT return geo_id='2404000'.

---

## Smoke Test Addresses

Three addresses covering the required test scenarios:

### Address 1: Baltimore City Hall (D-01 invariant — must return BOTH G4110 AND G4020)

```typescript
{
  label: 'Baltimore City Hall',
  lon: -76.6107,
  lat: 39.2908,
  expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  // D-01: both G4110 (city) AND G4020 (city-as-county) must be present
  expectedGeoIds: {
    G4110: '2404000',  // Baltimore city (incorporated place)
    G4020: '24510',    // Baltimore city (independent city-county)
  },
}
```

Coordinates [CITED: latitude.to/articles-by-country/us/united-states/51102/baltimore-city-hall]: lat=39.2908, lon=-76.6107

### Address 2: Garrett County Rural Point (no G4110 — unincorporated county)

```typescript
{
  label: 'Rural Garrett County MD (unincorporated)',
  lon: -79.3,
  lat: 39.53,
  // Garrett County FIPS 24023 — rural, few incorporated places
  expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
  forbiddenMtfcc: ['G4110'],
  // Success criteria: 4 tiers (COUNTY + NATIONAL_LOWER + STATE_UPPER + STATE_LOWER), no LOCAL
}
```

Coordinates [CITED: latitude.to/articles-by-country/us/united-states/17948/garrett-county-maryland]: Garrett County center ~39.53, -79.27. Use a confirmed rural point; verify no incorporated place boundary covers this point.

### Address 3: Leonardtown MD (St. Mary's County — Phase 95 dependency)

```typescript
{
  label: 'Leonardtown MD (St. Mary\'s County seat)',
  lon: -76.6358,
  lat: 38.2912,
  expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  // St. Mary's County FIPS 24037; Leonardtown is an incorporated town
  // Phase 95 depends on St. Mary's County G4020 boundary existing
}
```

Coordinates [CITED: latitude.to/map/us/united-states/cities/leonardtown]: lat=38.2912, lon=-76.6358

**Note on Garrett County coordinate:** The center coordinate may fall inside the Town of Oakland (an incorporated G4110 place in Garrett County). If the dry-run/smoke test shows G4110 is returned, shift the coordinate further north or west to a confirmed unincorporated area. This is the same issue the OR Phase 72 smoke test encountered (Bend OR coordinate shifted from -121.3153, 44.0582 to -121.4, 44.12).

---

## Loader Modifications Required (All Additions to Existing File)

### 1. STATE_LAYER_ALLOWLIST Addition

```typescript
// In STATE_LAYER_ALLOWLIST:
MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

Note: `cd119` (not `cd`) because the file is `tl_2024_24_cd119.zip`. [VERIFIED: census.gov TIGER directory]

### 2. STATE_CITY_ASSERTIONS Addition

```typescript
// In STATE_CITY_ASSERTIONS:
MD: ['Baltimore city'],
```

This causes the loader to verify that 'Baltimore city' appears in the PLACE layer before writing any rows, matching the OR pattern for 'Portland city'.

### 3. STATE_RUN_MAKEVALID Addition

```typescript
// In STATE_RUN_MAKEVALID:
MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

Same pattern as OR and ME — all 5 layers get ST_MakeValid.

### 4. EXPECTED_MD_MTFCC Block in processLayer()

```typescript
// Add after the OR block (fipsArg === '41'), before the stream pass:
if (fipsArg === '24') {
  const EXPECTED_MD_MTFCC: Record<string, number> = {
    cd119:  8,    // 8 MD congressional districts (post-2022 redistricting)
    sldu:  47,    // 47 MD Senate districts
    sldl: TBD,   // confirmed via dry-run — expected ~71 sub-district polygons
    place: TBD,  // confirmed via dry-run — expected ~311 G4110 incorporated places
    county: 24,  // 24 MD counties (23 counties + Baltimore City independent city)
  };
  if (layer in EXPECTED_MD_MTFCC) {
    const expected = EXPECTED_MD_MTFCC[layer];
    let actualCount = 0;
    await streamShapefile(shpPath, dbfPath, async (_geom, props) => {
      if (layerDef.filterByStatefp) {
        const statefpKey = resolveColumn(props, ['STATEFP', 'STATEFP20', 'STATEFP10']);
        if (String(props[statefpKey] ?? '') !== fipsArg) return;
      }
      if (layer === 'place') {
        const mtfccRaw = (props['MTFCC'] ?? props['mtfcc'] ?? '') as string;
        if (mtfccRaw && mtfccRaw !== 'G4110') return;
      }
      if (layerDef.districtNumField) {
        const fpKey = resolveColumn(props, layerDef.districtNumField);
        const fpVal = String(props[fpKey] ?? '');
        if (layerDef.skipDistrictCodes.has(fpVal)) return;
      }
      actualCount++;
    });
    if (actualCount !== expected) {
      const err = new Error(
        `[MD MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
        `TIGER file: ${url}. Aborting before any DB write.`
      );
      err.name = 'MtfccAssertionError';
      throw err;
    }
    console.log(`  [${layer}] MD MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
  }
}
```

**TBD values:** Replace `TBD` with actual counts from the dry-run output before the live run.

---

## Verification Script: verify-md-tiger-import.sql

Adapted from `verify-or-tiger-import.sql` — 7 gates:

```sql
-- Phase 91 MD TIGER import verification — SELECT only, no writes
-- Run via: psql $DATABASE_URL -f backend/scripts/verify-md-tiger-import.sql

-- Gate 1: No invalid geometries — MUST return 0
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '24' AND NOT ST_IsValid(geometry);
-- Expected: 0

-- Gate 2: No GeometryCollection types — MUST return 0
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '24'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');
-- Expected: 0

-- Gate 3: Per-layer row counts (MD-GEO-01/02/03/04/05)
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '24'
GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|24, G4110|[DRY-RUN-COUNT], G5200|8, G5210|47, G5220|[DRY-RUN-COUNT]
-- (Update expected counts after dry-run)

-- Gate 4: Baltimore City dual-tier sentinel (D-01 invariant)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24' AND geo_id IN ('2404000', '24510');
-- Expected: 2 rows
-- geo_id='2404000', name='Baltimore city', mtfcc='G4110'
-- geo_id='24510',   name='Baltimore city', mtfcc='G4020'

-- Gate 5: districts table counts for Maryland (case-sensitive)
SELECT state, district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state IN ('MD', 'md')
GROUP BY state, district_type ORDER BY state, district_type;
-- Expected:
--   md  | COUNTY         | 24
--   md  | STATE_LOWER    | [DRY-RUN-COUNT, ~71]
--   md  | STATE_UPPER    | 47
--   MD  | NATIONAL_LOWER |  8
-- (cd119 writes district rows with state=abbrevUpper='MD' per loader D-02 pattern)

-- Gate 6: St. Mary's County sentinel (Phase 95 prerequisite)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24' AND mtfcc = 'G4020' AND name LIKE '%Mary%';
-- Expected: 1 row with name='St. Mary''s County', geo_id='24037'

-- Gate 7: Section-split check — any district row missing a matching geofence row
SELECT d.geo_id, d.district_type, d.state
FROM essentials.districts d
WHERE d.state IN ('MD', 'md')
  AND d.geo_id NOT IN (SELECT geo_id FROM essentials.geofence_boundaries WHERE state = '24')
LIMIT 10;
-- Expected: 0 rows (all district geo_ids must have geofence coverage)
```

---

## Common Pitfalls

### Pitfall 1: SLDL Count Confusion (141 vs 71 vs 47)

**What goes wrong:** Planner hardcodes `sldl: 141` in EXPECTED_MD_MTFCC based on REQUIREMENTS.md wording ("141 house delegate sub-district boundaries"). Loader then throws MtfccAssertionError on the actual ~71 polygons, blocking the load.

**Why it happens:** REQUIREMENTS.md uses "141" to describe the 141 delegate positions, not the polygon count. Maryland has 47 multi-member districts; some districts are divided into letter sub-districts (1A, 1B, 1C), so the total polygon count is ~71 not 141.

**How to avoid:** Always dry-run first. Let the MtfccAssertionError reveal the actual count. Update `EXPECTED_MD_MTFCC.sldl` with the actual count before live run.

**Warning signs:** If dry-run shows "would write 141 rows" — something is wrong (TIGER doesn't have 141 SLDL polygons for MD).

### Pitfall 2: G4110 Count Uncertainty

**What goes wrong:** TIGERweb shows different counts depending on which query/vintage is used (ACS24 = 311, other queries = 243, 358). Hardcoding any of these fails the pre-flight assertion.

**Why it happens:** Different Census data products filter differently. The TIGER 2024 shapefile for MD PLACE (`tl_2024_24_place.zip`) is authoritative; TIGERweb tables may include CDPs or historical records.

**How to avoid:** Always dry-run the place layer. MtfccAssertionError output gives the actual count. Update the assertion and proceed.

**Warning signs:** Expected 243 but got 311 → wrong TIGERweb vintage used as reference.

### Pitfall 3: Baltimore County vs Baltimore City Confusion

**What goes wrong:** Smoke test passes for "Baltimore" without specifying which one. A Baltimore County address returns G4110 because the tester used a coordinate inside Baltimore City by accident.

**Why it happens:** "Baltimore" is ambiguous — Baltimore City (independent city, G4110+G4020) vs Baltimore County (suburban county surrounding the city, G4020 only). They share no geographic overlap.

**How to avoid:** 
- Baltimore City: use coordinates like City Hall (-76.6107, 39.2908) — must return BOTH G4110 geo_id=2404000 AND G4020 geo_id=24510
- Baltimore County: use Towson coordinates (county seat, -76.6052, 39.4016) — must return G4020 geo_id=24005, must NOT return G4110 geo_id=2404000

### Pitfall 4: Wrong Loader Key (cd vs cd119)

**What goes wrong:** Planner specifies `cd` as the congressional layer key. The loader checks `STATE_LAYER_ALLOWLIST['MD']` and `cd` isn't in it; fails with "layer 'cd' not in allowlist for MD".

**Why it happens:** Some states use `cd`, others use `cd119`. MD's congressional file is named `tl_2024_24_cd119.zip`, requiring the `cd119` key.

**How to avoid:** Always verify the actual filename on census.gov before configuring the allowlist. D-08 confirms: use `cd119` for MD.

### Pitfall 5: Garrett County Smoke Point Inside Oakland city

**What goes wrong:** Smoke test for "rural unincorporated" Garrett County uses county center coordinate (-79.27, 39.53) but Oakland city (G4110) covers that area.

**Why it happens:** Garrett County's county seat Oakland city (GEOID~2456200) is near the geographic center.

**How to avoid:** Run the smoke test after load and check if G4110 is returned for the Garrett County test point. If it is, shift the coordinate to a confirmed rural point, e.g., (-79.45, 39.65) in the NW corner of the county away from incorporated places.

### Pitfall 6: districts.state Casing Error

**What goes wrong:** Verification Gate 5 returns 0 rows for `state='md'` or `state='MD'` because the wrong casing was written.

**Why it happens:** The loader uses `abbrev` (lowercase, e.g., `'md'`) for STATE_UPPER/STATE_LOWER/COUNTY and `abbrevUpper` (uppercase, e.g., `'MD'`) for NATIONAL_LOWER (congressional). This is automatic — but mis-configuring the state or fips arguments breaks it.

**How to avoid:** Run with `--state MD --fips 24`. The loader validates `FIPS_TO_STATE['24'] === 'md'` and derives `abbrevUpper = 'MD'` automatically. Never pass `--state md` (lowercase); the loader does `.toUpperCase()` but the allowlist key is `'MD'`.

---

## Section Split Check Query (D-10)

Adapted from LOCATION-ONBOARDING.md:

```sql
-- Run after all MD layers loaded; must return 0 rows
SELECT d.geo_id, d.district_type, d.state
FROM essentials.districts d
WHERE d.state IN ('MD', 'md')
  AND d.geo_id NOT IN (
    SELECT geo_id FROM essentials.geofence_boundaries WHERE state = '24'
  )
LIMIT 10;
-- Expected: 0 rows
```

This is identical to Gate 7 in the verify SQL above. [VERIFIED: verify-or-tiger-import.sql Gate 7 pattern]

---

## Code Examples

### Running the Loader (Dry-Run First)

```bash
# From C:/EV-Accounts/backend:
# Step 1: Dry-run to see URLs and confirm layer config (no DB writes)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MD --fips 24 \
  --layers cd119,sldu,sldl,place,county \
  --dry-run

# Step 2: After updating TBD counts from Step 1 output, run live
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MD --fips 24 \
  --layers cd119,sldu,sldl,place,county
```

### D-01 Smoke Assertion (Baltimore City Dual-Tier)

```typescript
// Source: adapted from smoke-or-geofences.ts
const TEST_ADDRESSES: AddressTest[] = [
  {
    label: 'Baltimore City Hall',
    lon: -76.6107,
    lat: 39.2908,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
    expectedGeoIds: {
      G4110: '2404000', // Baltimore city (incorporated place)
      G4020: '24510',   // Baltimore city (independent city-county)
    },
  },
  {
    label: 'Rural Garrett County MD (unincorporated)',
    lon: -79.3,
    lat: 39.53,
    expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
    forbiddenMtfcc: ['G4110'],
  },
  {
    label: 'Leonardtown MD (St. Mary\'s County)',
    lon: -76.6358,
    lat: 38.2912,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  },
];
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-state loader scripts | Single generalized `load-state-tiger-boundaries.ts` | Phase 130 (Tiger Generalization) | MD is state #8; just add to config blocks |
| shp2pgsql shell command | `shapefile` npm package in TypeScript | Phase 130 | No system-level tool needed; runs on Windows PowerShell via `npx tsx` |
| Manual geometry validation | `STATE_RUN_MAKEVALID` per-state/per-layer config | Phase 131 D-07..D-09 | Follow OR pattern: all 5 MD layers get ST_MakeValid |
| Hardcoded expected counts | `MtfccAssertionError` pattern + dry-run | Phase 72 (OR) | Dry-run reveals actual count; live run locked to confirmed count |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MD G4110 count is ~311 (from TIGERweb ACS24 BAS25 MD table showing 311 rows all G4110) | Confirmed Counts | Dry-run will catch this; pre-flight assertion blocks any wrong count from loading |
| A2 | SLDL polygon count is 71 (from MSA Maryland authoritative list of 71 sub-district designations) | Sub-District Breakdown | Dry-run will catch this; if TIGER has different count, assertion fails before write |
| A3 | Garrett County rural coordinate (-79.3, 39.53) is outside all incorporated places | Smoke Test Addresses | Smoke test will detect G4110 return if wrong; fix by shifting coordinate |
| A4 | No pre-existing MD geofence rows in production DB (MD not in STATE_LAYER_ALLOWLIST, no MD scripts exist) | Architecture Patterns | Upsert uses ON CONFLICT DO NOTHING — safe if rows exist; but verify gate would show wrong counts |
| A5 | districts.state uses standard TIGER pattern (G5210=STATE_UPPER, G5220=STATE_LOWER) — no CA inversion | TIGER Layer Specifications | Gate 5 in verify SQL would show 0 COUNTY or wrong tier mapping |

**If this table is empty:** All claims in this research were verified or cited. (This table is not empty — five assumed claims are listed above, all with dry-run or smoke-test safety nets.)

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npx tsx | Running loader script | ✓ | (existing EV-Accounts backend) | — |
| DATABASE_URL env var | Loader + smoke test + psql | ✓ | (production Supabase connection string) | — |
| census.gov HTTPS access | TIGER file download | ✓ | — | — |
| `shapefile` npm package | Shapefile parsing | ✓ | (already installed in backend) | — |
| `adm-zip` npm package | Zip extraction | ✓ | (already installed) | — |
| psql CLI | verify-md-tiger-import.sql | ✓ | (EV-Accounts dev environment) | Use Supabase execute_sql MCP for individual queries |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom TypeScript smoke test + SQL verification (no Jest/Vitest — matches OR/MA/ME pattern) |
| Config file | none — standalone scripts |
| Quick run command | `npx tsx scripts/smoke-md-geofences.ts` |
| Full suite command | `psql $DATABASE_URL -f scripts/verify-md-tiger-import.sql` then `npx tsx scripts/smoke-md-geofences.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MD-GEO-01 | G4110 rows present with correct count | SQL verification (Gate 3) | `psql $DATABASE_URL -f verify-md-tiger-import.sql` | ❌ Wave 0 |
| MD-GEO-02 | G4020 rows = 24 counties | SQL verification (Gate 3 + Gate 6) | same | ❌ Wave 0 |
| MD-GEO-03 | G5210 rows = 47 | SQL verification (Gate 3) | same | ❌ Wave 0 |
| MD-GEO-04 | G5220 rows = [confirmed count] | SQL verification (Gate 3) | same | ❌ Wave 0 |
| MD-GEO-05 | G5200 rows = 8 | SQL verification (Gate 3) | same | ❌ Wave 0 |
| MD-GEO-06 | Address routing returns correct tiers | TypeScript smoke test (3 addresses) | `npx tsx scripts/smoke-md-geofences.ts` | ❌ Wave 0 |
| D-01 | Baltimore City returns G4110 AND G4020 | TypeScript smoke test (Address 1) | same | ❌ Wave 0 |
| D-02 | Baltimore County address returns NO G4110 city | Optional Gate in smoke test | same | ❌ Wave 0 |
| D-10 | Section split check = 0 rows | SQL verification (Gate 7) | `psql $DATABASE_URL -f verify-md-tiger-import.sql` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `scripts/verify-md-tiger-import.sql` — 7-gate verification (adapt from verify-or-tiger-import.sql)
- [ ] `scripts/smoke-md-geofences.ts` — 3-address smoke test (adapt from smoke-or-geofences.ts)
- [ ] `STATE_LAYER_ALLOWLIST['MD']` entry in load-state-tiger-boundaries.ts
- [ ] `STATE_CITY_ASSERTIONS['MD']` entry in load-state-tiger-boundaries.ts
- [ ] `STATE_RUN_MAKEVALID['MD']` entry in load-state-tiger-boundaries.ts
- [ ] `EXPECTED_MD_MTFCC` block in processLayer() in load-state-tiger-boundaries.ts

---

## Security Domain

> This phase is pure infrastructure — TIGER boundary loading into a PostGIS database. No user-facing inputs, no authentication flows, no API endpoints modified. ASVS categories V2/V3/V4/V6 do not apply. V5 input validation is handled by the existing loader (ON CONFLICT DO NOTHING guards; geometry validated via ST_IsValid gate). No security domain concerns beyond standard DB write access controls already in place.

---

## Sources

### Primary (HIGH confidence)

- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — Full loader code inspection; STATE_LAYER_ALLOWLIST (MD absent), FIPS_TO_STATE ('24': 'md'), LAYER_DISPATCH definitions, processLayer() pattern, per-state assertion block structure
- `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` — 7-gate verification pattern to adapt
- `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` — 3-address smoke test pattern to adapt
- `C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql` — MA verification pattern for reference
- `https://www2.census.gov/geo/tiger/TIGER2024/CD/` — Confirmed `tl_2024_24_cd119.zip` exists (711K)
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/` — Confirmed `tl_2024_24_sldu.zip` exists (1.6M)
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/` — Confirmed `tl_2024_24_sldl.zip` exists (2.1M)
- `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/` — Confirmed `tl_2024_24_place.zip` exists (2.6M)
- `https://msa.maryland.gov/msa/mdmanual/06hse/html/hsedist.html` — Official MD House of Delegates district list; 71 sub-district designations counted
- `https://mgaleg.maryland.gov/mgawebsite/Members/Index/house` — MD General Assembly house member listing; confirmed sub-district structure
- `https://tigerweb.geo.census.gov/tigerwebmain/Files/bas25/tigerweb_bas25_incplace_2024_acs24_md.html` — MD incorporated places ACS24; 311 rows all G4110; Baltimore city GEOID=2404000
- `https://www.geocod.io/geoids/maryland/baltimore-city-24510/` — Baltimore City county FIPS=24510 confirmed

### Secondary (MEDIUM confidence)

- `https://datacommons.org/place/geoId/2404000` — Baltimore city place geo_id=2404000 confirmation
- `https://en.wikipedia.org/wiki/List_of_current_members_of_the_Maryland_House_of_Delegates` — Delegate district listing (cross-reference for sub-district structure)
- `https://latitude.to/articles-by-country/us/united-states/51102/baltimore-city-hall` — Baltimore City Hall coordinates (lat=39.2910, lon=-76.6107)
- `https://latitude.to/map/us/united-states/cities/leonardtown` — Leonardtown coordinates (lat=38.2912, lon=-76.6358)
- `https://latitude.to/articles-by-country/us/united-states/17948/garrett-county-maryland` — Garrett County center coordinates

### Tertiary (LOW confidence — validate via dry-run)

- TIGERweb BAS25 MD incorporated places count of 311 — exact G4110 count must be confirmed by dry-run
- SLDL count of 71 from MSA Maryland list — must be confirmed by dry-run (TIGER may include or exclude additional boundary records)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — loader script is well-established, all TIGER URLs confirmed on census.gov
- Architecture: HIGH — identical pattern to OR Phase 72; 4 config additions + 2 new scripts
- SLDL count: MEDIUM — 71 from authoritative state source, but TIGER file is authoritative; dry-run required
- G4110 count: MEDIUM — 311 from TIGERweb, but discrepancy with other queries noted; dry-run required
- Smoke test coordinates: MEDIUM — need smoke test to confirm Garrett County point is truly unincorporated

**Research date:** 2026-06-05
**Valid until:** 2026-12-05 (TIGER 2024 files are stable; loader pattern changes only with code PRs)
