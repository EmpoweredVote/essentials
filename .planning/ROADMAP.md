# Roadmap: v19.0 Essentials Dark-Mode Redesign & Section Banners

**Created:** 2026-06-24
**Granularity:** standard (no config override)
**Coverage:** 11/11 requirements mapped (no orphans, no duplicates)

**Milestone goal:** Adopt the Figma dark-mode visual design for Essentials and replace the
Local/State/National sort buttons with scrollable, full-bleed graphic banner dividers between
City → State → Federal sections — recreating Aditi's Bloomington-banner treatment as a reusable,
location-aware, data-ready system.

**Frontend-only.** React 19 + Vite + Tailwind 4 + `@empoweredvote/ev-ui`. No backend/DB schema
changes. Continues phase numbering from v18.0 (parked at Phase 162; phase dirs 158–168 reserved).
**This milestone starts at Phase 169.** v18.0 NV resumes after v19.0 closes.

**Figma source:** `J9mfnUSnc2k6fUQDhw9L7h` node `3957:563`.

---

## Phases

- [x] **Phase 169: Dark-Mode Design System Foundation** — Extract Figma dark tokens into `index.css` and bring Results/Representatives to the dark treatment. (completed 2026-06-25)
- [x] **Phase 170: Section Banners & Continuous Scroll (Results)** — Reusable `SectionBanner` divides Results into City → State → Federal in one scroll; tier sort buttons removed. (completed 2026-06-26)
- [ ] **Phase 171: Banner Asset Pipeline & Exemplar Art** — Bloomington/Indiana/US + LA/California/US banner art produced + documented repeatable sourcing procedure.
- [ ] **Phase 172: Elections Page Parity** — Elections page adopts the same dark treatment and `SectionBanner` dividers.

---

## Phase Details

### Phase 169: Dark-Mode Design System Foundation

**Goal**: The Results/Representatives page renders in the Figma dark-mode treatment, driven by a single source of design tokens.
**Depends on**: Nothing (first phase of milestone)
**Requirements**: DARK-01, DARK-02
**Success Criteria** (what must be TRUE):

  1. A user viewing Results in dark mode sees the Figma style-guide treatment — page background (`ev-navy`), tab/header chrome, section areas, and tiles all read as the dark design, with no faint-gray-on-dark legibility failures.
  2. Color, type-scale, and spacing values used on Results trace to `@theme` / CSS variables in `src/index.css` (single source of truth), not scattered inline literals.
  3. ev-ui inline-style components (`GovernmentBodySection` / `SubGroupSection`) display correctly on dark via `!important` overrides — no light-mode bleed.
  4. The `PoliticianCard` 4:5 tile renders unchanged in shape and size (only re-themed for dark).
  5. Light mode still renders as-is (no light-mode regression).**Plans**: 2 plans

**Wave 1**

  - [x] 169-01-PLAN.md — Reconcile dark `@theme` token VALUES to the Figma palette + wire Inter/Manrope `--font-*` tokens (DARK-01)

**Wave 2** *(blocked on Wave 1 completion)*

  - [x] 169-02-PLAN.md — Apply the palette to Results + global header (ev-ui `!important` overrides, inline-literal sweep, minimal FilterBar) + manual-visual sign-off (DARK-02)

**UI hint**: yes

### Phase 170: Section Banners & Continuous Scroll (Results)

**Goal**: Results presents City → State → Federal as one continuous scroll separated by graphic banner dividers, with the tier sort control gone.
**Depends on**: Phase 169
**Requirements**: BANR-01, BANR-02, BANR-03, BANR-04, NAV-01
**Success Criteria** (what must be TRUE):

  1. Scrolling Results shows a Bloomington skyline banner before City officials, an Indiana banner before State, and a US banner before Federal — each a full-bleed image with dark gradient overlay, location label, and pin (Aditi's Bloomington treatment), rendered by one reusable `SectionBanner` component.
  2. There are no Local/State/National tier sort buttons; all three tiers always render in full in a single vertical scroll (no tab/button switching between tiers).
  3. The correct banner image + label is selected per jurisdiction (e.g. an LA address shows LA / California / US), driven by an extended `buildingImages.js` tier→image mapping; a jurisdiction with no specific art falls back gracefully to a gradient/generic banner instead of breaking.
  4. The Elected/Appointed type filter and the name search still work, reconciled into the new banner-divided layout.
  5. Each banner exposes a stats data-slot and a feature-icon slot as hidden/empty scaffolding (structure present in the component API; no live data or links rendered this milestone).

**Plans**: 4 plans

**Wave 1**

  - [x] 170-01-PLAN.md — Create the reusable `SectionBanner` component (image + tinted-fallback variants, eyebrow/pin/title, scaffolding slots) + unit tests (BANR-01, BANR-03, BANR-04)
  - [x] 170-02-PLAN.md — Remove the Tier sort dropdown from `FilterBar`; preserve Type filter + name search + Compass toggle (NAV-01)

**Wave 2** *(blocked on Wave 1)*

  - [x] 170-03-PLAN.md — Wire `SectionBanner` into `Results.jsx` (continuous-scroll dividers, School folds under City, location-aware fallback) + remove all `selectedFilter`/scroll-spy dead code (BANR-02, BANR-03, NAV-01)

**Wave 3** *(blocked on Wave 2; human checkpoint)*

  - [x] 170-04-PLAN.md — Start dev server + human visual/functional sign-off of banners, fallback, and filters (BANR-01..04, NAV-01)

**UI hint**: yes

### Phase 171: Banner Asset Pipeline & Exemplar Art

**Goal**: The two exemplar banner sets exist as real art, and anyone can add a new jurisdiction's banner set by following a written procedure.
**Depends on**: Phase 170 (consumes the `SectionBanner` + `buildingImages.js` mapping)
**Requirements**: ASST-01, ASST-02
**Success Criteria** (what must be TRUE):

  1. Bloomington/Indiana/US and LA/California/US banner art exists in the unified skyline + dark-overlay treatment (Unsplash skylines + Wikimedia state/federal landmarks + AI fallback), stored consistently (public/images or Supabase Storage mirror) and wired into `buildingImages.js`.
  2. Browsing a Bloomington address and an LA address each shows its own exemplar banner set on the live Results page (not the generic fallback).
  3. A documented, repeatable procedure exists describing image sourcing → dark-overlay treatment → wiring into `buildingImages.js`, sufficient for the ~10 remaining covered states to be filled in later without re-deriving the process.
  4. Jurisdictions without art still fall back to the graceful gradient/generic banner (no broken images).

**Plans**: 2 plans
- [x] 171-01-PLAN.md — Reusable banner toolchain (scripts/banners PIL process + Storage upload) + docs/banner-asset-pipeline.md operator runbook (ASST-02)
- [ ] 171-02-PLAN.md — Bloomington exemplar art (source/treat/upload to cities/bloomington.jpg) + buildingImages.js rewire + D-04 dead-code/asset cleanup + live verify (ASST-01)
**UI hint**: yes

### Phase 172: Elections Page Parity

**Goal**: The Elections page matches Results — same dark treatment and the same banner dividers between tiers.
**Depends on**: Phase 170 (SectionBanner pattern), Phase 169 (dark tokens), Phase 171 (art available)
**Requirements**: DARK-03, BANR-05
**Success Criteria** (what must be TRUE):

  1. The Elections page renders in the same Figma dark-mode treatment as Results (background, chrome, section areas, tiles consistent across both pages).
  2. Scrolling the Elections page shows the same `SectionBanner` dividers between City → State → Federal tiers, location-aware per jurisdiction with the same graceful fallback.
  3. Existing Elections behaviors are preserved — randomized per-session candidate ordering, "Running Unopposed" / "No candidates have filed" handling, and Connected auto-load via `elections/me`.
  4. Compass / MiniCompass overlay behavior on Elections is preserved (re-themed only as needed for dark legibility).

**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 169. Dark-Mode Design System Foundation | 2/2 | Complete   | 2026-06-25 |
| 170. Section Banners & Continuous Scroll (Results) | 4/4 | Complete   | 2026-06-26 |
| 171. Banner Asset Pipeline & Exemplar Art | 1/2 | In Progress|  |
| 172. Elections Page Parity | 0/0 | Not started | - |

---

## Coverage

✓ All 11 v19.0 requirements mapped to exactly one phase
✓ No orphaned requirements
✓ No duplicate assignments

| REQ-ID | Phase |
|--------|-------|
| DARK-01 | 169 |
| DARK-02 | 169 |
| DARK-03 | 172 |
| BANR-01 | 170 |
| BANR-02 | 170 |
| BANR-03 | 170 |
| BANR-04 | 170 |
| BANR-05 | 172 |
| NAV-01 | 170 |
| ASST-01 | 171 |
| ASST-02 | 171 |

---

## Deferred (Future Requirements — not in v19.0)

- Live banner stats wired into BANR-04's data-slot.
- Banner feature-icon links (treasury-tracker, etc.) wired to live destinations.
- Banner art for remaining covered states (OR, ME, MA, MD, VA, UT, TX, NV, others).
- Landing page + politician profile pages brought to the dark treatment (v19.0 scopes Results + Elections only).
