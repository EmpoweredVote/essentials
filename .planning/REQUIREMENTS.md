# Requirements: Essentials — v7.0 California

**Defined:** 2026-05-21
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v7.0 Requirements

### GEO — Geofences

- [x] **GEO-01**: CA TIGER boundaries loaded — G4110 incorporated cities, G4040 COUSUB unincorporated areas, SLDU (40 senate), SLDL (80 assembly), CD (52 congressional), G4020 counties (58); any CA address routes correctly to all tiers
- [ ] **GEO-02**: LAUSD board district geofence boundaries loaded and integrated with routing

### GOVDB — Government DB + Officials + Legislature

- [ ] **GOVDB-01**: State of California government row + all constitutional officer chambers seeded, with is_appointed_position determined per CA constitution
- [ ] **GOVDB-02**: CA executives seeded — Governor Newsom + applicable constitutional officers with headshots at 600×750
- [ ] **GOVDB-03**: 2 CA US Senators + 52 US House reps seeded with offices linked to NATIONAL districts + headshots at 600×750
- [ ] **GOVDB-04**: 80 CA Assembly members + 40 CA Senators seeded with offices linked to STATE geofence districts + headshots at 600×750

### LA — LA Backlog Closure

- [ ] **LA-01**: CA Governor challenger candidates (10 filed per SOS) seeded to the Governor race row
- [ ] **LA-02**: lavote.gov election ID updated for the current cycle (mandatory manual step per backlog)
- [ ] **LA-03**: LAUSD board district officials seeded with offices linked to LAUSD geofences + headshots at 600×750
- [ ] **LA-04**: LA city structure gaps closed — any missing chambers, offices, or incumbents from the partial existing seed

### CITIES — New City Deep Seeds

- [ ] **CITIES-01**: San Francisco government structure (charter city, Board of Supervisors 11 districts, Mayor, City Attorney, DA) + Tier 1-4 incumbents + headshots at 600×750
- [ ] **CITIES-02**: San Jose government structure + Tier 1-4 incumbents + headshots at 600×750
- [ ] **CITIES-03**: San Diego government structure + Tier 1-4 incumbents + headshots at 600×750
- [ ] **CITIES-04**: Sacramento government structure + Tier 1-4 incumbents + headshots at 600×750
- [ ] **CITIES-05**: Fremont government structure + Tier 1-4 incumbents + headshots at 600×750
- [ ] **CITIES-06**: Berkeley government structure + Tier 1-4 incumbents + headshots at 600×750
- [ ] **CITIES-07**: All 6 new cities + LA updated/confirmed in Landing.jsx COVERAGE_AREAS

### ELECT — Elections + Discovery

- [ ] **ELECT-01**: CA 2026 primary (June 3) + general (November 4) election rows seeded
- [ ] **ELECT-02**: CA Governor 2026 open-seat race seeded with all SOS-verified candidates and discovery pipeline armed
- [ ] **ELECT-03**: CA US House 2026 races seeded for all 52 districts with discovery pipeline armed
- [ ] **ELECT-04**: Discovery jurisdictions armed (cron_active=true) for all covered CA cities

### COMPASS — Compass Stances

- [ ] **COMPASS-01**: Compass stances researched + ingested for CA constitutional officers and US senators/reps where public record exists (one-at-a-time per rate-limit rule)
- [ ] **COMPASS-02**: Compass stances researched + ingested for city council officials across all 7 CA cities (LA + 6 new) where public record exists (one-at-a-time)

### PLAYBOOK

- [ ] **PLAYBOOK-01**: LOCATION-ONBOARDING.md updated with CA-specific GOTCHAs (charter vs. general law cities, RCV jurisdictions like SF/Berkeley, TIGER CD key verification for CA, LAUSD sub-district geofence pattern, lavote.gov election ID maintenance)

---

## Future Requirements (v7.1+)

- Additional CA city deep seeds (Oakland, Long Beach, Anaheim, etc.)
- CA G4040 COUSUB town coverage verification (unincorporated county areas)
- CA campaign finance ingestion (FPPC Form 460 pattern)
- STV/RCV round-by-round results display for SF/Berkeley elections
- CA judicial candidates (Superior Court elections per county)

## Out of Scope

| Feature | Reason |
|---------|--------|
| All 482 CA incorporated cities deep-seeded | 6 cities at full depth is ambitious for one milestone; remainder in v7.1+ |
| CA campaign finance ingestion | FPPC Form 460 is a different format from LA Ethics Commission; separate research needed |
| SF/Berkeley STV round-by-round results UI | High UI complexity, no precedent in codebase; post-v7.0 |
| CA judicial elections | 58 counties × multiple Superior Court races; scope warrants its own milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEO-01 | Phase 57 | Pending |
| GEO-02 | Phase 58 | Pending |
| GOVDB-01 | Phase 59 | Pending |
| GOVDB-02 | Phase 59 | Pending |
| GOVDB-03 | Phase 60 | Pending |
| GOVDB-04 | Phase 61 | Pending |
| LA-01 | Phase 62 | Pending |
| LA-02 | Phase 62 | Pending |
| LA-03 | Phase 62 | Pending |
| LA-04 | Phase 62 | Pending |
| CITIES-01 | Phase 63 | Pending |
| CITIES-02 | Phase 64 | Pending |
| CITIES-03 | Phase 65 | Pending |
| CITIES-04 | Phase 66 | Pending |
| CITIES-05 | Phase 67 | Pending |
| CITIES-06 | Phase 68 | Pending |
| CITIES-07 | Phase 69 | Pending |
| ELECT-01 | Phase 69 | Pending |
| ELECT-02 | Phase 69 | Pending |
| ELECT-03 | Phase 69 | Pending |
| ELECT-04 | Phase 69 | Pending |
| COMPASS-01 | Phase 70 | Pending |
| COMPASS-02 | Phase 70 | Pending |
| PLAYBOOK-01 | Phase 71 | Pending |

**Coverage:**
- v7.0 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-21*
*Last updated: 2026-05-21 — traceability populated by roadmapper*
