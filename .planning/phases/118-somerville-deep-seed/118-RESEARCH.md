# Phase 118: Somerville Deep Seed - Research

**Researched:** 2026-06-14
**Domain:** Massachusetts local government seeding — Somerville city government + school committee + headshots
**Confidence:** HIGH

## Summary

Somerville, MA is a strong-Mayor city with an 11-member City Council (4 at-large, 7 ward) and a 9-member School Committee (7 ward-elected + 2 ex-officio: Mayor and City Council President). A key finding: the ROADMAP listed "Katjana Ballantyne" as Mayor to verify — she is **no longer Mayor**. Jake Wilson (Jacob D. Wilson) defeated Ballantyne in the November 2025 election and took office January 2, 2026 as the 37th Mayor of Somerville.

Somerville's School Committee has an important structural difference from Newton: it has **two** ex-officio members — the Mayor AND the City Council President (Lance L. Davis, Ward 6). Both must be seeded as ex-officio office rows. The City Council President also has a seat on the School Committee with full voting rights.

The migration pattern follows Newton (migrations 578/579/580) exactly: government row + chamber + LOCAL_EXEC district + LOCAL district + politician+office blocks for city government; then G5420 geofence + school government + SCHOOL district + elected members + two ex-officio office rows for the school committee; then headshots.

somervillema.gov headshots are NOT blocked like Newton (newtonma.gov returned 403 for all requests). Most ward councillors serving since 2022 or earlier have accessible headshots at confirmed-200 URLs. Newly elected 2025-cycle members (Emily Hardt Ward 7, Jon Link, Ben Wheeler at-large) do not yet have photos on the official site. School Committee headshots are not available on somervillema.gov or somerville.k12.ma.us — expect gaps there.

**Primary recommendation:** Use the Worcester/Newton flat-district pattern (all councillors link to a single LOCAL district, ward/seat encoded in title). No per-ward geofences needed. Two separate ex-officio office rows in the school committee migration (Mayor + Council President); the back-fill UPDATE must exclude both ex-officio external IDs.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SOMERVILLE-01 | A Somerville address returns a LOCAL section showing Mayor + City Council + School Committee members with correct offices linked to geo_id=2562535 | Government seeding pattern verified (Newton 578/579 + Worcester 351 + Boston 348); all 12 city officials identified; 9 SC members identified (7 elected + 2 ex-officio) |
| SOMERVILLE-02 | All Somerville elected officials have headshots at 600x750 in Supabase Storage; best-effort where official photos unavailable | somervillema.gov accessible (no 403 block); 9 confirmed-200 headshot URLs identified; 4 city officials + all SC members are gaps; expect ~60-70% coverage |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Government row + chambers | Database / Storage | — | SQL migration; no UI change |
| District rows (LOCAL_EXEC + LOCAL + SCHOOL) | Database / Storage | — | SQL migration |
| Politicians + offices (city) | Database / Storage | — | SQL migration 581 |
| Politicians + offices (school committee) | Database / Storage | — | SQL migration 582 |
| G5420 school district geofence | Database / Storage | — | Direct INSERT in migration 582; no MA G5420 TIGER loader |
| Headshot upload + politician_images | Database / Storage | API / Backend | Python script + SQL migration 583 |
| LOCAL section display | Browser / Client | Frontend Server (SSR) | Pre-existing routing; no UI change needed |

---

## Somerville City Government — Verified Roster

### Mayor [VERIFIED: somervillema.gov/mayor, Wikipedia, Somerville Times Jan 2026]

**Jacob D. Wilson** ("Jake Wilson") — sworn in January 2, 2026 as the 37th Mayor of Somerville
- Won November 2025 election over Willie Burnley Jr. (11,185 to 9,054 votes); ran as at-large City Councillor
- Role: LOCAL_EXEC; district_type='LOCAL_EXEC'; is_appointed=false
- Full name in DB: 'Jacob D. Wilson'; first_name='Jake'; last_name='Wilson'
  (The official city uses "Jake Wilson" in all public-facing contexts; use full_name='Jake Wilson', first_name='Jake', last_name='Wilson' — the "Jacob D." is the legal name per Wikipedia but the city consistently uses "Jake Wilson")
- Ex-officio member of School Committee with full voting rights

**CRITICAL:** Katjana Ballantyne is the FORMER Mayor (served 2022–Jan 2026). Do NOT seed her.

### City Council — 11 members [VERIFIED: somervillema.gov/departments/city-council, fetched 2026-06-14]

Somerville City Council structure: 4 at-large seats + 7 ward seats = 11 total.
Councillors serve 2-year terms. All 11 seats are up in odd-numbered years. Elections held November 2025.

**At-Large Members:**
| Name | Full Name | Notes |
|------|-----------|-------|
| Jon Link | Jon Link | Newly elected Nov 2025 |
| Wilfred N. Mbah | Wilfred N. Mbah | Vice President; incumbent re-elected 2025 |
| Kristen Strezo | Kristen E. Strezo | Incumbent re-elected 2025 |
| Ben Wheeler | Ben Wheeler | Newly elected Nov 2025 |

**Ward Members:**
| Ward | Name | Full Name | Notes |
|------|------|-----------|-------|
| Ward 1 | Matthew McLaughlin | Matthew McLaughlin | Incumbent |
| Ward 2 | J.T. Scott | Jefferson Thomas Scott | Incumbment re-elected; goes by "J.T." officially |
| Ward 3 | Ben Ewen-Campen | Ben Ewen-Campen | Incumbent |
| Ward 4 | Jesse Clingan | Jesse Clingan | Incumbent |
| Ward 5 | Naima Sait | Naima Sait | Incumbent |
| Ward 6 | Lance L. Davis | Lance L. Davis | President; incumbent re-elected |
| Ward 7 | Emily Hardt | Emily Hardt | Newly elected Nov 2025; replaced Judy Pineda Neufeld who resigned |

**Officer titles:** Lance L. Davis = Council President; Wilfred N. Mbah = Vice President. [VERIFIED: somervillema.gov, thesomervilletimes.com Jan 2026]

**Title spelling on official site:** "City Councilor" (American spelling). The city uses "Councilor" not "Councillor". [VERIFIED: somervillema.gov council page uses "Councilor at Large" and "Ward N City Councilor" throughout]

**Official title format confirmed:**
- At-large: 'City Councilor' (no ward suffix)
- Ward seat: 'City Councilor (Ward N)' where N = ward number
- Council President may have title 'City Council President' — see Pitfall 1 below for decision

---

## Somerville School Committee — Verified Roster

[VERIFIED: somerville.k12.ma.us/district-leadership/somerville-school-committee, fetched 2026-06-14]

**Structure:** 7 ward-elected members + 2 ex-officio members (Mayor + City Council President) = 9 total offices.
- Election model: ward-based, elected every 2 years in odd-numbered years (November 2025 election occurred)
- Ex-officio members have **full voting rights** (not just advisory)
- NCES LEAID: **2510890** (Somerville Public Schools, MA) [VERIFIED: nces.ed.gov District ID 2510890]
- G5420 geo_id: '2510890' (same LEAID-to-geo_id mapping as Boston/Newton pattern)

| # | Name | Ward | Title | Notes |
|---|------|------|-------|-------|
| 1 | Emily Ackman | Ward 1 | School Committee Chair | Re-elected Nov 2025 |
| 2 | Elizabeth (Liz) Eldridge | Ward 2 | School Committee Member | Newly elected Nov 2025; won over incumbent Ilana Krepchin |
| 3 | Michele Lippens | Ward 3 | School Committee Member | Newly elected Nov 2025 |
| 4 | Andre L. Green | Ward 4 | School Committee Member | Re-elected Nov 2025 |
| 5 | Laura Pitone | Ward 5 | School Committee Member | Re-elected Nov 2025 |
| 6 | Emma Stellman | Ward 6 | School Committee Member | Elected Nov 2025 (ran unopposed) |
| 7 | Leiran Biton | Ward 7 | School Committee Vice Chair | Re-elected Nov 2025 |
| 8 | Mayor Jake Wilson | ex-officio | Mayor (ex officio) | Reuses politician_id from migration 581 |
| 9 | Lance L. Davis | ex-officio | City Council President (ex officio) | Reuses politician_id from migration 581 |

**CRITICAL DIFFERENCE FROM NEWTON:** Somerville has TWO ex-officio members on School Committee (Mayor + Council President), not one. This means:
- The school committee migration must create TWO ex-officio office rows without new politician inserts
- The office_id back-fill UPDATE must exclude BOTH ex-officio external IDs
- There are 7 new politician rows for SC (not 8 like Newton) because Mayor + Council President are already seeded

**SC official district name:** 'Somerville Public Schools' for government.name

**Note on "Michele" vs "Michelle":** The official somerville.k12.ma.us page spells her name "Michele Lippens" (one L). Cambridgeday.com uses "Michelle." Use "Michele" per official SPS site.

---

## Key IDs and Schema Values

### City Government

| Field | Value | Source |
|-------|-------|--------|
| geo_id (city) | '2562535' | STATE.md; G4110 from v5.0 |
| governments.state | 'MA' (uppercase) | MA convention |
| districts.state | 'ma' (lowercase) | MA convention |
| offices.representing_state | 'MA' (uppercase) | MA convention |
| Government name | 'City of Somerville, Massachusetts, US' | Newton/Boston/Worcester pattern |
| Chamber name | 'City Council' | Official name |
| Chamber name_formal | 'Somerville City Council' | City pattern |
| LOCAL_EXEC district label | 'Somerville (Citywide)' | Newton/Worcester pattern |
| LOCAL district label | 'Somerville' | Newton/Worcester pattern |
| is_appointed | false | All elected |
| party | NULL | Antipartisan design |

### School District

| Field | Value | Source |
|-------|-------|--------|
| NCES LEAID | 2510890 | nces.ed.gov verified |
| geo_id (school) | '2510890' | LEAID value |
| G5420 geofence state | '25' | FIPS numeric string for MA |
| Government name | 'Somerville Public Schools, Massachusetts, US' | Newton pattern adapted |
| Chamber name | 'School Committee' | Official name |
| Chamber name_formal | 'Somerville School Committee' | Newton pattern adapted |
| district_type | 'SCHOOL' | NOT 'SCHOOL_DISTRICT' — critical |
| is_appointed | false (Ward 1–7 members) | All elected |

### External ID Scheme

| Range | Usage | Count |
|-------|-------|-------|
| -2562535001 | Mayor Jake Wilson | 1 |
| -2562535002..-2562535005 | 4 at-large councillors (Link, Mbah, Strezo, Wheeler) | 4 |
| -2562535006..-2562535012 | 7 ward councillors (Ward 1–7) | 7 |
| -2510890001..-2510890007 | 7 elected School Committee members (Ward 1–7) | 7 |
| ~~-2510890008~~ | Mayor Wilson ex-officio (NO new politician row — reuses -2562535001) | — |
| ~~-2510890009~~ | Council President Davis ex-officio (NO new politician row — reuses -2562535006 or whichever is Davis's external_id) | — |

**Total politicians to seed:** 1 Mayor + 4 at-large + 7 ward councillors + 7 SC members = **19 new politician rows**
- 2 additional OFFICE rows for SC ex-officio (Mayor + Council President reuse existing politician rows)
- Total offices: 1 (LOCAL_EXEC) + 11 (LOCAL) + 9 (SCHOOL) = 21

**External ID assignment for Council — alphabetical ordering within groups:**

City officials (suggested assignment):
- -2562535001: Jake Wilson (Mayor)
- -2562535002: Jon Link (at-large, alphabetical: Link)
- -2562535003: Wilfred N. Mbah (at-large, alphabetical: Mbah)
- -2562535004: Kristen Strezo (at-large, alphabetical: Strezo)
- -2562535005: Ben Wheeler (at-large, alphabetical: Wheeler)
- -2562535006: Lance L. Davis (Ward 6 — Council President first, then ward order)
  NOTE: Davis is Council President AND ex-officio on School Committee. His external_id must be known before migration 582.
  Recommend: assign Davis -2562535006 (first ward councillor in the list) or in ward number order -2562535009 (Ward 6).
  **Decision: assign in ward number order for clarity:**
- -2562535006: Matthew McLaughlin (Ward 1)
- -2562535007: Jefferson Thomas Scott (Ward 2)
- -2562535008: Ben Ewen-Campen (Ward 3)
- -2562535009: Jesse Clingan (Ward 4)
- -2562535010: Naima Sait (Ward 5)
- -2562535011: Lance L. Davis (Ward 6, Council President)
- -2562535012: Emily Hardt (Ward 7)

School Committee (ward number order):
- -2510890001: Emily Ackman (Ward 1, Chair)
- -2510890002: Elizabeth Eldridge (Ward 2)
- -2510890003: Michele Lippens (Ward 3)
- -2510890004: Andre L. Green (Ward 4)
- -2510890005: Laura Pitone (Ward 5)
- -2510890006: Emma Stellman (Ward 6)
- -2510890007: Leiran Biton (Ward 7, Vice Chair)

Ex-officio SC offices (no new politician rows):
- Mayor Wilson: reuses external_id=-2562535001; title='Mayor (ex officio)'
- Council President Davis: reuses external_id=-2562535011; title='City Council President (ex officio)'

---

## Migration Plan

| Migration | Description | Content |
|-----------|-------------|---------|
| **581** | Somerville city government | Mayor + 11 City Councillors (12 officials); chamber + 2 districts (LOCAL_EXEC + LOCAL); geo_id=2562535 |
| **582** | Somerville School Committee | G5420 geofence; government + chamber + SCHOOL district; 7 new SC politicians; 2 ex-officio office rows (Mayor + Council President); geo_id=2510890 |
| **583** | Somerville headshots | Python script + politician_images rows; best-effort from somervillema.gov |

**Pattern source for 581:** C:/EV-Accounts/backend/migrations/578_newton_city_government.sql
**Pattern source for 582:** C:/EV-Accounts/backend/migrations/579_newton_school_committee.sql (modified for TWO ex-officio blocks)
**Pattern source for 583:** C:/EV-Accounts/backend/migrations/580_newton_headshots.sql / 356_ma_tier2_headshots.sql

---

## Architecture Patterns

### Migration Structure

Three migrations following Newton wave pattern:

```
Migration 581: City of Somerville government (Mayor + 11 City Councillors)
Migration 582: Somerville Public Schools school committee (7 elected + 2 ex-officio)
Migration 583: Somerville headshots (Python script + SQL)
```

### City Government Pattern (Newton 578 / Worcester 351 model)

```sql
-- Pre-flight 1: Assert Somerville G4110 geofence present
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id = '2562535' AND mtfcc = 'G4110';
-- Expected: 1 (from v5.0)

-- Pre-flight 2: Assert government not already seeded
SELECT COUNT(*) FROM essentials.governments WHERE name = 'City of Somerville, Massachusetts, US';

-- Pre-flight 3: Assert external_id block clear
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2562535012 AND -2562535001;

-- Step 1: Government row
INSERT (name='City of Somerville, Massachusetts, US', type='LOCAL', state='MA', city='Somerville', geo_id='2562535')
WHERE NOT EXISTS on name

-- Step 2: City Council chamber (NO slug column)
INSERT (name='City Council', name_formal='Somerville City Council', government_id=...)
WHERE NOT EXISTS on (name, government_id)

-- Step 3a: LOCAL_EXEC district (Mayor)
district_type='LOCAL_EXEC', state='ma', geo_id='2562535', label='Somerville (Citywide)', mtfcc=NULL

-- Step 3b: LOCAL district (all 11 councillors)
district_type='LOCAL', state='ma', geo_id='2562535', label='Somerville', mtfcc=NULL

-- Step 4: 12 politician+office blocks (Mayor + 4 at-large + 7 ward)
-- Title format: 'Mayor' / 'City Councilor' (at-large) / 'City Councilor (Ward N)' (ward seat)

-- Step 5: office_id back-fill
-- Step 6: Post-verification DO block
-- Step 7: Ledger entry
```

### School Committee Pattern (Newton 579 model — extended for TWO ex-officio)

```sql
-- Step 0: Insert G5420 geofence
INSERT INTO essentials.geofence_boundaries (geo_id, mtfcc, state)
SELECT '2510890', 'G5420', '25'
WHERE NOT EXISTS (SELECT 1 FROM essentials.geofence_boundaries WHERE geo_id = '2510890' AND mtfcc = 'G5420')

-- Step 1: Government row (Somerville Public Schools)
-- Step 2: School Committee chamber
-- Step 3: SCHOOL district (geo_id='2510890', state='ma')
-- Step 4: 7 elected politician+office blocks (Ward 1-7, is_appointed=false)
-- Step 4b: Mayor ex-officio office (reuse politician external_id=-2562535001)
-- Step 4c: Council President ex-officio office (reuse politician external_id=-2562535011)
-- Step 5: office_id back-fill (SC elected members ONLY — exclude Mayor AND Council President)
-- Step 6: Post-verification DO block
-- Step 7: Ledger entry
```

**TWO ex-officio INSERT pattern (both follow same subquery structure):**

```sql
-- Mayor Wilson school committee office
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id, (chamber_subquery), p.id, 'Mayor (ex officio)', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN (SELECT id FROM essentials.politicians WHERE external_id = -2562535001) p
WHERE d.geo_id = '2510890' AND d.district_type = 'SCHOOL' AND d.state = 'ma'
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);

-- Council President Davis school committee office
INSERT INTO essentials.offices (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant, role_canonical)
SELECT gen_random_uuid(), d.id, (chamber_subquery), p.id, 'City Council President (ex officio)', 'MA', false, false, NULL
FROM essentials.districts d
CROSS JOIN (SELECT id FROM essentials.politicians WHERE external_id = -2562535011) p
WHERE d.geo_id = '2510890' AND d.district_type = 'SCHOOL' AND d.state = 'ma'
  AND NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.politician_id = p.id);
```

**office_id back-fill for SC migration MUST exclude both ex-officio external IDs:**

```sql
-- Back-fill only elected SC members (-2510890001 through -2510890007)
-- Do NOT include -2562535001 (Mayor) or -2562535011 (Council President)
UPDATE essentials.politicians p SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id BETWEEN -2510890007 AND -2510890001
  AND p.office_id IS NULL;
```

**Post-verification gate for Mayor + Council President office_id integrity:**
- Gate: Mayor Wilson's office_id still points to LOCAL_EXEC district (geo_id='2562535')
- Gate: Council President Davis's office_id still points to LOCAL district (geo_id='2562535')

### Office Title Conventions

| Role | Title String |
|------|-------------|
| Mayor | 'Mayor' |
| At-large City Councillor | 'City Councilor' |
| Ward City Councillor | 'City Councilor (Ward N)' where N = ward number |
| Council President | 'City Councilor (Ward 6)' for his city office; OR add 'City Council President' — see Pitfall 1 |
| School Committee member | 'School Committee Member' |
| School Committee Chair | 'School Committee Chair' |
| School Committee Vice Chair | 'School Committee Vice Chair' |
| Mayor in School Committee | 'Mayor (ex officio)' |
| Council President in School Committee | 'City Council President (ex officio)' |

**Note on Council President title for his city council office:** The official somervillema.gov page lists him as "Ward Six City Councilor, President." The office title in the city migration should be 'City Councilor (Ward 6)' — the "President" role is a council-internal officer title, not an office title from the city charter. The ex-officio SC office uses 'City Council President (ex officio)' to make his role clear.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image crop + resize | Custom logic | Pillow PIL (crop 4:5 → resize 600x750 Lanczos) | Existing pattern from Phase 109/117 |
| School district geofence | TIGER G5420 loader | Direct INSERT in migration | No MA G5420 rows loaded by TIGER loader; same as Newton |
| Ward geofences for council | ArcGIS/custom boundary loader | Encode ward in title string | Flat-district pattern (Newton/Worcester); no digital boundary needed |

---

## Headshot Sources Research

### Confirmed Accessible URLs (200 OK) [VERIFIED: curl HEAD checks 2026-06-14]

| Official | URL | Status |
|----------|-----|--------|
| Mayor Jake Wilson | `https://s3.amazonaws.com/somervillema-live/s3fs-public/JW_City_Hall_Steps.jpeg` | 200 |
| Matt McLaughlin (W1) | `https://www.somervillema.gov/sites/default/files/councilor-matt-mclaughlin-2022.jpg` | 200 |
| J.T. Scott (W2) | `https://www.somervillema.gov/sites/default/files/councilor-jt-scott-2022.jpg` | 200 |
| Ben Ewen-Campen (W3) | `https://www.somervillema.gov/sites/default/files/councilor-ben-ewen-campen-2022.jpg` | 200 |
| Jesse Clingan (W4) | `https://www.somervillema.gov/sites/default/files/councilor-jesse-clingan-2022.jpg` | 200 |
| Naima Sait (W5) | `https://s3.amazonaws.com/somervillema-live/s3fs-public/headshot-naima-sait.jpg` | 200 |
| Lance Davis (W6) | `https://www.somervillema.gov/sites/default/files/councilor-lance-davis-2022.jpg` | 200 |
| Wilfred N. Mbah (AL) | `https://s3.amazonaws.com/somervillema-live/s3fs-public/images/profile-councilor-mbah.jpg` | 200 |
| Kristen Strezo (AL) | `https://s3.amazonaws.com/somervillema-live/s3fs-public/images/profile-councilor-strezo.jpg` | 200 |

**Confirmed 9 of 12 city officials have accessible headshots.** Coverage: Mayor + 5 ward + 2 at-large = 9/12.

### Known Gaps (403 or not found)

| Official | Reason |
|----------|--------|
| Jon Link (at-large) | Newly elected Nov 2025 — no photo uploaded to city site yet |
| Ben Wheeler (at-large) | Newly elected Nov 2025 — no photo uploaded to city site yet |
| Emily Hardt (Ward 7) | Newly elected Nov 2025; ward-7 page on somervillema.gov still shows stale Judy Pineda Neufeld entry |

### Fallback Sources for Gap Officials

- **Jon Link**: campaign site jonforsomerville.com; Cambridge Day election coverage photos
- **Ben Wheeler**: campaign site benwheelerforsomerville.com; patch.com candidate profile
- **Emily Hardt**: campaign site emilyhardtforsomerville.com; thesomervilletimes.com City Council Spotlight article (2026)

### School Committee Headshots

No SC headshot URLs found on somervillema.gov or somerville.k12.ma.us. The SPS website shows one group photo only (no individual member photo links). [VERIFIED: somerville.k12.ma.us SC page fetched 2026-06-14]

SC headshot fallback sources:
- Emily Ackman: emilyackmanforward1 Facebook page; Ballotpedia
- Leiran Biton: leiran4somerville Facebook page; thesomervilletimes.com Spotlight article
- Elizabeth Eldridge: Somerville Special Education Parent Advisory Council sources
- Michele Lippens, Laura Pitone, Andre Green, Emma Stellman: local news election coverage photos

Expect 0-3 SC member headshots from these sources. SC headshot gaps are acceptable (best-effort per SOMERVILLE-02).

### CMS Pattern

somervillema.gov uses Drupal CMS (s3fs module). Two confirmed URL patterns:
1. `/sites/default/files/councilor-{firstname}-{lastname}-2022.jpg` — older members (Ward 1-6 + some at-large)
2. `https://s3.amazonaws.com/somervillema-live/s3fs-public/images/profile-councilor-{lastname}.jpg` — some members
3. `https://s3.amazonaws.com/somervillema-live/s3fs-public/headshot-{firstname}-{lastname}.jpg` — Mayor + Sait

The script should probe multiple patterns per official. The `-2022.jpg` suffix on the `/sites/default/files/` path is literal in the filename — newer members may get a different year suffix (e.g., `-2025.jpg`) once the city updates their pages.

---

## Common Pitfalls

### Pitfall 1: Council President title ambiguity
**What goes wrong:** Using 'City Council President' as Lance Davis's city council office title, creating a mismatch with other councillors
**Why it happens:** Davis is both Ward 6 Councillor AND Council President
**How to avoid:** Use 'City Councilor (Ward 6)' as his city government office title. Use 'City Council President (ex officio)' only for his School Committee ex-officio office. This is consistent with how the official somervillema.gov page presents him: "Councilor, Ward 6 and President."

### Pitfall 2: Only one ex-officio in School Committee migration
**What goes wrong:** Seeding only Mayor as ex-officio (copying Newton pattern literally) — missing City Council President
**Why it happens:** Newton has only one ex-officio (Mayor); Somerville has two
**How to avoid:** Somerville SC migration (582) must have TWO ex-officio blocks, not one. The back-fill UPDATE must exclude BOTH -2562535001 (Mayor) AND -2562535011 (Council President Davis)

### Pitfall 3: Using stale ward-7 page as source for Emily Hardt's headshot URL
**What goes wrong:** Script uses `/sites/default/files/councilor-emily-hardt-2022.jpg` (returns 403) — stale page shows Judy Pineda Neufeld photo, not Hardt
**Why it happens:** somervillema.gov/departments/city-council/ward-7 still shows Judy Pineda Neufeld (who resigned in summer 2025) as of June 2026
**How to avoid:** Emily Hardt's headshot is a known gap — use campaign site or news source. Do not attempt `/councilor-emily-hardt-2022.jpg` path; it returns 403.

### Pitfall 4: Seeding Mayor Wilson or Council President Davis twice in politicians table
**What goes wrong:** Inserting them as new politicians in migration 582 for the School Committee
**Why it happens:** SC migration template creates a new politician row per member
**How to avoid:** Use subquery on existing external_ids (-2562535001 for Mayor, -2562535011 for Davis) for both ex-officio office INSERTs. The politicians table should have exactly 19 rows from migrations 581+582 combined.

### Pitfall 5: office_id back-fill overwrites Mayor's or Davis's city office_ids
**What goes wrong:** Migration 582 back-fill sets their office_id to the SCHOOL office, overwriting the LOCAL_EXEC (Mayor) and LOCAL (Davis) office_ids from migration 581
**Why it happens:** Standard back-fill UPDATE matches on politician_id
**How to avoid:** SC back-fill UPDATE range must be -2510890001..-2510890007 only (7 elected SC members). Both -2562535001 and -2562535011 must be excluded.

### Pitfall 6: Wrong LEAID — don't confuse 2510890 with 2562535
**What goes wrong:** Using city geo_id='2562535' for the school committee SCHOOL district
**Why it happens:** City geo_id and school LEAID look similar
**How to avoid:** SC geo_id must be '2510890' (NCES LEAID). The routing query joins on district.geo_id — using city geo_id would break SCHOOL section routing.

### Pitfall 7: Including slug in chambers INSERT
**What goes wrong:** SQL error — slug is GENERATED ALWAYS on essentials.chambers
**How to avoid:** Never include slug in INSERT column list

### Pitfall 8: Katjana Ballantyne residual data
**What goes wrong:** Accidentally referencing Ballantyne in any migration context
**Why it happens:** ROADMAP listed her as "verify she is still in office" — she is NOT
**How to avoid:** Jake Wilson is Mayor (external_id=-2562535001). Ballantyne is out of office; do not seed her.

### Pitfall 9: "Michele" vs "Michelle" Lippens spelling
**What goes wrong:** Using "Michelle" (two Ls) in the database
**Why it happens:** Several news sources spell it "Michelle" but the official SPS page uses "Michele"
**How to avoid:** Use "Michele Lippens" (one L) per somerville.k12.ma.us

### Pitfall 10: essentials.governments WHERE NOT EXISTS guard
**What goes wrong:** Duplicate government rows for Somerville
**Why it happens:** essentials.governments has NO unique constraint on geo_id
**How to avoid:** Always use WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE name = 'City of Somerville, Massachusetts, US')

---

## Standard Stack

No new packages required. Phase uses existing project infrastructure only.

| Tool | Version | Purpose | Source |
|------|---------|---------|--------|
| mcp__supabase-local | — | Execute SQL migrations directly | Project standard |
| Python headshot script | 3.x | Download, crop 4:5, resize 600x750, upload to politician_photos bucket | Phase 109/117 pattern |
| Pillow (PIL) | existing | Image crop + resize | Project standard |
| supabase-py | existing | Supabase Storage upload | Project standard |
| requests | existing | HTTP download | Project standard |

## Package Legitimacy Audit

No new packages to install — phase uses existing project dependencies only.

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

---

## Runtime State Inventory

Greenfield seed phase — no existing Somerville government rows.

- **Stored data:** None. Confirmed: Somerville geo_id=2562535 exists only in geofence_boundaries (v5.0), not in governments/districts/offices/politicians. LEAID=2510890 not yet in any table.
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
| SOMERVILLE-01 | Somerville address returns LOCAL section | Integration (DB) | Section-split query + spot-check on Somerville address | N/A (DB-only) |
| SOMERVILLE-02 | Headshots at 600x750 in politician_photos | Manual | Python script + migration 583; verify rows in politician_images | N/A |

### DB Spot-Check Queries (post-migration verification)

**After migration 581:**
```sql
-- Count: 12 city officials
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2562535012 AND -2562535001;
-- Expected: 12

-- Count: 12 offices (1 LOCAL_EXEC + 11 LOCAL)
SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '2562535' AND d.state = 'ma';
-- Expected: 12

-- Section-split clean
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '2562535' AND gb.mtfcc = 'G4110'
  AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.state = 'ma');
-- Expected: 0

-- Mayor title check
SELECT title FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id = -2562535001;
-- Expected: 'Mayor'

-- Ward 6 title check
SELECT title FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id
WHERE p.external_id = -2562535011;
-- Expected: 'City Councilor (Ward 6)'
```

**After migration 582:**
```sql
-- Count: 7 elected SC politicians
SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2510890007 AND -2510890001;
-- Expected: 7

-- Count: 9 SCHOOL offices (7 elected + 2 ex-officio)
SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
WHERE d.geo_id = '2510890' AND d.district_type = 'SCHOOL' AND d.state = 'ma';
-- Expected: 9

-- G5420 geofence present
SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id = '2510890' AND mtfcc = 'G5420';
-- Expected: 1

-- School section-split clean
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.geo_id = '2510890' AND gb.mtfcc = 'G5420'
  AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.district_type = 'SCHOOL' AND d.state = 'ma');
-- Expected: 0

-- Mayor office_id still LOCAL_EXEC (not overwritten)
SELECT COUNT(*) FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id = -2562535001 AND d.district_type = 'LOCAL_EXEC' AND d.geo_id = '2562535';
-- Expected: 1

-- Council President office_id still LOCAL (not overwritten)
SELECT COUNT(*) FROM essentials.politicians p
JOIN essentials.offices o ON o.id = p.office_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id = -2562535011 AND d.district_type = 'LOCAL' AND d.geo_id = '2562535';
-- Expected: 1

-- Both ex-officio rows exist in SCHOOL district
SELECT o.title FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.politicians p ON p.id = o.politician_id
WHERE d.geo_id = '2510890' AND d.district_type = 'SCHOOL'
  AND p.external_id IN (-2562535001, -2562535011)
ORDER BY o.title;
-- Expected: 'City Council President (ex officio)', 'Mayor (ex officio)'
```

**After migration 583:**
```sql
-- Count uploaded headshots
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE (p.external_id BETWEEN -2562535012 AND -2562535001
    OR p.external_id BETWEEN -2510890007 AND -2510890001)
  AND pi.type = 'default';
-- Expected: matches UPLOADED count from script (minimum 9 city officials)

-- Verify no wrong type
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE (p.external_id BETWEEN -2562535012 AND -2562535001
    OR p.external_id BETWEEN -2510890007 AND -2510890001)
  AND pi.type != 'default';
-- Expected: 0
```

### Wave 0 Gaps

None — no new test files required. Post-verification is embedded in migration SQL.

---

## Security Domain

Phase is data migration only (SQL INSERT statements). No authentication, session, input validation, or cryptography concerns. ASVS V2/V3/V4/V6 do not apply. V5 satisfied by existing parameterized SQL patterns.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Jake Wilson uses "Jake Wilson" as his public name (not "Jacob D. Wilson") for DB entry | Mayor section | Minor — just a display name issue; easy UPDATE |
| A2 | Lance Davis's external_id is -2562535011 (Ward 6 in sequential ward-order numbering) | External ID scheme | Medium — if planner assigns a different order, the SC migration pre-flight guard that asserts Davis's external_id must be updated accordingly |
| A3 | somervillema.gov/sites/default/files/ headshot URLs (-2022.jpg suffix) will remain accessible during headshot script execution | Headshot sources | Low — URLs confirmed 200 in this session; unlikely to change |
| A4 | Jon Link, Ben Wheeler, Emily Hardt have campaign site photos that can be used as fallbacks | Headshot sources | Low — sites exist; actual photo quality/license may vary |
| A5 | "Michele Lippens" (one L) is the correct spelling | SC roster | Low — official SPS site uses one L; two-L "Michelle" would be a cosmetic error only |
| A6 | The May be the first MA Tier 3 city SC to have TWO ex-officio members; if the platform routing query treats SCHOOL offices differently than Newton expected, it may need investigation | SC routing | Medium — should be fine since SC routing joins on geo_id='2510890' regardless of how many ex-officio rows exist; but worth a spot-check of the resulting API response |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.
(Table is NOT empty — A2 and A6 are worth flagging to planner.)

---

## Open Questions

1. **Jake Wilson "Jake" vs. "Jacob D." in DB**
   - What we know: Legal name is Jacob D. Wilson; public name is Jake Wilson; city uses "Jake Wilson" on all official materials
   - Recommendation: Use full_name='Jake Wilson', first_name='Jake', last_name='Wilson'. If his office tenure is referenced in Phase 122 stances research, researchers will search for "Jake Wilson" not "Jacob Wilson."

2. **Lance Davis's external_id assignment**
   - What we know: He is Ward 6 Councillor AND Council President; his external_id must be known before migration 582 can seed his SC ex-officio office
   - Recommendation: Assign Davis external_id=-2562535011 (Ward 6 in sequential ward-order). The migration 582 should include a pre-flight gate asserting external_id=-2562535011 exists (analogous to Newton's "Mayor Laredo must exist" gate), not hard-coded but using ward-order numbering as documented here.

3. **School Committee API routing with two ex-officio members**
   - What we know: Newton had one ex-officio; Somerville has two; both are ex-officio and both have full voting rights
   - What's unclear: Whether the API/UI presents both ex-officio rows in the SCHOOL section, or only one
   - Recommendation: Seed both; verify in post-migration spot-check that API returns 9 school committee members for a Somerville address.

---

## Sources

### Primary (HIGH confidence)

- somervillema.gov/departments/city-council — 2026 council roster (fetched directly 2026-06-14)
- somervillema.gov/departments/city-council/ward-2 through ward-6 — individual councillor pages with headshot URLs (fetched 2026-06-14)
- somervillema.gov/content/councilor-ben-wheeler, /councilor-jon-link — confirmed existence (fetched 2026-06-14)
- somervillema.gov/content/councilor-emily-hardt — confirmed existence (fetched 2026-06-14)
- somerville.k12.ma.us/district-leadership/somerville-school-committee — 7 elected SC members + 2 ex-officio (fetched 2026-06-14)
- nces.ed.gov — LEAID=2510890 for Somerville Public Schools (fetched 2026-06-14)
- en.wikipedia.org/wiki/Jake_Wilson — full name Jacob D. Wilson; sworn in January 2, 2026
- thesomervilletimes.com/archives/144458 — "City Council re-elects Davis as President, Mbah as Vice President for 2026"
- STATE.md — geo_id=2562535, next migration=581 confirmed
- curl HEAD checks on headshot URLs — 9 confirmed 200 OK, 3 confirmed gaps (2026-06-14)

### Secondary (MEDIUM confidence)

- WebSearch results from multiple news sources (thesomervilletimes.com, tuftsdaily.com, cambridgeday.com) confirming Jake Wilson election, Emily Hardt Ward 7 election, council roster
- WebSearch result confirming Emily Ackman = SC Chair, Leiran Biton = SC Vice Chair
- WebSearch result confirming Mayor + City Council President are ex-officio with full voting rights

### Tertiary (LOW confidence)

- Campaign sites for Jon Link, Ben Wheeler, Emily Hardt as fallback headshot sources — existence confirmed via WebSearch but photo quality/availability not verified
- School Committee individual headshot availability from campaign/social media sources [ASSUMED]

---

## Metadata

**Confidence breakdown:**
- Government structure (Mayor, council count/type): HIGH — verified from official somervillema.gov
- Complete city council roster: HIGH — verified from official somervillema.gov 2026 page
- School committee roster: HIGH — verified from official somerville.k12.ma.us
- School committee ex-officio structure (two members): HIGH — verified from official SPS site
- NCES LEAID: HIGH — verified from nces.ed.gov
- Migration pattern: HIGH — directly based on applied migrations 578/579/580 (Newton, same milestone)
- Headshot URL accessibility: HIGH — verified via curl HEAD checks in this session
- Headshot gaps for new members: HIGH — confirmed 403 on all tried URL patterns

**Research date:** 2026-06-14
**Valid until:** 2027-01-01 (Somerville city elections are odd-year; next election November 2027)
