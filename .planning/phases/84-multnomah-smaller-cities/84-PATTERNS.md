# Phase 84: Multnomah Smaller Cities — Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 4 new files
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` | migration | CRUD | `244_multnomah_county_government.sql` | exact (same structure, repeated 5x) |
| `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` | migration (audit-only) | CRUD | `245_multnomah_county_headshots.sql` | exact |
| `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts` | smoke test | request-response | `smoke-multnomah-county.ts` | exact (replace COUNTY query with LOCAL/LOCAL_EXEC, 5 addresses) |
| `C:/EV-Accounts/backend/scripts/_tmp-cities-headshots.py` | headshot upload script | file-I/O | `portland-headshots-process.py` | role-match (multi-official, multi-source, WebP support) |

---

## Pattern Assignments

### `246_multnomah_cities_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql`

Migration 246 repeats the 244 pattern exactly, once per city (5 iterations). The only structural difference is that 244 has one district per government (COUNTY); each Phase 84 city has TWO districts (LOCAL_EXEC for Mayor + LOCAL for council).

---

**File header and transaction wrapper** (`244_multnomah_county_government.sql` lines 1-21):
```sql
-- Migration 246: Multnomah smaller cities government + chambers + districts + officials + offices
--
-- Purpose: Seeds 5 incorporated Multnomah County cities outside Portland:
--   Gresham (geo_id='4131250'), Troutdale ('4174850'), Fairview ('4124250'),
--   Wood Village ('4183950'), Maywood Park ('4146730')
--   Each city: 1 government + 1 chamber + 1 LOCAL_EXEC district (Mayor) +
--              1 LOCAL at-large district (council) + N officials + N offices + office_id back-fill
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'or' (lowercase) to match routing queries.
-- CRITICAL: governments.state = 'OR' (uppercase). offices.representing_state = 'OR' (uppercase).
-- CRITICAL: district_type='LOCAL_EXEC' for Mayor; district_type='LOCAL' for council (NOT 'COUNTY').

BEGIN;
```

---

**Pre-flight DO block** (`244_multnomah_county_government.sql` lines 26-32):
```sql
-- Pre-flight: RAISE NOTICE if any city government row already exists (idempotency guard)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name IN (
        'City of Gresham, Oregon, US', 'City of Troutdale, Oregon, US',
        'City of Fairview, Oregon, US', 'City of Wood Village, Oregon, US',
        'City of Maywood Park, Oregon, US'
      )) > 0 THEN
    RAISE NOTICE 'One or more city government rows already exist — idempotent re-run';
  END IF;
END $$;
```

---

**Government row INSERT** (`244_multnomah_county_government.sql` lines 39-46):
```sql
-- Step 1: Government row (repeat for each of 5 cities, changing name/city/geo_id)
-- type='LOCAL' for city governments (NOT 'County' — that is only for Multnomah County row)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Gresham, Oregon, US',
       'LOCAL', 'OR', 'Gresham', '4131250'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Gresham, Oregon, US'
);
```

Note: `type='LOCAL'` for cities. The Multnomah County analog uses `type='County'` — do not copy that value.

---

**Chamber INSERT** (`244_multnomah_county_government.sql` lines 53-63):
```sql
-- Step 2: City Council chamber
-- CRITICAL: slug is GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'City Council',
       'Gresham City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Gresham, Oregon, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Gresham, Oregon, US')
);
```

---

**LOCAL_EXEC district INSERT (Mayor)** (`244_multnomah_county_government.sql` lines 72-77 — adapted to LOCAL_EXEC):
```sql
-- Step 3: LOCAL_EXEC district (Mayor — citywide)
-- geo_id = city's G4110 geo_id; mtfcc = NULL (no custom geofence needed)
-- state = 'or' lowercase — routing queries match lowercase
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4131250', 'Gresham (Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4131250' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

---

**LOCAL at-large district INSERT (council)** (`244_multnomah_county_government.sql` lines 72-77 — adapted to LOCAL):
```sql
-- Step 4: LOCAL at-large district (all councilors share this row)
-- All 5 cities are at-large — Gresham confirmed at-large despite CONTEXT.md D-05 speculation
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4131250', 'Gresham (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4131250' AND district_type = 'LOCAL' AND state = 'or'
);
```

---

**WITH ins_p CTE — directly elected Mayor** (`244_multnomah_county_government.sql` lines 90-119):
```sql
-- Step 5: Mayor (directly elected — Gresham, Troutdale, Fairview)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Travis Stovall', 'Travis', 'Stovall', NULL,
          true, false, false, true, -4131251)
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
                               WHERE name = 'City of Gresham, Oregon, US')),
       p.id,
       'Mayor', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4131250'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

---

**WITH ins_p CTE — council-appointed Mayor** (RESEARCH.md Pattern 2, for Wood Village and Maywood Park):
```sql
-- Mayor chosen by council from among elected members — is_appointed=true on politician row,
-- is_appointed_position=true on office row. district_type=LOCAL_EXEC still applies.
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jairo Rios-Campos', 'Jairo', 'Rios-Campos', NULL,
          true, true, false, true, -4183951)   -- is_appointed=true
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
                               WHERE name = 'City of Wood Village, Oregon, US')),
       p.id,
       'Mayor', 'OR', true, false, NULL        -- is_appointed_position=true
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4183950'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

---

**WITH ins_p CTE — councilor (at-large LOCAL district)** (`244_multnomah_county_government.sql` lines 121-151):
```sql
-- Each councilor links to the LOCAL at-large district (NOT LOCAL_EXEC)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Kayla Brown', 'Kayla', 'Brown', NULL,
          true, false, false, true, -4131252)
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
                               WHERE name = 'City of Gresham, Oregon, US')),
       p.id,
       'Council Member (Position 1)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4131250'
  AND d.district_type = 'LOCAL'       -- NOT LOCAL_EXEC
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

Title conventions (from RESEARCH.md Office Title Conventions):
- Gresham: `'Council Member (Position N)'` for N=1..6
- Troutdale: `'City Councilor'` (matches official website terminology)
- Fairview: `'Council Member (Position N)'` for N=1..6
- Wood Village: `'Council President'` for Dara Tan; `'City Councilor'` for others
- Maywood Park: `'Council President'` for Kevin Bussema; `'City Councilor'` for others

---

**office_id back-fill** (`244_multnomah_county_government.sql` lines 255-260):
```sql
-- office_id back-fill — all 31 officials across all 5 cities
-- Use explicit external_id IN list (not BETWEEN — the ranges are non-contiguous across cities)
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4131251,-4131252,-4131253,-4131254,-4131255,-4131256,-4131257,
    -4174851,-4174852,-4174853,-4174854,-4174855,-4174856,-4174857,
    -4124251,-4124252,-4124253,-4124254,-4124255,-4124256,-4124257,
    -4183951,-4183952,-4183953,-4183954,-4183955,
    -4146731,-4146732,-4146733,-4146734,-4146735
  )
  AND p.office_id IS NULL;
```

---

**Post-verification DO block** (`244_multnomah_county_government.sql` lines 269-314):
```sql
-- Post-verification: 5 gates (one per city) + section-split check for all 5 geo_ids
-- Each gate: gov_count=1, offices_linked=N (7 for Gresham/Troutdale/Fairview, 5 for WV/MP)
-- Section-split check: each geo_id must have both LOCAL and LOCAL_EXEC district rows
DO $$
DECLARE
  v_gov_count   INTEGER;
  v_office_count INTEGER;
  v_split_count INTEGER;
BEGIN
  -- Gate per city (repeat for each of 5):
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Gresham, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Gresham gov_count=%, expected 1', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4131250' AND d.district_type IN ('LOCAL','LOCAL_EXEC') AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Gresham office_count=%, expected 7', v_office_count;
  END IF;

  -- Section-split check across all 5 cities (from RESEARCH.md Section-Split Check SQL)
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4131250','4174850','4124250','4183950','4146730')
    AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
        AND d.state = 'or'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED';
END $$;
```

---

**Ledger entry and COMMIT** (`244_multnomah_county_government.sql` lines 319-323):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('246')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `247_multnomah_cities_headshots.sql` (migration, audit-only CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql`

Audit-only. NOT applied via Supabase ledger. Documents live politician_images INSERTs from `_tmp-cities-headshots.py`.

---

**File header** (`245_multnomah_county_headshots.sql` lines 1-22):
```sql
-- Migration 247: Multnomah Smaller Cities Official Headshots
-- AUDIT-ONLY: captures the live politician_images INSERTs performed during Phase 84-02
-- execution on [date].
-- DO NOT apply via Supabase ledger — actual DB writes happened live via
-- scripts/_tmp-cities-headshots.py (Python PIL + Supabase Storage API).
-- This is AUDIT-ONLY in the same pattern as 245_multnomah_county_headshots.sql,
-- 225_or_headshots.sql, 200_sf_headshots.sql, etc.
--
-- Officials documented (by city):
--   GRESHAM (7 officials, external_ids -4131251..-4131257): all have photos on greshamoregon.gov
--   TROUTDALE (7 officials, external_ids -4174851..-4174857): photos on troutdaleoregon.gov (WebP)
--   FAIRVIEW (7 officials, external_ids -4124251..-4124257): no photos on official site
--   WOOD VILLAGE (5 officials, external_ids -4183951..-4183955): photos on woodvillageor.gov
--   MAYWOOD PARK (5 officials, external_ids -4146731..-4146735): no photos confirmed on official site
--
-- Photo processing: crop 4:5 first, resize 600x750 Lanczos q90.
-- Storage bucket: politician_photos; path: {politician_id}-headshot.jpg.
```

---

**Per-official INSERT block** (`245_multnomah_county_headshots.sql` lines 27-37):
```sql
-- [City section header]
-- ============================================================
-- GRESHAM (7 officials)
-- ============================================================

-- Travis Stovall (-4131251) — Mayor
-- source: https://www.greshamoregon.gov/globalassets/government/mayor-and-council/meet-the-council/mayor-stovall-thumbnail.jpg
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4131251),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4131251)
);
```

Critical: `type = 'default'` (NOT `'headshot'`). Wrong type = photo silently invisible in UI.

---

**No-photo comment pattern** (`245_multnomah_county_headshots.sql` — pattern for officials with no photo):
```sql
-- Keith Kudrna (-4124251) — Mayor, Fairview
-- No photo found on official city website (fairvieworegon.gov/Directory.aspx?did=29).
-- No politician_images row inserted.
```

One comment per official is mandatory even when no INSERT is written (D-09).

---

### `scripts/smoke-multnomah-cities.ts` (smoke test, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts`

Near-copy of `smoke-multnomah-county.ts`. Replace:
- `queryCountyOfficials` → `queryLocalOfficials` (change `district_type = 'COUNTY'` to `IN ('LOCAL', 'LOCAL_EXEC')`)
- Two test addresses → five test addresses (one centroid per city)
- Expected name sets → per-city name sets for officials
- Section-split check → check all 5 G4110 geo_ids for LOCAL/LOCAL_EXEC districts

---

**Imports and interface** (`smoke-multnomah-county.ts` lines 1-27):
```typescript
/**
 * smoke-multnomah-cities.ts
 * Phase 84: Multnomah smaller cities routing smoke test
 *
 * Usage (from C:/EV-Accounts/backend):
 *   npx tsx scripts/smoke-multnomah-cities.ts
 *
 * Verifies Phase 84 success criteria:
 *   SC1 — Each city centroid returns G4110 with correct geo_id
 *   SC2 — Each city centroid returns LOCAL + LOCAL_EXEC officials via districts JOIN
 *   SC3 — Section-split check: all 5 G4110 geo_ids have LOCAL + LOCAL_EXEC district rows (0 orphans)
 */
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

---

**TEST_ADDRESSES array** (verified centroids from RESEARCH.md Verified Geo_IDs section):
```typescript
const TEST_ADDRESSES: AddressTest[] = [
  {
    label: 'Gresham (centroid)',
    lon: -122.441364519028, lat: 45.5021166610009,
    expectedMtfcc: ['G4110'],
    expectedGeoIds: { G4110: '4131250' },
  },
  {
    label: 'Troutdale (centroid)',
    lon: -122.395436661508, lat: 45.5372271419675,
    expectedMtfcc: ['G4110'],
    expectedGeoIds: { G4110: '4174850' },
  },
  {
    label: 'Fairview (centroid)',
    lon: -122.438921112803, lat: 45.5469083700965,
    expectedMtfcc: ['G4110'],
    expectedGeoIds: { G4110: '4124250' },
  },
  {
    label: 'Wood Village (centroid)',
    lon: -122.420492816904, lat: 45.5357895342016,
    expectedMtfcc: ['G4110'],
    expectedGeoIds: { G4110: '4183950' },
  },
  {
    label: 'Maywood Park (centroid)',
    lon: -122.56177821613, lat: 45.5525170048598,
    expectedMtfcc: ['G4110'],
    expectedGeoIds: { G4110: '4146730' },
  },
];
// All 5 centroids verified against production DB [VERIFIED: DB query 2026-05-31]
```

---

**queryBoundaries function** (`smoke-multnomah-county.ts` lines 61-75 — copy verbatim):
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
       AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     ORDER BY mtfcc`,
    [lon, lat],
  );
  return res.rows;
}
```

---

**queryLocalOfficials function** (adapted from `smoke-multnomah-county.ts` lines 77-95 — change district_type filter):
```typescript
// Replaces queryCountyOfficials — queries LOCAL and LOCAL_EXEC officials for a city coordinate
async function queryLocalOfficials(
  client: Client,
  lon: number,
  lat: number
): Promise<Array<{ full_name: string; district_type: string }>> {
  const res = await client.query<{ full_name: string; district_type: string }>(
    `SELECT p.full_name, d.district_type
     FROM essentials.politicians p
     JOIN essentials.offices o ON o.politician_id = p.id
     JOIN essentials.districts d ON d.id = o.district_id
     JOIN essentials.geofence_boundaries gb ON gb.geo_id = d.geo_id
     WHERE gb.state = '41'
       AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')   -- city officials (NOT COUNTY)
       AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     ORDER BY p.full_name`,
    [lon, lat],
  );
  return res.rows;
}
```

---

**Client setup + error collection** (`smoke-multnomah-county.ts` lines 97-110 — copy verbatim):
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

  let allPassed = true;
  const errors: string[] = [];

  try {
    // SC checks here (pre-flight + SC1-SC3 per city + SC_SPLIT)
  } finally {
    await client.end();
  }
  // ...
}
```

---

**Section-split check** (`smoke-multnomah-county.ts` lines 285-305 — adapted for 5 G4110 geo_ids):
```typescript
// SC_SPLIT: all 5 G4110 geo_ids must have LOCAL and LOCAL_EXEC district rows
console.log('\n=== SC_SPLIT: Section-split check (5 cities) ===');
const splitRes = await client.query<{ geo_id: string; name: string }>(`
  SELECT gb.geo_id, gb.name
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id IN ('4131250','4174850','4124250','4183950','4146730')
    AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
        AND d.state = 'or'
    )
`);
if (splitRes.rows.length > 0) {
  for (const row of splitRes.rows) {
    const msg = `SC_SPLIT FAIL: no LOCAL/LOCAL_EXEC district for geo_id='${row.geo_id}' (${row.name})`;
    console.log(`  FAIL: ${msg}`);
    errors.push(msg);
    allPassed = false;
  }
} else {
  console.log('  SC_SPLIT: All 5 cities have LOCAL + LOCAL_EXEC district rows [PASS]');
}
```

---

**Final result pattern** (`smoke-multnomah-county.ts` lines 314-335 — copy structure, update labels):
```typescript
  console.log('\n=== Smoke Test Results ===');
  if (allPassed) {
    console.log('ALL ASSERTIONS PASSED');
    console.log('\nPhase 84 success criteria:');
    console.log('  SC1: All 5 city centroids return correct G4110 geo_id [PASS]');
    console.log('  SC2: All 5 cities return LOCAL + LOCAL_EXEC officials [PASS]');
    console.log('  SC3: Section-split check — 0 orphans across 5 cities [PASS]');
    process.exit(0);
  } else {
    console.log(`FAILED (${errors.length} assertion(s)):`);
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});
```

---

### `scripts/_tmp-cities-headshots.py` (headshot upload script, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/portland-headshots-process.py`

Multi-official script with download → process → upload pipeline. Phase 84 adds WebP decoding (same as Troutdale source format); `portland-headshots-process.py` handles WebP via `Image.open()` which supports it natively via Pillow.

---

**Imports and env loading** (`portland-headshots-process.py` lines 1-33):
```python
"""
_tmp-cities-headshots.py
Process and upload Multnomah smaller cities official headshots to Supabase Storage.
Uses Python PIL for image processing, requests for HTTP.
Phase 84 Plan 02.

Processing pipeline:
1. Download from official city website
2. CROP to 4:5 ratio FIRST - never stretch
3. RESIZE to 600x750 Lanczos q90
4. Upload to politician_photos/{politician_id}-headshot.jpg
"""
import os
import io
import sys
import json
import time
import requests
from PIL import Image

# Load env vars from backend .env
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
env = {}
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip()

SUPABASE_URL = env['SUPABASE_URL']
SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'
TMP_DIR = os.environ.get('TEMP', 'C:/Windows/Temp')
```

---

**BROWSER_HEADERS** (`portland-headshots-process.py` lines 36-40):
```python
BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/webp,image/jpeg,image/*,*/*;q=0.8',
    'Referer': 'https://www.greshamoregon.gov/',  # update Referer per city section
}
```

---

**OFFICIALS list structure** (`portland-headshots-process.py` lines 48-163):
```python
# Each official: external_id (for audit), name, id (politician UUID), source_url, license
# Phase 84 sources:
#   Gresham: JPEG from greshamoregon.gov/globalassets/...
#   Troutdale: WebP from troutdaleoregon.gov/sites/g/files/vyhlif.../...jpg.webp
#   Wood Village: JPEG from woodvillageor.gov/wp-content/uploads/...
OFFICIALS = [
    # GRESHAM
    {
        'external_id': -4131251,
        'name': 'Travis Stovall',
        'id': '{politician_uuid_from_db}',   # fill after migration 246 applied
        'source_url': 'https://www.greshamoregon.gov/globalassets/government/mayor-and-council/meet-the-council/mayor-stovall-thumbnail.jpg',
        'license': 'public_domain',
    },
    # ... one dict per official with a confirmed photo URL
    # Fairview officials (7): omit from OFFICIALS list entirely — no photos on official site
    # Maywood Park officials (5): omit pending Plan 2 verification
]
```

Note: Politician UUIDs are not known until after migration 246 is applied. The script must look them up by `external_id` via a DB query OR require the executor to fill them in after migration apply. The Phase 83 analog (`portland-headshots-process.py`) hard-codes UUIDs — use the same pattern but fill UUIDs after migration 246 runs.

---

**process_image function** (`portland-headshots-process.py` lines 183-241 — copy verbatim):
```python
TARGET_W, TARGET_H = 600, 750
TARGET_RATIO = TARGET_H / TARGET_W  # 1.25 (4:5)

def process_image(raw_data: bytes, name: str) -> bytes:
    """
    Process image to 600x750 (4:5) JPEG q90.
    Rule: CROP to 4:5 FIRST, then resize to 600x750.
    Never stretch or change aspect ratio.
    """
    img = Image.open(io.BytesIO(raw_data))
    if img.mode != 'RGB':
        img = img.convert('RGB')   # handles WebP, PNG with alpha, palette mode

    w, h = img.size
    current_ratio = h / w

    if current_ratio >= TARGET_RATIO:
        # Portrait or taller — crop height from bottom
        new_h = int(w * TARGET_RATIO)
        top = 0
        if current_ratio > 2.0:
            top = int(h * 0.05)
        elif current_ratio > 1.5:
            top = int(h * 0.02)
        if top + new_h > h:
            top = h - new_h
        img = img.crop((0, top, w, top + new_h))
    else:
        # Square or landscape — center-crop width to get 4:5
        new_w = int(h / TARGET_RATIO)
        if new_w <= w:
            left = (w - new_w) // 2
            img = img.crop((left, 0, left + new_w, h))
        else:
            new_h = int(w * TARGET_RATIO)
            if new_h <= h:
                img = img.crop((0, 0, w, new_h))

    img = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)

    output = io.BytesIO()
    img.save(output, format='JPEG', quality=90, optimize=True)
    return output.getvalue()
```

Note: `img.convert('RGB')` handles WebP automatically — Pillow reads WebP natively. No special WebP stripping needed.

---

**upload_to_supabase function** (`portland-headshots-process.py` lines 244-258 — copy verbatim):
```python
def upload_to_supabase(politician_id: str, jpeg_data: bytes) -> str:
    """Upload JPEG to Supabase Storage at politician_photos/{politician_id}-headshot.jpg."""
    filename = f"{politician_id}-headshot.jpg"
    url = f"{SUPABASE_URL}/storage/v1/object/politician_photos/{filename}"
    headers = {
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
    }
    resp = requests.put(url, data=jpeg_data, headers=headers, timeout=30)
    if resp.status_code not in (200, 201):
        raise Exception(f"Upload failed: {resp.status_code} {resp.text}")
    cdn_url = f"{CDN_BASE}/{filename}"
    print(f"  Uploaded: {cdn_url}")
    return cdn_url
```

---

**main loop + summary + error exit** (`portland-headshots-process.py` lines 261-342 — copy structure):
```python
def main():
    results = []
    for official in OFFICIALS:
        print(f"\n{'='*60}")
        print(f"Processing: {official['name']} (external_id={official['external_id']})")
        try:
            raw = requests.get(official['source_url'], headers=BROWSER_HEADERS, timeout=30).content
            processed = process_image(raw, official['name'])
            cdn_url = upload_to_supabase(official['id'], processed)
            results.append({'name': official['name'], 'cdn_url': cdn_url, 'success': True})
            time.sleep(0.5)  # polite delay
        except Exception as e:
            print(f"  ERROR: {e}")
            results.append({'name': official['name'], 'success': False, 'error': str(e)})

    # Summary
    success_count = sum(1 for r in results if r['success'])
    print(f"\n{success_count}/{len(results)} headshots uploaded successfully")

    # Write results JSON for SQL generation / audit
    out = os.path.join(TMP_DIR, 'cities-headshots-results.json')
    with open(out, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved: {out}")

    if success_count < len(results):
        sys.exit(1)

if __name__ == '__main__':
    main()
```

---

## Shared Patterns

### Idempotency Guards
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (lines 39-46, 53-63, 72-77, 90-119)
**Apply to:** All INSERT statements in migration 246

Three strategies — do not mix them:
1. `ON CONFLICT (external_id) DO NOTHING` — politicians only (unique constraint exists on external_id)
2. `WHERE NOT EXISTS (SELECT 1 FROM ... WHERE name = ...)` — governments and chambers (no unique constraint on geo_id)
3. `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = '...' AND district_type = '...' AND state = 'or')` — districts (no unique constraint on geo_id+district_type)

### state Casing Convention
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (header comments lines 15-19)
**Apply to:** All governments, districts, and offices INSERTs in migration 246
```sql
-- governments.state           = 'OR'  (UPPERCASE)
-- districts.state             = 'or'  (lowercase — routing queries match lowercase)
-- offices.representing_state  = 'OR'  (UPPERCASE)
```

### party = NULL (Antipartisan Design)
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (lines 86-87)
**Apply to:** Every politician INSERT in migration 246
```sql
party = NULL  -- antipartisan design; party may exist in DB but never displays
```

### office_id Back-Fill
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (lines 255-260)
**Apply to:** End of politician INSERT section in migration 246, before post-verification DO block
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN ( /* explicit list of all 31 external_ids */ )
  AND p.office_id IS NULL;
```

### photo type='default'
**Source:** `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` (lines 29-37)
**Apply to:** Every INSERT in migration 247 and every upload in `_tmp-cities-headshots.py`
```sql
type = 'default'   -- NOT 'headshot'; UI filters .find(img => img.type === 'default')
```

### Supabase Ledger Entry
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (lines 319-321)
**Apply to:** Migration 246 only (migration 247 is audit-only — no ledger entry)
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('246')
ON CONFLICT (version) DO NOTHING;
```

---

## No Analog Found

All four files have strong analogs. No files are without pattern coverage.

---

## Key Pitfalls (from RESEARCH.md — apply during planning)

| Pitfall | Impact | Rule |
|---------|--------|------|
| Gresham ward geofences (X0013–X0018) | Would create invalid custom geofences | Gresham is at-large; D-05 is OVERRIDDEN by research finding. No custom geofences needed. |
| `districts.state = 'OR'` (uppercase) | Routing silently broken — no LOCAL section in API | MUST be lowercase `'or'` |
| `slug` in chambers INSERT | SQL error — slug is GENERATED ALWAYS | Never include `slug` in chambers column list |
| `district_type='COUNTY'` for city rows | City officials appear in wrong section | Must be `'LOCAL'` (council) or `'LOCAL_EXEC'` (mayor) |
| `is_appointed_position=false` for WV/MP Mayor | Mayor incorrectly shown as directly elected | Wood Village + Maywood Park Mayors are council-selected — `is_appointed=true` + `is_appointed_position=true` |
| `type='headshot'` in politician_images | Photo silently invisible in UI | Must be `type='default'` |
| E'an Todd name encoding | SQL error or wrong character stored | Use `'E''an'` (escaped ASCII apostrophe); verify exact character from Fairview page source |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` and `C:/EV-Accounts/backend/scripts/`
**Key analogs read in full:**
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (lines 1-323)
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` (lines 1-86)
- `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts` (lines 1-336)
- `C:/EV-Accounts/backend/scripts/portland-headshots-process.py` (lines 1-342)
- `C:/Transparent Motivations/essentials/.planning/phases/83-multnomah-county-government-routing/83-PATTERNS.md` (full — Phase 83 canonical patterns)
**Pattern extraction date:** 2026-05-31
