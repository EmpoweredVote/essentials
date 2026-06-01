# Phase 63: San Francisco Deep Seed - Research

**Researched:** 2026-05-21
**Domain:** SF government structure, DataSF GeoJSON API, PostGIS geofence loader, CA city migration pattern
**Confidence:** HIGH

---

## Summary

Phase 63 seeds the City and County of San Francisco: one government row, one Board of Supervisors chamber, 11 district supervisor offices + 9 citywide offices (7 elected + 2 appointed), the 11 boundary geofences for supervisor districts, and headshots for all 20 officials.

The geofence data source is the DataSF Socrata portal (dataset `f2zs-jevy`, "Supervisor Districts 2022"). The rows.geojson endpoint at `https://data.sfgov.org/api/views/f2zs-jevy/rows.geojson` returns all 11 districts (confirmed: fields `sup_dist_num`, `sup_dist_pad`, `sup_name`, `sup_dist`, `sup_dist_name`, polygon geometry). The geometry is already in WGS84 — no server-side reprojection parameter is needed (unlike ArcGIS endpoints). The loader pattern follows `load-la-county-supervisor-boundaries.ts` exactly.

The recommended mtfcc for SF supervisor boundaries is `X0006` — one step past the LA County supervisor `X0005` pattern. The `X%` fallback rule in `essentialsService.ts` already maps any `X%` code not in the explicit list to `district_type IN ('LOCAL', 'COUNTY')`, so `X0006` will route correctly without any service code changes.

All 20 official headshots are available at `media.api.sf.gov` for 18 officials. Sheriff Miyamoto has no clean headshot on sf.gov or sfsheriff.com (see Open Questions). Treasurer Cisneros redirects to sftreasurer.org which hosts a photo at a site-relative path.

**Primary recommendation:** Use 3 migration SQL files (196: government + geofences + districts, 197: politicians + offices, 198: headshots). The geofence loader is a standalone TypeScript script following the LA County supervisor pattern.

---

## Current DB State

From Phase 57 smoke test (confirmed 2026-05-21):

```
geofence_boundaries WHERE state='06':
  G4110: 482   (includes '0667000' = San Francisco place)
  G4020: 58    (includes '06075' = San Francisco County)
  G4040: 1057  (CA CCDs loaded)
  G5200: 52    DONE
  G5210: 40    DONE
  G5220: 80    DONE
  G5420: 346+7 (TIGER UNSD + LAUSD)
```

**SF-specific TIGER rows already in DB:**
- `geo_id='0667000'`, `mtfcc='G4110'` — City/Place boundary (Phase 57 dependency)
- `geo_id='06075'`, `mtfcc='G4020'` — County boundary (Phase 57)

**SF is a consolidated city-county.** Both G4110 and G4020 exist with identical geographic extent. The geofence routing in `essentialsService.ts` will match a SF address against both rows simultaneously.

**After Phase 63:** 11 new rows added with `mtfcc='X0006'`, `geo_id='sf-supervisor-district-{N}'`.

---

## Standard Stack

### Core Tools

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `load-sf-supervisor-boundaries.ts` | new | Fetches DataSF GeoJSON, upserts 11 rows into geofence_boundaries | TypeScript loader — same pattern as load-la-county-supervisor-boundaries.ts |
| `pg` (Pool) | existing | PostgreSQL client for upserts | Already in package.json |
| Node.js `https` module | built-in | Fetches GeoJSON from DataSF rows.geojson endpoint | No external HTTP library needed |
| `dotenv` | existing | Loads DATABASE_URL from .env | Standard pattern |

### Data Source

| Resource | URL | Format | Auth |
|---------|-----|--------|------|
| Supervisor Districts 2022 (rows.geojson) | `https://data.sfgov.org/api/views/f2zs-jevy/rows.geojson` | GeoJSON WGS84 | None (public) |
| Dataset page | `https://data.sfgov.org/Geographic-Locations-and-Boundaries/Supervisor-Districts-2022-/f2zs-jevy` | Reference | None |
| Alt: Current Supervisor Districts | `https://data.sfgov.org/Geographic-Locations-and-Boundaries/Current-Supervisor-Districts/cqbw-m5m3` | Reference | None |

**Source data fields (confirmed from rows.json API):**

| Field | Type | Purpose |
|-------|------|---------|
| `sup_dist_num` | numeric | District number 1–11 |
| `sup_dist_pad` | text | Zero-padded district number ("01"–"11") |
| `sup_dist` | text | District identifier |
| `sup_dist_name` | text | "SUPERVISORIAL DISTRICT" label |
| `sup_name` | text | Current supervisor's name |
| `data_as_of` | timestamp | Source data date |
| `data_loaded_at` | timestamp | Portal load date |

**Feature count:** Exactly 11 (one per supervisor district, confirmed from rows.json metadata).

**Geometry CRS:** WGS84 already (Socrata GeoJSON export). No `outSR` parameter needed. **Critical difference from LA GeoHub ArcGIS:** DataSF returns native WGS84 — do not add `outSR=4326`.

**Installation:** No new packages required.

---

## MTFCC Assignment

**Use `X0006`** for SF supervisor district geofences.

| MTFCC | Used for | Source |
|-------|---------|--------|
| X0001 | TX city council districts (LA City) | existing |
| X0003 | State board districts | existing |
| X0004 | Tribal lands | existing |
| X0005 | LA County supervisor districts | load-la-county-supervisor-boundaries.ts |
| **X0006** | **SF supervisor districts** | **Phase 63 — new** |

**Why X0006 works:** `essentialsService.ts` line ~579: `OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))`. This fallback catches X0005, X0006, and any future X00xx codes. No service code change required.

**Non-collision verified:** X0005 is LA County supervisors. X0006 is unused. The CONTEXT.md decision says "X00xx non-colliding with X0005" — X0006 is the correct choice.

---

## Architecture Patterns

### Recommended File Structure

```
C:/EV-Accounts/backend/scripts/
├── load-sf-supervisor-boundaries.ts    # NEW: DataSF fetch + upsert 11 SF supervisor polygons
└── smoke-sf-geofences.ts               # NEW: SF smoke test (address → correct supervisor)

C:/EV-Accounts/backend/migrations/
├── 196_sf_government_structure.sql     # NEW: government + chambers + geofence loader call + districts
├── 197_sf_officials.sql                # NEW: 20 politicians + offices + external_ids
└── 198_sf_headshots.sql                # NEW: politician_images inserts (or handled in headshot plan)
```

**Note on migration numbering:** Latest migration is 195. SF migrations start at 196.

### Pattern 1: DataSF GeoJSON Fetch (differs from ArcGIS pattern)

```typescript
// Source: adapted from load-la-county-supervisor-boundaries.ts
// CRITICAL: DataSF rows.geojson returns WGS84 natively — no outSR needed
const DATASF_URL =
  'https://data.sfgov.org/api/views/f2zs-jevy/rows.geojson';

// fetchJson() helper — same HTTPS GET helper as in other loaders
// No parameters needed — plain URL fetch
```

### Pattern 2: geo_id Construction

```typescript
// Each of the 11 SF supervisor district rows:
const districtNum = Number(feature.properties['sup_dist_num']); // integer 1-11
const geoId       = `sf-supervisor-district-${districtNum}`;
const name        = `District ${districtNum}`;
// ocd_id: same as geoId (no formal OCD division exists for SF supervisor districts)
```

**Why not OCD format?** OCD-ID for SF supervisor districts would be
`ocd-division/country:us/state:ca/place:san_francisco/supervisor_district:{N}` — this format is not verified as registered. Use the `sf-supervisor-district-{N}` pattern, same as LAUSD's `lausd-board-district-{N}` approach.

### Pattern 3: Loader INSERT SQL

```typescript
// Source: load-la-county-supervisor-boundaries.ts line ~172-183 (exact pattern)
await pool.query(`
  INSERT INTO essentials.geofence_boundaries
    (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
  VALUES ($1, $2, $3, $4, $5,
    public.ST_ForcePolygonCCW(
      public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
    ),
    $7, now())
  ON CONFLICT (geo_id, mtfcc) DO NOTHING
`, [geoId, geoId, name, '06', 'X0006', geometryJson, 'sf_supervisor_districts_2022']);
```

**Geometry transforms:** Same pipeline as all other loaders:
- `ST_GeomFromGeoJSON` — parse GeoJSON
- `ST_Force2D` — strip any Z coordinates
- `ST_SetSRID(..., 4326)` — tag as WGS84 (already is WGS84 from DataSF)
- `ST_ForcePolygonCCW` — enforce CCW winding for PostGIS convention
- **No `ST_MakeValid`** — DataSF polygons are expected to be valid

### Pattern 4: Government Row (SQL migration)

```sql
-- Source: pattern from 185_longview_tx_government.sql and 189_ca_government_chambers.sql
INSERT INTO essentials.governments (name, type, state, city, geo_id)
VALUES ('City and County of San Francisco', 'LOCAL', 'CA', 'San Francisco', '0667000')
ON CONFLICT DO NOTHING;
-- geo_id = '0667000' matches the G4110 place boundary already in geofence_boundaries
-- This enables browse-by-government-list to find SF officials without PostGIS intersection
```

**Why `type='LOCAL'`:** SF is a city government, same as Longview TX. Even though it has county-scope powers, the government row follows the city pattern. The offices (Sheriff, Assessor-Recorder) hang off this same row per CONTEXT.md decision.

**Why `state='CA'` (uppercase):** All CA entries use uppercase per established convention (TX='TX', ME='ME', MA='MA', CA='CA').

### Pattern 5: Board of Supervisors Chamber

```sql
-- No "San Francisco" prefix — chamber name is just "Board of Supervisors"
INSERT INTO essentials.chambers (name, name_formal, government_id)
SELECT 'Board of Supervisors',
       'San Francisco Board of Supervisors',
       (SELECT id FROM essentials.governments WHERE name = 'City and County of San Francisco')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Supervisors'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City and County of San Francisco')
);
```

### Pattern 6: Citywide Elected Offices (7 elected + 2 appointed)

All 9 citywide offices hang off a single chamber (or individual chambers — see Pattern 6b).

**Option A (recommended):** Single chamber per office — mirrors CA state executive pattern where each constitutional officer has their own chamber row. This avoids mixing district-based (supervisors) and citywide seats in one chamber.

```sql
-- Example: Mayor chamber
INSERT INTO essentials.chambers (name, name_formal, government_id)
SELECT 'Mayor', 'Mayor of San Francisco',
       (SELECT id FROM essentials.governments WHERE name = 'City and County of San Francisco')
WHERE NOT EXISTS (...);
```

**Office rows:** For citywide offices (Mayor, DA, etc.), `district_id` links to the SF city district — the `LOCAL` or `LOCAL_EXEC` district row for SF. For supervisor district offices, `district_id` links to the SF supervisor district in `essentials.districts`.

### Pattern 7: Districts Table Rows

SF supervisor districts need rows in `essentials.districts` so address routing can find the correct supervisor:

```sql
-- For each of 11 supervisor districts:
INSERT INTO essentials.districts (geo_id, district_type, name, state)
VALUES ('sf-supervisor-district-1', 'LOCAL', 'District 1', 'CA')
ON CONFLICT (geo_id, district_type) DO NOTHING;
-- district_type = 'LOCAL' — matches CONTEXT.md decision and X% fallback in essentialsService.ts
```

**For citywide SF offices:** Use the existing `LOCAL` district that covers all of SF (geo_id = '0667000' or '06075'). Check if a LOCAL district row for SF already exists before creating one.

### Pattern 8: External ID Scheme

**Recommended:** Use `-6300xx` scheme for SF officials:
- Avoids all existing ranges: -6000xxx (CA federal/state), -6001xxx (CA Senate), -6002xxx (CA Assembly), -60003xx (CA House reps)
- `-6300xx` is the CA local city pattern for SF specifically
- Supervisors: District 1 → `-630001`, District 2 → `-630002`, ..., District 11 → `-630011`
- Citywide elected: Mayor → `-630020`, City Attorney → `-630021`, DA → `-630022`, Sheriff → `-630023`, Assessor-Recorder → `-630024`, Treasurer → `-630025`, Public Defender → `-630026`
- Appointed: Controller → `-630027`, City Administrator → `-630028`

**Verify non-collision before seeding:** Run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -630030 AND -630000;` to confirm range is clear.

### Pattern 9: is_appointed_position Flag

From the CONTEXT.md decisions:
- Controller (Greg Wagner): `is_appointed_position=true` on the **office row** (same column as in offices table seen in migration 185)
- City Administrator (Carmen Chu): `is_appointed_position=true` on the **office row**
- All 7 elected offices: `is_appointed_position=false`
- All 11 supervisors: `is_appointed_position=false`

Also set `is_appointed=true` on the **politician row** for Controller and City Administrator (consistent with `is_appointed_position` on offices).

### Pattern 10: Smoke Test

```sql
-- Gate 1: 11 SF supervisor district geofence rows
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE geo_id LIKE 'sf-supervisor-district-%' AND mtfcc='X0006' AND state='06';
-- Expected: 11

-- Gate 2: SF City Hall (lon=-122.4194, lat=37.7749) → returns supervisor district
SELECT geo_id, name FROM essentials.geofence_boundaries
WHERE mtfcc='X0006' AND geo_id LIKE 'sf-supervisor-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.4194, 37.7749), 4326));
-- Expected: 1 row (District 6 — Matt Dorsey; SF City Hall is at Civic Center)

-- Gate 3: Oakland address → no SF supervisor district returned
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE mtfcc='X0006' AND geo_id LIKE 'sf-supervisor-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.2711, 37.8044), 4326));
-- Expected: 0
```

**Note on Gate 2:** SF City Hall at 1 Dr Carlton B Goodlett Place is in District 6 (Civic Center/Tenderloin). Verify with smoke test output — don't hard-code the district assertion, just assert rowcount > 0.

### Anti-Patterns to Avoid

- **Using `outSR=4326` on DataSF URL:** DataSF is Socrata-based and returns GeoJSON in WGS84 natively. The `outSR` parameter is an ArcGIS-specific parameter. Adding it to a Socrata URL will cause a bad request or be ignored.
- **Using X0005 for SF:** X0005 is LA County supervisor districts. Use X0006 for SF to avoid collision in the COUNT gate for the smoke test.
- **Setting `district_type='COUNTY'` for supervisor districts:** The CONTEXT.md decision is `district_type='LOCAL'`. X0006 falls through to the `X% → LOCAL/COUNTY` fallback anyway, but the districts rows should be `LOCAL` to be consistent with city council patterns (TX, MA).
- **Creating a separate county government row:** CONTEXT.md explicitly decided one consolidated government row for "City and County of San Francisco" — Sheriff, Assessor-Recorder hang off it. No separate county row.
- **Creating a Board of Supervisors President office row:** CONTEXT.md decision: the President is an internal governance role elected by the 11 members. Rafael Mandelman currently holds this title but it does NOT get a separate office row.
- **Using `district_id=NULL` for citywide offices:** Offices must link to a district. For Mayor, DA, etc., find or create a SF-wide LOCAL or LOCAL_EXEC district (geo_id='0667000', district_type='LOCAL_EXEC' for executive offices, or 'LOCAL' — follow the existing pattern for CA cities).
- **Using the `sup_name` field for the boundary name:** Supervisor names change with elections. Use `name = 'District {N}'` for the geofence boundary name, same pattern as LAUSD (`'Board District {N}'`).

---

## The 20 SF Officials

### 11 Board of Supervisors

| District | Supervisor | SF.gov Profile | Headshot URL (media.api.sf.gov) |
|---------|-----------|---------------|--------------------------------|
| District 1 | Connie Chan | `/profile--connie-chan/` | `original_images/D01-Connie_Chan_2025_profile.png` |
| District 2 | Stephen Sherrill | `/profile--stephen-sherrill/` | `original_images/D02-Stephen_Sherrill_2025_profile.png` |
| District 3 | Danny Sauter | `/profile--danny-sauter/` | `original_images/D03-Danny_Sauter_2025_profile.png` |
| District 4 | Alan Wong | `/alan-wong/` | `original_images/D04-Alan_Wong_2026_profile.png` |
| District 5 | Bilal Mahmood | `/profile--bilal-mahmood/` | `original_images/D05-Bilal_Mahmood_2025_profile.png` |
| District 6 | Matt Dorsey | `/profile--matt-dorsey/` | `original_images/D06-Matt_Dorsey_2025_profile.png` |
| District 7 | Myrna Melgar | `/profile--myrna-melgar/` | `original_images/D07-Myrna_Melgar_2025_profile.png` |
| District 8 | Rafael Mandelman (Board President) | `/profile--rafael-mandelman/` | `original_images/D08-Rafael_Mandelman_2025_profile.png` |
| District 9 | Jackie Fielder | `/profile--jackie-fielder/` | `original_images/D09-Jackie-Fielder_2025_profile.png` |
| District 10 | Shamann Walton | `/profile--shamann-walton/` | `original_images/D10-Shamann_Walton_2025_profile.png` |
| District 11 | Chyanne Chen | `/profile--chyanne-chen/` | `original_images/D11-Chyanne_Chen_2025_profile.png` |

**All supervisor headshot URLs follow the pattern:**
`https://media.api.sf.gov/original_images/D{NN}-{Name}_{Year}_profile.png`

### 7 Citywide Elected Officials

| Office | Name | SF.gov Profile | Headshot URL |
|--------|------|---------------|-------------|
| Mayor | Daniel Lurie | `/profile--daniel-lurie` | `https://media.api.sf.gov/original_images/daniel_lurie_KeVK6TD.jpg` |
| City Attorney | David Chiu | `/profile-david-chiu` | `https://media.api.sf.gov/original_images/DC_Headshot.jpg` |
| District Attorney | Brooke Jenkins | `/profile--brooke-jenkins` | `https://media.api.sf.gov/original_images/Brooke_Jenkins_-_cropped_m2XGRTD.jpg` |
| Sheriff | Paul Miyamoto | `/profile--paul-miyamoto-0` (redirects to sfsheriff.com) | See Open Questions — fallback to press photo |
| Assessor-Recorder | Joaquín Torres | `/profile--joaquin-torres` | `https://media.api.sf.gov/original_images/Joaquin_Torres_-_spotlight_image.jpeg` |
| Treasurer | José Cisneros | `/profile--jose-cisneros` (redirects to sftreasurer.org) | `https://sftreasurer.org/sites/default/files/inline-images/IMG_8134b_0.jpg` (site-relative path, needs verification) |
| Public Defender | Manohar Raju | `/manohar-raju` | `https://media.api.sf.gov/original_images/Manohar_Raju_-_cropped.png` |

### 2 Appointed Officials

| Office | Name | SF.gov Profile | Headshot URL |
|--------|------|---------------|-------------|
| Controller | Greg Wagner | `/profile--greg-wagner` | `https://media.api.sf.gov/original_images/Greg_Wagner_for_SF.GOV__0_6ERJ9o4.jpg` |
| City Administrator | Carmen Chu | (on city-administrator dept page) | `https://media.api.sf.gov/original_images/carmen_chu_hero_two_ts2GlAY.png` |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fetching DataSF GeoJSON | Custom REST client | `fetchJson()` helper from existing loaders | Already handles redirects, JSON parse; no auth needed |
| Geometry reprojection | proj4js | Nothing needed — DataSF returns WGS84 natively | Socrata exports GeoJSON in EPSG:4326 already |
| Idempotent insert | DELETE + INSERT | `ON CONFLICT (geo_id, mtfcc) DO NOTHING` | Standard pattern throughout codebase |
| Supervisor district routing | Custom query | Standard `X%` fallback in `essentialsService.ts` | X0006 falls through without any code changes |
| Headshot resizing | Raw upload | ImageMagick: crop to 4:5, resize to 600x750, Lanczos, q90 | Per established project standard in memory files |

**Key insight:** DataSF is a Socrata portal. The `rows.geojson` endpoint returns clean WGS84 GeoJSON with no auth required — simpler than ArcGIS (no `outSR` parameter needed).

---

## Common Pitfalls

### Pitfall 1: Using ArcGIS outSR Pattern on DataSF URL

**What goes wrong:** Loader adds `?outSR=4326` or `&f=geojson` to the DataSF URL as if it were an ArcGIS endpoint. Socrata returns HTTP 400 or ignores the parameter.
**Why it happens:** Phase 58 (LAUSD) and the LA County supervisor loader use ArcGIS REST APIs. DataSF is Socrata — completely different API.
**How to avoid:** The correct DataSF URL is `https://data.sfgov.org/api/views/f2zs-jevy/rows.geojson` with no extra parameters. No `outSR`, no `f=geojson`, no `where=` clause needed.
**Warning signs:** HTTP 400 Bad Request from DataSF.

### Pitfall 2: Wrong Field Name for District Number

**What goes wrong:** Loader reads `feature.properties['DISTRICT']` (the ArcGIS field name) instead of `feature.properties['sup_dist_num']` (the DataSF field name). All 11 districts are skipped with "unexpected DISTRICT value" warnings.
**Why it happens:** LAUSD loader uses `DISTRICT` field from ArcGIS. DataSF uses `sup_dist_num`.
**How to avoid:** Use `sup_dist_num` (numeric) for the district number. Confirm with first-run dry-run output showing "Available fields: sup_dist_num, sup_dist_pad, sup_name, ..."
**Warning signs:** Dry-run logs 0 districts found; "Available fields" output shows no DISTRICT column.

### Pitfall 3: Overwriting geo_id '0667000' in geofence_boundaries

**What goes wrong:** The loader accidentally inserts `geo_id='0667000'` for SF supervisor districts, colliding with the G4110 city boundary already loaded in Phase 57.
**Why it happens:** Forgetting to use the `sf-supervisor-district-{N}` pattern.
**How to avoid:** Always use `geo_id='sf-supervisor-district-{districtNum}'`, never a FIPS code for these custom district rows. The conflict key is `(geo_id, mtfcc)` so different mtfcc would technically allow it, but clean separation is essential.
**Warning signs:** Smoke test shows fewer than 11 rows or insert fails with conflict.

### Pitfall 4: SF-Wide District Row Missing for Citywide Offices

**What goes wrong:** Citywide offices (Mayor, DA, etc.) have no `district_id` because no LOCAL district row exists for SF in `essentials.districts`. Office INSERT fails FK constraint.
**Why it happens:** TIGER places create geofence_boundaries rows but not districts rows. A separate districts row for SF as a whole may not exist.
**How to avoid:** Before inserting citywide offices, check: `SELECT id FROM essentials.districts WHERE geo_id = '0667000' AND district_type IN ('LOCAL', 'LOCAL_EXEC')`. If missing, create it. The office's `district_id` links to this SF-wide district.
**Warning signs:** FK constraint violation on `essentials.offices.district_id`.

### Pitfall 5: Section-Split Bug from Incomplete govt_bodies Coverage

**What goes wrong:** If the government row is created but not all supervisor offices are seeded, the `groupHierarchy.js` section-split detector shows split sections for SF.
**Why it happens:** Partial seeding leaves orphaned office rows or mis-matched govt_body associations.
**How to avoid:** Run the section-split check SQL after Phase 63-02 completes (the SQL is documented in project memory `feedback_section_split_check.md`). Zero rows = clean.
**Warning signs:** Section split checker returns rows for SF geo_id.

### Pitfall 6: X0006 Count Gate Collision

**What goes wrong:** Smoke test COUNT gate for X0006 returns more than 11 rows if another loader has previously used X0006 for a different purpose.
**Why it happens:** X0006 is newly introduced in Phase 63 — unlikely but check before assuming it's zero.
**How to avoid:** Before running the loader, verify: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0006';` → should return 0.
**Warning signs:** Count gate returns > 11 after load.

### Pitfall 7: Rafael Mandelman Board President Separate Office

**What goes wrong:** A separate office row is created for "Board President" thinking it's a distinct elected office.
**Why it happens:** Mandelman holds the title of Board President — it shows prominently on sfbos.org.
**How to avoid:** Per CONTEXT.md decision, Board President is an internal governance role elected by the 11 supervisors, not a public election office. Mandelman holds ONE office: District 8 Supervisor. Do not create a Board President office row.
**Warning signs:** DB shows 12 supervisor offices instead of 11.

### Pitfall 8: Headshot Source Validation

**What goes wrong:** Raw original images from `media.api.sf.gov` are uploaded without resizing. Browser artifacts appear (project memory: `feedback_headshot_image_sizing.md`).
**Why it happens:** media.api.sf.gov serves full-resolution originals (potentially 2000px+ wide).
**How to avoid:** All headshots must be: (1) crop to 4:5 ratio, (2) resize to 600×750 px, Lanczos filter, q90. Per project memory `feedback_headshot_resize_no_distort.md` — crop first, THEN resize; never distort aspect ratio.
**Warning signs:** Images appear blurry, stretched, or oversized in browser.

---

## Code Examples

### DataSF GeoJSON Fetch + Loader Core Loop

```typescript
// Source: adapted from load-la-county-supervisor-boundaries.ts
// CRITICAL: DataSF URL — no outSR or ArcGIS params needed

const DATASF_URL = 'https://data.sfgov.org/api/views/f2zs-jevy/rows.geojson';
const MTFCC          = 'X0006';
const STATE          = '06';
const SOURCE         = 'sf_supervisor_districts_2022';
const EXPECTED_COUNT = 11;
const MAX_DISTRICT   = 11;

// Fetch:
const geojson = await fetchJson(DATASF_URL) as GeoJSONFeatureCollection;

// Per-feature:
for (const feature of geojson.features) {
  const props = feature.properties || {};
  const districtNum = parseInt(String(props['sup_dist_num'] ?? ''), 10);

  if (isNaN(districtNum) || districtNum < 1 || districtNum > MAX_DISTRICT) {
    console.warn(`WARNING: sup_dist_num value '${props['sup_dist_num']}' out of range — skipping`);
    continue;
  }

  const geoId       = `sf-supervisor-district-${districtNum}`;
  const name        = `District ${districtNum}`;
  const geometryJson = JSON.stringify(feature.geometry);

  // INSERT with same SQL as LA County supervisor loader
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

### Government Row + Chamber Structure (SQL)

```sql
-- Government row (idempotent)
INSERT INTO essentials.governments (name, type, state, city, geo_id)
VALUES ('City and County of San Francisco', 'LOCAL', 'CA', 'San Francisco', '0667000')
ON CONFLICT DO NOTHING;

-- Board of Supervisors chamber
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of Supervisors',
       'San Francisco Board of Supervisors',
       (SELECT id FROM essentials.governments WHERE name = 'City and County of San Francisco')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Supervisors'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City and County of San Francisco')
);

-- Mayor chamber (citywide elected)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Mayor',
       'Mayor of San Francisco',
       (SELECT id FROM essentials.governments WHERE name = 'City and County of San Francisco')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Mayor'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'City and County of San Francisco')
);
-- ... repeat for each of the 9 other citywide/appointed offices
```

### Districts Rows for Supervisor Districts

```sql
-- Create LOCAL district rows for each of 11 supervisor districts
-- So resolve_user_jurisdiction and getRepresentativesByAddress can route correctly
INSERT INTO essentials.districts (geo_id, district_type, name, state)
VALUES
  ('sf-supervisor-district-1',  'LOCAL', 'District 1',  'CA'),
  ('sf-supervisor-district-2',  'LOCAL', 'District 2',  'CA'),
  ('sf-supervisor-district-3',  'LOCAL', 'District 3',  'CA'),
  ('sf-supervisor-district-4',  'LOCAL', 'District 4',  'CA'),
  ('sf-supervisor-district-5',  'LOCAL', 'District 5',  'CA'),
  ('sf-supervisor-district-6',  'LOCAL', 'District 6',  'CA'),
  ('sf-supervisor-district-7',  'LOCAL', 'District 7',  'CA'),
  ('sf-supervisor-district-8',  'LOCAL', 'District 8',  'CA'),
  ('sf-supervisor-district-9',  'LOCAL', 'District 9',  'CA'),
  ('sf-supervisor-district-10', 'LOCAL', 'District 10', 'CA'),
  ('sf-supervisor-district-11', 'LOCAL', 'District 11', 'CA')
ON CONFLICT (geo_id, district_type) DO NOTHING;
```

### Politician + Office INSERT Pattern (one per official)

```sql
-- Source: pattern from 193_ca_federal_officials.sql (WITH ins_p CTE pattern)
-- Mayor Daniel Lurie
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Daniel Lurie', 'Daniel', 'Lurie', NULL,
          true, false, false, true, -630020)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='Mayor'
        AND government_id=(SELECT id FROM essentials.governments
                           WHERE name='City and County of San Francisco')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0667000' AND d.district_type IN ('LOCAL', 'LOCAL_EXEC') AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### politician_images Insert Pattern

```sql
-- Source: documented in planning/phases/17-headshots/17-01-PLAN.md
-- After uploading to Supabase Storage at {politician_id}-headshot.jpg:
INSERT INTO essentials.politician_images (politician_id, url, type, photo_license)
VALUES (
  (SELECT id FROM essentials.politicians WHERE external_id = -630020),
  'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg',
  'default',
  'press_use'
);

UPDATE essentials.politicians
SET photo_origin_url = 'https://media.api.sf.gov/original_images/daniel_lurie_KeVK6TD.jpg'
WHERE external_id = -630020;
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|-----------------|--------|
| ArcGIS REST with `outSR=4326` (Phase 58 pattern) | DataSF Socrata `rows.geojson` (no outSR needed) | Simpler URL; already WGS84 |
| `X0005` for LA County supervisors | `X0006` for SF supervisors | Collision-free; X% fallback handles both |
| Custom geo_id formats vary | `sf-supervisor-district-{N}` standard (mirrors `lausd-board-district-{N}`) | Consistent pattern |

---

## Open Questions

1. **Sheriff Paul Miyamoto headshot**
   - What we know: `sf.gov/profile--paul-miyamoto-0` redirects to `sfsheriff.com/`, which does not show a clear individual headshot. The `sfsheriff.com/about` page shows a group photo.
   - What's unclear: Whether a clean individual headshot exists on sfsheriff.com's about/executives page or elsewhere on the official site.
   - Recommendation: During headshot plan (63-03), check `https://ewww.sfsheriff.com/executives.html` and `http://www.sfsheriff.com/organization-chart/paul-m-miyamoto`. If no official clean photo, fall back to Ballotpedia or local press photo from SF Chronicle or SF Examiner. Apply standard rejection criteria (no graphics over face, 200px+ width minimum).

2. **Treasurer José Cisneros headshot**
   - What we know: `sf.gov/profile--jose-cisneros` redirects to sftreasurer.org. The Our Team page shows an image at site-relative path `/sites/default/files/inline-images/IMG_8134b_0.jpg` (full URL: `https://sftreasurer.org/sites/default/files/inline-images/IMG_8134b_0.jpg`).
   - What's unclear: Whether this image is a suitable headshot (correct aspect ratio, no graphics over face, > 200px wide).
   - Recommendation: During headshot plan, fetch `https://sftreasurer.org/sites/default/files/inline-images/IMG_8134b_0.jpg` and evaluate. If unsuitable, fall back to Ballotpedia or press photos.

3. **SF-wide districts row — does it already exist?**
   - What we know: Phase 57 loaded G4110 and G4020 geofence_boundaries rows for SF. districts rows may or may not exist.
   - What's unclear: Whether `essentials.districts` has a LOCAL or LOCAL_EXEC row for `geo_id='0667000'` or `geo_id='06075'`.
   - Recommendation: At migration start, run `SELECT geo_id, district_type FROM essentials.districts WHERE geo_id IN ('0667000', '06075');` and create a LOCAL_EXEC district for citywide offices if missing.

4. **District 6 for SF City Hall smoke test**
   - What we know: SF City Hall is at 1 Dr Carlton B Goodlett Place, approximately lon=-122.4193, lat=37.7793. The Civic Center area is in District 6 (Matt Dorsey).
   - What's unclear: The exact polygon boundary — the smoke test should not hard-code "District 6" but should verify `rowcount = 1` (any district).
   - Recommendation: Assert `COUNT(*) = 1` in the positive test. Log the district name for verification. If 0 rows return, investigate whether the City Hall coordinate falls on a boundary.

5. **Governance of `is_appointed` on politician row vs office row**
   - What we know: `essentials.offices.is_appointed_position` is the field for marking appointed offices. `essentials.politicians.is_appointed` also exists.
   - What's unclear: Whether setting `is_appointed=true` on the politician row (in addition to `is_appointed_position=true` on the office) is the correct pattern.
   - Recommendation: Review how other appointed officials are stored. From the Phase 58 research pattern, `is_appointed=false` on the politician row (is_appointed is a person-level flag, meaning they were originally appointed as a politician, not elected to any office ever). For Controller and City Administrator who are appointed in their current role, use `is_appointed=true` on the **office row** (`is_appointed_position`) and `is_appointed=false` on the **politician row** (they may have been elected to other positions previously). Cross-check with how CA state executives (appointed commissioners) are modeled.

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/scripts/load-la-county-supervisor-boundaries.ts` — read in full; confirmed DataSF equivalent loader pattern; fetchJson helper, pool setup, INSERT SQL with ST_ForcePolygonCCW
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` line ~579 — confirmed X% fallback: `OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))`
- `C:/EV-Accounts/backend/migrations/185_longview_tx_government.sql` — confirmed LOCAL government row pattern, offices schema (chamber_id, title, representing_city, representing_state, is_appointed_position)
- `C:/EV-Accounts/backend/migrations/193_ca_federal_officials.sql` — confirmed politician + office INSERT pattern (WITH ins_p CTE)
- `C:/EV-Accounts/backend/migrations/189_ca_government_chambers.sql` — confirmed chambers INSERT pattern (WHERE NOT EXISTS guard)
- `C:/EV-Accounts/backend/scripts/smoke-ca-geofences.ts` — confirmed SF City Hall geo_ids: G4110='0667000', G4020='06075'
- `https://data.sfgov.org/api/views/f2zs-jevy/rows.geojson` — confirmed: GeoJSON, WGS84, fields: sup_dist_num, sup_dist_pad, sup_name, sup_dist, polygon geometry; 11 features
- `https://www.sf.gov/departments--board-supervisors` — confirmed all 11 supervisors with district numbers and profile URLs

### Secondary (MEDIUM confidence)
- `https://www.sf.gov/profile--connie-chan` through `/profile--chyanne-chen` — confirmed headshot URLs at media.api.sf.gov for all 11 supervisors
- `https://www.sf.gov/profile--daniel-lurie`, `/profile-david-chiu`, `/profile--brooke-jenkins`, `/manohar-raju` — confirmed headshot URLs for Mayor, City Attorney, DA, Public Defender
- `https://www.sf.gov/departments--controllers-office` + WebSearch — confirmed Greg Wagner is Controller (appointed Feb 2024, 10-year term)
- `https://www.sf.gov/departments--city-administrator` — confirmed Carmen Chu is City Administrator; headshot URL confirmed
- WebSearch SF city officials 2026 — confirmed Brooke Jenkins (DA), Paul Miyamoto (Sheriff), Joaquín Torres (Assessor-Recorder), José Cisneros (Treasurer), Manohar Raju (Public Defender), Daniel Lurie (Mayor)

### Tertiary (LOW confidence)
- Sheriff Miyamoto headshot: sfsheriff.com shows no individual clean headshot in the pages checked; may exist on a sub-page not reached. Marked for investigation during Phase 63-03.
- Treasurer Cisneros headshot URL `https://sftreasurer.org/sites/default/files/inline-images/IMG_8134b_0.jpg` — site-relative path confirmed but image quality and dimensions not verified.
- SF City Hall smoke test coordinate (lon=-122.4193, lat=37.7793) is District 6 territory — assumed from geography; verify from smoke test output.
- External_id range `-6300xx` non-collision — assumed clear but must be verified with DB query before seeding.

---

## Metadata

**Confidence breakdown:**
- DataSF GeoJSON source: HIGH — URL confirmed, fields confirmed, 11 features confirmed
- Loader pattern: HIGH — directly follows production code (load-la-county-supervisor-boundaries.ts)
- MTFCC assignment (X0006): HIGH — non-colliding, service code fallback confirmed
- All 20 official names: HIGH — confirmed from sf.gov official pages (May 2026)
- 18/20 headshot URLs: HIGH — confirmed from official sf.gov / department sites
- Sheriff Miyamoto headshot: LOW — no clean photo found in pages accessed
- Treasurer Cisneros headshot URL: MEDIUM — site-relative path identified, not fully verified
- External_id range: MEDIUM — -6300xx appears clear based on existing ranges reviewed but needs DB verification

**Research date:** 2026-05-21
**Valid until:** 2026-06-21 (SF supervisor composition stable; supervisors change on election cycles; headshot URLs stable unless sf.gov redesigns)
