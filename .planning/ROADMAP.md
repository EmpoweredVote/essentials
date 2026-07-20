# Roadmap: Essentials â Empowered Vote

Per-milestone phase detail is archived under `.planning/milestones/v{X.Y}-ROADMAP.md` at milestone
close. This file is the milestone index; the active milestone is expanded in full below, and
shipped milestones are collapsed into `<details>` blocks.

## Milestones

- 🔨 **v23.0 Educators & Judges Tabs** — Phases 207–211 (active, opened 2026-07-17; runs alongside held v22.0 close)
- ð§ **v22.0 Tucson & Arizona** â Phases 190â203 (substantively complete; Phases 200 + 206 held for close until 2026-07-21; 201-203 appended Coachella Valley, CA)
- â **v21.0 Smart Banners** â Phases 187â189 (shipped 2026-07-08)
- â **v20.0 West-Metro Washington County, OR** â Phases 174â186 (shipped 2026-07-05)
- â **v18.0 Las Vegas & Clark County, NV** â Phases 158â168, 173 (shipped 2026-06-30)
- â **v19.0 Dark-Mode Redesign & Section Banners** â Phases 169â172 (shipped 2026-06-28, formally closed 2026-07-05)
- â **v17.0 LA County City Coverage Wave 2** â Phases 142â157 (shipped 2026-06-22)
- â earlier milestones v2.0âv16.0 â see `.planning/milestones/` archives + `MILESTONES.md`

## Roadmap: v22.0 Tucson & Arizona

### Overview

Arizona opens as a fully-covered new state, then the Tucson metro gets deep-seeded on top of that
foundation â the same shape as v18.0 (Las Vegas & Clark County, NV) and v20.0 (Beaverton & Washington
County, OR). Geofences load first (every tier), then state + federal government, then the 90-member
legislature (seed + headshots only â compass stances deferred by design). With the foundation in place,
Pima County and City of Tucson (flagship) deep-seed with full roster + headshots + evidence-only
compass stances + a licensed community banner, followed by four smaller metro suburbs (Oro Valley,
Marana, Sahuarita, South Tucson) at the same depth. The milestone closes with 2026 election race
shells + discovery armed, and a playbook retrospective that reconciles `coverage.js` and folds Arizona
GOTCHAs into `LOCATION-ONBOARDING.md`. Phase numbering continues from v21.0 (closed at 189) â this
milestone starts at **Phase 190**.

### Milestone-wide conventions (carry into every phase)

- **New-state foundation first** â no Arizona geofence/state/federal/legislature data exists yet
  (unlike the OR-WashCo v20.0 brownfield pattern). Phase 190 (geofences) is a hard prerequisite for
  every subsequent phase.

- **Per-government build order (Phases 193â198):** `governments` row (via `WHERE NOT EXISTS`) +
  chamber(s) â roster (offices, form of government verified against the official city/county site,
  district vs at-large structure + seat count, AZ partisan-primary/nonpartisan-general handling
  confirmed) â 600Ã750 headshots (4:5 Lanczos q90, `press_use`, `type='default'`) â evidence-only
  compass stances â **licensed community banner** â spot-check render â surface in
  `src/lib/coverage.js`.

- **Community banner (every Tucson-metro jurisdiction â Phases 193â198):** acquire a legally-licensed
  real street-scene or skyline photo (no AI-generated images, no aerial/drone shots). Follow
  `docs/banner-asset-pipeline.md` (`scripts/banners/process_banner.py` â 1700Ã540 @ 3.15:1 â
  `upload_banner.py` â `cities/<slug>.jpg`), then add the `CURATED_LOCAL` entry + attribution in
  `src/lib/buildingImages.js`. Source banners **one at a time** (per feedback: large parallel
  fan-outs burn session quota). Arizona's STATE banner (Downtown Phoenix skyline) already exists in
  production â no re-sourcing needed at the state tier.

- **Stances:** evidence-only, **one research agent at a time** (rate-limit rule), all live compass
  topics, 100% citation, **no default values**, honest blank spokes. Applies to Pima County + the 5
  Tucson-metro cities only â **Arizona Legislature stances are explicitly deferred by design**
  (Phase 192; NV v18.0 split pattern) and school boards are out of scope for this milestone entirely.

- **Surfacing target** is `src/lib/coverage.js` â Arizona block in COVERAGE_STATES + Pima County in
  COVERAGE_COUNTIES. Each jurisdiction carries `hasContext: true` chip once â¥1 stance row exists;
  never assume â reconcile against real DB stance counts at close (Phase 200).

- **gsd-executor has no Supabase MCP** â DB-verify steps run inline within each phase.

### Phases

**Phase Numbering:**

- Integer phases (190, 191, 192...): Planned milestone work, continuing from v21.0 (closed at 189)
- Decimal phases (190.1, 190.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 190: Arizona TIGER Geofences** - All boundary tiers loaded; any AZ address resolves to the correct jurisdiction stack
- [x] **Phase 191: Arizona State & Federal Government** - Hobbs + constitutional officers + 2 US Senators + 9 US House, all with headshots (completed 2026-07-09)
- [x] **Phase 192: Arizona Legislature (seed + headshots)** - 30 senators + 60 house reps seeded and photographed; stances deferred (completed 2026-07-09)
- [x] **Phase 193: Pima County Board of Supervisors Deep-Seed** - Standalone county government + roster + headshots + stances + banner (completed 2026-07-10)
- [ ] **Phase 194: City of Tucson Deep-Seed** - Flagship: Mayor + 6 wards + roster + headshots + stances + banner
- [x] **Phase 195: Oro Valley Deep-Seed** - Government + roster + headshots + stances + banner (completed 2026-07-11)
- [x] **Phase 196: Marana Deep-Seed** - Government + roster + headshots + stances + banner (completed 2026-07-16)
- [x] **Phase 197: Sahuarita Deep-Seed** - Government + roster + headshots + stances + banner
- [x] **Phase 198: South Tucson Deep-Seed** - Government + roster + headshots + stances + banner
- [x] **Phase 199: AZ 2026 Elections & Discovery** - Race shells, confirmed candidates, discovery pipeline armed
- [ ] **Phase 200: Arizona Playbook Retrospective & Close** - coverage.js reconciled, GOTCHAs documented, milestone closed
- [ ] **Phase 206: AZ 2026 Candidate Reconcile (post-07-21)** - ⛔ BLOCKED until 2026-07-21 - seed confirmed general-election nominees onto the Phase 199 AZ race shells once the primary certifies (depends on Phase 199)

**Appended - Coachella Valley, CA continuation (Riverside County + 2 cities).** Independent of the
Arizona phases above (CA TIGER city+county boundaries already loaded); Arizona 196-200 remain
resumable. Same standalone-county / by-district city deep-seed shape as 193-195. Execution order
201 -> 202 -> 203 (banners + stances one at a time).

- [x] **Phase 201: Riverside County Board of Supervisors Deep-Seed** - Standalone county government (geo_id 06065) + 5 by-district supervisors (board only, constitutional officers deferred per D-01) + X0021 geofences + headshots + stances + banner (completed 2026-07-13)
- [x] **Phase 202: Palm Springs Deep-Seed** - City government (geo_id 0655254): 5-member by-district council + rotational mayor + X-geofences + headshots + stances + banner (completed 2026-07-13)
- [ ] **Phase 203: Indio Deep-Seed** - City government (geo_id 0636448): 5-member by-district council + rotational mayor + X-geofences + headshots + stances + banner

### Phase Details

#### Phase 190: Arizona TIGER Geofences

**Goal**: Any Arizona address routes to the correct federal, state, county, and city representatives via TIGER geofence boundaries loaded for every tier.
**Depends on**: Nothing (first phase; v21.0 closed at Phase 189)
**Requirements**: AZ-GEO-01
**Success Criteria** (what must be TRUE):

  1. G4110 incorporated-place boundaries loaded for all Arizona cities/towns, including Tucson, Oro Valley, Marana, Sahuarita, and South Tucson
  2. G4020 county boundaries loaded for all 15 Arizona counties, including Pima County (geo_id confirmed)
  3. Congressional district (CD) boundaries loaded for Arizona's 9 US House districts
  4. SLDU (30 districts) and SLDL (30 districts, 2-seat) boundaries loaded for the state legislature
  5. Section-split scan against the new AZ rows returns 0 defects

**Plans**: 2 plans

- [x] 190-01-PLAN.md â Add AZ (FIPS 04) to TIGER loader + verify/smoke scripts; dry-run to confirm counts (sldl=30 per D-04, place ~91); pre-existing-row check. No DB writes.
- [x] 190-02-PLAN.md â Live-load 5 AZ layers (cd119/sldu/sldl/place/county); SQL gates (unincorporated-Pima probe, casing, section-split); 6-address smoke test.

#### Phase 191: Arizona State & Federal Government

**Goal**: Arizona's statewide executive and federal delegation are seeded with correct election/appointment status and are visible on their own profile pages.
**Depends on**: Phase 190
**Requirements**: AZ-STATE-01, AZ-STATE-02
**Success Criteria** (what must be TRUE):

  1. Governor Katie Hobbs + constitutional officers seeded as STATE_EXEC with correct voter-elected vs. appointed flags per the AZ constitution
  2. 2 US Senators (Kelly, Gallego) seeded as NATIONAL_UPPER, statewide
  3. 9 US House reps seeded as NATIONAL_LOWER, each correctly linked to their CD geofence from Phase 190
  4. All seeded state and federal officials have 600Ã750 headshots**Plans**: 3 plans

**Wave 1**

- [x] 191-01-PLAN.md â STATE_EXEC gap: structural migration 1282 (3 chambers/3 districts/7 politicians -4004001..-4004007/7 offices incl. 5-seat Corporation Commission) + 7 headshots (mig 1283)
- [x] 191-02-PLAN.md â US House headshots: 8 reps via unitedstates.github.io resize-only pipeline (mig 1284, audit-only)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 191-03-PLAN.md â Verification SQL audit + human-verify checkpoint (identity, live browse, Presmyk resolution)

#### Phase 192: Arizona Legislature (seed + headshots)

**Goal**: The full 90-member Arizona Legislature is seeded and photographed, ready for a future stance-research pass.
**Depends on**: Phase 190
**Requirements**: AZ-LEG-01
**Success Criteria** (what must be TRUE):

  1. 30 Arizona state senators seeded with offices linked to their SLDU district geofence
  2. 60 Arizona state house reps (2 per legislative district) seeded with offices linked to their SLDL district geofence
  3. 90/90 legislators have 600Ã750 headshots
  4. 0 compass stances present for AZ legislators â confirmed deferred by design (not a gap), matching the NV v18.0 pattern

**Plans**: 3 plans
**Wave 1**

- [x] 192-01-PLAN.md â Structural seed: 2 chambers + 30 Senate + 60 House offices/politicians (guarded, applied) under State of Arizona (geo_id 04)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 192-02-PLAN.md â 90/90 headshots: azleg.gov crop-first 600Ã750 pipeline + audit-only politician_images migration

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 192-03-PLAN.md â Verification: full SQL/HTTP audit (incl. 0-stances deferred-by-design) + live address-routing/correct-person human-verify

#### Phase 193: Pima County Board of Supervisors Deep-Seed

**Goal**: Pima County residents can see their district supervisor with a full compass, and the county carries its own licensed banner.
**Depends on**: Phase 190
**Requirements**: PIMA-01, BANR-01
**Success Criteria** (what must be TRUE):

  1. Pima County Board of Supervisors seeded as a standalone county government (5 supervisor districts on LOCAL geofences), NOT nested under State of Arizona
  2. 5/5 supervisors have 600Ã750 headshots
  3. Evidence-only compass stances seeded for supervisors â 100% cited, no defaults, honest blanks where evidence is absent
  4. A licensed community banner (real street-scene/skyline photo, no AI, no aerial) is sourced, processed, uploaded to Storage, and wired into `src/lib/buildingImages.js`
  5. Pima County surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 6 plans
**Wave 1**

- [x] 193-01-PLAN.md — Source + load the 5 supervisor-district LOCAL X0019 geofences from Pima County GIS

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 193-02-PLAN.md — Seed the standalone Pima County government, Board of Supervisors chamber, and 5 by-district offices

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 193-03-PLAN.md — Fetch + bind 5/5 supervisor 600x750 headshots (pima.gov CivicPlus)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 193-04-PLAN.md — Evidence-only compass stances for the 5 supervisors (one at a time, 36 non-judicial topics)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 193-05-PLAN.md — Source + wire the Catalinas/Sonoran community banner + coverage.js chip

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 193-06-PLAN.md — Full production audit + live-browse verification

#### Phase 194: City of Tucson Deep-Seed

**Goal**: Any Tucson address returns the correct Mayor and ward councilmember, each with a full compass, and the city carries its own licensed banner.
**Depends on**: Phase 190
**Requirements**: TUC-01, BANR-01
**Success Criteria** (what must be TRUE):

  1. Mayor + 6 ward council members seeded with the election method verified at plan time (ward-elected vs. at-large, and AZ's partisan-primary/nonpartisan-general handling confirmed)
  2. 7/7 officials have 600Ã750 headshots
  3. Evidence-only compass stances seeded for all 7 officials â 100% cited, no defaults, honest blanks
  4. A licensed community banner (real street-scene/skyline photo, no AI, no aerial) is sourced, processed, uploaded to Storage, and wired into `src/lib/buildingImages.js`
  5. City of Tucson surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 6 plans
**Wave 1**

- [x] 194-01-PLAN.md — Ward geofence loader (multi-ring-aware) + BLOCKING ring-verify + load 6 X0020 wards

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 194-02-PLAN.md — Structural migration: City of Tucson gov + City Council chamber + Mayor (new LOCAL_EXEC) + 6 ward offices + BLOCKING roster-currency + apply

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 194-03-PLAN.md — 7/7 600x750 headshots (WAF fallback via Playwright) + audit migration

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 194-04-PLAN.md — Evidence-only compass stances, one official at a time (Mayor + 6 wards)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 194-05-PLAN.md — Licensed downtown-Tucson banner + NEW Arizona coverage.js block + buildingImages wiring

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 194-06-PLAN.md — Full production audit + live-browse per-ward + Mayor routing verification

**UI hint**: yes

#### Phase 195: Oro Valley Deep-Seed

**Goal**: Oro Valley residents can see their council with a compass, and the town carries its own licensed banner.
**Depends on**: Phase 190
**Requirements**: SUB-01, BANR-01
**Success Criteria** (what must be TRUE):

  1. Oro Valley government + council roster seeded with election method verified at plan time
  2. All seated officials have 600Ã750 headshots
  3. Evidence-only compass stances seeded â 100% cited, no defaults, honest blanks
  4. A licensed community banner (real street-scene/skyline photo, no AI, no aerial) sourced and wired into `src/lib/buildingImages.js`
  5. Oro Valley surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 4 plans
**Wave 1**

- [x] 195-01-PLAN.md - Structural migration 1305: greenfield Town of Oro Valley govt + Town Council chamber + 2 new districts (LOCAL_EXEC Mayor + 1 shared LOCAL for all 6 council) + 7 nonpartisan officials (party NULL); substantive BLOCKING roster-currency re-verify during the active 2026 election before apply.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 195-02-PLAN.md - 7 headshots (600x750) via the /find-headshots Playwright WAF fallback (orovalleyaz.gov Akamai-blocked); audit-only migration 1306.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 195-03-PLAN.md - Evidence-only compass stances, one official at a time, 36 non-judicial topics, 100% cited, honest blanks; audit-only migrations 1307-1313.

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 195-04-PLAN.md - Licensed Oro Valley banner (one at a time, distinct from Pima's Catalina banner) wired into buildingImages.js + append 'Oro Valley' to the EXISTING Arizona coverage.js block.

#### Phase 196: Marana Deep-Seed

**Goal**: Marana residents can see their council with a compass, and the town carries its own licensed banner.
**Depends on**: Phase 190
**Requirements**: SUB-02, BANR-01
**Success Criteria** (what must be TRUE):

  1. Marana government + council roster seeded with election method verified at plan time
  2. All seated officials have 600Ã750 headshots
  3. Evidence-only compass stances seeded â 100% cited, no defaults, honest blanks
  4. A licensed community banner (real street-scene/skyline photo, no AI, no aerial) sourced and wired into `src/lib/buildingImages.js`
  5. Marana surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 4 plans
Plans:
**Wave 1**

- [ ] 196-01-PLAN.md — Structural migration: greenfield Town of Marana government + Town Council chamber + LOCAL_EXEC Mayor + shared LOCAL council district + 7 offices (party NULL); BLOCKING roster-currency re-verify (July 21 primary) + apply

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 196-02-PLAN.md — 600×750 headshots for all 7 officials (Ballotpedia-first WAF fallback via Playwright); audit-only politician_images migration

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 196-03-PLAN.md — Evidence-only compass stances, one official at a time, 36 non-judicial topics, 100% cited, honest blanks (7 audit migrations)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 196-04-PLAN.md — Licensed Tortolita/non-Catalina community banner (cities/marana.jpg) wired into buildingImages.js + Marana chip appended to the existing Arizona coverage.js block + end-to-end address-routing verify

#### Phase 197: Sahuarita Deep-Seed

**Goal**: Sahuarita residents can see their council with a compass, and the town carries its own licensed banner.
**Depends on**: Phase 190
**Requirements**: SUB-03, BANR-01
**Success Criteria** (what must be TRUE):

  1. Sahuarita government + council roster seeded with election method verified at plan time
  2. All seated officials have 600Ã750 headshots
  3. Evidence-only compass stances seeded â 100% cited, no defaults, honest blanks
  4. A licensed community banner (real street-scene/skyline photo, no AI, no aerial) sourced and wired into `src/lib/buildingImages.js`
  5. Sahuarita surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 4 plans

- [x] 197-01-PLAN.md — Structural migration: greenfield Town of Sahuarita govt + Town Council chamber + 1 shared LOCAL district (NO LOCAL_EXEC) + 7 at-large council with Mayor/Vice-Mayor as title annotations; BLOCKING roster+title re-verify + apply
- [x] 197-02-PLAN.md — 7 headshots (600×750), sahuaritaaz.gov soft-block Playwright fallback; audit migration
- [x] 197-03-PLAN.md — Evidence-only compass stances (one agent at a time, 36 non-judicial topics; Copper World/water/data-center/growth salient); 7 audit migrations — 14 rows, 100% cited, honest blanks, tenure rule enforced
- [x] 197-04-PLAN.md — Licensed Sahuarita banner (Sahuarita Lake + Santa Rita Mtns, CC BY-SA 3.0) + coverage.js chip appended to existing Arizona block; end-to-end address-routing verify (7/7 council returned)

#### Phase 198: South Tucson Deep-Seed

**Goal**: South Tucson residents can see their council with a compass, and the city carries its own licensed banner.
**Depends on**: Phase 190
**Requirements**: SUB-04, BANR-01
**Success Criteria** (what must be TRUE):

  1. South Tucson government + council roster seeded with election method verified at plan time
  2. All seated officials have 600Ã750 headshots
  3. Evidence-only compass stances seeded â 100% cited, no defaults, honest blanks
  4. A licensed community banner (real street-scene/skyline photo, no AI, no aerial) sourced and wired into `src/lib/buildingImages.js`
  5. South Tucson surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 4 plans (4 waves)
**Wave 1**

- [x] 198-01-PLAN.md — Structural migration: greenfield City of South Tucson government (type=City) + City Council chamber + 1 shared LOCAL district (NO LOCAL_EXEC) + 7 at-large officials (Mayor/Vice-Mayor/Acting-Mayor as title annotations); D-03 enclave donut-hole pre-flight + BLOCKING roster-currency re-verify (July 21 primary; sitting Mayor is a candidate)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 198-02-PLAN.md — 600x750 headshots for the 7 officials (southtucsonaz.gov Cloudflare-challenge → Playwright fallback; honest blanks; per-image license)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 198-03-PLAN.md — Evidence-only compass stances, one official at a time, 36 non-judicial topics (public safety/policing, budget, Mercado/South-4th-Ave corridor); 7 audit migrations, 100% cited, honest blanks, no defaults

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 198-04-PLAN.md — Licensed cultural/urban banner (mural / South-4th-Ave streetscape, NOT landscape) + coverage.js chip appended to existing Arizona block; end-to-end address-routing verify (7/7 council, not swallowed by Tucson)

#### Phase 199: AZ 2026 Elections & Discovery

**Goal**: Any AZ resident can see their 2026 ballot for statewide, federal, legislative, and Tucson-metro local races, with discovery running to keep candidate rosters current.
**Depends on**: Phases 191â198 (offices must exist before races can anchor to them)
**Requirements**: AZ-ELEC-01
**Success Criteria** (what must be TRUE):

  1. 2026 race shells seeded for statewide offices, all 9 US House seats, all 90 legislative seats, and Tucson-metro local races (Pima County + 5 cities)
  2. Confirmed candidate slate populated for races where filing has closed
  3. `discovery_jurisdictions` rows armed with the AZ election-authority domain allowlist and `cron_active=true`

**Plans**: 4 plans

- [x] 199-01-PLAN.md — Seed bare AZ 2026 Statewide Primary election row (2026-07-21) + confirm general FK anchor (migration 1372)
- [x] 199-02-PLAN.md — Statewide (6) + Corp Commission (seats=2) + legislative (30 Senate seats=1 + 30 House seats=2) race shells (migrations 1373-1374)
- [x] 199-03-PLAN.md — 6 confirmed Tucson-metro local shells (South Tucson, Oro Valley, Marana, Sahuarita); zero Pima BoS, zero Tucson city (migration 1375)
- [x] 199-04-PLAN.md — Arm 4 discovery_jurisdictions rows (5-domain allowlist) + phase race-count gate (82 races) (migration 1376)

**UI hint**: yes (no code change — AZ cities already surfaced in src/lib/coverage.js)

> Post-research corrections (see 199-CONTEXT post_research_updates): primary date is 2026-07-21 (not 2026-08-04); ZERO Pima BoS shells (2024->2028); ZERO Tucson city shells (odd-year); Corp Commission = 1 race seats=2 (not 5); AZ House = 30 races seats=2 (not 60); pure structure — NO candidates hand-seeded (post-07-21 reconcile deferred); no cron_active column (date-window arming).

#### Phase 200: Arizona Playbook Retrospective & Close

**Goal**: The milestone closes with an honest, DB-verified record of what shipped, and the onboarding playbook captures Arizona-specific lessons for the next state.
**Depends on**: Phase 199
**Requirements**: AZ-RETRO-01
**Success Criteria** (what must be TRUE):

  1. `src/lib/coverage.js` reconciled â every Tucson-metro jurisdiction with â¥1 stance carries the DB-honest purple chip, no chip where stances are 0
  2. Arizona GOTCHAs + an Arizona Quick Reference block added to `LOCATION-ONBOARDING.md`
  3. DB-verified milestone audit written (`v22.0-MILESTONE-AUDIT.md`)
  4. Milestone marked shipped in PROJECT.md / MILESTONES.md / STATE.md

**Plans**: TBD
**UI hint**: yes

### Phase 206: AZ 2026 Candidate Reconcile (post-07-21)

**Goal**: Confirmed 2026 general-election nominees are seeded onto the Phase 199 AZ race shells (6 statewide + Arizona Corporation Commission seats=2 + 30 State Senate + 30 State House seats=2 + 6 Tucson-metro local), so any AZ resident sees their actual candidates — not empty shells — for the Nov 3, 2026 general.
**Depends on**: Phase 199 (race shells + discovery already seeded under general election e21f5757)
**Requirements**: AZ-ELEC-01 (candidate-population portion)
**⛔ BLOCKED until 2026-07-21** — the AZ primary must run and certify before general-election nominees are known. Do NOT start before the primary results settle (dated reminder set for 2026-07-22).

**Scope (AZ 2026 only):**

- Seed evidence-based confirmed nominees onto the existing Ph199 shells. Sources: AZ SoS official canvass + county (Pima et al.) results. Pure-structure shells already exist — this phase only attaches `race_candidates` (by race_id) + headshots; it does NOT create races/offices.
- Sahuarita (Ph197) and South Tucson (Ph198) roster reconciles are tracked separately, NOT bundled here.
- On completion, run the deferred **seats=2 render human-check**: load an AZ `/results?view=elections` and confirm a seats=2 race (Arizona Corporation Commission or a State House District) shows the `2 seats` badge and does not mis-render as single-winner (first AZ seats>1 races to carry candidates). See [[project_elections_view_display_rules.md]] — empty shells are hidden, so this check only becomes possible once candidates attach.

**Plans:** 0 plans (run /gsd-plan-phase 206 after 2026-07-21)

Plans:

- [ ] TBD (run /gsd-plan-phase 206 to break down — only after the 2026-07-21 primary certifies)

---

## Appended: Coachella Valley, CA (Phases 201-203)

Local-layer deep-seed of Riverside County + two Coachella Valley cities (Palm Springs, Indio),
appended to the v22.0 milestone but **independent of the Arizona phases** — CA TIGER city+county
boundaries are already loaded (Riverside County 06065, Palm Springs 0655254, Indio 0636448), so
these phases depend on nothing in 190-200 and Arizona 196-200 stay resumable. All three bodies are
5-member and elected **by district**; both cities have a **rotational mayor** (title on a seat, not a
separate district — the by-district relabel pattern from Boulder City / El Monte). All three primary
.gov domains are WAF-403, so headshots come from district sites / CivicWeb / Ballotpedia / Wikimedia.
Reuses the Pima County -> Tucson -> Oro Valley deep-seed unit: government + chamber -> roster ->
600x750 headshots -> evidence-only stances (one agent at a time, 100% cited, no defaults, honest
blanks) -> licensed community banner (real street-scene/skyline, no AI/aerial, sourced one at a time)
-> surface in `src/lib/coverage.js`.

#### Phase 201: Riverside County Board of Supervisors Deep-Seed

**Goal**: Riverside County is seeded as a standalone county government with its 5-member by-district Board of Supervisors (board ONLY — constitutional officers deferred per D-01), so any Riverside County address routes to the correct supervisor and the county surfaces with an evidence-only compass.
**Depends on**: Nothing (CA county boundary 06065 already loaded; independent of Arizona 190-200)
**Requirements**: CV-01, BANR-01
**Success Criteria** (what must be TRUE):

  1. Standalone `County of Riverside` government row (geo_id 06065, NOT nested under State of CA) + Board of Supervisors chamber seeded
  2. 5 supervisorial-district X-geofences loaded from the county ArcGIS Hub (gis.countyofriverside.us OpenData SupervisorialDistricts MapServer/0); a probe address in each district routes to exactly one supervisor
  3. 5 supervisors (D1 Medina, D2 Spiegel, D3 Washington, D4 Perez, D5 Gutierrez) seeded with 600x750 headshots, with "Chair" as a title on the sitting chair's district seat (2026: Spiegel D2 — re-verify at execute time). Board ONLY — constitutional officers (Sheriff/DA/Assessor) deferred per D-01 (matches Pima/Clark/WashCo board-only precedent)
  4. Evidence-only compass stances applied (one agent at a time, 100% cited, honest blank spokes, no defaults)
  5. Licensed community banner sourced; Riverside County surfaced in `src/lib/coverage.js` COVERAGE_COUNTIES with a DB-honest chip

**Plans**: 6 plans
Plans:

- [x] 201-01-PLAN.md — Load 5 supervisorial-district X0021 geofences (ArcGIS f=geojson)
- [x] 201-02-PLAN.md — Standalone Riverside County government + Board of Supervisors chamber + 5 by-district offices (Chair title annotation, board-only)
- [x] 201-03-PLAN.md — 5/5 600x750 supervisor headshots + audit migration
- [x] 201-04-PLAN.md — Evidence-only compass stances (one supervisor at a time)
- [x] 201-05-PLAN.md — Licensed downtown Riverside / Mission Inn banner + coverage.js surfacing
- [x] 201-06-PLAN.md — Full production audit + live-browse verification

**UI hint**: yes

#### Phase 202: Palm Springs Deep-Seed

**Goal**: Palm Springs is deep-seeded — 5-member by-district City Council with a rotational mayor — so any Palm Springs address routes to the correct district councilmember and the city surfaces with an evidence-only compass.
**Depends on**: Phase 201 (execution sequencing + banner/stance quota; no hard data dependency — CA place boundary 0655254 already loaded)
**Requirements**: CV-02, BANR-01
**Success Criteria** (what must be TRUE):

  1. `City of Palm Springs` government row (geo_id 0655254) + City Council chamber seeded
  2. 5 council-district X-geofences loaded from the city ArcGIS source; a probe address in each district routes to exactly one member
  3. 5 councilmembers (D1 Garner, D2 Bernstein, D3 deHarte, D4 Soto, D5 Ready) seeded with the rotational Mayor (Soto, D4) + Mayor Pro Tem (Ready, D5) as titles on their seats (by-district relabel pattern); 600x750 headshots
  4. Evidence-only compass stances applied (one agent at a time, 100% cited, honest blanks, no defaults)
  5. Licensed community banner sourced; city surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 6 plans in 6 waves
**Wave 1**

- [x] 202-01-PLAN.md — Load 5 council-district X0022 geofences from the confirmed 2022 ArcGIS FeatureServer

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 202-02-PLAN.md — Structural migration: City of Palm Springs gov + City Council + 5 by-district members (Soto=Mayor, Ready=Mayor Pro Tem title-on-seat)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 202-03-PLAN.md — 5 headshots (600×750 4:5 crop-first) + audit-only politician_images migration

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 202-04-PLAN.md — Evidence-only compass stances, one councilmember at a time (5 audit-only migrations)

**Wave 5** *(blocked on Wave 4 completion)*

- [x] 202-05-PLAN.md — coverage.js Palm Springs chip (banner already shipped Ph201; buildingImages.js unchanged)

**Wave 6** *(blocked on Wave 5 completion)*

- [x] 202-06-PLAN.md — Full production audit + live-browse per-district routing + banner-render sign-off

**UI hint**: yes

#### Phase 203: Indio Deep-Seed

**Goal**: Indio is deep-seeded — 5-member by-district City Council with a rotational mayor — so any Indio address routes to the correct district councilmember and the city surfaces with an evidence-only compass.
**Depends on**: Phase 202 (execution sequencing + banner/stance quota; no hard data dependency — CA place boundary 0636448 already loaded)
**Requirements**: CV-03, BANR-01
**Success Criteria** (what must be TRUE):

  1. `City of Indio` government row (geo_id 0636448) + City Council chamber seeded
  2. 5 council-district X-geofences loaded from gis.indio.org ArcGIS REST; a probe address in each district routes to exactly one member
  3. 5 councilmembers (D1 Miller, D2 Fermon, D3 Holmes, D4 Ortiz, D5 Guitron — reconfirm D5 full name against live profile) seeded with the rotational Mayor (Holmes, D3) + Mayor Pro Tem (Fermon, D2) as titles on their seats; 600x750 headshots
  4. Evidence-only compass stances applied (one agent at a time, 100% cited, honest blanks, no defaults)
  5. Licensed community banner sourced; city surfaced in `src/lib/coverage.js` with a DB-honest chip

**Plans**: 6 plans

**Wave 1**

- [x] 203-01-PLAN.md — Author + run the gis.indio.org ArcGIS loader; 5 X0023 council-district geofences (indio-ca-council-district-1..5, lowercase ca), WGS84 sanity + council-name cross-check.

**Wave 2**

- [x] 203-02-PLAN.md — Structural migration 1338: City of Indio gov (0636448) + City Council chamber (official_count=5) + 5 LOCAL X0023 districts + 5 by-district members (Holmes/D3=Mayor, Fermon/D2=Mayor Pro Tem as seat titles, ext_ids -4012001..-4012005); pre-flight + post-verify Gates (a)-(f); roster/D5-name reconfirm checkpoint.

**Wave 3**

- [x] 203-03-PLAN.md — Headshot pipeline (indio.civicweb.net primary / indio.org CivicPlus StaffDirectory via Browser-UA fallback) → 600x750 4:5 crop-first; audit-only migration 1339; visual-QA checkpoint.

**Wave 4**

- [x] 203-04-PLAN.md — Evidence-only compass stances, 5 audit-only migrations 1340-1344 (one member at a time, 100% cited, honest blanks, no defaults, non-judicial).

**Wave 5**

- [x] 203-05-PLAN.md — NEW licensed Indio banner (Old Town/downtown streetscape, no AI/aerial, one at a time) → cities/indio.jpg; new buildingImages.js indio key + DB-honest coverage.js chip (0636448).

**Wave 6**

- [x] 203-06-PLAN.md — Full production audit (geofences/roster/titles/headshots/stances/section-split=0/coverage/banner) + live per-district routing + banner-render operator sign-off.

**UI hint**: yes

### Progress

**Execution Order:**
Phases execute in numeric order: 190 â 191 â 192 â 193 â 194 â 195 â 196 â 197 â 198 â 199 â 200

Phases 191â198 all depend only on Phase 190 (geofences) and could technically be planned/executed in
any relative order among themselves, but the suggested sequence (state/federal â legislature â county
â flagship city â 4 suburbs) mirrors the proven NV/OR-WashCo shape. Phase 199 depends on all of
191â198 (races need seeded offices to anchor to). Phase 200 depends on everything.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 190. Arizona TIGER Geofences | 2/2 | Complete   | 2026-07-08 |
| 191. Arizona State & Federal Government | 3/3 | Complete    | 2026-07-09 |
| 192. Arizona Legislature (seed + headshots) | 3/3 | Complete    | 2026-07-09 |
| 193. Pima County Board of Supervisors Deep-Seed | 6/6 | Complete    | 2026-07-10 |
| 194. City of Tucson Deep-Seed | 6/6 | Complete   | 2026-07-10 |
| 195. Oro Valley Deep-Seed | 4/4 | Complete    | 2026-07-11 |
| 196. Marana Deep-Seed | 0/4 | Planned | - |
| 197. Sahuarita Deep-Seed | 4/4 | Complete|  |
| 198. South Tucson Deep-Seed | 1/4 | In Progress|  |
| 199. AZ 2026 Elections & Discovery | 4/4 | Complete   | 2026-07-17 |
| 200. Arizona Playbook Retrospective & Close | 0/TBD | Not started | - |
| 201. Riverside County Board of Supervisors Deep-Seed (CA) | 6/6 | Complete    | 2026-07-13 |
| 202. Palm Springs Deep-Seed (CA) | 6/6 | Complete    | 2026-07-13 |
| 203. Indio Deep-Seed (CA) | 6/6 | Complete   | 2026-07-13 |

### Coverage

All 13 v22.0 requirements mapped. BANR-01 spans the 6 deep-seed phases (193â198); every other
requirement maps to exactly one phase. No orphans. **Appended CA phases (201-203)** add
requirements CV-01/02/03 (one per phase); BANR-01 also spans 201-203.

| Requirement | Phase(s) |
|-------------|----------|
| AZ-GEO-01 | 190 |
| AZ-STATE-01 | 191 |
| AZ-STATE-02 | 191 |
| AZ-LEG-01 | 192 |
| PIMA-01 | 193 |
| TUC-01 | 194 |
| SUB-01 | 195 |
| SUB-02 | 196 |
| SUB-03 | 197 |
| SUB-04 | 198 |
| BANR-01 | 193, 194, 195, 196, 197, 198 |
| AZ-ELEC-01 | 199 |
| AZ-RETRO-01 | 200 |
| CV-01 | 201 |
| CV-02 | 202 |
| CV-03 | 203 |
| BANR-01 (appended) | 201, 202, 203 |
| LENS-01 | 204 |

## Appended: Compass Lens Switcher (Phase 204)

Standalone feature phase — **independent of the Tucson/Arizona and Coachella Valley deep-seed tracks**
(no data dependency; touches only the compass UI layer). Turns essentials' latent lens data model
(`CompassContext.lenses` hydrated from `GET /compass/lenses`) into an explicit, extensible,
calibration-aware **global lens switcher** on the results grid, retiring the silent per-office
auto-lensing. Mirrors the lens/calibration model already shipped in `C:\EV-CompassV2`.

#### Phase 204: Compass Lens Switcher (Results Grid)

**Goal**: Replace the results-grid binary on/off "Lens" toggle with a single global, data-driven lens
switcher (Custom + every lens from `GET /compass/lenses`), each chip showing a calibration state
(LIT vs greyed + purple-rim), that sets the comparison topic-set for every card at once and defaults
to a per-politician **Custom (overlap)** lens when none is selected.
**Depends on**: Nothing (compass-UI-only; assumes `GET /compass/lenses` returns lens `name`/`description`/`color`)
**Requirements**: LENS-01
**Spec**: `.planning/phases/204-compass-lens-switcher/204-SPEC.md` (11 requirements, ambiguity 0.161)
**Success Criteria** (what must be TRUE):

  1. With compass on, the grid shows a data-driven lens-chip row (Custom + each API lens); the old binary on/off toggle is gone; adding a lens to the API makes a chip appear with no code change
  2. Each chip renders LIT when the user answered ≥ min(8, lens size) of its topics, else greyed + purple-rim; Custom is always LIT; hovering a purple chip prompts calibration and clicking it hands off to compass.empowered.vote (lens-scoped, return URL)
  3. Explicit selection is global (applies one lens to every card); with none selected the default is the Custom overlap lens per card (compass topics first, then biggest disagreements, cap 8); per-office auto-lensing retired
  4. A narrow selected lens leaves non-matching cards in the "not enough shared topics" state (no silent fallback); the selected lens persists across visits (localStorage `ev:compassLens`)

**Plans**: 4 plans in 3 waves

**Wave 1**

- [x] 204-01-PLAN.md — Lens data/algorithm core in compass.js: metadata fallbacks + normalizeApiLens + hex sanitizer + isLensCalibrated(min(8,size)) + ev:compassLens persistence + Best Match biggest-disagreement fill (Req 9 unit-tested)
- [x] 204-03-PLAN.md — New LensChipRow.jsx presentational switcher: data-driven pills (Best Match first), active/LIT/needs-calibration(purple-rim) states, per-lens icons, hover+tap-to-prompt calibrate affordance

**Wave 2** *(blocked on Wave 1)*

- [x] 204-02-PLAN.md — CompassContext global persisted activeLensKey + setActiveLens + name/description fallback + normalizeApiLens hydration + auto-select-on-return (D-12); per-office auto-lensing retired for the grid, profile/elections shims kept

**Wave 3** *(blocked on Wave 2)*

- [x] 204-04-PLAN.md — Wiring: thread lensTopicIds through MiniCompass, replace binary toggle with LensChipRow in CompassControlsBar (desktop-wrap/mobile-scroll), global active-lens grid handling + calibration handoff in Results.jsx, + full 11-criteria human-verify (incl. flagged real-account federal-handoff landing)

**UI hint**: yes

## Appended: U.S. Senate 2026 Candidate Wiring (Phase 205)

Standalone national federal-data-repair phase — **independent of the Tucson/Arizona and Coachella Valley
deep-seed tracks and of the Phase 204 compass work**. The 2026 U.S. Senate races and candidates were
seeded but never linked to an office, so they don't surface by address.

#### Phase 205: U.S. Senate 2026 Candidate Wiring

**Goal**: Link every orphaned 2026 U.S. Senate race to the correct `NATIONAL_UPPER` office (the specific
Class seat up for election in that state) so its candidates surface by address exactly like House
candidates already do.
**Depends on**: Nothing (data-repair only; federal incumbents + geofences already seeded). No code changes expected — the address→district→office→race→candidates path already works for the House.
**Requirements**: REQ-1, REQ-2, REQ-3, REQ-4, REQ-5 (locked in 205-SPEC.md)
**Diagnosis (verified on prod 2026-07-15)**:

  - `essentials.races` where `position_name ILIKE 'U.S. Senate %'`: **51 races, all with `office_id = NULL`**, **189 candidates** across **35 states**; multi-race states are legit primary(per-party)/general splits, not duplicates.
  - House (NATIONAL_LOWER) is correctly wired for comparison (447 races / 50 states / ~1,547 candidates, `office_id` set).
  - Exactly **one** `NATIONAL_UPPER` district per state (statewide), but ~152 `NATIONAL_UPPER` office rows across 50 states (2 seats/state + historical/vacant) — so linking requires choosing the *correct* seat, not just any.

**Success Criteria** (what must be TRUE):

  1. Every 2026 U.S. Senate race has a non-null `office_id` pointing to the correct state's `NATIONAL_UPPER` office for the 2026 Class seat
  2. Entering an address in a state with a 2026 Senate race surfaces that race's candidates, same as House candidates
  3. No House race linkage or federal incumbent data is altered as a side effect

**Out of scope (candidate)**: candidate headshots and compass stances (follow-on; not required to surface).

**Plans**: 2 plans in 2 waves

**Wave 1**

- [x] 205-01-PLAN.md — Author idempotent migration 878 from the verified 35-row seat map + skip report; BLOCKING D-04 human seat-map approval checkpoint (specials OH/FL flagged) before any write (REQ-1, REQ-4)

**Wave 2** *(blocked on Wave 1 approval)*

- [x] 205-02-PLAN.md — Apply migration 878 to production (gated, autonomous:false) + DB parity/before-after diff + BLOCKING live in-state address check for MN/TX/TN + OH special (REQ-2, REQ-3, REQ-4, REQ-5)

**UI hint**: no

## Roadmap: v23.0 Educators & Judges Tabs

### Overview

Frontend feature milestone on the existing results/officials view. Adds **Educators** (school-board
leads) and **Judges** as first-class, compass-integrated tabs beside the existing **Representatives**
and **Elections** tabs — pulling school-board and judicial office-holders out of the Representatives
list (fixing the "wade through every LA school-board district" clutter), greying a tab out where the
location has no such data, and shifting the default compass lens per tab. Builds directly on the
Phase 204 data-driven lens switcher (`CompassControlsBar`, `LensChipRow`, `CompassContext.lenses`
hydrated from `GET /compass/lenses`) and the existing `Results.jsx` Representatives + Elections tab
model. **No new geographic/seeding data** — classification comes from existing chamber/office/geo-type
data (school-district G5420 geofences / school-board chambers, judicial offices). One evidence-based
deep-dive stance-research phase (Trump, Vance, Rubio) reuses the established one-agent-at-a-time /
100%-cited / no-defaults workflow. Phase numbering continues from v22.0 (highest existing phase 206) —
this milestone starts at **Phase 207**.

**Runs alongside the held v22.0 close** (Phase 200 + Phase 206 + Sahuarita/South Tucson reconcile,
gated on the 2026-07-21 AZ primary certification) — same side-track pattern as Phases 204/205. The
v22.0 phases above are preserved untouched.

### Milestone-wide conventions

- **Frontend/data only, no new seeding** — classification and tab routing use existing
  chamber/office/geo-type data (school-district G5420 geofences / school-board chambers, judicial
  offices). No geographic ingestion this milestone.

- **Build on Phase 204, don't fork it** — the lens switcher, `CompassContext.lenses` hydration, and
  `computeDisplaySpokes` are the substrate. A **Judicial lens already exists** (8 judicial topics);
  the Education lens is added as a lens *entry* the same way, and per-tab defaults reuse the existing
  switcher selection model (explicit user selection always overrides).

- **Data-only lens lighting** — the Education lens must light purely by authoring its 8 topics later
  (deferred), mirroring Phase 204's "adding a lens is a data change" guarantee. No code change to
  light it; until authored it renders greyed / needs-calibration and the Educators tab falls back to
  the Custom overlap (honest blanks, no fabricated spokes).

- **Stance research** — evidence-only, one research agent at a time, all applicable compass topics,
  100% citation, no default values, honest blank spokes. Applies to RES-01 (Trump/Vance/Rubio) only —
  broad school-board/judicial stance research is deferred.

- **Deferred by design (future milestones):** authoring the 8 Education-lens topics; the Elections
  "ballot hub" build-out; broad school-board/judicial stance research; judicial roster expansion.

### Phases

**Phase Numbering:**

- Integer phases (207, 208, 209...): planned milestone work, continuing from v22.0 (highest phase 206)
- Decimal phases (207.1, 207.2): urgent insertions (marked INSERTED)

- [x] **Phase 207: Officials Classification** - Reliably bucket every office-holder as Representative / Educator / Judge from existing chamber/office/geo-type data (completed 2026-07-18)
- [x] **Phase 208: Educators & Judges Tabs** - New tabs beside Representatives & Elections; school-board + judicial officials leave Representatives; hide-when-empty (D-06); operator-approved on live
- [ ] **Phase 209: Education Lens Scaffolding** *(DEFERRED — blocked on educator stance research, undefined 5-notch spectrum values, and a viable topic set)* - Data-driven Education lens entry (parallel to Judicial); greyed / best-available fallback until its topics are authored later
- [x] **Phase 210: Per-Tab Compass Integration** - Compass button + overlay work inside the new tabs; default lens shifts per tab (Judges to Judicial, Educators to Education with best-available fallback until 209 lights it); explicit selection overrides. Ships independently of 209. (2/2 plans + gap-closure 210.1 for CR-01; human-verified on Bloomington IN; one optional CR-01 calibrate-return live re-check outstanding)
- [ ] **Phase 211: Deep-Dive Stance Research (Trump, Vance, Rubio)** - Full-compass, 100%-cited, no-defaults evidence-based stance research

### Phase Details

#### Phase 207: Officials Classification

**Goal**: Every office-holder returned for a location is reliably classified as Representative, Educator (school board), or Judge from existing data, so the tab split has a trustworthy engine.
**Depends on**: Nothing (uses existing chamber/office/geo-type data; no new seeding)
**Requirements**: CLASS-01
**Success Criteria** (what must be TRUE):

  1. Every office-holder returned for a location resolves to exactly one of three buckets — Representative, Educator (school board), or Judge — derived from existing chamber/office/geo-type data (no new seeding)
  2. School-board office-holders (e.g. LA school-board districts, G5420 school chambers) classify as Educators and are never left in the Representatives bucket
  3. Judicial office-holders classify as Judges and are never left in the Representatives bucket
  4. Ordinary representatives (mayor, council, legislators, federal delegation) are never misfiled into the Educators or Judges buckets
  5. Classification is verified across at least two contrasting locations — one with school-board + judicial officials (e.g. LA) and one with representatives only

**Plans**: 1 plan

- [x] 207-01-PLAN.md — Add single-source-of-truth classifyBucket(pol) to src/lib/classify.js + unit & 3-location fixture tests

#### Phase 208: Educators & Judges Tabs

**Goal**: Users can switch among Representatives, Educators, and Judges tabs beside Elections, with school-board/judicial officials surfacing only under their own tab and empty tabs cleanly greyed out.
**Depends on**: Phase 207 (classification drives which tab each official appears in)
**Requirements**: TAB-01, TAB-02, TAB-03
**Success Criteria** (what must be TRUE):

  1. On the results/officials view, a user can switch among Representatives, Educators, and Judges tabs alongside the existing Elections tab
  2. The Educators tab lists the location's school-board office-holders; the Judges tab lists its judicial office-holders
  3. School-board and judicial officials no longer appear under Representatives — that list is decluttered (no more wading through every LA school-board district)
  4. (Revised by 208-CONTEXT.md D-05/D-06) An Educators/Judges tab is HIDDEN entirely — not greyed/disabled — when the location has 0 office-holders of that type; the active tab falls back to Representatives for an empty or stale ?view=. Representatives always shows.

**Plans**: 2 plans in 2 waves

**Wave 1**

- [x] 208-01-PLAN.md — Extend Results.jsx to 4 tabs: classifyBucket partition of `deduped` + three per-bucket hierarchies, renderPeopleTab helper called 3x (full parity + compass slot), Educators/Judges tab buttons hidden-when-empty, effectiveActiveView fallback (D-08), plain "Elections" label + election summary relocated to the location-header row

**Wave 2** *(blocked on Wave 1)*

- [x] 208-02-PLAN.md — Human-verify checkpoint: 4-tab order, classifyBucket routing, decluttered Representatives, hidden-when-empty Educators/Judges, stale-?view= fallback, relocated election summary vs mockup, compass on all people-tabs, 280px reachability

**UI hint**: yes

#### Phase 209: Education Lens Scaffolding

**Status**: DEFERRED (2026-07-19) — blocked upstream: no educator stance research exists, the 5-notch spectrum values ("chairs") are undefined for education topics, and only a few viable topics exist (sourcing more is unresolved). Revisit once that groundwork is ready.
**Goal**: An Education lens exists as a data-driven lens entry parallel to Judicial — recognized by the switcher and per-tab default-lens logic — that greys out and falls back to best-available until its topics are authored.
**Depends on**: Nothing hard (builds on the Phase 204 lens switcher). Does NOT need to precede Phase 210 — 210 references the `education` key defensively and falls back to best-available while unlit, then auto-upgrades (data-only) when this lands.
**Requirements**: EDU-01, EDU-02
**Success Criteria** (what must be TRUE):

  1. An Education lens is present as a data-driven lens entry (parallel to the existing Judicial lens), recognized by the Phase-204 lens switcher and by the per-tab default-lens logic
  2. Authoring the lens's 8 topics later is a data-only change — no code change is needed to light it (mirrors Phase 204's "adding a lens is a data change")
  3. Until enough topics are authored, the Education lens renders in its needs-calibration / greyed state
  4. With the Education lens unlit, the Educators tab gracefully falls back to the Custom overlap — no broken or empty compass, no fabricated spokes (honest blanks)

**Plans**: TBD
**UI hint**: yes

#### Phase 210: Per-Tab Compass Integration

**Goal**: The compass works inside the Educators and Judges tabs exactly as in Representatives, and the default lens shifts per tab while an explicit user selection still overrides.
**Depends on**: Phase 208 (tabs exist). Phase 209 is a soft/data dependency only — 210 defaults Educators to the `education` lens but falls back to best-available while it is unlit, so 210 ships now and auto-upgrades (data-only) when 209 lands.
**Requirements**: CMP-01, CMP-02
**Success Criteria** (what must be TRUE):

  1. The Compass button + overlay work inside the Educators and Judges tabs exactly as in Representatives — cards render their compass and the lens switcher is available
  2. Switching to the Judges tab defaults the compass lens to the existing Judicial lens
  3. Switching to the Educators tab defaults the compass lens to the Education lens (falling back to the Custom overlap while the Education lens is unlit, per Phase 209)
  4. Returning to the Representatives tab restores the Custom / prior default lens
  5. An explicit user lens selection still overrides the per-tab default

**Plans**: 2 plans

- [x] 210-01-PLAN.md — resolveTabLens pure helper + unit tests, and per-tab lens memory (state + tab-entry effect + explicit-pick interception) in Results.jsx
- [x] 210-02-PLAN.md — live human-verify of per-tab default-lens shift, explicit-pick memory, cross-location persistence, and reset-on-reload
**UI hint**: yes

#### Phase 211: Deep-Dive Stance Research (Trump, Vance, Rubio)

**Goal**: Full-compass, evidence-cited stance research is completed and applied for Donald Trump, JD Vance, and Marco Rubio so their compasses render from real, sourced positions.
**Depends on**: Nothing (data phase; the three are federal figures already in the DB; independent of the tabs/lens work)
**Requirements**: RES-01
**Success Criteria** (what must be TRUE):

  1. Every applicable compass topic is answered for Donald Trump, JD Vance, and Marco Rubio
  2. Every stance carries a citation (100% cited) — no default values
  3. Topics with no supporting evidence are left as honest blank spokes (never fabricated)
  4. Each of the three officials' compasses renders on their profile/cards, reflecting the researched stances

**Plans**: 5 plans in 5 waves (research sequential per official — D-10 one agent at a time)

**Wave 1**

- [x] 211-01-PLAN.md — Foundation: capture live active topics + 5 chairs from inform.compass_topics/compass_stances (not the stale md), snapshot Trump+Vance answers for reversibility (D-04), author the reconcile apply script (upsert + delete-unsourced, single-politician scoped, parseInt/D-12)

**Wave 2** *(blocked on Wave 1)*

- [x] 211-02-PLAN.md — Donald Trump full-compass research (one agent) + full-overwrite reconcile apply (replaces 21 legacy uncited, deletes unsourced per D-05); 100% cited, honest blanks

**Wave 3** *(blocked on Wave 1; own wave to keep research sequential — D-10)*

- [x] 211-03-PLAN.md — J.D. Vance full-compass research (one agent) + full-overwrite reconcile apply (replaces 24 legacy uncited); 100% cited, honest blanks

**Wave 4** *(blocked on Wave 1; own wave to keep research sequential — D-10)*

- [x] 211-04-PLAN.md — Marco Rubio full-compass research (one agent, SecState-led + Senate backfill D-08, attribution guardrail D-09) + clean-insert apply; 100% cited, honest blanks

**Wave 5** *(blocked on 211-02/03/04)*

- [x] 211-05-PLAN.md — Provenance cross-check (0 uncited / 0 defaults across all three vs bundle.json) + live compass render human-verify (SC-4)

### Progress

**Execution Order:**
Revised order (2026-07-19): 207 → 208 → **210** → 211, with **209 deferred**.

Phase 207 (classification) is the foundation; Phase 208 (tabs) depends on it and is COMPLETE. Phase 209
(Education lens) is DEFERRED (blocked on educator stance/topic groundwork) and no longer gates Phase 210:
210 defaults Educators to the Education lens but falls back to best-available while it is unlit, so 210
ships now and auto-upgrades data-only when 209 eventually lands. Phase 211 (stance research) is fully
independent and may run at any time.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 207. Officials Classification | 1/1 | Complete    | 2026-07-18 |
| 208. Educators & Judges Tabs | 2/2 | Complete   | 2026-07-18 |
| 209. Education Lens Scaffolding | 0/TBD | Not started | - |
| 210. Per-Tab Compass Integration | 2/2 | Complete   | 2026-07-19 |
| 211. Deep-Dive Stance Research (Trump, Vance, Rubio) | 5/5 | Complete   | 2026-07-20 |

### Coverage

All 9 v23.0 requirements mapped to exactly one phase. No orphans, no duplicates.

| Requirement | Phase |
|-------------|-------|
| CLASS-01 | 207 |
| TAB-01 | 208 |
| TAB-02 | 208 |
| TAB-03 | 208 |
| EDU-01 | 209 |
| EDU-02 | 209 |
| CMP-01 | 210 |
| CMP-02 | 210 |
| RES-01 | 211 |

## Phases (shipped milestones)

<details>
<summary>â v21.0 Smart Banners (Phases 187â189) â SHIPPED 2026-07-08</summary>

Full detail: `.planning/milestones/v21.0-ROADMAP.md` Â· requirements: `.planning/milestones/v21.0-REQUIREMENTS.md`

Filled v19.0's two deliberately-inert `SectionBanner` scaffolding slots (`featureIcons` + `stats`),
turning every section banner into a location-aware hub. Frontend-only â no backend/DB schema changes.
A tethered EV-product icon row deep-links each banner's OWN location (never the user's) into other EV
products; a Census-sourced population strip shows a legible fact per tier; both wired identically into
Results and Elections through one shared `buildBannerProps` helper, degrading gracefully to the v19.0
title-only banner when no links or stats exist.

- [x] Phase 187: Tethered Feature-Icon Row (2/2) â completed 2026-07-07
- [x] Phase 188: Location Stats Strip (3/3) â completed 2026-07-07
- [x] Phase 189: Smart-Banner Integration & Graceful Degradation (3/3) â completed 2026-07-08

14/14 requirements (ICON-01/02/03 + TETH-01/02/03/04 â 187; STAT-01/02/03 â 188; SBAN-01/02/03/04 â 189).
Phase 189 VERIFICATION PASS 8/8 (operator-approved live); no standalone milestone audit â Phase 189 was
the integration/verification phase.

</details>

<details>
<summary>â v20.0 West-Metro Washington County, OR (Phases 174â186) â SHIPPED 2026-07-05</summary>

Full detail: `.planning/milestones/v20.0-ROADMAP.md` Â· audit: `v20.0-MILESTONE-AUDIT.md`

- [x] Phase 174: West-Metro School-District Geofences (1/1) â completed 2026-06-30
- [x] Phase 175: Washington County Commission Deep-Seed (3/3) â completed 2026-07-01
- [x] Phase 176: City of Beaverton Deep-Seed (5/5) â completed 2026-07-02
- [x] Phase 177: City of Hillsboro Deep-Seed (5/5) â completed 2026-07-02
- [x] Phase 178: City of Tigard Deep-Seed (5/5) â completed 2026-07-02
- [x] Phase 179: City of Tualatin Deep-Seed (5/5) â completed 2026-07-03
- [x] Phase 180: City of Forest Grove Deep-Seed (5/5) â completed 2026-07-03
- [x] Phase 181: City of Sherwood Deep-Seed (5/5) â completed 2026-07-03
- [x] Phase 182: City of Cornelius Deep-Seed (5/5) â completed 2026-07-04
- [x] Phase 183: School Boards Wave 1 â Beaverton SD 48J + Hillsboro SD 1J (4/4) â completed 2026-07-04
- [x] Phase 184: School Boards Wave 2 â Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J (4/4) â completed 2026-07-04
- [x] Phase 185: WashCo 2026 Elections & Discovery (3/3) â completed 2026-07-05
- [x] Phase 186: West-Metro Playbook Retrospective & Close (1/1) â completed 2026-07-05

</details>

<details>
<summary>â v18.0 Las Vegas & Clark County, NV (Phases 158â168, 173) â SHIPPED 2026-06-30</summary>

Full detail: `.planning/v18.0-MILESTONE-AUDIT.md` + `MILESTONES.md`.

- [x] Phase 158: Nevada TIGER Geofences â completed 2026-06-23
- [x] Phase 159: Nevada State & Federal Government â completed 2026-06-23
- [x] Phase 160: Nevada Legislature (seed + headshots) â completed 2026-06-23
- [x] Phase 161: Clark County Commission Deep-Seed â completed 2026-06-24
- [x] Phase 162: City of Las Vegas Deep-Seed â completed 2026-06-28
- [x] Phase 163: Henderson Deep-Seed â completed 2026-06-28
- [x] Phase 164: North Las Vegas Deep-Seed â completed 2026-06-29
- [x] Phase 165: Boulder City Deep-Seed â completed 2026-06-29
- [x] Phase 166: CCSD Board of Trustees Deep-Seed â completed 2026-06-29
- [x] Phase 167: NV 2026 Elections & Discovery â completed 2026-06-29
- [x] Phase 168: NV 2026 Candidate Population â completed 2026-06-30
- [x] Phase 173: Nevada Playbook Retrospective & Close â completed 2026-06-30

</details>

<details>
<summary>â v19.0 Dark-Mode Redesign & Section Banners (Phases 169â172) â SHIPPED 2026-06-28 (closed 2026-07-05)</summary>

Full detail: `.planning/milestones/v19.0-ROADMAP.md` Â· audit: `v19.0-MILESTONE-AUDIT.md`

- [x] Phase 169: Dark-Mode Design System Foundation (2/2) â completed 2026-06-25
- [x] Phase 170: Section Banners & Continuous Scroll â Results (4/4) â completed 2026-06-26
- [x] Phase 171: Banner Asset Pipeline & Exemplar Art (2/2) â completed 2026-06-27
- [x] Phase 172: Elections Page Parity (1/1) â completed 2026-06-28

Frontend-only detour built 2026-06-25 â 06-28 (verified + deployed); formal close ran 2026-07-05.
Deferred (out of scope): live banner stats, feature-icon links, remaining-state art, Landing/profile dark mode.
This deferred scope is what v21.0 filled.

</details>

## Progress

**v22.0 Tucson & Arizona is the active milestone** â Phases 190-203 (11 AZ + 3 appended
Coachella Valley, CA). See the expanded roadmap above. Per-milestone progress tables are archived to
`.planning/milestones/v{X.Y}-ROADMAP.md` at close.

### Phase 210.1: Fix calibration lens revert (gap closure — CR-01)

**Goal:** Resolve Phase 210 code-review finding CR-01 — the per-tab tab-entry effect could revert a lens the user just calibrated (calibrate flow does a full-page nav, so tabLensMemory is empty on return; a later async rawUserAnswers/lenses tick re-fired the effect and reset to the tab default). Fix seeds tabLensMemory[activeView] from the pending-calibration marker on the return mount.
**Requirements:** CMP-02
**Plans:** 1/1 plans complete

Plans:
- [x] 210.1-01 — Seed tabLensMemory from the pending-calibration marker on return-mount

## Backlog

### Phase 999.1: Link CA judicial districts to geofences (BACKLOG)

**Goal:** [Captured for future planning] All 504 California JUDICIAL districts (LA County Superior Court, CA Courts of Appeal, CA Supreme Court; ~502 active judge records) have a NULL `essentials.districts.geo_id`, so they are unlinked to any geofence and structurally unreachable from an address search — they never surface in the Judges tab. This is a data-completeness gap, NOT a frontend filter or intentional suppression (verified in Phase 210: `classifyBucket` → Judges tab would show them if present). Indiana's 70 judicial districts all have geo_ids and surface correctly. Fix = link CA judicial districts to geofences (county-level for LA County Superior Court, statewide for CA appellate/supreme). Low priority — judges provide limited value at this stage. Discovered 2026-07-19 during Phase 210 verification.
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
