# Phase 164: North Las Vegas Deep-Seed - Pattern Map

**Mapped:** 2026-06-28
**Files analyzed:** 8 (7 new + 1 modified)
**Analogs found:** 8 / 8 (all exact — this is the 4th NV-metro city deep-seed in a LOCKED pattern; Phase 163 Henderson is the verbatim template)

> **Cross-repo note.** Six files live in the backend repo `C:/EV-Accounts/backend/` (scripts/, migrations/). One file (`coverage.js`) lives in this repo `C:/Transparent Motivations/essentials/`. The gsd-executor WRITES the `.ts`/`.sql`/`.py` files; the **inline orchestrator** runs all DB probes, applies migrations via `psql -f` (using `C:/EV-Accounts/backend/.env` `DATABASE_URL`), runs the loader (`npx tsx`), and runs the headshot `.py`. The executor has **NO Supabase MCP**.

> **Locked deltas vs Henderson (apply to every file):** MTFCC `X0016`→`X0017`; geo_id slug `henderson-nv-council-ward-N`→`north-las-vegas-nv-council-ward-N`; ward source = shared Clark County GISMO layer `PoliticalBoundaries/MapServer/5` filtered `where=PLACE=80` (not a per-city MapServer); ward titles use **Arabic** numerals (`Ward 1`–`Ward 4`) NOT Roman; structural migration `1084`→`1093` (on-disk MAX confirmed 1092); external_id `-3206xxx`→`-3207xxx`; gov name `City of North Las Vegas, Nevada, US`; city geo_id `3231900`→`3251800`; `official_count=5` (unchanged); ward count 4 (unchanged).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-north-las-vegas-ward-boundaries.ts` (NEW) | loader / migration | transform (ArcGIS rings→GeoJSON→PostGIS) | `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts` | exact |
| `C:/EV-Accounts/backend/migrations/1093_north_las_vegas_city_council.sql` (NEW) | migration (structural) | CRUD (INSERT gov/chamber/districts/offices) | `C:/EV-Accounts/backend/migrations/1084_henderson_city_council.sql` | exact |
| `C:/EV-Accounts/backend/scripts/_tmp-north-las-vegas-council-headshots.py` (NEW, gitignored) | service / script | file-I/O (download→crop→resize→Storage PUT) | `C:/EV-Accounts/backend/scripts/_tmp-henderson-council-headshots.py` | exact |
| `C:/EV-Accounts/backend/migrations/1094_north_las_vegas_city_council_headshots.sql` (NEW, audit-only) | migration (audit) | CRUD (INSERT politician_images) | `C:/EV-Accounts/backend/migrations/1085_henderson_city_council_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1095..1099_north_las_vegas_*_stances.sql` (NEW ×5, audit-only) | migration (audit) | CRUD (INSERT inform.politician_answers + _context) | `C:/EV-Accounts/backend/migrations/1086_henderson_romero_stances.sql` (×5: 1086–1090) | exact |
| `C:/Transparent Motivations/essentials/src/lib/coverage.js` (MODIFY) | config | request-response (drives purple hasContext chip) | the Henderson entry in the NV block (line 187) | exact |
| `C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts` (MODIFY) | test | request-response (PIP smoke probe) | the NLV City Hall test entry already in that file (lines 69–79) | exact |

## Pattern Assignments

### `load-north-las-vegas-ward-boundaries.ts` (loader, transform)

**Analog:** `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts` (read in full — 237 lines). Copy verbatim and change ONLY the constants block + the WARD/wardName parse. `fetchJson`, `arcgisRingsToGeoJson`, the DB Pool setup, the INSERT, and the `ST_MakeValid` fallback copy unchanged.

**Constants block to change** (Henderson lines 51–62 → NLV):
```typescript
// CRITICAL: where=PLACE=80 — the layer holds ALL 3 valley cities' wards (60=Hend,65=LV,80=NLV)
// CRITICAL: outSR=4326 — county MapServer default CRS is projected (NV State Plane)
// CRITICAL: f=json (NOT f=geojson) — returns ArcGIS rings, not GeoJSON
const NLV_WARD_URL =
  'https://maps.clarkcountynv.gov/arcgis/rest/services/OpenData/' +
  'PoliticalBoundaries/MapServer/5/query' +
  '?where=PLACE%3D80&outFields=WARD,NAME,PLACE' +
  '&returnGeometry=true&f=json&outSR=4326' +
  '&resultOffset=0&resultRecordCount=100';

const MTFCC          = 'X0017';    // Wave-0 re-probe confirms unclaimed
const STATE_CODE     = 'nv';       // CRITICAL: lowercase — LOCAL-tier routing
const SOURCE         = 'clarkcountynv.gov-gismo-politicalboundaries-ward-place80-2026';
const GEO_ID_PREFIX  = 'north-las-vegas-nv-council-ward-';
const EXPECTED_COUNT = 4;
```

**WARD/wardName parse to change** (Henderson lines 136, 149):
```typescript
// Clark County WARD is esriFieldTypeSmallInteger (already int) — parseInt(String(...)) still safe.
// NLV uses ARABIC numerals (NOT Henderson's "WARD I" Roman from WARDNAME):
const rawWard = attrs['WARD'];
const ward = parseInt(String(rawWard ?? ''), 10);
const wardName = `Ward ${ward}`;
```

**INSERT + ST_MakeValid fallback** (Henderson lines 175–219) — **copy verbatim, no change.** Wards 1 and 2 have 7 rings each (multi-body); the existing `ST_Multi(ST_MakeValid(...))` re-run path handles them exactly as Henderson Ward III (4 rings) and LV wards 4/5/6 (21–30 rings) required:
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
// ...if row.valid !== true: UPDATE ... ST_Multi(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON($2),4326)))
```

**Run (inline orchestrator, from `C:/EV-Accounts/backend`):** `npx tsx scripts/load-north-las-vegas-ward-boundaries.ts --dry-run` then without the flag. Verify: `SELECT COUNT(*), bool_and(public.ST_IsValid(geometry)) FROM essentials.geofence_boundaries WHERE state='nv' AND mtfcc='X0017';` → expect `(4, true)`.

---

### `1093_north_las_vegas_city_council.sql` (migration, structural CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1084_henderson_city_council.sql` (read in full — 340 lines). The 7-step shape (pre-flight → government → chamber → LOCAL_EXEC district → 4 LOCAL ward districts → 5 politician+office CTE blocks → office_id back-fill → post-verify DO block → COMMIT → ledger INSERT outside txn) copies exactly. Substitute the locked deltas.

**Pre-flight** (Henderson lines 27–38) — change MTFCC and gov name:
```sql
IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
    WHERE state = 'nv' AND mtfcc = 'X0017') < 4 THEN
  RAISE EXCEPTION 'Pre-flight FAILED: fewer than 4 X0017 ward geofences — run load-north-las-vegas-ward-boundaries.ts first.';
END IF;
```

**Casing convention (Henderson header lines 15–19 — DO NOT vary):**
```
districts.state            = 'nv'   (lowercase — routing join key; 'NV' = 0 rows, silent no-op)
governments.state          = 'NV'   (uppercase)
offices.representing_state  = 'NV'   (uppercase free-text label)
geofence_boundaries.state  = 'nv'   (lowercase — set by the ward loader)
```

**Step 1 government** (Henderson lines 44–51) — `WHERE NOT EXISTS` mandatory (no unique constraint):
```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of North Las Vegas, Nevada, US', 'City', 'NV', NULL, '3251800'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of North Las Vegas, Nevada, US');
```

**Step 2 chamber** (Henderson lines 57–68) — `'North Las Vegas City Council'`, `official_count=5`, `name_formal` non-empty, NEVER insert the GENERATED-ALWAYS path column.

**Step 3a LOCAL_EXEC Mayor district** (Henderson lines 74–79) — `geo_id='3251800'`, `district_type='LOCAL_EXEC'`, `state='nv'`, `mtfcc='G4110'`, `label='City of North Las Vegas'`.

**Step 3b 4 LOCAL ward districts** (Henderson lines 85–111) — `mtfcc='X0017'`, geo_id `north-las-vegas-nv-council-ward-1..4`, **Arabic labels `'Ward 1'..'Ward 4'`** (Henderson used Roman `'Ward I'`):
```sql
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'north-las-vegas-nv-council-ward-1', 'Ward 1', 'X0017'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts
  WHERE geo_id = 'north-las-vegas-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv');
-- repeat for wards 2/3/4
```

**Step 4 politician+office CTE blocks** (Henderson lines 119–279) — copy the `WITH ins_p AS (INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id) INSERT INTO offices ... CROSS JOIN ins_p p ... WHERE d.geo_id=... AND d.district_type=... AND d.state='nv' AND NOT EXISTS (office on (district_id, politician_id))` shape verbatim per seat. Mayor uses `district_type='LOCAL_EXEC'`, title `'Mayor'`, geo_id `'3251800'`. Ward members use `district_type='LOCAL'`, title `'Council Member, Ward N'` (Arabic), geo_id `'north-las-vegas-nv-council-ward-N'`. Chamber subquery: `name='North Las Vegas City Council'` joined on the NLV gov.

Roster + external_ids + status flags (RESEARCH §Key Verified Facts):
| ext_id | full_name | first/last | title | flags |
|--------|-----------|------------|-------|-------|
| -3207001 | Pamela Goynes-Brown | Pamela / Goynes-Brown | Mayor (LOCAL_EXEC) | active, incumbent; NOT rotational |
| -3207002 | Isaac E. Barrón | Isaac / Barrón | Council Member, Ward 1 | active, incumbent; **keep accent** |
| -3207003 | Ruth Garcia-Anderson | Ruth / Garcia-Anderson | Council Member, Ward 2 | `is_appointed=false` (won full term Nov 2024) |
| -3207004 | Scott Black | Scott / Black | Council Member, Ward 3 | `is_active=true, is_incumbent=true` (seated despite Nov 2026 mayoral runoff — the Carrie Cox parallel) |
| -3207005 | Richard Cherchio | Richard / Cherchio | Council Member, Ward 4 | active, incumbent (re-elected unopposed 2024) |

All `party='Non-Partisan'`.

**Step 5 office_id back-fill** (Henderson lines 282–287) — `WHERE p.external_id BETWEEN -3207005 AND -3207001 AND p.office_id IS NULL`.

**Step 6 post-verify DO block** (Henderson lines 290–332) — change gov name + `X0016`→`X0017`. Asserts: 1 gov, 1 LOCAL_EXEC office, 4 LOCAL X0017 offices, 0 section-split orphans (every X0017 geofence has a matching LOCAL district). Full target shape is in RESEARCH.md lines 678–715.

**Step 7 ledger** (Henderson lines 337–339, OUTSIDE the COMMIT, structural only):
```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1093', 'north_las_vegas_city_council')
ON CONFLICT (version) DO NOTHING;
```

**Apply (inline orchestrator):** `psql "$DATABASE_URL" -f migrations/1093_north_las_vegas_city_council.sql` (DATABASE_URL from `C:/EV-Accounts/backend/.env`).

---

### `_tmp-north-las-vegas-council-headshots.py` (service, file-I/O)

**Analog:** `C:/EV-Accounts/backend/scripts/_tmp-henderson-council-headshots.py` (read in full — 326 lines). This is the **per-member fallback variant** (the right one — NLV's official site is Akamai WAF-403, same as Henderson). Copy verbatim; change only the `OFFICIALS` roster list, the guard-assertion range, and the header/print strings.

**`OFFICIALS` roster** (Henderson lines 57–73) — 5 entries `{ext_id, name, url, license}`. Mayor confirmed; 4 council URLs are Wave-0 sourcing tasks:
```python
OFFICIALS = [
    {'ext_id': -3207001, 'name': 'Pamela Goynes-Brown',
     'url': 'https://upload.wikimedia.org/wikipedia/commons/5/51/Pamela_Goynes-Brown.jpg',
     'license': 'public_domain'},   # Wikimedia Commons, Sen. Rosen office photo (476x635) — CONFIRMED
    # Wave-0: source clean portraits for the 4 below (Ballotpedia/campaign/news);
    # cityofnorthlasvegas.com is Akamai WAF-403 — do NOT attempt it.
    {'ext_id': -3207002, 'name': 'Isaac E. Barrón',      'url': '<wave-0>', 'license': 'press_use'},
    {'ext_id': -3207003, 'name': 'Ruth Garcia-Anderson', 'url': '<wave-0>', 'license': 'press_use'},
    {'ext_id': -3207004, 'name': 'Scott Black',          'url': '<wave-0>', 'license': 'press_use'},
    {'ext_id': -3207005, 'name': 'Richard Cherchio',     'url': '<wave-0>', 'license': 'press_use'},
]
```

**Guard assertions** (Henderson lines 76–78) — change range to `-3207005 <= m['ext_id'] <= -3207001`.

**Wikimedia UA caveat:** the Henderson `BROWSER_HEADERS` (lines 103–106) is a Chrome UA. Memory `project_phase159_complete` notes Wikimedia 429s on a browser UA and needs a **descriptive UA** (e.g. `ev-essentials-research/1.0 (contact chris@empowered.vote)`). Since Goynes-Brown is a `upload.wikimedia.org` source, add a per-member UA override OR a descriptive UA for the Wikimedia download. Henderson didn't need this (no Wikimedia source); NLV does.

**Copy verbatim, no change:** the env-load block (lines 84–97 — reads `../.env` for `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`DATABASE_URL`; `BUCKET='politician_photos'`; `CDN_BASE` host `kxsdzaojfaibhuzmclfq`), `resolve_politician_id` (runtime UUID by external_id — NEVER hardcode UUIDs), `download_image`, `crop_to_4_5` (crop FIRST), `resize_600x750` (Lanczos), `upload_to_storage` (PUT `x-upsert:true` to `politician_photos/{uuid}-headshot.jpg`), `process_headshot_bytes` (RGBA→white-composite, MIN_DIM=100, q90, `optimize=True`), `process_member` (SKIP+FAILED on any failure — no fabrication), and the SUCCESS/FAILED manifest emitter.

**Run (inline orchestrator only):** `python scripts/_tmp-north-las-vegas-council-headshots.py`. Manifest SUCCESS lines (`ext_id uuid -> cdn_url [license=...]`) feed the 1094 audit migration.

---

### `1094_north_las_vegas_city_council_headshots.sql` (migration, audit-only CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1085_henderson_city_council_headshots.sql` (not separately excerpted here — same family as 1086 below; read it at execution). Audit-only: **NOT** registered in the ledger. INSERTs `essentials.politician_images` rows (id, politician_id, url, type, photo_license — **NO `photo_origin_url` column**) from the headshot manifest. One row per SUCCESS manifest line; honest gaps (FAILED lines) get no row. Built by the orchestrator from the manifest after the `.py` runs.

---

### `1095..1099_north_las_vegas_*_stances.sql` (migration ×5, audit-only CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1086_henderson_romero_stances.sql` (read in full — 41 lines). One migration per official (5 total: 1095 Goynes-Brown, 1096 Barrón, 1097 Garcia-Anderson, 1098 Black, 1099 Cherchio — match Henderson 1086–1090). Audit-only: NOT registered in the ledger.

**Exact CTE shape to copy** (the `topic_id` is resolved LIVE by `topic_key` + `is_live=true` — NEVER hardcode topic UUIDs):
```sql
BEGIN;
WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('homelessness'::text, 5, 'evidence text...', ARRAY['https://...']::text[]),
    -- one row per topic WITH evidence; omit topics with no evidence (honest blank, no default)
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct
    ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '<uuid>'::uuid, topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
  SELECT '<uuid>'::uuid, topic_id, reasoning, sources FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE
    SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
COMMIT;
```

**Rules (from memories + Henderson header lines 1–10):** the `<uuid>` is resolved from the structural-migration-minted politician (orchestrator captures it via `SELECT id FROM essentials.politicians WHERE external_id = -3207NNN` and writes it into the migration). `val` is a **chair** (the discrete position the evidence matches, 1–5), NOT a polarity. **Every** answer needs a paired non-null `politician_context` row. **Zero defaults** — a topic with no city-level evidence is simply absent (honest blank spoke). Research **all live compass topics**, **one agent at a time** (parallel burns rate-limit quota), no judicial topics. Likely NLV-evidenced topics (RESEARCH §Pattern 4): `homelessness`/`homelessness-response`, `housing`, `public-safety-approach`, `transportation-priorities`, `economic-development` (APEX Industrial Park is a defining NLV issue), `local-environment`, `growth-and-development`, `taxes`.

---

### `src/lib/coverage.js` (config, request-response) — MODIFY

**Analog:** the existing Henderson entry in the NV block. Current NV block (verified at lines 183–189):
```javascript
  {
    name: 'Nevada', abbrev: 'NV',
    areas: [
      { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
      { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    ],
  },
```

**Edit — append one line after Henderson (line 187):**
```javascript
      { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
```
Browse verification link: `essentials.empowered.vote/results?browse_geo_id=3251800&browse_mtfcc=G4110`. This is the **only** file edited in THIS repo; all others are in `C:/EV-Accounts/backend/`. (Note: line 124 is a different "Nevada" — a TX city named Nevada — do NOT confuse it with the NV state block at 183.)

---

### `smoke-nv-geofences.ts` (test, request-response) — MODIFY

**Analog:** `C:/EV-Accounts/backend/scripts/smoke-nv-geofences.ts` (read in full — 284 lines). It already has an NLV **City Hall** G4110 test (lines 69–79). Extend it with **per-ward interior points** so each ward routes to exactly its one X0017 polygon. The `AddressTest` interface (lines 24–31) and `queryBoundaries` (lines 93–107, `ST_Covers` PIP) copy unchanged; add entries to `TEST_ADDRESSES`:
```typescript
{
  label: 'NLV Ward 1 interior (Isaac Barrón)',
  lon: <ward-1-interior-lon>, lat: <ward-1-interior-lat>,
  expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220', 'X0017'],
  expectedGeoIds: { X0017: 'north-las-vegas-nv-council-ward-1', G4110: '3251800' },
},
// repeat per ward 2/3/4 with the matching geo_id
```
Note: `queryBoundaries` filters `WHERE state='32'` (line 101) for TIGER tiers, but the X0017 ward rows are `state='nv'`. Either relax that filter for the ward assertion or add a separate ward-only query. Interior coordinates per ward are a Wave-0 task (pick a point clearly inside each ward polygon).

## Shared Patterns

### Standalone-government INSERT guard
**Source:** `1084_henderson_city_council.sql` lines 44–51
**Apply to:** the structural migration 1093 (government + chamber INSERTs)
`essentials.governments` has NO unique constraint on `geo_id` or `name` — every gov/chamber INSERT MUST use `WHERE NOT EXISTS (SELECT 1 ... WHERE name=...)`. The NLV gov is standalone (NOT nested under State of Nevada geo_id `32`).

### state casing (the #1 silent-failure mode)
**Source:** `1084_henderson_city_council.sql` header lines 15–19 + loader line 59
**Apply to:** 1093 + the ward loader
`districts.state` / `geofence_boundaries.state` = lowercase `'nv'` (routing join key — uppercase `'NV'` matches ZERO rows, a silent no-op). `governments.state` / `offices.representing_state` = uppercase `'NV'`. Note the G4110 TIGER place row the Mayor attaches to is `state='32'` (FIPS) per the Phase 158 loader — the **LOCAL_EXEC district** row is still `state='nv'`.

### office uniqueness guard
**Source:** `1084_henderson_city_council.sql` lines 146–149 (and every CTE block)
**Apply to:** all 5 office INSERTs in 1093
`AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id)` — idempotent on `(district_id, politician_id)`.

### Live topic_id resolution (no hardcoded UUIDs)
**Source:** `1086_henderson_romero_stances.sql` lines 24–28
**Apply to:** all 5 stance migrations 1095–1099
`JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true` — resolves topic UUIDs at apply time; retired topic IDs are excluded automatically.

### Runtime UUID resolution (no hardcoded politician UUIDs in scripts)
**Source:** `_tmp-henderson-council-headshots.py` lines 117–126
**Apply to:** the headshot script (resolve by `external_id`); the stance migrations get their `politician_id` UUID captured by the orchestrator post-1093 via `SELECT id ... WHERE external_id = -3207NNN`.

### Headshot pipeline invariants
**Source:** `_tmp-henderson-council-headshots.py` lines 151–233
**Apply to:** the NLV headshot script
crop-to-4:5 FIRST then resize 600×750 Lanczos q90 (never stretch); RGBA/transparent → white-composite (no black halo); `optimize=True` strips EXIF; bucket `politician_photos`; path `{uuid}-headshot.jpg`; PUT `x-upsert:true`; on any failure SKIP + emit FAILED (NEVER fabricate, NEVER an overlay-over-face image).

### verify-gate forbidden tokens in SQL comments
**Source:** RESEARCH §Common Pitfalls 8 + CONTEXT code_context
**Apply to:** all `.sql` files
Keep the literal tokens `slug`, `schema_migrations`, `photo_origin_url` OUT of comments (grep-gates scan whole files). The Henderson migrations paraphrase ("the auto-generated path column", "the removed image-origin column") — mirror that. `schema_migrations` appears ONLY in the actual ledger INSERT in 1093.

## No Analog Found

None. Every file maps 1:1 to a Phase 163 Henderson analog (which itself mirrors Phase 162 Las Vegas). This is the 4th NV-metro city deep-seed in a fully locked pattern.

## Metadata

**Analog search scope:**
- `C:/EV-Accounts/backend/scripts/` (loaders, headshot script, smoke probe)
- `C:/EV-Accounts/backend/migrations/` (structural 1084, headshot 1085, stances 1086–1090; on-disk MAX confirmed 1092 → next 1093)
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` (NV COVERAGE_STATES block, lines 183–189)

**Files scanned:** 6 read in full (henderson loader, 1084 structural, headshot .py, 1086 stance, smoke-nv-geofences.ts) + coverage.js NV block; migration directory listing confirmed on-disk MAX = 1092.

**Pattern extraction date:** 2026-06-28
