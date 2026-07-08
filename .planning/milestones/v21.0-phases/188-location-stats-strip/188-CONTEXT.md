# Phase 188: Location Stats Strip - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Fill v19.0's inert `stats` slot on `SectionBanner.jsx` (city / state / federal tiers) so each
banner shows **at least one legible, Census-sourced fact — population — about that banner's OWN
location**, resolved dynamically from the location's **FIPS geo identifier**, not a hand-typed
per-city table. The strip **degrades gracefully**: when population can't be resolved for a
location, that fact is simply omitted (no "0", null, "undefined", or broken label) and the rest of
the banner renders normally.

This is the sibling workstream to Phase 187 (feature-icon row, bottom-right). 188 owns the
**top-right population stat** that 187 reserved (187 D-07). Frontend-only — no backend/DB schema
changes. Wiring the enhanced banner into both Results and Elections as one shared component is
Phase 189.

</domain>

<decisions>
## Implementation Decisions

### Data Source (STAT-02)
- **D-01:** Population lives in a **static, pre-generated JSON bundle committed to the repo**, keyed
  by **Census FIPS geo identifier**. No live Census API at runtime, no backend endpoint, no API
  key / CORS / rate-limit handling. Generated *from* Census data, so it satisfies STAT-02
  ("keyed by geo_id, not hardcoded per city") while giving zero-latency local lookup.
- **D-02:** The bundle is produced by a **rebuildable generator script** (committed, e.g. under
  `scripts/`) that pulls population for **all US places + all 50 states** from the
  **latest ACS 5-year estimates** (currently 2023: `api.census.gov/data/2023/acs/acs5`,
  variable `B01003_001E`, `for=place:*&in=state:*` plus `for=state:*`). Re-run periodically to
  refresh. National (US) total included for the federal tier.
- **D-03:** The bundle carries **two structures**: (a) `POP_BY_FIPS` — FIPS → population; and
  (b) a **`name+state → place-FIPS` index** so address-search city banners (which only know
  city name + state, not a FIPS) can still resolve population. Key normalization mirrors the
  existing `getBuildingImages` approach (lowercased city name + 2-letter state).

### Geo-id Resolution Across Modes (STAT-02 / STAT-03)
- **D-04:** **State tier always resolves** — state abbreviation → state FIPS → lookup. (A
  `state-abbrev → FIPS` map is the inverse of `buildingImages.js`'s existing
  `STATE_FIPS_TO_ABBREV`; add/derive the forward direction.)
- **D-05:** **City tier resolves via** the browse `geo_id` (place FIPS, present in browse-by-area
  mode) **OR** the `name+state → FIPS` index (address-search mode). Whichever is available.
- **D-06:** **Federal tier always resolves** — national population keyed to the US geo. No omit case.
- **D-07:** **Graceful omit (STAT-03):** any location that doesn't resolve to a FIPS with a
  population value renders the banner with **no stat at all** — no placeholder, no zero, no broken
  label. Mirror `SectionBanner`'s existing `imageFailed` graceful-fallback posture.

### Stat Content & Format (STAT-01)
- **D-08:** **Population only** this phase. One fact, matching the single reserved top-right slot.
  Additional stats (income, area, etc.) are a future phase.
- **D-09:** Display as an **uppercase label + full grouped number** — label line `POPULATION`,
  number line via `toLocaleString` (e.g. `652,503`). No abbreviation ("653K"), no
  natural-language suffix ("residents").
- **D-10:** **All three tiers show both lines** (label + number) — including on the shorter mobile
  banner. The label is NOT dropped on mobile (operator: "probably always want to show both
  lines"). Planner sizes the text/scrim to fit the 120px banner without colliding with the title.

### Visual Treatment
- **D-11:** Stat renders **top-right**, **right-aligned**, on a **rounded semi-transparent navy
  scrim** — same treatment family as Phase 187's icon chips
  (`background: rgba(13, 17, 23, ~0.55)` + slight `backdropFilter: blur`). Rationale: banner art
  varies widely (bright skylines, busy streetscapes, plain gradients); the scrim **guarantees
  legibility on any art** rather than relying on the gradient overlay alone.
- **D-12:** Kept **clear of the very corner** (not corner-jammed), per 187 D-07. Must never overlap
  the bottom-left title (bottom-left) or the bottom-right icon row.
- **D-13:** All color/type traces to `src/index.css` `@theme` tokens (DARK-01). Dark-mode only. No
  `!important` (first-party component). Small uppercase label token; larger number.

### Claude's Discretion
- Exact scrim padding, corner radius, opacity, blur amount, label font-size/tracking, and number
  font-size (within: legible on any art, both lines fit the 120px mobile banner, no title/icon
  overlap).
- Exact shape of the JSON bundle files and the generator script's location/structure, provided
  D-01/D-02/D-03 hold and it's regenerable.
- Whether population resolution logic lives inside `SectionBanner` or is passed in via a resolved
  `stats` prop from the parent — planner decides, keeping Phase 189's "one shared component, no
  page-specific divergence" goal in mind (mirror 187's equivalent discretion note).
- Fetch/lookup caching strategy across the 3 stacked banners in one continuous scroll (the static
  bundle is a synchronous in-memory lookup, so likely trivial).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase spec & requirements
- `.planning/ROADMAP.md` §"Phase 188: Location Stats Strip" — goal + 4 success criteria (definition
  of done); also §"Phase 189" for the downstream shared-component/parity goal this must not block.
- `.planning/REQUIREMENTS.md` — STAT-01, STAT-02, STAT-03 (the three requirements this phase owns).

### Sibling-phase context (same milestone, converges in 189)
- `.planning/phases/187-tethered-feature-icon-row/187-CONTEXT.md` — the icon-row phase.
  Critical: **D-05/D-07** (chip treatment + top-right reserved for THIS stat), and the shared
  location-identity plumbing both phases depend on.

### Existing code to extend / reuse
- `src/components/SectionBanner.jsx` — the component being extended. Inert `stats` slot at line 214
  (`{stats && <div className="sr-only" data-slot="stats" />}`); title bottom-left (lines ~194-211);
  187's `featureIcons` row bottom-right (lines ~219-235); `FeatureIconChip` scrim styling (lines
  ~89-101) is the visual precedent for D-11; `imageFailed` graceful-fallback pattern (lines 149-153)
  is the precedent for D-07.
- `src/lib/buildingImages.js` — the closest analog: resolves banner ART per location.
  `STATE_FIPS_TO_ABBREV` (lines ~66-75) + `stateAbbrevFromGeoId` (lines ~85-89) are the FIPS
  utilities to reuse/invert for D-04; `getBuildingImages(city, stateAbbrev)` (lines ~490-531) and
  its lowercased-name/state matching is the pattern the `name+state → FIPS` index (D-03) should
  mirror.
- `src/pages/Results.jsx` — the two `<SectionBanner>` call sites (~line 1950-1969, city/state/
  federal). Shows how `representingCity` / `userState` reach the banner, and `browse_geo_id` /
  `browseArea.geo_id` availability (place FIPS in browse mode, ~lines 386-388, 748, 823-835).
- `src/components/ElectionsView.jsx:577` — the second `<SectionBanner>` call site (full convergence
  is Phase 189, but the stat must work identically there).
- `src/lib/coverage.js` — browse-by-area `browseGeoId` plumbing (~lines 323-331) — where place FIPS
  originates in browse mode.

### Data / API
- US Census ACS 5-year API: `https://api.census.gov/data/2023/acs/acs5` — variable `B01003_001E`
  (total population); geographies `place`, `state`, `us`. Source for the D-02 generator script.
  (Researcher: confirm whether an API key is needed for the bulk `place:*` pull; keys are free.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SectionBanner.jsx`'s `stats` prop + `data-slot="stats"` anchor already exist — this phase makes
  it render instead of `sr-only`.
- `FeatureIconChip` scrim styling (`rgba(13,17,23,0.55)` + `blur(2px)`) — copy the treatment for the
  D-11 stat scrim so 187's icons and 188's stat read as one visual system.
- `buildingImages.js` FIPS helpers (`STATE_FIPS_TO_ABBREV`, `stateAbbrevFromGeoId`) and the
  lowercased city+state matching in `getBuildingImages` — reuse/invert; do NOT re-derive.

### Established Patterns
- SectionBanner is **dark-mode only**, full-bleed (`-mx-6 md:-mx-12`), fixed height
  `120px` (mobile) / `180px` (desktop). The stat must fit within this without pushing layout —
  both lines must fit the 120px band (D-10).
- Graceful-degradation precedent: `imageFailed` state → tier-gradient fallback. The stat's
  omit-on-miss (D-07) should feel like the same posture — absence renders cleanly.
- All styling traces to `src/index.css` `@theme` tokens; no `!important`.

### Integration Points
- New stat renders inside `SectionBanner.jsx` (top-right), replacing the inert `stats` `sr-only`
  div. Banner must know its own location identity (name + state + tier, and geo_id when present) to
  resolve population — same identity the 187 icon row needs. Reconcile how identity arrives from the
  two call sites; Phase 189 unifies both into one shared component.

</code_context>

<specifics>
## Specific Ideas

- Layout: `POPULATION` (uppercase label) over the full grouped number, right-aligned, on a rounded
  semi-transparent navy scrim, top-right, clear of the corner.
- Both lines always shown (mobile included) — operator: "probably always want to show both lines."
- Federal banner shows the US national total (e.g. `UNITED STATES` / `POPULATION` / `334,914,895`).
- Scrim exists specifically because banner art varies (bright/busy/plain) and text-on-gradient
  alone isn't reliably legible.

</specifics>

<deferred>
## Deferred Ideas

- **Second/third stats** (median household income, land area, density, etc.) — deferred; this phase
  is population-only. A future phase can extend the bundle + layout.
- **Live Census API / backend proxy** — considered and rejected for this phase (static bundle
  chosen, D-01). Could revisit if freshness ever needs to be real-time.
- **Shared-component consolidation across Results + Elections** — Phase 189.
- **Reciprocal/enhanced banner treatments on other EV apps** — out of v21.0 scope (documented in
  187 as a follow-on).

</deferred>

---

*Phase: 188-location-stats-strip*
*Context gathered: 2026-07-07*
