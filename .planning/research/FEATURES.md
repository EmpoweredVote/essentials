# Feature Landscape — Cambridge MA Location Onboarding (v5.0)

**Domain:** Civic coverage expansion — adding Cambridge, MA as a covered location
**Researched:** 2026-05-15
**Scope:** Features for milestone v5.0 — Cambridge, MA onboarding + reusable location playbook
**Supersedes:** Previous FEATURES.md (v2.1 AI Candidate Discovery System, 2026-04-23)

---

## Cambridge Government Structure (Verified)

Understanding the government structure is prerequisite to knowing what to build.
Every item in this section is sourced from official city or MMA sources.

### Form of Government

Cambridge uses a **Council-Manager** form with a ceremonial/legislative Mayor.
This differs from all prior covered locations (Monroe County IN uses county council,
LA County uses Board of Supervisors, Collin County TX uses city mayors).

| Role | Who fills it | How chosen |
|------|-------------|-----------|
| City Manager | Yi-An Huang (appointed 2022) | Appointed by City Council; chief executive of all city operations |
| Mayor | Marc C. McGovern (as of Jan 2026) | Elected **by** the 9 City Councilors from among themselves each January; chairs council + sits on School Committee |
| Vice Mayor | Burhan Azeem (as of Jan 2026, now running for state senate) | Also elected by councilors from among themselves |
| City Council (9 members) | Al-Zubi, Azeem, Flaherty, McGovern, Nolan, Simmons, Sobrinho-Wheeler, Zusy + one more (see below) | At-large, STV proportional representation, biennial |

**Current 9 councilors (elected November 2025, serving 2026-2027 term):**
1. Ayah A. Al-Zubi
2. Burhan Azeem (also Vice Mayor; running for MA State Senate 2026)
3. Tim Flaherty
4. Marc C. McGovern (also Mayor)
5. Patricia M. Nolan
6. E. Denise Simmons
7. Jivan G. Sobrinho-Wheeler
8. Catherine Zusy
9. Sumbul Siddiqui (confirmed member; also previously served as Mayor)

Note: Azeem's state senate run (primary September 1, 2026) may trigger a council vacancy mid-term if he wins. The DB should track this; the city charter governs vacancy filling procedures.

### School Committee

| Fact | Detail |
|------|--------|
| Size | 7 members (6 elected + Mayor ex officio) |
| Election method | STV proportional representation, same ballot as City Council |
| Term | 2 years, biennial with council |
| Chair | Elected by members (new charter 2025: no longer automatic Mayor) |

**Current School Committee members (elected November 2025):**
1. David Weinstein (Chair)
2. Caitlin Dube (Vice Chair)
3. Luisa de Paula Santos
4. Richard Harding Jr.
5. Elizabeth Hudson
6. Arjun Jaikumar
7. Mayor Marc C. McGovern (ex officio)

18 candidates ran for 6 elected seats in 2025 — the most in 20 years.

### State Legislative Districts Covering Cambridge

Cambridge is split across multiple districts. This means geofences are required —
a Cambridge address near Harvard may have different state reps than one near Inman Square.

**State Senate (Cambridge is split between two districts):**
- Middlesex and Suffolk District — Senator Sal DiDomenico (covers portions of Cambridge including wards 1, 3, 4 partial, 6, 7, 8 plus Charlestown, Chelsea, Everett)
- Second Middlesex District — Senator Pat Jehlen (retiring 2026; covers Cambridge, Somerville, Medford, Winchester portions). 2026 primary: Burhan Azeem vs Christine Barber vs Tom Hopcroft vs Matt McLaughlin vs Erika Uyterhoeven (September 1, 2026)

**State House (Cambridge spans ~6 districts — confirmed district names):**
- 24th Middlesex — Rep. David Rogers
- 25th Middlesex — Rep. Marjorie Decker
- 26th Middlesex — Rep. Mike Connolly
- Additional Middlesex districts (partial coverage): Michael Moran, Steven Owens, Daniel Joseph Ryan
  (Exact ward/precinct mapping requires the Cambridge Election Commission district PDF)

**Federal Congress (Cambridge is split between two districts):**
- MA-7 (majority of Cambridge) — Rep. Ayanna Pressley
- MA-5 (portion of Cambridge) — Rep. Katherine Clark
  (Clark running in 2026 primary vs Jonathan Paz and Tarik Samman, September 1, 2026)

**US Senators (statewide, all Cambridge residents):**
- Sen. Edward J. Markey
- Sen. Elizabeth Warren

### Elections Schedule

Cambridge holds municipal elections **biennially in November of odd-numbered years**.
- Last election: November 4, 2025 (9 council seats, 6 school committee seats, charter ballot question)
- Next election: November 2027 (next biennial cycle)
- State/federal: Massachusetts general elections in November of even-numbered years; primaries September 2026

**Charter update (November 2025):** Voters approved a new charter 73% yes. Key changes:
- STV proportional representation system now codified in the charter (was previously referenced by a now-repealed state law still in effect by court order)
- School Committee chair now elected by members instead of being automatic Mayor
- Board of Election Commissioners given authority to modernize tabulation process

### STV Election Mechanics (Cambridge-Specific)

Cambridge has used STV continuously since 1941 — the longest-running STV jurisdiction in the US.

| Parameter | City Council | School Committee |
|-----------|-------------|-----------------|
| Seats | 9 | 6 |
| Typical candidate count | 18-25 (2025: 20 ran) | 12-20 (2025: 18 ran) |
| Max rankings on ballot | 15 (per ballot instructions) | 15 |
| Quota formula | Droop: floor(ballots / (seats+1)) + 1 | Same |
| Surplus transfer method | Cincinnati Method (random sampling with mathematical formula) | Same |
| Result reporting | Multi-round HTML report published by Election Commission | Same |
| Ballotpedia coverage | Outside standard coverage (Cambridge <100K population) | Same |

---

## Table Stakes

Features a Cambridge resident must encounter for the location to be usable.
Missing any of these makes Cambridge feel half-built compared to Monroe County or LA County.

| Feature | Why Required | Complexity | Schema Notes |
|---------|-------------|------------|-------------|
| Cambridge city government entity | `governments` row for City of Cambridge, MA | Low | Same as Collin County city pattern |
| Cambridge chambers: City Council, School Committee | Two `chambers` rows with correct seat counts and election method | Low | `election_method = 'stv_proportional'` — new value needed or expand enum |
| All 9 City Council offices | One `offices` row per seat; at-large (no districts) | Low | `district = NULL`, `at_large = true` |
| All 6 School Committee offices | Six `offices` rows; at-large | Low | Same pattern as council |
| Current council member politicians | 9 politician rows with term end 2027-12-31 | Medium | Headshots required per project standard |
| Current School Committee politician rows | 6 elected + 1 ex officio (Mayor) = 7 total | Medium | Ex officio linkage may require note |
| Mayor/Vice Mayor titles | Stored as role flags or separate office rows; not a separate elected office | Low | Mayor is selected from council — model as `title` not a separate `office` |
| City Manager record | Yi-An Huang as appointed (not elected) official | Low | `is_elected = false`; include for completeness |
| Cambridge geofence boundary | PostGIS polygon for city boundary | Medium | City boundaries available via MassGIS; needed for address matching |
| State legislative district geofences | Cambridge spans 2 senate + ~6 house districts — all need geofences | High | Cambridge GIS publishes district shapefiles; MassGIS is canonical source |
| Federal district geofences | Cambridge splits MA-5 and MA-7 | Medium | Requires splitting city boundary correctly |
| State/federal politicians linked | Azeem, DiDomenico, Jehlen (+ 2026 successor), Rogers, Decker, Connolly, Pressley, Clark, Markey, Warren | Medium | Many already exist if MA covered elsewhere; verify before adding |
| 2027 council election race records | Placeholder races for November 2027 | Low | No candidates yet; races table row + date is sufficient |
| 2026 state/federal races | MA-7 (Pressley), MA-5 (Clark primary), 2nd Middlesex Senate primary | Medium | Azeem is a candidate in the senate race — cross-reference with his council record |

---

## Differentiators

What makes Cambridge coverage genuinely useful beyond the basics.
These are the features that justify Cambridge as a showcase location.

| Feature | Value Proposition | Complexity | Notes |
|---------|------------------|------------|-------|
| STV multi-round results display | Show the elimination rounds, not just the winner — Cambridge publishes round-by-round HTML; this is civically educational | High | Round data available at cambridgema.gov/Election2025/Council%20Round.htm; requires new UI component |
| 20-candidate ballot representation | When 20 people run for 9 seats, display all candidates with their first-round vote totals and final status (elected/eliminated) | Medium | DB supports this; UI needs to handle large candidate lists gracefully |
| Mayor-as-council-member clarity | Prominently explain that Cambridge's Mayor is not an independently-elected executive — the City Manager runs the city | Low | Tooltip or explainer card on politician profile; no data model change |
| School Committee + Council on one ballot | Show both races together in the Elections view for Cambridge — they appear on the same physical ballot | Low | UI grouping change; no schema change |
| Cross-office politician linking | Azeem is simultaneously a City Councilor, Vice Mayor, and 2026 state senate candidate — link these in the profile | Medium | `race_candidates` row in 2026 MA State Senate race + existing council record |
| Charter change timeline | Show the 2025 charter ballot question result as context for how Cambridge elections work | Low | `races` row with `type = 'ballot_question'`; results already known |
| Compass stances for local issues | Cambridge politics is dominated by housing/zoning (Azeem's upzoning passed 2025), transit, and university relations | High | Stance research follows Phase 30 pattern; STV means more candidates to research |
| Cambridge Day as canonical local source | This nonprofit paper is the primary local civic journalism outlet; cite it for candidate research | Low | Playbook documentation item; no data model change |

---

## Anti-Features

Things to deliberately skip for Cambridge.

| Anti-Feature | Why Avoid | What to Do Instead |
|-------------|-----------|-------------------|
| Modeling Mayor as a separate elected office | Mayor is chosen by council from themselves — it is a title, not an independently-elected office. Modeling it as a separate `offices` row creates false "who's running for Mayor" races | Store as a `title` or `role` flag on the politician record; document clearly in the DB |
| City Manager in elections data | Yi-An Huang is appointed, not elected. Users asking "who are my representatives" don't need to see the City Manager prominently | Include in city government listing but exclude from elections/ballot flow |
| STV round-by-round display in v5.0 | Full round visualization is high complexity and has no prior art in this codebase | Flag as future differentiator; ship flat candidate list with vote totals first |
| Modeling all 6 Cambridge House districts as separate geofences in phase 1 | 6 different state rep districts is the hardest geofencing problem in this project — more districts than Monroe County or Collin County combined | Ship city council + 2 senate districts first; add house districts in a follow-on phase |
| Scraping Cambridge election round reports | Round-by-round HTML reports exist but change format each election | Ingest only final results (elected/not-elected, first-round votes) for v5.0 |
| Real-time 2027 candidate discovery | Filing doesn't open until summer 2027 | Add 2027 placeholder races; run discovery when filing opens |

---

## Playbook Items (Process Steps for Cambridge + Future Locations)

These are the procedural discoveries from researching Cambridge — steps that apply when onboarding any new MA city, and the broader lessons for the playbook.

### MA-Specific Sources and Quirks

| Source | What It Provides | How to Use |
|--------|-----------------|-----------|
| `cambridgema.gov/Departments/electioncommission` | Official candidate lists (PDF), election results by round (HTML), district maps | Primary source for candidates; PDF list published after nomination papers filed |
| `cambridgema.gov/GIS` | State rep, state senate, congressional district shapefiles | Download shapefiles for geofence boundary ingestion |
| MassGIS (`gis.data.mass.gov`) | Statewide authoritative boundary data for all legislative districts | Use for district boundaries when city GIS is not enough |
| `malegislature.gov/Search/FindMyLegislator` | Address → district + legislator lookup | Use to verify which districts touch Cambridge before ingesting |
| MMA Data Hub (`mma.org`) | Form of government, key officials, legislators per community for all 351 MA cities | Cold-start discovery — tells you gov structure and legislators for any MA city. Web directory, not API |
| `cambridgeday.com` | Primary local journalism; covers all council votes and election coverage | Candidate research and stance sourcing |
| `rwinters.com` (Cambridge Civic Journal) | Unofficial but comprehensive archive of all Cambridge elections since 1941, round reports | Historical context and election data verification |
| MA SoS Elections Division (`electionstats.state.ma.us`) | Historical MA election results, 1970-present | State/federal race results |
| OpenStates | State legislative data (bills, legislators) for MA | Does not cover municipal offices |

### Key MA Quirks vs Prior Locations

| Quirk | Impact on Playbook |
|-------|-------------------|
| STV ballots with 15-20+ candidates | The `race_candidates` table must handle large candidate counts per race; UI must paginate or collapse losers |
| Mayor is not independently elected | Any MA city using Council-Manager form (common in MA) must not model the Mayor as a standalone election |
| Municipal elections in odd years only | No Cambridge races in 2026; state/federal in 2026 are on separate ballot and separate election date |
| District splits within a single city | Cambridge splits across 2 senate + 6 house + 2 federal districts. Cold-start: always check `malegislature.gov/FindMyLegislator` with multiple Cambridge addresses before assuming one district |
| Ballotpedia does not cover Cambridge | Cambridge (population ~118K) is below Ballotpedia's 100K-largest-city threshold for scheduled updates. Do not rely on Ballotpedia for current Cambridge data |
| MMA Data Hub has key officials | For any MA city, MMA lists the current form of government, key officials, and legislators — this is the fastest cold-start source before going to the city website |
| Charter variations | MA cities have wide charter variation. Cambridge's STV system is unique; other MA cities may use standard plurality. Always verify charter before modeling elections |

### Cold-Start Playbook for Any New MA City

1. **MMA Data Hub first.** `mma.org/community/[cityname]/` gives form of government, key official names, and legislators in 60 seconds.
2. **City website election commission.** Find official candidate list PDFs and district map PDFs.
3. **MassGIS for district boundaries.** `gis.data.mass.gov` for authoritative shapefiles; supplement with city GIS.
4. **`malegislature.gov/FindMyLegislator` spot-check.** Test 3-4 addresses across the city to confirm which districts are present and whether there are splits.
5. **OpenStates for legislators.** Once district names are confirmed, OpenStates has structured legislator data for MA House and Senate.
6. **MA SoS `electionstats.state.ma.us` for election history.** Verify past results and upcoming election dates.
7. **Local newspaper.** Every sizeable MA city has one — Cambridge Day for Cambridge; use for candidate research and stances.
8. **Never assume Ballotpedia.** Only Boston is reliably covered. All other MA cities require going to official sources.

---

## Feature Dependencies

```
Cambridge city geofence boundary
  └── address matching → routes user to Cambridge officials

State legislative district geofences (2 senate + 6 house + 2 federal)
  └── address matching → routes user to correct state rep / senator / rep in congress

Cambridge governments + chambers
  └── offices (9 council + 6 school committee)
       └── politicians (incumbents, with headshots)
            └── races (2027 council placeholder; 2025 completed results)
                 └── race_candidates (all 20 council + 18 school committee from 2025)

2026 MA state races
  └── Azeem → linked to existing council politician record + new senate race_candidate row
  └── 2nd Middlesex Senate primary (Sept 2026 primary)
  └── MA-5 House primary (Sept 2026)
```

**Critical path for Cambridge to be usable:**
`Cambridge geofence → governments/chambers/offices → 9 incumbents → state/federal politicians`

---

## MVP Recommendation

**Phase 1 — Government structure + incumbents (no elections)**
Create Cambridge government, two chambers (council + school committee), offices, and politician rows for all 9 incumbents. No geofence yet — test with hardcoded Cambridge address. Headshots required per project standard.

**Phase 2 — Geofence + address routing**
Ingest city boundary geofence from MassGIS. Wire address lookup to return Cambridge officials. Test with 5 representative Cambridge addresses.

**Phase 3 — State/federal legislators**
Map the 2 senate and at least 2 confirmed house districts. Ingest or verify existing politician records for Azeem (senate candidate), DiDomenico, Rogers, Decker, Connolly, Pressley, Clark, Markey, Warren.

**Phase 4 — 2025 completed election data**
Ingest the November 2025 council and school committee results as completed races. All 20 council candidates + all 18 school committee candidates as race_candidate rows with vote totals and elected/eliminated status.

**Phase 5 — 2026 state/federal races**
Add September 2026 primary races for 2nd Middlesex Senate and MA-5 House. Link Azeem as a candidate.

**Defer post-MVP:**
- 6 house district geofences (complex, do senate + federal first)
- STV round-by-round results display
- Compass stances for Cambridge candidates (follows Phase 30 pattern after incumbents are ingested)
- 2027 council race candidates (filing not open until summer 2027)

---

## Confidence Assessment

| Area | Confidence | Source |
|------|-----------|--------|
| Government structure (Council-Manager, 9 council, 7 school committee) | HIGH | cambridgema.gov official pages + MMA Data Hub |
| Current council member names | HIGH | cambridgema.gov/Departments/citycouncil/members |
| Current School Committee names | HIGH | cpsd.us + Harvard Crimson election results |
| STV system mechanics | HIGH | cambridgema.gov Election Commission + rcvresources.org |
| 2025 election results (7 incumbents + 2 challengers) | HIGH | Harvard Crimson + The Tech (MIT) post-election reporting |
| State senate districts (DiDomenico, Jehlen/2026 successor) | HIGH | MMA Data Hub + malegislature.gov |
| State house districts (Rogers 24th, Decker 25th, Connolly 26th) | HIGH | Multiple sources agree |
| Additional house districts (Moran, Owens, Ryan) | MEDIUM | MMA Data Hub lists these for Cambridge; exact ward/precinct mapping requires district PDF |
| Congressional split (MA-7 majority, MA-5 portion) | HIGH | Cambridge GIS + multiple sources confirm split |
| Next election date (November 2027) | HIGH | Biennial pattern confirmed; MMA lists 2027 |
| 2026 Azeem senate race (primary Sept 1, 2026) | HIGH | Harvard Crimson + Cambridge Day reporting, 5-way race confirmed |
| Azeem current council status (will he resign before election?) | LOW | Not yet determined; depends on primary result |

---

## Sources

- [Cambridge City Council members page](https://www.cambridgema.gov/Departments/citycouncil/members) — current 9 councilors, Mayor confirmed
- [Cambridge Election Commission — Municipal Elections](https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections) — biennial schedule, STV mechanics, offices on ballot
- [Cambridge School Committee members](https://www.cpsd.us/school-committee/school-committee-members-subcommittees) — 7 members confirmed
- [Cambridge School Committee 2025 results — Cambridge Day](https://www.cambridgeday.com/2025/11/05/cambridge-elects-school-committee-newcomers-bringing-back-only-harding-and-hudson/) — 2025 election outcome
- [Cambridge City Council 2025 results — The Tech (MIT)](https://thetech.com/2025/11/06/2025-cambridge-city-council-election) — 20 candidates, 7 incumbents + 2 challengers elected
- [Charter ballot question passed 73% — Harvard Crimson](https://www.thecrimson.com/article/2025/11/5/cambridge-updates-charter/) — charter modernization confirmed
- [RCV Resources — Cambridge MA in practice](https://www.rcvresources.org/in-practice-cambridge-ma) — Droop quota, Cincinnati Method surplus transfer
- [MMA Cambridge community profile](https://www.mma.org/community/cambridge/) — form of government, key officials, legislators listed
- [Senator Pat Jehlen — Second Middlesex](https://malegislature.gov/Legislators/Profile/PDJ0/District) — retiring 2026
- [Burhan Azeem state senate bid — Harvard Crimson](https://www.thecrimson.com/article/2026/2/18/azeem-state-senate/) — 5-way Democratic primary September 2026
- [Cambridge GIS — State Rep Districts](https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_StateRepDistricts) — district shapefiles available
- [Cambridge GIS — Congressional Districts](https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_CongressionalDistricts) — MA-5/MA-7 split confirmed
- [MMA Data Hub announcement](https://www.mma.org/mma-launches-mass-municipal-data-hub/) — web directory (not API) covering all 351 MA cities
- [Cambridge Day — local civic journalism](https://www.cambridgeday.com/) — nonprofit news; primary local source for candidate research
