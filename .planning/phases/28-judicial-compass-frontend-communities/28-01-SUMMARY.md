---
phase: 28-judicial-compass-frontend-communities
plan: 01
subsystem: ui
tags: [react, jsx, compass, judicial, frontend, render]

# Dependency graph
requires:
  - phase: 27-judicial-compass-db
    provides: "8 judicial compass topics with judicial_role column + applies_judicial flag in compassService.ts + Profile.jsx JUDICIAL→'judicial' scope derivation"
provides:
  - "JudicialCompassSection.jsx component with burnt orange styling, scale icon, deriveJudicialSubRole, filterJudicialTopics, EmptyNotchRow"
  - "CandidateProfile.jsx routes JUDICIAL district_type to JudicialCompassSection"
  - "Profile.jsx isJudge guard removed; routes judicial districtScope to JudicialCompassSection"
  - "compassService.ts exposes judicial_role field in API response"
  - "Backend deployed to Render; frontend deployed to Render"
affects:
  - phase 29 (bar evaluation — judicial profiles must render before bar data can be displayed)
  - phase 28-02 (communities — fc_community_slug will be surfaced by this component once populated)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JudicialCompassSection pattern: useCompass() → filter applies_judicial → deriveJudicialSubRole from officeTitle → filterJudicialTopics by sub-role"
    - "districtScope JUDICIAL arm must precede NATIONAL_ prefix check (NATIONAL_JUDICIAL would match NATIONAL_ otherwise)"
    - "Empty notch UI: 5 colored circles with border-only fill; 'Stance research in progress' label below"

key-files:
  created:
    - "src/components/JudicialCompassSection.jsx"
  modified:
    - "src/pages/CandidateProfile.jsx"
    - "src/pages/Profile.jsx"
    - "C:/EV-Accounts/backend/src/lib/compassService.ts"

key-decisions:
  - "Remove isJudge placeholder guard entirely rather than augmenting it — JudicialCompassSection handles all judicial profiles"
  - "deriveJudicialSubRole uses officeTitle string matching (judge / city attorney / district attorney) for sub-role dispatch"
  - "filterJudicialTopics: judicial_role=NULL means universal (show for all); NULL/undefined treated the same"
  - "Empty notch design chosen over hiding section entirely — shows data structure before stances are researched"

patterns-established:
  - "Judicial districtScope routing: Profile.jsx + CandidateProfile.jsx both use identical JUDICIAL arm before NATIONAL_ catch-all"
  - "JudicialCompassSection is self-contained: imports useCompass, handles loading and empty states internally"

# Metrics
duration: 8min
completed: 2026-05-07
---

# Phase 28 Plan 01: Judicial Compass Frontend + Communities Summary

**JudicialCompassSection component with burnt orange styling, deriveJudicialSubRole sub-role filtering, and judicial_role exposed in compassService.ts API response**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-07T07:03:20Z
- **Completed:** 2026-05-07T07:10:40Z
- **Tasks:** 2 (Task 1: backend compassService + deploy; Task 2: frontend 3 files + deploy)
- **Files modified:** 4

## Accomplishments

- compassService.ts `getCompassTopics()` SELECT extended with `judicial_role` field; backend pushed to Render and deployed
- New `JudicialCompassSection.jsx` component with burnt orange (#c2410c) visual treatment, scale SVG icon, per-topic card layout, EmptyNotchRow, and "Stance research in progress" label
- CandidateProfile.jsx replaces single CompassCard block with judicial-aware IIFE: JUDICIAL/NATIONAL_JUDICIAL routes to JudicialCompassSection, others get CompassCard
- Profile.jsx: removes isJudge placeholder guard (static text), replaces with JudicialCompassSection routing for districtScope==='judicial'

## Task Commits

Each task was committed atomically:

1. **Task 1: Add judicial_role to compassService.ts + deploy backend** - `14b27b1` (feat) — in `C:/EV-Accounts` repo
2. **Task 2: Create JudicialCompassSection + wire Profile/CandidateProfile + deploy frontend** - `649113a` (feat) — in essentials repo

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/components/JudicialCompassSection.jsx` — New component: renders judicial compass topics with burnt orange styling, sub-role filtering, empty notch UI
- `src/pages/CandidateProfile.jsx` — Added JudicialCompassSection import; replaced CompassCard block with judicial-aware routing IIFE
- `src/pages/Profile.jsx` — Added JudicialCompassSection import; removed isJudge guard; added `if (districtScope === 'judicial')` routing before CompassCard return
- `C:/EV-Accounts/backend/src/lib/compassService.ts` — Added `judicial_role` to `.select(...)` in `getCompassTopics()`

## Decisions Made

- **Remove isJudge guard entirely.** The previous guard showed a static "Judges are evaluated on their record" message. JudicialCompassSection replaces this with actual topic cards, which is strictly better. The guard is no longer needed.
- **deriveJudicialSubRole from officeTitle string.** The office title ('Judge', 'City Attorney', 'District Attorney') is the most reliable signal available on the profile page without an additional API call. Simple string matching covers all known patterns.
- **judicial_role=NULL treated as universal (show for all sub-roles).** This matches the DB design intent: NULL means applies to all judicial roles, not just one. The filter `t.judicial_role === null || t.judicial_role === undefined || t.judicial_role === judicialSubRole` handles both null (from DB) and undefined (missing field on older API responses before deploy).
- **Empty notch design.** Shows the topic structure before stances are researched rather than hiding the section. Users see what data is coming, which is more informative than a blank page.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. Build passed clean (pre-existing chunk size and dynamic import warnings unrelated to this change). Frontend required a `git pull --rebase` before push due to remote having 21 newer commits (unrelated to this plan).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- COMPASS-05 satisfied: judicial candidate profile pages now route to JudicialCompassSection
- Sub-role filtering is live: judge profiles show 6 topics (4 universal + 2 judge-specific); City Attorney/DA show 6 (4 universal + 2 DA-specific)
- Backend API exposes `judicial_role` field; frontend reads it for filtering
- Ready for 28-02: Seed 8 companion Focused Communities and populate fc_community_slug on judicial topics
- fc_community_slug is currently NULL for all 8 judicial topics — JudicialCompassSection will surface links once 28-02 populates them

---
*Phase: 28-judicial-compass-frontend-communities*
*Completed: 2026-05-07*
