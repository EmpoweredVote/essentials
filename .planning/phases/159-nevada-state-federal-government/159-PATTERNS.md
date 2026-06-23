# Phase 159: Nevada State & Federal Government - Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 6 (1 structural migration + 1 audit-only headshot migration + 4 headshot upload scripts/operations + 1 audit-only verification SQL)
**Analogs found:** 6 / 6

---

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `1050_nv_controller.sql` | migration/structural | CRUD (chamber + district + politician + office INSERT) | `C:/EV-Accounts/backend/migrations/300_va_government_chambers.sql` + `270_md_state_executives.sql` | role-match (NV-specific combination of chamber-seed + exec-seed in a single migration) |
| `1051_nv_house_headshots.sql` | migration/audit-only | file-I/O (Storage upload + politician_images INSERT) | `C:/EV-Accounts/backend/migrations/315_va_headshots.sql` | exact (4 rows, type='default', WHERE NOT EXISTS guard, no photo_origin_url) |
| `_tmp-nv-house-headshots.py` | utility/script | file-I/O (download + resize + upload) | `C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py` | exact (same pipeline: requests→PIL→Storage PUT) |
| `_tmp-nv-controller-headshot.py` | utility/script | file-I/O (download + crop-to-4:5 + resize + upload) | `C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py` | exact (same pipeline; adds crop step since source may not be 4:5) |
| Verification SQL (inline) | audit | CRUD-read | Section-split query pattern from 155-PATTERNS.md | exact |

All migration files live in `C:/EV-Accounts/backend/migrations/` (the high-numbered series applied via MCP; not on-disk in `supabase/migrations/`).

---

## Pattern Assignments

### `1050_nv_controller.sql` (structural, CRUD)

This is the primary structural migration. It seeds Andy Matthews as Controller of Nevada end-to-end:
1 new chamber under State of Nevada + 1 new STATE_EXEC district + 1 new politician row + 1 new office row.

**Primary analogs:**
- `C:/EV-Accounts/backend/migrations/300_va_government_chambers.sql` — chamber INSERT pattern
- `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` — STATE_EXEC district + CTE politician/office pattern

**File header / pre-flight pattern** (from `300_va_government_chambers.sql` lines 33–46):
```sql
-- 1050_nv_controller.sql
-- Phase 159 (NV-STATE-01): Seed Andy Matthews, State Controller of Nevada.
-- STRUCTURAL migration (registers in supabase_migrations.schema_migrations). Idempotent.
-- State of Nevada government: id=9bb67edf-1081-4941-8f7d-2e791a5d28a1, geo_id='32'
-- external_id: -3200006 (next after existing 5 officials -3200001..-3200005)
-- DB-verified 2026-06-23: 5 of 6 STATE_EXEC officials exist; Controller missing.
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list.

BEGIN;

-- Pre-flight: assert State of Nevada government row exists (exactly 1 row)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE geo_id = '32') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Nevada government row (geo_id=32); found %',
      (SELECT COUNT(*) FROM essentials.governments WHERE geo_id = '32');
  END IF;
END $$;
```

**Step 1 — Chamber INSERT, idempotent WHERE NOT EXISTS** (from `300_va_government_chambers.sql` lines 48–60 + `205_sf_government_structure.sql` lines 109–116):
```sql
-- STEP 1: Insert Controller chamber under State of Nevada
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Controller',
       'Nevada State Controller',
       (SELECT id FROM essentials.governments WHERE geo_id = '32')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Controller'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')
);
-- CRITICAL: Do NOT include 'slug' in the column list — it is GENERATED ALWAYS.
-- CRITICAL: Use government WHERE geo_id='32' not geo_id='51' (that is Virginia).
```

**Step 2 — STATE_EXEC district INSERT** (from `270_md_state_executives.sql` lines 59–64):
```sql
-- STEP 2: Insert STATE_EXEC district for Controller
INSERT INTO essentials.districts (id, district_type, state, geo_id, label)
SELECT gen_random_uuid(), 'STATE_EXEC', 'NV', '32', 'Nevada Controller'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'NV' AND label = 'Nevada Controller'
);
-- CRITICAL: state = 'NV' UPPERCASE — STATE_EXEC districts use uppercase state codes.
-- CRITICAL: WHERE NOT EXISTS guards on (district_type, state, label) — no unique constraint.
```

**Step 3 — CTE politician + office INSERT** (from `270_md_state_executives.sql` lines 106–127):
```sql
-- STEP 3: Insert politician + office for Andy Matthews (Controller)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Andy Matthews', 'Andy', 'Matthews', 'Republican',
          true, false, false, true, -3200006)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Controller'
          AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')),
       p.id,
       'Controller', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'NV' AND d.label = 'Nevada Controller'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                          WHERE name = 'Controller'
                            AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32'))
  );
```

**Step 4 — office_id back-fill** (from `270_md_state_executives.sql` lines 282–287):
```sql
-- STEP 4: Back-fill office_id on the politician row
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id = -3200006
  AND p.office_id IS NULL;

COMMIT;
```

**Structural registration** (from `1026_burbank_reconcile.sql` lines 92–94, OUTSIDE BEGIN/COMMIT):
```sql
-- Register structural migration in the ledger (OUTSIDE the transaction block).
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1050', 'nv_controller')
ON CONFLICT (version) DO NOTHING;
```

**Key NV substitutions vs. MD/VA analogs:**

| Analog value | NV value | Note |
|---|---|---|
| `'State of Maryland' AND state='MD'` | `geo_id = '32'` | NV gov row identified by geo_id=32; safer than name match |
| `'Maryland Governor'` (label) | `'Nevada Controller'` | District label |
| `'MD'` (state on district) | `'NV'` | UPPERCASE for STATE_EXEC |
| `'24'` (FIPS geo_id) | `'32'` | Nevada FIPS |
| external_id -240001 | -3200006 | Next free NV STATE_EXEC id |
| `representing_state = 'MD'` | `representing_state = 'NV'` | |
| back-fill range `BETWEEN -240010 AND -240001` | `= -3200006` (exact, only 1 new official) | |

---

### `1051_nv_house_headshots.sql` (audit-only, file-I/O)

**Analog:** `C:/EV-Accounts/backend/migrations/315_va_headshots.sql` (exact match — same politician_images INSERT pattern)

**File header** (from `315_va_headshots.sql` header style):
```sql
-- 1051_nv_house_headshots.sql
-- Phase 159 (NV-STATE-02): AUDIT-ONLY — politician_images rows for 4 NV US House reps.
-- NOT registered in supabase_migrations.schema_migrations; ledger stays at 1050.
-- Applied via mcp__supabase-local__execute_sql (not apply_migration).
-- Source: https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg (4:5 ratio, public_domain)
-- Already 4:5 — resize-only to 600x750 Lanczos q90 (no crop step needed).
-- Storage path: politician_photos/{politician_uuid}-headshot.jpg
-- Columns: (id, politician_id, url, type, photo_license) — NO photo_origin_url column (removed).
--
-- Bioguide IDs confirmed:
--   CD-1 Dina Titus T000468
--   CD-2 Mark E. Amodei A000369
--   CD-3 Susie Lee L000602
--   CD-4 Steven Horsford H001066
```

**INSERT pattern per rep** (from `315_va_headshots.sql` Task 1 action block — exact copy):
```sql
-- Dina Titus (CD-1, external_id=-32001)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -32001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/786af5d2-9502-401c-a3ed-61de88e589e9-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -32001)
);

-- Mark E. Amodei (CD-2, external_id=-32002)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -32002),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/030b5074-8335-48b3-8d6b-0ea7c09814a5-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -32002)
);

-- Susie Lee (CD-3, external_id=-32003)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -32003),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/325c7cae-aae6-4d7b-9c03-e707c7423d3c-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -32003)
);

-- Steven Horsford (CD-4, external_id=-32004)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -32004),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/7644cd40-b5c1-494a-8e65-f3126fc7f9ee-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -32004)
);
```

**Politician UUIDs** (DB-confirmed, from 159-RESEARCH.md):

| Rep | external_id | Politician UUID |
|-----|-------------|-----------------|
| Dina Titus (CD-1) | -32001 | `786af5d2-9502-401c-a3ed-61de88e589e9` |
| Mark E. Amodei (CD-2) | -32002 | `030b5074-8335-48b3-8d6b-0ea7c09814a5` |
| Susie Lee (CD-3) | -32003 | `325c7cae-aae6-4d7b-9c03-e707c7423d3c` |
| Steven Horsford (CD-4) | -32004 | `7644cd40-b5c1-494a-8e65-f3126fc7f9ee` |

**Critical column constraint** (from `315_va_headshots.sql` acceptance criteria + RESEARCH.md Pitfall 5):
- Column list is `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url` column (it was removed from the schema)
- `type = 'default'` (not 'headshot' or other values)
- `photo_license = 'public_domain'` (unitedstates.github.io images are public domain — confirmed in Phase 60 CA research)
- NOT registered — schema_migrations MAX stays at 1050 after this file

---

### `_tmp-nv-house-headshots.py` (utility/script, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py`

These are the 4 NV House rep headshots from unitedstates.github.io. The source images are already 450x550 (4:5) so **no crop step is needed** — resize-only.

**Full pipeline pattern** (from `104-01-PLAN.md` Task 1 action — copy verbatim):
```python
import os, requests
from PIL import Image
from io import BytesIO

BUCKET = 'politician_photos'
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'
TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90

ROSTER = [
    {
        'external_id': -32001,
        'full_name': 'Dina Titus',
        'politician_id': '786af5d2-9502-401c-a3ed-61de88e589e9',
        'bioguide': 'T000468',
        'title': 'U.S. Representative (CD-1)',
        'is_required': True,
    },
    {
        'external_id': -32002,
        'full_name': 'Mark E. Amodei',
        'politician_id': '030b5074-8335-48b3-8d6b-0ea7c09814a5',
        'bioguide': 'A000369',
        'title': 'U.S. Representative (CD-2)',
        'is_required': True,
    },
    {
        'external_id': -32003,
        'full_name': 'Susie Lee',
        'politician_id': '325c7cae-aae6-4d7b-9c03-e707c7423d3c',
        'bioguide': 'L000602',
        'title': 'U.S. Representative (CD-3)',
        'is_required': True,
    },
    {
        'external_id': -32004,
        'full_name': 'Steven Horsford',
        'politician_id': '7644cd40-b5c1-494a-8e65-f3126fc7f9ee',
        'bioguide': 'H001066',
        'title': 'U.S. Representative (CD-4)',
        'is_required': True,
    },
]

def download_image(bioguide):
    """Download from unitedstates/images; fall back to clerk.house.gov if 404."""
    url = f'https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg'
    r = requests.get(url, timeout=30)
    if r.status_code == 404:
        url = f'https://clerk.house.gov/images/members/{bioguide}.jpg'
        r = requests.get(url, timeout=30)
    r.raise_for_status()
    return Image.open(BytesIO(r.content))

def resize_600x750(img):
    """Source is already 4:5 (450x550). Resize-only — no crop needed."""
    return img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)

def upload_to_storage(img, politician_id):
    """Upload JPEG to Supabase Storage at politician_photos/{uuid}-headshot.jpg."""
    buf = BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY)
    buf.seek(0)
    storage_path = f'{politician_id}-headshot.jpg'
    upload_url = f'{os.environ["SUPABASE_URL"]}/storage/v1/object/{BUCKET}/{storage_path}'
    headers = {
        'Authorization': f'Bearer {os.environ["SUPABASE_SERVICE_ROLE_KEY"]}',
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
    }
    resp = requests.put(upload_url, data=buf.read(), headers=headers)
    resp.raise_for_status()
    return f'{CDN_BASE}/{storage_path}'
```

**Manifest output format** (from `104-01-PLAN.md` — required by downstream headshot migration):
```
=== NV HOUSE HEADSHOT MANIFEST ===
SUCCESS: -32001 Dina Titus 786af5d2-9502-401c-a3ed-61de88e589e9 -> https://kxsdzaojfaibhuzmclfq...
SUCCESS: -32002 Mark E. Amodei 030b5074-8335-48b3-8d6b-0ea7c09814a5 -> https://kxsdzaojfaibhuzmclfq...
SUCCESS: -32003 Susie Lee 325c7cae-aae6-4d7b-9c03-e707c7423d3c -> https://kxsdzaojfaibhuzmclfq...
SUCCESS: -32004 Steven Horsford 7644cd40-b5c1-494a-8e65-f3126fc7f9ee -> https://kxsdzaojfaibhuzmclfq...
TOTALS: NV House 4/4 succeeded
```

**Bioguide fallback** (from 159-RESEARCH.md Pitfall 3 — all 4 are incumbents, primary URL should work):
```
Primary:  https://unitedstates.github.io/images/congress/450x550/{bioguide}.jpg
Fallback: https://clerk.house.gov/images/members/{bioguide}.jpg
```

---

### `_tmp-nv-controller-headshot.py` (utility/script, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py`

Same pipeline as the House script above, except the source image may NOT be 4:5 ratio (campaign/Wikipedia source), so a **crop-to-4:5 step is required** before resizing. Per project memory `feedback_headshot_resize_no_distort.md`: crop first, THEN resize.

**Crop-first pattern** (from CLAUDE.md memory + `104-01-PLAN.md` context):
```python
def crop_to_4_5(img):
    """Crop image to 4:5 aspect ratio (eyes at ~1/3 from top, full head+shoulders).
    Never change aspect ratio — only crop. Do not stretch."""
    w, h = img.size
    target_ratio = 4 / 5
    current_ratio = w / h
    if current_ratio > target_ratio:
        # Too wide — crop sides
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        img = img.crop((left, 0, left + new_w, h))
    elif current_ratio < target_ratio:
        # Too tall — crop bottom (preserve head at top)
        new_h = int(w / target_ratio)
        img = img.crop((0, 0, w, new_h))
    return img
```

**Source resolution for Andy Matthews** (from 159-RESEARCH.md §Headshot Sources):
- Primary check: `https://unitedstates.github.io/images/congress/450x550/` — NOT applicable (Matthews is a state official, not federal)
- Use `/find-headshots` skill to locate a Wikimedia Commons or official source with a free license (cc_by, public_domain) before running the script
- Campaign site `andyfornevada.com/wp-content/uploads/2019/09/DSC06381-1920.jpg` is the fallback but license must be verified
- The Controller's official page at `controller.nv.gov/controller-info/` has no portrait in HTML per RESEARCH.md

**After crop+resize, proceed identically to House script:** upload to `politician_photos/{andy-matthews-uuid}-headshot.jpg`.

The politician_id for Andy Matthews is NOT yet in the DB — it will be created by migration 1050 (`external_id=-3200006`). The script must either:
1. Accept the UUID as a CLI argument (derived from migration 1050 output), OR
2. Query the DB at runtime: `SELECT id FROM essentials.politicians WHERE external_id = -3200006`

Runtime DB lookup is preferred per `104-01-PLAN.md` Task 1 action.

---

## Shared Patterns

### Idempotent Politician INSERT — ON CONFLICT external_id DO NOTHING
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` lines 107–113
**Apply to:** Migration 1050 (Controller INSERT)
```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
```
The `external_id` column has a unique constraint. If re-run after a partial failure, `RETURNING id` gives NULL and the downstream office INSERT safely no-ops via `AND p.id IS NOT NULL`.

### Idempotent Office INSERT — NOT EXISTS (district_id, chamber_id)
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` lines 130–137
**Apply to:** Migration 1050 (Controller office INSERT)
```sql
AND NOT EXISTS (
  SELECT 1 FROM essentials.offices o
  WHERE o.district_id = d.id
    AND o.chamber_id = (SELECT id FROM essentials.chambers
                        WHERE name = 'Controller'
                          AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32'))
);
```
This is the single-member exec pattern — one seat per chamber per district.

### Idempotent District INSERT — WHERE NOT EXISTS (district_type, state, label)
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` lines 59–64
**Apply to:** Migration 1050 (Controller district INSERT)
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'NV' AND label = 'Nevada Controller'
);
```
No unique constraint on districts — always guard with WHERE NOT EXISTS.

### Idempotent Chamber INSERT — WHERE NOT EXISTS (name, government_id)
**Source:** `C:/EV-Accounts/backend/migrations/300_va_government_chambers.sql` lines 48–60
**Apply to:** Migration 1050 (Controller chamber INSERT)
```sql
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Controller'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '32')
);
```
No unique constraint on chambers — always guard. slug is GENERATED ALWAYS — never include in column list.

### Structural Migration Registration
**Source:** `.planning/phases/155-norwalk-deep-seed/155-PATTERNS.md` Shared Pattern "ON CONFLICT DO NOTHING for schema_migrations"
**Apply to:** Migration 1050 only (1051 is audit-only, not registered)
```sql
-- OUTSIDE the BEGIN/COMMIT block:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1050', 'nv_controller')
ON CONFLICT (version) DO NOTHING;
```

### politician_images INSERT — Column Shape (No photo_origin_url)
**Source:** `C:/EV-Accounts/backend/migrations/315_va_headshots.sql` (Task 1 action block)
**Apply to:** Migration 1051 (all 4 House rep rows) + Controller headshot row
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = <ext_id>),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/<uuid>-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = <ext_id>)
);
```
CONFIRMED: `politician_images` has NO `photo_origin_url` column (removed per RESEARCH.md Pitfall 5). The 5 columns are: `id, politician_id, url, type, photo_license`. Optionally `focal_point`.

### STATE_EXEC state= Casing Rule
**Source:** `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` + 102-PATTERNS.md Shared Patterns
**Apply to:** Migration 1050 (Controller district + office rows)
```sql
-- STATE_EXEC districts: state = 'NV'  UPPERCASE
-- NATIONAL_UPPER/NATIONAL_LOWER districts: state = 'NV'  UPPERCASE
-- STATE_UPPER/STATE_LOWER (legislature, Phase 160): state = 'nv'  lowercase (TIGER loader convention)
```

### Section-Split Verification SQL
**Source:** `.planning/phases/155-norwalk-deep-seed/155-PATTERNS.md` + `feedback_section_split_check.md`
**Apply to:** Post-migration verification for migration 1050
```sql
-- Run after migration 1050; expect 0 rows.
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE (d.state = 'NV' OR d.state = 'nv')
  AND d.district_type = 'STATE_EXEC'
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
-- Zero rows = clean (no politician appears under two different governments).
```

### Python Headshot Upload Pipeline
**Source:** `C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py` (template) + `104-01-PLAN.md` Task 1 action
**Apply to:** Both headshot scripts
```python
# Required constants (from _tmp-va-execs-headshots.py verbatim):
BUCKET = 'politician_photos'
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'
TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
# Resize algorithm:
img = img.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
# Upload header:
headers = {
    'Authorization': f'Bearer {os.environ["SUPABASE_SERVICE_ROLE_KEY"]}',
    'Content-Type': 'image/jpeg',
    'x-upsert': 'true',   # upsert semantics
}
```

---

## No Analog Found

All file roles have analogs. One partial gap:

| Item | Reason | Resolution |
|------|---------|------------|
| Andy Matthews headshot source | Official `controller.nv.gov` has no portrait in HTML (per RESEARCH.md); campaign site license unverified | Run `/find-headshots` skill for Andy Matthews before writing the script. Prefer Wikimedia Commons cc_by or public_domain. If only campaign site available, note license as 'unknown' and flag for follow-up. |

---

## Migration Counter Reference

| Migration | Name | Type | Registers in schema_migrations? |
|-----------|------|------|----------------------------------|
| 1050 | `nv_controller` | Structural | YES |
| 1051 | `nv_house_headshots` | Audit-only | NO |
| (Controller headshot) | `nv_controller_headshot` | Audit-only | NO — applied via execute_sql after upload |

The planner should write a separate Controller headshot migration (could be combined with 1051 or kept as 1052) after the headshot script runs and the politician_id is known.

**STATE.md says "next migration 1048" — this is WRONG.** DB MAX=1049 (confirmed 2026-06-23). Phase 159 structural migration starts at **1050**.

---

## Key UUIDs Reference (DB-confirmed 2026-06-23)

| Entity | UUID |
|--------|------|
| State of Nevada government | `9bb67edf-1081-4941-8f7d-2e791a5d28a1` |
| State of Nevada geo_id | `32` |
| Andy Matthews external_id | `-3200006` (politician UUID = TBD, created by mig 1050) |
| Dina Titus (CD-1) | `786af5d2-9502-401c-a3ed-61de88e589e9` (ext -32001) |
| Mark E. Amodei (CD-2) | `030b5074-8335-48b3-8d6b-0ea7c09814a5` (ext -32002) |
| Susie Lee (CD-3) | `325c7cae-aae6-4d7b-9c03-e707c7423d3c` (ext -32003) |
| Steven Horsford (CD-4) | `7644cd40-b5c1-494a-8e65-f3126fc7f9ee` (ext -32004) |
| U.S. Senate chamber | `7cbe07bc-84b8-433b-952b-540e7de18a92` |
| U.S. House of Representatives chamber | `c2facc31-7b13-428c-b7b9-32d0d3b95f76` |
| NV NATIONAL_UPPER district (both senators) | `0b8a7177-94a5-428e-b88e-4fdbc894cb14` |
| Cortez Masto (senator) | `91f87a53-13bc-4d35-b3c8-49227ae80faa` (ext -400057) |
| Jacky Rosen (senator) | `e3a590be-1816-46bc-98f0-6a911dec9d9d` (ext -400058) |

---

## Metadata

**Analog search scope:** `.planning/phases/101-va-state-government-db/`, `.planning/phases/102-va-federal-officials/`, `.planning/phases/104-va-headshots/`, `.planning/phases/155-norwalk-deep-seed/`, `supabase/migrations/205_sf_government_structure.sql`
**Files read:** 101-01-PLAN.md, 101-PATTERNS.md, 102-01-PLAN.md, 102-PATTERNS.md, 104-01-PLAN.md, 104-05-PLAN.md, 155-PATTERNS.md, 205_sf_government_structure.sql, 159-RESEARCH.md, STATE.md
**Pattern extraction date:** 2026-06-23
