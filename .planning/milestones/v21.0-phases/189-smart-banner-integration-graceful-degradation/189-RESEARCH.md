# Phase 189: Smart-Banner Integration & Graceful Degradation - Research

**Researched:** 2026-07-08
**Domain:** React (Vite/no-router-lazy-loading SPA) — consolidating two already-shipped presentational
enhancements (Phase 187 icon row, Phase 188 population stat) into one prop-assembly abstraction, plus a
CSS repositioning change and a bundle-size feasibility assessment.
**Confidence:** HIGH — every claim below is grounded in reading the actual shipped code (`SectionBanner.jsx`,
`Results.jsx`, `ElectionsView.jsx`, `population.js`, `featureIcons.js`) and one real `vite build` run in
this repo, not training-data assumptions about the stack.

## Summary

Phases 187 and 188 already did the hard work: `SectionBanner.jsx` is the single presentational component,
`Results.jsx` already resolves all three enhancement maps (`buildingImageMap`, `featureIconMap`,
`populationMap`) once via `useMemo`, and `ElectionsView.jsx` is already a pure pass-through with no
router access. What remains for 189 is genuinely small: (1) a pure `buildBannerProps(tier, ctx)` helper
that replaces the 6 hand-assembled `<SectionBanner .../>` call sites (3 in `Results.jsx`, 3 in
`ElectionsView.jsx`) with uniform one-liners — this includes folding in the currently-duplicated
`locationName` construction logic, not just the three prop maps explicitly named in D-01; (2) a
CSS-only repositioning of the existing stat scrim from top-right to responsive mid-left inside
`SectionBanner.jsx`, with no prop-contract change; (3) a documented D-03 decision. On D-03: **defer**.
A real `npx vite build` in this repo shows the entire app ships as **one 2,519.41 kB (820.22 kB gzip)
JS chunk** — there is no route-based code-splitting anywhere in the codebase today (only one existing
dynamic `import()`, in `compass.js`, used from event handlers, never from a render path). Splitting
`population.js`'s ~1.16 MB data out via `await import()` is achievable in principle (the codebase already
has that exact async pattern as precedent) but it cannot be a "near-1-line" change: `resolvePopulation`
is called synchronously inside `Results.jsx`'s `populationMap` `useMemo`, so truly deferring the load
requires converting that call site to async state (a `useState`/`useEffect` load-once pattern with a
null-until-loaded default) — new state, a new race-condition surface, and a re-render after mount. That
fails D-03's explicit bar ("only if low-risk, near-1-line ... otherwise defer"). Recommendation: **defer**
the population bundle split as its own perf task; do not fold it into 189.

**Primary recommendation:** Build `src/lib/bannerProps.js` exporting a pure `buildBannerProps(tier, ctx)`
where `tier` is `'city'|'state'|'federal'` and `ctx` is a single object literal built once per page
(`{ representingCity, userState, stateNames, buildingImageMap, featureIconMap, populationMap }` — every
one of these 6 names already exists verbatim as a local variable in `Results.jsx` and as a destructured
prop in `ElectionsView.jsx`). Apply the D-05 mid-left reposition entirely inside `SectionBanner.jsx`'s
existing stat-block JSX (new wrapper div + flipped `alignItems`), with zero change to the `stats` prop
shape or the `shouldRenderStat` guard. Defer the population bundle dynamic-import split.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Banner prop assembly (`buildBannerProps`) | Frontend Server (SSR)... N/A, this is a client SPA — **Browser/Client (React component tree)** | — | Pure function composing already-resolved client-side state; no network/API involved |
| Population/icon/image resolution (existing, unchanged) | Browser/Client | — | Already resolved client-side from static bundles (Census JSON) + one client fetch (`treasuryCities`, Phase 187) — 189 does not touch this layer |
| Stat visual repositioning (D-05) | Browser/Client (CSS/JSX only) | — | Pure presentational change inside `SectionBanner.jsx`; no data flow change |
| Population bundle size / code-splitting (D-03) | Browser/Client (Vite bundler concern) | Build tooling | Build-time chunking decision; affects initial JS payload the browser parses, not any server tier |

This phase has no backend/API/database tier at all — 100% client-side React + Vite bundling concerns.

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Shared abstraction shape**
- D-01: Consolidate via a pure `buildBannerProps(tier, maps)` helper — both `Results.jsx` and
  `ElectionsView.jsx` spread its result into the existing `<SectionBanner {...} />`. It assembles the
  per-tier `imageUrl`/`featureIcons`/`stats` (and any related props) from the already-centralized maps,
  so the enhancement logic lives in exactly one place. **Not** a new `<LocationBanner>` wrapper component.
  `SectionBanner` stays the single presentational component.
- D-01a: After this change there may still be N call sites textually, but they become uniform one-liners
  (`<SectionBanner {...buildBannerProps('city', maps)} />`) with zero page-specific divergence in what
  props are assembled — satisfying SBAN-03's single-source-of-truth intent.

**Where the shared abstraction lives**
- D-02: Build the helper in-app now (e.g. `src/lib/` or alongside `SectionBanner` in `src/components/`),
  promotable to `@empoweredvote/ev-ui` in a later pass. No `ev-ui` repo change this phase.

**Population bundle size (carry-over from 188)**
- D-03: The committed population bundle is ~1.16 MB minified / ~420 KB gzip and currently sits in the main
  JS chunk. Researcher assesses whether a `dynamic import()` cleanly splits it out of the initial bundle.
  Include the split only if it is a low-risk, near-1-line change; otherwise defer it as its own perf task
  and log that decision. Do not let a bundle refactor expand 189's scope.

**Banner stat placement — reposition (SUPERSEDES 188 D-11)**
- D-05: Move the population stat from top-right (188 D-11/D-12) to mid-left, floated above the location
  title. Responsive (verified live in a prototype at 390px and 1280px):
  - Desktop (`md:`, 180px banner): vertically centered on the left edge (`md:top-1/2 md:-translate-y-1/2`).
  - Mobile (120px banner): upper-left (`top-4`) — a vertically-centered stat overlaps the title on the
    short banner (measured 13px overlap), so it nudges up; verified 9px clear gap above the title.
  - Left-aligned to the title's margin — the stat's wrapper shares the title's `px-6 md:px-12` padding so
    the label/number and the location name line up on the same left edge.
  - Exact prototype approach (for the executor to replicate): an absolute wrapper
    `className="px-6 md:px-12 absolute left-0 top-4 md:top-1/2 md:-translate-y-1/2"` containing an
    `inline-flex` column scrim, `align-items: flex-start`, unchanged 188 tokens
    (`background: rgba(13,17,23,0.55)`, `backdropFilter: blur(2px)`, `borderRadius: 10px`,
    `padding: 4px 12px`), label `11px/600` uppercase `--color-ev-text-muted`, number `14px/700`
    `--color-ev-text-primary` via `.toLocaleString()`. Keep the `shouldRenderStat(stats)` omit guard
    (STAT-03) intact.
  - This is a SectionBanner **render** change; it is orthogonal to D-01's `buildBannerProps` (props are
    unchanged — only where the `stats` block renders moves). Implement both in this phase.
- D-06: No standalone `189-UI-SPEC.md`. The visual contract is 188-UI-SPEC.md + the D-05 override. 188
  D-11/D-12 (top-right, corner-clearance) are explicitly overridden by D-05; all other 188 UI-SPEC values
  (scrim tokens, label/number type, dark-mode, no-`!important`) still hold.

**Empty-state parity proof (SBAN-04)**
- D-04: Prove v19.0 parity lightweight: code inspection + a live spot-check of a no-data location (e.g. a
  government-list county browse with no place link and an unresolved city stat → no icon row, no stat
  block), plus keep the existing `shouldRenderStat(stats)` and `featureIcons?.length > 0` guards
  unit-tested. No new snapshot/visual-regression infra.

### Claude's Discretion
- Exact filename/location of the helper and its precise signature (`buildBannerProps(tier, maps)` shape),
  provided D-01/D-02 hold.
- Whether the helper returns a spread-ready props object or the pages destructure it — planner's call.
- Exact no-data location(s) used for the live spot-check.

### Deferred Ideas (OUT OF SCOPE)
- Population bundle code-split — deferred to its own perf task if D-03's research finds it non-trivial
  (this research confirms: non-trivial, defer).
- Promote the banner/helper into `@empoweredvote/ev-ui` — explicit later pass, not this phase.
- Additional stat facts / more product icons / reciprocal icons on other apps — separate future phases.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SBAN-01 | Icon row + stats strip appear on Results page banners across all 3 tiers | Already true today (Phase 187/188 shipped this) — 189 only needs to preserve it while refactoring the assembly. `buildBannerProps` design below preserves the exact same `imageUrl`/`featureIcons`/`stats` values per tier. |
| SBAN-02 | Same enhancements appear on Elections page banners, identical behavior, no page-specific divergence | Already true for the 3 prop values (verified: `ElectionsView.jsx` is a pure pass-through). The one remaining divergence is `locationName` assembly (`STATE_NAMES[userState]` in Results.jsx vs `stateNames?.[userState]` in ElectionsView.jsx — same table, same logic, different variable name). `buildBannerProps` folds this in so it is computed by one function, closing the last divergence gap. |
| SBAN-03 | Enhancements implemented as a reusable component/helper, single source of truth, promotable to ev-ui | `buildBannerProps(tier, ctx)` in `src/lib/bannerProps.js` (D-02: in-app, not ev-ui yet). See "buildBannerProps Design" below for the exact 6-input contract and both call sites. |
| SBAN-04 | Banner with no product links and no available stats still renders cleanly (v19.0 parity) | Already correct at the code level via `shouldRenderStat(stats)` and `featureIcons?.length > 0` — see "SBAN-04 Empty-State Analysis" below for the proof and the recommended lightweight verification (D-04). |
</phase_requirements>

## Standard Stack

No new libraries are required for this phase. It is a pure refactor + CSS reposition inside the
existing stack:

| Library | Version (installed, verified via `npm ls`/`npx vite --version`) | Purpose |
|---------|---------|---------|
| react | 19.1.1 (package.json) | Existing — no change |
| vite | 7.3.1 (verified `npx vite --version`) | Build tool whose default chunking behavior is the D-03 constraint |
| @floating-ui/react | 0.27.19 (package.json) | Existing tooltip impl in `SectionBanner.jsx` — untouched by 189 |
| vitest | 4.1.4 (package.json) | Existing test runner — used for the new `buildBannerProps` unit tests |

**Installation:** none — no `npm install` needed for this phase.

## Package Legitimacy Audit

**Not applicable.** This phase installs zero external packages — it only adds one new first-party file
(`src/lib/bannerProps.js` or equivalent) and edits three existing first-party files
(`SectionBanner.jsx`, `Results.jsx`, `ElectionsView.jsx`). The Package Legitimacy Gate is skipped.

## Architecture Patterns

### System Architecture Diagram

```
Results.jsx (owns router / searchParams / representingCity / userState)
  │
  ├─ useMemo: buildingImageMap = getBuildingImages(representingCity, userState)
  ├─ useMemo: featureIconMap  = resolveFeatureIcons({representingCity, userState, treasuryCities})
  ├─ useMemo: populationMap   = { Local: resolvePopulation(city args), State: ..., Federal: ... }
  │
  ├─ bannerCtx = { representingCity, userState, stateNames: STATE_NAMES,
  │                buildingImageMap, featureIconMap, populationMap }   ◄── NEW (189)
  │
  ├─ <SectionBanner {...buildBannerProps('city', bannerCtx)} />        ◄── was: 7-line hand-assembly
  ├─ <SectionBanner {...buildBannerProps('state', bannerCtx)} />
  ├─ <SectionBanner {...buildBannerProps('federal', bannerCtx)} />
  │
  └─ <ElectionsView buildingImageMap featureIconMap populationMap
                     representingCity userState stateNames={STATE_NAMES} .../>
                       │
                       ├─ bannerCtx = { representingCity, userState, stateNames,
                       │                buildingImageMap, featureIconMap, populationMap }  ◄── NEW (189)
                       │
                       ├─ <SectionBanner {...buildBannerProps('city', bannerCtx)} />
                       ├─ <SectionBanner {...buildBannerProps('state', bannerCtx)} />
                       └─ <SectionBanner {...buildBannerProps('federal', bannerCtx)} />

buildBannerProps(tier, ctx):
  city    → { tier:'city',    locationName: `${city}, ${state}` | city | 'Your City',
              imageUrl: ctx.buildingImageMap.Local,   featureIcons: ctx.featureIconMap.Local,   stats: ctx.populationMap.Local }
  state   → { tier:'state',   locationName: stateNames[state] | state | 'Your State',
              imageUrl: ctx.buildingImageMap.State,   featureIcons: ctx.featureIconMap.State,   stats: ctx.populationMap.State }
  federal → { tier:'federal', locationName: 'United States',
              imageUrl: ctx.buildingImageMap.Federal, featureIcons: ctx.featureIconMap.Federal, stats: ctx.populationMap.Federal }
       │
       ▼
SectionBanner({tier, locationName, imageUrl, stats, featureIcons})   ◄── UNCHANGED prop contract
  ├─ image OR fallback-gradient layer
  ├─ title (bottom-left, unchanged)
  ├─ stat scrim (REPOSITIONED this phase: top-right → responsive mid-left, D-05)
  └─ feature-icon row (bottom-right, unchanged)
```

A reader can trace the primary use case: `Results.jsx` resolves data once → assembles one `bannerCtx` →
`buildBannerProps` turns `(tier, bannerCtx)` into the exact same 5 props `SectionBanner` already
consumes → `SectionBanner` renders unchanged except for the stat's on-screen position.

### Recommended Project Structure

```
src/
├── lib/
│   ├── bannerProps.js       # NEW — buildBannerProps(tier, ctx), pure function, no React import
│   ├── bannerProps.test.js  # NEW — Vitest, pure-logic-only (matches featureIcons.test.js/population.test.js convention)
│   ├── population.js        # UNCHANGED (Phase 188)
│   ├── featureIcons.js      # UNCHANGED (Phase 187)
│   └── buildingImages.js    # UNCHANGED
├── components/
│   ├── SectionBanner.jsx    # EDITED — stat block repositioned (D-05); no prop-contract change
│   └── ElectionsView.jsx    # EDITED — 3 call sites become buildBannerProps one-liners
└── pages/
    └── Results.jsx          # EDITED — 3 call sites become buildBannerProps one-liners
```

### Pattern 1: buildBannerProps — the shared abstraction (D-01/D-01a/SBAN-03)

**What:** A pure function, `buildBannerProps(tier, ctx)`, that is the single place per-tier
`SectionBanner` props are assembled. `tier` is the lowercase string SectionBanner already expects
(`'city'|'state'|'federal'`); it maps internally to the capitalized map keys
(`Local`/`State`/`Federal`) that `buildingImageMap`/`featureIconMap`/`populationMap` already use
(this capitalization mismatch already exists in the shipped code — `resolveFeatureIcons`/
`getBuildingImages`/the `populationMap` object all key by `Local`/`State`/`Federal`, while
`SectionBanner`'s own `tier` prop is lowercase `city`/`state`/`federal`. `buildBannerProps` is the
correct place to bridge that, once, instead of each call site knowing both conventions).

**When to use:** Every `<SectionBanner>` call site (both pages, all 3 tiers).

**Reference implementation** (`src/lib/bannerProps.js`):
```javascript
// src/lib/bannerProps.js
// Pure function — no React import, no I/O, mirrors resolvePopulation/resolveFeatureIcons'
// no-side-effects convention so it can be unit-tested without jsdom.

const TIER_TO_MAP_KEY = { city: 'Local', state: 'State', federal: 'Federal' };

/**
 * Assemble the exact prop object <SectionBanner> needs for one tier, from the
 * already-resolved per-page maps. This is the ONE place tier→prop assembly
 * logic lives (SBAN-03) — both Results.jsx and ElectionsView.jsx call this
 * identically; neither page hand-assembles imageUrl/featureIcons/stats or
 * locationName inline anymore.
 *
 * @param {'city'|'state'|'federal'} tier
 * @param {{
 *   representingCity?: string|null,
 *   userState?: string|null,
 *   stateNames?: Record<string,string>,
 *   buildingImageMap?: {Local?:string|null, State?:string|null, Federal?:string|null},
 *   featureIconMap?: {Local?:Array, State?:Array, Federal?:Array},
 *   populationMap?: {Local?:object|null, State?:object|null, Federal?:object|null},
 * }} ctx
 * @returns {{tier:string, locationName:string, imageUrl:string|null, featureIcons:Array, stats:object|null}}
 */
export function buildBannerProps(tier, ctx = {}) {
  const {
    representingCity = null,
    userState = null,
    stateNames = {},
    buildingImageMap = {},
    featureIconMap = {},
    populationMap = {},
  } = ctx;

  const mapKey = TIER_TO_MAP_KEY[tier];

  let locationName;
  if (tier === 'city') {
    locationName = representingCity && userState
      ? `${representingCity}, ${userState}`
      : (representingCity || 'Your City');
  } else if (tier === 'state') {
    locationName = (userState && stateNames[userState]) || userState || 'Your State';
  } else {
    locationName = 'United States';
  }

  return {
    tier,
    locationName,
    imageUrl: buildingImageMap[mapKey] ?? null,
    featureIcons: featureIconMap[mapKey] ?? [],
    stats: populationMap[mapKey] ?? null,
  };
}
```

**Call sites** (both pages become identical one-liners once a `bannerCtx` object is built once per
page — recommend a `useMemo` in each page, since the ctx object should be referentially stable to
avoid needless child re-renders, matching the existing `buildingImageMap`/`featureIconMap`/
`populationMap` `useMemo` convention already in `Results.jsx`):

```jsx
// Results.jsx — replaces the current 3 call sites (verified current lines below)
const bannerCtx = useMemo(
  () => ({ representingCity, userState, stateNames: STATE_NAMES, buildingImageMap, featureIconMap, populationMap }),
  [representingCity, userState, buildingImageMap, featureIconMap, populationMap]
);
// ...
<SectionBanner {...buildBannerProps('city', bannerCtx)} />
<SectionBanner {...buildBannerProps('state', bannerCtx)} />
<SectionBanner {...buildBannerProps('federal', bannerCtx)} />
```

```jsx
// ElectionsView.jsx — identical pattern; every one of these 6 ctx fields is
// ALREADY a destructured prop name in ElectionsView's function signature
// (lines 285-290), so this is a literal drop-in, no renaming needed:
const bannerCtx = useMemo(
  () => ({ representingCity, userState, stateNames, buildingImageMap, featureIconMap, populationMap }),
  [representingCity, userState, stateNames, buildingImageMap, featureIconMap, populationMap]
);
// ...
<SectionBanner {...buildBannerProps('city', bannerCtx)} />
<SectionBanner {...buildBannerProps('state', bannerCtx)} />
<SectionBanner {...buildBannerProps('federal', bannerCtx)} />
```

**Exact 6 current call sites this replaces (verified line numbers, 2026-07-08):**

| # | File | Lines | Tier |
|---|------|-------|------|
| 1 | `src/pages/Results.jsx` | 1989–1995 | city |
| 2 | `src/pages/Results.jsx` | 1997–2003 | state |
| 3 | `src/pages/Results.jsx` | 2005–2011 | federal |
| 4 | `src/components/ElectionsView.jsx` | 579–585 | city |
| 5 | `src/components/ElectionsView.jsx` | 587–593 | state |
| 6 | `src/components/ElectionsView.jsx` | 595–601 | federal |

(The CONTEXT.md canonical-refs cite these as ~1951–1969 / ~577–598; the code has shifted slightly
since 187/188 landed — the above are the current, re-verified line numbers as of this research.)

**Why `ctx` (not literally `maps` per D-01's shorthand name) also carries `representingCity`/
`userState`/`stateNames`:** D-01/D-01a's stated goal is "zero page-specific divergence in what props
are assembled." The three explicitly-named maps (`buildingImageMap`/`featureIconMap`/`populationMap`)
are already identical across both pages today — the ONE piece of assembly logic that still differs
in wording (not behavior) between the two pages is `locationName` (`STATE_NAMES[userState]` vs
`stateNames?.[userState]`, same table, different local name). Folding `locationName` construction into
`buildBannerProps` is what fully closes SBAN-03's "single source of truth" gap, not just the 3
maps named in the phase's shorthand description. This is why the signature is `(tier, ctx)` with `ctx`
being a superset of "maps" — Claude's Discretion in CONTEXT.md explicitly leaves the exact shape open
("provided D-01/D-02 hold").

### Anti-Patterns to Avoid
- **Do not build a `<LocationBanner>` wrapper component** — D-01 explicitly rejects this; it would
  bundle app-specific data resolution into a component, adding an indirection layer and making
  `SectionBanner` less cleanly promotable to `ev-ui`.
- **Do not re-derive `locationName` per call site after adding `buildBannerProps`** — if only the 3
  maps are folded in and `locationName` is left hand-assembled at each of the 6 sites, SBAN-03's
  "zero page-specific divergence" is not fully satisfied (the two pages' `STATE_NAMES`/`stateNames`
  variable-name difference would remain a latent, easy-to-drift duplication).
- **Do not have `buildBannerProps` re-resolve data** (e.g. re-derive population, re-fetch treasury
  cities) — it must be a pure prop-assembly function over already-resolved maps, matching 188's
  "parent resolves, child renders" posture (188-03-SUMMARY.md) that Results.jsx already established.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Per-tier prop assembly | A new stateful hook or context provider for banner props | The pure `buildBannerProps(tier, ctx)` function shown above | The data is already resolved and stable per render (via `useMemo`); a plain function is sufficient, testable without React, and matches this repo's established "pure resolver" convention (`resolvePopulation`, `resolveFeatureIcons`, `getBuildingImages` are all plain functions, not hooks) |
| Verifying SBAN-04 empty-state parity | A new snapshot/visual-regression test suite | Code inspection of the two existing guards (`shouldRenderStat`, the inline `featureIcons?.length > 0` check) + one live Playwright spot-check, per D-04 | D-04 explicitly rules out new snapshot infra ("this repo doesn't use it today and 189 shouldn't introduce it"); the guards are simple boolean predicates, fully coverable by plain Vitest assertions |

**Key insight:** This phase's entire scope is "stop duplicating already-correct logic" and "move one
CSS block" — there is no new problem domain here that would tempt a custom-built solution. The main risk
is scope creep (rebuilding SectionBanner's internals, or taking on the bundle-size refactor) rather than
under-building.

## Common Pitfalls

### Pitfall 1: Capitalization mismatch between `tier` and the map keys
**What goes wrong:** `SectionBanner`'s `tier` prop is lowercase (`'city'|'state'|'federal'`), but every
resolved map (`buildingImageMap`, `featureIconMap`, `populationMap`) is keyed by the capitalized
`Local`/`State`/`Federal` (this is the existing `getBuildingImages`/`resolveFeatureIcons` return shape —
verified in `src/lib/buildingImages.js:526-530` and `src/lib/featureIcons.js:66-67`). A naive
`buildBannerProps` that does `ctx.buildingImageMap[tier]` will silently return `undefined` for every
tier (JS object access on a mismatched key never throws — it just returns `undefined`, which
`SectionBanner`'s existing null-safe rendering paths would then quietly treat as "no image"/"no
stats"/"no icons" everywhere).
**Why it happens:** The two naming conventions (`tier` prop vs. map keys) were established independently
across two different phases (170's original `SectionBanner` for `tier`, 187/188's map-building helpers
for `Local`/`State`/`Federal`) and were never reconciled.
**How to avoid:** `buildBannerProps` must explicitly translate via a small lookup
(`TIER_TO_MAP_KEY = { city: 'Local', state: 'State', federal: 'Federal' }`) as shown in the reference
implementation above — never assume the two strings are interchangeable.
**Warning signs:** A live spot-check shows every banner losing its image/stat/icons simultaneously after
the refactor (not just one tier) — that pattern points directly at this mismatch, since the bug hits
all three tiers identically.

### Pitfall 2: Losing the null/empty-array defaults when destructuring `ctx`
**What goes wrong:** `ElectionsView.jsx` already defaults `buildingImageMap = {}`, `featureIconMap = {}`,
`populationMap = {}` at its function signature (verified lines 285-287) specifically so that
`buildingImageMap?.Local` etc. never throws when `ElectionsView` renders before `Results.jsx`'s
`useMemo`s have populated data (e.g., very first render, or an SSR/first-paint race — though this is a
CSR-only app, `useMemo` still runs synchronously during the parent's own render, so the child receives
whatever the parent had computed by then). If `buildBannerProps` assumes `ctx.buildingImageMap` is
always a fully-populated object, a `ctx.buildingImageMap[mapKey]` access on an empty `{}` returns
`undefined` — which is fine for `imageUrl`/`stats` (already null-safe downstream) but **not** fine for
`featureIcons`, since `SectionBanner`'s guard is `featureIcons?.length > 0`, and `undefined?.length` is
also safely `undefined` (falsy) — so this particular case is actually harmless. The real risk is the
reverse: if the reference implementation's own defaults (`featureIconMap[mapKey] ?? []`) are dropped,
and some other future caller of `buildBannerProps` passes `featureIcons: undefined` all the way through,
double-check that `SectionBanner`'s `featureIcons?.length > 0` still tolerates `undefined` (it does,
today) — but don't rely on that implicitly; keep `buildBannerProps`'s own defaults (`?? []`, `?? null`,
`?? {}`) as the explicit contract so the function's return value is self-consistent regardless of what
partial `ctx` it's given.
**Why it happens:** Three different "empty" representations exist across this codebase's history
(`{}`, `[]`, `null`) and it's easy to mix them up when writing a new aggregator function.
**How to avoid:** Match `SectionBanner`'s own prop-shape expectations exactly: `imageUrl` → `string|null`,
`featureIcons` → `Array` (empty array, not null/undefined, since the guard is `.length > 0`), `stats` →
`{label,value}|null`. The reference implementation's `?? null` / `?? []` defaults already encode this.
**Warning signs:** A console warning about `.length` on undefined, or (more likely, since JS optional
chaining suppresses that) icons/stats silently never appearing even when the underlying data resolved.

### Pitfall 3: Treating D-03's "near-1-line" bar as met by only touching `population.js`
**What goes wrong:** It is tempting to think "just wrap the one `import` statement in `population.js` in
a dynamic `import()`" is sufficient. It is not: `population.js`'s `DEFAULT_MAPS` constant
(`src/lib/population.js:15`) is built at **module-evaluation time** from a **static** top-level import
(`import { POP_BY_FIPS, NAME_STATE_TO_FIPS } from '../data/population.js'`, line 2). A dynamic `import()`
returns a `Promise`; you cannot synchronously destructure `POP_BY_FIPS` from a `Promise` at module scope.
The only way to actually defer loading the 1.16 MB data past initial page load is to make the *load*
async and thread that asynchrony up through whichever call site needs the resolved value —
`Results.jsx`'s `populationMap` `useMemo` (`src/pages/Results.jsx:1171-1185`), which today is 100%
synchronous. That requires new `useState`/`useEffect` state (a "maps loaded yet?" flag), a null-until-loaded
default for `populationMap` (which is actually elegant, since `null` already means "omit the stat"
per STAT-03 — so the loading state and the "no data" state look visually identical, no new UI branch
needed), and careful default-export handling so `resolvePopulation`'s own synchronous, pure signature
(and its 13 existing Vitest cases, which never import the real bundle) is left completely untouched.
**Why it happens:** "Just make the import lazy" sounds like a one-line change when phrased that way, but
the actual unit of work is "make one render path async," which is categorically different from a
one-line edit.
**How to avoid:** Recognize this as its own perf task (D-03's explicit escape hatch) rather than
folding it into 189. See "D-03 Bundle-Size Assessment" below for the full analysis and a ready-made
design for whoever picks up that follow-on task.
**Warning signs:** If a plan for 189 includes new `useState`/`useEffect` hooks in `Results.jsx` purely
for population-map loading, that is signal the split is being attempted inside 189 despite D-03's
guidance — flag it back to "defer."

### Pitfall 4: Forgetting the D-05 reposition also needs the `align-items` flip
**What goes wrong:** The current stat block (`src/components/SectionBanner.jsx:228-270`) uses
`alignItems: 'flex-end'` (right-aligns the label/number text block) because it was right-aligned at
top-right (188 D-11). D-05 moves the anchor to the left edge but if `alignItems` is left unchanged at
`flex-end`, the label/number text will render right-aligned *within* a left-anchored box — which,
combined with the box's intrinsic (fits-content) sizing, produces no visible layout bug by itself
(the box still hugs its content) but violates D-05's explicit spec ("`align-items: flex-start`") and
will look visually inconsistent with the title block below it (which is naturally left-flush).
**Why it happens:** Copy-pasting the existing scrim styles wholesale without checking every property
against the new D-05 spec.
**How to avoid:** Cross-check the full 6-property list D-05 specifies against what's already in the
component: position anchor (`top-4 md:top-1/2 md:-translate-y-1/2 left-0`, was `top:16/right:16`),
`alignItems` (`flex-start`, was `flex-end`) — background/blur/radius/padding are unchanged from 188.
**Warning signs:** A visual spot-check where the scrim sits at the left edge but the text inside looks
"pushed to the right" of its own box.

## Code Examples

### buildBannerProps unit test skeleton (mirrors `featureIcons.test.js`/`population.test.js` convention)
```javascript
// src/lib/bannerProps.test.js — pure-logic only, no jsdom/React import
import { describe, it, expect } from 'vitest';
import { buildBannerProps } from './bannerProps';

const CTX = {
  representingCity: 'Plano',
  userState: 'TX',
  stateNames: { TX: 'Texas' },
  buildingImageMap: { Local: 'https://.../plano.jpg', State: null, Federal: 'https://.../capitol.jpg' },
  featureIconMap: { Local: [{ key: 'treasury' }], State: [], Federal: [{ key: 'treasury' }] },
  populationMap: { Local: { label: 'POPULATION', value: 285494 }, State: null, Federal: { label: 'POPULATION', value: 332387540 } },
};

describe('buildBannerProps', () => {
  it('assembles city-tier props from the ctx maps', () => {
    expect(buildBannerProps('city', CTX)).toEqual({
      tier: 'city',
      locationName: 'Plano, TX',
      imageUrl: 'https://.../plano.jpg',
      featureIcons: [{ key: 'treasury' }],
      stats: { label: 'POPULATION', value: 285494 },
    });
  });

  it('falls back to the state abbreviation when stateNames has no entry', () => {
    expect(buildBannerProps('state', { ...CTX, stateNames: {} }).locationName).toBe('TX');
  });

  it('federal tier always reads "United States" regardless of city/state', () => {
    expect(buildBannerProps('federal', CTX).locationName).toBe('United States');
  });

  it('a tier with no image/icons/stats returns null/[]/null, never undefined (SBAN-04 precondition)', () => {
    const empty = buildBannerProps('state', CTX); // State map entries are null/[]/null above
    expect(empty.imageUrl).toBeNull();
    expect(empty.featureIcons).toEqual([]);
    expect(empty.stats).toBeNull();
  });

  it('tolerates a completely empty ctx (no throw)', () => {
    expect(() => buildBannerProps('city', {})).not.toThrow();
    const result = buildBannerProps('city', {});
    expect(result.locationName).toBe('Your City');
    expect(result.imageUrl).toBeNull();
    expect(result.featureIcons).toEqual([]);
    expect(result.stats).toBeNull();
  });
});
```

### D-05 reposition — the exact JSX diff shape for `SectionBanner.jsx`
```jsx
{/* BEFORE (188, top-right) — src/components/SectionBanner.jsx:228-270 */}
{shouldRenderStat(stats) && (
  <div data-slot="stats" style={{
    position: 'absolute', top: '16px', right: '16px',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px',
    background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(2px)',
    borderRadius: '10px', padding: '4px 12px',
  }}>
    {/* label + number spans, unchanged */}
  </div>
)}

{/* AFTER (189, D-05 mid-left) */}
{shouldRenderStat(stats) && (
  <div
    className="px-6 md:px-12"
    style={{ position: 'absolute', left: 0, top: '16px' }}
    // Tailwind responsive override for the vertical anchor (inline style can't
    // express a breakpoint-conditional `top`, so this one axis needs a
    // Tailwind utility class alongside the inline `left`/positioning):
  >
    <div
      data-slot="stats"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
        background: 'rgba(13,17,23,0.55)', backdropFilter: 'blur(2px)',
        borderRadius: '10px', padding: '4px 12px',
      }}
    >
      {/* label + number spans, unchanged */}
    </div>
  </div>
)}
```
**Implementation note:** because the desktop/mobile `top` values differ (`top-4` mobile vs.
`md:top-1/2 md:-translate-y-1/2` desktop) and inline `style` objects cannot express a `md:` breakpoint,
the outer wrapper's positioning must be done via Tailwind utility classes
(`className="px-6 md:px-12 absolute left-0 top-4 md:top-1/2 md:-translate-y-1/2"`), matching the exact
class string D-05 specifies — this is a deviation from the rest of `SectionBanner.jsx`'s otherwise
all-inline-style convention, but it is the only way to express the responsive vertical anchor, and it
is explicitly what D-05's own "exact prototype approach" section already prescribes verbatim.

## State of the Art

| Old Approach (188) | New Approach (189, D-05) | When Changed | Impact |
|---------------------|---------------------------|---------------|--------|
| Stat scrim top-right, right-aligned, inline-style-only positioning | Stat scrim responsive mid-left, left-aligned, Tailwind classes for the responsive vertical anchor | This phase | Visual only — `stats` prop shape and `shouldRenderStat` guard unchanged; no data-flow impact |
| 6 hand-assembled `<SectionBanner>` call sites (3 per page) | 6 uniform `<SectionBanner {...buildBannerProps(tier, ctx)} />` one-liners | This phase | Prop-assembly logic (including `locationName`) now lives in exactly one function; eliminates the last page-specific divergence (STATE_NAMES vs stateNames variable-name-only duplication) |

**Deprecated/outdated:** None — 187/188's resolvers (`resolvePopulation`, `resolveFeatureIcons`,
`getBuildingImages`) are all still current and unchanged by this phase.

## D-03 Bundle-Size Assessment (detailed)

**Measured, not assumed.** Ran `npx vite build` in this repo (2026-07-08, clean working tree,
Vite 7.3.1):

```
dist/assets/index-BouRSrAb.js   2,519.41 kB │ gzip: 820.22 kB
```

This is the **entire application** in a single JS chunk — there is no route-based or component-level
code-splitting anywhere in the codebase today (`grep -r "React.lazy\|import(" src` finds exactly one
dynamic `import()` site, in `src/lib/compass.js`, used inside async event-handler functions
`await import('@empoweredvote/ev-ui')`, never inside a render path). Per Phase 188's own
measurements (188-01-SUMMARY.md), the committed `src/data/population.js` bundle alone is
**~1.16 MB minified / ~420 KB gzip** — i.e., population data currently accounts for **~46% of the
app's total minified JS size and ~51% of its total gzip size**. This is a legitimate, large concern,
but splitting it out is not free.

**Why it fails the "near-1-line" bar (D-03):**

1. `src/lib/population.js`'s only import of the data (`import { POP_BY_FIPS, NAME_STATE_TO_FIPS } from
   '../data/population.js'`, line 2) is **static**, feeding a module-scope constant (`DEFAULT_MAPS`,
   line 15) that `resolvePopulation`'s default parameter binds to synchronously.
2. `resolvePopulation` is called **synchronously**, three times, inside `Results.jsx`'s `populationMap`
   `useMemo` (lines 1171-1185) — a plain render-time computation with no `async`/`await` anywhere in
   its call chain today.
3. JavaScript's `import()` always returns a `Promise`. There is no way to "just" make the data import
   lazy without introducing asynchrony somewhere in that chain — and the only sane place to absorb that
   asynchrony is a new load-once React state (`useState`/`useEffect`) in `Results.jsx`, since `useMemo`
   itself cannot await a promise.
4. This is a well-scoped, low-risk change in isolation (see the design sketch below) — but it is not
   "near-1-line." It touches `population.js` (add an async loader export, keep `resolvePopulation` itself
   fully synchronous/pure/untouched for testability) AND `Results.jsx` (new state + a changed `useMemo`
   dependency array + a null-until-loaded initial value).

**Recommendation: DEFER**, per D-03's explicit instruction ("otherwise defer it as its own perf task and
log that decision"). This assessment IS that logged decision.

**Ready-made design for the deferred follow-on task** (for whoever picks it up next):
```javascript
// src/lib/population.js — ADD, do not change resolvePopulation's signature/behavior
let mapsPromise = null;
export function loadPopulationMaps() {
  if (!mapsPromise) {
    mapsPromise = import('../data/population.js').then((mod) => ({
      POP_BY_FIPS: mod.POP_BY_FIPS,
      NAME_STATE_TO_FIPS: mod.NAME_STATE_TO_FIPS,
      ABBREV_TO_STATE_FIPS,          // already derived at module scope from buildingImages.js
    }));
  }
  return mapsPromise; // singleton — only fetched once per page session
}
```
```jsx
// Results.jsx — sketch only, NOT part of 189
const [popMaps, setPopMaps] = useState(null);
useEffect(() => { loadPopulationMaps().then(setPopMaps); }, []);
const populationMap = useMemo(() => {
  if (!popMaps) return { Local: null, State: null, Federal: null }; // identical to "no data" (STAT-03) — no new UI branch needed
  const cityPop = resolvePopulation({ tier: 'city', geoId: ..., city: representingCity, stateAbbrev: userState }, popMaps);
  // ...
}, [representingCity, userState, searchParams, popMaps]);
```
This preserves `resolvePopulation`'s existing pure/sync signature and all 13 existing Vitest cases
untouched (they inject fixture `maps` directly and never exercise `loadPopulationMaps`). The loading
window is invisible to the user — a banner simply omits its stat for the brief period before the
dynamically-imported chunk resolves, which is visually identical to STAT-03's existing "no data" case.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The "9px clear gap" and "13px overlap" figures for the D-05 mobile geometry are taken verbatim from CONTEXT.md's stated live-prototype measurement, not independently re-measured in this research session (no browser/Playwright session was run here). | User Constraints / D-05 | Low — CONTEXT.md states these were "verified live in a prototype at 390px and 1280px" by the operator before this research began; the executor should still do a final visual spot-check per D-04/D-05's own instruction, which would catch any drift. |
| A2 | No other file in the codebase imports `resolvePopulation`, `resolveFeatureIcons`, or `getBuildingImages` besides `Results.jsx` (and their own test files) — verified via `grep -r` across `src/`, so this is actually confirmed, not assumed; listed here only because it underpins the claim that `buildBannerProps`'s `ctx` shape has exactly one producer to keep in sync. | buildBannerProps Design | Low — grep-verified in this session, not training-data knowledge. |

**If this table is empty:** N/A — see A1/A2 above; both are low-risk and A2 is actually verified rather
than assumed (kept in the log for transparency about what was and wasn't independently re-checked this
session).

## Open Questions

1. **Which no-data location should the D-04 live spot-check use?**
   - What we know: Phase 188's Plan 03 checkpoint already spot-checked a government-list county browse
     (`browse_government_list=06037&browse_state=CA`, "Los Angeles County, CA") and confirmed **no
     population stat** rendered there. `featureIcons.test.js` confirms the **Federal tier's Treasury
     icon always resolves** (as long as `treasuryCities` includes a "United States" federal entry), and
     `resolvePopulation`'s federal branch always resolves too — meaning the **Federal banner can never
     be a true SBAN-04 empty case** (it will always have both a stat and an icon). A genuine "no product
     links AND no available stats" case must come from the **city** (or possibly **state**) tier.
   - What's unclear: Whether the LA-County example already spot-checked in 188 also has zero Treasury
     icons (untested in 188's checkpoint, which only checked the stat). If LA County happens to have a
     Treasury entity, it would show an icon but no stat — not a full SBAN-04 proof.
   - Recommendation: For the D-04 live spot-check, the executor should pick (or verify) a location that
     is simultaneously (a) not a recognized Census place/state name-match (no stat) and (b) not a
     Treasury-tracked municipality (no icon) — e.g., a small/unincorporated place, or deliberately query
     a nonsense `browse_geo_id` for the city tier while keeping `browse_state` valid (so state/federal
     still render their banners normally, isolating the city-tier empty case). This is exactly the kind
     of check `resolvePopulation`'s and `resolveFeatureIcons`' own Vitest suites already cover with
     fixtures (`'Nowheresville'`/`'ZZ'`) — the live spot-check is confirming the same miss-path renders
     cleanly end-to-end in the browser, not re-testing the resolver logic itself.

2. **Should `featureIcons?.length > 0` be extracted into a named, exported `shouldRenderIcons(featureIcons)` predicate (mirroring `shouldRenderStat`)?**
   - What we know: `shouldRenderStat` was extracted specifically so STAT-03's omit logic could be
     unit-tested without jsdom (188-03-SUMMARY.md's own stated rationale). The feature-icon row's guard
     (`featureIcons?.length > 0`, `SectionBanner.jsx:275`) is still inline JSX today — not a named,
     independently-testable predicate — even though `resolveFeatureIcons` itself is thoroughly tested to
     produce `[]` on a miss.
   - What's unclear: D-04 says "keep the existing... `featureIcons?.length > 0` guards unit-tested" —
     this could be read as "the existing behavior stays intact" (already true, no new work) OR as "make
     sure this guard specifically has direct unit test coverage" (which it currently does not, only
     indirectly via `resolveFeatureIcons.test.js` proving the *input* is `[]`, not proving the *render
     guard* itself behaves correctly for `[]`/`undefined`/`null`).
   - Recommendation: Low-cost, high-value to extract `shouldRenderIcons(featureIcons)` as an exported
     pure predicate alongside `shouldRenderStat` in `SectionBanner.jsx`, with a small Vitest block
     mirroring the existing `describe('shouldRenderStat')` tests (true for `[{...}]`, false for `[]`,
     `null`, `undefined`). This directly strengthens the SBAN-04 proof and costs ~10 lines.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 |
| Config file | none — no `vitest.config.js` detected; Vitest runs off `package.json`'s `"test": "vitest run"` script with default config (verified: no dedicated config file in repo root) |
| Quick run command | `npx vitest run src/lib/bannerProps.test.js src/components/SectionBanner.test.js` |
| Full suite command | `npm test` (currently 10 files / 109 tests per 188-03-SUMMARY.md — will grow by however many new tests 189 adds) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SBAN-01 | Results page banners render icon row + stat across all 3 tiers | unit (via `buildBannerProps` returning correct `imageUrl`/`featureIcons`/`stats` per tier) + manual/live spot-check (no page-render test infra exists in this repo — `Results.jsx` has no `.test.jsx` file, matching the "pure-logic only, no jsdom component tests" convention) | `npx vitest run src/lib/bannerProps.test.js -x` | ❌ Wave 0 (new file) |
| SBAN-02 | Elections page banners identical behavior, no divergence | unit (same `buildBannerProps` output, called with `ElectionsView`'s own prop names, proving no divergent logic) + live spot-check (Results vs Elections page, same location, same numbers — this exact check was already performed in 188-03-SUMMARY.md's checkpoint and should be repeated after the refactor) | `npx vitest run src/lib/bannerProps.test.js -x` | ❌ Wave 0 (new file) |
| SBAN-03 | Single-source-of-truth reusable helper, promotable to ev-ui | unit (assert `buildBannerProps` is a pure function — no React/DOM import, `bannerProps.js` has zero `import` from 'react') + code inspection (confirm both pages call the identical function, not divergent inline logic) | `npx vitest run src/lib/bannerProps.test.js -x` | ❌ Wave 0 (new file) |
| SBAN-04 | Empty-state parity (title+art only, no console errors) | unit (`shouldRenderStat` — already exists, 7 cases; recommend adding `shouldRenderIcons` — see Open Question 2) + live spot-check (a genuine no-icon/no-stat city-tier location, console clean) | `npx vitest run src/components/SectionBanner.test.js -x` | ✅ exists (extend with `shouldRenderIcons` cases per Open Question 2) |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/bannerProps.test.js src/components/SectionBanner.test.js`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`, plus one live Playwright/manual spot-check
  per D-04 (no new snapshot infra — matches 188's own checkpoint precedent of a live dev-build visual
  pass rather than automated visual regression)

### Wave 0 Gaps
- [ ] `src/lib/bannerProps.js` — new file, does not exist yet (this phase creates it)
- [ ] `src/lib/bannerProps.test.js` — new file, covers SBAN-01/02/03 per the reference test skeleton above
- [ ] (Optional, strengthens SBAN-04) `shouldRenderIcons` predicate + tests in `SectionBanner.jsx` /
      `SectionBanner.test.js` — see Open Question 2
- No test framework install needed — Vitest is already configured and running (109 passing tests as of
  188's completion)

## Security Domain

Not applicable — `security_enforcement` config key is absent from `.planning/config.json`, but this
phase has no authentication, session, access-control, input-validation-from-untrusted-source, or
cryptography surface whatsoever. It is a pure client-side prop-assembly refactor and a CSS reposition of
already-rendered, already-public data (population figures, product deep-links that were already
constructed and rendered by Phases 187/188). No ASVS category applies.

## Sources

### Primary (HIGH confidence — direct code/build inspection this session)
- `src/components/SectionBanner.jsx` (full file read) — current stat-block implementation, `tier` prop
  contract, `shouldRenderStat` export, feature-icon row guard.
- `src/pages/Results.jsx` (lines 1155-1215, 1975-2020, and grep of all `SectionBanner`/map-related lines)
  — `populationMap`/`featureIconMap`/`buildingImageMap` `useMemo`s, `STATE_NAMES` definition (line 93),
  the 3 city/state/federal call sites (verified current line numbers 1989-2011).
- `src/components/ElectionsView.jsx` (lines 270-310, 565-610, and grep) — function signature prop
  defaults, the 3 call sites (verified current line numbers 579-601).
- `src/lib/population.js`, `src/lib/population.test.js`, `src/lib/featureIcons.js`,
  `src/lib/featureIcons.test.js`, `src/lib/buildingImages.js` (full reads) — resolver signatures, map key
  conventions (`Local`/`State`/`Federal`), existing test conventions (pure-logic-only, injectable-maps
  seam), confirmation that Federal tier always resolves for both population and Treasury icon.
- `npx vite build` run in this repo (2026-07-08) — confirmed single 2,519.41 kB / 820.22 kB gzip main
  chunk, no code-splitting anywhere today.
- `grep -rn "React.lazy\|import(" src` — confirmed exactly one existing dynamic-import precedent
  (`src/lib/compass.js`), used only in async event handlers, never a render path.
- `.planning/phases/188-location-stats-strip/188-01-SUMMARY.md`, `188-02-SUMMARY.md`,
  `188-03-SUMMARY.md` — bundle-size figures (~1.16 MB minified / ~420 KB gzip), resolver
  implementation history, the carried-forward D-03 flag.
- `.planning/phases/187-tethered-feature-icon-row/187-CONTEXT.md`,
  `.planning/phases/188-location-stats-strip/188-CONTEXT.md`,
  `.planning/phases/188-location-stats-strip/188-UI-SPEC.md` — locked prior decisions this phase must
  not contradict (D-05/D-07 reservation, scrim tokens, guard conventions).
- `.planning/phases/189-smart-banner-integration-graceful-degradation/189-CONTEXT.md` — this phase's own
  locked decisions (D-01 through D-06).
- `.planning/REQUIREMENTS.md`, `.planning/config.json` — SBAN-01..04 text; confirmed
  `nyquist_validation` absent (treated as enabled) and no CLAUDE.md/`.claude/skills` present in this repo.

### Secondary (MEDIUM confidence)
- None used — no WebSearch/Context7 lookups were needed for this phase; it is entirely internal-codebase
  research with no new external library/API surface.

### Tertiary (LOW confidence)
- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all versions read directly from `package.json`/`npx vite --version`.
- Architecture (buildBannerProps design): HIGH — derived directly from reading both call sites' exact
  current code, not inferred.
- D-03 bundle assessment: HIGH — based on an actual `vite build` run in this repo plus direct code
  reading of the synchronous call chain, not estimation.
- Pitfalls: HIGH — each pitfall traces to a specific, cited line range in the actual shipped code.
- SBAN-04 empty-state analysis: MEDIUM — the code-level proof is HIGH confidence (guards read directly),
  but which specific real-world location best demonstrates the "genuinely both-empty" case is left as an
  Open Question for the executor to confirm live, since no fixture in this repo currently proves a
  simultaneous icon-miss + stat-miss for a real city (only synthetic test fixtures do).

**Research date:** 2026-07-08
**Valid until:** 30 days (stable, frontend-only refactor phase; no fast-moving external dependency)
