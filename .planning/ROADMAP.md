# Roadmap: Essentials — Empowered Vote

## Milestones

- ✅ **v2.0 Elections Page** - Phases 1-4 (shipped 2026-04-13)
- ✅ **v2.1 Claude Candidate Discovery** - Phases 5-7 (shipped 2026-04-25)
- ✅ **v3.0 Collin County TX** - Phases 12-21 (shipped 2026-05-12)
- ✅ **v3.1 Local Compass Expansion** - Phases 22-25 (shipped 2026-05-05)
- ✅ **v3.2 Legal Candidate Evaluation** - Phases 26-32 (shipped 2026-05-10)
- ✅ **v4.0 Compass Experience** - Phases 33-36 (shipped 2026-05-14)
- ✅ **v5.0 Location Onboarding Playbook** - Phases 37-47 (shipped 2026-05-18)
- ✅ **v6.0 Maine Essentials** - Phases 49-56 (shipped 2026-05-20)
- ✅ **v7.0 California** - Phases 57-70, 78 (shipped 2026-05-29)
- ✅ **v8.0 Oregon** - Phases 72-81 (shipped 2026-05-31)
- ✅ **v9.0 Oregon Legislature Stances** - Phase 82 (shipped 2026-05-31)
- ✅ **v10.0 Multnomah County & School Boards** - Phases 83-89 (shipped 2026-06-04)
- ✅ **v11.0 Maryland Essentials** - Phases 90-99 (shipped 2026-06-08)
- 🔄 **v12.0 Virginia Essentials** - Phases 100-106 (in progress)

---

# v12.0 Virginia Essentials

**Goal:** Onboard Virginia at full depth — geofences, state government, federal officials, Alexandria deep seed with school board, elections, and compass stances. Completes the DC/MD/VA trifecta.  
**Phases:** 100–106 (7 phases)  
**Requirements:** 19  
**Next migration:** 293

## Phase Summary

| # | Phase | Requirements | Goal |
|---|-------|-------------|------|
| 100 | 2/2 | Complete    | 2026-06-08 |
| 101 | 4/4 | Complete    | 2026-06-08 |
| 102 | VA Federal Officials | VA-FED-01, VA-FED-02 | Warner + Kaine + 11 House reps seeded |
| 103 | Alexandria Deep Seed | VA-DEEP-01..03 | Mayor + Council + ACPS board seeded with headshots |
| 104 | VA Headshots | VA-GOV-06 | 100% headshot coverage for all VA officials |
| 105 | VA 2026 Elections + Discovery | VA-ELECTIONS-01..03 | Warner Senate + 11 House races + discovery armed |
| 106 | VA Compass Stances | VA-STANCES-01..03 | Execs + US Senators + Alexandria officials stances |

## Phase Details

### Phase 100: VA TIGER Geofences

**Goal:** Load all Virginia geofence tiers so any VA address routes correctly.

**Requirements:** VA-GEO-01, VA-GEO-02, VA-GEO-03

**Key facts:**

- FIPS 51; verify TIGER loader key at census.gov (likely `cd119` as with OR/MD)
- Expected: G5200×11, G5210×40, G5220×100, G4110 ~180 cities, G4020 ~133 (95 counties + 38 independent cities)
- Alexandria dual-tier: geo_id=`5101000` (G4110) + geo_id=`51510` (G4020) — same pattern as Baltimore City
- districts.state casing: lowercase `va` for STATE/COUNTY, uppercase `VA` for NATIONAL

**Success criteria:**

1. geofence_boundaries rows loaded for all 5 MTFCC types
2. Alexandria appears twice: 5101000 (G4110) AND 51510 (G4020)
3. Richmond VA address returns STATE_UPPER + STATE_LOWER + NATIONAL tiers
4. Alexandria address returns LOCAL + STATE + NATIONAL tiers

---

### Phase 101: VA State Government DB

**Goal:** Seed State of Virginia government — 5 chambers, 3 executives, 40 senators, 100 delegates.

**Requirements:** VA-GOV-01, VA-GOV-02, VA-GOV-03, VA-GOV-04, VA-GOV-05

**Key facts:**

- All 3 executives are voter-elected (no legislature-elected officials) — is_appointed_position=false for all
- Governor: Abigail Spanberger (D, took office Jan 17 2026)
- LG: Ghazala Hashmi (D); AG: Jay Jones (D)
- VA Senate: 40 members elected Nov 2023, terms end 2027
- VA House of Delegates: 100 members elected Nov 2025, 64-36 D majority
- STATE_EXEC district_id = empty string (multi-position statewide districts)

**Success criteria:**

1. essentials.governments row for Virginia asserted
2. 5 chambers seeded
3. 3 executives with STATE_EXEC districts, is_appointed_position=false
4. 40 VA senators linked to SLDU districts
5. 100 VA delegates linked to SLDL districts
6. Section-split check returns 0 rows

---

### Phase 102: VA Federal Officials

**Goal:** Seed Warner + Kaine + 11 US House reps.

**Requirements:** VA-FED-01, VA-FED-02

**Key facts:**

- Warner (D) up for re-election Nov 2026; Kaine (D) term ends 2030
- 11 reps: Wittman (VA-1 R), Kiggans (VA-2 R), Scott (VA-3 D), McClellan (VA-4 D), Cline (VA-5 R), Griffith (VA-6 R), Vindman (VA-7 D), Beyer (VA-8 D), McGuire (VA-9 R), Subramanyam (VA-10 D), Walkinshaw (VA-11 D)
- Alexandria is in VA-8 (Don Beyer's district)
- NATIONAL_UPPER uniqueness: (district_id, politician_id) — not (district_id, chamber_id)

**Success criteria:**

1. Warner + Kaine seeded as NATIONAL_UPPER
2. 11 House reps seeded as NATIONAL_LOWER linked to CD geofences
3. Alexandria address returns Beyer (VA-8) as US House rep

**Plans:** 1 plan
Plans:

- [ ] 102-01-PLAN.md — Seed 11 VA US House reps via migration 311; assert Warner/Kaine pre-seeded

---

### Phase 103: Alexandria Deep Seed

**Goal:** Seed Alexandria city government and ACPS school board.

**Requirements:** VA-DEEP-01, VA-DEEP-02, VA-DEEP-03

**Key facts:**

- Alexandria is an independent city — no county layer above it
- Mayor: Alyia Gaskins (LOCAL_EXEC); 6 at-large council (LOCAL): Bagley, Aguirre, Chapman, Elnoubi, Greene, Marks
- ACPS: 9 board members across 3 school districts; G5420 TIGER UNSD pattern (v10.0)
- Board Chair: Michelle Rief; VC: Christopher Harris; members: Abdalla, Beaty, Carmichael Booz, Kenley, Reyna, Scioscia, Simpson Baird
- Headshot sources: alexandriava.gov (council), acps.k12.va.us/school-board/members-of-the-school-board (ACPS)

**Success criteria:**

1. Mayor + 6 council seeded under geo_id=5101000
2. ACPS 9 board members seeded with SCHOOL district_type
3. Alexandria address returns LOCAL section with all 7 city officials
4. Council headshots at 600×750; ACPS best-effort

---

### Phase 104: VA Headshots

**Goal:** 100% headshot coverage for all VA state officials.

**Requirements:** VA-GOV-06

**Key facts:**

- House delegates: `https://vga.virginia.gov/delegate_photos/{H0000}.jpg` — clean bulk-fetchable pattern
- Senate: `https://apps.senate.virginia.gov/Senator/images/member_photos/{LastName}{district}` — no file extension, verify at phase time
- politician_images.type must be 'default' (not 'headshot')
- Crop 4:5 first, then resize to 600×750 — never stretch

**Success criteria:**

1. 3 exec + 40 senators + 100 delegates + 2 US senators + 11 House reps = 156 officials with type='default' headshots
2. Zero missing non-vacant officials on headshot verification query

---

### Phase 105: VA 2026 Elections + Discovery

**Goal:** Seed 2026 election rows, Warner Senate + 11 House races, arm discovery, add Landing entry.

**Requirements:** VA-ELECTIONS-01, VA-ELECTIONS-02, VA-ELECTIONS-03

**Key facts:**

- Primary: 2026-08-04; General: 2026-11-03
- 12 races: 1 US Senate (Warner) + 11 US House (all VA districts)
- NO state legislature races in 2026 (HoD was Nov 2025, Senate is 2027)
- Landing.jsx: Alexandria + VA state browse entries

**Success criteria:**

1. 2 election rows in essentials.elections
2. 12 race rows, all with non-null office_ids
3. discovery_jurisdictions row active for VA
4. Landing.jsx shows Virginia entry

---

### Phase 106: VA Compass Stances

**Goal:** Evidence-only compass stances for VA executives, US Senators, Alexandria officials.

**Requirements:** VA-STANCES-01, VA-STANCES-02, VA-STANCES-03

**Key facts:**

- Run ONE politician at a time — never parallel
- No default values — blank spoke = no evidence found (never Neutral/Likely as fallback)
- Priority: Spanberger → Hashmi → Jones → Warner → Kaine → Alexandria council
- Spanberger has rich record (former US House rep VA-7, 2019-2025)
- Warner has 18 years Senate record

**Success criteria:**

1. ≥15 stances for Spanberger; ≥10 each for Hashmi and Jones
2. ≥15 stances each for Warner and Kaine
3. Best-effort for Alexandria council (skip with no public record = acceptable)
4. 100% citation rate — zero uncited stance values
5. Compass renders on Spanberger profile

---

## Coverage Matrix

| Req | Phase |
|-----|-------|
| VA-GEO-01 | 100 |
| VA-GEO-02 | 100 |
| VA-GEO-03 | 100 |
| VA-GOV-01 | 101 |
| VA-GOV-02 | 101 |
| VA-GOV-03 | 101 |
| VA-GOV-04 | 101 |
| VA-GOV-05 | 101 |
| VA-FED-01 | 102 |
| VA-FED-02 | 102 |
| VA-GOV-06 | 104 |
| VA-DEEP-01 | 103 |
| VA-DEEP-02 | 103 |
| VA-DEEP-03 | 103 |
| VA-ELECTIONS-01 | 105 |
| VA-ELECTIONS-02 | 105 |
| VA-ELECTIONS-03 | 105 |
| VA-STANCES-01 | 106 |
| VA-STANCES-02 | 106 |
| VA-STANCES-03 | 106 |

All 19 requirements covered ✓
