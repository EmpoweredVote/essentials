# Phase 172: Elections Page Parity - Pattern Map

**Mapped:** 2026-06-27
**Files analyzed:** 1 modified (`src/components/ElectionsView.jsx`) + 1 call-site edit (`src/pages/Results.jsx`)
**Analogs found:** 1 / 1 (exact — `Results.jsx` is the canonical template for every change)

> This is PARITY work. There is no CONTEXT.md (discuss-phase skipped). The design is locked: "match Results." `src/pages/Results.jsx` is the concrete, already-shipped analog for every region of `ElectionsView.jsx` that changes. The risk is *divergence*, not *invention* — copy the parent's proven values, do not re-derive.

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/components/ElectionsView.jsx` | component (presentational child) | request-response (props only; no fetch except per-candidate stance overlay) | `src/pages/Results.jsx` | exact (same design system, same tier model, same banner component) |
| `src/pages/Results.jsx` (call site only, L1975-1987) | page (parent / data owner) | — (extend the props it already passes down) | itself (`filteredHierarchy` banner block L1859-1882 + derivations L1045-1086) | exact |

**Key structural fact:** `ElectionsView` is a presentational child of `Results.jsx`. It owns NO location/elections data fetching — all of it flows in via props. The banner inputs (`buildingImageMap`, `representingCity`, `userState`) must therefore be *threaded as props*, never recomputed inside the child (would risk a different city/state label than the Representatives tab for the same search).

---

## Pattern Assignments

### Change 1 — Dark-token swaps (DARK-03) in `ElectionsView.jsx`

**Analog:** `Results.jsx` already uses the new Phase-169 palette everywhere. ElectionsView still carries the OLD literals because it was out of Phase 169's file scope.

**Token map (single source of truth — `src/index.css` @theme):**

```
OLD (still in ElectionsView)         →  NEW (already in Results.jsx)
'#1a2235'  card/overlay bg           →  '#161b22'   (--color-ev-navy-card)
'#2d3f5a'  card border               →  '#2d3748'   (--color-ev-slate)
'#59b0c4'  tier/branch accent        →  '#00c8d7'   (--color-ev-teal-light dark)
```

**Memory rule [feedback_dark_mode_ev_ui_important]:** ev-ui inline styles need `!important` on dark color overrides; never faint-gray-on-dark; muted floor is `#8b949e`. `SectionBanner` itself is first-party and needs no `!important`. `PoliticianCard` (.ev-politician-card) overrides already live in index.css.

**Exact sites to fix in `ElectionsView.jsx`:**

- **L510** — empty-state heading
  ```jsx
  // CURRENT (ElectionsView L510)
  <p className="text-[16px] font-semibold text-[#00657C] dark:text-[#59b0c4]">
  // → swap dark:text-[#59b0c4] to dark:text-[#00c8d7]
  ```

- **L537** — tier eyebrow `<span>` (NOTE: this `<span>` is *replaced entirely* by `<SectionBanner>` per Change 2; if any tier label survives, use the new value)
  ```jsx
  // CURRENT (ElectionsView L537)
  <span ... style={{ color: isDark ? '#59b0c4' : tierStyle.text }}>{tier}</span>
  // → '#00c8d7'
  ```

- **L535** — tier band backdrop. Keep the light path; in dark it is already `'transparent'`. Per research, the banner now owns the tier's dark visual identity; leave `backgroundColor: isDark ? 'transparent' : tierStyle.bg` as-is.

- **L568** — branch-header label `color: isDark ? '#59b0c4' : tierStyle.text` → `'#00c8d7'`
- **L576** — branch-header divider line `backgroundColor: isDark ? '#59b0c4' : tierStyle.text` → `'#00c8d7'`

- **L710** — PoliticianCard inline style
  ```jsx
  // CURRENT (ElectionsView L710)
  style={{ ...(isDark ? { backgroundColor: '#1a2235', borderColor: '#2d3f5a' } : {}), border: 'none', borderRadius: 0, cursor: 'pointer' }}
  // → { backgroundColor: '#161b22', borderColor: '#2d3748' }
  ```

- **L742** — stacked-mobile MiniCompass panel `backgroundColor: isDark ? '#1a2235' : '#fff'` → `'#161b22'`
- **L775** — desktop side-overlay MiniCompass panel `backgroundColor: isDark ? '#1a2235' : '#fff'` → `'#161b22'`

**Verification:** after editing, `grep -E '1a2235|2d3f5a|59b0c4'` against ElectionsView.jsx must return zero matches in dark branches.

---

### Change 1b — Loading skeleton dark variant (Pitfall 2)

**Analog:** `Results.jsx` SkeletonCard / SkeletonSection (L221-243).

```jsx
// Results.jsx SkeletonCard (L222-228) — the pattern to copy: bg-gray-200 + dark:bg-gray-700
<div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
<div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
```

```jsx
// ElectionsView CURRENT skeleton (L477-501) — light-only, every bg-gray-200 needs dark:bg-gray-700
<div className="h-4 bg-gray-200 rounded w-24 mb-4" />
<div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
<div className="h-4 bg-gray-200 rounded w-2/3" />
<div className="h-3 bg-gray-200 rounded w-1/2" />
// → add dark:bg-gray-700 to each bg-gray-200 block
```

---

### Change 1c — "No candidates have filed" empty box dark treatment (Pitfall 3)

**Analog:** the project-wide `isDark ?` conditional-palette pattern (Phase 169). The box currently hardcodes `pillars.empower.light` bg + `#1C1C1C` title + `#6B7280` subtext — illegible on dark.

```jsx
// ElectionsView CURRENT (L635-650) — light-only
<div style={{ backgroundColor: pillars.empower.light, borderLeft: `3px solid ${pillars.empower.textColor}`, borderRadius: '6px', padding: '12px 16px' }}>
  <p style={{ fontSize: '14px', fontWeight: 600, color: '#1C1C1C', margin: 0 }}>No candidates have filed</p>
  <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', marginBottom: 0 }}>This seat is currently uncontested.</p>
</div>
```

```jsx
// TARGET — wrap each color in isDark ternary; dark surface #161b22, accent #00c8d7,
// title #e6edf3, muted floor #8b949e (NEVER fainter on dark) [MEMORY: feedback_dark_mode_ev_ui_important]
<div style={{
  backgroundColor: isDark ? '#161b22' : pillars.empower.light,
  borderLeft: `3px solid ${isDark ? '#00c8d7' : pillars.empower.textColor}`,
  borderRadius: '6px', padding: '12px 16px',
}}>
  <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e6edf3' : '#1C1C1C', margin: 0 }}>No candidates have filed</p>
  <p style={{ fontSize: '13px', color: isDark ? '#8b949e' : '#6B7280', marginTop: '4px', marginBottom: 0 }}>This seat is currently uncontested.</p>
</div>
```

**Leave alone:** the withdrawn/unopposed badges (L715-724) use `rgba(0,0,0,0.55)` / `rgba(120,0,0,0.78)` translucent overlays designed to sit over photos — they read fine on both modes.

---

### Change 2 — SectionBanner insertion (BANR-05) in `ElectionsView.jsx`

**Component to reuse (verbatim, no signature change):** `src/components/SectionBanner.jsx`
- Import (mirror Results.jsx L31): `import SectionBanner from './SectionBanner.jsx';` (note `./` from components/, vs `../components/` in Results)
- Props it expects: `tier` (`'city'|'state'|'federal'`), `locationName` (string), `imageUrl` (string|null). It owns onError fallback, gradient fallback, overlay, sizing. Dark-only component.

**Analog — exactly how Results.jsx selects the banner per tier (`Results.jsx` L1864-1882):**

```jsx
// Source: src/pages/Results.jsx L1864-1882 (VERIFIED) — inside filteredHierarchy.map(({tier, bodies}) => ...)
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

**Tier-name mapping — CRITICAL:** ElectionsView's `getTier()` (L118-123) returns `'Local' | 'State' | 'Federal' | 'Other'` — identical keys to Results. SectionBanner's `tier` prop is lowercase: **Local → `"city"`**, State → `"state"`, Federal → `"federal"`. Map exactly as Results does. `'Other'` tier → `null` (no banner).

**Where it goes in ElectionsView (Pitfall 5):** the banner is built and rendered *inside* the existing per-election tier loop:

```jsx
// ElectionsView CURRENT — the loop (L527-538). The banner REPLACES the <span> eyebrow at L536-538.
election.hierarchy
  .filter(({ tier }) => tierFilter === 'All' || tier === tierFilter)
  .map(({ tier, bodies }) => {
    const tierKey = tier.toLowerCase();
    const tierStyle = tierColors[tierKey];
    if (!tierStyle) return null;
    return (
      <div key={tier} ... style={{ backgroundColor: isDark ? 'transparent' : tierStyle.bg }}>
        <div className="mb-3">
          <span ... style={{ color: isDark ? '#59b0c4' : tierStyle.text }}>{tier}</span>  {/* ← L536-538: REPLACE with {banner} */}
        </div>
        ...
```

```jsx
// TARGET — compute `banner` from tier (mirroring Results), render it where the <span> eyebrow was.
// Uses the NEW props threaded from Results (see Change 3). stateNames is the STATE_NAMES map passed down.
const banner = tier === 'Local'
  ? <SectionBanner tier="city"    locationName={representingCity && userState ? `${representingCity}, ${userState}` : (representingCity || 'Your City')} imageUrl={buildingImageMap?.Local} />
  : tier === 'State'
  ? <SectionBanner tier="state"   locationName={(userState && stateNames?.[userState]) || userState || 'Your State'} imageUrl={buildingImageMap?.State} />
  : tier === 'Federal'
  ? <SectionBanner tier="federal" locationName="United States" imageUrl={buildingImageMap?.Federal} />
  : null;
// render {banner} immediately before the tier body content (replacing the <span> eyebrow at L536-538).
```

**Placement note:** Results has no per-election outer loop (it renders one `filteredHierarchy`). ElectionsView nests tier *inside* `processedElections.map((election) => ...)`. Render the banner once per tier *inside* the tier `.map(...)`, not outside the election loop. In practice Results passes `nearestElection` (single element), so one banner set renders. Banner renders in BOTH light and dark for true parity (Results renders it in both; SectionBanner's dark styling applies regardless) — confirm at human checkpoint per RESEARCH Open Question 2.

---

### Change 3 — Prop threading (the one structural change)

**Analog — derivations already computed in `Results.jsx` (L1045-1086) — DO NOT recompute in the child:**

```jsx
// Source: src/pages/Results.jsx
// representingCity — useMemo L1045-1066 (representing_city → chamber_name parse → parseCityFromAddress)
// userState       — useMemo L1070-1081 (parseStateFromAddress → browse_state_officials fallback)
const buildingImageMap = useMemo(                                 // L1083-1086
  () => getBuildingImages(representingCity, userState),
  [representingCity, userState]
);
// STATE_NAMES — module const L93-107 (abbrev → full name) lives in Results.jsx, not a shared lib
```

**Call site to extend — `Results.jsx` L1975-1987 (currently passes 6 props):**

```jsx
// CURRENT (Results.jsx L1975-1987)
<ElectionsView
  elections={nearestElection}
  loading={electionsLoading}
  compassMode={compassMode}
  isDark={isDark}
  hideWithdrawn={true}
  onCandidateClick={(id) => { /* posthog + scroll save + navigate */ }}
/>
// → ADD: buildingImageMap={buildingImageMap}
//        representingCity={representingCity}
//        userState={userState}
//        stateNames={STATE_NAMES}   (or pass a pre-resolved stateName label — research recommends passing the map; do NOT refactor STATE_NAMES into a shared lib this phase)
```

**Destructure to extend — `ElectionsView.jsx` L247-255 (current prop list):**

```jsx
// CURRENT (ElectionsView.jsx L247-255)
export default function ElectionsView({
  elections, loading, tierFilter = 'All', hideWithdrawn = false,
  compassMode = false, onCandidateClick, isDark = false,
}) {
// → ADD: buildingImageMap, representingCity, userState, stateNames
//   (default the new ones to safe values: buildingImageMap = {}, representingCity = null, userState = null, stateNames = {})
```

**Anti-pattern (Pitfall 4 / research Anti-Patterns):** do NOT call `getBuildingImages`, `parseCityFromAddress`, `parseStateFromAddress`, or `useTheme()` inside ElectionsView. Single source of truth = the parent. ElectionsView already receives `isDark` as a prop.

---

## Behaviors to NOT break (preserve, color-only)

| Behavior | Location (ElectionsView.jsx) | Mechanism — leave logic untouched |
|----------|------------------------------|-----------------------------------|
| Seeded antipartisan shuffle | `sessionSeed` useMemo **L323-330**; `seededShuffle()` **L40-46**; applied **L377** | Reads/writes `sessionStorage['ev:election-seed']`; deterministic hash sort by `seed + candidate_id`. [MEMORY: feedback_antipartisan_display] **Touch nothing.** |
| Race dedup (same candidate set, two sources) | **L342-355** | Keeps longer position_name. Behavior, not theme — leave. |
| Withdrawn handling | filter **L590-603**; badge **L715-719** | Incumbent-withdrawn omitted; others appended after active; `hideWithdrawn` prop (Results passes `true`). |
| "Running Unopposed" / "N seats" badge | `isUnopposed` **L605**; `unopposedBadge` **L720-724** | `activeCandidates.length > 0 && <= seats`; translucent overlay reads on both modes — leave. |
| "No candidates have filed" | `isEmpty` **L606**; box **L635-650** | Logic preserved; ONLY colors change (Change 1c). |
| MiniCompass overlay (side desktop / stacked mobile) | **L666-791** | `compassMode` + `isMobile`; already `isDark`-aware; preserve, color only (panel bg at L742/L775). |
| Tier / branch / body ordering | `getTier` L118-123; `bodyOrderScore` L387-433; `BRANCH_ORDER` L435; hierarchy build L437-470 | Behavior — leave entirely. |

**`elections/me` Connected auto-load lives in the PARENT, not ElectionsView.**
Source: `Results.jsx` **L749-758** (`fetchMyElections()` fallback when prefilled). ElectionsView only renders the `elections` prop. Do NOT move or touch this. Confirmed import `Results.jsx` L17 (`fetchMyElections`).

---

## Shared Patterns

### isDark conditional palette (the dominant pattern this phase)
**Source:** Phase-169 convention throughout `Results.jsx`; new tokens in `src/index.css` @theme.
**Apply to:** every changed color site in ElectionsView (Changes 1, 1b, 1c).
**Rule:** keep the light branch of every `isDark ?` ternary exactly as-is (light mode is Out of Scope / "remains as-is"). Dark: `#161b22` surface, `#2d3748` border, `#00c8d7` accent, `#e6edf3` primary text, `#8b949e` muted floor (never fainter). [MEMORY: feedback_dark_mode_ev_ui_important]

### Location → art resolution
**Source:** `src/lib/buildingImages.js` `getBuildingImages(city, stateAbbrev)` → `{Local, State, Federal}` (50 states + curated LA-county cities + federal Capitol, all in prod Storage).
**Apply to:** computed in `Results.jsx` (L1083-1086) only; passed down as `buildingImageMap` prop. SectionBanner handles the null → tier-gradient fallback internally (L83-92).

### SectionBanner reuse
**Source:** `src/components/SectionBanner.jsx` (its own docstring L4-6 already names Phase 172 as a consumer with "no signature change").
**Apply to:** the tier loop in both Results and ElectionsView. First-party — no `!important` needed.

---

## No Analog Found

None. Every change has an exact precedent in `Results.jsx`. This is the cleanest possible parity phase — all components, helpers, tokens, and prop derivations already exist and are proven in production on the Representatives tab.

## Metadata

**Analog search scope:** `src/pages/Results.jsx`, `src/components/ElectionsView.jsx`, `src/components/SectionBanner.jsx`, `src/lib/buildingImages.js`
**Files scanned:** 4 (+ RESEARCH.md for verified line numbers)
**Pattern extraction date:** 2026-06-27
**Line-number caveat:** numbers reflect the files as read this session; if ElectionsView.jsx or Results.jsx is edited before implementation, line refs shift but the approach does not.
