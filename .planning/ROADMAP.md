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
- ✅ **v13.0 Massachusetts Expanded** - Phases 107-116 (shipped 2026-06-13)
- ✅ **v14.0 MA Tier 3 City Coverage** - Phases 117-125 (shipped 2026-06-15)
- ✅ **v15.0 LA City Stances** - Phases 126-138 (shipped 2026-06-16)
- ✅ **v16.0 Utah Coverage** - Phases 139-141 (shipped 2026-06-18)
- 🔨 **v17.0 LA County City Coverage — Wave 2** - Phases 142-157 (in progress)

---

# v17.0 LA County City Coverage — Wave 2

**Goal:** Deep-seed the 15 largest LA County cities not yet covered — government structure,
elected rosters, headshots (600×750), and evidence-only compass stances for each.
**Phases:** 142–157 (16 phases) — one per city + close-out
**Requirements:** 16
**Next migration:** 878

## Key Facts (carry into every phase)

- **⚠️ NOT all greenfield — DB-pre-check every city first.** The original assumption ("no
  `governments` row, no officials") is FALSE for at least Long Beach (142) and Carson — both were
  seeded in v7.0 + LA wave-1/wave-3 gap-fill migrations. Before planning/seeding any city, query
  `essentials.governments` / `chambers` / `offices` / `politician_images` / `inform.politician_answers`
  for that geo_id. A truly greenfield city → create government + chamber + roster + headshots + stances.
  A partially-seeded city (e.g. Long Beach) → **reconcile + complete + stances** (fix data hygiene,
  add missing seats/officers, fill the stance gap). Treat the roadmap goal as "bring each city to
  full Tier 1 depth," not "build from scratch."

- **Geofences already exist** (v7.0, G4110) — confirmed for all 15. Do NOT reload TIGER.
- **Verify per city before seeding:** form of government (mayor-council vs council-manager),
  directly-elected vs rotational mayor, district vs at-large council, seat count. Several LA
  County cities moved to by-district elections post-CVRA — confirm current district map.

- **Stances:** evidence-only, one research agent at a time (rate-limit rule), all live compass
  topics, per-individual migration files applied immediately, no default values, honest blanks.

- **Conventions:** headshots 600×750 (4:5 Lanczos, press_use); `politician_images.type='default'`;
  governments INSERT uses WHERE NOT EXISTS (no geo_id unique constraint); `slug` is generated on
  chambers (never INSERT it); stance migrations apply via raw SQL and don't register in
  schema_migrations (on-disk counter authoritative). See LOCATION-ONBOARDING.md + templates.

- **Antipartisan:** party may be stored but never displayed on profiles.

## Phase Summary

| # | Phase | Req | geo_id | Goal |
|---|-------|-----|--------|------|
| 142 | Long Beach deep-seed | 4/4 | Complete   | 2026-06-19 |
| 143 | Santa Clarita deep-seed | 2/4 | In Progress|  |
| 144 | Glendale deep-seed | GLEN-01 | 0630000 | Government + roster + headshots + stances |
| 145 | Lancaster deep-seed | LANC-01 | 0640130 | Government + roster + headshots + stances |
| 146 | Palmdale deep-seed | PLMD-01 | 0655156 | Government + roster + headshots + stances |
| 147 | Pomona deep-seed | POMO-01 | 0658072 | Government + roster + headshots + stances |
| 148 | Torrance deep-seed | TORR-01 | 0680000 | Government + roster + headshots + stances |
| 149 | Pasadena deep-seed | PASA-01 | 0656000 | Government + roster + headshots + stances |
| 150 | Downey deep-seed | DWNY-01 | 0619766 | Government + roster + headshots + stances |
| 151 | El Monte deep-seed | ELMN-01 | 0622230 | Government + roster + headshots + stances |
| 152 | West Covina deep-seed | WCOV-01 | 0684200 | Government + roster + headshots + stances |
| 153 | Inglewood deep-seed | INGL-01 | 0636546 | Government + roster + headshots + stances |
| 154 | Burbank deep-seed | BURB-01 | 0608954 | Government + roster + headshots + stances |
| 155 | Norwalk deep-seed | NRWK-01 | 0652526 | Government + roster + headshots + stances |
| 156 | Bellflower deep-seed | BLFL-01 | 0604982 | Government + roster + headshots + stances |
| 157 | Wave 2 close-out | LAC2-RETRO-01 | — | Landing.jsx + playbook retrospective + milestone audit |

## Phase Details

Each city phase (142–156) shares the same shape and success criteria:

**Goal:** Take the city from geofence-only to full Tier 1 depth.

**Success criteria (per city):**

1. `essentials.governments` row + chamber(s) exist; current mayor + full council seated as offices linked to the city geo_id
2. Council structure matches the city's real form of government (district vs at-large, seat count, mayor type) — verified against the official city site
3. Headshots at 600×750 uploaded for all officials with an available official portrait; genuine gaps documented (no fabricated photos)
4. Evidence-only compass stances applied for officials with a findable public record; 100% citation; honest blank spokes elsewhere
5. City browse view renders the roster (with photos) and stances; no duplicate/stale office rows

**Build order within a phase:** government+chamber → roster (offices) → headshots → stances → spot-check render.

> Per-city detail headings are added below as each phase is planned (the GSD tooling
> requires a `### Phase N:` section to resolve the phase). The shared shape above applies
> to all; per-phase headings note city-specific deviations (e.g. existing-seed reconciliation).

### Phase 142: Long Beach deep-seed

**Requirements:** LBCH-01

**Goal:** Bring Long Beach (geo_id `0643000`) to full Tier 1 depth. **NOT greenfield** —
DB pre-check found it already seeded (gov + 2 chambers + Mayor Rex Richardson + 8 of 9 council +
9/9 headshots, 0 stances) via v7.0 + migration 294. This phase is **reconcile + complete +
stances**: fix data hygiene (backfill gov `geo_id`, resolve the duplicate "Long Beach City
Council" chamber, dedupe images, back-fill Rex Richardson `office_id`), seat the missing 9th
council district, add the three directly-elected citywide officers (City Attorney, City
Prosecutor, City Auditor), then apply evidence-only compass stances for all officials.
New officials use the reserved external_id range `-700050…-700099` (per migration 294).

**Success criteria:** Per the shared per-city criteria above, plus: existing duplicate/NULL-geo_id
data reconciled; the 3 elected citywide officers seated; 9/9 (or documented) council districts;
stances 0 → full coverage for the roster. See `phases/142-long-beach-deep-seed/142-CONTEXT.md`.
**Plans:** 4/4 plans complete
**Wave 1**

- [x] 142-01-PLAN.md — Reconcile / data hygiene (geo_id backfill, chamber rename, image dedupe, Mayor office_id, district relabel) — migration 878

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 142-02-PLAN.md — Complete roster: seat D8 Thrash-Ntuk + 3 citywide officers (City Attorney/Prosecutor/Auditor) — migration 879

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 142-03-PLAN.md — Headshots for the 4 new officials (600×750) + full-roster image audit — migration 880 (audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [x] 142-04-PLAN.md — Evidence-only compass stances for all 13 officials (judicial topics for legal officers) — migrations 881–893 (no ledger)

### Phase 143: Santa Clarita deep-seed

**Requirements:** SCLR-01

**Goal:** Bring Santa Clarita (geo_id `0669088`) to full Tier 1 depth. **NOT greenfield** —
DB pre-check (2026-06-19) found it already partially seeded: a `'City of Santa Clarita,
California, US'` government row (geo_id NULL) and **TWO duplicate "City Council" chambers**
under different external_id schemes — one (`-200978`) holding a Mayor office + 2 Council Member
offices (only Cameron Smyth `-700180` seated), the other (`11243`, `official_count=5`) holding
3 Councilmembers (Jason Gibbs, Laurene Weste, Patsy Ayala — positive `665xxx` ext_ids).
This phase is **reconcile + complete + stances**: consolidate the duplicate chambers into the
real 5-seat at-large council, model the rotational Mayor correctly, complete the roster, fix
data hygiene (geo_id backfill, image dedupe, title normalization, office_id back-links), then
apply evidence-only compass stances for all officials (currently 0).

**Success criteria:** Per the shared per-city criteria above, plus: the two duplicate "City
Council" chambers reconciled to one; rotational-Mayor modeled per Santa Clarita's council-manager
form; 5/5 at-large council seats (or documented); image dedupe (Gibbs 2→1); stances 0 → full
coverage. See `phases/143-santa-clarita-deep-seed/143-CONTEXT.md`.
**Plans:** 2/4 plans executed
**Wave 1**

- [x] 143-01-PLAN.md — Reconcile / data hygiene: geo_id backfill, retire duplicate Chamber A + Smyth, dedupe Gibbs image, normalize titles — migration 894

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 143-02-PLAN.md — Complete roster: insert McLean + Miranda (reserved -700xxx), flag rotational Mayor on Weste seat, official_count=5 — migration 895

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 143-03-PLAN.md — Headshots for McLean + Miranda (600×750) + full-roster image audit — migration 896 (audit-only)

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 143-04-PLAN.md — Evidence-only compass stances for the 5 current councilmembers (no judicial topics; Smyth excluded) — migrations 897–901 (no ledger)

### Phase 157: Wave 2 close-out

**Goal:** Surface the new cities and capture learnings.

**Requirements:** LAC2-RETRO-01

**Success criteria:**

1. All 15 new cities present in Landing.jsx COVERAGE_STATES with correct browse wiring (purple/has-context)
2. LOCATION-ONBOARDING.md updated — any LA-County-Wave-2 GOTCHAs + 15 Cities Onboarded rows
3. v17.0 milestone audit written (DB-verified per-city counts) and milestone closed in MILESTONES.md / STATE.md / PROJECT.md
