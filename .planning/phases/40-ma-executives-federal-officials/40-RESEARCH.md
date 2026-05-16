# Phase 40: MA Executives + Federal Officials - Research

**Researched:** 2026-05-16
**Domain:** Massachusetts statewide executives + federal delegation (US Senators, 9 US House reps)
**Confidence:** HIGH

---

## Summary

This research establishes everything needed to seed the 6 MA statewide executives and 11 MA federal
officials (2 US Senators + 9 US House reps) into the DB, wire their districts and chambers, and
import their headshots.

Three migrations are needed:
- Migration 154: MA NATIONAL_UPPER district + `role_canonical` column + 6 STATE_EXEC districts +
  6 executive chambers + 6 politicians
- Migration 155: 2 MA US Senators (Warren, Markey) + offices using existing US Senate chamber
- Migration 156: 9 MA US House reps + offices using existing US House chamber

The headshot plan (Plan 40-02) processes all 17 subjects using the established
`/find-headshots` skill. Federal officials use the congressional press gallery first,
MA.gov for state executives. Both tiers have Wikipedia as fallback.

**CRITICAL FINDING:** The CONTEXT.md specifies external_id `-200002` for one MA executive, but
`-200002` is already taken by Curren D. Price Jr. (a CA politician). The planner must assign a
different ID to avoid a unique constraint violation. See External_id section below.

**Primary recommendation:** Model the executive migration exactly after TX migration 103 pattern:
create districts + chambers + politicians in a single CTE chain, but add WHERE NOT EXISTS guards
(migration 103 was NOT idempotent — that bug must not be repeated).

---

## Standard Stack

### Core: Libraries and Tools
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PIL (Pillow) | installed | crop 4:5 then resize 600×750 LANCZOS q90 | Established project pattern for all headshots |
| psql | system | Apply SQL migrations | Standard in project; DATABASE_URL from C:/Users/Chris/AppData/Local/Temp/backend.env |
| `/find-headshots` skill | v1 | Per-photo approval workflow | Mandatory — never batch import without user approval |

### Database Architecture: Verified Live DB Facts

**MA government row:** EXISTS — UUID `85783e20-3031-4d71-89a5-5dd61f4a593f`, name `'Commonwealth of Massachusetts'`

**Existing MA chambers (from Phase 39):**
- `Massachusetts Senate` — UUID `ddc43e0f-3157-4201-b882-ae2f75d06d5a`
- `Massachusetts House of Representatives` — UUID `5f3d03da-68fe-4413-9fdc-96cde252f899`

**Existing US Federal chambers (for senators and reps):**
- `U.S. Senate` — UUID `7cbe07bc-84b8-433b-952b-540e7de18a92`, name_formal = `United States Senate`
- `U.S. House of Representatives` — UUID `c2facc31-7b13-428c-b7b9-32d0d3b95f76`, name_formal = `United States House of Representatives`

**Existing MA NATIONAL_LOWER districts (9 exist — from Phase 38):**
| geo_id | label | district UUID |
|--------|-------|--------------|
| 2501 | Congressional District 1 | 7193bcd5-add2-40e4-86c0-607470c5db07 |
| 2502 | Congressional District 2 | e7c6fe3b-d65d-42e6-a9c5-09e2d2490503 |
| 2503 | Congressional District 3 | add01337-169b-4b2b-beaa-40b89b652943 |
| 2504 | Congressional District 4 | 8aab8c40-d8ed-4bc4-b554-fde92a0b3f3f |
| 2505 | Congressional District 5 | 2187915a-9610-4b28-a38a-006cd35174e2 |
| 2506 | Congressional District 6 | b79dfca7-7841-49fd-b5ed-9c6a5c48c207 |
| 2507 | Congressional District 7 | fd813772-ee02-4b85-9f73-ec8bfa100257 |
| 2508 | Congressional District 8 | 497460dd-9f7c-47dc-8941-af7012b98a3f |
| 2509 | Congressional District 9 | d0674e3b-0bbb-437f-962f-78b342571116 |

**NATIONAL_UPPER district for MA:** Does NOT exist yet. Must be created in migration 154.
Pattern from TX: `district_type='NATIONAL_UPPER', state='MA', geo_id='25', label='Massachusetts', district_id='Massachusetts', mtfcc=''`

---

## Current Officeholders

### MA State Executives (6 officials — confirmed from mass.gov official page)
Source: https://www.sec.state.ma.us/divisions/cis/government/constitutional-officers.htm

| Office | Official Title (display) | Incumbent | party |
|--------|--------------------------|-----------|-------|
| Governor | Governor | Maura Healey | Democrat |
| Lieutenant Governor | Lieutenant Governor | Kim Driscoll | Democrat |
| Secretary of the Commonwealth | Secretary of the Commonwealth | William Francis Galvin | Democrat |
| Attorney General | Attorney General | Andrea Joy Campbell | Democrat |
| Treasurer and Receiver-General | Treasurer and Receiver-General | Deborah (Deb) B. Goldberg | Democrat |
| Auditor of the Commonwealth | Auditor of the Commonwealth | Diana DiZoglio | Democrat |

**Auditor title resolved (Claude's Discretion):** The constitutional title is "Auditor of the
Commonwealth" — NOT "State Auditor." The mass.gov page and Ballotpedia both use "Auditor of the
Commonwealth." Use this as both the display title and chamber name.

### MA US Senators (2 — confirmed from official Senate websites)
| Senator | Party | District |
|---------|-------|----------|
| Elizabeth Warren | Democrat | MA (NATIONAL_UPPER) |
| Edward J. Markey | Democrat | MA (NATIONAL_UPPER) |

### MA US House Representatives (9 — confirmed from Wikipedia congressional districts page)
Source: https://en.wikipedia.org/wiki/Massachusetts%27s_congressional_districts

| geo_id | District | Representative | Party |
|--------|----------|----------------|-------|
| 2501 | MA-01 | Richard Neal | Democrat |
| 2502 | MA-02 | Jim McGovern | Democrat |
| 2503 | MA-03 | Lori Trahan | Democrat |
| 2504 | MA-04 | Jake Auchincloss | Democrat |
| 2505 | MA-05 | Katherine Clark | Democrat |
| 2506 | MA-06 | Seth Moulton | Democrat |
| 2507 | MA-07 | Ayanna Pressley | Democrat |
| 2508 | MA-08 | Stephen Lynch | Democrat |
| 2509 | MA-09 | Bill Keating | Democrat |

**Confidence:** MEDIUM — names from Wikipedia 118th Congress table. Should be cross-verified
against house.gov before migration commit, as it may not yet reflect any 2025 seat changes.

---

## External_id Assignments

### Critical Collision: -200002 Already Used
Live DB confirmed: `external_id = -200002` is already assigned to Curren D. Price Jr. (CA politician).

**Resolution:** Skip -200002 and assign the 6 executives as -200001, -200003, -200004, -200005,
-200006, -200007. This keeps sequential clarity while avoiding the collision.

### Full External_id Plan
| external_id | Assignment |
|-------------|-----------|
| -200001 | Maura Healey (Governor) |
| **-200002** | **TAKEN — Curren D. Price Jr. — SKIP** |
| -200003 | Kim Driscoll (Lt. Governor) |
| -200004 | Andrea Joy Campbell (Attorney General) |
| -200005 | Deborah B. Goldberg (Treasurer and Receiver-General) |
| -200006 | Diana DiZoglio (Auditor of the Commonwealth) |
| -200007 | William Francis Galvin (Secretary of the Commonwealth) |
| -200101 | Elizabeth Warren (US Senator) |
| -200102 | Edward J. Markey (US Senator) |
| -200201 | Richard Neal (MA-01) |
| -200202 | Jim McGovern (MA-02) |
| -200203 | Lori Trahan (MA-03) |
| -200204 | Jake Auchincloss (MA-04) |
| -200205 | Katherine Clark (MA-05) |
| -200206 | Seth Moulton (MA-06) |
| -200207 | Ayanna Pressley (MA-07) |
| -200208 | Stephen Lynch (MA-08) |
| -200209 | Bill Keating (MA-09) |

**Collision check:** Only -200002 is taken in the -200001 to -200209 range. All other planned IDs
are clear. The -200101/-200102 and -200201 to -200209 ranges are confirmed empty from live DB query.

---

## Migration Numbering

| Migration | Content |
|-----------|---------|
| 153 | ALREADY EXISTS (`153_xavier_becerra_stances.sql`) |
| **154** | `role_canonical` column on offices + MA NATIONAL_UPPER district + 6 STATE_EXEC districts + 6 executive chambers + 6 MA executives + their offices |
| **155** | Warren + Markey (US Senators, NATIONAL_UPPER) |
| **156** | 9 MA US House reps (NATIONAL_LOWER, geo_ids 2501-2509) |

Note: There is also a duplicate file naming issue in migrations — two files named `152_*` exist.
This is a file system issue, not a DB issue. The planner should be aware but it does not affect
the next migration number (154 is next).

---

## Architecture Patterns

### Pattern 1: MA Executive — District + Chamber + Politician + Office (Idempotent CTE)

Unlike migration 103 (TX), Phase 40 MUST use WHERE NOT EXISTS guards. Use ON CONFLICT (external_id)
DO NOTHING for politicians (there's a unique index on external_id).

```sql
-- One chamber per executive office — name_formal same as name
-- Chamber name pattern: "Massachusetts [Role]"
-- e.g., "Massachusetts Governor", "Massachusetts Secretary of the Commonwealth"
WITH ins_chamber AS (
  INSERT INTO essentials.chambers (id, name, name_formal, government_id)
  SELECT gen_random_uuid(),
         'Massachusetts Governor',
         'Massachusetts Governor',
         '85783e20-3031-4d71-89a5-5dd61f4a593f'
  WHERE NOT EXISTS (
    SELECT 1 FROM essentials.chambers
    WHERE name = 'Massachusetts Governor'
      AND government_id = '85783e20-3031-4d71-89a5-5dd61f4a593f'
  )
  RETURNING id
),
ins_district AS (
  INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
  SELECT gen_random_uuid(), 'STATE_EXEC', 'MA', '25', 'Massachusetts Governor', '', ''
  WHERE NOT EXISTS (
    SELECT 1 FROM essentials.districts
    WHERE district_type = 'STATE_EXEC' AND state = 'MA' AND label = 'Massachusetts Governor'
  )
  RETURNING id
),
ins_politician AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Maura Healey', 'Maura', 'Healey', 'Democrat',
          true, false, false, true, -200001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id, c.id, p.id, 'Governor', 'MA', false, false
FROM ins_district d
CROSS JOIN ins_chamber c
CROSS JOIN ins_politician p
WHERE d.id IS NOT NULL AND c.id IS NOT NULL AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = c.id
  );
```

**Key pattern notes:**
- Chamber inserts: WHERE NOT EXISTS on (name, government_id)
- District inserts: WHERE NOT EXISTS on (district_type, state, label)
- Politician inserts: ON CONFLICT (external_id) DO NOTHING
- Office insert: guarded by NOT EXISTS on (district_id, chamber_id)
- All 6 executives follow this same pattern in the same migration

### Pattern 2: MA NATIONAL_UPPER District (Warren + Markey share one district)

```sql
-- Create the NATIONAL_UPPER district for MA (modeled on TX geo_id='48')
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'NATIONAL_UPPER', 'MA', '25', 'Massachusetts', 'Massachusetts', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'NATIONAL_UPPER' AND state = 'MA'
);
```

Both Warren and Markey link to the SAME district row (NATIONAL_UPPER, MA). This is the
established TX pattern — Cruz and Cornyn both used the same TX NATIONAL_UPPER district id.

### Pattern 3: MA US Senator — using shared US Senate chamber (NOT creating a new one)

```sql
-- Senators use the existing shared chamber: 7cbe07bc-84b8-433b-952b-540e7de18a92
WITH ins_warren AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Elizabeth Warren', 'Elizabeth', 'Warren', 'Democrat',
          true, false, false, true, -200101)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       '7cbe07bc-84b8-433b-952b-540e7de18a92',
       p.id,
       'Senator', 'MA', false, false
FROM essentials.districts d
CROSS JOIN ins_warren p
WHERE d.district_type = 'NATIONAL_UPPER' AND d.state = 'MA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.politician_id = p.id
  );
```

### Pattern 4: MA US House Rep — using existing NATIONAL_LOWER districts

```sql
-- Each rep links to their specific NATIONAL_LOWER district by geo_id
WITH ins_neal AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Richard Neal', 'Richard', 'Neal', 'Democrat',
          true, false, false, true, -200201)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       'c2facc31-7b13-428c-b7b9-32d0d3b95f76',
       p.id,
       'Representative', 'MA', false, false
FROM essentials.districts d
CROSS JOIN ins_neal p
WHERE d.geo_id = '2501' AND d.district_type = 'NATIONAL_LOWER' AND d.state = 'MA'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = 'c2facc31-7b13-428c-b7b9-32d0d3b95f76'
  );
```

### Pattern 5: role_canonical Column Addition

```sql
ALTER TABLE essentials.offices
ADD COLUMN IF NOT EXISTS role_canonical TEXT DEFAULT NULL;
```

After adding the column, the office inserts for Secretary and Treasurer set it:
- Secretary of the Commonwealth office: `role_canonical = 'secretary_of_state'`
- Treasurer and Receiver-General office: `role_canonical = 'treasurer'`
- All other MA executive offices: `role_canonical = NULL` (default)

The column is added in migration 154 before any inserts that reference it.

### Pattern 6: Chamber Name Format (MA executives)
Format: `"Massachusetts [Role]"` — exactly 6 new chambers

| Chamber Name | office_title |
|-------------|-------------|
| `Massachusetts Governor` | `Governor` |
| `Massachusetts Lieutenant Governor` | `Lieutenant Governor` |
| `Massachusetts Secretary of the Commonwealth` | `Secretary of the Commonwealth` |
| `Massachusetts Attorney General` | `Attorney General` |
| `Massachusetts Treasurer and Receiver-General` | `Treasurer and Receiver-General` |
| `Massachusetts Auditor of the Commonwealth` | `Auditor of the Commonwealth` |

All 6 link to `government_id = '85783e20-3031-4d71-89a5-5dd61f4a593f'`
(Commonwealth of Massachusetts, confirmed live).

---

## role_canonical Assignments

| Incumbent | Office Title | role_canonical |
|-----------|-------------|----------------|
| Maura Healey | Governor | NULL |
| Kim Driscoll | Lieutenant Governor | NULL |
| William Francis Galvin | Secretary of the Commonwealth | `'secretary_of_state'` |
| Andrea Joy Campbell | Attorney General | NULL |
| Deborah B. Goldberg | Treasurer and Receiver-General | `'treasurer'` |
| Diana DiZoglio | Auditor of the Commonwealth | NULL |

Note: The CONTEXT.md only specifies Secretary and Treasurer need role_canonical. Auditor is
explicitly decided as NULL per CONTEXT.md (locked decision, no need to check further).

---

## State Table (districts.state) for Each district_type

This is a persistent pitfall across all migrations:

| district_type | districts.state | offices.representing_state |
|--------------|----------------|---------------------------|
| STATE_EXEC | `'MA'` (uppercase) | `'MA'` |
| NATIONAL_UPPER | `'MA'` (uppercase) | `'MA'` |
| NATIONAL_LOWER | `'MA'` (uppercase) | `'MA'` |
| STATE_UPPER | `'ma'` (lowercase) | `'MA'` |
| STATE_LOWER | `'ma'` (lowercase) | `'MA'` |

TX precedent confirms: STATE_EXEC uses `state='TX'` (uppercase) in districts — same case as
geofence_boundaries.state for TX which uses FIPS '48'. For MA, the existing NATIONAL_LOWER
districts use `state='MA'` (uppercase). Phase 40 must match: all new districts use `state='MA'`.
The lowercase `'ma'` is only for STATE_UPPER/STATE_LOWER loaded by the TIGER script in Phase 38/39.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| image resize | custom script | PIL LANCZOS q90 pattern from Plan 20-02 | Established, verified, consistent |
| Idempotency for politician insert | WHERE NOT EXISTS | ON CONFLICT (external_id) DO NOTHING | There is a unique index on external_id |
| Idempotency for chamber/district | custom check | WHERE NOT EXISTS subquery | No unique constraint exists on these tables |
| Idempotency for office | custom check | WHERE NOT EXISTS on (district_id, chamber_id) | Safe guard pattern |
| National upper district | custom state-level district table | Single NATIONAL_UPPER row, state='MA' | Matches TX/CA/IN pattern |

---

## Common Pitfalls

### Pitfall 1: -200002 External_id Collision
**What goes wrong:** ON CONFLICT skips the INSERT silently — Maura Healey (or whoever is at -200002) is never created. No error, but the exec count comes back wrong.
**Why it happens:** `-200002` is already assigned to Curren D. Price Jr. (a CA politician).
**How to avoid:** Use -200007 for the 6th executive instead of -200002. See external_id table above.
**Warning signs:** After migration, SELECT COUNT(*) from politicians where external_id IN (-200001, -200003, -200004, -200005, -200006, -200007) returns less than 6.

### Pitfall 2: Creating a New US Senate/House Chamber for MA
**What goes wrong:** Migration creates a new "Massachusetts US Senate" chamber, breaking the shared federal chamber pattern.
**Why it happens:** TX executive migration (103) created per-state executive chambers but US senators use the shared "U.S. Senate" chamber.
**How to avoid:** Warren + Markey use chamber `7cbe07bc-84b8-433b-952b-540e7de18a92` (U.S. Senate). House reps use `c2facc31-7b13-428c-b7b9-32d0d3b95f76` (U.S. House of Representatives). No new chambers for federal officials.
**Warning signs:** Any new chamber with "Massachusetts" + "Senate" or "House" for federal officials.

### Pitfall 3: Migration 103 Was Not Idempotent — Don't Copy That Pattern
**What goes wrong:** Raw CTEs insert without guards — re-running creates duplicate rows.
**Why it happens:** Migration 103 had no WHERE NOT EXISTS or ON CONFLICT guards.
**How to avoid:** Every INSERT in Phase 40 must have a guard. See code examples above.

### Pitfall 4: NATIONAL_UPPER District state Case
**What goes wrong:** SELECT returns 0 rows when looking for the MA NATIONAL_UPPER district.
**Why it happens:** Using `state = 'ma'` (lowercase) when NATIONAL_UPPER districts use uppercase.
**How to avoid:** All Phase 40 district lookups use `state = 'MA'` (uppercase). Only STATE_UPPER/STATE_LOWER use lowercase 'ma'.

### Pitfall 5: slug Column Must Not Be Inserted
**What goes wrong:** Migration fails with "cannot insert into GENERATED column".
**Why it happens:** essentials.chambers has slug as GENERATED ALWAYS.
**How to avoid:** Omit slug from all INSERT statements. Confirmed in Phase 39 research.

### Pitfall 6: Auditor Title
**What goes wrong:** Using "State Auditor" instead of "Auditor of the Commonwealth" as the office title and chamber name.
**Why it happens:** Mass.gov uses both informally.
**How to avoid:** Official constitutional title is "Auditor of the Commonwealth." Use this for office_title, chamber name, and district label. Confirmed from mass.gov constitutional officers page.

### Pitfall 7: Headshot — Congressional Photos Have Standardized Sources
**What goes wrong:** Wasting time searching random sites for senator/rep headshots.
**How to avoid:** Congressional press gallery is the standard first source for federal officials. All 9 MA House reps and both Senators have official press photos. These are typically public domain (US government works). Wikipedia is a reliable fallback.

### Pitfall 8: Duplicate 152 Migration File
**What goes wrong:** Planner creates migration 153 thinking it's the next free number.
**Why it happens:** `153_xavier_becerra_stances.sql` already exists.
**How to avoid:** Next migration is 154. The two 152_*.sql files are a naming issue, but 153 is already used.

---

## Code Examples

### Add role_canonical Column
```sql
-- Source: CONTEXT.md + district schema pattern
ALTER TABLE essentials.offices
ADD COLUMN IF NOT EXISTS role_canonical TEXT DEFAULT NULL;
```

### Create MA NATIONAL_UPPER District
```sql
-- Source: TX migration 103 pattern adapted for MA
INSERT INTO essentials.districts (id, district_type, state, geo_id, label, district_id, mtfcc)
SELECT gen_random_uuid(), 'NATIONAL_UPPER', 'MA', '25', 'Massachusetts', 'Massachusetts', ''
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.districts
  WHERE district_type = 'NATIONAL_UPPER' AND state = 'MA'
);
```

### Executive Chamber Insert (with NOT EXISTS guard)
```sql
-- Source: TX migration 103 adapted with idempotency fix
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Massachusetts Governor',
       'Massachusetts Governor',
       '85783e20-3031-4d71-89a5-5dd61f4a593f'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Massachusetts Governor'
    AND government_id = '85783e20-3031-4d71-89a5-5dd61f4a593f'
);
```

### Politician + Office Insert (Healey example, with role_canonical NULL)
```sql
WITH ins_pol AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Maura Healey', 'Maura', 'Healey', 'Democrat',
          true, false, false, true, -200001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Governor'),
       p.id,
       'Governor', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN ins_pol p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'MA' AND d.label = 'Massachusetts Governor'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
);
```

### Politician + Office Insert (Galvin — Secretary, with role_canonical)
```sql
WITH ins_pol AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'William Francis Galvin', 'William', 'Galvin', 'Democrat',
          true, false, false, true, -200007)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Secretary of the Commonwealth'),
       p.id,
       'Secretary of the Commonwealth', 'MA', false, false, 'secretary_of_state'
FROM essentials.districts d
CROSS JOIN ins_pol p
WHERE d.district_type = 'STATE_EXEC' AND d.state = 'MA'
  AND d.label = 'Massachusetts Secretary of the Commonwealth'
  AND p.id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id
);
```

### Headshot Resize (PIL pattern — from Plan 20-02)
```python
# Source: Plan 20-02 Task 2 action — established project pattern
from PIL import Image
img = Image.open("/tmp/{politician_id}-raw.jpg")
w, h = img.size
target_ratio = 4/5  # width/height
if w/h > target_ratio:
    new_w = int(h * target_ratio)
    left = (w - new_w) // 2
    img = img.crop((left, 0, left + new_w, h))
else:
    new_h = int(w / target_ratio)
    img = img.crop((0, 0, w, new_h))  # keep top portion
img = img.resize((600, 750), Image.LANCZOS)
img.convert("RGB").save("/tmp/{politician_id}-headshot.jpg", "JPEG", quality=90)
```

---

## Headshot Source Priorities

### Federal Officials (Warren, Markey, 9 House reps)
Source priority:
1. Congressional press gallery (official government works — public domain)
2. Wikipedia infobox (Wikimedia Commons — cc_by_sa)

All 11 MA federal officials have stable Wikipedia articles and press photos.

Suggested Wikipedia article paths:
- Warren: https://en.wikipedia.org/wiki/Elizabeth_Warren
- Markey: https://en.wikipedia.org/wiki/Ed_Markey
- Neal: https://en.wikipedia.org/wiki/Richard_Neal
- McGovern: https://en.wikipedia.org/wiki/Jim_McGovern_(politician)
- Trahan: https://en.wikipedia.org/wiki/Lori_Trahan
- Auchincloss: https://en.wikipedia.org/wiki/Jake_Auchincloss
- Clark: https://en.wikipedia.org/wiki/Katherine_Clark
- Moulton: https://en.wikipedia.org/wiki/Seth_Moulton
- Pressley: https://en.wikipedia.org/wiki/Ayanna_Pressley
- Lynch: https://en.wikipedia.org/wiki/Stephen_Lynch_(politician)
- Keating: https://en.wikipedia.org/wiki/William_Keating

Note on disambiguation: Jim McGovern, Stephen Lynch, and William Keating require disambiguation
suffixes in their Wikipedia URLs.

### MA State Executives (6)
Source priority:
1. Official MA.gov executive pages (government work — public domain)
2. Wikipedia infobox (cc_by_sa)

MA.gov pages:
- Healey: https://www.mass.gov/orgs/office-of-the-governor
- Driscoll: https://www.mass.gov/orgs/office-of-the-lieutenant-governor
- Campbell: https://www.mass.gov/orgs/office-of-the-attorney-general
- Goldberg: https://www.mass.gov/orgs/office-of-state-treasurer-and-receiver-general-deborah-b-goldberg
- DiZoglio: https://www.mass.gov/orgs/office-of-the-state-auditor
- Galvin: https://www.mass.gov/orgs/office-of-the-secretary-of-the-commonwealth-william-francis-galvin

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| TX migration 103: no idempotency guards | Phase 40: WHERE NOT EXISTS + ON CONFLICT | Phase 40 is safe to re-run |
| TX migration 107: separate office_id back-fill migration | Phase 40: back-fill not needed — politicians.office_id is set via trigger or not needed if profile page reads via offices join | Check if office_id needs back-fill (see open questions) |

---

## Open Questions

1. **Do politicians.office_id need back-filling after the insert?**
   - What we know: TX migration 103 inserted politicians without office_id, then migration 107 back-filled. Profile pages likely join politicians → offices rather than using office_id directly.
   - What's unclear: Whether the essentials frontend reads politicians.office_id or joins offices.politician_id. If it joins, no back-fill needed.
   - Recommendation: Check the Phase 20 SUMMARY — if back-fill was needed there, plan a back-fill in migration 154 or 156. If not, skip it. Looking at Plan 20-01 objective, it says "politicians.office_id remained NULL. This caused profile pages to render without title/chamber." So yes — office_id back-fill IS required. Build it into the main migration rather than a separate one.

2. **Jim McGovern Wikipedia URL disambiguation**
   - What we know: Jim McGovern has a disambiguation page on Wikipedia (politician vs others).
   - What's unclear: Exact Wikipedia URL suffix.
   - Recommendation: Planner should specify `https://en.wikipedia.org/wiki/Jim_McGovern_(politician)` and verify at execution time.

3. **Bill Keating Wikipedia URL**
   - What we know: William Keating (MA-09) has multiple people sharing the name.
   - Recommendation: Use `https://en.wikipedia.org/wiki/William_Keating` and verify — his article is likely the top result given his prominence.

4. **Verify MA House reps for 2025 seat changes**
   - What we know: Wikipedia table shows 118th Congress; the 119th Congress started January 2025.
   - What's unclear: Whether any of the 9 seats changed hands in the November 2024 election.
   - Recommendation: At execution time, cross-check against house.gov current members for MA. The 9 names listed are likely accurate (all won in 2024) but require quick verification.

---

## Verification Queries

After migrations 154-156, run these to confirm:

```sql
-- 1. Confirm 6 MA executive politicians + offices
SELECT p.full_name, o.title, o.role_canonical, ch.name AS chamber
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE p.external_id BETWEEN -200010 AND -200001
  AND p.external_id != -200002
ORDER BY p.external_id;
-- Expected: 6 rows

-- 2. Confirm Warren + Markey
SELECT p.full_name, o.title, d.district_type, d.state
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id IN (-200101, -200102)
ORDER BY p.external_id;
-- Expected: 2 rows, district_type='NATIONAL_UPPER', state='MA'

-- 3. Confirm 9 MA House reps
SELECT p.full_name, o.title, d.geo_id, d.district_type
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -200209 AND -200201
ORDER BY d.geo_id;
-- Expected: 9 rows, geo_id 2501-2509

-- 4. Confirm role_canonical on Secretary + Treasurer offices
SELECT o.title, o.role_canonical
FROM essentials.offices o
WHERE o.role_canonical IS NOT NULL
  AND o.representing_state = 'MA';
-- Expected: 2 rows (secretary_of_state, treasurer)

-- 5. Confirm office_id back-fill (if implemented)
SELECT COUNT(*) FROM essentials.politicians
WHERE external_id BETWEEN -200209 AND -200001
  AND external_id != -200002
  AND office_id IS NULL;
-- Expected: 0 rows
```

---

## Sources

### Primary (HIGH confidence)
- Live DB query (psql): `SELECT external_id, full_name FROM essentials.politicians WHERE external_id BETWEEN -200010 AND -200000` — confirmed -200002 collision
- Live DB query (psql): `SELECT id, name, name_formal FROM essentials.chambers WHERE name ILIKE '%senate%'` — confirmed US Senate UUID 7cbe07bc
- Live DB query (psql): `SELECT id, name, name_formal FROM essentials.chambers WHERE name LIKE '%Massachusetts%'` — confirmed existing MA chambers
- Live DB query (psql): `SELECT id, name FROM essentials.governments WHERE name LIKE '%Massachusetts%'` — confirmed MA government UUID 85783e20
- Live DB query (psql): `SELECT geo_id, state, district_type, label, id FROM essentials.districts WHERE district_type IN ('NATIONAL_UPPER','NATIONAL_LOWER') AND state ILIKE 'MA'` — confirmed 9 NATIONAL_LOWER districts, 0 NATIONAL_UPPER
- `https://www.sec.state.ma.us/divisions/cis/government/constitutional-officers.htm` — official MA constitutional officers page; all 6 names + titles confirmed
- `https://en.wikipedia.org/wiki/Diana_DiZoglio` — confirmed "Massachusetts State Auditor" but constitutional title is "Auditor of the Commonwealth" (from Ballotpedia search result)
- `C:/EV-Accounts/backend/migrations/103_texas_state_federal_officials.sql` — TX executive/senator pattern (not idempotent — flagged)
- `C:/EV-Accounts/backend/migrations/150_ma_government_chambers.sql` — MA government UUID embedded in migration header

### Secondary (MEDIUM confidence)
- `https://en.wikipedia.org/wiki/Massachusetts%27s_congressional_districts` — 9 MA House reps confirmed by name and district
- WebSearch: Elizabeth Warren + Ed Markey confirmed as current MA US Senators (both active in 2025-2026)
- WebSearch (multiple sources): "Auditor of the Commonwealth" confirmed as constitutional title for DiZoglio's office
- Plan 20-02 action block — PIL crop+resize pattern (LANCZOS, 4:5, 600×750, q90)

### Tertiary (LOW confidence)
- WebSearch: MA House rep incumbents — names match 118th Congress; 119th Congress incumbencies need verification at execution time

---

## Metadata

**Confidence breakdown:**
- MA executive incumbents (names + titles): HIGH — verified from mass.gov official page
- MA federal officials (senators): HIGH — confirmed from official senate press releases
- MA federal officials (House reps): MEDIUM — Wikipedia 118th Congress; should verify 119th at execution
- External_id collision (-200002): HIGH — live DB confirmed
- Chamber/district/government UUIDs: HIGH — live DB confirmed
- Headshot sources: MEDIUM — Wikipedia paths suggested but need disambiguation verification at execution

**Research date:** 2026-05-16
**Valid until:** 2026-08-15 (incumbents stable until September 2026 primary; DiZoglio/Galvin/Goldberg all running for re-election but still seated; MA House reps likely unchanged)
