# Phase 91: MD TIGER Geofences - Pattern Map

**Mapped:** 2026-06-05
**Files analyzed:** 3 (1 modify, 2 create)
**Analogs found:** 3 / 3

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | config/utility | batch | itself (OR/ME blocks at lines 808–849, 687–727) | exact — 4 additive config entries |
| `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql` | utility | batch | `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` | exact — state swap only |
| `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts` | utility | request-response | `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` | exact — address swap + D-01 dual-tier assertion |

---

## Pattern Assignments

### `load-state-tiger-boundaries.ts` (MODIFY — 4 additive config entries)

**Analog:** itself — OR block is the direct template.

#### 1. STATE_LAYER_ALLOWLIST addition (line 41, after OR entry)

```typescript
// C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts lines 34-42
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'county', 'cousub']),
  TX: new Set(['cd', 'sldu', 'sldl', 'county', 'place']),
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county', 'aiannh']),
  IN: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'cousub']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  // ADD after OR:
  MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
};
```

**Critical:** `cd119` not `cd` — MD TIGER file is `tl_2024_24_cd119.zip`. No `cousub` (D-05).
Matches ME/OR pattern exactly (same 5 layers, same cd119 key).

#### 2. STATE_CITY_ASSERTIONS addition (lines 78-84, after OR entry)

```typescript
// C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts lines 78-84
const STATE_CITY_ASSERTIONS: Record<string, string[]> = {
  UT: ['Magna', 'Kearns', 'Copperton', 'Emigration Canyon', 'White City'],
  TX: ['Longview city', 'Houston city', 'Dallas city', 'Austin city'],
  MA: ['Cambridge city'],
  ME: ['Portland city'],
  OR: ['Portland city'],
  // ADD after OR:
  MD: ['Baltimore city'],
};
```

**Rationale:** D-01 invariant — Baltimore city is the sentinel city; its presence in the PLACE layer confirms the correct vintage is loaded. Name must match TIGER NAMELSAD exactly: `'Baltimore city'` (lowercase 'city').

#### 3. STATE_RUN_MAKEVALID addition (lines 89-96, after OR entry)

```typescript
// C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts lines 89-96
const STATE_RUN_MAKEVALID: Record<string, Set<string>> = {
  CA: new Set(['place', 'county', 'cousub']),
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county', 'aiannh']),
  TX: new Set(['place', 'county']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
  // ADD after OR:
  MD: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
};
```

All 5 layers get ST_MakeValid — identical to ME and OR. No exceptions.

#### 4. EXPECTED_MD_MTFCC pre-flight assertion block in processLayer()

**Insert location:** After the OR block (lines 808–849), before the `// ── Stream records ──` comment at line 851.

**Template to copy (OR block, lines 808–849):**

```typescript
// C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts lines 808-849
  // ── OR MTFCC pre-flight assertion (Phase 72) ────────────────────────────────
  // For OR (state='41'), count records satisfying the same filters as the upsert
  // pass BEFORE any DB write. Assertion failure is named and fatal.
  if (fipsArg === '41') {
    const EXPECTED_OR_MTFCC: Record<string, number> = {
      cd119: 6,   // 6 OR congressional districts (post-2022 redistricting)
      sldu:  30,  // 30 OR Senate districts
      sldl:  60,  // 60 OR House districts
      place: 241, // 241 OR G4110 incorporated cities (confirmed via dry-run 2026-05-28)
      county: 36, // 36 OR counties
    };
    if (layer in EXPECTED_OR_MTFCC) {
      const expected = EXPECTED_OR_MTFCC[layer];
      let actualCount = 0;
      await streamShapefile(shpPath, dbfPath, async (_geom, props) => {
        // Apply the same filter logic as the upsert pass below.
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
          `[OR MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
          `TIGER file: ${url}. Aborting before any DB write — verify TIGER 2024 FIPS 41 file is correct.`
        );
        err.name = 'MtfccAssertionError';
        throw err;
      }
      console.log(`  [${layer}] OR MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
    }
  }
```

**Substitute with (MD version):**

```typescript
  // ── MD MTFCC pre-flight assertion (Phase 91) ────────────────────────────────
  // For MD (state='24'), count records satisfying the same filters as the upsert
  // pass BEFORE any DB write. Assertion failure is named and fatal.
  // sldl and place values are TBD — replace after dry-run confirms actual counts.
  if (fipsArg === '24') {
    const EXPECTED_MD_MTFCC: Record<string, number> = {
      cd119:  8,   // 8 MD congressional districts (post-2022 redistricting)
      sldu:  47,   // 47 MD Senate districts (1 senator each)
      sldl: TBD,   // confirmed via dry-run — expected ~71 sub-district polygons (NOT 141 delegates)
      place: TBD,  // confirmed via dry-run — expected ~311 G4110 incorporated places
      county: 24,  // 24 MD counties (23 counties + Baltimore City as independent city-county)
    };
    if (layer in EXPECTED_MD_MTFCC) {
      const expected = EXPECTED_MD_MTFCC[layer];
      let actualCount = 0;
      await streamShapefile(shpPath, dbfPath, async (_geom, props) => {
        // Apply the same filter logic as the upsert pass below.
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

**TBD workflow (D-04, D-09):** Run `--dry-run` first. The MtfccAssertionError output for `sldl` and `place` reveals actual counts. Replace `TBD` with those counts, then run live. Do NOT use 141 for `sldl` — that is the delegate count, not the polygon count (~71 expected).

---

### `verify-md-tiger-import.sql` (CREATE)

**Analog:** `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` (lines 1–59)

**Full OR file is the template** — copy it wholesale and apply these substitutions:

| OR value | MD value | Where |
|----------|----------|-------|
| `state = '41'` | `state = '24'` | Gates 1, 2, 3, 7 |
| `Phase 72 OR TIGER import` | `Phase 91 MD TIGER import` | Header comment |
| `GEO-OR-01/02` | `MD-GEO-01/02/03/04/05` | Gate 3 comment |
| Gate 3 expected counts | `G4020\|24, G4110\|[DRY-RUN], G5200\|8, G5210\|47, G5220\|[DRY-RUN]` | Gate 3 comment |
| Gate 4 (Portland sentinel) | Gate 4 (Baltimore City dual-tier) | Replace entirely — see below |
| Gate 5 state IN ('OR', 'or') | state IN ('MD', 'md') | Gate 5 |
| Gate 5 expected counts | `md\|COUNTY\|24, md\|STATE_LOWER\|[DRY-RUN], md\|STATE_UPPER\|47, MD\|NATIONAL_LOWER\|8` | Gate 5 comment |
| Gate 6 (Multnomah County sentinel) | Gate 6 (St. Mary's County sentinel) | Replace — see below |
| Gate 7 state = '41' | state = '24' + use districts WHERE state IN ('MD', 'md') | Gate 7 |

**Gate 4 replacement** (OR Portland sentinel → MD Baltimore City dual-tier):

```sql
-- Gate 4: Baltimore City dual-tier sentinel (D-01 invariant)
-- Both rows must exist: G4110 (incorporated city) AND G4020 (independent city-county)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24' AND geo_id IN ('2404000', '24510')
ORDER BY mtfcc;
-- Expected: 2 rows
-- geo_id='24510',   name='Baltimore city', mtfcc='G4020'  (independent city-county)
-- geo_id='2404000', name='Baltimore city', mtfcc='G4110'  (incorporated place)
```

**Gate 6 replacement** (OR Multnomah sentinel → MD St. Mary's County sentinel):

```sql
-- Gate 6: St. Mary's County sentinel (Phase 95 prerequisite)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '24' AND mtfcc = 'G4020' AND name LIKE '%Mary%';
-- Expected: 1 row, name="St. Mary's County", geo_id='24037'
```

**Gate 7 replacement** (OR section-split pattern → MD version):

```sql
-- Gate 7: Section-split check — MUST return 0 rows
SELECT d.geo_id, d.district_type, d.state
FROM essentials.districts d
WHERE d.state IN ('MD', 'md')
  AND d.geo_id NOT IN (SELECT geo_id FROM essentials.geofence_boundaries WHERE state = '24')
LIMIT 10;
-- Expected: 0 rows
```

Note: OR Gate 7 checks `geofence_boundaries gb ... NOT IN (SELECT geo_id FROM districts)` (reverse direction). MD Gate 7 follows the LOCATION-ONBOARDING.md pattern instead (districts that lack geofence coverage), which is what D-10 requires.

---

### `smoke-md-geofences.ts` (CREATE)

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` (lines 1–250, full file)

**Copy the entire OR smoke test.** Apply these substitutions:

| OR value | MD value | Lines affected |
|----------|----------|----------------|
| `smoke-or-geofences.ts` / `Phase 72` | `smoke-md-geofences.ts` / `Phase 91` | lines 2, 4, 9–15 |
| `state = '41'` | `state = '24'` | lines 71, 99 |
| `TEST_ADDRESSES` array (lines 30–61) | MD addresses — see below | lines 30–61 |
| SC1–SC4 comments (Portland/Bend/Salem) | Baltimore/Garrett/Leonardtown equivalents | lines 9–15 |
| `expectedCounts` (lines 105–111) | MD confirmed counts — see below | lines 105–111 |
| OR Target City lookup (lines 203–219) | MD target city lookup — see below | lines 203–219 |

**Header comment block** (lines 9–15):

```typescript
 * Verifies Phase 91 roadmap success criteria:
 *   SC1 — Baltimore City Hall returns G4110 (city, 2404000) + G4020 (city-county, 24510) + G5200 + G5210 + G5220
 *   SC2 — Garrett County rural point returns G4020 + G5200 + G5210 + G5220; NO G4110 (unincorporated)
 *   SC3 — All 8 CD + 47 senate + [N] house + 24 counties + N cities present in DB
 *   SC4 — 3 MD addresses each return correct district names with zero NULL tiers
```

**TEST_ADDRESSES replacement** (lines 30–61 in OR analog):

```typescript
const TEST_ADDRESSES: AddressTest[] = [
  {
    // Baltimore City Hall — D-01 invariant: BOTH G4110 (incorporated city) AND G4020 (city-as-county)
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
    // Garrett County rural point — unincorporated; must NOT return G4110
    // If G4110 is returned, the coordinate fell inside Oakland city; shift to (-79.45, 39.65)
    label: 'Rural Garrett County MD (unincorporated)',
    lon: -79.3,
    lat: 39.53,
    expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
    forbiddenMtfcc: ['G4110'],
  },
  {
    // Leonardtown MD — Phase 95 (St. Mary's County) dependency validation
    label: "Leonardtown MD (St. Mary's County)",
    lon: -76.6358,
    lat: 38.2912,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  },
];
```

**expectedCounts replacement** (lines 105–111 in OR analog):

```typescript
    const expectedCounts: Record<string, number> = {
      G4020: 24,   // counties (23 counties + Baltimore City independent city)
      G4110: TBD,  // incorporated cities — replace with dry-run count (~311 expected)
      G5200: 8,    // congressional districts
      G5210: 47,   // state senate districts
      G5220: TBD,  // house sub-districts — replace with dry-run count (~71 expected)
    };
```

**OR Target City lookup replacement** (lines 203–219 in OR analog):

```typescript
    console.log('\n=== MD Target City geo_id Lookup (G4110) ===');
    const targetCityRes = await client.query<{ geo_id: string; name: string }>(
      `SELECT geo_id, name
       FROM essentials.geofence_boundaries
       WHERE state = '24'
         AND mtfcc = 'G4110'
         AND name IN (
           'Baltimore city',
           'Annapolis city',
           'Rockville city'
         )
       ORDER BY name`,
    );
    console.log(`  Found ${targetCityRes.rows.length} MD target cities:`);
    for (const row of targetCityRes.rows) {
      console.log(`  ${row.name}: geo_id=${row.geo_id}`);
    }
```

**Final result block** (lines 231–238 in OR analog):

```typescript
    console.log('\nPhase 91 roadmap success criteria:');
    console.log('  SC1: Baltimore City Hall returns G4110 (2404000) + G4020 (24510) + G5200 + G5210 + G5220 [PASS]');
    console.log('  SC2: Garrett County rural returns G4020 + G5200 + G5210 + G5220; NO G4110 [PASS]');
    console.log('  SC3: All 8 CD + 47 senate + N house + 24 counties + N cities present [PASS]');
    console.log('  SC4: 3 addresses each return non-NULL names across all tiers [PASS]');
```

**All other logic** (AddressTest interface, queryBoundaries function, main() structure, pg Client setup, error accumulation loop, forbiddenMtfcc checks, geo_id checks, SC4 null-name check) — copy verbatim from `smoke-or-geofences.ts`. The logic is identical; only state='41'→'24', the address set, and the counts change.

---

## Shared Patterns

### FIPS_TO_STATE entry (already present — no action needed)

**Source:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` lines 107–119

```typescript
const FIPS_TO_STATE: Record<string, string> = {
  ...
  '24': 'md',  // Maryland — already present in the map
  ...
};
```

No edit required. Confirmed at line 112. The loader will derive `abbrev='md'` and `abbrevUpper='MD'` automatically from `--fips 24`.

### districts.state casing rule (Pitfall 6 guard)

**Source:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` line 511 comment

The loader derives `abbrev` (lowercase 'md') for COUNTY/STATE_UPPER/STATE_LOWER rows and `abbrevUpper` (uppercase 'MD') for NATIONAL_LOWER (congressional) rows. This is automatic. The verify SQL Gate 5 must use `WHERE state IN ('MD', 'md')` to cover both cases — copy the OR Gate 5 pattern exactly:

```sql
-- From verify-or-tiger-import.sql lines 33-42
SELECT state, district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state IN ('OR', 'or')
GROUP BY state, district_type ORDER BY state, district_type;
-- (replace 'OR'/'or' with 'MD'/'md')
```

### ST_Covers spatial query pattern

**Source:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` lines 68–76

```typescript
const res = await client.query<{ geo_id: string; name: string; mtfcc: string }>(
  `SELECT geo_id, name, mtfcc
   FROM essentials.geofence_boundaries
   WHERE state = '41'
     AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
   ORDER BY mtfcc`,
  [lon, lat],
);
```

Argument order: `ST_MakePoint(longitude, latitude)` — longitude first. Copy exactly; swap state='41' to state='24'.

### MtfccAssertionError pattern

**Source:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` lines 839–848

```typescript
const err = new Error(
  `[OR MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
  `TIGER file: ${url}. Aborting before any DB write — verify TIGER 2024 FIPS 41 file is correct.`
);
err.name = 'MtfccAssertionError';
throw err;
```

The error name `'MtfccAssertionError'` is the conventional signal used in pre-flight checks. Keep it. Change the prefix string to `[MD MTFCC assertion]` and FIPS reference to 24.

---

## No Analog Found

None. All three files have direct analogs with exact or near-exact matches.

---

## Dry-Run Protocol (TBD Count Resolution)

Both `sldl` and `place` counts are TBD pending dry-run. The workflow is:

1. Add MD to all 4 config blocks with TBD values commented as `0` temporarily (so assertion fires immediately and reveals actual count).
2. Run: `npx tsx scripts/load-state-tiger-boundaries.ts --state MD --fips 24 --layers sldl,place --dry-run`
3. MtfccAssertionError output reports `got N` for each layer.
4. Update EXPECTED_MD_MTFCC.sldl and EXPECTED_MD_MTFCC.place with actual N.
5. Update expectedCounts in smoke-md-geofences.ts to match.
6. Run full live load: `--layers cd119,sldu,sldl,place,county` (no --dry-run).

Expected results from research: sldl ~71, place ~311 — but dry-run is authoritative.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 3 analog files (verify-or-tiger-import.sql, smoke-or-geofences.ts, load-state-tiger-boundaries.ts)
**Pattern extraction date:** 2026-06-05
