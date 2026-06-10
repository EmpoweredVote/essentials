---
phase: 109-ma-tier-2-cities
plan: "03"
subsystem: data/migrations
tags: [lowell, ma-tier2, council-manager, plan-e, government-seed, production-applied]
dependency_graph:
  requires: [108-boston-deep-seed]
  provides: [lowell-government, lowell-12-officials, lowell-local-district]
  affects: [essentials.governments, essentials.chambers, essentials.districts, essentials.politicians, essentials.offices]
tech_stack:
  added: []
  patterns: [council-manager-model, cambridge-precedent, is_appointed_true_for_appointed_officials]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/353_lowell_government.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-353.ts
  modified: []
decisions:
  - "City Manager Golden and Mayor Gitschier both use is_appointed_position=true per plan spec and Cambridge precedent"
  - "All 12 offices link to single LOCAL district — council-manager (Plan E) model, no exec district"
  - "Councillor title is 'City Councilor' (not 'City Councillor') per Lowell official site usage"
metrics:
  duration: 2m
  completed: "2026-06-10"
  tasks_completed: 3
  files_created: 2
  files_modified: 0
---

# Phase 109 Plan 03: Lowell Government Seed (Plan E Council-Manager) Summary

## One-liner

Seeded City of Lowell, MA using Plan E council-manager model: 1 government, 1 chamber, 1 LOCAL district (no exec district), City Manager Golden + council-elected Mayor Gitschier (both is_appointed=true) + 10 elected councillors (is_appointed=false); migration 353 applied to production, all 7 gates passed.

## What Was Built

Migration `353_lowell_government.sql` seeds the Lowell city government structure following the Plan E (council-manager) model, identical to Cambridge's approach:

- **Government row**: 'City of Lowell, Massachusetts, US' (type='LOCAL', state='MA', geo_id='2537000')
- **Chamber**: 'City Council' / 'Lowell City Council'
- **Single LOCAL district** (geo_id='2537000') — no exec district for council-manager city
- **12 officials**:
  - Thomas A. Golden, Jr. (City Manager, is_appointed=true, is_appointed_position=true)
  - Erik R. Gitschier (Mayor, council-elected, is_appointed=true, is_appointed_position=true)
  - Rita Mercier, Vesna Nuon (Councillors-at-Large, is_appointed=false)
  - Daniel Rourke through John Descoteaux (District 1-8 Councillors, is_appointed=false)
- **12 offices** all linked to the single LOCAL district
- **office_id back-fill**: all 12 politicians have non-NULL office_id

Apply harness `_apply-migration-353.ts` provides TypeScript smoke test harness with 5 tests (district count expects 1, politician count expects 12, NULL office_id check expects 0, ledger check).

## Production Verification

Migration 353 applied via psql with DATABASE_URL. All 7 post-verification gates passed:

| Gate | Expected | Actual | Result |
|------|----------|--------|--------|
| Government rows | 1 | 1 | PASS |
| Chamber rows | 1 | 1 | PASS |
| District rows (LOCAL only) | 1 | 1 | PASS |
| Politicians in range | 12 | 12 | PASS |
| Offices linked to LOCAL district | 12 | 12 | PASS |
| Section-split orphans | 0 | 0 | PASS |
| NULL office_id count | 0 | 0 | PASS |

Post-apply SQL checks:
- `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -253700012 AND -253700001` = **12**
- `SELECT COUNT(*) FROM essentials.districts WHERE state='ma' AND geo_id='2537000' AND district_type='LOCAL_EXEC'` = **0**
- MA G4110 orphan count: **52** (Lowell geo_id=2537000 no longer an orphan)
- Ledger version '353': **PRESENT**

Appointed officials confirmed:

| Name | is_appointed | title | is_appointed_position |
|------|-------------|-------|----------------------|
| Thomas A. Golden, Jr. | true | City Manager | true |
| Erik R. Gitschier | true | Mayor | true |
| All 10 councillors | false | City Councilor / City Councilor (District N) | false |

## Deviations from Plan

### Auto-fixed Issue

**[Rule 1 - Bug] Removed LOCAL_EXEC string from comments**
- **Found during:** Task 1 automated verification
- **Issue:** Plan's Task 1 verify script checks `if(s.includes('LOCAL_EXEC'))` and trips on comment text. Header comments explaining the absence of the exec district pattern contained 'LOCAL_EXEC' string, failing the check.
- **Fix:** Replaced all comment references to 'LOCAL_EXEC' with equivalent language ('exec district', 'no exec district') while preserving semantic meaning.
- **Files modified:** 353_lowell_government.sql (comments only, no behavior change)
- **Commit:** Part of task 1 work

## Tasks Completed

| Task | Name | Status |
|------|------|--------|
| 1 | Write migration 353 (council-manager, no exec district) | DONE |
| 2 | Write apply harness _apply-migration-353.ts | DONE |
| 3 | Apply migration 353 to production | DONE — all gates passed |

## Known Stubs

None — all 12 politicians have office_id populated; data is live in production.

## Threat Flags

No new network endpoints, auth paths, or schema changes at trust boundaries introduced. T-109-07/08/09 mitigations confirmed:
- T-109-07 (idempotency): WHERE NOT EXISTS + ON CONFLICT DO NOTHING + NOT EXISTS office guard all present
- T-109-08 (no exec district): confirmed 0 LOCAL_EXEC rows for geo_id='2537000' in production
- T-109-09 (public officials): all 12 are public officials from official Lowell city website

## Self-Check: PASSED

Files created:
- FOUND: C:/EV-Accounts/backend/migrations/353_lowell_government.sql
- FOUND: C:/EV-Accounts/backend/scripts/_apply-migration-353.ts
- FOUND: .planning/phases/109-ma-tier-2-cities/109-03-SUMMARY.md

Production DB: migration 353 applied; 12 politicians + 12 offices + 1 LOCAL district confirmed.
