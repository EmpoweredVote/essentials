# Phase 68: Berkeley Deep Seed - Research

**Researched:** 2026-05-22
**Domain:** Berkeley CA city government structure, Socrata GeoJSON geofence loader, CA city migration pattern
**Confidence:** HIGH (government structure, incumbents, geofence source, headshot URLs); MEDIUM (Socrata dataset completeness — 8 features confirmed by metadata, geometry confirmed real WGS84 for individual queries, but full bulk GeoJSON was truncated in WebFetch)

---

## Summary

Phase 68 seeds the City of Berkeley: one government row, chambers for Mayor + City Council + City Auditor (all popularly elected via RCV), 8 council district boundary geofences (MTFCC=X0009), 10 officials (Mayor + 8 Council Members + City Auditor), and headshots for all 10. An appointed City Manager and appointed City Attorney exist but are out of scope per CONTEXT.md decisions.

**Berkeley uses a district-based council model** — 8 geographic districts, each electing one council member. Mayor is elected citywide (at-large). City Auditor is elected citywide (at-large) via RCV. No at-large council seats exist beyond the Mayor position. Berkeley has NO formal "City Council President" role — instead, there is a "Vice-President of Council" appointed by the Mayor, not a separate elected office (no separate office row needed).

The geofence data source is the City of Berkeley Open Data portal (Socrata), dataset `c8zs-8y7x` ("CouncilDistricts"). This dataset has 8 features, field `district` (string "1"–"8"), real WGS84 MultiPolygon geometry, no reprojection needed. The Socrata resource API endpoint returns all 8 features.

**Primary recommendation:** Use 3 plans (68-01: geofences + government structure; 68-02: officials seed; 68-03: headshots). Follow Fremont (Phase 67) and SF (Phase 63) deep seed patterns. Use MTFCC `X0009` for Berkeley council district geofences. Use external_id range `-680xxx`.

---

## Critical Answers

### Does Berkeley have at-large seats beyond 8 districts?
**NO.** Berkeley has exactly 9 elected council seats: 1 Mayor (at-large citywide) + 8 District Council Members (one per district). No at-large council member seats exist separate from the Mayor. (Source: Berkeley city charter search results + berkeleyca.gov council roster confirming exactly 8 district seats + Mayor.)

### Does Berkeley have a formal City Council President role?
**NO formal City Council President.** Berkeley has a "Vice-President of Council" role that is appointed by the Mayor for a 1-year term. This is NOT a separate elected office — same as the SF Mandelman pattern (role only, no separate office row). Do NOT create a City Council President or Vice-President chamber or office row.

### Is City Attorney elected or appointed?
**APPOINTED.** The Berkeley City Attorney (currently Farimah Brown) is appointed by a vote of five members of the Council. She is NOT elected. Per charter: "City Attorney is appointed by the Council." Do NOT create a City Attorney elected chamber. (Source: Berkeley Charter section 113 search result + berkeley.municipal.codes/Charter/113.)

### Is City Auditor elected?
**YES, elected via RCV.** Current City Auditor is **Jenny Wong** (not Ann-Marie Hogan — she retired 2018). Jenny Wong was first elected November 2018, re-elected 2022. Current term expires November 2026. Jenny Wong's official page is at `https://berkeleyca.gov/your-government/city-audits/jenny-wong`. (Source: berkeleyca.gov confirmed.)

### Which Berkeley offices use RCV?
**Mayor, City Council (all 8 districts), and City Auditor** use ranked choice voting.
**Rent Stabilization Board and School Board** use plurality vote (not RCV).
(Source: berkeleyca.gov/your-government/elections/voting-information confirmed.)

### Is City Manager appointed?
**YES, appointed.** Current City Manager is **Paul Buddenhagen**. Do NOT create a City Manager office row in Phase 68 scope. (Source: berkeleyca.gov/your-government/about-us/departments/city-managers-office confirmed.)

---

## Current DB State

From Phase 57 (confirmed):
- `geo_id='0606000'`, `mtfcc='G4110'`, `state='06'` — Berkeley city/place boundary already in geofence_boundaries
- Berkeley FIPS place code: `0606000`
- No `essentials.governments` row for Berkeley yet
- No `essentials.districts` row for `geo_id='0606000'` yet (geofence loading does not create districts rows)
- X0009 is unclaimed — sequence: X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont, X0009=Berkeley
- **Next migration is 213** (212_fremont_headshots.sql is AUDIT-ONLY, not in ledger sequence)

**After Phase 68:**
- 8 new rows in geofence_boundaries: `geo_id='berkeley-council-district-{N}'`, `mtfcc='X0009'`, `state='06'`
- 1 governments row: `'City of Berkeley'`
- 3 chambers: Mayor, City Council, City Auditor
- 8 districts rows (LOCAL) + 1 Berkeley-wide district row (LOCAL_EXEC for Mayor + Auditor)
- 10 politicians + 10 offices

---

## Standard Stack

### Core Tools

| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `load-berkeley-council-boundaries.ts` (new) | Fetches Socrata GeoJSON, upserts 8 rows into geofence_boundaries | TypeScript Socrata loader — copy SF pattern (load-sf-supervisor-boundaries.ts) |
| `pg` (Pool) | PostgreSQL client | Already in package.json |
| Node.js `https` module (built-in) | Fetches GeoJSON from Socrata endpoint | No extra HTTP library needed |
| `dotenv` | Loads DATABASE_URL from .env | Standard pattern |

### Data Source

| Resource | URL | Format | Auth |
|---------|-----|--------|------|
| Berkeley Council Districts (Socrata `c8zs-8y7x`) | `https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50` | GeoJSON WGS84 (MultiPolygon) | None (public) |
| Dataset page | `https://data.cityofberkeley.info/City-Government/CouncilDistricts/c8zs-8y7x` | Reference | None |
| Older dataset (do NOT use) | `https://data.cityofberkeley.info/City-Government/Council-Districts/b2uf-vm3c` | Old, returns empty properties | None |

**Source data fields (confirmed from Socrata resource API):**

| Field | Type | Purpose |
|-------|------|---------|
| `district` | String | District number "1"–"8" |
| `dist_name` | String | "CITY OF BERKELEY, DISTRICT #{N}" |
| `members` | Numeric | Always 1.0 |
| `the_geom` | MultiPolygon | WGS84 geometry (no reprojection needed) |

**Feature count:** Exactly 8 (confirmed from dataset metadata `"count":"8"` on both district and dist_name columns).

**Geometry CRS:** WGS84 (EPSG:4326) — Socrata data portal serves GeoJSON in WGS84 natively. **No `outSR=4326` parameter needed** (unlike ArcGIS endpoints used for SD and Fremont).

**Dataset notes:**
- Dataset `c8zs-8y7x` is the current one with actual geometry. The older `b2uf-vm3c` returns empty properties and should NOT be used.
- The `district` field is a STRING (e.g., "1", "2"), not an integer. Use `parseInt()` in loader.
- The rows.geojson endpoint (`/api/views/c8zs-8y7x/rows.geojson`) appears to return only a subset — use the resource API instead: `https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50`.

**Individual district geometry confirmed WGS84:**
Sample coordinate from District 1: `[-122.29623110145083, 37.883411978203796]` — confirms longitude near -122, latitude near 37-38. Valid WGS84.

---

## MTFCC Assignment

**Use `X0009`** for Berkeley council district geofences.

| MTFCC | Used for | Source |
|-------|---------|--------|
| X0005 | LA County supervisor districts | load-la-county-supervisor-boundaries.ts |
| X0006 | SF supervisor districts | Phase 63 |
| X0007 | SD council districts | Phase 65 |
| X0008 | Fremont council districts | Phase 67 |
| **X0009** | **Berkeley council districts** | **Phase 68 — new** |

**Why X0009 works:** `essentialsService.ts` has fallback rule: `OR (gb.mtfcc LIKE 'X%' AND gb.mtfcc NOT IN ('X0001','X0002','X0003','X0004') AND d.district_type IN ('LOCAL', 'COUNTY'))`. X0009 falls through this fallback. No service code change required.

**Pre-flight check (mandatory in loader):** `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE mtfcc='X0009';` → must return 0 before first run.

---

## Berkeley Government Structure

Berkeley uses a **Council-Manager** form of government. The City Council is the legislative body; an appointed City Manager runs day-to-day operations.

**Elected positions (3 types — 10 total seats):**
- Mayor (citywide at-large, 4-year term, RCV)
- City Council (8 district seats, one per district, 4-year terms, RCV)
- City Auditor (citywide at-large, 4-year term, RCV)

**Appointed — NOT in scope for elected chambers:**
- City Attorney: Farimah Brown — appointed by City Council vote of 5 members
- City Manager: Paul Buddenhagen — appointed by City Council

**NOT a separate elected office:**
- Vice-President of Council: appointed by Mayor for 1-year term — not a separate office row

**Key charter confirmation:** Berkeley's Charter states elective officers consist of: Mayor, 8 Councilmembers, Auditor, School Board directors, and Rent Stabilization Board commissioners. For Phase 68 scope: Mayor + Council + Auditor are the only ones to seed (School Board and Rent Board are separate bodies out of scope).

### All 10 Current Incumbents (May 2026)

| Role | Name | District/Scope | Term Expires | Notes |
|------|------|----------------|-------------|-------|
| Mayor | Adena Ishii | Citywide | November 30, 2028 | First elected Nov 2024; first Asian American + first woman of color as Berkeley Mayor; sworn in Dec 6, 2024 |
| Council District 1 | Rashi Kesarwani | District 1 | November 30, 2026 | Incumbent |
| Council District 2 | Terry Taplin | District 2 | November 30, 2028 | Incumbent |
| Council District 3 | Ben Bartlett | District 3 | November 30, 2028 | Incumbent |
| Council District 4 | Igor Tregub | District 4 | November 30, 2026 | Incumbent |
| Council District 5 | Shoshana O'Keefe | District 5 | November 30, 2028 | Elected Nov 2024 |
| Council District 6 | Brent Blackaby | District 6 | November 30, 2028 | Elected Nov 2024 |
| Council District 7 | Cecilia Lunaparra | District 7 | November 30, 2026 | Incumbent |
| Council District 8 | Mark Humbert | District 8 | November 30, 2026 | Incumbent |
| City Auditor | Jenny Wong | Citywide | November 30, 2026 | First elected Nov 2018; re-elected 2022; NOT Ann-Marie Hogan (retired 2018) |

**Source:** berkeleyca.gov/your-government/city-council/council-roster (fetched 2026-05-22).

**2026 election context:** Districts 1, 4, 7, 8 and City Auditor are up for election November 2026 (term expires Nov 30, 2026). Mayor, D2, D3, D5, D6 up in 2028.

---

## External ID Scheme

**Use `-680xxx` range for Berkeley officials.**

| Official | External ID |
|---------|------------|
| Mayor Adena Ishii | -680001 |
| City Auditor Jenny Wong | -680002 |
| Council District 1 — Rashi Kesarwani | -680010 |
| Council District 2 — Terry Taplin | -680011 |
| Council District 3 — Ben Bartlett | -680012 |
| Council District 4 — Igor Tregub | -680013 |
| Council District 5 — Shoshana O'Keefe | -680014 |
| Council District 6 — Brent Blackaby | -680015 |
| Council District 7 — Cecilia Lunaparra | -680016 |
| Council District 8 — Mark Humbert | -680017 |

**Why -680xxx is safe:**
- -6000xxx = CA state executives
- -6001xxx = CA State Senate
- -6002xxx = CA State Assembly
- -6003xxx = CA Governor challengers
- -6004xxx = LAUSD board
- -630xxx = SF officials (Phase 63)
- -650xxx = SD officials (Phase 65)
- -670xxx = Fremont officials (Phase 67)
- -680xxx is the natural next step (phase 68 prefix)

**Context.md pre-flight check confirmation:** External ID scheme `-680001` (Mayor) and `-680010` through `-680017` (D1-D8) matches the CONTEXT.md locked decision. Verify pre-flight: `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -681000 AND -680000;` → must return 0 rows.

---

## Headshot Sources

**berkeleyca.gov publishes official headshots** at a consistent base path. The URL pattern is NOT fully uniform but all files are reachable. The base URL is:
`https://berkeleyca.gov/sites/default/files/elected-office-holder/{filename}`

| Official | Confirmed URL |
|---------|--------------|
| Mayor Adena Ishii | `https://berkeleyca.gov/sites/default/files/elected-office-holder/adena-ishii.jpg` |
| City Auditor Jenny Wong | `https://berkeleyca.gov/sites/default/files/elected-office-holder/Jenny_Wong.jpg` |
| D1 Rashi Kesarwani | `https://berkeleyca.gov/sites/default/files/elected-office-holder/kesarwani.jpg` |
| D2 Terry Taplin | `https://berkeleyca.gov/sites/default/files/elected-office-holder/Terry%20Taplin.jpg` |
| D3 Ben Bartlett | `https://berkeleyca.gov/sites/default/files/elected-office-holder/Ben-Bartlet.jpg` |
| D4 Igor Tregub | `https://berkeleyca.gov/sites/default/files/elected-office-holder/Igor-Tregub-headshot.jpg` |
| D5 Shoshana O'Keefe | `https://berkeleyca.gov/sites/default/files/elected-office-holder/OKeefe240628-499.jpg` |
| D6 Brent Blackaby | `https://berkeleyca.gov/sites/default/files/elected-office-holder/brent_blackaby_square_headshot-medium.jpg` |
| D7 Cecilia Lunaparra | `https://berkeleyca.gov/sites/default/files/elected-office-holder/cecilia-lunaparra.jpg` |
| D8 Mark Humbert | `https://berkeleyca.gov/sites/default/files/elected-office-holder/Mark-Humbert-300px.jpg` |

**Confidence level:** HIGH — all 10 URLs confirmed by fetching each individual council member page at `https://berkeleyca.gov/your-government/city-council/council-roster/{name}`.

**Source page for each:** `https://berkeleyca.gov/your-government/city-council/council-roster/{slug}` where slug is the hyphenated name (e.g., `adena-ishii`, `rashi-kesarwani`). City Auditor is at `https://berkeleyca.gov/your-government/city-audits/jenny-wong`.

**Berkeley vs Fremont headshot access:** Unlike fremont.gov (which returns HTTP 403 on all automated requests), berkeleyca.gov does NOT appear to block automated fetches — headshots were confirmed accessible via WebFetch. However, test with actual HTTP GET before assuming — the council roster page itself returned 403 on one test, suggesting some pages may be accessible while others are not.

**Photo license:** All images are official city government portraits hosted on Berkeley's official website → `public_domain`.

**Processing required:** Crop to 4:5 ratio first, then resize to 600×750 Lanczos q90 (per project standard). The source images have varying dimensions (e.g., brent_blackaby_square_headshot-medium.jpg is described as "square" — would need to be cropped to 4:5 before resizing; OKeefe240628-499.jpg likely a specific pixel width). Confirm dimensions after download before processing.

---

## Architecture Patterns

### Recommended File Structure

```
C:/EV-Accounts/backend/scripts/
├── load-berkeley-council-boundaries.ts    # NEW: Socrata fetch + upsert 8 Berkeley council polygons
└── smoke-berkeley-geofences.ts            # NEW: Berkeley smoke test (3 gates)

C:/EV-Accounts/backend/migrations/
├── 213_berkeley_government_structure.sql  # NEW: government + chambers + 8 districts + 1 citywide district
├── 214_berkeley_officials.sql             # NEW: 10 politicians + 10 offices
└── 215_berkeley_headshots.sql             # NEW: politician_images inserts (audit file, applied manually)
```

**Note on 215:** Like 212 (Fremont) and 209 (SD) and 200 (SF), the headshots migration is AUDIT-ONLY — not applied via Supabase migrations ledger.

### Pattern 1: Socrata GeoJSON Fetch (same as SF supervisor boundaries loader)

**CRITICAL DIFFERENCE FROM FREMONT/SD:** Berkeley uses Socrata (data.cityofberkeley.info), NOT ArcGIS. Socrata returns WGS84 geometry natively — **no `outSR=4326` parameter needed**. Use the resource API endpoint, not `rows.geojson`.

```typescript
// Source: adapted from load-sf-supervisor-boundaries.ts
// NO outSR needed — Socrata always returns WGS84

const SOCRATA_URL =
  'https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50';

const MTFCC          = 'X0009';
const STATE          = '06';
const SOURCE         = 'berkeley_city_council_districts_2022';
const EXPECTED_COUNT = 8;
const MAX_DISTRICT   = 8;
```

**Per-feature mapping:**
```typescript
const rawDistrict = props['district'];  // NOTE: lowercase 'district', string type
const distNum = parseInt(String(rawDistrict ?? ''), 10);
if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
  console.warn(`WARNING: district value '${rawDistrict}' out of range — skipping`);
  continue;
}
const geoId = `berkeley-council-district-${distNum}`;
const name  = `District ${distNum}`;
// Do NOT use dist_name (format: "CITY OF BERKELEY, DISTRICT #N") for the boundary name
// Construct from distNum for consistency with SD/Fremont pattern
```

### Pattern 2: Government Row

```sql
-- governments has NO unique constraint on geo_id — use WHERE NOT EXISTS
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(),
       'City of Berkeley',
       'LOCAL', 'CA', 'Berkeley', '0606000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Berkeley' AND state = 'CA'
);
```

### Pattern 3: Chambers

**Berkeley has 3 elected office types — 3 chambers:**

```sql
-- City Council chamber (district-based, 8 seats)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Berkeley City Council',
       (SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
);

-- Mayor chamber (citywide)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of Berkeley',
       (SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
);

-- City Auditor chamber (citywide, elected via RCV)
-- RCV NOTE: Mayor, City Council, and City Auditor all use RCV in Berkeley
-- election_method='rcv' will be set on races rows in Phase 69 — NOT on office rows
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Auditor', 'City Auditor of Berkeley',
       (SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Auditor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
);
```

**Do NOT add a City Attorney chamber** — Berkeley's City Attorney is appointed by City Council.
**Do NOT add a Vice-President chamber** — appointed role, not a separate elected position.

### Pattern 4: Districts Rows

```sql
-- 8 council district rows (label column, per established pattern)
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT v.geo_id, v.district_type, v.label, v.state
FROM (VALUES
  ('berkeley-council-district-1', 'LOCAL', 'District 1', 'CA'),
  ('berkeley-council-district-2', 'LOCAL', 'District 2', 'CA'),
  ('berkeley-council-district-3', 'LOCAL', 'District 3', 'CA'),
  ('berkeley-council-district-4', 'LOCAL', 'District 4', 'CA'),
  ('berkeley-council-district-5', 'LOCAL', 'District 5', 'CA'),
  ('berkeley-council-district-6', 'LOCAL', 'District 6', 'CA'),
  ('berkeley-council-district-7', 'LOCAL', 'District 7', 'CA'),
  ('berkeley-council-district-8', 'LOCAL', 'District 8', 'CA')
) AS v(geo_id, district_type, label, state)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts d
  WHERE d.geo_id = v.geo_id AND d.district_type = v.district_type AND d.state = v.state
);

-- Berkeley-wide LOCAL_EXEC district for Mayor + Auditor offices
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0606000', 'LOCAL_EXEC', 'Berkeley (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0606000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);
```

**Critical note:** Column is `label` (not `name`). No unique constraint on (geo_id, district_type) — use WHERE NOT EXISTS guards only.

### Pattern 5: Politician + Office INSERT (WITH ins_p CTE)

```sql
-- Mayor Adena Ishii (RCV note: Mayor office uses RCV — flag for Phase 69)
-- RCV offices: Mayor (-680001), Auditor (-680002), all 8 council members (-680010..-680017)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Adena Ishii', 'Adena', 'Ishii', NULL, true, false, false, true, -680001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='Mayor'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0606000' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- City Auditor Jenny Wong (RCV: City Auditor also uses RCV — flag for Phase 69)
-- Auditor links to LOCAL_EXEC district (same as Mayor — citywide office)
-- ...same CTE pattern, chamber='City Auditor', geo_id='0606000', title='City Auditor'

-- Council members: use berkeley-council-district-{N} geo_id, chamber='City Council',
--   title='Council Member (District N)' per CONTEXT.md locked decision
```

**Office titles:**
- Mayor: `'Mayor'`
- City Auditor: `'City Auditor'`
- Council members: `'Council Member (District N)'` where N=1..8 — per CONTEXT.md locked decision

### Pattern 6: geo_id Construction

```typescript
const geoId = `berkeley-council-district-${distNum}`;  // e.g. 'berkeley-council-district-1' through '-8'
// ocd_id = same as geoId (no formal OCD division registered)
```

### Pattern 7: RCV SQL Comments in Migration

Per CONTEXT.md decision: add SQL comments on every Berkeley office that uses RCV, to flag them for Phase 69 elections seeding.

```sql
-- RCV NOTE (Phase 69): Mayor office uses ranked choice voting (Berkeley adopted RCV 2004, active since 2010)
-- RCV NOTE (Phase 69): City Auditor office uses ranked choice voting
-- RCV NOTE (Phase 69): Council District N office uses ranked choice voting
```

**ALL 10 Berkeley elected offices use RCV** — Mayor, all 8 Council Districts, and City Auditor.

### Pattern 8: Smoke Test (3 gates)

```typescript
// Gate 1: 8 Berkeley council district geofence rows
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE geo_id LIKE 'berkeley-council-district-%' AND mtfcc='X0009' AND state='06';
// Expected: 8

// Gate 2: Berkeley City Hall (2180 Milvia Street; approx lon=-122.2726, lat=37.8709)
// → returns 1 council district
SELECT geo_id, name FROM essentials.geofence_boundaries
WHERE mtfcc='X0009' AND geo_id LIKE 'berkeley-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.2726, 37.8709), 4326));
// Expected: 1 row (assert rowCount=1; log the district — likely D5 or D4 area, but do NOT hardcode)

// Gate 3: Oakland point → 0 rows (outside Berkeley)
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE mtfcc='X0009' AND geo_id LIKE 'berkeley-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-122.2711, 37.8044), 4326));
// Expected: 0 (Oakland, CA)
```

**Berkeley City Hall address:** 2180 Milvia Street, Berkeley, CA 94704 (confirmed from berkeleyca.gov contact info). Approximate coordinates: -122.2726 lon, 37.8709 lat. Verify centroid coordinates before finalizing smoke test.

### Anti-Patterns to Avoid

- **Using `outSR=4326` on Socrata URL:** Socrata returns WGS84 natively — this parameter is not needed and may cause errors (unlike ArcGIS endpoints for SD/Fremont).
- **Using the old dataset `b2uf-vm3c`:** Returns empty properties. Use `c8zs-8y7x` only.
- **Using `rows.geojson` endpoint:** Returns only a partial subset. Use the Socrata resource API: `https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50`.
- **Creating a City Attorney chamber:** Berkeley's City Attorney is appointed by City Council. Do NOT add it.
- **Creating a City Council President or Vice-President chamber:** No such separate elected office in Berkeley.
- **Seeding Ann-Marie Hogan as City Auditor:** She retired in 2018. Current auditor is Jenny Wong.
- **Using integer for district field in Socrata data:** The `district` field is a STRING ("1"–"8"), not an integer. Always wrap in `parseInt(String(...), 10)`.
- **Using dist_name for boundary name:** `dist_name` is "CITY OF BERKELEY, DISTRICT #N". Construct boundary name as `District N` from the distNum integer for consistency.
- **Missing LOCAL_EXEC district for both Mayor AND Auditor:** Both the Mayor and City Auditor are citywide offices; both will FK to the single `geo_id='0606000'` LOCAL_EXEC district row.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Socrata GeoJSON fetch | Custom REST client | `fetchJson()` helper from load-sf-supervisor-boundaries.ts | Already handles redirects, JSON parse, HTTP/HTTPS |
| Geometry reprojection | proj4js | Already WGS84 from Socrata | No reprojection step needed for Socrata data |
| Idempotent insert | DELETE + INSERT | `ON CONFLICT (geo_id, mtfcc) DO NOTHING` | Standard pattern throughout codebase |
| Council district routing | Custom query | Standard `X%` fallback in `essentialsService.ts` | X0009 falls through without any code changes |
| Headshot resizing | Raw upload | ImageMagick: crop to 4:5 first, then resize to 600×750, Lanczos, q90 | Per project standard |

---

## Common Pitfalls

### Pitfall 1: Using ArcGIS Pattern for Berkeley (outSR=4326)

**What goes wrong:** Loader includes `&outSR=4326` in the URL (copied from SD/Fremont ArcGIS pattern) when calling the Socrata endpoint.
**Why it happens:** SD and Fremont used ArcGIS; researcher might copy constants without verifying data source type.
**How to avoid:** Berkeley uses Socrata data portal (data.cityofberkeley.info). Socrata GeoJSON is already in WGS84. The `outSR` parameter is an ArcGIS-only parameter — Socrata ignores or rejects it.
**Warning signs:** Loader runs but returns 0 features or HTTP error.

### Pitfall 2: Wrong Socrata Dataset (b2uf-vm3c vs c8zs-8y7x)

**What goes wrong:** Loader uses `b2uf-vm3c` (the first search result). That dataset returns empty properties `"properties":{}` — no field values.
**Why it happens:** Search results return both datasets; the first hit is the older one.
**How to avoid:** Use `c8zs-8y7x` ("CouncilDistricts") — confirmed 8 features with real geometry and `district` field. URL: `https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50`.
**Warning signs:** Loader reads 0 valid district values from all features.

### Pitfall 3: Using rows.geojson Endpoint

**What goes wrong:** Loader uses `/api/views/c8zs-8y7x/rows.geojson` — returns only a partial subset (2 features instead of 8).
**Why it happens:** SF pattern used `rows.geojson` on DataSF; blindly copying that pattern to Berkeley Socrata.
**How to avoid:** Use the resource API: `https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50`. This returns all 8 features.
**Warning signs:** Feature count assertion fires at 2 instead of 8.

### Pitfall 4: Missing City Auditor Chamber

**What goes wrong:** Only Mayor + City Council chambers are created (following Fremont 2-chamber pattern). City Auditor is omitted.
**Why it happens:** Fremont had no elected auditor; researcher copies Fremont's 2-chamber structure.
**How to avoid:** Berkeley has 3 elected office types: Mayor, City Council, and City Auditor (all via RCV). Create 3 chambers. City Auditor Jenny Wong must have an office row under the 'City Auditor' chamber.
**Warning signs:** Jenny Wong has no chamber link; office row INSERT fails with FK violation.

### Pitfall 5: Incorrect City Auditor Name

**What goes wrong:** Seeding Ann-Marie Hogan as City Auditor (cited in CONTEXT.md as an early assumption).
**Why it happens:** CONTEXT.md mentioned Ann-Marie Hogan but she retired in December 2018. Research revealed this is out of date.
**How to avoid:** Current City Auditor is **Jenny Wong** (elected Nov 2018, re-elected 2022, term expires Nov 2026). Confirmed via `https://berkeleyca.gov/your-government/city-audits/jenny-wong`.

### Pitfall 6: Auditor District Assignment

**What goes wrong:** City Auditor Jenny Wong's office gets assigned to a council district geo_id instead of the citywide LOCAL_EXEC district.
**Why it happens:** 8 council district rows exist; mistakenly assigning auditor to one of them.
**How to avoid:** City Auditor is a citywide office → must link to `geo_id='0606000'` LOCAL_EXEC district, same as the Mayor. NOT a district geo_id.

### Pitfall 7: Districts Column Name (`label` not `name`)

**What goes wrong:** Migration uses `name` column: `INSERT INTO essentials.districts (geo_id, district_type, name, state)` — fails with column-not-found.
**How to avoid:** Use `label` (confirmed from migration 205 SF).

### Pitfall 8: Berkeley-Wide District Row Missing

**What goes wrong:** Mayor and Auditor offices have no `district_id` because no LOCAL_EXEC district row exists for `geo_id='0606000'`.
**How to avoid:** Migration 213 must create: `INSERT INTO essentials.districts (geo_id, district_type, label, state) SELECT '0606000', 'LOCAL_EXEC', 'Berkeley (Citywide)', 'CA' WHERE NOT EXISTS (...)`.

### Pitfall 9: Council Title Format

**What goes wrong:** Council members get title `'Council Member'` instead of `'Council Member (District N)'`.
**How to avoid:** CONTEXT.md locked decision: title format is `'Council Member (District N)'` — includes the district number in parentheses.

### Pitfall 10: Headshot URL Inconsistency

**What goes wrong:** Assuming all headshots follow pattern `/sites/default/files/elected-office-holder/{lastname}.jpg` — many don't.
**Why it happens:** The URL pattern is inconsistent across officials (some use full name, some use lastname only, some have extra suffixes like `-headshot`, `-300px`, `240628-499`).
**How to avoid:** Use the confirmed specific URLs per official listed in the headshot sources table above. Do not construct URLs — use the confirmed paths.

### Pitfall 11: Section-Split Bug

**What goes wrong:** After seeding, section-split checker shows split sections for Berkeley city government.
**How to avoid:** Run section-split check SQL (from `feedback_section_split_check.md` project memory) after migration 214. Zero rows = clean.

---

## Code Examples

### ArcGIS Loader Core (Berkeley Socrata constants)

```typescript
// Source: adapted from load-sf-supervisor-boundaries.ts
// KEY DIFFERENCE: Berkeley uses Socrata, NOT ArcGIS.
// Socrata returns WGS84 natively — NO outSR=4326 needed.
// Dataset: c8zs-8y7x (CouncilDistricts) — NOT b2uf-vm3c (old, empty properties)
// Endpoint: resource API (?$limit=50) — NOT rows.geojson (returns partial subset)

const SOCRATA_URL =
  'https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?$limit=50';

const MTFCC          = 'X0009';
const STATE          = '06';
const SOURCE         = 'berkeley_city_council_districts_2022';
const EXPECTED_COUNT = 8;
const MAX_DISTRICT   = 8;

// Per-feature loop:
for (const feature of geojson.features) {
  const props = feature.properties || {};
  const rawDistrict = props['district'];  // lowercase 'district', string type
  const distNum = parseInt(String(rawDistrict ?? ''), 10);

  if (isNaN(distNum) || distNum < 1 || distNum > MAX_DISTRICT) {
    console.warn(`  WARNING: district value '${rawDistrict}' out of range — skipping`);
    continue;
  }

  const geoId = `berkeley-council-district-${distNum}`;
  const name  = `District ${distNum}`;  // stable constructed name, NOT dist_name
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

### Government Structure SQL (migration 213)

```sql
BEGIN;

-- Government row
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Berkeley', 'LOCAL', 'CA', 'Berkeley', '0606000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Berkeley' AND state = 'CA'
);

-- 3 chambers (slug is GENERATED — never include in INSERT)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Berkeley City Council',
       (SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
);

INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of Berkeley',
       (SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
);

-- RCV NOTE (Phase 69): City Auditor uses ranked choice voting
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Auditor', 'City Auditor of Berkeley',
       (SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers WHERE name='City Auditor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')
);

-- 8 council district rows (label column)
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT v.geo_id, v.district_type, v.label, v.state
FROM (VALUES
  ('berkeley-council-district-1', 'LOCAL', 'District 1', 'CA'),
  ('berkeley-council-district-2', 'LOCAL', 'District 2', 'CA'),
  ('berkeley-council-district-3', 'LOCAL', 'District 3', 'CA'),
  ('berkeley-council-district-4', 'LOCAL', 'District 4', 'CA'),
  ('berkeley-council-district-5', 'LOCAL', 'District 5', 'CA'),
  ('berkeley-council-district-6', 'LOCAL', 'District 6', 'CA'),
  ('berkeley-council-district-7', 'LOCAL', 'District 7', 'CA'),
  ('berkeley-council-district-8', 'LOCAL', 'District 8', 'CA')
) AS v(geo_id, district_type, label, state)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts d
  WHERE d.geo_id = v.geo_id AND d.district_type = v.district_type AND d.state = v.state
);

-- Berkeley-wide LOCAL_EXEC for Mayor + Auditor offices
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0606000', 'LOCAL_EXEC', 'Berkeley (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0606000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);

COMMIT;
```

### Officials Seed Pattern (migration 214)

```sql
-- Council District 1 — Rashi Kesarwani
-- RCV NOTE (Phase 69): Council District 1 uses ranked choice voting
WITH ins_p AS (
  INSERT INTO essentials.politicians (id, full_name, first_name, last_name, party,
    is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Rashi Kesarwani', 'Rashi', 'Kesarwani', NULL,
          true, false, false, true, -680010)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title,
  representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='City Council'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')),
       p.id,
       'Council Member (District 1)', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'berkeley-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- Repeat pattern for D2-D8 with appropriate geo_ids, external_ids, names, and titles

-- City Auditor Jenny Wong — uses LOCAL_EXEC district (citywide)
-- RCV NOTE (Phase 69): City Auditor uses ranked choice voting
WITH ins_p AS (
  INSERT INTO essentials.politicians (id, full_name, first_name, last_name, party,
    is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jenny Wong', 'Jenny', 'Wong', NULL,
          true, false, false, true, -680002)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title,
  representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='City Auditor'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Berkeley' AND state='CA')),
       p.id,
       'City Auditor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0606000'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

---

## Differences from Fremont and SF Deep Seed Patterns

| Topic | SF (Phase 63) | Fremont (Phase 67) | Berkeley (Phase 68) |
|-------|--------------|-------------------|---------------------|
| Geofence data source | DataSF Socrata (f2zs-jevy) | ArcGIS FeatureServer | City of Berkeley Socrata (c8zs-8y7x) |
| outSR needed | NO | YES (WKID 102643) | NO (Socrata = WGS84) |
| Field name | `sup_dist_num` (float) | `DISTRICT` (int) | `district` (string) |
| Feature count | 11 | 6 | 8 |
| MTFCC | X0006 | X0008 | X0009 |
| geo_id pattern | `sf-supervisor-district-{N}` | `fremont-council-district-{N}` | `berkeley-council-district-{N}` |
| Council title | "Supervisor" | "Council Member" | "Council Member (District N)" |
| Government name | "City and County of San Francisco" | "City of Fremont" | "City of Berkeley" |
| TIGER geo_id | `0667000` | `0626000` | `0606000` |
| City Attorney | YES elected (chamber + office) | NO (appointed) | NO (appointed) |
| City Auditor | YES elected | NO (no auditor) | YES elected (RCV) |
| Chambers count | 10 | 2 | 3 |
| Officials count | 20 | 7 | 10 |
| External_id range | -630xxx | -670xxx | -680xxx |
| Migrations | 205-207 | 210-212 | 213-215 |
| RCV | No (SF uses plurality) | No | Yes — ALL 10 offices use RCV |

---

## Open Questions

1. **Berkeley City Hall coordinate precision for smoke test**
   - What we know: Berkeley City Hall is at 2180 Milvia Street. Approximate coordinates: lon=-122.2726, lat=37.8709 (from standard geocoordinate lookup).
   - What's unclear: Which district the City Hall point falls in (D4 is likely based on west-central Berkeley location, but not verified via PostGIS).
   - Recommendation: Gate 2 smoke test should assert only `rowCount=1` (log the district, don't hard-code). Executor should confirm the coordinate resolves to exactly 1 district after geofences are loaded.

2. **Socrata feature count discrepancy: rows.geojson vs resource API**
   - What we know: `rows.geojson` returned only 2 features; resource API `c8zs-8y7x.geojson?$limit=50` returned 8 features (confirmed by metadata and $select query).
   - Recommendation: Use resource API. Add pre-flight assertion: feature count must equal 8 after fetching. If count is 0 or 2, abort and investigate the endpoint.

3. **berkeleyca.gov automated fetch accessibility**
   - What we know: Individual council member profile pages returned headshot URLs via WebFetch. The council roster page itself returned 403 on one attempt. fremont.gov blocked all automated requests.
   - What's unclear: Whether berkeleyca.gov will allow direct HTTP GETs for the headshot images in the loader script.
   - Recommendation: Plan 03 should attempt direct URL download first. If berkeley.gov returns 403 like fremont.gov, the executor can use a browser User-Agent + Referer header pattern (same workaround that succeeded for Fremont's 403).

4. **Headshot image dimensions**
   - What we know: Each confirmed URL has varying filenames (some say "square", "300px", "499"). The brent_blackaby_square_headshot-medium.jpg is square-cropped; OKeefe240628-499.jpg is 499px wide.
   - Recommendation: After download, run `identify` (ImageMagick) on each file to determine actual dimensions before cropping. Standard processing: crop center to 4:5 ratio first, then resize to 600×750 Lanczos q90.

5. **Pre-existing Berkeley government rows**
   - What we know: Berkeley city boundary geo_id='0606000' is in geofence_boundaries (Phase 57). CA pre-existing seed was a concern for CA state entities but did not touch Berkeley local government.
   - Recommendation: Standard pre-flight check — `SELECT COUNT(*) FROM essentials.governments WHERE name='City of Berkeley';` must return 0 before migration 213.

---

## Sources

### Primary (HIGH confidence)
- `https://berkeleyca.gov/your-government/city-council/council-roster` — all 9 council members with term expiry dates confirmed
- Individual council member pages at `https://berkeleyca.gov/your-government/city-council/council-roster/{slug}` — all 10 headshot URLs confirmed
- `https://berkeleyca.gov/your-government/city-audits/jenny-wong` — City Auditor Jenny Wong confirmed, term through Nov 2026
- `https://berkeleyca.gov/your-government/about-us/departments/city-managers-office` — City Manager Paul Buddenhagen confirmed appointed
- `https://berkeleyca.gov/your-government/about-us/departments/city-attorney` — City Attorney Farimah Brown confirmed appointed
- `https://data.cityofberkeley.info/api/views/c8zs-8y7x.json` — dataset metadata: 8 rows, `district` field (string), `the_geom` (multipolygon)
- `https://data.cityofberkeley.info/resource/c8zs-8y7x.geojson?district=1` — WGS84 geometry confirmed (coords: -122.29623, 37.88341)
- `https://berkeleyca.gov/your-government/elections/voting-information` — confirmed RCV offices: Mayor, City Council, Auditor; plurality: Rent Board, School Board
- `C:/Transparent Motivations/essentials/.planning/STATE.md` — next migration = 213; Berkeley geo_id = '0606000' confirmed; X0009 unclaimed
- `C:/Transparent Motivations/essentials/.planning/phases/67-fremont-deep-seed/67-RESEARCH.md` — established patterns for loader, migration, smoke test

### Secondary (MEDIUM confidence)
- WebSearch "Berkeley California city council districts 2026 at-large members charter" — confirmed 8 districts, no at-large council beyond Mayor, Auditor elected
- WebSearch "Berkeley California city council president 2026" — confirmed Vice-President of Council (appointed by Mayor, not elected office)
- WebSearch "Berkeley California RCV ranked choice voting mayor auditor" — confirmed Mayor/Council/Auditor use RCV; Rent Board/School Board use plurality
- Alameda County RCV results page `https://alamedacountyca.gov/rovresults/rcv/252/rcvresults.htm?race=Berkeley/001-Mayor` — confirms RCV for Mayor race
- WebSearch "Berkeley California city manager city attorney 2026 appointed" — confirmed appointed status for both
- `https://gis.cityofberkeley.info/arcgis/rest/services` — Berkeley has ArcGIS server but no council district layers visible (confirmed: no usable ArcGIS endpoint for council districts; use Socrata instead)

### Tertiary (LOW confidence)
- Berkeley City Hall coordinates (-122.2726, 37.8709) — approximate from general geocoordinate search; unverified via PostGIS
- Oakland negative test coordinates (-122.2711, 37.8044) — approximate, sufficient for Gate 3 boundary test

---

## Metadata

**Confidence breakdown:**
- Government structure (8 districts, no at-large council, no City Council President): HIGH — multiple official sources confirmed
- City Auditor elected (Jenny Wong, not Ann-Marie Hogan): HIGH — berkeleycca.gov official page confirmed
- All 10 incumbent names + terms: HIGH — berkeleycca.gov council roster confirmed
- RCV offices (Mayor + Council + Auditor): HIGH — berkeleycca.gov elections page + Alameda County RCV results confirmed
- Geofence data source (Socrata c8zs-8y7x, 8 features, `district` field, WGS84): HIGH — API queries confirmed
- Headshot URLs (all 10 specific paths): HIGH — each individual council member page fetched and URL extracted
- MTFCC assignment (X0009): HIGH — sequence confirmed from STATE.md
- External_id range (-680xxx): HIGH — pattern confirmed from prior phases, range clear
- City Attorney/Manager appointed: HIGH — confirmed from berkeleycca.gov department pages + charter reference
- Smoke test Berkeley City Hall coordinate: MEDIUM — approximate

**Research date:** 2026-05-22
**Valid until:** 2026-07-15 (incumbents stable until November 2026 election; D1/D4/D7/D8/Auditor up for re-election Nov 2026 — terms expire Nov 30, 2026)
