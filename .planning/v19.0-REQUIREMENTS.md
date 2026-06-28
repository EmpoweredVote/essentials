# Requirements: v19.0 Essentials Dark-Mode Redesign & Section Banners

**Defined:** 2026-06-24
**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

**Milestone goal:** Adopt the Figma dark-mode visual design for Essentials and replace the
Local/State/National sort buttons with scrollable, full-bleed **graphic banner dividers** between
City → State → Federal sections — recreating Aditi's Bloomington-banner treatment as a reusable,
location-aware, data-ready system.

**Figma source:** `J9mfnUSnc2k6fUQDhw9L7h` node `3957:563` (Empowered Vote Style Guide).

**Frontend-only milestone.** No backend/DB schema changes required (banner data is structure-only
this milestone). v18.0 NV is parked at Phase 162 and resumes after this closes.

---

## Existing infrastructure to reuse (not greenfield)

- `src/lib/buildingImages.js` — `getBuildingImages(city, state)` returns `{ Local, State, Federal }`
  images; existing assets in `public/images/` (`bloomington-city-hall.jpg`, `indiana-state-house.jpg`,
  `california-state-capitol.jpg`, `la-city-hall.jpg`, `us-capitol.jpg`, generic SVG fallbacks,
  `state-capitols/`). Currently rendered as a **scroll-swapping sidebar image** (Results.jsx two-panel).
- Dark mode: `src/hooks/useTheme.js` + `@theme` tokens in `src/index.css` (`ev-navy #020618`,
  `ev-navy-card #1a2235`, `ev-teal-light #59b0c4`, `ev-coral #ff5740`); ev-ui overrides require `!important`.
- `src/components/FilterBar.jsx` — holds the tier dropdown (All/Local/State/Federal) to be removed.
- `src/components/PoliticianCard.jsx` — 4:5 tile to **preserve** (shape/size unchanged).
- Section rendering: `src/pages/Results.jsx` tier sections (~L1907–1973) + `GovernmentBodySection` /
  `SubGroupSection` from `@empoweredvote/ev-ui`. Elections: `src/components/ElectionsView.jsx`.

---

## v19.0 Requirements

### Dark-Mode Visual System (DARK)

- [x] **DARK-01**: Dark-mode design tokens (color, type scale, spacing) are extracted from the Figma
  style guide and reconciled into `src/index.css` `@theme` / CSS variables as the single source of truth.
- [x] **DARK-02**: The Results/Representatives page renders in the Figma dark-mode treatment (page
  background, tab/header chrome, section areas, tiles) — visually matching the style guide on dark.
- [ ] **DARK-03**: The Elections page renders in the same dark-mode treatment, consistent with Results.

### Section Banner Dividers (BANR)

- [x] **BANR-01**: A reusable `SectionBanner` component renders a full-bleed graphic banner in Aditi's
  Bloomington treatment — skyline/landmark image + dark gradient overlay + location label and pin.
- [x] **BANR-02**: Banners divide the Results page into City → State → Federal sections in a single
  continuous vertical scroll (no tab/button switching between tiers).
- [x] **BANR-03**: Banners are location-aware — the correct image + label is selected per jurisdiction
  (extending `buildingImages.js` tier→image mapping), with a graceful fallback (gradient/generic) when
  no jurisdiction-specific art exists.
- [x] **BANR-04**: The `SectionBanner` component exposes a stats data-slot (e.g. population, electoral
  count) and a feature-icon slot (e.g. treasury-tracker icon → link), rendered as hidden/empty
  scaffolding this milestone (structure only; live data and links deferred).
- [ ] **BANR-05**: The Elections page uses the same `SectionBanner` dividers between tiers.

### Navigation & Scroll (NAV)

- [x] **NAV-01**: The Local/State/National tier sort control is removed from the Results page; all tiers
  always render in full, separated by banners, in continuous scroll. The Elected/Appointed type filter
  and name search are preserved (reconciled into the new layout).

### Banner Assets (ASST)

- [ ] **ASST-01**: Exemplar banner art is produced and integrated for Bloomington/Indiana/US and
  LA/California/US in the unified skyline treatment (Unsplash skylines + Wikimedia state/federal
  landmarks + AI fallback), stored consistently (public/images or Supabase Storage mirror).
- [ ] **ASST-02**: A documented, repeatable procedure exists for adding a new jurisdiction's banner set
  (image sourcing → dark-overlay treatment → wiring into `buildingImages.js`), so the ~10 remaining
  covered states can be filled in later.

---

## Future Requirements (deferred)

- Live banner stats — real population / electoral-count data wired into BANR-04's data-slot.
- Banner feature-icon links — treasury-tracker (and other feature) icons wired to live destinations.
- Banner art for all remaining covered states (OR, ME, MA, MD, VA, UT, TX, NV, and others).
- Landing page and politician profile pages brought to the new dark-mode treatment (this milestone
  scopes Results + Elections only).

---

## Out of Scope

- Changing the candidate/representative tile shape or size — `PoliticianCard` 4:5 layout is preserved.
- Light-mode redesign — this milestone targets the dark-mode look; light mode remains as-is.
- Backend or database schema changes — banner data is structure-only this milestone.
- Removing the Elected/Appointed type filter or the name search.
- Compass / MiniCompass behavior changes — overlay logic is preserved (re-themed only if needed).

---

## Traceability

<!-- Filled by roadmap: REQ-ID → Phase -->

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
