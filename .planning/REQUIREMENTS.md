# Requirements: Essentials — Empowered Vote

**Defined:** 2026-06-04
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

---

## v12.0 Virginia Essentials (Active)

**Goal:** Onboard Virginia at full depth — geofences, state government, federal officials, Alexandria deep seed with school board, elections, and compass stances. Completes the DC/MD/VA trifecta.

### VA-GEO — Virginia Geofences

- [ ] **VA-GEO-01**: VA TIGER geofences loaded — G4110 incorporated places, G4020 counties + independent cities, G5200 CD×11, G5210 SLDU×40, G5220 SLDL×100; state='51' in geofence_boundaries
- [ ] **VA-GEO-02**: Alexandria independent city dual-tier — geo_id=`5101000` (G4110 place) AND geo_id=`51510` (G4020 county-equivalent) both present; address in Alexandria routes to LOCAL + STATE + NATIONAL tiers correctly
- [ ] **VA-GEO-03**: Any VA address returns correct federal, state, and city representatives via PostGIS routing (verified end-to-end)

### VA-GOV — VA State Government

- [ ] **VA-GOV-01**: State of Virginia government row asserted; 5 chambers seeded — Governor, Lt. Governor, AG, VA Senate, House of Delegates
- [ ] **VA-GOV-02**: 3 executive officials seeded — Spanberger (Governor), Hashmi (LG), Jones (AG) with STATE_EXEC districts and offices; all voter-elected (is_appointed_position=false)
- [ ] **VA-GOV-03**: 40 VA state senators seeded with offices linked to SLDU geofence districts
- [ ] **VA-GOV-04**: 100 VA House of Delegates members seeded with offices linked to SLDL geofence districts
- [ ] **VA-GOV-05**: Virginia constitutional structure modeled correctly — all 3 executives are voter-elected (no legislature-elected officials like ME/OR AG pattern)

### VA-FED — Federal Officials

- [ ] **VA-FED-01**: 2 US Senators seeded — Mark Warner + Tim Kaine with NATIONAL_UPPER districts
- [ ] **VA-FED-02**: 11 US House reps seeded — Wittman/Kiggans/Scott/McClellan/Cline/Griffith/Vindman/Beyer/McGuire/Subramanyam/Walkinshaw with NATIONAL_LOWER districts linked to VA CD geofences

### VA-GOV-06 — Headshots

- [ ] **VA-GOV-06**: 100% headshot coverage for all VA officials at 600×750 JPEG — delegates via vga.virginia.gov/delegate_photos/, senators via apps.senate.virginia.gov pattern, executives and federal from official sources

### VA-DEEP — Alexandria Deep Seed

- [ ] **VA-DEEP-01**: Alexandria city government seeded — Mayor Gaskins + 6 at-large council members (Bagley/Aguirre/Chapman/Elnoubi/Greene/Marks) with LOCAL_EXEC/LOCAL offices linked to geo_id=`5101000`
- [ ] **VA-DEEP-02**: ACPS school board seeded — 9 members across 3 school districts using G5420 TIGER UNSD pattern; SCHOOL district_type
- [ ] **VA-DEEP-03**: Alexandria officials headshots at 600×750; ACPS board headshots best-effort from acps.k12.va.us

### VA-ELECTIONS — Elections & Discovery

- [ ] **VA-ELECTIONS-01**: 2 election rows — primary 2026-08-04 and general 2026-11-03
- [ ] **VA-ELECTIONS-02**: Race rows seeded — Mark Warner US Senate re-election + 11 US House races (no VA state legislature races in 2026; House was Nov 2025, Senate not until 2027)
- [ ] **VA-ELECTIONS-03**: discovery_jurisdictions row armed for VA federal cron; Landing.jsx VA entry added

### VA-STANCES — Compass Stances

- [ ] **VA-STANCES-01**: Compass stances for 3 VA executives (Spanberger, Hashmi, Jones) — evidence-only, sequential, no default values
- [ ] **VA-STANCES-02**: Compass stances for VA US Senators (Warner + Kaine) — evidence-only, public record only
- [ ] **VA-STANCES-03**: Compass stances for Alexandria council + ACPS board — best-effort, evidence-only; blank if no public record

---

## Traceability

| Req ID | Phase |
|--------|-------|
| VA-GEO-01..03 | Phase 100 |
| VA-GOV-01..05 | Phase 101 |
| VA-FED-01..02 | Phase 102 |
| VA-DEEP-01..03 | Phase 103 |
| VA-GOV-06 | Phase 104 |
| VA-ELECTIONS-01..03 | Phase 105 |
| VA-STANCES-01..03 | Phase 106 |

---

## Future Requirements (Deferred)

- VA House of Delegates stances (140 officials — post v12.0, same as OR v9.0 pattern)
- VA Senate stances (40 senators — post v12.0)
- Richmond, VA deep seed
- Virginia Beach / Norfolk deep seed
- VA county-level officials (95 counties + remaining independent cities)
- Las Vegas, NV coverage (v13.0)
- Tucson, AZ coverage (v14.0)

## Out of Scope

- VA G4040 COUSUB (county subdivisions) — not needed for Virginia's structure (uses independent cities, not townships)
- VA state legislature 2026 elections — House was Nov 2025, Senate not until 2027; no 2026 state races exist
- Compass stances for all 140 delegates / 40 senators — deferred to post-v12.0 (scope would balloon milestone)
