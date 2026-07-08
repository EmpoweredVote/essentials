# Phase 163: Henderson Deep-Seed - Pattern Map

**Mapped:** 2026-06-28
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts` | utility (geofence loader) | file-I/O + request-response | `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts` | exact (same ArcGIS JSON rings format, same pool/fetch/insert shape; 3 constant swaps + string-cast for WARD attribute) |
| `C:/EV-Accounts/backend/migrations/1084_henderson_city_council.sql` | migration (structural) | CRUD | `C:/EV-Accounts/backend/migrations/1075_las_vegas_city_council.sql` | exact (same standalone-government shape, same two-district-type pattern; 4 wards instead of 6, Roman numeral titles, different names/IDs) |
| `C:/EV-Accounts/backend/scripts/_tmp-henderson-council-headshots.py` | utility (headshot pipeline) | file-I/O | `C:/EV-Accounts/backend/scripts/_tmp-lv-city-council-headshots.py` | role-match (same crop/resize/upload pipeline; different OFFICIALS roster + per-member fallback sources instead of single Azure Blob source) |
| `C:/EV-Accounts/backend/migrations/1085_henderson_city_council_headshots.sql` (+ 1086-1090 stance migrations) | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/1076_las_vegas_city_council_headshots.sql` + `1077_las_vegas_berkley_stances.sql` | exact |
| `C:/Transparent Motivations/essentials/src/lib/coverage.js` | config | transform | Same file — existing Nevada block (lines 183-188) | exact (Henderson entry appended to existing NV `areas` array) |

---

## Pattern Assignments

---

### `scripts/load-henderson-ward-boundaries.ts` (utility, geofence loader)

**Analog:** `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts`

**Read first:** The entire LV loader (227 lines) — it is copied nearly verbatim. Only the constants block (lines 44-57) and the ward-attribute extraction (lines 126-141) change.

**Imports + DB pool pattern** (lines 37-69 of `load-lv-ward-boundaries.ts` — copy verbatim):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import * as https from 'https';
import * as http from 'http';

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

**Config constants block** (replaces lines 44-57 of `load-lv-ward-boundaries.ts`):
```typescript
// CRITICAL: resultRecordCount=100 required — Henderson default returns only 3 of 4 wards
// CRITICAL: outSR=4326 required — Henderson MapServer default CRS is projected
// CRITICAL: f=json (NOT f=geojson) — ArcGIS JSON rings, not GeoJSON
const HENDERSON_WARD_URL =
  'https://maps.cityofhenderson.com/arcgis/rest/services/public/' +
  'OpenDataAdministrativeBoundaries/MapServer/2/query' +
  '?where=1%3D1&outFields=WARD,WARDNAME,COUNCILMAN' +
  '&returnGeometry=true&f=json&outSR=4326' +
  '&resultOffset=0&resultRecordCount=100';

const MTFCC          = 'X0016';    // Wave-0 confirms this is unclaimed (next after X0015/LV)
const STATE_CODE     = 'nv';       // CRITICAL: lowercase for LOCAL-tier routing
const SOURCE         = 'cityofhenderson.com-arcgis-opendata-admin-boundaries-ward-2026';
const GEO_ID_PREFIX  = 'henderson-nv-council-ward-';
const EXPECTED_COUNT = 4;          // Henderson has 4 wards (LV had 6)

const DRY_RUN = process.argv.includes('--dry-run');
```

**fetchJson helper** (lines 73-91 of `load-lv-ward-boundaries.ts` — copy verbatim):
```typescript
function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
        catch (e) { reject(new Error(`JSON parse error: ${(e as Error).message}`)); }
      });
    }).on('error', reject);
  });
}
```

**arcgisRingsToGeoJson helper** (lines 93-100 of `load-lv-ward-boundaries.ts` — copy verbatim):
```typescript
function arcgisRingsToGeoJson(rings: number[][][]): string {
  return JSON.stringify({ type: 'Polygon', coordinates: rings });
}
```

**Ward-attribute extraction** (replaces lines 125-141 of `load-lv-ward-boundaries.ts`):
```typescript
// Henderson WARD attribute is esriFieldTypeString ("1".."4"), not integer.
// WARDNAME stores the Roman numeral display name ("WARD I".."WARD IV").
const attrs = feature.attributes || {};
const rawWard = attrs['WARD'] ?? attrs['WARDNAME'];
const ward = parseInt(String(rawWard ?? ''), 10);
if (isNaN(ward) || ward < 1 || ward > EXPECTED_COUNT) {
  console.warn(`  WARNING: WARD '${rawWard}' out of range — skipping`);
  continue;
}
const rings = feature.geometry?.rings;
if (!Array.isArray(rings) || rings.length === 0) {
  console.warn(`  WARNING: ward ${ward} has no rings — skipping`);
  continue;
}
const geoId = `${GEO_ID_PREFIX}${ward}`;
// wardName from WARDNAME field (e.g., "WARD I") — used as the geofence display name
const wardName = String(attrs['WARDNAME'] ?? `Ward ${ward}`);
wardMap.set(ward, { geoId, name: wardName, rings });
```

**DB INSERT pattern** (lines 162-209 of `load-lv-ward-boundaries.ts` — copy verbatim, MTFCC constant handles the substitution):
```typescript
const result = await pool.query(
  `INSERT INTO essentials.geofence_boundaries
     (id, geo_id, mtfcc, state, name, geometry, source)
   VALUES (gen_random_uuid(), $1, '${MTFCC}', '${STATE_CODE}', $2,
     public.ST_Multi(public.ST_SetSRID(public.ST_GeomFromGeoJSON($3), 4326)),
     $4)
   ON CONFLICT (geo_id, mtfcc) DO NOTHING
   RETURNING public.ST_GeometryType(geometry) AS gtype, public.ST_IsValid(geometry) AS valid`,
  [geoId, wardName, geomJson, SOURCE],
);
// Ward III (Cox) has 4 rings — ST_MakeValid fallback handles this identically to LV wards 4/5/6.
// EXPECTED_COUNT=4 assertion at line 146 is the first safety net.
```

**Summary verify statement** (adapt line 220 of `load-lv-ward-boundaries.ts`):
```typescript
console.log(`  SELECT COUNT(*), bool_and(public.ST_IsValid(geometry)) FROM essentials.geofence_boundaries WHERE state='nv' AND mtfcc='X0016'; -- expect (4, true)`);
```

**Error handler** (line 223-226 of `load-lv-ward-boundaries.ts` — copy verbatim, swap label):
```typescript
main().catch((err) => {
  console.error('[load-henderson-ward-boundaries] Fatal error:', err);
  process.exit(1);
});
```

---

### `migrations/1084_henderson_city_council.sql` (migration, structural)

**Analog:** `C:/EV-Accounts/backend/migrations/1075_las_vegas_city_council.sql`

**Read first:** The entire LV structural migration (459 lines). The Henderson migration follows the same 7-step skeleton; only names, IDs, ward counts, titles, and geo_ids change.

**Complete substitution map from LV (1075) to Henderson (1084):**

| LV (1075) | Henderson (1084) |
|-----------|-----------------|
| `'City of Las Vegas, Nevada, US'` | `'City of Henderson, Nevada, US'` |
| `geo_id='3240000'` (LV G4110) | `geo_id='3231900'` (Henderson G4110) |
| `'Las Vegas City Council'` | `'Henderson City Council'` |
| `official_count=7` | `official_count=5` |
| `mtfcc = 'X0015'` (pre-flight + districts) | `mtfcc = 'X0016'` |
| `< 6 X0015 ward geofences` | `< 4 X0016 ward geofences` |
| 6 LOCAL ward district INSERTs | 4 LOCAL ward district INSERTs |
| `'las-vegas-nv-council-ward-1'`..`'-6'` | `'henderson-nv-council-ward-1'`..`'-4'` |
| `'Ward 1'`..`'Ward 6'` (district labels) | `'Ward I'`..`'Ward IV'` (Roman numerals — official) |
| 7 politician+office blocks | 5 politician+office blocks |
| `-3205001` Shelley Berkley Mayor | `-3206001` Michelle Romero Mayor |
| `-3205002` Brian Knudsen Ward 1 | `-3206002` Jim Seebock Ward I |
| `-3205003` Kara Kelley Ward 2 (`is_appointed=true`) | `-3206003` Monica Larson Ward II (`is_appointed=false`) |
| `-3205004` Olivia Diaz Ward 3 | `-3206004` Carrie Cox Ward III (`is_active=true, is_incumbent=true` — seated despite June 2026 primary loss) |
| `-3205005` Francis Allen-Palenske Ward 4 | `-3206005` Dan H. Stewart Ward IV |
| `-3205006`, `-3205007` Wards 5-6 | (no equivalents — Henderson has only 4 wards) |
| `BETWEEN -3205007 AND -3205001` (back-fill) | `BETWEEN -3206005 AND -3206001` |
| `v_local_count <> 6` (Gate c) | `v_local_count <> 4` |
| `'1075', 'las_vegas_city_council'` (ledger) | `'1084', 'henderson_city_council'` |

**Pre-flight block** (lines 39-50 of `1075_las_vegas_city_council.sql` — adapt assertion counts):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Henderson, Nevada, US') > 0 THEN
    RAISE NOTICE 'City of Henderson government row already exists — idempotent re-run';
  END IF;

  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'nv' AND mtfcc = 'X0016') < 4 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 4 X0016 ward geofences — run load-henderson-ward-boundaries.ts first.';
  END IF;
END $$;
```

**Step 1 — Government INSERT** (lines 58-65 of `1075_las_vegas_city_council.sql`):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Henderson, Nevada, US',
       'City', 'NV', NULL, '3231900'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Henderson, Nevada, US'
);
-- CRITICAL: governments has NO unique constraint on geo_id — WHERE NOT EXISTS is mandatory
```

**Step 2 — Chamber INSERT** (lines 73-84 of `1075_las_vegas_city_council.sql`):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'Henderson City Council',
       'Henderson City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Henderson, Nevada, US'),
       5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Henderson City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Henderson, Nevada, US')
);
-- CRITICAL: the auto-generated path column is GENERATED ALWAYS — never include in INSERT list
```

**Step 3a — LOCAL_EXEC district for Mayor** (lines 92-97 of `1075_las_vegas_city_council.sql`):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3231900', 'City of Henderson', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3231900' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);
-- state='nv' LOWERCASE — uppercase 'NV' matches ZERO routing rows (silent no-op)
-- Uses Henderson G4110 geofence loaded by Phase 158 — no new geofence row needed
```

**Step 3b — LOCAL districts for each ward** (lines 103-143 of `1075_las_vegas_city_council.sql`, 4 wards instead of 6, Roman numeral labels):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'henderson-nv-council-ward-1', 'Ward I', 'X0016'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'henderson-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv'
);
-- Repeat for henderson-nv-council-ward-2 'Ward II', -ward-3 'Ward III', -ward-4 'Ward IV'
-- label uses Roman numerals (matches official Henderson WARDNAME field values)
-- geo_id slug uses Arabic numerals for programmatic consistency
```

**Step 4 — Mayor politician + office (BLOCK 1)** (lines 154-184 of `1075_las_vegas_city_council.sql`):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michelle Romero', 'Michelle', 'Romero', 'Non-Partisan',
          true, false, false, true, -3206001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Henderson City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Henderson, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3231900'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- CRITICAL: district_type='LOCAL_EXEC' (NOT 'LOCAL') for the Mayor
-- CRITICAL: d.state='nv' lowercase (routing join key)
-- CRITICAL: representing_state='NV' uppercase (offices table free-text label)
```

**Step 4 — Ward member politician + office (BLOCKS 2-5)** (lines 186-376 of `1075_las_vegas_city_council.sql`, 4 blocks instead of 6):
```sql
-- BLOCK 2: Jim Seebock (-3206002) Ward I
-- BLOCK 3: Monica Larson (-3206003) Ward II — is_appointed=false (elected Nov 2024)
-- BLOCK 4: Carrie Cox (-3206004) Ward III — is_active=true, is_incumbent=true
--           (seated incumbent despite June 2026 primary loss; leaves office Nov 2026)
-- BLOCK 5: Dan H. Stewart (-3206005) Ward IV

-- Example BLOCK 2 (copy LV BLOCK 2 shape, substituting Henderson values):
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jim Seebock', 'Jim', 'Seebock', 'Non-Partisan',
          true, false, false, true, -3206002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Henderson City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Henderson, Nevada, US')),
       p.id,
       'Council Member, Ward I', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'henderson-nv-council-ward-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Title uses Roman numeral 'Ward I' (not 'Ward 1') — Henderson official naming
```

**Step 5 — office_id back-fill** (lines 383-388 of `1075_las_vegas_city_council.sql`):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3206005 AND -3206001
  AND p.office_id IS NULL;
```

**Step 6 — Post-verification DO block** (lines 398-448 of `1075_las_vegas_city_council.sql`, adapted counts):
```sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_exec_count INTEGER;
  v_local_count INTEGER;
  v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Henderson, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Henderson government row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_exec_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3231900' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'nv';
  IF v_exec_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 LOCAL_EXEC Mayor office, found %', v_exec_count;
  END IF;

  SELECT COUNT(*) INTO v_local_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.mtfcc = 'X0016' AND d.district_type = 'LOCAL' AND d.state = 'nv';
  IF v_local_count <> 4 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 4 LOCAL ward offices, found %', v_local_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.state = 'nv'
    AND gb.mtfcc = 'X0016'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'LOCAL' AND d.state = 'nv'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan ward rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, exec=%, local=%, split_orphans=%',
    v_gov_count, v_exec_count, v_local_count, v_split_count;
END $$;

COMMIT;
```

**Step 7 — Migration ledger** (lines 456-458 of `1075_las_vegas_city_council.sql` — OUTSIDE the transaction):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1084', 'henderson_city_council')
ON CONFLICT (version) DO NOTHING;
```

---

### `scripts/_tmp-henderson-council-headshots.py` (utility, headshot pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-lv-city-council-headshots.py`

**Read first:** The entire LV headshot script (330 lines). All functions (lines 128-273) copy verbatim. Only the header docstring, OFFICIALS roster, guard assertions, and the manifest label change.

**Key difference from LV:** `cityofhenderson.com` is Akamai WAF-403 (blocks all UA including Chrome 126). There is no Azure Blob CDN equivalent. Each member requires a per-member fallback URL from campaign sites or news media. The `DEFAULT_LICENSE` will vary per member (set to `'press_use'` unless a verified government source is found).

**Config block** (replaces lines 63-116 of `_tmp-lv-city-council-headshots.py`):
```python
# Roster — 5 Henderson City Council members (Mayor + 4 ward seats)
# WAF NOTE: cityofhenderson.com is Akamai WAF-403 (all UA blocked).
# Do NOT attempt curl from cityofhenderson.com. Go directly to fallback sources.
# Fallback URLs confirmed/to-verify at Wave-0:
#   Romero:   Nevada Business Magazine portrait (200 OK confirmed 2026-06-28)
#   Seebock:  votejimseebock.com campaign portrait (200 OK confirmed 2026-06-28)
#   Larson:   votedrmonicalarson.com/about/ — Wave-0 verification required
#   Cox:      checktheboxforcarriecox.com or Ballotpedia — Wave-0 verification required
#   Stewart:  danstewartnv.com/about/ or Ballotpedia — Wave-0 verification required

OFFICIALS = [
    {'ext_id': -3206001, 'name': 'Michelle Romero',
     'url': 'https://nevadabusiness.com/wp-content/uploads/2025/04/MR-2023-Headshot-SR-scaled.jpeg',
     'license': 'press_use'},
    {'ext_id': -3206002, 'name': 'Jim Seebock',
     'url': 'https://votejimseebock.com/wp-content/themes/jim-seebock/images/jim_headshot_header.png',
     'license': 'press_use'},
    {'ext_id': -3206003, 'name': 'Monica Larson',
     'url': '<WAVE_0_VERIFY>',   # votedrmonicalarson.com/about/ or news source
     'license': 'press_use'},
    {'ext_id': -3206004, 'name': 'Carrie Cox',
     'url': '<WAVE_0_VERIFY>',   # checktheboxforcarriecox.com, Ballotpedia, or news
     'license': 'press_use'},
    {'ext_id': -3206005, 'name': 'Dan H. Stewart',
     'url': '<WAVE_0_VERIFY>',   # danstewartnv.com/about/ or Ballotpedia
     'license': 'press_use'},
]

assert len(OFFICIALS) == 5, f'Expected 5 council members, got {len(OFFICIALS)}'
assert len({m['ext_id'] for m in OFFICIALS}) == 5, 'external_ids must be unique'
assert all(-3206005 <= m['ext_id'] <= -3206001 for m in OFFICIALS), 'ext_id out of range'
```

**Env-load + DB connect block** (lines 92-116 of `_tmp-lv-city-council-headshots.py` — copy verbatim):
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            _env[k.strip()] = v.strip()

SUPABASE_URL = _env.get('SUPABASE_URL', '')
SERVICE_KEY = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL = _env.get('DATABASE_URL', '')
BUCKET = 'politician_photos'
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'

TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS
```

**Functions to copy verbatim** (from `_tmp-lv-city-council-headshots.py`):
- `resolve_politician_id(cursor, external_id)` — lines 128-137
- `download_image(url)` — lines 140-160 (no WAF workaround needed in the download function itself; fallback sourcing happens at the OFFICIALS roster level — by the time Wave-0 has populated URLs, they are all non-WAF sources)
- `crop_to_4_5(img)` — lines 163-190 (handles landscape sources correctly; Romero NVBiz JPEG is likely portrait-ish, but the function handles both)
- `resize_600x750(img)` — lines 193-197
- `upload_to_storage(politician_uuid, jpeg_bytes)` — lines 200-219
- `process_headshot_bytes(raw_bytes)` — lines 222-237
- `process_member(cursor, member)` — lines 240-273 (adapt `member['license']` from the per-member dict instead of using `DEFAULT_LICENSE`)

**Manifest label** (adapt line 315-316 of `_tmp-lv-city-council-headshots.py`):
```python
print('=== HENDERSON CITY COUNCIL HEADSHOT MANIFEST ===')
# Each SUCCESS line: ext_id, uuid, cdn_url, license — consumed by migration 1085
print(f'{len(successes)}/5 uploaded, {len(failures)} gaps')
```

**Orchestration note** (mirrors lines 9-16 of `_tmp-lv-city-council-headshots.py`):
This script is a gitignored `_tmp-*` helper. The executor writes it to disk; the inline orchestrator runs it after migration 1084 is applied (UUIDs minted by 1084). Each SUCCESS line carries `ext_id -> uuid -> cdn_url -> license`, consumed by migration 1085.

---

### `migrations/1085_henderson_city_council_headshots.sql` (audit-only, headshots)

**Analog:** `C:/EV-Accounts/backend/migrations/1076_las_vegas_city_council_headshots.sql`

**Read first:** Lines 1-97 of `1076_las_vegas_city_council_headshots.sql` (entire file).

**Pattern** (lines 17-28 of `1076_las_vegas_city_council_headshots.sql`, one block per member):
```sql
-- Migration 1085: Henderson City Council headshots (politician_images)
--
-- AUDIT-ONLY: NOT registered in the migration ledger; structural ledger stays at 1084.
-- Columns are exactly (id, politician_id, url, type, photo_license).
-- The removed image-origin column is intentionally absent. type='default'.
-- politician_id resolved by stable external_id. Idempotent via NOT EXISTS.
-- photo_license per member (set from Wave-0 headshot sourcing — likely 'press_use').

BEGIN;

-- -3206001 Michelle Romero (Mayor)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3206001),
       '<CDN_URL_FROM_MANIFEST>',
       'default', '<LICENSE_FROM_MANIFEST>'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3206001)
);
-- Repeat for ext_ids -3206002 through -3206005 with their respective CDN URLs and licenses
-- CDN URL format: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg
-- photo_license: set from the manifest SUCCESS line (likely 'press_use' for campaign/news sources)
```

---

### `migrations/1086-1090_henderson_*_stances.sql` (audit-only, one per official)

**Analog:** `C:/EV-Accounts/backend/migrations/1077_las_vegas_berkley_stances.sql`

**Read first:** Entire `1077_las_vegas_berkley_stances.sql` (42 lines) — the CTE shape copies verbatim.

**Full pattern** (lines 13-41 of `1077_las_vegas_berkley_stances.sql`):
```sql
-- Migration 1086: Henderson City Council stances - Michelle Romero (Mayor) (AUDIT-ONLY)
-- AUDIT-ONLY: NOT registered in the migration ledger; structural ledger stays at 1084.
-- Evidence-only compass stances (CHAIRS model). 100% cited. Honest blanks (no defaults).
-- topic_id resolved LIVE by topic_key (is_live=true) — never hardcode topic UUIDs.
-- politician_id = <romero-uuid> (external_id -3206001, minted by mig 1084).

BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    -- One row per evidence-backed stance only; absent row = honest blank (no value to use)
    ('<topic_key>'::text, <1-5>, '<evidence-based reasoning>', ARRAY['<url>']::text[]),
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct
    ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '<politician-uuid>'::uuid, topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
  SELECT '<politician-uuid>'::uuid, topic_id, reasoning, sources FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE
    SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
-- AUDIT-ONLY: no schema_migrations INSERT
```

**Per-file assignments:**
- `1086_henderson_romero_stances.sql` — Michelle Romero, ext_id -3206001 (Mayor)
- `1087_henderson_seebock_stances.sql` — Jim Seebock, ext_id -3206002 (Ward I; former LVMPD Deputy Chief — strong public-safety evidence expected)
- `1088_henderson_larson_stances.sql` — Monica Larson, ext_id -3206003 (Ward II; newly elected Nov 2024 — thinner record)
- `1089_henderson_cox_stances.sql` — Carrie Cox, ext_id -3206004 (Ward III; elected Nov 2022, honest blanks likely for recently-contested topics)
- `1090_henderson_stewart_stances.sql` — Dan H. Stewart, ext_id -3206005 (Ward IV; longest-serving since 2017 — most evidence available)

**Topic keys likely to have Henderson city-level evidence** (carry-forward from LV pattern, adjusted for Henderson):
- `homelessness` / `homelessness-response` (Henderson camping laws, shelter policy)
- `housing` (Henderson affordable housing, growth management)
- `public-safety-approach` (Henderson PD oversight; Seebock IS the former LVMPD Deputy Chief)
- `transportation-priorities` (Henderson transit, I-215 corridor)
- `economic-development` (Henderson tech corridor)
- `local-environment` (water conservation, HOA enforcement, desert climate)
- `local-immigration` (NV sanctuary debate; Clark County-wide posture)
- `growth-and-development` (Henderson fast-growing suburb)

---

### `src/lib/coverage.js` (config, COVERAGE_STATES edit)

**Analog:** Same file, existing Nevada block (lines 183-188).

**Read first:** Lines 183-188 of `src/lib/coverage.js` — the NV block to be edited.

**Current state** (lines 183-188 of `C:/Transparent Motivations/essentials/src/lib/coverage.js`):
```javascript
  {
    name: 'Nevada', abbrev: 'NV',
    areas: [
      { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    ],
  },
```

**After Phase 163 edit** (add Henderson entry to the existing `areas` array at line 186):
```javascript
  {
    name: 'Nevada', abbrev: 'NV',
    areas: [
      { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    ],
  },
```

**geo_id note:** `3231900` is the TIGER G4110 place FIPS for City of Henderson, NV — confirmed by Phase 158 smoke test SC2. `browseGovernmentList` uses the city geo_id (not the ward geo_ids).

**Browse verification link after edit:** `essentials.empowered.vote/results?browse_geo_id=3231900&browse_mtfcc=G4110`

---

## Shared Patterns

### Backend Routing — X0016 Catchall (NO CODE CHANGE NEEDED)

**Source:** `C:/EV-Accounts/backend/src/lib/essentialsService.ts` line 646 (confirmed in 162-PATTERNS.md)

```typescript
// Line 646 — X% catchall in essentialsService.ts:
OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))
```

X0016 is NOT in the exclusion list. It will be caught by the `X%` LIKE clause and routed to LOCAL districts automatically. No backend code change needed for Phase 163.

### Casing Convention (applies to all SQL in this phase)

**Source:** Confirmed in `1075_las_vegas_city_council.sql` lines 27-31 + shared pattern from 162-PATTERNS.md

```
districts.state            = 'nv'   (lowercase — routing join key; uppercase 'NV' = 0 rows)
governments.state          = 'NV'   (uppercase — governments table convention)
offices.representing_state = 'NV'   (uppercase — free-text label)
geofence_boundaries.state  = 'nv'   (lowercase — set by TIGER loader / ward loader)
```

### Migration Ledger Rule (applies to all migrations in this phase)

**Source:** `1075_las_vegas_city_council.sql` lines 450-458 + 162-PATTERNS.md §Migration Ledger Rule

Only the structural migration (1084) registers in `supabase_migrations.schema_migrations`. Audit-only migrations (1085 headshots, 1086-1090 stances) do NOT register — the ledger MAX stays at 1084 after the stance phase. The INSERT for ledger registration appears OUTSIDE the transaction COMMIT, verbatim:
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1084', 'henderson_city_council')
ON CONFLICT (version) DO NOTHING;
```

### Headshot Pipeline Invariants (applies to headshot script + migration 1085)

**Source:** `_tmp-lv-city-council-headshots.py` functions + `feedback_headshot_resize_no_distort.md` memory

1. CROP to 4:5 ratio FIRST (line 163-190 of LV headshot script) — never stretch or resize before cropping
2. RESIZE to 600x750 Lanczos q90, `optimize=True` strips EXIF (lines 193-197, 232-234)
3. Bucket is `politician_photos` (NOT `politician-headshots`) — line 104
4. Storage path: `{politician_uuid}-headshot.jpg` — line 207
5. `politician_images` columns: `(id, politician_id, url, type, photo_license)` — no `photo_origin_url` (removed column)
6. `type='default'` on all headshot rows
7. UUID resolved at runtime from `external_id` via psycopg2 (lines 128-137) — never hardcode a UUID in the script

### Grep-Gate Forbidden Tokens (applies to all .sql migration files)

**Source:** Phase 159 identification, carried through 162-PATTERNS.md

Automated plan-verify gates flag migrations containing these literal strings (including in comments):
- `slug` — paraphrase as "the auto-generated path column" instead
- `photo_origin_url` — paraphrase as "the removed image-origin column" instead
- `schema_migrations` — only acceptable in the actual INSERT statement, not in comments

### Wave-0 DB Probes Required Before Any Migration Applies

The following probes must run (inline orchestrator) before execution begins:

```sql
-- 1. Confirm Henderson G4110 geo_id casing
SELECT geo_id, state FROM essentials.geofence_boundaries
WHERE name ILIKE '%Henderson%' AND mtfcc = 'G4110';
-- Expect: geo_id='3231900', state='32' (TIGER loader uses FIPS string)

-- 2. Confirm X0016 is unclaimed
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc = 'X0016';
-- Expect: 0

-- 3. Confirm external_id block is unclaimed
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -3206005 AND -3206001;
-- Expect: 0

-- 4. Confirm on-disk migration MAX
SELECT MAX(version::int) FROM supabase_migrations.schema_migrations;
-- Expect: 1075 (structural ledger only; on-disk highest file is 1083)
```

---

## No Analog Found

All 5 files have direct analogs (Phase 162 LV is an exact match in structure). No files require greenfield patterns from RESEARCH.md.

The one Henderson-specific sub-pattern — **per-member fallback URL sourcing** (because `cityofhenderson.com` is Akamai WAF-403) — differs from LV's single-source Azure Blob approach, but the headshot pipeline code itself is identical; only the OFFICIALS roster configuration changes.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/` + `C:/EV-Accounts/backend/migrations/` + `C:/Transparent Motivations/essentials/src/lib/coverage.js`
**Files scanned:** 5 analog files read in full (load-lv-ward-boundaries.ts, 1075_las_vegas_city_council.sql, 1076_las_vegas_city_council_headshots.sql, 1077_las_vegas_berkley_stances.sql, _tmp-lv-city-council-headshots.py), plus coverage.js lines 183-188
**Pattern extraction date:** 2026-06-28
