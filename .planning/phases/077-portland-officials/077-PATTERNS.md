# Phase 77: Portland City Structure + Officials - Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 3 (migration 230, migration 231, headshot audit SQL)
**Analogs found:** 3 / 3

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/230_portland_government_structure.sql` | migration | CRUD | `205_sf_government_structure.sql` + `207_sd_government_structure.sql` | exact (5-chamber variant) |
| `C:/EV-Accounts/backend/migrations/231_portland_officials.sql` | migration | CRUD | `214_berkeley_officials.sql` | exact (multi-member district, Mayor + Auditor on LOCAL_EXEC) |
| `C:/EV-Accounts/backend/migrations/232_portland_headshots.sql` (audit-only) | migration | file-I/O | `215_berkeley_headshots.sql` | exact (audit-only pattern, public_domain license) |

---

## Pattern Assignments

### `230_portland_government_structure.sql` (migration, CRUD)

**Analog:** `205_sf_government_structure.sql` (10-chamber version) and `207_sd_government_structure.sql` (3-chamber version). Portland uses 5 chambers — in between.

**Key difference from all prior cities:** Portland OR uses `state='OR'` (uppercase) on the governments row but `state='or'` (lowercase) on districts rows. This is the TIGER OR loader convention confirmed in Phase 76 migration 229.

#### Outer wrapper

```sql
BEGIN;
-- ... all INSERTs ...
COMMIT;
```

#### Government row pattern (lines 1–8 of 207_sd_government_structure.sql):

```sql
-- governments has NO unique constraint on geo_id — use WHERE NOT EXISTS
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Portland, Oregon, US',
       'LOCAL', 'OR', 'Portland', '4159000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Portland, Oregon, US' AND state = 'OR'
);
```

Critical: `state='OR'` uppercase on governments. Name string `'City of Portland, Oregon, US'` distinguishes from Portland, Maine.

#### Chamber INSERT pattern (one block per chamber, no `slug` column):

From `207_sd_government_structure.sql`:

```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Portland City Council',
       (SELECT id FROM essentials.governments
        WHERE name='City of Portland, Oregon, US' AND state='OR')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments
                       WHERE name='City of Portland, Oregon, US' AND state='OR')
);
```

Repeat this pattern for all 5 Portland chambers:

| `name` | `name_formal` |
|---|---|
| `City Council` | `Portland City Council` |
| `Mayor` | `Mayor of Portland` |
| `City Auditor` | `Portland City Auditor` |
| `City Administrator` | `Portland City Administrator` |
| `City Attorney` | `Portland City Attorney` |

NEVER include `slug` in the INSERT — it is a `GENERATED ALWAYS` column and will cause a runtime error.

#### LOCAL_EXEC district for citywide offices:

From `205_sf_government_structure.sql` Step 4 (adapted for OR lowercase state):

```sql
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '4159000', 'LOCAL_EXEC', 'Portland (Citywide)', 'or'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='4159000' AND state='or' AND district_type IN ('LOCAL','LOCAL_EXEC')
);
```

Critical:
- Column is `label` NOT `name` (confirmed in Phase 63-01 auto-fix deviation log)
- `state='or'` lowercase — matches how Phase 76 migration 229 created the council district rows
- NO `ON CONFLICT (geo_id, district_type) DO NOTHING` — that unique constraint does not exist (confirmed in Phase 63-01 deviation log); use `WHERE NOT EXISTS` only
- `district_type='LOCAL_EXEC'` for citywide offices (Mayor, City Auditor, City Administrator, City Attorney)

#### Post-scaffold verification query:

```sql
-- Gate A: government row
SELECT id, name, type, state, geo_id FROM essentials.governments
WHERE name='City of Portland, Oregon, US';
-- Expected: 1 row, type='LOCAL', state='OR', geo_id='4159000'

-- Gate B: 5 chambers
SELECT name, name_formal FROM essentials.chambers
WHERE government_id=(SELECT id FROM essentials.governments
                     WHERE name='City of Portland, Oregon, US' AND state='OR')
ORDER BY name;
-- Expected: 5 rows

-- Gate C: LOCAL_EXEC district
SELECT geo_id, district_type, label FROM essentials.districts
WHERE geo_id='4159000' AND state='or';
-- Expected: 1 row, district_type='LOCAL_EXEC'

-- Gate D: section-split check (0 rows = clean)
SELECT ch.name_formal, COUNT(DISTINCT o.id) AS office_count
FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.government_id = (SELECT id FROM essentials.governments
                          WHERE name='City of Portland, Oregon, US' AND state='OR')
GROUP BY ch.name_formal;
-- Expected: 0 rows (no offices yet — run again after 231 with expected counts)
```

---

### `231_portland_officials.sql` (migration, CRUD)

**Analog:** `214_berkeley_officials.sql` — Berkeley is the closest structural match: includes City Auditor as a citywide elected official sharing LOCAL_EXEC district with Mayor; single council chamber with district-linked offices.

**Key differences from Berkeley:**
- Portland has 3 council offices per district (not 1), all pointing to the same `portland-or-council-district-N` geo_id
- Portland uses `state='or'` on district lookups (not `'CA'`)
- Portland has 2 appointed officials (City Administrator + City Attorney) with `is_appointed_position=true`
- Portland government name subquery uses `state='OR'` (uppercase); district WHERE clause uses `state='or'` (lowercase)

#### WITH ins_p CTE pattern — council member (3 per district, repeat for all 12):

From `214_berkeley_officials.sql` adapted for Portland:

```sql
-- District 1 Seat 1: Candace Avalos (-690010)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Candace Avalos', 'Candace', 'Avalos', NULL,
          true, false, false, true, -690010)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name='City Council'
          AND government_id=(SELECT id FROM essentials.governments
                             WHERE name='City of Portland, Oregon, US' AND state='OR')),
       p.id,
       'City Councilor (District 1)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'portland-or-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

All 3 District 1 offices use the same `d.geo_id = 'portland-or-council-district-1'`. Repeat 3 times (once per member) with distinct external_ids and the same title `'City Councilor (District 1)'`. Repeat the block set for Districts 2, 3, 4.

#### WITH ins_p CTE pattern — Mayor (LOCAL_EXEC, elected):

From `214_berkeley_officials.sql` Step 4 (Mayor pattern), adapted for Portland:

```sql
-- Mayor: Keith Wilson (-690001)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Keith Wilson', 'Keith', 'Wilson', NULL,
          true, false, false, true, -690001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name='Mayor'
          AND government_id=(SELECT id FROM essentials.governments
                             WHERE name='City of Portland, Oregon, US' AND state='OR')),
       p.id,
       'Mayor', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4159000'
  AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

#### WITH ins_p CTE pattern — City Auditor (LOCAL_EXEC, elected):

From `214_berkeley_officials.sql` Step 5 (City Auditor pattern):

```sql
-- City Auditor: Simone Rede (-690002)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Simone Rede', 'Simone', 'Rede', NULL,
          true, false, false, true, -690002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name='City Auditor'
          AND government_id=(SELECT id FROM essentials.governments
                             WHERE name='City of Portland, Oregon, US' AND state='OR')),
       p.id,
       'City Auditor', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4159000'
  AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

#### WITH ins_p CTE pattern — appointed officials (is_appointed_position=true):

From `63-02-PLAN.md` Steps 4–5 (SF Controller/City Administrator appointed pattern):

```sql
-- City Administrator: Raymond C. Lee III (-690003, APPOINTED)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Raymond C. Lee III', 'Raymond', 'Lee', NULL,
          true, false, false, true, -690003)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name='City Administrator'
          AND government_id=(SELECT id FROM essentials.governments
                             WHERE name='City of Portland, Oregon, US' AND state='OR')),
       p.id,
       'City Administrator', 'OR', true, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4159000'
  AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

Note `is_appointed_position, is_vacant, role_canonical) ... true, false, NULL` — the third-to-last value is `true` for appointed officials. Same pattern for City Attorney Robert L. Taylor (-690004) using `'City Attorney'` chamber name.

#### Back-fill UPDATE (must be last statement before COMMIT):

From `214_berkeley_officials.sql` Step 6:

```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -690021 AND -690001
  AND p.office_id IS NULL;
```

This is REQUIRED — Plan 77-03 work-list query joins `politicians` on `office_id` to find who needs headshots. Without this UPDATE the headshot work-list returns 0 rows.

#### Complete 16-official roster for migration 231:

| external_id | full_name | Chamber | district geo_id | is_appointed_position |
|---|---|---|---|---|
| -690001 | Keith Wilson | Mayor | 4159000 LOCAL_EXEC | false |
| -690002 | Simone Rede | City Auditor | 4159000 LOCAL_EXEC | false |
| -690003 | Raymond C. Lee III | City Administrator | 4159000 LOCAL_EXEC | true |
| -690004 | Robert L. Taylor | City Attorney | 4159000 LOCAL_EXEC | true |
| -690010 | Candace Avalos | City Council | portland-or-council-district-1 LOCAL | false |
| -690011 | Jamie Dunphy | City Council | portland-or-council-district-1 LOCAL | false |
| -690012 | Loretta Smith | City Council | portland-or-council-district-1 LOCAL | false |
| -690013 | Dan Ryan | City Council | portland-or-council-district-2 LOCAL | false |
| -690014 | Elana Pirtle-Guiney | City Council | portland-or-council-district-2 LOCAL | false |
| -690015 | Sameer Kanal | City Council | portland-or-council-district-2 LOCAL | false |
| -690016 | Angelita Morillo | City Council | portland-or-council-district-3 LOCAL | false |
| -690017 | Steve Novick | City Council | portland-or-council-district-3 LOCAL | false |
| -690018 | Tiffany Koyama Lane | City Council | portland-or-council-district-3 LOCAL | false |
| -690019 | Eric Zimmerman | City Council | portland-or-council-district-4 LOCAL | false |
| -690020 | Mitch Green | City Council | portland-or-council-district-4 LOCAL | false |
| -690021 | Olivia Clark | City Council | portland-or-council-district-4 LOCAL | false |

#### Post-migration verification queries:

```sql
-- 16 Portland politicians in range
SELECT external_id, full_name, is_active, is_incumbent
FROM essentials.politicians
WHERE external_id BETWEEN -690021 AND -690001
ORDER BY external_id;
-- Expected: 16 rows, all is_active=true, is_incumbent=true

-- Office counts by chamber
SELECT ch.name, COUNT(*) AS office_count
FROM essentials.offices o
JOIN essentials.politicians p ON p.id = o.politician_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE p.external_id BETWEEN -690021 AND -690001
GROUP BY ch.name ORDER BY ch.name;
-- Expected: City Administrator=1, City Attorney=1, City Auditor=1, City Council=12, Mayor=1

-- is_appointed_position check
SELECT p.full_name, o.is_appointed_position
FROM essentials.offices o
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id BETWEEN -690021 AND -690001
ORDER BY o.is_appointed_position DESC, p.full_name;
-- Expected: 2 rows true (Lee, Taylor), 14 rows false

-- District 4 routing (Portland City Hall → 3 council members)
SELECT p.full_name, d.geo_id, o.title
FROM essentials.geofence_boundaries gb
JOIN essentials.districts d ON d.geo_id = gb.geo_id
JOIN essentials.offices o ON o.district_id = d.id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE gb.mtfcc = 'X0012'
  AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint(-122.6794, 45.5231), 4326))
  AND o.is_vacant = false;
-- Expected: 3 rows — Zimmerman, Green, Clark (portland-or-council-district-4)

-- Section-split detector (0 rows = clean)
SELECT ch.name_formal, COUNT(DISTINCT o.id) AS office_count
FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.government_id = (SELECT id FROM essentials.governments
                          WHERE name='City of Portland, Oregon, US' AND state='OR')
GROUP BY ch.name_formal;
-- Expected: 5 rows (one per chamber, correct counts)
```

---

### `232_portland_headshots.sql` (audit-only migration, file-I/O)

**Analog:** `215_berkeley_headshots.sql` — same audit-only pattern (NOT added to Supabase ledger).

**Analog for work-list query:** `68-03-PLAN.md` Task 1 Step 1.

#### Work-list query (run before downloading any headshots):

From `68-03-PLAN.md`:

```sql
SELECT p.id, p.external_id, p.full_name, ch.name AS chamber, o.title,
       p.photo_origin_url
FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
LEFT JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE g.name = 'City of Portland, Oregon, US' AND g.state = 'OR'
  AND p.external_id BETWEEN -690021 AND -690001
  AND p.is_active = true
  AND p.is_vacant = false
  AND pi.id IS NULL
  AND o.is_appointed_position = false
ORDER BY ch.name, p.external_id;
```

Expected: 14 rows on first run (Mayor + City Auditor + 12 council; excludes City Administrator -690003 and City Attorney -690004 which are appointed).

#### politician_images INSERT pattern (one per official after upload):

From `215_berkeley_headshots.sql` / `68-03-PLAN.md`:

```sql
INSERT INTO essentials.politician_images
  (id, politician_id, url, type, photo_license, focal_point)
VALUES (
  gen_random_uuid(),
  (SELECT id FROM essentials.politicians WHERE external_id = -690001),
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg',
  'default',
  'public_domain',
  NULL
);
```

CRITICAL: `type='default'` not `'headshot'`. The UI uses `.find(img => img.type === 'default')` — any other value = invisible headshot.

#### photo_origin_url UPDATE pattern:

```sql
UPDATE essentials.politicians
SET photo_origin_url = 'https://www.portland.gov/sites/default/files/public/2024/Wilson-Blue-Background_0.png'
WHERE external_id = -690001;
```

#### Headshot processing pipeline:

Source URL: `https://www.portland.gov/sites/default/files/public/[year]/[filename]` (drop `styles/1_1_160w/` segment — that is the thumbnail prefix)

Processing order (matches `feedback_headshot_resize_no_distort.md` memory rule):
1. Download full-size from portland.gov
2. Crop to 4:5 ratio (do not change aspect ratio, do not stretch)
3. Resize to 600x750 Lanczos q90
4. Upload to Supabase Storage at `politician_photos/{politician_id}-headshot.jpg`

---

## Shared Patterns

### State Casing Rule (OR-specific — critical)

**Applies to:** All migration 230 and 231 SQL

| Table | Column | Value | Reason |
|---|---|---|---|
| `essentials.governments` | `state` | `'OR'` (uppercase) | Government table convention |
| `essentials.chambers` | via government_id subquery | `state='OR'` in subquery | Must match governments row |
| `essentials.districts` (Phase 76 existing rows) | `state` | `'or'` (lowercase) | OR TIGER loader convention (confirmed Phase 76 SUMMARY SC-3 output) |
| `essentials.districts` (new LOCAL_EXEC row) | `state` | `'or'` (lowercase) | Matches existing council district rows |
| `essentials.districts` WHERE clauses in offices INSERTs | `state` | `'or'` (lowercase) | Must match stored rows |

**Source:** Phase 76-01-SUMMARY.md SC-3: `SELECT COUNT(*) FROM essentials.districts WHERE geo_id LIKE 'portland-or-council-district-%' AND district_type='LOCAL' AND state='or'; -- Result: 4`

### Idempotency Guards

**Applies to:** All government scaffold INSERTs (migration 230)

```sql
-- governments: WHERE NOT EXISTS keyed on (name, state)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Portland, Oregon, US' AND state = 'OR'
);

-- chambers: WHERE NOT EXISTS keyed on (name, government_id subquery)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments
                       WHERE name='City of Portland, Oregon, US' AND state='OR')
);

-- districts: WHERE NOT EXISTS keyed on (geo_id, state, district_type IN (...))
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='4159000' AND state='or' AND district_type IN ('LOCAL','LOCAL_EXEC')
);
```

Never use `ON CONFLICT (geo_id, district_type) DO NOTHING` for districts — that unique constraint does not exist and will cause a runtime error.

### Politicians INSERT Idempotency

**Applies to:** All politician rows (migration 231)

```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
```

Paired with `AND p.id IS NOT NULL` in the CROSS JOIN clause to ensure re-runs produce 0 new office rows when politicians already exist.

### Office INSERT Idempotency

**Applies to:** All office rows (migration 231)

```sql
AND NOT EXISTS (
  SELECT 1 FROM essentials.offices o
  WHERE o.district_id = d.id AND o.politician_id = p.id
)
```

No unique index exists on offices — only the NOT EXISTS guard prevents duplicates.

### Antipartisan Rule

**Applies to:** All politician rows

`party = NULL` always. Party data must never be stored in a way that could surface in the UI (per `feedback_antipartisan_display.md` memory).

### offices Column List (exact — no extras)

**Applies to:** All office INSERTs

```
id, district_id, chamber_id, politician_id, title, representing_state,
is_appointed_position, is_vacant, role_canonical
```

No `seat_label`, `email`, or `is_active` columns — those do not exist on the offices table (confirmed in Phase 63-02 and 68-02 critical constraints).

### Headshot Storage URL Template

**Applies to:** All politician_images INSERTs

```
https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg
```

Replace `{politician_id}` with the UUID from `essentials.politicians.id` (not external_id).

---

## No Analog Found

None. All 3 migration types have direct codebase analogs.

---

## Migration Ledger Rules

| Migration | File location | Ledger (schema_migrations)? | Reason |
|---|---|---|---|
| 230_portland_government_structure.sql | `supabase/migrations/` | YES — structural | Creates districts rows (same as 205, 207, 213, 229) |
| 231_portland_officials.sql | `C:/EV-Accounts/backend/migrations/` | YES — structural | Creates politicians + offices rows |
| 232_portland_headshots.sql | `C:/EV-Accounts/backend/migrations/` | NO — audit-only | Mirrors 215_berkeley_headshots.sql, 212_fremont_headshots.sql, 228_or_legislature_headshots.sql patterns |

---

## Metadata

**Analog search scope:** `.planning/phases/63-sf-deep-seed/`, `.planning/phases/65-sd-deep-seed/`, `.planning/phases/68-berkeley-deep-seed/`, `.planning/phases/76-portland-council-geofences/`, `supabase/migrations/`
**Files scanned:** 12 plan/summary/migration files
**Pattern extraction date:** 2026-05-29
