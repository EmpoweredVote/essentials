# Phase 179: City of Tualatin Deep-Seed - Pattern Map

**Mapped:** 2026-07-02
**Files analyzed:** 10 (1 structural migration, 1 headshot migration, 7 stance migrations, 1 headshot script, 1 coverage.js edit, 1 buildingImages.js edit)
**Analogs found:** 10 / 10

**geo_id note:** Use the RESEARCH-corrected value **`4174950`** everywhere (structural migration, coverage.js, browse link). The CONTEXT.md/ROADMAP value `4175200` does not exist in `essentials.geofence_boundaries` — do not use it anywhere, including in migration comments.

**On-disk migration MAX independently re-confirmed by this pattern-mapping pass:** `ls C:/EV-Accounts/backend/migrations | grep -E '^[0-9]+_' | sort -t_ -k1 -n | tail` → highest is still `1168_nc_general_field_reconciliation.sql`. **Next migration = 1169**, matching RESEARCH. No intervening migration landed since RESEARCH was written. Wave-0 should still re-run this at execution time regardless.

**Key structural fact — this phase is closer to Beaverton (176) than to Tigard (178):** Tualatin has numbered Council Positions 1-6 (like Beaverton) and **zero currently-appointed seats** (like Hillsboro, unlike Tigard's 2 appointees). Use Beaverton mig 1131 for the **title convention and per-seat shape** (`'Council Member (Position N)'`, uniform `is_appointed=false`), but use Tigard mig 1159/1160/1161 for the **verification-gate fixes** (WR-01 independent geofence assertion, WR-02 stance count-assert, WR-03 context-parity assert, identity gate, inline `representing_city`) since Beaverton's original migration predates all of those fixes and does not have a `representing_city` column on its office INSERTs at all.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/migrations/1169_tualatin_city_council.sql` | migration | CRUD | `migrations/1131_beaverton_city_council.sql` (title/shape) + `migrations/1159_tigard_city_council.sql` (verification-gate fixes) | exact (shape) / needs-fix-overlay (gates) |
| `C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql` | migration | CRUD | `migrations/1160_tigard_headshots.sql` (entire file, 128 lines — freshest WR-02 identity/url-embed gate) | exact |
| `C:/EV-Accounts/backend/migrations/1171..1177_<official>_stances.sql` (7 files) | migration | CRUD | `migrations/1161_hu_stances.sql` (entire file, 62 lines — freshest WR-01 identity gate + WR-02 count-assert + WR-03 context-parity gate) | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py` | utility | file-I/O | `scripts/_tmp-tigard-headshots.py` (entire file, 474 lines) for pipeline mechanics; `scripts/_tmp-hillsboro-headshots.py`'s hard `assert len(OFFICIALS) == 7` for the roster-completeness assertion (Tualatin has no genuine-gap risk, unlike Tigard) | exact (mechanics) / role-match (assert strictness) |
| `src/lib/coverage.js` (edit — Oregon block) | config | transform | `src/lib/coverage.js` lines 96-108 (current live Oregon block, already includes Tigard) | exact |
| `src/lib/buildingImages.js` (edit — CURATED_LOCAL) | config | transform | `src/lib/buildingImages.js` lines 107-114 (current live CURATED_LOCAL block, already includes Tigard) | exact |
| `docs/banner-asset-pipeline.md`-driven banner scripts (no new file — invoke existing) | utility | file-I/O | `scripts/banners/process_banner.py` + `upload_banner.py` (already committed, no edit needed) | exact |

**No `representing_city` backfill migration needed** — set `representing_city='Tualatin'` INLINE on every office INSERT in the structural migration (Hillsboro/Tigard D-11 convention, carried forward).

---

## Pattern Assignments

### `1169_tualatin_city_council.sql` (structural migration, CRUD)

**Primary analog (title/shape/no-appointed-seats):** `C:/EV-Accounts/backend/migrations/1131_beaverton_city_council.sql` (entire file, 386 lines — directly-elected Mayor + 6 numbered at-large positions, zero appointed seats, the exact structural twin of Tualatin)
**Secondary analog (verification-gate fixes to overlay):** `C:/EV-Accounts/backend/migrations/1159_tigard_city_council.sql` (post-verify DO block, inline `representing_city`)

**Pre-flight hard-abort guard** (mig 1131 lines 25-31 — copy verbatim, adapt name):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Tualatin, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1169 already applied — aborting re-run';
  END IF;
END $$;
```

**Government row** (mig 1131 lines 39-47, adapt geo_id to the CORRECTED `4174950`):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Tualatin, Oregon, US',
       'LOCAL', 'OR', 'Tualatin', '4174950'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Tualatin, Oregon, US'
);
```

**Chamber row** (mig 1131 lines 49-61 — slug is GENERATED ALWAYS, never insert it; `official_count=7`):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Tualatin City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Tualatin, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Tualatin, Oregon, US')
);
```

**LOCAL_EXEC district — Mayor citywide** (mig 1131 lines 63-69, `state='or'` LOWERCASE):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4174950', 'Tualatin (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4174950' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

**LOCAL at-large district — all 6 Council Positions share ONE row** (mig 1131 lines 71-77 — DO NOT create per-position districts; RESEARCH confirms zero ward/geography differentiation, positions are numbered labels only, not districts):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4174950', 'Tualatin (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4174950' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Mayor office block — Frank Bubenik, directly elected** (mig 1131 lines 79-109 — Beaverton's Mayor block is the exact shape; add `representing_city` per the Tigard D-11 improvement, which Beaverton's original 1131 lacks):
```sql
-- Mayor Frank Bubenik (-4174951) — directly elected citywide, term through Dec 31, 2026
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Frank Bubenik', 'Frank', 'Bubenik', NULL,
          true, false, false, true, -4174951)
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
                               WHERE name = 'City of Tualatin, Oregon, US')),
       p.id,
       'Mayor', 'OR', 'Tualatin', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4174950'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Note the column-list difference from Beaverton's original 1131:** add `representing_city` to both the INSERT column list and the SELECT value list (`'Tualatin'`) — Beaverton's 1131 predates the D-09/D-11 inline-`representing_city` convention and needed a separate backfill migration (1141) that Hillsboro/Tigard eliminated. Do not repeat Beaverton's gap.

**Council Member office block, elected numbered position (repeat 6×)** (mig 1131 lines 111-141 exact shape — title is `'Council Member (Position N)'`, all 6 use uniform `false,false` for appointed flags):
```sql
-- Council Member Position 1 María (Antonieta) Reyes (-4174952) — elected, term through Dec 31, 2026
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'María Reyes', 'María', 'Reyes', NULL,
          true, false, false, true, -4174952)
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
                               WHERE name = 'City of Tualatin, Oregon, US')),
       p.id,
       'Council Member (Position 1)', 'OR', 'Tualatin', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4174950'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Repeat 5 more times** for Positions 2-6 (Sacco -4174953, Brooks -4174954, Hillier -4174955, Gonzalez -4174956, Pratt -4174957) — identical shape, only name/first_name/last_name/external_id/title-position-number change. **All 6 use `is_appointed=false, is_appointed_position=false`** — this is the Hillsboro/Beaverton uniform shape, NOT Tigard's mixed shape (do not import Tigard's `is_appointed=true` block for any Tualatin seat).

**Valerie Pratt (Council President, Position 6) — title-on-seat, one office row only** (same comment-pattern precedent as Beaverton's Kimmi / Tigard's Wolf / Hillsboro's Harris, mig 1131 lines 175-177):
```sql
-- Council Member Position 6 Valerie Pratt (-4174957) — holds the annually-elected
-- Council President title. Originally APPOINTED Aug 2019 to fill a vacancy, but her
-- CURRENT term (Jan 2025-Dec 2028) is by ELECTION (elected 2020, reelected 2024) —
-- is_appointed=false is correct for her present seating. Council President is a title
-- on her seat, NOT a separate office row. ONE office row only.
```
Same office-block shape as the elected Position example above, external_id -4174957, title `'Council Member (Position 6)'`.

**office_id back-fill** (mig 1131 lines 309-316 — explicit IN list, idempotent, adapt to Tualatin's 7 ext_ids):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4174951,-4174952,-4174953,-4174954,-4174955,-4174956,-4174957
  )
  AND p.office_id IS NULL;
```

**Post-verification DO block — use Tigard 1159's fixed version, NOT Beaverton 1131's original** (Beaverton's post-verify gate uses a dead same-transaction geofence-absence check per RESEARCH's WR-01; Tigard's is the corrected, independent-query version):
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
  WHERE name = 'City of Tualatin, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Tualatin gov_count=%, expected 1', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4174950' AND d.district_type IN ('LOCAL','LOCAL_EXEC') AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Tualatin office_count=%, expected 7', v_office_count;
  END IF;

  -- WR-01 FIX: independent geofence-presence assertion (not a same-transaction dead gate).
  -- This is the exact check that would have caught the 4175200 error immediately.
  SELECT COUNT(*) INTO v_geofence_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '4174950' AND mtfcc = 'G4110';
  IF v_geofence_count < 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: no G4110 geofence row found for geo_id 4174950';
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM (
    SELECT o.district_id
    FROM essentials.offices o
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE d.geo_id = '4174950'
    GROUP BY o.district_id
    HAVING COUNT(DISTINCT o.chamber_id) > 1
  ) x;
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % rows', v_split_count;
  END IF;

  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id IN (-4174951,-4174952,-4174953,-4174954,-4174955,-4174956,-4174957)
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id after back-fill', v_null_count;
  END IF;

  SELECT COUNT(*) INTO v_repcity_count
  FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id BETWEEN -4174957 AND -4174951
    AND o.representing_city = 'Tualatin';
  IF v_repcity_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % of 7 Tualatin offices have representing_city=Tualatin', v_repcity_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: Tualatin gov=1, offices=7, geofence>=1, section-split=0, office_id nulls=0, representing_city=7';
END $$;
```

**Ledger entry** (mig 1131/1159 identical closing pattern):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1169')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `1170_tualatin_headshots.sql` (audit-only headshot migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql` (entire file, 128 lines — freshest WR-02 url-embeds-uuid identity gate; use this over the older 1151 Hillsboro version)

**File header pattern** (mig 1160 lines 1-19 — adapt source note; Tualatin's sourcing is actually SIMPLER/cleaner than Tigard's, all 7 confirmed from one primary-source domain, no fallback chain needed):
```sql
-- Migration 1170: City of Tualatin City Council Headshots — AUDIT-ONLY (not registered in the ledger)
--
-- Records the essentials.politician_images rows for the Tualatin officials whose 600x750
-- portraits were uploaded to Supabase Storage (politician_photos/{uuid}-headshot.jpg) by
-- _tmp-tualatin-headshots.py. One INSERT per official, guarded by WHERE NOT EXISTS on
-- politician_id (idempotent). type='default'. photo_license='press_use' (all 7 sourced
-- directly from tualatinoregon.gov/app/uploads/ — official city-hosted portraits, no
-- fallback chain needed, the cleanest headshot sourcing situation in the milestone).
--
-- ORCHESTRATOR NOTE: politician UUIDs below are the ones already minted by structural
-- migration 1169 — the {uuid} segment of each url is pre-filled from that table, NOT from
-- the pipeline manifest (the pipeline resolves the same UUIDs at runtime by external_id and
-- uploads to the identical path). Expect 7/7 success given confirmed direct-source
-- retrievability (contrast Tigard's genuine-gap risk) — if any block is missing, treat it as
-- a regression to investigate, not an expected outcome.
--
-- AUDIT-ONLY: this migration intentionally does NOT write a ledger row.

BEGIN;
```

**Per-official INSERT pattern** (mig 1160 lines 23-33 — repeat 7×, one per official; columns exactly `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url`):
```sql
-- Frank Bubenik (Mayor, -4174951) — tualatinoregon.gov (Home_Mayor.jpg)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4174951),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4174951)
);
```

**Post-verification gate (WR-02, from mig 1160 lines 107-125 — url-embeds-uuid identity check, adapt expected count to 7 with no "lower the expected count" caveat since no gaps are expected):**
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -4174957 AND -4174951
    AND pi.url LIKE '%' || pi.politician_id::text || '%';
  IF n <> 7 THEN
    RAISE EXCEPTION 'Expected 7 Tualatin politician_images rows with url embedding the politician uuid, found %', n;
  END IF;
END $$;

COMMIT;
```

---

### `1171_bubenik_stances.sql` through `1177_pratt_stances.sql` (7 stance migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1161_hu_stances.sql` (entire file, 62 lines — freshest template: identity gate + WR-02 count-assert + WR-03 context-parity assert; use this over the older 1152 Pace version referenced in 178-PATTERNS since 1161 is one generation more evolved)

**File header pattern** (mig 1161 lines 1-3):
```sql
-- Migration 1171: Frank Bubenik (Mayor, Tualatin OR) compass stances — AUDIT-ONLY (not registered in the ledger)
-- Evidence-only; 100% cited; chairs model (value 1-5); N cited stances; blank spokes omitted.
-- topic_id resolved LIVE via JOIN on compass_topics.topic_key AND is_live=true (no hardcoded topic UUIDs).
```

**Core stance CTE pattern — two-statement structure** (mig 1161 lines 5-35, entire operative body — copy shape, replace VALUES rows and the hardcoded politician UUID; the politician UUID is looked up from `essentials.politicians` by external_id AFTER migration 1169 is applied):
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
```

**Triple-gate DO block (WR-01 identity + WR-02 count + WR-03 context-parity — from mig 1161 lines 37-59, the freshest, most complete version — apply verbatim to all 7 stance files):**
```sql
DO $$
DECLARE n INTEGER;
        v_ext BIGINT;
BEGIN
  -- Identity gate (WR-01): the hardcoded politician UUID must belong to the
  -- intended official's external_id — a wrong-but-existing UUID would satisfy
  -- the FK and the count gate below while silently misattributing stances.
  SELECT external_id INTO v_ext FROM essentials.politicians WHERE id = '<politician_uuid>';
  IF v_ext IS DISTINCT FROM <expected_ext_id> THEN
    RAISE EXCEPTION 'UUID <politician_uuid> does not belong to external_id <expected_ext_id> (<name>) — found %', v_ext;
  END IF;
  SELECT COUNT(*) INTO n FROM inform.politician_answers WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % answers, found % — topic_key mismatch dropped rows', <expected_count>, n;
  END IF;
  -- Context-parity gate (WR-03): the context VALUES list is a verbatim
  -- duplicate of the answers list; count it too so a single-sided edit
  -- cannot silently drop or skew reasoning/sources rows.
  SELECT COUNT(*) INTO n FROM inform.politician_context WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % context rows, found % — answers/context VALUES lists diverged', <expected_count>, n;
  END IF;
END $$;

COMMIT;
```

**Critical rules from analog:**
- `politician_id` UUID is the one minted by structural migration 1169 — look it up by `external_id` after applying it, then hardcode it in each stance file.
- `val` is integer 1-5 (chairs model, NOT polarity) — blank spoke = omit the topic row entirely, never default.
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true` — never hardcode a topic UUID.
- Skip all 8 `judicial-*` topics (City Attorney/Municipal Court Judge are appointed, confirmed by RESEARCH).
- One migration file per official — 7 files total (Bubenik, Reyes, Sacco, Brooks, Hillier, Gonzalez, Pratt).
- One agent at a time for stance research (memory: feedback_stance_research_one_at_a_time).
- `local-immigration` and similar thin-evidence topics: an honest blank spoke is acceptable and expected if no Tualatin-specific record is found — same as prior WashCo cities.

---

### `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py` (utility, file-I/O)

**Primary analog (pipeline mechanics — functions, config, upload):** `C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py` (entire file, 474 lines)
**Secondary analog (strictness of the roster-completeness assert):** Hillsboro's headshot script pattern (`_tmp-hillsboro-headshots.py`) — hard `assert len(OFFICIALS) == 7`, appropriate here because RESEARCH confirms zero genuine gaps (unlike Tigard's soft assert, which was correct for Tigard's thinner sourcing)

**Module docstring pattern** (adapt from Tigard's structure — the SOURCE NOTE should reflect Tualatin's much cleaner situation: single primary-source domain, no WAF, no fallback chain needed):
```python
"""
_tmp-tualatin-headshots.py
Download, crop, resize, and upload headshots for 7 City of Tualatin
City Council members (Mayor + 6 numbered Council Positions) to Supabase
Storage bucket 'politician_photos'.

Phase 179 — WASH-05 (headshot portion).

ORCHESTRATION NOTE:
  Running this script and uploading to Supabase Storage is the INLINE-ORCHESTRATOR
  step, NOT the executor's. The executor only WRITES this file to disk. The
  orchestrator runs it (PIL/requests/psycopg2 + Storage live only in the
  orchestrator shell), then applies the audit headshot migration 1170 after the
  pipeline emits its manifest. This is a gitignored _tmp-* helper — do NOT commit it.

SOURCE NOTE:
  Unlike Beaverton/Hillsboro/Tigard (all Akamai WAF-403 on their primary domain),
  tualatinoregon.gov has NO WAF block and serves all 7 headshots directly from
  its own WordPress media uploads (app/uploads/2025/09/...). All 7 URLs were
  spot-verified retrievable in RESEARCH — no fallback sourcing chain is needed
  for any of the 7. UNLIKE Tigard's soft partial-outcome tolerance, this script
  DOES hard-assert len(OFFICIALS) == 7 (Hillsboro-style) since a genuine gap
  here would indicate a real regression (e.g. the site's ongoing redesign moved
  a path), not an expected sourcing limitation.

Processing pipeline (per feedback_headshot_resize_no_distort.md, crop-first):
  1. Resolve politician UUID at RUNTIME by external_id (psycopg2 from DATABASE_URL).
     UUIDs are minted by the structural migration 1169 — NEVER hardcode a UUID.
  2. Download the portrait from tualatinoregon.gov/app/uploads/2025/09/... — spot-check
     2-3 of the 7 URLs fresh at Wave-0 per RESEARCH Open Question 3 (site is mid-redesign).
  3. Composite onto white if the source carries transparency (PNG/RGBA).
  4. CROP to 4:5 ratio FIRST — never stretch. Mayor's source (1250x1330) crops by
     trimming width to 1064px; the 6 councilor sources (484x484 square) crop by
     trimming width to 387px, then upscale ~1.55x to 600x750 (modest, acceptable).
  5. RESIZE to 600x750 Lanczos q90 (re-encode strips EXIF/stego).
  6. Upload to politician_photos/{uuid}-headshot.jpg via PUT with x-upsert: true.
  7. Reject any image with superimposed text/graphics over the face.
  8. D-16 fallback chain (Ballotpedia/Wikimedia/local-news) NOT NEEDED for this
     phase per RESEARCH — 7/7 sourced cleanly from the primary official-site chain.

photo_license: 'press_use' for all 7 (official government-hosted portrait convention,
applied uniformly throughout this project even when not literally a press photo).

Bucket: politician_photos (NOT 'politician-headshots')
Path:   {politician_uuid}-headshot.jpg
"""
```

**OFFICIALS roster pattern** (Tigard's list-of-dicts shape, but populated directly from RESEARCH's confirmed URLs — no per-official search needed at execution unlike Tigard):
```python
OFFICIALS = [
    {
        'ext_id': -4174951,
        'name': 'Frank Bubenik',
        'url': 'https://tualatinoregon.gov/app/uploads/2025/09/Home_Mayor.jpg',
        'license': 'press_use',
        'fallback_url': None,
        # Mayor. 1250x1330 JPEG, 185,205 bytes, HTTP 200 confirmed in RESEARCH 2026-07-02.
    },
    {
        'ext_id': -4174952,
        'name': 'María Reyes',
        'url': 'https://tualatinoregon.gov/app/uploads/2025/09/Council_Maria-Reyes.jpg',
        'license': 'press_use',
        'fallback_url': None,
        # Council Member (Position 1). 484x484 JPEG, 40,434 bytes, HTTP 200 confirmed.
    },
    # ... 4 more entries through -4174956 Octavio Gonzalez, all 484x484 same upload batch ...
    {
        'ext_id': -4174957,
        'name': 'Valerie Pratt',
        'url': 'https://tualatinoregon.gov/app/uploads/2025/09/Council_Valerie-Pratt.jpg',
        'license': 'press_use',
        'fallback_url': None,
        # Council Member (Position 6, Council President — title-on-seat only). 484x484 JPEG,
        # 35,402 bytes, HTTP 200 confirmed.
    },
]

# Hillsboro-style HARD assert — appropriate here given RESEARCH's zero-genuine-gap finding,
# unlike Tigard's soft len-check (contrast with the Tigard analog's deliberately absent assert).
assert len(OFFICIALS) == 7, f'Expected 7 Tualatin officials, got {len(OFFICIALS)}'
assert len({m["ext_id"] for m in OFFICIALS}) == len(OFFICIALS), 'external_ids must be unique'
assert all(m['license'] for m in OFFICIALS), 'Every official must carry a license string'
```

**Config block, crop/resize functions (`crop_to_4_5`, `resize_600x750`, `process_headshot_bytes`), transparent-composite guard, `resolve_politician_id`, `download_image`, `upload_to_storage`, `process_member`, manifest output** — copy verbatim from `_tmp-tigard-headshots.py` lines 150-474, renaming only city-specific strings. The `CDN_BASE` derivation-from-`SUPABASE_URL` pattern (WR-05, lines 168-177) and the descriptive `User-Agent` header (lines 183-190) apply unchanged.

---

### `src/lib/coverage.js` (config edit — add Tualatin to Oregon block)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\coverage.js` lines 96-108 (current live Oregon block, already includes Tigard — the freshest same-milestone template)

**Current Oregon block** (verified live, lines 96-108):
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

**Required edit — insert Tualatin alphabetically between Troutdale and Wood Village ("Tr" < "Tu" < "Wo" — a DIFFERENT slot than Tigard's, which sits between Portland and Troutdale; do not place Tualatin next to Tigard):**
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
      { label: 'Tualatin',    browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true },
      { label: 'Wood Village',browseGovernmentList: ['4183950'], browseStateAbbrev: 'OR' },
    ],
  },
```
**`hasContext: true` is correct once ≥1 stance row exists** for a Tualatin official. Browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110`.

---

### `src/lib/buildingImages.js` (config edit — add Tualatin to CURATED_LOCAL)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\buildingImages.js` lines 107-114 (current live CURATED_LOCAL block, already includes Tigard — the freshest same-milestone template)

**Current state** (verified live, lines 107-114):
```js
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  tigard: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg',
  ...
```

**Required edit — add attribution comment + `tualatin` key** (D-15's exact hint, license directly confirmed by RESEARCH via Wikimedia API):
```js
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
const CURATED_LOCAL = {
  bloomington: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/bloomington.jpg',
  beaverton: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/beaverton.jpg',
  hillsboro: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/hillsboro.jpg',
  tigard: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tigard.jpg',
  tualatin: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tualatin.jpg',
  ...
```
The key `tualatin` (lowercase) matches `getBuildingImages()`'s substring-match loop against `offices.representing_city` (lowercased) — verified live at lines 197-207:
```js
export function getBuildingImages(representingCity, stateAbbrev) {
  const city = (representingCity || '').toLowerCase();
  let localImage = null;
  for (const [key, src] of Object.entries(CURATED_LOCAL)) {
    if (city.includes(key)) {
      localImage = src;
      break;
    }
  }
  ...
```
This is why `representing_city='Tualatin'` MUST be set inline on the structural migration — without it, the banner falls back to the tier gradient.

**Banner pipeline invocation (no new file — use existing committed scripts):**
```bash
python scripts/banners/process_banner.py \
  --input <raw_source_photo> \
  --output <processed_1700x540.jpg> \
  # crops/resizes to 1700x540 @ 3.15:1 per docs/banner-asset-pipeline.md

python scripts/banners/upload_banner.py \
  --file <processed_1700x540.jpg> \
  --path cities/tualatin.jpg
  # uploads to Supabase Storage politician_photos/cities/tualatin.jpg, prints CDN URL
```
Follow `docs/banner-asset-pipeline.md` Stages 1-8 exactly. Primary candidate per RESEARCH: `File:Tualatin Commons daytime.JPG` (Wikimedia Commons, 3655x2345, CC BY-SA 3.0, uploader `Aboutmovies`/M.O. Stevens — the same photographer credited on Tigard's banner) — view the actual image before finalizing (RESEARCH used metadata-only judgment). Alternates (license unconfirmed, verify before use): "Panorama of Tualatin River and Railway Bridge" and "Tualatin River at Browns Ferry Park Tualatin."

---

## Shared Patterns

### OR State/Casing Rules (apply to structural migration)
**Source:** `migrations/1131_beaverton_city_council.sql` lines 6-16 (comment block), `migrations/1159_tigard_city_council.sql`, re-verified live by RESEARCH against Beaverton/Portland/Hillsboro/Tigard.

| Context | Casing | Why |
|---|---|---|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder/routing query — wrong case silently excludes all city officials from routing |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `politicians.party` | `NULL` | Antipartisan — never set |

### Idempotency Guards (apply to structural migration)
**Source:** `migrations/1131_beaverton_city_council.sql` throughout, unchanged by Tigard.
- `governments`: `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no unique constraint on geo_id.
- `chambers`: `WHERE NOT EXISTS` on `(name, government_id)`.
- `districts`: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`.
- `offices`: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)`.
- `politicians`: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`.

### Slug Never Inserted (apply to structural migration)
**Source:** `migrations/1131` chambers INSERT (omits slug column entirely).
`essentials.chambers` has `slug` as a GENERATED ALWAYS column. Never include `slug` in the INSERT column list — migration will fail with a generated column error.

### photo_origin_url Does Not Exist (apply to headshot migration)
**Source:** `migrations/1160_tigard_headshots.sql` — `politician_images` INSERTs use only `(id, politician_id, url, type, photo_license)`. The `photo_origin_url` column does not exist. Never include it.

### Stance Value Model + Triple-Gate Verification (apply to 7 stance migrations)
**Source:** `migrations/1161_hu_stances.sql` entire file — the freshest, most complete gate set in the milestone (identity + count + context-parity).
Values are chairs (integer 1-5), not polarity. Omit the entire row for a topic with no evidence — do not default to Neutral. `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true`. Both `politician_answers` and `politician_context` tables get the same `ON CONFLICT (politician_id, topic_id) DO UPDATE`. Skip all 8 `judicial-*` topics. Append the **triple-gate** DO block (identity + count + context-parity) after every stance migration's INSERTs — this is one generation more evolved than the version documented in 178-PATTERNS.md (which only had identity+count for the WR-01/WR-02 fixes; WR-03 context-parity was added between Tigard's plan and this pattern-mapping pass, confirmed present in the live 1161 file).

### Uniform Non-Appointed-Seat Politician Pattern (apply to all 7 Tualatin office blocks)
**Source:** `migrations/1131_beaverton_city_council.sql` (all 7 officials use `is_appointed=false` / `is_appointed_position=false`) — contrast with Tigard's mixed pattern (`migrations/1159` + `migrations/1075` Kara Kelley precedent), which does NOT apply here.
RESEARCH confirms all 7 Tualatin seats are presently held by election (including Pratt, whose original 2019 seating was appointment but whose current Jan 2025-Dec 2028 term is by election). Use the uniform Hillsboro/Beaverton shape — do not import Tigard's appointed-seat block for any Tualatin official.

### Numbered Position Title Convention, No Ward Differentiation (apply to structural migration)
**Source:** `migrations/1131_beaverton_city_council.sql` lines 111-303 (all 6 Council Member blocks) — the exact title convention to reuse, NOT Tigard's plain `'Councilor'` (which was correct only for Tigard's charter, which lacks numbered positions).
Tualatin's own city-page text explicitly references "Position 1" through "Position 6" for all 6 councilors, elected at-large citywide with no residency/ward requirement of any kind (RESEARCH direct primary-source quote). Use `'Council Member (Position N)'` for the 6 LOCAL seats, `'Mayor'` for the LOCAL_EXEC seat — do not flatten to plain titles, and do not create per-position districts.

### Headshot Pipeline Order (apply to headshot script)
**Source:** `scripts/_tmp-tigard-headshots.py` `process_headshot_bytes` function (lines 287-311).
CROP to 4:5 ratio FIRST, then RESIZE to 600x750 Lanczos SECOND. Never call resize before crop. Composite transparent sources (PNG/RGBA) onto white background before RGB conversion. Unlike Tigard, DO hard-assert `len(OFFICIALS) == 7` here (Hillsboro-style) — RESEARCH found zero genuine gaps, and a missing entry at execution time indicates a real regression (e.g., a further site-redesign path change), not an expected sourcing limitation.

### representing_city Drives Banner Derivation (apply to structural migration)
**Source:** `migrations/1159_tigard_city_council.sql` (D-11 inline pattern) + `buildingImages.js` `getBuildingImages()` match loop (lines 197-207).
The frontend Local-section banner derives its city key from `offices.representing_city` (lowercased substring match against `CURATED_LOCAL` keys). **Tualatin's structural migration must set `representing_city='Tualatin'` inline on every one of the 7 office INSERTs** — no separate backfill migration should be needed or created. Beaverton's original 1131 lacks this column entirely and needed backfill migration 1141 — do not repeat that gap; follow Hillsboro/Tigard's improvement instead.

### geo_id Trust — Always Verify, Never Assume From the Phase Description
**Source:** RESEARCH.md geo_id Correction section; also documented in 178-PATTERNS.md metadata (Hillsboro precedent).
Two of five WashCo cities so far (Hillsboro `4133850`→`4134100`, Tualatin `4175200`→`4174950`) had a wrong stated geo_id in the phase description/ROADMAP/CONTEXT. Treat this as an expected-not-exceptional risk for the remaining cities (Forest Grove 180, Sherwood 181, Cornelius 182). Wave-0's very first probe must be `SELECT geo_id, mtfcc, name FROM essentials.geofence_boundaries WHERE geo_id='<stated_value>'` — a 0-row result on a city (not a genuinely new office/politician) means the ID is wrong, not that the geofence is missing; follow with a name-based search.

---

## No Analog Found

All 7 classified files/edits have direct, strong analogs in the codebase — 6 from the immediately-preceding Phase 178 Tigard deep-seed (verification-gate fixes) and Phase 176 Beaverton deep-seed (structural shape — the closer structural twin given numbered positions + zero appointed seats), same milestone. No file requires falling back to RESEARCH.md-only patterns.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1131 read in full, 1159/1160/1161 read in full — the freshest post-Tigard gate versions, more evolved than what 178-PATTERNS.md itself documented, notably the WR-03 context-parity gate and the identity gate in 1161); `C:/EV-Accounts/backend/scripts/` (`_tmp-tigard-headshots.py` read in full, `_tmp-hillsboro-headshots.py` cross-referenced via 178-PATTERNS for the hard-assert contrast); `C:\Transparent Motivations\essentials\src\lib\coverage.js` (live Oregon block + `COVERAGE_STATES` structure); `C:\Transparent Motivations\essentials\src\lib\buildingImages.js` (live `CURATED_LOCAL` block + `getBuildingImages()` match loop); `.planning/phases/178-city-of-tigard-deep-seed/178-PATTERNS.md` (prior pattern map, cross-referenced and partially superseded by this document's live-file re-reads which found gate improvements made since that document was written); on-disk migration directory listing (confirmed MAX still 1168, unchanged since RESEARCH).
**Files scanned:** 4 migrations read in full (1131 Beaverton structural, 1160 Tigard headshots, 1161 Hu stances), 1 headshot script read in full (`_tmp-tigard-headshots.py`, 474 lines), 2 live config files (coverage.js Oregon block, buildingImages.js CURATED_LOCAL + match loop), 1 prior PATTERNS.md (178), 2 directory listings (backend/migrations tail, backend/scripts for gitignored _tmp-* inventory).
**Pattern extraction date:** 2026-07-02

### Key Casing / Structural Traps (planner must call out in plan actions)

1. **geo_id is `4174950`, NOT `4175200`** — CONFIRMED by RESEARCH via live production DB query (0 rows for the stated value; exactly 1 G4110 match on a name search). Every reference — migration, coverage.js, browse link — must use the corrected value. Wave-0 must still re-verify.
2. `districts.state` = `'or'` lowercase — wrong case silently excludes all city officials from routing.
3. `chambers` INSERT must omit `slug` column — GENERATED ALWAYS, migration fails if included.
4. `politician_images` INSERT must omit `photo_origin_url` — column does not exist.
5. `governments` has no unique constraint on `geo_id` — always use `WHERE NOT EXISTS` on name.
6. **Use Beaverton's numbered `'Council Member (Position N)'` title convention, NOT Tigard's plain `'Councilor'`** — Tualatin's charter/site explicitly uses numbered Positions 1-6, confirmed by two independent primary-source city pages.
7. **All 7 officials use `is_appointed=false` + `is_appointed_position=false`** — uniform, Hillsboro/Beaverton shape. Do NOT import Tigard's appointed-seat block (Hu/Anderson) for any Tualatin seat — RESEARCH confirms zero currently-appointed seats.
8. **Do NOT seed any 2026-election candidate as an incumbent** — the city's 2026 election-filing page data (Gonzalez/Pratt as mayoral candidates, etc.) belongs to Phase 185, not this phase's seed of the currently-seated roster.
9. Valerie Pratt's "Council President" is a title-on-seat, one office row — no second row, and `is_appointed=false` despite her bio mentioning an original 2019 appointment (her CURRENT term is by election).
10. **Set `representing_city='Tualatin'` INLINE in the structural migration** — do not defer to a backfill migration (avoid repeating Beaverton's original 1131 gap).
11. Apply the Tigard-1159-derived post-verify block (WR-01 independent geofence assertion) — do NOT reuse Beaverton 1131's original dead same-transaction gate.
12. Apply the Tigard-1161-derived triple-gate DO block (identity + WR-02 count-assert + WR-03 context-parity) in each of the 7 stance migrations — this is more complete than what 178-PATTERNS.md itself documented; use the live 1161 file as the template, not the summary.
13. Headshot script is gitignored (`_tmp-*`) — executor writes it to `backend/scripts/`; orchestrator runs it (has DB access; executor does not). Unlike Tigard, hard-assert `len(OFFICIALS) == 7` (Hillsboro-style) — RESEARCH found zero genuine gaps.
14. Stance migrations are NOT registered in `schema_migrations` — disk file counter is authoritative. Re-confirmed at this pattern-mapping pass: on-disk MAX is still `1168` (unchanged since RESEARCH) → next is `1169`. Re-run `ls C:/EV-Accounts/backend/migrations | grep -E '^[0-9]+_' | sort -t_ -k1 -n | tail` at Wave-0 regardless.
15. tualatinoregon.gov has **NO WAF** — direct curl works, best sourcing situation of any WashCo city seeded so far. Do not reuse Tigard's fallback-heavy `fallback_url` search logic as a requirement — it's still available in the script mechanics, but every Tualatin `fallback_url` should be `None` per RESEARCH's confirmed-clean sourcing.
16. Insert Tualatin into `coverage.js`'s Oregon block between **Troutdale and Wood Village** (a different slot than Tigard's, which sits between Portland and Troutdale) — alphabetical by label, not by proximity to the other WashCo city just added.
