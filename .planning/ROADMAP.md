# Roadmap: v18.0 Las Vegas & Clark County, NV

## Overview

Open **Nevada** as a fully-covered state (no NV data exists yet) and deep-seed the **Clark County
(Las Vegas) metro** to Tier 1 depth. The journey follows the proven new-state sequencing used for
CA (v7.0), OR (v8.0), ME (v6.0), MD (v11.0), and VA (v12.0): **state foundation first** (TIGER
geofences → state + federal government → 63 state legislators), **then metro deep-seeds**
(Clark County Commission, City of Las Vegas, Henderson, North Las Vegas, Boulder City), **then**
the CCSD Board of Trustees, NV 2026 elections + discovery, and a Nevada playbook retrospective +
milestone close. Phases continue from 157 (v17.0); this milestone starts at **Phase 158**.
Legislature compass stances are **deferred** to a follow-up milestone (the OR v8.0→v9.0 split) —
this milestone seeds + headshots legislators only.

## Milestone-wide conventions (carry into every phase)

- **New state, greenfield** — no NV data exists. State groundwork (geofences → government →
  legislators) **must precede** any city/county deep-seed (nothing routes without geofences).

- **TIGER first.** Verify the loader key per tier from the actual TIGER2024 zip filename
  (`cd119` not `cd` — the Maine/Oregon trap); wrong key = silent no-op. Section-split scan after.

- **Per-government build order:** `governments` row + chamber(s) → roster (offices, correct
  district-vs-at-large structure + seat count, verified per government) → 600×750 headshots
  (4:5 Lanczos, `press_use`, `politician_images.type='default'`) → evidence-only compass stances
  → spot-check render.

- **Stances:** evidence-only, **one research agent at a time** (rate-limit rule), all live compass
  topics, 100% citation, **no default values**, honest blank spokes where no public record exists.
  Skip judicial-* topics for legislators and appointed officials. Stance migrations apply via raw
  SQL and do **not** register in `supabase_migrations.schema_migrations` — the **on-disk counter is
  authoritative** (currently **next = 1048**). Structural migrations register normally.

- **The Strip is unincorporated** — the **Clark County Commission** (7 members) governs the
  Strip / Paradise / Spring Valley / Sunrise Manor / Enterprise. This is essential coverage, not
  optional, and is the first metro deep-seed.

- **Schema:** `essentials.governments` (INSERT via `WHERE NOT EXISTS` — no geo_id unique
  constraint), `essentials.chambers` (`slug` is generated — never INSERT it; `official_count` lives
  here, not on `governments`), `essentials.politician_images`, `inform.politician_answers`
  (stances), `inform.compass_topics` (`topic_key` / `is_live`), `inform.compass_stances` (chairs).

- **Antipartisan:** party may be stored but **never displayed** on profiles.
- **Surfacing target** is `src/lib/coverage.js` (NOT Landing.jsx) — a city/state surfaces with the
  purple `hasContext` chip once it carries ≥1 stance.

- **gsd-executor has no Supabase MCP** — DB-verify steps run inline within the phase.

## Phases

**Phase Numbering:**

- Integer phases (158, 159, …): Planned milestone work
- Decimal phases (e.g. 160.1): Urgent insertions (marked INSERTED)

- [x] **Phase 158: Nevada TIGER Geofences** - Load all NV boundary tiers so any NV address routes correctly (completed 2026-06-23)
- [x] **Phase 159: Nevada State & Federal Government** - Governor + constitutional officers + 2 US Senators + 4 US House reps (completed 2026-06-23)
- [x] **Phase 160: Nevada Legislature (seed + headshots)** - 21 Senators + 42 Assembly members with headshots; stances deferred
- [x] **Phase 161: Clark County Commission Deep-Seed** - 7-member board governing the unincorporated Strip
- [x] **Phase 162: City of Las Vegas Deep-Seed** - Mayor + City Council (completed 2026-06-28)
- [x] **Phase 163: Henderson Deep-Seed** - NV's 2nd-largest city (completed 2026-06-28)
- [x] **Phase 164: North Las Vegas Deep-Seed** - Mayor + City Council
- [x] **Phase 165: Boulder City Deep-Seed** - Mayor + City Council (completed 2026-06-29)
- [ ] **Phase 166: CCSD Board of Trustees Deep-Seed** - 5th-largest US school district, elected board
- [ ] **Phase 167: NV 2026 Elections & Discovery** - Governor + 42 Assembly + ~10 Senate + 4 US House races + discovery armed
- [ ] **Phase 168: Nevada Playbook Retrospective & Close** - Surface NV jurisdictions, document GOTCHAs, audit, close milestone

## Phase Details

### Phase 158: Nevada Tiger Geofences

**Goal**: Nevada becomes geographically routable — any NV address resolves to its correct federal, state, county, and city representatives.
**Depends on**: Nothing (first phase of milestone; v17.0 closed at Phase 157)
**Requirements**: NV-GEO-01
**Success Criteria** (what must be TRUE):

  1. A Las Vegas Strip address (unincorporated) returns Clark County tiers with no city — the Strip is correctly recognized as unincorporated (no false G4110 city match).
  2. A City of Las Vegas, Henderson, North Las Vegas, and Boulder City address each returns the correct G4110 city tier plus county/CD/SLDU/SLDL.
  3. NV TIGER boundaries loaded for all tiers (G4110 cities, G4020 counties, CDs, SLDU, SLDL); loader keys verified from the actual TIGER zip filenames.
  4. Section-split scan returns 0 rows (no mis-parented boundaries).

**Plans**: 2 plans

- [x] 158-01-PLAN.md — Add NV to TIGER loader (4 allowlists), create verify+smoke scripts, dry-run to confirm sldl/place counts (no DB writes)
- [x] 158-02-PLAN.md — Live-load all 5 NV tiers, verify gates (Strip-unincorporated + section-split), run 5-address smoke test

### Phase 159: Nevada State & Federal Government

**Goal**: A NV resident sees their full statewide and federal representation — Governor, constitutional officers, both US Senators, and their US House member — each with a headshot.
**Depends on**: Phase 158 (geofence-linked federal districts)
**Requirements**: NV-STATE-01, NV-STATE-02
**Success Criteria** (what must be TRUE):

  1. Governor Lombardo + Lt. Governor, Attorney General, Secretary of State, Treasurer, and Controller render as STATE_EXEC officials with chambers, offices, and 600×750 headshots.
  2. Both US Senators (Cortez Masto + Rosen) render as NATIONAL_UPPER with headshots; the two-senators-share-one-district uniqueness pattern is handled (key = district_id + politician_id).
  3. Each of the 4 US House reps renders for an address in their geofence-linked district with a 600×750 headshot.
  4. `districts.state` casing is correct (uppercase 'NV' for STATE_EXEC/NATIONAL tiers) so backend queries match.

**Reconcile note**: NOT greenfield. DB audit (159-RESEARCH.md) found 11 of 12 target officials already exist. Only net-new work is **Controller Andy Matthews** (mig 1050) + **4 US House headshots** (mig 1051). Senators render + casing + two-senators-one-district are pre-satisfied (verify-only). Next structural migration = **1050** (DB MAX=1049; STATE.md's "1048" is stale — correct at phase close).**Plans**: 3 plans
**Wave 1**

- [x] 159-01-PLAN.md — Create Controller Andy Matthews end-to-end (chamber + STATE_EXEC district + politician + office, mig 1050) + 600×750 headshot (script + audit-only mig 1052)
- [x] 159-02-PLAN.md — Upload 600×750 headshots for the 4 US House reps (unitedstates/images, resize-only) + audit-only politician_images mig 1051

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 159-03-PLAN.md — Inline SQL-audit + live-browse verification of all 4 success criteria (6 execs, 2 senators, 4 House, casing, 0 section-split) + human-verify checkpoint

### Phase 160: Nevada Legislature (seed + headshots)

**Goal**: Any NV address returns its correct State Senator and Assembly member, each with a headshot. (Compass stances deferred to a follow-up milestone.)
**Depends on**: Phase 158 (SLDU/SLDL geofences)
**Requirements**: NV-LEG-01, NV-LEG-02
**Success Criteria** (what must be TRUE):

  1. All 21 NV State Senators seeded with offices linked to SLDU districts; a sample NV address returns the correct senator.
  2. All 42 NV Assembly members seeded with offices linked to SLDL districts; a sample NV address returns the correct assembly member.
  3. All 63 legislators have 600×750 headshots in Supabase Storage (genuine gaps documented, no fabricated photos).
  4. No compass stances are created for legislators this milestone (explicitly deferred — verified absent).

**Plans**: 3 plans
**Wave 1**

- [x] 160-01-PLAN.md — Wave-0 DB probes (21/42 districts, Senate keying, unused ext_id ranges) + write structural migration 1053 (2 chambers + 63 politicians + 63 offices linked to existing SLDU/SLDL + back-fills) + roster operator-verify checkpoint + inline apply

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 160-02-PLAN.md — Write _tmp-nv-legislature-headshots.py (crop-4:5 → 600x750, archive.leg.state.nv.us) + run inline + write/apply audit-only headshot migration 1054

**Wave 3** *(blocked on Waves 1-2)*

- [x] 160-03-PLAN.md — Inline 9 SQL/HTTP verification checks (21/42 counts, linkage, 63 headshots CDN-200, 0 stances, casing nv, 0 section-split, ledger 1053) + address-routing/correct-person human-verify checkpoint

### Phase 161: Clark County Commission Deep-Seed

**Goal**: A resident of the unincorporated Las Vegas Strip / Paradise / Spring Valley / Sunrise Manor / Enterprise looks up who represents them and gets the correct County Commissioner — with evidence-only stances on their profile.
**Depends on**: Phase 158 (county geofences)
**Requirements**: CLARK-01
**Success Criteria** (what must be TRUE):

  1. A Strip / Paradise / Spring Valley address returns the correct Clark County Commissioner (no empty LOCAL section).
  2. All 7 commissioners render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on commissioner profiles — 100% cited, honest blank spokes where no public record exists, zero default values.
  4. Clark County surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: 3 plans
**Wave 1**

- [x] 161-01-PLAN.md — Structural seed: Wave-0 probes + roster checkpoint + mig 1055 (Clark County government + Board of County Commissioners + 7 commissioner offices on the single COUNTY district + back-fill)

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 161-02-PLAN.md — Headshots: _tmp-clark-county-commission-headshots.py + audit-only mig 1056 (7 politician_images) + coverage.js COVERAGE_COUNTIES entry

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 161-03-PLAN.md — Stances (one agent at a time, evidence-only) audit-only migs 1057-1063 + 9-check E2E verification + human-verify checkpoint

### Phase 162: City of Las Vegas Deep-Seed

**Goal**: A City of Las Vegas resident looks up who represents them and gets the correct Mayor + ward council member, with evidence-only stances on their profiles.
**Depends on**: Phase 158 (city geofences)
**Requirements**: CLARK-02
**Success Criteria** (what must be TRUE):

  1. A City of Las Vegas address returns the correct Mayor + ward council member; form of government (mayor + council, ward vs at-large) verified and modeled correctly.
  2. All seated officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blanks, no default values.
  4. City of Las Vegas surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: 3 plans
**Wave 1**

- [x] 162-01-PLAN.md — Wave-0 probes + load 6 X0015 ward geofences + structural migration (standalone city government + chamber + LOCAL_EXEC Mayor + 6 LOCAL wards) + coverage.js NV block

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 162-02-PLAN.md — 7 City Council headshots (Azure Blob, 600×750 crop-4:5) + audit-only politician_images migration

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 162-03-PLAN.md — evidence-only stances (one agent at a time) + 9-check E2E verification + ward-precise routing human-verify checkpoint

### Phase 163: Henderson Deep-Seed

**Goal**: A Henderson resident (NV's 2nd-largest city) looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Depends on**: Phase 158 (city geofences)
**Requirements**: CLARK-03
**Success Criteria** (what must be TRUE):

  1. Any Henderson address returns the correct Mayor + council member; ward/at-large structure and seat count verified.
  2. All seated officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blanks, no default values.
  4. Henderson surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: 3 plans
**Wave 1**

- [x] 163-01-PLAN.md — Structural seed: Wave-0 BLOCKING probes + roster checkpoint → X0016 ward-boundary loader (D-01b fallback) → structural migration 1084 (standalone govt + Henderson City Council + Mayor at-large + 4 ward offices) → coverage.js NV-block edit

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 163-02-PLAN.md — Headshots: per-member fallback-chain sourcing (cityofhenderson.com is WAF-403) → 600×750 crop+resize pipeline → audit-only migration 1085 → Storage mirror, gaps documented

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 163-03-PLAN.md — Stances + E2E: all-topics stance research one-at-a-time per official → audit-only per-official migrations 1086-1090 → 9-check E2E verification + human-verify checkpoint

### Phase 164: North Las Vegas Deep-Seed

**Goal**: A North Las Vegas resident looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Depends on**: Phase 158 (city geofences)
**Requirements**: CLARK-04
**Success Criteria** (what must be TRUE):

  1. Any North Las Vegas address returns the correct Mayor + council member; ward/at-large structure and seat count verified.
  2. All seated officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blanks, no default values.
  4. North Las Vegas surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: 3 plans
**Wave 1**

- [x] 164-01-PLAN.md — Structural seed: Wave-0 BLOCKING probes + roster checkpoint → X0017 ward-boundary loader (Clark County GISMO PLACE=80, D-01b fallback) → structural migration 1093 (standalone govt + North Las Vegas City Council + Mayor at-large + 4 Arabic-numeral ward offices) → coverage.js NV-block edit

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 164-02-PLAN.md — Headshots: per-member fallback-chain sourcing (cityofnorthlasvegas.com is WAF-403; Goynes-Brown via Wikimedia public-domain) → 600×750 crop+resize pipeline → audit-only migration 1094 → Storage mirror, gaps documented

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 164-03-PLAN.md — Stances + E2E: all-topics stance research one-at-a-time per official → audit-only per-official migrations 1095-1099 → 9-check E2E verification + human-verify checkpoint

### Phase 165: Boulder City Deep-Seed

**Goal**: A Boulder City resident looks up who represents them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Depends on**: Phase 158 (city geofences)
**Requirements**: CLARK-05
**Success Criteria** (what must be TRUE):

  1. Any Boulder City address returns the correct Mayor + council member; form of government and seat count verified.
  2. All seated officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blanks, no default values.
  4. Boulder City surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: 3 plans
**Wave 1**

- [x] 165-01-PLAN.md — Wave-0 probes + roster checkpoint, structural migration 1100 (standalone gov + chamber + 1 LOCAL_EXEC Mayor + 1 shared LOCAL at-large council district on geo_id 3206500, no wards), coverage.js surfacing

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 165-02-PLAN.md — 600x750 headshots for all 5 (flybouldercity.com, no WAF) + audit-only migration 1101 + correct-person spot-check

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 165-03-PLAN.md — evidence-only stances one-at-a-time for all 5 (CGO/data-center/solar/camping-ban emphasis) + per-official audit-only migrations 1102-1106 + 8-check E2E verification

### Phase 166: CCSD Board of Trustees Deep-Seed

**Goal**: A Clark County resident looks up who represents them on the Clark County School District Board of Trustees (5th-largest US district) and gets the correct trustee, with evidence-only stances.
**Depends on**: Phase 158 (county geofences; board-district G5420 geofences if applicable)
**Requirements**: CCSD-01
**Success Criteria** (what must be TRUE):

  1. A Clark County address returns the correct CCSD trustee (board-district geofences loaded via the G5420 UNSD pattern if board is district-elected; at-large handled otherwise).
  2. The elected board roster is seeded with correct office titles and all trustees render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on trustee profiles — 100% cited, honest blanks, no default values. **[DEFERRED 2026-06-29 — operator decision: the current civic compass is dominated by state/federal topics a school-board trustee has no cited record on; defer until education-native compass topics exist. See 166-03-SUMMARY.md.]**
  4. CCSD surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: 3 plans (01 ✓ structural+geofence+surfacing, 02 ✓ headshots 7/11, 03 DEFERRED — stances)
**Wave 1**

- [x] 166-01-PLAN.md — Wave-0 probes + loader dry-run + 11-member roster checkpoint, NEW G5420 TIGER UNSD loader (load-ccsd-school-boundary.ts, GEOID 3200060) run before structural migration 1107 (standalone gov + Board of School Trustees chamber + 1 shared SCHOOL district on geo_id 3200060 + 11 offices: 7 elected A–G + 4 appointed by jurisdiction), smoke-test extension + coverage.js surfacing

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 166-02-PLAN.md — 600x750 headshots for the 11 trustees (ccsd.net + BoardDocs WAF-403 → per-trustee fallback chain) + audit-only migration 1108 + correct-person spot-check; appointed-trustee gaps documented

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 166-03-PLAN.md — evidence-only stances one-at-a-time for all 11 (education cluster: CCSDPD/SRO, vouchers, curriculum/DEI/trans-athletes, funding/growth) + per-trustee audit-only migrations 1109-1119 + full 10-check E2E verification (appointed four nonvoting → statement-only, many honest blanks)
**UI hint**: yes

### Phase 167: NV 2026 Elections & Discovery

**Goal**: Any NV user visiting `/elections` sees their 2026 ballot, and the discovery pipeline automatically finds NV candidates from official sources.
**Depends on**: Phases 158–160 (geofences + legislators provide race-to-district linkage)
**Requirements**: NV-ELEC-01
**Success Criteria** (what must be TRUE):

  1. NV 2026 election + race rows seeded — Governor, all 42 Assembly seats, the ~10 Senate seats up, and 4 US House races; NV's two US Senators correctly absent (not up in 2026).
  2. A NV address on `/elections` returns the correct 2026 races for that jurisdiction.
  3. `discovery_jurisdictions` rows for NV are present with `cron_active=true`; a test discovery run completes against an official NV source.

**Plans**: TBD
**UI hint**: yes

### Phase 168: Nevada Playbook Retrospective & Close

**Goal**: Nevada coverage is discoverable in the app and the onboarding playbook captures everything learned, so the next Nevada wave (or any new state) is faster.
**Depends on**: Phases 158–167
**Requirements**: NV-RETRO-01
**Success Criteria** (what must be TRUE):

  1. All covered NV jurisdictions (state legislature ride-along + Clark County metro cities + CCSD) are surfaced in `src/lib/coverage.js` / Landing wiring, consistent with every other covered state.
  2. LOCATION-ONBOARDING.md updated with Nevada GOTCHAs + a Nevada Quick Reference block + new Cities Onboarded rows.
  3. A v18.0 milestone audit is written (DB-verified counts: geofences, officials, headshots, stance rows) and the milestone is closed.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 158 → 159 → 160 → 161 → 162 → 163 → 164 → 165 → 166 → 167 → 168

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 158. Nevada TIGER Geofences | 2/2 | Complete    | 2026-06-23 |
| 159. Nevada State & Federal Government | 3/3 | Complete   | 2026-06-23 |
| 160. Nevada Legislature (seed + headshots) | 3/3 | Complete | 2026-06-23 |
| 161. Clark County Commission Deep-Seed | 3/3 | Complete | 2026-06-24 |
| 162. City of Las Vegas Deep-Seed | 3/3 | Complete   | 2026-06-28 |
| 163. Henderson Deep-Seed | 3/3 | Complete   | 2026-06-28 |
| 164. North Las Vegas Deep-Seed | 3/3 | Complete | 2026-06-29 |
| 165. Boulder City Deep-Seed | 3/3 | Complete   | 2026-06-29 |
| 166. CCSD Board of Trustees Deep-Seed | 2/3 | In Progress|  |
| 167. NV 2026 Elections & Discovery | 0/TBD | Not started | - |
| 168. Nevada Playbook Retrospective & Close | 0/TBD | Not started | - |

## Coverage

All 13 v18.0 requirements mapped to exactly one phase. No orphans, no duplicates.

| Requirement | Phase |
|-------------|-------|
| NV-GEO-01 | 158 |
| NV-STATE-01 | 159 |
| NV-STATE-02 | 159 |
| NV-LEG-01 | 160 |
| NV-LEG-02 | 160 |
| CLARK-01 | 161 |
| CLARK-02 | 162 |
| CLARK-03 | 163 |
| CLARK-04 | 164 |
| CLARK-05 | 165 |
| CCSD-01 | 166 |
| NV-ELEC-01 | 167 |
| NV-RETRO-01 | 168 |
