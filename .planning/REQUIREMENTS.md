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
- [ ] **OFF-03**: Allen incumbent mayor and council members are in `essentials.politicians`
- [ ] **OFF-04**: Frisco incumbent mayor and council members are in `essentials.politicians`
- [ ] **OFF-05**: Murphy incumbent officials are in `essentials.politicians`
- [ ] **OFF-06**: Celina incumbent officials are in `essentials.politicians`
- [ ] **OFF-07**: Prosper incumbent officials are in `essentials.politicians`
- [ ] **OFF-08**: Richardson incumbent officials are in `essentials.politicians`
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
| OFF-03 | Phase 14 | Pending |
| OFF-04 | Phase 14 | Pending |
| OFF-05 | Phase 14 | Pending |
| OFF-06 | Phase 14 | Pending |
| OFF-07 | Phase 14 | Pending |
| OFF-08 | Phase 14 | Pending |
| OFF-09 | Phase 15 | Pending |
| OFF-10 | Phase 15 | Pending |
| DISC-01 | Phase 16 | Pending |
| DISC-02 | Phase 16 | Pending |
| DISC-03 | Phase 16 | Pending |
| HEAD-01 | Phase 17 | Pending |
| HEAD-02 | Phase 17 | Pending |
| HEAD-03 | Phase 17 | Pending |
| COMP-01 | Phase 18 | Pending |
| COMP-02 | Phase 18 | Pending |
| COMP-03 | Phase 18 | Pending |
| COMP-04 | Phase 18 | Pending |

**Coverage:**
- v3.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-30*
*Last updated: 2026-04-30 — initial definition*
