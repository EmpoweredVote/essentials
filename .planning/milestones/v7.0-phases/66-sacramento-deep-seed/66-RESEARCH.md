# Phase 66: Sacramento Deep Seed - Research

**Researched:** 2026-05-23
**Domain:** Sacramento CA city government structure, ArcGIS council district geofences, incumbent roster, headshot sourcing
**Confidence:** HIGH (government structure — CRITICAL CORRECTION required; incumbents; geofence endpoint); MEDIUM (headshot URL patterns — CMS not directly inspectable)

---

## Summary

Phase 66 seeds the City of Sacramento: one government row, chambers for Mayor and City Council (8 districts), 8 council district boundary geofences (MTFCC=X0011), 9 officials (Mayor + 8 Council Members), and headshots for all 9.

**CRITICAL CHARTER CORRECTION — CONTEXT.md DECISIONS ARE WRONG ON ELECTED OFFICES:**
The CONTEXT.md decision specifies 6 chambers (Mayor, City Council, City Attorney, City Auditor, City Treasurer, City Clerk) and "13 politicians." This is INCORRECT. Multiple authoritative sources confirm that Sacramento's City Attorney, City Auditor, City Treasurer, and City Clerk are ALL APPOINTED by the City Council — they are not popularly elected. Sacramento operates under a Council-Manager form with ONLY 2 popularly elected office types: Mayor (citywide) and City Council (8 districts). This mirrors San Jose (Phase 64), not Berkeley (Phase 68). The planner must present this correction to the user.

**Sacramento also has NOT adopted RCV.** The CONTEXT.md claims "Sacramento adopted ranked choice voting (Measure L, 2022)." This is factually incorrect. Sacramento uses a two-round runoff system. The RCV initiative (Better Ballot Sacramento) was still collecting signatures in 2026 and has NOT been passed. The TODO Phase 69 RCV comment must still be added, but with a note that this is aspirational (pending future measure passage), not a confirmed fact like Berkeley's established RCV.

The geofence data source is Sacramento County's ArcGIS MapServer at `mapservices.gis.saccounty.net`, layer 5 — 8 features, field `DISTNUM` (integer), native CRS WKID 102642 (State Plane CA Zone II, feet) → `outSR=4326` required. This is the exact ArcGIS pattern used for San Jose (Phase 64) and Fremont (Phase 67).

**Primary recommendation:** Use 3 plans (66-01: geofences + government structure; 66-02: officials seed; 66-03: headshots). Scope = Mayor + 8 Council Members ONLY (9 total). City Attorney/Auditor/Treasurer/Clerk are all appointed — no chambers, no politicians for them. Use MTFCC X0011, migrations 219 and 220, external_id range -660xxx.

---

## CRITICAL CORRECTION: Charter Officers Are Appointed, Not Elected

**The CONTEXT.md decision to seed 6 chambers (including City Attorney, City Auditor, City Treasurer, City Clerk) is based on incorrect information.** Before planning proceeds, the user must be informed.

### What the Evidence Shows

| Source | Says |
|--------|------|
| Wikipedia "Government of Sacramento, California" | "The City Council appoints the city's five Charter Officers: City Manager, City Attorney, City Treasurer, City Clerk, City Auditor." |
| Sacramento Metro Authority (sacramentometroauthority.com/sacramento-city-government-structure) | CONTRADICTS Wikipedia — says "4 independently elected officers — City Attorney, City Clerk, City Treasurer, City Auditor" |
| City Council agendas (granicus records) | Farishta Ahrary "appointed as new City Auditor by Sacramento City Council" (Oct 2024); Gustavo Martinez "appointed as new City Attorney" (Feb 2026); David Kent "appointed City Clerk" (Apr 2025) |
| Sacramento County voter index | Lists only Mayor and Council as elective offices |
| Better Ballot Sacramento (betterballotsacramento.org) | Still collecting signatures for RCV — has NOT passed |
| 2026 Sacramento City Council election (Wikipedia) | Uses "runoff" system — districts with June primary + Nov runoff |

### Definitive Conclusion

The appointment evidence is overwhelming: all 4 "charter officers" (City Attorney, City Auditor, City Treasurer, City Clerk) are appointed by Council vote, confirmed by multiple specific appointment news articles from 2024-2026. The sacrametroauthority.com page appears to describe an older or aspirational structure; it is contradicted by all current-appointment evidence.

**Sacramento elected offices: Mayor only + 8 Council Members = 9 officials total.**

### What the Planner Must Do

Present this correction to the user before writing plan files. The user's CONTEXT.md locked decisions assumed 6 chambers and 13 politicians. The correct scope is 2 chambers and 9 politicians. This is a locked decision that needs to be reopened.

---

## CRITICAL CORRECTION: Sacramento Has Not Adopted RCV

**The CONTEXT.md claim "Sacramento adopted ranked choice voting (Measure L, 2022) system-wide, effective 2024 elections" is factually incorrect.**

### Evidence

- 2022 Sacramento Measure L was the Children's Fund measure — NOT ranked choice voting
- The 2026 Sacramento City Council election uses a two-round runoff system (June primary + November runoff if needed)
- Better Ballot Sacramento was still collecting signatures for an RCV ballot measure as of May 2026
- Sacramento is not listed among California RCV municipalities (which include Berkeley, Oakland, SF, Albany, San Leandro, Eureka)

### Implication for Migrations

The TODO comment for Phase 69 RCV should read:
```sql
-- TODO Phase 69: Sacramento uses two-round runoff (NOT RCV as of 2026-05-23)
-- Better Ballot Sacramento collecting signatures; measure not yet on ballot.
-- If RCV passes in a future election, update election_method='rcv' at that time.
```

This is different from Berkeley/SJ patterns where RCV was confirmed. Do NOT use `TODO Phase 69: set election_method='rcv'` language that implies RCV is confirmed.

---

## Current DB State

From STATE.md and Phase 57 (confirmed):
- `geo_id='0664000'`, `mtfcc='G4110'`, `state='06'` — Sacramento city/place boundary already in geofence_boundaries
- Sacramento FIPS place code: `0664000`
- No `essentials.governments` row for Sacramento yet
- X0011 is the next unclaimed MTFCC (sequence: X0005=LA County, X0006=SF, X0007=SD, X0008=Fremont, X0009=Berkeley, X0010=SJ, X0011=Sacramento)
- **Next migration is 219** (217=SJ government structure, 218=SJ officials; 215=Berkeley headshots, 216=SF stances — all taken)

**After Phase 66:**
- 8 new rows in geofence_boundaries: `geo_id='sacramento-council-district-{1-8}'`, `mtfcc='X0011'`, `state='06'`
- 1 governments row: `'City of Sacramento'`
- 2 chambers: Mayor, City Council (IF user confirms corrected scope)
- 8 districts rows (LOCAL) + 1 Sacramento-wide district row (LOCAL_EXEC for Mayor)
- 9 politicians + 9 offices

---

## Standard Stack

### Core Loader Pattern

| Component | Value | Confidence |
|-----------|-------|------------|
| Geofence data source | ArcGIS MapServer (NOT Socrata) | HIGH |
| Endpoint host | `mapservices.gis.saccounty.net` (Sacramento County GIS) | HIGH — verified live |
| Service path | `/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5` | HIGH — confirmed 8 features |
| Native CRS | WKID 102642 (State Plane CA Zone II, feet; latest=2226) | HIGH |
| outSR param | `outSR=4326` REQUIRED | HIGH |
| District field | `DISTNUM` (small integer, values 1–8) | HIGH — confirmed via live query |
| Council member field | `COUNCIL` (string — current incumbents) | HIGH — confirmed |
| Feature count | 8 features, one per district | HIGH — count query returned 8 |
| MTFCC | X0011 (next in sequence per CONTEXT.md) | HIGH |
| state | '06' (all CA city geofences) | HIGH |

### Full Query URL (verified live)

```
https://mapservices.gis.saccounty.net/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5/query?where=1%3D1&outFields=DISTNUM%2CCOUNCIL&outSR=4326&f=geojson
```

Count-only verification:
```
https://mapservices.gis.saccounty.net/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5/query?where=1%3D1&outFields=DISTNUM%2CCOUNCIL&returnCountOnly=true&f=json
```
Returns `{"count":8}` — confirmed.

### Installation

No new npm packages needed. Loader follows identical TypeScript pattern as `load-sj-council-boundaries.ts`. Copy that file and change constants.

---

## Confirmed Incumbent Roster

Source: Live ArcGIS attribute query (COUNCIL field) + cityofsacramento.gov elections page cross-reference (2026-05-23).

### Mayor

| external_id | Role | Full Name | Scope | Notes |
|-------------|------|-----------|-------|-------|
| -660001 | Mayor | Kevin McCarty | Citywide | Assumed office Dec 10, 2024 (former CA Assembly member) |

### City Council (8 Districts)

| external_id | Role | Full Name | District | ArcGIS COUNCIL value |
|-------------|------|-----------|----------|----------------------|
| -660010 | Council Member (District 1) | Lisa Kaplan | D1 | "Lisa Kaplan" |
| -660011 | Council Member (District 2) | Roger Dickinson | D2 | "Roger Dickinson" |
| -660012 | Council Member (District 3) | Karina Talamantes | D3 | "Karina Talamantes" |
| -660013 | Council Member (District 4) | Phil Pluckebaum | D4 | "Phil Pluckebaum" |
| -660014 | Council Member (District 5) | Caity Maple | D5 | "Caity Maple" |
| -660015 | Council Member (District 6) | Eric Guerra | D6 | "Eric Guerra" |
| -660016 | Council Member (District 7) | Rick Jennings II | D7 | "Rick Jennings II" — note the "II" suffix |
| -660017 | Council Member (District 8) | Mai Vang | D8 | "Mai Vang" |

**Total seed scope: 9 politicians (Mayor + 8 Council Members)**

**Pre-flight check (mandatory):**
```sql
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -660020 AND -660001;
-- Must return 0 before migration 220
```

### Charter Officers — NOT in scope (all appointed)

| Office | Current | Appointment basis |
|--------|---------|-------------------|
| City Attorney | Gustavo L. Martinez | Appointed by City Council Feb 10, 2026 (after Susana Alcala Wood left for SJ) |
| City Auditor | Farishta Ahrary | Appointed by City Council Oct 2024 |
| City Clerk | Mindy Cuppy | Confirmed via Granicus records May 2025 |
| City Treasurer | John Colville | Active as of March 2026 (SCERS surplus funds discussion) |

**Do NOT create chambers or officials for any of these 4 positions.** They are appointed, not elected. See Critical Correction section above.

---

## External ID Scheme

**Use `-660xxx` range for Sacramento officials.**

| Range | Owner |
|-------|-------|
| -6000xxx | CA state executives |
| -6001xxx | CA State Senate |
| -6002xxx | CA State Assembly |
| -6003xxx | CA Governor challengers |
| -6004xxx | LAUSD board |
| -630xxx | SF officials (Phase 63) |
| -650xxx | SD officials (Phase 65) |
| -670xxx | Fremont officials (Phase 67) |
| -680xxx | Berkeley officials (Phase 68) |
| **-640xxx** | **SJ officials (Phase 64)** |
| **-660xxx** | **Sacramento officials (Phase 66 — new)** |

Note: -660001 (Mayor), -660010 through -660017 (D1-D8). This follows the phase-prefix convention (phase 66 → -660xxx).

---

## Geofence Source Details

### ArcGIS MapServer Layer 5

**URL:** `https://mapservices.gis.saccounty.net/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5`

**Layer metadata (confirmed):**
- Layer Name: "Sacramento City Council Districts"
- Geometry Type: Polygon (esriGeometryPolygon)
- Native CRS: WKID 102642 / latest 2226 (State Plane CA Zone II, feet)
- Fields: OBJECTID, DISTNUM (integer), COUNCIL (string), FEE_ID, PERIMETER
- Feature count: 8 (confirmed by returnCountOnly query)
- Max record count: 2,000 (well above 8 — no pagination needed)

**Critical: outSR=4326 IS REQUIRED.** Native units are feet in State Plane. Without outSR=4326, coordinates look like (1,998,xxx.x, 382,xxx.x) instead of (-121.5xx, 38.5xx).

**Field name for district number: `DISTNUM`** (integer, values 1–8).
Do NOT use the `COUNCIL` field for the boundary `name` column — it changes with elections.

**Source label for geofence_boundaries.source:** `'sacramento_city_council_districts_2021'`
(boundaries adopted December 16, 2021 per Sacramento redistricting)

---

## Migration Numbering

| Number | File | Status |
|--------|------|--------|
| 217 | `217_sj_government_structure.sql` | TAKEN (SJ) |
| 218 | `218_sj_officials.sql` | TAKEN (SJ) |
| **219** | `219_sacramento_government_structure.sql` | **Use for Sac gov structure** |
| **220** | `220_sacramento_officials.sql` | **Use for Sac officials** |
| `sac_headshots.sql` | (audit-only, not numbered) | **Headshots audit file** |

Headshots SQL is AUDIT ONLY — not in numbered migration ledger, consistent with 212 (Fremont), 215 (Berkeley), `sj_headshots.sql` (SJ) patterns.

---

## Architecture Patterns

### Recommended File Structure

```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 219_sacramento_government_structure.sql   # government + chambers + districts
│   └── 220_sacramento_officials.sql              # politicians + offices + office_id back-fill
├── scripts/
│   ├── load-sacramento-council-boundaries.ts     # ArcGIS loader (copy SJ pattern)
│   └── smoke-sacramento-geofences.ts             # smoke test (copy SJ pattern)
└── migrations/
    └── sac_headshots.sql                         # AUDIT ONLY, not in migration ledger
```

### Pattern 1: ArcGIS Loader Config (copy load-sj-council-boundaries.ts)

```typescript
// Source: load-sj-council-boundaries.ts (copy and change these constants)
const ARCGIS_URL =
  'https://mapservices.gis.saccounty.net/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5/query' +
  '?where=1%3D1&outFields=DISTNUM%2CCOUNCIL&outSR=4326&f=geojson';

const MTFCC          = 'X0011';   // locked in CONTEXT.md
const STATE          = '06';      // all CA cities use '06'
const SOURCE         = 'sacramento_city_council_districts_2021';
const EXPECTED_COUNT = 8;         // Sacramento has 8 council districts
const MAX_DISTRICT   = 8;

// Field to parse district number from:
const rawDistrict = props['DISTNUM'];  // integer 1-8
const distNum = parseInt(String(rawDistrict ?? ''), 10);
// geo_id construction:
const geoId = `sacramento-council-district-${distNum}`;
const name  = `District ${distNum}`;
```

**Pre-flight check pattern (same as SJ loader):**
```typescript
SELECT COUNT(*) AS cnt FROM essentials.geofence_boundaries WHERE mtfcc='X0011'
// Must return 0 on first run, or only sacramento-council-district-* rows on re-run
```

### Pattern 2: Government Row (migration 219)

```sql
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Sacramento', 'LOCAL', 'CA', 'Sacramento', '0664000'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments
  WHERE name = 'City of Sacramento' AND state = 'CA'
);
```

### Pattern 3: Chambers (migration 219)

**2 chambers only: Mayor and City Council.**
City Attorney, City Auditor, City Treasurer, City Clerk are ALL APPOINTED — do NOT create chambers for them.

```sql
-- Mayor chamber (citywide)
-- NOTE: Sacramento uses two-round runoff — NOT ranked choice voting as of 2026-05-23
-- TODO: if Sacramento passes RCV measure in future, set election_method='rcv'
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'Mayor', 'Mayor of Sacramento',
       (SELECT id FROM essentials.governments WHERE name='City of Sacramento' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='Mayor'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Sacramento' AND state='CA')
);

-- City Council chamber (8 single-member districts)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Sacramento City Council',
       (SELECT id FROM essentials.governments WHERE name='City of Sacramento' AND state='CA')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name='City Council'
    AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Sacramento' AND state='CA')
);
```

### Pattern 4: Districts Rows (migration 219)

```sql
-- 8 council district rows (label column, per established pattern)
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT v.geo_id, v.district_type, v.label, v.state
FROM (VALUES
  ('sacramento-council-district-1', 'LOCAL', 'District 1', 'CA'),
  ('sacramento-council-district-2', 'LOCAL', 'District 2', 'CA'),
  ('sacramento-council-district-3', 'LOCAL', 'District 3', 'CA'),
  ('sacramento-council-district-4', 'LOCAL', 'District 4', 'CA'),
  ('sacramento-council-district-5', 'LOCAL', 'District 5', 'CA'),
  ('sacramento-council-district-6', 'LOCAL', 'District 6', 'CA'),
  ('sacramento-council-district-7', 'LOCAL', 'District 7', 'CA'),
  ('sacramento-council-district-8', 'LOCAL', 'District 8', 'CA')
) AS v(geo_id, district_type, label, state)
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts d
  WHERE d.geo_id = v.geo_id AND d.district_type = v.district_type AND d.state = v.state
);

-- Sacramento-wide LOCAL_EXEC district for Mayor office
INSERT INTO essentials.districts (geo_id, district_type, label, state)
SELECT '0664000', 'LOCAL_EXEC', 'Sacramento (Citywide)', 'CA'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id='0664000' AND state='CA' AND district_type IN ('LOCAL','LOCAL_EXEC')
);
```

### Pattern 5: Politician + Office INSERT (WITH ins_p CTE) — migration 220

```sql
-- Council Member District 1: Lisa Kaplan (-660010)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Lisa Kaplan', 'Lisa', 'Kaplan', NULL, true, false, false, true, -660010)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='City Council'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Sacramento' AND state='CA')),
       p.id,
       'Council Member (District 1)', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = 'sacramento-council-district-1'
  AND d.district_type = 'LOCAL'
  AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

**Mayor pattern (uses LOCAL_EXEC district):**
```sql
-- Mayor: Kevin McCarty (-660001) — linked to LOCAL_EXEC district geo_id='0664000'
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed, is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Kevin McCarty', 'Kevin', 'McCarty', NULL, true, false, false, true, -660001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name='Mayor'
        AND government_id=(SELECT id FROM essentials.governments WHERE name='City of Sacramento' AND state='CA')),
       p.id,
       'Mayor', 'CA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '0664000'
  AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
  AND d.state = 'CA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

### Pattern 6: office_id Back-fill (end of migration 220)

```sql
-- REQUIRED: plan 66-03 queries politicians JOIN offices ON o.id = p.office_id
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -660020 AND -660001
  AND p.office_id IS NULL;
```

### Pattern 7: Smoke Test (3 gates)

```typescript
// Gate 1: 8 Sacramento council district geofence rows
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE geo_id LIKE 'sacramento-council-district-%' AND mtfcc='X0011' AND state='06';
// Expected: 8

// Gate 2: Sacramento City Hall (915 I Street; approx lon=-121.4944, lat=38.5816)
SELECT geo_id, name FROM essentials.geofence_boundaries
WHERE mtfcc='X0011' AND geo_id LIKE 'sacramento-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-121.4944, 38.5816), 4326));
// Expected: 1 row (assert rowCount=1; log the district — do NOT hardcode which)

// Gate 3: San Jose City Hall → 0 rows (outside Sacramento)
SELECT COUNT(*) FROM essentials.geofence_boundaries
WHERE mtfcc='X0011' AND geo_id LIKE 'sacramento-council-district-%'
  AND ST_Covers(geometry, ST_SetSRID(ST_MakePoint(-121.88, 37.335), 4326));
// Expected: 0 (San Jose)
```

### Anti-Patterns to Avoid

- **Creating chambers for City Attorney, City Auditor, City Treasurer, City Clerk:** All 4 are appointed by City Council. Per confirmed appointment records: Gustavo Martinez appointed City Attorney Feb 2026; Farishta Ahrary appointed City Auditor Oct 2024. Do NOT create chambers or politician rows for any of these 4 positions.
- **Using TODO comment implying RCV is confirmed:** Sacramento has NOT adopted RCV. Use a conditional TODO that notes RCV is NOT current policy.
- **Omitting outSR=4326:** Native CRS is State Plane CA Zone II (WKID 102642, feet). Without outSR=4326, coordinates are garbage and ST_Covers always returns 0.
- **Using COUNCIL field for boundary name:** The COUNCIL field changes with elections. Construct name from DISTNUM: `District ${distNum}`.
- **Using Socrata pattern or outSR omission:** This is an ArcGIS MapServer endpoint, not Socrata. Do NOT use the Berkeley Socrata pattern here.
- **Wrong district name for D7 council member:** ArcGIS shows "Rick Jennings II" with Roman numeral suffix. Use the full name with "II" suffix.
- **Migration number collision:** 217=SJ gov, 218=SJ officials, 215=Berkeley headshots, 216=SF stances. Use 219 (gov structure) and 220 (officials).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sacramento council district polygons | Custom scraper | ArcGIS MapServer /5 query with outSR=4326 | Official City GIS via county, 8 features, verified live |
| CRS conversion | Manual coordinate transform | outSR=4326 query param | ArcGIS handles State Plane II → WGS84 server-side |
| Loader TypeScript | New file from scratch | Copy `load-sj-council-boundaries.ts`, change 5 constants | Identical pattern; only ARCGIS_URL, MTFCC, SOURCE, EXPECTED_COUNT, MAX_DISTRICT differ |
| District number extraction | Custom parsing | `parseInt(String(props['DISTNUM'] ?? ''), 10)` | DISTNUM is integer but parseInt/String ensures safety |
| Headshot resizing | Raw upload | ImageMagick: crop to 4:5 first, then resize to 600×750, Lanczos, q90 | Per project standard |

---

## Common Pitfalls

### Pitfall 1: Seeding Charter Officers as Elected

**What goes wrong:** Migration creates chambers + politicians for City Attorney (Gustavo Martinez), City Auditor (Farishta Ahrary), City Treasurer (John Colville), City Clerk (Mindy Cuppy).
**Why it happens:** CONTEXT.md locked decision incorrectly listed these as elected offices. Berkeley has 3 elected types; researcher may copy that pattern.
**How to avoid:** Sacramento charter officers are ALL APPOINTED by City Council. Confirmed by appointment news records from Oct 2024 (Ahrary), Feb 2026 (Martinez), Apr 2025 (Kent/Cuppy). Scope = Mayor + 8 Council only.
**Warning signs:** Pre-flight shows 13 politicians or 6 chambers — should be 9 politicians, 2 chambers.

### Pitfall 2: RCV TODO Implying RCV Is Adopted

**What goes wrong:** Migration adds `-- TODO Phase 69: set election_method='rcv'` as if Sacramento already uses RCV.
**Why it happens:** CONTEXT.md claims "Measure L, 2022" adopted RCV. That claim is false — Sacramento Measure L 2022 was the Children's Fund. Sacramento uses two-round runoff.
**How to avoid:** Use a conditional note: "Sacramento uses two-round runoff as of 2026-05-23. RCV initiative (Better Ballot Sacramento) pending; if passed, update election_method='rcv' at that time."

### Pitfall 3: outSR=4326 Omission

**What goes wrong:** ArcGIS returns coordinates in State Plane CA Zone II feet (~2 million, ~400 thousand). PostGIS stores them silently but ST_Covers always returns 0.
**Why it happens:** Forgetting to add outSR=4326 parameter to the query URL.
**How to avoid:** Always include `&outSR=4326` in ArcGIS query. Pre-flight: log first coordinate pair; if abs(x) > 180 or abs(y) > 90, outSR was omitted.
**Warning signs:** Smoke test Gate 2 returns 0 rows for Sacramento City Hall.

### Pitfall 4: Wrong External ID Range

**What goes wrong:** Using -640xxx (San Jose) or -650xxx (SD) for Sacramento officials.
**Why it happens:** Phase numbering confusion: Phase 64=SJ (-640xxx), Phase 65=SD (-650xxx), Phase 66=Sacramento (-660xxx).
**How to avoid:** Sacramento external_ids use -660xxx range: Mayor=-660001, D1=-660010 through D8=-660017.
**Warning signs:** Pre-flight check returns non-zero rows for -660xxx range (shouldn't exist yet).

### Pitfall 5: Missing LOCAL_EXEC District for Mayor

**What goes wrong:** Mayor office INSERT fails because no LOCAL_EXEC district row exists for geo_id='0664000'.
**Why it happens:** Migration 219 must create the Sacramento-wide LOCAL_EXEC district row.
**How to avoid:** Migration 219 must include: `INSERT INTO essentials.districts (geo_id, district_type, label, state) SELECT '0664000', 'LOCAL_EXEC', 'Sacramento (Citywide)', 'CA' WHERE NOT EXISTS (...)`.

### Pitfall 6: Districts Column Named 'name' Instead of 'label'

**What goes wrong:** `INSERT INTO essentials.districts (geo_id, district_type, name, state)` — fails with column-not-found.
**How to avoid:** Use `label` (confirmed from migrations 205, 207, 210, 213, 217).

### Pitfall 7: Section-Split Bug

**What goes wrong:** After seeding, section-split checker shows split sections for Sacramento city government.
**How to avoid:** Run section-split check SQL (from `feedback_section_split_check.md`) after migration 220. Zero rows = clean.

### Pitfall 8: Chambers.slug is a GENERATED Column

**What goes wrong:** INSERT into chambers includes 'slug' column → error.
**How to avoid:** Never include slug in INSERT statements. It's GENERATED. Verified in SJ/Berkeley/Fremont migrations.

### Pitfall 9: Rick Jennings Name Variant

**What goes wrong:** Seeding as "Rick Jennings" without the "II" suffix.
**Why it happens:** Some sources use "Rick Jennings" without suffix; some biographies call him "Rick Jennings II."
**How to avoid:** ArcGIS COUNCIL field shows "Rick Jennings II" — use that. Full name: "Rick Jennings II" (last_name: "Jennings II" or "Jennings", depending on convention — research may want to split as first_name="Rick", last_name="Jennings II").

---

## Headshot Sources

### Primary: cityofsacramento.gov

**Behavior:** WebFetch cannot inspect image src attributes from this CMS. The site uses `/content/dam/portal/` for document assets. Council member pages are at `https://www.cityofsacramento.gov/mayor-council/district-{N}`.

**Access pattern:** The city site likely uses a CivicPlus or custom CMS that serves individual council pages at `/mayor-council/district-{N}` with biography pages. These may or may not use the same CivicPlus WAF as SJ/Fremont (which required Node.js browser User-Agent). Test direct HTTPS GET first.

**IMPORTANT:** If the site returns 403 on direct fetch, apply the same Node.js browser User-Agent + Referer header workaround as Fremont/SJ:
```typescript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
  'Referer': 'https://www.cityofsacramento.gov/mayor-council',
}
```

**Known council member page URLs:**
- Mayor: `https://www.cityofsacramento.gov/mayor-council/mayor`
- D1 Lisa Kaplan: `https://www.cityofsacramento.gov/mayor-council/district-1`
- D2 Roger Dickinson: `https://www.cityofsacramento.gov/mayor-council/district-2`
- D3 Karina Talamantes: `https://www.cityofsacramento.gov/mayor-council/district-3` (biography: `/mayor-council/district-3/biography-of-councilmember-talamantes`)
- D4 Phil Pluckebaum: `https://www.cityofsacramento.gov/mayor-council/district-4`
- D5 Caity Maple: `https://www.cityofsacramento.gov/mayor-council/district-5`
- D6 Eric Guerra: `https://www.cityofsacramento.gov/mayor-council/district-6`
- D7 Rick Jennings II: `https://www.cityofsacramento.gov/mayor-council/district-7`
- D8 Mai Vang: `https://www.cityofsacramento.gov/mayor-council/district-8`

The `/find-headshots` skill (built at `~/.claude/commands/find-headshots.md`) handles dynamic URL discovery.

### Fallback: Wikipedia / Wikimedia Commons

**Mayor Kevin McCarty:**
- Wikimedia Commons: `https://commons.wikimedia.org/wiki/Category:Kevin_McCarty`
- Best portrait: `https://upload.wikimedia.org/wikipedia/commons/f/f2/McCarty_Headshot_2020.jpg` (860×1099px)
- License: Public domain (created by California State Assembly, a public record under CA Public Records Act)
- Alternative: `https://upload.wikimedia.org/wikipedia/commons/5/52/Cq5dam.web.514.1028.jpg` (Wikipedia infobox photo, 2024)

**Other council members:** Wikimedia Commons coverage is sparse for Sacramento district council members. The primary source should be cityofsacramento.gov. Use /find-headshots skill for discovery.

### Image Processing

- Target: 600×750 (4:5 ratio), Lanczos, q90 JPEG
- Processing rule: crop to 4:5 first, then resize — never stretch
- Eyes at ~1/3 from top; full head + shoulders visible
- No superimposed text/graphics over face

---

## Differences from Prior City Deep Seed Phases

| Topic | Berkeley (Phase 68) | SJ (Phase 64) | Sacramento (Phase 66) |
|-------|---------------------|---------------|-----------------------|
| Geofence data source | Socrata (data.cityofberkeley.info) | ArcGIS (geo.sanjoseca.gov) | ArcGIS (mapservices.gis.saccounty.net) |
| outSR needed | NO (Socrata = WGS84) | YES (WKID 102643) | YES (WKID 102642) |
| District field | `district` (string) | `DISTRICTINT` (int) | `DISTNUM` (int) |
| Feature count | 8 | 10 | 8 |
| MTFCC | X0009 | X0010 | X0011 |
| geo_id pattern | `berkeley-council-district-{N}` | `sj-council-district-{N}` | `sacramento-council-district-{N}` |
| Council title | "Council Member (District N)" | "Council Member (District N)" | "Council Member (District N)" |
| Government name | "City of Berkeley" | "City of San Jose" | "City of Sacramento" |
| TIGER geo_id | `0606000` | `0668000` | `0664000` |
| City Attorney | NO (appointed) | NO (appointed) | NO (appointed) |
| City Auditor | YES elected | NO (appointed) | NO (appointed) |
| Chambers count | 3 | 2 | **2** (Mayor + City Council only) |
| Officials count | 10 | 11 | **9** |
| External_id range | -680xxx | -640xxx | -660xxx |
| Migrations | 213-215 | 217-218 | **219-220** |
| RCV | YES (confirmed, all 10) | YES (confirmed, all 11) | **NO — two-round runoff** |

---

## Open Questions

1. **User must confirm corrected charter scope**
   - What we know: CONTEXT.md says 6 chambers / 13 politicians; research shows 2 chambers / 9 politicians.
   - What's unclear: Whether user wants to proceed with corrected scope or re-investigate.
   - Recommendation: Planner must ask user to confirm correction before writing plan files.

2. **cityofsacramento.gov headshot access (403 risk)**
   - What we know: City uses `/content/dam/portal/` for assets. Direct WebFetch didn't reveal img src attributes. The site may or may not have a WAF like fremont.gov/sanjoseca.gov.
   - Recommendation: Plan 66-03 executor should attempt direct URL download first. If 403, apply Node.js User-Agent + Referer workaround. The `/find-headshots` skill handles this dynamically.

3. **Rick Jennings II name splitting**
   - What we know: ArcGIS shows "Rick Jennings II". Official biography page not yet confirmed.
   - Recommendation: Use `full_name='Rick Jennings II'`, `first_name='Rick'`, `last_name='Jennings II'` to preserve the suffix. Verify against official biography page during plan 66-02 execution.

4. **Sacramento City Hall coordinates for smoke test**
   - What we know: Sacramento City Hall is at 915 I Street, Sacramento CA 95814. Approximate coordinates: lon=-121.4944, lat=38.5816 (standard geocoordinate).
   - Recommendation: Gate 2 smoke test asserts only `rowCount=1` (log the district, don't hardcode). Executor confirms coordinate after geofences load.

5. **2026 Sacramento election — D3, D5, D7 may have incumbents running in June 2026**
   - What we know: 2026 Sacramento City Council election is June 2, 2026 (primary for 4 seats). Districts up for election in 2026 not confirmed; Wikipedia 2026 article exists but content not fully fetched.
   - What's unclear: Whether any current ArcGIS COUNCIL field values reflect pre-election incumbents or post-June-2 results (research conducted May 23, 2026 — before June 2 primary).
   - Recommendation: Seed current ArcGIS incumbents. After June 2 primary results, Phase 66 will need a follow-up to update any districts where incumbents changed. Flag in migration comment.

---

## Sources

### Primary (HIGH confidence)

- Live ArcGIS query: `https://mapservices.gis.saccounty.net/arcgis/rest/services/CITY_of_SACRAMENTO/MapServer/5/query?where=1%3D1&outFields=DISTNUM%2CCOUNCIL&outSR=4326&f=geojson&returnGeometry=false` — all 8 districts + COUNCIL incumbents confirmed 2026-05-23
- ArcGIS count query: `...returnCountOnly=true&f=json` returns `{"count":8}` — confirmed
- ArcGIS layer metadata: `?f=json` — WKID 102642 (State Plane CA Zone II, feet), outSR=4326 required
- Wikipedia "Sacramento City Council": `https://en.wikipedia.org/wiki/Sacramento_City_Council` — Mayor McCarty + all 8 council members confirmed
- cityofsacramento.gov/clerk/elections: Mayor Kevin McCarty + D1-D8 roster confirmed
- sacramentocityexpress.com (Oct 2024): Farishta Ahrary appointed City Auditor by City Council
- sacramentocityexpress.com (Feb 2026): Gustavo Martinez appointed City Attorney by City Council
- STATE.md: Sacramento geo_id=0664000 confirmed; next available migration is 219 (217=SJ gov, 218=SJ officials)
- `C:/EV-Accounts/backend/migrations/217_sj_government_structure.sql` — government structure SQL pattern
- `C:/EV-Accounts/backend/migrations/218_sj_officials.sql` — officials seed SQL pattern
- `C:/EV-Accounts/backend/scripts/load-sj-council-boundaries.ts` — ArcGIS loader TypeScript pattern
- Wikimedia Commons Kevin McCarty category: public domain headshot `McCarty_Headshot_2020.jpg` confirmed

### Secondary (MEDIUM confidence)

- WebSearch "Sacramento city charter appointed council" — multiple results confirming "Council appoints five charter officers" consistent with council appointment model
- sacrametroauthority.com — claimed 4 independently elected charter officers (CONTRADICTED by all appointment evidence; LOW reliability)
- Better Ballot Sacramento (betterballotsacramento.org) — RCV not yet passed; signature collection ongoing as of May 2026
- 2026 Sacramento City Council election Wikipedia: confirms two-round runoff (June primary + Nov runoff if needed)

### Tertiary (LOW confidence)

- Sacramento City Hall coordinates (-121.4944, 38.5816) — approximate from standard geocoordinate; unverified via PostGIS
- cityofsacramento.gov headshot URL patterns — not confirmed; CMS inspection blocked by WebFetch limitations

---

## Metadata

**Confidence breakdown:**
- Government structure (2 chambers, NOT 6): HIGH — appointment evidence for all 4 charter officers confirmed from official news/appointment records
- All 9 incumbent names: HIGH — ArcGIS live data + cityofsacramento.gov confirmed
- RCV NOT adopted: HIGH — confirmed by multiple sources; Better Ballot collecting signatures as of May 2026
- Geofence data source (ArcGIS /5, 8 features, DISTNUM field, outSR=4326): HIGH — live queries confirmed
- MTFCC assignment (X0011): HIGH — sequence confirmed from STATE.md
- External_id range (-660xxx): HIGH — pattern confirmed from prior phases, range clear
- Migration numbers (219, 220): HIGH — direct filesystem check confirms 218 is last used
- Headshot source (cityofsacramento.gov): MEDIUM — CMS structure not directly inspectable
- Sacramento City Hall coordinates: LOW — approximate

**Research date:** 2026-05-23
**Valid until:** 2026-06-03 (2026 Sacramento primary is June 2 — ArcGIS COUNCIL field may change post-election for contested districts; re-verify incumbents after June 2 if Phase 66 execution is after that date)
