# Phase 109: MA Tier 2 Cities - Pattern Map

**Mapped:** 2026-06-10
**Files analyzed:** 7 (6 migrations + 1 headshot script)
**Analogs found:** 7 / 7

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `migrations/351_worcester_government.sql` | migration | CRUD | `migrations/347_boston_government.sql` | exact (same state, same LOCAL_EXEC+LOCAL pattern) |
| `migrations/352_springfield_government.sql` | migration | CRUD | `migrations/347_boston_government.sql` | exact |
| `migrations/353_lowell_government.sql` | migration | CRUD | `migrations/159_cambridge_incumbents.sql` + `migrations/347_boston_government.sql` | role-match (council-manager, no LOCAL_EXEC) |
| `migrations/354_brockton_government.sql` | migration | CRUD | `migrations/347_boston_government.sql` | exact |
| `migrations/355_quincy_government.sql` | migration | CRUD | `migrations/347_boston_government.sql` | exact |
| `migrations/356_ma_tier2_headshots.sql` | migration | CRUD | `migrations/349_boston_headshots.sql` | exact |
| `scripts/_tmp-ma-tier2-headshots.py` | utility | file-I/O | `scripts/_boston-headshots-upload.py` | exact |

---

## Pattern Assignments

### `migrations/351_worcester_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql`

**File header pattern** (lines 1-39):
```sql
-- Migration 351: City of Worcester government (MA-TIER2-01)
--
-- Purpose: Seeds City of Worcester government and City Council.
--   - 1 government row: 'City of Worcester, Massachusetts, US' (type='LOCAL', state='MA', city='Worcester', geo_id='2582000')
--   - 1 chamber row: 'City Council' (name_formal='Worcester City Council'; no slug — GENERATED ALWAYS)
--   - 1 LOCAL_EXEC district row: geo_id='2582000', mtfcc=NULL, state='ma', label='Worcester (Citywide)'
--   - 1 LOCAL district row: geo_id='2582000', mtfcc=NULL, state='ma', label='Worcester'
--   - 11 politicians: Mayor Petty (-258200001) + 5 at-large + 5 district councillors (-258200002..-258200011)
--   - 11 offices
--   - office_id back-fill on all 11
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state = 'ma' (lowercase); governments.state = 'MA' (uppercase); offices.representing_state = 'MA' (uppercase).
-- CRITICAL: mtfcc=NULL on all LOCAL and LOCAL_EXEC district rows.
-- CRITICAL: party=NULL (antipartisan design).
-- CRITICAL: is_appointed=false for all 11 (all popularly elected).
```

**Pre-flight pattern** (lines 44-97 of analog):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Worcester, Massachusetts, US') > 0 THEN
    RAISE NOTICE 'City of Worcester government row already exists — skipping government INSERT (idempotent re-run)';
  END IF;
END $$;

DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '2582000' AND mtfcc = 'G4110';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Worcester G4110 geofence (geo_id=2582000) not found.';
  END IF;
  RAISE NOTICE 'Pre-flight PASSED: Worcester G4110 geofence present';
END $$;

DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -258200011 AND -258200001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -258200001..-258200011 is not clear (% rows found)', v_count;
  END IF;
  RAISE NOTICE 'Pre-flight PASSED: external_id range is clear';
END $$;
```

**Government + Chamber + District INSERT pattern** (lines 103-222 of analog, adapted for Tier 2 — no per-district geofences):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Worcester, Massachusetts, US',
       'LOCAL', 'MA', 'Worcester', '2582000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Worcester, Massachusetts, US'
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'City Council',
       'Worcester City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Worcester, Massachusetts, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Worcester, Massachusetts, US')
);

-- LOCAL_EXEC (Mayor)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'ma', '2582000', 'Worcester (Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2582000' AND district_type = 'LOCAL_EXEC' AND state = 'ma'
);

-- LOCAL (Council — all councillors share single city-wide LOCAL district for Tier 2)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', '2582000', 'Worcester', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2582000' AND district_type = 'LOCAL' AND state = 'ma'
);
```

**Politician + Office WITH ins_p pattern** — one block per politician (lines 235-264 of analog, cross-join variant):
```sql
-- BLOCK 1: Mayor Joseph M. Petty (-258200001) — links to LOCAL_EXEC district
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joseph M. Petty', 'Joseph', 'Petty', NULL,
          true, false, false, true, -258200001)
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
                               WHERE name = 'City of Worcester, Massachusetts, US')),
       p.id,
       'Mayor', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2582000'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );

-- BLOCK 2: At-Large Councillor Khrystian E. King (-258200002) — title='City Councilor'
-- (Repeat for all remaining at-large blocks with district_type='LOCAL', geo_id='2582000')

-- BLOCK 7: District Councillor Tony Economou (-258200007) — title='City Councilor (District 1)'
-- District councillors also link to LOCAL district (geo_id='2582000') — Tier 2 encodes district in title only
-- (NOT per-district geofences; this differs from Boston)
```

**Office title encoding for Tier 2** (RESEARCH.md Pattern 3):
```sql
-- At-large seat:  title = 'City Councilor'
-- District seat:  title = 'City Councilor (District 1)' through 'City Councilor (District 5)'
-- Ward seat:      title = 'City Councilor (Ward 1)' through 'City Councilor (Ward N)'
-- ALL councillors link to the same single LOCAL district (geo_id = city's geo_id)
-- This is the Maine Tier 2 pattern; compare: migration 180 Lewiston ward titles
```

**Office_id back-fill pattern** (lines 689-694 of analog):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -258200011 AND -258200001
  AND p.office_id IS NULL;
```

**Post-verification DO block** (lines 707-802 of analog, simplified for Tier 2 — 2 districts not 11):
```sql
DO $$
DECLARE
  v_gov_count      INTEGER;
  v_chamber_count  INTEGER;
  v_dist_count     INTEGER;
  v_pol_count      INTEGER;
  v_off_count      INTEGER;
  v_split_count    INTEGER;
  v_null_count     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count
  FROM essentials.governments WHERE name = 'City of Worcester, Massachusetts, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Worcester government row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_chamber_count
  FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Worcester, Massachusetts, US');
  IF v_chamber_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 City Council chamber, found %', v_chamber_count;
  END IF;

  -- 2 districts: 1 LOCAL_EXEC + 1 LOCAL
  SELECT COUNT(*) INTO v_dist_count
  FROM essentials.districts
  WHERE state = 'ma' AND geo_id = '2582000'
    AND district_type IN ('LOCAL_EXEC', 'LOCAL');
  IF v_dist_count <> 2 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 2 Worcester district rows, found %', v_dist_count;
  END IF;

  SELECT COUNT(*) INTO v_pol_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -258200011 AND -258200001;
  IF v_pol_count <> 11 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 11 Worcester politicians, found %', v_pol_count;
  END IF;

  SELECT COUNT(*) INTO v_off_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.state = 'ma' AND d.geo_id = '2582000'
    AND d.district_type IN ('LOCAL_EXEC', 'LOCAL');
  IF v_off_count <> 11 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 11 Worcester offices, found %', v_off_count;
  END IF;

  -- Section-split check: geo_id=2582000 G4110 geofence must have a matching district
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '2582000' AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.state = 'ma');
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split orphan for geo_id=2582000';
  END IF;

  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -258200011 AND -258200001 AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians have NULL office_id', v_null_count;
  END IF;

  RAISE NOTICE 'Migration 351 post-verification PASSED: gov=%, chambers=%, districts=%, politicians=%, offices=%, split_orphans=%, null_office_ids=%',
    v_gov_count, v_chamber_count, v_dist_count, v_pol_count, v_off_count, v_split_count, v_null_count;
END $$;
```

**Migration ledger pattern** (line 807-809 of analog):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('351')
ON CONFLICT (version) DO NOTHING;
```

---

### `migrations/352_springfield_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql`

**Differences from Worcester pattern:**
- `name = 'City of Springfield, Massachusetts, US'`
- `city = 'Springfield'`, `geo_id = '2567000'`
- `name_formal = 'Springfield City Council'`
- `label = 'Springfield (Citywide)'` for LOCAL_EXEC, `label = 'Springfield'` for LOCAL
- `external_id` range: -256700001 (Mayor Sarno) through -256700014 (last at-large)
- `state = 'ma'` lowercase for districts; `state = 'MA'` uppercase for governments/offices
- 14 politicians total: 1 Mayor + 5 at-large + 8 ward councillors
- Office titles: `'City Councilor (Ward 1)'` through `'City Councilor (Ward 8)'` for ward seats; `'City Councilor'` for at-large seats
- Post-verification gates: 1 gov, 1 chamber, 2 districts, 14 politicians, 14 offices, 0 split orphans, 0 NULL office_ids
- Ledger version: `'352'`

**External ID assignments** (from RESEARCH.md):
```
Domenic J. Sarno   (Mayor)             -256700001
Michael A. Fenton  (Ward 2 Councilor)  -256700002
Melvin A. Edwards  (Ward 3 Councilor)  -256700003
Maria Perez        (Ward 1 Councilor)  -256700004
Malo L. Brown      (Ward 4 Councilor)  -256700005
Lavar Click-Bruce  (Ward 5 Councilor)  -256700006
Victor G. Davila   (Ward 6 Councilor)  -256700007
Gerry Martin       (Ward 7 Councilor)  -256700008
Zaida Govan        (Ward 8 Councilor)  -256700009
Justin Hurst       (Councilor-at-Large) -256700010
Jose Delgado       (Councilor-at-Large) -256700011
Kateri Walsh       (Councilor-at-Large) -256700012
Tracye Whitfield   (Councilor-at-Large) -256700013
Brian Santaniello  (Councilor-at-Large) -256700014
```

---

### `migrations/353_lowell_government.sql` (migration, CRUD — council-manager model)

**Analog:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` (structure) + Cambridge DB pattern (council-manager model)

**Critical difference — NO LOCAL_EXEC district** (RESEARCH.md Pattern 2):
```sql
-- Lowell uses Plan E (council-manager). No popularly-elected Mayor.
-- Do NOT insert a LOCAL_EXEC district — only LOCAL district.
-- Cambridge precedent: Siddiqui (Mayor, is_appointed=true) + Huang (City Manager, is_appointed=true)
-- both in the LOCAL district, NOT LOCAL_EXEC.

INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ma', '2537000', 'Lowell', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2537000' AND district_type = 'LOCAL' AND state = 'ma'
);
-- NO LOCAL_EXEC INSERT for Lowell
```

**is_appointed=true for appointed officials** (City Manager + council-elected Mayor):
```sql
-- City Manager Thomas A. Golden Jr. (-253700001): is_appointed=true
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Thomas A. Golden, Jr.', 'Thomas', 'Golden', NULL,
          true, true, false, true, -253700001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Lowell, Massachusetts, US')),
       p.id, 'City Manager', 'MA', true, false, NULL
FROM essentials.districts d CROSS JOIN ins_p p
WHERE d.geo_id = '2537000' AND d.district_type = 'LOCAL' AND d.state = 'ma'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- Mayor Erik R. Gitschier (-253700002): is_appointed=true (council-elected)
-- title='Mayor', same LOCAL district
```

**Differences from Worcester:**
- No LOCAL_EXEC district (1 district total instead of 2)
- `name = 'City of Lowell, Massachusetts, US'`, `city = 'Lowell'`, `geo_id = '2537000'`
- `name_formal = 'Lowell City Council'`
- 12 politicians: City Manager (is_appointed=true) + Mayor (is_appointed=true, council-elected) + 10 councillors (is_appointed=false)
- District councillors: `'City Councilor (District 1)'` through `'City Councilor (District 8)'`; at-large: `'City Councilor'`
- `is_appointed_position=true` for City Manager office; `is_appointed_position=false` for all councillor offices
- Post-verification gates: 1 gov, 1 chamber, **1** district, 12 politicians, 12 offices, 0 split orphans, 0 NULL office_ids
- Ledger version: `'353'`

**External ID assignments:**
```
Thomas A. Golden, Jr.  (City Manager)        -253700001  is_appointed=true
Erik R. Gitschier      (Mayor, council-elected) -253700002  is_appointed=true
Rita Mercier           (Councilor-at-Large)  -253700003  is_appointed=false
Vesna Nuon             (Councilor-at-Large)  -253700004  is_appointed=false
Daniel Rourke          (District 1)          -253700005  is_appointed=false
Corey Robinson         (District 2)          -253700006  is_appointed=false
Belinda M. Juran       (District 3)          -253700007  is_appointed=false
Sean McDonough         (District 4)          -253700008  is_appointed=false
Kimberly Scott         (District 5)          -253700009  is_appointed=false
Sokhary Chau           (District 6)          -253700010  is_appointed=false
Sidney L. Liang        (District 7)          -253700011  is_appointed=false
John Descoteaux        (District 8)          -253700012  is_appointed=false
```

---

### `migrations/354_brockton_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql`

**Differences from Worcester pattern:**
- `name = 'City of Brockton, Massachusetts, US'`, `city = 'Brockton'`, `geo_id = '2509000'`
- `name_formal = 'Brockton City Council'`
- 12 politicians: Mayor Rodrigues + 7 ward councillors + 4 at-large
- **CRITICAL:** Mayor is Moises M. Rodrigues (external_id=-250900001), NOT Robert Sullivan
- Office titles: `'City Councilor (Ward 1)'` through `'City Councilor (Ward 7)'`; `'City Councilor'` for at-large
- Post-verification gates: 1 gov, 1 chamber, 2 districts, 12 politicians, 12 offices, 0 split orphans, 0 NULL office_ids
- Ledger version: `'354'`

**External ID assignments:**
```
Moises M. Rodrigues  (Mayor)             -250900001
Marlon D. Green      (Ward 1 Councilor)  -250900002
Maria T. Tavares     (Ward 2 Councilor)  -250900003
Philip E. Griffin    (Ward 3 Councilor)  -250900004
Susan Nicastro       (Ward 4 Councilor)  -250900005
Jeffrey A. Thompson  (Ward 5 Councilor)  -250900006
John Lally           (Ward 6 Councilor)  -250900007
Shirley Asack        (Ward 7 Councilor)  -250900008
Carla Darosa         (Councilor-at-Large) -250900009
Jeff Charnel         (Councilor-at-Large) -250900010
Winthrop Farwell Jr. (Councilor-at-Large) -250900011
David C. Teixeira    (Councilor-at-Large) -250900012
```

---

### `migrations/355_quincy_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql`

**Differences from Worcester pattern:**
- `name = 'City of Quincy, Massachusetts, US'`, `city = 'Quincy'`, `geo_id = '2555745'`
- `name_formal = 'Quincy City Council'`
- Note: geo_id='2555745' is non-round — use exact string in all queries
- 10 politicians: Mayor Koch + 6 ward councillors + 3 at-large
- Office titles: `'City Councilor (Ward 1)'` through `'City Councilor (Ward 6)'`; `'City Councilor'` for at-large
- `full_name = 'Ziqiang Yuan'` (stores formal name; goes by "Susan" — do NOT use "Susan Yuan" as full_name)
- Post-verification gates: 1 gov, 1 chamber, 2 districts, 10 politicians, 10 offices, 0 split orphans, 0 NULL office_ids
- Ledger version: `'355'`

**External ID assignments:**
```
Thomas P. Koch       (Mayor)             -255574501
David Jacobs         (Ward 1 Councilor)  -255574502
Richard Ash          (Ward 2 Councilor)  -255574503
Walter Hubley        (Ward 3 Councilor)  -255574504
Virginia Ryan        (Ward 4 Councilor)  -255574505
Maggie McKee         (Ward 5 Councilor)  -255574506
Deborah Riley        (Ward 6 Councilor)  -255574507
Noel DiBona          (Councilor-at-Large) -255574508
Anne Mahoney         (Councilor-at-Large) -255574509
Ziqiang Yuan         (Councilor-at-Large) -255574510
```

---

### `migrations/356_ma_tier2_headshots.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/349_boston_headshots.sql`

**Header pattern** (lines 1-42 of analog):
```sql
-- Migration 356: MA Tier 2 headshots (MA-TIER2-02)
--
-- Storage bucket: politician_photos
-- CDN base: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/
--
-- Counts: best-effort across 59 officials (11 Worcester + 14 Springfield + 12 Lowell + 12 Brockton + 10 Quincy)
--
-- Photo processing: crop to 4:5 ratio FIRST, then resize 600x750 Lanczos q90.
-- politician_images.type = 'default' (UI filter: .find(img => img.type === 'default')).
-- politician_images.url column (NOT storage_url).
-- No BEGIN/COMMIT — each INSERT is autocommit (matching migration 349 pattern).
-- photo_license = 'public_domain' for official city website photos.
--
-- Upload script: C:/EV-Accounts/backend/scripts/_tmp-ma-tier2-headshots.py
```

**INSERT block pattern per official** (lines 49-57 of analog):
```sql
-- Joseph M. Petty (Worcester Mayor) — external_id -258200001
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -258200001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -258200001)
);
```

**Key rules from analog (lines 39-42):**
- `type = 'default'` — NOT 'headshot'; UI filter uses `.find(img => img.type === 'default')`
- `url` column — NOT `storage_url`
- `WHERE NOT EXISTS` guard on `politician_id` makes each block idempotent
- UUIDs filled in after running the Python upload script (UUIDs are from politician_photos bucket filenames)

**Post-verification pattern** (lines 212-222 of analog):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -258200011 AND -258200001
     OR p.external_id BETWEEN -256700014 AND -256700001
     OR p.external_id BETWEEN -253700012 AND -253700001
     OR p.external_id BETWEEN -250900012 AND -250900001
     OR p.external_id BETWEEN -255574510 AND -255574501;
  RAISE NOTICE 'Migration 356: % politician_images rows for MA Tier 2 officials (best-effort)', v_count;
END $$;
```

---

### `scripts/_tmp-ma-tier2-headshots.py` (utility, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py`

**Config block pattern** (lines 40-64 of analog):
```python
import os
import io
import sys
import time
import requests
import psycopg2
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
    'Referer': 'https://www.worcesterma.gov/',  # adjust per city
}
```

**ROSTER structure pattern** (lines 80-281 of analog):
```python
ROSTER = [
    # Worcester (mandatory — best-effort for Tier 2 means we try all; gaps documented)
    {
        'external_id': -258200001,
        'full_name': 'Joseph M. Petty',
        'city': 'Worcester',
        'politician_id': None,  # filled in after migration 351 runs
        'source_url': 'https://www.worcesterma.gov/media/council/petty-headshot.jpg',
        'mandatory': False,  # Tier 2 = best-effort; no hard mandatory requirement
    },
    # ... remaining Worcester officials
    # Springfield entries
    # Lowell entries
    # Brockton entries (Mayor: brockton.ma.us/wp-content/uploads/2026/01/MRodrigues-300x300.jpeg)
    # Quincy entries
]
```

**crop_to_4_5 function** (lines 309-338 of analog — copy verbatim):
```python
def crop_to_4_5(img: Image.Image) -> Image.Image:
    """
    Crop image to 4:5 aspect ratio — NEVER stretch.
    Square or landscape: center-crop horizontally.
    Portrait taller than 4:5: top-crop (preserve top portion).
    """
    w, h = img.size
    target_ratio = 4.0 / 5.0
    current_ratio = w / h
    if abs(current_ratio - target_ratio) < 0.001:
        return img
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        return img.crop((0, 0, w, new_h))
```

**insert_politician_images_row function** (lines 368-387 of analog — parameterized query, copy verbatim):
```python
def insert_politician_images_row(cursor, politician_uuid: str, cdn_url: str) -> bool:
    cursor.execute(
        """
        INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
        SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
        WHERE NOT EXISTS (
            SELECT 1 FROM essentials.politician_images
            WHERE politician_id = %s::uuid
        )
        """,
        (politician_uuid, cdn_url, politician_uuid)
    )
    return cursor.rowcount > 0
```

**process_member pipeline** (lines 390-469 of analog): download → verify → crop 4:5 → resize 600x750 → re-encode JPEG q90 → upload → insert DB row. Copy verbatim with minor label adjustments.

**Worcester headshot URL pattern** (RESEARCH.md Headshot Sources):
```
Try first:  https://www.worcesterma.gov/media/council/{lastname}-headshot.jpg
Fall back:  https://www.worcesterma.gov/media/council/{lastname}.jpg
```

---

### `scripts/_apply-migration-351.ts` through `_apply-migration-355.ts` (utility, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_apply-migration-347.ts`

**Full file pattern** (lines 1-80 of analog — adapt migration number, filename, and smoke tests):
```typescript
import 'dotenv/config';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });

const sql = readFileSync(path.join(process.cwd(), 'migrations', '351_worcester_government.sql'), 'utf8');

try {
  await pool.query(sql);
  console.log('Migration 351 applied successfully');

  // Smoke test 1: Government row exists (expected 1)
  const r1 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.governments
    WHERE name = 'City of Worcester, Massachusetts, US'
  `);
  console.log('Worcester government rows:', r1.rows[0].cnt, '(expected 1)');

  // Smoke test 2: Politician count (expected 11)
  const r2 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.politicians
    WHERE external_id BETWEEN -258200011 AND -258200001
  `);
  console.log('Worcester politicians:', r2.rows[0].cnt, '(expected 11)');

  // Smoke test 3: District count (expected 2 = 1 LOCAL_EXEC + 1 LOCAL)
  const r3 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.districts
    WHERE state = 'ma' AND geo_id = '2582000'
      AND district_type IN ('LOCAL_EXEC', 'LOCAL')
  `);
  console.log('Worcester districts:', r3.rows[0].cnt, '(expected 2)');

  // Smoke test 4: NULL office_id check (expected 0)
  const r4 = await pool.query(`
    SELECT COUNT(*) as cnt FROM essentials.politicians
    WHERE external_id BETWEEN -258200011 AND -258200001
      AND office_id IS NULL
  `);
  console.log('Worcester politicians with NULL office_id:', r4.rows[0].cnt, '(expected 0)');

  // Smoke test 5: Ledger entry present
  const r5 = await pool.query(`SELECT version FROM supabase_migrations.schema_migrations WHERE version = '351'`);
  console.log('Ledger entry 351:', r5.rows.length > 0 ? 'PRESENT' : 'MISSING');

} catch (e: any) {
  console.error('Error applying migration 351:', e.message);
  process.exit(1);
} finally {
  await pool.end();
}
```

**Per-city adaptation table:**
| Migration | File | Gov name | geo_id | Ext ID range | Politician count |
|-----------|------|----------|--------|--------------|-----------------|
| 351 | `351_worcester_government.sql` | `City of Worcester, Massachusetts, US` | `2582000` | -258200011..-258200001 | 11 |
| 352 | `352_springfield_government.sql` | `City of Springfield, Massachusetts, US` | `2567000` | -256700014..-256700001 | 14 |
| 353 | `353_lowell_government.sql` | `City of Lowell, Massachusetts, US` | `2537000` | -253700012..-253700001 | 12 |
| 354 | `354_brockton_government.sql` | `City of Brockton, Massachusetts, US` | `2509000` | -250900012..-250900001 | 12 |
| 355 | `355_quincy_government.sql` | `City of Quincy, Massachusetts, US` | `2555745` | -255574510..-255574501 | 10 |

**Lowell district count smoke test is 1 (not 2):**
```typescript
// Smoke test 3 for migration 353 (Lowell):
const r3 = await pool.query(`
  SELECT COUNT(*) as cnt FROM essentials.districts
  WHERE state = 'ma' AND geo_id = '2537000'
    AND district_type = 'LOCAL'  -- NO LOCAL_EXEC for council-manager city
`);
console.log('Lowell districts:', r3.rows[0].cnt, '(expected 1)');
```

---

## Shared Patterns

### State Casing Rules
**Source:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` lines 18-21 (CRITICAL comment block)
**Apply to:** All 5 city government migrations (351-355)
```sql
-- geofence_boundaries.state = '25'  (FIPS numeric — do NOT query/insert)
-- essentials.districts.state = 'ma' (lowercase postal)
-- essentials.governments.state = 'MA' (uppercase postal)
-- essentials.offices.representing_state = 'MA' (uppercase postal)
```

### WHERE NOT EXISTS Guard (No Unique Constraint on governments.geo_id)
**Source:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` line 107
**Apply to:** All 5 city government migrations
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of [City], Massachusetts, US'
);
```

### Slug Omission in Chamber INSERT
**Source:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` lines 118-129
**Apply to:** All 5 city government migrations
```sql
-- CORRECT: no slug column
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
-- WRONG: INSERT INTO essentials.chambers (id, name, name_formal, government_id, slug)
-- slug is GENERATED ALWAYS — Postgres will reject the INSERT if included
```

### mtfcc=NULL on LOCAL/LOCAL_EXEC Districts
**Source:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` lines 137-142
**Apply to:** All district INSERTs in migrations 351-355
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'ma', '{geo_id}', '{City} (Citywide)', NULL
-- mtfcc=NULL — never 'G4110' for manually-inserted LOCAL/LOCAL_EXEC districts
```

### Section-Split Verification Query
**Source:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` lines 776-788 + RESEARCH.md
**Apply to:** Post-verification DO blocks in all 5 city migrations; run as standalone after each migration
```sql
-- Scoped MA-only orphan count (run after each migration; should decrement by 1 each time)
SELECT COUNT(*) as orphan_count
FROM essentials.geofence_boundaries g
WHERE g.state = '25'
  AND g.mtfcc = 'G4110'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = g.geo_id
  );
-- Expected progression: 56 → 55 → 54 → 53 → 52 → 51
```

### Idempotent ON CONFLICT for Politicians
**Source:** `C:/EV-Accounts/backend/migrations/347_boston_government.sql` lines 237-242
**Apply to:** All WITH ins_p blocks in migrations 351-355
```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
-- Combined with outer INSERT's NOT EXISTS guard on (district_id, politician_id)
-- makes the full block safe to re-run
```

### Parameterized SQL in Python Scripts (No f-string interpolation)
**Source:** `C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py` lines 376-387
**Apply to:** `_tmp-ma-tier2-headshots.py`
```python
cursor.execute(
    """
    INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
    SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
    WHERE NOT EXISTS (SELECT 1 FROM essentials.politician_images WHERE politician_id = %s::uuid)
    """,
    (politician_uuid, cdn_url, politician_uuid)
)
# NEVER: f"INSERT INTO ... VALUES ('{politician_uuid}', '{cdn_url}', ...)"
```

### Credentials from .env Only
**Source:** `C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py` lines 40-54
**Apply to:** `_tmp-ma-tier2-headshots.py`
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
# Credentials loaded from .env — NEVER hardcoded in script
SUPABASE_URL = _env.get('SUPABASE_URL', '')
SERVICE_KEY = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL = _env.get('DATABASE_URL', '')
```

---

## No Analog Found

No files in this phase lack an analog. All patterns are covered by Phase 108 Boston migrations and scripts.

---

## Key Differences: Phase 109 vs Phase 108 (Boston)

| Aspect | Boston (Phase 108) | MA Tier 2 (Phase 109) |
|--------|-------------------|----------------------|
| Per-district geofences | Yes (X0013 for 9 districts) | No — single city geo_id only |
| District rows per city | 11 (1 LOCAL_EXEC + 1 LOCAL at-large + 9 per-district) | 2 (1 LOCAL_EXEC + 1 LOCAL) except Lowell (1 LOCAL only) |
| District encoding | Per-district LOCAL rows | Office title strings: 'City Councilor (Ward N)' |
| Headshot mandatory threshold | 14/14 council mandatory | Best-effort (no mandatory count; gaps documented) |
| Local_EXEC for Lowell | N/A | NO LOCAL_EXEC — council-manager model |
| `is_appointed` for Lowell officials | N/A | City Manager + Mayor = true; all councillors = false |
| Title for ward/district seats | 'City Councillor' (Boston uses district geo_id) | 'City Councilor (Ward N)' / 'City Councilor (District N)' |
| Term for elected body members | 'City Councillor' (Boston spelling) | 'City Councilor' (one 'l' — verify per city) |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` + `C:/EV-Accounts/backend/scripts/`
**Files scanned:** 347_boston_government.sql, 349_boston_headshots.sql, _boston-headshots-upload.py, _apply-migration-347.ts, _apply-migration-348.ts, 312_alexandria_government.sql, 180_me_tier2_lewiston_bangor_southportland_incumbents.sql
**Pattern extraction date:** 2026-06-10
