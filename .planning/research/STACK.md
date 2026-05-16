# Technology Stack — v5.0 Location Onboarding: Cambridge, MA

**Project:** Essentials (empowered.vote) — Add Cambridge, MA coverage
**Researched:** 2026-05-15
**Milestone:** v5.0 Location Onboarding Playbook (subsequent milestone)

---

## Executive Summary

Adding Massachusetts (FIPS 25) and Cambridge, MA requires zero new npm packages. The
`load-state-tiger-boundaries.ts` generalized loader already supports sldu/sldl/place/county/cd
and the FIPS_TO_STATE map already contains entry `'25': 'ma'`. The only code change is a
one-line addition to `STATE_LAYER_ALLOWLIST`. All boundary download URLs follow the exact
same `tl_{vintage}_{fips}_{layer}.zip` pattern used for TX, CA, IN, UT.

Cambridge officials data comes from three sources, all requiring manual SQL migration (no
public APIs or bulk downloads exist): cambridge.ma.gov for council/school committee rosters,
sec.state.ma.us for state legislative candidate lists (HTML-only, no CSV/Excel export), and
malegislature.gov for confirming district-to-representative mapping.

---

## 1. TIGER Boundary Files for Massachusetts

### MTFCC Codes (CONFIRMED — matches TX/CA/IN pattern exactly)

| Layer | MTFCC | District Type | Field for District # | Skip Codes |
|-------|-------|--------------|----------------------|------------|
| sldu  | G5210 | STATE_UPPER  | SLDUST               | ZZZ, 000   |
| sldl  | G5220 | STATE_LOWER  | SLDLST               | ZZZ, 000   |
| place | G4110 | LOCAL        | (uses GEOID)         | —          |
| county| G4020 | COUNTY       | COUNTYFP             | —          |
| cd    | G5200 | NATIONAL_LOWER | CD119FP             | ZZ, ZZZ, 00, 000 |

G5210 = State Senate (upper chamber). G5220 = State House (lower chamber). Same as TX.
Confirmed by proximity1.com SLDL metadata and the existing LAYER_DISPATCH in load-state-tiger-boundaries.ts.

### Download URLs (2024 vintage, FIPS 25)

```
MA State Senate (SLDU):
https://www2.census.gov/geo/tiger/TIGER2024/SLDU/tl_2024_25_sldu.zip
— 818 KB, confirmed fetchable (directory listing returned this file)

MA State House (SLDL):
https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_25_sldl.zip
— ~1.8 MB, confirmed fetchable (binary shapefile verified in-session)

MA Place boundaries (Cambridge city):
https://www2.census.gov/geo/tiger/TIGER2024/PLACE/tl_2024_25_place.zip

MA County (Middlesex):
https://www2.census.gov/geo/tiger/TIGER2024/COUNTY/tl_2024_us_county.zip
— national file, filtered by STATEFP=25 at runtime

MA Congressional Districts (119th):
https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_25_cd119.zip
```

URL pattern: `https://www2.census.gov/geo/tiger/TIGER{vintage}/{LAYER}/tl_{vintage}_{fips}_{layer}.zip`
County is the exception: always `tl_{vintage}_us_county.zip` (national file).

### Loader Code Change Required

`load-state-tiger-boundaries.ts` line 34–39: add MA to STATE_LAYER_ALLOWLIST.

```typescript
MA: new Set(['cd', 'sldu', 'sldl', 'place', 'county']),
```

No cousub layer needed for MA. Cambridge is an incorporated city (place-level); cousub is
used for Indiana because IN uses civil townships as the sub-county unit. Massachusetts cities
and towns are place-level in TIGER; the `place` layer suffices.

FIPS_TO_STATE already has `'25': 'ma'` at line 74. No change needed there.

---

## 2. Massachusetts FIPS and GEOIDs

| Entity | FIPS / GEOID | Notes |
|--------|-------------|-------|
| Massachusetts (state) | 25 | Standard 2-digit state FIPS |
| Middlesex County | 25017 | Full GEOID = state + county |
| Cambridge city (place) | 2511000 | STATEFP(25) + PLACEFP(11000) |

Cambridge's place GEOID `2511000` is what the `place` layer loader writes as `geo_id`.
Confirmed via census.gov QuickFacts and Geocodio's GEOID lookup.

---

## 3. Massachusetts Secretary of State — Candidate and Election Data

**URL:** https://www.sec.state.ma.us/divisions/elections/

**Candidate lists:** https://www.sec.state.ma.us/divisions/elections/research-and-statistics/candidate-list-archive.htm

**What is published:**
- Candidate lists by election year, 2002–2024
- Fields: candidate name, street address, city, party affiliation, office sought, district
- Organized hierarchically: statewide offices → US Senate/House → MA Senate → MA House → County offices
- Format: HTML table pages only. No CSV, Excel, or JSON export. No bulk download API.
- 2024 state election: https://www.sec.state.ma.us/divisions/elections/research-and-statistics/2024_state_election_candidates.htm

**Election results:** https://electionstats.state.ma.us/
- Contains 29,574 elections, 11,011 candidates, data from 1970–2026
- Web-only search interface. No bulk export, no API documented.
- Searchable by year, office, district, candidate name.

**Recommendation:** Use sec.state.ma.us HTML pages to manually identify state legislative
candidates by district for Cambridge's three House and three Senate districts.
Seed politicians via SQL migration (same pattern as TX/CA/IN). No automation possible
without scraping.

---

## 4. Cambridge Official Sources

### City Council

**Official roster:** https://www.cambridgema.gov/Departments/citycouncil/members

- 9 at-large members (no wards or districts)
- Current members (elected November 2025, seated January 2026):
  1. Marc C. McGovern (Mayor) — mmcgovern@cambridgema.gov
  2. Sumbul Siddiqui — ssiddiqui@cambridgema.gov
  3. Burhan Azeem — bazeem@cambridgema.gov
  4. Jivan Sobrinho-Wheeler — jsobrinhowheeler@cambridgema.gov
  5. E. Denise Simmons — dsimmons@cambridgema.gov
  6. Patricia M. Nolan — pnolan@cambridgema.gov
  7. Catherine Zusy — czusy@cambridgema.gov
  8. Ayah A. Al-Zubi — aal-zubi@cambridgema.gov
  9. Timothy R. Flaherty — tflaherty@cambridgema.gov
- 2-year terms; next election November 2027
- Elected via STV (Single Transferable Vote proportional representation) — at-large, 9 seats
- Headshots present on the roster page

### School Committee

**Official roster:** https://www.cpsd.us/school-committee/school-committee-members-subcommittees

- 7 members: 6 elected at-large via STV (same election as City Council) + Mayor ex officio
- Current members (elected November 2025):
  1. David Weinstein (Chair) — dweinstein@cpsd.us
  2. Caitlin Dube (Vice Chair) — cadube@cpsd.us
  3. Luisa de Paula Santos — ldepaulasantos@cpsd.us
  4. Richard Harding, Jr. — harding4cambridge@gmail.com
  5. Elizabeth Hudson — ehudson@cpsd.us
  6. Arjun Jaikumar — ajaikumar@cpsd.us
  7. Mayor Sumbul Siddiqui (ex officio) — ssiddiqui@cambridgema.gov
- 2-year terms aligned with City Council

### Election Commission

**URL:** https://www.cambridgema.gov/Departments/electioncommission

**Election results:** https://www.cambridgema.gov/Departments/electioncommission/electionresults
- Results published as web pages and PDFs (2001–present)
- STV count-by-count detail: HTML pages (e.g. https://www.cambridgema.gov/Election2025/Council%20Round2.htm)
- No machine-readable formats (CSV, XML, JSON). PDF only for official results.
- Contact: elections@cambridgema.gov

**Municipal elections page:** https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections
- Specimen ballots (PDF), voter guides (8 languages), election calendar

---

## 5. STV / RCV Election Data — Machine-Readability Assessment

Cambridge uses STV (Single Transferable Vote) for both City Council (9 seats) and School
Committee (6 elected seats). This has been in use since 1941.

**Is candidate data machine-readable?** No.
- Candidate lists are published as PDF specimen ballots on the city's election commission page
- No API, no CSV, no structured download
- The STV tabulation software is ChoicePlus Pro (Voting Solutions Inc.)
- Round-by-round results are published as HTML pages on the city website after each election

**Implication for seeding:** Cambridge candidates must be seeded manually from the HTML
roster pages. This is identical to the approach used for all other cities in the app.
The STV system affects how we describe the election to users (all 9 council seats filled
from one at-large citywide ballot) but does not affect data ingestion mechanics.

---

## 6. Massachusetts Legislative Districts Covering Cambridge

### State House (3 districts fully or partially in Cambridge)

| District | Representative | Party |
|----------|---------------|-------|
| 24th Middlesex | David M. Rogers | D |
| 25th Middlesex | Marjorie C. Decker | D |
| 26th Middlesex | Mike Connolly | D |

Source: malegislature.gov profile pages, confirmed via 2024 election results coverage.

### State Senate (3 districts partially covering Cambridge)

| District | Senator | Party | Notes |
|----------|---------|-------|-------|
| Middlesex and Suffolk | Sal DiDomenico | D | Includes parts of Cambridge + Charlestown, Chelsea, Everett |
| Suffolk and Middlesex | William Brownsberger | D | Includes Cambridge Ward 8 Precinct 2, Ward 9; also Watertown, Belmont |
| Third Middlesex (or similar) | TBD | — | Cambridge GIS confirms 3 senate districts; third requires address lookup at malegislature.gov/Search/FindMyLegislator |

Cambridge straddles 3 senate districts. The Cambridge GIS data dictionary
(https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_StateSenateDistricts)
confirms exactly 3 elective senate districts cover the city. The third must be verified
via the MA legislature's Find My Legislator tool using a Cambridge address in Ward 1–7
(not covered by the two named districts above).

### US Congressional (2 districts in Cambridge)

| District | Representative | Party |
|----------|---------------|-------|
| MA-05 | Katherine Clark | D |
| MA-08 | Stephen Lynch | D |

Cambridge is split between MA-05 and MA-08 per the Cambridge GIS data dictionary
(https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_CongressionalDistricts).

### US Senate (statewide — both cover Cambridge)

| Senator | Party |
|---------|-------|
| Elizabeth Warren | D |
| Ed Markey | D |

---

## 7. New npm Packages Required

None. The existing stack handles everything:

| Capability | Package | Already Present |
|-----------|---------|-----------------|
| Shapefile parsing | `shapefile` | Yes (used in load-state-tiger-boundaries.ts) |
| ZIP extraction | `adm-zip` | Yes |
| HTTP download | Node `https` built-in | Yes |
| PostGIS upsert | `pg` + SQL | Yes |
| GeoJSON geometry | PostGIS ST_GeomFromGeoJSON | Yes |

No new tools for MA-specific data ingestion. All data sources require manual migration
scripts (SQL INSERT statements), not new ingest pipelines.

---

## 8. MassGIS as an Alternative Boundary Source

MassGIS (https://www.mass.gov/info-details/massgis-data-massachusetts-house-legislative-districts-2021)
publishes its own state legislative district shapefiles updated January 2025 for post-November-2024
member changes. This is a valid alternative if TIGER 2024 boundaries don't reflect post-redistricting
changes. However:

- The existing loader is built around TIGER URLs and formats
- TIGER 2024 SLDU/SLDL files reflect boundaries submitted by MA to Census Bureau by May 31, 2024
- MassGIS files would require testing for format compatibility (projection, field names)

**Recommendation:** Use TIGER 2024 files first (consistent with existing CA/TX/IN/UT pattern).
Fall back to MassGIS only if TIGER boundaries are outdated post-redistricting.

---

## 9. Next Migration Number

Per project context: next migration is ~122.

---

## Sources

- TIGER SLDU directory listing (live fetch): https://www2.census.gov/geo/tiger/TIGER2024/SLDU/
- TIGER SLDL file confirmed (live fetch): https://www2.census.gov/geo/tiger/TIGER2024/SLDL/tl_2024_25_sldl.zip
- SLDL attribute reference: https://proximityone.com/dataresources/guide/tl_year_st_sldl.htm
- MA candidate list archive: https://www.sec.state.ma.us/divisions/elections/research-and-statistics/candidate-list-archive.htm
- MA election stats DB: https://electionstats.state.ma.us/
- Cambridge city council roster: https://www.cambridgema.gov/Departments/citycouncil/members
- Cambridge school committee: https://www.cpsd.us/school-committee/school-committee-members-subcommittees
- Cambridge election results: https://www.cambridgema.gov/Departments/electioncommission/electionresults
- Cambridge municipal elections: https://www.cambridgema.gov/departments/electioncommission/cambridgemunicipalelections
- Cambridge 2025 official results: https://www.cambridgema.gov/Departments/electioncommission/news/2025/11/2025municipalelectionofficialresultsnovember14thupdate
- Cambridge GIS senate districts: https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_StateSenateDistricts
- Cambridge GIS congressional districts: https://www.cambridgema.gov/GIS/gisdatadictionary/Elections/ELECTIONS_CongressionalDistricts
- Cambridge legislative districts PDF: https://www.cambridgema.gov/-/media/Files/electioncommission/mapsandpollinglocations/legislativedistricts.pdf
- Middlesex County FIPS 25017: https://www.geocod.io/geoids/massachusetts/middlesex-county-25017
- Cambridge GEOID 2511000: https://datacommons.org/place/geoId/2511000
- MassGIS House districts: https://www.mass.gov/info-details/massgis-data-massachusetts-house-legislative-districts-2021
- MA House 24th Middlesex: https://malegislature.gov/Legislators/Profile/DMR1/District
- MA House 25th Middlesex: https://malegislature.gov/Legislators/Profile/MCD1/District
- MA House 26th Middlesex: https://malegislature.gov/Legislators/Profile/M_C1/District
- Sal DiDomenico (Middlesex and Suffolk Senate): https://malegislature.gov/Legislators/Profile/SND0/Biography
- Cambridge STV description: https://opavote.com/methods/cambridge-stv-rules
- ChoicePlus Pro STV software: https://www.votingsolutions.com/Cambridge.htm
