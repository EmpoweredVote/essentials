# Phase 86: Multnomah County School Districts - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 4 new files
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `scripts/load-or-school-boundaries.ts` | script/loader | file-I/O + CRUD | `scripts/load-lausd-board-boundaries.ts` | role-match (different source: zip vs ArcGIS) |
| `migrations/253_or_school_districts.sql` | migration | CRUD | `migrations/246_multnomah_cities_government.sql` | exact (multi-body seed pattern) |
| `migrations/254_or_school_headshots.sql` | migration (audit-only) | CRUD | `migrations/247_multnomah_cities_headshots.sql` | exact |
| `scripts/smoke-multnomah-school.ts` | script/test | request-response | `scripts/smoke-multnomah-county.ts` | exact |

---

## Pattern Assignments

### `scripts/load-or-school-boundaries.ts` (loader, file-I/O + CRUD)

**Primary analog:** `C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts`
**Secondary analog (zip download + shapefile pattern):** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts`

**Key difference from LAUSD:** LAUSD fetches live GeoJSON from ArcGIS FeatureServer. OR school boundaries come from a TIGER zip file requiring download + AdmZip extraction + shapefile parse. Use the zip infrastructure from `load-state-tiger-boundaries.ts` combined with the LAUSD structure/pattern.

**Imports pattern** (from `load-lausd-board-boundaries.ts` lines 26-30 + `load-state-tiger-boundaries.ts` lines 19-26):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as shapefile from 'shapefile';
```

**Config block pattern** (adapted from `load-lausd-board-boundaries.ts` lines 31-45):
```typescript
const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_41_unsd.zip';
const MTFCC        = 'G5420';
const STATE        = '41';          // Oregon FIPS — contrast with LAUSD's '06'
const SOURCE       = 'tiger_unsd_or_2024';
const EXPECTED_COUNT = 6;

// geo_id = GEOID field value directly (e.g. '4110040') — NOT a slug like LAUSD's 'lausd-board-district-N'
const TARGET_GEOIDS = new Map<string, string>([
  ['4110040', 'Portland Public Schools'],
  ['4109480', 'Parkrose School District 3'],
  ['4110520', 'Reynolds School District 7'],
  ['4102800', 'Centennial School District 28J'],
  ['4103940', 'David Douglas School District 40'],
  ['4110560', 'Riverdale School District 51J'],
]);

const DRY_RUN = process.argv.includes('--dry-run');
```

**DB pool pattern** (from `load-lausd-board-boundaries.ts` lines 47-57):
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

**Zip download helper** (from `load-state-tiger-boundaries.ts` lines 317-341):
```typescript
function downloadWithRedirects(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath)) {
      return resolve();  // cache: skip if already downloaded
    }
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadWithRedirects(response.headers.location!, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`));
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}
```

**Zip extract helper** (from `load-state-tiger-boundaries.ts` lines 348-357):
```typescript
function extractZip(zipPath: string, destDir: string): { cleanup: () => void } {
  const dirExistedBefore = fs.existsSync(destDir);
  fs.mkdirSync(destDir, { recursive: true });
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
  return {
    cleanup: () => {
      if (!dirExistedBefore && fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
      }
    },
  };
}
```

**Temp-dir + download + extract flow** (from `load-state-tiger-boundaries.ts` lines 577-600):
```typescript
const tmpRoot = path.join(process.cwd(), '.tmp-or-school-unsd');
fs.mkdirSync(tmpRoot, { recursive: true });
const baseName = 'tl_2024_41_unsd';
const zipPath = path.join(tmpRoot, `${baseName}.zip`);
const destDir = path.join(tmpRoot, baseName);

console.log(`  Downloading ${TIGER_URL}`);
await downloadWithRedirects(TIGER_URL, zipPath);

console.log(`  Extracting ${baseName}.zip`);
const { cleanup } = extractZip(zipPath, destDir);

const entries = fs.readdirSync(destDir);
const shpFile = entries.find((e) => e.toLowerCase().endsWith('.shp'))!;
const dbfFile = entries.find((e) => e.toLowerCase().endsWith('.dbf'))!;
const shpPath = path.join(destDir, shpFile);
const dbfPath = path.join(destDir, dbfFile);
```

**Shapefile-read + GEOID filter pattern** (from `load-state-tiger-boundaries.ts` lines 367-376 + RESEARCH.md pattern):
```typescript
const source = await shapefile.open(shpPath, dbfPath, { encoding: 'utf-8' });
let result = await source.read();
while (!result.done) {
  const feature = result.value;
  const props = feature.properties as Record<string, unknown>;

  // TIGER 2024 UNSD field is 'GEOID' — confirmed by load-state-tiger-boundaries.ts LAYER_DISPATCH.unsd
  // On --dry-run first pass, log Object.keys(props) to verify field names
  const geoid = String(props['GEOID'] ?? '');
  if (!TARGET_GEOIDS.has(geoid)) {
    result = await source.read();
    continue;
  }
  const name = TARGET_GEOIDS.get(geoid)!;
  const geometryJson = JSON.stringify(feature.geometry);
  // ... insert
  result = await source.read();
}
```

**PostGIS insert pattern** (from `load-lausd-board-boundaries.ts` lines 162-172):
```typescript
const result = await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES ($1, $2, $3, $4, $5,
    public.ST_ForcePolygonCCW(
      public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
    ),
    $7, now())
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]);
// geo_id = ocd_id = GEOID string (e.g. '4110040') for TIGER UNSD
// Note: LAUSD used slug-based geo_ids; TIGER uses the numeric GEOID directly
```

**Post-insert verification gate** (from `load-lausd-board-boundaries.ts` lines 192-207):
```typescript
const verify = await pool.query(`
  SELECT COUNT(*) AS cnt
  FROM essentials.geofence_boundaries
  WHERE state = $1
    AND mtfcc = $2
    AND source = $3
`, [STATE, MTFCC, SOURCE]);
const total = parseInt(verify.rows[0].cnt, 10);
if (total !== EXPECTED_COUNT) {
  console.warn(`WARNING: Expected ${EXPECTED_COUNT} rows, found ${total}`);
} else {
  console.log(`All ${EXPECTED_COUNT} OR school district boundaries loaded successfully.`);
}
```

**Main function shell** (from `load-lausd-board-boundaries.ts` lines 86-89, 210-217):
```typescript
async function main() {
  console.log('[load-or-school-boundaries] Fetching OR UNSD boundaries');
  if (DRY_RUN) console.log('  DRY RUN — no DB writes');
  // ... steps
}

main()
  .catch((err) => {
    console.error('[load-or-school-boundaries] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => void pool.end());
```

---

### `migrations/253_or_school_districts.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql`

**File header comment pattern** (from `migrations/246_multnomah_cities_government.sql` lines 1-19):
```sql
-- Migration 253: OR school district government + chambers + SCHOOL districts + officials + offices
--
-- Purpose: Seeds 6 Multnomah County school districts:
--   Portland Public Schools  (geo_id='4110040') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   Parkrose School District  (geo_id='4109480') — 1 gov + 1 chamber + 1 SCHOOL district + 5 officials
--   Reynolds School District  (geo_id='4110520') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   Centennial School District (geo_id='4102800') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   David Douglas School District (geo_id='4103940') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   Riverdale School District (geo_id='4110560') — 1 gov + 1 chamber + 1 SCHOOL district + 5 officials
-- Totals: 6 governments, 6 chambers, 6 districts, 38 politicians, 38 offices
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'or' (lowercase) to match routing queries.
-- CRITICAL: governments.state = 'OR' (uppercase). offices.representing_state = 'OR' (uppercase).
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT').
-- CRITICAL: G5420 geofence_boundaries rows must exist BEFORE this migration runs (loaded by loader script).
```

**Pre-flight guard** (from `migrations/246_multnomah_cities_government.sql` lines 26-38):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name IN (
        'Portland Public Schools, Oregon, US',
        'Parkrose School District 3, Oregon, US',
        'Reynolds School District 7, Oregon, US',
        'Centennial School District 28J, Oregon, US',
        'David Douglas School District 40, Oregon, US',
        'Riverdale School District 51J, Oregon, US'
      )) > 0 THEN
    RAISE EXCEPTION 'Migration 253 already applied — aborting re-run';
  END IF;
END $$;
```

**Government row pattern** (from `migrations/246_multnomah_cities_government.sql` lines 48-56):
```sql
-- Step 1: Government row
-- type='LOCAL' matches school district type (same as cities per LAUSD pattern)
-- governments.state = 'OR' uppercase (governments convention)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Portland Public Schools, Oregon, US',
       'LOCAL', 'OR', NULL, '4110040'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Portland Public Schools, Oregon, US'
);
```

**Chamber row pattern** (from `migrations/244_multnomah_county_government.sql` lines 53-63 — slug GENERATED ALWAYS):
```sql
-- Step 2: Board of Education chamber
-- CRITICAL: slug is GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of Education',
       'Portland Public Schools Board of Education',
       (SELECT id FROM essentials.governments WHERE name = 'Portland Public Schools, Oregon, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Education'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Portland Public Schools, Oregon, US')
);
```

**SCHOOL district row pattern** (from RESEARCH.md Pattern 2):
```sql
-- Step 3: SCHOOL district row
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT')
-- CRITICAL: state='or' LOWERCASE — routing query joins on lowercase state
-- CRITICAL: mtfcc='G5420' must match the geofence_boundaries row
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4110040', 'Portland Public Schools', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4110040' AND district_type = 'SCHOOL' AND state = 'or'
);
```

**Politician + office CTE block pattern** (from `migrations/244_multnomah_county_government.sql` lines 90-119):
```sql
-- Step 4: Board member (one block per person)
-- party=NULL (antipartisan — D-11)
-- is_appointed=false, is_appointed_position=false (elected — D-12)
-- representing_state='OR' uppercase (offices convention)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Edward Wang', 'Edward', 'Wang', NULL,
          true, false, false, true, -860001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of Education'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Portland Public Schools, Oregon, US')),
       p.id,
       'Board Member (Zone 7)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4110040'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Office_id back-fill pattern** (from `migrations/244_multnomah_county_government.sql` lines 255-260):
```sql
-- AFTER all 38 politician+office blocks:
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -860055 AND -860001
  AND p.office_id IS NULL;
```

**Post-verification DO block pattern** (from `migrations/244_multnomah_county_government.sql` lines 269-314):
```sql
DO $$
DECLARE
  v_gov_count   INTEGER;
  v_off_count   INTEGER;
  v_split_count INTEGER;
  v_null_count  INTEGER;
BEGIN
  -- Gate (a): PPS government row = 1
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'Portland Public Schools, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: PPS gov_count=%, expected 1', v_gov_count;
  END IF;

  -- Gate (b): PPS offices = 7
  SELECT COUNT(*) INTO v_off_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4110040' AND d.district_type = 'SCHOOL' AND d.state = 'or';
  IF v_off_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: PPS office_count=%, expected 7', v_off_count;
  END IF;

  -- ... (repeat gate per district) ...

  -- Gate (c): section-split check — all 6 G5420 geo_ids must have SCHOOL district rows
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4110040','4109480','4110520','4102800','4103940','4110560')
    AND gb.mtfcc = 'G5420'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type = 'SCHOOL'
        AND d.state = 'or'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split returned % orphan rows', v_split_count;
  END IF;

  -- Gate (d): office_id back-fill complete
  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -860055 AND -860001
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id', v_null_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: all 6 district gates OK, section-split=0, office_id complete';
END $$;
```

**Migration ledger entry** (from `migrations/246_multnomah_cities_government.sql` lines 1422-1426):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('253')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `migrations/254_or_school_headshots.sql` (migration audit-only, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql`

**File header + safety guard** (from `migrations/247_multnomah_cities_headshots.sql` lines 1-25):
```sql
-- Migration 254: OR School District Board Member Headshots
-- AUDIT-ONLY: captures the live politician_images INSERTs performed during Phase 86-02
-- execution on [date].
-- DO NOT apply via Supabase ledger -- actual DB writes happened live via
-- scripts/_tmp-or-school-headshots.py (Python PIL + Supabase Storage API).
-- Pattern matches 247_multnomah_cities_headshots.sql / 245_multnomah_county_headshots.sql.
--
-- 38 officials documented across 6 districts:
--   PORTLAND PUBLIC SCHOOLS (7 officials, external_ids -860001..-860007): all have photos
--   PARKROSE (5 officials, external_ids -860011..-860015): all have photos
--   REYNOLDS (7 officials, external_ids -860021..-860027): all have photos (Drupal tokens)
--   CENTENNIAL (7 officials, external_ids -860031..-860037): all have photos
--   DAVID DOUGLAS (7 officials, external_ids -860041..-860047): all have photos (WordPress)
--   RIVERDALE (5 officials, external_ids -860051..-860055): all have photos (Finalsite)
--
-- Photo processing: crop 4:5 first, resize 600x750 Lanczos q90.
-- Storage bucket: politician_photos; path: {politician_id}-headshot.jpg.

-- Safety guard: this file is AUDIT-ONLY. Abort if run directly.
DO $$
BEGIN
  RAISE EXCEPTION 'Migration 254 is AUDIT-ONLY and must not be applied. Actual DB writes happened live.';
END $$;
```

**Headshot INSERT block per official** (from `migrations/247_multnomah_cities_headshots.sql` lines 33-41):
```sql
-- [Name] (-860001) — Board Member (Zone 7)
-- source: https://ppsnet.finalsite.com/fs/resource-manager/view/[UUID]
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -860001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -860001)
);
```

**"No photo found" comment pattern** (from `migrations/247_multnomah_cities_headshots.sql` lines 207-213):
```sql
-- [Name] (-860XXX) — [Title]
-- No photo found on official district website ([domain]).
-- No politician_images row inserted.
```

**Summary block pattern** (from `migrations/247_multnomah_cities_headshots.sql` lines 323-327):
```sql
-- =============== SUMMARY ===============
-- Total officials: 38
-- Headshots uploaded: [N] (PPS 7, Parkrose 5, Reynolds 7, Centennial 7, David Douglas 7, Riverdale 5)
-- No photo documented: [N]
-- =====================================
```

---

### `scripts/smoke-multnomah-school.ts` (test script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts`

**Imports + interface pattern** (from `smoke-multnomah-county.ts` lines 14-27):
```typescript
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

interface AddressTest {
  label: string;
  lon: number;
  lat: number;
  expectedMtfcc: string[];
  forbiddenMtfcc?: string[];
  expectedGeoIds?: Record<string, string>;
}
```

**Test address constants** (adapted from `smoke-multnomah-county.ts` lines 28-51):
```typescript
// SC3: Portland City Hall (-122.6794, 45.5231) must return PPS board members (7)
// SC4: Riverdale address (approx -122.6794, 45.4472) must return Riverdale board members (5)
//       and NOT PPS members (district isolation test)
const TEST_ADDRESSES: AddressTest[] = [
  {
    label: 'Portland City Hall (PPS zone)',
    lon: -122.6794,
    lat: 45.5231,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4110040' },
  },
  {
    label: 'Riverdale (SW Portland)',
    lon: -122.6794,
    lat: 45.4472,
    expectedMtfcc: ['G5420'],
    expectedGeoIds: { G5420: '4110560' },
  },
];
```

**DB client setup** (from `smoke-multnomah-county.ts` lines 98-106):
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

**SC1: G5420 geofence count query** (new, based on SC4 pattern in `smoke-multnomah-county.ts` lines 286-297):
```typescript
// SC1: Verify 6 G5420 rows loaded by load-or-school-boundaries.ts
const g5420Res = await client.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt
  FROM essentials.geofence_boundaries
  WHERE state = '41'
    AND mtfcc = 'G5420'
    AND source = 'tiger_unsd_or_2024'
`);
const g5420Count = parseInt(g5420Res.rows[0].cnt, 10);
if (g5420Count !== 6) {
  // fail
}
```

**SC2: SCHOOL district rows count query** (adapted from RESEARCH.md smoke pattern):
```typescript
// SC2: Verify 6 SCHOOL district rows in essentials.districts
const schoolDistRes = await client.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt
  FROM essentials.districts
  WHERE district_type = 'SCHOOL'
    AND state = 'or'
    AND geo_id IN ('4110040','4109480','4110520','4102800','4103940','4110560')
`);
```

**SC3: SCHOOL officials point-in-polygon query** (from RESEARCH.md smoke pattern):
```typescript
// SC3: Portland City Hall must return >= 7 SCHOOL officials
async function querySchoolOfficials(client: Client, lon: number, lat: number) {
  const res = await client.query<{ full_name: string; geo_id: string; district_type: string }>(`
    SELECT p.full_name, d.geo_id, d.district_type
    FROM essentials.politicians p
    JOIN essentials.offices o ON o.politician_id = p.id
    JOIN essentials.districts d ON d.id = o.district_id
    JOIN essentials.geofence_boundaries gb ON gb.geo_id = d.geo_id
    WHERE gb.state = '41'
      AND d.district_type = 'SCHOOL'
      AND gb.mtfcc = 'G5420'
      AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
    ORDER BY p.full_name
  `, [lon, lat]);
  return res.rows;
}
```

**Section-split check query** (from `smoke-multnomah-county.ts` lines 286-297):
```typescript
// SC5: Section-split check — all 6 G5420 geo_ids must have SCHOOL district rows
const splitRes = await client.query<{ geo_id: string }>(`
  SELECT gb.geo_id
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4110040','4109480','4110520','4102800','4103940','4110560')
    AND gb.mtfcc = 'G5420'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type = 'SCHOOL'
        AND d.state = 'or'
    )
`);
```

**Error accumulator + exit pattern** (from `smoke-multnomah-county.ts` lines 108-110, 314-329):
```typescript
let allPassed = true;
const errors: string[] = [];

// ... tests, pushing to errors[] on failure ...

try {
  // all assertions
} finally {
  await client.end();
}

console.log('\n=== Smoke Test Results ===');
if (allPassed) {
  console.log('ALL ASSERTIONS PASSED');
  process.exit(0);
} else {
  console.log(`FAILED (${errors.length} assertion(s)):`);
  for (const err of errors) console.log(`  - ${err}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
```

---

## Shared Patterns

### State conventions (critical for OR migrations)
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 15-19
**Apply to:** Migration 253 — every table that stores state
```
- governments.state      = 'OR'  (UPPERCASE)
- offices.representing_state = 'OR'  (UPPERCASE)
- districts.state        = 'or'  (lowercase) — routing query uses geocoder output which is lowercase
- geofence_boundaries.state = '41'  (FIPS code, set by loader)
```

### WHERE NOT EXISTS guard on governments
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 39-46
**Apply to:** All 6 government rows in migration 253
No unique constraint on `essentials.governments.geo_id`. Cannot use ON CONFLICT. Must use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = ...)`.

### ON CONFLICT (external_id) DO NOTHING for politicians
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 92-97
**Apply to:** All 38 politician INSERT blocks in migration 253
```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
```
Note: 244 uses DO NOTHING; 246 uses `DO UPDATE SET is_active = EXCLUDED.is_active`. For school board members, DO NOTHING is correct (new external_ids not yet in DB).

### Slug GENERATED ALWAYS on chambers
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` line 14
**Apply to:** All 6 chamber INSERT blocks in migration 253
Never include `slug` in the INSERT column list for `essentials.chambers`.

### geofence INSERT geometry expression
**Source:** `C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts` lines 165-169
**Apply to:** `load-or-school-boundaries.ts` insert statement
```sql
public.ST_ForcePolygonCCW(
  public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
)
```

### politician_images.type = 'default'
**Source:** `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` line 38
**Apply to:** All INSERT blocks in migration 254
UI filters with `.find(img => img.type === 'default')`. Using any other type causes silent invisibility.

### Audit-only headshot migration safety guard
**Source:** `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` lines 22-25
**Apply to:** Migration 254 (first statement in file)
```sql
DO $$ BEGIN
  RAISE EXCEPTION 'Migration 254 is AUDIT-ONLY and must not be applied.';
END $$;
```

### External_id range for Phase 86
**Apply to:** All politician blocks in migration 253 and headshot lookups in migration 254
```
PPS:           -860001 to -860007  (7 members)
Parkrose:      -860011 to -860015  (5 members)
Reynolds:      -860021 to -860027  (7 members)
Centennial:    -860031 to -860037  (7 members)
David Douglas: -860041 to -860047  (7 members)
Riverdale:     -860051 to -860055  (5 members)
```

### Unicode names in SQL
**Source:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` lines 723-729 (apostrophe escape pattern)
**Apply to:** Reynolds members with ñ (Aaron Muñoz, Ana Gonzalez Muñoz) and David Douglas (José Gamero-Georgeson with é)
Save migration SQL as UTF-8. Apostrophes escaped as doubled `''`. Unicode ñ/é written directly as UTF-8 characters.

---

## No Analog Found

All 4 files have close analogs. No files are without a match.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`, `C:/EV-Accounts/backend/migrations/`
**Files read:** 6 (load-lausd-board-boundaries.ts, load-state-tiger-boundaries.ts, 244_multnomah_county_government.sql, 246_multnomah_cities_government.sql, 247_multnomah_cities_headshots.sql, smoke-multnomah-county.ts)
**Pattern extraction date:** 2026-06-01
