# Phase 165: Boulder City Deep-Seed - Pattern Map

**Mapped:** 2026-06-29
**Files analyzed:** 8 (1 structural migration, 1 headshot migration, 5 stance migrations, 1 headshot script, 1 JS edit)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1100_boulder_city_city_council.sql` | migration | CRUD | `1093_north_las_vegas_city_council.sql` + `1055_clark_county_commission.sql` | exact (hybrid) |
| `C:/EV-Accounts/backend/migrations/1101_boulder_city_council_headshots.sql` | migration | CRUD | `1094_north_las_vegas_city_council_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1102_boulder_city_hardy_stances.sql` | migration | CRUD | `1095_north_las_vegas_goynesbrown_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1103_boulder_city_jorgensen_stances.sql` | migration | CRUD | `1095_north_las_vegas_goynesbrown_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1104_boulder_city_booth_stances.sql` | migration | CRUD | `1095_north_las_vegas_goynesbrown_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1105_boulder_city_walton_stances.sql` | migration | CRUD | `1095_north_las_vegas_goynesbrown_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1106_boulder_city_ashurst_stances.sql` | migration | CRUD | `1095_north_las_vegas_goynesbrown_stances.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-boulder-city-council-headshots.py` | utility | file-I/O | `_tmp-north-las-vegas-council-headshots.py` | exact |
| `C:/Transparent Motivations/essentials/src/lib/coverage.js` | config | — | self (existing NV block, lines 183–190) | exact (append) |

---

## Pattern Assignments

### `1100_boulder_city_city_council.sql` (structural migration, registered)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1093_north_las_vegas_city_council.sql`
**Single-district analog:** `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql`

**THE key divergence from 1093 (NLV):** Drop the pre-flight X0017 ward-count assertion entirely. Replace the 4 LOCAL ward-district INSERTs (each on a distinct `geo_id='north-las-vegas-nv-council-ward-N'`) with ONE shared LOCAL district on `geo_id='3206500'`. Replace the 4 ward-specific council CTEs (each filtering `d.geo_id='north-las-vegas-nv-council-ward-N'`) with 4 at-large council CTEs all filtering `d.geo_id='3206500' AND d.district_type='LOCAL'`. Title becomes `'Council Member'` (no ward suffix). The post-verify DO block replaces the X0017 ward-count check with a LOCAL-by-G4110 check (4 offices on the shared LOCAL district vs 4 ward offices on X0017).

**Pre-flight pattern** (from `1093` lines 29–40, adapted — remove ward assertion, keep gov-exists notice):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Boulder City, Nevada, US') > 0 THEN
    RAISE NOTICE 'City of Boulder City government row already exists — idempotent re-run';
  END IF;
  -- NO ward assertion here (Boulder City has no wards — at-large city)
END $$;
```

**Step 1: Government** (from `1093` lines 46–53, identity-swap):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Boulder City, Nevada, US',
       'City', 'NV', NULL, '3206500'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Boulder City, Nevada, US'
);
```

**Step 2: Chamber** (from `1093` lines 59–70, identity-swap; note: auto-generated path column NEVER in INSERT list):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'Boulder City City Council',
       'Boulder City City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Boulder City, Nevada, US'),
       5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Boulder City City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Boulder City, Nevada, US')
);
```

**Step 3a: LOCAL_EXEC district (Mayor)** (from `1093` lines 76–81, geo_id swap):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3206500', 'City of Boulder City', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3206500' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);
```

**Step 3b: ONE shared LOCAL district for 4 at-large council members** (replaces the 4 X0017 ward districts in `1093` lines 87–113; analog to `1055` line 86 single-COUNTY-district shape):
```sql
-- ONE shared LOCAL district on geo_id='3206500' — not one per member.
-- All 4 at-large council offices attach to this single row.
-- Analog: 1055 (Clark County) uses 1 COUNTY district for all 7 commissioners.
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', '3206500', 'City of Boulder City', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3206500' AND district_type = 'LOCAL' AND state = 'nv'
);
```

**Step 4, Block 1: Mayor Hardy** (from `1093` lines 123–152, identity-swap + geo_id `'3251800'` → `'3206500'`, external_id -3207001 → -3208001):
```sql
-- BLOCK 1: Joe Hardy (-3208001) — Mayor, directly elected (LOCAL_EXEC), is_active=true, is_incumbent=true
-- Term expires 2026 but remains seated — same pattern as NLV incumbent status
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joe Hardy', 'Joe', 'Hardy', 'Non-Partisan',
          true, false, false, true, -3208001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Boulder City City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Boulder City, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3206500'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'            -- MUST be lowercase; uppercase matches 0 rows
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Step 4, Blocks 2–5: At-large council members** (from `1093` lines 155–283, but ALL four filter `d.geo_id = '3206500' AND d.district_type = 'LOCAL'` — NOT separate ward geo_ids; title = `'Council Member'` not `'Council Member, Ward N'`):
```sql
-- BLOCK 2: Sherri Jorgensen (-3208002) — Council Member (Mayor Pro Tem is internal designation only,
-- NOT a separate seat; title='Council Member', NOT 'Mayor Pro Tem')
-- All 4 at-large council blocks use identical district WHERE clause:
--   d.geo_id = '3206500' AND d.district_type = 'LOCAL' AND d.state = 'nv'
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Sherri Jorgensen', 'Sherri', 'Jorgensen', 'Non-Partisan',
          true, false, false, true, -3208002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Boulder City City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Boulder City, Nevada, US')),
       p.id,
       'Council Member', 'NV', false, false, NULL   -- at-large: no ward suffix
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3206500'
  AND d.district_type = 'LOCAL'   -- CRITICAL: LOCAL not LOCAL_EXEC for council members
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat pattern for Booth (-3208003), Walton (-3208004), Ashurst (-3208005)
-- all with title='Council Member', same district WHERE clause
```

**Step 5: office_id back-fill** (from `1093` lines 286–291, range swap):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3208005 AND -3208001
  AND p.office_id IS NULL;
```

**Step 6: Post-verification DO block** (from `1093` lines 294–336; adapt — replace X0017 ward check with LOCAL-on-G4110 check; from `1055` lines 347–393 for the section-split pattern):
```sql
DO $$
DECLARE
  v_gov_count  INTEGER;
  v_exec_count INTEGER;
  v_local_count INTEGER;
  v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Boulder City, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Boulder City government row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_exec_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3206500' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'nv';
  IF v_exec_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 LOCAL_EXEC Mayor office, found %', v_exec_count;
  END IF;

  -- Boulder City: 4 at-large council offices on the ONE shared LOCAL district (not 4 ward districts)
  SELECT COUNT(*) INTO v_local_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3206500' AND d.district_type = 'LOCAL' AND d.state = 'nv';
  IF v_local_count <> 4 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 4 LOCAL at-large council offices, found %', v_local_count;
  END IF;

  -- Section-split: every G4110 geo_id='3206500' geofence must have a matching LOCAL district
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '3206500'
    AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'LOCAL' AND d.state = 'nv'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, exec=%, local=%, split_orphans=%',
    v_gov_count, v_exec_count, v_local_count, v_split_count;
END $$;

COMMIT;
```

**Step 7: Migration ledger** (from `1093` lines 341–343; OUTSIDE the transaction; only structural migration 1100 registers — 1101–1106 do NOT):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1100', 'boulder_city_city_council')
ON CONFLICT (version) DO NOTHING;
```

---

### `1101_boulder_city_council_headshots.sql` (audit-only headshot migration)

**Analog:** `C:/EV-Accounts/backend/migrations/1094_north_las_vegas_city_council_headshots.sql`

**Pattern** (from `1094` lines 24–32 — one INSERT block per member; copy shape verbatim, swap external_ids and UUIDs after the headshot script emits its manifest):
```sql
-- AUDIT-ONLY: NOT registered in the migration ledger.
-- Columns exactly: (id, politician_id, url, type, photo_license) — no image-origin column.
-- type='default' on all rows. politician_id resolved by stable external_id.
-- CDN URL pattern: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg
-- photo_license='us_government_work' for all 5 (flybouldercity.com is official city portal, confirmed NO WAF)

BEGIN;

-- -3208001 Joe Hardy (Mayor)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3208001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{hardy-uuid}-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3208001)
);
-- Repeat for -3208002 Jorgensen, -3208003 Booth, -3208004 Walton, -3208005 Ashurst
-- UUIDs filled in at execution from the headshot script manifest

COMMIT;
-- AUDIT-ONLY: no schema_migrations INSERT (structural ledger stays at 1100).
```

Key differences from NLV 1094: `photo_license='us_government_work'` for all 5 (vs mixed `public_domain`/`press_use` in NLV). No `photo_origin_url` column (removed from schema — confirmed absent in 1094 too).

---

### `1102..1106_boulder_city_*_stances.sql` (audit-only stance migrations, one per official)

**Analog:** `C:/EV-Accounts/backend/migrations/1095_north_las_vegas_goynesbrown_stances.sql`

**Pattern** (from `1095` lines 1–36 — copy CTE shape verbatim; fill Boulder-City-specific topic_key/val/reasoning/sources at execution-time research):
```sql
-- AUDIT-ONLY: NOT registered in the migration ledger (structural ledger stays at 1100).
-- CHAIRS model: value is the discrete position the evidence matches (1-5), not a polarity.
-- 100% cited; every stance has reasoning + source URL(s); honest blanks for no-evidence topics.
-- topic_id resolved LIVE by topic_key (is_live=true) — no hardcoded topic UUIDs.
-- politician_id = {uuid} (external_id -3208001, minted by mig 1100).

BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('growth-and-development'::text, {val}, '{reasoning from Boulder City Review CGO coverage}',
     ARRAY['{source URL}']::text[]),
    ('data-centers'::text, {val}, '{reasoning from Feb 2026 unanimous ballot vote}',
     ARRAY['{reviewjournal.com URL}']::text[])
    -- ... additional evidenced topics; absent = honest blank (no row)
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct
    ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '{politician-uuid}'::uuid, topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
  SELECT '{politician-uuid}'::uuid, topic_id, reasoning, sources FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE
    SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
-- AUDIT-ONLY: no schema_migrations INSERT.
```

Boulder City topic emphasis (D-07): `growth-and-development` (CGO 120-unit/year cap), `data-centers` (Feb 2026 unanimous ballot vote), `economic-development` (solar lease revenue — Dec 2024 lease denial, 2024 rewrite approval), `homelessness-response` (May 2025 5-0 camping ban), `taxes` (lowest property tax in NV = solar-funded budget). All other live topics swept; honest blanks where no cited council-level Boulder City evidence exists.

Expected stance counts per member: Hardy 6–10, Jorgensen 4–7, Booth 3–5, Walton 3–5, Ashurst 2–4.

---

### `_tmp-boulder-city-council-headshots.py` (gitignored utility script)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-north-las-vegas-council-headshots.py`

**Changes from NLV analog (copy verbatim, change only these sections):**

1. Header docstring — update city name, Phase 164 → 165, CLARK-04 → CLARK-05, remove WAF note (flybouldercity.com has NO WAF), remove Wikimedia UA caveat (no Wikimedia sources for Boulder City).

2. `OFFICIALS` list (from `_tmp-north-las-vegas-council-headshots.py` lines 65–81 — replace entirely):
```python
# flybouldercity.com ImageRepository: all 5 confirmed HTTP 200, image/jpeg, no WAF.
# Standard Chrome UA is sufficient — no Akamai, no descriptive Wikimedia UA needed.
# documentId param is lowercase on flybouldercity.com (vs uppercase documentID on bcnv.org).
OFFICIALS = [
    {'ext_id': -3208001, 'name': 'Joe Hardy',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=10964',
     'license': 'us_government_work'},
    {'ext_id': -3208002, 'name': 'Sherri Jorgensen',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=9459',
     'license': 'us_government_work'},
    {'ext_id': -3208003, 'name': 'Cokie Booth',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=10924',
     'license': 'us_government_work'},
    {'ext_id': -3208004, 'name': 'Steve Walton',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=10899',
     'license': 'us_government_work'},
    {'ext_id': -3208005, 'name': 'Denise E. Ashurst',
     'url': 'https://www.flybouldercity.com/ImageRepository/Document?documentId=14763',
     'license': 'us_government_work'},
]
```

3. Guard assertions (from `_tmp-north-las-vegas-council-headshots.py` lines 84–86 — update range):
```python
assert len(OFFICIALS) == 5, f'Expected 5 council members, got {len(OFFICIALS)}'
assert len({m['ext_id'] for m in OFFICIALS}) == 5, 'external_ids must be unique'
assert all(-3208005 <= m['ext_id'] <= -3208001 for m in OFFICIALS), 'ext_id out of range'
```

4. `main()` print block — update city name strings and Phase references. The manifest output pattern (`SUCCESS:` / `FAILED:` lines) remains identical.

**Everything else is unchanged:** `_env_path` config loader, `SUPABASE_URL`/`SERVICE_KEY`/`DATABASE_URL` extraction, `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `BROWSER_HEADERS` Chrome UA, `resolve_politician_id()`, `download_image()`, `crop_to_4_5()`, `resize_600x750()`, `upload_to_storage()`, `process_headshot_bytes()` (RGBA→white composite included even though all 5 Boulder City sources are RGB — harmless guard), `process_member()`, `main()` loop + manifest logic.

Note: `WIKIMEDIA_HEADERS` dict can be retained in the file (harmless) or removed since no Wikimedia sources are used. The `download_image()` function's `'wikimedia.org' in url` branch will simply never fire.

---

### `src/lib/coverage.js` (edit — append to existing NV block)

**Analog:** Self — existing NV block at lines 183–190 (read at offset 180 above).

**Current state** (lines 183–190):
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

**After edit** — append one line after North Las Vegas (line 188), before the closing `],`):
```javascript
    { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
```

Result:
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

---

## Shared Patterns

### Casing convention (ALL NV migrations)
**Source:** `1093_north_las_vegas_city_council.sql` lines 17–22 comment block; `1055_clark_county_commission.sql` lines 27–30 comment block.
**Apply to:** All `.sql` files in this phase.
```
districts.state            = 'nv'   (lowercase — routing join key; 'NV' silently matches 0 rows)
governments.state          = 'NV'   (uppercase — governments table convention)
offices.representing_state = 'NV'   (uppercase — free-text label)
geofence_boundaries.state  = '32'   (FIPS string — set by the TIGER G4110 loader)
```

### WHERE NOT EXISTS guard pattern (government/chamber/district)
**Source:** `1055_clark_county_commission.sql` lines 52–59 (government), `1093_north_las_vegas_city_council.sql` lines 76–81 (district).
**Apply to:** Every INSERT in 1100. `essentials.governments` has no unique constraint; neither do `essentials.districts`.
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), ..., ...
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = '{exact name string}'
);
```

### politician_images column shape
**Source:** `1094_north_las_vegas_city_council_headshots.sql` lines 24–32 (confirmed schema).
**Apply to:** Migration 1101.
```sql
-- Exactly 5 columns: (id, politician_id, url, type, photo_license)
-- NO photo_origin_url column (removed from schema)
-- type='default' on all rows
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license) ...
```

### AUDIT-ONLY marker (no ledger registration)
**Source:** `1094_north_las_vegas_city_council_headshots.sql` line 79; `1095_north_las_vegas_goynesbrown_stances.sql` line 1 comment.
**Apply to:** Migrations 1101–1106.
```sql
COMMIT;
-- AUDIT-ONLY: no schema_migrations INSERT (structural ledger stays at 1100).
```

### Stance CTE skeleton (topic-key lookup)
**Source:** `1095_north_las_vegas_goynesbrown_stances.sql` lines 12–36.
**Apply to:** Migrations 1102–1106.
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true` — never hardcode UUIDs.
- `ON CONFLICT (politician_id, topic_id) DO UPDATE` on both `politician_answers` and `politician_context` tables.
- Absent topics = honest blank (no row). Zero default values.

---

## No Analog Found

None. All 8 files have exact analogs.

---

## Migration File Checklist (grep-gate forbidden tokens)

Per `project_phase159_complete` memory and `1093` comment convention — the following string literals must NOT appear in `.sql` file comments (they trigger verify-gate false positives):
- `slug`
- `photo_origin_url`
- `schema_migrations` (except in the actual ledger INSERT statement in migration 1100)

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1055, 1093, 1094, 1095), `C:/EV-Accounts/backend/scripts/` (_tmp-north-las-vegas-council-headshots.py), `C:/Transparent Motivations/essentials/src/lib/coverage.js`
**Files read:** 6 analog files + 2 context files
**Pattern extraction date:** 2026-06-29
