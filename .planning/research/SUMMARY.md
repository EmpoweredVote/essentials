# Research Summary: v5.0 Location Onboarding Playbook — Cambridge, MA

**Project:** Essentials (empowered.vote) — Cambridge, MA civic coverage + reusable location playbook
**Domain:** US city onboarding — government structure, officials data, geofences, elections, headshots
**Researched:** 2026-05-15
**Confidence:** HIGH

---

## Executive Summary

Cambridge, MA is the proof-of-concept city for the v5.0 Location Onboarding Playbook milestone. It uses a Council-Manager form of government with 9 at-large City Councillors (double-l) elected via Single Transferable Vote — the longest continuously-running STV jurisdiction in the US, in place since 1941. The Mayor is NOT a separately-elected office: it is a title given to the councillor who led first-choice votes in the preceding STV election, making it a derived ceremonial role with no independent executive authority. The City Manager (currently Yi-An Huang) is the actual chief executive. This is the single most important structural fact in the entire milestone and must drive every schema decision.

The implementation path is low-friction on the technology side. No new npm packages are required, TIGER 2024 boundaries work for MA with a one-line allowlist addition to the existing loader, and every migration pattern needed (governments, chambers, offices, politicians, geofences) already exists in the codebase from TX/CA/IN. The main effort is data collection — all Cambridge and MA sources are HTML-only with no bulk-download APIs — and the careful handling of three Cambridge-specific quirks: (1) the non-elected Mayor, (2) the odd-year election cycle (next city election is November 2027, not 2026), and (3) the 3+ state legislative districts splitting the city, which require PostGIS geofences rather than a simple one-district assumption.

The v5.0 milestone also codifies a reusable LOCATION-ONBOARDING.md playbook and phase templates in .planning/. Cambridge surfaces several generalizable insights: open data portals rarely contain officials/contact data, LA data richness is an outlier not a baseline, and future cities must have their partisan/nonpartisan status and election-year type confirmed before seeding commences.

---

## Critical Decisions

These must be resolved before planning begins. Getting any one of them wrong corrupts the schema.

| Decision | Answer | Rationale |
|----------|--------|-----------|
| **Mayor office type** | is_appointed_position = true on a LOCAL office row; share the politician row with one council seat | Mayor is NOT directly elected. Must not appear as a standalone elected executive. Do NOT use LOCAL_EXEC. |
| **Mayor as School Committee member?** | NO — under the new 2025 charter, Mayor is no longer automatic School Committee member | The pre-2025 Plan E gave Mayor ex officio School Committee membership. The November 2025 charter change removed this. Do not model the Mayor as having a School Committee seat. |
| **City Manager office type** | is_appointed_position = true; is_appointed = true on the politician row | Yi-An Huang is appointed by council; should appear in representative lookup results flagged as appointed. |
| **Cambridge geo_id** | 2511000 (7-digit Census place code) | NOT 25017 (that is Middlesex County). Matches the project-wide pattern of 7-digit place codes for cities. |
| **election_method enum** | stv_proportional — verify whether this value exists or needs adding | Cambridge STV is structurally unlike any prior city election method. Check the chambers table constraint before migrating. |
| **Next Cambridge election** | November 2027 — seed election row with 2027 date | Massachusetts law requires municipal elections in odd-numbered years. There is NO Cambridge city election in 2026. Seeding a 2026 date is wrong. |
| **Councillor spelling** | Double-l: Councillor | Cambridge official spelling. Hard-code in the offices title; do not normalize. |

---

## Key Findings

### From STACK.md

Massachusetts (FIPS 25) requires zero new npm packages. The load-state-tiger-boundaries.ts script already handles MA MTFCC codes (G5210 = Senate, G5220 = House — identical to TX). FIPS_TO_STATE already contains 25: ma. The only code change needed is one line added to STATE_LAYER_ALLOWLIST:

```typescript
MA: new Set(['cd', 'sldu', 'sldl', 'place']),
```

All candidate and officials data requires manual SQL migrations. The MA Secretary of State (sec.state.ma.us), Cambridge election commission, and malegislature.gov are HTML-only with no CSV exports or documented APIs.

**Confirmed officials:**
- City Council (9): McGovern (Mayor), Siddiqui, Azeem (Vice Mayor), Sobrinho-Wheeler, Simmons, Nolan, Zusy, Al-Zubi, Flaherty
- School Committee (6 elected): Weinstein (Chair), Dube (Vice Chair), de Paula Santos, Harding Jr., Hudson, Jaikumar
- State House (3 confirmed districts): 24th Middlesex (Rogers), 25th Middlesex (Decker), 26th Middlesex (Connolly)
- US Congress: MA-05 (Clark) confirmed; MA-07 (Pressley) vs. MA-08 (Lynch) disputed — see Conflict Resolution below
- US Senate: Warren, Markey

### From FEATURES.md

Cambridge government uses Council-Manager form — a first for this project. The STV election system means 18-25 candidates per 9-seat council race and 12-20 candidates per 6-seat school committee race. Ballotpedia does not reliably cover Cambridge (population ~118K, below their threshold). The MMA Data Hub (mma.org) is the fastest cold-start source for any MA city form of government and key officials.

**Table stakes** (Cambridge must have these to be usable):
- Cambridge governments, chambers, offices rows
- All 9 incumbents with headshots
- All 6 school committee members with headshots
- City boundary geofence (place layer, GEOID 2511000)
- State legislative district geofences (2 confirmed senate + 3 confirmed house districts)
- Federal district geofences (2 congressional districts)
- State and federal politicians linked to Cambridge districts

**Differentiators** (valuable but not v5.0 MVP):
- STV multi-round results display (round-by-round data exists as HTML; no prior UI art in codebase)
- Cross-office politician linking (Azeem is simultaneously Councillor, Vice Mayor, and 2026 state senate candidate)
- Charter change timeline display (2025 charter approved 73%)
- Compass stances for Cambridge council members (housing/zoning is the dominant local issue)

**Anti-features** (do NOT build in v5.0):
- Mayor modeled as a separate elected office
- All 6 house district geofences in phase 1 (ship senate + federal first)
- STV round-by-round results visualization (high complexity, no precedent in codebase)
- Real-time 2027 candidate discovery (filing not open until summer 2027)

### From ARCHITECTURE.md

All patterns needed for Cambridge already exist in the codebase. Key reuse:
- Migration 087: government row template
- Migration 088: city chambers + offices template
- Migrations 091-096: politician seed template
- load-state-tiger-boundaries.ts: handles MA with one-line change
- Landing.jsx COVERAGE_AREAS: Cambridge uses browseGovernmentList pattern with geo_id 2511000

**New patterns required:**
- At-large seat numbering: 9 at-large council seats with no ward numbers. Use 9 individual office rows titled Councillor (same title, no Place numbers — unlike TX cities).
- Mayor as derived role: One politician row (McGovern) linked to both a Councillor office and a Mayor office (is_appointed_position = true). Schema supports dual-office linkage.
- MA government name: Use Commonwealth of Massachusetts (not State of Massachusetts).
- County layer: Skip the county layer for MA government purposes. Middlesex County government was largely abolished in 1997. Load the county G4020 boundary only for congressional intersection support via browseCountyGeoId: 25017.

Critical path: A (TIGER boundaries) to B (government DB foundation) to C (Cambridge city structure) to D (incumbents + headshots) to E (geofences + state/federal politicians) to F (election data) to G (2026 state races) to H (compass stances) to I (playbook documentation). Phases A and B have no blocking dependencies and can start immediately.

### From PITFALLS.md

Top 5 most dangerous pitfalls:

1. **Mayor = elected executive** — Cambridge Mayor is a council-internal title, not a separately elected role. Wrong modeling misleads voters about the city actual power structure. Prevention: LOCAL (not LOCAL_EXEC) district type; is_appointed_position = true on Mayor office row; no election race row for Mayor.

2. **19-37 candidates in one election view** — Cambridge STV produces ~19 council candidates and ~18 school committee candidates. The current ElectionsView.jsx has no pagination or hard limit on candidate cards per race. Prevention: UI load-test at 19+ cards before shipping Cambridge election data; add show-all toggle if needed.

3. **2025 charter change — Mayor off School Committee** — Pre-2025 Plan E gave Mayor automatic School Committee membership. The November 2025 charter removes this. Prevention: seed School Committee as 6 elected members; do not add Mayor as automatic member.

4. **Cambridge election is 2027, not 2026** — MA requires municipal elections in odd-numbered years. Last election was November 2025; next is November 2027. Prevention: seed election row with 2027 date; mark discovery jurisdiction inactive until 2027 filing opens.

5. **Multi-district geofence complexity** — Cambridge spans 3+ state house districts and at least 2 senate districts. Use MassGIS 2021 shapefiles as verification source; confirm each district via FindMyLegislator before seeding geofences.

---

## Conflict Resolutions

### 1. MA Boundary Source: TIGER 2024 vs. MassGIS 2021

**Recommendation: Use TIGER 2024 as primary source (consistent with CA/TX/IN/UT), with MassGIS 2021 as the required verification and fallback for state legislative districts.**

The existing load-state-tiger-boundaries.ts is built around TIGER URLs and formats. TIGER 2024 reflects boundaries MA submitted to Census by May 2024. MassGIS 2021 is the canonical effective source for post-redistricting MA district boundaries (enacted 2021, effective 2022 elections — the label year does not mean outdated). Use TIGER 2024 first. After loading, run FindMyLegislator verification on 4+ Cambridge addresses across different wards. If any address returns the wrong state representative, fall back to MassGIS shapefiles for that layer. Document this verification step as required in the phase plan.

### 2. MA House District Count for Cambridge

**Working assumption: 3 primary districts (24th, 25th, 26th Middlesex) with up to 3 additional partial-coverage districts — ship with 3 confirmed, verify edge cases before adding more.**

The Stack researcher confirmed 3 districts via malegislature.gov (Rogers 24th, Decker 25th, Connolly 26th). The Features researcher (~6 districts) and Pitfalls researcher (29th Middlesex) reflect that Cambridge 11 wards have edge precincts crossing into additional districts at city boundaries. Ship phase 1 with the 3 confirmed districts. Before adding more, download the Cambridge Election Commission legislative district PDF and verify which wards/precincts fall in additional districts.

### 3. MA Senate District Count for Cambridge

**Working assumption: 2 confirmed + 1 probable = plan for 3, verify the third before migrating.**

Features says 2 (Middlesex and Suffolk with DiDomenico; Second Middlesex with Jehlen/2026 successor). Stack found Cambridge GIS explicitly confirms 3 senate districts cover the city. The third district identity is unverified and requires running FindMyLegislator with a Cambridge Ward 1-7 address. This is a required pre-migration research step — do not assume 2 is the final count.

### 4. Congressional Districts: MA-05/MA-08 vs. MA-05/MA-07

**Verification required before seeding.** Stack researcher says MA-05 (Clark) and MA-08 (Lynch). Features researcher says MA-07 (Pressley) for the majority of Cambridge and MA-05 (Clark) for a portion. Cambridge GIS confirms 2 congressional districts cover the city. Run FindMyLegislator or check the Cambridge GIS congressional districts page to confirm the exact split before seeding congressional district politicians. Features researcher MA-07 (Pressley) is more likely correct for central Cambridge.

### 5. Mayor Office — Critical Schema Decision

Both Features and Pitfalls researchers agree: Mayor is NOT a separately elected office.

Correct approach:
- One offices row for Mayor with is_appointed_position = true
- politician_id on that row points to Marc C. McGovern politician record (also linked to his Councillor office row)
- No election race row for Cambridge Mayor
- Profile page should include a description: Cambridge Mayor is selected from among the 9 City Councillors — the City Manager is the chief executive
- Discovery agent allowlist for Cambridge must exclude any source that lists Mayor as a separate race

---

## Feature Table

| Feature | Category | Complexity | Ship in v5.0? |
|---------|----------|------------|---------------|
| Cambridge government + 2 chambers | Table stakes | Low | Yes — Phase 1 |
| 9 Councillor offices (at-large) | Table stakes | Low | Yes — Phase 1 |
| 6 School Committee offices | Table stakes | Low | Yes — Phase 1 |
| Mayor office (derived, not elected) | Table stakes | Low | Yes — Phase 1 with correct schema |
| City Manager (appointed) | Table stakes | Low | Yes — Phase 1 |
| 9 council incumbents + headshots | Table stakes | Medium | Yes — Phase 2 |
| 6 school committee incumbents + headshots | Table stakes | Medium | Yes — Phase 2 |
| Cambridge city boundary geofence | Table stakes | Medium | Yes — Phase 3 |
| 2 confirmed senate district geofences | Table stakes | Medium | Yes — Phase 3 |
| 3 confirmed house district geofences | Table stakes | Medium | Yes — Phase 3 |
| 2 congressional district geofences | Table stakes | Medium | Yes — Phase 3 |
| State + federal politicians linked | Table stakes | Medium | Yes — Phase 3 |
| Landing.jsx Cambridge entry | Table stakes | Low | Yes — Phase 3 |
| 2025 election results as historical data | Table stakes | Low | Yes — Phase 4 |
| 2027 election placeholder race | Table stakes | Low | Yes — Phase 4 |
| 2026 MA state/federal races (Azeem senate bid) | Table stakes | Medium | Yes — Phase 5 |
| Compass stances for Cambridge councillors | Differentiator | High | Yes — Phase 6 |
| Cross-office Azeem linking (council + senate candidate) | Differentiator | Low | Yes — Phase 5 |
| LOCATION-ONBOARDING.md playbook | Playbook artifact | Medium | Yes — Phase 7 |
| STV round-by-round results display | Differentiator | High | No — post-v5.0 |
| 6 house edge-precinct district geofences | Nice to have | High | No — follow-on |
| 2027 candidate discovery (active) | Future | Low setup | No — activate summer 2027 |

---

## Recommended Stack

No new packages. No new ingest pipelines. Pure SQL migration + existing scripts.

| Component | Tool/Pattern | Notes |
|-----------|-------------|-------|
| MA boundary ingestion | load-state-tiger-boundaries.ts + one-line MA allowlist | Reuse existing; TIGER 2024 primary |
| Fallback boundary source | MassGIS 2021 shapefiles (mass.gov) | Use only if FindMyLegislator verification fails |
| Government/officials seeding | SQL migration scripts (pattern from migrations 087-110) | Manual data entry; no API available |
| State legislator discovery | malegislature.gov profile pages (HTML) | Use FindMyLegislator to verify districts first |
| Candidate data source | cambridgema.gov election commission (HTML/PDF) | No CSV/API available |
| Compass stances | Same approach as TX Phase 30 | Public statements, voting records, local news |
| Headshots | cambridgema.gov/Departments/citycouncil/members (primary); vote.cambridgecivic.com (backup) | 600x750 Lanczos per project standard |
| Campaign finance (future, not v5.0) | MA OCPF (ocpf.us) | Different format from LA Ethics Commission; research separately before pursuing |
| Landing.jsx | browseGovernmentList: [2511000] pattern | Same as Collin County TX |
| Discovery pipeline | discovery_jurisdictions row marked inactive until 2027 filing | Do not activate until summer 2027 |

---

## Architecture Approach

Cambridge slots cleanly into the existing multi-jurisdiction architecture. The address lookup pipeline (getRepresentativesByAddress), PostGIS geofence intersection, and essentialsService.ts statewide query all work automatically once geofences and district rows are loaded. Code changes required: (1) one-line MA allowlist in load-state-tiger-boundaries.ts, (2) Landing.jsx COVERAGE_AREAS entry, (3) new SQL migration files.

**Suggested phase structure:**

Phase A — MA TIGER boundary load (no blocking dependencies, start immediately)
  - One-line code change to STATE_LAYER_ALLOWLIST
  - Run: --state MA --fips 25 --layers cd,sldu,sldl,place

Phase B — MA + Cambridge government DB foundation (no blocking dependencies)
  - Commonwealth of Massachusetts government row
  - Middlesex County government row (for congressional intersection)
  - City of Cambridge government row (geo_id = 2511000)
  - MA state legislative chambers (Senate, House)

Phase C — Cambridge city structure (depends on Phase B)
  - City Council chamber + 9 Councillor office rows
  - School Committee chamber + 6 member office rows
  - Mayor office row (is_appointed_position = true)
  - City Manager office row (is_appointed_position = true)

Phase D — Cambridge incumbents + headshots (depends on Phase C)
  - 9 City Councillors with headshots (600x750, Lanczos)
  - 6 School Committee members with headshots
  - City Manager (appointed)

Phase E — Geofences + state/federal politicians (depends on Phases A and B)
  - Cambridge place geofence verified
  - 2 senate + 3 house + 2 congressional geofences loaded
  - Statewide officials (Warren, Markey, Governor, AG, Secretary of State)
  - Congressional, senate, house politicians linked to Cambridge districts
  - Landing.jsx COVERAGE_AREAS entry added

Phase F — 2025 election historical data + 2027 placeholder (depends on Phase D)
  - 2025 council + school committee races as completed
  - All 20 council candidates + 18 school committee candidates as race_candidate rows
  - 2027 placeholder election row; discovery jurisdiction marked inactive

Phase G — 2026 MA state/federal races (depends on Phase E)
  - Second Middlesex Senate primary (Azeem vs. 4 others; Sept 1, 2026)
  - MA-05 House primary
  - Azeem linked as candidate in senate race + existing council record

Phase H — Compass stances (depends on Phase D)
  - Research Cambridge councillors on housing/zoning, transit, development
  - Apply via existing apply-*.ts pattern; run one at a time per memory guidance

Phase I — LOCATION-ONBOARDING.md playbook (depends on all phases complete)
  - Codify Cambridge learnings into reusable checklist
  - Phase templates in .planning/templates/

Critical path: A to B to C to D to E (parallel: F, G, H) to I

---

## Top Pitfalls with Prevention

| Pitfall | Severity | Prevention |
|---------|----------|------------|
| Mayor seeded as LOCAL_EXEC elected office | Critical | is_appointed_position = true; no race row for Mayor; LOCAL type only |
| Mayor as automatic School Committee member | Critical | 2025 charter removed this — do NOT add School Committee office for Mayor |
| Seeding 2026 Cambridge election date | Critical | Next city election is November 2027; mark discovery inactive until 2027 filing |
| Cambridge geo_id = 25017 (county) | High | City geo_id = 2511000 (7-digit place code); 25017 is Middlesex County |
| 19+ candidates breaking ElectionsView | High | Load-test UI at 19 cards before shipping election data; add show-all toggle |
| Wrong boundary year for MA districts | High | Use MassGIS 2021 as verification; confirm with FindMyLegislator after TIGER load |
| Congressional district uncertainty (MA-05/07/08) | High | Run FindMyLegislator or check Cambridge GIS before seeding congressional politicians |
| Third senate district unverified | Medium | Required pre-migration: test Cambridge Ward 1-7 address at FindMyLegislator |
| Councillor vs. Councilor spelling | Low | Hard-code Councillor (double-l); no auto-normalization |
| Discovery cron firing on 2027 election | Low | Mark Cambridge discovery_jurisdictions row inactive until summer 2027 |
| Email addresses guessed from patterns | Low | Pull from cambridgema.gov/Departments/citycouncil/members at seeding time; NULL if unverifiable |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | TIGER 2024 URLs confirmed fetchable; FIPS_TO_STATE already has MA; MTFCC codes verified against codebase; zero new packages needed |
| Features | HIGH | Government structure verified from official cambridge.gov + MMA Data Hub + Harvard Crimson; STV mechanics well-documented |
| Architecture | HIGH | Based on direct codebase inspection of migrations 087-110, essentialsService.ts, Landing.jsx; all patterns exist |
| Pitfalls | HIGH | 10 of 13 pitfalls confirmed HIGH confidence; 3 MEDIUM (UI performance at scale, Middlesex County G4020 decision, Mayor dual-office pattern) |

**Overall confidence: HIGH**

---

## Gaps to Address in Planning

| Gap | How to Handle |
|-----|---------------|
| Third MA senate district (Cambridge Ward 1-7) | Required pre-migration step: run FindMyLegislator; identify senator name and district before seeding |
| Exact ward/precinct to house district mapping beyond 3 confirmed | Download Cambridge Election Commission legislative districts PDF; confirm edge districts before adding geofences |
| Congressional district split (MA-05/07/08) | Verify at Cambridge GIS congressional districts page before seeding congressional politicians |
| TIGER 2024 vs. MassGIS accuracy for MA state districts | Load TIGER first; run FindMyLegislator on 4+ Cambridge addresses; fall back to MassGIS if mismatch |
| election_method enum value | Check chambers table constraint before migration; add stv_proportional if absent |
| Cambridge GEOID 2511000 format confirmation | Verify against TIGER 2024 place shapefile before first migration |
| Mayor ex officio School Committee status post-2025 charter | Confirm: is Mayor fully removed from School Committee, or still ex officio in some capacity? |
| Migration next number | Run SELECT max(version) FROM supabase_migrations.schema_migrations before writing any migration |
| UI performance at 19+ candidate cards | Load-test ElectionsView before shipping election data; add pagination/toggle if needed |
| Middlesex County G4020 boundary decision | Decide whether to load for congressional intersection support; recommend loading for completeness |

---

## Sources

### Primary (HIGH confidence)
- Cambridge City Council members: https://www.cambridgema.gov/Departments/citycouncil/members
- Cambridge School Committee: https://www.cpsd.us/school-committee/school-committee-members-subcommittees
- Cambridge Election Commission: https://www.cambridgema.gov/Departments/electioncommission
- Cambridge 2025 official election results: https://www.cambridgema.gov/Departments/electioncommission/news/2025/11/2025municipalelectionofficialresultsnovember14thupdate
- Cambridge Plan E Charter: https://www.cambridgema.gov/publications/documents/p/planecharter
- Cambridge GIS senate districts: https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_StateSenateDistricts
- Cambridge GIS congressional districts: https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_CongressionalDistricts
- MassGIS House Districts (2021, current effective): https://www.mass.gov/info-details/massgis-data-massachusetts-house-legislative-districts-2021
- MA legislature profile pages: https://malegislature.gov (Rogers 24th, Decker 25th, Connolly 26th)
- TIGER SLDU MA confirmed: https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_25_sldu.zip
- TIGER SLDL MA confirmed: https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_25_sldl.zip
- MA Secretary of State elections: https://www.sec.state.ma.us/divisions/elections/
- MMA Cambridge profile: https://www.mma.org/community/cambridge/
- 2025 charter ballot result: https://www.thecrimson.com/article/2025/11/5/cambridge-updates-charter/
- Burhan Azeem senate bid: https://www.thecrimson.com/article/2026/2/18/azeem-state-senate/

### Secondary (MEDIUM confidence)
- Cambridge GEOID 2511000: https://datacommons.org/place/geoId/2511000
- Middlesex County FIPS 25017: https://www.geocod.io/geoids/massachusetts/middlesex-county-25017
- Additional Cambridge house districts (Moran, Owens, Ryan): MMA Data Hub listing — exact ward/precinct mapping unverified

### Tertiary (LOW confidence / requires verification)
- Third MA senate district covering Cambridge Ward 1-7: confirmed to exist by Cambridge GIS; senator identity requires FindMyLegislator address test
- Azeem council status if he wins senate seat: not yet determined; depends on September 1, 2026 primary result

---

*Research completed: 2026-05-15*
*Ready for roadmap: yes*