# Phase 103: Alexandria Deep Seed - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 3 new migration files
**Analogs found:** 3 / 3

## File Classification

| New File | Role | Data Flow | Closest Analog | Match Quality |
|----------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/312_alexandria_government.sql` | migration | CRUD | `277_leonardtown_government.sql` | exact |
| `C:/EV-Accounts/backend/migrations/313_acps_school_board.sql` | migration | CRUD | `254_or_school_districts.sql` | exact |
| `C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql` | migration | CRUD | `271_md_executive_headshots.sql` | exact |

---

## Pattern Assignments

### `312_alexandria_government.sql` (city government migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql`

**Key deltas from analog:** geo_id `2446475` → `5101000`; state abbreviations `MD`/`md` → `VA`/`va`; Mayor Burris (-2446475001) → Mayor Gaskins (-5101000001); 5 council members → 6 council members (-5101000002 through -5101000007); government name pattern `'City of Alexandria, Virginia, US'`; chamber name `'City Council'` / `'Alexandria City Council'`; office count gate = 7 (not 6); section-split mtfcc `'G4110'` and state `'va'`.

**Pre-flight idempotency guard** (277 lines 33-39):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Town of Leonardtown, Maryland, US') > 0 THEN
    RAISE NOTICE 'Town of Leonardtown government row already exists — skipping government INSERT (idempotent re-run)';
  END IF;
END $$;
```
Adapt: change name to `'City of Alexandria, Virginia, US'` and change RAISE NOTICE text accordingly.

**Government INSERT with WHERE NOT EXISTS guard** (277 lines 48-55):
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
Adapt: name → `'City of Alexandria, Virginia, US'`, state → `'VA'`, city → `'Alexandria'`, geo_id → `'5101000'`.

**Chamber INSERT** (277 lines 62-73):
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
Adapt: chamber name → `'City Council'`, name_formal → `'Alexandria City Council'`, government name subqueries → `'City of Alexandria, Virginia, US'`. NOTE: slug is GENERATED ALWAYS — never include in column list.

**LOCAL_EXEC district INSERT** (277 lines 81-86):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'md', '2446475', 'Leonardtown (Townwide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2446475' AND district_type = 'LOCAL_EXEC' AND state = 'md'
);
```
Adapt: state → `'va'`, geo_id → `'5101000'`, label → `'Alexandria (Citywide)'`, mtfcc stays NULL.

**LOCAL district INSERT** (277 lines 92-97):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'md', '2446475', 'Leonardtown (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '2446475' AND district_type = 'LOCAL' AND state = 'md'
);
```
Adapt: state → `'va'`, geo_id → `'5101000'`, label → `'Alexandria (At-Large)'`, mtfcc stays NULL.

**Politician + office CTE block — Mayor (LOCAL_EXEC)** (277 lines 111-140):
```sql
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
Adapt for Mayor Gaskins: name → `'Alyia Gaskins'`, first_name → `'Alyia'`, last_name → `'Gaskins'`, external_id → `-5101000001`, chamber name → `'City Council'`, government name → `'City of Alexandria, Virginia, US'`, title → `'Mayor'`, representing_state → `'VA'`, geo_id → `'5101000'`, state → `'va'`.

**Politician + office CTE block — Council Member (LOCAL)** (277 lines 144-173):
```sql
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
  AND d.district_type = 'LOCAL'
  AND d.state = 'md'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Repeat this block 6 times (Bagley, Aguirre, Chapman, Elnoubi, Greene, Marks), external_ids -5101000002 through -5101000007. Change chamber name → `'City Council'`, government name → `'City of Alexandria, Virginia, US'`, title → `'Council Member'`, representing_state → `'VA'`, geo_id → `'5101000'`, district_type → `'LOCAL'`, state → `'va'`.

**office_id back-fill** (277 lines 312-317):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2446475006 AND -2446475001
  AND p.office_id IS NULL;
```
Adapt range: `BETWEEN -5101000007 AND -5101000001`.

**Post-verification DO block** (277 lines 327-371):
```sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_office_count INTEGER;
  v_split_count INTEGER;
BEGIN
  -- Gate (a): government row
  SELECT COUNT(*) INTO v_gov_count
  FROM essentials.governments
  WHERE name = 'Town of Leonardtown, Maryland, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Leonardtown government row, found %', v_gov_count;
  END IF;

  -- Gate (b): ALL offices linked to Leonardtown districts (LOCAL_EXEC + LOCAL combined)
  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '2446475'
    AND d.state = 'md';
  IF v_office_count <> 6 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 6 offices linked to geo_id=2446475 districts, found %', v_office_count;
  END IF;

  -- Gate (c): section-split detector
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '2446475'
    AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.state = 'md'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows for geo_id=2446475', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov_count=%, office_count=%, split_orphans=%',
    v_gov_count, v_office_count, v_split_count;
END $$;
```
Adapt: government name → `'City of Alexandria, Virginia, US'`, geo_id → `'5101000'`, state → `'va'`, office count gate → `7` (1 Mayor + 6 council), mtfcc → `'G4110'`. Also add Gate (d) for office_id back-fill nulls (BETWEEN -5101000007 AND -5101000001) to match the fuller pattern from migration 254.

**Migration ledger entry** (277 lines 376-378):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('277')
ON CONFLICT (version) DO NOTHING;
```
Adapt version → `'312'`.

---

### `313_acps_school_board.sql` (ACPS school board migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql`

**Key deltas from analog:** Single district only (not 6); geo_id = ACPS UNSD TIGER geo_id (researcher fills in); state `'or'`/`'OR'` → `'va'`/`'VA'`; 9 board members (not 7); external_ids `-{ACPS_geo_id}001` through `-{ACPS_geo_id}009`; government name `'Alexandria City Public Schools, Virginia, US'`; chamber name `'School Board'` / `'Alexandria City Public Schools Board'`; title `'School Board Member'`; **G5420 geofence must be INSERTed directly in this migration** (no VA loader exists for G5420 — D-03); section-split detector must verify new geofence row has corresponding SCHOOL district.

**CRITICAL difference from migration 254:** Migration 254 assumed G5420 rows pre-existed. Migration 313 must INSERT the geofence row first. Use the pre-flight from migration 257 (geofence verification) inverted: instead of checking the row exists, INSERT it.

**G5420 geofence direct INSERT** (new pattern, not in analog — derived from D-03):
```sql
-- Step 0: Insert ACPS G5420 geofence boundary (no VA G5420 rows loaded by TIGER loader)
INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '{ACPS_geo_id}', 'G5420', '51'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.geofence_boundaries
  WHERE geo_id = '{ACPS_geo_id}' AND mtfcc = 'G5420'
);
```
State must be `'51'` (FIPS code for VA, matching the numeric state format used in geofence_boundaries — confirmed by D-05 noting `state='51'` for VA G4110 rows).

**Pre-flight: RAISE EXCEPTION if government already exists** (254 lines 29-42):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name IN (
        'Portland Public Schools, Oregon, US',
        ...
      )) > 0 THEN
    RAISE EXCEPTION 'Migration 254 already applied — aborting re-run';
  END IF;
END $$;
```
Adapt: single name `'Alexandria City Public Schools, Virginia, US'`, exception text → `'Migration 313 already applied — aborting re-run'`.

**Pre-flight: external_id block clear check** (257 lines 61-70):
```sql
DO $$
DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM essentials.politicians
  WHERE external_id BETWEEN -870034 AND -870001;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: external_id block -870001..-870034 is not clear (% rows found)', v_count;
  END IF;
END $$;
```
Adapt range to `-{ACPS_geo_id}009` through `-{ACPS_geo_id}001`.

**Government INSERT** (254 lines 51-58):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Portland Public Schools, Oregon, US',
       'LOCAL', 'OR', NULL, '4110040'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Portland Public Schools, Oregon, US'
);
```
Adapt: name → `'Alexandria City Public Schools, Virginia, US'`, state → `'VA'`, city → `NULL`, geo_id → ACPS UNSD geo_id.

**Chamber INSERT** (254 lines 111-121):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of Education',
       'Portland Public Schools Board of Education',
       (SELECT id FROM essentials.governments WHERE name = 'Portland Public Schools, Oregon, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Education'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Portland Public Schools, Oregon, US')
);
```
Adapt: chamber name → `'School Board'`, name_formal → `'Alexandria City Public Schools Board'`, government subquery → `'Alexandria City Public Schools, Virginia, US'`. NOTE: slug GENERATED ALWAYS, never in column list.

**SCHOOL district INSERT** (254 lines 191-196):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4110040', 'Portland Public Schools', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4110040' AND district_type = 'SCHOOL' AND state = 'or'
);
```
Adapt: state → `'va'`, geo_id → ACPS geo_id, label → `'Alexandria City Public Schools'`, mtfcc → `'G5420'`.

**Politician + office CTE block — Board Member (SCHOOL)** (254 lines 252-281):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Edward Wang', 'Edward', 'Wang', NULL,
          true, false, false, true, -860001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of Education'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Portland Public Schools, Oregon, US')),
       p.id,
       'Board Member (Zone 7)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4110040'
  AND d.district_type = 'SCHOOL'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Repeat 9 times for Rief, Harris, Abdalla, Beaty, Carmichael Booz, Kenley, Reyna, Scioscia, Simpson Baird. Change: chamber name → `'School Board'`, government name → `'Alexandria City Public Schools, Virginia, US'`, title → `'School Board Member'`, representing_state → `'VA'`, geo_id → ACPS geo_id, state → `'va'`, external_ids → `-{ACPS_geo_id}001` through `-{ACPS_geo_id}009`.

**office_id back-fill** (254 lines 1507-1512):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -860055 AND -860001
  AND p.office_id IS NULL;
```
Adapt range: `BETWEEN -{ACPS_geo_id}009 AND -{ACPS_geo_id}001`.

**Post-verification DO block** (254 lines 1525-1622 — use full 7-gate pattern):
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
  -- Gate (a): 1 government row
  -- Gate (b): 1 School Board chamber
  -- Gate (c): 1 SCHOOL district row, state='va', geo_id=ACPS_geo_id
  -- Gate (d): 9 politicians in external_id range
  -- Gate (e): 9 offices linked to SCHOOL district
  -- Gate (f): section-split = 0 (G5420 geofence has SCHOOL district row)
  --   NOTE: section-split check must look for ACPS geo_id with mtfcc='G5420' and state='va'
  -- Gate (g): 0 NULL office_ids in range
END $$;
```
Counts: v_gov_count <> 1, v_chamber_count <> 1, v_dist_count <> 1, v_pol_count <> 9, v_off_count <> 9, v_split_count <> 0, v_null_count <> 0. Section-split query filters on `state = 'va'` (not `'or'`).

**Migration ledger entry** (254 lines 1627-1629):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('254')
ON CONFLICT (version) DO NOTHING;
```
Adapt version → `'313'`.

---

### `314_alexandria_headshots.sql` (headshots migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/271_md_executive_headshots.sql`

**Secondary analog:** `C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql` (for the `{politician_id}::text || '-headshot.jpg'` URL construction variant used when UUID is not known at write-time)

**Key convention confirmed across both analogs:** bucket = `politician_photos`, path pattern = `{politician_id}-headshot.jpg`, type = `'default'`, column = `url` (NOT `storage_url`).

**politician_images INSERT with pre-known UUID** (271 lines 36-44):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -240001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/21e534c8-c0c0-42f5-b52b-5eb2f246d632-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -240001)
);
```
Use this pattern (with literal UUID in path) when the politician UUID is known at write-time (i.e., after migration 312/313 applied and UUIDs queried). External_id lookup identifies the politician row.

**politician_images INSERT with dynamic UUID** (255 lines 38-47):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -860001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/' ||
         (SELECT id FROM essentials.politicians WHERE external_id = -860001)::text || '-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -860001)
);
```
Use the dynamic `||` concatenation variant if UUIDs are not known at plan-write time. The planner should note the researcher must provide actual politician UUIDs from DB after Plans 01 and 02 are applied.

**AUDIT-ONLY guard** (255 lines 28-31):
```sql
DO $$
BEGIN
  RAISE EXCEPTION 'Migration 255 is AUDIT-ONLY and must not be applied. Actual DB writes happened live via scripts/_tmp-or-school-headshots.py.';
END $$;
```
Migration 314 should NOT include this guard — Alexandria headshots will be applied normally via Supabase MCP, matching migration 271's approach (no AUDIT-ONLY guard, normal BEGIN/COMMIT transaction).

**No transaction wrapper needed** — headshot migrations are single-statement INSERTs that do not need BEGIN/COMMIT (confirmed: migration 271 has no BEGIN/COMMIT). Each INSERT is its own autocommit statement.

---

## Shared Patterns

### State Case Convention
**Apply to:** All three migration files (312, 313, 314)
- `districts.state = 'va'` (lowercase) — routing query convention (D-10)
- `governments.state = 'VA'` (uppercase) — governments table convention (D-11)
- `offices.representing_state = 'VA'` (uppercase) — offices table convention (D-12)
- `geofence_boundaries.state = '51'` (FIPS numeric string) — geofence table convention

### WHERE NOT EXISTS Idempotency Guard
**Apply to:** Every INSERT in all three migrations
**Source:** `277_leonardtown_government.sql` lines 52-55, 85-86, 92-97
- governments: guard on `name`
- chambers: guard on `(name, government_id)`
- districts: guard on `(geo_id, district_type, state)`
- offices (inside CTE): guard on `(district_id, politician_id)`
- politician_images: guard on `politician_id`

### ON CONFLICT DO NOTHING on Politicians
**Apply to:** Every politician INSERT in 312 and 313
**Source:** `277_leonardtown_government.sql` line 117
```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
```

### Anti-Partisan + Elected Flags
**Apply to:** All politician and office INSERTs in 312 and 313
**Source:** `277_leonardtown_government.sql` lines 113-118
```sql
party=NULL,           -- antipartisan design (D-16)
is_appointed=false,   -- all voter-elected (D-17)
is_appointed_position=false  -- offices table (D-17)
```

### Migration Ledger Entry
**Apply to:** All three migrations
**Source:** `277_leonardtown_government.sql` lines 376-378
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('{version}')
ON CONFLICT (version) DO NOTHING;
```
Versions: `'312'`, `'313'`, `'314'`.

### slug GENERATED ALWAYS Warning
**Apply to:** Chamber INSERTs in 312 and 313
- Never include `slug` in the INSERT column list for `essentials.chambers`
- Confirmed in both analog migrations (277 line 19, 254 line 12)

### tiger_geoid Column
**Apply to:** District INSERTs in 312 and 313 (D-08)
- Do NOT include `tiger_geoid` in INSERT column list — the column is nullable and defaults to NULL
- VAGE-03 backfill covers only SLDL/SLDU; Alexandria LOCAL/SCHOOL districts will remain NULL

---

## No Analog Found

All three files have close analogs. No files are without pattern coverage.

| File | Partial Gap | Resolution |
|------|-------------|------------|
| `313_acps_school_board.sql` | G5420 direct INSERT (no analog inserts geofence in same migration) | Pattern derived from D-03 decision: standard `INSERT INTO geofence_boundaries (geo_id, mtfcc, state)` with WHERE NOT EXISTS guard; state='51' matches VA FIPS |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`
**Files scanned:** 277, 254, 257, 271, 255 (5 analog files read in full or significant part)
**Pattern extraction date:** 2026-06-08
