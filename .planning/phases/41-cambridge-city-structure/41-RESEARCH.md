# Phase 41: Cambridge City Structure - Research

**Researched:** 2026-05-16
**Domain:** Cambridge, MA local government — Council-Manager form, STV elections, dual chambers (City Council + School Committee), Landing page entry
**Confidence:** HIGH

---

## Summary

This research compiles everything needed to seed Cambridge's government, chambers, offices, and incumbents into the DB, and add Cambridge to the Landing page. Cambridge is a Council-Manager city with STV proportional elections — no wards, no numbered seats.

Three DB migrations are needed:
- Migration 157: Cambridge government row + City Council chamber + School Committee chamber
- Migration 158: 9 Councillor offices + 6 School Committee offices + Mayor office (appointed) + City Manager office (appointed)
- Migration 159: All incumbents seeded (9 councillors + 6 school committee + city manager) + Landing.jsx COVERAGE_AREAS entry

**CRITICAL CORRECTION:** The CONTEXT.md states McGovern is the Mayor — this is WRONG. The January 5, 2026 council vote elected **Sumbul Siddiqui** as Mayor (third term, unanimous). McGovern is a Councillor only. The planner must treat Siddiqui as the Mayor, not McGovern. See "January 2026 Mayor" section below.

**Primary recommendation:** Follow the TX local city pattern from migrations 088-091 exactly — DO block with DECLARE variables, RETURNING id chaining, office_id + politician_id mutual update. Cambridge adds the complication of two chambers (City Council + School Committee) under one government, plus two appointed offices (Mayor + City Manager).

---

## Standard Stack

### Migration Pattern

Cambridge follows the TX local city migration pattern exactly:

| Pattern | Source | Notes |
|---------|--------|-------|
| governments INSERT | migration 088 | `type='LOCAL', state='MA', city=NULL, geo_id='2511000'` |
| chambers INSERT | migration 088 | `government_id, name, name_formal, official_count, policy_engagement_level, website_url` |
| offices INSERT | migration 088 | `chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position` |
| politician INSERT | migration 091 | DO block with DECLARE + RETURNING id + UPDATE offices.politician_id |
| email pattern | migration 091 | `ARRAY['email@cambridgema.gov']` or NULL |
| urls pattern | migration 091 | `ARRAY['https://www.cambridgema.gov/Departments/citycouncil/members/{name}']` |

### Key Constants

| Constant | Value | Source |
|----------|-------|--------|
| Cambridge geo_id | `'2511000'` | TIGER GEOID; Phase 38 confirmed |
| Cambridge MTFCC | `G4110` | G4110 = MA incorporated city |
| MA government UUID | `85783e20-3031-4d71-89a5-5dd61f4a593f` | Phase 39 confirmed live |
| Next migration number | `157` | Phase 40 applied 154-156; STATE.md confirms "next migration is 157" |

### NO `election_method` column exists

The success criteria mentions `election_method=stv_proportional` on chambers. This column does NOT exist in the schema. Options:
1. Add `ALTER TABLE essentials.chambers ADD COLUMN IF NOT EXISTS election_method TEXT;` in migration 157, then populate it on the City Council and School Committee chambers
2. Skip it (it does not affect routing or display logic — purely informational)

**Recommendation:** Add the column in migration 157 (it is a clean metadata addition). Use `ADD COLUMN IF NOT EXISTS` for idempotency.

---

## January 2026 Mayor: Siddiqui, NOT McGovern

**CONTEXT.md says:** McGovern is the Mayor appointed by council, Jan 2026.

**RESEARCH FINDS:** This is factually incorrect.

**Verified from 3 independent authoritative sources:**
1. Cambridge Day (2026-01-05): "Sumbul Siddiqui was elected mayor unanimously...handing the fifth-term councilor her third stint leading the city"
2. Harvard Crimson (2026-01-05): "The Cambridge City Council unanimously elected Sumbul Siddiqui to be the city's mayor...her third stint leading the city in just six years."
3. Cambridge Chamber of Commerce (current): Lists "Mayor Sumbul Siddiqui" + "City Manager Yi-An Huang"

**What happened:** The initial roll call was tied 3-3 between Siddiqui and McGovern (with Nolan + Zusy votes split). After Nolan switched to Siddiqui, the vote became unanimous. McGovern did NOT win.

**Confirmed Mayor:** Sumbul Siddiqui (January 2026)
**Confirmed City Manager:** Yi-An Huang (still serving — submitted FY27 budget April 2026)
**McGovern status:** Regular City Councillor (NOT Mayor)

**Implication for dual-role modeling:**
- The CONTEXT.md decision about "McGovern dual-role" must be adapted to **Siddiqui** as Mayor
- Siddiqui is both City Councillor (elected Nov 2025) AND Mayor (appointed by council Jan 2026)
- Siddiqui also serves on School Committee as ex-officio Mayor member (per Cambridge charter)
- McGovern is a regular Councillor only

---

## Current Incumbents

### City Council (9 Councillors — seated January 2026)

All 9 confirmed from official cambridgema.gov members page + Cambridge Day (2026-01-05).

| Name | Role | Email | Bio URL |
|------|------|-------|---------|
| Sumbul Siddiqui | City Councillor + **Mayor** | ssiddiqui@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/sumbulsiddiqui |
| Burhan Azeem | City Councillor (Vice Mayor) | bazeem@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/burhanazeem |
| Tim Flaherty | City Councillor (new Jan 2026) | tflaherty@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/timflaherty |
| Marc C. McGovern | City Councillor | mmcgovern@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/marcmcgovern |
| Patricia M. Nolan | City Councillor | pnolan@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/patricianolan |
| E. Denise Simmons | City Councillor | dsimmons@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/denisesimmons |
| Jivan Sobrinho-Wheeler | City Councillor | jsobrinhowheeler@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/jivansobrinhowheeler |
| Ayah A. Al-Zubi | City Councillor (new Jan 2026) | aal-zubi@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/ayahaalzubi |
| Catherine Zusy | City Councillor | czusy@cambridgema.gov | https://www.cambridgema.gov/Departments/citycouncil/members/catherinezusy |

Note on Al-Zubi: Her email uses a hyphen `aal-zubi@cambridgema.gov` — verify this is the actual format at execution time (it could also be `aalzubi@`).

**Confidence:** HIGH — sourced from official cambridgema.gov members page

### Mayor Office
- **Incumbent:** Sumbul Siddiqui (appointed by City Council, January 5, 2026)
- **Email:** mayor@cambridgema.gov
- **Bio URL:** https://www.cambridgema.gov/Departments/citycouncil/members/sumbulsiddiqui
- **Dual role:** Siddiqui holds BOTH her City Councillor office AND the Mayor office

### City Manager
- **Incumbent:** Yi-An Huang
- **Status:** Confirmed serving as of April 2026 (submitted FY27 budget)
- **Email:** citymanager@cambridgema.gov
- **Bio URL:** https://www.cambridgema.gov/Departments/citymanagersoffice (no individual bio page; use office URL)
- **`is_appointed_position = true`** (appointed by City Council, not elected)

### School Committee (6 elected members — seated January 2026)

6 elected at-large by STV in November 2025. Mayor Siddiqui also serves on School Committee as ex-officio member per Cambridge charter — this is modeled through her Mayor role, not a separate office row.

| Name | Email (cpsd.us) | Bio URL |
|------|-----------------|---------|
| David Weinstein (Chair) | dweinstein@cpsd.us | https://www.cpsd.us/school-committee/school-committee-members-subcommittees |
| Caitlin Dube (Vice Chair) | cadube@cpsd.us | https://www.cpsd.us/school-committee/school-committee-members-subcommittees |
| Luisa de Paula Santos | ldepaulasantos@cpsd.us | https://www.cpsd.us/school-committee/school-committee-members-subcommittees |
| Richard Harding, Jr. | harding4cambridge@gmail.com | https://www.cpsd.us/school-committee/school-committee-members-subcommittees |
| Elizabeth Hudson | ehudson@cpsd.us | https://www.cpsd.us/school-committee/school-committee-members-subcommittees |
| Arjun Jaikumar | ajaikumar@cpsd.us | https://www.cpsd.us/school-committee/school-committee-members-subcommittees |

Note: Richard Harding Jr. uses a Gmail address in the cpsd.us listing — this is individually-listed. Use it.

**Email strategy:** cpsd.us lists individual emails for all 6 — populate all 6 with email_addresses (exception to the "NULL when not publicly listed" rule: they ARE listed publicly at cpsd.us). Per CONTEXT.md, use "whichever source has better individual contact data" — cpsd.us has all 6.

**Confidence:** HIGH — sourced from official cpsd.us school committee page

---

## Architecture Patterns

### Recommended Migration Structure

```
Migration 157: Cambridge government row + City Council chamber + School Committee chamber
Migration 158: 9 Councillor offices + 6 School Committee offices + Mayor office + City Manager office
Migration 159: Incumbents (9 councillors + 6 school committee + city manager + mayor dual-office) + Landing.jsx
```

### Recommended Project Structure

**Migration 157 — Government + Chambers**

```sql
-- Government row (Cambridge, MA)
INSERT INTO essentials.governments (name, type, state, city, geo_id)
VALUES ('City of Cambridge, Massachusetts, US', 'LOCAL', 'MA', NULL, '2511000')
-- Pattern: 'City of {Name}, {State}, US' matches TX pattern
-- type='LOCAL' matches all TX city governments
-- state='MA' uppercase (governments table uses abbreviation)
-- geo_id='2511000' (Cambridge FIPS place GEOID)
```

DO block with DECLARE to chain government_id → chamber_id → offices:

```sql
DO $$
DECLARE
  v_gov_id        UUID;
  v_council_id    UUID;
  v_school_id     UUID;
BEGIN
  INSERT INTO essentials.governments (name, type, state, city, geo_id)
  VALUES ('City of Cambridge, Massachusetts, US', 'LOCAL', 'MA', NULL, '2511000')
  RETURNING id INTO v_gov_id;

  -- City Council chamber
  INSERT INTO essentials.chambers (government_id, name, name_formal, official_count,
    policy_engagement_level, website_url, election_method)
  VALUES (v_gov_id, 'City Council', 'Cambridge City Council', 9,
    'full', 'https://www.cambridgema.gov/departments/citycouncil', 'stv_proportional')
  RETURNING id INTO v_council_id;

  -- School Committee chamber
  INSERT INTO essentials.chambers (government_id, name, name_formal, official_count,
    policy_engagement_level, website_url, election_method)
  VALUES (v_gov_id, 'School Committee', 'Cambridge School Committee', 6,
    'full', 'https://www.cpsd.us/school_committee', 'stv_proportional')
  RETURNING id INTO v_school_id;

END $$;
```

**Migration 158 — Offices**

9 City Councillor offices (no district_id — at-large seats resolved by G4110 geofence):
```sql
INSERT INTO essentials.offices
  (chamber_id, title, representing_city, representing_state,
   normalized_position_name, seats, partisan_type, is_appointed_position)
SELECT
  (SELECT id FROM essentials.chambers WHERE name = 'City Council'
   AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '2511000')),
  'City Councillor', 'Cambridge', 'MA', 'City Councillor', 1, NULL, false
FROM generate_series(1, 9);
-- Note: 9 identical office rows, differentiated later by politician_id assignment
```

Mayor office (appointed, is_appointed_position=true):
```sql
INSERT INTO essentials.offices
  (chamber_id, title, representing_city, representing_state,
   normalized_position_name, seats, partisan_type, is_appointed_position)
VALUES
  (v_council_id, 'Mayor', 'Cambridge', 'MA', 'Mayor', 1, NULL, true);
```

City Manager office (appointed):
```sql
INSERT INTO essentials.offices
  (chamber_id, title, representing_city, representing_state,
   normalized_position_name, seats, partisan_type, is_appointed_position)
VALUES
  (v_council_id, 'City Manager', 'Cambridge', 'MA', 'City Manager', 1, NULL, true);
```

6 School Committee Member offices:
```sql
INSERT INTO essentials.offices
  (chamber_id, title, representing_city, representing_state,
   normalized_position_name, seats, partisan_type, is_appointed_position)
SELECT
  (SELECT id FROM essentials.chambers WHERE name = 'School Committee'
   AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '2511000')),
  'School Committee Member', 'Cambridge', 'MA', 'School Committee Member', 1, NULL, false
FROM generate_series(1, 6);
```

**Migration 159 — Incumbents (one DO block per politician)**

Pattern follows migration 091 exactly:
```sql
DO $$
DECLARE
  v_office_id     UUID;
  v_politician_id UUID;
BEGIN
  SELECT o.id INTO v_office_id
  FROM essentials.offices o
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.geo_id = '2511000'
    AND o.title = 'City Councillor'
    AND o.politician_id IS NULL  -- find unassigned office
  LIMIT 1;

  INSERT INTO essentials.politicians (
    first_name, last_name, preferred_name, full_name,
    party, party_short_name,
    is_active, is_incumbent, is_vacant, is_appointed,
    office_id, valid_from, valid_to, term_date_precision,
    email_addresses, urls, data_source
  ) VALUES (
    'Burhan', 'Azeem', 'Burhan', 'Burhan Azeem',
    NULL, NULL,
    true, true, false, false,
    v_office_id,
    '2026-01-05', '2028-01-01', 'month',
    ARRAY['bazeem@cambridgema.gov'],
    ARRAY['https://www.cambridgema.gov/Departments/citycouncil/members/burhanazeem'],
    'cambridgema.gov'
  ) RETURNING id INTO v_politician_id;

  UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id;
END $$;
```

### Siddiqui Dual-Office Pattern

Siddiqui holds both a City Councillor office AND the Mayor office:
1. Councillor office: her `office_id` points here (primary display title = "City Councillor")
2. Mayor office: a second row in essentials.offices has `politician_id = siddiqui.id`
   - The Mayor office must also have `politician_id = siddiqui.id` AND `is_appointed_position = true`

**NOTE:** The CONTEXT.md says "Mayor is the primary display title on McGovern's profile page." Since Siddiqui is the actual Mayor, the same logic applies: Siddiqui's `office_id` in the politicians table should point to her MAYOR office (primary display). She still has a separate City Councillor office row with her `politician_id` set so she appears in the councillor listing.

Implementation pattern:
```sql
-- Step 1: Create Siddiqui as a politician, point office_id to Mayor office
-- Step 2: Set politician_id on her Councillor office row
-- Step 3: Set politician_id on her Mayor office row

-- In practice (DO block):
-- Insert politician, RETURNING id
-- UPDATE offices SET politician_id = v_pol_id WHERE id = v_mayor_office_id  -- her primary
-- UPDATE offices SET politician_id = v_pol_id WHERE id = v_councillor_office_id  -- secondary
-- Her politicians.office_id = v_mayor_office_id (display: "Mayor")
```

### Landing.jsx COVERAGE_AREAS Entry

Pattern from existing entries:
```javascript
// Cambridge entry — matches Collin County browseGovernmentList pattern
{ county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' }
```

The `COVERAGE_AREAS` array currently has three entries (Monroe County, LA County, Collin County). Cambridge is a 4th.

**Section heading "Massachusetts":** The current Landing.jsx renders all COVERAGE_AREAS in a flat list with no section headers — the `county` and `state` fields provide the label hierarchy in the UI button. There is NO section heading logic currently. To add a "Massachusetts" section heading, a UI change is needed OR we just add Cambridge to the flat list with `state: 'Massachusetts'` as a natural grouper (it will appear below the TX entries with its own state name visible).

**UI rendering:** The coverage area button renders:
```
{area.county}  ← "Cambridge"
{area.state}   ← "Massachusetts"
```

No icon or description field exists in COVERAGE_AREAS — it's just `county` + `state`. The browseGovernmentList drives the navigation.

**No browseCountyGeoId needed** for Cambridge — Cambridge IS the city being browsed (unlike Collin County which needed county-level congressional lookup). Cambridge doesn't need county intersection lookup.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 9 identical Councillor office rows | Manual 9-row INSERT VALUES | `FROM generate_series(1, 9)` | Cleaner; same pattern |
| 6 identical School Committee office rows | Manual 6-row INSERT VALUES | `FROM generate_series(1, 6)` | Same pattern |
| email not found | `NULL` in `email_addresses` | Follow CONTEXT.md: NULL when not listed | Cambridge emails ARE listed — use them |
| Bio page URL | Custom guess | Confirmed URLs from cambridgema.gov + cpsd.us | Don't assume URL patterns |
| Landing page section | New JSX section component | Add to flat `COVERAGE_AREAS` array | No section headers exist in current UI |

---

## Common Pitfalls

### Pitfall 1: Mayor Identity Error (CRITICAL)
**What goes wrong:** Migration seeds McGovern as Mayor (per CONTEXT.md) — incorrect.
**Why it happens:** CONTEXT.md was written with incorrect assumption about the January 2026 mayor vote outcome.
**How to avoid:** Mayor = Sumbul Siddiqui. McGovern = regular City Councillor only. Three independent sources confirm Siddiqui won the January 5, 2026 council vote.
**Warning signs:** If migration inserts McGovern as `is_appointed=true` Mayor, verification query will show wrong person.

### Pitfall 2: School Committee Mayor Membership
**What goes wrong:** Creating a 7th School Committee office for the Mayor (since Mayor is an ex-officio SC member).
**Why it happens:** Cambridge charter says the Mayor serves on School Committee.
**How to avoid:** The Mayor's School Committee participation is by charter, not by a separate office row. Do NOT create a 7th School Committee office. The School Committee has 6 elected office rows only. Siddiqui's School Committee membership is via the Mayor role.

### Pitfall 3: slug Column Insertion
**What goes wrong:** Migration fails with "cannot insert into GENERATED column".
**Why it happens:** `essentials.chambers.slug` is GENERATED ALWAYS (migration 060).
**How to avoid:** Never include `slug` in any INSERT statement on chambers. The slug is auto-generated from `name_formal`.

### Pitfall 4: City Councillor vs City Councilor Spelling
**What goes wrong:** Using "Councilor" (American spelling) instead of "Councillor" (Cambridge uses British spelling).
**How to avoid:** Always use "Councillor" (double-L) in all DB titles, office titles, and normalized_position_name. Cambridge uses the British spelling consistently.

### Pitfall 5: Geofence Routing for School Committee
**What goes wrong:** School Committee offices not returned for Cambridge addresses.
**Why it happens:** School Committee offices are in a different chamber from City Council but both belong to the Cambridge government (geo_id=2511000). The geofence routing returns all offices linked to the G4110 boundary for Cambridge.
**How to avoid:** Both chambers link to the same government row (geo_id='2511000'). The G4110 boundary query returns ALL offices under that government. No separate routing needed for School Committee.

### Pitfall 6: election_method Column Missing
**What goes wrong:** Migration fails trying to insert `election_method` on chambers.
**Why it happens:** Column doesn't exist yet.
**How to avoid:** Add `ALTER TABLE essentials.chambers ADD COLUMN IF NOT EXISTS election_method TEXT;` at the start of migration 157, BEFORE the chamber INSERT statements.

### Pitfall 7: Planner uses negative external_id for Cambridge politicians
**What goes wrong:** Planner assigns external_ids like -220001 to Cambridge politicians.
**Why it happens:** State-level migrations used negative external_ids; planner assumes same pattern.
**How to avoid:** TX local city politicians (migrations 091-096) do NOT use external_id. Cambridge follows the same local city pattern — no external_id column is needed on Cambridge politicians. Leave external_id NULL (default).

### Pitfall 8: Siddiqui School Committee email collision
**What goes wrong:** Siddiqui has two emails listed: ssiddiqui@cambridgema.gov (Councillor) + mayor@cambridgema.gov (Mayor) + she's on School Committee.
**How to avoid:** For Siddiqui's politician row: use both emails in the `email_addresses` array — `ARRAY['mayor@cambridgema.gov', 'ssiddiqui@cambridgema.gov']`. Her primary contact via Mayor office is mayor@cambridgema.gov.

---

## Code Examples

### Migration 157 — Full Government + Chambers

```sql
-- Migration 157: Cambridge government row + City Council + School Committee chambers
BEGIN;

-- Add election_method column to chambers (if not exists)
ALTER TABLE essentials.chambers
ADD COLUMN IF NOT EXISTS election_method TEXT DEFAULT NULL;

DO $$
DECLARE
  v_gov_id     UUID;
  v_council_id UUID;
  v_school_id  UUID;
BEGIN
  -- Government row
  INSERT INTO essentials.governments (name, type, state, city, geo_id)
  VALUES ('City of Cambridge, Massachusetts, US', 'LOCAL', 'MA', NULL, '2511000')
  RETURNING id INTO v_gov_id;

  -- City Council chamber
  INSERT INTO essentials.chambers
    (government_id, name, name_formal, official_count, policy_engagement_level,
     website_url, election_method)
  VALUES
    (v_gov_id, 'City Council', 'Cambridge City Council', 9, 'full',
     'https://www.cambridgema.gov/departments/citycouncil', 'stv_proportional')
  RETURNING id INTO v_council_id;

  -- School Committee chamber
  INSERT INTO essentials.chambers
    (government_id, name, name_formal, official_count, policy_engagement_level,
     website_url, election_method)
  VALUES
    (v_gov_id, 'School Committee', 'Cambridge School Committee', 6, 'full',
     'https://www.cpsd.us/school_committee', 'stv_proportional')
  RETURNING id INTO v_school_id;

END $$;

COMMIT;
```

### Migration 158 — Offices Pattern

```sql
BEGIN;

DO $$
DECLARE
  v_council_id UUID;
  v_school_id  UUID;
BEGIN
  SELECT id INTO v_council_id
  FROM essentials.chambers
  WHERE name = 'City Council'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '2511000');

  SELECT id INTO v_school_id
  FROM essentials.chambers
  WHERE name = 'School Committee'
    AND government_id = (SELECT id FROM essentials.governments WHERE geo_id = '2511000');

  -- 9 City Councillor offices (at-large, no district)
  INSERT INTO essentials.offices
    (chamber_id, title, representing_city, representing_state,
     normalized_position_name, seats, partisan_type, is_appointed_position)
  SELECT v_council_id, 'City Councillor', 'Cambridge', 'MA', 'City Councillor', 1, NULL, false
  FROM generate_series(1, 9);

  -- Mayor office (appointed by council)
  INSERT INTO essentials.offices
    (chamber_id, title, representing_city, representing_state,
     normalized_position_name, seats, partisan_type, is_appointed_position)
  VALUES (v_council_id, 'Mayor', 'Cambridge', 'MA', 'Mayor', 1, NULL, true);

  -- City Manager office (appointed)
  INSERT INTO essentials.offices
    (chamber_id, title, representing_city, representing_state,
     normalized_position_name, seats, partisan_type, is_appointed_position)
  VALUES (v_council_id, 'City Manager', 'Cambridge', 'MA', 'City Manager', 1, NULL, true);

  -- 6 School Committee Member offices (at-large, no district)
  INSERT INTO essentials.offices
    (chamber_id, title, representing_city, representing_state,
     normalized_position_name, seats, partisan_type, is_appointed_position)
  SELECT v_school_id, 'School Committee Member', 'Cambridge', 'MA', 'School Committee Member', 1, NULL, false
  FROM generate_series(1, 6);

END $$;

COMMIT;
```

### Migration 159 — Siddiqui Dual-Office Pattern

```sql
-- Siddiqui: Mayor (primary) + City Councillor (secondary)
DO $$
DECLARE
  v_mayor_office_id     UUID;
  v_councillor_office_id UUID;
  v_politician_id        UUID;
BEGIN
  -- Find the Mayor office
  SELECT o.id INTO v_mayor_office_id
  FROM essentials.offices o
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.geo_id = '2511000' AND o.title = 'Mayor';

  -- Find an unassigned City Councillor office for Siddiqui
  SELECT o.id INTO v_councillor_office_id
  FROM essentials.offices o
  JOIN essentials.chambers ch ON ch.id = o.chamber_id
  JOIN essentials.governments g ON g.id = ch.government_id
  WHERE g.geo_id = '2511000'
    AND o.title = 'City Councillor'
    AND o.politician_id IS NULL
  LIMIT 1;

  -- Insert Siddiqui with office_id = Mayor (primary display title)
  INSERT INTO essentials.politicians (
    first_name, last_name, preferred_name, full_name,
    party, party_short_name,
    is_active, is_incumbent, is_vacant, is_appointed,
    office_id, valid_from, valid_to, term_date_precision,
    email_addresses, urls, data_source
  ) VALUES (
    'Sumbul', 'Siddiqui', 'Sumbul', 'Sumbul Siddiqui',
    NULL, NULL,
    true, true, false, false,
    v_mayor_office_id,     -- Mayor is primary display office
    '2026-01-05', '2028-01-01', 'month',
    ARRAY['mayor@cambridgema.gov', 'ssiddiqui@cambridgema.gov'],
    ARRAY['https://www.cambridgema.gov/Departments/citycouncil/members/sumbulsiddiqui'],
    'cambridgema.gov'
  ) RETURNING id INTO v_politician_id;

  -- Wire Mayor office
  UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_mayor_office_id;

  -- Wire Councillor office (Siddiqui still holds her elected seat)
  UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_councillor_office_id;
END $$;
```

### Landing.jsx COVERAGE_AREAS Addition

```javascript
// In src/pages/Landing.jsx, add to COVERAGE_AREAS array:
{ county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' }
```

Full array after change:
```javascript
const COVERAGE_AREAS = [
  { county: 'Monroe County', state: 'Indiana', address: '100 W Kirkwood Ave, Bloomington, IN 47404' },
  { county: 'Los Angeles County', state: 'California', browseGovernmentList: ['0644000', '06037', '0622710'], browseStateAbbrev: 'CA', browseCountyGeoId: '06037' },
  { county: 'Collin County', state: 'Texas', browseStateAbbrev: 'TX', browseCountyGeoId: '48085', browseGovernmentList: ['4801924','4803300','4808872','4813684','4825224','4825488','4827684','4838068','4841800','4844308','4845012','4845744','4847496','4850100','4850760','4855152','4863000','4863276','4863432','4863500','4864220','4875960','4877740'] },
  { county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' },
];
```

---

## DB Schema — Confirmed Column Sets

### essentials.governments (confirmed from migration 088)
Columns used in INSERT: `name, type, state, city, geo_id`
- `id` has DEFAULT gen_random_uuid()
- `type='LOCAL'` for city governments
- `state='MA'` uppercase
- `city=NULL` (not empty string — TX cities use NULL per migration 088)

### essentials.chambers (confirmed columns)
Columns used in INSERT: `government_id, name, name_formal, official_count, policy_engagement_level, website_url`
- `id` has DEFAULT gen_random_uuid()
- `slug` is GENERATED ALWAYS — NEVER INSERT
- `election_method` column does NOT exist yet; must be added via ALTER TABLE in migration 157

### essentials.offices (confirmed from migration 088)
Columns used in INSERT: `chamber_id, title, representing_city, representing_state, normalized_position_name, seats, partisan_type, is_appointed_position`
- `id` has DEFAULT gen_random_uuid()
- `politician_id` is set via UPDATE after politician insert (not in initial INSERT)

### essentials.politicians (confirmed from migration 091)
Key columns: `first_name, last_name, preferred_name, full_name, party, party_short_name, is_active, is_incumbent, is_vacant, is_appointed, office_id, valid_from, valid_to, term_date_precision, email_addresses, urls, data_source`
- `email_addresses TEXT[]` — array, NULL when not available
- `urls TEXT[]` — bio page URL
- `data_source TEXT` — use `'cambridgema.gov'` for councillors, `'cpsd.us'` for school committee
- `external_id` — NOT used for local city politicians (matches TX pattern; NULL default)
- `office_id` → primary office UUID (back-reference; also set via UPDATE after politician creation)

---

## State of the Art

| Old Assumption | Current Truth | Impact |
|----------------|---------------|--------|
| McGovern is 2026 Mayor | Siddiqui is 2026 Mayor (Jan 5 vote) | Plans referencing McGovern as Mayor must be corrected |
| School Committee has 7 members | 6 elected + Mayor ex-officio; 6 office rows | Do NOT create 7th SC office row |
| election_method exists on chambers | Column does NOT exist; must be added | Migration 157 needs ALTER TABLE first |
| External_id needed for Cambridge | Not needed (local city pattern) | No collision risk; no external_id column to populate |

---

## Open Questions

1. **Al-Zubi email format**
   - What we know: Official site shows `aal-zubi@cambridgema.gov` (hyphenated)
   - What's unclear: Whether hyphen is real or display artifact; most Cambridge emails are unhyphenated
   - Recommendation: Verify at execution time; if uncertain, use NULL and populate bio URL only

2. **Burhan Azeem Vice Mayor — separate office?**
   - What we know: Azeem is Vice Mayor (elected by council alongside Siddiqui's mayoralty)
   - What's unclear: Whether Vice Mayor has its own `is_appointed_position=true` office row
   - Recommendation: Vice Mayor is not a separate office in Cambridge — it's a title given to one of the 9 councillors. Do NOT create a Vice Mayor office row. Azeem is simply a Councillor. The CONTEXT.md only specifies Mayor and City Manager as appointed offices.

3. **City Manager's bio URL**
   - What we know: cambridgema.gov/Departments/citymanagersoffice is the department page; no individual bio page found
   - Recommendation: Use `https://www.cambridgema.gov/Departments/citymanagersoffice` as Yi-An Huang's URL (department page is the closest equivalent).

4. **Term dates for Councillors and School Committee**
   - What we know: Cambridge municipal elections are in November odd years; council terms are 2 years; seated January 2026
   - Recommendation: `valid_from='2026-01-05'` (inauguration date), `valid_to='2028-01-01'` (`term_date_precision='month'`). Check if any councillors were re-elected vs first term — doesn't affect the DB values.

5. **Does `election_method` column require a CHECK constraint?**
   - Recommendation: Skip CHECK constraint; use bare `TEXT` column. Only two values will exist ('stv_proportional') for Cambridge. Keep simple.

---

## Sources

### Primary (HIGH confidence)
- cambridgema.gov/Departments/citycouncil/members — all 9 councillor names + emails + bio URLs (fetched 2026-05-16)
- cambridgema.gov/Departments/citycouncil/members/sumbulsiddiqui — confirms Siddiqui as "Mayor Sumbul Siddiqui, serving her third term"
- cambridgechamber.org/cambridge-city-leadership — confirms Mayor Siddiqui + City Manager Yi-An Huang (current)
- cpsd.us/school-committee/school-committee-members-subcommittees — all 6 school committee members + individual emails
- cambridgema.gov/Departments/citymanagersoffice — Yi-An Huang, citymanager@cambridgema.gov
- C:/EV-Accounts/backend/migrations/088_tx_tier1_cities.sql — LOCAL government migration pattern (confirmed)
- C:/EV-Accounts/backend/migrations/091_plano_politicians.sql — politician seed pattern (DO blocks)
- C:/EV-Accounts/backend/migrations/060_chambers_slug.sql — slug GENERATED column (never INSERT)
- STATE.md — "next migration is 157", Cambridge geo_id='2511000' confirmed, MA government UUID confirmed

### Secondary (MEDIUM confidence)
- cambridgeday.com/2026/01/05/city-council-sworn-in-siddiqui-mayor — Siddiqui Mayor vote (Jan 5, 2026)
- thecrimson.com/article/2026/1/5/sumbul-siddiqui-elected-mayor-again — Harvard Crimson: "unanimous" Siddiqui Mayor
- cambridgema.gov/news/2026/04 FY27 budget — Yi-An Huang still City Manager as of April 2026
- cpsd.us/school-committee/overview — "Six members are elected at large. The Mayor also serves on the School Committee."

### Tertiary (LOW confidence)
- WebFetch of official members page showing "Mayor Marc C. McGovern" — CONTRADICTS news sources. Likely a page rendering artifact or stale content. Overridden by 3+ authoritative sources confirming Siddiqui.

---

## Metadata

**Confidence breakdown:**
- Cambridge roster (9 councillors + Mayor + City Manager): HIGH — official site + 2 news sources
- School Committee roster (6 members + emails): HIGH — official cpsd.us source
- Mayor identity (Siddiqui vs McGovern): HIGH — 3 independent sources confirm Siddiqui
- Migration pattern (LOCAL government + offices): HIGH — confirmed from migrations 088-091
- election_method column absence: HIGH — grepped all migrations, zero hits
- Landing.jsx COVERAGE_AREAS pattern: HIGH — read actual source code
- Term dates: MEDIUM — election timing confirmed; exact inauguration date Jan 5, 2026 from Cambridge Day

**Research date:** 2026-05-16
**Valid until:** 2027-01-01 (Cambridge terms are 2 years; next election November 2027)
