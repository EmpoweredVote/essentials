# Phase 180: City of Forest Grove Deep-Seed - Pattern Map

**Mapped:** 2026-07-03
**Files analyzed:** 12 (1 Wave-0 probe script, 1 structural migration, 1 headshot migration, 7 stance migrations, 1 headshot pipeline script, 1 coverage.js edit, 1 buildingImages.js edit)
**Analogs found:** 10 / 12 strong analogs; 2 files (headshot script's WR-01 exit fix, structural migration's WR-02 identity gate) require a **new pattern** not present verbatim in any prior migration — closest partial analogs identified and flagged below.

**Key structural fact:** Forest Grove is the closest possible hybrid of the two immediately-preceding sister cities — it combines **Tigard's plain-title convention** (`'Mayor'` / `'Councilor'`, no numbered positions, no wards) with **Tualatin's directly-elected-Mayor-plus-shared-at-large-council district shape** (NOT Tigard's appointed-Mayor shape). **Tualatin migration 1169 is therefore the stronger primary analog for the district/politician-appointment shape**, while **Tigard migration 1159 is the stronger primary analog for the title-string convention.** No appointed seats exist in Forest Grove's 7-member roster (all elected) — simpler than both siblings in this respect.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-wave0-probe.sql` | utility | request-response | `scripts/_tmp-tualatin-wave0-probe.sql` (entire file, 107 lines) | exact |
| `C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql` | migration | CRUD | `migrations/1169_tualatin_city_council.sql` (district/politician shape) + `migrations/1159_tigard_city_council.sql` (title-string convention) | exact (structure) / hybrid (two primary analogs, no single 100% match) |
| `C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql` | migration | CRUD | `migrations/1170_tualatin_headshots.sql` (entire file, 122 lines) | exact (structure) / thinner sourcing risk than Tualatin — see Headshot Sourcing note below |
| `C:/EV-Accounts/backend/migrations/1180..1186_<official>_stances.sql` (7 files) | migration | CRUD | `migrations/1171_bubenik_stances.sql` (entire file, 68 lines — includes the identity-gate + context-parity gate) | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py` | utility | file-I/O | `scripts/_tmp-tualatin-headshots.py` (entire file, ~470 lines) | role-match structure / **WR-01 fix has NO prior analog — see "No Analog Found"** |
| `src/lib/coverage.js` (edit — Oregon block) | config | transform | `src/lib/coverage.js` lines 96–109 (current live Oregon block, includes Tigard + Tualatin) | exact |
| `src/lib/buildingImages.js` (edit — CURATED_LOCAL) | config | transform | `src/lib/buildingImages.js` lines 103–128 (current live CURATED_LOCAL block + `getBuildingImages()` match loop, lines 199–223) | exact, but with a **new key-format trap** (two-word city name — see Shared Patterns) |
| `docs/banner-asset-pipeline.md`-driven banner scripts (no new file — invoke existing) | utility | file-I/O | `scripts/banners/process_banner.py` + `upload_banner.py` (already committed, no edit needed) | exact |

**No `representing_city` backfill migration needed** — set `representing_city='Forest Grove'` INLINE on every office INSERT in the structural migration (Hillsboro/Tigard/Tualatin D-11 convention).

---

## Pattern Assignments

### `1178_forest_grove_city_council.sql` (structural migration, CRUD)

**Primary analog (district/politician shape — directly-elected Mayor, no appointed seats):** `C:/EV-Accounts/backend/migrations/1169_tualatin_city_council.sql` (entire file, 442 lines)
**Secondary analog (title-string convention — plain `'Mayor'`/`'Councilor'`, no positions):** `C:/EV-Accounts/backend/migrations/1159_tigard_city_council.sql` lines 134–168 (Councilor block, plain title)

**Pre-flight hard-abort guard** (mig 1169 lines 45–51 — copy verbatim, adapt name):
```sql
BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'City of Forest Grove, Oregon, US') > 0 THEN
    RAISE EXCEPTION 'Migration 1178 already applied — aborting re-run';
  END IF;
END $$;
```

**Government row** (mig 1169 lines 60–67, adapt geo_id to 4126200 — CONFIRMED correct, no correction comment needed unlike Tualatin's):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Forest Grove, Oregon, US',
       'LOCAL', 'OR', 'Forest Grove', '4126200'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Forest Grove, Oregon, US'
);
```

**Chamber row** (mig 1169 lines 70–81 — slug is GENERATED ALWAYS, never insert it; `official_count=7`):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Forest Grove City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Forest Grove, Oregon, US'),
       7
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Forest Grove, Oregon, US')
);
```

**LOCAL_EXEC district — Mayor citywide** (mig 1169 lines 83–89, state='or' LOWERCASE):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4126200', 'Forest Grove (Mayor, Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4126200' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);
```

**LOCAL at-large district — all 6 councilors share ONE row** (mig 1169 lines 91–98 — DO NOT create per-seat or per-position districts; RESEARCH confirms zero position-number differentiation, unlike Tualatin's numbered Position labels):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4126200', 'Forest Grove (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4126200' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Mayor office block — Malynda Wenzl, ELECTED (not appointed — contrast with Tigard's Hu block, use Tualatin's Bubenik shape instead)** (mig 1169 lines 100–131, title from Tigard's plain convention):
```sql
-- Mayor Malynda Wenzl (-4126201) — elected to Council 2014, elected Mayor Nov 2022, term through Dec 31, 2026.
-- Not appointed: false/false (contrast with Tigard's Mayor Hu block — Forest Grove has zero appointed seats).
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Malynda Wenzl', 'Malynda', 'Wenzl', NULL,
          true, false, false, true, -4126201)
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
                               WHERE name = 'City of Forest Grove, Oregon, US')),
       p.id,
       'Mayor', 'OR', 'Forest Grove', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4126200'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Councilor office block, ELECTED seat — plain title, no position number** (structure from Tualatin mig 1169 lines 135–164, title simplified to Tigard's plain `'Councilor'` string — NOT Tualatin's `'Council Member (Position N)'` string):
```sql
-- Councilor Michael Marshall (-4126202) — elected Nov 2022, term through Dec 31, 2026.
-- Not appointed: false/false.
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michael Marshall', 'Michael', 'Marshall', NULL,
          true, false, false, true, -4126202)
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
                               WHERE name = 'City of Forest Grove, Oregon, US')),
       p.id,
       'Councilor', 'OR', 'Forest Grove', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4126200'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
**Repeat 4 more times** (Karen Martinez -4126203, Donna Gustafson -4126205, Angel Falconer -4126206, Brian Schimmel -4126207) with identical shape — only name/first_name/last_name/external_id change. Title stays plain `'Councilor'` for all — do NOT append a position number (confirmed absent from Forest Grove's own site text, unlike Tualatin).

**Council President Mariana Valenzuela (-4126204) — title-on-seat, same treatment as Tualatin's Pratt / Tigard's Wolf / Hillsboro's Harris** (comment pattern from mig 1169 lines 298–302):
```sql
-- Councilor Mariana Valenzuela (-4126204) — holds the annually-designated Council President
-- title (confirmed via the city's own stipend table: distinct $792/mo line for "Council
-- President" vs $667 for "Councilors"). Originally APPOINTED 2020 to fill a vacancy, but her
-- CURRENT term (elected Nov 2022, through Dec 31, 2026) is by ELECTION — is_appointed=false is
-- correct for her present seating (same treatment class as Tualatin's Pratt). Council President
-- is a title on her seat, NOT a separate office row. ONE office row only, title stays plain
-- 'Councilor'.
```
Same office-block shape as the elected-councilor example above, external_id -4126204, `is_appointed=false`/`is_appointed_position=false`.

**office_id back-fill** (mig 1169 lines 338–345 — explicit IN list, idempotent, adapt to Forest Grove's 7 ext_ids):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4126201,-4126202,-4126203,-4126204,-4126205,-4126206,-4126207
  )
  AND p.office_id IS NULL;
```

**Post-verification DO block** (mig 1169 lines 358–431 — WR-01 fix already present as precedent: independent geofence-presence assertion + canonical section-split query; **WR-02 fix is NEW for this phase** — add the in-file identity-gate assertion per D-14/RESEARCH's example):
```sql
DO $$
DECLARE
  v_gov_count      INTEGER;
  v_office_count   INTEGER;
  v_split_count    INTEGER;
  v_null_count     INTEGER;
  v_repcity_count  INTEGER;
  v_geofence_count INTEGER;
  v_name_count     INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Forest Grove, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Forest Grove gov_count=%, expected 1', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '4126200' AND d.district_type IN ('LOCAL','LOCAL_EXEC') AND d.state = 'or';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: Forest Grove office_count=%, expected 7', v_office_count;
  END IF;

  -- independent geofence-presence assertion (WR-01-style, inherited pattern — not the dead
  -- same-transaction gate)
  SELECT COUNT(*) INTO v_geofence_count
  FROM essentials.geofence_boundaries
  WHERE geo_id = '4126200' AND mtfcc = 'G4110';
  IF v_geofence_count < 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: no G4110 geofence row found for geo_id 4126200';
  END IF;

  -- canonical section-split query (GROUP BY / HAVING), independent of the INSERTs above
  SELECT COUNT(*) INTO v_split_count
  FROM (
    SELECT o.district_id
    FROM essentials.offices o
    JOIN essentials.districts d ON d.id = o.district_id
    WHERE d.geo_id = '4126200'
    GROUP BY o.district_id
    HAVING COUNT(DISTINCT o.chamber_id) > 1
  ) x;
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % rows', v_split_count;
  END IF;

  SELECT COUNT(*) INTO v_null_count
  FROM essentials.politicians
  WHERE external_id IN (-4126201,-4126202,-4126203,-4126204,-4126205,-4126206,-4126207)
    AND office_id IS NULL;
  IF v_null_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % politicians still have NULL office_id after back-fill', v_null_count;
  END IF;

  SELECT COUNT(*) INTO v_repcity_count
  FROM essentials.offices o
  JOIN essentials.politicians p ON p.id = o.politician_id
  WHERE p.external_id BETWEEN -4126207 AND -4126201
    AND o.representing_city = 'Forest Grove';
  IF v_repcity_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: % of 7 Forest Grove offices have representing_city=Forest Grove', v_repcity_count;
  END IF;

  -- WR-02 FIX (NEW for this phase, D-14): in-file identity gate — assert the seated
  -- names on the ext_id block match the researched roster, catching an ON CONFLICT
  -- DO UPDATE that silently re-attached a stale/wrong full_name to a colliding
  -- external_id on re-run, not just relying on the out-of-band Wave-0 Probe D.
  SELECT COUNT(*) INTO v_name_count
  FROM essentials.politicians
  WHERE external_id IN (-4126201,-4126202,-4126203,-4126204,-4126205,-4126206,-4126207)
    AND full_name IN ('Malynda Wenzl','Michael Marshall','Karen Martinez','Mariana Valenzuela',
                       'Donna Gustafson','Angel Falconer','Brian Schimmel');
  IF v_name_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: identity gate — expected 7 matching names, found %', v_name_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: Forest Grove gov=1, offices=7, geofence>=1, section-split=0, office_id nulls=0, representing_city=7, identity_gate=7';
END $$;
```

**Ledger entry** (mig 1169 lines 437–441):
```sql
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('1178')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### `1179_forest_grove_headshots.sql` (audit-only headshot migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql` (entire file, 122 lines) — structure identical; **content risk differs materially: Tualatin had zero genuine gaps (7/7 confirmed at RESEARCH time), Forest Grove has a confirmed genuine sourcing gap (0 headshot URLs curl-visible) pending the D-16 fallback chain / JS-capable fetch.**

**File header pattern** (mig 1170 lines 1–19 — adapt to reflect the D-16 chain and the thinner outcome possibility, closer to Tigard's header framing than Tualatin's "cleanest situation" framing):
```sql
-- Migration 1179: City of Forest Grove City Council Headshots — AUDIT-ONLY (not registered in the ledger)
--
-- Records the essentials.politician_images rows for the Forest Grove officials whose 600x750
-- portraits were uploaded to Supabase Storage (politician_photos/{uuid}-headshot.jpg) by
-- _tmp-forest-grove-headshots.py. One INSERT per official, guarded by WHERE NOT EXISTS on
-- politician_id (idempotent). type='default'. photo_license set per actual source (press_use
-- for official-site/local-news photography — verify per source, do not assume press_use for a
-- non-government host per D-09).
--
-- Source note: forestgrove-or.gov's Meet the Council / Staff Directory pages are NO-WAF for
-- text but the photo widget is JS/AJAX-loaded and not curl-visible — expect either a JS-capable
-- fetch success or a partial D-16 fallback-chain outcome (Ballotpedia/Wikimedia/local news). A
-- partial N/7 outcome is an honest, acceptable result per RESEARCH — do NOT fabricate a row for
-- any official with no usable photo found.
--
-- AUDIT-ONLY: this migration intentionally does NOT write a ledger row.

BEGIN;
```

**Per-official INSERT pattern** (mig 1170 lines 24–32 — repeat once per official that has a confirmed photo; omit entries with no source found):
```sql
-- Malynda Wenzl (Mayor, -4126201) — <actual source URL/site at execution>
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4126201),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4126201)
);
```
**Critical:** columns exactly `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url` (confirmed absent from schema). `COMMIT;` at end, no ledger INSERT (audit-only class).

**Post-verification gate** (mig 1170 lines 101–119 — adapt the expected count to the ACTUAL number sourced, not a hard 7; this is the key deviation from Tualatin's "no caveat" version, matching Tigard's honest-partial-outcome framing instead):
```sql
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n
  FROM essentials.politician_images pi
  JOIN essentials.politicians p ON p.id = pi.politician_id
  WHERE p.external_id BETWEEN -4126207 AND -4126201
    AND pi.url LIKE '%' || pi.politician_id::text || '%';
  IF n <> <ACTUAL_COUNT_SOURCED> THEN
    RAISE EXCEPTION 'Expected % Forest Grove politician_images rows with url embedding the politician uuid, found %', <ACTUAL_COUNT_SOURCED>, n;
  END IF;
END $$;
```

---

### `1180_wenzl_stances.sql` through `1186_schimmel_stances.sql` (7 stance migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1171_bubenik_stances.sql` (entire file, 68 lines) — this is the freshest same-shape analog and already includes BOTH the WR-02-style identity gate AND a context-parity count gate; use this file, not the older Tigard `pace_stances.sql`, as the primary template.

**File header pattern** (mig 1171 lines 1–3):
```sql
-- Migration 1180: Malynda Wenzl (Mayor, Forest Grove OR) compass stances — AUDIT-ONLY (not registered in the ledger)
-- Evidence-only; 100% cited; chairs model (value 1-5); N cited stances; blank spokes omitted.
-- topic_id resolved LIVE via JOIN on compass_topics.topic_key AND is_live=true (no hardcoded topic UUIDs).
```

**Core stance CTE pattern — two-statement structure** (mig 1171 lines 5–41, entire operative body — copy shape, replace VALUES rows and the hardcoded politician UUID):
```sql
BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('housing', 3, 'Evidence text with inline citations...', ARRAY['https://source1.url','https://source2.url']::text[])
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

**Identity gate + row-count + context-parity gate** (mig 1171 lines 43–65 — apply verbatim to all 7 files, this is the STRONGEST prior analog for exactly the identity-gate style D-14/WR-02 asks the structural migration to also adopt):
```sql
DO $$
DECLARE n INTEGER;
        v_ext BIGINT;
BEGIN
  -- Identity gate: the hardcoded politician UUID must belong to the intended
  -- official's external_id — a wrong-but-existing UUID would satisfy the FK
  -- and the count gate below while silently misattributing stances.
  SELECT external_id INTO v_ext FROM essentials.politicians WHERE id = '<politician_uuid>';
  IF v_ext IS DISTINCT FROM <expected_ext_id> THEN
    RAISE EXCEPTION 'UUID <politician_uuid> does not belong to external_id % (<Name>) — found %', <expected_ext_id>, v_ext;
  END IF;
  SELECT COUNT(*) INTO n FROM inform.politician_answers WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % answers, found % — topic_key mismatch dropped rows', <expected_count>, n;
  END IF;
  -- Context-parity gate: the context VALUES list is a verbatim duplicate of the
  -- answers list; count it too so a single-sided edit cannot silently drop or
  -- skew reasoning/sources rows.
  SELECT COUNT(*) INTO n FROM inform.politician_context WHERE politician_id = '<politician_uuid>';
  IF n <> <expected_count> THEN
    RAISE EXCEPTION 'Expected % context rows, found % — answers/context VALUES lists diverged', <expected_count>, n;
  END IF;
END $$;

COMMIT;
```

**Critical rules from analog:**
- `politician_id` UUID is the one minted by structural migration 1178 — look it up by `external_id` after applying it, then hardcode it in each stance file.
- `val` is integer 1–5 (chairs model, NOT polarity) — blank spoke = omit the topic row entirely, never default.
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true` — never hardcode a topic UUID.
- Skip all 8 `judicial-*` topics (City Attorney/Municipal Court Judge assumed appointed — RESEARCH flags this as A7, an assumption not FG-primary-source-confirmed; Wave-0 should do a fast confirming check per Open Question 2).
- Expect thinner overall evidence than Tualatin's (no Forest Grove-specific council-vote record found via WebSearch this session) and comparable-to-or-thinner than Tigard's, especially for Marshall and Schimmel — honest blank spokes are acceptable.
- **Do NOT attribute Angel Falconer's pre-2022 "council president"/2016/2020 history to Forest Grove** — that record belongs to Milwaukie, OR, a different city (Pitfall 1 in RESEARCH). A stance agent researching Falconer must re-read her bio's full sentence before citing any pre-2022 date.
- **Do NOT seed or cite Peter Truax** — he lost the close 2024 race to Brian Schimmel, who holds the seat.
- One migration file per official — 7 files total (Wenzl, Marshall, Martinez, Valenzuela, Gustafson, Falconer, Schimmel).
- One agent at a time for stance research (memory: feedback_stance_research_one_at_a_time).

---

### `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-wave0-probe.sql` (utility, request-response)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-tualatin-wave0-probe.sql` (entire file, 107 lines)

Copy the 7-probe shape verbatim, adapting values:
- **Probe A:** Forest Grove's geo_id `4126200` is CONFIRMED CORRECT by RESEARCH (unlike Tualatin's wrong-value correction) — still run the existence probe as standard practice, but there is no "wrong value" to also check for 0 rows; a single `EXPECT 1` probe against `4126200` suffices (optionally also probe the school-district geo_id `4105160` to confirm it's a distinct, non-colliding row, per RESEARCH's geo_id verification section).
- **Probe B:** districts on geo_id `4126200` — EXPECT 0 (greenfield).
- **Probe C:** existing Forest Grove government rows by geo_id OR name ILIKE `%forest grove%` — EXPECT 0.
- **Probe D:** ext_id block `-4126210..-4126195` collision check (covers the -4126201..-4126207 range with margin) — EXPECT 0 rows.
- **Probe E:** `ls C:/EV-Accounts/backend/migrations | sort -n | tail` cross-check against ledger MAX — RESEARCH found on-disk MAX 1177, next 1178; ledger MAX 1169 is the trap value, do not use directly.
- **Probe F:** districts.state casing on a known-good reference row (Portland 4159000) — EXPECT `'or'` lowercase.
- **Probe G:** live compass topic_key list + counts — EXPECT 44 live topics, 8 judicial-*.
- **New probe (Forest Grove-specific, not in Tualatin's file):** fresh fetch/spot-check of `forestgrove-or.gov/611/Meet-the-Council` to re-confirm the 7-member roster is unchanged, especially the close Schimmel/Truax seat (RESEARCH Open Question 4) — this is a live-web check, not a SQL probe, so it belongs in the plan's Wave-0 step description rather than this `.sql` file, but should be called out alongside it.

---

### `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py` (utility, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py` (entire file, ~470 lines, gitignored but still present on disk)

**Module docstring pattern** (analog structure — adapt city/count and source description; source situation is materially different — a JS-rendering gap, not a no-bulk-portal gap like Tigard, nor a clean single-portal source like Tualatin):
```python
"""
_tmp-forest-grove-headshots.py
Download, crop, resize, and upload headshots for up to 7 City of Forest Grove
City Council members (Mayor + 6 Councilors) to Supabase Storage bucket
'politician_photos'.

Phase 180 — WASH-06 (headshot portion).

ORCHESTRATION NOTE:
  Running this script is the INLINE-ORCHESTRATOR step, NOT the executor's.
  The executor only WRITES this file to disk. The orchestrator runs it,
  then applies audit headshot migration 1179 after the pipeline emits its
  manifest. This is a gitignored _tmp-* helper — do NOT commit it.

Processing pipeline (per feedback_headshot_resize_no_distort.md, crop-first):
  1. Resolve politician UUID at RUNTIME by external_id (psycopg2).
  2. Download the portrait from the per-official source URL. Recommended
     sourcing order per D-16 (adapted for this phase's specific finding):
       a. FIRST attempt a JS-capable fetch (browser automation, e.g. a
          Playwright tool if available) of forestgrove-or.gov's
          directory.aspx?EID=<n> / Meet-the-Council photo widget — the
          CivicPlus CMS markup reserves a photo slot per person but a
          plain curl/static fetch returns 0 headshot URLs (a JS-rendering
          gap, NOT a confirmed content-absence finding).
       b. Fallback: Ballotpedia (search per-name; no bulk portal found
          in RESEARCH for these 7 officials).
       c. Fallback: Wikimedia Commons (unlikely for sitting local
          officials, but worth a check).
       d. Fallback (pre-authorized, D-16 standing rule): local news —
          forestgrovenewstimes.com / newsinthegrove.com (same publisher
          family as tigardlife.com for the .com outlet).
  3. Composite onto white if transparent (PNG/RGBA).
  4. CROP to 4:5 ratio FIRST — never stretch.
  5. RESIZE to 600x750 Lanczos q90.
  6. Upload to politician_photos/{uuid}-headshot.jpg via PUT x-upsert: true.
  7. Reject any image with superimposed text/graphics over the face.
  8. Document any official with NO usable photo found as a genuine gap —
     do not force a low-quality or group-photo crop just to hit 7/7.

WR-01 FIX (D-14, NEW for this phase — no prior in-repo example; see PATTERNS.md
"No Analog Found"): main() MUST exit non-zero if ANY official failed to upload.
_tmp-tualatin-headshots.py's main() only prints a WARNING string and returns
normally (implicit exit 0) on a partial outcome — that silent-success behavior
is the exact defect being fixed here. See the corrected main() shape below.
"""
```

**OFFICIALS roster pattern** (analog structure — adapt to Forest Grove's 7 officials):
```python
OFFICIALS = [
    {
        'ext_id': -4126201,
        'name': 'Malynda Wenzl',
        'url': '<resolved at execution — try JS-capable fetch of forestgrove-or.gov first>',
        'license': 'press_use',  # verify per actual source at execution
    },
    # ... up to 6 more entries through -4126207 Brian Schimmel
]

assert len({m["ext_id"] for m in OFFICIALS}) == len(OFFICIALS), 'external_ids must be unique'
# Do NOT hard-assert count == 7 here — a partial outcome is an expected,
# acceptable result per RESEARCH given the confirmed headshot-sourcing gap.
```

**Config block, crop/resize functions, transparent-composite guard, test-download guard** — copy verbatim from `_tmp-tualatin-headshots.py` lines 1–409 (identical `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `RESAMPLE=Image.Resampling.LANCZOS`, `test_download_guard()` function).

**`main()` — WR-01 FIX applied (NEW pattern, adapt from `_tmp-tualatin-headshots.py` lines 410–469):**
```python
def main():
    if not SUPABASE_URL:
        print('ERROR: SUPABASE_URL not set in .env')
        sys.exit(1)
    if not SERVICE_KEY:
        print('ERROR: SUPABASE_SERVICE_ROLE_KEY not set in .env')
        sys.exit(1)
    if not DATABASE_URL:
        print('ERROR: DATABASE_URL not set in .env')
        sys.exit(1)

    print('[_tmp-forest-grove-headshots] Phase 180 headshot upload')
    print(f'  Roster: {len(OFFICIALS)} City of Forest Grove officials configured (7/7 expected)')
    print(f'  Target: {TARGET_SIZE[0]}x{TARGET_SIZE[1]} JPEG q{JPEG_QUALITY} via Lanczos')
    print(f'  Bucket: {BUCKET}')

    test_download_guard(OFFICIALS[0])

    db_url = DATABASE_URL
    if 'sslmode' not in db_url:
        sep = '&' if '?' in db_url else '?'
        db_url = db_url + sep + 'sslmode=require'
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()

    results = []
    try:
        for member in OFFICIALS:
            results.append(process_member(cursor, member))
            time.sleep(0.5)
    finally:
        cursor.close()
        conn.close()

    successes = [r for r in results if r['success']]
    failures = [r for r in results if not r['success']]

    print(f"\n{'='*60}")
    print('=== FOREST GROVE CITY COUNCIL HEADSHOT MANIFEST ===')
    print()
    for r in results:
        if r['success']:
            print(
                f'SUCCESS: {r["ext_id"]} {r["name"]} {r["uuid"]}'
                f' -> {r["cdn_url"]} [license={r["license"]}, source={r["source"]}]'
            )
        else:
            print(f'FAILED: {r["ext_id"]} {r["name"]} -- {r["error"]}')
    print()
    print(f'{len(successes)}/{len(OFFICIALS)} uploaded, {len(failures)} failed')
    print('=== END MANIFEST ===')

    # WR-01 FIX: exit non-zero on ANY failure, so a chained automation cannot
    # proceed to apply the audit headshot migration on a silently-partial run.
    # Inherited _tmp-tualatin-headshots.py only printed a WARNING and returned
    # 0 here — that is the exact defect D-14/WR-01 requires fixing.
    if failures:
        print(f'EXIT 1: {len(failures)} of {len(OFFICIALS)} headshot uploads failed — '
              f'do not apply migration 1179 without resolving or documenting each gap.')
        sys.exit(1)


if __name__ == '__main__':
    main()
```

---

### `src/lib/coverage.js` (config edit — add Forest Grove to Oregon block)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\coverage.js` lines 96–109 (current live Oregon block, already includes Tigard and Tualatin)

**Current Oregon block** (verified live, lines 96–109):
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

**Required edit — insert Forest Grove alphabetically between Fairview and Gresham ("F" < "G", "Fairview" < "Forest Grove" < "Gresham"):**
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
**`hasContext: true` is correct once ≥1 stance row exists** for a Forest Grove official. Browse link at completion: `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110`.

---

### `src/lib/buildingImages.js` (config edit — add Forest Grove to CURATED_LOCAL)

**Analog:** `C:\Transparent Motivations\essentials\src\lib\buildingImages.js` lines 103–128 (current live CURATED_LOCAL block, already includes Tigard + Tualatin) + lines 199–223 (`getBuildingImages()` match loop — LIVE-CONFIRMED THIS SESSION)

**Current state** (verified live, lines 103–128 — note existing multi-word keys `'los angeles'`, `'long beach'`, `'west covina'` are the proof pattern for the correct key format):
```js
// Curated standalone-city banner art (cities/<slug>.jpg in Storage, D-05) +
// LA-county skylines (la_county/building_photos/<geoid>.jpg). Attribution
// (Wikimedia Commons) - title | author | license:
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
const CURATED_LOCAL = {
  bloomington: '...bloomington.jpg',
  beaverton: '...beaverton.jpg',
  hillsboro: '...hillsboro.jpg',
  tigard: '...tigard.jpg',
  tualatin: '...tualatin.jpg',
  'los angeles': '...la_county/building_photos/0644000-skyline.jpg',
  'long beach': '...la_county/building_photos/0643000.jpg',
  'west covina': '...la_county/building_photos/0684200.jpg',
  ...
};
```

**`getBuildingImages()` match loop, live-confirmed this session (lines 199–209) — this is the CONCRETE PROOF for the two-word-key requirement RESEARCH flagged as an open question:**
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
The match is `city.includes(key)` where `city` = `offices.representing_city.toLowerCase()`. Since `representing_city='Forest Grove'` lowercases to `'forest grove'` (a literal space, not a hyphen), **the CURATED_LOCAL key MUST be the literal string `'forest grove'`** — exactly matching the pre-existing `'los angeles'` / `'long beach'` / `'west covina'` pattern already live in this file. **A hyphenated `'forest-grove'` key would never match and the banner would silently fall back to the tier gradient** — this resolves RESEARCH's flagged open question definitively.

**Required edit:**
```js
// Curated standalone-city banner art (cities/<slug>.jpg in Storage, D-05) +
// LA-county skylines (la_county/building_photos/<geoid>.jpg). Attribution
// (Wikimedia Commons) - title | author | license:
//   bloomington - Kirkwood Ave. in Bloomington, IN | Yahala | CC BY-SA 3.0
//   beaverton - Beaverton Central and The Round, Beaverton, Oregon | M.O. Stevens | CC BY 3.0
//   hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0
//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain
//   tualatin - Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0
//   forest grove - Old College Hall, Pacific University (front) | M.O. Stevens (Aboutmovies) | CC BY 3.0
const CURATED_LOCAL = {
  bloomington: '...bloomington.jpg',
  beaverton: '...beaverton.jpg',
  hillsboro: '...hillsboro.jpg',
  tigard: '...tigard.jpg',
  tualatin: '...tualatin.jpg',
  'forest grove': 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/forest-grove.jpg',
  'los angeles': '...',
  ...
};
```
**Note the deliberate asymmetry:** the CURATED_LOCAL **key** is `'forest grove'` (space, matches `representing_city.toLowerCase()`), but the Supabase Storage **path** is `cities/forest-grove.jpg` (hyphenated slug, per D-10's `docs/banner-asset-pipeline.md` file-naming convention — Storage paths and JS object keys serve different purposes and need not share a format). Do not conflate the two.

**Banner pipeline invocation (no new file — use existing committed scripts):**
```bash
python scripts/banners/process_banner.py \
  --input <raw_source_photo> \
  --output <processed_1700x540.jpg> \
  # crops/resizes to 1700x540 @ 3.15:1 per docs/banner-asset-pipeline.md

python scripts/banners/upload_banner.py \
  --file <processed_1700x540.jpg> \
  --path cities/forest-grove.jpg
  # uploads to Supabase Storage politician_photos/cities/forest-grove.jpg, prints CDN URL
```
Follow `docs/banner-asset-pipeline.md` Stages 1–8 exactly. Candidates per D-15: "Old College Hall Pacific University front.JPG" (CC BY 3.0, primary hint) or "Downtown Forest Grove, Oregon.JPG" (Public Domain, alternate hint) — both need a compositional crop judgment call at execution given their ~1.5–1.6:1 native aspect ratio vs. the pipeline's 3.15:1 target (view all candidates directly before choosing, per RESEARCH A12/Wave-0 Gap).

---

## Shared Patterns

### OR State/Casing Rules (apply to structural migration)
**Source:** `migrations/1169_tualatin_city_council.sql` lines 22–26 (comment block), re-verified live by RESEARCH.

| Context | Casing | Why |
|---|---|---|
| `governments.state` | `'OR'` (uppercase) | Governments table convention |
| `districts.state` for LOCAL/LOCAL_EXEC | `'or'` (lowercase) | Matches geocoder/routing query |
| `offices.representing_state` | `'OR'` (uppercase) | Offices table convention |
| `politicians.party` | `NULL` | Antipartisan — never set |

### Idempotency Guards (apply to structural migration)
**Source:** `migrations/1169_tualatin_city_council.sql` throughout.
- `governments`: `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = '...')` — no unique constraint on geo_id.
- `chambers`: `WHERE NOT EXISTS` on `(name, government_id)`.
- `districts`: `WHERE NOT EXISTS` on `(geo_id, district_type, state)`.
- `offices`: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)`.
- `politicians`: `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active`.

### Slug Never Inserted (apply to structural migration)
**Source:** `migrations/1169` chambers INSERT (omits slug column entirely).
`essentials.chambers` has `slug` as a GENERATED ALWAYS column. Never include `slug` in the INSERT column list — migration will fail with a generated column error.

### photo_origin_url Does Not Exist (apply to headshot migration)
**Source:** `migrations/1170_tualatin_headshots.sql` — `politician_images` INSERTs use only `(id, politician_id, url, type, photo_license)`. The `photo_origin_url` column does not exist. Never include it.

### Stance Value Model + Identity/Context-Parity Gates (apply to 7 stance migrations)
**Source:** `migrations/1171_bubenik_stances.sql` entire file.
Values are chairs (integer 1–5), not polarity. Omit the entire row for a topic with no evidence — do not default to Neutral. `topic_id` resolved LIVE via `JOIN inform.compass_topics ON topic_key AND is_live=true`. Both `politician_answers` and `politician_context` tables get the same `ON CONFLICT (politician_id, topic_id) DO UPDATE`. Skip all 8 `judicial-*` topics. **The post-verify DO block includes an identity gate** (hardcoded UUID's `external_id` must match the intended official) **and a context-parity gate** (answers count must equal context count) — this is the exact identity-gate style D-14/WR-02 asks the structural migration to also adopt, one level up (per-politician here vs. whole-roster there).

### Plain Title Convention, No Position/Ward Differentiation (apply to structural migration)
**Source:** `migrations/1159_tigard_city_council.sql` lines 134–168, 401–403 (title convention section) — confirmed twice from Forest Grove's own primary-source text (Meet the Council + Elections pages), no "Position N" or "Ward N" language found anywhere.
Office titles are simply `'Mayor'` and `'Councilor'` for all 7 seats — this is Tigard's convention, NOT Tualatin's `'Council Member (Position N)'` numbered convention (Tualatin is the district/politician-shape analog but NOT the title-string analog — do not copy its title strings).

### No Appointed Seats — Simpler Than Both Sibling Precedents (apply to structural migration)
**Source:** RESEARCH Live Roster section; contrast with `migrations/1159_tigard_city_council.sql` (2 of 7 appointed) and `migrations/1169_tualatin_city_council.sql` (0 of 7 appointed, matches Forest Grove).
All 7 Forest Grove seats use uniform `is_appointed=false` / `is_appointed_position=false` — same as every one of Tualatin's 7 seats. Valenzuela's 2020 appointment was superseded by her Nov 2022 election (same treatment class as Tualatin's Pratt) — do NOT import Tigard's `is_appointed=true` block pattern for any Forest Grove seat.

### representing_city Drives Banner Derivation (apply to structural migration)
**Source:** `migrations/1169_tualatin_city_council.sql` (D-11 inline pattern) + `buildingImages.js` `getBuildingImages()` match loop (live-confirmed this session, lines 199–209).
The frontend Local-section banner derives its city key from `offices.representing_city` (lowercased substring match against `CURATED_LOCAL` keys). **Forest Grove's structural migration must set `representing_city='Forest Grove'` inline on every one of the 7 office INSERTs** — no separate backfill migration needed. **Critically, this is the FIRST two-word city name in the milestone's WashCo sequence** — the CURATED_LOCAL key must be the literal `'forest grove'` string (space, not hyphen) to match `'Forest Grove'.toLowerCase()`.

### Wave-0 Probe Shape (apply to Wave-0 probe script)
**Source:** `scripts/_tmp-tualatin-wave0-probe.sql` entire file.
Gitignored `_tmp-*` helper, read-only SELECT/`\echo` only, no DDL/transaction wrapper. Run via `psql "$DATABASE_URL" -f <path>`. Probes: geo_id existence (A), greenfield district check (B), greenfield government check (C), ext_id collision check (D), migration counter cross-check — on-disk `ls` is authoritative, not ledger MAX (E), OR casing reference check via a known-good row like Portland (F), live compass topic inventory (G). Forest Grove's Probe A is simpler than Tualatin's (no wrong-value correction needed — geo_id 4126200 confirmed correct — but still run the existence probe as standing practice per RESEARCH's "Don't Hand-Roll" table).

---

## No Analog Found

Two specific sub-patterns required by D-14 have **no prior in-repo example** — both were checked directly against the live Tualatin artifacts (the most recent prior phase) and confirmed absent:

| Pattern | File | Reason | Closest Partial Analog |
|---|---|---|---|
| **WR-01: non-zero exit on partial headshot upload failure** | `_tmp-forest-grove-headshots.py` | Directly verified: `_tmp-tualatin-headshots.py`'s `main()` (lines 410–469) only prints a `WARNING: expected 7/7...` string on a partial outcome and returns normally — `sys.exit(1)` is called only for missing env vars (lines 413/416/419), never for upload failures. This is a genuine latent defect across every prior `_tmp-*-headshots.py` script in the milestone, not something the planner can copy verbatim from any existing file. | `_tmp-tualatin-headshots.py`'s existing `sys.exit(1)` calls for env-var preflight failures (lines 413–419) — same mechanism (`sys.exit(1)`), different trigger condition. The corrected `main()` shape is fully specified above in the Pattern Assignments section. |
| **WR-02: in-file identity gate in the structural migration's post-verify** | `1178_forest_grove_city_council.sql` | No prior structural migration (1150 Hillsboro, 1159 Tigard, 1169 Tualatin) includes a name-match assertion in its post-verify block — all three only assert counts (gov=1, offices=7, section-split=0, office_id nulls=0, representing_city=N), never that the *names* on the ext_id block match the researched roster. | `migrations/1171_bubenik_stances.sql` lines 43–53 — the **stance migrations already have exactly this identity-gate style**, just scoped to one politician (`external_id` must match a specific UUID) rather than the whole 7-person roster in one query. The structural migration's WR-02 gate (fully specified above) generalizes this existing stance-file pattern to a `WHERE external_id IN (...) AND full_name IN (...)` count-based version, since the structural migration doesn't have per-row hardcoded UUIDs the way stance files do. |

Both new patterns are fully specified with concrete code in the Pattern Assignments sections above — the planner does not need to invent them from scratch, but should flag in the plan that these two specific blocks are new template hardening (not copy-paste from an existing file) per D-14's explicit charge to "lock into this phase's artifacts... so 180-182 inherit them."

All other classified files/edits have direct, strong analogs from the two immediately-preceding same-milestone sister phases (Tigard 178, Tualatin 179).

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (1169, 1170, 1171, cross-referenced against 1159/1150 for title-convention contrast); `C:/EV-Accounts/backend/scripts/` (`_tmp-tualatin-headshots.py`, `_tmp-tualatin-wave0-probe.sql`, confirmed present on disk despite gitignore); `C:\Transparent Motivations\essentials\src\lib\coverage.js`; `C:\Transparent Motivations\essentials\src\lib\buildingImages.js`; `.planning/phases/178-city-of-tigard-deep-seed/178-PATTERNS.md` (prior pattern map, cross-referenced for title-convention precedent and superseded where Tualatin's more-recent live files diverge).
**Files scanned:** 5 migration files read in full (1169, 1170, 1171, plus targeted excerpt reads of 1159/1150 already captured in the 178-PATTERNS.md cross-reference), 1 Python script read in full (`_tmp-tualatin-headshots.py`, targeted at the `main()` function to confirm the WR-01 gap), 1 SQL probe script read in full, 2 live config files (coverage.js, buildingImages.js, including the `getBuildingImages()` match-loop function to resolve the two-word-key question empirically), 1 prior PATTERNS.md, 1 `ls` directory listing (backend/migrations for on-disk MAX confirmation).
**Pattern extraction date:** 2026-07-03

### Key Casing / Structural Traps (planner must call out in plan actions)

1. **geo_id is `4126200`** — CONFIRMED CORRECT by RESEARCH against the live production DB (first WashCo city this milestone to match the ROADMAP-stated value on the first check). Wave-0 must still re-verify per standard practice.
2. `districts.state` = `'or'` lowercase — wrong case silently excludes all city officials from routing.
3. `chambers` INSERT must omit `slug` column — GENERATED ALWAYS, migration fails if included.
4. `politician_images` INSERT must omit `photo_origin_url` — column does not exist.
5. `governments` has no unique constraint on `geo_id` — always use `WHERE NOT EXISTS` on name.
6. **Use Tigard's plain title convention (`'Mayor'`/`'Councilor'`, NO position numbers) combined with Tualatin's district/politician shape (directly-elected Mayor, no appointed seats)** — Forest Grove is a genuine hybrid; do not copy either sibling's structural migration 100% verbatim.
7. **All 7 seats use uniform `is_appointed=false` / `is_appointed_position=false`** — same as Tualatin, unlike Tigard's 2 appointed seats. Valenzuela's 2020 appointment is superseded by her current elected term.
8. **Do NOT seed a Youth Councilor or MYAC seat as an 8th office** — MYAC confirmed to be a standalone advisory board, not a Council dais seat. `official_count` on the chamber stays 7.
9. Mariana Valenzuela's "Council President" is a title-on-seat, one office row — no second row (same treatment class as Tualatin's Pratt / Tigard's Wolf / Hillsboro's Harris).
10. **Set `representing_city='Forest Grove'` INLINE in the structural migration** — do not defer to a backfill migration.
11. **Two D-14 template fixes are NEW patterns, not copy-paste** — see "No Analog Found" section for the exact gap and the fully-specified fix for both WR-01 (headshot script non-zero exit) and WR-02 (structural migration identity gate).
12. **CURATED_LOCAL key MUST be `'forest grove'` (with a space), never `'forest-grove'`** — live-confirmed against `getBuildingImages()`'s `city.includes(key)` substring match this session; the pre-existing `'los angeles'`/`'west covina'` keys are the proof pattern. The Supabase Storage *path* stays hyphenated (`cities/forest-grove.jpg`) — key format and path format are independent.
13. **Do NOT attribute Angel Falconer's Milwaukie, OR record (2016 election, council president, 2020 re-election) to Forest Grove** — highest-risk misread in RESEARCH; her Forest Grove seat begins Nov 2024.
14. **Do NOT seed Peter Truax** — lost the extremely close 2024 race to Brian Schimmel, who is the current seated official per the primary-source roster page.
15. Headshot sourcing requires the D-16 fallback chain / a JS-capable fetch attempt first — forestgrove-or.gov's photo widget is JS/AJAX-loaded, not curl-visible, a different failure mode than a WAF block. Do not hard-assert 7/7 in the headshot migration's post-verify; use the actual sourced count.
16. **Do NOT use the ledger MAX (1169) as the next migration number** — the true on-disk MAX is 1177; next is 1178. Re-confirm at Wave-0 via `ls`.
17. Skip all 8 `judicial-*` topics — City Attorney/Municipal Court Judge assumed appointed (RESEARCH flags this as assumption A7, not FG-primary-source-confirmed; recommend a fast Wave-0 confirming check).
