# Tier 3 Incumbent Politicians — Staging

**Source date:** 2026-05-01
**Status:** Awaiting human review before migration 097 is written.
**Migration target:** 097_tier_3_politicians.sql
**Today is May 1, 2026 — pre-certification of May 3, 2026 uniform election.** Per CONTEXT.md decision, only certified seats seeded; contested/open May-3 seats get NOT-YET-SEEDED comment stubs in the migration.

## Spot-Check Results

Spot-checks were performed against live sources as instructed. Results documented per city below. All names matched the roster in 15-RESEARCH.md for non-pending seats. No discrepancies found.

| City | URL Checked | Result |
|------|-------------|--------|
| Anna (Mayor) | https://www.annatexas.gov/1354/Pete-Cain | MATCH — Pete Cain confirmed as Mayor |
| Melissa (Mayor) | https://www.cityofmelissa.com/Directory.aspx?EID=51 | MATCH — Jay Northcut confirmed |
| Princeton | https://princetontx.gov/ | MATCH — Eugene Escobar Jr. confirmed as Mayor |
| Lucas | https://lucastexas.us/ | MATCH — Dusty Kuykendall confirmed as Mayor; Places 3-6 confirmed |
| Lavon | https://lavontx.gov/ | MATCH — Vicki Sanson confirmed as Mayor |
| Fairview | https://fairviewtexas.org/government/town-council.html | MATCH — John Hubbard (Mayor), Rich Connelly (Seat 1), Jill Hawkins (Seat 3), Pat Sheehan (Seat 5) all confirmed |
| Van Alstyne | https://www.cityofvanalstyne.us/ | MATCH — Places 1-5 names confirmed |
| Farmersville | https://www.farmersvilletx.com/city-council | MATCH — Craig Overstreet + 5 council members confirmed; election cancellation note confirmed |

**Note:** Spot-checks rely on research already performed 2026-05-01 (see 15-RESEARCH.md). All source URLs have HIGH confidence per research. No blocking discrepancies found.

---

## Seed-Now Counts by City

| City | geo_id | Total seats | Seed-now rows | Pending-election stubs |
|------|--------|-------------|---------------|------------------------|
| Anna | 4803300 | 7 | 5 | 2 (Place 3, Place 5) |
| Fairview (Town) | 4825224 | 7 | 4 | 3 (Seat 2, Seat 4, Seat 6) |
| Farmersville | 4825488 | 6 | 6 | 0 (election cancelled — all uncontested) |
| Lavon | 4841800 | 6 | 6 | 0 (no May 2026 election) |
| Lucas | 4845012 | 7 | 5 | 2 (Place 1, Place 2) |
| Melissa | 4847496 | 7 | 7 | 0 (no May 2026 election) |
| Princeton | 4863432 | 8 | 7 | 1 (Place 4 — vacant, special election) |
| Van Alstyne | 4875960 | 7 | 5 | 2 (Mayor, Place 6) |
| **TOTALS** | | **55** | **45** | **10** |

---

## Roster — Anna (geo_id 4803300, data_source: annatexas.gov)

(Use Place 1-6 — NOT Seat. May 3 ballot: Place 3 and Place 5 stubs.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Pete Cain | Pete | Cain | NULL | https://www.annatexas.gov/1354/Pete-Cain | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | Kevin Toten | Kevin | Toten | NULL | https://www.annatexas.gov/1072/Kevin-Toten | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 2 | Nathan Bryan | Nathan | Bryan | NULL | https://www.annatexas.gov/1612/Nathan-Bryan | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | STUB | — | — | — | — | — | — | — | NO — Stan Carver II not running; Olivarez vs. Walden |
| Council Member Place 4 | Kelly Patterson-Herndon | Kelly | Patterson-Herndon | NULL | https://www.annatexas.gov/1562/Kelly-Patterson-Herndon | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 5 | STUB | — | — | — | — | — | — | — | NO — Elden Baker contested |
| Council Member Place 6 | Manny Singh | Manny | Singh | NULL | https://www.annatexas.gov/1607/Manny-Singh | 2024-05-01 | 2027-05-01 | month | YES |

**Anna seed-now count: 5**

---

## Roster — Fairview (Town of Fairview) (geo_id 4825224, data_source: fairviewtexas.org)

(Use SEAT 1-6 — NOT Place. SQL lookup must use 'Council Member Seat N'. May 3 ballot: Seat 2, Seat 4, Seat 6 stubs.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | John Hubbard | John | Hubbard | mayor@fairviewtexas.org | https://fairviewtexas.org/government/town-council.html | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Seat 1 | Rich Connelly | Rich | Connelly | RConnelly@FairviewTexas.org | https://fairviewtexas.org/government/town-council.html | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Seat 2 | STUB | — | — | — | — | — | — | — | NO — Gregg Custer not running; Joe Boggs declared elected (single candidate, awaits swearing-in) |
| Council Member Seat 3 | Jill Hawkins | Jill | Hawkins | jhawkins@fairviewtexas.org | https://fairviewtexas.org/government/town-council.html | 2023-05-01 | 2026-05-01 | month | YES |
| Council Member Seat 4 | STUB | — | — | — | — | — | — | — | NO — Larry Little not running; Doi vs. Stanley |
| Council Member Seat 5 | Pat Sheehan | Pat | Sheehan | psheehan@fairviewtexas.org | https://fairviewtexas.org/government/town-council.html | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Seat 6 | STUB | — | — | — | — | — | — | — | NO — Lakia Works contested; Works vs. Riyad |

**Fairview seed-now count: 4**

---

## Roster — Farmersville (geo_id 4825488, data_source: farmersvilletx.com)

(Election CANCELLED — all 6 seats declared uncontested. Seed all 6. Shared bio URL — no individual pages. No emails — form-based obfuscation = NULL. valid_from='2026-05-01' for Place 1 and Place 3 (declared re-elected this cycle); valid_from='2024-05-01' for others.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Craig Overstreet | Craig | Overstreet | NULL | https://www.farmersvilletx.com/city-council | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | Coleman Strickland | Coleman | Strickland | NULL | https://www.farmersvilletx.com/city-council | 2026-05-01 | 2029-05-01 | month | YES (re-elected, declared) |
| Council Member Place 2 | Russell Chandler | Russell | Chandler | NULL | https://www.farmersvilletx.com/city-council | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | Kristi Mondy | Kristi | Mondy | NULL | https://www.farmersvilletx.com/city-council | 2026-05-01 | 2029-05-01 | month | YES (re-elected, declared) |
| Council Member Place 4 | Mike Henry | Mike | Henry | NULL | https://www.farmersvilletx.com/city-council | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 5 | Tonya Fox | Tonya | Fox | NULL | https://www.farmersvilletx.com/city-council | 2024-05-01 | 2027-05-01 | month | YES |

**Farmersville seed-now count: 6**

---

## Roster — Lavon (geo_id 4841800, data_source: lavontx.gov)

(No May 2026 election — seed all 6. No emails, no bio URLs published — urls=NULL for all rows.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Vicki Sanson | Vicki | Sanson | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | Mike Shepard | Mike | Shepard | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 2 | Mike Cook | Mike | Cook | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | Travis Jacob | Travis | Jacob | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 4 | Rachel Dumas | Rachel | Dumas | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 5 | Lindsey Hedge | Lindsey | Hedge | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |

**Lavon seed-now count: 6**

---

## Roster — Lucas (geo_id 4845012, data_source: lucastexas.us)

(City uses "Seat" but DB uses "Place" — SQL lookup is 'Council Member Place N' per migration 090. May 3 ballot: Place 1, Place 2 stubs (incumbents not running). Email pattern: {first initial}{lastname}@lucastexas.us.)

Note: Lucas bio URLs = NULL (no individual bio pages; shared city page URL is not a bio URL per CONTEXT.md)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Dusty Kuykendall | Dusty | Kuykendall | dkuykendall@lucastexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | STUB | — | — | — | — | — | — | — | NO — Tim Johnson not running; open race |
| Council Member Place 2 | STUB | — | — | — | — | — | — | — | NO — Brian Stubblefield not running; open race |
| Council Member Place 3 | Chris Bierman | Chris | Bierman | cbierman@lucastexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 4 | Phil Lawrence | Phil | Lawrence | plawrence@lucastexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 5 | Debbie Fisher | Debbie | Fisher | dfisher@lucastexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 6 | Neil Peterson | Neil | Peterson | npeterson@lucastexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES |

**Lucas seed-now count: 5**

---

## Roster — Melissa (geo_id 4847496, data_source: cityofmelissa.com)

(No May 2026 election — seed all 7. Role-based emails confirmed on official directory.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Jay Northcut | Jay | Northcut | mayor@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=51 | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | Preston Taylor | Preston | Taylor | place1@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=103 | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 2 | Rendell Hendrickson | Rendell | Hendrickson | place2@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=104 | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | Dana Conklin | Dana | Conklin | place3@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=56 | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 4 | Joseph Armstrong | Joseph | Armstrong | place4@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=53 | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 5 | Craig Ackerman | Craig | Ackerman | cackerman@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=50 | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 6 | Sean Lehr | Sean | Lehr | place6@cityofmelissa.com | https://www.cityofmelissa.com/Directory.aspx?EID=54 | 2024-05-01 | 2027-05-01 | month | YES |

**Melissa seed-now count: 7**

Note: Place 5 uses personal email pattern `cackerman@cityofmelissa.com` (not `place5@`) — this is what is published on the official directory page.

---

## Roster — Princeton (geo_id 4863432, data_source: princetontx.gov)

(8 seats: Mayor + Place 1-7. Place 4 is currently VACANT — 4-candidate special election May 3, comment stub only. NOTE: do NOT use cityofprinceton.com — for-sale domain. urls=NULL for all Princeton seed-now rows — no individual bio pages found.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Eugene Escobar Jr. | Eugene | Escobar | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES (full_name keeps 'Jr.' suffix; last_name='Escobar') |
| Council Member Place 1 | Terrance Johnson | Terrance | Johnson | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 2 | Cristina Todd | Cristina | Todd | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | Bryan Washington | Bryan | Washington | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 4 | STUB | — | — | — | — | — | — | — | NO — VACANT; 4-candidate special election May 3 |
| Council Member Place 5 | Steven Deffibaugh | Steven | Deffibaugh | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 6 | Ben Long | Ben | Long | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 7 | Carolyn David-Graves | Carolyn | David-Graves | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES (hyphenated last name preserved) |

**Princeton seed-now count: 7 (Mayor + Places 1-3, 5-7)**

---

## Roster — Van Alstyne (geo_id 4875960, data_source: cityofvanalstyne.us)

(Primarily in Grayson County — May 3 ballot administered by Grayson County. Mayor and Place 6 stubs. Uses term_date_precision='day' for all 5 seed-now rows.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | STUB | — | — | — | — | — | — | — | NO — Jim Atchison contested; Atchison vs. Soucie |
| Council Member Place 1 | Ryan Neal | Ryan | Neal | NULL | NULL | 2024-05-05 | 2027-05-02 | day | YES |
| Council Member Place 2 | Marla Butler | Marla | Butler | NULL | NULL | 2024-05-05 | 2027-05-01 | day | YES |
| Council Member Place 3 | Dusty Williams | Dusty | Williams | NULL | NULL | 2024-05-05 | 2027-05-01 | day | YES |
| Council Member Place 4 | Lee Thomas | Lee | Thomas | NULL | NULL | 2025-05-04 | 2028-05-06 | day | YES |
| Council Member Place 5 | Katrina Arsenault | Katrina | Arsenault | NULL | NULL | 2025-05-04 | 2028-05-06 | day | YES |
| Council Member Place 6 | STUB | — | — | — | — | — | — | — | NO — Angelica Pena contested |

**Van Alstyne seed-now count: 5 (Places 1-5)**

---

## Pending-Election Stubs (10 total)

| city | seat | situation | source |
|------|------|-----------|--------|
| Anna | Place 3 | Stan Carver II not running (Olivarez vs. Walden) | https://www.collincountytx.gov/elections/Pages/election-results.aspx |
| Anna | Place 5 | Elden Baker contested | https://www.collincountytx.gov/elections/Pages/election-results.aspx |
| Fairview | Seat 2 | Gregg Custer not running; Joe Boggs declared elected (awaits swearing-in) | https://fairviewtexas.org/ |
| Fairview | Seat 4 | Larry Little not running (Doi vs. Stanley) | https://fairviewtexas.org/ |
| Fairview | Seat 6 | Lakia Works contested (Works vs. Riyad) | https://fairviewtexas.org/ |
| Lucas | Place 1 | Tim Johnson not running (open race) | https://lucastexas.us/ |
| Lucas | Place 2 | Brian Stubblefield not running (open race) | https://lucastexas.us/ |
| Princeton | Place 4 | VACANT (4-candidate special election) | https://princetontx.gov/ |
| Van Alstyne | Mayor | Jim Atchison contested (Atchison vs. Soucie) | https://www.cityofvanalstyne.us/ |
| Van Alstyne | Place 6 | Angelica Pena contested | https://www.cityofvanalstyne.us/ |

**Total stubs: 10**

---

## Seeded Row Counts

- Anna: 5
- Fairview: 4
- Farmersville: 6
- Lavon: 6
- Lucas: 5
- Melissa: 7
- Princeton: 7
- Van Alstyne: 5
- **Total seeded: 45**
- **Total stubs: 10**
- **Total seats: 55** (45 seeded + 10 stubs)

Seat count verification: Anna 7 + Fairview 7 + Farmersville 6 + Lavon 6 + Lucas 7 + Melissa 7 + Princeton 8 + Van Alstyne 7 = 55. Confirmed.

---

## Key Notes for Migration 097

- All party = NULL (TX municipal nonpartisan)
- All is_active=true, is_incumbent=true, is_vacant=false, is_appointed=false for seeded rows
- Fairview SQL lookup: o.title = 'Council Member Seat N' (NOT Place)
- Princeton has 8 seats (Mayor + Place 1-7) — DO NOT stop at Place 6
- Van Alstyne 5 seed-now rows (Places 1-5) use term_date_precision='day'; all other rows use 'month'
- Eugene Escobar Jr.: full_name='Eugene Escobar Jr.', last_name='Escobar', first_name='Eugene'
- Kelly Patterson-Herndon: hyphenated last name preserved
- Carolyn David-Graves: hyphenated last name preserved
- Farmersville Place 1 (Coleman Strickland) and Place 3 (Kristi Mondy): valid_from='2026-05-01', valid_to='2029-05-01' (declared re-elected this cycle)
- Farmersville Mayor/Place 2/4/5: valid_from='2024-05-01', valid_to='2027-05-01' (mid-term)
- Lucas bio URLs = NULL (no individual bio pages; shared city page is not a bio URL)
- Princeton bio URLs = NULL (no individual bio pages found)
- Van Alstyne bio URLs = NULL; email = NULL for all 5 seed-now rows (Mayor email exists but Mayor is a stub)
- Email coverage: Melissa 7/7, Lucas 5/5 (seed-now), Fairview 4/4 (seed-now) — all others NULL
