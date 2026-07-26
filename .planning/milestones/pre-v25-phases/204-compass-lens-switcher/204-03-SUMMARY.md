---
phase: 204-compass-lens-switcher
plan: 03
subsystem: ui
tags: [react, compass, lens-switcher, ev-ui]

# Dependency graph
requires: []
provides:
  - "src/components/LensChipRow.jsx — presentational, data-driven N-lens chip row (active/LIT/needs-calibration states, per-lens icons, hover/tap calibration prompt)"
affects: [204-04-compass-controls-bar-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "stance-btn pill + inline-style-spread active-state idiom (CompassControlsBar) reused per chip"
    - "useTheme() isDark inline-ternary idiom for dark-mode contrast on the needs-calibration fill"
    - "Desktop hover-reveals-prompt vs mobile first-tap-reveals/second-tap-confirms affordance, implemented as local component state (no new shared pattern)"

key-files:
  created:
    - src/components/LensChipRow.jsx
  modified: []

key-decisions:
  - "Kept the component fully presentational and prop-driven per the plan's interface contract — no context/navigation/analytics wiring here; that is explicitly Plan 04's job."
  - "renderLensIcon keys off lens.key (federal/judicial/local/custom) with a neutral fallback dot for any future lens key, rather than trusting an API-supplied icon field, matching the plan's explicit icon set instruction."
  - "Desktop: hovering a purple chip reveals the prompt and a single click on the chip (already having been hovered) fires onCalibrate — no extra confirm click needed since the hover itself is the desktop-native 'reveal' step. Mobile: strict two-tap (first tap sets local tapped state and shows the prompt without firing onCalibrate; second tap, or tapping the prompt element, fires onCalibrate) per D-11."
  - "aria-pressed is omitted entirely (not set to false) on needs-calibration chips, since they are not yet selectable toggle buttons in that state."

requirements-completed: [LENS-01]

# Metrics
duration: 12min
completed: 2026-07-14
---

# Phase 204 Plan 03: LensChipRow Component Summary

**Data-driven `LensChipRow.jsx` rendering N lens pills (active lens-color fill / LIT-outlined / grey+purple-rim needs-calibration) with mirrored EV-CompassV2 iconography and a desktop-hover / mobile-two-tap "Calibrate this lens?" affordance.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-07-14T20:07:00Z (approx.)
- **Completed:** 2026-07-14T20:19:36Z
- **Tasks:** 1 completed
- **Files modified:** 1 created

## Accomplishments
- New `src/components/LensChipRow.jsx` maps over a caller-supplied `lenses` array (in the given order — Best Match first, no re-sort) rendering one `stance-btn` pill per lens with three distinct visual states.
- Per-lens icons mirrored verbatim from `EV-CompassV2/src/pages/CombinedPage.jsx`'s `renderLensIcon` (Capitol dome = federal, gavel = judicial, house = local) plus the existing `CompassControlsBar` viewfinder icon reused for the synthesized `custom`/Best Match chip, and a neutral fallback dot for any unrecognized future lens key.
- Hover (desktop) / tap-to-prompt (mobile, two-tap) affordance implemented via local `useState` (`hoveredKey`, `tappedKey`) — a LIT chip never shows the prompt; a needs-calibration chip's click always resolves to `onCalibrate`, a LIT chip's click always resolves to `onSelectLens`.
- `lens.description`/`lens.name` reach the DOM only as text content and via the `title` attribute — no `dangerouslySetInnerHTML` anywhere (T-204-03 mitigated).

## Task Commits

Each task was committed atomically:

1. **Task 1: LensChipRow component with three chip states, icons, and hover/tap prompt** - `a5bea938` (feat)

**Plan metadata:** (this commit, docs — worktree mode, orchestrator merges)

## Files Created/Modified
- `src/components/LensChipRow.jsx` - New default-exported component; three chip states (active/LIT/needs-calibration), per-lens SVG icons, local hover/tap state driving the calibration prompt, click routing to `onSelectLens`/`onCalibrate`.

## Decisions Made
- See `key-decisions` in frontmatter above (icon-by-key mapping, desktop-hover-then-single-click vs mobile-two-tap split, `aria-pressed` omission on needs-calibration chips).

## Deviations from Plan

None - plan executed exactly as written. All five `must_haves.truths` and all six acceptance criteria in `204-03-PLAN.md` are satisfied by the component as built; `npm run build` exits 0 (pre-existing large-chunk warning is unrelated to this change and predates this plan).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

`LensChipRow` is ready to be imported and wired into `CompassControlsBar.jsx` by Plan 04, which owns:
- Sourcing the `lenses` prop (from `CompassContext`, with the synthesized Best Match/`custom` entry prepended)
- The wrap-vs-scroll container (desktop wrap vs mobile horizontal-scroll strip, D-08/D-09)
- `onSelectLens`/`onCalibrate` implementations (persistence to `localStorage['ev:compassLens']`, the `COMPASS_URL?calibrate=<key>&return=...` navigation, PostHog analytics)
- Removing the old binary Lens toggle this component replaces

No blockers. This plan intentionally left all context/navigation/persistence wiring to Plan 04 per the interface boundary defined in `204-03-PLAN.md`.

---
*Phase: 204-compass-lens-switcher*
*Completed: 2026-07-14*
