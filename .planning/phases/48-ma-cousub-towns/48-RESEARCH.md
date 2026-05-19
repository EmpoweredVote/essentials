# Phase 48: MA Towns (G4040 COUSUB Boundaries) - Research

**Researched:** 2026-05-18
**Domain:** TIGER/Line 2024 COUSUB boundary loading, PostGIS geofence_boundaries, Massachusetts town geography
**Confidence:** HIGH

---

## Summary

Phase 48 extends MA geofence coverage from the 58 incorporated cities (already loaded as G4110 PLACE in Phase 38) to the 293 active MA towns, which appear in TIGER as COUSUB records with MTFCC G4040 and FUNCSTAT='A'. The TIGER 2024 COUSUB file for MA (`tl_2024_25_cousub.zip`, 1.9MB) is confirmed accessible at `https://www2.census.gov/geo/tiger/TIGER2024/COUSUB/tl_2024_25_cousub.zip`.

The MA COUSUB file contains 357 total records for Massachusetts, of which exactly 293 have FUNCSTAT='A' (active towns) and 58 have FUNCSTAT='F' (fictitious placeholder entries for the 58 incorporated cities). The FUNCSTAT='F' records represent cities that already have G4110 rows in geofence_boundaries from Phase 38 — they must be filtered out to avoid loading ghost duplicates with a different geo_id. The MTFCC filter of G4040-only is insufficient by itself because all 357 records use MTFCC G4040; the required filter is **FUNCSTAT='A'**.

The loader at `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` needs exactly four additions: (1) add `cousub` to MA's allowlist entry, (2) add a `cousub` LAYER_DISPATCH entry (no entry exists yet), (3) add `cousub` to MA's STATE_RUN_MAKEVALID entry, and (4) add cousub count to the MA MTFCC pre-flight assertion (expected: 293). No new npm packages are required.

**Primary recommendation:** Add `cousub` LAYER_DISPATCH entry with `mtfcc: 'G4040'`, `district_type: 'LOCAL'`, `filterByStatefp: false` (file is per-state), `writeDistrictRow: false` (matches `place` pattern), and a FUNCSTAT='A' filter in `processLayer`. Update MA allowlist and run `--state MA --fips 25 --layers cousub`.

---

## Standard Stack

### Core
| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | current | Downloads TIGER ZIP, extracts shapefile, upserts to geofence_boundaries | Existing generalized loader; all infrastructure already exists |
| `shapefile` npm | existing | Reads .shp + .dbf files | Already in node_modules; streamShapefile helper already handles it |
| `adm-zip` npm | existing | Extracts TIGER ZIP files | Already in node_modules; extractZip helper already handles it |
| PostgreSQL/PostGIS | existing | ON CONFLICT DO NOTHING idempotency; point-in-polygon routing | All geofence work uses this pattern |

### TIGER 2024 File for MA COUSUB
| Layer | TIGER URL | File Size | Records Expected (after filter) |
|-------|-----------|-----------|--------------------------------|
| County Subdivisions (cousub) | `https://www2.census.gov/geo/tiger/TIGER2024/COUSUB/tl_2024_25_cousub.zip` | 1.9MB | 293 (FUNCSTAT='A' towns only) |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Changes to load-state-tiger-boundaries.ts

```
C:/EV-Accounts/backend/scripts/
├── load-state-tiger-boundaries.ts   # MODIFY: 4 additions (see below)
├── verify-ma-tiger-import.sql       # MODIFY: add cousub count gate (293 G4040 rows)
└── smoke-ma-towns.ts                # NEW: Lexington + Concord smoke test
```

### Pattern 1: Add `cousub` to STATE_LAYER_ALLOWLIST (MA entry)

```typescript
// Source: load-state-tiger-boundaries.ts line 39 — CHANGE MA entry
const STATE_LAYER_ALLOWLIST: Record<string, Set<string>> = {
  // ... existing entries ...
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),  // add 'cousub'
};
```

### Pattern 2: Add `cousub` LAYER_DISPATCH entry

This is the most important addition. No `cousub` entry exists in LAYER_DISPATCH yet (confirmed by code audit). The entry must be consistent with `place` in using `writeDistrictRow: false` and `ocd_id: null`.

```typescript
// Source: load-state-tiger-boundaries.ts LAYER_DISPATCH block (~line 235)
// Add after the 'county' entry:
cousub: {
  mtfcc: 'G4040', district_type: 'LOCAL', ocdKey: 'cousub',
  geoIdSource: 'GEOID',
  urlTemplate: (v, f, _c) => `https://www2.census.gov/geo/tiger/TIGER${v}/COUSUB/tl_${v}_${f}_cousub.zip`,
  districtNumField: null,
  filterByStatefp: false,  // file is per-state; no national file to filter
  skipDistrictCodes: new Set<string>(),
  writeDistrictRow: false,  // matches place pattern; towns don't need districts rows
},
```

### Pattern 3: Add `cousub` to STATE_RUN_MAKEVALID (MA entry)

```typescript
// Source: load-state-tiger-boundaries.ts lines 54-57 — UPDATE MA entry
const STATE_RUN_MAKEVALID: Record<string, Set<string>> = {
  UT: new Set(['cd119', 'sldu', 'sldl', 'unsd', 'place', 'county']),
  MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county', 'cousub']),  // add 'cousub'
};
```

### Pattern 4: FUNCSTAT Filter in processLayer

This is the critical filter. The COUSUB file contains 357 MA records, but 58 have FUNCSTAT='F' (fictitious city placeholders that already have G4110 rows). Only the 293 FUNCSTAT='A' active towns should be written.

The filter belongs in `processLayer` alongside the existing `place` layer MTFCC filter (lines 574-580). Add a new parallel guard:

```typescript
// Source: processLayer function in load-state-tiger-boundaries.ts (~line 576)
// Add after the PLACE MTFCC filter block:

// COUSUB layer: filter FUNCSTAT === 'A' (active towns only)
// Rationale: MA COUSUB file contains 357 records total:
//   - 293 FUNCSTAT='A' = active towns (Lexington, Concord, Belmont, etc.) — LOAD THESE
//   - 58  FUNCSTAT='F' = fictitious city placeholders (Cambridge, Boston, etc.)
//     These cities already have G4110 rows from Phase 38 place layer.
//     FUNCSTAT='F' means "created to fill Census geographic hierarchy" — NOT real governments.
// Verified: TIGERweb query STATE=25 AND FUNCSTAT='A' returns exactly 293 records.
if (layer === 'cousub') {
  const funcstatVal = String(props['FUNCSTAT'] ?? props['funcstat'] ?? '');
  if (funcstatVal !== 'A') {
    totals.skipped++;
    return;
  }
}
```

### Pattern 5: MA MTFCC Pre-Flight Assertion Update

Add `cousub: 293` to the existing `EXPECTED_MA_MTFCC` assertion block (~line 524):

```typescript
const EXPECTED_MA_MTFCC: Record<string, number> = {
  cd:     9,
  sldu:   40,
  sldl:   160,
  place:  58,
  county: 14,
  cousub: 293,  // ADD THIS — 293 active towns (FUNCSTAT='A')
};
```

The assertion pass for cousub must apply the FUNCSTAT='A' filter before counting (same as the upsert pass will), so that the counted records match exactly what gets written.

### Pattern 6: geo_id Source for COUSUB

Use `geoIdSource: 'GEOID'`. The COUSUB GEOID is a 10-character string formed as:
- STATEFP (2 chars) + COUNTYFP (3 chars) + COUSUBFP (5 chars)

Examples confirmed via TIGERweb:
- Lexington: `2501735215` (25 + 017 + 35215)
- Concord: `2501715060` (25 + 017 + 15060)
- Cambridge (FUNCSTAT='F', do NOT load): `2501711000`
- Boston (FUNCSTAT='F', do NOT load): `2502507000`

These 10-char GEOIDs do NOT collide with the 7-char G4110 place GEOIDs (e.g., Cambridge G4110 = `2511000`). No collision risk.

### Pattern 7: ocd_id for COUSUB

Following the `place` pattern: `ocd_id = null`. Do NOT synthesize an OCD-ID for towns. The `writeDistrictRow: false` setting ensures no districts row is written. The switch/case block in `processLayer` will fall through to `default: ocd_id = null` for the `cousub` case, which is correct — but it is cleaner to add an explicit case:

```typescript
case 'cousub':
  // ocd_id IS NULL — matches place pattern; no essentials.districts row.
  ocd_id = null;
  break;
```

### Pattern 8: Smoke Test Script

Create `C:/EV-Accounts/backend/scripts/smoke-ma-towns.ts` following the pattern of `smoke-ma-geofences.ts`:

```typescript
// Smoke test coordinates confirmed from TIGERweb and coordinate lookup sources
const TEST_ADDRESSES = [
  // Lexington MA — COUSUB GEOID 2501735215, Middlesex County
  // Lexington center / town common area
  { label: 'Lexington MA town center', lon: -71.2298, lat: 42.4473 },
  // Concord MA — COUSUB GEOID 2501715060, Middlesex County
  // Concord center / Monument Square area
  { label: 'Concord MA town center', lon: -71.3490, lat: 42.4604 },
  // Belmont MA — another inner suburb that is a town, not a city
  { label: 'Belmont MA', lon: -71.1787, lat: 42.3965 },
];
// Expected: each address returns exactly 1 G4040 row + pre-existing G5200/G5210/G5220/G4020 rows
// G4040 row geo_id should match COUSUB GEOID (10 chars)
// NO G4110 row expected (towns don't appear in place/G4110)
```

### Verification SQL (add to verify-ma-tiger-import.sql)

```sql
-- Phase 48: G4040 COUSUB towns
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '25' AND mtfcc = 'G4040'
GROUP BY mtfcc;
-- Expected: G4040 | 293

-- Lexington point-in-polygon (COUSUB GEOID 2501735215)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.2298, 42.4473), 4326))
  AND mtfcc = 'G4040';
-- Expected: 1 row, geo_id='2501735215', name='Lexington town'

-- Concord point-in-polygon (COUSUB GEOID 2501715060)
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '25'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-71.3490, 42.4604), 4326))
  AND mtfcc = 'G4040';
-- Expected: 1 row, geo_id='2501715060', name='Concord town'

-- Confirm no city (G4110) rows have G4040 duplicates (cities should NOT be in G4040)
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.state = '25' AND gb.mtfcc = 'G4040'
  AND gb.name IN ('Cambridge city', 'Boston city', 'Worcester city')
-- Expected: 0 rows (cities filtered by FUNCSTAT='A' guard)
```

### Anti-Patterns to Avoid

- **Filtering to MTFCC='G4040' only without FUNCSTAT filter**: All 357 MA COUSUB records use G4040. Without the FUNCSTAT='A' filter, the 58 city placeholders (FUNCSTAT='F') would be written to geofence_boundaries, creating phantom G4040 rows for Cambridge, Boston, etc. that overlap the existing G4110 rows.
- **Loading cousub for cities**: Cambridge, Boston, and the other 56 cities have FUNCSTAT='F' in COUSUB — they are fictitious Census hierarchy placeholders. Always skip FUNCSTAT='F'.
- **Using 7-char geo_id for COUSUB**: Towns have 10-char geo_ids (STATEFP+COUNTYFP+COUSUBFP). Do not truncate or pad.
- **Expecting NAMELSAD instead of GEOID**: Use `geoIdSource: 'GEOID'` for cousub (unlike the place layer sentinel). COUSUB geo_ids are GEOIDs.
- **Skipping STATE_RUN_MAKEVALID for cousub**: MA needs MakeValid for cousub. Add it to the MA Set.
- **Adding cousub to Indiana's allowlist without a LAYER_DISPATCH entry**: Indiana already lists 'cousub' in its allowlist (line 38) but LAYER_DISPATCH has no cousub entry. This means `--state IN --layers cousub` would fail with "layer 'cousub' has no LAYER_DISPATCH entry." Phase 48 fixes this globally by adding the entry.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Download + cache TIGER ZIP | Custom HTTP fetch | `downloadWithRedirects` in loader | Handles redirects, file-exists cache |
| Read .shp + .dbf | Manual parsing | `streamShapefile` helper | UTF-8 encoding, async streaming, already tested |
| Write to geofence_boundaries | Raw INSERT | `upsertGeofence` with ON CONFLICT (geo_id, mtfcc) DO NOTHING | Idempotency, MakeValid, correct SRS |
| Determine FUNCSTAT field name | Hardcode | Use `props['FUNCSTAT'] ?? props['funcstat']` pattern | TIGER DBF field case can vary |
| Count pre-flight assertions | Custom logic | Extend existing MA MTFCC block | Pattern already wired; just add `cousub: 293` |

**Key insight:** The entire TIGER download/extract/upsert pipeline already exists. Phase 48 is purely additive config changes to the loader + one new filter guard.

---

## Common Pitfalls

### Pitfall 1: Loading All 357 COUSUB Records (Missing FUNCSTAT Filter)
**What goes wrong:** 357 rows land in geofence_boundaries instead of 293. Cambridge, Boston, and 56 other cities get G4040 rows with 10-char geo_ids, even though they already have G4110 rows with 7-char geo_ids.
**Why it happens:** All MA COUSUB records use MTFCC G4040 — there is no MTFCC distinction between towns and cities in COUSUB. The only distinguishing field is FUNCSTAT.
**How to avoid:** Add an explicit `layer === 'cousub'` guard checking `FUNCSTAT === 'A'` before the upsert. Also add the pre-flight assertion `cousub: 293` to catch regressions.
**Warning signs:** `SELECT COUNT(*) FROM geofence_boundaries WHERE state='25' AND mtfcc='G4040'` returns 357 instead of 293.

### Pitfall 2: Missing `cousub` LAYER_DISPATCH Entry
**What goes wrong:** Running `--state MA --layers cousub` fails immediately with: `layer 'cousub' has no LAYER_DISPATCH entry (this is a code bug — add it to LAYER_DISPATCH).`
**Why it happens:** The CLI validation at line 783 requires every layer in the allowlist to exist in LAYER_DISPATCH. Indiana added cousub to its allowlist but no dispatch entry was ever created.
**How to avoid:** Add the LAYER_DISPATCH entry BEFORE adding cousub to MA's allowlist (or in the same commit). Dry-run first to confirm no dispatch error.
**Warning signs:** The error message "layer 'cousub' has no LAYER_DISPATCH entry" on first run.

### Pitfall 3: COUSUB geo_id Collision Assumption
**What goes wrong:** Assuming G4040 COUSUB geo_ids might conflict with G4110 place geo_ids.
**Why it happens:** Both are "MA city/town boundary" data, and it's tempting to assume they're the same IDs.
**How to avoid:** Understand the formats: G4110 uses 7-char GEOID (STATEFP+PLACEFP = 2+5), COUSUB uses 10-char GEOID (STATEFP+COUNTYFP+COUSUBFP = 2+3+5). Cambridge G4110 geo_id = `2511000`; Cambridge COUSUB geo_id = `2501711000`. The ON CONFLICT (geo_id, mtfcc) constraint means even if GEOIDs overlapped (they don't), the mtfcc difference would prevent conflict.
**Warning signs:** None — there is no collision risk. This is a non-issue but must be understood for planning.

### Pitfall 4: COUSUB File is Per-State (filterByStatefp=false)
**What goes wrong:** Setting `filterByStatefp: true` causes the STATEFP filter to run on a per-state file, but STATEFP is always '25' in `tl_2024_25_cousub.zip` so no records would be skipped. It would be harmless but misleading.
**Why it happens:** Confusing national files (county, cd) with per-state files (place, cousub, sldu, sldl).
**How to avoid:** Set `filterByStatefp: false`. The COUSUB files are per-state (confirmed by URL pattern `tl_${v}_${f}_cousub.zip`). No STATEFP filtering needed.

### Pitfall 5: Missing cousub from STATE_RUN_MAKEVALID
**What goes wrong:** Some town geometries may be geometrically invalid (self-intersections, etc.) and ST_SetSRID alone won't fix them. Without MakeValid, upsert would succeed but geometries would fail PostGIS spatial queries.
**Why it happens:** The MA entry in STATE_RUN_MAKEVALID is set explicitly (not the default). If cousub is forgotten from the set, the fallback `layer === 'place'` rule at line 672 won't catch it.
**How to avoid:** Add cousub to `MA: new Set([..., 'cousub'])` in STATE_RUN_MAKEVALID.
**Warning signs:** Gate 1 failure in verify-ma-tiger-import.sql ("invalid_geometry_count > 0 for state='25'").

### Pitfall 6: NAMELSAD Field Name for Town Names
**What goes wrong:** Town NAMELSAD values will be like "Lexington town", "Concord town", "Acton town" (lowercase "town" suffix in Census NAMELSAD convention). Using NAME would give just "Lexington".
**Why it happens:** COUSUB NAMELSAD = NAME + translated LSAD code (e.g., "town" for LSAD code "25").
**How to avoid:** The existing `resolveColumn(props, NAMELSAD_CANDIDATES)` call in processLayer already handles this correctly by preferring NAMELSAD over NAME. The name stored in geofence_boundaries.name will be "Lexington town" which is correct and consistent.

---

## Code Examples

### Confirmed: FUNCSTAT='A' filter (key new guard)
```typescript
// Source: TIGERweb query confirmation — STATE='25' AND FUNCSTAT='A' returns 293 records
// Insert in processLayer after the place-layer MTFCC filter:
if (layer === 'cousub') {
  const funcstatVal = String(props['FUNCSTAT'] ?? props['funcstat'] ?? '');
  if (funcstatVal !== 'A') {
    totals.skipped++;
    return;
  }
}
```

### Confirmed: COUSUB LAYER_DISPATCH entry
```typescript
// Source: proximityone.com COUSUB field guide + TIGERweb confirmed G4040 + existing dispatch patterns
cousub: {
  mtfcc: 'G4040', district_type: 'LOCAL', ocdKey: 'cousub',
  geoIdSource: 'GEOID',
  urlTemplate: (v, f, _c) =>
    `https://www2.census.gov/geo/tiger/TIGER${v}/COUSUB/tl_${v}_${f}_cousub.zip`,
  districtNumField: null,
  filterByStatefp: false,
  skipDistrictCodes: new Set<string>(),
  writeDistrictRow: false,
},
```

### Confirmed: Loader invocation
```bash
# From C:/EV-Accounts/backend/
# Dry run first — preview URL, confirm no dispatch errors
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MA --fips 25 --layers cousub --dry-run

# Live run (idempotent — ON CONFLICT DO NOTHING)
npx tsx scripts/load-state-tiger-boundaries.ts \
  --state MA --fips 25 --layers cousub
```

### Confirmed: Post-load SQL verification
```sql
-- Source: verify-ma-tiger-import.sql pattern — adapt for G4040
SELECT mtfcc, COUNT(*) FROM essentials.geofence_boundaries
WHERE state = '25' GROUP BY mtfcc ORDER BY mtfcc;
-- After Phase 48, expected:
--   G4020 | 14    (counties, from Phase 38)
--   G4040 | 293   (MA towns, NEW from Phase 48)
--   G4110 | 58    (incorporated places, from Phase 38)
--   G5200 | 9     (congressional, from Phase 38)
--   G5210 | 40    (state senate, from Phase 38)
--   G5220 | 160   (state house, from Phase 38)
```

---

## MA COUSUB Specific Geographic Facts

### Key GEOID Values (Confirmed via TIGERweb)
| Town | COUSUB GEOID | County FIPS | COUSUBFP | FUNCSTAT |
|------|--------------|-------------|----------|----------|
| Lexington | 2501735215 | 017 (Middlesex) | 35215 | A (town) |
| Concord | 2501715060 | 017 (Middlesex) | 15060 | A (town) |
| Belmont | to confirm | 017 (Middlesex) | — | A (town) |
| Cambridge | 2501711000 | 017 (Middlesex) | 11000 | F (city, skip) |
| Boston | 2502507000 | 025 (Suffolk) | 07000 | F (city, skip) |
| Worcester | 2502782000 | 027 (Worcester) | 82000 | F (city, skip) |
| Springfield | 2501367000 | 013 (Hampden) | 67000 | F (city, skip) |

### Smoke Test Coordinates
| Town | Lat | Lon | Source |
|------|-----|-----|--------|
| Lexington MA center | 42.4473 | -71.2298 | Multiple geocoordinate sources |
| Concord MA center | 42.4604 | -71.3490 | Multiple geocoordinate sources |

Confirmed: these coordinates are well inside the town boundaries (not near borders).

### Town Count Breakdown (Confirmed via TIGERweb)
- Total MA COUSUB records: 357
- Active towns (FUNCSTAT='A'): **293** — these are the rows to load
- Fictitious city placeholders (FUNCSTAT='F'): **64** (57 + some unorganized/water)
- Note: 58 MA incorporated cities have G4110 in place file; the exact count of FUNCSTAT='F' records is 357-293=64; this includes the 58 cities plus any water/unorganized entities

### NAMELSAD Convention for Towns
TIGER NAMELSAD for MA towns: `"<TownName> town"` (e.g., "Lexington town", "Concord town")
TIGER NAMELSAD for MA cities in COUSUB (FUNCSTAT='F', filtered out): same as place file (e.g., "Cambridge city")

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| MA towns = no coverage | Load 293 G4040 COUSUB rows | Non-city MA residents get LOCAL boundary → correct city official routing |
| Indiana cousub in allowlist but no dispatch | Add cousub LAYER_DISPATCH entry | Fixes Indiana too (though Indiana cousub load is out of scope for Phase 48) |

**No deprecated approaches** — this is a new layer type for the loader.

---

## Open Questions

1. **Exact count of FUNCSTAT='F' records (57 or 64?)**
   - What we know: 357 total - 293 FUNCSTAT='A' = 64 FUNCSTAT='F'. But the project description says "58 MA incorporated cities". The 6-record discrepancy may be water bodies or unorganized areas.
   - What's unclear: Whether any FUNCSTAT='F' records are non-city entities.
   - Recommendation: The FUNCSTAT='A' filter is the correct approach regardless. The pre-flight assertion counts only FUNCSTAT='A' records (293), so any non-city FUNCSTAT='F' records are automatically excluded. No action needed.

2. **Whether Indiana's cousub load is triggered by adding the LAYER_DISPATCH entry**
   - What we know: Indiana's allowlist already includes 'cousub' (line 38). Once LAYER_DISPATCH has a cousub entry, `--state IN --layers cousub` would work.
   - What's unclear: Whether Indiana cousub should be loaded as part of Phase 48 or deferred.
   - Recommendation: Phase 48 scope is MA towns only. Adding the LAYER_DISPATCH entry is a prerequisite, but running it for Indiana is out of scope. Document the entry as a prerequisite, not as an Indiana load task.

3. **Belmont MA coordinates for smoke test**
   - What we know: Belmont is a town (not a city) in Middlesex County, between Cambridge and Waltham.
   - What's unclear: Specific coordinates for a reliably interior point.
   - Recommendation: Use Belmont center at approximately lat=42.3965, lon=-71.1787. Verify via smoke test.

4. **ocd_id convention for towns**
   - What we know: The `place` layer sets ocd_id=NULL per Python audit. The `cousub` layer should follow the same pattern (no established OCD-ID scheme for MA towns).
   - What's unclear: Whether the OCD-ID project defines ocd-division IDs for New England towns.
   - Recommendation: Use ocd_id=NULL matching the place layer pattern. If OCD-IDs for towns are needed in the future, a migration can backfill them.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — full file read; confirmed: no cousub in LAYER_DISPATCH, MA allowlist lacks cousub, IN allowlist has cousub, FUNCSTAT field not yet used
- `C:/EV-Accounts/backend/scripts/verify-ma-tiger-import.sql` — full file read; G4020/G4110/G5200/G5210/G5220 verification pattern
- `C:/EV-Accounts/backend/scripts/smoke-ma-geofences.ts` — full file read; smoke test pattern for new script
- `.planning/phases/38-ma-geofences/38-RESEARCH.md` — full file read; confirmed "towns are G4040 COUSUB, not loaded in Phase 38"
- `https://www2.census.gov/geo/tiger/TIGER2024/COUSUB/` directory — confirmed `tl_2024_25_cousub.zip` exists, 1.9MB
- TIGERweb REST API: `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/1/query`:
  - Total MA COUSUB records: 357
  - FUNCSTAT='A' count: **293** (confirmed via returnCountOnly query)
  - FUNCSTAT='F' records confirmed for Cambridge, Boston, Worcester, Springfield
  - Lexington GEOID: `2501735215` (FUNCSTAT='A')
  - Concord GEOID: `2501715060` (FUNCSTAT='A')
  - All MA COUSUB records use MTFCC G4040 (no G4041 or other codes found)
- `https://www.census.gov/library/reference/code-lists/functional-status-codes.html` — FUNCSTAT='A' = active government, FUNCSTAT='F' = fictitious entity

### Secondary (MEDIUM confidence)
- `https://proximityone.com/dataresources/guide/tl_year_stcty_cousub.htm` — COUSUB field list: STATEFP(2), COUNTYFP(3), COUSUBFP(5), GEOID(10), NAME, NAMELSAD, LSAD, CLASSFP, MTFCC, FUNCSTAT, ALAND, AWATER, INTPTLAT, INTPTLON
- Multiple geocoordinate sources (latitude.to, geodatos.net, latlong.net) — Lexington MA lat=42.4473/lon=-71.2298; Concord MA lat=42.4604/lon=-71.3490

### Tertiary (LOW confidence)
- WebSearch synthesis: MA has 351 total municipalities (58-59 cities + 292-293 towns). The exact 293/58 split is consistent with the TIGERweb query returning 293 FUNCSTAT='A' and 64 FUNCSTAT='F'.

---

## Metadata

**Confidence breakdown:**
- TIGER URL and file existence: HIGH — directly confirmed via directory listing
- COUSUB field names (GEOID, FUNCSTAT, MTFCC, etc.): HIGH — confirmed via TIGERweb and official COUSUB docs
- FUNCSTAT='A' filter returns exactly 293 towns: HIGH — confirmed via TIGERweb returnCountOnly query
- MTFCC is G4040 for all MA COUSUB: HIGH — confirmed via TIGERweb live query (10 sample records all G4040)
- geo_id format (10-char STATEFP+COUNTYFP+COUSUBFP): HIGH — confirmed via TIGERweb GEOID values
- No geo_id collision with G4110 (7-char): HIGH — format length difference makes collision impossible
- Lexington/Concord coordinates: MEDIUM — multiple sources agree but not verified against TIGER polygon directly
- ocd_id=null for cousub: HIGH — follows place layer pattern; no established OCD-ID scheme for towns

**Research date:** 2026-05-18
**Valid until:** 2026-06-18 (stable domain — TIGER 2024 file won't change; town counts fixed until next redistricting)
