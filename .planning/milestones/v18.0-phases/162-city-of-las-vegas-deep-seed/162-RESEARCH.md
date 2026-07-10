# Phase 162: City of Las Vegas Deep-Seed - Research

**Researched:** 2026-06-27
**Domain:** NV city government seed + custom ward geofence ingestion + headshots + stance research
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Ward geofences (primary path)**
Build the project's first custom non-TIGER city-ward geofences — 6 Las Vegas ward boundary
polygons — so an LV address returns its one correct ward council member. The at-large Mayor
attaches to the whole-city G4110 geofence (geo_id `3240000`); each of the 6 council members
attaches to its ward polygon.

**D-01b (fallback)**
If Wave-0 cannot source clean, reliable ward-boundary polygons, fall back to the single-CITY-district
model: attach all 6 council members to the one LV city geofence, show all 6 (each labeled
"Council Member, Ward N"), and document ward-precise routing as deferred. Phase still completes.

**D-02: Mayor modeling**
Model the Mayor (currently Shelley Berkley, directly elected at-large, in office since Jan 2025)
as a distinct directly-elected at-large seat within the City Council chamber — "Mayor" title,
attached to the city-wide geofence, sorted first. NOT rotational. Chamber = Mayor + 6 ward members
(7 seats total; `official_count` = 7 on the chamber).

**D-03: Standalone government**
Create a standalone government "City of Las Vegas, Nevada, US" (mirrors "Clark County, Nevada, US"
from Phase 161), NOT nested under State of Nevada.

**D-03b: external_id block**
Exact range chosen by Wave-0 collision probe; must not collide with existing NV ranges.

**D-04: Stances**
All live compass topics per official, one agent at a time, evidence-only, 100% cited, honest blanks,
zero defaults. Target ~18-21 stance depth.

**D-05: Headshots**
`lasvegasnevada.gov` council pages first; then established workarounds; then free alternates.
600x750, crop-4:5 then resize, no text/graphic overlays. Mirrored to Storage.

### Claude's Discretion

- Exact LV ward-polygon data source + ingestion mechanism (Wave-0 research)
- Exact external_id range for the 7 seats (Wave-0 probe + pick unused block)
- Migration split (structural vs. audit-only headshot vs. per-official stance migrations)
- Council chamber name ("Las Vegas City Council")
- Whether ward seats carry a free-text "Council Member, Ward N" title for display clarity

### Deferred Ideas (OUT OF SCOPE)

- Single-city fallback as a permanent state (only if Ward-0 polygon sourcing fails)
- Non-elected city offices (City Attorney, Municipal Court judges, City Manager)
- Reusing LV ward polygons for Henderson / North Las Vegas (note for Phases 163-164)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLARK-02 | City of Las Vegas deep-seeded (Mayor + City Council) — government + roster + headshots + evidence-only stances | All four success criteria addressed: (1) ward-precise routing via D-01 geofences, (2) 7 headshots verified 200 OK, (3) stance research via inform schema one-at-a-time pattern, (4) coverage.js COVERAGE_STATES NV entry |
</phase_requirements>

---

## Summary

Phase 162 deep-seeds the City of Las Vegas — 1 standalone government, 1 chamber ("Las Vegas City
Council"), 7 officials (Mayor at-large + 6 ward-elected council members), 7 headshots, and evidence-
only compass stances for all 7. This phase is the project's first **custom non-TIGER ward geofence**
phase.

The highest-value research question — can ward polygon data be sourced cleanly? — is answered
definitively: **YES.** The City of Las Vegas GIS MapServer at
`mapdata.lasvegasnevada.gov/clvgis/rest/services/AdministrativeBoundaries/CityCouncilWards/MapServer/0`
returns all 6 ward polygons in WGS84 (`outSR=4326`) via a standard ArcGIS query. 348KB of geometry
confirmed live. The ingestion approach follows the existing `load-dc-ward-boundaries.ts` pattern
(city-owned MapServer → ST_Multi → geofence_boundaries, mtfcc=`X0015`). D-01b fallback is not needed.

The headshot situation is exceptionally clean: all 7 photos serve directly from Azure Blob Storage
(`sawebfilesprod001.blob.core.windows.net`) with no WAF, no cookies, and no special UA. All 7 URLs
verified HTTP 200. Most images are already 600px wide and require only aspect-ratio cropping to
600x750 (no upscaling needed for Mayor, Ward 2, Ward 4, Ward 5; Ward 3/6 may need slight upscale).

The migration ledger MAX after Phase 161 is **1055** (structural). Next structural migration = **1064**
(memory indicates v18.0 parked at ~1064; the Wave-0 probe must confirm against the live DB). Stance
migrations are audit-only and do not register. External_id block for the 7 seats: **`-3205001` through
`-3205007`** is proposed (see collision analysis below; Wave-0 probe must confirm no existing rows).

**Primary recommendation:** Execute D-01 (ward geofences) using the LV MapServer source. Write a new
`load-lv-ward-boundaries.ts` script (analog to `load-dc-ward-boundaries.ts`) to fetch and insert 6
ward polygons with `mtfcc='X0015'`, `state='nv'`, `geo_id='las-vegas-nv-council-ward-N'`. Then seed
the standalone government, chamber, 7 offices (Mayor on `G4110` citywide district, 6 council members
each on their per-ward `X0015` district), headshots, and stances.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ward-precise council routing | Database / Storage (geofence_boundaries) | API / Backend (ST_Covers PIP) | PostGIS ST_Covers resolves point-in-polygon; ward polygons stored as geofence_boundaries rows |
| Mayor at-large routing | Database / Storage (existing G4110 district) | — | Mayor attaches to the city-wide G4110 district already loaded by Phase 158 |
| Government/chamber/office seed | Database / Storage (migrations) | — | SQL migrations write to essentials.* tables |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage) | _tmp-*.py crops, resizes, uploads; Storage serves via CDN |
| Stance research | API / Backend (inform schema) | — | inform.politician_answers + inform.politician_context, applied via SQL |
| City surfacing (purple chip) | Frontend (coverage.js) | — | COVERAGE_STATES NV block addition |

---

## Standard Stack

Phase 162 uses no new npm/PyPI packages. All tooling is reused from Phases 159-161.

### Core (reused from prior NV phases)

| Tool / Pattern | Version | Purpose | Basis |
|----------------|---------|---------|-------|
| psql -f (migration apply) | any | Apply structural + audit-only SQL migrations | Phase 160/161 executor split pattern |
| psycopg2 (Python headshot script) | 2.x | DB UUID resolution from external_id | `_tmp-va-delegates-headshots.py` exact analog |
| Pillow/PIL (Python) | any installed | crop-4:5 → resize 600x750 Lanczos q90 | Phase 161 headshot pipeline |
| requests (Python) | any installed | HTTP fetch of headshot images | Phase 161 headshot pipeline |
| Node.js / tsx | v18+ | Ward boundary loader script | `load-dc-ward-boundaries.ts` analog |
| pg (Node.js) | any installed | DB pool for ward boundary loader | Same as `load-dc-ward-boundaries.ts` |
| PostGIS ST_Multi / ST_SetSRID / ST_GeomFromGeoJSON | DB-side | Geometry ingestion from GeoJSON rings | `import-greene-county-geofence.ts` analog |

### New file: `load-lv-ward-boundaries.ts`

This script is new for Phase 162 (project's first NV ward boundary loader), analogous to
`load-dc-ward-boundaries.ts`. Key differences from the MA ward loader:
- LV's MapServer returns pre-dissolved ward polygons directly (no precinct aggregation needed)
- Source: LV MapServer (not MassGIS) — `mapdata.lasvegasnevada.gov/...` via `outSR=4326&f=json`
- Uses `mtfcc='X0015'` (next unused custom MTFCC after X0014=MA wards)
- 6 ward polygons, geo_id pattern: `las-vegas-nv-council-ward-{N}`
- State code: `'nv'` (lowercase — TIGER loader convention for LOCAL tier)
- No dissolution needed (LV MapServer returns one polygon per ward, possibly MultiPolygon for
  wards with non-contiguous parcels — confirm ring_count at run time)

### Installation

No new packages required. All Node.js and Python dependencies are pre-installed.

---

## Package Legitimacy Audit

No new external packages required for Phase 162. All dependencies are pre-existing in the project.
Skipping Package Legitimacy Gate (no new installs).

---

## Architecture Patterns

### System Architecture Diagram

```
LV MapServer (mapdata.lasvegasnevada.gov)
    │ 6 ward polygon features, WGS84, ~348KB
    ▼
load-lv-ward-boundaries.ts (Wave 0)
    │ INSERT 6 rows: geo_id=las-vegas-nv-council-ward-N, mtfcc=X0015, state=nv
    ▼
essentials.geofence_boundaries [ward polygons]
    │
    ├──► migration 1064 (structural)
    │       INSERT governments "City of Las Vegas, Nevada, US"
    │       INSERT chambers "Las Vegas City Council"
    │       INSERT districts: 1 LOCAL_EXEC geo_id=3240000 (Mayor)
    │                          6 LOCAL geo_id=las-vegas-nv-council-ward-N mtfcc=X0015
    │       INSERT 7 politicians + offices + back-fill
    │
    ├──► load-lv-headshots.py (Wave 1)
    │       Azure Blob → crop-4:5 → 600x750 → Storage PUT
    │       produces: 7 CDN URLs
    │
    ├──► migration 1065 (audit-only, headshots)
    │       INSERT 7 politician_images rows
    │
    ├──► 7x stance migrations 1066-1072 (audit-only, one per official)
    │       inform.politician_answers + inform.politician_context
    │       (one research agent per official, evidence-only)
    │
    └──► coverage.js edit (COVERAGE_STATES NV block)
            "Las Vegas" entry with browseGeoId=3240000, browseStateAbbrev=NV, hasContext=true

Backend ST_Covers query:
    User coordinate → ST_Covers(gb.geometry, point) →
        G4110 geo_id=3240000 → LOCAL_EXEC district → Mayor
        X0015 geo_id=las-vegas-nv-council-ward-N → LOCAL district → Ward N council member
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── scripts/
│   ├── load-lv-ward-boundaries.ts        # NEW — LV ward polygon loader (analog: load-dc-ward-boundaries.ts)
│   └── _tmp-lv-city-council-headshots.py # NEW (gitignored) — headshot pipeline
└── migrations/
    ├── 1064_las_vegas_city_council.sql   # STRUCTURAL — government+chamber+7 offices
    ├── 1065_las_vegas_city_council_headshots.sql  # AUDIT-ONLY
    ├── 1066_las_vegas_berkley_stances.sql           # AUDIT-ONLY (Mayor)
    ├── 1067_las_vegas_knudsen_stances.sql           # AUDIT-ONLY (Ward 1)
    ├── 1068_las_vegas_kelley_stances.sql            # AUDIT-ONLY (Ward 2)
    ├── 1069_las_vegas_diaz_stances.sql              # AUDIT-ONLY (Ward 3)
    ├── 1070_las_vegas_allenpalenske_stances.sql     # AUDIT-ONLY (Ward 4)
    ├── 1071_las_vegas_summersarmstrong_stances.sql  # AUDIT-ONLY (Ward 5)
    └── 1072_las_vegas_brune_stances.sql             # AUDIT-ONLY (Ward 6)

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                  # EDIT — add NV COVERAGE_STATES block
```

Note: Migration numbers assume ledger MAX = 1063 at Phase 162 start. Wave-0 DB probe is mandatory
to confirm. If MAX differs, renumber accordingly.

### Pattern 1: LV Ward Geofence Loading (load-lv-ward-boundaries.ts)

**What:** Fetches 6 ward polygon features from the City of Las Vegas GIS MapServer and inserts them
into `essentials.geofence_boundaries` as `X0015` rows with WGS84 geometry.

**When to use:** Wave 0 of Phase 162, before the structural migration. Pre-flight in the structural
migration asserts these 6 rows exist before proceeding.

**Source endpoint confirmed live:**
```
https://mapdata.lasvegasnevada.gov/clvgis/rest/services/AdministrativeBoundaries/CityCouncilWards/MapServer/0/query
  ?where=1%3D1&outFields=*&returnGeometry=true&f=json&outSR=4326
```
Returns 6 features (Ward 1-6), geometry type `esriGeometryPolygon`, spatial reference WGS84.
The response is ArcGIS JSON (not GeoJSON) — geometry is in `feature.geometry.rings` format (an
array of coordinate rings, each ring is an array of [lon, lat] pairs).

**ArcGIS JSON geometry → PostGIS:**
Each feature's `geometry.rings` is a standard ArcGIS polygon ring array. Convert to GeoJSON
Polygon format for `ST_GeomFromGeoJSON`:
```typescript
// Source: confirmed via live query — ArcGIS JSON Polygon geometry
const rings = feature.geometry.rings as number[][][];
const geojsonGeom = JSON.stringify({ type: 'Polygon', coordinates: rings });
// Then in SQL: ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
```

**Important:** Some wards have multiple rings (Ward 6 = 22 rings, Ward 5 = 21 rings, Ward 4 = 30
rings). These are non-contiguous parcels/enclaves. The ArcGIS JSON `rings` field represents outer
rings and holes — the direct conversion to GeoJSON Polygon (multiple rings = potential holes) is
correct for PostGIS. If any ward has non-contiguous bodies (not just holes), use `ST_Multi` to wrap.

**DB INSERT pattern** (analog: `import-greene-county-geofence.ts` + `load-dc-ward-boundaries.ts`):
```typescript
// Source: import-greene-county-geofence.ts lines 21-27 (exact pattern)
const geom = JSON.stringify({ type: 'Polygon', coordinates: rings });
await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (id, geo_id, mtfcc, state, name, geometry, source)
  VALUES (gen_random_uuid(), $1, 'X0015', 'nv', $2,
          public.ST_Multi(public.ST_SetSRID(public.ST_GeomFromGeoJSON($3), 4326)),
          'lasvegasnevada.gov-gis-citcouncilwards-mapserver')
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
  RETURNING public.ST_GeometryType(geometry) AS gtype, public.ST_IsValid(geometry) AS valid
`, [geoId, wardName, geom]);
```

**Ward geo_id scheme:**
```
las-vegas-nv-council-ward-1  (Ward 1 — Brian Knudsen, Mayor Pro Tem)
las-vegas-nv-council-ward-2  (Ward 2 — Kara Kelley)
las-vegas-nv-council-ward-3  (Ward 3 — Olivia Diaz)
las-vegas-nv-council-ward-4  (Ward 4 — Francis Allen-Palenske)
las-vegas-nv-council-ward-5  (Ward 5 — Shondra Summers-Armstrong)
las-vegas-nv-council-ward-6  (Ward 6 — Nancy E. Brune)
```

### Pattern 2: Structural Migration 1064 (standalone city government)

**Analog:** `1055_clark_county_commission.sql` (Phase 161 PATTERNS.md §structural migration).

Key adaptations from Phase 161 (county) to Phase 162 (city):

| 161 (county) | 162 (city) |
|-------------|-----------|
| `'Clark County, Nevada, US'` | `'City of Las Vegas, Nevada, US'` |
| `type='County'` | `type='City'` |
| `geo_id='32003'` | `geo_id='3240000'` (G4110 TIGER place) |
| `mtfcc='G4020'` | `mtfcc='G4110'` (for the citywide district) |
| 1 district type: COUNTY | 2 district types: LOCAL_EXEC (Mayor, G4110) + LOCAL (ward members, X0015) |
| 7 offices on single COUNTY district | 1 Mayor on LOCAL_EXEC + 6 ward members each on LOCAL X0015 district |
| `d.state='nv'` lowercase | Same |

**Step 3a — LOCAL_EXEC district for Mayor (city-wide G4110):**
```sql
-- Mayor attaches to the EXISTING G4110 city geofence (loaded Phase 158, geo_id='3240000')
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3240000', 'City of Las Vegas', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3240000' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);
```

**Step 3b — LOCAL districts for each ward (X0015):**
```sql
-- 6 ward district rows, one per ward (pre-flight asserts these geofences exist)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'las-vegas-nv-council-ward-1', 'Ward 1', 'X0015'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'las-vegas-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv'
);
-- Repeat for wards 2-6
```

**Step 4 — Politician + Office CTEs:**

Mayor (Shelley Berkley) attaches to the LOCAL_EXEC district (geo_id='3240000'). Title = 'Mayor'.
Sorted first via groupHierarchy.js (LOCAL_EXEC sorts before LOCAL).

6 council members each attach to their ward's LOCAL district (geo_id='las-vegas-nv-council-ward-N').
Title = 'Council Member, Ward N' (display clarity; recommended per D-01).

NOT EXISTS guard for offices uses `(district_id, politician_id)` (person-scoped, as in Phase 161).

**Step 5 — office_id back-fill:**
```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -3205007 AND -3205001
  AND p.office_id IS NULL;
```

### Pattern 3: Headshot Pipeline

**Analog:** `_tmp-clark-county-commission-headshots.py` (Phase 161 PATTERNS.md §headshot script).

No WAF on `sawebfilesprod001.blob.core.windows.net` — plain `requests.get()` without special UA.
All 7 URLs verified HTTP 200 (confirmed 2026-06-27).

```python
# Source: verified live 2026-06-27 via curl — all 7 return HTTP 200
OFFICIALS = [
  {'ext_id': -3205001, 'name': 'Shelley Berkley',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/council/Mayor/Las_Vegas_Mayor_Shelley_Berkley_app_June-23-2025-600x800.jpg'},
  {'ext_id': -3205002, 'name': 'Brian Knudsen',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Knudsen-Headshot.jpg'},
  {'ext_id': -3205003, 'name': 'Kara Kelley',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Kara_Kelley-Sept-2025-600x800.jpg'},
  {'ext_id': -3205004, 'name': 'Olivia Diaz',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Olivia_Diaz_Portrait-600x400.jpg'},
  {'ext_id': -3205005, 'name': 'Francis Allen-Palenske',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/council/Ward_4_2019/Francis_Allen-Palenske_Dec-2022-600x800.jpg'},
  {'ext_id': -3205006, 'name': 'Shondra Summers-Armstrong',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Shondra_Summers-Armstrong-2024-600x800.jpg'},
  {'ext_id': -3205007, 'name': 'Nancy Brune',
   'url': 'https://sawebfilesprod001.blob.core.windows.net/images/Nancy_Brune%2025%20RGB.jpg'},
]
# Note: URL-encoded space in Nancy Brune's filename — pass directly to requests.get()
# photo_license: 'us_government_work' (city government official portraits, DNN CMS)
```

**Source image dimensions (estimated from URL suffixes):**
- Mayor Berkley: 600x800 (filename suffix) → needs top-crop to 600x750 (keep head, crop bottom)
- Knudsen: unknown resolution (no suffix) → check at runtime, crop as needed
- Kara Kelley: 600x800 → same as Mayor
- Olivia Diaz: 600x400 → LANDSCAPE — needs different handling: crop to 320x400 (4:5) centered, then resize to 600x750 (~1.875x upscale)
- Allen-Palenske: 600x800 → top-crop to 600x750
- Summers-Armstrong: 600x800 → top-crop to 600x750
- Nancy Brune: unknown (RGB in filename) → check at runtime

Special note for Diaz (600x400 landscape): The `crop_to_4_5()` function handles this correctly —
it detects `current_ratio > target_ratio` (600/400 = 1.5 > 0.8), crops width to `int(400 * 0.8) = 320`,
centering horizontally → 320x400, then resizes to 600x750. The upscale (~1.875x) is within project
precedent (Pasadena 150x200 approved 2026-06-20).

### Pattern 4: Stance Migration CTE (one per official)

**Analog:** `1057_clark_county_commission_naft_stances.sql` (Phase 161 PATTERNS.md §stance migration).

Same shape for all 7 officials. Topic_id resolved LIVE via `JOIN inform.compass_topics ct ON
ct.topic_key = s.topic_key AND ct.is_live = true` — never hardcode topic UUIDs.

Topics likely to have county/city-level evidence for LV officials (based on Phase 161 pattern +
LV policy landscape):
- `homelessness-response` (Las Vegas camping ban, shelter capacity)
- `housing` (affordable housing programs, rent stabilization)
- `local-immigration` (sanctuary/enforcement policy)
- `public-safety-approach` (LVMPD oversight, crime strategy)
- `transportation-priorities` (transit, cycling, highway)
- `economic-development` (casino/resort economy, small business)
- `local-environment` (water conservation, desert climate)
- `cannabis-regulation` (NV has legal cannabis, city zoning)
- `homelessness` (city-level services)

State-level topics may also have evidence for Shelley Berkley (former US House Rep 1999-2013):
- `abortion`, `healthcare`, `same-sex-marriage`, `immigration`, `deportation`, `taxes`,
  `social-security`, `civil-rights` — apply pre-tenure attribution rule (only LV City Council
  record, not US House record, unless an official is currently in the city role AND made recent
  public statements that update their position).

### Pattern 5: coverage.js COVERAGE_STATES NV block

**What:** Add a Nevada entry to `COVERAGE_STATES` with Las Vegas as the first city.

**Analog:** California entry at line 7. Nevada block does not yet exist in `coverage.js`.

**Insertion point:** After Utah's last city entry (last `COVERAGE_STATES` state) and before the
closing `];`. Clark County is already in `COVERAGE_COUNTIES` (line 230). The NV state block goes
in `COVERAGE_STATES`.

```javascript
// Source: coverage.js line 7-46 (CA pattern — exact shape)
// Add AFTER the Virginia block (or wherever the last state entry is), before closing ];
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

Note: `browseGovernmentList` uses the G4110 place FIPS geo_id `3240000` (confirmed from Phase 158
smoke test results). Additional NV cities (Henderson, North Las Vegas, Boulder City) will be added
to this NV block in Phases 163-165.

### Anti-Patterns to Avoid

- **Hardcoding `slug` in chamber INSERT** — `chambers.slug` is GENERATED ALWAYS; including it in
  the INSERT column list raises: `cannot insert a non-DEFAULT value into column`. Omit slug entirely.
- **Uppercase `d.state = 'NV'` in LOCAL district WHERE clauses** — the TIGER loader convention for
  city/LOCAL-tier districts is lowercase `'nv'`. Uppercase matches ZERO rows → silent no-op (0
  offices inserted). The #1 silent failure mode from Phases 160/161.
- **Confusing `representing_state` with `d.state`** — `representing_state` on offices is a free-text
  label column (`'NV'` uppercase); `d.state` in WHERE clauses is the routing join key (`'nv'` lowercase).
  Both appear in the same SQL block.
- **Using `photo_origin_url` in politician_images INSERT** — that column was removed. Columns are
  exactly `(id, politician_id, url, type, photo_license)`.
- **Setting Mayor as a rotational / title-on-seat pattern** — D-02 explicitly rejects the rotational
  pattern. Berkley is directly elected. Model as LOCAL_EXEC district with `title='Mayor'`. Do not
  use the title-on-seat pattern from Phase 156 (Bellflower rotational).
- **Defaulting stances to Neutral/blank-but-value when no evidence exists** — evidence-only rule.
  A missing topic row is the correct representation.
- **Writing ward polygons with `state='32'` (FIPS string)** — use `state='nv'` (lowercase state
  abbreviation) to match TIGER loader convention and routing queries.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ward polygon fetching + DB insert | Custom fetch-and-insert from scratch | Copy `load-dc-ward-boundaries.ts` as template | Handles ON CONFLICT, ST_Multi, error logging, dry-run |
| Headshot crop + resize | Manual PIL operations | Copy `_tmp-clark-county-commission-headshots.py` | Correct pipeline: crop FIRST then resize; `optimize=True` strips EXIF |
| Stance CTE shape | New schema inference | Copy `1057_clark_county_commission_naft_stances.sql` CTE shape exactly | Topic_id join via `is_live=true` is critical; ON CONFLICT idempotency required |
| Government INSERT guard | Unique constraint assumption | `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name=...)` | `essentials.governments` has NO unique constraint on geo_id or name |
| district_type routing | Assuming G4110 alone routes ward members | Explicit LOCAL district per ward with matching geo_id | Backend joins `geofence_boundaries.geo_id = districts.geo_id`; ward members need per-ward LOCAL districts |

**Key insight:** The X0015 ward geofences work because `essentialsService.ts` line 646:
`OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))`
catches any X-prefixed MTFCC not in the exclusion list and routes it to LOCAL/COUNTY. X0015 is not
in the exclusion list and will be caught by this clause automatically — no backend code change needed.

---

## Key Verified Facts

### City of Las Vegas Government Structure
[VERIFIED: lasvegasnevada.gov/Government/Mayor-City-Council]

**Form of government:** Mayor + 6 ward-elected council members. Mayor is directly elected at-large
(not rotational). 7 total seats on the City Council. 4-year staggered terms.

**Current roster (as of 2026-06-27):**

| Seat | Name | Title | Notes |
|------|------|-------|-------|
| At-large | Shelley Berkley | Mayor | Directly elected; in office since Jan 2025 (won Nov 2024 election) |
| Ward 1 | Brian Knudsen | Council Member (Mayor Pro Tem) | Ward 1 = downtown / medical district |
| Ward 2 | Kara Kelley | Council Member | Appointed Sept 30, 2025 to fill Seaman vacancy (Seaman joined Trump admin) |
| Ward 3 | Olivia Diaz | Council Member | First Latina on LV City Council (elected June 2019) |
| Ward 4 | Francis Allen-Palenske | Council Member | Elected Nov 2022 |
| Ward 5 | Shondra Summers-Armstrong | Council Member | |
| Ward 6 | Nancy E. Brune | Council Member | |

### City geo_id (TIGER G4110 Place)
[VERIFIED: Phase 158 smoke test, 158-02-SUMMARY.md]

**geo_id = `3240000`** (TIGER Place FIPS for City of Las Vegas, NV)

Confirmed: Phase 158 smoke test SC2 returned `Las Vegas city | 3240000 | 32003 | CD4 | SD2 | AD11`

### District Casing Convention for NV City Tier
[VERIFIED: Phase 158 Gate 5 + Phase 160 PATTERNS.md]

- `districts.state = 'nv'` LOWERCASE for COUNTY / STATE_UPPER / STATE_LOWER / LOCAL / LOCAL_EXEC tiers
- `governments.state = 'NV'` UPPERCASE
- `offices.representing_state = 'NV'` UPPERCASE (free-text label, not a join key)

### Migration Ledger MAX After Phase 161
[VERIFIED: 161-03-SUMMARY.md check 8/9]

Ledger MAX after Phase 161 = **1055** (only 1055 is registered; 1056-1063 are audit-only).
Memory `project_v180_milestone` states v18.0 parked at next migration ~1064.
**Wave-0 probe required** to confirm live DB MAX before authoring migrations. Proposed schema:
- 1064: structural (government + chamber + 7 offices + ward districts)
- 1065: audit-only headshots
- 1066-1072: audit-only stances (one per official)

### External_id Collision Analysis
[VERIFIED: Ranges confirmed from 161-PATTERNS.md Key Identifiers + 160-PATTERNS.md + migration grep]

**In use (must not collide):**
- US House: `-32001` .. `-32004`
- STATE_EXEC: `-3200001` .. `-3200006`
- Senate: `-3203001` .. `-3203021`
- Assembly: `-3204001` .. `-3204042`
- Clark County commissioners: `-3200301` .. `-3200307`
- US Senators: `-400057`, `-400058`

**Proposed block for LV City Council (7 seats):** `-3205001` .. `-3205007`

Range `-3205001` through `-3205007` falls between the COUNTY commission range (ends at -3200307)
and the Senate range (starts at -3203001). It does not collide with any known NV external_ids.
The Wave-0 probe must verify: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3205007 AND -3205001` = 0.

**Suggested assignment:**
- `-3205001`: Shelley Berkley (Mayor)
- `-3205002`: Brian Knudsen (Ward 1)
- `-3205003`: Kara Kelley (Ward 2)
- `-3205004`: Olivia Diaz (Ward 3)
- `-3205005`: Francis Allen-Palenske (Ward 4)
- `-3205006`: Shondra Summers-Armstrong (Ward 5)
- `-3205007`: Nancy Brune (Ward 6)

### Ward Geofence Source
[VERIFIED: Live curl test 2026-06-27 — 348KB response, 6 features, WGS84 coordinates]

**Source:** City of Las Vegas GIS MapServer (city-owned, no authentication required)
**Endpoint:** `https://mapdata.lasvegasnevada.gov/clvgis/rest/services/AdministrativeBoundaries/CityCouncilWards/MapServer/0/query`
**Query params:** `where=1%3D1&outFields=*&returnGeometry=true&f=json&outSR=4326`
**Format:** ArcGIS JSON (rings array), not GeoJSON — convert to GeoJSON Polygon for ST_GeomFromGeoJSON

**All 6 ward features confirmed:**
| Ward | Ring count | Point count (outer ring) | Approx sq mi |
|------|-----------|--------------------------|--------------|
| 1 | 4 | 617 | 17.50 |
| 2 | 1 | 986 | 29.63 |
| 3 | 2 | 630 | 12.87 |
| 4 | 30 | 1135 | 25.52 |
| 5 | 21 | 714 | 15.32 |
| 6 | 22 | 547 | 41.19 |

Wards 4, 5, 6 have many rings (likely non-contiguous enclaved parcels + holes). ST_Multi wrapping
is correct. Ward 2 has only 1 ring (simple polygon). All coordinates confirm ~-115° lon, 36° lat
(Las Vegas, NV).

**License:** City of Las Vegas GIS — US government work (city government data, comparable to
clarkcountynv.gov AEM source used in Phase 161). [ASSUMED: no explicit license statement confirmed
from the MapServer metadata page, but consistent with US government open data convention]

### Headshot Source
[VERIFIED: All 7 URLs returned HTTP 200 — tested 2026-06-27]

**Source:** Azure Blob Storage (`sawebfilesprod001.blob.core.windows.net`) — served from the City
of Las Vegas DNN CMS. No WAF, no cookies, no special User-Agent required. Plain `requests.get()`.
No Revize, no Cloudflare, no AEM — this is the simplest headshot situation in the NV milestone.

**photo_license:** `'us_government_work'` (city government official portraits, same as Phase 161)

### Custom MTFCC Registry
[VERIFIED: Grep of all migrations in C:/EV-Accounts/backend/migrations/]

| MTFCC | Claimed by | Use |
|-------|-----------|-----|
| X0001 | Various (SLC council, etc.) | Council districts |
| X0002 | Various | School sub-districts |
| X0003 | Various | State board |
| X0004 | Built-in (tribal) | Tribal land |
| X0013 | Boston MA (migration 347) | Boston council districts (9) |
| X0014 | MA cities (migrations 711, 712) | MA ward boundaries (Medford, New Bedford, etc.) |
| **X0015** | **Phase 162 (proposed)** | **Las Vegas NV ward boundaries (6 wards)** |

X0005-X0012 are used in planning docs (cited in `.planning/STATE.md`) but NOT in any actual
migration file — available. X0015 is the next logical choice to keep X0013/X0014/X0015 contiguous
for NV-specific ward geofences. [ASSUMED: planner should confirm X0015 has no geofence_boundaries
rows via Wave-0 DB probe]

### Compass Topic IDs (Live)
[VERIFIED: `project_compass_live_topic_ids.md` memory — confirmed 2026-04-14]

Use `topic_key` (not hardcoded UUIDs) for stance insertions. The stance CTE joins on
`JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true`.

**Do NOT use these retired topic UUIDs:** `a9f53bc4`, `45ca4740`, `f2a62698`, `83eeb217`,
`be60844f`, `c6957429` — these are `is_live=false` but still exist in the DB.

---

## Common Pitfalls

### Pitfall 1: Ward Polygon Multi-Ring Handling
**What goes wrong:** ArcGIS JSON polygons with multiple rings include both outer boundaries and
inner holes. Directly passing the entire `rings` array as a GeoJSON `Polygon.coordinates` is
usually correct, but for wards with many rings (Ward 4=30, Ward 5=21, Ward 6=22), some rings
may represent disconnected outer boundaries rather than holes.
**Why it happens:** Las Vegas ward boundaries include non-contiguous annexed parcels and enclaves.
**How to avoid:** Wrap with `ST_Multi()` so PostGIS handles multi-polygon cases. After insert,
`ST_IsValid(geometry)` must return `true` in the RETURNING clause. If invalid, apply `ST_MakeValid`.
**Warning signs:** `ST_IsValid = false` in the insert RETURNING, or geometry type = GEOMETRYCOLLECTION.

### Pitfall 2: Two District Types in One Migration (LOCAL_EXEC + LOCAL)
**What goes wrong:** Prior city phases had one district type per migration (county = COUNTY, city =
G4110 LOCAL). Phase 162 has two: `LOCAL_EXEC` for the Mayor (G4110 citywide) and `LOCAL` for each
ward (X0015 ward polygons). Mixing them in the office INSERT WHERE clause — especially if a typo
swaps LOCAL for LOCAL_EXEC or vice versa — causes the wrong officials to surface in wrong sections.
**Why it happens:** Mayor and council members are in the same chamber but different district types.
**How to avoid:** Use explicit `district_type` in every WHERE clause. Post-verify with 9-check gates
that assert exactly 1 LOCAL_EXEC office (Mayor) and exactly 6 LOCAL offices (ward members).
**Warning signs:** More than 7 offices total, or Mayor appearing in MULTIPLE places via two districts.

### Pitfall 3: Lowercase `state='nv'` in District WHERE Clauses
**What goes wrong:** Using `state='NV'` (uppercase) in district join clauses returns 0 rows →
0 office INSERTs → migration "succeeds" silently with no data written.
**Why it happens:** TIGER loader writes lowercase `state` for city/county/legislature tiers.
**How to avoid:** All district WHERE clauses and X0015 INSERT statements use `state='nv'` lowercase.
`governments.state = 'NV'` uppercase. `offices.representing_state = 'NV'` uppercase.
**Warning signs:** Post-verify count = 0 offices linked to LOCAL or LOCAL_EXEC districts.

### Pitfall 4: Mayor Modeled as Rotational Rather Than Directly Elected
**What goes wrong:** Applying the Phase 156 (Bellflower) or Phase 155 (Norwalk) rotational mayor
pattern — title-on-seat, `title='Mayor Pro Tem'` on one of the council members. Las Vegas has a
directly-elected Mayor (Berkley won a separate at-large race; she does NOT rotate annually).
**Why it happens:** Many NV cities have rotational mayors; research might conflate them.
**How to avoid:** D-02 explicitly says NOT rotational. Model like Phase 153 (Inglewood
directly-elected Mayor kept). Mayor has her own LOCAL_EXEC district; ward members are LOCAL.
**Warning signs:** Berkley's `district_type = 'LOCAL'` instead of `'LOCAL_EXEC'`; no LOCAL_EXEC
district for geo_id='3240000'.

### Pitfall 5: Ward 2 Kara Kelley — Appointed, Not Elected
**What goes wrong:** Setting `is_appointed=false` for Kelley when she was appointed Sept 2025.
**Why it happens:** Her official council page shows her normally; appointment was mid-term.
**How to avoid:** `is_appointed=true, is_incumbent=true, is_active=true` for Kelley. She is a
legitimate incumbent serving in the seat — the `is_appointed=true` flag just notes the origin.
**Warning signs:** No practical display difference, but record hygiene matters for data accuracy.

### Pitfall 6: Nancy Brune URL-Encoded Filename
**What goes wrong:** The headshot URL for Nancy Brune contains a literal space in the filename
(`Nancy_Brune%2025%20RGB.jpg` — `%2025` decodes to ` 25`, `%20` to space). `requests.get()` with
URL-encoded chars works fine; Python's `requests` library handles `%20` encoding transparently.
**Why it happens:** Filename contains spaces (`Nancy_Brune 25 RGB.jpg` with spaces).
**How to avoid:** Pass the URL exactly as shown — `requests.get(url)` handles this correctly.
Test with a HEAD request first if uncertain: `curl -I "https://sawebfilesprod001.blob.core.windows.net/images/Nancy_Brune%2025%20RGB.jpg"` returned 200 OK.

### Pitfall 7: Grep-Gate on Forbidden Tokens in Comments
**What goes wrong:** Automated plan-verify gates flag migration `.sql` files that contain the
literal strings `slug`, `photo_origin_url`, or `schema_migrations` in comments.
**Why it happens:** Phase 159 identified this; the grep-gate counts ALL occurrences including comments.
**How to avoid:** Paraphrase in comments: "the auto-generated path column" (not `slug`), "the removed
column" (not `photo_origin_url`), "ledger registration" (not `schema_migrations` except in the actual
SQL INSERT).

---

## Code Examples

### Load LV Ward Boundaries (new `load-lv-ward-boundaries.ts`)

```typescript
// Source: load-dc-ward-boundaries.ts (exact structural analog)
// CRITICAL: outSR=4326 required — LV MapServer default is WKID 3421 (state plane)
const LV_WARD_URL =
  'https://mapdata.lasvegasnevada.gov/clvgis/rest/services/' +
  'AdministrativeBoundaries/CityCouncilWards/MapServer/0/query' +
  '?where=1%3D1&outFields=CLV_WARDS.WARD&returnGeometry=true&f=json&outSR=4326';

const MTFCC          = 'X0015';
const STATE_CODE     = 'nv';   // CRITICAL: lowercase for LOCAL tier
const EXPECTED_COUNT = 6;
const SOURCE         = 'lasvegasnevada.gov-gis-citcouncilwards-mapserver-2026';
const GEO_ID_PREFIX  = 'las-vegas-nv-council-ward-';

// ArcGIS JSON ring → GeoJSON conversion
// feature.geometry.rings is number[][][] (array of rings, each ring is [lon,lat][])
function arcgisRingsToGeoJson(rings: number[][][]): object {
  return { type: 'Polygon', coordinates: rings };
}
// Then: ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($1), 4326))
// Note: For non-contiguous ward bodies (multiple outer rings), PostGIS treats
// GeoJSON Polygon with multiple rings as outer+holes; if any ring is actually
// a separate non-contiguous body, ST_MakeValid may convert to MultiPolygon automatically.
```

### Structural Migration Step 3 — District INSERTs

```sql
-- Source: 1055_clark_county_commission.sql lines 72-77 (Phase 161 PATTERNS.md), NV-adapted

-- LOCAL_EXEC district for the directly-elected Mayor (uses existing G4110 city geofence)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3240000', 'City of Las Vegas', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3240000' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);

-- LOCAL district for Ward 1 (uses X0015 ward geofence loaded by the boundary script)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'las-vegas-nv-council-ward-1', 'Ward 1', 'X0015'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'las-vegas-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv'
);
-- Repeat for wards 2-6 with geo_id = 'las-vegas-nv-council-ward-N'
```

### Politician + Office CTE — Mayor

```sql
-- Source: 1055_clark_county_commission.sql Block 1 (Phase 161 PATTERNS.md), adapted for LOCAL_EXEC

WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Shelley Berkley', 'Shelley', 'Berkley', 'Democratic',
          true, false, false, true, -3205001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Las Vegas City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Las Vegas, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3240000'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Politician + Office CTE — Ward Member Example (Ward 1)

```sql
-- Source: 1055_clark_county_commission.sql Block 2-7 (Phase 161 PATTERNS.md), adapted for X0015 LOCAL

WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Brian Knudsen', 'Brian', 'Knudsen', 'Republican',
          true, false, false, true, -3205002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Las Vegas City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Las Vegas, Nevada, US')),
       p.id,
       'Council Member, Ward 1', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'las-vegas-nv-council-ward-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat BLOCK 3-7 for wards 2-6 (Kelley/Diaz/Allen-Palenske/Summers-Armstrong/Brune)
-- ext_ids -3205003..-3205007, geo_ids 'las-vegas-nv-council-ward-2'..'las-vegas-nv-council-ward-6'
```

### Stance Migration CTE (one per official)

```sql
-- Source: 1057_clark_county_commission_naft_stances.sql (Phase 161 PATTERNS.md §stance migration)
-- File: 1066_las_vegas_berkley_stances.sql (Mayor Shelley Berkley)
-- AUDIT-ONLY — NOT registered in schema_migrations. Ledger stays 1064. Idempotent.

BEGIN;
WITH s(topic_key, val, reasoning, sources) AS (
  VALUES
  ('homelessness-response', <1-5>, '<evidence-based reasoning>', ARRAY['<url>']),
  ('<topic_key>', <val>, '<reasoning>', ARRAY['<url>']),
  -- ... evidence-only, 100% cited ...
),
t AS (
  SELECT s.*, ct.id AS topic_id
  FROM s JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true
),
ins_ans AS (
  INSERT INTO inform.politician_answers (politician_id, topic_id, value)
  SELECT '<berkley-uuid>', topic_id, val FROM t
  ON CONFLICT (politician_id, topic_id) DO UPDATE SET value = EXCLUDED.value
  RETURNING 1
)
INSERT INTO inform.politician_context (politician_id, topic_id, reasoning, sources)
SELECT '<berkley-uuid>', topic_id, reasoning, sources FROM t
ON CONFLICT (politician_id, topic_id) DO UPDATE
  SET reasoning = EXCLUDED.reasoning, sources = EXCLUDED.sources;
COMMIT;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-city-district for all ward council members (fallback D-01b) | Per-ward X0015 custom polygon routing (D-01) | Phase 162 introduces this | An LV address returns one specific ward council member, not all 6 |
| No NV city coverage | LV in COVERAGE_STATES NV block | Phase 162 | Las Vegas appears in city browse grid |
| Clark County only for NV | City of Las Vegas added | Phase 162 | LV residents see Mayor + ward rep (not just county commissioners) |

**Pattern established by this phase:**
The `load-lv-ward-boundaries.ts` / `X0015` / `las-vegas-nv-council-ward-N` geo_id pattern can be
reused for Henderson (Phase 163) and North Las Vegas (Phase 164) if those cities have ward-elected
councils and accessible GIS ward polygon data.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ward polygon license is US government work (no explicit license confirmed on MapServer) | Key Verified Facts §Ward Geofence Source | Low: city government GIS data is conventionally public domain; worst case = need different license tag |
| A2 | External_id range `-3205001`..`-3205007` has no existing DB rows | Key Verified Facts §External_id Analysis | High: collision would cause duplicate politician or silent no-op; Wave-0 probe required |
| A3 | Migration ledger MAX = 1063 at Phase 162 start (memory says ~1064 parked) | Architecture Patterns §Project Structure | Medium: if MAX differs, all proposed migration numbers shift; Wave-0 probe required |
| A4 | X0015 has no existing geofence_boundaries rows | Standard Stack §Custom MTFCC Registry | Medium: if X0015 already used, pick next available; Wave-0 probe required |
| A5 | Brian Knudsen's party = Republican (based on search results; not confirmed from official city page) | Code Examples §Ward Member CTE | Low: party stored but never displayed (antipartisan design); incorrect party has no UI impact |
| A6 | Kara Kelley's party affiliation (not confirmed; appears to be Democrat based on context) | Code Examples (not shown) | Low: same reason as A5 |
| A7 | Ward 2 name field confirmed as "Kara Kelley" (appointed Sept 2025 — page confirmed this) | Key Verified Facts §Roster | Very low: page confirmed her name |
| A8 | All ward residents will resolve to the correct single ward council member (no routing gaps) | Architecture Patterns §ST_Covers routing | Medium: if any ward geometry is invalid or has gaps, some addresses won't resolve; validate via smoke test |

**Confirmed facts needing no user validation:** geo_id=3240000, roster names, headshot URLs (200 OK),
ward polygon endpoint, all 6 ward features present, ledger MAX=1055 (Phase 161 complete).

---

## Open Questions

1. **Knudsen party affiliation**
   - What we know: Various sources mention Ward 1 in context of Republican/non-partisan LV races
   - What's unclear: LV City Council races are officially nonpartisan; party stored in DB but not displayed
   - Recommendation: Label nonpartisan council members as `party='Non-Partisan'` or leave NULL; antipartisan design means no display impact

2. **Ward 2 `is_appointed` flag for Kara Kelley**
   - What we know: She was appointed Sept 30, 2025 to fill Seaman vacancy
   - What's unclear: Is her appointment term through Seaman's original term end, or until a special election?
   - Recommendation: Set `is_appointed=true, is_incumbent=true, is_active=true`; no display impact

3. **ArcGIS JSON ring topology for multi-ring wards**
   - What we know: Wards 4/5/6 have 21-30 rings; confirmed from live query
   - What's unclear: Are some rings outer boundaries (non-contiguous parcels) vs. inner holes?
   - Recommendation: Use `ST_Multi(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)))` pattern
     to handle both cases; assert `ST_IsValid=true` in RETURNING clause

4. **Coverage.js NV block location**
   - What we know: Coverage.js currently has no Nevada entry in COVERAGE_STATES
   - What's unclear: Which alphabetical position in COVERAGE_STATES (between ME and OR? between NV and NY?)
   - Recommendation: Insert alphabetically after Maine, before Oregon; confirm line number via Wave-0 grep

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| LV GIS MapServer | Ward polygon loader | ✓ (verified 2026-06-27) | ArcGIS 10.8 | D-01b single-city fallback |
| Azure Blob Storage (sawebfilesprod001) | Headshot download | ✓ (all 7 HTTP 200) | — | Wikimedia Commons or Ballotpedia |
| psql CLI | Migration apply | ✓ (confirmed all prior NV phases) | PostgreSQL client | — |
| Python + Pillow + psycopg2 + requests | Headshot pipeline | ✓ (used in Phase 161) | — | — |
| Node.js + tsx + pg | Ward boundary loader | ✓ (used in Phase 158-161 scripts) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:**
- LV MapServer becomes unavailable → use D-01b (all 6 council members on city G4110 geofence)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript smoke tests via `npx tsx` |
| Config file | None (ad-hoc scripts) |
| Quick run command | `npx tsx scripts/smoke-nv-geofences.ts` (existing; may need LV ward extension) |
| Full suite command | Inline 9-check SQL verification in Plan 3 |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLARK-02 SC#1 | LV address returns Mayor + correct ward council member | smoke / integration | Post-apply address probe via npx tsx | ❌ Wave 0: add to smoke-nv-geofences.ts or write ad-hoc |
| CLARK-02 SC#2 | 7 officials have 600x750 headshots | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3205007 AND -3205001` = 7 | ❌ Wave 0 inline |
| CLARK-02 SC#3 | Evidence-only stances render | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3205007 AND -3205001` ≥ 1; 0 null values | ❌ Wave 0 inline |
| CLARK-02 SC#4 | Las Vegas in COVERAGE_STATES with hasContext:true | manual | Inspect coverage.js + browser visit | ❌ Wave 0 manual |

### Sampling Rate

- Per-wave commit: existing `smoke-nv-geofences.ts` + inline SQL counts
- Phase gate: 9-check E2E (analog to Phase 161 Plan 03)

### Wave 0 Gaps

- [ ] `scripts/load-lv-ward-boundaries.ts` — loads 6 X0015 ward polygons (new file)
- [ ] Wave-0 DB probes in Plan 1: ledger MAX, external_id collision, X0015 existence, G4110 district casing

---

## Security Domain

> Checked. This phase performs no authentication, no public API endpoints, no user-facing input
> validation, no cryptography, and no secrets beyond the existing DATABASE_URL in the backend .env.
> All operations are operator-initiated SQL migrations and scripts. No ASVS categories applicable.

---

## Sources

### Primary (HIGH confidence)

- Phase 158-02-SUMMARY.md — LV geo_id=3240000, casing convention, smoke test results
- Phase 161-PATTERNS.md — full structural migration template, headshot pipeline, stance CTE
- Phase 161-01-SUMMARY.md, 161-03-SUMMARY.md — ledger MAX=1055, UUID map for Clark County
- `lasvegasnevada.gov/Government/Mayor-City-Council` and ward sub-pages — roster, headshot URLs
- `mapdata.lasvegasnevada.gov/...CityCouncilWards/MapServer/0/query?...outSR=4326` — live GeoJSON data (348KB, 6 features, WGS84)
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` lines 631-666 — routing logic confirming X-MTFCC catchall
- `C:/EV-Accounts/backend/migrations/711_medford_council_ward_geofencing.sql` — ward district insert pattern (X0014)
- `C:/EV-Accounts/backend/scripts/load-dc-ward-boundaries.ts` — city MapServer → geofence_boundaries pattern
- `C:/EV-Accounts/backend/scripts/load-ma-ward-boundaries.ts` — ward boundary loader pattern + X0014 MTFCC
- `C:/EV-Accounts/backend/scripts/import-greene-county-geofence.ts` — geofence_boundaries INSERT with ST_Multi

### Secondary (MEDIUM confidence)

- WebFetch of lasvegasnevada.gov ward pages — headshot Azure blob URLs confirmed HTTP 200 via curl
- WebSearch "Las Vegas City Council members 2025 2026" — roster initially discovered, confirmed against official site
- Coverage.js lines 215-231 — Clark County already in COVERAGE_COUNTIES; NV COVERAGE_STATES block absent

### Tertiary (LOW confidence)

- Brian Knudsen party affiliation inferred from context [ASSUMED - A5]
- Ward 4-6 ring topology interpretation (outer vs. inner rings for multi-ring wards) [ASSUMED - needs runtime validation]

---

## Metadata

**Confidence breakdown:**
- Roster: HIGH — confirmed from official lasvegasnevada.gov council page
- Ward polygon source: HIGH — live endpoint verified, 6 features returned with WGS84 geometry
- Headshots: HIGH — all 7 URLs returned HTTP 200
- Migration shape: HIGH — direct analog from Phase 161 PATTERNS.md
- External_id block: MEDIUM — collision analysis complete but Wave-0 probe required to confirm
- X0015 availability: MEDIUM — no existing migrations use X0015; Wave-0 probe required
- Geofence routing (X0015 catchall): HIGH — confirmed from essentialsService.ts line 646

**Research date:** 2026-06-27
**Valid until:** 2026-07-27 (stable city government; ward boundaries rarely change)
