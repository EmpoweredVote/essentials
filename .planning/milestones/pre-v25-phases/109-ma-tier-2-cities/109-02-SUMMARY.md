---
phase: 109-ma-tier-2-cities
plan: 02
subsystem: database
tags: [postgres, supabase, migration, springfield, ma-tier2, local-government]

# Dependency graph
requires:
  - phase: 107-ma-town-geofences
    provides: "58 MA G4110 geofences including Springfield geo_id=2567000"
provides:
  - "City of Springfield, Massachusetts, US government row (type=LOCAL, geo_id=2567000)"
  - "Springfield City Council chamber (name_formal='Springfield City Council')"
  - "LOCAL_EXEC district for Mayor Sarno (label='Springfield (Citywide)')"
  - "LOCAL district for 13 councillors (label='Springfield')"
  - "14 politician rows: Mayor Sarno + 8 ward + 5 at-large councillors (external_id -256700001..-256700014)"
  - "14 office rows with correct titles (ward seats use 'City Councilor (Ward N)'; at-large use 'City Councilor')"
  - "office_id back-fill complete — 0 NULL office_ids"
  - "Springfield geo_id 2567000 no longer a section-split orphan"
affects:
  - 109-03 (Lowell — next wave-1 city)
  - 109-04 (Brockton)
  - 109-05 (Quincy)
  - 109-06 (headshots — needs politician_ids for -256700001..-256700014)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tier 2 MA city seeding: single LOCAL_EXEC + single LOCAL district; ward/at-large distinction in office title only"
    - "Ward seat title format: 'City Councilor (Ward N)' (not 'District' — Springfield-specific)"
    - "Procedural title not stored: Fenton's 'Council President' role not a separate office (Pitfall 7 compliance)"
    - "Compound last name: last_name='Click-Bruce', first_name='Lavar' for hyphenated surnames"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/352_springfield_government.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-352.ts"
  modified: []

key-decisions:
  - "Springfield uses 'Ward' not 'District' for geographic council seats — office titles are 'City Councilor (Ward N)'"
  - "Fenton (-256700002) stored as title='City Councilor (Ward 2)' — procedural 'Council President' role not a DB office (Pitfall 7)"
  - "All 14 officials share 2 districts (1 LOCAL_EXEC for Mayor, 1 LOCAL for all 13 councillors) — no per-ward geofences for Tier 2"

patterns-established:
  - "Tier 2 MA city migration: identical structure to migration 351 (Worcester); only gov name / geo_id / external_ids / official names differ"
  - "Section-split orphan count decrements by 1 per city migration (55 after Springfield applied)"

requirements-completed: [MA-TIER2-02]

# Metrics
duration: 25min
completed: 2026-06-10
---

# Phase 109 Plan 02: Springfield Government Summary

**Mayor Sarno + 13 Springfield City Councillors seeded via migration 352 — geo_id 2567000 no longer a section-split orphan, 0 NULL office_ids**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-10T21:52:00Z
- **Completed:** 2026-06-10T22:17:52Z
- **Tasks:** 3
- **Files modified:** 2 (1 migration SQL + 1 apply harness TS)

## Accomplishments

- Migration 352 written with 14 politician+office WITH ins_p blocks, 7-gate post-verification DO block, and ledger entry
- Fenton (-256700002) correctly stored as 'City Councilor (Ward 2)' (not 'Council President') per Pitfall 7
- Migration applied to production via pg Pool (DATABASE_URL); all 7 post-verification gates passed with NOTICE output
- Springfield geo_id '2567000' removed from MA G4110 section-split orphan set (55 remaining orphans after apply)

## Task Commits

Tasks 1-3 delivered the following artifacts (migration + apply harness files are in C:/EV-Accounts which is not a git repo; planning documentation committed here):

1. **Task 1: Write migration 352** — `352_springfield_government.sql` created with 14 officials, 2 districts, 7-gate post-verification
2. **Task 2: Write apply harness** — `_apply-migration-352.ts` with 5 smoke tests (gov count, politician count, district count, NULL office_id, ledger)
3. **Task 3: Apply migration to production** — Applied via pg Pool against DATABASE_URL; all smoke tests passed; section-split verified

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/352_springfield_government.sql` — Full Springfield government migration: 3 pre-flights, government + chamber + 2 districts, 14 politician+office WITH ins_p blocks, office_id back-fill UPDATE, 7-gate post-verification DO block, ledger INSERT
- `C:/EV-Accounts/backend/scripts/_apply-migration-352.ts` — Apply harness with 5 smoke tests; fallback to pg Pool; references DATABASE_URL from env

## Decisions Made

- Title encoding: Springfield uses 'Ward' not 'District' for geographic seats (Worcester uses 'District') — different MA city convention
- Procedural title omission: Fenton ('Council President') and Whitfield ('at-large Council President') stored by ward/seat title only
- Compound last name: Click-Bruce stored as last_name='Click-Bruce', first_name='Lavar' (hyphen preserved)
- All 13 councillors share one LOCAL district (geo_id='2567000') — Tier 2 pattern; per-ward geofences deferred

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — all pre-flight gates passed (geo_id 2567000 G4110 geofence present; external_id range clear). Post-verification DO block raised NOTICE confirming all 7 gates: gov=1, chambers=1, districts=2, politicians=14, offices=14, split_orphans=0, null_office_ids=0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Springfield politicians (-256700001 through -256700014) are seeded and ready for headshot ingestion in plan 109-06
- geo_id 2567000 routing is live: a Springfield, MA address will now return a LOCAL section with Mayor Sarno + 13 councillors
- Wave 1 continues: plans 109-03 (Lowell), 109-04 (Brockton), 109-05 (Quincy) can execute in parallel

## Self-Check: PASSED

- Migration file exists: C:/EV-Accounts/backend/migrations/352_springfield_government.sql — FOUND
- Apply harness exists: C:/EV-Accounts/backend/scripts/_apply-migration-352.ts — FOUND
- 14 politicians in DB: SELECT COUNT(*) = 14 — CONFIRMED
- 0 NULL office_ids: SELECT COUNT(*) = 0 — CONFIRMED
- Fenton title = 'City Councilor (Ward 2)': CONFIRMED
- geo_id 2567000 not in orphan set: CONFIRMED (orphan_count = 55)
- Ledger version='352': PRESENT

---
*Phase: 109-ma-tier-2-cities*
*Completed: 2026-06-10*
