# Phase 64: San Jose Deep Seed - Research

**Researched:** 2026-05-22
**Domain:** San Jose city government structure, ArcGIS council district geofences, incumbent roster, headshot sourcing
**Confidence:** HIGH

---

## Summary

San Jose has 10 council districts (plus citywide Mayor), all served by a single ArcGIS MapServer at `geo.sanjoseca.gov`. The endpoint uses State Plane CA Zone 3 (WKID 102643) natively — **outSR=4326 is required**, identical to the Fremont/SD pattern. The district integer field is `DISTRICTINT` (integer 1–10). The `COUNCILMEMBER` field confirms all 10 current incumbents.

City Attorney and City Auditor are **both appointed** by the City Council per the San Jose City Charter. Neither is a popularly-elected position. San Jose's ONLY elected offices are Mayor (citywide) and 10 Council Members (by district) — exactly 11 officials total for this seed phase.

The `sanjoseca.gov` website returns HTTP 403 to all automated fetches (same CivicPlus WAF as fremont.gov). The Node.js browser User-Agent + Referer header workaround confirmed for Fremont will apply here. Wikipedia/Wikimedia Commons has CC-BY-SA 4.0 portraits for Mayor Matt Mahan as verified fallback.

**Migration numbering correction:** The additional_context claims migrations 215–216 are available for San Jose. This is WRONG — 215 is `berkeley_headshots.sql` and 216 is `sf_officials_stances.sql`. **Next available migrations are 217 and 218**.

**Primary recommendation:** ArcGIS loader with outSR=4326, field DISTRICTINT, endpoint `https://geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120`. Use migrations 217 (government structure) and 218 (officials). Headshot audit file is NOT numbered.

---

## Standard Stack

### Core Loader Pattern
| Component | Value | Confidence |
|-----------|-------|------------|
| Geofence data source | ArcGIS MapServer (NOT Socrata) | HIGH |
| Endpoint | `https://geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120` | HIGH — verified live |
| Alternate endpoint | `https://geo.sanjoseca.gov/server/rest/services/PLN/PLN_AdministrativeBoundaries/MapServer/1` | HIGH — also returns correct data |
| Native CRS | WKID 102643 (NAD 1983 StatePlane California III, feet) | HIGH |
| outSR param | `outSR=4326` REQUIRED | HIGH |
| District field | `DISTRICTINT` (integer, values 1–10) | HIGH — confirmed via live attribute query |
| String district field | `DISTRICT` (string, also available but redundant) | HIGH |
| Council member field | `COUNCILMEMBER` (string — current, not for boundary name column) | HIGH |
| Feature count | 10 features, one per district | HIGH |
| MTFCC | X0010 (locked in CONTEXT.md) | HIGH |
| state | '06' (all CA city geofences) | HIGH |

### Full Query URL (geojson with geometry)
```
https://geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120/query?where=1%3D1&outFields=DISTRICTINT%2CCOUNCILMEMBER&outSR=4326&f=geojson
```

### Installation
No new npm packages needed. Loader follows identical TypeScript pattern as `load-fremont-council-boundaries.ts` and `load-sd-council-boundaries.ts`.

---

## Architecture Patterns

### Migration Number Correction (CRITICAL)

The additional_context in the phase description claims migrations 215 and 216 are next available for San Jose. **This is incorrect.** Current state:

| Number | File | Status |
|--------|------|--------|
| 215 | `215_berkeley_headshots.sql` | TAKEN |
| 216 | `216_sf_officials_stances.sql` | TAKEN |
| **217** | (available) | **Use for SJ government structure** |
| **218** | (available) | **Use for SJ officials** |

Headshots SQL is audit-only (not numbered) — consistent with 209, 212, 215.

### Recommended Project Structure
```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 217_sj_government_structure.sql    # government + chambers + districts
│   └── 218_sj_officials.sql               # politicians + offices + office_id back-fill
├── scripts/
│   ├── load-sj-council-boundaries.ts      # ArcGIS loader (new — follows Fremont pattern)
│   └── smoke-sj-geofences.ts              # smoke test (new — follows Fremont pattern)
└── migrations/
    └── sj_headshots.sql                    # AUDIT ONLY, not in migration ledger
```

### Government Structure (Migration 217)
Scope: 1 government + 2 chambers + 10 LOCAL districts + 1 LOCAL_EXEC district

```sql
-- Government: 'City of San Jose', type='LOCAL', state='CA', geo_id='0668000'
-- Chamber 1: 'Mayor' (citywide, FK to LOCAL_EXEC district geo_id='0668000')
-- Chamber 2: 'City Council' (10 single-member districts)
-- TODO Phase 69: set election_method='RCV' on both chambers (SJ uses RCV)
-- 10 LOCAL districts: geo_id='sj-council-district-1' through 'sj-council-district-10'
-- 1 LOCAL_EXEC district: geo_id='0668000' (reuses Phase 57 city boundary)
```

Note: Berkeley has 3 chambers (Mayor + City Council + City Auditor). San Jose has only 2 (Mayor + City Council). City Attorney and City Auditor are both APPOINTED — no chambers for them.

### Officials Seed (Migration 218)
Scope: 11 politicians + 11 offices + office_id back-fill

Pattern: `WITH ins_p AS (INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id)` — identical to migrations 208, 211, 214.

### Headshot Workaround
sanjoseca.gov uses CivicPlus CMS (confirmed: `showpublisheddocument` URL pattern found). WAF blocks Python/curl (returns 403). Same workaround as fremont.gov:

```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Referer': 'https://www.sanjoseca.gov/your-government/city-council',
}
```

The headshot skill loop should parse individual council district pages at:
`https://www.sanjoseca.gov/your-government/departments-offices/mayor-and-city-council/district-{N}/your-councilmember`

### Anti-Patterns to Avoid
- **Using Socrata endpoint**: data.sanjoseca.gov redirects to ArcGIS — not a native Socrata. Do not attempt Socrata `?$limit=50` pattern.
- **Omitting outSR=4326**: Native CRS is State Plane feet (WKID 102643). Without outSR=4326, coordinates will be ~6 million feet, not WGS84 degrees. PostGIS stores garbage.
- **Using DISTRICT string field**: Use `DISTRICTINT` (integer) for reliable parseInt parsing — same as Fremont/SD `DISTRICT` integer field.
- **Using COUNCILMEMBER field for boundary name**: The `COUNCILMEMBER` field changes with elections. Store `name = 'District N'` (derived from DISTRICTINT). Do not use COUNCILMEMBER in the geofence_boundaries row.
- **Including City Attorney or City Auditor**: Both are appointed by City Council. No elected chamber for either. Seeding as is_appointed_position=false would be wrong.
- **Migration 215 or 216**: Both are already taken. Use 217 and 218.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SJ council district polygons | Custom scraper | ArcGIS query with outSR=4326 | Official City GIS, 10 features, verified live |
| CRS conversion | Manual coordinate transform | outSR=4326 query param | ArcGIS handles State Plane → WGS84 server-side |
| Headshot 403 bypass | Python requests | Node.js fetch with browser User-Agent | Established Fremont pattern, avoids WAF |
| Council member name lookup | DB query during boundary load | Ignore COUNCILMEMBER during load | Field changes with elections; not for geofence_boundaries |

---

## Common Pitfalls

### Pitfall 1: outSR=4326 omission
**What goes wrong:** ArcGIS returns geometries in State Plane CA Zone 3 (WKID 102643), unit = US survey feet. Coordinates look like (6,295,123.4, 1,882,346.2) instead of (-121.88, 37.33). PostGIS stores them without error but ST_Covers always returns 0 rows.
**Why it happens:** ArcGIS endpoint does not auto-convert. Caller must specify outSR=4326.
**How to avoid:** Always include `outSR=4326` in ArcGIS query URL. Pre-flight: log first coordinate pair; if abs(x) > 180, outSR was omitted.
**Warning signs:** Smoke test SC2 returns 0 rows for a known point inside the city.

### Pitfall 2: Migration numbering collision
**What goes wrong:** Writing migration 215 or 216 for San Jose overwrites existing Berkeley/SF files.
**Why it happens:** The additional_context in this phase's description incorrectly stated 215–216 are available.
**How to avoid:** Use **217** (government structure) and **218** (officials). Always check `ls migrations/` before writing.

### Pitfall 3: City Attorney / City Auditor as elected positions
**What goes wrong:** Seeding City Attorney and/or City Auditor as elected officials creates offices with is_appointed_position=false when the San Jose Charter explicitly makes both appointed.
**Why it happens:** Wikipedia page for San Jose government clearly states: "The City Council appoints five officials... including City Attorney and City Auditor."
**How to avoid:** Scope = Mayor + 10 Council Members only. No chambers for City Attorney or City Auditor.

### Pitfall 4: sanjoseca.gov 403 during headshot sourcing
**What goes wrong:** Direct curl/Python/WebFetch returns 403 (WAF blocks non-browser agents on CivicPlus CMS).
**Why it happens:** Same WAF as fremont.gov (CivicPlus platform).
**How to avoid:** Use Node.js fetch with Chrome User-Agent header + Referer pointing to sanjoseca.gov. See `_tmp-fremont-headshots.ts` pattern.
**Warning signs:** HTTP 403 when fetching sanjoseca.gov URLs from scripts.

### Pitfall 5: District 3 incumbency confusion
**What goes wrong:** Using an old or stale source that shows District 3 as "Omar Torres" (resigned in disgrace) or "vacant" (californialocal.com shows it as vacant as of their last update).
**Why it happens:** District 3 had a special election in 2025 to fill the vacancy.
**How to avoid:** Use Anthony Tordillos for District 3. He won the special general runoff on June 24, 2025 (64.3% vote), was certified July 28, 2025, and sworn in August 12, 2025. The official ArcGIS dataset confirms "Anthony Tordillos" in the COUNCILMEMBER field.

---

## Code Examples

### ArcGIS Loader Config (verified pattern)
```typescript
// Source: load-fremont-council-boundaries.ts + live ArcGIS endpoint verification
const ARCGIS_URL =
  'https://geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120/query' +
  '?where=1%3D1&outFields=DISTRICTINT%2CCOUNCILMEMBER&outSR=4326&f=geojson';

const MTFCC          = 'X0010';    // locked in CONTEXT.md
const STATE          = '06';       // all CA cities use '06'
const SOURCE         = 'sj_city_council_districts_2022';
const EXPECTED_COUNT = 10;
const MAX_DISTRICT   = 10;

// Field to parse district number from:
const rawDistrict = props['DISTRICTINT'];  // integer 1-10
const distNum = parseInt(String(rawDistrict ?? ''), 10);
```

### DB Insert (identical to Fremont/SD/Berkeley pattern)
```sql
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES ($1, $2, $3, $4, $5,
  public.ST_ForcePolygonCCW(
    public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326)
  ),
  $7, now())
ON CONFLICT (geo_id, mtfcc) DO NOTHING
```
Parameters: `['sj-council-district-3', 'sj-council-district-3', 'District 3', '06', 'X0010', geometryJson, 'sj_city_council_districts_2022']`

### Smoke Test Coordinate
```typescript
// San Jose City Hall (200 E Santa Clara St) — confirmed in District 3 (Tordillos)
// via live ArcGIS spatial query
const SJ_CITY_HALL = { lon: -121.88, lat: 37.335 };
// Negative test: Oakland City Hall (same as Fremont/Berkeley smoke test)
const OAKLAND = { lon: -122.2711, lat: 37.8044 };
```

### Section-Split Detector (from Berkeley 68-02 plan)
```sql
SELECT ch.name_formal, COUNT(DISTINCT COALESCE(gb.display_name,'')) AS distinct_section_names,
  array_agg(DISTINCT COALESCE(gb.display_name, '(none)') ORDER BY COALESCE(gb.display_name, '(none)')) AS section_names,
  COUNT(DISTINCT o.id) AS office_count
FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
LEFT JOIN essentials.districts d ON d.id = o.district_id
LEFT JOIN essentials.government_bodies gb
  ON gb.geo_id = d.geo_id
  AND gb.state = d.state
  AND gb.body_key = COALESCE(NULLIF(ch.name_formal,''), ch.name)
WHERE ch.name_formal != ''
  AND ch.government_id = (SELECT id FROM essentials.governments
                          WHERE name='City of San Jose' AND state='CA')
GROUP BY ch.name_formal
HAVING COUNT(DISTINCT COALESCE(gb.display_name,'')) > 1
ORDER BY office_count DESC;
-- Expected: 0 rows
```

---

## Incumbent Roster (VERIFIED)

Source: Live ArcGIS attribute query + cross-referenced with Wikipedia + election result news sources (May 2026).

| external_id | Role | Full Name | District/Scope | Term Notes |
|-------------|------|-----------|----------------|------------|
| -640001 | Mayor | Matt Mahan | Citywide | Re-elected Nov 2024 (86.6%, term ~2028) |
| -640010 | Council Member (District 1) | Rosemary Kamei | District 1 | Up 2026 |
| -640011 | Council Member (District 2) | Pamela Campos | District 2 | Took office Jan 2025 |
| -640012 | Council Member (District 3) | Anthony Tordillos | District 3 | Sworn in Aug 12, 2025 (special election) |
| -640013 | Council Member (District 4) | David Cohen | District 4 | Won March 2024 primary |
| -640014 | Council Member (District 5) | Peter Ortiz | District 5 | Up 2026 |
| -640015 | Council Member (District 6) | Michael Mulcahy | District 6 | Won Nov 2024 |
| -640016 | Council Member (District 7) | Bien Doan | District 7 | Up 2026 |
| -640017 | Council Member (District 8) | Domingo Candelas | District 8 | Won Nov 2024 (appointed 2023, re-elected) |
| -640018 | Council Member (District 9) | Pam Foley | District 9 | Vice Mayor; up 2026, term-limited |
| -640019 | Council Member (District 10) | George Casey | District 10 | Defeated Arjun Batra in Nov 2024 |

**Total seed scope:** 11 politicians (Mayor + 10 council members)

**Pre-flight confirmed:** external_ids -640001 through -640019 are clear in the live DB (query returned 0 rows).

---

## Headshot Sources

### Primary: sanjoseca.gov
- **Behavior:** Returns HTTP 403 to Python/curl/WebFetch (CivicPlus WAF).
- **Workaround:** Node.js `fetch()` with Chrome User-Agent + Referer header (identical to Fremont pattern).
- **URL pattern to discover:** `https://www.sanjoseca.gov/home/showpublishedimage/{id}/{timestamp}` — IDs must be scraped from each council member's individual page HTML (not guessable).
- **Source pages:** 
  - Mayor: `https://www.sanjoseca.gov/your-government/departments-offices/mayor-and-city-council/mayor-s-office/-NID-282`
  - Council D1: `https://www.sanjoseca.gov/your-government/departments-offices/mayor-and-city-council/district-1/the-team/rosemary-kamei`
  - Council D2: `https://www.sanjoseca.gov/your-government/departments-offices/mayor-and-city-council/district-2/councilmember-pamela-campos-biography`
  - Council D3: `https://www.sjdistrict3.org/` (Tordillos has own site; also check sanjoseca.gov/district-3)
  - Council D6: `https://www.sanjoseca.gov/your-government/departments-offices/mayor-and-city-council/district-6/your-councilmember`
- **License:** Official government portraits = public_domain

### Fallback: Wikipedia/Wikimedia Commons
- **Mayor Matt Mahan:** `https://upload.wikimedia.org/wikipedia/commons/a/ae/Matt_Mahan_portrait_2025.jpg` — CC-BY-SA 4.0 (not CC0; requires attribution)
- **Other council members:** Search Wikimedia Commons `Category:[Name]` — coverage varies. Less prominent members unlikely to have Commons photos.

### Image Processing
- sanjoseca.gov portrait dimensions: Unknown until downloaded; likely similar to fremont.gov (400×600, ratio 2:3) or berkeleyca.gov (300×300, ratio 1:1).
- Target: 600×750 (4:5 ratio), Lanczos, q90 JPEG.
- Processing rule: crop to 4:5 first, then resize — never stretch. Eyes at ~1/3 from top. No superimposed text/graphics.

---

## State of the Art

| Old Assumption | Corrected Fact | Impact |
|----------------|----------------|--------|
| Migration 215 = SJ government structure | Migration 215 = Berkeley headshots (taken) | Use 217/218 instead |
| Migration 216 = SJ officials | Migration 216 = SF officials stances (taken) | Use 218 |
| SJ data may be on Socrata | data.sanjoseca.gov redirects to ArcGIS; it is ArcGIS MapServer | Use ArcGIS pattern, not Socrata |
| City Auditor may be elected | San Jose City Auditor is appointed by City Council per Charter | No City Auditor chamber |
| City Attorney may be elected | San Jose City Attorney is appointed by City Council per Charter | No City Attorney chamber |
| District 3 = Omar Torres | Torres resigned; Anthony Tordillos won special election Aug 2025 | Seed Tordillos |
| District 10 = Arjun Batra | George Casey defeated Batra in Nov 2024 | Seed Casey |

---

## Open Questions

1. **sanjoseca.gov headshot URL IDs**
   - What we know: CivicPlus CMS, showpublishedimage pattern, Node.js User-Agent works for fremont.gov.
   - What's unclear: The exact `{id}/{timestamp}` values for each SJ council member — must be scraped during Plan 64-03 execution.
   - Recommendation: The /find-headshots skill handles this dynamically. Document in audit SQL after execution.

2. **District 3 Tordillos headshot**
   - What we know: Tordillos has his own website at sjdistrict3.org and was recently sworn in (Aug 2025).
   - What's unclear: Whether sanjoseca.gov has already updated District 3's page with his official portrait, or if it still shows a placeholder.
   - Recommendation: Check both sanjoseca.gov/district-3 and sjdistrict3.org for portrait photo.

3. **Image dimensions on sanjoseca.gov**
   - What we know: fremont.gov was 400×600 (2:3), berkeleyca.gov was 300×300 (1:1).
   - What's unclear: sanjoseca.gov portrait dimensions — not accessible via WebFetch.
   - Recommendation: Log dimensions after first download; apply crop-then-resize rule accordingly.

---

## Sources

### Primary (HIGH confidence)
- Live ArcGIS query: `https://geo.sanjoseca.gov/server/rest/services/OPN/OPN_OpenDataService/MapServer/120/query` — DISTRICTINT field, 10 features, COUNCILMEMBER names verified
- Wikipedia: `https://en.wikipedia.org/wiki/Government_of_San_Jose,_California` — Mayor and 10 council members elected; City Attorney + City Auditor appointed
- Wikipedia: `https://en.wikipedia.org/wiki/San_Jose_City_Council` — current roster confirmed
- Live DB query: external_ids -640001..-640019 confirmed clear (0 rows returned)
- Codebase: `C:/EV-Accounts/backend/migrations/213_berkeley_government_structure.sql` — government structure pattern
- Codebase: `C:/EV-Accounts/backend/migrations/214_berkeley_officials.sql` — officials seed pattern
- Codebase: `C:/EV-Accounts/backend/scripts/load-fremont-council-boundaries.ts` — ArcGIS outSR=4326 pattern
- Codebase: `C:/EV-Accounts/backend/scripts/_tmp-fremont-headshots.ts` — Node.js User-Agent workaround
- Codebase: `ls C:/EV-Accounts/backend/migrations/` — confirmed 215=berkeley_headshots, 216=sf_stances

### Secondary (MEDIUM confidence)
- San José Spotlight news: Tordillos won D3 special election June 24, 2025, sworn in Aug 12, 2025
- San José Spotlight news: George Casey defeated Arjun Batra in Nov 2024 D10 election
- San José Spotlight news: Pamela Campos assumed D2 office Jan 2025
- San José Spotlight news: Domingo Candelas won D8 reelection Nov 2024

### Tertiary (LOW confidence)
- Wikimedia Commons `Category:Matt_Mahan` — CC-BY-SA 4.0 portrait available as Mahan fallback; confirmed license type

---

## Metadata

**Confidence breakdown:**
- ArcGIS endpoint + field names: HIGH — live query confirmed all 10 features with DISTRICTINT + COUNCILMEMBER
- CRS/outSR requirement: HIGH — native WKID 102643 confirmed; outSR=4326 tested and returns valid WGS84
- Incumbent roster: HIGH — ArcGIS data + Wikipedia + election news cross-reference
- Elected vs appointed offices: HIGH — Wikipedia government structure article + search result quoting Charter directly
- Migration numbers: HIGH — direct filesystem check
- Headshot URL pattern: MEDIUM — CivicPlus CMS confirmed; exact showpublishedimage IDs unknown until runtime
- Headshot image dimensions: LOW — not accessible via WebFetch; estimate from prior city patterns

**Research date:** 2026-05-22
**Valid until:** 2026-06-22 (stable — council members are in their terms; ArcGIS endpoint unlikely to change)
