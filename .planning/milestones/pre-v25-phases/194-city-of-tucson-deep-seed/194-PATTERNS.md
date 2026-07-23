# Phase 194: City of Tucson Deep-Seed - Pattern Map

**Mapped:** 2026-07-09
**Files analyzed:** 7 distinct artifacts (1 loader script, 1 structural migration, 1 audit headshot migration,
7 audit stance migrations counted as 1 repeated pattern, 1 headshot pipeline script, 2 frontend config edits)
**Analogs found:** 7 / 7 (100% — every artifact has a direct, named Phase 193/162 analog)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `C:/EV-Accounts/backend/scripts/load-tucson-ward-boundaries.ts` | utility (ETL loader) | batch / file-I/O | `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts` | exact (same MapServer family, same DB target) — **but must exercise the FULL multi-ring branch, not the single-ring fast path** |
| `C:/EV-Accounts/backend/migrations/1296_city_of_tucson.sql` | migration (structural) | CRUD (INSERT-only, idempotent) | `C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql` | exact shape, **plus one new `essentials.districts` INSERT block Pima's migration never needed (Pitfall 5)** |
| `C:/EV-Accounts/backend/migrations/1297_city_of_tucson_headshots.sql` | migration (audit-only) | CRUD (INSERT-only, idempotent) | `C:/EV-Accounts/backend/migrations/1289_pima_county_headshots.sql` | exact, 7 rows instead of 5 |
| `C:/EV-Accounts/backend/migrations/1298..1304_tucson_*_stances.sql` (7 files) | migration (audit-only) | CRUD (INSERT-only, idempotent, upsert-on-conflict) | `C:/EV-Accounts/backend/migrations/1290_pima_supervisor_1_stances.sql` (+ 1291-1294) | exact — one file per official, same header/comment/gate conventions |
| `C:/EV-Accounts/backend/scripts/_tmp-tucson-headshots.py` (gitignored) | utility (headshot pipeline) | batch / file-I/O (download → crop → resize → upload) | `C:/EV-Accounts/backend/scripts/_tmp-pima-supervisors-headshots.py` | exact pipeline shape, **but the source-fetch strategy must change (WAF fallback — see delta below)** |
| `src/lib/buildingImages.js` (MODIFIED — add `tucson` to `CURATED_LOCAL`) | config/utility | CRUD (static data, read-only at runtime) | existing `'pima county'` entry (same file, lines 413-419) | exact — same object shape, new state-scoped key |
| `src/lib/coverage.js` (MODIFIED — add NEW Arizona block to `COVERAGE_STATES`) | config/utility | CRUD (static data, read-only at runtime) | existing `{ name: 'Nevada', ... }` block (lines 190-198) | role-match — **this is a brand-new state block, not an append to an existing one (no Arizona block exists yet)** |

## Pattern Assignments

### `C:/EV-Accounts/backend/scripts/load-tucson-ward-boundaries.ts` (utility, batch/file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/load-pima-supervisor-boundaries.ts` (full file read, 329 lines)

**CRITICAL DELTA:** Copy the winding-classification helper **in full**, including the multi-ring branch below
the `if (rings.length === 1)` fast path. Pima's 5 districts were all single-ring so that branch was written
defensively and never exercised. Tucson's Ward 4 (2 rings) and Ward 5 (7 rings) will **actually execute** the
multi-ring/MultiPolygon path — do not trim the function down to the fast path only.

**Do NOT use `load-lv-ward-boundaries.ts` as the geometry-conversion analog** despite it also handling
multi-ring LV wards (Ward 4=30, Ward5=21, Ward6=22 rings) — its `arcgisRingsToGeoJson()` is the **naive
pass-through anti-pattern** (WR-01): it blindly assigns the raw ArcGIS `rings` array as GeoJSON `Polygon`
coordinates, which is only correct for a single exterior ring — every additional ring silently becomes
treated as a "hole" by PostGIS regardless of its actual winding direction. This is exactly the bug CONTEXT's
"BLOCKING loader-verify checkpoint" flags. LV's loader is a project precedent for *reading multi-ring GIS
data* but is the wrong reference for *how to convert it correctly*.
```typescript
// Source: C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts lines 93-100 — ANTI-PATTERN, DO NOT COPY:
function arcgisRingsToGeoJson(rings: number[][][]): string {
  return JSON.stringify({ type: 'Polygon', coordinates: rings });  // WRONG for multi-ring wards
}
```

**Config block to adapt** (Source: `load-pima-supervisor-boundaries.ts` lines 48-63):
```typescript
const PIMA_SUPERVISOR_URL =
  'https://gisdata.pima.gov/arcgis1/rest/services/' +
  'GISOpenData/Boundaries/MapServer/5/query' +
  '?where=1%3D1&outFields=DISTRICT,NAME&returnGeometry=true&f=json&outSR=4326';
const MTFCC          = 'X0019';
const STATE_CODE     = 'az';      // CRITICAL: lowercase — required for LOCAL-tier routing
const SOURCE         = 'gisdata.pima.gov-boundaries-mapserver5-2026';
const GEO_ID_PREFIX  = 'pima-az-supervisor-district-';
const EXPECTED_COUNT = 5;
```
Tucson equivalents (per RESEARCH, live-verified 2026-07-10):
```typescript
const TUCSON_WARD_URL =
  'https://gisdata.pima.gov/arcgis1/rest/services/' +
  'GISOpenData/Boundaries2/MapServer/3/query' +
  '?where=1%3D1&outFields=WARD,NAME&returnGeometry=true&f=json&outSR=4326';
const MTFCC          = 'X0020';
const STATE_CODE     = 'az';
const SOURCE         = 'gisdata.pima.gov-boundaries2-mapserver3-2026';
const GEO_ID_PREFIX  = 'tucson-az-ward-';
const EXPECTED_COUNT = 6;
```

**Winding-classification helper to copy VERBATIM (full function, both branches)** — Source:
`load-pima-supervisor-boundaries.ts` lines 130-196 (`ringSignedArea` + `arcgisRingsToGeoJson`, shown in full
in the Read above — the shoelace-formula area function, the CW=exterior/CCW=hole classification, the
`AREA_EPS` degenerate-ring guard, and the `polygons.length === 1 ? Polygon : MultiPolygon` emission logic).
Do not delete or shortcut the multi-ring branch — Tucson is the first phase where it is load-bearing, not
dead code.

**Insert + repair pattern** (Source: lines 265-312 — parameterized `$1..$4` binds, `ON CONFLICT (geo_id,
mtfcc) DO NOTHING`, `ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3),4326))`, `ST_IsValid` check in the
`RETURNING` clause, `ST_MakeValid` fallback re-run on invalid geometry, hard `process.exit(1)` if still
invalid after repair). Copy this block unchanged except the table/column values already parameterized.

**D-01 PAUSE+flag guard** (Source: lines 242-246): `if (distMap.size !== EXPECTED_COUNT) { ...
process.exit(1) }` — never load a partial ward set. Keep verbatim for the 6-ward expectation.

**New assertion this phase needs (not in Pima's loader)**: after insert, add a geometry-TYPE verification
query distinguishing Wards 4/5 (expect `ST_MultiPolygon` with >1 constituent) from Wards 1/2/3/6 (expect
`ST_MultiPolygon`-wrapped single-exterior `Polygon`, i.e. `ST_NumGeometries=1`) — RESEARCH's Validation
Architecture section specifies this exact check; Pima's precedent never needed it because no district had
this shape.

---

### `C:/EV-Accounts/backend/migrations/1296_city_of_tucson.sql` (structural migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql` (full file read, 469 lines)

**Government row pattern** (Source: lines 60-67) — adapt name/type/geo_id, KEEP the `WHERE NOT EXISTS`
idempotency guard (no unique constraint on `governments.geo_id`):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Pima County, Arizona, US',
       'County', 'AZ', NULL, '04019'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Pima County, Arizona, US'
);
```
Tucson delta: `'City of Tucson, Arizona, US'`, `type='City'`, `geo_id='0477000'`.

**Chamber pattern** (Source: lines 76-87) — ONE chamber holds all offices, `official_count` = total seats
(7, not 5 — Mayor + 6 wards). CRITICAL: the auto-generated column on `essentials.chambers` must never appear
in the INSERT column list (repeated verbatim warning from Pima's header comment, line 30).
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(), 'Board of Supervisors', 'Pima County Board of Supervisors',
       (SELECT id FROM essentials.governments WHERE name = 'Pima County, Arizona, US'), 5
WHERE NOT EXISTS (...);
```
Tucson: `name='City Council'`, `name_formal='Tucson City Council'` (verify exact formal name at plan time),
`official_count=7`.

**District rows — TWO kinds needed (delta from Pima, which only needed LOCAL rows):**

1. Six `LOCAL` ward districts — copy Pima's per-district block shape verbatim (Source: lines 105-148):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'az', 'pima-az-supervisor-district-1',
       'Pima County Supervisor District 1', 'X0019'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'pima-az-supervisor-district-1' AND district_type = 'LOCAL' AND state = 'az'
);
```
Tucson: 6 blocks, `geo_id='tucson-az-ward-N'`, `label='Tucson Ward N'`, `mtfcc='X0020'`.

2. ONE **new** `LOCAL_EXEC` district row for the Mayor (Pima's migration has NO equivalent — this is
Pitfall 5, a genuinely new structural piece; reuse the district-row INSERT shape above but with
`district_type='LOCAL_EXEC'`, `geo_id='0477000'`, `mtfcc='G4110'`, `state='az'` lowercase):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'az', '0477000', 'City of Tucson (Mayor)', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '0477000' AND district_type = 'LOCAL_EXEC' AND state = 'az'
);
```
This reuses the ALREADY-LIVE `geofence_boundaries` row from Phase 190 — no loader/geometry work needed for
the Mayor, only this one districts-table INSERT.

**Pre-flight geofence assertion** (Source: lines 97-103) — gate the ward-district INSERTs on the loader
having actually run:
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'az' AND mtfcc = 'X0019') < 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 5 X0019 geofences found — run load-pima-supervisor-boundaries.ts before applying this migration.';
  END IF;
END $$;
```
Tucson: `mtfcc = 'X0020'`, threshold `< 6`.

**Politician + office block pattern** (Source: lines 164-327, five near-identical `WITH ins_p AS (INSERT
... RETURNING id) INSERT INTO offices ...` blocks) — copy the shape exactly for 7 blocks (Mayor + 6 wards).
Mayor's office joins to the NEW `LOCAL_EXEC`/`G4110`/`0477000` district row instead of an `X0020` district;
each ward office joins to its own `X0020`/`az` district exactly like Pima's per-district joins:
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
       (SELECT id FROM essentials.chambers WHERE name = 'Board of Supervisors'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Pima County, Arizona, US')),
       p.id, 'Supervisor, District 1', 'AZ', false, false, NULL
FROM essentials.districts d CROSS JOIN ins_p p
WHERE d.geo_id = 'pima-az-supervisor-district-1' AND d.district_type = 'LOCAL' AND d.state = 'az'
  AND d.mtfcc = 'X0019' AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```
Tucson external_id block: `-4008001..-4008007` (Mayor Romero first, then Wards 1-6 in order, per RESEARCH's
DB-verified unused range). Mayor's office: `title='Mayor'`, `district_id` resolved from the new
`LOCAL_EXEC`/`0477000` row instead of an `X0020` row, `role_canonical` may be `'LOCAL_EXEC'`-style if the
project convention sets it for other at-large Mayor offices (verify Beaverton/La Verne's Mayor office row
at plan time) — otherwise NULL like Pima's uniformly-NULL `role_canonical`.

**Vice Mayor title-annotation pattern (LOCKED shape)** — Source: line 250 (`'Supervisor, District 3
(Chair)'`) is the exact precedent for D-05/Pattern 2:
```sql
'Supervisor, District 3 (Chair)', 'AZ', false, false, NULL
```
Tucson: Ward 1's office title = `'Council Member, Ward 1 (Vice Mayor)'`, `role_canonical` stays NULL on ALL
7 offices — the annotation lives in `title` only, exactly like Pima's Chair suffix. Do NOT create an 8th
office for Vice Mayor.

**office_id back-fill** (Source: lines 334-339):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -4007005 AND -4007001
  AND p.office_id IS NULL;
```
Tucson: `BETWEEN -4008007 AND -4008001`.

**Post-verification DO block gates** (Source: lines 351-457) — copy gate structure (a) government row = 1,
(b) office count on the correct districts = 7 (not 5), (c) each district holds exactly 1 office, (d) exactly
1 Vice-Mayor-annotated office AND it is Ward 1's external_id, (e) section-split = 0 offices under a
non-Tucson government. Pima's gate (d) checked `is_appointed` count (not applicable — no appointed Tucson
officials per RESEARCH's all-elected roster) — drop or adapt that gate; keep gate (f)'s annotation-identity
check pattern (Source: lines 427-453) applied to the Vice Mayor instead of Chair:
```sql
SELECT COUNT(*) INTO v_chair_count
FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id LIKE 'pima-az-supervisor-district-%' AND d.district_type = 'LOCAL'
  AND d.state = 'az' AND d.mtfcc = 'X0019' AND o.title LIKE '%(Chair)%';
IF v_chair_count <> 1 THEN RAISE EXCEPTION ...; END IF;
```

**Migration ledger footer** (Source: lines 461-468) — disk-MAX authoritative (RESEARCH confirmed next = 1296):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1288', 'pima_county_board_of_supervisors')
ON CONFLICT (version) DO NOTHING;
```
Tucson: `('1296', 'city_of_tucson')`.

---

### `C:/EV-Accounts/backend/migrations/1297_city_of_tucson_headshots.sql` (audit-only migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1289_pima_county_headshots.sql` (full file read, 86 lines)

Copy the file shape exactly — header comment block documenting source/pipeline/license, then N
`INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license) SELECT
gen_random_uuid(), (SELECT id FROM essentials.politicians WHERE external_id = X), '<CDN URL>', 'default',
'<license>' WHERE NOT EXISTS (...)` blocks, one per official:
```sql
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4007001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/b33f37df-5537-4eee-bb5b-b401a135bc1b-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4007001)
);
```
Delta: 7 blocks (`-4008001..-4008007`), and `photo_license` will likely be **mixed** per official (Wikipedia
= `'wikimedia_commons'` or similar per prior conventions; campaign-site photos = `'press_use'`/`'operator_supplied'`
depending on what license research finds) rather than a uniform `'us_government_work'` — because
`tucsonaz.gov` (the WAF-blocked official host) is NOT the source this time (Pitfall 3). Document per-image
license honestly, same discipline as every prior phase, but do not assume all 7 share one license value.
NOT registered in the migration ledger — no ledger-footer INSERT, matching 1289's structure exactly.

---

### `C:/EV-Accounts/backend/migrations/1298..1304_tucson_*_stances.sql` (7 audit-only migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1290_pima_supervisor_1_stances.sql` (+ 1291-1294 for the
remaining officials — header/comment pattern confirmed consistent across all 5, first file read in full: 80
of ~200+ lines)

**Header comment convention** (Source: lines 1-36) — per-official file documents: external_id, politician
UUID, party/tenure one-liner, the EVIDENCE-ONLY/HONEST-BLANK/AUDIT-ONLY disclosure paragraph, the full list
of SEEDED topics with cited one-line justification, and the full list of DELIBERATELY BLANK topics split by
local vs. non-local-federal/state categories. Copy this documentation discipline verbatim per Tucson
official (Mayor + 6 ward members) — 36 non-judicial topics is the ceiling per official (Pitfall 8), most
officials will have fewer SEEDED rows and the rest honestly blank.

**Per-topic INSERT pair pattern** (Source: lines 40-73) — `inform.politician_answers` (numeric value 1-5)
paired with `inform.politician_context` (reasoning + sources array), both `ON CONFLICT (politician_id,
topic_id) DO UPDATE SET ...` for idempotent re-runs:
```sql
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('b33f37df-5537-4eee-bb5b-b401a135bc1b', 'c1ac1330-47f7-44ec-baf3-c913d926b97c', 2.0)
ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('b33f37df-5537-4eee-bb5b-b401a135bc1b', 'c1ac1330-47f7-44ec-baf3-c913d926b97c',
        $$<evidence-grounded reasoning paragraph, cites specific votes/actions/dates>$$,
        ARRAY['<source url 1>', '<source url 2>']::text[])
ON CONFLICT (politician_id, topic_id) DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
Delta: cite AZ Luminaria / Tucson Sentinel / AZPM / tucson.com / Arizona Daily Star coverage (Pitfall 4 —
never cite an unfetched `tucsonaz.gov` agenda URL as if verified). `BEGIN;`/no `COMMIT;`/no ledger footer —
audit-only files are plain sequential INSERT statements the orchestrator applies via `psql -f`, matching
Pima's file structure (no `COMMIT` line appears in the 80-line excerpt read — confirm this convention holds
for the remainder of the file at execute time, but do not add a ledger-registration footer regardless, since
these are explicitly unregistered).

---

### `C:/EV-Accounts/backend/scripts/_tmp-tucson-headshots.py` (gitignored, utility, batch/file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-pima-supervisors-headshots.py` (full file read, 400 lines)

Copy the entire pipeline shape: `ROSTER` list-of-dicts config block, `.env`-parsing block (lines 126-139),
`crop_to_4_5()` (lines 201-221, crop-first — center-horizontal if wider than 4:5, top-crop if taller),
`resize_600x750()` (Lanczos, lines 224-228), `process_headshot_bytes()` (RGB convert + EXIF-strip re-encode,
lines 248-265), `upload_to_storage()` (PUT with `x-upsert: true`, lines 231-245), `dry_run_head_check()`
pre-flight HEAD-all-URLs-first gate (lines 293-309), and the fail-fast `sys.exit(1)` guards (unfilled
sentinel URLs, required-member fetch failures) — all reusable verbatim.

```python
def crop_to_4_5(img: Image.Image) -> Image.Image:
    w, h = img.size
    target_ratio = 4.0 / 5.0
    current_ratio = w / h
    if abs(current_ratio - target_ratio) < 0.001:
        return img
    if current_ratio > target_ratio:
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        return img.crop((left, 0, left + new_w, h))
    else:
        new_h = int(w / target_ratio)
        return img.crop((0, 0, w, new_h))
```

**CRITICAL DELTA — source-fetch strategy must change.** Pima's `source_url_for()` (lines 160-164) is a
trivial hardcoded-per-member CivicPlus asset URL because that host had no WAF. Tucson's primary host
(`tucsonaz.gov`) returns HTTP 403 to both `curl` and `requests` regardless of `User-Agent` (Akamai WAF,
Pitfall 3) — the `requests.get(url, headers=HEADERS, ...)` download step in `download_image()` (lines
190-198) **will fail for any `tucsonaz.gov` URL**. The pipeline's crop/resize/upload functions are still
correct and reusable; only the acquisition step changes:
- Use the `/find-headshots` skill's Playwright flow (`mcp__playwright__browser_navigate` + snapshot +
  manual image-URL extraction) to find a usable direct image URL per official FIRST (this happens outside
  this Python script, in the orchestrator's Playwright session), THEN hardcode the resolved, licensed image
  URL into `ROSTER` exactly like Pima's `photo_url` field — the script itself does not need Playwright
  integration, just URLs that are NOT behind the WAF (Wikipedia confirmed HTTP 200 for at least Mayor
  Romero; ward members' personal campaign sites are a documented fallback per RESEARCH).
- `photo_license` per `ROSTER` entry will vary (not uniform `'us_government_work'` this time) — set
  per-image based on actual source (Wikipedia headshot license terms, campaign-site terms, etc.),
  documented in the migration's header comment (see 1297 above) matching the per-image discipline every
  prior phase has used.
- Keep the `_MISSING = 'TODO_...'` sentinel + `main()` fail-fast guard pattern (lines 84-85, 323-337) — do
  not let a placeholder URL reach a Storage write.

**Manifest output pattern** (Source: lines 375-395) — reuse verbatim; this is what migration 1297's `url`
values get pulled from.

---

### `src/lib/buildingImages.js` (MODIFIED — add `tucson` key to `CURATED_LOCAL`)

**Analog:** the existing `'pima county'` entry, same file, lines 413-419 (Read in full: lines 155-420)

```javascript
// Arizona COUNTY banner (first county-tier CURATED_LOCAL key). Reads as Pima
// County the place (Santa Catalina Mountains + Sonoran-desert saguaro foreground),
// deliberately distinct from the future Tucson CITY banner (Phase 194, a downtown
// streetscape) and the AZ STATE banner (the Phoenix skyline). Key is space-form to
// match coverage.js browse_label 'Pima County'; storage file is hyphenated.
//   pima county   - Santa Catalina Mountains from West Saguaro National Park near Tucson | WClarke | CC BY-SA 4.0
'pima county': { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pima-county.jpg' },
```
Add, in the same object (single-key city entry — no array-of-variants needed since 'tucson' has no
same-named-city collision elsewhere in the covered set, unlike `portland`/`springfield`/`fairview` which use
the array-of-`{state,src}` form at lines 189-192, 255-258, 372-375):
```javascript
// Tucson CITY banner (Phase 194) — downtown streetscape, deliberately distinct from
// the Pima County landscape banner above and the AZ STATE Phoenix skyline.
//   tucson - <licensed downtown-Tucson streetscape shot, e.g. Congress St / historic district> | <author> | <license>
tucson: { state: 'AZ', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tucson.jpg' },
```
Comment/attribution convention (author | license) must be filled in with the actual sourced photo's real
attribution at execution time — every existing entry in this file documents it this way; do not skip it.

**Toolchain to reuse verbatim** (no code changes needed in these scripts themselves):
- `scripts/banners/process_banner.py` — `argparse`-based CLI (`main()` at line 133), functions
  `crop_to_ratio()`, `apply_dark_overlay()`, `process_banner()` (crop-to-1700×540 spec per RESEARCH).
- `scripts/banners/upload_banner.py` — `argparse`-based CLI (`main()` at line 92), `upload_banner(local_file,
  dest_path, service_key)` — Storage is no-cache, so overwrite = instant refresh (per project memory).

**Test coverage:** `buildingImages.test.js` already exercises `CURATED_LOCAL` state-scoping generically — no
new test file needed, just confirm `npx vitest run src/lib/buildingImages.test.js` stays green after adding
the `tucson` key (established non-gap per Phase 162/193 precedent).

---

### `src/lib/coverage.js` (MODIFIED — add NEW Arizona `COVERAGE_STATES` block)

**Analog:** the existing `{ name: 'Nevada', ... }` block, same file, lines 190-198 (read in full: lines 1-280)

```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Boulder City', browseGovernmentList: ['3206500'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

**CRITICAL DELTA:** grep confirms ZERO `name: 'Arizona'` matches anywhere in `COVERAGE_STATES` today (Pitfall
6) — Pima County lives in the separate `COVERAGE_COUNTIES` array (line 248: `{ label: 'Pima County',
browseGovernmentList: ['04019'], browseStateAbbrev: 'AZ', hasContext: true }`), which is NOT the array this
phase touches. This is the **first Arizona CITY**, so a brand-new state block must be appended to the
`COVERAGE_STATES` array (placement: alphabetically, between `'Virginia'` at line 184-189 and `'Nevada'` at
190-198 is itself non-alphabetical in the current file — RESEARCH's grep found no strict alphabetical
ordering enforced; follow existing file convention/placement, likely appended near the end or wherever the
planner's diff naturally lands — not a correctness requirement, just note the file is not currently in strict
A-Z order so don't over-engineer insertion position):
```javascript
{
  name: 'Arizona', abbrev: 'AZ',
  areas: [
    { label: 'Tucson', browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true },
  ],
},
```
`hasContext: true` is appropriate once ≥1 compass-stance row exists for a Tucson official (matches the
`hasContext` convention seen on every other `areas` entry with seeded stances, e.g. Nevada's 4 cities above).

**Test coverage:** no dedicated `coverage.test.js` exists for ANY prior county/city addition (established
non-gap, Phase 162/193 precedent) — the substitute verification is a
`node --input-type=module -e "import(...)"` parse-check plus a grep for the new `'Arizona'`/`'Tucson'`
label, per RESEARCH's Validation Architecture section. Do not treat the absence of a coverage.js test file
as something to newly create this phase.

## Shared Patterns

### Idempotency guard convention (all structural + audit SQL)
**Source:** `1288_pima_county_board_of_supervisors.sql` (governments: `WHERE NOT EXISTS` on name; chambers:
`WHERE NOT EXISTS` on name+government_id; districts: `WHERE NOT EXISTS` on geo_id+district_type+state;
politicians: `ON CONFLICT (external_id) DO NOTHING`; offices: `WHERE NOT EXISTS` on district_id+politician_id)
and `1290_pima_supervisor_1_stances.sql` (`ON CONFLICT (politician_id, topic_id) DO UPDATE SET ...`).
**Apply to:** every new/modified SQL file this phase (1296, 1297, 1298-1304).

### `state` casing discipline (LOCAL/LOCAL_EXEC = lowercase, table free-text = uppercase)
**Source:** `1288_pima_county_board_of_supervisors.sql` header comment (lines 32-38) — `districts.state`
must be `'az'` lowercase for the LOCAL-tier routing join key; `governments.state`/`offices.representing_state`
stay uppercase `'AZ'` (unrelated free-text convention). **Apply to:** migration 1296's new `districts` rows
(both the 6 ward `LOCAL` rows AND the new Mayor `LOCAL_EXEC` row — Pitfall 7 confirms this AZ-milestone
lowercase convention applies to LOCAL_EXEC too, even though CA precedent uses uppercase for LOCAL_EXEC city
rows).

### geo_id collision scoping (never join on bare geo_id)
**Source:** `1288_pima_county_board_of_supervisors.sql` header comment (Pitfall 2, lines 36-38) and every
office↔district join in the file (`d.geo_id = '...' AND d.district_type = 'LOCAL' AND d.state = 'az' AND
d.mtfcc = 'X0019'`, four-column scoping, never a bare `geo_id` match). **Apply to:** all 7 office↔district
joins in migration 1296 — Tucson's `0477000` is itself a multi-use geo_id (the same TIGER place code will
also appear in `geofence_boundaries` with `state` stored as FIPS `'04'`, an unrelated convention per
Pitfall 7's note on `geofence_boundaries.state` vs `districts.state`).

### Headshot pipeline (crop-first, 600×750, Storage x-upsert)
**Source:** `_tmp-pima-supervisors-headshots.py` `crop_to_4_5()` + `resize_600x750()` + `upload_to_storage()`.
**Apply to:** `_tmp-tucson-headshots.py` — reuse verbatim; only the source-acquisition step changes (WAF
fallback, see delta above).

### Vice Mayor / Chair title-suffix annotation (LOCKED, no separate office)
**Source:** `1288_pima_county_board_of_supervisors.sql` line 250 (`'Supervisor, District 3 (Chair)'`) +
post-verify gate (f) (lines 427-453). **Apply to:** migration 1296's Ward 1 office (`'Council Member, Ward 1
(Vice Mayor)'`), `role_canonical` NULL on all 7 offices.

### Migration numbering (disk-MAX authoritative, not ledger-MAX)
**Source:** `1288_pima_county_board_of_supervisors.sql` footer comment (Pitfall 9 in RESEARCH) — ledger MAX
was 1286 when Pima registered as 1288 (disk MAX was already ahead). **Apply to:** re-verify both ledger MAX
and disk MAX at execute time even though RESEARCH computed 1296 on 2026-07-10 — drift is expected (recurred
every phase this milestone).

## No Analog Found

None — every artifact in this phase has a direct, named, already-read analog (Phase 193's Pima unit for the
SQL/loader/headshot shapes, Phase 193's own `'pima county'` CURATED_LOCAL entry for the banner-wiring shape,
and Nevada's `COVERAGE_STATES` block for the new-Arizona-block shape). The only genuinely novel engineering
surface — not lacking an analog, but requiring the analog's previously-dormant code path — is the multi-ring
winding-classification branch in the ward loader (see delta note above).

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/scripts/`, `C:/EV-Accounts/backend/migrations/` (globbed +
grepped for `pima`/`lv-ward`/`128*`/`129*`), `src/lib/coverage.js`, `src/lib/buildingImages.js`,
`scripts/banners/` (this repo).
**Files scanned/read in full or targeted:** `load-pima-supervisor-boundaries.ts` (329 lines, full),
`load-lv-ward-boundaries.ts` (targeted, lines 1-160, anti-pattern confirmation),
`1288_pima_county_board_of_supervisors.sql` (469 lines, full), `1289_pima_county_headshots.sql` (86 lines,
full), `1290_pima_supervisor_1_stances.sql` (targeted, lines 1-80), `_tmp-pima-supervisors-headshots.py` (400
lines, full), `coverage.js` (lines 1-280), `buildingImages.js` (lines 155-420), `process_banner.py` +
`upload_banner.py` (targeted, signatures only) — all read via non-overlapping ranges, no re-reads.
**Pattern extraction date:** 2026-07-09
