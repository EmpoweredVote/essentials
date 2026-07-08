# Phase 187: Tethered Feature-Icon Row - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a row of EV-product logo icons to each `SectionBanner` (city / state / federal tiers). Each
icon deep-links **the banner's own location** into another EV product — never the user's saved/broker
(ev-context) location. An icon renders **only** when a valid per-location link can actually be
constructed for that banner's location; otherwise it is omitted entirely (no dead links, no greyed
placeholders).

This phase fills v19.0's inert `featureIcons` scaffolding slot on `SectionBanner.jsx`. In practice
**Treasury is the only product with a per-location contract today**, so it is the only icon that
renders. The `stats` slot (population) is Phase 188; wiring the shared component into both pages is
Phase 189. Frontend-only — no backend/DB schema changes.

</domain>

<decisions>
## Implementation Decisions

### Product Scope & Extensibility
- **D-01:** Build the icon row as a **generic product registry** with a fixed, reserved icon order
  (Treasury, then Compass, then Read & Rank, etc.). Each product declares a per-location resolver that
  returns a link-or-null.
- **D-02:** **Only icons with a real per-location link render now** — that is Treasury only. Compass and
  Read & Rank are NOT rendered (they have no per-location contract yet). No greyed/disabled/placeholder
  icons — this honors TETH-03. The row simply left-aligns whatever is live, so no gaps appear.
- **D-03:** The layout must **account for the full eventual set** — placement of each product's icon is
  defined up front so Compass/ReadRank plug in later with **zero layout change** once their contracts exist.
- **D-04:** **Actually wire Treasury** this phase (not just scaffold) — the Treasury icon must produce a
  working deep-link end-to-end.

### Placement & Visual Treatment
- **D-05:** Icon row sits **bottom-right** of the banner, rendered as **circular semi-transparent chips**
  (one chip per icon). The chip treatment guarantees legibility on any banner art and handles the fact
  that `treasury-symbol.svg` ships with no dark variant.
- **D-06:** The banner title stays **bottom-left**; the icon row bottom-right keeps clear of it (satisfies
  ICON-03 "never obscures the title").
- **D-07:** Reserve the **population stat (Phase 188) for the top-right**, positioned so it is NOT jammed
  into the corner. Note this now so the two workstreams don't collide when they converge in Phase 189.

### Tooltip (ICON-02)
- **D-08:** Build a **minimal accessible custom tooltip** that shows on **both hover AND keyboard focus**,
  naming the product (e.g. "Treasury Tracker"). Put an `aria-label` on the link for screen readers.
  Native `title=` is insufficient because it does not appear on keyboard focus.

### State / Federal Treasury Resolution (TETH-04)
- **D-09:** `findMatchingMunicipality` is municipality-only (`tier === 'Local'`). The **phase researcher
  must probe the live `/treasury/cities` response** to discover how state General Fund and federal
  entities are shaped/named, then design a resolver that extends beyond municipalities. Do not assume the
  entity naming — confirm from the API before planning.

### Claude's Discretion
- Whether resolution logic lives inside `SectionBanner` (self-contained, single-source-of-truth) or is
  passed in via a resolved `featureIcons` prop from the parent — planner decides, keeping Phase 189's
  "one shared component, no page-specific divergence" goal in mind.
- Treasury-cities fetch/caching strategy across the 3 stacked banners in one continuous scroll.
- Exact chip size, opacity, spacing, and icon SVG sizing (within the legibility + no-overlap constraints).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase spec & requirements
- `.planning/ROADMAP.md` §"Phase 187" — goal + 5 success criteria (the definition of done)
- `.planning/REQUIREMENTS.md` — ICON-01/02/03, TETH-01/02/03/04 (lines ~40-62)

### Existing code to extend / reuse
- `src/components/SectionBanner.jsx` — the component being extended; inert `featureIcons`/`stats` slots
  at lines 44, 114-115; title is bottom-left (lines 94-111)
- `src/lib/treasury.js` — `fetchTreasuryCities()`, `toTreasurySlug()` (slug = `name-state`),
  `findMatchingMunicipality(bodyTitle, cities, state)` (has-data predicate + same-state disambiguation);
  currently municipality-only
- `src/pages/Results.jsx` §1961-1996 — the **existing** per-body Treasury text deep-link
  ("Explore {city} revenue and expenses") — closest analog for the new banner icon; note `bodyState`
  derivation (line 1968) and `TREASURY_URL` usage
- `src/pages/Results.jsx:1938` and `src/components/ElectionsView.jsx:577` — the two `<SectionBanner>`
  call sites (relevant to how location identity reaches the banner; full convergence is Phase 189)
- Tooltip precedents: `src/components/IconOverlay.jsx`, `src/components/CompassCard.jsx`,
  `src/components/MiniCompass.jsx`

### Icon assets
- `C:/ev-landing/ev-landing-main/icons/` — `treasury-symbol.svg` (no light/dark variant),
  `essentials-symbol-{light,dark}.svg`, `compass-symbol-{light,dark}.svg`,
  `readrank-symbol-{light,dark}.svg`

### Deep-link contract
- Treasury: `https://financials.empowered.vote/?entity=<name-state>` (e.g. `bloomington-in`), resolved
  through `treasury.js`. Compass (`compass.empowered.vote`) and Read & Rank (`/c/read-rank`) are NOT
  location-parameterized yet — no icon until a per-location contract exists.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `treasury.js` (`fetchTreasuryCities` / `findMatchingMunicipality` / `toTreasurySlug`): the existing
  municipality resolver — extend for state/federal (TETH-04), reuse verbatim for city tier.
- Existing per-body Treasury link in `Results.jsx:1981-1996`: proven pattern for slug → `financials`
  deep-link with external-link affordance; the banner icon is a visual variant of this.
- `SectionBanner`'s existing `imageFailed` fallback pattern (lines 49-53): precedent for graceful
  degradation the icon row should mirror.

### Established Patterns
- SectionBanner is **dark-mode only** and traces all color/type to `src/index.css` `@theme` tokens
  (DARK-01). New chip/tooltip styling should use the same tokens, no `!important`.
- Banner is full-bleed (`-mx-6 md:-mx-12`), fixed height `120px`/`180px`; the icon row must fit within
  this without pushing layout.

### Integration Points
- New icon-row lives inside `SectionBanner.jsx`, replacing the inert `featureIcons` `sr-only` div.
- Banner must know its own location identity (name + state + tier) to resolve links — reconcile how that
  arrives from the two call sites; Phase 189 unifies both into one shared component.

</code_context>

<specifics>
## Specific Ideas

- Circular semi-transparent chips, bottom-right; population stat reserved top-right (not corner-jammed).
- Icon order reserved as `[treasury] [compass] [readrank]`; only live ones render, row left-aligns.
- Tooltip label wording e.g. "Treasury Tracker".

</specifics>

<deferred>
## Deferred Ideas

- **Compass & Read & Rank icons** — deferred until each product exposes a per-location deep-link contract.
  Layout reserves their slots now; wiring is a future phase (out of v21.0 scope).
- **Reciprocal icons on other apps' banners** (Treasury/Compass linking back to Essentials) — documented
  follow-on, explicitly out of v21.0 scope.
- **Population / Census stats strip** — Phase 188 (this phase only reserves its top-right position).
- **Shared-component consolidation across Results + Elections** — Phase 189.

</deferred>

---

*Phase: 187-tethered-feature-icon-row*
*Context gathered: 2026-07-07*
