---
phase: 187-tethered-feature-icon-row
plan: 02
subsystem: ui
tags: [react, floating-ui, treasury, feature-icons, section-banner, accessibility]

# Dependency graph
requires:
  - phase: 187-01
    provides: "PRODUCT_REGISTRY + resolveFeatureIcons({representingCity, userState, treasuryCities}) in src/lib/featureIcons.js; centralized TREASURY_URL export in src/lib/treasury.js; public/treasury-symbol.svg"
provides:
  - "FeatureIconChip component in SectionBanner.jsx — bottom-right circular semi-transparent chip row with @floating-ui hover+focus accessible tooltip, wrapping a real <a target=_blank rel=noopener noreferrer aria-label>"
  - "featureIconMap useMemo in Results.jsx (resolveFeatureIcons, reusing the existing treasuryCities fetch) drilled to all 3 direct Results.jsx banners + <ElectionsView>"
  - "featureIconMap prop threaded through ElectionsView.jsx to its own 3 SectionBanner calls (cross-page parity)"
  - "Single centralized TREASURY_URL consumed by both the existing per-body text link and the new chip (no divergent domains)"
affects: [189]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FeatureIconChip reimplements IconOverlay.jsx's IconWithTooltip @floating-ui pattern (useHover+useFocus+useDismiss+useRole('tooltip')+FloatingPortal) locally in SectionBanner, adapted to wrap a real <a> instead of a bare <span> so aria-label lives on the link itself"
    - "featureIconMap useMemo mirrors the existing buildingImageMap precedent exactly ({Local,State,Federal} tier-map, parent-resolved + prop-drilled, zero redundant fetches)"

key-files:
  created: []
  modified:
    - src/components/SectionBanner.jsx
    - src/pages/Results.jsx
    - src/components/ElectionsView.jsx

key-decisions:
  - "Chip background is a semi-transparent navy layer (rgba(13,17,23,0.55) + 2px backdrop-blur) rather than a token-only treatment, because treasury-symbol.svg ships with no dark variant (RESEARCH Pitfall 3) — the chip itself is what guarantees legibility against any banner art"
  - "Tooltip content renders through FloatingPortal so it is never clipped by the banner's overflow:hidden"
  - "Deleted the local TREASURY_URL const in Results.jsx in favor of the centralized import from lib/treasury.js — the existing per-body 'Explore {city} revenue and expenses' text link and the new chip now resolve to the identical financials.empowered.vote domain"

patterns-established:
  - "Any future banner-anchored external product icon should follow the FeatureIconChip shape ({key,href,label,iconSrc}) and the same useMemo-resolve + prop-drill flow through Results.jsx -> ElectionsView.jsx -> SectionBanner.jsx"

requirements-completed: [ICON-01, ICON-02, ICON-03, TETH-01, TETH-02]

# Metrics
duration: 55min
completed: 2026-07-07
---

# Phase 187 Plan 02: Feature-Icon Rendering + Wiring Summary

**Bottom-right Treasury chip with an accessible @floating-ui hover/focus tooltip, resolved once via `featureIconMap` and drilled through both Results.jsx and ElectionsView.jsx to all six section banners, deep-linking each banner's own location into financials.empowered.vote.**

## Performance

- **Duration:** ~55 min (including human-verify checkpoint wait)
- **Started:** 2026-07-07T17:35:00Z
- **Completed:** 2026-07-07T18:20:00Z (human approval)
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments
- `SectionBanner.jsx` renders a real bottom-right circular-chip row for each entry in `featureIcons`, replacing the inert scaffolding slot from v19.0. Empty/absent `featureIcons` renders nothing (TETH-03, already satisfied end-to-end by 187-01's resolver + this plan's render guard).
- `FeatureIconChip` reimplements the `IconWithTooltip` @floating-ui pattern (useHover + useFocus + useDismiss + useRole('tooltip') + FloatingPortal) from `IconOverlay.jsx`, adapted to wrap a real `<a target="_blank" rel="noopener noreferrer" aria-label=...>` — tooltip shows on both hover AND keyboard focus, with no native `title=` attribute.
- `Results.jsx` resolves `featureIconMap` once via a `useMemo` mirroring the existing `buildingImageMap` precedent exactly, reusing the already-fetched `treasuryCities` state (no second fetch). All three direct banners plus `<ElectionsView>` receive it.
- `ElectionsView.jsx` accepts `featureIconMap = {}` (same default-empty-object idiom as `buildingImageMap`) and threads `featureIcons={featureIconMap?.Local|State|Federal}` to its own three `<SectionBanner>` calls — identical chip behavior on both `/results` and the Elections tab.
- Centralized `TREASURY_URL`: the local const in `Results.jsx` was deleted in favor of the `lib/treasury.js` export, so the existing per-body "Explore {city} revenue and expenses" text link and the new chip now resolve to the same `financials.empowered.vote` domain.
- Human checkpoint (Task 3) approved 2026-07-07: chip placement (bottom-right, no title overlap), hover+keyboard-focus tooltip parity, cross-location tether correctness (banner's own location, not the user's saved location), absence-when-no-data, empty top-right reserved for Phase 188, and cross-page parity between Results and Elections tabs — all confirmed working with no console errors.

## Task Commits

1. **Task 1: Render the featureIcons chip row + accessible tooltip in SectionBanner.jsx** - `bcaac813` (feat)
2. **Task 2: Resolve featureIconMap in Results.jsx and drill it through ElectionsView to all six banners** - `7fb60fde` (feat)
3. **Task 3: Human visual + tether verification (checkpoint:human-verify, blocking)** - APPROVED 2026-07-07, no code changes (verification-only gate)

**Plan metadata:** (this commit) `docs(187-02): create plan summary`

## Files Created/Modified
- `src/components/SectionBanner.jsx` - Added `FeatureIconChip` (local component, @floating-ui tooltip pattern); replaced the inert `featureIcons` scaffolding slot with a real bottom-right circular-chip row guarded by `featureIcons?.length > 0`.
- `src/pages/Results.jsx` - Imported `resolveFeatureIcons` from `../lib/featureIcons` and `TREASURY_URL` from `../lib/treasury` (removing the local const); added `featureIconMap` `useMemo`; wired `featureIcons={featureIconMap.Local|State|Federal}` onto the 3 direct banners and `featureIconMap={featureIconMap}` onto `<ElectionsView>`.
- `src/components/ElectionsView.jsx` - Added `featureIconMap = {}` to the destructured prop list; wired `featureIcons={featureIconMap?.Local|State|Federal}` onto its own 3 `<SectionBanner>` calls.

## Decisions Made
- Chip visual treatment: semi-transparent navy circle (`rgba(13,17,23,0.55)` + 2px backdrop-blur) rather than a pure theme-token background, because `treasury-symbol.svg` has no dark variant — the chip background is the legibility guarantee (D-05, RESEARCH Pitfall 3).
- Tooltip rendered through `FloatingPortal` so banner `overflow` never clips it.
- Removed Results.jsx's local `TREASURY_URL` const entirely in favor of the plan-187-01 centralized export — single domain for both the existing text link and the new icon (TETH-02 consistency).

## Deviations from Plan

None - plan executed exactly as written. Both automated tasks matched the plan's exact component shape, prop names, useMemo dependency arrays, and file line targets; the human checkpoint was approved without any requested changes.

## Issues Encountered

None. Build and the treasury/featureIcons vitest suite passed on first attempt for both tasks; the human-verify checkpoint (Task 3) was approved on the first pass with no follow-up defects — the only note from the human was a future-work idea (a clickable Essentials-logo return link inside Treasury Tracker once cross-app linking exists), explicitly flagged as not a defect and out of scope for this phase.

## Known Stubs

None. `featureIconMap` resolves real data end-to-end (representingCity/userState/treasuryCities -> Treasury entity -> href); no hardcoded empty/mock values were introduced. The chip row correctly renders nothing when `resolveFeatureIcons` returns an empty array for a tier (TETH-03) — this is the intended graceful-omission behavior, not a stub.

## Threat Flags

None. This plan's rendering surface (`<a target="_blank">` in `FeatureIconChip`) is exactly the T-187-02/T-187-03 threats already registered in this plan's `<threat_model>` and mitigated: href sourced exclusively from `featureIconMap` (banner's own location, never the user's saved location) and every chip link carries `rel="noopener noreferrer"`. No new network endpoints, auth paths, or schema changes were introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Phase 187 (Tethered Feature-Icon Row) is fully complete: `SectionBanner.jsx`'s `featureIcons` slot is live end-to-end on all six banners (Results.jsx x3, ElectionsView.jsx x3), matching the `buildingImageMap` precedent Phase 189 will consolidate.
- Phase 188 (Location Stats Strip) can proceed independently — the top-right slot remains empty and untouched by this plan (D-07).
- Phase 189 (Smart-Banner Integration) has two now-proven parallel prop-drill flows (`buildingImageMap`, `featureIconMap`) to consolidate into one shared component; `FeatureIconChip`'s local @floating-ui tooltip pattern is a candidate for extraction alongside `IconOverlay.jsx`'s existing `IconWithTooltip` (deferred per RESEARCH Open Question 3).
- No blockers.

## Self-Check: PASSED

All 3 modified files confirmed present on disk with the expected content (`FeatureIconChip` in
SectionBanner.jsx, `featureIconMap` in Results.jsx and ElectionsView.jsx). Both commit hashes
(`bcaac813`, `7fb60fde`) confirmed in `git log --oneline --all`. `npm run build` succeeds.
`npx vitest run src/lib/treasury.test.js src/lib/featureIcons.test.js` — 23/23 green, no regressions.

---
*Phase: 187-tethered-feature-icon-row*
*Completed: 2026-07-07*
