---
phase: 101-va-state-government-db
plan: "02"
subsystem: database
tags:
  - virginia
  - state-government
  - executives
  - sql-migration
dependency_graph:
  requires:
    - Phase 101 Plan 01 (VA government + 5 chambers seeded, migration 304)
    - State of Virginia government row (pre-existing, bf1095e6)
    - VA TIGER geofences (Phase 100, 511 boundary rows)
  provides:
    - 3 STATE_EXEC districts (Virginia Governor, LG, Attorney General)
    - 3 politician rows (Spanberger -510001, Hashmi -510002, Jones -510003)
    - 3 office rows linked to Governor/LG/AG chambers under State of Virginia
    - office_id back-filled on all 3 politicians
  affects:
    - essentials.districts (3 new STATE_EXEC rows)
    - essentials.politicians (3 new rows)
    - essentials.offices (3 new rows)
tech_stack:
  added: []
  patterns:
    - STATE_EXEC district INSERT with WHERE NOT EXISTS guard (state='VA' uppercase critical)
    - CTE politician+office INSERT with ON CONFLICT DO NOTHING RETURNING id
    - (district_id, chamber_id) NOT EXISTS guard — single-member pattern
    - office_id back-fill UPDATE scoped by external_id range + IS NULL guard
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/306_va_state_executives.sql
  modified: []
decisions:
  - "Migration number 306 used instead of 301 (plan said 301 but 300-305 occupied by LA Wave 2/3 migrations)"
  - "state='VA' uppercase for STATE_EXEC districts — OR 223a lesson enforced"
  - "district_id='' empty string for all 3 districts — OR 223a canonical pattern"
  - "All 3 is_appointed_position=false — Virginia has no legislature-elected executives (VA-GOV-05)"
  - "Pre-flight DO block asserts State of Virginia government row exists before any INSERT"
metrics:
  duration: "~25 minutes"
  completed: "2026-06-08"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 0
---

# Phase 101 Plan 02: VA State Executives Summary

Seeds Virginia's 3 voter-elected state executives (Governor Abigail Spanberger, Lieutenant Governor Ghazala Hashmi, Attorney General Jay Jones) via migration 306 with 3 STATE_EXEC districts, 3 politician rows, 3 office rows linked to chambers, and office_id back-fill — all with idempotent guards.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write migration 306_va_state_executives.sql | 09c3ea8 (EV-Accounts) | C:/EV-Accounts/backend/migrations/306_va_state_executives.sql |
| 2 | Apply migration to production Supabase and verify | (DB-only, no files) | essentials.districts (3), essentials.politicians (3), essentials.offices (3) |

## Migration Details

**File:** `C:/EV-Accounts/backend/migrations/306_va_state_executives.sql`

**Migration number:** 306 (plan said 301; 300-305 occupied by LA migrations — see Deviations)

**Rows inserted:**

| Table | Rows | Key values |
|-------|------|-----------|
| essentials.districts | 3 | district_type='STATE_EXEC', state='VA', geo_id='51', district_id='', mtfcc='' |
| essentials.politicians | 3 | Spanberger (-510001), Hashmi (-510002), Jones (-510003); all Democrat, is_appointed=false |
| essentials.offices | 3 | Governor/LG/AG; all is_appointed_position=false, representing_state='VA' |

## Verification Query Results

**Q1 — STATE_EXEC VA district count:**
```
SELECT COUNT(*)::int AS cnt FROM essentials.districts WHERE district_type='STATE_EXEC' AND state='VA'
→ cnt = 3  (expected 3) ✓
```

**Q2 — District detail (all 3 rows):**
```
SELECT label, district_id, geo_id, state, mtfcc FROM essentials.districts WHERE district_type='STATE_EXEC' AND state='VA' ORDER BY label
→ {"label":"Virginia Attorney General","district_id":"","geo_id":"51","state":"VA","mtfcc":""}
→ {"label":"Virginia Governor","district_id":"","geo_id":"51","state":"VA","mtfcc":""}
→ {"label":"Virginia Lieutenant Governor","district_id":"","geo_id":"51","state":"VA","mtfcc":""}
All district_id='' AND geo_id='51' AND state='VA' AND mtfcc=''  ✓
```

**Q3 — Politicians (all 3 rows):**
```
SELECT external_id, full_name, party, is_appointed, is_vacant, is_active, is_incumbent FROM essentials.politicians WHERE external_id BETWEEN -510010 AND -510001 ORDER BY external_id DESC
→ {"external_id":"-510001","full_name":"Abigail Spanberger","party":"Democrat","is_appointed":false,"is_vacant":false,"is_active":true,"is_incumbent":true}
→ {"external_id":"-510002","full_name":"Ghazala Hashmi","party":"Democrat","is_appointed":false,"is_vacant":false,"is_active":true,"is_incumbent":true}
→ {"external_id":"-510003","full_name":"Jay Jones","party":"Democrat","is_appointed":false,"is_vacant":false,"is_active":true,"is_incumbent":true}
All party='Democrat', is_appointed=false, is_vacant=false, is_active=true, is_incumbent=true  ✓
```

**Q4 — Offices (all 3 rows):**
```
SELECT p.full_name, o.title, o.representing_state, o.is_appointed_position, o.is_vacant FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id WHERE p.external_id BETWEEN -510010 AND -510001 ORDER BY p.external_id DESC
→ {"full_name":"Abigail Spanberger","title":"Governor","representing_state":"VA","is_appointed_position":false,"is_vacant":false}
→ {"full_name":"Ghazala Hashmi","title":"Lieutenant Governor","representing_state":"VA","is_appointed_position":false,"is_vacant":false}
→ {"full_name":"Jay Jones","title":"Attorney General","representing_state":"VA","is_appointed_position":false,"is_vacant":false}
All is_appointed_position=false, is_vacant=false, representing_state='VA'  ✓
(full_name, title) pairs: {Spanberger=Governor, Hashmi=Lieutenant Governor, Jones=Attorney General}  ✓
```

**Q5 — NULL office_id check:**
```
SELECT COUNT(*)::int AS cnt FROM essentials.politicians WHERE external_id BETWEEN -510010 AND -510001 AND office_id IS NULL
→ cnt = 0  (expected 0) ✓
```

**Idempotency re-apply:**
```
Migration 306 re-applied.
Q1 count after re-apply: 3  (still 3, no duplicates) ✓
Politicians count: 3  ✓
Offices count: 3  ✓
```

## Requirement Coverage

| Requirement | Status | Evidence |
|-------------|--------|---------|
| VA-GOV-02 | SATISFIED | 3 STATE_EXEC districts seeded + 3 executives linked (Q1 count = 3) |
| VA-GOV-05 | SATISFIED | All 3 offices have is_appointed_position=false (Q4 verified) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration number collision: used 306 instead of 301**
- **Found during:** Task 1 pre-write directory inspection (critical_deviation_note in prompt also flagged this)
- **Issue:** Plan specified migration 301, but 300-305 are already occupied by LA Wave 2/3 city seed migrations (300_la_wave2_preflight.sql, 301_la_wave2_beverly_hills.sql, 302_la_wave2_santa_monica.sql, 303_la_wave2_la_city_controller_clerk.sql, 304_la_wave3_preflight_west_hollywood_fips.sql, 305_la_wave3_south_gate_compton.sql). Note: 304 has a naming duplicate (304_va_government_chambers.sql also exists). 306 is the next clean slot.
- **Fix:** Used migration number 306 (`306_va_state_executives.sql`)
- **Impact:** Downstream plan references to "migration 301" for executives need to read "migration 306". The orchestrator's critical_deviation_note already specified 306.
- **Files modified:** Filename only (306 vs 301); SQL content identical to plan specification

## Known Stubs

None. Migration 306 produces complete rows with all required fields. No placeholder data.

## Threat Surface Scan

No new network endpoints, auth paths, or file access patterns introduced. Pure database seeding of public government reference data. No threat flags.

All STRIDE mitigations from the plan's threat_model were applied:
- T-101-05: state='VA' uppercase enforced; district_id='' enforced; verified in Q2
- T-101-06: is_appointed_position=false hardcoded on all 3 office rows; verified in Q4
- T-101-07: Each CTE block names chamber explicitly; (full_name, title) pairs verified in Q4

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/306_va_state_executives.sql` exists
- [x] Commit 09c3ea8 exists in EV-Accounts repo (master branch)
- [x] Q1: COUNT = 3 under district_type='STATE_EXEC' AND state='VA'
- [x] Q2: All 3 rows have district_id='', geo_id='51', state='VA', mtfcc=''
- [x] Q3: All 3 politicians — Spanberger, Hashmi, Jones — seeded correctly
- [x] Q4: All 3 offices correct (full_name, title) pairs; is_appointed_position=false
- [x] Q5: NULL office_id count = 0 (back-fill complete)
- [x] Idempotency confirmed: re-apply leaves all counts at 3

## Self-Check: PASSED
