# Requirements — v22.0 Tucson & Arizona

**Milestone goal:** Open Arizona as a fully-covered new state and deep-seed the Tucson metro — every
AZ resident routes to their federal / state / county / city representatives, and Tucson-metro city +
county officials carry a compass.

**Pattern:** New-state coverage milestone. Reuses the `LOCATION-ONBOARDING.md` playbook + NV (v18.0) /
OR-WashCo (v20.0) precedent. Foundation first (geofences → state/federal government → legislature seed),
then the local layer (Pima County → City of Tucson → 4 suburbs), then elections + close.

**Deep-seed unit (Pima County + 5 cities):** government + chamber → roster → 600×750 headshots →
evidence-only compass stances (one agent at a time, 100% cited, no defaults, honest blanks) → licensed
community banner → surface in `src/lib/coverage.js`.

---

## Milestone v22.0 Requirements

### Arizona Foundation

- [ ] **AZ-GEO-01**: Any Arizona address routes to the correct federal, state, county, and city
  representatives via TIGER geofences loaded for all tiers (G4110 cities, G4020 counties, CDs, SLDU,
  SLDL); section-split scan clean.
- [ ] **AZ-STATE-01**: State of Arizona government seeded — Gov. Katie Hobbs + constitutional officers
  (per AZ constitution: some voter-elected, some appointed) with chambers, offices, STATE_EXEC districts,
  and 600×750 headshots.
- [ ] **AZ-STATE-02**: Arizona federal delegation seeded — 2 US Senators (Kelly + Gallego) as
  NATIONAL_UPPER + 9 US House reps as NATIONAL_LOWER on CD geofences, all with 600×750 headshots.
- [ ] **AZ-LEG-01**: 30 Arizona state senators + 60 house reps (2 per legislative district) seeded with
  offices linked to SLDU/SLDL district geofences and 600×750 headshots. **Compass stances deferred by
  design** (NV v18.0 pattern) to a follow-up milestone.

### Tucson-Metro Local Layer

- [ ] **PIMA-01**: Pima County Board of Supervisors seeded as a standalone county government (5
  supervisor districts on LOCAL geofences), NOT nested under State of AZ — roster → 600×750 headshots →
  evidence-only compass stances → licensed community banner → surfaced in `src/lib/coverage.js`.
- [ ] **TUC-01**: City of Tucson deep-seed (flagship) — Mayor + 6 ward council members (verify
  ward-elected vs at-large and AZ partisan-election handling at plan time) → roster → 600×750 headshots →
  evidence-only compass stances → licensed community banner → surfaced in `src/lib/coverage.js`.
- [ ] **SUB-01**: Oro Valley deep-seed — government + roster → 600×750 headshots → evidence-only stances
  → licensed community banner → surfaced in `src/lib/coverage.js`.
- [ ] **SUB-02**: Marana deep-seed — same deep-seed unit.
- [ ] **SUB-03**: Sahuarita deep-seed — same deep-seed unit.
- [ ] **SUB-04**: South Tucson deep-seed — same deep-seed unit.

### Community Banners

- [ ] **BANR-01**: Every deep-seeded Tucson-metro jurisdiction (City of Tucson + Oro Valley + Marana +
  Sahuarita + South Tucson + Pima County) carries a licensed community banner — real street-scene or
  skyline photo, no AI-generated and no aerial imagery, sourced one at a time, processed to the banner
  spec (`scripts/banners/`), uploaded to Storage, and wired into `src/lib/buildingImages.js`. (Arizona
  STATE banner already exists in production — Downtown Phoenix skyline — no re-sourcing needed.)

### Elections

- [ ] **AZ-ELEC-01**: Arizona 2026 election race shells seeded (statewide + US House + legislative +
  Tucson-metro local), confirmed candidate slate populated where filing is closed, and
  `discovery_jurisdictions` rows armed with the AZ election-authority domain allowlist and cron.

### Retrospective & Close

- [ ] **AZ-RETRO-01**: `src/lib/coverage.js` chips reconciled (DB-honest purple chip for every metro
  jurisdiction carrying ≥1 stance), Arizona GOTCHAs + Quick Reference added to `LOCATION-ONBOARDING.md`,
  DB-verified milestone audit written, and milestone closed.

---

## Future Requirements (deferred)

- **AZ legislature compass stances** — evidence-only stances for all 90 AZ legislators (the OR v8→v9 /
  Utah v16.0 legislature-wide stance pattern); deferred to a dedicated follow-up milestone.
- **Tucson-metro school boards** — TUSD (Tucson Unified) + Amphitheater / Sunnyside / other metro
  district boards (G5420 geofences + roster + headshots, 0 stances by design); deferred to a later wave.
- **Additional Pima County / southern-AZ cities** — e.g. beyond the metro core; candidates for a future
  Arizona wave.

## Out of Scope

- **Phoenix / Maricopa County coverage** — this milestone is the Tucson metro only; Phoenix is a separate
  future milestone.
- **Statewide AZ city coverage beyond the Tucson metro** — deferred.
- Party affiliation on candidate display — antipartisan mission (project-wide, unchanged).

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AZ-GEO-01 | Phase 190 | Pending |
| AZ-STATE-01 | Phase 191 | Pending |
| AZ-STATE-02 | Phase 191 | Pending |
| AZ-LEG-01 | Phase 192 | Pending |
| PIMA-01 | Phase 193 | Pending |
| TUC-01 | Phase 194 | Pending |
| SUB-01 | Phase 195 | Pending |
| SUB-02 | Phase 196 | Pending |
| SUB-03 | Phase 197 | Pending |
| SUB-04 | Phase 198 | Pending |
| BANR-01 | Phases 193, 194, 195, 196, 197, 198 | Pending |
| AZ-ELEC-01 | Phase 199 | Pending |
| AZ-RETRO-01 | Phase 200 | Pending |

**Coverage:** 13/13 v22.0 requirements mapped. No orphans, no duplicates (BANR-01 intentionally spans
the 6 deep-seed phases as a cross-cutting deliverable).
