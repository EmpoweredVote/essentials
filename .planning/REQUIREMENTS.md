# Requirements — v3.2 Legal Candidate Evaluation Framework

*Milestone:* v3.2 Legal Candidate Evaluation Framework  
*Defined:* 2026-05-06  
*Status:* Active — roadmap defined

---

## v3.2 Requirements

### COMPASS — Judicial Compass Topics

- [x] **COMPASS-01**: 4 universal legal compass topics authored in DB with full 5-stance metadata
  *(textualism vs. living law | rehabilitation vs. punishment | government/citizen deference | court access barriers)*
- [x] **COMPASS-02**: 2 judge-specific compass topics authored in DB with full 5-stance metadata
  *(precedent deference | prosecutorial scrutiny)*
- [x] **COMPASS-03**: 2 City Attorney/DA-specific topics authored with full 5-stance metadata
  *(prosecution vs. diversion | defend employees vs. hold accountable)*
- [x] **COMPASS-04**: All 8 legal topics scoped to legal offices only — not shown to state legislators, council members, or other non-legal candidates
- [x] **COMPASS-05**: Legal candidate profiles in essentials frontend surface judicial compass topics
- [x] **COMPASS-06**: 8 companion Focused Communities seeded for the new judicial topics

### BAR — Bar Evaluation Data

- [x] **BAR-01**: LACBA attorney evaluation ratings researched and stored for current LA legal candidates
- [x] **BAR-02**: CA State Bar discipline status researched and stored for current LA legal candidates
- [x] **BAR-03**: CJP (Commission on Judicial Performance) censures/discipline researched and stored for current LA judicial candidates
- [x] **BAR-04**: Bar evaluation data surfaced on legal candidate profile pages in the essentials frontend

### STANCE — Legal Candidate Stance Research

- [ ] **STANCE-01**: Aida Ashouri has stances inserted on applicable judicial compass topics
- [ ] **STANCE-02**: John McKinney has stances inserted on applicable judicial compass topics
- [ ] **STANCE-03**: Marissa Roy has stances inserted on applicable judicial compass topics

### FINANCE — Campaign Finance Completeness

- [ ] **FINANCE-01**: All 32 identified LA City candidates with missing la_socrata sources have sources seeded and ingest triggered
- [ ] **FINANCE-02**: Campaign finance gap audit documented as a routine maintenance procedure

### DONOR — Donor-Court Conflict Map

- [ ] **DONOR-01**: Top 15% of donors by amount identified for each LA legal candidate using existing contribution data
- [ ] **DONOR-02**: Donor law firm names cross-referenced against lacourt.org (LA Superior) and CourtListener (federal) appearances
- [ ] **DONOR-03**: Donor-court conflicts computed and stored (firm donated + appeared before same judge, no recusal on record)
- [ ] **DONOR-04**: Conflict data surfaced on legal candidate profile pages

---

## Future Requirements (Deferred)

- Judicial compass coverage for non-LA jurisdictions (stances for Indiana and TX judges as data becomes available)
- Automated LACBA rating re-scrape each election cycle
- Donor conflict map for non-LA jurisdictions
- Federal judge compass stances (CourtListener federal opinions)

---

## Out of Scope

- Paid APIs for any data source — free/public sources only (constraint from v3.2 Alpha design)
- Courtroom temperament as a compass spoke — too subjective, excluded by design ("Mean Girls" problem)
- Partisan framing of compass spokes — all 5 notches are presented as named positions, not left/right labels
- Real-time court appearance scraping — batch cross-reference only

---

## Traceability

*Filled by roadmapper — maps each REQ-ID to the phase that delivers it.*

| Requirement | Phase |
|-------------|-------|
| COMPASS-01  | Phase 27 |
| COMPASS-02  | Phase 27 |
| COMPASS-03  | Phase 27 |
| COMPASS-04  | Phase 27 |
| COMPASS-05  | Phase 28 |
| COMPASS-06  | Phase 28 |
| BAR-01      | Phase 29 |
| BAR-02      | Phase 29 |
| BAR-03      | Phase 29 |
| BAR-04      | Phase 29 |
| STANCE-01   | Phase 30 |
| STANCE-02   | Phase 30 |
| STANCE-03   | Phase 30 |
| FINANCE-01  | Phase 26 |
| FINANCE-02  | Phase 26 |
| DONOR-01    | Phase 31 |
| DONOR-02    | Phase 31 |
| DONOR-03    | Phase 31 |
| DONOR-04    | Phase 31 |
