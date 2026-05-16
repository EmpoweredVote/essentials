# Phase 38: MA Geofences - Research

**Researched:** 2026-05-16
**Domain:** TIGER/Line 2024 boundary loading, PostGIS geofence_boundaries, Massachusetts political geography
**Confidence:** HIGH

---

## Summary

Phase 38 loads all Massachusetts TIGER/Line 2024 boundary data (9 congressional, 40 senate, 160 house, 351 incorporated municipalities, 14 counties) into `essentials.geofence_boundaries` using the existing generalized `load-state-tiger-boundaries.ts` loader. The loader already handles all required layers (cd/sldu/sldl/place/county) and only needs MA added to `STATE_LAYER_ALLOWLIST`. No new infrastructure is required.

The primary complication is Massachusetts place geography: TIGER ships both incorporated places (MTFCC G4110) and Census-Designated Places (CDPs, MTFCC G4210) in the same shapefile. The loader already filters to G4110 only in `processLayer` — this is the correct behavior and will produce exactly 351 rows for MA (one per incorporated municipality). Cambridge's GEOID is `2511000` (7-char: state FIPS 25 + place FIPS 11000).

Verification is non-trivial because Cambridge straddles two congressional districts (MA-05/Clark and MA-07/Pressley). The smoke test must probe addresses on both sides of this boundary, and addresses on the Cambridge/Somerville border to confirm PLACE boundaries disambiguate correctly.

**Primary recommendation:** Add `MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county'])` to `STATE_LAYER_ALLOWLIST`, add `MA: ['Cambridge city']` to `STATE_CITY_ASSERTIONS`, add `STATE_RUN_MAKEVALID` entry for MA place layer, then run via `--state MA --fips 25 --layers cd,sldu,sldl,place,county`. Add pre-flight MTFCC assertion before any DB writes.

---

## Standard Stack

### Core
| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | current | Downloads TIGER ZIP, extracts shapefile, upserts to geofence_boundaries + districts | Existing generalized loader; handles all 5 required layers |
| `shapefile` npm | existing | Reads .shp + .dbf files | Used by loader; already in node_modules |
| `adm-zip` npm | existing | Extracts TIGER ZIP files | Used by loader; already in node_modules |
| PostgreSQL/PostGIS | existing | ON CONFLICT DO NOTHING idempotency; ST_Contains point-in-polygon | All geofence work uses this pattern |

### TIGER 2024 Files for MA (FIPS 25)
| Layer | TIGER URL | File Size | Records Expected |
|-------|-----------|-----------|-----------------|
| Congressional (cd) | `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_25_cd119.zip` | 451K | 9 |
| State Senate (sldu) | `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_25_sldu.zip` | 818K | 40 |
| State House (sldl) | `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_25_sldl.zip` | ~2MB est. | 160 |
| Incorporated Places | `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_25_place.zip` | 1.1M | 351 (G4110 only) |
| Counties | `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip` | 80M national | 14 (filter STATEFP=25) |

Note: The cd layer uses file suffix `cd119` (119th Congress) matching the existing `cd` LAYER_DISPATCH urlTemplate.

### Installation
No new packages required. Script already exists at `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts`.

---

## Architecture Patterns

### Recommended Project Structure

```
C:/EV-Accounts/backend/scripts/
├── load-state-tiger-boundaries.ts   # MODIFY: add MA to STATE_LAYER_ALLOWLIST,
│                                    # STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID
├── verify-ma-tiger-import.sql       # NEW: post-load verification queries (mirrors verify-ut-tiger-import.sql)
└── smoke-ma-geofences.ts            # NEW: Cambridge 4-address smoke test script
```

### Pattern 1: Adding MA to STATE_LAYER_ALLOWLIST

The three registration tables in `load-state-tiger-boundaries.ts` all require MA entries. This is a code-change gate by design (forces explicit review).

```typescript
// Source: load-state-tiger-boundaries.ts lines 34-39 — add MA entry
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  CA: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place']),
  TX: new Set(['cd', 'sldu', 'sldl', 'county']),
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  IN: new Set(['cd', 'sldu', 'sldl', 'unsd', 'place', 'cousub']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county']),  // ADD THIS
};

// Source: load-state-tiger-boundaries.ts lines 45-47 — add MA entry
const STATE_CITY_ASSERTIONS: Record<string, string[]> = {
  UT: ['Magna', 'Kearns', 'Copperton', 'Emigration Canyon', 'White City'],
  MA: ['Cambridge city'],  // ADD THIS — validates Cambridge GEOID 2511000 is present
};

// Source: load-state-tiger-boundaries.ts lines 50-53 — add MA entry
const STATE_RUN_MAKEVALID: Record<string, Set<string>> = {
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county']),  // ADD THIS
};
```

### Pattern 2: MTFCC Pre-Flight Assertion

The CONTEXT.md decision requires a hard assertion BEFORE any DB upsert. The assertion belongs in the loader as a pre-pass over the extracted shapefile — count records per layer, halt if wrong.

```typescript
// Pattern: pre-flight gate before processLayer is called
// Place this AFTER download+extract but BEFORE streamShapefile upsert
const MA_EXPECTED_COUNTS: Record<string, number> = {
  cd:     9,    // 9 congressional districts
  sldu:   40,   // 40 state senate districts
  sldl:   160,  // 160 state house districts
  place:  351,  // 351 incorporated municipalities (G4110 only)
  county: 14,   // 14 MA counties (after STATEFP filter)
};

// Assertion: count records matching layer criteria, then compare
// Throw named error with exact message per CONTEXT.md:
// "Expected 40 SLDU, got 38 — check TIGER file for state 25"
function assertLayerCount(layer: string, actual: number, expected: number, fips: string): void {
  if (actual !== expected) {
    throw new Error(
      `Expected ${expected} ${layer.toUpperCase()}, got ${actual} — check TIGER file for state ${fips}`
    );
  }
}
```

### Pattern 3: Cambridge Smoke Test SQL Query

```sql
-- Source: verify-ut-tiger-import.sql pattern — adapt for MA
-- Point-in-polygon test: ST_MakePoint(longitude, latitude)

-- MIT campus (MA-07, 25th Middlesex House, 2nd Middlesex Senate)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.0922, 42.3601), 4326));

-- North Cambridge / Alewife (MA-05, 24th Middlesex House area)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.1432, 42.3956), 4326));

-- Cambridge/Somerville border area
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.1003, 42.3835), 4326));
-- Must return Cambridge place boundary (2511000), NOT Somerville (2562535)
```

### Pattern 4: Middlesex County Congressional Intersection (G4020 smoke test)

```sql
-- Verify Middlesex county (25017) intersects MA-05 and MA-07 boundaries
SELECT d.geo_id, d.label
FROM essentials.geofence_boundaries county_gb
JOIN essentials.geofence_boundaries cd_gb
  ON ST_Intersects(county_gb.geometry, cd_gb.geometry)
  AND cd_gb.mtfcc = 'G5200'
JOIN essentials.districts d ON d.geo_id = cd_gb.geo_id
  AND d.district_type = 'NATIONAL_LOWER'
  AND d.state = 'MA'
WHERE county_gb.geo_id = '25017'
  AND county_gb.mtfcc = 'G4020';
-- Must return multiple rows including MA-05 (2505) and MA-07 (2507)
```

### Recommended Project Structure for Layer Loading

The `--layers` flag handles all 5 layers in one invocation:

```bash
# From C:/EV-Accounts/backend/
# Dry run first — no DB writes, preview layer URLs
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MA --fips 25 --layers cd,sldu,sldl,place,county --dry-run

# Live run (idempotent — ON CONFLICT DO NOTHING)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MA --fips 25 --layers cd,sldu,sldl,place,county
```

### Anti-Patterns to Avoid

- **Loading cousub for MA instead of place**: Massachusetts uses incorporated places (G4110) for city routing, not county subdivisions. IN uses cousub; MA does NOT.
- **Separate script per layer**: The `--layers` flag allows a single invocation. Only split into multiple runs if debugging a specific layer failure.
- **Skipping the MTFCC assertion**: The CA bug (SLDU/SLDL swapped) would pass silently without this gate.
- **Using state abbreviation 'MA' in geofence_boundaries.state**: The `state` column stores FIPS code ('25'), not abbreviation. The `upsertGeofence` helper receives `fipsArg`, not `abbrevUpper`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER ZIP download + extract | Custom HTTP fetch | `downloadWithRedirects` + `extractZip` in loader | Handles redirects, caching (file-exists check), cleanup |
| Reading .shp + .dbf shapefile | Manual binary parsing | `streamShapefile` helper using `shapefile` npm | Already handles UTF-8 encoding, async streaming |
| Writing to geofence_boundaries | Raw INSERT | `upsertGeofence` helper with ON CONFLICT (geo_id, mtfcc) DO NOTHING | Idempotency, MakeValid, correct SRS enforcement |
| Writing to districts table | Raw INSERT | `insertDistrictIfMissing` helper | Pattern-compliant, safe re-runs |
| OCD-ID construction | Ad-hoc string concat | `buildOcdId` helper | Single source of truth; grep-verifiable |
| Column name resolution | Hardcoded field names | `resolveColumn` with candidates list | TIGER vintage drift (NAMELSAD vs NAMELSAD20 etc.) |

**Key insight:** `load-state-tiger-boundaries.ts` already handles the full pipeline for MA's required layers (cd, sldu, sldl, place, county). The only code changes needed are the three registration table entries (allowlist, assertions, MakeValid) and the MTFCC pre-flight assertion logic.

---

## Common Pitfalls

### Pitfall 1: Place Layer Includes CDPs (G4210) — Wrong Count
**What goes wrong:** The MA place shapefile contains both incorporated places (G4110, count ~351) AND Census-Designated Places (CDPs, G4210). If the G4110 MTFCC filter is removed or bypassed, rows like "Kendall Square CDP" and "East Cambridge CDP" land in geofence_boundaries, inflating the count beyond 351.
**Why it happens:** The `processLayer` function has an explicit `if (layer === 'place') { if (mtfccRaw !== 'G4110') { skipped++ } }` guard at line 530. This guard is correct and must remain.
**How to avoid:** The existing code is correct. The MTFCC assertion (expected: 351) will catch any regression.
**Warning signs:** Pre-flight assertion fails with count > 351.

### Pitfall 2: SLDU/SLDL MTFCC Inversion (the CA bug)
**What goes wrong:** sldu (G5210, STATE_UPPER, senate) and sldl (G5220, STATE_LOWER, house) rows land in the wrong district_type buckets. This was the CA state boundaries bug.
**Why it happens:** The LAYER_DISPATCH table maps layer key → mtfcc. A copy-paste error can swap G5210 and G5220.
**How to avoid:** The pre-flight assertion checks exact counts per layer. If sldu returns 160 rows (expected 40), the assertion fires before any DB write.
**Warning signs:** `SELECT mtfcc, COUNT(*) FROM geofence_boundaries WHERE state = '25' GROUP BY mtfcc` shows 160 G5210 and 40 G5220 (should be reversed).

### Pitfall 3: Cambridge on the MA-05/MA-07 Boundary
**What goes wrong:** A verification address in Cambridge returns the wrong congressional district, but the test passes because the address is in the correct part of Cambridge.
**Why it happens:** Cambridge is split — roughly the western/northern portion (North Cambridge, Porter Square area) is MA-05 (Clark), and the eastern/southern portion (MIT, Kendall Square, Central Square) is MA-07 (Pressley).
**How to avoid:** Use addresses on BOTH sides of the split. The smoke test must include at least one address confirmed MA-05 and one confirmed MA-07. Cambridge GIS shows the two Congressional Districts layer.
**Warning signs:** Both test addresses return the same congressional district.

### Pitfall 4: County File is 80MB National File
**What goes wrong:** The county loader downloads `tl_2024_us_county.zip` (80MB), which is a national file containing all 3,000+ US counties. The MA-specific filter (`filterByStatefp: true`) then applies STATEFP='25' to keep only 14 rows.
**Why it happens:** TIGER does not provide per-state county files — county is a national-only layer.
**How to avoid:** This is expected behavior. The loader's `filterByStatefp` flag handles it. Download time will be longer than other layers (~80MB vs ~1MB). Cache behavior (file-exists check in `downloadWithRedirects`) prevents re-download on re-runs.
**Warning signs:** Slow download for county layer is normal; not a bug.

### Pitfall 5: Cambridge/Somerville Border Address Returns Wrong PLACE
**What goes wrong:** An address near the Cambridge/Somerville border resolves to the Somerville place polygon instead of Cambridge.
**Why it happens:** TIGER incorporated place boundaries are precise legal boundaries — the correct polygon should return Cambridge. But if the address coordinates are slightly off (e.g., using a Somerville-side address mistakenly labeled as Cambridge), the test will fail for wrong reasons.
**How to avoid:** Use coordinates that are unambiguously inside Cambridge (e.g., 100+ meters from the border). Verify coordinates with Census Geocoder API before encoding in smoke test.
**Warning signs:** Smoke test returns Somerville PLACE geo_id (2562535) for a Cambridge address.

### Pitfall 6: state='25' vs state='MA' in geofence_boundaries
**What goes wrong:** A query filtering `WHERE state = 'MA'` returns 0 rows because the column stores FIPS code.
**Why it happens:** `upsertGeofence` receives `state: fipsArg` (the 2-digit FIPS string, '25' for MA). The `insertDistrictIfMissing` helper receives `state: abbrev` (lowercase abbreviation 'ma'). These two columns serve different tables with different conventions.
**How to avoid:** Always use `state = '25'` for `geofence_boundaries` queries. Use `state = 'MA'` (uppercase) for `districts` table queries per the existing pattern.
**Warning signs:** `SELECT COUNT(*) FROM geofence_boundaries WHERE state = '25'` returns 0 after loading.

---

## Code Examples

### Verified: Script invocation pattern (after adding MA to allowlist)

```bash
# Source: load-state-tiger-boundaries.ts CLI pattern (lines 12-13 header comment)
# From C:/EV-Accounts/backend/

npx tsx scripts/load-state-tiger-boundaries.ts --state MA --fips 25 --layers cd,sldu,sldl,place,county --dry-run

npx tsx scripts/load-state-tiger-boundaries.ts --state MA --fips 25 --layers cd,sldu,sldl,place,county
```

### Verified: Post-load count verification SQL

```sql
-- Source: verify-ut-tiger-import.sql pattern
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '25'
GROUP BY mtfcc
ORDER BY mtfcc;
-- Expected:
--   G4020 | 14    (counties)
--   G4110 | 351   (incorporated places)
--   G5200 | 9     (congressional districts)
--   G5210 | 40    (state senate)
--   G5220 | 160   (state house)
```

### Verified: Cambridge PLACE geo_id lookup

```sql
-- Source: established pattern from load-state-tiger-boundaries.ts (GEOID field for place)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '25' AND mtfcc = 'G4110' AND geo_id = '2511000';
-- Expected: Cambridge city, G4110
```

### Verified: geofence_boundaries INSERT pattern (from upsertGeofence helper)

```typescript
// Source: load-state-tiger-boundaries.ts lines 329-347
// ON CONFLICT (geo_id, mtfcc) DO NOTHING — idempotent
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES ($1, $2, $3, $4, $5,
  ST_MakeValid(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON($6)), 4326)),  // runMakeValid=true for MA
  'census_tiger_2024', now())
ON CONFLICT (geo_id, mtfcc) DO NOTHING
```

---

## MA-Specific Geographic Facts

### 9 Congressional Districts (119th Congress, all-Democratic)
| District | TIGER geo_id | Representative |
|----------|-------------|----------------|
| MA-01 | 2501 | Richard Neal |
| MA-02 | 2502 | Jim McGovern |
| MA-03 | 2503 | Lori Trahan |
| MA-04 | 2504 | Jake Auchincloss |
| MA-05 | 2505 | Katherine Clark |
| MA-06 | 2506 | Seth Moulton |
| MA-07 | 2507 | Ayanna Pressley |
| MA-08 | 2508 | Stephen Lynch |
| MA-09 | 2509 | Bill Keating |

geo_id format: state FIPS (25) + zero-padded district number (01-09) — confirmed by established TIGER GEOID convention (STATEFP + CD119FP).

### Cambridge Congressional Split
Cambridge straddles MA-05 (Clark) and MA-07 (Pressley). Northern Cambridge/Porter Square area = MA-05. Eastern Cambridge/MIT/Kendall/Central = MA-07. This is explicitly confirmed by Cambridge GIS and Wikipedia citations.

### 14 MA Counties with FIPS codes
| County | FIPS | geo_id |
|--------|------|--------|
| Barnstable | 25001 | 25001 |
| Berkshire | 25003 | 25003 |
| Bristol | 25005 | 25005 |
| Dukes (Martha's Vineyard) | 25007 | 25007 |
| Essex | 25009 | 25009 |
| Franklin | 25011 | 25011 |
| Hampden | 25013 | 25013 |
| Hampshire | 25015 | 25015 |
| Middlesex | 25017 | 25017 |
| Nantucket | 25019 | 25019 |
| Norfolk | 25021 | 25021 |
| Plymouth | 25023 | 25023 |
| Suffolk | 25025 | 25025 |
| Worcester | 25027 | 25027 |

Middlesex County (25017) is the smoke test county — contains Cambridge.

### Cambridge State Legislative Districts
Cambridge spans multiple districts. Known from Cambridge election commission materials:
- **State Senate**: Middlesex and Suffolk District (wards 1, 2/P1, 3, 4/P2, 6-8) and 2nd Middlesex District (remaining Cambridge wards)
- **State House**: Multiple Middlesex districts including 24th (North Cambridge/Arlington/Belmont), 25th, 26th, 27th Middlesex — exact precinct assignments require FindMyLegislator ground truth at smoke test time

**For TIGER NAMELSAD field values**: Districts are named like "24th Middlesex District" (house) and "2nd Middlesex District" (senate). TIGER's NAMELSAD field will contain these names verbatim.

### Cambridge Place Boundary
- **GEOID**: 2511000 (state FIPS 25 + place FIPS 11000)
- **MTFCC**: G4110 (incorporated place)
- **Name in TIGER**: "Cambridge city"
- CDPs within Cambridge (East Cambridge, Kendall Square, etc.) have MTFCC G4210 and will be filtered out by the G4110 guard.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-state custom scripts | `load-state-tiger-boundaries.ts` generic loader | Phase 130 | Add MA via allowlist, no new script needed |
| No MTFCC validation | Pre-flight assertion gate | Required by CONTEXT.md | Catches CA-style SLDU/SLDL swap bug |
| Only load specific counties | Load all 14 MA counties | Phase 38 decision | Enables future routing for Boston, Worcester, etc. |

**Deprecated/outdated:**
- `load-ca-state-boundaries.ts`: Deleted in Phase 130, subsumed by generic loader
- `load-tx-state-boundaries.ts`: Deleted in Phase 130, subsumed by generic loader
- `load-us-congressional-boundaries.ts`: Deleted in Phase 130, subsumed by generic loader; the `cd` layer key in LAYER_DISPATCH replaces it

---

## Open Questions

1. **Exact TIGER SLDL file URL for MA**
   - What we know: The SLDU file `tl_2024_25_sldu.zip` (818K) is confirmed present at the Census URL. The SLDL file follows the same naming convention `tl_2024_25_sldl.zip`.
   - What's unclear: The SLDL URL couldn't be directly verified (Census server returned 403 when fetching the directory). The naming convention is consistent across all other states.
   - Recommendation: The loader's `urlTemplate` function generates `tl_${vintage}_${fips}_sldl.zip` which follows the confirmed pattern. Run `--dry-run` to preview the exact URL before live run.

2. **Exact Cambridge ward-level MA-05/MA-07 boundary coordinates**
   - What we know: Cambridge is split between MA-05 (northern/western) and MA-07 (eastern/southern including MIT, Central Square, Kendall). Cambridge GIS confirms two districts.
   - What's unclear: The exact street-level dividing line without accessing Cambridge GIS shapefiles directly.
   - Recommendation: At smoke test time, use FindMyLegislator to confirm which congressional district each test address returns, then lock those as ground truth. Do NOT pre-hardcode expected results — let TIGER + FindMyLegislator agree at runtime.

3. **MTFCC pre-flight assertion implementation location**
   - What we know: CONTEXT.md requires a hard assertion BEFORE any DB upsert.
   - What's unclear: Whether to add it inside `processLayer` (between extract and stream) or as a new `assertLayerCounts` function called from `main`.
   - Recommendation: Add it as a two-pass within `processLayer` — first pass counts records satisfying the same filters (STATEFP, MTFCC G4110 for place, skipDistrictCodes), second pass upserts. This ensures the assertion tests EXACTLY what would be written.

4. **Migration number for MA government row (Phase 41 dependency)**
   - What we know: Latest migration is 100 (20260516000003_100_sherman_full_coverage_sprint.sql). Phase 38 is pure boundary loading — no migration needed.
   - What's unclear: Phase 41's migration number will be ~101-105 depending on intervening phases.
   - Recommendation: Phase 38 does NOT need a migration. The geofence_boundaries table already exists with the correct schema. The loader script is the only deliverable.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — full file read; STATE_LAYER_ALLOWLIST, STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID, LAYER_DISPATCH, upsertGeofence, insertDistrictIfMissing, processLayer, CLI patterns
- `C:/EV-Accounts/backend/scripts/verify-ut-tiger-import.sql` — full file read; verification SQL pattern, point-in-polygon queries, geometry validity gates
- `C:/EV-Accounts/backend/scripts/load-collin-county-boundary.ts` — full file read; county G4020 boundary loading pattern, `state: fipsArg` convention
- `C:/EV-Accounts/backend/scripts/audit-112-geofence.ts` — full file read; Cambridge smoke test structure pattern (multi-address, expected district labels)
- `https://www2.census.gov/geo/tiger/TIGER2024/CD/` — confirmed `tl_2024_25_cd119.zip` exists (451K)
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/` — confirmed `tl_2024_25_sldu.zip` exists (818K)
- `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/` — confirmed `tl_2024_25_place.zip` exists (1.1M)
- `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/` — confirmed `tl_2024_us_county.zip` exists (80M national)

### Secondary (MEDIUM confidence)
- Ballotpedia — Massachusetts has 40 state senate seats, 160 state house seats; confirmed post-2022 redistricting
- Wikipedia Massachusetts congressional districts — 9 districts, all Democratic, MA-05=Clark, MA-07=Pressley, Cambridge split between both
- Cambridge election commission GIS — confirms Cambridge has two congressional districts (MA-05 and MA-07)
- Search results confirming 14 MA counties with FIPS codes 25001-25027
- Cambridge GEOID 2511000 confirmed via datacommons.org Census place ID

### Tertiary (LOW confidence)
- TIGER SLDL file URL (`tl_2024_25_sldl.zip`) — naming convention extrapolated from confirmed SLDU filename; server returned 403 on directory listing. Consistent with all other states. Verify via --dry-run.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — loader script fully read; all TIGER URLs verified except SLDL
- Architecture (loader changes): HIGH — exact code locations identified, pattern from UT addition
- MTFCC counts (9/40/160/351/14): HIGH — Massachusetts count confirmed from Ballotpedia, Census, and Wikipedia
- Pitfalls: HIGH — derived from existing codebase bugs and patterns
- Cambridge district geography: MEDIUM — Cambridge split confirmed but exact ward-level boundary requires FindMyLegislator at test time

**Research date:** 2026-05-16
**Valid until:** 2026-06-16 (stable domain — district counts fixed until next redistricting)
