# Requirements: v17.0 LA County City Coverage — Wave 2

**Defined:** 2026-06-19
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## Scope

Deep-seed the 15 largest LA County cities not yet covered, each to full Tier 1 depth:
**government structure → elected roster → headshots (600×750) → evidence-only compass stances.**
TIGER G4110 geofences already exist for all 15 (loaded in v7.0), so no geofence work is in
scope. These cities are greenfield in the DB — no government row, no officials — so each needs
the full v7.0 city-deep-seed treatment, not the v15.0 stances-only shortcut.

Per-city deliverable (the unit of one phase):
- (a) `essentials.governments` row + chamber(s) + elected roster (mayor + council, correct
      form of government, district vs. at-large structure, seat count — verified per city)
- (b) Official headshots at 600×750 in Supabase Storage; genuine gaps documented (no fabricated photos)
- (c) Evidence-only compass stances across all live topics — sequential research (one at a time),
      100% citation, no default values, honest blank spokes where no public record exists

## Milestone v17.0 Requirements

### Tier A — 100k+ population

- [x] **LBCH-01:** Long Beach (geo_id 0643000) deep-seeded — government + roster + headshots + evidence-only stances ✅ 2026-06-19
- [x] **SCLR-01:** Santa Clarita (0669088) deep-seeded — government + roster + headshots + evidence-only stances ✅ 2026-06-19
- [x] **GLEN-01:** Glendale (0630000) deep-seeded — government + roster + headshots + evidence-only stances ✅ 2026-06-19
- [x] **LANC-01:** Lancaster (0640130) deep-seeded — government + roster + headshots + evidence-only stances ✅ 2026-06-20 (reconcile: geo_id+dup-chamber+link repair; retired Malhi/Crist, seated White/Castellanos; 4/5 headshots, Mann gap; 13 stances)
- [ ] **PLMD-01:** Palmdale (0655156) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **POMO-01:** Pomona (0658072) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **TORR-01:** Torrance (0680000) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **PASA-01:** Pasadena (0656000) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **DWNY-01:** Downey (0619766) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **ELMN-01:** El Monte (0622230) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **WCOV-01:** West Covina (0684200) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **INGL-01:** Inglewood (0636546) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **BURB-01:** Burbank (0608954) deep-seeded — government + roster + headshots + evidence-only stances
- [ ] **NRWK-01:** Norwalk (0652526) deep-seeded — government + roster + headshots + evidence-only stances

### Tier B — 70k–100k

- [ ] **BLFL-01:** Bellflower (0604982) deep-seeded — government + roster + headshots + evidence-only stances

### Close-out

- [ ] **LAC2-RETRO-01:** Landing.jsx verified to surface all 15 new cities; LOCATION-ONBOARDING.md updated with any LA-County-Wave-2 GOTCHAs + Cities Onboarded rows; milestone audit + close

## Future Requirements (deferred)

- LA County cities below ~70k pop (Montebello, Pico Rivera, Baldwin Park, Redondo Beach, Lynwood, Monterey Park, Huntington Park, …) — future LA County wave
- 2026 elections / discovery pipeline for these cities — not in scope this milestone
- School districts overlapping these cities (separate from city councils)

## Out of Scope

- Geofence work (G4110 boundaries already loaded in v7.0)
- Party display on profiles (antipartisan design — permanent exclusion)
- Default/placeholder stance values (evidence-only rule — permanent)

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LBCH-01 | 142 | Complete |
| SCLR-01 | 143 | Complete |
| GLEN-01 | 144 | Complete |
| LANC-01 | 145 | Pending |
| PLMD-01 | 146 | Pending |
| POMO-01 | 147 | Pending |
| TORR-01 | 148 | Pending |
| PASA-01 | 149 | Pending |
| DWNY-01 | 150 | Pending |
| ELMN-01 | 151 | Pending |
| WCOV-01 | 152 | Pending |
| INGL-01 | 153 | Pending |
| BURB-01 | 154 | Pending |
| NRWK-01 | 155 | Pending |
| BLFL-01 | 156 | Pending |
| LAC2-RETRO-01 | 157 | Pending |
