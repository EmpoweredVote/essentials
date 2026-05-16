# Domain Pitfalls: Location Onboarding Playbook (v5.0)

**Domain:** Cold-start US city onboarding — government structure, officials data, headshots, discovery pipeline, compass stances
**Proof-of-concept city:** Cambridge, MA
**Researched:** 2026-05-15
**Prior locations completed:** Monroe County IN, Los Angeles County CA, Collin County TX

---

## Critical Pitfalls

Mistakes that cause DB corruption, incorrect geofencing, or voter-facing misinformation.

---

### Pitfall 1: Assuming Mayor = Elected Executive

**What goes wrong:** The DB schema and onboarding workflow are built around the pattern "mayor is the top elected executive." Cambridge uses Plan E — a council-manager form where the mayor is a ceremonial title elected from within the City Council (not separately by voters), and the real executive is an appointed City Manager (currently Yi-An Huang). If the onboarding workflow creates an `elected_executive` office or role for "Mayor," it misrepresents Cambridge's power structure.

**Why it happens:** Every prior location used a strong-mayor or standard council structure. Monroe County IN has an elected County Commissioners board with a president. LA has an elected Mayor. TX cities (Plano, McKinney, etc.) use council-manager but their mayors are directly elected. Cambridge is the first city in the project where the mayor is not separately elected — they emerge from a council vote after the council election.

**Consequences:**
- The mayor appears in the app as if they were elected to that role, misleading voters about how Cambridge government works
- If any compass questions or stance research assumes the mayor controls executive functions, the framing is wrong — the City Manager does
- Profile pages showing "Mayor" as a primary leadership role overstate that role's democratic accountability

**Prevention:**
- Treat Cambridge Mayor as an office within the City Council government body, not a separate government or office type
- The Mayor role must be seeded as a council position, not an executive government row
- City Manager should be present as a non-elected appointed official row — flagged clearly as appointed, not elected
- Do NOT create a `LOCAL_EXEC` district_type row for the mayor; use the same `LOCAL` type as other council seats

**Detection (warning sign):** Any phase plan that refers to "seeding the Mayor as a LOCAL_EXEC office" is wrong for Cambridge.

**Phase that must address it:** Government Structure seed phase (equivalent to Phase 12 for TX).

---

### Pitfall 2: Cambridge STV Produces 19–37 Candidates Per Race — UI Has No Hard Limit

**What goes wrong:** Cambridge City Council (9 seats) had 19 candidates in 2025. School Committee (6 seats) had 18 candidates in 2025. The `ElectionsView.jsx` component renders every candidate as a `PoliticianCard` in a responsive grid. There is no pagination, no "show more" toggle, and no maximum per race. At 19+ candidates, the elections page becomes extremely long, potentially unusable on mobile.

**Why it happens:** Prior locations had small candidate fields. Monroe County races are typically 2–4 candidates. LA County individual races rarely exceed 10. Collin County municipal races are 3–6 candidates at most. Cambridge's STV system incentivizes large fields — any candidate with a viable vote share can win a seat, so filing is rational even with 9+ incumbents running.

**Consequences:**
- Mobile users scroll through 19 candidate cards before reaching the next race
- Compass mode with MiniCompass overlays on 19 cards each trigger a stances fetch — potential rate limit or performance issue
- If School Committee (18 candidates, 6 seats) and City Council (19 candidates, 9 seats) both render in the same election, that is 37 candidate cards before any state or federal races appear

**Prevention:**
- Verify the existing UI renders acceptably at 19 candidates before shipping Cambridge elections data. Test with a mock race of 19 entries.
- Consider a "show all N candidates" toggle that defaults to showing the top N candidates (e.g., 9 for a 9-seat race) sorted by seeded shuffle, with "show all" expansion
- Ensure the MiniCompass stances fetch in ElectionsView is batched, not 19 separate simultaneous fetches — the existing `Promise.all` for `visibleCandidateIds` is correct; verify it handles large sets

**Detection (warning sign):** Loading the Cambridge elections page takes more than 3 seconds on first load, or the Anthropic API throws rate limit errors from a large compass stances batch.

**Phase that must address it:** Discovery Pipeline + Elections seed phase. Pre-ship UI validation required before seeding election data.

---

### Pitfall 3: Cambridge Has a 2025 Charter Amendment That Changed Government Structure — The New Charter Is in Force

**What goes wrong:** Research or documentation about Cambridge government references the pre-2025 "Plan E charter" that has been in place since 1938–1940. Cambridge voters approved a new expanded charter in November 2025 (75%+ yes). The most notable structural change: the School Committee no longer has the mayor as automatic chair — the School Committee now elects its own chair. If the onboarding seeds the mayor as a School Committee member, that is now incorrect under the new charter.

**Why it happens:** Most Wikipedia and Ballotpedia articles about Cambridge government describe the Plan E structure from before November 2025. The new charter will not appear in general reference sources for months.

**Consequences:**
- Seeding the Mayor as a School Committee member (old structure) is incorrect under the new charter
- Any "roles the mayor holds" list that includes School Committee chair is stale

**Prevention:**
- Do NOT include Mayor as a School Committee position in the DB seed
- Verify the current (post-Nov 2025) school committee structure from cambridgema.gov before seeding
- The City Manager remains appointed; the strong-mayor proposal was dropped before the charter vote

**Detection (warning sign):** Any plan that seeds the mayor as an automatic School Committee member.

**Phase that must address it:** Government Structure seed phase, specifically the School Committee rows.

---

### Pitfall 4: Massachusetts Municipal Elections Are Odd-Year — Next Cambridge Election Is November 2027, Not 2026

**What goes wrong:** Every prior location used even-year elections aligned with state/federal cycles (IN May 2026 primary, LA June 2026 primary, TX May 2026 municipal). Cambridge's last election was November 4, 2025. The next municipal election is November 2027. Seeding an election row with a 2026 date for Cambridge is incorrect and will show races as upcoming when they are not.

**Why it happens:** Massachusetts law requires city elections in odd-numbered years. Cambridge council and school committee terms are 2-year terms running from January 2026 through January 2028. State and federal elections are even-year. Town meetings (for MA towns, not cities) can be spring.

**Consequences:**
- Discovery pipeline seeded with a 2026 election date fires the cron and returns zero candidates, triggering false regression alerts
- A user looking at Cambridge elections sees a race with a November 2026 date that does not exist
- The elections page shows "upcoming" races that already happened in 2025

**Prevention:**
- Seed Cambridge election row with `election_date = '2027-11-04'` (or the confirmed 2027 date once available)
- The 2025 Cambridge results (7 incumbents + 2 challengers won council; 2 incumbents + 4 new members won school committee) should be recorded as historical data, not "upcoming"
- Do not use "current election in this state" as a shortcut for Cambridge — confirm the specific Cambridge municipal calendar
- Consider whether the app should show the 2025 incumbents as current officeholders (yes) while the election display shows 2027 as the next cycle

**Detection (warning sign):** Any plan that mentions seeding a Cambridge election in 2026 is wrong.

**Phase that must address it:** Elections seed phase — must confirm the 2027 election date before creating any election row.

---

### Pitfall 5: Cambridge Spans Multiple State Legislative Districts — Multi-District Representatives Are a Geofence Complexity

**What goes wrong:** Cambridge is split across at minimum 4 state house districts (24th, 25th, 26th, 29th Middlesex) and at least 2 state senate districts (Second Middlesex, Suffolk and Middlesex). The 29th Middlesex (Dave Rogers) covers only 2 precincts of Cambridge plus most of Arlington and all of Belmont. The 26th Middlesex (Mike Connolly) also covers parts of Somerville. If TIGER/PostGIS boundaries are used for MA state legislative geofences, any Cambridge address resolving to the 29th Middlesex will show Arlington-centric representatives that Cambridge residents may not recognize as "theirs."

**Why it happens:** Cambridge is a dense city whose ward/precinct boundaries are carved up finely. TX state legislative districts for Collin County were relatively clean — each city fell mostly within one or two districts. Cambridge has 11 wards, many split across district lines.

**Consequences:**
- A Cambridge address in the 24th Middlesex returns Dave Rogers as the state rep; that address may be only 2 precincts in Cambridge while the rest of the district is suburban
- The app may show the correct representative but users may not recognize them as their Cambridge rep if they assumed Cambridge was one district
- Multi-district geofence overlaps increase the chance of double-assignment bugs

**Prevention:**
- Use MassGIS's published state house shapefile (2021 redistricting, effective 2022) for MA district geofences — it is more accurate than raw TIGER for MA-specific boundaries
- Verify which Cambridge wards/precincts fall in each district before seeding geofences
- The existing PostGIS geofencing approach (used for TX) is correct; the data source matters more than the approach

**Detection (warning sign):** A Cambridge address lookup returns 3+ state house representatives. That would indicate overlapping polygons or a polygon import error.

**Phase that must address it:** MA state legislative officials + geofence phase.

---

## Moderate Pitfalls

Mistakes that cause data quality gaps or require rework, but not voter-facing misinformation.

---

### Pitfall 6: Cambridge Official Email Addresses Follow a Pattern — But the Pattern Is Inconsistent

**What goes wrong:** Cambridge city council member email addresses follow a clear `firstname.lastname@cambridgema.gov` pattern (e.g., siddiqui@cambridgema.gov for Mayor Siddiqui). However, the search results show old council member emails like `CarloneCR@cambridgeMA.GOV` (with initials) and `MalnonAL@cambridgeMA.GOV` for members who are no longer on the council. The 2025 council has changed membership, and new members (Al-Zubi, Flaherty) may have different email formats.

**Why it happens:** Cambridge's email format has evolved. Older members used `LastnameInitials@` format; newer members appear to use `firstname@` or `lastname@` patterns. No definitive pattern applies to every member. CloudFlare-style protection is less of an issue here than in TX (Cambridge's city website does not use heavy bot protection), but the email format must be verified per member.

**Consequences:**
- Seeding stale emails from old council configurations results in incorrect contact data
- If the 2025 council members' emails are guessed rather than verified, some will bounce

**Prevention:**
- Pull email addresses only from the official Cambridge city council members page (cambridgema.gov/Departments/citycouncil/members) at the time of seeding
- Do not infer emails from old members' patterns; verify each new member individually
- NULL is acceptable if an email cannot be confirmed from official sources — consistent with TX CloudFlare policy

**Detection (warning sign):** Any plan that hard-codes email addresses without citing the official source URL.

**Phase that must address it:** Incumbents seed phase.

---

### Pitfall 7: Cambridge Open Data Portal Exists But Does Not Publish Officials or Contact Data

**What goes wrong:** Cambridge has an unusually active open data program (data.cambridgema.gov) with hundreds of datasets. The onboarding researcher might assume that officials/contact data is available as a structured download from this portal. It is not. The portal focuses on operational data (permits, trash, police logs, public art) — not government personnel.

**Why it happens:** MA does not have a statewide officials data mandate equivalent to Texas's open records for government personnel. Cambridge's portal follows cities' typical pattern of publishing service data rather than personnel directories.

**Consequences:**
- Time wasted searching data.cambridgema.gov for officials data that does not exist there
- Onboarding researcher may conclude "Cambridge has great open data" and over-invest in that source

**Prevention:**
- For Cambridge officials: use cambridgema.gov/Departments/citycouncil/members directly, not the open data portal
- For candidate data during election season: use the election commission's official candidate PDFs (cambridgema.gov/Departments/electioncommission)
- The Mass Municipal Data Hub (mma.org) has key local officials per municipality — useful as a secondary check, not a primary source

**Detection (warning sign):** Any research or plan that cites data.cambridgema.gov as a source for officials or contact information.

**Phase that must address it:** Research phase (this file). Flag clearly in LOCATION-ONBOARDING.md checklist: "Open data portals rarely publish officials/contacts."

---

### Pitfall 8: LA-Specific Data Sources Are Not Generalizable — Cambridge Has None of Them

**What goes wrong:** The LA onboarding relied on uniquely rich sources: LACBA attorney ratings, CJP judicial discipline database, LA Ethics Commission campaign finance (FPPC Form 460), lavote.gov candidate list API. These sources do not exist or do not apply outside of California. The Cambridge onboarding should not assume analogous sources exist for MA.

**Why it happens:** Researchers and plan writers may use LA as the mental model for "what a well-resourced location looks like." LA has exceptional civic transparency infrastructure. Cambridge, despite being a well-governed educated city, lacks equivalents for most of these.

**Consequences:**
- Phases planned around "find bar evaluation data for Cambridge attorneys" waste time — there is no Massachusetts equivalent of LACBA ratings for elected officials
- Campaign finance for Cambridge candidates comes from the MA OCPF (Office of Campaign and Political Finance), not an FPPC-equivalent system — different format, different ingestion approach
- Judicial compass stances for Cambridge courts (if applicable) would need different sourcing

**Prevention:**
- Treat LA's data richness as an outlier, not a baseline
- For Cambridge compass stances: rely on the same approach as TX — public statements, voting records, news coverage, official positions
- For Cambridge campaign finance: MA OCPF (ocpf.us) is the correct source; verify format before planning any ingestion phase
- For headshots: the city council members page shows official photos; vote.cambridgecivic.com (a volunteer civic site) also has candidate photos — both are usable

**Detection (warning sign):** Any phase plan that mentions "equivalent to LACBA" or "equivalent to LA Ethics Commission" for Cambridge.

**Phase that must address it:** All phases. Flag explicitly in LOCATION-ONBOARDING.md that LA-specific sources must be excluded from generic playbook steps.

---

### Pitfall 9: TX Assumption That Municipal = Nonpartisan Does Not Universally Hold

**What goes wrong:** Texas municipal elections are nonpartisan by design — no party labels on the ballot. The entire Collin County onboarding never needed to handle party affiliation at the local level. Cambridge municipal elections are also officially nonpartisan in that candidates do not appear with party labels. However, Cambridge candidates are typically well-known by political affiliation through endorsements and media coverage, and the charter review debate had strong partisan dimensions. If the playbook encodes "municipal = nonpartisan = skip all party handling," that is correct for Cambridge but may not generalize to all cities.

**Why it happens:** Massachusetts cities run nonpartisan municipal elections (city charters, not state mandate). But some US cities (e.g., certain Southern cities, partisan mayoral races in larger cities like Chicago) run partisan municipal elections. The TX experience may encode a false assumption.

**Consequences:**
- The playbook says "local races = no party data needed" and a future city with partisan local races breaks this assumption
- Cambridge is fine with this assumption; the risk is to future onboardings

**Prevention:**
- In LOCATION-ONBOARDING.md, add a required step: "Confirm whether this city's municipal elections are partisan or nonpartisan before seeding races"
- Do not hardcode "no party for local" — make it a configurable field checked per location
- For Cambridge: nonpartisan is confirmed correct

**Detection (warning sign):** A future location onboarding skips the party-confirmation step and later discovers a partisan local race.

**Phase that must address it:** LOCATION-ONBOARDING.md checklist authoring phase. Add it as a required pre-seed verification.

---

### Pitfall 10: MassGIS Legislative Boundaries Use 2021 Redistricting — Confirm These Are the Current Effective Boundaries

**What goes wrong:** MassGIS labels its state house and senate shapefile downloads as "Massachusetts House Legislative Districts (2021)" and "Massachusetts Senate Legislative Districts (2021)." The 2021 maps were enacted November 2021 and took effect for the 2022 elections. These are the current boundaries as of 2026. However, if a researcher sees "2021" in the filename and assumes an older dataset is needed, or confuses this with pre-redistricting data, they may import incorrect boundaries.

**Why it happens:** TIGER/Line files are labeled by the year the census data was collected, not the year the political district went into effect. The 2021 MA redistricting label is confusing — it means "districts drawn based on 2020 census, enacted 2021, effective 2022."

**Consequences:**
- Wrong geofences for Cambridge state reps if the pre-2021 boundaries are accidentally used
- A 2016 or 2018 TIGER download would have the old district boundaries that were redrawn after the 2020 census

**Prevention:**
- Use MassGIS official shapefiles, not raw Census TIGER downloads, for MA state districts
- Confirm the MassGIS file is labeled "(2021)" or "(2022 effective)" before import
- Verify against malegislature.gov/Search/FindMyLegislator that a known Cambridge address returns the expected representative (Dave Rogers 24th, Mike Connolly 26th, or Marjorie Decker 25th)

**Detection (warning sign):** A Cambridge address lookup returns the wrong state representative — cross-check against malegislature.gov/Search/FindMyLegislator.

**Phase that must address it:** MA state legislative geofence phase.

---

## Minor Pitfalls

Mistakes that cause wasted effort or technical debt but are fixable.

---

### Pitfall 11: Cambridge FIPS Code Ambiguity — City Place Code vs. County FIPS

**What goes wrong:** Cambridge the city has Census place FIPS code 2511000 (state 25 = MA, place 11000 = Cambridge). Middlesex County (where Cambridge is located) has FIPS code 25017. A researcher searching "Cambridge MA FIPS code" may find the county code (25017) rather than the city code (2511000) and use it for geo_id seeding.

**Why it happens:** Cambridge is so strongly associated with Harvard and MIT that many data sources reference it by the metro area rather than the specific municipality. County-level FIPS codes appear more frequently in demographic datasets.

**Consequences:**
- A geo_id of '25017' would create a Middlesex County government row, not a Cambridge city row
- Geofences built on the county polygon would match Cambridge addresses but also match every other city in Middlesex County

**Prevention:**
- Cambridge city geo_id = '2511000' (7-digit Census place code, standard format used for all cities in this project)
- Middlesex County geo_id = '25017' (if seeded separately as the county government)
- The pattern is identical to TX: city geo_id is the 7-digit place code, county is the 5-digit county FIPS

**Detection (warning sign):** Any migration that seeds Cambridge with geo_id = '25017' — that is the county, not the city.

**Phase that must address it:** Government Structure seed phase — first migration that creates the Cambridge government row.

---

### Pitfall 12: Cambridge City Councillor (with -ll-) vs. Councilor Spelling

**What goes wrong:** Cambridge officially uses the spelling "Councillor" (double-l, British English convention) for its council members. The official website, ballots, and press releases all use "Councillor." The app may display "Councilor" (single-l, American English) if the title is auto-generated from an `office_title` field or normalized.

**Why it happens:** Cambridge is one of a small number of US municipalities that retained the British spelling. This is cosmetically wrong but not functionally harmful.

**Prevention:**
- Seed Cambridge council office rows with `office_title = 'Councillor'` (double-l)
- Do not rely on auto-generation or normalization that converts to "Councilor"

**Detection (warning sign):** Profile pages showing Cambridge officials with "Councilor" instead of "Councillor."

**Phase that must address it:** Government Structure seed phase.

---

### Pitfall 13: Discovery Cron Will Fire on a 2027 Election — 2-Year Gap Means No Candidates Until Filing Opens

**What goes wrong:** If the discovery pipeline is seeded for Cambridge with a 2027 election date, the weekly cron will run and return zero candidates for approximately 2 years until the 2027 filing period opens. This is normal but will trigger zero-candidate regression alerts if not handled.

**Why it happens:** The existing regression alert fires when "a run returns 0 candidates for a jurisdiction that previously returned non-zero." For a brand-new jurisdiction (no prior runs), this should not trigger. But if any initial seed run or test run populates candidates, then the next regular run returns 0, the alert fires incorrectly.

**Prevention:**
- Do not run a discovery test run for Cambridge until the 2027 filing period actually opens (approximately summer 2027)
- OR: Seed Cambridge discovery_jurisdictions with a very far `election_date` and mark the jurisdiction as `inactive` until closer to 2027 filing
- The regression alert logic should check `election_date > NOW() - INTERVAL '6 months'` before considering a zero-candidate run as a regression

**Detection (warning sign):** Admin receives weekly "zero candidates regression" alerts for Cambridge starting immediately after the Cambridge discovery jurisdiction is seeded.

**Phase that must address it:** Discovery Pipeline configuration phase.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Government Structure seed | Mayor = appointed from council, not elected | Use LOCAL (not LOCAL_EXEC) for mayor office; seed City Manager as appointed |
| Government Structure seed | School Committee chair changed (2025 charter) | Do NOT include mayor as automatic School Committee member |
| Government Structure seed | Cambridge FIPS = 2511000, not 25017 | Verify 7-digit place code before first migration |
| Government Structure seed | "Councillor" double-l spelling | Hard-code this title; do not normalize |
| Election row seed | Next election is 2027, not 2026 | Confirm 2027 date before creating election row |
| Incumbents seed | Email format inconsistent across members | Pull emails only from official city council members page at time of seeding |
| MA state officials | 4+ state house districts split across Cambridge | Use MassGIS 2021 shapefile, not raw TIGER; verify with FindMyLegislator |
| MA state officials | Geofence FIPS for districts uses 2021 redistricting | Label check: MassGIS "(2021)" files ARE the current effective boundaries |
| Headshots | City council page has official photos | Use cambridgema.gov/Departments/citycouncil/members as primary source; vote.cambridgecivic.com as backup |
| Discovery pipeline | Election not until 2027 — cron returns 0 forever | Mark jurisdiction inactive until 2027 filing period, or suppress regression alert |
| Compass stances | No LACBA/CJP equivalent in MA | Use public voting record, policy statements, news sourcing — same approach as TX |
| Elections UI | 19 Council + 18 School Committee = 37 cards | Pre-validate UI at scale; consider "show all" toggle before Cambridge elections ship |
| Playbook generalization | Odd-year elections not default | Add "confirm election year type" to LOCATION-ONBOARDING.md checklist |
| Playbook generalization | Open data portal ≠ officials data | Add explicit note: operational data portals rarely publish personnel/contact data |
| Playbook generalization | LA data richness is an outlier | Mark LA-specific sources clearly in playbook; remove from generic checklist |

---

## Confidence Assessment

| Pitfall Area | Confidence | Sources |
|-------------|------------|---------|
| Cambridge Plan E / city manager structure | HIGH | cambridgema.gov official, Harvard Crimson reporting |
| 2025 charter amendment (mayor off School Committee) | HIGH | Harvard Crimson election night coverage, official results |
| 2025 election date (Nov 4, 2025) and results | HIGH | Official Cambridge election results, multiple news sources |
| Next election is 2027 (odd-year cycle) | HIGH | Massachusetts state law, MA elections commission |
| Candidate counts (19 council, 18 school committee) | HIGH | Official Cambridge election commission candidate PDFs |
| Cambridge FIPS = 2511000 | HIGH | US Census official GEOID documentation |
| MassGIS 2021 redistricting = current effective | HIGH | MassGIS mass.gov official documentation |
| Cambridge state rep districts (24th, 25th, 26th, 29th Middlesex) | HIGH | malegislature.gov + Cambridge election commission maps |
| Cambridge open data portal content | HIGH | data.cambridgema.gov direct inspection |
| MA odd-year municipal election requirement | HIGH | Massachusetts MGL + American Academy of Arts and Sciences report |
| UI behavior with 19+ candidates | MEDIUM | Code inspection of ElectionsView.jsx — no hard limit found; performance not load-tested at this scale |

---

## Sources

- Cambridge Municipal Elections official page: https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections
- Cambridge 2025 election official results: https://www.cambridgema.gov/Departments/electioncommission/news/2025/11/2025municipalelectionofficialresultsnovember14thupdate
- Cambridge Plan E Charter: https://www.cambridgema.gov/publications/documents/p/planecharter
- Cambridge City Manager's Office: https://www.cambridgema.gov/Departments/citymanagersoffice
- 2025 charter ballot question result (Harvard Crimson): https://www.thecrimson.com/article/2025/11/5/cambridge-updates-charter/
- MassGIS Massachusetts House Legislative Districts (2021): https://www.mass.gov/info-details/massgis-data-massachusetts-house-legislative-districts-2021
- MA Congressional Districts (118th): https://www.mass.gov/info-details/massgis-data-us-congressional-districts-118th
- Redistricting in Massachusetts (Ballotpedia): https://ballotpedia.org/Redistricting_in_Massachusetts
- MA odd-year city elections (American Academy of Arts and Sciences): https://www.amacad.org/news/massachusetts-should-move-local-elections-even-numbered-years
- Cambridge Open Data Program: https://www.cambridgema.gov/departments/opendata
- Cambridge City Council Members page: https://www.cambridgema.gov/Departments/citycouncil/members
- Cambridge state representative legislative district map: https://www.cambridgema.gov/-/media/Files/electioncommission/mapsandpollinglocations/legislativedistricts.pdf
- Cambridge civic candidate pages (volunteer source for photos): http://vote.cambridgecivic.com/
- US Census GEOID documentation: https://www.census.gov/programs-surveys/geography/guidance/geo-identifiers.html
- Existing codebase: `src/components/ElectionsView.jsx` (candidate rendering logic, no hard limit found on candidate count per race)
