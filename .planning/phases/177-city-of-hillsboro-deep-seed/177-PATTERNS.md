# Phase 177: City of Hillsboro Deep-Seed - Pattern Map

**Mapped:** 2026-07-01
**Files analyzed:** 10 (1 structural migration, 1 headshot migration, 7 stance migrations, 1 headshot script, 1 coverage.js edit, 1 buildingImages.js edit)
**Analogs found:** 10 / 10

**geo_id note:** Use the RESEARCH-corrected geo_id **4134100** throughout (NOT `4133850` from CONTEXT.md — verified nonexistent in `geofence_boundaries`). Ext_id block **-4134101..-4134107** (7 slots: Mayor + 6 councilors). Next migration number: confirm on-disk MAX at Wave-0 (research snapshot: 1149 → next 1150; treat as provisional).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/<N>_hillsboro_city_council.sql` | migration | CRUD | `migrations/1131_beaverton_city_council.sql` (entire file, 386 lines) | exact |
| `C:/EV-Accounts/backend/migrations/<N+1>_hillsboro_headshots.sql` | migration | CRUD | `migrations/1132_beaverton_headshots.sql` (entire file, 91 lines) | exact |
| `C:/EV-Accounts/backend/migrations/<N+2>_pace_stances.sql` (Mayor) | migration | CRUD | `migrations/1133_beaty_stances.sql` (entire file, 48 lines) | exact |
| `C:/EV-Accounts/backend/migrations/<N+3..8>_<councilor>_stances.sql` (6 files) | migration | CRUD | `migrations/1133_beaty_stances.sql` | role-match |
| `C:/EV-Accounts/backend/scripts/_tmp-hillsboro-headshots.py` | utility | file-I/O | `scripts/_tmp-beaverton-headshots.py` (entire file, 400 lines) | exact |
| `src/lib/coverage.js` (edit — Oregon block) | config | transform | `src/lib/coverage.js` lines 96–106 (current Oregon block, Beaverton entry) | exact |
| `src/lib/buildingImages.js` (edit — CURATED_LOCAL) | config | transform | `src/lib/buildingImages.js` lines 104–113 (beaverton CURATED_LOCAL entry) | exact |
| `docs/banner-asset-pipeline.md`-driven banner scripts (no new file — invoke existing) | utility | file-I/O | `scripts/banners/process_banner.py` + `upload_banner.py` (already committed, no edit needed) | exact |

**No `representing_city` backfill migration needed** — Hillsboro sets it INLINE in the structural migration (contrast with Beaverton's separate mig 1141), since D-09 explicitly avoids the backfill this time. The 1141 file below is included as a *negative pattern* to confirm you do NOT need a Hillsboro equivalent — just add `representing_city='Hillsboro'` directly into each `offices` INSERT in the structural migration.

---

## Pattern Assignments

### `<N>_hillsboro_city_council.sql` (structural migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1131_beaverton_city_council.sql` (entire file — this is a near-1:1 template; Hillsboro is structurally identical: council-manager, directly-elected Mayor, at-large councilors)

**Pre-flight hard-abort guard** (mig 1131 lines 25–31):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Hillsboro, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration <N> already applied — aborting re-run';
  END IF;
END $$;
```

**Government row** (mig 1131 lines 40–47, adapt geo_id to 4134100):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Hillsboro, Oregon, US',
       'LOCAL', 'OR', 'Hillsboro', '4134100'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Hillsboro, Oregon, US'
);
```

**Chamber row** (mig 1131 lines 50–61 — slug is GENERATED ALWAYS, never insert it):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Hillsboro City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Hillsboro, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Hillsboro, Oregon, US')
);
```

**LOCAL_EXEC district — Mayor citywide** (mig 1131 lines 63–69):
```sql
-- state='or' LOWERCASE — critical for routing
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4134100', 'Hillsboro (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4134100' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

**LOCAL at-large district — all 6 councilors share ONE row** (mig 1131 lines 71–77 — DO NOT create per-ward districts; RESEARCH confirms at-large tie-breaker):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4134100', 'Hillsboro (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4134100' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Mayor office block** (mig 1131 lines 79–109, directly elected — adapt name/ext_id; set `representing_city` INLINE per D-09):
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Beach Pace', 'Beach', 'Pace', NULL,
          true, false, false, true, -4134101)
  ON CONFLICT (external_id) DO UPDATE
    SET is_active = EXCLUDED.is_active
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   representing_city, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Hillsboro, Oregon, US')),
       p.id,
       'Mayor', 'OR', 'Hillsboro', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4134100'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Councilor office block — repeat 6 times** (mig 1131 lines 111–303, Position 1–6 pattern; adapt title to Hillsboro's `'Councilor, Ward N, Position X'` convention per RESEARCH, and set `representing_city` inline same as Mayor block above). Example for Salgado:
```sql
-- Councilor Ward 1 Position A: Cristian Salgado (-4134102)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Cristian Salgado', 'Cristian', 'Salgado', NULL,
          true, false, false, true, -4134102)
  ON CONFLICT (external_id) DO UPDATE
    SET is_active = EXCLUDED.is_active
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   representing_city, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Hillsboro, Oregon, US')),
       p.id,
       'Councilor, Ward 1, Position A', 'OR', 'Hillsboro', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4134100'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Rob Harris (Ward 3, Position B) note** — holds "Council President" title. Per D-07 and the Kimmi precedent (mig 1131 lines 175–207), this is a comment-only note — ONE office row, title stays `'Councilor, Ward 3, Position B'` (or planner's confirmed wording), no separate office/district row.

**office_id back-fill** (mig 1131 lines 306–316 — explicit IN list, idempotent):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4134101,-4134102,-4134103,-4134104,-4134105,-4134106,-4134107
  )
  AND p.office_id IS NULL;
```

**Post-verification DO block** (mig 1131 lines 320–375 — adapt gates 4/5th if desired for `representing_city` inline check since Hillsboro has no separate backfill migration):
```sql
DO $$
DECLARE
  v_gov_count      INTEGER;
  v_office_count   INTEGER;
  v_split_count    INTEGER;
  v_null_count     INTEGER;
  v_repcity_count  INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Hillsboro, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Hillsboro gov_count=%, expected 1', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4134100' AND d.district_type IN ('LOCAL','LOCAL_EXEC') AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Hillsboro office_count=%, expected 7', v_office_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '4134100'
    AND gb.mtfcc = 'G4110'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id
        AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
        AND d.state = 'or'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id IN (-4134101,-4134102,-4134103,-4134104,-4134105,-4134106,-4134107)
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id after back-fill', v_null_count;
  END IF;

  -- Gate (e), Hillsboro-specific: representing_city set inline (no backfill mig needed, per D-09)
  SELECT COUNT(*) INTO v_repcity_count
  FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id BETWEEN -4134107 AND -4134101
    AND o.representing_city = 'Hillsboro';
  IF v_repcity_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % of 7 Hillsboro offices have representing_city=Hillsboro', v_repcity_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: Hillsboro gov=1, offices=7, section-split=0, office_id nulls=0, representing_city=7';
END $$;
```

**Ledger entry** (mig 1131 lines 380–385):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('<N>')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `<N+1>_hillsboro_headshots.sql` (audit-only headshot migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1132_beaverton_headshots.sql` (entire file, 91 lines)

**File header pattern** (mig 1132 lines 1–10):
```sql
-- Migration <N+1>: City of Hillsboro City Council Headshots — AUDIT-ONLY (not registered in the ledger)
--
-- Records the essentials.politician_images rows for the 7 Hillsboro officials whose 600x750
-- portraits were uploaded to Supabase Storage (politician_photos/{uuid}-headshot.jpg) by
-- _tmp-hillsboro-headshots.py. One INSERT per official, guarded by WHERE NOT EXISTS on
-- politician_id (idempotent). type='default'. photo_license per actual source
-- (CivicWeb portal images = press_use / us_government_work pattern).
--
-- AUDIT-ONLY: this migration intentionally does NOT write a ledger row.

BEGIN;
```

**Per-official INSERT pattern** (mig 1132 lines 13–22 — repeat 7 times, one per official):
```sql
-- Beach Pace (Mayor, -4134101) — CivicWeb portal / Ballotpedia fallback
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4134101),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4134101)
);
```
**Critical:** columns are exactly `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url` (confirmed absent from schema). `COMMIT;` at end, no ledger INSERT (audit-only class).

---

### `<N+2>_pace_stances.sql` through `<N+8>_harris_stances.sql` (7 stance migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1133_beaty_stances.sql` (entire file, 48 lines)

**File header pattern** (mig 1133 lines 1–3):
```sql
-- Migration <N+2>: Beach Pace (Mayor) compass stances — AUDIT-ONLY (not registered in the ledger)
-- Evidence-only; 100% cited; chairs model (value 1-5); N cited stances; blank spokes omitted.
-- topic_id resolved LIVE via JOIN on compass_topics.topic_key AND is_live=true (no hardcoded topic UUIDs).
```

**Core stance CTE pattern — two-statement structure, `politician_answers` then `politician_context`** (mig 1133 lines 5–47, entire operative body):
```sql
BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('housing', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[]),
    ('homelessness', 2, 'Evidence text...', ARRAY['https://source.url']::text[])
    -- ... one row per topic WITH evidence; omit topics entirely if no evidence found
)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
SELECT '{politician_uuid}'::uuid, ct.id, s.val
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    -- IDENTICAL VALUES block repeated verbatim (both statements read from the same literal set)
    ('housing', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[])
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '{politician_uuid}'::uuid, ct.id, s.reasoning, s.sources
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
```

**Critical rules from analog:**
- `politician_id` UUID is the one minted by the structural migration — look it up by `external_id` after applying `<N>`, then hardcode it in each stance file.
- `val` is integer 1–5 (chairs model, NOT polarity) — blank spoke = omit the topic row entirely, never default.
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true` — never hardcode a topic UUID.
- Skip all 8 `judicial-*` topics (City Attorney is appointed, per RESEARCH).
- One migration file per official — 7 files total (Mayor Pace, Salgado, Anvery, Sinclair, Case, Alcaire, Harris).
- One agent at a time for stance research (memory: feedback_stance_research_one_at_a_time).

---

### `C:/EV-Accounts/backend/scripts/_tmp-hillsboro-headshots.py` (utility, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-beaverton-headshots.py` (entire file, 400 lines)

**Module docstring pattern** (analog lines 1–38, adapt city/count):
```python
"""
_tmp-hillsboro-headshots.py
Download, crop, resize, and upload headshots for the 7 City of Hillsboro
City Council members (Mayor + 6 Councilors) to Supabase Storage bucket
'politician_photos'.

Phase 177 — WASH-03 (headshot portion).

ORCHESTRATION NOTE:
  Running this script is the INLINE-ORCHESTRATOR step, NOT the executor's.
  The executor only WRITES this file to disk. The orchestrator runs it,
  then applies audit headshot migration <N+1> after the pipeline emits its
  manifest. This is a gitignored _tmp-* helper — do NOT commit it.

Processing pipeline (per feedback_headshot_resize_no_distort.md, crop-first):
  1. Resolve politician UUID at RUNTIME by external_id (psycopg2).
  2. Download the portrait from the per-member source URL
     (hillsboro-oregon.civicweb.net CivicWeb portal — hillsboro-oregon.gov is WAF-403).
  3. Composite onto white if transparent (PNG/RGBA).
  4. CROP to 4:5 ratio FIRST — never stretch.
  5. RESIZE to 600x750 Lanczos q90.
  6. Upload to politician_photos/{uuid}-headshot.jpg via PUT x-upsert: true.
  7. Reject any image with superimposed text/graphics over the face.
"""
```

**OFFICIALS roster pattern** (analog lines 56–100 — adapt to 7 Hillsboro officials with CivicWeb image paths from RESEARCH):
```python
OFFICIALS = [
    {
        'ext_id': -4134101,
        'name': 'Beach Pace',
        'url': 'https://hillsboro-oregon.civicweb.net/FileStorage/content/UserImages/user-29.jpg',
        'license': 'press_use',
        # Mayor; verify non-zero byte download before trusting — RESEARCH flagged one 0-byte
        # curl test on this CDN. Fallback: ballotpedia.org / campaign site if unretrievable.
    },
    # ... 6 more entries through -4134107 Rob Harris (user-1234.jpg)
]

assert len(OFFICIALS) == 7, f'Expected 7 officials, got {len(OFFICIALS)}'
assert len({m["ext_id"] for m in OFFICIALS}) == 7, 'external_ids must be unique'
```

**Config block, crop/resize functions, transparent-composite guard, manifest output** — copy verbatim from `_tmp-beaverton-headshots.py`, renaming only city-specific strings (`BUCKET`, `CDN_BASE`, `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `RESAMPLE=Image.Resampling.LANCZOS` all identical). **Test-download one image first** before building the full manifest — RESEARCH explicitly flags an inconclusive 0-byte CivicWeb curl test as an open risk.

---

### `src/lib/coverage.js` (config edit — add Hillsboro to Oregon block)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\coverage.js` lines 95–106 (current Oregon block, live file state)

**Current Oregon block** (verified live, lines 95–106):
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
  },
```

**Required edit — insert Hillsboro alphabetically between Gresham and Maywood Park:**
```js
  {
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',   browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',    browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Gresham',     browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',   browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park',browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',    browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',   browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Wood Village',browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
```
**Use geo_id `4134100`** (NOT `4133850` from CONTEXT.md). `hasContext: true` is correct once ≥1 stance row exists for a Hillsboro official. Browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110`.

---

### `src/lib/buildingImages.js` (config edit — add Hillsboro to CURATED_LOCAL)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\buildingImages.js` lines 104–113 (current CURATED_LOCAL block including the just-added `beaverton` entry — the freshest same-milestone template, more relevant than the older `bloomington` entry)

**Current state** (verified live, lines 104–113):
```js
// LA-county skylines (la_county/building_photos/<geoid>.jpg). Attribution
\ (Wikimedia Commons) - title | author | license:
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  'los angeles': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/la_county/building_photos/0644000-skyline.jpg',
  ...
```

**Required edit — add attribution comment + `hillsboro` key** (once the executor picks the final licensed image per D-08):
```js
// LA-county skylines (la_county/building_photos/<geoid>.jpg). Attribution
\ (Wikimedia Commons) - title | author | license:
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - <Title of chosen photo> | <Author> | <License, e.g. CC BY-SA 4.0>
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  ...
```
The key `hillsboro` (lowercase) matches how `getBuildingImages()` does substring-matching against `offices.representing_city` (lowercased) — see match loop at lines 196–201: `if (city.includes(key)) { localImage = src; break; }`. This is why `representing_city='Hillsboro'` MUST be set inline on the structural migration (D-09) — without it, the banner falls back to the tier gradient (this exact bug is what Beaverton's mig 1141 had to backfill after-the-fact; Hillsboro avoids it by doing it inline).

**Banner pipeline invocation (no new file — use existing committed scripts):**
```bash
python scripts/banners/process_banner.py \
  --input <raw_source_photo> \
  --output <processed_1700x540.jpg> \
  # crops/resizes to 1700x540 @ 3.15:1 per docs/banner-asset-pipeline.md

python scripts/banners/upload_banner.py \
  --file <processed_1700x540.jpg> \
  --path cities/hillsboro.jpg
  # uploads to Supabase Storage politician_photos/cities/hillsboro.jpg, prints CDN URL
```
Follow `docs/banner-asset-pipeline.md` Stages 1–8 exactly (Wikimedia Commons first, Unsplash fallback; NO AI-generated images; no baked-in text/graphics).

---

## Shared Patterns

### OR State/Casing Rules (apply to structural migration)
**Source:** `migrations/1131_beaverton_city_council.sql` lines 6–19 (comment block), confirmed live by RESEARCH.

| Context | Casing | Why |
|---|---|---|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder/routing query |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `politicians.party` | `NULL` | Antipartisan — never set |

### Idempotency Guards (apply to structural migration)
**Source:** `migrations/1131_beaverton_city_council.sql` throughout.
- `governments`: `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no unique constraint on geo_id.
- `chambers`: `WHERE NOT EXISTS` on `(name, government_id)`.
- `districts`: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`.
- `offices`: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)`.
- `politicians`: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`.

### Slug Never Inserted (apply to structural migration)
**Source:** `migrations/1131` chambers INSERT (omits slug column entirely).
`essentials.chambers` has `slug` as a GENERATED ALWAYS column. Never include `slug` in the INSERT column list — migration will fail with a generated column error.

### photo_origin_url Does Not Exist (apply to headshot migration)
**Source:** `migrations/1132_beaverton_headshots.sql` — `politician_images` INSERTs use only `(id, politician_id, url, type, photo_license)`. The `photo_origin_url` column does not exist. Never include it.

### Stance Value Model (apply to 7 stance migrations)
**Source:** `migrations/1133_beaty_stances.sql` entire file.
Values are chairs (integer 1–5), not polarity. Omit the entire row for a topic with no evidence — do not default to Neutral. `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true`. Both `politician_answers` and `politician_context` tables get the same `ON CONFLICT (politician_id, topic_id) DO UPDATE`. Skip all 8 `judicial-*` topics (appointed City Attorney).

### Headshot Pipeline Order (apply to headshot script)
**Source:** `scripts/_tmp-beaverton-headshots.py` (process_headshot_bytes function).
CROP to 4:5 ratio FIRST, then RESIZE to 600x750 Lanczos SECOND. Never call resize before crop. Composite transparent sources (PNG/RGBA) onto white background before RGB conversion. Test-download one image before building the full manifest (CivicWeb CDN reliability is an open question per RESEARCH).

### representing_city Drives Banner Derivation (apply to structural migration — Hillsboro-specific improvement over Beaverton)
**Source:** `migrations/1141_beaverton_representing_city.sql` (the backfill Beaverton needed) + `buildingImages.js` `getBuildingImages()` match loop.
The frontend Local-section banner derives its city key from `offices.representing_city` (lowercased substring match against `CURATED_LOCAL` keys). Beaverton's original structural migration 1131 omitted this column, requiring a follow-up backfill (mig 1141) after the banner silently fell back to the tier gradient. **Hillsboro must set `representing_city='Hillsboro'` inline on every one of the 7 office INSERTs in the structural migration** — no separate backfill migration should be needed or created.

---

## No Analog Found

All 8 classified files/edits have direct, strong analogs in the codebase (all from the immediately-preceding Phase 176 Beaverton deep-seed, same milestone). No file requires falling back to RESEARCH.md-only patterns.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1131, 1132, 1133, 1141); `C:/EV-Accounts/backend/scripts/` (`_tmp-beaverton-headshots.py`); `C:\Transparent Motivations\essentials\src\lib\coverage.js`; `C:\Transparent Motivations\essentials\src\lib\buildingImages.js`; `.planning/phases/176-city-of-beaverton-deep-seed/176-PATTERNS.md` (prior pattern map, cross-referenced).
**Files scanned:** 7 source files read in full (migrations 1131/1132/1133/1141, coverage.js, buildingImages.js, 176-PATTERNS.md) + 1 directory listing (backend/scripts for Beaverton _tmp-* inventory).
**Pattern extraction date:** 2026-07-01

### Key Casing / Structural Traps (planner must call out in plan actions)

1. **geo_id is `4134100`, NOT `4133850`** — CONTEXT.md carries the wrong value forward; RESEARCH corrected it against a live DB query. Wave-0 must re-verify before writing any SQL.
2. `districts.state` = `'or'` lowercase — wrong case silently excludes all city officials from routing.
3. `chambers` INSERT must omit `slug` column — GENERATED ALWAYS, migration fails if included.
4. `politician_images` INSERT must omit `photo_origin_url` — column does not exist.
5. `governments` has no unique constraint on `geo_id` — always use `WHERE NOT EXISTS` on name.
6. **Do NOT build ward `X00xx` geofences** — RESEARCH resolved D-01/D-02 to pure at-large (ward = candidacy residency rule only, not a voting boundary). This is the single highest-risk misread for this phase.
7. Rob Harris's "Council President" is a title-on-seat, one office row — no second row (same as Beaverton's Kimmi pattern).
8. **Set `representing_city='Hillsboro'` INLINE in the structural migration** — do not defer to a backfill migration (contrast with Beaverton's mig 1141); the banner render depends on it at first browse.
9. Headshot script is gitignored (`_tmp-*`) — executor writes it to `backend/scripts/`; orchestrator runs it (has DB access; executor does not).
10. Stance migrations are NOT registered in `schema_migrations` — disk file counter is authoritative for the next available number; re-run `ls` at Wave-0 regardless of this document's snapshot.
11. hillsboro-oregon.gov is Akamai WAF-403 even with Chrome UA — use `hillsboro-oregon.civicweb.net` for both roster re-verification and headshots; verify actual byte download (RESEARCH flagged one inconclusive 0-byte test).
