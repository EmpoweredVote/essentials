# Phase 15: Tier 3-4 Officials — Remaining 16 Cities - Research

**Researched:** 2026-05-01
**Domain:** Data seeding — essentials.politicians for 16 Collin County Tier 3-4 cities
**Confidence:** HIGH for most rosters; MEDIUM for term dates; LOW/NULL for most contact info

---

## Summary

Phase 15 seeds current incumbent mayors and council members for 16 Collin County cities (8 Tier 3, 8 Tier 4) into `essentials.politicians`, using the same DO-block SQL pattern established in Phases 13 and 14. All office_ids are confirmed present in the DB (from migration 090). Two migrations: 097 (Tier 3 cities) and 098 (Tier 4 cities).

**Critical election timing:** Today is May 1, 2026. The May 2, 2026 Texas uniform election affects multiple cities in this phase. Per CONTEXT.md decisions, only seed based on certified results — do NOT seed outgoing incumbents for contested seats. Election results will not be certified until after May 2 (expect 3-5 business days for canvass). Several cities have elections cancelled (uncontested), which count as certified.

The established SQL pattern from migrations 091-096 applies unchanged: one DO block per politician, lookup office via `geo_id + o.title` JOIN, INSERT into `essentials.politicians`, UPDATE `essentials.offices SET politician_id`.

**Primary recommendation:** Seed all cities with stable rosters immediately. For the 8 cities/seats with May 2, 2026 elections, write SQL stubs with clear NOT-YET-SEEDED comments and revisit after official certification (typically 3-5 days post-election).

---

## DB Infrastructure (Already in Place from Migration 090)

All governments, chambers, and offices were created in migration 090 (`090_tx_tier34_cities.sql`). **Do not create any new governments/chambers/offices in migrations 097-098.** Only INSERT into `essentials.politicians` and UPDATE `essentials.offices`.

### Tier 3 Cities — office_id Reference Table

| City | geo_id | DB Office Titles | Notes |
|------|--------|-----------------|-------|
| Anna | `4803300` | Mayor; Council Member Place 1–6 | 7 seats |
| Melissa | `4847496` | Mayor; Council Member Place 1–6 | 7 seats |
| Princeton | `4863432` | Mayor; Council Member Place 1–7 | 8 seats |
| Lucas | `4845012` | Mayor; Council Member Place 1–6 | 7 seats |
| Lavon | `4841800` | Mayor; Council Member Place 1–5 | 6 seats |
| Fairview | `4825224` | Mayor; Council Member Seat 1–6 | 7 seats; uses "Seat" not "Place" |
| Van Alstyne | `4875960` | Mayor; Council Member Place 1–6 | 7 seats |
| Farmersville | `4825488` | Mayor; Council Member Place 1–5 | 6 seats |

### Tier 4 Cities — office_id Reference Table

| City | geo_id | DB Office Titles | Notes |
|------|--------|-----------------|-------|
| Parker | `4855152` | Mayor; Council Member Place 1–5 | 6 seats |
| Saint Paul | `4864220` | Mayor; Council Member Place 1–5 | 6 seats; city uses "Alderman/Seat" terminology |
| Nevada | `4850760` | Mayor; Council Member Place 1–5 | 6 seats |
| Weston | `4877740` | Mayor; Council Member Place 1–4 | 5 seats only (DB missing Place 5 — see pitfalls) |
| Lowry Crossing | `4844308` | Mayor; Council Member Place 1–4 | 5 seats only (DB uses Place numbers, city uses Ward-based — see pitfalls) |
| Josephine | `4838068` | Mayor; Council Member Place 1–4 | 5 seats only (DB missing Place 5 — see pitfalls) |
| Blue Ridge | `4808872` | Mayor; Council Member Place 1–4 | 5 seats |

---

## City-by-City Research

---

### TIER 3: ANNA, TX

**geo_id:** `4803300`
**Source:** https://www.annatexas.gov/319/City-Council (fetched 2026-05-01)
**data_source:** `annatexas.gov`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Pete Cain | NULL (not on website) | https://www.annatexas.gov/1354/Pete-Cain | 2024–2027 | No |
| Council Member Place 1 | Kevin Toten | NULL | https://www.annatexas.gov/1072/Kevin-Toten | 2024–2027 | No |
| Council Member Place 2 | Nathan Bryan | NULL | https://www.annatexas.gov/1612/Nathan-Bryan | 2025–2028 | No |
| Council Member Place 3 | Stan Carver II | NULL | https://www.annatexas.gov/1074/Stan-Carver-II | 2023–2026 | YES — open race (Carver not running); Mike Olivarez vs. Jessica Walden |
| Council Member Place 4 | Kelly Patterson-Herndon | NULL | https://www.annatexas.gov/1562/Kelly-Patterson-Herndon | 2025–2028 | No |
| Council Member Place 5 | Elden Baker | NULL | https://www.annatexas.gov/1426/Elden-Baker | 2023–2026 | YES — Elden Baker vs. Susan Jones |
| Council Member Place 6 | Manny Singh | NULL | https://www.annatexas.gov/1607/Manny-Singh | 2025–2028 | No |

No email addresses published on city council page.

**Anna uses 4-year terms** (unusual — most TX cities use 3-year). Terms 2023–2026 expire May 2026; terms 2024–2027 expire May 2027; terms 2025–2028 expire May 2028.

**Confidence:** HIGH for names (confirmed official council page); MEDIUM for terms (from page); LOW for emails (none published).

#### May 2, 2026 Election Flags

- **Place 3:** Stan Carver II is NOT running for re-election. Open race between Mike Olivarez and Jessica Walden. Do NOT seed Carver. Wait for certified result.
- **Place 5:** Elden Baker running against Susan Jones. Wait for certified result.
- **Places 1, 2, 4, 6:** Seed immediately — not on ballot.
- **Mayor:** Pete Cain not on ballot (term 2024–2027). Seed immediately.

---

### TIER 3: MELISSA, TX

**geo_id:** `4847496`
**Source:** https://www.cityofmelissa.com/202/City-Council (fetched 2026-05-01)
**data_source:** `cityofmelissa.com`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Jay Northcut | mayor@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=51 | — | No |
| Council Member Place 1 | Preston Taylor | place1@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=103 | — | No |
| Council Member Place 2 | Rendell Hendrickson | place2@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=104 | — | No |
| Council Member Place 3 | Dana Conklin | place3@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=56 | — | No |
| Council Member Place 4 | Joseph Armstrong | place4@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=53 | — | No |
| Council Member Place 5 | Craig Ackerman | cackerman@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=50 | — | No |
| Council Member Place 6 | Sean Lehr | place6@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=54 | — | No |

**Melissa has NO May 2026 election.** Confirmed from official Elections page: Places 1,3,5,6 are in May 2027; Mayor + Places 2,4 are in May 2028. Entire roster can be seeded immediately.

**Email notes:** Melissa uses role-based email aliases (place1@, place2@, etc.) confirmed from the city council page. Place 5 uses `cackerman@cityofmelissa.com` (personal address pattern rather than role alias — this is what is published). All are on the official city website.

**Individual bio URL pattern:** `https://www.cityofmelissa.com/Directory.aspx?EID=XX`. EID numbers confirmed from directory page scrape.

**Confidence:** HIGH for names and emails (confirmed from official city website); LOW for term dates (not published on city website).

---

### TIER 3: PRINCETON, TX

**geo_id:** `4863432`
**Source:** https://princetontx.gov/286/City-Council and https://princetontx.gov/Directory.aspx?did=37 (fetched 2026-05-01)
**data_source:** `princetontx.gov`
**Note:** The domain `cityofprinceton.com` is for sale — never use it. Official site is `princetontx.gov`.

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Eugene Escobar Jr. | NULL | (no individual bio page found) | 2025–2028 | No |
| Council Member Place 1 | Terrance Johnson | NULL | (no individual bio page found) | — | No |
| Council Member Place 2 | Cristina Todd | NULL | (no individual bio page found) | — | No |
| Council Member Place 3 | Bryan Washington | NULL | (no individual bio page found) | — | No |
| Council Member Place 4 | VACANT | — | — | — | YES — Special Election May 2, 2026 |
| Council Member Place 5 | Steven Deffibaugh | NULL | (no individual bio page found) | — | No |
| Council Member Place 6 | Ben Long | NULL | (no individual bio page found) | — | No |
| Council Member Place 7 | Carolyn David-Graves | NULL | (no individual bio page found) | — | No |

**Place 4 is currently VACANT.** A special election is scheduled May 2, 2026 to fill Place 4. Candidates: Sharad Ramani, Janice Goria, Jaisen Rutledge, Hassan Abdulkareem. Wait for certified result. Leave Place 4 office empty (no politician row) until winner is certified.

**Mayor note:** Eugene Escobar Jr. was elected in December 2024 runoff (defeated incumbent Brianna Chacon). He took office January 2025.

**No individual email addresses or bio URLs** are published on the Princeton council pages (only shared city phone number 972-736-2416).

**Confidence:** HIGH for names (confirmed from directory + election news); MEDIUM for Mayor term start (~Jan 2025, from news coverage); LOW for other term dates.

---

### TIER 3: LUCAS, TX

**geo_id:** `4845012`
**Source:** https://www.lucastexas.us/164/City-Council (fetched 2026-05-01)
**data_source:** `lucastexas.us`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Dusty Kuykendall | dkuykendall@lucastexas.us | (no individual bio page) | — 2027 | No |
| Council Member Place 1 | Tim Johnson | tcjohnson@lucastexas.us | (no individual bio page) | — 2026 | YES — open race (Tim Johnson not in candidates) |
| Council Member Place 2 | Brian Stubblefield | bstubblefield@lucastexas.us | (no individual bio page) | — 2026 | YES — open race (Stubblefield not in candidates) |
| Council Member Place 3 | Chris Bierman | cbierman@lucastexas.us | (no individual bio page) | — 2027 | No |
| Council Member Place 4 | Phil Lawrence | plawrence@lucastexas.us | (no individual bio page) | — 2027 | No |
| Council Member Place 5 | Debbie Fisher | dfisher@lucastexas.us | (no individual bio page) | — 2028 | No |
| Council Member Place 6 | Neil Peterson | npeterson@lucastexas.us | (no individual bio page) | — 2028 | No |

**Lucas email pattern:** `{first initial}{lastname}@lucastexas.us` — all confirmed from official city council page as explicit email links.

**Lucas uses "Seat" internally** but the DB was created with "Place" designations. The lucastexas.us council page lists "Seat 1" through "Seat 6" for the council members. DB titles are "Council Member Place 1" through "Place 6". Use the DB titles in SQL lookups.

**May 2, 2026 Election Flags:**
- **Place 1 (Seat 1):** Tim Johnson not running (open race: Richard Alan vs. Jonathan Underhill). Do NOT seed Johnson. Wait for certified result.
- **Place 2 (Seat 2):** Brian Stubblefield not running (open race: John Awezec vs. Rebecca B. Orr). Do NOT seed Stubblefield. Wait for certified result.
- **Mayor, Places 3–6:** Seed immediately.

**Confidence:** HIGH for names and emails (confirmed from official city council page); MEDIUM for term dates (years confirmed, exact dates not shown on website).

---

### TIER 3: LAVON, TX

**geo_id:** `4841800`
**Source:** https://lavontx.gov/city-council/ (fetched 2026-05-01)
**data_source:** `lavontx.gov`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Vicki Sanson | NULL | (none found) | — | No |
| Council Member Place 1 | Mike Shepard | NULL | (none found) | — | No |
| Council Member Place 2 | Mike Cook | NULL | (none found) | — | No |
| Council Member Place 3 | Travis Jacob | NULL | (none found) | — | No |
| Council Member Place 4 | Rachel Dumas | NULL | (none found) | — | No |
| Council Member Place 5 | Lindsey Hedge | NULL | (none found) | — | No |

**Lavon has NO May 2026 election** — not listed on LWV Collin County or NBC DFW election guides for May 2, 2026. All 6 seats can be seeded immediately.

Lavon's city council page lists names and place numbers but no email addresses or bio URLs.

**Confidence:** HIGH for names (confirmed from official city council page); LOW for term dates (not published); LOW for emails (none published).

---

### TIER 3: FAIRVIEW, TX (Town of Fairview)

**geo_id:** `4825224`
**Source:** https://fairviewtexas.org/government/town-council.html (fetched 2026-05-01)
**data_source:** `fairviewtexas.org`
**Note:** Legally a Town. DB government name is 'Town of Fairview, Texas, US'. DB chamber is 'Town Council'. DB office titles use "Seat" not "Place": `Mayor`, `Council Member Seat 1` through `Council Member Seat 6`.

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | John Hubbard | mayor@fairviewtexas.org | (bio on town council page) | 2025–2028 | No |
| Council Member Seat 1 | Rich Connelly | RConnelly@FairviewTexas.org | (bio on town council page) | 2021+3yr cycle | No |
| Council Member Seat 2 | Gregg Custer | GCuster@FairviewTexas.org | (bio on town council page) | 2020+3yr cycle | YES — open seat (Custer not running; Joe Boggs only candidate → declared elected) |
| Council Member Seat 3 | Jill Hawkins | jhawkins@fairviewtexas.org | (bio on town council page) | 2021+3yr cycle | No |
| Council Member Seat 4 | Larry Little | LLittle@FairviewTexas.org | (bio on town council page) | 2020+3yr cycle | YES — open race (Little not running; Ricardo Doi vs. John Stanley) |
| Council Member Seat 5 | Pat Sheehan | psheehan@fairviewtexas.org | (bio on town council page) | 2021+3yr cycle | No |
| Council Member Seat 6 | Lakia Works | LWorks@fairviewtexas.org | (bio on town council page) | 2020+3yr cycle | YES — contested (Lakia Works vs. Ryan Riyad) |

**Emails confirmed** from official town council page (all as direct email links). Email domain is `fairviewtexas.org` (not `fairviewtexas.com`).

**Bio URLs:** The bios appear inline on the Town Council page itself, not on individual sub-pages. Use the council page URL `https://fairviewtexas.org/government/town-council.html` as the bio URL for all 7.

**May 2, 2026 Election Flags:**
- **Seat 2:** Gregg Custer not running. Joe Boggs is the sole candidate → declared elected. Joe Boggs becomes the new Seat 2 incumbent. Wait for certified swearing-in before seeding new name.
- **Seat 4:** Open race (Larry Little not running). Contestants: Ricardo Doi vs. John Stanley. Wait for certified result.
- **Seat 6:** Contested: Lakia Works (current incumbent) vs. Ryan Riyad. Wait for certified result.
- **Mayor, Seats 1, 3, 5:** Seed immediately.

**Confidence:** HIGH for names and emails (confirmed from official town council page); MEDIUM for term dates (election years confirmed from biographical notes, exact dates not shown).

---

### TIER 3: VAN ALSTYNE, TX

**geo_id:** `4875960`
**Source:** https://cityofvanalstyne.civicweb.net/portal/members.aspx?id=10 (fetched 2026-05-01)
**data_source:** `cityofvanalstyne.us`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Jim Atchison | mayor@cityofvanalstyne.us | (no individual bio page found) | 2023-05-07 to 2026-05-02 | YES — Jim Atchison vs. Kevin Soucie |
| Council Member Place 1 | Ryan Neal | NULL | (no individual bio page found) | 2024-05-05 to 2027-05-02 | No |
| Council Member Place 2 | Marla Butler | NULL | (no individual bio page found) | 2024-05-05 to 2027-05-01 | No |
| Council Member Place 3 | Dusty Williams | NULL | (no individual bio page found) | 2024-05-05 to 2027-05-01 | No |
| Council Member Place 4 | Lee Thomas | NULL | (no individual bio page found) | 2025-05-04 to 2028-05-06 | No |
| Council Member Place 5 | Katrina Arsenault | NULL | (no individual bio page found) | 2025-05-04 to 2028-05-06 | No |
| Council Member Place 6 | Angelica Pena | NULL | (no individual bio page found) | 2023-05-05 to 2026-05-02 | YES — contested (Pena's term expires May 2, 2026) |

Only the Mayor's email (`mayor@cityofvanalstyne.us`) is published. All council member emails are not listed on the CivicWeb members page.

**Van Alstyne is in Grayson County** (primarily), not Collin County — that is why it doesn't appear in Collin County election guides. The May 2, 2026 election is administered by Grayson County.

**Term dates are precise** — the CivicWeb members page shows exact appointment/election dates for all members.

**May 2, 2026 Election Flags:**
- **Mayor:** Jim Atchison (term expires May 2, 2026) vs. Kevin Soucie. Wait for certified result.
- **Place 6:** Angelica Pena (term expires May 2, 2026). Contested (at least 2 aldermen being elected per city elections page). Wait for certified result.
- **Places 1–5:** Seed immediately.

**Confidence:** HIGH for names and term dates (confirmed from official CivicWeb members page); HIGH for Mayor email; LOW for other council emails.

---

### TIER 3: FARMERSVILLE, TX

**geo_id:** `4825488`
**Source:** https://www.farmersvilletx.com/city-council (fetched 2026-05-01)
**Source 2:** https://www.farmersvilletx.com/city-secretary/page/elections (fetched 2026-05-01)
**data_source:** `farmersvilletx.com`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Craig Overstreet | (obfuscated via contact form) | https://www.farmersvilletx.com/city-council | — | No |
| Council Member Place 1 | Coleman Strickland | (obfuscated via contact form) | https://www.farmersvilletx.com/city-council | — | CANCELLED — declared re-elected unopposed |
| Council Member Place 2 | Russell Chandler | (obfuscated via contact form) | https://www.farmersvilletx.com/city-council | — | No |
| Council Member Place 3 | Kristi Mondy | (obfuscated via contact form) | https://www.farmersvilletx.com/city-council | — | CANCELLED — declared re-elected unopposed |
| Council Member Place 4 | Mike Henry | (obfuscated via contact form) | https://www.farmersvilletx.com/city-council | — | No |
| Council Member Place 5 | Tonya Fox | (obfuscated via contact form) | https://www.farmersvilletx.com/city-council | — | No |

**May 2, 2026 Election CANCELLED** — official city elections page states: "The May 2, 2026 City General Election has been cancelled. Incumbents Coleman Strickland (CC Place 1) and Kristi Mondy (CC Place 3) are the only applicants." Both are declared re-elected. Entire roster can be seeded.

**Emails:** The farmersvilletx.com city council page exposes email contact via a form-based link pattern (`/email-contact/node/XX/field_email/directory_listings_body_standard`) — these are obfuscated/form-based, NOT direct email addresses. Per CONTEXT.md policy, do not use form-based emails. `email_addresses = NULL` for all Farmersville rows.

**Bio URLs:** Use the main city council page as the bio URL for all members since no individual sub-pages exist.

**Confidence:** HIGH for names (confirmed from official council page); HIGH for Place 1 and 3 continued incumbency (election cancelled); LOW for term dates; LOW for emails (obfuscated).

---

## TIER 4 CITIES

---

### TIER 4: PARKER, TX

**geo_id:** `4855152`
**Source:** https://www.parkertexas.us/76/City-Council (fetched 2026-05-01)
**data_source:** `parkertexas.us`

#### Roster

| DB Office Title | Name | Email | Bio URL | Term | May 2026 Ballot? |
|----------------|------|-------|---------|------|-----------------|
| Mayor | Lee Pettle | lpettle@parkertexas.us | (none found) | — May 2026 | YES — Lee Pettle vs. Marcos Arias vs. Melissa Tierce |
| Council Member Place 1 | Roxanne Bogdan | rbogdan@parkertexas.us | (none found) | — May 2027 | No |
| Council Member Place 2 | Colleen Halbert | chalbert@parkertexas.us | (none found) | — May 2027 | No |
| Council Member Place 3 | Buddy Pilgrim (Mayor Pro Tem) | bpilgrim@parkertexas.us | (none found) | — May 2026 | YES — at-large seat race |
| Council Member Place 4 | Darrel Sharpe | dsharpe@parkertexas.us | (none found) | — May 2027 | No |
| Council Member Place 5 | Billy Barron | bbarron@parkertexas.us | (none found) | — May 2026 | YES — at-large seat race |

**Parker email pattern:** `{first initial}{lastname}@parkertexas.us` — confirmed from official city council page.

**Parker structure note:** Parker uses "at-large" elections. The city website does not label council seats with Place numbers (it lists 5 members as Councilmembers without number designations). However, migration 090 created DB offices as Place 1–5. The assignment above (Bogdan=Place 1, Halbert=Place 2, Pilgrim=Place 3, Sharpe=Place 4, Barron=Place 5) is based on the **order listed on the city council page** and matching term expiration dates to the election cycle. This assignment is LOW confidence — the city does not publish place number assignments. The planner should assign place numbers positionally and note the uncertainty in SQL comments.

**May 2, 2026 Election Flags:**
- **Mayor:** Lee Pettle (incumbent, running) vs. Marcos Arias vs. Melissa Tierce. Contested. Wait for certified result.
- **At-Large seats (Place 3 and Place 5):** Buddy Pilgrim and Billy Barron both running in a 4-candidate at-large race (also Alan Meyer and Amanda Noe). 2 winners will be selected. Wait for certified result.
- **Places 1, 2, 4:** Seed immediately (not on ballot, terms to May 2027).

**Confidence:** HIGH for names and emails (confirmed from official council page); LOW for Place number assignments (not published by city); MEDIUM for which seats are on ballot.

---

### TIER 4: SAINT PAUL, TX

**geo_id:** `4864220`
**Source:** https://www.stpaultexas.us/local_government/elected_officials/seats_1-5.php (fetched 2026-05-01)
**Source 2:** https://www.stpaultexas.us/local_government/elections.php (fetched 2026-05-01)
**data_source:** `stpaultexas.us`

#### Roster (Post-Election, effective ~June 2026)

| DB Office Title | Name | Email | Term | Notes |
|----------------|------|-------|------|-------|
| Mayor | J.T. Trevino | jt.trevino@stpaultexas.us | — June 2029 (est.) | ELECTED — J.T. Trevino declared elected Mayor (election cancelled, unopposed) |
| Council Member Place 1 | Larry Nail | larry.nail@stpaultexas.us | — June 2027 | Confirmed incumbent, not on 2026 ballot |
| Council Member Place 2 | David Dryden | david.dryden@stpaultexas.us | — June 2027 | Confirmed incumbent, not on 2026 ballot |
| Council Member Place 3 | Greg Pierson | NULL | — June 2029 (est.) | NEW — declared elected (Greg Pierson replaces Justin Graham; election cancelled) |
| Council Member Place 4 | Kristen Bewley | NULL | — June 2029 (est.) | NEW — declared elected (Kristen Bewley takes Seat 4; J.T. Trevino moved to Mayor race) |
| Council Member Place 5 | Robert Simmons | robert.simmons@stpaultexas.us | — June 2029 (est.) | Re-elected (declared elected unopposed) |

**May 2026 election was CANCELLED** — all candidates ran unopposed. Declared elected per TX Election Code. J.T. Trevino moves from Seat 4 to Mayor. Greg Pierson replaces Justin Graham (Seat 3). Kristen Bewley fills Seat 4 (vacated by Trevino). Robert Simmons (Seat 5) continues.

**Roster before election (for completeness):**
- Pre-election Mayor: Kent Swaner (term expires June 2026, not running — J.T. Trevino running for Mayor)
- Pre-election Seat 3: Justin Graham (term expires June 2026, not running — Greg Pierson declared elected)
- Pre-election Seat 4: J.T. Trevino (moving to Mayor race)

**Emails confirmed** from official seats page: Larry Nail, David Dryden, Robert Simmons. J.T. Trevino's Seat 4 email confirmed (`jt.trevino@stpaultexas.us`); use as his Mayor email since it's the confirmed official email.

**DB title mismatch:** Saint Paul city website uses "Alderman/Alderwoman" and "Seat 1–5", not "Council Member Place 1–5". The DB uses Place-based titles. Planner must use DB titles in SQL lookups.

**Swearing-in timing:** Saint Paul uses June term expirations. Since election was cancelled (April/May declaration), new officials likely take office at the June regular meeting. Seeding can proceed with `valid_from = '2026-06-01'` for the new officials.

**Confidence:** HIGH for Seat 1, 2, 5 incumbents (confirmed on website, not on ballot); HIGH for election cancellation and declared winners (confirmed from official elections page); MEDIUM for new officials' email addresses (Greg Pierson and Kristen Bewley not yet on website); MEDIUM for exact valid_from dates.

---

### TIER 4: NEVADA, TX

**geo_id:** `4850760`
**Source:** https://cityofnevadatx.org/government/city_council.php (fetched 2026-05-01)
**data_source:** `cityofnevadatx.org`

#### Roster

| DB Office Title | Name | Email | Term | May 2026 Ballot? |
|----------------|------|-------|------|-----------------|
| Mayor | Donald Deering | mayor@cityofnevadatx.org | 2-year term | YES — Donald Deering only candidate → declared elected (running unopposed) |
| Council Member Place 1 | Mike Laye | councilman1@cityofnevadatx.org | 2-year term | YES — Mike Laye only candidate → declared elected (running unopposed) |
| Council Member Place 2 | Paul Baker | councilman2@cityofnevadatx.org | 2-year term | YES — Paul Baker only candidate → declared elected (running unopposed) |
| Council Member Place 3 | Amanda Wilson (Mayor Pro Tem) | councilman3@cityofnevadatx.org | 2-year term | No |
| Council Member Place 4 | Clayton Laughter | councilman4@cityofnevadatx.org | 2-year term | No |
| Council Member Place 5 | Derrick Little | councilman5@cityofnevadatx.org | 2-year term | No |

**Nevada uses 2-year terms** (like Richardson). All council members serve 2-year terms. Mayor, Place 1, Place 2 have terms expiring with the May 2026 election. Mayor Donald Deering, Mike Laye, and Paul Baker are all running unopposed → likely declared elected, but official certification has not yet occurred (election is May 2, 2026).

**Wait for official certification** of Mayor, Place 1, Place 2 before seeding those rows, even though all are running unopposed. All three will almost certainly be re-elected; write their SQL but flag for post-election verification.

**Emails confirmed:** Role-based email aliases from official city council page (`mayor@`, `councilman1@` through `councilman5@` with `@cityofnevadatx.org` domain).

**Confidence:** HIGH for names and emails (confirmed from official council page); HIGH for 2-year terms; MEDIUM for which specific years the terms run.

---

### TIER 4: WESTON, TX

**geo_id:** `4877740`
**Source:** https://www.westontexas.com/page/Mayor_Aldermen (fetched 2026-05-01)
**data_source:** `westontexas.com`

#### Roster

| DB Office Title | Name | Email | Notes |
|----------------|------|-------|-------|
| Mayor | Matthew Marchiori | NULL | Not on May 2026 ballot (term unexpired) |
| Council Member Place 1 | Patti Harrington | NULL | Assignment based on order listed |
| Council Member Place 2 | Brian M. Roach | NULL | Assignment based on order listed |
| Council Member Place 3 | Jeff Metzger (Mayor Pro Tem) | NULL | Assignment based on order listed |
| Council Member Place 4 | Mike Hill | NULL | Assignment based on order listed |
| — (no DB office) | Marla Johnston | NULL | CANNOT BE SEEDED — DB has only Places 1–4 (4 Aldermen), but Weston has 5 Aldermen |

**CRITICAL WESTON CONSTRAINT:** The DB (migration 090) created only 4 Alderman offices (Place 1–4) for Weston, but the actual Weston government has 5 Aldermen + Mayor = 6. Marla Johnston cannot be seeded because no `Council Member Place 5` office exists in the DB. Do NOT create a new office in migration 098 — that would require its own schema migration outside the phase scope.

**Weston has NO May 2026 election** — not on any ballot lists reviewed. 2024 uncontested results showed Jeff Metzger, Mike Hill, Marla Johnston; 2023 showed Mayor Jerry Randall, Heather Richardson, Don Coleman. NOTE: The website lists the CURRENT governing body as Matthew Marchiori (Mayor), Patti Harrington, Brian Roach, Jeff Metzger, Mike Hill, Marla Johnston — indicating turnover from 2023 names. Jerry Randall and Heather Richardson and Don Coleman appear to be gone; their replacements are unclear from public sources.

**Place number assignment caveat:** Weston does not publish Place number assignments on its website. The above mapping (Harrington=1, Roach=2, Metzger=3, Hill=4) is positional. Flag in SQL comments.

**No email addresses published.** No individual bio URLs.

**Confidence:** HIGH for current names listed on official website; LOW for place number assignments; LOW for term dates; LOW for emails.

---

### TIER 4: LOWRY CROSSING, TX

**geo_id:** `4844308`
**Source:** https://lowrycrossingtexas.org/operations/city_council.php (fetched 2026-05-01)
**data_source:** `lowrycrossingtexas.org`

#### Roster

| DB Office Title | Name | Email | Ward (actual) | Notes |
|----------------|------|-------|--------------|-------|
| Mayor | Pat Kelly | pkelly@lowrycrossingtexas.org | — | Confirmed incumbent; won Nov 2025 election |
| Council Member Place 1 | Scott Pitchure | spitchure@lowrycrossingtexas.org | Ward 1 | Assign Ward 1, Seat 1 to Place 1 |
| Council Member Place 2 | Tammy Hodges (Mayor Pro Tem) | thodges@lowrycrossingtexas.org | Ward 2 | Mayor Pro Tem |
| Council Member Place 3 | Eusebio "Joe" Trujillo III | etrujillo@lowrycrossingtexas.org | Ward 3 | |
| Council Member Place 4 | (Ward 4 currently VACANT) | — | Ward 4 | VACANT per TML directory |
| — (no DB office for Ward 1/2nd seat) | Chris Madrid (Treasurer) | cmadrid@lowrycrossingtexas.org | Ward 1 | CANNOT BE SEEDED — Ward 1 has 2 members but DB only has 4 Place offices |
| — (no DB office for Ward 2/2nd seat) | Agur Rios | arios@lowrycrossingtexas.org | Ward 2 | CANNOT BE SEEDED — DB only has 4 Place offices |
| — (no DB office for Ward 3/2nd seat) | Cindy Cash | ccash@lowrycrossingtexas.org | Ward 3 | CANNOT BE SEEDED — DB only has 4 Place offices |

**CRITICAL LOWRY CROSSING CONSTRAINT:** The actual Lowry Crossing council has Mayor + 6 ward-based council members (Ward 1: 2 members; Ward 2: 2 members; Ward 3: 2 members; Ward 4: currently vacant). Migration 090 created only Mayor + Place 1–4 = 5 offices. Only 4 council member offices exist in DB. Only Mayor + 3 non-vacant ward members can be seeded against existing offices.

**Ward 4 is VACANT** (per TML directory). The May 2, 2026 ballot includes "Ward 4 (2 Seats)" with candidates: G Hijazen, Donna Crenshaw Outland, Ollie Simpson — wait for certified result.

**Place-to-Ward mapping recommendation:** Place 1 → Ward 1 (Scott Pitchure), Place 2 → Ward 2 (Tammy Hodges), Place 3 → Ward 3 (Eusebio Trujillo), Place 4 → Ward 4 VACANT. The second member of each ward (Chris Madrid Ward 1, Agur Rios Ward 2, Cindy Cash Ward 3) cannot be seeded.

**Emails confirmed** from official city council page.

**Confidence:** HIGH for names and emails (confirmed from official website); LOW for place number assignments; LOW for term dates.

---

### TIER 4: JOSEPHINE, TX

**geo_id:** `4838068`
**Source:** https://directory.tml.org/profile/city/994 (fetched 2026-05-01)
**data_source:** `cityofjosephinetx.com` (TML as fallback since direct site fetch failed)

#### Roster

| DB Office Title | Name | Email | Notes |
|----------------|------|-------|-------|
| Mayor | Jason Turney | NULL | |
| Council Member Place 1 | April Aurand | NULL | |
| Council Member Place 2 | Jane Ridgway | NULL | |
| Council Member Place 3 | Alex Esquivel | NULL | |
| Council Member Place 4 | Pam Sardo | NULL | |
| — (no DB office) | Gary Chappell (Place 5) | NULL | CANNOT BE SEEDED — DB has only Places 1–4, but actual Josephine has Places 1–5 |

**CRITICAL JOSEPHINE CONSTRAINT:** Migration 090 created only Mayor + Place 1–4 = 5 offices. The actual Josephine council has Mayor + Places 1–5 = 6. Gary Chappell (Place 5) cannot be seeded.

**Josephine has NO May 2026 election** — not on any ballot list reviewed.

**No email addresses or bio URLs** found for any Josephine council members from the TML directory. The official site `cityofjosephinetx.com/government/city-council/` failed to fetch (redirect error). TML directory provided names only.

**Confidence:** HIGH for names (confirmed from TML directory); LOW for term dates and emails.

---

### TIER 4: BLUE RIDGE, TX

**geo_id:** `4808872`
**Source:** https://blueridgecity.com/council (fetched 2026-05-01)
**data_source:** `blueridgecity.com`

#### Roster

| DB Office Title | Name | Email | Term | May 2026 Ballot? |
|----------------|------|-------|------|-----------------|
| Mayor | Rhonda Williams | mayor@blueridgecity.com | — May 2026 | YES — Mayor on ballot; election has 2 at-large seats + Mayor |
| Council Member Place 1 | David Apple | council1@blueridgecity.com | — May 2026 | YES — at-large seat (Place 1 term expires May 2026) |
| Council Member Place 2 | Linda Braly (Mayor Pro Tem) | council2@blueridgecity.com | — May 2027 | No |
| Council Member Place 3 | Trenton Sissom | council3@blueridgecity.com | — May 2027 | No |
| Council Member Place 4 | Wendy Mattingly | council4@blueridgecity.com | — May 2027 | No |

**Emails confirmed** from official council page via role-based aliases (`mayor@`, `council1@` through `council4@blueridgecity.com`).

**Blue Ridge's DB-to-website mapping:** The website uses `council1` through `council4` email aliases which directly correspond to DB Place 1–4. This is a clean alignment.

**May 2, 2026 Election Flags:**
- **Mayor:** Rhonda Williams (incumbent, term expires May 2026) — on ballot. Wait for certified result.
- **Place 1 (council1):** David Apple (term expires May 2026) — on ballot. Wait for certified result.
- **Places 2, 3, 4:** Seed immediately (terms to May 2027).

**Confidence:** HIGH for names and emails (confirmed from official council page); MEDIUM for term dates (term expiry years confirmed, exact start dates not shown).

---

## Schema and SQL Pattern Reference

Same pattern as migrations 091–096. One DO block per politician.

### Standard DO Block

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
  WHERE g.geo_id = '4803300' AND o.title = 'Mayor';  -- Anna example

  IF v_office_id IS NULL THEN
    RAISE EXCEPTION 'Anna Mayor office not found — migration 090 must run first';
  END IF;

  INSERT INTO essentials.politicians (
    first_name, last_name, preferred_name, full_name,
    party, party_short_name,
    is_active, is_incumbent, is_vacant, is_appointed,
    office_id, valid_from, valid_to, term_date_precision,
    email_addresses, urls, data_source
  ) VALUES (
    'Pete', 'Cain', 'Pete', 'Pete Cain',
    NULL, NULL,
    true, true, false, false,
    v_office_id, '2024-05-01', '2027-05-01', 'month',
    NULL,
    ARRAY['https://www.annatexas.gov/1354/Pete-Cain'],
    'annatexas.gov'
  ) RETURNING id INTO v_politician_id;

  UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id;
  RAISE NOTICE 'Inserted: Pete Cain (Anna Mayor) — %', v_politician_id;
END $$;
```

### INSERT Columns for Phase 15

| Column | Value for Phase 15 rows |
|--------|------------------------|
| first_name | first name |
| last_name | last name |
| preferred_name | first name (same as first_name for all Phase 15 cities) |
| full_name | full name as found on official source |
| party | NULL (TX municipal elections are nonpartisan) |
| party_short_name | NULL |
| is_active | true |
| is_incumbent | true |
| is_vacant | false |
| is_appointed | false |
| office_id | looked up via geo_id + o.title JOIN |
| valid_from | TEXT if known; NULL if unknown |
| valid_to | TEXT if known; NULL if unknown |
| term_date_precision | 'month' when dates are known approximately; omit or NULL when dates unknown |
| email_addresses | ARRAY['email'] if confirmed from official source; NULL otherwise |
| urls | ARRAY['bio_url'] if individual bio page exists; ARRAY['council_page_url'] as fallback; NULL if none |
| data_source | city website domain |

### NOT-YET-SEEDED Comment Block Pattern

For seats where the May 2, 2026 election winner is pending certification:

```sql
-- ---------------------------------------------------------------------------
-- Anna Council Member Place 3 — NOT YET SEEDED (pending May 2, 2026 election certification)
-- Stan Carver II (incumbent, 2023-2026) is NOT running for re-election.
-- Candidates: Mike Olivarez vs. Jessica Walden
-- ACTION: After certification (est. May 5-9, 2026), verify winner on:
--   https://www.annatexas.gov/319/City-Council
--   then add a separate DO block to INSERT the winner.
-- ---------------------------------------------------------------------------
```

### NOT-FOUND Comment Block Pattern

```sql
-- NOT FOUND: [City] — [reason]
-- Tier [3/4] threshold applied. No findable roster from [source(s) checked].
```

---

## Election Status Summary for May 2, 2026

| City | Seats on Ballot | Status |
|------|----------------|--------|
| Anna | Place 3 (open, Carver not running), Place 5 (Baker contested) | Wait for certification |
| Melissa | NONE | Seed all now |
| Princeton | Place 4 special election (vacancy, 4 candidates) | Wait for certification |
| Lucas | Seat 1 (open), Seat 2 (open) | Wait for certification |
| Lavon | NONE | Seed all now |
| Fairview | Seat 2 (Boggs unopposed → likely declared), Seat 4 (open, contested), Seat 6 (Works vs Riyad) | Seat 2 likely certified; Seats 4+6 wait |
| Van Alstyne | Mayor (contested), Place 6 (contested) | Wait for certification |
| Farmersville | CANCELLED (uncontested) — Place 1 + Place 3 declared re-elected | Seed all now |
| Parker | Mayor (contested), 2 at-large seats (4 candidates, pick 2) | Wait for Mayor + at-large seats |
| Saint Paul | CANCELLED (uncontested) — Mayor + Seats 3,4,5 declared elected | Seed all now (new officials take office ~June 2026) |
| Nevada | Mayor + Place 1 + Place 2 (all running unopposed) | Wait for certification (expected to be re-elected) |
| Weston | NONE | Seed now (Places 1-4 only; Place 5 missing from DB) |
| Lowry Crossing | Ward 4 (2 seats, 3 candidates) | Seed Mayor + Places 1-3 now; Ward 4 wait |
| Josephine | NONE | Seed now (Places 1-4 only; Place 5 missing from DB) |
| Blue Ridge | Mayor + Place 1 (both contested) | Wait for certification |

---

## DB Schema Gaps (Existing Constraints from Migration 090)

These gaps exist in the DB and **cannot be fixed within Phase 15** — the offices simply don't exist:

| City | DB Offices | Actual Seats | Missing |
|------|-----------|-------------|---------|
| Weston | Mayor + Place 1-4 (5 total) | Mayor + 5 Aldermen (6 total) | Council Member Place 5 |
| Josephine | Mayor + Place 1-4 (5 total) | Mayor + Place 1-5 (6 total) | Council Member Place 5 |
| Lowry Crossing | Mayor + Place 1-4 (5 total) | Mayor + 6 ward members (7 total) | 3 additional ward seats |

**Resolution:** Seed what the DB has. Document the gap with a SQL comment in migration 098. The DB is not wrong — it reflects the structure seeded in Phase 12; fixing the seat count is out of Phase 15 scope.

---

## Contact Info Summary

| City | Emails | Bio URLs |
|------|--------|----------|
| Anna | NONE (not published) | Individual bio pages confirmed (annatexas.gov/NNNN/Name) |
| Melissa | Role-based aliases (place1@cityofmelissa.com pattern) confirmed | Individual EID directory pages confirmed |
| Princeton | NONE | NONE (no individual bio pages found) |
| Lucas | `{initial}{lastname}@lucastexas.us` confirmed for all 7 | NONE |
| Lavon | NONE | NONE |
| Fairview | All 7 confirmed (various firstname/RConnelly patterns @fairviewtexas.org) | Bio text on council page only (use council page URL) |
| Van Alstyne | Mayor only (mayor@cityofvanalstyne.us) | NONE |
| Farmersville | Form-based only (NOT usable — NULL) | Council page URL as fallback |
| Parker | `{initial}{lastname}@parkertexas.us` confirmed for all 6 | NONE |
| Saint Paul | Confirmed for Seats 1, 2, 5, Mayor (J.T. Trevino); NULL for Seat 3 (Greg Pierson), Seat 4 (Kristen Bewley) | NONE |
| Nevada | Role-based aliases confirmed (mayor@, councilman1@–councilman5@cityofnevadatx.org) | NONE |
| Weston | NONE | NONE |
| Lowry Crossing | All confirmed from official website (individual names @lowrycrossingtexas.org) | NONE |
| Josephine | NONE (TML data only) | NONE |
| Blue Ridge | Role-based aliases confirmed (mayor@, council1@–council4@blueridgecity.com) | NONE |

---

## Common Pitfalls

### Pitfall 1: Missing offices.politician_id Update

**What goes wrong:** INSERT into politicians sets `politicians.office_id` but `offices.politician_id` is left NULL.

**How to avoid:** Every DO block must include `UPDATE essentials.offices SET politician_id = v_politician_id WHERE id = v_office_id` immediately after the INSERT RETURNING.

### Pitfall 2: Using Wrong Lookup Title for Fairview

**What goes wrong:** Using `o.title = 'Council Member Place 1'` for Fairview instead of `'Council Member Seat 1'`.

**Why it happens:** Most Tier 3-4 cities use "Place" but Fairview uses "Seat 1–6" in the DB.

**How to avoid:** Fairview office titles in DB are `'Council Member Seat 1'` through `'Council Member Seat 6'`. Never use "Place" for Fairview.

### Pitfall 3: Seeding Outgoing Incumbents for Contested May 2026 Seats

**What goes wrong:** Seeding Stan Carver II (Anna Place 3), Tim Johnson (Lucas Place 1), Brian Stubblefield (Lucas Place 2), or other officials whose terms expire May 2026.

**How to avoid:** Check the election status table above. For any seat where election results are pending, leave the office empty (no politician row) and add a NOT-YET-SEEDED comment block.

### Pitfall 4: Princeton cityofprinceton.com Domain

**What goes wrong:** Navigating to `cityofprinceton.com` which is a domain-for-sale page, not the Princeton city government.

**How to avoid:** Princeton's official website is `princetontx.gov`. Never use `cityofprinceton.com` for anything.

### Pitfall 5: Seeding Weston/Josephine Place 5 or Lowry Crossing's Extra Members

**What goes wrong:** Attempting to seed Gary Chappell (Josephine Place 5), Marla Johnston (Weston Place 5), Chris Madrid, Agur Rios, or Cindy Cash (Lowry Crossing) — these offices do not exist in the DB.

**How to avoid:** Migration 090 created limited seat counts for these cities. Only seed up to the DB's defined office count. Document unresolvable members with a SQL comment.

### Pitfall 6: Weston Roster Confusion (Old vs. Current Officials)

**What goes wrong:** Using the 2023/2024 election results (Jerry Randall as Mayor, Heather Richardson, Don Coleman) which appear in search results.

**Why it happens:** Weston had turnover. The `westontexas.com/page/Mayor_Aldermen` page shows the CURRENT roster as of 2026-05-01: Matthew Marchiori (Mayor), Patti Harrington, Brian Roach, Jeff Metzger, Mike Hill, Marla Johnston.

**How to avoid:** Always use the current governing body page, not election result summaries.

### Pitfall 7: Saint Paul "Alderman" vs. "Council Member Place" Title Mismatch

**What goes wrong:** Using the city's official terminology ("Alderman Seat 1") in DB lookups instead of the DB's schema titles.

**Why it happens:** Saint Paul city website uses "Alderman" and "Seat 1–5". DB uses "Council Member Place 1–5".

**How to avoid:** DB lookups use `o.title = 'Council Member Place 1'` etc. Add SQL comment noting the city terminology discrepancy.

### Pitfall 8: Saint Paul Pre-Election vs. Post-Election Roster

**What goes wrong:** Seeding Kent Swaner (current Mayor), Justin Graham (Seat 3), or the old Seat 4 occupant because they appear on pre-election rosters.

**Why it happens:** May 2026 election was cancelled (all unopposed). J.T. Trevino won Mayor; Greg Pierson took Seat 3; Kristen Bewley took Seat 4.

**How to avoid:** Use the post-election roster. The election cancellation notice confirms the new officeholders. Seed J.T. Trevino as Mayor, Greg Pierson as Seat 3, Kristen Bewley as Seat 4 with `valid_from = '2026-06-01'`.

### Pitfall 9: Lucas "Seat" vs. DB "Place" Terminology

**What goes wrong:** Confusion between Lucas city website ("Seat 1–6") and DB titles ("Council Member Place 1–6").

**How to avoid:** DB lookup uses `o.title = 'Council Member Place 1'` etc. The Lucas council page calls them "Seat 1–6" but the DB uses "Place."

---

## Open Questions

1. **Anna Place 3 and Place 5 winners (May 2, 2026 election)**
   - What we know: Place 3 candidates are Mike Olivarez vs. Jessica Walden. Place 5: Elden Baker vs. Susan Jones.
   - What's unclear: Who won.
   - Recommendation: Check `annatexas.gov/319/City-Council` after certification (est. May 5-9).

2. **Princeton Place 4 special election winner**
   - What we know: 4 candidates filed (Ramani, Goria, Rutledge, Abdulkareem).
   - What's unclear: Who won.
   - Recommendation: Check `princetontx.gov/286/City-Council` after certification.

3. **Lucas Seat 1 and Seat 2 winners**
   - What we know: Seat 1: Richard Alan vs. Jonathan Underhill. Seat 2: John Awezec vs. Rebecca B. Orr.
   - Recommendation: Check `lucastexas.us/164/City-Council` after certification.

4. **Fairview Seat 4 winner (Ricardo Doi vs. John Stanley)**
   - What we know: Larry Little not running; two new candidates.
   - Recommendation: Check `fairviewtexas.org/government/town-council.html` after certification.

5. **Fairview Seat 6 winner (Lakia Works vs. Ryan Riyad)**
   - What we know: Lakia Works is the current incumbent.
   - Recommendation: Check same page after certification.

6. **Van Alstyne Mayor and Place 6 winners**
   - What we know: Mayor: Jim Atchison vs. Kevin Soucie. Place 6: Angelica Pena's term expires, contested.
   - Recommendation: Check `cityofvanalstyne.us/council` or CivicWeb members page after certification.

7. **Parker Mayor and 2 at-large seats winners**
   - What we know: Mayor: Lee Pettle vs. Marcos Arias vs. Melissa Tierce. At-Large: 4 candidates for 2 seats.
   - Recommendation: Check `parkertexas.us/76/City-Council` after certification.

8. **Blue Ridge Mayor and Place 1 winners**
   - What we know: Rhonda Williams (Mayor incumbent running) + David Apple (Place 1) are on ballot.
   - Recommendation: Check `blueridgecity.com/council` after certification.

9. **Weston Place number assignments**
   - What we know: 4 Aldermen names from official website; no Place numbers published.
   - What's unclear: Which alderman maps to which DB Place number.
   - Recommendation: Assign positionally by order listed on website page; add SQL comments noting the mapping is positional.

10. **Josephine city website**
    - What we know: Direct fetch failed (redirect error). TML data provided names for Mayor + Places 1-5.
    - What's unclear: Individual emails and bio URLs (none found via TML).
    - Recommendation: Try `cityofjosephinetx.com/government/city-council/` at planning time; use TML data as fallback.

---

## Sources

### Primary (HIGH confidence)
- https://www.annatexas.gov/319/City-Council — Anna roster with bio URLs (fetched 2026-05-01)
- https://www.cityofmelissa.com/202/City-Council — Melissa roster with role-based emails (fetched 2026-05-01)
- https://www.cityofmelissa.com/287/Elections — Confirmed Melissa has no May 2026 election (fetched 2026-05-01)
- https://princetontx.gov/Directory.aspx?did=37 — Princeton roster with all 8 members (fetched 2026-05-01)
- https://www.princetontx.gov/294/Elections — Princeton Place 4 special election confirmed (fetched 2026-05-01)
- https://www.lucastexas.us/164/City-Council — Lucas full roster with emails (fetched 2026-05-01)
- https://lavontx.gov/city-council/ — Lavon full roster (fetched 2026-05-01)
- https://fairviewtexas.org/government/town-council.html — Fairview full roster with emails (fetched 2026-05-01)
- https://cityofvanalstyne.civicweb.net/portal/members.aspx?id=10 — Van Alstyne roster with precise term dates (fetched 2026-05-01)
- https://www.farmersvilletx.com/city-council — Farmersville roster (fetched 2026-05-01)
- https://www.farmersvilletx.com/city-secretary/page/elections — Election cancelled confirmed (fetched 2026-05-01)
- https://www.parkertexas.us/76/City-Council — Parker roster with emails (fetched 2026-05-01)
- https://www.stpaultexas.us/local_government/elected_officials/seats_1-5.php — Saint Paul Seats 1-5 with emails (fetched 2026-05-01)
- https://www.stpaultexas.us/local_government/elections.php — Saint Paul election cancelled, declared winners (fetched 2026-05-01)
- https://cityofnevadatx.org/government/city_council.php — Nevada roster with role-based emails (fetched 2026-05-01)
- https://www.westontexas.com/page/Mayor_Aldermen — Weston current governing body (fetched 2026-05-01)
- https://lowrycrossingtexas.org/operations/city_council.php — Lowry Crossing ward-based roster with emails (fetched 2026-05-01)
- https://directory.tml.org/profile/city/994 — Josephine roster (Mayor + Places 1-5) from TML (fetched 2026-05-01)
- https://blueridgecity.com/council — Blue Ridge roster with emails (fetched 2026-05-01)
- C:/EV-Accounts/backend/migrations/090_tx_tier34_cities.sql — Definitive office titles and seat counts for all 16 cities
- C:/EV-Accounts/backend/migrations/096_murphy_celina_prosper_politicians.sql — Reference SQL pattern
- DB query on essentials.offices (executed 2026-05-01) — Confirmed all office_ids

### Secondary (MEDIUM confidence)
- https://www.lwvcollin.org/candidates — Definitive LWV Collin County May 2, 2026 candidate list (fetched 2026-05-01)
- https://www.nbcdfw.com/news/politics/lone-star-politics/collin-county-election-all-races-may-2-2026/4012500/ — Collin County election races confirmed
- https://directory.tml.org/profile/city/524 — Van Alstyne TML officials (fetched 2026-05-01)
- https://directory.tml.org/profile/city/840 — Saint Paul TML officials (cross-reference)

### Tertiary (LOW confidence)
- WebSearch snippets for Princeton mayor election (Eugene Escobar Jr. election win Dec 2024) — verified from multiple news sources
- WebSearch for Van Alstyne Place 6 candidate names — details unclear, election in Grayson County not Collin

---

## Metadata

**Confidence breakdown:**
- Tier 3 rosters: HIGH overall — all 8 cities confirmed from official websites or TML
- Tier 4 rosters: HIGH for Parker, Saint Paul, Nevada, Blue Ridge; MEDIUM for Weston (no place numbers); MEDIUM for Lowry Crossing (Ward mapping); LOW for Josephine (site error, TML only)
- Election ballot facts: HIGH — confirmed from LWV Collin County + official city election pages
- Term dates: MEDIUM for cities showing dates on website; LOW for cities not publishing term dates
- Email addresses: HIGH where confirmed from official website; NULL/LOW elsewhere

**Research date:** 2026-05-01
**Valid until:** 2026-05-09 for election-sensitive cities (Anna, Princeton, Lucas, Fairview, Van Alstyne, Parker, Nevada, Blue Ridge); 2026-06-01 for stable cities (Melissa, Lavon, Farmersville, Weston, Lowry Crossing, Josephine); Saint Paul officials take effect ~June 2026.
