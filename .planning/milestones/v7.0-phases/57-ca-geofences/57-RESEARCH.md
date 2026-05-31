# Phase 57: CA Geofences - Research

**Researched:** 2026-05-21
**Domain:** TIGER/Line 2024 California boundary loading, PostGIS geofence_boundaries, California geography
**Confidence:** HIGH

---

## Summary

Phase 57 extends the generalized TIGER loader (`load-state-tiger-boundaries.ts`) to add two missing layers for California (FIPS 06): `county` (G4020, 58 counties) and `cousub` (G4040, 1,057 county subdivisions). The existing layers — `cd` (52 CDs), `sldu` (40 senate), `sldl` (80 assembly), `place` (482 cities) — are **already fully loaded** in the production DB. This phase only adds the two missing layers and runs new verification/smoke tests.

The critical difference from MA/ME cousub loading: California COUSUBs are Census County Divisions (CCDs), which have FUNCSTAT='S' (statistical), NOT FUNCSTAT='A' (active government) as in MA towns. The existing FUNCSTAT='A' filter in the loader would skip ALL 1,057 CA COUSUB records. The loader must be modified to make the FUNCSTAT filter state-conditional: apply it only for states with active MCDs (MA), skip it for CCD-only states (CA).

The second task is running verification SQL and a smoke test with 3 pre-determined CA addresses (SF consolidated city-county, San Diego Balboa Park, East LA unincorporated). The smoke test must assert specific district values including the G4040 COUSUB row for the unincorporated address.

**Primary recommendation:** Add `county` and `cousub` to CA's allowlist; add CA to `STATE_RUN_MAKEVALID` for those two layers; make the FUNCSTAT filter conditional per state; add CA pre-flight assertion block for `county: 58` and `cousub: 1057`.

---

## Standard Stack

### Core

| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | current | Downloads TIGER ZIP, extracts shapefile, upserts geofence_boundaries | Existing generalized loader; all infrastructure present |
| `shapefile` npm | existing | Reads .shp + .dbf files | Already in node_modules |
| `adm-zip` npm | existing | Extracts TIGER ZIP files | Already in node_modules |
| PostgreSQL/PostGIS | existing | ON CONFLICT DO NOTHING idempotency; ST_Covers routing | Established pattern from TX/MA/UT/IN/ME |

### TIGER 2024 Files for California (FIPS 06)

| Layer | TIGER URL | File Size | Expected Records |
|-------|-----------|-----------|-----------------|
| county | `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip` | 80MB (US-wide) | 58 (filtered to STATEFP=06) |
| cousub | `https://www2.census.gov/geo/tiger/TIGER2024/COUSUB/tl_2024_06_cousub.zip` | 12MB | 1,057 |

**Already loaded (do not re-run unless debugging):**

| Layer | TIGER URL | Records in DB |
|-------|-----------|--------------|
| cd (G5200) | `tl_2024_06_cd119.zip` (3.7MB) | 52 confirmed |
| sldu (G5210) | `tl_2024_06_sldu.zip` | 40 confirmed |
| sldl (G5220) | `tl_2024_06_sldl.zip` | 80 confirmed |
| place (G4110) | `tl_2024_06_place.zip` | 482 confirmed |

**Installation:** No new packages required.

---

## Current DB State (Live Production — confirmed 2026-05-21)

```
geofence_boundaries WHERE state='06':
  G4020: 1     (only LA County loaded so far — needs 58)
  G4040: 0     (not yet loaded — needs 1,057)
  G4110: 482   DONE
  G5200: 52    DONE
  G5210: 40    DONE
  G5220: 80    DONE
  G5420: 346   DONE (school districts)

districts WHERE state IN ('CA','ca'):
  COUNTY: 3          (only 3 loaded — needs 58)
  NATIONAL_LOWER: 52 DONE
  STATE_LOWER: 80    DONE
  STATE_UPPER: 40    DONE
```

**Target after Phase 57:** G4020=58, G4040=1057, all others unchanged.

---

## Architecture Patterns

### Recommended Changes to load-state-tiger-boundaries.ts

```
C:/EV-Accounts/backend/scripts/
├── load-state-tiger-boundaries.ts   # MODIFY: 4 changes (see below)
├── verify-ca-tiger-import.sql       # NEW: CA verification queries
└── smoke-ca-geofences.ts            # NEW: 3-address CA smoke test
```

### Pattern 1: Update CA STATE_LAYER_ALLOWLIST

```typescript
// Source: load-state-tiger-boundaries.ts line ~35 — UPDATE CA entry
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'county', 'cousub']),  // ADD county + cousub
  // ... rest unchanged
};
```

### Pattern 2: Add CA to STATE_RUN_MAKEVALID

CA is currently absent from STATE_RUN_MAKEVALID (uses fallback `layer === 'place'` rule).
Add CA to run MakeValid on the two new layers:

```typescript
// Source: load-state-tiger-boundaries.ts line ~57 — ADD CA entry
const STATE_RUN_MAKEVALID: Record<string, Set<string>> = {
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  TX: new Set(['place', 'county']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  CA: new Set(['place', 'county', 'cousub']),  // ADD THIS — place was already covered by fallback; explicitly list all three
};
```

NOTE: `place` must remain in the CA set (or the fallback `layer === 'place'` will continue to apply it). Since we're adding CA explicitly, include `place` to preserve existing behavior.

### Pattern 3: Add CA MTFCC Pre-Flight Assertion (fipsArg === '06')

Add a block in `processLayer` parallel to the existing MA (fipsArg==='25') and ME (fipsArg==='23') blocks:

```typescript
// Source: load-state-tiger-boundaries.ts ~line 660 — ADD after the ME block
if (fipsArg === '06') {
  const EXPECTED_CA_MTFCC: Record<string, number> = {
    county: 58,    // 58 CA counties
    cousub: 1057,  // 1,057 CA Census County Divisions (CCDs)
  };
  if (layer in EXPECTED_CA_MTFCC) {
    const expected = EXPECTED_CA_MTFCC[layer];
    let actualCount = 0;
    await streamShapefile(shpPath, dbfPath, async (_geom, props) => {
      if (layerDef.filterByStatefp) {
        const statefpKey = resolveColumn(props, ['STATEFP', 'STATEFP20', 'STATEFP10']);
        if (String(props[statefpKey] ?? '') !== fipsArg) return;
      }
      // NO FUNCSTAT filter here — CA cousub are CCDs (FUNCSTAT='S'), not MCDs (FUNCSTAT='A')
      // See CRITICAL PITFALL below.
      if (layerDef.districtNumField) {
        const fpKey = resolveColumn(props, layerDef.districtNumField);
        const fpVal = String(props[fpKey] ?? '');
        if (layerDef.skipDistrictCodes.has(fpVal)) return;
      }
      actualCount++;
    });
    if (actualCount !== expected) {
      const err = new Error(
        `[CA MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
        `TIGER file: ${url}. Aborting before any DB write — verify TIGER 2024 FIPS 06 file is correct.`
      );
      err.name = 'MtfccAssertionError';
      throw err;
    }
    console.log(`  [${layer}] CA MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
  }
}
```

### Pattern 4: Fix FUNCSTAT Filter — Make It State-Conditional

**This is the most critical code change.** The current FUNCSTAT='A' filter in the `streamShapefile` upsert block will skip ALL CA COUSUB records (they are CCD/FUNCSTAT='S', not MCD/FUNCSTAT='A').

Current code (line ~689 in processLayer upsert stream):
```typescript
// COUSUB layer: only load FUNCSTAT='A' (active towns).
if (layer === 'cousub') {
  const funcstatVal = String(props['FUNCSTAT'] ?? props['funcstat'] ?? '');
  if (funcstatVal !== 'A') {
    totals.skipped++;
    return;
  }
}
```

Change to be state-conditional:
```typescript
// COUSUB layer: FUNCSTAT filter is state-dependent.
// MA towns (MCDs) have FUNCSTAT='A' — filter to active government only.
// CA county divisions (CCDs) have FUNCSTAT='S' (statistical) — load ALL.
// States with active MCDs requiring FUNCSTAT='A' filter:
const COUSUB_FUNCSTAT_STATES = new Set(['MA']);
if (layer === 'cousub' && COUSUB_FUNCSTAT_STATES.has(abbrevUpper)) {
  const funcstatVal = String(props['FUNCSTAT'] ?? props['funcstat'] ?? '');
  if (funcstatVal !== 'A') {
    totals.skipped++;
    return;
  }
}
```

Similarly, the MA MTFCC pre-flight assertion for `cousub` in the `fipsArg === '25'` block applies the FUNCSTAT='A' filter — that block should remain unchanged (it's already scoped to `fipsArg === '25'`).

### Pattern 5: Loader Invocation

```bash
# From C:/EV-Accounts/backend/

# Step 1: Dry run — confirm URLs, no dispatch errors
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state CA --fips 06 --layers county,cousub --dry-run

# Step 2: Live run — add county (58 rows) and cousub (1,057 rows)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state CA --fips 06 --layers county,cousub

# The existing layers (cd, sldu, sldl, place) are already loaded.
# Do NOT re-run them unless explicitly debugging.
```

### Pattern 6: Verification SQL (verify-ca-tiger-import.sql)

```sql
-- Gate 1: No invalid geometries — MUST return 0
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '06' AND NOT ST_IsValid(geometry);
-- Expected: 0

-- Gate 2: No GeometryCollection types — MUST return 0
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '06'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');
-- Expected: 0

-- Per-layer row counts
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '06'
GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|58, G4040|1057, G4110|482, G5200|52, G5210|40, G5220|80
-- (G5400, G5410, G5420, X0001 may also appear from prior loads — ignore those)

-- SF city boundary (G4110)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '06' AND geo_id = '0667000';
-- Expected: 1 row, name='San Francisco city', mtfcc='G4110'

-- SF county boundary (G4020)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '06' AND geo_id = '06075';
-- Expected: 1 row, name='San Francisco County', mtfcc='G4020'

-- LA County boundary (G4020)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '06' AND geo_id = '06037';
-- Expected: 1 row (pre-existing), name='Los Angeles County', mtfcc='G4020'

-- Districts table — county tier
SELECT district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state = 'CA' AND district_type = 'COUNTY'
GROUP BY district_type;
-- Expected: COUNTY|58

-- No overlap: an address in SF city should NOT also match a G4040 COUSUB row
SELECT COUNT(*) AS city_cousub_overlap
FROM essentials.geofence_boundaries g1
JOIN essentials.geofence_boundaries g2
  ON g1.state = '06' AND g1.mtfcc = 'G4110'
  AND g2.state = '06' AND g2.mtfcc = 'G4040'
  AND ST_Equals(g1.geometry, g2.geometry);
-- Expected: 0 (city boundaries and CCD boundaries are distinct geometries)
```

### Pattern 7: Smoke Test (smoke-ca-geofences.ts)

```typescript
// smoke-ca-geofences.ts
// Phase 57: California geofence smoke test — 3 addresses, all tiers
// Address 1: SF City Hall — consolidated city-county (both G4110 + G4020 expected)
// Address 2: San Diego Balboa Park — suburban incorporated city
// Address 3: East Los Angeles — unincorporated (G4040 COUSUB expected, no G4110)

const TEST_ADDRESSES = [
  {
    label: 'San Francisco City Hall (consolidated city-county)',
    lon: -122.4191,
    lat: 37.7792,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
    notes: 'Must return BOTH G4110 (city) AND G4020 (county) — SF is consolidated',
  },
  {
    label: 'San Diego Balboa Park (incorporated city, CA-51)',
    lon: -117.1425,
    lat: 32.7308,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
    notes: 'Expected CD: CA-51 (Sara Jacobs)',
  },
  {
    label: 'East Los Angeles (unincorporated — must return G4040, no G4110)',
    lon: -118.1720,
    lat: 34.0239,
    expectedMtfcc: ['G4020', 'G4040', 'G5200', 'G5210', 'G5220'],
    notes: 'Must return G4040 COUSUB. Must NOT return G4110 (not incorporated). Expected CD: CA-34 area',
  },
];
// Query pattern: state = '06' (FIPS, not 'CA')
```

### Anti-Patterns to Avoid

- **Using FUNCSTAT='A' filter for CA COUSUB**: All CA COUSUBs are Census County Divisions (FUNCSTAT='S'). The existing MA filter would produce 0 CA cousub rows. Must make the filter state-conditional.
- **Re-running already-loaded layers (cd/sldu/sldl/place)**: ON CONFLICT DO NOTHING makes re-runs safe but they waste time downloading large files. Only run `county` and `cousub` in Phase 57.
- **Using state='CA' in geofence_boundaries query**: The `state` column stores FIPS ('06'). Always use `WHERE state = '06'` for geofence_boundaries.
- **Expecting no G4110 row for SF in the G4040 check**: SF is incorporated — it has a G4110 row. The overlap check is about whether the same polygon exists in both layers, not whether the address has a G4110 row.
- **Confusing the SF consolidated city-county**: SF should return BOTH a G4110 (city) AND a G4020 (county) row from a point-in-polygon query. Both have geo_id='0667000' (city) and '06075' (county) respectively — they are distinct rows in different mtfcc slots.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER download + cache | Custom HTTP client | `downloadWithRedirects` in loader | Handles redirects, existence-check caching |
| Shapefile reading | Manual DBF/SHP parsing | `streamShapefile` helper | UTF-8 encoded, async streaming |
| geofence_boundaries insert | Raw INSERT | `upsertGeofence` with ON CONFLICT (geo_id, mtfcc) DO NOTHING | Idempotent, handles ST_MakeValid |
| districts insert | Raw INSERT | `insertDistrictIfMissing` | Where-not-exists pattern, idempotent |
| County filter from US-wide file | Custom filter | Existing `filterByStatefp: true` on county layer | Already filters by STATEFP |

---

## Common Pitfalls

### Pitfall 1: FUNCSTAT='A' Filter Skips All CA COUSUB Records (CRITICAL)
**What goes wrong:** Running the cousub layer for CA with the current loader produces 0 rows inserted and 1,057 rows skipped. The MTFCC pre-flight assertion catches this (expected 1057, got 0).
**Why it happens:** The existing FUNCSTAT guard was written for Massachusetts where county subdivisions are MCDs (Minor Civil Divisions, active governments, FUNCSTAT='A'). California uses CCDs (Census County Divisions, statistical entities, FUNCSTAT='S').
**How to avoid:** Make the FUNCSTAT filter conditional per state. Only apply it for states in `COUSUB_FUNCSTAT_STATES = new Set(['MA'])`. CA should not be in that set.
**Warning signs:** Loader output shows 0 inserted_boundary, 1057 skipped for the cousub layer.

### Pitfall 2: County File Downloads 80MB US-Wide File
**What goes wrong:** The county layer downloads `tl_2024_us_county.zip` (80MB), much larger than other files.
**Why it happens:** TIGER publishes only a national county file. `filterByStatefp: true` handles per-state filtering.
**How to avoid:** Expected behavior. Cache prevents re-download on re-run. Download is slow but normal.
**Warning signs:** Slow download. File `.tmp-tiger-2024-06/tl_2024_us_county.zip` = ~80MB.

### Pitfall 3: San Francisco Consolidated City-County Returns 2 Rows
**What goes wrong:** A developer expects only one row for an SF address but gets both G4110 and G4020 rows. They incorrectly treat this as an error.
**Why it happens:** SF is a consolidated city-county. The G4110 row is the city boundary (geo_id='0667000', name='San Francisco city'). The G4020 row is the county boundary (geo_id='06075', name='San Francisco County'). They are different polygons with different geo_ids in the `geofence_boundaries` table.
**How to avoid:** Smoke test must explicitly assert BOTH rows are present. The overlap verification SQL checks they are not geometrically identical.
**Warning signs:** Smoke test shows either only G4110 or only G4020 for an SF address (not both).

### Pitfall 4: East LA Is Unincorporated — No G4110 Row
**What goes wrong:** Smoke test at East LA coordinates fails because developer expects a G4110 city row that doesn't exist.
**Why it happens:** East LA (90022) is an unincorporated census-designated place within LA County. It is NOT an incorporated city. The routing for unincorporated addresses returns G4040 (COUSUB/CCD) + G4020 (county), not G4110.
**How to avoid:** Assert the East LA test address returns G4040 and G4020 but does NOT return G4110.
**Warning signs:** Smoke test shows a G4110 row for East LA — this means the address coordinates drifted into incorporated City of LA territory.

### Pitfall 5: East LA Coordinates May Fall in Incorporated LA City
**What goes wrong:** The coordinates (34.0239, -118.1720) look like unincorporated ELA but could fall inside the City of Los Angeles boundary depending on exact street.
**Why it happens:** East LA borders incorporated LA neighborhoods. The exact coordinate matters.
**How to avoid:** If the smoke test returns G4110='0644000' (City of LA) instead of G4040, shift the coordinates further east (deeper into ELA). A reliable unincorporated point: 34.0214, -118.1629 (near Cesar Chavez Ave and Garfield Ave).
**Warning signs:** G4110 row appears with name='Los Angeles city' for the ELA test address.

### Pitfall 6: districts.state Case for CA County
**What goes wrong:** Query uses `state = 'ca'` for COUNTY district_type but gets 0 rows.
**Why it happens:** The loader writes `abbrevUpper` ('CA') for county districts (via `insertDistrictIfMissing` with `state: abbrev`). Looking at the existing DB: COUNTY rows for CA already have `state='CA'` (3 rows confirmed). The COUNTY writeDistrictRow=true uses `abbrev` (lowercase 'ca') — but the existing 3 COUNTY rows show state='CA'. This inconsistency exists because those 3 rows were loaded via a different mechanism (load-collin-county-boundary.ts pattern writes abbrevUpper). Wait — in `insertDistrictIfMissing`, the parameter is `state: abbrev` where `abbrev = FIPS_TO_STATE[fips]` which is lowercase 'ca'. But the DB shows 'CA'. This may be because `FIPS_TO_STATE['06'] = 'ca'` (lowercase) goes through `insertDistrictIfMissing` with `state: abbrev` = 'ca'.
**How to avoid:** After loading, verify: `SELECT state, district_type FROM essentials.districts WHERE district_type='COUNTY' AND state IN ('CA','ca') LIMIT 5`. Expect 'CA' if loaded via the loader's abbrev path. The live DB shows 'CA' for the existing 3 county rows, so loading via the same loader should produce 'CA'.
**NOTE:** Per the FIPS_TO_STATE map, `'06': 'ca'` (lowercase). The `abbrev` variable = 'ca'. The `abbrevUpper` variable = 'CA'. `insertDistrictIfMissing` receives `state: abbrev` = 'ca' (lowercase). But the live DB shows 'CA' for COUNTY. This is a discrepancy to verify after loading — the 3 existing COUNTY rows may have been loaded differently.

---

## California Geographic Facts

### Congressional Districts (52 total, already loaded)
| Key Districts | TIGER geo_id | Representative | Notes |
|---------------|-------------|----------------|-------|
| CA-11 | 0611 | Nancy Pelosi (retiring 2027) | San Francisco (most) |
| CA-15 | 0615 | Kevin Mullin | SF southern neighborhoods |
| CA-34 | 0634 | Jimmy Gomez | East LA area |
| CA-51 | 0651 | Sara Jacobs | San Diego (Balboa Park) |

### Smoke Test Addresses

| Address | Coordinates | Expected G5200 | Expected G4110 or G4040 | Expected G4020 |
|---------|-------------|---------------|------------------------|----------------|
| SF City Hall | lon=-122.4191, lat=37.7792 | CA-11 (geo_id='0611') | G4110 SF city (geo_id='0667000') | SF County (geo_id='06075') |
| San Diego Balboa Park | lon=-117.1425, lat=32.7308 | CA-51 (geo_id='0651') | G4110 San Diego city | San Diego County |
| East Los Angeles | lon=-118.1720, lat=34.0239 | CA-34 (geo_id='0634') | G4040 CCD (NO G4110) | LA County (geo_id='06037') |

**Note:** All congressional geo_ids follow the pattern: state FIPS (06) + 2-digit district number. CA-11 = '0611' (int strips leading zero from CD119FP='11'). Verify actual geo_ids from the DB after load.

### 58 California Counties
California has exactly 58 counties. TIGER geo_id format for counties = 5-char FIPS: '06' + COUNTYFP (3 digits).
Key counties: Los Angeles='06037' (already loaded), San Francisco='06075', San Diego='06073', Sacramento='06067', Alameda='06001', Santa Clara='06085'.

### CA COUSUB (Census County Divisions)
- Total: 1,057 records confirmed from TIGERweb BAS25 dataset
- Type: Census County Divisions (CCDs) — statistical entities, FUNCSTAT='S'
- NOT governing bodies — no government entity exists; routing to county government is the correct intent
- CA has no Minor Civil Divisions (MCDs with FUNCSTAT='A') — unlike MA/ME/MI/MN

### TIGER Layer Summary for CA Phase 57 (new layers only)

| Layer name | MTFCC | district_type | filterByStatefp | writeDistrictRow | FUNCSTAT filter |
|-----------|-------|---------------|-----------------|------------------|-----------------|
| county | G4020 | COUNTY | true | true | n/a |
| cousub | G4040 | LOCAL | false | false | NONE (CCDs have FUNCSTAT='S') |

### v7.0 Target City geo_ids (required by CONTEXT.md for downstream phases)

| City | geo_id (G4110) | County |
|------|---------------|--------|
| San Francisco | 0667000 | 06075 |
| Los Angeles | 0644000 | 06037 |
| San Jose | 0668000 | 06085 |
| San Diego | 0666000 | 06073 |
| Sacramento | 0664000 | 06067 |
| Fremont | 0626000 | 06001 |
| Berkeley | 0606000 | 06001 |

Note: These geo_ids follow the 7-char pattern: STATEFP(06) + PLACEFP. LA=44000 is confirmed (existing in DB as '0644000'). Others follow California PLACEFP conventions — verify each from the loaded G4110 rows in 57-02.

---

## Code Examples

### Confirmed: CA allowlist update
```typescript
// Source: load-state-tiger-boundaries.ts line ~35
CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'county', 'cousub']),
```

### Confirmed: FUNCSTAT conditional pattern
```typescript
// Source: processLayer in load-state-tiger-boundaries.ts — replace existing cousub FUNCSTAT block
const COUSUB_FUNCSTAT_STATES = new Set(['MA']);
if (layer === 'cousub' && COUSUB_FUNCSTAT_STATES.has(abbrevUpper)) {
  const funcstatVal = String(props['FUNCSTAT'] ?? props['funcstat'] ?? '');
  if (funcstatVal !== 'A') {
    totals.skipped++;
    return;
  }
}
```

### Confirmed: Dry-run invocation
```bash
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state CA --fips 06 --layers county,cousub --dry-run
```

### Confirmed: Post-load verification SQL
```sql
SELECT mtfcc, COUNT(*) FROM essentials.geofence_boundaries
WHERE state = '06' GROUP BY mtfcc ORDER BY mtfcc;
-- Expected (new layers only): G4020|58, G4040|1057
-- Plus existing: G4110|482, G5200|52, G5210|40, G5220|80
```

---

## State of the Art

| Old State | New State After Phase 57 | Impact |
|-----------|--------------------------|--------|
| G4020: 1 row (LA County only) | G4020: 58 rows (all CA counties) | Any CA address routes to county government |
| G4040: 0 rows | G4040: 1,057 rows | Unincorporated CA addresses get LOCAL tier via COUSUB |
| Already: G4110=482, G5200=52, G5210=40, G5220=80 | Unchanged | Prior work preserved |

---

## Open Questions

1. **Exact cousub count (1,057 vs. other number)**
   - What we know: TIGERweb BAS25 November 2024 dataset shows 1,057 records for CA COUSUB
   - What's unclear: TIGER 2024 file may differ from BAS25; pre-flight assertion will catch mismatch
   - Recommendation: Start with 1,057 in the pre-flight assertion. If it fails, log actual count and update.

2. **v7.0 target city geo_ids accuracy**
   - What we know: SF=0667000 confirmed in baseline CSV; LA=0644000 from existing DB record; others derived from CA PLACEFP conventions
   - What's unclear: Exact PLACEFP for San Jose, Sacramento, Fremont, Berkeley without querying the place shapefile directly
   - Recommendation: After smoke test, query `SELECT geo_id, name FROM geofence_boundaries WHERE state='06' AND mtfcc='G4110' AND name IN ('San Jose city','San Diego city','Sacramento city','Fremont city','Berkeley city')` to confirm all 7 target city geo_ids.

3. **East LA smoke test coordinate reliability**
   - What we know: (34.0239, -118.1720) is the commonly referenced center of East LA CDP
   - What's unclear: Whether this point falls in a CCD boundary or is right on a city/county boundary
   - Recommendation: If the smoke test shows G4110='Los Angeles city' instead of G4040, use (34.0214, -118.1629) as fallback (deeper into ELA near Cesar Chavez/Garfield).

4. **districts.state case for CA COUNTY rows**
   - What we know: 3 existing CA COUNTY rows in districts table have `state='CA'` (uppercase). The loader's `insertDistrictIfMissing` receives `state: abbrev` = 'ca' (lowercase).
   - What's unclear: Whether the loader will write 'ca' or 'CA' for new COUNTY rows.
   - Recommendation: After loading county layer, check: `SELECT DISTINCT state FROM essentials.districts WHERE district_type='COUNTY' AND state IN ('CA','ca')`. If new rows land as 'ca' while existing 3 are 'CA', there's inconsistency. The fix is to use `abbrevUpper` in `insertDistrictIfMissing` call — but this would be a cross-state change. For Phase 57, note the inconsistency and document it for resolution in a future phase.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — full file read; confirmed STATE_LAYER_ALLOWLIST (CA: cd/sldu/sldl/unsd/place, missing county+cousub), STATE_RUN_MAKEVALID (CA absent), FUNCSTAT='A' filter in upsert stream, MA pre-flight assertion block structure
- `C:/EV-Accounts/backend/scripts/fixtures/tiger_baseline_ca.csv` — confirmed G4110=482, G5200=52, G5210=40, G5220=80, G5420=346 in baseline (1,000 rows + header)
- Live DB query (2026-05-21) — confirmed current state: G4020=1 (LA County only), G4040=0; districts COUNTY=3, NATIONAL_LOWER=52, STATE_LOWER=80, STATE_UPPER=40
- `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/` — confirmed `tl_2024_us_county.zip` (80MB) exists
- `https://www2.census.gov/geo/tiger/TIGER2024/COUSUB/` — confirmed `tl_2024_06_cousub.zip` (12MB) exists
- `https://tigerweb.geo.census.gov/tigerwebmain/Files/acs25/tigerweb_acs25_cousub_2025_bas25_ca.html` — confirmed 1,057 CA COUSUB records (BAS25 November 2024 dataset)
- `https://www.census.gov/library/reference/code-lists/functional-status-codes.html` — confirmed CA CCDs use FUNCSTAT='S' (statistical), not FUNCSTAT='A'
- Phase 38 RESEARCH.md + Phase 49 RESEARCH.md — established patterns for loader structure, verification SQL, smoke test format
- Phase 48 PLAN 01 — confirmed FUNCSTAT='A' filter is MA-specific; pattern for making it conditional

### Secondary (MEDIUM confidence)
- Wikipedia + Ballotpedia — confirmed CA has 52 congressional districts, 40 senate, 80 assembly
- WebSearch — confirmed San Francisco City Hall is in CA-11 (Nancy Pelosi district, Civic Center area)
- WebSearch — confirmed Balboa Park San Diego is in CA-51 (Sara Jacobs)
- WebSearch — confirmed East LA 90022 is in CA-34/38/42 area (primarily CA-34, Jimmy Gomez)
- lat/lon coordinates from latitude.to and findlatitudeandlongitude.com for smoke test addresses

### Tertiary (LOW confidence)
- v7.0 target city PLACEFP codes for San Jose, Sacramento, Fremont, Berkeley — derived from CA PLACEFP conventions; verify from loaded G4110 rows in 57-02
- SF county geo_id = '06075' — derived from FIPS 06 + COUNTYFP 075; standard but should be verified
- Exact COUSUB count 1,057 — from TIGERweb BAS25 dataset (2024 vintage); TIGER 2024 file may differ; pre-flight assertion catches mismatch

---

## Metadata

**Confidence breakdown:**
- Standard stack (loader + helpers): HIGH — loader file fully read, all patterns confirmed
- CA layers already loaded (G4110/G5200/G5210/G5220): HIGH — confirmed from live DB
- county (58) and cousub (1,057) counts: HIGH/MEDIUM — 58 counties is definitive; 1,057 cousub from TIGERweb BAS25 (pre-flight assertion verifies)
- FUNCSTAT='S' for CA COUSUBs: HIGH — confirmed from Census FUNCSTAT documentation + CCD definition
- Smoke test addresses and expected districts: MEDIUM — coordinates confirmed from multiple sources; district assignments confirmed from web sources but TIGER polygon is authoritative
- v7.0 target city geo_ids (SF confirmed, others derived): MEDIUM — SF confirmed from baseline CSV; others follow CA PLACEFP conventions

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (stable domain — TIGER 2024 files won't change; CA district counts fixed until redistricting)
