# Phase 92: MD State Government DB - Pattern Map

**Mapped:** 2026-06-05
**Files analyzed:** 3 (269_md_government_chambers.sql, 270_md_state_executives.sql, politician_images inserts)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/269_md_government_chambers.sql` | migration | CRUD | `222_or_government_chambers.sql` | exact |
| `C:/EV-Accounts/backend/migrations/270_md_state_executives.sql` | migration | CRUD | `169_me_state_executives.sql` + `223_or_executive_officials.sql` | exact (hybrid) |
| Supabase Storage uploads + `politician_images` rows | migration | file-I/O + CRUD | `245_multnomah_county_headshots.sql` | role-match |

---

## Pattern Assignments

### `269_md_government_chambers.sql` (migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql`
**Secondary analog:** `C:/EV-Accounts/backend/migrations/168_me_government_chambers.sql`

**Key MD difference from both analogs:** Government row pre-exists from migration 174 (bulk 50-state stub). Migration 269 must NOT insert it — use a DO block that asserts exactly 1 row exists (OR 222 pattern), NOT the ME 168 pattern that inserts a new government row.

**Pre-flight assert pattern** (`222_or_government_chambers.sql` lines 43-52):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'State of Oregon' AND state = 'OR') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Oregon government row; found %',
      (SELECT COUNT(*) FROM essentials.governments
       WHERE name = 'State of Oregon' AND state = 'OR');
  END IF;
END $$;
```
Adapt: replace `'State of Oregon'` with `'State of Maryland'`, `'OR'` with `'MD'`.

**Chamber INSERT pattern** (`222_or_government_chambers.sql` lines 55-64, Governor example):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Governor',
       'Governor of Oregon',
       (SELECT id FROM essentials.governments WHERE name = 'State of Oregon' AND state = 'OR')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Governor'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Oregon' AND state = 'OR')
);
```
Adapt: `'Governor of Oregon'` → `'Governor of Maryland'`; `'State of Oregon'` → `'State of Maryland'`; `AND state = 'OR'` → `AND state = 'MD'`.

**Note on `name` vs `name_formal` for MD chambers** (from OR 222 naming convention, lines 25-30):
- Short `name` column + state-qualified `name_formal` column is the OR/CA pattern
- Exception: `'State Treasurer'` chamber uses asymmetric formal name: `name='State Treasurer'`, `name_formal='Maryland State Treasurer'` (research-verified; the OR pattern for this chamber was `name_formal='Oregon State Treasurer'`)

**MD chamber rows to create (5 total, D-01):**

| name | name_formal | Notes |
|---|---|---|
| `Governor` | `Governor of Maryland` | voter-elected |
| `Lieutenant Governor` | `Lieutenant Governor of Maryland` | D-01: standalone, NOT under Governor |
| `Attorney General` | `Attorney General of Maryland` | voter-elected |
| `Comptroller` | `Comptroller of Maryland` | voter-elected |
| `State Treasurer` | `Maryland State Treasurer` | D-03: legislature-elected |

**CRITICAL — never include `slug` in INSERT** (`222_or_government_chambers.sql` line 18):
> `slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list`

**File wrapper pattern** (OR 222 lines 40, 138):
```sql
BEGIN;
-- ... all inserts ...
COMMIT;
```

---

### `270_md_state_executives.sql` (migration, CRUD)

**Primary analog for districts + office_id back-fill:** `C:/EV-Accounts/backend/migrations/169_me_state_executives.sql`
**Primary analog for CTE politician+office structure:** `C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql`

**Key MD differences from OR 223:**
1. Use **5 separate STATE_EXEC districts** (ME 169 pattern), not one shared district (OR 223 pattern)
2. `state='MD'` uppercase on all STATE_EXEC rows — lowercase causes silent routing failure (OR 223a lesson)
3. `geo_id='24'` (MD FIPS), `district_id=''`, `mtfcc=''`
4. `is_appointed_position=true` for State Treasurer ONLY (`external_id=-240005`)
5. `is_appointed=true` on Davis politician row only

**Step 1 — STATE_EXEC district INSERT pattern** (`169_me_state_executives.sql` lines 31-36, Governor example):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'ME', '23', 'Maine Governor', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'ME' AND label = 'Maine Governor'
);
```
Adapt: `'ME'` → `'MD'`; `'23'` → `'24'`; label values per MD label table (see below).

**MD STATE_EXEC district labels (5 rows):**

| label | state | geo_id |
|---|---|---|
| `Maryland Governor` | `MD` | `24` |
| `Maryland Lieutenant Governor` | `MD` | `24` |
| `Maryland Attorney General` | `MD` | `24` |
| `Maryland Comptroller` | `MD` | `24` |
| `Maryland State Treasurer` | `MD` | `24` |

**Step 2 — CTE politician + office INSERT pattern** (`169_me_state_executives.sql` lines 66-95, Governor example):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Janet T. Mills', 'Janet', 'Mills', 'Democrat',
          true, false, false, true, -230001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Maine Governor'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine')),
       p.id,
       'Governor', 'ME', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'ME' AND d.label = 'Maine Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                          WHERE name = 'Maine Governor'
                            AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine'))
  );
```
Adapt for MD: replace `'ME'` with `'MD'` in `representing_state`; `d.state = 'ME'` with `d.state = 'MD'`; use MD-specific district labels, chamber names, external_ids, and official names per the data table below.

**Note on chamber name lookup for MD:** Use `WHERE name = 'Governor'` (short name, OR convention) + `AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maryland' AND state = 'MD')`. This differs from ME where chamber names were state-prefixed (`'Maine Governor'`).

**MD officials data (5 rows):**

| external_id | full_name | first_name | last_name | chamber name | district label | title | is_appointed | is_appointed_position |
|---|---|---|---|---|---|---|---|---|
| -240001 | Wes Moore | Wes | Moore | Governor | Maryland Governor | Governor | false | false |
| -240002 | Aruna Miller | Aruna | Miller | Lieutenant Governor | Maryland Lieutenant Governor | Lieutenant Governor | false | false |
| -240003 | Anthony G. Brown | Anthony | Brown | Attorney General | Maryland Attorney General | Attorney General | false | false |
| -240004 | Brooke Lierman | Brooke | Lierman | Comptroller | Maryland Comptroller | Comptroller | false | false |
| -240005 | Dereck E. Davis | Dereck | Davis | State Treasurer | Maryland State Treasurer | State Treasurer | **true** | **true** |

All 5: `party='Democrat'`, `is_active=true`, `is_vacant=false`, `is_incumbent=true`.

**Step 3 — office_id back-fill pattern** (`169_me_state_executives.sql` lines 198-203):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -230010 AND -230001
  AND p.office_id IS NULL;
```
Adapt: `BETWEEN -230010 AND -230001` → `BETWEEN -240010 AND -240001`.

**Pre-flight assert** (same as migration 269 — repeat in migration 270):
Identical DO block, asserts `'State of Maryland'` + `state = 'MD'` exists exactly once.

**File wrapper:** `BEGIN;` ... `COMMIT;` (same as all prior state migrations).

---

### Supabase Storage uploads + `politician_images` rows

**Analog:** `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql`

**politician_images INSERT pattern** (`245_multnomah_county_headshots.sql` lines 29-37):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -410001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -410001)
);
```
Adapt: use MD external_ids (`-240001` through `-240005`); use `{politician_uuid}-headshot.jpg` storage path pattern; `photo_license='public_domain'` for all 5 (all from official government websites or Wikimedia Commons).

**CRITICAL — column is `url` not `storage_url`** (RESEARCH.md verified via `information_schema.columns`):
> Actual columns: `id, politician_id, url, type, photo_license, focal_point`
> `storage_url` does NOT exist.

**Storage URL pattern** (from live production rows):
```
https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/{politician_id}/default.jpg
```
Note: Some existing rows use `{politician_id}-headshot.jpg` path (Multnomah pattern); others use `{politician_id}/default.jpg` (OR state execs pattern). Use whichever matches how the image is uploaded to Storage.

**Headshot processing pattern** (from project memory):
1. Download source image (WebP/PNG/JPEG — see RESEARCH.md §Headshot Sources)
2. Inspect actual pixel dimensions
3. Crop to 4:5 ratio (center crop) — NEVER stretch to fit
4. Resize to 600×750 px, Lanczos resampling, JPEG quality 90
5. Upload to `politician_photos` bucket via `mcp__supabase-local` Storage tool
6. Insert `politician_images` row with `type='default'`, `photo_license='public_domain'`

**MD headshot sources:**

| external_id | Official | Source URL | Format | Notes |
|---|---|---|---|---|
| -240001 | Wes Moore | `https://cdn.maryland.gov/maryland-cms/prod/governor/s3fs-public/styles/3_4_504x672_focal_point_webp/public/images/2026-04/gov%201st%20size.png.webp` | WebP ~2.8MB | Download → convert to JPEG → crop 4:5 |
| -240002 | Aruna Miller | `https://cdn.maryland.gov/maryland-cms/prod/governor/s3fs-public/styles/3_4_504x672_focal_point_webp/public/images/2026-04/lg%201st%20size.png.webp` | WebP ~44KB | Same processing as Moore |
| -240003 | Anthony G. Brown | `https://oag.maryland.gov/our-office/PublishingImages/AttorneyGeneral.jpg` | JPEG 512×512 | Square → crop ~400×512 center → resize 600×750 |
| -240004 | Brooke Lierman | `https://www.marylandcomptroller.gov/about/brooke-lierman/_jcr_content/root/container/heroContainer/hero.coreimg.png/1740686184941/comptroller-portrait-cropped.png` | PNG ~2.8MB | Likely already portrait; crop 4:5 if needed |
| -240005 | Dereck E. Davis | `https://upload.wikimedia.org/wikipedia/commons/c/cb/Dereck_E._Davis_4_23_2025_%2854473095147%29_%28cropped%29.jpg` | JPEG ~1.3MB | Wikimedia Commons; already cropped per filename |

All URLs verified HTTP 200 as of 2026-06-05.

---

## Shared Patterns

### Pre-flight Government Row Assertion
**Source:** `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` lines 43-52
**Apply to:** Both migration 269 AND migration 270 (repeat at top of each)
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'State of Maryland' AND state = 'MD') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Maryland government row; found %',
      (SELECT COUNT(*) FROM essentials.governments
       WHERE name = 'State of Maryland' AND state = 'MD');
  END IF;
END $$;
```

### Idempotency Guards
**Source:** `169_me_state_executives.sql` + `222_or_government_chambers.sql`
**Apply to:** All INSERT statements in both migrations

| Target table | Guard pattern |
|---|---|
| `chambers` | `WHERE NOT EXISTS (SELECT 1 FROM essentials.chambers WHERE name=... AND government_id=...)` |
| `districts` | `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE district_type='STATE_EXEC' AND state='MD' AND label=...)` |
| `politicians` | `ON CONFLICT (external_id) DO NOTHING` |
| `offices` | `AND NOT EXISTS (SELECT 1 FROM essentials.offices WHERE district_id=d.id AND chamber_id=...)` inside the CTE |
| `politician_images` | `WHERE NOT EXISTS (SELECT 1 FROM essentials.politician_images WHERE politician_id=...)` |

### STATE_EXEC `state` Casing (Critical)
**Source:** `C:/EV-Accounts/backend/migrations/223a_or_executive_district_fix.sql` (the cautionary fix)
**Apply to:** All `essentials.districts` inserts in migration 270

Always use `state='MD'` (uppercase). The TIGER loader uses lowercase abbreviations for STATE_UPPER/STATE_LOWER/COUNTY — do NOT copy that pattern to STATE_EXEC rows. All 28 existing STATE_EXEC rows in production use uppercase postal abbreviations (CA, IN, MA, ME, OR, TX, UT).

### Never Insert `slug` on Chambers
**Source:** `222_or_government_chambers.sql` line 18, `168_me_government_chambers.sql` line 11
**Apply to:** All `essentials.chambers` INSERT statements

`slug` is `GENERATED ALWAYS` — including it in the INSERT column list causes a PostgreSQL error.

---

## No Analog Found

None — all 3 artifacts have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (168, 169, 222, 223, 223a, 245 read in full)
**Files scanned:** 6 migration files
**Pattern extraction date:** 2026-06-05
