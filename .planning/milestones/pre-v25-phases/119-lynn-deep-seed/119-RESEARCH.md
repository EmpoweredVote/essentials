# Phase 119: Lynn Deep Seed - Research

**Researched:** 2026-06-14
**Domain:** Massachusetts local government seeding — Lynn city government + school committee + headshots
**Confidence:** HIGH

## Summary

Lynn, MA is a strong-Mayor city with an 11-member City Council (7 ward + 4 at-large) and a 7-member School Committee (6 elected at-large + Mayor as Chair ex-officio). Mayor Jared C. Nicholson won re-election unopposed in November 2025 and began his second term on January 5, 2026.

The City Council has no turnover concern for an unknown mayor: Nicholson has been serving since January 2022 and is not a new face. The council saw two newcomers in November 2025 (Cardeliz Paez, Ward 5, and Jordan T. Avery, Ward 7). Constantino "Coco" Alinsug (Ward 3) was elected Council President; Frederick "Fred" Hogan (Ward 6) is Vice President.

Lynn's School Committee is a **3-migration scope** trigger (D-03): it has 6 at-large elected members plus Mayor Nicholson as Chair. It follows the Newton single-ex-officio pattern exactly (not Somerville's two-ex-officio pattern). The school NCES LEAID is **2507110**, giving geo_id='2507110' for the SCHOOL district.

lynnma.gov uses **CivicLive CMS** (not CivicEngage/Revize). All 11 city council headshots are accessible at confirmed-200 URLs on the CivicLive CDN (`cdnsm5-hosted2.civiclive.com`), with one filename gotcha (Megie-Maddrey.png → `MegieMaddrey.png`, no hyphen). Mayor Nicholson's headshot is NOT on lynnma.gov — best fallback is Wikipedia Commons (`Jared_Nicholson_1.jpg`, confirmed 200). School committee members have no headshots on lynnschools.org (SchoolMessenger CMS, text-only committee page); expect gaps for most or all SC members.

**Primary recommendation:** 3-migration scope (584 city gov + 585 school committee + 586 headshots). Flat-district pattern for council (7 ward + 4 at-large, all link to single LOCAL district, ward encoded in title). Mayor is single ex-officio on school committee — Newton pattern applies directly.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** If lynnma.gov blocks images (CivicEngage 403 pattern like Newton), document all as gaps and move on — no fallback hunting via campaign sites, LinkedIn, or Ballotpedia. Best-effort coverage per LYNN-02; gaps are honest.
- **D-02:** If lynnma.gov is accessible (like Somerville), probe the standard city CMS URL patterns for each official and upload what returns 200 OK.
- **D-03:** Researcher must verify Lynn's actual elected body structure before the planner determines migration count:
  - If Lynn = Mayor + City Council only → 2 migrations (584 city gov + 585 headshots)
  - If Lynn = Mayor + City Council + elected School Committee → 3 migrations (584 city gov + 585 school committee + 586 headshots), following the Newton 578/579/580 three-migration pattern
- **D-04:** Only include bodies that are democratically elected and confirmed by the researcher. Appointed boards are excluded.
- **D-05:** Researcher verifies council seat count, ward vs. at-large breakdown, and complete councillor roster from lynnma.gov (the official city site). Do not use unverified counts.
- **D-06:** Title format follows MA convention: `'Mayor'` for Mayor, `'City Councilor'` (at-large) or `'City Councilor (Ward N)'` (ward seat). If Lynn uses a different title (e.g., "Alderman"), researcher confirms and planner uses that instead.
- **D-07:** City official external IDs use the geo_id prefix pattern: `-2537490001` (Mayor) through `-2537490NNN` (councillors, in ward-number order then at-large). School committee (if applicable) uses NCES LEAID prefix.

### Claude's Discretion

None listed.

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LYNN-01 | A Lynn address returns a LOCAL section showing Mayor + City Council members with correct offices linked to geo_id=2537490 | Government seeding pattern verified (Newton 578 + Somerville 581 as primary templates); all 12 city officials identified; SC migration also populates SCHOOL section |
| LYNN-02 | Lynn elected officials have headshots at 600×750 in Supabase Storage; best-effort coverage | lynnma.gov accessible (CivicLive CMS, NOT CivicEngage); 11/11 council headshots confirmed 200 on CDN; Mayor gap on lynnma.gov but Wikipedia Commons fallback confirmed 200; SC members likely all gaps (text-only site) |

</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government row + chambers | Database / Storage | — | SQL migration; no UI change |
| District rows (LOCAL_EXEC + LOCAL + SCHOOL) | Database / Storage | — | SQL migration |
| Politicians + offices (city) | Database / Storage | — | SQL migration 584 |
| Politicians + offices (school committee) | Database / Storage | — | SQL migration 585 |
| G5420 school district geofence | Database / Storage | — | Direct INSERT in migration 585; no MA G5420 TIGER loader |
| Headshot upload + politician_images | Database / Storage | API / Backend | Python script + SQL migration 586 |
| LOCAL section display | Browser / Client | Frontend Server (SSR) | Pre-existing routing; no UI change needed |

---

## Lynn City Government — Verified Roster

### Mayor [VERIFIED: lynnma.gov/city_government/mayor, itemlive.com inauguration coverage, Wikipedia]

**Jared C. Nicholson** — 59th Mayor of Lynn; began first term January 3, 2022; began second term January 5, 2026
- Won November 2025 election unopposed (5,851 votes, 100%)
- Role: LOCAL_EXEC; district_type='LOCAL_EXEC'; is_appointed=false
- Public name: "Jared C. Nicholson" (or "Jared Nicholson"); DB convention: first_name='Jared', last_name='Nicholson'
- Serves as Chair of the School Committee (ex-officio)

### City Council — 11 members [VERIFIED: lynnma.gov/city_government/citycouncil/councilors, fetched 2026-06-14]

Lynn City Council structure: 7 ward seats (1 per ward) + 4 at-large seats = 11 total.
Councillors serve 2-year terms. All 11 seats were on the November 2025 ballot. Two newcomers: Paez (W5), Avery (W7).

**Ward Members:**
| Ward | Name | Full Name | Notes |
|------|------|-----------|-------|
| Ward 1 | Dr. Peter D. Meaney | Dr. Peter D. Meaney | Re-elected Nov 2025 (defeated Paul Gouthro) |
| Ward 2 | Obed A. Matul | Obed A. Matul | Ran unopposed; returning |
| Ward 3 | Constantino "Coco" Alinsug | Constantino Alinsug | Ran unopposed; Council President |
| Ward 4 | Natasha S. Megie-Maddrey | Natasha S. Megie-Maddrey, Esq. | Ran unopposed; returning |
| Ward 5 | Cardeliz Paez | Cardeliz Paez | Newly elected Nov 2025 |
| Ward 6 | Frederick "Fred" W. Hogan | Frederick W. Hogan | Ran unopposed; Vice President |
| Ward 7 | Jordan T. Avery | Jordan T. Avery | Newly elected Nov 2025 |

**At-Large Members:**
| Name | Full Name | Notes |
|------|-----------|-------|
| Brian P. LaPierre | Brian P. LaPierre | Re-elected Nov 2025; incumbent |
| Hong L. Net | Hong L. Net | Re-elected Nov 2025; incumbent |
| Brian M. Field | Brian M. Field | Re-elected Nov 2025; incumbent |
| Nicole D. McClain | Nicole D. McClain | Re-elected Nov 2025; incumbent |

**Officer titles:** Constantino Alinsug = Council President; Frederick Hogan = Council Vice President. [VERIFIED: itemlive.com inauguration article Jan 2026]

**Title spelling on official site:** "Councilor" (American spelling). The city uses "Councilor" not "Councillor". [VERIFIED: lynnma.gov council page uses "Councilor" throughout the page text and member titles]

**Official title format confirmed:**
- At-large: `'City Councilor'` (no ward suffix)
- Ward seat: `'City Councilor (Ward N)'` where N = ward number (1 through 7)
- Council President's city-council office title: `'City Councilor (Ward 3)'` — President is an internal officer role

**DB name convention for "Dr." prefix:** Use `first_name='Peter'`, `last_name='Meaney'` (no Dr. prefix in DB; title handled by office title field). Confirmed pattern from Newton/Somerville.

---

## Lynn School Committee — Verified Roster

**Structure confirmed:** 6 elected at-large members + Mayor as Chair (ex-officio) = **7 total** [VERIFIED: itemlive.com Nov 2025 election results (6 seats), masscivics.com roster, inauguration article Jan 2026]

- Election model: at-large (not ward-based), elected to 2-year terms
- Terms are staggered: 6 seats were up in 2025, 6 different seats will be up in 2027
- Mayor Nicholson serves as Chair (not merely ex-officio advisory — full member status)
- **Mary Jules is the administrative Secretary** (staff hire, NOT an elected committee member — see Pitfall 1)
- Lorraine Gately = Vice Chair (unanimously elected January 5, 2026) [VERIFIED: itemlive.com Jan 5 2026]
- NCES LEAID: **2507110** (Lynn Public Schools, MA) [VERIFIED: nces.ed.gov district search 2026-06-14]
- G5420 geo_id: '2507110'

| # | Name | Full Name | Officer Role | Notes |
|---|------|-----------|--------------|-------|
| 1 | Tristan J. Smith | Tristan J. Smith, Esq. | — | Newly elected Nov 2025; topped ticket |
| 2 | Lorraine Gately | Lorraine Gately | Vice Chair | Re-elected Nov 2025; 4-term member |
| 3 | Andrea Satterwhite | Andrea L. Satterwhite | — | Re-elected Nov 2025; returning member |
| 4 | Brian Castellanos | Brian K. Castellanos | — | Re-elected Nov 2025; 4-term member |
| 5 | Brenda Ortiz McGrath | Brenda Ortiz McGrath | — | Newly elected Nov 2025; first-time winner |
| 6 | Lennin "Lenny" Peña | Lennin Peña | — | Re-elected Nov 2025; returning member |
| 7 | Mayor Nicholson | Jared C. Nicholson | Chair (ex officio) | Reuses politician_id from migration 584 |

**DB name convention for Lennin Peña:** `first_name='Lennin'`, `last_name='Peña'` per official usage; note the ñ character [VERIFIED: Instagram handle @lenny_for_lynn shows "Lennin Lenny Pena"; lynnschools.org uses "Lenny Pena" without accent]. Use `first_name='Lennin'`, `last_name='Peña'` following the pattern of Somerville's "Joseline Pena-Melnyk" (ñ in DB).

**DB name convention for Tristan Smith:** `first_name='Tristan'`, `last_name='Smith'` — lynnschools.org lists "Tristan Smith, Esq." but omit the Esq. per convention.

**DB name convention for Brenda Ortiz McGrath:** No hyphen (confirmed multiple news sources: "Brenda Ortiz McGrath" not "Brenda Ortiz-McGrath").

**SC official government name:** 'Lynn Public Schools, Massachusetts, US' (Newton pattern: '...Public Schools, Massachusetts, US')

**SINGLE ex-officio (Newton pattern, not Somerville pattern):** Mayor is the ONLY ex-officio member. Back-fill range excludes only `-2537490001` (Mayor). This is the Newton pattern.

---

## Key IDs and Schema Values

### City Government

| Field | Value | Source |
|-------|-------|--------|
| geo_id (city) | '2537490' | STATE.md; G4110 from v5.0 |
| governments.state | 'MA' (uppercase) | MA convention |
| districts.state | 'ma' (lowercase) | MA convention |
| offices.representing_state | 'MA' (uppercase) | MA convention |
| Government name | 'City of Lynn, Massachusetts, US' | Newton/Somerville pattern |
| Chamber name | 'City Council' | Official name |
| Chamber name_formal | 'Lynn City Council' | City pattern |
| LOCAL_EXEC district label | 'Lynn (Citywide)' | Newton/Somerville pattern |
| LOCAL district label | 'Lynn' | Newton/Somerville pattern |
| is_appointed | false | All elected |
| party | NULL | Antipartisan design |

### School District

| Field | Value | Source |
|-------|-------|--------|
| NCES LEAID | 2507110 | nces.ed.gov verified 2026-06-14 |
| geo_id (school) | '2507110' | LEAID value |
| G5420 geofence state | '25' | FIPS numeric string for MA |
| Government name | 'Lynn Public Schools, Massachusetts, US' | Newton pattern |
| Chamber name | 'School Committee' | Official name |
| Chamber name_formal | 'Lynn School Committee' | Newton pattern |
| district_type | 'SCHOOL' | NOT 'SCHOOL_DISTRICT' — critical |
| is_appointed | false (elected 1–6) | All 6 are at-large elected |

### Migration Scope Decision

**D-03 Resolution: 3 migrations** — Lynn has an elected school committee (6 at-large + Mayor chair).

| Migration | Description | Content |
|-----------|-------------|---------|
| **584** | Lynn city government | Mayor + 11 City Councilors (12 officials); chamber + 2 districts (LOCAL_EXEC + LOCAL); geo_id=2537490 |
| **585** | Lynn School Committee | G5420 geofence; government + chamber + SCHOOL district; 6 new SC politicians; 1 ex-officio office row (Mayor); geo_id=2507110 |
| **586** | Lynn headshots | Python script + politician_images rows; best-effort from CivicLive CDN + Wikipedia fallback for Mayor |

### External ID Scheme

| Range | Usage | Count |
|-------|-------|-------|
| -2537490001 | Mayor Jared Nicholson | 1 |
| -2537490002..-2537490005 | 4 at-large councilors (Field, LaPierre, McClain, Net — alphabetical) | 4 |
| -2537490006..-2537490012 | 7 ward councilors (Ward 1–7 in order) | 7 |
| -2507110001..-2507110006 | 6 elected School Committee members | 6 |
| ~~-2507110007~~ | Mayor Nicholson ex-officio (NO new politician row — reuses -2537490001) | — |

**Suggested external ID assignment — at-large (alphabetical by last name):**
- -2537490002: Brian M. Field
- -2537490003: Brian P. LaPierre
- -2537490004: Nicole D. McClain
- -2537490005: Hong L. Net

**Suggested external ID assignment — ward (ward number order):**
- -2537490006: Dr. Peter D. Meaney (Ward 1)
- -2537490007: Obed A. Matul (Ward 2)
- -2537490008: Constantino Alinsug (Ward 3, Council President)
- -2537490009: Natasha S. Megie-Maddrey (Ward 4)
- -2537490010: Cardeliz Paez (Ward 5)
- -2537490011: Frederick W. Hogan (Ward 6, Vice President)
- -2537490012: Jordan T. Avery (Ward 7)

**Suggested external ID assignment — school committee (alphabetical by last name):**
- -2507110001: Brian K. Castellanos
- -2507110002: Lorraine Gately (Vice Chair)
- -2507110003: Brenda Ortiz McGrath
- -2507110004: Lennin Peña
- -2507110005: Andrea L. Satterwhite
- -2507110006: Tristan J. Smith (topped ticket)

**Total politicians to seed:** 1 Mayor + 4 at-large + 7 ward councilors + 6 SC members = **18 new politician rows**
- 1 additional OFFICE row for SC ex-officio (Mayor reuses existing politician row)
- Total offices: 1 (LOCAL_EXEC) + 11 (LOCAL) + 7 (SCHOOL: 6 elected + 1 ex-officio) = **19**

---

## Architecture Patterns

### Migration Structure

Three migrations following Newton wave pattern:

```
Migration 584: City of Lynn government (Mayor + 11 City Councilors)
Migration 585: Lynn Public Schools school committee (6 elected + Mayor ex-officio)
Migration 586: Lynn headshots (Python script + SQL)
```

### City Government Pattern (Newton 578 / Somerville 581 model)

```sql
-- Pre-flight 1: Assert Lynn G4110 geofence present (v5.0)
DO $$ DECLARE v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM essentials.geofence_boundaries
  WHERE geo_id = '2537490' AND mtfcc = 'G4110';
  IF v_count = 0 THEN
    RAISE EXCEPTION 'Pre-flight FAILED: Lynn G4110 geofence not found';
  END IF;
END $$;

-- Pre-flight 2: Assert external_id range clear (-2537490001..-2537490012)
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2537490012 AND -2537490001;
-- Expected: 0

-- Step 1: Government row (WHERE NOT EXISTS guard on name)
INSERT INTO essentials.governments (name, type, state, city, geo_id)
SELECT 'City of Lynn, Massachusetts, US', 'LOCAL', 'MA', 'Lynn', '2537490'
WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of Lynn, Massachusetts, US');

-- Step 2: City Council chamber (NO slug column — GENERATED ALWAYS)
INSERT (name='City Council', name_formal='Lynn City Council', government_id=...)
WHERE NOT EXISTS on (name, government_id)

-- Step 3a: LOCAL_EXEC district (Mayor)
district_type='LOCAL_EXEC', state='ma', geo_id='2537490', label='Lynn (Citywide)', mtfcc=NULL

-- Step 3b: LOCAL district (all 11 councilors)
district_type='LOCAL', state='ma', geo_id='2537490', label='Lynn', mtfcc=NULL

-- Step 4: 12 politician+office blocks (Mayor + 4 at-large + 7 ward)
-- Title format: 'Mayor' / 'City Councilor' (at-large) / 'City Councilor (Ward N)' (ward seat)

-- Step 5: office_id back-fill (all 12 politicians)

-- Step 6: Post-verification DO block (≥7 gates)

-- Step 7: schema_migrations ledger entry
```

### School Committee Pattern (Newton 579 model — single ex-officio)

```sql
-- Step 0: Insert G5420 geofence
INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '2507110', 'G5420', '25'
WHERE NOT EXISTS (SELECT 1 FROM essentials.geofence_boundaries WHERE geo_id = '2507110' AND mtfcc = 'G5420');

-- Step 1: Government row (Lynn Public Schools)
-- Step 2: School Committee chamber (no slug)
-- Step 3: SCHOOL district (geo_id='2507110', state='ma', district_type='SCHOOL')

-- Step 4: 6 elected politician+office blocks (is_appointed=false)
--   Titles: 'School Committee Member' for all 6 elected members
--   (No Chair/Vice Chair role distinction in DB titles — SC officers are elected by committee, not by voters)

-- Step 4b: Mayor Nicholson ex-officio office (reuses politician external_id=-2537490001)
INSERT INTO essentials.offices (...)
SELECT gen_random_uuid(), d.id, chamber_id_subquery, p.id,
       'Mayor (ex officio)', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN (SELECT id FROM essentials.politicians WHERE external_id = -2537490001) p
WHERE d.geo_id = '2507110' AND d.district_type = 'SCHOOL' AND d.state = 'ma'
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- Step 5: office_id back-fill (SC elected members ONLY — range -2507110001..-2507110006)
-- MUST exclude -2537490001 (Mayor) to preserve his LOCAL_EXEC office_id
UPDATE essentials.politicians p SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2507110006 AND -2507110001
  AND p.office_id IS NULL;

-- Step 6: Post-verification DO block
-- Step 7: schema_migrations ledger entry
```

### Office Title Conventions

| Role | Title String |
|------|-------------|
| Mayor | `'Mayor'` |
| At-large City Councilor | `'City Councilor'` |
| Ward City Councilor | `'City Councilor (Ward N)'` where N = 1–7 |
| Council President | `'City Councilor (Ward 3)'` for city council office |
| School Committee member | `'School Committee Member'` |
| Mayor in School Committee | `'Mayor (ex officio)'` |

**Note on Council President title:** Alinsug's city council office title should be `'City Councilor (Ward 3)'` — the "President" role is a council-internal officer title, not a charter office title. This follows the Somerville Lance Davis precedent (178-RESEARCH.md Pitfall 1).

---

## Headshot Sources Research

### CMS: CivicLive (NOT CivicEngage) [VERIFIED: lynnma.gov footer 2026-06-14]

lynnma.gov uses CivicLive CMS. This is **NOT** the CivicEngage/Revize system that blocked Newton (403). The CivicLive CDN hosts council photos at:

```
https://cdnsm5-hosted2.civiclive.com/UserFiles/Servers/Server_109726/Image/Council%20Photos/{LastName}.png
```

### Confirmed Accessible URLs (200 OK) [VERIFIED: curl HEAD checks 2026-06-14]

| Official | CDN Filename | Status |
|----------|-------------|--------|
| Mayor Nicholson | NOT on CDN | — (see fallback below) |
| Peter Meaney (W1) | `Meaney.png` | 200 |
| Obed Matul (W2) | `Matul.png` | 200 |
| Coco Alinsug (W3, President) | `Alinsug.png` | 200 |
| Natasha Megie-Maddrey (W4) | `MegieMaddrey.png` (no hyphen) | 200 |
| Cardeliz Paez (W5) | `Paez.png` | 200 |
| Fred Hogan (W6, VP) | `Hogan.png` | 200 |
| Jordan Avery (W7) | `Avery.png` | 200 |
| Brian Field (AL) | `Field.png` | 200 |
| Brian LaPierre (AL) | `LaPierre.png` | 200 |
| Nicole McClain (AL) | `McClain.png` | 200 |
| Hong Net (AL) | `Net.png` | 200 |

**All 11 councilors have accessible headshots.** Coverage: 11/11 city council = 100%.

### Mayor Nicholson Headshot

No photo on lynnma.gov or CivicLive CDN. Fallback: **Wikipedia Commons**
- URL: `https://upload.wikimedia.org/wikipedia/commons/7/7f/Jared_Nicholson_1.jpg`
- Status: 200 OK [VERIFIED: curl check 2026-06-14]
- Note: This is a public-domain photo; appropriate for use.

**Expected headshot coverage:** 12/12 city officials (11 from CDN + 1 Mayor from Wikipedia).

### School Committee Headshots

lynnschools.org uses SchoolMessenger Presence CMS. The committee_members page is text-only — no headshot photos are displayed. [VERIFIED: WebFetch 2026-06-14 confirmed no images on SC page]

Probing standard SchoolMessenger Centricity paths returned 404 for all tried patterns. No CDN path found for SC member photos.

**Expected coverage:** 0/6 elected SC members from official site. All 6 are gaps.

Per D-01: Since there is no accessible official photo source for SC members, document as gaps and move on. No campaign site / social media fallback hunting per D-01 decision.

**Total headshot expected:** 12/12 city officials + 0/6 SC members (+ 0/1 Mayor's SC office is same person, no extra photo needed) = **12 uploads expected**.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image crop + resize | Custom crop logic | Pillow PIL (crop 4:5 → resize 600x750 Lanczos) | Existing pattern from Phase 109/117/118 |
| School district geofence | TIGER G5420 loader | Direct INSERT in migration | No MA G5420 rows loaded by TIGER loader; same as Newton |
| Ward geofences for council | ArcGIS/custom boundary loader | Encode ward in title string | Flat-district pattern (Newton/Somerville); no digital boundary needed |

---

## Common Pitfalls

### Pitfall 1: Mary Jules — administrative Secretary vs. elected member
**What goes wrong:** Seeding Mary Jules as a 7th elected School Committee politician
**Why it happens:** lynnschools.org lists her as "Secretary of the Lynn School Committee" alongside the 6 elected members; masscivics.com incorrectly counted her as an "elected member"
**How to avoid:** Mary Jules was **hired** as administrative secretary in October 2018 (confirmed from itemlive.com/2018/10/11/lynn-school-committee-hires-mary-jules-as-secretary/). She is a staff position, not an elected member. The 6 elected members after November 2025 are: Smith, Gately, Satterwhite, Castellanos, Ortiz McGrath, Peña. Seed exactly 6 elected SC politicians + Mayor ex-officio = 7 total SC offices.

### Pitfall 2: Natasha Megie-Maddrey CDN filename has no hyphen
**What goes wrong:** Script uses `Megie-Maddrey.png` (returns 404)
**Why it happens:** The official council page lists her as "Natasha S. Megie-Maddrey" with a hyphen; CDN filename removes the hyphen
**How to avoid:** Use `MegieMaddrey.png` (no hyphen, no space). Confirmed 200 OK. The official last name in the DB should still use the hyphen: last_name='Megie-Maddrey' per her official name.

### Pitfall 3: Council President title ambiguity
**What goes wrong:** Using 'City Council President' as Alinsug's city council office title
**Why it happens:** Alinsug is both Ward 3 Councillor AND Council President
**How to avoid:** Use `'City Councilor (Ward 3)'` as his city government office title. President is an internal council officer role. Follows Somerville Lance Davis precedent.

### Pitfall 4: Seeding Mayor Nicholson twice in politicians table
**What goes wrong:** Inserting a new politician row in migration 585 for the SC Chair
**Why it happens:** SC migration template creates a new politician row per member
**How to avoid:** Use subquery on existing external_id=-2537490001 for the SC ex-officio office INSERT. Total politicians from migrations 584+585 combined = 18, not 19.

### Pitfall 5: office_id back-fill overwrites Mayor's city office_id
**What goes wrong:** Migration 585 back-fill sets Mayor's office_id to the SCHOOL office, overwriting his LOCAL_EXEC office_id from migration 584
**Why it happens:** Standard back-fill UPDATE matches on politician_id
**How to avoid:** SC back-fill UPDATE range MUST be -2507110001..-2507110006 only. Exclude -2537490001 (Mayor).

### Pitfall 6: Wrong LEAID — don't confuse 2507110 (Lynn) with 2508610 (Newton) or 2510890 (Somerville)
**What goes wrong:** Using wrong geo_id for the school committee SCHOOL district
**Why it happens:** MA LEAID values all start with 25 and look similar
**How to avoid:** Lynn LEAID = 2507110. Newton = 2508610. Somerville = 2510890. Triple-check at the G5420 INSERT step.

### Pitfall 7: Including slug in chambers INSERT
**What goes wrong:** SQL error — slug is GENERATED ALWAYS on essentials.chambers
**How to avoid:** Never include slug in INSERT column list for essentials.chambers.

### Pitfall 8: essentials.governments WHERE NOT EXISTS guard
**What goes wrong:** Duplicate government rows for Lynn
**Why it happens:** essentials.governments has NO unique constraint on geo_id
**How to avoid:** Always use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of Lynn, Massachusetts, US')`.

### Pitfall 9: districts.state casing
**What goes wrong:** Routing query returns no results; Lynn address shows no LOCAL section
**Why it happens:** districts.state must be 'ma' (lowercase) — routing queries use lowercase state code
**How to avoid:** All LOCAL, LOCAL_EXEC, SCHOOL districts use `state='ma'` (lowercase). governments.state='MA' and offices.representing_state='MA' are uppercase.

### Pitfall 10: "Lennin" vs "Lenny" name spelling
**What goes wrong:** Using "Lenny Pena" instead of "Lennin Peña"
**Why it happens:** Most news sources use nickname "Lenny"; lynnschools.org uses "Lenny Pena" without accent
**How to avoid:** Use `first_name='Lennin'`, `last_name='Peña'` (legal name with ñ) per official usage. His Instagram shows "Lennin Lenny Pena" confirming Lennin is legal first name.

---

## Standard Stack

No new packages required. Phase uses existing project infrastructure only.

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| mcp__supabase-local | — | Execute SQL migrations directly | Project standard |
| Python headshot script | 3.x | Download, crop 4:5, resize 600x750, upload to politician_photos bucket | Phase 109/117/118 pattern |
| Pillow (PIL) | existing | Image crop + resize | Project standard |
| supabase-py | existing | Supabase Storage upload | Project standard |
| requests | existing | HTTP download | Project standard |

## Package Legitimacy Audit

No new packages to install — phase uses existing project dependencies only.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Runtime State Inventory

Greenfield seed phase — no existing Lynn government rows.

- **Stored data:** None. Confirmed: Lynn geo_id=2537490 exists only in geofence_boundaries (v5.0), not in governments/districts/offices/politicians. LEAID=2507110 not yet in any table.
- **Live service config:** None.
- **OS-registered state:** None.
- **Secrets/env vars:** None — uses existing project Supabase credentials.
- **Build artifacts:** None.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| mcp__supabase-local | SQL migrations | Yes | — | — |
| Python 3 | Headshot script | Yes | 3.x | — |
| Pillow | Image processing | Yes (prior phases used it) | — | — |
| requests | HTTP download | Yes | — | — |

**Missing dependencies with no fallback:** None.

---

## Validation Architecture

`workflow.nyquist_validation` absent from config.json — treat as enabled. Phase is data-only migration. Validation via SQL DO block assertions embedded in each migration.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | SQL DO block assertions (inline) |
| Config file | none |
| Quick run command | Execute migration via mcp__supabase-local |
| Full suite command | Post-verification DO block + section-split query |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LYNN-01 | Lynn address returns LOCAL section (+ SCHOOL section) | Integration (DB) | Section-split query + spot-check Lynn address via API | N/A (DB-only) |
| LYNN-02 | Headshots at 600×750 in politician_photos | Manual | Python script + migration 586; verify rows in politician_images | N/A |

### DB Spot-Check Queries (post-migration verification)

**After migration 584:**
```sql
-- Count: 12 city officials
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2537490012 AND -2537490001;
-- Expected: 12

-- Count: 12 offices (1 LOCAL_EXEC + 11 LOCAL)
SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '2537490' AND d.state = 'ma';
-- Expected: 12

-- Section-split clean
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '2537490' AND gb.mtfcc = 'G4110'
  AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.state = 'ma');
-- Expected: 0

-- Mayor title check
SELECT title FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id = -2537490001;
-- Expected: 'Mayor'

-- Ward 3 Alinsug title check (Council President — should NOT be 'City Council President')
SELECT title FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id = -2537490008;
-- Expected: 'City Councilor (Ward 3)'
```

**After migration 585:**
```sql
-- Count: 6 elected SC politicians
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2507110006 AND -2507110001;
-- Expected: 6

-- Count: 7 SCHOOL offices (6 elected + 1 ex-officio Mayor)
SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '2507110' AND d.district_type = 'SCHOOL' AND d.state = 'ma';
-- Expected: 7

-- G5420 geofence present
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id = '2507110' AND mtfcc = 'G5420';
-- Expected: 1

-- School section-split clean
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '2507110' AND gb.mtfcc = 'G5420'
  AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'ma');
-- Expected: 0

-- Mayor office_id still LOCAL_EXEC (not overwritten by SC back-fill)
SELECT COUNT(*) FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id = -2537490001 AND d.district_type = 'LOCAL_EXEC' AND d.geo_id = '2537490';
-- Expected: 1

-- Mayor ex-officio office exists in SCHOOL district
SELECT o.title FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE d.geo_id = '2507110' AND d.district_type = 'SCHOOL'
  AND p.external_id = -2537490001;
-- Expected: 'Mayor (ex officio)'
```

**After migration 586:**
```sql
-- Count uploaded headshots
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE (p.external_id BETWEEN -2537490012 AND -2537490001
    OR p.external_id BETWEEN -2507110006 AND -2507110001)
  AND pi.type = 'default';
-- Expected: 12 (all 12 city officials; 0 SC member gaps)

-- Verify no wrong type
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE (p.external_id BETWEEN -2537490012 AND -2537490001
    OR p.external_id BETWEEN -2507110006 AND -2507110001)
  AND pi.type != 'default';
-- Expected: 0
```

### Wave 0 Gaps

None — no new test files required. Post-verification is embedded in migration SQL.

---

## Security Domain

Phase is data migration only (SQL INSERT statements). No authentication, session, input validation, or cryptography concerns. ASVS V2/V3/V4/V6 do not apply. V5 satisfied by existing parameterized SQL patterns already in use.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | "Lennin Peña" is legal full name (ñ, two-L Lennin) | SC Roster | Low — display name cosmetic issue; easy UPDATE |
| A2 | Mayor is ONLY ex-officio on SC (not two ex-officio like Somerville) | SC Pattern | Medium — if Council President also sits ex-officio, migration 585 needs a second ex-officio block; verify on lynnschools.org |
| A3 | Tristan J. Smith's middle initial is J | SC Roster | Low — cosmetic; confirmed from Lynn Journal headline and LegiStorm |
| A4 | Brenda Ortiz McGrath has no hyphen | SC Roster | Low — cosmetic; confirmed from multiple news sources |
| A5 | Wikipedia Commons photo of Nicholson is appropriate for use (public domain/free license) | Mayor headshot | Low — Wikipedia photos are typically CC-licensed or PD; check license if needed |
| A6 | SC members' terms: the 6 confirmed Nov 2025 electees are all current (no one has resigned since Jan 2026) | SC Roster | Low — swore in Jan 5 2026; confirmed in inauguration article |

**If this table is empty:** Table is NOT empty. A2 (single vs. dual ex-officio) is worth a planner pre-flight check.

---

## Open Questions

1. **Confirm single ex-officio on School Committee**
   - What we know: Mayor is confirmed Chair; masscivics.com shows "Mayor Jared C. Nicholson — Chairman" only; inauguration article lists only "6 school committee members" sworn in (not Council President)
   - What's unclear: Whether the City Council President has any formal ex-officio seat on the SC (Lynn charter was only partially accessible)
   - Recommendation: HIGH confidence it's single ex-officio (Newton pattern). If a Lynn charter PDF check during plan execution finds a Council President ex-officio provision, add a second ex-officio block following the Somerville pattern.

2. **"Dr." prefix for Peter Meaney**
   - What we know: lynnma.gov lists him as "Dr. Peter D. Meaney"; he holds a doctorate
   - What's unclear: Whether DB first_name should be 'Peter' or 'Dr. Peter'
   - Recommendation: Use `first_name='Peter'`, `last_name='Meaney'` — the "Dr." title is an honorific, not part of the name per DB convention. The office title field shows his role; honorifics are not stored in first_name per project patterns.

3. **School committee "Vice Chair" title in DB**
   - What we know: Lorraine Gately was elected Vice Chair January 5, 2026
   - What's unclear: Whether SC office titles should distinguish Chair/Vice Chair or all use 'School Committee Member'
   - Recommendation: Use `'School Committee Member'` for all 6 elected SC members regardless of officer roles. Chair = Mayor ex-officio already has a distinct title. SC officer positions are voted on by members after election — they are not separate elected offices from the voter perspective. This matches the Newton pattern (all SC members use same title).

---

## Sources

### Primary (HIGH confidence)
- lynnma.gov/city_government/citycouncil/councilors — full current roster with names and ward/at-large designations (fetched 2026-06-14)
- lynnma.gov/city_government/mayor — confirmed Mayor Nicholson, 59th Mayor (fetched 2026-06-14)
- nces.ed.gov/ccd/districtsearch — LEAID=2507110 for Lynn Public Schools, 100 Bennett St, Lynn MA (verified 2026-06-14)
- itemlive.com/2025/12/28/start-of-mayors-second-term-highlights-lynn-inauguration/ — Jan 5 2026 inauguration; confirms 11 city councilors + 6 SC members sworn in
- itemlive.com/2026/01/05/gately-elected-as-school-committee-vice-chair/ — Gately as Vice Chair confirmed
- curl HEAD checks on CivicLive CDN — all 11 council headshots confirmed 200 OK; MegieMaddrey.png filename gotcha confirmed (2026-06-14)
- upload.wikimedia.org/wikipedia/commons/7/7f/Jared_Nicholson_1.jpg — Mayor headshot confirmed 200 (2026-06-14)
- STATE.md — geo_id=2537490, next migration=584 confirmed

### Secondary (MEDIUM confidence)
- itemlive.com/2025/11/04/smith-tops-school-race/ — Nov 2025 SC results, 6 elected members confirmed
- itemlive.com/2025/11/05/new-lynn-councilors-elected/ — Nov 2025 election results, full council roster
- lynnjournal.com/2025/11/07/avery-paez-win-seats-net-lapierre-mcclain-field-re-elected-councillors-at-large/ — council results
- masscivics.com/knowledge-base/city-of-lynn-school-committee/ — SC roster (NOTE: erroneously lists Mary Jules as elected member — cross-verified against itemlive hiring article)
- WebSearch results confirming "Lennin Lenny Pena" Instagram handle and legal first name Lennin
- WebSearch result confirming Lynn SC structure: 6 at-large elected + Mayor as Chair (from 2015/2017 Ballotpedia elections data)
- itemlive.com/2018/10/11/lynn-school-committee-hires-mary-jules-as-secretary/ — confirms Mary Jules is administrative staff, not elected member

### Tertiary (LOW confidence)
- School Committee individual headshot availability (lynnschools.org — confirmed text-only; SC member headshots are confirmed gaps, not unverified) [VERIFIED gap, not assumed]

---

## Metadata

**Confidence breakdown:**
- Government structure (Mayor, council count/type): HIGH — verified from official lynnma.gov
- Complete city council roster: HIGH — verified from official lynnma.gov council page + election news
- School committee roster (6 elected members): HIGH — verified from lynnschools.org + Nov 2025 election results + inauguration article
- School committee structure (6 at-large + Mayor chair): HIGH — multiple sources confirm; at-large structure confirmed from 2015 Ballotpedia pattern + itemlive 2025 election coverage
- Mary Jules = staff not elected: HIGH — itemlive hiring article (2018) explicitly says "Lynn School Committee hires Mary Jules as secretary"
- NCES LEAID: HIGH — verified from nces.ed.gov
- CivicLive CMS (not CivicEngage): HIGH — confirmed from lynnma.gov footer attribution
- Council headshot URLs: HIGH — all 11 confirmed 200 via curl in this session
- Mayor Wikipedia headshot: HIGH — confirmed 200 via curl in this session
- SC headshot gaps: HIGH — confirmed text-only page, no images found
- Migration pattern: HIGH — directly based on applied Newton (578/579/580) and Somerville (581/582/583) migrations

**Research date:** 2026-06-14
**Valid until:** 2027-01-01 (Lynn city elections are odd-year; next election November 2027)
