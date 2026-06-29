# Phase 164: North Las Vegas Deep-Seed - Research

**Researched:** 2026-06-28
**Domain:** NV city government seed + custom ward geofence ingestion (North Las Vegas) + headshots + stance research
**Confidence:** HIGH (structure, ward data source, geo_id, roster, migration counter, X-code, external_id block); MEDIUM (4 of 5 headshot URLs, per-member stance evidence depth)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01: Ward geofences (primary path)**
Build custom non-TIGER North Las Vegas city-ward geofences (one polygon per ward) so an NLV address returns its one correct ward council member. Uses a new custom MTFCC (LV=X0015, Henderson=X0016 — Wave-0 picks next unclaimed, **X0017**). Geo_id pattern: `north-las-vegas-nv-council-ward-N`. Rely on existing backend `X%`-catchall LOCAL routing — no backend edit. At-large Mayor attaches to whole-city G4110 geofence (geo_id `3251800`); each ward member to its ward polygon.

**D-01b (fallback)**
If Wave-0 cannot source clean ward polygons OR NLV is confirmed pure at-large, fall back to single-CITY-district model: attach all council members to the NLV city geofence, label each "Council Member, Ward N", document ward-precise routing as deferred. Phase still completes. **NOT needed — clean ward polygons confirmed (see §Ward Geofence Source).**

**D-02: Office scope**
Mayor + City Council only. NLV's elected Municipal Court judges are explicitly deferred to a future judicial-compass phase (parity with LV/Henderson scope exclusion).

**D-03: Mayor modeling**
Model the Mayor (Pamela Goynes-Brown, directly elected at-large, elected 2022) as a distinct directly-elected at-large seat within the City Council chamber — "Mayor" title, attached to the citywide geofence, sorted first. NOT rotational. Chamber = Mayor + 4 ward members (5 seats total; `official_count=5`).

**D-04: Government modeling + IDs**
Create standalone government "City of North Las Vegas, Nevada, US" (mirrors "City of Las Vegas/Henderson, Nevada, US"). NOT nested under State of Nevada. INSERT via `WHERE NOT EXISTS` (no geo_id unique constraint). external_id block chosen by Wave-0 collision probe; **`-3207xxx`** confirmed unclaimed. NLV city geo_id = **`3251800`** (TIGER G4110 place — confirmed by Phase 158 smoke test).

**D-05: Stance topic scope + headshots**
Research all live compass topics per official, one agent at a time, evidence-only, 100% cited, honest blank spokes, zero defaults, chairs model (not polarity). No judicial topics. Headshot sourcing chain: `cityofnorthlasvegas.com` first (**BLOCKED by Akamai WAF-403 — same as Henderson**; see §Headshot Sources) → established workarounds → free alternates. 600×750, crop-4:5 then resize, no text/graphic overlays, no fabrication.

**D-06: Headshot sourcing chain**
cityofnorthlasvegas.com → WAF workarounds → Wikimedia Commons (descriptive UA) / official campaign / Ballotpedia → document a genuine gap if none exist. 600×750, mirrored to Storage `politician_photos/{uuid}-headshot.jpg`. `photo_license` set at execution from the actual source.

### Claude's Discretion

- NLV ward-polygon data source + ingestion mechanism (resolved: **Clark County GISMO `OpenData/PoliticalBoundaries/MapServer/5` ("Ward" layer), filtered `where=PLACE=80`** — see §Ward Geofence Source). Adapt `load-lv-ward-boundaries.ts` / `load-henderson-ward-boundaries.ts`.
- Exact new custom MTFCC (resolved: **X0017** — Wave-0 re-probe).
- Exact external_id range (resolved: **`-3207001..-3207005`** — Wave-0 re-probe).
- **Migration numbering: CONTEXT said next=1091, but 1091/1092 have since landed on disk → next structural migration is `1093`** (see §Migration Counter — this is the v18.0-park drift the CONTEXT warned about, materialized).
- Council chamber name (recommend "North Las Vegas City Council").
- Per-ward free-text "Council Member, Ward N" title — recommended; **NLV uses Arabic numerals (Ward 1–4), not Roman numerals like Henderson.**

### Deferred Ideas (OUT OF SCOPE)

- NLV elected Municipal Court judges — deferred to a future judicial-compass phase.
- Single-city fallback as a permanent state — not needed (clean ward polygons sourced).
- Non-elected city offices (City Attorney, City Manager) — out of scope.
- Generalizing the ward-geofence pipeline to Boulder City (Phase 165) — Boulder City is likely pure at-large (single-city model).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLARK-04 | North Las Vegas deep-seeded — government + roster + headshots + evidence-only stances | All four success criteria addressed: (1) ward-precise routing via D-01 geofences (Clark County GISMO Ward layer PLACE=80, 4 polygons confirmed); (2) 5 headshots — Goynes-Brown via Wikimedia Commons (public domain) confirmed, 4 council members require per-member fallback (WAF-403 primary, same as Henderson); (3) stance research via inform schema one-at-a-time pattern; (4) coverage.js COVERAGE_STATES NV block addition of North Las Vegas entry |

</phase_requirements>

---

## Summary

Phase 164 deep-seeds the City of North Las Vegas — 1 standalone government, 1 chamber ("North Las Vegas City Council"), 5 officials (Mayor at-large + 4 ward-elected council members), 5 headshots, and evidence-only compass stances for all 5. Structurally this is a near-exact clone of Phase 163 (Henderson) and Phase 162 (Las Vegas).

**Ward count confirmed: 4 wards (1–4).** Unlike Henderson/LV (which elect citywide with ward-residency requirements), **NLV elects council members purely by-ward** — each council member is voted on only by the registered voters of their own ward; the Mayor is voted citywide. Routing is identical to the prior cities (one ward member per resident), so the D-01 ward-geofence model is exactly right. Total seated officials: 1 Mayor + 4 ward members = 5. `official_count=5`.

**Ward polygon data is available — and from a *better* source than Henderson.** The Clark County GISMO ArcGIS service at `maps.clarkcountynv.gov` hosts a single "Ward" layer (`OpenData/PoliticalBoundaries/MapServer/5`) that contains the council wards for **all three valley cities keyed by `PLACE` code**: PLACE=60 Henderson, PLACE=65 Las Vegas, **PLACE=80 North Las Vegas**. A query `where=PLACE=80&outSR=4326` returns exactly **4 NLV ward features** with WGS84 geometry, attributes matching the live roster (`1 - Isaac E. Barrón`, `2 - Ruth Garcia Anderson`, `3 - Scott Black`, `4 - Richard Cherchio`). The D-01b fallback is NOT needed.

**Headshots: primary source WAF-blocked (same as Henderson).** `cityofnorthlasvegas.com` returns Akamai WAF-403 (`Server: AkamaiGHost`) on all council pages — Chrome-UA also blocked. **Mayor Goynes-Brown has a confirmed clean source**: Wikimedia Commons `File:Pamela Goynes-Brown.jpg` (476×635, **Public domain**, a Sen. Rosen office photo). The 4 council members require per-member fallback sourcing (Ballotpedia, campaign sites, news media) at execution time — exactly the Henderson pattern. Document genuine gaps honestly; no fabrication.

**Migration counter — DRIFT MATERIALIZED.** CONTEXT (and the Henderson 163-03 summary) said "next migration is 1091." But two new migrations have since landed on disk: `1091_seed_ca_2026_house_candidates.sql` and `1092_phase149_dedup_redistricted_incumbents.sql` (Phase 149 work). **On-disk MAX = 1092, so next structural migration = `1093`.** This is precisely the v18.0-park drift the CONTEXT flagged — trust the highest on-disk file +1, NOT the stale ledger/notes. Wave-0 re-probe is mandatory.

**Primary recommendation:** Adapt `load-lv-ward-boundaries.ts` → `load-north-las-vegas-ward-boundaries.ts` pointing at the Clark County GISMO `PoliticalBoundaries/MapServer/5` layer with `where=PLACE=80`, MTFCC `X0017`. Then seed the standalone government, chamber, 5 offices (Mayor on G4110 `3251800`, 4 council members each on `north-las-vegas-nv-council-ward-N` X0017 districts), headshots (Goynes-Brown Wikimedia + per-member fallback), and stances. Migration block starts at **1093**.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Ward-precise council routing | Database / Storage (geofence_boundaries) | API / Backend (ST_Covers PIP) | PostGIS ST_Covers resolves point-in-polygon; ward polygons stored as geofence_boundaries rows with MTFCC X0017 |
| Mayor at-large routing | Database / Storage (existing G4110 district) | — | Mayor attaches to city-wide G4110 district geo_id=3251800 already loaded by Phase 158 |
| Government/chamber/office seed | Database / Storage (migrations) | — | SQL migrations write to essentials.* tables |
| Headshot pipeline | API / Backend (Python script) | CDN / Static (Supabase Storage) | _tmp-*.py crops, resizes, uploads; Storage serves via CDN |
| Stance research | API / Backend (inform schema) | — | inform.politician_answers + inform.politician_context, applied via SQL |
| City surfacing (purple chip) | Frontend (coverage.js) | — | Add North Las Vegas to existing Nevada block in COVERAGE_STATES |

---

## Standard Stack

Phase 164 uses no new npm/PyPI packages. All tooling is reused from Phases 162/163 (which reused from Phases 159–161).

### Core (reused from prior NV phases)

| Tool / Pattern | Version | Purpose | Basis |
|----------------|---------|---------|-------|
| psql -f (migration apply) | any | Apply structural + audit-only SQL migrations | Phase 160/161/163 executor split |
| psycopg2 (Python headshot script) | 2.x | DB UUID resolution from external_id | `_tmp-henderson-council-headshots.py` (Phase 163) |
| Pillow/PIL (Python) | any installed | crop-4:5 → resize 600x750 Lanczos q90 | Phase 162/163 headshot pipeline |
| requests (Python) | any installed | HTTP fetch of headshot images | Phase 162/163 headshot pipeline |
| Node.js / tsx | v18+ | Ward boundary loader script | `load-lv-ward-boundaries.ts` / `load-henderson-ward-boundaries.ts` |
| pg (Node.js) | any installed | DB pool for ward boundary loader | Phase 162/163 ward loader |
| PostGIS ST_Multi / ST_SetSRID / ST_GeomFromGeoJSON / ST_MakeValid | DB-side | Geometry ingestion from ArcGIS JSON rings | Phase 162/163 pattern |

### New file: `load-north-las-vegas-ward-boundaries.ts`

Direct adaptation of `load-henderson-ward-boundaries.ts`. Key changes:

| Henderson (Phase 163) | North Las Vegas (Phase 164) |
|-----------------------|-----------------------------|
| `maps.cityofhenderson.com/.../OpenDataAdministrativeBoundaries/MapServer/2/query` (city-owned) | `maps.clarkcountynv.gov/arcgis/rest/services/OpenData/PoliticalBoundaries/MapServer/5/query` (county GISMO; **filter `where=PLACE=80`**) |
| `mtfcc='X0016'` | `mtfcc='X0017'` (Wave-0 confirms — next unclaimed) |
| `GEO_ID_PREFIX='henderson-nv-council-ward-'` | `GEO_ID_PREFIX='north-las-vegas-nv-council-ward-'` |
| `EXPECTED_COUNT=4` | `EXPECTED_COUNT=4` (same) |
| `outFields=WARD,WARDNAME,COUNCILMAN` | `outFields=WARD,NAME,PLACE` (Clark County schema differs) |
| WARD attribute is string "1".."4" | WARD attribute is **SmallInteger 1–4** (`esriFieldTypeSmallInteger` — already an int) |
| Ward name from `WARDNAME` ("WARD I") | Ward name = `Ward ${ward}` (Arabic) or derive from `NAME` ("1 - Isaac E. Barrón") |
| `where=1%3D1` | `where=PLACE%3D80` (CRITICAL — the layer holds all 3 cities' wards) |

**CRITICAL — `where=PLACE=80`:** The Clark County "Ward" layer contains 139 features total, of which only 14 are real council wards (the rest are WARD=0 precinct fragments). A query without the `PLACE=80` filter will return Henderson + LV + NLV + noise. Always filter `where=PLACE=80` to get exactly the 4 NLV wards.

**WARD attribute is already an integer** in the Clark County layer (`esriFieldTypeSmallInteger`), unlike Henderson's string field — `parseInt(String(rawWard ?? ''),10)` still works and is safe to keep.

### Installation

No new packages required. All Node.js and Python dependencies are pre-installed.

---

## Package Legitimacy Audit

No new external packages required for Phase 164. All dependencies are pre-existing in the project.
Skipping Package Legitimacy Gate (no new installs).

---

## Architecture Patterns

### System Architecture Diagram

```
Clark County GISMO ArcGIS MapServer (maps.clarkcountynv.gov)
    │ OpenData/PoliticalBoundaries/MapServer/5  (the "Ward" layer)
    │ where=PLACE=80  →  4 NLV ward polygon features, WGS84 (outSR=4326)
    │ (PLACE=60 Henderson, PLACE=65 LV, PLACE=80 North Las Vegas)
    ▼
load-north-las-vegas-ward-boundaries.ts (Wave 0)
    │ INSERT 4 rows: geo_id=north-las-vegas-nv-council-ward-N, mtfcc=X0017, state=nv
    ▼
essentials.geofence_boundaries [ward polygons]
    │
    ├──► migration 1093 (structural)
    │       INSERT governments "City of North Las Vegas, Nevada, US"
    │       INSERT chambers "North Las Vegas City Council" (official_count=5)
    │       INSERT districts: 1 LOCAL_EXEC geo_id=3251800 (Mayor)
    │                          4 LOCAL geo_id=north-las-vegas-nv-council-ward-N mtfcc=X0017
    │       INSERT 5 politicians + offices + back-fill
    │
    ├──► _tmp-north-las-vegas-council-headshots.py (Wave 1)
    │       Goynes-Brown: Wikimedia Commons (public_domain) confirmed
    │       4 council members: per-member fallback chain (Ballotpedia/campaign/news)
    │       → crop-4:5 → 600x750 → Storage PUT
    │
    ├──► migration 1094 (audit-only, headshots)  →  5 politician_images rows
    │
    ├──► 5x stance migrations 1095-1099 (audit-only, one per official)
    │       inform.politician_answers + inform.politician_context
    │
    └──► coverage.js edit (COVERAGE_STATES NV block)
            ADD North Las Vegas entry: browseGovernmentList ['3251800'], hasContext=true

Backend ST_Covers query:
    User coordinate → ST_Covers(gb.geometry, point) →
        G4110 geo_id=3251800 → LOCAL_EXEC district → Mayor
        X0017 geo_id=north-las-vegas-nv-council-ward-N → LOCAL district → Ward N council member
```

### Recommended Project Structure (new files)

```
C:/EV-Accounts/backend/
├── scripts/
│   ├── load-north-las-vegas-ward-boundaries.ts   # NEW — adapt load-henderson-ward-boundaries.ts
│   └── _tmp-north-las-vegas-council-headshots.py # NEW (gitignored) — headshot pipeline
└── migrations/
    ├── 1093_north_las_vegas_city_council.sql           # STRUCTURAL (registered)
    ├── 1094_north_las_vegas_city_council_headshots.sql # AUDIT-ONLY
    ├── 1095_north_las_vegas_goynesbrown_stances.sql    # AUDIT-ONLY (Mayor)
    ├── 1096_north_las_vegas_barron_stances.sql         # AUDIT-ONLY (Ward 1)
    ├── 1097_north_las_vegas_garciaanderson_stances.sql # AUDIT-ONLY (Ward 2)
    ├── 1098_north_las_vegas_black_stances.sql          # AUDIT-ONLY (Ward 3)
    └── 1099_north_las_vegas_cherchio_stances.sql       # AUDIT-ONLY (Ward 4)

C:/Transparent Motivations/essentials/
└── src/lib/coverage.js                    # EDIT — add North Las Vegas to existing NV block
```

Note: Migration numbers assume on-disk MAX = 1092 at Phase 164 start (confirmed 2026-06-28). Wave-0 DB/disk probe is mandatory to re-confirm before any write — more migrations may land between research and execution.

### Pattern 1: NLV Ward Geofence Loading (load-north-las-vegas-ward-boundaries.ts)

**What:** Fetches 4 NLV ward polygon features from the Clark County GISMO "Ward" layer (filtered `PLACE=80`) and inserts them into `essentials.geofence_boundaries` as `X0017` rows with WGS84 geometry.

**Source endpoint confirmed live (2026-06-28):**
```
https://maps.clarkcountynv.gov/arcgis/rest/services/OpenData/PoliticalBoundaries/MapServer/5/query
  ?where=PLACE%3D80&outFields=WARD,NAME,PLACE&returnGeometry=true&f=json&outSR=4326
  &resultOffset=0&resultRecordCount=100
```
Returns exactly 4 features (Ward 1–4), geometry type `esriGeometryPolygon`, spatialReference wkid=4326 (WGS84), coordinates ~-115° lon / ~36° lat.

**All 4 NLV ward features confirmed (live query 2026-06-28):**
| WARD | NAME (attribute) | Council member | Ring count |
|------|------------------|----------------|-----------|
| 1 | `1 - Isaac E. Barrón` | Isaac Barron | 7 |
| 2 | `2 - Ruth Garcia Anderson` | Ruth Garcia-Anderson | 7 |
| 3 | `3 - Scott Black` | Scott Black | 1 |
| 4 | `4 - Richard Cherchio` | Richard Cherchio | 1 |

Wards 1 and 2 have 7 rings each (multi-ring / non-contiguous) — use `ST_Multi(ST_MakeValid(...))` exactly as Henderson Ward 3 (4 rings) and LV Wards 4/5/6 (21–30 rings) required. The loader's existing `ST_MakeValid` fallback handles this with no change.

**Ward geo_id scheme:**
```
north-las-vegas-nv-council-ward-1  (Ward 1 — Isaac Barron)
north-las-vegas-nv-council-ward-2  (Ward 2 — Ruth Garcia-Anderson)
north-las-vegas-nv-council-ward-3  (Ward 3 — Scott Black)
north-las-vegas-nv-council-ward-4  (Ward 4 — Richard Cherchio)
```

**Adaptation diff (constants block):**
```typescript
// CRITICAL: where=PLACE=80 — the layer holds all 3 valley cities' wards (PLACE 60/65/80)
// CRITICAL: outSR=4326 required — Clark County MapServer default CRS is projected (NV State Plane)
// CRITICAL: f=json (NOT f=geojson) — returns ArcGIS JSON rings, not GeoJSON
const NLV_WARD_URL =
  'https://maps.clarkcountynv.gov/arcgis/rest/services/OpenData/' +
  'PoliticalBoundaries/MapServer/5/query' +
  '?where=PLACE%3D80&outFields=WARD,NAME,PLACE' +
  '&returnGeometry=true&f=json&outSR=4326&resultOffset=0&resultRecordCount=100';

const MTFCC          = 'X0017';    // Wave-0 confirms unclaimed (next after X0015/LV, X0016/Henderson)
const STATE_CODE     = 'nv';       // CRITICAL: lowercase for LOCAL-tier routing
const SOURCE         = 'clarkcountynv.gov-gismo-politicalboundaries-ward-place80-2026';
const GEO_ID_PREFIX  = 'north-las-vegas-nv-council-ward-';
const EXPECTED_COUNT = 4;

// WARD is esriFieldTypeSmallInteger here (already an int) — parseInt(String(...)) still safe:
const rawWard = attrs['WARD'];
const ward = parseInt(String(rawWard ?? ''), 10);
// NLV ward display name — Arabic numeral (NLV does NOT use Roman numerals):
const wardName = `Ward ${ward}`;
```

The `arcgisRingsToGeoJson`, `fetchJson`, DB INSERT, and `ST_MakeValid` fallback all copy verbatim from `load-henderson-ward-boundaries.ts`.

### Pattern 2: Structural Migration 1093 (standalone city government)

**Analog:** `1084_henderson_city_council.sql` (Phase 163 — direct, near-identical model) / `1075_las_vegas_city_council.sql` (original).

Key adaptations from Henderson (1084) to NLV (1093):

| 163 (Henderson 1084) | 164 (NLV 1093) |
|----------------------|----------------|
| `'City of Henderson, Nevada, US'` | `'City of North Las Vegas, Nevada, US'` |
| `geo_id='3231900'` | `geo_id='3251800'` |
| `'Henderson City Council'` | `'North Las Vegas City Council'` |
| `official_count=5` | `official_count=5` (same) |
| `mtfcc='X0016'` | `mtfcc='X0017'` |
| `< 4 X0016 ward geofences` | `< 4 X0017 ward geofences` |
| 4 LOCAL ward districts (X0016) | 4 LOCAL ward districts (X0017) |
| `'henderson-nv-council-ward-1..4'` | `'north-las-vegas-nv-council-ward-1..4'` |
| `'Ward I'..'Ward IV'` (Roman) | `'Ward 1'..'Ward 4'` (**Arabic — NLV convention**) |
| external_id `-3206001..-3206005` | `-3207001..-3207005` (Wave-0 confirms) |
| Ledger `('1084','henderson_city_council')` | `('1093','north_las_vegas_city_council')` |

**Suggested external_id assignment:**
- `-3207001`: Pamela Goynes-Brown (Mayor)
- `-3207002`: Isaac Barron (Ward 1)
- `-3207003`: Ruth Garcia-Anderson (Ward 2)
- `-3207004`: Scott Black (Ward 3)
- `-3207005`: Richard Cherchio (Ward 4)

**Ward member titles:** Arabic numerals matching NLV official naming: `'Council Member, Ward 1'`, `'Council Member, Ward 2'`, `'Council Member, Ward 3'`, `'Council Member, Ward 4'`.

**Pre-flight assertion (loader must run first):**
```sql
IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
    WHERE state = 'nv' AND mtfcc = 'X0017') < 4 THEN
  RAISE EXCEPTION 'Pre-flight FAILED: fewer than 4 X0017 ward geofences found. Run load-north-las-vegas-ward-boundaries.ts first.';
END IF;
```

### Pattern 3: Headshot Pipeline

**Analog:** `_tmp-henderson-council-headshots.py` (Phase 163 — per-member fallback variant).

**SAME WAF SITUATION AS HENDERSON:** `cityofnorthlasvegas.com` is Akamai WAF-403 (blocks all UA including Chrome). Do NOT attempt curl from the official site. Per-member fallback URLs required. The script handles per-member URL + license overrides.

**Confirmed source (Mayor):** Goynes-Brown — Wikimedia Commons, public domain (see §Headshot Sources). Use a descriptive User-Agent (memory note: Wikimedia 429s on browser UA, needs descriptive UA like `ev-essentials-research/1.0 (contact ...)`).

### Pattern 4: Stance Migration CTE (one per official)

**Identical shape to `1086_henderson_romero_stances.sql` through `1090_henderson_stewart_stances.sql`.** Same `JOIN inform.compass_topics ct ON ct.topic_key = s.topic_key AND ct.is_live = true`. NLV city-level topics likely to have evidence (carry-forward from Henderson/LV, adjusted for NLV specifics — water/APEX industrial growth, public safety, homelessness):
- `homelessness` / `homelessness-response` (NLV camping/shelter policy)
- `housing` (NLV affordable housing, residential growth)
- `public-safety-approach` (NLVPD oversight, staffing)
- `transportation-priorities` (I-15 corridor, transit)
- `economic-development` (APEX Industrial Park, Faraday/manufacturing corridor — a defining NLV issue)
- `local-environment` (water, desert climate, APEX air quality)
- `growth-and-development` (NLV historically a fast-growing city)
- `taxes`

### Pattern 5: coverage.js COVERAGE_STATES NV block addition

**What:** Add North Las Vegas to the existing Nevada block (LV + Henderson already present from Phases 162/163).

**Expected current state (after Phase 163):**
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

**After Phase 164 edit:**
```javascript
{
  name: 'Nevada', abbrev: 'NV',
  areas: [
    { label: 'Las Vegas', browseGovernmentList: ['3240000'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'Henderson', browseGovernmentList: ['3231900'], browseStateAbbrev: 'NV', hasContext: true },
    { label: 'North Las Vegas', browseGovernmentList: ['3251800'], browseStateAbbrev: 'NV', hasContext: true },
  ],
},
```

**Wave-0 must read coverage.js to confirm the exact current NV block** (line numbers shift; Phase 163 appended Henderson). Browse verification link after edit: `essentials.empowered.vote/results?browse_geo_id=3251800&browse_mtfcc=G4110`

### Anti-Patterns to Avoid

- **All Phase 162/163 anti-patterns apply** — uppercase `d.state='NV'` (silent no-op), hardcoding the auto-generated path column, using the removed image-origin column, rotational mayor model, defaulting stances.
- **Missing `where=PLACE=80` in the ward query** — without it the layer returns all 3 cities' wards plus 125 precinct fragments. The `EXPECTED_COUNT=4` assertion would fail (or worse, ingest wrong-city polygons).
- **Using Roman numerals for NLV ward titles** — NLV uses Arabic numerals (Ward 1–4). Henderson used Roman; do NOT carry that over.
- **Assuming a WAF workaround exists for cityofnorthlasvegas.com** — it is Akamai WAF-403 (verified `Server: AkamaiGHost`, 403 on Chrome-UA). Go directly to fallbacks.
- **Treating Scott Black (Ward 3) as vacant/lame-duck** — Black advanced to the Nov 2026 mayoral runoff but **remains the seated Ward 3 councilman until then**. Seed `is_active=true, is_incumbent=true` (the Carrie Cox parallel from Henderson).
- **Treating Garcia-Anderson as appointed** — she was appointed Dec 2022 but **won a full term Nov 2024** (by 9 votes). Seed `is_appointed=false` (she is now elected).
- **Dropping the accent on "Barrón"** — the GIS NAME field and official records use "Isaac E. Barrón" (accented). The DB stores the accented form; search normalization (memory `project_unicode_search_normalization`) handles accent-insensitive lookup. Store `full_name='Isaac Barron'` or `'Isaac E. Barrón'` per operator preference, but be consistent — recommend the accented official form for the display name.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ward polygon fetching + DB insert | Custom fetch-and-insert from scratch | Adapt `load-henderson-ward-boundaries.ts` | Handles ON CONFLICT, ST_Multi, ST_MakeValid, error logging, dry-run; tested in Phases 162/163 |
| Headshot crop + resize | Manual PIL operations | Copy `_tmp-henderson-council-headshots.py` | Correct pipeline: crop FIRST then resize; `optimize=True` strips EXIF; per-member fallback dict |
| Stance CTE shape | New schema inference | Copy a Phase 163 stance migration exactly | Topic_id join via `is_live=true`; ON CONFLICT idempotency |
| Government INSERT guard | Unique constraint assumption | `WHERE NOT EXISTS (... WHERE name=...)` | `essentials.governments` has NO unique constraint on geo_id or name |
| Ward boundary data source | Scraping cityofnorthlasvegas.com (WAF-403) | Clark County GISMO `PoliticalBoundaries/MapServer/5` `PLACE=80` | County GISMO is the canonical regional source; not WAF-blocked; clean polygons |
| district_type routing | Assuming G4110 alone routes ward members | Explicit LOCAL district per ward with matching geo_id | Backend joins `geofence_boundaries.geo_id = districts.geo_id`; ward members need per-ward LOCAL districts |

**Key insight:** X0017 (like X0015/X0016) is caught by the `X%` catchall in `essentialsService.ts` line 646 automatically — no backend code change needed.

---

## Key Verified Facts

### North Las Vegas Government Structure
[VERIFIED: Clark County GISMO Ward-layer attributes (live query 2026-06-28), Ballotpedia, Nevada Current, Wikipedia 2026 mayoral election article, search results]

**Form of government:** Mayor + 4 ward-elected council members. 5 total seats. Mayor-council form.

**Election mechanic:** NLV elects council members **purely by ward** — each council member is voted on **only by the registered voters of their own ward** (distinct from Henderson/LV's citywide-with-ward-residency model). The Mayor is elected citywide at-large. Ward-precise routing is the correct goal and aligns 1:1 with each resident's single ward representative.

**Mayor:** Pamela Goynes-Brown, directly elected at-large in 2022 (assumed office Dec 1, 2022; first Black mayor in Nevada history; previously Ward 2 councilwoman). **Term-limited / ineligible to run for re-election in 2026** — her term ends Nov 30, 2026. She remains the seated Mayor until then. NOT rotational.

**Current roster (as of 2026-06-28):**

| Seat | Name | Title | Status notes |
|------|------|-------|--------------|
| At-large | Pamela Goynes-Brown | Mayor | Elected 2022; ineligible for 2026 re-election; seated until Nov 30 2026. `is_active=true, is_incumbent=true` |
| Ward 1 | Isaac E. Barrón | Council Member, Ward 1 | In office since 2013; re-elected 2017, 2022. `is_appointed=false, is_incumbent=true` |
| Ward 2 | Ruth Garcia-Anderson | Council Member, Ward 2 | Appointed Dec 2022 (succeeding Goynes-Brown); **won full term Nov 2024** (by 9 votes). `is_appointed=false, is_incumbent=true` |
| Ward 3 | Scott Black | Council Member, Ward 3 | In office since 2017 (defeated incumbent 2019); **advanced to Nov 2026 mayoral runoff** but remains seated Ward 3 councilman. `is_active=true, is_incumbent=true` |
| Ward 4 | Richard Cherchio | Council Member, Ward 4 | In office since 2015; re-elected (unopposed) 2024. `is_appointed=false, is_incumbent=true` |

### North Las Vegas City geo_id (TIGER G4110 Place)
[VERIFIED: Phase 158-02-SUMMARY.md + 158-VERIFICATION.md check 7]

**geo_id = `3251800`** (TIGER Place FIPS for City of North Las Vegas, NV)

Confirmed: Phase 158 smoke test returned `North Las Vegas city | 3251800 | 32003 | CD4 | SD2 | AD11`. NLV listed among the 4 target G4110 cities verified present.

**geofence_boundaries.state for G4110:** TIGER loader writes `state='32'` (FIPS string) for G4110 place boundaries. The `districts` row for the LOCAL_EXEC Mayor district uses `state='nv'` (lowercase — LOCAL-tier convention). Same split as LV/Henderson. **Wave-0 must confirm the exact casing of the loaded NLV G4110 row** (`SELECT geo_id, state FROM essentials.geofence_boundaries WHERE name ILIKE '%North Las Vegas%' AND mtfcc='G4110'`).

### Ward Geofence Source
[VERIFIED: Live query 2026-06-28 — count=4 confirmed for PLACE=80, all 4 ward attributes returned matching live roster, WGS84 coordinates ~-115° lon / ~36° lat]

**Source:** Clark County GISMO ArcGIS REST MapServer (county-owned regional GIS; no authentication required; NOT WAF-blocked)
**Service:** `maps.clarkcountynv.gov/arcgis/rest/services/OpenData/PoliticalBoundaries/MapServer`
**Layer:** Layer 5 — "Ward" (holds all 3 valley cities' council wards keyed by `PLACE`)
**Full endpoint:**
```
https://maps.clarkcountynv.gov/arcgis/rest/services/OpenData/PoliticalBoundaries/MapServer/5/query
  ?where=PLACE%3D80&outFields=WARD,NAME,PLACE&returnGeometry=true&f=json&outSR=4326
  &resultOffset=0&resultRecordCount=100
```
**maxRecordCount:** 1000 (well above 4)
**Format:** ArcGIS JSON (rings array). Convert via `arcgisRingsToGeoJson()`.

**`PLACE` code key (confirmed):** 60 = Henderson, 65 = Las Vegas, **80 = North Las Vegas**. (Cross-check: PLACE=60 wards exactly match Phase 163 Henderson roster; PLACE=65 exactly match Phase 162 LV roster — strong confirmation the layer is authoritative and current.)

**Feature attribute schema:**
- `WARD`: SmallInteger 1–4 (already an integer)
- `NAME`: string `"N - <Councilmember Name>"` (e.g., `"1 - Isaac E. Barrón"`) — informational; use `Ward ${WARD}` for the geofence display name
- `PLACE`: SmallInteger jurisdiction code (filter on this)
- `Shape.STArea()`, `Shape.STLength()`: projected-CRS metrics (not WGS84)

**License:** Clark County GISMO open data (county government GIS) — consistent with US government open data convention. [ASSUMED: no explicit license string on the layer; matches LV/Henderson GIS precedent]

### Headshot Sources
[VERIFIED where noted via curl/Wikimedia API 2026-06-28; council-member fallbacks ASSUMED pending Wave-0 verification]

**Primary source (cityofnorthlasvegas.com): BLOCKED.** Akamai WAF-403 (`Server: AkamaiGHost`) on all pages including Chrome UA — verified 2026-06-28. Identical to Henderson. No Azure-blob direct-serve equivalent like LV.

**Fallback chain per member:**

| Member | Best Available Source | URL / Pattern | Status |
|--------|----------------------|---------------|--------|
| Pamela Goynes-Brown (Mayor) | **Wikimedia Commons** | `https://upload.wikimedia.org/wikipedia/commons/5/51/Pamela_Goynes-Brown.jpg` | [VERIFIED: Commons API 2026-06-28; 476×750... actually 476×635; **Public domain** (Sen. Rosen office photo, author "Jacky Rosen")] |
| Isaac E. Barrón (W-1) | Ballotpedia `Isaac_E._Barron`; campaign; news media | No clean direct URL confirmed | [ASSUMED: requires Wave-0 sourcing] |
| Ruth Garcia-Anderson (W-2) | Ballotpedia `Ruth_Garcia-Anderson`; news | No clean direct URL confirmed | [ASSUMED: requires Wave-0 sourcing] |
| Scott Black (W-3) | Ballotpedia; campaign (mayoral run → may have a fresh campaign portrait); news | No clean direct URL confirmed | [ASSUMED: requires Wave-0 sourcing] |
| Richard Cherchio (W-4) | Ballotpedia `Richard_Cherchio`; news | No clean direct URL confirmed | [ASSUMED: requires Wave-0 sourcing] |

**photo_license guidance:** Goynes-Brown Wikimedia = `public_domain`. Ballotpedia/campaign/news photos = treat as `press_use` unless a verified government source is found. Operator sets final `photo_license` at execution per actual source.

**Gap expectation:** 4 of 5 members require deeper fallback research at execution (same as Henderson, where 3 of 5 needed it). Document honest gaps; the headshot script must emit a `FAILED` manifest line for any member with no source, never a fabricated image. Note Scott Black, as an active mayoral candidate, likely has the most readily available current campaign portrait.

### Custom MTFCC Registry
[VERIFIED: Grep of all migrations in C:/EV-Accounts/backend/migrations/ on 2026-06-28]

| MTFCC | Claimed by | Use |
|-------|-----------|-----|
| X0001–X0004 | Various (built-in; excluded from X% catchall) | Council districts, built-in |
| X0013 | Boston MA (mig 347) | Boston council districts |
| X0014 | MA cities (migs 711, 712) | MA ward boundaries |
| X0015 | Phase 162 — LV | Las Vegas NV ward boundaries (6 wards) |
| X0016 | Phase 163 — Henderson | Henderson NV ward boundaries (4 wards) |
| **X0017** | **Phase 164 proposed** | **North Las Vegas NV ward boundaries (4 wards)** |

Grep confirms no migration references `X0017` or `X0018` as a claim (only a comment in `246_multnomah_cities_government.sql` mentioning the range "X0013-X0018 NOT needed" — not a claim). **Wave-0 probe:** `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0017'` — expect 0.

### External_id Collision Analysis
[VERIFIED: ranges from Phase 161/162/163 artifacts + migration grep; `-3207xxx` confirmed unclaimed by grep (no hits beyond coincidental URL fragments)]

**In use (must not collide):**
- US House: `-32001` .. `-32004`
- STATE_EXEC: `-3200001` .. `-3200006`
- Senate: `-3203001` .. `-3203021`
- Assembly: `-3204001` .. `-3204042`
- Clark County commissioners: `-3200301` .. `-3200307`
- LV City Council: `-3205001` .. `-3205007`
- Henderson City Council: `-3206001` .. `-3206005`
- US Senators: `-400057`, `-400058`

**Proposed block for NLV City Council (5 seats):** `-3207001` .. `-3207005` — extends the LV/Henderson convention by incrementing the thousandths digit. No collision with any known NV range. **Wave-0 probe:** `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3207005 AND -3207001` = 0.

### Migration Counter — DRIFT MATERIALIZED
[VERIFIED: `ls C:/EV-Accounts/backend/migrations/ | grep -oE '^[0-9]+' | sort -n | tail` = ...1090, 1091, 1092 on 2026-06-28]

**On-disk MAX = `1092`.** Files present beyond Henderson's 1090:
- `1091_seed_ca_2026_house_candidates.sql` (Phase 149 — CA 2026 US House general candidates)
- `1092_phase149_dedup_redistricted_incumbents.sql` (Phase 149 corrective dedup)

**Next structural migration = `1093`.** This is exactly the drift the CONTEXT warned about: the Henderson 163-03 summary said "next: 1091," but Phase 149 work landed 1091/1092 in the interim. **Trust the on-disk MAX +1, not the stale note.** Wave-0 must re-run `ls .../migrations/ | grep -oE '^[0-9]+' | sort -n | tail -1` immediately before execution — more may land.

Ledger note: only the structural migration registers in `supabase_migrations.schema_migrations`. The on-disk MAX (1092) is well above the registered ledger MAX. **The on-disk file number is the authority for the next migration number** — not `SELECT MAX(version) FROM schema_migrations`.

---

## Common Pitfalls

### Pitfall 1: Migration Counter Drift (1093, not 1091) — PHASE-SPECIFIC, HIGH PRIORITY
**What goes wrong:** CONTEXT and the Henderson summary say "next migration is 1091." Using 1091 collides with the existing `1091_seed_ca_2026_house_candidates.sql` (Phase 149).
**Why it happens:** Phase 149 work (1091, 1092) landed on disk after the Henderson phase closed but before NLV execution. The registered ledger doesn't reflect these.
**How to avoid:** Use **1093** as the structural migration. Wave-0 re-confirms on-disk MAX with `ls .../migrations | grep -oE '^[0-9]+' | sort -n | tail -1`. Number subsequent audit-only migrations sequentially from there (1094 headshots, 1095–1099 stances).
**Warning signs:** A file named `1091_*` or `1092_*` already exists; `psql -f` on a duplicate number would create a confusing on-disk collision.

### Pitfall 2: Missing `where=PLACE=80` in the ward query — PHASE-SPECIFIC
**What goes wrong:** Querying the Clark County "Ward" layer without `PLACE=80` returns 139 features (all 3 cities + 125 precinct fragments with WARD=0). The loader ingests wrong-city or junk polygons.
**Why it happens:** Unlike Henderson's city-specific MapServer, this is a shared regional layer keyed by `PLACE`.
**How to avoid:** Always filter `where=PLACE%3D80`. The `EXPECTED_COUNT=4` assertion catches a wrong count, but the filter is the real safeguard.
**Warning signs:** Loader reports far more than 4 features, or ward names from Henderson/LV appear.

### Pitfall 3: Akamai WAF on cityofnorthlasvegas.com — PHASE-SPECIFIC
**What goes wrong:** Attempting to curl headshots from cityofnorthlasvegas.com (any UA) returns 403.
**Why it happens:** NLV uses Akamai GHost WAF (same as Henderson).
**How to avoid:** Skip the official site entirely for headshots. Goynes-Brown → Wikimedia Commons (public domain, confirmed). The 4 council members → Ballotpedia/campaign/news fallbacks. Emit FAILED for genuine gaps.
**Warning signs:** `curl -I cityofnorthlasvegas.com/*` returns `Server: AkamaiGHost` with 403 (already confirmed).

### Pitfall 4: Scott Black (Ward 3) — seated incumbent despite mayoral run
**What goes wrong:** Mis-seeding Black as vacant/lame-duck because he's running for Mayor.
**Why it happens:** Black advanced to the Nov 2026 mayoral runoff (vs. Monroe-Moreno).
**How to avoid:** Seed Black `is_active=true, is_incumbent=true` for Ward 3 — he remains the seated councilman until the Nov 2026 outcome and inauguration. (Direct parallel to Henderson's Carrie Cox.)
**Warning signs:** Ward 3 seat shown vacant in browse UI.

### Pitfall 5: Garcia-Anderson appointment status
**What goes wrong:** Seeding Garcia-Anderson `is_appointed=true` based on her Dec 2022 appointment.
**Why it happens:** She was originally appointed.
**How to avoid:** She **won a full term Nov 2024** — seed `is_appointed=false, is_incumbent=true`.
**Warning signs:** Profile shows "appointed" status when she is now elected.

### Pitfall 6: Arabic vs. Roman numerals in ward titles — PHASE-SPECIFIC
**What goes wrong:** Carrying over Henderson's Roman numerals (`Ward I`–`IV`) to NLV.
**Why it happens:** Henderson was the immediately-prior template and used Roman numerals.
**How to avoid:** NLV uses **Arabic numerals** (Ward 1–4). Titles: `'Council Member, Ward 1'`..`'Council Member, Ward 4'`. Geo_id slugs also use Arabic (`north-las-vegas-nv-council-ward-1..4`).
**Warning signs:** Office titles show "Ward I" for NLV.

### Pitfall 7: Accented name "Barrón"
**What goes wrong:** Storing/searching "Barron" vs. "Barrón" inconsistently; search fails to find the accented name.
**Why it happens:** GIS NAME field uses "Isaac E. Barrón" (accented); casual references drop the accent.
**How to avoid:** Store the official accented display name; rely on the project's unicode search normalization (memory `project_unicode_search_normalization`) for accent-insensitive lookup. Be consistent between `full_name`, `first_name`, `last_name`.
**Warning signs:** Address probe returns Ward 1 but the name renders without accent, or search for "Barron" fails.

### Pitfall 8: All Phase-162/163 SQL pitfalls still apply
- **Multi-ring ward handling (Wards 1 and 2 have 7 rings each):** `ST_Multi(ST_MakeValid(...))`; assert `ST_IsValid=true`.
- **Two district types in one migration (LOCAL_EXEC + LOCAL):** Mayor on LOCAL_EXEC; ward members on LOCAL. Post-verify 1 LOCAL_EXEC + 4 LOCAL.
- **Lowercase `state='nv'`** for district WHERE clauses; uppercase `'NV'` for governments / offices.representing_state.
- **Grep-gate forbidden tokens in .sql comments:** paraphrase the auto-generated path column ("slug"), the removed image-origin column ("photo_origin_url"); keep `schema_migrations` only in the actual ledger INSERT.

---

## Code Examples

### NLV Ward Boundary Loader — Key Constants Diff

```typescript
// Source: load-henderson-ward-boundaries.ts (direct adaptation)
const NLV_WARD_URL =
  'https://maps.clarkcountynv.gov/arcgis/rest/services/OpenData/' +
  'PoliticalBoundaries/MapServer/5/query' +
  '?where=PLACE%3D80&outFields=WARD,NAME,PLACE' +
  '&returnGeometry=true&f=json&outSR=4326' +
  '&resultOffset=0&resultRecordCount=100';
  // CRITICAL: where=PLACE=80 — layer holds all 3 valley cities' wards
  // CRITICAL: outSR=4326 — county MapServer default CRS is projected

const MTFCC          = 'X0017';
const STATE_CODE     = 'nv';
const SOURCE         = 'clarkcountynv.gov-gismo-politicalboundaries-ward-place80-2026';
const GEO_ID_PREFIX  = 'north-las-vegas-nv-council-ward-';
const EXPECTED_COUNT = 4;

// WARD is esriFieldTypeSmallInteger (already int); parseInt(String(...)) safe:
const rawWard = attrs['WARD'];
const ward = parseInt(String(rawWard ?? ''), 10);
const wardName = `Ward ${ward}`;   // Arabic numerals — NLV convention
// arcgisRingsToGeoJson / fetchJson / INSERT / ST_MakeValid copy verbatim from Henderson loader
```

### Structural Migration Step 3a — LOCAL_EXEC District for Mayor

```sql
-- Source: 1084_henderson_city_council.sql adapted for NLV
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'nv', '3251800', 'City of North Las Vegas', 'G4110'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '3251800' AND district_type = 'LOCAL_EXEC' AND state = 'nv'
);
-- Uses existing G4110 geofence (geo_id='3251800') loaded by Phase 158
-- state='nv' LOWERCASE (routing join key) — uppercase matches ZERO rows
```

### Structural Migration Step 3b — LOCAL Districts for Ward Members

```sql
-- Ward 1 — repeat for wards 2-4 with geo_id='north-las-vegas-nv-council-ward-2/3/4'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'nv', 'north-las-vegas-nv-council-ward-1', 'Ward 1', 'X0017'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'north-las-vegas-nv-council-ward-1' AND district_type = 'LOCAL' AND state = 'nv'
);
-- label = 'Ward 1' (Arabic numeral — NLV official naming)
```

### Mayor Politician + Office CTE

```sql
-- Source: 1084 BLOCK 1, adapted for NLV
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Pamela Goynes-Brown', 'Pamela', 'Goynes-Brown', 'Non-Partisan',
          true, false, false, true, -3207001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'North Las Vegas City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of North Las Vegas, Nevada, US')),
       p.id,
       'Mayor', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '3251800'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- CRITICAL: district_type='LOCAL_EXEC' (NOT 'LOCAL') for the Mayor
```

### Ward Member CTE (Ward 1 — Isaac Barrón)

```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Isaac E. Barrón', 'Isaac', 'Barrón', 'Non-Partisan',
          true, false, false, true, -3207002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'North Las Vegas City Council'
          AND government_id = (SELECT id FROM essentials.governments
                               WHERE name = 'City of North Las Vegas, Nevada, US')),
       p.id,
       'Council Member, Ward 1', 'NV', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'north-las-vegas-nv-council-ward-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'nv'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
-- Repeat BLOCK 3-5 for Garcia-Anderson/Black/Cherchio with ext_ids -3207003..-3207005
-- Garcia-Anderson (W-2): is_appointed=false (won full term Nov 2024)
-- Black (W-3): is_active=true, is_incumbent=true (seated despite Nov 2026 mayoral runoff)
-- Cherchio (W-4): is_appointed=false, is_incumbent=true (re-elected 2024)
-- Title uses Arabic numeral 'Ward 1' (NOT 'Ward I')
```

### Post-Verify DO Block (5 offices: 1 LOCAL_EXEC + 4 LOCAL)

```sql
DO $$
DECLARE
  v_gov_count INTEGER; v_exec_count INTEGER; v_local_count INTEGER; v_split_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'City of North Las Vegas, Nevada, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'Post-verify FAILED: expected 1 NLV gov row, found %', v_gov_count;
  END IF;

  SELECT COUNT(*) INTO v_exec_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '3251800' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'nv';
  IF v_exec_count <> 1 THEN
    RAISE EXCEPTION 'Post-verify FAILED: expected 1 LOCAL_EXEC office (Mayor), found %', v_exec_count;
  END IF;

  SELECT COUNT(*) INTO v_local_count
  FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.mtfcc = 'X0017' AND d.district_type = 'LOCAL' AND d.state = 'nv';
  IF v_local_count <> 4 THEN
    RAISE EXCEPTION 'Post-verify FAILED: expected 4 LOCAL ward offices, found %', v_local_count;
  END IF;

  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.state = 'nv' AND gb.mtfcc = 'X0017'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'LOCAL' AND d.state = 'nv'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'Post-verify FAILED: section-split detector returned % orphan ward rows', v_split_count;
  END IF;

  RAISE NOTICE 'Post-verify PASSED: gov=%, exec=%, local=%, split=%',
    v_gov_count, v_exec_count, v_local_count, v_split_count;
END $$;
```

### Migration Ledger (OUTSIDE the transaction; structural only)

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1093', 'north_las_vegas_city_council')
ON CONFLICT (version) DO NOTHING;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 163 used Henderson's own city ArcGIS (X0016, 4 wards) | Phase 164 uses the **Clark County GISMO regional Ward layer** (X0017, PLACE=80) | Phase 164 | A single county source serves all valley cities' wards — Boulder City (Phase 165), if it has wards, could query the same layer; but Boulder City is likely pure at-large (single-city model) |
| cityofhenderson.com WAF-403 | cityofnorthlasvegas.com also Akamai WAF-403 | Phase 164 | Confirms the NV-city WAF pattern; headshot fallback chain is the standing approach for NV cities |
| "next migration = 1091" (Henderson notes) | **next migration = 1093** (Phase 149 landed 1091/1092) | Phase 149 interim work | Reinforces the on-disk-MAX-is-authority rule; always re-probe at Wave-0 |

**Pattern established by this phase:** The Clark County GISMO `PoliticalBoundaries/MapServer/5` `PLACE=N` query is the canonical, non-WAF source for any incorporated Clark County city's council wards.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Ward polygon license is open government data (no explicit license string on the GISMO layer) | Ward Geofence Source | Low: county GIS open-data convention; matches LV/Henderson precedent |
| A2 | External_id range `-3207001..-3207005` has no existing DB rows | External_id Analysis | High: collision causes duplicate/silent no-op; Wave-0 probe required |
| A3 | X0017 has no existing geofence_boundaries rows | MTFCC Registry | Medium: if claimed, pick X0018; Wave-0 probe required |
| A4 | On-disk migration MAX = 1092 (next = 1093) at execution time | Migration Counter | Medium: more migrations may land before execution; Wave-0 re-probe mandatory |
| A5 | Scott Black remains seated Ward 3 councilman through the Nov 2026 mayoral runoff outcome | Roster | Low: standard civic practice — incumbents serve until successor sworn in |
| A6 | All 5 officials party='Non-Partisan' (NLV races nonpartisan) | Code Examples | Low: party stored but never displayed (antipartisan design); no UI impact |
| A7 | The 4 council-member fallback headshots exist and are usable (no overlays) | Headshot Sources | Medium: verify at execution; reject overlays; document genuine gap if none |
| A8 | Clark County GISMO MapServer remains accessible during execution | Environment Availability | Low-medium: confirmed 200 OK during research; county-operated; fallback = D-01b |
| A9 | `where=PLACE=80` returns all 4 NLV wards in one response | Ward Geofence Source | Low: count=4 confirmed; maxRecordCount=1000 |
| A10 | NLV G4110 geofence row uses `state='32'` (FIPS) like LV/Henderson | NLV City geo_id | Low: TIGER loader convention; Wave-0 confirms exact casing |

**Confirmed facts needing no user validation:** geo_id=3251800 (Phase 158), roster names + ward assignments (GISMO NAME attributes + Ballotpedia/news cross-check), Mayor = Goynes-Brown (term-limited, seated through Nov 2026), ward count = 4, by-ward election mechanic, X0015=LV / X0016=Henderson (X0017 next), on-disk migration MAX = 1092 (next = 1093), Goynes-Brown headshot = Wikimedia public domain.

---

## Open Questions

1. **Council-member headshot sources (Barrón, Garcia-Anderson, Black, Cherchio)**
   - What we know: official site WAF-403; Goynes-Brown has a confirmed Wikimedia public-domain photo; the 4 council members do not (Wikimedia search returned no usable files).
   - What's unclear: whether Ballotpedia, campaign sites, or news media serve clean portrait-style headshots without overlays.
   - Recommendation: Wave-0 operator task — visit each Ballotpedia page (`Isaac_E._Barron`, `Ruth_Garcia-Anderson`, `Richard_Cherchio`), Scott Black's mayoral campaign site, and recent LVRJ/Nevada Current/8NewsNow article thumbnails. Treat a genuine gap as documented, not a blocker. Scott Black (active mayoral candidate) is most likely to have a fresh campaign portrait.

2. **Migration number at execution**
   - What we know: on-disk MAX = 1092 on 2026-06-28; next = 1093.
   - What's unclear: whether more migrations land before NLV execution (Phase 149 already drifted +2 past Henderson's note).
   - Recommendation: Wave-0 re-run `ls .../migrations | grep -oE '^[0-9]+' | sort -n | tail -1` immediately before writing the structural migration. Number from there.

3. **NLV full_name accent handling**
   - What we know: official records and the GISMO layer use "Isaac E. Barrón" (accented).
   - What's unclear: operator preference for the stored display form.
   - Recommendation: store the accented official form; the project's unicode normalization handles accent-insensitive search. Be internally consistent across full_name/first_name/last_name.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Clark County GISMO MapServer (`maps.clarkcountynv.gov`) | Ward polygon loader | ✓ (verified 2026-06-28, 4 PLACE=80 features in WGS84) | ArcGIS 10.91 | D-01b single-city fallback |
| `cityofnorthlasvegas.com` council pages | Primary headshot source | ✗ (Akamai WAF-403, Chrome UA also blocked) | — | Wikimedia + Ballotpedia + campaign + news |
| Wikimedia Commons (`upload.wikimedia.org`) | Goynes-Brown headshot | ✓ (file confirmed, public domain; use descriptive UA) | — | Ballotpedia/news |
| psql CLI | Migration apply | ✓ (all prior NV phases) | — | — |
| Python + Pillow + psycopg2 + requests | Headshot pipeline | ✓ (Phases 161–163) | — | — |
| Node.js + tsx + pg | Ward boundary loader | ✓ (Phases 158–163) | — | — |

**Missing dependencies with no fallback:** None that block the phase.

**Missing dependencies with fallback:**
- `cityofnorthlasvegas.com` (WAF-403) → Wikimedia (Mayor) + Ballotpedia/campaign/news (4 council members)
- Clark County GISMO becomes unavailable → D-01b (all council members on city G4110 geofence `3251800`)

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript smoke scripts via `npx tsx` + inline SQL gates (`psql -f`) |
| Config file | None (ad-hoc scripts — project convention for deep-seeds) |
| Quick run command | `npx tsx scripts/smoke-nv-geofences.ts` (existing; extend with an NLV ward routing point) |
| Full suite command | Inline 9-check SQL/HTTP verification (analog to Phase 163 Plan 03) |
| Estimated runtime | ~30 seconds |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLARK-04 SC#1 | NLV address returns Mayor + correct ward council member | smoke / integration | Post-apply address probe via `npx tsx` (extend `smoke-nv-geofences.ts` with an NLV ward interior point per ward) | ❌ Wave 0 |
| CLARK-04 SC#1 | 4 X0017 ward polygons loaded + ST_IsValid | SQL gate | `SELECT COUNT(*), bool_and(public.ST_IsValid(geometry)) FROM essentials.geofence_boundaries WHERE mtfcc='X0017'` = (4, true) | ❌ Wave 0 inline |
| CLARK-04 SC#2 | 5 officials have 600×750 headshots | SQL gate | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -3207005 AND -3207001` = 5 (genuine gaps documented) | ❌ Wave 0 inline |
| CLARK-04 SC#3 | Evidence-only stances render (no defaults) | SQL gate | `SELECT COUNT(*) FROM inform.politician_answers pa JOIN essentials.politicians p ON pa.politician_id=p.id WHERE p.external_id BETWEEN -3207005 AND -3207001` ≥ 1; every answer has a paired non-null context row; 0 defaults | ❌ Wave 0 inline |
| CLARK-04 SC#4 | North Las Vegas in coverage.js with hasContext:true | manual | Inspect `src/lib/coverage.js` NV block + browse `?browse_geo_id=3251800&browse_mtfcc=G4110` | ❌ Wave 0 manual |
| — | No section-split after seed | SQL gate | Section-split scan = 0 orphan X0017 rows | ❌ Wave 0 inline |
| — | Ward-precise routing (each ward interior point → exactly 1 ward member + Mayor) | SQL/HTTP gate | Per-ward interior-point ST_Covers check = 1 X0017 ward each + city G4110 | ❌ Wave 0 inline |

### Sampling Rate

- After every task commit: inline SQL count for that task
- After every plan wave: `smoke-nv-geofences.ts` + inline SQL counts
- Before sign-off: full 9-check E2E green + human-verify checkpoint (address routing + correct-person)
- Max feedback latency: ~30 seconds

### Wave 0 Gaps

- [ ] `scripts/load-north-las-vegas-ward-boundaries.ts` — loads 4 X0017 ward polygons from Clark County GISMO `PoliticalBoundaries/MapServer/5` `where=PLACE=80` (new file; adapt `load-henderson-ward-boundaries.ts`)
- [ ] Wave-0 DB/disk probes: on-disk migration MAX (`ls .../migrations | grep -oE '^[0-9]+' | sort -n | tail -1` → expect 1092, next=1093); external_id collision (`SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -3207005 AND -3207001` → 0); X0017 existence (`SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0017'` → 0); NLV G4110 geo_id casing (`SELECT geo_id, state FROM essentials.geofence_boundaries WHERE name ILIKE '%North Las Vegas%' AND mtfcc='G4110'` → 3251800, state='32'); current coverage.js NV block (read to confirm Henderson present, append NLV)
- [ ] Wave-0 headshot sourcing: per-member fallback URLs for Barrón, Garcia-Anderson, Black, Cherchio (Goynes-Brown already confirmed via Wikimedia)

---

## Security Domain

Checked. This phase performs no authentication, no public API endpoints, no user-facing input validation, no cryptography, and no secrets beyond the existing DATABASE_URL / service-role key in the backend `.env`. All operations are operator-initiated SQL migrations and scripts. No ASVS categories applicable.

---

## Sources

### Primary (HIGH confidence)

- Phase 158-02-SUMMARY.md / 158-VERIFICATION.md — NLV geo_id=3251800 (G4110 place, present), NV TIGER casing convention
- Phase 163 RESEARCH.md / PATTERNS.md / 163-03-SUMMARY.md — Henderson ward loader, structural migration shape, headshot fallback pipeline, stance CTE, 9-check E2E template (direct template)
- Phase 162 (LV) artifacts — original ward loader + standalone-government migration
- Phase 161-PATTERNS.md — standalone government template, NV external_id scheme
- `maps.clarkcountynv.gov/arcgis/rest/services/OpenData/PoliticalBoundaries/MapServer/5/query?where=PLACE=80&outSR=4326` — live ArcGIS NLV ward boundary endpoint (4 features confirmed WGS84, roster-matching attributes; verified 2026-06-28)
- Clark County GISMO services root + PoliticalBoundaries layer metadata — confirmed Layer 5 = "Ward", maxRecordCount=1000, PLACE key (60/65/80)
- `ls C:/EV-Accounts/backend/migrations/` — on-disk MAX = 1092 (1091/1092 = Phase 149); confirmed 2026-06-28
- Grep of migrations — X0015=LV, X0016=Henderson, X0017/X0018 unclaimed; `-3207xxx` unclaimed
- Wikimedia Commons API — `File:Pamela Goynes-Brown.jpg`, 476×635, public domain (verified 2026-06-28)
- `curl -I https://www.cityofnorthlasvegas.com/...` — Akamai WAF-403 confirmed (`Server: AkamaiGHost`)

### Secondary (MEDIUM confidence)

- Ballotpedia "North Las Vegas, Nevada" + per-member pages — roster (Goynes-Brown, Barrón W1, Garcia-Anderson W2, Black W3, Cherchio W4), terms, by-ward election mechanic
- Wikipedia "2026 North Las Vegas mayoral election" — Goynes-Brown ineligible for re-election; Scott Black + Monroe-Moreno advanced to Nov 2026 runoff
- Nevada Current / Las Vegas Sun / 8NewsNow / Hoodline — Garcia-Anderson won full term Nov 2024 (by 9 votes); Cherchio re-elected unopposed 2024; Dec 4 2024 oath-of-office ceremony
- Cross-check: GISMO Ward layer PLACE=60 wards exactly match Phase 163 Henderson roster, PLACE=65 match Phase 162 LV roster — confirms the layer is authoritative and current

### Tertiary (LOW confidence)

- Ward polygon license assumed open government data (no explicit license string on the GISMO layer) [ASSUMED — A1]
- Council-member fallback headshot URLs (Barrón, Garcia-Anderson, Black, Cherchio) not yet confirmed [ASSUMED — A7]
- party='Non-Partisan' for all 5 (NLV races nonpartisan; no DB impact given antipartisan display) [ASSUMED — A6]

---

## Metadata

**Confidence breakdown:**
- Roster: HIGH — GISMO NAME attributes + Ballotpedia/news cross-check, all 5 confirmed with ward assignments and status nuances (Black mayoral run, Garcia-Anderson elected, Goynes-Brown term-limited)
- Ward count / structure: HIGH — 4 wards confirmed; by-ward election mechanic confirmed; Mayor directly elected at-large
- Ward polygon source: HIGH — live endpoint verified, exactly 4 PLACE=80 features in WGS84 matching roster
- geo_id: HIGH — Phase 158 confirmed `3251800`
- Headshots: MEDIUM — Mayor confirmed (Wikimedia public domain); 4 council members require Wave-0 fallback sourcing (same as Henderson)
- Migration shape: HIGH — direct analog from Phase 163 (which is itself an exact analog of Phase 162)
- External_id block: MEDIUM-HIGH — grep confirms `-3207xxx` unclaimed; Wave-0 probe confirms
- X0017 availability: MEDIUM-HIGH — grep confirms unclaimed; Wave-0 probe confirms
- Migration counter: HIGH — on-disk MAX=1092 confirmed by live `ls`; next=1093 (drift from the 1091 note documented)

**Research date:** 2026-06-28
**Valid until:** 2026-07-28 (stable city government; seated incumbents are correct through the Nov 2026 election; re-probe migration counter immediately before execution as it has already drifted once)
