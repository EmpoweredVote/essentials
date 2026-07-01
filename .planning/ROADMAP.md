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
- [x] **Phase 166: CCSD Board of Trustees Deep-Seed** - 5th-largest US school district, elected board
 (completed 2026-06-29)

- [x] **Phase 167: NV 2026 Elections & Discovery** - Governor + 42 Assembly + ~10 Senate + 4 US House races + discovery armed (completed 2026-06-29)
- [x] **Phase 168: NV 2026 Candidate Population — Statewide & US House** - Curated general-election nominees (primary winners) for 6 statewide execs + 4 US House, bound to race rows (completed 2026-06-30)
- [x] **Phase 173: Nevada Playbook Retrospective & Close** - Surface NV jurisdictions, document GOTCHAs, audit, close milestone (renumbered from 169 — dirs 169–172 occupied by parked v19.0 frontend detour) (completed 2026-06-30)

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

- [x] 166-03-PLAN.md — evidence-only stances one-at-a-time for all 11 (education cluster: CCSDPD/SRO, vouchers, curriculum/DEI/trans-athletes, funding/growth) + per-trustee audit-only migrations 1109-1119 + full 10-check E2E verification (appointed four nonvoting → statement-only, many honest blanks)

**UI hint**: yes

### Phase 167: NV 2026 Elections & Discovery

**Goal**: Any NV user visiting `/elections` sees their 2026 ballot, and the discovery pipeline automatically finds NV candidates from official sources.
**Depends on**: Phases 158–160 (geofences + legislators provide race-to-district linkage)
**Requirements**: NV-ELEC-01
**Success Criteria** (what must be TRUE):

  1. NV 2026 election + race rows seeded — Governor, all 42 Assembly seats, the ~10 Senate seats up, and 4 US House races; NV's two US Senators correctly absent (not up in 2026).
  2. A NV address on `/elections` returns the correct 2026 races for that jurisdiction.
  3. `discovery_jurisdictions` rows for NV are present with `cron_active=true`; a test discovery run completes against an official NV source.

**Plans**: 3 plans
**Wave 1**

- [x] 167-01-PLAN.md — Seed the NV 2026 Statewide General election row (migration 1111) + smoke harness

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 167-02-PLAN.md — Seed 63 NV 2026 race rows (6 exec + 11 Senate + 42 Assembly + 4 US House; migration 1112) with a Wave-0 geo_id/office pre-check

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 167-03-PLAN.md — Seed the NV discovery_jurisdictions row (migration 1113) + execute one real discovery test run

**UI hint**: yes

### Phase 168: NV 2026 Candidate Population — Statewide & US House

**Goal**: NV users visiting `/elections` see the actual Nov 3, 2026 general-election candidates (nominees) for the 6 statewide constitutional offices and the 4 US House districts — so the Governor race (and the rest) is no longer blank. Candidates are the decided June 9, 2026 primary winners, curated/verified, and bound to the race rows seeded in Phase 167.
**Depends on**: Phase 167 (race rows must exist)
**Requirements**: NV-CAND-01
**Success Criteria** (what must be TRUE):

  1. `essentials.race_candidates` rows exist for all 6 statewide-exec races + all 4 US House races, each bound to the correct `race_id` (Phase 167 races) and to a politician record.
  2. Only general-election nominees (primary winners) are included — no losing primary entrants, no duplicates; the field is verified against the official NV / Ballotpedia general-election result.
  3. A NV address on `/elections` shows the candidates under each of those 10 races (Governor of Nevada no longer shows "No candidates have filed" when nominees exist).
  4. Each candidate is evidence-cited from an official or Ballotpedia source (`confidence='official'`).

**Plans**: 2 plans

**Wave 1**

- [x] 168-01-PLAN.md — Wave-0 live-resolve 10 race_ids + incumbent/cross-office politician_ids, then author+apply migration 1114 seeding race_candidates for all 10 NV 2026 races (+ 8-assertion smoke harness)

**Wave 2** *(blocked on Plan 01)*

- [x] 168-02-PLAN.md — Fetch challenger headshots one-at-a-time via find-headshots (honest-skip where none) + human-verify /elections cards

**Scope notes**: Legislative races (11 State Senate + 42 State Assembly) are explicitly OUT of scope here and deferred to a separate follow-up. The 32 rows in `candidate_staging` from discovery run `1e5a2041` are primary-heavy leads (0 matched a `race_id`, ~3 dupes, Governor missing) — treat as reference leads only, NOT an import source. Migration counter is at 1114.
**UI hint**: yes

### Phase 173: Nevada Playbook Retrospective & Close

> Renumbered from Phase 169 → 173 on 2026-06-30. Phase numbers 169–172 are occupied by the parked v19.0 frontend detour (dark-mode, section banners, banner pipeline, elections parity) whose completed directories live under `.planning/phases/169…172-*`. Renumbering avoids a directory collision; numeric execution order is otherwise unaffected.

**Goal**: Nevada coverage is discoverable in the app and the onboarding playbook captures everything learned, so the next Nevada wave (or any new state) is faster.
**Depends on**: Phases 158–168
**Requirements**: NV-RETRO-01
**Success Criteria** (what must be TRUE):

  1. All covered NV jurisdictions (state legislature ride-along + Clark County metro cities + CCSD) are surfaced in `src/lib/coverage.js` / Landing wiring, consistent with every other covered state.
  2. LOCATION-ONBOARDING.md updated with Nevada GOTCHAs + a Nevada Quick Reference block + new Cities Onboarded rows.
  3. A v18.0 milestone audit is written (DB-verified counts: geofences, officials, headshots, stance rows) and the milestone is closed.

**Plans**: 3 plans

- [x] 173-01-PLAN.md — Write DB-verified v18.0-MILESTONE-AUDIT.md (per-jurisdiction counts + verdicts + 4 known-issues)
- [x] 173-02-PLAN.md — Reconcile NV hasContext chips in coverage.js (CCSD plain) + LOCATION-ONBOARDING.md rows + GOTCHAs + Nevada Quick Reference
- [x] 173-03-PLAN.md — MILESTONES.md v18.0 Shipped entry + STATE.md/PROJECT.md/ROADMAP.md status flip

**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 158 → 159 → 160 → 161 → 162 → 163 → 164 → 165 → 166 → 167 → 168 → 173 (169–172 belong to the parked v19.0 detour)

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
| 166. CCSD Board of Trustees Deep-Seed | 3/3 | Complete   | 2026-06-29 |
| 167. NV 2026 Elections & Discovery | 3/3 | Complete   | 2026-06-29 |
| 168. NV 2026 Candidate Population — Statewide & US House | 2/2 | Complete    | 2026-06-30 |
| 173. Nevada Playbook Retrospective & Close | 3/3 | Complete    | 2026-06-30 |

## Coverage

All 14 v18.0 requirements mapped to exactly one phase. No orphans, no duplicates.

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
| NV-CAND-01 | 168 |
| NV-RETRO-01 | 173 |

---

# Roadmap: v20.0 Beaverton & Washington County, OR

## Overview

Deep-seed the **Washington County / west-metro Portland** local layer onto Oregon's already-complete
state foundation (v8.0–v10.0). This is a **brownfield local-layer deep-seed** — no state or federal
work required, only the west-metro school-district G5420 geofences are added. The journey follows the
proven Clark County metro cadence from v18.0: one government per deep-seed phase (gov + roster +
headshots + evidence-only stances), school boards batched into two phases (roster + headshots, 0
stances by design), followed by elections + discovery, and a playbook retrospective + milestone close.
Phases continue from 173 (v18.0); this milestone starts at **Phase 174**.

## Milestone-wide conventions (carry into every phase)

- **Brownfield local-layer** — OR state/federal/legislative foundation is complete (v8.0–v10.0).
  No geofence, state, or federal work. City/county geofences already exist statewide.
  Only net-new geofence work is the west-metro school-district G5420 load (Phase 174).

- **districts.state casing** — OR has an inconsistency: `'or'` (lowercase, TIGER-loaded, used for
  city/county/SLDU/SLDL district joins) vs `'OR'` (uppercase, manually inserted, used for
  STATE_EXEC/NATIONAL tiers). **Always verify casing with a spot-check before WHERE filters.**
  Wrong case = silent exclusion (no error, just missing data).

- **Per-government build order:** `governments` row (via `WHERE NOT EXISTS`) + chamber(s) → roster
  (offices, form of government verified against official city site, district vs at-large structure +
  seat count) → 600×750 headshots (4:5 Lanczos q90, `press_use`, `type='default'`) → evidence-only
  compass stances → spot-check render.

- **Stances:** evidence-only, **one research agent at a time** (rate-limit rule), all live compass
  topics, 100% citation, **no default values**, honest blank spokes. School boards excluded from
  compass by design (CCSD precedent). Stance migrations apply via raw SQL, do **not** register in
  `supabase_migrations.schema_migrations` — **on-disk counter is authoritative**.
  Structural migrations register normally.

- **School boards:** roster + headshots only. 0 compass stances by design. Board-district structure
  verified per district (some districts have sub-zones, some are at-large). G5420 geofences must
  exist before seeding (Phase 174 prerequisite).

- **Surfacing target** is `src/lib/coverage.js` — Oregon block in COVERAGE_STATES + Washington
  County in COVERAGE_COUNTIES. City carries `hasContext: true` chip once ≥1 stance row exists.
  School boards carry plain chip (0 stances by design).

- **Schema:** `essentials.governments` (INSERT via `WHERE NOT EXISTS`), `essentials.chambers`
  (`official_count` lives here; `slug` is generated — never INSERT it), `essentials.districts`
  (no `name_formal` column — use `label`; `government_id` is NULL across OR rows, join via geo_id),
  `inform.politician_answers` (stances).

- **gsd-executor has no Supabase MCP** — DB-verify steps run inline within the phase.

- **Next migration at milestone start: 1115** (on-disk counter authoritative; v18.0 closed at 1115).

## Phases

**Phase Numbering:**

- Integer phases (174, 175, …): Planned milestone work
- Decimal phases (e.g. 175.1): Urgent insertions (marked INSERTED)

- [x] **Phase 174: West-Metro School-District Geofences** - Load G5420 geofence boundaries for 5 west-metro school districts (TIGER UNSD pattern); prerequisite for school-board phases (completed 2026-06-30)
- [ ] **Phase 175: Washington County Commission Deep-Seed** - Chair + commissioners, standalone county government (geo_id 41067), with stances
- [ ] **Phase 176: City of Beaverton Deep-Seed** - Mayor + Council (flagship; form of government verified at plan time — ward vs at-large)
- [ ] **Phase 177: City of Hillsboro Deep-Seed** - Mayor + Council (county seat / largest WashCo city)
- [ ] **Phase 178: City of Tigard Deep-Seed** - Mayor + Council
- [ ] **Phase 179: City of Tualatin Deep-Seed** - Mayor + Council
- [ ] **Phase 180: City of Forest Grove Deep-Seed** - Mayor + Council
- [ ] **Phase 181: City of Sherwood Deep-Seed** - Mayor + Council
- [ ] **Phase 182: City of Cornelius Deep-Seed** - Mayor + Council
- [ ] **Phase 183: School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J** - Roster + headshots for the two largest west-metro school boards; 0 stances by design
- [ ] **Phase 184: School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J** - Roster + headshots for three remaining school boards; 0 stances by design
- [ ] **Phase 185: WashCo 2026 Elections & Discovery** - 2026 local elections + discovery pipeline armed for all new west-metro jurisdictions
- [ ] **Phase 186: West-Metro Playbook Retrospective & Close** - Surface jurisdictions, Washington County GOTCHAs, DB-verified milestone audit, close

## Phase Details

### Phase 174: West-Metro School-District Geofences

**Goal**: Any west-metro address routes to its correct school district — Beaverton SD 48J, Hillsboro
SD 1J, Tigard-Tualatin SD 23J, Forest Grove SD 15, and Sherwood SD 88J — so that school-board phases
(183–184) can link officials to the correct G5420 boundaries.
**Depends on**: Nothing (first phase of milestone; v18.0 closed at Phase 173)
**Requirements**: WM-GEO-01
**Success Criteria** (what must be TRUE):

  1. G5420 geofence boundaries exist for all 5 target west-metro school districts; a Beaverton address returns Beaverton SD 48J and a Hillsboro address returns Hillsboro SD 1J.
  2. The TIGER UNSD loader ran against the correct OR UNSD zip file; loader GEOID filter is confirmed against the 5 target district GEOIDs (not the 6 Multnomah districts already loaded in v10.0).
  3. Section-split scan across the 5 new district geo_ids returns 0 rows (no mis-parented boundaries).
  4. No other geofence tiers are modified (city/county/CD/SLDU/SLDL tiers are complete statewide — untouched).

**Plans**: 1 plan

- [x] 174-01-PLAN.md — Clone TIGER UNSD loader (5 GEOIDs, source tiger_unsd_or_2024_westmetro), run live, verify 5-district routing + section-split gates

### Phase 175: Washington County Commission Deep-Seed

**Goal**: A Washington County resident (unincorporated area) looks up who represents them and gets the
correct County Commissioner with evidence-only stances on their profile. Washington County is a
standalone county government (not nested under State of Oregon), like Clark County in v18.0.
**Depends on**: Existing OR TIGER county geofences (geo_id 41067, already present from v8.0)
**Requirements**: WASH-01
**Success Criteria** (what must be TRUE):

  1. An unincorporated Washington County address returns the correct County Commissioner (no empty LOCAL section); the standalone county government row exists (geo_id 41067, not nested under State of Oregon).
  2. The full Board of Commissioners roster (Chair + commissioners) is seeded with correct seat count and office structure; all seated officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on commissioner profiles — 100% cited, honest blank spokes, zero default values.
  4. Washington County surfaces with the purple `hasContext` chip in `src/lib/coverage.js` (COVERAGE_COUNTIES block).

**Plans**: 3 plans
Plans:
**Wave 1**

- [x] 175-01-PLAN.md — Standalone county government + Board of County Commissioners chamber + 5 offices (Chair on COUNTY 41067, D1-D4 on custom X0018 per-district geofences); structural migration 1120 + GIS loader

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 175-02-PLAN.md — Commissioner headshots (4:5 -> 600x750, washingtoncountyor.gov); audit-only migration 1121
- [ ] 175-03-PLAN.md — Evidence-only compass stances (one agent at a time, migrations 1122-1126) + coverage.js hasContext surfacing

### Phase 176: City of Beaverton Deep-Seed

**Goal**: A Beaverton resident (the flagship west-metro city) looks up who represents them and gets
the correct Mayor + council member, with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4105350, already present from v8.0); custom
ward geofences only if Beaverton uses ward-based elections (verified at plan time)
**Requirements**: WASH-02
**Success Criteria** (what must be TRUE):

  1. Any Beaverton address returns the correct Mayor + council member; form of government is verified against the official Beaverton city site at plan time (at-large vs ward-elected council; if ward-based, custom X00xx ward geofences are loaded before seeding).
  2. The full seated roster is seeded with correct office structure and seat count; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Beaverton surfaces with the purple `hasContext` chip in `src/lib/coverage.js` (Oregon block).

**Plans**: TBD
**UI hint**: yes

### Phase 177: City of Hillsboro Deep-Seed

**Goal**: A Hillsboro resident (Washington County seat / largest WashCo city) looks up who represents
them and gets the correct Mayor + council member, with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4133850, already present from v8.0)
**Requirements**: WASH-03
**Success Criteria** (what must be TRUE):

  1. Any Hillsboro address returns the correct Mayor + council member; form of government (at-large vs ward) verified and modeled correctly.
  2. The full seated roster is seeded with correct office structure; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Hillsboro surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: TBD

### Phase 178: City of Tigard Deep-Seed

**Goal**: A Tigard resident looks up who represents them and gets the correct Mayor + council member,
with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4173650, already present from v8.0)
**Requirements**: WASH-04
**Success Criteria** (what must be TRUE):

  1. Any Tigard address returns the correct Mayor + council member; form of government verified and modeled correctly.
  2. The full seated roster is seeded; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Tigard surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: TBD

### Phase 179: City of Tualatin Deep-Seed

**Goal**: A Tualatin resident looks up who represents them and gets the correct Mayor + council
member, with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4175200, already present from v8.0)
**Requirements**: WASH-05
**Success Criteria** (what must be TRUE):

  1. Any Tualatin address returns the correct Mayor + council member; form of government verified and modeled correctly.
  2. The full seated roster is seeded; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Tualatin surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: TBD

### Phase 180: City of Forest Grove Deep-Seed

**Goal**: A Forest Grove resident looks up who represents them and gets the correct Mayor + council
member, with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4126200, already present from v8.0)
**Requirements**: WASH-06
**Success Criteria** (what must be TRUE):

  1. Any Forest Grove address returns the correct Mayor + council member; form of government verified and modeled correctly.
  2. The full seated roster is seeded; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Forest Grove surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: TBD

### Phase 181: City of Sherwood Deep-Seed

**Goal**: A Sherwood resident looks up who represents them and gets the correct Mayor + council
member, with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4167450, already present from v8.0)
**Requirements**: WASH-07
**Success Criteria** (what must be TRUE):

  1. Any Sherwood address returns the correct Mayor + council member; form of government verified and modeled correctly.
  2. The full seated roster is seeded; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Sherwood surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: TBD

### Phase 182: City of Cornelius Deep-Seed

**Goal**: A Cornelius resident looks up who represents them and gets the correct Mayor + council
member, with evidence-only stances on their profiles.
**Depends on**: Existing OR TIGER city geofences (geo_id 4115350, already present from v8.0)
**Requirements**: WASH-08
**Success Criteria** (what must be TRUE):

  1. Any Cornelius address returns the correct Mayor + council member; form of government verified and modeled correctly.
  2. The full seated roster is seeded; all officials render with 600×750 headshots (genuine gaps documented).
  3. Evidence-only compass stances render on profiles — 100% cited, honest blank spokes, no default values.
  4. Cornelius surfaces with the purple `hasContext` chip in `src/lib/coverage.js`.

**Plans**: TBD

### Phase 183: School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J

**Goal**: A student or parent in the Beaverton or Hillsboro school district looks up their school
board and gets the correct board member, each with a headshot. (0 compass stances by design —
civic compass is not applied to school boards.)
**Depends on**: Phase 174 (G5420 geofences must exist before seeding; school-board officials link to
SCHOOL districts that reference these geofences)
**Requirements**: WSCH-01, WSCH-02
**Success Criteria** (what must be TRUE):

  1. Beaverton SD 48J board roster is seeded with verified board-district structure and seat count (Beaverton SD is one of Oregon's largest — board structure verified against official district site); all board members render with 600×750 headshots (genuine gaps documented).
  2. Hillsboro SD 1J board roster is seeded with verified structure; all board members render with 600×750 headshots (genuine gaps documented).
  3. A Beaverton address returns the correct Beaverton SD board member; a Hillsboro address returns the correct Hillsboro SD board member.
  4. Both school boards are listed in `src/lib/coverage.js` (plain chip — 0 stances by design is honest; no `hasContext: true`).

**Plans**: TBD

### Phase 184: School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J

**Goal**: A student or parent in the Tigard-Tualatin, Forest Grove, or Sherwood school district looks
up their school board and gets the correct board member, each with a headshot. (0 compass stances by
design.)
**Depends on**: Phase 174 (G5420 geofences)
**Requirements**: WSCH-03, WSCH-04, WSCH-05
**Success Criteria** (what must be TRUE):

  1. Tigard-Tualatin SD 23J board roster seeded with verified structure; board members render with 600×750 headshots (genuine gaps documented); address routing returns the correct member.
  2. Forest Grove SD 15 board roster seeded; headshots at 600×750 (genuine gaps documented); address routing verified.
  3. Sherwood SD 88J board roster seeded; headshots at 600×750 (genuine gaps documented); address routing verified.
  4. All three school boards are listed in `src/lib/coverage.js` (plain chip — 0 stances by design).

**Plans**: TBD

### Phase 185: WashCo 2026 Elections & Discovery

**Goal**: Any west-metro user visiting `/elections` sees their 2026 local ballot, and the discovery
pipeline automatically finds candidates from official Oregon / Washington County sources.
**Depends on**: Phases 175–182 (government rows + offices must exist for race-to-office linkage);
Phase 174 (school-district rows needed for school-board races if applicable)
**Requirements**: WM-ELEC-01
**Success Criteria** (what must be TRUE):

  1. 2026 election + race rows seeded for Washington County Commission, all 7 west-metro cities (mayoral / council seats up in 2026), and 5 school boards as applicable; races link to correct office_id rows.
  2. A west-metro address on `/elections` returns the correct 2026 races for that jurisdiction (county commissioner + city council + school board races, as applicable).
  3. `discovery_jurisdictions` rows exist for all new west-metro jurisdictions with `cron_active=true`; a test discovery run against the Oregon SOS / Washington County elections authority completes without error.

**Plans**: TBD
**UI hint**: yes

### Phase 186: West-Metro Playbook Retrospective & Close

**Goal**: All west-metro jurisdictions are discoverable in the app, the onboarding playbook captures
everything learned about Washington County, and the v20.0 milestone is formally closed.
**Depends on**: Phases 174–185
**Requirements**: WM-RETRO-01
**Success Criteria** (what must be TRUE):

  1. All covered west-metro jurisdictions are surfaced in `src/lib/coverage.js` (Oregon block in COVERAGE_STATES + Washington County in COVERAGE_COUNTIES) with honest purple/plain chips reconciled against real DB stance counts (no assumed hasContext — DB-verified at close).
  2. `LOCATION-ONBOARDING.md` updated with Washington County GOTCHAs (OR districts.state casing, school-district G5420 loader, WashCo headshot sources, county-not-under-state pattern) + new Cities Onboarded rows for all 7 cities + Washington County + 5 school boards.
  3. A DB-verified `v20.0-MILESTONE-AUDIT.md` is written (per-jurisdiction roster / headshot / stance counts + verdicts) and the milestone is closed in MILESTONES.md + STATE.md + PROJECT.md.

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 174 → 175 → 176 → 177 → 178 → 179 → 180 → 181 → 182 → 183 → 184 → 185 → 186

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 174. West-Metro School-District Geofences | 1/1 | Complete   | 2026-06-30 |
| 175. Washington County Commission Deep-Seed | 2/3 | In Progress|  |
| 176. City of Beaverton Deep-Seed | 0/TBD | Not started | - |
| 177. City of Hillsboro Deep-Seed | 0/TBD | Not started | - |
| 178. City of Tigard Deep-Seed | 0/TBD | Not started | - |
| 179. City of Tualatin Deep-Seed | 0/TBD | Not started | - |
| 180. City of Forest Grove Deep-Seed | 0/TBD | Not started | - |
| 181. City of Sherwood Deep-Seed | 0/TBD | Not started | - |
| 182. City of Cornelius Deep-Seed | 0/TBD | Not started | - |
| 183. School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J | 0/TBD | Not started | - |
| 184. School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J | 0/TBD | Not started | - |
| 185. WashCo 2026 Elections & Discovery | 0/TBD | Not started | - |
| 186. West-Metro Playbook Retrospective & Close | 0/TBD | Not started | - |

## Coverage

All 16 v20.0 requirements mapped to exactly one phase. No orphans, no duplicates.

| Requirement | Phase |
|-------------|-------|
| WM-GEO-01 | 174 |
| WASH-01 | 175 |
| WASH-02 | 176 |
| WASH-03 | 177 |
| WASH-04 | 178 |
| WASH-05 | 179 |
| WASH-06 | 180 |
| WASH-07 | 181 |
| WASH-08 | 182 |
| WSCH-01 | 183 |
| WSCH-02 | 183 |
| WSCH-03 | 184 |
| WSCH-04 | 184 |
| WSCH-05 | 184 |
| WM-ELEC-01 | 185 |
| WM-RETRO-01 | 186 |
