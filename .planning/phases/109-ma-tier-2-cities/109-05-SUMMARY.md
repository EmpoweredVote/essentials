---
phase: 109-ma-tier-2-cities
plan: "05"
subsystem: database/seed
tags: [quincy, ma-tier2, local-government, migration]
dependency_graph:
  requires: [MA TIGER geofences (geo_id=2555745 loaded v5.0), migration 350]
  provides: [City of Quincy government, 10 Quincy officials, geo_id=2555745 removed from MA G4110 orphan set]
  affects: [essentials.governments, essentials.chambers, essentials.districts, essentials.offices, essentials.politicians]
tech_stack:
  added: []
  patterns: [7-step migration pattern (pre-flight + steps 1-5 + post-verification + ledger), WITH ins_p CTE pattern, WHERE NOT EXISTS idempotency guards]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/355_quincy_government.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-355.ts
  modified: []
decisions:
  - "Comment referencing stale members omits exact names to avoid false-positive grep in verify script; references 'stale 2024 roster' instead"
  - "Ziqiang Yuan stored as full_name='Ziqiang Yuan' (formal name); goes by 'Susan' per A6"
  - "Anne Mahoney Council President title stored as 'City Councilor' per A1 procedural title rule"
  - "Single LOCAL district for all 9 councillors (no per-ward geofences for Quincy)"
metrics:
  duration: "~20 minutes"
  completed: "2026-06-10"
  tasks_completed: 3
  files_created: 2
---

# Phase 109 Plan 05: Quincy Government Seed Summary

**One-liner:** Quincy Mayor-Council structure seeded (10 officials: Mayor Koch + 3 at-large + 6 ward councillors, Jan 2026 roster) with geo_id=2555745 removed from MA G4110 orphan set.

## Tasks Completed

| Task | Name | Result |
|------|------|--------|
| 1 | Write migration 355 — Quincy government | DONE — 355_quincy_government.sql created |
| 2 | Write apply harness _apply-migration-355.ts | DONE — harness with 5 smoke tests |
| 3 | Apply migration 355 to production via Supabase MCP | DONE — all 7 gates + 5 smoke tests passed |

## What Was Built

Migration 355 seeds the City of Quincy, Massachusetts with the current January 2026 roster:

**Government structure:**
- 1 government row: `City of Quincy, Massachusetts, US` (type=LOCAL, state=MA, geo_id=2555745)
- 1 chamber: `Quincy City Council`
- 2 districts: LOCAL_EXEC (geo_id=2555745, Quincy Citywide) + LOCAL (geo_id=2555745, Quincy)
- 10 offices + 10 politicians, all with non-NULL office_id

**Officials seeded (Jan 2026 roster):**
| external_id | Name | Title |
|-------------|------|-------|
| -255574501 | Thomas P. Koch | Mayor |
| -255574502 | David Jacobs | City Councilor (Ward 1) |
| -255574503 | Richard Ash | City Councilor (Ward 2) |
| -255574504 | Walter Hubley | City Councilor (Ward 3) |
| -255574505 | Virginia Ryan | City Councilor (Ward 4) |
| -255574506 | Maggie McKee | City Councilor (Ward 5) |
| -255574507 | Deborah Riley | City Councilor (Ward 6) |
| -255574508 | Noel DiBona | City Councilor |
| -255574509 | Anne Mahoney | City Councilor |
| -255574510 | Ziqiang Yuan | City Councilor |

**Section-split result:**
- geo_id=2555745 orphan count: 0 (previously 1, now resolved)
- Total MA G4110 orphan count: 51 (down from 56 pre-Phase-109; all 5 wave-1 cities applied)

## Verification Results

All post-verification gates (7) and smoke tests (5) passed:
- Gate (a): 1 Quincy government row PASSED
- Gate (b): 1 City Council chamber PASSED
- Gate (c): 2 district rows (LOCAL_EXEC + LOCAL) PASSED
- Gate (d): 10 politicians in range PASSED
- Gate (e): 10 offices linked to Quincy districts PASSED
- Gate (f): 0 section-split orphans for geo_id=2555745 PASSED
- Gate (g): 0 NULL office_ids PASSED
- Ledger version='355' PRESENT
- Total MA G4110 orphan count: 51 (expected when all 5 Phase 109 cities applied)

## Deviations from Plan

**1. [Rule 1 - Bug] Header comment omits exact stale member names**

- **Found during:** Task 1 verification
- **Issue:** The plan's action says to add a comment noting "do NOT seed pre-2026 members (James Devine, William Harris, Anthony Andronico)" but the verify script greps for the absence of 'Devine' and 'Andronico' in the SQL file. Including their names in a comment would trigger the stale-member check as a false positive.
- **Fix:** Comment now reads "DO NOT seed pre-2026 council members (stale 2024 roster — replaced Jan 2026)" without naming them explicitly.
- **Files modified:** 355_quincy_government.sql
- **Impact:** None on data correctness; documentation intent preserved.

## Key Decisions Made

- Ziqiang Yuan stored with formal name `full_name='Ziqiang Yuan'`, `first_name='Ziqiang'`, `last_name='Yuan'` per A6 rule; "Susan" is a nickname only.
- Anne Mahoney's Council President title is procedural — office title stored as `'City Councilor'` per A1 rule.
- Single shared LOCAL district for all 9 councillors (no per-ward geofences in Quincy TIGER data).
- geo_id='2555745' non-round GEOID used as exact string throughout all queries.

## Known Stubs

None — all 10 Quincy officials are fully seeded with office_ids. Headshots are out of scope for this plan (covered by Plan 06: MA Tier 2 headshots).

## Threat Flags

No new threat surface beyond the plan's documented T-109-13 through T-109-15.

## Self-Check: PASSED

- C:/EV-Accounts/backend/migrations/355_quincy_government.sql — EXISTS
- C:/EV-Accounts/backend/scripts/_apply-migration-355.ts — EXISTS
- Migration 355 applied — CONFIRMED (Supabase MCP smoke tests passed)
- 10 politicians in range — CONFIRMED (count=10)
- 0 NULL office_ids — CONFIRMED
- Quincy geo_id=2555745 orphan count — CONFIRMED (0)
- MA G4110 total orphan count — CONFIRMED (51)
- Ledger 355 — CONFIRMED (PRESENT)
