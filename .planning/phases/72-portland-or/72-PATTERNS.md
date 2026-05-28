# Phase 72: Portland, OR (Oregon TIGER Boundaries) - Pattern Map

**Mapped:** 2026-05-28
**Files analyzed:** 3
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | config/loader | batch (TIGER download → PostGIS upsert) | itself (ME block lines 684-725, CA block lines 770-803) | exact — same file, add OR block after CA block |
| `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql` | utility (SQL gates) | batch (SELECT-only verification) | `C:/EV-Accounts/backend/scripts/verify-me-tiger-import.sql` | exact — same 7-gate structure; ME uses state='23', OR uses state='41' |
| `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` | utility (smoke test) | request-response (PostGIS point-in-polygon) | `C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts` | exact — CA has structured assertions + pass/fail exit codes; ME is simpler printout; OR should follow CA's structured pattern |

---

## Pattern Assignments

### `load-state-tiger-boundaries.ts` — MODIFY (add OR config blocks)

**Analog:** itself (the existing ME and CA state blocks)

**Modification 1 — STATE_LAYER_ALLOWLIST** (lines 34-41, after `ME:` entry at line 40):
```typescript
// Current ME entry (line 40):
ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
// INSERT after it:
OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```
OR mirrors ME exactly. No cousub (Oregon CCDs are all FUNCSTAT='S', same as CA, but cousub is out of Phase 72 scope entirely — D-01).

**Modification 2 — STATE_CITY_ASSERTIONS** (lines 77-82, after `ME:` entry at line 81):
```typescript
// Current ME entry (line 81):
ME: ['Portland city'],
// INSERT after it:
OR: ['Portland city'],
```
Same sentinel city name as ME by coincidence — both states have a Portland city.

**Modification 3 — STATE_RUN_MAKEVALID** (lines 87-93, after `ME:` entry at line 92):
```typescript
// Current ME entry (line 92):
ME: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
// INSERT after it:
OR: new Set(['cd119', 'sldu', 'sldl', 'place', 'county']),
```
All 5 OR layers receive ST_MakeValid. Mirrors ME entry exactly.

**Modification 4 — fipsArg === '41' pre-flight assertion block** (after CA block ending at line 803):

Pattern to copy from ME block (lines 687-725):
```typescript
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

Substitute for OR (`fipsArg === '41'`):
- `'23'` → `'41'`
- `EXPECTED_ME_MTFCC` → `EXPECTED_OR_MTFCC`
- counts: `cd119: 6, sldu: 30, sldl: 60, place: 242, county: 36`
- error prefix `[ME MTFCC assertion]` → `[OR MTFCC assertion]`
- error suffix `FIPS 23` → `FIPS 41`
- log prefix `ME MTFCC` → `OR MTFCC`

**CRITICAL:** `place: 242` is a MEDIUM-confidence count from Census 2020. Run `--dry-run` on the place layer first to confirm the TIGER 2024 actual count before setting this value.

**Insertion point:** After the CA block closing brace at line 803, before the comment `// ── Stream records ──` at line 805.

---

### `verify-or-tiger-import.sql` — CREATE

**Analog:** `C:/EV-Accounts/backend/scripts/verify-me-tiger-import.sql` (lines 1-54, full file)

**Header pattern** (lines 1-3):
```sql
-- Phase 49 ME TIGER import verification — SELECT only, no writes
-- Run via: psql $DATABASE_URL -f backend/scripts/verify-me-tiger-import.sql
```
Substitute: `49 ME` → `72 OR`, `backend/scripts/verify-me-tiger-import.sql` → `backend/scripts/verify-or-tiger-import.sql`.

**Gate 1 pattern** (lines 5-7):
```sql
SELECT COUNT(*) AS invalid_geometry_count
FROM essentials.geofence_boundaries
WHERE state = '23' AND NOT ST_IsValid(geometry);
```
Substitute `'23'` → `'41'`.

**Gate 2 pattern** (lines 10-14):
```sql
SELECT COUNT(*) AS geometry_collection_count
FROM essentials.geofence_boundaries
WHERE state = '23'
  AND ST_GeometryType(geometry) NOT IN ('ST_Polygon', 'ST_MultiPolygon');
```
Substitute `'23'` → `'41'`.

**Gate 3 pattern** (lines 17-22):
```sql
SELECT mtfcc, COUNT(*) AS row_count
FROM essentials.geofence_boundaries
WHERE state = '23'
GROUP BY mtfcc ORDER BY mtfcc;
-- Expected: G4020|16, G4110|23, G5200|2, G5210|35, G5220|151
```
Substitute `'23'` → `'41'`; update expected comment to `G4020|36, G4110|242, G5200|6, G5210|30, G5220|60`.

**Gate 4 pattern** (lines 25-28):
```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '23' AND geo_id = '2360545';
-- Expected: 1 row, name='Portland city', mtfcc='G4110'
```
Substitute `'23'` → `'41'`; `'2360545'` → `'4159000'` (ASSUMED — confirm after place layer loads; PLACEFP='59000' for Portland OR). The sentinel check comment label changes from `Portland place boundary present (GEO-05 prerequisite)` to `Portland OR place boundary present`.

**Gate 5 pattern** (lines 31-40):
```sql
SELECT state, district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state IN ('ME', 'me')
GROUP BY state, district_type ORDER BY state, district_type;
```
Substitute `IN ('ME', 'me')` → `IN ('OR', 'or')`. OR has no pre-existing uppercase rows (unlike CA's 3 legacy uppercase rows), so expect all rows as lowercase `'or'`. Expected: `COUNTY|36, NATIONAL_LOWER|6, STATE_LOWER|60, STATE_UPPER|30`.

**Gate 6 pattern** (lines 42-47 of ME file — sample congressional districts):
```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '23' AND mtfcc = 'G4020' AND name LIKE '%Cumberland%';
```
For OR: change from a congressional districts gate to a Multnomah County gate (matches RESEARCH.md Gate 6):
```sql
SELECT geo_id, name, mtfcc
FROM essentials.geofence_boundaries
WHERE state = '41' AND mtfcc = 'G4020' AND geo_id = '41051';
-- Expected: 1 row, name='Multnomah County'
```

**Gate 7 — section-split check** (not in ME file; use RESEARCH.md pattern):
```sql
SELECT gb.geo_id, gb.mtfcc, gb.name
FROM essentials.geofence_boundaries gb
WHERE gb.state = '41'
  AND gb.mtfcc IN ('G5200','G5210','G5220','G4020')
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
ORDER BY gb.mtfcc;
-- Expected: 0 rows
```
This gate exists in the CA verify file as a structural check; it is standard across all states after Phase 49.

---

### `smoke-or-geofences.ts` — CREATE

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts` (full file, 295 lines)

Use the CA pattern (structured assertions, pass/fail exit codes, `allPassed` flag) rather than the ME pattern (simple printout). OR has a meaningful case to test — unincorporated rural address that must NOT return G4110 — which requires the CA-style `forbiddenMtfcc` check.

**Imports pattern** (lines 1-4 of smoke-ca-geofences.ts):
```typescript
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
```
Copy verbatim. No additional imports needed.

**AddressTest interface pattern** (lines 22-28):
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
Copy verbatim.

**TEST_ADDRESSES pattern** (lines 30-64):
```typescript
const TEST_ADDRESSES: AddressTest[] = [
  {
    label: 'SF City Hall (consolidated city-county)',
    lon: -122.4191,
    lat: 37.7792,
    expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
    expectedGeoIds: {
      G4110: '0667000',
      G4020: '06075',
    },
  },
  ...
];
```
For OR, three test addresses (from RESEARCH.md Architecture Diagram):
1. Portland OR City Hall: `lon: -122.6794, lat: 45.5231` — `expectedMtfcc: ['G4020','G4110','G5200','G5210','G5220']`, `expectedGeoIds: { G4110: '4159000', G4020: '41051' }` (geo_ids ASSUMED — confirm after place layer loads)
2. Bend OR (unincorporated rural): `lon: -121.3153, lat: 44.0582` — `expectedMtfcc: ['G4020','G5200','G5210','G5220']`, `forbiddenMtfcc: ['G4110']`
3. Salem OR (state capital): `lon: -123.0351, lat: 44.9429` — `expectedMtfcc: ['G4020','G4110','G5200','G5210','G5220']`

**queryBoundaries helper pattern** (lines 69-83):
```typescript
async function queryBoundaries(
  client: Client,
  lon: number,
  lat: number
): Promise<Array<{ geo_id: string; name: string; mtfcc: string }>> {
  const res = await client.query<{ geo_id: string; name: string; mtfcc: string }>(
    `SELECT geo_id, name, mtfcc
     FROM essentials.geofence_boundaries
     WHERE state = '06'
       AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     ORDER BY mtfcc`,
    [lon, lat],
  );
  return res.rows;
}
```
Copy verbatim; substitute `'06'` → `'41'`.

**main() DB connection pattern** (lines 85-95):
```typescript
async function main() {
  if (!process.env['DATABASE_URL']) {
    process.stderr.write('ERROR: DATABASE_URL not set\n');
    process.exit(1);
  }
  const client = new Client({
    connectionString: process.env['DATABASE_URL'],
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
```
Copy verbatim.

**Layer count check (SC3 equivalent) pattern** (lines 103-134):
```typescript
const countRes = await client.query<{ mtfcc: string; row_count: string }>(
  `SELECT mtfcc, COUNT(*) AS row_count
   FROM essentials.geofence_boundaries
   WHERE state = '06'
     AND mtfcc IN ('G4020','G4040','G4110','G5200','G5210','G5220')
   GROUP BY mtfcc ORDER BY mtfcc`,
);
const expectedCounts: Record<string, number> = {
  G4020: 58,
  G4040: 404,
  G4110: 482,
  G5200: 52,
  G5210: 40,
  G5220: 80,
};
```
For OR: substitute `'06'` → `'41'`; remove `G4040` (no COUSUB loaded for OR); update expectedCounts to `{ G4020: 36, G4110: 242, G5200: 6, G5210: 30, G5220: 60 }`.

**Address assertion loop pattern** (lines 140-212): Copy verbatim — the `expectedMtfcc`, `forbiddenMtfcc`, and `expectedGeoIds` loop logic is generic and requires no state-specific changes.

**No Bend fallback needed** (unlike CA's East LA fallback at lines 67, 145-149): Bend's coordinates are firmly in Deschutes County unincorporated territory. No fallback coordinate needed.

**Target city geo_id lookup block** (lines 217-265): Replace with an OR-specific block querying for `'Portland city'`, `'Salem city'`, `'Eugene city'` using `state = '41'` and `mtfcc = 'G4110'`.

**Final result block pattern** (lines 273-290):
```typescript
if (allPassed) {
  console.log('ALL ASSERTIONS PASSED');
  process.exit(0);
} else {
  console.log(`FAILED (${errors.length} assertion(s)):`);
  for (const err of errors) {
    console.log(`  - ${err}`);
  }
  process.exit(1);
}
```
Copy verbatim. Update the success criteria printout to reference Phase 72 success criteria (GEO-OR-01 through GEO-OR-06).

**Error handler pattern** (lines 292-295):
```typescript
main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
```
Copy verbatim.

---

## Shared Patterns

### DB Connection (applies to smoke-or-geofences.ts)
**Source:** `C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts` lines 85-95
```typescript
if (!process.env['DATABASE_URL']) {
  process.stderr.write('ERROR: DATABASE_URL not set\n');
  process.exit(1);
}
const client = new Client({
  connectionString: process.env['DATABASE_URL'],
  ssl: { rejectUnauthorized: false },
});
await client.connect();
```
**Apply to:** `smoke-or-geofences.ts`. `process.env['DATABASE_URL']` bracket notation (CA pattern) is preferred over `process.env.DATABASE_URL` (ME pattern) — matches stricter TypeScript indexing convention used in the CA file.

### PostGIS Point-in-Polygon Query
**Source:** `C:/EV-Accounts/backend/scripts/smoke-me-geofences.ts` lines 46-53
```typescript
const res = await client.query<{ geo_id: string; name: string; mtfcc: string }>(
  `SELECT geo_id, name, mtfcc
   FROM essentials.geofence_boundaries
   WHERE state = '23'
     AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
   ORDER BY mtfcc`,
  [addr.lon, addr.lat],
);
```
**Apply to:** `smoke-or-geofences.ts`. Substitute `'23'` → `'41'`. Use `ST_Covers` (not `ST_Contains`) — handles edge cases where the point is on the polygon boundary.

### SQL Gate Structure (applies to verify-or-tiger-import.sql)
**Source:** `C:/EV-Accounts/backend/scripts/verify-me-tiger-import.sql` lines 1-54 (full file)
**Apply to:** `verify-or-tiger-import.sql`. All 7 gates follow the ME template structure with only FIPS string and count substitutions.

### Pre-flight Assertion Block Structure
**Source:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` lines 684-725 (ME block)
**Apply to:** `load-state-tiger-boundaries.ts` new OR block (insert at line ~804).
The ME block is the cleanest template — it covers all 5 layer types (cd119, sldu, sldl, place, county), includes the G4110 MTFCC filter for the place layer, and handles STATEFP filtering for the county (US-wide) file. The CA block (lines 770-803) covers fewer layers (county + cousub only) and is a worse template for OR's 5-layer assertion.

---

## No Analog Found

All three files have close analogs. No files lack a codebase match.

---

## Key Assumptions Requiring Dry-Run Verification

The following values in the OR patterns are ASSUMED and must be confirmed by running `--dry-run` before the pre-flight assertion is locked in the loader and before Gate 3/4 expected values are finalized in the verify SQL:

| Value | Used In | Risk | Action |
|-------|---------|------|--------|
| `place: 242` | loader pre-flight block, verify SQL Gate 3 | MEDIUM — TIGER 2024 may differ from Census 2020 reference | Run `npx tsx scripts/load-state-tiger-boundaries.ts --state OR --fips 41 --layers place --dry-run` first |
| Portland geo_id `'4159000'` | verify SQL Gate 4, smoke test `expectedGeoIds` | LOW-MEDIUM — derived from STATEFP+PLACEFP pattern | Confirm from DB: `SELECT geo_id FROM essentials.geofence_boundaries WHERE state='41' AND name='Portland city'` after place layer loads |
| Multnomah County geo_id `'41051'` | verify SQL Gate 6, smoke test `expectedGeoIds` | LOW — standard STATEFP+COUNTYFP pattern; consistent across all states | Confirm from DB after county layer loads |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 4 analog files read in full (`smoke-me-geofences.ts`, `smoke-ca-geofences.ts`, `verify-me-tiger-import.sql`, `verify-ca-tiger-import.sql`) + targeted sections of `load-state-tiger-boundaries.ts` (lines 1-120 header/config, lines 684-813 fipsArg blocks)
**Pattern extraction date:** 2026-05-28
