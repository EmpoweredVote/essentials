# Phase 174: West-Metro School-District Geofences - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 2 new files
**Analogs found:** 2 / 2

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-or-westmetro-school-boundaries.ts` | utility (data loader) | file-I/O + batch DB insert | `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` | exact (3-constant clone) |
| `C:/EV-Accounts/backend/scripts/smoke-or-westmetro-school.ts` | test (smoke) | request-response (DB query) | `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts` | role-match (same ST_Covers query pattern, different assertions) |

---

## Pattern Assignments

### `scripts/load-or-westmetro-school-boundaries.ts` (data loader, file-I/O + batch insert)

**Analog:** `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts`

This is a 3-constant clone. The entire analog file (269 lines) is the implementation. Copy it verbatim and change only the three constants listed below. Do NOT modify the analog.

**Imports pattern** (lines 21-27):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as shapefile from 'shapefile';
```

**Config block — the 3 constants that change** (analog lines 31-46, new values):
```typescript
const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_41_unsd.zip';  // UNCHANGED
const MTFCC        = 'G5420';        // UNCHANGED
const STATE        = '41';           // UNCHANGED (Oregon FIPS — NOT 'or')
const SOURCE       = 'tiger_unsd_or_2024_westmetro';  // CHANGED from 'tiger_unsd_or_2024'
const EXPECTED_COUNT = 5;            // CHANGED from 6

const TARGET_GEOIDS = new Map<string, string>([  // CHANGED (5 west-metro entries, not 6 Multnomah)
  ['4101920', 'Beaverton School District 48J'],
  ['4100023', 'Hillsboro School District 1J'],
  ['4112240', 'Tigard-Tualatin School District 23J'],
  ['4105160', 'Forest Grove School District 15'],
  ['4111290', 'Sherwood School District 88J'],
]);
```

**Temp dir — change the path constant** (analog line 51):
```typescript
// Analog uses: path.join(process.cwd(), '.tmp-or-school-unsd')
// New file uses a separate dir to avoid cache mixing:
const tmpRoot  = path.join(process.cwd(), '.tmp-or-westmetro-school-unsd');
```

**DB pool pattern** (lines 57-65 — copy verbatim):
```typescript
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

**Download helper — copy verbatim** (lines 73-97): `downloadWithRedirects(url, destPath)` follows 301/302 redirects and skips download if file already exists on disk (cache).

**Zip extract helper — copy verbatim** (lines 104-116): `extractZip(zipPath, destDir)` uses AdmZip and returns a `cleanup()` that only deletes the destDir if it didn't pre-exist.

**Core flow — copy verbatim, Steps 1-4** (lines 127-184): create tmpRoot, download zip, extract, find .shp/.dbf, open shapefile, iterate features, filter on `props['GEOID']` against `TARGET_GEOIDS`, build `districtMap`.

**All-N-found assert** (lines 187-194 — copy verbatim, EXPECTED_COUNT now 5):
```typescript
if (districtMap.size !== EXPECTED_COUNT) {
  const foundGeoIds = Array.from(districtMap.keys());
  const missingGeoIds = Array.from(TARGET_GEOIDS.keys()).filter(g => !districtMap.has(g));
  console.error(`\nERROR: Expected ${EXPECTED_COUNT} GEOIDs, found ${districtMap.size}.`);
  console.error(`  Found:   ${foundGeoIds.join(', ')}`);
  console.error(`  Missing: ${missingGeoIds.join(', ')}`);
  process.exit(1);
}
```

**Insert SQL** (lines 210-219 — copy verbatim; SOURCE constant supplies `tiger_unsd_or_2024_westmetro`):
```typescript
await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES ($1, $2, $3, $4, $5,
    public.ST_ForcePolygonCCW(
      public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
    ),
    $7, now())
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]);
```

Note: `ocd_id` is set to `geoId` (same value as `geo_id`) — this is the established pattern for TIGER-sourced geofences.

**Post-insert verification query, Step 8** (lines 241-253 — copy verbatim; constants already changed above):
```typescript
const verify = await pool.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt
  FROM essentials.geofence_boundaries
  WHERE state = $1
    AND mtfcc = $2
    AND source = $3
`, [STATE, MTFCC, SOURCE]);
const total = parseInt(verify.rows[0].cnt, 10);
if (total !== EXPECTED_COUNT) {
  console.warn(`  WARNING: Expected ${EXPECTED_COUNT} rows in geofence_boundaries, found ${total}`);
} else {
  console.log(`  All ${EXPECTED_COUNT} OR school district boundaries loaded successfully.`);
}
```

**Fatal error handler + pool teardown** (lines 263-268 — copy verbatim):
```typescript
main()
  .catch((err) => {
    console.error('[load-or-westmetro-school-boundaries] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => void pool.end());
```

**Run commands:**
```
npx tsx scripts/load-or-westmetro-school-boundaries.ts --dry-run
npx tsx scripts/load-or-westmetro-school-boundaries.ts
```

---

### `scripts/smoke-or-westmetro-school.ts` (smoke test, request-response DB query)

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts`

**Imports pattern** (lines 17-19):
```typescript
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
```

**AddressTest interface** (lines 21-27 — copy verbatim, this interface shape drives all assertions):
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

**TEST_ADDRESSES constant — replace with 5 west-metro entries** (analog lines 30-60, new values from RESEARCH.md):
```typescript
const TEST_ADDRESSES: AddressTest[] = [
  {
    label: 'Beaverton City Hall (Beaverton SD 48J)',
    lon: -122.8011, lat: 45.4871,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4101920' },
  },
  {
    label: 'Hillsboro City Hall (Hillsboro SD 1J)',
    lon: -122.9898, lat: 45.5229,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4100023' },
  },
  {
    label: 'Tigard City Hall (Tigard-Tualatin SD 23J)',
    lon: -122.7714, lat: 45.4312,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4112240' },
  },
  {
    label: 'Forest Grove City Hall (Forest Grove SD 15)',
    lon: -123.1073, lat: 45.5195,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4105160' },
  },
  {
    label: 'Sherwood City Hall (Sherwood SD 88J)',
    lon: -122.8404, lat: 45.3565,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4111290' },
  },
];
```

Note: Coordinates are approximate city-hall locations from RESEARCH.md (Assumption A1 = LOW confidence). Executor must geocode before asserting. The critical check is `geo_id` match, not exact coordinate.

**Routing query function** (lines 63-77 — adapt from analog; filter to `mtfcc = 'G5420'` only):
```typescript
async function queryBoundaries(
  client: Client,
  lon: number,
  lat: number
): Promise<Array<{ geo_id: string; name: string; mtfcc: string }>> {
  const res = await client.query<{ geo_id: string; name: string; mtfcc: string }>(
    `SELECT geo_id, name, mtfcc
     FROM essentials.geofence_boundaries
     WHERE state = '41'
       AND mtfcc = 'G5420'
       AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     ORDER BY name`,
    [lon, lat],
  );
  return res.rows;
}
```

**Client setup + error guard** (lines 80-88 — copy verbatim):
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

**Count assertion block — add before address loop** (no direct analog; new per D-02):
```typescript
// Assert exactly 5 west-metro rows exist
const countRes = await client.query<{ cnt: string }>(
  `SELECT COUNT(*) AS cnt
   FROM essentials.geofence_boundaries
   WHERE state = '41'
     AND mtfcc = 'G5420'
     AND source = 'tiger_unsd_or_2024_westmetro'`
);
const wmCount = parseInt(countRes.rows[0].cnt, 10);
if (wmCount !== 5) {
  errors.push(`west-metro G5420 count: expected 5, got ${wmCount}`);
  allPassed = false;
}
console.log(`  West-metro G5420 count: ${wmCount} (expected 5)`);
```

**Address assertion loop** (lines 133-198 — copy verbatim; the `expectedGeoIds` check handles geo_id assertions):

The analog's assertion loop at lines 149-198 handles `expectedMtfcc`, `forbiddenMtfcc`, and `expectedGeoIds` checks uniformly. Copy it verbatim — the `TEST_ADDRESSES` entries above supply the correct `expectedGeoIds` values.

**Exit pattern** (lines 229-250 — copy verbatim, update SC labels to match Phase 174 criteria):
```typescript
if (allPassed) {
  console.log('ALL ASSERTIONS PASSED');
  process.exit(0);
} else {
  console.log(`FAILED (${errors.length} assertion(s)):`);
  for (const err of errors) console.log(`  - ${err}`);
  process.exit(1);
}
```

---

## Shared Patterns

### DB Connection (both files)

**Source:** `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` lines 57-65 and `smoke-or-geofences.ts` lines 80-88

The loader uses `Pool` (multiple queries); the smoke test uses `Client` (single session). Both use `ssl: { rejectUnauthorized: false }` and read `DATABASE_URL` from env. Both guard against missing `DATABASE_URL` before connecting.

### State FIPS in geofence_boundaries

**Source:** `load-or-school-boundaries.ts` line 33 comment

`geofence_boundaries.state` = `'41'` (numeric FIPS string). Never `'or'`. The `essentials.districts` table uses `state='or'` (lowercase) — different table, different convention. The smoke test routing query (`WHERE state = '41'`) must match this.

### Idempotency Guard

**Source:** `load-or-school-boundaries.ts` lines 218

```sql
ON CONFLICT (geo_id, mtfcc) DO NOTHING
```

Safe re-runs. The `ON CONFLICT` target is `(geo_id, mtfcc)` — both columns together form the unique key.

### No schema_migrations Registration

**Source:** `load-or-school-boundaries.ts` (full file — no `INSERT INTO schema_migrations` anywhere)

The loader writes via its own `pg.Pool` directly. Zero migration entries created. The on-disk migration file counter is NOT bumped by this phase. Per v10.0 precedent, this is correct.

---

## Section-Split Scan SQL (verification analog, not a new file)

These are the 5 SQL gates from RESEARCH.md that the planner must include as inline verification steps. They are not in any existing file — they are new inline SQL for this phase.

**Gate 1 — No duplicates in west-metro batch:**
```sql
SELECT geo_id, COUNT(*) AS cnt
FROM essentials.geofence_boundaries
WHERE state = '41' AND mtfcc = 'G5420' AND source = 'tiger_unsd_or_2024_westmetro'
GROUP BY geo_id HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

**Gate 2 — Exactly 5 rows inserted:**
```sql
SELECT COUNT(*) AS westmetro_count
FROM essentials.geofence_boundaries
WHERE state = '41' AND mtfcc = 'G5420' AND source = 'tiger_unsd_or_2024_westmetro';
-- Expected: 5
```

**Gate 3 — Multnomah 6 rows untouched:**
```sql
SELECT COUNT(*) AS multnomah_count
FROM essentials.geofence_boundaries
WHERE state = '41' AND mtfcc = 'G5420' AND source = 'tiger_unsd_or_2024';
-- Expected: 6
```

**Gate 4 — All geometries valid:**
```sql
SELECT COUNT(*) AS invalid_count
FROM essentials.geofence_boundaries
WHERE state = '41' AND mtfcc = 'G5420' AND source = 'tiger_unsd_or_2024_westmetro'
  AND (geometry IS NULL OR NOT ST_IsValid(geometry));
-- Expected: 0
```

**Gate 5 — Sentinel row check:**
```sql
SELECT geo_id, name, mtfcc, source
FROM essentials.geofence_boundaries
WHERE state = '41' AND geo_id = '4101920';
-- Expected: 1 row, name='Beaverton School District 48J', mtfcc='G5420'
```

---

## No Analog Found

None. Both new files have strong analogs.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 3 analog files read in full (`load-or-school-boundaries.ts` 269 lines, `smoke-or-geofences.ts` 251 lines); RESEARCH.md and CONTEXT.md read for context
**Pattern extraction date:** 2026-06-30
