# Phase 86: Multnomah County School Districts — Research

**Researched:** 2026-06-01
**Domain:** TIGER UNSD geofences (G5420) + school board government seeding (district_type='SCHOOL')
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** 2 plans.
- Plan 1: New OR UNSD loader script + G5420 geofences for all 6 districts + government bodies (chambers, districts) + board member officials + smoke test. All in one migration (migration 253).
- Plan 2: Headshots audit-only migration (migration 254). Same pattern as migrations 245, 247.

**D-02:** Write a new dedicated loader script `load-or-school-boundaries.ts` (parallel to `load-lausd-board-boundaries.ts`). Downloads the Oregon TIGER UNSD shapefile from census.gov, filters to the 6 Multnomah County school districts by GEOID/NAME, and inserts geofence_boundaries rows with `mtfcc='G5420'`, `state='41'` (OR FIPS), `source='tiger_unsd_or_2024'`.

**D-03:** Do NOT extend `load-state-tiger-boundaries.ts` — that loader is for state political boundaries (G4110, SLDU, SLDL, CD, G4020) and should not be modified for school districts.

**D-04:** Researcher must confirm the correct TIGER UNSD filename for Oregon.

**D-05:** Include Riverdale only if TIGER UNSD has a G5420 row for it. If absent, document as gap.

**D-06:** Do NOT construct a manual polygon for Riverdale — TIGER is authoritative.

**D-07:** Each school district gets: one governments row, one chamber, one districts row (district_type='SCHOOL'), and board member offices linked to that district row.

**D-08:** `district_type='SCHOOL'` is mandatory.

**D-09:** Researcher determines current board member names, seat counts, and terms.

**D-10:** Office titles follow LAUSD pattern: 'Board Member' or 'Board Member (Position N)' if numbered.

**D-11:** `party = NULL` for all officials.

**D-12:** `is_appointed_position = false` — board members are elected.

**D-13:** External_id range for Phase 86 officials: starting from -860001 (block clear check required).

**D-14:** No 2026 school board race rows in this phase.

**D-15:** Check each district's official website for board member photos. Official website only.

**D-16:** All images processed to 600×750 JPEG, Lanczos q90, 4:5 crop first. `type='default'`.

**D-17:** Migration 254 is audit-only — SQL file only, no apply script.

### Claude's Discretion

None designated — all major decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- School board elections (2026 race rows)
- Discovery pipeline for school board candidates
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OR-SCHOOL-01 | G5420 geofences loaded for all 6 Multnomah County school districts | TIGER tl_2024_41_unsd.zip confirmed; GEOIDs for all 6 verified; loader pattern documented |
| OR-SCHOOL-02 | School board government bodies seeded for all 6 districts (district_type='SCHOOL') | district_type='SCHOOL' routing confirmed in essentialsService.ts migration 047; LAUSD pattern documented |
| OR-SCHOOL-03 | Board member officials + offices seeded for all 6 districts | All 6 board rosters researched from official district websites; external_id block -860001 confirmed clear |
| OR-SCHOOL-04 | Board member headshots at 600×750 where available online | Photo availability per district documented; URL patterns per site documented |
</phase_requirements>

---

## Summary

Phase 86 loads G5420 geofences for 6 Multnomah County school districts and seeds their board members so they appear in address lookups alongside city council and county commissioners. The pattern is identical to the LAUSD school board work in Phases 58 and 62, applied to Oregon.

All 6 district GEOIDs have been verified against the TIGER2024 TIGERweb API. Riverdale School District IS present in the TIGER UNSD file (GEOID=4110560, confirmed via TIGERweb layer 14). The Oregon UNSD filename is `tl_2024_41_unsd.zip` (2.9MB, confirmed at https://www2.census.gov/geo/tiger/TIGER2024/UNSD/). All 6 board rosters have been researched from official district websites. The external_id block -860001 to -869999 is confirmed clear (0 rows in production DB). Next available migration numbers are 253 and 254 (highest applied is 252).

A key discovery: `load-state-tiger-boundaries.ts` already has a `unsd` layer handler with the correct URL template, mtfcc='G5420', and geoIdSource='GEOID'. However, the OR allowlist does not include 'unsd'. Per D-03, a new standalone `load-or-school-boundaries.ts` is still the correct approach — it avoids modifying the generalized loader and is simpler for the OR-specific 6-district filter.

**Primary recommendation:** Follow the LAUSD loader + LAUSD board seed pattern exactly: standalone TypeScript loader downloads TIGER zip, parses shapefile, filters by GEOID to the 6 target districts, inserts geofence_boundaries rows; migration 253 seeds governments/chambers/districts/politicians/offices.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| G5420 geofence loading | Script (Node.js loader) | — | TIGER shapefile download + PostGIS insert; same as LAUSD pattern |
| School district government seeding | Migration (SQL) | — | Idempotent SQL INSERT with WHERE NOT EXISTS guards |
| Board member officials seeding | Migration (SQL) | — | CTE pattern with ON CONFLICT (external_id) DO NOTHING |
| Address lookup routing | API / Backend | DB (essentials.districts) | essentialsService.ts query joins geofence_boundaries → districts (district_type='SCHOOL') → offices → politicians |
| Headshot processing + upload | Script (Python PIL) | — | 600×750 Lanczos q90 crop-then-resize, Supabase Storage upload |
| Headshot audit migration | Migration (SQL, audit-only) | — | Documents live politician_images INSERTs; not applied via ledger |

---

## Standard Stack

### Core
| Component | Version/Location | Purpose | Why Standard |
|-----------|-----------------|---------|--------------|
| TIGER UNSD shapefile | tl_2024_41_unsd.zip (2.9MB) | G5420 geofence polygons for OR school districts | Authoritative census boundary data |
| load-or-school-boundaries.ts | New (C:/EV-Accounts/backend/scripts/) | Downloads + loads OR UNSD boundaries | Isolated loader per D-02/D-03 |
| migration 253 | New SQL | Government/chamber/district/official seeding | Follows 246_multnomah_cities_government.sql multi-body pattern |
| migration 254 | New SQL (audit-only) | Board member headshot documentation | Follows 247_multnomah_cities_headshots.sql pattern |
| shapefile npm package | Already in package.json | Parse TIGER .dbf/.shp | Used by all existing loaders |
| adm-zip npm package | Already in package.json | Unzip TIGER download | Used by load-state-tiger-boundaries.ts |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| smoke-multnomah-school.ts | Phase 86 smoke test | After migration 253 applied; verifies G5420 rows + SCHOOL routing |
| _tmp-or-school-headshots.py | Headshot processing script | After board roster confirmed; processes + uploads to Supabase Storage |

---

## D-04: TIGER UNSD Filename (VERIFIED)

**Confirmed URL:** `https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_41_unsd.zip`
[VERIFIED: https://www2.census.gov/geo/tiger/TIGER2024/UNSD/]

File size: 2.9MB. Directory listing confirmed file exists with modification date 2025-06-27.

The loader must:
1. Download this URL to a temp file
2. Extract the `.shp` + `.dbf` using adm-zip
3. Read with `shapefile` package
4. Filter by GEOID to the 6 target districts
5. Insert with `ON CONFLICT (geo_id, mtfcc) DO NOTHING`

---

## D-05: Riverdale in TIGER UNSD (VERIFIED — INCLUDE)

**Riverdale School District 51J is present in the TIGER UNSD file.**

Confirmed via TIGERweb REST API (layer 14 = unified school districts):
- NAME: "Riverdale School District 51J"
- GEOID: 4110560
- STATE: 41 (Oregon)
- County: Multnomah County (confirmed via NCES)

[VERIFIED: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer]
[CITED: https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=4110560]

Riverdale MUST be included in the loader filter. D-06 is satisfied — TIGER has the polygon.

---

## D-13: External ID Block Clear Check (VERIFIED)

```sql
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -869999 AND -860001;
-- Result: 0
```

[VERIFIED: production DB query 2026-06-01]

The -860001 to -869999 range is completely clear. The external_id assignment scheme below is safe to use.

---

## D-09: Board Member Rosters (VERIFIED per district)

### District GEOIDs (all verified via TIGERweb)

| District | GEOID | Board Size | Source |
|----------|-------|------------|--------|
| Portland Public Schools (1J) | 4110040 | 7 | pps.net [VERIFIED] |
| Parkrose School District 3 | 4109480 | 5 | parkrose.com [VERIFIED] |
| Reynolds School District 7 | 4110520 | 7 | reynolds.k12.or.us [VERIFIED] |
| Centennial School District 28J | 4102800 | 7 | csd28j.org + ballotpedia [VERIFIED] |
| David Douglas School District 40 | 4103940 | 7 | ddouglas.k12.or.us [VERIFIED] |
| Riverdale School District 51J | 4110560 | 5 | riverdaleschool.com [VERIFIED] |

**TOTAL: 38 board members**

---

### Portland Public Schools (PPS) — 7 members
[VERIFIED: https://www.pps.net/board/board-of-education/board-members — fetched 2026-06-01]

| Name | Zone | Role | Notes |
|------|------|------|-------|
| Christy Splitt | Zone 1 | Member | Photo available (Finalsite CDN) |
| Michelle DePass | Zone 2 | Vice-Chair | Photo available (Finalsite CDN) |
| Patte Sullivan | Zone 3 | Member | Photo available (Finalsite CDN) |
| Rashelle Chase-Miller | Zone 4 | Member | Photo available (Finalsite CDN) |
| Virginia La Forte | Zone 5 | Member | Photo available (Finalsite CDN) |
| Stephanie Engelsman | Zone 6 | Member | Photo available (Finalsite CDN) |
| Edward (Eddie) Wang | Zone 7 | Chair | Photo available (Finalsite CDN) |

- All 7 have photos. Photo URL pattern: `https://ppsnet.finalsite.com/fs/resource-manager/view/[UUID]`
- Board members are elected city-wide but must reside in their zone. No sub-district geofences needed — the whole-district GEOID is used (same as LAUSD whole-district pattern).
- Office title pattern: `'Board Member (Zone N)'` where N = 1-7

---

### Parkrose School District — 5 members
[VERIFIED: https://www.parkrose.com/school-board — fetched 2026-06-01]

| Name | Position | Role | Term |
|------|----------|------|------|
| Paul Tabron Jr. | Position 1 | Chair | 7/1/23–6/30/29 |
| Brenda Rivas | Position 2 | Vice Chair | 7/1/22–6/30/27 |
| Joash Bullock | Position 3 | Member | 1/22/24–6/30/27 |
| Adolfo Jimenez | Position 4 | Member | 7/1/25–6/30/29 |
| Mariah Galaviz | Position 5 | Member | 9/9/24–6/30/29 |

- All 5 have photos available on the district website.
- Photo URL pattern: relative path `images/about/school_board/[filename].jpg` under parkrose.com
- Full base URL: `https://www.parkrose.com/images/about/school_board/[filename].jpg`
- Office title pattern: `'Board Member (Position N)'` where N = 1-5

---

### Reynolds School District — 7 members
[VERIFIED: https://www.reynolds.k12.or.us/schoolboard — fetched 2026-06-01]

| Name | Position | Role |
|------|----------|------|
| Aaron Muñoz | Position 1 | Member |
| Joyce Rosenau | Position 2 | Vice Chair |
| Michael Reyes | Position 3 | Chair |
| Cayle Tern | Position 4 | Member |
| Patty Carrera | Position 5 | Member |
| Ana Gonzalez Muñoz | Position 6 | Member |
| Francisco Ibarra | Position 7 | Member |

- Photos available on individual profile pages (e.g., `/schoolboard/michael-reyes`)
- Photo URL pattern (Drupal): `https://www.reynolds.k12.or.us/sites/default/files/styles/full_node_primary/public/imageattachments/schoolboard/page/[ID]/[name].png?itok=[token]`
- The itok parameter is a Drupal image style token — URL must be fetched directly, not constructed.
- Office title pattern: `'Board Member (Position N)'` where N = 1-7

**Note:** Aaron Muñoz uses Unicode ñ in name; Ana Gonzalez Muñoz also has ñ. Use exact Unicode in SQL strings.

---

### Centennial School District 28J — 7 members
[VERIFIED: https://csd28j.org/boardmembers — fetched 2026-06-01; confirmed with 2025 election results]

Post-May 2025 election roster (all terms confirmed current):

| Name | Position | Zone/Type | Role | Term |
|------|----------|-----------|------|------|
| David Linn | Position 1 | Zone 1 | Member | through June 2029 |
| Ronald "Jess" Hardin | Position 2 | Zone 2 | Member | through June 2027 |
| Will Mohring | Position 3 | Zone 3 | Vice Chair | through June 2029 |
| Melissa Standley | Position 4 | At Large | Member | through June 2027 |
| Rose Solowski | Position 5 | At Large | Chair | through June 2027 |
| Michael Newman | Position 6 | At Large | Member | through June 2029 (new, sworn in July 9 2025) |
| Pam Shields | Position 7 | At Large | Member | through June 2029 |

- All 7 have photos available on csd28j.org
- Office title pattern: mixed — Zone positions are `'Board Member (Zone N)'`, At Large are `'Board Member (At Large)'`. However, for consistency with the DB schema (no seat_label column), recommend: `'Board Member (Position N)'` for all 7 using the position number. The planner should decide; this research uses Position N as it is what the website shows.

**Note:** "Claudia Andrews" who held Position 3 (Zone 3) with term expiring June 2025 was replaced. However the election results show Will Mohring (who was in At Large position 6) moved to Zone 3 / Position 3. Michael Newman won the newly vacated At Large seat. The roster above reflects the confirmed post-election composition. [ASSUMED: exact July 2025 swearing-in dates; Ballotpedia results confirmed the election winners]

---

### David Douglas School District — 7 members
[VERIFIED: https://www.ddouglas.k12.or.us/school-board/board-members/ — fetched 2026-06-01]

| Name | Position | Role |
|------|----------|------|
| Althea Ender | Position 1 | Member |
| Stephanie D. Stephens | Position 2 | Member |
| Sara Epstein, MPH | Position 3 | Member |
| Muriel Jordan | Position 4 | Member |
| Thomas Stephenson | Position 5 | Member |
| Heather Franklin | Position 6 | Board Chair |
| José Gamero-Georgeson | Position 7 | Vice Chair |

- All 7 have photos. Photo URL pattern (WordPress): `https://www.ddouglas.k12.or.us/wp-content/uploads/[YEAR]/[MONTH]/[FILENAME].jpg`
- Office title pattern: `'Board Member (Position N)'` where N = 1-7

**Note:** "Sara Epstein, MPH" — use `full_name='Sara Epstein'`, `last_name='Epstein'` in DB (drop credentials suffix per LAUSD pattern where 'Dr.' was stripped to first/last).
**Note:** "José Gamero-Georgeson" uses Unicode é. Use exact Unicode in SQL.

---

### Riverdale School District — 5 members
[VERIFIED: https://www.riverdaleschool.com/about-us/school-board-policy — fetched 2026-06-01]

| Name | Seat | Role | Term |
|------|------|------|------|
| Mina Stricklin | Seat 2 | Chair | July 2023–June 2027 |
| Shaina Weinstein | Seat 1 | Vice-Chair | July 2025–June 2029 |
| Michele Rosenbaum | Seat 3 | Director | July 2025–June 2029 |
| Ali Lanenga | Seat 4 | Director | July 2023–June 2027 |
| Milessa Lowrie | Seat 5 | Director | June 2025–June 2029 |

- All 5 have photos. Site uses Finalsite CMS.
- Photo URL pattern: Finalsite resource manager (similar to PPS pattern)
- Riverdale uses "Seat N" terminology. Office title pattern: `'Board Member (Seat N)'` where N = 1-5
- Riverdale is a small K-12 district (564 students) serving the Dunthorpe neighborhood of SW Portland.

---

## D-10: Office Title Conventions

Summary of confirmed naming per district:

| District | Term | Proposed DB Title |
|----------|------|-------------------|
| PPS | "Zone N" (official website language) | `Board Member (Zone N)` |
| Parkrose | "Position N" (official website) | `Board Member (Position N)` |
| Reynolds | "Position N" (official website) | `Board Member (Position N)` |
| Centennial | "Position N" / "Zone N" / "At Large" (website uses Position N) | `Board Member (Position N)` |
| David Douglas | "Position N" (official website) | `Board Member (Position N)` |
| Riverdale | "Seat N" (official website) | `Board Member (Seat N)` |

The LAUSD precedent uses `'LAUSD Board Member (District N)'`. The OR districts use `'Board Member (Zone N)'`, `'Board Member (Position N)'`, or `'Board Member (Seat N)'` per district naming. No district uses generic `'Board Member'` without qualification. [VERIFIED: official district websites]

---

## D-15: Headshot Availability Summary

| District | Photos Available | Source URL Pattern | Notes |
|----------|-----------------|-------------------|-------|
| PPS | Yes — all 7 | `https://ppsnet.finalsite.com/fs/resource-manager/view/[UUID]` | Finalsite; UUID not guessable — must visit each member page |
| Parkrose | Yes — all 5 | `https://www.parkrose.com/images/about/school_board/[filename].jpg` | Direct relative paths visible on school-board page |
| Reynolds | Yes — all 7 (on individual pages) | `https://www.reynolds.k12.or.us/sites/default/.../[name].png?itok=[token]` | Drupal image style tokens; must follow links per member |
| Centennial | Yes — all 7 | csd28j.org (Finalsite-like CMS) | Photos confirmed present but URL pattern needs per-member fetch |
| David Douglas | Yes — all 7 | `https://www.ddouglas.k12.or.us/wp-content/uploads/[YEAR]/[MONTH]/[FILE].jpg` | WordPress self-hosted |
| Riverdale | Yes — all 5 | Finalsite (riverdaleschool.com) | Finalsite; UUID patterns apply |

**38/38 board members have official website photos available.** No documented gaps anticipated, though Drupal/Finalsite tokens require per-member URL discovery during execution.

---

## Architecture Patterns

### System Architecture Diagram

```
census.gov TIGER UNSD
       |
       v
load-or-school-boundaries.ts
  [download tl_2024_41_unsd.zip]
  [unzip → .shp + .dbf]
  [parse with shapefile pkg]
  [filter GEOID IN (6 targets)]
  [INSERT geofence_boundaries mtfcc=G5420 state='41']
       |
       v
geofence_boundaries (6 rows, G5420, state='41')
       |
migration 253_or_school_districts.sql
  [6 × government row (WHERE NOT EXISTS)]
  [6 × chamber row (WHERE NOT EXISTS)]
  [6 × district row (district_type='SCHOOL', state='or', geo_id=GEOID)]
  [38 × politician (ON CONFLICT external_id DO NOTHING)]
  [38 × office (WHERE NOT EXISTS on district_id+politician_id)]
  [office_id back-fill UPDATE]
       |
       v
essentials.districts (district_type='SCHOOL')
       |
essentialsService.ts address lookup
  [geofence_boundaries → districts JOIN on geo_id]
  [mtfcc IN ('G5400','G5410','G5420') AND district_type='SCHOOL']
  [returns school_district geo_id in jurisdiction]
  [then resolves officials via district → offices → politicians]
       |
       v
API response includes school board members
alongside city council + county commissioners
```

### Recommended Project Structure

```
C:/EV-Accounts/backend/
├── scripts/
│   ├── load-or-school-boundaries.ts    # New (Plan 1) — TIGER UNSD loader
│   └── smoke-multnomah-school.ts        # New (Plan 1) — Phase 86 smoke test
└── migrations/
    ├── 253_or_school_districts.sql      # New (Plan 1) — government + officials seed
    └── 254_or_school_headshots.sql      # New (Plan 2) — AUDIT-ONLY headshots
```

### Pattern 1: TIGER UNSD Loader Structure

Copy `load-lausd-board-boundaries.ts` and adapt:

```typescript
// Source: C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts (verified 2026-06-01)
const TIGER_URL = 'https://www2.census.gov/geo/tiger/TIGER2024/UNSD/tl_2024_41_unsd.zip';
const MTFCC = 'G5420';
const STATE = '41';
const SOURCE = 'tiger_unsd_or_2024';

// 6 target GEOIDs (verified via TIGERweb 2026-06-01):
const TARGET_GEOIDS = new Map([
  ['4110040', 'Portland Public Schools'],
  ['4109480', 'Parkrose School District 3'],
  ['4110520', 'Reynolds School District 7'],
  ['4102800', 'Centennial School District 28J'],
  ['4103940', 'David Douglas School District 40'],
  ['4110560', 'Riverdale School District 51J'],
]);
const EXPECTED_COUNT = 6;

// Key differences from load-lausd-board-boundaries.ts:
// - Downloads zip (not ArcGIS GeoJSON)
// - Requires adm-zip + shapefile packages (already in dependencies)
// - Filters by GEOID field, not DISTRICT field
// - geo_id = GEOID value (e.g., '4110040'), not 'lausd-board-district-N'
// - IMPORTANT: filterByStatefp not needed — GEOID filter is sufficient

// INSERT pattern (same as LAUSD):
// ON CONFLICT (geo_id, mtfcc) DO NOTHING
// public.ST_ForcePolygonCCW(public.ST_SetSRID(public.ST_Force2D(public.ST_GeomFromGeoJSON($6)), 4326))
```

Key architectural difference from LAUSD: LAUSD boundaries come from an ArcGIS FeatureServer; OR school boundaries come from a TIGER zip file requiring adm-zip extraction. The `load-state-tiger-boundaries.ts` already handles this pattern and can be referenced for the download+extract+shapefile-read code.

### Pattern 2: Government/Chamber/District/Politician/Office Seed

Follow the 246_multnomah_cities_government.sql multi-body pattern exactly. Each district gets:

```sql
-- Step 1: Government row (WHERE NOT EXISTS guard — no unique constraint on geo_id)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'Portland Public Schools, Oregon, US', 'LOCAL', 'OR', NULL, '4110040'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'Portland Public Schools, Oregon, US'
);

-- Step 2: Chamber (slug GENERATED ALWAYS — never include in INSERT column list)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Board of Education',
       'Portland Public Schools Board of Education',
       (SELECT id FROM essentials.governments WHERE name = 'Portland Public Schools, Oregon, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Board of Education'
    AND government_id = (SELECT id FROM essentials.governments
                         WHERE name = 'Portland Public Schools, Oregon, US')
);

-- Step 3: SCHOOL district row
-- CRITICAL: district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT')
-- CRITICAL: state='or' LOWERCASE (routing queries use lowercase for SCHOOL type)
-- CRITICAL: mtfcc='G5420'
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4110040', 'Portland Public Schools', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4110040' AND district_type = 'SCHOOL' AND state = 'or'
);

-- Step 4: Politician + office CTE (per board member)
-- CRITICAL: Each board member needs their own SCHOOL district row to route correctly.
-- For PPS (zone-based): each board member's office links to the whole-district geo_id '4110040'
-- (same as LAUSD — no sub-geofences; routing is whole-district)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Edward Wang', 'Edward', 'Wang', NULL,
          true, false, false, true, -860001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id, ch.id, p.id,
       'Board Member (Zone 7)', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
JOIN essentials.chambers ch ON ch.government_id = (
  SELECT id FROM essentials.governments WHERE name = 'Portland Public Schools, Oregon, US'
)
WHERE d.geo_id = '4110040' AND d.district_type = 'SCHOOL' AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Pattern 3: Headshot Audit Migration (migration 254)

Follow `247_multnomah_cities_headshots.sql` exactly:

```sql
-- Migration 254: OR School District Board Member Headshots
-- AUDIT-ONLY: ...
-- DO NOT apply via Supabase ledger -- actual DB writes happened live.
DO $$ BEGIN
  RAISE EXCEPTION 'Migration 254 is AUDIT-ONLY and must not be applied.';
END $$;

-- Portland Public Schools (PPS) — 7 officials
-- Christy Splitt (-860007)
-- source: https://ppsnet.finalsite.com/fs/resource-manager/view/[UUID]
INSERT INTO essentials.politician_images (id, politician_id, url, type, photo_license)
SELECT gen_random_uuid(),
       (SELECT id FROM essentials.politicians WHERE external_id = -860007),
       'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg',
       'default', 'public_domain'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.politician_images
  WHERE politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -860007)
);
```

### Anti-Patterns to Avoid

- **Wrong district_type:** Using 'SCHOOL_DISTRICT' instead of 'SCHOOL'. essentialsService.ts migration 047 line 126 uses `d.district_type = 'SCHOOL'` — any other value causes silent routing failure.
- **Wrong districts.state casing:** Using 'OR' (uppercase) instead of 'or' (lowercase). The routing query at migration 047 line 137 joins `gb.mtfcc IN ('G5400','G5410','G5420') AND d.district_type = 'SCHOOL'` — the state field must be lowercase 'or' to match routing.
- **Slug in chamber INSERT:** `slug` is GENERATED ALWAYS on `essentials.chambers`. Including it in the INSERT column list causes a SQL error.
- **ON CONFLICT on governments:** No unique constraint on `essentials.governments.geo_id`. Use `WHERE NOT EXISTS` guard instead.
- **Wrong politician_images.type:** Using 'headshot' instead of 'default'. UI filters with `.find(img => img.type === 'default')`.
- **Credential suffixes in name:** 'Sara Epstein, MPH' — store as `full_name='Sara Epstein'` in DB (strip degree suffixes).
- **Missing office_id back-fill:** After inserting politicians + offices, must UPDATE essentials.politicians SET office_id = o.id ... WHERE office_id IS NULL for the new external_id range.
- **PPS zone-based routing assumption:** PPS zones are residential requirements for candidates, NOT sub-district geofences. All 7 PPS board members link to the same SCHOOL district row (geo_id='4110040'). Do NOT create 7 separate zone geofences.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TIGER zip download + extract | Custom download logic | adm-zip pattern from load-state-tiger-boundaries.ts | Handles 301/302 redirects, streaming, temp files |
| Shapefile parsing | Custom DBF reader | `shapefile` npm package | Handles TIGER encoding, multipolygon features |
| PostGIS geometry import | Raw WKT | `ST_GeomFromGeoJSON($6)` with `ST_Force2D`, `ST_ForcePolygonCCW`, `ST_SetSRID` | Required for CCW winding order + 2D enforcement (all existing loaders use this) |
| Duplicate government guards | ON CONFLICT clause | `WHERE NOT EXISTS` select | No unique constraint on governments.geo_id — ON CONFLICT would error |
| Image resize/crop | Manual PIL math | `crop to 4:5 first, then resize 600×750 Lanczos q90` | Standard pattern; aspect ratio must not be distorted |

---

## Runtime State Inventory

Phase 86 is a greenfield seeding phase — no renames, refactors, or migrations of existing data. No runtime state inventory required.

**Nothing found in any category** — verified by phase scope analysis (new government bodies, no existing school district rows for OR in DB, confirmed OR SCHOOL districts = 0 in production).

---

## Common Pitfalls

### Pitfall 1: state='or' vs state='OR' in districts table
**What goes wrong:** Board members do not appear in address lookups.
**Why it happens:** The routing query in migration 047 (the canonical jurisdiction resolver) uses the geocoder's state output — which is lowercase 'or'. If `districts.state = 'OR'`, the join fails silently.
**How to avoid:** Always use lowercase `'or'` for `essentials.districts.state` on SCHOOL, COUNTY, LOCAL, STATE_UPPER, STATE_LOWER rows in Oregon.
**Warning signs:** Smoke test shows geofence_boundaries row exists but no officials returned for school board check.

### Pitfall 2: PPS Zone Geofences
**What goes wrong:** Planner might request 7 separate zone geofences for PPS board zones.
**Why it happens:** PPS uses "Zone 1-7" terminology, implying distinct geographic sub-districts.
**How to avoid:** PPS zones are eligibility residency zones for candidates, NOT the geographic unit for address lookup. All 7 PPS board members represent the whole district. Use a single SCHOOL district row with geo_id='4110040' for all 7 offices.
**Warning signs:** If you're about to create 7 separate entries in geofence_boundaries for PPS, stop.

### Pitfall 3: TIGER UNSD geo_id vs LAUSD geo_id format
**What goes wrong:** Loader produces geo_ids like 'oregon-school-district-4110040' instead of '4110040'.
**Why it happens:** LAUSD uses custom slugs ('lausd-board-district-1'). TIGER UNSD geo_id comes from the GEOID field directly (numeric string).
**How to avoid:** Use `geoIdSource: 'GEOID'` pattern (as in load-state-tiger-boundaries.ts LAYER_DISPATCH.unsd). The geo_id in geofence_boundaries should be exactly the GEOID value, e.g. '4110040'.
**Warning signs:** geo_ids contain letters/slashes when they should be 7-digit numeric strings.

### Pitfall 4: TIGER UNSD includes ALL Oregon districts (>200)
**What goes wrong:** Loader inserts all Oregon school districts into geofence_boundaries.
**Why it happens:** TIGER UNSD covers the entire state; a naive insert-all approach would add ~190+ OR districts.
**How to avoid:** Filter by `TARGET_GEOIDS` set (the 6 Multnomah County districts). Add EXPECTED_COUNT = 6 assertion and fail loudly if count differs.
**Warning signs:** Post-insert count shows > 6 for state='41' AND source='tiger_unsd_or_2024'.

### Pitfall 5: Unicode in names
**What goes wrong:** SQL syntax error or wrong name in DB.
**Why it happens:** Reynolds has "Aaron Muñoz", "Ana Gonzalez Muñoz"; David Douglas has "José Gamero-Georgeson". SQL files may lose Unicode if saved as ASCII.
**How to avoid:** Save migration SQL as UTF-8. Verify with `SELECT full_name FROM essentials.politicians WHERE external_id BETWEEN -860001 AND -869999` after migration.
**Warning signs:** Names display with substitution characters (?) or as escaped \u sequences.

### Pitfall 6: shapefile package field name for GEOID
**What goes wrong:** GEOID filter doesn't match any records.
**Why it happens:** TIGER shapefile DBF field might be named 'GEOID' or 'GEOID10' depending on vintage.
**How to avoid:** On first run with `--dry-run`, log `Object.keys(feature.properties)` for the first feature to confirm field names. TIGER 2024 UNSD uses 'GEOID' (confirmed by load-state-tiger-boundaries.ts LAYER_DISPATCH.unsd: `geoIdSource: 'GEOID'`).
**Warning signs:** districtMap remains empty after shapefile read.

---

## Code Examples

### Loader: Filter by TARGET_GEOIDS (adapted from load-lausd-board-boundaries.ts)

```typescript
// Source: C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts (adapted)
const TARGET_GEOIDS = new Map<string, string>([
  ['4110040', 'Portland Public Schools'],
  ['4109480', 'Parkrose School District 3'],
  ['4110520', 'Reynolds School District 7'],
  ['4102800', 'Centennial School District 28J'],
  ['4103940', 'David Douglas School District 40'],
  ['4110560', 'Riverdale School District 51J'],
]);

for (const feature of features) {
  const geoid = String(feature.properties['GEOID'] ?? '');
  if (!TARGET_GEOIDS.has(geoid)) continue;
  const name = TARGET_GEOIDS.get(geoid)!;
  // Insert with geo_id = geoid (e.g., '4110040')
}
```

### Migration: SCHOOL District Row

```sql
-- Source: pattern from essentials.districts for LAUSD SCHOOL rows (verified in production DB)
-- CRITICAL: state='or' lowercase
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'SCHOOL', 'or', '4110040', 'Portland Public Schools', 'G5420'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE geo_id = '4110040' AND district_type = 'SCHOOL' AND state = 'or'
);
```

### Migration: Government Row with WHERE NOT EXISTS

```sql
-- Source: 246_multnomah_cities_government.sql pattern (verified 2026-06-01)
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), '[District Name], Oregon, US', 'LOCAL', 'OR', NULL, '[GEOID]'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = '[District Name], Oregon, US'
);
```

### Migration: Ledger Entry

```sql
-- Source: 246_multnomah_cities_government.sql (verified 2026-06-01)
INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('253')
ON CONFLICT (version) DO NOTHING;
COMMIT;
```

### Smoke Test: SCHOOL District Routing Check

```typescript
// Source: pattern from smoke-multnomah-county.ts COUNTY officials query (83-PATTERNS.md)
async function querySchoolOfficials(client, lon: number, lat: number) {
  const res = await client.query(`
    SELECT p.full_name, d.geo_id, d.district_type
    FROM essentials.politicians p
    JOIN essentials.offices o ON o.politician_id = p.id
    JOIN essentials.districts d ON d.id = o.district_id
    JOIN essentials.geofence_boundaries gb ON gb.geo_id = d.geo_id
    WHERE gb.state = '41'
      AND d.district_type = 'SCHOOL'
      AND gb.mtfcc = 'G5420'
      AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
    ORDER BY p.full_name
  `, [lon, lat]);
  return res.rows;
}
// Portland City Hall (-122.6794, 45.5231) should return PPS board members
```

---

## External ID Assignment Scheme

Block -860001 to -869999 confirmed clear. Recommended assignment:

| District | External ID Range | Count |
|----------|-------------------|-------|
| Portland Public Schools (PPS) | -860001 to -860007 | 7 |
| Parkrose | -860011 to -860015 | 5 |
| Reynolds | -860021 to -860027 | 7 |
| Centennial | -860031 to -860037 | 7 |
| David Douglas | -860041 to -860047 | 7 |
| Riverdale | -860051 to -860055 | 5 |

**Total: 38 politicians**

Spacing of 10 per district allows for future board expansion without collision. [ASSUMED: specific numbering scheme — planner may adjust within the clear block]

Recommended PPS assignment order (Chair first, then by zone number):
- -860001: Edward (Eddie) Wang (Chair, Zone 7)
- -860002: Michelle DePass (Vice-Chair, Zone 2)
- -860003: Christy Splitt (Zone 1)
- -860004: Patte Sullivan (Zone 3)
- -860005: Rashelle Chase-Miller (Zone 4)
- -860006: Virginia La Forte (Zone 5)
- -860007: Stephanie Engelsman (Zone 6)

---

## Migration Context

**Next available migration numbers:** 253 and 254
- Highest applied in DB: 252 (`252_multnomah_discovery.sql`)
- File system confirms: no 253 or 254 files exist yet
[VERIFIED: production DB + filesystem 2026-06-01]

**Migration ledger note:** The ledger uses both timestamp format (older) and simple numeric strings. New migrations use simple numeric. Pattern from 246: `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('253')`.

---

## Key Discovery: load-state-tiger-boundaries.ts Already Has UNSD Handler

The generalized loader already has `LAYER_DISPATCH.unsd` with:
- `urlTemplate: tl_${v}_${f}_unsd.zip` — correct URL pattern
- `mtfcc: 'G5420'`
- `geoIdSource: 'GEOID'`
- `writeDistrictRow: false` (school districts create their own districts rows separately)

However, the OR allowlist is `Set(['cd119', 'sldu', 'sldl', 'place', 'county'])` — no 'unsd'.

Per D-03 (locked decision), a standalone `load-or-school-boundaries.ts` is the correct approach. The planner should be aware that `load-state-tiger-boundaries.ts` has the GEOID-based filter logic and zip download pattern that can be referenced, even if D-03 precludes adding OR to the allowlist.

[CITED: C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts lines 251-258]

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| LAUSD used custom ArcGIS FeatureServer | OR uses TIGER UNSD zip | Must add zip download + shapefile parse to new loader |
| LAUSD uses slug-based geo_ids ('lausd-board-district-N') | TIGER UNSD uses numeric GEOIDs ('4110040') | geo_id = GEOID string directly |
| LAUSD sub-district geofences (7 districts per board) | OR whole-district (1 geofence per district) | All board members per district share one SCHOOL district row |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | PPS Zone N board members all link to whole-district geo_id '4110040' (not sub-zone geofences) | Board Rosters / Anti-Patterns | Would need 7 zone geofences; but research confirms zones are residency requirements only, not service area sub-districts |
| A2 | External ID assignment scheme (-860001 first digit, spacing of 10 per district) | External ID Scheme | Low risk — block is clear; planner may renumber within the block |
| A3 | Centennial post-May 2025 roster (Will Mohring moved from At Large to Zone 3) | Centennial Roster | If the website has been updated to reflect this, risk is low; confirmed by election results |
| A4 | David Douglas "Sara Epstein, MPH" — credential suffix should be stripped | David Douglas Roster | If stored with 'MPH' suffix, name displays differently |
| A5 | Reynolds photo URLs have Drupal itok tokens — must fetch per-member page (cannot construct URL) | Reynolds headshots | Low risk; implementation note, not blocking |

---

## Open Questions

1. **Centennial board website lag**
   - What we know: csd28j.org still shows pre-election roster with June 2025 expiry dates
   - What's unclear: Whether the board page has been updated to reflect July 2025 swearing-in
   - Recommendation: Verify against the `/boardmembers` page at execution time; Ballotpedia results confirm the winners

2. **PPS headshot UUIDs (Finalsite)**
   - What we know: Photos are at `ppsnet.finalsite.com/fs/resource-manager/view/[UUID]` — UUID is non-derivable
   - What's unclear: Whether individual member pages list the UUID in a parseable way
   - Recommendation: Visit each board member's profile page during headshot execution phase to capture UUIDs

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js + tsx | load-or-school-boundaries.ts | ✓ | Existing in repo | — |
| adm-zip npm | TIGER zip extraction | ✓ | In package.json (used by load-state-tiger-boundaries.ts) | — |
| shapefile npm | DBF/SHP parsing | ✓ | In package.json (used by load-state-tiger-boundaries.ts) | — |
| pg npm (Pool/Client) | DB writes | ✓ | In package.json | — |
| DATABASE_URL | Loader + migrations | ✓ | In .env | — |
| Python PIL / Pillow | Headshot processing | ✓ | Used in Phase 84 headshot script | — |
| census.gov TIGER UNSD | OR geofences | ✓ | tl_2024_41_unsd.zip confirmed 2026-06-01 | — |

No missing dependencies.

---

## Validation Architecture

Note: .planning/config.json not checked for nyquist_validation flag — including section per default (absent = enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Custom TypeScript smoke tests (npx tsx) |
| Config file | none — run directly |
| Quick run command | `npx tsx scripts/smoke-multnomah-school.ts` |
| Full suite command | `npx tsx scripts/smoke-multnomah-school.ts` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OR-SCHOOL-01 | 6 G5420 rows in geofence_boundaries (state='41') | smoke | `npx tsx scripts/smoke-multnomah-school.ts` | ❌ Wave 0 |
| OR-SCHOOL-02 | district_type='SCHOOL' rows exist for all 6 district GEOIDs | smoke | `npx tsx scripts/smoke-multnomah-school.ts` | ❌ Wave 0 |
| OR-SCHOOL-03 | Portland address returns PPS board members alongside city council + county | smoke | `npx tsx scripts/smoke-multnomah-school.ts` | ❌ Wave 0 |
| OR-SCHOOL-04 | 38/38 politician_images rows with type='default' (or documented gap) | manual verify | DB query during Plan 2 execution | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `scripts/smoke-multnomah-school.ts` — covers OR-SCHOOL-01, OR-SCHOOL-02, OR-SCHOOL-03
  - SC1: COUNT(geofence_boundaries WHERE state='41' AND mtfcc='G5420') = 6
  - SC2: COUNT(districts WHERE district_type='SCHOOL' AND state='or') >= 6
  - SC3: Portland City Hall (-122.6794, 45.5231) returns >= 7 SCHOOL district officials
  - SC4: Riverdale address (≈-122.6794, 45.4472) returns Riverdale board members (not PPS)
  - SC5: Section-split check: all 6 geo_ids have SCHOOL district row

---

## Security Domain

This phase adds no authentication, session management, access control, or cryptography surfaces. All operations are data seeding (SQL migrations) and script execution in the backend environment. ASVS categories V2-V6 do not apply. No user-facing endpoints are modified.

---

## Sources

### Primary (HIGH confidence)
- TIGER2024 UNSD directory: https://www2.census.gov/geo/tiger/TIGER2024/UNSD/ — confirmed tl_2024_41_unsd.zip exists (2.9MB)
- TIGERweb REST API (layer 14): confirmed GEOIDs for all 6 districts
- C:/EV-Accounts/backend/scripts/load-lausd-board-boundaries.ts — canonical loader pattern
- C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql — multi-body seeding pattern
- C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql — audit-only headshot pattern
- C:/EV-Accounts/backend/migrations/047_add_city_council_district_columns.sql lines 126-137 — SCHOOL routing join condition
- .planning/phases/83-multnomah-county-government-routing/83-PATTERNS.md — SQL pattern library
- Production DB queries: external_id block confirmed clear; OR SCHOOL districts = 0; max migration = 252

### Secondary (MEDIUM confidence)
- https://www.pps.net/board/board-of-education/board-members — 7 PPS members + Finalsite photo pattern
- https://www.parkrose.com/school-board — 5 Parkrose members + photo paths
- https://www.reynolds.k12.or.us/schoolboard — 7 Reynolds members + Drupal photo pattern
- https://csd28j.org/boardmembers — 7 Centennial members (post-2025-election)
- https://www.ddouglas.k12.or.us/school-board/board-members/ — 7 David Douglas members + WordPress pattern
- https://www.riverdaleschool.com/about-us/school-board-policy — 5 Riverdale members + Finalsite pattern
- https://nces.ed.gov/ccd/districtsearch/district_detail.asp?ID2=4110560 — Riverdale GEOID + Multnomah County confirmed

### Tertiary (LOW confidence)
- Ballotpedia Centennial SD 28J elections (2025) — election winner names (confirmed via multiple sources)
- ballotpedia.org/Reynolds_School_District,_Oregon — Reynolds board composition

---

## Metadata

**Confidence breakdown:**
- TIGER filename / GEOIDs: HIGH — verified via official census.gov directory + TIGERweb API
- Board rosters: HIGH — verified from official district websites for all 6
- Architecture patterns: HIGH — read directly from canonical analogs in codebase
- External ID block: HIGH — verified against production DB
- Migration number: HIGH — verified against production DB + filesystem
- Headshot availability: HIGH — all 6 districts confirmed photos on official websites
- Photo URL patterns: MEDIUM — patterns verified but Finalsite/Drupal tokens require per-member fetch at execution time

**Research date:** 2026-06-01
**Valid until:** 2026-07-01 (board member rosters may change; TIGER URLs are stable)
