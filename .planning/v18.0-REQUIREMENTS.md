# Requirements: v18.0 Las Vegas & Clark County, NV

**Defined:** 2026-06-22
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## Scope

Open **Nevada** as a fully-covered state (no NV data exists yet) and deep-seed the **Clark County
(Las Vegas) metro** to Tier 1 depth. Two-part shape, mirroring every prior new-state milestone
(CA v7.0, OR v8.0, ME v6.0, MD v11.0, VA v12.0):

1. **Nevada state foundation** — TIGER geofences (all tiers) → State of Nevada government
   (Governor + constitutional officers) → 63 state legislators (21 Senate + 42 Assembly) + federal
   delegation, all with 600×750 headshots. **Legislature compass stances are deferred to a
   follow-up milestone** (the OR v8.0→v9.0 split).
2. **Clark County metro deep-seeds** — government → roster → headshots (600×750) → evidence-only
   city-official compass stances, for the **Clark County Commission** (which governs the
   unincorporated Las Vegas Strip / Paradise / Spring Valley / Sunrise Manor / Enterprise),
   **City of Las Vegas**, **Henderson**, **North Las Vegas**, and **Boulder City**. Plus the
   **CCSD Board of Trustees** (5th-largest US district), NV 2026 elections + discovery pipeline,
   and a Nevada playbook retrospective.

Per city/government deliverable (the Tier 1 unit):
- (a) `essentials.governments` row + chamber(s) + elected roster (correct form of government,
      district vs. at-large structure, seat count — verified per government)
- (b) Official headshots at 600×750 in Supabase Storage; genuine gaps documented (no fabricated photos)
- (c) Evidence-only compass stances across all live topics — sequential research (one at a time),
      100% citation, no default values, honest blank spokes where no public record exists

## Milestone v18.0 Requirements

### Nevada Geofences

- [ ] **NV-GEO-01:** Nevada TIGER geofences loaded for all tiers (G4110 cities, G4020 counties,
      CDs, SLDU, SLDL); any NV address routes to the correct federal, state, county, and city
      representatives. Section-split scan clean.

### Nevada State & Federal Government

- [ ] **NV-STATE-01:** State of Nevada government seeded — Governor Lombardo + constitutional
      officers (Lt. Governor, Attorney General, Secretary of State, Treasurer, Controller) with
      chambers, offices, STATE_EXEC districts, and 600×750 headshots.
- [ ] **NV-STATE-02:** Nevada federal delegation seeded — 2 US Senators (Cortez Masto, Rosen) +
      4 US House reps with geofence-linked districts and 600×750 headshots.

### Nevada Legislature (seed + headshots; stances deferred)

- [ ] **NV-LEG-01:** 21 Nevada State Senators seeded with offices linked to SLDU districts and
      600×750 headshots. Compass stances deferred to a follow-up milestone.
- [ ] **NV-LEG-02:** 42 Nevada Assembly members seeded with offices linked to SLDL districts and
      600×750 headshots. Compass stances deferred to a follow-up milestone.

### Clark County Metro Deep-Seeds

- [ ] **CLARK-01:** Clark County Commission deep-seeded (7-member board governing the
      unincorporated Strip / Paradise / Spring Valley / Sunrise Manor / Enterprise) — government +
      roster + headshots + evidence-only stances.
- [ ] **CLARK-02:** City of Las Vegas deep-seeded (Mayor + City Council) — government + roster +
      headshots + evidence-only stances.
- [ ] **CLARK-03:** Henderson deep-seeded (NV's 2nd-largest city) — government + roster +
      headshots + evidence-only stances.
- [ ] **CLARK-04:** North Las Vegas deep-seeded — government + roster + headshots + evidence-only stances.
- [ ] **CLARK-05:** Boulder City deep-seeded — government + roster + headshots + evidence-only stances.

### Schools

- [ ] **CCSD-01:** Clark County School District Board of Trustees deep-seeded — board-district
      geofences (G5420 UNSD pattern, if applicable) + elected roster + headshots + evidence-only stances.

### Elections & Discovery

- [ ] **NV-ELEC-01:** NV 2026 elections seeded (Governor, all 42 Assembly seats, the ~10 Senate
      seats up, 4 US House races) + discovery pipeline armed (`discovery_jurisdictions` rows,
      cron active). NV's two US Senators are not up in 2026.

### Close-out

- [ ] **NV-RETRO-01:** Landing.jsx surfaces all covered NV jurisdictions; LOCATION-ONBOARDING.md
      updated with Nevada GOTCHAs + Nevada Quick Reference + Cities Onboarded rows; milestone
      audit written; milestone closed.

## Future Requirements (deferred)

- **NV legislature compass stances** — evidence-only stances for all 63 legislators (the OR
  v8.0→v9.0 follow-up pattern). Deferred to a dedicated follow-up milestone.
- Mesquite (Clark County's smallest incorporated city) — future Clark County wave.
- Washoe County / Reno–Sparks metro and rural Nevada cities — future Nevada waves.
- Nevada township/justice-court structure beyond the County Commission.

## Out of Scope

- Default/placeholder stance values (evidence-only rule — permanent exclusion).
- Party display on profiles (antipartisan design — permanent exclusion).
- Legislature stance research this milestone (explicitly deferred — see Future Requirements).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NV-GEO-01 | Phase 158 | Complete |
| NV-STATE-01 | Phase 159 | Pending |
| NV-STATE-02 | Phase 159 | Pending |
| NV-LEG-01 | Phase 160 | Pending |
| NV-LEG-02 | Phase 160 | Pending |
| CLARK-01 | Phase 161 | Pending |
| CLARK-02 | Phase 162 | Pending |
| CLARK-03 | Phase 163 | Pending |
| CLARK-04 | Phase 164 | Pending |
| CLARK-05 | Phase 165 | Pending |
| CCSD-01 | Phase 166 | Pending |
| NV-ELEC-01 | Phase 167 | Pending |
| NV-RETRO-01 | Phase 168 | Pending |
