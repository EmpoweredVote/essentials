---
phase: 93-md-legislature-federal-officials
plan: "02"
subsystem: database
tags:
  - maryland
  - senate
  - migration
  - powershell-generator
dependency_graph:
  requires:
    - "Phase 91: 47 STATE_UPPER SLDU districts loaded (geo_ids 24001-24047)"
    - "Migration 272: Maryland Senate chamber seeded (Plan 93-01)"
    - "Migration 174: State of Maryland government row (geo_id='24')"
  provides:
    - "generate_md_senate.ps1 — PowerShell generator producing migration 273"
    - "273_md_state_senators.sql — 47 CTE blocks + office_id back-fill"
    - "Migration 273 applied to production DB"
    - "47 essentials.politicians rows (external_id -2410001..-2410047)"
    - "47 essentials.offices rows linked to Maryland Senate + STATE_UPPER districts"
  affects:
    - "Phase 96 (MD Elections): 47 Senate offices available for election race rows"
    - "Phase 97 (Stances): 47 senator politician_ids available for compass stances"
    - "Phase 94 (Headshots): 47 senator rows exist to receive politician_images"
tech_stack:
  added: []
  patterns:
    - "PowerShell generator pattern (generate_or_senate.ps1 adapted for MD)"
    - "OR-to-MD deviation: FIPS prefix 24, AND state='MD' in govt subquery, p.id IS NOT NULL guard"
    - "UTF-8 NoBOM file writer ([System.Text.UTF8Encoding]::new($false))"
    - "_apply-migration-NNN.ts script pattern via tsx for migration apply + smoke tests"
    - "CTE block: politician INSERT + office INSERT linked to STATE_UPPER district"
    - "office_id back-fill UPDATE scoped to external_id range -2410047..-2410001"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/generate_md_senate.ps1"
    - "C:/EV-Accounts/backend/migrations/273_md_state_senators.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-273.ts"
  modified: []
decisions:
  - "p.id IS NOT NULL guard added to CROSS JOIN (OR omits; MD adds per RESEARCH.md anti-pattern note)"
  - "AND state = 'MD' added to government subquery (OR omits; MD follows migration 269 precedent)"
  - "d.state = 'md' lowercase confirmed for STATE_UPPER district lookup (TIGER loader casing)"
  - "NOT EXISTS guard uses (district_id, chamber_id) for 1:1 senators — multi-member guard not needed here"
  - "Party affiliations assigned from mgaleg.maryland.gov: 12 Republican (SD-1,2,4,5,6,7,29,31,35,36,37,38,42) + 35 Democrat"
metrics:
  duration: "18 minutes"
  completed: "2026-06-05T22:05:00Z"
  tasks_completed: 2
  files_created: 3
---

# Phase 93 Plan 02: MD State Senators Migration Summary

47 Maryland state senators seeded via PowerShell-generated migration 273. Generator script follows the Oregon senate generator pattern with MD-specific deviations (FIPS 24, state casing, p.id IS NOT NULL guard). Migration applied idempotently to production; all 47 senators have politicians + offices linked to correct STATE_UPPER SLDU districts and office_id back-filled.

## What Was Built

**File 1:** `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` — PowerShell generator producing migration 273.

- Adapts `generate_or_senate.ps1` with 7 MD-specific deviations documented in PATTERNS.md
- Full 47-entry roster from RESEARCH.md (SD-01 McKay through SD-47 Augustine)
- FIPS prefix '24', AND state = 'MD' government subquery, d.state = 'md' district query
- p.id IS NOT NULL guard on CROSS JOIN (added vs OR analog)
- UTF-8 NoBOM output writer
- CTE count verification: logs "CTE blocks (senators): 47  (expected 47)"

**File 2:** `C:/EV-Accounts/backend/migrations/273_md_state_senators.sql` — Generated output.

- 47 CTE blocks, one per senator (SD-01 through SD-47)
- BEGIN/COMMIT wrapper
- office_id back-fill: `UPDATE essentials.politicians SET office_id WHERE external_id BETWEEN -2410047 AND -2410001`
- 1622 lines total

**Apply timestamp:** 2026-06-05T22:05:00Z

## Final Counts

| Metric | Expected | Actual | Pass |
|--------|----------|--------|------|
| Senator offices (Maryland Senate chamber) | 47 | 47 | YES |
| Politician rows (external_id in range) | 47 | 47 | YES |
| Politicians with office_id back-filled | 47 | 47 | YES |
| Offices linked to STATE_UPPER districts (state='md') | 47 | 47 | YES |
| NULL office_id count | 0 | 0 | YES |

## Spot-Check Verification

| District | Expected Senator | external_id | geo_id | district_type | state |
|----------|-----------------|-------------|--------|---------------|-------|
| SD-01 | Mike McKay | -2410001 | 24001 | STATE_UPPER | md |
| SD-22 | Alonzo T. Washington | -2410022 | 24022 | STATE_UPPER | md |
| SD-47 | Malcolm Augustine | -2410047 | 24047 | STATE_UPPER | md |

All 3 spot-checks confirmed correct politician-district linkage.

## Idempotency

Re-applied migration 273: counts remain 47, no errors, no additional rows inserted. Idempotency confirmed.

## Deviations from Plan

None — plan executed exactly as written. All 7 OR-to-MD deviations applied correctly:
1. FIPS prefix '24' (not '41')
2. 'Maryland Senate' / 'State of Maryland'
3. AND state = 'MD' in government subquery
4. p.id IS NOT NULL guard on CROSS JOIN
5. representing_state = 'MD'
6. external_id range -2410001..-2410047
7. d.state = 'md' lowercase for STATE_UPPER lookup

The '41' comment in the generator header (noting the deviation FROM '41') triggered a false-positive acceptance check; the actual SQL output and functional code contain no '41' or 'Oregon' references.

## Next Migration Counter

STATE.md `Next migration` advances to **274**.

## Self-Check: PASSED

- File `C:/EV-Accounts/backend/migrations/generate_md_senate.ps1` exists — FOUND
- File `C:/EV-Accounts/backend/migrations/273_md_state_senators.sql` exists — FOUND
- Generator outputs "CTE blocks (senators): 47  (expected 47)" — CONFIRMED
- Migration applied: 47 politicians + 47 offices + 47 back-fills — CONFIRMED via smoke tests
- Spot-checks SD-01/SD-22/SD-47 correct — CONFIRMED
- Idempotency re-apply produces 0 additional rows — CONFIRMED
