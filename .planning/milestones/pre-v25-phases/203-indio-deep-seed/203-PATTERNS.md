# Phase 203: Indio Deep-Seed - Pattern Map

**Mapped:** 2026-07-13
**Files analyzed:** 8 (5 backend new, 1 backend audit-migration group of 5 stances, 2 frontend
modified)
**Analogs found:** 8 / 8

This phase is the 3rd identical Coachella Valley city deep-seed. Palm Springs (Phase 202) is the
**strongest possible analog** — same state, same by-district-only structure (no at-large seat),
same rotational Mayor/Mayor-Pro-Tem-as-title-on-seat mechanic, same greenfield 5-brand-new-
politicians shape, same headshot-pipeline shape, same stance-migration shape. Every file below has
an exact, on-disk, line-verified analog from Ph202 (verified directly against
`C:/EV-Accounts/backend/migrations/1329-1335` and `load-palmsprings-council-boundaries.ts` /
`_tmp-palmsprings-headshots.py` this session — not just Ph202's own PATTERNS.md summary). Riverside
(201) is a secondary analog only for the "standalone government, no at-large seat" shape; Palm
Springs supersedes it here because Indio is also a City (not a County).

**One structural divergence from Ph202 worth flagging up front:** Palm Springs' `buildingImages.js`
banner key already existed pre-phase (shipped in Ph201) so Ph202 required **zero** change to that
file. Indio has **no existing `'indio'` key** (confirmed via grep this session) and CONTEXT.md D-01
explicitly requires an Indio-specific (non-reused) banner — so **this phase DOES need a new
`buildingImages.js` CURATED_LOCAL entry**, unlike Ph202's no-op.

**Disk state confirmed this session (`C:/EV-Accounts/backend/migrations`, sorted):**
- Migration disk MAX = `1337_compass_lenses_auto_scope_and_seed.sql` → next free = **1338**
  (Ph202 used 1329-1335; two unrelated migrations, 1336-1337, landed after Ph202 closed).
- Highest custom X-code in use = `X0022` (Palm Springs) → next free = **X0023**.
- Palm Springs used ext_id block `-4011001..-4011005` → next free 5-block (collision-checked, no
  `-4012xxx` hits anywhere in `backend/migrations`) = **`-4012001..-4012005`**. DB-verify unclaimed
  again at execute time per standing discipline (RESEARCH Pitfall/Assumption convention).

## File Classification

| New/Modified File | Repo | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|---|
| `backend/scripts/load-indio-council-boundaries.ts` | EV-Accounts | geofence loader (one-time ETL) | file-I/O (HTTP fetch → PostGIS INSERT) | `backend/scripts/load-palmsprings-council-boundaries.ts` (260 lines, read in full, on disk) | exact — same city-council-district ArcGIS fetch/insert shape; only the URL/MTFCC/prefix/centroid-range differ |
| `backend/migrations/1338_indio_city_council.sql` | EV-Accounts | structural migration (government/chamber/districts/offices) | CRUD (transactional seed) | `backend/migrations/1329_palm_springs_city_council.sql` (492 lines, read in full, on disk) | exact — identical shape: government + chamber + pre-flight geofence assertion + 5 LOCAL district rows + 5×(politician+office) blocks with title set at INSERT + back-fill + post-verification Gates (a)-(f) + ledger footer |
| `backend/migrations/1339_indio_headshots.sql` | EV-Accounts | audit-only migration (politician_images seed) | CRUD (batch INSERT, idempotent) | `backend/migrations/1330_palm_springs_headshots.sql` (82 lines, read in full, on disk) | exact — identical column shape `(id, politician_id, url, type, photo_license)`, same `WHERE NOT EXISTS` idempotency, same audit-only/unregistered header convention |
| `backend/scripts/_tmp-indio-headshots.py` | EV-Accounts | headshot ETL pipeline (gitignored, orchestrator-run) | file-I/O (download → crop/resize → Storage upload) | `backend/scripts/_tmp-palmsprings-headshots.py` (read in full through ROSTER + config block, on disk) | exact — reuse the RGBA-white-composite / crop_to_4_5 fallback / resize_600x750 / upload_to_storage / resolve-by-external_id / dry-run-HEAD-first / per-member explicit `crop_box` structure verbatim; only `ROSTER` + per-member sources change |
| `backend/migrations/1340..1344_indio_councilmember_N_stances.sql` (5 files) | EV-Accounts | audit-only migration (compass stances) | CRUD (evidence-only INSERT, one politician at a time) | `backend/migrations/1331_palm_springs_councilmember_1_stances.sql` (67 lines, read in full, on disk) | exact — same two-table INSERT shape (`inform.politician_answers` + `inform.politician_context`), same evidence-only/honest-blank header-comment discipline (SEEDED list + DELIBERATELY BLANK list), same non-judicial full-topic-set scope |
| `src/lib/coverage.js` | essentials (this repo) | config/data (COVERAGE_STATES→California→areas[] surfacing) | CRUD (static array append) | itself — existing California `areas[]` array (this repo, lines 10-46), specifically the alphabetical gap between `Hawthorne` (line 25) and `Inglewood` (line 26) | exact — same file, append one entry; **insertion point differs from Ph202's Norwalk/Palmdale gap** because "Indio" sorts before "Inglewood" |
| `src/lib/buildingImages.js` | essentials (this repo) | config/data (CURATED_LOCAL banner keying) | CRUD (static object append) | itself — the existing `'palm springs'` key at line 436, and its surrounding Coachella-Valley-track comment block (lines 420-436) | role-match, NOT no-op — **unlike Ph202**, Indio needs a genuinely NEW key (`'indio'`); no such key exists yet (confirmed via grep this session) |
| Indio banner asset | essentials (this repo) | asset processing (banner image) | file-I/O (source → `scripts/banners/process_banner.py` → `upload_banner.py` → Storage) | `scripts/banners/process_banner.py` + `upload_banner.py` (per `docs/banner-asset-pipeline.md`) used to produce `cities/palm-springs.jpg` (Ph201) | role-match — **NOT a no-op this phase** (unlike Ph202); a genuinely new `cities/indio.jpg` must be sourced/processed/uploaded per CONTEXT.md D-01/D-02/D-03 |

## Pattern Assignments

### `backend/scripts/load-indio-council-boundaries.ts` (geofence loader)

**Analog:** `C:/EV-Accounts/backend/scripts/load-palmsprings-council-boundaries.ts` (260 lines,
read in full, on disk this session). Copy this file's entire structure verbatim.

**Header/config block to copy and adapt (lines 1-68):**
```typescript
/**
 * load-indio-council-boundaries.ts
 *
 * Fetches the 5 official City of Indio City Council district boundaries from
 * the city's self-hosted ArcGIS REST service (gis.indio.org — CONTEXT.md D-07)
 * and inserts them into:
 *
 *   essentials.geofence_boundaries  geo_id='indio-ca-council-district-1'..'-5',
 *                                   mtfcc='X0023', state='ca'
 *
 * This loader writes ONLY to essentials.geofence_boundaries — it does NOT touch
 * essentials.districts or essentials.offices. The structural migration refuses
 * to apply until 5 valid X0023 rows exist here (pre-flight gate).
 *
 * CRITICAL: confirm outSR=4326 explicitly in the query — never trust the
 * FeatureServer's native SRID by default (Palm Springs precedent: native SRID
 * was CA state-plane, not WGS84 — ST_GeomFromGeoJSON would store garbage
 * coordinates without an explicit outSR=4326).
 * CRITICAL: request f=geojson (not the default Esri f=json) — confirm at
 * execute time whether gis.indio.org's layer returns a GeoJSON FeatureCollection
 * directly (Palm Springs precedent) or Esri rings requiring a conversion helper
 * (Pima County precedent, CONTEXT.md fallback note D-09) — inspect one feature's
 * response shape before writing the parse loop.
 * CRITICAL: cross-check feature count = 5 and confirm the district-number
 * attribute name (CONTEXT.md D-08 — Ordinance No. 1775 defines the 5 districts;
 * do not assume the attribute is named "DISTRICT" the way Palm Springs' was —
 * verify against the actual response).
 * CRITICAL: state='ca' lowercase — required for LOCAL-tier routing join key.
 *
 * ORCHESTRATION: running this script is an ORCHESTRATOR-RUN step (reads
 * C:/EV-Accounts/backend/.env DATABASE_URL). The executor only writes this file
 * to disk; it does NOT run the loader.
 *
 * Usage (from C:/EV-Accounts/backend):
 *   npx tsx scripts/load-indio-council-boundaries.ts --dry-run
 *   npx tsx scripts/load-indio-council-boundaries.ts
 */

const INDIO_COUNCIL_URL =
  'https://gis.indio.org/arcgis/rest/services/<Boundaries-or-Districts-layer>/FeatureServer/0/query' +
  '?where=1%3D1&outFields=*&returnGeometry=true&f=geojson&outSR=4326';
  // ^ RESEARCH TODO at plan/execute time: find the actual FeatureServer/MapServer
  //   path under gis.indio.org/arcgis/rest/services/ (CONTEXT.md D-07) — Palm
  //   Springs' service name had URL-encoded parentheses (%28View%29); Indio's
  //   may or may not. Confirm before hardcoding.

const MTFCC          = 'X0023';   // next unused X-code after X0022/Palm Springs — DB-verify unused at execute time
const STATE_CODE     = 'ca';      // CRITICAL: lowercase — required for LOCAL-tier routing
const SOURCE         = 'gis.indio.org-council-districts-2026';  // adjust once real layer name is confirmed
const GEO_ID_PREFIX  = 'indio-ca-council-district-';
const EXPECTED_COUNT = 5;
```

**Fetch + district-number extraction — copy the parse-loop shape verbatim (Palm Springs lines
130-162), but treat the district-attribute NAME as unconfirmed (unlike Palm Springs' pre-confirmed
`DISTRICT` string field) — probe the response and adapt:**
```typescript
const rawDist = props['DISTRICT'] ?? props['District'] ?? props['DIST_NUM'] ?? props['DISTRICTNO'];
const dist = parseInt(String(rawDist ?? ''), 10);
if (isNaN(dist) || dist < 1 || dist > EXPECTED_COUNT) {
  console.warn(`  WARNING: district value '${String(rawDist)}' out of range 1-${EXPECTED_COUNT} — skipping. properties: ${JSON.stringify(props)}`);
  continue;
}
```
Log any officeholder/council-name attribute the layer carries as a free roster cross-check only,
same discipline as Palm Springs' `CouncilName` logging — never use it to form `geo_id`.

**INSERT + ST_MakeValid repair + verify — copy Palm Springs lines 183-260 verbatim**, swapping
`X0022`→`X0023`, `palm-springs-ca-council-district-`→`indio-ca-council-district-`, and the
Palm-Springs centroid sanity comment (~-116.5° lon, ~33.8° lat) for Indio's (~-116.2° lon, ~33.7°
lat). Keep the hard-abort-on-partial-set discipline (`process.exit(1)` if `distMap.size !==
EXPECTED_COUNT`) verbatim — never load a partial set. If the gis.indio.org layer turns out to
return Esri rings instead of GeoJSON (CONTEXT.md D-09 fallback), fall back to Pima County's
rings-conversion helper instead of Palm Springs' direct `JSON.stringify(feature.geometry)`.

---

### `backend/migrations/1338_indio_city_council.sql` (structural)

**Analog:** `C:/EV-Accounts/backend/migrations/1329_palm_springs_city_council.sql` (492 lines, read
in full, on disk this session). Copy this file's overall shape verbatim, section by section.

**Step 1 — Government (copy lines 64-71 verbatim, substitute names):**
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Indio, California, US',
       'City', 'CA', 'Indio', '0636448'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Indio, California, US'
);
```

**Step 2 — Chamber (copy lines 79-90 verbatim, substitute government-name lookup):**
```sql
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'City Council',
       'Indio City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Indio, California, US'),
       5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City of Indio, California, US')
);
```
`official_count = 5` — the rotational Mayor is one of the 5 by-district seats, same convention as
Palm Springs (no separate LOCAL_EXEC Mayor row; CONTEXT.md D-05).

**Step 3 — Pre-flight assertion + 5 LOCAL district rows (copy lines 100-151 verbatim shape):**
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'ca' AND mtfcc = 'X0023') < 5 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 5 X0023 geofences found — run load-indio-council-boundaries.ts before applying this migration.';
  END IF;
END $$;

-- LOCAL district for Council District 1 (Glenn Miller)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'ca', 'indio-ca-council-district-1',
       'Indio City Council District 1', 'X0023'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'indio-ca-council-district-1' AND district_type = 'LOCAL' AND state = 'ca'
);
-- repeat for districts 2-5
```
Never insert or reference the bare whole-city geo_id `'0636448'` row in these district inserts —
same discipline as Palm Springs' `0655254` caution (line 96).

**Step 4 — Politicians + offices, 5 blocks, title set DIRECTLY at INSERT (Bellflower/Palm-Springs
model — all 5 net-new/greenfield). Copy block shape verbatim (Palm Springs lines 167-343):**
```sql
-- BLOCK 3: Council District 3 Elaine Holmes (-4012003) — Mayor
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Elaine Holmes', 'Elaine', 'Holmes', NULL,
          true, false, false, true, -4012003)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Indio, California, US')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'indio-ca-council-district-3'
  AND d.district_type = 'LOCAL'
  AND d.state = 'ca'
  AND d.mtfcc = 'X0023'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```
Repeat the identical block shape for the other 4 (party=NULL on all — nonpartisan/antipartisan
convention, `representing_state='CA'` uppercase, `role_canonical=NULL`):
- D1 Glenn Miller → `title = 'Councilmember'`, ext_id `-4012001`
- D2 Waymond Fermon → `title = 'Mayor Pro Tem'`, ext_id `-4012002`
- D3 Elaine Holmes → `title = 'Mayor'`, ext_id `-4012003` (as shown above)
- D4 Oscar Ortiz → `title = 'Councilmember'`, ext_id `-4012004`
- D5 Benjamin Guitron IV → `title = 'Councilmember'`, ext_id `-4012005` (reconfirm full name live
  per CONTEXT.md D-06 before writing `full_name`/`last_name`)

**office_id back-fill — copy Palm Springs lines 337-342 verbatim, adjust range:**
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -4012005 AND -4012001
  AND p.office_id IS NULL;
```

**Step 6 — Post-verification DO block, Gates (a)-(f) — copy Palm Springs lines 354-479 verbatim,
substitute names/ranges/expected external_ids for the Mayor/MPT identity assert:**
```sql
-- Gate (f): exactly 1 title='Mayor' AND exactly 1 title='Mayor Pro Tem'
...
IF v_mayor_extid <> -4012003 THEN
  RAISE EXCEPTION 'Post-verification FAILED: Mayor title is on external_id % — expected -4012003 (Elaine Holmes, D3)', v_mayor_extid;
END IF;
IF v_mpt_extid <> -4012002 THEN
  RAISE EXCEPTION 'Post-verification FAILED: Mayor Pro Tem title is on external_id % — expected -4012002 (Waymond Fermon, D2)', v_mpt_extid;
END IF;
```
Keep Gates (a)-(e) structurally identical (government count=1; 5 offices on LOCAL X0023 districts;
each district holds exactly 1 office; appointed count=0; **Gate (e) is the section-split check** —
0 offices reachable via the 5 `indio-ca-council-district-%` districts under any non-Indio
government — this is the standing split-section discipline referenced in project memory
`feedback_section_split_check`).

**Ledger registration (copy lines 483-491 verbatim, substitute version/name):**
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1338', 'indio_city_council')
ON CONFLICT (version) DO NOTHING;
```
Re-verify `1338` is still free on disk/ledger at actual execute time (Palm Springs' footer comment
explicitly re-stated its own free-version check the same way — copy that verification-comment
discipline, not just the INSERT).

---

### `backend/scripts/_tmp-indio-headshots.py` (headshot pipeline)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-palmsprings-headshots.py` (read in full through the
ROSTER+config block, on disk this session). Reuse verbatim: the RGBA→white-composite step, the
`crop_to_4_5()` fallback (used only when a member has no explicit `crop_box`), `resize_600x750()`
(Lanczos, `optimize=True` strips EXIF), `upload_to_storage()` (`x-upsert: true` PUT to
`politician_photos/{uuid}-headshot.jpg`), resolve-politician-by-`external_id` at runtime
(parameterized psycopg2), dry-run HEAD-check every roster URL first, and the env-load block.

**What changes — the `ROSTER` list shape (mirror lines 56-84 exactly), sources per CONTEXT.md
D-10/D-11:**
```python
ROSTER = [
    {'external_id': -4012001, 'full_name': 'Glenn Miller', 'district': 1,
     'photo_url': '<indio.civicweb.net/portal/members.aspx?id=10 photo, or StaffDirectory fallback>',
     'photo_license': '<verify — press_use unless a genuine .gov photo>',
     'crop_box': (0, 0, 0, 0)},  # face-aware, set per real image dimensions
    # ... 4 more entries, D2 Fermon / D3 Holmes / D4 Ortiz / D5 Guitron IV
]

for _m in ROSTER:
    _m['is_required'] = True

assert len(ROSTER) == 5, f'Expected 5 roster entries, got {len(ROSTER)}'
assert len({m['external_id'] for m in ROSTER}) == 5, 'external_ids must be unique'
assert all(-4012005 <= m['external_id'] <= -4012001 for m in ROSTER), 'external_id out of range'
```
Primary source (CONTEXT.md D-10) = `indio.civicweb.net/portal/members.aspx?id=10`. For gaps,
CONTEXT.md D-11 specifies `indio.org` CivicPlus StaffDirectory component id 38 (e.g. Holmes =
`/Home/Components/StaffDirectory/StaffDirectory/38/181`) via Browser-UA/Playwright to get past the
CivicPlus WAF (`indio.org` returns WAF-403 directly, per CONTEXT.md heading). Probe every candidate
URL for HTTP 200 individually before hardcoding into `photo_url` — same per-member-hardcoded
discipline as Palm Springs' campaign-site sources. Do not default `photo_license` to
`'us_government_work'` unless the final source IS a `.gov`/CivicWeb-hosted-by-the-city page — use
`'press_use'` for campaign/press sources, same rule Palm Springs' 5-row header comment demonstrates.

**Orchestration note to preserve verbatim:** gitignored (`backend/scripts/_*`), never committed;
executor only WRITES it to disk, ORCHESTRATOR runs it.

---

### `backend/migrations/1339_indio_headshots.sql` (audit-only, unregistered)

**Analog:** `C:/EV-Accounts/backend/migrations/1330_palm_springs_headshots.sql` (82 lines, read in
full, on disk this session). Copy the header-comment shape and per-row shape verbatim, 5 rows:
```sql
-- Glenn Miller (District 1, external_id=-4012001)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -4012001),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', '<license — matches actual source>'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -4012001)
);
```
Columns are exactly `(id, politician_id, url, type, photo_license)`; `type` MUST be `'default'`
(UI filters on it — `project_schema_key_tables` memory note). Header comment block must state
AUDIT-ONLY / NOT registered in the ledger / applied via `psql -f` AFTER the Python pipeline uploads
to Storage — copy Palm Springs' header verbatim, substituting the per-member source list. Politician
UUIDs come from the structural migration's actual `gen_random_uuid()` output (captured in this
phase's own SUMMARY manifest) — never invented ahead of time.

---

### `backend/migrations/1340..1344_indio_councilmember_N_stances.sql` (audit-only, one per councilmember)

**Analog:** `C:/EV-Accounts/backend/migrations/1331_palm_springs_councilmember_1_stances.sql` (67
lines, read in full, on disk this session). Copy the file-header shape verbatim — identity/context
comment block (name, ext_id, politician_id, nonpartisan-office note, district description),
evidence-only/honest-blank discipline statement listing SEEDED topics with values and citations vs.
DELIBERATELY BLANK topics with a one-line reason, `BEGIN;`/`COMMIT;` wrapper, and the two-table
INSERT pattern per topic:
```sql
-- ----- <Councilmember> / <topic-slug> (value N) -----
INSERT INTO inform.politician_answers (politician_id, topic_id, value)
VALUES ('<councilmember-uuid>', '<topic-uuid>', <1.0-5.0>)
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET value = EXCLUDED.value;

INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
VALUES ('<councilmember-uuid>', '<topic-uuid>',
        $$<evidence-based reasoning, cited, quotes/votes where available>$$,
        ARRAY['<source-url-1>', '<source-url-2>']::text[])
ON CONFLICT (politician_id, topic_id)
DO UPDATE SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
```
**Mandatory conventions (memory-enforced, non-negotiable — identical to Ph201/Ph202):**
- ONE research agent at a time (`feedback_stance_research_one_at_a_time`).
- ALL live compass topics researched per councilmember; City Council is non-judicial (no
  court-scoped-* topics).
- Topics with zero attributable evidence are OMITTED ENTIRELY, listed under "DELIBERATELY BLANK"
  in the header comment — never a neutral/default value (`feedback_stance_no_default_value`).
- One file per councilmember (5 files, one per district).
- Applied audit-only — NOT registered in `supabase_migrations.schema_migrations`.
- Party is never stored/displayed for these nonpartisan municipal offices
  (`feedback_antipartisan_display`).

---

### `src/lib/coverage.js` (COVERAGE_STATES → California → areas[] entry)

**Analog:** the existing California `areas[]` array itself (this repo, lines 10-46, read in full
this session). **Insertion point differs from Ph202** — "Indio" sorts alphabetically before
"Inglewood" (I-n-d < I-n-g), between `Hawthorne` (line 25) and `Inglewood` (line 26), NOT in the
Norwalk/Palmdale gap Ph202 used.

**Current array section (lines 25-26), exact insertion point:**
```javascript
{ label: 'Hawthorne', browseGovernmentList: ['0632548'], browseStateAbbrev: 'CA', hasContext: true },
{ label: 'Inglewood', browseGovernmentList: ['0636546'], browseStateAbbrev: 'CA', hasContext: true },
```

**Exact pattern to insert (alphabetically between the two above):**
```javascript
{ label: 'Indio', browseGovernmentList: ['0636448'], browseStateAbbrev: 'CA', hasContext: true },
```
`hasContext: true` should only be set once ≥1 stance row actually exists in
`inform.politician_answers` — stage as `hasContext: false` first if the coverage-chip wave runs
before the stance wave (Riverside/Palm-Springs/Pima precedent: flip on once stances are live).

---

### `src/lib/buildingImages.js` (CURATED_LOCAL — NEW key, unlike Ph202's no-op)

**Analog:** the existing `'palm springs'` key and its surrounding Coachella-Valley-track comment
block (this repo, lines 420-436, read in full this session).

**Confirmed this session:** no `'indio'` key exists yet (grep returned zero matches). This phase
must ADD one, following the exact comment+entry shape Palm Springs used:
```javascript
//   indio         - <Old Town / downtown Indio streetscape photo credit> | <CC license>
'indio': { state: 'CA', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/indio.jpg' },
```
Insert this near the other Coachella Valley CITY banners (`'palm springs'`, `'riverside'`,
`'temecula'`) for locality, distinct from the `'riverside county'` COUNTY-tier key just above them
— per the existing file's own comment: "Longest-key-first matching keeps 'riverside county' (county
browse) distinct from 'riverside' (city address)." Per CONTEXT.md D-01/D-02/D-03: source a real,
licensed, non-AI, non-aerial Old-Town/downtown-Indio streetscape photo (or heritage/date-palm
imagery as second choice) — do NOT reuse the CV/Mission-Inn banner except as a last resort. Source
one candidate at a time (banner-sourcing quota rule) and process via `scripts/banners/
process_banner.py` + `upload_banner.py` per `docs/banner-asset-pipeline.md`, uploading to
`politician_photos/cities/indio.jpg` with storage no-cache overwrite (instant refresh — no
cache-busting query string needed, per `project_banner_redo_technique` memory).

## Shared Patterns

### Casing convention (applies to loader + structural migration)
**Source:** every prior county/city phase (Riverside 201, Palm Springs 202, Pima 193, WashCo 175).
```
essentials.districts.state       = 'ca'  (lowercase) — LOCAL/COUNTY/STATE routing key
essentials.governments.state     = 'CA'  (uppercase) — free-text label
essentials.offices.representing_state = 'CA'  (uppercase) — free-text label
```
Apply to: `load-indio-council-boundaries.ts`, `1338_indio_city_council.sql`.

### Idempotency convention (applies to all migrations)
**Source:** `1329_palm_springs_city_council.sql` / `1330_palm_springs_headshots.sql` /
`1331-1335_palm_springs_councilmember_N_stances.sql` (all read in full/part this session).
```sql
-- governments/chambers/districts: WHERE NOT EXISTS guard (no unique constraint on name/geo_id)
-- politicians: ON CONFLICT (external_id) DO NOTHING
-- offices: WHERE NOT EXISTS (district_id, politician_id)
-- politician_images: WHERE NOT EXISTS (politician_id)
-- politician_answers/context: ON CONFLICT (politician_id, topic_id) DO UPDATE
```
Apply to: the structural migration, headshots migration, 5 stance migrations.

### Rotational Mayor / Mayor Pro Tem as title-on-seat (Bellflower 156 → Palm Springs 202 → Indio 203)
Set directly at office-INSERT time (all 5 Indio members are net-new/greenfield, same as Palm
Springs). `title='Mayor'` on Holmes' D3 office; `title='Mayor Pro Tem'` on Fermon's D2 office;
`title='Councilmember'` on the other 3 (Miller D1, Ortiz D4, Guitron IV D5). NO separate LOCAL_EXEC
district, NO separate Mayor office/chamber. `official_count=5`. Exactly-one-Mayor +
exactly-one-Mayor-Pro-Tem asserts inside the post-verification DO block Gate (f) (identical SQL
shape to Palm Springs, substituting the expected external_ids). **Reconfirm the sitting Mayor/MPT
live at execute time** — CONTEXT.md D-04 explicitly requires re-confirming the whole roster against
`indio.civicweb.net`/`indio.org` before seeding, do not seed from the CONTEXT.md table alone.

### Orchestrator-run vs. executor-authored split
**Source:** every prior county/city phase (Riverside 201, Palm Springs 202, Pima 193, Tucson 194).
`gsd-executor` has NO Supabase MCP/Storage access. The executor:
- writes `load-indio-council-boundaries.ts`, the structural migration, the headshot Python
  pipeline, the headshots migration, and the 5 stance migrations to disk
- does NOT run `npx tsx`, does NOT `psql -f` apply, does NOT run the Python pipeline, does NOT touch Storage
The orchestrator runs the loader, applies migrations via `psql -f` against
`C:/EV-Accounts/backend/.env` `DATABASE_URL`, runs the headshot pipeline, sources/processes/uploads
the banner, and captures UUIDs into the audit migrations.

### Section-split / district-collision guard (standing check, expect 0)
**Source:** Palm Springs Gate (e) (`1329`, lines 416-430, read in full this session); Riverside's
Gate (e) precedent; `feedback_section_split_check` memory. Never join or filter on the bare city
geo_id `'0636448'`; always scope with `AND district_type = 'LOCAL' AND mtfcc = 'X0023' AND
state = 'ca'` for the 5 new council districts. Run this as both (a) an in-migration Gate inside the
post-verification DO block, and (b) a standalone post-hoc split-section check query (per
`feedback_section_split_check`) — expect 0 rows:
```sql
SELECT COUNT(*)
FROM essentials.offices o
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.chambers c ON c.id = o.chamber_id
WHERE d.geo_id LIKE 'indio-ca-council-district-%'
  AND d.district_type = 'LOCAL' AND d.state = 'ca' AND d.mtfcc = 'X0023'
  AND c.government_id <> (SELECT id FROM essentials.governments
                          WHERE name = 'City of Indio, California, US');
-- expect 0
```
Also remember the GOTCHA recorded from Ph202 review (project memory `project_phase202_complete`):
verify-greps forbid forbidden tokens in comments too, not just in executable SQL — keep any
"never do X" comment language consistent with what the verification script actually greps for.

## No Analog Found

None. Every planned file for this phase has an exact, disk-verified analog from Phase 202 (Palm
Springs). The two files that were previously no-ops in Ph202 (`buildingImages.js`, the banner asset
itself) are NOT no-ops here — Indio needs a genuinely new banner key and asset, per CONTEXT.md D-01.

## Metadata

**Analog search scope:** `.planning/phases/203-indio-deep-seed/203-CONTEXT.md`,
`.planning/phases/202-palm-springs-deep-seed/202-CONTEXT.md` and `202-PATTERNS.md` (both read in
full), `.planning/phases/201-riverside-county-board-of-supervisors-deep-seed/201-CONTEXT.md` (read
in full), `C:/EV-Accounts/backend/scripts/load-palmsprings-council-boundaries.ts` (260 lines, read
in full), `C:/EV-Accounts/backend/scripts/_tmp-palmsprings-headshots.py` (read through the ROSTER +
config block), `C:/EV-Accounts/backend/migrations/1329_palm_springs_city_council.sql` (492 lines,
read in full across 3 targeted non-overlapping ranges), `1330_palm_springs_headshots.sql` (82 lines,
read in full), `1331_palm_springs_councilmember_1_stances.sql` (67 lines, read in full), a directory
listing + numeric sort of `C:/EV-Accounts/backend/migrations` (confirming disk MAX = 1337, next free
= 1338), a repo-wide grep for `X00[0-9]{2}` (confirming next free X-code = X0023) and for
`-4011/-4012` ext_id blocks (confirming `-4012001..-4012005` unclaimed), `C:/Transparent
Motivations/essentials/src/lib/coverage.js` (lines 1-60, read in full, confirming the
Hawthorne/Inglewood alphabetical insertion point) and `buildingImages.js` (lines 420-450, read in
full, confirming no `'indio'` key exists yet).
**Files scanned:** 11 (203-CONTEXT.md, 202-CONTEXT.md, 202-PATTERNS.md, 201-CONTEXT.md full reads;
load-palmsprings-council-boundaries.ts, _tmp-palmsprings-headshots.py partial, 1329/1330/1331
migrations full reads; migrations-directory listing + X-code/ext_id greps; coverage.js and
buildingImages.js targeted reads).
**Pattern extraction date:** 2026-07-13
