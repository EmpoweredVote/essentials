# Phase 100: VA TIGER Geofences - Research

**Researched:** 2026-06-08
**Domain:** TIGER 2024 boundary loading, PostGIS geofencing, Virginia legislative district structure
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VA-GEO-01 | VA TIGER geofences loaded — G4110 incorporated places, G4020 counties + independent cities, G5200 CD×11, G5210 SLDU×40, G5220 SLDL×100; state='51' in geofence_boundaries | TIGER URLs confirmed; loader add-VA pattern identical to MD Phase 91; FIPS '51' in FIPS_TO_STATE already |
| VA-GEO-02 | Alexandria independent city dual-tier — geo_id=`5101000` (G4110 place) AND geo_id=`51510` (G4020 county-equivalent) both present | Baltimore City dual-tier confirmed identical pattern; auto-handles via separate PLACE and COUNTY layer loads |
| VA-GEO-03 | Any VA address returns correct federal, state, and city representatives via PostGIS routing (verified end-to-end) | smoke-va-geofences.ts with Alexandria + Richmond + rural addresses; G5200 already routes Alexandria correctly |
</phase_requirements>

---

## Summary

Phase 100 loads Virginia TIGER 2024 boundary layers into `essentials.geofence_boundaries` with `state='51'` using the existing `load-state-tiger-boundaries.ts` generalized loader. **The loader is NOT yet configured for Virginia** — it must be added to `STATE_LAYER_ALLOWLIST`, `STATE_CITY_ASSERTIONS`, `STATE_RUN_MAKEVALID`, and a new `EXPECTED_VA_MTFCC` pre-flight assertion block must be added to `processLayer()`. This is identical to the pattern used for MD (Phase 91), OR (Phase 72), ME, and MA.

**Critical pre-existing state:** 11 G5200 (congressional district) rows already exist in `essentials.geofence_boundaries` for state='51', plus 11 NATIONAL_LOWER + 1 NATIONAL_UPPER rows in `essentials.districts`. These were loaded by a previous TIGER run. Their geo_id format (`5101`–`5111`) matches exactly what the TIGER loader produces for cd119 — so re-running cd119 is safe (ON CONFLICT (geo_id, mtfcc) DO NOTHING skips existing rows). The planner MUST decide: load cd119 anyway for completeness/idempotency, or skip it since all 11 rows are already valid and geometrically correct.

**Virginia-specific structure:** Virginia has 100 House of Delegates districts (100 single-member districts — unlike Maryland's multi-member model with 71 polygons for 141 delegates). The SLDL count from the TIGER file is therefore expected to be exactly 100 polygons. The VA SLDU count is 40 (one per state senator). Virginia also has 38 independent cities that function as county-equivalents — they appear in the G4020 (county) TIGER layer alongside the 95 true counties, giving G4020 = 133 rows total (95 + 38).

The **Alexandria dual-tier** (VA-GEO-02) is automatic: the G4110 PLACE layer produces geo_id=`5101000` (STATEFP 51 + PLACEFP 01000) and the G4020 COUNTY layer produces geo_id=`51510` (STATEFP 51 + COUNTYFP 510). No special loader handling is required beyond loading both layers.

**Primary recommendation:** Add VA to the loader allowlist (4 config additions + EXPECTED_VA_MTFCC block with sentinel 0s for sldl and place), dry-run all layers to confirm counts, then live-load all five layers. Create verify-va-tiger-import.sql and smoke-va-geofences.ts from MD templates.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TIGER file download | Script (Node.js) | — | Loader handles HTTP download with redirect following |
| Shapefile parsing | Script (Node.js) | — | `shapefile` npm package streams .shp/.dbf |
| Geometry storage | Database (PostGIS) | — | ST_SetSRID + ST_Force2D + ST_MakeValid on insert |
| Routing (address-to-district) | Database (PostGIS) | — | ST_Covers spatial query in essentialsService |
| District metadata | Database (districts table) | — | Written by loader alongside geofence_boundaries |
| Smoke test | Script (TypeScript/pg) | — | Adapted from smoke-md-geofences.ts |
| Verification SQL | Database (read-only queries) | — | Adapted from verify-md-tiger-import.sql |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | existing | TIGER loader — download, parse, upsert geofences + districts | Established loader for CA/TX/UT/IN/MA/ME/OR/MD; adding VA is the pattern |
| `shapefile` (npm) | existing | Streams .shp/.dbf records from extracted TIGER zip | Already installed in EV-Accounts backend |
| `adm-zip` (npm) | existing | Extracts TIGER zip files | Already installed |
| `pg` (npm) | existing | PostgreSQL client for upserts | Already installed |
| PostGIS | production Supabase | Stores geometries; ST_Covers for routing | Production DB |

### Loader Command Pattern

```bash
# From C:/EV-Accounts/backend:
# Step 1: Dry-run — confirm layer counts (no DB writes)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state VA --fips 51 \
  --layers cd119,sldu,sldl,place,county \
  --dry-run

# Step 2: After updating sentinel 0s in EXPECTED_VA_MTFCC, run live
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state VA --fips 51 \
  --layers cd119,sldu,sldl,place,county
```

### TIGER 2024 File URLs (all confirmed on census.gov)

| Layer | URL | File Size |
|-------|-----|-----------|
| cd119 | `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_51_cd119.zip` | 1.7 MB |
| sldu | `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_51_sldu.zip` | 3.1 MB |
| sldl | `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_51_sldl.zip` | 4.8 MB |
| place | `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_51_place.zip` | 3.6 MB |
| county | `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip` | 80 MB (national) |

[VERIFIED: census.gov confirmed 2026-06-08]

## Package Legitimacy Audit

> No new packages installed. This phase uses only existing packages in C:/EV-Accounts/backend (`pg`, `adm-zip`, `shapefile`). No audit required.

---

## Architecture Patterns

### System Architecture Diagram

```
census.gov TIGER2024 ZIPs (5 files)
        │
        ▼ downloadWithRedirects()
.tmp-tiger-2024-51/ (local cache)
        │
        ▼ extractZip() + streamShapefile()
EXPECTED_VA_MTFCC pre-flight assertion
        │ (fails if count mismatch — no DB write)
        ▼ upsertGeofence() [ON CONFLICT (geo_id, mtfcc) DO NOTHING]
essentials.geofence_boundaries (state='51')
        │
        ├──▶ insertDistrictIfMissing() [WHERE NOT EXISTS guard]
        │    essentials.districts (state='va'/'VA')
        │
        ▼ ST_Covers() spatial query
Address routing → correct tiers returned
```

### Recommended File Changes (C:/EV-Accounts/backend)

```
scripts/
├── load-state-tiger-boundaries.ts    (4 additive edits: allowlist, city-assert, makevalid, MTFCC block)
├── verify-va-tiger-import.sql        (NEW — adapt from verify-md-tiger-import.sql)
└── smoke-va-geofences.ts             (NEW — adapt from smoke-md-geofences.ts)
```

### Pattern 1: Add-State-To-Loader (identical to MD Phase 91)

**What:** 4 additive code edits to load-state-tiger-boundaries.ts; no existing lines removed.

**Edit 1 — STATE_LAYER_ALLOWLIST** (after MD entry, line ~43):
```typescript
// Source: load-state-tiger-boundaries.ts line ~43 (after MD: entry)
VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```
Note: No `cousub` — Virginia uses independent cities, not townships (same as MD).

**Edit 2 — STATE_CITY_ASSERTIONS** (after MD entry, line ~93):
```typescript
// Source: load-state-tiger-boundaries.ts line ~93 (after MD: entry)
VA: ['Alexandria city'],
```
The sentinel string must match TIGER NAMELSAD exactly. Virginia uses lowercase 'city' in NAMELSAD (same as Maryland pattern: 'Baltimore city'). Alexandria is the key city for this milestone.

**Edit 3 — STATE_RUN_MAKEVALID** (after MD entry, line ~106):
```typescript
// Source: load-state-tiger-boundaries.ts line ~106 (after MD: entry)
VA: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```
All 5 layers get ST_MakeValid — identical to ME, OR, and MD.

**Edit 4 — EXPECTED_VA_MTFCC block** (after the MD block ending at line ~905, before the DC block):
```typescript
// ── VA MTFCC pre-flight assertion (Phase 100) ──────────────────────────────
// For VA (state='51'), count records satisfying the same filters as the upsert
// pass BEFORE any DB write. Assertion failure is named and fatal.
// sldl and place values are set to 0 so dry-run MtfccAssertionError reveals actual count.
// Plan 02 updates these values before the live load.
if (fipsArg === '51') {
  const EXPECTED_VA_MTFCC: Record<string, number> = {
    cd119: 11,   // 11 VA congressional districts (post-2022 redistricting)
    sldu:  40,   // 40 VA Senate districts
    sldl:   0,   // TBD — set to 0; dry-run reveals actual count (~100 expected — single-member districts)
    place:  0,   // TBD — set to 0; dry-run reveals actual count (TIGERweb shows 433 G4110, actual G4110-only may differ)
    county: 133, // 133 VA county-equivalents: 95 counties + 38 independent cities
  };
  if (layer in EXPECTED_VA_MTFCC) {
    // ... (identical structure to MD block at line ~868)
  }
}
```

### Pattern 2: Verify SQL Gate Structure (adapt from verify-md-tiger-import.sql)

```sql
-- Gate 1: No invalid geometries (state='51')
-- Gate 2: No GeometryCollection types (state='51')
-- Gate 3: Per-layer row counts: G4020|133, G4110|[DRY-RUN], G5200|11, G5210|40, G5220|[DRY-RUN]
-- Gate 4: Alexandria dual-tier sentinel
--   SELECT geo_id, name, mtfcc FROM geofence_boundaries
--   WHERE state='51' AND geo_id IN ('5101000', '51510') ORDER BY mtfcc;
--   Expected: 2 rows — G4020 (geo_id='51510') AND G4110 (geo_id='5101000')
-- Gate 5: districts table counts (state IN ('VA','va'))
--   Expected: va|COUNTY|133, va|STATE_LOWER|[DRY-RUN], va|STATE_UPPER|40, VA|NATIONAL_LOWER|11
-- Gate 6: Fairfax County sentinel (Alexandria's neighbor — confirms county layer)
--   WHERE state='51' AND mtfcc='G4020' AND name LIKE '%Fairfax%'
--   Expected: 2 rows — 'Fairfax County' (geo_id='51059') AND 'Fairfax city' (geo_id='51600')
--   NOTE: Fairfax County AND Fairfax city are SEPARATE entities in VA (independent city pattern)
-- Gate 7: Section-split check (OR-direction: geofence → districts, NOT districts → geofence)
--   SELECT gb.geo_id, gb.name, gb.mtfcc
--   FROM essentials.geofence_boundaries gb
--   WHERE gb.mtfcc IN ('G5200','G5210','G5220','G4020') AND gb.state='51'
--     AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
--   Expected: 0 rows
--   IMPORTANT: Use OR-direction (geofence → districts) NOT MD-direction (districts → geofence).
--   The MD Gate 7 direction produces false positives for NATIONAL_UPPER (geo_id='51') and
--   STATE_EXEC (geo_id='51') rows that are statewide-scoped and have no polygon.
```

### Pattern 3: Smoke Test Addresses

```typescript
// Source: adapt from smoke-md-geofences.ts
const TEST_ADDRESSES: AddressTest[] = [
  {
    // Alexandria City Hall — D-01 invariant: BOTH G4110 (place) AND G4020 (independent city)
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
    // Coordinate confirmed to be outside any incorporated place
    label: 'Rural Shenandoah County VA (unincorporated)',
    lon: -78.6,
    lat: 38.9,
    expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
    forbiddenMtfcc: ['G4110'],
  },
  {
    // Richmond VA City Hall — state capital; incorporated city (independent city)
    // Richmond is an independent city — must return G4110 + G4020 + all legislative tiers
    label: 'Richmond VA City Hall',
    lon: -77.4360,
    lat: 37.5407,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  },
];
```

### Anti-Patterns to Avoid

- **Using MD Gate 7 direction (districts → geofence):** VA has pre-existing districts rows for NATIONAL_UPPER (geo_id='51') and NATIONAL_LOWER (geo_ids 5101-5111) that produce false positives. Use the OR-direction Gate 7 (geofence → districts).
- **Setting sldl/place counts before dry-run:** Always set sentinel 0 in EXPECTED_VA_MTFCC; dry-run reveals actual counts before any DB write.
- **Assuming SLDL = 100:** Virginia has 100 single-member House of Delegates districts, so SLDL polygon count = 100 is strongly expected. But confirm via dry-run — TIGER files can contain additional records.
- **Assuming county = 95:** Virginia has 95 counties + 38 independent cities = 133 county-equivalents in the G4020 layer. Do not use 95 as the expected count.
- **Loading cousub:** Virginia does NOT use county subdivisions (townships). Do not add `cousub` to the allowlist.
- **Running cd119 layer and expecting 11 new insertions:** The 11 G5200 rows already exist. The loader will log `already_exists: 11`. This is correct behavior — no data loss.

---

## Pre-Existing State (Critical)

The production database already contains VA data that this phase interacts with:

### geofence_boundaries (state='51')

| mtfcc | Count | Source | Status |
|-------|-------|--------|--------|
| G5200 | 11 | census_tiger_2024 | Already loaded — valid geometry, correct geo_ids |

The 11 existing G5200 rows use geo_ids `5101`–`5111` which **exactly match** what the TIGER loader produces via `STATEFP(51) + CD119FP(01..11)`. Running cd119 again will hit `ON CONFLICT (geo_id, mtfcc) DO NOTHING` — safe and idempotent.

### districts (state='VA' or 'va')

| state | district_type | count | Notes |
|-------|--------------|-------|-------|
| VA | NATIONAL_LOWER | 11 | Matching the 11 G5200 rows |
| VA | NATIONAL_UPPER | 1 | geo_id='51' (statewide, no polygon) |

These 12 existing district rows are safe. NATIONAL_LOWER rows will not be re-inserted (WHERE NOT EXISTS guard). NATIONAL_UPPER will remain untouched (loader does not write NATIONAL_UPPER rows).

**Implication for cd119:** The planner may choose to skip the cd119 layer load (11 rows already exist and are correct) OR include it for completeness (idempotent). Either is acceptable. Including it verifies the EXPECTED_VA_MTFCC assertion passes.

---

## Virginia-Specific Structure

### Independent Cities (38 entities)

Virginia is the only U.S. state with a large number of independent cities — cities that are legally separate from any county. They appear in the G4020 (county) TIGER layer as county-equivalents. The list includes major cities: Richmond, Norfolk, Virginia Beach, Alexandria, Chesapeake, Hampton, Newport News, Portsmouth, Roanoke, etc.

**Dual-tier cities** (same pattern as Baltimore City for MD): Any address in an independent city MUST return BOTH a G4110 row (incorporated place) AND a G4020 row (city-as-county-equivalent). This applies to ALL 38 independent cities, not just Alexandria. The loader handles this automatically since it loads both the PLACE and COUNTY layers.

Key independent city geo_ids (from TIGER GEOID formula: `STATEFP(51) + COUNTYFP`):

| City | geo_id (G4020) | geo_id (G4110) | Notes |
|------|---------------|---------------|-------|
| Alexandria | 51510 | 5101000 | COUNTYFP=510; PLACEFP=01000 |
| Richmond | 51760 | 5167000 | COUNTYFP=760; PLACEFP=67000 [ASSUMED] |
| Norfolk | 51710 | 5157000 | [ASSUMED] — confirm via dry-run |
| Virginia Beach | 51810 | 5182000 | [ASSUMED] |

[ASSUMED] geo_ids derived from TIGER GEOID formula — confirm after load.

**Alexandria CONFIRMED** from ROADMAP.md: geo_id=`5101000` (G4110) + geo_id=`51510` (G4020).

### State Legislature Structure

| Chamber | Count | District Type | MTFCC | Notes |
|---------|-------|--------------|-------|-------|
| VA Senate (SLDU) | 40 | STATE_UPPER | G5210 | 40 single-member districts |
| House of Delegates (SLDL) | 100 | STATE_LOWER | G5220 | 100 single-member districts (unlike MD's multi-member) |
| US House (cd119) | 11 | NATIONAL_LOWER | G5200 | Already loaded |

**Key difference from Maryland:** Virginia's House of Delegates uses 100 single-member districts — one polygon per delegate. Maryland had multi-member districts (71 polygons for 141 delegates). VA SLDL polygon count ≈ 100 (to be confirmed by dry-run).

### districts.state Casing

Same pattern as OR and MD:

| Layer | districts.state | Example |
|-------|----------------|---------|
| county | `va` (lowercase) | `va | COUNTY` |
| sldu | `va` (lowercase) | `va | STATE_UPPER` |
| sldl | `va` (lowercase) | `va | STATE_LOWER` |
| cd119 | `VA` (uppercase) | `VA | NATIONAL_LOWER` |

The loader computes: `abbrev = FIPS_TO_STATE['51'] = 'va'` (lowercase) for STATE/COUNTY layers; `abbrevUpper = 'VA'` for NATIONAL_LOWER. Already confirmed correct in existing VA districts rows (NATIONAL_LOWER uses `state='VA'`).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Downloading TIGER ZIP files | Custom HTTP downloader | `downloadWithRedirects()` in loader | Handles 301/302 redirects automatically |
| Parsing shapefiles | Manual DBF/SHP parsing | `shapefile` npm package | Already installed; handles all TIGER vintages |
| ZIP extraction | `unzip` shell command | `adm-zip` npm package | Already installed; works on Windows PowerShell |
| Geometry validation | Manual WKT checking | ST_MakeValid + ST_IsValid in PostGIS | Handles invalid polygon topology from TIGER |
| Count assertion before write | Try-catch after write | EXPECTED_VA_MTFCC block | Aborts before any DB write if count wrong |

---

## Common Pitfalls

### Pitfall 1: County Count = 95 (Wrong)

**What goes wrong:** Using `county: 95` in EXPECTED_VA_MTFCC because Virginia has 95 counties.
**Why it happens:** Forgetting Virginia has 38 independent cities as county-equivalents in the G4020 layer.
**How to avoid:** Use `county: 133` (95 + 38). The dry-run will confirm.
**Warning signs:** Dry-run output shows `got 133, expected 95` — the assertion would block the live load.

### Pitfall 2: SLDL Count = Delegate Count (Not True for VA, Unlike MD)

**What goes wrong:** Assuming SLDL polygon count != 100 because of multi-member confusion from the MD pattern.
**Why it happens:** MD had multi-member districts (71 polygons, 141 delegates). VA has single-member districts.
**How to avoid:** VA House of Delegates = 100 single-member districts = 100 SLDL polygons. Dry-run confirms.
**Warning signs:** Dry-run shows count other than ~100. If so, update the EXPECTED_VA_MTFCC sentinel.

### Pitfall 3: Gate 7 False Positive (districts → geofence direction)

**What goes wrong:** Using the MD-direction Gate 7 (`FROM districts WHERE NOT IN geofence_boundaries`) produces a false positive for the pre-existing NATIONAL_UPPER row (geo_id='51') which has no polygon.
**Why it happens:** The NATIONAL_UPPER district row references the entire state (senators represent all VA), so no geofence polygon exists.
**How to avoid:** Use the OR-direction Gate 7 (`FROM geofence_boundaries WHERE NOT IN districts`) which only checks polygon-backed tiers.
**Warning signs:** Gate 7 returns 1 row with `district_type='NATIONAL_UPPER'` and `geo_id='51'`.

### Pitfall 4: Alexandria city NAMELSAD Case

**What goes wrong:** STATE_CITY_ASSERTIONS uses wrong casing for Alexandria.
**Why it happens:** TIGER NAMELSAD uses lowercase 'city' in place names (e.g. 'Baltimore city', 'Alexandria city').
**How to avoid:** `VA: ['Alexandria city']` — lowercase 'city'. Verify with the STATE_CITY_ASSERTIONS gate output on dry-run.
**Warning signs:** `[place] STATE_CITY_ASSERTIONS gate FAILED` error; check the "Seen NAMELSAD values" output to get exact casing.

### Pitfall 5: cd119 Skipped Rows Logged as Errors

**What goes wrong:** After cd119 load, logs show `already_exists: 11` and developer thinks something is wrong.
**Why it happens:** 11 G5200 rows for VA were previously loaded by an earlier TIGER run. ON CONFLICT DO NOTHING is the correct behavior.
**How to avoid:** `already_exists` is not an error — it means the rows match. Check that `inserted_boundary: 0` + `already_exists: 11` = 11 total (correct). EXPECTED_VA_MTFCC assertion will PASS because it counts shapefile records (11), not DB insertions.

### Pitfall 6: TIGERweb G4110 Count vs Actual TIGER File Count

**What goes wrong:** Using TIGERweb's 433 G4110 count for Virginia as the EXPECTED_VA_MTFCC `place` value.
**Why it happens:** TIGERweb shows all G4110 records before the loader's MTFCC filter. The TIGER file also contains G4150 (CDPs), G4210 (consolidated cities), etc. that are skipped by the loader.
**How to avoid:** Always set `place: 0` in the initial EXPECTED_VA_MTFCC block. The dry-run will show the actual G4110-only count.
**Warning signs:** MD had TIGERweb=311 but dry-run=157. Virginia's gap may be larger (TIGERweb=433).

---

## Code Examples

### EXPECTED_VA_MTFCC Block (Edit 4 in load-state-tiger-boundaries.ts)

```typescript
// Source: adapt from MD block at line ~863 in load-state-tiger-boundaries.ts
// ── VA MTFCC pre-flight assertion (Phase 100) ──────────────────────────────
if (fipsArg === '51') {
  const EXPECTED_VA_MTFCC: Record<string, number> = {
    cd119: 11,   // 11 VA congressional districts (post-2022 redistricting)
    sldu:  40,   // 40 VA Senate districts (1 senator each)
    sldl:   0,   // TBD — set to 0; dry-run reveals actual count (~100 expected)
    place:  0,   // TBD — set to 0; dry-run reveals actual count (TIGERweb shows 433 G4110)
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

### Alexandria Dual-Tier Smoke Test Assertion

```typescript
// Source: adapt from smoke-md-geofences.ts Baltimore City block
{
  label: 'Alexandria VA City Hall',
  lon: -77.0469,
  lat: 38.8048,
  expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  expectedGeoIds: {
    G4110: '5101000', // Alexandria city (incorporated place, TIGER GEOID = STATEFP+PLACEFP)
    G4020: '51510',   // Alexandria city (independent city-county, TIGER GEOID = STATEFP+COUNTYFP)
    G5200: '5108',    // VA-8 (Don Beyer) — confirmed from pre-existing routing test
  },
}
```

### verify-va-tiger-import.sql Gate 4 (Alexandria Dual-Tier)

```sql
-- Gate 4: Alexandria dual-tier sentinel (VA-GEO-02 invariant)
-- Both rows must exist: G4110 (incorporated place) AND G4020 (independent city-county)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '51' AND geo_id IN ('5101000', '51510')
ORDER BY mtfcc;
-- Expected: 2 rows
-- geo_id='51510',  name='Alexandria city', mtfcc='G4020' (independent city-county)
-- geo_id='5101000',name='Alexandria city', mtfcc='G4110' (incorporated place)
```

### verify-va-tiger-import.sql Gate 7 (Section Split — OR Direction)

```sql
-- Gate 7: Section-split check — OR-direction (geofence → districts)
-- MUST return 0 rows (all G5200/G5210/G5220/G4020 geofences must have matching districts row)
-- NOTE: Use OR-direction to avoid false positives from NATIONAL_UPPER (geo_id='51', no polygon)
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')
  AND gb.state = '51'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
-- Expected: 0 rows
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-state loader scripts | Single generalized `load-state-tiger-boundaries.ts` | Phase 130 (Tiger Generalization) | VA is state #9; just add to config blocks |
| shp2pgsql shell command | `shapefile` npm package in TypeScript | Phase 130 | No system-level tool needed; runs on Windows PowerShell via `npx tsx` |
| Manual geometry validation | `STATE_RUN_MAKEVALID` per-state/per-layer config | Phase 131 | Follow MD/OR pattern: all 5 VA layers get ST_MakeValid |
| Hardcoded expected counts | `MtfccAssertionError` pattern + dry-run | Phase 72 (OR) | Dry-run reveals actual count; live run locked to confirmed count |
| Manual section-split checks | Gate 7 in verify SQL | Phase 91 (MD) | Automated verification that all legislative geofences have district rows |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | VA G4110 place count from TIGER file is ~100-250 (TIGERweb shows 433 but G4110-only filter reduces this; MD had 311 TIGERweb vs 157 actual) | EXPECTED_VA_MTFCC | Dry-run reveals actual count; sentinel 0 means assertion fires before any write |
| A2 | VA SLDL count = 100 polygons (100 single-member House districts) | EXPECTED_VA_MTFCC | Dry-run confirms; if actual differs, update sentinel before live load |
| A3 | Alexandria NAMELSAD = 'Alexandria city' (lowercase 'city') in TIGER | STATE_CITY_ASSERTIONS | STATE_CITY_ASSERTIONS gate output on dry-run shows exact NAMELSAD values |
| A4 | Alexandria geo_id (G4110) = '5101000' (STATEFP=51 + PLACEFP=01000) | Smoke Test | Confirmed from ROADMAP.md; verify after G4110 load |
| A5 | Alexandria geo_id (G4020) = '51510' (STATEFP=51 + COUNTYFP=510) | Smoke Test | Confirmed from ROADMAP.md; verify after G4020 load |
| A6 | Virginia has exactly 38 independent cities (95 counties + 38 = 133 total G4020 records) | EXPECTED_VA_MTFCC | Well-established VA geography; dry-run confirms |
| A7 | Rural Shenandoah County coordinate (-78.6, 38.9) is outside any incorporated place | Smoke Test | Smoke test will detect G4110 return if wrong; shift coordinate if needed |

---

## Open Questions

1. **Should cd119 be included in the live load command?**
   - What we know: 11 G5200 rows already exist with correct geometry and geo_ids.
   - What's unclear: Whether the planner wants to include cd119 for assertion completeness or skip it as "already done."
   - Recommendation: Include cd119 in the layer list. The EXPECTED_VA_MTFCC cd119:11 assertion will pass, confirming the existing rows are correct. ON CONFLICT DO NOTHING means zero risk. Skipping would leave the EXPECTED_VA_MTFCC cd119 block untested.

2. **Does the VA districts table need the `districts.state='VA'` uppercase casing fixed?**
   - What we know: Existing NATIONAL_LOWER rows use `state='VA'` (uppercase). The loader writes cd119 districts with `state: abbrevUpper = 'VA'`. This is consistent.
   - What's unclear: Whether any other Phase 101+ work expects `state='va'` for NATIONAL tiers.
   - Recommendation: Leave as-is. The `abbrevUpper` pattern is established (OR='OR', MD='MD') and the pre-existing rows confirm it.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npx tsx | Running loader script | ✓ | (existing EV-Accounts backend) | — |
| DATABASE_URL env var | Loader + smoke test + psql | ✓ | (production Supabase connection string) | — |
| census.gov HTTPS access | TIGER file download | ✓ | — | — |
| `shapefile` npm package | Shapefile parsing | ✓ | (already installed in backend) | — |
| `adm-zip` npm package | Zip extraction | ✓ | (already installed) | — |
| psql CLI | verify-va-tiger-import.sql | ✓ | (EV-Accounts dev environment) | Use Supabase execute_sql MCP for individual queries |

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom TypeScript smoke test + SQL verification (no Jest/Vitest — matches OR/MA/ME/MD pattern) |
| Config file | none — standalone scripts |
| Quick run command | `npx tsx scripts/smoke-va-geofences.ts` |
| Full suite command | `psql $DATABASE_URL -f scripts/verify-va-tiger-import.sql` then `npx tsx scripts/smoke-va-geofences.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VA-GEO-01 | G4110/G4020/G5200/G5210/G5220 rows present with correct counts | SQL verification (Gate 3) | `psql $DATABASE_URL -f verify-va-tiger-import.sql` | ❌ Wave 0 |
| VA-GEO-02 | Alexandria appears twice: G4110='5101000' AND G4020='51510' | SQL (Gate 4) + smoke test (Address 1) | same + `npx tsx scripts/smoke-va-geofences.ts` | ❌ Wave 0 |
| VA-GEO-03 | Address routing returns correct tiers for Alexandria, Richmond, rural VA | TypeScript smoke test (3 addresses) | `npx tsx scripts/smoke-va-geofences.ts` | ❌ Wave 0 |
| VA-GEO-02 (dual-tier) | Alexandria returns G4110 AND G4020 | TypeScript smoke test (Address 1) | same | ❌ Wave 0 |
| Section-split | All G5200/G5210/G5220/G4020 geofences have district rows | SQL Gate 7 (OR-direction) | `psql $DATABASE_URL -f verify-va-tiger-import.sql` | ❌ Wave 0 |

### Wave 0 Gaps

- [ ] `C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql` — 7-gate verification (adapt from verify-md-tiger-import.sql; Gate 4 Alexandria dual-tier; Gate 7 OR-direction)
- [ ] `C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts` — 3-address smoke test (adapt from smoke-md-geofences.ts)
- [ ] `STATE_LAYER_ALLOWLIST['VA']` entry in load-state-tiger-boundaries.ts
- [ ] `STATE_CITY_ASSERTIONS['VA']` entry in load-state-tiger-boundaries.ts
- [ ] `STATE_RUN_MAKEVALID['VA']` entry in load-state-tiger-boundaries.ts
- [ ] `EXPECTED_VA_MTFCC` block in processLayer() in load-state-tiger-boundaries.ts (after MD block, before DC block)

---

## Security Domain

This phase is pure infrastructure — TIGER boundary loading into a PostGIS database. No user-facing inputs, no authentication flows, no API endpoints modified. ASVS categories V2/V3/V4/V6 do not apply. V5 input validation is handled by the existing loader (ON CONFLICT DO NOTHING guards; geometry validated via ST_IsValid gate). No security domain concerns beyond standard DB write access controls already in place.

---

## Sources

### Primary (HIGH confidence)

- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — Full loader code inspection; STATE_LAYER_ALLOWLIST (VA absent), FIPS_TO_STATE ('51': 'va'), LAYER_DISPATCH definitions, EXPECTED_MD_MTFCC block structure at line ~863, processLayer() pattern, ON CONFLICT (geo_id, mtfcc) DO NOTHING confirmed
- `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql` — 7-gate verification pattern to adapt; Gate 7 direction issue identified
- `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts` — 3-address smoke test pattern to adapt
- `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` — OR-direction Gate 7 (correct direction for VA)
- `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` — OR smoke test pattern reference
- Production DB query `SELECT mtfcc, COUNT(*) FROM essentials.geofence_boundaries WHERE state='51'` — confirmed 11 G5200 rows, source='census_tiger_2024'
- Production DB query `SELECT state, district_type, COUNT(*) FROM essentials.districts WHERE state IN ('VA','va')` — confirmed 11 NATIONAL_LOWER + 1 NATIONAL_UPPER existing
- Production DB address routing test `lon=-77.0469, lat=38.8048` — Alexandria correctly routes to G5200 geo_id='5108' (VA-8)
- `https://www2.census.gov/geo/tiger/TIGER2024/CD/` — Confirmed `tl_2024_51_cd119.zip` (1.7 MB) [VERIFIED: census.gov]
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/` — Confirmed `tl_2024_51_sldu.zip` (3.1 MB) [VERIFIED: census.gov]
- `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/` — Confirmed `tl_2024_51_sldl.zip` (4.8 MB) [VERIFIED: census.gov]
- `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/` — Confirmed `tl_2024_51_place.zip` (3.6 MB) [VERIFIED: census.gov]
- `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/` — Confirmed `tl_2024_us_county.zip` (80 MB national) [VERIFIED: census.gov]
- `https://vga.virginia.gov/` — 100 House delegates + 40 senators confirmed [VERIFIED: official VA General Assembly]
- `.planning/ROADMAP.md` Phase 100 Key facts — Alexandria geo_ids 5101000 + 51510 confirmed

### Secondary (MEDIUM confidence)

- `.planning/phases/91-md-tiger-geofences/91-RESEARCH.md` (from git) — Full MD research including Baltimore dual-tier pattern, TIGERweb vs actual count discrepancy, Gate 7 direction analysis
- `.planning/phases/91-md-tiger-geofences/91-01-PLAN.md` (from git) — Wave 0 gaps pattern for loader scaffold
- `https://tigerweb.geo.census.gov/tigerwebmain/Files/bas25/tigerweb_bas25_incplace_2024_acs24_va.html` — VA incorporated places count: 433 G4110 (TIGERweb ACS24 BAS25; will differ from actual TIGER file G4110-only count)

### Tertiary (LOW confidence — validate via dry-run)

- VA SLDL count of 100: strongly implied by 100 single-member House districts, but TIGER file is authoritative; dry-run required
- VA county count of 133: 95 counties + 38 independent cities = 133; well-established VA geography; dry-run confirms
- Rural Shenandoah County coordinate (-78.6, 38.9): assumed unincorporated; smoke test will detect G4110 return if wrong

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — loader script well-established; all TIGER URLs confirmed; VA is state #9 in loader
- Architecture: HIGH — identical 4-edit pattern to MD Phase 91; no new patterns required
- County count (133): HIGH — 95 counties + 38 independent cities is canonical VA geography
- SLDL count (100): MEDIUM — 100 single-member districts is strongly expected but TIGER file is authoritative; dry-run required
- G4110 count: LOW — TIGERweb shows 433 but actual G4110-only count unknown; set sentinel 0 and use dry-run
- Smoke test coordinates: MEDIUM — Alexandria confirmed routing to VA-8; rural/Richmond need smoke test validation

**Research date:** 2026-06-08
**Valid until:** 2026-12-08 (TIGER 2024 files are stable; loader pattern changes only with code PRs)
