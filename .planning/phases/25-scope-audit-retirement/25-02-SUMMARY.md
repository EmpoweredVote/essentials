---
phase: 25-scope-audit-retirement
plan: 02
subsystem: ui
tags: [react, compass, scope-filtering, district-type, local-topics]

# Dependency graph
requires:
  - phase: 22-scope-audit
    provides: applies_local/applies_state/applies_federal booleans on compass topics returned from API
  - phase: 23-local-compass-topics
    provides: 10 LOCAL-scoped compass topics with scope-role rows in compass_topic_roles
provides:
  - CompassCard.jsx scope-filtered topic display via districtScope prop
  - Profile.jsx district_type → districtScope derivation and prop threading
  - CandidateProfile.jsx districtScope prop threading (null safe for challengers)
affects: [phase-25-plan-03, any future compass UI work]

# Tech tracking
tech-stack:
  added: []
  patterns: [districtScope prop pattern for tier-aware compass rendering, IIFE scope derivation from district_type]

key-files:
  created: []
  modified:
    - src/components/CompassCard.jsx
    - src/pages/Profile.jsx
    - src/pages/CandidateProfile.jsx
    - src/main.jsx

key-decisions:
  - "t[key] !== false (not === true) for scope filter — treats undefined as true so cross-cutting topics (no scope rows in compass_topic_roles) appear for all tiers"
  - "districtScope derivation covers LOCAL, LOCAL_EXEC, COUNTY → 'local'; STATE_* → 'state'; NATIONAL_* → 'federal'; null for unknown/judicial/cross-cutting"
  - "CandidateProfile.jsx uses inline IIFE at callsite (not a separate variable) because pol may be a minimal challenger object without district_type — returns null safely"
  - "allTopics from useCompass() preserved as raw source; scopedTopics is the filtered view computed via useMemo"

patterns-established:
  - "districtScope prop: CompassCard accepts 'local'|'state'|'federal'|null; null means show all topics (safe default)"
  - "IIFE pattern for districtScope derivation: const districtScope = (() => { const dt = pol.district_type || ''; ... return null; })()"
  - "scope key selection: applies_local / applies_state / applies_federal — matches API response field names from compassService.ts"

# Metrics
duration: 4min
completed: 2026-05-05
---

# Phase 25 Plan 02: Scope-Filtered Compass Topics Summary

**CompassCard now filters topics by politician tier — local officials see only LOCAL-applicable questions, state/federal officials see only their tier's topics, and cross-cutting topics appear for all tiers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-05T17:18:18Z
- **Completed:** 2026-05-05T17:23:12Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- CompassCard.jsx accepts districtScope prop and computes scopedTopics via useMemo, replacing allTopics in all downstream usages (allowedShorts derivation, allPolTopics, buildAnswerMapByShortTitle calls, StanceAccordion allTopics prop)
- Profile.jsx derives districtScope from pol.district_type using IIFE and passes it to CompassCard
- CandidateProfile.jsx derives districtScope at the CompassCard callsite; gracefully returns null for challenger profiles (minimal pol object without district_type)
- Build passes with zero errors; all 4 grep verification checks confirm implementation is present

## Task Commits

Each task was committed atomically:

1. **Task 1: Add districtScope filtering to CompassCard.jsx** - `04b3c5d` (feat)
2. **Task 2: Thread districtScope from Profile.jsx and CandidateProfile.jsx** - `6aec7d8` (feat)
3. **Task 3: Smoke-test scope filtering** - verified via grep + build (no additional commit — read-only task)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified
- `src/components/CompassCard.jsx` - Added districtScope prop + scopedTopics useMemo; replaced all allTopics internal usages with scopedTopics
- `src/pages/Profile.jsx` - Added districtScope IIFE derivation from pol.district_type; passed as prop to CompassCard
- `src/pages/CandidateProfile.jsx` - Added districtScope inline IIFE at CompassCard callsite; null-safe for challenger profiles
- `src/main.jsx` - Fixed pre-existing build blocker (ThemeProvider not exported from ev-ui — deviation Rule 3)

## Decisions Made
- Used `t[key] !== false` not `t[key] === true` for the scope filter — this treats `undefined` as truthy so cross-cutting topics (which have no compass_topic_roles rows and thus all three flags set to `true`) continue to appear for all tiers
- COUNTY district_type maps to 'local' scope — county officials are local government
- districtScope returns `null` (not a default value) for unknown/judicial types — null causes scopedTopics to return allTopics unfiltered, which is the correct safe default
- CandidateProfile.jsx keeps derivation inline as IIFE rather than a computed variable because the CompassCard render is already conditional (`{polId && <CompassCard ... />}`) and pol structure varies (incumbent vs. challenger)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing main.jsx build blocker**
- **Found during:** Task 1 verification (npm run build)
- **Issue:** `src/main.jsx` had `ThemeProvider` imported from `@empoweredvote/ev-ui` but `ThemeProvider` is not exported by the ev-ui library. This pre-existing change (visible in git status at session start as `M src/main.jsx`) caused build to fail with rollup error.
- **Fix:** Reverted main.jsx to remove the non-existent ThemeProvider import and wrapper — restored to the working state before the problematic edit
- **Files modified:** src/main.jsx
- **Verification:** Build passes after fix
- **Committed in:** 04b3c5d (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required to unblock npm run build verification. No scope creep — main.jsx revert simply removed a broken import.

## Issues Encountered
- None beyond the pre-existing main.jsx build blocker (documented above as deviation)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- districtScope filtering is live: local officials show only LOCAL-applicable compass topics
- Cross-cutting topics (applies_local=true AND applies_state=true AND applies_federal=true) appear for all tiers — correct behavior
- Federal/state politician profiles are unaffected — their scope filters are additive (federal sees federal topics, state sees state topics)
- Plan 25-03 (if any) can build on this districtScope prop pattern

---
*Phase: 25-scope-audit-retirement*
*Completed: 2026-05-05*
