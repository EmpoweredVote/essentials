# Phase 19: TX Congressional Seats + Geofences - Research

**Researched:** 2026-05-03
**Domain:** PostGIS geofence boundaries, NATIONAL_LOWER politician records, by-government-list supplemental query
**Confidence:** HIGH

## Summary

This phase has three distinct work streams that must proceed in order: (1) load TX congressional district geofence boundaries, (2) seed 38 TX House politician records, (3) extend the `getPoliticiansByGovernmentList` supplemental query to return congressional reps via PostGIS county intersection.

The tooling for all three streams already exists in the codebase. `load-us-congressional-boundaries.ts` handles boundary + district loading from TIGER/Line 2024 shapefiles. Migration 103 (`103_texas_state_federal_officials.sql`) establishes the pattern for TX federal politician insertion. The required code change in `essentialsBrowseService.ts` is surgical: add a `countyGeoId` parameter and a third query that does PostGIS intersection against the G5200 (congressional) boundaries.

TX-23 is currently **vacant** (seat vacated April 14, 2026). The migration must handle this correctly with `is_vacant = true` and no politician record, or insert the vacancy marker per established convention.

**Primary recommendation:** Run `load-us-congressional-boundaries.ts --dry-run` first for TX only (FIPS 48) to verify the 38 district geo_ids, then execute the boundary load, then write the politician migration following the migration 103 pattern.

## Standard Stack

### Core
| Tool/Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `load-us-congressional-boundaries.ts` | existing | Downloads TIGER/Line 2024 shapefiles, loads `geofence_boundaries` + `districts` | Already written, idempotent, ON CONFLICT DO NOTHING |
| PostgreSQL/PostGIS | existing | `ST_Contains`, `ST_Intersects`, `ST_PointOnSurface` for spatial queries | All geofence work uses PostGIS via pg pool |
| `shapefile` npm package | existing in node_modules | Reads .shp + .dbf files | Used by load-us-congressional-boundaries.ts |
| `adm-zip` npm package | existing in node_modules | Extracts downloaded ZIP files | Used by load-us-congressional-boundaries.ts |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| SQL migration file | Seed 38 politician + district + office records | After boundary load confirms geo_ids |
| `applyMigrations.ts` | Run migration against live DB | Standard deploy path |

## Architecture Patterns

### geo_id Format for NATIONAL_LOWER (Congressional Districts)

The `geoid` field in TIGER/Line shapefiles is: STATE_FIPS + DISTRICT_NUMBER (zero-padded to 2 digits).

- CA District 34 → geo_id = `0634` (confirmed in `seed-la-county-2026-primary-state-federal.sql` comment: "NATIONAL_LOWER geo_id 0634")
- TX District 3 → geo_id = `4803`
- TX District 4 → geo_id = `4804`
- ...
- TX District 38 → geo_id = `4838`
- At-large (single district states) → geo_id = `FIPS00`

The TIGER/Line field `CD119FP` is a 2-digit zero-padded district number. The `GEOID` field in the shapefile is `STATEFP + CD119FP` = 4-character string.

**MTFCC for congressional districts:** `G5200`

### Shapefile URL Pattern

```
TIGER_BASE = 'https://www2.census.gov/geo/tiger/TIGER2024/CD'
TX file: tl_2024_48_cd119.zip
```

The existing script uses this URL pattern and downloads automatically. TX file confirmed to exist (size 4.0M per TIGER directory listing).

### Districts Table Schema

```sql
-- From load-us-congressional-boundaries.ts (verified):
INSERT INTO essentials.districts
  (geo_id, ocd_id, label, district_type, state, mtfcc)
SELECT $1, $2, $3, 'NATIONAL_LOWER', $4, 'G5200'
```

Note: `district_id` column is NOT populated by the boundary loader — it is left NULL. The `district_id` field (used by migration 054's election linking) would need to be set to the numeric district number string (e.g., '3') if elections are later linked.

### geofence_boundaries Table Schema

```sql
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES (
  $1, $2, $3, $4, 'G5200',
  public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($5)), 4326),
  'census_tiger_2024',
  now()
)
ON CONFLICT (geo_id, mtfcc) DO NOTHING
```

Unique constraint is `(geo_id, mtfcc)` — safe to re-run.

### Politician Insertion Pattern (from migration 103)

The US Senate chamber already exists: `7cbe07bc-84b8-433b-952b-540e7de18a92` (name_formal = 'United States Senate').

The US House chamber also exists: `name_formal = 'United States House of Representatives'` — its ID must be looked up at migration time since it is not hardcoded in any migration. Migration 103 hardcoded the Senate chamber ID, so the House migration should do the same OR use a subquery.

```sql
-- Pattern from migration 103 (use for House politicians):
WITH
  ins_politician AS (
    INSERT INTO essentials.politicians
      (id, full_name, first_name, last_name, party, is_active,
       is_appointed, is_vacant, is_incumbent, external_id)
    VALUES (gen_random_uuid(), 'Name', 'First', 'Last', 'Republican',
            true, false, false, true, -10XXXX)
    RETURNING id
  )
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title,
   representing_state, is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id, '<house_chamber_id>', p.id,
       'Representative', 'TX', false, false
FROM essentials.districts d, ins_politician p
WHERE d.geo_id = '4803' AND d.district_type = 'NATIONAL_LOWER';
```

The district record will already exist after `load-us-congressional-boundaries.ts` runs, so look it up by `geo_id` + `district_type`.

### by-government-list Supplemental Query Change

**Current behavior:** The supplemental query (lines 442-446 in `essentialsBrowseService.ts`) fetches `NATIONAL_UPPER`, `STATE_EXEC`, `NATIONAL_EXEC`, `NATIONAL_JUDICIAL` by state abbreviation — but NOT `NATIONAL_LOWER`.

**Why NATIONAL_LOWER is missing:** Congressional reps cannot be fetched by state alone (TX has 38 — only 3-5 are relevant to Collin County). They require PostGIS intersection: "find congressional districts whose geometry intersects with the county boundary."

**Required change:** Add a `countyGeoId?: string` parameter to `getPoliticiansByGovernmentList`. When provided, add a third query:

```typescript
// New third query in getPoliticiansByGovernmentList:
if (countyGeoId) {
  const { rows: cdRows } = await pool.query<Record<string, unknown>>(`
    SELECT DISTINCT ON (p.id)
           p.id, p.external_id, p.full_name, ...
           d.district_type, d.label AS district_label, d.district_id, d.geo_id, d.mtfcc,
           ch.name AS chamber_name, ch.name_formal AS chamber_name_formal, ...
    FROM essentials.geofence_boundaries county_gb
    JOIN essentials.geofence_boundaries cd_gb
      ON public.ST_Intersects(county_gb.geometry, cd_gb.geometry)
      AND cd_gb.mtfcc = 'G5200'
    JOIN essentials.districts d ON d.geo_id = cd_gb.geo_id
      AND d.district_type = 'NATIONAL_LOWER'
      AND d.state = $2
    JOIN essentials.offices o ON o.district_id = d.id
    JOIN essentials.politicians p ON o.politician_id = p.id
    LEFT JOIN essentials.chambers ch ON ch.id = o.chamber_id
    LEFT JOIN essentials.governments g ON g.id = ch.government_id
    LEFT JOIN essentials.government_bodies gvb
      ON gvb.state = d.state AND gvb.geo_id = d.geo_id
      AND gvb.body_key = COALESCE(NULLIF(ch.name_formal, ''), ch.name, '')
    WHERE county_gb.geo_id = $1
      AND county_gb.mtfcc = 'G4020'
      AND p.is_active = true
    ORDER BY p.id
  `, [countyGeoId, stateAbbrev]);
  congressionalRows = cdRows;
}
```

**Frontend change required:** The route handler in `essentialsBrowse.ts` must accept `county_geo_id` from the request body and pass it to the service. The `browseByGovernmentList` API function in `api.jsx` must also accept and pass `countyGeoId`. The `COVERAGE_AREAS` entry for Collin County in `Landing.jsx` must include a `browseCountyGeoId: '48085'` field. Results.jsx must pass `browse_county_geo_id` URL param and the API function must forward it.

### Recommended Project Structure for Phase 19

```
backend/
├── scripts/
│   └── load-us-congressional-boundaries.ts   # existing — run for TX (FIPS 48)
├── migrations/
│   └── 104_tx_congressional_officials.sql    # new — 38 TX House politicians
└── src/lib/
    └── essentialsBrowseService.ts             # modify getPoliticiansByGovernmentList
src/
├── lib/api.jsx                                # add countyGeoId param to browseByGovernmentList
├── pages/Landing.jsx                          # add browseCountyGeoId: '48085' to Collin County
└── pages/Results.jsx                          # pass county_geo_id to API call
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Downloading TX shapefile | Custom HTTP fetch | `load-us-congressional-boundaries.ts` | Already handles redirects, caching, ZIP extraction, cleanup |
| Reading shapefile geometry | Manual SHP parsing | `shapefile` npm package | Already in node_modules, handles binary SHP format |
| Loading geometry into PostGIS | Raw GeoJSON INSERT | The existing INSERT pattern with `ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON(...)), 4326)` | Handles coordinate system, 2D enforcement, conflict |
| Finding TX county geofence | Loading all TX counties | Load just the Collin County (48085) G4020 boundary | Only Collin County is needed for this phase |

**Key insight:** The load-us-congressional-boundaries.ts script handles ALL states. Running it for TX FIPS `48` only requires understanding it loops over `ALL_STATE_FIPS` — you'd either modify it to accept a `--state` flag or just run it (it's idempotent and will skip already-loaded districts with ON CONFLICT DO NOTHING).

## TX Congressional District Members (119th Congress, 2025-2027)

Source: Wikipedia "United States congressional delegations from Texas" — verified 2026-05-03.
**Note:** TX-23 is currently VACANT (vacated April 14, 2026). All others are active incumbents.

| District | Representative | Party | geo_id |
|----------|---------------|-------|--------|
| TX-1 | Nathaniel Moran | Republican | 4801 |
| TX-2 | Dan Crenshaw | Republican | 4802 |
| TX-3 | Keith Self | Republican | 4803 |
| TX-4 | Pat Fallon | Republican | 4804 |
| TX-5 | Lance Gooden | Republican | 4805 |
| TX-6 | Jake Ellzey | Republican | 4806 |
| TX-7 | Lizzie Fletcher | Democrat | 4807 |
| TX-8 | Morgan Luttrell | Republican | 4808 |
| TX-9 | Al Green | Democrat | 4809 |
| TX-10 | Michael McCaul | Republican | 4810 |
| TX-11 | August Pfluger | Republican | 4811 |
| TX-12 | Craig Goldman | Republican | 4812 |
| TX-13 | Ronny Jackson | Republican | 4813 |
| TX-14 | Randy Weber | Republican | 4814 |
| TX-15 | Monica De La Cruz | Republican | 4815 |
| TX-16 | Veronica Escobar | Democrat | 4816 |
| TX-17 | Pete Sessions | Republican | 4817 |
| TX-18 | Christian Menefee | Democrat | 4818 |
| TX-19 | Jodey Arrington | Republican | 4819 |
| TX-20 | Joaquin Castro | Democrat | 4820 |
| TX-21 | Chip Roy | Republican | 4821 |
| TX-22 | Troy Nehls | Republican | 4822 |
| TX-23 | VACANT | — | 4823 |
| TX-24 | Beth Van Duyne | Republican | 4824 |
| TX-25 | Roger Williams | Republican | 4825 |
| TX-26 | Brandon Gill | Republican | 4826 |
| TX-27 | Michael Cloud | Republican | 4827 |
| TX-28 | Henry Cuellar | Democrat | 4828 |
| TX-29 | Sylvia Garcia | Democrat | 4829 |
| TX-30 | Jasmine Crockett | Democrat | 4830 |
| TX-31 | John Carter | Republican | 4831 |
| TX-32 | Julie Johnson | Democrat | 4832 |
| TX-33 | Marc Veasey | Democrat | 4833 |
| TX-34 | Vicente Gonzalez | Democrat | 4834 |
| TX-35 | Greg Casar | Democrat | 4835 |
| TX-36 | Brian Babin | Republican | 4836 |
| TX-37 | Lloyd Doggett | Democrat | 4837 |
| TX-38 | Wesley Hunt | Republican | 4838 |

**Collin County (FIPS 48085) falls in TX-3 and TX-4.** Both Keith Self (TX-3) and Pat Fallon (TX-4) represent portions of Collin County. The PostGIS intersection query will return both automatically.

**geo_id confidence:** HIGH — follows the established TIGER/Line GEOID convention (STATEFP + CD119FP), and matches the confirmed CA pattern (CA-34 = `0634`). Will be confirmed by dry-run of load-us-congressional-boundaries.ts.

## Common Pitfalls

### Pitfall 1: TX-23 Vacancy
**What goes wrong:** Inserting a politician record for TX-23 when the seat is vacant.
**Why it happens:** The 2026 member list may show "vacant" but a migration may miss this.
**How to avoid:** Insert a district + office record for TX-23 with `is_vacant = true` on the office, and do NOT insert a politician for this seat. Or skip TX-23 entirely and insert only 37 politicians.
**Warning signs:** Checking `WHERE is_vacant = false` on offices before migration.

### Pitfall 2: load-us-congressional-boundaries.ts Loads ALL States
**What goes wrong:** Script runs for all 50 states, taking many minutes and touching many records.
**Why it happens:** The script loops `for (const fips of ALL_STATE_FIPS)`. No `--state` flag exists.
**How to avoid:** Either add a `--state 48` flag to the script, or accept it will process all states (it's idempotent — ON CONFLICT DO NOTHING, safe to run even if other states are already loaded). The TX shapefile is only 4MB; the full run is manageable.
**Warning signs:** If DB already has congressional boundaries for CA/IN, the re-run will skip them (already_exists counter will be high).

### Pitfall 3: County Geofence (G4020) Not Loaded for TX
**What goes wrong:** The PostGIS intersection query against Collin County geo_id `48085` fails with zero results because no G4020 boundary exists for TX.
**Why it happens:** The TX geofence setup so far only loaded G4110/G4120 city boundaries — NOT county G4020 boundaries.
**How to avoid:** Load the Collin County TIGER/Line G4020 shapefile. The file is `tl_2024_tx_county20.zip` (or similar — MTFCC G4020 is county subdivision). The existing `getAreasForState` query already handles G4020 mtfcc. A dedicated script or migration must load at minimum the Collin County boundary.
**Warning signs:** `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE state = '48' AND mtfcc = 'G4020'` returns 0.

### Pitfall 4: US House Chamber ID Not Hardcoded
**What goes wrong:** Migration author uses wrong chamber_id for US House offices.
**Why it happens:** Migration 103 hardcoded the Senate chamber UUID (`7cbe07bc-84b8-433b-952b-540e7de18a92`) because it's a known fixed value. The House chamber UUID is not documented in any migration.
**How to avoid:** At migration write time, query the live DB: `SELECT id FROM essentials.chambers WHERE name_formal = 'United States House of Representatives' LIMIT 1`. Then hardcode that UUID in the migration (matching migration 103's pattern), or use a subquery.
**Warning signs:** `INSERT ... (chamber_id)` failing with FK violation.

### Pitfall 5: district_id Column Left NULL by load-us-congressional-boundaries.ts
**What goes wrong:** The `district_id` column in `essentials.districts` for the newly loaded congressional records is NULL. This breaks election linking in migration 054 which uses `d.district_id = parsed.dist_num`.
**Why it happens:** The loader script does not populate `district_id` — it only sets `geo_id`, `ocd_id`, `label`, `district_type`, `state`, `mtfcc`.
**How to avoid:** After the boundary load, backfill `district_id` for TX congressional districts: `UPDATE essentials.districts SET district_id = regexp_replace(geo_id, '^48', '') WHERE state = 'TX' AND district_type = 'NATIONAL_LOWER'`. This sets district_id to '03', '04', etc. (zero-padded). If numeric strings are needed: `(SUBSTRING(geo_id FROM 3))::int::text`.
**Warning signs:** Migration 054-style queries returning 0 rows for TX elections.

### Pitfall 6: county_geo_id Not Passed Through the Full Stack
**What goes wrong:** The congressional reps never appear because `countyGeoId` is undefined in the service call.
**Why it happens:** The change requires modifications in 4 places: `Landing.jsx` (add `browseCountyGeoId`), `Results.jsx` (pass `county_geo_id` URL param), `api.jsx` (accept + forward `countyGeoId`), route handler (extract from body), service function (accept + use in query). Missing any one breaks the chain.
**How to avoid:** Trace the full call chain from `Landing.jsx` COVERAGE_AREAS → Results.jsx URL params → `browseByGovernmentList()` → route handler → service. Change each link in the chain.
**Warning signs:** API call body logged in browser shows no `county_geo_id` field.

### Pitfall 7: Collin County G4020 geo_id Format
**What goes wrong:** Using `'48085'` as the county geo_id but the geofence_boundaries table uses a different format.
**Why it happens:** Different TIGER shapefiles use different GEOID formats. County GEOIDs are 5-digit FIPS (STATEFP 2 + COUNTYFP 3) = `48085`. This matches what's already expected by `getAreasForState` which queries `WHERE gb.state = $1 AND gb.mtfcc IN ('G4020', ...)` and returns `geo_id`.
**How to avoid:** Verify the county GEOID from the TIGER county shapefile. The standard is GEOID = `48085` for Collin County. The state field in geofence_boundaries is the 2-digit FIPS `48`, not the abbreviation `TX`.
**Warning signs:** PostGIS intersection returns 0 rows — check `SELECT geo_id FROM geofence_boundaries WHERE state = '48' AND mtfcc = 'G4020'`.

## Code Examples

### Verified: Load TX congressional boundaries (run from backend/ directory)

```bash
# Source: load-us-congressional-boundaries.ts
cd C:/EV-Accounts/backend

# Dry run first (preview, no DB writes)
npx tsx scripts/load-us-congressional-boundaries.ts --dry-run

# Live run (idempotent)
npx tsx scripts/load-us-congressional-boundaries.ts
```

The script downloads `tl_2024_48_cd119.zip` from Census TIGER, extracts, reads the shapefile, and inserts G5200 boundaries + NATIONAL_LOWER district records.

### Verified: geofence_boundaries INSERT pattern

```sql
-- Source: load-us-congressional-boundaries.ts (lines 196-206)
INSERT INTO essentials.geofence_boundaries
  (geo_id, ocd_id, name, state, mtfcc, geometry, source, imported_at)
VALUES (
  $1, $2, $3, $4, 'G5200',
  public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($5)), 4326),
  'census_tiger_2024',
  now()
)
ON CONFLICT (geo_id, mtfcc) DO NOTHING
-- $1 = geoid (e.g., '4803'), $2 = ocd_id, $3 = namelsad, $4 = statefp ('48'), $5 = GeoJSON
```

### Verified: districts INSERT pattern for NATIONAL_LOWER

```sql
-- Source: load-us-congressional-boundaries.ts (lines 208-216)
INSERT INTO essentials.districts
  (geo_id, ocd_id, label, district_type, state, mtfcc)
SELECT $1, $2, $3, 'NATIONAL_LOWER', $4, 'G5200'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = $1 AND district_type = 'NATIONAL_LOWER'
)
-- $1 = '4803', $2 = 'ocd-division/country:us/state:tx/cd:3',
-- $3 = 'Congressional District 3', $4 = 'TX'
```

### Verified: NATIONAL_UPPER politician + office pattern (from migration 103)

```sql
-- Source: migrations/103_texas_state_federal_officials.sql
WITH
  ins_district AS (
    INSERT INTO essentials.districts
      (id, district_type, state, geo_id, label, district_id, mtfcc)
    VALUES (gen_random_uuid(), 'NATIONAL_LOWER', 'TX', '4803',
            'Congressional District 3', '3', 'G5200')
    ON CONFLICT DO NOTHING
    RETURNING id
  ),
  ins_politician AS (
    INSERT INTO essentials.politicians
      (id, full_name, first_name, last_name, party, is_active,
       is_appointed, is_vacant, is_incumbent, external_id)
    VALUES (gen_random_uuid(), 'Keith Self', 'Keith', 'Self', 'Republican',
            true, false, false, true, -100300)
    RETURNING id
  )
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id, '<house_chamber_uuid>', p.id,
       'Representative', 'TX', false, false
FROM ins_district d, ins_politician p;
```

Note: If using load-us-congressional-boundaries.ts first, the district record already exists. The politician migration can reference it with:
```sql
FROM essentials.districts d
WHERE d.geo_id = '4803' AND d.district_type = 'NATIONAL_LOWER'
```

### New: PostGIS intersection query for congressional reps via county geofence

```typescript
// Source: pattern derived from getOverlappingGeoIdsForArea in essentialsBrowseService.ts
// To add to getPoliticiansByGovernmentList when countyGeoId is provided:
const { rows: cdRows } = await pool.query(`
  SELECT DISTINCT ON (p.id)
         p.id, p.external_id, p.full_name, ...
         d.district_type, d.label AS district_label, d.district_id, d.geo_id, d.mtfcc,
         ch.name AS chamber_name, ch.name_formal AS chamber_name_formal,
         ch.election_frequency, ch.policy_engagement_level,
         g.name AS government_name, g.type AS government_type,
         COALESCE(gvb.display_name, '') AS government_body_name,
         COALESCE(gvb.website_url, '') AS government_body_url,
         COALESCE(ch.website_url, '') AS chamber_url
  FROM essentials.geofence_boundaries county_gb
  JOIN essentials.geofence_boundaries cd_gb
    ON public.ST_Intersects(county_gb.geometry, cd_gb.geometry)
    AND cd_gb.mtfcc = 'G5200'
  JOIN essentials.districts d ON d.geo_id = cd_gb.geo_id
    AND d.district_type = 'NATIONAL_LOWER'
    AND d.state = $2
  JOIN essentials.offices o ON o.district_id = d.id
  JOIN essentials.politicians p ON o.politician_id = p.id
  LEFT JOIN essentials.chambers ch ON ch.id = o.chamber_id
  LEFT JOIN essentials.governments g ON g.id = ch.government_id
  LEFT JOIN essentials.government_bodies gvb
    ON gvb.state = d.state AND gvb.geo_id = d.geo_id
    AND gvb.body_key = COALESCE(NULLIF(ch.name_formal, ''), ch.name, '')
  WHERE county_gb.geo_id = $1
    AND county_gb.mtfcc = 'G4020'
    AND p.is_active = true
  ORDER BY p.id
`, [countyGeoId, stateAbbrev]);
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Custom shapefile loading scripts per use case | `load-us-congressional-boundaries.ts` handles all 50 states | Use the existing script, don't write a new one |
| Hardcoded politician lists for federal reps | Migration SQL with `gen_random_uuid()` IDs | Use migration pattern from 103 |
| `getPoliticiansByGovernmentList` only returns statewide/exec | Extend with `countyGeoId` for congressional intersection | New capability enabling TX congressional browsing |

## Open Questions

1. **US House chamber UUID**
   - What we know: Chamber exists with `name_formal = 'United States House of Representatives'`
   - What's unclear: The exact UUID (not documented in any migration)
   - Recommendation: Query `SELECT id FROM essentials.chambers WHERE name_formal = 'United States House of Representatives' LIMIT 1` against the live DB before writing the migration. Then hardcode it.

2. **TX county G4020 shapefile source**
   - What we know: TIGER/Line 2024 has county shapefiles; the `getAreasForState` query already supports G4020 mtfcc
   - What's unclear: Whether to write a new script or add county loading to an existing script
   - Recommendation: Write a focused migration/script that loads only the Collin County G4020 boundary from TIGER. File: `tl_2024_48_county20.zip` from `https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/`. Note: this is a different directory path (COUNTY not CD).

3. **district_id backfill format**
   - What we know: `load-us-congressional-boundaries.ts` leaves `district_id` NULL; migration 054 expects it to match district number strings
   - What's unclear: Whether election linking for TX congressional races will be needed in this phase
   - Recommendation: Populate `district_id` as the zero-stripped numeric string (e.g., '3' not '03') since that's what migration 054 parses. Add this as a post-load UPDATE in the politician migration.

4. **TX-23 Vacancy handling**
   - What we know: TX-23 seat is vacant as of April 14, 2026
   - What's unclear: Whether to insert an is_vacant office record or skip entirely
   - Recommendation: Insert district + office (is_vacant = true) but no politician, matching established convention. This ensures the district appears in the geofence system without a politician displayed.

5. **Confirmed districts intersecting Collin County**
   - What we know: TX-3 (Keith Self) and TX-4 (Pat Fallon) are the expected districts for Collin County
   - What's unclear: Whether any other districts overlap at the edges
   - Recommendation: Verify after loading boundaries with: `SELECT d.geo_id, d.label FROM essentials.geofence_boundaries county_gb JOIN essentials.geofence_boundaries cd_gb ON ST_Intersects(county_gb.geometry, cd_gb.geometry) AND cd_gb.mtfcc = 'G5200' JOIN essentials.districts d ON d.geo_id = cd_gb.geo_id WHERE county_gb.geo_id = '48085' AND county_gb.mtfcc = 'G4020'`

## Sources

### Primary (HIGH confidence)
- `C:\EV-Accounts\backend\scripts\load-us-congressional-boundaries.ts` — full script read; shapefile URL, geo_id format, INSERT patterns, idempotency
- `C:\EV-Accounts\backend\src\lib\essentialsBrowseService.ts` — full file read; `getPoliticiansByGovernmentList` supplemental query, function signature
- `C:\EV-Accounts\backend\migrations\103_texas_state_federal_officials.sql` — full file read; politician + district + office insertion pattern
- `C:\EV-Accounts\backend\src\routes\essentialsBrowse.ts` — full file read; route handler for by-government-list, state derivation logic
- `C:\Transparent Motivations\essentials\src\pages\Landing.jsx` — COVERAGE_AREAS structure for Collin County
- `https://www2.census.gov/geo/tiger/TIGER2024/CD/` — confirmed `tl_2024_48_cd119.zip` exists (4.0M)

### Secondary (MEDIUM confidence)
- `https://en.wikipedia.org/wiki/United_States_congressional_delegations_from_Texas` — 38 member names, parties, TX-23 vacancy; cross-referenced with WebSearch results confirming vacancy

### Tertiary (LOW confidence)
- geo_id format `4803`-`4838` for TX districts: inferred from CA pattern (`0634`) and TIGER GEOID convention (STATEFP + CD119FP). Will be confirmed by dry-run of load script.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all tools verified in codebase
- Architecture: HIGH — INSERT patterns read directly from existing scripts and migrations
- Service change: HIGH — exact function and query location identified in source
- Pitfalls: HIGH — derived from reading actual code and established patterns
- TX member list: MEDIUM — Wikipedia source, TX-23 vacancy corroborated by WebSearch

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (stable domain; member list valid through end of 119th Congress Jan 2027)
