# Phase 170: Section Banners & Continuous Scroll (Results) — Pattern Map

**Mapped:** 2026-06-25
**Files analyzed:** 4 (1 new, 3 modified)
**Analogs found:** 4 / 4

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/SectionBanner.jsx` | component | transform (tier→image/gradient+text) | `src/components/FilterBar.jsx` (dark inline-style pattern) + `src/pages/Results.jsx` L1913–1918 (eyebrow+full-bleed div) | role-match |
| `src/lib/buildingImages.js` | utility | transform (city/state→image URLs) | itself (extend in place) | exact |
| `src/pages/Results.jsx` | page | request-response + transform | itself (modify in place) | exact |
| `src/components/FilterBar.jsx` | component | request-response (filter state) | itself (modify in place) | exact |

---

## Pattern Assignments

### `src/components/SectionBanner.jsx` (new component, transform)

**Closest analog for dark inline-style component:** `src/components/FilterBar.jsx`
**Closest analog for full-bleed tier div with eyebrow:** `src/pages/Results.jsx` lines 1907–1918

#### Imports pattern — copy from `FilterBar.jsx` lines 1 (no external deps; first-party only):

```jsx
// FilterBar.jsx line 1 — no ev-ui imports needed for a first-party display component
// SectionBanner needs no external imports beyond React itself; all values come
// from the @theme tokens in src/index.css via inline style references.
```

The import block for `SectionBanner.jsx` should be minimal — no ev-ui component imports
(it's a first-party display component). No `!important` is needed on its own elements
(only on ev-ui overrides in `index.css`).

#### Full-bleed layout pattern — copy from `Results.jsx` lines 1889, 1913:

```jsx
// Results.jsx line 1889 (empty-state tier div)
<div
  key={`empty-${tier}`}
  data-tier={tier}
  className="-mx-6 md:-mx-12 px-6 md:px-12 py-3"
  style={!isDark ? { backgroundColor: tierStyle?.bg ?? '#FFFFFF' } : undefined}
>

// Results.jsx line 1913 (live tier div)
<div
  key={tier}
  data-tier={tier}
  className="-mx-6 md:-mx-12 px-6 md:px-12 py-3"
  style={!isDark ? { backgroundColor: tier === 'Federal' ? '#f0f2f5' : tierStyle.bg } : undefined}
>
```

**Adapt for SectionBanner:** The `-mx-6 md:-mx-12` negative margin is the proven full-bleed
pattern. The banner wraps it with `relative overflow-hidden h-[120px] md:h-[180px]`. The
`px-6 md:px-12` inner padding re-establishes alignment for the text content.

#### Eyebrow label pattern — copy from `Results.jsx` lines 1914–1917:

```jsx
// Results.jsx lines 1914–1917 — the existing per-tier eyebrow (to be REMOVED from
// Results.jsx, but its style tokens are the exact pattern to carry into SectionBanner)
{selectedFilter === 'All' && (
  <div className="mb-3">
    <span style={{
      color: isDark ? 'var(--color-ev-teal-light)' : tierStyle.text,
      fontFamily: isDark ? 'var(--font-display)' : undefined,
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '1.2px',
      fontSize: '12px',
    }}>
      {tier}
    </span>
  </div>
)}
```

**Adapt for SectionBanner:** The same `color`, `fontFamily`, `fontWeight`, `textTransform`,
`letterSpacing`, `fontSize` values apply verbatim. The eyebrow text changes to
`YOUR CITY` / `YOUR STATE` / `FEDERAL` per D-02. The `isDark` conditional is not needed
— `SectionBanner` is dark-only. Use CSS custom properties directly:
`color: 'var(--color-ev-teal-light)'` (resolves to `#00c8d7`).

#### Dark token reference pattern — copy from `FilterBar.jsx` lines 26–29:

```jsx
// FilterBar.jsx lines 26–29 — pattern for referencing dark palette values inline
const bg = isDark ? '#161b22' : '#fff';
const borderColor = isActive
  ? (isDark ? '#00c8d7' : '#59b0c4')
  : (isDark ? '#2d3748' : '#d1d5db');
const textColor = isActive
  ? (isDark ? '#00c8d7' : '#00657c')
  : (isDark ? '#8b949e' : '#374151');
```

**Adapt for SectionBanner:** Since SectionBanner is dark-only, the conditional is dropped.
Use CSS custom properties (`var(--color-ev-navy)`, `var(--color-ev-teal-light)`,
`var(--color-ev-text-primary)`) rather than hex literals, per DARK-01 (single source of truth
in `src/index.css`). Hero title: `color: 'var(--color-ev-text-primary)'` (`#e6edf3`).

#### Image + overlay rendering pattern — closest analog `LocationCard.jsx` lines 6–11 (img tag) extended with overlay div:

```jsx
// LocationCard.jsx lines 6–11 — basic img with object-cover (starting point only)
<div className="flex max-w-64 h-auto flex-col gap-2 rounded-lg bg-white">
  <img
    src="https://..."
    // className="absolute inset-0 h-full w-full object-cover"
  />
```

**Adapt for SectionBanner image variant:**

```jsx
// Pattern to implement in SectionBanner — derived from UI-SPEC §Image rendering
<div
  className="-mx-6 md:-mx-12 relative overflow-hidden h-[120px] md:h-[180px]"
>
  {/* Image layer */}
  <img
    src={imageUrl}
    alt=""
    aria-hidden="true"
    style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      objectFit: 'cover',
    }}
  />
  {/* Gradient overlay — mandatory (UI-SPEC constraint #7) */}
  <div
    style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(13,17,23,0.90) 0%, rgba(13,17,23,0.40) 50%, rgba(13,17,23,0.10) 100%)',
    }}
  />
  {/* Text content — positioned over overlay */}
  <div
    className="px-6 md:px-12"
    style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: '16px' }}
  >
    {/* eyebrow + pin + title */}
  </div>
</div>
```

#### Fallback gradient pattern — per UI-SPEC §Fallback gradient tints (D-10):

```jsx
// Fallback variant: replace <img> + overlay with a single background gradient
// City tier:   linear-gradient(135deg, #0d1117 0%, #0d1822 100%)
// State tier:  linear-gradient(135deg, #0d1117 0%, #121a17 100%)
// Federal tier: linear-gradient(135deg, #0d1117 0%, #18120d 100%)
const FALLBACK_GRADIENTS = {
  city:    'linear-gradient(135deg, #0d1117 0%, #0d1822 100%)',
  state:   'linear-gradient(135deg, #0d1117 0%, #121a17 100%)',
  federal: 'linear-gradient(135deg, #0d1117 0%, #18120d 100%)',
};
```

#### Coral pin SVG pattern (D-03):

```jsx
// Use the existing coral pin as a sized <img>:
<img
  src="/images/noun-location-7814384-FF5740.svg"
  alt=""
  aria-hidden="true"
  width={20}
  height={20}
  style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}
/>
```

Do NOT recolor with CSS `filter`. The SVG is already coral `#ff5740` by filename.

#### Scaffolding slots pattern (BANR-04):

```jsx
// Stats + featureIcons props — zero visual impact when null (BANR-04)
// Render as sr-only DOM anchors so structure exists for a later milestone:
{props.stats    && <div className="sr-only" data-slot="stats" />}
{props.featureIcons && <div className="sr-only" data-slot="feature-icons" />}
```

---

### `src/lib/buildingImages.js` (utility, transform — extend in place)

**Analog:** itself. The function signature `getBuildingImages(city, state)` already returns
`{ Local, State, Federal }` with `null` for missing art. No API change needed for Phase 170
— the wiring in Results.jsx passes `buildingImageMap.Local`, `buildingImageMap.State`,
`buildingImageMap.Federal` directly to each `SectionBanner` call.

**Current return shape** (lines 115–119):

```js
// buildingImages.js lines 115–119 — existing return structure
return {
  Local: localImage,    // string URL or null
  State: stateImage,    // string URL or null
  Federal: FEDERAL_IMAGE, // always '/images/us-capitol.jpg'
};
```

**No change needed** to `getBuildingImages`. Phase 170 only wires its output into the banner.
Phase 171 will add city entries to `CURATED_LOCAL` and state entries to `STATE_CAPITOLS`
behind the same API.

---

### `src/pages/Results.jsx` (page, request-response — modify in place)

**Analog:** itself. Three targeted changes:

#### 1. Replace `activeBuildingImage` + scroll-spy with per-tier `buildingImageMap` lookups

**Remove** (lines 1232–1259):

```jsx
// Results.jsx lines 1232–1235 — RETIRE (replaced by per-tier SectionBanner)
const activeBuildingImage =
  selectedFilter === 'All'
    ? buildingImageMap[scrollActiveTier] || buildingImageMap.Local
    : buildingImageMap[selectedFilter] || buildingImageMap.Federal;

// Results.jsx lines 1237–1259 — RETIRE (IntersectionObserver scroll-spy)
useEffect(() => {
  if (selectedFilter !== 'All') return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setScrollActiveTier(entry.target.dataset.tier);
        }
      }
    },
    { root: null, rootMargin: '-40% 0px -60% 0px', threshold: 0 }
  );
  const sections = document.querySelectorAll('[data-tier]');
  sections.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}, [selectedFilter, isDesktop, mainRef.current]);
```

Also remove: `const [scrollActiveTier, setScrollActiveTier] = useState('Local');` (line 525).

#### 2. Remove per-tier eyebrow labels (lines 1890–1893, 1914–1917)

```jsx
// Results.jsx lines 1914–1917 — REMOVE (banner becomes the single tier label)
{selectedFilter === 'All' && (
  <div className="mb-3">
    <span style={{ color: ..., fontWeight: 600, textTransform: 'uppercase', ... }}>
      {tier}
    </span>
  </div>
)}
// Same block at lines 1890–1893 in the empty-state path — also remove
```

#### 3. Insert SectionBanner before each tier group — adapt the `filteredHierarchy.map` at lines 1907–1973:

```jsx
// Results.jsx lines 1907–1912 — current tier iteration (adapt to insert banners)
{filteredHierarchy.map(({ tier, bodies }) => {
  const tierKey = tier.toLowerCase();
  const tierStyle = tierColors[tierKey] ?? tierColors['local'];
  if (!tierStyle) return null;

  return (
    <div key={tier} data-tier={tier} className="-mx-6 md:-mx-12 px-6 md:px-12 py-3"
      style={!isDark ? { ... } : undefined}>
```

**Adapt:** Insert `<SectionBanner>` before each group. The `city` banner fires when `tier`
is `'Local'` (and the school sections are rendered under it). Determine `locationName` from
`representingCity` / `userState` / the `locationLabel` memo (already computed at line 1218).

**Banner tier mapping:**
- `tier === 'Local'` → `<SectionBanner tier="city" locationName={`${representingCity}, ${userState}`} imageUrl={buildingImageMap.Local} />`
- `tier === 'School'` → no banner (fold under City; D-07)
- `tier === 'State'` → `<SectionBanner tier="state" locationName={stateName} imageUrl={buildingImageMap.State} />`
- `tier === 'Federal'` → `<SectionBanner tier="federal" locationName="United States" imageUrl={buildingImageMap.Federal} />`

#### 4. Simplify `filteredHierarchy` — remove tier-filter branch (lines 1197–1215)

```jsx
// Results.jsx lines 1197–1215 — current (with tier-filter branch to remove)
const filteredHierarchy = useMemo(() => {
  if (appointedFilter === 'All' && selectedFilter === 'All') return hierarchy;

  return hierarchy
    .filter(({ tier }) => selectedFilter === 'All' || tier === selectedFilter)  // REMOVE this line
    .map(({ tier, bodies }) => ({
      tier,
      bodies: bodies.map((body) => ({
        ...body,
        subgroups: body.subgroups.map((sg) => ({
          ...sg,
          pols: appointedFilter === 'All'
            ? sg.pols
            : sg.pols.filter((pol) => matchesAppointedFilter(pol, appointedFilter)),
        })).filter((sg) => sg.pols.length > 0),
      })).filter((body) => body.subgroups.length > 0),
    }))
    .filter(({ bodies }) => bodies.length > 0);
}, [hierarchy, appointedFilter, selectedFilter]);
```

**After (tier-filter removed):**
```jsx
const filteredHierarchy = useMemo(() => {
  if (appointedFilter === 'All') return hierarchy;
  return hierarchy
    .map(({ tier, bodies }) => ({
      tier,
      bodies: bodies.map((body) => ({
        ...body,
        subgroups: body.subgroups.map((sg) => ({
          ...sg,
          pols: sg.pols.filter((pol) => matchesAppointedFilter(pol, appointedFilter)),
        })).filter((sg) => sg.pols.length > 0),
      })).filter((body) => body.subgroups.length > 0),
    }))
    .filter(({ bodies }) => bodies.length > 0);
}, [hierarchy, appointedFilter]);
```

#### 5. Simplify `locationLabel` memo (lines 1218–1229)

```jsx
// Results.jsx lines 1218–1229 — current (has selectedFilter === 'State' branch to remove)
const locationLabel = useMemo(() => {
  const src = Array.isArray(list) ? list : [];
  if (!src.length) return null;
  const sample = src[0];
  const city = sample.representing_city;
  const state = sample.representing_state;
  if (selectedFilter === 'State') {       // REMOVE — tier filter gone
    return state ? `${state}, USA` : null;
  }
  return city && state ? `${city}, ${state}` : null;
}, [list, selectedFilter]);
```

**After:** Remove the `selectedFilter === 'State'` branch; always return city+state.

#### 6. Empty-state section (lines 1876–1898) — remove `selectedFilter !== 'All'` gate

```jsx
// Results.jsx line 1882 — REMOVE this guard (selectedFilter is always 'All' now)
if (selectedFilter !== 'All' && selectedFilter !== tier) return null;

// Results.jsx lines 1890–1893 — REMOVE the eyebrow (already covered in change #2)
{selectedFilter === 'All' && (
  <div className="mb-3"> ... </div>
)}
```

---

### `src/components/FilterBar.jsx` (component, request-response — modify in place)

**Analog:** itself.

#### Remove TIER_OPTIONS and the Tier dropdown (lines 11–16, 97–104):

```jsx
// FilterBar.jsx lines 11–16 — REMOVE entirely
const TIER_OPTIONS = [
  { value: 'All', label: 'All tiers' },
  { value: 'Local', label: 'Local' },
  { value: 'State', label: 'State' },
  { value: 'Federal', label: 'Federal' },
];

// FilterBar.jsx lines 97–104 — REMOVE the Tier dropdown render:
<Dropdown
  label="Tier"
  ariaLabel="Filter by tier"
  value={selectedFilter}
  onChange={onFilterChange}
  options={TIER_OPTIONS}
  isDark={isDark}
/>
```

**Also remove** `selectedFilter` and `onFilterChange` from the `FilterBar` props interface
(lines 76–81). The remaining props — `appointedFilter`, `onAppointedFilterChange`,
`searchQuery`, `onSearchChange`, `compassMode`, `onCompassModeChange`, `isDark` — are preserved
unchanged. The `TYPE_OPTIONS` Dropdown and name search input remain at lines 105–141.

---

## Shared Patterns

### Dark inline-style token pattern
**Source:** `src/components/FilterBar.jsx` lines 81–87; `src/index.css` lines 12–38
**Apply to:** `SectionBanner.jsx` and any modified Results.jsx elements

```jsx
// FilterBar.jsx lines 81–87 — dark surface token references
const inputBg = isDark ? '#161b22' : '#fff';
const inputBorder = isDark ? '#2d3748' : '#d1d5db';
const inputBorderFocus = isDark ? '#00c8d7' : '#00657c';
const inputText = isDark ? '#8b949e' : '#374151';
const iconStroke = isDark ? '#00c8d7' : '#6b7280';
```

In `SectionBanner`, no `isDark` conditional — the component is dark-only. Use CSS custom
properties from `src/index.css`:

```js
// CSS custom property equivalents (from src/index.css @theme lines 19–37)
// --color-ev-navy:        #0d1117  (page bg / fallback gradient base)
// --color-ev-navy-card:   #161b22  (surface)
// --color-ev-teal-light:  #00c8d7  (eyebrow color)
// --color-ev-coral:       #ff5740  (pin color — already in SVG)
// --color-ev-text-primary:#e6edf3  (title text)
// --font-display:         "Manrope", ...  (eyebrow + title font)
```

### Full-bleed edge-to-edge pattern
**Source:** `src/pages/Results.jsx` lines 1889, 1913
**Apply to:** `SectionBanner.jsx` outer wrapper, and any new banner insert points in Results.jsx

```jsx
// The proven negative-margin full-bleed idiom (no changes needed)
className="-mx-6 md:-mx-12 px-6 md:px-12"
```

This is the single consistent pattern used across all tier sections. SectionBanner inherits
it directly.

### Eyebrow label typography
**Source:** `src/pages/Results.jsx` lines 1914–1917 (also `src/index.css` D-06 comment at line 36)
**Apply to:** `SectionBanner.jsx` eyebrow element

```jsx
// The locked eyebrow style (Manrope SemiBold 12px uppercase teal 1.2px tracking)
style={{
  color: 'var(--color-ev-teal-light)',     // #00c8d7
  fontFamily: 'var(--font-display)',        // Manrope
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '1.2px',
  fontSize: '12px',
}}
```

### Hero/display title typography
**Source:** `src/index.css` lines 36–37 (`--font-display`); UI-SPEC §Typography table (30px/700/Manrope)
**Apply to:** `SectionBanner.jsx` title element (pin + locationName)

```jsx
// Banner title — Manrope Bold 30px (Phase 169 D-06 hero token)
style={{
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: '30px',
  lineHeight: '36px',
  letterSpacing: '-0.75px',
  color: 'var(--color-ev-text-primary)',   // #e6edf3
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
}}
```

---

## No Analog Found

None. All four files have direct analogs in the codebase.

---

## Metadata

**Analog search scope:** `src/components/`, `src/pages/`, `src/lib/`
**Files scanned:** 25
**Pattern extraction date:** 2026-06-25
