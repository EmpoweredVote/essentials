# Requirements: v5.0 Location Onboarding Playbook

**Defined:** 2026-05-15
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v5.0 Requirements

### Playbook

- [ ] **PLAY-01**: A `LOCATION-ONBOARDING.md` checklist exists covering all steps to onboard any US city from scratch using only public sources and no local insider knowledge
- [ ] **PLAY-02**: Phase templates exist in `.planning/templates/` for each reusable phase type (DB foundation, officials seed, headshots, discovery setup, compass stances)
- [ ] **PLAY-03**: Checklist and templates are reviewed and updated after Cambridge completes (retrospective)

### Massachusetts Geofences

- [ ] **MAGEO-01**: MA state legislative boundaries loaded — 40 Senate (G5210/STATE_UPPER) + 160 House (G5220/STATE_LOWER) district boundaries in `essentials.geofence_boundaries`
- [ ] **MAGEO-02**: MA congressional boundaries loaded — all MA-01 through MA-09 districts in `essentials.geofence_boundaries`
- [ ] **MAGEO-03**: Cambridge place boundary loaded (GEOID 2511000) — any Cambridge address returns Cambridge city officials
- [ ] **MAGEO-04**: Middlesex County G4020 boundary loaded (FIPS 25017) — county-level intersection for US House rep lookup

### Massachusetts Government DB

- [ ] **MADB-01**: Commonwealth of Massachusetts government row + MA legislative chambers (Senate + House of Representatives) seeded in `essentials.governments` and `essentials.chambers`
- [ ] **MADB-02**: 40 MA state senators + 40 offices seeded with `district_type=STATE_UPPER`, linked to district boundaries
- [ ] **MADB-03**: 160 MA state representatives + 160 offices seeded with `district_type=STATE_LOWER`, linked to district boundaries
- [ ] **MADB-04**: MA statewide executives seeded — Governor Healey, Lt. Gov Driscoll, AG Campbell, Treasurer Goldberg, Auditor DiZoglio, Secretary Galvin — with chambers, offices, and Wikipedia headshots (600×750)

### Federal Officials

- [ ] **FED-01**: MA federal officials seeded — US Senators Warren + Markey (`NATIONAL_UPPER`) + all 9 MA US House representatives (`NATIONAL_LOWER`) with correct district_type and chamber assignments
- [ ] **FED-02**: Headshots for MA US Senators + all 9 US House reps from Wikipedia at 600×750

### Cambridge City Structure

- [ ] **CAMB-01**: Cambridge government row seeded (GEOID `2511000`, state=MA, Middlesex County)
- [ ] **CAMB-02**: Cambridge City Council chamber created (9 at-large seats, STV/RCV, `district_type=LOCAL`)
- [ ] **CAMB-03**: Cambridge School Committee chamber created (6 elected seats, `district_type=LOCAL`)
- [ ] **CAMB-04**: City Manager office row created (`is_appointed_position=true`) with Yi-An Huang seeded as current incumbent
- [ ] **CAMB-05**: Mayor role modeled correctly — appointed council-internal title (`is_appointed_position=true`), NOT `LOCAL_EXEC`, NOT a separately elected race
- [ ] **CAMB-06**: 9 City Council office rows + 6 School Committee office rows seeded with January 2026 incumbents (post-Nov 2025 election seating)
- [ ] **CAMB-07**: Contact data for all Cambridge incumbents (email addresses + website URLs from cambridge.ma.gov)

### Cambridge Headshots

- [ ] **CAMB-08**: Headshots at 600×750 JPEG for all Cambridge officials (9 councillors + 6 school committee members + city manager) in Supabase Storage

### Cambridge Elections

- [ ] **CAMB-09**: 2025 Cambridge City Council election seeded (November 4, 2025) with all 20 candidates and results
- [ ] **CAMB-10**: 2025 Cambridge School Committee election seeded (November 4, 2025) with all 18 candidates and results
- [ ] **CAMB-11**: 2027 Cambridge election placeholder seeded; discovery pipeline marked inactive until 2027 filing window opens
- [ ] **CAMB-12**: Cambridge jurisdiction added to `discovery_jurisdictions` with cambridgema.gov domain allowlist

### Cambridge Compass Stances

- [ ] **CAMB-13**: Compass stances researched and ingested for Cambridge City Councillors from public record (housing/zoning primary topic; one politician at a time per rate-limit policy)

### Landing

- [ ] **LAND-01**: Cambridge entry added to Landing.jsx `COVERAGE_AREAS` with `browseGovernmentList: ['2511000']` and `browseStateAbbrev: 'MA'` (folded into Phase 41)

### MA 2026 Elections + Challengers

- [ ] **MA26-01**: November 2026 Massachusetts General Election row seeded in `essentials.elections`
- [ ] **MA26-02**: Election races seeded for all MA state senate, MA state house, and federal (9 US House + Markey US Senate) districts — covering all 200+ seats up in 2026
- [ ] **MA26-03**: Challenger candidates discovered and staged for MA 2026 races via discovery pipeline; Azeem's 2nd Middlesex State Senate primary (September 1, 2026) explicitly seeded as a named race with known candidates

## Future Requirements

### v5.1+

- Ranked-choice voting UI (rank-ordered ballot display, preference round visualization)
- 2027 Cambridge election candidates once filing opens
- Additional MA cities beyond Cambridge
- MA-specific bar evaluation equivalents (MBLA, etc.) for any legal candidates

## Out of Scope

| Feature | Reason |
|---------|--------|
| RCV/STV ranking UI | Cambridge elections display same as other races this milestone; ranking UI is significant scope and v5.0 validates the data first |
| Middlesex County officials | County government in MA is largely administrative (no elected County Council equivalent); not a voter-facing gap |
| Other MA cities | Cambridge is the proof-of-concept; additional MA cities are v5.1+ |
| LA-style legal evaluation data | LACBA/CJP/LA Ethics have no MA equivalent; playbook explicitly flags these as LA-specific |
| Cambridge Elections page shortcut | Dropped — Landing.jsx COVERAGE_AREAS entry (LAND-01) is sufficient for discoverability |
| 2026 Cambridge city elections | Cambridge uses odd-year elections only; next city council cycle is November 2027 |

## Traceability

*Filled in by roadmapper.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAY-01 | Phase 37 | Complete |
| PLAY-02 | Phase 37 | Complete |
| PLAY-03 | Phase 46 | Pending |
| MAGEO-01 | Phase 38 | Pending |
| MAGEO-02 | Phase 38 | Pending |
| MAGEO-03 | Phase 38 | Pending |
| MAGEO-04 | Phase 38 | Pending |
| MADB-01 | Phase 39 | Pending |
| MADB-02 | Phase 39 | Pending |
| MADB-03 | Phase 39 | Pending |
| MADB-04 | Phase 40 | Pending |
| FED-01 | Phase 40 | Pending |
| FED-02 | Phase 40 | Pending |
| CAMB-01 | Phase 41 | Pending |
| CAMB-02 | Phase 41 | Pending |
| CAMB-03 | Phase 41 | Pending |
| CAMB-04 | Phase 41 | Pending |
| CAMB-05 | Phase 41 | Pending |
| CAMB-06 | Phase 41 | Pending |
| CAMB-07 | Phase 41 | Pending |
| CAMB-08 | Phase 42 | Pending |
| CAMB-09 | Phase 43 | Pending |
| CAMB-10 | Phase 43 | Pending |
| CAMB-11 | Phase 43 | Pending |
| CAMB-12 | Phase 43 | Pending |
| CAMB-13 | Phase 44 | Pending |
| LAND-01 | Phase 41 | Pending |
| MA26-01 | Phase 45 | Pending |
| MA26-02 | Phase 45 | Pending |
| MA26-03 | Phase 45 | Pending |

**Coverage:**
- v5.0 requirements: 29 total (LAND-02 dropped, MA26-01/02/03 added, LAND-01 folded into Phase 41)
- Mapped to phases: 29 (Phases 37-46)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after initial definition*
