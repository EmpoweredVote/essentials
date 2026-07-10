# Phase 187: Tethered Feature-Icon Row - Research

**Researched:** 2026-07-07
**Domain:** React/Vite frontend component extension + external API (Treasury) entity resolution
**Confidence:** HIGH

## Summary

This phase fills `SectionBanner.jsx`'s inert `featureIcons` scaffolding slot with a location-tethered
Treasury icon. All the pieces already exist in the codebase and were confirmed by direct inspection and
a live API probe — this is an integration/extension task, not new-technology research.

Three concrete discoveries change the shape of the plan versus what the phase brief assumed:

1. **The live `/treasury/cities` API already returns `entity_type: 'state'` (50 rows) and
   `entity_type: 'federal'` (1 row, "United States").** `findMatchingMunicipality` cannot be reused
   as-is for these tiers (it does fuzzy government-body-title matching tuned for municipalities) — a
   new, much simpler direct-match resolver is needed for state/federal (filter by `entity_type` +
   `state` + has-data), confirmed against real data below.
2. **Both `SectionBanner` call sites (`Results.jsx:1938` and `ElectionsView.jsx:577`) already receive
   identical `representingCity`/`userState` values** — `ElectionsView` is rendered *inside* `Results.jsx`
   (mutually exclusive tab with the direct banner calls, not simultaneously mounted) and is handed the
   exact same `representingCity`/`userState` props Results.jsx computed for itself. There is no
   location-derivation divergence between the two call sites to reconcile in this phase.
3. **There's a repo-wide precedent for exactly this "resolve once in Results.jsx, drill down through
   ElectionsView, render in SectionBanner" shape**: `buildingImageMap` (`{ Local, State, Federal }`,
   from `src/lib/buildingImages.js`) is computed once in `Results.jsx` and passed through both paths
   already. The new Treasury icon resolution should follow the identical shape.

**Primary recommendation:** Add a new `src/lib/featureIcons.js` module exporting a small product
registry (`[{ key: 'treasury', resolve(...) }]`, reserved order treasury→compass→readrank) and a
`findStateTreasuryEntity`/`findFederalTreasuryEntity` pair of new direct-match resolvers in
`treasury.js` (leave `findMatchingMunicipality` untouched — reuse verbatim for city tier). Resolve once
per tier in `Results.jsx` (mirroring the existing `buildingImageMap` `useMemo`), producing a
`{ Local, State, Federal }`-shaped map of resolved `{key, href, label}` icon arrays, and pass it into
`SectionBanner` as a new prop, drilled through `ElectionsView` exactly like `buildingImageMap` already
is. Build the tooltip by adapting the existing `IconWithTooltip` pattern from
`src/components/IconOverlay.jsx` (already uses `@floating-ui/react`, already installed, already
supports hover + keyboard focus + `aria-label`).

## User Constraints (from CONTEXT.md)

### Locked Decisions

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
- **D-05:** Icon row sits **bottom-right** of the banner, rendered as **circular semi-transparent chips**
  (one chip per icon). The chip treatment guarantees legibility on any banner art and handles the fact
  that `treasury-symbol.svg` ships with no dark variant.
- **D-06:** The banner title stays **bottom-left**; the icon row bottom-right keeps clear of it (satisfies
  ICON-03 "never obscures the title").
- **D-07:** Reserve the **population stat (Phase 188) for the top-right**, positioned so it is NOT jammed
  into the corner. Note this now so the two workstreams don't collide when they converge in Phase 189.
- **D-08:** Build a **minimal accessible custom tooltip** that shows on **both hover AND keyboard focus**,
  naming the product (e.g. "Treasury Tracker"). Put an `aria-label` on the link for screen readers.
  Native `title=` is insufficient because it does not appear on keyboard focus.
- **D-09:** `findMatchingMunicipality` is municipality-only (`tier === 'Local'`). The phase researcher
  must probe the live `/treasury/cities` response to discover how state General Fund and federal
  entities are shaped/named, then design a resolver that extends beyond municipalities. Do not assume
  the entity naming — confirm from the API before planning. **(Done — see Code Examples / Findings below.)**

### Claude's Discretion

- Whether resolution logic lives inside `SectionBanner` (self-contained, single-source-of-truth) or is
  passed in via a resolved `featureIcons` prop from the parent — planner decides, keeping Phase 189's
  "one shared component, no page-specific divergence" goal in mind. **Research recommendation: parent-computed
  + prop-drilled (see Architecture Patterns) — matches the existing `buildingImageMap` precedent exactly
  and avoids N redundant `/treasury/cities` fetches across stacked banner instances.**
- Treasury-cities fetch/caching strategy across the 3 stacked banners in one continuous scroll.
- Exact chip size, opacity, spacing, and icon SVG sizing (within the legibility + no-overlap constraints).

### Deferred Ideas (OUT OF SCOPE)

- **Compass & Read & Rank icons** — deferred until each product exposes a per-location deep-link contract.
  Layout reserves their slots now; wiring is a future phase (out of v21.0 scope).
- **Reciprocal icons on other apps' banners** (Treasury/Compass linking back to Essentials) — documented
  follow-on, explicitly out of v21.0 scope.
- **Population / Census stats strip** — Phase 188 (this phase only reserves its top-right position).
- **Shared-component consolidation across Results + Elections** — Phase 189.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ICON-01 | Icon row shows whenever ≥1 product has a valid per-location link | Registry pattern (Architecture Patterns); D-02 renders Treasury-only today |
| ICON-02 | Hover/keyboard-focus tooltip naming the product | `IconWithTooltip` precedent in `IconOverlay.jsx` — reuse verbatim pattern (Code Examples) |
| ICON-03 | Icons from shared symbol set, dark-legible, never obscure title | Chip treatment (D-05) mitigates `treasury-symbol.svg`'s lack of a dark variant; bottom-right placement (D-06) vs. bottom-left title |
| TETH-01 | Link carries the banner's own location, never the user's | `representingCity`/`userState` (banner's location) vs. `ev-context` broker (user's location) are already architecturally separate in this codebase — confirmed no accidental co-mingling at either call site |
| TETH-02 | Treasury link via `financials.empowered.vote/?entity=<name-state>`, resolved through `treasury.js` | Confirmed live: `entity` param + `toSlug` format verified against `treasury-tracker` frontend source (Code Examples); **domain discrepancy flagged — see Open Questions** |
| TETH-03 | Icon omitted entirely when no valid link exists — no dead/greyed icons | All resolvers documented below return `null` on no-match; registry renders `null` product's icon literally absent from array |
| TETH-04 | State/federal tiers resolve non-municipal Treasury entities | **Live API probe confirms `entity_type: 'state'` (50 rows) and `entity_type: 'federal'` (1 row) exist today** — see Code Examples for real records and the new resolver design |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Icon row rendering (chips, layout, ordering) | Browser / Client | — | Pure React component tree inside `SectionBanner.jsx`; no SSR in this Vite SPA |
| Tooltip show/hide (hover + keyboard focus) | Browser / Client | — | `@floating-ui/react` positioning + focus/hover interaction hooks run entirely client-side |
| Treasury entity resolution (name/state/entity_type matching) | Browser / Client | — | Existing pattern (`findMatchingMunicipality`) already runs client-side against a fetched array; no reason to move server-side for this phase |
| `/treasury/cities` data fetch | API / Backend | Browser / Client | Served by `accounts-api` (`treasuryService.ts` / `routes/treasury.ts`); browser fetches once and matches locally — unchanged from today |
| Deep-link navigation (opening financials.empowered.vote) | Browser / Client | CDN / Static | Standard `<a target="_blank">`; the destination app (Treasury Tracker) is a separately deployed SPA, out of this repo's scope |
| Icon SVG assets (`treasury-symbol.svg` etc.) | CDN / Static | — | Served from `public/` at a root-relative path per this repo's existing icon convention (see Don't Hand-Roll) |

## Standard Stack

### Core

No new libraries required. This phase reuses:

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@floating-ui/react` | ^0.27.19 (already in `package.json`) | Tooltip positioning + hover/focus interaction hooks | Already used for an identical accessible-tooltip pattern in `src/components/IconOverlay.jsx` — no new dependency, no new pattern to learn |
| React | ^19.1.1 (already in `package.json`) | Component tree | Existing app framework |
| Vite | ^7.1.2 (already in `package.json`) | Bundler / static asset serving | Existing app framework |

### Supporting

None. `src/lib/treasury.js` (existing, in-repo) is extended with two new pure functions
(`findStateTreasuryEntity`, `findFederalTreasuryEntity`) — not a new package.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom `IconWithTooltip` adaptation | A tooltip npm package (e.g. `@radix-ui/react-tooltip`) | Unnecessary — `@floating-ui/react` is already installed and an accessible, hover+focus tooltip pattern already exists verbatim in this repo (`IconOverlay.jsx`). Adding a second tooltip library would be pure duplication. |
| Native `title=` attribute | — | Explicitly rejected by CONTEXT D-08 (no keyboard-focus display) — do not use. |

**Installation:** None — no new packages.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero new npm packages. It reuses `@floating-ui/react`
(already a `package.json` dependency, already in use elsewhere in this codebase) and copies static SVG
assets from a sibling local repo (`C:/ev-landing/ev-landing-main/icons/`) into this repo's `public/`
directory — not an npm install, and not a supply-chain risk in the sense this gate targets.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Browser (Results.jsx page load)                                         │
│                                                                           │
│  1. Results.jsx mounts                                                  │
│     └─ useEffect: fetchTreasuryCities() ──────────────► accounts-api    │
│                                                            GET /treasury/│
│                                                            cities         │
│                                                            (already exists)│
│     └─ treasuryCities state populated (2,430 entities:                  │
│        city/town/municipality/township/county/state/federal/nonprofit)  │
│                                                                           │
│  2. useMemo: resolveFeatureIcons({ representingCity, userState,         │
│               treasuryCities }) → { Local: [...], State: [...],         │
│               Federal: [...] }                                          │
│        │                                                                 │
│        ├─ Local:   findMatchingMunicipality(representingCity,           │
│        │           treasuryCities, userState)   [REUSED VERBATIM]       │
│        ├─ State:   findStateTreasuryEntity(userState, treasuryCities)   │
│        │           [NEW — filters entity_type === 'state']              │
│        └─ Federal: findFederalTreasuryEntity(treasuryCities)            │
│                    [NEW — filters entity_type === 'federal']             │
│                                                                           │
│  3. featureIconMap passed as prop to:                                   │
│        a) <SectionBanner tier="city"    featureIcons={featureIconMap    │
│              .Local} .../>              (Results.jsx:1938, direct)      │
│        b) <SectionBanner tier="state"   featureIcons={featureIconMap    │
│              .State} .../>                                              │
│        c) <SectionBanner tier="federal" featureIcons={featureIconMap    │
│              .Federal} .../>                                            │
│        d) <ElectionsView featureIconMap={featureIconMap} ... />         │
│              └─ ElectionsView's OWN 3 <SectionBanner> calls read        │
│                 featureIconMap.Local/.State/.Federal identically        │
│                 (mirrors how buildingImageMap already flows today)      │
│                                                                           │
│  4. SectionBanner renders: for each icon in featureIcons (already       │
│     resolved to {key, href, label}), render a circular chip with        │
│     <IconWithTooltip>-style hover/focus tooltip. Empty array → no       │
│     chips rendered (TETH-03 / SBAN-04 graceful degradation).            │
│                                                                           │
│  5. User clicks/keyboard-activates a chip → <a target="_blank"          │
│     href="https://financials.empowered.vote/?entity=<slug>">           │
│     opens Treasury Tracker, which independently re-fetches its own      │
│     municipality list and matches ?entity= via its own toSlug()         │
│     (confirmed identical slug algorithm — see Code Examples)            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
src/
├── lib/
│   ├── treasury.js          # EXTEND: add findStateTreasuryEntity, findFederalTreasuryEntity
│   │                         #   (keep findMatchingMunicipality untouched — reused verbatim)
│   └── featureIcons.js      # NEW: product registry + resolveFeatureIcons({representingCity,
│                             #   userState, treasuryCities}) → {Local, State, Federal}
├── components/
│   ├── SectionBanner.jsx    # EXTEND: render featureIcons prop as bottom-right chip row
│   └── IconOverlay.jsx      # REFERENCE ONLY (do not import cross-component; the
│                             #   IconWithTooltip pattern should be re-implemented or
│                             #   extracted to a shared component — see Open Questions)
public/
└── treasury-symbol.svg      # NEW: copied from C:/ev-landing/ev-landing-main/icons/
                             #   (compass/readrank symbols NOT copied yet — no contract to use them)
```

### Pattern 1: Parent-resolved, prop-drilled tier data (existing precedent)

**What:** A per-tier resolved value (`{ Local, State, Federal }`) is computed once in `Results.jsx` via
`useMemo`, then passed directly to `Results.jsx`'s own 3 `<SectionBanner>` calls AND drilled through
`ElectionsView` as a single prop, which `ElectionsView` then passes to its own 3 `<SectionBanner>` calls.

**When to use:** Any per-tier derived data that both call sites need identically — exactly the
`buildingImageMap` shape, which is the closest live precedent in this codebase.

**Example (existing precedent, `src/lib/buildingImages.js:490` + `Results.jsx:1133-1134,1940-1954,2066`):**
```javascript
// src/lib/buildingImages.js:490
/**
 * Get building images for each tier.
 * @returns {{ Local: string, State: string, Federal: string }}
 */
export function getBuildingImages(representingCity, stateAbbrev) { /* ... */ }

// Results.jsx
const buildingImageMap = useMemo(
  () => getBuildingImages(representingCity, userState),
  [representingCity, userState]
);
// ... direct call:
<SectionBanner tier="city" locationName={...} imageUrl={buildingImageMap.Local} />
// ... drilled call:
<ElectionsView buildingImageMap={buildingImageMap} representingCity={representingCity} userState={userState} ... />
```
The new `featureIconMap` should be computed and threaded the same way, adding a `featureIcons` prop to
each `<SectionBanner>` call and a `featureIconMap` prop to `<ElectionsView>` (`ElectionsView` already
declares `representingCity`/`userState` as its own props at lines 286-287, so no new location-derivation
plumbing is needed there — only a new prop to receive the resolved map).

### Pattern 2: Accessible hover+focus tooltip (existing precedent)

**What:** A `<span>` reference element with `tabIndex={0}` + `aria-label`, floated tooltip content shown
via `@floating-ui/react`'s `useHover` + `useFocus` + `useDismiss` + `useRole('tooltip')` interaction
hooks, rendered through a `FloatingPortal`.

**When to use:** Directly satisfies D-08 — this is the exact pattern needed, already proven in this
codebase.

**Example (from `src/components/IconOverlay.jsx:22-81`, verified in repo):**
```jsx
function IconWithTooltip({ IconComponent, color, tooltip, size = 14, extraProps = {}, onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 4 })],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <>
      <span ref={refs.setReference} aria-label={tooltip} tabIndex={0} {...getReferenceProps()}>
        <IconComponent size={size} color={color} {...extraProps} />
      </span>
      {isOpen && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={{ ...floatingStyles, /* ...tooltip chrome */ }} {...getFloatingProps()}>
            {tooltip}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
```
For the banner icon row, wrap this same interaction pattern around an `<a href=... target="_blank">`
(clickable link, not a bare span) so the chip is both keyboard-activatable AND shows its tooltip on
focus, per D-08 + TETH-01.

### Pattern 3: Product registry with per-location resolvers (D-01)

**What:** A fixed-order array where each entry declares a `resolve(ctx)` function returning
`{ key, href, label } | null`. The rendering component filters to non-null results and renders them
left-aligned, in registry order.

**Example (new — recommended shape for `src/lib/featureIcons.js`):**
```javascript
export const PRODUCT_REGISTRY = [
  {
    key: 'treasury',
    label: 'Treasury Tracker',
    iconSrc: '/treasury-symbol.svg',
    resolve: ({ tier, representingCity, userState, treasuryCities }) => {
      let entity = null;
      if (tier === 'city')    entity = findMatchingMunicipality(representingCity, treasuryCities, userState);
      if (tier === 'state')   entity = findStateTreasuryEntity(userState, treasuryCities);
      if (tier === 'federal') entity = findFederalTreasuryEntity(treasuryCities);
      if (!entity) return null;
      return { key: 'treasury', href: `${TREASURY_URL}/?entity=${toTreasurySlug(entity)}`, label: 'Treasury Tracker' };
    },
  },
  // Reserved, NOT rendered (no per-location contract yet — D-02):
  // { key: 'compass', label: 'Compass', resolve: () => null },
  // { key: 'readrank', label: 'Read & Rank', resolve: () => null },
];
```
Reserving the array slots (even as commented-out or explicitly `resolve: () => null`) satisfies D-03
("zero layout change" when Compass/ReadRank later gain contracts) without rendering anything for them now.

### Anti-Patterns to Avoid

- **Reusing `findMatchingMunicipality` for state/federal tiers:** Its fuzzy body-title-prefix matching
  and `ENTITY_TYPE_WORDS` rejection list (`township`, `county`, `village`, `borough`, `town`, `parish`)
  are tuned for local government body names like `"Bloomington Common Council"`. It has no concept of
  `entity_type === 'state'` or `'federal'` and was never designed to disambiguate a state's plain name
  from a same-named city. Write a new, much simpler direct-match function instead (see Code Examples).
- **Inventing a different slug format for state/federal entities:** The live Treasury Tracker frontend
  (`C:/treasury-tracker/src/App.tsx:51-52`) uses the exact same `toSlug()` for every `entity_type` —
  `${name}-${state}` lowercase, dash-joined. `toTreasurySlug()` in this repo already matches that
  algorithm byte-for-byte. Do not special-case state/federal slugs.
- **Fetching `/treasury/cities` inside `SectionBanner` itself without caching:** If resolution logic
  moves inside `SectionBanner` (Claude's Discretion), each of the (at most 3, since Results/Elections
  tabs are mutually exclusive — see Summary point 2) mounted `SectionBanner` instances would re-fetch the
  full 2,430-row, ~6MB `/treasury/cities` payload independently unless a shared fetch/cache mechanism is
  added. The parent-resolved approach (Pattern 1) sidesteps this by fetching once, as `Results.jsx`
  already does today for the existing per-body Treasury link.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Accessible tooltip (hover + keyboard focus) | A custom `onMouseEnter`/`onFocus` positioning implementation from scratch | `@floating-ui/react`'s `useHover`+`useFocus`+`useDismiss`+`useRole` + the existing `IconWithTooltip` pattern in `IconOverlay.jsx` | Already installed, already proven accessible (correct `role="tooltip"`, `aria-label`, portal-rendered so it never gets clipped by the banner's `overflow-hidden`), already handles dismiss-on-Escape |
| City→Treasury-entity slug generation | A bespoke slugify function per tier | `toTreasurySlug()` (existing, `src/lib/treasury.js:28-37`) | Verified byte-for-byte identical to the Treasury Tracker frontend's own `toSlug()` (`C:/treasury-tracker/src/App.tsx:51-52`) — using anything else risks a subtly wrong slug that silently falls back to the wrong entity on the Treasury Tracker side (`matched ?? list.find(Bloomington IN) ?? list[0]`, `App.tsx:230`) |
| Municipality name/state disambiguation | Re-deriving fuzzy body-title matching for city tier | `findMatchingMunicipality()` (existing, unchanged) | Already has state disambiguation + same-state-only matching + entity-type-word rejection, regression-tested (`src/lib/treasury.test.js`) |

**Key insight:** Every primitive this phase needs (tooltip, slug, city matcher, prop-drilling shape) has
a working precedent already living in this repository. The only genuinely new code is the two small
direct-match resolver functions for state/federal tiers and the chip-rendering UI inside `SectionBanner`.

## Common Pitfalls

### Pitfall 1: Treasury domain mismatch (`financials.empowered.vote` vs `treasurytracker.empowered.vote`)
**What goes wrong:** The existing per-body Treasury link in `Results.jsx` uses
`TREASURY_URL = import.meta.env.VITE_TREASURY_URL || 'https://treasurytracker.empowered.vote'`
(confirmed default in `.env.example`), but CONTEXT.md/ROADMAP.md/REQUIREMENTS.md all specify the
contract as `https://financials.empowered.vote/?entity=...`. Building the new banner icon against
whichever constant happens to be copy-pasted first could produce a domain inconsistency between the
existing text link and the new icon link.
**Why it happens:** Two custom domains point at the same deployed Treasury Tracker SPA (confirmed live —
both return `<title>Treasury Tracker</title>`), and `isFinancialsHost` in the Treasury Tracker's own
`App.tsx` only changes behavior for users who land with **no** `?entity=` param (guest/auth routing
default). Since both this existing link and the new icon always pass an explicit `?entity=`, the
`isFinancialsHost` branch never fires either way — functionally the domains are interchangeable for this
use case, but it's still worth using ONE consistent domain going forward.
**How to avoid:** Flagged as an Open Question below — the planner should decide whether to (a) hardcode
`financials.empowered.vote` per the locked CONTEXT decision, or (b) centralize `TREASURY_URL` as an
export from `treasury.js` and reuse it for both the existing text link and the new icon (requires either
updating `.env.example`'s default or accepting the existing default stays `treasurytracker...`).
**Warning signs:** A manual click-test where the icon link and the "Explore {city} revenue" text link
resolve to visually different domains in the browser address bar.

### Pitfall 2: `findMatchingMunicipality`'s `ENTITY_TYPE_WORDS` rejection has no `state`/`federal` entries
**What goes wrong:** If a planner tries to extend `findMatchingMunicipality` in-place (e.g. adding
`'state'`/`'federal'` handling as extra branches) rather than writing a separate resolver, the function's
prefix-matching logic (`base.startsWith(cityName + ' ')`) and `ENTITY_TYPE_WORDS` rejection list are
built around government-body-title strings, not plain location names — this risks subtle regressions in
the well-tested city-tier path (`src/lib/treasury.test.js`).
**Why it happens:** `entity_type` in the live data is genuinely varied even for ordinary cities — e.g.
Plano, TX is `entity_type: "municipality"` not `"city"` (confirmed via live probe) — so `entity_type`
was intentionally left out of the existing city matcher. State/federal need `entity_type` as the
*primary* filter (name matching alone is not selective enough to be safe — e.g. a real place could share
a plain-language name), which is a fundamentally different algorithm shape.
**How to avoid:** Write `findStateTreasuryEntity(state, cities)` and `findFederalTreasuryEntity(cities)`
as new, small, separate functions filtered by `c.entity_type === 'state' && c.state === state` (respectively
`'federal'`) plus the same has-data check (`available_datasets.length > 0`). Do not touch
`findMatchingMunicipality`.
**Warning signs:** Existing `treasury.test.js` assertions failing after a state/federal extension lands.

### Pitfall 3: `treasury-symbol.svg` has hardcoded brand colors, not a transparent/monochrome mark
**What goes wrong:** Assuming `treasury-symbol.svg` behaves like `essentials-symbol-{light,dark}.svg`
(a themeable monochrome mark) and placing it directly on the banner art without the chip wrapper — on
some banner photos the icon's own colors (`#00657C` teal fill, `#FFD426` yellow accent — confirmed by
reading the file) will be illegible or clash.
**Why it happens:** Treasury Tracker's brand mark was never designed with a light/dark variant (confirmed:
only one file exists at `C:/ev-landing/ev-landing-main/icons/treasury-symbol.svg`, unlike Compass/ReadRank/
Essentials which each ship `-light`/`-dark` pairs).
**How to avoid:** This is exactly why CONTEXT locked D-05 (circular semi-transparent chip behind every
icon, not just Treasury) — implement the chip as a universal wrapper so all future product icons get the
same legibility guarantee regardless of their own color/variant situation.
**Warning signs:** Icon disappears or looks muddy against a light-toned banner photo in visual QA.

### Pitfall 4: Icon assets must be copied into `public/`, not imported via a JS `import` path
**What goes wrong:** Attempting `import treasuryIcon from '../../../ev-landing/ev-landing-main/icons/treasury-symbol.svg'`
(a cross-repo relative import) — this reaches outside the Vite project root and outside this git repo
entirely; it will not resolve in a production build (and pollutes the essentials repo's dependency graph
with an external, unversioned filesystem path).
**Why it happens:** `C:/ev-landing/ev-landing-main/` is a sibling local checkout used purely as an asset
source-of-truth for icon exports, not a package this repo depends on.
**How to avoid:** Follow the established convention confirmed in `src/components/Layout.jsx:67`
(`logoSrc="/essentials-logo-dark.svg"`) and the existing `public/` directory contents — copy the needed
SVG file(s) into this repo's `public/` folder and reference them by root-relative path (e.g.
`/treasury-symbol.svg`).
**Warning signs:** Build succeeds locally (dev server can sometimes resolve absolute filesystem paths)
but the icon 404s in the deployed build.

### Pitfall 5: No jsdom/testing-library in this repo — tooltip behavior isn't unit-testable here
**What goes wrong:** Planning a Wave 0 task like "write a React Testing Library test asserting the
tooltip appears on focus" will stall — this repo has no `jsdom` or `@testing-library/*` dependency, and
the one existing `SectionBanner.test.js` explicitly documents itself as "pure-logic only (no jsdom, no
React render)."
**Why it happens:** The project's established test convention (mirrored across `groupHierarchy.test.js`,
`treasury.test.js`, `SectionBanner.test.js`) is Vitest pure-function tests only; no component-rendering
test harness has been set up.
**How to avoid:** Automated tests should target the new pure-logic resolver functions
(`findStateTreasuryEntity`, `findFederalTreasuryEntity`, registry filtering) exactly like
`treasury.test.js` does today. Tooltip hover/keyboard-focus behavior and chip visual legibility need a
manual/visual verification step (`checkpoint:human-verify` or the roadmap's "UI hint: yes" treatment),
not an automated jsdom test.

## Code Examples

### Live `/treasury/cities` API — confirmed entity shapes (probed 2026-07-07)

Probed directly: `curl https://accounts-api.empowered.vote/api/treasury/cities` → HTTP 200, 2,430 total
entities. `entity_type` distribution:

```
{ town: 34, city: 1993, county: 333, state: 50, municipality: 15, township: 3, nonprofit: 1, federal: 1 }
```

**State entity (Texas) — real record:**
```json
{
  "id": "dc93d846-ef3e-4a41-b58f-06be2d1ab40a",
  "name": "Texas",
  "state": "TX",
  "entity_type": "state",
  "population": 29145505,
  "population_year": 2024,
  "county_id": null,
  "available_datasets": [
    { "fiscal_year": 2024, "dataset_type": "revenue", "period_label": null },
    { "fiscal_year": 2024, "dataset_type": "operating", "period_label": null }
    /* ...20 entries total, FY2015-2024 */
  ]
}
```
`toTreasurySlug({ name: 'Texas', state: 'TX' })` → `"texas-tx"` — matches the CONTEXT-specified contract exactly.

**Federal entity — real record (only 1 exists):**
```json
{
  "id": "0098c405-65e1-426f-8e5f-0fcbe2a900c0",
  "name": "United States",
  "state": "US",
  "entity_type": "federal",
  "population": 340110988,
  "population_year": 2024,
  "county_id": null,
  "available_datasets": [ /* 300+ entries, FY1976-2025, includes a 'federal_agency' dataset_type */ ]
}
```
`toTreasurySlug({ name: 'United States', state: 'US' })` → `"united-states-us"`.

**City entity (Plano, TX) — for reference, note `entity_type` is NOT always `"city"`:**
```json
{ "name": "Plano", "state": "TX", "entity_type": "municipality", "population": 293286, "available_datasets": [/* 19 entries */] }
```
This confirms `findMatchingMunicipality` correctly ignores `entity_type` for city-tier matching (it
only checks `available_datasets.length > 0` + name/state + the `ENTITY_TYPE_WORDS` suffix-rejection) —
no change needed there.

### New resolver design (state/federal) — recommended implementation shape

```javascript
// src/lib/treasury.js — ADD (do not modify findMatchingMunicipality)

/**
 * Finds the state-tier Treasury entity for a 2-letter state abbreviation.
 * Unlike findMatchingMunicipality, this is a direct entity_type + state match —
 * state Treasury entities are singular per state and have unambiguous plain names.
 * @param {string} state - 2-letter abbrev, e.g. "TX"
 * @param {Array} cities - from fetchTreasuryCities()
 * @returns {object|null}
 */
export function findStateTreasuryEntity(state, cities) {
  if (!state || !Array.isArray(cities)) return null;
  const wantState = state.toUpperCase();
  return cities.find(
    (c) => c.entity_type === 'state' && (c.state || '').toUpperCase() === wantState
        && Array.isArray(c.available_datasets) && c.available_datasets.length > 0
  ) || null;
}

/**
 * Finds the (currently singular) federal Treasury entity.
 * @param {Array} cities - from fetchTreasuryCities()
 * @returns {object|null}
 */
export function findFederalTreasuryEntity(cities) {
  if (!Array.isArray(cities)) return null;
  return cities.find(
    (c) => c.entity_type === 'federal'
        && Array.isArray(c.available_datasets) && c.available_datasets.length > 0
  ) || null;
}
```

### Treasury Tracker's own slug function (confirmed identical algorithm)

```typescript
// C:/treasury-tracker/src/App.tsx:50-53 (verified live source, confirms contract)
function toSlug(m: Municipality): string {
  return `${m.name.toLowerCase().replace(/\s+/g, '-')}-${m.state.toLowerCase()}`;
}
// ...App.tsx:220-230 — entity param resolution on load:
const entityParam = params.get('entity') ?? (isFinancialsHost ? 'empowered-vote-ca' : null);
if (entityParam) {
  listMunicipalities().then(list => {
    const matched = list.find(m => toSlug(m) === entityParam);
    const entity = matched ?? list.find(m => m.name === 'Bloomington' && m.state === 'IN') ?? list[0];
    // ...
  });
}
```
**Important:** if the slug doesn't match any entity, Treasury Tracker silently falls back to Bloomington,
IN (not an error state) — this makes slug-format correctness load-bearing; a wrong slug produces a
*wrong-but-successful-looking* deep link, not a visible failure. `toTreasurySlug()` in this repo already
produces byte-identical slugs, so reuse it verbatim for all three tiers.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `financials.empowered.vote` and `treasurytracker.empowered.vote` are the same deployed app and functionally interchangeable for explicit-`?entity=` links | Common Pitfalls #1 | Low — confirmed via live HTTP probe (`<title>Treasury Tracker</title>` on both) and by reading `App.tsx`'s `isFinancialsHost` branch, which only affects no-`?entity=`-param behavior. If a future Treasury Tracker deploy diverges the two domains' entity lists, this could regress silently. |
| A2 | Population count of exactly 50 `entity_type: 'state'` rows means every US state has a General Fund entity (not 51 for all states+DC, or fewer for states with no data yet) | Code Examples | Low-Medium — not independently verified per-state; a specific state's banner could still resolve `null` if that state's row is missing from the true 50 (this is exactly what TETH-03's "omit if no valid link" behavior is designed to handle gracefully, so the risk is cosmetic, not a rendering bug) |
| A3 | `treasury-symbol.svg`'s fixed brand colors (`#00657C`/`#FFD426`) are illegible enough against *some* banner art to justify the universal chip treatment, not just against dark banners | Common Pitfalls #3 | Low — this is the CONTEXT-locked rationale (D-05) already; the code inspection confirms the *premise* (no dark variant exists) is factually true, the legibility judgment itself is a design call already made by the user |

**If this table is empty:** N/A — see rows above. All three are low-risk with mitigations already
identified; none block planning.

## Open Questions (RESOLVED)

> All three resolved during planning (2026-07-07). Q1 → 187-01 ("Open question resolved: Treasury domain");
> Q2 → 187-02 ("Architecture (Claude's Discretion)"); Q3 → 187-02 Task 1 action. Inline `RESOLVED:` markers below.

1. **RESOLVED:** **Treasury domain: hardcode `financials.empowered.vote`, or centralize+reuse the existing `TREASURY_URL` constant?** → Centralize a single exported `TREASURY_URL` in `treasury.js` set to `financials.empowered.vote`, consumed by both the new icon and the existing per-body text link (per 187-01).
   - What we know: CONTEXT/REQUIREMENTS/ROADMAP all specify `financials.empowered.vote` as the contract.
     The existing per-body text link in `Results.jsx` uses a `TREASURY_URL` const defaulting to
     `treasurytracker.empowered.vote` (from `.env.example`). Both domains serve the identical app and
     behave identically for explicit `?entity=` links.
   - What's unclear: Whether the discrepancy is intentional (CONTEXT wants the *new* icon on the
     newer/canonical domain while the old text link stays as-is) or an oversight that should be
     reconciled (both links should point at the same domain).
   - Recommendation: Planner should ask this in `/gsd:discuss-phase` follow-up or default to
     centralizing a single exported `TREASURY_URL` constant in `treasury.js` used by both the existing
     text link and the new icon, updated to `financials.empowered.vote` per the locked contract — this
     also fixes the inconsistency for free.

2. **RESOLVED:** **Self-contained resolution inside `SectionBanner` vs. parent-resolved + prop-drilled (Claude's Discretion, D-flagged in CONTEXT)?** → Parent-resolved + prop-drilled `featureIconMap` (mirrors `buildingImageMap`), per 187-02.
   - What we know: The parent-resolved approach has a direct, working precedent (`buildingImageMap`)
     and avoids redundant `/treasury/cities` fetches. The self-contained approach keeps `SectionBanner`
     fully independent (arguably cleaner for Phase 189's "one shared component" goal, since resolution
     wouldn't depend on the calling page computing anything).
   - What's unclear: Whether Phase 189's consolidation work will find it easier to unify two pages that
     both already pass a resolved prop (current recommendation) vs. two pages that both already just
     pass `representingCity`/`userState` raw and let `SectionBanner` do the work internally.
   - Recommendation: This research recommends parent-resolved (matches the strongest existing precedent
     and avoids fetch duplication), but this is explicitly left as Claude's Discretion per CONTEXT — the
     planner should pick one and note the choice for Phase 189 to build on, not re-litigate it there.

3. **RESOLVED:** **Should the `IconWithTooltip` implementation be extracted into a shared component, or reimplemented locally in `SectionBanner.jsx`?** → Reimplement the `@floating-ui` hover+focus pattern locally in `SectionBanner`; shared-component extraction deferred (per 187-02 Task 1).
   - What we know: The exact hover+focus+aria-label tooltip pattern already exists in
     `src/components/IconOverlay.jsx` but is not currently exported for reuse (it's a private helper
     function inside that file).
   - What's unclear: Whether extracting it to a shared `src/components/AccessibleTooltip.jsx` (or
     similar) is in-scope for this phase, or whether duplicating ~35 lines locally in `SectionBanner.jsx`
     is acceptable for now (with extraction deferred).
   - Recommendation: Given this phase is frontend-only and small, either is fine; extraction is the
     cleaner long-term choice (both `IconOverlay` and `SectionBanner` would consume one implementation)
     but is not required to satisfy any locked decision or requirement — leave as an implementation
     detail for the planner/executor.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `accounts-api` `/treasury/cities` endpoint | TETH-02, TETH-04 (data source) | ✓ (probed live, HTTP 200, 2,430 rows) | — | — |
| `financials.empowered.vote` (Treasury Tracker SPA) | TETH-01, TETH-02 (deep-link destination) | ✓ (probed live, HTTP 200) | — | — |
| `treasurytracker.empowered.vote` (legacy/alt domain, same app) | Existing text-link default | ✓ (probed live, HTTP 200) | — | — |
| `@floating-ui/react` | ICON-02 tooltip | ✓ (already in `package.json`, `^0.27.19`) | 0.27.19 | — |
| `C:/ev-landing/ev-landing-main/icons/treasury-symbol.svg` | ICON-03 icon asset | ✓ (confirmed present, 4,062 bytes) | — | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — everything needed is already present and reachable.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (`vitest run`, per `package.json` `"test"` script) |
| Config file | None dedicated — Vitest runs via Vite's own config; no `jsdom`/`@testing-library` present in this repo |
| Quick run command | `npx vitest run src/lib/treasury.test.js` |
| Full suite command | `npm test` (runs `vitest run` across the whole repo) |

**Constraint confirmed by inspection:** This repo's test convention is pure-logic Vitest tests only —
`SectionBanner.test.js` explicitly documents "no jsdom, no React render." Component rendering, tooltip
hover/focus behavior, and chip visual legibility are **not** automatable in this repo's current test
harness and must be verified manually (roadmap already marks this phase "UI hint: yes").

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TETH-02 | `findStateTreasuryEntity('TX', cities)` returns the Texas state entity; wrong state returns null | unit | `npx vitest run src/lib/treasury.test.js` | ❌ Wave 0 — add cases to existing file |
| TETH-04 | `findFederalTreasuryEntity(cities)` returns the "United States" federal entity; empty/missing list returns null | unit | `npx vitest run src/lib/treasury.test.js` | ❌ Wave 0 — add cases to existing file |
| TETH-03 | A city/state/federal with no matching entity (or `available_datasets: []`) produces `null` (registry omits the icon) | unit | `npx vitest run src/lib/featureIcons.test.js` | ❌ Wave 0 — new file |
| TETH-02 | Slug format for a real record matches `<name>-<state>` lowercase-dash exactly (regression against Treasury Tracker's own `toSlug`) | unit | `npx vitest run src/lib/treasury.test.js` | ✅ pattern exists (`toTreasurySlug` tests) — extend |
| ICON-01/02/03 | Chip renders only for resolved icons; tooltip shows on hover/keyboard-focus; positioned bottom-right without overlapping title | manual | N/A — visual QA / `checkpoint:human-verify` | N/A (no component-render harness in this repo) |
| TETH-01 | Clicking a banner whose location ≠ the user's own location opens a link carrying the banner's location | manual | N/A — visual QA against two known-different locations | N/A |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`, plus a manual visual-QA pass (tooltip
  hover/focus, chip placement, cross-tier click-through) since this repo has no component-render test
  harness.

### Wave 0 Gaps

- [ ] `src/lib/featureIcons.test.js` — new file, covers TETH-03 (registry omits unresolved products) and
      the registry ordering (D-01/D-03)
- [ ] Extend `src/lib/treasury.test.js` — add `findStateTreasuryEntity`/`findFederalTreasuryEntity` cases
      using the real Texas/United States records captured in Code Examples above (or a minimal synthetic
      slice mirroring their shape, matching this file's existing convention)
- [ ] No framework install needed — Vitest already configured and running

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | This phase adds no auth surface — deep links are public, unauthenticated destinations |
| V3 Session Management | No | N/A |
| V4 Access Control | No | N/A |
| V5 Input Validation | Yes | URL-encode the resolved slug when building the `href` (`encodeURIComponent` around the slug segment, or rely on the URL/URLSearchParams API rather than raw template-string concatenation) so a city/state name containing unexpected characters can never break out of the `?entity=` query value |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Reflected query-string injection via a malformed/attacker-influenced location name flowing into the `href` | Tampering | `toTreasurySlug()` already strips `/`, `?`, `#` characters (documented as a "T-122-02 mitigation" in the existing source) — reuse it verbatim rather than hand-building the slug, and prefer `URLSearchParams`/`encodeURIComponent` over raw string interpolation when assembling the final `href` |
| Open-redirect-style confusion between banner location and user location (TETH-01's core concern) | Spoofing | Architectural separation already exists in this codebase: `representingCity`/`userState` (banner's own location, derived from the politician/address data being displayed) are structurally distinct variables from any `ev-context` broker/saved-location state — this phase must continue sourcing the icon's location exclusively from the former, never the latter |

## Sources

### Primary (HIGH confidence)
- Live API probe: `curl https://accounts-api.empowered.vote/api/treasury/cities` (2026-07-07) — 2,430
  entities, confirmed `entity_type` distribution and real Texas/United States/Plano records
- `C:\Transparent Motivations\essentials\src\components\SectionBanner.jsx` — full file read
- `C:\Transparent Motivations\essentials\src\lib\treasury.js` — full file read
- `C:\Transparent Motivations\essentials\src\pages\Results.jsx` (lines 1072-1105, 1900-2072) — full read
- `C:\Transparent Motivations\essentials\src\components\ElectionsView.jsx` (lines 277-300, 540-620) — full read
- `C:\Transparent Motivations\essentials\src\components\IconOverlay.jsx` — full file read
- `C:\Transparent Motivations\essentials\src\lib\buildingImages.js` (lines 470-510) — precedent pattern
- `C:/treasury-tracker/src/App.tsx` (lines 40-260) — live sibling-repo source, confirmed `toSlug`/`entity` param contract
- `C:/EV-Accounts/backend/src/lib/treasuryService.ts` — full file read, confirms `entity_type` field + has-data query shape server-side
- `C:/EV-Accounts/backend/test/treasury-3level.test.ts` — confirms Sacramento/Plano/Allen TX as known 2-level test fixtures
- `C:\Transparent Motivations\essentials\.planning\phases\187-tethered-feature-icon-row\187-CONTEXT.md`
- `C:\Transparent Motivations\essentials\.planning\REQUIREMENTS.md`, `.planning\ROADMAP.md`

### Secondary (MEDIUM confidence)
- `C:\Transparent Motivations\essentials\src\lib\treasury.test.js` — existing regression test conventions
- `C:\Transparent Motivations\essentials\src\components\SectionBanner.test.js` — existing test-harness constraints (no jsdom)
- `C:/ev-landing/ev-landing-main/icons/` directory listing + `treasury-symbol.svg` content read

### Tertiary (LOW confidence)
- None — all findings in this research were verified directly against live code/API, not inferred from training data.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing ones confirmed present in `package.json`
- Architecture: HIGH — precedent pattern (`buildingImageMap`) confirmed by direct code read at both call sites
- Treasury entity resolution (TETH-04): HIGH — confirmed via live API probe with real records, not assumed
- Pitfalls: HIGH — each pitfall is grounded in a specific, quoted code excerpt or live HTTP probe result

**Research date:** 2026-07-07
**Valid until:** 2026-08-06 (30 days — stable, frontend-only phase; re-verify the live `/treasury/cities`
entity counts if significantly more time passes, as Treasury Tracker's dataset grows continuously)
