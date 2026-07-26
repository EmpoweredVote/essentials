# Phase 100: VA TIGER Geofences - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 3 (1 modified, 2 created)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | config/script (4 additive edits) | batch, file-I/O | self (MD block at lines 863–905) | exact |
| `C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql` | utility (SQL verification) | batch, request-response | `verify-md-tiger-import.sql` + `verify-or-tiger-import.sql` | exact (adapt) |
| `C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts` | utility (TypeScript smoke test) | batch, request-response | `smoke-md-geofences.ts` | exact (adapt) |

---

## Pattern Assignments

### `load-state-tiger-boundaries.ts` — 4 Additive Edits

**Analog:** self (existing MD block pattern)

#### Edit 1 — STATE_LAYER_ALLOWLIST (line 43, after `MD:` entry)

Insert after line 43 (`MD: new Set([...]),`), before line 44 (`DC: new Set([...])`):

```typescript
VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

No `cousub` — Virginia uses independent cities, not townships. Matches ME/OR/MD pattern exactly.

**Analog pattern** (lines 40–44):
```typescript
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  DC: new Set(['sldl']),
```

---

#### Edit 2 — STATE_CITY_ASSERTIONS (line 94, after `MD:` entry)

Insert after line 94 (`MD: ['Baltimore city'],`), before the closing `};`:

```typescript
VA: ['Alexandria city'],
```

Lowercase 'city' matches TIGER NAMELSAD casing (same as `'Baltimore city'`, `'Portland city'`).

**Analog pattern** (lines 88–94):
```typescript
const STATE_CITY_ASSERTIONS: Record<string, string[]> = {
  UT: ['Magna', 'Kearns', 'Copperton', 'Emigration Canyon', 'White City'],
  TX: ['Longview city', 'Houston city', 'Dallas city', 'Austin city'],
  MA: ['Cambridge city'],
  ME: ['Portland city'],
  OR: ['Portland city'],
  MD: ['Baltimore city'],
};
```

---

#### Edit 3 — STATE_RUN_MAKEVALID (line 107, after `MD:` entry)

Insert after line 107 (`MD: new Set([...]),`), before line 108 (`DC: new Set([...])`):

```typescript
VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

All 5 VA layers get ST_MakeValid — identical to ME, OR, MD.

**Analog pattern** (lines 104–108):
```typescript
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  DC: new Set(['sldl']),
```

---

#### Edit 4 — EXPECTED_VA_MTFCC block in processLayer()

**Location:** After the MD block ending at line 905 (`}`), before the DC block starting at line 908 (`if (fipsArg === '11')`). Insert between lines 905 and 907.

**Analog:** MD block (lines 863–905). Copy structure verbatim; change fips guard, label, counts, and error message:

```typescript
  // ── VA MTFCC pre-flight assertion (Phase 100) ──────────────────────────────
  // For VA (state='51'), count records satisfying the same filters as the upsert
  // pass BEFORE any DB write. Assertion failure is named and fatal.
  // sldl and place values are set to 0 so dry-run MtfccAssertionError reveals actual count.
  // Plan 02 updates these values before the live load.
  if (fipsArg === '51') {
    const EXPECTED_VA_MTFCC: Record<string, number> = {
      cd119: 11,   // 11 VA congressional districts (post-2022 redistricting)
      sldu:  40,   // 40 VA Senate districts (1 senator each)
      sldl:   0,   // TBD — set to 0; dry-run reveals actual count (~100 expected — single-member districts)
      place:  0,   // TBD — set to 0; dry-run reveals actual count (TIGERweb shows 433 G4110, actual G4110-only may differ)
      county: 133, // 133 VA county-equivalents: 95 counties + 38 independent cities
    };
    if (layer in EXPECTED_VA_MTFCC) {
      const expected = EXPECTED_VA_MTFCC[layer];
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
          `[VA MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
          `TIGER file: ${url}. Aborting before any DB write — verify TIGER 2024 FIPS 51 file is correct.`
        );
        err.name = 'MtfccAssertionError';
        throw err;
      }
      console.log(`  [${layer}] VA MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
    }
  }
```

**Note on sentinel 0s:** `sldl: 0` and `place: 0` are intentional. The dry-run will throw `MtfccAssertionError` revealing the actual counts. Plan 02 updates these to the confirmed values before the live load. The county count `133` is known-good (95 counties + 38 independent cities). The `cd119: 11` assertion will PASS with the existing 11 G5200 rows because EXPECTED_VA_MTFCC counts shapefile records, not DB insertions.

**Analog MD block** (lines 863–905) for structural reference:
```typescript
  if (fipsArg === '24') {
    const EXPECTED_MD_MTFCC: Record<string, number> = {
      cd119:  8,
      sldu:  47,
      sldl:  71,
      place: 157,
      county: 24,
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
          `TIGER file: ${url}. Aborting before any DB write — verify TIGER 2024 FIPS 24 file is correct.`
        );
        err.name = 'MtfccAssertionError';
        throw err;
      }
      console.log(`  [${layer}] MD MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
    }
  }
```

---

### `C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql` (new file)

**Analog:** `verify-md-tiger-import.sql` (full structure) + `verify-or-tiger-import.sql` (Gate 7 direction)

**Complete file to create** — adapt every `'24'` → `'51'` and `MD`/`md` → `VA`/`va`; replace Gate 4 with Alexandria dual-tier; replace Gate 6 with Fairfax County sentinel; replace Gate 7 with OR-direction query:

```sql
-- Phase 100 VA TIGER import verification — SELECT only, no writes
-- Run via: psql $DATABASE_URL -f backend/scripts/verify-va-tiger-import.sql

-- Gate 1: No invalid geometries — MUST return 0
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '51' AND NOT ST_IsValid(geometry);
-- Expected: 0

-- Gate 2: No GeometryCollection types — MUST return 0
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '51'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');
-- Expected: 0

-- Gate 3: Per-layer row counts (VA-GEO-01)
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '51'
GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|133, G4110|[DRY-RUN-COUNT], G5200|11, G5210|40, G5220|[DRY-RUN-COUNT]
-- (Update G4110 and G5220 expected counts after dry-run confirms actual values)

-- Gate 4: Alexandria dual-tier sentinel (VA-GEO-02 invariant)
-- Both rows must exist: G4110 (incorporated place) AND G4020 (independent city-county)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '51' AND geo_id IN ('5101000', '51510')
ORDER BY mtfcc;
-- Expected: 2 rows
-- geo_id='51510',  name='Alexandria city', mtfcc='G4020'  (independent city-county)
-- geo_id='5101000',name='Alexandria city', mtfcc='G4110'  (incorporated place)

-- Gate 5: districts table counts for Virginia (case-sensitive)
SELECT state, district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state IN ('VA', 'va')
GROUP BY state, district_type ORDER BY state, district_type;
-- Expected:
--   va  | COUNTY         | 133
--   va  | STATE_LOWER    | [DRY-RUN-COUNT, ~100]
--   va  | STATE_UPPER    | 40
--   VA  | NATIONAL_LOWER | 11
-- (cd119 writes district rows with state=abbrevUpper='VA' per loader casing pattern)

-- Gate 6: Fairfax County sentinel (Alexandria's neighbor — confirms county layer)
-- NOTE: Fairfax County AND Fairfax city are SEPARATE entities in VA (independent city pattern)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '51' AND mtfcc = 'G4020' AND name LIKE '%Fairfax%'
ORDER BY name;
-- Expected: 2 rows
-- geo_id='51059', name='Fairfax County', mtfcc='G4020'
-- geo_id='51600', name='Fairfax city',   mtfcc='G4020'

-- Gate 7: Section-split check — OR-direction (geofence → districts)
-- MUST return 0 rows (all G5200/G5210/G5220/G4020 geofences must have matching districts row)
-- NOTE: Use OR-direction to avoid false positives from pre-existing NATIONAL_UPPER row
-- (geo_id='51', no polygon — statewide senator rows have no geofence boundary)
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')
  AND gb.state = '51'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
-- Expected: 0 rows
```

**Key differences from verify-md-tiger-import.sql:**

| Gate | MD | VA |
|------|----|----|
| state filter | `'24'` | `'51'` |
| Gate 3 G4020 expected | `24` | `133` (95 counties + 38 independent cities) |
| Gate 3 G5200 expected | `8` | `11` |
| Gate 3 G5210 expected | `47` | `40` |
| Gate 4 sentinel | Baltimore City (`2404000`/`24510`) | Alexandria (`5101000`/`51510`) |
| Gate 5 districts state | `'MD'`/`'md'` | `'VA'`/`'va'` |
| Gate 6 sentinel | St. Mary's County | Fairfax County + Fairfax city (2 rows) |
| Gate 7 direction | districts → geofence (MD pattern) | **geofence → districts (OR pattern)** — avoids NATIONAL_UPPER false positive |

**Why OR-direction for Gate 7:** The pre-existing `districts` row with `state='VA'`, `district_type='NATIONAL_UPPER'`, `geo_id='51'` has no polygon (senators represent the entire state). The MD-direction query (`FROM districts WHERE NOT IN geofence`) would return this row as a false positive. The OR-direction query (`FROM geofence WHERE NOT IN districts`) only checks polygon-backed tiers and is immune to this.

**Analog Gate 7 from verify-or-tiger-import.sql** (lines 52–59):
```sql
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')
  AND gb.state = '41'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
```

---

### `C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts` (new file)

**Analog:** `smoke-md-geofences.ts` (full structure, lines 1–247)

**Imports pattern** (lines 17–19 of smoke-md-geofences.ts):
```typescript
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
```

**Interface pattern** (lines 21–28 of smoke-md-geofences.ts):
```typescript
interface AddressTest {
  label: string;
  lon: number;
  lat: number;
  expectedMtfcc: string[];
  forbiddenMtfcc?: string[];
  expectedGeoIds?: Record<string, string>; // mtfcc → geo_id
}
```

**TEST_ADDRESSES — VA-specific** (replace MD addresses entirely):
```typescript
const TEST_ADDRESSES: AddressTest[] = [
  {
    // Alexandria VA City Hall — VA-GEO-02 invariant: BOTH G4110 (place) AND G4020 (independent city)
    label: 'Alexandria VA City Hall',
    lon: -77.0469,
    lat: 38.8048,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
    expectedGeoIds: {
      G4110: '5101000', // Alexandria city (incorporated place, STATEFP=51 + PLACEFP=01000)
      G4020: '51510',   // Alexandria city (independent city-county, STATEFP=51 + COUNTYFP=510)
      G5200: '5108',    // VA-8 (Don Beyer) — confirmed by current routing
    },
  },
  {
    // Rural Shenandoah County VA — unincorporated; must NOT return G4110
    label: 'Rural Shenandoah County VA (unincorporated)',
    lon: -78.6,
    lat: 38.9,
    expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
    forbiddenMtfcc: ['G4110'],
  },
  {
    // Richmond VA City Hall — state capital; incorporated independent city
    // Must return G4110 + G4020 + all legislative tiers
    label: 'Richmond VA City Hall',
    lon: -77.4360,
    lat: 37.5407,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  },
];
```

**queryBoundaries function — VA-specific** (adapt from lines 60–74 of smoke-md-geofences.ts; change `state = '24'` → `state = '51'`):
```typescript
async function queryBoundaries(
  client: Client,
  lon: number,
  lat: number
): Promise<Array<{ geo_id: string; name: string; mtfcc: string }>> {
  const res = await client.query<{ geo_id: string; name: string; mtfcc: string }>(
    `SELECT geo_id, name, mtfcc
     FROM essentials.geofence_boundaries
     WHERE state = '51'
       AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     ORDER BY mtfcc`,
    [lon, lat],
  );
  return res.rows;
}
```

**SC3 layer counts — VA-specific** (adapt from lines 94–113 of smoke-md-geofences.ts; update state filter, mtfcc counts, and comment string):
```typescript
    console.log('\n=== SC3: Layer counts for state=\'51\' ===');
    const countRes = await client.query<{ mtfcc: string; row_count: string }>(
      `SELECT mtfcc, COUNT(*) AS row_count
       FROM essentials.geofence_boundaries
       WHERE state = '51'
         AND mtfcc IN ('G4020','G4110','G5200','G5210','G5220')
       GROUP BY mtfcc ORDER BY mtfcc`,
    );
    const expectedCounts: Record<string, number> = {
      G4020: 133,   // county-equivalents (95 counties + 38 independent cities)
      G4110: 0,     // TBD — update after dry-run confirms actual G4110 count
      G5200: 11,    // congressional districts (11 VA districts)
      G5210: 40,    // state senate districts
      G5220: 0,     // TBD — update after dry-run confirms actual SLDL count (~100 expected)
    };
```

**Note on SC3 sentinel 0s:** `G4110: 0` and `G5220: 0` are placeholders. Plan 02 updates these after the dry-run confirms actual counts. With 0 as expected, the SC3 check will fail until updated — this is intentional so the executor does not forget to fill them in.

**Target city lookup — VA-specific** (adapt from lines 201–217 of smoke-md-geofences.ts):
```typescript
    console.log('\n=== VA Target City geo_id Lookup (G4110) ===');
    const targetCityRes = await client.query<{ geo_id: string; name: string }>(
      `SELECT geo_id, name
       FROM essentials.geofence_boundaries
       WHERE state = '51'
         AND mtfcc = 'G4110'
         AND name IN (
           'Alexandria city',
           'Richmond city',
           'Norfolk city'
         )
       ORDER BY name`,
    );
    console.log(`  Found ${targetCityRes.rows.length} VA target cities:`);
    for (const row of targetCityRes.rows) {
      console.log(`  ${row.name}: geo_id=${row.geo_id}`);
    }
```

**Final result block — VA-specific** (adapt from lines 226–241 of smoke-md-geofences.ts):
```typescript
  if (allPassed) {
    console.log('ALL ASSERTIONS PASSED');
    console.log('\nPhase 100 roadmap success criteria:');
    console.log('  SC1: Alexandria City Hall returns G4110 (5101000) + G4020 (51510) + G5200 + G5210 + G5220 [PASS]');
    console.log('  SC2: Rural Shenandoah County returns G4020 + G5200 + G5210 + G5220; NO G4110 [PASS]');
    console.log('  SC3: All 11 CD + 40 senate + N house + 133 counties + N cities present [PASS]');
    console.log('  SC4: 3 addresses each return non-NULL names across all tiers [PASS]');
    process.exit(0);
  }
```

**File header comment — VA-specific** (adapt from lines 1–16 of smoke-md-geofences.ts):
```typescript
/**
 * smoke-va-geofences.ts
 * Phase 100: Virginia geofences smoke test
 *
 * Usage (from C:/EV-Accounts/backend):
 *   npx tsx scripts/smoke-va-geofences.ts
 *
 * Prints which geofence_boundaries rows cover each test address.
 * Verifies Phase 100 roadmap success criteria:
 *   SC1 — Alexandria City Hall returns G4110 (place 5101000) + G4020 (city-county 51510) + G5200 + G5210 + G5220
 *   SC2 — Rural Shenandoah County returns G4020 + G5200 + G5210 + G5220; NO G4110 (unincorporated)
 *   SC3 — All 11 CD + 40 senate + [N] house + 133 counties + N cities present in DB
 *   SC4 — 3 VA addresses each return correct district names with zero NULL tiers
 *
 * District lookup: https://vga.virginia.gov/
 */
```

**Sections copied verbatim from smoke-md-geofences.ts** (no VA-specific changes needed):
- `main()` function structure: `client.connect()`, `allPassed`/`errors` tracking, `try/finally` with `client.end()` (lines 76–221)
- Address test loop (lines 130–195): `queryBoundaries` call, `expectedMtfcc` check, `forbiddenMtfcc` check, `expectedGeoIds` check, NULL name check
- `main().catch()` tail (lines 244–247)

---

## Shared Patterns

### MTFCC Pre-Flight Assertion Structure
**Source:** `load-state-tiger-boundaries.ts` lines 863–905 (MD block)
**Apply to:** Edit 4 (EXPECTED_VA_MTFCC block)

The exact pattern used by every prior state:
1. `if (fipsArg === 'XX')` guard using the FIPS string (not the abbreviation)
2. `const EXPECTED_XX_MTFCC: Record<string, number>` with one key per layer in the allowlist
3. `if (layer in EXPECTED_XX_MTFCC)` dispatch
4. Re-stream the shapefile with IDENTICAL filter logic to the upsert pass
5. `if (actualCount !== expected)` — throw named `MtfccAssertionError`, abort before any DB write
6. `console.log` on PASS

Critical: The filter logic inside the count pass must mirror the upsert pass exactly — same `filterByStatefp`, same `place` MTFCC guard, same `districtNumField` skipDistrictCodes. VA has no `cousub` layer, so no FUNCSTAT guard is needed.

### State Abbreviation Casing (districts.state)
**Source:** `load-state-tiger-boundaries.ts` lines 522–524
**Apply to:** All district row inserts

```typescript
const abbrev = FIPS_TO_STATE[fips];         // 'va' (lowercase) — for county/sldu/sldl/place
const abbrevUpper = (abbrev ?? fips).toUpperCase(); // 'VA' — for cd119 NATIONAL_LOWER
```

This is already in the loader. It means:
- `va | COUNTY`, `va | STATE_UPPER`, `va | STATE_LOWER` in districts table
- `VA | NATIONAL_LOWER` in districts table

The pre-existing `VA | NATIONAL_LOWER` rows already use uppercase 'VA' — confirming the loader's `abbrevUpper` path is correct for cd119.

### ST_Covers Spatial Query
**Source:** `smoke-md-geofences.ts` lines 64–74
**Apply to:** `queryBoundaries()` in smoke-va-geofences.ts

PostGIS `ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))` — not `ST_Contains`. The `ST_Covers` predicate includes points on boundaries (border-adjacent cities). This is the production routing pattern used by `essentialsService`.

### ON CONFLICT Idempotency
**Source:** `load-state-tiger-boundaries.ts` lines 419–438 (`upsertGeofence`)
**Apply to:** All VA layer loads

```sql
ON CONFLICT (geo_id, mtfcc) DO NOTHING
```

The 11 existing G5200 rows will produce `already_exists: 11` — this is correct, not an error. EXPECTED_VA_MTFCC assertion counts shapefile records (not DB insertions), so it will PASS even when all 11 are skipped.

---

## No Analog Found

None. All three files have exact or near-exact analogs.

---

## Execution Order (for planner)

The 4 loader edits and 2 new files form a single wave, but must be executed in this sequence:

1. **Plan 01 (Wave 0):** Make all 4 loader edits; create verify-va-tiger-import.sql and smoke-va-geofences.ts with sentinel 0s for `sldl` and `place` counts
2. **Plan 01 (dry-run step):** Run `--dry-run` to discover actual `sldl` and `place` counts via MtfccAssertionError output
3. **Plan 02:** Update EXPECTED_VA_MTFCC `sldl` and `place` to confirmed values; update smoke-va-geofences.ts `G4110`/`G5220` expectedCounts; run live load
4. **Plan 03 (verification):** Run verify-va-tiger-import.sql gates; run smoke-va-geofences.ts

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 4 (`load-state-tiger-boundaries.ts`, `verify-md-tiger-import.sql`, `smoke-md-geofences.ts`, `verify-or-tiger-import.sql`)
**Pattern extraction date:** 2026-06-08
