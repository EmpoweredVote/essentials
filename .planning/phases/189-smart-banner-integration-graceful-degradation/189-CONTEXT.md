# Phase 189: Smart-Banner Integration & Graceful Degradation - Context

**Gathered:** 2026-07-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Make the icon row (Phase 187) and the population stats strip (Phase 188) appear **identically**
on both the Representatives/Results page and the Elections page, across all three banner tiers
(city / state / federal), rendered through **one shared abstraction** rather than duplicated per
call site — and guarantee a banner with no product links and no available stats still renders its
title, pin, and art exactly as in v19.0 (no empty containers, no layout shift, no console errors).

Frontend-only. No backend/DB changes. Requirements: SBAN-01..04.

**Current reality (verified this milestone):**
- `SectionBanner.jsx` is already the shared *presentational* component; both pages render `<SectionBanner>`.
- Data resolution already centralizes in `Results.jsx` (`populationMap`, `featureIconMap`,
  `buildingImageMap`) and threads to `ElectionsView` via props.
- The remaining duplication is the **6 per-tier `<SectionBanner>` call sites** — 3 in `Results.jsx`
  (~1951–1969) and 3 in `ElectionsView.jsx` (~577–598) — each hand-assembling `imageUrl` /
  `featureIcons` / `stats` props for its tier. That prop-assembly is what SBAN-03 targets.

**NOT in scope (new capabilities → other phases):** new stat facts beyond population, new product
icons, reciprocal icons on other apps' banners, expanding coverage, ev-ui promotion itself.
</domain>

<decisions>
## Implementation Decisions

### Shared abstraction shape
- **D-01:** Consolidate via a **pure `buildBannerProps(tier, maps)` helper** — both `Results.jsx`
  and `ElectionsView.jsx` spread its result into the existing `<SectionBanner {...} />`. It assembles
  the per-tier `imageUrl` / `featureIcons` / `stats` (and any related props) from the already-centralized
  maps, so the enhancement logic lives in exactly one place. **Not** a new `<LocationBanner>` wrapper
  component — that would bundle app-specific data resolution into a "component" (less cleanly
  promotable) and add an indirection layer. `SectionBanner` stays the single presentational component.
- **D-01a:** After this change there may still be N call sites textually, but they become uniform
  one-liners (`<SectionBanner {...buildBannerProps('city', maps)} />`) with zero page-specific
  divergence in what props are assembled — satisfying SBAN-03's single-source-of-truth intent.

### Where the shared abstraction lives
- **D-02:** Build the helper **in-app now** (e.g. `src/lib/` or alongside `SectionBanner` in
  `src/components/`), promotable to `@empoweredvote/ev-ui` in a later pass. No `ev-ui` repo change
  this phase (avoids the separate-repo tag-publish cycle blocking 189). Matches the roadmap's
  "promotable to ev-ui" wording — SectionBanner is the promotable unit; the app owns the wiring.

### Population bundle size (carry-over from 188)
- **D-03:** The committed population bundle is ~1.16 MB minified / ~420 KB gzip and currently sits in
  the main JS chunk. **Researcher assesses** whether a `dynamic import()` cleanly splits it out of the
  initial bundle. Include the split **only if it is a low-risk, near-1-line change**; otherwise **defer**
  it as its own perf task and log that decision. Do not let a bundle refactor expand 189's scope.

### Empty-state parity proof (SBAN-04)
- **D-04:** Prove v19.0 parity **lightweight**: code inspection + a **live spot-check of a no-data
  location** (e.g. a government-list county browse with no place link and an unresolved city stat →
  no icon row, no stat block), plus keep the existing `shouldRenderStat(stats)` and
  `featureIcons?.length > 0` guards **unit-tested**. **No new snapshot/visual-regression infra** — this
  repo doesn't use it today and 189 shouldn't introduce it.

### Claude's Discretion
- Exact filename/location of the helper and its precise signature (`buildBannerProps(tier, maps)` shape),
  provided D-01/D-02 hold.
- Whether the helper returns a spread-ready props object or the pages destructure it — planner's call.
- Exact no-data location(s) used for the live spot-check.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope & requirements
- `.planning/ROADMAP.md` §"Phase 189" — goal + the 4 success criteria (parity, single-source-of-truth,
  v19.0 empty-state, all-three-tiers).
- `.planning/REQUIREMENTS.md` — SBAN-01..04 (lines ~75–82).

### Prior-phase decisions this phase converges (MUST honor)
- `.planning/phases/188-location-stats-strip/188-CONTEXT.md` — stats decisions D-01..D-13 (omit/resolve
  rules, top-right navy scrim, dark-mode/tokens/no-`!important`, population-only).
- `.planning/phases/188-location-stats-strip/188-UI-SPEC.md` — locked scrim layout/type/color values.
- `.planning/phases/187-tethered-feature-icon-row/187-CONTEXT.md` — icon-row decisions + the explicit
  note that "one shared component, no page-specific divergence" convergence was deferred to Phase 189.
- `.planning/phases/188-location-stats-strip/188-01-SUMMARY.md` — records the ~1.16 MB bundle-size flag
  (input to D-03).

### No external ADRs/specs beyond the above — requirements fully captured in decisions + prior CONTEXT.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/SectionBanner.jsx` — the single presentational banner; already renders the
  `data-slot="stats"` scrim (188) and the feature-icon row (187), with exported `shouldRenderStat`
  predicate and the `featureIcons?.length > 0` guard. This is what `buildBannerProps` feeds.
- `src/pages/Results.jsx` — already computes `populationMap` (`resolvePopulation` per tier),
  `featureIconMap` (`resolveFeatureIcons`), `buildingImageMap` (`getBuildingImages`) as `useMemo`s and
  threads them to both its own 3 banners and to `<ElectionsView>`. The resolution layer to reuse.
- `src/components/ElectionsView.jsx` — receives those maps as props and renders its own 3
  `<SectionBanner>` branches (pure pass-through, no router/`browse_geo_id` access).
- `src/lib/population.js` (`resolvePopulation`), `src/lib/featureIcons.js` (`resolveFeatureIcons`),
  `src/lib/buildingImages.js` (`getBuildingImages`) — the per-tier resolvers `buildBannerProps` composes.

### Established Patterns
- Resolution is centralized in `Results.jsx` and passed down; `buildBannerProps` should consume the
  already-resolved maps, NOT re-resolve, to keep both pages identical.
- Dark-mode-only, `@theme` tokens, no `!important` (188 D-13 / 187) — unchanged.

### Integration Points
- The 6 `<SectionBanner>` call sites (Results ~1951–1969, ElectionsView ~577–598) are the edit surface.
- `buildBannerProps` sits between the resolved maps and the presentational `SectionBanner`.
</code_context>

<specifics>
## Specific Ideas

- "Single source of truth, promotable to `@empoweredvote/ev-ui`" (SBAN-03) is the guiding phrasing:
  keep `SectionBanner` clean/promotable; app-specific wiring lives in the in-app helper.
- The federal-tier banner already shows `POPULATION 332,387,540` (188 + D2 browse) — parity work must
  preserve that on both pages.
</specifics>

<deferred>
## Deferred Ideas

- **Population bundle code-split** — deferred to its own perf task if D-03's research finds it non-trivial.
- **Promote the banner/helper into `@empoweredvote/ev-ui`** — explicit later pass, not this phase.
- **Additional stat facts / more product icons / reciprocal icons on other apps** — separate future phases.

None of the above are in Phase 189 scope.
</deferred>

---

*Phase: 189-smart-banner-integration-graceful-degradation*
*Context gathered: 2026-07-08*
