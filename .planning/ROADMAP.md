# Roadmap: Essentials — Empowered Vote

Per-milestone phase detail is archived under `.planning/milestones/v{X.Y}-ROADMAP.md` at milestone
close. This file is the milestone index; the active milestone is expanded in full below, and
shipped milestones are collapsed into `<details>` blocks.

## Milestones

- ✅ **v21.0 Smart Banners** — Phases 187–189 (shipped 2026-07-08)
- ✅ **v20.0 West-Metro Washington County, OR** — Phases 174–186 (shipped 2026-07-05)
- ✅ **v18.0 Las Vegas & Clark County, NV** — Phases 158–168, 173 (shipped 2026-06-30)
- ✅ **v19.0 Dark-Mode Redesign & Section Banners** — Phases 169–172 (shipped 2026-06-28, formally closed 2026-07-05)
- ✅ **v17.0 LA County City Coverage Wave 2** — Phases 142–157 (shipped 2026-06-22)
- ✅ earlier milestones v2.0–v16.0 — see `.planning/milestones/` archives + `MILESTONES.md`

_No active milestone. Open the next one with `/gsd-new-milestone`._

## Phases

<details>
<summary>✅ v21.0 Smart Banners (Phases 187–189) — SHIPPED 2026-07-08</summary>

Full detail: `.planning/milestones/v21.0-ROADMAP.md` · requirements: `.planning/milestones/v21.0-REQUIREMENTS.md`

Filled v19.0's two deliberately-inert `SectionBanner` scaffolding slots (`featureIcons` + `stats`),
turning every section banner into a location-aware hub. Frontend-only — no backend/DB schema changes.
A tethered EV-product icon row deep-links each banner's OWN location (never the user's) into other EV
products; a Census-sourced population strip shows a legible fact per tier; both wired identically into
Results and Elections through one shared `buildBannerProps` helper, degrading gracefully to the v19.0
title-only banner when no links or stats exist.

- [x] Phase 187: Tethered Feature-Icon Row (2/2) — completed 2026-07-07
- [x] Phase 188: Location Stats Strip (3/3) — completed 2026-07-07
- [x] Phase 189: Smart-Banner Integration & Graceful Degradation (3/3) — completed 2026-07-08

14/14 requirements (ICON-01/02/03 + TETH-01/02/03/04 → 187; STAT-01/02/03 → 188; SBAN-01/02/03/04 → 189).
Phase 189 VERIFICATION PASS 8/8 (operator-approved live); no standalone milestone audit — Phase 189 was
the integration/verification phase.

</details>

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
This deferred scope is what v21.0 filled.

</details>

## Progress

All v21.0 phases shipped (3/3 phases, 8 plans, 14/14 requirements — 100%). Per-milestone progress
tables are archived to `.planning/milestones/v{X.Y}-ROADMAP.md` at close. No active milestone —
open the next one with `/gsd-new-milestone`.
