# Phase 176: City of Beaverton Deep-Seed - Pattern Map

**Mapped:** 2026-07-01
**Files analyzed:** 9 (1 structural migration, 1 headshot migration, 7 stance migrations, 1 headshot script, 1 coverage.js edit)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1131_beaverton_city_council.sql` | migration | CRUD | `migrations/246_multnomah_cities_government.sql` lines 42–308 (Gresham block) | exact |
| `C:/EV-Accounts/backend/migrations/1132_beaverton_headshots.sql` | migration | CRUD | `migrations/1121_washco_commission_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1133_beaty_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1134_hartmeier_prigg_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | role-match |
| `C:/EV-Accounts/backend/migrations/1135_teater_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | role-match |
| `C:/EV-Accounts/backend/migrations/1136_kimmi_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | role-match |
| `C:/EV-Accounts/backend/migrations/1137_tivnon_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | role-match |
| `C:/EV-Accounts/backend/migrations/1138_dugger_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | role-match |
| `C:/EV-Accounts/backend/migrations/1139_hasan_stances.sql` | migration | CRUD | `migrations/1122_washco_harrington_stances.sql` | role-match |
| `C:/EV-Accounts/backend/scripts/_tmp-beaverton-headshots.py` | utility | file-I/O | `scripts/_tmp-washco-headshots.py` | exact |
| `C:\Transparent Motivations\essentials\src\lib\coverage.js` (edit) | config | transform | `src/lib/coverage.js` lines 96–104 (Oregon block) | exact |

---

## Pattern Assignments

### `1131_beaverton_city_council.sql` (structural migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` — Gresham block (lines 1–308 and post-verification lines 1289–1426)

**Pre-flight hard-abort guard** (lines 22–38):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Beaverton, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1131 already applied — aborting re-run';
  END IF;
END $$;
```

**Government row** (lines 48–55, Gresham pattern):
```sql
-- type='LOCAL', state='OR' (uppercase), slug GENERATED ALWAYS — never INSERT slug
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Beaverton, Oregon, US',
       'LOCAL', 'OR', 'Beaverton', '4105350'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Beaverton, Oregon, US'
);
```

**Chamber row** (lines 57–68, Gresham pattern):
```sql
-- slug GENERATED ALWAYS — never include in INSERT column list
-- official_count=7 added to chambers (column present; Gresham omitted it but later phases set it)
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Beaverton City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Beaverton, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Beaverton, Oregon, US')
);
```

**LOCAL_EXEC district — Mayor (citywide)** (lines 70–76, Gresham pattern):
```sql
-- state='or' LOWERCASE for LOCAL/LOCAL_EXEC types — critical for routing
-- mtfcc=NULL (city G4110 geofence already loaded; no new boundary needed)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4105350', 'Beaverton (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4105350' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

**LOCAL at-large district — all 6 councilors** (lines 78–84, Gresham pattern):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4105350', 'Beaverton (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4105350' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Mayor office block** (lines 86–116, Gresham Mayor pattern — directly elected):
```sql
-- is_appointed=false on politician; is_appointed_position=false on office (directly elected)
-- ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active
-- Office guard: NOT EXISTS (district_id, politician_id)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Lacey Beaty', 'Lacey', 'Beaty', NULL,
          true, false, false, true, -4105351)
  ON CONFLICT (external_id) DO UPDATE
    SET is_active = EXCLUDED.is_active
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
                               WHERE name = 'City of Beaverton, Oregon, US')),
       p.id,
       'Mayor', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4105350'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Councilor office block** (lines 118–308, Gresham Position 1–6 pattern — repeat 6 times):
```sql
-- All 6 on LOCAL (not LOCAL_EXEC) district; title='Council Member (Position N)'
-- ext_ids: -4105352 (Pos 1) through -4105357 (Pos 6)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Ashley Hartmeier-Prigg', 'Ashley', 'Hartmeier-Prigg', NULL,
          true, false, false, true, -4105352)
  ON CONFLICT (external_id) DO UPDATE
    SET is_active = EXCLUDED.is_active
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
                               WHERE name = 'City of Beaverton, Oregon, US')),
       p.id,
       'Council Member (Position 1)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4105350'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**office_id back-fill** (lines 1274–1285, Gresham tail pattern):
```sql
-- Explicit IN list; WHERE p.office_id IS NULL for idempotency
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4105351,-4105352,-4105353,-4105354,-4105355,-4105356,-4105357
  )
  AND p.office_id IS NULL;
```

**Post-verification DO block** (lines 1297–1416, Gresham pattern — adapt for single city):
```sql
DO $$
DECLARE
  v_gov_count    INTEGER;
  v_office_count INTEGER;
  v_split_count  INTEGER;
  v_null_count   INTEGER;
BEGIN
  -- Gate (a): government row count = 1
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Beaverton, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Beaverton gov_count=%, expected 1', v_gov_count;
  END IF;

  -- Gate (b): offices linked to LOCAL/LOCAL_EXEC districts = 7
  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4105350'
    AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
    AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Beaverton office_count=%, expected 7', v_office_count;
  END IF;

  -- Gate (c): section-split — G4110 geo_id must have LOCAL+LOCAL_EXEC districts
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '4105350'
    AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
        AND d.state = 'or'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split returned % orphan rows', v_split_count;
  END IF;

  -- Gate (d): office_id back-fill — 0 NULLs
  SELECT COUNT(*) INTO v_null_count FROM essentials.politicians
  WHERE external_id IN (-4105351,-4105352,-4105353,-4105354,-4105355,-4105356,-4105357)
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id', v_null_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, offices=%, split=0, office_id nulls=0',
    v_gov_count, v_office_count;
END $$;
```

**Ledger entry** (lines 1422–1424):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1131')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `1132_beaverton_headshots.sql` (audit-only headshot migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1121_washco_commission_headshots.sql` (entire file, 93 lines)

**File header** (lines 1–29):
```sql
-- Migration 1132: City of Beaverton City Council Headshots
-- AUDIT-ONLY: captures the live politician_images INSERTs performed during Phase 176-02
-- execution after scripts/_tmp-beaverton-headshots.py uploads to Supabase Storage.
-- DO NOT register in supabase_migrations.schema_migrations — audit-only pattern
-- (same as 1121_washco_commission_headshots.sql, 245_multnomah_county_headshots.sql).
-- Apply via: psql "$DATABASE_URL" -f migrations/1132_beaverton_headshots.sql
--
-- 7 City of Beaverton officials:
--   external_id -4105351 -- Lacey Beaty (Mayor)
--   external_id -4105352 -- Ashley Hartmeier-Prigg (Council Position 1)
--   ... through -4105357 -- Nadia Hasan (Council Position 6)
--
-- politician_images schema: id, politician_id, url, type, photo_license
-- NO photo_origin_url column — verified from mig 245/1121.
```

**Per-official INSERT pattern** (lines 36–44 of mig 1121):
```sql
-- One block per official. uuid filled from headshot script manifest.
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4105351),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'cc_by_2.0'   -- Mayor Beaty (Wikimedia CC BY 2.0)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4105351)
);
```
Note: `photo_license` varies per official source. Mayor Beaty (Wikimedia CC BY 2.0) uses `'cc_by_2.0'`; official city portal photos use `'press_use'`; `NOT EXISTS` guard on every row.

---

### `1133_beaty_stances.sql` through `1139_hasan_stances.sql` (stance migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1122_washco_harrington_stances.sql` (entire file, 53 lines)

**File header** (lines 1–12):
```sql
-- Migration 1133: City of Beaverton stances - Lacey Beaty (Mayor) (AUDIT-ONLY)
--
-- Phase 176 (WASH-02). AUDIT-ONLY: NOT registered in the migration ledger.
-- Evidence-only compass stances (CHAIRS model — value is the discrete position
-- the evidence matches, not a polarity). 100% cited; every stance carries
-- reasoning + source URL(s). Topics with no evidence are honest blanks (absent).
-- No defaulted values. topic_id resolved LIVE by topic_key (is_live=true) —
-- no hardcoded topic UUIDs. politician_id resolved from external_id at apply time
-- but hardcoded UUID matches what structural migration 1131 minted.
```

**Core stance CTE pattern** (lines 15–50 of mig 1122 — the entire operative body):
```sql
BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('housing'::text, 3, 'Evidence text here...', ARRAY['https://source1.url','https://source2.url']::text[]),
    ('homelessness'::text, 2, 'Evidence text...', ARRAY['https://source.url']::text[]),
    -- ... repeat for each topic with evidence; omit topics with no evidence entirely
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct
    ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '{politician_uuid}'::uuid, topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
  SELECT '{politician_uuid}'::uuid, topic_id, reasoning, sources FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE
    SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
```

**Critical rules from analog:**
- `politician_id` is the UUID minted by structural migration 1131 (looked up from `external_id` after apply; then hardcoded in the stance file)
- `val` is an integer 1–5 (chairs model); blank spoke = omit the row entirely
- `topic_id` is resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true` — never hardcode a topic UUID
- `ON CONFLICT (politician_id, topic_id) DO UPDATE` on both `politician_answers` and `politician_context`
- One migration file per official (7 files: 1133–1139)

---

### `C:/EV-Accounts/backend/scripts/_tmp-beaverton-headshots.py` (utility, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-washco-headshots.py` (entire file, 400 lines)

**Module docstring pattern** (lines 1–38 of washco analog):
```python
"""
_tmp-beaverton-headshots.py
Download, crop, resize, and upload headshots for the 7 City of Beaverton
City Council members (Mayor + Positions 1-6) to Supabase Storage bucket
'politician_photos'.

Phase 176 Plan 02 — WASH-02 (headshot portion).

ORCHESTRATION NOTE:
  Running this script is the INLINE-ORCHESTRATOR step, NOT the executor's.
  The executor only WRITES this file to disk. The orchestrator runs it,
  then applies audit headshot migration 1132 after the pipeline emits its
  manifest. This is a gitignored _tmp-* helper — do NOT commit it.

Processing pipeline (per feedback_headshot_resize_no_distort.md, crop-first):
  1. Resolve politician UUID at RUNTIME by external_id (psycopg2).
  2. Download the portrait from the per-member source URL.
  3. Composite onto white if transparent (PNG/RGBA).
  4. CROP to 4:5 ratio FIRST — never stretch.
  5. RESIZE to 600x750 Lanczos q90.
  6. Upload to politician_photos/{uuid}-headshot.jpg via PUT x-upsert: true.
  7. Reject any image with superimposed text/graphics over the face.
"""
```

**OFFICIALS roster pattern** (lines 56–100 of washco analog):
```python
OFFICIALS = [
    {
        'ext_id': -4105351,
        'name': 'Lacey Beaty',
        'url': 'https://commons.wikimedia.org/wiki/Special:FilePath/Mayor_Lacey_Beaty_crop.jpg',
        'license': 'cc_by_2.0',
        # Mayor; Wikimedia CC BY 2.0, 1000x1400px Oregon National Guard photo.
        # Fallback: beavertonoregon.gov/mayor page body (CivicPlus UUID, JS-rendered)
    },
    {
        'ext_id': -4105352,
        'name': 'Ashley Hartmeier-Prigg',
        'url': '',  # fill at execution from beavertonoregon.gov or campaign site
        'license': 'press_use',
    },
    # ... 5 more entries through -4105357 Nadia Hasan
]

assert len(OFFICIALS) == 7, f'Expected 7 officials, got {len(OFFICIALS)}'
assert len({m["ext_id"] for m in OFFICIALS}) == 7, 'external_ids must be unique'
```

**Config block** (lines 112–139 of washco analog — copy verbatim, rename vars):
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
DESCRIPTIVE_HEADERS = {
    'User-Agent': 'EmpoweredVote/1.0 (headshot-pipeline; contact alincoln@empowered.vote)',
    'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
}
```

**crop_to_4_5 and resize_600x750 functions** (lines 206–240 of washco analog — copy verbatim):
The `crop_to_4_5` function implements center-horizontal crop for landscape/square sources and top-crop for portrait sources taller than 4:5. The `resize_600x750` function uses `Image.Resampling.LANCZOS`. `process_headshot_bytes` calls crop FIRST, then resize — order is mandatory.

**process_headshot_bytes transparent-composite guard** (lines 265–297 of washco analog):
```python
if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
    rgba = img.convert('RGBA')
    bg = Image.new('RGB', rgba.size, (255, 255, 255))
    bg.paste(rgba, mask=rgba.split()[-1])
    img = bg
elif img.mode != 'RGB':
    img = img.convert('RGB')
```

**Manifest output pattern** (lines 383–396 of washco analog):
```python
print('=== BEAVERTON CITY COUNCIL HEADSHOT MANIFEST ===')
for r in results:
    if r['success']:
        print(f'SUCCESS: {r["ext_id"]} {r["name"]} {r["uuid"]} -> {r["cdn_url"]} [license={r["license"]}]')
    else:
        print(f'FAILED (GAP): {r["ext_id"]} {r["name"]} -- {r["error"]}')
print(f'{len(successes)}/7 uploaded, {len(failures)} gaps (gaps omitted from migration 1132)')
```

---

### `src/lib/coverage.js` (config edit — add Beaverton to Oregon block)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\coverage.js` lines 96–104 (the existing Oregon block)

**Current Oregon block** (lines 96–104):
```js
  {
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Fairview',    browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Gresham',     browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Maywood Park',browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',    browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',   browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Wood Village',browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
```

**Required edit — insert Beaverton as FIRST entry (alphabetically before Fairview):**
```js
  {
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',   browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',    browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Gresham',     browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Maywood Park',browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',    browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',   browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Wood Village',browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
```

`hasContext: true` is correct once at least one stance row exists for a Beaverton official. `browseGovernmentList: ['4105350']` is the city geo_id (NOT `'4105000'`). The browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4105350&browse_mtfcc=G4110`.

---

## Shared Patterns

### OR State/Casing Rules (apply to migration 1131)
**Source:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` lines 11–19 (comment block) and confirmed throughout the Gresham block.

| Context | Casing | Why |
|---|---|---|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder return |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `politicians.party` | `NULL` | Antipartisan — never set |

### Idempotency Guards (apply to migration 1131)
**Source:** `migrations/244_multnomah_county_government.sql` lines 39–46; `migrations/246` lines 48–55.
- `governments`: always `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no unique constraint on geo_id
- `chambers`: `WHERE NOT EXISTS` on `(name, government_id)`
- `districts`: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`
- `offices`: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)`
- `politicians`: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`

### Slug Never Inserted (apply to migration 1131)
**Source:** `migrations/246` line 11 (critical comment) and lines 57–68 (chambers INSERT omits slug column).
`essentials.chambers` has slug as a GENERATED ALWAYS column. Never include `slug` in the INSERT column list — migration will fail with a generated column error.

### photo_origin_url Does Not Exist (apply to migration 1132)
**Source:** `migrations/245_multnomah_county_headshots.sql` and `migrations/1121_washco_commission_headshots.sql` — `politician_images` INSERTs use only `(id, politician_id, url, type, photo_license)`. The `photo_origin_url` column does not exist. Never include it.

### Stance Value Model (apply to migrations 1133–1139)
**Source:** `migrations/1122_washco_harrington_stances.sql` lines 15–50.
Values are chairs (integer 1–5), not polarity. Omit the entire row for a topic with no evidence — do not default to Neutral. `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true`. Both `politician_answers` and `politician_context` tables get the same conflict-update.

### Headshot Pipeline Order (apply to headshot script)
**Source:** `scripts/_tmp-washco-headshots.py` lines 265–297 (`process_headshot_bytes`).
CROP to 4:5 ratio FIRST, then RESIZE to 600x750 Lanczos SECOND. Never call resize before crop. Composite transparent sources (PNG/RGBA) onto white background before RGB conversion.

---

## No Analog Found

All 9 files have direct analogs in the codebase. No file requires falling back to RESEARCH.md patterns only.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (migrations 244, 245, 246, 1120, 1121, 1122); `C:/EV-Accounts/backend/scripts/` (washco headshots script); `C:\Transparent Motivations\essentials\src\lib\coverage.js`
**Files scanned:** 8 source files read in full
**Pattern extraction date:** 2026-07-01

### Key Casing / Structural Traps (planner must call out in plan actions)

1. `districts.state` = `'or'` lowercase — wrong case silently excludes all city officials from routing
2. `chambers` INSERT must omit `slug` column — GENERATED ALWAYS, migration fails if included
3. `politician_images` INSERT must omit `photo_origin_url` — column does not exist
4. `governments` has no unique constraint on `geo_id` — always use `WHERE NOT EXISTS` on name
5. Edward Kimmi's "Council President" is a rotational title — one office row (`title='Council Member (Position 3)'`), no second row
6. Headshot script is gitignored (`_tmp-*`) — executor writes it to `backend/scripts/`; orchestrator runs it
7. Stance migrations are NOT registered in `schema_migrations` — disk file counter is authoritative (next after 1139 = 1140)
