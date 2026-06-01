# Phase 72: Portland, OR (Oregon TIGER Boundaries) - Research

**Researched:** 2026-05-28
**Domain:** TIGER/Line 2024 Oregon boundary loading, PostGIS geofence_boundaries, Oregon geography
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** OR TIGER layers: G4110 (incorporated cities), G4020 (counties), SLDU (30 senate districts), SLDL (60 house districts), CD (6 congressional districts). Same layer set as Phase 49 (ME) and Phase 57 (CA).
- **D-02:** OR FIPS = 41. Multnomah County FIPS = 41051.
- **D-03:** Portland custom council district geofences (12 districts, new 2024 charter) → Portland city phase (future). Do NOT include in Phase 72.
- **D-04:** Multnomah County commission district boundaries (custom, not TIGER) → separate phase after Phase 72 government DB work. Do NOT include in Phase 72.
- **D-05:** OR TIGER CD key must be verified by browsing `https://www2.census.gov/geo/tiger/TIGER2024/CD/` before configuring STATE_LAYER_ALLOWLIST. ME used `cd119` (not `cd`) — apply the same pre-flight check for OR.
- **D-06:** Full v8.0 playbook pattern — same multi-phase approach as v6.0 ME and v7.0 CA. Phase 72 is the first phase; multiple phases follow for government DB, state legislature, executives, federal officials, Portland city deep seed, elections, etc.
- **D-07:** Multnomah County officials (5 elected commissioners) ARE in scope for v8.0. Only Multnomah — Washington County and Clackamas County are deferred to v8.1+.
- **D-08:** Multnomah County custom commission boundaries will require a custom loader script (like LA County supervisor loader in Phase 62). This loader work goes in a post-Phase-72 phase.
- **D-09:** Portland adopted a new Strong Mayor + 12-district council system in January 2025. Every future Portland city plan must use this new structure.
- **D-10:** City council title format: `"Councilor (District N, Seat A/B/C)"` — 12 districts × 3 seats each = 36 total council titles.
- **D-11:** 3 separate chambers for Portland: Mayor, City Council, City Auditor.
- **D-12:** `election_method = 'stv'` on both City Council and Mayor chambers.
- **D-13:** Portland's 3-seat STV district races → 3 separate race rows per district per seat. 36 total council races + 1 Mayor + 1 Auditor = 38 races per Portland election cycle.
- **D-14:** OR election discovery source — researcher finds the correct OR Secretary of State URL during Phase 72 research.

### Claude's Discretion

- Exact TIGER layer counts for OR (number of G4110 cities, COUSUB count if any)
- Whether OR has significant G4040 COUSUB population (like MA) that requires loading both G4110 and G4040 — researcher determines this
- Whether OR COUSUB is FUNCSTAT='S' (statistical, skip) or FUNCSTAT='A' (active MCDs, load) — check before loading
- Migration numbering (next is 221 per STATE.md — verify before writing any OR migrations)
- Loader script naming: follow `load-{state}-{layer}.ts` convention in `C:\EV-Accounts\backend\scripts`

### Deferred Ideas (OUT OF SCOPE)

- Voter education for non-standard voting systems (STV, RCV) — separate phase
- Washington County and Clackamas County officials — defer to v8.1+
- Portland-area suburban cities (Beaverton, Gresham, Hillsboro, Lake Oswego) — v8.1+
- OR G4040 COUSUB towns — researcher has now confirmed OR uses CCDs (FUNCSTAT='S'), not active MCDs; COUSUB load deferred or excluded (see COUSUB Decision below)
</user_constraints>

---

## Summary

Phase 72 adds Oregon (FIPS 41) to the generalized TIGER loader (`load-state-tiger-boundaries.ts`) and loads five boundary layers: G4110 incorporated cities (242 places), G4020 counties (36), SLDU senate districts (30), SLDL house districts (60), and CD congressional districts (6 using `cd119` key). This is a near-identical follow-on to Phase 49 (ME) and Phase 57 (CA) with Oregon-specific counts.

**Critical finding on CD key (VERIFIED):** Oregon's 2024 TIGER congressional file is `tl_2024_41_cd119.zip`. The loader key is `cd119`, not `cd`. This matches the Maine pattern exactly. Using the wrong key (`cd`) causes a silent no-op.

**Critical finding on COUSUB (VERIFIED):** Oregon has 212 Census County Divisions (CCDs), all FUNCSTAT='S' (statistical entities with no governmental function). Oregon does NOT have active MCDs (townships). This is the same CCD-only pattern as California — Oregon must NOT be added to `COUSUB_FUNCSTAT_STATES`. Since COUSUBs carry no government function in Oregon (unlike MA towns), there is no routing value in loading them. The Phase 72 scope (D-01) does not include COUSUB, which is correct.

**Primary recommendation:** Add `OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])` to `STATE_LAYER_ALLOWLIST` exactly as `ME` was added in Phase 49. Add an `OR`/`fipsArg === '41'` pre-flight assertion block. Smoke test with a Portland address and a rural eastern Oregon address.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| G4110 city boundaries | Database / PostGIS | — | TIGER place layer loaded to geofence_boundaries; drives LOCAL routing for city officials |
| G4020 county boundaries | Database / PostGIS | — | TIGER county layer; drives COUNTY routing for county officials |
| SLDU senate boundaries | Database / PostGIS | — | TIGER state-scoped SLDU file; drives STATE_UPPER routing |
| SLDL house boundaries | Database / PostGIS | — | TIGER state-scoped SLDL file; drives STATE_LOWER routing |
| CD congressional boundaries | Database / PostGIS | — | TIGER cd119 file; drives NATIONAL_LOWER routing |
| districts table rows | Database / PostGIS | — | Loader writes district rows (except place); point-in-polygon JOIN requires both tables |
| Smoke test verification | Backend / TypeScript | — | Same pattern as smoke-me-geofences.ts; queries PostGIS directly |

---

## Standard Stack

### Core (all pre-existing — no new installs)

| Tool / Library | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| `load-state-tiger-boundaries.ts` | current | Downloads TIGER ZIP, extracts shapefile, upserts geofence_boundaries | Existing generalized loader; all infrastructure present |
| `shapefile` npm | existing | Reads .shp + .dbf files | Already in node_modules |
| `adm-zip` npm | existing | Extracts TIGER ZIP files | Already in node_modules |
| PostgreSQL/PostGIS | existing | ON CONFLICT DO NOTHING idempotency; ST_Covers routing | Established pattern from ME/CA/MA/TX/UT |

### TIGER 2024 Files for Oregon (FIPS 41)

| Layer | Key | TIGER URL (derived) | Expected Records |
|-------|-----|---------------------|-----------------|
| cd119 | `cd119` | `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_41_cd119.zip` | 6 |
| sldu | `sldu` | `https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_41_sldu.zip` | 30 |
| sldl | `sldl` | `https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_41_sldl.zip` | 60 |
| place | `place` | `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_41_place.zip` | 242 (G4110 only; CDPs filtered by MTFCC) |
| county | `county` | `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip` | 36 (filtered to STATEFP=41 from US-wide file) |

**Installation:** No new packages required.

---

## Package Legitimacy Audit

No new packages are installed in this phase. All tooling (`shapefile`, `adm-zip`, `pg`) is pre-existing in `C:/EV-Accounts/backend/node_modules`.

**Packages removed due to slopcheck [SLOP] verdict:** none — no new packages
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
TIGER 2024 Census Server (https://www2.census.gov/geo/tiger/TIGER2024/)
        |
        | HTTP download (cached to .tmp-tiger-2024-41/)
        v
load-state-tiger-boundaries.ts
  --state OR --fips 41 --layers <layer>
        |
        | streamShapefile() → per-record filter
        |   STATEFP filter (county: US-wide file → filter to '41')
        |   MTFCC filter (place: G4110 only, skip CDPs)
        |   Skip codes: ZZZ/000 placeholders
        |
        +---> upsertGeofence() → essentials.geofence_boundaries
        |       ON CONFLICT (geo_id, mtfcc) DO NOTHING
        |       state = '41' (FIPS)
        |
        +---> insertDistrictIfMissing() → essentials.districts
                (cd119, sldu, sldl, county only — place has writeDistrictRow=false)
                state = 'or' (lowercase abbrev)
                NATIONAL_LOWER: state='or'
                COUNTY: state='or'
                STATE_UPPER: state='or'
                STATE_LOWER: state='or'
                
        |
        v
verify-or-tiger-import.sql
  SELECT gates: geometry validity, per-layer counts, Portland sentinel, section-split check

        |
        v
smoke-or-geofences.ts
  Portland OR → G4110 city + CD (OR-03) + SLDU + SLDL + G4020 Multnomah County
  Bend OR (rural) → no G4110 row, correct CD/SLDU/SLDL
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/scripts/
├── load-state-tiger-boundaries.ts   # MODIFY: add OR to 3 config blocks + fipsArg='41' block
├── verify-or-tiger-import.sql       # CREATE: 7-gate SQL verification (SELECT-only)
└── smoke-or-geofences.ts            # CREATE: address smoke test (Portland + rural)
```

### Pattern 1: Adding a New State to the TIGER Loader

**What:** Four additions to `load-state-tiger-boundaries.ts` following the ME/CA precedent.

**When to use:** Any time a new US state needs TIGER boundary loading.

**Addition 1 — STATE_LAYER_ALLOWLIST** (insert after the ME entry):
```typescript
// Source: established pattern from ME Phase 49 + CA Phase 57
OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```

**Addition 2 — STATE_CITY_ASSERTIONS** (insert after the ME entry):
```typescript
OR: ['Portland city'],
```

**Addition 3 — STATE_RUN_MAKEVALID** (insert after the ME entry):
```typescript
OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```
All 5 layers get ST_MakeValid. Mirrors the ME entry exactly.

**Addition 4 — fipsArg === '41' pre-flight assertion block** (inside processLayer, after the fipsArg === '06' block):
```typescript
if (fipsArg === '41') {
  const EXPECTED_OR_MTFCC: Record<string, number> = {
    cd119:  6,   // 6 OR congressional districts (post-2022 redistricting)
    sldu:  30,   // 30 OR Senate districts
    sldl:  60,   // 60 OR House districts
    place: 242,  // 242 OR G4110 incorporated places (233 cities + 9 towns)
    county: 36,  // 36 OR counties
  };
  // ... same pattern as fipsArg === '23' and fipsArg === '06' blocks
}
```

**IMPORTANT:** The `place` count of 242 includes 9 incorporated towns that appear as G4110 in TIGER (Oregon incorporated towns are legally incorporated like cities; they are not statistical CDPs). The loader's existing G4110 MTFCC filter already handles this correctly — CDPs (G4150) are excluded by the MTFCC filter, so the count is 242 (not 377 total places). This count should be confirmed with a dry-run before the live run.

**IMPORTANT:** Oregon is NOT a COUSUB_FUNCSTAT_STATES state. Oregon's 212 county subdivisions are all FUNCSTAT='S' (statistical CCDs). Do NOT add 'OR' to `COUSUB_FUNCSTAT_STATES`. The `cousub` layer is not in Phase 72 scope (D-01) and should not be added to OR's allowlist.

### Pattern 2: Verify SQL (model on verify-me-tiger-import.sql)

```sql
-- Phase 72 OR TIGER import verification — SELECT only, no writes
-- Gate 1: No invalid geometries — MUST return 0
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '41' AND NOT ST_IsValid(geometry);

-- Gate 2: No GeometryCollection types — MUST return 0
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '41'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');

-- Gate 3: Per-layer row counts
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '41'
GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|36, G4110|242, G5200|6, G5210|30, G5220|60

-- Gate 4: Portland city sentinel
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '41' AND geo_id = '4159000';
-- Expected: 1 row, name='Portland city', mtfcc='G4110'

-- Gate 5: districts table counts
SELECT district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state = 'or'
GROUP BY district_type ORDER BY district_type;
-- Expected: COUNTY|36, NATIONAL_LOWER|6, STATE_LOWER|60, STATE_UPPER|30

-- Gate 6: Multnomah County present
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '41' AND mtfcc = 'G4020' AND geo_id = '41051';
-- Expected: 1 row, name='Multnomah County'

-- Gate 7: Section-split check (all OR boundaries have matching districts rows)
SELECT gb.geo_id, gb.mtfcc, gb.name
FROM essentials.geofence_boundaries gb
WHERE gb.state = '41'
  AND gb.mtfcc IN ('G5200','G5210','G5220','G4020')
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
ORDER BY gb.mtfcc;
-- Expected: 0 rows
```

### Pattern 3: Smoke Test (model on smoke-me-geofences.ts)

```typescript
// smoke-or-geofences.ts
// Test addresses:
const TEST_ADDRESSES = [
  // Portland OR — expect G4110 geo_id='4159000', G5200 OR-03, G4020 Multnomah
  { label: 'Portland OR (City Hall)', lon: -122.6794, lat: 45.5231 },
  // Bend OR (rural Central Oregon) — expect no G4110 row, OR-02, Deschutes County
  { label: 'Bend OR (rural)', lon: -121.3153, lat: 44.0582 },
  // Salem OR (state capital, Marion County) — G4110 Salem, OR-05, Marion County
  { label: 'Salem OR (state capital)', lon: -123.0351, lat: 44.9429 },
];
// Query: WHERE state = '41' AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
```

### Anti-Patterns to Avoid

- **Using `cd` instead of `cd119`:** Oregon's TIGER file is `tl_2024_41_cd119.zip`. The loader key `cd` constructs the wrong URL and downloads 0 records silently. Always use `cd119`.
- **Adding OR to COUSUB_FUNCSTAT_STATES:** Oregon's 212 county subdivisions are all statistical CCDs (FUNCSTAT='S'). Adding OR to this set would cause all 212 COUSUB records to be silently skipped. But since COUSUB is not in Phase 72 scope at all, just don't add a `cousub` entry to OR's allowlist.
- **Loading COUSUB for OR thinking it covers townships:** Oregon has NO active townships. All incorporated municipalities are G4110 incorporated places. There is no underserved rural population equivalent to MA's 293 towns.
- **Using uppercase 'OR' in districts.state:** The loader writes `abbrev = FIPS_TO_STATE[fips]` which is lowercase `'or'`. The `districts.state` column for OR will be `'or'` for COUNTY/STATE_UPPER/STATE_LOWER and also `'or'` for NATIONAL_LOWER (see loader code line 968: `state: abbrev`). This differs from some pre-existing CA rows that landed as 'CA' before the loader was generalized — no pre-existing OR data exists, so OR will have clean lowercase consistency.
- **Running loader from C:/EV-Accounts (root):** dotenv looks for `.env` in cwd. Must run from `C:/EV-Accounts/backend`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Downloading TIGER ZIP | Custom HTTP client | `downloadWithRedirects()` in loader | Handles 301/302, caching, error cleanup |
| Parsing shapefile | Manual DBF/SHP parsing | `shapefile` npm (already in node_modules) | TIGER ships UTF-8 shapefiles; encoding handled |
| Geometry upsert | Custom INSERT | `upsertGeofence()` helper | ON CONFLICT (geo_id, mtfcc) DO NOTHING; ST_MakeValid |
| District row creation | Custom INSERT | `insertDistrictIfMissing()` helper | WHERE NOT EXISTS guard for idempotency |
| FIPS → abbreviation | Hardcoded per-state logic | `FIPS_TO_STATE` lookup table | Already contains OR: 'or' at line 113 |

**Key insight:** The entire TIGER loading infrastructure is already built. Phase 72 is a configuration addition (4 insertions + new state key) plus running existing commands with `--state OR --fips 41`.

---

## Common Pitfalls

### Pitfall 1: Wrong CD Key (cd vs cd119)
**What goes wrong:** Loader runs, reports 0 records inserted, no error.
**Why it happens:** `cd` key constructs URL `tl_2024_41_cd.zip` which does not exist on Census server. The server returns HTTP 404, loader silently skips.
**How to avoid:** Always use `cd119`. Verified 2026-05-28: `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_41_cd119.zip` exists.
**Warning signs:** Pre-flight assertion fires with 0 actual records; or `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='41' AND mtfcc='G5200'` returns 0.

### Pitfall 2: Wrong G4110 City Count in Pre-flight Assertion
**What goes wrong:** Pre-flight assertion throws `MtfccAssertionError` because expected count (242) doesn't match actual TIGER 2024 file.
**Why it happens:** TIGER vintage may differ; Oregon's place count could vary if annexations changed incorporated vs. CDP status between 2024 vintage cycles.
**How to avoid:** Run `--dry-run` first to see the actual count before setting the assertion. The 242 count (233 cities + 9 towns) is from Census 2020 data [ASSUMED — TIGER 2024 may differ slightly].
**Warning signs:** `MtfccAssertionError` with actual count near 242. If off by 1-5, update `EXPECTED_OR_MTFCC.place` to match actual count and document in SUMMARY.

### Pitfall 3: districts.state casing confusion
**What goes wrong:** Downstream phases query `WHERE state = 'OR'` (uppercase) and get 0 rows.
**Why it happens:** The loader writes `state: abbrev` (lowercase `'or'`). This is correct behavior. Downstream phase authors may assume uppercase because other CA pre-existing data had uppercase 'CA'.
**How to avoid:** After load, run `SELECT DISTINCT state FROM essentials.districts WHERE state ILIKE 'or'` — should return only `'or'` (lowercase). Document in SUMMARY that OR uses lowercase `'or'` consistently.

### Pitfall 4: OR Congress count (6, not 5)
**What goes wrong:** Pre-flight assertion set to 5 (old count) fails because OR has 6 CDs.
**Why it happens:** Oregon gained a 6th congressional district after 2022 redistricting following 2020 Census population growth. OR-5 (SW Portland/Willamette Valley) is new as of 2023.
**How to avoid:** Use 6 in `EXPECTED_OR_MTFCC.cd119`. [VERIFIED: D-01 in CONTEXT.md confirms 6 CDs; search results confirm OR-5 is new post-2022 redistricting]

### Pitfall 5: Multnomah County geo_id format
**What goes wrong:** Code references Multnomah County as `'41051'` (5-char FIPS) but the loader writes county geo_id from TIGER's GEOID field which is also `'41051'`. Should be consistent.
**Why it happens:** Same pattern as other states — county GEOID = STATEFP + COUNTYFP = '41' + '051' = '41051'. This is correct.
**How to avoid:** Smoke test specifically checks `geo_id = '41051'` returns Multnomah County (D-02 confirms this). Gate 6 in verify SQL covers it.

---

## Code Examples

### Loader Config Additions (all 4 insertions)

```typescript
// Source: established pattern from load-state-tiger-boundaries.ts ME/CA entries

// 1. STATE_LAYER_ALLOWLIST (~line 34-41, after ME entry)
OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),

// 2. STATE_CITY_ASSERTIONS (~line 77-82, after ME entry)
OR: ['Portland city'],

// 3. STATE_RUN_MAKEVALID (~line 87-93, after ME entry)
OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),

// 4. fipsArg === '41' block (inside processLayer, after fipsArg === '06' block ~line 803)
if (fipsArg === '41') {
  const EXPECTED_OR_MTFCC: Record<string, number> = {
    cd119:  6,
    sldu:  30,
    sldl:  60,
    place: 242,   // confirm with dry-run first; 233 cities + 9 towns = 242 G4110 records
    county: 36,
  };
  if (layer in EXPECTED_OR_MTFCC) {
    const expected = EXPECTED_OR_MTFCC[layer];
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
        `[OR MTFCC assertion] layer=${layer}: expected ${expected} records, got ${actualCount}. ` +
        `TIGER file: ${url}. Aborting before any DB write.`
      );
      err.name = 'MtfccAssertionError';
      throw err;
    }
    console.log(`  [${layer}] OR MTFCC pre-flight assertion PASSED: ${actualCount} records (expected ${expected}).`);
  }
}
```

### Loader Run Commands

```bash
# Run from C:/EV-Accounts/backend (not C:/EV-Accounts root — dotenv path)
cd C:/EV-Accounts/backend

# Dry-run first to verify URLs and counts
npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers cd119 --dry-run

# Live runs (run sequentially, wait for each to complete)
npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers cd119
npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers sldu
npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers sldl
npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers place
npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers county
```

### TypeScript Compile Check

```bash
cd C:/EV-Accounts && npx tsc --noEmit
# Must exit 0 after all 4 loader additions
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Per-state loader scripts | Generalized `load-state-tiger-boundaries.ts` | Phase 130 (TIGER generalization) | OR just needs config additions, no new loader file |
| `cd` key for congressional | `cd119` key (ME/OR); `cd` still used for CA/TX/MA | Phase 49 (ME) | OR follows ME pattern — always browse CD directory to confirm |
| No FUNCSTAT check | State-conditional FUNCSTAT='A' filter (MA only) | Phase 57 (CA) | OR has FUNCSTAT='S' CCDs — correctly excluded from COUSUB_FUNCSTAT_STATES |

**Deprecated/outdated:**
- Hardcoded per-state TIGER loader scripts (load-ca-state-boundaries.ts, load-tx-state-boundaries.ts) — deleted in Phase 130, replaced by generalized loader

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Oregon has 242 G4110 incorporated places (233 cities + 9 towns) in TIGER 2024 | Standard Stack, Code Examples | Pre-flight assertion will fire; update `EXPECTED_OR_MTFCC.place` to actual count — dry-run first |
| A2 | Portland OR geo_id = '4159000' (STATEFP='41' + PLACEFP='59000') | Common Pitfalls, Code Examples | Gate 4 in verify SQL will return 0 rows; identify correct geo_id from DB after load |
| A3 | Oregon's SLDU file has exactly 30 records and SLDL has exactly 60 in TIGER 2024 | Standard Stack | Pre-flight assertion fires; update counts to match actual |
| A4 | Migration next number is 221 per STATE.md | (no migration needed for Phase 72 — loader only) | N/A for this phase; verify in SUMMARY before Phase 73 |
| A5 | OR county count = 36 in TIGER 2024 | Standard Stack | Pre-flight assertion fires; well-established (Oregon has had 36 counties since 1916) — very low risk |

**Note:** A1-A3 can all be confirmed by running with `--dry-run` before live execution. The planner should include a dry-run step in the plan to validate counts before the pre-flight assertion is set.

---

## Open Questions (RESOLVED)

1. **Exact G4110 place count for OR TIGER 2024** — RESOLVED BY PLAN DESIGN: dry-run step built into 72-01 Task 3 confirms actual count before locking pre-flight assertion.
   - What we know: Census 2020 lists 242 incorporated places (233 cities + 9 towns); all G4110 in TIGER
   - What's unclear: TIGER 2024 may differ slightly from Census 2020 count if any places incorporated/disincorporated between 2020-2024
   - Recommendation: Run `--dry-run` on the place layer before setting the pre-flight count. The planner should include a dry-run sub-task before the live assertion is locked.

2. **OR election discovery source URL** — OUT OF SCOPE for Phase 72 (elections phase is a future phase in v8.0).
   - What we know: D-14 defers this to research; Oregon Secretary of State (sos.oregon.gov) runs elections
   - What's unclear: Exact URL for the 2026 OR election results / candidate filing source
   - Recommendation: Phase 72 does not need this URL (it's for a future elections phase). Note: `https://sos.oregon.gov/elections/` is the canonical Oregon elections portal.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npx tsx | Loader + smoke test | ✓ (pre-existing) | per C:/EV-Accounts | — |
| DATABASE_URL in C:/EV-Accounts/backend/.env | DB writes | ✓ (pre-existing, used by all phases) | — | — |
| Census TIGER server (www2.census.gov) | TIGER file downloads | ✓ (public, verified 2026-05-28) | — | — |
| PostGIS (ST_Covers, ST_MakeValid) | Geometry operations | ✓ (pre-existing, used since Phase 38) | — | — |

**Missing dependencies with no fallback:** none

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Custom TypeScript smoke tests (no jest/vitest) + SQL verification gates |
| Config file | none — scripts run directly with `npx tsx` |
| Quick run command | `cd C:/EV-Accounts/backend && npx tsx scripts/smoke-or-geofences.ts` |
| Full suite command | `psql $DATABASE_URL -f scripts/verify-or-tiger-import.sql` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEO-OR-01 | OR G4110/G4020/SLDU/SLDL/CD boundaries loaded with correct counts | SQL gates | `psql ... -f verify-or-tiger-import.sql` (Gate 3) | Wave 0 |
| GEO-OR-02 | Portland address routes to Portland G4110 boundary | smoke | `npx tsx scripts/smoke-or-geofences.ts` | Wave 0 |
| GEO-OR-03 | Portland address routes to OR-03 CD, Multnomah County G4020 | smoke | `npx tsx scripts/smoke-or-geofences.ts` | Wave 0 |
| GEO-OR-04 | Rural OR address has no G4110 row (unincorporated) | smoke | `npx tsx scripts/smoke-or-geofences.ts` | Wave 0 |
| GEO-OR-05 | All loaded geometries are valid (no GeometryCollections) | SQL gates | verify SQL Gates 1+2 | Wave 0 |
| GEO-OR-06 | Section-split check returns 0 rows | SQL gate | verify SQL Gate 7 | Wave 0 |

### Sampling Rate
- **Per task commit:** TypeScript compile check (`npx tsc --noEmit`)
- **Per wave merge:** Full SQL verification gates
- **Phase gate:** Smoke test green + all SQL gates green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` — covers GEO-OR-01/05/06
- [ ] `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` — covers GEO-OR-02/03/04

---

## Security Domain

This phase loads public Census boundary data from the official Census Bureau server (https://www2.census.gov). No authentication, no user data, no PII. ASVS categories V2/V3/V4/V6 do not apply. V5 input validation is handled by the existing TIGER loader's STATEFP/MTFCC filters and pre-flight assertions.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — read in full; all 4 config structures and fipsArg block patterns verified [VERIFIED: codebase]
- `https://www2.census.gov/geo/tiger/TIGER2024/CD/` — browsed 2026-05-28; confirmed `tl_2024_41_cd119.zip` exists for Oregon [VERIFIED: Census Bureau TIGER server]
- `https://www2.census.gov/geo/tiger/TIGER2024/COUSUB/` — browsed 2026-05-28; confirmed `tl_2024_41_cousub.zip` exists (8MB) [VERIFIED: Census Bureau TIGER server]
- `https://www2.census.gov/geo/tiger/TIGER2024/PLACE/` — browsed 2026-05-28; confirmed `tl_2024_41_place.zip` exists (2.2MB) [VERIFIED: Census Bureau TIGER server]
- `.planning/STATE.md` — Accumulated Context section; ME/CA TIGER patterns, migration number 221 confirmed [VERIFIED: codebase]
- `.planning/phases/49-me-geofences/49-01-PLAN.md` — ME loader additions template [VERIFIED: codebase]
- `.planning/phases/57-ca-geofences/57-01-PLAN.md` — CA COUSUB FUNCSTAT pattern [VERIFIED: codebase]

### Secondary (MEDIUM confidence)
- `https://www.census.gov/geographies/reference-files/2010/geo/state-local-geo-guides-2010/oregon.html` — Oregon has 242 incorporated places (233 cities + 9 towns), 212 CCDs (no active MCDs) [CITED: Census Bureau official]
- WebSearch results: "Oregon has 242 incorporated places; CCDs first established 1960; no MCDs" [CITED: Census official source via search]
- WebSearch: Oregon's 6 congressional districts confirmed post-2022 redistricting; OR-5 new in 2023 [CITED: Ballotpedia / multiple sources]

### Tertiary (LOW confidence)
- Portland OR PLACEFP='59000' → geo_id='4159000' [ASSUMED — derived from GEOID construction pattern; verify after place layer loads]

---

## Metadata

**Confidence breakdown:**
- CD key verification: HIGH — directly browsed TIGER 2024 CD directory, file confirmed
- COUSUB FUNCSTAT: HIGH — Census official source confirms Oregon has only CCDs (FUNCSTAT='S'), no active MCDs
- OR place count (242): MEDIUM — from Census 2020 reference page; TIGER 2024 vintage may differ by 1-5
- OR district counts (30/60/6/36): HIGH — well-established; 30/60 confirmed by state legislature sources; 6 CDs confirmed by redistricting sources; 36 counties unchanged since 1916
- Portland geo_id (4159000): LOW-MEDIUM — inferred from GEOID pattern; dry-run confirms

**Research date:** 2026-05-28
**Valid until:** 2026-08-28 (TIGER 2024 files are stable; Oregon redistricting complete)
