# Location Onboarding Playbook

A cold-start checklist for onboarding any US city to empowered.vote. Follows the Cambridge, MA proof-of-concept from v5.0.

**How to use:** Work through Steps 1–8 in order before writing any code or migrations. Each step has a decision log section — record your answers as you go. When a step is complete, check it off and move to the phase template linked at the end of the step.

> **Cambridge example annotations** appear throughout as blockquotes. They are examples, not defaults.

---

## Core Principle: Citizen Experience First

Honor how a city presents itself to residents, even when it creates backend complexity. Model the government as residents know it — not as it is most convenient to store.

This principle drives decisions like:
- Using "Councillor" (double-L) not "Councilor" when that is the city's official spelling
- Using "City of Cambridge" not "Cambridge MA" as the government name
- Keeping the Mayor as `district_type=LOCAL` (not `LOCAL_EXEC`) when the city runs Council-Manager government — because residents do not elect the Mayor as a separate executive; they elect councillors, and the council selects the Mayor from within its own body
- Dropping the unique index on `offices.politician_id` to support a Council-Manager Mayor who simultaneously holds a council seat — schema convenience yields to accurate representation

When this principle conflicts with implementation convenience, citizen experience wins.

---

## Cities Onboarded

Check this table before starting a new city — proven patterns from prior onboardings are available to borrow.

| City | State | Onboarded | Election method | Notable patterns |
|------|-------|-----------|-----------------|-----------------|
| Cambridge | MA | 2026-05-17 | stv_proportional | Council-Manager; odd-year (next: 2027-11-02); 17 offices (9 councillors + 1 Mayor + 1 City Manager + 6 School Committee); STV since 1941 |
| Portland | ME | 2026-05-19 | rcv | RCV for Mayor, Auditor, and at-large Council; 18 officials seeded (Phase 53); CivicPlus API + portlandmaine.gov headshot source; Finalsite CDN for school board |
| Lewiston | ME | 2026-05-19 | plurality | Tier 2 incumbents-only seed (migration 180); 8 officials; external_id prefix -23387xxxx |
| Bangor | ME | 2026-05-19 | plurality | Tier 2 incumbents-only seed (migration 180); 9 officials; 9 emails @bangormaine.gov; external_id prefix -23027xxxx |
| South Portland | ME | 2026-05-19 | plurality | Tier 2 incumbents-only (migration 180); Tipton dual-office (Mayor + District 5); external_id prefix -23719xxxx |
| Auburn | ME | 2026-05-19 | plurality | Tier 2 incumbents-only (migration 181); 8 officials; 8 emails @auburnmaine.gov; external_id prefix -23020xxxx |
| Biddeford | ME | 2026-05-19 | plurality | Tier 2 incumbents-only (migration 181); 10 council seats (Mayor + 7 wards + 2 at-large); external_id prefix -23048xxxx |
| Maine (state) | ME | 2026-05-20 | plurality | State legislature: 35 Senate + 151 House; legislature-elected AG/SoS/Treasurer (is_appointed=true, no race rows); 380 race rows for 2026 cycle (Phase 55); PowerShell generator for 372-row migration 184 |
| California (state) | CA | 2026-05-21 | plurality (state primary: jungle/top-two) | Pre-existing seed: govt row + 8 exec chambers + 8 politicians existed before v7.0; geo_id was NULL (fixed to '06' in migration 189); chamber names use short form ('Governor', not 'California Governor'); mtfcc swap (STATE_UPPER=G5220, STATE_LOWER=G5210); districts.state='CA' uppercase |
| San Francisco | CA | 2026-05-22 | rcv (all chambers) | Consolidated city-county: both G4110 (0667000) + G4020 (06075) returned for any SF address; DataSF Socrata loader (no outSR, field=sup_dist_num float); sf.gov circular PNG headshots (alpha corners safe in 4:5 crop); 20 officials across 10 chambers; ext_ids -630001..-630028 |
| San Jose | CA | 2026-05-23 | rcv (Mayor + City Council) | ArcGIS DISTRICTINT field (not DISTRICT); outSR=4326 required; City Attorney + Auditor are APPOINTED per SJ Charter — no chambers created; geo_id=0668000; ext_ids -640001, -640010..-640019 |
| San Diego | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 2230 native); NAME field holds council member name (changes with elections) — use integer DISTRICT field for district number; sandiego.gov headshots (public_domain); D4 Foster headshot has anomalous CMS filename; ext_ids -650001..-650018 |
| Sacramento | CA | 2026-05-28 | plurality (no RCV yet) | AEM/CQ5 CMS headshots: CSS background-image, curl+grep required (WebFetch cannot extract); ArcGIS DISTNUM field; outSR=4326 required; City Attorney/Auditor/Treasurer/Clerk all APPOINTED; geo_id=0664000; ext_ids -660001, -660010..-660017 |
| Fremont | CA | 2026-05-22 | plurality | ArcGIS outSR=4326 required (WKID 102643 native); fremont.gov 403 workaround (Node.js browser UA + Referer header); City Attorney APPOINTED per charter; geo_id=0626000; ext_ids -670001, -670010..-670015 |
| Berkeley | CA | 2026-05-22 | rcv (Mayor, City Council, City Auditor) | Socrata loader (NO outSR, field='district' lowercase string); City Attorney APPOINTED; both Mayor and Auditor share single LOCAL_EXEC district; geo_id=0606000; ext_ids -680001..-680017 |

---

## California Quick Reference

**Read this before starting any CA city.** These traps are CA-specific — general playbook guidance above does not warn for them.

| Trap | See Step | One-Line Summary |
|------|----------|-----------------|
| Pre-existing CA seed | Step 1, Step 5 | CA govt row + 8 chambers + 8 politicians pre-existed; always pre-check before writing any CA state-level INSERT |
| districts.state casing | Step 3 | Pre-existing CA districts use state='CA' (uppercase); lowercase 'ca' returns 0 rows |
| mtfcc swap | Step 3 | CA STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse); do NOT join on d.mtfcc — routing uses gb.mtfcc |
| External ID range collision | Step 5 | Multiple CA ranges occupied; always run pre-flight query before assigning any CA external_id |
| DataSF vs ArcGIS (outSR) | Step 3 | SF/Berkeley use Socrata (native WGS84, no outSR); LA/Sacramento/SD/Fremont/SJ use ArcGIS (must add outSR=4326) |
| SF consolidated city-county | Step 3 | SF returns G4110 + G4020 for any address — assert BOTH in smoke tests |
| CA COUSUB = CCDs | Step 3 | CA G4040 are all FUNCSTAT='S'; do NOT add CA to COUSUB_FUNCSTAT_STATES |
| CA jungle primary | Step 2 | ONE unified primary race row for ALL candidates; sos.ca.gov is authoritative (not Ballotpedia) |
| RCV at seed time | Step 2, Step 6 | Set election_method='rcv' on chamber row during structure migration — not as a follow-up TODO |
| AEM/CQ5 headshots (Sacramento) | Step 4 | cityofsacramento.gov embeds headshots in CSS background-image — use curl+grep, not WebFetch |
| lavote.gov election ID | Step 2 | ID changes per cycle (June + November); update discovery_jurisdictions row manually after each election |

---

## Step 1: Government Structure Research

Before touching the database, confirm how the city government is structured.

### Required questions

- [ ] What is the form of government? (Strong Mayor-Council, Council-Manager, Commission, Town Meeting, other)
- [ ] List all elected offices: city council (ward-based, at-large, or mixed), school committee, mayor, other
- [ ] Is the Mayor directly elected by voters, or selected from within the council after the council election?
- [ ] If Mayor is council-selected: does the Mayor also hold a council seat, or is Mayor a separate role that replaces their council seat?
- [ ] Is there an appointed City Manager or Administrator? Who holds the position currently?
- [ ] Are there appointed positions that should appear in lookup results (City Attorney, City Clerk, etc.)?
- [ ] What are the current incumbents for each elected office (full legal names, term start dates)?
- [ ] Has the city's charter changed in the last 5 years? If yes, confirm the current structure from the official charter document — not Wikipedia.

> [GOTCHA] **[STATE-SPECIFIC: CA] CA government row + 8 chambers + 8 politicians may already exist in production:** The State of California government row, all 8 executive chambers, and all 8 executive politicians were seeded before v7.0. Before writing any CA state-level government migration, run: `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`. If it returns a row with `geo_id=NULL`, apply an UPDATE — do not INSERT. CA chamber names use short form ('Governor', not 'California Governor'). CA constitutional officer politician rows also pre-existed under positive external_ids; do not assume the -06000xxx range is empty. Phase 59 migration 189 was written entirely as WHERE NOT EXISTS + UPDATE guards — use this as the CA state-level migration template.

### Schema decisions to record before migrating

| Decision | Your Answer |
|----------|-------------|
| Form of government | |
| Mayor district_type | LOCAL or LOCAL_EXEC (use LOCAL if Mayor is not a separately-elected executive; use LOCAL_EXEC only if Mayor is the primary executive AND directly elected) |
| Mayor is_appointed_position | true or false |
| City Manager exists? | yes / no — if yes, is_appointed = true on politician row |
| School Committee elected seats | count |
| Council seats total | count |
| Ward-based, at-large, or mixed? | |

> **Cambridge example:**
> - Form of government: Council-Manager (Plan E)
> - Mayor district_type: LOCAL (NOT LOCAL_EXEC — Cambridge Mayor is NOT a separately elected executive; they are selected from within the 9-councillor body by the councillor who received the most first-choice votes)
> - Mayor is_appointed_position: true on the Mayor office row
> - City Manager: Yi-An Huang, is_appointed = true
> - School Committee: 6 elected seats (Mayor is NOT an automatic member under the 2025 charter — confirm the specific charter version before seeding)
> - Council seats: 9 at-large (no ward-based districts)

### Sources for government structure

1. Official city website — mayor's office, city council, city manager pages
2. City charter document (PDF from official city website)
3. MMA Data Hub (mma.org) — fastest cold-start for MA cities; check for your state's equivalent municipal association
4. Ballotpedia city page (check: many smaller cities are not covered)
5. DO NOT use Wikipedia as primary — it lags charter changes by months

---

## Step 2: Election System Confirmation

Confirm the election mechanics before seeding any election or race rows.

### Required questions

- [ ] What is the election method? (Plurality, Ranked-Choice/IRV, STV/Proportional Ranked-Choice, Runoff, other)
- [ ] [GOTCHA] `election_method` is a TEXT column on `essentials.chambers` — it is **NOT** enforced by a pg_constraint CHECK constraint. The `SELECT constrname, consrc FROM pg_constraint...` query returns nothing useful for this column. To verify valid values, check the [elections-seed template reference block](.planning/templates/elections-seed.md). Do not run the pg_constraint query for election_method verification.
- [ ] [GOTCHA] **RCV jurisdictions: `election_method='rcv'` belongs on the CHAMBER row, not just the race.** Election method is a property of the body (how the seat is filled), not the contest. If you only set it on the race and leave the chamber default as `'plurality'`, the display logic will show the wrong voting method for the city. In Maine, Portland's Mayor, Auditor, and at-large Council chamber rows all require `election_method='rcv'` (Phase 53). For your state: confirm election method per chamber before writing any SQL — an RCV city that has even one plurality chamber (e.g., school board) requires per-chamber verification. **[STATE-SPECIFIC: CA]** Set `election_method='rcv'` at structure-seed time — do not defer to a follow-up migration. Berkeley (Phase 68) deferred this and required a second migration pass to correct. CA RCV cities: SF (Mayor + all 11 BoS districts + City Attorney + DA + others), Berkeley (Mayor, City Council, City Auditor), San Jose (Mayor + City Council).

> [GOTCHA] **[STATE-SPECIFIC: CA] CA jungle primary — ONE unified race row for ALL candidates:** California's top-two primary puts all candidates from all parties into a single unified primary race. Do NOT create separate "CA Governor Democratic Primary" or "CA Governor Republican Primary" rows — there is no party-specific primary ballot in CA. Use ONE `races` row per office (e.g., "CA Governor Primary 2026") and link ALL candidates as `race_candidates` to that single row. `sos.ca.gov` is the authoritative source — not Ballotpedia, which uses confusing top-two terminology. Post-primary: update the general election race to show only the top 2 finishers. Phase 62 confirmed this pattern for the CA Governor 2026 race.

> [GOTCHA] **[STATE-SPECIFIC: CA] lavote.gov election ID changes every cycle — two updates per year required:** The LA County discovery pipeline depends on `discovery_jurisdictions.source_url` containing a lavote.gov election ID (e.g., `?id=4338`). The June primary and November general each get a DISTINCT ID. After each LA election, browse lavote.gov, extract the current URL parameter, and run: `UPDATE essentials.discovery_jurisdictions SET source_url = '...?id=<NEW_ID>' WHERE id = '9fd492a8-895e-4bd7-91e7-81f9bfa2b3e2';`. Two updates per year — June AND November. Phase 62 confirmed June 2026 ID = 4338; the November 2026 general ID is pending post-June update.

- [ ] Are elections held in odd-numbered years, even-numbered years, or off-cycle? (Do not assume even-year alignment with state/federal elections)
- [ ] When was the last municipal election? When is the next?
- [ ] Are municipal races partisan (party labels on ballot) or nonpartisan?
- [ ] Approximately how many candidates typically file per race? (Affects UI load testing requirements)
- [ ] For multi-seat races (council, school committee): how many seats per race?

### Schema decisions to record before migrating

| Decision | Your Answer |
|----------|-------------|
| election_method TEXT value | |
| Is election_method value a known valid TEXT value? | yes / no — check the [elections-seed template](.planning/templates/elections-seed.md) reference block |
| Last election date | YYYY-MM-DD |
| Next election date | YYYY-MM-DD |
| Partisan or nonpartisan? | |
| Candidate count per major race | ~N candidates |

> **Cambridge example:**
> - Election method: stv_proportional (Single Transferable Vote — Cambridge has used STV since 1941, the longest-running STV jurisdiction in the US)
> - Verify enum exists in DB before migrating — stv_proportional may not be in the constraint yet
> - Last election: November 4, 2025
> - Next election: November 2027 (Massachusetts law requires municipal elections in odd-numbered years — there is NO Cambridge city election in 2026; do not seed a 2026 date)
> - Nonpartisan (candidates have no party label on the ballot, though affiliations are widely known via endorsements)
> - Cambridge City Council 2025: 19 candidates for 9 seats
> - Cambridge School Committee 2025: 18 candidates for 6 seats
> - Warning: 37 total candidate cards on the elections page — pre-validate UI at this scale before seeding election data

**Critical:** Confirm the next election date from the city's election commission website, not from state-level sources. Many cities have off-cycle dates within their state's municipal calendar.

---

## Step 3: Geofence Sources

Identify what boundary data you need and where to get it.

### Required questions

- [ ] What is the city's GEOID? (7-digit Census place code — look up at census.gov or data.census.gov; do NOT use the county FIPS code)
- [ ] How many state senate districts split the city? (Test 3+ addresses spread across the city at malegislature.gov/Search/FindMyLegislator or your state's equivalent)
- [ ] How many state house districts split the city? (Same method — cities can be split by more districts than expected)
- [ ] How many congressional districts split the city?
- [ ] For TIGER boundaries: does `load-state-tiger-boundaries.ts` already allowlist this state? (Check `STATE_LAYER_ALLOWLIST` in `C:\EV-Accounts\backend\scripts\load-state-tiger-boundaries.ts`)
- [ ] Is a verification source available for state legislative boundaries? (e.g., MassGIS for MA, CalGIS for CA, Texas Legislative Council for TX)

### Schema decisions to record before migrating

| Decision | Your Answer |
|----------|-------------|
| City geo_id (7-digit place code) | |
| County FIPS (5-digit, for G4020 congressional intersection) | |
| State senate district count covering city | |
| State house district count covering city | |
| Congressional district count covering city | |
| TIGER allowlist addition needed? | yes / no |
| Verification source URL for state districts | |

> **Cambridge example:**
> - City geo_id: 2511000 (NOT 25017 — that is Middlesex County; the county FIPS is a 5-digit code, the city place code is 7 digits)
> - Middlesex County FIPS: 25017 (needed for congressional G4020 intersection support)
> - State senate: 2 confirmed + 1 probable (Cambridge spans Second Middlesex + at least one additional — verify third by testing Cambridge Ward 1-7 addresses at malegislature.gov/Search/FindMyLegislator)
> - State house: 3 confirmed (24th Middlesex/Rogers, 25th Middlesex/Decker, 26th Middlesex/Connolly) + up to 3 partial edge districts
> - Congressional: 2 districts (MA-05 Clark + MA-07 Pressley — verify the split before seeding)
> - TIGER allowlist addition needed: yes — add `MA: new Set(['cd', 'sldu', 'sldl', 'place'])` to STATE_LAYER_ALLOWLIST in load-state-tiger-boundaries.ts
> - Verification source: MassGIS 2021 shapefiles (these ARE the current effective post-2020-redistricting boundaries despite the 2021 label); use malegislature.gov/Search/FindMyLegislator to spot-check at least 4 Cambridge addresses in different wards

**State-level onboarding (legislatures, executive chambers):** Before onboarding individual cities in a new state, run the TIGER loader for the whole state first — CD + SLDU + SLDL + PLACE + COUNTY layers in one loader run. City-level work depends on state district rows existing first. Maine onboarding example: Phase 49-01 loaded 23 cities (G4110) + 2 CD + 35 SLDU + 151 SLDL + 16 counties in a single run before any city migration began.

> [GOTCHA] **[STATE-SPECIFIC] TIGER congressional file naming varies by state:** The loader key may not be `cd` — always browse `https://www2.census.gov/geo/tiger/TIGER2024/CD/` and check the actual filename for your state FIPS before configuring `STATE_LAYER_ALLOWLIST`. In Maine, the congressional file is `tl_2024_23_cd119.zip` — the correct loader key is `cd119`, not `cd`. Using the wrong key causes a silent no-op: the loader runs without error but loads zero boundaries.

> [GOTCHA] **`districts.state` casing is set by the loader's `abbrev`/`abbrevUpper` variables — verify before running:** The loader writes lowercase state abbreviation (e.g., `'me'`) for STATE_UPPER, STATE_LOWER, COUNTY, and LOCAL tiers, but uppercase (e.g., `'ME'`) for NATIONAL_LOWER (congressional). This is controlled by the `abbrev` (lowercase) and `abbrevUpper` (uppercase) variables in the loader config. If you misconfigure these — or copy from a prior state without checking — district rows will have the wrong casing, which breaks routing queries that filter on `districts.state`. In Maine, STATE_UPPER/STATE_LOWER rows use `'me'` (lowercase) and NATIONAL_LOWER rows use `'ME'` (uppercase). Always verify loader config before running and spot-check `SELECT DISTINCT state FROM essentials.districts WHERE ...` after. **[STATE-SPECIFIC: CA]** Pre-existing CA state legislature district rows use `state='CA'` (uppercase) — CA was seeded before the TIGER loader lowercase-abbrev pattern was established. Migration JOINs filtering on `d.state` must match: use `'CA'` for CA STATE_UPPER and STATE_LOWER rows. Phase 61 confirmed that `WHERE state='ca'` returned 0 rows — the actual data has `state='CA'`.

> [GOTCHA] **[STATE-SPECIFIC: CA] CA mtfcc swap — STATE_UPPER=G5220, STATE_LOWER=G5210 (inverse of standard TIGER codes):** Pre-existing CA district rows have `mtfcc='G5220'` for STATE_UPPER (senate) and `mtfcc='G5210'` for STATE_LOWER (assembly) — the inverse of standard TIGER codes. Do NOT attempt to correct this — it would require re-seeding 120 CA district rows and re-linking all offices. Do NOT join on `d.mtfcc` for CA routing queries — routing uses `gb.mtfcc` (from `geofence_boundaries`), making the `d.mtfcc` column irrelevant. Smoke tests for CA routing must use the essentialsService join pattern. Phase 61 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: Maine] Cities (G4110 PLACE) vs. towns (G4040 COUSUB) in TIGER:** In Maine, only 23 cities are incorporated places (G4110). The majority of Maine residents live in G4040 COUSUB towns — which are NOT loaded in a G4110-only TIGER run. Loading only the G4110 layer means most rural and suburban residents get no LOCAL district routing. This is a Maine outlier: in states like Texas or California, almost all residents live in incorporated G4110 places. For your state: check the Census TIGER documentation for how your state's municipalities are classified before deciding which TIGER layers to load. In Maine, Phase 49 loaded G4110 only — Phases 48 (MA) and 49 (ME) document the G4110 vs. G4040 distinction. If your state has significant COUSUB population, add the G4040 COUSUB layer to the loader run. **[STATE-SPECIFIC: CA]** CA G4040 records are all FUNCSTAT='S' (Census County Divisions — statistical areas, not active governments). Do NOT add 'CA' to `COUSUB_FUNCSTAT_STATES` — that filter would skip ALL 404 CA G4040 records, loading zero cousub boundaries for CA. CA G4040s load without FUNCSTAT filtering; the loader correctly handles this via the state-conditional check. Phase 57 confirmed.

> [GOTCHA] **[STATE-SPECIFIC: CA] DataSF Socrata vs ArcGIS MapServer — outSR=4326 required for ArcGIS endpoints:** CA city open data APIs use two different GIS backends. DataSF Socrata (SF, Berkeley): returns native WGS84 — do NOT add `outSR=4326`; district field is `sup_dist_num` (float, e.g. `11.0` — use `parseInt(String(...))`) for SF, or `district` (lowercase string) for Berkeley. ArcGIS MapServer (LA, Sacramento, San Diego, Fremont, San Jose): returns CA State Plane feet by default (SRID 2229) — MUST add `outSR=4326`. Silent failure mode: omitting `outSR=4326` returns coordinates in feet (X≈6,900,000, Y≈2,100,000); PostGIS accepts the insert but ST_Covers returns zero rows for every address lookup — smoke test is the only catch. WGS84 confirmation: lon≈-122.xx, lat≈37.xx for Bay Area; lon≈-118.xx, lat≈34.xx for LA. Phases 63/64/65/66/67/68 confirmed per city.

> [GOTCHA] **[STATE-SPECIFIC: CA] SF consolidated city-county returns BOTH G4110 and G4020 for any SF address:** San Francisco is a consolidated city-county. Any SF address lookup returns BOTH a G4110 row (geo_id=0667000, "San Francisco city") AND a G4020 row (geo_id=06075, "San Francisco County"). This is correct TIGER behavior — not a duplicate or routing error. A smoke test asserting "exactly one G4110 row" or "no G4020 row" for an SF address will fail incorrectly. Correct assertion: assert BOTH G4110 (geo_id=0667000) AND G4020 (geo_id=06075) are present for any SF address. No other CA city behaves this way. Phase 57 confirmed.

**Warning:** Do not assume the city falls in a single house district. Dense urban cities are frequently carved across 4–6 districts.

---

## Step 4: Data Sources

Map out where you will get each type of data before starting any migration.

### Required questions

- [ ] City website: where are officials listed with names, titles, contact info? (Usually /departments/citycouncil or /government/elected-officials)
- [ ] Does the city use Cloudflare or other bot protection on contact pages? (If yes, email_address = NULL is acceptable; bio URL satisfies coverage target)
- [ ] State election authority: where are candidate filings and official results? (e.g., MA: sec.state.ma.us; TX: sos.state.tx.us; CA: sos.ca.gov)
- [ ] Is Ballotpedia coverage available for this city? (Check: many cities under ~150K population are not covered)
- [ ] Does an open data portal exist for this city? (Note: open data portals almost never contain officials or contact data — they contain service/operational data)
- [ ] For compass stances: what are the dominant policy issues? Where do candidates/officials go on record? (City council meeting minutes, local newspaper Q&As, LWV voter guides, candidate websites)
- [ ] For headshots: where are official photos? (Check official website members page, city council meeting recordings, local news archives)

> **Cambridge example:**
> - Officials: https://www.cambridgema.gov/Departments/citycouncil/members (primary); https://www.cpsd.us/school-committee (for school committee)
> - Cloudflare protection: NOT present for Cambridge city website; verify email format per member before seeding
> - State election authority: https://www.sec.state.ma.us/divisions/elections/
> - Cambridge election results: https://www.cambridgema.gov/Departments/electioncommission
> - Ballotpedia: limited coverage for Cambridge (population ~118K; Ballotpedia threshold is roughly 200K for reliable coverage)
> - Open data portal: data.cambridgema.gov exists BUT contains permits, police logs, and service data only — does NOT have officials or contact information; do not waste time searching it for personnel data
> - Compass stances: public statements, city council meeting voting records (cambridgema.gov meeting minutes), local press (Cambridge Chronicle, Harvard Crimson for charter-related coverage)
> - Headshots: https://www.cambridgema.gov/Departments/citycouncil/members (official council photos); http://vote.cambridgecivic.com (volunteer civic site, useful as backup)
> - Campaign finance: MA OCPF (ocpf.us) — different format from LA Ethics Commission; do not assume FPPC/LA equivalents exist in other states

> [GOTCHA] **[STATE-SPECIFIC: CA] AEM/CQ5 CMS embeds headshots in CSS `background-image`, not `<img>` tags (Sacramento):** Sacramento's cityofsacramento.gov uses Adobe Experience Manager (AEM / CQ5). Official headshots appear in `style="background-image:url(...)"` attributes — WebFetch and standard HTML parsers cannot extract them. Use raw curl + grep: `curl -s <url> | grep -o 'background-image:url([^)]+)'`. This returns paths like `/content/dam/portal/mayor-council/...` which must be prepended with `https://www.cityofsacramento.gov` to form the full download URL. Square CMS renditions (514×514 or 500×500): center-crop to 4:5 ratio, then resize 600×750 Lanczos q90. Other CA cities NOT affected: SF (media.api.sf.gov direct JPEG), San Diego (sandiego.gov direct JPEG), San Jose (sanjoseca.gov + Wikimedia), Fremont (fremont.gov CDN), Berkeley (berkeleyca.gov direct JPEG). Phase 66 confirmed all 9 Sacramento officials were sourced via curl+grep.

**Reminder:** LA data richness (LACBA attorney ratings, CJP judicial database, Ethics Commission campaign finance API) is an outlier, not a baseline. Do not plan phases around finding LA-equivalent sources for other cities.

---

## Step 5: Schema Decisions Before Migration

Make these decisions before writing any SQL. Wrong answers here corrupt the schema.

### Required questions

- [ ] geo_id confirmed? (7-digit Census place code — verified against TIGER or Census Bureau, not inferred from county FIPS)
- [ ] [VERIFY] Check the valid election_method TEXT values list in the [elections-seed template](.planning/templates/elections-seed.md) before writing any chambers INSERT — `election_method` is a plain TEXT column, not a pg_constraint CHECK constraint; the pg_constraint query returns nothing useful
- [ ] Mayor office modeling decided: LOCAL vs LOCAL_EXEC, is_appointed_position true/false
- [ ] Are there any offices where the same politician holds two roles simultaneously? (e.g., Cambridge Mayor is simultaneously a City Councillor — one politician row, two office linkages)
- [ ] What name does the city officially use for the council chamber? ("City Council" vs "Town Council" vs "Board of Aldermen" etc.)
- [ ] What name does the city officially use for council members? ("Councillor" vs "Councilor" vs "Council Member" vs "Alderman")
- [ ] What is the government name? ("City of Cambridge" vs "Town of Cambridge" vs "Cambridge" — match exactly what the city uses on official documents)
- [ ] What is the next migration number? (Run `SELECT MAX(version) FROM supabase_migrations.schema_migrations;` via psql before writing any migration file)
- [ ] [GOTCHA] **Legislature-elected offices (AG, SoS, Treasurer in some states) are NOT on any ballot:** In states where the Attorney General, Secretary of State, or Treasurer is elected by the legislature rather than by voters, these offices need `is_appointed_position=true` on the office row AND zero rows in `essentials.elections` or `essentials.races` for those chambers. If you assume popular election and create race rows for these offices, you will display a fake election that does not exist. Research the state constitution before assuming: Wikipedia's state government page is sufficient. In Maine, Frey (AG), Bellows (SoS), and Perry (Treasurer) are all legislature-elected — they have politician rows and headshots but zero race rows (Phase 51-01). States where this applies: Maine, Tennessee, Virginia, and others.
- [ ] [GOTCHA] **For bicameral legislatures: senator office uniqueness key is `(district_id, politician_id)`, NOT `(district_id, chamber_id)`:** In a US state senate, two senators share the same NATIONAL_UPPER district (e.g., Collins + King both represent Maine's single NATIONAL_UPPER district). If you model the uniqueness key as `(district_id, chamber_id)`, the second senator INSERT violates the constraint because chamber_id is identical for both. The correct key is `(district_id, politician_id)`. In Maine, Collins (external_id=-230101) and King (external_id=-230102) both link to the same NATIONAL_UPPER district_id — verified in Phase 51-02 migration 170. This affects any state with two US senators (i.e., all 50 states).

> [GOTCHA] **[STATE-SPECIFIC: CA] CA pre-existing seed reminder for schema phase — verify all ranges before writing any CA INSERT:** By the time you reach schema decisions, the CA government row + 8 executive chambers + 8 politician rows may already exist. Run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'` before any CA state-level INSERT. If it returns a row with `geo_id=NULL`, UPDATE — do not INSERT. Phase 59 confirmed: ALL 8 chamber INSERTs were no-ops; migration 189 used WHERE NOT EXISTS + UPDATE pattern exclusively.

> [GOTCHA] **[STATE-SPECIFIC: CA] CA external_id range -1000xx is occupied by CA Assembly — use -60003xx for CA House reps:** The planned external_id range for CA US House representatives (-100049..-100119) was already occupied by pre-existing CA State Assembly members seeded before v7.0. This caused a duplicate key constraint error on the first migration attempt (Phase 60). Established CA external_id scheme: executive constitutional officers (-6000101 through -6000108); US Senators (-6000201, -6000202); CA House reps (-6000301 through -6000352); CA State Senators (-6001001 through -6001040); CA Assembly members (-6002001 through -6002080); LAUSD board members (-6004001 through -6004007). Pre-flight rule: before assigning any CA external_id range, run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -N AND -M` to confirm the range is clear.

> **Cambridge example:**
> - geo_id: 2511000 (confirmed against US Census official GEOID documentation)
> - election_method: stv_proportional — verify this value is a known valid TEXT value before migrating (see elections-seed template reference block); do NOT use the pg_constraint query
> - Mayor modeling: is_appointed_position = true; district_type = LOCAL; politician_id on Mayor office row points to Sumbul Siddiqui (who also holds a Councillor office row); no election race row for Mayor
> - Dual-office: Sumbul Siddiqui holds both a Councillor seat AND the Mayor title — seed ONE politician row for Siddiqui, then link that politician_id to BOTH office rows (the Councillor office and the Mayor office); requires the unique index on offices.politician_id to be dropped first (see Step 6 item 4)
> - Council chamber name: "City Council"
> - Member title: "Councillor" (double-l — Cambridge official spelling; do not auto-normalize to "Councilor")
> - Government name: "City of Cambridge" (NOT "Cambridge, MA" or "Cambridge City")
> - Migration number: always run `SELECT MAX(version) FROM supabase_migrations.schema_migrations;` before writing — never assume from prior session notes

---

## Step 6: Migration Order

Always migrate in this sequence. Skipping steps or migrating out of order creates broken foreign key references.

```
1. Geofences — state legislative + congressional + city place boundaries
   → TIGER loader run (load-state-tiger-boundaries.ts) OR manual shapefile import
   → Verify with FindMyLegislator or state equivalent before proceeding

2. Government row — one row in essentials.governments for this city
   → Confirm geo_id, state, name_formal before inserting
   → [GOTCHA] `essentials.governments` has NO unique constraint on `geo_id` — use `WHERE NOT EXISTS` guard, not `ON CONFLICT (geo_id)`. `ON CONFLICT (geo_id)` will fail at runtime with "no unique constraint" error. In Maine, the State of Maine government row (UUID da88de8b-9afa-4d87-86d5-7eb83c3e9792) was seeded via `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '23')` in migration 169.

3. Chambers — one row per legislative/school/governing body
   → [VERIFY] Confirm election_method TEXT value is valid before inserting — see [elections-seed template](.planning/templates/elections-seed.md) reference block. Do not use the pg_constraint query (election_method is TEXT, not a CHECK constraint).
   → [GOTCHA] **`slug` is a GENERATED column on `essentials.chambers` — never include it in INSERT statements.** PostgreSQL will throw an error if you include `slug` in the column list. The value is auto-computed from the chamber name. In Maine, we confirmed this when building the maine-senate, maine-house-of-representatives, maine-governor, maine-attorney-general, maine-secretary-of-state, and maine-treasurer chamber rows (Phase 50). For your state: omit `slug` from every chamber INSERT.
   → [REMINDER] If any chamber uses RCV/IRV: set `election_method='rcv'` on this chamber row (not just on the race rows). See Step 2 GOTCHA above.
   → Confirm seat counts match official charter

4. Offices — one row per seat
   → At-large councils: N individual office rows, same title, no Place numbers (unless city uses Place numbers)
   → Ward-based councils: one office per ward/district
   → Mayor (if appointed): is_appointed_position = true
   → City Manager: is_appointed_position = true
   → [REMINDER] Legislature-elected executive offices (AG, SoS, Treasurer): set `is_appointed_position=true` and create NO race rows for these chambers. See Step 5 GOTCHA above.
   → [GOTCHA] For Council-Manager cities where the Mayor is a sitting council member: the unique index on `essentials.offices.politician_id` must be dropped in this migration before seeding incumbents. This index blocks the dual-office pattern (same politician_id on both the Councillor office and the Mayor office). Add DROP INDEX + CREATE INDEX (non-unique) steps to the migration.

5. Incumbents (politicians) — one row per person
   → Dual-role incumbents (e.g., Mayor who is also a Councillor): ONE politician row, linked to BOTH office rows
   → is_appointed = true for appointed positions
   → email_address only if verified from official source; NULL is acceptable
   → [PATTERN] `generate_series(1, N)` is the cleanest pattern for N identical at-large office rows — avoids copy-paste arithmetic errors (e.g., 9 councillors + 1 Mayor + 1 City Manager + 6 school committee = 17, not 16)
   → [PATTERN] **Multi-tier seeding for states with many cities:** Use a tiered approach to manage coverage depth across many cities. Tier 1 = deep seed (incumbents + headshots + emails + addresses); Tier 2 = incumbents only (names + emails where easy, no headshots); Tier 3-4 = skeletal offices with `politician_id=NULL` plus a documented gap entry in `[STATE]-GAPS.md`. The GAPS.md file makes coverage visible — silent omissions create permanent confusion about what the platform actually covers. In Maine, Phase 53 = Tier 1 (Portland, 18 officials fully seeded); Phase 54 = Tiers 2-4 (Lewiston/Bangor/SouthPortland/Auburn/Biddeford incumbents + 18 skeletal cities).
   → [PATTERN] **PowerShell bulk-seed generator for 100+ row migrations:** When seeding state legislatures or any migration with 100+ repetitive INSERT blocks, use a PowerShell script that generates the SQL file rather than hand-writing. CRITICAL encoding rule: use `[System.IO.File]::WriteAllLines($path, $lines, [System.Text.UTF8Encoding]::new($false))` — the `$false` disables BOM. `Out-File` and `Set-Content` produce BOM/UTF-16 that PostgreSQL rejects with a parse error. In Maine, Phase 55-02 used a PowerShell generator to produce migration 184 (372 legislative race rows). See `.planning/templates/officials-seed.md` for the full pattern.

6. Elections + race_candidates
   → Confirm election date from election commission (not assumed from state cycle)
   → For historical/completed elections: seed as completed with all race_candidates
   → For future elections: seed as upcoming placeholder; do not activate discovery until filing opens
   → [GOTCHA] `race_candidates` has NO unique constraint on `(race_id, full_name)` — use `WHERE NOT EXISTS` guards, not `ON CONFLICT DO NOTHING`. `ON CONFLICT DO NOTHING` is a no-op without a unique constraint and does not prevent duplicate rows.

7. Headshots
   → 600×750 JPEG, Lanczos resize, 4:5 ratio (crop first, then resize — never distort)
   → Upload to Supabase Storage via existing headshot upload pattern
   → No banners, text, or graphics over face

8. Compass stances (optional, do after officials are stable)
   → Research one politician at a time (rate limit rule)
   → Citation required for every stance
   → Apply via existing apply-*.ts ingest pattern
```

> **Cambridge migration order:**
> - Phase 38 (MA Geofences) runs first — no DB dependencies
> - Phase 39 (MA Government DB) starts after Phase 38 completes (district rows must exist before politicians link to them)
> - Phase 41 (Cambridge City Structure) depends on Phase 39
> - Phase 42 (Cambridge Headshots) depends on Phase 41
> - Phase 43 (Cambridge Elections) depends on Phase 41 + Phase 38
> - Discovery pipeline configured in Phase 43 but left INACTIVE until 2027 filing opens

---

## Step 7: Common Pitfalls (Check Before Every Migration)

These mistakes have been made on prior cities. Check this list before writing each migration.

| Pitfall | How to Catch It |
|---------|----------------|
| Mayor modeled as LOCAL_EXEC when actually council-selected | Verify: does the Mayor appear on the ballot as a standalone race? If no — use LOCAL + is_appointed_position = true |
| Wrong geo_id (county FIPS instead of city place code) | City geo_id = 7 digits (SSCCCCC format); county = 5 digits (SSCCC) |
| Wrong election year (even vs. odd) | Check election commission — do not assume even-year alignment with state elections |
| Assuming single house/senate district when city spans multiple | Test 3+ addresses spread across city with FindMyLegislator before seeding geofences |
| Missing charter amendments | Charter changes can remove or add offices (e.g., Cambridge 2025 removed Mayor as automatic School Committee member) |
| Open data portals mistaken for officials source | Open data portals contain operational data, not personnel data |
| LA-specific sources assumed available | Bar ratings, judicial databases, Ethics Commission APIs are California-specific — verify source availability per state |
| Councillor vs. Councilor spelling | Match the city's official spelling exactly; do not normalize |
| Email addresses guessed from patterns | Only seed emails verified from official city website at time of seeding; NULL is acceptable |
| Discovery cron firing on far-future election | Mark discovery_jurisdictions row inactive until filing period opens |
| slug in chamber INSERT | slug is a GENERATED column on essentials.chambers — never include in INSERT statements |
| Partisan/nonpartisan assumption | Confirm explicitly — some US cities run partisan local races |
| offices.politician_id unique index blocks Council-Manager dual-office | For Council-Manager cities: DROP the unique index on offices.politician_id in the migration before assigning politician_id to any office that shares a politician with the Mayor office |
| Wrong government idempotency guard | essentials.governments has no unique constraint on geo_id — use WHERE NOT EXISTS, never ON CONFLICT (geo_id) |
| election_method pg_constraint query returns nothing | election_method is a TEXT column, not a pg_constraint enum — use the elections-seed template reference block to verify valid values |
| race_candidates duplicate rows | race_candidates has no unique constraint on (race_id, full_name) — WHERE NOT EXISTS required; ON CONFLICT DO NOTHING is a no-op |
| Office count arithmetic errors | Explicitly verify: 9 councillors + 1 mayor + 1 city manager + 6 school committee = 17 (not 16); write the arithmetic as a comment in the migration |
| CA jungle primary modeled as separate D/R primaries | CA uses top-two jungle primary — ONE unified race row for ALL candidates regardless of party; sos.ca.gov is authoritative |
| CA pre-existing seed silently duplicated | Before any CA state-level INSERT, run `SELECT id, geo_id FROM essentials.governments WHERE name = 'State of California'`; if geo_id IS NULL, UPDATE — do not INSERT |
| ArcGIS outSR=4326 omitted for CA city boundaries | CA State Plane feet (SRID 2229) looks valid to PostGIS but ST_Covers returns 0 rows for all addresses — always add outSR=4326 to ArcGIS MapServer queries for CA cities |
| AEM/CQ5 CMS headshots not extractable by WebFetch | Sacramento cityofsacramento.gov uses CSS background-image — use curl+grep pattern |
| CA external_id range collision | Before assigning any CA external_id, run `SELECT external_id FROM essentials.politicians WHERE external_id BETWEEN -N AND -M`; known occupied ranges include -1000xx (Assembly), -60030xx (House reps), -60031xx (challengers); always query — do not rely on range list |

---

## Step 8: Phase Templates

Use these templates when writing GSD plan files for each phase type. Templates are in `.planning/templates/`:

- [`db-foundation.md`](.planning/templates/db-foundation.md) — New government row, chambers, offices setup
- [`officials-seed.md`](.planning/templates/officials-seed.md) — Seeding incumbents with contact data
- [`headshots.md`](.planning/templates/headshots.md) — Photo collection and upload
- [`discovery-setup.md`](.planning/templates/discovery-setup.md) — Discovery pipeline configuration
- [`compass-stances.md`](.planning/templates/compass-stances.md) — Stance research and ingestion
- [`elections-seed.md`](.planning/templates/elections-seed.md) — Election rows, race seeding (incumbents + challengers), discovery_jurisdictions rows, placeholder elections for future cycles

---

## Compass and Treasury Tracker (companion products)

These sections are stubs — Essentials provides the foundational government data (officials, offices, elections) that Compass and Treasury Tracker build on top of.

### Compass (political stance research)

`[TO BE COMPLETED BY COMPASS TEAM]`

The Compass team authors this section. This stub documents the minimum Essentials owner needs to know:

- Stance research runs **one politician at a time** — never in parallel (rate limit rule; parallel runs exhaust Claude API quota with no usable output)
- Every stance placement requires a **citation** — no citation = no staging entry (hallucination prevention)
- Citation requirement: link to a public source (news article, voting record, candidate statement, council minutes) for every value placed
- Rate limit memory note: $0.004/run estimate (Haiku-class); flag if actual costs balloon
- See: [`.planning/templates/compass-stances.md`](.planning/templates/compass-stances.md) for the full compass stance ingestion template
- See: [`.planning/phases/18-compass-stances/`](.planning/phases/18-compass-stances/) for prior compass work patterns

### Treasury Tracker (campaign finance)

`[TO BE COMPLETED BY TREASURY TEAM]`

The Treasury Tracker team authors this section. This stub documents the minimum Essentials owner needs to know:

- Campaign finance data ingestion is **state-specific** — each state has its own filing authority, data format, and API (or lack thereof)
- Data richness varies significantly: LA Ethics Commission has a queryable API; MA OCPF (ocpf.us) has downloadable exports; Maine equivalent may differ
- Do not assume LA-equivalent source richness for other states — verify per state before planning campaign finance phases
- LA campaign finance work documented in Phase 30 + Phase 19 (TX); use as reference for future states

---

## Checklist Summary

Use this as your pre-execution checklist before starting any city or state:

- [ ] [VERIFY] Step 1 complete: Form of government confirmed; Mayor modeling decided; incumbents listed; **for state onboarding: legislature structure + executive officer election method confirmed**
- [ ] [VERIFY] Step 2 complete: Election method confirmed per chamber; next election date confirmed from election commission; partisan/nonpartisan confirmed; **RCV jurisdictions: election_method='rcv' set on chamber row**
- [ ] [AUTO]+[VERIFY] Step 3 complete: **For state onboarding: TIGER loader run for all layers (CD + SLDU + SLDL + PLACE + COUNTY);** city geo_id confirmed; TIGER allowlist checked [AUTO]; district counts verified with FindMyLegislator [VERIFY]; **TIGER file naming verified (not always `cd`)** [VERIFY]; **districts.state casing verified after loader run** [AUTO]
- [ ] [VERIFY] Step 4 complete: Data sources mapped for officials, elections, headshots, stances
- [ ] [VERIFY] Step 5 complete: Schema decisions recorded; migration number confirmed; spelling confirmed; election_method TEXT value verified against elections-seed reference block; **legislature-elected offices identified (is_appointed=true, no race rows)** [VERIFY]; **senator uniqueness key confirmed as (district_id, politician_id)**
- [ ] [AUTO]+[VERIFY] Step 6 complete: Migration order planned; [GOTCHA] items reviewed (slug GENERATED on chambers, governments WHERE NOT EXISTS, senator uniqueness key, legislature-elected = appointed, offices unique index drop, race_candidates WHERE NOT EXISTS)
- [ ] [AUTO] Step 7 complete: Pitfall checklist reviewed
- [ ] [AUTO] Step 8 complete: Phase templates selected for each planned GSD phase
