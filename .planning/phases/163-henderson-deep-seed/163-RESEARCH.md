# Phase 163: Henderson Deep-Seed - Research

**Researched:** 2026-06-28
**Domain:** NV city government seed + custom ward geofence ingestion (Henderson) + headshots + stance research
**Confidence:** HIGH (structure, ward data, geo_id); MEDIUM (headshot URLs, external_id block)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Ward geofences (primary path)**
Build custom non-TIGER Henderson city-ward geofences (one polygon per ward) so a Henderson address returns its one correct ward council member. Uses a new custom MTFCC (LV claimed X0015 — Wave-0 picks next unclaimed X-code, likely X0016). Geo_id pattern: `henderson-nv-council-ward-N`. Rely on existing backend `X%`-catchall LOCAL routing — no backend edit. Mayor attaches to whole-city G4110 geofence (geo_id `3231900`).

**D-01b (fallback)**
If Wave-0 cannot source clean ward-boundary polygons or Henderson is confirmed pure at-large, fall back to single-CITY-district model: attach all council members to the Henderson city geofence, label each "Council Member, Ward N", document ward-precise routing as deferred. Phase still completes.

**D-02: Office scope**
Mayor + City Council only. Henderson's elected Municipal Court judges are explicitly deferred to a future judicial-compass phase (parity with LV scope exclusion).

**D-03: Mayor modeling**
Model Mayor Michelle Romero as a distinct directly-elected at-large seat within the City Council chamber — "Mayor" title, attached to the citywide geofence, sorted first. NOT rotational. Chamber = Mayor + 4 ward members (5 seats total; `official_count=5`). Verified: Romero was directly elected June 2022 (sworn Jan 2023), not a rotational designee.

**D-04: Government modeling + IDs**
Create standalone government "City of Henderson, Nevada, US" (mirrors "City of Las Vegas, Nevada, US"). NOT nested under State of Nevada. external_id block chosen by Wave-0 collision probe; likely `-3206xxx` block. Henderson city geo_id = `3231900` (TIGER G4110 place — confirmed by Phase 158 smoke test SC2).

**D-05: Stance topic scope + headshots**
Research all live compass topics per official, one agent at a time, evidence-only, 100% cited, honest blank spokes, zero defaults, chairs model (not polarity). No judicial topics. Headshot sourcing chain: `cityofhenderson.com` council pages first (BLOCKED by Akamai WAF-403 — see §Headshot Sources) → established workarounds → free alternates. 600×750, crop-4:5 then resize, no text/graphic overlays.

### Claude's Discretion

- Henderson ward-polygon data source + ingestion mechanism (resolved: `maps.cityofhenderson.com` ArcGIS MapServer `OpenDataAdministrativeBoundaries` Layer 2 — see §Ward Geofence Source).
- Exact new custom MTFCC (Wave-0 confirms next unclaimed X-code after X0015 — likely X0016).
- Exact external_id range (Wave-0 probe + pick unused −3206xxx block).
- Migration numbering: next migration is 1084 (Phase 162 ended at 1083; on-disk MAX confirmed 1083).
- Council chamber name (e.g., "Henderson City Council") — matches official body name.
- Per-ward free-text "Council Member, Ward I/II/III/IV" title — recommended; planner decides (Henderson uses Roman numerals).

### Deferred Ideas (OUT OF SCOPE)

- Henderson elected Municipal Court judges — deferred to a future judicial-compass phase.
- Single-city fallback as a permanent state — only if Wave-0 ward-polygon sourcing fails.
- Non-elected city offices (City Attorney, City Manager) — out of scope.
- Generalizing the ward-geofence pipeline to North Las Vegas (Phase 164) — noted for later reuse.

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLARK-03 | Henderson deep-seeded (NV's 2nd-largest city) — government + roster + headshots + evidence-only stances | All four success criteria addressed: (1) ward-precise routing via D-01 geofences, (2) 5 headshots — sourcing chain researched, primary WAF-blocked fallbacks identified, (3) stance research via inform schema one-at-a-time pattern, (4) coverage.js COVERAGE_STATES NV block addition of Henderson entry |

</phase_requirements>

---

## Summary

Phase 163 deep-seeds the City of Henderson — 1 standalone government, 1 chamber ("Henderson City Council"), 5 officials (Mayor at-large + 4 ward-elected council members), 5 headshots, and evidence-only compass stances for all 5. This phase mirrors Phase 162 (City of Las Vegas) exactly in structure.

**Ward count confirmed: 4 wards (I–IV)**, not any other number. Each ward has exactly one council member (elected citywide but ward-resident requirement — ward-precise routing is still the correct goal). Total seated officials: 1 Mayor + 4 ward members = 5. `official_count=5`.

**Ward polygon data is available.** The City of Henderson ArcGIS REST service at `maps.cityofhenderson.com` hosts "City Council Wards" as Layer 2 of the `OpenDataAdministrativeBoundaries` MapServer. All 4 ward polygons confirmed live (4 features, WGS84 via `outSR=4326`). The D-01b fallback is NOT needed.

**Headshots: primary source WAF-blocked.** `cityofhenderson.com` returns Akamai WAF-403 on all council pages — Chrome-UA also blocked. This is more restrictive than LV's Azure Blob source (which had no WAF). Fallback sourcing is required: campaign websites (Seebock campaign site has a 200-OK headshot), news coverage, and official press-use sources. Execution will require per-member fallback sourcing. Document genuine gaps honestly.

**Migration counter:** Phase 162 ended at on-disk file `1083_las_vegas_brune_stances.sql`. Next migration = **1084** (structural, registered). Stance migrations remain audit-only.

**Primary recommendation:** Execute D-01 (ward geofences) by adapting `load-lv-ward-boundaries.ts` to point at the Henderson ArcGIS MapServer (`OpenDataAdministrativeBoundaries` Layer 2), using a new MTFCC (X0016 pending Wave-0 probe). Then seed the standalone government, chamber, 5 offices (Mayor on `G4110` citywide district, 4 council members each on their per-ward `X0016` district), headshots (fallback chain required), and stances.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ward-precise council routing | Database / Storage (geofence_boundaries) | API / Backend (ST_Covers PIP) | PostGIS ST_Covers resolves point-in-polygon; ward polygons stored as geofence_boundaries rows with new MTFCC |
| Mayor at-large routing | Database / Storage (existing G4110 district) | — | Mayor attaches to city-wide G4110 district geo_id=3231900 already loaded by Phase 158 |
| Government/chamber/office seed | Database / Storage (migrations) | — | SQL migrations write to essentials.* tables |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage) | _tmp-*.py crops, resizes, uploads; Storage serves via CDN |
| Stance research | API / Backend (inform schema) | — | inform.politician_answers + inform.politician_context, applied via SQL |
| City surfacing (purple chip) | Frontend (coverage.js) | — | Add Henderson to existing Nevada block in COVERAGE_STATES |

---

## Standard Stack

Phase 163 uses no new npm/PyPI packages. All tooling is reused from Phase 162 (which itself reused from Phases 159-161).

### Core (reused from prior NV phases)

| Tool / Pattern | Version | Purpose | Basis |
|----------------|---------|---------|-------|
| psql -f (migration apply) | any | Apply structural + audit-only SQL migrations | Phase 160/161 executor split pattern |
| psycopg2 (Python headshot script) | 2.x | DB UUID resolution from external_id | `_tmp-lv-city-council-headshots.py` (Phase 162) |
| Pillow/PIL (Python) | any installed | crop-4:5 → resize 600x750 Lanczos q90 | Phase 162 headshot pipeline |
| requests (Python) | any installed | HTTP fetch of headshot images | Phase 162 headshot pipeline |
| Node.js / tsx | v18+ | Ward boundary loader script | `load-lv-ward-boundaries.ts` (Phase 162) |
| pg (Node.js) | any installed | DB pool for ward boundary loader | Phase 162 ward loader |
| PostGIS ST_Multi / ST_SetSRID / ST_GeomFromGeoJSON | DB-side | Geometry ingestion from ArcGIS JSON rings | Phase 162 pattern |

### New file: `load-henderson-ward-boundaries.ts`

Direct adaptation of `load-lv-ward-boundaries.ts`. Key changes:

| LV (Phase 162) | Henderson (Phase 163) |
|----------------|----------------------|
| `mapdata.lasvegasnevada.gov/clvgis/...CityCouncilWards/MapServer/0/query` | `maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer/2/query` |
| `mtfcc='X0015'` | `mtfcc='X0016'` (Wave-0 confirms — next unclaimed) |
| `GEO_ID_PREFIX = 'las-vegas-nv-council-ward-'` | `GEO_ID_PREFIX = 'henderson-nv-council-ward-'` |
| `EXPECTED_COUNT = 6` | `EXPECTED_COUNT = 4` |
| `STATE_CODE = 'nv'` | Same |
| Ward attribute: `feature.attributes.WARD` (integer 1–6) | `feature.attributes.WARD` (string "1"–"4") — cast to int |
| Ward names: Ward 1..6 (Arabic) | Ward I..IV (Roman) — but geo_id uses Arabic numerals for consistency |

**CRITICAL:** Henderson ward attribute field `WARD` returns string values ("1", "2", "3", "4"), not integers — use `parseInt()`. The `WARDNAME` field stores the Roman numeral names ("WARD I", etc.) — use these for the `name` field in geofence_boundaries. Use Arabic numerals in geo_id for consistency (geo_id=`henderson-nv-council-ward-1..4`).

### Installation

No new packages required. All Node.js and Python dependencies are pre-installed.

---

## Package Legitimacy Audit

No new external packages required for Phase 163. All dependencies are pre-existing in the project.
Skipping Package Legitimacy Gate (no new installs).

---

## Architecture Patterns

### System Architecture Diagram

```
Henderson ArcGIS MapServer (maps.cityofhenderson.com)
    │ OpenDataAdministrativeBoundaries/MapServer/2/query
    │ 4 ward polygon features, WGS84 (~smaller geometry than LV)
    ▼
load-henderson-ward-boundaries.ts (Wave 0)
    │ INSERT 4 rows: geo_id=henderson-nv-council-ward-N, mtfcc=X0016, state=nv
    ▼
essentials.geofence_boundaries [ward polygons]
    │
    ├──► migration 1084 (structural)
    │       INSERT governments "City of Henderson, Nevada, US"
    │       INSERT chambers "Henderson City Council" (official_count=5)
    │       INSERT districts: 1 LOCAL_EXEC geo_id=3231900 (Mayor)
    │                          4 LOCAL geo_id=henderson-nv-council-ward-N mtfcc=X0016
    │       INSERT 5 politicians + offices + back-fill
    │
    ├──► _tmp-henderson-headshots.py (Wave 1)
    │       Per-member fallback chain (see §Headshot Sources)
    │       → crop-4:5 → 600x750 → Storage PUT
    │       produces: 5 CDN URLs
    │
    ├──► migration 1085 (audit-only, headshots)
    │       INSERT 5 politician_images rows
    │
    ├──► 5x stance migrations 1086-1090 (audit-only, one per official)
    │       inform.politician_answers + inform.politician_context
    │       (one research agent per official, evidence-only)
    │
    └──► coverage.js edit (COVERAGE_STATES NV block)
            ADD Henderson entry: browseGovernmentList ['3231900'], hasContext=true

Backend ST_Covers query:
    User coordinate → ST_Covers(gb.geometry, point) →
        G4110 geo_id=3231900 → LOCAL_EXEC district → Mayor
        X0016 geo_id=henderson-nv-council-ward-N → LOCAL district → Ward N council member
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── scripts/
│   ├── load-henderson-ward-boundaries.ts   # NEW — Henderson ward loader (adapt load-lv-ward-boundaries.ts)
│   └── _tmp-henderson-council-headshots.py # NEW (gitignored) — headshot pipeline
└── migrations/
    ├── 1084_henderson_city_council.sql           # STRUCTURAL (registered)
    ├── 1085_henderson_city_council_headshots.sql # AUDIT-ONLY
    ├── 1086_henderson_romero_stances.sql         # AUDIT-ONLY (Mayor)
    ├── 1087_henderson_seebock_stances.sql        # AUDIT-ONLY (Ward I)
    ├── 1088_henderson_larson_stances.sql         # AUDIT-ONLY (Ward II)
    ├── 1089_henderson_cox_stances.sql            # AUDIT-ONLY (Ward III)
    └── 1090_henderson_stewart_stances.sql        # AUDIT-ONLY (Ward IV)

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                    # EDIT — add Henderson to existing NV block
```

Note: Migration numbers assume on-disk MAX = 1083 at Phase 163 start. Wave-0 DB probe is mandatory to confirm. If MAX differs, renumber accordingly.

### Pattern 1: Henderson Ward Geofence Loading (load-henderson-ward-boundaries.ts)

**What:** Fetches 4 ward polygon features from the City of Henderson ArcGIS MapServer and inserts them into `essentials.geofence_boundaries` as `X0016` rows with WGS84 geometry.

**Source endpoint confirmed live:**
```
https://maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer/2/query
  ?where=1%3D1&outFields=WARD,WARDNAME,COUNCILMAN&returnGeometry=true&f=json&outSR=4326
  &resultOffset=0&resultRecordCount=100
```
Returns 4 features (Ward 1-4), geometry type `esriGeometryPolygon`, spatial reference WGS84.
**CRITICAL:** A query without `resultRecordCount` may return only 3 features (default page limit). Always include `resultRecordCount=100` to ensure all 4 are returned.

**All 4 ward features confirmed:**
| Ward | WARDNAME | COUNCILMAN | Ring count | Area (sq m) |
|------|----------|-----------|-----------|-------------|
| 1 | WARD I | JIM SEEBOCK | 1 | ~1,368M |
| 2 | WARD II | MONICA LARSON | 1 | ~1,098M |
| 3 | WARD III | CARRIE COX | 4 | ~516M |
| 4 | WARD IV | DAN H. STEWART | 1 | ~409M |

Ward 3 (Cox) has 4 rings — likely main polygon + 3 holes or non-contiguous sub-parcels. Use `ST_Multi(ST_MakeValid(...))` pattern as in Phase 162 (Wards 4/5/6 of LV had 21-30 rings, also handled correctly).

**Ward geo_id scheme:**
```
henderson-nv-council-ward-1  (Ward I — Jim Seebock)
henderson-nv-council-ward-2  (Ward II — Monica Larson)
henderson-nv-council-ward-3  (Ward III — Carrie Cox)
henderson-nv-council-ward-4  (Ward IV — Dan H. Stewart)
```

**Adaptation diff from `load-lv-ward-boundaries.ts`:**
```typescript
// Henderson adaptation — replace these constants:
const HENDERSON_WARD_URL =
  'https://maps.cityofhenderson.com/arcgis/rest/services/public/' +
  'OpenDataAdministrativeBoundaries/MapServer/2/query' +
  '?where=1%3D1&outFields=WARD,WARDNAME,COUNCILMAN' +
  '&returnGeometry=true&f=json&outSR=4326&resultOffset=0&resultRecordCount=100';
  // CRITICAL: resultRecordCount=100 required — default returns only 3 of 4 wards
  // CRITICAL: outSR=4326 required — Henderson MapServer default is also projected CRS
  // CRITICAL: f=json (NOT f=geojson) — returns ArcGIS JSON rings, not GeoJSON

const MTFCC          = 'X0016';    // Wave-0 confirms this is unclaimed
const STATE_CODE     = 'nv';       // CRITICAL: lowercase for LOCAL tier routing
const SOURCE         = 'cityofhenderson.com-arcgis-opendata-admin-boundaries-ward-2026';
const GEO_ID_PREFIX  = 'henderson-nv-council-ward-';
const EXPECTED_COUNT = 4;          // 4 wards, not 6

// Ward attribute is STRING "1".."4" in Henderson (integer in LV) — adapt parsing:
const rawWard = attrs['WARD'] ?? attrs['WARDNAME'];
const ward = parseInt(String(rawWard ?? ''), 10);
// wardName = feature.attributes.WARDNAME (e.g., "WARD I") for display
const wardName = String(attrs['WARDNAME'] ?? `Ward ${ward}`);
```

**The `arcgisRingsToGeoJson` function copies verbatim from `load-lv-ward-boundaries.ts`** — same ArcGIS JSON format.

### Pattern 2: Structural Migration 1084 (standalone city government)

**Analog:** `1075_las_vegas_city_council.sql` (Phase 162 — direct model).

Key adaptations from Phase 162 (LV) to Phase 163 (Henderson):

| 162 (LV) | 163 (Henderson) |
|----------|----------------|
| `'City of Las Vegas, Nevada, US'` | `'City of Henderson, Nevada, US'` |
| `geo_id='3240000'` | `geo_id='3231900'` |
| `'Las Vegas City Council'` | `'Henderson City Council'` |
| `official_count=7` (Mayor + 6 wards) | `official_count=5` (Mayor + 4 wards) |
| 6 LOCAL ward districts (X0015) | 4 LOCAL ward districts (X0016) |
| 6 ward members each on `las-vegas-nv-council-ward-N` | 4 ward members each on `henderson-nv-council-ward-N` |
| external_id range `-3205001..-3205007` | `-3206001..-3206005` (Wave-0 confirms) |
| 7 politician+office blocks | 5 politician+office blocks |
| office_id back-fill `BETWEEN -3205007 AND -3205001` | `BETWEEN -3206005 AND -3206001` |
| Ledger `('1075','las_vegas_city_council')` | `('1084','henderson_city_council')` |

**Ward member titles:** Use Roman numeral form matching Henderson's official naming: `'Council Member, Ward I'`, `'Council Member, Ward II'`, `'Council Member, Ward III'`, `'Council Member, Ward IV'` (based on official WARDNAME field values = "WARD I".."WARD IV").

**Pre-flight assertion (Ward-0 must run before this migration):**
```sql
IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
    WHERE state = 'nv' AND mtfcc = 'X0016') < 4 THEN
  RAISE EXCEPTION 'Pre-flight FAILED: fewer than 4 X0016 ward geofences found. Run load-henderson-ward-boundaries.ts first.';
END IF;
```

### Pattern 3: Headshot Pipeline

**Analog:** `_tmp-lv-city-council-headshots.py` (Phase 162) — same crop/resize/upload pipeline.

**CRITICAL DIFFERENCE FROM LV:** `cityofhenderson.com` is Akamai WAF-403 (blocks all UA including Chrome 126). There is NO clean Azure Blob or equivalent direct-serve source like LV had. Headshots require per-member fallback sourcing (see §Headshot Sources). The script must handle per-member URL overrides with different licenses.

### Pattern 4: Stance Migration CTE (one per official)

**Identical shape to `1077_las_vegas_berkley_stances.sql` through `1083_las_vegas_brune_stances.sql` (Phase 162).**

Same topic_key join via `JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true`. Henderson city-level topics likely to have evidence (carries forward from LV pattern, adjusted for Henderson specifics):
- `homelessness-response` (Henderson camping laws, shelter policy)
- `homelessness` (Henderson city services vs. Clark County responsibility split)
- `housing` (Henderson affordable housing, growth)
- `public-safety-approach` (Henderson PD oversight — Note: Seebock IS the former LVMPD deputy chief)
- `transportation-priorities` (Henderson transit, cycling, I-215 corridor)
- `economic-development` (Henderson tech corridor, Raiders/sports venue spillover)
- `local-environment` (water conservation, HOA enforcement, Henderson desert climate)
- `local-immigration` (NV sanctuary debate; Clark County-wide enforcement posture)
- `growth` (Henderson growth management — historically a fast-growing suburb)

### Pattern 5: coverage.js COVERAGE_STATES NV block addition

**What:** Add Henderson entry to the existing Nevada block (LV already present from Phase 162, lines 183-188 of current coverage.js).

**Current state (confirmed in coverage.js lines 183-188):**
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

**After Phase 163 edit:**
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

Browse verification link after edit: `essentials.empowered.vote/results?browse_geo_id=3231900&browse_mtfcc=G4110`

### Anti-Patterns to Avoid

- **Same anti-patterns as Phase 162 all apply** — uppercase `d.state='NV'` (silent no-op), hardcoding slug, using `photo_origin_url`, rotational mayor model, defaulting stances. See 162-PATTERNS.md.
- **Missing `resultRecordCount` in Henderson ward query** — the default query returns only 3 of 4 ward features. Always include `resultRecordCount=100` in the ward loader URL.
- **Using Arabic numeral titles for ward members** — Henderson officially uses Roman numerals (WARD I–IV). Titles should be `'Council Member, Ward I'` not `'Council Member, Ward 1'`.
- **Assuming WAF workaround exists for cityofhenderson.com** — it is Akamai WAF-403 blocking all known UA strings including Chrome 126. Do not attempt curl with Chrome-UA; proceed directly to fallback sources.
- **Treating Ward III council seat as vacant** — Carrie Cox lost the June 2026 primary (did not advance to general) but remains the seated incumbent until the November 2026 general election. She is `is_active=true, is_incumbent=true` at time of seeding.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ward polygon fetching + DB insert | Custom fetch-and-insert from scratch | Adapt `load-lv-ward-boundaries.ts` | Handles ON CONFLICT, ST_Multi, ST_MakeValid, error logging, dry-run; all tested in Phase 162 |
| Headshot crop + resize | Manual PIL operations | Copy `_tmp-lv-city-council-headshots.py` | Correct pipeline: crop FIRST then resize; `optimize=True` strips EXIF |
| Stance CTE shape | New schema inference | Copy Phase 162 stance migration shape exactly | Topic_id join via `is_live=true`; ON CONFLICT idempotency |
| Government INSERT guard | Unique constraint assumption | `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name=...)` | `essentials.governments` has NO unique constraint on geo_id or name |
| district_type routing | Assuming G4110 alone routes ward members | Explicit LOCAL district per ward with matching geo_id | Backend joins `geofence_boundaries.geo_id = districts.geo_id`; ward members need per-ward LOCAL districts |

**Key insight:** X0016 (like X0015) will be caught by the X% catchall in `essentialsService.ts` line 646 automatically — no backend code change needed.

---

## Key Verified Facts

### Henderson Government Structure
[VERIFIED: multiple sources — cityofhenderson.com Ward pages (pre-WAF search results), ArcGIS ward attribute `COUNCILMAN` field, news3lv.com swearing-in coverage, ballotpedia.org search results]

**Form of government:** Mayor + 4 ward-elected council members. 5 total seats.

**Election mechanic:** Henderson uses a **citywide at-large election with ward-residency requirements**. Council members must reside in their ward but are voted on by all Henderson voters citywide. The CONTEXT correctly flags this — ward-precise routing is still the right goal because each resident has exactly one ward representative.

**Mayor:** Directly elected at-large (NOT rotational). Michelle Romero won directly in the June 2022 primary (sworn Jan 3, 2023). Term 2023–2027. Currently running for re-election (led June 2026 primary with 50.27%).

**Current roster (as of 2026-06-28):**

| Seat | Name | Title | Notes |
|------|------|-------|-------|
| At-large | Michelle Romero | Mayor | Directly elected Jan 2023; re-election bid 2026 |
| Ward I | Jim Seebock | Council Member, Ward I | Former LVMPD Deputy Chief; won special election 2023; re-elected 2024 (sworn Jan 7, 2025) |
| Ward II | Monica Larson | Council Member, Ward II | Dr. Monica Larson; first Black councilmember in Henderson history; elected Nov 2024 (sworn Jan 7, 2025) |
| Ward III | Carrie Cox | Council Member, Ward III | Elected Nov 2022 (sworn Jan 2023); lost June 2026 primary (Atlas leads); remains seated incumbent until Nov 2026 general |
| Ward IV | Dan H. Stewart | Council Member, Ward IV | Longest-serving; appointed 2017, elected 2019, re-elected 2024 (sworn Jan 7, 2025) |

### Henderson City geo_id (TIGER G4110 Place)
[VERIFIED: Phase 158 smoke test SC2, 158-02-SUMMARY.md]

**geo_id = `3231900`** (TIGER Place FIPS for City of Henderson, NV)

Confirmed: Phase 158 smoke test SC2 returned `Henderson city | 3231900 | 32003 | CD1 | SD5 | AD22`

**geofence_boundaries.state for G4110:** TIGER loader writes `state='32'` (FIPS string) for G4110 place boundaries. But the `districts` row for the LOCAL_EXEC Mayor district uses `state='nv'` (lowercase — LOCAL-tier convention). This is the same split as LV (geo_id=3240000, geofence state='32', district state='nv').

### Ward Geofence Source
[VERIFIED: Live query 2026-06-28 — count=4 confirmed, all 4 ward attributes returned, WGS84 coordinates ~-115° lon, ~36° lat]

**Source:** City of Henderson ArcGIS REST MapServer (city-owned, no authentication required)
**Service:** `maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer`
**Layer:** Layer 2 — "City Council Wards" (`defaultVisibility:false` but fully accessible)
**Full endpoint:**
```
https://maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer/2/query
  ?where=1%3D1&outFields=WARD,WARDNAME,COUNCILMAN&returnGeometry=true&f=json&outSR=4326
  &resultOffset=0&resultRecordCount=100
```
**maxRecordCount:** 1000 (well above 4 wards; use `resultRecordCount=100` as a safe guard)
**Format:** ArcGIS JSON (rings array) — same as LV. Convert via `arcgisRingsToGeoJson()`.

**Feature attribute schema:**
- `WARD`: string "1".."4" (parse to int)
- `WARDNAME`: string "WARD I".."WARD IV" (use for geofence `name` display field)
- `COUNCILMAN`: string (current occupant — informational, not stored in geofence)
- `SHAPE.AREA`: double (sq meters in projected CRS — not in WGS84)
- `SHAPE.LEN`: double

**License:** City of Henderson open data portal (gis-hendersonnv.opendata.arcgis.com) — consistent with US government open data convention. [ASSUMED: no explicit license confirmed; matches LV GIS precedent]

### Headshot Sources
[VERIFIED: curl HEAD tests 2026-06-28 where noted; others ASSUMED pending Wave-0 verification]

**Primary source (cityofhenderson.com): BLOCKED.** Akamai WAF-403 on all pages including Chrome 126 UA. There is no Azure Blob CDN equivalent like LV. This is the primary headshot risk for this phase.

**Fallback chain per member:**

| Member | Best Available Source | URL / Pattern | Status |
|--------|----------------------|---------------|--------|
| Michelle Romero (Mayor) | Las Vegas Sun media library (professional portrait by Christopher DeVargas) | `https://media.lasvegassun.com/media/img/photos/2023/04/26/Michelle_Romero_by_Christopher_DeVargas_t1200.png?a58a258a4dac404905303588401680fdf3ee23e4` | [VERIFIED: HTTP 200 - 2026-06-28; 1200x600 landscape — needs crop] |
| Michelle Romero (Mayor) | Nevada Business Magazine (2023 headshot) | `https://nevadabusiness.com/wp-content/uploads/2025/04/MR-2023-Headshot-SR-scaled.jpeg` | [VERIFIED: HTTP 200 - 2026-06-28; ~portrait format] |
| Jim Seebock (W-I) | Campaign website (`votejimseebock.com`) | `https://votejimseebock.com/wp-content/themes/jim-seebock/images/jim_headshot_header.png` | [VERIFIED: HTTP 200 - 2026-06-28] |
| Monica Larson (W-II) | Campaign website (`votedrmonicalarson.com`) | Not found on homepage — check `/about/` page or newsroom images | [ASSUMED: requires Wave-0 verification] |
| Carrie Cox (W-III) | Ballotpedia, Nevada Independent, campaign site (`checktheboxforcarriecox.com`) | No clean headshot URL found yet | [ASSUMED: requires Wave-0 search] |
| Dan Stewart (W-IV) | Campaign site (`danstewartnv.com/about/`), Ballotpedia | No clean headshot URL found yet | [ASSUMED: requires Wave-0 search] |

**photo_license guidance:** Campaign website photos = license ambiguous (treat as `press_use` unless verified otherwise); Las Vegas Sun = editorial attribution required, not `us_government_work`; official city portrait when accessible = `us_government_work`. Operator sets final `photo_license` at execution based on actual source used.

**Gap expectation:** Some members (Cox, Stewart, Larson, possibly) may require deeper fallback research at execution time. Document honest gaps; do not fabricate. Headshot script must emit a `FAILED` manifest line for any member with no source, not a fabricated image.

### Custom MTFCC Registry
[VERIFIED: Grep of all migrations in C:/EV-Accounts/backend/migrations/ (confirmed from Phase 162 RESEARCH.md §Custom MTFCC Registry)]

| MTFCC | Claimed by | Use |
|-------|-----------|-----|
| X0001-X0004 | Various (SLC council, tribal) | Council districts, built-in |
| X0013 | Boston MA (mig 347) | Boston council districts (9) |
| X0014 | MA cities (migs 711, 712) | MA ward boundaries |
| X0015 | Phase 162 — LV ward boundaries | Las Vegas NV ward boundaries (6 wards) |
| **X0016** | **Phase 163 proposed** | **Henderson NV ward boundaries (4 wards)** |

**Wave-0 probe required:** `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0016'` — expect 0.

### External_id Collision Analysis
[VERIFIED: Ranges from 161-PATTERNS.md + 162-01-SUMMARY.md; extension is ASSUMED pending Wave-0 probe]

**In use (must not collide):**
- US House: `-32001` .. `-32004`
- STATE_EXEC: `-3200001` .. `-3200006`
- Senate: `-3203001` .. `-3203021`
- Assembly: `-3204001` .. `-3204042`
- Clark County commissioners: `-3200301` .. `-3200307`
- LV City Council: `-3205001` .. `-3205007`
- US Senators: `-400057`, `-400058`

**Proposed block for Henderson City Council (5 seats):** `-3206001` .. `-3206005`

`-3206xxx` extends the LV city (`-3205xxx`) convention by incrementing the thousandths digit. Does not collide with any known NV range. Wave-0 probe confirms: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3206005 AND -3206001` = 0.

**Suggested assignment:**
- `-3206001`: Michelle Romero (Mayor)
- `-3206002`: Jim Seebock (Ward I)
- `-3206003`: Monica Larson (Ward II)
- `-3206004`: Carrie Cox (Ward III)
- `-3206005`: Dan H. Stewart (Ward IV)

### Migration Counter
[VERIFIED: ls C:/EV-Accounts/backend/migrations/ tail-5 = 1079..1083 on 2026-06-28; STATE.md confirms]

On-disk MAX = **1083** (`1083_las_vegas_brune_stances.sql`). Ledger MAX = **1075** (only structural migrations register). **Next migration = 1084 (structural).** All prior analysis is consistent — no v18.0-park drift to account for this phase.

---

## Common Pitfalls

### Pitfall 1: Henderson Ward Query Pagination (HENDERSON-SPECIFIC)
**What goes wrong:** Querying without `resultRecordCount` returns only 3 of 4 ward features. Ward 3 (or another ward) is silently omitted. The loader's `EXPECTED_COUNT=4` assertion fails.
**Why it happens:** ArcGIS MapServer default pagination returns the first N results; Henderson's layer has `maxRecordCount=1000` but the query default may apply a smaller page size.
**How to avoid:** Always include `resultRecordCount=100` (or higher) in the query URL. The `EXPECTED_COUNT=4` assertion in the loader will catch this before any DB write.
**Warning signs:** Loader reports "expected 4 wards, got 3" and exits non-zero.

### Pitfall 2: WARD Attribute Type Mismatch (HENDERSON-SPECIFIC)
**What goes wrong:** Henderson's `WARD` field returns string values ("1", "2", etc.) rather than integers. If the code tries `attrs.WARD` directly as a number, it may fail type checks or produce NaN on parseInt of an unexpected value.
**Why it happens:** ArcGIS field type for `WARD` is `esriFieldTypeString` (max 1 char) in Henderson, vs. integer in LV.
**How to avoid:** Use `parseInt(String(rawWard ?? ''), 10)` and check `isNaN(ward)` before use. The existing `load-lv-ward-boundaries.ts` pattern already handles this via `String(rawWard ?? '')`.
**Warning signs:** `isNaN(ward)` triggers the skip-warning, resulting in 0 wards inserted.

### Pitfall 3: Akamai WAF on cityofhenderson.com (HENDERSON-SPECIFIC)
**What goes wrong:** Attempting to curl headshots from `cityofhenderson.com` with any User-Agent string (including Chrome 126) returns 403. Execution proceeds to write placeholder URLs or fabricated images.
**Why it happens:** Henderson uses Akamai GHost WAF, which is more restrictive than LV's DNN/Azure Blob setup.
**How to avoid:** Skip `cityofhenderson.com` entirely. Go directly to the fallback sources listed in §Headshot Sources. If no fallback is found for a member, emit a FAILED manifest line and document the gap.
**Warning signs:** `curl -I cityofhenderson.com/*` returns `Server: AkamaiGHost` with 403.

### Pitfall 4: Ward III Carrie Cox — Incumbent Despite Primary Loss
**What goes wrong:** Treating Cox as a lame-duck or mis-seeding `is_active=false` because she lost the June 9, 2026 primary.
**Why it happens:** June primary results are known; the general election is November 2026.
**How to avoid:** Set `is_active=true, is_incumbent=true` for Cox. She remains the seated council member until the general election decides her successor. `is_active=false` only when she formally leaves office.
**Warning signs:** Cox's seat shown as vacant in the browse UI.

### Pitfall 5: Roman vs. Arabic Numerals in Ward Titles (HENDERSON-SPECIFIC)
**What goes wrong:** Using `'Council Member, Ward 1'` (Arabic) when Henderson officially uses `'Council Member, Ward I'` (Roman). Display inconsistency with official body.
**Why it happens:** LV used Arabic numerals (`'Council Member, Ward 1'`). Henderson's GIS layer and official website use Roman numerals (WARD I–IV).
**How to avoid:** All ward titles in offices use Roman numerals to match Henderson's official naming: `'Council Member, Ward I'`, `'Council Member, Ward II'`, `'Council Member, Ward III'`, `'Council Member, Ward IV'`. Geo_id slugs use Arabic numerals (`henderson-nv-council-ward-1..4`) for programmatic consistency — both are fine.
**Warning signs:** Office titles show "Ward 1" not "Ward I" in the browse UI.

### Pitfall 6: All Phase-162 Pitfalls Still Apply
**Multi-ring ward handling (Ward III has 4 rings):** Use `ST_Multi(ST_MakeValid(...))` pattern. Assert `ST_IsValid=true` in RETURNING clause.
**Two district types in one migration (LOCAL_EXEC + LOCAL):** Mayor on LOCAL_EXEC; ward members on LOCAL. Confirm 1 LOCAL_EXEC + 4 LOCAL offices in post-verify block.
**Lowercase `state='nv'`:** District WHERE clauses must use lowercase. Government `state='NV'` uppercase.
**Grep-gate forbidden tokens in .sql comments:** Paraphrase `slug` (→ "auto-generated path column"), `photo_origin_url` (→ "removed image-origin column").

---

## Code Examples

### Henderson Ward Boundary Loader (load-henderson-ward-boundaries.ts) — Key Diff

```typescript
// Source: load-lv-ward-boundaries.ts (direct adaptation)
// Change these constants:
const HENDERSON_WARD_URL =
  'https://maps.cityofhenderson.com/arcgis/rest/services/public/' +
  'OpenDataAdministrativeBoundaries/MapServer/2/query' +
  '?where=1%3D1&outFields=WARD,WARDNAME,COUNCILMAN' +
  '&returnGeometry=true&f=json&outSR=4326' +
  '&resultOffset=0&resultRecordCount=100';
  // CRITICAL: resultRecordCount=100 — without it, only 3 of 4 wards returned

const MTFCC          = 'X0016';
const STATE_CODE     = 'nv';
const SOURCE         = 'cityofhenderson.com-arcgis-opendata-admin-boundaries-ward-2026';
const GEO_ID_PREFIX  = 'henderson-nv-council-ward-';
const EXPECTED_COUNT = 4;

// Ward attribute parsing — WARD is a string in Henderson ("1".."4"):
const rawWard = attrs['WARD'] ?? attrs['WARDNAME'];
const ward = parseInt(String(rawWard ?? ''), 10);
const wardName = String(attrs['WARDNAME'] ?? `Ward ${ward}`); // "WARD I".."WARD IV"

// Everything else copies verbatim from load-lv-ward-boundaries.ts:
// - arcgisRingsToGeoJson(rings) — identical
// - pool.query(INSERT INTO essentials.geofence_boundaries...) — identical except $MTFCC
// - ST_MakeValid fallback — identical
// - Summary logging — adapt count (4 not 6)
```

### Structural Migration Step 3a — LOCAL_EXEC District for Mayor

```sql
-- Source: 1075_las_vegas_city_council.sql adapted for Henderson
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3231900', 'City of Henderson', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3231900' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);
-- Uses existing G4110 geofence (geo_id='3231900') loaded by Phase 158
-- state='nv' LOWERCASE (routing join key) — uppercase matches ZERO rows
```

### Structural Migration Step 3b — LOCAL Districts for Ward Members

```sql
-- Ward I — repeat for wards II-IV with geo_id='henderson-nv-council-ward-2/3/4'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'henderson-nv-council-ward-1', 'Ward I', 'X0016'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'henderson-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv'
);
-- label = 'Ward I' (Roman numeral — matches official Henderson naming)
```

### Mayor Politician + Office CTE

```sql
-- Source: 1075_las_vegas_city_council.sql BLOCK 1, adapted for Henderson
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Michelle Romero', 'Michelle', 'Romero', 'Non-Partisan',
          true, false, false, true, -3206001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Henderson City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Henderson, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3231900'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- CRITICAL: district_type='LOCAL_EXEC' (NOT 'LOCAL') for the Mayor
```

### Ward Member CTE (Ward I — Jim Seebock)

```sql
-- Source: 1075_las_vegas_city_council.sql BLOCK 2, adapted for Henderson Ward I
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jim Seebock', 'Jim', 'Seebock', 'Non-Partisan',
          true, false, false, true, -3206002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'Henderson City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of Henderson, Nevada, US')),
       p.id,
       'Council Member, Ward I', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'henderson-nv-council-ward-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat BLOCK 3-5 for Larson/Cox/Stewart with ext_ids -3206003..-3206005
-- Larson (W-II): is_appointed=false (elected Nov 2024)
-- Cox (W-III): is_incumbent=true, is_active=true (seated despite June 2026 primary loss)
-- Stewart (W-IV): is_appointed=false, is_incumbent=true (elected 2024, re-elected multiple times)
-- Note: last name 'Seebock' (one word, no hyphen)
-- Note: Monica Larson — full last name 'Larson' (campaign uses 'Dr. Monica Larson')
```

### Post-Verify DO Block (5 offices: 1 LOCAL_EXEC + 4 LOCAL)

```sql
DO $$
DECLARE
  v_gov_count INTEGER; v_exec_count INTEGER; v_local_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of Henderson, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verify FAILED: expected 1 Henderson gov row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_exec_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3231900' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'nv';
  IF v_exec_count <> 1 THEN
    RAISE EXCEPTION 'Post-verify FAILED: expected 1 LOCAL_EXEC office (Mayor), found %', v_exec_count;
  END IF;

  SELECT COUNT(*) INTO v_local_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.mtfcc = 'X0016' AND d.district_type = 'LOCAL' AND d.state = 'nv';
  IF v_local_count <> 4 THEN
    RAISE EXCEPTION 'Post-verify FAILED: expected 4 LOCAL ward offices, found %', v_local_count;
  END IF;

  RAISE NOTICE 'Post-verify PASSED: gov=%, exec=%, local=%', v_gov_count, v_exec_count, v_local_count;
END $$;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 162 first custom ward geofences (X0015, LV, 6 wards) | Phase 163 extends pattern (X0016, Henderson, 4 wards) | Phase 163 | Proves the pattern is reusable for NV cities; Phase 164 (North LV) likely to use X0017 |
| cityofhenderson.com council pages (blocked) | Fallback to campaign sites + news media + Wikimedia | Phase 163 | Headshot sourcing is harder than LV — documents the WAF pattern for North LV/Boulder City |
| LV NV block alone | LV + Henderson in COVERAGE_STATES NV block | Phase 163 | Henderson residents see the purple chip and can browse their representatives |

**Pattern established by this phase:**
The `load-henderson-ward-boundaries.ts` / `X0016` / `henderson-nv-council-ward-N` geo_id pattern can be reused for North Las Vegas (Phase 164) by adapting EXPECTED_COUNT and the MapServer endpoint.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ward polygon license is open government data (no explicit license confirmed on ArcGIS portal) | Key Verified Facts §Ward Geofence Source | Low: City of Henderson open data portal convention; consistent with LV precedent |
| A2 | External_id range `-3206001..-3206005` has no existing DB rows | Key Verified Facts §External_id Analysis | High: collision causes duplicate or silent no-op; Wave-0 probe required |
| A3 | X0016 has no existing geofence_boundaries rows | Standard Stack / MTFCC Registry | Medium: if X0016 already used, pick X0017; Wave-0 probe required |
| A4 | Migration ledger on-disk MAX = 1083 (LV Phase 162 ended here; confirmed) | Architecture §project structure | Low: on-disk confirmed via `ls` during research; Wave-0 re-verifies |
| A5 | Carrie Cox remains seated Ward III through November 2026 general | Key Verified Facts §Roster | Low: standard civic practice — incumbents serve until successor sworn in |
| A6 | Monica Larson, Dan Stewart, Carrie Cox party affiliations all 'Non-Partisan' (Henderson races are nonpartisan citywide) | Code Examples | Low: party stored but never displayed (antipartisan design); no UI impact |
| A7 | Campaign-site headshot images (Seebock votejimseebock.com, etc.) are usable press-use photos without graphic overlays | Headshot Sources | Medium: verify at execution that photos are headshot-style (head + shoulders, no campaign banners/text); reject if overlays present |
| A8 | Henderson ArcGIS MapServer will remain accessible during execution | Environment Availability | Low-medium: confirmed 200 OK during research; city-operated service; fallback = D-01b |
| A9 | `resultRecordCount=100` returns all 4 wards in a single response | Key Verified Facts §Ward Geofence Source | Low: count=4 confirmed; maxRecordCount=1000 on layer; safe guard |

**Confirmed facts needing no user validation:** geo_id=3231900 (Phase 158 smoke test), roster names and ward assignments (ArcGIS attributes + news coverage), current Mayor = Romero, ward count = 4, X0015 is LV (Henderson uses next code), migration on-disk MAX = 1083.

---

## Open Questions

1. **Monica Larson, Carrie Cox, Dan Stewart headshot sources**
   - What we know: No clean direct headshot URL confirmed. Campaign sites exist but headshot pages not scraped successfully.
   - What's unclear: Whether campaign sites serve portrait-style headshots without overlays; whether Ballotpedia or Wikimedia has photos for any of them.
   - Recommendation: Wave-0 operator research task: (a) visit votedrmonicalarson.com/about/, danstewartnv.com, and related campaign pages manually with a browser; (b) check Ballotpedia for any photos; (c) check news3lv.com/LVRJ article thumbnails for portrait-suitable crops. Treat a genuine gap as a documented gap, not a blocker.

2. **Michelle Romero headshot source preference**
   - What we know: Two URLs confirmed 200 OK: LV Sun media library (professional portrait, 1200x600 landscape) and Nevada Business Magazine (portrait format ~235KB JPEG).
   - What's unclear: Which one produces a cleaner 4:5 crop (portrait from NVBiz is likely closer to portrait ratio).
   - Recommendation: At execution, try Nevada Business Magazine URL first (portrait format JPEG likely closer to 4:5); if crop is poor, fall back to LV Sun PNG.

3. **X0016 vs. next unclaimed MTFCC**
   - What we know: X0015 was claimed by Phase 162 (LV). X0016 is the next logical sequential code.
   - What's unclear: Whether any other phase or migration (post-162, pre-163) consumed X0016.
   - Recommendation: Wave-0 probe: `SELECT DISTINCT mtfcc FROM essentials.geofence_boundaries WHERE mtfcc LIKE 'X%' ORDER BY mtfcc` — use the next unclaimed X-code above X0015.

4. **Henderson election November 2026 impact on seeding**
   - What we know: Ward III (Cox) lost the primary; Mayor race goes to November (Romero won outright). Wards I, II, IV officials re-upped through 2025.
   - What's unclear: Whether to seed Cox differently knowing she may leave office ~January 2027.
   - Recommendation: Seed Cox as `is_active=true, is_incumbent=true` — she is the seated official. The phase seeds who is in office now; future updates will reflect election results.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Henderson GIS MapServer (`maps.cityofhenderson.com`) | Ward polygon loader | ✓ (verified 2026-06-28, HTTP 200) | ArcGIS REST | D-01b single-city fallback |
| `cityofhenderson.com` council pages | Primary headshot source | ✗ (Akamai WAF-403, Chrome UA also blocked) | — | Campaign sites + news media + Wikimedia |
| Campaign sites (votejimseebock.com, etc.) | Headshot fallback | ✓ partial (Seebock confirmed 200 OK) | — | News media thumbnails, Ballotpedia |
| psql CLI | Migration apply | ✓ (confirmed all prior NV phases) | — | — |
| Python + Pillow + psycopg2 + requests | Headshot pipeline | ✓ (used in Phases 161–162) | — | — |
| Node.js + tsx + pg | Ward boundary loader | ✓ (used in Phases 158–162) | — | — |

**Missing dependencies with no fallback:** None that block the phase.

**Missing dependencies with fallback:**
- `cityofhenderson.com` (WAF-403) → campaign sites + news media + Wikimedia for headshots
- Henderson GIS MapServer becomes unavailable → D-01b (all council members on city G4110 geofence `3231900`)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| Config file | None (ad-hoc scripts — project convention for deep-seeds) |
| Quick run command | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend for Henderson ward routing) |
| Full suite command | Inline 9-check SQL/HTTP verification (analog to Phase 162 Plan 03) |
| Estimated runtime | ~30 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLARK-03 SC#1 | Henderson address returns Mayor + correct ward council member | smoke / integration | Post-apply address probe via `npx tsx` (extend `smoke-nv-geofences.ts` with Henderson ward point) | ❌ Wave 0 |
| CLARK-03 SC#1 | 4 X0016 ward polygons loaded + ST_IsValid | SQL gate | `SELECT COUNT(*), bool_and(ST_IsValid(geometry)) FROM essentials.geofence_boundaries WHERE mtfcc='X0016'` = (4, true) | ❌ Wave 0 inline |
| CLARK-03 SC#2 | 5 officials have 600×750 headshots | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3206005 AND -3206001` = 5 | ❌ Wave 0 inline |
| CLARK-03 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3206005 AND -3206001` ≥ 1; 0 null/default values | ❌ Wave 0 inline |
| CLARK-03 SC#4 | Henderson in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` NV block + browse `?browse_geo_id=3231900&browse_mtfcc=G4110` | ❌ Wave 0 manual |
| — | No section-split after seed | SQL gate | Section-split scan = 0 rows | ❌ Wave 0 inline |

### Sampling Rate

- After every task commit: inline SQL count for that task
- After every plan wave: `smoke-nv-geofences.ts` + inline SQL counts
- Before sign-off: full 9-check E2E green + human-verify checkpoint (address routing + correct-person)
- Max feedback latency: ~30 seconds

### Wave 0 Gaps

- [ ] `scripts/load-henderson-ward-boundaries.ts` — loads 4 X0016 ward polygons from Henderson ArcGIS MapServer (new file; adapt `load-lv-ward-boundaries.ts`)
- [ ] Wave-0 DB probes: live ledger MAX (`SELECT MAX(version::int) FROM supabase_migrations.schema_migrations`); external_id collision probe (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3206005 AND -3206001`); X0016 existence (`SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0016'`); Henderson G4110 geo_id casing (`SELECT geo_id, state FROM essentials.geofence_boundaries WHERE name ILIKE '%Henderson%' AND mtfcc='G4110'`)
- [ ] Wave-0 headshot sourcing: per-member campaign/news fallback URLs for Larson, Cox, Stewart

---

## Security Domain

Checked. This phase performs no authentication, no public API endpoints, no user-facing input validation, no cryptography, and no secrets beyond the existing DATABASE_URL in the backend .env. All operations are operator-initiated SQL migrations and scripts. No ASVS categories applicable.

---

## Sources

### Primary (HIGH confidence)

- Phase 158-02-SUMMARY.md — Henderson geo_id=3231900, smoke test SC2 confirmation, NV TIGER casing convention
- Phase 162 RESEARCH.md, PATTERNS.md, 162-01/02/03-SUMMARY.md — LV ward loader, structural migration shape, headshot pipeline, stance CTE, migration ledger drift lesson, 9-check E2E template
- Phase 161-PATTERNS.md — standalone government template, NV external_id scheme
- `maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer/2/query` — live ArcGIS ward boundary endpoint (4 features confirmed, WGS84 coordinates ~-115° lon, ~36° lat; verified 2026-06-28)
- `maps.cityofhenderson.com/arcgis/rest/services/public/OpenDataAdministrativeBoundaries/MapServer/2` layer metadata — confirmed Layer 2 = "City Council Wards", maxRecordCount=1000
- `ls C:/EV-Accounts/backend/migrations/ | tail -5` — on-disk MAX = 1083 confirmed 2026-06-28
- `src/lib/coverage.js` lines 183-188 — NV block present, Las Vegas entry confirmed, Henderson not yet present

### Secondary (MEDIUM confidence)

- WebSearch "Henderson Nevada city council members 2026" — roster (Mayor Romero, Seebock W-I, Larson W-II, Cox W-III, Stewart W-IV) confirmed across multiple independent sources
- news3lv.com swearing-in article (Jan 7, 2025) — confirmed Seebock/Stewart/Larson sworn in that date; Romero quote
- Nevada Current / news3lv.com June 2026 primary results — Romero won outright (50.27%); Cox did not advance to general (Atlas leads Ward III); Cox remains seated incumbent until November 2026
- curl HEAD tests of headshot URLs: Seebock votejimseebock.com 200 OK; Romero LV Sun media library 200 OK; Romero Nevada Business Magazine 200 OK — all 2026-06-28
- ArcGIS layer attributes (WARD, WARDNAME, COUNCILMAN fields) — confirmed all 4 roster names match official city council

### Tertiary (LOW confidence)

- Ward polygon license assumed open government data (no explicit license confirmed on ArcGIS portal) [ASSUMED — A1]
- Campaign-site headshot URLs for Larson, Cox, Stewart not yet confirmed 200 OK [ASSUMED — A7]
- party='Non-Partisan' for all 5 officials (Henderson races nonpartisan; no DB impact given antipartisan display rule) [ASSUMED — A6]

---

## Metadata

**Confidence breakdown:**
- Roster: HIGH — confirmed from ArcGIS COUNCILMAN field + multiple independent news sources + official Ballotpedia/search results
- Ward count / structure: HIGH — confirmed 4 wards (I–IV), citywide election with ward residency, Mayor directly elected
- Ward polygon source: HIGH — live endpoint verified, 4 features returned with WGS84 geometry
- geo_id: HIGH — Phase 158 smoke test SC2 confirmed `3231900`
- Headshots: LOW-MEDIUM — primary source WAF-blocked; 2 of 5 fallback URLs confirmed 200 OK; 3 of 5 require Wave-0 sourcing
- Migration shape: HIGH — direct analog from Phase 162 PATTERNS.md + LV loader source read
- External_id block: MEDIUM — collision analysis complete; Wave-0 probe required to confirm
- X0016 availability: MEDIUM — no known migrations use it; Wave-0 probe required
- Migration counter: HIGH — on-disk MAX=1083 confirmed by live `ls`

**Research date:** 2026-06-28
**Valid until:** 2026-07-28 (stable city government; ward assignments may change post-November 2026 election but seated incumbents are correct at time of seeding)
