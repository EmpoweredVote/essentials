---
plan: 96-02
phase: 96-md-2026-elections-discovery-pipeline-landing
status: complete
completed: 2026-06-06
subsystem: elections-races
tags:
  - elections
  - races
  - sql
  - powershell
  - maryland
dependency_graph:
  requires:
    - 96-01 (migration 278 election rows — FK targets for race election_id)
    - Phase 93 migrations 273+274 (47 senator offices + 141 delegate offices must exist)
    - Phase 92 migration 270 (statewide + US House offices must exist)
  provides:
    - 130 MD 2026 race rows (12 statewide + 47 senate + 71 SLDL house) linked to general election
    - Scaffold for discovery agent to populate candidates
  affects:
    - essentials.races (130 new rows)
    - elections/me endpoint — users with MD address will now see MD races
tech_stack:
  added: []
  patterns:
    - WITH gen_elec + VALUES list INSERT for statewide races (migration 238 analog)
    - DO $$ per-district block pattern for legislative races (migration 239 analog)
    - PowerShell generator with [System.Text.UTF8Encoding]::new($false) no-BOM write
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/279_md_2026_statewide_races.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-279.ts
    - C:/EV-Accounts/backend/migrations/generate_md_legislative_races.ps1
    - C:/EV-Accounts/backend/migrations/280_md_2026_legislative_races.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-280.ts
  modified: []
decisions:
  - "Chamber name 'Maryland Senate' (not 'Maryland State Senate') — ch.name in DB is short name; name_formal is 'Maryland State Senate'; using formal name produces NULL office_ids"
  - "Migration 279 post-verify uses position_name IN list to scope to statewide only (idempotent when re-run after migration 280)"
metrics:
  duration: ~45m
  tasks: 2
  files: 5
---

# Phase 96 Plan 02: MD 2026 Race Rows (Migrations 279 + 280) Summary

**One-liner:** 130 Maryland 2026 race rows seeded — 12 statewide + 47 senate + 71 SLDL house — with zero NULL office_ids and full idempotency.

## What Was Built

### Migration 279: Statewide Races (12 rows)
`C:/EV-Accounts/backend/migrations/279_md_2026_statewide_races.sql`

- Governor of Maryland, Attorney General of Maryland, Comptroller of Maryland
- U.S. Senate Maryland (Van Hollen, Class 3)
- U.S. House MD-01 through MD-08
- Uses WITH gen_elec + VALUES list pattern (no hardcoded election UUIDs)
- ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING
- Post-verify block scoped to statewide position_names (idempotent when run after migration 280)

### PowerShell Generator: generate_md_legislative_races.ps1
`C:/EV-Accounts/backend/migrations/generate_md_legislative_races.ps1`

- Senate section: for-loop n=1..47, geo_ids 24001..24047, ch.name='Maryland Senate', seats=1
- House section: 71-entry hardcoded array (29 whole-district + 42 sub-district)
- UTF-8 no-BOM write via [System.Text.UTF8Encoding]::new($false)
- ROADMAP deviation note in SQL header

### Migration 280: Legislative Races (118 rows)
`C:/EV-Accounts/backend/migrations/280_md_2026_legislative_races.sql`

- 47 senate races: "MD State Senate District N" with seats=1
- 29 whole-district house races: "MD House Delegate District N" with seats=3
- 42 sub-district house races: "MD House Delegate Subdistrict NNA" with variable seats (1 or 2)
- 119 DO $$ blocks total (118 races + 1 post-verify)
- Post-verify: IF total MD races != 130 THEN RAISE EXCEPTION

## Final Race Counts

| Category | Count | Seats |
|----------|-------|-------|
| Governor of Maryland | 1 | 1 |
| Attorney General of Maryland | 1 | 1 |
| Comptroller of Maryland | 1 | 1 |
| U.S. Senate Maryland | 1 | 1 |
| U.S. House MD-01 through MD-08 | 8 | 1 each |
| MD State Senate Districts 1-47 | 47 | 1 each |
| MD House Delegate whole-district (seats=3) | 29 | 3 each (87 total) |
| MD House Delegate sub-district (variable) | 42 | mix (54 total) |
| **TOTAL** | **130** | **-** |

**Total House Delegate seats: 141** (87 whole-district + 54 sub-district = 141, verified)

## Key Spot-Checks Passed

- `MD House Delegate Subdistrict 11B` seats = 2 ✓
- `MD House Delegate District 3` seats = 3 ✓
- `MD State Senate District 1` seats = 1 ✓
- NULL office_id count = 0 ✓
- Ledger entries 279 and 280 PRESENT ✓

## Idempotency

- Migration 279: re-run keeps count at 12 statewide ✓
- Migration 280: re-run keeps total at 130 ✓

## ROADMAP Deviation

**ROADMAP estimate:** 198 total race rows (one-row-per-seat model)
**Actual count:** 130 rows (one-row-per-district model, enforced by UNIQUE constraint)

Reason: `UNIQUE (election_id, position_name, primary_party)` with partial index `WHERE primary_party IS NULL` makes inserting one-per-seat impossible without fabricating unique position_names. D-01 (one row per district) is the correct and only viable model. The deviation is documented in migration 280's header comment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong senate chamber name in office lookup**
- **Found during:** Task 2, first apply of migration 280
- **Issue:** Plan and STATE.md documented `ch.name = 'Maryland State Senate'` but the actual DB `chambers.name` value is `'Maryland Senate'` (the formal name `'Maryland State Senate'` is stored in `name_formal`). Using the wrong name caused all 47 senate race rows to have `office_id = NULL`.
- **Fix:** Updated generator to use `ch.name = 'Maryland Senate'`. Deleted the 47 NULL-office_id rows, regenerated SQL, re-applied migration. All 47 senate races now have valid office_ids.
- **Files modified:** `generate_md_legislative_races.ps1`, `280_md_2026_legislative_races.sql`
- **Commit:** a1b1fd5

**2. [Rule 1 - Bug] Migration 279 post-verify block counted all MD races**
- **Found during:** Task 2, idempotency re-run of migration 279 after migration 280 applied
- **Issue:** Post-verify block in 279 used `WHERE e.state='MD' AND e.name='2026 Maryland General Election'` which returns all MD races (130) after migration 280 is applied, not just the 12 statewide ones. Re-running 279 raised "Expected 12, found 130".
- **Fix:** Scoped the post-verify WHERE clause to `position_name IN ('Governor of Maryland', 'Attorney General of Maryland', ...)` for all 12 specific statewide position_names. Same fix applied to the apply script smoke test.
- **Files modified:** `279_md_2026_statewide_races.sql`, `_apply-migration-279.ts`
- **Commit:** a1b1fd5 (included in task 2 commit since it's an amendment to task 1)

## Commits

- `1fa3e23`: `feat(96-02): MD 2026 statewide races migration 279`
- `a1b1fd5`: `feat(96-02): MD 2026 legislative races migration 280 + generator`

## Known Stubs

None — all race rows have office_ids and are wired to the 2026 Maryland General Election.

## Threat Flags

None — this plan adds race rows to an internal admin table. No new network endpoints or auth surfaces.

## Self-Check: PASSED
