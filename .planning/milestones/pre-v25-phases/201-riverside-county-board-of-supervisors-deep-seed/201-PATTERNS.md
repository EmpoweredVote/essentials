# Phase 201: Riverside County Board of Supervisors Deep-Seed - Pattern Map

**Mapped:** 2026-07-12
**Files analyzed:** 8 (5 backend new, 1 backend audit-migration group of 5, 2 frontend modified, 1 banner-toolchain reused-as-is)
**Analogs found:** 8 / 8

This phase is the same shape as Pima County (Phase 193) — a standalone-county,
board-only, by-district deep-seed. Phase 193's plan set (`193-01-PLAN.md` through
`193-06-PLAN.md`, `193-PATTERNS.md`) is the primary analog set below; Phase 193's own
`193-PATTERNS.md` is reproduced/adapted here with Riverside-specific substitutions and
a stronger fetch-shape analog (LA County / WashCo, both `f=geojson` direct) swapped in
for the geofence loader, since Riverside's endpoint returns GeoJSON directly rather
than ArcGIS rings.

## File Classification

| New/Modified File | Repo | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `backend/scripts/load-riverside-supervisor-boundaries.ts` | EV-Accounts | geofence loader (one-time ETL) | file-I/O (HTTP fetch → PostGIS INSERT) | `backend/scripts/load-la-county-supervisor-boundaries.ts` (county Board-of-Supervisors, `f=geojson` direct) + `backend/scripts/load-washco-commissioner-boundaries.ts` (fetch/log/dry-run scaffold) | exact — same role (county supervisor districts) AND same fetch shape (`f=geojson`, no rings conversion) |
| `backend/migrations/13xx_riverside_county_board_of_supervisors.sql` | EV-Accounts | structural migration (government/chamber/districts/offices) | CRUD (transactional seed) | `backend/migrations/1288_pima_county_board_of_supervisors.sql` (read in full) | exact — standalone-county government + single by-district chamber, same 6-step shape |
| `backend/migrations/13xx_riverside_county_headshots.sql` | EV-Accounts | audit-only migration (politician_images seed) | CRUD (batch INSERT, idempotent) | `backend/migrations/1289_pima_county_headshots.sql` | exact — identical column shape, same `WHERE NOT EXISTS` idempotency |
| `backend/scripts/_tmp-riverside-supervisors-headshots.py` | EV-Accounts | headshot ETL pipeline (gitignored, orchestrator-run) | file-I/O (download → crop/resize → Storage upload) | `backend/scripts/_tmp-pima-supervisors-headshots.py` | exact — reuse `crop_to_4_5`/`resize_600x750`/`process_headshot_bytes`/`upload_to_storage` verbatim; only ROSTER + per-district source-URL builder change |
| `backend/migrations/13xx..13xx_riverside_supervisor_N_stances.sql` (5 files, one per supervisor) | EV-Accounts | audit-only migration (compass stances) | CRUD (evidence-only INSERT, one politician at a time) | `backend/migrations/1290..1294_pima_supervisor_N_stances.sql` (structural shape) → ultimately `backend/migrations/326_spanberger_stances.sql` (topic-UUID/INSERT shape) | role-match — same INSERT/topic-UUID-table/sources-array shape; Riverside excludes the 8 `judicial-*` topics (36/36, not 44/44), same as Pima |
| `src/lib/coverage.js` | essentials (this repo) | config/data (COVERAGE_COUNTIES surfacing) | CRUD (static array append) | itself — existing `COVERAGE_COUNTIES` array (Pima County / Clark County / Los Angeles County rows, lines 244-262) | exact — same file, append one entry |
| `src/lib/buildingImages.js` | essentials (this repo) | config/data (CURATED_LOCAL banner keying) | CRUD (static object append) | itself — the existing `'pima county'` entry (lines 413-419), the first and only prior COUNTY-tier key | exact — same file, append one entry (second COUNTY-tier key) |
| Riverside County banner asset (downtown Riverside / Mission Inn civic scene) | essentials (this repo) | asset processing (banner image) | file-I/O (download → crop/resize → Storage upload) | `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py` | exact — reuse as-is, no code changes, only new `--input`/`--output`/`--dest` args |

## Pattern Assignments

### `backend/scripts/load-riverside-supervisor-boundaries.ts` (geofence loader)

**Primary analog:** `C:/EV-Accounts/backend/scripts/load-la-county-supervisor-boundaries.ts` (read in full)
— same role (county Board of Supervisors district boundaries), and per the CONTEXT.md recon the
Riverside ArcGIS endpoint is queried with `?f=geojson` (GeoJSON returned directly), matching LA
County's and WashCo's fetch shape, NOT Pima's ArcGIS-rings (`f=json`) shape. Do not reuse Pima's
`arcgisRingsToGeoJson` ring-winding helper here — Riverside needs the simpler
`JSON.stringify(feature.geometry)` pass-through used by LA County/WashCo, unless a live probe of the
endpoint shows it actually needs `f=json` (verify at execute time; if so, fall back to Pima's rings
helper verbatim).

**Config block to copy (LA County file, lines 30-44 / WashCo file, lines 43-60), replace values:**
```typescript
// CRITICAL: outSR=4326 required — county ArcGIS native SRID is a state-plane projection, not WGS84.
// CRITICAL: f=geojson (NOT f=json) — Riverside's SupervisorialDistricts/MapServer/0 endpoint
// returns a GeoJSON FeatureCollection directly when f=geojson is requested (CONTEXT.md recon).
const RIVERSIDE_SUPERVISOR_URL =
  'https://gis.countyofriverside.us/arcgis_mapping/rest/services/' +
  'OpenData/SupervisorialDistricts/MapServer/0/query' +
  '?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326';

const MTFCC          = 'X0021';   // next unused X-code — DB-verify unused at execute time (max seen: X0020/Tucson wards)
const STATE_CODE     = 'ca';      // CRITICAL: lowercase — required for LOCAL-tier routing
const SOURCE         = 'gis.countyofriverside.us-supervisorialdistricts-mapserver0-2026';
const GEO_ID_PREFIX  = 'riverside-ca-supervisor-district-';
const EXPECTED_COUNT = 5;
```

**Fetch + district-number extraction — copy the shape at LA County lines 60-153 verbatim**
(`fetchJson` helper unchanged; `districtMap` keyed by an integer district field — LA County tries
`DISTRICT` then falls back to `SUPERVISORIAL_DISTRICT`/`SUP_DIST`/`DISTRICT_NUM`; probe Riverside's
actual field name live and keep the same fallback-chain defensive pattern, since RESEARCH was
skipped for this phase and the exact attribute name is unconfirmed). Reject any out-of-range
(1-5) district number before forming `geo_id`, same as every prior county loader (LA County
lines 125/135; Pima lines 226; WashCo T-175-01 mitigation).

**INSERT statement — copy verbatim (LA County lines 172-181, or Pima lines 265-274 — both equivalent
`ON CONFLICT (geo_id, mtfcc) DO NOTHING` shape; prefer the `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3),4326))`
form from Pima/WashCo over LA County's `ST_ForcePolygonCCW` variant, since ForcePolygonCCW is
LA-County-specific and not the established convention elsewhere):**
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
Keep Pima's `ST_MakeValid` repair fallback (Pima lines 283-311) as defensive insurance — copy
verbatim; a hard `EXPECTED_COUNT` shortfall must PAUSE+flag exactly like Pima (D-01 convention,
Pima lines 242-246), never silently load a partial set.

---

### `backend/migrations/13xx_riverside_county_board_of_supervisors.sql` (structural)

**Analog:** `C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql` (read in full) — this
is a near-exact template; substitute names/geo_id/mtfcc/external_id range only. **Verify the actual
next migration number at execute time** — disk MAX as of this mapping is 1313
(`1313_oro_valley_council_6_stances.sql`); the Riverside structural migration should be numbered
one past whatever the disk MAX is when the plan executes (disk-authoritative, per
`project_phase192_complete` memory note).

**No known geo_id collision for Riverside** (unlike Pima's `04019` 3-way COUNTY/STATE_UPPER/
STATE_LOWER collision — an AZ-specific quirk where county-FIPS `019` happens to equal legislative
district 19). A search of existing migrations found no `06065` references and CA state legislative
districts do not appear to be keyed by county FIPS number, so this collision class likely does not
apply — but re-verify at execute time before assuming it is safe to skip the collision-guard
pattern; if a collision IS found, keep Pima's `district_type`/`mtfcc` scoping discipline (never a
bare `geo_id = '06065'` join).

**Government + chamber INSERT — copy shape verbatim (Pima lines 60-87), substitute names:**
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Riverside County, California, US', 'County', 'CA', NULL, '06065'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'Riverside County, California, US');

INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'Board of Supervisors', 'Riverside County Board of Supervisors',
       (SELECT id FROM essentials.governments WHERE name = 'Riverside County, California, US'), 5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Supervisors'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Riverside County, California, US')
);
```

**Pre-flight geofence assertion — copy verbatim (Pima lines 97-103), substitute mtfcc/state/count:**
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'ca' AND mtfcc = 'X0021') < 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 5 X0021 geofences found — run load-riverside-supervisor-boundaries.ts before applying this migration.';
  END IF;
END $$;
```

**5x LOCAL district INSERT — copy the per-district block shape verbatim (Pima lines 106-148, repeat 5x):**
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ca', 'riverside-ca-supervisor-district-1',
       'Riverside County Supervisor District 1', 'X0021'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'riverside-ca-supervisor-district-1' AND district_type = 'LOCAL' AND state = 'ca'
);
-- repeat for districts 2-5
```
CRITICAL casing (Pima lines 32-34, confirmed again every prior phase): `districts.state = 'ca'`
LOWERCASE — this is the LOCAL-tier routing join key; `governments.state = 'CA'` and
`offices.representing_state = 'CA'` stay UPPERCASE (free-text label convention only).

**Politician + office block — copy the Pima `WITH ins_p AS (...) INSERT INTO offices` shape verbatim
(Pima lines 164-327), 5 blocks, one per supervisor, each linking to its OWN LOCAL X0021 district:**
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jose Medina', 'Jose', 'Medina', '<party — verify at execute>',
          true, false, false, true, -4008001)
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
                               WHERE name = 'Riverside County, California, US')),
       p.id, 'Supervisor, District 1', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'riverside-ca-supervisor-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'ca'
  AND d.mtfcc = 'X0021'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```
**Chair modeling (D-02):** copy Pima's D3-Chair title-annotation pattern EXACTLY (Pima lines 22-28,
230-261, gate (f) lines 427-453) — 2026 chair is Karen Spiegel, District 2. Her title becomes
`'Supervisor, District 2 (Chair)'`; the other 4 stay plain `'Supervisor, District N'`;
`role_canonical` stays `NULL` on all 5 (zero-DB-footprint Chair, Clark County precedent, no separate
office row). **Re-verify the current chair at execute time** per CONTEXT.md D-02 — the annual chair
vote and June 2026 election results are both pending final certification, so the D2/Spiegel
assignment could change before this migration is authored.

`ext_id` range: assign the next free `-400Nxxx` block collision-safe per prior county convention
(Pima used `-4007001..-4007005`; Riverside should use the next unused block, e.g.
`-4008001..-4008005` — DB-verify unclaimed at execute time, do not hardcode blindly).

**office_id back-fill + post-verification DO block — copy Pima's Step 5/Step 6 verbatim (Pima lines
329-457)**, adjusting the `external_id BETWEEN` range and gate (d)'s appointed-count expectation
(Riverside's roster has no flagged appointee in CONTEXT.md recon — confirm at execute time whether
gate (d) applies at all, or should assert `= 0` appointed instead of `= 1`). Gate (e) section-split
guard and gate (f) single-Chair-annotation guard carry over unchanged in structure.

**Ledger registration — copy verbatim (Pima lines 461-468), substitute version/name:**
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('<next-disk-max>', 'riverside_county_board_of_supervisors')
ON CONFLICT (version) DO NOTHING;
```

---

### `backend/scripts/_tmp-riverside-supervisors-headshots.py` (headshot pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-pima-supervisors-headshots.py` (referenced in full via 193-PATTERNS.md; same file family as `_tmp-az-legislature-headshots.py`)

Reuse verbatim: `crop_to_4_5()`, `resize_600x750()`, `process_headshot_bytes()` (crop-first-then-
resize order — mandatory per `feedback_headshot_resize_no_distort` memory rule), `upload_to_storage()`
(`x-upsert: true` PUT to `politician_photos/{uuid}-headshot.jpg`), `resolve_politician_id()`
(parameterized `external_id = %s`, never hardcode a UUID), the env-load block, `dry_run_head_check()`
(HEAD every roster URL before any real batch work), and the descriptive `HEADERS` User-Agent.

**What changes:** the `ROSTER` list (5 entries, `external_id` matching the block assigned in the
structural migration, `politician_id` captured from that migration's actual `gen_random_uuid()`
output — NOT invented ahead of time), the guard assertion (`assert len(ROSTER) == 5`), and
`source_url_for()` — per CONTEXT.md recon, `rivco.gov` and `rivcocob.org` return WAF-403 to bots, so
headshots must come from the 5 individual district sites (rivcodistrict1.org, rivcodistrict2.org,
supervisorchuckwashington.com, rivco4.org, rivcodistrict5.org) or Ballotpedia/Wikimedia — test each
district domain individually for WAF before committing a source, same discipline as Pima's
CivicPlus-per-member hardcoded URL approach:
```python
def source_url_for(member: dict) -> str:
    """No single CMS pattern across all 5 district sites (5 different domains/platforms) —
    the 5 URLs must be hardcoded per member after individual WAF/reachability probes,
    same convention as Pima's per-member CivicPlus asset URLs."""
    return member['photo_url']
```
`photo_license` should be `'us_government_work'` only if the source IS the .gov district site;
if the final source is Ballotpedia/Wikimedia instead (likely, given the WAF-403 on the primary
domains), use the correct Wikimedia/Ballotpedia license string per that image's actual license —
do NOT default to `us_government_work` for a non-.gov source.

**Orchestration note to preserve verbatim:** this script is gitignored (`backend/scripts/_*`), never
committed; the executor only WRITES it to disk, the ORCHESTRATOR runs it (PIL/requests/psycopg2 +
Storage access live only in the orchestrator shell) and then applies the audit migration authored
from the emitted manifest.

---

### `backend/migrations/13xx_riverside_county_headshots.sql` (audit-only, unregistered)

**Analog:** `C:/EV-Accounts/backend/migrations/1289_pima_county_headshots.sql` (via 193-PATTERNS.md)

Copy the per-row shape verbatim, 5 rows:
```sql
-- Jose Medina (District 1, external_id=-4008001)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4008001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', '<license — matches actual source>'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4008001)
);
```
Columns are exactly `(id, politician_id, url, type, photo_license)`. Header comment block should
state clearly this is AUDIT-ONLY, NOT registered in the migration ledger, applied via `psql -f`
AFTER the Python pipeline uploads to Storage. `type` MUST be `'default'` (UI filters on it, per
`project_schema_key_tables` memory note).

---

### `backend/migrations/13xx..13xx_riverside_supervisor_N_stances.sql` (audit-only, one per supervisor)

**Analog:** `C:/EV-Accounts/backend/migrations/1290..1294_pima_supervisor_N_stances.sql` (structural shape) → `326_spanberger_stances.sql` (topic-UUID/INSERT primitive)

Copy the file-header shape verbatim: topic-UUID reference comment block (paste the same 44-topic
UUID table, skip the 8 `judicial-*` rows when writing INSERTs — Board of Supervisors is a
non-judicial office, same as Pima, 36/36 topics), `BEGIN;`/`COMMIT;` wrapper, and the two-table
INSERT pattern per topic:
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
**Mandatory conventions (memory-enforced, non-negotiable):**
- ONE research agent at a time — parallel stance research burns quota
  (`feedback_stance_research_one_at_a_time`).
- ALL live compass topics researched per supervisor, evidence-only.
- Topics with zero evidence are OMITTED ENTIRELY — no row at all, never a neutral/default value
  (`feedback_stance_no_default_value`).
- One file per supervisor (5 files), same as Pima's `1290`-`1294` split.
- Stance migrations apply audit-only — NOT registered in `supabase_migrations.schema_migrations`
  (unlike the structural migration, which IS registered).

---

### `src/lib/coverage.js` (COVERAGE_COUNTIES entry)

**Analog:** the existing `COVERAGE_COUNTIES` array itself, specifically the Pima County row (line 261,
newest county entry) and Clark County row (line 260) — both standalone counties with
`hasContext: true` once stances exist.

**Current array tail (lines 244-262), exact insertion point:**
```javascript
export const COVERAGE_COUNTIES = [
  { label: 'Los Angeles County', browseGovernmentList: ['06037'], browseStateAbbrev: 'CA', hasContext: true },
  ...
  { label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true },
  { label: 'Pima County', browseGovernmentList: ['04019'], browseStateAbbrev: 'AZ', hasContext: true },
];
```

**Exact pattern to append:**
```javascript
{ label: 'Riverside County', browseGovernmentList: ['06065'], browseStateAbbrev: 'CA', hasContext: true },
```
Insert order is NOT enforced (ad hoc by state-addition order) — append near the other counties.
`hasContext: true` should only be set once >=1 stance row actually exists in
`inform.politician_answers` — if the banner/coverage wave runs before the stance wave, stage this
as `hasContext: false` first (matches the file's own doc comment at line 243 and the established
Pima/WashCo precedent: flip on once stances are live, not before).

No existing `'riverside'` / `'Riverside'` string found anywhere in `coverage.js` or
`buildingImages.js` — no collision with a hypothetical future City of Riverside entry (out of scope
for this phase; the two Coachella Valley cities in this milestone track are Palm Springs (202) and
Indio (203), not the City of Riverside).

---

### `src/lib/buildingImages.js` (CURATED_LOCAL entry)

**Analog:** the existing `'pima county'` entry (lines 413-419) — the only prior COUNTY-tier
`CURATED_LOCAL` key; Riverside is the SECOND. Same `{ state, src }` shape, no array-of-variants
needed.

**Exact pattern to append (inside the `CURATED_LOCAL` object, attribution comment above matching the
file's existing convention, e.g. lines 413-419):**
```javascript
// California COUNTY banner (second county-tier CURATED_LOCAL key, after Pima County).
// Downtown Riverside / Mission Inn civic street scene (D-03) — the conventional way to
// represent the county, kept visually distinct from the future Palm Springs (202) and
// Indio (203) CITY banners in the same Coachella Valley track.
//   riverside county - <title> | <author> | <license>
'riverside county': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/riverside-county.jpg' },
```
Key is space-form (`'riverside county'`, quoted, since it contains a space — same reason `'pima
county'` and `'boulder city'` are quoted, per lines 402/419) to match `coverage.js`
`browse_label: 'Riverside County'`. This key only reliably renders via the `COVERAGE_COUNTIES`
browse path (`representingCity` in `Results.jsx`), not via an arbitrary address (an address inside
Riverside County parses to whatever city it's in, e.g. "Riverside" or "Indio", not "Riverside
County") — expected, pre-existing behavior identical to Pima/Clark/Washington County, not a defect.
`getBuildingImages()` itself needs NO code change.

---

### Riverside County banner asset (process + upload)

**Analog:** `scripts/banners/process_banner.py` + `scripts/banners/upload_banner.py` (reused as-is,
zero code changes — same tooling used for every prior city/county banner).

**Commands (adapt path/filename only):**
```bash
python scripts/banners/process_banner.py --url <licensed-source-url> --output /tmp/riverside-county.jpg --vertical-anchor 0.3
# --vertical-anchor tunable per source; street-scene shots typically need less
# vertical crop than mountain/skyline shots (0.3-0.5 range per existing attribution comments)

export SUPABASE_SERVICE_ROLE_KEY=<key from C:/EV-Accounts/backend/.env>
python scripts/banners/upload_banner.py --file /tmp/riverside-county.jpg --dest cities/riverside-county.jpg
```
Destination path convention is `cities/<slug>.jpg` even though this is a COUNTY government (storage
path tier is keyed by banner TYPE — city/county/state/national — not government type; `cities/` is
the established tier for every county banner so far, including Pima's `cities/pima-county.jpg`).
Source per D-03: downtown Riverside / Mission Inn street-scene photo, real and licensed, no
AI/aerial — source ONE candidate at a time and show it before committing
(`feedback_banner_source_one_at_a_time`).

## Shared Patterns

### Casing convention (applies to loader + structural migration)
**Source:** every prior county/city phase (Pima 193, WashCo 175, LA County), reconfirmed live.
```
essentials.districts.state       = 'ca'  (lowercase) — LOCAL/COUNTY/STATE_UPPER/STATE_LOWER routing key
essentials.governments.state     = 'CA'  (uppercase) — free-text label
essentials.offices.representing_state = 'CA'  (uppercase) — free-text label
```
Apply to: `load-riverside-supervisor-boundaries.ts`, the structural migration.

### Idempotency convention (applies to all migrations)
**Source:** `1288_pima_county_board_of_supervisors.sql` / `1289_pima_county_headshots.sql` / `1290-1294_pima_supervisor_N_stances.sql`.
```sql
-- governments/chambers/districts: WHERE NOT EXISTS guard (no unique constraint on name/geo_id)
-- politicians: ON CONFLICT (external_id) DO NOTHING
-- offices: WHERE NOT EXISTS (district_id, politician_id)
-- politician_images: WHERE NOT EXISTS (politician_id)
-- politician_answers/context: ON CONFLICT (politician_id, topic_id) DO UPDATE
```
Apply to: the structural migration, headshots migration, 5 stance migrations.

### Zero-DB-footprint Chair (D-02, Pattern 2)
**Source:** `1055_clark_county_commission.sql`, reconfirmed live via Pima's D3/Jennifer Allen
implementation (`1288`, gate (f)). Apply to Karen Spiegel's District 2 office row: title annotation
`'Supervisor, District 2 (Chair)'` only, no separate office row, no `role_canonical` value. Chair
status is informational-only, re-verified at execute time (D-02).

### Orchestrator-run vs. executor-authored split
**Source:** every prior county/city phase's non-obvious-project-state note (Pima 193, Tucson 194, Oro
Valley 195). `gsd-executor` has NO Supabase MCP/Storage access. The executor:
- writes `load-riverside-supervisor-boundaries.ts`, the structural migration, the headshot Python
  pipeline, the headshots migration, and the 5 stance migrations to disk
- does NOT run `npx tsx`, does NOT `psql -f` apply, does NOT run the Python pipeline, does NOT touch Storage
The orchestrator runs the loader, applies migrations via `psql -f` against
`C:/EV-Accounts/backend/.env` `DATABASE_URL`, runs the headshot/banner pipelines, and captures UUIDs
into the audit migrations.

### Section-split / district-collision guard
**Source:** RESEARCH-skipped for this phase (per CONTEXT.md), but Pima's Pitfall 2 (`04019` 3-way
collision) is the standing caution. No known Riverside-specific collision was found in this pass
(`06065` not referenced elsewhere in migrations), but re-run the same defensive discipline anyway:
never join or filter on a bare `geo_id = '06065'`; always scope with
`AND district_type = 'LOCAL' AND mtfcc = 'X0021'` for the 5 new supervisor districts, and never let
the structural migration touch the pre-existing COUNTY `G4020` row.

## No Analog Found

None. Every planned file for this phase has at least a role-match analog in the Pima County (193)
plan set; the geofence loader specifically upgrades to the LA County/WashCo `f=geojson` fetch shape
since Riverside's endpoint matches that shape rather than Pima's ArcGIS-rings shape.

## Metadata

**Analog search scope:** `.planning/phases/193-pima-county-board-of-supervisors-deep-seed/` (193-PATTERNS.md
+ 1288/1289 migrations + load-pima-supervisor-boundaries.ts, all read in full), `C:/EV-Accounts/backend/scripts/`
(`load-la-county-supervisor-boundaries.ts`, `load-washco-commissioner-boundaries.ts`, both read in
part/full), `C:/EV-Accounts/backend/migrations/` (numeric listing, tail 30, to establish next-migration-number
context), `C:/Transparent Motivations/essentials/src/lib/coverage.js` and `buildingImages.js` (current
COUNTY-tier entries read in full).
**Files scanned:** 9 (193-PATTERNS.md, 1288, load-pima-supervisor-boundaries.ts full reads;
load-la-county-supervisor-boundaries.ts full read; load-washco-commissioner-boundaries.ts partial read;
coverage.js and buildingImages.js targeted reads; migrations directory listing).
**Pattern extraction date:** 2026-07-12
