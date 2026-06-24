# Phase 161: Clark County Commission Deep-Seed - Pattern Map

**Mapped:** 2026-06-23
**Files analyzed:** 5 (1 structural migration + 1 audit-only headshot migration + 7 audit-only stance migrations + 1 headshot script + 1 frontend JS edit)
**Analogs found:** 5 / 5 (all exact or role-match)

All migration + script files live in the SEPARATE repo `C:/EV-Accounts/backend/` (NOT the `essentials` repo). The single frontend edit (`coverage.js`) lives in the `essentials` repo. High-numbered migrations are applied via the Supabase MCP by the inline orchestrator; the `_tmp-*` script is gitignored and run inline.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` | migration / structural | CRUD (1 government + 1 chamber + idempotent district guard + 7 politician+office CTEs on single COUNTY district + office_id back-fill + post-verify DO block + ledger registration) | `244_multnomah_county_government.sql` | exact (same government type, same single-COUNTY-district routing model, same 5-step shape; NV-substituted) |
| `C:/EV-Accounts/backend/scripts/_tmp-clark-county-commission-headshots.py` | utility / script | file-I/O (download AEM JPEG → crop 4:5 → resize 600×750 Lanczos q90 → Storage PUT) | `scripts/_tmp-va-delegates-headshots.py` | exact (same pipeline) |
| `C:/EV-Accounts/backend/migrations/1056_clark_county_commission_headshots.sql` | migration / audit-only | file-I/O (Storage URL → `politician_images` INSERT, 7 rows) | `245_multnomah_county_headshots.sql` | exact (county headshots, same 5-column shape, same external_id-subquery form) |
| `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql` (+ 1058–1063 per commissioner) | migration / audit-only | CRUD (inform.politician_answers + inform.politician_context per commissioner) | `1037_norwalk_ramirez_stances.sql` | exact (same CTE shape, same topic_key join, same ON CONFLICT, same audit-only non-registration) |
| `C:/Transparent Motivations/essentials/src/lib/coverage.js` | config / frontend | transform (add entry to `COVERAGE_COUNTIES` array) | existing `COVERAGE_COUNTIES` entry for Multnomah County (`browseGovernmentList: ['41051']`) at line 219 | exact (same county pattern) |

---

## Pattern Assignments

### `migrations/1055_clark_county_commission.sql` (structural, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (read in full above)

This is a verbatim NV-substitution of mig 244. Substitutions: `'Multnomah County, Oregon, US'` → `'Clark County, Nevada, US'`; `'Board of Commissioners'` → `'Board of County Commissioners'`; `'Multnomah County Board of Commissioners'` → `'Clark County Board of County Commissioners'`; `geo_id='41051'` → `geo_id='32003'`; `mtfcc='G4020'` unchanged; `state='or'`/`state='OR'` → `state='nv'`/`state='NV'`; 5 officials → 7 officials; external_id range `-410001..-410013` → `-3200301..-3200307`; ledger version `'244'` → `'1055'` with `name='clark_county_commission'`.

**File header comment pattern** (mig 244 lines 1-20 — NV-substituted, grep-gate aware):
```sql
-- Migration 1055: Clark County government + chamber + COUNTY district + 7 officials + offices
--
-- Purpose: Seeds Clark County Board of County Commissioners under geo_id='32003'.
--   - 1 government row: 'Clark County, Nevada, US' (type='County', state='NV', geo_id='32003')
--   - 1 chamber row: 'Board of County Commissioners'
--   - 1 COUNTY district row: idempotent guard (Phase 158 already loaded geo_id=32003)
--   - 7 politicians: Chair (-3200301) + Commissioners (-3200302..-3200307)
--   - 7 offices: all linked to the single COUNTY district (geo_id='32003')
--   - office_id back-fill on all 7 politicians
--
-- CRITICAL: the auto-generated path column on essentials.chambers must never appear in INSERT list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'nv' (lowercase) for COUNTY type to match routing queries.
-- CRITICAL: governments.state = 'NV' (uppercase) — government table convention.
```
Note: the tokens `slug`, `photo_origin_url` must NOT appear in comments (grep-gate, from 159-01-SUMMARY). The comment above paraphrases the generated column rule instead.

**Step 1 — Government INSERT** (mig 244 lines 39-46):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Clark County, Nevada, US',
       'County', 'NV', NULL, '32003'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Clark County, Nevada, US'
);
```

**Step 2 — Chamber INSERT, auto-generated column excluded** (mig 244 lines 53-63):
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of County Commissioners',
       'Clark County Board of County Commissioners',
       (SELECT id FROM essentials.governments WHERE name = 'Clark County, Nevada, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of County Commissioners'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Clark County, Nevada, US')
);
```

**Step 3 — COUNTY district INSERT (idempotent no-op, Phase 158 already loaded)** (mig 244 lines 72-77):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'nv', '32003', 'Clark County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '32003' AND district_type = 'COUNTY' AND state = 'nv'
);
```
`d.state = 'nv'` LOWERCASE is load-bearing — TIGER loader writes lowercase for COUNTY/LOCAL/STATE_UPPER/STATE_LOWER tiers. Using uppercase `'NV'` here matches ZERO rows (silent no-op for the office INSERTs).

**Step 4 — Politician + Office CTE block (7 blocks)** (mig 244 lines 89-248 — full CTE shape):

The NOT EXISTS guard on offices uses `(district_id, politician_id)` — NOT `(district_id, chamber_id)` — because county pattern has one person per office (unlike legislature which has many members per district).

```sql
-- BLOCK 1: Chair Naft (District A, -3200301)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michael Naft', 'Michael', 'Naft', 'Democratic',
          true, false, false, true, -3200301)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of County Commissioners'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Clark County, Nevada, US')),
       p.id,
       'Commissioner (District A)', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '32003'
  AND d.district_type = 'COUNTY'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat BLOCK 2-7 for Kirkpatrick/Becker/McCurdy/Segerblom/Jones/Gibson
-- with external_ids -3200302..-3200307 and titles 'Commissioner (District B)'..'(District G)'
-- party field: 6 Democratic / 1 Republican (Becker = 'Republican')
-- Title for Naft: 'Commissioner (District A)' (Chair title-on-seat; sort order handled by groupHierarchy.js)
-- Title for McCurdy: 'Commissioner (District D)' (Vice-Chair is title-on-seat too)
-- Note: 'representing_state = 'NV'' UPPERCASE — free-text label column, not a join key.
-- Note: 'd.state = 'nv'' LOWERCASE — the routing join key.
```

**Step 5 — office_id back-fill** (mig 244 lines 255-260):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3200307 AND -3200301
  AND p.office_id IS NULL;
```
BETWEEN ordering: more-negative bound first (matches mig 244 `-410013 AND -410001` pattern).

**Step 6 — Post-verification DO block** (mig 244 lines 269-314 — NV-substituted):
```sql
DO $$
DECLARE
  v_gov_count INTEGER; v_office_count INTEGER; v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'Clark County, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Clark County government row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '32003' AND d.district_type = 'COUNTY' AND d.state = 'nv';
  IF v_office_count <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 7 offices linked to geo_id=32003 COUNTY district, found %', v_office_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '32003' AND gb.mtfcc = 'G4020'
    AND NOT EXISTS (SELECT 1 FROM essentials.districts d
                    WHERE d.geo_id = gb.geo_id AND d.district_type = 'COUNTY' AND d.state = 'nv');
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov=%, offices=%, split=%', v_gov_count, v_office_count, v_split_count;
END $$;
```

**Step 7 — Structural registration OUTSIDE BEGIN/COMMIT** (mig 1053 tail, newer `(version, name)` form):
```sql
-- After COMMIT, outside the transaction block:
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1055', 'clark_county_commission')
ON CONFLICT (version) DO NOTHING;
```
Note: mig 244 used the 1-column `(version)` form; mig 1053 (phase 160) uses the newer 2-column `(version, name)` form. Use the `(version, name)` form for mig 1055 to match recent convention.

**Headshot migrations 1056 and stance migrations 1057-1063 are NOT registered.**

---

### `scripts/_tmp-clark-county-commission-headshots.py` (utility / script, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-va-delegates-headshots.py` (exact pipeline)

The Multnomah equivalent (`_tmp-multnomah-headshots.py`) no longer exists on disk. Use the VA delegates script as the canonical template — same env-load, psycopg2, crop-4:5, resize, Storage PUT pattern confirmed in 160-PATTERNS.

**Env-load + constants block** (`_tmp-va-delegates-headshots.py` lines 183-224 — verbatim, NV-substituted):
```python
_env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
_env = {}
with open(_env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            _env[k.strip()] = v.strip()

SUPABASE_URL = _env.get('SUPABASE_URL', '')
SERVICE_KEY  = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL = _env.get('DATABASE_URL', '')
BUCKET   = 'politician_photos'
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'
TARGET_SIZE  = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS
```

**Commissioner roster + AEM source URLs** (NV-specific, substitutes the VA `DELEGATE_HID_MAP`):
```python
# All 7 URLs verified HTTP 200, no WAF, no special UA needed (clarkcountynv.gov AEM)
COMMISSIONERS = [
  {'ext_id': -3200301, 'name': 'Michael Naft',       'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:216e1b45-bc22-4f67-9ddb-6af03b44cf8c/original/as/commissioner-naft-dist-a.jpg'},
  {'ext_id': -3200302, 'name': 'Marilyn Kirkpatrick', 'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:6e201ef6-6aaa-47bc-9ea3-1c54202ebd69/original/as/commissioner-kirkpatrick-dist-b.jpg'},
  {'ext_id': -3200303, 'name': 'April Becker',        'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:d2f2d7c7-5d31-4d0b-9a02-423ccce4d989/original/as/commissioner-becker-dist-c.jpg'},
  {'ext_id': -3200304, 'name': 'William McCurdy II',  'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:a7f197d7-f947-4987-9235-161775bc136a/original/as/commissioner-mccurdy-ii-dist-d.jpg'},
  {'ext_id': -3200305, 'name': 'Tick Segerblom',      'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:b2de002e-8832-4492-b3a6-491cf8dacd23/original/as/commissioner-segerblom-dist-e.jpg'},
  {'ext_id': -3200306, 'name': 'Justin Jones',        'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:83fba492-9def-41bd-ae69-40c72bb61337/original/as/commissioner-jones-dist-f.jpg'},
  {'ext_id': -3200307, 'name': 'James B. Gibson',     'url': 'https://www.clarkcountynv.gov/adobe/assets/urn:aaid:aem:6c1b8a56-975f-4ade-ba2a-8c897996561f/original/as/commissioner-gibson-dist-g.jpg'},
]
# Source images: 175x175 JPEG (square AEM thumbnails). crop_to_4_5 gives 140x175 then resize to 600x750.
# This is a ~4.3x upscale — same precedent as Pasadena Jones/Madison (150x200, approved 2026-06-20).
# No WAF: plain curl / requests without special User-Agent.
# Wikimedia fallback (if primary fails): Kirkpatrick CC BY 2.0; Jones CC BY-SA 4.0 TIFF.
# Wikimedia requires descriptive UA: 'EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)'
```

**Runtime UUID resolution** (`_tmp-va-delegates-headshots.py` lines 216-225 — verbatim):
```python
def resolve_politician_id(cursor, external_id: int) -> str:
    cursor.execute(
        'SELECT id FROM essentials.politicians WHERE external_id = %s',
        (external_id,)
    )
    row = cursor.fetchone()
    if not row:
        raise Exception(f'No politician found with external_id={external_id}')
    return str(row[0])
```

**crop-first → resize pipeline** (`_tmp-va-delegates-headshots.py` lines 244-300 — verbatim):
```python
def crop_to_4_5(img):
    w, h = img.size
    target_ratio = 4.0 / 5.0
    current_ratio = w / h
    if abs(current_ratio - target_ratio) < 0.001:
        return img
    if current_ratio > target_ratio:        # wider than 4:5 -> center-crop width
        new_w = int(h * target_ratio); left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:                                    # taller -> top-crop (keep head at top)
        new_h = int(w / target_ratio)
        return img.crop((0, 0, w, new_h))

def resize_600x750(img):
    return img.resize(TARGET_SIZE, RESAMPLE)

def upload_to_storage(politician_uuid, jpeg_bytes):
    filename = f'{politician_uuid}-headshot.jpg'
    url = f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}'
    headers = {'Authorization': f'Bearer {SERVICE_KEY}',
               'Content-Type': 'image/jpeg', 'x-upsert': 'true'}
    resp = requests.put(url, data=jpeg_bytes, headers=headers, timeout=60)
    if resp.status_code not in (200, 201):
        raise Exception(f'Storage upload failed: {resp.status_code} {resp.text}')
    return f'{CDN_BASE}/{filename}'
```

**psycopg2 connection** (`_tmp-va-delegates-headshots.py` lines 413-420 — verbatim):
```python
db_url = DATABASE_URL
if 'sslmode' not in db_url:
    sep = '&' if '?' in db_url else '?'
    db_url = db_url + sep + 'sslmode=require'
conn = psycopg2.connect(db_url)
conn.autocommit = True
cursor = conn.cursor()
```

**Per-member pipeline order** (lines 330-362): open PIL → `convert('RGB')` → `crop_to_4_5` → `resize_600x750` → `save(JPEG, quality=90, optimize=True)` (re-encodes, strips EXIF) → `upload_to_storage`.

**Manifest output:** emit `SUCCESS/FAILED: <ext_id> <name> <uuid> -> <cdn_url>` per commissioner; hard-gate 7/7. The 1056 headshot migration consumes the `ext_id → uuid → cdn_url` values from this manifest.

---

### `migrations/1056_clark_county_commission_headshots.sql` (audit-only, file-I/O)

**Analog:** `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` (read in full above — 5-row county headshots, identical 5-column shape)

NOT registered in `schema_migrations`. Applied via `execute_sql` after headshot script uploads to Storage. CDN URLs are filled in from the script manifest.

**File header comment pattern** (mig 245 lines 1-21 — NV-substituted):
```sql
-- 1056_clark_county_commission_headshots.sql
-- AUDIT-ONLY: captures the live politician_images INSERTs performed during Phase 161
-- execution. DO NOT register in ledger -- actual DB writes happen live via
-- scripts/_tmp-clark-county-commission-headshots.py.
--
-- 7 Clark County commissioners:
--   external_id -3200301 — Michael Naft (Chair, District A)
--   external_id -3200302 — Marilyn Kirkpatrick (Commissioner District B)
--   external_id -3200303 — April Becker (Commissioner District C)
--   external_id -3200304 — William McCurdy II (Commissioner District D)
--   external_id -3200305 — Tick Segerblom (Commissioner District E)
--   external_id -3200306 — Justin Jones (Commissioner District F)
--   external_id -3200307 — James B. Gibson (Commissioner District G)
--
-- Sources: clarkcountynv.gov AEM /original/as/ URLs (us_government_work)
-- Photo processing: 175x175 JPEG source -> crop 140x175 (4:5) -> resize 600x750 Lanczos q90.
```
Note: keep `photo_origin_url`, `slug` out of comments per grep-gate rule.

**Per-row INSERT shape** (mig 245 lines 29-37 — exact column shape, external_id-subquery form):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3200301),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/<uuid-from-script>-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3200301)
);
-- Repeat for -3200302 through -3200307.
-- Columns exactly (id, politician_id, url, type, photo_license) — NO photo_origin_url.
-- photo_license: 'us_government_work' for clarkcountynv.gov (county government portraits).
--   Multnomah (245) used 'public_domain' for multco.us — either is defensible; operator picks at execution.
```

---

### `migrations/1057_clark_county_commission_naft_stances.sql` (audit-only, CRUD) — and 1058–1063

**Analog:** `C:/EV-Accounts/backend/migrations/1037_norwalk_ramirez_stances.sql` (read in full above — exact CTE shape, same inform schema)

Each file covers one commissioner. Same shape for all 7 (1057=Naft, 1058=Kirkpatrick, 1059=Becker, 1060=McCurdy, 1061=Segerblom, 1062=Jones, 1063=Gibson).

**File header comment pattern** (mig 1037 lines 1-7 — NV-substituted):
```sql
-- 1057_clark_county_commission_naft_stances.sql
-- Phase 161 (CLARK-01): Michael Naft (ext -3200301) evidence-only compass stances.
-- AUDIT-ONLY — raw SQL, NOT registered in schema_migrations. Ledger stays 1055. Idempotent.
-- CHAIRS model (value = the chair the evidence matches). 100% citation. No defaults. Honest blanks.
-- topic_id resolved LIVE by topic_key (never hardcoded). Stance sources: clark.legistar.com + Nevada Independent.
```

**CTE shape** (mig 1037 lines 10-36 — NV-substituted):
```sql
BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
  ('homelessness-response', <1-5>,
   '<evidence-based reasoning citing specific vote or statement>',
   ARRAY['<url1>', '<url2>']),
  ('<topic_key_2>', <val>, '<reasoning>', ARRAY['<url>']),
  -- ... additional topics with evidence ...
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '<politician-uuid>', topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '<politician-uuid>', topic_id, reasoning, sources FROM t
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
-- Post: N answers + N paired context rows for <uuid>; ledger unchanged (1055).
```

Key constraints:
- `politician_id` hardcoded UUID (resolved after mig 1055 applies, or via DB probe at stance-research time)
- `topic_id` resolved LIVE via `JOIN inform.compass_topics ct ON ct.topic_key = ... AND ct.is_live = true` — never hardcode topic UUIDs
- `ON CONFLICT (politician_id, topic_id) DO UPDATE` for idempotency
- No entry for a topic = honest blank (no value); never default to Neutral
- All values are discrete chair positions (1–5), not a directional scale
- County-scope topics likely to have evidence: `homelessness-response`, `housing`, `local-immigration`, `public-safety-approach`, `cannabis-regulation`, `economic-development`, `transportation-priorities`, `local-environment`
- No judicial topics (county commissioners are not judges)

---

### `src/lib/coverage.js` (config / frontend, transform)

**Analog:** `COVERAGE_COUNTIES` array at lines 215-230 — specifically the Multnomah County entry at line 219.

**Existing entry to copy from** (lines 219, `src/lib/coverage.js`):
```javascript
{ label: 'Multnomah County', browseGovernmentList: ['41051'], browseStateAbbrev: 'OR' },
```

**New Clark County entry to INSERT after the existing entries** (add after line 229, the last existing entry before the closing bracket):
```javascript
{ label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true },
```

`hasContext: true` because Phase 161 seeds evidence-only compass stances (purple chip). The county browse uses `browse_skip_overlap: '1'` automatically via the `kind === 'county'` branch in `coverageAreaToPath()` at line 293 — no additional code change needed. No `COVERAGE_STATES` entry for NV yet — the Clark County entry goes into `COVERAGE_COUNTIES` only; NV state-level cities will add `COVERAGE_STATES` in Phases 162–165/168.

Insertion point: after `{ label: 'Weber County', browseGovernmentList: ['49057'], browseStateAbbrev: 'UT' },` at line 229, before the closing `];` at line 230.

---

## Shared Patterns

### County-tier district casing rule (CRITICAL — the #1 silent failure mode)
**Source:** `244_multnomah_county_government.sql` lines 66-70, mig 160-PATTERNS "Lowercase `state='nv'`".
**Apply to:** All 7 office WHERE clauses in mig 1055 + the post-verify DO block.
```sql
-- COUNTY district join (mig 1055 Step 4, Step 6):
WHERE d.geo_id = '32003' AND d.district_type = 'COUNTY' AND d.state = 'nv'
--                                                                       ^^ LOWERCASE

-- offices.representing_state (free-text label column, Step 4):
'representing_state', 'NV'
--                     ^^ UPPERCASE — different column, different convention
```
Wrong casing (`d.state = 'NV'`) matches zero districts → zero office INSERTs → migration "succeeds" silently with 0 commissioners. This was the #1 pitfall in Phase 160 too.

### Idempotent politician INSERT
**Source:** `244_multnomah_county_government.sql` lines 93-98.
**Apply to:** All 7 politician CTEs in mig 1055.
```sql
ON CONFLICT (external_id) DO NOTHING
RETURNING id
```
On re-run, `RETURNING id` yields NULL; downstream office INSERT no-ops via `AND p.id IS NOT NULL`.

### Idempotent office INSERT — NOT EXISTS (district_id, politician_id)
**Source:** `244_multnomah_county_government.sql` lines 116-119.
**Apply to:** All 7 office INSERTs in mig 1055.
```sql
AND NOT EXISTS (
  SELECT 1 FROM essentials.offices o
  WHERE o.district_id = d.id AND o.politician_id = p.id
)
```
County pattern: guard is on `(district_id, politician_id)` — NOT `(district_id, chamber_id)`. Legislature pattern uses `(district_id, chamber_id)`. County uses person-scoped guard because each commissioner has their own office row.

### Auto-generated column exclusion from chamber INSERT
**Source:** `244_multnomah_county_government.sql` line 53, 160-PATTERNS.
**Apply to:** Chamber INSERT in mig 1055 Step 2.
Column list is `(id, name, name_formal, government_id)`. Never include the auto-generated path column. Violation raises: `cannot insert a non-DEFAULT value into column`.

### politician_images column shape (NO removed column)
**Source:** `245_multnomah_county_headshots.sql` lines 29-37, 160-PATTERNS.
**Apply to:** Mig 1056 all 7 INSERT statements.
Columns: exactly `(id, politician_id, url, type, photo_license)`. The `photo_origin_url` column was removed from this table and does not exist. Including it causes: `column "photo_origin_url" does not exist`.

### Headshot pipeline (crop 4:5 → resize 600×750 Lanczos q90 → Storage upsert)
**Source:** `scripts/_tmp-va-delegates-headshots.py` lines 244-362.
**Apply to:** `_tmp-clark-county-commission-headshots.py`.
`x-upsert: true`; bucket `politician_photos`; `optimize=True` on save (re-encode strips EXIF).
Special note for 175×175 AEM source: `crop_to_4_5` on a square image crops the width to `int(175 * 4/5) = 140`, centering horizontally → 140×175. Then `resize_600x750` scales 140×175 → 600×750 (~4.3× upscale). This is within project precedent (Pasadena 150×200 approved 2026-06-20).

### Audit-only non-registration
**Source:** `1037_norwalk_ramirez_stances.sql` line 3; `245_multnomah_county_headshots.sql` lines 4-6.
**Apply to:** Mig 1056 (headshots) and migs 1057-1063 (stances). None of these are registered in `supabase_migrations.schema_migrations`. The ledger MAX stays at `1055` after all these apply.

### Grep-gate on forbidden tokens
**Source:** 159-01-SUMMARY deviation; 160-PATTERNS "Shared Patterns".
**Apply to:** SQL file header comments in mig 1055 and 1056.
The automated plan-verify gate flags literal tokens in comments. The auto-generated path column name and `photo_origin_url` must not appear in comments. Use paraphrases: "auto-generated path column", "the removed column". The `schema_migrations` registration INSERT keyword is unavoidable in Step 7 code, but explanatory comments should say "ledger registration" instead.

### Section-split verification SQL (COUNTY tier)
**Source:** RESEARCH §Section-Split SQL; mig 244 lines 296-310 (Gate c).
**Apply to:** Post-1055 orchestrator verification; inline DO block Step 6.
```sql
SELECT g.name, p.full_name, COUNT(DISTINCT ch.government_id) AS gov_count
FROM essentials.politicians p
JOIN essentials.offices o   ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
JOIN essentials.governments g ON g.id = ch.government_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '32003' AND d.district_type = 'COUNTY'
GROUP BY g.name, p.full_name
HAVING COUNT(DISTINCT ch.government_id) > 1;
-- Expect: 0 rows.
```

---

## No Analog Found

All 5 files have exact or role-match analogs. No gaps.

---

## Migration Counter Reference

| Migration | Name | Type | Registers in schema_migrations? |
|-----------|------|------|----------------------------------|
| 1055 | `clark_county_commission` | Structural | **YES** (registered OUTSIDE the transaction, `(version, name)` 2-column form) |
| 1056 | `clark_county_commission_headshots` | Audit-only | **NO** |
| 1057 | `clark_county_commission_naft_stances` | Audit-only | **NO** |
| 1058–1063 | per-commissioner stances | Audit-only | **NO** |

Ledger MAX after this phase = **1055**. All audit-only migrations leave the ledger unchanged.

---

## Key Identifiers Reference

| Entity | Value |
|--------|-------|
| Clark County government name | `'Clark County, Nevada, US'` |
| Clark County chamber name | `'Board of County Commissioners'` |
| Clark County chamber name_formal | `'Clark County Board of County Commissioners'` |
| COUNTY district (pre-existing, Phase 158) | id=`f3708f34-6e23-4771-a8f7-44e400a23337`, geo_id=`'32003'`, district_type=`'COUNTY'`, state=`'nv'` |
| District mtfcc | `'G4020'` |
| District state casing (COUNTY tier) | `'nv'` LOWERCASE (TIGER loader convention) |
| governments.state casing | `'NV'` UPPERCASE |
| offices.representing_state | `'NV'` UPPERCASE (free-text label, not join key) |
| External_id range | `-3200301` (Naft, Dist A) .. `-3200307` (Gibson, Dist G) |
| External_ids NOT to collide with | US House `-32001..-32004`; STATE_EXEC `-3200001..-3200006`; Senate `-3203001..-3203021`; Assembly `-3204001..-3204042`; US Senators `-400057/-400058` |
| Chair (title-on-seat) | Michael Naft, District A, `-3200301`, `title='Commissioner (District A)'` |
| Vice-Chair (title-on-seat) | William McCurdy II, District D, `-3200304`, `title='Commissioner (District D)'` |
| Party breakdown | 6 Democratic / 1 Republican (April Becker, `-3200303`, District C) |
| Storage bucket | `politician_photos` |
| CDN base | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos` |
| Headshot source primary | clarkcountynv.gov AEM `/original/as/` URLs (7 verified HTTP 200, 175×175 JPEG, no WAF) |
| photo_license | `'us_government_work'` (clarkcountynv.gov county government portraits; `'public_domain'` also defensible per Multnomah precedent) |
| coverage.js insertion point | After line 229 (`Weber County` entry), before closing `];` at line 230 |
| Browse link for review | `essentials.empowered.vote/results?browse_government_list=32003&browse_label=Clark+County&browse_state=NV&browse_skip_overlap=1` |

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/` (244, 245, 1037), `C:/EV-Accounts/backend/scripts/` (`_tmp-va-delegates-headshots.py`), `C:/Transparent Motivations/essentials/src/lib/coverage.js`, `.planning/phases/160-nevada-legislature-seed-headshots/160-PATTERNS.md`.
**Files read:** `244_multnomah_county_government.sql` (full, 324 lines), `245_multnomah_county_headshots.sql` (full, 86 lines), `1037_norwalk_ramirez_stances.sql` (full, 38 lines), `coverage.js` (full, 308 lines), `160-PATTERNS.md` (full, 408 lines), `161-CONTEXT.md` (full), `161-RESEARCH.md` (full).
**Pattern extraction date:** 2026-06-23
