# Tier 4 Incumbent Politicians — Staging

**Source date:** 2026-05-01
**Status:** Awaiting human review before migration 098 is written.
**Migration target:** 098_tier_4_politicians.sql
**Cities covered (alphabetical):** Blue Ridge, Josephine, Lowry Crossing, Nevada, Parker, Saint Paul, Weston
**Excluded:** Copeville (possibly unincorporated CDP per CONTEXT.md)

**Today is May 1, 2026 — pre-certification of May 3, 2026 uniform election.** Per CONTEXT.md decision, only certified seats seeded; contested/open May-3 seats get NOT-YET-SEEDED stubs. Cancelled elections (Saint Paul = all unopposed = all declared elected) count as certified.

## Spot-Check Notes (2026-05-01)

Spot-checks performed against live city websites immediately before writing this file:

- **Blue Ridge (blueridgecity.com/council):** CONFIRMED — Linda Braly (Mayor Pro-Tem, Term ends May 2027), Trenton Sissom (Term ends May 2027), Wendy Mattingly (Term ends May 2027). Rhonda Williams (Mayor) and David Apple both show Term ends May 2026 — on ballot, correctly stubbed.
- **Josephine (cityofjosephinetx.com):** Site redirects/unreachable — same behavior as at research time. TML data used as authoritative fallback per CONTEXT.md policy. Names unchanged from research.
- **Lowry Crossing (lowrycrossingtexas.org):** CONFIRMED — Pat Kelly (Mayor), Scott Pitchure (Ward 1), Tammy Hodges (Ward 2, Mayor Pro Tem), Eusebio "Joe" Trujillo III (Ward 3), Chris Madrid (Ward 1/2nd), Agur Rios (Ward 2/2nd), Cindy Cash (Ward 3/2nd). All emails confirmed plain-text.
- **Nevada (cityofnevadatx.org):** CONFIRMED — Deering (mayor@), Laye (councilman1@), Baker (councilman2@), Wilson (councilman3@), Laughter (councilman4@), Little (councilman5@) — all @cityofnevadatx.org.
- **Parker (parkertexas.us/76/City-Council):** CONFIRMED — Roxanne Bogdan (Term May 2027), Colleen Halbert (Term May 2027), Darrel Sharpe (Term May 2027). Lee Pettle (Mayor, May 2026), Buddy Pilgrim (Mayor Pro Tem, May 2026), Billy Barron (May 2026) — all on ballot, correctly stubbed.
- **Saint Paul (stpaultexas.us/local_government/elections.php):** CONFIRMED — Elections page explicitly states "The May 2nd, 2026 General and Special Elections have been cancelled due to unopposed candidates." Lists declared-elected: JT Trevino (Mayor), Robert Simmons (Place 5 Alderman), Kristen Bewley (Place 4 Alderwoman), Greg Pierson (Place 3 Alderman). Larry Nail (Seat 1) and David Dryden (Seat 2) are continuing incumbents not listed on the cancellation notice — confirmed on seats_1-5.php.
- **Weston (westontexas.com/page/Mayor_Aldermen):** CONFIRMED — Matthew Marchiori (Mayor), Patti Harrington (Alderman), Brian M. Roach (Alderman), Jeff Metzger (Mayor Pro Tem), Mike Hill (Alderman), Marla Johnston (Alderman). **DEVIATION FROM RESEARCH:** Website shows email addresses for all 6 — research noted NULL but emails ARE published. Emails: mmarchiori@westontexas.com, pharrington@westontexas.com, broach@westontexas.com, jmetzger@westontexas.com, mhill@westontexas.com, mjohnston@westontexas.com. Seededable rows updated to include these emails.

## Seed-Now Counts by City

| City | geo_id | DB seats | Seed-now rows | Pending-election stubs | Cannot-seed (DB gap) |
|------|--------|----------|---------------|------------------------|----------------------|
| Blue Ridge | 4808872 | 5 (Mayor + Place 1-4) | 3 | 2 (Mayor, Place 1) | 0 |
| Josephine | 4838068 | 5 (Mayor + Place 1-4) | 5 | 0 | 1 (Gary Chappell — Place 5 not in DB) |
| Lowry Crossing | 4844308 | 5 (Mayor + Place 1-4) | 4 | 1 (Place 4 / Ward 4 special election) | 3 (Madrid/Rios/Cash — extra wards) |
| Nevada | 4850760 | 6 (Mayor + Place 1-5) | 3 | 3 (Mayor, Place 1, Place 2 — unopposed pending cert) | 0 |
| Parker | 4855152 | 6 (Mayor + Place 1-5) | 3 | 3 (Mayor, Place 3, Place 5) | 0 |
| Saint Paul | 4864220 | 6 (Mayor + Place 1-5) | 6 | 0 (all unopposed → declared elected) | 0 |
| Weston | 4877740 | 5 (Mayor + Place 1-4) | 5 | 0 | 1 (Marla Johnston — Place 5 not in DB) |
| **TOTALS** | | **38** | **29** | **9** | **5** |

## Roster — Blue Ridge (geo_id 4808872, data_source: blueridgecity.com)

(Role-based emails confirmed. May 3 ballot: Mayor and Place 1 stubs — both contested.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | STUB | — | — | — | — | — | — | — | NO — Rhonda Williams contested |
| Council Member Place 1 | STUB | — | — | — | — | — | — | — | NO — David Apple contested |
| Council Member Place 2 | Linda Braly | Linda | Braly | council2@blueridgecity.com | https://blueridgecity.com/ | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | Trenton Sissom | Trenton | Sissom | council3@blueridgecity.com | https://blueridgecity.com/ | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 4 | Wendy Mattingly | Wendy | Mattingly | council4@blueridgecity.com | https://blueridgecity.com/ | 2024-05-01 | 2027-05-01 | month | YES |

## Roster — Josephine (geo_id 4838068, data_source: cityofjosephinetx.com)

(No May 2026 election. No emails. City website unreachable — TML data used as fallback. **DB GAP: Place 5 office does not exist in DB. Gary Chappell cannot be seeded.**)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Jason Turney | Jason | Turney | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | April Aurand | April | Aurand | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 2 | Jane Ridgway | Jane | Ridgway | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 3 | Alex Esquivel | Alex | Esquivel | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 4 | Pam Sardo | Pam | Sardo | NULL | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| (no DB office) | Gary Chappell | — | — | — | — | — | — | — | NO — DB GAP: City Place 5 not in DB |

## Roster — Lowry Crossing (geo_id 4844308, data_source: lowrycrossingtexas.org)

(Emails confirmed plain-text. **DB GAP: city has Mayor + 6 ward-based seats; DB has Mayor + Place 1-4. Map Wards 1-3 → Places 1-3. Ward 4 (vacant, special election May 3) is a stub at Place 4. Three extra ward seats cannot be seeded.**)

| office_title | full_name | first_name | last_name | preferred_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|----------------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Pat Kelly | Pat | Kelly | Pat | pkelly@lowrycrossingtexas.org | https://www.lowrycrossingtexas.org/ | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | Scott Pitchure | Scott | Pitchure | Scott | spitchure@lowrycrossingtexas.org | https://www.lowrycrossingtexas.org/ | 2024-05-01 | 2027-05-01 | month | YES (Ward 1 → Place 1) |
| Council Member Place 2 | Tammy Hodges | Tammy | Hodges | Tammy | thodges@lowrycrossingtexas.org | https://www.lowrycrossingtexas.org/ | 2024-05-01 | 2027-05-01 | month | YES (Ward 2 → Place 2) |
| Council Member Place 3 | Eusebio "Joe" Trujillo III | Eusebio | Trujillo | Joe | etrujillo@lowrycrossingtexas.org | https://www.lowrycrossingtexas.org/ | 2024-05-01 | 2027-05-01 | month | YES (Ward 3 → Place 3; preferred_name='Joe', full_name preserves quotes and III suffix) |
| Council Member Place 4 | STUB | — | — | — | — | — | — | — | — | NO — VACANT Ward 4 special election May 3 |
| (no DB office) | Chris Madrid | — | — | — | — | — | — | — | — | NO — DB GAP: extra Ward 1 seat |
| (no DB office) | Agur Rios | — | — | — | — | — | — | — | — | NO — DB GAP: extra Ward 2 seat |
| (no DB office) | Cindy Cash | — | — | — | — | — | — | — | — | NO — DB GAP: extra Ward 3 seat |

## Roster — Nevada (geo_id 4850760, data_source: cityofnevadatx.org)

(Role-based emails confirmed. Mayor + Place 1 + Place 2 are running unopposed in May 3 — pending certification. Do NOT pre-seed unopposed-but-not-yet-certified seats.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | STUB | — | — | — | — | — | — | — | NO — Donald Deering unopposed pending cert |
| Council Member Place 1 | STUB | — | — | — | — | — | — | — | NO — Mike Laye unopposed pending cert |
| Council Member Place 2 | STUB | — | — | — | — | — | — | — | NO — Paul Baker unopposed pending cert |
| Council Member Place 3 | Amanda Wilson | Amanda | Wilson | councilman3@cityofnevadatx.org | NULL | 2024-05-01 | 2026-05-01 | month | YES |
| Council Member Place 4 | Clayton Laughter | Clayton | Laughter | councilman4@cityofnevadatx.org | NULL | 2024-05-01 | 2026-05-01 | month | YES |
| Council Member Place 5 | Derrick Little | Derrick | Little | councilman5@cityofnevadatx.org | NULL | 2024-05-01 | 2026-05-01 | month | YES |

## Roster — Parker (geo_id 4855152, data_source: parkertexas.us)

(Email pattern: {first initial}{lastname}@parkertexas.us. **City does not publish Place numbers — assignment is positional per research website order.** May 3 ballot: Mayor (3-candidate), Place 3 + Place 5 (at-large 4-candidate, top-2 wins). Stubs for those 3.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | STUB | — | — | — | — | — | — | — | NO — Lee Pettle 3-candidate race |
| Council Member Place 1 | Roxanne Bogdan | Roxanne | Bogdan | rbogdan@parkertexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES (positional Place 1) |
| Council Member Place 2 | Colleen Halbert | Colleen | Halbert | chalbert@parkertexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES (positional Place 2) |
| Council Member Place 3 | STUB | — | — | — | — | — | — | — | NO — Buddy Pilgrim at-large 4-candidate race |
| Council Member Place 4 | Darrel Sharpe | Darrel | Sharpe | dsharpe@parkertexas.us | NULL | 2024-05-01 | 2027-05-01 | month | YES (positional Place 4) |
| Council Member Place 5 | STUB | — | — | — | — | — | — | — | NO — Billy Barron same at-large race as Place 3 |

## Roster — Saint Paul (geo_id 4864220, data_source: stpaultexas.us)

(**Election cancelled — all 6 seats unopposed/declared elected.** Newly-elected/declared use valid_from='2026-06-01'. Continuing incumbents keep prior valid_from. City uses "Alderman/Seat"; DB uses "Council Member Place 1-5". Mayor Trevino moves up from former Seat 4. Elections page confirms: JT Trevino (Mayor), Robert Simmons (Place 5), Kristen Bewley (Place 4), Greg Pierson (Place 3) declared elected.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | J.T. Trevino | J.T. | Trevino | jt.trevino@stpaultexas.us | https://stpaultexas.us/ | 2026-06-01 | 2029-06-01 | month | YES (declared elected from former Seat 4; periods in first_name preserved) |
| Council Member Place 1 | Larry Nail | Larry | Nail | larry.nail@stpaultexas.us | https://stpaultexas.us/ | 2024-05-01 | 2027-05-01 | month | YES (continuing incumbent) |
| Council Member Place 2 | David Dryden | David | Dryden | david.dryden@stpaultexas.us | https://stpaultexas.us/ | 2024-05-01 | 2027-05-01 | month | YES (continuing incumbent) |
| Council Member Place 3 | Greg Pierson | Greg | Pierson | NULL | https://stpaultexas.us/ | 2026-06-01 | 2029-06-01 | month | YES (declared elected; email not yet published) |
| Council Member Place 4 | Kristen Bewley | Kristen | Bewley | NULL | https://stpaultexas.us/ | 2026-06-01 | 2029-06-01 | month | YES (declared elected; email not yet published) |
| Council Member Place 5 | Robert Simmons | Robert | Simmons | robert.simmons@stpaultexas.us | https://stpaultexas.us/ | 2026-06-01 | 2029-06-01 | month | YES (re-elected; new term begins 2026-06-01) |

## Roster — Weston (geo_id 4877740, data_source: westontexas.com)

(No May 2026 election. **Emails ARE published on westontexas.com/page/Mayor_Aldermen (spot-check corrects research note of NULL).** **DB GAP: city has 6 aldermen; DB has Mayor + Place 1-4. Marla Johnston cannot be seeded — no Place 5 office.** Place numbers assigned positionally.)

| office_title | full_name | first_name | last_name | email | bio_url | valid_from | valid_to | term_date_precision | seed-now? |
|--------------|-----------|------------|-----------|-------|---------|------------|----------|---------------------|-----------|
| Mayor | Matthew Marchiori | Matthew | Marchiori | mmarchiori@westontexas.com | NULL | 2024-05-01 | 2027-05-01 | month | YES |
| Council Member Place 1 | Patti Harrington | Patti | Harrington | pharrington@westontexas.com | NULL | 2024-05-01 | 2027-05-01 | month | YES (positional) |
| Council Member Place 2 | Brian M. Roach | Brian | Roach | broach@westontexas.com | NULL | 2024-05-01 | 2027-05-01 | month | YES (full_name='Brian M. Roach'; first_name='Brian', last_name='Roach') |
| Council Member Place 3 | Jeff Metzger | Jeff | Metzger | jmetzger@westontexas.com | NULL | 2024-05-01 | 2027-05-01 | month | YES (positional; Mayor Pro Tem per website) |
| Council Member Place 4 | Mike Hill | Mike | Hill | mhill@westontexas.com | NULL | 2024-05-01 | 2027-05-01 | month | YES (positional) |
| (no DB office) | Marla Johnston | — | — | mjohnston@westontexas.com | — | — | — | — | NO — DB GAP: no Place 5 office |

## Pending-Election Stubs (9 total)

| city | seat | situation | source |
|------|------|-----------|--------|
| Blue Ridge | Mayor | Rhonda Williams contested | https://blueridgecity.com/ |
| Blue Ridge | Place 1 | David Apple contested | https://blueridgecity.com/ |
| Lowry Crossing | Place 4 | VACANT (Ward 4 special election) | https://www.lowrycrossingtexas.org/ |
| Nevada | Mayor | Donald Deering unopposed pending certification | https://www.cityofnevadatx.org/ |
| Nevada | Place 1 | Mike Laye unopposed pending certification | https://www.cityofnevadatx.org/ |
| Nevada | Place 2 | Paul Baker unopposed pending certification | https://www.cityofnevadatx.org/ |
| Parker | Mayor | Lee Pettle 3-candidate race | https://parkertexas.us/ |
| Parker | Place 3 | Buddy Pilgrim at-large 4-candidate race (top 2 win Places 3+5) | https://parkertexas.us/ |
| Parker | Place 5 | Billy Barron same at-large race as Place 3 | https://parkertexas.us/ |

**Total stubs: 9** (Blue Ridge 2 + Lowry Crossing 1 + Nevada 3 + Parker 3 = 9)

## DB Schema Gaps (3 cities, 5 persons — NOT to be fixed in Phase 15)

| city | gap | persons affected | resolution |
|------|-----|------------------|------------|
| Weston | DB has Mayor + Place 1-4 (5 offices); city has 6 aldermen | Marla Johnston | Cannot seed; future migration could add Place 5 office |
| Josephine | DB has Mayor + Place 1-4 (5 offices); city has 5 council members | Gary Chappell | Cannot seed; future migration could add Place 5 office |
| Lowry Crossing | DB has Mayor + Place 1-4 (5 offices); city has 6 ward-based seats + Mayor | Chris Madrid, Agur Rios, Cindy Cash | Cannot seed; future migration could add 3 ward seats |

## Seeded Row Counts

- Blue Ridge: 3
- Josephine: 5
- Lowry Crossing: 4
- Nevada: 3
- Parker: 3
- Saint Paul: 6
- Weston: 5
- **Total seeded: 29**
- **Total stubs: 9**
- **Total cannot-seed: 5** (Marla Johnston, Gary Chappell, Chris Madrid, Agur Rios, Cindy Cash)
- **Excluded: Copeville (no entries at all)**

## Key Notes for Migration 098

- All party = NULL (TX municipal nonpartisan)
- All is_active=true, is_incumbent=true, is_vacant=false, is_appointed=false for seeded rows
- All term_date_precision='month' (no day-precision rows in Tier 4)
- Saint Paul DB lookup: o.title = 'Council Member Place N' (NOT 'Seat N' — DB uses Place even though city uses Seat/Alderman)
- Saint Paul date logic: Mayor (Trevino) + Place 3 (Pierson) + Place 4 (Bewley) + Place 5 (Simmons) use valid_from='2026-06-01', valid_to='2029-06-01'; Place 1 (Nail) + Place 2 (Dryden) use valid_from='2024-05-01', valid_to='2027-05-01'
- J.T. Trevino: first_name='J.T.', last_name='Trevino', preferred_name='J.T.', full_name='J.T. Trevino' (periods preserved exactly)
- Eusebio "Joe" Trujillo III: first_name='Eusebio', last_name='Trujillo', preferred_name='Joe', full_name='Eusebio "Joe" Trujillo III'
- Brian M. Roach: first_name='Brian', last_name='Roach', full_name='Brian M. Roach' (middle initial in full_name only)
- Weston emails: confirmed from spot-check — mmarchiori@, pharrington@, broach@, jmetzger@, mhill@ all @westontexas.com
- Copeville: NO entries at all in migration (header comment only)
