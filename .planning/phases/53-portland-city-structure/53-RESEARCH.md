# Phase 53: Portland City Structure + All 23 City Scaffolding + Landing - Research

**Researched:** 2026-05-19
**Domain:** Maine municipal government structures, Portland ME city structure, DB migration patterns
**Confidence:** HIGH (DB geo_ids verified live; Portland council verified via Wikipedia + WebSearch; some smaller city structures MEDIUM via WebSearch only)

---

## Summary

This phase scaffolds all 23 Maine incorporated cities (G4110 PLACE) in the database: a government row + chambers + blank office rows per city. Portland (geo_id=2360545) is the deepest city, getting full incumbent seeding and headshots. All 23 geo_ids were verified live from `essentials.geofence_boundaries` where `state='23' AND mtfcc='G4110'`.

Portland Maine's city council structure was thoroughly researched. Critical finding: the STATE.md claim that Portland uses RCV for "Mayor, Auditor, and at-large Council" contains an error — Portland Maine has NO directly elected City Auditor (that is Portland Oregon). Portland ME has RCV for Mayor (IRV single-winner, since 2011), at-large City Council (since ~2020), and School Board (since ~2020, proportional RCV approved 2022).

Portland's mayor IS a voting member of the 9-seat city council → use the mayor-on-council rule (seat Mayor first in council chamber with title 'Mayor').

**Primary recommendation:** Use the Cambridge migration 157 DO-block pattern for all 23 city inserts, with WHERE NOT EXISTS guard on governments. Next migration is 177 (176 applied as of 2026-05-19).

---

## Portland Charter Structure (Verified Facts)

**Source:** Wikipedia Portland City Council (Maine), WebSearch multiple, portlanddems.org

### Council Seats: 9 total
| Seat Type | Count | Election Method | Term |
|-----------|-------|-----------------|------|
| Mayor (separately elected, voting member) | 1 | IRV/RCV citywide | 4 years |
| District seats (Districts 1-5) | 5 | RCV single-winner | 3 years |
| At-Large seats | 3 | RCV single-winner | 3 years |
| **Total** | **9** | | |

**Mayor model: Mayor-on-council** — Mayor Dion is one of the 9 council seats and votes on all council matters. Apply the mayor-on-council rule: seat Mayor first in the City Council chamber with title `Mayor`.

**CRITICAL CORRECTION:** STATE.md says "Portland uses RCV for Mayor, Auditor, and at-large Council." The **Auditor** reference is WRONG — that describes Portland Oregon, not Portland Maine. Portland Maine has NO directly elected City Auditor. Directly elected Portland ME offices are: Mayor, City Council (8 non-mayor councilors), Board of Public Education. Remove Auditor from any Portland ME election modeling.

### 2023 Charter Reform Context
- Voters approved proportional RCV for multi-winner city council races (at-large) in 2022; in effect for 2024+ elections
- The charter REFORM that expanded the council to 12 seats in 4 districts was **Portland Oregon** (Nov 2022), NOT Portland Maine
- Portland Maine's council remained 9 seats under the 2022 charter vote

### Current Portland City Council Members (as of 2025)
| Title | Name | Seat |
|-------|------|------|
| Mayor | Mark Dion | Mayor (elected Nov 2023, sworn Dec 2023) |
| Council Member | Sarah Michniewicz | District 1 |
| Council Member | Wesley Pelletier | District 2 |
| Council Member | Regina Phillips | District 3 |
| Council Member | Anna Bullett | District 4 |
| Council Member | Kate Sykes | District 5 |
| Council Member | Pious Ali | At-Large |
| Council Member | April Fournier | At-Large |
| Council Member | Benjamin Grant | At-Large |

**Confidence:** MEDIUM (from Wikipedia + WebSearch cross-reference; District 4 member Anna Bullett needs verification against portlandmaine.gov before seeding)

### Directly Elected Portland Offices (Phase 53 scope)
1. **Mayor** — 1 seat, citywide RCV (IRV), 4-year term
2. **City Council** — 8 seats (5 district + 3 at-large), RCV
3. **Board of Public Education** — 9 seats (5 district + 4 at-large), RCV
4. Portland Water District Trustees and Casco Bay Lines Directors are also voter-elected but are special district bodies, NOT the city government — **out of scope for Phase 53**

---

## Portland City Council — DB Modeling

**Chamber:** `Portland City Council`  
**official_count:** 9  
**election_method:** `rcv`  
**Mayor modeling:** Insert 9 offices total. First office has `title='Mayor'` (for Mark Dion). Remaining 8 offices: District 1-5 (`title='City Council Member, District N'`) and At-Large 1-3 (`title='City Council Member, At-Large'`).

```sql
-- Example office INSERT shape (within DO block)
INSERT INTO essentials.offices
  (id, chamber_id, district_id, politician_id, title,
   representing_city, representing_state,
   normalized_position_name, seats, is_appointed_position)
VALUES
  (gen_random_uuid(), v_council_id, NULL, <mayor_id>, 'Mayor',
   'Portland', 'ME', 'Mayor', 1, false),
  (gen_random_uuid(), v_council_id, NULL, <council_id>, 'City Council Member, District 1',
   'Portland', 'ME', 'Council Member', 1, false),
  ...
```

**district_id for city offices:** NULL or a LOCAL district — follow the TX pattern where `district_id` is not set for city council offices (no sub-city district rows in the DB for these cities yet).

---

## Portland School Board — DB Modeling

**Name:** `Portland Board of Public Education`  
**official_count:** 9  
**election_method:** `rcv`

### School Board Structure (verified from portlandschools.org)
| Seat | Name | Term Expires |
|------|------|-------------|
| At-Large | Maya Lena | 2027 |
| At-Large | Sarah Lentz (Chair) | 2028 |
| At-Large | Usira Ali | 2026 |
| At-Large | Jayne Sawtelle | 2028 |
| District 1 | Abusana "Micky" Bondo (Vice Chair) | 2027 |
| District 2 | Ali Ali | 2027 |
| District 3 | Julianne Opperman | 2028 |
| District 4 | Fatuma Noor | 2026 |
| District 5 | Sarah Brydon | 2026 |

**Confidence:** HIGH (verified from portlandschools.org/about/board-of-education/board-members)

### School Board District Boundaries (TIGER question)
- Portland School Board has 5 geographic districts (Districts 1-5)
- These are NOT TIGER sub-district boundaries in the TIGER/Line shapefile sense — they are city-administered board districts
- TIGER does not subdivide the G4110 Portland PLACE into school board sub-districts; school administrative unit (SAU/unified district) boundary is the full Portland city boundary
- **Decision:** Do NOT load TIGER sub-district boundaries this phase for school board districts; seat board members without district_id FK (same as council pattern). The "strong preference for TIGER boundaries" from CONTEXT.md applies if TIGER has the data — for Portland school board districts it does not as a distinct TIGER layer.

---

## All 23 Maine Cities — Government Structure Inventory

All 23 geo_ids verified live from essentials.geofence_boundaries (state='23', mtfcc='G4110').

| City | geo_id | Mayor Model | Council Seats | School Board Elected | RCV | Notes |
|------|--------|------------|---------------|---------------------|-----|-------|
| Portland | 2360545 | On-council (voting member) | 9 (Mayor+5D+3AL) | Yes, 9 seats (5D+4AL) | Yes | Deep seed in 53-02 |
| Lewiston | 2338740 | On-council (mayor+7 ward) | 8 (7 ward+1 mayor) | Yes, ward-based | No | Mayor+7 ward councilors |
| Bangor | 2302795 | Council-selected (Chair=Mayor) | 9 at-large | Verify | No | Council picks its own chair as Mayor |
| South Portland | 2371990 | Council-selected | 7 (5D+2AL) | Verify | No | Mayor selected from council |
| Auburn | 2302060 | On-council | 8 (Mayor+5W+2AL) | Verify | No | Mayor+5 ward+2 at-large |
| Biddeford | 2304860 | On-council | 9 (Mayor+7W+2AL) | Verify | No | Mayor + 7 wards + 2 at-large |
| Sanford | 2365725 | On-council | 7 at-large | Verify | No | All at-large including Mayor |
| Augusta | 2302100 | On-council | 9 (Mayor+4W+4AL) | Yes, 9 (4W+4AL+Chair) | No | Mayor votes; school board directly elected |
| Saco | 2364675 | On-council | 8 (Mayor+7W) | Verify | No | Mayor + 7 wards |
| Westbrook | 2382105 | On-council | 7 (Mayor+5W+2AL) | Yes, 7 (5W+2AL) | Yes | Both city council and school committee use RCV |
| Waterville | 2380740 | On-council | 8 (Mayor+7W) | Verify | No | Mayor+7 ward councilors |
| Brewer | 2306925 | On-council | 5 (Mayor+4) | Verify | No | Small council; verify ward vs at-large |
| Presque Isle | 2360825 | Council-selected (Chair=Mayor) | 7 at-large | Verify (MSAD#1) | No | Council Chair serves as Mayor |
| Bath | 2303355 | No mayor (Chair) | 9 | Verify | No | Council-manager; Chair not separately elected |
| Ellsworth | 2323200 | Verify | 7 | Verify | No | 7 council members |
| Gardiner | 2327085 | On-council | 8 (Mayor+4D+3AL) | Verify | No | Mayor+4 district+3 at-large, 2-year terms |
| Hallowell | 2330550 | On-council | 8 (Mayor+W+AL) | Verify | No | Mayor + ward + at-large mix |
| Calais | 2309585 | On-council | 7 at-large | Verify | No | Mayor+6 at-large, 3-year terms |
| Belfast | 2303950 | On-council | 6 (Mayor+5W) | Verify | No | Mayor + 5 ward councilors |
| Old Town | 2355225 | No mayor (Council President) | 7 | Verify | No | Council President, not separately elected Mayor |
| Eastport | 2321730 | Verify | 5 | Verify | No | Very small city |
| Rockland | 2363590 | Council-selected | 5 at-large | Verify | No | Council picks Mayor for 1 year |
| Caribou | 2310565 | On-council | 7 at-large | Verify (RSU 39) | No | Mayor+6, all at-large |

**Confidence by column:**
- geo_ids: HIGH (verified from live DB)
- Portland: HIGH (thoroughly researched)
- Lewiston/Bangor/South Portland/Auburn/Biddeford/Sanford/Augusta/Saco/Westbrook/Waterville/Bath: MEDIUM (1-2 WebSearch sources)
- Brewer/Presque Isle/Ellsworth/Gardiner/Hallowell/Calais/Belfast/Old Town/Eastport/Rockland/Caribou: LOW-MEDIUM (single WebSearch source each)

### Mayor Model Decision Rule (for migration SQL)
- **On-council**: Mayor is voted-on first in the council chamber with `title='Mayor'`. Office count includes Mayor. `election_method='rcv'` only if confirmed.
- **Council-selected**: Mayor office still needed in chamber but `is_appointed_position=true` (Mayor is chosen by council from among themselves).
- **No mayor (Chair)**: No separate Mayor office row. Council Chair is internal, not an elected-by-voters office.

### Confirmed RCV Cities (apply `election_method='rcv'` to chamber)
- Portland: YES (Mayor + council + school board)
- Westbrook: YES (mayor + council + school committee)
- All others: NO (unless Phase 55 election research changes this)

---

## City-by-City Office Inventory (for blank-office scaffolding in Plans 53-01)

For 22 non-Portland cities, the migration creates:
1. Government row (WHERE NOT EXISTS by geo_id)
2. City Council chamber (with official_count and election_method)
3. Blank office rows (politician_id=NULL) for each seat

### City Office Counts Summary
| City | Council Chamber Seats | School Chamber? | School Seats |
|------|----------------------|-----------------|-------------|
| Lewiston | 8 (Mayor+7W) | Yes | 8 (7W+1AL) |
| Bangor | 9 (at-large) | Yes (verify) | 7 (at-large) |
| South Portland | 7 (Mayor+5D+2AL) | Verify | — |
| Auburn | 8 (Mayor+5W+2AL) | Verify | — |
| Biddeford | 9 (Mayor+7W+2AL) | Verify | — |
| Sanford | 7 (Mayor+6AL) | Verify | — |
| Augusta | 9 (Mayor+4W+4AL) | Yes | 9 (4W+4AL+Chair) |
| Saco | 8 (Mayor+7W) | Verify | — |
| Westbrook | 7 (Mayor+5W+2AL) | Yes | 7 (5W+2AL) |
| Waterville | 8 (Mayor+7W) | Verify | — |
| Brewer | 5 (Mayor+4) | Verify | — |
| Presque Isle | 7 (at-large) | No (MSAD#1) | — |
| Bath | 9 (no Mayor) | Verify | — |
| Ellsworth | 7 | Verify | — |
| Gardiner | 8 (Mayor+4D+3AL) | Verify | — |
| Hallowell | 8 (Mayor+W+AL mix) | Verify | — |
| Calais | 7 (Mayor+6AL) | Verify | — |
| Belfast | 6 (Mayor+5W) | Verify | — |
| Old Town | 7 (no Mayor) | Verify | — |
| Eastport | 5 | Verify | — |
| Rockland | 5 (at-large) | Verify | — |
| Caribou | 7 (Mayor+6AL) | No (RSU 39) | — |

**Note on School Chambers:** Phase 53 should create school chambers ONLY where verified as directly-elected-by-city-residents. Unverified cities should be skipped for school chambers (Phase 54 can add them). Portland and Westbrook are confirmed. Lewiston is confirmed. Augusta is confirmed. Others need verification.

---

## DB Migration Patterns

### Critical Rules (from STATE.md and existing migrations)
1. **slug is GENERATED ALWAYS** on `essentials.chambers` — NEVER include `slug` in INSERT
2. **governments has NO unique constraint on geo_id** — use WHERE NOT EXISTS pattern
3. **Dual-office pattern** — unique index on `essentials.offices.politician_id` was DROPPED (migration 159) — never re-add
4. **state='ME'** uppercase for governments.state field (matches TX='TX', MA='MA')

### Government INSERT Pattern (Cambridge migration 157)
```sql
-- Use DO block with variable capture
DO $$
DECLARE
  v_gov_id     UUID;
  v_chamber_id UUID;
BEGIN
  INSERT INTO essentials.governments (name, type, state, city, geo_id)
  SELECT 'City of Portland, Maine, US', 'LOCAL', 'ME', NULL, '2360545'
  WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '2360545')
  RETURNING id INTO v_gov_id;

  IF v_gov_id IS NULL THEN
    SELECT id INTO v_gov_id FROM essentials.governments WHERE geo_id = '2360545';
  END IF;

  -- Chamber (never include slug)
  INSERT INTO essentials.chambers
    (government_id, name, name_formal, official_count,
     policy_engagement_level, website_url, election_method)
  VALUES
    (v_gov_id, 'City Council', 'Portland City Council', 9,
     'full', 'https://www.portlandmaine.gov/723/City-Council', 'rcv')
  RETURNING id INTO v_chamber_id;

  -- Blank office rows (politician_id left NULL — no column needed)
  INSERT INTO essentials.offices
    (id, chamber_id, title, representing_city, representing_state,
     normalized_position_name, seats, is_appointed_position)
  VALUES
    (gen_random_uuid(), v_chamber_id, 'Mayor', 'Portland', 'ME', 'Mayor', 1, false),
    ...
END $$;
```

### Incumbent INSERT Pattern (migration 176 senator style)
For Plan 53-02 (Portland incumbents), use the WITH ins_p CTE pattern:
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Mark Dion', 'Mark', 'Dion', NULL,
          true, false, false, true, <external_id>)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
UPDATE essentials.offices
SET politician_id = ins_p.id
FROM ins_p
WHERE offices.chamber_id = (SELECT id FROM essentials.chambers WHERE name='City Council' AND government_id=...)
  AND offices.title = 'Mayor';
```

**Note on party:** Per antipartisan design, Portland city elections are nonpartisan. Set `party=NULL` for all Portland city officials.

**Note on external_ids:** Portland city officials will need a new external_id namespace. Suggest `-2360545001` through `-2360545XXX` (city geo_id prefix), or use the next available negative range after US senators (-400090). The planner should assign the specific range.

---

## Landing.jsx Current Format

**File:** `src/pages/Landing.jsx`
**Exact COVERAGE_AREAS array** (as of 2026-05-19):

```javascript
const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { county: 'Los Angeles County', state: 'California', browseGovernmentList: ['0644000', '06037', '0622710'], browseStateAbbrev: 'CA', browseCountyGeoId: '06037' },
  { county: 'Collin County', state: 'Texas', browseStateAbbrev: 'TX', browseCountyGeoId: '48085', browseGovernmentList: ['4801924',...] },
  { county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' },
];
```

**New Maine entry to add:**
```javascript
{ county: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
```

**Notes:**
- `county` field is used as the display label — use `'Portland'` (matching Cambridge which uses city name not county)
- `browseGovernmentList` uses the Portland geo_id `'2360545'` — single-city entry (like Cambridge)
- `browseStateAbbrev: 'ME'` enables state-level browse
- No `browseCountyGeoId` needed (unlike LA/TX which have county geo_ids)
- No photo needed; the card visual matches existing cards
- Cambridge entry is the exact template to follow

---

## Migration Numbering

**CRITICAL CORRECTION from phase context:** The phase context said "next migration is 174" but that was stale. Migrations 174, 175, and 176 have all been applied (senate infrastructure + US senators AK-MO + US senators MT-WY, all 2026-05-19).

**Actual next migration: 177**

Recommended migration split for Phase 53:
- **177**: All 23 city government rows + chambers + blank offices (bulk scaffolding)
- **178**: Portland incumbents (Mayor, City Council members with names)
- **179**: Portland School Board incumbents

(Headshot upload is not a migration — it's a script)

---

## Common Pitfalls

### Pitfall 1: Including `slug` in chamber INSERT
**What goes wrong:** Fatal PostgreSQL error — GENERATED ALWAYS column cannot be specified  
**Prevention:** NEVER include `slug` in any `INSERT INTO essentials.chambers` statement

### Pitfall 2: Missing WHERE NOT EXISTS on governments
**What goes wrong:** Duplicate government rows for same city (no unique constraint on geo_id)  
**Prevention:** Always use the DO-block pattern with WHERE NOT EXISTS + RETURNING id + fallback SELECT

### Pitfall 3: Portland Oregon vs Portland Maine confusion
**What goes wrong:** Applying the wrong charter structure (12-seat council, elected auditor)  
**Prevention:** Portland Maine = 9-seat council (Mayor+5D+3AL), NO elected auditor. The 12-seat/4-district structure is Portland Oregon (2025 reform).

### Pitfall 4: Assuming all Maine cities have elected school boards
**What goes wrong:** Creating school chambers for cities whose school governance is via SAU/MSAD (not city-elected)  
**Prevention:** Only create school chambers where explicitly verified as city-elected. Presque Isle uses MSAD#1. Caribou uses RSU 39. Bangor school committee is directly elected but needs verification. Default to skip-school-chamber unless confirmed.

### Pitfall 5: Migration number collision
**What goes wrong:** Using 174 as next migration (already exists)  
**Prevention:** Next migration is 177. Verify with `ls C:/EV-Accounts/backend/migrations/` before writing any SQL.

### Pitfall 6: Using party on Portland officials
**What goes wrong:** Portland city elections are nonpartisan — setting a party value violates antipartisan design and is factually wrong  
**Prevention:** Set `party=NULL` for all Portland city council and school board members

---

## Code Examples

### DO-block pattern for one city (verified from migration 157, adapted for ME)
```sql
BEGIN;

DO $$
DECLARE
  v_gov_id     UUID;
  v_council_id UUID;
BEGIN
  -- Government row (WHERE NOT EXISTS — no unique constraint on geo_id)
  INSERT INTO essentials.governments (name, type, state, city, geo_id)
  SELECT 'City of Portland, Maine, US', 'LOCAL', 'ME', NULL, '2360545'
  WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '2360545')
  RETURNING id INTO v_gov_id;

  IF v_gov_id IS NULL THEN
    SELECT id INTO v_gov_id FROM essentials.governments WHERE geo_id = '2360545';
  END IF;

  -- City Council chamber (9 seats, RCV) — NEVER include slug
  INSERT INTO essentials.chambers
    (government_id, name, name_formal, official_count,
     policy_engagement_level, website_url, election_method)
  SELECT v_gov_id, 'City Council', 'Portland City Council', 9,
         'full', 'https://www.portlandmaine.gov/723/City-Council', 'rcv'
  WHERE NOT EXISTS (
    SELECT 1 FROM essentials.chambers WHERE government_id = v_gov_id AND name = 'City Council'
  )
  RETURNING id INTO v_council_id;

  IF v_council_id IS NULL THEN
    SELECT id INTO v_council_id FROM essentials.chambers
    WHERE government_id = v_gov_id AND name = 'City Council';
  END IF;

  -- Blank office rows (Mayor-on-council: first row is Mayor)
  INSERT INTO essentials.offices
    (id, chamber_id, title, representing_city, representing_state,
     normalized_position_name, seats, partisan_type, is_appointed_position)
  VALUES
    (gen_random_uuid(), v_council_id, 'Mayor', 'Portland', 'ME', 'Mayor', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, District 1', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, District 2', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, District 3', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, District 4', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, District 5', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, At-Large', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, At-Large', 'Portland', 'ME', 'Council Member', 1, NULL, false),
    (gen_random_uuid(), v_council_id, 'City Council Member, At-Large', 'Portland', 'ME', 'Council Member', 1, NULL, false);
END $$;

COMMIT;
```

### Landing.jsx COVERAGE_AREAS addition
```javascript
// Add after Cambridge entry:
{ county: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
```

---

## Key Uncertainties (Planner Must Be Aware)

1. **Portland District 4 Council Member** — Anna Bullett confirmed from Wikipedia but needs verification on portlandmaine.gov/741/Council-Bios before seeding in 53-02. MEDIUM confidence.

2. **School board TIGER districts** — Portland Board of Public Education has 5 districts but these are NOT TIGER sub-district layers. Do NOT attempt to load TIGER boundaries for school board districts; there is no corresponding TIGER shapefile at the school-board-district level for Portland ME.

3. **Bangor school committee** — Search results mention "Bangor voters elect new city councilors, school committee members" suggesting it is directly elected, but seat count and structure unverified. Recommend verifying bangormaine.gov before creating school chamber in migration.

4. **Multiple at-large seats with identical title** — When inserting multiple "City Council Member, At-Large" rows, the offices table should have 3 separate rows with identical titles (they are distinguished by UUID, not title). This matches the TX migration pattern (Place 1, Place 2 etc.) but for at-large seats without place numbers, identical titles are acceptable.

5. **External_id namespace for Portland city officials** — No established namespace for Maine city officials. The planner must decide: use -236XXXX range (geo_id-based) or continue the negative integer sequence after -400090. Recommend establishing a clear ME city namespace like -23601001 through -23601XXX for Portland (use last 5 digits of geo_id as city code).

6. **Lewiston school committee seat count** — Verified as ward-based (appears to have 7+ ward seats + at-large), but exact total seat count not confirmed from official source.

7. **Brewer council structure** — Only 5 members confirmed (1 Mayor + 4 councilors), but ward vs at-large structure not confirmed.

8. **Eastport** — Very small city (~1,288 residents), council structure not deeply researched. Confirmed 5 council members from one search result.

---

## Sources

### Primary (HIGH confidence)
- Live DB query: `essentials.geofence_boundaries WHERE state='23' AND mtfcc='G4110'` — all 23 geo_ids verified
- `portlandschools.org/about/board-of-education/board-members` — Portland School Board 9 members confirmed
- Wikipedia: Portland City Council (Maine) — 9-seat structure confirmed
- Migration 157 (Cambridge) — DO-block pattern with WHERE NOT EXISTS
- Migration 088 (TX tier 1 cities) — blank office INSERT pattern
- `src/pages/Landing.jsx` (read directly) — COVERAGE_AREAS exact format

### Secondary (MEDIUM confidence)
- WebSearch: Portland ME council current members (multiple sources agree on names)
- WebSearch: Lewiston (lewistonmaine.gov), Bangor, Augusta, South Portland, Auburn, Biddeford, Sanford, Westbrook, Saco, Waterville confirmed from official city websites
- WebSearch: Caribou (cariboumaine.org), Calais (calaismaine.org), Belfast (cityofbelfast.org), Ellsworth, Gardiner, Rockland confirmed from official sources

### Tertiary (LOW confidence)
- WebSearch only: Brewer, Hallowell, Old Town, Presque Isle, Bath, Eastport — single source each

---

## Metadata

**Confidence breakdown:**
- Portland charter/council: HIGH — multiple cross-referenced sources agree
- Portland school board: HIGH — verified from official portlandschools.org
- 23 geo_ids: HIGH — verified live from DB
- City structure inventory (top 10 cities): MEDIUM — official city website or Ballotpedia
- City structure inventory (smaller cities): LOW-MEDIUM — single WebSearch source
- Migration patterns: HIGH — from existing codebase migrations
- Landing.jsx format: HIGH — read directly from file

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable for 30 days; council membership may change if vacancies arise)
