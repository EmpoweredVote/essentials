# Phase 162: City of Las Vegas Deep-Seed - Pattern Map

**Mapped:** 2026-06-27
**Files analyzed:** 5 new/modified files
**Analogs found:** 5 / 5

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts` | utility (geofence loader) | file-I/O + request-response | `scripts/load-dc-ward-boundaries.ts` | role-match (ArcGIS JSON vs GeoJSON; same pool/fetch/insert shape) |
| `C:/EV-Accounts/backend/migrations/1064_las_vegas_city_council.sql` | migration (structural) | CRUD | `migrations/1055_clark_county_commission.sql` | exact (same standalone-government shape; adds two district types instead of one) |
| `C:/EV-Accounts/backend/scripts/_tmp-lv-city-council-headshots.py` | utility (headshot pipeline) | file-I/O | `scripts/_tmp-clark-county-commission-headshots.py` | exact (Azure blob source instead of AEM; no WAF, plain requests.get) |
| `C:/EV-Accounts/backend/migrations/1065_las_vegas_city_council_headshots.sql` (+ 1066-1072 stance migrations) | migration (audit-only) | CRUD | `migrations/1056_clark_county_commission_headshots.sql` + `1057_clark_county_commission_naft_stances.sql` | exact |
| `C:\Transparent Motivations\essentials\src\lib\coverage.js` | config | transform | Same file — existing `COVERAGE_STATES` Virginia block (lines 177-183) | exact (NV block inserted after VA, before closing `];`) |

---

## Pattern Assignments

---

### `scripts/load-lv-ward-boundaries.ts` (utility, geofence loader)

**Analog:** `C:/EV-Accounts/backend/scripts/load-dc-ward-boundaries.ts`

**Key structural difference from DC analog:** The DC script requests GeoJSON via `f=geojson` and gets `feature.geometry` as ready GeoJSON. The LV MapServer must be requested with `f=json` (not `f=geojson`) — it returns ArcGIS JSON with `feature.geometry.rings` (a `number[][][]`). Convert rings to GeoJSON Polygon before passing to `ST_GeomFromGeoJSON`. The DC script also inserts into `geo_districts` — **LV does NOT need `geo_districts`**; it only inserts into `essentials.geofence_boundaries`.

**Imports + DB pool pattern** (lines 27-57 of load-dc-ward-boundaries.ts):
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

**Config constants pattern** (lines 34-45 of load-dc-ward-boundaries.ts, adapted for LV):
```typescript
// LV adaptation — constants differ, structure identical
const LV_WARD_URL =
  'https://mapdata.lasvegasnevada.gov/clvgis/rest/services/' +
  'AdministrativeBoundaries/CityCouncilWards/MapServer/0/query' +
  '?where=1%3D1&outFields=CLV_WARDS.WARD&returnGeometry=true&f=json&outSR=4326';
  // CRITICAL: outSR=4326 required — LV MapServer default is WKID 3421 (state plane)
  // CRITICAL: f=json (NOT f=geojson) — returns ArcGIS JSON rings, not GeoJSON

const MTFCC          = 'X0015';
const STATE_CODE     = 'nv';    // CRITICAL: lowercase for LOCAL tier routing
const SOURCE         = 'lasvegasnevada.gov-gis-citcouncilwards-mapserver-2026';
const GEO_ID_PREFIX  = 'las-vegas-nv-council-ward-';
const EXPECTED_COUNT = 6;
const DRY_RUN        = process.argv.includes('--dry-run');
```

**fetchJson helper** (lines 61-79 of load-dc-ward-boundaries.ts — copy verbatim):
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

**ArcGIS JSON rings → GeoJSON conversion (NEW — not in DC analog):**
```typescript
// LV MapServer returns ArcGIS JSON: feature.geometry.rings is number[][][]
// Each ring is [lon, lat][] — pass directly as GeoJSON Polygon.coordinates
function arcgisRingsToGeoJson(rings: number[][][]): string {
  return JSON.stringify({ type: 'Polygon', coordinates: rings });
}
// Then in DB: ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
// Note: Wards 4/5/6 have 21-30 rings (enclaves + holes). Direct GeoJSON Polygon
// conversion is correct; ST_Multi wraps for multi-body cases.
```

**DB INSERT pattern** (adapted from import-greene-county-geofence.ts lines 21-27 + load-dc-ward-boundaries.ts lines 144-157):
```typescript
// geofence_boundaries INSERT (LV uses id column + ST_Multi; no geo_districts needed)
const result = await pool.query(
  `INSERT INTO essentials.geofence_boundaries
     (id, geo_id, mtfcc, state, name, geometry, source)
   VALUES (gen_random_uuid(), $1, 'X0015', 'nv', $2,
     public.ST_Multi(public.ST_SetSRID(public.ST_GeomFromGeoJSON($3), 4326)),
     $4)
   ON CONFLICT (geo_id, mtfcc) DO NOTHING
   RETURNING public.ST_GeometryType(geometry) AS gtype, public.ST_IsValid(geometry) AS valid`,
  [geoId, wardName, geomJson, SOURCE]
);
// Assert ST_IsValid = true in the RETURNING clause; if false, apply ST_MakeValid
```

**Ward attribute extraction (LV-specific — ArcGIS JSON field name):**
```typescript
// ArcGIS JSON response shape from LV MapServer (f=json):
// { features: [{ attributes: { WARD: 1, ... }, geometry: { rings: number[][][] } }] }
const response = await fetchJson(LV_WARD_URL) as {
  features: Array<{
    attributes: { WARD: number; [key: string]: unknown };
    geometry: { rings: number[][][] };
  }>;
};
// Ward number is in feature.attributes.WARD (integer 1-6)
// geo_id = `${GEO_ID_PREFIX}${ward}` = 'las-vegas-nv-council-ward-1' etc.
```

**Error handling + summary pattern** (lines 127-186 of load-dc-ward-boundaries.ts — mirror structure):
```typescript
if (wardMap.size !== EXPECTED_COUNT) {
  console.error(`ERROR: expected ${EXPECTED_COUNT} wards, got ${wardMap.size}. Aborting.`);
  process.exit(1);
}
// After all inserts:
console.log(`\nVerify with:`);
console.log(`  SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state='nv' AND mtfcc='X0015'; -- expect 6`);
// Wrap with: main().catch((err) => { console.error('[load-lv-ward-boundaries] Fatal error:', err); process.exit(1); });
```

---

### `migrations/1064_las_vegas_city_council.sql` (migration, structural)

**Analog:** `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql`

**Step-by-step diff from Phase 161 (county) to Phase 162 (city):**

| Step | Phase 161 (County) | Phase 162 (City) — changes |
|---|---|---|
| Government row | `'Clark County, Nevada, US'`, `type='County'`, `geo_id='32003'` | `'City of Las Vegas, Nevada, US'`, `type='City'`, `geo_id='3240000'` |
| Chamber name | `'Board of County Commissioners'` | `'Las Vegas City Council'` |
| District types | 1 × COUNTY on `geo_id='32003'` | 1 × LOCAL_EXEC on `geo_id='3240000'` (Mayor) + 6 × LOCAL on `geo_id='las-vegas-nv-council-ward-N'` (ward members) |
| Office blocks | 7 blocks all using `d.geo_id='32003'` and `d.district_type='COUNTY'` | Block 1 uses `d.geo_id='3240000'` and `d.district_type='LOCAL_EXEC'`; Blocks 2-7 each use `d.geo_id='las-vegas-nv-council-ward-N'` and `d.district_type='LOCAL'` |
| office_id back-fill | `BETWEEN -3200307 AND -3200301` | `BETWEEN -3205007 AND -3205001` |
| Migration ledger | `('1055', 'clark_county_commission')` | `('1064', 'las_vegas_city_council')` |

**Pre-flight pattern** (lines 37-43 of 1055_clark_county_commission.sql, adapt for LV + add ward geofence assertion):
```sql
-- Pre-flight: Raise NOTICE if government already exists (idempotency guard)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Las Vegas, Nevada, US') > 0 THEN
    RAISE NOTICE 'Las Vegas city government row already exists — idempotent re-run';
  END IF;
  -- Assert ward geofences exist (must be loaded by load-lv-ward-boundaries.ts first)
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'nv' AND mtfcc = 'X0015') < 6 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 6 X0015 ward geofences found. Run load-lv-ward-boundaries.ts first.';
  END IF;
END $$;
```

**Step 1 — Government INSERT** (lines 52-59 of 1055, adapted):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Las Vegas, Nevada, US',
       'City', 'NV', NULL, '3240000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Las Vegas, Nevada, US'
);
-- CRITICAL: governments has NO unique constraint on geo_id — WHERE NOT EXISTS is mandatory
```

**Step 2 — Chamber INSERT** (lines 67-77 of 1055, adapted):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'Las Vegas City Council',
       'Las Vegas City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Las Vegas, Nevada, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Las Vegas City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Las Vegas, Nevada, US')
);
-- CRITICAL: the auto-generated path column (slug) is GENERATED ALWAYS — never include in INSERT list
```

**Step 3a — LOCAL_EXEC district for Mayor** (adapted from 1055 line 86-91):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3240000', 'City of Las Vegas', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3240000' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);
-- CRITICAL: state='nv' lowercase — 'NV' uppercase matches ZERO routing rows (silent no-op)
-- Uses existing G4110 geofence loaded by Phase 158 (no new geofence insert needed for Mayor)
```

**Step 3b — LOCAL districts for each ward** (6 separate inserts, same shape):
```sql
-- Ward 1 — repeat for wards 2-6 with geo_id='las-vegas-nv-council-ward-N'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'las-vegas-nv-council-ward-1', 'Ward 1', 'X0015'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'las-vegas-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv'
);
```

**Step 4 — Mayor politician + office (BLOCK 1)** (lines 106-135 of 1055, adapted):
```sql
-- BLOCK 1: Mayor Shelley Berkley (-3205001) [directly elected, NOT rotational]
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Shelley Berkley', 'Shelley', 'Berkley', 'Democratic',
          true, false, false, true, -3205001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Las Vegas City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Las Vegas, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3240000'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- CRITICAL: district_type='LOCAL_EXEC' (NOT 'COUNTY', NOT 'LOCAL') for the Mayor
-- CRITICAL: d.state='nv' lowercase (routing join key)
-- CRITICAL: representing_state='NV' uppercase (free-text label, different column)
```

**Step 4 — Ward member politician + office (BLOCKS 2-7)** (same shape, different district_type):
```sql
-- BLOCK 2: Ward 1 Brian Knudsen (-3205002) [Mayor Pro Tem]
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Brian Knudsen', 'Brian', 'Knudsen', 'Non-Partisan',
          true, false, false, true, -3205002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Las Vegas City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Las Vegas, Nevada, US')),
       p.id,
       'Council Member, Ward 1', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'las-vegas-nv-council-ward-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Kara Kelley (Ward 2, -3205003): is_appointed=true (appointed Sept 2025 to fill vacancy)
-- Olivia Diaz (Ward 3, -3205004): title='Council Member, Ward 3'
-- Francis Allen-Palenske (Ward 4, -3205005), Shondra Summers-Armstrong (Ward 5, -3205006),
-- Nancy Brune (Ward 6, -3205007): same pattern, each on their ward's geo_id
```

**Step 5 — office_id back-fill** (lines 334-339 of 1055, adapted):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3205007 AND -3205001
  AND p.office_id IS NULL;
```

**Step 6 — Post-verification DO block** (lines 348-393 of 1055, adapted for 2 district types):
```sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_exec_count INTEGER;
  v_local_count INTEGER;
  v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Las Vegas, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 LV government row, found %', v_gov_count;
  END IF;

  -- Exactly 1 LOCAL_EXEC office (Mayor)
  SELECT COUNT(*) INTO v_exec_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3240000' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'nv';
  IF v_exec_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 LOCAL_EXEC office, found %', v_exec_count;
  END IF;

  -- Exactly 6 LOCAL offices (ward members)
  SELECT COUNT(*) INTO v_local_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.mtfcc = 'X0015' AND d.district_type = 'LOCAL' AND d.state = 'nv';
  IF v_local_count <> 6 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 6 LOCAL ward offices, found %', v_local_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, exec=%, local=%', v_gov_count, v_exec_count, v_local_count;
END $$;

COMMIT;

-- Migration ledger registration (OUTSIDE transaction — structural only)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1064', 'las_vegas_city_council')
ON CONFLICT (version) DO NOTHING;
```

---

### `scripts/_tmp-lv-city-council-headshots.py` (utility, headshot pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-clark-county-commission-headshots.py`

**Key difference from Phase 161:** Source is Azure Blob Storage (`sawebfilesprod001.blob.core.windows.net`) — no WAF, no AEM, no special User-Agent. Plain `requests.get()`. No fallback registry needed (all 7 URLs verified HTTP 200). The `crop_to_4_5`, `resize_600x750`, `process_headshot_bytes`, `upload_to_storage`, `resolve_politician_id` functions copy verbatim from the Clark County script.

**Config block** (adapted from lines 60-133 of _tmp-clark-county-commission-headshots.py):
```python
# Roster — 7 LV City Council members (Mayor + 6 ward seats)
# ext_ids: -3205001 (Berkley/Mayor) .. -3205007 (Brune/Ward 6)
# Source: Azure Blob Storage (DNN CMS) — no WAF, plain requests.get()

OFFICIALS = [
  {'ext_id': -3205001, 'name': 'Shelley Berkley',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/council/Mayor/Las_Vegas_Mayor_Shelley_Berkley_app_June-23-2025-600x800.jpg'},
  {'ext_id': -3205002, 'name': 'Brian Knudsen',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Knudsen-Headshot.jpg'},
  {'ext_id': -3205003, 'name': 'Kara Kelley',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Kara_Kelley-Sept-2025-600x800.jpg'},
  {'ext_id': -3205004, 'name': 'Olivia Diaz',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Olivia_Diaz_Portrait-600x400.jpg'},
  # Diaz is LANDSCAPE 600x400 — crop_to_4_5 handles: detects current_ratio 1.5 > 0.8
  # → center-crop width to int(400*0.8)=320 → 320x400 → resize 600x750 (~1.875x upscale)
  {'ext_id': -3205005, 'name': 'Francis Allen-Palenske',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/council/Ward_4_2019/Francis_Allen-Palenske_Dec-2022-600x800.jpg'},
  {'ext_id': -3205006, 'name': 'Shondra Summers-Armstrong',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Shondra_Summers-Armstrong-2024-600x800.jpg'},
  {'ext_id': -3205007, 'name': 'Nancy Brune',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Nancy_Brune%2025%20RGB.jpg'},
  # Nancy Brune URL has %20 encoded spaces — requests.get() handles this transparently
]

assert len(OFFICIALS) == 7
assert len({m['ext_id'] for m in OFFICIALS}) == 7
assert all(-3205007 <= m['ext_id'] <= -3205001 for m in OFFICIALS)

DEFAULT_LICENSE = 'us_government_work'  # City of Las Vegas DNN CMS official portraits
# No FALLBACKS dict needed — all 7 verified HTTP 200 from Azure Blob (no WAF)
# If any URL fails at runtime: SKIP + emit FAILED manifest line (no fabrication)
```

**Env-load + DB connect block** (lines 105-137 of Clark County script — copy verbatim):
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            _env[k.strip()] = v.strip()

SUPABASE_URL     = _env.get('SUPABASE_URL', '')
SERVICE_KEY      = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL     = _env.get('DATABASE_URL', '')
BUCKET           = 'politician_photos'
CDN_BASE         = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'
TARGET_SIZE      = (600, 750)
JPEG_QUALITY     = 90
RESAMPLE         = Image.Resampling.LANCZOS
```

**Functions to copy verbatim from Clark County script:**
- `resolve_politician_id(cursor, external_id)` — lines 143-152
- `download_image(url)` — lines 155-175 (remove wikimedia branch; no wikimedia needed for LV)
- `crop_to_4_5(img)` — lines 178-205 (critical: handles landscape Diaz image correctly)
- `resize_600x750(img)` — lines 208-212
- `upload_to_storage(politician_uuid, jpeg_bytes)` — lines 215-234
- `process_headshot_bytes(raw_bytes)` — lines 237-252

**Manifest output line** (lines 360-366 of Clark County script — adapt label):
```python
print('=== LV CITY COUNCIL HEADSHOT MANIFEST ===')
# Each SUCCESS line: ext_id, uuid, cdn_url, license — consumed by migration 1065
```

**Orchestration note** (copy from lines 1-15 of Clark County script header):
The orchestrator runs this script inline (NOT the executor). The executor writes the file to disk. The orchestrator runs it after migration 1064 is applied (UUIDs minted by 1064). Each SUCCESS line carries `ext_id -> uuid -> cdn_url -> license` consumed by migration 1065.

---

### `migrations/1065_las_vegas_city_council_headshots.sql` (audit-only headshot migration)

**Analog:** `C:/EV-Accounts/backend/migrations/1056_clark_county_commission_headshots.sql`

**Pattern** (lines 1-24 of 1056, adapt for LV):
```sql
-- Migration 1065: Las Vegas City Council headshots (AUDIT-ONLY)
-- AUDIT-ONLY: NOT registered in the migration ledger; structural ledger stays at 1064.
-- Columns are exactly (id, politician_id, url, type, photo_license).
-- The removed image-origin column is intentionally absent. type='default'.
-- politician_id resolved by stable external_id (UUID minted by mig 1064). Idempotent via NOT EXISTS.
-- photo_license = 'us_government_work' (lasvegasnevada.gov DNN CMS official portraits).

-- Shelley Berkley (Mayor)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3205001),
       '<CDN_URL_FROM_MANIFEST>',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3205001)
);
-- Repeat for ext_ids -3205002 through -3205007 with their respective CDN URLs
-- CDN URL format: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg
```

---

### `migrations/1066-1072_las_vegas_*_stances.sql` (audit-only, one per official)

**Analog:** `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql`

**Full pattern** (lines 1-39 of 1057 — copy structure exactly):
```sql
-- Migration 1066: Las Vegas City Council stances - Shelley Berkley (Mayor) (AUDIT-ONLY)
-- AUDIT-ONLY: NOT registered in the migration ledger; structural ledger stays at 1064.
-- Evidence-only compass stances (CHAIRS model). 100% cited. Honest blanks (no defaults).
-- topic_id resolved LIVE by topic_key (is_live=true) — never hardcode topic UUIDs.
-- politician_id = <berkley-uuid> (external_id -3205001, minted by mig 1064).

BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    -- One row per evidence-backed stance; topic_key must be live in compass_topics
    ('<topic_key>'::text, <1-5>, '<evidence-based reasoning>', ARRAY['<url>']::text[]),
    -- ... evidence-only, 100% cited, honest blank = absent row ...
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

**Topic keys likely to have LV city-level evidence** (from Phase 161 pattern + LV policy landscape):
- `homelessness`, `homelessness-response` (camping ban, shelter capacity)
- `housing` (affordable housing, community housing fund)
- `public-safety-approach` (LVMPD oversight, crime)
- `transportation-priorities` (transit, BRT, cycling)
- `data-centers` (Switch expansion, sustainability standards)
- `local-immigration` (sanctuary/enforcement policy)
- `local-environment` (water conservation, SNWA)
- `cannabis-regulation` (NV legal cannabis, city zoning)
- `economic-development` (resort/casino economy, small business)

**For Mayor Berkley specifically** (former US House Rep 1999-2013): apply pre-tenure attribution rule — only use LV City Council record (Jan 2025-present) unless a topic has a recent public statement in her mayoral capacity that updates her position. Federal-era stances on `abortion`, `healthcare`, `immigration`, `taxes`, etc. may be available but require recent mayoral context to be attributable.

---

### `src/lib/coverage.js` (config, COVERAGE_STATES edit)

**Analog:** Same file, existing COVERAGE_STATES Virginia block (lines 177-183).

**Insertion point:** After the Virginia block (lines 177-183, closing `},`) and before the closing `];` of COVERAGE_STATES. Clark County is already in COVERAGE_COUNTIES at line 230 — do NOT add it here again.

**Pattern to copy** (Virginia block, lines 177-183 of coverage.js):
```javascript
  {
    name: 'Virginia', abbrev: 'VA',
    areas: [
      { label: 'Alexandria', browseGovernmentList: ['5101000', '51510'], browseStateAbbrev: 'VA', hasContext: true },
      { label: 'Falls Church', browseGovernmentList: ['5127200', '51610'], browseStateAbbrev: 'VA', hasContext: true },
    ],
  },
```

**New NV block to insert after Virginia** (alphabetical: NV between MO and OR is already filled; Nevada follows Virginia alphabetically in the current file order — insert after VA block):
```javascript
  {
    name: 'Nevada', abbrev: 'NV',
    areas: [
      { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    ],
  },
```

**geo_id note:** `3240000` is the TIGER G4110 place FIPS for City of Las Vegas, NV — confirmed by Phase 158 smoke test (SC2: `Las Vegas city | 3240000`). Additional NV cities (Henderson, North Las Vegas, Boulder City) will be added to this NV block in Phases 163-165.

**Browse verification link after edit:** `essentials.empowered.vote/results?browse_geo_id=3240000&browse_mtfcc=G4110`

---

## Shared Patterns

### Backend Routing — X0015 Catchall (NO CODE CHANGE NEEDED)

**Source:** `C:/EV-Accounts/backend/src/lib/essentialsService.ts` line 646 (confirmed by Grep)

```typescript
// Line 646 — X% catchall in essentialsService.ts (exact text):
OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))
```

X0015 is NOT in the exclusion list (`'X0001','X0002','X0003','X0004'`). It will be caught by the `X%` LIKE clause and routed to LOCAL districts automatically. **No backend code change needed for Phase 162.** Document this finding in Plan 1 so the executor does not attempt a backend edit.

### Casing Convention (applies to all SQL in this phase)

**Source:** Confirmed from Phase 158 Gate 5 + Phase 160 PATTERNS.md + verified in 1055_clark_county_commission.sql

```
districts.state         = 'nv'  (lowercase — routing join key)
governments.state       = 'NV'  (uppercase — table convention)
offices.representing_state = 'NV' (uppercase — free-text label)
geofence_boundaries.state = 'nv' (lowercase — set by TIGER loader / must match)
```

Mixing these up is the #1 silent failure mode: an uppercase 'NV' in a district WHERE clause returns 0 rows with no error.

### Migration Ledger Rule (applies to all migrations in this phase)

**Source:** Phase 161 PATTERNS.md + 1055_clark_county_commission.sql lines 401-403

Only the structural migration (1064) registers in `supabase_migrations.schema_migrations`. Audit-only migrations (1065 headshots, 1066-1072 stances) do NOT register — the ledger MAX stays at 1064 after the stance phase. The INSERT for ledger registration appears OUTSIDE the transaction `COMMIT` (after it), verbatim:
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1064', 'las_vegas_city_council')
ON CONFLICT (version) DO NOTHING;
```

### Headshot Pipeline Invariants (applies to headshot script + migration 1065)

**Source:** `_tmp-clark-county-commission-headshots.py` functions + `feedback_headshot_resize_no_distort.md` memory

1. CROP to 4:5 ratio FIRST — never stretch or resize before cropping
2. RESIZE to 600x750 Lanczos q90 (`optimize=True` strips EXIF)
3. Bucket is `politician_photos` (NOT `politician-headshots`)
4. Storage path: `{politician_uuid}-headshot.jpg`
5. `politician_images` columns: `(id, politician_id, url, type, photo_license)` — no `photo_origin_url` (column was removed)
6. `type='default'` on all headshot rows
7. UUID resolved at runtime from `external_id` via psycopg2 — never hardcode a UUID in the script

### Grep-Gate Forbidden Tokens (applies to all .sql migration files)

**Source:** Phase 159 identification, documented in RESEARCH.md §Pitfall 7

Automated plan-verify gates flag migrations containing these literal strings (including in comments):
- `slug` — use "the auto-generated path column" instead
- `photo_origin_url` — use "the removed image-origin column" instead
- `schema_migrations` — only acceptable in the actual INSERT statement, not in comments

---

## No Analog Found

All 5 files have close analogs. No files require greenfield patterns from RESEARCH.md.

The one genuinely new sub-pattern — **ArcGIS JSON rings → GeoJSON Polygon conversion** — has no standalone analog in the codebase (the DC loader requests true GeoJSON via `f=geojson`; the LV MapServer requires `f=json` returning rings). The conversion function (`arcgisRingsToGeoJson`) must be written fresh, but the surrounding scaffold (pool, fetchJson, INSERT, error handling) is copied from `load-dc-ward-boundaries.ts`.

---

## Key Identifiers (Wave-0 Probe Required to Confirm)

| Item | Proposed Value | Source | Wave-0 Probe |
|---|---|---|---|
| LV geo_id | `3240000` | Phase 158 smoke test SC2 | `SELECT geo_id FROM essentials.geofence_boundaries WHERE name ILIKE '%Las Vegas%' AND mtfcc='G4110'` |
| external_id block | `-3205001` .. `-3205007` | Collision analysis (RESEARCH.md §External_id) | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3205007 AND -3205001` — expect 0 |
| X0015 availability | Unused (no migration uses it) | RESEARCH.md §Custom MTFCC Registry | `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0015'` — expect 0 |
| Migration ledger MAX | 1063 or 1064 (memory says ~1064 parked) | 161-03-SUMMARY.md says MAX=1055 after 161; memory says ~1064 parked | `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations` |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/` + `C:/EV-Accounts/backend/migrations/` + `C:\Transparent Motivations\essentials\src\lib\coverage.js`
**Files scanned:** 5 analog files read in full
**Pattern extraction date:** 2026-06-27
