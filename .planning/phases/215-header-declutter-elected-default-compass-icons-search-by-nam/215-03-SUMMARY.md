---
phase: 215-header-declutter
plan: 03
subsystem: ui
tags: [react, floating-ui, accessibility, tooltip, compass]

# Dependency graph
requires:
  - phase: 215-header-declutter (plan 01/02)
    provides: header declutter groundwork (type filter defaults, search-by-name removal)
provides:
  - Icon-only desktop lens buttons in LensChipRow.jsx with per-button aria-label
  - Accessible @floating-ui/react hover/focus tooltip replacing the removed native title
affects: [215-header-declutter]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-item floating-ui tooltip child component (LensButton), mirroring the in-repo IconWithTooltip precedent from IconOverlay.jsx"
    - "getReferenceProps(existingHandlers) composition to merge floating-ui interaction handlers with pre-existing onMouseEnter/onMouseLeave without clobbering either"

key-files:
  created: []
  modified:
    - src/components/LensChipRow.jsx

key-decisions:
  - "Built a LensButton child component (one useFloating/useInteractions instance per lens) rather than a single shared open-key, matching the IconWithTooltip precedent in IconOverlay.jsx"
  - "Tooltip text falls back to lens.name when lens.description is absent (matches prior native-title fallback behavior for the synthesized Best Match/custom lens)"
  - "Tooltip render is gated on isDesktop && isOpen && !showPrompt so it never stacks with the needs-calibration purple prompt (Pitfall 3)"

patterns-established:
  - "Pattern: per-item floating-ui tooltip wrapping an existing interactive element (button) directly via refs.setReference, no extra wrapping span, so the element's existing focusability/handlers are preserved"

requirements-completed: []  # HDR-03 intentionally NOT marked complete — Task 2 (human-verify checkpoint) is still pending

coverage:
  - id: D1
    description: "Desktop lens buttons render icon-only with aria-label and a hover/keyboard-focus floating-ui tooltip; mobile keeps icon+label; native title removed; gavel icon preserved for Judicial; calibration prompt handlers merged via getReferenceProps"
    requirement: "HDR-03"
    verification:
      - kind: automated_ui
        ref: "grep -c 'title=' src/components/LensChipRow.jsx == 0; grep -c 'aria-label' >=1; grep -c '@floating-ui/react' ==1; grep -c 'getReferenceProps({' >=1; npm run lint && npm run build"
        status: pass
    human_judgment: false
  - id: D2
    description: "Live desktop/mobile responsive + accessibility check: icon-only buttons with working hover/focus tooltips, gavel for Judicial, calibration prompt never stacks with the tooltip, screen reader announces each button's name, mobile keeps icon+label"
    verification: []
    human_judgment: true
    rationale: "Requires the running app at multiple viewport widths plus a screen reader / axe DevTools pass — genuine human/tooling judgment on visual + assistive-tech behavior that cannot be asserted from source alone. This is Task 2, a blocking human-verify checkpoint, and has NOT yet been performed."

# Metrics
duration: ~20min
completed: 2026-07-21
status: pending-human-verify
---

# Phase 215 Plan 03: Icon-Only Desktop Lens Buttons + Accessible Tooltip Summary

**LensChipRow.jsx lens buttons go icon-only on desktop with a @floating-ui/react hover/focus tooltip and per-button aria-label, replacing the unreliable native `title` attribute — Task 2 (live accessibility/responsive verification) is still pending.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-07-21T23:25:00-07:00 (approx)
- **Completed:** 2026-07-21T23:43:54-07:00 (Task 1 only — Task 2 pending)
- **Tasks:** 1 of 2 completed (Task 2 is a blocking human-verify checkpoint)
- **Files modified:** 1

## Accomplishments
- Every lens button now carries an unconditional `aria-label={lens.name}` (desktop AND mobile), so the accessible name survives icon-only rendering.
- Native `title={...}` attribute removed entirely (0 occurrences) — replaced with an accessible, keyboard-focusable `@floating-ui/react` tooltip (`useHover` + `useFocus` + `useDismiss` + `useRole`, `bottom` placement, `offset(8)`/`flip()`/`shift({padding:8})` middleware, `autoUpdate`).
- Visible `<span>{lens.name}</span>` label now renders only when `!isDesktop` — desktop is icon-only, mobile keeps icon+label. `renderLensIcon` is untouched, so the gavel icon still renders for the Judicial lens.
- The existing calibration-prompt `onMouseEnter`/`onMouseLeave` handlers are passed through `getReferenceProps({ onMouseEnter, onMouseLeave })` rather than bare-spread, so floating-ui composes both hover behaviors (Pitfall 2).
- The new tooltip only renders when `isDesktop && isOpen && !showPrompt`, so it never stacks on top of the "Calibrate this lens?" purple prompt (Pitfall 3).
- No new dependency added — `@floating-ui/react` was already installed; `package.json` diff is empty.

## Task Commits

Each task was committed atomically:

1. **Task 1: Icon-only desktop lens buttons + accessible floating tooltip in LensChipRow.jsx** - `510b9e4e` (feat)

**Plan metadata:** pending (this SUMMARY's own doc commit, made immediately after this file)

2. **Task 2: Live accessibility + responsive check of the icon-only lens buttons** - PENDING (`checkpoint:human-verify`, `gate="blocking"`) — not yet performed. See "Checkpoint Pending" below for exact steps.

## Files Created/Modified
- `src/components/LensChipRow.jsx` - Added a `LensButton` child component (one `useFloating`/`useInteractions` instance per lens, mirroring `IconOverlay.jsx`'s `IconWithTooltip`); wired icon-only desktop rendering, aria-label, and the floating tooltip; removed native `title`.

## Decisions Made
- Used a per-lens child component (`LensButton`) rather than a single shared "open key" in the parent, because each lens button needs its own `useFloating` context/positioning — this exactly mirrors the in-repo `IconWithTooltip` precedent named in the plan's `read_first`.
- Tooltip body text is `lens.description || lens.name`, matching the old native-title fallback for the synthesized Best Match/custom lens (which has no description).
- Kept `ref={refs.setReference}` directly on the existing `<button>` (no wrapping span) since the button was already focusable — avoids adding a redundant tab stop.

## Deviations from Plan

None - plan executed exactly as written for Task 1. Task 2 is an inherent human-verify checkpoint that this sequential (non-worktree) executor cannot perform itself against a running app; per the orchestrator's explicit checkpoint-handling instructions for this plan, it is left PENDING rather than blocking the return.

## Issues Encountered
None for Task 1. `npm run lint` reports 46 pre-existing errors / 21 warnings across unrelated files (CompassContext.jsx, compass.js, groupHierarchy.js, Profile.jsx, Results.jsx, vite.config.js) — none in `LensChipRow.jsx` (confirmed via `grep -i LensChipRow` on lint output, zero matches). Out of scope per the deviation-rules scope boundary; not fixed.

## Checkpoint Pending: Task 2 (human-verify, gate=blocking)

**What was built:** Icon-only compass lens buttons on desktop with accessible tooltips (gavel icon for Judicial), icon+label on mobile (HDR-03 / D-01 / D-02).

**Exact steps a human must perform against the running app** (Compass mode ON, at a location that surfaces multiple lenses):
1. **Desktop width:** lens buttons are icon-only (no visible text labels); hovering a lens shows a tooltip with its name/description; tabbing with the keyboard to a lens button also shows the tooltip (focus-accessible); the Judicial lens shows the gavel icon.
2. **Screen reader / axe DevTools:** each lens button announces a name (aria-label) — no "button, unlabeled"; Lighthouse/axe reports no "buttons must have discernible text".
3. **Needs-calibration lens:** hovering still shows "Calibrate this lens?" and does NOT also stack the name tooltip on top of it.
4. **Mobile width:** lens buttons keep icon + visible text label; tapping selects the lens (no tooltip conflict).

**Resume signal:** Type "approved" or describe the issue (e.g. "calibration prompt stopped showing").

**Requirement HDR-03 is intentionally left unmarked in REQUIREMENTS.md** until this checkpoint is approved.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Code for HDR-03 (icon-only desktop lens buttons) is complete and green on lint/build; only live human verification (Task 2) remains before this plan can be considered fully done and HDR-03 marked complete.
- No blockers for other 215 plans — this plan's file (`LensChipRow.jsx`) is not a dependency of 215-01/215-02.

---
*Phase: 215-header-declutter*
*Completed: 2026-07-21 (Task 1 only; Task 2 pending human verification)*
