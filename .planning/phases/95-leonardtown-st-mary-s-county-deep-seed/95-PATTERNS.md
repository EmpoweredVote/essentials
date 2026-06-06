# Phase 95: Leonardtown / St. Mary's County Deep Seed - Pattern Map

**Mapped:** 2026-06-05
**Files analyzed:** 3 new files
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` | exact |
| `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql` | migration | CRUD | `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` | exact |
| `scripts/md_local_headshots.py` | utility | file-I/O | `scripts/md_executives_headshots.py` | exact |

---

## Pattern Assignments

### `C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql`

**File header pattern** (lines 1-20):
```sql
-- Migration 276: St. Mary's County government + chamber + COUNTY district + 5 officials + offices
--
-- Purpose: Seeds St. Mary's County Board of County Commissioners under geo_id='24037'.
--   - 1 government row: 'St. Mary's County, Maryland, US' (type='County', state='MD', geo_id='24037')
--   - 1 chamber row: 'Board of County Commissioners'
--   - 1 COUNTY district row: geo_id='24037', mtfcc='G4020', state='md', district_type='COUNTY'
--   - 5 politicians: President (-24037001) + Commissioners D1-D4 (-24037002..-24037005)
--   - 5 offices: all linked to the COUNTY district (geo_id='24037')
--   - office_id back-fill on all 5 politicians
--
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'md' (lowercase) for COUNTY type to match routing queries.
-- CRITICAL: governments.state = 'MD' (uppercase) — government table convention.
```

**Transaction wrapper and pre-flight DO block** (lines 21-32 of analog):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'St. Mary''s County, Maryland, US') > 0 THEN
    RAISE NOTICE 'St. Mary''s County government row already exists — skipping government INSERT (idempotent re-run)';
  END IF;
END $$;
```

**Step 1: Government row INSERT** (lines 39-46 of analog, adapted):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'St. Mary''s County, Maryland, US',
       'County', 'MD', NULL, '24037'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'St. Mary''s County, Maryland, US'
);
```

**Step 2: Chamber INSERT — no slug column** (lines 53-63 of analog, adapted):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of County Commissioners',
       'St. Mary''s County Board of County Commissioners',
       (SELECT id FROM essentials.governments
        WHERE name = 'St. Mary''s County, Maryland, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of County Commissioners'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'St. Mary''s County, Maryland, US')
);
```

**Step 3: COUNTY district row — lowercase state** (lines 72-77 of analog, adapted):
```sql
-- CRITICAL: state='md' LOWERCASE for COUNTY type — matches PostGIS routing query
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'md', '24037', 'St. Mary''s County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '24037' AND district_type = 'COUNTY' AND state = 'md'
);
```

**Step 4: Politician + office block pattern — WITH CTE** (lines 90-119 of analog, adapted for Block 1):
```sql
-- BLOCK 1: President James R. Guy (-24037001)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'James R. Guy', 'James', 'Guy', NULL,
          true, false, false, true, -24037001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of County Commissioners'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'St. Mary''s County, Maryland, US')),
       p.id,
       'President, Board of County Commissioners', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '24037'
  AND d.district_type = 'COUNTY'
  AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Title format for district commissioners** (lines 142, 167, 196, 228 of analog):
```sql
-- Commissioners D1-D4: use format 'Commissioner, District N'
'Commissioner, District 1'   -- Colvin (-24037002)
'Commissioner, District 2'   -- Hewitt (-24037003)
'Commissioner, District 3'   -- Alderson (-24037004)
'Commissioner, District 4'   -- Ostrow (-24037005)
```

**Step 5: office_id back-fill** (lines 255-260 of analog, adapted):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -24037005 AND -24037001
  AND p.office_id IS NULL;
```

**Step 6: Post-verification DO block — 3 gates** (lines 269-314 of analog, adapted):
```sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_office_count INTEGER;
  v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'St. Mary''s County, Maryland, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 govt row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '24037' AND d.district_type = 'COUNTY' AND d.state = 'md';
  IF v_office_count <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 offices, found %', v_office_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '24037' AND gb.mtfcc = 'G4020'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'COUNTY' AND d.state = 'md'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov_count=%, office_count=%, split_orphans=%',
    v_gov_count, v_office_count, v_split_count;
END $$;
```

**Step 7: Migration ledger entry** (lines 319-321 of analog):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('276')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql` (migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql`

This migration follows the same transaction structure as migration 276 but uses the incorporated-town district pattern from migration 246, which is the authoritative source for `LOCAL_EXEC` (Mayor) + `LOCAL` (council) district types and `type='LOCAL'` government rows.

**Key differences from migration 276:**
- `governments.type = 'LOCAL'` (not `'County'`)
- Two district rows: one `LOCAL_EXEC` (Mayor) + one `LOCAL` (all 5 council members share it)
- `mtfcc` is `NULL` on LOCAL/LOCAL_EXEC district rows (migration 246 lines 72-84)
- Mayor office links to `LOCAL_EXEC` district; council offices link to `LOCAL` district
- 6 officials total (1 Mayor + 5 Council Members)
- `office_id` back-fill range: `-2446475006` to `-2446475001`
- Post-verification `v_office_count` must equal 6

**Step 1: Government row — type='LOCAL'** (migration 246 lines 48-55, adapted):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Town of Leonardtown, Maryland, US',
       'LOCAL', 'MD', 'Leonardtown', '2446475'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Town of Leonardtown, Maryland, US'
);
```

**Step 2: Chamber INSERT — no slug column** (migration 246 lines 58-68, adapted):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Town Council',
       'Leonardtown Town Council',
       (SELECT id FROM essentials.governments
        WHERE name = 'Town of Leonardtown, Maryland, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Town Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Town of Leonardtown, Maryland, US')
);
```

**Step 3a: LOCAL_EXEC district — Mayor** (migration 246 lines 71-76, adapted):
```sql
-- LOCAL_EXEC for Mayor (citywide/townwide)
-- mtfcc=NULL — no TIGER mtfcc code for LOCAL_EXEC districts in this pattern
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'md', '2446475', 'Leonardtown (Townwide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2446475' AND district_type = 'LOCAL_EXEC' AND state = 'md'
);
```

**Step 3b: LOCAL district — all council members share it** (migration 246 lines 78-84, adapted):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'md', '2446475', 'Leonardtown (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2446475' AND district_type = 'LOCAL' AND state = 'md'
);
```

**Step 4a: Mayor block — links to LOCAL_EXEC district** (migration 246 lines 86-116, adapted):
```sql
-- BLOCK 1: Mayor Daniel W. Burris (-2446475001)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Daniel W. Burris', 'Daniel', 'Burris', NULL,
          true, false, false, true, -2446475001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Town Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Town of Leonardtown, Maryland, US')),
       p.id,
       'Mayor', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2446475'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Step 4b-f: Council member blocks — link to LOCAL district** (migration 246 lines 118-148 pattern):
```sql
-- BLOCK 2: Council Member J. Maguire Mattingly IV (-2446475002)
-- NOTE: first_name='Jay' (goes by Jay), last_name='Mattingly'
-- NOTE: title='Council Member' for ALL 5 council members — do NOT use 'Vice President'
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'J. Maguire Mattingly IV', 'Jay', 'Mattingly', NULL,
          true, false, false, true, -2446475002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Town Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Town of Leonardtown, Maryland, US')),
       p.id,
       'Council Member', 'MD', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '2446475'
  AND d.district_type = 'LOCAL'        -- NOTE: LOCAL not LOCAL_EXEC
  AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat this block for: Nick B. Colvin (-2446475003), Heather M. Earhart (-2446475004),
-- Christy Hollander (-2446475005), Mary Maday Slade (-2446475006)
```

**Step 5: office_id back-fill** (migration 244 lines 255-260, adapted):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2446475006 AND -2446475001
  AND p.office_id IS NULL;
```

**Step 6: Post-verification DO block** (migration 244 lines 269-314, adapted for Leonardtown):
```sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_office_count INTEGER;
  v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'Town of Leonardtown, Maryland, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 govt row, found %', v_gov_count;
  END IF;

  -- Count ALL offices linked to either LOCAL or LOCAL_EXEC districts for this geo_id
  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '2446475' AND d.state = 'md';
  IF v_office_count <> 6 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 6 offices, found %', v_office_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '2446475' AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.state = 'md'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov_count=%, office_count=%, split_orphans=%',
    v_gov_count, v_office_count, v_split_count;
END $$;
```

**Step 7: Migration ledger entry**:
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('277')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `scripts/md_local_headshots.py` (utility, file-I/O)

**Analog:** `scripts/md_executives_headshots.py` (exact match — same structure, same helpers)

**Secondary analog:** `scripts/md_senators_headshots.py` (same pattern, confirms `insert_politician_image` WHERE NOT EXISTS guard includes `AND type = 'default'`)

**Module docstring / header** (md_executives_headshots.py lines 1-26):
```python
#!/usr/bin/env python3
"""
MD local government headshot download + process + upload to Supabase Storage.
Phase 95-02

11 officials across 2 governments:
  St. Mary's County: external_id -24037001 through -24037005 (5 commissioners)
  Town of Leonardtown: external_id -2446475001 through -2446475006 (Mayor + 5 council)

Processing:
  - Download from official government sources
  - Crop to 4:5 ratio FIRST (center crop if wider, top crop if taller — never stretch)
  - Resize to 600x750 Lanczos JPEG quality=90
  - Upload to politician_photos bucket as {politician_id}-headshot.jpg
  - Insert politician_images row (type='default', photo_license='public_domain')

Idempotent: checks for existing politician_images row before inserting.
Re-running skips officials that already have images.

Usage:
  export SUPABASE_SERVICE_ROLE_KEY=<key>  (or SUPABASE_SECRET_KEY)
  python3 scripts/md_local_headshots.py
"""
```

**Imports and configuration** (md_executives_headshots.py lines 29-69):
```python
import io
import os
import sys
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: python3 -m pip install Pillow")
    sys.exit(1)

try:
    import psycopg2
except ImportError:
    print("ERROR: psycopg2 not installed. Run: python3 -m pip install psycopg2-binary")
    sys.exit(1)

SUPABASE_URL = "https://kxsdzaojfaibhuzmclfq.supabase.co"
SERVICE_KEY = (
    os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or
    os.environ.get('SUPABASE_SECRET_KEY') or
    ''
)
if not SERVICE_KEY:
    print("ERROR: set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in your environment")
    sys.exit(1)

if not SERVICE_KEY.startswith('eyJ'):
    print("ERROR: SUPABASE_SERVICE_ROLE_KEY does not look like a valid JWT (must start with eyJ)")
    sys.exit(1)

BUCKET = "politician_photos"
STORAGE_BASE = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/"
TMP_DIR = Path("C:/Transparent Motivations/essentials/scripts/tmp_md_local_headshots")

TARGET_W = 600
TARGET_H = 750
```

**OFFICIALS list structure** (md_executives_headshots.py lines 80-116):
```python
# politician_id values confirmed from DB before writing script via:
#   SELECT external_id, id FROM essentials.politicians
#   WHERE external_id BETWEEN -24037005 AND -24037001 ORDER BY external_id DESC
# (Repeat for Leonardtown range: -2446475006 to -2446475001)
OFFICIALS = [
    # St. Mary's County commissioners (no Referer needed)
    (
        -24037001,
        "<UUID from DB>",
        "James R. Guy",
        "https://www.stmaryscountymd.gov/_Media/Global/Headshots/guy_james.jpg",
    ),
    # ... -24037002 through -24037005 (same URL pattern: {last}_{first}.jpg)
    #
    # Leonardtown officials (Referer header REQUIRED — see download_leonardtown_image below)
    (
        -2446475001,
        "<UUID from DB>",
        "Daniel W. Burris",
        "https://leonardtown.somd.com/government/TownCouncil/Mayor%20Dan%20Burris.JPG",
    ),
    # ... -2446475002 through -2446475006
]
```

**Referer-aware download function for Leonardtown** (RESEARCH.md code example, adapted from md_executives_headshots.py lines 154-169):
```python
def download_image(url: str, name: str) -> bytes:
    """Download with browser UA. Leonardtown images require Referer header."""
    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/120.0.0.0 Safari/537.36'
        ),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    # Leonardtown hotlink protection: add Referer for leonardtown.somd.com URLs
    if 'leonardtown.somd.com' in url:
        headers['Referer'] = 'https://leonardtown.somd.com/government/government-initial.htm'
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=45) as resp:
        data = resp.read()
    print(f"  Downloaded {len(data):,} bytes")
    return data
```

**crop_and_resize function** (md_executives_headshots.py lines 123-151 — copy verbatim):
```python
def crop_and_resize(img: Image.Image, name: str) -> Image.Image:
    """Crop to 4:5 ratio FIRST (center crop, never stretch), then resize to 600x750 Lanczos."""
    w, h = img.size
    target_ratio = 4 / 5

    current_ratio = w / h
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
        print(f"  Crop: too wide ({w}x{h}) -> center-crop to ({new_w}x{h})")
    elif current_ratio < target_ratio:
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))
        print(f"  Crop: too tall ({w}x{h}) -> top-crop to ({w}x{new_h})")
    else:
        print(f"  Crop: already 4:5 ({w}x{h}) — no crop needed")

    if img.mode != 'RGB':
        img = img.convert('RGB')

    result = img.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    print(f"  Resize: -> {TARGET_W}x{TARGET_H} Lanczos")
    return result
```

**process_image function** (md_executives_headshots.py lines 172-182 — copy verbatim):
```python
def process_image(raw_bytes: bytes, name: str) -> bytes:
    img = Image.open(io.BytesIO(raw_bytes))
    orig_w, orig_h = img.size
    print(f"  Original: {orig_w}x{orig_h} mode={img.mode}")
    img = crop_and_resize(img, name)
    out = io.BytesIO()
    img.save(out, format='JPEG', quality=90, optimize=True)
    data = out.getvalue()
    print(f"  Final JPEG: {img.size[0]}x{img.size[1]} ({len(data):,} bytes)")
    return data
```

**upload_to_storage function** (md_executives_headshots.py lines 189-213 — copy verbatim):
```python
def upload_to_storage(politician_id: str, jpeg_bytes: bytes, name: str) -> str:
    storage_path = f"{politician_id}-headshot.jpg"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{storage_path}"
    req = urllib.request.Request(
        upload_url,
        data=jpeg_bytes,
        method="POST",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true",
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Storage upload HTTP {e.code} for {name}: {body}")
    public_url = f"{STORAGE_BASE}{storage_path}"
    print(f"  Uploaded: {storage_path}")
    return public_url
```

**get_db_url function** (md_executives_headshots.py lines 223-238 — copy verbatim):
```python
def get_db_url() -> str:
    env_path = "C:/EV-Accounts/backend/.env"
    try:
        with open(env_path) as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    val = line.split("=", 1)[1].strip()
                    if len(val) >= 2 and val[0] == val[-1] and val[0] in ('"', "'"):
                        val = val[1:-1]
                    return val
    except FileNotFoundError:
        pass
    return os.environ.get("DATABASE_URL", "")
```

**check_image_exists function** (md_executives_headshots.py lines 241-254 — copy verbatim):
```python
def check_image_exists(politician_id: str, db_url: str) -> bool:
    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM essentials.politician_images"
                " WHERE politician_id = %s::uuid AND type = 'default'",
                (politician_id,)
            )
            row = cur.fetchone()
            return (row[0] > 0) if row else False
    finally:
        conn.close()
```

**insert_politician_image function** (md_senators_headshots.py lines 567-588 — use senators version; it adds `AND type = 'default'` to WHERE NOT EXISTS, which is the correct guard):
```python
def insert_politician_image(politician_id: str, url: str, name: str, db_url: str) -> None:
    conn = psycopg2.connect(db_url)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = %s::uuid AND type = 'default'
)
""",
                    (politician_id, url, politician_id)
                )
                if cur.rowcount == 0:
                    print(f"  Row already exists (idempotent skip)")
                else:
                    print(f"  Inserted politician_images row")
    finally:
        conn.close()
```

**main() function** (md_executives_headshots.py lines 283-364 — copy structure, adjust counters):
```python
def main():
    TMP_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    db_url = get_db_url()
    if not db_url:
        print("ERROR: could not find DATABASE_URL in C:/EV-Accounts/backend/.env or environment")
        sys.exit(1)

    print(f"Processing {len(OFFICIALS)} MD local officials (Phase 95-02)")
    print(f"Storage bucket: {BUCKET}")
    print(f"Temp dir: {TMP_DIR}")
    print()

    for ext_id, pol_id, name, source_url in OFFICIALS:
        # ... same try/except pattern as md_executives_headshots.py lines 297-324
        # HALT on error (not best-effort) — all 11 photos confirmed available
        pass

    # Summary: print OK/SKIPPED/ERROR counts; sys.exit(1) if any ERROR
```

---

## Shared Patterns

### Idempotency — Government INSERT Guard
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 39-46
**Apply to:** All government row INSERTs in both migrations
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = '<government name>'
);
```

### Idempotency — Politician + Office Guard
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 90-119
**Apply to:** Every politician/office block in both migrations
```sql
ON CONFLICT (external_id) DO NOTHING   -- on politicians INSERT
-- AND
AND NOT EXISTS (                        -- on offices INSERT
  SELECT 1 FROM essentials.offices o
  WHERE o.district_id = d.id AND o.politician_id = p.id
)
```

### Schema Case Rules
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 16-19
**Apply to:** All table INSERTs in both migrations

| Column | Value | Rule |
|--------|-------|-------|
| `governments.state` | `'MD'` | UPPERCASE — governments table convention |
| `districts.state` (COUNTY type) | `'md'` | lowercase — routing query convention |
| `districts.state` (LOCAL/LOCAL_EXEC types) | `'md'` | lowercase — same routing rule |
| `offices.representing_state` | `'MD'` | UPPERCASE — offices table convention |
| `chambers.slug` | (omit from INSERT) | GENERATED ALWAYS — never list in column list |

### Post-Verification DO Block Structure
**Source:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` lines 269-314
**Apply to:** Both migrations (276 and 277)
- Gate (a): government row count = 1
- Gate (b): offices count for geo_id + district_type + state = expected count (5 for 276, 6 for 277)
- Gate (c): section-split detector = 0 orphan geofence_boundaries rows

### Headshot Storage Path
**Source:** `scripts/md_executives_headshots.py` lines 191-192
**Apply to:** `scripts/md_local_headshots.py`
```python
storage_path = f"{politician_id}-headshot.jpg"   # bucket: politician_photos
```

### politician_images Type Field
**Source:** `scripts/md_executives_headshots.py` lines 264-266
**Apply to:** `scripts/md_local_headshots.py`
```python
# type='default' — NOT 'headshot'
# UI filters with .find(img => img.type === 'default')
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(), %s::uuid, %s, 'default', 'public_domain'
```

---

## Critical Distinctions: Migration 276 vs 277

| Concern | Migration 276 (St. Mary's County) | Migration 277 (Leonardtown) |
|---------|-----------------------------------|-----------------------------|
| `governments.type` | `'County'` | `'LOCAL'` |
| District type(s) | One `COUNTY` district | One `LOCAL_EXEC` + one `LOCAL` district |
| `districts.mtfcc` | `'G4020'` | `NULL` (no mtfcc for LOCAL/LOCAL_EXEC rows per migration 246) |
| geo_id | `'24037'` | `'2446475'` |
| External ID range | `-24037001` to `-24037005` | `-2446475001` to `-2446475006` |
| Officials count | 5 | 6 (1 Mayor + 5 Council Members) |
| Analog migration | 244 | 246 |
| Post-verify gate (b) | `v_office_count <> 5` | `v_office_count <> 6` |
| Mayor office links to | N/A | `LOCAL_EXEC` district |
| Council offices link to | `COUNTY` district | `LOCAL` district |

---

## No Analog Found

None — all 3 files have close analogs in the codebase.

---

## Roster Reference (for implementer)

### Migration 276: St. Mary's County Commissioners
| external_id | full_name | first_name | last_name | office.title |
|-------------|-----------|------------|-----------|--------------|
| -24037001 | James R. Guy | James | Guy | President, Board of County Commissioners |
| -24037002 | Eric Colvin | Eric | Colvin | Commissioner, District 1 |
| -24037003 | Michael L. Hewitt | Michael | Hewitt | Commissioner, District 2 |
| -24037004 | Mike Alderson, Jr. | Mike | Alderson | Commissioner, District 3 |
| -24037005 | Scott R. Ostrow | Scott | Ostrow | Commissioner, District 4 |

### Migration 277: Town of Leonardtown
| external_id | full_name | first_name | last_name | office.title |
|-------------|-----------|------------|-----------|--------------|
| -2446475001 | Daniel W. Burris | Daniel | Burris | Mayor |
| -2446475002 | J. Maguire Mattingly IV | Jay | Mattingly | Council Member |
| -2446475003 | Nick B. Colvin | Nick | Colvin | Council Member |
| -2446475004 | Heather M. Earhart | Heather | Earhart | Council Member |
| -2446475005 | Christy Hollander | Christy | Hollander | Council Member |
| -2446475006 | Mary Maday Slade | Mary | Slade | Council Member |

### Headshot URLs
**St. Mary's County** (no Referer needed, HTTP 200 direct):
- `https://www.stmaryscountymd.gov/_Media/Global/Headshots/guy_james.jpg`
- `https://www.stmaryscountymd.gov/_Media/Global/Headshots/colvin_eric.jpg`
- `https://www.stmaryscountymd.gov/_Media/Global/Headshots/hewitt_michael.jpg`
- `https://www.stmaryscountymd.gov/_Media/Global/Headshots/alderson_mike.jpg`
- `https://www.stmaryscountymd.gov/_Media/Global/Headshots/ostrow_scott.jpg`

**Leonardtown** (Referer header REQUIRED: `https://leonardtown.somd.com/government/government-initial.htm`):
- `https://leonardtown.somd.com/government/TownCouncil/Mayor%20Dan%20Burris.JPG`
- `https://leonardtown.somd.com/government/TownCouncil/JayMattingly.JPG`
- `https://leonardtown.somd.com/government/TownCouncil/NickColvin.JPG`
- `https://leonardtown.somd.com/government/TownCouncil/HeatherEarhart.jpg` (HTTP 200 direct — but send Referer anyway for consistency)
- `https://leonardtown.somd.com/government/TownCouncil/ChristyHollander.JPG`
- `https://leonardtown.somd.com/government/TownCouncil/MarySlade.JPG`

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (200-series and 240-series), `scripts/` directory
**Files scanned:** 4 analog files read in full (244, 246, 246 partial, md_executives_headshots.py, md_senators_headshots.py)
**Pattern extraction date:** 2026-06-05
