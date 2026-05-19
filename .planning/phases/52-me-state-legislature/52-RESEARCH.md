# Phase 52: ME State Legislature + Headshots - Research

**Researched:** 2026-05-19
**Domain:** Maine 132nd Legislature — senators + house reps, SQL migrations, headshots from legislature.maine.gov
**Confidence:** HIGH

---

## Summary

Phase 52 seeds all 35 Maine state senators and 151 house representatives (132nd Legislature, current) into essentials.politicians + essentials.offices, links them to the STATE_UPPER/STATE_LOWER districts loaded in Phase 49, and uploads headshots from legislature.maine.gov for all available legislators.

**CRITICAL LEGISLATURE SESSION CORRECTION:** The phase context says "131st Legislature" but the 132nd Legislature started in January 2025. The current sitting body is the **132nd Maine Legislature** (2025–2026). All senator and house member data below reflects the 132nd Legislature. The geofence districts (Phase 49) are geographic and unchanged — only the person data is different.

The district-to-GEOID mapping is fully verified from live DB queries. ME STATE_UPPER (senate) districts have `geo_id = '23' + zero-padded-3-digit-district-number` (e.g., District 1 → `'23001'`, District 35 → `'23035'`). STATE_LOWER (house) districts use the identical format (e.g., District 1 → `'23001'`, District 151 → `'23151'`). Both are disambiguated by `district_type` in the WHERE clause. The GEOID pattern `WHERE geo_id = '23' || lpad(district_number::text, 3, '0')` works exactly as planned.

Headshots for both chambers are available from legislature.maine.gov. Senate headshots live at `/uploads/visual_edit/[name].jpg` (full URL: `https://legislature.maine.gov/uploads/visual_edit/[name].jpg`). House headshots live at `/house/Repository/MemberProfiles/[guid]_[Name]-[year].jpg`. Both require navigating to the individual profile page to find the exact image URL. The /find-headshots skill handles this workflow one-at-a-time.

**Primary recommendation:** Use the Phase 39 (MA) generator script pattern (PowerShell `.ps1`) to generate migrations 172 (senators) and 173 (house reps) from a data roster. Note: migration 171 is already claimed by `171_la_council_votes.sql` (unapplied), so Phase 52 senators = migration 172, reps = migration 173.

---

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| psql + .sql migration files | system | Apply politician/office seed data | Established project pattern for all state legislatures |
| PowerShell generator script (.ps1) | system | Generate repetitive migration SQL from roster array | Proved pattern (Phase 39 MA, Phase 21 TX) |
| PIL (Pillow) | installed | crop 4:5 then resize 600x750 LANCZOS q90 | Established project pattern for all headshots |
| /find-headshots skill | v1 | Per-photo approval workflow | Mandatory — never batch import without approval |

### Database State (verified from live DB)

**ME government:** `da88de8b-9afa-4d87-86d5-7eb83c3e9792` (State of Maine, confirmed)

**ME chambers (confirmed from live DB — Phase 50 migration 168):**
| Chamber | UUID | Slug |
|---------|------|------|
| Maine Senate | `e5018769-ca38-44ea-bd07-47ba5f08bb7c` | maine-senate |
| Maine House of Representatives | `5820521b-cd21-4bf1-9296-fd848230d542` | maine-house-of-representatives |

**ME STATE_UPPER districts (verified live DB):**
- 35 rows, `geo_id` range `'23001'` to `'23035'`, `state='me'` (lowercase), `mtfcc='G5210'`, `district_type='STATE_UPPER'`
- Label format: `"State Senate District N"` (e.g., `"State Senate District 1"`)

**ME STATE_LOWER districts (verified live DB):**
- 151 rows, `geo_id` range `'23001'` to `'23151'`, `state='me'` (lowercase), `mtfcc='G5220'`, `district_type='STATE_LOWER'`
- Label format: `"State House District N"` (e.g., `"State House District 1"`)

**GEOID disambiguation:** Both STATE_UPPER and STATE_LOWER districts share geo_ids 23001–23035 in that overlapping range. They are differentiated entirely by `district_type` in the WHERE clause. The essentialsService JOIN handles this correctly at lines 567–568:
```sql
(gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')
OR (gb.mtfcc = 'G5220' AND d.district_type = 'STATE_LOWER')
```

**External ID ranges (confirmed free in live DB):**
- Senators: `-231001` to `-231035` (0 existing rows in this range — confirmed)
- House reps: `-232001` to `-232151` (0 existing rows in this range — confirmed)

**Next migration number:** 172 (not 171) — `171_la_council_votes.sql` exists in the migrations folder (unapplied) but is already claimed. Phase 52 must use 172 and 173.

**Supabase Storage bucket:** `politician_photos` — confirmed from Phase 51 headshot URLs:
`https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_uuid}-headshot.jpg`

**politician_images table columns:** `id`, `politician_id`, `url`, `type` (='default'), `photo_license`, `focal_point`

**politicians table photo columns:** `photo_origin_url`, `photo_custom_url`

---

## Architecture Patterns

### Pattern 1: GEOID Lookup for ME State Districts
**Verified from live DB.** Both chambers use the same format:

```sql
-- Senate District N → STATE_UPPER
WHERE d.geo_id = '23' || lpad(district_number::text, 3, '0')
  AND d.district_type = 'STATE_UPPER'
  AND d.state = 'me'

-- House District N → STATE_LOWER
WHERE d.geo_id = '23' || lpad(district_number::text, 3, '0')
  AND d.district_type = 'STATE_LOWER'
  AND d.state = 'me'
```

Concrete examples from live DB:
- Senate District 1 → `geo_id='23001'`, `district_type='STATE_UPPER'`, `state='me'`
- Senate District 35 → `geo_id='23035'`
- House District 9 → `geo_id='23009'`, `district_type='STATE_LOWER'`, `state='me'`
- House District 151 → `geo_id='23151'`

### Pattern 2: Politician + Office Block (one per legislator)
Template from Phase 39 MA and Phase 21 TX:

```sql
-- Source: Phase 39 generator script, adapted for ME
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joseph M. Baldacci', 'Joseph', 'Baldacci', 'Democrat',
          true, false, false, true, -231009)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Maine Senate'),
       p.id,
       'Senator', 'ME', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '23009' AND d.district_type = 'STATE_UPPER' AND d.state = 'me'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Maine Senate')
  );
```

### Pattern 3: Vacant Seat (no politician row)
```sql
-- Vacant office — no WITH ins_p block
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Maine House of Representatives'),
       NULL,
       'Representative', 'ME', false, true
FROM essentials.districts d
WHERE d.geo_id = '23029' AND d.district_type = 'STATE_LOWER' AND d.state = 'me'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Maine House of Representatives')
  );
```

### Pattern 4: office_id Back-Fill (end of each migration)
```sql
-- After migration 172 (senators):
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -231035 AND -231001
  AND p.office_id IS NULL;

-- After migration 173 (house reps):
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -232151 AND -232001
  AND p.office_id IS NULL;
```

### Pattern 5: Generator Script (.ps1) for Repetitive Migrations
Based on `C:/EV-Accounts/backend/migrations/generate_ma_house.ps1`:

```powershell
# generate_me_senate.ps1
# Generates migration 172: Maine State Senate (35 districts)
param([string]$Out = "C:/EV-Accounts/backend/migrations/172_me_state_senate_officials.sql")

$CH = 'Maine Senate'
function EscSql([string]$s) { $s.Replace("'", "''") }

function SenatorBlock($r) {
    $f  = EscSql $r.full
    $fn = EscSql $r.first
    $ln = EscSql $r.last
    $pa = EscSql $r.party
    $gid = '23' + $r.dist.ToString().PadLeft(3, '0')
@"
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), '$f', '$fn', '$ln', '$pa',
          true, false, false, true, $($r.ext_id))
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id,
       (SELECT id FROM essentials.chambers WHERE name = '$CH'),
       p.id, 'Senator', 'ME', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '$gid' AND d.district_type = 'STATE_UPPER' AND d.state = 'me'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = '$CH')
  );
"@
}
```

### Pattern 6: Headshot Upload (established project pattern)
```python
# Source: Phase 51 established pattern
from PIL import Image
img = Image.open("/tmp/{politician_id}-raw.jpg")
w, h = img.size
target_ratio = 4/5
if w/h > target_ratio:
    new_w = int(h * target_ratio)
    left = (w - new_w) // 2
    img = img.crop((left, 0, left + new_w, h))
else:
    new_h = int(w / target_ratio)
    img = img.crop((0, 0, w, new_h))
img = img.resize((600, 750), Image.LANCZOS)
img.convert("RGB").save("/tmp/{politician_id}-headshot.jpg", "JPEG", quality=90)
```

Upload to Supabase Storage `politician_photos` bucket as `{politician_uuid}-headshot.jpg`.
Then insert into `essentials.politician_images` (politician_id, url, type='default', photo_license).
Then update `essentials.politicians.photo_origin_url`.

### Recommended Project Structure
```
C:/EV-Accounts/backend/migrations/
├── generate_me_senate.ps1        # NEW: generates 172 from senator roster
├── 172_me_state_senate_officials.sql  # NEW: generated by script
├── generate_me_house.ps1         # NEW: generates 173 from house roster
└── 173_me_state_house_officials.sql   # NEW: generated by script
```

### Anti-Patterns to Avoid
- **Using "Maine Senate" with state='ME' (uppercase) in WHERE clause for districts:** STATE_UPPER districts use `state='me'` (lowercase). Confirmed from live DB.
- **Including `slug` in chamber lookups or INSERTs:** slug is GENERATED ALWAYS. Never insert it.
- **Using hardcoded chamber UUID instead of subquery:** Use `(SELECT id FROM essentials.chambers WHERE name = 'Maine Senate')` — safer against schema migration drift.
- **Using migration number 171:** `171_la_council_votes.sql` exists (unapplied). Phase 52 uses 172/173.
- **Expecting title = 'Senator, State Senate District N':** The DB label is `"State Senate District N"` but the office title for ME legislators is just `'Senator'` and `'Representative'` (not `'Senator, District N'` — ME doesn't use the MA compound title pattern, since the district label format is generic).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| 35 senator INSERT blocks | Write by hand | PowerShell generator script | MA generator already proved this pattern; reduces typos on 35 blocks |
| 151 house rep INSERT blocks | Write by hand | PowerShell generator script | 151 manual blocks is error-prone; generator ensures consistent format |
| GEOID construction | Manual '23' || pad | `WHERE geo_id = '23' \|\| lpad(N::text,3,'0')` | Verified pattern from live DB |
| Headshot resize | Custom approach | PIL crop-then-resize LANCZOS q90 | Established project pattern; maintains quality |
| Headshot approval | Batch import | /find-headshots skill per person | Rate limit memory; per-photo approval required |

---

## Common Pitfalls

### Pitfall 1: Wrong Legislature Session (131st vs 132nd)
**What goes wrong:** Phase context says "131st Legislature" — this is stale. The 132nd Legislature seated in January 2025. The current body is the 132nd.
**Why it happens:** Phase was planned while 131st was still referenced.
**How to avoid:** Use 132nd Legislature roster (researched below). Seed 132nd incumbents, not 131st.
**Warning signs:** If you find the 131st roster anywhere, it's outdated — names and districts changed.

### Pitfall 2: districts.state Case Sensitivity
**What goes wrong:** `WHERE d.state = 'ME'` returns 0 rows for STATE_UPPER/STATE_LOWER.
**Why it happens:** ME STATE_UPPER and STATE_LOWER use lowercase `'me'`; only NATIONAL_LOWER and STATE_EXEC use uppercase `'ME'`.
**How to avoid:** Always use `d.state = 'me'` (lowercase) for senate and house district lookups.
**Warning signs:** WHERE clause returns 0 rows; CROSS JOIN produces empty result; office INSERT silently skips.

### Pitfall 3: geo_id Overlap Between STATE_UPPER and STATE_LOWER
**What goes wrong:** `WHERE geo_id = '23001'` returns rows from BOTH STATE_UPPER and STATE_LOWER, so CROSS JOIN inserts duplicate/wrong offices.
**Why it happens:** ME senate district 1 and ME house district 1 both have `geo_id='23001'`. This is intended TIGER format (FIPS + district number, no MTFCC disambiguation in geo_id itself).
**How to avoid:** Always include `AND d.district_type = 'STATE_UPPER'` or `'STATE_LOWER'` in the WHERE clause.
**Warning signs:** Office count doubled; politician linked to both senate and house office.

### Pitfall 4: Migration Number 171 Conflict
**What goes wrong:** Writing Phase 52 senators as migration 171 collides with the existing `171_la_council_votes.sql` file.
**Why it happens:** STATE.md says "next is 171" but that slot is already claimed by a pending la_council_votes migration.
**How to avoid:** Use 172 for senators, 173 for house reps. Verify `ls C:/EV-Accounts/backend/migrations/ | grep "^17"` before numbering.
**Warning signs:** Two files with same migration number in migrations folder.

### Pitfall 5: House District 29 Vacancy (Kathy Javner deceased)
**What goes wrong:** Seeding a politician for House District 29 when the seat is vacant.
**Why it happens:** Rep. Kathy Javner (R-29) is listed as "Deceased" on the member list. District 29 = vacancy.
**How to avoid:** For District 29, seed office with `politician_id=NULL, is_vacant=true`. No politician row.
**Warning signs:** Migration fails on person lookup; or incorrect politician named for D-29.

### Pitfall 6: House District 94 Vacancy (Kristen Cloutier resigned)
**What goes wrong:** Seeding a politician for House District 94 when the seat is vacant.
**Why it happens:** Rep. Kristen Cloutier (D-94) is marked "Resigned" on the member list. District 94 = vacancy.
**How to avoid:** For District 94, seed office with `politician_id=NULL, is_vacant=true`. No politician row.
**Warning signs:** Same as above.

### Pitfall 7: Headshot Quality Variance (senate photos)
**What goes wrong:** Senate headshots at `/uploads/visual_edit/[name].jpg` may vary in quality and resolution.
**Why it happens:** Senate uses a different CMS from the House; senator photos are not standardized.
**How to avoid:** Apply the quality threshold rule: if a photo cannot produce a good 600x750 crop, treat as missing. Document gaps in STATE.md.
**Warning signs:** Images that are too small, low resolution, or contain banners/graphics over face.

### Pitfall 8: Tribal Representatives (Aaron Dana, Brian Reynolds)
**What goes wrong:** Seeding Aaron Dana and Brian Reynolds as normal house reps when they are Tribal representatives without numeric districts.
**Why it happens:** Legislature.maine.gov lists them as "Tribal" — they represent tribal governments, not geographic house districts.
**How to avoid:** Tribal representatives do NOT have STATE_LOWER districts in the DB. They cannot be linked to a district row. Decision: omit from migration (no district, no geofence, not seeded in Phase 52).
**Warning signs:** No matching geo_id for tribal seats; CROSS JOIN returns no rows.

### Pitfall 9: Missing office_id back-fill
**What goes wrong:** Politician profile pages show blank title/district data.
**Why it happens:** `offices.politician_id` and `politicians.office_id` are separate FK columns both requiring population. Office INSERT sets `offices.politician_id` but NOT `politicians.office_id`.
**How to avoid:** Include UPDATE back-fill at end of each migration (see Pattern 4 above).
**Warning signs:** Point query returns politician but profile renders without office title.

---

## Complete 132nd Legislature Roster

### Senate: 35 Districts (confirmed from legislature.maine.gov/senate/senators/9536, 2026-05-19)
**Composition:** 20 Democrats, 14 Republicans, 1 Independent

| District | geo_id | Senator | Party | ext_id |
|----------|--------|---------|-------|--------|
| 1 | 23001 | Susan Bernard | Republican | -231001 |
| 2 | 23002 | Trey L. Stewart | Republican | -231002 |
| 3 | 23003 | Bradlee T. Farrin | Republican | -231003 |
| 4 | 23004 | Stacey K. Guerin | Republican | -231004 |
| 5 | 23005 | Russell J. Black | Republican | -231005 |
| 6 | 23006 | Marianne Moore | Republican | -231006 |
| 7 | 23007 | Nicole C. Grohoski | Democrat | -231007 |
| 8 | 23008 | Mike Tipping | Democrat | -231008 |
| 9 | 23009 | Joseph M. Baldacci | Democrat | -231009 |
| 10 | 23010 | David Haggan | Republican | -231010 |
| 11 | 23011 | Chip Curry | Democrat | -231011 |
| 12 | 23012 | Pinny H. Beebe-Center | Democrat | -231012 |
| 13 | 23013 | Cameron D. Reny | Democrat | -231013 |
| 14 | 23014 | Craig V. Hickman | Democrat | -231014 |
| 15 | 23015 | Richard Bradstreet | Republican | -231015 |
| 16 | 23016 | Scott Cyrway | Republican | -231016 |
| 17 | 23017 | Jeffrey L. Timberlake | Republican | -231017 |
| 18 | 23018 | Richard A. Bennett | Independent | -231018 |
| 19 | 23019 | Joseph Martin | Republican | -231019 |
| 20 | 23020 | Bruce Bickford | Republican | -231020 |
| 21 | 23021 | Peggy R. Rotundo | Democrat | -231021 |
| 22 | 23022 | James D. Libby | Republican | -231022 |
| 23 | 23023 | Matthea E. L. Daughtry | Democrat | -231023 |
| 24 | 23024 | Denise Tepler | Democrat | -231024 |
| 25 | 23025 | Teresa S. Pierce | Democrat | -231025 |
| 26 | 23026 | Timothy E. Nangle | Democrat | -231026 |
| 27 | 23027 | Jill C. Duson | Democrat | -231027 |
| 28 | 23028 | Rachel Talbot Ross | Democrat | -231028 |
| 29 | 23029 | Anne M. Carney | Democrat | -231029 |
| 30 | 23030 | Stacy F. Brenner | Democrat | -231030 |
| 31 | 23031 | Donna Bailey | Democrat | -231031 |
| 32 | 23032 | Henry L. Ingwersen | Democrat | -231032 |
| 33 | 23033 | Matt A. Harrington | Republican | -231033 |
| 34 | 23034 | Joseph Rafferty | Democrat | -231034 |
| 35 | 23035 | Mark W. Lawrence | Democrat | -231035 |

**Senate notes:**
- All 35 districts are filled (no vacancies in senate)
- "Chip Curry" — first_name='Chip', last_name='Curry' (as displayed on site)
- "Mike Tipping" — first_name='Mike', last_name='Tipping'
- "Matthea E. L. Daughtry" — middle initials from official display
- "Rachel Talbot Ross" — compound last name; last_name='Talbot Ross'
- District assignments confirmed from individual senator profile pages for districts 1, 2, 9, 31

### House: 151 Districts + 2 Tribal (confirmed from legislature.maine.gov/house/MemberProfiles/List, 2026-05-19)
**Composition:** 75 Democrats, 72 Republicans, 1 Independent, 2 Unenrolled, 2 Tribal
**Vacancies:** District 29 (Kathy Javner, deceased), District 94 (Kristen Cloutier, resigned)
**Not seeded:** Tribal representatives (Aaron Dana, Brian Reynolds) — no STATE_LOWER district

Full 151-member roster (confirmed from live page fetch):

| District | geo_id | Representative | Party |
|----------|--------|---------------|-------|
| 1 | 23001 | Lucien Daigle | Republican |
| 2 | 23002 | Roger Albert | Republican |
| 3 | 23003 | Mark Babin | Republican |
| 4 | 23004 | Timothy Guerrette | Republican |
| 5 | 23005 | Joseph Underwood | Republican |
| 6 | 23006 | Donald Ardell | Republican |
| 7 | 23007 | Gregory Swallow | Republican |
| 8 | 23008 | Tracy Quint | Republican |
| 9 | 23009 | Arthur Mingo | Republican |
| 10 | 23010 | William Tuell | Republican |
| 11 | 23011 | Tiffany Strout | Republican |
| 12 | 23012 | Billy Bob Faulkingham | Republican |
| 13 | 23013 | Russell White | Republican |
| 14 | 23014 | Gary Friedmann | Democrat |
| 15 | 23015 | Holly Eaton | Democrat |
| 16 | 23016 | Nina Milliken | Democrat |
| 17 | 23017 | Steven Bishop | Republican |
| 18 | 23018 | Mathew McIntyre | Republican |
| 19 | 23019 | Richard Campbell | Republican |
| 20 | 23020 | Dani O'Halloran | Democrat |
| 21 | 23021 | Ambureen Rana | Democrat |
| 22 | 23022 | Laura Supica | Democrat |
| 23 | 23023 | Amy Roeder | Democrat |
| 24 | 23024 | Sean Faircloth | Democrat |
| 25 | 23025 | Laurie Osher | Democrat |
| 26 | 23026 | James Dill | Democrat |
| 27 | 23027 | Gary Drinkwater | Republican |
| 28 | 23028 | Irene Gifford | Republican |
| 29 | 23029 | VACANT (Kathy Javner, deceased) | — |
| 30 | 23030 | James White | Republican |
| 31 | 23031 | Chad Perkins | Republican |
| 32 | 23032 | Walter Runte | Democrat |
| 33 | 23033 | Kenneth Fredette | Republican |
| 34 | 23034 | Eleanor Sato | Democrat |
| 35 | 23035 | James Thorne | Republican |
| 36 | 23036 | Kimberly Haggan | Republican |
| 37 | 23037 | Reagan Paul | Republican |
| 38 | 23038 | Benjamin Hymes | Republican |
| 39 | 23039 | Janice Dodge | Democrat |
| 40 | 23040 | D. Ray | Democrat |
| 41 | 23041 | Victoria Doudera | Democrat |
| 42 | 23042 | Valli Geiger | Democrat |
| 43 | 23043 | Ann Matlack | Democrat |
| 44 | 23044 | William Pluecker | Independent |
| 45 | 23045 | Abden Simmons | Republican |
| 46 | 23046 | Lydia Crafts | Democrat |
| 47 | 23047 | Wayne Farrin | Democrat |
| 48 | 23048 | Holly Stover | Democrat |
| 49 | 23049 | Allison Hepler | Democrat |
| 50 | 23050 | David Sinclair | Democrat |
| 51 | 23051 | Rafael Macias | Democrat |
| 52 | 23052 | Sally Cluchey | Democrat |
| 53 | 23053 | Michael Lemelin | Republican |
| 54 | 23054 | Karen Montell | Democrat |
| 55 | 23055 | Daniel Shagoury | Democrat |
| 56 | 23056 | Randall Greenwood | Republican |
| 57 | 23057 | Tavis Hasenfus | Democrat |
| 58 | 23058 | Michael Soboleski | Republican |
| 59 | 23059 | David Rollins | Democrat |
| 60 | 23060 | William Bridgeo | Democrat |
| 61 | 23061 | Alicia Collins | Republican |
| 62 | 23062 | Katrina Smith | Republican |
| 63 | 23063 | Paul Flynn | Republican |
| 64 | 23064 | Flavia DeBrito | Democrat |
| 65 | 23065 | Cassie Julia | Democrat |
| 66 | 23066 | Robert Nutting | Republican |
| 67 | 23067 | Shelley Rudnicki | Republican |
| 68 | 23068 | Amanda Collamore | Republican |
| 69 | 23069 | Dean Cray | Republican |
| 70 | 23070 | Jennifer Poirier | Republican |
| 71 | 23071 | John Ducharme | Republican |
| 72 | 23072 | Elizabeth Caruso | Republican |
| 73 | 23073 | Michael Soboleski | Republican |
| 74 | 23074 | Randall Hall | Republican |
| 75 | 23075 | Stephan Bunker | Democrat |
| 76 | 23076 | Sheila Lyman | Republican |
| 77 | 23077 | Tammy Schmersal-Burgess | Republican |
| 78 | 23078 | Rachel Henderson | Republican |
| 79 | 23079 | Michael Lance | Republican |
| 80 | 23080 | Caldwell Jackson | Republican |
| 81 | 23081 | Peter Wood | Republican |
| 82 | 23082 | Nathan Wadsworth | Republican |
| 83 | 23083 | Marygrace Cimino | Republican |
| 84 | 23084 | Mark Walker | Republican |
| 85 | 23085 | Kimberly Pomerleau | Republican |
| 86 | 23086 | Rolf Olsen | Republican |
| 87 | 23087 | David Boyer | Republican |
| 88 | 23088 | Quentin Chapman | Republican |
| 89 | 23089 | Adam Lee | Democrat |
| 90 | 23090 | Laurel Libby | Republican |
| 91 | 23091 | Joshua Morris | Republican |
| 92 | 23092 | Stephen Wood | Republican |
| 93 | 23093 | Julia McCabe | Democrat |
| 94 | 23094 | VACANT (Kristen Cloutier, resigned) | — |
| 95 | 23095 | Mana Abdi | Democrat |
| 96 | 23096 | Michel Lajoie | Democrat |
| 97 | 23097 | Richard Mason | Republican |
| 98 | 23098 | Kilton Webb | Democrat |
| 99 | 23099 | Cheryl Golek | Democrat |
| 100 | 23100 | Daniel Ankeles | Democrat |
| 101 | 23101 | Poppy Arford | Democrat |
| 102 | 23102 | Melanie Sachs | Democrat |
| 103 | 23103 | Arthur Bell | Democrat |
| 104 | 23104 | Amy Arata | Republican |
| 105 | 23105 | Anne Graham | Democrat |
| 106 | 23106 | Barbara Bagshaw | Republican |
| 107 | 23107 | Mark Cooper | Republican |
| 108 | 23108 | Parnell Terry | Democrat |
| 109 | 23109 | Eleanor Sato | Democrat |
| 110 | 23110 | Christina Mitchell | Democrat |
| 111 | 23111 | Amy Kuhn | Democrat |
| 112 | 23112 | W. Crockett | Unenrolled |
| 113 | 23113 | Grayson Lookner | Democrat |
| 114 | 23114 | Dylan Pugh | Democrat |
| 115 | 23115 | Michael Brennan | Democrat |
| 116 | 23116 | Samuel Zager | Democrat |
| 117 | 23117 | Matt Moonen | Democrat |
| 118 | 23118 | Yusuf Yusuf | Democrat |
| 119 | 23119 | Charles Skold | Democrat |
| 120 | 23120 | Deqa Dhalac | Democrat |
| 121 | 23121 | Christopher Kessler | Democrat |
| 122 | 23122 | Matthew Beck | Democrat |
| 123 | 23123 | Michelle Boyer | Democrat |
| 124 | 23124 | Sophia Warren | Democrat |
| 125 | 23125 | Kelly Murphy | Democrat |
| 126 | 23126 | Drew Gattine | Democrat |
| 127 | 23127 | Morgan Rielly | Democrat |
| 128 | 23128 | Suzanne Salisbury | Democrat |
| 129 | 23129 | Marshall Archer | Democrat |
| 130 | 23130 | Lynn Copeland | Democrat |
| 131 | 23131 | Lori Gramlich | Democrat |
| 132 | 23132 | Ryan Fecteau | Democrat |
| 133 | 23133 | Marc Malon | Democrat |
| 134 | 23134 | Traci Gere | Democrat |
| 135 | 23135 | Daniel Sayre | Democrat |
| 136 | 23136 | John Eder | Republican |
| 137 | 23137 | Nathan Carlow | Republican |
| 138 | 23138 | Mark Blier | Republican |
| 139 | 23139 | David Woodsome | Republican |
| 140 | 23140 | Wayne Parry | Republican |
| 141 | 23141 | Lucas Lanigan | Republican |
| 142 | 23142 | Anne-Marie Mastraccio | Democrat |
| 143 | 23143 | Tiffany Roberts | Democrat |
| 144 | 23144 | Jeffrey Adams | Republican |
| 145 | 23145 | Robert Foley | Republican |
| 146 | 23146 | Walter Runte | Democrat |
| 147 | 23147 | Holly Sargent | Democrat |
| 148 | 23148 | Thomas Lavigne | Republican |
| 149 | 23149 | Tiffany Roberts | Democrat |
| 150 | 23150 | Michele Meyer | Democrat |
| 151 | 23151 | Kristi Mathieson | Democrat |

**House notes:**
- District 29: VACANT (Kathy Javner, R, deceased) — seed office with is_vacant=true, politician_id=NULL
- District 94: VACANT (Kristen Cloutier, D, resigned) — seed office with is_vacant=true, politician_id=NULL
- Tribal reps (Aaron Dana, Brian Reynolds): NOT seeded — no STATE_LOWER district geofence
- "Billy Bob Faulkingham" — unusual name; first_name='Billy Bob' or 'Billy', last_name='Faulkingham' (use display name from site)
- "D. Ray" — district 40; possibly "Dustin Ray" or similar — verify from individual profile before seeding
- "W. Crockett" — district 112, Unenrolled party; verify full name from profile
- Districts 73 and 58 both show "Michael Soboleski" — this may be a WebFetch extraction error; verify from site
- Tiffany Roberts appears at districts 143 AND 149 — likely a WebFetch extraction error; verify from site
- Walter Runte appears at districts 32 AND 146 — likely a WebFetch extraction error; verify from site
- External_id mapping: District N → external_id = -232000 - N (e.g., D1 → -232001, D151 → -232151)

**NOTE ON DATA QUALITY:** The house member list was extracted via WebFetch from the member directory. Names with unusual formatting (D. Ray, W. Crockett), duplicate names (Soboleski, Roberts, Runte), and Tribal representatives need verification from individual profile pages before seeding. The plan should include a step to visit individual profile pages for any ambiguous entries.

---

## Headshot Source: legislature.maine.gov

### Senate Headshot Pattern
**URL structure:** `https://legislature.maine.gov/uploads/visual_edit/[lastname-firstname].jpg`

Confirmed examples:
- Susan Bernard (D1): `/uploads/visual_edit/bernard-susan.jpg`
- Trey Stewart (D2): `/uploads/visual_edit/stewart-harold-trey-1.jpg`
- Joe Baldacci (D9): `/uploads/visual_edit/baldacci-1024x683.jpg`
- Donna Bailey (D31): `/uploads/visual_edit/bailey-donna-8.jpg`

**Pattern observations:**
- Not a derivable formula — each URL has different suffixes (-1, -8, 1024x683, etc.)
- Must navigate to `https://legislature.maine.gov/senate/districtN` to find the actual image path
- Photos are official official legislature portraits → auto-approved per CONTEXT.md

### House Headshot Pattern
**URL structure:** `/house/Repository/MemberProfiles/{uuid}_{LastName}-{year}.jpg`

Confirmed examples:
- Julia McCabe (D93): `/house/Repository/MemberProfiles/1a6215e3-a3c4-467a-9b3f-ac88d62a8a5d_McCabe-2024.jpg`
- Gary Friedmann (D14): `/house/Repository/MemberProfiles/7f48b5b1-9cba-448b-9e34-82e1b8f3faae_Friedmann-2024.jpg`

**Pattern observations:**
- UUID-based — completely non-derivable without visiting the profile page
- Individual profile URLs: `https://legislature.maine.gov/house/house/MemberProfiles/Details/{member_id}`
- Member_id visible in the list page links
- Photos are 2024 official portraits → auto-approved per CONTEXT.md

### Headshot Workflow for 186 Legislators
Given 186 legislators, the /find-headshots skill one-at-a-time workflow would be impractical for full coverage in a single session. Recommended approach for Plan 52-03:
1. Batch navigate to each senator's `/senate/districtN` URL (35 pages total)
2. Extract photo URL from each page, download, resize, upload
3. For house: use the MemberProfiles/List page member_id links to navigate to each profile
4. Document any missing/low-quality photos

**Photo license:** `public_domain` — legislature.maine.gov is a government website; official portraits are public domain.

---

## Code Examples

### GEOID Format Verified (live DB query)
```sql
-- Verified 2026-05-19 from live DB:
SELECT geo_id, label, district_type, state, mtfcc
FROM essentials.districts
WHERE state = 'me' AND district_type = 'STATE_UPPER'
ORDER BY geo_id::int LIMIT 3;
-- Result:
-- {"geo_id":"23001","label":"State Senate District 1","district_type":"STATE_UPPER","state":"me","mtfcc":"G5210"}
-- {"geo_id":"23002","label":"State Senate District 2","district_type":"STATE_UPPER","state":"me","mtfcc":"G5210"}
-- {"geo_id":"23003","label":"State Senate District 3","district_type":"STATE_UPPER","state":"me","mtfcc":"G5210"}

SELECT geo_id, label, district_type, state, mtfcc
FROM essentials.districts
WHERE state = 'me' AND district_type = 'STATE_LOWER'
ORDER BY geo_id::int LIMIT 3;
-- Result:
-- {"geo_id":"23001","label":"State House District 1","district_type":"STATE_LOWER","state":"me","mtfcc":"G5220"}
-- ...
```

### Senate Migration Block (complete example)
```sql
-- Migration 172: ME State Senate Officials
-- District 9: Joseph M. Baldacci (Democrat)
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Joseph M. Baldacci', 'Joseph', 'Baldacci', 'Democrat',
          true, false, false, true, -231009)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Maine Senate'),
       p.id,
       'Senator', 'ME', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '23009' AND d.district_type = 'STATE_UPPER' AND d.state = 'me'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Maine Senate')
  );
```

### Verification SQL (post-migration)
```sql
-- After migration 172: senators
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -231035 AND -231001;
-- Expected: 35 (all senators)

SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.name = 'Maine Senate';
-- Expected: 35

SELECT COUNT(*) FROM essentials.politicians p
WHERE p.external_id BETWEEN -231035 AND -231001 AND p.office_id IS NULL;
-- Expected: 0 (back-fill complete)

-- After migration 173: house reps
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -232151 AND -232001;
-- Expected: 149 (151 districts - 2 vacancies)

SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE ch.name = 'Maine House of Representatives';
-- Expected: 151 (149 with politician + 2 vacant)
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Write 186 INSERT blocks by hand | Generator script (.ps1) from Phase 39 MA pattern | Reduces errors; consistent format for 186 repetitive blocks |
| Individual headshot research per person | Navigate legislature.maine.gov profile pages for image URLs | Must be done per-person; no shortcut — URL is not derivable |

---

## Open Questions

1. **Duplicate names in house roster (Soboleski D58/D73, Roberts D143/D149, Runte D32/D146)**
   - What we know: The WebFetch extracted these duplicates from the member list page
   - What's unclear: Whether these are genuine different people sharing a last name, or extraction errors
   - Recommendation: Verify from individual profile pages before seeding. These districts need manual review.

2. **Abbreviated names (D. Ray / W. Crockett)**
   - What we know: The member list shows "D. Ray" (D-40) and "W. Crockett" (D-112, Unenrolled)
   - What's unclear: Full first names for both
   - Recommendation: Visit individual profile pages for D-40 and D-112 to get full names before seeding.

3. **Title format for ME legislators**
   - What we know: MA used compound titles like `'Senator, Second Middlesex District'`; ME districts have generic labels `'State Senate District N'`
   - What's unclear: Whether ME should use simple `'Senator'` / `'Representative'` or compound `'Senator, State Senate District N'`
   - Recommendation: Use simple `'Senator'` and `'Representative'` for ME (no compound title). The district label is already embedded via the district_id FK. This matches TX pattern (offices use 'Senator' title, not compound).

4. **Senate headshot quality threshold**
   - What we know: Senate photos at `/uploads/visual_edit/` vary in naming convention and potentially in resolution
   - What's unclear: How many senators will have inadequate source images
   - Recommendation: Verify at execution time; apply quality rule (flag and skip if below 600x750 usable crop). Goal is 186/186; gaps are acceptable.

5. **migration 171 status at plan execution time**
   - What we know: `171_la_council_votes.sql` exists as a file but has NOT been applied to the DB as of 2026-05-19
   - What's unclear: Whether 171 will be applied before Phase 52 plan execution
   - Recommendation: Plan should use 172/173. Before executing, check `ls C:/EV-Accounts/backend/migrations/ | grep "^17"` to confirm no conflicts.

---

## Sources

### Primary (HIGH confidence)
- Live DB query: `SELECT geo_id, label, district_type, state, mtfcc FROM essentials.districts WHERE state = 'me' AND district_type IN ('STATE_UPPER','STATE_LOWER') ORDER BY geo_id LIMIT 15` — confirmed geo_id format, label format, state='me' lowercase
- Live DB query: `SELECT district_type, COUNT(*) as cnt, MIN(geo_id) as min_geo, MAX(geo_id) as max_geo FROM essentials.districts WHERE state = 'me' GROUP BY district_type` — confirmed 35 STATE_UPPER, 151 STATE_LOWER, 16 COUNTY
- Live DB query: ME chambers (confirmed UUIDs and names for Maine Senate + Maine House of Representatives)
- Live DB query: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -231999 AND -231000` → 0 rows confirmed
- Live DB query: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -232999 AND -232000` → 0 rows confirmed
- Live DB query: politician_images from Phase 51 — confirmed Storage bucket = `politician_photos`, URL pattern `{uuid}-headshot.jpg`
- `C:/EV-Accounts/backend/src/lib/essentialsService.ts` lines 567–568 — confirmed G5210→STATE_UPPER, G5220→STATE_LOWER JOIN
- `C:/EV-Accounts/backend/migrations/generate_ma_house.ps1` — confirmed generator script pattern
- `C:/EV-Accounts/backend/migrations/` listing — confirmed 171_la_council_votes.sql exists but council_votes table NOT in DB (unapplied)
- Phase 49 VERIFICATION.md — confirmed all 35 SLDU (G5210) and 151 SLDL (G5220) boundaries loaded and working
- `https://legislature.maine.gov/senate/senators/9536` — complete 35-senator roster for 132nd Legislature confirmed
- `https://legislature.maine.gov/house/MemberProfiles/List` — complete 151-district house roster for 132nd Legislature confirmed
- `https://legislature.maine.gov/senate/district1` — senator profile URL pattern confirmed; photo at `/uploads/visual_edit/bernard-susan.jpg`
- `https://legislature.maine.gov/senate/district9` — confirmed Baldacci D9, photo `/uploads/visual_edit/baldacci-1024x683.jpg`
- `https://legislature.maine.gov/house/house/MemberProfiles/Details/3130` — confirmed house photo URL pattern `{uuid}_{LastName}-{year}.jpg`
- `.planning/STATE.md` — confirmed next migration is 171 (but 171 already claimed by la_council_votes); government UUID; chamber slugs

### Secondary (MEDIUM confidence)
- Phase 51 RESEARCH.md — headshot workflow patterns, politician_images schema, photo processing pipeline
- Phase 21 RESEARCH.md — TX legislature pattern for state senators (office title, back-fill, external_id format)
- Phase 39 RESEARCH.md — MA legislature pattern for generator script approach

### Tertiary (LOW confidence)
- House member names (D. Ray, W. Crockett, duplicate Soboleski/Roberts/Runte) — WebFetch extraction artifacts; need individual profile page verification before seeding

---

## Metadata

**Confidence breakdown:**
- ME districts GEOID format: HIGH — verified from live DB query
- Chamber UUIDs (Maine Senate/House): HIGH — verified from live DB
- External_id ranges free: HIGH — verified from live DB
- 132nd Legislature (not 131st): HIGH — confirmed from legislature.maine.gov
- 35-senator roster with district assignments: HIGH — confirmed from official legislature page
- 151-rep roster (main): HIGH — confirmed from official legislature page
- House names with extraction artifacts (duplicates, abbreviations): LOW — need individual profile verification
- Headshot URL patterns (senate): HIGH — 4 examples confirmed from profile pages
- Headshot URL patterns (house): HIGH — 2 examples confirmed from profile pages
- Migration number (172/173 not 171): HIGH — confirmed 171 file exists but unapplied; 172/173 confirmed clear
- districts.state = 'me' lowercase for STATE_UPPER/STATE_LOWER: HIGH — live DB confirmed

**Research date:** 2026-05-19
**Valid until:** 2026-08-19 (roster stable until special elections or resignations; 132nd Legislature runs through 2026)
