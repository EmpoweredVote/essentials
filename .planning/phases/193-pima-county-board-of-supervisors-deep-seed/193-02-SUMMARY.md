---
phase: 193-pima-county-board-of-supervisors-deep-seed
plan: 02
subsystem: database
tags: [postgres, migration, governments, chambers, offices, politicians, pima-county, arizona]

requires:
  - phase: 193-01
    provides: "5 X0019 supervisor-district LOCAL geofences (pre-flight gate)"
provides:
  - "Standalone 'Pima County, Arizona, US' government (type=County, geo_id=04019, NOT under State of Arizona)"
  - "Board of Supervisors chamber (official_count=5) with 5 by-district supervisor offices on LOCAL X0019 districts"
  - "5 supervisor politician rows/UUIDs (Cano D5 appointed; Allen D3 carries the rotational-Chair title annotation)"
affects: [193-03, 193-04, 193-06]

tech-stack:
  added: []
  patterns: ["by-district relabel: rotational Chair surfaced via office title annotation (not a separate office), matching rotational-Mayor precedent"]

key-files:
  created: ["C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql"]
  modified: []

key-decisions:
  - "Chair = title annotation 'Supervisor, District 3 (Chair)' on Allen's D3 seat; role_canonical NULL; exactly 5 offices, no 6th Chair office (D-02)"
  - "geo_id 04019 is a 3-way collision (COUNTY G4020 + SD-19 G5210 + HD-19 G5220); every office↔district join scoped district_type='LOCAL' AND mtfcc='X0019' AND state='az'"
  - "Cano (D5) politician is_appointed=true (Apr 2025 appointment succeeding Adelita Grijalva); office is_appointed_position=false"

patterns-established:
  - "Structural migration disk-MAX+1 numbering (1288; disk-MAX 1287 authoritative over ledger-MAX 1286)"
  - "In-transaction post-verify DO gate (6 assertions a-f incl. exactly-one-Chair-on-D3) rolls back on any mismatch before COMMIT"

requirements-completed: [PIMA-01]

duration: ~12min
completed: 2026-07-09
---

# Phase 193 Plan 02: Standalone Pima County Government + Board of Supervisors Summary

**Standalone Pima County government (geo_id 04019, not nested under State of Arizona) with a Board of Supervisors chamber holding 5 by-district supervisor offices — each bound to its own LOCAL X0019 district — Allen's D3 seat carrying the rotational-Chair title annotation and Cano's D5 seat flagged appointed.**

## Performance
- **Duration:** ~12 min
- **Completed:** 2026-07-09
- **Tasks:** 3 (Task 1 executor-authored; Task 2 human-verify checkpoint + orchestrator apply; Task 3 orchestrator assertions)
- **Files modified:** 1 created (backend repo)

## Roster-Currency Checkpoint (Task 2 — blocking human-verify)
Live roster verified against https://www.pima.gov/2317/Board-of-Supervisors on 2026-07-09 — matched migration exactly, no delta:
- D1 Rex Scott · D2 Dr. Matt Heinz (Vice Chair) · **D3 Jennifer Allen (Chair)** · D4 Steve Christy · D5 Andrés Cano.
- Chair confirmed on D3 (Allen) → `(Chair)` annotation lands on the correct seat. Operator approved the production apply.

## Politician UUID Manifest (for Plans 03 & 04)

| external_id | UUID | full_name | title | is_appointed |
|-------------|------|-----------|-------|--------------|
| -4007001 | `b33f37df-5537-4eee-bb5b-b401a135bc1b` | Rex Scott | Supervisor, District 1 | false |
| -4007002 | `be550e00-b04c-4717-99bc-75bd4e8d6608` | Dr. Matt Heinz | Supervisor, District 2 | false |
| -4007003 | `f928a8f0-07fc-47c4-98b2-9801e6adf3dd` | Jennifer Allen | Supervisor, District 3 (Chair) | false |
| -4007004 | `41c2b862-78c8-4a27-96c5-50dcdb3a254e` | Steve Christy | Supervisor, District 4 | false |
| -4007005 | `0e4bebcf-76b4-49df-9197-c114e84d3bd1` | Andrés Cano | Supervisor, District 5 | true |

## Task Commits
1. **Task 1: Author migration 1288** — `559658ad` (feat, C:/EV-Accounts)
2. **Task 2: Roster checkpoint + apply** — orchestrator-run `psql -f`; post-verify PASSED (gov=1, offices=5, appointed=1, split=0, chair_on=-4007003); ledger registered version 1288
3. **Task 3: Post-apply assertions** — orchestrator-run; combined boolean = `t`

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1288_pima_county_board_of_supervisors.sql` — structural: government + chamber + 5 LOCAL districts + 5 politicians/offices + office_id backfill + pre-flight/post-verify gates + ledger registration

## Decisions Made
- Followed plan as specified. Chair modeled as title annotation per D-02 (by-district relabel pattern); no separate Chair office.
- Chair role rotates annually (board-selected) — the `(Chair)` annotation is informational and would move to a different D-seat on rotation; re-confirmed current chair (Allen) at the Task 2 checkpoint.

## Deviations from Plan
None — plan executed exactly as written; disk-MAX was 1287 as researched (no drift), so 1288 used as planned.

## Issues Encountered
None. Migration's in-transaction gate would have rolled back on any mismatch; it passed on first apply.

## Next Phase Readiness
- 5 politician UUIDs available → Plan 03 (headshots, binds to politician_images / politicians) and Plan 04 (compass stances in inform.politician_answers) can proceed. Wave 3 unblocked.

---
*Phase: 193-pima-county-board-of-supervisors-deep-seed*
*Completed: 2026-07-09*
