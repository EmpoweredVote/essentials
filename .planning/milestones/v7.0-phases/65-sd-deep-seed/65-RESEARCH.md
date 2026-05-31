# Phase 65: San Diego Deep Seed - Research

**Researched:** 2026-05-22
**Domain:** San Diego city government structure, ArcGIS geofence loader, CA city migration pattern
**Confidence:** HIGH

---

## Summary

Phase 65 seeds the City of San Diego: one government row, chambers for Mayor, City Council (9 districts), and City Attorney, the 9 district boundary geofences, 11 officials (Mayor + 9 Council Members + City Attorney), and headshots for all 11.

The geofence data source is the City of San Diego's own ArcGIS MapServer: `https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5`. This endpoint is public (no auth), returns exactly 9 features (one per district), and uses State Plane WKID 2230 natively — so `outSR=4326` IS required (unlike DataSF). The `DISTRICT` field (integer) holds district numbers 1-9. This endpoint is from the City of San Diego DoIT team and is the authoritative source — distinct from the SANDAG `geo.sandag.org` endpoint which covers all 18 incorporated cities in the county.

San Diego uses a Strong Mayor form of government (permanent since 2010, originally adopted 2004/effective 2006). There are exactly 3 elected positions: Mayor, City Attorney, and the 9 City Council members. The City Auditor (Andy Hanau) is appointed by City Council — NOT elected. The City Clerk and City Treasurer are also appointed. For Tier 2-4 purposes, the City Auditor is the only notable appointed independent officer worth considering for a future phase.

**Primary recommendation:** Use 3 migration files (207: government structure + geofences + districts, 208: officials seed, 209/headshots plan): follow the SF deep seed 3-plan pattern exactly. The ArcGIS loader pattern follows `load-la-city-council-boundaries.ts` with `outSR=4326`. Use MTFCC `X0007` for San Diego council district geofences (next after SF's X0006). Use external_id range `-650001` through `-650020` for San Diego officials.

---

## Current DB State

From the additional context and STATE.md (confirmed Phase 57 complete, Phase 63 complete):

- `geo_id='0666000'`, `mtfcc='G4110'`, `state='06'` — San Diego city/place boundary already in geofence_boundaries
- San Diego FIPS place code: `0666000`
- Phase 63 (SF) used migrations 198-200 as file names, but applied as DB migrations 203-206. Migration 200 (headshots) header notes "Next migration is 207"
- X0006 = SF supervisor districts (Phase 63); X0007 is next available for SD council districts

**After Phase 65:**
- 9 new rows in geofence_boundaries: `geo_id='sd-council-district-{N}'`, `mtfcc='X0007'`, `state='06'`
- 1 governments row: `'City of San Diego'`
- 3+ chambers: Mayor, City Council, City Attorney
- 9 districts rows (LOCAL) + 1 SD-wide district row (LOCAL_EXEC or LOCAL)
- 11 politicians + 11 offices

---

## Standard Stack

### Core Tools

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `load-sd-council-boundaries.ts` (new) | Fetches ArcGIS GeoJSON, upserts 9 rows into geofence_boundaries | TypeScript ArcGIS loader — same pattern as load-la-city-council-boundaries.ts |
| `pg` (Pool) | PostgreSQL client | Already in package.json |
| Node.js `https` module (built-in) | Fetches GeoJSON from ArcGIS endpoint | No extra HTTP library needed |
| `dotenv` | Loads DATABASE_URL from .env | Standard pattern |

### Data Source

| Resource | URL | Format | Auth |
|---------|-----|--------|------|
| SD Council Districts (City of San Diego DoIT) | `https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5/query?where=1%3D1&outFields=DISTRICT%2CNAME&outSR=4326&f=geojson` | GeoJSON (ArcGIS, outSR=4326) | None (public) |
| Layer info page | `https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5` | Reference | None |

**Source data fields (confirmed from REST API query):**

| Field | Type | Purpose |
|-------|------|---------|
| `DISTRICT` | esriFieldTypeInteger | District number 1-9 |
| `NAME` | esriFieldTypeString | Current council member's name (do NOT use for boundary name) |
| `PHONE` | esriFieldTypeString | Office phone |
| `WEBSITE` | esriFieldTypeString | District URL (e.g. `http://www.sandiego.gov/citycouncil/cd1`) |

**Feature count:** Exactly 9 (confirmed with returnCountOnly=true query).

**Geometry CRS:** State Plane WKID 2230 (NAD 1983 StatePlane California VI). Natively NOT WGS84. **Must add `outSR=4326`** to the query URL — unlike DataSF (Socrata) which returns WGS84 natively.

**Last updated:** District 8 updated 2026 timestamp; others April 2024. Data reflects post-2022 redistricting boundaries (effective December 12, 2022).

**SANDAG alternative (do not use for SD City only):** `https://geo.sandag.org/server/rest/services/Hosted/Council_Districts/FeatureServer/0` — this covers all 18 cities in San Diego County and requires `code='SD'` or `jur_name='SAN DIEGO'` filter. This returns only 1 feature in testing (filter unclear). Use the City's own endpoint above instead.

**Installation:** No new packages required.

---

## MTFCC Assignment

**Use `X0007`** for San Diego council district geofences.

| MTFCC | Used for | Source |
|-------|---------|--------|
| X0001 | LA City council districts | load-la-city-council-boundaries.ts |
| X0002 | School districts (LAUSD) | existing |
| X0003 | State board districts | existing |
| X0004 | Tribal lands | existing |
| X0005 | LA County supervisor districts | load-la-county-supervisor-boundaries.ts |
| X0006 | SF supervisor districts | Phase 63 (load-sf-supervisor-boundaries.ts) |
| **X0007** | **SD council districts** | **Phase 65 — new** |

**Why X0007 works:** `essentialsService.ts` line ~579: `OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))`. X0007 falls through this fallback. No service code change required.

---

## San Diego Government Structure

San Diego has a **Strong Mayor** form of government (permanent since June 2010 vote, originally adopted Nov 2004, effective Jan 2006).

**Elected positions (3 types):**
- Mayor (citywide)
- City Attorney (citywide, independently elected)
- City Council (9 district seats)

**Appointed positions (NOT in scope for Phase 65):**
- City Auditor — appointed by City Council (Andy Hanau, appointed Nov 2020)
- City Clerk — appointed
- City Treasurer — appointed
- ~40+ department heads — appointed by Mayor

**Phase 65 scope: 11 officials only** (Mayor + 9 Council Members + City Attorney). City Auditor is out of scope for this phase (not elected by voters, low Tier 2 priority).

### All 11 Current Incumbents (May 2026)

| Role | Name | District/Scope | Notes |
|------|------|----------------|-------|
| Mayor | Todd Gloria | Citywide | |
| City Attorney | Heather Ferbert | Citywide | Took office 2025 |
| Council District 1 | Joe LaCava | District 1 | Council President |
| Council District 2 | Jennifer Campbell | District 2 | Term-limited 2026 |
| Council District 3 | Stephen Whitburn | District 3 | |
| Council District 4 | Henry L. Foster III | District 4 | Note: ArcGIS field shows "Henry Foster III" without "L." |
| Council District 5 | Marni von Wilpert | District 5 | |
| Council District 6 | Kent Lee | District 6 | Council President Pro Tem |
| Council District 7 | Raul Campillo | District 7 | |
| Council District 8 | Vivian Moreno | District 8 | Term-limited 2026 |
| Council District 9 | Sean Elo-Rivera | District 9 | |

**2026 Election context:** Districts 2, 4, 6, 8 are on the June 2026 ballot. Jennifer Campbell (D2) and Vivian Moreno (D8) are term-limited. Henry L. Foster III (D4) and Kent Lee (D6) are seeking re-election. All incumbents remain in office through election certification — seed them as current incumbents.

---

## External ID Scheme

**Use `-650xxx` range for San Diego officials:**

| Official | External ID |
|---------|------------|
| Mayor Todd Gloria | -650001 |
| City Attorney Heather Ferbert | -650002 |
| Council District 1 — Joe LaCava | -650010 |
| Council District 2 — Jennifer Campbell | -650011 |
| Council District 3 — Stephen Whitburn | -650012 |
| Council District 4 — Henry L. Foster III | -650013 |
| Council District 5 — Marni von Wilpert | -650014 |
| Council District 6 — Kent Lee | -650015 |
| Council District 7 — Raul Campillo | -650016 |
| Council District 8 — Vivian Moreno | -650017 |
| Council District 9 — Sean Elo-Rivera | -650018 |

**Why -650xxx is safe:**
- -6000xxx = CA state/federal officials
- -6001xxx = CA Senate
- -6002xxx = CA Assembly
- -60003xx = CA House reps
- -630xxx = SF officials
- -650xxx is unused (confirmed: no migrations use -65xxxx range)

**Verify before applying:** `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -651000 AND -650000;` → must return 0 rows.

---

## Headshot Sources

All headshots are on `sandiego.gov/sites/default/files/` — no CDN like `media.api.sf.gov`. Files are standard JPEG/PNG, no circular crop artifacts.

| Official | Source URL | Notes |
|---------|-----------|-------|
| Mayor Todd Gloria | `https://www.sandiego.gov/sites/default/files/todd-gloria-2.png?v=1` | PNG, confirmed |
| City Attorney Heather Ferbert | `https://www.sandiego.gov/sites/default/files/2025-08/city-attorney-ferbert-headshot.jpg` | JPEG, confirmed 2025 |
| D1 Joe LaCava | `https://www.sandiego.gov/sites/default/files/joe-lacava-sq.jpg?v=1` | "-sq" = square crop |
| D2 Jennifer Campbell | `https://www.sandiego.gov/sites/default/files/jennifer-campbell-sq.jpg` | "-sq" = square crop |
| D3 Stephen Whitburn | `https://www.sandiego.gov/sites/default/files/2024-10/stephen-whitburn-v2.jpg` | date-folder pattern |
| D4 Henry L. Foster III | `https://www.sandiego.gov/sites/default/files/2024-04/cd7-henry-foster-iii.png` | Note: filename says "cd7" but this is District 4 — filename anomaly |
| D5 Marni von Wilpert | `https://www.sandiego.gov/sites/default/files/2024-10/councilmember-marni-von-wilpert.jpg` | date-folder pattern |
| D6 Kent Lee | `https://www.sandiego.gov/sites/default/files/councilmember-kent-lee-cd6.jpg` | "-cd6" in filename |
| D7 Raul Campillo | `https://www.sandiego.gov/sites/default/files/raul-campillo-sq.jpg?v=1` | "-sq" = square crop |
| D8 Vivian Moreno | `https://www.sandiego.gov/sites/default/files/2024-05/councilmember-vivian-moreno-headshot.jpg` | date-folder pattern |
| D9 Sean Elo-Rivera | `https://www.sandiego.gov/sites/default/files/sean-elo-rivera-sq.jpg?v=2` | "-sq" = square crop |

**URL pattern notes:**
- No centralized CDN like SF's `media.api.sf.gov`
- Some use date-folder subpaths: `/files/2024-10/filename.jpg`
- Some use "-sq" suffix (square source images)
- Version parameters (`?v=1`, `?v=2`) are cache busters — include them in fetch but strip when saving
- `photo_license='public_domain'` for all (official .gov sources)
- All headshots must be processed: crop to 4:5 ratio first, then resize to 600×750, Lanczos, q90

**Henry L. Foster III filename anomaly:** The source file is named `cd7-henry-foster-iii.png` with `2024-04/` date folder despite being District 4's representative. This is a naming error in the CMS. Verify the image shows Henry Foster III before uploading — the URL was scraped from the official `/citycouncil` page which correctly associates it with District 4.

---

## Architecture Patterns

### Recommended File Structure

```
C:/EV-Accounts/backend/scripts/
├── load-sd-council-boundaries.ts    # NEW: ArcGIS fetch + upsert 9 SD council polygons
└── smoke-sd-geofences.ts            # NEW: SD smoke test (3 gates)

C:/EV-Accounts/backend/migrations/
├── 207_sd_government_structure.sql  # NEW: government + chambers + 9 districts + 1 citywide district
├── 208_sd_officials.sql             # NEW: 11 politicians + 11 offices
└── 209_sd_headshots.sql             # NEW: politician_images inserts (audit file, applied manually)
```

### Pattern 1: ArcGIS GeoJSON Fetch (same as LA City loader)

```typescript
// Source: load-la-city-council-boundaries.ts
// CRITICAL: webmaps.sandiego.gov uses State Plane WKID 2230 — MUST add outSR=4326
// Unlike DataSF (Socrata), ArcGIS endpoints do NOT return WGS84 natively

const ARCGIS_URL =
  'https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5/query' +
  '?where=1%3D1&outFields=DISTRICT%2CNAME&outSR=4326&f=geojson';

const MTFCC          = 'X0007';
const STATE          = '06';
const SOURCE         = 'sd_city_council_districts_2022';
const EXPECTED_COUNT = 9;
const MAX_DISTRICT   = 9;
```

**Per-feature mapping:**
```typescript
const rawDistrict = props['DISTRICT'];
const distNum = parseInt(String(rawDistrict ?? ''), 10);
if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
  console.warn(`WARNING: DISTRICT value '${rawDistrict}' out of range — skipping`);
  continue;
}
const geoId = `sd-council-district-${distNum}`;
const name  = `District ${distNum}`;
// Do NOT use props['NAME'] for the boundary name — council member names change with elections
```

### Pattern 2: Government Row

```sql
-- governments has NO unique constraint on geo_id — use WHERE NOT EXISTS
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of San Diego',
       'LOCAL', 'CA', 'San Diego', '0666000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of San Diego' AND state = 'CA'
);
```

**Note:** San Diego is a regular city (not a consolidated city-county like SF). Use `'City of San Diego'` not `'City and County of San Diego'`. Only 1 TIGER row exists (G4110, geo_id='0666000'); there is no separate county boundary to worry about for routing.

### Pattern 3: Chambers

**San Diego has 3 elected office types — 3 chambers:**

```sql
-- City Council chamber (district-based, 9 seats)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'San Diego City Council',
       (SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
);

-- Mayor chamber (citywide)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of San Diego',
       (SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
);

-- City Attorney chamber (citywide, independently elected)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Attorney', 'San Diego City Attorney',
       (SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Attorney'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
);
```

### Pattern 4: Districts Rows

```sql
-- 9 council district rows
INSERT INTO essentials.districts (geo_id, district_type, name, state)
VALUES
  ('sd-council-district-1', 'LOCAL', 'District 1', 'CA'),
  ('sd-council-district-2', 'LOCAL', 'District 2', 'CA'),
  ('sd-council-district-3', 'LOCAL', 'District 3', 'CA'),
  ('sd-council-district-4', 'LOCAL', 'District 4', 'CA'),
  ('sd-council-district-5', 'LOCAL', 'District 5', 'CA'),
  ('sd-council-district-6', 'LOCAL', 'District 6', 'CA'),
  ('sd-council-district-7', 'LOCAL', 'District 7', 'CA'),
  ('sd-council-district-8', 'LOCAL', 'District 8', 'CA'),
  ('sd-council-district-9', 'LOCAL', 'District 9', 'CA')
ON CONFLICT (geo_id, district_type) DO NOTHING;

-- SD-wide LOCAL_EXEC district for Mayor and City Attorney offices
INSERT INTO essentials.districts (geo_id, district_type, name, state)
SELECT '0666000', 'LOCAL_EXEC', 'San Diego (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0666000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);
```

### Pattern 5: Politician + Office INSERT (from SF migration 199)

```sql
-- Mayor Todd Gloria
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Todd Gloria', 'Todd', 'Gloria', NULL, true, false, false, true, -650001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='Mayor'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0666000' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- Council members: use sd-council-district-{N} geo_id, chamber 'City Council', title='Council Member'
-- WITH ins_p AS (...) INSERT INTO offices ... WHERE d.geo_id = 'sd-council-district-1' AND d.district_type='LOCAL'
```

### Pattern 6: geo_id Construction

```typescript
// geo_id for SD council districts:
const geoId = `sd-council-district-${distNum}`;  // e.g. 'sd-council-district-1' through '-9'
// NOT OCD format — same pattern as sf-supervisor-district-{N}
// ocd_id = same as geoId (no formal OCD division registered)
```

### Pattern 7: Smoke Test

```sql
-- Gate 1: 9 SD council district geofence rows
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE geo_id LIKE 'sd-council-district-%' AND mtfcc='X0007' AND state='06';
-- Expected: 9

-- Gate 2: San Diego City Hall (lon=-117.1546, lat=32.7157) → returns 1 council district
SELECT geo_id, name FROM essentials.geofence_boundaries
WHERE mtfcc='X0007' AND geo_id LIKE 'sd-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-117.1546, 32.7157), 4326));
-- Expected: 1 row (City Hall at 202 C Street is in District 3 — Stephen Whitburn)
-- Assert rowcount=1 (don't hard-code district number in code, just log it)

-- Gate 3: Tijuana point → 0 rows (negative test — outside SD boundaries)
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE mtfcc='X0007' AND geo_id LIKE 'sd-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-117.0382, 32.5149), 4326));
-- Expected: 0 (Tijuana, Mexico)
```

### Anti-Patterns to Avoid

- **NOT using `outSR=4326`:** The webmaps.sandiego.gov endpoint uses State Plane WKID 2230. Without `outSR=4326`, geometries will be in meters (State Plane), not WGS84 degrees. PostGIS will store garbage coordinates.
- **Using the SANDAG endpoint for SD City:** `geo.sandag.org/server/rest/services/Hosted/Council_Districts/FeatureServer/0` covers all 18 cities in San Diego County. It returns only 1 feature when filtering for SD City in testing. Use the City's own `webmaps.sandiego.gov` endpoint.
- **Using NAME field for boundary name:** The `NAME` field in the ArcGIS layer holds the council member's name (e.g., "Joe LaCava"), which changes with elections. Use `'District {N}'` for the stable boundary name.
- **Using District 4 Henry Foster's ArcGIS name:** The ArcGIS layer shows "Henry Foster III" but his full official name is "Henry L. Foster III" (verified on sandiego.gov/citycouncil/cd4). Use the full name with middle initial in the politicians table.
- **Creating a "Strong Mayor" executive office:** San Diego's Strong Mayor system means the Mayor is the executive. The Mayor chamber covers this — no separate "City Manager" office exists (that role was abolished when Strong Mayor became permanent).
- **Creating a City Council President separate office:** Joe LaCava is Council President but this is an internal governance role. He holds ONE office: District 1 Council Member. (Mirrors the SF Board President pattern.)
- **Missing the 'L.' in Henry L. Foster III:** The ArcGIS layer's NAME field reads "Henry Foster III" — missing the middle initial. The official sandiego.gov page confirms "Henry L. Foster III". Use the full name.
- **Calling the council members "Supervisor":** SF uses the title "Supervisor." San Diego council members use the title "Council Member" (two words).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ArcGIS GeoJSON fetch | Custom REST client | `fetchJson()` helper from existing loaders | Already handles redirects, JSON parse, HTTP/HTTPS |
| Geometry reprojection | proj4js | `outSR=4326` in ArcGIS query URL | Server-side reprojection is free and accurate |
| Idempotent insert | DELETE + INSERT | `ON CONFLICT (geo_id, mtfcc) DO NOTHING` | Standard pattern throughout codebase |
| Council district routing | Custom query | Standard `X%` fallback in `essentialsService.ts` | X0007 falls through without any code changes |
| Headshot resizing | Raw upload | ImageMagick: crop to 4:5, resize to 600x750, Lanczos, q90 | Per project standard (project memory: feedback_headshot_resize_no_distort.md) |

**Key insight:** The `webmaps.sandiego.gov` ArcGIS endpoint is the same pattern as LA City's `services5.arcgis.com` endpoint. The loader can copy `load-la-city-council-boundaries.ts` with only constants changed (URL, MTFCC, MAX_DISTRICT=9, geo_id pattern).

---

## Common Pitfalls

### Pitfall 1: Missing outSR=4326 on ArcGIS URL

**What goes wrong:** Loader omits `outSR=4326`. ArcGIS returns geometries in WKID 2230 (State Plane California VI, units in US survey feet). PostGIS stores coordinates like `(6295123.4, 1882346.2)` instead of `(-117.15, 32.71)`. Smoke test spatial queries return 0 rows.
**Why it happens:** DataSF Socrata returns WGS84 natively, so the SF loader had no `outSR`. SD uses ArcGIS — different system.
**How to avoid:** Always include `&outSR=4326` in ArcGIS query URLs. The LA City loader example already does this.
**Warning signs:** Smoke test Gate 2 (City Hall point) returns 0 rows. PostGIS coordinate values look like large integers (hundreds of thousands) rather than small decimals.

### Pitfall 2: SANDAG Endpoint Covers All 18 Cities

**What goes wrong:** Loader uses `geo.sandag.org/server/rest/services/Hosted/Council_Districts/FeatureServer/0` and gets council districts for El Cajon, Chula Vista, etc. — not just San Diego City. 60+ features instead of 9.
**Why it happens:** The SANDAG endpoint is a county-wide dataset.
**How to avoid:** Use `webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5` — this is the City of San Diego's own ArcGIS, returns exactly 9 features (verified).
**Warning signs:** Feature count > 9 from the endpoint.

### Pitfall 3: Henry L. Foster III Middle Initial

**What goes wrong:** Politician seeded as "Henry Foster III" (missing "L.") based on ArcGIS field value or careless copy.
**Why it happens:** The ArcGIS `NAME` field shows "Henry Foster III" without the middle initial.
**How to avoid:** Use "Henry L. Foster III" — confirmed from official `sandiego.gov/citycouncil/cd4` page.
**Warning signs:** Section-split checker or manual profile review shows name mismatch.

### Pitfall 4: Wrong Title for Council Members

**What goes wrong:** Council members given title "Supervisor" (copied from SF pattern) instead of "Council Member".
**Why it happens:** SF Supervisors have title "Supervisor"; blind copy of migration pattern.
**How to avoid:** San Diego council members use the title "Council Member". Use this exact value in the `essentials.offices.title` column.
**Warning signs:** Profile pages show "Supervisor" for San Diego council members.

### Pitfall 5: SD-Wide District Row Missing for Mayor and City Attorney

**What goes wrong:** Mayor and City Attorney offices have no `district_id` because no LOCAL_EXEC district row exists for `geo_id='0666000'`.
**Why it happens:** TIGER G4110 boundary creates a geofence_boundaries row but not a districts row.
**How to avoid:** Migration 207 must create the LOCAL_EXEC district: `INSERT INTO essentials.districts (geo_id, district_type, name, state) SELECT '0666000', 'LOCAL_EXEC', 'San Diego (Citywide)', 'CA' WHERE NOT EXISTS (...)`. The offices FK to this district.
**Warning signs:** FK constraint violation on `essentials.offices.district_id`.

### Pitfall 6: X0007 Pre-existing Rows

**What goes wrong:** Smoke test Gate 1 COUNT returns > 9 after load because X0007 was previously used for something else.
**Why it happens:** X0007 is new in Phase 65 — but always verify it's clear before loading.
**How to avoid:** Pre-flight check: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0007';` → must return 0.
**Warning signs:** COUNT > 9 after load.

### Pitfall 7: Section-Split Bug

**What goes wrong:** After seeding, `groupHierarchy.js` section-split query shows split sections for SD city government.
**Why it happens:** Partial seeding leaves orphaned office rows.
**How to avoid:** Run the section-split check SQL (from `feedback_section_split_check.md`) after migration 208 completes. Zero rows = clean.

### Pitfall 8: D4 Headshot Filename Anomaly

**What goes wrong:** The headshot URL for District 4 (Henry L. Foster III) has a filename of `cd7-henry-foster-iii.png` — which says "cd7" in the filename despite being for District 4. This is a CMS naming error on sandiego.gov.
**Why it happens:** CMS file naming error.
**How to avoid:** Verify the image actually shows Henry L. Foster III before uploading. The URL was scraped from the correct district-4 section of the `/citycouncil` page.

---

## Code Examples

### ArcGIS Loader Core (SD-specific constants)

```typescript
// Source: adapted from load-la-city-council-boundaries.ts
// CRITICAL: outSR=4326 is REQUIRED — webmaps.sandiego.gov uses State Plane WKID 2230 natively

const ARCGIS_URL =
  'https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5/query' +
  '?where=1%3D1&outFields=DISTRICT%2CNAME&outSR=4326&f=geojson';

const MTFCC          = 'X0007';
const STATE          = '06';
const SOURCE         = 'sd_city_council_districts_2022';
const EXPECTED_COUNT = 9;
const MAX_DISTRICT   = 9;

// Per-feature loop:
for (const feature of geojson.features) {
  const props = feature.properties || {};
  const rawDistrict = props['DISTRICT'];
  const distNum = parseInt(String(rawDistrict ?? ''), 10);

  if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
    console.warn(`WARNING: DISTRICT value '${rawDistrict}' out of range — skipping`);
    continue;
  }

  const geoId = `sd-council-district-${distNum}`;
  const name  = `District ${distNum}`;  // NOT props['NAME'] — that's the council member name
  const geometryJson = JSON.stringify(feature.geometry);

  await pool.query(`
    INSERT INTO essentials.geofence_boundaries
      (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
    VALUES ($1, $2, $3, $4, $5,
      public.ST_ForcePolygonCCW(
        public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
      ),
      $7, now())
    ON CONFLICT (geo_id, mtfcc) DO NOTHING
  `, [geoId, geoId, name, STATE, MTFCC, geometryJson, SOURCE]);
}
```

### Government Structure SQL (migration 207)

```sql
BEGIN;

-- Government row
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of San Diego', 'LOCAL', 'CA', 'San Diego', '0666000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of San Diego' AND state = 'CA'
);

-- 3 chambers (slug is GENERATED — never include in INSERT)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'San Diego City Council',
       (SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of San Diego',
       (SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Attorney', 'San Diego City Attorney',
       (SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='City Attorney'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')
);

-- 9 council district rows
INSERT INTO essentials.districts (geo_id, district_type, name, state)
VALUES
  ('sd-council-district-1', 'LOCAL', 'District 1', 'CA'),
  ...
  ('sd-council-district-9', 'LOCAL', 'District 9', 'CA')
ON CONFLICT (geo_id, district_type) DO NOTHING;

-- SD-wide LOCAL_EXEC for Mayor and City Attorney
INSERT INTO essentials.districts (geo_id, district_type, name, state)
SELECT '0666000', 'LOCAL_EXEC', 'San Diego (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0666000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);

COMMIT;
```

### Officials Seed Pattern (migration 208)

```sql
-- Council District 1 — Joe LaCava
WITH ins_p AS (
  INSERT INTO essentials.politicians (id, full_name, first_name, last_name, party,
    is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joe LaCava', 'Joe', 'LaCava', NULL,
          true, false, false, true, -650010)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title,
  representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='City Council'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of San Diego' AND state='CA')),
       p.id,
       'Council Member', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'sd-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

---

## Differences from SF Deep Seed Pattern

| Topic | SF (Phase 63) | San Diego (Phase 65) |
|-------|--------------|---------------------|
| Geofence data source | DataSF Socrata (`rows.geojson`) | City ArcGIS (`webmaps.sandiego.gov`) |
| outSR needed | NO (Socrata returns WGS84 natively) | YES (ArcGIS uses State Plane WKID 2230) |
| Field name | `sup_dist_num` (numeric) | `DISTRICT` (integer) |
| Feature count | 11 | 9 |
| MTFCC | X0006 | X0007 |
| geo_id pattern | `sf-supervisor-district-{N}` | `sd-council-district-{N}` |
| Council title | "Supervisor" | "Council Member" |
| Government name | "City and County of San Francisco" | "City of San Diego" |
| TIGER geo_id | `0667000` | `0666000` |
| Appointed officials in scope | Controller, City Administrator | None (City Auditor is future phase) |
| Chambers | 10 (Board of Supervisors + 9 citywide) | 3 (City Council + Mayor + City Attorney) |
| Officials count | 20 | 11 |
| City form | Consolidated city-county | Regular city (Strong Mayor form) |

---

## Open Questions

1. **Henry L. Foster III — middle initial in official records**
   - What we know: sandiego.gov/citycouncil/cd4 says "Henry L. Foster III"; ArcGIS layer shows "Henry Foster III".
   - What's unclear: Whether the live DB should use "Henry L. Foster III" or match some other convention.
   - Recommendation: Use "Henry L. Foster III" (the official sandiego.gov page is authoritative). The ArcGIS field is just a label for the map, not the canonical name.

2. **Districts 2 and 8 — term-limited incumbents**
   - What we know: Jennifer Campbell (D2) and Vivian Moreno (D8) are term-limited and cannot run in June 2026. New council members will be elected.
   - What's unclear: Whether to seed them as incumbents or mark them as `is_vacant=true` / `is_incumbent=false`.
   - Recommendation: Seed as current incumbents (`is_incumbent=true`, `is_active=true`) since they remain in office through election certification (expected November 2026). After certification, a future phase can update. Do not leave the seats vacant — the seats have sitting members.

3. **City Auditor inclusion**
   - What we know: Andy Hanau is appointed City Auditor; the position reports to the City Council's Audit Committee. It is NOT a voter-elected position.
   - Recommendation: Exclude from Phase 65 scope. The City Auditor is a Tier 2-3 appointed independent officer and can be added in a future phase dedicated to SD Tier 2 expansion. The phase requirements specify "Mayor + all 9 Council Members + City Attorney" explicitly.

4. **Pre-existing SD-wide district row**
   - What we know: Phase 57 loaded the SD G4110 boundary (geo_id='0666000'). A districts row for '0666000' may or may not already exist in essentials.districts.
   - Recommendation: Migration 207 must check before creating: `WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='0666000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC'))`. Safe whether or not it pre-exists.

5. **ArcGIS endpoint stability**
   - What we know: The `webmaps.sandiego.gov` DoIT_Public MapServer has been stable since at least 2018 (layer description references 2018 boundary update). Data last updated April 2024 (most districts) through 2026 (District 8).
   - Recommendation: This endpoint is appropriate for one-time loading. No need to set up a refresh cron.

---

## Sources

### Primary (HIGH confidence)
- `https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5` — confirmed: Layer ID 5, DISTRICT integer field, 9 features (returnCountOnly query), WKID 2230, public no-auth
- `https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5/query?...returnGeometry=false&returnCountOnly=true` — count=9 confirmed
- `https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5/query?...returnGeometry=false` — all 9 district DISTRICT values + NAME values confirmed
- `https://www.sandiego.gov/citycouncil` — confirmed: all 9 council members by district, Mayor Todd Gloria, City Attorney Heather Ferbert, all headshot URLs
- `https://www.sandiego.gov/city-attorney` — confirmed: Heather Ferbert, headshot URL `2025-08/city-attorney-ferbert-headshot.jpg`
- `https://www.sandiego.gov/citycouncil/cd4` — confirmed: Henry L. Foster III (full name with middle initial)
- `https://www.sandiego.gov/mayor/about` — confirmed: Todd Gloria headshot at `/sites/default/files/todd-gloria-2.png`
- `https://www.sandiego.gov/city-hall/departments` — confirmed: 3 elected positions (Mayor, City Council, City Attorney); City Auditor = appointed by City Council
- `C:/EV-Accounts/backend/scripts/load-la-city-council-boundaries.ts` — confirmed ArcGIS loader pattern (fetchJson, outSR=4326, DISTRICT field, extractDistrictNumber, INSERT SQL)
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` line ~579 — confirmed X% fallback catches X0007
- `C:/EV-Accounts/backend/migrations/199_sf_officials.sql` — confirmed politician + office INSERT pattern (WITH ins_p CTE, title='Supervisor', office row structure)
- `C:/Transparent Motivations/essentials/.planning/phases/63-sf-deep-seed/63-03-SUMMARY.md` — confirmed "Next migration is 207"

### Secondary (MEDIUM confidence)
- `https://www.sandiego.gov/auditor/aboutus` — confirmed Andy Hanau is City Auditor (appointed, not elected)
- WebSearch "San Diego City Council members 2026" — confirmed all 9 incumbent names, term-limited status for D2/D8
- WebSearch "Strong Mayor San Diego 2006 charter" — confirmed Strong Mayor permanent since 2010, effective 2006
- WebSearch "San Diego redistricting 2021 2022" — confirmed post-2022 redistricted boundaries effective December 12, 2022
- `https://www.kpbs.org/news/politics/2026/04/30/2026-primary-election-san-diego-city-council-races-explainer-districts-2-4-6-8` — confirmed D2/D8 term-limited, D4/D6 seeking re-election

### Tertiary (LOW confidence)
- Henry L. Foster III headshot `2024-04/cd7-henry-foster-iii.png` filename anomaly — CMS naming error confirmed by cross-referencing with page structure; image itself should be verified during headshot plan
- Tijuana smoke test coordinate (-117.0382, 32.5149) — approximate, sufficient for negative test
- San Diego City Hall "District 3" claim — sourced from search results referencing CD3 communities including Downtown/92101 ZIP; verify from smoke test output (assert rowcount=1, log the district name)

---

## Metadata

**Confidence breakdown:**
- ArcGIS data source: HIGH — URL confirmed, field names confirmed, 9 features confirmed, WKID 2230 confirmed
- Loader pattern: HIGH — directly follows production code (load-la-city-council-boundaries.ts)
- MTFCC assignment (X0007): HIGH — non-colliding, service code fallback confirmed
- All 11 official names: HIGH — confirmed from sandiego.gov official pages (May 2026)
- All 11 headshot URLs: HIGH — scraped from official sandiego.gov pages (except noted anomaly for D4)
- D4 headshot filename anomaly: MEDIUM — filename says "cd7" but scraped from D4 section; verify image shows Foster
- External_id range (-650xxx): HIGH — no existing migrations use -65xxxx; established pattern
- Government structure (3 elected offices): HIGH — confirmed from official departments page + charter research
- City Auditor appointment vs election: HIGH — confirmed "City Council Unanimously Approves New City Auditor" (multiple sources)

**Research date:** 2026-05-22
**Valid until:** 2026-07-01 (post-June-2026 election, D2/D8 will have new council members; refresh incumbents then)
