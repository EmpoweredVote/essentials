# Requirements: v20.0 Beaverton & Washington County, OR

**Defined:** 2026-06-30
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## Scope

Deep-seed the **Washington County / west-metro Portland** local layer onto Oregon's **already-complete
state foundation** (v8.0–v10.0: OR TIGER geofences for all tiers statewide, State of Oregon government,
90 legislators + federal delegation). This is a **brownfield local-layer deep-seed** — no geofence,
state, or federal work is required **except** loading the west-metro school-district G5420 geofences
(only the 6 Multnomah district geofences exist today). Any west-metro address already routes to its
correct federal/state/legislative representatives; this milestone adds the missing county, city, and
school-board slate.

Greenfield (zero seeded local government): Beaverton city (geo_id **4105350**), Washington County
(**41067**), and all west-metro cities — all already carry G4110/G4020 geofences. The 5 tiny Washington
County cities (King City, Durham, North Plains, Banks, Gaston) and their dedicated school districts
(Banks SD, Gaston SD) are **deferred** (sparse rosters / minimal online footprint).

Two-part shape:

1. **Washington County metro deep-seeds** — government → roster → 600×750 headshots → evidence-only
   compass stances, for the **Washington County Board of Commissioners** and **7 cities**: Beaverton
   (flagship), Hillsboro (county seat / largest), Tigard, Tualatin, Forest Grove, Sherwood, Cornelius.
2. **School boards + elections + close** — **5 school-district boards** (roster + headshots,
   **0 compass stances by design** — civic compass is not applied to school boards), 2026 local
   elections + discovery pipeline, Landing-page surfacing, playbook update, and a DB-verified
   milestone close.

Per city/government deliverable (the Tier 1 unit):
- (a) `essentials.governments` row + chamber(s) + elected roster (correct form of government,
      district vs. at-large structure, seat count — **verified per government** against the official site)
- (b) Official headshots at 600×750 in Supabase Storage; genuine gaps documented (no fabricated photos)
- (c) Evidence-only compass stances across all live topics — sequential research (one at a time),
      100% citation, no default values, honest blank spokes where no public record exists
      (school boards excluded by design)

## Milestone v20.0 Requirements

### West-Metro Geofences

- [ ] **WM-GEO-01:** West-metro school-district G5420 geofences loaded (TIGER UNSD pattern) for
      Beaverton SD 48J, Hillsboro SD 1J, Tigard-Tualatin SD 23J, Forest Grove SD 15, and Sherwood
      SD 88J; any west-metro address routes to its correct school district. Section-split scan clean.
      (City + county geofences already exist statewide.)

### Washington County Metro Deep-Seeds

- [ ] **WASH-01:** Washington County Board of Commissioners deep-seeded (Chair + commissioners) —
      government + roster + headshots + evidence-only stances. Standalone county government (not
      nested under State of Oregon), like the v18.0 Clark County Commission.
- [ ] **WASH-02:** City of Beaverton deep-seeded (Mayor + Council) — government + roster + headshots
      + evidence-only stances. **Form of government verified at plan time** (at-large/by-position vs
      wards; custom X00xx ward geofences only if by-ward, per the Portland X0012 precedent).
- [ ] **WASH-03:** City of Hillsboro deep-seeded (county seat / largest WashCo city) — government +
      roster + headshots + evidence-only stances.
- [ ] **WASH-04:** City of Tigard deep-seeded — government + roster + headshots + evidence-only stances.
- [ ] **WASH-05:** City of Tualatin deep-seeded — government + roster + headshots + evidence-only stances.
- [ ] **WASH-06:** City of Forest Grove deep-seeded — government + roster + headshots + evidence-only stances.
- [ ] **WASH-07:** City of Sherwood deep-seeded — government + roster + headshots + evidence-only stances.
- [x] **WASH-08:** City of Cornelius deep-seeded — government + roster + headshots + evidence-only stances.

### School Boards (roster + headshots; 0 compass stances by design)

- [ ] **WSCH-01:** Beaverton SD 48J Board deep-seeded — roster + headshots; board-district structure
      verified. (One of Oregon's largest districts.)
- [ ] **WSCH-02:** Hillsboro SD 1J Board deep-seeded — roster + headshots.
- [ ] **WSCH-03:** Tigard-Tualatin SD 23J Board deep-seeded — roster + headshots.
- [ ] **WSCH-04:** Forest Grove SD 15 Board deep-seeded — roster + headshots.
- [ ] **WSCH-05:** Sherwood SD 88J Board deep-seeded — roster + headshots.

### Elections

- [ ] **WM-ELEC-01:** 2026 local elections seeded for the new west-metro jurisdictions (Washington
      County + 7 cities + 5 school boards as applicable) with the discovery pipeline armed
      (discovery_jurisdictions rows, proximity-aware cron) against official Washington County /
      Oregon SOS sources.

### Retrospective & Close

- [ ] **WM-RETRO-01:** Landing surfaces all covered west-metro jurisdictions (`src/lib/coverage.js`
      Oregon block + Washington County in COVERAGE_COUNTIES, honest purple chips per real DB stance
      count); LOCATION-ONBOARDING.md updated with Washington County GOTCHAs + Cities Onboarded rows;
      DB-verified `.planning/v20.0-MILESTONE-AUDIT.md` written; v20.0 milestone closed in
      MILESTONES.md + STATE.md + PROJECT.md.

## Future Requirements (deferred)

- Tiny Washington County cities — King City, Durham, North Plains, Banks, Gaston (sparse rosters /
  minimal online footprint); candidate for a follow-up west-metro wave.
- Banks SD 13 and Gaston SD 511J school boards (serve the deferred tiny cities).
- Clackamas / east-metro expansion (Lake Oswego, Wilsonville, Oregon City, etc.).
- OR state-legislature compass stances were completed in v9.0; no legislature work in this milestone.

## Out of Scope

- Oregon state / federal / legislative seeding — already complete (v8.0–v10.0); not revisited.
- Statewide geofence loading — all OR city/county/CD/SLDU/SLDL tiers already loaded; only the
  west-metro **school-district** G5420 geofences are added.
- School-board compass stances — deferred by design (civic compass not applied to school boards;
  CCSD precedent).
- Default/placeholder stance values (evidence-only rule — permanent exclusion).
- Party display on profiles (antipartisan design — permanent exclusion).
- The parked v19.0 frontend redesign (dark-mode / banners) — separate milestone.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WM-GEO-01 | Phase 174 | Complete |
| WASH-01 | Phase 175 | Complete |
| WASH-02 | Phase 176 | Complete |
| WASH-03 | Phase 177 | Complete |
| WASH-04 | Phase 178 | Complete |
| WASH-05 | Phase 179 | Complete |
| WASH-06 | Phase 180 | Complete |
| WASH-07 | Phase 181 | Complete |
| WASH-08 | Phase 182 | Complete |
| WSCH-01 | Phase 183 | Complete |
| WSCH-02 | Phase 183 | Complete |
| WSCH-03 | Phase 184 | Pending |
| WSCH-04 | Phase 184 | Pending |
| WSCH-05 | Phase 184 | Pending |
| WM-ELEC-01 | Phase 185 | Pending |
| WM-RETRO-01 | Phase 186 | Pending |
