# Phase 170: Section Banners & Continuous Scroll (Results) - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Turn the **Results/Representatives page** into one continuous **City → State → Federal** vertical
scroll, divided by a reusable **`SectionBanner`** component (full-bleed image + dark gradient
overlay + location label + pin), and **remove the tier sort control** — preserving the
Elected/Appointed type filter and the name search. Banners are location-aware (driven by an
extended `buildingImages.js`) with a graceful fallback when no art exists. Each banner exposes a
stats data-slot and a feature-icon slot as **hidden/empty scaffolding** (structure only).
Requirements: **BANR-01, BANR-02, BANR-03, BANR-04, NAV-01**.

**NOT this phase:** producing the actual banner art / Unsplash+Wikimedia+AI sourcing pipeline
(Phase 171); Elections-page parity (Phase 172); live banner stats or feature-icon links (deferred);
any tile shape/size change (PoliticianCard preserved); any light-mode change; backend/DB.
</domain>

<decisions>
## Implementation Decisions

### Banner label & pin (BANR-01)
- **D-01:** Banner **title text per tier**, each prefixed with the coral pin:
  - City banner → `📍 {City}, {ST}` (e.g. `📍 Bloomington, IN`)
  - State banner → `📍 {State}` (e.g. `📍 Indiana`)
  - Federal banner → `📍 United States`
  Mirrors the mockup hero's `Bloomington, IN` treatment; each tier names its own jurisdiction.
- **D-02:** Each banner carries a **teal uppercase eyebrow** in the locked 169 label style
  (Manrope SemiBold 12px, uppercase, 1.2px tracking, teal `#00c8d7`): `YOUR CITY` / `YOUR STATE`
  / `FEDERAL`. The existing **small per-section eyebrow** (`LOCAL`/`STATE`/`FEDERAL` at
  `Results.jsx:1916`) is **removed** — the banner is now the single label per tier (no redundant
  double-labeling).
- **D-03:** **Pin = reuse the existing coral asset** `public/images/noun-location-7814384-FF5740.svg`
  (coral `#FF5740`), inline before the title — as in the mockup. (Coral pin against the dark banner;
  not recolored to teal.)

### Banner placement & scroll behavior (BANR-02)
- **D-04:** Banners are **scroll-through inline dividers** in normal document flow — each scrolls
  away as the user passes it and the next tier's banner appears before its sections. **Not sticky.**
- **D-05:** The legacy single swapping "building image" + its **scroll-spy** (`activeBuildingImage`
  / `IntersectionObserver` on `[data-tier]`, `Results.jsx:1232–1259`) is **retired** — superseded by
  inline per-tier banners. (Planner: remove or repurpose; `data-tier` may still be useful for other
  anchoring, planner's call.)
- **D-06:** Banner size = **compact full-bleed band**, edge-to-edge (reuse the existing
  `-mx-6 md:-mx-12` full-bleed pattern), **~180px desktop / ~120px mobile**. Reads as a divider, not
  a giant hero; image still legible. (Exact px/aspect = planner discretion within these bounds.)

### Tier coverage / School tier (BANR-02)
- **D-07:** Exactly **3 banners** — City, State, Federal. The distinct **School tier**
  (`TIER_ORDER = ['Local','School','State','Federal']` in `groupHierarchy.js:345`) is **folded under
  the City banner**: school-board sections render right after the Local sections, still beneath the
  City banner, before the State banner appears. (School = local governance; keeps the 3-banner model
  and matches 171's City/State/US art plan.)

### Location-awareness & fallback (BANR-03)
- **D-08:** Banner image + label are **location-aware**, driven by an **extended `buildingImages.js`**
  tier→image mapping (already returns `{Local, State, Federal}` per `getBuildingImages(city, state)`).
  Phase 170 wires the mapping into `SectionBanner`; **producing new art is Phase 171**.
- **D-09:** **Graceful fallback when no art** (the common case at launch — `getBuildingImages`
  returns `null` for most Local/State): render a **dark gradient band** carrying the same eyebrow +
  pin + title (no image). On-theme, never a broken image, visually consistent with the image banners
  (which carry the same dark gradient overlay). Do **not** use the existing light generic SVGs
  (`city-hall-generic.svg` / `state-capitol-generic.svg`).
- **D-10:** Fallback gradient is **subtly tier-tinted** (a different hue per City/State/Federal) to
  reinforce tier identity even without art — defined via dark-theme tokens. (Exact hues = planner
  discretion within the 169 token palette.)

### Tier-sort removal & filter reconciliation (NAV-01)
- **D-11:** **Remove the tier sort control** — the `Tier` dropdown (`TIER_OPTIONS`) in
  `FilterBar.jsx`. All tiers always render in full in one continuous scroll. The **Elected/Appointed
  `Type` dropdown and the name search are preserved**, reconciled into the banner-divided layout
  (placement relative to the Reps/Elections tabs = planner discretion).
- **D-12:** With the tier filter gone, **`selectedFilter` is effectively always `'All'`**. The
  planner must reconcile the `selectedFilter`-dependent logic woven through `Results.jsx`
  (`filteredHierarchy` tier filter ~L1197, `locationLabel` ~L1218, the `selectedFilter === 'All'`
  eyebrow conditionals ~L1890/1914, empty-state gating ~L1882, and the `activeBuildingImage`
  branch ~L1232) — simplify to the all-tiers path; don't leave dead single-tier branches.

### Stats + feature-icon slots (BANR-04)
- **D-13:** `SectionBanner` **exposes a stats data-slot and a feature-icon slot** in its component
  API, rendered as **hidden/empty scaffolding this milestone** — no live data, no links. Live stats
  (population/electoral-count) and feature-icon links (e.g. treasury-tracker) are **deferred**. Exact
  prop names/shape = planner discretion (e.g. optional `stats` / `featureIcons` props that render
  nothing when empty); the structure must simply exist for a later milestone to populate.

### Claude's Discretion
- Exact `SectionBanner` prop names/signature, file location, and internal markup.
- Exact banner px height/aspect within D-06 bounds; exact fallback gradient hues within D-10.
- How/whether `data-tier` and the retired scroll-spy are removed vs repurposed (D-05).
- FilterBar row layout after the tier dropdown is removed (D-11), and how the
  `selectedFilter` simplification is implemented (D-12).
- Whether banner labels reuse the 169 hero-title token (Manrope Bold 30px) or a slightly smaller
  size for the compact band — planner's call within the locked 169 type tokens.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase specs (this milestone)
- `.planning/REQUIREMENTS.md` — v19.0 requirements; **BANR-01..04, NAV-01** are this phase. See also
  "Existing infrastructure to reuse" (lists `buildingImages.js`, `public/images/` assets).
- `.planning/ROADMAP.md` §"Phase 170" — goal + 5 success criteria (one reusable `SectionBanner`;
  3-tier continuous scroll; tier-sort removed; location-aware + graceful fallback; stats/feature
  slots as hidden scaffolding).

### Prior phase (locked foundation — apply)
- `.planning/phases/169-dark-mode-design-system-foundation/169-CONTEXT.md` — locked dark tokens
  (`#0d1117` page / `#161b22` surface / 8%-white hairlines / `#00c8d7` teal / `#ff5740` coral),
  Inter+Manrope fonts, **eyebrow label treatment (D-06 there)**, hero title (Manrope Bold 30px),
  GitHub-dark aesthetic (no drop-shadows), card radius 14px / control radius 10px.

### Design source (Figma)
- Figma file `J9mfnUSnc2k6fUQDhw9L7h`, node `3957:563` ("Empowered Vote Style Guide" — Essentials
  dark mockup). Pull via Figma MCP `get_design_context` / `get_screenshot` / `get_variable_defs`.
- `scratchpad/figma/essentials-design.png` — downloaded mockup: shows the skyline hero with
  `YOUR LOCATION` eyebrow + `📍 Bloomington, IN` pinned title, sections scrolling beneath.

### Code to extend / modify
- `src/lib/buildingImages.js` — `getBuildingImages(city, state)` → `{Local, State, Federal}` image
  URLs (null when no art); `parseStateFromAddress`. Extend the tier→image mapping for `SectionBanner`.
- `src/pages/Results.jsx` — tier-section render (`filteredHierarchy.map` ~L1907), section eyebrow
  (~L1916, to remove), scroll-spy + `activeBuildingImage` (~L1232–1259, to retire), `buildingImageMap`
  (~L1076), `selectedFilter` logic (~L1197/1218/1882/1890), empty-state map over
  `['Local','School','State']` (~L1876).
- `src/components/FilterBar.jsx` — `TIER_OPTIONS` Tier dropdown (remove); keep `TYPE_OPTIONS` + name
  search.
- `src/lib/groupHierarchy.js` — `TIER_ORDER = ['Local','School','State','Federal']` (L345);
  `getTier()` (L21, `SCHOOL`→`School`). Confirms School is a distinct top-level tier (D-07).
- `public/images/noun-location-7814384-FF5740.svg` — coral pin asset (D-03).

### Memory / project rules (apply)
- ev-ui inline styles require `!important` on ALL dark overrides; never faint-gray-on-dark.
- Tailwind v4 auto-scans `.planning/*.md`; avoid raw Windows backslash paths in committed files
  (`@source not` hardening already in `src/index.css`).
- No ev-ui repo change needed — theme via essentials overrides only.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`getBuildingImages(city, state)`** (`buildingImages.js`) already returns per-tier image URLs and
  `null` when no art — directly feeds the `SectionBanner` image + the D-09 fallback branch.
- **Coral pin SVG** (`public/images/noun-location-7814384-FF5740.svg`) — the pin marker (D-03).
- **169 dark tokens + label/eyebrow styles** in `src/index.css` — banner eyebrow/title reuse these
  (single source of truth; no new inline color literals).
- **Full-bleed pattern** `-mx-6 md:-mx-12 px-6 md:px-12` already used on tier sections — banners
  reuse it for edge-to-edge bleed (D-06).

### Established Patterns
- Tiers **already render in continuous scroll** when `selectedFilter === 'All'` — phase 170 makes
  that the *only* mode (NAV-01) and inserts banners between groups.
- Each tier section is a `<div data-tier={tier}>` wrapping `GovernmentBodySection` /
  `SubGroupSection` (ev-ui) + `renderPoliticianCard`. Insert `SectionBanner` before the City, State,
  and Federal groups (School rolls under City — D-07).
- Dark overrides for ev-ui use `.dark .ev-<component> { … !important }` in `index.css`.

### Integration Points
- `SectionBanner` is a **new essentials component**, consumed in `Results.jsx` now and **`Elections`
  (Phase 172)** later — design the API for reuse on both pages (BANR-05 depends on it).
- `buildingImages.js` is the location→art bridge; Phase 171 fills in real art behind the same API.
</code_context>

<specifics>
## Specific Ideas

- The mockup (`scratchpad/figma/essentials-design.png`) is the north star for the banner: dark
  skyline image, dark gradient overlay, teal `YOUR LOCATION`-style eyebrow, coral `📍 Bloomington, IN`
  pinned title. Replicate that treatment per tier ("Aditi's Bloomington treatment").
- GitHub-dark aesthetic carries over from 169: depth from surface contrast + hairlines + the banner
  gradient — **no drop-shadows**.
- "One reusable `SectionBanner`" is an explicit success criterion — a single component renders all
  three tiers (and Elections later), image vs gradient-fallback driven by the same props.
</specifics>

<deferred>
## Deferred Ideas

- Actual banner **art + Unsplash/Wikimedia/AI sourcing pipeline** + documented procedure → **Phase 171**.
- **Elections page** dark treatment + same banner dividers (BANR-05/DARK-03) → **Phase 172**.
- **Live banner stats** (real population/electoral-count in the data-slot) and **feature-icon links**
  (treasury-tracker etc. in the icon-slot) → future milestone (slots are structure-only this phase).
- Banner art for the ~10 other covered states → future (graceful fallback covers them until then).
- **Roadmap defect to fix before/while planning 171:** ROADMAP.md's "Phase 171" body was
  mis-stitched — its goal says "Banner Asset Pipeline" but the criteria beneath it are Elections-parity
  (172) content + a duplicate self-referential `Depends on`. Not a 170 blocker; fix when planning 171/172.

### Reviewed Todos (not folded)
None — no pending todos matched this phase.

</deferred>

---

*Phase: 170-section-banners-continuous-scroll-results*
*Context gathered: 2026-06-24*
