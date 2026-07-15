---
phase: 204-compass-lens-switcher
plan: 04
subsystem: compass

tags: [react, compass, lens-switcher, results-grid, ui]

# Dependency graph
requires: [204-01, 204-02, 204-03]
provides:
  - "MiniCompass lensTopicIds prop forwarded into computeDisplaySpokes (per-card lens application)"
  - "CompassControlsBar renders LensChipRow (binary Lens toggle retired); normal-flow row above the section banner"
  - "Results.jsx global active-lens wiring: augmented lens list, onSelectLens/onCalibrate, per-card lensTopicIds + matchCount pre-check, calibration handoff URL"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Global lens selection drives every results-grid card via activeLensKey; per-office auto-lensing retired for the grid"
    - "Calibration handoff builds return URL only from window.location.href (own origin), never a caller-supplied param (T-204-04)"

key-files:
  created: []
  modified:
    - src/components/MiniCompass.jsx
    - src/components/CompassControlsBar.jsx
    - src/pages/Results.jsx

key-decisions:
  - "COMPASS_URL const moved earlier in Results component to precede the onCalibrate closure that uses it (ordering cleanup, same value)"
  - "Null-guard added on preferredForPol so an unresolved lens key resolves to Best Match rather than throwing (T-204-01)"
  - "Post-checkpoint: lens-chip non-active states use an opaque surface (#FFFFFF/#161b22) — a transparent fill let the location banner bleed through and killed contrast"
  - "Post-checkpoint: inactive/LIT chip color lightened toward white in dark mode so dark lens hues (federal navy #1E3A5F) stay legible"
  - "Post-checkpoint: controls bar moved from position:absolute (0-height anchor) to normal flow so it sits above the city SectionBanner instead of over it — accepts a one-row layout shift when toggling Compass"
  - "Post-checkpoint: Best Match overlay gated on the full both-answered count (empty-preferred branch), matching what computeDisplaySpokes' Req 9 fill actually draws — the prior selectedTopics-only gate hid Best Match whenever the user's selected compass shared <3 topics with an official"

patterns-established:
  - "Pre-check gate for showing a compass overlay must mirror the exact topic set computeDisplaySpokes will render, or overlays silently hide"

requirements-completed: [LENS-01]

# Metrics
duration: ~7min (code) + live verification
completed: 2026-07-15
---

# Phase 204 Plan 04: Wire the Global Lens Switcher into the Results Grid — Summary

**MiniCompass now honors an explicit lens topic set, CompassControlsBar renders the data-driven LensChipRow in place of the binary Lens toggle, and Results.jsx is rebuilt around the global `activeLensKey` — retiring per-office grid auto-lensing and adding the calibration handoff. Verified live on essentials.empowered.vote and approved.**

## Performance

- **Duration:** ~7 min for the two automated code tasks; human-verify checkpoint completed on the live site across several follow-up fixes.
- **Tasks:** 2 automated + 1 blocking human-verify checkpoint (approved).
- **Files modified:** 3.

## Accomplishments
- **Task 1** — `MiniCompass` gained a `lensTopicIds` prop (forwarded into `computeDisplaySpokes`, added to the useMemo deps); `CompassControlsBar` dropped the binary aria-pressed "Lens" button and now renders `LensChipRow` (desktop wrap / mobile nowrap-scroll), Stance Min/Max + CompassKey unchanged.
- **Task 2** — `Results.jsx` switched from `lensOverride/getEffectiveLens` to the global `activeLensKey/setActiveLens/lenses`; added the augmented lens list (synthesized Best Match `custom` chip + API lenses annotated with `calibrated`/`topicCount`), `onSelectLens`/`onCalibrate` handlers, per-card `activeLensTopicIds` + `matchCount` pre-check, and the same-tab calibration handoff URL.
- **Task 3 (human-verify)** — Confirmed on the live site: chip row replaces the toggle, per-lens application works, Best Match/coral vs lens colors, needs-calibration prompt + handoff round-trip, persistence, and data-driven chip addition. Approved by the user.

## Task Commits
1. **Task 1: Forward lensTopicIds through MiniCompass; render LensChipRow in CompassControlsBar** — `91b6bdce` (feat)
2. **Task 2: Global active-lens wiring in Results.jsx (retire grid auto-lensing + calibration handoff)** — `b2885af5` (feat)

### Post-checkpoint fixes (found during live human-verify)
3. **Opaque lens-chip surface so the banner doesn't bleed through** — `c46703b1` (fix)
4. **Lift lens bar above the banner + legible inactive text in dark mode** — `e8f335cd` (fix)
5. **Best Match overlay gated on full both-answered count** — `9a633d93` (fix)

## Files Created/Modified
- `src/components/MiniCompass.jsx` — `lensTopicIds` prop → `computeDisplaySpokes` + useMemo deps.
- `src/components/CompassControlsBar.jsx` — imports/renders `LensChipRow`; binary Lens toggle removed; normal-flow (right-aligned desktop) row above the banner.
- `src/pages/Results.jsx` — global active-lens wiring, augmented lens list, select/calibrate handlers, per-card lens topic set + overlay pre-check, calibration handoff URL.

## Decisions Made
- COMPASS_URL declaration hoisted above the calibrate closure (ordering only).
- `preferredForPol` null-guarded (T-204-01: unknown key → Best Match, never a crash).
- Chip non-active states made opaque; inactive color lightened in dark mode for legibility; controls bar moved to normal flow above the banner (all from live checkpoint feedback).
- Best Match overlay pre-check changed to the full both-answered count so the gate matches the Req 9 fill (the reported "Best Match doesn't show" bug).

## Deviations from Plan
- **Task 2 auto-fixes (Rule 1/2):** COMPASS_URL ordering cleanup and the `preferredForPol` null-guard, both documented above; no scope creep.
- **Post-checkpoint fixes:** four UI/behavior fixes surfaced during live verification (opaque chips, dark-mode legibility, above-banner layout, Best Match gating). All within 204-04's files and requirements (LENS-01, Req 3/5/8/9/10).

## Issues Encountered
- The Best Match gate/render mismatch (fixed in `9a633d93`) — the overlay pre-check counted only `selectedTopics ∩ both-answered`, but `computeDisplaySpokes` draws Best Match from all both-answered in-scope topics via the Req 9 fill, so Best Match hid whenever the user's selected compass shared <3 topics with an official. Gate now uses the full both-answered count.
- Two unrelated fixes were made in the same session but are **not part of phase 204**: a global scroll-to-top on navigation (`e675cecc`) and the landing-page coverage copy update (`8bd691f5`).

## User Setup Required
None.

## Next Phase Readiness
- Phase 204 (LENS-01) delivered: one global, persisted, data-driven lens switcher drives every results-grid card, with calibration states + handoff; per-office grid auto-lensing retired. All 11 SPEC acceptance criteria confirmed live and approved.

---
*Phase: 204-compass-lens-switcher*
*Completed: 2026-07-15*

## Self-Check: PASSED

Task 1/Task 2 commits and all post-checkpoint fix commits verified present; live human-verify approved by the user.
