# Phase 191: Arizona State & Federal Government - Pattern Map

**Mapped:** 2026-07-08
**Files analyzed:** 5 (2 structural migrations, 2 audit-only headshot migrations, 1 headshot Python helper — House headshots may reuse the same helper file with a different roster, see note)
**Analogs found:** 5 / 5

**Repo note:** All files below live in `C:\EV-Accounts` (NOT the essentials repo). Migration
numbering per RESEARCH.md: structural = `1282`, audit-only headshots = `1283` (STATE_EXEC) and
`1284` (US House). Apply order: 1282 (structural) → source+upload headshots via Python helper →
1283 → 1284.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `backend/migrations/1282_az_state_exec_gap.sql` | migration (structural, registered) | batch / CRUD (INSERT) | `backend/migrations/270_md_state_executives.sql` (multi-official CTE shape) + `backend/migrations/1055_clark_county_commission.sql` (multi-officer-one-district collegial-body shape, for the 5 Corp Commissioners) | exact (composite of two direct analogs) |
| `backend/migrations/1283_az_state_exec_headshots.sql` | migration (audit-only, unregistered) | batch (INSERT `politician_images`) | `backend/migrations/1052_nv_controller_headshot.sql` | exact |
| `backend/migrations/1284_az_house_headshots.sql` | migration (audit-only, unregistered) | batch (INSERT `politician_images`) | `backend/migrations/1051_nv_house_headshots.sql` | exact |
| `backend/scripts/_tmp-az-state-exec-headshots.py` | utility (headshot pipeline) | file-I/O (download → crop → resize → upload) | `backend/scripts/_tmp-nv-controller-headshot.py` (single-official variant, extend to a 7-official ROSTER loop like the House script below) | exact |
| `backend/scripts/_tmp-az-house-headshots.py` | utility (headshot pipeline) | file-I/O (download → resize-only → upload) | `backend/scripts/_tmp-nv-house-headshots.py` | exact |

## Pattern Assignments

### `backend/migrations/1282_az_state_exec_gap.sql` (structural migration, batch/CRUD)

**Analogs:** `backend/migrations/270_md_state_executives.sql` (single-seat exec blocks) +
`backend/migrations/1050_nv_controller.sql` (single-new-official-under-existing-government
pre-flight shape) + `backend/migrations/1055_clark_county_commission.sql` (5-officers-share-1-district
collegial body shape, for the Corp Commission specifically).

**Pre-flight assert pattern** (from `1050_nv_controller.sql` lines 23-32, adapt geo_id to `'04'`):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE geo_id = '04') <> 1 THEN
    RAISE EXCEPTION
      'Pre-flight failed: expected exactly 1 State of Arizona government row (geo_id=04); found %',
      (SELECT COUNT(*) FROM essentials.governments WHERE geo_id = '04');
  END IF;
END $$;
```
Use this to assert the State of Arizona government row (`15436f29-38d2-4cc0-8958-9e74ba60fabf`,
`geo_id='04'`) pre-exists — do NOT insert it. Also worth a second pre-flight assert (new pattern,
no direct precedent needed — trivial `COUNT(*)=4` check) that the 4 existing AZ STATE_EXEC
officials (Hobbs/Mayes/Fontes/Yee) still exist, matching the "MUST NOT re-create" comment style in
`1050_nv_controller.sql` line 8.

**Single-seat chamber + district + politician + office block** (from `270_md_state_executives.sql`
lines 105-137, the Governor block — copy this exact shape for Superintendent and Mine Inspector,
substituting name/party/external_id/title):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'AZ', '04', 'Arizona Superintendent of Public Instruction', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'AZ' AND label = 'Arizona Superintendent of Public Instruction'
);

WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Tom Horne', 'Tom', 'Horne', 'Republican',
          true, false, false, true, -4004001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Superintendent of Public Instruction'
          AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '04')),
       p.id,
       'Superintendent of Public Instruction', 'AZ', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'AZ' AND d.label = 'Arizona Superintendent of Public Instruction'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers
                          WHERE name = 'Superintendent of Public Instruction'
                            AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '04'))
  );
```
**Mine Inspector variant (Pitfall 3):** politician row gets `is_appointed=true` for Presmyk
(mirrors `270_md_state_executives.sql` lines 241-276, the Dereck Davis Treasurer block, which uses
`is_appointed=true` on the politician). But UNLIKE Davis, the office row keeps
`is_appointed_position=false` (the office type is elected; only this holder's path differs — do
NOT copy Davis's `is_appointed_position=true` on the office). Document this distinction inline in
a migration comment exactly as RESEARCH.md Pitfall 3 specifies.

**5-officers-share-1-district collegial body block** (from `1055_clark_county_commission.sql`
lines 86-137, the district + first two commissioner blocks — this is the exact shape for the
Corporation Commission, just with `district_type='STATE_EXEC'` instead of `'COUNTY'` and
`state='AZ'` uppercase instead of `'nv'` lowercase since STATE_EXEC districts use uppercase per
the casing rule):
```sql
-- One shared district for all 5 commissioners:
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'STATE_EXEC', 'AZ', '04', 'Arizona Corporation Commission', '', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'STATE_EXEC' AND state = 'AZ' AND label = 'Arizona Corporation Commission'
);

-- One shared chamber, official_count=5 (unlike single-seat exec chambers which leave it NULL):
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'Corporation Commission', 'Arizona Corporation Commission',
       (SELECT id FROM essentials.governments WHERE geo_id = '04'), 5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Corporation Commission'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '04')
);

-- 5 politician+office blocks, each following the Clark County per-commissioner CTE shape
-- (1055 lines 105-137), all pointed at the SAME district_id/chamber_id via the WHERE clause
-- filters above (label='Arizona Corporation Commission' / name='Corporation Commission') —
-- the WHERE NOT EXISTS office guard uses (district_id, chamber_id) NOT politician_id, so it
-- naturally allows 5 distinct politicians onto the same district/chamber pair. Verify after
-- insert with: SELECT count(*) FROM offices WHERE district_id = (...) -- expect 5.
```
NOTE: the Clark County analog's per-block `WHERE NOT EXISTS` guard checks only
`(district_id, chamber_id)`, which would suppress commissioner #2-5 if copied verbatim (it matches
after commissioner #1 is inserted). Clark County works around this because each commissioner has
a DIFFERENT `chamber_id` in that migration... re-check actual Clark County office INSERT WHERE
clause at execute-time — if it truly filters only on `(district_id, chamber_id)` with no
`politician_id`, the planner MUST add a `politician_id`-aware guard (e.g.
`NOT EXISTS (... WHERE o.district_id = d.id AND o.politician_id = p.id)`) so all 5 Corp Commission
rows actually insert. Flag this as a plan-time execution detail, not a blocker for pattern mapping.

**Office-count verification pattern** (from RESEARCH.md, already a designed check — use directly):
```sql
SELECT o.politician_id, o.district_id, p.full_name
FROM essentials.offices o
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE o.district_id = (SELECT id FROM essentials.districts
                        WHERE district_type='STATE_EXEC' AND state='AZ'
                        AND label='Arizona Corporation Commission');
-- Expected: 5 rows
```

**Back-fill pattern** (from `1050_nv_controller.sql` lines 93-99 / `270_md_state_executives.sql`
lines 278-287 — scope the BETWEEN range to the full 7-slot AZ range):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -4004007 AND -4004001
  AND p.office_id IS NULL;
```

**Registration footer** (from `1050_nv_controller.sql` lines 103-106 — OUTSIDE the `BEGIN`/`COMMIT`
block, since MD's 270 file registers via a separate top-level mechanism while NV's 1050 shows the
explicit ledger INSERT most relevant to this milestone family):
```sql
COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1282', 'az_state_exec_gap')
ON CONFLICT (version) DO NOTHING;
```

---

### `backend/migrations/1283_az_state_exec_headshots.sql` (audit-only, batch)

**Analog:** `backend/migrations/1052_nv_controller_headshot.sql` (single-row shape — repeat ×7,
one block per Horne/Presmyk/Myers/Walden/Márquez Peterson/Thompson/Lopez).

**Exact shape to copy verbatim, ×7** (from `1052_nv_controller_headshot.sql` lines 15-23):
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4004001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{UUID}-headshot.jpg',
       'default', 'cc_by_sa_2.0'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4004001)
);
```
Column list is EXACTLY `(id, politician_id, url, type, photo_license)` — **no `photo_origin_url`**
(Pitfall 5, both files confirm this). `photo_license` varies per official: `cc_by_sa_2.0` (Horne,
per RESEARCH.md), `cc_by_2.0` (Márquez Peterson if Wikimedia source used), `press_use` (Myers,
Walden, Thompson, Lopez per azcc.gov unlicensed-portrait convention), and whatever license the
Presmyk fallback source carries (flag as `checkpoint:human-verify` if unresolved, per NV 159's
Andy Matthews precedent). File header comment should follow `1052`'s convention: note this is
audit-only, applied via `execute_sql` (not `apply_migration`), and that the `{UUID}` literals are
each official's actual politician UUID captured from migration 1282's output — NOT re-derivable at
write time since `1282` uses `gen_random_uuid()`.

---

### `backend/migrations/1284_az_house_headshots.sql` (audit-only, batch)

**Analog:** `backend/migrations/1051_nv_house_headshots.sql` (4-row shape — extend to 8 rows: all
9 AZ House reps except Grijalva who already has one).

**Exact shape to copy verbatim, ×8** (from `1051_nv_house_headshots.sql` lines 17-26, per rep):
```sql
-- David Schweikert (CD-1, external_id=-4001)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{UUID}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4001)
);
```
Repeat for external_id `-4002, -4003, -4004, -4005, -4006, -4008, -4009` (skip `-4007` Grijalva —
already has a headshot). `photo_license='public_domain'` for all 8 (unitedstates.github.io source).
Header comment should list bioguide IDs per rep, matching `1051`'s header table (lines 11-15).

---

### `backend/scripts/_tmp-az-state-exec-headshots.py` (utility, file-I/O)

**Analog:** `backend/scripts/_tmp-nv-controller-headshot.py` — extend the single-official pattern
into a `ROSTER` list-of-dicts + loop, mirroring the loop structure already used in
`_tmp-nv-house-headshots.py` (see below) since this file now processes 7 officials with mixed
sources (Wikimedia CC for 2, azcc.gov `press_use` for 4, fallback-chain for 1).

**Config block (env-loading + constants)** — copy verbatim from
`_tmp-nv-controller-headshot.py` lines 39-68:
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
CDN_BASE = 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos'

TARGET_SIZE = (600, 750)
JPEG_QUALITY = 90
RESAMPLE = Image.Resampling.LANCZOS

# Wikimedia/azcc.gov reject generic browser UAs — descriptive UA required.
BROWSER_HEADERS = {
    'User-Agent': 'EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)',
    'Accept': 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
}
DOWNLOAD_TIMEOUT = 30
```

**Crop-to-4:5 (needed since most AZ sources are NOT already 4:5, unlike House)** — copy verbatim
from `_tmp-nv-controller-headshot.py` lines 98-118 (`crop_to_4_5` function) and `resize_600x750`
lines 121-125.

**Per-official loop shape** — combine the single-lookup pattern in
`_tmp-nv-controller-headshot.py` lines 155-179 (runtime UUID resolution via
`SELECT id FROM essentials.politicians WHERE external_id = %s`) with the `for m in ROSTER:` +
try/except + manifest-printing loop shape from `_tmp-nv-house-headshots.py` lines 140-177 (this is
the more scalable pattern for 7 officials with per-official failure isolation — a bad Presmyk
fetch should not block the other 6). Build a `ROSTER` list of 7 dicts (external_id, full_name,
title, source_url, source_domain, photo_license, is_required) with `is_required=False` for
Presmyk only (per RESEARCH.md's `checkpoint:human-verify` fallback path), `is_required=True` for
the other 6. End with the exact manifest print-block shape from `_tmp-nv-house-headshots.py` lines
160-177 (`SUCCESS:`/`FAILED:` lines + `TOTALS:` line + required-failure `sys.exit(1)` gate).

---

### `backend/scripts/_tmp-az-house-headshots.py` (utility, file-I/O)

**Analog:** `backend/scripts/_tmp-nv-house-headshots.py` — copy nearly verbatim, extend `ROSTER`
from 4 to 8 entries (all AZ House reps except Grijalva, external_ids `-4001, -4002, -4003, -4004,
-4005, -4006, -4008, -4009`), substitute each bioguide ID from RESEARCH.md's table (S001183,
C001132, A000381, S001211, B001302, C001133, H001098, G000565), and substitute each politician
UUID (resolve via `SELECT id FROM essentials.politicians WHERE external_id = ...` at plan/execute
time, matching the "UUIDs are DB-confirmed" comment convention in the NV file, line 15).

**Resize-only (no crop) since source is already 4:5** — copy verbatim from
`_tmp-nv-house-headshots.py` lines 107-109 (`resize_600x750`) and the 404-fallback download
function lines 93-104 (`download_image` — falls back to `clerk.house.gov/images/members/{bioguide}.jpg`
on primary 404, directly reusable for the Pitfall 4 Grijalva-style lag risk on any future
freshman-member gap, though not needed for these 8 since all are HTTP-200-verified).

**Manifest + required-failure gate** — copy verbatim from `_tmp-nv-house-headshots.py` lines
130-177 (`main()` — loop, try/except per rep, `time.sleep(0.5)` between requests, manifest print
block, `sys.exit(1)` on any required failure).

---

## Shared Patterns

### Idempotency guards (applies to all migration files)
**Source:** `1050_nv_controller.sql`, `270_md_state_executives.sql`, `1055_clark_county_commission.sql`
**Apply to:** `1282_az_state_exec_gap.sql`
- `chambers`/`districts` have NO unique constraint → always guard INSERT with
  `WHERE NOT EXISTS (SELECT 1 FROM ... WHERE <natural-key columns>)`.
- `politicians.external_id` HAS a unique constraint → use
  `INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id` inside a `WITH ins_p AS (...)` CTE.
- `offices` guard must be `NOT EXISTS (... WHERE o.district_id = d.id AND o.chamber_id = ... AND o.politician_id = p.id ...)`
  — a `(district_id, chamber_id)`-only guard silently suppresses inserts for the 2nd-5th
  Corporation Commissioner sharing the same district/chamber (see flag under the 1282 section
  above).

### Never include the GENERATED ALWAYS chambers column
**Source:** `1050_nv_controller.sql` line 9, `1055_clark_county_commission.sql` line 25
**Apply to:** `1282_az_state_exec_gap.sql`
The `chambers` table has a `GENERATED ALWAYS` identifier/path column — never list it in an INSERT
column list; only `(id, name, name_formal, government_id[, official_count])`.

### STATE_EXEC/NATIONAL casing rule
**Source:** `270_md_state_executives.sql` lines 19-24, `1050_nv_controller.sql` lines 10-12
**Apply to:** `1282_az_state_exec_gap.sql`
`districts.state='AZ'` UPPERCASE for STATE_EXEC and NATIONAL tiers (lowercase silently breaks
backend routing — the OR-223a / NV lesson). This is DIFFERENT from COUNTY-tier districts (see
`1055_clark_county_commission.sql` line 27: `state='nv'` lowercase for COUNTY) — do not conflate
the two casing rules across tiers.

### `photo_origin_url` does not exist
**Source:** `1052_nv_controller_headshot.sql` line 8, `1051_nv_house_headshots.sql` line 9
**Apply to:** `1283_az_state_exec_headshots.sql`, `1284_az_house_headshots.sql`
`politician_images` columns are exactly `(id, politician_id, url, type, photo_license, focal_point)`
— never add `photo_origin_url` (removed from schema; a historical planning-doc artifact).

### Headshot pipeline: descriptive User-Agent required
**Source:** `_tmp-nv-controller-headshot.py` lines 62-67
**Apply to:** `_tmp-az-state-exec-headshots.py` (Wikimedia + azcc.gov sources)
Wikimedia (and by the same WAF-avoidance logic, likely azcc.gov) rejects generic browser UAs with
HTTP 429/403 — always send
`'User-Agent': 'EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)'`.

### Crop-first, never stretch
**Source:** `_tmp-nv-controller-headshot.py` lines 98-118 (`crop_to_4_5`)
**Apply to:** `_tmp-az-state-exec-headshots.py`
Center-crop width if wider than 4:5; top-crop (keep head, crop bottom) if taller than 4:5. Never
resize-with-distortion to force the ratio. `_tmp-az-house-headshots.py` does NOT need this
function — House sources are already 4:5, resize-only.

### Migration registration split
**Source:** `1050_nv_controller.sql` lines 103-106 vs `1052_nv_controller_headshot.sql` (no footer at all)
**Apply to:** `1282` (register) vs `1283`/`1284` (do NOT register)
Structural migrations end with an `INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES (...) ON CONFLICT (version) DO NOTHING;` OUTSIDE the `BEGIN`/`COMMIT` block. Audit-only
headshot migrations have NO such footer — they are applied via `execute_sql`, never
`apply_migration`, and the ledger MAX stays unchanged after they run.

## No Analog Found

None. All 5 files to be created have a direct, structurally-identical analog in the NV 159 /
MD 270 / Clark County 1055 family. The one execution-time nuance (Corp Commission office guard
needing a `politician_id` check, not just `(district_id, chamber_id)`) is a planner-level detail
flagged inline above, not a missing-analog gap.

## Metadata

**Analog search scope:** `C:\EV-Accounts\backend\migrations\*nv*.sql`,
`C:\EV-Accounts\backend\migrations\105*.sql`, `C:\EV-Accounts\backend\migrations\*md*.sql`,
`C:\EV-Accounts\backend\migrations\*az*.sql` (none relevant — only 2026-election-seed files exist
for AZ, no state-exec/federal precedent), `C:\EV-Accounts\backend\scripts\_tmp-*headshot*.py`.
**Files scanned:** 1050, 1051, 1052, 1053, 1054, 1055 (partial), 270, 271 (not read, same family
as 270), `_tmp-nv-controller-headshot.py`, `_tmp-nv-house-headshots.py`.
**Pattern extraction date:** 2026-07-08
