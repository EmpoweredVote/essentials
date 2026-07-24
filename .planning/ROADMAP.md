# Roadmap: Essentials â Empowered Vote

Per-milestone phase detail is archived under `.planning/milestones/v{X.Y}-ROADMAP.md` at milestone
close. This file is the milestone index; the active milestone is expanded in full below, and
shipped milestones are collapsed into `<details>` blocks.

## Milestones

- **v25.0 Collin County TX Data-Completeness (ACTIVE)** — Phases 217–220 (planning; data-only, closes known gaps in the existing 23-government Collin County, TX browse list)
- ✅ **v24.0 Results-Page Search & Header Overhaul** — Phases 212–216 (shipped 2026-07-23; detail archived to `.planning/milestones/v24.0-ROADMAP.md`)
- ✅ **v23.0 Educators & Judges Tabs** — Phases 207–211 (shipped 2026-07-20; Phase 209 deferred by design)
- ✅ **v22.0 Tucson & Arizona** — Phases 190–203 (shipped 2026-07-23; 201–203 appended Coachella Valley, CA). Phase 206 AZ-2026 candidate reconcile + 197/198 title reconcile deferred to a post-Aug-6-certification follow-up. Detail archived to `.planning/milestones/v22.0-ROADMAP.md`.
- â **v21.0 Smart Banners** â Phases 187â189 (shipped 2026-07-08)
- â **v20.0 West-Metro Washington County, OR** â Phases 174â186 (shipped 2026-07-05)
- â **v18.0 Las Vegas & Clark County, NV** â Phases 158â168, 173 (shipped 2026-06-30)
- â **v19.0 Dark-Mode Redesign & Section Banners** â Phases 169â172 (shipped 2026-06-28, formally closed 2026-07-05)
- â **v17.0 LA County City Coverage Wave 2** â Phases 142â157 (shipped 2026-06-22)
- â earlier milestones v2.0âv16.0 â see `.planning/milestones/` archives + `MILESTONES.md`

## Roadmap: v25.0 Collin County TX Data-Completeness

### Overview

Closes the known, DB-verified data gaps in the already-seeded Collin County, TX coverage — a
23-government browse list first deep-seeded in v3.0 — with zero new UI surface and zero new
geography. Four tracks, each touching its own set of governments: **(1)** reconcile 5 hardcoded
browse geo_ids that currently resolve to no government at all, including the two largest cities
(Plano, Richardson); **(2)** research and seat ~9 vacant offices across 5 smaller cities; **(3)**
backfill races + candidates for the 9 governments with zero elections and thicken thin coverage
elsewhere; **(4)** fill in contact data (`web_form_url` empty across all 18 resolving governments,
email gaps in 6 cities, `valid_to` term-end dates missing). Compass stance research is explicitly
**out of scope** this milestone (blocked on finalizing the proposed local compass questions);
headshot gaps for the 5 zero-photo cities are also out of scope (no known online source — needs
manual operator sourcing). Phase numbering continues from v24.0 (closed at 216) — this milestone
starts at **Phase 217**.

Phases 218–220 all operate on the same 18 already-resolving governments and are sequenced
vacancies → elections → contacts so that newly-seated incumbents (218) inform election/re-election
context (219) and pick up contact data too (220); none is a hard blocker on the others. Phase 217
touches a completely disjoint set of 5 governments and has no data dependency on 218–220 — it's
sequenced first only because it's the highest-value fix (unblocks 2 of the county's largest cities)
and because any downstream gaps it surfaces in those 5 governments are captured as a Phase 217
success criterion (spot-check + documentation) rather than spawning new phases, since
REQUIREMENTS.md's COLLIN-ELECT/CONTACT/PEOPLE items are scoped to the 18 governments that were
already verified resolvable on 2026-07-23.

### Milestone-wide conventions (carry into every phase)

- **Data-only.** No new frontend feature surface beyond wiring the corrected browse geo_ids into the
  existing hardcoded list; no code paths change shape.

- **No compass stance research this milestone.** Deferred pending finalization of the proposed local
  compass questions — do not seed stances as a side effect of any phase here.

- **Split-section SQL check after every seeding phase** (218–220 write rows) — verify zero
  split-section defects before closing.

- **Elections view hides zero-candidate shells** — a seeded race with no candidates yet is expected
  and correct during an open filing period; do not fabricate candidates to fill a shell.

- **Headshot gaps out of scope.** Blue Ridge, Farmersville, Lowry Crossing, Nevada, and Saint Paul
  have 0 headshots and no known online source — do not attempt automated sourcing.

- **Evidence-only, cited research** for both the vacancy-fill (218) and candidate-backfill (219)
  passes — no fabricated incumbents, no guessed candidates; document genuine vacancies/empty races as
  such rather than leaving them ambiguous.

- **Gaps surfaced in the 5 newly-reconciled governments (217) are documented, not silently absorbed**
  into 218–220's scope — they weren't part of the verified-gap list this milestone's requirements
  were built from, so any new findings become an explicit follow-up note, not an unplanned scope
  expansion.

### Phases

**Phase Numbering:**

- Integer phases (217, 218, 219, 220): Planned milestone work, continuing from v24.0 (closed at 216)
- Decimal phases (217.1, 217.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 217: Browse Geo_ID Reconcile** - ✅ COMPLETE 2026-07-23 (quick task 260723-lfc). Premise was STALE — all 23 browse geo_ids already resolved (coverage.js already correct); verified + documented mapping + COLLIN-BROWSE-01..04 met. No code/DB change needed.
- [x] **Phase 218: Vacancies & Missing People** - Research and seat / document ~21 unseated offices across 11 cities (re-verified live 2026-07-23): Anna(2), Blue Ridge(2), Fairview(3), Josephine(1), Lowry Crossing(1), Lucas(2), Nevada(3), Parker(3) + the 3 Ph217-reconciled cities Plano(1), Princeton(1), Van Alstyne(2). Covers ALL 23 govs (the 5 reconciled folded in per operator request). (completed 2026-07-23)
- [x] **Phase 219: Elections & Candidates Backfill** - Seed races + candidates for the 12 zero-race governments (re-verified 2026-07-23): the original 9 (Blue Ridge, Farmersville, Josephine, Lavon, McKinney, Melissa, Nevada, Saint Paul, Weston) + the 3 Ph217-reconciled Plano, Richardson, Van Alstyne; thicken thin coverage elsewhere — ✅ EXECUTED 2026-07-24 (migs 1393-1399, 37 races/54 candidates; Melissa documented-open; operator browse spot-check owed)
- [ ] **Phase 220: Contact Data Backfill** - Populate `web_form_url` (empty across ALL 23 govs), missing emails (Anna, Farmersville, Frisco, Lavon, Murphy, Celina + Ph217-reconciled Prosper, Princeton, Van Alstyne), and `valid_to` term-end dates across all 23 governments
- [ ] **Phase 221: Collin County Headshots** - Source + attach real photos for officials missing one (~31 from prior audit + Brandon Smith & Gopal Ponangi from the 219 seating fixes); `/find-headshots`, evidence-only, 600×750 4:5 crop-only, blank where none exists
- [ ] **Phase 222: Collin County Stances** - Evidence-only compass stance research for Collin officeholders; one politician at a time, all topics, blank spoke where no evidence, antipartisan (the heavy phase; do after profiles are fleshed out)

### Phase Details

#### Phase 217: Browse Geo_ID Reconcile

**Goal**: Every one of the 23 Collin County governments in the browse list resolves to real officials data.
**Depends on**: Nothing (first phase; v24.0 closed at Phase 216)
**Requirements**: COLLIN-BROWSE-01, COLLIN-BROWSE-02, COLLIN-BROWSE-03, COLLIN-BROWSE-04 — all **Met**
**Status**: ✅ COMPLETE 2026-07-23 via quick task 260723-lfc. **The premise was stale** — `src/lib/coverage.js` already carried the correct geo_ids (Plano `4858016`, Richardson `4861796`, Prosper `4859696`, Princeton `4859576`, Van Alstyne `4874924`); the phantom `4863000`-style codes existed only in an 82-day-old memory snapshot, never in current code. Live browse spot-check confirmed all 5 resolve with seated rosters. No code/DB change was required — this was verify + document.
**Success Criteria** (all TRUE, verified):

  1. ✅ Browsing Collin County shows Plano's officials (geo_id `4858016`, 8 seated)
  2. ✅ Browsing Collin County shows Richardson's officials (geo_id `4861796`, 7 seated)
  3. ✅ Browsing Collin County shows officials for Prosper (`4859696`), Princeton (`4859576`), and Van Alstyne (`4874924`)
  4. ✅ All 23 Collin County browse entries resolve to a real government row; corrected geo_id mapping documented in `.planning/quick/260723-lfc-*/260723-lfc-GEOID-MAPPING.md`
  5. ✅ The 5 reconciled governments were spot-checked; gaps folded into 218/219/220 per operator request (see re-verified gap lists in those phases)

**Plans**: 1 quick task (260723-lfc)

#### Phase 218: Vacancies & Missing People

**Goal**: Every Collin County office reflects who actually holds it today — researched incumbents are seated where a seat is genuinely filled, and truly empty seats are documented as vacant rather than left ambiguous.
**Depends on**: Nothing. **Now spans all 23 govs** (the 5 Ph217-reconciled cities folded in per operator request 2026-07-23); sequenced before 219/220 so newly-seated people carry forward.
**Requirements**: COLLIN-PEOPLE-01, COLLIN-PEOPLE-02
**⚠ Re-verified live 2026-07-23** — the original gap list was itself incomplete (same stale-data cause as 217). True universe = **21 unseated offices (politician_id NULL) across 11 cities**. NOTE "unseated" = office row with no linked politician; 218 disambiguates each into genuine-vacancy (documented) vs needs-seeding (researched + seated with citation).
**Success Criteria** (what must be TRUE):

  1. Each of these unseated offices shows a researched, cited incumbent OR is explicitly documented as genuinely vacant: **Anna (2), Blue Ridge (2), Fairview (3), Josephine (1), Lowry Crossing (1), Lucas (2), Nevada (3), Parker (3)** — 17 offices across the 8 originally-in-scope cities (note: Parker and Lucas each had one MORE unseated office than the original roadmap estimate; Anna, Fairview, Josephine were missing from the original list entirely)
  2. The 3 Ph217-reconciled cities' unseated offices receive the same treatment: **Plano (1), Princeton (1), Van Alstyne (2)** — 4 offices
  3. No office across all 23 resolving Collin County governments is left in an ambiguous empty state — every seat is either a real seated person or a clearly flagged vacancy
  4. Split-section SQL check runs clean after seeding

**Plans**: 5 plans in 5 sequential waves (planned 2026-07-23)

- [x] 218-01-PLAN.md — Structural migration: add 6 missing office rows (Blue Ridge +1, Lowry Crossing +4, Weston +1) after blocking live seat-count re-verify
- [x] 218-02-PLAN.md — Idempotent data migration seating the 20 directly-cited incumbents (party NULL, no stances, `politician_id IS NULL` guard) + post-seed SQL gates
- [x] 218-03-PLAN.md — Deeper D-04 re-verify of the 7 flagged seats (Fairview Seat 4, Van Alstyne Place 6, Nevada trio, Lucas Place 1/2) → seat-or-document `is_vacant=true`
- [x] 218-04-PLAN.md — `/find-headshots` 600×750 pipeline for newly-seated people where a source exists; honest blank for Blue Ridge/Lowry Crossing/Nevada; audit-only image migration
- [x] 218-05-PLAN.md — Full SQL verification battery (0 ambiguous seats across all 23 govs, D-02 seat-count spot-check on the other 12) + split-section + blocking live-browse spot-check

#### Phase 219: Elections & Candidates Backfill

**Goal**: Every Collin County government with a real municipal election shows its races and candidates on the ballot lookup — no zero-race governments, no thin coverage where seats have a known election.
**Depends on**: Nothing. **Now spans all 23 govs** (the 3 Ph217-reconciled zero-race cities folded in per operator request); benefits from Phase 218 seating incumbents first, not a hard blocker.
**Requirements**: COLLIN-ELECT-01, COLLIN-ELECT-02, COLLIN-ELECT-03
**⚠ Re-verified live 2026-07-23** — zero-race count is **12, not 9**: the original 9 + the 3 Ph217-reconciled cities (Plano, Richardson, Van Alstyne) also have 0 races.
**Success Criteria** (what must be TRUE):

  1. The 12 zero-race governments (Blue Ridge, Farmersville, Josephine, Lavon, McKinney, Melissa, Nevada, Saint Paul, Weston + **Plano, Richardson, Van Alstyne**) each show at least one seeded race with candidates where public records exist
  2. Thin cities are reviewed and backfilled so every seat with a known election has a corresponding race record
  3. Every seeded race links to the correct office and renders correctly on `/results` — no split-section defects, no zero-candidate shells masking a real race
  4. A resident browsing any of the 23 resolving Collin County governments sees their actual current/next municipal race instead of an empty Elections section

**Plans**: 9 plans
**Wave 1**

- [x] 219-01-PLAN.md — Pre-flight: candidate_staging probe + migration counter + shared election_id + resolve open cities (Lavon/Saint Paul/Melissa) & runoff finals (Wave 1)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 219-02-PLAN.md — Shared-election zero-race tier: Blue Ridge, Farmersville, Nevada, Van Alstyne (Wave 2)
- [x] 219-03-PLAN.md — Off-cycle/open zero-race tier: Josephine, Lavon, Saint Paul, Melissa (Wave 2)
- [x] 219-04-PLAN.md — Fallback-year tier: McKinney (2025 + runoff), Richardson (2025) (Wave 2)
- [x] 219-05-PLAN.md — Staggered tier: Plano (per-seat + Jan-2026 special), Weston (November cycle) (Wave 2)
- [x] 219-06-PLAN.md — Runoff-closure tier: Longview D3 general + Princeton Place 4 runoff (Wave 2)
- [x] 219-07-PLAN.md — Thin backfill A: Allen, Anna, Lucas, Murphy, Prosper (Wave 2)
- [x] 219-08-PLAN.md — Thin backfill B: Parker, Celina, Frisco, Fairview, Lowry Crossing (Wave 2)

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 219-09-PLAN.md — Phase-close 24-government coverage sweep + browse spot-check (Wave 3) *(machine gates green; operator browse spot-check owed)*

**Cross-cutting constraints:**

- Every seeded race links to the correct existing office_id and renders on /results (COLLIN-ELECT-03).

#### Phase 220: Contact Data Backfill

**Goal**: Every Collin County official's profile carries a real, working way to reach them, and an accurate term end-date where publicly known.
**Depends on**: Nothing. **Now spans all 23 govs** (the 3 Ph217-reconciled cities folded in per operator request); benefits from Phase 218 seating incumbents first, not a hard blocker.
**Requirements**: COLLIN-CONTACT-01, COLLIN-CONTACT-02, COLLIN-CONTACT-03
**⚠ Re-verified live 2026-07-23** — `web_form_url` is empty across **all 23** govs (not just 18). Fully-missing email cities now include the 3 Ph217-reconciled (Prosper, Princeton, Van Alstyne); Celina is partial (1/7).
**Success Criteria** (what must be TRUE):

  1. `web_form_url` is populated for officials whose city publishes an official contact form or contact page (currently empty across all 23 resolving governments)
  2. Email addresses are filled where publicly listed for the fully-missing cities — Anna, Farmersville, Frisco, Lavon, Murphy, **Prosper, Princeton, Van Alstyne** — plus partial-coverage cities (Celina 1/7, and any others below full)
  3. `valid_to` term-end dates are populated for seated officials where the term is publicly documented
  4. A resident viewing any Collin County official's profile sees at least one working contact method wherever the city publishes one

**Plans**: 6 plans (field-based migration grouping per RESEARCH.md)
- [ ] 220-01-PLAN.md — Preflight: Frisco Place 4 officeholder resolution (RESEARCH Pitfall 3) + migration-number lock
- [ ] 220-02-PLAN.md — Migration A: web_form_url batch (11 form-publishing cities, one city-wide form per official, D-01)
- [ ] 220-03-PLAN.md — Migration B1: seat-alias emails (Blue Ridge, Nevada, Melissa; D-02)
- [ ] 220-04-PLAN.md — Migration B2a: personal emails batch 1 (Frisco, Princeton, Prosper, Allen, Fairview, Celina)
- [ ] 220-05-PLAN.md — Migration B2b: personal emails batch 2 (Parker, Saint Paul, Weston, Lowry Crossing, Lucas)
- [ ] 220-06-PLAN.md — Apply all + verification + valid_to spot-check (D-03) + honest-blank register + deferred Migration C (GAP cities Josephine/Plano/Richardson)

### Progress

**Execution Order:**
Phase 217 is independent of 218–220 (disjoint government sets) and can run in any relative order.
218 → 219 → 220 is the suggested sequence within the shared 18-government set (vacancies seated
first, then election/candidate backfill, then contact data last so newly-seated officials get
contact info too) — none is a hard blocker on the next.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 217. Browse Geo_ID Reconcile | 1/1 (quick) | Complete ✓ | 2026-07-23 |
| 218. Vacancies & Missing People | 5/5 | Complete    | 2026-07-23 |
| 219. Elections & Candidates Backfill | 0/TBD | Not started | - |
| 220. Contact Data Backfill | 0/6 | Planned | - |

### Coverage

All 12 v25.0 requirements mapped 1:1 to exactly one phase — no orphans, no duplicates.

| Requirement | Phase |
|-------------|-------|
| COLLIN-BROWSE-01 | 217 |
| COLLIN-BROWSE-02 | 217 |
| COLLIN-BROWSE-03 | 217 |
| COLLIN-BROWSE-04 | 217 |
| COLLIN-PEOPLE-01 | 218 |
| COLLIN-PEOPLE-02 | 218 |
| COLLIN-ELECT-01 | 219 |
| COLLIN-ELECT-02 | 219 |
| COLLIN-ELECT-03 | 219 |
| COLLIN-CONTACT-01 | 220 |
| COLLIN-CONTACT-02 | 220 |
| COLLIN-CONTACT-03 | 220 |

## Roadmap: v22.0 Tucson & Arizona

> ✅ **SHIPPED 2026-07-23** — Phases 190–203 (AZ foundation + Tucson-metro + Coachella Valley deep-seeds
> + 2026 race discovery). Full detail archived to `.planning/milestones/v22.0-ROADMAP.md`; requirements
> to `.planning/milestones/v22.0-REQUIREMENTS.md`; audit to `.planning/milestones/v22.0-MILESTONE-AUDIT.md`.
> **Deferred to a post-Aug-6-certification follow-up:** Phase 206 (AZ 2026 candidate reconcile — the
> primary held 2026-07-21 does not certify until the ~Aug-6 state canvass) and the Phases 197/198 title
> reconcile. Phase 206 RESEARCH.md + CONTEXT.md are written and execution-ready. Phase 200 (retrospective)
> was folded into this close.

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

### Phase 216: Unincorporated Locality Label — show 'Unincorporated {County}' when a searched point falls outside any incorporated place (gated to place-loaded states)

**Goal:** When a searched point (address OR anonymous coordinate) falls outside any incorporated place but within a county, the results-page locality banner reads "Unincorporated {County}, {ST}" (e.g. "Unincorporated Pima County, AZ") — gated to place-loaded states so a place-less-looking city in an un-loaded state never false-positives.
**Requirements**: LOC-01, LOC-02, LOC-03, LOC-04
**Depends on:** Phase 215 (no code dependency; cross-repo backend→frontend ordering is internal to this phase)
**Plans:** 4 plans in 4 waves

**Execution Order:** backend impl (216-01) → backend deploy + live smoke (216-02, BLOCKING) → frontend impl (216-03) → frontend deploy + live UAT (216-04, BLOCKING). Hard backend-before-frontend: the frontend consumes the live `locality` field, so 216-03 depends on 216-02 shipping + smoke-verifying it in production.

Plans:

- [x] 216-01-PLAN.md — [accounts-api] Backend locality probe: two ST_Covers probes (place G4110/G4120 + county G4020) + buildLocality() gate (11-state PLACE_LOADED_STATES, MO excluded) + locality on AddressSearchResult + /candidates/search subset (LOC-01/02/03; TDD)
- [x] 216-02-PLAN.md — [accounts-api, BLOCKING] Confirm live G4110 coverage vs gate list, push to Render master, live smoke of unincorporated/incorporated/un-loaded fixtures × address+coordinate paths, zero-write assertion, operator sign-off
- [x] 216-03-PLAN.md — [essentials] Frontend threading: unincorporatedLabel() helper + locality unwrap in api.jsx (both entry points) + usePoliticianData + coordLocality state + representingCity branches for both modes (LOC-04)
- [x] 216-04-PLAN.md — [essentials, BLOCKING] Full suite + build, push to Render main, live UAT of "Unincorporated {County}, ST" in BOTH address and coordinate modes + incorporated/un-loaded controls + tribal/county/browse regression checks

### Phase 221: Collin County Headshots

**Goal:** Every Collin County officeholder whose photo is publicly available carries a real, correctly-sized headshot; anyone with no available photo stays blank (never a placeholder or AI face).
**Scope:** ~31 seated officials missing a photo (prior audit) + the 2 newly seated by the Phase-219 seating fixes — Brandon Smith (Longview D3, mig 1400) and Gopal Ponangi (Frisco Place 4, mig 1404).
**Constraints:** use the `/find-headshots` skill; real licensed/public-source photos only; 600×750 (4:5), crop-only (never stretch), eyes ~1/3 from top, head+shoulders, no text/graphics on faces.
**Requirements**: COLLIN-HEADSHOT-01 (audit + source missing headshots), COLLIN-HEADSHOT-02 (correct sizing/crop, no graphics/placeholders)
**Depends on:** Nothing hard; benefits from 218/219 (people seated) + 220 (profiles fleshed out) first.
**Plans:** TBD (run `/gsd-plan-phase 221`)

Plans:

- [ ] TBD (run /gsd-plan-phase 221 to break down)

### Phase 222: Collin County Stances

**Goal:** Each researched Collin County officeholder carries evidence-cited compass stances where their positions are documented, and blank spokes where not.
**Constraints (heavy phase):** research ONE politician at a time (parallel burns quota); ALL compass topics per politician; evidence-only — no evidence = blank spoke, never default a stance; stances are discrete 1–5 "chairs"; antipartisan (party never displays).
**Requirements**: COLLIN-STANCE-01 (per-politician all-topic evidence-only research), COLLIN-STANCE-02 (apply 1–5 stances, blank where unsourced)
**Depends on:** Phase 221 (soft — do after profiles have photos/contacts).
**Plans:** TBD (run `/gsd-plan-phase 222`)

Plans:

- [ ] TBD (run /gsd-plan-phase 222 to break down)

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

<details>
<summary>✅ v24.0 Results-Page Search & Header Overhaul (Phases 212–216) — SHIPPED 2026-07-23</summary>

Full detail: `.planning/milestones/v24.0-ROADMAP.md` · requirements: `.planning/milestones/v24.0-REQUIREMENTS.md`

Replaced the cluttered multi-row Results header with one always-editable `<LocationCombobox>` that
silently classifies address / bare place-name / decimal-coordinate input and routes to a coherent
location profile — guaranteeing at minimum US Senators + Governor/state executives + county officials
anywhere in the US. The milestone "owns the search stack": Google Places is dropped entirely in favor
of a new backend DB place-name resolver (pg_trgm over `geofence_boundaries`/`governments` + a
build-time US Census Gazetteer ingest) plus a new anonymous, stateless coordinate-lookup endpoint. The
header also declutters — type filter defaults to Elected (Judges keep Appointed), compass lenses
become accessible icon buttons, and the redundant "Search by name" filter is removed. Phase 216 added
the "Unincorporated {County}, {ST}" locality label; close-time polish covered bare place-name labels
and lens-tooltip focus summaries.

- [x] Phase 212: Backend Place-Name Resolver & National Fallback (6/5) — completed 2026-07-21
- [x] Phase 213: Anonymous Coordinate Lookup Endpoint (3/3) — completed 2026-07-21
- [x] Phase 214: Unified Location Combobox & Google Places Removal (6/6) — completed 2026-07-21
- [x] Phase 215: Header Declutter — Elected Default, Compass Icons, Search-by-Name Removal (3/3) — completed 2026-07-22
- [x] Phase 216: Unincorporated Locality Label (4/4) — completed 2026-07-22

All 18 v24.0 requirements mapped 1:1 — no orphans, no duplicates. Closeout: override_closeout — 12
pre-existing cross-milestone items acknowledged & deferred (see STATE.md → Deferred Items); all
v24.0 phases (212–216) verified passed.

</details>

<details>
<summary>✅ v23.0 Educators & Judges Tabs (Phases 207–211) — SHIPPED 2026-07-20</summary>

Full detail: `.planning/milestones/v23.0-ROADMAP.md` · requirements: `.planning/milestones/v23.0-REQUIREMENTS.md` · audit: `.planning/milestones/v23.0-MILESTONE-AUDIT.md`

Frontend feature milestone on the results/officials view: added **Educators** (school-board) and
**Judges** as first-class, compass-integrated tabs beside **Representatives** and **Elections**,
pulling school-board/judicial office-holders out of the Representatives list, hiding empty tabs, and
shifting the default compass lens per tab. Built on the Phase 204 data-driven lens switcher. One
evidence-based deep-dive stance-research phase (Trump/Vance/Rubio). No new geographic/seeding data.

- [x] Phase 207: Officials Classification (1/1) — completed 2026-07-18
- [x] Phase 208: Educators & Judges Tabs (2/2) — completed 2026-07-18
- [~] Phase 209: Education Lens Scaffolding — **DEFERRED by design** (blocked on educator stance/topic groundwork; carried to a future milestone)
- [x] Phase 210: Per-Tab Compass Integration (2/2) — completed 2026-07-19
- [x] Phase 210.1: Fix calibration lens revert (CR-01 gap closure, 1/1) — completed 2026-07-19
- [x] Phase 211: Deep-Dive Stance Research — Trump/Vance/Rubio (5/5) — completed 2026-07-20

In-scope requirements 7/7 satisfied (CLASS-01, TAB-01/02/03, CMP-01/02, RES-01); EDU-01/02 deferred
with Phase 209. Cross-phase integration PASS; build clean; 211/211 tests. One optional CR-01
calibrate-return live re-check remains as accepted tech debt.

</details>

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

**v25.0 Collin County TX Data-Completeness is the active milestone** — Phases 217–220 (data-only;
closes known gaps in the existing 23-government Collin County, TX browse list). See the expanded
roadmap above. Per-milestone progress tables are archived to `.planning/milestones/v{X.Y}-ROADMAP.md`
at close.

## Backlog

### Phase 999.1: Link CA judicial districts to geofences (BACKLOG)

**Goal:** [Captured for future planning] All 504 California JUDICIAL districts (LA County Superior Court, CA Courts of Appeal, CA Supreme Court; ~502 active judge records) have a NULL `essentials.districts.geo_id`, so they are unlinked to any geofence and structurally unreachable from an address search — they never surface in the Judges tab. This is a data-completeness gap, NOT a frontend filter or intentional suppression (verified in Phase 210: `classifyBucket` → Judges tab would show them if present). Indiana's 70 judicial districts all have geo_ids and surface correctly. Fix = link CA judicial districts to geofences (county-level for LA County Superior Court, statewide for CA appellate/supreme). Low priority — judges provide limited value at this stage. Discovered 2026-07-19 during Phase 210 verification.
**Requirements:** TBD
**Plans:** 0 plans

Plans:

- [ ] TBD (promote with /gsd:review-backlog when ready)
