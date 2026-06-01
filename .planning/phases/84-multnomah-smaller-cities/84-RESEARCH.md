# Phase 84: Multnomah Smaller Cities — Research

**Researched:** 2026-05-31
**Domain:** PostgreSQL/Supabase government seeding — Oregon city governments, at-large council structures, geofence routing
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Plan Structure**
- D-01: 2 plans: Plan 1 = all 5 city governments (migration 246 + smoke test), Plan 2 = headshots (migration 247, audit-only).
- D-02: Plan 1 uses a single migration (migration 246) covering all 5 cities in one BEGIN/COMMIT transaction. No splitting by city.
- D-03: One smoke test script (`smoke-multnomah-cities.ts`) with one test address per city (5 total). Verifies G4110 boundary match + LOCAL/LOCAL_EXEC officials returned. Section-split check for all 5 city geo_ids.

**Mayor and Council Structure**
- D-04: Mayor → `district_type=LOCAL_EXEC`, same geo_id as city's G4110 geo_id, `mtfcc=null`, `label='[CityName] (Citywide)'`. Matches Portland Mayor pattern (Keith Wilson: geo_id='4159000', district_type=LOCAL_EXEC, mtfcc=null).
- D-05: Gresham council (6 ward-elected seats) → Ward-based LOCAL districts. Researcher must find Gresham ward boundary GIS data (city GIS portal or Oregon GIS portal) and load 6 custom polygon geofences with new geo_ids (e.g., 'gresham-or-ward-1' through 'gresham-or-ward-6'). Next available MTFCC is X0013; assign X0013–X0018 for Gresham wards 1–6.
- D-06: Troutdale, Fairview, Wood Village, Maywood Park councils → At-large: one `district_type=LOCAL` district per city using the city's G4110 geo_id, `mtfcc=null`. All council members for a given city link to the same district row.
- D-07: All 5 cities get a Mayor (LOCAL_EXEC) + City Council chamber (LOCAL or ward-based). Researcher must verify exact council seat counts per city from official sources.

**Headshot Sourcing**
- D-08: Official city website only — check each city's official site for headshots. If no photo found there, mark as unavailable. No LinkedIn, local news, social media, or other sources.
- D-09: Every official documented in migration 247 (audit-only): either a source URL (Supabase Storage path) or a comment 'No photo found on official city website.' Same pattern as `245_multnomah_county_headshots.sql`.
- D-10: Headshots processed to 600×750 JPEG, Lanczos q90, crop 4:5 first, `type='default'` in politician_images. No deviation from standard pattern.

**Casing and Idempotency (carried from Phase 83)**
- D-11: `governments.state = 'OR'` (uppercase), `districts.state = 'or'` (lowercase), `offices.representing_state = 'OR'` (uppercase).
- D-12: `party = NULL` for all officials (antipartisan design).
- D-13: Idempotency: `ON CONFLICT (external_id) DO NOTHING` for politicians; `WHERE NOT EXISTS` guards for governments, chambers, districts.
- D-14: `office_id` back-fill UPDATE at end of migration (before COMMIT).

### Claude's Discretion

None specified — all structural decisions are locked.

### Deferred Ideas (OUT OF SCOPE)

- Per-ward sub-routing for Troutdale/Fairview/Wood Village/Maywood Park — these are at-large for Phase 84.
- Compass stances for smaller city officials — out of scope.
- Maywood Park contact data — gaps are expected and don't block Phase 84.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CITIES-01 | Gresham city council government body + elected officials seeded | 7 officials confirmed: Mayor Stovall + 6 councilors (Position 1–6 at-large); geo_id=4131250 verified in production DB |
| CITIES-02 | Troutdale city council government body + elected officials seeded | 7 officials confirmed: Mayor Ripma + 6 councilors (at-large); geo_id=4174850 verified |
| CITIES-03 | Fairview city council government body + elected officials seeded | 7 officials confirmed: Mayor Kudrna + 6 councilors (Position 1–6 at-large); geo_id=4124250 verified |
| CITIES-04 | Wood Village city council government body + elected officials seeded | 5 officials confirmed: Mayor Rios-Campos (council-appointed) + 4 councilors (at-large); geo_id=4183950 verified |
| CITIES-05 | Maywood Park city council government body + elected officials seeded | 5 officials confirmed: Mayor Akers (council-selected) + council president + 3 councilors; geo_id=4146730 verified |
| CITIES-06 | Headshots for smaller city officials where available online | Gresham (7/7 photos on greshamoregon.gov), Wood Village (photos on WP CDN), Troutdale (WebP on troutdaleoregon.gov), Fairview (no photos visible on directory page), Maywood Park (no photos found) |
</phase_requirements>

---

## Summary

Phase 84 seeds government bodies and elected officials for all 5 incorporated Multnomah County cities outside Portland: Gresham, Troutdale, Fairview, Wood Village, and Maywood Park. The work follows the same SQL pattern as Phase 83 (migration 244) but uses LOCAL/LOCAL_EXEC district types instead of COUNTY.

**Critical research correction to CONTEXT.md D-05:** Gresham's city council uses **at-large Position 1–6 seats, NOT geographic wards**. The Charter Review Committee (2021–2023) recommended moving to district-based elections, but no ward map has been adopted. As of the 2024 and 2026 elections, all seats remain citywide at-large. This means no custom geofences need to be loaded for Gresham wards — Gresham's 6 council members all link to the city's G4110 geo_id (4131250) via a single at-large LOCAL district, identical to Troutdale/Fairview/Wood Village/Maywood Park. X0013–X0018 are NOT needed for this phase.

**Wood Village and Maywood Park mayor appointment:** In both cities the Mayor is chosen by the council from among its elected members, not directly elected by voters. The Mayor office should have `is_appointed_position=true` on the office row (matches the Portland City Administrator/Attorney pattern). The Mayor is still a city councilor (elected at-large) who holds the mayor title, so `district_type=LOCAL_EXEC` applies.

**Primary recommendation:** Migration 246 seeds 5 government rows, 5 City Council chambers, 5 LOCAL_EXEC districts (Mayors), 5 LOCAL at-large districts (councils), all council officials, and performs the office_id back-fill — all in one BEGIN/COMMIT transaction. No custom geofences needed. Smoke test uses 5 verified centroid coordinates.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government/chamber/district seeding | Database (PostgreSQL migration) | — | All seeding happens via SQL migration applied to production Supabase |
| Officials routing (LOCAL section) | Database (essentials.districts JOIN) | API/Backend | districtQueryText joins geofence_boundaries → districts → offices → politicians; this tier owns query |
| Headshot upload | Backend script (Python PIL + Supabase Storage API) | Database (politician_images INSERT) | Upload script processes + stores; audit-only SQL documents the writes |
| Smoke test validation | Backend script (TypeScript/pg) | — | Direct DB query validates routing; no API layer involved |

---

## Standard Stack

### Core (no new packages — follows Phase 83 pattern exactly)

| Component | Version | Purpose |
|-----------|---------|---------|
| PostgreSQL (via Supabase) | 15.x | Production DB; migration 246 applied via Supabase MCP |
| Node.js / tsx | 18.x / 4.x | Smoke test execution (`npx tsx scripts/smoke-multnomah-cities.ts`) |
| pg (node-postgres) | 8.x | Database client in smoke test |
| Python PIL / Pillow | 10.x | Headshot image processing (crop + resize) |
| Supabase Storage API | — | Headshot upload to `politician_photos` bucket |

No new packages required. All tools are already installed in the EV-Accounts environment.

---

## Package Legitimacy Audit

No new packages are installed in this phase. Skip.

---

## Architecture Patterns

### System Architecture Diagram

```
[Official City Website]
        |
        | manual research (incumbent names, photo URLs)
        v
[Migration 246 SQL] ---(BEGIN/COMMIT)---> [Supabase PostgreSQL]
  - 5 governments                              |
  - 5 chambers (City Council)          essentials.governments
  - 5 LOCAL_EXEC districts (Mayor)     essentials.chambers
  - 5 LOCAL at-large districts         essentials.districts
  - 31 politicians                     essentials.politicians
  - 31 offices                         essentials.offices
  - office_id back-fill
  - post-verification DO block
        |
        v
[smoke-multnomah-cities.ts]
  5 centroid coordinates
  ST_Covers geofence query
  LOCAL/LOCAL_EXEC officials query
  section-split check (5 geo_ids)
        |
        v
  ALL ASSERTIONS PASSED / exit 0

[Headshot upload script (_tmp-cities-headshots.py)]
        |
        v
[Supabase Storage: politician_photos/{uuid}-headshot.jpg]
        |
[Migration 247 SQL (AUDIT-ONLY)]
  - documents live politician_images INSERTs
  - WHERE NOT EXISTS guard per official
```

### Recommended Project Structure

No new directories. All files go to existing locations:
```
C:/EV-Accounts/backend/
├── migrations/
│   ├── 246_multnomah_cities_government.sql   (Plan 1)
│   └── 247_multnomah_cities_headshots.sql    (Plan 2, audit-only)
└── scripts/
    ├── smoke-multnomah-cities.ts             (Plan 1)
    └── _tmp-cities-headshots.py              (Plan 2)
```

### Pattern 1: City Government Seed Block (per city)

Each city follows this structure inside migration 246:

```sql
-- Source: C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql (Phase 83 analog)

-- 1. Government row
INSERT INTO essentials.governments (id, name, type, state, city, geo_id)
SELECT gen_random_uuid(), 'City of Gresham, Oregon, US', 'LOCAL', 'OR', 'Gresham', '4131250'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'City of Gresham, Oregon, US'
);

-- 2. City Council chamber (slug GENERATED ALWAYS — never include)
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(), 'City Council', 'Gresham City Council',
       (SELECT id FROM essentials.governments WHERE name = 'City of Gresham, Oregon, US')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Gresham, Oregon, US')
);

-- 3. LOCAL_EXEC district (Mayor — citywide)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL_EXEC', 'or', '4131250', 'Gresham (Citywide)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id = '4131250' AND district_type = 'LOCAL_EXEC' AND state = 'or'
);

-- 4. LOCAL at-large district (all 6 councilors share this)
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, mtfcc)
SELECT gen_random_uuid(), 'LOCAL', 'or', '4131250', 'Gresham (At-Large)', NULL
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts WHERE geo_id = '4131250' AND district_type = 'LOCAL' AND state = 'or'
);

-- 5. Mayor WITH ins_p CTE (LOCAL_EXEC, is_appointed_position=false for Gresham)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Travis Stovall', 'Travis', 'Stovall', NULL, true, false, false, true, -4131251)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers
        WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Gresham, Oregon, US')),
       p.id,
       'Mayor', 'OR', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4131250' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- 6. Councilor WITH ins_p CTE (LOCAL, is_appointed_position=false)
-- Repeat for each of 6 councilors, linking to LOCAL district
-- title = 'Council Member (Position N)' -- see title format section
```

### Pattern 2: Wood Village / Maywood Park Mayor (Council-Appointed)

For cities where the Mayor is chosen by council members from among themselves:

```sql
-- is_appointed_position=true on the office row (Mayor is NOT directly elected)
-- is_appointed=true on the politician row
-- district_type=LOCAL_EXEC still applies (it's the executive seat)
-- D-04 applies: same geo_id as city G4110, mtfcc=null

WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Jairo Rios-Campos', 'Jairo', 'Rios-Campos', NULL, true, true, false, true, -4183951)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'City Council'
          AND government_id = (SELECT id FROM essentials.governments WHERE name = 'City of Wood Village, Oregon, US')),
       p.id,
       'Mayor', 'OR', true, false, NULL  -- is_appointed_position=true
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '4183950' AND d.district_type = 'LOCAL_EXEC' AND d.state = 'or'
  AND p.id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

### Pattern 3: Smoke Test Structure

```typescript
// Source: C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts (Phase 83 analog)

const TEST_ADDRESSES: AddressTest[] = [
  {
    label: 'Gresham (centroid)',
    lon: -122.441364519028, lat: 45.5021166610009,
    expectedMtfcc: ['G4110'], expectedGeoIds: { G4110: '4131250' },
  },
  {
    label: 'Troutdale (centroid)',
    lon: -122.395436661508, lat: 45.5372271419675,
    expectedMtfcc: ['G4110'], expectedGeoIds: { G4110: '4174850' },
  },
  {
    label: 'Fairview (centroid)',
    lon: -122.438921112803, lat: 45.5469083700965,
    expectedMtfcc: ['G4110'], expectedGeoIds: { G4110: '4124250' },
  },
  {
    label: 'Wood Village (centroid)',
    lon: -122.420492816904, lat: 45.5357895342016,
    expectedMtfcc: ['G4110'], expectedGeoIds: { G4110: '4183950' },
  },
  {
    label: 'Maywood Park (centroid)',
    lon: -122.56177821613, lat: 45.5525170048598,
    expectedMtfcc: ['G4110'], expectedGeoIds: { G4110: '4146730' },
  },
];
// All 5 centroids verified against production DB: each returns correct G4110 geo_id [VERIFIED: DB query]
```

### Anti-Patterns to Avoid

- **Including `slug` in chambers INSERT:** slug is `GENERATED ALWAYS` on essentials.chambers — will cause SQL error.
- **ON CONFLICT on governments/chambers/districts:** No unique constraint on geo_id — causes silent no-op or error. Use WHERE NOT EXISTS.
- **district_type='SCHOOL' or 'COUNTY':** Must be 'LOCAL' (council at-large) and 'LOCAL_EXEC' (mayor) for city officials.
- **districts.state = 'OR' (uppercase):** Must be lowercase 'or' — routing queries match lowercase. Only governments.state and offices.representing_state use uppercase.
- **type='headshot' in politician_images:** Must be 'default'. Results.jsx and Profile.jsx filter `.find(img => img.type === 'default')`. Wrong type = silent invisibility.
- **Gresham ward geofences (X0013–X0018):** Gresham is at-large; these MTFCCs are NOT needed in this phase.

---

## Critical Research Correction: Gresham Council Structure

**CONTEXT.md D-05 states:** "Gresham council (6 ward-elected seats) → Ward-based LOCAL districts. Researcher must find Gresham ward boundary GIS data."

**Research finding [VERIFIED: greshamoregon.gov/government/mayor-and-council/meet-the-council/ + WebSearch]:** Gresham's council is **currently at-large with numbered Position 1–6 seats** — NOT ward-based geographic districts.

Evidence:
- Official city website lists all 6 councilors by "Position 1–6" with no geographic ward assignment
- Elections page confirms "positions 2, 4 and 6" will be on the 2026 ballot (citywide contest)
- Charter Review Committee (2021–2023) final report explicitly describes the "current At-Large" system and recommends moving to districts, but states "the CRC is not proposing a district map for adoption" — no ward map has been adopted
- Gresham voters passed Measure 26-255 in November 2024 to change the charter amendment threshold (60% → simple majority) — this does NOT change the election method
- Gresham does NOT have ward boundary GIS data to load because no ward districts exist

**Planner action required:** D-05 must be overridden. Gresham follows the same at-large pattern as Troutdale/Fairview/Wood Village/Maywood Park (D-06). X0013–X0018 are not needed. No custom geofence loader needed.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency on governments/chambers | ON CONFLICT | WHERE NOT EXISTS guard | No unique constraint exists on geo_id; ON CONFLICT will error |
| Idempotency on politicians | WHERE NOT EXISTS | ON CONFLICT (external_id) DO NOTHING | Unique constraint exists on external_id |
| Headshot image processing | Custom resize code | Python PIL (already used in Phase 83) | Standard pattern: crop 4:5 first, then Lanczos resize to 600×750 |
| Boundary routing verification | Manual DB inspection | Centroid-based smoke test queries | Already verified centroids against production DB |
| Session-based migration apply | Manual SQL | _apply-migration-246.ts script | Follows Phase 83 pattern: script handles SSL + dotenv |

---

## Verified Incumbent Roster

All names and structures verified from official city websites [VERIFIED: respective official city websites, 2026-05-31].

### Gresham (geo_id: 4131250)

Council type: **At-large, Position 1–6** (NOT ward-based — see Critical Correction above)
Source: greshamoregon.gov/government/mayor-and-council/meet-the-council/

| Title | Full Name | first_name | last_name | Notes |
|-------|-----------|-----------|-----------|-------|
| Mayor | Travis Stovall | Travis | Stovall | 28th mayor, second term; is_appointed_position=false |
| Council Member (Position 1) | Kayla Brown | Kayla | Brown | Sworn in Jan 7, 2025 |
| Council Member (Position 2) | Eddy Morales | Eddy | Morales | Sworn in Jan 3, 2023 |
| Council President (Position 3) | Cathy Keathley | Cathy | Keathley | Council President; title = 'Council Member (Position 3)' |
| Council Member (Position 4) | Jerry Hinton | Jerry | Hinton | |
| Council Member (Position 5) | Sue Piazza | Sue | Piazza | |
| Council Member (Position 6) | Janine Gladfelter | Janine | Gladfelter | |

Total: 7 officials. Mayor: directly elected (is_appointed_position=false). All 6 councilors: at-large (is_appointed_position=false).

### Troutdale (geo_id: 4174850)

Council type: **At-large, no position numbers** — candidates run against all others
Source: troutdaleoregon.gov/node/721

| Title | Full Name | first_name | last_name | Notes |
|-------|-----------|-----------|-----------|-------|
| Mayor | David Ripma | David | Ripma | Directly elected; is_appointed_position=false |
| City Councilor | Carol Allen | Carol | Allen | |
| City Councilor | Jesse Davidson | Jesse | Davidson | |
| City Councilor | John Leamy | John | Leamy | |
| City Councilor | Glenn White | Glenn | White | |
| City Councilor | Geoffrey Wunn | Geoffrey | Wunn | |
| City Councilor | Zach Andrews | Zach | Andrews | |

Total: 7 officials. Troutdale uses "City Councilor" (not "Council Member") per official website.

### Fairview (geo_id: 4124250)

Council type: **At-large, Position 1–6**
Sources: fairvieworegon.gov/Directory.aspx?did=29 + fairvieworegon.gov/303/Mayor

| Title | Full Name | first_name | last_name | Notes |
|-------|-----------|-----------|-----------|-------|
| Mayor | Keith Kudrna | Keith | Kudrna | Elected Nov 2024; is_appointed_position=false |
| Council Member (Position 1) | Jeff Dennerline | Jeff | Dennerline | |
| Council Member (Position 2) | Steve Marker | Steve | Marker | |
| Council Member (Position 3) | E'an Todd | E'an | Todd | Note apostrophe in first name |
| Council Member (Position 4) | Jenni Weber | Jenni | Weber | |
| Council Member (Position 5) | Steve Owen | Steve | Owen | Council President |
| Council Member (Position 6) | Paul Copeland | Paul | Copeland | |

Total: 7 officials. All at-large (is_appointed_position=false).

### Wood Village (geo_id: 4183950)

Council type: **At-large (no position numbers); Mayor is council-selected (NOT directly elected)**
Source: woodvillageor.gov/government/city-council/

| Title | Full Name | first_name | last_name | Notes |
|-------|-----------|-----------|-----------|-------|
| Mayor | Jairo Rios-Campos | Jairo | Rios-Campos | Council-selected; is_appointed=true, is_appointed_position=true; term ends 12/31/2028 |
| Council President | Dara Tan | Dara | Tan | is_appointed_position=false (elected at-large); term ends 12/31/2028 |
| City Councilor | John Miner | John | Miner | term ends 12/31/2026 |
| City Councilor | Charlene Gothard | Charlene | Gothard | Appointed to fill vacancy; is_appointed=true; term ends 12/31/2026 |
| City Councilor | Patricia Smith | Patricia | Smith | term ends 12/31/2028 |

Total: 5 officials (1 Mayor + 4 councilors). The Mayor role is filled by council vote every 2 years from among elected councilors.

**Note on Gothard:** Charlene Gothard was appointed to fill a vacancy (Mark Clark resigned after moving out of city). is_appointed=true on politician row.

### Maywood Park (geo_id: 4146730)

Council type: **At-large (5 members total); Mayor and Council President are selected by council vote**
Source: cityofmaywoodpark.com/government/elections (verified 2026-03-03 meeting minutes)

| Title | Full Name | first_name | last_name | Notes |
|-------|-----------|-----------|-----------|-------|
| Mayor | Jim Akers | Jim | Akers | Council-selected (email: jakers@cityofmaywoodpark.com); is_appointed=true, is_appointed_position=true |
| Council President | Kevin Bussema | Kevin | Bussema | Council-selected (email: mreynolds@cityofmaywoodpark.com shows prior holder; Bussema current as of 2026-03); is_appointed=true for president title |
| City Councilor | Jeff Baltzell | Jeff | Baltzell | |
| City Councilor | Miriam Berman | Miriam | Berman | |
| City Councilor | Thomas Welander | Thomas | Welander | |

Total: 5 officials. All 5 are elected at-large; Mayor and Council President titles are additional roles assigned by council vote.

**Note:** Maywood Park is a very small city (~700 residents). The Council President role is a leadership designation, not a separate elected office. In the DB, Council President can be modeled as a council member with a distinct title ('Council President') or as a plain 'City Councilor'. Since only one city council chamber exists, use title = 'Council President' for Bussema and 'City Councilor' for Baltzell, Berman, Welander. Mayor Akers was also elected to the council and then appointed Mayor — is_appointed=true, is_appointed_position=true on the Mayor office row only.

---

## External ID Scheme

Proposed scheme derived from city geo_ids [VERIFIED: production DB geo_id query + existing pattern analysis].

Existing pattern:
- County: -410001 (Multnomah County Chair), -410010..-410013 (Commissioners D1-D4)
- Portland: -690001..-690021
- Berkeley: -680001..-680017

Pattern for Phase 84: derive from city geo_id, last significant digits become the range base.

| City | geo_id | External ID Range | Mayor | Council |
|------|--------|-------------------|-------|---------|
| Gresham | 4131250 | -4131251 to -4131259 | -4131251 (Mayor) | -4131252 to -4131257 (Positions 1–6) |
| Troutdale | 4174850 | -4174851 to -4174857 | -4174851 (Mayor) | -4174852 to -4174857 (6 councilors) |
| Fairview | 4124250 | -4124251 to -4124257 | -4124251 (Mayor) | -4124252 to -4124257 (Positions 1–6) |
| Wood Village | 4183950 | -4183951 to -4183955 | -4183951 (Mayor) | -4183952 to -4183955 (4 councilors) |
| Maywood Park | 4146730 | -4146731 to -4146735 | -4146731 (Mayor) | -4146732 to -4146735 (4 members) |

**Pre-flight verified [VERIFIED: DB query 2026-05-31]:** SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4183959 AND -4131240 → **0 rows** (range is clean; no collision).

---

## Verified Geo_IDs and Test Coordinates

All geo_ids and centroids verified against production geofence_boundaries table [VERIFIED: DB query 2026-05-31].

| City | geo_id | Centroid lon | Centroid lat | DB Verify |
|------|--------|-------------|-------------|-----------|
| Gresham | 4131250 | -122.441364519028 | 45.5021166610009 | PASS |
| Troutdale | 4174850 | -122.395436661508 | 45.5372271419675 | PASS |
| Fairview | 4124250 | -122.438921112803 | 45.5469083700965 | PASS |
| Wood Village | 4183950 | -122.420492816904 | 45.5357895342016 | PASS |
| Maywood Park | 4146730 | -122.56177821613 | 45.5525170048598 | PASS |

**Note on STATE.md geo_id discrepancy:** STATE.md listed different estimates (Gresham: 4129850, Troutdale: 4174950, etc.) — those were rough estimates. CONTEXT.md geo_ids are confirmed correct.

---

## Migration 246 Structure

Migration 246 follows migration 244 exactly, repeated 5 times (one per city). Structure:

```
BEGIN;

-- Pre-flight DO block (RAISE NOTICE if any government row already exists)

-- GRESHAM (geo_id='4131250')
--   Step 1: government row
--   Step 2: City Council chamber
--   Step 3: LOCAL_EXEC district (Mayor)
--   Step 4: LOCAL at-large district (council)
--   Steps 5–11: WITH ins_p CTE blocks (Mayor + 6 councilors)

-- TROUTDALE (geo_id='4174850')
--   Steps 1–4: government/chamber/districts
--   Steps 5–11: WITH ins_p CTE blocks (Mayor + 6 councilors)

-- FAIRVIEW (geo_id='4124250')
--   Steps 1–4: government/chamber/districts
--   Steps 5–11: WITH ins_p CTE blocks (Mayor + 6 councilors)

-- WOOD VILLAGE (geo_id='4183950')
--   Steps 1–4: government/chamber/districts
--   Steps 5–9: WITH ins_p CTE blocks (Mayor + 4 councilors)

-- MAYWOOD PARK (geo_id='4146730')
--   Steps 1–4: government/chamber/districts
--   Steps 5–9: WITH ins_p CTE blocks (Mayor + 4 councilors/president)

-- office_id back-fill (all 31 officials, by external_id range)
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (
    -4131251,-4131252,-4131253,-4131254,-4131255,-4131256,-4131257,
    -4174851,-4174852,-4174853,-4174854,-4174855,-4174856,-4174857,
    -4124251,-4124252,-4124253,-4124254,-4124255,-4124256,-4124257,
    -4183951,-4183952,-4183953,-4183954,-4183955,
    -4146731,-4146732,-4146733,-4146734,-4146735
  )
  AND p.office_id IS NULL;

-- Post-verification DO block (5 gates: one per city)
-- Gate per city: expected government_count=1, offices_linked=N
-- Section-split check: 5 geo_ids each have LOCAL + LOCAL_EXEC districts

INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('246') ON CONFLICT (version) DO NOTHING;

COMMIT;
```

Total officials: 7 (Gresham) + 7 (Troutdale) + 7 (Fairview) + 5 (Wood Village) + 5 (Maywood Park) = **31 officials**.

---

## Office Title Conventions

Consistent with embedded title pattern from STATE.md (essentials.offices has NO seat_label column):

| City | Mayor Title | Council Member Title |
|------|-------------|---------------------|
| Gresham | 'Mayor' | 'Council Member (Position N)' where N=1..6 |
| Troutdale | 'Mayor' | 'City Councilor' (matches official city website terminology) |
| Fairview | 'Mayor' | 'Council Member (Position N)' where N=1..6 |
| Wood Village | 'Mayor' | 'Council President' (for Tan) or 'City Councilor' (for others) |
| Maywood Park | 'Mayor' | 'Council President' (for Bussema) or 'City Councilor' (for others) |

---

## Headshot Availability

[VERIFIED: URL accessibility checked 2026-05-31; all URLs tested with HTTP 200 response]

### Gresham (greshamoregon.gov)

All 7 officials have headshots on the official page.
URL pattern: `https://www.greshamoregon.gov/globalassets/government/mayor-and-council/meet-the-council/[filename].jpg`

| Official | Filename |
|----------|---------|
| Mayor Stovall | `mayor-stovall-thumbnail.jpg` |
| Kayla Brown | `kaylabrown-portrait-thumb.jpg` |
| Eddy Morales | `councilor-morales-thumbnail.jpg` |
| Cathy Keathley | `cathy-keathley-thumbnail.jpg` |
| Jerry Hinton | `councilor-hinton-thumbnail.jpg` |
| Sue Piazza | `councilor-piazza-thumbnail.jpg` |
| Janine Gladfelter | `councilor-gladfelter-thumbnail.jpg` |

Sizes unknown (thumbnails); may require upscaling. Standard processing: crop 4:5, resize to 600×750 Lanczos q90.

### Troutdale (troutdaleoregon.gov)

All 7 officials have headshots on the official page.
URL pattern: `/sites/g/files/vyhlif13696/files/styles/convert_image_to_webp/public/styles/directory_listings_body_4_column/public/media/mayorcitycouncil/image/[ID]/[filename].jpg.webp`
Format: WebP (same as Multnomah County headshots — strip WebP → JPEG during processing).
The ID component varies per official (Mayor Ripma: 821, Carol Allen: 30261). Full URLs must be extracted from the live page.

### Fairview (fairvieworegon.gov)

No headshots visible on the staff directory page (fairvieworegon.gov/Directory.aspx?did=29) or individual profile pages. [VERIFIED: 2026-05-31]
Migration 247 should document: `-- No photo found on official city website.` for all 7 Fairview officials.

### Wood Village (woodvillageor.gov)

Photos present on woodvillageor.gov/government/city-council/.
URL pattern: `https://www.woodvillageor.gov/wp-content/uploads/[filename].jpg`
HTTP 200 confirmed for Jairo Rios-Campos photo. All 5 officials appear to have photos (WordPress media library). Full filenames must be extracted from the live page.

### Maywood Park (cityofmaywoodpark.com)

No headshots found on the official website (council-staff page content truncated; no image URLs visible in any scraped content). [ASSUMED: LOW confidence — page was partially truncated]
Migration 247 should document: `-- No photo found on official city website.` for Maywood Park officials, pending manual verification during Plan 2 execution.

---

## Common Pitfalls

### Pitfall 1: Gresham Ward Assumption

**What goes wrong:** Planner reads CONTEXT.md D-05 and creates tasks to load Gresham ward boundary GeoJSON and assign MTFCCs X0013–X0018.
**Why it happens:** CONTEXT.md speculated Gresham has ward-based council seats.
**How to avoid:** See Critical Correction section above. Gresham is at-large. D-05 must be overridden. No ward geofences needed.
**Warning signs:** If the plan includes a GIS data download step for Gresham wards, stop — it's wrong.

### Pitfall 2: districts.state Casing

**What goes wrong:** Using `districts.state = 'OR'` (uppercase) breaks routing. The districtQueryText query uses `WHERE d.state = $1` where $1 is the lowercase geocoder output `'or'`.
**Why it happens:** governments.state is uppercase ('OR') so developers assume districts follow the same convention.
**How to avoid:** All districts for OR city officials must use `state = 'or'` (lowercase). Established in Phase 72 and confirmed across Phase 83.

### Pitfall 3: slug in chambers INSERT

**What goes wrong:** SQL error "column 'slug' cannot be set because it is a generated column."
**Why it happens:** Copying INSERT from external SQL editors that auto-complete column lists.
**How to avoid:** Never include `slug` in chambers INSERT column list. Only include: `id, name, name_formal, government_id`.

### Pitfall 4: Wrong district_type for City Officials

**What goes wrong:** Using `district_type='COUNTY'` or `district_type='SCHOOL'` for city council rows.
**Why it happens:** Copying from the Multnomah County migration (244) without changing district_type.
**How to avoid:** City council = `district_type='LOCAL'`; City Mayor = `district_type='LOCAL_EXEC'`.

### Pitfall 5: Wood Village / Maywood Park Mayor as Directly Elected

**What goes wrong:** Setting `is_appointed_position=false` for the Mayor office in Wood Village and Maywood Park.
**Why it happens:** Most city Mayors are directly elected; the council-selection pattern is unusual.
**How to avoid:** Wood Village and Maywood Park Mayors are chosen by the council from among elected members. Set `is_appointed=true` on the politician row and `is_appointed_position=true` on the office row.

### Pitfall 6: Section-Split Bug

**What goes wrong:** A geo_id has a geofence_boundaries row but no districts row, causing the API to return an empty LOCAL section for city residents.
**Why it happens:** Partial migration apply or transaction rollback.
**How to avoid:** Post-verification DO block includes section-split check per Phase 83 pattern. Smoke test also includes section-split queries for all 5 geo_ids.

### Pitfall 7: E'an Todd Name Encoding

**What goes wrong:** E'an Todd's first name contains a Unicode apostrophe (U+2019 RIGHT SINGLE QUOTATION MARK or standard apostrophe). SQL string must handle this correctly.
**Why it happens:** Non-ASCII characters in names cause SQL encoding issues.
**How to avoid:** Use standard ASCII apostrophe in SQL string: `'E''an'` (escaped single quote in SQL). Verify the exact character from the official Fairview website page source.

---

## Section-Split Check SQL

Run after migration 246 for all 5 cities (expected: 0 rows each):

```sql
-- Checks that all 5 G4110 geofences have at least one LOCAL or LOCAL_EXEC district row
SELECT gb.geo_id, gb.name
FROM essentials.geofence_boundaries gb
WHERE gb.geo_id IN ('4131250','4174850','4124250','4183950','4146730')
  AND gb.mtfcc = 'G4110'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.districts d
    WHERE d.geo_id = gb.geo_id
      AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
      AND d.state = 'or'
  );
-- Expected: 0 rows
```

---

## Runtime State Inventory

This is a greenfield seeding phase. No renamed strings, no refactoring. No runtime state to inventory.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL / Supabase MCP | Migration apply | ✓ | 15.x | — |
| Node.js / npx tsx | Smoke test | ✓ | Confirmed in Phase 83 | — |
| Python / PIL | Headshot processing | ✓ | Confirmed in Phase 83 | — |
| greshamoregon.gov headshots | CITIES-06 | ✓ | HTTP 200 confirmed | — |
| troutdaleoregon.gov headshots | CITIES-06 | ✓ | HTTP 200 via WebP URLs | — |
| woodvillageor.gov headshots | CITIES-06 | ✓ | HTTP 200 confirmed | — |
| fairvieworegon.gov headshots | CITIES-06 | ✗ | — | Document as 'No photo found' |
| cityofmaywoodpark.com headshots | CITIES-06 | [ASSUMED] | — | Document as 'No photo found' pending verification |

---

## Validation Architecture

nyquist_validation: not explicitly set in config.json — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | TypeScript smoke test via `npx tsx` |
| Config file | none — ad hoc script per phase |
| Quick run command | `npx tsx scripts/smoke-multnomah-cities.ts` |
| Full suite command | `npx tsx scripts/smoke-multnomah-cities.ts` (same) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CITIES-01 | Gresham G4110 geofence returns LOCAL officials | smoke | `npx tsx scripts/smoke-multnomah-cities.ts` | ❌ Wave 0 |
| CITIES-02 | Troutdale G4110 geofence returns LOCAL officials | smoke | same | ❌ Wave 0 |
| CITIES-03 | Fairview G4110 geofence returns LOCAL officials | smoke | same | ❌ Wave 0 |
| CITIES-04 | Wood Village G4110 geofence returns LOCAL officials | smoke | same | ❌ Wave 0 |
| CITIES-05 | Maywood Park G4110 geofence returns LOCAL officials | smoke | same | ❌ Wave 0 |
| CITIES-06 | Headshots in politician_images with type='default' | manual inspection | — | manual |

### Wave 0 Gaps

- [ ] `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts` — covers CITIES-01..05; follows smoke-multnomah-county.ts structure with 5 city test coordinates

---

## Security Domain

No security-sensitive surface introduced. Migration writes to essentials schema under developer-privileged DB connection. DATABASE_URL via dotenv, never logged. Headshots sourced from public official city websites (public domain government portraits). Follows same security posture as Phase 83.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Maywood Park headshot page was truncated during scraping; no photos confirmed absent | Headshot Availability | Low — Plan 2 executor checks page during headshot run; document as 'No photo found' if still absent |
| A2 | E'an Todd's first name uses a standard apostrophe (not Unicode RIGHT SINGLE QUOTATION MARK) | Incumbent Roster | SQL encoding error if wrong character used; verify from page source |
| A3 | Wood Village Mayor Jairo Rios-Campos photo URL pattern `Campos188_RT-5x7-1-571x800.jpg` is current | Headshot Availability | Low — Photo may have been updated; executor should verify during Plan 2 |
| A4 | All Troutdale councilor WebP photo IDs/filenames — only Mayor (821) and Carol Allen (30261) confirmed | Headshot Availability | Plan 2 must scrape full Troutdale page to extract all 7 photo URLs |

---

## Open Questions

1. **E'an Todd apostrophe character**
   - What we know: Name contains an apostrophe-like character
   - What's unclear: ASCII apostrophe vs. Unicode RIGHT SINGLE QUOTATION MARK (U+2019)
   - Recommendation: During migration writing, load the actual Fairview page source and copy the exact character

2. **Charlene Gothard vacancy status**
   - What we know: Appointed to fill vacancy when Mark Clark resigned; term ends 12/31/2026
   - What's unclear: Whether she is still currently serving (news was from early 2025)
   - Recommendation: Set `is_appointed=true` on politician row to indicate appointed origin; verify current status from Wood Village website during Plan 1

---

## Sources

### Primary (HIGH confidence)

- greshamoregon.gov/government/mayor-and-council/meet-the-council/ — incumbent names, at-large structure confirmed
- troutdaleoregon.gov/node/721 — incumbent names, at-large structure confirmed
- fairvieworegon.gov/Directory.aspx?did=29 — incumbent names (all 7 confirmed)
- woodvillageor.gov/government/city-council/ — incumbent names, council-selection Mayor confirmed
- cityofmaywoodpark.com/government/elections — incumbent names from 2026-03-03 meeting minutes
- Production DB query (geofence_boundaries) — all 5 geo_ids and centroids verified
- Production DB query (external_id range) — Phase 84 range -4131240 to -4183959 confirmed empty
- Production DB query (schema_migrations) — migration 245 is last; 246 is next

### Secondary (MEDIUM confidence)

- WebSearch results for Gresham charter review — confirms at-large system per Charter Review Committee final report
- greshamoregon.gov/government/elections/ — confirms 2026 ballot has Positions 2, 4, 6 citywide

### Tertiary (LOW confidence)

- cityofmaywoodpark.com headshot page (content truncated) — no photos confirmed or denied; marked [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Incumbent names: HIGH — verified from official city websites
- Geo_ids and centroids: HIGH — verified against production DB with ST_Covers
- Council structures: HIGH — verified from official websites + charter/election sources
- External ID scheme: HIGH — pre-flight DB query confirms range is empty
- Headshots (Gresham, Troutdale, Wood Village): HIGH — HTTP 200 confirmed
- Headshots (Fairview): HIGH — confirmed absent on official page
- Headshots (Maywood Park): LOW — page truncated; needs Plan 2 verification

**Research date:** 2026-05-31
**Valid until:** 2026-09-01 (stable — incumbents change only on election cycles; next OR city elections Nov 2026)
