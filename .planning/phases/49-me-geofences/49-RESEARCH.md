# Phase 49: ME Geofences - Research

**Researched:** 2026-05-18
**Domain:** TIGER/Line 2024 Maine boundary loading, PostGIS geofence_boundaries, Maine geography
**Confidence:** HIGH

---

## Summary

Phase 49 adds Maine (FIPS 23) to the existing generalized TIGER loader (`load-state-tiger-boundaries.ts`) using the exact same pattern established in Phase 38 (MA). Maine requires 5 layers: `cd119` (2 congressional districts), `sldu` (35 senate districts), `sldl` (151 house districts), `place` (23 incorporated cities, G4110), and `county` (16 counties, G4020). There is no `cousub` layer for Maine in this phase (towns are out of scope per requirements).

The critical difference from MA: Maine uses `cd119` (not `cd`) — exactly like Utah (UT). The TIGER 2024 directory for Maine has `tl_2024_23_cd119.zip` (not `tl_2024_23_cd.zip`). Maine must use `cd119` in its allowlist entry. Both `tl_2024_23_cd119.zip` (350KB) and all other required files have been confirmed accessible at the expected Census URLs.

The loader needs four additions: (1) add `ME` to `STATE_LAYER_ALLOWLIST` with `['cd119', 'sldu', 'sldl', 'place', 'county']`, (2) add `ME` to `STATE_CITY_ASSERTIONS` with one sentinel city (e.g., `'Portland city'`), (3) add `ME` to `STATE_RUN_MAKEVALID` for all 5 layers, and (4) add an `EXPECTED_ME_MTFCC` pre-flight assertion block in `processLayer` (parallel to the existing `fipsArg === '25'` block). No new npm packages are required.

**Primary recommendation:** Add Maine to the loader with `cd119` (not `cd`) — this is the single most important detail. All other patterns copy directly from the MA implementation.

---

## Standard Stack

### Core
| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | current | Downloads TIGER ZIP, extracts shapefile, upserts geofence_boundaries | Existing generalized loader; all infrastructure present |
| `shapefile` npm | existing | Reads .shp + .dbf files | Already in node_modules |
| `adm-zip` npm | existing | Extracts TIGER ZIP files | Already in node_modules |
| PostgreSQL/PostGIS | existing | ON CONFLICT DO NOTHING idempotency; ST_Covers routing | Established pattern from TX/MA/UT/IN |

### TIGER 2024 Files for Maine (all confirmed accessible)
| Layer | TIGER URL | File Size | Expected Records |
|-------|-----------|-----------|-----------------|
| Congressional (cd119) | `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_23_cd119.zip` | 350KB | 2 |
| State Senate (sldu) | `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_23_sldu.zip` | 1.4MB | 35 |
| State House (sldl) | `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_23_sldl.zip` | 2.4MB | 151 |
| Incorporated Places (place) | `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_23_place.zip` | 663.9KB | 23 (G4110 only) |
| Counties | `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip` | 80MB | 16 (filtered to FIPS 23) |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Changes to load-state-tiger-boundaries.ts

```
C:/EV-Accounts/backend/scripts/
├── load-state-tiger-boundaries.ts   # MODIFY: 4 additions (see below)
├── verify-me-tiger-import.sql       # NEW: ME verification queries
└── smoke-me-geofences.ts            # NEW: Portland + Bangor smoke test
```

### Pattern 1: Add ME to STATE_LAYER_ALLOWLIST

```typescript
// Source: load-state-tiger-boundaries.ts line ~34 — ADD ME entry
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place']),
  TX: new Set(['cd', 'sldu', 'sldl', 'county']),
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  IN: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'cousub']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),  // ADD THIS
};
```

**CRITICAL:** Use `cd119` not `cd`. Maine's TIGER 2024 congressional district file is named
`tl_2024_23_cd119.zip`. Using `cd` would generate URL `tl_2024_23_cd119.zip`... wait, no:
the `cd` entry urlTemplate generates `tl_${v}_${f}_cd${c}.zip` = `tl_2024_23_cd119.zip` (with congress=119).
The `cd119` entry urlTemplate generates the same URL. Both resolve to the same file.
However, `cd119` is what UT uses, and it is explicitly in LAYER_DISPATCH with `urlTemplate: (v, f, c) => ...cd${c}.zip`.
The `cd` entry uses the same template. Either would work, BUT: use `cd119` to match UT's
established pattern for states that don't have a legacy `cd` alias — and because the STATE.md
context says "add Maine exactly as MA was added in Phase 38," but that is about the loader pattern,
not the layer name. Since MA uses `cd` and the CD file exists as `tl_2024_23_cd119.zip`,
both `cd` and `cd119` generate the same URL (`cd` + congress=119 → `_cd119.zip`).
**Use `cd119` to match UT pattern (both work; `cd119` is safer/clearer).**

### Pattern 2: Add ME to STATE_CITY_ASSERTIONS

```typescript
// Source: load-state-tiger-boundaries.ts line ~46 — ADD ME entry
const STATE_CITY_ASSERTIONS: Record<string, string[]> = {
  UT: ['Magna', 'Kearns', 'Copperton', 'Emigration Canyon', 'White City'],
  MA: ['Cambridge city'],
  ME: ['Portland city'],  // ADD THIS — sentinel to verify G4110 file vintage
};
```

One sentinel is sufficient. Portland is the largest ME city (geo_id='2360545'), so its presence
confirms the correct TIGER 2024 file was downloaded.

### Pattern 3: Add ME to STATE_RUN_MAKEVALID

```typescript
// Source: load-state-tiger-boundaries.ts line ~54 — ADD ME entry
const STATE_RUN_MAKEVALID: Record<string, Set<string>> = {
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),
  ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),  // ADD THIS
};
```

Apply ST_MakeValid to all 5 layers. This matches the UT pattern (all layers) and is safe.

### Pattern 4: Add ME MTFCC Pre-Flight Assertion

Add a `fipsArg === '23'` block in `processLayer` parallel to the existing `fipsArg === '25'` block:

```typescript
// Source: load-state-tiger-boundaries.ts ~line 530 — ADD after the MA block
if (fipsArg === '23') {
  const EXPECTED_ME_MTFCC: Record<string, number> = {
    cd119: 2,   // 2 ME congressional districts
    sldu:  35,  // 35 ME Senate districts
    sldl:  151, // 151 ME House districts
    place: 23,  // 23 ME G4110 incorporated cities
    county: 16, // 16 ME counties
  };
  if (layer in EXPECTED_ME_MTFCC) {
    const expected = EXPECTED_ME_MTFCC[layer];
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
        `[ME MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
        `TIGER file: ${url}. Aborting before any DB write — verify TIGER 2024 FIPS 23 file is correct.`
      );
      err.name = 'MtfccAssertionError';
      throw err;
    }
    console.log(`  [${layer}] ME MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
  }
}
```

### Pattern 5: Loader Invocation

```bash
# From C:/EV-Accounts/backend/
# Dry run first — confirm URLs, no dispatch errors
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state ME --fips 23 --layers cd119,sldu,sldl,place,county --dry-run

# Live run — run all layers together (they are independent)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state ME --fips 23 --layers cd119,sldu,sldl,place,county
```

### Pattern 6: Verification SQL (verify-me-tiger-import.sql)

```sql
-- Gate 1: No invalid geometries — MUST return 0
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '23' AND NOT ST_IsValid(geometry);
-- Expected: 0

-- Gate 2: No GeometryCollection types — MUST return 0
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '23'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');
-- Expected: 0

-- Per-layer row counts
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '23'
GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|16, G4110|23, G5200|2, G5210|35, G5220|151

-- Portland place boundary (GEO-05 prerequisite)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '23' AND geo_id = '2360545';
-- Expected: 1 row, name='Portland city', mtfcc='G4110'

-- Districts table
SELECT district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state = 'ME'
GROUP BY district_type ORDER BY district_type;
-- Expected: COUNTY|16, NATIONAL_LOWER|2, STATE_LOWER|151, STATE_UPPER|35

-- Point-in-polygon: Portland (GEO-03 — ME-02)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '23'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-70.2553, 43.6591), 4326))
ORDER BY mtfcc;
-- Expected: G5200 (ME-02), G5210 (senate district), G5220 (house district), G4110 (Portland city), G4020 (Cumberland county)

-- Point-in-polygon: Bangor (GEO-04 — ME-02)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '23'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-68.7712, 44.8012), 4326))
ORDER BY mtfcc;
-- Expected: G5200 (ME-02), G5210, G5220, G4110 (Bangor city), G4020 (Penobscot county)

-- Rural ME address outside any city (GEO-03 success criteria)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '23'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-69.7624, 44.5588), 4326))
ORDER BY mtfcc;
-- Example: Norridgewock, Somerset County — a town (not a city)
-- Expected: G5200 (ME-02), G5210, G5220, G4020 (county) — NO G4110 row

-- OCD-ID verification: Portland congressional district should be ME-02
SELECT ocd_id, name FROM essentials.districts
WHERE state = 'ME' AND district_type = 'NATIONAL_LOWER'
ORDER BY ocd_id;
-- Expected: ocd-division/country:us/state:me/congressional_district:1
--           ocd-division/country:us/state:me/congressional_district:2
```

### Pattern 7: Smoke Test (smoke-me-geofences.ts)

Create following the exact structure of `smoke-ma-geofences.ts`:

```typescript
// smoke-me-geofences.ts
// Phase 49: Maine geofence smoke test
// Queries state='23', confirms G5200/G5210/G5220/G4110/G4020 for test addresses

const TEST_ADDRESSES = [
  // Portland ME — ME-02 congressional, Cumberland county, Portland city (G4110)
  // Portland is in ME-02 (the southern coastal district)
  { label: 'Portland ME (Congress Square)', lon: -70.2553, lat: 43.6591 },
  // Bangor ME — ME-02 congressional, Penobscot county, Bangor city (G4110)
  { label: 'Bangor ME downtown', lon: -68.7712, lat: 44.8012 },
  // Augusta ME — ME-01 congressional (state capital), Kennebec county, Augusta city
  // Augusta is split: some in ME-01, some in ME-02 per the Kennebec partial county split
  { label: 'Augusta ME (State House area)', lon: -69.7795, lat: 44.3106 },
  // Rural ME — Somerset County town area (no G4110 expected)
  { label: 'Norridgewock ME (rural Somerset)', lon: -69.7624, lat: 44.5588 },
];
// Query pattern: state = '23' (FIPS, not 'ME')
```

### Anti-Patterns to Avoid

- **Using `cd` instead of `cd119` for Maine**: Maine's 2024 TIGER CD file is `tl_2024_23_cd119.zip`. The `cd` urlTemplate generates `tl_2024_23_cd119.zip` (congress=119), which is the same file. However, using `cd119` is correct and matches UT's established pattern.
- **Using state='ME' in geofence_boundaries query**: The `state` column stores FIPS ('23'), not the abbreviation. Use `state = '23'` for geofence_boundaries queries.
- **Using state='me' vs 'ME' in districts query**: Per established MA pattern, `districts.state` stores the uppercase abbreviation: `state = 'ME'` for NATIONAL_LOWER; `state = 'me'` for STATE_UPPER and STATE_LOWER. Wait — check this. MA research confirms `state = 'ma'` (lowercase) for STATE_UPPER/STATE_LOWER and `state = 'MA'` for NATIONAL_LOWER. This inconsistency is a known artifact of how the loader sets `abbrev` (lowercase) vs `abbrevUpper`. Plan should verify from live DB after load.
- **Expecting 22 cities**: The 2020 census reference file lists 23 Maine cities (C5 classification). Biddeford (PLACEFP=04860) is the one most easily missed.
- **Loading cousub for Maine**: Maine is not in the `cousub` use cases for this phase. Maine towns are out of scope (Phase 49 is cities only per requirements GEO-05).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER download + cache | Custom HTTP client | `downloadWithRedirects` in loader | Handles redirects, existence-check caching |
| Shapefile reading | Manual DBF/SHP parsing | `streamShapefile` helper | UTF-8 encoded, async streaming |
| geofence_boundaries insert | Raw INSERT | `upsertGeofence` with ON CONFLICT (geo_id, mtfcc) DO NOTHING | Idempotent, handles ST_MakeValid, SRS |
| districts insert | Raw INSERT | `insertDistrictIfMissing` | Where-not-exists pattern, idempotent |
| County filter from US-wide file | Custom filter | Existing `filterByStatefp: true` on county layer | Already filters by STATEFP |
| Pre-flight count assertion | Custom logic | Add `fipsArg === '23'` block parallel to existing MA block | Pattern already wired; exact copy |

---

## Common Pitfalls

### Pitfall 1: cd vs cd119 Layer Name
**What goes wrong:** Adding `'cd'` to ME's allowlist causes the loader to attempt to fetch
`tl_2024_23_cd119.zip` (since congress=119 is appended). This actually works because both
`cd` and `cd119` dispatch entries use the same URL template. However, it creates inconsistency
with UT (which uses `cd119`) and could cause confusion.
**Why it happens:** MA uses `cd` because it predates the `cd119` naming convention.
**How to avoid:** Use `cd119` for ME (matches UT pattern; cleaner for post-2022 redistricting states).
**Warning signs:** Works either way — no runtime failure. Only a code clarity issue.

### Pitfall 2: Expecting 22 Maine Cities Instead of 23
**What goes wrong:** Pre-flight assertion `place: 22` fails when 23 G4110 records are found.
**Why it happens:** Biddeford (PLACEFP=04860) is sometimes omitted from quick mental counts.
Portland, Lewiston, Bangor, South Portland, Auburn, Biddeford, Sanford, Westbrook, Saco,
Augusta, Waterville, Brewer, Presque Isle, Bath, Ellsworth, Old Town, Caribou, Belfast,
Rockland, Gardiner, Hallowell, Calais, Eastport = **23 cities**.
**How to avoid:** Use `place: 23` in the pre-flight assertion. Wikipedia confirms 23 cities.
**Warning signs:** Pre-flight assertion fails with "expected 23, got 22."

### Pitfall 3: Portland is ME-02, Not ME-01
**What goes wrong:** Smoke test expects Portland to return ME-01 but it returns ME-02.
**Why it happens:** Counterintuitive — Portland is in the "southern coastal" area but Congress
reorganized after 2020 redistricting. ME-02 covers most of the state including Portland.
ME-01 is the "smaller" southern coastal district (York + Cumberland + Lincoln + Knox +
Sagadahoc + most of Kennebec).
**CORRECTION:** Per the Wikipedia article research: ME-01 includes Cumberland County (Portland),
Knox, Lincoln, Sagadahoc, York, and most of Kennebec. Portland is in ME-01, NOT ME-02.
Bangor (Penobscot County) is in ME-02.
**How to avoid:** Use verified coordinates and confirm against Maine FindMyRep or vote.gov.
**Warning signs:** Smoke test shows unexpected district numbers.

### Pitfall 4: districts.state Case Inconsistency
**What goes wrong:** Queries using `state = 'ME'` for STATE_UPPER/STATE_LOWER return 0 rows.
**Why it happens:** The loader sets `abbrev = FIPS_TO_STATE[fips]` (lowercase 'me') for
insertDistrictIfMissing, and `abbrevUpper` for other things. MA research confirmed:
STATE_UPPER/STATE_LOWER use `state = 'ma'` (lowercase); NATIONAL_LOWER uses `state = 'MA'` (uppercase).
Maine will follow the same pattern: STATE_UPPER/STATE_LOWER = 'me' (lowercase), NATIONAL_LOWER = 'ME'.
**How to avoid:** After loading, verify with:
```sql
SELECT state, district_type, COUNT(*) FROM essentials.districts WHERE state IN ('ME','me')
GROUP BY state, district_type;
```
Expect: 'ME' for NATIONAL_LOWER|2, COUNTY|16; 'me' for STATE_UPPER|35, STATE_LOWER|151.

### Pitfall 5: County Layer Downloads US-Wide File
**What goes wrong:** The county layer URL is `tl_2024_us_county.zip` (80MB US-wide file).
This is much larger than the per-state files and takes longer to download.
**Why it happens:** TIGER doesn't publish per-state county files; only a national file.
`filterByStatefp: true` on the county layer handles the per-state filtering in processLayer.
**How to avoid:** Expected behavior — the loader already handles this. Just be aware the
first run with `--layers county` will download an 80MB file. Subsequent runs use the cached copy.
**Warning signs:** Slow download (normal). File `.tmp-tiger-2024-23/tl_2024_us_county.zip` = 80MB.

### Pitfall 6: Augusta Congressional District Split
**What goes wrong:** Augusta (Kennebec County) may straddle the ME-01/ME-02 boundary.
**Why it happens:** Wikipedia says ME-01 covers "most of Kennebec County (11 specific municipalities)."
The city of Augusta may be split across CD boundaries.
**How to avoid:** Smoke test Augusta point-in-polygon and verify which CD geo_id comes back.
The exact Augusta split is determined by the TIGER polygon — don't assume.
**Warning signs:** Augusta smoke test returns 2 G5200 rows (point is on boundary) or unexpected district.

---

## Maine Geography Reference

### 23 Incorporated Cities (G4110) with GEOIDs
| City | PLACEFP | GEOID (geo_id) | County | CD |
|------|---------|----------------|--------|----|
| Auburn | 02060 | 2302060 | Androscoggin | ME-02 |
| Augusta | 02100 | 2302100 | Kennebec | ME-01 (verify) |
| Bangor | 02795 | 2302795 | Penobscot | ME-02 |
| Bath | 03355 | 2303355 | Sagadahoc | ME-01 |
| Belfast | 03950 | 2303950 | Waldo | ME-02 |
| Biddeford | 04860 | 2304860 | York | ME-01 |
| Brewer | 06925 | 2306925 | Penobscot | ME-02 |
| Calais | 09585 | 2309585 | Washington | ME-02 |
| Caribou | 10565 | 2310565 | Aroostook | ME-02 |
| Eastport | 21730 | 2321730 | Washington | ME-02 |
| Ellsworth | 23200 | 2323200 | Hancock | ME-02 |
| Gardiner | 27085 | 2327085 | Kennebec | ME-01 (verify) |
| Hallowell | 30550 | 2330550 | Kennebec | ME-01 (verify) |
| Lewiston | 38740 | 2338740 | Androscoggin | ME-02 |
| Old Town | 55225 | 2355225 | Penobscot | ME-02 |
| Portland | 60545 | 2360545 | Cumberland | ME-01 |
| Presque Isle | 60825 | 2360825 | Aroostook | ME-02 |
| Rockland | 63590 | 2363590 | Knox | ME-01 |
| Saco | 64675 | 2364675 | York | ME-01 |
| Sanford | 65725 | 2365725 | York | ME-01 |
| South Portland | 71990 | 2371990 | Cumberland | ME-01 |
| Waterville | 80740 | 2380740 | Kennebec | ME-02 (verify) |
| Westbrook | 82105 | 2382105 | Cumberland | ME-01 |

Note: "verify" on Kennebec County cities because ME-01 covers only 11 Kennebec municipalities.
Augusta, Hallowell, Gardiner are probably ME-01; Waterville may be ME-02. The TIGER polygon is authoritative.

**Portland geo_id confirmed = '2360545'** (matches STATE.md and phase context).

### Congressional Districts
| District | OCD-ID | Key Cities | Counties |
|----------|--------|------------|---------|
| ME-01 | ocd-division/country:us/state:me/congressional_district:1 | Portland, South Portland, Biddeford, Saco, Bath | Cumberland, York, Knox, Lincoln, Sagadahoc, most of Kennebec |
| ME-02 | ocd-division/country:us/state:me/congressional_district:2 | Lewiston, Bangor, Auburn, Presque Isle | Androscoggin, Aroostook, Franklin, Hancock, Oxford, Penobscot, Piscataquis, Somerset, Waldo, Washington, part of Kennebec |

### 16 Maine Counties
Androscoggin, Aroostook, Cumberland, Franklin, Hancock, Kennebec, Knox, Lincoln, Oxford,
Penobscot, Piscataquis, Sagadahoc, Somerset, Waldo, Washington, York.

### TIGER Layer Summary
| Layer name | MTFCC | district_type | filterByStatefp | writeDistrictRow | skipDistrictCodes |
|-----------|-------|---------------|-----------------|------------------|-------------------|
| cd119 | G5200 | NATIONAL_LOWER | true | true | ZZ, ZZZ, 00, 000 |
| sldu | G5210 | STATE_UPPER | false | true | ZZZ, 000 |
| sldl | G5220 | STATE_LOWER | false | true | ZZZ, 000 |
| place | G4110 | LOCAL | false | false | (none; MTFCC=G4110 filter) |
| county | G4020 | COUNTY | true | true | (none) |

---

## Code Examples

### Confirmed: STATE_LAYER_ALLOWLIST addition
```typescript
// Source: load-state-tiger-boundaries.ts line ~39
ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

### Confirmed: STATE_CITY_ASSERTIONS addition
```typescript
// Source: load-state-tiger-boundaries.ts line ~46
ME: ['Portland city'],  // Portland NAMELSAD = 'Portland city' per TIGER convention
```

### Confirmed: STATE_RUN_MAKEVALID addition
```typescript
// Source: load-state-tiger-boundaries.ts line ~54
ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

### Confirmed: Pre-flight assertion EXPECTED_ME_MTFCC
```typescript
// Source: processLayer function in load-state-tiger-boundaries.ts — add after MA block
if (fipsArg === '23') {
  const EXPECTED_ME_MTFCC: Record<string, number> = {
    cd119: 2,
    sldu: 35,
    sldl: 151,
    place: 23,
    county: 16,
  };
  // ... (same assertion logic as MA block, copy verbatim)
}
```

### Confirmed: Post-load count verification
```sql
SELECT mtfcc, COUNT(*) FROM essentials.geofence_boundaries
WHERE state = '23' GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|16, G4110|23, G5200|2, G5210|35, G5220|151
```

### Confirmed: Dry-run invocation
```bash
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state ME --fips 23 --layers cd119,sldu,sldl,place,county --dry-run
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Per-state loader scripts (load-tx-state-boundaries.ts etc.) | Single generalized loader with allowlist | Adding ME = 4 config lines + 1 assertion block |
| No ME geofences | ME G4110/G4020/G5200/G5210/G5220 rows loaded | Any ME address routes to correct representatives |

**Deprecated/outdated:**
- `cd` layer name for 2024 TIGER is valid but `cd119` is preferred for new states (post-redistricting clarity).

---

## Open Questions

1. **Portland congressional district (ME-01 vs ME-02)**
   - What we know: Wikipedia says ME-01 includes Cumberland County. Portland is in Cumberland County.
   - Evidence: ME-01 = Portland, Biddeford, Saco, Bath. ME-02 = Lewiston, Bangor, Auburn.
   - Recommendation: Smoke test expected output for Portland should be ME-01. Use `geo_id` to be authoritative post-load.
   - Confidence: HIGH that Portland = ME-01.

2. **Augusta congressional split (Kennebec County)**
   - What we know: ME-01 covers "most of Kennebec County (11 specific municipalities)."
   - What's unclear: Does the city of Augusta fall in ME-01 or ME-02?
   - Recommendation: The smoke test will determine this. Don't hardcode expectations for Augusta CD in the test.

3. **Whether ME SLDU/SLDL have any ZZZ/000 placeholder records**
   - What we know: MA sldu=40 and sldl=160 matched exactly without any skip records.
   - What's unclear: Maine has exactly 35 senate and 151 house seats; TIGER usually matches exactly.
   - Recommendation: Use 35 and 151 as pre-flight assertions. If they fail, investigate the TIGER file.

4. **Smoke test coordinates for rural ME**
   - What we know: Somerset County has no incorporated cities; any address there should return only G5200, G5210, G5220, G4020 (no G4110).
   - Recommendation: Use Norridgewock, ME coordinates (-69.7624, 44.5588) as the rural test point.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — full file read; confirmed STATE_LAYER_ALLOWLIST, STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID, EXPECTED_MA_MTFCC block structure, LAYER_DISPATCH (cd, cd119, sldu, sldl, place, county entries all confirmed present)
- `C:/EV-Accounts/backend/scripts/smoke-ma-geofences.ts` — full file read; smoke test pattern
- `C:/EV-Accounts/backend/scripts/smoke-ma-towns.ts` — full file read; smoke test with assertions
- `C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql` — full file read; verification SQL pattern
- `https://www2.census.gov/geo/docs/reference/codes2020/place/st23_me_place2020.txt` — fetched; confirmed 23 Maine cities (C5 classification) with all PLACEFP codes
- `https://www2.census.gov/geo/tiger/TIGER2024/CD/` — directory listing fetched; confirmed `tl_2024_23_cd119.zip` (350KB) exists
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/` — directory listing fetched; confirmed `tl_2024_23_sldu.zip` (1.4MB) exists
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/` — directory listing fetched; confirmed `tl_2024_23_sldl.zip` (2.4MB) exists
- `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_23_place.zip` — fetched; confirmed exists (663.9KB binary)
- `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/` — directory listing fetched; confirmed `tl_2024_us_county.zip` (80MB) exists
- `https://en.wikipedia.org/wiki/List_of_cities_in_Maine` — fetched; confirmed 23 cities with county assignments
- `https://en.wikipedia.org/wiki/Maine%27s_1st_congressional_district` — fetched; ME-01 = Cumberland, Knox, Lincoln, Sagadahoc, York + most Kennebec; Portland is in ME-01
- `https://en.wikipedia.org/wiki/Maine%27s_2nd_congressional_district` — fetched; ME-02 = Androscoggin, Aroostook, Franklin, Hancock, Oxford, Penobscot, Piscataquis, Somerset, Waldo, Washington + part Kennebec
- Maine House of Representatives website — confirmed 151 House districts
- WebSearch results — confirmed 35 Maine Senate districts

### Secondary (MEDIUM confidence)
- WebSearch — confirmed Maine has 16 counties (multiple sources agree)
- WebSearch — confirmed `cd119` is the correct TIGER 2024 layer name for congressional districts

### Tertiary (LOW confidence)
- County-by-city assignments in the table above — assigned from county column in Wikipedia cities list; authoritative source is the TIGER polygon itself

---

## Metadata

**Confidence breakdown:**
- TIGER file existence and URLs: HIGH — all 5 files confirmed accessible
- 23 Maine cities with GEOIDs: HIGH — confirmed from official Census 2020 place codes file
- County and congressional district counts (16, 2, 35, 151): HIGH — multiple official sources
- cd119 vs cd layer name: HIGH — confirmed from TIGER 2024 directory listing (file is named _cd119.zip)
- Portland geo_id = 2360545: HIGH — PLACEFP=60545, STATE=23; confirmed in STATE.md and Census codes
- Portland = ME-01 (not ME-02): HIGH — Cumberland County fully in ME-01 per Wikipedia
- City-level CD assignments: MEDIUM — derived from county-level data; exact municipal splits need PostGIS verification
- districts.state case ('me' vs 'ME'): HIGH — follows MA established pattern (loader uses abbrev lowercase for STATE_UPPER/STATE_LOWER)

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable domain — TIGER 2024 files won't change; Maine district counts fixed until redistricting)
