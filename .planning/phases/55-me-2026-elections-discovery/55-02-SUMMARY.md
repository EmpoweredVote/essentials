---
phase: 55-me-2026-elections-discovery
plan: "02"
subsystem: database
tags: [postgres, migrations, elections, maine, legislative-races, powershell]

# Dependency graph
requires:
  - phase: 55-01
    provides: election rows for 2026 Maine State Primary and 2026 Maine General Election
  - phase: 52-me-state-legislature
    provides: ME Senate/House district rows (STATE_UPPER/STATE_LOWER) and office rows linked to districts
provides:
  - 372 ME legislative race scaffold rows (70 senate + 302 house) in essentials.races
  - Migration 184 applied to production DB
  - generate_me_legislative_races.ps1 generator script
affects: [55-03, discovery-cron, elections-view]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - PowerShell generator script producing DO $$ blocks for idempotent bulk race seeding
    - ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING for upsert safety
    - UTF-8 without BOM via [System.IO.File]::WriteAllLines to avoid PostgreSQL parse errors

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/generate_me_legislative_races.ps1
    - C:/EV-Accounts/backend/migrations/184_me_2026_legislative_races.sql
  modified: []

key-decisions:
  - "Migration 184 uses UTF-8 NoBOM output from PowerShell to avoid PostgreSQL BOM syntax errors"
  - "All 372 legislative race rows resolved to non-null office_id including D29 (vacant seat has office row)"
  - "district_type disambiguation (STATE_UPPER vs STATE_LOWER) confirmed working — Senate D1 and House D1 have distinct office_ids"

patterns-established:
  - "PowerShell generator: use [System.IO.File]::WriteAllLines with UTF8Encoding($false) not Out-File -Encoding UTF8"
  - "Legislative race scaffold: primary_party=NULL, seats=1, no candidates seeded (discovery pipeline handles those)"

# Metrics
duration: 3min
completed: 2026-05-20
---

# Phase 55 Plan 02: ME 2026 Legislative Race Scaffolding Summary

**372 ME legislative race scaffold rows (70 senate + 302 house) applied via migration 184; all linked to correct district offices; discovery cron can now attach candidates**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-20T18:13:48Z
- **Completed:** 2026-05-20T18:17:02Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- PowerShell generator script produces 186 DO $$ blocks (35 senate + 151 house), each with 2 INSERT statements for primary and general elections
- Migration 184 applied to production DB with zero SQL errors; 372 race rows confirmed
- All 372 rows have non-null office_id (including D29 vacant seat which had an office row from Phase 52)
- District-type disambiguation confirmed: Senate District 1 and House District 1 have distinct office_ids (STATE_UPPER vs STATE_LOWER)
- Total ME races now 380 (372 legislative + 8 statewide from Plan 01)

## Task Commits

Both tasks were executed in migration files outside the essentials git repo (C:/EV-Accounts/backend/migrations/). No separate per-task commits were possible from this repo. The planning artifacts commit below records the work.

1. **Task 1: Write PowerShell generator script** - migration files at C:/EV-Accounts/backend/migrations/generate_me_legislative_races.ps1 (chore)
2. **Task 2: Apply migration 184** - 184_me_2026_legislative_races.sql applied to production (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/generate_me_legislative_races.ps1` - Generator script producing 372 race INSERT blocks across 186 DO blocks
- `C:/EV-Accounts/backend/migrations/184_me_2026_legislative_races.sql` - Applied SQL: 372 legislative race scaffold rows for both ME 2026 elections

## Decisions Made
- Generator uses `[System.IO.File]::WriteAllLines` with `UTF8Encoding($false)` instead of `Out-File -Encoding UTF8` to avoid the UTF-8 BOM that PostgreSQL rejects as a syntax error
- `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING` makes the migration safely re-runnable
- `LIMIT 1` on the office subquery prevents errors when no office is found — returns NULL which is acceptable (though in practice all 372 resolved to non-null)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed UTF-8 BOM causing PostgreSQL syntax error**
- **Found during:** Task 2 (Apply migration 184)
- **Issue:** PowerShell `Out-File -Encoding UTF8` writes a BOM (bytes EF BB BF) which PostgreSQL rejects with "syntax error at or near ''" — migration application failed on first attempt
- **Fix:** Changed generator to use `[System.IO.File]::WriteAllLines("filename", $output, [System.Text.UTF8Encoding]::new($false))` which writes UTF-8 without BOM; re-ran generator and applied successfully
- **Files modified:** C:/EV-Accounts/backend/migrations/generate_me_legislative_races.ps1
- **Verification:** Node confirmed no BOM bytes; migration applied cleanly; 372 rows confirmed
- **Committed in:** Part of planning docs commit

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** BOM fix required for migration to apply. Generator script updated so future re-runs are also BOM-free. No scope change.

## Issues Encountered
- UTF-8 BOM from PowerShell Out-File caused immediate "syntax error at or near" failure; resolved by switching to System.IO.File::WriteAllLines with explicit NoBOM encoding

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 372 ME legislative race scaffold rows are in production; discovery cron can now find and attach legislative candidates to these races on the next cron sweep
- Plan 55-03 (discovery pipeline integration / cron) can proceed immediately
- Next migration is 185

---
*Phase: 55-me-2026-elections-discovery*
*Completed: 2026-05-20*
