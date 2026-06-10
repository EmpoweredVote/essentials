# Phase 108: Boston Deep Seed - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 5 new files (1 loader script + 3 SQL migrations + N apply-migration scripts)
**Analogs found:** 5 / 5

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-boston-council-boundaries.ts` | utility/loader | file-I/O + request-response (ArcGIS fetch → DB write) | `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts` | exact |
| `C:/EV-Accounts/backend/migrations/347_boston_government.sql` | migration | CRUD (government + chambers + districts + politicians + offices) | `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` | exact |
| `C:/EV-Accounts/backend/migrations/348_boston_school_committee.sql` | migration | CRUD (G5420 geofence + government + chamber + SCHOOL district + officials) | `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` | exact |
| `C:/EV-Accounts/backend/migrations/349_boston_headshots.sql` | migration | CRUD (politician_images INSERT per politician) | `C:/EV-Accounts/backend/migrations/315_va_headshots.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_apply-migration-{N}.ts` (one per migration) | utility/script | request-response (read SQL file → execute → smoke test) | `C:/EV-Accounts/backend/scripts/_apply-migration-325.ts` | exact |

---

## Pattern Assignments

### `load-boston-council-boundaries.ts` (utility/loader, ArcGIS fetch → DB write)

**Analog:** `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts`

**Header comment block** (lines 1-51):
```typescript
/**
 * load-boston-council-boundaries.ts
 *
 * Fetches 9 City of Boston City Council district boundaries from the City's
 * ArcGIS FeatureServer and inserts them into essentials.geofence_boundaries.
 *
 * Source: https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/
 *         CityCouncilDistricts_2023_5_25/FeatureServer/0/query
 * Boundaries: 2023-2032 (effective 2023 municipal election)
 *
 * Each district stored with:
 *   geo_id  = 'boston-ma-council-district-{N}'  (N = 1..9)
 *   mtfcc   = 'X0013'
 *   state   = '25'  (Massachusetts FIPS — NOT 'MA' or 'ma')
 *   source  = 'boston_city_council_districts_2023'
 *
 * CRITICAL: outSR=4326 IS REQUIRED. Source uses Web Mercator (WKID 102100/3857).
 * CRITICAL: Test bulk where=1=1 first. If features.length < 9, fall back to
 *   per-DISTRICT individual queries (where=DISTRICT%3D{N}). Portland OR had
 *   silent truncation at 3 of 4 features with bulk fetch.
 * CRITICAL: '-ma-' geo_id qualifier prevents namespace collision with any
 *   future 'boston-...' prefix conflicts.
 * CRITICAL: X0013 mtfcc claimed by this script for Boston council districts.
 *   (Registry: ...X0012=Portland OR council)
 *
 * IDEMPOTENCY: ON CONFLICT (geo_id, mtfcc) DO NOTHING ensures safe re-runs.
 * ST_MakeValid: Apply after ST_ForcePolygonCCW for polygon self-intersections.
 *
 * Usage (from C:/EV-Accounts/backend):
 *   npx tsx scripts/load-boston-council-boundaries.ts --dry-run
 *   npx tsx scripts/load-boston-council-boundaries.ts
 */
```

**Config block** (copy from Portland, lines 60-69, adapt constants):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import * as https from 'https';
import * as http from 'http';

const ARCGIS_BASE_URL =
  'https://services.arcgis.com/sFnw0xNflSi8J0uh/arcgis/rest/services/CityCouncilDistricts_2023_5_25/FeatureServer/0/query';

const MTFCC          = 'X0013';
const STATE          = '25';           // Massachusetts FIPS (NOT 'MA' or 'ma')
const SOURCE         = 'boston_city_council_districts_2023';
const EXPECTED_COUNT = 9;
const MAX_DISTRICT   = 9;

const DRY_RUN = process.argv.includes('--dry-run');
```

**DB pool pattern** (lines 72-81 of Portland analog — copy verbatim):
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

**fetchJson helper** (lines 85-106 of Portland analog — copy verbatim): the same https/http redirect-following JSON fetch function.

**Pre-flight check** (lines 115-135 of Portland analog, adapt for X0013 / boston-ma-council-district-):
```typescript
// Check X0013 is unclaimed or only has boston-ma rows
const precheck = await pool.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt FROM essentials.geofence_boundaries WHERE mtfcc='X0013'
`);
// ... if existingCount > 0, verify all are 'boston-ma-council-district-%'
```

**Fetch strategy — bulk first, then per-DISTRICT fallback** (key Boston adaptation):
```typescript
// Step 1a: Try bulk fetch (where=1=1)
const bulkUrl = `${ARCGIS_BASE_URL}?where=1%3D1&outFields=DISTRICT,Councilor,LONGNAME&outSR=4326&f=geojson`;
// ... if geojson.features.length === EXPECTED_COUNT, use bulk results
// Step 1b: If bulk returns < 9, fall back to per-DISTRICT loop:
for (let distNum = 1; distNum <= MAX_DISTRICT; distNum++) {
  const url = `${ARCGIS_BASE_URL}?where=DISTRICT%3D${distNum}&outFields=DISTRICT,Councilor,LONGNAME&outSR=4326&f=geojson`;
  // ...
}
```

**District field parsing** (Portland lines 171-188, adapt for Boston):
```typescript
// DISTRICT field is integer 1-9 in Boston data (verify on first run)
const rawDistrict = props['DISTRICT'];
const distNum = parseInt(String(rawDistrict ?? ''), 10);
if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
  console.error(`ERROR: DISTRICT='${rawDistrict}' out of range`);
  process.exit(1);
}
districtMap.set(distNum, JSON.stringify(feature.geometry));
```

**geo_id construction** (line 203 of Portland analog):
```typescript
const geoId = `boston-ma-council-district-${distNum}`;
const name  = `District ${distNum}`;
```

**INSERT pattern with PostGIS pipeline** (lines 213-224 of Portland analog — copy verbatim, params differ only in values):
```typescript
const result = await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES ($1, $2, $3, $4, $5,
    public.ST_MakeValid(
      public.ST_ForcePolygonCCW(
        public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
      )
    ),
    $7, now())
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]);
```

**Verify block** (lines 244-258 of Portland analog, adapt geo_id pattern):
```typescript
const verify = await pool.query<{ cnt: string }>(`
  SELECT COUNT(*) AS cnt
  FROM essentials.geofence_boundaries
  WHERE geo_id LIKE 'boston-ma-council-district-%'
    AND mtfcc = $1
    AND state = $2
`, [MTFCC, STATE]);
```

**main() wrapper + error handler** (lines 264-269 of Portland analog — copy verbatim):
```typescript
main()
  .catch((err) => {
    console.error('[load-boston-council-boundaries] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => void pool.end());
```

---

### `347_boston_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql`

This migration is significantly more complex than Alexandria because Boston has 9 per-district councillors requiring 9 per-district LOCAL district rows (in addition to the LOCAL at-large row and LOCAL_EXEC row). The core patterns copy exactly.

**Header comment block** (adapt from 312 lines 1-28):
```sql
-- Migration 347: City of Boston government (MA-DEEP-01)
--
-- Purpose: Seeds City of Boston government and City Council.
--   - 1 government row: 'City of Boston, Massachusetts, US'
--   - 1 chamber row: 'City Council'
--   - 1 LOCAL_EXEC district (Mayor Wu, geo_id='2507000', mtfcc=NULL)
--   - 1 LOCAL district — at-large (4 councillors, geo_id='2507000', mtfcc=NULL)
--   - 9 LOCAL districts — per-district (geo_id='boston-ma-council-district-{N}', mtfcc='X0013')
--   - 14 politicians: Mayor + 4 at-large + 9 district councillors
--   - 14 offices
--   - office_id back-fill on all 14
--
-- Boston geo_id='2507000' G4110 geofence already in geofence_boundaries — do NOT re-insert.
-- X0013 geofences loaded by load-boston-council-boundaries.ts — must run BEFORE this migration.
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state = 'ma' (lowercase); governments.state = 'MA' (uppercase).
-- CRITICAL: mtfcc=NULL on LOCAL_EXEC and LOCAL at-large district rows only.
-- CRITICAL: mtfcc='X0013' on the 9 per-district LOCAL rows.
-- CRITICAL: party=NULL (antipartisan design).
-- CRITICAL: is_appointed=false for all (Mayor + councillors are popularly elected).
```

**Pre-flight guard** (312 lines 29-38, adapt):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Boston, Massachusetts, US') > 0 THEN
    RAISE NOTICE 'City of Boston government row already exists — skipping (idempotent re-run)';
  END IF;
END $$;
```

**Pre-flight: assert X0013 geofences loaded** (new — no Portland analog in migrations):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id LIKE 'boston-ma-council-district-%' AND mtfcc = 'X0013';
  IF v_count < 9 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: expected 9 X0013 boston-ma-council-district-* rows, found %. Run load-boston-council-boundaries.ts first.', v_count;
  END IF;
END $$;
```

**Pre-flight: assert Boston G4110 geofence present** (new):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '2507000' AND mtfcc = 'G4110';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Boston G4110 geofence (geo_id=2507000) not found. Expected from Phase 38 MA TIGER load.';
  END IF;
END $$;
```

**Pre-flight: external_id block clear** (313 lines 39-48, adapt for range -2507000001..-2507000014):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -2507000014 AND -2507000001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -2507000001..-2507000014 is not clear (% rows found)', v_count;
  END IF;
END $$;
```

**Government row** (312 lines 47-54):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Boston, Massachusetts, US',
       'LOCAL', 'MA', 'Boston', '2507000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Boston, Massachusetts, US'
);
```

**Chamber row** (312 lines 61-72, adapt names):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'City Council',
       'Boston City Council',
       (SELECT id FROM essentials.governments
        WHERE name = 'City of Boston, Massachusetts, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Boston, Massachusetts, US')
);
```

**LOCAL_EXEC district** (312 lines 80-85, adapt for MA):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'ma', '2507000', 'Boston (Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2507000' AND district_type = 'LOCAL_EXEC' AND state = 'ma'
);
```

**LOCAL at-large district** (312 lines 91-96, adapt for MA):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', '2507000', 'Boston (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2507000' AND district_type = 'LOCAL' AND state = 'ma'
);
```

**LOCAL per-district rows** (new pattern — 9 iterations, no direct analog in 312):
```sql
-- Repeat for N = 1..9; label = 'District N'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', 'boston-ma-council-district-1', 'District 1', 'X0013'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'boston-ma-council-district-1' AND district_type = 'LOCAL' AND state = 'ma'
);
-- ... repeat for districts 2-9
```

**Politician + office block pattern** (312 lines 110-139 for Mayor / LOCAL_EXEC; lines 141-172 for council member / LOCAL):
```sql
-- Mayor Wu — links to LOCAL_EXEC district
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michelle Wu', 'Michelle', 'Wu', NULL,
          true, false, false, true, -2507000001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Boston, Massachusetts, US')),
       p.id,
       'Mayor', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2507000'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );

-- At-large councillors (e.g. Ruthzee Louijeune) — link to LOCAL at-large district (geo_id='2507000')
-- Same WITH ins_p pattern; district filter: geo_id='2507000', district_type='LOCAL', state='ma'

-- District councillors (e.g. Gabriela Coletta Zapata, District 1) — link to per-district LOCAL row
-- Same WITH ins_p pattern; district filter: geo_id='boston-ma-council-district-1', district_type='LOCAL', state='ma'
```

**office_id back-fill** (312 lines 345-351):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2507000014 AND -2507000001
  AND p.office_id IS NULL;
```

**Post-verification DO block** (312 lines 362-416, extended for Boston's additional district rows):
Gates to include:
- Gate (a): 1 government row
- Gate (b): 1 City Council chamber
- Gate (c): district count = 11 (1 LOCAL_EXEC + 1 LOCAL at-large + 9 LOCAL per-district)
- Gate (d): politician count = 14
- Gate (e): office count = 14 (all linked to correct districts)
- Gate (f): section-split = 0 (Boston G4110 geofence has LOCAL_EXEC district row)
- Gate (g): office_id back-fill complete (0 NULL)

**Migration ledger** (312 line 422-424):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('347')
ON CONFLICT (version) DO NOTHING;
```

---

### `348_boston_school_committee.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql`

Copy this migration almost verbatim. The key differences from ACPS are: geo_id='2502790' (not '5100090'), state='25'/'ma' (not '51'/'va'), 7 members (not 9), `is_appointed=true` (not false — Boston SC is mayor-appointed, not elected), and government/chamber names.

**Header comment block** (313 lines 1-22, adapt):
```sql
-- Migration 348: Boston School Committee (MA-DEEP-03)
--
-- Purpose: Seeds Boston Public Schools school committee (7 members) under SCHOOL district.
--   geo_id='2502790' (MA FIPS=25, BPS LEAID=02790 — same derivation as ACPS pattern)
-- Totals: 1 government, 1 chamber, 1 district, 7 politicians, 7 offices
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS guard.
-- CRITICAL: districts.state = 'ma' (lowercase); governments.state = 'MA' (uppercase).
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT').
-- CRITICAL: G5420 geofence inserted directly in this migration (no MA G5420 loader).
-- CRITICAL: geofence_boundaries.state = '25' (Massachusetts FIPS numeric string).
-- CRITICAL: party=NULL (antipartisan — D-15).
-- CRITICAL: is_appointed=true for all 7 (mayor-appointed committee — D-16 override required).
-- CRITICAL: is_appointed_position=false (public governing body, not bureaucratic staff).
-- NOTE: election_method=NULL on chamber (no election — appointed committee).
-- NOTE: Do NOT seed Mah Noor (non-voting student rep).
```

**Pre-flight idempotency guard** (313 lines 27-33):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Boston Public Schools, Massachusetts, US') > 0 THEN
    RAISE EXCEPTION 'Migration 348 already applied — aborting re-run';
  END IF;
END $$;
```

**Pre-flight external_id block clear** (313 lines 39-48, adapt for -2502790001..-2502790007):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -(2502790::bigint * 1000 + 7) AND -(2502790::bigint * 1000 + 1);
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -2502790001..-2502790007 not clear (% rows)', v_count;
  END IF;
END $$;
```

**G5420 geofence INSERT** (313 lines 55-60, adapt for BPS geo_id + MA FIPS):
```sql
INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '2502790', 'G5420', '25'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.geofence_boundaries
  WHERE geo_id = '2502790' AND mtfcc = 'G5420'
);
```

**Government row** (313 lines 68-75, adapt for BPS):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Boston Public Schools, Massachusetts, US',
       'LOCAL', 'MA', NULL, '2502790'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Boston Public Schools, Massachusetts, US'
);
```

**Chamber row** (313 lines 82-93, adapt — no election_method column since committee is appointed):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'School Committee',
       'Boston School Committee',
       (SELECT id FROM essentials.governments
        WHERE name = 'Boston Public Schools, Massachusetts, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'School Committee'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Boston Public Schools, Massachusetts, US')
);
```

**SCHOOL district row** (313 lines 103-108, adapt for BPS):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'ma', '2502790', 'Boston Public Schools', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2502790' AND district_type = 'SCHOOL' AND state = 'ma'
);
```

**Politician + office block pattern** (313 lines 128-157, key difference: `is_appointed=true`):
```sql
-- BLOCK 1: Jeri Robinson (Chair) — -2502790001
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jeri Robinson', 'Jeri', 'Robinson', NULL,
          true, true, false, true, -2502790001)   -- is_appointed=TRUE (mayor-appointed)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'School Committee'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Boston Public Schools, Massachusetts, US')),
       p.id,
       'School Committee Chair', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2502790'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat for members 2-7; member 2 = 'School Committee Vice Chair'; members 3-7 = 'School Committee Member'
```

**office_id back-fill** (313 lines 420-425, adapt range):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -(2502790::bigint * 1000 + 7) AND -(2502790::bigint * 1000 + 1)
  AND p.office_id IS NULL;
```

**Post-verification DO block** (313 lines 438-521, adapt counts: gov=1, chamber=1, dist=1, pol=7, off=7):
```sql
-- Gate (d): 7 politicians in range
IF v_pol_count <> 7 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected 7 politicians in BPS range, found %', v_pol_count;
END IF;
-- Gate (e): 7 offices linked to SCHOOL district
IF v_off_count <> 7 THEN
  RAISE EXCEPTION 'Post-verification FAILED: expected 7 offices for SCHOOL geo_id=2502790, found %', v_off_count;
END IF;
```

**Migration ledger** (313 line 526-528):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('348')
ON CONFLICT (version) DO NOTHING;
```

---

### `349_boston_headshots.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/315_va_headshots.sql`

**Header comment block** (315 lines 1-25, adapt):
```sql
-- Migration 349: Boston headshots (MA-DEEP-02)
--
-- Storage bucket: politician_photos
-- CDN base: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/
--
-- Counts: 1 Mayor + 13 City Councillors + 7 School Committee = 21 rows (best-effort for SC)
-- Photo processing: crop to 4:5 ratio FIRST, then resize 600x750 Lanczos q90.
-- politician_images.type = 'default' (UI filter: .find(img => img.type === 'default')).
-- politician_images.url column (NOT storage_url).
-- No BEGIN/COMMIT — each INSERT is autocommit.
-- photo_license = 'public_domain' for all boston.gov official photos.
--
-- Sources:
--   boston.gov/departments/city-council — Mayor Wu + all 13 councillors
--   bostonpublicschools.org/school-committee (JS-rendered; check Boston.gov press releases for SC members)
--
-- Headshot URL patterns:
--   Mayor Wu: https://www.boston.gov/sites/default/files/img/library/photos/2021/11/wu-headshot-portrait.jpg
--   Councillors (2026): https://www.boston.gov/sites/default/files/styles/person_photo_profile_large_360x360_/public/img/library/photos/2026/02/{lastname}-headshot.{ext}
--   Exceptions: Louijeune + Coletta Zapata use patterns-stg.boston.gov CDN (verify stability)
```

**Per-politician INSERT pattern** (315 lines 31-39, one block per politician — copy exactly):
```sql
-- Michelle Wu (Mayor) — external_id -2507000001
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -2507000001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{UUID}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -2507000001)
);
```

Each block is identical except for external_id value (-2507000001 through -2507000014 for council, -2502790001 through -2502790007 for SC) and the storage URL. The UUID in the storage URL is the politician's UUID (fetched after uploading the file). The WHERE NOT EXISTS guard on politician_id makes all blocks idempotent.

**Post-verification** (315 does not have a DO block — omit or add simple count check):
```sql
-- Optional: Count check
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -2507000014 AND -2507000001
     OR p.external_id BETWEEN -2502790007 AND -2502790001;
  RAISE NOTICE 'Migration 349: % politician_images rows inserted for Boston officials', v_count;
END $$;
```

**Migration ledger:**
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('349')
ON CONFLICT (version) DO NOTHING;
```

---

### `_apply-migration-{347|348|349}.ts` (utility/script, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-325.ts`

**Core pattern** (325 lines 1-57 — copy structure, adapt migration number and smoke tests):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '347_boston_government.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 347 applied successfully');

  // Smoke test 1: Government row exists
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.governments
    WHERE name = 'City of Boston, Massachusetts, US'
  `);
  console.log('Boston government rows:', r1.rows[0].cnt, '(expected 1)');

  // Smoke test 2: Politician count
  const r2 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.politicians
    WHERE external_id BETWEEN -2507000014 AND -2507000001
  `);
  console.log('Boston council politicians:', r2.rows[0].cnt, '(expected 14)');

  // Smoke test 3: District count (11 = 1 LOCAL_EXEC + 1 LOCAL at-large + 9 LOCAL per-district)
  const r3 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.districts
    WHERE state = 'ma' AND geo_id IN (
      '2507000', 'boston-ma-council-district-1', 'boston-ma-council-district-2',
      'boston-ma-council-district-3', 'boston-ma-council-district-4',
      'boston-ma-council-district-5', 'boston-ma-council-district-6',
      'boston-ma-council-district-7', 'boston-ma-council-district-8',
      'boston-ma-council-district-9'
    )
  `);
  console.log('Boston districts:', r3.rows[0].cnt, '(expected 11)');

  // Smoke test 4: Ledger entry
  const r4 = await pool.query(`
    SELECT version FROM supabase_migrations.schema_migrations WHERE version = '347'
  `);
  console.log('Ledger entry 347:', r4.rows.length > 0 ? 'PRESENT' : 'MISSING');

} catch (e: any) {
  console.error('Error applying migration 347:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

Adapt smoke tests per migration:
- `_apply-migration-348.ts`: check BPS government (1), SCHOOL district (1), 7 politicians, G5420 geofence present
- `_apply-migration-349.ts`: check politician_images count (14 council + up to 7 SC = up to 21 rows)

---

## Shared Patterns

### DB Case Convention (applies to ALL migrations)
**Source:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` (comments lines 21-28) and `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` (comments lines 9-16)
**Apply to:** 347_boston_government.sql, 348_boston_school_committee.sql

```sql
-- geofence_boundaries.state = '25'      (FIPS numeric string — NOT 'MA' or 'ma')
-- essentials.districts.state = 'ma'     (lowercase text — routing query convention)
-- essentials.governments.state = 'MA'   (uppercase text — governments table convention)
-- essentials.offices.representing_state = 'MA'  (uppercase text — offices convention)
```

### WHERE NOT EXISTS Guard (governments, chambers, districts)
**Source:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` lines 47-54
**Apply to:** ALL INSERT statements on governments, chambers, districts in 347 and 348.

```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), ..., ...
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = '...'
);
```

### Politician + Office WITH/INSERT Block Pattern
**Source:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` lines 110-139
**Apply to:** Every politician in 347 and 348.

```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians (id, full_name, first_name, last_name, party,
    is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '...', '...', '...', NULL, true, false, false, true, -XXXXXXXXX)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title,
  representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id, (SELECT id FROM essentials.chambers WHERE ...), p.id,
  '...', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '...' AND d.district_type = '...' AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o
                  WHERE o.district_id = d.id AND o.politician_id = p.id);
```

### No-Slug INSERT on Chambers
**Source:** `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` line 7
**Apply to:** All chamber INSERTs in 347 and 348.

`slug` is a `GENERATED ALWAYS AS` computed column. Never include it in the INSERT column list. The INSERT will fail with a "cannot insert into generated column" error if included.

### office_id Back-fill
**Source:** `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` lines 345-351
**Apply to:** End of 347_boston_government.sql, end of 348_boston_school_committee.sql.

```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN {min_id} AND {max_id}
  AND p.office_id IS NULL;
```

### politician_images INSERT Pattern (headshots)
**Source:** `C:/EV-Accounts/backend/migrations/315_va_headshots.sql` lines 31-39
**Apply to:** Every politician in 349_boston_headshots.sql.

```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -XXXXXXXXX),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician-uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -XXXXXXXXX)
);
```

Column is `url` (NOT `storage_url`). Type is `'default'` (NOT `'headshot'`). License is `'public_domain'` for all boston.gov official photos.

### Post-Verification DO Block Gates
**Source:** `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` lines 438-521
**Apply to:** End of 347 and 348 (before ledger INSERT).

```sql
DO $$
DECLARE
  v_gov_count     INTEGER;
  v_chamber_count INTEGER;
  v_dist_count    INTEGER;
  v_pol_count     INTEGER;
  v_off_count     INTEGER;
  v_split_count   INTEGER;
  v_null_count    INTEGER;
BEGIN
  -- Gate (a): government row count
  -- Gate (b): chamber count
  -- Gate (c): district rows
  -- Gate (d): politician count
  -- Gate (e): office count
  -- Gate (f): section-split = 0
  -- Gate (g): office_id back-fill complete
  RAISE NOTICE 'Migration NNN post-verification PASSED: ...', ...;
END $$;
```

### Migration Ledger Entry
**Source:** `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` lines 526-528
**Apply to:** Last statement in 347, 348, 349.

```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('NNN')
ON CONFLICT (version) DO NOTHING;
```

---

## Key Boston-Specific Adaptations (Not in Any Analog)

### 1. District councillors linking to per-district geo_ids
No existing migration has councillors linking to non-city-geo_id LOCAL districts. The pattern is the same WITH/INSERT block, but the `WHERE d.geo_id = '...'` clause uses `'boston-ma-council-district-N'` instead of the city geo_id.

```sql
-- For Gabriela Coletta Zapata, District 1:
FROM essentials.districts d CROSS JOIN ins_p p
WHERE d.geo_id = 'boston-ma-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'ma'
```

### 2. Accent in politician name
**Source:** RESEARCH.md Pitfall 6
```sql
-- Correct UTF-8:
VALUES (gen_random_uuid(), 'Enrique J. Pepén', 'Enrique', 'Pepén', ...)
-- NOT: 'Enrique J. Pepen' (stripped accent is wrong)
```

### 3. is_appointed=true for School Committee members
D-16 in CONTEXT.md was written assuming elected members. RESEARCH.md Correction 2 overrides it. The flag must be `true` for all 7 BPS members.

### 4. Loader script bulk-vs-per-district strategy
Boston adaptation of Portland's per-OBJECTID strategy: attempt bulk `where=1=1` first; if `features.length < 9`, fall back to per-`DISTRICT` queries using `where=DISTRICT%3D{N}`.

---

## No Analog Found

No files in this phase lack a codebase analog. All 5 files have exact matches.

---

## Metadata

**Analog search scope:**
- `C:/EV-Accounts/backend/scripts/` — loader scripts
- `C:/EV-Accounts/backend/migrations/` — migrations 277, 312, 313, 315
- `C:/EV-Accounts/backend/scripts/_apply-migration-*.ts` — apply scripts

**Files scanned:** 5 analog files read in full
**Pattern extraction date:** 2026-06-10
