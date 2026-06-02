# Phase 83: Multnomah County Government + Routing — Pattern Map

**Mapped:** 2026-05-31
**Files analyzed:** 3 new files
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` | migration | CRUD | `231_portland_officials.sql` + `222_or_government_chambers.sql` + `223_or_executive_officials.sql` | exact |
| `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` | migration (audit-only) | CRUD | `225_or_headshots.sql` | exact |
| `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts` | smoke test | request-response | `smoke-or-geofences.ts` + `smoke-portland-council-geofences.ts` | exact |

---

## Pattern Assignments

### `244_multnomah_county_government.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/231_portland_officials.sql`
**Supporting analogs:** `222_or_government_chambers.sql`, `223_or_executive_officials.sql`, `087_tx_schema_geo_id_state_county.sql`, `230_portland_government_structure.sql`

This migration is the most complex of the three. It seeds government row, chamber, district, politicians, offices, and office_id back-fill in a single transaction.

---

**File header and transaction wrapper pattern** (from `222_or_government_chambers.sql`, lines 1-40):
```sql
-- Migration 244: Multnomah County government + chamber + COUNTY district + 5 officials + offices
--
-- Purpose: Seeds Multnomah County Board of Commissioners under geo_id='41051'.
-- Geofence boundary (G4020, geo_id='41051') was loaded in Phase 72 — do NOT re-insert.
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS.
-- CRITICAL: districts.state must be 'or' (lowercase) for COUNTY type to match routing queries.
-- CRITICAL: governments.state = 'OR' (uppercase) — government table convention.

BEGIN;
```

---

**Pre-flight DO block pattern** (from `222_or_government_chambers.sql`, lines 42-52):
```sql
-- Pre-flight: assert State of Oregon government row does NOT already exist for Multnomah County
-- (guards against duplicate government rows; governments has no unique constraint on geo_id)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Multnomah County, Oregon, US') > 0 THEN
    RAISE NOTICE 'Multnomah County government row already exists — skipping government INSERT';
  END IF;
END $$;
```

---

**Government row INSERT pattern** (from `087_tx_schema_geo_id_state_county.sql`, lines 22-28):
```sql
-- County government row
INSERT INTO essentials.governments (name, type, state, city, geo_id)
VALUES ('Multnomah County, Oregon, US', 'County', 'OR', NULL, '41051');
-- ANTI: Do NOT use ON CONFLICT — no unique constraint exists on (name, state).
-- Use WHERE NOT EXISTS guard instead.
```

With WHERE NOT EXISTS guard (established pattern from `230_portland_government_structure.sql`, lines 39-46):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Multnomah County, Oregon, US',
       'County', 'OR', NULL, '41051'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Multnomah County, Oregon, US'
);
```

---

**Chamber INSERT pattern — slug GENERATED ALWAYS** (from `222_or_government_chambers.sql`, lines 54-64):
```sql
-- Board of Commissioners chamber
-- CRITICAL: slug is GENERATED ALWAYS — never include in INSERT column list
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of Commissioners',
       'Multnomah County Board of Commissioners',
       (SELECT id FROM essentials.governments WHERE name = 'Multnomah County, Oregon, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Commissioners'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Multnomah County, Oregon, US')
);
```

---

**COUNTY district INSERT pattern** (from `223_or_executive_officials.sql`, lines 52-59; adapted from STATE_EXEC to COUNTY):
```sql
-- COUNTY district row — geo_id='41051' matches the existing G4020 geofence_boundary from Phase 72.
-- DO NOT insert a geofence_boundaries row — it already exists.
-- state='or' LOWERCASE — matches routing query WHERE d.state = $1 (geocoder returns lowercase 'or').
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'or', '41051', 'Multnomah County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '41051' AND district_type = 'COUNTY' AND state = 'or'
);
```

---

**Politician + office CTE block pattern** (from `231_portland_officials.sql`, lines 40-69 — the canonical pattern for all 5 officials):
```sql
-- Repeat this pattern for each of the 5 officials (Chair + Commissioners D1-D4)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jessica Vega Pederson', 'Jessica', 'Vega Pederson', NULL,
          true, false, false, true, -410001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of Commissioners'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Multnomah County, Oregon, US')),
       p.id,
       'County Chair', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '41051'
  AND d.district_type = 'COUNTY'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

Note: `party = NULL` (antipartisan design — all Multnomah County offices are nonpartisan).
Note: All 5 offices use `is_appointed_position = false` (all popularly elected).
Note: `representing_state = 'OR'` (uppercase on offices, matching existing OR rows).

---

**External ID scheme** (from RESEARCH.md, Officials section):
```
Chair:          external_id = -410001
Commissioner D1: external_id = -410010
Commissioner D2: external_id = -410011
Commissioner D3: external_id = -410012
Commissioner D4: external_id = -410013
```

---

**office_id back-fill pattern** (from `231_portland_officials.sql`, lines 597-602):
```sql
-- Back-fill office_id on politicians rows for the 5 county officials
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -410013 AND -410001
  AND p.office_id IS NULL;
```

---

**Ledger entry pattern** (from `231_portland_officials.sql`, lines 607-610):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('244')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

**Section-split detector SQL** (from RESEARCH.md "Don't Hand-Roll" section — run inside migration or after):
```sql
-- Expected: 0 rows. Any row means geo_id='41051' has a geofence but no COUNTY districts row.
SELECT gb.geo_id
FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '41051'
  AND gb.mtfcc = 'G4020'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id
      AND d.district_type = 'COUNTY'
      AND d.state = 'or'
  );
```

---

### `245_multnomah_county_headshots.sql` (migration, audit-only CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/225_or_headshots.sql`

This is an AUDIT-ONLY migration documenting live politician_images INSERTs performed during headshot upload. It is NOT applied via the Supabase migration ledger — actual DB writes happen live via the headshot upload script.

---

**File header pattern** (from `225_or_headshots.sql`, lines 1-24):
```sql
-- Migration 245: Multnomah County Official Headshots
-- AUDIT-ONLY: captures the live politician_images INSERTs performed during Phase 83-03
-- execution on [date].
-- DO NOT apply via Supabase ledger — actual DB writes happened live.
-- This is AUDIT-ONLY in the same pattern as 225_or_headshots.sql, 200_sf_headshots.sql, etc.
--
-- 5 Multnomah County officials:
--   external_ids -410001..-410013 (Chair + Commissioners D1-D4)
--
-- Sources: multco.us official profile pages (public domain — government portraits)
-- Photo processing: crop to 4:5 from top-center, resize to 600x750 Lanczos q90.
-- Storage bucket: politician_photos; path: {politician_id}-headshot.jpg.
```

---

**politician_images INSERT pattern** (from `225_or_headshots.sql`, lines 32-40):
```sql
-- Vega Pederson (-410001) — source: multco.us/sites/default/files/...
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -410001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -410001)
);
```

Critical: `type = 'default'` (NOT 'headshot'). Results.jsx and Profile.jsx filter with `.find(img => img.type === 'default')`. Wrong type silently shows no photo.

---

### `scripts/smoke-multnomah-county.ts` (smoke test, request-response)

**Primary analog:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts`
**Supporting analog:** `C:/EV-Accounts/backend/scripts/smoke-portland-council-geofences.ts`

This smoke test verifies ROUTING-01: that Portland addresses return COUNTY officials AND the G4020 boundary, and that unincorporated addresses return G4020 but no G4110.

---

**File header and imports pattern** (from `smoke-or-geofences.ts`, lines 1-19):
```typescript
/**
 * smoke-multnomah-county.ts
 * Phase 83: Multnomah County routing smoke test
 *
 * Usage (from C:/EV-Accounts/backend):
 *   npx tsx scripts/smoke-multnomah-county.ts
 *
 * Verifies Phase 83 success criteria:
 *   SC1 — Portland City Hall returns 5 COUNTY officials from essentials.politicians
 *   SC2 — Unincorporated Multnomah County returns COUNTY officials (G4020 match)
 *   SC3 — Unincorporated address returns NO G4110 city boundary (no LOCAL section)
 *   SC4 — Section-split check: geo_id='41051' has COUNTY district row (0 orphans)
 */
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
```

---

**AddressTest interface + test data pattern** (from `smoke-or-geofences.ts`, lines 21-61):
```typescript
interface AddressTest {
  label: string;
  lon: number;
  lat: number;
  expectedMtfcc: string[];
  forbiddenMtfcc?: string[];
  expectedGeoIds?: Record<string, string>;
}

const TEST_ADDRESSES: AddressTest[] = [
  {
    // Portland City Hall — incorporated city inside Multnomah County
    // Expects BOTH G4020 (county, 41051) and G4110 (Portland city, 4159000)
    label: 'Portland OR City Hall',
    lon: -122.6794,
    lat: 45.5231,
    expectedMtfcc: ['G4020', 'G4110'],
    expectedGeoIds: {
      G4020: '41051',   // Multnomah County
      G4110: '4159000', // Portland city
    },
  },
  {
    // Corbett, OR — unincorporated Multnomah County (outside all G4110 city boundaries)
    // Expects G4020 ONLY for local tiers; G4110 must be ABSENT
    // Note: coordinate is ASSUMED — verify against DB before finalizing
    label: 'Corbett OR (unincorporated Multnomah County)',
    lon: -122.2,
    lat: 45.5,
    expectedMtfcc: ['G4020'],
    forbiddenMtfcc: ['G4110'],
  },
];
```

---

**Geofence boundary query pattern** (from `smoke-or-geofences.ts`, lines 63-77):
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

**COUNTY officials routing query** (new for Phase 83 — no prior analog exists; queries districts + offices join):
```typescript
// Query politicians returned for a COUNTY address via districtQueryText logic
async function queryCountyOfficials(
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
       AND d.district_type = 'COUNTY'
       AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
     ORDER BY p.full_name`,
    [lon, lat],
  );
  return res.rows;
}
```

---

**Client setup, error collection, and assertion pattern** (from `smoke-or-geofences.ts`, lines 79-100):
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
    // SC checks here...
  } finally {
    await client.end();
  }
  // ...
}
```

---

**Section-split check pattern** (from `smoke-portland-council-geofences.ts`, lines 119-140):
```typescript
// SC4: Section-split check — every G4020 geofence for geo_id='41051' has a matching COUNTY districts row
console.log('\n=== SC4: Section-split check (geo_id=\'41051\') ===');
const splitRes = await client.query<{ geo_id: string }>(`
  SELECT gb.geo_id
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '41051'
    AND gb.mtfcc = 'G4020'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type = 'COUNTY'
        AND d.state = 'or'
    )
`);
if (splitRes.rows.length > 0) {
  const msg = `SC4 FAIL: section-split orphan for geo_id='41051' — COUNTY district row missing`;
  console.log(`  FAIL: ${msg}`);
  errors.push(msg);
  allPassed = false;
} else {
  console.log('  SC4: Section-split check OK (COUNTY district row present for geo_id=\'41051\')');
}
```

---

**Final result pattern** (from `smoke-or-geofences.ts`, lines 229-250):
```typescript
  console.log('\n=== Smoke Test Results ===');
  if (allPassed) {
    console.log('ALL ASSERTIONS PASSED');
    console.log('\nPhase 83 success criteria:');
    console.log('  SC1: Portland City Hall returns 5 COUNTY officials [PASS]');
    console.log('  SC2: Unincorporated Multnomah returns COUNTY officials [PASS]');
    console.log('  SC3: Unincorporated address has NO G4110 boundary [PASS]');
    console.log('  SC4: Section-split check — 0 orphans [PASS]');
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

## Shared Patterns

### Idempotency Guards
**Source:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` (lines 54-64) and `230_portland_government_structure.sql` (lines 39-46)
**Apply to:** All INSERT statements in migration 244

Three guard strategies used in this codebase:
1. `ON CONFLICT (external_id) DO NOTHING` — for `essentials.politicians` (unique constraint on external_id)
2. `WHERE NOT EXISTS (SELECT 1 FROM ... WHERE name = ...)` — for governments, chambers (no unique constraint on geo_id)
3. `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id = '41051' AND district_type = 'COUNTY' AND state = 'or')` — for districts (no unique constraint on geo_id+district_type)

### state Casing Convention
**Source:** `C:/EV-Accounts/backend/migrations/230_portland_government_structure.sql` (lines 20-23 comment block)
**Apply to:** All `essentials.governments` and `essentials.districts` INSERTs in migration 244

```sql
-- governments.state = 'OR'  (UPPERCASE — government table convention for all states)
-- districts.state   = 'or'  (lowercase — matches OR TIGER loader; routing queries use lowercase)
-- offices.representing_state = 'OR'  (UPPERCASE — matches all OR officials seeded in migrations 223-231)
```

### party = NULL (Antipartisan Design)
**Source:** `C:/EV-Accounts/backend/migrations/231_portland_officials.sql` (lines 45-46)
**Apply to:** All politician INSERTs in migration 244

```sql
-- party = NULL for all Multnomah County officials
-- (antipartisan design: party may exist in DB but must never display; county offices are nonpartisan)
```

### office_id Back-Fill
**Source:** `C:/EV-Accounts/backend/migrations/231_portland_officials.sql` (lines 597-602)
**Apply to:** End of politician INSERT section in migration 244

```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -410013 AND -410001
  AND p.office_id IS NULL;
```

### Supabase Ledger Entry
**Source:** `C:/EV-Accounts/backend/migrations/231_portland_officials.sql` (lines 607-610)
**Apply to:** Both migration 244 and 245

```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('244')  -- or '245'
ON CONFLICT (version) DO NOTHING;
```

---

## No Analog Found

All three files have strong analogs. No files are without pattern coverage.

| File | Role | Data Flow | Notes |
|------|------|-----------|-------|
| COUNTY officials routing query in smoke test | smoke test utility | request-response | The geofence boundary query has a direct analog; the COUNTY politicians routing query (joining districts + offices + geofence_boundaries) is novel but straightforward SQL. No prior smoke test queries politicians directly. |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (all 244 migration files) and `C:/EV-Accounts/backend/scripts/smoke-*.ts` (14 smoke test files)
**Files scanned:** 244 migrations + 14 smoke scripts
**Key analogs read in full:** `087_tx_schema_geo_id_state_county.sql`, `088_tx_tier1_cities.sql`, `222_or_government_chambers.sql`, `223_or_executive_officials.sql`, `225_or_headshots.sql`, `230_portland_government_structure.sql`, `231_portland_officials.sql`, `smoke-or-geofences.ts`, `smoke-portland-council-geofences.ts`, `_tmp-fremont-headshots.ts`
**Pattern extraction date:** 2026-05-31
