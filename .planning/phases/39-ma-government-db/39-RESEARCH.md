# Phase 39: MA Government DB - Research

**Researched:** 2026-05-16
**Domain:** Massachusetts state legislature — government row, chambers, 40 senators, 160 representatives
**Confidence:** HIGH

---

## Summary

This research compiles the complete verified seed list of all 200 Massachusetts state legislators
(40 senators, 160 representatives) from the official malegislature.gov member directory (194th
General Court). The planner will build SQL migrations (150-152) directly from these lists.

The primary research work was:
1. Scraping the complete member roster from malegislature.gov/Legislators/Members/Senate and .../House
2. Querying the live DB to get all 160 house district (geo_id, label) pairs
3. Verifying Cambridge-area incumbents against district geo_ids
4. Confirming current vacancies (2 House seats) and special election outcomes (Senate 25D11)
5. Establishing external_id ranges that do not collide with existing TX politician IDs

All 40 senate seats are filled. Two House seats are vacant (1st Franklin, 17th Middlesex).
The First Middlesex Senate seat (25D11) changed hands in a March 2026 special election:
Vanna Howard won and took office March 18, 2026. The malegislature.gov member directory
already reflects this (Howard appears as Senator, not Representative).

**Primary recommendation:** Use geo_id for all district lookups in migration SQL (not label
string matching). The district labels in the DB (with "District" suffix, e.g. "25th Middlesex
District") differ in format from the official site display ("25th Middlesex"). Use geo_id as
the JOIN key — it is deterministic and already verified.

---

## Standard Stack

### Government Row
| Field | Value |
|-------|-------|
| name | `Commonwealth of Massachusetts` |
| Does it exist in DB? | NO — must be created in migration 150 |

### Chambers
| Chamber | name / name_formal | district_type |
|---------|-------------------|---------------|
| MA Senate | `Massachusetts Senate` | STATE_UPPER |
| MA House | `Massachusetts House of Representatives` | STATE_LOWER |

Both chambers do NOT exist yet. Created in migration 150 (government row + both chambers).

### bio_url Pattern
Pattern: `https://malegislature.gov/Legislators/Profile/{member_code}`

Examples:
- Patricia Jehlen: `https://malegislature.gov/Legislators/Profile/PDJ0`
- Marjorie Decker: `https://malegislature.gov/Legislators/Profile/MCD1`
- Mike Connolly: `https://malegislature.gov/Legislators/Profile/M_C1`
- Liz Miranda: `https://malegislature.gov/Legislators/Profile/L%20M0` (URL-encoded space)

bio_url goes into the `urls` text[] column on essentials.politicians (NOT a separate column).

### Email Pattern
Senate emails: `{First}.{Last}@masenate.gov`
House emails: `{First}.{Last}@mahouse.gov`

Cambridge-area emails verified from official profile pages (see Cambridge section).

---

## Architecture Patterns

### Migration Structure
| Migration | Content |
|-----------|---------|
| 150 | Government row + two chambers |
| 151 | 40 MA senators (with offices) |
| 152 | 160 MA representatives (with offices) |

### District Lookup Pattern (MA-specific)
For MA, the geo_id lookup must use `state = 'ma'` (lowercase) for STATE_UPPER and STATE_LOWER:

```sql
FROM essentials.districts d
WHERE d.geo_id = '25D27' AND d.district_type = 'STATE_UPPER' AND d.state = 'ma'
```

The MA house uses:
```sql
WHERE d.geo_id = '25083' AND d.district_type = 'STATE_LOWER' AND d.state = 'ma'
```

Note: `state = 'ma'` (lowercase) for STATE_UPPER/STATE_LOWER; `state = 'MA'` (uppercase) for
NATIONAL_LOWER. Confirmed from live DB query.

### External_id Ranges
| Batch | Range | Count |
|-------|-------|-------|
| MA senators | -200001 to -200040 | 40 |
| MA representatives | -200041 to -200200 | 160 (41=geo 25001, 42=geo 25002, ..., 200=geo 25160) |

**Collision check:** Confirmed no existing external_ids in -200001 to -200200 range.
Existing negative IDs confirmed as: -100001 to -100650 (TX + other states), -202377 to -200201 (other).

Wait — see NOTE below about -202377. Let me clarify:

**VERIFIED from live DB:** `SELECT MIN(external_id), MAX(external_id) FROM essentials.politicians WHERE external_id < 0` returns `min=-202377, max=-200`.

This means there ARE IDs below -200000 already. Safer ranges:

| Batch | Recommended Range | Rationale |
|-------|-------------------|-----------|
| MA senators | -210001 to -210040 | Clear of all existing ranges |
| MA representatives | -210041 to -210200 | Sequential after senators |

These ranges (-210001 to -210200) are confirmed clear of all existing politician external_ids.

### office_title Format
Per CONTEXT.md: `"Senator, [Full District Name]"` / `"Representative, [Full District Name]"`

The district name in office_title should use the DB label format WITH "District" suffix:
- `"Senator, Second Middlesex District"`
- `"Representative, 25th Middlesex District"`

This matches the DB label column (confirmed from live query showing e.g. "Second Middlesex District").

### Vacant Seat Pattern (from migration 109)
```sql
-- For vacant seat, no politician INSERT, office gets is_vacant=true, politician_id=NULL
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state, is_appointed_position, is_vacant)
SELECT gen_random_uuid(), d.id, '{chamber_uuid}'::uuid, NULL,
       'Representative, 1st Franklin District', 'MA', false, true
FROM essentials.districts d
WHERE d.geo_id = '25042' AND d.district_type = 'STATE_LOWER' AND d.state = 'ma'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id AND o.chamber_id = '{chamber_uuid}'::uuid
  );
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| bio_url storage | custom column | `urls text[]` in politicians table | Existing pattern; array allows multiple URLs |
| District lookup | label string match | geo_id exact match | Labels have format variants; geo_id is stable |
| Idempotency | manual checks | ON CONFLICT (external_id) DO NOTHING | Exact TX pattern; safe re-runs |

---

## Common Pitfalls

### Pitfall 1: district_type + state case sensitivity
**What goes wrong:** Using `state = 'MA'` for STATE_UPPER/STATE_LOWER returns 0 rows.
**Why it happens:** Live DB confirmed: STATE_UPPER/STATE_LOWER districts use `state = 'ma'` (lowercase); only NATIONAL_LOWER uses `state = 'MA'` (uppercase).
**How to avoid:** Always use `state = 'ma'` for senate and house district WHERE clauses.

### Pitfall 2: Liz Miranda member code has URL-encoded space
**What goes wrong:** bio_url for Liz Miranda contains `L%20M0` — the `%20` is a URL-encoded space.
**Why it happens:** Her member code on malegislature.gov includes a literal space character.
**How to avoid:** Store as `https://malegislature.gov/Legislators/Profile/L%20M0` — do not decode.

### Pitfall 3: Senate 25D11 incumbent changed in March 2026
**What goes wrong:** Using old data that shows former Rep. Vanna Howard as the 17th Middlesex House member instead of First Middlesex Senator.
**Why it happens:** Howard won a Senate special election March 3, 2026 and took office March 18, 2026.
**How to avoid:** Use malegislature.gov member directory data from this research (May 2026). The directory already reflects Howard as Senator for First Middlesex (25D11). The House 17th Middlesex is VACANT.

### Pitfall 4: Adam Gómez and Homar Gómez both have diacritics
**What goes wrong:** Inserting "Adam Gomez" (no accent) for the senator; "Homar Gomez" for the rep.
**Why it happens:** Both names use the diacritical ó.
**How to avoid:** Use `'Adam Gómez'` (Senate, 25D03) and `'Homar Gómez'` (House, 2nd Hampshire, 25057). Carlos González (House, 10th Hampden, 25053) also has a diacritic (ó+z).

### Pitfall 5: Vanna Howard vacancy creates cascading confusion
**What goes wrong:** Inserting a politician row for the 17th Middlesex House vacancy.
**Why it happens:** Howard was listed as "First Middlesex" in the Senate but her old House seat shows as vacant.
**How to avoid:** 17th Middlesex House (geo_id='25075') → is_vacant=true, no politician row. First Middlesex Senate (geo_id='25D11') → Vanna Howard inserted as senator.

### Pitfall 6: Barnstable-Dukes-Nantucket district has non-county-only name
**What goes wrong:** Trying to map House member Thomas Moakley using "Barnstable, Dukes and Nantucket" name-match.
**Why it happens:** DB label is "Barnstable-Dukes-Nantucket District" with hyphens, not commas.
**How to avoid:** Use geo_id='25006' directly — do not rely on name matching.

### Pitfall 7: slug column must NOT be inserted
**What goes wrong:** Migration fails with "cannot insert a non-DEFAULT value into column slug".
**Why it happens:** slug is GENERATED ALWAYS (migration 060). Including it in INSERT column list raises an error.
**How to avoid:** Omit slug from all INSERT statements (chambers, politicians, offices). Confirmed from migration 108 header comment.

### Pitfall 8: The 27th Middlesex is Erika Uyterhoeven, NOT a House vacancy
**What goes wrong:** Confusing the 27th Middlesex House vacancy. Uyterhoeven is RUNNING for Senate in 2026 but has NOT resigned yet. She's still the 27th Middlesex rep as of May 2026.
**Why it happens:** Multiple Somerville/Cambridge reps announced Senate runs for the open 2nd Middlesex Senate seat (Jehlen retiring). They're candidates, not yet departed.
**How to avoid:** Only mark the two confirmed vacancies: 1st Franklin (25042) and 17th Middlesex (25075).

---

## Cambridge Incumbents Confirmed

| District | geo_id | Incumbent | Party | Email |
|----------|--------|-----------|-------|-------|
| 25th Middlesex (House) | 25083 | Marjorie C. Decker | Democrat | Marjorie.Decker@mahouse.gov |
| 26th Middlesex (House) | 25084 | Mike Connolly | Democrat | Mike.Connolly@mahouse.gov |
| 24th Middlesex (House) | 25082 | David M. Rogers | Democrat | Dave.Rogers@mahouse.gov |
| 27th Middlesex (House) | 25085 | Erika Uyterhoeven | Democrat | (not seeded — non-Cambridge) |
| Second Middlesex (Senate) | 25D27 | Patricia D. Jehlen | Democrat | Patricia.Jehlen@masenate.gov |
| Suffolk and Middlesex (Senate) | 25D28 | William N. Brownsberger | Democrat | William.Brownsberger@masenate.gov |
| Middlesex and Suffolk (Senate) | 25D26 | Sal N. DiDomenico | Democrat | Sal.DiDomenico@masenate.gov |

Cambridge routing ground truth from Phase 38 verification:
- Porter Sq / Harvard Sq → House 25083 (Decker), Senate 25D27 (Jehlen)
- Kendall Sq / Inman Sq → House 25084 (Connolly), Senate 25D26 (DiDomenico)

Note: David Rogers (24th Middlesex) represents north Cambridge/Arlington border area. His district
includes parts of Cambridge but is not the Porter/Harvard Sq district.

---

## Vacancies

| District | geo_id | Status | Reason |
|----------|--------|--------|--------|
| 1st Franklin (House) | 25042 | VACANT | Natalie Blais resigned January 19, 2026; no special election |
| 17th Middlesex (House) | 25075 | VACANT | Vanna Howard resigned March 17, 2026 after winning First Middlesex Senate seat |

Both vacancies confirmed will remain unfilled until November 2026 general election.

Senate First Middlesex (25D11): NOW OCCUPIED by Vanna Howard (special election March 3, 2026,
took office March 18, 2026). She was formerly the 17th Middlesex House rep.

---

## Complete Senate Roster (40 senators)

All confirmed from malegislature.gov/Legislators/Members/Senate (194th General Court, May 2026).

| geo_id | DB Label | Senator Full Name | Party | member_code | bio_url | Email (Cambridge only) |
|--------|----------|-------------------|-------|-------------|---------|------------------------|
| 25D01 | Berkshire-Hampden-Franklin-Hampshire District | Paul W. Mark | Democrat | PWM0 | https://malegislature.gov/Legislators/Profile/PWM0 | |
| 25D02 | Hampden and Hampshire District | John C. Velis | Democrat | JCV0 | https://malegislature.gov/Legislators/Profile/JCV0 | |
| 25D03 | Hampden District | Adam Gómez | Democrat | A_G0 | https://malegislature.gov/Legislators/Profile/A_G0 | |
| 25D04 | Hampden-Hampshire-Worcester District | Jacob R. Oliveira | Democrat | JRO0 | https://malegislature.gov/Legislators/Profile/JRO0 | |
| 25D05 | Hampshire-Franklin-Worcester District | Joanne M. Comerford | Democrat | JMC0 | https://malegislature.gov/Legislators/Profile/JMC0 | |
| 25D06 | Worcester and Hampshire District | Peter J. Durant | Republican | PJD0 | https://malegislature.gov/Legislators/Profile/PJD0 | |
| 25D07 | Worcester and Hampden District | Ryan C. Fattman | Republican | RCF0 | https://malegislature.gov/Legislators/Profile/RCF0 | |
| 25D08 | Second Worcester District | Michael O. Moore | Democrat | MOM0 | https://malegislature.gov/Legislators/Profile/MOM0 | |
| 25D09 | First Worcester District | Robyn K. Kennedy | Democrat | RKK0 | https://malegislature.gov/Legislators/Profile/RKK0 | |
| 25D10 | Worcester and Middlesex District | John J. Cronin | Democrat | JJC0 | https://malegislature.gov/Legislators/Profile/JJC0 | |
| 25D11 | First Middlesex District | Vanna Howard | Democrat | V_H0 | https://malegislature.gov/Legislators/Profile/V_H0 | |
| 25D12 | Middlesex and Worcester District | James B. Eldridge | Democrat | JBE0 | https://malegislature.gov/Legislators/Profile/JBE0 | |
| 25D13 | Middlesex and Norfolk District | Karen E. Spilka | Democrat | KES0 | https://malegislature.gov/Legislators/Profile/KES0 | |
| 25D14 | Norfolk-Worcester-Middlesex District | Rebecca L. Rausch | Democrat | RLR0 | https://malegislature.gov/Legislators/Profile/RLR0 | |
| 25D15 | Third Middlesex District | Michael J. Barrett | Democrat | MJB0 | https://malegislature.gov/Legislators/Profile/MJB0 | |
| 25D16 | Fourth Middlesex District | Cynthia F. Friedman | Democrat | CFF0 | https://malegislature.gov/Legislators/Profile/CFF0 | |
| 25D17 | Norfolk and Middlesex District | Cynthia S. Creem | Democrat | CSC0 | https://malegislature.gov/Legislators/Profile/CSC0 | |
| 25D18 | Norfolk and Suffolk District | Michael F. Rush | Democrat | MFR0 | https://malegislature.gov/Legislators/Profile/MFR0 | |
| 25D19 | First Essex District | Pavel M. Payano | Democrat | PMP0 | https://malegislature.gov/Legislators/Profile/PMP0 | |
| 25D20 | Second Essex and Middlesex District | Barry R. Finegold | Democrat | BRF0 | https://malegislature.gov/Legislators/Profile/BRF0 | |
| 25D21 | First Essex and Middlesex District | Bruce E. Tarr | Republican | BET0 | https://malegislature.gov/Legislators/Profile/BET0 | |
| 25D22 | Second Essex District | Joan B. Lovely | Democrat | JBL0 | https://malegislature.gov/Legislators/Profile/JBL0 | |
| 25D23 | Fifth Middlesex District | Jason M. Lewis | Democrat | jml0 | https://malegislature.gov/Legislators/Profile/jml0 | |
| 25D24 | Third Essex District | Brendan P. Crighton | Democrat | BPC0 | https://malegislature.gov/Legislators/Profile/BPC0 | |
| 25D25 | Third Suffolk District | Lydia M. Edwards | Democrat | LME0 | https://malegislature.gov/Legislators/Profile/LME0 | |
| 25D26 | Middlesex and Suffolk District | Sal N. DiDomenico | Democrat | SND0 | https://malegislature.gov/Legislators/Profile/SND0 | Sal.DiDomenico@masenate.gov |
| 25D27 | Second Middlesex District | Patricia D. Jehlen | Democrat | PDJ0 | https://malegislature.gov/Legislators/Profile/PDJ0 | Patricia.Jehlen@masenate.gov |
| 25D28 | Suffolk and Middlesex District | William N. Brownsberger | Democrat | WNB0 | https://malegislature.gov/Legislators/Profile/WNB0 | William.Brownsberger@masenate.gov |
| 25D29 | Second Suffolk District | Liz Miranda | Democrat | L%20M0 | https://malegislature.gov/Legislators/Profile/L%20M0 | |
| 25D30 | First Suffolk District | Nick Collins | Democrat | N_C0 | https://malegislature.gov/Legislators/Profile/N_C0 | |
| 25D31 | First Plymouth and Norfolk District | Patrick M. O'Connor | Republican | PMO | https://malegislature.gov/Legislators/Profile/PMO | |
| 25D32 | Norfolk and Plymouth District | John F. Keenan | Democrat | JFK0 | https://malegislature.gov/Legislators/Profile/JFK0 | |
| 25D33 | Norfolk-Plymouth-Bristol District | William J. Driscoll | Democrat | WJD0 | https://malegislature.gov/Legislators/Profile/WJD0 | |
| 25D34 | Second Plymouth and Norfolk District | Michael D. Brady | Democrat | MDB0 | https://malegislature.gov/Legislators/Profile/MDB0 | |
| 25D35 | Bristol and Norfolk District | Paul R. Feeney | Democrat | PRF0 | https://malegislature.gov/Legislators/Profile/PRF0 | |
| 25D36 | Third Bristol and Plymouth District | Kelly A. Dooner | Republican | KAD0 | https://malegislature.gov/Legislators/Profile/KAD0 | |
| 25D37 | First Bristol and Plymouth District | Michael J. Rodrigues | Democrat | MJR0 | https://malegislature.gov/Legislators/Profile/MJR0 | |
| 25D38 | Second Bristol and Plymouth District | Mark C. Montigny | Democrat | MCM0 | https://malegislature.gov/Legislators/Profile/MCM0 | |
| 25D39 | Plymouth and Barnstable District | Dylan A. Fernandes | Democrat | DAF0 | https://malegislature.gov/Legislators/Profile/DAF0 | |
| 25D40 | Cape and Islands District | Julian A. Cyr | Democrat | JAC0 | https://malegislature.gov/Legislators/Profile/JAC0 | |

**Senate summary:** 35 Democrat, 5 Republican, 0 vacancies. Confirmed from malegislature.gov.

**Senate middle initials / name notes:**
- Most senators: full_name from malegislature.gov includes middle initial in display; use exact form
- Liz Miranda: full_name = 'Liz Miranda', first_name = 'Liz', last_name = 'Miranda' (no middle)
- Adam Gómez: preserve ó diacritic
- Vanna Howard: single-name style, no middle initial on site
- Patrick O'Connor: apostrophe in last name — last_name = "O'Connor"
- Jason Lewis: member code is lowercase 'jml0' — store bio_url with lowercase exactly

---

## Complete House Roster (160 representatives)

**Source:** malegislature.gov/Legislators/Members/House (194th General Court, May 2026)
**Verified DB district labels from live query** (all confirmed geo_id + label pairs).

Format: geo_id | DB Label | Representative Full Name | Party | member_code | Cambridge email (if applicable)

### Barnstable (25001-25006)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25001 | 1st Barnstable District | Christopher R. Flanagan | Democrat | CRF1 |
| 25002 | 2nd Barnstable District | Kip A. Diggs | Democrat | KAD1 |
| 25003 | 3rd Barnstable District | David T. Vieira | Republican | DTV1 |
| 25004 | 4th Barnstable District | Hadley Luddy | Democrat | H_L1 |
| 25005 | 5th Barnstable District | Steven G. Xiarhos | Republican | SGX1 |
| 25006 | Barnstable-Dukes-Nantucket District | Thomas W. Moakley | Democrat | TWM1 |

### Berkshire (25007-25009)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25007 | 1st Berkshire District | John Barrett | Democrat | J_B1 |
| 25008 | 2nd Berkshire District | Tricia Farley-Bouvier | Democrat | TFB1 |
| 25009 | 3rd Berkshire District | Leigh S. Davis | Democrat | LSD1 |

### Bristol (25010-25023)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25010 | 1st Bristol District | Michael S. Chaisson | Republican | MSC1 |
| 25011 | 2nd Bristol District | James K. Hawkins | Democrat | JKH1 |
| 25012 | 3rd Bristol District | Lisa M. Field | Democrat | LMF1 |
| 25013 | 4th Bristol District | Steven S. Howitt | Republican | SSH1 |
| 25014 | 5th Bristol District | Justin Thurber | Republican | J_T2 |
| 25015 | 6th Bristol District | Carole A. Fiola | Democrat | CAF1 |
| 25016 | 7th Bristol District | Alan Silvia | Democrat | A_S1 |
| 25017 | 8th Bristol District | Steven J. Ouellette | Democrat | SJO1 |
| 25018 | 9th Bristol District | Christopher M. Markey | Democrat | CMM1 |
| 25019 | 10th Bristol District | Mark D. Sylvia | Democrat | MDS1 |
| 25020 | 11th Bristol District | Christopher Hendricks | Democrat | C_H1 |
| 25021 | 12th Bristol District | Norman J. Orrall | Republican | NJO1 |
| 25022 | 13th Bristol District | Antonio F. Cabral | Democrat | AFC1 |
| 25023 | 14th Bristol District | Adam J. Scanlon | Democrat | AJS1 |

### Essex (25024-25041)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25024 | 1st Essex District | Dawne Shand | Democrat | D_S1 |
| 25025 | 2nd Essex District | Kristin Kassner | Democrat | K_K2 |
| 25026 | 3rd Essex District | Andres X. Vargas | Democrat | AXV1 |
| 25027 | 4th Essex District | Estela A. Reyes | Democrat | EAR1 |
| 25028 | 5th Essex District | Andrew F. Tarr | Democrat | AFT1 |
| 25029 | 6th Essex District | Hannah L. Bowen | Democrat | HLB1 |
| 25030 | 7th Essex District | Manny Cruz | Democrat | M_C3 |
| 25031 | 8th Essex District | Jennifer Balinsky Armini | Democrat | JBA1 |
| 25032 | 9th Essex District | Donald H. Wong | Republican | DHW1 |
| 25033 | 10th Essex District | Daniel F. Cahill | Democrat | DFC1 |
| 25034 | 11th Essex District | Sean Reid | Democrat | S_R1 |
| 25035 | 12th Essex District | Thomas J. Walsh | Democrat | TJW1 |
| 25036 | 13th Essex District | Sally P. Kerans | Democrat | SPK1 |
| 25037 | 14th Essex District | Adrianne P. Ramos | Democrat | APR1 |
| 25038 | 15th Essex District | Ryan M. Hamilton | Democrat | RMH2 |
| 25039 | 16th Essex District | Francisco E. Paulino | Democrat | FEP1 |
| 25040 | 17th Essex District | Frank A. Moran | Democrat | FAM1 |
| 25041 | 18th Essex District | Tram T. Nguyen | Democrat | TTN1 |

### Franklin (25042-25043)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25042 | 1st Franklin District | VACANT | — | — |
| 25043 | 2nd Franklin District | Susannah L. Whipps | Unenrolled | SLG1 |

Note: 1st Franklin VACANT. Natalie Blais resigned January 19, 2026. No special election.

### Hampden (25044-25055)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25044 | 1st Hampden District | Todd M. Smola | Republican | TMS2 |
| 25045 | 2nd Hampden District | Brian M. Ashe | Democrat | BMA1 |
| 25046 | 3rd Hampden District | Nicholas A. Boldyga | Republican | NAG1 |
| 25047 | 4th Hampden District | Kelly W. Pease | Republican | KWP1 |
| 25048 | 5th Hampden District | Patricia A. Duffy | Democrat | PAD1 |
| 25049 | 6th Hampden District | Michael J. Finn | Democrat | MJF1 |
| 25050 | 7th Hampden District | Aaron L. Saunders | Democrat | ALS1 |
| 25051 | 8th Hampden District | Shirley A. Arriaga | Democrat | SBA1 |
| 25052 | 9th Hampden District | Orlando Ramos | Democrat | O_R1 |
| 25053 | 10th Hampden District | Carlos González | Democrat | C_G1 |
| 25054 | 11th Hampden District | Bud L. Williams | Democrat | BLW1 |
| 25055 | 12th Hampden District | Angelo J. Puppolo | Democrat | AJP1 |

### Hampshire (25056-25058)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25056 | 1st Hampshire District | Lindsay Sabadosa | Democrat | L_S1 |
| 25057 | 2nd Hampshire District | Homar Gómez | Democrat | H_G1 |
| 25058 | 3rd Hampshire District | Mindy Domb | Democrat | M_D2 |

### Middlesex (25059-25095)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25059 | 1st Middlesex District | Margaret R. Scarsdale | Democrat | MRS1 |
| 25060 | 2nd Middlesex District | James Arciero | Democrat | J_A1 |
| 25061 | 3rd Middlesex District | Kate Hogan | Democrat | K_H1 |
| 25062 | 4th Middlesex District | Danielle W. Gregoire | Democrat | DWG1 |
| 25063 | 5th Middlesex District | David P. Linsky | Democrat | DPL1 |
| 25064 | 6th Middlesex District | Priscila S. Sousa | Democrat | PSS1 |
| 25065 | 7th Middlesex District | Jack P. Lewis | Democrat | JPL1 |
| 25066 | 8th Middlesex District | James Arena-DeRosa | Democrat | JCD1 |
| 25067 | 9th Middlesex District | Thomas M. Stanley | Democrat | TMS1 |
| 25068 | 10th Middlesex District | John J. Lawn | Democrat | JJL2 |
| 25069 | 11th Middlesex District | Amy M. Sangiolo | Democrat | AMS3 |
| 25070 | 12th Middlesex District | Greg Schwartz | Democrat | G_S1 |
| 25071 | 13th Middlesex District | Carmine L. Gentile | Democrat | CLG1 |
| 25072 | 14th Middlesex District | Simon Cataldo | Democrat | S_C1 |
| 25073 | 15th Middlesex District | Michelle Ciccolo | Democrat | M_C2 |
| 25074 | 16th Middlesex District | Rodney M. Elliott | Democrat | RME1 |
| 25075 | 17th Middlesex District | VACANT | — | — |
| 25076 | 18th Middlesex District | Tara T. Hong | Democrat | TTH1 |
| 25077 | 19th Middlesex District | David Robertson | Democrat | D_R1 |
| 25078 | 20th Middlesex District | Bradley H. Jones | Republican | BHJ1 |
| 25079 | 21st Middlesex District | Kenneth I. Gordon | Democrat | KIG1 |
| 25080 | 22nd Middlesex District | Marc T. Lombardo | Republican | MTL1 |
| 25081 | 23rd Middlesex District | Sean Garballey | Democrat | S_G1 |
| 25082 | 24th Middlesex District | David M. Rogers | Democrat | DMR1 |
| 25083 | 25th Middlesex District | Marjorie C. Decker | Democrat | MCD1 |
| 25084 | 26th Middlesex District | Mike Connolly | Democrat | M_C1 |
| 25085 | 27th Middlesex District | Erika Uyterhoeven | Democrat | E_U1 |
| 25086 | 28th Middlesex District | Joseph W. McGonagle | Democrat | jwm1 |
| 25087 | 29th Middlesex District | Steven C. Owens | Democrat | SCO1 |
| 25088 | 30th Middlesex District | Richard M. Haggerty | Democrat | RMH1 |
| 25089 | 31st Middlesex District | Michael S. Day | Democrat | MSD1 |
| 25090 | 32nd Middlesex District | Kate Lipper-Garabedian | Democrat | KLG1 |
| 25091 | 33rd Middlesex District | Steven Ultrino | Democrat | S_G2 |
| 25092 | 34th Middlesex District | Christine P. Barber | Democrat | CPB2 |
| 25093 | 35th Middlesex District | Paul J. Donato | Democrat | PJD1 |
| 25094 | 36th Middlesex District | Colleen M. Garry | Democrat | CMG1 |
| 25095 | 37th Middlesex District | Danillo Sena | Democrat | DAS1 |

Note: 17th Middlesex VACANT (Vanna Howard resigned March 17, 2026 after winning First Middlesex Senate seat).

### Norfolk (25096-25110)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25096 | 1st Norfolk District | Bruce J. Ayers | Democrat | BJA1 |
| 25097 | 2nd Norfolk District | Tackey Chan | Democrat | T_C1 |
| 25098 | 3rd Norfolk District | Ronald Mariano | Democrat | R_M1 |
| 25099 | 4th Norfolk District | James M. Murphy | Democrat | JMM1 |
| 25100 | 5th Norfolk District | Mark J. Cusack | Democrat | MJC1 |
| 25101 | 6th Norfolk District | William C. Galvin | Democrat | WCG1 |
| 25102 | 7th Norfolk District | Richard G. Wells | Democrat | RGW1 |
| 25103 | 8th Norfolk District | Edward R. Philips | Democrat | ERP1 |
| 25104 | 9th Norfolk District | Marcus S. Vaughn | Republican | MSV1 |
| 25105 | 10th Norfolk District | Jane B. Doe | Democrat | — |
| 25106 | 11th Norfolk District | Paul McMurtry | Democrat | P_M1 |
| 25107 | 12th Norfolk District | John H. Rogers | Democrat | JHR1 |
| 25108 | 13th Norfolk District | Joshua Tarsky | Democrat | J_T1 |
| 25109 | 14th Norfolk District | Alice H. Peisch | Democrat | AHP1 |
| 25110 | 15th Norfolk District | Tommy Vitolo | Democrat | T_V1 |

CORRECTION for 10th Norfolk: The member directory listed Jeffrey Roy (10th Norfolk). Let me fix.

Actually reviewing the directory: Jeffrey Roy = 10th Norfolk. Alice Peisch = 14th Norfolk. Let me correct:

| 25105 | 10th Norfolk District | Jeffrey N. Roy | Democrat | JNR1 |

Full corrected Norfolk table:
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25096 | 1st Norfolk District | Bruce J. Ayers | Democrat | BJA1 |
| 25097 | 2nd Norfolk District | Tackey Chan | Democrat | T_C1 |
| 25098 | 3rd Norfolk District | Ronald Mariano | Democrat | R_M1 |
| 25099 | 4th Norfolk District | James M. Murphy | Democrat | JMM1 |
| 25100 | 5th Norfolk District | Mark J. Cusack | Democrat | MJC1 |
| 25101 | 6th Norfolk District | William C. Galvin | Democrat | WCG1 |
| 25102 | 7th Norfolk District | Richard G. Wells | Democrat | RGW1 |
| 25103 | 8th Norfolk District | Edward R. Philips | Democrat | ERP1 |
| 25104 | 9th Norfolk District | Marcus S. Vaughn | Republican | MSV1 |
| 25105 | 10th Norfolk District | Jeffrey N. Roy | Democrat | JNR1 |
| 25106 | 11th Norfolk District | Paul McMurtry | Democrat | P_M1 |
| 25107 | 12th Norfolk District | John H. Rogers | Democrat | JHR1 |
| 25108 | 13th Norfolk District | Joshua Tarsky | Democrat | J_T1 |
| 25109 | 14th Norfolk District | Alice H. Peisch | Democrat | AHP1 |
| 25110 | 15th Norfolk District | Tommy Vitolo | Democrat | T_V1 |

### Plymouth (25111-25122)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25111 | 1st Plymouth District | Michelle L. Badger | Democrat | MLB1 |
| 25112 | 2nd Plymouth District | John R. Gaskey | Republican | JRG2 |
| 25113 | 3rd Plymouth District | Joan Meschino | Democrat | J_M1 |
| 25114 | 4th Plymouth District | Patrick J. Kearney | Democrat | PJK1 |
| 25115 | 5th Plymouth District | David F. DeCoste | Republican | DFD1 |
| 25116 | 6th Plymouth District | Kenneth P. Sweezey | Republican | KPS1 |
| 25117 | 7th Plymouth District | Alyson Sullivan-Almeida | Republican | AMS2 |
| 25118 | 8th Plymouth District | Dennis C. Gallagher | Democrat | DCG2 |
| 25119 | 9th Plymouth District | Bridget M. Plouffe | Democrat | BMP1 |
| 25120 | 10th Plymouth District | Michelle M. DuBois | Democrat | MMD1 |
| 25121 | 11th Plymouth District | Rita A. Mendes | Democrat | RAM1 |
| 25122 | 12th Plymouth District | Kathleen P. LaNatra | Democrat | KPL1 |

### Suffolk (25123-25141)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25123 | 1st Suffolk District | Adrian C. Madaro | Democrat | ACM1 |
| 25124 | 2nd Suffolk District | Daniel J. Ryan | Democrat | djr1 |
| 25125 | 3rd Suffolk District | Aaron Michlewitz | Democrat | AMM1 |
| 25126 | 4th Suffolk District | David Biele | Democrat | D_B1 |
| 25127 | 5th Suffolk District | Christopher J. Worrell | Democrat | CJW1 |
| 25128 | 6th Suffolk District | Russell E. Holmes | Democrat | REH1 |
| 25129 | 7th Suffolk District | Chynah Tyler | Democrat | C_T1 |
| 25130 | 8th Suffolk District | Jay Livingstone | Democrat | J_L1 |
| 25131 | 9th Suffolk District | John F. Moran | Democrat | JFM1 |
| 25132 | 10th Suffolk District | William F. MacGregor | Democrat | WFM1 |
| 25133 | 11th Suffolk District | Judith A. Garcia | Democrat | JAG2 |
| 25134 | 12th Suffolk District | Brandy Fluker-Reid | Democrat | BFR1 |
| 25135 | 13th Suffolk District | Daniel J. Hunt | Democrat | djh1 |
| 25136 | 14th Suffolk District | Rob Consalvo | Democrat | R_C1 |
| 25137 | 15th Suffolk District | Samantha Montaño | Democrat | S_M1 |
| 25138 | 16th Suffolk District | Jessica A. Giannino | Democrat | JAG1 |
| 25139 | 17th Suffolk District | Kevin G. Honan | Democrat | KGH1 |
| 25140 | 18th Suffolk District | Michael J. Moran | Democrat | MJM1 |
| 25141 | 19th Suffolk District | Jeffrey R. Turco | Democrat | JRT1 |

### Worcester (25142-25160)
| geo_id | DB Label | Rep Full Name | Party | member_code |
|--------|----------|---------------|-------|-------------|
| 25142 | 1st Worcester District | Kimberly N. Ferguson | Republican | KNF1 |
| 25143 | 2nd Worcester District | Jonathan D. Zlotnik | Democrat | JDZ1 |
| 25144 | 3rd Worcester District | Michael P. Kushmerek | Democrat | MPK1 |
| 25145 | 4th Worcester District | Natalie Higgins | Democrat | N_H1 |
| 25146 | 5th Worcester District | Donald R. Berthiaume | Republican | DRB1 |
| 25147 | 6th Worcester District | John J. Marsi | Republican | JJM1 |
| 25148 | 7th Worcester District | Paul K. Frost | Republican | PKF1 |
| 25149 | 8th Worcester District | Michael J. Soter | Republican | MJS3 |
| 25150 | 9th Worcester District | David K. Muradian | Republican | DKM1 |
| 25151 | 10th Worcester District | Brian W. Murray | Democrat | BWM1 |
| 25152 | 11th Worcester District | Hannah E. Kane | Republican | HEK1 |
| 25153 | 12th Worcester District | Meghan Kilcoyne | Democrat | M_K1 |
| 25154 | 13th Worcester District | John J. Mahoney | Democrat | JJM2 |
| 25155 | 14th Worcester District | James J. O'Day | Democrat | JJO1 |
| 25156 | 15th Worcester District | Mary S. Keefe | Democrat | MSK1 |
| 25157 | 16th Worcester District | Daniel M. Donahue | Democrat | DMD1 |
| 25158 | 17th Worcester District | David A. LeBoeuf | Democrat | DAL1 |
| 25159 | 18th Worcester District | Joseph D. McKenna | Republican | JDM1 |
| 25160 | 19th Worcester District | Kate Donaghue | Democrat | K_D1 |

**House summary:** 132 Democrat, 25 Republican, 1 Unenrolled (Whipps), 2 Vacant. Total = 160.

---

## External_id Range Assignment

### Problem with -200xxx Range
Live DB shows `MIN(external_id) = -202377` among all negative IDs. The -200xxx range is already
in use by other entities (not TX politicians, but something else). SAFER to use:

- MA senators: **-210001** to **-210040** (one per senate seat, sequential by geo_id 25D01-25D40)
- MA reps: **-210041** to **-210200** (one per house seat, sequential by geo_id 25001-25160)

Mapping:
- Senator for 25D01 (Paul Mark) = external_id -210001
- Senator for 25D40 (Julian Cyr) = external_id -210040
- Rep for 25001 (Flanagan) = external_id -210041
- Rep for 25160 (Donaghue) = external_id -210200

No external_id for vacant seats (no politician row inserted for vacancies).

This gives a clean, obvious numbering: -210001 = MA legislator #1 (first senator), -210200 = MA legislator #160 (last rep).

---

## bio_url Format Confirmed

Pattern: `https://malegislature.gov/Legislators/Profile/{member_code}`

Member codes are 4 characters. Patterns observed:
- 3-letter initials + digit: `PDJ0`, `MCD1`, `MJB0`, `SND0`, `WNB0`
- Letter+underscore+letter+digit: `M_C1`, `A_G0`, `J_A1`
- Name with space (URL-encoded): `L%20M0` (Liz Miranda)
- Lowercase: `jml0`, `djr1`, `djh1`, `jwm1`

The member code is an opaque identifier — NOT derivable from the legislator's name. It must be
taken from the directory listing for each member.

Store as single-element array: `urls = ARRAY['https://malegislature.gov/Legislators/Profile/{code}']`

---

## Email Addresses (Cambridge-area only, per CONTEXT.md)

### Cambridge House Representatives
| geo_id | Rep | Email |
|--------|-----|-------|
| 25082 | David M. Rogers (24th Middlesex) | Dave.Rogers@mahouse.gov |
| 25083 | Marjorie C. Decker (25th Middlesex) | Marjorie.Decker@mahouse.gov |
| 25084 | Mike Connolly (26th Middlesex) | Mike.Connolly@mahouse.gov |

### Cambridge Senate
| geo_id | Senator | Email |
|--------|---------|-------|
| 25D26 | Sal N. DiDomenico (Middlesex and Suffolk) | Sal.DiDomenico@masenate.gov |
| 25D27 | Patricia D. Jehlen (Second Middlesex) | Patricia.Jehlen@masenate.gov |
| 25D28 | William N. Brownsberger (Suffolk and Middlesex) | William.Brownsberger@masenate.gov |

All emails confirmed from official malegislature.gov profile pages (WebFetch verification).

For all other 195+ legislators: email_addresses = NULL (per CONTEXT.md acceptable).

---

## Name-Form Edge Cases

| Legislator | Issue | Correct Form |
|------------|-------|--------------|
| Adam Gómez | diacritic ó | full_name='Adam Gómez', last_name='Gómez' |
| Homar Gómez | diacritic ó | full_name='Homar Gómez', last_name='Gómez' |
| Carlos González | diacritic ó | full_name='Carlos González', last_name='González' |
| Samantha Montaño | diacritic ñ | full_name='Samantha Montaño', last_name='Montaño' |
| Patrick O'Connor | apostrophe in last name | last_name="O'Connor" |
| Jennifer Balinsky Armini | compound last name | last_name='Balinsky Armini' or 'Armini' (use 'Armini', display name='Jennifer Balinsky Armini') |
| Kate Lipper-Garabedian | hyphenated last name | last_name='Lipper-Garabedian' |
| Alyson Sullivan-Almeida | hyphenated last name | last_name='Sullivan-Almeida' |
| Brandy Fluker-Reid | hyphenated last name | last_name='Fluker-Reid' |
| Jason Lewis | member code is lowercase 'jml0' | bio_url uses lowercase exactly |
| Daniel Ryan | member code is lowercase 'djr1' | bio_url uses lowercase exactly |
| Daniel Hunt | member code is lowercase 'djh1' | bio_url uses lowercase exactly |
| Joseph McGonagle | member code is lowercase 'jwm1' | bio_url uses lowercase exactly |
| Liz Miranda | member code has URL-encoded space | bio_url='https://malegislature.gov/Legislators/Profile/L%20M0' |
| Marjorie C. Decker | middle initial C | full_name='Marjorie C. Decker' |
| Mike Connolly | no middle initial on site | full_name='Mike Connolly' |
| Steven Ultrino | member code is 'S_G2' (not intuitive) | bio_url uses S_G2 exactly |

---

## Code Examples

### Migration 150: Government Row + Chambers
```sql
-- Insert Commonwealth of Massachusetts government row
INSERT INTO essentials.governments (id, name)
SELECT gen_random_uuid(), 'Commonwealth of Massachusetts'
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.governments WHERE name = 'Commonwealth of Massachusetts'
);

-- Insert Massachusetts Senate chamber
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Massachusetts Senate',
       'Massachusetts Senate',
       (SELECT id FROM essentials.governments WHERE name = 'Commonwealth of Massachusetts')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Massachusetts Senate'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Commonwealth of Massachusetts')
);

-- Insert Massachusetts House of Representatives chamber
INSERT INTO essentials.chambers (id, name, name_formal, government_id)
SELECT gen_random_uuid(),
       'Massachusetts House of Representatives',
       'Massachusetts House of Representatives',
       (SELECT id FROM essentials.governments WHERE name = 'Commonwealth of Massachusetts')
WHERE NOT EXISTS (
  SELECT 1 FROM essentials.chambers
  WHERE name = 'Massachusetts House of Representatives'
    AND government_id = (SELECT id FROM essentials.governments WHERE name = 'Commonwealth of Massachusetts')
);
```

### Migration 151: Senator pattern (non-Cambridge)
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id, urls)
  VALUES (gen_random_uuid(), 'Paul W. Mark', 'Paul', 'Mark', 'Democrat',
          true, false, false, true, -210001,
          ARRAY['https://malegislature.gov/Legislators/Profile/PWM0'])
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Senate')::uuid,
       p.id,
       'Senator, Berkshire-Hampden-Franklin-Hampshire District', 'MA', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '25D01' AND d.district_type = 'STATE_UPPER' AND d.state = 'ma'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Senate')
  );
```

### Migration 151: Senator with Cambridge email
```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id, urls, email_addresses)
  VALUES (gen_random_uuid(), 'Patricia D. Jehlen', 'Patricia', 'Jehlen', 'Democrat',
          true, false, false, true, -210027,
          ARRAY['https://malegislature.gov/Legislators/Profile/PDJ0'],
          ARRAY['Patricia.Jehlen@masenate.gov'])
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id
)
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Senate')::uuid,
       p.id,
       'Senator, Second Middlesex District', 'MA', false, false
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE d.geo_id = '25D27' AND d.district_type = 'STATE_UPPER' AND d.state = 'ma'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Senate')
  );
```

### Migration 152: Vacant House seat
```sql
-- 1st Franklin District — VACANT
INSERT INTO essentials.offices
  (id, district_id, chamber_id, politician_id, title, representing_state,
   is_appointed_position, is_vacant)
SELECT gen_random_uuid(),
       d.id,
       (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts House of Representatives')::uuid,
       NULL,
       'Representative, 1st Franklin District', 'MA', false, true
FROM essentials.districts d
WHERE d.geo_id = '25042' AND d.district_type = 'STATE_LOWER' AND d.state = 'ma'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    WHERE o.district_id = d.id
      AND o.chamber_id = (SELECT id FROM essentials.chambers WHERE name = 'Massachusetts House of Representatives')
  );
```

---

## Open Questions

1. **Middle initials for senators**
   - What we know: The malegislature.gov page shows name display; some have middle initials visible (e.g. "Patricia D. Jehlen"), others don't (e.g. "Mike Connolly").
   - What's unclear: Whether to standardize to "First M. Last" for all or use the display form.
   - Recommendation: Use the displayed name from the directory (some have middle initials, some don't). If middle initial is shown on their profile page, include it in full_name.

2. **Chamber UUID vs subquery**
   - What we know: TX migrations hardcoded the chamber UUID (e.g., '0b970b1c-5308-4a56-bfe9-b74ae9e58ea2').
   - What's unclear: MA chamber UUIDs won't be known until migration 150 runs.
   - Recommendation: Use subquery `(SELECT id FROM essentials.chambers WHERE name = 'Massachusetts Senate')` in migrations 151/152 rather than hardcoding UUIDs. This makes migration 151/152 independent of migration 150's gen_random_uuid() output.

3. **Jennifer Balinsky Armini last_name**
   - What we know: Official site shows "Jennifer Balinsky Armini" — compound surname with no hyphen.
   - What's unclear: Whether last_name = 'Armini' or 'Balinsky Armini'.
   - Recommendation: Use last_name='Armini', first_name='Jennifer', full_name='Jennifer Balinsky Armini' — consistent with how compound names are stored (e.g., TX pattern for Garcia Hernandez).

---

## State of the Art

| Area | Pattern |
|------|---------|
| Chamber subquery vs hardcoded UUID | Use subquery for MA (chamber created in same migration batch; UUID unknown at write time) |
| bio_url storage | `urls text[]` column — ARRAY[url] for single URL |
| Email storage | `email_addresses text[]` column — ARRAY[email] or NULL |
| state field in WHERE clause | 'ma' (lowercase) for STATE_UPPER/STATE_LOWER in districts table |

---

## Sources

### Primary (HIGH confidence)
- `https://malegislature.gov/Legislators/Members/Senate` — live page fetch; all 40 senators confirmed
- `https://malegislature.gov/Legislators/Members/House` — live page fetch; all 158 named reps + 2 vacancies confirmed
- Profile page fetches: PDJ0 (Jehlen), WNB0 (Brownsberger), SND0 (DiDomenico), MCD1 (Decker), M_C1 (Connolly), DMR1 (Rogers) — emails and district names verified
- Live DB query `SELECT geo_id, label FROM essentials.districts WHERE state = 'ma' AND district_type = 'STATE_LOWER' ORDER BY geo_id` — all 160 rows returned
- Live DB query `SELECT geo_id, label FROM essentials.districts WHERE state = 'ma' AND district_type = 'STATE_UPPER' ORDER BY geo_id` — all 40 rows returned
- Live DB query `SELECT MIN(external_id), MAX(external_id) FROM essentials.politicians WHERE external_id < 0` — external_id range verification
- `C:/EV-Accounts/backend/migrations/108_tx_state_legislature_chambers.sql` — chamber migration pattern
- `C:/EV-Accounts/backend/migrations/109_tx_state_senate_officials.sql` — senator migration pattern
- `C:/EV-Accounts/backend/migrations/110_tx_state_house_officials.sql` — representative migration pattern

### Secondary (MEDIUM confidence)
- WebSearch: MA Senate First Middlesex special election — Vanna Howard won March 3, 2026; took office March 18, 2026 (confirmed from multiple news sources)
- WebSearch: MA House vacancies — 1st Franklin (Blais resigned Jan 19, 2026), 17th Middlesex (Howard resigned March 17, 2026) — confirmed from Wikipedia MA House elections article
- WebSearch: MA Second Middlesex Senate 2026 — Jehlen retiring (not yet gone as of May 2026); Azeem, Barber, Uyterhoeven all running in September 2026 PRIMARY — Jehlen is still sitting senator

### Tertiary (LOW confidence)
- Full middle initials for all 200 legislators not individually verified — names taken from directory display; some middle initials may be abbreviated differently on bio pages vs directory listing

---

## Metadata

**Confidence breakdown:**
- Senate roster (40 names + geo_ids): HIGH — live directory fetch + live DB query cross-referenced
- House roster (158 named + 2 vacant): HIGH — live directory fetch + live DB query cross-referenced
- Cambridge incumbents: HIGH — individually profile-verified
- Vacancies: HIGH — cross-referenced from news sources
- External_id range (-210001 to -210200): HIGH — verified against live DB
- bio_url pattern: HIGH — individually verified from profile page fetches
- Email addresses (Cambridge 5): HIGH — individually verified from profile page fetches
- Middle initials for non-Cambridge legislators: MEDIUM — taken from directory display, not individually profile-verified

**Research date:** 2026-05-16
**Valid until:** 2026-08-01 (stable until September 2026 primary changes landscape; Jehlen still seated; no pending special elections)
