# Requirements: Essentials — Empowered Vote

**Defined:** 2026-06-04
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## v11.0 Requirements — Maryland Essentials

### UI — MiniCompass

- [ ] **UI-01**: MiniCompass chart circles reduced by ~50% so the chart fits naturally as a tooltip overlay on candidate tiles
- [ ] **UI-02**: Titles/labels removed from around MiniCompass display (no spoke labels, no chart title text visible)

### MD Geofences (MD-GEO)

- [x] **MD-GEO-01**: MD TIGER G4110 incorporated cities loaded into geofence_boundaries (state='24')
- [x] **MD-GEO-02**: MD TIGER G4020 counties loaded (24 counties, state='24')
- [x] **MD-GEO-03**: MD TIGER SLDU loaded (47 state senate districts)
- [x] **MD-GEO-04**: MD TIGER SLDL loaded (141 house delegate sub-district boundaries)
- [x] **MD-GEO-05**: MD TIGER CD loaded (8 congressional districts)
- [x] **MD-GEO-06**: Any MD address returns correct federal, state, county, and local tiers via PostGIS routing

### MD State Government (MD-GOV)

- [x] **MD-GOV-01**: MD state government row + 4 constitutional officer chambers seeded (Governor, LG, AG, Comptroller); State Treasurer marked is_appointed_position=true
- [x] **MD-GOV-02**: Governor Wes Moore + LG Aruna Miller + AG Anthony Brown + Comptroller Brooke Lierman seeded with offices + headshots at 600×750
- [x] **MD-GOV-03**: MD State Senate chamber + 47 senators seeded with offices linked to SLDU district boundaries
- [x] **MD-GOV-04**: MD House of Delegates chamber + 141 delegates seeded with offices linked to SLDL district boundaries; multi-member district structure handled
- [x] **MD-GOV-05**: 2 US senators (Van Hollen + Alsobrooks) + 8 US House reps seeded with correct NATIONAL_UPPER/NATIONAL_LOWER districts
- [x] **MD-GOV-06**: All MD officials have headshots at 600×750 in Supabase Storage

### Leonardtown / St. Mary's County Deep Seed (MD-DEEP)

- [x] **MD-DEEP-01**: St. Mary's County government + Board of County Commissioners chamber seeded; county boundary linked
- [x] **MD-DEEP-02**: Active St. Mary's County Commissioners seeded with offices + available headshots
- [x] **MD-DEEP-03**: Town of Leonardtown government + town officials seeded with available headshots

### MD 2026 Elections (MD-ELECTIONS)

- [ ] **MD-ELECTIONS-01**: MD 2026 elections seeded — Governor race + 1 US Senate (Van Hollen) + 8 US House + 47 senate scaffold + 71 SLDL house district scaffold rows (one row per geo_id, seats=N per D-01; 130 total race rows)
- [ ] **MD-ELECTIONS-02**: discovery_jurisdictions row created for MD statewide, cron_active=true, armed for 2026 election cycle
- [ ] **MD-ELECTIONS-03**: Landing.jsx updated with MD entry — Leonardtown city browse + MD state browse

### MD Compass Stances (MD-STANCES)

- [x] **MD-STANCES-01**: Compass stances for Governor Moore + 3 constitutional officers, cited from public record
- [x] **MD-STANCES-02**: Compass stances for all 47 MD state senators, one agent at a time, evidence-only
- [ ] **MD-STANCES-03**: Compass stances for all 141 MD house delegates, one agent at a time, evidence-only
- [ ] **MD-STANCES-04**: Compass renders correctly on spot-checked MD official profiles (human-verified)

### Post-Election Follow-up (POST-ELECTION)

- [ ] **POST-ELECTION-01**: ME June 9 primary winners added to US Senate general + ME-01 general + ME-02 general race_candidates rows
- [ ] **POST-ELECTION-02**: lavote.gov election ID updated in discovery_jurisdictions for CA November general

## Future Requirements (v12.0+)

- MA COUSUB towns layer (293 G4040 towns deferred from v5.0 Phase 48)
- ME G4040 towns layer — most ME residents live in G4040 towns not yet loaded
- Indiana local races — Monroe County Commissioner, Clerk, Assessor, Township (parked from v2.2)
- Race Completeness Audit — verify every loaded geofence has at least one race row (parked from v2.2)
- Headshots for 40 ME + IN school board officials (CMS-blocked; requires browser automation)
- MD COUSUB layer if MD has significant town population not covered by G4110

## Out of Scope

| Feature | Reason |
|---------|--------|
| MD town/COUSUB layer | Verify if needed; MD may be primarily G4110 cities |
| MD compass stances for federal officials (senators/House) | Federal officials have no LOCAL/STATE scope; judicial/legal compass not applicable |
| OR post-June general candidate additions | Separate post-election task, not v11.0 scope |
| Browser automation for CMS-blocked headshots | Requires Playwright; separate tooling effort |

## Traceability

*Populated by roadmapper during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 90 | Pending |
| UI-02 | Phase 90 | Pending |
| MD-GEO-01 | Phase 91 | Complete |
| MD-GEO-02 | Phase 91 | Complete |
| MD-GEO-03 | Phase 91 | Complete |
| MD-GEO-04 | Phase 91 | Complete |
| MD-GEO-05 | Phase 91 | Complete |
| MD-GEO-06 | Phase 91 | Complete |
| MD-GOV-01 | Phase 92 | Complete |
| MD-GOV-02 | Phase 92 | Complete |
| MD-GOV-03 | Phase 93 | Complete |
| MD-GOV-04 | Phase 93 | Complete |
| MD-GOV-05 | Phase 93 | Complete |
| MD-GOV-06 | Phase 94 | Complete |
| MD-DEEP-01 | Phase 95 | Complete |
| MD-DEEP-02 | Phase 95 | Complete |
| MD-DEEP-03 | Phase 95 | Complete |
| MD-ELECTIONS-01 | Phase 96 | Pending |
| MD-ELECTIONS-02 | Phase 96 | Pending |
| MD-ELECTIONS-03 | Phase 96 | Pending |
| MD-STANCES-01 | Phase 97 | Complete |
| MD-STANCES-02 | Phase 97 | Complete |
| MD-STANCES-03 | Phase 98 | Pending |
| MD-STANCES-04 | Phase 98 | Pending |
| POST-ELECTION-01 | Phase 90 | Pending |
| POST-ELECTION-02 | Phase 90 | Pending |

**Coverage:**
- v11.0 requirements: 26 total
- Mapped to phases: 26 (roadmap complete)
- Unmapped: 0 ✓

---
*Requirements defined: 2026-06-04*
*Last updated: 2026-06-04 after roadmap creation (v11.0 phases 90-99 mapped)*
