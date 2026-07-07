# Roadmap: Essentials — Empowered Vote

Per-milestone phase detail is archived under `.planning/milestones/v{X.Y}-ROADMAP.md` at milestone
close. This file is the milestone index; the active milestone is expanded in full below, and
shipped milestones are collapsed into `<details>` blocks.

## Milestones

- 🚧 **v21.0 Smart Banners** — Phases 187–189 (active)
- ✅ **v20.0 West-Metro Washington County, OR** — Phases 174–186 (shipped 2026-07-05)
- ✅ **v18.0 Las Vegas & Clark County, NV** — Phases 158–168, 173 (shipped 2026-06-30)
- ✅ **v19.0 Dark-Mode Redesign & Section Banners** — Phases 169–172 (shipped 2026-06-28, formally closed 2026-07-05)
- ✅ **v17.0 LA County City Coverage Wave 2** — Phases 142–157 (shipped 2026-06-22)
- ✅ earlier milestones v2.0–v16.0 — see `.planning/milestones/` archives + `MILESTONES.md`

## Phases

### 🚧 v21.0 Smart Banners (Phases 187–189) — ACTIVE

## Overview

v19.0 shipped `SectionBanner` with two deliberately inert scaffolding slots — `stats` and
`featureIcons` — plus the `treasury.js` has-data matching contract. v21.0 fills both slots:
a tethered product-icon row that deep-links each banner's *own* location (never the user's)
into other EV products, and a Census-sourced stats strip led by population. The two workstreams
build independently (icon/tethering logic vs. Census stats sourcing) and converge in a final
integration phase that wires the enhanced, single-source-of-truth component into both
`Results.jsx` and `ElectionsView.jsx`, verifying identical behavior and graceful degradation
when a banner has neither links nor stats. Frontend-only — no backend/DB schema changes.

**Phase Numbering:** Continues from v20.0 (last phase: 186). This milestone's phases start at 187.

- [ ] **Phase 187: Tethered Feature-Icon Row** - Build the location-tethered, context-aware product-icon row and Treasury deep-link resolution.
- [ ] **Phase 188: Location Stats Strip** - Build the Census-sourced, population-first stats strip keyed to the banner's geo identifier.
- [ ] **Phase 189: Smart-Banner Integration & Graceful Degradation** - Wire the enhanced component into both Results and Elections pages as one shared implementation; verify empty-state and cross-page parity.

## Phase Details

### Phase 187: Tethered Feature-Icon Row
**Goal**: Every section banner shows a row of EV-product logo icons that deep-link into **that banner's own location** in other EV products — never the user's saved/broker location — and an icon appears only when a valid per-location link actually exists.
**Depends on**: Nothing (first phase of v21.0; extends v19.0's `SectionBanner` `featureIcons` slot and the existing `treasury.js` has-data matching contract)
**Requirements**: ICON-01, ICON-02, ICON-03, TETH-01, TETH-02, TETH-03, TETH-04
**Success Criteria** (what must be TRUE):
  1. On a banner whose location has an available Treasury dataset, the icon row shows a Treasury icon; hovering or keyboard-focusing it shows a tooltip naming "Treasury Tracker."
  2. Clicking the Treasury icon on a banner opens `financials.empowered.vote/?entity=<name-state>` for **the banner's own location** — verified by viewing a banner whose location differs from the user's own saved/current location and confirming the link carries the banner's location, not the user's.
  3. A state-tier banner (e.g., "Texas") links its Treasury icon to the Texas state General Fund entity when one exists; a federal-tier banner links to a federal Treasury entity when one exists — not only municipalities.
  4. A banner whose location has no matching Treasury entity shows no Treasury icon at all — no greyed-out or disabled icon, no dead link.
  5. Icons render from the shared `ev-landing/ev-landing-main/icons` set in a variant that stays legible against the banner's dark background, and are positioned so they never overlap the location title text.
**Plans**: TBD
**UI hint**: yes

### Phase 188: Location Stats Strip
**Goal**: City and state banners show at least one legible, Census-sourced fact (population first) about that banner's own location, resolved dynamically from the location's geo identifier — and the strip degrades gracefully when a stat is unavailable.
**Depends on**: Nothing (independent workstream from Phase 187; extends v19.0's `SectionBanner` `stats` slot)
**Requirements**: STAT-01, STAT-02, STAT-03
**Success Criteria** (what must be TRUE):
  1. A city-tier banner (e.g., Plano, TX) displays that city's population as a legibly formatted fact, positioned so it never collides with the location title.
  2. A state-tier banner (e.g., Texas) displays that state's population.
  3. The displayed population is fetched/keyed by the banner location's Census geo identifier (FIPS place/state code) — not a hardcoded per-city or per-state lookup table.
  4. When Census data is unavailable for a location (no FIPS match, fetch failure, etc.), the stats strip simply omits that fact — no "undefined," no "0," no broken label — and the rest of the banner still renders normally.
**Plans**: TBD
**UI hint**: yes

### Phase 189: Smart-Banner Integration & Graceful Degradation
**Goal**: The icon row and stats strip from Phases 187–188 appear identically on both the Representatives/Results page and the Elections page, built and consumed from one shared component — and a banner with no product links and no available stats still renders exactly as it did in v19.0.
**Depends on**: Phase 187, Phase 188
**Requirements**: SBAN-01, SBAN-02, SBAN-03, SBAN-04
**Success Criteria** (what must be TRUE):
  1. Viewing the Results page and the Elections page for the same location show the identical icon row and stats strip on each of the city / state / federal banners — no page-specific divergence in behavior or appearance.
  2. Both `Results.jsx` and `ElectionsView.jsx` render their banners through the same shared component — confirmed by code inspection, not two parallel implementations (single source of truth, promotable to `@empoweredvote/ev-ui`).
  3. A banner for a location with zero valid product links and zero available stats renders its title, pin, and art exactly as in v19.0 — no empty containers, no layout shift, no console errors.
  4. All three tiers (city, state, federal) show the enhanced banner treatment — icon row and/or stats strip where data exists — on both pages.
**Plans**: TBD
**UI hint**: yes

### Coverage (v21.0)

All 14 v21.0 requirements mapped to exactly one phase. No orphans, no duplicates.

| Requirement | Phase |
|-------------|-------|
| ICON-01 | 187 |
| ICON-02 | 187 |
| ICON-03 | 187 |
| TETH-01 | 187 |
| TETH-02 | 187 |
| TETH-03 | 187 |
| TETH-04 | 187 |
| STAT-01 | 188 |
| STAT-02 | 188 |
| STAT-03 | 188 |
| SBAN-01 | 189 |
| SBAN-02 | 189 |
| SBAN-03 | 189 |
| SBAN-04 | 189 |

<details>
<summary>✅ v20.0 West-Metro Washington County, OR (Phases 174–186) — SHIPPED 2026-07-05</summary>

Full detail: `.planning/milestones/v20.0-ROADMAP.md` · audit: `v20.0-MILESTONE-AUDIT.md`

- [x] Phase 174: West-Metro School-District Geofences (1/1) — completed 2026-06-30
- [x] Phase 175: Washington County Commission Deep-Seed (3/3) — completed 2026-07-01
- [x] Phase 176: City of Beaverton Deep-Seed (5/5) — completed 2026-07-02
- [x] Phase 177: City of Hillsboro Deep-Seed (5/5) — completed 2026-07-02
- [x] Phase 178: City of Tigard Deep-Seed (5/5) — completed 2026-07-02
- [x] Phase 179: City of Tualatin Deep-Seed (5/5) — completed 2026-07-03
- [x] Phase 180: City of Forest Grove Deep-Seed (5/5) — completed 2026-07-03
- [x] Phase 181: City of Sherwood Deep-Seed (5/5) — completed 2026-07-03
- [x] Phase 182: City of Cornelius Deep-Seed (5/5) — completed 2026-07-04
- [x] Phase 183: School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J (4/4) — completed 2026-07-04
- [x] Phase 184: School Boards Wave 2 — Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J (4/4) — completed 2026-07-04
- [x] Phase 185: WashCo 2026 Elections & Discovery (3/3) — completed 2026-07-05
- [x] Phase 186: West-Metro Playbook Retrospective & Close (1/1) — completed 2026-07-05

</details>

<details>
<summary>✅ v18.0 Las Vegas & Clark County, NV (Phases 158–168, 173) — SHIPPED 2026-06-30</summary>

Full detail: `.planning/v18.0-MILESTONE-AUDIT.md` + `MILESTONES.md`.

- [x] Phase 158: Nevada TIGER Geofences — completed 2026-06-23
- [x] Phase 159: Nevada State & Federal Government — completed 2026-06-23
- [x] Phase 160: Nevada Legislature (seed + headshots) — completed 2026-06-23
- [x] Phase 161: Clark County Commission Deep-Seed — completed 2026-06-24
- [x] Phase 162: City of Las Vegas Deep-Seed — completed 2026-06-28
- [x] Phase 163: Henderson Deep-Seed — completed 2026-06-28
- [x] Phase 164: North Las Vegas Deep-Seed — completed 2026-06-29
- [x] Phase 165: Boulder City Deep-Seed — completed 2026-06-29
- [x] Phase 166: CCSD Board of Trustees Deep-Seed — completed 2026-06-29
- [x] Phase 167: NV 2026 Elections & Discovery — completed 2026-06-29
- [x] Phase 168: NV 2026 Candidate Population — completed 2026-06-30
- [x] Phase 173: Nevada Playbook Retrospective & Close — completed 2026-06-30

</details>

<details>
<summary>✅ v19.0 Dark-Mode Redesign & Section Banners (Phases 169–172) — SHIPPED 2026-06-28 (closed 2026-07-05)</summary>

Full detail: `.planning/milestones/v19.0-ROADMAP.md` · audit: `v19.0-MILESTONE-AUDIT.md`

- [x] Phase 169: Dark-Mode Design System Foundation (2/2) — completed 2026-06-25
- [x] Phase 170: Section Banners & Continuous Scroll — Results (4/4) — completed 2026-06-26
- [x] Phase 171: Banner Asset Pipeline & Exemplar Art (2/2) — completed 2026-06-27
- [x] Phase 172: Elections Page Parity (1/1) — completed 2026-06-28

Frontend-only detour built 2026-06-25 → 06-28 (verified + deployed); formal close ran 2026-07-05.
Deferred (out of scope): live banner stats, feature-icon links, remaining-state art, Landing/profile dark mode.
This deferred scope is what v21.0 now fills.

</details>

## Progress (most-recent milestone: v21.0)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 187. Tethered Feature-Icon Row | v21.0 | 0/TBD | Not started | - |
| 188. Location Stats Strip | v21.0 | 0/TBD | Not started | - |
| 189. Smart-Banner Integration & Graceful Degradation | v21.0 | 0/TBD | Not started | - |

**v21.0: 0/3 phases complete, 0 plans, 0/14 requirements. Progress 0%.**

<!-- v20.0 progress table archived to .planning/milestones/v20.0-ROADMAP.md at milestone close. -->
