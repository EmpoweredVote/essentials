# Phase 119: Lynn Deep Seed - Pattern Map

**Mapped:** 2026-06-14
**Files analyzed:** 4 (3 SQL migrations + 1 Python script)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/584_lynn_city_government.sql` | migration | CRUD | `581_somerville_city_government.sql` | exact (same 11-member council structure: 4 at-large + 7 ward) |
| `C:/EV-Accounts/backend/migrations/585_lynn_school_committee.sql` | migration | CRUD | `579_newton_school_committee.sql` | exact (single ex-officio Mayor pattern; Newton has 8 elected, Lynn has 6) |
| `C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql` | migration | CRUD | `583_somerville_headshots.sql` | exact (accessible CMS, confirmed-200 URLs, documented gaps) |
| `C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py` | utility | file-I/O | `C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py` | exact (same CMS-accessible pattern: confirmed-200 URLs + known gaps) |

---

## Pattern Assignments

### `584_lynn_city_government.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/578_newton_city_government.sql`

Somerville is the closer structural match: same 11-member council (4 at-large + 7 ward), same external ID layout (Mayor=001, at-large=002–005, ward=006–012), applied most recently.

**Lynn-specific substitutions from Somerville:**
- `'2562535'` → `'2537490'` (geo_id)
- `'City of Somerville, Massachusetts, US'` → `'City of Lynn, Massachusetts, US'`
- `'Somerville City Council'` → `'Lynn City Council'`
- `'Somerville (Citywide)'` → `'Lynn (Citywide)'`
- `'Somerville'` (district label) → `'Lynn'`
- `'Jake Wilson'` block replaced with `'Jared Nicholson'` (external_id=-2537490001, title='Mayor')
- At-large blocks (-2537490002–005): Field, LaPierre, McClain, Net (alphabetical)
- Ward blocks (-2537490006–012): Meaney(W1), Matul(W2), Alinsug(W3), Megie-Maddrey(W4), Paez(W5), Hogan(W6), Avery(W7)
- Post-verification gate counts: 12 politicians, 12 offices, 2 districts
- Migration ledger: `'584'`

**Pre-flight pattern** (578 lines 52–88, 581 lines 47–84):
```sql
-- Pre-flight 1: abort if government already exists
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Lynn, Massachusetts, US') > 0 THEN
    RAISE EXCEPTION 'Migration 584 already applied — aborting re-run: City of Lynn government row already exists.';
  END IF;
END $$;

-- Pre-flight 2: assert G4110 geofence present
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '2537490' AND mtfcc = 'G4110';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Lynn G4110 geofence (geo_id=2537490) not found — must be loaded from v5.0 MA TIGER load.';
  END IF;
  RAISE NOTICE 'Pre-flight 2 PASSED: Lynn G4110 geofence present (% rows)', v_count;
END $$;

-- Pre-flight 3: assert external_id range clear
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -2537490012 AND -2537490001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -2537490001..-2537490012 is not clear (% rows found)', v_count;
  END IF;
  RAISE NOTICE 'Pre-flight 3 PASSED: external_id range is clear';
END $$;
```

**Transaction wrapper** (581 line 86): `BEGIN;` … `COMMIT;` wraps all INSERT/UPDATE steps.

**Government + chamber INSERT pattern** (581 lines 93–118):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Lynn, Massachusetts, US',
       'LOCAL', 'MA', 'Lynn', '2537490'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Lynn, Massachusetts, US'
);

-- CRITICAL: no slug column — slug is GENERATED ALWAYS on essentials.chambers
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'City Council',
       'Lynn City Council',
       (SELECT id FROM essentials.governments
        WHERE name = 'City of Lynn, Massachusetts, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Lynn, Massachusetts, US')
);
```

**District INSERT pattern** (581 lines 120–143):
```sql
-- LOCAL_EXEC (Mayor — citywide)
-- CRITICAL: state='ma' lowercase; mtfcc=NULL (not 'G4110')
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'ma', '2537490', 'Lynn (Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2537490' AND district_type = 'LOCAL_EXEC' AND state = 'ma'
);

-- LOCAL (all 11 councilors)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', '2537490', 'Lynn', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2537490' AND district_type = 'LOCAL' AND state = 'ma'
);
```

**Politician+office block pattern — Mayor** (581 lines 154–184):
```sql
-- BLOCK 1: Mayor (-2537490001) — links to LOCAL_EXEC district
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jared Nicholson', 'Jared', 'Nicholson', NULL,
          true, false, false, true, -2537490001)
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
                               WHERE name = 'City of Lynn, Massachusetts, US')),
       p.id,
       'Mayor', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2537490'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Politician+office block pattern — At-large councilor** (581 lines 186–216, title='City Councilor'):
```sql
-- district_type = 'LOCAL' (not LOCAL_EXEC)
-- title = 'City Councilor' (at-large — no ward suffix)
FROM essentials.districts d
...
WHERE d.geo_id = '2537490'
  AND d.district_type = 'LOCAL'
  AND d.state = 'ma'
```

**Politician+office block pattern — Ward councilor** (581 lines 314–344, title='City Councilor (Ward N)'):
```sql
-- title = 'City Councilor (Ward 1)' through 'City Councilor (Ward 7)'
-- Note: Alinsug (Ward 3, Council President) uses 'City Councilor (Ward 3)' NOT 'City Council President'
-- Note: Megie-Maddrey last_name='Megie-Maddrey' (hyphen IN DB; no hyphen in CDN filename only)
```

**office_id back-fill pattern** (581 lines 548–553):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2537490012 AND -2537490001
  AND p.office_id IS NULL;
```

**Post-verification pattern** (581 lines 566–656) — 7 gates: gov=1, chambers=1, districts=2, politicians=12, offices=12, split_orphans=0, null_office_ids=0:
```sql
DO $$
DECLARE
  v_gov_count INTEGER; v_chamber_count INTEGER; v_dist_count INTEGER;
  v_pol_count INTEGER; v_off_count INTEGER; v_split_count INTEGER; v_null_count INTEGER;
BEGIN
  -- Gate (d): 12 politicians
  SELECT COUNT(*) INTO v_pol_count FROM essentials.politicians
  WHERE external_id BETWEEN -2537490012 AND -2537490001;
  IF v_pol_count <> 12 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 12 politicians in range, found %', v_pol_count;
  END IF;
  -- [... gates (a)–(c), (e)–(g) follow same structure ...]
  RAISE NOTICE 'Migration 584 post-verification PASSED: ...', v_gov_count, ...;
END $$;
```

**Migration ledger entry** (581 lines 660–663):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('584')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `585_lynn_school_committee.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/579_newton_school_committee.sql`

Newton is the exact structural match: single ex-officio Mayor, Mayor external_id from city migration excluded from back-fill. Lynn has 6 elected at-large (vs Newton's 8 ward-based). The at-large structure means all 6 SC politicians share the same SCHOOL district row — no per-seat title differentiation needed.

**Lynn-specific substitutions from Newton:**
- `'2508610'` (Newton LEAID) → `'2507110'` (Lynn LEAID)
- `'Newton Public Schools, Massachusetts, US'` → `'Lynn Public Schools, Massachusetts, US'`
- `'Newton School Committee'` → `'Lynn School Committee'`
- `'Newton Public Schools'` (district label) → `'Lynn Public Schools'`
- Mayor external_id: `-2545560001` → `-2537490001`
- SC member external_ids: `-2508610001`–`-2508610008` (8 Newton) → `-2507110001`–`-2507110006` (6 Lynn)
- Post-verification gate counts: 6 politicians, 7 offices (6 elected + 1 ex-officio Mayor)
- Migration ledger: `'585'`
- NOTE: No BEGIN/COMMIT wrapper — 579 has none (autocommit pattern for SC migrations)

**Pre-flight pattern** (579 lines 39–75):
```sql
-- Pre-flight 1: abort if government already exists
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Lynn Public Schools, Massachusetts, US') > 0 THEN
    RAISE EXCEPTION 'Migration 585 already applied — aborting re-run';
  END IF;
END $$;

-- Pre-flight 2: SC external_id range clear
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM essentials.politicians
  WHERE external_id BETWEEN -(2507110::bigint * 1000 + 6) AND -(2507110::bigint * 1000 + 1);
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -2507110001..-2507110006 is not clear (% rows found)', v_count;
  END IF;
END $$;

-- Pre-flight 3: Mayor Nicholson exists from migration 584
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM essentials.politicians
  WHERE external_id = -2537490001;
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Mayor Nicholson (external_id=-2537490001) not found — run migration 584 first';
  END IF;
END $$;
```

**G5420 geofence INSERT pattern** (579 lines 83–88):
```sql
-- CRITICAL: state='25' (MA FIPS numeric string — not 'ma' or 'MA')
INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '2507110', 'G5420', '25'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.geofence_boundaries
  WHERE geo_id = '2507110' AND mtfcc = 'G5420'
);
```

**Government + chamber + SCHOOL district pattern** (579 lines 97–136):
```sql
-- Government: city=NULL for school district (spans whole city)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Lynn Public Schools, Massachusetts, US',
       'LOCAL', 'MA', NULL, '2507110'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments
                  WHERE name = 'Lynn Public Schools, Massachusetts, US');

-- Chamber: no slug
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'School Committee', 'Lynn School Committee',
       (SELECT id FROM essentials.governments WHERE name = 'Lynn Public Schools, Massachusetts, US')
WHERE NOT EXISTS (SELECT 1 FROM essentials.chambers WHERE name = 'School Committee'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Lynn Public Schools, Massachusetts, US'));

-- SCHOOL district: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT'); mtfcc='G5420'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'ma', '2507110', 'Lynn Public Schools', 'G5420'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts
                  WHERE geo_id = '2507110' AND district_type = 'SCHOOL' AND state = 'ma');
```

**Elected SC member block pattern** (579 lines 157–187 — Block 1 Arrianna Proia as template):
```sql
-- title = 'School Committee Member' for all 6 elected members
-- is_appointed=false (all at-large elected)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Brian K. Castellanos', 'Brian', 'Castellanos', NULL,
          true, false, false, true, -2507110001)
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
                               WHERE name = 'Lynn Public Schools, Massachusetts, US')),
       p.id,
       'School Committee Member', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2507110'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id);
```

**Mayor ex-officio block pattern** (579 lines 413–436 — Block 9, NO new politician INSERT):
```sql
-- CRITICAL: no WITH ins_p — subquery on existing politician, not new INSERT
-- CRITICAL: title = 'Mayor (ex officio)'
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'School Committee'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Lynn Public Schools, Massachusetts, US')),
       p.id,
       'Mayor (ex officio)', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN (SELECT id FROM essentials.politicians WHERE external_id = -2537490001) p
WHERE d.geo_id = '2507110'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'ma'
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id);
```

**office_id back-fill — SC members ONLY, excluding Mayor** (579 lines 445–450):
```sql
-- CRITICAL: range MUST be -2507110006..-2507110001 ONLY
-- CRITICAL: Mayor (-2537490001) excluded — must keep LOCAL_EXEC office_id from migration 584
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -(2507110::bigint * 1000 + 6) AND -(2507110::bigint * 1000 + 1)
  AND p.office_id IS NULL;
```

**Post-verification pattern** (579 lines 465–573) — 9 gates: gov=1, chambers=1, districts=1, sc_politicians=6, total_school_offices=7, split_orphans=0, null_sc_office_ids=0, geo_count=1 (G5420), mayor_local_exec_intact=1:
```sql
-- Gate (i): Mayor's office_id must still point to LOCAL_EXEC from migration 584
SELECT COUNT(*) INTO v_mayor_exec_count
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id = -2537490001
  AND d.district_type = 'LOCAL_EXEC'
  AND d.geo_id = '2537490';
IF v_mayor_exec_count <> 1 THEN
  RAISE EXCEPTION 'Post-verification FAILED: Mayor Nicholson office_id back-fill overwrote LOCAL_EXEC — CRITICAL BUG (expected 1, found %)', v_mayor_exec_count;
END IF;
```

---

### `586_lynn_headshots.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql`

Somerville is the exact match: accessible CMS (confirmed-200 URLs), partial coverage with documented gaps. Lynn has 12/12 city officials with accessible photos (11 from CivicLive CDN + 1 Mayor from Wikipedia). All 6 SC members are gaps (SchoolMessenger text-only site). Unlike Somerville (9 uploads + 10 gaps), Lynn expects 12 uploads + 6 gaps.

**Lynn-specific substitutions from Somerville:**
- City external_id range: `-2562535001`–`-2562535012` → `-2537490001`–`-2537490012`
- SC external_id range: `-2510890001`–`-2510890007` → `-2507110001`–`-2507110006`
- Expected count: 12 uploads (all city), 6 gaps (all SC)
- CDN base URL stays the same: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`
- Migration ledger: `'586'`

**politician_images INSERT block pattern** (583 lines 44–52):
```sql
-- type = 'default' (NOT 'headshot') — UI filter: .find(img => img.type === 'default')
-- photo_license = 'public_domain'
-- WHERE NOT EXISTS guard: idempotent on politician_id
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -2537490001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -2537490001)
);
```

**Gap comment pattern** (583 line 54):
```sql
-- GAP: -2507110001 Brian K. Castellanos — no headshot on lynnschools.org (SchoolMessenger text-only); no fallback per D-01
```

**Post-verification pattern** (583 lines 164–191):
```sql
DO $$
DECLARE
  v_img_count INTEGER;
  v_wrong_type INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_img_count
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE (p.external_id BETWEEN -2537490012 AND -2537490001
      OR p.external_id BETWEEN -2507110006 AND -2507110001)
    AND pi.type = 'default';

  SELECT COUNT(*) INTO v_wrong_type
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE (p.external_id BETWEEN -2537490012 AND -2537490001
      OR p.external_id BETWEEN -2507110006 AND -2507110001)
    AND pi.type != 'default';

  IF v_wrong_type > 0 THEN
    RAISE EXCEPTION 'Migration 586 post-verification FAILED: Lynn headshots have wrong type (not default): % rows', v_wrong_type;
  END IF;

  RAISE NOTICE 'Migration 586 post-verification PASSED: % headshots inserted (type=default), 6 SC gap officials documented (SchoolMessenger text-only site)', v_img_count;
END $$;
```

---

### `scripts/_tmp-lynn-headshots.py` (utility, file-I/O)

**Primary analog:** `C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py`

Somerville is the exact structural match for accessible-CMS pattern. Lynn has a simpler roster: 18 ROSTER entries (12 city + 6 SC), no fallback URLs needed for city officials (all confirmed 200), Mayor uses Wikipedia URL instead of city CMS.

**Lynn-specific substitutions from Somerville:**
- Docstring: update to Phase 119, Lynn officials, CivicLive CDN
- `BROWSER_HEADERS` Referer: `'https://www.lynnma.gov/'`
- ROSTER count: 18 (12 city + 6 SC)
- City council CDN base URL: `https://cdnsm5-hosted2.civiclive.com/UserFiles/Servers/Server_109726/Image/Council%20Photos/{LastName}.png`
- Mayor source_url: `https://upload.wikimedia.org/wikipedia/commons/7/7f/Jared_Nicholson_1.jpg`
- All 6 SC members: `source_url=None`, `gap_reason='No headshot on lynnschools.org (SchoolMessenger text-only); no fallback per D-01'`
- Print summary line references migration 586 (not 583)

**Config block pattern** (somerville script lines 33–58):
```python
import os, io, sys, time, requests
from PIL import Image

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

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...',
    'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
    'Referer': 'https://www.lynnma.gov/',  # CHANGE from somervillema.gov
}
```

**ROSTER entry patterns** (somerville script lines 99–318):
```python
# City councilor with confirmed URL (CivicLive CDN pattern):
{
    'external_id': -2537490006,
    'full_name': 'Peter Meaney',
    'section': 'City Council',
    'source_url': 'https://cdnsm5-hosted2.civiclive.com/UserFiles/Servers/Server_109726/Image/Council%20Photos/Meaney.png',
    'fallback_url': None,
    'headers': BROWSER_HEADERS,
},

# Mayor with Wikipedia fallback (no city CDN photo):
{
    'external_id': -2537490001,
    'full_name': 'Jared Nicholson',
    'section': 'City Council',
    'source_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7f/Jared_Nicholson_1.jpg',
    'fallback_url': None,
    'headers': BROWSER_HEADERS_DEFAULT,
},

# FILENAME GOTCHA — Megie-Maddrey uses no hyphen in CDN filename:
{
    'external_id': -2537490009,
    'full_name': 'Natasha S. Megie-Maddrey',
    'section': 'City Council',
    'source_url': 'https://cdnsm5-hosted2.civiclive.com/UserFiles/Servers/Server_109726/Image/Council%20Photos/MegieMaddrey.png',
    # NOTE: 'MegieMaddrey.png' NOT 'Megie-Maddrey.png' — confirmed 200, hyphen removed in CDN
    'fallback_url': None,
    'headers': BROWSER_HEADERS,
},

# SC member gap (SchoolMessenger text-only site):
{
    'external_id': -2507110001,
    'full_name': 'Brian K. Castellanos',
    'section': 'School Committee',
    'source_url': None,
    'fallback_url': None,
    'headers': BROWSER_HEADERS_DEFAULT,
    'gap_reason': 'No headshot on lynnschools.org (SchoolMessenger text-only page); no fallback per D-01',
},
```

**Image processing pipeline — copy verbatim** (somerville script lines 325–398):
`download_image()`, `crop_to_4_5()`, `resize_600x750()`, `upload_to_storage()`, `resolve_politician_id()`, `process_member()` — these functions are source-independent and copy exactly. Only update docstring refs.

**main() output lines** (somerville script lines 518–600) — copy verbatim except:
- Print banner references Phase 119 / migration 586
- ROSTER count: 18 (12 city + 6 SC)
- Summary note: "CivicLive CDN accessible; 12 confirmed 200 for city (11 CDN + 1 Wikipedia); 6 SC gaps"

---

## Shared Patterns

### Pre-flight guards
**Source:** `C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql` lines 47–84
**Apply to:** Migrations 584, 585, 586
Three-block pattern: (1) abort if government already exists, (2) assert geofence present, (3) assert external_id range clear.

### WHERE NOT EXISTS guard on governments
**Source:** `C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql` lines 93–104
**Apply to:** Migrations 584, 585
`essentials.governments` has NO unique constraint on `geo_id`. Always use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')`.

### Casing rules (all migrations)
**Source:** All analog migrations — repeated as CRITICAL comments
```
governments.state = 'MA'          (uppercase)
districts.state = 'ma'            (lowercase)
offices.representing_state = 'MA' (uppercase)
geofence_boundaries.state = '25'  (MA FIPS numeric string — for G5420 only)
```

### slug suppression on chambers
**Source:** `C:/EV-Accounts/backend/migrations/578_newton_city_government.sql` line 111
**Apply to:** Migrations 584, 585
`slug` is `GENERATED ALWAYS` on `essentials.chambers` — never include in `INSERT` column list.

### politician_images type='default'
**Source:** `C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql` lines 13–14
**Apply to:** Migration 586, Python script
Use `type='default'` — NOT `'headshot'`. UI filter: `.find(img => img.type === 'default')`.

### Image processing pipeline
**Source:** `C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py` lines 344–398
**Apply to:** `_tmp-lynn-headshots.py`
Crop 4:5 ratio FIRST (never stretch), then resize 600×750 Lanczos q90. Functions `crop_to_4_5()` and `resize_600x750()` copy verbatim.

### Migration ledger entry
**Source:** `C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql` lines 659–665
**Apply to:** Migrations 584, 585, 586
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('NNN')
ON CONFLICT (version) DO NOTHING;
```
584 and 586 include `COMMIT;`. 585 does NOT (579 has no BEGIN/COMMIT wrapper).

---

## Lynn-Specific Gotchas (extracted from RESEARCH.md pitfalls)

These do not exist in the analog files and must be applied explicitly:

| Gotcha | Where it bites | What to write |
|--------|---------------|---------------|
| `MegieMaddrey.png` (no hyphen) | Python ROSTER, entry for Natasha Megie-Maddrey | CDN filename `MegieMaddrey.png`; DB `last_name='Megie-Maddrey'` (with hyphen) |
| Alinsug title | Migration 584 Block for -2537490008 | `title='City Councilor (Ward 3)'` NOT `'City Council President'` |
| Mayor NOT re-inserted in 585 | Migration 585 Block 7 (Mayor ex-officio) | No `WITH ins_p AS (INSERT...)` — use `CROSS JOIN (SELECT id FROM essentials.politicians WHERE external_id = -2537490001) p` |
| SC back-fill excludes Mayor | Migration 585 Step 5 | Range: `BETWEEN -(2507110::bigint * 1000 + 6) AND -(2507110::bigint * 1000 + 1)` ONLY |
| Lennin Peña name | Migration 585 Block for -2507110004 | `first_name='Lennin'`, `last_name='Peña'` (ñ character) |
| Lynn LEAID vs Newton/Somerville | Migration 585 everywhere | `'2507110'` — NOT `'2508610'` (Newton) or `'2510890'` (Somerville) |
| Mary Jules is staff | Migration 585 SC roster | Seed exactly 6 elected SC politicians + Mayor ex-officio = 7 total SC offices |
| SC member title uniformity | Migration 585 all 6 elected blocks | `'School Committee Member'` for all 6 — no Chair/Vice Chair distinction (Newton pattern, not Newton 579 which used Chair/Vice Chair) |

**Note on SC member title:** Newton 579 used `'School Committee Chair'` (line 369) and `'School Committee Vice Chair'` (line 241) for named officer roles. RESEARCH.md open question #3 recommends `'School Committee Member'` for all 6 Lynn elected members (officer roles are voted on by the committee post-election, not separate offices). The planner should document this choice in the plan.

---

## No Analog Found

None — all 4 files have exact or near-exact analogs in the codebase.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (migrations 578–583); `C:/EV-Accounts/backend/scripts/` (headshot scripts)
**Files scanned:** 6 (578, 579, 580, 581, 583, _tmp-somerville-headshots.py)
**Pattern extraction date:** 2026-06-14
