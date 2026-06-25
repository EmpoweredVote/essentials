---
phase: 170-section-banners-continuous-scroll-results
plan: "03"
subsystem: frontend-page
tags: [section-banner, continuous-scroll, tier-layout, results-page, refactor]
dependency_graph:
  requires: [170-01-SectionBanner-component, 170-02-FilterBar-tier-removal]
  provides: [Results.jsx with SectionBanner dividers, tier-filter code fully removed]
  affects: [src/pages/Results.jsx]
tech_stack:
  added: []
  patterns:
    - "Fragment key wrapping banner + tier div as siblings (avoid double negative-margin)"
    - "filteredHierarchy appointedFilter-only dependency (selectedFilter removed)"
    - "buildingImageMap.Local/State/Federal passed as imageUrl — null triggers graceful fallback"
key_files:
  created: []
  modified:
    - src/pages/Results.jsx
decisions:
  - "Banner rendered as sibling before tier <div> via Fragment key — avoids double negative-margin that would cause horizontal overflow"
  - "tierFilter={selectedFilter} on ElectionsView removed entirely (default 'All' applies — no behavior change)"
  - "locationLabel memo removed entirely — became dead code after selectedFilter removal; SectionBanner uses representingCity/userState directly"
  - "Pre-existing ESLint errors (computeVariant, deriveScopedTopics, etc.) left in place — out of scope per deviation rules"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-25"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 1
---

# Phase 170 Plan 03: Wire SectionBanner into Results.jsx Summary

**One-liner:** Results page now renders City → State → Federal as one continuous scroll with full-bleed SectionBanner dividers per tier, tier-filter logic fully removed, and production build clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove tier-filter, scroll-spy, dead building-image state, and eyebrows | 13bbc3a | src/pages/Results.jsx |
| 2 | Insert SectionBanner dividers before each tier group (School folds under City) | 0345d2d | src/pages/Results.jsx |

## What Was Built

### Task 1 — Dead code and tier-filter removal

Surgically removed all tier-filter infrastructure from `Results.jsx`:

- **`selectedFilter`/`setSelectedFilter` useState** removed (was L477-480) — the entire tier sort concept is gone
- **`scrollActiveTier`/`setScrollActiveTier` useState** removed (was L525) — scroll-spy tracking state gone
- **`activeBuildingImage` computation** removed (was L1232-1235) — was already unused; now formally deleted
- **IntersectionObserver scroll-spy `useEffect`** removed (was L1237-1259) — observers `[data-tier]` sections to swap building image header; the banner replaces this
- **`locationLabel` useMemo** removed — became dead code (was only used in the now-gone header; `SectionBanner` uses `representingCity`/`userState` directly)
- **`filteredHierarchy` useMemo** simplified — removed `selectedFilter` tier-filter branch; `appointedFilter === 'All'` early-return is the only guard; dep array reduced to `[hierarchy, appointedFilter]`
- **Empty-state loop** — removed the `if (selectedFilter !== 'All' && selectedFilter !== tier)` guard and the `{selectedFilter === 'All' && ( eyebrow... )}` block
- **Tier render loop eyebrow** — removed the `{selectedFilter === 'All' && ( <span>{tier}</span> )}` block (banner becomes the single tier label per D-02)
- **FilterBar call site** — removed `selectedFilter={...}` and `onFilterChange={...}` props (Plan 170-02 already dropped them from FilterBar)
- **ElectionsView `tierFilter` prop** — removed `tierFilter={selectedFilter}`; component defaults to `'All'`, no behavior change
- **sessionStorage save** — removed `filter: selectedFilter` from cached result payload

### Task 2 — SectionBanner wiring

Added `SectionBanner` import and inserted banners before each populated tier group:

```
tier === 'Local'   → <SectionBanner tier="city"    locationName={representingCity+', '+userState} imageUrl={buildingImageMap.Local} />
tier === 'School'  → null (folds under City banner per D-07)
tier === 'State'   → <SectionBanner tier="state"   locationName={STATE_NAMES[userState] || userState} imageUrl={buildingImageMap.State} />
tier === 'Federal' → <SectionBanner tier="federal" locationName="United States" imageUrl={buildingImageMap.Federal} />
```

Implementation pattern: each iteration returns `<Fragment key={tier}>` containing the optional banner followed by the tier `<div>`. The banner uses its own `-mx-6 md:-mx-12` full-bleed (from SectionBanner.jsx), and the tier div keeps its own `px-6 md:px-12` — no double-margin collision since they are siblings, not nested.

`buildingImageMap.Local` and `buildingImageMap.State` may be `null` for coverage areas without curated art — `SectionBanner` handles this with tier-tinted fallback gradients (BANR-03). `buildingImageMap.Federal` is always `/images/us-capitol.jpg` (non-null).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] locationLabel memo removed rather than simplified**

- **Found during:** Task 1
- **Issue:** After removing `selectedFilter`, the `locationLabel` memo (which was simplified to just return `city && state`) had zero usages in the JSX — the old page header was removed in Phase 169. The ESLint `no-unused-vars` error confirmed it was dead code.
- **Fix:** Removed the entire `locationLabel` memo. `SectionBanner` uses `representingCity` and `userState` directly (per the plan's interface spec).
- **Files modified:** src/pages/Results.jsx
- **Commit:** 13bbc3a

**2. [Rule 3 - Blocking] tierFilter={selectedFilter} removed from ElectionsView**

- **Found during:** Task 1 — grep found `tierFilter={selectedFilter}` at L2008 still referencing the removed `selectedFilter`
- **Issue:** The plan mentioned this as a cleanup item. ElectionsView has `tierFilter = 'All'` as its default, so removing the prop is identical in behavior.
- **Fix:** Removed `tierFilter={selectedFilter}` prop from `<ElectionsView>` call.
- **Files modified:** src/pages/Results.jsx
- **Commit:** 13bbc3a

### Pre-existing Issues (Out of Scope)

The following ESLint `no-unused-vars` errors existed before this plan and are left untouched per deviation scope rules:
- `computeVariant` (L5), `deriveScopedTopics` (L40), `getImageUrl` (L69), `formatElectionDate` (L73), `formatLegendName` (L138), `filteredAnswers` (L657)
- Empty block statement warnings at L516, L540, L1545

These are logged as deferred items and do not affect plan functionality.

## Verification

```
grep -c "selectedFilter" src/pages/Results.jsx      → 0  PASS
grep -c "scrollActiveTier" src/pages/Results.jsx    → 0  PASS
grep -c "activeBuildingImage" src/pages/Results.jsx → 0  PASS
grep -c "IntersectionObserver" src/pages/Results.jsx → 0  PASS
grep -c "import SectionBanner" src/pages/Results.jsx → 1  PASS
grep -c 'tier="city"' src/pages/Results.jsx         → 1  PASS
grep -c 'tier="state"' src/pages/Results.jsx        → 1  PASS
grep -c 'tier="federal"' src/pages/Results.jsx      → 1  PASS
grep -c 'tier="school"' src/pages/Results.jsx       → 0  PASS
grep -c "buildingImageMap.Local" src/pages/Results.jsx   → 1  PASS
grep -c "buildingImageMap.State" src/pages/Results.jsx   → 1  PASS
grep -c "buildingImageMap.Federal" src/pages/Results.jsx → 1  PASS
grep -c 'locationName="United States"' src/pages/Results.jsx → 1  PASS
npm run build                                        → exit 0  PASS
```

## Known Stubs

None. The SectionBanner renders with real data from `representingCity`, `userState`, and `buildingImageMap`. For coverage areas without curated art (most areas until Phase 171), `buildingImageMap.Local/State` will be `null` — the SectionBanner graceful fallback gradient displays. This is expected and intentional, not a stub.

## Threat Flags

None. All threat model items from the plan frontmatter are accepted:
- T-170-04: `locationName` is React-escaped text from city/state data — no injection risk
- T-170-05: IntersectionObserver scroll-spy removed — reduces work, no new observers added
- T-170-SC: No new packages installed this plan

## Self-Check: PASSED

- [x] src/pages/Results.jsx modified — verified via Read and grep
- [x] Commit 13bbc3a (Task 1) exists — verified via git log
- [x] Commit 0345d2d (Task 2) exists — verified via git log
- [x] All grep acceptance criteria return expected counts
- [x] npm run build exits 0 (7.08s build time)
- [x] No tier="school" banner rendered
- [x] selectedFilter/scrollActiveTier/activeBuildingImage/IntersectionObserver all zero
