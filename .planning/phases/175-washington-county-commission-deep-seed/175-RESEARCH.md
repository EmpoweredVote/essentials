# Phase 175: Washington County Commission Deep-Seed - Research

**Researched:** 2026-06-30
**Domain:** County government deep-seed with per-district custom geofences (OR)
**Confidence:** HIGH — canonical migrations read in full; live FeatureServer confirmed; live roster verified; loader mechanism fully documented

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Washington County Chair is directly elected county-wide. Model exactly as Multnomah: a distinct "County Chair" office, `role_canonical` NULL, no separate LOCAL_EXEC, Chair sorts first via groupHierarchy.js. Total = 5 offices.
- **D-02:** Build custom per-district geofences for Districts 1–4 so each WashCo address returns its one matched district commissioner. Mechanism reuses the established `X00xx` ward-geofence ingest (Portland X0012, LV X0015, Henderson X0016, NLV X0017).
- **D-03:** Chair routes county-wide — office links to existing COUNTY district (geo_id 41067, state 'or' lowercase). Chair returns for every WashCo address.
- **D-04:** Net behavior: a WashCo address returns Chair (county-wide) + exactly 1 district commissioner (1 of 4). No section-split; no empty LOCAL section.
- **D-05:** Boundary source = official Washington County GIS (county ArcGIS FeatureServer). Researcher locates the exact downloadable file; planner assigns custom `X00xx` mtfcc + district_type/label/GEOID scheme.
- **D-06:** Researcher ground-truths the live roster AND the exact official body name verbatim from washingtoncountyor.gov at plan time — no hardcoding from memory.
- **D-07:** All live compass topics per official, one agent at a time, evidence-only, 100% cited, no default values, honest blank spokes.
- **D-08:** Headshots from washingtoncountyor.gov commissioner pages; crop 4:5 then resize to 600×750 (Lanczos); mirrored to Storage `politician_photos/{uuid}-headshot.jpg`.

### Claude's Discretion

- External_id range for the 5 officials in OR's negative scheme — Wave-0 DB probe to pick an unused block (Multnomah used -410001 Chair + -410010..-410013; planner picks a non-colliding OR range).
- Next migration number — best estimate 1118 (highest on disk = 1117); confirm DB ledger MAX in Wave-0.
- Custom `X00xx` mtfcc code + district_type for the 4 commission-district geofences — Wave-0 finds the next unused code.
- Whether commissioner offices carry a free-text district label ("Commissioner, District 1"…) — recommended; planner decides.

### Deferred Ideas (OUT OF SCOPE)

- Washington County row officers (Sheriff, DA, Assessor, Clerk, Treasurer).
- Metro regional government (tri-county Metro Council).

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| WASH-01 | Washington County Board of County Commissioners deep-seeded (Chair + commissioners) — government + roster + headshots + evidence-only stances. Standalone county government (not nested under State of Oregon). | Roster verified live (5 members); body name confirmed "Board of County Commissioners"; FeatureServer confirmed as geometry source; migration template (244/1055) documented; per-district geofence mechanism documented; headshot source URL pattern identified; stance schema confirmed. |

</phase_requirements>

---

## Summary

Phase 175 is a county deep-seed with one key novel element: **per-district geofences** for the 4 commissioner districts. Everything else is a direct adaptation of the Multnomah County (migration 244) + Clark County (migration 1055) templates. The government row, chamber, and Chair office are identical in structure to Multnomah. The 4 commissioner offices differ only in that each links to its own custom X00xx district geofence rather than the shared county-wide COUNTY district.

The Washington County GIS team publishes a live ArcGIS FeatureServer (gispub.co.washington.or.us) with the 4 commissioner district polygons, returning valid GeoJSON with geometry in WGS 84. A new TypeScript loader script cloned from `load-lv-ward-boundaries.ts` (or `load-henderson-ward-boundaries.ts`) fetches this FeatureServer, converts ArcGIS JSON rings to GeoJSON Polygon, and inserts rows into `essentials.geofence_boundaries` with a fresh `X00xx` mtfcc. The Chair's office links to the existing `COUNTY` district (geo_id=41067), which the COUNTY routing already handles.

**The roster has active 2026 elections.** As of June 30, 2026, the current seated commissioners are: Chair Kathryn Harrington (retiring, term ends Dec 2026), D1 Nafisa Fai (running for Chair — in November runoff), D2 Pam Treece (running for Chair — in November runoff; Felicita Monteblanco won D2 seat outright in primary, takes office Jan 2027), D3 Jason Snider (not up in 2026), D4 Jerry Willey (retiring, in November runoff). The currently seated incumbents are the correct people to seed now. Roster changes take effect January 2027 — outside this phase's window.

**Primary recommendation:** Clone the LV/Henderson ward loader to fetch from the WashCo FeatureServer (COMMDIST field 1–4), use mtfcc X0018 (next unused after X0017/NLV), insert 4 LOCAL districts, link each district commissioner to its own district. Link the Chair to the existing COUNTY district. Follow migration 244 exactly for the government/chamber/Chair structure; follow migration 1055 for guard patterns.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| County government row / chamber / offices | Database / Storage (Supabase) | — | SQL migration (structural); idempotent guard pattern from migration 244/1055 |
| Chair routing (county-wide) | Database (existing COUNTY district geo_id 41067, G4020) | — | COUNTY geofence already loaded in OR TIGER Phase 72; COUNTY district row created by this phase if absent |
| Commissioner routing (per-district) | Database (4 new X00xx geofences) | CDN/External (WashCo FeatureServer) | Custom geofence loader inserts 4 polygons; structural migration creates 4 LOCAL district rows linking offices |
| Headshot pipeline | Database (politician_images) + Storage | External (media-production.washcotech.net) | Python script crops/resizes; mirrors to Supabase Storage |
| Stance research | Database (inform.politician_answers) | External (web sources) | One research agent at a time; evidence-only; topic_id resolved live via JOIN on topic_key AND is_live=true |
| Surfacing | Frontend (src/lib/coverage.js) | — | Add to COVERAGE_COUNTIES; one-line JS edit |

---

## Standard Stack

No new npm packages for this phase. All dependencies already present in `C:/EV-Accounts/backend`:

| Tool | Version | Purpose | Present |
|------|---------|---------|---------|
| `pg` | existing | DB Pool for loader script | Yes (all prior loaders) |
| `dotenv` | existing | DATABASE_URL from .env | Yes |
| `tsx` | existing | Run TypeScript loader directly | Yes |
| `psql -f` | system | Apply SQL migrations | Yes (executor pattern) |
| Python PIL/Pillow | existing | Headshot crop+resize pipeline | Yes (prior deep-seed phases) |

**Installation:** None required. Confirm `npx tsx --version` and `psql --version` before Wave-0.

---

## Package Legitimacy Audit

> No new packages are introduced in this phase. All dependencies are pre-existing.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Architecture Patterns

### System Architecture Diagram

```
WashCo FeatureServer (gispub.co.washington.or.us)
  |
  | (ArcGIS JSON rings, 4 features, COMMDIST 1-4, outSR=4326)
  v
load-washco-commissioner-boundaries.ts
  | ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(...), 4326))
  | ON CONFLICT (geo_id, mtfcc) DO NOTHING
  v
essentials.geofence_boundaries  (4 rows: X00xx, state='or', geo_id='washco-or-commissioner-district-N')
                                 + existing COUNTY row (G4020, geo_id=41067)
  |
  | (structural migration)
  v
essentials.governments  ('Washington County, Oregon, US')
  |
  v
essentials.chambers  ('Board of County Commissioners')
  |
  v
essentials.districts  [COUNTY, geo_id=41067] ←─── Chair office
                      [LOCAL x4, geo_id=washco-or-commissioner-district-1..4] ←── D1-D4 offices
  |
  v
essentials.offices  (5: County Chair + Commissioner D1-D4)
  |
  v
essentials.politicians  (5: Chair + 4 commissioners)
  |
  v
essentials.politician_images  (5 headshots, audit-only migration)
  |
  v
inform.politician_answers  (stances, one per official per topic, audit-only migrations)
  |
  v
src/lib/coverage.js  COVERAGE_COUNTIES += WashCo entry
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/
├── scripts/
│   └── load-washco-commissioner-boundaries.ts   (NEW — clone of load-henderson-ward-boundaries.ts)
├── migrations/
│   ├── 1118_washco_commission.sql               (structural; registered in ledger)
│   ├── 1119_washco_commission_headshots.sql     (audit-only; NOT registered)
│   ├── 1120_washco_harrington_stances.sql       (audit-only)
│   ├── 1121_washco_fai_stances.sql              (audit-only)
│   ├── 1122_washco_treece_stances.sql           (audit-only)
│   ├── 1123_washco_snider_stances.sql           (audit-only)
│   └── 1124_washco_willey_stances.sql           (audit-only)
```

---

## SECTION A: County Government Seed Pattern (migrations 244 + 1055)

The government row, chamber, Chair office, and district office follow migration 244 exactly, with WashCo values substituted. Key guard patterns:

### Government row (WHERE NOT EXISTS on name — no geo_id unique constraint)

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'Washington County, Oregon, US',
       'County', 'OR', NULL, '41067'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'Washington County, Oregon, US'
);
```

### Chamber row (slug GENERATED ALWAYS — never INSERT slug)

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
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

**NOTE:** The exact body name is "Board of County Commissioners" (confirmed from civicweb.net/portal — the BCC page uses this label). This differs from Multnomah's "Board of Commissioners" (no "County") but matches Clark County's "Board of County Commissioners".

### COUNTY district row (Chair routes here)

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
-- state='or' LOWERCASE — routing join key; 'OR' = silent 0 rows
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'COUNTY', 'or', '41067', 'Washington County', 'G4020'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '41067' AND district_type = 'COUNTY' AND state = 'or'
);
```

**CRITICAL:** Wave-0 must probe whether the COUNTY district row already exists for geo_id=41067 before running the migration. The OR TIGER loader (Phase 72) loaded geofence_boundaries but may or may not have created the essentials.districts COUNTY row. Migration 244 shows that Multnomah created it explicitly here rather than relying on Phase 72. WashCo must do the same (WHERE NOT EXISTS guard is idempotent either way).

### Chair office (exactly like Multnomah — role_canonical NULL, title='County Chair')

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
-- Pattern: WITH ins_p AS (INSERT...RETURNING id) INSERT INTO offices SELECT...
-- Office NOT EXISTS guard key: (district_id, politician_id)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Kathryn Harrington', 'Kathryn', 'Harrington', NULL,
          true, false, false, true, -410100)   -- external_id: Wave-0 to confirm range
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

### District Commissioner offices (each links to its own LOCAL custom district)

```sql
-- Source: Extrapolated from 244/1075/1084 patterns — D1 example
-- Each district commissioner links to geo_id='washco-or-commissioner-district-N'
-- with district_type='LOCAL', mtfcc='X00xx'
WITH ins_p AS (
  INSERT INTO essentials.politicians (...)
  VALUES (..., 'Nafisa Fai', 'Nafisa', 'Fai', NULL, true, false, false, true, -410110)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (...)
SELECT gen_random_uuid(),
       d.id,  -- LOCAL district for District 1
       (SELECT id FROM essentials.chambers WHERE ...),
       p.id,
       'Commissioner, District 1', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'washco-or-commissioner-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o
                  WHERE o.district_id = d.id AND o.politician_id = p.id);
```

### Post-verification DO block (in-migration gates — pattern from 244/1055)

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
DO $$
DECLARE
  v_gov_count INTEGER;
  v_chair_offices INTEGER;
  v_commissioner_offices INTEGER;
  v_split_count INTEGER;
BEGIN
  -- Gate (a): government row
  SELECT COUNT(*) INTO v_gov_count FROM essentials.governments
  WHERE name = 'Washington County, Oregon, US';
  IF v_gov_count <> 1 THEN
    RAISE EXCEPTION 'FAILED: expected 1 WashCo gov row, found %', v_gov_count;
  END IF;

  -- Gate (b): Chair office on COUNTY district = 1
  SELECT COUNT(*) INTO v_chair_offices
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id = '41067' AND d.district_type = 'COUNTY' AND d.state = 'or';
  IF v_chair_offices <> 1 THEN
    RAISE EXCEPTION 'FAILED: expected 1 Chair office on COUNTY district, found %', v_chair_offices;
  END IF;

  -- Gate (c): 4 commissioner offices on LOCAL X00xx districts
  SELECT COUNT(*) INTO v_commissioner_offices
  FROM essentials.offices o
  JOIN essentials.districts d ON d.id = o.district_id
  WHERE d.geo_id LIKE 'washco-or-commissioner-district-%' AND d.state = 'or';
  IF v_commissioner_offices <> 4 THEN
    RAISE EXCEPTION 'FAILED: expected 4 commissioner offices on LOCAL districts, found %', v_commissioner_offices;
  END IF;

  -- Gate (d): section-split scan for COUNTY geofence
  SELECT COUNT(*) INTO v_split_count
  FROM essentials.geofence_boundaries gb
  WHERE gb.geo_id = '41067' AND gb.mtfcc = 'G4020'
    AND NOT EXISTS (
      SELECT 1 FROM essentials.districts d
      WHERE d.geo_id = gb.geo_id AND d.district_type = 'COUNTY' AND d.state = 'or'
    );
  IF v_split_count <> 0 THEN
    RAISE EXCEPTION 'FAILED: section-split for 41067, % orphan rows', v_split_count;
  END IF;

  RAISE NOTICE 'PASSED: gov=%, chair_offices=%, commissioner_offices=%, split_orphans=%',
    v_gov_count, v_chair_offices, v_commissioner_offices, v_split_count;
END $$;
```

### Migration ledger registration (2-column form per migration 1055)

```sql
-- Outside COMMIT — same 2-column form as migration 1055
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('1118', 'washco_commission')
ON CONFLICT (version) DO NOTHING;
```

---

## SECTION B: Live Roster (Ground-Truthed 2026-06-30)

**Source:** washingtoncounty.civicweb.net/portal/members.aspx?id=10 [VERIFIED: live fetch 2026-06-30]

**Official body name:** "Board of County Commissioners (BCC)" [VERIFIED: washingtoncountyor.gov/bcc + civicweb portal]

| Seat | Name | Term ends | Status (as of June 2026) |
|------|------|-----------|--------------------------|
| Chair (At-Large) | Kathryn Harrington | Dec 31, 2026 | NOT seeking reelection; November runoff decides successor (Fai vs Treece) |
| District 1 | Nafisa Fai | Dec 31, 2028 | Running for Chair in November runoff; D1 seat also on ballot |
| District 2 | Pam Treece | Dec 31, 2026 | Running for Chair in November runoff; D2 won outright by Monteblanco (effective Jan 2027) |
| District 3 | Jason Snider | Dec 31, 2028 | Not up in 2026; remains seated |
| District 4 | Jerry Willey | Dec 31, 2026 | Retiring; November runoff determines D4 successor (Callaway vs Sinclair) |

**Seed decision:** Seed the CURRENT INCUMBENT roster. November runoff winners take office January 2027 — outside this phase's scope. A future reconcile phase (or Phase 185 elections work) handles the handoff. Seeding the sitting elected officials is always correct at phase execution time.

**External_id scheme (planner to confirm in Wave-0):**
Multnomah used: -410001 (Chair) + -410010..-410013 (D1-D4)
Proposed WashCo block (no migration uses this range): -410100 (Chair) + -410110..-410113 (D1-D4)
Wave-0 DB probe: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -410113 AND -410100 ORDER BY external_id;` — must return 0 rows before use.

---

## SECTION C: Per-District Geofence Mechanism (The Key Novel Element)

### C1. GIS Boundary Source

**Live ArcGIS FeatureServer (official Washington County GIS):**
```
https://gispub.co.washington.or.us/server/rest/services/BOC_CAO/CoCommissioners/FeatureServer/0
```
[VERIFIED: live fetch 2026-06-30 — returns valid GeoJSON, 4 features, WGS 84]

**Query for all 4 districts (attribute + geometry):**
```
.../FeatureServer/0/query?where=1%3D1&outFields=COMMDIST,NAME,Lastname,Firstname&returnGeometry=true&f=geojson&outSR=4326
```

**Layer properties:**
- Geometry type: esriGeometryPolygon
- Spatial reference: WGS 84 (EPSG:4326) when `outSR=4326` is specified
- Feature count: 4 (Districts 1, 2, 3, 4)
- Key field: `COMMDIST` (integer 1–4)
- Format: `f=geojson` returns valid GeoJSON FeatureCollection with polygon coordinates
- Response shape: ArcGIS rings-format geometry (use `arcgisRingsToGeoJson` helper from load-lv-ward-boundaries.ts)

**CRITICAL:** Specify `outSR=4326` — ArcGIS MapServer default is a projected CRS (Oregon state plane or similar). Without this, ST_GeomFromGeoJSON will fail or produce wrong coordinates.

### C2. Loader Script Pattern

Clone `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts` (4-ward ArcGIS JSON loader — closest analog to the WashCo 4-district case). Key constant changes:

```typescript
// Source: load-henderson-ward-boundaries.ts adapted for WashCo
const WASHCO_DISTRICT_URL =
  'https://gispub.co.washington.or.us/server/rest/services/BOC_CAO/' +
  'CoCommissioners/FeatureServer/0/query' +
  '?where=1%3D1&outFields=COMMDIST,NAME,Lastname,Firstname' +
  '&returnGeometry=true&f=geojson&outSR=4326';     // f=geojson (NOT f=json) — FeatureServer returns GeoJSON directly

const MTFCC          = 'X0018';        // Next unused — confirmed by Wave-0 grep
const STATE_CODE     = 'or';           // CRITICAL: lowercase for LOCAL-tier routing
const SOURCE         = 'washingtoncountyor.gov-gis-commissioner-districts-2026';
const GEO_ID_PREFIX  = 'washco-or-commissioner-district-';
const EXPECTED_COUNT = 4;
```

**Note on GeoJSON vs ArcGIS rings:** The WashCo FeatureServer at `/FeatureServer/0` supports `f=geojson` natively (confirmed). This means the response is already a GeoJSON FeatureCollection — no rings-conversion helper needed. The LV MapServer (MapServer, not FeatureServer) required f=json + rings conversion. WashCo uses FeatureServer with f=geojson, so `feature.geometry` is already a GeoJSON object. Use `JSON.stringify(feature.geometry)` directly.

**Insert SQL (inside loader):**
```typescript
// Source: load-henderson-ward-boundaries.ts pattern, adapted
await pool.query(
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

**Geo_id scheme:** `washco-or-commissioner-district-1` through `washco-or-commissioner-district-4` (consistent with `las-vegas-nv-council-ward-N` and `henderson-nv-council-ward-N` patterns).

### C3. Custom MTFCC Assignment

X00xx codes used (from codebase audit):
- X0012: Portland city council districts
- X0013: MA city wards (Worcester, Springfield, etc.)
- X0014: MA city wards (Lowell, Brockton, Quincy, etc.)
- X0015: Las Vegas council wards (6 wards)
- X0016: Henderson council wards (4 wards)
- X0017: North Las Vegas council wards (4 wards)
- X0018: **UNCLAIMED — proposed for WashCo commissioner districts**

**Wave-0 verification:** `grep -r "X0018" C:/EV-Accounts/backend/migrations/ C:/EV-Accounts/backend/scripts/` — must return 0 lines to confirm X0018 is safe.

### C4. District rows in essentials.districts

The structural migration creates 4 LOCAL districts (one per commission district), plus the COUNTY district (for Chair). Example for District 1:

```sql
-- Source: Extrapolated from 1075_las_vegas_city_council.sql LOCAL ward districts pattern
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', 'washco-or-commissioner-district-1',
       'Washington County Commissioner District 1', 'X0018'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = 'washco-or-commissioner-district-1' AND district_type = 'LOCAL' AND state = 'or'
);
```

**Pre-flight guard in migration:** Assert 4 X0018 geofences exist before creating district rows (mirrors the LV migration check: `IF COUNT(*) FROM geofence_boundaries WHERE state='nv' AND mtfcc='X0015' < 6 THEN RAISE EXCEPTION`):

```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.geofence_boundaries
      WHERE state = 'or' AND mtfcc = 'X0018') < 4 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: fewer than 4 X0018 geofences — run load-washco-commissioner-boundaries.ts first.';
  END IF;
END $$;
```

### C5. Routing Validation

After seed, verify per-district routing with sample unincorporated WashCo addresses:
- D1 (Aloha/Beaverton area): e.g., 10000 SW Murray Blvd, Beaverton, OR 97005 → expect Chair + D1 Nafisa Fai
- D2 (Hillsboro area): e.g., 500 SE Baseline St, Hillsboro, OR 97123 → expect Chair + D2 Pam Treece
- D3 (Tigard area): e.g., 11711 SW Pacific Hwy, Tigard, OR 97223 → expect Chair + D3 Jason Snider
- D4 (Forest Grove/rural area): e.g., 1928 Main St, Forest Grove, OR 97116 → expect Chair + D4 Jerry Willey

**IMPORTANT:** For unincorporated addresses, the response should NOT include a city government. City addresses (e.g., within Beaverton city limits) return the G4110 city tier + county — but the county commissioner section should still appear.

---

## SECTION D: Headshots

**Source:** `media-production.washcotech.net` via `washingtoncountyor.gov/elections/county-officials`
[VERIFIED: live page fetch 2026-06-30 confirmed all 5 headshots present with this domain]

**URL pattern:**
```
https://media-production.washcotech.net/styles/max_966_wide/s3/[YEAR]-[MONTH]/[FILENAME].jpg?VersionId=[ID]&itok=[TOKEN]
```

Example filenames observed: `Chair%20Harrington%2022.jpg`, `snider.jpg`, `fai[...].jpg`

**Known dates from fetch:** Photos stored in dated folders — 2023-01, 2024-08, 2025-01 (exact per commissioner depends on when their photo was uploaded).

**WAF/anti-crawl:** No WAF indicators detected. The washingtoncountyor.gov site uses Drupal with a managed media server (washcotech.net CDN). Standard `curl` with a descriptive User-Agent should work. **Try `curl -L` first** (follow redirect from .gov to CDN). If 403, escalate to Ballotpedia or press coverage fallback.

**Fallback chain (if washcotech.net returns 403):**
1. washingtoncountyor.gov/elections/county-officials inline img src attributes
2. Ballotpedia commissioner pages (if headshots available at Ballotpedia resolution)
3. Official press releases or media kits (commissioners.washingtoncountyor.gov)

**Processing:** Crop to 4:5 ratio first, then resize to 600×750 Lanczos q90. Upload to `politician_photos/{uuid}-headshot.jpg`. `photo_license = 'us_government_work'` (Oregon county government portraits are public domain / us_government_work). `type = 'default'`, `is_appointed = false`.

**Politician_images schema (no photo_origin_url column):**
```sql
-- Source: multiple prior phase migrations (confirmed — no photo_origin_url)
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -410100),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'us_government_work'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -410100)
);
```

---

## SECTION E: Stance Schema

**Schema confirmed from project_phase155_norwalk_complete + project_phase161_complete:**

```sql
-- Source: inform.politician_answers schema (confirmed)
-- Topic resolution: JOIN on topic_key AND is_live=true
-- Conflict key: (politician_id, topic_id)
INSERT INTO inform.politician_answers (id, politician_id, topic_id, value, context, source_url, confidence)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -410100),
       (SELECT id FROM inform.compass_topics WHERE topic_key = 'housing' AND is_live = true),
       3, 'Evidence text...', 'https://source.example.com', 'official'
ON CONFLICT (politician_id, topic_id) DO NOTHING;
```

**Live topic IDs:** Resolved at execution via `SELECT id, topic_key FROM inform.compass_topics WHERE is_live = true ORDER BY topic_key;` — never hardcode topic UUIDs. [ASSUMED — per project_compass_live_topic_ids memory; Wave-0 should confirm the is_live query returns expected topics]

**Compass chairs model (project_phase155_norwalk_complete):** Values 1–5 are discrete chair positions, not a directional scale. Pick the chair the evidence matches; blank if none fits.

**Stance migration shape:** Per-official audit-only migration. Applies via `psql -f`; does NOT register in `supabase_migrations.schema_migrations`.

---

## SECTION F: coverage.js Update

```javascript
// Source: src/lib/coverage.js COVERAGE_COUNTIES block
// Add after the existing Multnomah County entry (line 229)
// NOTE: existing 'Washington County' entry is UT (49053) — this adds OR (41067)
// Use a distinct label to avoid collision: 'Washington County, OR'
{ label: 'Washington County, OR', browseGovernmentList: ['41067'], browseStateAbbrev: 'OR', hasContext: true },
```

**Browse link (county pattern):** Uses `browseGovernmentList` + `browse_skip_overlap=1` (same as Clark County entry at line 240). The government_list browse by geo_id 41067 returns the Washington County government.

**CAUTION:** There is already a `'Washington County'` entry in COVERAGE_COUNTIES for UT geo_id 49053 (line 238). The new entry must use a label that distinguishes OR from UT — `'Washington County, OR'` is recommended, or add to the Oregon COVERAGE_STATES areas block with `browseStateAbbrev: 'OR'`. Planner should decide: COVERAGE_COUNTIES entry vs Oregon state areas list.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GeoJSON polygon geometry | Custom polygon parser | `ST_GeomFromGeoJSON` (PostGIS) | Already in place; all prior loaders use it |
| ST_MakeValid repair | Custom topology fix | `ST_MakeValid` (PostGIS) | Handles self-intersecting rings automatically (Henderson Ward III = 4 rings precedent) |
| Image resize/crop | Custom PIL logic | Proven headshot pipeline (`_tmp-*-headshots.py`) from phases 159–164 | 4:5 crop-FIRST then resize-SECOND is established; distortion risk if done wrong |
| Idempotent guards | Application-level checks | SQL `WHERE NOT EXISTS` + `ON CONFLICT DO NOTHING` | Proven in 244/1055; rollback-safe |

---

## Common Pitfalls

### Pitfall 1: districts.state casing
**What goes wrong:** Using `state = 'OR'` (uppercase) in the LOCAL/COUNTY district rows causes silent zero-match on routing queries. Commissioner offices link to the district but the backend PIP query returns nothing.
**Why it happens:** OR has an inconsistency: geofence_boundaries uses `state='41'` (FIPS) for G5420 school districts, `state='or'` (lowercase) for TIGER-loaded city/county tiers, and `state='OR'` (uppercase) for manually-inserted STATE_EXEC/NATIONAL tiers. The LOCAL/COUNTY district rows must use `'or'` lowercase.
**How to avoid:** Always use `state = 'or'` (lowercase) for COUNTY and LOCAL districts in Oregon. Confirmed by migration 244 comments: "districts.state must be 'or' (lowercase) for COUNTY type to match routing queries."
**Warning signs:** A WashCo address returns the Chair but not any district commissioner — wrong state casing on the LOCAL X0018 districts.

### Pitfall 2: Chair office on wrong district
**What goes wrong:** Linking the Chair's office to a LOCAL custom district (e.g., washco-or-commissioner-district-1) instead of the COUNTY district (geo_id=41067). Chair is at-large; only COUNTY district routes county-wide.
**Why it happens:** Confusion between the two-tier routing model: Chair = COUNTY, commissioners = LOCAL.
**How to avoid:** The Chair's office WHERE clause must filter `d.geo_id = '41067' AND d.district_type = 'COUNTY'`; each commissioner's office must filter `d.geo_id = 'washco-or-commissioner-district-N' AND d.district_type = 'LOCAL'`.

### Pitfall 3: Not running the geofence loader before the structural migration
**What goes wrong:** The structural migration's pre-flight assertion (`COUNT(*) < 4 X0018 geofences`) throws EXCEPTION, rolling back the entire migration.
**Why it happens:** Execution order matters — loader must run before structural migration (same as LV: load-lv-ward-boundaries.ts before migration 1075).
**How to avoid:** Plan Wave 1 as: (1) loader --dry-run, (2) loader live, (3) verify 4 X0018 rows in geofence_boundaries, (4) apply structural migration.

### Pitfall 4: 2026 election confusion — seeding wrong-era roster
**What goes wrong:** Seeding Fai + Treece as D1/D2 running for Chair, but the seats technically still have the incumbents occupying them until January 2027. Or alternatively, seeding the primary winners (Monteblanco won D2 outright) before they take office.
**Why it happens:** Complex election transition — some seats are in runoffs, one seat has a primary winner, but all incumbents remain in office until January 2027.
**How to avoid:** Seed the CURRENTLY SEATED incumbents: Harrington (Chair), Fai (D1), Treece (D2), Snider (D3), Willey (D4). The Phase 185 elections phase handles the January 2027 transition.

### Pitfall 5: slug generation
**What goes wrong:** Including `slug` in the chambers INSERT column list causes a database error (generated column).
**Why it happens:** Forgetting that `slug` is GENERATED ALWAYS on essentials.chambers.
**How to avoid:** Never include `slug` in INSERT list. Confirmed in 244 comments: "CRITICAL: slug is GENERATED ALWAYS on essentials.chambers — never include in INSERT column list."

### Pitfall 6: coverage.js label collision
**What goes wrong:** Adding `{ label: 'Washington County', browseGovernmentList: ['41067'], browseStateAbbrev: 'OR' }` when UT's `'Washington County'` already exists at line 238. Two entries with the same label cause search ambiguity.
**Why it happens:** Washington County is a common name across US states (also UT, MD, PA, etc.).
**How to avoid:** Use `'Washington County, OR'` as the label for the Oregon entry.

### Pitfall 7: photo_origin_url column doesn't exist
**What goes wrong:** Including `photo_origin_url` in the politician_images INSERT causes an error.
**Why it happens:** Schema does not have this column (project_ca_state_legislature + project_phase159_complete confirm its absence).
**How to avoid:** Only INSERT `(id, politician_id, url, type, photo_license)` into essentials.politician_images. [VERIFIED: multiple phase migrations]

### Pitfall 8: Missing geometry on FeatureServer GeoJSON response
**What goes wrong:** Fetching `f=geojson` without `outSR=4326` returns coordinates in Oregon state plane projection (~400,000, ~100,000 range) instead of WGS 84 (-123, 45 range). ST_GeomFromGeoJSON stores the wrong CRS.
**Why it happens:** ArcGIS FeatureServer default spatial reference is the layer's native CRS, which is often a local projected system.
**How to avoid:** Always include `outSR=4326` in the FeatureServer query URL.

---

## Runtime State Inventory

> Greenfield seed — no rename/refactor involved. No runtime state audit required.

**Stored data:** None (Washington County not previously seeded).
**Live service config:** None (not registered anywhere yet).
**OS-registered state:** None.
**Secrets/env vars:** None new.
**Build artifacts:** None.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| psql | Migration apply | Confirm in Wave-0 | system | — |
| npx tsx | Loader script | Confirm via `npx tsx --version` | existing | — |
| Python 3 + Pillow | Headshot pipeline | Confirm in Wave-0 | existing | — |
| WashCo FeatureServer | Boundary loader | Confirmed live | — | No fallback — use only official source |
| media-production.washcotech.net | Headshots | Confirmed via page fetch | — | Ballotpedia fallback per-person |
| DATABASE_URL (.env) | All DB ops | Must exist | — | None — blocking |

**Missing dependencies with no fallback:** None identified — all confirmed or resolvable via Wave-0.

---

## Validation Architecture

> Nyquist validation enabled (config.json has no `nyquist_validation: false`).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Inline SQL assertions (in-migration DO blocks) + ad-hoc psql probes |
| Config file | None — inline pattern |
| Quick run command | `psql $DATABASE_URL -c "SELECT COUNT(*) FROM essentials.governments WHERE name='Washington County, Oregon, US';"` |
| Full suite command | See Wave-3 9-check E2E verification gate (mirrors Phase 161 pattern) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WASH-01 | WashCo government row exists | unit SQL | `SELECT COUNT(*)=1 FROM essentials.governments WHERE name='Washington County, Oregon, US'` | Wave 0 probe |
| WASH-01 | 5 offices seeded (1 Chair + 4 Commissioners) | unit SQL | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.chambers c ON c.id=o.chamber_id JOIN essentials.governments g ON g.id=c.government_id WHERE g.name='Washington County, Oregon, US'` | Wave 1 gate |
| WASH-01 | Chair routes county-wide (COUNTY district) | integration SQL | Check Chair office links to geo_id=41067 COUNTY district | Wave 1 gate |
| WASH-01 | 4 commissioner offices link to LOCAL X0018 districts | integration SQL | `SELECT COUNT(*) FROM essentials.districts WHERE mtfcc='X0018' AND state='or'` = 4 | Wave 1 gate |
| WASH-01 | 5 headshots in politician_images | unit SQL | `SELECT COUNT(*) FROM essentials.politician_images pi JOIN essentials.politicians p ON p.id=pi.politician_id WHERE p.external_id BETWEEN -410113 AND -410100` | Wave 2 gate |
| WASH-01 | Stances render evidence-only | manual | Spot-check 3 commissioner profiles in live app | Wave 3 gate |
| WASH-01 | Section-split clean | unit SQL | Section-split query on geo_id=41067 AND on 4 X0018 geo_ids = 0 rows | Wave 1 gate |
| WASH-01 | hasContext chip visible | manual | Browse `?browse_government_list=41067` in live app | Wave 3 gate |

### Sampling Rate
- **Per task commit:** Quick gov-row + office-count probe
- **Per wave merge:** Full office/district/headshot/stance count verification
- **Phase gate:** 9-check E2E verification + human-verify checkpoint before WASH-01 declared complete

### Wave 0 Gaps
- [ ] Confirm DB ledger MAX (`ls C:/EV-Accounts/backend/migrations/ | sort -V | tail -3`)
- [ ] Confirm COUNTY district for geo_id=41067 (may or may not pre-exist; WHERE NOT EXISTS is safe either way)
- [ ] Confirm external_id range -410113..-410100 is unused in DB
- [ ] Confirm X0018 is unclaimed in migrations + scripts
- [ ] Confirm is_live compass topics query works (`SELECT topic_key FROM inform.compass_topics WHERE is_live = true`)

---

## Security Domain

> This phase is data ingestion (SQL migrations + headshot mirror). No user-facing auth, no input validation, no session handling.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | — |
| V3 Session Management | No | — |
| V4 Access Control | No | — |
| V5 Input Validation | Partial | Loader validates COMMDIST field (1–4 range check); geometry validity asserted via ST_IsValid |
| V6 Cryptography | No | — |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| FeatureServer returns malformed geometry | Tampering | ST_IsValid assertion + ST_MakeValid fallback in loader |
| Wrong COMMDIST value maps to wrong geo_id | Tampering | Per-feature validation in loader (reject out-of-range); Wave-3 routing spot-check |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | X0018 is unclaimed in all migrations and scripts | C3 | Wave-0 must verify via grep; if X0018 is already used, next unused code must be found |
| A2 | OR COUNTY district for geo_id=41067 does not yet exist in essentials.districts | C1 (routing) | WHERE NOT EXISTS guard is idempotent — safe either way; risk is only if the existing row has wrong state casing |
| A3 | November 2026 runoff has not yet occurred; Harrington/Fai/Treece/Willey are still seated incumbents | B (roster) | Confirmed by election news (June 2026 certified results) — all four remain in office until Jan 2027; LOW risk |
| A4 | WashCo FeatureServer returns all 4 district polygons without pagination issues | C1 | `resultRecordCount` may need to be added if only 3 are returned (Henderson needed `resultRecordCount=100`); add to URL as fallback |
| A5 | `media-production.washcotech.net` headshots are publicly accessible via `curl` | D | Confirmed domain from page fetch; actual curl test in Wave-2 execution |
| A6 | live compass topics query (`WHERE is_live=true`) returns the standard set | E | Wave-0 probe confirms; retired IDs list in project_compass_live_topic_ids memory |

---

## Open Questions (RESOLVED)

> All four questions resolved during planning (Phase 175 plans, 2026-06-30). Each is either handled by an idempotent guard in migration 1120 or decided in the plan. None blocks execution.

1. **Does essentials.districts already have a COUNTY row for geo_id=41067?**
   - What we know: Multnomah (244) created its COUNTY district explicitly; OR TIGER loader loaded geofence_boundaries for all counties. Essentials.districts may or may not have been populated from the TIGER load.
   - What's unclear: Whether the OR TIGER phase also populated essentials.districts rows, or only essentials.geofence_boundaries.
   - Recommendation: Wave-0 probe `SELECT id, district_type, state FROM essentials.districts WHERE geo_id='41067'`. If row exists with correct state='or', the WHERE NOT EXISTS guard handles it. If state='OR' (wrong casing), it must be fixed.
   - **RESOLVED:** Plan 175-01 Wave-0 probe 2 checks this; the COUNTY-district INSERT uses a `WHERE NOT EXISTS` guard so pre-existence is a no-op. Wrong casing ('OR') is FLAGGED in Wave-0.

2. **Does the FeatureServer return a single polygon per district, or multi-polygon (rings)?**
   - What we know: One feature was returned in the sample query (may be due to response pagination or the query only returning one feature). The full query for all 4 was confirmed to list 4 features.
   - What's unclear: Whether any district has enclave/exclave polygons requiring `ST_Multi` wrapping (Henderson Ward III had 4 rings).
   - Recommendation: Run loader with `--dry-run` first and inspect `rings` count per district. The `ST_Multi` wrap in the insert is safe even for single-polygon cases.
   - **RESOLVED:** Plan 175-01 Task 1 wraps geometry in `ST_Multi(...)` (safe for single- or multi-polygon) and runs `--dry-run` first; ST_MakeValid fallback handles multi-ring cases.

3. **Label collision in coverage.js — use COVERAGE_COUNTIES or COVERAGE_STATES areas?**
   - What we know: UT already has `'Washington County'` in COVERAGE_COUNTIES. OR cities go in COVERAGE_STATES areas block.
   - What's unclear: User preference — should Washington County (OR) be in COVERAGE_COUNTIES with label `'Washington County, OR'`, or in the Oregon block of COVERAGE_STATES with `browseGovernmentList`?
   - Recommendation: COVERAGE_COUNTIES with `'Washington County, OR'` label is simplest and consistent with how Clark County (NV) and Multnomah County (OR) are handled. Planner should confirm.
   - **RESOLVED:** Planner chose COVERAGE_COUNTIES with label `'Washington County, OR'` (Plan 175-03 Task 2) — disambiguates from the UT `'Washington County'` entry (geo_id 49053).

4. **Does the FeatureServer require authentication for geometry access?**
   - What we know: The attribute query returned results; the geometry query returned 1 feature.
   - What's unclear: Whether full geometry for all 4 districts is publicly accessible or gated.
   - Recommendation: Run `--dry-run` loader first; if 401/403, check gispub.co.washington.or.us for anonymous access terms. The WashCo GIS page states data is publicly available.
   - **RESOLVED:** FeatureServer confirmed publicly accessible (live fetch 2026-06-30, RESEARCH Sources); Plan 175-01 Task 1 runs `--dry-run` first to confirm at execution.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All commissioners on single COUNTY district (Multnomah/Clark model) | Per-district geofences for commissioners (WashCo model) | Phase 175 introduces this | Each address returns exactly 1 matched commissioner; more precise representation |
| ArcGIS rings conversion (LV/Henderson) | Native GeoJSON from FeatureServer (`f=geojson`) | This phase | Simpler loader — no `arcgisRingsToGeoJson` helper needed; FeatureServer supports geojson directly |

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql` — full SQL read; canonical template for OR county government
- `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` — headshot migration shape; multco.us source pattern documented
- `C:/EV-Accounts/backend/migrations/1055_clark_county_commission.sql` — full SQL read; NV county template; guard key patterns
- `C:/EV-Accounts/backend/migrations/1075_las_vegas_city_council.sql` — full SQL read; X0015 custom geofence pattern
- `C:/EV-Accounts/backend/migrations/1084_henderson_city_council.sql` — full SQL read; X0016 4-ward ArcGIS loader; direct clone source
- `C:/EV-Accounts/backend/migrations/1093_north_las_vegas_city_council.sql` — X0017 pattern; confirms numbering sequence
- `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts` — full file read; ArcGIS rings loader pattern
- `C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts` — full file read; clone source for WashCo loader
- `C:/EV-Accounts/backend/scripts/load-or-westmetro-school-boundaries.ts` — full file read; OR shapefile + GeoJSON pattern
- `washingtoncounty.civicweb.net/portal/members.aspx?id=10` — live fetch 2026-06-30; VERIFIED roster + body name
- `gispub.co.washington.or.us/server/rest/services/BOC_CAO/CoCommissioners/FeatureServer/0` — live fetch 2026-06-30; VERIFIED 4-district layer
- `gispub.co.washington.or.us/.../FeatureServer/0/query?...f=geojson&outSR=4326` — live fetch 2026-06-30; VERIFIED GeoJSON with geometry + COMMDIST 1-4
- `washingtoncountyor.gov/elections/county-officials` — live fetch 2026-06-30; VERIFIED 5 commissioners + headshot URL domain
- `src/lib/coverage.js` — read; COVERAGE_COUNTIES structure confirmed; Washington County (UT) collision identified
- `src/lib/groupHierarchy.js` — read; Chair-first ordering (execTitlePriority line 442) confirmed

### Secondary (MEDIUM confidence)
- hillsboronewstimes.com/2026/06/16/ — June 2026 certified primary results; confirms incumbents + runoff structure
- washingtoncountyor.gov/bcc — confirms body name abbreviation "BCC" and 5-member board

### Tertiary (LOW confidence)
- WebSearch for X00xx codebase references — cross-verified against grep results on disk

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all prior loader scripts read in full; pattern is established
- County government seed: HIGH — migration 244 read in full; direct template
- Custom geofence mechanism: HIGH — FeatureServer live-verified; loader pattern read from Henderson/LV
- Live roster: HIGH — civicweb portal live-fetched 2026-06-30
- Body name: HIGH — civicweb portal + washingtoncountyor.gov/bcc both confirm "Board of County Commissioners"
- Election transitions: HIGH — June 2026 certified results confirmed; runoff in November 2026
- Headshot source: MEDIUM — domain confirmed from page fetch; actual curl access test at execution
- Stance schema: HIGH — confirmed across phases 155, 161, 165

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 (roster stable until November 2026 runoff; GIS FeatureServer stable)
