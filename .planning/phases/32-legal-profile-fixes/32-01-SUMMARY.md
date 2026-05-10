---
phase: 32-legal-profile-fixes
plan: 01
subsystem: ui
tags: [react, jsx, compass, judicial, legal-profiles, candidate-profile, profile]

# Dependency graph
requires:
  - phase: 31-legal-donor-activity
    provides: LegalDonorActivitySection component used in Profile.jsx render
  - phase: 27-judicial-compass
    provides: JudicialCompassSection + isLegalCandidate detection pattern
provides:
  - City attorney candidates (null district_type + isLegalCandidate=true) now route to JudicialCompassSection via dScope fallback
  - Incumbent judges/justices on /politician/:id now render LegalDonorActivitySection
  - isLegalCandidate logic in Profile.jsx unified with CandidateProfile.jsx (6 conditions each)
affects:
  - Any phase touching CandidateProfile.jsx or Profile.jsx legal routing logic
  - Phase 18 (Compass Stances) — judicial topic filtering flows through isLegalCandidate

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "dScope fallback: isLegalCandidate ? 'judicial' : null as final arm catches null district_type legal candidates"
    - "isLegalCandidate 6-condition parity: JUDICIAL district_type + city attorney + district attorney + judge + justice on office_title"

key-files:
  created: []
  modified:
    - src/pages/CandidateProfile.jsx
    - src/pages/Profile.jsx

key-decisions:
  - "Profile.jsx isLegalCandidate uses office_title only (no position_name fallback) — incumbents don't have a separate position_name from a race"
  - "LegalDonorActivitySection rendered between BarEvaluationSection and CampaignFinanceSection, matching CandidateProfile.jsx order"

patterns-established:
  - "isLegalCandidate parity rule: both CandidateProfile.jsx and Profile.jsx must maintain identical condition sets for judicial routing"

# Metrics
duration: 2min
completed: 2026-05-10
---

# Phase 32 Plan 01: Legal Profile Fixes Summary

**dScope 'judicial' fallback for null-district_type city attorney candidates + LegalDonorActivitySection wired to Profile.jsx for incumbent judges, closing COMPASS-05 and DONOR-04**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-10T07:02:30Z
- **Completed:** 2026-05-10T07:04:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- City attorney candidates (Ashouri, McKinney, Roy) with null district_type now route to JudicialCompassSection via isLegalCandidate fallback in dScope ternary
- Incumbent judges (Connolly, Draper, Walgren) on /politician/:id now see LegalDonorActivitySection rendered below BarEvaluationSection
- isLegalCandidate logic unified between Profile.jsx and CandidateProfile.jsx — both now include 'judge' and 'justice' title checks (6 conditions each)

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix dScope fallback in CandidateProfile.jsx (GAP: COMPASS-05)** - `3227049` (fix)
2. **Task 2: Add isLegalPolitician state + LegalDonorActivitySection to Profile.jsx (GAP: DONOR-04)** - `4bfc6ab` (feat)

**Plan metadata:** _(pending docs commit)_

## Files Created/Modified
- `src/pages/CandidateProfile.jsx` - Added `: isLegalCandidate ? 'judicial' : null` as final arm of dScope ternary (line 198)
- `src/pages/Profile.jsx` - Added LegalDonorActivitySection import, isLegalPolitician state, extended isLegalCandidate with 'judge'/'justice', conditional render

## Decisions Made
- Profile.jsx isLegalCandidate uses `result.office_title` only (not position_name fallback) — incumbents on /politician/:id are fetched via `fetchPolitician` which returns `office_title`; there is no separate `position_name` from a race entry
- LegalDonorActivitySection placement matches CandidateProfile.jsx: after BarEvaluationSection, before CampaignFinanceSection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both v3.2 audit gaps (COMPASS-05 and DONOR-04) are now closed
- GAP verification: visit /candidate/:id for Ashouri/McKinney/Roy to confirm JudicialCompassSection renders; visit /politician/:id for Connolly/Draper/Walgren to confirm LegalDonorActivitySection renders
- Phase 32 plan 01 complete; any remaining v3.2 audit items can be reviewed against the milestone document

---
*Phase: 32-legal-profile-fixes*
*Completed: 2026-05-10*
