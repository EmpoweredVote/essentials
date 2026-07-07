# Requirements: v21.0 Smart Banners

> Defined 2026-07-06 via `/gsd-new-milestone`. Continues v19.0's `SectionBanner`
> scaffolding (phases start at 187).

**Core Value:** A resident can look up who represents them — and who is on their ballot — without creating an account.

## Scope

Turn the section banners built in v19.0 into **location-aware hubs**. v19.0 shipped `SectionBanner`
(`src/components/SectionBanner.jsx`) with two deliberately inert scaffolding slots — `stats`
(`data-slot="stats"`) and `featureIcons` (`data-slot="feature-icons"`), both BANR-04. This milestone
fills them:

1. **A tethered feature-icon row** — a row of EV-product logo icons (from `ev-landing/ev-landing-main/icons`)
   with hover/focus tooltips. Each icon deep-links to **the banner's own location** in another EV product —
   the Texas banner's Treasury icon opens the *Texas* Treasury Tracker; the Plano banner's opens the *Plano*
   Treasury Tracker. It carries the **banner location**, never the user's saved/broker location. An icon
   appears **only when a valid per-location link can be built** — no dead links, no greyed placeholders.
2. **A location stats strip** — a few legible facts (population first) about the banner's location, sourced
   from **Census**, keyed to the banner location's geo identifier.

**Boundaries:** Essentials-only (this repo), built as a **reusable component** consumed by both the
Representatives/Results page and the Elections page (single source of truth, promotable to
`@empoweredvote/ev-ui` later). The reciprocal icons on *other* apps' banners (e.g. the Essentials icon on
Treasury Tracker) are a **documented follow-on pattern, out of scope** for v21.0.

**Known rails (from this session's recon):**
- Treasury deep-link contract: `https://financials.empowered.vote/?entity=<slug>`, slug = `name-state`
  (e.g. `bloomington-in`). Essentials already has `src/lib/treasury.js` (`fetchTreasuryCities`,
  `toTreasurySlug`, `findMatchingMunicipality` with has-data + same-state disambiguation). Treasury also
  exposes state General Fund + federal entities → state/federal tiers are linkable when the entity exists.
- Compass (`compass.empowered.vote`) and Read & Rank (`read-rank`) are **not** path-parameterized by
  location today; under the context-aware rule they simply render no icon until a per-location contract exists.
- Banner call sites: `src/pages/Results.jsx` (~line 1938) and `src/components/ElectionsView.jsx` (~line 577),
  both across city / state / federal tiers.

## Milestone v21.0 Requirements

### Feature Icon Row (ICON)

- [ ] **ICON-01:** A user sees a row of EV-product logo icons on a section banner (city / state / federal)
      whenever at least one product has a valid per-location link for that banner's location.
- [ ] **ICON-02:** A user who hovers or keyboard-focuses an icon sees a tooltip naming the product the icon
      links to.
- [ ] **ICON-03:** Icons render from the shared `ev-landing/ev-landing-main/icons` symbol set, are
      dark-banner-legible (light/dark symbol variant as appropriate), and are positioned so they never
      obscure the banner's location title.

### Location Tethering (TETH)

- [ ] **TETH-01:** Clicking a product icon opens that product at **the banner's own location**, not the
      user's saved/broker location (verified by comparing a banner whose location differs from the user's
      current location).
- [ ] **TETH-02:** The Treasury Tracker icon links via the `financials.empowered.vote/?entity=<name-state>`
      slug contract, resolved through `treasury.js` (has-data predicate + same-state disambiguation).
- [ ] **TETH-03:** A product icon appears only when a valid per-location deep-link can be constructed for
      that banner's location; otherwise the icon is omitted entirely (no dead links, no disabled/greyed
      placeholders).
- [ ] **TETH-04:** State- and federal-tier banners resolve their Treasury entity at the correct tier
      (state General Fund / federal), not only municipalities — e.g. the state banner links to the state
      Treasury entity when one exists.

### Location Stats (STAT)

- [ ] **STAT-01:** A user sees at least one legible fact (population) about the banner's location on the
      city and state banners.
- [ ] **STAT-02:** Displayed stats are sourced from Census data keyed to the banner location's geo
      identifier (FIPS/geo_id), not hardcoded per city.
- [ ] **STAT-03:** When a stat is unavailable for a location, the strip omits that stat gracefully — no
      zeros, nulls, "undefined", or broken labels; the banner still renders cleanly.

### Smart-Banner Integration (SBAN)

- [ ] **SBAN-01:** The icon row + stats strip appear on the **Representatives/Results** page banners across
      all three tiers (city / state / federal).
- [ ] **SBAN-02:** The same enhancements appear on the **Elections** page banners (`ElectionsView`) across
      all three tiers, with identical behavior — no page-specific divergence.
- [ ] **SBAN-03:** The enhancements are implemented as a **reusable component** consumed by both pages
      (single source of truth; promotable to `@empoweredvote/ev-ui`), not duplicated per call site.
- [ ] **SBAN-04:** A banner with no product links and no available stats still renders cleanly (title + art
      only, matching current v19.0 behavior) — no empty containers, no layout shift, no console errors.

## Future Requirements (deferred)

- **Reciprocal tethering** — the Essentials icon (and others) on *other* EV apps' banners
  (Treasury Tracker, Compass, Read & Rank), applying the same location-tethered pattern in those repos.
- **Compass / Read & Rank per-location contracts** — once those apps accept a per-location URL, add their
  icons under the same context-aware rule.
- **Richer stats** — additional per-tier facts beyond population (median income, land area, county/seat
  counts, etc.) as Census sourcing matures.
- **Promote to `@empoweredvote/ev-ui`** — extract the reusable smart-banner component into the shared
  library so all EV apps consume one implementation.

## Out of Scope

- Building banner/icon UI inside the Treasury Tracker, Compass, or Read & Rank repos (separate apps/deploys).
- Using the `ev-context` broker to choose an icon's link target — links must carry the **banner's** location,
  which is the opposite of "inherit the user's current location."
- Banner art for the ~10 remaining covered states, and Landing + politician-profile dark-mode treatment
  (still-deferred v19.0 frontend track — explicitly not v21.0).
- Light-mode banner treatment — `SectionBanner` is dark-mode-only by design (v19.0 DARK-01).

## Traceability

<!-- Filled by the roadmapper: REQ-ID → Phase mapping. -->

All 14 v21.0 requirements mapped to exactly one phase. No orphans, no duplicates. See
`.planning/ROADMAP.md` for full phase details.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ICON-01 | Phase 187: Tethered Feature-Icon Row | Pending |
| ICON-02 | Phase 187: Tethered Feature-Icon Row | Pending |
| ICON-03 | Phase 187: Tethered Feature-Icon Row | Pending |
| TETH-01 | Phase 187: Tethered Feature-Icon Row | Pending |
| TETH-02 | Phase 187: Tethered Feature-Icon Row | Pending |
| TETH-03 | Phase 187: Tethered Feature-Icon Row | Pending |
| TETH-04 | Phase 187: Tethered Feature-Icon Row | Pending |
| STAT-01 | Phase 188: Location Stats Strip | Pending |
| STAT-02 | Phase 188: Location Stats Strip | Pending |
| STAT-03 | Phase 188: Location Stats Strip | Pending |
| SBAN-01 | Phase 189: Smart-Banner Integration & Graceful Degradation | Pending |
| SBAN-02 | Phase 189: Smart-Banner Integration & Graceful Degradation | Pending |
| SBAN-03 | Phase 189: Smart-Banner Integration & Graceful Degradation | Pending |
| SBAN-04 | Phase 189: Smart-Banner Integration & Graceful Degradation | Pending |
