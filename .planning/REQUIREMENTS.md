# Requirements — v23.0 Educators & Judges Tabs

**Milestone goal:** Add **Educators** (school-board leads) and **Judges** as first-class tabs on the
results/officials view — beside Representatives & Elections — that filter school-board and judicial
office-holders into their own compass-integrated tabs, decluttering Representatives, with graceful
grey-out where a location has no such data and an automatic default compass-lens shift per tab.

**Pattern:** Frontend feature milestone on an existing codebase. Builds on the Phase 204 data-driven
lens switcher (`CompassControlsBar`, `LensChipRow`, `CompassContext.lenses`), the existing Results tab
model (Representatives + Elections in `Results.jsx`), and the `FilterBar` / office-classification data.
No new geographic data. Includes one evidence-based stance-research phase reusing the established
one-agent-at-a-time / 100%-cited / no-defaults workflow.

> **v22.0 still held-open:** v22.0 (Tucson & Arizona) is substantively complete but not formally closed —
> Phase 200 (close), Phase 206 (candidate reconcile), and the Sahuarita/South Tucson reconcile are gated
> on the 2026-07-21 AZ primary certification. Its requirements are archived at
> `.planning/milestones/v22.0-REQUIREMENTS.md`. This file scopes v23.0 only.

---

## Milestone v23.0 Requirements

### Tabs & Filtering

- [x] **TAB-01**: On the results/officials view, a user can switch among **Representatives**,
  **Educators**, and **Judges** tabs (alongside the existing **Elections** tab). The Educators tab lists
  school-board office-holders for the location; the Judges tab lists judicial office-holders.
- [x] **TAB-02**: School-board and judicial office-holders **no longer appear in the Representatives
  tab** — they surface only under their Educators / Judges tab, so Representatives is decluttered (fixes
  the "wade through every LA school-board district" problem).
- [x] **TAB-03**: An Educators/Judges tab is **hidden entirely** when the current location has no
  office-holders of that type (no school-board members → no Educators tab; no judges → no Judges tab).
  Representatives always shows as the catch-all; a stale/empty `?view=` falls back to Representatives.
  (Revised from "greyed out / disabled" per Phase 208 CONTEXT.md D-05/D-06: most locations lack
  school-board/judicial data, so hiding empty tabs keeps the UI honest rather than showing dead
  greyed tabs.)

### Officials Classification

- [x] **CLASS-01**: Every office-holder returned for a location is **reliably classified** as
  Representative, Educator (school board), or Judge from existing data (chamber / office / geo type),
  driving which tab it appears in — ordinary representatives are never misfiled into the Educators or
  Judges buckets, and school-board / judicial officials are never left in Representatives.

### Compass Integration

- [x] **CMP-01**: The **Compass button + overlay work inside the Educators and Judges tabs** exactly as
  in Representatives — cards render their compass and the lens switcher is available.
- [x] **CMP-02**: Switching tabs **shifts the default compass lens for that group** — Judges → the
  existing **Judicial lens**; Educators → the **Education lens**; returning to Representatives restores
  the Custom/prior default. An explicit user lens selection still overrides the per-tab default.

### Education Lens Scaffolding

- [ ] **EDU-01**: An **Education lens exists as a data-driven lens entry** (parallel to Judicial),
  recognized by the lens switcher and the per-tab default-lens logic, so authoring its 8 topics later is
  a **data-only change** (no code change) — mirroring the Phase 204 "adding a lens is a data change"
  guarantee.
- [ ] **EDU-02**: Until the Education lens has enough authored topics, it renders in its
  **needs-calibration / greyed** state and the Educators tab **gracefully falls back to the Custom
  overlap** — no broken or empty compass, no fabricated spokes (honest blanks).

### Deep-Dive Stance Research

- [x] **RES-01**: Evidence-based **full-compass stance research** is completed and applied for **Donald
  Trump, JD Vance, and Marco Rubio** — every applicable compass topic answered with **100% citations**,
  **no default values**, and honest blank spokes where no evidence exists.

---

## Future Requirements (deferred)

- **Author the 8 Education-lens topics** — the actual education spectrums (e.g. book banning, religious
  texts in public schools, transgender athletes, curriculum standards, school choice/vouchers, …) with
  their 1–5 answer chairs; seeded as live compass topics so EDU-01's data-only path lights the lens.
- **Elections "ballot hub" build-out** — sample-ballot download, propositions/measures exploration,
  when/where your next election is and exactly what is on the ballot; the Elections tab becomes the
  catch-all for everything a citizen votes on.
- **Broad school-board & judicial stance research** — evidence-only stances for seeded educators/judges
  beyond the three deep-dive federal figures.
- **Judicial roster expansion** — seeding elected judges for more jurisdictions so the Judges tab lights
  up in more locations.

## Out of Scope

- **Per-card lens controls** — the lens switcher stays one global control (unchanged from Phase 204).
- **Building the calibration quiz inside essentials** — reuse the Compass app handoff (unchanged).
- **Authoring Education-lens topic content this milestone** — scaffolding only; topics are deferred.
- **The Elections ballot-hub features** — deferred; Elections stays the current unified ballot list.
- Party affiliation on candidate/official display — antipartisan mission (project-wide, unchanged).

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLASS-01 | Phase 207 | Complete |
| TAB-01 | Phase 208 | Complete |
| TAB-02 | Phase 208 | Complete |
| TAB-03 | Phase 208 | Complete |
| EDU-01 | Phase 209 | Pending |
| EDU-02 | Phase 209 | Pending |
| CMP-01 | Phase 210 | Complete |
| CMP-02 | Phase 210 | Complete |
| RES-01 | Phase 211 | Complete |

**Coverage:** 9/9 v23.0 requirements mapped to exactly one phase (207–211). No orphans, no duplicates.
