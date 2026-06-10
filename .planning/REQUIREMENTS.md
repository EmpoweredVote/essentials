# Requirements: v13.0 Massachusetts Expanded

**Defined:** 2026-06-10
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## MA-GEO — Town Geofences

- [x] **MA-GEO-01:** A resident of any MA town (not just the 58 G4110 cities already loaded) can enter their address and get routed to their correct state + federal representatives via PostGIS geofence matching
- [x] **MA-GEO-02:** Any MA address returns a non-empty LOCAL section where the town has seeded officials (dependent on MA-TIER2 / MA-DEEP completion for those towns)

## MA-DEEP — Boston Deep Seed

- [ ] **MA-DEEP-01:** A Boston address returns a LOCAL section showing Mayor Wu + all 13 Boston City Councillors with correct offices linked to Boston geo_id
- [ ] **MA-DEEP-02:** All Boston city officials (Mayor + 13 Councillors + School Committee) have headshots at 600×750 in Supabase Storage (politician_photos bucket)
- [ ] **MA-DEEP-03:** Boston School Committee members are seeded with SCHOOL district type and appear for a Boston address

## MA-ELECTIONS — 2026 Elections

- [ ] **MA-ELECTIONS-01:** MA 2026 election rows exist in essentials.elections (primary 2026-09-02, general 2026-11-03)
- [ ] **MA-ELECTIONS-02:** Governor's race (Healey re-election) + US Senate race (Markey) seeded with known declared candidates
- [ ] **MA-ELECTIONS-03:** All 200 legislative race rows (40 Senate + 160 House) seeded with non-null office_ids
- [ ] **MA-ELECTIONS-04:** MA discovery pipeline armed — discovery_jurisdictions row with cron_active=true for MA statewide (geo_id='25')

## MA-TIER2 — Tier 2 Cities

- [ ] **MA-TIER2-01:** A Worcester address returns a LOCAL section with Mayor + City Councillors; best-effort headshots at 600×750
- [ ] **MA-TIER2-02:** Springfield, Lowell, Brockton, and Quincy each return LOCAL sections with Mayor + council incumbents; best-effort headshots

## MA-STANCES — Compass Stances

- [ ] **MA-STANCES-01:** Compass shows stance data for all 6 MA executives (Governor Healey, LG Kim Driscoll, AG Andrea Campbell, Treasurer Goldberg, Auditor DiZoglio, SoS Galvin) — evidence-only, sequential research, 100% citation rate
- [ ] **MA-STANCES-02:** Compass shows stance data for all 11 MA federal officials (Senators Markey + Warren + 9 US House reps) — evidence-only, sequential, 100% citation rate
- [ ] **MA-STANCES-03:** Compass shows stance data for all 40 MA state senators — evidence-only, sequential, 100% citation rate
- [ ] **MA-STANCES-04:** Compass shows stance data for all 160 MA house representatives — evidence-only, sequential, 100% citation rate

## MA-STANCES — Boston City Officials

- [ ] **MA-STANCES-05:** Compass shows stance data for Mayor Wu + all 13 Boston City Councillors — evidence-only, sequential research, 100% citation rate; Boston School Committee best-effort

## MA-RETRO — Playbook Retrospective

- [ ] **MA-RETRO-01:** LOCATION-ONBOARDING.md updated with MA town/COUSUB routing pattern GOTCHAs + Boston deep seed patterns; Massachusetts + Boston entries added to Cities Onboarded table

---

## Future Requirements (Deferred)

- MA G4040 COUSUB towns with seeded incumbent officials (most towns have minimal digital presence)
- MA G4040 town elections discovery (beyond state-level MA elections)
- Western MA / Cape Cod city deep seeds (Pittsfield, New Bedford, Fall River, Plymouth)
- MA school board coverage beyond Boston

## Out of Scope

- MA G4040 COUSUB towns with seeded officials (geofences only for routing — towns are low-population, low digital footprint)
- Real-time election results ingestion
- MA ballot question / referendum tracking

## Traceability

| Requirement | Phase |
|-------------|-------|
| MA-GEO-01 | 107 |
| MA-GEO-02 | 107 |
| MA-DEEP-01 | 108 |
| MA-DEEP-02 | 108 |
| MA-DEEP-03 | 108 |
| MA-ELECTIONS-01 | 110 |
| MA-ELECTIONS-02 | 110 |
| MA-ELECTIONS-03 | 110 |
| MA-ELECTIONS-04 | 110 |
| MA-TIER2-01 | 109 |
| MA-TIER2-02 | 109 |
| MA-STANCES-01 | 111 |
| MA-STANCES-02 | 111 |
| MA-STANCES-03 | 112 |
| MA-STANCES-04 | 113 |
| MA-STANCES-05 | 115 |
| MA-RETRO-01 | 116 |
