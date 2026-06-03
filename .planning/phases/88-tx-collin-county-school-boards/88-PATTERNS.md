# Phase 88: TX Collin County School Boards - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 3 new files
**Analogs found:** 3 / 3

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-tx-school-boundaries.ts` | utility script | file-I/O (TIGER shapefile → DB insert) | `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` | exact |
| `C:/EV-Accounts/backend/migrations/261_tx_collin_county_school_boards.sql` | migration | CRUD (batch seed) | `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` | exact |
| `C:/EV-Accounts/backend/migrations/262_tx_collin_county_school_headshots.sql` | migration | CRUD (audit-only) | `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql` | exact |

---

## Pattern Assignments

### `C:/EV-Accounts/backend/scripts/load-tx-school-boundaries.ts` (utility script, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts`

This file is a direct copy of the OR loader with 5 substitutions. The entire file is the pattern — copy it verbatim and apply only these changes:

**Imports pattern** (lines 21-27 of analog — unchanged, copy exactly):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import * as shapefile from 'shapefile';
```

**Config block** (lines 29-51 of analog — apply all 5 substitutions here):
```typescript
// ─── Config ───────────────────────────────────────────────────────────────────

const TIGER_URL    = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_48_unsd.zip'; // 41→48
const MTFCC        = 'G5420';
const STATE        = '48';           // Texas FIPS — geofence_boundaries.state convention
const SOURCE       = 'tiger_unsd_tx_2024';  // or→tx
const EXPECTED_COUNT = 5;            // 6 OR districts → 5 TX ISDs

const TARGET_GEOIDS = new Map<string, string>([
  ['4835100', 'Plano Independent School District'],
  ['4829850', 'McKinney Independent School District'],
  ['4807890', 'Allen Independent School District'],
  ['4820010', 'Frisco Independent School District'],
  ['4837020', 'Richardson Independent School District'],
]);

const DRY_RUN = process.argv.includes('--dry-run');

const baseName = 'tl_2024_48_unsd';         // 41→48
const tmpRoot  = path.join(process.cwd(), '.tmp-tx-school-unsd');  // or→tx
const zipPath  = path.join(tmpRoot, `${baseName}.zip`);
const destDir  = path.join(tmpRoot, baseName);
```

**DB pool pattern** (lines 57-65 of analog — unchanged, copy exactly):
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

**Core shapefile processing pattern** (lines 149-184 of analog — unchanged, the GEOID field detection and TARGET_GEOIDS filter logic copies verbatim):
```typescript
// Log field names on first feature for diagnostic purposes (Pitfall 6)
if (firstFeature) {
  firstFeature = false;
  const fieldNames = Object.keys(props);
  console.log(`\n  Shapefile fields (first feature): ${fieldNames.join(', ')}`);
  if (!fieldNames.includes('GEOID')) {
    console.error(`ERROR: 'GEOID' field not found in shapefile. Available: ${fieldNames.join(', ')}`);
    process.exit(1);
  }
}

// TIGER 2024 UNSD uses 'GEOID' field — confirmed by load-state-tiger-boundaries.ts LAYER_DISPATCH.unsd
const geoid = String(props['GEOID'] ?? '');
if (!TARGET_GEOIDS.has(geoid)) {
  result = await source.read();
  continue;
}
```

**DB insert pattern** (lines 210-219 of analog — unchanged, copy exactly):
```typescript
const insertResult = await pool.query(`
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

**Post-insert verification pattern** (lines 241-253 of analog — unchanged, copy exactly):
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

**Error + cleanup pattern** (lines 256-268 of analog — change label string only):
```typescript
main()
  .catch((err) => {
    console.error('[load-tx-school-boundaries] Fatal error:', err);
    process.exit(1);
  })
  .finally(() => void pool.end());
```

**Usage comment at top of file** (update from OR to TX):
```
 * Usage (from C:/EV-Accounts/backend):
 *   npx tsx scripts/load-tx-school-boundaries.ts --dry-run
 *   npx tsx scripts/load-tx-school-boundaries.ts
```

**Summary of substitutions (complete list):**
| OR value | TX value | Location |
|----------|----------|----------|
| `tl_2024_41_unsd.zip` | `tl_2024_48_unsd.zip` | TIGER_URL |
| `'41'` | `'48'` | STATE constant |
| `'tiger_unsd_or_2024'` | `'tiger_unsd_tx_2024'` | SOURCE constant |
| `6` | `5` | EXPECTED_COUNT |
| 6-entry OR TARGET_GEOIDS Map | 5-entry TX TARGET_GEOIDS Map | TARGET_GEOIDS |
| `'tl_2024_41_unsd'` | `'tl_2024_48_unsd'` | baseName |
| `'.tmp-or-school-unsd'` | `'.tmp-tx-school-unsd'` | tmpRoot |
| `[load-or-school-boundaries]` | `[load-tx-school-boundaries]` | console.log labels |
| `OR school district` (log message) | `TX school district` | post-verify log |
| `Fetching OR UNSD boundaries` | `Fetching TX UNSD boundaries` | main() log |

**Everything else in the file copies verbatim** — helpers `downloadWithRedirects` and `extractZip`, the shapefile open/read loop logic, the GEOID assertion, the insert/skip counting, the cleanup pattern, and the `.finally()` pool end.

---

### `C:/EV-Accounts/backend/migrations/261_tx_collin_county_school_boards.sql` (migration, CRUD batch seed)

**Analog:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql`

This file copies the exact 7-step structure of migration 257. Apply these substitutions throughout:

**Global substitution map:**
| CA value | TX value |
|----------|----------|
| `'CA'` | `'TX'` (governments.state, offices.representing_state) |
| `'ca'` | `'tx'` (districts.state — LOWERCASE) |
| `'06'` (FIPS in any GEOID prefix) | `'48'` (not used directly; GEOIDs are standalone) |
| `-870001..-870034` | `-880001..-880035` |
| `257` | `261` |
| `California` | `Texas` |
| `Board of Education` | `Board of Trustees` (TX ISD standard) |
| 6 CA GEOIDs | 5 TX GEOIDs |
| `Migration 257` | `Migration 261` |

**File header comment** (lines 1-36 of analog — adapt to TX):
```sql
-- Migration 261: TX Collin County school board government + chambers + SCHOOL districts + officials + offices
--
-- Purpose: Seeds 5 TX Collin County ISDs:
--   Plano ISD        (geo_id='4835100') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   McKinney ISD     (geo_id='4829850') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   Allen ISD        (geo_id='4807890') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   Frisco ISD       (geo_id='4820010') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
--   Richardson ISD   (geo_id='4837020') — 1 gov + 1 chamber + 1 SCHOOL district + 7 officials
-- Totals: 5 governments, 5 chambers, 5 districts, 35 politicians, 35 offices
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'tx' (lowercase) to match routing queries.
-- CRITICAL: governments.state = 'TX' (uppercase). offices.representing_state = 'TX' (uppercase).
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT').
-- CRITICAL: All 5 G5420 geofence_boundaries rows must exist before this migration (run loader first).
-- CRITICAL: party=NULL on all 35 politicians (antipartisan).
-- CRITICAL: is_appointed=false, is_appointed_position=false on all (elected board members).
-- CRITICAL: Save this file as UTF-8 to preserve é character (Debbie Rentería — Richardson ISD).
-- CRITICAL: Richardson ISD uses hybrid seat structure — Districts 1-5 + At-Large Places 6-7.
--           Use 'Board Member, District [N]' for Districts 1-5 and 'Board Member, Place [N]' for At-Large 6-7.
--
-- Coverage gap note (D-16): Residents in smaller Collin County ISDs (Prosper, Wylie, Celina, Lovejoy,
-- Princeton, etc.) will not see a SCHOOL section in Phase 88. A future phase could add these if needed.
```

**Pre-flight 1: government names** (lines 43-56 of analog — adapt to 5 TX names):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name IN (
        'Plano Independent School District, Texas, US',
        'McKinney Independent School District, Texas, US',
        'Allen Independent School District, Texas, US',
        'Frisco Independent School District, Texas, US',
        'Richardson Independent School District, Texas, US'
      )) > 0 THEN
    RAISE EXCEPTION 'Migration 261 already applied — aborting re-run';
  END IF;
END $$;
```

**Pre-flight 2: external_id block** (lines 61-70 of analog — adapt to -880035..-880001):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -880035 AND -880001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -880001..-880035 is not clear (% rows found)', v_count;
  END IF;
END $$;
```

**Pre-flight 3: geofences** (lines 75-85 of analog — adapt to 5 TX GEOIDs):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id IN ('4835100','4829850','4807890','4820010','4837020')
    AND mtfcc = 'G5420';
  IF v_count <> 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: expected 5 G5420 geofence rows, found % (run load-tx-school-boundaries.ts first)', v_count;
  END IF;
END $$;
```

**Step 1: Government rows pattern** (lines 94-146 of analog — one per ISD, WHERE NOT EXISTS guard, state='TX' uppercase):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Plano Independent School District, Texas, US',
       'LOCAL', 'TX', NULL, '4835100'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Plano Independent School District, Texas, US'
);
-- [repeat for McKinney, Allen, Frisco, Richardson]
```

**Step 2: Chamber rows pattern** (lines 154-224 of analog — one per ISD, NO slug column, WHERE NOT EXISTS):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of Trustees',
       'Plano Independent School District Board of Trustees',
       (SELECT id FROM essentials.governments WHERE name = 'Plano Independent School District, Texas, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Trustees'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Plano Independent School District, Texas, US')
);
-- [repeat for McKinney, Allen, Frisco, Richardson]
```

**Step 3: District rows pattern** (lines 234-274 of analog — state='tx' LOWERCASE, district_type='SCHOOL', mtfcc='G5420'):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'tx', '4835100', 'Plano Independent School District', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4835100' AND district_type = 'SCHOOL' AND state = 'tx'
);
-- [repeat for McKinney, Allen, Frisco, Richardson]
```

**Step 4: Politician + office blocks pattern** (lines 295-324 of analog — WITH CTE pattern, one block per member):
```sql
-- BLOCK [N]: [Full Name] (Place [N]) — -880001
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '[Full Name]', '[First]', '[Last]', NULL,
          true, false, false, true, -880001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of Trustees'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Plano Independent School District, Texas, US')),
       p.id,
       'Board Member, Place 1', 'TX', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4835100'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'tx'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Richardson ISD hybrid title deviation** (office title varies by seat type — ONLY for Richardson):
```sql
-- Single-Member District members (Districts 1-5):
'Board Member, District 1'  -- through District 5
-- At-Large members (Places 6-7):
'Board Member, Place 6'     -- and Place 7
```

**Step 5: office_id back-fill** (lines 1431-1436 of analog — adapt range):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -880035 AND -880001
  AND p.office_id IS NULL;
```

**Step 6: Post-verification DO block** (lines 1449-1546 of analog — all gates adapt to 5/35/5 TX values):
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
  -- Gate (a): 5 government rows
  -- Gate (b): 5 Board of Trustees chambers
  -- Gate (c): 5 SCHOOL district rows (state='tx', GEOIDs='4835100' etc.)
  -- Gate (d): 35 politicians in -880035..-880001
  -- Gate (e): 35 offices linked to SCHOOL districts
  -- Gate (f): section-split = 0 (all 5 G5420 geofences have SCHOOL district rows)
  -- Gate (g): 0 NULL office_id in -880035..-880001 range
  RAISE NOTICE 'Migration 261 post-verification PASSED: 5 govs, 5 chambers, 5 SCHOOL districts, 35 politicians, 35 offices, section-split=0, office_id back-fill complete';
END $$;
```

**Step 7: Migration ledger entry** (lines 1551-1553 of analog — version '261'):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('261')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

**External ID allocation** (per RESEARCH.md):
```
Plano ISD:     -880001 to -880007  (Places 1-7)
McKinney ISD:  -880008 to -880014  (Places 1-7)
Allen ISD:     -880015 to -880021  (Places 1-7)
Frisco ISD:    -880022 to -880028  (Places 1-7)
Richardson ISD:-880029 to -880035  (Districts 1-5, At-Large 6-7)
```

---

### `C:/EV-Accounts/backend/migrations/262_tx_collin_county_school_headshots.sql` (migration, audit-only)

**Analog:** `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql`

**Safety guard** (lines 26-29 of analog — copy exactly, adapt migration number):
```sql
DO $$
BEGIN
  RAISE EXCEPTION 'Migration 262 is AUDIT-ONLY and must not be applied. Actual DB writes happened live via headshot processing script.';
END $$;
```

**Header comment pattern** (lines 1-24 of analog — adapt to TX):
```sql
-- Migration 262: TX Collin County School Board Member Headshots
-- AUDIT-ONLY: captures the live politician_images INSERTs performed during Phase 88-02
-- execution on [date].
-- DO NOT apply via Supabase ledger -- actual DB writes happen live via headshot upload script.
-- Pattern matches 258_ca_city_school_headshots.sql / 255_or_school_headshots.sql.
--
-- 35 officials documented across 5 ISDs:
--   Plano ISD    (7 officials, external_ids -880001..-880007)
--   McKinney ISD (7 officials, external_ids -880008..-880014)
--   Allen ISD    (7 officials, external_ids -880015..-880021)
--   Frisco ISD   (7 officials, external_ids -880022..-880028)
--   Richardson ISD (7 officials, external_ids -880029..-880035)
```

**INSERT pattern per official who has a photo** (lines 38-47 of analog — copy this pattern exactly for each upload):
```sql
-- [Full Name] (-880001) — Board Member, Place 1
-- source: [original URL from ISD website]
-- original: [dimensions] [format] ([crop description])
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -880001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/' ||
         (SELECT id FROM essentials.politicians WHERE external_id = -880001)::text || '-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -880001)
);
```

**No-photo comment pattern** (lines 309-313 of analog — use this for any official with no photo found):
```sql
-- [Full Name] (-880XXX): No photo found on official ISD website.
-- [URL checked]: [official board page URL]
```

**Known headshot sources per ISD** (from RESEARCH.md):
```
Frisco ISD (VERIFIED):
  URL pattern: https://www.friscoisd.org/images/default-source/board-members/[lastname].jpg?sfvrsn=[version]
  Examples: davis.jpg, maddox.jpg, hill.jpg, manduva.jpg, sample.jpg, elad.jpg, salas.jpg

Richardson ISD (VERIFIED):
  URL pattern: https://web.risd.org/board/wp-content/uploads/[FirstNameLastInitial].jpg
  Examples: ChrisP.jpg, RachelM-1.jpg, DebbieR.jpg, MeganT.jpg, VanessaP.jpg, ReginaH.jpg, EricE.jpg

Plano ISD: Finalsite CDN (resources.finalsite.net) — check each profile at pisd.edu/about-our-district/board-of-trustees/trustee-profiles/[name]-profile [ASSUMED]

McKinney ISD: Thrillshare CMS at mckinneyisd.net — check board page manually [ASSUMED]

Allen ISD: Finalsite CMS at allenisd.org — check board page manually [ASSUMED]
```

---

## Shared Patterns

### Idempotency Guard — governments table
**Source:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` lines 94-101
**Apply to:** All government INSERT statements in migration 261
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), '[name]', 'LOCAL', 'TX', NULL, '[geo_id]'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = '[name]'
);
```
Rationale: `essentials.governments` has NO unique constraint on `(name, geo_id)`. ON CONFLICT would fail.

### Idempotency Guard — chambers table (NO slug column)
**Source:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` lines 154-164
**Apply to:** All chamber INSERT statements in migration 261
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), '[name]', '[name_formal]', (SELECT id FROM essentials.governments WHERE name = '[gov_name]')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = '[name]' AND government_id = (SELECT id FROM essentials.governments WHERE name = '[gov_name]')
);
```
CRITICAL: `slug` is GENERATED ALWAYS — never list it in the INSERT column list.

### Politician + Office CTE Pattern
**Source:** `C:/EV-Accounts/backend/migrations/257_ca_city_school_boards.sql` lines 295-324
**Apply to:** All 35 member blocks in migration 261
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '[name]', '[first]', '[last]', NULL, true, false, false, true, [ext_id])
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Board of Trustees'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = '[gov_name]')),
       p.id, '[office title]', 'TX', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '[geo_id]'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'tx'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Geofence Insert with PostGIS
**Source:** `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` lines 210-219
**Apply to:** `load-tx-school-boundaries.ts` DB insert block
```typescript
public.ST_ForcePolygonCCW(
  public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
)
```

### politician_images INSERT pattern
**Source:** `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql` lines 38-47
**Apply to:** All headshot INSERT statements in migration 262
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = [ext_id]),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/' ||
         (SELECT id FROM essentials.politicians WHERE external_id = [ext_id])::text || '-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = [ext_id])
);
```
CRITICAL: `type` must be `'default'` — UI filters with `.find(img => img.type === 'default')`.

---

## State Casing Reference (shared across all 3 files)

| Field | Value | Table |
|-------|-------|-------|
| `geofence_boundaries.state` | `'48'` | FIPS numeric |
| `governments.state` | `'TX'` | uppercase abbreviation |
| `offices.representing_state` | `'TX'` | uppercase abbreviation |
| `districts.state` | `'tx'` | LOWERCASE abbreviation — routing query convention |

Wrong casing on `districts.state` is Pitfall 3 — it breaks the essentialsService.ts routing and causes the SCHOOL section to silently not appear.

---

## No Analog Found

None — all 3 files have exact analogs in the codebase.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`, `C:/EV-Accounts/backend/migrations/`
**Files scanned:** 3 analog files read in full
**Pattern extraction date:** 2026-06-02
