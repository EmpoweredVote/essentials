# Requirements: Essentials — Empowered Vote

**Defined:** 2026-05-31
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v10.0 Requirements

### County Government

- [ ] **COUNTY-01**: Multnomah County Board of Commissioners government body created (geo_id=41051)
- [ ] **COUNTY-02**: 5 commissioners + chair seeded as officials with offices linked to county geo_id
- [ ] **COUNTY-03**: Commissioner headshots at 600×750 in Supabase Storage

### Multnomah Cities

- [x] **CITIES-01**: Gresham city council government body + elected officials seeded
- [x] **CITIES-02**: Troutdale city council government body + elected officials seeded
- [x] **CITIES-03**: Fairview city council government body + elected officials seeded
- [x] **CITIES-04**: Wood Village city council government body + elected officials seeded
- [x] **CITIES-05**: Maywood Park city council government body + elected officials seeded
- [x] **CITIES-06**: Headshots for smaller city officials where available online

### Routing

- [ ] **ROUTING-01**: Users at unincorporated Multnomah County addresses see county → state → federal representatives with no empty LOCAL city section

### Elections

- [x] **ELECTIONS-01**: Multnomah County commissioner 2026 race rows seeded
- [x] **ELECTIONS-02**: 2026 race rows seeded for each of the 5 smaller incorporated cities
- [x] **ELECTIONS-03**: discovery_jurisdictions row(s) created and cron armed for Multnomah County area

### OR School Boards — Multnomah County

- [x] **OR-SCHOOL-01**: G5420 geofences loaded for all 6 Multnomah County school districts (Portland Public Schools, Parkrose, Reynolds, Centennial, David Douglas, Riverdale)
- [x] **OR-SCHOOL-02**: School board government bodies seeded for all 6 districts (district_type='SCHOOL')
- [x] **OR-SCHOOL-03**: Board member officials + offices seeded for all 6 districts
- [x] **OR-SCHOOL-04**: Board member headshots at 600×750 where available online

### CA City School Boards

- [x] **CA-SCHOOL-01**: San Francisco Unified School District — G5420 geofence + 7-member board seeded
- [x] **CA-SCHOOL-02**: San Diego Unified School District — G5420 geofence + board seeded
- [x] **CA-SCHOOL-03**: Sacramento City Unified School District — G5420 geofence + board seeded
- [x] **CA-SCHOOL-04**: San Jose Unified School District — G5420 geofence + board seeded
- [x] **CA-SCHOOL-05**: Fremont Unified School District — G5420 geofence + board seeded
- [x] **CA-SCHOOL-06**: Berkeley Unified School District — G5420 geofence + board seeded

### TX School Boards — Collin County

- [ ] **TX-SCHOOL-01**: Plano ISD — G5420 geofence + board seeded
- [ ] **TX-SCHOOL-02**: McKinney ISD — G5420 geofence + board seeded
- [ ] **TX-SCHOOL-03**: Allen ISD — G5420 geofence + board seeded
- [ ] **TX-SCHOOL-04**: Frisco ISD — G5420 geofence + board seeded
- [ ] **TX-SCHOOL-05**: Richardson ISD — G5420 geofence + board seeded

### IN School Board Completion

- [ ] **IN-SCHOOL-01**: IPS D3 + D6 government bodies added; officials seeded for all 7 IPS seats (D1–D6 + At Large)
- [ ] **IN-SCHOOL-02**: Monroe County Community School Corporation board officials seeded for all 7 districts

### ME Tier 2 City School Boards

- [ ] **ME-SCHOOL-01**: Lewiston school board seeded (geofence + officials)
- [ ] **ME-SCHOOL-02**: Bangor school board seeded (geofence + officials)
- [ ] **ME-SCHOOL-03**: South Portland, Auburn, and Biddeford school boards seeded (geofences + officials)

## Future Requirements

### Additional OR Cities
- **OR-CITIES-01**: Gresham, Troutdale, Fairview, Wood Village, Maywood Park compass stances (post-seeding)
- **OR-CITIES-02**: OR G4040 COUSUB towns (unincorporated communities) geofences

### Additional School Coverage
- **SCHOOL-FUTURE-01**: Remaining Collin County TX ISDs beyond the 5 major ones
- **SCHOOL-FUTURE-02**: Remaining MA cities beyond Cambridge
- **SCHOOL-FUTURE-03**: ME Tier 3+ skeletal city school boards

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cambridge School Committee | Already seeded — complete |
| Portland ME School Board | Already seeded in Phase 53 — complete |
| OR G4040 COUSUB towns | Significant scope; defer to future milestone |
| School board elections discovery | Manual seeding sufficient for v10.0; auto-discovery for school races is v11+ |
| School compass stances for board members | Data depth phase; excluded from structural seeding milestone |

## Traceability

*(Populated by roadmapper — 2026-05-31)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| COUNTY-01 | Phase 83 | Pending |
| COUNTY-02 | Phase 83 | Pending |
| COUNTY-03 | Phase 83 | Pending |
| CITIES-01 | Phase 84 | Complete |
| CITIES-02 | Phase 84 | Complete |
| CITIES-03 | Phase 84 | Complete |
| CITIES-04 | Phase 84 | Complete |
| CITIES-05 | Phase 84 | Complete |
| CITIES-06 | Phase 84 | Complete |
| ROUTING-01 | Phase 83 | Pending |
| ELECTIONS-01 | Phase 85 | Complete |
| ELECTIONS-02 | Phase 85 | Complete |
| ELECTIONS-03 | Phase 85 | Complete |
| OR-SCHOOL-01 | Phase 86 | Complete |
| OR-SCHOOL-02 | Phase 86 | Complete |
| OR-SCHOOL-03 | Phase 86 | Complete |
| OR-SCHOOL-04 | Phase 86 | Complete |
| CA-SCHOOL-01 | Phase 87 | Complete |
| CA-SCHOOL-02 | Phase 87 | Complete |
| CA-SCHOOL-03 | Phase 87 | Complete |
| CA-SCHOOL-04 | Phase 87 | Complete |
| CA-SCHOOL-05 | Phase 87 | Complete |
| CA-SCHOOL-06 | Phase 87 | Complete |
| TX-SCHOOL-01 | Phase 88 | Pending |
| TX-SCHOOL-02 | Phase 88 | Pending |
| TX-SCHOOL-03 | Phase 88 | Pending |
| TX-SCHOOL-04 | Phase 88 | Pending |
| TX-SCHOOL-05 | Phase 88 | Pending |
| IN-SCHOOL-01 | Phase 89 | Pending |
| IN-SCHOOL-02 | Phase 89 | Pending |
| ME-SCHOOL-01 | Phase 89 | Pending |
| ME-SCHOOL-02 | Phase 89 | Pending |
| ME-SCHOOL-03 | Phase 89 | Pending |

**Coverage:**
- v10.0 requirements: 33 total
- Mapped to phases: 33, Unmapped: 0 ✓

---
*Requirements defined: 2026-05-31*
*Last updated: 2026-05-31 — roadmap created (phases 83–89)*
