---
phase: 93-md-legislature-federal-officials
plan: "04"
subsystem: database
tags:
  - maryland
  - federal
  - us-house
  - migration
dependency_graph:
  requires:
    - "Phase 91: MD TIGER geofences loaded (8 NATIONAL_LOWER + 1 NATIONAL_UPPER districts)"
    - "Phase 92: State of Maryland government row + 5 executive chambers"
    - "Pre-existing: Van Hollen (-400033) + Alsobrooks (-400034) already seeded"
  provides:
    - "8 MD US House reps (politicians ext -2440001..-2440008)"
    - "8 MD House offices linked to NATIONAL_LOWER districts geo_id 2401..2408"
    - "Migration 275 applied to production DB"
  affects:
    - "Phase 96 (MD Elections): all 10 federal officials now have offices for race row creation"
    - "Phase 94 (Headshots): 8 new House rep politician_ids available for headshot ingestion"
    - "Phase 97/98 (Stances): federal official politician_ids available for stance ingestion"
tech_stack:
  added: []
  patterns:
    - "Pre-flight assertion on pre-existing senators (anti-re-insert pattern)"
    - "Single-member federal district guard: NOT EXISTS on (district_id, chamber_id)"
    - "NATIONAL district state casing: d.state = 'MD' UPPERCASE (Pitfall 5)"
    - "Hardcoded federal chamber UUID for U.S. House of Representatives (c2facc31-7b13-428c-b7b9-32d0d3b95f76)"
    - "Migration 170 (ME) pattern adapted with senator INSERT → senator assertion"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql"
  modified: []
decisions:
  - "Steny Hoyer (MD-05) confirmed seated via hoyer.house.gov (2026-06-05); still serving through end of term despite announced 2026 non-reelection intent"
  - "Pre-flight assert pattern chosen over INSERT for senators (Van Hollen -400033, Alsobrooks -400034 already seeded — re-insert would be wasteful and potentially confusing)"
  - "NOT EXISTS guard uses (district_id, chamber_id) for single-member federal districts (vs. (district_id, politician_id) for multi-member delegate districts)"
  - "role_canonical column included as NULL for schema consistency with 170_me_federal_officials.sql"
metrics:
  duration: "20 minutes"
  completed: "2026-06-05T22:30:00Z"
  tasks_completed: 1
  files_created: 1
---

# Phase 93 Plan 04: MD Federal Officials Migration Summary

Migration 275 seeds 8 Maryland US House representatives with offices linked to NATIONAL_LOWER congressional districts (geo_ids 2401..2408) under the shared U.S. House of Representatives chamber. Pre-existing US senators (Van Hollen and Alsobrooks) are asserted present and not re-inserted.

## Steny Hoyer (MD-05) Incumbency Verification

**Verification timestamp:** 2026-06-05T22:10:00Z
**Method:** WebFetch of https://hoyer.house.gov/
**Result:** CONFIRMED SEATED — hoyer.house.gov site active, displays "Congressman Steny Hoyer | Representing the 5th District of Maryland". No announcement of mid-term resignation found. Hoyer announced he would not seek re-election in 2026 but continues to serve through end of his current term.
**Decision:** Seeded as active incumbent (is_active=true, is_incumbent=true) for MD-05.

## What Was Built

**Migration 275:** `275_md_federal_officials.sql` — Asserts 2 pre-existing senators + seeds 8 US House reps:

| Dist | Full Name | Party | geo_id | ext_id |
|------|-----------|-------|--------|--------|
| MD-01 | Andy Harris | Republican | 2401 | -2440001 |
| MD-02 | Johnny Olszewski | Democrat | 2402 | -2440002 |
| MD-03 | Sarah Elfreth | Democrat | 2403 | -2440003 |
| MD-04 | Glenn Ivey | Democrat | 2404 | -2440004 |
| MD-05 | Steny Hoyer | Democrat | 2405 | -2440005 |
| MD-06 | April McClain Delaney | Democrat | 2406 | -2440006 |
| MD-07 | Kweisi Mfume | Democrat | 2407 | -2440007 |
| MD-08 | Jamie Raskin | Democrat | 2408 | -2440008 |

**Apply timestamp:** 2026-06-05T22:15:00Z

## Pre-flight Assertion Results

| Assertion | Expected | Result |
|-----------|----------|--------|
| MD NATIONAL_UPPER district exists | 1 row | PASSED |
| Van Hollen (-400033) + Alsobrooks (-400034) present | 2 rows | PASSED |

Both senators pre-exist with NATIONAL_UPPER offices intact (confirmed by post-migration query).

## Verification Results

All acceptance criteria passed:

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| MD House offices (U.S. House of Representatives chamber) | 8 | 8 | YES |
| MD House politicians (ext -2440001..-2440008) | 8 | 8 | YES |
| office_id back-filled (NOT NULL) | 8 | 8 | YES |
| office_id IS NULL (must be 0) | 0 | 0 | YES |
| District linkage (NATIONAL_LOWER, state='MD') | 8 | 8 | YES |
| Pre-existing senator offices (NATIONAL_UPPER) | 2 | 2 | YES |
| Per-district coverage gate (HAVING COUNT(*) <> 1) | 0 violations | 0 violations | YES |

### Per-District Coverage (spot-check CD-01 and CD-08)

| field | Andy Harris (CD-01) | Jamie Raskin (CD-08) |
|-------|---------------------|----------------------|
| full_name | Andy Harris | Jamie Raskin |
| party | Republican | Democrat |
| title | U.S. Representative | U.S. Representative |
| representing_state | MD | MD |
| geo_id | 2401 | 2408 |
| district_type | NATIONAL_LOWER | NATIONAL_LOWER |
| district_state | MD | MD |
| is_incumbent | true | true |
| is_active | true | true |

## Idempotency

Migration re-applied successfully — no errors, counts unchanged:
- MD House offices after re-apply: 8 (unchanged)
- MD House politicians after re-apply: 8 (unchanged)

## Deviations from Plan

None — plan executed exactly as written.

- Steny Hoyer (MD-05) incumbency confirmed at execution time (Task 1 Step 1 completed) — no deviation needed
- Pre-flight assertions passed on first apply — no schema issues found
- All 8 CTE blocks generated correctly following the 170_me_federal_officials.sql template

## Key Decisions

- **Hoyer verification:** Confirmed seated via live hoyer.house.gov fetch. Seeded with is_incumbent=true, is_active=true. Serves through end of 119th Congress term regardless of 2026 non-reelection announcement.
- **senator INSERT skipped:** Van Hollen and Alsobrooks pre-exist with correct NATIONAL_UPPER offices and back-filled office_ids. Migration 275 only asserts their presence and proceeds to insert only the 8 House reps. This is cleaner than inserting + relying on ON CONFLICT DO NOTHING.
- **NOT EXISTS guard for House reps:** Uses `(district_id, chamber_id)` — correct for single-member federal districts where each congressional district has exactly 1 representative. Delegate migration (274) used `(district_id, politician_id)` for multi-member districts. This distinction is intentional.

## Next Migration Counter

STATE.md `Next migration` advanced to **276**.

Note: Migration 274 (MD delegates, Plan 93-03) has not yet been applied — it will use number 274 when executed. Supabase tracks migrations by name, not strictly by number ordering, so applying 275 before 274 is acceptable.

## Self-Check: PASSED

- File exists: `C:/EV-Accounts/backend/migrations/275_md_federal_officials.sql` — FOUND
- File contains 'Pre-flight failed: MD US senators not found' — CONFIRMED
- File contains "external_id IN (-400033, -400034)" — CONFIRMED
- File does NOT insert senators (no INSERT block for -400033 or -400034) — CONFIRMED
- File contains exactly 8 occurrences of `WITH ins_p AS` — CONFIRMED (8)
- File contains 'c2facc31-7b13-428c-b7b9-32d0d3b95f76' — CONFIRMED
- File contains "'U.S. Representative'" — CONFIRMED
- File contains "d.state = 'MD'" — CONFIRMED
- File contains "d.district_type = 'NATIONAL_LOWER'" — CONFIRMED
- File contains "BETWEEN -2440008 AND -2440001" — CONFIRMED
- File begins with comment header and ends with COMMIT; — CONFIRMED
- SQL count MD House offices = 8 — CONFIRMED
- SQL office_id IS NULL = 0 — CONFIRMED
- SQL per-district gate (HAVING COUNT(*) <> 1) = 0 rows — CONFIRMED
- SQL pre-existing senator offices = 2 (NATIONAL_UPPER, MD) — CONFIRMED
- SQL idempotency re-apply: no errors, counts unchanged — CONFIRMED
- STATE.md Next migration = 276 — CONFIRMED
