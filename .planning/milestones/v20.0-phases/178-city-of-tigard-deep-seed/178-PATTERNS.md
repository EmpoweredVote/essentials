# Phase 178: City of Tigard Deep-Seed - Pattern Map

**Mapped:** 2026-07-02
**Files analyzed:** 10 (1 structural migration, 1 headshot migration, 7 stance migrations, 1 headshot script, 1 coverage.js edit, 1 buildingImages.js edit)
**Analogs found:** 10 / 10

**geo_id note:** `4173650` is CONFIRMED CORRECT (no correction needed, unlike Hillsboro's 4133850→4134100 fix). Ext_id block **-4173651..-4173657** (7 slots: Mayor + 6 Councilors). Next migration number: confirm on-disk MAX at Wave-0 (research snapshot: 1158 → next 1159; treat as provisional).

**Key structural difference from the Hillsboro/Beaverton siblings:** Tigard has **no ward or numbered-position labels at all** — office titles are the plain strings `'Mayor'` and `'Councilor'` (verified from primary-source charter text, Chapter 3). This is closer to Boulder City NV's plain `'Council Member'` convention than to Hillsboro's `'Councilor, Ward N, Position X'` scheme. **Two of the seven seats (Mayor Hu, Councilor Anderson) are appointed, not elected** — this requires the `is_appointed=true` / `is_appointed_position=true` pattern (not present in Hillsboro, but present in Las Vegas mig 1075's Kara Kelley block) rather than Hillsboro's uniform `is_appointed=false` for all seven.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1159_tigard_city_council.sql` | migration | CRUD | `migrations/1150_hillsboro_city_council.sql` (entire file, 402 lines) | exact (structure) / partial (title convention + appointed-seat handling — see Las Vegas 1075 secondary analog) |
| `C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql` | migration | CRUD | `migrations/1151_hillsboro_headshots.sql` (entire file, 96 lines) | exact |
| `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql` (Mayor) | migration | CRUD | `migrations/1152_pace_stances.sql` (entire file, 42 lines) | exact |
| `C:/EV-Accounts/backend/migrations/1162..1167_<councilor>_stances.sql` (6 files) | migration | CRUD | `migrations/1152_pace_stances.sql` | role-match |
| `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py` | utility | file-I/O | `scripts/_tmp-hillsboro-headshots.py` (entire file, ~400 lines, gitignored — still on disk) | exact |
| `src/lib/coverage.js` (edit — Oregon block) | config | transform | `src/lib/coverage.js` lines 96–107 (current Oregon block, live file state, post-Hillsboro) | exact |
| `src/lib/buildingImages.js` (edit — CURATED_LOCAL) | config | transform | `src/lib/buildingImages.js` lines 107–113 (current CURATED_LOCAL block, live file state, post-Hillsboro) | exact |
| `docs/banner-asset-pipeline.md`-driven banner scripts (no new file — invoke existing) | utility | file-I/O | `scripts/banners/process_banner.py` + `upload_banner.py` (already committed, no edit needed) | exact |

**No `representing_city` backfill migration needed** — set `representing_city='Tigard'` INLINE on every office INSERT in the structural migration, same as Hillsboro's D-09 fix (contrast with Beaverton's original mig 1131, which needed a separate backfill mig 1141).

---

## Pattern Assignments

### `1159_tigard_city_council.sql` (structural migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1150_hillsboro_city_council.sql` (entire file — near-1:1 template for the government/chamber/district/office-block/back-fill/post-verify/ledger shape)
**Secondary analog (appointed-seat handling):** `C:/EV-Accounts/backend/migrations/1075_las_vegas_city_council.sql` lines 218–244 (Kara Kelley block — the only prior migration seeding a currently-appointed official)

**Pre-flight hard-abort guard** (mig 1150 lines 29–35 — copy verbatim, adapt name):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Tigard, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1159 already applied — aborting re-run';
  END IF;
END $$;
```

**Government row** (mig 1150 lines 44–51, adapt geo_id to 4173650):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Tigard, Oregon, US',
       'LOCAL', 'OR', 'Tigard', '4173650'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Tigard, Oregon, US'
);
```

**Chamber row** (mig 1150 lines 54–65 — slug is GENERATED ALWAYS, never insert it; `official_count=7`):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Tigard City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Tigard, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Tigard, Oregon, US')
);
```

**LOCAL_EXEC district — Mayor citywide** (mig 1150 lines 68–73, state='or' LOWERCASE):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4173650', 'Tigard (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4173650' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

**LOCAL at-large district — all 6 councilors share ONE row** (mig 1150 lines 76–81 — DO NOT create per-seat or per-ward districts; RESEARCH confirms zero ward/position differentiation of any kind, the simplest at-large shape in the milestone):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4173650', 'Tigard (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4173650' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Mayor office block — Yi-Kang Hu, APPOINTED mid-term** (structure from mig 1150 lines 83–113; `is_appointed`/`is_appointed_position` values from mig 1075 lines 218–244 Kara Kelley precedent — Hu is directly analogous, an appointed Mayor filling a vacancy, not a placeholder default):
```sql
-- Mayor Yi-Kang Hu (-4173651) — APPOINTED Oct 7, 2025, filling Lueb's unexpired term (through Dec 31, 2026)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Yi-Kang Hu', 'Yi-Kang', 'Hu', NULL,
          true, true, false, true, -4173651)
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
                               WHERE name = 'City of Tigard, Oregon, US')),
       p.id,
       'Mayor', 'OR', 'Tigard', true, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4173650'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Note:** `is_appointed=true` on the politician row AND `is_appointed_position=true` on the office row (both set) — this is the pattern from LV mig 1075's Kelley block, NOT Hillsboro's uniform `false,false` (Hillsboro had zero appointed seats).

**Councilor office block, ELECTED seat (5 of 6 — Ghoddusi/Robbins/Schlack/Shaw/Wolf)** (structure from mig 1150 lines 116–145, title simplified to plain `'Councilor'` — no ward/position string; `is_appointed`/`is_appointed_position` = false,false):
```sql
-- Councilor Jeanette Shaw (-4173656) — elected Nov 2024, term through Dec 31, 2028
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jeanette Shaw', 'Jeanette', 'Shaw', NULL,
          true, false, false, true, -4173656)
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
                               WHERE name = 'City of Tigard, Oregon, US')),
       p.id,
       'Councilor', 'OR', 'Tigard', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4173650'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Repeat 4 more times** (Ghoddusi -4173653, Robbins -4173654, Schlack -4173655) with identical shape — only name/first_name/last_name/external_id change. Title stays plain `'Councilor'` for all — do NOT append ward/position text (confirmed absent from charter Chapter 3).

**Councilor office block, APPOINTED interim seat — Tom Anderson (-4173652)** (same LV-1075 appointed pattern as the Mayor block above, applied to a Councilor title):
```sql
-- Councilor Tom Anderson (-4173652) — APPOINTED Dec 2025, interim through Dec 31, 2026 (will not run Nov 2026)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Tom Anderson', 'Tom', 'Anderson', NULL,
          true, true, false, true, -4173652)
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
                               WHERE name = 'City of Tigard, Oregon, US')),
       p.id,
       'Councilor', 'OR', 'Tigard', true, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4173650'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Maureen Wolf (Council President) — title-on-seat, same treatment as Hillsboro's Rob Harris** (mig 1150 lines 275–277 comment pattern):
```sql
-- Councilor Maureen Wolf (-4173657) — holds the annually-elected Council President title
-- (Mayor Pro Tempore during any Mayor vacancy/absence, per Charter §3.4). This is a title
-- on her seat, NOT a separate office row. ONE office row only, title stays plain 'Councilor'.
```
Same office-block shape as the elected-councilor example above, external_id -4173657.

**office_id back-fill** (mig 1150 lines 313–320 — explicit IN list, idempotent, adapt to Tigard's 7 ext_ids):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4173651,-4173652,-4173653,-4173654,-4173655,-4173656,-4173657
  )
  AND p.office_id IS NULL;
```

**Post-verification DO block** (mig 1150 lines 329–391 — apply RESEARCH's WR-01 fix: replace the dead post-verify section-split gate with an independent canonical query, not the same-transaction "created it then checked for its absence" version):
```sql
DO $$
DECLARE
  v_gov_count      INTEGER;
  v_office_count   INTEGER;
  v_split_count    INTEGER;
  v_null_count     INTEGER;
  v_repcity_count  INTEGER;
  v_geofence_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Tigard, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Tigard gov_count=%, expected 1', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4173650' AND d.district_type IN ('LOCAL','LOCAL_EXEC') AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Tigard office_count=%, expected 7 (not 8 — no Youth Councilor)', v_office_count;
  END IF;

  -- WR-01 FIX: independent geofence-presence assertion (not the same-transaction dead gate)
  SELECT COUNT(*) INTO v_geofence_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '4173650' AND mtfcc = 'G4110';
  IF v_geofence_count < 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: no G4110 geofence row found for geo_id 4173650';
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM (
    SELECT o.district_id
    FROM essentials.offices o
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE d.geo_id = '4173650'
    GROUP BY o.district_id
    HAVING COUNT(DISTINCT o.chamber_id) > 1
  ) x;
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % rows', v_split_count;
  END IF;

  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id IN (-4173651,-4173652,-4173653,-4173654,-4173655,-4173656,-4173657)
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id after back-fill', v_null_count;
  END IF;

  SELECT COUNT(*) INTO v_repcity_count
  FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id BETWEEN -4173657 AND -4173651
    AND o.representing_city = 'Tigard';
  IF v_repcity_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % of 7 Tigard offices have representing_city=Tigard', v_repcity_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: Tigard gov=1, offices=7, geofence>=1, section-split=0, office_id nulls=0, representing_city=7';
END $$;
```

**Ledger entry** (mig 1150 lines 397–401):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1159')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `1160_tigard_headshots.sql` (audit-only headshot migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql` (entire file, 96 lines)

**File header pattern** (mig 1151 lines 1–14 — adapt source note to reflect the thinner Tigard sourcing risk):
```sql
-- Migration 1160: City of Tigard City Council Headshots — AUDIT-ONLY (not registered in the ledger)
--
-- Records the essentials.politician_images rows for the Tigard officials whose 600x750
-- portraits were uploaded to Supabase Storage (politician_photos/{uuid}-headshot.jpg) by
-- _tmp-tigard-headshots.py. One INSERT per official, guarded by WHERE NOT EXISTS on
-- politician_id (idempotent). type='default'. photo_license='press_use' (tigardlife.com /
-- valleytimes.news local-news photography — no city-portal bulk source exists, unlike Hillsboro's
-- CivicWeb mirror). If any official has no usable photo found, OMIT that INSERT block entirely —
-- do not fabricate a row. A partial 5/7 or 6/7 outcome is an honest, acceptable result per RESEARCH.
--
-- AUDIT-ONLY: this migration intentionally does NOT write a ledger row.

BEGIN;
```

**Per-official INSERT pattern** (mig 1151 lines 18–27 — repeat once per official that has a confirmed photo; omit entries with no source found):
```sql
-- Jeanette Shaw (Councilor, -4173656) — tigardlife.com
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4173656),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4173656)
);
```
**Critical:** columns exactly `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url` (confirmed absent from schema). `COMMIT;` at end, no ledger INSERT (audit-only class).

---

### `1161_hu_stances.sql` through `1167_wolf_stances.sql` (7 stance migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1152_pace_stances.sql` (entire file, 42 lines — two-statement `politician_answers` + `politician_context` shape, chairs model)

**File header pattern** (mig 1152 lines 1–3):
```sql
-- Migration 1161: Yi-Kang Hu (Mayor, Tigard OR) compass stances — AUDIT-ONLY (not registered in the ledger)
-- Evidence-only; 100% cited; chairs model (value 1-5); N cited stances; blank spokes omitted.
-- topic_id resolved LIVE via JOIN on compass_topics.topic_key AND is_live=true (no hardcoded topic UUIDs).
```

**Core stance CTE pattern — two-statement structure** (mig 1152 lines 5–41, entire operative body — copy shape, replace VALUES rows and the hardcoded politician UUID):
```sql
BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('housing', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[]),
    ('homelessness-response', 2, 'Evidence text...', ARRAY['https://source.url']::text[])
    -- one row per topic WITH evidence; omit topics entirely if no evidence found
)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
SELECT '<politician_uuid>'::uuid, ct.id, s.val
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    -- IDENTICAL VALUES block repeated verbatim
    ('housing', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[])
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '<politician_uuid>'::uuid, ct.id, s.reasoning, s.sources
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
```

**WR-02 FIX (apply to all 7 stance files, per RESEARCH):** append a row-count assertion after both INSERT statements, since the inherited template silently drops rows on a `topic_key` typo:
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM inform.politician_answers WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % answers, found % — topic_key mismatch dropped rows', <expected_count>, n;
  END IF;
END $$;
```

**Critical rules from analog:**
- `politician_id` UUID is the one minted by structural migration 1159 — look it up by `external_id` after applying it, then hardcode it in each stance file.
- `val` is integer 1–5 (chairs model, NOT polarity) — blank spoke = omit the topic row entirely, never default.
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true` — never hardcode a topic UUID.
- Skip all 8 `judicial-*` topics (City Attorney/Municipal Court Judge are appointed).
- Expect thinner `local-immigration` evidence than Hillsboro (no found Tigard-specific sanctuary resolution) — honest blank is acceptable and expected per RESEARCH.
- One migration file per official — 7 files total (Hu, Anderson, Ghoddusi, Robbins, Schlack, Shaw, Wolf).
- One agent at a time for stance research (memory: feedback_stance_research_one_at_a_time).

---

### `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py` (utility, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-hillsboro-headshots.py` (entire file, ~400 lines, gitignored but still present on disk)

**Module docstring pattern** (analog structure — adapt city/count and source description; source is materially different from Hillsboro's single-portal CivicWeb approach):
```python
"""
_tmp-tigard-headshots.py
Download, crop, resize, and upload headshots for up to 7 City of Tigard
City Council members (Mayor + 6 Councilors) to Supabase Storage bucket
'politician_photos'.

Phase 178 — WASH-04 (headshot portion).

ORCHESTRATION NOTE:
  Running this script is the INLINE-ORCHESTRATOR step, NOT the executor's.
  The executor only WRITES this file to disk. The orchestrator runs it,
  then applies audit headshot migration 1160 after the pipeline emits its
  manifest. This is a gitignored _tmp-* helper — do NOT commit it.

Processing pipeline (per feedback_headshot_resize_no_distort.md, crop-first):
  1. Resolve politician UUID at RUNTIME by external_id (psycopg2).
  2. Download the portrait from the per-official source URL — NO bulk
     portal exists for Tigard (unlike Hillsboro's CivicWeb mirror);
     sources are individual tigardlife.com / valleytimes.news article images,
     found per-official at execution time. Only Jeanette Shaw's image
     (696x462, tigardlife.com) was spot-verified in RESEARCH.
  3. Composite onto white if transparent (PNG/RGBA).
  4. CROP to 4:5 ratio FIRST — never stretch.
  5. RESIZE to 600x750 Lanczos q90.
  6. Upload to politician_photos/{uuid}-headshot.jpg via PUT x-upsert: true.
  7. Reject any image with superimposed text/graphics over the face.
  8. Document any official with NO usable photo found as a genuine gap —
     do not force a low-quality or group-photo crop just to hit 7/7.
"""
```

**OFFICIALS roster pattern** (analog structure — adapt to Tigard's 7 officials; unlike Hillsboro, expect this list to be populated incrementally as per-official searches succeed, not from one bulk portal fetch):
```python
OFFICIALS = [
    {
        'ext_id': -4173656,
        'name': 'Jeanette Shaw',
        'url': 'https://tigardlife.com/wp-content/uploads/2024/09/Jeanette-Shaw-696x462.jpg',
        'license': 'press_use',
        # Spot-verified in RESEARCH: HTTP 200, 36,280 bytes, 696x462 JPEG.
    },
    # ... up to 6 more entries through -4173651 Yi-Kang Hu — search tigardlife.com/valleytimes.news
    # per-official; Facebook official pages (e.g. facebook.com/YiForTigard) are a manual-only
    # last resort per RESEARCH, not scriptable.
]

assert len({m["ext_id"] for m in OFFICIALS}) == len(OFFICIALS), 'external_ids must be unique'
# NOTE: unlike Hillsboro's `assert len(OFFICIALS) == 7`, do NOT hard-assert count == 7 here —
# genuine gaps are an expected, acceptable outcome per RESEARCH Open Question 2.
```

**Config block, crop/resize functions, transparent-composite guard, manifest output** — copy verbatim from `_tmp-hillsboro-headshots.py`, renaming only city-specific strings (`BUCKET`, `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `RESAMPLE=Image.Resampling.LANCZOS` all identical).

---

### `src/lib/coverage.js` (config edit — add Tigard to Oregon block)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\coverage.js` lines 96–107 (current Oregon block, live file state, already includes Hillsboro)

**Current Oregon block** (verified live, lines 96–107):
```js
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

**Required edit — insert Tigard alphabetically between Portland and Troutdale ("Ti" < "Tr"):**
```js
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',   browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',    browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Gresham',     browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',   browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park',browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',    browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Tigard',      browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',   browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Wood Village',browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
```
**`hasContext: true` is correct once ≥1 stance row exists** for a Tigard official. Browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110`.

---

### `src/lib/buildingImages.js` (config edit — add Tigard to CURATED_LOCAL)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\buildingImages.js` lines 107–113 (current CURATED_LOCAL block, live file state, already includes Hillsboro — the freshest same-milestone template)

**Current state** (verified live, lines 107–113):
```js
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  ...
```

**Required edit — add attribution comment + `tigard` key** (verify exact CC BY-SA version at execution per RESEARCH A10 before finalizing the comment string):
```js
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard, Oregon | Aboutmovies | CC BY-SA <version — verify at execution>
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  tigard: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg',
  ...
```
The key `tigard` (lowercase) matches how `getBuildingImages()` substring-matches against `offices.representing_city` (lowercased) — see match loop around lines 200–204: `if (city.includes(key)) { localImage = src; break; }`. This is why `representing_city='Tigard'` MUST be set inline on the structural migration — without it, the banner falls back to the tier gradient.

**Banner pipeline invocation (no new file — use existing committed scripts):**
```bash
python scripts/banners/process_banner.py \
  --input <raw_source_photo> \
  --output <processed_1700x540.jpg> \
  # crops/resizes to 1700x540 @ 3.15:1 per docs/banner-asset-pipeline.md

python scripts/banners/upload_banner.py \
  --file <processed_1700x540.jpg> \
  --path cities/tigard.jpg
  # uploads to Supabase Storage politician_photos/cities/tigard.jpg, prints CDN URL
```
Follow `docs/banner-asset-pipeline.md` Stages 1–8 exactly (Wikimedia Commons candidate already identified: "Downtown Tigard Oregon.JPG"; Unsplash fallback; NO AI-generated images; no baked-in text/graphics).

---

## Shared Patterns

### OR State/Casing Rules (apply to structural migration)
**Source:** `migrations/1150_hillsboro_city_council.sql` lines 6–20 (comment block), re-verified live by RESEARCH against Beaverton/Portland/Hillsboro.

| Context | Casing | Why |
|---|---|---|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder/routing query |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `politicians.party` | `NULL` | Antipartisan — never set, despite Anderson/Ghoddusi being publicly characterized by party in news coverage |

### Idempotency Guards (apply to structural migration)
**Source:** `migrations/1150_hillsboro_city_council.sql` throughout.
- `governments`: `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no unique constraint on geo_id.
- `chambers`: `WHERE NOT EXISTS` on `(name, government_id)`.
- `districts`: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`.
- `offices`: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)`.
- `politicians`: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`.

### Slug Never Inserted (apply to structural migration)
**Source:** `migrations/1150` chambers INSERT (omits slug column entirely).
`essentials.chambers` has `slug` as a GENERATED ALWAYS column. Never include `slug` in the INSERT column list — migration will fail with a generated column error.

### photo_origin_url Does Not Exist (apply to headshot migration)
**Source:** `migrations/1151_hillsboro_headshots.sql` — `politician_images` INSERTs use only `(id, politician_id, url, type, photo_license)`. The `photo_origin_url` column does not exist. Never include it.

### Stance Value Model (apply to 7 stance migrations)
**Source:** `migrations/1152_pace_stances.sql` entire file.
Values are chairs (integer 1–5), not polarity. Omit the entire row for a topic with no evidence — do not default to Neutral. `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true`. Both `politician_answers` and `politician_context` tables get the same `ON CONFLICT (politician_id, topic_id) DO UPDATE`. Skip all 8 `judicial-*` topics (appointed City Attorney/Municipal Court Judge).

### Appointed-Seat Politician Pattern (apply to Mayor Hu + Councilor Anderson blocks — NEW for this phase, not present in Hillsboro)
**Source:** `migrations/1075_las_vegas_city_council.sql` lines 218–244 (Kara Kelley block — the closest prior precedent for a currently-appointed official).
For an official who holds their seat by council appointment rather than direct election: set `politicians.is_appointed=true` AND `offices.is_appointed_position=true` (both flags, not just one). Contrast with Hillsboro's structural migration, where all 7 seats used a uniform `is_appointed=false` / `is_appointed_position=false` because no seat was appointment-filled. Carry the real term-end date (Dec 31, 2026 for both Hu and Anderson) into a migration comment — do not flatten to a standard 4-year cycle.

### Headshot Pipeline Order (apply to headshot script)
**Source:** `scripts/_tmp-hillsboro-headshots.py` (process_headshot_bytes function, structure verified in 177-PATTERNS.md).
CROP to 4:5 ratio FIRST, then RESIZE to 600x750 Lanczos SECOND. Never call resize before crop. Composite transparent sources (PNG/RGBA) onto white background before RGB conversion. Unlike Hillsboro, do not hard-assert `len(OFFICIALS) == 7` — a partial headshot outcome (5/7 or 6/7) is an acceptable, honestly-documented result per RESEARCH given the absence of a bulk portal.

### representing_city Drives Banner Derivation (apply to structural migration)
**Source:** `migrations/1150_hillsboro_city_council.sql` (D-09 inline pattern) + `buildingImages.js` `getBuildingImages()` match loop.
The frontend Local-section banner derives its city key from `offices.representing_city` (lowercased substring match against `CURATED_LOCAL` keys). **Tigard's structural migration must set `representing_city='Tigard'` inline on every one of the 7 office INSERTs** — no separate backfill migration should be needed or created, following the Hillsboro improvement over Beaverton's original gap (which needed backfill mig 1141).

### Plain Title Convention, No Ward/Position Differentiation (apply to structural migration — NEW pattern class for this milestone, closest precedent is out-of-milestone)
**Source:** `migrations/1100_boulder_city_city_council.sql` lines 106–260 (Boulder City NV, Phase 165 — the only other seeded city in the project with zero ward/position differentiation; uses plain `'Mayor'` / `'Council Member'` titles).
Tigard's charter (Chapter 3) contains no ward or numbered-position language anywhere — office titles are simply `'Mayor'` and `'Councilor'` for all 7 seats. This is a materially simpler title convention than either Beaverton (numbered positions) or Hillsboro (ward+position) — do not import their title string patterns.

---

## No Analog Found

All 8 classified files/edits have direct, strong analogs in the codebase (7 from the immediately-preceding Phase 177 Hillsboro deep-seed, same milestone; 1 supplementary analog from Phase 161/165's Las Vegas/Boulder City migrations for the two patterns Hillsboro didn't need — appointed-seat flags and plain no-ward titles). No file requires falling back to RESEARCH.md-only patterns.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1150, 1151, 1152, 1075, 1100); `C:/EV-Accounts/backend/scripts/` (`_tmp-hillsboro-headshots.py`, confirmed present on disk despite gitignore); `C:\Transparent Motivations\essentials\src\lib\coverage.js`; `C:\Transparent Motivations\essentials\src\lib\buildingImages.js`; `.planning/phases/177-city-of-hillsboro-deep-seed/177-PATTERNS.md` (prior pattern map, cross-referenced and largely superseded by this document's live-file re-reads).
**Files scanned:** 6 source files read in full (migrations 1150, 1151, 1152, plus targeted greps of 1075 and 1100), 2 live config files (coverage.js, buildingImages.js), 1 prior PATTERNS.md, 1 directory listing (backend/scripts and backend/migrations for Hillsboro/Boulder City/LV inventory).
**Pattern extraction date:** 2026-07-02

### Key Casing / Structural Traps (planner must call out in plan actions)

1. **geo_id is `4173650`** — CONFIRMED CORRECT by RESEARCH against the live production DB; no correction needed (unlike Hillsboro's 4133850→4134100 fix). Wave-0 must still re-verify per standard practice.
2. `districts.state` = `'or'` lowercase — wrong case silently excludes all city officials from routing.
3. `chambers` INSERT must omit `slug` column — GENERATED ALWAYS, migration fails if included.
4. `politician_images` INSERT must omit `photo_origin_url` — column does not exist.
5. `governments` has no unique constraint on `geo_id` — always use `WHERE NOT EXISTS` on name.
6. **Do NOT build ward or numbered-position geofences/titles** — RESEARCH confirms pure at-large, zero differentiation of any kind; office titles are plain `'Mayor'` / `'Councilor'`. This is the highest-risk misread, given the two preceding same-milestone siblings (Beaverton positions, Hillsboro ward+position) both had differentiation.
7. **Mayor Hu and Councilor Anderson need `is_appointed=true` + `is_appointed_position=true`** — the other 5 councilors use `false,false` same as all of Hillsboro's 7. Do not flatten all 7 to a uniform value.
8. **Do NOT seed the Youth Councilor as an 8th office** — non-voting, mayor-appointed, excluded per RESEARCH. `official_count` on the chamber stays 7.
9. Maureen Wolf's "Council President" is a title-on-seat, one office row — no second row (same treatment class as Hillsboro's Rob Harris / Beaverton's Kimmi).
10. **Set `representing_city='Tigard'` INLINE in the structural migration** — do not defer to a backfill migration; the banner render depends on it at first browse.
11. Apply RESEARCH's WR-01 fix in the structural migration's post-verify block: use an independent canonical section-split query, not the dead same-transaction gate inherited from the Beaverton/Hillsboro template.
12. Apply RESEARCH's WR-02 fix in each of the 7 stance migrations: append a row-count `DO $$` assertion after the `politician_answers` INSERT to catch a silently-dropped `topic_key` typo.
13. Headshot script is gitignored (`_tmp-*`) — executor writes it to `backend/scripts/`; orchestrator runs it (has DB access; executor does not). Expect a genuinely thinner headshot outcome than Hillsboro (no bulk CivicWeb-equivalent portal found) — do not force a 7/7 assertion.
14. Stance migrations are NOT registered in `schema_migrations` — disk file counter is authoritative for the next available number; re-run `ls C:/EV-Accounts/backend/migrations | sort` at Wave-0 regardless of this document's snapshot (research found MAX=1158 → next 1159).
15. tigard-or.gov is Akamai WAF-403 even with Chrome UA, and unlike Hillsboro, NO working CivicWeb/Legistar/Granicus mirror exists — use tigardlife.com/valleytimes.news for both roster re-verification and headshots; use curl (not WebFetch) for ecode360.com charter/code text specifically.
