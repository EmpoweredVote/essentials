# Requirements: Essentials — Empowered Vote v3.0

**Defined:** 2026-04-30
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v3.0 Requirements

### GEO — Geographic Foundation

- [x] **GEO-01**: Texas state government row exists in `essentials.governments` with correct FIPS geo_id
- [x] **GEO-02**: Collin County government row exists in `essentials.governments` with FIPS geo_id `48085`
- [x] **GEO-03**: All 24 target cities have rows in `essentials.governments` with their Census place FIPS codes
- [x] **GEO-04**: Each city government has at least one chamber (City Council) in `essentials.chambers` and seat-level offices (Mayor + each Council seat) in `essentials.offices`

### OFF — Incumbent Officials

- [x] **OFF-01**: Plano incumbent mayor and all council members are in `essentials.politicians`, linked to their office rows, with email/URL contact info where available
- [x] **OFF-02**: McKinney incumbent mayor and council members are in `essentials.politicians`
- [x] **OFF-03**: Allen incumbent mayor and council members are in `essentials.politicians`
- [x] **OFF-04**: Frisco incumbent mayor and council members are in `essentials.politicians`
- [x] **OFF-05**: Murphy incumbent officials are in `essentials.politicians`
- [x] **OFF-06**: Celina incumbent officials are in `essentials.politicians`
- [x] **OFF-07**: Prosper incumbent officials are in `essentials.politicians`
- [x] **OFF-08**: Richardson incumbent officials are in `essentials.politicians`
- [ ] **OFF-09**: Tier 3 city incumbents (Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville) are in `essentials.politicians` where findable online
- [ ] **OFF-10**: Tier 4 city incumbents (Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge, Copeville) are in `essentials.politicians` where findable (sparse expected)

### DISC — Discovery Jurisdiction Setup

- [ ] **DISC-01**: All 24 cities are added to `essentials.discovery_jurisdictions` with `collincountyvotes.gov` as `source_url` and correct Census `jurisdiction_geoid`
- [ ] **DISC-02**: Each row has `allowed_domains` set to `{collincountyvotes.gov, <city-official-domain>}`
- [ ] **DISC-03**: A test discovery run for Plano produces valid staged candidates from official source

### HEAD — Headshots

- [ ] **HEAD-01**: Headshots found, resized to 600×750 Lanczos q90, and uploaded for all Tier 1 politicians (Plano, McKinney, Allen, Frisco)
- [ ] **HEAD-02**: Headshots found and uploaded for Tier 2 politicians (Murphy, Celina, Prosper, Richardson) where publicly available
- [ ] **HEAD-03**: Headshots for Tier 3-4 politicians where findable (best-effort)

### COMP — Compass Stances

- [ ] **COMP-01**: Stance research completed and ingested for Plano council members where public record exists
- [ ] **COMP-02**: Stance research completed and ingested for McKinney council members
- [ ] **COMP-03**: Stance research completed and ingested for Allen council members
- [ ] **COMP-04**: Stance research attempted for Frisco, Murphy, Celina, Richardson — ingested where viable, documented as sparse where not

## v3.1 Requirements

### AUDIT — Pre-flight Checks

- [ ] **AUDIT-01**: Scope/level mechanism in `inform.compass_stances` identified — confirm if a scope column exists and how the compass filters questions by race type
- [ ] **AUDIT-02**: Politician answer count for "Criminalization of Homelessness" queried from `inform.politician_answers` — retirement decision documented

### TOPIC — New LOCAL Compass Topics

- [ ] **TOPIC-01**: Residential Zoning topic added to `inform.compass_stances` with 5 stances (question, description, text, supporting_points, example_perspectives) and LOCAL scope
- [ ] **TOPIC-02**: Growth and Development Pace topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-03**: Public Safety Approach topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-04**: Homelessness Response topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-05**: Economic Development Incentives topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-06**: Transportation Priorities topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-07**: Environmental Protection vs. Development (local) topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-08**: Rent Regulation topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-09**: Local Immigration Enforcement topic added with 5 stances and LOCAL scope
- [ ] **TOPIC-10**: City Sanitation and Cleanliness topic added with 5 stances and LOCAL scope

### COMM — Companion Focused Communities

- [ ] **COMM-01**: Residential Zoning community added to `connect.communities` with authored description and verified `topic_id` link
- [ ] **COMM-02**: Growth and Development Pace community added
- [ ] **COMM-03**: Public Safety Approach community added
- [ ] **COMM-04**: Homelessness Response community added
- [ ] **COMM-05**: Economic Development Incentives community added
- [ ] **COMM-06**: Transportation Priorities community added
- [ ] **COMM-07**: Environmental Protection vs. Development community added
- [ ] **COMM-08**: Rent Regulation community added
- [ ] **COMM-09**: Local Immigration Enforcement community added
- [ ] **COMM-10**: City Sanitation and Cleanliness community added

### SCOPE — Scope Tagging

- [ ] **SCOPE-01**: All 10 new topics carry LOCAL scope tag in `inform.compass_stances`
- [ ] **SCOPE-02**: Existing LOCAL-applicable topics audited — scope tags confirmed or added where missing

### RETIRE — Conditional Retirement (gated on AUDIT-02)

- [ ] **RETIRE-01**: Retirement decision for "Criminalization of Homelessness" documented based on AUDIT-02 findings
- [ ] **RETIRE-02**: If retiring — topic record updated in `inform.compass_stances`; companion community archived in `connect.communities` with `slug_history` entry preserved

---

## Future Requirements

### Geofences (v3.1)

- **GEO-F01**: PostGIS geofence boundaries loaded for all 24 Collin County cities from Census TIGER shapefiles — enables address-based "who represents me" lookup for TX
- **GEO-F02**: Collin County geofence loaded so county-level offices appear in address lookups

### Campaign Finance (v3.x)

- **FIN-F01**: Texas Ethics Commission (TEC) campaign finance data integrated for Collin County politicians
- **FIN-F02**: TEC donor/industry breakdown displayed on TX politician profiles

### Tier 3-4 Compass (v3.1)

- **COMP-F01**: Stance research for Tier 3-4 cities once digital footprint assessment confirms viable sources

## Out of Scope

| Feature | Reason |
|---------|--------|
| PostGIS geofence boundaries | Significant GIS work; needed for address-based rep lookup but not for officials DB itself — deferred to v3.1 |
| TEC campaign finance integration | Different system from FEC; no integration built yet |
| School district / MUD / special district boards | Scope limited to city councils and county government only |
| Justice of the Peace, constable, county judge races | Too granular for initial TX expansion |
| v2.2 parked phases (Race Audit, IN local races, CA/IN stances) | Parked in backlog; not v3.0 scope |
| Geofences for cities with partial Collin County presence (Plano, Frisco, etc.) | Multi-county geofence splitting is complex; defer to v3.1 geofence phase |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEO-01 | Phase 12 | Complete |
| GEO-02 | Phase 12 | Complete |
| GEO-03 | Phase 12 | Complete |
| GEO-04 | Phase 12 | Complete |
| OFF-01 | Phase 13 | Complete |
| OFF-02 | Phase 13 | Complete |
| OFF-03 | Phase 14 | Complete |
| OFF-04 | Phase 14 | Complete |
| OFF-05 | Phase 14 | Complete |
| OFF-06 | Phase 14 | Complete |
| OFF-07 | Phase 14 | Complete |
| OFF-08 | Phase 14 | Complete |
| OFF-09 | Phase 15 | Pending |
| OFF-10 | Phase 15 | Pending |
| DISC-01 | Phase 16 | Complete |
| DISC-02 | Phase 16 | Complete |
| DISC-03 | Phase 16 | Complete |
| HEAD-01 | Phase 17 | Pending |
| HEAD-02 | Phase 17 | Pending |
| HEAD-03 | Phase 17 | Pending |
| COMP-01 | Phase 18 | Pending |
| COMP-02 | Phase 18 | Pending |
| COMP-03 | Phase 18 | Pending |
| COMP-04 | Phase 18 | Pending |

**v3.0 Coverage:**
- v3.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

### v3.1 Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUDIT-01 | Phase 22 | Pending |
| AUDIT-02 | Phase 22 | Pending |
| RETIRE-01 | Phase 22 | Pending |
| TOPIC-01 | Phase 23 | Pending |
| TOPIC-02 | Phase 23 | Pending |
| TOPIC-03 | Phase 23 | Pending |
| TOPIC-04 | Phase 23 | Pending |
| TOPIC-05 | Phase 23 | Pending |
| TOPIC-06 | Phase 23 | Pending |
| TOPIC-07 | Phase 23 | Pending |
| TOPIC-08 | Phase 23 | Pending |
| TOPIC-09 | Phase 23 | Pending |
| TOPIC-10 | Phase 23 | Pending |
| SCOPE-01 | Phase 23 | Pending |
| COMM-01 | Phase 24 | Pending |
| COMM-02 | Phase 24 | Pending |
| COMM-03 | Phase 24 | Pending |
| COMM-04 | Phase 24 | Pending |
| COMM-05 | Phase 24 | Pending |
| COMM-06 | Phase 24 | Pending |
| COMM-07 | Phase 24 | Pending |
| COMM-08 | Phase 24 | Pending |
| COMM-09 | Phase 24 | Pending |
| COMM-10 | Phase 24 | Pending |
| SCOPE-02 | Phase 25 | Pending |
| RETIRE-02 | Phase 25 | Pending |

**v3.1 Coverage:**
- v3.1 requirements: 26 total
- Mapped to phases: 26
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-05-04 — v3.1 Local Compass Expansion requirements added (26 requirements, phases 22-25)*
