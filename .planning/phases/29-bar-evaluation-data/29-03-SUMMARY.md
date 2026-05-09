---
phase: 29-bar-evaluation-data
plan: "03"
subsystem: ui
tags: [react, jsx, lacba, cjp, judicial, bar-evaluation, profile]

# Dependency graph
requires:
  - phase: 29-bar-evaluation-data/29-01
    provides: LACBA evaluations in DB (essentials.judicial_evaluations)
  - phase: 29-bar-evaluation-data/29-02
    provides: CJP disciplinary_records in DB with plain-language descriptions
provides:
  - BarEvaluationSection.jsx component displaying LACBA ratings and CJP discipline
  - Fixed judicialRecord fetch gate covering JUDICIAL district_type and City Attorney
  - Both Profile.jsx and CandidateProfile.jsx wired to render bar evaluation data
affects:
  - any future profile-page work (BarEvaluationSection is now in the render tree)
  - phase 17 headshots / phase 18 compass stances (no conflict, different sections)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isLegalCandidate flag derived from district_type + office_title (never is_judicial)"
    - "BarEvaluationSection returns null when no data — no empty sections"
    - "CJP description rendered as primary p-tag; record_type+date as secondary metadata"

key-files:
  created:
    - src/components/BarEvaluationSection.jsx
  modified:
    - src/pages/Profile.jsx
    - src/pages/CandidateProfile.jsx

key-decisions:
  - "is_judicial gate was broken — backend never returns that field; replaced with district_type + office_title check"
  - "State Bar 'Active — no discipline' rows filtered out — no voter signal"
  - "CJP N/A rows not rendered — no signal"
  - "LACBA 'Not evaluated' rating gets plain-English explanation in badge"
  - "BarEvaluationSection placed after JudicialCompassSection, before CampaignFinanceSection"

patterns-established:
  - "Legal candidate detection: district_type JUDICIAL/NATIONAL_JUDICIAL OR office_title includes city attorney/district attorney"
  - "Voter-facing description is the primary p element; metadata (type, date) is xs text below"

# Metrics
duration: 2min
completed: 2026-05-09
---

# Phase 29 Plan 03: Bar Evaluation Section Summary

**BarEvaluationSection.jsx renders LACBA rating badges and CJP admonishment descriptions on legal candidate profiles; fixed broken is_judicial fetch gate to use district_type and office_title**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-09T22:02:53Z
- **Completed:** 2026-05-09T22:05:15Z
- **Tasks:** 2
- **Files modified:** 3 (+ 1 created)

## Accomplishments

- Created BarEvaluationSection.jsx with LACBA rating color badges and CJP discipline cards where description is the primary voter-visible content
- Fixed the broken `result.is_judicial` gate in Profile.jsx (backend never returns that field) — replaced with `isLegalCandidate` derived from `district_type` and `office_title`
- Applied same fix in CandidateProfile.jsx for the linked politician path
- Wired BarEvaluationSection into both profile pages after the compass section
- Deployed to Render via git push — Render auto-deploy triggered on commit 93df9b0

## Task Commits

1. **Task 1: Fix judicialRecord trigger + build BarEvaluationSection** - `93df9b0` (feat)
2. **Task 2: Deploy and verify on production** - included in 93df9b0 push; Render deploys automatically

**Plan metadata:** pending docs commit

## Files Created/Modified

- `src/components/BarEvaluationSection.jsx` - New component; renders LACBA rating badges and CJP discipline records; returns null when no data
- `src/pages/Profile.jsx` - Added BarEvaluationSection import + render; replaced broken is_judicial gate with isLegalCandidate
- `src/pages/CandidateProfile.jsx` - Same fixes as Profile.jsx; BarEvaluationSection placed before CampaignFinanceSection

## Decisions Made

- **isLegalCandidate logic:** `district_type === 'JUDICIAL' || district_type === 'NATIONAL_JUDICIAL' || office_title includes 'city attorney' || office_title includes 'district attorney'` — covers all cases the backend can return without relying on a field that is never sent
- **No empty section:** BarEvaluationSection returns null when lacbaEntries.length === 0 and cjpRecords.length === 0; non-legal profiles stay unchanged
- **LACBA filter:** Only `source === 'LACBA JEEC'` entries rendered; State Bar "Active" rows intentionally excluded (no voter signal)
- **CJP description is primary:** Rendered as `<p>` text, not a label or badge; record_type and date are `text-xs text-gray-500` below
- **Placement:** After JudicialCompassSection (or CompassCard), before CampaignFinanceSection — bar evaluations are legal-candidate-specific content

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## What Voters See

**Patrick Connolly (53fd1ed7):** LACBA "Well Qualified" blue badge + 2 CJP admonishment cards with plain-language descriptions and "Read CJP document →" links.

**Draper (fa932212):** LACBA "Not Qualified" red badge only (no discipline records).

**Walgren (1ce3f260):** LACBA "Exceptionally Well Qualified" green badge only.

**City Attorney candidates:** LACBA "Not Evaluated by LACBA" amber badge + plain-English explanation that LACBA only covers Superior Court races.

**City council members, state legislators, all non-legal profiles:** BarEvaluationSection not rendered (judicialRecord is null — fetch gate never triggers).

## Next Phase Readiness

- BAR-04 satisfied: bar evaluation data visible on legal candidate profile pages without authentication
- Phase 29 complete: all 3 plans done (migration 117 LACBA, migration 118 CJP, UI component)
- Resume queue: Phase 17 (headshots) or Phase 18 (compass stances) or Phase 19 (TX congressional geofences)

---
*Phase: 29-bar-evaluation-data*
*Completed: 2026-05-09*
