# Requirements: v6.0 Maine Essentials

**Defined:** 2026-05-18
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v6.0 Requirements

### GEO — Geofences

- [x] **GEO-01**: Maine TIGER boundaries loaded (CD congressional, SLDU senate, SLDL house, PLACE city boundaries for all 23 cities)
- [x] **GEO-02**: Maine county G4020 boundaries loaded for congressional intersection (York, Cumberland, etc.)
- [x] **GEO-03**: Any Maine address returns correct NATIONAL_LOWER representative (ME-01 or ME-02)
- [x] **GEO-04**: Any Maine address returns correct STATE_UPPER + STATE_LOWER legislators
- [x] **GEO-05**: Any Maine city address returns correct LOCAL city officials

### MGOV — Maine State + Federal Government DB

- [x] **MGOV-01**: Maine state government row + legislative chambers (Senate, House of Representatives) seeded
- [x] **MGOV-02**: Maine executive chambers seeded (Governor, AG, Secretary of State, Treasurer)
- [ ] **MGOV-03**: Governor + AG + SoS + Treasurer offices + incumbents seeded; AG/SoS/Treasurer modeled as legislature-elected (is_appointed_position=true)
- [ ] **MGOV-04**: 2 US Senators (Susan Collins + Angus King) seeded with offices
- [ ] **MGOV-05**: 2 US House members (ME-01: Pingree, ME-02: Golden) seeded with offices
- [ ] **MGOV-06**: 35 Maine state senators + offices seeded
- [ ] **MGOV-07**: 151 Maine state house representatives + offices seeded

### MCITY — Maine City Governments

- [ ] **MCITY-01**: All 23 Maine city governments, chambers, and offices seeded
- [ ] **MCITY-02**: Portland incumbents seeded (Mayor + 9 City Council + School Board); `election_method=rcv` on City Council chamber
- [x] **MCITY-03**: Tier 2 city incumbents seeded (Lewiston, Bangor, South Portland, Auburn, Biddeford)
- [x] **MCITY-04**: Remaining 18 cities seeded; sparse Tier 3+ coverage documented as known gaps

### HEAD — Headshots

- [ ] **HEAD-01**: Maine Governor + AG + SoS + Treasurer headshots from maine.gov / Wikipedia at 600×750
- [ ] **HEAD-02**: US Senators (Collins + King) + US House (Pingree + Golden) headshots at 600×750
- [ ] **HEAD-03**: ME state senators + house reps headshots from mainelegislature.gov where available
- [ ] **HEAD-04**: Portland city officials headshots from portlandmaine.gov at 600×750
- [x] **HEAD-05**: Tier 2 city officials headshots where available online; gaps documented

### ELEC — Elections + Candidates

- [ ] **ELEC-01**: 2026 Maine Primary election row seeded (June 9, 2026)
- [ ] **ELEC-02**: 2026 Maine General election row seeded (November 3, 2026)
- [ ] **ELEC-03**: 2026 Governor primary races seeded with known candidates (6D, 10R in June primary)
- [ ] **ELEC-04**: 2026 US Senate race seeded (Collins + primary challengers including Graham Platner)
- [ ] **ELEC-05**: ME-01 + ME-02 congressional races seeded with known candidates
- [ ] **ELEC-06**: Key competitive state senate + house primary races seeded; discovery pipeline handles remaining candidate discovery
- [ ] **ELEC-07**: Portland 2027 municipal election placeholder seeded (inactive — outside cron horizon)

### DISC — Discovery Pipeline

- [ ] **DISC-01**: Maine discovery_jurisdictions rows seeded (geoid='23', 2026-06-09 primary + 2026-11-03 general)
- [ ] **DISC-02**: Portland 2027 discovery_jurisdictions row seeded (cron_active=false until summer 2027)
- [ ] **DISC-03**: Discovery cron verified active and sweeping for Maine 2026 elections

### LAND — Landing Page

- [ ] **LAND-01**: Maine entry added to Landing.jsx COVERAGE_AREAS (Portland city browse + ME state browse shortcut)

## Future Requirements

### ME Compass Stances (v6.1+)

- Compass stance research for Portland city councillors
- Compass stances for ME Governor candidates
- Compass stances for ME US Senate candidates
- Scope: housing/development, transportation, environment, public safety

### ME Treasury Tracker (v6.2+)

- Maine Ethics Commission campaign finance ingestion
- Clean Elections program flag on participating candidates
- Bulk CSV download from Accountability Project (2008-2020 historical)
- Live portal scraping for current cycle data

### ME RCV Visualization (future)

- Round-by-round tabulation display for RCV races
- Portland multi-winner STV display for City Council
- Cast vote record data ingestion for historical RCV races (2018 CD-2)

### ME Towns (future)

- G4040 COUSUB boundaries for Maine towns (similar to Phase 48 MA towns)
- Town government structure seeding (selectmen, town council)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Compass stances | Handled by separate Compass team workflow |
| Treasury Tracker / campaign finance | Handled by separate Treasury Tracker workflow; no native ME API |
| RCV round-by-round display | High complexity, no precedent in codebase; deferred |
| Maine towns (G4040 COUSUB) | Follows same pattern as Phase 48 MA towns; deferred to v6.1+ |
| ME Clean Elections program data | Requires Ethics Commission portal scraping; deferred to Treasury milestone |
| AG / SoS / Treasurer election races | These offices are legislature-elected, not voter-elected — no candidate races |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEO-01 | Phase 49 | Complete |
| GEO-02 | Phase 49 | Complete |
| GEO-03 | Phase 49 | Complete |
| GEO-04 | Phase 49 | Complete |
| GEO-05 | Phase 49 | Complete |
| MGOV-01 | Phase 50 | Complete |
| MGOV-02 | Phase 50 | Complete |
| MGOV-03 | Phase 51 | Pending |
| MGOV-04 | Phase 51 | Pending |
| MGOV-05 | Phase 51 | Pending |
| MGOV-06 | Phase 52 | Pending |
| MGOV-07 | Phase 52 | Pending |
| MCITY-01 | Phase 53 | Pending |
| MCITY-02 | Phase 53 | Pending |
| MCITY-03 | Phase 54 | Complete |
| MCITY-04 | Phase 54 | Complete |
| HEAD-01 | Phase 51 | Pending |
| HEAD-02 | Phase 51 | Pending |
| HEAD-03 | Phase 52 | Pending |
| HEAD-04 | Phase 53 | Pending |
| HEAD-05 | Phase 54 | Complete |
| ELEC-01 | Phase 55 | Pending |
| ELEC-02 | Phase 55 | Pending |
| ELEC-03 | Phase 55 | Pending |
| ELEC-04 | Phase 55 | Pending |
| ELEC-05 | Phase 55 | Pending |
| ELEC-06 | Phase 55 | Pending |
| ELEC-07 | Phase 55 | Pending |
| DISC-01 | Phase 55 | Pending |
| DISC-02 | Phase 55 | Pending |
| DISC-03 | Phase 55 | Pending |
| LAND-01 | Phase 53 | Pending |

**Coverage:**
- v6.0 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 after initial definition*
