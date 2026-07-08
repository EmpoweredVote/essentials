# Phase 172: Elections Page Parity - Research

**Researched:** 2026-06-27
**Domain:** React/Vite frontend re-theme + component reuse (dark-mode parity + SectionBanner dividers)
**Confidence:** HIGH

## Summary

Phase 172 brings `src/components/ElectionsView.jsx` to parity with the already-shipped Results page
(Phases 169 dark tokens + 170 SectionBanner / continuous scroll). This is a **pure parity / reconcile**
phase — the design is locked ("match Results"), every pattern to copy already exists in `Results.jsx`,
and there are no new libraries, no backend, and no schema changes.

Two concrete bodies of work:

1. **DARK-03** — ElectionsView still carries the **old Phase-169 dark palette literals** (`#1a2235`,
   `#2d3f5a`, `#59b0c4`) at 5 inline sites. Results was repointed to the new palette (`#161b22`,
   `#2d3748`, `#00c8d7`) but ElectionsView was out of scope in 169, so it never got the swap. Plus the
   two light-only states (loading skeleton `bg-gray-200`, "No candidates have filed" box) and the empty
   state need dark treatment.

2. **BANR-05** — ElectionsView currently renders its tiers with a small `<span>` eyebrow + a
   `tierColors[tierKey].bg` background band. It must instead render the **`SectionBanner`** divider
   between City → State → Federal exactly the way `Results.jsx` does (L1864–1886). The blocker: the
   inputs SectionBanner needs (`representingCity`, `userState`, `buildingImageMap`) live in `Results.jsx`
   and are **NOT currently passed into ElectionsView**. The cleanest plan threads them in as props from
   the parent (which already computes them).

**Primary recommendation:** Mirror `Results.jsx` exactly. (a) Pass `buildingImageMap`,
`representingCity`, `userState` (+ a state-name map or pre-resolved labels) from `Results.jsx` into
`<ElectionsView>`. (b) Inside ElectionsView's `election.hierarchy.map(...)`, replace the `<span>`
eyebrow + `tierColors` band with a `<SectionBanner>` keyed off the same tier→props logic Results uses.
(c) Swap the 5 stale dark literals to the new palette. (d) Dark-treat the loading skeleton, empty state,
and the unopposed/no-candidate boxes. Do **not** touch the 4 preserved behaviors (seeded shuffle,
unopposed/no-candidate rendering, `elections/me` auto-load, MiniCompass overlay) beyond color.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Dark-mode visual treatment | Browser / Client (React render) | — | Pure CSS/inline-style theming, no data |
| SectionBanner tier dividers | Browser / Client | — | Presentational component; consumes location strings + image URLs already in memory |
| Location→art resolution (`getBuildingImages`) | Browser / Client (`src/lib/buildingImages.js`) | — | Already computed in Results.jsx; pass result down, don't recompute |
| Elections data (`/elections-by-*`, `/elections/me`) | API / Backend | Client (fetch in Results.jsx) | Already fetched by the PARENT (Results.jsx), passed as `elections` prop — ElectionsView does NOT fetch |
| Per-candidate stance overlay | API / Backend (`fetchPoliticianAnswers`) | Client (MiniCompass) | Existing, preserved as-is |

**Key takeaway:** ElectionsView is a **presentational child** of `Results.jsx`. It owns no data
fetching except per-candidate stance lookups for the compass overlay. All location/elections data flows
in via props. This is why banner inputs must be threaded as props, not re-derived.

## Standard Stack

No new packages. This phase uses only what is already installed and imported.

### Core (already present)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@empoweredvote/ev-ui` | (installed) | `GovernmentBodySection`, `SubGroupSection`, `PoliticianCard`, `tierColors`, `pillars` | First-party design system; already drives both pages |
| `react` | (installed) | hooks (`useMemo`, `useState`, `useEffect`) | Project framework |
| `@floating-ui/react` | (installed) | `RoleInfoTooltip` positioning | Already used in ElectionsView |

### Supporting (already present, in-repo)
| Module | Purpose | When to Use |
|--------|---------|-------------|
| `src/components/SectionBanner.jsx` | The locked tier-divider component (Phase 170) | Render between tiers — **reuse verbatim, no signature change** (its own header docs already name Phase 172 as a consumer) |
| `src/lib/buildingImages.js` | `getBuildingImages(city, stateAbbrev)` → `{Local, State, Federal}` | Already called in Results.jsx; **pass the result down** as a prop |
| `src/hooks/useTheme.js` | `useTheme()` → `{ isDark }` | ElectionsView receives `isDark` as a prop today (no direct hook call needed) |
| `src/components/MiniCompass.jsx` | Compass overlay; already accepts `isDark` | Preserved; already dark-aware |

**Installation:** None. (No `npm install` step in this phase.)

## Package Legitimacy Audit

> Not applicable — this phase installs **no** external packages. All code is in-repo or already
> installed. No registry verification required.

## Architecture Patterns

### System Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
   User address /   │  Results.jsx (PARENT — owns all data)        │
   browse area  ───▶│                                               │
                    │  • fetchElectionsByAddress / ByArea /         │
                    │    ByGovernmentList / fetchMyElections        │  ← elections/me auto-load
                    │      → electionsData → nearestElection        │     lives HERE (Results)
                    │  • representingCity (useMemo)                  │
                    │  • userState (useMemo)                        │
                    │  • buildingImageMap = getBuildingImages(...)  │  ← banner art source
                    │  • isDark (useTheme)                          │
                    └───────────────┬───────────────────────────────┘
                                    │ props
            elections, isDark, compassMode, hideWithdrawn, onCandidateClick
            + NEW: buildingImageMap, representingCity, userState (, stateNames)
                                    │
                                    ▼
                    ┌─────────────────────────────────────────────┐
                    │  ElectionsView.jsx (CHILD — presentational)  │
                    │                                               │
                    │  processedElections (useMemo)                 │
                    │    election → hierarchy[ {tier, bodies[]} ]   │
                    │      seededShuffle(candidates, sessionSeed)   │  ← PRESERVE (antipartisan)
                    │                                               │
                    │  render: hierarchy.map(tier =>                │
                    │    ┌─ SectionBanner(tier, locationName, img)  │  ← BANR-05 (NEW, replaces
                    │    │    (City→State→Federal)                  │     the <span> eyebrow band)
                    │    └─ GovernmentBodySection                   │
                    │         └─ SubGroupSection (per race)         │
                    │              ├─ "No candidates have filed"    │  ← PRESERVE + dark-treat
                    │              ├─ "Unopposed" / "N seats" badge │  ← PRESERVE
                    │              └─ PoliticianCard + MiniCompass   │  ← DARK-03 palette swap
                    └─────────────────────────────────────────────┘
```

### Pattern 1: SectionBanner per tier (copy from Results.jsx L1864–1886)
**What:** Render the same banner Results uses, selecting tier + label + image per tier.
**When to use:** Inside ElectionsView's per-election `hierarchy.filter(...).map(({tier, bodies}) => ...)`,
emit the banner immediately before the tier's body content (replacing the current `<span>` eyebrow).
**Example (the exact shape Results uses — mirror it):**
```jsx
// Source: src/pages/Results.jsx L1864–1886 (VERIFIED in-repo)
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
**Note on tier naming:** ElectionsView's `getTier()` returns `'Local' | 'State' | 'Federal' | 'Other'`
(L117–123) — identical to Results' tier keys. SectionBanner's `tier` prop expects lowercase
`'city' | 'state' | 'federal'` (note Local→**city**). Map exactly as Results does.

### Pattern 2: New-palette dark literals (Phase 169 canonical values)
**What:** Swap the stale Phase-169 dark literals to the values Results was repointed to.
**When to use:** At the 5 inline sites in ElectionsView (see Common Pitfall 1 for line numbers).
```js
// OLD (still in ElectionsView)        →  NEW (already in Results.jsx)
'#1a2235'  /* card/overlay bg */        →  '#161b22'   // --color-ev-navy-card
'#2d3f5a'  /* card border */            →  '#2d3748'   // --color-ev-slate
'#59b0c4'  /* tier/branch accent */     →  '#00c8d7'   // --color-ev-teal-light (dark)
```
[VERIFIED: src/index.css @theme L19–37 — these are the live token values]

### Anti-Patterns to Avoid
- **Re-deriving banner inputs inside ElectionsView.** `representingCity` / `userState` /
  `buildingImageMap` are already computed in Results.jsx (L1045–1086). Recomputing risks divergence
  (e.g. Elections showing a different city label than Representatives for the same search). Pass them down.
- **Calling `useTheme()` inside ElectionsView.** It already receives `isDark` as a prop from Results.
  Keep the single source.
- **Changing `SectionBanner`'s signature.** Its docstring already declares Phase 172 as a no-signature-
  change consumer. Reuse as-is.
- **Touching the seeded shuffle, dedup, or tier/branch ordering logic.** These are behavior, not theme.
- **Keeping the `tierColors[tierKey].bg` band as a backdrop behind the banner.** Results removed the
  light tier-band visual when the banner landed; the band's only remaining job in ElectionsView dark
  mode is `backgroundColor: isDark ? 'transparent' : tierStyle.bg` (L535) — keep the light path, but the
  banner now owns the tier's visual identity in dark.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tier divider banner | A new Elections-specific banner | `SectionBanner.jsx` | Locked in 170; has onError fallback, gradient fallback, overlay, sizing |
| Location→image mapping | New city/state image lookup | `getBuildingImages()` (passed down) | All 50 states + curated cities + federal already wired (Phase 170/171) |
| State abbrev→name | New map in ElectionsView | Pass `STATE_NAMES` from Results, or pre-resolve `locationName` in the parent | `STATE_NAMES` already exists in Results.jsx L93–107 |
| Dark palette values | New color constants | The `@theme` tokens / the literals Results already uses | Single source of truth (DARK-01) |

**Key insight:** Every piece of this phase already exists and is proven on Results. The risk is
*divergence*, not *invention* — so the safest plan threads the parent's already-correct values into the
child rather than re-deriving them.

## Runtime State Inventory

> Not a rename/refactor/migration phase in the data sense — but it IS a parity refactor, so the
> "what already exists that I must not regress" inventory matters. No stored data, services, OS state,
> secrets, or build artifacts are touched.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — frontend-only, no DB writes | None — verified by REQUIREMENTS.md "No backend/DB schema changes" |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | None (reads `VITE_COMPASS_URL` only, unchanged) | None |
| Build artifacts | Tailwind v4 scans `.planning/*.md` — RESEARCH.md must avoid raw Windows `\` paths | None new (this file uses forward slashes only); `@source not` guard already in index.css L7–8 |

**Behavioral state to preserve (the real "don't regress" list):**

| Behavior | Where it lives (ElectionsView.jsx) | Mechanism |
|----------|-----------------------------------|-----------|
| Randomized per-session candidate ordering | `sessionSeed` (L323–330) + `seededShuffle()` (L40–46), applied at L377 | Reads/writes `sessionStorage['ev:election-seed']`; deterministic hash sort by `seed + candidate_id`. **Touch nothing.** |
| "Running Unopposed" / "N seats" badge | L605 (`isUnopposed`), L720–724 (`unopposedBadge`) | `activeCandidates.length > 0 && <= seats`; absolute-positioned overlay badge |
| "No candidates have filed" | L606 (`isEmpty`), L635–650 (the box) | `displayCandidates.length === 0`; **light-only colors → needs dark treatment** |
| Withdrawn handling | L590–603 (filter), L715–719 (badge) | Incumbent-withdrawn omitted; others appended after active; `hideWithdrawn` prop (Results passes `true`) |
| `elections/me` Connected auto-load | **NOT in ElectionsView** — in `Results.jsx` L749–758 (prefilled fallback to `fetchMyElections`) | Parent fetches; ElectionsView only renders the `elections` prop. **Do not move this.** |
| MiniCompass overlay (side desktop / stacked mobile) | L666–791 | `compassMode` + `isMobile`; already `isDark`-aware; preserve, color only |

## Common Pitfalls

### Pitfall 1: Stale Phase-169 dark literals (the DARK-03 core)
**What goes wrong:** ElectionsView renders a *slightly different* dark palette than Results — old navy
`#1a2235` vs. new `#161b22`, old accent `#59b0c4` vs. new `#00c8d7` — so the two tabs look subtly
mismatched on dark.
**Why it happens:** Phase 169 repointed Results but ElectionsView was out of that phase's file scope.
**Exact sites to fix in `src/components/ElectionsView.jsx`** [VERIFIED via grep]:
- L510 — empty-state heading `dark:text-[#59b0c4]` → `dark:text-[#00c8d7]`
- L537 — tier eyebrow `color: isDark ? '#59b0c4'` → `'#00c8d7'` (this `<span>` is *replaced* by the
  banner per BANR-05, so it may disappear entirely — but if any tier label remains, use the new value)
- L568 — branch-header label `color: isDark ? '#59b0c4'` → `'#00c8d7'`
- L576 — branch-header divider line `backgroundColor: isDark ? '#59b0c4'` → `'#00c8d7'`
- L710 — PoliticianCard `isDark ? { backgroundColor: '#1a2235', borderColor: '#2d3f5a' }` →
  `{ backgroundColor: '#161b22', borderColor: '#2d3748' }`
- L742, L775 — MiniCompass overlay panel `backgroundColor: isDark ? '#1a2235'` → `'#161b22'`
**How to avoid:** grep ElectionsView for `1a2235|2d3f5a|59b0c4` after editing — expect zero matches in
dark branches.

### Pitfall 2: Light-only loading skeleton on dark
**What goes wrong:** The loading skeleton (L477–501) uses `bg-gray-200` with no `dark:` variant — bright
gray blocks flash on the `#0d1117` page.
**Why it happens:** Copied from an older SkeletonSection before dark mode.
**How to avoid:** Add `dark:bg-gray-700` (the convention Results' `SkeletonCard`/`SkeletonSection` use,
L222–243). [CITED: src/pages/Results.jsx L224–241]

### Pitfall 3: "No candidates have filed" + unopposed badge are faint/wrong on dark
**What goes wrong:** The empty box (L635–650) hardcodes `pillars.empower.light` bg + `#1C1C1C` title +
`#6B7280` subtext — near-black text on a light pillar tint, illegible/clashing on dark.
**Why it happens:** Written light-only.
**How to avoid:** Wrap in an `isDark ?` ternary (the established pattern, PATTERNS.md "isDark conditional
palette"). Pick a dark surface (`#161b22`/`#21262d`) with `#e6edf3` title and the `#8b949e` muted floor —
**never fainter than `#8b949e` on dark** [MEMORY: feedback_dark_mode_ev_ui_important]. The unopposed/
withdrawn badges (L715–724) use translucent dark overlays (`rgba(0,0,0,0.55)` etc.) which read fine on
both — leave them.

### Pitfall 4: SectionBanner needs inputs ElectionsView doesn't have
**What goes wrong:** A plan that tries to render `<SectionBanner>` from inside ElectionsView with no
`buildingImageMap`/`representingCity`/`userState` will either crash or show "Your City" + gradient
everywhere, losing the location-aware art.
**Why it happens:** Results computes these (L1045–1086) but the current `<ElectionsView>` call site
(L1975–1987) passes only `elections, loading, compassMode, isDark, hideWithdrawn, onCandidateClick`.
**How to avoid:** Add props in BOTH places — extend the call site in Results.jsx to pass
`buildingImageMap`, `representingCity`, `userState` (and either `stateNames`/`STATE_NAMES` or
pre-resolved label strings), and add them to ElectionsView's prop destructure (L247–255). This is the
single structural change of the phase.

### Pitfall 5: Banner placement inside the per-election loop
**What goes wrong:** ElectionsView wraps everything in `processedElections.map((election) => ...)`
(usually one election after `nearestElection`). Putting the banner outside that loop, or once per
election when multiple are shown, double-renders banners.
**Why it happens:** Results has no per-election outer loop (it renders one `filteredHierarchy`);
ElectionsView nests tier inside election.
**How to avoid:** Render the banner inside the `election.hierarchy...map(({tier, bodies}) => ...)`
(L527–529), once per tier — exactly where the `<span>` eyebrow sits today (L536–538). In practice
Results passes `nearestElection` (single element), so one banner set renders.

### Pitfall 6: Tailwind v4 build crash from Windows paths in committed .md
**What goes wrong:** Tailwind v4 auto-scans `.planning/*.md`; a raw `\feedback` Windows path parses as a
CSS hex escape and crashes the prod build.
**Why it happens:** Documented project landmine [MEMORY: feedback_tailwind_scans_planning_md].
**How to avoid:** Already mitigated by `@source not "../.planning"` / `@source not "../**/*.md"`
(index.css L7–8). Keep using forward slashes in any committed planning docs. Do not remove those guards.

## Code Examples

### The current ElectionsView call site to extend (Results.jsx)
```jsx
// Source: src/pages/Results.jsx L1975–1987 (VERIFIED) — add the 3–4 NEW props
<ElectionsView
  elections={nearestElection}
  loading={electionsLoading}
  compassMode={compassMode}
  isDark={isDark}
  hideWithdrawn={true}
  onCandidateClick={(id) => { /* analytics + navigate */ }}
  // NEW for BANR-05:
  buildingImageMap={buildingImageMap}      // already computed L1083–1086
  representingCity={representingCity}       // already computed L1045–1066
  userState={userState}                    // already computed L1070–1081
  // (+ pass STATE_NAMES or a resolved stateName label)
/>
```

### Tier→SectionBanner inside ElectionsView's existing loop
```jsx
// Inside: election.hierarchy.filter(...).map(({ tier, bodies }) => { ... })
// REPLACES the <span> eyebrow at ElectionsView.jsx L536–538.
const banner = tier === 'Local'
  ? <SectionBanner tier="city"    locationName={representingCity && userState ? `${representingCity}, ${userState}` : (representingCity || 'Your City')} imageUrl={buildingImageMap?.Local} />
  : tier === 'State'
  ? <SectionBanner tier="state"   locationName={(userState && stateNames?.[userState]) || userState || 'Your State'} imageUrl={buildingImageMap?.State} />
  : tier === 'Federal'
  ? <SectionBanner tier="federal" locationName="United States" imageUrl={buildingImageMap?.Federal} />
  : null;
// then render {banner} immediately before the tier's GovernmentBodySection content.
```

### Dark-aware empty-state box (replacing L635–650)
```jsx
// PATTERN: isDark conditional palette (PATTERNS.md). Muted floor #8b949e, never fainter.
<div style={{
  backgroundColor: isDark ? '#161b22' : pillars.empower.light,
  borderLeft: `3px solid ${isDark ? '#00c8d7' : pillars.empower.textColor}`,
  borderRadius: '6px', padding: '12px 16px',
}}>
  <p style={{ fontSize: '14px', fontWeight: 600, color: isDark ? '#e6edf3' : '#1C1C1C', margin: 0 }}>
    No candidates have filed
  </p>
  <p style={{ fontSize: '13px', color: isDark ? '#8b949e' : '#6B7280', marginTop: '4px', marginBottom: 0 }}>
    This seat is currently uncontested.
  </p>
</div>
```

## State of the Art

| Old Approach (current ElectionsView) | Current Approach (Results, post-170) | When Changed | Impact |
|--------------------------------------|--------------------------------------|--------------|--------|
| Tier shown via `<span>` eyebrow + `tierColors.bg` band | Full-bleed `SectionBanner` divider, location-aware | Phase 170 | Visual unification; ElectionsView is the last page on the old pattern |
| Dark literals `#1a2235`/`#59b0c4` | New tokens `#161b22`/`#00c8d7` | Phase 169 | ElectionsView never got the swap → mismatch to fix |
| (banner art) | 50 states + curated cities + federal in prod Storage | Phase 170/171 | `getBuildingImages` returns correct URLs; ElectionsView just needs the map passed in |

**Deprecated/outdated within this file:**
- The `<span>` tier eyebrow (L536–538) — superseded by SectionBanner for the dark/banner treatment.
- Old-palette dark literals — superseded by Phase-169 tokens.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Passing banner inputs as props (vs. re-deriving) is the intended/cleanest approach | Patterns / Pitfall 4 | LOW — if the team prefers a shared layout component, the prop-threading still works as a stepping stone; no data risk |
| A2 | The unopposed/withdrawn translucent badges read acceptably on dark without change | Pitfall 3 | LOW — they use `rgba(0,0,0,*)` overlays designed to sit over photos; visually verifiable at checkpoint |
| A3 | `nearestElection` (single election) means one banner set renders; multi-election rendering is not a live concern | Pitfall 5 | LOW — Results passes `nearestElection`; if a future caller passes many, banners repeat per election (acceptable, matches per-election grouping) |

**Note:** No `[ASSUMED]` factual/registry claims exist — every code reference is `[VERIFIED]` against the
in-repo files read this session. The assumptions above are *design-choice* judgments for the planner, not
unverified facts.

## Open Questions

1. **Where exactly should the parent compute the State label?**
   - What we know: Results uses `(userState && STATE_NAMES[userState]) || userState || 'Your State'`.
     `STATE_NAMES` lives in Results.jsx (L93–107), not in a shared lib.
   - What's unclear: Whether to (a) pass `STATE_NAMES` down, (b) pass a pre-resolved `stateName` string,
     or (c) move `STATE_NAMES` to a shared module.
   - Recommendation: Pass a pre-resolved label or the map down (least churn). Don't refactor
     `STATE_NAMES` into a shared lib in this phase unless the planner wants to (out of scope risk).

2. **Should the `tierColors` light-mode band stay behind the banner?**
   - What we know: ElectionsView L535 sets `backgroundColor: isDark ? 'transparent' : tierStyle.bg`.
   - What's unclear: Whether light mode should also drop the band now that a banner exists. REQUIREMENTS
     scope light mode as "remains as-is" (Out of Scope), so the banner is a **dark-context** divider.
   - Recommendation: Keep the light band for light mode; render the banner in dark (it is a dark-only
     component per its own docstring L14). Confirm at the human checkpoint whether the banner should also
     show in light mode — Results renders it in both, so for true parity, render in both and let
     SectionBanner's dark styling apply. **Flag for the planner: match Results = banner in both modes.**

3. **Does ElectionsView's per-election outer loop need a per-election heading above the banners?**
   - What we know: ElectionsView groups tier *inside* election; Results has no election grouping.
   - Recommendation: With `nearestElection` (one election) there's no visible difference. Keep the
     existing structure; render banners per tier inside the (single) election.

## Environment Availability

> No external runtime dependencies. Frontend code/markup change only; uses the existing Vite dev server
> and already-installed packages. Skipping the dependency probe table (nothing to probe).

## Validation Architecture

> `.planning/config.json` not present in repo root at research time; no `nyquist_validation` flag found.
> This repo has **no automated test framework** wired for components (no jest/vitest config, no
> `*.test.*`/`*.spec.*` for ElectionsView). Validation is **manual / visual checkpoint** — consistent
> with how Phases 169 and 170 were verified (human sign-off on the live deploy, per 170-04-SUMMARY).

### Phase Requirements → Validation Map
| Req ID | Behavior | Validation Type | Method |
|--------|----------|-----------------|--------|
| DARK-03 | Elections renders in Results' dark treatment | Visual | Toggle dark mode, compare Elections tab vs. Representatives tab side-by-side; grep for zero stale literals |
| BANR-05 | Same SectionBanner dividers City→State→Federal | Visual | Scroll Elections; confirm banner per tier, correct city/state label + image, gradient fallback for uncurated |
| (preserve) Seeded shuffle | Order stable within a session, shuffles across sessions | Manual | Reload (same order) vs. new session/clear `ev:election-seed` (new order) |
| (preserve) Unopposed / no-candidate | Badges + empty box still render | Visual | Find an unopposed race + an empty race; confirm rendering in both light + dark |
| (preserve) `elections/me` auto-load | Connected user sees their elections | Manual | Log in with saved location, open Elections tab (prefilled mode) |
| (preserve) MiniCompass overlay | Side (desktop) / stacked (mobile), dark-legible | Visual | Enable compass mode; check both breakpoints in dark |

### Wave 0 Gaps
- [ ] No automated test infra to add (project convention = manual/visual). If the planner wants a
      regression guard, a grep assertion (`! grep -E '1a2235|2d3f5a|59b0c4' ElectionsView.jsx` in dark
      branches) is the lightest-weight check.

### Phase Gate
Human visual + functional checkpoint on the live deploy (mirror Phase 170's `checkpoint:human-verify`
approach) — confirm dark parity, banners per tier, and all 4 preserved behaviors.

## Security Domain

> No applicable ASVS surface. This phase changes presentation only — no auth, no input validation, no
> data handling, no crypto, no new network calls. The single new data flow is parent→child React props
> (already-fetched, already-trusted in-app values). No threat patterns introduced.

## Project Constraints (from MEMORY / project conventions)

> No `./CLAUDE.md` at repo root. Constraints sourced from user auto-memory + Phase 169/170 patterns:

- **ev-ui inline styles require `!important` on dark-mode color overrides** — but note SectionBanner is
  first-party (no `!important` needed); ev-ui surfaces (`PoliticianCard` via `.ev-politician-card`) are
  already covered by index.css blocks. [MEMORY: feedback_dark_mode_ev_ui_important]
- **Never faint gray on dark backgrounds; muted floor is `#8b949e`.** [MEMORY same]
- **No raw Windows `\` paths in committed `.md`** (Tailwind v4 build crash). Mitigated by `@source not`
  in index.css; keep using forward slashes. [MEMORY: feedback_tailwind_scans_planning_md]
- **Antipartisan design** — candidate ordering must stay randomized (seeded shuffle); never imply party
  ranking. [MEMORY: feedback_antipartisan_display + the existing `seededShuffle`]
- **PoliticianCard 4:5 / card geometry preserved** — only colors change (REQUIREMENTS Out of Scope).
- **Light mode remains as-is** — do not regress the light branch of any `isDark ?` ternary (D-03 in 169).

## Sources

### Primary (HIGH confidence — read in full this session)
- `src/components/ElectionsView.jsx` — the file being re-themed (full read, 813 lines)
- `src/pages/Results.jsx` — the template to mirror (full read, 1997 lines; banner wiring L1864–1886,
  call site L1975–1987, banner-input derivation L1045–1086)
- `src/components/SectionBanner.jsx` — locked divider component (full read)
- `src/lib/buildingImages.js` — `getBuildingImages` location→art bridge (full read)
- `src/index.css` — `@theme` tokens L12–47 + `.dark .ev-*` override blocks (read)
- `.planning/REQUIREMENTS.md` — DARK-03, BANR-05, Out of Scope, infrastructure-to-reuse
- `.planning/phases/169-.../169-PATTERNS.md` — the isDark/keep-names-change-values patterns
- `.planning/phases/170-.../170-04-SUMMARY.md` — banner shipped, pin/eyebrow removed, art in prod Storage
- `.planning/STATE.md` — milestone position, phase 172 scope

### Secondary (MEDIUM)
- `src/components/MiniCompass.jsx` (grep) — confirmed already `isDark`-aware

### Tertiary (LOW)
- None — no web research needed; this is a fully in-repo parity phase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all components verified present and imported
- Architecture (prop-threading + banner placement): HIGH — Results.jsx provides the exact template;
  call-site delta is small and verified
- Pitfalls: HIGH — all 6 traced to specific verified line numbers in the actual files
- Preserved behaviors: HIGH — each located and line-cited in ElectionsView.jsx

**Research date:** 2026-06-27
**Valid until:** ~2026-07-27 (stable — in-repo only; the only invalidation risk is someone editing
ElectionsView.jsx or Results.jsx before planning, which would shift line numbers but not the approach)
