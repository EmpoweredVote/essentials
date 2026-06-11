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
- ✅ **v12.0 Virginia Essentials** - Phases 100-106 (shipped 2026-06-10)
- 🔄 **v13.0 Massachusetts Expanded** - Phases 107-116 (in progress)

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
| 102 | 1/1 | Complete    | 2026-06-08 |
| 103 | 3/3 | Complete   | 2026-06-09 |
| 104 | 5/5 | Complete    | 2026-06-09 |
| 105 | 3/3 | Complete    | 2026-06-09 |
| 106 | 8/8 | Complete    | 2026-06-10 |

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

- [x] 102-01-PLAN.md — Seed 11 VA US House reps via migration 311; assert Warner/Kaine pre-seeded

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

**Plans:** 3/3 plans complete
Plans:
**Wave 1**

- [x] 103-01-PLAN.md — Alexandria city government (Mayor Gaskins + 6 council) via migration 312

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 103-02-PLAN.md — ACPS school board (9 members + G5420 geofence) via migration 313
- [x] 103-03-PLAN.md — Alexandria + ACPS headshots via migration 314

---

### Phase 104: VA Headshots

**Goal:** 100% headshot coverage for all VA state officials.

**Requirements:** VA-GOV-06

**Key facts:**

- House delegates: `https://house.vga.virginia.gov/delegate_photos/{H####}.jpg` (H#### is the VGA internal member ID per HD→H-ID table in 104-RESEARCH.md; NOT the district number)
- Senate: `https://apps.senate.virginia.gov/Senator/images/member_photos/{TitleCaseLastName}{district}.jpg` (no zero-padding, case-sensitive, special-case keys for Mulchi9/Williams Graves21/Carroll Foy33/etc.)
- Federal: `https://unitedstates.github.io/images/congress/original/{bioguide}.jpg` for 12 of 13 (congress.gov blocks programmatic access); Walkinshaw via walkinshaw.house.gov
- HD-20 is vacant (-5120020) — skipped entirely
- politician_images.type must be 'default' (not 'headshot')
- Crop 4:5 first, then resize to 600×750 Lanczos q90 — never stretch
- Migration 315 is AUDIT-ONLY (applied via psql, NOT via Supabase MCP)

**Success criteria:**

1. 3 exec + 40 senators + 99 delegates (HD-20 vacant) + 2 US senators + 11 House reps = 155 officials with type='default' headshots
2. Zero missing non-vacant officials on headshot verification query
3. HD-20 (external_id -5120020) confirmed absent from politician_images

**Plans:** 4/5 plans executed
Plans:
**Wave 1** *(all 4 scripts run in parallel — distinct source domains, distinct rosters, distinct files)*

- [x] 104-01-PLAN.md — VA execs headshots (3 officials: Spanberger, Hashmi, Jones) via `_tmp-va-execs-headshots.py`
- [x] 104-02-PLAN.md — VA state senators headshots (40 officials) via `_tmp-va-senators-headshots.py`
- [x] 104-03-PLAN.md — VA House delegates headshots (99 officials, HD-20 skip) via `_tmp-va-delegates-headshots.py`
- [x] 104-04-PLAN.md — VA federal officials headshots (13 officials) via `_tmp-va-federal-headshots.py`

**Wave 2** *(blocked on all of Wave 1 completing)*

- [x] 104-05-PLAN.md — AUDIT-ONLY migration 315_va_headshots.sql + apply via psql + final 155-row verification

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

**Plans:** 3/3 plans complete
Plans:
**Wave 1**

- [x] 105-01-PLAN.md — VA 2026 elections seed (migration 322: 2 rows)

**Wave 2** *(blocked on Wave 1 completion — apply requires migration 322 election rows)*

- [x] 105-02-PLAN.md — VA 2026 race rows (migration 324: 1 Senate + 11 House, 12 rows)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 105-03-PLAN.md — VA discovery_jurisdictions (migration 325) + Landing.jsx Alexandria entry

---

### Phase 106: VA Compass Stances

**Goal:** Evidence-only compass stances for VA executives, US Senators, Alexandria officials.

**Requirements:** VA-STANCES-01, VA-STANCES-02, VA-STANCES-03

**Key facts:**

- Run ONE politician at a time — never parallel (D-08)
- No default values — blank spoke = no evidence found (never Neutral/Likely as fallback)
- Priority: Spanberger → Hashmi → Jones → Warner → Kaine → Alexandria council → ACPS board
- Spanberger has rich record (former US House rep VA-7, 2019-2025)
- Warner has 18 years Senate record
- Per-individual migration files starting at 326; apply immediately per-person (D-06)
- 5-minute sliding cap for Alexandria/ACPS members (D-03/D-04)
- 100% citation rate required (D-10)

**Success criteria:**

1. ≥15 stances for Spanberger; ≥10 each for Hashmi and Jones
2. ≥15 stances each for Warner and Kaine
3. Best-effort for Alexandria council + ACPS board (skip with no public record = acceptable)
4. 100% citation rate — zero uncited stance values
5. Compass renders on Spanberger profile

**Plans:** 8/8 plans complete
Plans:
**Wave 1**

- [x] 106-01-PLAN.md — Spanberger stances (migration 326): research + write + apply + verify

**Wave 2** *(blocked on Wave 1 completion — D-08 sequential)*

- [x] 106-02-PLAN.md — Hashmi stances (migration 327)

**Wave 3** *(blocked on Wave 2)*

- [x] 106-03-PLAN.md — Jones stances (migration 328) + close VA-STANCES-01

**Wave 4** *(blocked on Wave 3)*

- [x] 106-04-PLAN.md — Warner stances (migration 329)

**Wave 5** *(blocked on Wave 4)*

- [x] 106-05-PLAN.md — Kaine stances (migration 330) + close VA-STANCES-02

**Wave 6** *(blocked on Wave 5)*

- [x] 106-06-PLAN.md — Alexandria council batch (migrations 331-337, 7 members, 5-min sliding cap each)

**Wave 7** *(blocked on Wave 6)*

- [x] 106-07-PLAN.md — ACPS board batch (migrations 338-346, 9 members, 5-min sliding cap each) + close VA-STANCES-03

**Wave 8** *(blocked on Wave 7)*

- [x] 106-08-PLAN.md — Phase-wide closure verification + compass render checkpoint + final SUMMARY

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

---

# v13.0 Massachusetts Expanded

**Goal:** Complete Massachusetts to full depth — fill the town routing gap (293 G4040 COUSUB boundaries), stances for all 217+ officials across 5 sequential batches (including Boston city officials), Boston deep seed, MA 2026 elections, and Tier 2 city incumbents.  
**Phases:** 107–116 (10 phases)  
**Requirements:** 17  
**Next migration:** 347

## Phase Summary

| # | Phase | Requirements | Goal |
|---|-------|-------------|------|
| 107 | 1/1 | Complete   | 2026-06-10 |
| 108 | 3/3 | Complete   | 2026-06-10 |
| 109 | 6/6 | Complete   | 2026-06-11 |
| 110 | MA-ELECTIONS-01, MA-ELECTIONS-02, MA-ELECTIONS-03, MA-ELECTIONS-04 | Not started | Seed MA 2026 elections, 200+ race rows, arm discovery |
| 111 | MA-STANCES-01, MA-STANCES-02 | Not started | Evidence-only stances: 6 execs + 11 federal officials (17 total, sequential) |
| 112 | MA-STANCES-03 | Not started | Evidence-only stances: all 40 MA state senators (sequential) |
| 113 | MA-STANCES-04 (Wave 1) | Not started | Evidence-only stances: MA House reps SD-01 through SD-80 (~80 officials, sequential) |
| 114 | MA-STANCES-04 (Wave 2) | Not started | Evidence-only stances: MA House reps HD-81 through HD-160 (~80 officials, sequential) — closes MA-STANCES-04 |
| 115 | MA-STANCES-05 | Not started | Evidence-only stances: Mayor Wu + 13 Boston City Councillors + School Committee best-effort |
| 116 | MA-RETRO-01 | Not started | Playbook retrospective: MA town/COUSUB GOTCHAs + Boston patterns + Cities Onboarded entries |

## Phase Details

### Phase 107: MA Town Geofences

**Goal:** Load 293 G4040 COUSUB town boundaries so any Massachusetts address — whether in a city or a town — routes to correct state and federal representatives via PostGIS.

**Requirements:** MA-GEO-01, MA-GEO-02

**Key facts:**

- FIPS 25; geofence_boundaries.state='25'
- 58 G4110 cities already loaded in v5.0 — do NOT reload, assert only
- 293 new G4040 COUSUB town rows (previously deferred, v5.0 decision documented in Key Decisions table)
- Boston geo_id='2507000' is already present (G4110) — town loader must skip it
- districts.state casing: lowercase `ma` for STATE/COUNTY tiers; uppercase `MA` for NATIONAL tiers (same pattern as OR/MD/VA)
- MTFCC pre-flight assertion: confirm G4040 rows are absent before loading (zero-row guard)
- After load: run section-split check (zero rows = clean)

**Success criteria:**

1. 293 new G4040 COUSUB rows inserted into geofence_boundaries (state='25', mtfcc='G4040')
2. A town address (e.g. Concord, MA or Brookline, MA) returns correct STATE_UPPER + STATE_LOWER + NATIONAL tiers
3. Boston address still routes correctly (G4110 row unchanged)
4. Section-split check returns 0 rows after load

**Plans:** 1/1 plans complete

Plans:

- [x] 107-01-PLAN.md — Verify 293 G4040 town geofences, PIP routing, section-split; close MA-GEO-01 + MA-GEO-02 (verification-only; rows already loaded v5.0)

---

### Phase 108: Boston Deep Seed

**Goal:** Seed Boston city government (Mayor + 13 City Councillors + School Committee) with headshots so a Boston address shows a complete LOCAL section.

**Requirements:** MA-DEEP-01, MA-DEEP-02, MA-DEEP-03

**Key facts:**

- Boston geo_id='2507000' (G4110, already in geofences from v5.0)
- Mayor: Michelle Wu (LOCAL_EXEC)
- City Council: **9 single-member district seats + 4 at-large seats** (NOT all at-large — research corrected CONTEXT.md D-07). 9 district geofences loaded from ArcGIS FeatureServer (mtfcc='X0013', geo_id='boston-ma-council-district-{N}'); 4 at-large + Mayor link to geo_id='2507000'
- District council election_method='fptp'; at-large='plurality_at_large'; Boston RCV bill passed May 2025 but NOT yet in effect
- Boston School Committee: **7 APPOINTED members** (NOT 13 elected — the Nov 2024 ballot-measure claim is false; appointed model since 1991; is_appointed=true override of D-16). district_type=SCHOOL, BPS geo_id='2502790' (NCES LEAID 02790)
- Boston School Committee G5420 geofence: direct INSERT in Plan 02 migration (no MA G5420 loader); external IDs -2502790001..-2502790007
- Do NOT seed Mah Noor (non-voting student rep) or Lena Parvex (staff)
- Migrations: 347=city government + council loader, 348=school committee, 349=headshots
- Headshot sources: boston.gov/departments/city-council (council, 14 verified URLs), bostonpublicschools.org (school committee, best-effort)
- Headshots: 600×750, Lanczos, q90; crop 4:5 first — never stretch
- politician_images.type must be 'default'

**Success criteria:**

1. Mayor Wu + 13 City Councillors (4 at-large + 9 district) seeded; at-large + Mayor link to geo_id='2507000', district councillors link to boston-ma-council-district-{N}
2. Boston School Committee 7 appointed members seeded with SCHOOL district_type (geo_id='2502790', is_appointed=true)
3. A Boston address returns a LOCAL section listing Mayor Wu + the resident's district councillor + 4 at-large councillors
4. All available officials have headshots at 600×750 in politician_photos bucket

**Plans:** 3/3 plans complete
Plans:
**Wave 1** *(no file overlap — run in parallel)*

- [x] 108-01-PLAN.md — Boston city government: ArcGIS council district geofence loader (X0013) + migration 347 (Mayor Wu + 4 at-large + 9 district councillors, 11 districts, City Council chamber)
- [x] 108-02-PLAN.md — Boston School Committee: migration 348 (7 appointed members, SCHOOL district geo_id='2502790', G5420 geofence)

**Wave 2** *(blocked on both Wave 1 plans — needs seeded politicians)*

- [x] 108-03-PLAN.md — Boston headshots: migration 349 (14 council + best-effort SC, 600×750, type='default')
**UI hint**: no

---

### Phase 109: MA Tier 2 Cities

**Goal:** Seed incumbents for Worcester (#2) and four other Tier 2 cities so those city addresses return a populated LOCAL section.

**Requirements:** MA-TIER2-01, MA-TIER2-02

**Key facts:**

- Worcester (#2): Mayor Joseph Petty + City Council (11 members); geo_id 2582000
- Springfield (#3): Mayor Domenic Sarno + City Council (14 officials); geo_id 2567000
- Lowell (#4): City Manager Golden + council-elected Mayor Gitschier + City Council (Plan E council-manager — no LOCAL_EXEC); geo_id 2537000
- Brockton (#5): Mayor Moises M. Rodrigues (NOT Robert Sullivan — Sullivan lost Nov 2025; Rodrigues inaugurated 2026-01-05) + City Council; geo_id 2509000
- Quincy (#6): Mayor Thomas Koch + City Council (all-new Jan 2026 roster); geo_id 2555745
- All 5 cities are G4110 places already in geofence_boundaries from v5.0 — assert geo_ids before seeding
- Headshots: best-effort from official city websites; 600×750 where available
- Multi-tier INSERT then UPDATE by (chamber_id, title) pattern (v6.0 Maine lesson)

**Success criteria:**

1. A Worcester address returns a LOCAL section with Mayor Petty + city councillors
2. Springfield, Lowell, Brockton, and Quincy each return LOCAL sections with Mayor + council incumbents
3. Best-effort headshots uploaded; gaps for unavailable photos documented

**Plans:** 6/6 plans complete

Plans:
**Wave 1** *(no file overlap — 5 independent city migrations run in parallel)*

- [x] 109-01-PLAN.md — Worcester government (migration 351: Mayor Petty + 11-member council)
- [x] 109-02-PLAN.md — Springfield government (migration 352: Mayor Sarno + 13 councillors)
- [x] 109-03-PLAN.md — Lowell government (migration 353: Plan E council-manager — City Manager + Mayor + 10 councillors, no LOCAL_EXEC)
- [x] 109-04-PLAN.md — Brockton government (migration 354: Mayor Rodrigues + 11 councillors)
- [x] 109-05-PLAN.md — Quincy government (migration 355: Mayor Koch + 9 councillors)

**Wave 2** *(blocked on all 5 city migrations — needs seeded politician_ids)*

- [x] 109-06-PLAN.md — MA Tier 2 headshots (script + migration 356: best-effort 600x750 across all 5 cities)

---

### Phase 110: MA 2026 Elections + Discovery

**Goal:** Seed MA 2026 election rows, 200+ legislative race scaffold, Governor + US Senate races with known candidates, and arm the discovery pipeline.

**Requirements:** MA-ELECTIONS-01, MA-ELECTIONS-02, MA-ELECTIONS-03, MA-ELECTIONS-04

**Key facts:**

- Primary: 2026-09-02; General: 2026-11-03
- Governor: Maura Healey (seeking re-election, open filed); US Senate: Ed Markey (seeking re-election)
- All 200 legislative races (40 Senate + 160 House) need scaffold race rows with non-null office_ids
- MA legislature already has offices linked to districts from v5.0 — office_id JOIN is available
- discovery_jurisdictions row for MA statewide (geo_id='25'): cron_active=true; election authority is sec.state.ma.us
- Landing.jsx: Boston city browse entry + MA state browse entry (if not already present from v5.0)
- Race rows must use existing MA election_ids; do not create duplicate election rows if v5.0 already seeded elections

**Success criteria:**

1. 2 election rows exist in essentials.elections (primary 2026-09-02 + general 2026-11-03); assert or insert
2. Governor + US Senate race rows exist with Healey/Markey as incumbent candidates
3. All 200 legislative race rows (40 Senate + 160 House) present with non-null office_ids
4. discovery_jurisdictions row active for MA (geo_id='25', cron_active=true)

**Plans:** 3 plans
Plans:
**Wave 1**

- [x] 110-01-PLAN.md — Assert MA elections + discovery rows; fix NULL office_id on 2 Senate races; seed Governor + 7 US House races (migration 357)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 110-02-PLAN.md — Seed 200 MA legislative races via CTE-JOIN (40 Senate + 160 House, migration 358)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 110-03-PLAN.md — Add Boston city entry to COVERAGE_CITIES in Landing.jsx (no migration)

---

### Phase 111: MA Stances — Executives + Federal Officials

**Goal:** Evidence-only compass stances for all 6 MA executives and all 11 MA federal officials (17 total), researched and applied one at a time.

**Requirements:** MA-STANCES-01, MA-STANCES-02

**Key facts:**

- Run ONE politician at a time — never parallel (project constraint, D-08 equivalent)
- No default values — blank spoke = no evidence; never Neutral/Likely as fallback
- 6 executives: Governor Healey, LG Kim Driscoll, AG Andrea Campbell, Treasurer Goldberg, Auditor DiZoglio, SoS Galvin
- 11 federal: Senators Markey + Warren + 9 US House reps (MA-01 through MA-09)
- Healey and Warren have rich public records; Markey has 40+ year Congressional record
- Per-individual migration files starting at 347; apply immediately after each research session
- 100% citation rate required — zero uncited values
- Migration numbering: 347 = first exec; continues sequentially through all 17

**Success criteria:**

1. ≥15 stances each for Healey, Warren, and Markey (high-public-record officials)
2. ≥8 stances each for remaining executives and federal reps
3. 100% citation rate across all 17 officials
4. Compass renders correctly on Healey profile (human-verified)

**Plans:** TBD

---

### Phase 112: MA Stances — State Senate

**Goal:** Evidence-only compass stances for all 40 MA state senators, applied sequentially one at a time.

**Requirements:** MA-STANCES-03

**Key facts:**

- 40 senators across 40 SLDU districts; all seeded with offices in v5.0
- Sequential research: one senator at a time — never parallel
- Batch into 2-3 plan files (e.g. SD-01 through SD-20, SD-21 through SD-40) to keep plan files manageable
- 100% citation rate required; blank spoke acceptable for senators with no public record
- Migration numbering continues from Phase 111's last migration
- Apply each migration immediately after research — do not accumulate

**Success criteria:**

1. politician_answers rows present for all 40 MA senators
2. 100% citation rate — zero uncited stance values
3. Compass renders on at least one senator profile (human-verified)
4. SD with no public evidence has blank spokes (not defaulted values)

**Plans:** TBD

---

### Phase 113: MA Stances — House Wave 1

**Goal:** Evidence-only compass stances for MA House representatives districts 1–80, applied sequentially.

**Requirements:** MA-STANCES-04

**Key facts:**

- MA House has 160 representatives across 160 SLDL districts; Wave 1 = first 80
- Sequential research: one rep at a time — never parallel
- House reps typically have shorter public records than senators; blank spokes expected for newer/rural members
- Batch into 2-4 plan files (e.g. HD-01 through HD-40, HD-41 through HD-80)
- 100% citation rate required for values present; absence of values is acceptable
- Migration numbering continues from Phase 112's last migration

**Success criteria:**

1. politician_answers rows attempted for all 80 House reps in Wave 1
2. 100% citation rate on all values written (no uncited stance values)
3. Blank spokes for reps with no public evidence documented as expected outcome

**Plans:** TBD

---

### Phase 114: MA Stances — House Wave 2

**Goal:** Evidence-only compass stances for MA House representatives districts 81–160, closing MA-STANCES-04.

**Requirements:** MA-STANCES-04 (Wave 2 — closes requirement)

**Key facts:**

- Wave 2 = house districts 81–160 (~80 reps)
- Same sequential-one-at-a-time constraint as Wave 1
- Batch into 2-4 plan files
- After final rep: run full MA stance count verification (SELECT COUNT(*) ... WHERE politician_id IN (MA house reps))
- MA-STANCES-04 closes when Wave 2 is complete and verified
- Migration numbering continues from Phase 113's last migration

**Success criteria:**

1. politician_answers rows attempted for all 80 House reps in Wave 2
2. 100% citation rate on all values written
3. Total MA politician_answers count verified after Wave 2 completes
4. Compass renders on at least one House rep profile (human-verified)

**Plans:** TBD

---

### Phase 115: Boston Stances

**Goal:** Evidence-only compass stances for Mayor Wu + all 13 Boston City Councillors; best-effort for Boston School Committee members.

**Requirements:** MA-STANCES-05

**Key facts:**

- Must run AFTER Phase 108 (Boston deep seed) — politician_ids must exist in DB first
- Run ONE politician at a time — never parallel
- Mayor Wu: very public record (former City Councillor + Mayor since 2022); expect 10+ stances
- 13 City Councillors: varying public records; several well-known (Janey, Flynn, Murphy); blank spokes acceptable for newer members
- Boston School Committee: 13 members elected November 2024 — most will have thin records; treat as best-effort (5-minute cap per member)
- 100% citation rate required on all values written; no uncited values
- Migration numbering continues from Phase 114's last migration

**Success criteria:**

1. ≥10 stances for Mayor Wu; ≥3 stances each for councillors with public record
2. 100% citation rate on all values written
3. Blank spokes for officials with no findable public record (documented as expected)
4. Compass renders on Mayor Wu profile (human-verified)

**Plans:** TBD

---

### Phase 116: MA Playbook Retrospective

**Goal:** Update LOCATION-ONBOARDING.md with MA town/COUSUB routing patterns and Boston deep seed learnings; close v13.0.

**Requirements:** MA-RETRO-01

**Key facts:**

- Primary GOTCHAs to document: G4040 COUSUB load sequence (skip already-loaded G4110 places), COUSUB vs. city dual-tier behavior, Boston at-large council model (no district seats — differs from Cambridge)
- Boston School Committee elected-since-2024 pattern (was appointed before ballot measure)
- Massachusetts Quick Reference block: FIPS 25, primary date, key geo_ids, headshot sources
- Cities Onboarded table: add rows for Massachusetts (state) and Boston (city)
- 6 LOCATION-ONBOARDING.md templates: update any that need MA-specific callouts

**Success criteria:**

1. LOCATION-ONBOARDING.md contains at least 3 new MA-specific [GOTCHA] callouts
2. Massachusetts Quick Reference block added (FIPS, dates, key URLs, geo_ids)
3. Cities Onboarded table has new rows for Massachusetts state + Boston
4. v13.0 milestone marked complete in STATE.md and ROADMAP.md

**Plans:** TBD

---

## Coverage Matrix

| Req | Phase |
|-----|-------|
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

All 17 requirements covered ✓
