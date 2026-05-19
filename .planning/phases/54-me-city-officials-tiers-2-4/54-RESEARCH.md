# Phase 54: ME City Officials Tiers 2-4 - Research

**Researched:** 2026-05-19
**Domain:** Maine municipal government incumbents — Lewiston, Bangor, South Portland, Auburn, Biddeford
**Confidence:** HIGH (incumbents verified from official city websites; office titles verified from live migration 177 SQL)

---

## Summary

This phase seeds incumbents for Maine's 5 Tier 2 cities into the skeletal office rows already created by migration 177. All office rows exist with politician_id=NULL and is_vacant=true. The migration pattern is the same as Portland's migration 178: WITH ins_p AS (INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id) + UPDATE offices + fallback UPDATE + office_id back-fill.

The key research findings are: (1) exact incumbent names, seat titles, and emails verified from official city websites as of 2026-05-19; (2) the office title strings used in migration 177 (which the UPDATE WHERE clauses must match exactly); (3) a confirmed external_id prefix scheme resolving the Bangor/Auburn 4-digit collision; (4) NO Tier 2 city uses RCV; (5) Biddeford has a separate Mayor office (not on the council) and the Bangor "Mayor" is council-selected Chair; (6) South Portland's Mayor (Tipton) holds BOTH a Mayor office AND District 5 council office - requiring two office UPDATEs for one person.

**Primary recommendation:** Use the Portland migration 178 CTE pattern. Apply migration 180 for Lewiston + Bangor + South Portland, and migration 181 for Auburn + Biddeford + GAPS.md creation. Use 5-digit geo_id prefix for all Tier 2 cities to ensure uniqueness.

---

## Verified Incumbents

### 1. Lewiston (geo_id=2338740)
**Source:** https://www.lewistonmaine.gov/105/Mayor-City-Council + https://www.lewistonmaine.gov/1346/Elected-Officials-and-City-Ward-Map  
**Confidence:** HIGH — official city website, direct page fetch

| Title in DB | Full Name | Email | Notes |
|-------------|-----------|-------|-------|
| Mayor | Carl L. Sheline | Not found on council page | Term: Jan 2, 2024–Jan 4, 2027 |
| Council Member (Ward 1) | Joshua L. Nagine | jnagine@lewistonmaine.gov | Verified |
| Council Member (Ward 2) | Susan G. Longchamps | Not found | — |
| Council Member (Ward 3) | Scott A. Harriman | sharriman@lewistonmaine.gov | Verified; also represents city on School Committee |
| Council Member (Ward 4) | Michael R. Roy | Not found | — |
| Council Member (Ward 5) | Chrissy Noble | Not found | — |
| Council Member (Ward 6) | David B. Chittim | Not found | City Council President |
| Council Member (Ward 7) | Bret Martel | Not found | — |

**RCV:** No (confirmed — no mention on official site; Maine RCV local municipal use is only Portland and Westbrook as of 2026)  
**Seat count:** 8 (Mayor on-council + 7 ward councilors) — matches migration 177 (8 office rows)  
**Email availability:** Only Wards 1 and 3 confirmed via direct page fetch; other ward pages returned 404. General contact: publiccomments@lewistonmaine.gov (forwards to all).  
**Individual profile pages exist** at /1340 (Ward 1), /1341 (Ward 2), /1184 (Ward 3), /1342 (Ward 4), /1421 (Ward 5), /1344 (Ward 6), /1419 (Ward 7), /1182 (Mayor). Email hunt required per-page.

**Mayor email research note:** Mayor Carl Sheline profile at /1182/ returned 404 during research. The general contact route is city hall at 207-513-3121. Plan should instruct executor to try /1182/Mayor-Carl-L-Sheline or city staff directory.

---

### 2. Bangor (geo_id=2302795)
**Source:** https://www.bangormaine.gov/446/City-Council  
**Confidence:** HIGH — official city website, direct page fetch with full email list

| Title in DB | Full Name | Email | Notes |
|-------------|-----------|-------|-------|
| Mayor | Susan Hawes | susan.hawes@bangormaine.gov | Council Chair = "Mayor"; is_appointed_position=true in DB |
| Council Member (At-Large 1) | Michael Beck | michael.beck@bangormaine.gov | — |
| Council Member (At-Large 2) | Daniel Carson | daniel.carson@bangormaine.gov | Newly elected Nov 2025 |
| Council Member (At-Large 3) | Susan Deane | susan.deane@bangormaine.gov | — |
| Council Member (At-Large 4) | Susan Faloon | Susan.Faloon@bangormaine.gov | Newly elected Nov 2025; note capital S.F |
| Council Member (At-Large 5) | Carolyn Fish | carolyn.fish@bangormaine.gov | — |
| Council Member (At-Large 6) | Joseph Leonard | joseph.leonard@bangormaine.gov | — |
| Council Member (At-Large 7) | Wayne Mallar | wayne.mallar@bangormaine.gov | — |
| Council Member (At-Large 8) | Angela Walker | angela.walker@bangormaine.gov | Newly elected Nov 2025 |

**RCV:** No  
**Seat count:** 9 total (Mayor/Chair + 8 at-large) — matches migration 177 (9 office rows)  
**Email availability:** ALL 9 emails confirmed from official city council page. FULL EMAIL HARVEST COMPLETE.  
**Photos:** Photos available for all 9 members on bangormaine.gov/446/City-Council  
**Mayor model:** Council-selected Chair. DB already has is_appointed_position=true on 'Mayor' office. Consistent.  
**Ordering note:** At-large seat numbers (1-8) in DB are arbitrary from migration 177. Assign in the order: Beck=AL1, Carson=AL2, Deane=AL3, Faloon=AL4, Fish=AL5, Leonard=AL6, Mallar=AL7, Walker=AL8 (alphabetical by last name, consistent with Portland precedent).

---

### 3. South Portland (geo_id=2371990)
**Source:** https://www.southportland.gov/411/City-Council + https://www.southportland.gov/directory.aspx?did=39  
**Confidence:** HIGH — official city website

| Title in DB | Full Name | Email | Notes |
|-------------|-----------|-------|-------|
| Mayor | Elyse Tipton | Not listed individually | Council-selected; ALSO holds District 5 seat — see CRITICAL NOTE |
| Council Member (District 1) | Carter Scott | Not listed individually | Newly installed Dec 2025 |
| Council Member (District 2) | Rachael Coleman | Not listed individually | — |
| Council Member (District 3) | Misha C. Pride | Not listed individually | — |
| Council Member (District 4) | Jessica L. Walker | Not listed individually | — |
| Council Member (District 5) | Elyse Tipton | Not listed individually | SAME PERSON as Mayor |
| Council Member (At-Large 1) | Richard T. Matthews | Not listed individually | Newly installed Dec 2025 |
| Council Member (At-Large 2) | Natalie West | Not listed individually | Newly installed Dec 2025 |

**CRITICAL NOTE — Dual-office for Tipton:**  
Elyse Tipton is District 5 councilor who was elected by council peers as Mayor for 2025-2026. The DB has 8 office rows: 1 Mayor + 5 District + 2 At-Large. Tipton must be seeded in BOTH 'Mayor' (is_appointed_position=true) and 'Council Member (District 5)'. The dual-office-per-politician pattern is established (unique index on offices.politician_id was dropped in migration 159). Both offices should get politician_id=Tipton's UUID and office_id back-filled to one of the two offices (use the Mayor office for office_id since that's her primary title).

**RCV:** No  
**Seat count:** 8 office rows (1 Mayor + 5 District + 2 At-Large) — 7 physical people (Tipton counted twice)  
**Email availability:** No individual emails on public directory. General: citycouncil@southportland.gov or city clerk jhughes@southportland.gov 207-767-7601. Individual email hunt requires /directory.aspx?eid=[N] per member.  
**Photos:** Photos visible on council page for all 7 members.  
**Contact email:** citycouncil@southportland.gov (single collective address — do not seed individual emails unless individual pages confirm them)

---

### 4. Auburn (geo_id=2302060)
**Source:** https://www.auburnmaine.gov/government/city_council/index.php + https://www.auburnmaine.gov/government/mayor.php  
**Confidence:** HIGH — official city website with full email list

| Title in DB | Full Name | Email | Notes |
|-------------|-----------|-------|-------|
| Mayor | Jeffrey D. Harmon | jharmon@auburnmaine.gov | Sworn Dec 11, 2025; photo on mayor page |
| Council Member (Ward 1) | Rachel B. Randall | rrandall@auburnmaine.gov | — |
| Council Member (Ward 2) | Timothy M. Cowan | tcowan@auburnmaine.gov | — |
| Council Member (Ward 3) | Mathieu Duvall | mduvall@auburnmaine.gov | Replaced Stephen G. Milks (Nov 2025 meeting packet had Milks; website is authoritative) |
| Council Member (Ward 4) | Kelly Butler | kbutler@auburnmaine.gov | Replaced Benjamin J. Weisner |
| Council Member (Ward 5) | Leroy G. Walker, Sr. | lwalker@auburnmaine.gov | — |
| Council Member (At-Large 1) | Belinda A. Gerry | bgerry@auburnmaine.gov | — |
| Council Member (At-Large 2) | Adam R. Platz | aplatz@auburnmaine.gov | — |

**IMPORTANT CORRECTION — Ward 3 and 4:** The November 2025 meeting packet showed Milks (W3) and Weisner (W4). The LIVE WEBSITE as of 2026-05-19 shows Duvall (W3) and Butler (W4). The official website is authoritative — use Duvall and Butler. The election that brought them in was likely November 2025.  
**RCV:** No  
**Seat count:** 8 (Mayor + 5 Ward + 2 At-Large) — matches migration 177  
**Email availability:** ALL 8 emails confirmed from official city website. FULL EMAIL HARVEST COMPLETE.  
**Photos:** "Read More" links per member suggest photos on individual pages (mayor page confirmed has photo). Verify individual ward pages during Plan 54-03.

---

### 5. Biddeford (geo_id=2304860)
**Source:** https://www.biddefordmaine.org/2437/City-Council + https://www.biddefordmaine.org/2276/Office-of-the-Mayor  
**Confidence:** HIGH — official city website

| Title in DB | Full Name | Email | Notes |
|-------------|-----------|-------|-------|
| Mayor | Liam LaFountain | liam.lafountain@biddefordmaine.org | Sworn Dec 2, 2025; separate executive role; photo on mayor page |
| Council Member (Ward 1) | Patricia Boston | Not listed | — |
| Council Member (Ward 2) | Abigail Woods | Not listed | — |
| Council Member (Ward 3) | Roger Beaupre | Not listed | Council President |
| Council Member (Ward 4) | Dylan Doughty | Not listed | — |
| Council Member (Ward 5) | David Kurtz | Not listed | — |
| Council Member (Ward 6) | Jake Pierson | Not listed | — |
| Council Member (Ward 7) | Brad Cote | Not listed | — |
| Council Member (At-Large 1) | Marc Lessard | Not listed | — |
| Council Member (At-Large 2) | Lisa Vadnais | Not listed | — |

**IMPORTANT STRUCTURAL NOTE — Biddeford Mayor model:**  
The Biddeford mayor is a SEPARATE EXECUTIVE POSITION (not on-council). The mayor presides at council meetings but only votes on ties. This is a weak-mayor/strong-council model. HOWEVER, migration 177 already created a 'Mayor' office row in Biddeford's 'City Council' chamber (official_count=10). Since the office row already exists in the DB with that structure, Phase 54 should seed LaFountain into it as-is. Do NOT attempt to restructure the chamber in Phase 54 — that would be a separate corrective migration outside scope. Seat LaFountain in 'Mayor' within the City Council chamber.  
**RCV:** No  
**Seat count:** 10 office rows (1 Mayor + 7 Ward + 2 At-Large) — matches migration 177  
**Email availability:** Only Mayor's email confirmed (liam.lafountain@biddefordmaine.org). Council member directory shows phone numbers but no emails. Individual profile links exist at /directory.aspx?eid=[N]. The context decision is "email only if listed on city website" — hunt individual profiles during execution.  
**Photos:** Photos NOT visible on main council page (names are hyperlinks to individual profiles). Photos may exist on individual /directory.aspx?eid=[N] pages. Mayor page confirmed has photo.

---

## RCV Status — All 5 Tier 2 Cities

| City | RCV Used | Source |
|------|----------|--------|
| Lewiston | NO | Official website — no mention; Maine municipal RCV limited to Portland + Westbrook |
| Bangor | NO | Official website — at-large plurality; Nov 2025 election confirmed no RCV |
| South Portland | NO | Official website — standard plurality |
| Auburn | NO | Official website — council-manager form, no RCV mention |
| Biddeford | NO | Official website — no RCV; mayor won by plurality Nov 2025 |

**Action required:** Set no election_method override on any Tier 2 city chambers. Leave the default (whatever migration 177 set — it omitted election_method, which defaults to NULL/plurality).

---

## Office Title Strings from Migration 177

These are the EXACT title strings used in office INSERT statements in `177_me_cities_scaffolding.sql`. The Phase 54 migration UPDATE WHERE clauses must match these byte-for-byte.

### Lewiston ('City Council' chamber, 8 offices)
```
'Mayor'
'Council Member (Ward 1)'
'Council Member (Ward 2)'
'Council Member (Ward 3)'
'Council Member (Ward 4)'
'Council Member (Ward 5)'
'Council Member (Ward 6)'
'Council Member (Ward 7)'
```

### Bangor ('City Council' chamber, 9 offices)
```
'Mayor'
'Council Member (At-Large 1)'
'Council Member (At-Large 2)'
'Council Member (At-Large 3)'
'Council Member (At-Large 4)'
'Council Member (At-Large 5)'
'Council Member (At-Large 6)'
'Council Member (At-Large 7)'
'Council Member (At-Large 8)'
```

### South Portland ('City Council' chamber, 8 offices)
```
'Mayor'
'Council Member (District 1)'
'Council Member (District 2)'
'Council Member (District 3)'
'Council Member (District 4)'
'Council Member (District 5)'
'Council Member (At-Large 1)'
'Council Member (At-Large 2)'
```

### Auburn ('City Council' chamber, 8 offices)
```
'Mayor'
'Council Member (Ward 1)'
'Council Member (Ward 2)'
'Council Member (Ward 3)'
'Council Member (Ward 4)'
'Council Member (Ward 5)'
'Council Member (At-Large 1)'
'Council Member (At-Large 2)'
```

### Biddeford ('City Council' chamber, 10 offices)
```
'Mayor'
'Council Member (Ward 1)'
'Council Member (Ward 2)'
'Council Member (Ward 3)'
'Council Member (Ward 4)'
'Council Member (Ward 5)'
'Council Member (Ward 6)'
'Council Member (Ward 7)'
'Council Member (At-Large 1)'
'Council Member (At-Large 2)'
```

**Source:** Read directly from `C:/EV-Accounts/backend/migrations/177_me_cities_scaffolding.sql`  
**Confidence:** HIGH — primary source

---

## External ID Prefix Scheme

### Problem: Bangor/Auburn Collision at 4-Digit Level

The Portland pattern uses 4-digit geo_id prefix:
- Portland (2360545): prefix=2360 → IDs -23601001 through -23601018

At 4 digits: Bangor (2302795) and Auburn (2302060) both produce prefix **2302** — COLLISION.

### Resolution: Use 5-Digit Prefix for All Tier 2 Cities

Using 5-digit prefix from geo_id consistently for all Tier 2 cities:

| City | geo_id | 5-digit prefix | First external_id | Max range (20 officials) |
|------|--------|----------------|-------------------|--------------------------|
| Lewiston | 2338740 | 23387 | -233871001 | -233871001 to -233871020 |
| Bangor | 2302795 | 23027 | -230271001 | -230271001 to -230271020 |
| South Portland | 2371990 | 23719 | -237191001 | -237191001 to -237191020 |
| Auburn | 2302060 | 23020 | -230201001 | -230201001 to -230201020 |
| Biddeford | 2304860 | 23048 | -230481001 | -230481001 to -230481020 |

**Collision check (5-digit prefixes):** 23387, 23027, 23719, 23020, 23048 — all unique.

**Collision check against existing namespaces:**
- ME executives: -230001 to -230004 (6-digit) — no overlap
- ME senators: -231001 to -231035 (6-digit) — no overlap
- ME house: -232001 to -232151 (6-digit) — no overlap
- ME federal: -230101, -230102, -230201, -230202 (6-digit) — no overlap
- Portland city: -23601001 to -23601018 (8-digit) — no overlap
- Tier 2 cities: 9-digit range — no overlap with any existing

**Formula:** external_id = -(int(geo_id[:5]) * 10000 + seq) where seq starts at 1001 and increments by 1

### Seat Ordering Recommendations

For cities with only at-large or only ward seats, use alphabetical-by-last-name ordering within each type (consistent with Portland precedent):

**Lewiston seat → external_id mapping:**
```
-233871001  Mayor: Carl L. Sheline
-233871002  Ward 1: Joshua L. Nagine
-233871003  Ward 2: Susan G. Longchamps
-233871004  Ward 3: Scott A. Harriman
-233871005  Ward 4: Michael R. Roy
-233871006  Ward 5: Chrissy Noble
-233871007  Ward 6: David B. Chittim
-233871008  Ward 7: Bret Martel
```

**Bangor seat → external_id mapping:**
```
-230271001  Mayor/Chair: Susan Hawes
-230271002  At-Large 1: Michael Beck
-230271003  At-Large 2: Daniel Carson
-230271004  At-Large 3: Susan Deane
-230271005  At-Large 4: Susan Faloon
-230271006  At-Large 5: Carolyn Fish
-230271007  At-Large 6: Joseph Leonard
-230271008  At-Large 7: Wayne Mallar
-230271009  At-Large 8: Angela Walker
```

**South Portland seat → external_id mapping:**
```
-237191001  Mayor: Elyse Tipton (also District 5)
-237191002  District 1: Carter Scott
-237191003  District 2: Rachael Coleman
-237191004  District 3: Misha C. Pride
-237191005  District 4: Jessica L. Walker
-237191006  District 5: Elyse Tipton (same politician as Mayor — see dual-office note)
-237191007  At-Large 1: Richard T. Matthews
-237191008  At-Large 2: Natalie West
```

**Auburn seat → external_id mapping:**
```
-230201001  Mayor: Jeffrey D. Harmon
-230201002  Ward 1: Rachel B. Randall
-230201003  Ward 2: Timothy M. Cowan
-230201004  Ward 3: Mathieu Duvall
-230201005  Ward 4: Kelly Butler
-230201006  Ward 5: Leroy G. Walker, Sr.
-230201007  At-Large 1: Belinda A. Gerry
-230201008  At-Large 2: Adam R. Platz
```

**Biddeford seat → external_id mapping:**
```
-230481001  Mayor: Liam LaFountain
-230481002  Ward 1: Patricia Boston
-230481003  Ward 2: Abigail Woods
-230481004  Ward 3: Roger Beaupre
-230481005  Ward 4: Dylan Doughty
-230481006  Ward 5: David Kurtz
-230481007  Ward 6: Jake Pierson
-230481008  Ward 7: Brad Cote
-230481009  At-Large 1: Marc Lessard
-230481010  At-Large 2: Lisa Vadnais
```

---

## Migration Structure

### Migration 180: Lewiston + Bangor + South Portland

**File:** `C:/EV-Accounts/backend/migrations/180_me_tier2_cities_a.sql`

Contains 3 city blocks, each following the Portland migration 178 CTE pattern:

```sql
BEGIN;

-- === LEWISTON (8 officials: Mayor + Ward 1-7) ===
-- external_ids -233871001..-233871008
-- government: geo_id='2338740', chamber: 'City Council'
-- UPDATE offices WHERE title = 'Mayor' / 'Council Member (Ward N)'
-- office_id back-fill: BETWEEN -233871008 AND -233871001

-- === BANGOR (9 officials: Chair=Mayor + At-Large 1-8) ===
-- external_ids -230271001..-230271009
-- government: geo_id='2302795', chamber: 'City Council'
-- UPDATE offices WHERE title = 'Mayor' / 'Council Member (At-Large N)'
-- office_id back-fill: BETWEEN -230271009 AND -230271001

-- === SOUTH PORTLAND (8 officials for 7 people: Mayor + District 1-5 + At-Large 1-2) ===
-- external_ids -237191001..-237191008
-- SPECIAL: Tipton gets -237191001 (Mayor) AND -237191006 (District 5)
-- Two INSERT CTEs for Tipton are not needed — only one politician row per person
-- Tipton politician INSERT: external_id=-237191001
-- Office UPDATE for 'Mayor' title -> Tipton
-- Office UPDATE for 'Council Member (District 5)' title -> Tipton (same politician_id)
-- Other 6 politicians get one office each
-- office_id back-fill: Tipton's office_id should point to the Mayor office

COMMIT;
```

**South Portland dual-office pattern (Tipton):**
```sql
-- Insert Tipton ONCE with external_id=-237191001
WITH ins_tipton AS (
  INSERT INTO essentials.politicians (id, full_name, ..., external_id)
  VALUES (gen_random_uuid(), 'Elyse Tipton', ..., -237191001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
),
tipton_id AS (
  SELECT id FROM ins_tipton
  UNION ALL
  SELECT id FROM essentials.politicians WHERE external_id = -237191001
  LIMIT 1
)
-- Update Mayor office
UPDATE essentials.offices o
SET politician_id = (SELECT id FROM tipton_id), is_vacant = false
FROM essentials.chambers ch, essentials.governments g
WHERE o.chamber_id = ch.id AND ch.government_id = g.id
  AND g.geo_id = '2371990' AND ch.name = 'City Council'
  AND o.title = 'Mayor' AND o.politician_id IS NULL;

-- Update District 5 office for same politician
UPDATE essentials.offices o
SET politician_id = (SELECT id FROM essentials.politicians WHERE external_id = -237191001),
    is_vacant = false
FROM essentials.chambers ch, essentials.governments g
WHERE o.chamber_id = ch.id AND ch.government_id = g.id
  AND g.geo_id = '2371990' AND ch.name = 'City Council'
  AND o.title = 'Council Member (District 5)' AND o.politician_id IS NULL;
```

**NOTE on -237191006:** Do NOT create a second politician row for Tipton's District 5 seat. The external_id -237191006 is RESERVED in the mapping table above for documentation purposes, but should NOT be inserted as a politician — Tipton already has -237191001. The District 5 office UPDATE uses Tipton's -237191001 UUID directly.

### Migration 181: Auburn + Biddeford + GAPS.md

**File:** `C:/EV-Accounts/backend/migrations/181_me_tier2_cities_b.sql`

Contains 2 city blocks (Auburn + Biddeford), same pattern as migration 180.

**GAPS.md creation:** GAPS.md is a planning artifact, not a DB migration. Create it as a file in `.planning/phases/54-me-city-officials-tiers-2-4/GAPS.md` during Plan 54-02 execution.

---

## Architecture Patterns

### CTE Pattern (from migration 178 — Portland precedent)

```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Carl L. Sheline', 'Carl', 'Sheline', NULL,
          true, false, false, true, -233871001)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
UPDATE essentials.offices o
SET politician_id = COALESCE(o.politician_id, (SELECT id FROM ins_p)),
    is_vacant = false
FROM essentials.chambers ch
JOIN essentials.governments g ON ch.government_id = g.id
WHERE o.chamber_id = ch.id
  AND g.geo_id = '2338740'
  AND ch.name = 'City Council'
  AND o.title = 'Mayor';

-- Fallback UPDATE (if politician already existed, ins_p returned no row)
UPDATE essentials.offices o
SET politician_id = p.id, is_vacant = false
FROM essentials.politicians p,
     essentials.chambers ch,
     essentials.governments g
WHERE p.external_id = -233871001
  AND o.chamber_id = ch.id
  AND ch.government_id = g.id
  AND g.geo_id = '2338740'
  AND ch.name = 'City Council'
  AND o.title = 'Mayor'
  AND o.politician_id IS NULL;
```

### Office_id Back-fill Pattern

```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -233871008 AND -233871001
  AND p.office_id IS NULL;
```

**Important for Tipton (South Portland dual-office):** The back-fill WHERE clause targets her external_id=-237191001 only once. The office_id should be set to the Mayor office (her primary title).

### Script vs Hand-write Decision

The CONTEXT.md leaves this as Claude's discretion. Recommendation: **hand-write SQL** (same as Portland migration 178 rationale). Lewiston=8, Bangor=9, South Portland=7-unique-people-in-8-offices, Auburn=8, Biddeford=10. Total ~43 CTE blocks across two migrations. This is manageable inline SQL without a generator script. Generators add complexity for a one-time migration.

---

## Headshot Availability

### Lewiston
- **Individual profile pages exist** for each councilor at lewistonmaine.gov (pattern: /13XX/)
- Ward 3 Scott Harriman page confirmed has a circular headshot photo
- Ward 1 Joshua Nagine page confirmed has a circular headshot photo
- Other ward pages returned 404 during research (may have different URL pattern)
- **Search required per ward** to find correct URLs; try the /1346 page which lists all links
- All profile links confirmed from /1346: Mayor=/1182, W1=/1340, W2=/1341, W3=/1184, W4=/1342, W5=/1421, W6=/1344, W7=/1419
- **Photo format:** "Ward N [Name] Circle" — circular crop headshots (official city website)
- **Confidence:** MEDIUM — 2 of 8 confirmed, others inferred from same website pattern

### Bangor
- **Photos confirmed for all 9 members** on bangormaine.gov/446/City-Council
- Individual profile pages at /directory.aspx?eid=[N]
- **Confidence:** HIGH — confirmed from official page fetch

### South Portland
- **Photos visible for all 7 members** on southportland.gov/411/City-Council
- Individual bio pages via "More Information" links
- **Confidence:** HIGH — confirmed from official page fetch

### Auburn
- Mayor Jeff Harmon page (auburnmaine.gov/government/mayor.php) confirmed has professional headshot
- Individual councilor pages linked from council page (via "Read More")
- **Confidence:** MEDIUM for councilors (mayor confirmed only)

### Biddeford
- **NO photos on main council listing** (biddefordmaine.org/2437/City-Council)
- Mayor LaFountain page (biddefordmaine.org/2276/Office-of-the-Mayor) confirmed has photo
- Individual council member profiles at /directory.aspx?eid=[N] — photos may exist there
- **Confidence:** MEDIUM — photos uncertain for councilors; Mayor confirmed

---

## GAPS.md Structure

The GAPS.md file covers:
1. **Seeding gaps** within the 5 Tier 2 cities (specific offices where politician_id=NULL after migration)
2. **18 remaining cities** (all marked 'not attempted' per CONTEXT)
3. **Headshot gaps** for Tier 2 officials (column in city-level row or per-official column)

```markdown
# Phase 54 Coverage Gaps

**Last updated:** [date]

## Tier 2 City Seeding Gaps

| City | Title | Reason |
|------|-------|--------|
| Lewiston | Mayor | Email not found on official site — no email seeded |
| [city] | [title] | [reason if politician_id=NULL] |

## Tier 2 City Headshot Gaps

| City | Official | Status |
|------|----------|--------|
| [city] | [name] | source not found / found |

## Remaining 18 Cities — Coverage Status

| City | geo_id | Seeding Status | Headshot Status |
|------|--------|----------------|-----------------|
| Augusta | 2302100 | not attempted | not attempted |
| Saco | 2364675 | not attempted | not attempted |
| Westbrook | 2382105 | not attempted | not attempted |
| Sanford | 2365725 | not attempted | not attempted |
| Waterville | 2380740 | not attempted | not attempted |
| Brewer | 2306925 | not attempted | not attempted |
| Presque Isle | 2360825 | not attempted | not attempted |
| Bath | 2303355 | not attempted | not attempted |
| Ellsworth | 2323200 | not attempted | not attempted |
| Gardiner | 2327085 | not attempted | not attempted |
| Hallowell | 2330550 | not attempted | not attempted |
| Calais | 2309585 | not attempted | not attempted |
| Belfast | 2303950 | not attempted | not attempted |
| Old Town | 2355225 | not attempted | not attempted |
| Eastport | 2321730 | not attempted | not attempted |
| Rockland | 2363590 | not attempted | not attempted |
| Caribou | 2310565 | not attempted | not attempted |
| [18th city] | [geo_id] | not attempted | not attempted |
```

**Note:** Westbrook has RCV (both City Council and school committee). Augusta has a school chamber. These are structural facts established in migration 177 — no action needed in Phase 54 GAPS.md beyond 'not attempted'.

---

## Common Pitfalls

### Pitfall 1: Wrong Lewiston geo_id in CONTEXT.md
**What goes wrong:** The CONTEXT.md draft says "Lewiston geo_id=2341070" which is WRONG. The actual Lewiston geo_id is **2338740** (verified from live DB and STATE.md).  
**Prevention:** Always use geo_id=2338740 for Lewiston. Do not use 2341070.

### Pitfall 2: Title String Mismatch in UPDATE WHERE
**What goes wrong:** The UPDATE WHERE clause uses a slightly different title string than what migration 177 inserted, causing 0 rows updated (office stays vacant).  
**Prevention:** Use EXACTLY the strings from the migration 177 extraction above. Note parentheses style: 'Council Member (Ward 1)' not 'Council Member - Ward 1' or 'Ward 1 Council Member'.

### Pitfall 3: South Portland Tipton Dual-Office
**What goes wrong:** Creating two politician rows for Tipton (one per office) violates the one-person-one-row model. OR failing to update both office rows.  
**Prevention:** INSERT Tipton ONCE with external_id=-237191001. UPDATE both 'Mayor' and 'Council Member (District 5)' offices to point to her UUID.

### Pitfall 4: Bangor "Mayor" = Appointed Chair
**What goes wrong:** Setting is_appointed=false on Susan Hawes (treating her like an elected Mayor).  
**Prevention:** Migration 177 already set is_appointed_position=true on Bangor's Mayor office. The politician row INSERT should use is_appointed=false (politicians.is_appointed reflects whether the politician was appointed to office — Hawes was elected to the council and then elected as Chair by peers, so is_appointed on the POLITICIAN row is false). The OFFICE row's is_appointed_position=true is what was already set by migration 177.

### Pitfall 5: Biddeford Council President ≠ Mayor
**What goes wrong:** Treating Roger Beaupre (Council President/Ward 3) as the mayor because the council page shows him with that title.  
**Prevention:** Liam LaFountain is the separate elected Mayor. Roger Beaupre is Council President (a council-internal role, no separate DB office). Seed LaFountain as 'Mayor', Beaupre as 'Council Member (Ward 3)'.

### Pitfall 6: 4-Digit Prefix Collision for Bangor/Auburn
**What goes wrong:** Using 4-digit geo_id prefix gives both Bangor and Auburn prefix 2302, creating colliding external_ids.  
**Prevention:** Use 5-digit prefix for ALL Tier 2 cities per the scheme above.

### Pitfall 7: Absent Email = No Email Row
**What goes wrong:** Seeding an email field with the general city council address (citycouncil@southportland.gov) for individual officials.  
**Prevention:** CONTEXT.md decision: "email only if listed on city website." The general citycouncil@ address is not an individual's email — do not seed it on individual politician rows. Leave email=NULL if individual email not found.

### Pitfall 8: Auburn Ward 3/4 Wrong Incumbents
**What goes wrong:** Using November 2025 meeting packet names (Milks=Ward 3, Weisner=Ward 4) instead of current incumbents.  
**Prevention:** Use Duvall (Ward 3) and Butler (Ward 4) per the live official website. The meeting packet data was from before the November 2025 election.

---

## DB Pre-flight Verification Query

Before writing migrations 180/181, confirm the exact office titles and counts from the live DB:

```sql
SELECT g.name AS city, g.geo_id, o.title, o.is_vacant, o.politician_id, o.is_appointed_position
FROM essentials.offices o
JOIN essentials.chambers ch ON o.chamber_id = ch.id
JOIN essentials.governments g ON ch.government_id = g.id
WHERE g.geo_id IN ('2338740', '2302795', '2371990', '2302060', '2304860')
ORDER BY g.name, o.title;
```

Expected row counts:
- Lewiston (2338740): 8 council + 8 school committee = 16 total
- Bangor (2302795): 9 council = 9 total
- South Portland (2371990): 8 council = 8 total
- Auburn (2302060): 8 council = 8 total
- Biddeford (2304860): 10 council = 10 total

Also verify no existing politician_ids (all should be NULL pre-migration 180):
```sql
SELECT COUNT(*) FROM essentials.offices o
JOIN essentials.chambers ch ON o.chamber_id = ch.id
JOIN essentials.governments g ON ch.government_id = g.id
WHERE g.geo_id IN ('2338740', '2302795', '2371990', '2302060', '2304860')
  AND o.politician_id IS NOT NULL;
```
Expected: 0

---

## 18 Remaining Cities Status

All 18 remaining cities have offices in the DB (from migration 177), all skeletal (politician_id=NULL, is_vacant=true). Per CONTEXT.md all are status='not attempted' for Phase 54.

The 18 are: Augusta, Saco, Westbrook, Sanford, Waterville, Brewer, Presque Isle, Bath, Ellsworth, Gardiner, Hallowell, Calais, Belfast, Old Town, Eastport, Rockland, Caribou (17 confirmed). The 18th is the remaining city from the 23 total minus Portland (seeded) and the 5 Tier 2 cities above.

Reference from STATE.md: 23 cities total. Portland + 5 Tier 2 = 6. 23 - 6 = 17 remaining. Re-count: Augusta, Saco, Westbrook, Sanford, Waterville, Brewer, Presque Isle, Bath, Ellsworth, Gardiner, Hallowell, Calais, Belfast, Old Town, Eastport, Rockland, Caribou = 17. Confirmed: the deferred list in CONTEXT.md names 17 cities, which is correct (23 - 1 Portland - 5 Tier 2 = 17).

---

## Sources

### Primary (HIGH confidence)
- `C:/EV-Accounts/backend/migrations/177_me_cities_scaffolding.sql` — read directly; all office title strings extracted
- `C:/EV-Accounts/backend/migrations/178_portland_council_incumbents.sql` — read directly; CTE pattern extracted
- https://www.bangormaine.gov/446/City-Council — all 9 council member names + emails confirmed
- https://www.auburnmaine.gov/government/city_council/index.php — all 8 council member names + emails confirmed
- https://www.auburnmaine.gov/government/mayor.php — Mayor Harmon name + email + photo confirmed
- https://www.lewistonmaine.gov/105/Mayor-City-Council — 8 member names confirmed
- https://www.lewistonmaine.gov/1346/Elected-Officials-and-City-Ward-Map — all profile URLs confirmed
- https://www.lewistonmaine.gov/1184/Ward-3-Councilor-Scott-A-Harriman — email + photo confirmed
- https://www.lewistonmaine.gov/1340/Ward-1-Councilor-Joshua-Nagine — email + photo confirmed
- https://www.southportland.gov/411/City-Council — 7 member names confirmed; Tipton dual-office confirmed
- https://www.southportland.gov/directory.aspx?did=39 — member list with phone numbers
- https://www.biddefordmaine.org/2437/City-Council — 9 council member names confirmed
- https://www.biddefordmaine.org/2276/Office-of-the-Mayor — Mayor LaFountain + email + photo confirmed
- https://www.biddefordmaine.org/Directory.aspx?did=42 — council member phone numbers confirmed
- .planning/STATE.md — geo_ids, migration history, existing namespaces confirmed

### Secondary (MEDIUM confidence)
- WebSearch "Auburn Maine city council members 2025 2026" — Nov 2025 meeting packet (Milks/Weisner) vs live website (Duvall/Butler) discrepancy; live website is authoritative
- WebSearch "Biddeford Maine mayor 2025 2026 Liam LaFountain" — election confirmed Nov 4, 2025; sworn Dec 2, 2025
- WebSearch "Lewiston Maine ranked choice voting RCV" — no RCV at municipal level confirmed
- WebSearch "Bangor Maine ranked choice voting" — no RCV at municipal level confirmed
- pressherald.com — Biddeford election results (LaFountain beats Grohman 2,626 to 2,414)
- wabi.tv — Bangor City Council Nov 2025 election results (Faloon, Carson, Walker elected; Hawes elected Chair)

### Tertiary (LOW confidence)
- None — all critical findings verified at HIGH or MEDIUM

---

## Metadata

**Confidence breakdown:**
- Incumbent names: HIGH (all 5 cities verified from official city websites)
- Emails: HIGH for Bangor + Auburn (full harvest); MEDIUM for Lewiston (2/8 confirmed); LOW for South Portland + Biddeford (individual pages not fetched)
- Office titles: HIGH (read directly from migration 177 SQL)
- External_id scheme: HIGH (derivation logic confirmed; collision analysis complete)
- RCV status: HIGH (all 5 cities: no RCV confirmed)
- Headshot availability: MEDIUM (Bangor + South Portland confirmed; others inferred from website structure)
- South Portland dual-office (Tipton): HIGH (confirmed from official website + news source)

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable for 30 days; council membership unlikely to change without a special election)
