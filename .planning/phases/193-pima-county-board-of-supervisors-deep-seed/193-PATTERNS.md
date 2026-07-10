# Phase 193: Pima County Board of Supervisors Deep-Seed - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 8 (5 backend new, 3 backend audit-only migrations grouped, 2 frontend modified, 2 banner-toolchain reused-as-is)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Repo | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `backend/scripts/load-pima-supervisor-boundaries.ts` | EV-Accounts | geofence loader (one-time ETL) | file-I/O (HTTP fetch → PostGIS INSERT) | `backend/scripts/load-lv-ward-boundaries.ts` (rings→GeoJSON `MapServer` pattern) | exact — same `f=json` ArcGIS `MapServer` shape, same helper needed verbatim |
| `backend/migrations/1288_pima_county_board_of_supervisors.sql` | EV-Accounts | structural migration (government/chamber/districts/offices) | CRUD (transactional seed) | `backend/migrations/1120_washco_commission.sql` (district-per-office shape) PLUS `backend/migrations/1055_clark_county_commission.sql` (zero-footprint Chair) | exact — hybrid of two direct analogs, both fully read |
| `backend/migrations/1289_pima_county_headshots.sql` | EV-Accounts | audit-only migration (politician_images seed) | CRUD (batch INSERT, idempotent) | `backend/migrations/1287_az_legislature_headshots.sql` | exact — identical column shape, same `WHERE NOT EXISTS` idempotency |
| `backend/scripts/_tmp-pima-supervisors-headshots.py` | EV-Accounts | headshot ETL pipeline (gitignored, orchestrator-run) | file-I/O (download → crop/resize → Storage upload) | `backend/scripts/_tmp-az-legislature-headshots.py` | exact — reuse crop_to_4_5/resize_600x750/upload_to_storage verbatim; only ROSTER + source-URL builder change |
| `backend/migrations/1290..1294_pima_supervisor_N_stances.sql` (5 files, one per supervisor) | EV-Accounts | audit-only migration (compass stances) | CRUD (evidence-only INSERT, one politician at a time) | `backend/migrations/326_spanberger_stances.sql` (single-officeholder, all-topics, evidence-only shape) | role-match — same INSERT/topic-UUID-table/sources-array shape; Pima excludes the 8 judicial-* topics (36/36, not 44/44) |
| `src/lib/coverage.js` | essentials (this repo) | config/data (COVERAGE_COUNTIES surfacing) | CRUD (static array append) | itself — existing `COVERAGE_COUNTIES` array (Clark County / Washington County entries) | exact — same file, append one entry |
| `src/lib/buildingImages.js` | essentials (this repo) | config/data (CURATED_LOCAL banner keying) | CRUD (static object append) | itself — existing `CURATED_LOCAL` entries (any state-scoped `{state, src}` city/county entry) | exact — same file, append one entry; first COUNTY-tier key ever added here |
| Pima County banner asset (Catalinas/Sonoran-desert photo) | essentials (this repo) | asset processing (banner image) | file-I/O (download → crop/resize → Storage upload) | `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py` | exact — reuse as-is, no code changes, only new `--input`/`--output`/`--dest` args |

## Pattern Assignments

### `backend/scripts/load-pima-supervisor-boundaries.ts` (geofence loader)

**Analog:** `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts` (read in full)

Pima's endpoint is a classic ArcGIS `MapServer` (not `FeatureServer`), so it returns
`geometry.rings` via `f=json` — exactly like LV, NOT like WashCo's `FeatureServer`
`f=geojson` direct-GeoJSON path (`load-washco-commissioner-boundaries.ts`, also read
in full, is the wrong shape for the fetch — but is worth reading for the migration's
pre-flight-assertion count style since Pima also has a small, fixed feature count).

**Config block to copy (lines 42-58 of the LV file), replace values:**
```typescript
// CRITICAL: outSR=4326 required — Pima MapServer native SRID is 2868 (AZ State Plane).
// CRITICAL: f=json (NOT f=geojson) — returns ArcGIS JSON rings, not GeoJSON.
const PIMA_SUPERVISOR_URL =
  'https://gisdata.pima.gov/arcgis1/rest/services/' +
  'GISOpenData/Boundaries/MapServer/5/query' +
  '?where=1%3D1&outFields=DISTRICT,NAME&returnGeometry=true&f=json&outSR=4326';

const MTFCC          = 'X0019';
const STATE_CODE     = 'az';    // CRITICAL: lowercase — required for LOCAL-tier routing
const SOURCE         = 'gisdata.pima.gov-boundaries-mapserver5-2026';
const GEO_ID_PREFIX  = 'pima-az-supervisor-district-';
const EXPECTED_COUNT = 5;
```

**Rings→GeoJSON helper — copy verbatim (LV file, lines 93-100):**
```typescript
function arcgisRingsToGeoJson(rings: number[][][]): string {
  return JSON.stringify({ type: 'Polygon', coordinates: rings });
}
```

**Feature-map keying and validation loop — copy the shape at LV lines 122-149**,
substituting `WARD` → `DISTRICT` (Pima's field name, confirmed live: integer 1-5) and
`Ward ${n}` → the `NAME` attribute (already matches the roster, e.g. "REX SCOTT").
Divergence: Pima's 5 features are all single-ring (RESEARCH confirmed), so the
`ST_MakeValid` fallback (LV lines 183-205, copy verbatim as defensive insurance) is
not expected to trigger, but keep the guard exactly as written — same INSERT/repair
pattern, same `RETURNING ST_IsValid`.

**INSERT statement — copy verbatim (LV lines 165-175):**
```typescript
const result = await pool.query(
  `INSERT INTO essentials.geofence_boundaries
     (id, geo_id, mtfcc, state, name, geometry, source)
   VALUES (gen_random_uuid(), $1, '${MTFCC}', '${STATE_CODE}', $2,
     public.ST_Multi(public.ST_SetSRID(public.ST_GeomFromGeoJSON($3), 4326)),
     $4)
   ON CONFLICT (geo_id, mtfcc) DO NOTHING
   RETURNING public.ST_GeometryType(geometry) AS gtype, public.ST_IsValid(geometry) AS valid`,
  [geoId, name, geomJson, SOURCE],
);
```

---

### `backend/migrations/1288_pima_county_board_of_supervisors.sql` (structural)

**Primary analog:** `C:/EV-Accounts/backend/migrations/1120_washco_commission.sql` (read in full) — for the split
COUNTY/LOCAL district shape and the pre-flight geofence-count assertion.
**Secondary analog:** `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` (read in full) — for the
zero-DB-footprint Chair modeling (Pattern 2 in RESEARCH.md).

**Critical divergence from WashCo:** WashCo has a Chair as a SEPARATE 6th office on
the COUNTY district (`title='County Chair'`) distinct from 4 LOCAL commissioners.
Pima's D-02 forbids this — **drop the Chair-on-COUNTY block entirely.** All 5
supervisors get the LOCAL-district shape WashCo used for its D1-D4 commissioners
(WashCo migration lines 113-148 = the block to replicate 5×, not 4×). Do NOT insert
or touch the pre-existing COUNTY row `geo_id='04019'` at all (Pitfall 2: it is a
3-way collision with STATE_UPPER/STATE_LOWER SD-19/HD-19 — never bare `geo_id='04019'`).

**Government + chamber INSERT — copy shape verbatim (WashCo lines 52-85), substitute names:**
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Pima County, Arizona, US', 'County', 'AZ', NULL, '04019'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'Pima County, Arizona, US');

INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'Board of Supervisors', 'Pima County Board of Supervisors',
       (SELECT id FROM essentials.governments WHERE name = 'Pima County, Arizona, US'), 5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Supervisors'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Pima County, Arizona, US')
);
```

**Pre-flight geofence assertion — copy verbatim (WashCo lines 105-111), substitute mtfcc/count:**
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'az' AND mtfcc = 'X0019') < 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 5 X0019 geofences found — run load-pima-supervisor-boundaries.ts before applying this migration.';
  END IF;
END $$;
```

**5× LOCAL district INSERT — copy the per-district block shape verbatim (WashCo lines 113-148, repeat 5x not 4x):**
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', 'pima-az-supervisor-district-1',
       'Pima County Supervisor District 1', 'X0019'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'pima-az-supervisor-district-1' AND district_type = 'LOCAL' AND state = 'az'
);
-- repeat for districts 2-5
```

**Politician + office block — copy the Clark County `WITH ins_p AS (...) INSERT INTO offices` shape
verbatim (Clark lines 105-135), 5 blocks, one per supervisor, each linking to its OWN
LOCAL X0019 district (NOT all sharing one COUNTY district like Clark does — that is
the ONE deliberate divergence from Clark: swap `d.geo_id = '32003' AND d.district_type = 'COUNTY'`
for `d.geo_id = 'pima-az-supervisor-district-N' AND d.district_type = 'LOCAL'`).
Keep Clark's title convention `'Supervisor, District N'` (RESEARCH Open Question 2
recommends this normalized form over pima.gov's inconsistent CMS phrasing), keep
`role_canonical = NULL` on all 5 (Chair = zero footprint, Clark precedent), keep
`party` stored-but-never-displayed (antipartisan), `ext_id` range `-4007001..-4007005`:**
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Rex Scott', 'Rex', 'Scott', 'Democratic',
          true, false, false, true, -4007001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Board of Supervisors'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'Pima County, Arizona, US')),
       p.id, 'Supervisor, District 1', 'AZ', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'pima-az-supervisor-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'az'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```
Andrés Cano (District 5, appointed) needs `is_appointed = true` per RESEARCH (April
2025 appointment, succession already documented in Phase 191) — the only roster
member that diverges from `is_appointed=false` on the other 4.

**office_id back-fill — copy verbatim (WashCo/Clark lines 327-332 / 334-339, adjust range):**
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -4007005 AND -4007001
  AND p.office_id IS NULL;
```

**Post-verification DO block — copy WashCo's 4-gate shape (lines 342-400), but Gate (b)
must NOT exist (there is no Chair-on-COUNTY office in Pima) and Gate (c)'s expected
count is 5, not 4:**
```sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_office_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments WHERE name = 'Pima County, Arizona, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 1 Pima County government row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_office_count
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id LIKE 'pima-az-supervisor-district-%'
    AND d.district_type = 'LOCAL' AND d.state = 'az';
  IF v_office_count <> 5 THEN
    RAISE EXCEPTION 'Post-verification FAILED: expected 5 supervisor offices on LOCAL X0019 districts, found %', v_office_count;
  END IF;

  RAISE NOTICE 'Post-verification PASSED: gov_count=%, office_count=%', v_gov_count, v_office_count;
END $$;

COMMIT;

INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1288', 'pima_county_board_of_supervisors')
ON CONFLICT (version) DO NOTHING;
```
(Ledger registration is the 2-column `(version, name)` form — same as both analogs;
re-verify disk MAX=1287/ledger MAX=1286 at execute time per Pitfall 5 before trusting
"1288" literally.)

---

### `backend/scripts/_tmp-pima-supervisors-headshots.py` (headshot pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-az-legislature-headshots.py` (read in full)

Reuse verbatim: `crop_to_4_5()` (lines 285-307), `resize_600x750()` (lines 310-314),
`process_headshot_bytes()` (lines 334-351, crop-first-then-resize order), `upload_to_storage()`
(lines 317-331, `x-upsert: true` PUT to `politician_photos/{uuid}-headshot.jpg`),
`resolve_politician_id()` (lines 251-261, parameterized `external_id = %s`, never
hardcode a UUID), the env-load block (lines 206-217), `dry_run_head_check()` (lines
379-395, HEAD every roster URL before any real batch work), and the `HEADERS`
descriptive User-Agent (lines 231-234).

**What changes:** the `ROSTER` list (5 entries, `external_id` -4007001..-4007005,
`politician_id` captured from migration 1288's actual `gen_random_uuid()` output —
NOT invented ahead of time, same convention as AZ-LEG line 75-78), the guard
assertions (`assert len(ROSTER) == 5`, not 90/30/60), and `source_url_for()` — Pima's
source is the CivicPlus CMS asset host, not azleg.gov:
```python
def source_url_for(member: dict) -> str:
    """CivicPlus asset URL is per-supervisor (uuid-keyed), not a filename pattern —
    the 5 URLs must be hardcoded per member (RESEARCH confirmed all 5 reachable,
    no WAF, HTTP 200)."""
    return member['photo_url']  # e.g. https://content.civicplus.com/api/assets/az-pimacounty/{uuid}?cache=1800
```
`photo_license = 'us_government_work'` for all 5 (official county-hosted portraits,
same convention as every prior `.gov`-sourced pipeline). `MIN_DIM = 100` threshold
and `TARGET_SIZE = (600, 750)` / `JPEG_QUALITY = 90` / `RESAMPLE = LANCZOS` carry over
unchanged.

**Orchestration note to preserve verbatim (AZ-LEG lines 10-17):** this script is
gitignored (`backend/scripts/_*`), never committed; the executor only WRITES it to
disk, the ORCHESTRATOR runs it (PIL/requests/psycopg2 + Storage access live only in
the orchestrator shell) and then applies the audit migration authored from the
emitted manifest.

---

### `backend/migrations/1289_pima_county_headshots.sql` (audit-only, unregistered)

**Analog:** `C:/EV-Accounts/backend/migrations/1287_az_legislature_headshots.sql` (read pages 1-845 of 1019 — pattern
fully established by line 845, remaining lines are repetition)

Copy the per-row shape verbatim, 5 rows instead of 90:
```sql
-- Rex Scott (District 1, external_id=-4007001)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4007001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4007001)
);
```
Columns are exactly `(id, politician_id, url, type, photo_license)` — no
`photo_origin_url` column (confirmed by the analog's header comment, line 12).
Header comment block (analog lines 1-21) should be copied and adapted: state clearly
this is AUDIT-ONLY, NOT registered in the migration ledger, applied via `psql -f`
AFTER the Python pipeline uploads to Storage.

---

### `backend/migrations/1290..1294_pima_supervisor_N_stances.sql` (audit-only, one per supervisor)

**Analog:** `C:/EV-Accounts/backend/migrations/326_spanberger_stances.sql` (read header + first stance block, lines 1-80)

Copy the file-header shape verbatim: topic-UUID reference comment block (analog
lines 16-60, paste the same 44-topic UUID table — Pima's research just skips the 8
`judicial-*` rows when writing INSERTs, per Pitfall 6/RESEARCH — do not delete them
from the reference comment, only from the actual INSERT statements), `BEGIN;` /
`COMMIT;` wrapper, and the two-table INSERT pattern per topic:
```sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('<supervisor-uuid>', '<topic-uuid>', <1.0-5.0>)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('<supervisor-uuid>', '<topic-uuid>',
        $$<evidence-based reasoning, cited>$$,
        ARRAY['<source-url-1>', '<source-url-2>', ...])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
**Divergence:** Spanberger (analog) is a single statewide executive researched
against all 44 topics; Pima supervisors are non-judicial county officials — 36/36
topics only (44 minus 8 `judicial-*` keys), and topics with zero evidence are
omitted entirely (no row at all — never a neutral default, per D-03/global
`feedback_stance_no_default_value` convention). One file per supervisor (5 files),
researched one at a time per project quota convention
(`feedback_stance_research_one_at_a_time`). Sources policy note in the analog header
(aggregation indexes preferred; RESEARCH's evidence-source list for Pima is Legistar,
AZ Luminaria, AZPM, Tucson Sentinel, Arizona Daily Star/tucson.com) should be copied
and adapted per-supervisor.

---

### `src/lib/coverage.js` (COVERAGE_COUNTIES entry)

**Analog:** the existing `COVERAGE_COUNTIES` array itself (lines 231-248, this file) — specifically the
Clark County row (line 247) and Washington County row (line 236), both standalone
counties with `hasContext: true` once stances exist.

**Exact pattern to append:**
```javascript
{ label: 'Pima County', browseGovernmentList: ['04019'], browseStateAbbrev: 'AZ', hasContext: true },
```
Insert alphabetically is NOT enforced in this array (entries are grouped ad hoc by
state-addition order) — append near the other counties, order is cosmetic only.
`hasContext: true` should only be set once ≥1 stance row actually exists in
`inform.politician_answers` (matches the file's own doc comment, line 5) — if the
banner/coverage wave runs before the stance wave, stage this as `hasContext: false`
first per the established WashCo precedent (WashCo shows `hasContext: true` already
landed, confirming the convention: flip it on once stances are live, not before).

---

### `src/lib/buildingImages.js` (CURATED_LOCAL entry)

**Analog:** any existing state-scoped single-variant entry in `CURATED_LOCAL`, e.g. `berkeley` (line 222) or
`henderson` (line 400) — simple `{ state, src }` object, no array-of-variants needed
(no other "Pima County" exists elsewhere in the app to collide with).

**Exact pattern to append (inside the `CURATED_LOCAL` object, with an attribution comment above it matching the file's existing convention, e.g. lines 391-398):**
```javascript
// Pima County banner (Wikimedia Commons; state-scoped 'AZ'). First COUNTY-tier
// CURATED_LOCAL entry (BANR-01) — Santa Catalina Mountains / Sonoran-desert
// (saguaro) landscape, kept visually distinct from the future Tucson CITY banner
// (Phase 194) and the AZ STATE banner (Downtown Phoenix skyline).
//   pima county - <title> | <author> | <license>
'pima county': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pima-county.jpg' },
```
Note Pitfall 7 (RESEARCH): this key only reliably renders via the `COVERAGE_COUNTIES`
browse path (`browse_label: 'Pima County'` → `representingCity` in `Results.jsx`), not
via an arbitrary address (a Tucson-area address parses to "Tucson" via
`parseCityFromAddress`, not "Pima County") — this is expected, pre-existing behavior
identical to Clark County/Washington County, not a defect to fix in this phase.
`getBuildingImages()` itself (lines 490-531) needs NO code change — the substring
match (`city.includes(key)`) and state-scoping logic already handle a county label
exactly like a city label.

---

### Pima County banner asset (process + upload)

**Analog:** `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py` (both read in full, this repo) — reused
as-is, zero code changes.

**Commands (adapt path/filename only):**
```bash
python scripts/banners/process_banner.py --url <wikimedia-source-url> --output /tmp/pima-county.jpg --vertical-anchor 0.3
# --vertical-anchor tunable per source (0.3-0.5 typical for mountain/skyline shots
# per existing attribution comments in buildingImages.js, e.g. gresham/hillsboro)

export SUPABASE_SERVICE_ROLE_KEY=<key from C:/EV-Accounts/backend/.env>
python scripts/banners/upload_banner.py --file /tmp/pima-county.jpg --dest cities/pima-county.jpg
```
Destination path convention is `cities/<slug>.jpg` (per `upload_banner.py`'s own
docstring, line 12, `D-05`) even though this is a COUNTY government — the storage
path tier is keyed by banner TYPE (city vs. state vs. national), not by government
type, and `cities/` is correct here since Clark/WashCo never got a banner and no
`counties/` tier exists.

## Shared Patterns

### Casing convention (applies to loader + structural migration)
**Source:** every prior AZ phase (190/191/192) + every prior custom-geofence phase (161/162/175), confirmed again in RESEARCH Pitfall 3.
```
essentials.districts.state       = 'az'  (lowercase) — LOCAL/COUNTY/STATE_UPPER/STATE_LOWER routing key
essentials.governments.state     = 'AZ'  (uppercase) — free-text label
essentials.offices.representing_state = 'AZ'  (uppercase) — free-text label
```
Apply to: `load-pima-supervisor-boundaries.ts`, `1288_pima_county_board_of_supervisors.sql`.

### Idempotency convention (applies to all migrations)
**Source:** `1120_washco_commission.sql` / `1055_clark_county_commission.sql` / `1287_az_legislature_headshots.sql`.
```sql
-- governments/chambers/districts: WHERE NOT EXISTS guard (no unique constraint on name/geo_id)
-- politicians: ON CONFLICT (external_id) DO NOTHING
-- offices: WHERE NOT EXISTS (district_id, politician_id)
-- politician_images: WHERE NOT EXISTS (politician_id)
-- politician_answers/context: ON CONFLICT (politician_id, topic_id) DO UPDATE
```
Apply to: 1288 (structural), 1289 (headshots), 1290-1294 (stances).

### Section-split / district-collision guard (Pitfall 2)
**Source:** RESEARCH Pitfall 2, confirmed live (`04019` is a 3-way COUNTY/STATE_UPPER/STATE_LOWER collision).
Never join or filter on bare `geo_id = '04019'`; always scope with `AND district_type = 'LOCAL' AND mtfcc = 'X0019'`
for the 5 new supervisor districts, and never let migration 1288 touch the pre-existing COUNTY row at all.
Apply to: `1288_pima_county_board_of_supervisors.sql` exclusively (the loader never touches `essentials.districts`).

### Zero-DB-footprint Chair (D-02, Pattern 2)
**Source:** `1055_clark_county_commission.sql`, live-verified (`title='Commissioner (District A)'`, no "(Chair)" suffix, `role_canonical=NULL`).
Apply to: the Jennifer Allen (District 3) office row in 1288 — no title-string annotation, no separate office, no `role_canonical` value. Chair status is informational-only (SUMMARY.md), not stored.

### Orchestrator-run vs. executor-authored split
**Source:** every prior AZ phase's non-obvious-project-state note (190/191/192), reconfirmed in RESEARCH.
`gsd-executor` has NO Supabase MCP/Storage access. The executor:
- writes `load-pima-supervisor-boundaries.ts`, `1288...sql`, `_tmp-pima-supervisors-headshots.py`, `1289...sql`, `1290-1294...sql` to disk
- does NOT run `npx tsx`, does NOT `psql -f` apply, does NOT run the Python pipeline, does NOT touch Storage
The orchestrator runs the loader, applies migrations via `psql -f` against `C:/EV-Accounts/backend/.env` `DATABASE_URL`, runs the headshot/banner pipelines, and captures UUIDs into the audit migrations — exactly the Phase 192 pattern.

## No Analog Found

None. Every planned file for this phase has at least a role-match analog; five of
eight have an EXACT match (same shape, minimal substitution).

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`, `C:/EV-Accounts/backend/scripts/` (both `load-*.ts` and `_tmp-*.py`), `C:/Transparent Motivations/essentials/src/lib/`, `C:/Transparent Motivations/essentials/scripts/banners/`.
**Files scanned:** 9 (1120, 1055, 1287 partial, 326 partial, load-lv-ward-boundaries.ts, load-washco-commissioner-boundaries.ts, _tmp-az-legislature-headshots.py, coverage.js, buildingImages.js, process_banner.py, upload_banner.py — 11 total reads).
**Pattern extraction date:** 2026-07-09
