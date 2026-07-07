# Phase 188: Location Stats Strip - Pattern Map

**Mapped:** 2026-07-07
**Files analyzed:** 8 (3 new source, 1 new generator, 1 new test, 4 modified)
**Analogs found:** 8 / 8

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|--------------------|------|-----------|-----------------|----------------|
| `scripts/gen-population.mjs` | utility (build-time generator) | batch / file-I/O (fetch → write JS module) | `scripts/lausd-headshots/download.js` (Node script family) + RESEARCH.md's verified Census mechanics | role-match (language/shape differs: CJS→ESM, no committed Node data-generator precedent exists yet) |
| `src/data/population.js` | config/data module | static lookup table | `src/lib/buildingImages.js` (`STATE_FIPS_TO_ABBREV`, `CURATED_LOCAL`, `STATE_PANORAMAS` — committed static maps with header-comment provenance) | role-match (no `src/data/` dir exists yet; `buildingImages.js` is the closest "big committed lookup table" precedent) |
| `src/lib/population.js` (`resolvePopulation`) | service/utility (pure resolver) | transform (identity → number \| null) | `src/lib/featureIcons.js` (`resolveFeatureIcons`) — same tier-fan-out, same graceful-omit contract | exact (same shape: `{tier, representingCity/userState} → per-tier result`, null-on-miss) |
| `src/lib/buildingImages.js` (MODIFY: export `STATE_FIPS_TO_ABBREV`) | config/data module | transform | itself (add one keyword) | exact |
| `src/components/SectionBanner.jsx` (MODIFY: render `stats` scrim) | component (presentational) | request-response (render props → DOM) | itself — `FeatureIconChip` scrim styling + `featureIcons?.length > 0 &&` conditional idiom (same file, Phase 187 precedent) | exact |
| `src/pages/Results.jsx` (MODIFY: compute + pass `stats`) | page/parent (data orchestration) | transform (identity vars → resolved prop) | itself — `buildingImageMap` / `featureIconMap` `useMemo` blocks (same file, lines 1140-1148) | exact |
| `src/components/ElectionsView.jsx` (MODIFY: accept + pass `stats` prop) | component (presentational, prop pass-through) | request-response | itself — existing `buildingImageMap`/`featureIconMap` prop pass-through to its own `SectionBanner` calls | exact |
| `src/lib/population.test.js` | test | pure-logic unit test | `src/lib/featureIcons.test.js` (fixture-based, no jsdom, tests a resolver with the exact same tier/omit contract) | exact |

## Pattern Assignments

### `scripts/gen-population.mjs` (utility, build-time file-I/O)

**Analog:** `scripts/lausd-headshots/download.js` (structure/CLI-script conventions) — but note this analog is **CommonJS** (`require`), while the repo's `package.json:5` sets `"type": "module"`, so the new generator must be genuine ESM (`import`, top-level `await`), matching RESEARCH.md's `Code Examples` section exactly. There is no existing committed Node *data*-generator in this repo (all `scripts/*.js` are image-fetch scripts); RESEARCH.md's own "Generator core (Node ESM)" code block is the primary source to copy since no closer analog exists.

**Script shape pattern** (mirror `download.js`'s structure: constants block → helper function(s) → `async function main()` → `main().catch(...)`), from `scripts/lausd-headshots/download.js:22-134`:
```js
const STORAGE_BASE = '...';
const SOURCES = [ /* ... */ ];

function downloadFile(url, destPath) { /* promise-wrapped fetch/write */ }

async function main() {
  if (!fs.existsSync(RAW_DIR)) fs.mkdirSync(RAW_DIR, { recursive: true });
  for (const src of SOURCES) {
    try { await downloadFile(src.url, destPath); /* log success */ }
    catch (err) { console.error(`  ERROR: ${err.message}`); }
  }
}
main().catch(console.error);
```

**Fail-fast + fetch pattern** (from RESEARCH.md `Code Examples`, ESM-adapted — this is the concrete code to write, no closer real-repo analog exists):
```js
// scripts/gen-population.mjs
const KEY = process.env.CENSUS_API_KEY;
if (!KEY) { console.error('Set CENSUS_API_KEY (free: api.census.gov/data/key_signup.html)'); process.exit(1); }
const BASE = 'https://api.census.gov/data/2023/acs/acs5';
const V = 'B01003_001E';
async function pull(qs) {
  const res = await fetch(`${BASE}?get=NAME,${V}&${qs}&key=${KEY}`);
  const rows = await res.json();            // [header, ...data]
  return rows.slice(1);                     // drop header
}
const places = await pull('for=place:*&in=state:*'); // cols: NAME, pop, state, place
const states = await pull('for=state:*');            // cols: NAME, pop, state
const us     = await pull('for=us:1');               // cols: NAME, pop, us
```

**Fail-fast row-count assertions** (Pitfall 1, no existing repo precedent for this specific check — write per RESEARCH.md): assert `places.length > 20000` and `states.length >= 50` before writing the file; never write a bundle from a short/error response.

**Output-file header-comment provenance pattern** — mirror `buildingImages.js`'s own header-comment convention (file docblock lines 1-9, plus inline dated batch-provenance comments like lines 170-181, 242-248) when writing `src/data/population.js`'s auto-generated header (vintage, regen date, row counts, regen command) — do NOT skip this; it's an established repo convention for committed data files.

---

### `src/data/population.js` (data module, static lookup)

**Analog:** `src/lib/buildingImages.js` — the closest precedent for "large, committed, string-keyed lookup table with a provenance header comment."

**Structural pattern to mirror** (`buildingImages.js:1-9` file docblock + `buildingImages.js:66-75` map shape):
```js
/**
 * Building image mapping for Essentials tier sections.
 * ...
 */
const STATE_FIPS_TO_ABBREV = {
  '01': 'AL', '02': 'AK', '04': 'AZ', /* ... string keys, leading zeros preserved */
};
```

**Bundle shape to write** (from RESEARCH.md `Bundle Shape (D-03)` — copy verbatim as the target structure; no real-repo analog for a two-structure FIPS+name-index bundle exists, `buildingImages.js` only has the FIPS→abbrev half):
```js
// AUTO-GENERATED by scripts/gen-population.mjs — DO NOT EDIT BY HAND.
export const POP_BY_FIPS = {
  "US": 334914895,
  "48": 30503301,
  "0644000": 3898747,
  // ...~32k place rows
};
export const NAME_STATE_TO_FIPS = {
  "plano|TX": "4858016",
  // ...
};
```

**Critical key-format rule** (mirrored from `buildingImages.js:85-89`'s string-slicing convention — never coerce FIPS to a number): keys are strings with leading zeros preserved (`"06"`, `"0644000"`), exactly like `stateAbbrevFromGeoId`'s `String(geoId || '').trim()` + `.slice(0,2)` pattern:
```js
// buildingImages.js:85-89
export function stateAbbrevFromGeoId(geoId) {
  const s = String(geoId || '').trim();
  if (!/^\d{2}/.test(s)) return null;
  return STATE_FIPS_TO_ABBREV[s.slice(0, 2)] || null;
}
```

---

### `src/lib/population.js` — `resolvePopulation()` (service, pure transform)

**Analog:** `src/lib/featureIcons.js` — `resolveFeatureIcons()`. Same architectural role: pure function, no I/O, takes a location-identity context object, returns per-tier resolved data, omits (returns falsy/empty) on any miss rather than a placeholder.

**Imports pattern** (mirror `featureIcons.js:1-8`'s named-import-from-sibling-lib style):
```js
// src/lib/featureIcons.js:1-8
import {
  findMatchingMunicipality,
  findStateTreasuryEntity,
  findFederalTreasuryEntity,
  toTreasurySlug,
  TREASURY_URL,
} from './treasury';
```
Apply the same style for `population.js`:
```js
import { POP_BY_FIPS, NAME_STATE_TO_FIPS } from '../data/population.js';
import { STATE_FIPS_TO_ABBREV } from './buildingImages.js'; // must be EXPORTED first
```

**Derived-inverse-map-once pattern** — no existing repo example of inverting a map at module scope; write per RESEARCH.md (this is genuinely new but trivial `Object.fromEntries`):
```js
const ABBREV_TO_STATE_FIPS = Object.fromEntries(
  Object.entries(STATE_FIPS_TO_ABBREV).map(([fips, abbrev]) => [abbrev, fips])
);
```

**Core resolver pattern** — mirror `resolveFeatureIcons`'s tier-branch structure (`featureIcons.js:61-82`, condensed to the essential tier-switch idiom used across `resolve()` in `PRODUCT_REGISTRY`, `featureIcons.js:26-34`):
```js
// featureIcons.js:26-34 — the tier-branch idiom to mirror
resolve({ tier, representingCity, userState, treasuryCities }) {
  let entity = null;
  if (tier === 'city') {
    entity = findMatchingMunicipality(representingCity, treasuryCities, userState);
  } else if (tier === 'state') {
    entity = findStateTreasuryEntity(userState, treasuryCities);
  } else if (tier === 'federal') {
    entity = findFederalTreasuryEntity(treasuryCities);
  }
  if (!entity) return null;
  // ...
}
```
Adapted for `resolvePopulation` (target shape, from RESEARCH.md):
```js
export function resolvePopulation({ tier, geoId, city, stateAbbrev } = {}) {
  let fips = null;
  if (tier === 'federal') {
    fips = 'US';
  } else if (tier === 'state') {
    fips = ABBREV_TO_STATE_FIPS[(stateAbbrev || '').toUpperCase()] || null;
  } else if (tier === 'city') {
    if (geoId && POP_BY_FIPS[String(geoId)] != null) {
      fips = String(geoId);
    } else if (city && stateAbbrev) {
      fips = NAME_STATE_TO_FIPS[`${city.toLowerCase()}|${stateAbbrev.toUpperCase()}`] || null;
    }
  }
  const pop = fips != null ? POP_BY_FIPS[fips] : null;
  return typeof pop === 'number' && pop > 0 ? pop : null;
}
```

**Name+state normalization to mirror exactly** (`buildingImages.js:490-492` — do NOT re-derive a different casing convention):
```js
export function getBuildingImages(representingCity, stateAbbrev) {
  const city = (representingCity || '').toLowerCase();
  const abbrev = (stateAbbrev || '').toUpperCase();
  // ...
```

**Graceful-omit contract** — matches both `resolveFeatureIcons`'s `if (icon) result[mapKey].push(icon)` (never push null) and `SectionBanner`'s `imageFailed` posture (`SectionBanner.jsx:149-153`): return `null` on any miss, never `0`/`NaN`/a placeholder string.

---

### `src/lib/buildingImages.js` (MODIFY — export `STATE_FIPS_TO_ABBREV`)

**Analog:** itself. Single-line change.

**Current (private) declaration** (`buildingImages.js:66-75`):
```js
/** US Census FIPS state code (the 2-digit prefix of a geo_id) → 2-letter abbreviation. */
const STATE_FIPS_TO_ABBREV = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT',
  ...
};
```
**Change:** add `export` before `const STATE_FIPS_TO_ABBREV`. No other change to this file. `stateAbbrevFromGeoId` (already exported, lines 85-89) is unaffected and can still be reused as-is if ever needed.

---

### `src/components/SectionBanner.jsx` (MODIFY — render the `stats` scrim)

**Analog:** itself — the `FeatureIconChip` scrim (Phase 187, same file) is the visual-treatment precedent, and the `featureIcons?.length > 0 &&` conditional block is the exact idiom to mirror for the new stats block.

**Current inert slot to replace** (`SectionBanner.jsx:213-214`):
```jsx
{/* Scaffolding slot (BANR-04) — zero visual impact, DOM anchor for a later milestone (Phase 188) */}
{stats && <div className="sr-only" data-slot="stats" />}
```

**Conditional-render idiom to mirror** (`SectionBanner.jsx:216-235` — the feature-icon row; copy this `data-slot` + guarded-render + absolute-positioned-flex-row structure, adapting to a flex *column*, right-aligned, top-right instead of bottom-right):
```jsx
{featureIcons?.length > 0 && (
  <div
    data-slot="feature-icons"
    style={{
      position: 'absolute',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    }}
  >
    {featureIcons.map((icon) => (
      <FeatureIconChip key={icon.key} icon={icon} />
    ))}
  </div>
)}
```

**Scrim styling to copy verbatim** (`FeatureIconChip`'s chip background, `SectionBanner.jsx:89-101` — same `rgba(13, 17, 23, 0.55)` + `blur(2px)` literal, per D-11/UI-SPEC "same treatment family"):
```jsx
style={{
  ...
  background: 'rgba(13, 17, 23, 0.55)',
  backdropFilter: 'blur(2px)',
}}
```

**New render block** (per UI-SPEC — locked values, do not deviate):
```jsx
{typeof stats?.value === 'number' && stats.value > 0 && (
  <div data-slot="stats" style={{ position:'absolute', top:'16px', right:'16px',
    display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px',
    background:'rgba(13,17,23,0.55)', backdropFilter:'blur(2px)',
    borderRadius:'10px', padding:'4px 12px' }}>
    <span style={{ fontFamily:'var(--font-sans)', fontSize:'11px', fontWeight:600,
      lineHeight:'13px', letterSpacing:'1px', textTransform:'uppercase',
      color:'var(--color-ev-text-muted)' }}>{stats.label}</span>
    <span style={{ fontFamily:'var(--font-sans)', fontSize:'20px', fontWeight:700,
      lineHeight:'22px', color:'var(--color-ev-text-primary)' }}>
      {stats.value.toLocaleString()}
    </span>
  </div>
)}
```

**Graceful-fallback posture precedent** (`imageFailed`, `SectionBanner.jsx:148-153`) — the philosophical analog for "absence renders cleanly":
```jsx
const [imageFailed, setImageFailed] = useState(false);
useEffect(() => { setImageFailed(false); }, [imageUrl]);
const showImage = Boolean(imageUrl) && !imageFailed;
```
The stats block does not need this stateful pattern (it's a synchronous data-guard, not an async image-load guard) — the `typeof stats?.value === 'number' && stats.value > 0` predicate alone suffices, but it embodies the same "never show broken/partial UI" principle.

**Props docblock to update** (`SectionBanner.jsx:140` — currently documents `stats` as inert scaffolding; update the comment to describe the real `{label, value}` contract).

---

### `src/pages/Results.jsx` (MODIFY — compute + pass `stats`)

**Analog:** itself — `buildingImageMap` / `featureIconMap` `useMemo` blocks (lines 1140-1148) are the exact pattern to replicate for a `populationMap` (or three separate `cityStat`/`stateStat`/`federalStat` values).

**Import line to extend** (`Results.jsx:16` — add `resolvePopulation` alongside the existing `buildingImages` import, and add a new import for `population.js`):
```js
// Results.jsx:16 (existing)
import { getBuildingImages, parseStateFromAddress, parseCityFromAddress, stateAbbrevFromGeoId } from '../lib/buildingImages';
// Results.jsx:33 (existing, same pattern)
import { resolveFeatureIcons } from '../lib/featureIcons';
```
Add: `import { resolvePopulation } from '../lib/population';`

**`useMemo` pattern to mirror exactly** (`Results.jsx:1140-1148`):
```js
const buildingImageMap = useMemo(
  () => getBuildingImages(representingCity, userState),
  [representingCity, userState]
);

const featureIconMap = useMemo(
  () => resolveFeatureIcons({ representingCity, userState, treasuryCities }),
  [representingCity, userState, treasuryCities]
);
```
New block (mirror shape, add `searchParams.get('browse_geo_id')` for the city-tier geoId per D-05):
```js
const populationMap = useMemo(() => {
  const cityPop = resolvePopulation({
    tier: 'city',
    geoId: searchParams.get('browse_geo_id'),
    city: representingCity,
    stateAbbrev: userState,
  });
  const statePop = resolvePopulation({ tier: 'state', stateAbbrev: userState });
  const federalPop = resolvePopulation({ tier: 'federal' });
  return {
    Local: cityPop != null ? { label: 'POPULATION', value: cityPop } : null,
    State: statePop != null ? { label: 'POPULATION', value: statePop } : null,
    Federal: federalPop != null ? { label: 'POPULATION', value: federalPop } : null,
  };
}, [representingCity, userState, searchParams]);
```

**`representingCity`/`userState` identity source** (already-computed variables to reuse, do not re-derive) — `Results.jsx:1071-1100` (`representingCity`) and `:1104-1138` (`userState`); `browse_geo_id` read at `:386` and `:823` via `searchParams.get('browse_geo_id')`.

**`<SectionBanner>` call-site pattern to extend** (`Results.jsx:1950-1970` — add a `stats` prop next to the existing `imageUrl`/`featureIcons` props at all three tier branches):
```jsx
const tierBanner = tier === 'Local'
  ? <SectionBanner
      tier="city"
      locationName={representingCity && userState ? `${representingCity}, ${userState}` : (representingCity || 'Your City')}
      imageUrl={buildingImageMap.Local}
      featureIcons={featureIconMap.Local}
    />
  : tier === 'State'
  ? <SectionBanner
      tier="state"
      locationName={(userState && STATE_NAMES[userState]) || userState || 'Your State'}
      imageUrl={buildingImageMap.State}
      featureIcons={featureIconMap.State}
    />
  : tier === 'Federal'
  ? <SectionBanner
      tier="federal"
      locationName="United States"
      imageUrl={buildingImageMap.Federal}
      featureIcons={featureIconMap.Federal}
    />
  : null;
```
Add `stats={populationMap.Local}` / `stats={populationMap.State}` / `stats={populationMap.Federal}` to the respective blocks.

**`<ElectionsView>` prop hand-off pattern to extend** (`Results.jsx:2082-2086` — add `populationMap` alongside the existing maps):
```jsx
<ElectionsView
  elections={nearestElection}
  ...
  buildingImageMap={buildingImageMap}
  featureIconMap={featureIconMap}
  representingCity={representingCity}
  userState={userState}
  stateNames={STATE_NAMES}
/>
```
Add: `populationMap={populationMap}`.

---

### `src/components/ElectionsView.jsx` (MODIFY — accept + pass `stats` prop)

**Analog:** itself — the existing `buildingImageMap`/`featureIconMap` prop-destructure and pass-through to its own `<SectionBanner>` calls is the exact pattern.

**Signature to extend** (`ElectionsView.jsx:277-290`):
```jsx
export default function ElectionsView({
  elections,
  loading,
  tierFilter = 'All',
  hideWithdrawn = false,
  compassMode = false,
  onCandidateClick,
  isDark = false,
  buildingImageMap = {},
  featureIconMap = {},
  representingCity = null,
  userState = null,
  stateNames = {},
}) {
```
Add `populationMap = {}` to the destructure.

**`<SectionBanner>` call sites to extend** (`ElectionsView.jsx:577-598` — identical structure to `Results.jsx`'s, add `stats={populationMap?.Local}` etc.):
```jsx
const banner = tier === 'Local'
  ? <SectionBanner
      tier="city"
      locationName={representingCity && userState ? `${representingCity}, ${userState}` : (representingCity || 'Your City')}
      imageUrl={buildingImageMap?.Local}
      featureIcons={featureIconMap?.Local}
    />
  : tier === 'State'
  ? <SectionBanner
      tier="state"
      locationName={(userState && stateNames?.[userState]) || userState || 'Your State'}
      imageUrl={buildingImageMap?.State}
      featureIcons={featureIconMap?.State}
    />
  : tier === 'Federal'
  ? <SectionBanner
      tier="federal"
      locationName="United States"
      imageUrl={buildingImageMap?.Federal}
      featureIcons={featureIconMap?.Federal}
    />
  : null;
```
**Note:** `ElectionsView.jsx` does NOT independently read `browse_geo_id` or the router (`Results.jsx:2082-2086` confirms it only receives props). This is why `populationMap` must be fully resolved in `Results.jsx` and passed down — `ElectionsView` stays a pure pass-through, never re-deriving the city-tier geo_id lookup itself.

---

### `src/lib/population.test.js` (test, pure-logic unit)

**Analog:** `src/lib/featureIcons.test.js` — same fixture-based, no-jsdom, resolver-testing convention; also cross-check `src/components/SectionBanner.test.js` for the "test a named export, not DOM" convention used on the same target file.

**File-header convention to mirror** (`featureIcons.test.js:1-9`):
```js
/**
 * Tests for featureIcons.js — product registry + resolveFeatureIcons.
 * Pure-logic only (no jsdom, no React render), matching this repo's Vitest
 * convention (see treasury.test.js / SectionBanner.test.js).
 *
 * Fixtures mirror the real live /treasury/cities records confirmed in
 * 187-RESEARCH.md (probed 2026-07-07): ...
 */

import { describe, it, expect } from 'vitest';
import { PRODUCT_REGISTRY, resolveFeatureIcons } from './featureIcons';
```

**Fixture-injection pattern to mirror** (`featureIcons.test.js:15-21` — do NOT import the real ~700KB generated bundle; build a small in-test fixture map instead, exactly as `CITIES` is a small in-test array standing in for the real `/treasury/cities` data):
```js
const ds = [{ fiscal_year: 2024, dataset_type: 'revenue' }];
const CITIES = [
  { name: 'Texas', state: 'TX', entity_type: 'state', available_datasets: ds },
  { name: 'United States', state: 'US', entity_type: 'federal', available_datasets: ds },
  { name: 'Plano', state: 'TX', entity_type: 'municipality', available_datasets: ds },
];
```
For `population.test.js`, inject a tiny `POP_BY_FIPS`/`NAME_STATE_TO_FIPS` fixture — `resolvePopulation` must accept injected maps (or be tested via a factory/DI seam) rather than importing the real generated bundle. If the RESEARCH.md reference implementation hardcodes the import from `../data/population.js`, the planner should add a way to inject test fixtures (e.g. export a `resolvePopulationWith(maps, loc)` inner function, or keep `population.js` importing the real bundle but test only via a handful of known-stable rows) — **decide and document this seam explicitly in the plan**, since RESEARCH.md's Wave-0 gap note flags exactly this: "do not import the ~700KB real bundle into tests — inject or fixture the maps."

**Assertion-style pattern to mirror** (`featureIcons.test.js:35-55`, `66-76` — one `describe` per exported function, one `it` per tier/scenario, explicit omit-case tests):
```js
describe('resolveFeatureIcons', () => {
  it('resolves Local/State/Federal treasury icons for a matching location', () => { ... });
  it('omits the icon entirely for a tier with no matching entity (TETH-03) — never a null/placeholder entry', () => {
    const result = resolveFeatureIcons({ representingCity: 'Nowheresville', userState: 'ZZ', treasuryCities: CITIES });
    expect(result.Local).toEqual([]);
    expect(result.State).toEqual([]);
    expect(result.Federal).toHaveLength(1); // Federal is location-independent
  });
});
```
Adapt for `resolvePopulation`'s required test matrix (per RESEARCH.md's Phase Requirements → Test Map): federal always resolves; state abbrev→FIPS resolves; city geo_id path resolves (primary); city name+state index path resolves (fallback); unknown geo_id/bad abbrev/missing city → `null`; population `0`/`NaN`/non-number → `null`.

**`SectionBanner.test.js` convention cross-check** (`SectionBanner.test.js:1-10`) — confirms the repo tests `SectionBanner.jsx`'s pure exports (`FALLBACK_GRADIENTS`) directly, never renders the component. If the render-guard predicate (`typeof stats?.value === 'number' && stats.value > 0`) needs its own unit coverage, extract it as a named exported pure function (e.g. `shouldRenderStat(stats)`) from `SectionBanner.jsx`, exactly as `FALLBACK_GRADIENTS` is exported and tested — do not add a jsdom/React-render test for this component (would break repo convention).

---

## Shared Patterns

### Tier-fan-out resolver contract
**Source:** `src/lib/featureIcons.js` (`resolveFeatureIcons`) and `src/lib/buildingImages.js` (`getBuildingImages`)
**Apply to:** `src/lib/population.js`
Both existing resolvers take `{representingCity, userState, ...}` and return a `{Local, State, Federal}`-shaped (or tier-branch) result, with per-tier omission on miss (empty array / `null`) rather than a placeholder. `resolvePopulation` should be call-compatible with this family so `Results.jsx` can compute all three tiers with the same `useMemo` idiom used for the other two maps.

### Graceful-omit / no-placeholder posture
**Source:** `src/components/SectionBanner.jsx:148-153` (`imageFailed`) and `src/lib/featureIcons.js:35` (`if (!entity) return null;`) and `featureIcons.test.js:66-76` (explicit omit-case test)
**Apply to:** `resolvePopulation()`, the `populationMap` construction in `Results.jsx`, and the render guard in `SectionBanner.jsx`
Never render/return `0`, `NaN`, `undefined`-with-a-label, or a "no data" placeholder — the entire feature must vanish silently on miss (STAT-03), matching the codebase's established philosophy for missing banner art and missing feature icons.

### Committed-static-lookup-with-provenance-header pattern
**Source:** `src/lib/buildingImages.js` (file docblock + dated inline batch comments throughout, e.g. lines 1-9, 105-155, 242-280)
**Apply to:** `src/data/population.js`
Every large committed lookup table in this repo carries a header comment explaining source/provenance/regeneration; `population.js`'s auto-generated header (vintage, regen date, row counts, regen command) continues this convention.

### Parent-resolves-child-renders (presentational component) pattern
**Source:** `src/pages/Results.jsx:1140-1148` computing `buildingImageMap`/`featureIconMap`, then `Results.jsx:2082-2086` passing them to `ElectionsView`, which passes them straight through at `ElectionsView.jsx:577-598` to its own `<SectionBanner>` calls
**Apply to:** the new `populationMap` — resolve once in `Results.jsx`, thread through `ElectionsView` as a prop, keep `SectionBanner.jsx` a pure presentational consumer of `stats`. This is also explicitly the RESEARCH.md-recommended approach and sets up Phase 189's shared-component consolidation cleanly.

### Pure-logic-only test convention (no jsdom/React render)
**Source:** `src/components/SectionBanner.test.js`, `src/lib/featureIcons.test.js`, `src/lib/treasury.test.js`
**Apply to:** `src/lib/population.test.js`
Test named exports directly with small in-test fixtures; never render a component or hit real data files/network in a unit test.

## No Analog Found

None — every new/modified file has at least a role-match analog in the codebase (see Match Quality column above). The two "role-match" (not "exact") entries are:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `scripts/gen-population.mjs` | utility (generator) | file-I/O / batch | No committed Node **data**-generator exists yet (all `scripts/*.js` are CommonJS image-download scripts); RESEARCH.md's own verified Census-API code block is the primary source to copy, cross-checked against `scripts/lausd-headshots/download.js` only for the surrounding script-structure conventions (constants → helpers → `main()` → error-tolerant loop). Must be written as genuine ESM (`package.json:5` sets `"type": "module"`), unlike the CJS analog. |
| `src/data/population.js` | data module | static lookup | No `src/data/` directory exists in the repo today; `src/lib/buildingImages.js` is the closest precedent for "large committed string-keyed lookup with provenance comments," but it lacks a second `name+state → key` index structure — RESEARCH.md's `Bundle Shape (D-03)` section is the primary source for that half. |

## Metadata

**Analog search scope:** `src/components/`, `src/lib/`, `src/pages/`, `scripts/` (Glob + targeted Grep), plus full reads of `SectionBanner.jsx`, `buildingImages.js`, `featureIcons.js`, `featureIcons.test.js`, `SectionBanner.test.js`, `scripts/lausd-headshots/download.js`, and targeted reads of `Results.jsx` (imports, `representingCity`/`userState`/map `useMemo`s, banner call sites, `ElectionsView` hand-off) and `ElectionsView.jsx` (signature, banner call sites).
**Files scanned:** 9 read in full/targeted + Glob results for `src/**/*.test.js`, `scripts/**`, `src/data/**`
**Pattern extraction date:** 2026-07-07

## PATTERN MAPPING COMPLETE
