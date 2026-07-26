---
phase: 101-va-state-government-db
plan: "03"
subsystem: database
tags:
  - virginia
  - state-government
  - senators
  - sql-migration
  - powershell-generator
dependency_graph:
  requires:
    - Phase 100 VA TIGER geofences (511 boundary rows, 40 STATE_UPPER districts)
    - Phase 101 Plan 01: Virginia Senate chamber seeded (migration 304)
  provides:
    - 40 VA state senators (politicians + offices + office_id back-fill)
    - external_id range -5110001 through -5110040
    - Virginia Senate chamber fully populated
  affects:
    - essentials.politicians (40 new rows)
    - essentials.offices (40 new rows)
tech_stack:
  added: []
  patterns:
    - PowerShell generator emitting UTF-8 NoBOM SQL (generate_md_senate.ps1 pattern)
    - CTE per-senator INSERT with ON CONFLICT (external_id) DO NOTHING
    - NOT EXISTS (district_id, chamber_id) office idempotency guard (single-member upper chamber)
    - office_id back-fill UPDATE scoped by external_id range
    - d.district_type = 'STATE_UPPER' AND d.state = 'va' district join (overlap safety)
    - tsx apply script with smoke tests and spot-checks
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/generate_va_senate.ps1
    - C:/EV-Accounts/backend/migrations/307_va_state_senators.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-307.ts
  modified: []
decisions:
  - "Migration number 307 used instead of 302 (plan-specified) — 300-305 occupied by LA Wave 2/3 migrations; 307 was next available"
  - "Apply script named _apply-migration-307.ts to match actual migration number"
  - "last names for compound/suffix names follow MD precedent: 'Carroll Foy' -> last='Foy', 'Bennett-Parker' -> last='Bennett-Parker', suffixes dropped (Stanley Jr. -> last='Stanley')"
  - "SD-24 J.D. \"Danny\" Diggs embedded double-quotes handled correctly — double-quotes are literal in SQL single-quoted strings"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-08"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 0
---

# Phase 101 Plan 03: VA State Senators Summary

Seeds all 40 Virginia state senators (SD-1 through SD-40) as politicians with offices linked to STATE_UPPER geofence districts under the Virginia Senate chamber, via PowerShell generator + migration 307.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write generate_va_senate.ps1 and emit 307_va_state_senators.sql | b5ad2aa (EV-Accounts) | generate_va_senate.ps1, 307_va_state_senators.sql |
| 2 | Write _apply-migration-307.ts and execute it | dfce0bb (EV-Accounts) | _apply-migration-307.ts |

## Generator Console Output

```
Written: C:/EV-Accounts/backend/migrations/307_va_state_senators.sql
CTE blocks (senators): 40  (expected 40)
```

## Apply Script Console Output

```
Migration 307 applied successfully
Senator offices (Virginia Senate chamber): 40 (expected 40)
Politician rows in range: 40 (expected 40)
Politicians with office_id back-filled: 40 (expected 40)
Offices linked to STATE_UPPER districts (state=va): 40 (expected 40)

Spot-check SD-01: {"full_name":"Timmy French","external_id":"-5110001","geo_id":"51001","district_type":"STATE_UPPER","state":"va"}
Spot-check SD-20: {"full_name":"Bill DeSteph","external_id":"-5110020","geo_id":"51020","district_type":"STATE_UPPER","state":"va"}
Spot-check SD-40: {"full_name":"Barbara A. Favola","external_id":"-5110040","geo_id":"51040","district_type":"STATE_UPPER","state":"va"}

NULL office_id count (expected 0): 0

Party split:
  Democrat = 21
  Republican = 19
```

## Post-Apply Verification Query Results

| Query | Result | Expected |
|-------|--------|----------|
| Politician count (external_id BETWEEN -5110040 AND -5110001) | 40 | 40 |
| Office count under Virginia Senate chamber | 40 | 40 |
| NULL office_id count | 0 | 0 |
| Party split: Democrat | 21 | 21 |
| Party split: Republican | 19 | 19 |
| Section-split wrong districts (district_type != STATE_UPPER or state != 'va') | 0 | 0 |
| Idempotency re-apply | 0 new rows | 0 new rows |

## Migration Details

**File:** `C:/EV-Accounts/backend/migrations/307_va_state_senators.sql`

**Structure:**
- 1 `BEGIN;` statement
- 40 `WITH ins_p AS` CTE blocks (one per senator, SD-1 through SD-40)
- 1 `UPDATE essentials.politicians` office_id back-fill
- 1 `COMMIT;` statement
- UTF-8 without BOM (verified: first 3 bytes not 0xEF 0xBB 0xBF)

**Key SQL patterns:**
- District lookup: `WHERE d.geo_id = '51NNN' AND d.district_type = 'STATE_UPPER' AND d.state = 'va'`
- Chamber subquery: `WHERE name = 'Virginia Senate' AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Virginia' AND state = 'VA')`
- Office idempotency: `NOT EXISTS (SELECT 1 FROM essentials.offices o WHERE o.district_id = d.id AND o.chamber_id = ...)`
- Back-fill range: `BETWEEN -5110040 AND -5110001`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration number collision: used 307 instead of 302**
- **Found during:** Task 1 pre-execution (per critical_deviation_note in execution prompt)
- **Issue:** Plan specified migration 302, but migrations 300-305 are occupied by LA Wave 2/3 migrations (300_la_wave2_preflight, 301_la_wave2_beverly_hills, 302_la_wave2_santa_monica, 303_la_wave2_la_city_controller_clerk, 304_va_government_chambers + 304_la_wave3_preflight, 305_la_wave3_south_gate_compton). Migration 307 was next available.
- **Fix:** Used migration number 307 — `307_va_state_senators.sql`, `_apply-migration-307.ts`, `$Out` default updated in generator
- **Impact:** Downstream references to "migration 302" for senators must use 307 instead. No data impact.
- **Files modified:** File naming only

## Known Stubs

None. All 40 senator politician rows have complete data: full_name, first_name, last_name, party, is_active=true, is_vacant=false, office_id back-filled.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. Pure database seeding of public government reference data.

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-101-10 (district_type filter) | `AND d.district_type = 'STATE_UPPER'` present in all 40 CTE blocks | MITIGATED |
| T-101-11 (West Virginia collision) | `AND state = 'VA'` in all government subqueries | MITIGATED |
| T-101-12 (encoding corruption) | UTF-8 NoBOM verified; SD-24 "Danny" Diggs embedded-quote verified | MITIGATED |
| T-101-14 (duplicate apply) | ON CONFLICT + NOT EXISTS + office_id IS NULL guard; idempotency re-run confirmed | MITIGATED |

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/generate_va_senate.ps1` exists
- [x] `C:/EV-Accounts/backend/migrations/307_va_state_senators.sql` exists (40 CTE blocks, UTF-8 NoBOM)
- [x] `C:/EV-Accounts/backend/scripts/_apply-migration-307.ts` exists
- [x] Commit b5ad2aa exists (generator + SQL)
- [x] Commit dfce0bb exists (apply script + DB state)
- [x] 40 senator offices in production Virginia Senate chamber
- [x] Party split Democrat=21, Republican=19 confirmed
- [x] NULL office_id count = 0 confirmed
- [x] Idempotency confirmed (second re-apply = 0 new rows)
- [x] All 3 spot-checks correct geo_ids and district_type

## Self-Check: PASSED
