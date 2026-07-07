# Phase 175: Washington County Commission Deep-Seed - Pattern Map

**Mapped:** 2026-06-30
**Files analyzed:** 7 new/modified files
**Analogs found:** 7 / 7

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `C:/EV-Accounts/backend/scripts/load-washco-commissioner-boundaries.ts` | loader script | file-I/O + CRUD (FeatureServer → DB) | `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts` | exact (same 4-ward ArcGIS pattern, different GIS server) |
| `C:/EV-Accounts/backend/migrations/1120_washco_commission.sql` | migration (structural) | CRUD | `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` + `1055_clark_county_commission.sql` | exact (same-state OR template + guard patterns) |
| `C:/EV-Accounts/backend/migrations/1121_washco_commission_headshots.sql` | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1122_washco_harrington_stances.sql` | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1123_washco_fai_stances.sql` | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1124_washco_treece_stances.sql` | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1125_washco_snider_stances.sql` | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql` | exact |
| `C:/EV-Accounts/backend/migrations/1126_washco_willey_stances.sql` | migration (audit-only) | CRUD | `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql` | exact |
| `src/lib/coverage.js` (edit) | frontend config | transform | `src/lib/coverage.js` lines 225–241 (COVERAGE_COUNTIES block) | self (one-line addition) |

---

## Pattern Assignments

### `load-washco-commissioner-boundaries.ts` (loader script, file-I/O + CRUD)

**Analog:** `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts`

**Key divergence from Henderson:** WashCo uses a FeatureServer (not MapServer), which supports `f=geojson` natively. The response is already a GeoJSON FeatureCollection — no `arcgisRingsToGeoJson` conversion helper is needed. Use `JSON.stringify(feature.geometry)` directly.

**Config block** (lines 46–64 of Henderson analog — substitute WashCo values):
```typescript
// CRITICAL: f=geojson (not f=json) — WashCo FeatureServer returns GeoJSON directly.
// CRITICAL: outSR=4326 mandatory — ArcGIS default CRS is Oregon state plane, not WGS 84.
// resultRecordCount=100 included as defensive measure (Henderson needed it; WashCo may too).
const WASHCO_DISTRICT_URL =
  'https://gispub.co.washington.or.us/server/rest/services/BOC_CAO/' +
  'CoCommissioners/FeatureServer/0/query' +
  '?where=1%3D1&outFields=COMMDIST,NAME,Lastname,Firstname' +
  '&returnGeometry=true&f=geojson&outSR=4326&resultRecordCount=100';

const MTFCC          = 'X0018';   // Wave-0 confirmed unclaimed
const STATE_CODE     = 'or';      // CRITICAL: lowercase — required for LOCAL-tier routing
const SOURCE         = 'washingtoncountyor.gov-gis-commissioner-districts-2026';
const GEO_ID_PREFIX  = 'washco-or-commissioner-district-';
const EXPECTED_COUNT = 4;
```

**DB pool setup** (lines 68–76 of Henderson analog — copy exactly):
```typescript
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set');
  process.exit(1);
}
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

**fetchJson helper** (lines 80–98 of Henderson analog — copy exactly, handles redirects + HTTP error codes).

**Feature parsing — WashCo differs from Henderson** (replace rings logic):
```typescript
// WashCo f=geojson: response is a GeoJSON FeatureCollection.
// feature.geometry is already a GeoJSON Polygon object — no conversion needed.
const response = await fetchJson(WASHCO_DISTRICT_URL) as {
  features?: Array<{
    properties: { COMMDIST?: number | string; NAME?: string; [key: string]: unknown };
    geometry: object;  // GeoJSON Polygon or MultiPolygon
  }>;
};

for (const feature of response.features) {
  const rawDist = feature.properties['COMMDIST'];
  const dist = parseInt(String(rawDist ?? ''), 10);
  if (isNaN(dist) || dist < 1 || dist > EXPECTED_COUNT) {
    console.warn(`  WARNING: COMMDIST '${rawDist}' out of range — skipping`);
    continue;
  }
  const geoId    = `${GEO_ID_PREFIX}${dist}`;
  const distName = String(feature.properties['NAME'] ?? `Commissioner District ${dist}`);
  const geomStr  = JSON.stringify(feature.geometry);  // Already GeoJSON — no conversion
  distMap.set(dist, { geoId, name: distName, geomStr });
}
```

**INSERT into geofence_boundaries** (lines 175–184 of Henderson analog — copy structure, use geomStr directly):
```typescript
const result = await pool.query(
  `INSERT INTO essentials.geofence_boundaries
     (id, geo_id, mtfcc, state, name, geometry, source)
   VALUES (gen_random_uuid(), $1, '${MTFCC}', '${STATE_CODE}', $2,
     public.ST_Multi(public.ST_SetSRID(public.ST_GeomFromGeoJSON($3), 4326)),
     $4)
   ON CONFLICT (geo_id, mtfcc) DO NOTHING
   RETURNING public.ST_GeometryType(geometry) AS gtype, public.ST_IsValid(geometry) AS valid`,
  [geoId, name, geomStr, SOURCE],
);
```

**ST_MakeValid fallback** (lines 197–215 of Henderson analog — copy exactly; handles multi-ring polygons):
```typescript
// If ST_IsValid=false, apply ST_MakeValid and recheck — copy the exact
// UPDATE + recheck SELECT pattern from load-henderson-ward-boundaries.ts lines 197–215.
```

**Dry-run gate + summary** (lines 160–165, 224–231 of Henderson analog — copy exactly).

**Verify console hint at end:**
```typescript
console.log(`  SELECT COUNT(*), bool_and(public.ST_IsValid(geometry)) FROM essentials.geofence_boundaries WHERE state='or' AND mtfcc='X0018'; -- expect (4, true)`);
```

---

### `1120_washco_commission.sql` (structural migration, CRUD)

**Analogs:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` (OR same-state template) + `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` (guard key patterns)

**Header comment block** — document the novel split routing: Chair links to COUNTY geo_id=41067; commissioners D1–D4 link to LOCAL X0018 districts.

**Pre-flight notice** (lines 26–32 of migration 244 — copy guard pattern):
```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name = 'Washington County, Oregon, US') > 0 THEN
    RAISE NOTICE 'Washington County government row already exists — skipping (idempotent re-run)';
  END IF;
END $$;
```

**Step 1: Government row** (lines 39–46 of migration 244):
```sql
-- governments.state = 'OR' uppercase (table convention)
-- WHERE NOT EXISTS guard — governments has NO unique constraint on geo_id
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Washington County, Oregon, US',
       'County', 'OR', NULL, '41067'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Washington County, Oregon, US'
);
```

**Step 2: Chamber row** (lines 53–63 of migration 244 — adapt name; note WashCo body name differs from Multnomah):
```sql
-- CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT list.
-- Body name: 'Board of County Commissioners' (verified on washingtoncountyor.gov/bcc)
-- Differs from Multnomah's 'Board of Commissioners' (no 'County')
-- official_count = 5 (per migration 244 shape with explicit official_count column)
INSERT INTO essentials.chambers (id, name, name_formal, government_id, official_count)
SELECT gen_random_uuid(),
       'Board of County Commissioners',
       'Washington County Board of County Commissioners',
       (SELECT id FROM essentials.governments WHERE name = 'Washington County, Oregon, US'),
       5
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of County Commissioners'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Washington County, Oregon, US')
);
```

**Step 3a: COUNTY district row (Chair routes here)** (lines 72–77 of migration 244):
```sql
-- CRITICAL: state='or' LOWERCASE — routing join key; uppercase 'OR' = silent 0 rows
-- geo_id='41067' matches existing G4020 geofence_boundary loaded in Phase 72 OR TIGER
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'or', '41067', 'Washington County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '41067' AND district_type = 'COUNTY' AND state = 'or'
);
```

**Step 3b: Pre-flight geofence check + 4 LOCAL district rows (commissioners route here)**
```sql
-- Pre-flight: assert loader ran before this migration
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'or' AND mtfcc = 'X0018') < 4 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 4 X0018 geofences — run load-washco-commissioner-boundaries.ts first.';
  END IF;
END $$;

-- One LOCAL district per commission district
-- state='or' lowercase; district_type='LOCAL'; mtfcc='X0018'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', 'washco-or-commissioner-district-1',
       'Washington County Commissioner District 1', 'X0018'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'washco-or-commissioner-district-1' AND district_type = 'LOCAL' AND state = 'or'
);
-- Repeat for districts 2, 3, 4 (same pattern, substitute N in geo_id and label)
```

**Step 4a: Chair office block** (lines 90–119 of migration 244 — adapt geo_id to 41067):
```sql
-- Chair routes COUNTY-wide — links to the COUNTY district (geo_id='41067')
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Kathryn Harrington', 'Kathryn', 'Harrington', NULL,
          true, false, false, true, -410100)   -- Wave-0 confirms range -410113..-410100
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
                               WHERE name = 'Washington County, Oregon, US')),
       p.id,
       'County Chair', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '41067'
  AND d.district_type = 'COUNTY'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

**Step 4b: Commissioner district office blocks** (lines 121–151 of migration 244 as template, but filter by LOCAL geo_id not COUNTY):
```sql
-- Commissioner D1 routes to LOCAL district, not COUNTY
-- Note the WHERE clause difference vs the Chair block above
WITH ins_p AS (
  INSERT INTO essentials.politicians (...)
  VALUES (..., 'Nafisa Fai', 'Nafisa', 'Fai', NULL, true, false, false, true, -410110)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (...)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE ...),
       p.id,
       'Commissioner, District 1', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'washco-or-commissioner-district-1'   -- LOCAL, not COUNTY
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o
                  WHERE o.district_id = d.id AND o.politician_id = p.id);
-- Repeat for D2 (Treece -410111), D3 (Snider -410112), D4 (Willey -410113)
```

**Step 5: office_id back-fill** (lines 255–260 of migration 244):
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -410113 AND -410100
  AND p.office_id IS NULL;
```

**Step 6: Post-verification DO block** (lines 269–314 of migration 244 — adapt counts; WashCo needs a 3-gate block):
```sql
-- Gate (a): 1 government row
-- Gate (b): 1 Chair office on COUNTY district (geo_id='41067') — NOT 5 total (commissioners are on LOCAL)
-- Gate (c): 4 commissioner offices on LOCAL X0018 districts
-- Gate (d): section-split scan for COUNTY geofence (geo_id=41067, mtfcc=G4020)
-- Source pattern: migration 244 lines 269–314 (copy DECLARE + IF/RAISE EXCEPTION structure)
```

**Step 7: Migration ledger** (lines 401–403 of migration 1055 — use 2-column form):
```sql
-- OUTSIDE the transaction (after COMMIT)
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1120', 'washco_commission')
ON CONFLICT (version) DO NOTHING;
```

---

### `1121_washco_commission_headshots.sql` (audit-only migration, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql`

**Header comment block** (lines 1–21 of migration 245 — adapt):
- Mark AUDIT-ONLY: not registered in ledger
- Source domain: `media-production.washcotech.net`
- Processing: crop to 4:5 first, resize to 600x750 Lanczos JPEG q90
- Storage path: `politician_photos/{politician_uuid}-headshot.jpg`
- `photo_license = 'us_government_work'` (Oregon county government portraits)

**Per-official INSERT pattern** (lines 29–37 of migration 245 — copy exactly, substitute values):
```sql
-- Kathryn Harrington (-410100) — County Chair
-- source: [URL from headshot pipeline — filled at execution]
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -410100),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -410100)
);
-- Repeat for Fai (-410110), Treece (-410111), Snider (-410112), Willey (-410113)
```

**CRITICAL columns:** Only `(id, politician_id, url, type, photo_license)` — NO `photo_origin_url` (column does not exist).

**No ledger registration** — this migration applies via `psql -f` but does NOT register in `supabase_migrations.schema_migrations` (same as migration 245, which has no ledger INSERT at all).

---

### `1122_washco_harrington_stances.sql` through `1126_washco_willey_stances.sql` (audit-only migrations, CRUD)

**Analog:** `C:/EV-Accounts/backend/migrations/1057_clark_county_commission_naft_stances.sql`

**Structure** (lines 1–39 of migration 1057 — copy exactly):
```sql
-- AUDIT-ONLY: NOT registered in migration ledger.
-- Evidence-only compass stances (CHAIRS model — value is discrete position, not polarity).
-- topic_id resolved LIVE by topic_key (is_live=true) — no hardcoded topic UUIDs.

BEGIN;

WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
    ('housing'::text, 3, 'Evidence text...', ARRAY['https://source.example.com']::text[]),
    -- ... additional topics with evidence ...
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct
    ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '{politician_uuid}'::uuid, topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
  SELECT '{politician_uuid}'::uuid, topic_id, reasoning, sources FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE
    SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;

COMMIT;
```

**Key rules:**
- `politician_id` is the UUID minted by migration 1118 (look up via `SELECT id FROM essentials.politicians WHERE external_id = -410100` in Wave-0)
- Conflict key is `(politician_id, topic_id)` — `DO UPDATE SET value = EXCLUDED.value` (not DO NOTHING, so re-runs update)
- `inform.politician_context` stores reasoning + sources array alongside the answer
- Topic_id resolution uses `JOIN inform.compass_topics ON topic_key AND is_live = true` — NEVER hardcode UUIDs
- Values 1–5 are discrete chair positions (pick the chair evidence matches; omit row entirely if no evidence)
- No ledger registration

---

### `src/lib/coverage.js` edit (frontend config, transform)

**Location in file:** Lines 225–241 (COVERAGE_COUNTIES block).

**Existing block for reference** (lines 225–241, read from file):
```javascript
export const COVERAGE_COUNTIES = [
  { label: 'Los Angeles County', browseGovernmentList: ['06037'], browseStateAbbrev: 'CA', hasContext: true },
  { label: "St. Mary's County", browseGovernmentList: ['24037'], browseStateAbbrev: 'MD' },
  { label: 'Greene County', browseGovernmentList: ['29077'], browseStateAbbrev: 'MO', hasContext: true },
  { label: 'Multnomah County', browseGovernmentList: ['41051'], browseStateAbbrev: 'OR' },
  { label: 'Box Elder County', browseGovernmentList: ['49003'], browseStateAbbrev: 'UT' },
  ...
  { label: 'Washington County', browseGovernmentList: ['49053'], browseStateAbbrev: 'UT' },  // line 238 — COLLISION RISK
  ...
  { label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true },
];
```

**Add after line 229 (the Multnomah County entry)**:
```javascript
  { label: 'Washington County, OR', browseGovernmentList: ['41067'], browseStateAbbrev: 'OR', hasContext: true },
```

**Label collision rule:** The label `'Washington County'` is already used at line 238 for UT geo_id 49053. The new OR entry MUST use `'Washington County, OR'` to avoid ambiguity in the `ALL_COVERAGE_AREAS` search (line 258 uses this array for typeahead).

**Browse link behavior:** `browseGovernmentList: ['41067']` routes to the Washington County government (same pattern as Clark County at line 240 with `['32003']`). The `browse_skip_overlap=1` parameter is handled by the frontend consumer, not in coverage.js.

---

## Shared Patterns

### State Casing Rule (critical for OR)
**Source:** Migration 244 header comment (lines 15–19)
**Apply to:** All district INSERT statements in migration 1118
```sql
-- districts.state = 'or' lowercase for COUNTY and LOCAL types (routing join key)
-- governments.state = 'OR' uppercase (governments table free-text convention)
-- offices.representing_state = 'OR' uppercase (offices table free-text convention)
-- WRONG: state='OR' in districts = silent 0 rows in routing queries
```

### Idempotency Guard Pair
**Source:** Migration 244 + 1055
**Apply to:** Every INSERT in migration 1118
- Politicians: `ON CONFLICT (external_id) DO NOTHING`
- Offices: `WHERE NOT EXISTS (SELECT 1 FROM essentials.offices WHERE district_id=d.id AND politician_id=p.id)`
- Governments: `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name=...)`
- Chambers: `WHERE NOT EXISTS (SELECT 1 FROM essentials.chambers WHERE name=... AND government_id=...)`
- Districts: `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id=... AND district_type=... AND state=...)`

### Slug Exclusion
**Source:** Migration 244 line 14; migration 1055 line 25
**Apply to:** `essentials.chambers` INSERT in migration 1118
```sql
-- NEVER include 'slug' in chambers INSERT column list — it is GENERATED ALWAYS
```

### Section-Split Gate
**Source:** Migration 244 lines 296–310; migration 1055 lines 375–388
**Apply to:** Post-verification DO block in migration 1118
```sql
-- Must check both the COUNTY geofence (geo_id=41067, mtfcc=G4020)
-- AND the 4 LOCAL X0018 geofences (geo_ids washco-or-commissioner-district-1..4)
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '41067' AND gb.mtfcc = 'G4020'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id AND d.district_type = 'COUNTY' AND d.state = 'or'
  );
-- expect 0 rows
```

### Verify-Gate Grep Rule
**Source:** `project_phase159_complete` memory
**Apply to:** All migration files, including comments
Keep `slug`, `schema_migrations`, and `photo_origin_url` OUT of all comment text — grep-based verify gates scan whole files including comments.

---

## No Analog Found

None — all files have strong analogs in the codebase.

---

## Metadata

**Analog search scope:** `C:/EV-Accounts/backend/migrations/`, `C:/EV-Accounts/backend/scripts/`, `src/lib/coverage.js`
**Files read:** 7 (244, 245, 1055, 1057, load-henderson-ward-boundaries.ts, coverage.js, CONTEXT.md + RESEARCH.md)
**Pattern extraction date:** 2026-06-30

---

## PATTERN MAPPING COMPLETE

**Phase:** 175 - Washington County Commission Deep-Seed
**Files classified:** 9 (7 new + 2 shared context reads)
**Analogs found:** 9 / 9

### Coverage
- Files with exact analog: 9
- Files with role-match analog: 0
- Files with no analog: 0

### Key Patterns Identified
- Structural migration follows migration 244 (OR same-state) with guard patterns from migration 1055 (v18.0 template); the novel split is Chair→COUNTY district / commissioners→LOCAL X0018 districts
- Loader script is a direct clone of load-henderson-ward-boundaries.ts with config constants swapped + rings-conversion removed (WashCo FeatureServer returns native GeoJSON via `f=geojson`)
- All OR district rows use `state='or'` lowercase (routing join key); all governments/offices use `'OR'` uppercase (display convention)
- Headshot migration copies exactly migration 245 shape: `(id, politician_id, url, type, photo_license)` — no `photo_origin_url`
- Stance migrations copy exactly migration 1057 shape: CTE `s` → JOIN `compass_topics` → dual INSERT to `inform.politician_answers` + `inform.politician_context`; conflict key `(politician_id, topic_id)` with DO UPDATE
- coverage.js entry uses label `'Washington County, OR'` to avoid collision with existing UT entry at line 238

### Files Created
`C:\Transparent Motivations\essentials\.planning\phases\175-washington-county-commission-deep-seed\175-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. Planner can reference analog patterns above in PLAN.md files.
