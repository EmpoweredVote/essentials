---
phase: 172-elections-page-parity
plan: 01
subsystem: ui
tags: [react, dark-mode, tailwind, ev-ui, SectionBanner, ElectionsView]

# Dependency graph
requires:
  - phase: 169-dark-mode
    provides: Phase-169 canonical dark tokens (#161b22/#2d3748/#00c8d7) in Results.jsx
  - phase: 170-section-banners
    provides: SectionBanner component + buildingImageMap/representingCity/userState derivations in Results.jsx

provides:
  - ElectionsView re-themed to Phase-169 dark palette (DARK-03): zero stale literals
  - SectionBanner per tier (City/State/Federal) in ElectionsView, fed by props from Results.jsx (BANR-05)
  - Loading skeleton dark variant (dark:bg-gray-700)
  - "No candidates have filed" box dark treatment (isDark ternaries)

affects: [172-elections-page-parity, future-ui-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BANR-05 prop threading: banner inputs (buildingImageMap/representingCity/userState/stateNames) threaded from Results.jsx parent to ElectionsView child; never re-derived in child"
    - "SectionBanner per-tier rendering inside the existing tier .map() replacing the <span> eyebrow"
    - "isDark ternary palette pattern for empty-state boxes (#161b22 surface, #00c8d7 border/accent, #e6edf3 title, #8b949e muted floor)"

key-files:
  created: []
  modified:
    - src/components/ElectionsView.jsx
    - src/pages/Results.jsx

key-decisions:
  - "Thread banner inputs as props from Results.jsx parent rather than re-deriving in ElectionsView child (prevents city/state label divergence between Representatives and Elections tabs)"
  - "SectionBanner renders in both light and dark modes for true parity with Results.jsx (which renders it in both); light/dark banner parity decision deferred to Task 3 human checkpoint"
  - "Tier eyebrow <span> replaced entirely by {banner} inside the tier .map(); outer <div> with isDark?transparent:tierStyle.bg light band preserved"
  - "Muted floor for dark empty-state subtext is #8b949e per feedback_dark_mode_ev_ui_important (never fainter)"

patterns-established:
  - "ElectionsView is a presentational child — no location data re-derivation allowed inside it"
  - "SectionBanner import path from components/ sibling: ./SectionBanner.jsx (not ../components/)"

requirements-completed: [DARK-03, BANR-05]

# Metrics
duration: 15min
completed: 2026-06-27
---

# Phase 172 Plan 01: Elections Page Parity Summary

**ElectionsView re-themed to Phase-169 dark palette and Phase-170 SectionBanner tier dividers via prop threading from Results.jsx parent**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-06-27T18:35:00Z
- **Completed:** 2026-06-27T18:50:00Z
- **Tasks:** 2 auto completed (Task 3 is human-verify — pending orchestrator)
- **Files modified:** 2

## Accomplishments

- Eliminated all 7 stale Phase-169 dark literal occurrences from ElectionsView (#1a2235, #2d3f5a, #59b0c4 — zero matches on grep after edit)
- Dark-treated loading skeleton (dark:bg-gray-700 on all bg-gray-200 blocks) and "No candidates have filed" empty box (isDark ternaries for surface/border/title/subtext; muted floor #8b949e)
- Threaded buildingImageMap/representingCity/userState/stateNames from Results.jsx call site into ElectionsView props; SectionBanner renders per tier (Local->city, State->state, Federal->federal) replacing the old <span> eyebrow
- npx vitest run: 59/59 pass after both tasks; npx vite build: exit 0 after both tasks

## Task Commits

Each task was committed atomically:

1. **Task 1: Dark-token parity swap (DARK-03)** - `16e279f` (feat)
2. **Task 2: Thread banner inputs + insert SectionBanner per tier (BANR-05)** - `e6e39e3` (feat)
3. **Task 3: Human visual-parity sign-off** - APPROVED by operator 2026-06-27 (post-deploy). Banner-mode decision: keep banner in BOTH light & dark, matching Results. (A pre-existing stale-browse-param bug surfaced during verification and was fixed separately in fe64cb2.)

## Files Created/Modified

- `src/components/ElectionsView.jsx` - Swapped 7 stale dark literals to Phase-169 tokens; added dark:bg-gray-700 to skeleton; isDark ternaries on empty-state box; added SectionBanner import; extended prop destructure (4 new props with safe defaults); replaced tier eyebrow <span> with computed {banner} per tier using Local->city/State->state/Federal->federal mapping; preserved seeded shuffle/dedup/ordering/withdrawn/unopposed/MiniCompass logic entirely
- `src/pages/Results.jsx` - Extended <ElectionsView> call site to pass buildingImageMap={buildingImageMap}, representingCity={representingCity}, userState={userState}, stateNames={STATE_NAMES} (existing 6 props unchanged)

## Decisions Made

- Prop threading (not re-derivation) for banner inputs: eliminates risk of Elections tab showing a different city/state label than the Representatives tab for the same search
- SectionBanner rendered in both light and dark (matching Results.jsx behavior). RESEARCH Open Question 2 RESOLVED at sign-off: operator confirmed banners in light mode are desired as-is ("I like the banners in light, they don't need anything to make them darker"). Future idea (not this phase): a broader light-mode refinement pass.
- stateNames prop accepts the full STATE_NAMES map (not a pre-resolved string) to mirror how Results.jsx uses it inside the tier selection logic

## Deviations from Plan

None - plan executed exactly as written. Both tasks followed the PATTERNS.md and RESEARCH.md prescriptions verbatim.

## Issues Encountered

None. All 7 stale literal sites were at the documented line numbers. The build produced a pre-existing chunk-size warning (unrelated to this phase) that was present before these changes.

## Build Gate Results

```
Task 1 post-commit:
  npx vitest run: 7 test files, 59 tests — all PASS
  npx vite build: exit 0 (built in ~9s)

Task 2 post-commit:
  npx vitest run: 7 test files, 59 tests — all PASS
  npx vite build: exit 0 (built in ~10s)
```

## User Setup Required

None - frontend-only change, no environment variables, no external services.

## Next Phase Readiness

Tasks 1 and 2 complete and committed. Task 3 (human visual-parity sign-off) is a `checkpoint:human-verify` gate owned by the orchestrator:

- Start dev server (`npm run dev`)
- Toggle dark mode; compare Elections tab vs. Representatives tab — confirm palette parity, banner per tier with correct city/state labels, light mode unchanged
- Confirm the light/dark banner-parity decision (Research Open Question 2): banner currently renders in both modes matching Results.jsx behavior; instruct if dark-only is preferred instead
- Verify 4 preserved behaviors: seeded ordering, unopposed/no-candidate rendering, elections/me auto-load, MiniCompass overlay

Live app link for testing: essentials.empowered.vote

---
*Phase: 172-elections-page-parity*
*Completed: 2026-06-27*
