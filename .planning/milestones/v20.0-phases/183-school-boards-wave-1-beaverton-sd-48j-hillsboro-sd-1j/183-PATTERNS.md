# Phase 183: School Boards Wave 1 — Pattern Map

**Mapped:** 2026-07-04
**Files analyzed:** 4 (2 structural/audit migrations counted as 1 pair, 1 headshot script, 1 coverage.js edit)
**Analogs found:** 4 / 4

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|-----------------|---------------|
| `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` | migration (structural) | CRUD (batch INSERT) | `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` (primary); `254_or_school_districts.sql` (secondary, OR-specific naming shape) | exact |
| `C:/EV-Accounts/backend/migrations/1204_or_westmetro_school_boards_wave1_headshots.sql` | migration (audit-only) | CRUD (batch INSERT) | `C:/EV-Accounts/backend/migrations/1108_ccsd_trustees_headshots.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` | utility (headshot ETL pipeline) | file-I/O (download → transform → upload) | `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` (primary — freshest fixes/shape); `_tmp-or-school-headshots.py` (secondary — school-specific roster/DB-insert shape) | exact (blended) |
| `src/lib/coverage.js` (edit — append 2 entries) | config (data table) | CRUD (static array append) | Existing `COVERAGE_SCHOOL_DISTRICTS` CCSD entry, same file lines 253-255 | exact |

No new frontend component/controller files are expected this phase (confirmed by RESEARCH.md: `groupHierarchy.js`/`Results.jsx` need no changes — card subtitle already resolves correctly via the SCHOOL `government_name` fallback for existing production data).

---

## Pattern Assignments

### `1203_or_westmetro_school_boards_wave1.sql` (migration, structural)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1107_ccsd_board_of_trustees.sql` (single-shared-SCHOOL-district shape, most recent post-verify-DO-block convention)
**Secondary analog:** `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` (OR-specific multi-district-in-one-file precedent; deviate from its uniform "Board of Education" chamber name per D-R1/D-R2 verbatim requirement)

**Header/comment-block pattern** (1107 lines 1-20) — a top-of-file purpose block plus a bullet list of `CRITICAL:` casing/schema gotchas. Copy this shape verbatim, substituting the two OR districts' facts:
```sql
-- Migration 1107: Clark County School District government + Board of School Trustees + SCHOOL district + 11 trustees
--
-- Purpose: Deep-seeds ...
--
-- CRITICAL: the auto-generated column on essentials.chambers is GENERATED ALWAYS — never in the INSERT list.
-- CRITICAL: essentials.governments has NO unique constraint on geo_id — use WHERE NOT EXISTS guard.
-- CRITICAL: districts.state must be 'nv' (lowercase) to match routing queries (uppercase = 0 rows).
-- CRITICAL: governments.state = 'NV' (uppercase). offices.representing_state = 'NV' (uppercase).
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT').
-- CRITICAL: the G5420 geofence row (geo_id='3200060') must exist BEFORE this migration runs (loaded by load-ccsd-school-boundary.ts).
-- CRITICAL: party=NULL on all 11 trustees (antipartisan).
-- CRITICAL: board officers (President/VP/Clerk) are titles on existing elected trustees — NOT separate seats.
-- CRITICAL: Save this file as UTF-8 (Esparza-Stoffregan + en-dash in appointed titles).
```
Phase-183 substitutions: geo_ids `4101920`/`4100023` already loaded by Phase 174 (note as "must exist, loaded by Phase 174, no loader run this phase" rather than a to-be-run loader); `state='or'` lowercase on districts; `state='OR'` uppercase on governments/offices; UTF-8 required for "Vân Truong" / "Karen Pérez"; Chair/Vice-Chair are title-on-seat, not separate rows (14 offices total, not 16).

**Government INSERT pattern** (1107 lines 41-48) — `WHERE NOT EXISTS` guard, no unique constraint reliance:
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Clark County School District, Nevada, US',
       'LOCAL', 'NV', NULL, '3200060'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Clark County School District, Nevada, US'
);
```
Repeat once per district: `'Beaverton School District 48J, Oregon, US'` (geo_id `4101920`) / `'Hillsboro School District 1J, Oregon, US'` (geo_id `4100023`), both `type='LOCAL'`, `state='OR'` uppercase.

**Chamber INSERT pattern** (1107 lines 55-66) — generated `slug` column NEVER in the INSERT list:
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'Board of School Trustees',
       'Clark County School District Board of School Trustees',
       (SELECT id FROM essentials.governments WHERE name = 'Clark County School District, Nevada, US'),
       11
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of School Trustees'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Clark County School District, Nevada, US')
);
```
Per D-R1/D-R2 (verbatim, per-district naming — do NOT reuse `254`'s blanket "Board of Education"): Beaverton chamber name = `'School Board'` (`official_count=7`); Hillsboro chamber name = `'Board of Directors'` (`official_count=7`).

**SCHOOL district INSERT pattern** (1107 lines 73-78) — single shared district per government, lowercase state, `mtfcc='G5420'`, geo_id **must already exist** in `geofence_boundaries` (Phase 174 here, `load-ccsd-school-boundary.ts` there — no loader needed this phase):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'nv', '3200060', 'Clark County School District', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3200060' AND district_type = 'SCHOOL' AND state = 'nv'
);
```

**Politician+office CTE pattern** (1107 lines 89-117, repeat per seat) — the `WITH ins_p AS (INSERT ... RETURNING id) INSERT INTO offices SELECT ...` shape, `ON CONFLICT (external_id) DO NOTHING` on politicians, `NOT EXISTS` guard on offices:
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Emily Stevens', 'Emily', 'Stevens', NULL,
          true, false, false, true, -3209001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of School Trustees'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Clark County School District, Nevada, US')),
       p.id,
       'Trustee, District A', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3200060' AND d.district_type = 'SCHOOL' AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Apply 14× (7 Beaverton + 7 Hillsboro). All Phase-183 seats are elected (`is_appointed=false`, `is_appointed_position=false` — unlike CCSD's 7-elected/4-appointed split, there is no appointed branch this phase). Titles: `'Director, Zone N'` (Beaverton 1-7) / `'Director, Position N'` (Hillsboro 1-7); Chair/Vice-Chair appended as a suffix on the seat title exactly like CCSD's officer convention, e.g. `'Director, Zone 6 (Chair)'`, `'Director, Position 5 (Chair)'`, `'Director, Position 4 (Vice Chair)'`, `'Director, Zone 3 (Vice Chair)'`. External_id blocks: Beaverton `-4101921`..`-4101927`, Hillsboro `-4100024`..`-4100030` (Wave-0 re-confirms both ranges free).

**Post-verify DO block pattern** (1107 lines 436-487) — `RAISE EXCEPTION` on any mismatch (rolls back the whole migration), gates for gov count, office count, and section-split orphans. RESEARCH.md's own Pattern 2 already extends this to a 2-district dual-gate version — use that directly:
```sql
DO $$
DECLARE v_bsd_gov INTEGER; v_hsd_gov INTEGER; v_bsd_off INTEGER; v_hsd_off INTEGER; v_split INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_bsd_gov FROM essentials.governments WHERE name = 'Beaverton School District 48J, Oregon, US';
  SELECT COUNT(*) INTO v_hsd_gov FROM essentials.governments WHERE name = 'Hillsboro School District 1J, Oregon, US';
  IF v_bsd_gov <> 1 OR v_hsd_gov <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 gov each, found BSD=%, HSD=%', v_bsd_gov, v_hsd_gov;
  END IF;
  SELECT COUNT(*) INTO v_bsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4101920' AND d.district_type='SCHOOL' AND d.state='or';
  SELECT COUNT(*) INTO v_hsd_off FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id
    WHERE d.geo_id='4100023' AND d.district_type='SCHOOL' AND d.state='or';
  IF v_bsd_off <> 7 OR v_hsd_off <> 7 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 7 offices each, found BSD=%, HSD=%', v_bsd_off, v_hsd_off;
  END IF;
  SELECT COUNT(*) INTO v_split FROM essentials.geofence_boundaries gb
    WHERE gb.geo_id IN ('4101920','4100023') AND gb.mtfcc='G5420'
      AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id=gb.geo_id AND d.district_type='SCHOOL' AND d.state='or');
  IF v_split <> 0 THEN
    RAISE EXCEPTION 'Post-verification FAILED: section-split detector returned % orphan rows', v_split;
  END IF;
  RAISE NOTICE 'Post-verification PASSED: BSD gov=%/off=%, HSD gov=%/off=%, split_orphans=%',
    v_bsd_gov, v_bsd_off, v_hsd_gov, v_hsd_off, v_split;
END $$;
```
Consider also adding an `office_id` back-fill UPDATE (1107 lines 419-427 — `UPDATE politicians SET office_id = o.id ... WHERE external_id BETWEEN <more-negative> AND <less-negative>`) if this schema field is still populated on write in current practice — check a recent migration (182/181 chain) for whether this step is still needed before copying it verbatim.

**Ledger registration pattern** (1107 lines 489-497) — commit first, then register OUTSIDE the transaction:
```sql
COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1107', 'ccsd_board_of_trustees')
ON CONFLICT (version) DO NOTHING;
```
Use `('1203', 'or_westmetro_school_boards_wave1')`.

---

### `1204_or_westmetro_school_boards_wave1_headshots.sql` (migration, audit-only)

**Analog:** `C:/EV-Accounts/backend/migrations/1108_ccsd_trustees_headshots.sql`

**Header pattern** (1108 lines 1-19) — explicitly marks the file AUDIT-ONLY / not registered in the structural ledger, documents genuine gaps with reasons (no fabrication), and states the exact column list:
```sql
-- Migration 1108: CCSD Board of School Trustees headshots (politician_images)
--
-- Phase 166 Plan 02 — CCSD-01 (headshot portion).
-- AUDIT-ONLY: NOT registered in the structural ledger (structural ledger stays at 1107).
--
-- One INSERT block per SUCCESS trustee (7 of 11). Source: Ballotpedia infobox
-- portraits ... 600x750 4:5 crops mirrored to Storage
-- politician_photos/{uuid}-headshot.jpg. photo_license='press_use'.
--
-- DOCUMENTED GAPS (no fabrication — honest blanks, no row):
--   -3209003 Tameka Henry (elected, District C)        — no clean portrait found
--   ...
--
-- columns: (id, politician_id, url, type, photo_license); the removed image-origin
-- column is intentionally absent. type='default'. Idempotent via NOT EXISTS.
```
Phase 183 expects a clean 14/14 outcome (RESEARCH.md: "cleanest headshot situation in the milestone" — no fallback chain needed), so the gap-list section may end up empty; keep the section present as a template in case any Hillsboro low-resolution image genuinely fails quality (per D-R5, document rather than fabricate).

**Per-official INSERT pattern** (1108 lines 22-31):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -3209001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/76b03835-5935-4aa5-a407-e9e05f2a06e9-headshot.jpg',
       'default', 'press_use'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -3209001)
);
```
Repeat 14× against `-4101921`..`-4101927` / `-4100024`..`-4100030`. `photo_license` per actual source (district's own finalsite CDN → likely `'press_use'` matching Cornelius/CCSD district-hosted convention — confirm the exact license string used by the most recent phase, e.g. 182's headshot migration, at execution time). `type='default'` always (UI filters on this).
**No ledger registration step for this file** — 1108 has no `INSERT INTO supabase_migrations.schema_migrations` block at all (confirm this omission is intentional/current before copying — cross-check against the freshest headshot migration, e.g. Phase 182's, for whether audit-only files register or not).

---

### `_tmp-westmetro-school-wave1-headshots.py` (utility, headshot ETL pipeline)

**Primary analog:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` (freshest fixes: WR-01/WR-02/WR-C, circle-cutout inscribed-crop branch, env-derived CDN base — carry this shape forward even though the circle-cutout branch is expected to be a no-op for finalsite-hosted plain photos)
**Secondary analog:** `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py` (school-board-specific ROSTER list shape with `district_label`/`title` fields, and the `type='default'`/`photo_license` DB-insert convention specific to school boards)

**Config/env-load pattern** (cornelius lines 95-199) — derive CDN base from `SUPABASE_URL` rather than hardcoding the project ref (a fix `_tmp-or-school-headshots.py` predates and hardcodes instead — do NOT copy the hardcoded `CDN_BASE` from the older script):
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
SERVICE_KEY = _env.get('SUPABASE_SERVICE_ROLE_KEY', '')
DATABASE_URL = _env.get('DATABASE_URL', '')
BUCKET = 'politician_photos'

if not (SUPABASE_URL.startswith('https://') and '.supabase.co' in SUPABASE_URL):
    raise ValueError(
        f'SUPABASE_URL missing or malformed — cannot derive storage CDN base: {SUPABASE_URL!r}'
    )
_project_ref = SUPABASE_URL.split('//', 1)[1].split('.', 1)[0]
CDN_BASE = f'https://{_project_ref}.storage.supabase.co/storage/v1/object/public/{BUCKET}'

TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS

DESCRIPTIVE_HEADERS = {
    'User-Agent': 'EmpoweredVote/1.0 (headshot-pipeline; contact jmadison@empowered.vote)',
    'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
}
DOWNLOAD_TIMEOUT = 30
MIN_DIM = 100
```

**Roster shape** — blend both analogs: use `_tmp-or-school-headshots.py`'s per-member dict fields (`external_id`/`full_name`/`district_label`/`title`/`source_url`) since this phase is genuinely two districts, but use `_tmp-cornelius-headshots.py`'s simpler flat-list-with-UUID-resolved-at-runtime convention (`resolve_politician_id()` via psycopg2, NOT a hardcoded `politician_id` in the roster — Cornelius's approach is the more current/correct one; the older `_tmp-or-school-headshots.py` hardcodes UUIDs which risks drift if the structural migration is re-run):
```python
OFFICIALS = [
    {
        'ext_id': -4101921,
        'name': 'Van Truong',
        'url': 'https://resources.finalsite.net/images/.../van_Truong.jpg',
        'license': 'press_use',
        # Beaverton Zone 1
    },
    # ... 6 more Beaverton, 7 Hillsboro
]
```

**Guard-check pattern** (cornelius lines 144-156) — hard-fail fast on a malformed roster before any network call:
```python
if len({m['ext_id'] for m in OFFICIALS}) != len(OFFICIALS):
    raise ValueError('external_ids must be unique')
if len(OFFICIALS) != 14:
    raise ValueError('expect a full 14/14 outcome given confirmed direct-download sourcing')
if not all(m['license'] for m in OFFICIALS):
    raise ValueError('every official must carry a license string')
```

**UUID resolution pattern** (cornelius lines 206-215):
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

**Download pattern** (cornelius lines 218-234) — descriptive UA, explicit status/empty-body checks:
```python
def download_image(url: str) -> bytes:
    headers = dict(DESCRIPTIVE_HEADERS)
    resp = requests.get(url, headers=headers, timeout=DOWNLOAD_TIMEOUT, allow_redirects=True, verify=True)
    if resp.status_code != 200:
        raise Exception(f'HTTP {resp.status_code} for {url}')
    if len(resp.content) == 0:
        raise Exception(f'0-byte response body for {url}')
    return resp.content
```
Both target districts are HTTP 200, no WAF, no UA spoofing needed (unlike `_tmp-or-school-headshots.py`'s `verify=False` SSL-bypass hack for `ddouglas.k12.or.us` — that hack is NOT needed here, don't carry it forward).

**Crop/resize/composite pattern** (cornelius `crop_to_4_5` lines 237-267, `resize_600x750` lines 270-274, `process_headshot_bytes` lines 298-358) — crop-4:5-FIRST-then-resize order is load-bearing; the RGBA/circle-cutout detection branch should be kept intact even though it is expected to be a no-op for this phase's plain opaque finalsite photos (both districts' source images are standard opaque JPEGs per the researched URLs, not transparent-PNG cutouts):
```python
def process_headshot_bytes(raw_bytes: bytes) -> bytes:
    img = Image.open(io.BytesIO(raw_bytes))
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        # composite-onto-white / circle-cutout inscribed-crop branch (see cornelius script in full)
        ...
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    if img.width < MIN_DIM or img.height < MIN_DIM:
        raise Exception(f'Image too small: {img.width}x{img.height} (minimum {MIN_DIM}px)')
    img = crop_to_4_5(img)
    img = resize_600x750(img)
    if img.size != TARGET_SIZE:
        raise ValueError(f'Expected {TARGET_SIZE}, got {img.size}')
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    return buf.getvalue()
```
Note per RESEARCH.md's Assumption A3: several Hillsboro filenames (`_sm2`, `256x230px`) suggest low native resolution — expect upscaling below `MIN_DIM=100` is NOT a risk (256px well above 100px) but visible quality loss at 600×750 is possible; document a genuine gap per D-R5 rather than aggressively upscale if quality is bad, don't silently ship a blurry image.

**Upload pattern** (cornelius lines 277-295) — `x-upsert: true`, CDN URL derived from the same `SUPABASE_URL`-derived base used for download config:
```python
def upload_to_storage(politician_uuid: str, jpeg_bytes: bytes) -> str:
    filename = f'{politician_uuid}-headshot.jpg'
    url = f'{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}'
    headers = {
        'Authorization': f'Bearer {SERVICE_KEY}',
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true',
    }
    resp = requests.put(url, data=jpeg_bytes, headers=headers, timeout=60)
    if resp.status_code not in (200, 201):
        raise Exception(f'Storage upload failed: {resp.status_code} {resp.text}')
    return f'{CDN_BASE}/{filename}'
```

**WR-01/WR-02/WR-C fixes (carry forward verbatim, cornelius lines 72-90, 361-388, 456-531)** — these are the load-bearing "freshest fixes" the phase context explicitly calls out:
- WR-01: `main()` exits non-zero (`sys.exit(1)`) if ANY official failed, so a chained orchestrator step cannot apply migration 1204 on a silently-partial run.
- WR-C: guard `if len(OFFICIALS) > 0:` before indexing `OFFICIALS[0]` in the test-download guard.
- WR-02: `test_download_guard()` returns the verified bytes (not a bool) so the first official's `process_member()` call reuses those bytes instead of a redundant second HTTP round-trip.

```python
def main():
    ...
    guard_bytes = None
    if len(OFFICIALS) > 0:
        guard_bytes = test_download_guard(OFFICIALS[0])
    ...
    results = []
    try:
        for idx, member in enumerate(OFFICIALS):
            prefetched = guard_bytes if idx == 0 else None
            results.append(process_member(cursor, member, prefetched_bytes=prefetched))
            time.sleep(0.5)
    finally:
        cursor.close()
        conn.close()

    failures = [r for r in results if not r['success']]
    if failures:
        print(f'EXIT 1: {len(failures)} of {len(OFFICIALS)} headshot uploads failed — '
              f'do not apply migration 1204 without resolving or documenting each gap.')
        sys.exit(1)
```

**Manifest print pattern** (cornelius lines 506-519) — a final `SUCCESS:`/`FAILED:` line per official, feeding the executor's manual transcription into the 1204 migration's URL values:
```python
print('=== <NAME> HEADSHOT MANIFEST ===')
for r in results:
    if r['success']:
        print(f'SUCCESS: {r["ext_id"]} {r["name"]} {r["uuid"]} -> {r["cdn_url"]} [license={r["license"]}, source={r["source"]}]')
    else:
        print(f'FAILED: {r["ext_id"]} {r["name"]} -- {r["error"]}')
```

---

### `src/lib/coverage.js` (config, append 2 entries to `COVERAGE_SCHOOL_DISTRICTS`)

**Analog:** the existing CCSD entry, same file, lines 253-255 (exact template already confirmed live):
```javascript
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
];
```
Append (do not add `hasContext` — plain entry is the honest state per [[feedback_school_districts_search_only]] and the Phase 173 CCSD chip-reconciliation lesson):
```javascript
export const COVERAGE_SCHOOL_DISTRICTS = [
  { label: 'Clark County School District', browseGeoId: '3200060', browseMtfcc: 'G5420', browseStateAbbrev: 'NV' },
  { label: 'Beaverton School District 48J', browseGeoId: '4101920', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
  { label: 'Hillsboro School District 1J', browseGeoId: '4100023', browseMtfcc: 'G5420', browseStateAbbrev: 'OR' },
];
```
This array already feeds `ALL_COVERAGE_AREAS` (coverage.js line 273: `...COVERAGE_SCHOOL_DISTRICTS.map((d) => ({ ...d, kind: 'school district', stateAbbrev: d.browseStateAbbrev }))`) — no other file needs editing for search-only surfacing; `kind: 'school district'` and typeahead ranking are inherited automatically.

---

## Shared Patterns

### Idempotent guard convention (applies to all INSERT statements in both migrations)
**Source:** `1107_ccsd_board_of_trustees.sql` (governments/chambers/districts: `WHERE NOT EXISTS`) + `1108_ccsd_trustees_headshots.sql` (politician_images: `WHERE NOT EXISTS`); politicians use `ON CONFLICT (external_id) DO NOTHING`.
**Apply to:** every INSERT in 1203 and 1204 — no migration in this phase should ever be able to double-insert on a re-run.

### Casing convention (the #1 silent-failure pitfall, per RESEARCH.md Pitfall 2)
**Source:** `1107_ccsd_board_of_trustees.sql` header comments + consistent usage throughout.
**Apply to:** `districts.state` = lowercase (`'or'`); `governments.state` and `offices.representing_state` = uppercase (`'OR'`). Mixing these up silently zeroes out the office JOIN and the post-verify DO block's `RAISE EXCEPTION` is the only thing that will catch it.

### Post-verify DO block / rollback-on-mismatch convention
**Source:** `1107_ccsd_board_of_trustees.sql` lines 429-487.
**Apply to:** 1203 only (1204 is audit-only, headshot-count verification happens via a separate ad-hoc SQL gate per RESEARCH.md's Phase Requirements → Test Map, not an in-migration DO block).

### Section-split zero-orphan gate
**Source:** `1107_ccsd_board_of_trustees.sql` lines 470-483; also the milestone-wide `[[feedback_section_split_check]]` convention.
**Apply to:** the 1203 post-verify block, checked independently for both `4101920` and `4100023`.

### Headshot pipeline fixes (WR-01/WR-02/WR-C)
**Source:** `_tmp-cornelius-headshots.py` lines 72-90, 361-388, 456-531.
**Apply to:** the new `_tmp-westmetro-school-wave1-headshots.py` script in full — these are standing milestone-wide fixes, not Cornelius-specific.

### Crop-4:5-then-resize-600x750-Lanczos-q90 pipeline
**Source:** `_tmp-cornelius-headshots.py` `crop_to_4_5`/`resize_600x750`/`process_headshot_bytes` (lines 237-358); mirrors `[[feedback_headshot_resize_no_distort]]` and `[[feedback_headshot_circle_cutout_sources]]`.
**Apply to:** all 14 headshots. Circle-cutout branch is defensive/likely-unused this phase (finalsite sources are plain opaque photos per the researched URLs) but must not be stripped out.

### Antipartisan / party=NULL
**Source:** `1107_ccsd_board_of_trustees.sql` line 15 comment + every politician INSERT (`party` column always `NULL`).
**Apply to:** all 14 politician INSERTs in 1203.

---

## No Analog Found

None. Every file this phase touches has a close, recently-modified analog (1107/1108/254 for the migrations, `_tmp-cornelius-headshots.py`/`_tmp-or-school-headshots.py` for the pipeline script, and the existing `COVERAGE_SCHOOL_DISTRICTS` entry for coverage.js). This is consistent with RESEARCH.md's framing of Phase 183 as "the lightest-effort phase in the v20.0 milestone."

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`, `C:/EV-Accounts/backend/scripts/`, `src/lib/coverage.js`
**Files scanned:** `1107_ccsd_board_of_trustees.sql`, `1108_ccsd_trustees_headshots.sql`, `254_or_school_districts.sql` (referenced via RESEARCH.md excerpts), `_tmp-cornelius-headshots.py`, `_tmp-or-school-headshots.py`, `src/lib/coverage.js`
**Pattern extraction date:** 2026-07-04
