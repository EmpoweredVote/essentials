# Phase 14: Tier 2 Officials — Allen, Frisco, Murphy, Celina, Prosper, Richardson - Research

**Researched:** 2026-05-01
**Domain:** Data seeding — essentials.politicians for six Tier 2 Collin County cities, linked to Phase 12 offices
**Confidence:** HIGH for roster names and governance structure; MEDIUM for term dates; LOW for most individual email addresses

---

## Summary

Phase 14 seeds current incumbent mayor and council members for Allen, Frisco, Murphy, Celina, Prosper, and Richardson into `essentials.politicians`, following the exact same schema and SQL pattern as Phase 13 (Plano + McKinney). This is pure SQL migration work: three migrations covering the six cities.

**Critical election timing note:** Today is May 1, 2026. The May 2, 2026 Texas uniform election affects Allen (Mayor + Place 2), Frisco (Mayor + Place 5 + Place 6), Murphy (Mayor + Place 3 + Place 5), and Celina (Mayor + Place 4 + Place 5). Election results will not be available until the evening of May 2. These rosters CANNOT be finalized until official city websites update after the election. Prosper's May races were cancelled (uncontested declarations already issued). Richardson has NO council races in May 2026 (only bond + charter amendment on the ballot). See per-city flags below.

The established pattern from Phase 13 applies unchanged: one `DO $$` block per politician, lookup office via `geo_id + o.title` JOIN, INSERT into `essentials.politicians`, UPDATE `essentials.offices SET politician_id`. Three migrations: 094 (Allen + Frisco), 095 (Richardson), 096 (Murphy + Celina + Prosper).

**Primary recommendation:** Do not write SQL for Allen, Frisco, Murphy, or Celina until city roster pages confirm post-election incumbents (expected May 3-5, 2026). Write Richardson and Prosper immediately — neither has May 2 council races.

---

## Migration Context

**Next migration numbers:** 094, 095, 096 (confirmed — 093 was McKinney email backfill).
Verify before writing: `ls /c/EV-Accounts/backend/migrations/ | sort | tail -5`

**geo_ids and DB office titles** (from migrations 088 + 089, already applied):

| City | geo_id | DB Office Titles |
|------|--------|-----------------|
| Allen | `4801924` | Mayor; Council Member Place 1–6 |
| Frisco | `4827684` | Mayor; Council Member Place 1–6 |
| Murphy | `4850100` | Mayor; Council Member Place 1–6 |
| Celina | `4813684` | Mayor; Council Member Place 1–6 |
| Prosper | `4863276` | Mayor; Council Member Place 1–6 |
| Richardson | `4863500` | Mayor; Council Member District 1–4; Council Member Place 5–6 |

**Richardson title quirk:** Richardson officially calls all seats "Place 1" through "Place 6" (they are all elected at-large, with Places 1-4 having district residency requirements). However, migration 089 used `'Council Member District 1'` through `'Council Member District 4'` for Places 1-4. The lookup in migration 096 MUST use the DB titles (`'Council Member District 1'`, etc.), not Richardson's official terminology. See Richardson Quirks section below.

---

## City-by-City Research

---

### ALLEN, TX

**geo_id:** `4801924`
**Source:** https://www.cityofallen.org/917/Allen-City-Council (fetched 2026-05-01)

#### Roster (pre-May 2, 2026 election)

| DB Office Title | Name | Email (confirmed mailto:) | Bio URL | Term |
|----------------|------|--------------------------|---------|------|
| Mayor | Baine Brooks | bbrooks@allentx.gov | https://www.cityofallen.org/business_detail_T4_R16.php | 2023–2026 |
| Council Member Place 1 | Michael Schaeffer | michael.schaeffer@allentx.gov | https://www.cityofallen.org/business_detail_T4_R21.php | 2024–2027 |
| Council Member Place 2 | Tommy Baril | tommy.baril@allentx.gov | https://www.cityofallen.org/business_detail_T4_R78.php | 2023–2026 |
| Council Member Place 3 | Ken Cook | ken.cook@allentx.gov | https://www.cityofallen.org/business_detail_T4_R82.php | 2024–2027 |
| Council Member Place 4 | Amy Gnadt | amy.gnadt@allentx.gov | https://www.cityofallen.org/business_detail_T4_R83.php | 2025–2028 |
| Council Member Place 5 | Carl Clemencich | carl.clemencich@allentx.gov | https://www.cityofallen.org/business_detail_T4_R92.php | 2024–2027 |
| Council Member Place 6 | Ben Trahan | ben.trahan@allentx.gov | https://www.cityofallen.org/business_detail_T4_R86.php | 2025–2028 |

All 7 seats filled. Emails confirmed as mailto: links on the official city council page. Email pattern: `{firstname}.{lastname}@allentx.gov` (all lowercase, dot separator).

**Confidence:** HIGH for names and emails (confirmed from official mailto: links); MEDIUM for exact term dates (years confirmed, exact start day not shown).

#### Governance Structure

Council-manager form (approved by voters 1979). Mayor + 6 council members, all elected at-large citywide, staggered 3-year terms.

#### May 3, 2026 Ballot — FLAG FOR POST-ELECTION VERIFICATION

**Mayor:** Term-limited (Baine Brooks cannot run again). Open race: Chris Schulmeister vs. Dave Shafer. Winner = new Mayor incumbent.

**Place 2:** Tommy Baril is the only filed candidate — declared elected (unopposed). Tommy Baril continues as Place 2 incumbent with a new term (2026–2029).

**WAIT before seeding:** Mayor seat must be seeded after official results confirm winner. The city roster page (cityofallen.org/917/Allen-City-Council) will update within 1-3 days after the election.

**Seats NOT on ballot:** Places 1, 3, 4, 5, 6 — these incumbents can be seeded immediately.

#### Quirks

Standard structure, with one note: Allen uses a hyphenated-format email (`{firstname}.{lastname}@allentx.gov`), unlike some cities. The domain is `allentx.gov`, not `cityofallen.org`. Both domains serve the city, but emails use `allentx.gov`.

No vacant seats. No unusual structural features. Council is entirely at-large.

---

### FRISCO, TX

**geo_id:** `4827684`
**Source:** https://www.friscotexas.gov/585/City-Council and https://www.friscotexas.gov/directory.aspx?did=38 (fetched 2026-05-01)

#### Roster (pre-May 2, 2026 election)

| DB Office Title | Name | Email | Bio URL | Term |
|----------------|------|-------|---------|------|
| Mayor | Jeff Cheney | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=477 | 2023–2026 |
| Council Member Place 1 | Ann Anderson | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=925 | Jan 2026–2029 |
| Council Member Place 2 | Burt Thakur | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=888 | 2024–2027 |
| Council Member Place 3 | Angelia Pelham | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=683 | 2025–2028 |
| Council Member Place 4 | Jared Elad | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=190 | 2025–2028 |
| Council Member Place 5 | Laura Rummel | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=189 | 2023–2026 |
| Council Member Place 6 | Brian Livingston | CloudFlare-protected | https://www.friscotexas.gov/directory.aspx?EID=484 | 2023–2026 |

All 7 seats currently filled. Frisco emails are CloudFlare-protected on all council pages — cannot be confirmed as mailto: links. `email_addresses = NULL` for all Frisco rows. Use directory bio URLs instead.

**Confidence:** HIGH for names and bio URLs; LOW for term dates (general election cycle confirmed, exact years estimated from term structure).

**Special election note:** Ann Anderson won a special election on January 31, 2026 (Place 1 vacancy after previous member resigned October 27, 2025). She was sworn in February 2026. Her term runs through the Place 1 regular cycle (next regular Place 1 election).

#### Governance Structure

Council-manager form. Mayor + 6 council members, all elected at-large citywide, staggered 3-year terms. Meetings 1st and 3rd Tuesday monthly.

#### May 3, 2026 Ballot — FLAG FOR POST-ELECTION VERIFICATION

**Mayor:** Jeff Cheney (incumbent, first elected 2017, reelected 2023) is running for reelection. Challengers: John Keating, Shona Sowell, Rod Vilhauer, Mark Hill. Winner may be Cheney or a new person.

**Place 5:** Laura Rummel (incumbent) vs. Sreekanth Reddy, Vijay Karthik. Winner = new Place 5 incumbent.

**Place 6:** Brian Livingston (incumbent) vs. Brittany Colberg, Sai Krishnarajanagar, Matt Chalmers, Jerry Spencer. Winner = new Place 6 incumbent.

**WAIT before seeding:** Mayor, Place 5, and Place 6 must be seeded after official results confirm winners. Frisco's roster page will update within 1-3 days after the election.

**Seats NOT on ballot:** Places 1, 2, 3, 4 — these incumbents can be seeded immediately.

#### Quirks

**Place 1 special election context:** Ann Anderson's valid_from should be approximately February 2026 (sworn in after January 31, 2026 special election). Use `'2026-02-01'` with `term_date_precision = 'month'`. Her valid_to should align with the normal Place 1 cycle; Place 1 regular terms are on the same cycle as Place 4 (both last regular elections in May 2025 per the 3-year staggered pattern, but Place 1 was vacated, so her term runs to whenever Place 1 is next regularly scheduled — likely 2028).

No other structural quirks. Standard at-large council.

---

### MURPHY, TX

**geo_id:** `4850100`
**Source:** https://www.murphytx.org/1961/City-Council and https://www.murphytx.org/Directory.aspx?did=5 (fetched 2026-05-01)

#### Roster (pre-May 2, 2026 election)

| DB Office Title | Name | Email | Bio URL | Term |
|----------------|------|-------|---------|------|
| Mayor | Scott Bradley | Not listed on city site | https://www.murphytx.org/Directory.aspx?EID=6 | — |
| Council Member Place 1 | Elizabeth Abraham | Not listed | https://www.murphytx.org/Directory.aspx?EID=7 | — |
| Council Member Place 2 | Scott Smith | Not listed | https://www.murphytx.org/Directory.aspx?EID=8 | — |
| Council Member Place 3 | Andrew Chase | Not listed | https://www.murphytx.org/Directory.aspx?EID=10 | — |
| Council Member Place 4 | Ken Oltmann | Not listed | https://www.murphytx.org/Directory.aspx?EID=9 | — |
| Council Member Place 5 | Laura Deel | Not listed | https://www.murphytx.org/Directory.aspx?EID=11 | — |
| Council Member Place 6 | Jené Butler | Not listed | https://www.murphytx.org/Directory.aspx?EID=12 | — |

All 7 seats filled. Murphy city website does not expose individual email addresses for council members anywhere publicly (no mailto: links on council page, contact council page returns 404). `email_addresses = NULL` for all Murphy rows. Use bio directory URLs.

**Name note:** Jené Butler — the accent is consistent across all sources. Store as `first_name='Jené'`, `full_name='Jené Butler'`.

**Confidence:** HIGH for names (confirmed from official city directory); LOW for term dates (not published on city website); LOW for emails (none found).

#### Governance Structure

Council-manager form. Mayor + 6 council members, all elected at-large. Meetings 1st and 3rd Tuesdays at 6:00 PM. City hall: 206 N. Murphy Road, Murphy TX 75094.

#### May 3, 2026 Ballot — FLAG FOR POST-ELECTION VERIFICATION

**Mayor:** Scott Bradley is the sole candidate — declared elected (unopposed). He continues as Mayor.

**Place 3:** Andrew Chase (incumbent) vs. Deborah Ison. Winner = new Place 3 incumbent.

**Place 5:** Laura Deel (incumbent) vs. Manoj Varghese, Kevin Kelley, Sarah Fincanon. Winner = new Place 5 incumbent.

**WAIT before seeding:** Place 3 and Place 5 must be seeded after official results confirm winners. Murphy city roster page (murphytx.org/1961/City-Council) will update within 1-3 days after the election.

**Seats NOT on ballot:** Mayor, Places 1, 2, 4, 6 — these can be seeded immediately.

#### Quirks

Standard structure, no unusual features. Murphy's Place 6 incumbent is named "Jené Butler" (accent on the é). City website consistently uses the accent.

Term dates are not published on the Murphy city website. Use approximate term dates based on Texas municipal election cycle (3-year terms, elections in May of odd-numbered years): if elected in May 2025, term ends ~May 2028; if elected in May 2024, term ends ~May 2027; etc. Use `term_date_precision = 'month'` for all Murphy rows.

---

### CELINA, TX

**geo_id:** `4813684`
**Source:** https://www.celina-tx.gov/319/City-Council (official site is celina-tx.gov, NOT celinatx.gov) (fetched 2026-05-01)

#### Roster (pre-May 2, 2026 election)

| DB Office Title | Name | Email | Bio URL | Term |
|----------------|------|-------|---------|------|
| Mayor | Ryan Tubbs | rtubbs@celina-tx.gov (confirmed from official bio page) | https://www.celina-tx.gov/295/Office-of-the-Mayor | 2023–2026 |
| Council Member Place 1 | Philip Ferguson | Not found | https://www.celina-tx.gov/Directory.aspx?did=4 | — |
| Council Member Place 2 | Eddie Cawlfield | Not found | https://www.celina-tx.gov/Directory.aspx?did=4 | — |
| Council Member Place 3 | Andy Hopkins | Not found | https://www.celina-tx.gov/Directory.aspx?did=4 | — |
| Council Member Place 4 | Wendie Wigginton | Not found | https://www.celina-tx.gov/Directory.aspx?did=4 | 2023–2026 |
| Council Member Place 5 | Mindy Koehne | Not found | https://www.celina-tx.gov/Directory.aspx?did=4 | 2023–2026 |
| Council Member Place 6 | Brandon Grumbles | Not found | https://www.celina-tx.gov/Directory.aspx?did=4 | — |

**Individual bio URL pattern:** Celina's council directory links to individual EID pages, but individual EID numbers were not captured from the city directory. Use the council directory page as the bio URL for council members where individual EID is unknown.

**Mayor email confirmed:** `rtubbs@celina-tx.gov` — found as plain text on the official Office of the Mayor page. This is the only confirmed individual email for Celina. All other members: `email_addresses = NULL`.

**Confidence:** HIGH for names (confirmed from official city website and TML directory); MEDIUM for Mayor email (confirmed from official bio page); LOW for other emails (not found); MEDIUM for term dates (cycle analysis only).

#### Governance Structure

Home-Rule Municipality. Mayor + 6 council members (Places 1–6). All elected directly by community, 3-year terms. Meetings 2nd Tuesday at 6:30 PM (Executive Session 5:00 PM), City Council Chambers, 112 N Colorado Street, Celina TX 75009. City hall: 142 N Ohio St, (972) 382-2682.

#### May 3, 2026 Ballot — FLAG FOR POST-ELECTION VERIFICATION

**Mayor (Place):** Ryan Tubbs (incumbent) vs. Erica Cornelius, Eric Becker. Winner = new Mayor incumbent.

**Place 4:** OPEN SEAT — Wendie Wigginton withdrew from the race on Feb 13, 2026. Candidates: Katie Dunn vs. Shea Scott. Winner = new Place 4 incumbent (not Wigginton).

**Place 5:** OPEN SEAT — Mindy Koehne did not file for re-election. Candidates: Brent Baty vs. Shane Lambert (Mathew Eberius also filed but withdrew). Winner = new Place 5 incumbent (not Koehne).

**WAIT before seeding:** Mayor, Place 4, and Place 5 must be seeded after official results confirm winners. The city roster page (celina-tx.gov/319/City-Council) will update within 1-3 days after the election.

**Seats NOT on ballot:** Places 1, 2, 3, 6 — these incumbents can be seeded immediately.

#### Quirks

**URL warning:** Celina's official website is `celina-tx.gov` (with a hyphen). There is a CivicClerk portal at `celinatx.gov` (no hyphen) and a `celinatx.gov/government/city-council` path that failed (ECONNREFUSED) during research. Always use `celina-tx.gov` for the official city website.

**Place 4 and Place 5 are open seats:** Both current incumbents (Wendie Wigginton and Mindy Koehne) are not running. New officeholders will be determined by the May 2 election. Do NOT seed Wigginton or Koehne as active incumbents.

Standard governance structure otherwise — no unusual quirks beyond the above.

---

### PROSPER, TX

**geo_id:** `4863276`
**Note:** Prosper is legally a **Town**, not a City. Governing body is the "Town Council" (not City Council). DB chamber name was created as 'Town Council' / 'Prosper Town Council' in migration 089.
**Source:** https://www.prospertx.gov/223/Town-Council and individual directory pages (fetched 2026-05-01)

#### Roster (current as of May 1, 2026)

| DB Office Title | Name | Email | Bio URL | Term Ends |
|----------------|------|-------|---------|-----------|
| Mayor | David F. Bristol | Not listed | https://www.prospertx.gov/directory.aspx?EID=63 | May 2028 |
| Council Member Place 1 | Marcus E. Ray | Not listed | https://www.prospertx.gov/directory.aspx?EID=64 | May 2028 |
| Council Member Place 2 | Craig Andres | Not listed | https://www.prospertx.gov/directory.aspx?EID=65 | May 2027 |
| Council Member Place 3 | Amy Bartley | Not listed | https://www.prospertx.gov/directory.aspx?EID=66 | May 2026 → declared re-elected |
| Council Member Place 4 | Chris Kern | Not listed | https://www.prospertx.gov/directory.aspx?EID=67 | May 2028 |
| Council Member Place 5 | Jeff Hodges | Not listed | https://www.prospertx.gov/directory.aspx?EID=68 | May 2026 → NOT filing; Doug Charles succeeds |
| Council Member Place 6 | Cameron Reeves | Not listed | https://www.prospertx.gov/directory.aspx?EID=69 | May 2027 |

No email addresses published on Prosper's council directory. `email_addresses = NULL` for all Prosper rows. Individual bio pages confirmed as functioning (verified via EID pages). All pages reachable at `prospertx.gov/directory.aspx?EID=XX`.

**Confidence:** HIGH for names (confirmed from official directory + TML); HIGH for term dates (confirmed from individual bio pages); LOW for emails (not published).

#### Governance Structure

Home Rule Town. Mayor + 6 council members (Places 1–6), all elected at-large, 3-year terms. Meetings 2nd and 4th Tuesdays at 6:15 PM.

#### May 2026 Election — NO POST-ELECTION WAIT NEEDED

**Both May 2026 races were uncontested and already resolved:**

**Place 3:** Amy Bartley (incumbent) — sole candidate, declared elected per TX Election Code Chapter 2. Election CANCELLED. Sworn in May 12, 2026. She continues as Place 3 incumbent with new term ~2026–2029.

**Place 5:** Jeff Hodges did NOT file for re-election. Doug Charles is the sole candidate, declared elected. Election CANCELLED. Sworn in May 12, 2026. Doug Charles becomes the new Place 5 incumbent on May 12.

**Seeding implication:**
- As of today (May 1, 2026): Jeff Hodges is still the Place 5 officeholder until May 12.
- As of May 12, 2026: Doug Charles takes over.
- **Recommendation:** Seed Doug Charles as Place 5 incumbent (is_incumbent=true, is_active=true) with valid_from ~'2026-05-12'. Hodges' departure is already settled — the election was cancelled. Do not seed Hodges.
- Amy Bartley is re-elected and continues. Seed her with updated term (2026–2029).

**Seats unaffected:** Mayor, Places 1, 2, 4, 6 — all can be seeded now with known current incumbents.

#### Quirks

**"Town" not "City":** Prosper is a Town, not a City. The DB government name is 'Town of Prosper, Texas, US' and the chamber is 'Town Council'. When writing migration SQL, the lookup must use geo_id `'4863276'`. No functional difference for seeding, but plan files should note "Town Council" not "City Council."

**Place 5 transition:** Jeff Hodges (current officeholder, term ends May 2026) was NOT declared elected and will not continue. Doug Charles was declared elected May 2026 and is sworn in May 12. Seed Doug Charles with `valid_from = '2026-05-12'`, `term_date_precision = 'month'`, `valid_to = '2029-05-01'`. No bio URL yet available (no EID on the prospertx.gov directory until he is officially seated — planner should note that Doug Charles may need a bio URL verified post-seating).

**Amy Bartley re-elected:** Her EID=66 bio page still shows "Term ends: May 2026" (pre-renewal). After May 12, her term becomes May 2026–2029. Seed with `valid_from = '2026-05-12'`, `valid_to = '2029-05-01'`, `term_date_precision = 'month'`.

---

### RICHARDSON, TX

**geo_id:** `4863500`
**Source:** https://www.cor.net/government/city-council/who-are-our-city-council-members (returns 403 for individual pages), https://richardsontoday.com/ (2025 election results), WebSearch (2025 election results confirmed)
**Note:** Richardson spans Collin and Dallas counties. The geo_id `4863500` represents the full city. The Collin County portion is the primary portion for this project.

#### Roster (confirmed, as of May 2025 election — no 2026 council races)

| DB Office Title | Name | Email | Bio URL | Term |
|----------------|------|-------|---------|------|
| Mayor | Amir Omar | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/amir-omar | 2025–2027 |
| Council Member District 1 | Curtis Dorian | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/curtis-dorian | 2025–2027 |
| Council Member District 2 | Jennifer Justice | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/jennifer-justice | 2025–2027 |
| Council Member District 3 | Dan Barrios | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/dan-barrios | 2025–2027 |
| Council Member District 4 | Joe Corcoran | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/joe-corcoran | 2025–2027 |
| Council Member Place 5 | Ken Hutchenrider | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/ken-hutchenrider | 2025–2027 |
| Council Member Place 6 | Arefin Shamsul | Not confirmed via official site | https://www.cor.net/government/city-council/who-are-our-city-council-members/arefin-shamsul | 2025–2027 |

**Bio URL pattern:** Individual bio URLs follow the pattern `https://www.cor.net/government/city-council/who-are-our-city-council-members/{first-last}`. These URLs return 403 when fetched externally but are known-good from WebSearch results (Arefin Shamsul's page was indexed by Google, Dan Barrios' page is linked in search results). Use as the bio URL.

**Emails:** Richardson city council emails appear to use `@cor.gov` domain (not `@cor.net`). One confirmed: Dan Barrios at `Dan.Barrios@cor.gov` (found in a WebSearch snippet). Individual email addresses could not be verified from the official website (all council bio pages return 403 externally). `email_addresses = NULL` for all Richardson rows.

**Confidence:** HIGH for names (confirmed from May 2025 election results + multiple sources); HIGH for 2-year terms ending 2027 (all elected May 2025, Richardson uses 2-year terms); LOW for email addresses; MEDIUM for bio URLs (URL pattern confirmed, individual URLs inferred from pattern).

#### Governance Structure

Council-manager form. Mayor + 6 council members (Places 1–6, with Mayor as Place 7). All elected at-large citywide. Places 1–4 have district residency requirements (candidates must live in their geographic district). Places 5–6 and Mayor can live anywhere in the city. **2-year terms** (unlike most TX cities which have 3-year terms). Next council election: May 1, 2027.

#### May 2, 2026 Ballot — NO COUNCIL RACES

**Richardson has NO city council seats on the May 2, 2026 ballot.** The only Richardson items on the May 2, 2026 ballot are:
- 50 City Charter Amendment propositions
- 5 Bond propositions ($223.4M)

All 7 council members were elected May 3, 2025 and serve until May 2027. No post-election wait needed.

#### Quirks

**CRITICAL: DB office titles use "District" but Richardson officially uses "Place"**

Migration 089 created Richardson office titles as:
- `'Council Member District 1'` through `'Council Member District 4'`
- `'Council Member Place 5'` and `'Council Member Place 6'`

Richardson's official terminology for ALL seats is "Place 1" through "Place 6" (official ballot, city website, charter). The "District" designation in the DB reflects that Places 1–4 have geographic residency districts, but Richardson does not call the seats "Districts" publicly.

**This is NOT a data error to fix now** — the offices were seeded with these titles in migration 089 (already applied). The politician migration must use the DB titles as the lookup keys.

**Lookup mapping:**
- "Place 1" in Richardson docs → DB title `'Council Member District 1'`
- "Place 2" → `'Council Member District 2'`
- "Place 3" → `'Council Member District 3'`
- "Place 4" → `'Council Member District 4'`
- "Place 5" → `'Council Member Place 5'`
- "Place 6" → `'Council Member Place 6'`

**Migration SQL comments** should document this mapping explicitly.

**2-year terms:** Richardson is unusual among TX municipalities — it uses 2-year terms, not 3-year terms. All current members have `valid_from = '2025-05-01'`, `valid_to = '2027-05-01'`, `term_date_precision = 'month'`.

---

## Schema and SQL Pattern Reference

(Same as Phase 13 — reproduced here for planner convenience)

### essentials.politicians INSERT columns

| Column | Value for TX Tier 2 rows |
|--------|--------------------------|
| first_name | first name |
| last_name | last name |
| preferred_name | first name (or NULL if same as first_name) |
| full_name | full legal name |
| party | NULL (TX municipal elections are nonpartisan) |
| party_short_name | NULL |
| is_active | true |
| is_incumbent | true |
| is_vacant | false |
| is_appointed | false |
| office_id | looked up via geo_id + title JOIN |
| valid_from | TEXT, e.g. '2025-05-01' |
| valid_to | TEXT, e.g. '2028-05-01' |
| term_date_precision | 'month' when exact day unknown |
| email_addresses | TEXT[] or NULL |
| urls | TEXT[] with bio URL, or NULL if no bio URL |
| data_source | city website domain (e.g. 'cityofallen.org') |

### Standard DO block pattern

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
  WHERE g.geo_id = '4801924' AND o.title = 'Mayor';  -- Allen example

  IF v_office_id IS NULL THEN
    RAISE EXCEPTION 'Allen Mayor office not found — migration 088 must run first';
  END IF;

  INSERT INTO essentials.politicians (
    first_name, last_name, preferred_name, full_name,
    party, party_short_name,
    is_active, is_incumbent, is_vacant, is_appointed,
    office_id, valid_from, valid_to, term_date_precision,
    email_addresses, urls, data_source
  ) VALUES (
    'Baine', 'Brooks', 'Baine', 'Baine Brooks',
    NULL, NULL,
    true, true, false, false,
    v_office_id, '2023-05-01', '2026-05-01', 'month',
    ARRAY['bbrooks@allentx.gov'],
    ARRAY['https://www.cityofallen.org/business_detail_T4_R16.php'],
    'cityofallen.org'
  ) RETURNING id INTO v_politician_id;

  UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id;
  RAISE NOTICE 'Inserted: Baine Brooks (Allen Mayor) — %', v_politician_id;
END $$;
```

---

## Contact Info Summary

| City | Email Status | Bio URL Status |
|------|-------------|----------------|
| Allen | ALL confirmed as mailto: links (allentx.gov domain) | Individual bio pages confirmed |
| Frisco | ALL CloudFlare-protected → NULL | Directory EID bio pages confirmed |
| Murphy | NOT published on city site → NULL | Individual directory EID pages confirmed |
| Celina | Mayor only (rtubbs@celina-tx.gov) → others NULL | Council directory page as fallback |
| Prosper | NOT published on city site → NULL | Individual directory EID pages confirmed |
| Richardson | NOT confirmed (cor.gov domain suspected, 403 on bio pages) → NULL | URL pattern known, individual pages return 403 externally |

---

## Governance Structures Summary

| City | Form | Seat Type | Terms | Total Seats |
|------|------|-----------|-------|-------------|
| Allen | Council-manager | At-large | 3-year | 7 (Mayor + 6) |
| Frisco | Council-manager | At-large | 3-year | 7 (Mayor + 6) |
| Murphy | Council-manager | At-large | 3-year | 7 (Mayor + 6) |
| Celina | Home-Rule | At-large | 3-year | 7 (Mayor + 6) |
| Prosper | Home-Rule Town | At-large | 3-year | 7 (Mayor + 6) |
| Richardson | Council-manager | At-large (w/ district residency for Pl 1-4) | 2-year | 7 (Mayor + 6) |

---

## May 3, 2026 Election Status by City

| City | Council Races? | Status |
|------|----------------|--------|
| Allen | YES — Mayor + Place 2 | Mayor: open race (Schulmeister vs Shafer). Place 2: Tommy Baril declared re-elected (unopposed). Wait for Mayor result. |
| Frisco | YES — Mayor + Place 5 + Place 6 | All 3 seats contested. Wait for all 3 results. |
| Murphy | YES — Mayor + Place 3 + Place 5 | Mayor: Scott Bradley declared re-elected (unopposed). Place 3 and Place 5 contested. Wait for Place 3 + 5 results. |
| Celina | YES — Mayor + Place 4 + Place 5 | Mayor contested. Places 4 and 5 are open seats (both incumbents not running). Wait for all 3 results. |
| Prosper | YES (technically) but CANCELLED | Both races declared per uncontested filings. Amy Bartley (Place 3) re-elected. Doug Charles (Place 5) elected. Sworn in May 12. No post-election wait. |
| Richardson | NO | No council races. Bond + charter only. Full roster ready to seed now. |

---

## Common Pitfalls

### Pitfall 1: Using Richardson's "Place" Terminology in DB Lookups

**What goes wrong:** Using `o.title = 'Council Member Place 1'` for Richardson Place 1 instead of `'Council Member District 1'`.

**Why it happens:** Richardson officially calls all seats "Place," but migration 089 used "District 1–4" for the residency-district seats.

**How to avoid:** Always look up Richardson's first 4 seats as `'Council Member District 1'` through `'Council Member District 4'`. Place 5 and 6 are `'Council Member Place 5'` and `'Council Member Place 6'`. See the mapping table in the Richardson Quirks section above.

### Pitfall 2: Seeding Outgoing Incumbents for Celina Place 4 and Place 5

**What goes wrong:** Seeding Wendie Wigginton (Place 4) and Mindy Koehne (Place 5) as active incumbents because they appear on the pre-election roster.

**Why it happens:** These two appear on the city website roster until after the election.

**How to avoid:** Both incumbent council members are NOT running in 2026. New officeholders will be determined by the May 2 election. Celina Place 4 and Place 5 must wait for election results.

### Pitfall 3: Seeding Jeff Hodges for Prosper Place 5

**What goes wrong:** Seeding Jeff Hodges as Prosper Place 5 because the official Prosper directory page still shows him as Place 5.

**Why it happens:** The directory has not yet been updated (Doug Charles is sworn in May 12, 2026).

**How to avoid:** Jeff Hodges' term expires May 2026 and he did not file for reelection. Doug Charles was declared elected and takes over May 12. Seed Doug Charles as Place 5.

### Pitfall 4: Missing offices.politician_id Update

**What goes wrong:** INSERT into politicians sets politicians.office_id but offices.politician_id is left NULL.

**How to avoid:** Every DO block must include `UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id` after each INSERT. (Same as Phase 13 pitfall #1.)

### Pitfall 5: Frisco "Council" Website URL

**What goes wrong:** Using `https://www.friscotexas.gov/1292/City-Council` (returns 404) instead of the correct URL.

**Why it happens:** The council page URL changed. Old URL 404s.

**How to avoid:** Use `https://www.friscotexas.gov/585/City-Council` (confirmed working) and directory at `https://www.friscotexas.gov/directory.aspx?did=38`.

### Pitfall 6: Celina Website Domain

**What goes wrong:** Using `celinatx.gov` (without hyphen) which either fails or hits the wrong site.

**How to avoid:** Use `celina-tx.gov` (with hyphen). The official city website for Celina is `celina-tx.gov`.

### Pitfall 7: Seeding Before Election Results for Allen/Frisco/Murphy/Celina

**What goes wrong:** Writing migrations 094 and 096 entirely before election results are available, then seeding outgoing incumbents for contested seats.

**How to avoid:** Per the CONTEXT.md decision: "if they're on the roster, they're the incumbent." This means wait until official city roster pages update (expected May 3-5, 2026), then use those rosters as the authoritative source. The planning model should include a verification step to check the city websites before writing SQL for contested seats.

---

## Open Questions

1. **Allen Mayor post-election winner**
   - What we know: Baine Brooks is term-limited (cannot run again). Race is Schulmeister vs. Shafer. Election is May 2, 2026.
   - What's unclear: Who won.
   - Recommendation: Check `cityofallen.org/917/Allen-City-Council` on May 3-4 for updated roster.

2. **Frisco Mayor, Place 5, Place 6 post-election winners**
   - What we know: Jeff Cheney (Mayor), Laura Rummel (Place 5), Brian Livingston (Place 6) are all in contested races.
   - What's unclear: Who won.
   - Recommendation: Check `friscotexas.gov/585/City-Council` and `friscotexas.gov/1883/May-2-2026-Election-Results` on May 3-4.

3. **Murphy Place 3, Place 5 post-election winners**
   - What we know: Andrew Chase (Place 3) and Laura Deel (Place 5) are both contested.
   - What's unclear: Who won.
   - Recommendation: Check `murphytx.org/1961/City-Council` on May 3-4.

4. **Celina Mayor, Place 4, Place 5 post-election winners**
   - What we know: Ryan Tubbs is contested for Mayor. Places 4 and 5 are fully open races.
   - What's unclear: Who won all three.
   - Recommendation: Check `celina-tx.gov/319/City-Council` on May 3-4.

5. **Prosper Place 5 bio URL for Doug Charles**
   - What we know: Doug Charles was declared elected. He is not yet on the Prosper directory (sworn in May 12).
   - What's unclear: His EID on prospertx.gov/directory.aspx after he is seated.
   - Recommendation: After May 12, check `prospertx.gov/directory.aspx?did=20` for his EID and use it as the bio URL. If planning starts before May 12, seed him with `urls = NULL` and note for follow-up.

6. **Richardson email addresses**
   - What we know: Emails appear to be at `@cor.gov` domain. Dan Barrios reportedly uses `Dan.Barrios@cor.gov`. Pattern appears to be `{First}.{Last}@cor.gov`.
   - What's unclear: Cannot verify individual emails from the official website (all bio pages return 403 externally).
   - Recommendation: Use `email_addresses = NULL` per CONTEXT.md policy (emails only if found via mailto: links or directly published). Do not infer the @cor.gov pattern.

7. **Celina individual council member bio URLs**
   - What we know: The council directory page is `celina-tx.gov/Directory.aspx?did=4`. Individual EID pages likely exist at `celina-tx.gov/Directory.aspx?EID=XX`.
   - What's unclear: Individual EID numbers for Place 1-6 members (directory fetch returned the list but not individual EID links).
   - Recommendation: Use the general council directory URL `https://www.celina-tx.gov/319/City-Council` as the bio URL for council members where individual EID is unknown. The Mayor's individual page (`/295/Office-of-the-Mayor`) is confirmed.

---

## Sources

### Primary (HIGH confidence)
- https://www.cityofallen.org/917/Allen-City-Council — Full Allen roster with mailto: email links and bio URLs (fetched 2026-05-01)
- https://www.friscotexas.gov/directory.aspx?did=38 — Frisco council directory with names and bio EID links (fetched 2026-05-01)
- https://www.murphytx.org/1961/City-Council — Murphy council roster (fetched 2026-05-01)
- https://www.celina-tx.gov/319/City-Council — Celina council roster (fetched 2026-05-01)
- https://www.celina-tx.gov/295/Office-of-the-Mayor — Celina Mayor Ryan Tubbs email confirmed
- https://www.prospertx.gov/directory.aspx?did=20 — Prosper council roster (fetched 2026-05-01)
- Individual Prosper bio pages EID=63 through 69 — Term dates confirmed (fetched 2026-05-01)
- https://richardsontoday.com/ — May 2025 election results confirming Richardson roster
- https://www.cor.net/Home/Components/News/News/8142/73 — Richardson 2025 election canvass results (attempted, 403)
- WebSearch: "Richardson TX city council 2025 election results" — confirmed all 7 seats with vote counts
- Migration 088 (`088_tx_tier1_cities.sql`) — Allen geo_id `4801924`, Frisco geo_id `4827684`, and exact office title strings
- Migration 089 (`089_tx_tier2_cities.sql`) — Murphy/Celina/Prosper/Richardson geo_ids and exact office title strings

### Secondary (MEDIUM confidence)
- https://www.nbcdfw.com/news/politics/lone-star-politics/collin-county-election-all-races-may-2-2026/4012500/ — Confirmed Allen, Frisco, Murphy, Celina on May 2 ballot; confirmed Richardson and Prosper not on ballot
- https://communityimpact.com/dallas-fort-worth/prosper-celina/election/2026/02/13/all-prosper-town-council-prosper-isd-races-uncontested-for-may-election/ — Prosper Place 3 (Amy Bartley) and Place 5 (Doug Charles) declared elected
- https://communityimpact.com/dallas-fort-worth/prosper-celina/election/2026/02/13/see-who-is-running-for-celina-city-council-celina-isd-board-this-may/ — Celina election candidates confirmed
- https://www.friscotexas.gov/CivicAlerts.aspx?AID=2592 — Ann Anderson sworn in for Frisco Place 1 special election win
- https://www.keranews.org/news/2026-01-31/plano-and-frisco-elect-new-council-members-in-special-elections — Ann Anderson won Frisco Place 1

### Tertiary (LOW confidence)
- WebSearch result mentioning Dan Barrios email as `Dan.Barrios@cor.gov` — single search snippet, not verified from official source
- Murphy term dates — not published on city website; estimated from TX municipal election cycle

---

## Metadata

**Confidence breakdown:**
- Allen roster + emails: HIGH — confirmed from official city council page with mailto: links
- Frisco roster + bio URLs: HIGH — confirmed from official directory page
- Murphy roster: HIGH — confirmed from official city website; emails: LOW (not published)
- Celina roster: HIGH — confirmed from official city website; Mayor email: HIGH; others: LOW
- Prosper roster + term dates: HIGH — confirmed from individual bio pages
- Richardson roster: HIGH — confirmed from May 2025 election results; bio URL pattern: MEDIUM
- May 2026 election ballot facts: HIGH — confirmed from official city election pages + NBC DFW
- Richardson office title mapping (District vs Place): HIGH — confirmed from migration 089 SQL and Richardson official docs

**Research date:** 2026-05-01
**Valid until:** 2026-05-05 for election-sensitive cities (Allen, Frisco, Murphy, Celina); 2026-06-01 for Richardson and Prosper (stable)

---

## QUIRKS SECTION — USER REVIEW REQUIRED BEFORE PLANNING

The following structural quirks require user review before planning begins:

### Q1: Richardson "District" vs "Place" title mismatch (CONFIRMED, NO ACTION NEEDED)
Migration 089 already seeded Richardson offices as `'Council Member District 1–4'` and `'Council Member Place 5–6'`. Richardson officially calls all seats "Place 1–6." The DB titles are what they are — the politician migration must use the DB titles as lookup keys. This is a labeling inconsistency in the DB but not a bug to fix in Phase 14.

**Proposed handling:** Use DB titles in SQL lookups, add SQL comment noting the official-vs-DB discrepancy. No schema change.

### Q2: Prosper Place 5 handoff (Jeff Hodges out → Doug Charles in, May 12, 2026)
Jeff Hodges is the current Place 5 officeholder but is NOT continuing. Doug Charles was declared elected and is sworn in May 12, 2026. The prospertx.gov directory still shows Jeff Hodges as of May 1, 2026.

**Proposed handling:** Seed Doug Charles as Place 5 (is_incumbent=true, valid_from='2026-05-12'). Do not seed Jeff Hodges. Add SQL comment explaining the transition.

### Q3: Celina Place 4 and Place 5 are fully open seats
Wendie Wigginton (Place 4) withdrew from the election. Mindy Koehne (Place 5) did not file. Neither is running. The May 2 election will elect two new council members for these seats.

**Proposed handling:** Do NOT seed Wigginton or Koehne. Wait for election results. Seed new officeholders once the Celina roster page updates.

### Q4: Allen Mayor is term-limited — a new mayor will be seated
Baine Brooks cannot run for re-election (Allen has term limits). The new Mayor (either Schulmeister or Shafer) will be a first-time mayor.

**Proposed handling:** Do not seed Brooks for a new term. Seed the election winner after results are confirmed.

### Q5: Frisco Ann Anderson is a special-election fill (short first term)
Ann Anderson won a January 31, 2026 special election to fill a vacancy. Her valid_from is approximately February 2026, not a standard May election date.

**Proposed handling:** Use `valid_from = '2026-02-01'`, `term_date_precision = 'month'`. Her term end date should match the Place 1 regular cycle; pending clarification, use `valid_to = '2029-05-01'` (Place 1 next regular election would be ~2028 if it follows the standard 3-year cycle from when the vacancy was filled at special election).

### Q6: Richardson uses 2-year terms (unusual for TX)
Most TX municipal councils use 3-year terms. Richardson uses 2-year terms. All current Richardson members were elected May 2025, terms end May 2027.

**Proposed handling:** Use `valid_from = '2025-05-01'`, `valid_to = '2027-05-01'`, `term_date_precision = 'month'` for all Richardson members.
