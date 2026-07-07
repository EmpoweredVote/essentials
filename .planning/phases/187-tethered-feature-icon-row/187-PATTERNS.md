# Phase 187: Tethered Feature-Icon Row - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 8 (2 new, 6 modified)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `src/lib/featureIcons.js` (NEW) | utility / registry | transform (resolve-or-null) | `src/lib/buildingImages.js` `getBuildingImages()` | role-match (tier-keyed resolver returning `{Local,State,Federal}`) |
| `src/lib/featureIcons.test.js` (NEW) | test | transform | `src/lib/treasury.test.js` | exact (Vitest pure-logic convention) |
| `src/lib/treasury.js` (MODIFY — add `findStateTreasuryEntity`, `findFederalTreasuryEntity`) | utility / service | CRUD (read/match) | same file's `findMatchingMunicipality` (lines 67-100) | exact (extend sibling pattern, do not touch existing fn) |
| `src/lib/treasury.test.js` (MODIFY — extend) | test | CRUD (read/match) | same file, existing `describe` blocks (lines 27-62) | exact |
| `src/components/SectionBanner.jsx` (MODIFY — render `featureIcons` slot) | component | request-response (render props → DOM) | same file's existing `imageFailed`/`showImage` fallback logic (lines 46-92); tooltip sub-pattern from `src/components/IconOverlay.jsx` (lines 22-81) | exact (same file) + role-match (tooltip) |
| `src/pages/Results.jsx` (MODIFY — resolve + pass `featureIconMap`) | controller / page | event-driven (useMemo derive + prop pass) | same file's `buildingImageMap` `useMemo` (lines 1132-1135) + `<SectionBanner>` call sites (lines 1937-1954) | exact |
| `src/components/ElectionsView.jsx` (MODIFY — drill `featureIconMap` prop, pass to its own 3 `<SectionBanner>`) | component | event-driven (prop drill → render) | same file's `buildingImageMap` prop (line 285) + its 3 `<SectionBanner>` calls (lines 576-594) | exact |
| Icon asset `public/treasury-symbol.svg` (NEW, copied) | static asset | file-I/O (copy, not import) | `public/essentials-logo-dark.svg` referenced via `logoSrc="/essentials-logo-dark.svg"` in `src/components/Layout.jsx:67` | exact (root-relative `public/` convention) |

## Pattern Assignments

### `src/lib/featureIcons.js` (NEW — utility/registry, transform)

**Analog:** `src/lib/buildingImages.js` (`getBuildingImages`, lines 484-531) for the tier-keyed-map shape; `treasury.js`'s resolver functions for the has-data-predicate style.

**Shape to copy** (`buildingImages.js:490` doc comment + return shape):
```javascript
/**
 * Get building images for each tier.
 * @param {string} representingCity - City name from politician data
 * @param {string} stateAbbrev - Two-letter state abbreviation (e.g., "IN", "CA")
 * @returns {{ Local: string, State: string, Federal: string }}
 */
export function getBuildingImages(representingCity, stateAbbrev) { /* ... */
  return { Local: localImage, State: stateImage, Federal: FEDERAL_IMAGE };
}
```
Mirror this exactly for `resolveFeatureIcons({ representingCity, userState, treasuryCities })` returning `{ Local: [...], State: [...], Federal: [...] }` (array of `{key, href, label}` per tier, per RESEARCH.md's recommended shape — see Architecture Patterns / Pattern 3 in RESEARCH.md for the registry-entry shape with `resolve(ctx)`). Each tier's array is empty (`[]`) when nothing resolves — `SectionBanner` should treat empty array the same as "no icons" (do not special-case null vs `[]`).

**has-data predicate style to copy** (`treasury.js:82-94`, the `.filter()` body of `findMatchingMunicipality`):
```javascript
const candidates = cities.filter((c) => {
  if (!c.available_datasets || c.available_datasets.length === 0) return false;
  if (wantState && (c.state || '').toUpperCase() !== wantState) return false;
  // ...
});
```
The new registry's `resolve()` for Treasury should call the (new) state/federal resolvers and the existing `findMatchingMunicipality`, returning `null` on no-match — never throw, never return a partial object.

**Import convention** — no barrel imports in this repo; direct relative paths, e.g.:
```javascript
import { findMatchingMunicipality, findStateTreasuryEntity, findFederalTreasuryEntity, toTreasurySlug, TREASURY_URL } from './treasury';
```

---

### `src/lib/featureIcons.test.js` (NEW — test)

**Analog:** `src/lib/treasury.test.js` (full file, 62 lines) — this repo's Vitest pure-logic convention (no jsdom, no React render, no `@testing-library`).

**Structure to copy** (imports + fixture + describe/it shape, `treasury.test.js:1-27`):
```javascript
import { describe, it, expect } from 'vitest';
import { findMatchingMunicipality, toTreasurySlug } from './treasury';

// Minimal slice of the live /treasury/cities shape (real duplicate-name data).
const ds = [{ fiscal_year: 2024, dataset_type: 'revenue' }];
const CITIES = [
  { name: 'Salem', state: 'MA', available_datasets: ds },
  // ...
];

describe('findMatchingMunicipality — state disambiguation', () => {
  it('renders NO match for a Utah city with no Utah treasury entity (Salem)', () => {
    expect(findMatchingMunicipality('Salem City Council', CITIES, 'UT')).toBeNull();
  });
  // ...
});
```
For `featureIcons.test.js`, build fixtures from the **real confirmed live records** in RESEARCH.md (Texas `state` entity, "United States" `federal` entity, Plano `municipality`-typed city) rather than inventing synthetic shapes — this matches the file's existing "real duplicate-name data" comment convention. Cover: registry order (treasury before any future compass/readrank stub), TETH-03 (empty `available_datasets` → omitted), and that only Treasury renders today.

---

### `src/lib/treasury.js` (MODIFY — add two new exported functions)

**Analog:** `findMatchingMunicipality` in the same file (lines 44-100) — same file, sibling function, do NOT modify it (RESEARCH.md Anti-Patterns / Pitfall 2 explicitly warns against extending it in-place).

**Exact new-function shape to add** (confirmed against live API data in RESEARCH.md; Texas `state` record and "United States" `federal` record already verified real):
```javascript
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

**Doc-comment convention to copy** (top of file, lines 1-37): JSDoc `@param`/`@returns` on every exported function; a one-line "Matches treasury-tracker/src/App.tsx §30" cross-repo-contract comment on `toTreasurySlug`. Follow this same cross-reference style if the new functions' logic depends on a live-API-confirmed shape (cite the RESEARCH.md live probe date, 2026-07-07).

**`toTreasurySlug` — reuse verbatim, do not reimplement** (lines 28-37):
```javascript
export function toTreasurySlug(city) {
  const name = city.name.toLowerCase().replace(/\s+/g, '-').replace(/[/?#]/g, '');
  const state = city.state.toLowerCase().replace(/[/?#]/g, '');
  return `${name}-${state}`;
}
```

**Open question flagged by RESEARCH.md (Pitfall 1):** `TREASURY_URL` is currently defined locally in `Results.jsx:34` as `import.meta.env.VITE_TREASURY_URL || 'https://treasurytracker.empowered.vote'`, but the CONTEXT-locked contract specifies `financials.empowered.vote`. If the planner centralizes `TREASURY_URL` as an export of `treasury.js` (recommended), add it near the top of the file alongside the other module-level constants, matching the existing `ENTITY_TYPE_WORDS` const style (line 65: a plain top-level `const`/`export const`).

---

### `src/lib/treasury.test.js` (MODIFY — extend)

**Analog:** same file's own existing `describe` block (lines 27-62).

**Pattern to copy** (fixture-array + `it()` per case, lines 12-25 + 36-40):
```javascript
const ds = [{ fiscal_year: 2024, dataset_type: 'revenue' }];
const CITIES = [ /* ...existing municipality fixtures... */ ];

it('matches a Utah city to its Utah entity and slugs as -ut', () => {
  const m = findMatchingMunicipality('Orem City Council', CITIES, 'UT');
  expect(m).toMatchObject({ name: 'Orem', state: 'UT' });
  expect(toTreasurySlug(m)).toBe('orem-ut');
});
```
Add a new `describe('findStateTreasuryEntity', ...)` and `describe('findFederalTreasuryEntity', ...)` block using the same `ds`/fixture-array style, extended with `entity_type: 'state'` / `entity_type: 'federal'` rows (mirror the real Texas/"United States" records captured in RESEARCH.md's Code Examples section) plus at least one no-match-returns-null case per function (TETH-03 regression guard, matching the existing "renders NO match" test naming convention at line 28).

---

### `src/components/SectionBanner.jsx` (MODIFY — fill the `featureIcons` scaffolding slot)

**Analog:** same file's existing `imageFailed`/`showImage` state pattern (lines 46-53) for the "graceful degradation, never show broken state" precedent; `src/components/IconOverlay.jsx`'s `IconWithTooltip` (lines 22-81) for the tooltip.

**Current inert slot to replace** (lines 44-46, 113-116):
```jsx
/**
 *   featureIcons  {array|null}               optional — scaffolding slot, renders nothing (BANR-04)
 */
export default function SectionBanner({ tier, locationName, imageUrl, stats, featureIcons }) {
  // ...
  {/* Scaffolding slots (BANR-04) — zero visual impact, DOM anchors for a later milestone */}
  {stats && <div className="sr-only" data-slot="stats" />}
  {featureIcons && <div className="sr-only" data-slot="feature-icons" />}
}
```
Replace the `featureIcons &&` line with a real render: map `featureIcons` (array of `{key, href, label, iconSrc}`) to circular chips, bottom-right (`position: absolute; bottom: 16px; right: 16px` or similar, mirroring the title block's own `position: absolute; bottom: 0` pattern at lines 95-98), each wrapped in an `<a target="_blank" rel="noopener noreferrer">` + the `IconWithTooltip` interaction hooks. If `featureIcons` is `[]` or falsy, render nothing (`{featureIcons?.length > 0 && (...)}`) — matches this file's existing `showImage`/ternary graceful-fallback idiom rather than throwing or rendering a placeholder.

**Tooltip pattern to copy/adapt** (`IconOverlay.jsx:22-81` — full function, reproduced above in Context). Key adaptation for the banner: swap the bare `<span>` reference element for an `<a href={icon.href} target="_blank" rel="noopener noreferrer">` so it is a real link (D-08 requires `aria-label` on the *link*, not just a decorative span), and wrap the icon `<img src={icon.iconSrc}>` (SVG from `public/`) inside a circular semi-transparent chip `<div>` (D-05) rather than IconOverlay's bare icon-with-padding treatment — the banner's chip needs its own background layer since `treasury-symbol.svg` has no dark variant (RESEARCH.md Pitfall 3).

**Color/token convention** (file header comment, lines 12-14, and `locationName` block lines 99-107): all colors trace to `src/index.css` `@theme` tokens, e.g. `color: 'var(--color-ev-text-primary)'` — do not hardcode hex for anything that has a token; `IconOverlay.jsx`'s tooltip chrome (lines 64-65) uses raw hex (`#2F3237`/`#EBEDEF`) since `IconOverlay` is not itself token-bound — for `SectionBanner`'s new tooltip, prefer the `@theme` token equivalents per DARK-01 if one exists, falling back to the same raw hex only if no token covers it.

---

### `src/pages/Results.jsx` (MODIFY — resolve `featureIconMap`, pass to 3 `<SectionBanner>` + `<ElectionsView>`)

**Analog:** same file's own `buildingImageMap` `useMemo` (lines 1132-1135) and its 3 `<SectionBanner>` call sites (lines 1937-1954).

**Exact precedent to copy** (lines 1132-1135):
```javascript
const buildingImageMap = useMemo(
  () => getBuildingImages(representingCity, userState),
  [representingCity, userState]
);
```
Add an analogous `featureIconMap` `useMemo`, additionally depending on `treasuryCities` (already fetched at line 531-532: `const [treasuryCities, setTreasuryCities] = useState([]); useEffect(() => { fetchTreasuryCities().then(setTreasuryCities); }, []);` — reuse this existing state, do not add a second fetch):
```javascript
const featureIconMap = useMemo(
  () => resolveFeatureIcons({ representingCity, userState, treasuryCities }),
  [representingCity, userState, treasuryCities]
);
```

**`<SectionBanner>` call sites to extend** (lines 1937-1954, verbatim from live file):
```jsx
const tierBanner = tier === 'Local'
  ? <SectionBanner
      tier="city"
      locationName={representingCity && userState ? `${representingCity}, ${userState}` : (representingCity || 'Your City')}
      imageUrl={buildingImageMap.Local}
    />
  : tier === 'State'
  ? <SectionBanner
      tier="state"
      locationName={(userState && STATE_NAMES[userState]) || userState || 'Your State'}
      imageUrl={buildingImageMap.State}
    />
  : tier === 'Federal'
  ? <SectionBanner
      tier="federal"
      locationName="United States"
      imageUrl={buildingImageMap.Federal}
    />
  : null;
```
Add `featureIcons={featureIconMap.Local}` / `.State` / `.Federal` to each call, exactly mirroring how `imageUrl={buildingImageMap.X}` is already threaded — same prop-per-tier shape, zero new plumbing pattern.

**`<ElectionsView>` call site to extend** (around line 2054, `<ElectionsView elections={...} ... />` — already receives `representingCity`, `userState` per RESEARCH.md's confirmation that no new location-derivation is needed): add `featureIconMap={featureIconMap}` alongside however `buildingImageMap` is already passed to it (verify the exact existing prop name/line when passing — confirmed `ElectionsView` declares `buildingImageMap = {}` as a prop at line 285 of `ElectionsView.jsx`, so `Results.jsx` must already pass it near the `<ElectionsView ...>` JSX — add the new prop at that same call site).

**Existing per-body Treasury deep-link (reference only, do not change)** — `Results.jsx:1981-1996`:
```jsx
{treasuryMatch && (
  <div className="mb-3">
    <a
      href={`${TREASURY_URL}/?entity=${toTreasurySlug(treasuryMatch)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-[#00657c] hover:text-[#004d5c] dark:text-[#00c8d7] dark:hover:text-[#7ec8d8] transition-colors"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      Explore {treasuryMatch.name} revenue and expenses
      {/* external-link chevron SVG */}
    </a>
  </div>
)}
```
This is the proven `TREASURY_URL` + `toTreasurySlug` + `target="_blank" rel="noopener noreferrer"` idiom — the new banner icon's `<a>` should use the identical `target`/`rel` attributes. Note the `bodyState` derivation immediately above it (lines 1968-1970) is the existing "prefer the body's own politicians' state; fall back to view state" disambiguation logic — the city-tier `featureIcons` resolver should reuse this exact state-derivation approach (or the resolved `treasuryMatch`/`bodyState` values directly) rather than re-deriving state a third way.

**`TREASURY_URL` definition** (line 34): `const TREASURY_URL = import.meta.env.VITE_TREASURY_URL || 'https://treasurytracker.empowered.vote';` — see Shared Patterns below for the domain-centralization decision this phase must make.

---

### `src/components/ElectionsView.jsx` (MODIFY — drill `featureIconMap` prop through to its own 3 `<SectionBanner>` calls)

**Analog:** same file's own `buildingImageMap` prop (declared at line 285) and its 3 `<SectionBanner>` calls (lines 576-594).

**Exact precedent to copy** (prop declaration, line 277-289):
```javascript
export default function ElectionsView({
  elections,
  loading,
  tierFilter = 'All',
  hideWithdrawn = false,
  compassMode = false,
  onCandidateClick,
  isDark = false,
  buildingImageMap = {},
  representingCity = null,
  userState = null,
  stateNames = {},
}) {
```
Add `featureIconMap = {}` to this destructured prop list, same default-empty-object idiom as `buildingImageMap = {}`.

**`<SectionBanner>` call sites to extend** (lines 576-594, verbatim from live file):
```jsx
const banner = tier === 'Local'
  ? <SectionBanner
      tier="city"
      locationName={representingCity && userState ? `${representingCity}, ${userState}` : (representingCity || 'Your City')}
      imageUrl={buildingImageMap?.Local}
    />
  : tier === 'State'
  ? <SectionBanner
      tier="state"
      locationName={(userState && stateNames?.[userState]) || userState || 'Your State'}
      imageUrl={buildingImageMap?.State}
    />
  : tier === 'Federal'
  ? <SectionBanner
      tier="federal"
      locationName="United States"
      imageUrl={buildingImageMap?.Federal}
    />
  : null;
```
Add `featureIcons={featureIconMap?.Local}` / `?.State` / `?.Federal` to each — note this file already uses optional-chaining (`buildingImageMap?.Local`) unlike `Results.jsx`'s non-optional `buildingImageMap.Local` (Results.jsx guarantees the memo always returns an object; `ElectionsView` defends against a caller that doesn't pass the prop at all) — follow `ElectionsView`'s own optional-chaining convention for `featureIconMap?.X` here, for consistency within this file.

---

### Icon asset: `public/treasury-symbol.svg` (NEW — copied static asset)

**Analog:** `public/essentials-logo-dark.svg` / `essentials-logo-light.svg`, referenced in `src/components/Layout.jsx:67`:
```jsx
logoSrc={isDark ? "/essentials-logo-dark.svg" : "/essentials-logo-light.svg"}
```
Confirmed `public/` directory listing (repo root) already contains `EVLogo.svg`, `essentials-logo-dark.svg`, `essentials-logo-light.svg`, plus favicon PNGs — all referenced by root-relative path (`/xyz.svg`), never via a JS `import`. Copy `C:/ev-landing/ev-landing-main/icons/treasury-symbol.svg` into this repo's `public/` directory (e.g. `public/treasury-symbol.svg`) and reference it as `/treasury-symbol.svg` in `featureIcons.js`'s registry entry (`iconSrc: '/treasury-symbol.svg'`). Do NOT copy `compass-symbol-*` or `readrank-symbol-*` yet — no per-location contract exists for those products this phase (D-02).

## Shared Patterns

### Accessible hover+focus tooltip (`@floating-ui/react`)
**Source:** `src/components/IconOverlay.jsx:1-81` (full `IconWithTooltip` implementation)
**Apply to:** `src/components/SectionBanner.jsx`'s new chip-tooltip rendering
```jsx
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
```
Already installed (`@floating-ui/react ^0.27.19`), already imported the same way elsewhere — import path is the bare package name, no path alias:
```javascript
import { useFloating, useHover, useFocus, useDismiss, useRole, useInteractions, FloatingPortal, offset, flip, shift, autoUpdate } from '@floating-ui/react';
```

### Parent-resolved, prop-drilled per-tier data
**Source:** `src/lib/buildingImages.js` (`getBuildingImages`) + `src/pages/Results.jsx:1132-1135` (`useMemo`) + `src/components/ElectionsView.jsx:285` (prop declaration)
**Apply to:** `featureIconMap` computation/threading — resolve once per tier in `Results.jsx`, pass directly to its own 3 `<SectionBanner>` calls, and drill a single new prop through to `ElectionsView`'s own 3 `<SectionBanner>` calls. Confirmed both call sites already receive identical `representingCity`/`userState` (no divergence to reconcile in this phase, per RESEARCH.md Summary point 2).

### Treasury deep-link construction (slug + URL)
**Source:** `src/lib/treasury.js:28-37` (`toTreasurySlug`) + `src/pages/Results.jsx:1984` (existing text-link `href`)
**Apply to:** the new icon's `href` — reuse `toTreasurySlug()` verbatim for all three tiers (city/state/federal all use the identical `${name}-${state}` algorithm, confirmed byte-identical to Treasury Tracker's own `toSlug()`). Do not hand-roll a second slug function.
```javascript
href={`${TREASURY_URL}/?entity=${toTreasurySlug(entity)}`}
```
**Open decision (not yet resolved in code):** `TREASURY_URL` currently defaults to `treasurytracker.empowered.vote` (`Results.jsx:34`) but CONTEXT/REQUIREMENTS lock `financials.empowered.vote` for the new icon contract. The planner must decide: (a) hardcode `financials.empowered.vote` for the new icon only, or (b) centralize+update the `TREASURY_URL` constant in `treasury.js` and reuse it for both the existing text link and the new icon (RESEARCH.md's recommendation — fixes the inconsistency for free). Either way, whichever file ends up owning the constant should export it so both `Results.jsx`'s existing text link and the new `featureIcons.js` registry import the same value — no second hardcoded domain string.

### Dark-mode-only styling via CSS custom properties
**Source:** `src/components/SectionBanner.jsx:12-14` (file header) + `:99-107` (title block using `var(--color-ev-text-primary)`, `var(--font-display)`)
**Apply to:** any new chip/tooltip styling added to `SectionBanner.jsx` — trace colors/fonts to `src/index.css` `@theme` tokens, no `!important` (first-party component, not an `ev-ui` override — that constraint is specific to a different memory item about `ev-ui` dark-mode overrides, not applicable here).

## No Analog Found

None. Every file in this phase's scope has a direct, verified analog already in the codebase (confirmed by direct `Read` of each source file listed above, not inferred).

## Metadata

**Analog search scope:** `src/lib/`, `src/components/`, `src/pages/Results.jsx`, `public/` (root)
**Files read in full or by targeted range:** `SectionBanner.jsx`, `SectionBanner.test.js`, `treasury.js`, `treasury.test.js`, `IconOverlay.jsx`, `buildingImages.js`, `Results.jsx` (lines 1125-1140, 1900-2060), `ElectionsView.jsx` (lines 270-330, 565-605), `public/` directory listing, `Layout.jsx` (logoSrc line)
**Pattern extraction date:** 2026-07-07

---

*Phase: 187-tethered-feature-icon-row*
