# Phase 181: City of Sherwood Deep-Seed - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 10 (1 structural migration, 1 headshot migration, 7 stance migrations, 1 headshot script, 1 coverage.js edit, 1 buildingImages.js edit)
**Analogs found:** 10 / 10

**geo_id note:** RESEARCH corrected the ROADMAP/CONTEXT-stated `4167450` (0 rows — does not exist at all) to the verified `4167100` (sole G4110 "Sherwood city" row). Use `4167100` everywhere below. Ext_id block **-4167101..-4167107** (7 slots: Mayor + 6 Councilors). Next migration number: on-disk MAX confirmed **1186** (`1186_schimmel_stances.sql`) → next available **1187** (Wave-0 must re-confirm).

**Key structural facts from RESEARCH (drive analog selection):** Pure at-large, PLAIN titles (`'Mayor'`/`'Councilor'`, no wards/positions) — same shape class as Tigard (178) and Forest Grove (180), NOT Beaverton (numbered positions) or Hillsboro (ward+position). Mayor directly elected citywide (LOCAL_EXEC + shared LOCAL council district), same district-split shape as Beaverton/Tualatin/Forest Grove — **but Mayor's term is 2 years, not 4** (a new wrinkle; does not change the structural shape, only the migration comment). **Zero appointed seats** (all 7 elected) — use the Forest Grove/Tualatin uniform `false,false` pattern, NOT Tigard's appointed-seat block. Council President Kim Young = title-on-seat, one office row (Valenzuela/Wolf/Pratt/Harris precedent class). Skip all 8 judicial-* topics (City Attorney + Municipal Court Judge council-appointed, Sherwood-specific org-chart confirmation). Headshots are the best in the milestone — all 7 sourced directly from sherwoodoregon.gov via static `<img>` tags, no D-16 fallback chain needed, but a genuinely new pipeline nuance: **all 7 source images are square 600x600** (crop-width-down to 4:5, not the usual crop-height-off-wide-source pattern).

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1187_sherwood_city_council.sql` | migration | CRUD | `migrations/1178_forest_grove_city_council.sql` (entire file, 443 lines) | exact |
| `C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql` | migration | CRUD | `migrations/1179_forest_grove_headshots.sql` (entire file, 141 lines) | exact (structure) / different sourcing note (no fallback chain needed here) |
| `C:/EV-Accounts/backend/migrations/1189..1195_<councilor>_stances.sql` (7 files) | migration | CRUD | `migrations/1180_wenzl_stances.sql` (entire file, 62 lines) | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py` | utility | file-I/O | `scripts/_tmp-forest-grove-headshots.py` (entire file, ~500 lines, gitignored — confirmed on disk) | exact (structure) / adapt sourcing note + square-crop nuance |
| `src/lib/coverage.js` (edit — Oregon block) | config | transform | `src/lib/coverage.js` lines 96-110 (current live Oregon block, already includes Forest Grove/Tigard/Tualatin) | exact |
| `src/lib/buildingImages.js` (edit — CURATED_LOCAL) | config | transform | `src/lib/buildingImages.js` lines 102-118 (current live CURATED_LOCAL block + attribution comments) | exact |
| `docs/banner-asset-pipeline.md`-driven banner scripts (no new file — invoke existing) | utility | file-I/O | `scripts/banners/process_banner.py` + `upload_banner.py` (already committed, no edit needed) | exact |

**No `representing_city` backfill migration needed** — set `representing_city='Sherwood'` INLINE on every office INSERT in the structural migration (D-11 convention, same as Tigard/Tualatin/Forest Grove).

---

## Pattern Assignments

### `1187_sherwood_city_council.sql` (structural migration, CRUD)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql` (entire file — closest template: pure at-large, plain titles, zero appointed seats, directly-elected Mayor + shared LOCAL council district — the exact same shape class Sherwood needs, just swap geo_id/names/ext_ids and note the 2-year Mayor term).

**Pre-flight hard-abort guard** (1178 lines 51-58 — copy verbatim, adapt name):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Sherwood, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1187 already applied — aborting re-run';
  END IF;
END $$;
```

**Government row** (1178 lines 60-68, adapt geo_id to CORRECTED 4167100):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Sherwood, Oregon, US',
       'LOCAL', 'OR', 'Sherwood', '4167100'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Sherwood, Oregon, US'
);
```

**Chamber row** (1178 lines 70-82 — slug is GENERATED ALWAYS, never insert it; `official_count=7`):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Sherwood City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Sherwood, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Sherwood, Oregon, US')
);
```

**LOCAL_EXEC district — Mayor citywide, 2-year term (note the wrinkle in the label/comment, not the structure)** (1178 lines 84-90):
```sql
-- Mayor is directly elected citywide on a 2-YEAR term (new pattern this milestone — every
-- other WashCo Mayor so far, incl. Forest Grove, is 4-year). Structural shape is unchanged:
-- same LOCAL_EXEC + shared LOCAL split as Beaverton/Tualatin/Forest Grove.
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4167100', 'Sherwood (Mayor, Citywide, 2-Year Term)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4167100' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

**LOCAL at-large district — all 6 councilors share ONE row** (1178 lines 92-99 — do NOT create per-seat/per-position districts; RESEARCH confirms zero ward/position differentiation, verified via SEL101 filings):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4167100', 'Sherwood (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4167100' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Mayor office block — Tim Rosener, ELECTED (not appointed)** (1178 lines 101-133 — Forest Grove's Wenzl block is the exact shape: `false,false` for is_appointed/is_appointed_position, contrast with Tigard's appointed-Mayor Hu block which does NOT apply here):
```sql
-- Mayor Tim Rosener (-4167101) — directly elected citywide, 2-year term, current term expires
-- January 2027 (began January 2025 following the Nov 2024 election). Not appointed: false/false
-- (Sherwood has zero appointed seats — use this Forest Grove/Tualatin shape, NOT Tigard's
-- appointed-Mayor Hu block).
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Tim Rosener', 'Tim', 'Rosener', NULL,
          true, false, false, true, -4167101)
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
                               WHERE name = 'City of Sherwood, Oregon, US')),
       p.id,
       'Mayor', 'OR', 'Sherwood', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4167100'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Councilor office block pattern — repeat for all 6 councilors** (1178 lines 135-166 shape, plain `'Councilor'` title, `false,false` appointed flags):
```sql
-- Councilor Kim Young (-4167102) — Council President title-on-seat (see note below), elected
-- Nov 2024, term through January 2029. Not appointed: false/false.
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Kim Young', 'Kim', 'Young', NULL,
          true, false, false, true, -4167102)
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
                               WHERE name = 'City of Sherwood, Oregon, US')),
       p.id,
       'Councilor', 'OR', 'Sherwood', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4167100'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Repeat 5 more times** (Renee Brouse -4167103, Taylor Giles -4167104, Keith Mays -4167105, Doug Scott -4167106, Dan Standke -4167107) with identical shape — only name/first_name/last_name/external_id change. Title stays plain `'Councilor'` for all — do NOT append ward/position text (confirmed absent from all three primary sources).

**Council President title-on-seat comment** (1178 lines 201-207 comment pattern, adapted for Young):
```sql
-- Councilor Kim Young holds the annually-designated Council President title (confirmed via
-- both the live city council page and the city's Dec-2024 org chart). This is a title on her
-- seat, NOT a separate office row. ONE office row only, title stays plain 'Councilor' — same
-- treatment class as Tigard's Wolf, Tualatin's Pratt, Forest Grove's Valenzuela.
```

**Keith Mays pitfall guard comment** (RESEARCH-specific — adapt 1178's PITFALL GUARD comment pattern, lines 25-29):
```sql
-- PITFALL GUARD: Keith Mays is a FORMER Mayor (2018-2022, 2005-2012) and FORMER Council
-- President (2001-2004) — he is now seated as a PLAIN Councilor. Do NOT title him 'Mayor' or
-- give him the Council President designation; that belongs to the currently-seated Rosener/Young.
```

**office_id back-fill** (1178 lines 342-350 — explicit IN list, idempotent, adapt to Sherwood's 7 ext_ids):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4167101,-4167102,-4167103,-4167104,-4167105,-4167106,-4167107
  )
  AND p.office_id IS NULL;
```

**Post-verification DO block** (1178 lines 352-435 — includes the WR-B pairwise identity gate per D-15, upgraded from Forest Grove's set-membership `IN` gate):
```sql
DO $$
DECLARE
  v_gov_count      INTEGER;
  v_office_count   INTEGER;
  v_split_count    INTEGER;
  v_null_count     INTEGER;
  v_repcity_count  INTEGER;
  v_geofence_count INTEGER;
  v_pair_count     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Sherwood, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Sherwood gov_count=%, expected 1', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4167100' AND d.district_type IN ('LOCAL','LOCAL_EXEC') AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Sherwood office_count=%, expected 7', v_office_count;
  END IF;

  SELECT COUNT(*) INTO v_geofence_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '4167100' AND mtfcc = 'G4110';
  IF v_geofence_count < 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: no G4110 geofence row found for geo_id 4167100';
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM (
    SELECT o.district_id
    FROM essentials.offices o
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE d.geo_id = '4167100'
    GROUP BY o.district_id
    HAVING COUNT(DISTINCT o.chamber_id) > 1
  ) x;
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % rows', v_split_count;
  END IF;

  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id IN (-4167101,-4167102,-4167103,-4167104,-4167105,-4167106,-4167107)
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id after back-fill', v_null_count;
  END IF;

  SELECT COUNT(*) INTO v_repcity_count
  FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id BETWEEN -4167107 AND -4167101
    AND o.representing_city = 'Sherwood';
  IF v_repcity_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % of 7 Sherwood offices have representing_city=Sherwood', v_repcity_count;
  END IF;

  -- D-15 WR-B FIX: upgrade the Forest Grove/Tigard set-membership identity gate (two
  -- independent IN lists) to a PAIRWISE (external_id, full_name) assertion, so a name/id
  -- transposition on re-run cannot silently pass just because both sets independently match.
  SELECT COUNT(*) INTO v_pair_count
  FROM essentials.politicians
  WHERE (external_id, full_name) IN (
    (-4167101, 'Tim Rosener'), (-4167102, 'Kim Young'), (-4167103, 'Renee Brouse'),
    (-4167104, 'Taylor Giles'), (-4167105, 'Keith Mays'), (-4167106, 'Doug Scott'),
    (-4167107, 'Dan Standke')
  );
  IF v_pair_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: pairwise identity gate — expected 7 exact (external_id, full_name) matches, found %', v_pair_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: Sherwood gov=1, offices=7, geofence>=1, section-split=0, office_id nulls=0, representing_city=7, pairwise_identity=7';
END $$;
```

**Ledger entry** (1178 lines 437-442):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1187')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `1188_sherwood_headshots.sql` (audit-only headshot migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql` (entire file, 141 lines) — structure only. **Sourcing note differs materially**: unlike Forest Grove's JS-rendering gap requiring the full D-16 fallback chain, Sherwood's 7 headshots are ALL directly sourced from sherwoodoregon.gov static `<img>` tags (confirmed HTTP 200, 600x600 JPEG each) — expect a full 7/7 outcome, no fallback needed.

**File header pattern** (1179 lines 1-19 — adapt source note to reflect the confirmed direct-download sourcing, NOT a fallback-chain gap):
```sql
-- Migration 1188: City of Sherwood City Council Headshots — AUDIT-ONLY (not registered in the ledger)
--
-- Records the essentials.politician_images rows for the Sherwood officials whose 600x750
-- portraits were uploaded to Supabase Storage (politician_photos/{uuid}-headshot.jpg) by
-- _tmp-sherwood-headshots.py. One INSERT per SOURCED official, guarded by WHERE NOT EXISTS
-- on politician_id (idempotent). type='default'. photo_license='press_use' for all 7 — uniform
-- official-site studio-style portraits, uploaded via the CMS's own media library. Sourcing note:
-- sherwoodoregon.gov's council page embeds all 7 headshots as static <img> tags, directly
-- curl-retrievable (HTTP 200, no WAF, no JS/AJAX gate) — the best sourcing outcome of the
-- milestone. No D-16 fallback chain needed; expect a full 7/7 outcome.
--
-- AUDIT-ONLY: this migration intentionally does NOT write a ledger row.
--
-- ORCHESTRATOR NOTE (fail-closed template — MUST be edited before applying):
--   The 7 blocks below are pre-filled with the politician UUIDs minted by structural migration
--   1187 (see 181-02-SUMMARY.md) — the same UUIDs the pipeline resolves at runtime by
--   external_id and embeds in each Storage path. Before applying:
--     1. DELETE the entire INSERT block for any official the pipeline manifest does NOT report
--        SUCCESS for (honest gap — no fabrication; not expected here given confirmed sourcing).
--     2. Confirm each remaining block's photo_license is 'press_use' (should be uniform since
--        all sources are the official city site).
--     3. Set the post-verification DO block's expected count to the ACTUAL number of INSERT
--        blocks remaining (should be 7).
```

**D-15 WR-A FIX — keep the note text in sync with the gate default (this is the exact defect being fixed):** In 180's applied `1179_forest_grove_headshots.sql`, the ORCHESTRATOR NOTE still reads *"currently 0, the fail-closed template default"* even though the post-verify gate was edited to `IF n <> 7`. **When authoring 1188, write the note's stated default to match whatever the gate literally says at that moment** — if the template starts with `IF n <> 0` (fail-closed default), the note must say "currently 0"; once the gate is edited to the real expected count (7), the note text must be edited too, in the same commit. Do not let the two drift as they did in the 180 file still on disk.

**Per-official INSERT pattern** (1179 lines 37-46, repeat per official — expect all 7 given confirmed direct sourcing):
```sql
-- Tim Rosener (Mayor, -4167101) — SOURCE: sherwoodoregon.gov official council-page portrait (direct curl, HTTP 200)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4167101),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4167101)
);
```
**Critical:** columns exactly `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url` (confirmed absent from schema, re-verified every prior phase).

**Post-verification gate** (1179 lines 118-138 — url-embeds-uuid pattern, adapt expected count to actual, expect 7):
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -4167107 AND -4167101
    AND pi.url LIKE '%' || pi.politician_id::text || '%';
  IF n <> 7 THEN
    RAISE EXCEPTION 'Expected 7 Sherwood politician_images rows with url embedding the politician uuid, found %', n;
  END IF;
END $$;

COMMIT;
```

---

### `1189_rosener_stances.sql` through `1195_standke_stances.sql` (7 stance migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1180_wenzl_stances.sql` (entire file, 62 lines — two-statement `politician_answers` + `politician_context` shape, chairs model, WR-01/WR-02/WR-03 gates already shipped)

**File header pattern** (1180 lines 1-3):
```sql
-- Migration 1189: Tim Rosener (Mayor, Sherwood OR) compass stances — AUDIT-ONLY (not registered in the ledger)
-- Evidence-only; 100% cited; chairs model (value 1-5); N cited stances; blank spokes omitted.
-- topic_id resolved LIVE via JOIN on compass_topics.topic_key AND is_live=true (no hardcoded topic UUIDs).
```

**Core stance CTE pattern — two-statement structure with WR-01/WR-02/WR-03 gates** (1180 lines 5-61, entire operative body — copy shape, replace VALUES rows and the hardcoded politician UUID):
```sql
BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('growth-and-development', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[])
    -- one row per topic WITH evidence; omit topics entirely if no evidence found
)
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
SELECT '<politician_uuid>'::uuid, ct.id, s.val
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    -- IDENTICAL VALUES block repeated verbatim
    ('growth-and-development', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[])
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '<politician_uuid>'::uuid, ct.id, s.reasoning, s.sources
FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

DO $$
DECLARE n INTEGER;
        v_ext BIGINT;
BEGIN
  -- Identity gate (WR-01): the hardcoded politician UUID must belong to the intended
  -- official's external_id.
  SELECT external_id INTO v_ext FROM essentials.politicians WHERE id = '<politician_uuid>';
  IF v_ext IS DISTINCT FROM -4167101 THEN
    RAISE EXCEPTION 'UUID <politician_uuid> does not belong to external_id -4167101 (Tim Rosener) — found %', v_ext;
  END IF;
  SELECT COUNT(*) INTO n FROM inform.politician_answers WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % answers, found % — topic_key mismatch dropped rows', <expected_count>, n;
  END IF;
  -- Context-parity gate (WR-03): the context VALUES list is a verbatim duplicate of the
  -- answers list; count it too so a single-sided edit cannot silently drop rows.
  SELECT COUNT(*) INTO n FROM inform.politician_context WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % context rows, found % — answers/context VALUES lists diverged', <expected_count>, n;
  END IF;
END $$;

COMMIT;
```

**Critical rules from analog:**
- `politician_id` UUID is the one minted by structural migration 1187 — look it up by `external_id` after applying it, then hardcode it in each stance file.
- `val` is integer 1-5 (chairs model, NOT polarity) — blank spoke = omit the topic row entirely, never default.
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true` — never hardcode a topic UUID.
- Skip all 8 `judicial-*` topics (City Attorney/Municipal Court Judge confirmed council-appointed via Sherwood's own org chart — a firmer confirmation than Forest Grove's cross-city assumption).
- **Strong shared evidence anchor available for most/all 7 officials:** the Oct 28, 2025 unanimous 3-resolution Charter-amendment vote on state-housing-law local control (ratified Jan 2026 special election, 80-90%+ margins). RESEARCH flags a genuine polarity/topic-fit nuance — WHO-decides (local control) vs. the more typical residential-zoning density axis — treat as `growth-and-development` primarily, evaluate `residential-zoning` fit independently per official, do not mechanically copy one value across all 7.
- One migration file per official — 7 files total (Rosener, Young, Brouse, Giles, Mays, Scott, Standke).
- One agent at a time for stance research (memory: feedback_stance_research_one_at_a_time).
- D-16: pamplinmedia.com TLS-fails for all fetchers — use search-index extraction, cite the original article URL, stay evidence-only. valleytimes.news/beavertonvalleytimes.com are directly WebFetch-able.

---

### `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py` (utility, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py` (entire file, ~500 lines, gitignored but confirmed present on disk)

**Module docstring pattern** (analog lines 1-53 — adapt source note: Sherwood needs NO fallback chain, unlike Forest Grove's JS-rendering gap):
```python
"""
_tmp-sherwood-headshots.py
Download, crop, resize, and upload headshots for up to 7 City of Sherwood
City Council members (Mayor + 6 Councilors) to Supabase Storage bucket
'politician_photos'.

Phase 181 — WASH-07 (headshot portion).

ORCHESTRATION NOTE:
  Running this script is the INLINE-ORCHESTRATOR step, NOT the executor's.
  The executor only WRITES this file to disk. The orchestrator runs it,
  then applies audit headshot migration 1188 after the pipeline emits its
  manifest. This is a gitignored _tmp-* helper — do NOT commit it.

SOURCE NOTE (BEST SOURCING IN THE MILESTONE — no fallback chain needed):
  sherwoodoregon.gov/government/city-council/ has NO WAF and embeds all 7
  headshots as plain static <img> tags, directly curl-retrievable (HTTP 200
  each, 600x600 JPEG, 32KB-69KB). Confirmed URL pattern:
  wp-content/uploads/2025/02/<firstname>-<lastname>-600.jpg. Unlike Forest
  Grove (JS/AJAX-gated widget) or Tigard (no bulk portal), no D-16 fallback
  chain is expected to be needed — expect a full 7/7 outcome.

PIPELINE NUANCE — SQUARE SOURCE (new for this phase):
  All 7 source images are 600x600 (1:1), not the usual wider/taller mixed
  ratios seen in prior phases. Cropping a square image to the 4:5 target
  means cropping the WIDTH down (600->480px, centered on the face) rather
  than the more common "crop height off a wide photo" pattern, then
  upscaling the resulting 480x600 crop to the final 600x750 (a 25% upscale
  in both dimensions — well within the project's established acceptable-
  upscale precedent). Verify crop_to_4_5() handles a square input correctly
  before running the full manifest — this is untested against a 1:1 source
  in prior scripts.

Processing pipeline (per feedback_headshot_resize_no_distort.md, crop-first):
  1. Resolve politician UUID at RUNTIME by external_id (psycopg2). UUIDs were
     minted by structural migration 1187 — NEVER hardcode a UUID.
  2. Download the portrait from the per-official source URL.
  3. Composite onto white if transparent (PNG/RGBA) — not expected needed
     for these JPEG sources, but keep the guard for safety.
  4. CROP to 4:5 ratio FIRST — never stretch (crops WIDTH on this square
     source, not the usual height crop).
  5. RESIZE to 600x750 Lanczos q90.
  6. Upload to politician_photos/{uuid}-headshot.jpg via PUT x-upsert: true.
  7. Reject any image with superimposed text/graphics over the face.
  8. Document any official with NO usable photo found as a genuine gap —
     not expected here given confirmed 7/7 direct sourcing.
"""
```

**OFFICIALS roster pattern** (analog structure — adapt to Sherwood's 7 officials; all 7 URLs already confirmed at RESEARCH time, unlike Tigard's incremental per-official search):
```python
OFFICIALS = [
    {
        'ext_id': -4167101,
        'name': 'Tim Rosener',
        'url': 'https://www.sherwoodoregon.gov/wp-content/uploads/2025/02/tim-rosener-600.jpg',
        'license': 'press_use',
        # Confirmed in RESEARCH: HTTP 200, 46,946 bytes, 600x600 JPEG.
    },
    {
        'ext_id': -4167102,
        'name': 'Kim Young',
        'url': 'https://www.sherwoodoregon.gov/wp-content/uploads/2025/02/kim-young-600.jpg',
        'license': 'press_use',
    },
    # ... 5 more entries through -4167107 Dan Standke (daniel-standke-600.jpg) — all 7 URLs
    # already confirmed downloadable in RESEARCH; no per-official search needed at execution.
]

assert len({m["ext_id"] for m in OFFICIALS}) == len(OFFICIALS), 'external_ids must be unique'
assert len(OFFICIALS) == 7, 'expect a full 7/7 outcome given confirmed direct-download sourcing'
```

**D-15 WR-C FIX — empty-roster guard (apply to `main()`, this is the exact defect being fixed):** Forest Grove's `_tmp-forest-grove-headshots.py` line 455 calls `test_download_guard(OFFICIALS[0])` with no length check first — an `IndexError` risk if `OFFICIALS` is ever empty at test time. When cloning to Sherwood:
```python
print(f'  Roster: {len(OFFICIALS)} City of Sherwood officials configured (7/7 expected)')

# D-15 WR-C FIX: guard len(OFFICIALS) > 0 before indexing into it (Forest Grove's
# 1179-era script called test_download_guard(OFFICIALS[0]) with no length check first).
if len(OFFICIALS) > 0:
    test_download_guard(OFFICIALS[0])
else:
    print('  SKIP: OFFICIALS is empty — no test-download guard possible.')
```

**WR-01 exit gate (already shipped, keep verbatim)** (analog lines 492-499):
```python
# WR-01 FIX: exit non-zero on ANY failure, so a chained automation cannot silently
# treat a partial-failure run as success just because main() itself returned 0.
if failures:
    print(f'EXIT 1: {len(failures)} of {len(OFFICIALS)} headshot uploads failed — '
          f'see errors above.')
    sys.exit(1)
```

**Config block, crop/resize functions, transparent-composite guard, manifest output** — copy verbatim from `_tmp-forest-grove-headshots.py`, renaming only city-specific strings (`BUCKET`, `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `RESAMPLE=Image.Resampling.LANCZOS` all identical). **Verify `crop_to_4_5()`'s width-crop branch against the confirmed 600x600 square source before running the full manifest** (new nuance, not exercised by any prior wide/tall-source script).

---

### `src/lib/coverage.js` (config edit — add Sherwood to Oregon block)

**Analog:** `src/lib/coverage.js` lines 96-110 (current live Oregon block, already includes Forest Grove/Tigard/Tualatin)

**Current Oregon block** (verified live):
```js
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',    browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',     browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Gresham',      browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',    browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park', browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',     browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Tigard',       browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',    browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Tualatin',     browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Wood Village', browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
```

**Required edit — insert Sherwood alphabetically between Portland and Tigard ("S" < "T"):**
```js
    name: 'Oregon', abbrev: 'OR',
    areas: [
      { label: 'Beaverton',    browseGovernmentList: ['4105350'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Fairview',     browseGovernmentList: ['4124250'], browseStateAbbrev: 'OR' },
      { label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Gresham',      browseGovernmentList: ['4131250'], browseStateAbbrev: 'OR' },
      { label: 'Hillsboro',    browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Maywood Park', browseGovernmentList: ['4146730'], browseStateAbbrev: 'OR' },
      { label: 'Portland',     browseGovernmentList: ['4159000'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Sherwood',     browseGovernmentList: ['4167100'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Tigard',       browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Troutdale',    browseGovernmentList: ['4174850'], browseStateAbbrev: 'OR' },
      { label: 'Tualatin',     browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Wood Village', browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
```
**`hasContext: true` is correct once ≥1 stance row exists** for a Sherwood official. **Use geo_id `4167100` (CORRECTED), NOT the ROADMAP/CONTEXT-stated `4167450`.** Browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4167100&browse_mtfcc=G4110`.

---

### `src/lib/buildingImages.js` (config edit — add Sherwood to CURATED_LOCAL)

**Analog:** `src/lib/buildingImages.js` lines 102-118 (current live CURATED_LOCAL block + attribution comments, already includes Forest Grove/Tigard/Tualatin — the freshest same-milestone template)

**Current state** (verified live):
```js
// Curated standalone-city banner art (cities/<slug>.jpg in Storage, D-05) +
// LA-county skylines (la_county/building_photos/<geoid>.jpg). Attribution
// (Wikimedia Commons) - title | author | license:
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
//   forest grove - Christmas Tree Recycling (Pacific Avenue street view, lower band) | Visitor7 | CC BY-SA 3.0
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  tigard: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg',
  tualatin: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tualatin.jpg',
  'forest grove': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/forest-grove.jpg',
  ...
```

**Required edit — add attribution comment + `sherwood` key** (single-word key — no space-vs-hyphen trap like Forest Grove's two-word key; verify exact license at execution per RESEARCH's two candidates below):
```js
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
//   forest grove - Christmas Tree Recycling (Pacific Avenue street view, lower band) | Visitor7 | CC BY-SA 3.0
//   sherwood - Railroad St, Sherwood, Oregon | dreid1987 | CC BY 3.0
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  tigard: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg',
  tualatin: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tualatin.jpg',
  'forest grove': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/forest-grove.jpg',
  sherwood: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/sherwood.jpg',
  ...
```
The key `sherwood` (lowercase) matches how `getBuildingImages()` substring-matches against `offices.representing_city` (lowercased) — see match loop: `if (city.includes(key)) { localImage = src; break; }`. This is why `representing_city='Sherwood'` MUST be set inline on the structural migration — without it, the banner falls back to the tier gradient.

**Banner candidates (RESEARCH-identified, both CC BY 3.0, both by photographer "dreid1987", both need a substantial 4:3→3.15:1 vertical crop):**
- **Primary:** `File:Railroad St - panoramio.jpg` — vibrant Old Town/downtown commercial street, exact match to D-14's hint. Try `--vertical-anchor` in the 0.4-0.55 range.
- **Alternate (if the crop trims too much storefront context):** `File:Downtown - panoramio - dreid1987.jpg` — quieter historic-cottage street scene, buildings sit lower in frame.
- **Rejected (D-14 failure modes, do not reconsider):** `Sherwood DJIMini 1/2.jpg` (aerial), `Library - panoramio.jpg` (single-building close-up), `Looking down Sunset Blvd.jpg` (generic suburban overlook), `Old mill - panoramio.jpg` (no mill actually in frame), `DSCN6746 sherwoodcoffeecompany e.jpg` (565x373, too low-res).

**Banner pipeline invocation (no new file — use existing committed scripts):**
```bash
python scripts/banners/process_banner.py \
  --input <raw_source_photo> \
  --output <processed_1700x540.jpg> \
  --vertical-anchor 0.45 \
  # crops/resizes to 1700x540 @ 3.15:1 per docs/banner-asset-pipeline.md

python scripts/banners/upload_banner.py \
  --file <processed_1700x540.jpg> \
  --path cities/sherwood.jpg
  # uploads to Supabase Storage politician_photos/cities/sherwood.jpg, prints CDN URL
```
Follow `docs/banner-asset-pipeline.md` Stages 1-8 exactly. No AI-generated images; no baked-in text/graphics.

---

## Shared Patterns

### OR State/Casing Rules (apply to structural migration)
**Source:** `migrations/1178_forest_grove_city_council.sql` lines 6-42 (comment block), re-verified live by RESEARCH.

| Context | Casing | Why |
|---|---|---|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder/routing query |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `politicians.party` | `NULL` | Antipartisan — never set |

### Idempotency Guards (apply to structural migration)
**Source:** `migrations/1178_forest_grove_city_council.sql` throughout.
- `governments`: `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no unique constraint on geo_id.
- `chambers`: `WHERE NOT EXISTS` on `(name, government_id)`.
- `districts`: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`.
- `offices`: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)`.
- `politicians`: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`.

### Slug Never Inserted (apply to structural migration)
**Source:** `migrations/1178` chambers INSERT (omits slug column entirely).
`essentials.chambers` has `slug` as a GENERATED ALWAYS column. Never include `slug` in the INSERT column list.

### photo_origin_url Does Not Exist (apply to headshot migration)
**Source:** `migrations/1179_forest_grove_headshots.sql` — `politician_images` INSERTs use only `(id, politician_id, url, type, photo_license)`. Never include `photo_origin_url`.

### Stance Value Model + Two-Statement Answers/Context Parity (apply to 7 stance migrations)
**Source:** `migrations/1180_wenzl_stances.sql` entire file.
Values are chairs (integer 1-5), not polarity. Omit the entire row for a topic with no evidence — never default. `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true`. Both `politician_answers` and `politician_context` get the same `ON CONFLICT (politician_id, topic_id) DO UPDATE`. Skip all 8 `judicial-*` topics. Append the WR-01 identity gate (UUID must belong to the intended external_id) and the WR-03 context-parity gate (answers count must equal context count) after both INSERTs.

### Zero-Appointed-Seats Politician Pattern (apply to all 7 office blocks — Forest Grove/Tualatin shape, NOT Tigard's)
**Source:** `migrations/1178_forest_grove_city_council.sql` (all 7 blocks use uniform `is_appointed=false` / `is_appointed_position=false`).
Sherwood, like Forest Grove and Tualatin, has zero currently-appointed seats — every office block uses the uniform `false,false` shape. Do NOT import Tigard's appointed-seat pattern (mig 1159's Hu/Anderson blocks with `true,true`) — RESEARCH confirms all 7 Sherwood seats are presently held by election.

### Headshot Pipeline Order + Square-Source Crop Nuance (apply to headshot script)
**Source:** `scripts/_tmp-forest-grove-headshots.py` (crop_to_4_5/resize_600x750 functions).
CROP to 4:5 ratio FIRST, then RESIZE to 600x750 Lanczos SECOND. Never call resize before crop. **New for Sherwood:** all 7 source images are square (600x600), so the crop step must trim WIDTH (600→480px centered on the face) rather than the more typical height-trim — verify this branch of `crop_to_4_5()` before running the full manifest. Do hard-assert `len(OFFICIALS) == 7` here (unlike Tigard) — RESEARCH confirms 7/7 direct sourcing with no genuine gap expected.

### D-15 WR-A (Note-Text Sync), WR-B (Pairwise Identity Gate), WR-C (Empty-Roster Guard) — apply across all three artifact types
**Source:** `.planning/phases/180-city-of-forest-grove-deep-seed/` code-review report + live file `migrations/1179_forest_grove_headshots.sql` (WR-A defect confirmed still present — note says "currently 0" while the applied gate reads `IF n <> 7`) + live file `scripts/_tmp-forest-grove-headshots.py` line 455 (WR-C defect confirmed — `test_download_guard(OFFICIALS[0])` has no length guard).
- **WR-A:** when writing 1188's ORCHESTRATOR NOTE, whatever the note claims the gate's current/default expected-count is must literally match the gate's code at that same commit — do not let them diverge as they did in 1179.
- **WR-B:** the structural migration's identity gate must be a pairwise `(external_id, full_name) IN (...)` assertion, not two independent `IN` lists (see full block above in the 1187 pattern assignment).
- **WR-C:** `_tmp-sherwood-headshots.py`'s `main()` must guard `if len(OFFICIALS) > 0:` before calling `test_download_guard(OFFICIALS[0])`.
- WR-01 (`sys.exit(1)` on any headshot upload failure) and WR-02 (stance-migration row-count assertion) are already shipped in the 180 templates being cloned — no additional action needed beyond copying them forward.

### representing_city Drives Banner Derivation (apply to structural migration)
**Source:** `migrations/1178_forest_grove_city_council.sql` (D-11 inline pattern) + `buildingImages.js` `getBuildingImages()` match loop.
The frontend Local-section banner derives its city key from `offices.representing_city` (lowercased substring match against `CURATED_LOCAL` keys). **Sherwood's structural migration must set `representing_city='Sherwood'` inline on every one of the 7 office INSERTs** — no separate backfill migration.

### Plain Title Convention, No Ward/Position Differentiation (apply to structural migration)
**Source:** `migrations/1178_forest_grove_city_council.sql` (titles are simply `'Mayor'` / `'Councilor'`) — same class as Tigard's mig 1159.
Sherwood's city text, its candidates' own SEL101 filings, and the Dec-2024 org chart contain no ward or numbered-position language anywhere — office titles are plain `'Mayor'` and `'Councilor'` for all 7 seats. Do not import Beaverton's numbered-position or Hillsboro's ward+position title strings.

---

## No Analog Found

All 7 classified files/edits have direct, strong analogs in the codebase (6 from the immediately-preceding Phase 180 Forest Grove deep-seed, same milestone and same structural shape class; live-file re-reads of `coverage.js`/`buildingImages.js` confirm the current state already includes Forest Grove/Tigard/Tualatin). No file requires falling back to RESEARCH.md-only patterns.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1178, 1179, 1180); `C:/EV-Accounts/backend/scripts/` (`_tmp-forest-grove-headshots.py`, confirmed present on disk despite gitignore); `src/lib/coverage.js`; `src/lib/buildingImages.js`; `.planning/phases/178-city-of-tigard-deep-seed/178-PATTERNS.md` (prior pattern map, cross-referenced for the plain-title/no-appointed-seat lineage); on-disk migration directory listing confirming MAX=1186.
**Files scanned:** 3 source files read in full (migrations 1178, 1179, 1180), 2 live config files (coverage.js, buildingImages.js), 1 headshot script read in targeted sections (docstring + guard functions), 1 prior PATTERNS.md, 1 directory listing (backend/migrations + backend/scripts for Forest Grove inventory).
**Pattern extraction date:** 2026-07-03

### Key Casing / Structural Traps (planner must call out in plan actions)

1. **geo_id is CORRECTED `4167100`** — the ROADMAP/CONTEXT-stated `4167450` returns 0 rows (does not exist at all, a different and more severe failure mode than Hillsboro/Tualatin's wrong-but-existing-value corrections). Wave-0 must still re-verify per standard practice.
2. `districts.state` = `'or'` lowercase — wrong case silently excludes all city officials from routing.
3. `chambers` INSERT must omit `slug` column — GENERATED ALWAYS.
4. `politician_images` INSERT must omit `photo_origin_url` — column does not exist.
5. `governments` has no unique constraint on `geo_id` — always use `WHERE NOT EXISTS` on name.
6. **Do NOT build ward or numbered-position geofences/titles** — RESEARCH confirms pure at-large via three independent primary sources (city text, SEL101 filings, org chart); office titles are plain `'Mayor'` / `'Councilor'`.
7. **All 7 seats are ELECTED, zero appointed** — use the uniform Forest Grove/Tualatin `false,false` shape, NOT Tigard's appointed-seat block.
8. **Mayor's term is 2 years, not 4** — a new wrinkle this milestone; does not change the LOCAL_EXEC+LOCAL structural shape, only the migration comment/label text.
9. Kim Young's "Council President" is a title-on-seat, one office row — no second row. Keith Mays is a FORMER Mayor/Council President, now a PLAIN Councilor — do not misattribute either title to him.
10. **Set `representing_city='Sherwood'` INLINE in the structural migration** — no backfill migration.
11. Apply D-15's WR-B pairwise `(external_id, full_name)` identity gate in the structural migration's post-verify block (upgrade from Forest Grove/Tigard's set-membership `IN` pattern).
12. Apply D-15's WR-A fix in the headshot migration: keep the ORCHESTRATOR NOTE's stated gate-default in sync with the gate's actual code (confirmed still-drifted in the live 1179 file — do not repeat).
13. Apply D-15's WR-C fix in the headshot script: guard `len(OFFICIALS) > 0` before `test_download_guard(OFFICIALS[0])` (confirmed missing in the live `_tmp-forest-grove-headshots.py` line 455 — do not repeat).
14. **Headshot sourcing is a genuine positive outlier** — all 7 confirmed direct-download from sherwoodoregon.gov, no D-16 fallback chain needed, expect 7/7. New pipeline nuance: sources are square (600x600) — verify the crop step's width-trim branch, not the usual height-trim.
15. Skip all 8 `judicial-*` compass topics — City Attorney + Municipal Court Judge confirmed council-appointed via Sherwood's own Dec-2024 org chart (stronger than a cross-city assumption).
16. Stance migrations are NOT registered in `schema_migrations` — disk file counter is authoritative; re-run `ls C:/EV-Accounts/backend/migrations | sort` at Wave-0 regardless (confirmed MAX=1186 this session → next 1187).
17. pamplinmedia.com TLS-fails for ALL fetchers (D-16 applies) — recover via search-index extraction, cite the original article URL; valleytimes.news/beavertonvalleytimes.com are directly WebFetch-able.
18. Banner: two strong Wikimedia candidates already identified and vetted against D-14's street-level/skyline hint (Railroad St primary, Downtown alternate) — both CC BY 3.0 by "dreid1987", both need a substantial 4:3→3.15:1 vertical crop; single-word `sherwood` CURATED_LOCAL key, no space/hyphen trap.
