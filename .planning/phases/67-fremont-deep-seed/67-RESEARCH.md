# Phase 67: Fremont Deep Seed - Research

**Researched:** 2026-05-22
**Domain:** Fremont CA city government structure, ArcGIS geofence loader, CA city migration pattern
**Confidence:** HIGH (government structure, incumbents, ArcGIS endpoint); MEDIUM (headshot URLs — fremont.gov blocks all HTTP fetches with 403)

---

## Summary

Phase 67 seeds the City of Fremont: one government row, chambers for Mayor and City Council (6 district seats), the 6 district boundary geofences, 7 officials (Mayor + 6 Council Members), and headshots for all 7.

**Fremont uses a district-based council model** — 6 districts, each electing one council member. The Mayor is elected citywide (at-large). This transition from at-large to district-based elections was adopted June 13, 2017. All other offices (City Attorney, City Clerk, City Treasurer, City Manager) are **appointed**, not elected. Only Mayor and council seats appear on the Alameda County election ballot (confirmed from the November 2024 official ballot). Fremont is currently a general law city (charter city initiative on November 2026 ballot — not yet enacted).

The geofence data source is the City of Fremont's own ArcGIS FeatureServer hosted on ArcGIS Online: `https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0`. This endpoint is public (no auth), returns exactly 6 features (one per district, numbered 1-6), uses State Plane California Zone 3 WKID 102643 natively — so `outSR=4326` IS required. The key field is `DISTRICT` (integer 1-6). The item belongs to the City of Fremont GIS Division ("OpenData_cofgis" owner on ArcGIS Online). Last updated January 25, 2026.

**Primary recommendation:** Use 3 migration files (210: government structure + geofences + districts, 211: officials seed, 212: headshots plan). Follow SF/SD deep seed 3-plan pattern exactly. Use MTFCC `X0008` for Fremont council district geofences (next after SD's X0007). Use external_id range `-670001` through `-670020` for Fremont officials.

---

## Critical Answer: District vs At-Large

**DISTRICT-BASED.** 6 districts, each represented by one elected council member. Mayor is elected citywide.

This determination drives the plan shape:
- Plan 01: government structure + 6 district geofences + districts rows
- Plan 02: 7 incumbents + office links (Mayor + 6 Council Members)
- Plan 03: headshots

---

## Current DB State

From Phase 57 (confirmed):
- `geo_id='0626000'`, `mtfcc='G4110'`, `state='06'` — Fremont city/place boundary already in geofence_boundaries
- Fremont FIPS place code: `0626000`
- No `essentials.governments` row for Fremont yet
- No `essentials.districts` row for geo_id='0626000' yet (geofence loading does not create districts rows)
- X0008 is unclaimed — confirmed by grep across all EV-Accounts/backend migrations (no hits)
- Last migration: 209 (SD headshots). Next available: **210**

**After Phase 67:**
- 6 new rows in geofence_boundaries: `geo_id='fremont-council-district-{N}'`, `mtfcc='X0008'`, `state='06'`
- 1 governments row: `'City of Fremont'`
- 2 chambers: Mayor, City Council
- 6 districts rows (LOCAL) + 1 Fremont-wide district row (LOCAL_EXEC)
- 7 politicians + 7 offices

---

## Standard Stack

### Core Tools

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `load-fremont-council-boundaries.ts` (new) | Fetches ArcGIS GeoJSON, upserts 6 rows into geofence_boundaries | TypeScript ArcGIS loader — copy load-sd-council-boundaries.ts with constants changed |
| `pg` (Pool) | PostgreSQL client | Already in package.json |
| Node.js `https` module (built-in) | Fetches GeoJSON from ArcGIS endpoint | No extra HTTP library needed |
| `dotenv` | Loads DATABASE_URL from .env | Standard pattern |

### Data Source

| Resource | URL | Format | Auth |
|---------|-----|--------|------|
| Fremont Council Districts (City of Fremont GIS Division) | `https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0/query?where=1%3D1&outFields=DISTRICT%2CMAP_LABEL&outSR=4326&f=geojson` | GeoJSON (ArcGIS, outSR=4326) | None (public) |
| Layer info page | `https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0?f=json` | JSON metadata | None |
| ArcGIS Item metadata | `https://www.arcgis.com/sharing/rest/content/items/271fe522bbc14225ac1e89127f7c1d5e?f=json` | JSON (item owner = OpenData_cofgis / City of Fremont GIS) | None |

**Source data fields (confirmed from REST API query):**

| Field | Type | Purpose |
|-------|------|---------|
| `DISTRICT` | Small Integer | District number 1-6 |
| `MAP_LABEL` | String | "Council District {N}" (stable label — use for boundary name) |
| `NAME` | String | Not requested — use MAP_LABEL or construct from DISTRICT number |

**Feature count:** Exactly 6 (confirmed with returnCountOnly=true query).

**Geometry CRS:** State Plane California Zone 3 WKID 102643. Natively NOT WGS84. **Must add `outSR=4326`** to the query URL.

**maxRecordCount:** 1000 — all 6 features load in one request, no pagination needed.

**Last updated:** January 25, 2026 (confirmed from ArcGIS layer metadata timestamp).

---

## MTFCC Assignment

**Use `X0008`** for Fremont council district geofences.

| MTFCC | Used for | Source |
|-------|---------|--------|
| X0001 | LA City council districts | load-la-city-council-boundaries.ts |
| X0002 | School districts (LAUSD) | existing |
| X0003 | State board districts | existing |
| X0004 | Tribal lands | existing |
| X0005 | LA County supervisor districts | load-la-county-supervisor-boundaries.ts |
| X0006 | SF supervisor districts | Phase 63 (load-sf-supervisor-boundaries.ts) |
| X0007 | SD council districts | Phase 65 (load-sd-council-boundaries.ts) |
| **X0008** | **Fremont council districts** | **Phase 67 — new** |

**Why X0008 works:** `essentialsService.ts` line ~579: `OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))`. X0008 falls through this fallback. No service code change required.

**Pre-flight check (mandatory in loader):** `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0008';` → must return 0 before first run.

---

## Fremont Government Structure

Fremont uses a **Council-Manager** form of government. The City Council is the legislative body; an appointed City Manager runs day-to-day operations.

**Elected positions (2 types — 7 total seats):**
- Mayor (citywide at-large, 4-year term)
- City Council (6 district seats, one per district)

**Appointment confirmed — NOT in scope:**
- City Attorney: Rafael E. Alvarado, Jr. — appointed by City Council
- City Manager: Karena Shackelford — appointed by City Council (March 2026, first Black city manager in Fremont history)
- City Clerk: appointed (not on any election ballot)
- City Treasurer: not on any election ballot; effectively appointed/staff function

**Evidence City Clerk/Treasurer are not elected:** The November 2024 Alameda County General Election ballot for Fremont listed only: Mayor, Council District 1, Council District 5, Council District 6. No City Clerk or Treasurer on the ballot. This is consistent with Fremont being a general law city where City Clerk/Treasurer are typically appointed.

**Charter city transition:** City Council voted 5-2 on Feb 17, 2026 to place a charter city initiative on the November 2026 ballot. Charter Advisory Committee drafting as of May 2026. **The charter has NOT been adopted**. Fremont remains a general law city for Phase 67 purposes.

### All 7 Current Incumbents (May 2026)

| Role | Name | District/Scope | Notes |
|------|------|----------------|-------|
| Mayor | Raj Salwan | Citywide | First Indian-American mayor; elected Nov 2024, sworn in Dec 2024; 4-year term through Nov 2028 |
| Council District 1 | Teresa Keng | District 1 | First elected 2018; re-elected 2020 and 2024 |
| Council District 2 | Desrie Campbell | District 2 | Vice Mayor; since 2022 |
| Council District 3 | Kathy Kimberlin | District 3 | **Appointed** Sept 10, 2024 to fill vacancy; serves through Nov 2026 election certification |
| Council District 4 | Yang Shao | District 4 | Since 2018 |
| Council District 5 | Yajing Zhang | District 5 | Elected Nov 2024, sworn in Dec 10, 2024 |
| Council District 6 | Raymond Liu | District 6 | Elected Nov 2024, sworn in Dec 2024 |

**Note on Kathy Kimberlin:** She was **appointed** to fill the D3 vacancy (not elected). She is `is_incumbent=true`, `is_active=true`, `is_appointed=false` in the politicians table — she holds an elected seat, she just got there via appointment. The seat itself is an elected position.

**2026 election context:** Districts 1, 3, 5 are on the November 2026 ballot (from the election schedule). Kimberlin's appointment runs through the November 2026 certification.

---

## External ID Scheme

**Use `-670xxx` range for Fremont officials.**

| Official | External ID |
|---------|------------|
| Mayor Raj Salwan | -670001 |
| Council District 1 — Teresa Keng | -670010 |
| Council District 2 — Desrie Campbell | -670011 |
| Council District 3 — Kathy Kimberlin | -670012 |
| Council District 4 — Yang Shao | -670013 |
| Council District 5 — Yajing Zhang | -670014 |
| Council District 6 — Raymond Liu | -670015 |

**Why -670xxx is safe:**
- -6000xxx = CA state executives
- -6001xxx = CA State Senate
- -6002xxx = CA State Assembly
- -6003xxx = CA Governor challengers
- -6004xxx = LAUSD board
- -630xxx = SF officials
- -650xxx = SD officials
- -670xxx is unused (confirmed: no migrations reference -67xxxx range)

Pattern: SF is -630xxx (phase 63 prefix), SD is -650xxx (phase 65 prefix). Fremont = phase 67 → -670xxx.

**Verify before applying:** `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -671000 AND -670000;` → must return 0 rows.

---

## Headshot Sources

**CRITICAL: fremont.gov returns HTTP 403 for all direct fetches.** The CMS does not allow bot access. The headshot URL pattern cannot be discovered by scraping the mayor/council bio pages. The planner must address this in Plan 03 by either:

1. **Manual inspection** — open fremont.gov/government/mayor-city-council in a browser, right-click each photo, copy image URL. The CivicEngage CMS used by Fremont may use patterns like `/Home/ShowImage.ashx?id=XXXX` or similar.
2. **Wikipedia fallback for Mayor** — Raj Salwan has a clean official portrait on Wikimedia Commons: `https://upload.wikimedia.org/wikipedia/commons/6/6f/Raj_Salwan.jpg` (confirmed clean headshot, no text overlay, head+shoulders, suitable for cropping). License: confirmed as official portrait (public domain from Wikipedia page caption).
3. **Other alternatives** — City news releases, press photos from govdelivery bulletins. The govdelivery bulletins only contain group photos, not individual council headshots.

| Official | Primary Source | Fallback |
|---------|---------------|---------|
| Mayor Raj Salwan | fremont.gov/government/mayor-city-council (403 — need browser) | `https://upload.wikimedia.org/wikipedia/commons/6/6f/Raj_Salwan.jpg` (confirmed clean) |
| D1 Teresa Keng | fremont.gov (403) | Campaign site teresalovesfremont.com |
| D2 Desrie Campbell | fremont.gov (403) | Ballotpedia or LinkedIn |
| D3 Kathy Kimberlin | fremont.gov (403) | Local news article photos |
| D4 Yang Shao | fremont.gov (403) | LinkedIn profile |
| D5 Yajing Zhang | fremont.gov (403) | Campaign site or news photo |
| D6 Raymond Liu | fremont.gov (403) | News photo |

**Photo license:** `public_domain` for any fremont.gov government-produced official portrait. For Wikipedia Commons, check the specific license (`Raj_Salwan.jpg` is an official portrait). For campaign/news photos, license depends on source — may need `fair_use` or to skip if no clean government source is found.

**All headshots must be processed:** crop to 4:5 ratio first, then resize to 600×750, Lanczos, q90 (per project memory: feedback_headshot_resize_no_distort.md).

---

## Architecture Patterns

### Recommended File Structure

```
C:/EV-Accounts/backend/scripts/
├── load-fremont-council-boundaries.ts    # NEW: ArcGIS fetch + upsert 6 Fremont council polygons
└── smoke-fremont-geofences.ts            # NEW: Fremont smoke test (3 gates)

C:/EV-Accounts/backend/migrations/
├── 210_fremont_government_structure.sql  # NEW: government + chambers + 6 districts + 1 citywide district
├── 211_fremont_officials.sql             # NEW: 7 politicians + 7 offices
└── 212_fremont_headshots.sql             # NEW: politician_images inserts (audit file, applied manually)
```

### Pattern 1: ArcGIS GeoJSON Fetch (same as SD City loader)

```typescript
// Source: adapted from load-sd-council-boundaries.ts
// CRITICAL: services2.arcgis.com endpoint uses State Plane WKID 102643 — MUST add outSR=4326
// Unlike DataSF (Socrata), ArcGIS Online endpoints do NOT return WGS84 natively

const ARCGIS_URL =
  'https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0/query' +
  '?where=1%3D1&outFields=DISTRICT%2CMAP_LABEL&outSR=4326&f=geojson';

const MTFCC          = 'X0008';
const STATE          = '06';
const SOURCE         = 'fremont_city_council_districts_2022';
const EXPECTED_COUNT = 6;
const MAX_DISTRICT   = 6;
```

**Per-feature mapping:**
```typescript
const rawDistrict = props['DISTRICT'];
const distNum = parseInt(String(rawDistrict ?? ''), 10);
if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
  console.warn(`WARNING: DISTRICT value '${rawDistrict}' out of range — skipping`);
  continue;
}
const geoId = `fremont-council-district-${distNum}`;
const name  = `District ${distNum}`;
// Use 'District N' for stable boundary name, not MAP_LABEL field
```

### Pattern 2: Government Row

```sql
-- governments has NO unique constraint on geo_id — use WHERE NOT EXISTS
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Fremont',
       'LOCAL', 'CA', 'Fremont', '0626000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Fremont' AND state = 'CA'
);
```

### Pattern 3: Chambers

**Fremont has 2 elected office types — 2 chambers:**

```sql
-- City Council chamber (district-based, 6 seats)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Fremont City Council',
       (SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
);

-- Mayor chamber (citywide)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of Fremont',
       (SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
);
```

**Do NOT add a City Attorney chamber** — Fremont's City Attorney is appointed, not elected.

### Pattern 4: Districts Rows

```sql
-- 6 council district rows (label column, per SF migration 205 pattern)
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'fremont-council-district-1', 'LOCAL', 'District 1', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='fremont-council-district-1' AND district_type='LOCAL');
-- ... repeat for districts 2-6 ...

-- Fremont-wide LOCAL_EXEC district for Mayor office
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0626000', 'LOCAL_EXEC', 'Fremont (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0626000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);
```

**Note on column name:** The `essentials.districts` table uses `label` (not `name`) — confirmed from migration 205 (SF). Use `label` in the INSERT.

### Pattern 5: Politician + Office INSERT (from SD migration 208)

```sql
-- Mayor Raj Salwan
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Raj Salwan', 'Raj', 'Salwan', NULL, true, false, false, true, -670001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='Mayor'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0626000' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- Council members: use fremont-council-district-{N} geo_id, chamber 'City Council', title='Council Member'
```

**Office title for council members:** `'Council Member'` (two words, same as SD — NOT "Supervisor" like SF).

### Pattern 6: geo_id Construction

```typescript
// geo_id for Fremont council districts:
const geoId = `fremont-council-district-${distNum}`;  // e.g. 'fremont-council-district-1' through '-6'
// ocd_id = same as geoId (no formal OCD division registered)
```

### Pattern 7: Smoke Test

```sql
-- Gate 1: 6 Fremont council district geofence rows
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE geo_id LIKE 'fremont-council-district-%' AND mtfcc='X0008' AND state='06';
-- Expected: 6

-- Gate 2: Fremont City Hall (3300 Capitol Ave; approx lon=-121.9886, lat=37.5483)
-- → returns 1 council district
SELECT geo_id, name FROM essentials.geofence_boundaries
WHERE mtfcc='X0008' AND geo_id LIKE 'fremont-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-121.9886, 37.5483), 4326));
-- Expected: 1 row (assert rowcount=1; log the district number but don't hard-code it)

-- Gate 3: Oakland point → 0 rows (negative test — outside Fremont boundaries)
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE mtfcc='X0008' AND geo_id LIKE 'fremont-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.2711, 37.8044), 4326));
-- Expected: 0 (Oakland, CA)
```

**Note on smoke test Gate 2:** The Fremont City Hall point (-121.9886, 37.5483) is the approximate center of Fremont. A direct district number assertion is not safe — the ArcGIS spatial query returned empty results for this coordinate in testing (likely the center point is near a district boundary or the ArcGIS server's spatial query behaves differently from PostGIS). Assert only `rowcount=1`, log the returned district.

### Anti-Patterns to Avoid

- **NOT using `outSR=4326`:** The ArcGIS Online service uses State Plane WKID 102643. Without `outSR=4326`, geometries are in meters (State Plane), not degrees. PostGIS stores garbage coordinates.
- **Creating a City Attorney chamber:** Fremont's City Attorney is appointed by the City Council (Rafael E. Alvarado, Jr.). Do NOT create an elected City Attorney chamber. Do NOT add is_appointed_position=true City Attorney office in Phase 67 scope unless the context specifies it.
- **Adding City Clerk or City Treasurer as elected:** Neither office is on the Fremont election ballot. They are appointed/staff positions.
- **Assuming Council Model didn't change:** The district-based model was adopted in 2017. Previous data from before 2017 may reference an at-large model — ignore it.
- **Using NAME or CouncilRepFirst/CouncilRepLast from GeoJSON for boundary name:** Those fields hold council member names which change with elections. Use `'District N'` for the stable boundary name.
- **Using the wrong ArcGIS endpoint:** The item ID `271fe522bbc14225ac1e89127f7c1d5e` maps to `services2.arcgis.com/AVso4yDITKsybTJg`. Do NOT use `vdNDkVykv9vEWFX4` which is a different organization's dataset with 13 districts (wrong city).
- **Seeding a City Manager chamber:** Fremont uses Council-Manager form. The City Manager is the appointed executive. No elected "Mayor-executive" equivalent exists here (unlike SD's Strong Mayor). The Mayor of Fremont is a council member who chairs the council, not a separate executive branch.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ArcGIS GeoJSON fetch | Custom REST client | `fetchJson()` helper from load-sd-council-boundaries.ts | Already handles redirects, JSON parse, HTTP/HTTPS |
| Geometry reprojection | proj4js | `outSR=4326` in ArcGIS query URL | Server-side reprojection is free and accurate |
| Idempotent insert | DELETE + INSERT | `ON CONFLICT (geo_id, mtfcc) DO NOTHING` | Standard pattern throughout codebase |
| Council district routing | Custom query | Standard `X%` fallback in `essentialsService.ts` | X0008 falls through without any code changes |
| Headshot resizing | Raw upload | ImageMagick: crop to 4:5, resize to 600×750, Lanczos, q90 | Per project standard |

---

## Common Pitfalls

### Pitfall 1: Missing outSR=4326 on ArcGIS URL

**What goes wrong:** Loader omits `outSR=4326`. ArcGIS returns geometries in WKID 102643 (State Plane California Zone 3). PostGIS stores coordinates as large meter values (e.g., 6123456.7, 2098765.4) instead of WGS84 decimals.
**Why it happens:** Assumption that ArcGIS Online always returns WGS84.
**How to avoid:** Always include `&outSR=4326` in ArcGIS query URLs.
**Warning signs:** Smoke test Gate 2 (City Hall point) returns 0 rows. PostGIS coordinate values are large integers.

### Pitfall 2: Wrong ArcGIS Endpoint (vdNDkVykv9vEWFX4 vs AVso4yDITKsybTJg)

**What goes wrong:** Loader uses `services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Council_Districts/FeatureServer/0` — this returns 13 features with wrong rep names (Kathleen Madonna-Emmerling, Patrick Catena, etc.) — not Fremont CA.
**Why it happens:** Search results return multiple ArcGIS service endpoints named "Council_Districts."
**How to avoid:** Use `services2.arcgis.com/AVso4yDITKsybTJg` — confirmed as City of Fremont GIS Division (item owner = OpenData_cofgis). The ArcGIS item ID `271fe522bbc14225ac1e89127f7c1d5e` confirms this is the correct Fremont CA dataset.
**Warning signs:** Feature count returns 13 instead of 6.

### Pitfall 3: Districts Column Name (`label` not `name`)

**What goes wrong:** Migration uses `name` column for the district label: `INSERT INTO essentials.districts (geo_id, district_type, name, state)` — this fails with a column-not-found error.
**Why it happens:** Some migrations use `name`, others use `label`. The `essentials.districts` table uses `label`.
**How to avoid:** Use `label` (confirmed from migration 205 SF). The SD migrations in the planning docs incorrectly show `name` in some code examples — the actual live table has `label`.
**Warning signs:** Migration fails with `ERROR: column "name" of relation "districts" does not exist`.

### Pitfall 4: Fremont-Wide District Row Missing for Mayor

**What goes wrong:** Mayor office has no `district_id` because no LOCAL_EXEC district row exists for `geo_id='0626000'`.
**Why it happens:** TIGER G4110 boundary creates a geofence_boundaries row but not a districts row.
**How to avoid:** Migration 210 must create: `INSERT INTO essentials.districts (geo_id, district_type, label, state) SELECT '0626000', 'LOCAL_EXEC', 'Fremont (Citywide)', 'CA' WHERE NOT EXISTS (...)`.
**Warning signs:** FK constraint violation on `essentials.offices.district_id`.

### Pitfall 5: Kathy Kimberlin Appointment vs Election

**What goes wrong:** Setting `is_appointed=true` for Kathy Kimberlin in the politicians table because she was appointed to fill the District 3 vacancy.
**Why it happens:** She was appointed, not elected. But she holds an elected seat.
**How to avoid:** `is_appointed=false` for Kimberlin — she holds an elected office (city council seat). `is_incumbent=true`, `is_active=true`. The `is_appointed_position=false` in the offices table also applies. Her appointment method to fill the vacancy is irrelevant to DB modeling.

### Pitfall 6: Adding City Attorney as Elected

**What goes wrong:** Creating a `City Attorney` chamber and seeding Rafael E. Alvarado Jr. as an elected official.
**Why it happens:** SF and SD both have independently elected City Attorneys. Pattern-copying may incorrectly include it.
**How to avoid:** Fremont's City Attorney is appointed by the City Council — confirmed from official city website description and from the 2024 election ballot (only Mayor + Council Districts). Do not add a City Attorney chamber unless the CONTEXT.md scope changes.

### Pitfall 7: X0008 Pre-existing Rows

**What goes wrong:** Loader pre-flight check finds existing X0008 rows that aren't Fremont districts.
**Why it happens:** X0008 was unregistered but could have been used by another migration.
**How to avoid:** Pre-flight check must abort if `COUNT(*) > 0` for non-fremont-council-district geo_ids under X0008.

### Pitfall 8: Section-Split Bug

**What goes wrong:** After seeding, section-split checker shows split sections for Fremont city government.
**Why it happens:** Partial seeding leaves orphaned office rows.
**How to avoid:** Run section-split check SQL (from `feedback_section_split_check.md` project memory) after migration 211. Zero rows = clean.

### Pitfall 9: Headshot fremont.gov 403

**What goes wrong:** Headshot script tries to fetch images from fremont.gov and gets 403 for all URLs.
**Why it happens:** fremont.gov blocks automated HTTP requests with a 403 Forbidden on all pages.
**How to avoid:** Plan 03 must require manual browser inspection to discover URLs, or use alternative sources (Wikipedia for Mayor, news articles for council members). Document the actual URLs discovered in the plan execution.

---

## Code Examples

### ArcGIS Loader Core (Fremont-specific constants)

```typescript
// Source: adapted from load-sd-council-boundaries.ts
// CRITICAL: outSR=4326 is REQUIRED — ArcGIS Online endpoint uses State Plane WKID 102643 natively

const ARCGIS_URL =
  'https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0/query' +
  '?where=1%3D1&outFields=DISTRICT%2CMAP_LABEL&outSR=4326&f=geojson';

const MTFCC          = 'X0008';
const STATE          = '06';
const SOURCE         = 'fremont_city_council_districts_2022';
const EXPECTED_COUNT = 6;
const MAX_DISTRICT   = 6;

// Per-feature loop:
for (const feature of geojson.features) {
  const props = feature.properties || {};
  const rawDistrict = props['DISTRICT'];
  const distNum = parseInt(String(rawDistrict ?? ''), 10);

  if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
    console.warn(`WARNING: DISTRICT value '${rawDistrict}' out of range — skipping`);
    continue;
  }

  const geoId = `fremont-council-district-${distNum}`;
  const name  = `District ${distNum}`;  // NOT props['MAP_LABEL'] — use stable constructed name
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

### Government Structure SQL (migration 210)

```sql
BEGIN;

-- Government row
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Fremont', 'LOCAL', 'CA', 'Fremont', '0626000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Fremont' AND state = 'CA'
);

-- 2 chambers (slug is GENERATED — never include in INSERT)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Fremont City Council',
       (SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of Fremont',
       (SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')
);

-- 6 council district rows (label column)
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT 'fremont-council-district-1', 'LOCAL', 'District 1', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM essentials.districts WHERE geo_id='fremont-council-district-1' AND district_type='LOCAL');
-- repeat for 2-6 ...

-- Fremont-wide LOCAL_EXEC for Mayor office
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0626000', 'LOCAL_EXEC', 'Fremont (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0626000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);

COMMIT;
```

### Officials Seed Pattern (migration 211)

```sql
-- Council District 1 — Teresa Keng
WITH ins_p AS (
  INSERT INTO essentials.politicians (id, full_name, first_name, last_name, party,
    is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Teresa Keng', 'Teresa', 'Keng', NULL,
          true, false, false, true, -670010)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title,
  representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='City Council'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Fremont' AND state='CA')),
       p.id,
       'Council Member', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'fremont-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

---

## Differences from SF and SD Deep Seed Patterns

| Topic | SF (Phase 63) | SD (Phase 65) | Fremont (Phase 67) |
|-------|--------------|---------------|--------------------|
| Geofence data source | DataSF Socrata | City ArcGIS MapServer | ArcGIS Online FeatureServer |
| ArcGIS org | N/A | webmaps.sandiego.gov | services2.arcgis.com/AVso4yDITKsybTJg |
| outSR needed | NO | YES (WKID 2230) | YES (WKID 102643) |
| Field name | `sup_dist_num` | `DISTRICT` | `DISTRICT` |
| Feature count | 11 | 9 | 6 |
| MTFCC | X0006 | X0007 | X0008 |
| geo_id pattern | `sf-supervisor-district-{N}` | `sd-council-district-{N}` | `fremont-council-district-{N}` |
| Council title | "Supervisor" | "Council Member" | "Council Member" |
| Government name | "City and County of San Francisco" | "City of San Diego" | "City of Fremont" |
| TIGER geo_id | `0667000` | `0666000` | `0626000` |
| Independently elected City Attorney | YES (chamber + office) | YES (chamber + office) | NO (appointed — omit) |
| Government form | Consolidated city-county | Strong Mayor | Council-Manager |
| Chambers count | 10 | 3 | 2 |
| Officials count | 20 | 11 | 7 |
| External_id range | -630xxx | -650xxx | -670xxx |
| Migrations | 198-200 (applied 205-207) | 207-209 | 210-212 |

---

## Open Questions

1. **Headshot URL pattern on fremont.gov**
   - What we know: fremont.gov consistently returns HTTP 403 for all automated fetches. The CMS is CivicEngage (Granicus platform). Staff directory uses `/Home/Components/StaffDirectory/StaffDirectory/` URL pattern.
   - What's unclear: The exact image URL format for council member bio photos. Possible patterns: `ShowImage.ashx?id=XXXX`, or static file paths under `/UserFiles/`.
   - Recommendation: Plan 03 must include a step for the executor to manually open the fremont.gov/government/mayor-city-council page, inspect element on each headshot, and extract the actual image URLs before writing the migration. Provide Raj Salwan's Wikipedia URL as a confirmed fallback.

2. **Kathy Kimberlin's 2026 term end**
   - What we know: Appointed Sept 2024, serves through November 2026 election certification.
   - What's unclear: Whether to note is_incumbent=true vs document her as interim.
   - Recommendation: Seed as `is_incumbent=true`, `is_active=true`, `is_appointed=false`. She is the sitting D3 representative regardless of how she got there.

3. **Pre-existing districts row for geo_id='0626000'**
   - What we know: Phase 57 loaded the Fremont G4110 boundary (geo_id='0626000') into geofence_boundaries. No migration has created a corresponding districts row.
   - Recommendation: Migration 210 must use WHERE NOT EXISTS for the LOCAL_EXEC district row. Safe whether or not it pre-exists.

4. **Fremont City Hall smoke test district**
   - What we know: Fremont City Hall is at 3300 Capitol Ave, coords ~(-121.9886, 37.5483). An ArcGIS spatial query against the Fremont FeatureServer returned empty results for this coordinate in testing (possibly at a district boundary or ArcGIS spatial predicate issue).
   - Recommendation: Gate 2 smoke test asserts only `rowcount=1` (don't assert the specific district number). If the City Hall point is at a boundary, try 3300 Capitol Ave with more precise coords from a geocoder before running the smoke test.

5. **Charter city ballot measure November 2026**
   - What we know: Fremont City Council voted 5-2 Feb 2026 to place charter initiative on November 2026 ballot. Not yet enacted.
   - Impact: None for Phase 67. Seed as general law city. If charter passes, it might affect how offices are structured — but that's a future phase concern.

---

## Sources

### Primary (HIGH confidence)
- `https://www.arcgis.com/sharing/rest/content/items/271fe522bbc14225ac1e89127f7c1d5e?f=json` — confirmed: item owner = OpenData_cofgis (City of Fremont GIS Division), service URL = services2.arcgis.com/AVso4yDITKsybTJg
- `https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0?f=json` — confirmed: 26 fields, DISTRICT (smallInt), spatial ref WKID 102643, geometry=polygon
- `https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0/query?returnCountOnly=true` — count=6 confirmed
- `https://services2.arcgis.com/AVso4yDITKsybTJg/arcgis/rest/services/Council_Districts/FeatureServer/0/query?...` — all 6 DISTRICT values (1-6) confirmed, MAP_LABEL = "Council District N"
- Alameda County November 2024 election ballot — confirmed: Fremont offices = Mayor, Council D1, D5, D6 only (no City Clerk or Treasurer)
- `C:/EV-Accounts/backend/migrations/199_sf_officials.sql` — confirmed external_id scheme: -630xxx for SF
- `C:/EV-Accounts/backend/migrations/208_sd_officials.sql` — confirmed external_id scheme: -650xxx for SD
- `C:/EV-Accounts/backend/migrations/205_sf_government_structure.sql` — confirmed `label` column on essentials.districts
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` line ~579 — confirmed X% fallback catches X0008
- `C:/EV-Accounts/backend/scripts/load-sd-council-boundaries.ts` — confirmed loader pattern to copy

### Secondary (MEDIUM confidence)
- WebSearch "Fremont California city council members 2026 district at-large" — confirmed: Mayor at-large, 6 district council seats since 2017
- WebSearch + Tri City Voice article (tricityvoice.com/a-new-era-for-fremont-local-government/) — confirmed all 7 current incumbents: Raj Salwan (Mayor), Teresa Keng (D1), Desrie Campbell (D2 Vice Mayor), Kathy Kimberlin (D3 appointed), Yang Shao (D4), Yajing Zhang (D5), Raymond Liu (D6)
- WebSearch "Fremont CA City Attorney appointed" — confirmed Rafael E. Alvarado Jr. as appointed City Attorney
- WebSearch "Fremont Selects New City Manager" — confirmed Karena Shackelford as City Manager (March 2026, appointed)
- WebSearch "Kathy Kimberlin District 3 appointed" — confirmed Sept 10, 2024 appointment, serves through Nov 2026
- WebSearch "Fremont California charter city initiative 2026" — confirmed charter initiative on Nov 2026 ballot, not yet enacted
- `https://upload.wikimedia.org/wikipedia/commons/6/6f/Raj_Salwan.jpg` — confirmed clean official portrait of Mayor Raj Salwan (fetched and viewed)

### Tertiary (LOW confidence)
- Fremont City Hall coordinates (-121.9886, 37.5483) — from general city geocoordinates search; may need refinement for smoke test
- Oakland negative test coordinates (-122.2711, 37.8044) — approximate, sufficient for Gate 3

---

## Metadata

**Confidence breakdown:**
- Government structure (district vs at-large): HIGH — district-based confirmed from multiple sources; 2017 adoption confirmed
- All 7 incumbent names: HIGH — confirmed from Tri City Voice article, Ballotpedia, and election results
- ArcGIS data source (endpoint, field names, CRS, count): HIGH — directly queried REST API
- MTFCC assignment (X0008): HIGH — X0007 confirmed as SD (grep), X0008 confirmed unused (grep)
- External_id range (-670xxx): HIGH — pattern confirmed from SF/SD migrations, range clear
- Elected vs appointed offices: HIGH — 2024 ballot confirmed only Mayor+Council; City Attorney/Clerk/Treasurer all appointed
- Headshot URLs: LOW — fremont.gov returns 403 for all automated requests; URL pattern unknown
- Smoke test City Hall coordinate: MEDIUM — approximate from geocoordinate search; exact coordinates unverified

**Research date:** 2026-05-22
**Valid until:** 2026-07-01 (incumbents stable until November 2026 election; D3 Kimberlin may change after Nov 2026 certification)
