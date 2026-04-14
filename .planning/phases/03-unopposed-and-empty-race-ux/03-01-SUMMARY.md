---
phase: 03-unopposed-and-empty-race-ux
plan: 01
subsystem: ui
tags: [react, elections, ev-ui, design-tokens]

requires:
  - phase: 02-elections-page
    provides: ElectionsView.jsx with race grouping and shuffled candidate rendering
  - phase: 01-backend-fix
    provides: Backend returns 0-candidate races with empty candidates array

provides:
  - Three-state race rendering in ElectionsView (contested / unopposed / empty)
  - "Running Unopposed" photo overlay badge on 1-candidate races
  - Coral-tinted empty notice using pillars.empower design tokens
  - Branch-priority race ordering within each government body (Executive > Legislative > Judicial)
  - Visible left-border zebra stripe (2px #E5E7EB) on alternating race sections
  - Local tier body ordering by civic priority (Mayor > Council > Township > County > Court)

affects: [04-navigation]

tech-stack:
  added: []
  patterns:
    - Three-state render guard (isEmpty / isUnopposed / contested) derived from activeCandidates.length
    - pillars.empower.light / pillars.empower.textColor for empty race notice styling
    - Left-border stripe (borderLeft: 2px solid transparent vs solid #E5E7EB) for zebra separation
    - bodyOrderScore for Local tier skips branch-first sort — score encodes civic priority directly

key-files:
  created: []
  modified:
    - src/components/ElectionsView.jsx

key-decisions:
  - "Unopposed treatment is a photo overlay ('Running Unopposed') not a gray pill above SubGroupSection — SubGroupSection has no badge slot and the overlay is more visually consistent with Withdrawn banner"
  - "Left-border stripe preferred over background fill — doesn't conflict with tier background colors"
  - "Local tier body sort skips branch-first ordering — BRANCH_ORDER is correct for State/Federal but wrong for Local where civic priority (Mayor > City Council) cuts across branch lines"

patterns-established:
  - "Pattern: derive race state (isEmpty/isUnopposed) from activeCandidates.length at render time, not in useMemo"
  - "Pattern: pillars.empower tokens for civic-alert styling (coral-050 bg, coral-700 border)"

duration: ~60min
completed: 2026-04-13
---

# Plan 03-01: Unopposed badge, empty notice, branch sort, zebra-stripe in ElectionsView

**Three-state race rendering in ElectionsView: "Running Unopposed" photo overlay, coral empty notice using pillars.empower tokens, branch-priority sort within bodies, and visible left-border zebra striping**

## Performance

- **Duration:** ~60 min (multi-session including QA fixes)
- **Started:** 2026-04-13
- **Completed:** 2026-04-14
- **Tasks:** 1 auto + 1 human checkpoint
- **Files modified:** 1 (ElectionsView.jsx)

## Accomplishments

- All three race states render correctly: contested (normal), unopposed ("Running Unopposed" overlay on photo), empty (coral notice box)
- No races are hidden or filtered — contested, unopposed, and empty appear in a single pass
- Race sections alternate with a 2px gray left-border stripe for visual separation
- Races within each government body sorted by branch (Executive → Legislative → Judicial)
- Local tier body ordering corrected: Mayor > City Council > Other city > Township > School > County > Courts (civic priority, not branch-first)

## Task Commits

1. **Task 1: Three-state rendering, branch sort, zebra stripe** — `0f4dd85` (feat)
2. **Fix: Move badge to photo overlay, fix invisible stripe** — `3cb51fa` (fix)
3. **Fix: Board of Supervisors after City Council** — `3256ecb` (fix)
4. **Fix: Local race order + visible left-border stripe** — `30c2cdc` (fix)
5. **Fix: Label text "Running Unopposed"** — `5d3e22d` (fix)

(Commits `8333794`, `80608c2`, `f4011b7`, `4a1e70b`, `ac994ec` added Withdrawn filter, hide-withdrawn toggle, per-office ordering for State/Federal, role tooltips, and incumbent-withdrawn exclusion during the same QA session.)

## Files Created/Modified

- `src/components/ElectionsView.jsx` — Three-state race render, branch sort within bodies, left-border zebra stripe, local body priority ordering

## Decisions Made

1. **Badge as photo overlay, not gray pill** — SubGroupSection has no badge slot (`title`, `websiteUrl`, `children` only). Photo overlay is consistent with the existing Withdrawn banner pattern.
2. **Left-border stripe over background fill** — `rgba(0,0,0,0.03)` was invisible on all tier backgrounds; 2px `#E5E7EB` border is visible without conflicting with tier colors.
3. **Local tier skips branch-first sort** — `BRANCH_ORDER` correctly groups Governor before State Senate. For Local tier it's wrong: Township Trustee (Executive) was sorting before City Council (Legislative). `bodyOrderScore` already encodes the correct civic priority for Local, so branch-first is skipped there.

## Deviations from Plan

### Auto-fixed Issues

**1. Badge placement changed from gray pill to photo overlay**
- **Found during:** QA verification
- **Issue:** Plan specified a gray pill badge above SubGroupSection. This looks disconnected from the candidate card. The existing "Withdrawn" photo overlay is a better established pattern.
- **Fix:** Rendered as absolute-positioned overlay on the candidate photo (same position/style as Withdrawn but with dark semi-transparent background)
- **Committed in:** `3cb51fa`

**2. Zebra stripe changed from background fill to left border**
- **Found during:** QA verification (invisible on live)
- **Issue:** `rgba(0,0,0,0.03)` (3% black) invisible on all tier backgrounds
- **Fix:** `borderLeft: '2px solid #E5E7EB'` on odd-indexed races, `2px solid transparent` on even (preserves layout alignment)
- **Committed in:** `30c2cdc`

**3. Local tier body sort fixed post-verification**
- **Found during:** Human checkpoint — Mayor not appearing before City Council
- **Issue:** Branch-first sort (Executive → Legislative) caused Township Trustees (Executive) to appear before City Council (Legislative), even though `bodyOrderScore` already had the correct civic priority ordering
- **Fix:** Skip branch-first sort for Local tier; use `bodyOrderScore` directly
- **Committed in:** `30c2cdc`

---

**Total deviations:** 3 auto-fixed (2 visual presentation, 1 sort logic)
**Impact on plan:** All three corrections improve on the plan spec. Badge-as-overlay is more visually coherent. Left-border stripe is actually visible. Local priority sort matches the stated user priority (Mayor > Council).

## Issues Encountered

- Render deploy lag meant live verification happened on stale code during initial checkpoint review — sorting and stripe issues persisted until second deploy cycle

## Next Phase Readiness

- Phase 3 goal met: all race types render with correct treatment (contested, unopposed, empty)
- Phase 4 (Navigation) can proceed: Elections page exists at `/elections` with full race rendering

---
*Phase: 03-unopposed-and-empty-race-ux*
*Completed: 2026-04-14*
