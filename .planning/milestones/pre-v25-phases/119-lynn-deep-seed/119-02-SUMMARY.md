---
phase: 119-lynn-deep-seed
plan: 02
subsystem: database
tags: [postgres, sql, migration, massachusetts, lynn, school-committee, g5420]

# Dependency graph
requires:
  - phase: 119-01
    provides: Mayor Nicholson politician row (external_id=-2537490001) used for SC ex-officio office
  - phase: 117-newton-deep-seed
    provides: Newton school committee pattern (579_newton_school_committee.sql) used as direct analog
provides:
  - Lynn Public Schools government row ('Lynn Public Schools, Massachusetts, US', geo_id=2507110)
  - Lynn School Committee chamber (name_formal='Lynn School Committee')
  - G5420 geofence boundary (geo_id='2507110', state='25')
  - SCHOOL district (geo_id='2507110', district_type='SCHOOL', state='ma')
  - 6 elected SC politicians: Castellanos, Gately, Ortiz McGrath, Peña, Satterwhite, Smith (external_ids -2507110001..-2507110006)
  - 7 SC offices: 6 elected + Mayor Nicholson ex-officio (title='Mayor (ex officio)')
  - office_id back-fill for 6 elected SC members (Mayor's LOCAL_EXEC office_id preserved)
  - Migration 585 applied to production; schema_migrations ledger entry added
affects:
  - 119-03 (Lynn headshots — SC politicians now have external_ids available)
  - LYNN-01 requirement fully satisfied (city gov plan 01 + school committee plan 02)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single ex-officio Mayor pattern on Lynn School Committee — Newton 579 applied exactly (6 elected at-large + Mayor chair)"
    - "G5420 geofence direct INSERT pattern (no TIGER G5420 loader for MA school districts)"
    - "SC title uniformity: all 6 elected members use 'School Committee Member' (officer roles not charter offices)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/585_lynn_school_committee.sql
  modified: []

key-decisions:
  - "All 6 elected SC members use title='School Committee Member' — Vice Chair (Gately) and Chair (Mayor ex-officio) officer roles are voted on by the committee post-election, not separate charter offices (Newton pattern per RESEARCH.md open question #3)"
  - "Lennin Peña: first_name='Lennin', last_name='Peña' (ñ character, legal name — not nickname 'Lenny')"
  - "Brenda Ortiz McGrath: no hyphen in last_name (confirmed multiple news sources)"
  - "Mary Jules NOT seeded — confirmed administrative Secretary (staff hire Oct 2018), not an elected member"
  - "Back-fill UPDATE range -2507110006..-2507110001 only — Mayor (-2537490001) explicitly excluded to preserve LOCAL_EXEC office_id from migration 584"

patterns-established:
  - "Lynn School Committee follows Newton single-ex-officio pattern: 6 at-large elected + Mayor as Chair"

requirements-completed:
  - LYNN-01

# Metrics
duration: 6min
completed: 2026-06-14
---

# Phase 119 Plan 02: Lynn School Committee Summary

**Migration 585 applied — Lynn School Committee seeded with G5420 geofence + 6 elected at-large members + Mayor Nicholson ex-officio office; all 9 post-verification gates PASSED; Mayor's LOCAL_EXEC office_id intact**

## Performance

- **Duration:** 6 min
- **Started:** 2026-06-14
- **Completed:** 2026-06-14
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Migration 585 applied cleanly to production; all 9 post-verification gates PASSED (gov=1, chambers=1, districts=1, sc_politicians=6, total_school_offices=7, split_orphans=0, null_sc_office_ids=0, geo_count=1, mayor_local_exec_intact=1)
- G5420 geofence inserted directly for geo_id='2507110' (state='25' MA FIPS numeric string — no TIGER G5420 loader available)
- Lynn Public Schools government + School Committee chamber + SCHOOL district seeded
- 6 elected at-large SC members seeded: Castellanos, Gately, Ortiz McGrath, Peña, Satterwhite, Smith
- Mayor Nicholson ex-officio office created in SCHOOL district (title='Mayor (ex officio)') — no new politician INSERT, reuses external_id=-2537490001 from migration 584
- office_id back-fill applied to all 6 elected SC members (range -2507110006..-2507110001 only)
- Gate (i) PASSED: Mayor's office_id still points to LOCAL_EXEC district from migration 584 (not overwritten)
- Section-split check = 0 (G5420 geofence has matching SCHOOL district row)
- Migration 585 entered in supabase_migrations.schema_migrations ledger
- LYNN-01 requirement fully satisfied: Lynn address now returns both LOCAL section (plan 01) and SCHOOL section (plan 02)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 585_lynn_school_committee.sql** - feat(119-02): apply migration 585 — Lynn School Committee

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/585_lynn_school_committee.sql` — Lynn School Committee seed: G5420 geofence, government row, School Committee chamber, SCHOOL district, 6 elected SC politician+office blocks, Mayor ex-officio office (no new politician INSERT), office_id back-fill (Mayor excluded), 9-gate post-verification, ledger entry

## Decisions Made

- **All 6 elected SC titles use 'School Committee Member'**: Gately (Vice Chair) and all others use the same title. Officer roles are voted on by the committee post-election and are not separate charter offices from the voter perspective. This follows the Newton pattern recommendation in RESEARCH.md open question #3 and differs from Newton 579 which used Chair/Vice Chair titles.
- **Lennin Peña legal name**: first_name='Lennin', last_name='Peña' (ñ character). Multiple sources confirm 'Lennin' is legal first name; 'Lenny' is nickname. lynnschools.org uses 'Lenny Pena' without accent but legal/official name takes precedence per project convention.
- **Brenda Ortiz McGrath**: No hyphen in last_name ('Ortiz McGrath' not 'Ortiz-McGrath'). Confirmed from multiple news sources; lynnschools.org listing also hyphen-free.
- **Mary Jules excluded**: Confirmed staff administrative Secretary hired October 2018 (itemlive.com). 6 elected SC politicians seeded + 1 Mayor ex-officio = 7 total SCHOOL offices.

## Deviations from Plan

None — plan executed exactly as written. All Lynn-specific substitutions from Newton 579 analog applied correctly. All 3 pre-flight checks passed on first apply. Post-verification PASSED with 9/9 gates satisfied.

## Issues Encountered

None. Migration 585 applied successfully on first run.

## User Setup Required

None — SQL-only migration, no external service configuration required.

## Next Phase Readiness

- Migration 585 applied; 6 SC politicians (external_ids -2507110001..-2507110006) now available for headshot plan
- Plan 03 (Lynn headshots, migration 586) can proceed immediately — all city officials and SC politicians exist in DB
- SC member headshots are expected gaps (lynnschools.org text-only site, per RESEARCH.md and D-01)

### Verification Results

| Query | Expected | Actual | Status |
|-------|----------|--------|--------|
| SC politicians count | 6 | 6 | PASS |
| Total SCHOOL offices | 7 | 7 | PASS |
| G5420 geofence present | 1 | 1 | PASS |
| Gate (i): Mayor LOCAL_EXEC intact | 1 | 1 | PASS |
| Mayor ex-officio title | Mayor (ex officio) | Mayor (ex officio) | PASS |
| Section-split (SCHOOL) | 0 | 0 | PASS |
| Post-verification PASSED notice | emitted | emitted | PASS |

## Known Stubs

None — all data is fully wired. SC member headshots are intentional gaps per D-01 (no accessible official photo source), documented in plan 03 scope.

## Threat Flags

No new security-relevant surface introduced. SQL-only data migration; all INSERT patterns use WHERE NOT EXISTS idempotency guards. T-119-02-01 (Mayor office_id back-fill overwrite) mitigated via range exclusion and Gate (i) RAISE EXCEPTION. T-119-02-02 (Mayor re-insert) mitigated via CROSS JOIN subquery pattern (no WITH ins_p CTE for Mayor block).

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/585_lynn_school_committee.sql`
- FOUND: Migration 585 in supabase_migrations.schema_migrations ledger
- FOUND: 6 Lynn SC politicians in external_id range -2507110006..-2507110001
- FOUND: G5420 geofence for geo_id='2507110'
- FOUND: Mayor's LOCAL_EXEC office_id intact (Gate i = 1)

---
*Phase: 119-lynn-deep-seed*
*Completed: 2026-06-14*
