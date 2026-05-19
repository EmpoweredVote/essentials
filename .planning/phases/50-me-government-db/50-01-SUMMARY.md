---
phase: 50-me-government-db
plan: 01
subsystem: database
tags: [postgres, migration, supabase, maine, governments, chambers]

# Dependency graph
requires:
  - phase: 49-me-geofences
    provides: Maine TIGER boundaries loaded; geo_id='23' verified in geofence_boundaries
provides:
  - State of Maine government row (essentials.governments, id=da88de8b-9afa-4d87-86d5-7eb83c3e9792)
  - 6 chamber scaffolds: Maine Senate, Maine House of Representatives, Maine Governor, Maine Attorney General, Maine Secretary of State, Maine Treasurer
  - Migration 168 applied and verified idempotent
affects:
  - 51-me-executives-federal (needs Maine government_id and specific chamber_ids)
  - 52-me-state-legislature (needs Maine Senate and House chamber_ids)
  - 53-portland-city-structure (needs government_id for city chamber creation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WHERE NOT EXISTS guard on governments by name (not geo_id) — no unique constraint on geo_id"
    - "GENERATED ALWAYS slug on chambers — never include in INSERT column list"
    - "government_id via subquery SELECT id FROM governments WHERE name='State of Maine'"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/168_me_government_chambers.sql
  modified: []

key-decisions:
  - "geo_id='23' for State of Maine (Maine FIPS state code)"
  - "state='ME' uppercase in governments (consistent with TX='TX', MA='MA')"
  - "6 chambers total: 2 legislative + 4 executive (AG, SoS, Treasurer are legislature-elected — is_appointed_position=true handled in Phase 51)"
  - "Maine government UUID: da88de8b-9afa-4d87-86d5-7eb83c3e9792 — Phase 51 will reference this"
  - "Next migration is 169"

patterns-established:
  - "State government migration pattern: 1 government row + N chambers in single idempotent migration"

# Metrics
duration: 3min
completed: 2026-05-18
---

# Phase 50 Plan 01: ME Government DB Foundation Summary

**Migration 168 seeds State of Maine government row (geo_id='23') and 6 chamber scaffolds (2 legislative + 4 executive) with auto-generated slugs via GENERATED ALWAYS**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-19T06:14:37Z
- **Completed:** 2026-05-19T06:17:41Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Migration 168 written with all 7 idempotent INSERT statements (1 government + 6 chambers), no slug in any INSERT
- Applied successfully: State of Maine government row inserted with state='ME', geo_id='23', type='STATE'
- All 6 chamber slugs auto-generated: maine-attorney-general, maine-governor, maine-house-of-representatives, maine-secretary-of-state, maine-senate, maine-treasurer
- Idempotency confirmed: re-run produced INSERT 0 0 for all 7 statements, no errors, no duplicates

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 168 SQL** - `b086eba` (feat)
2. **Task 2: Apply migration and verify** - DB-only operation (no new files; verified via psql queries)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/168_me_government_chambers.sql` — Migration 168: State of Maine government row + 6 chamber scaffolds; all idempotent via WHERE NOT EXISTS

## Decisions Made

- Maine government UUID is `da88de8b-9afa-4d87-86d5-7eb83c3e9792` — Phase 51 migrations must reference this by name subquery, not hardcoded UUID
- Phase 50 is chambers ONLY — no politicians, offices, or districts (those are Phases 51-52)
- Maine AG, Secretary of State, and Treasurer are legislature-elected (is_appointed_position=true) — that flag will be set in Phase 51, not here
- Next migration is 169

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

SC4 null-slug query had an ambiguous column reference (`name` without table qualifier in the JOIN). Fixed inline by qualifying as `c.name` — not a schema issue, just SQL precision in verification query. The actual migration and all success criteria were unaffected.

## User Setup Required

None - no external service configuration required.

## Chambers Reference (for Phases 51-52)

| Chamber Name | Slug | Use |
|---|---|---|
| Maine Senate | maine-senate | Phase 52: 35 STATE_UPPER offices |
| Maine House of Representatives | maine-house-of-representatives | Phase 52: 151 STATE_LOWER offices |
| Maine Governor | maine-governor | Phase 51: Governor Janet Mills |
| Maine Attorney General | maine-attorney-general | Phase 51: is_appointed_position=true |
| Maine Secretary of State | maine-secretary-of-state | Phase 51: is_appointed_position=true |
| Maine Treasurer | maine-treasurer | Phase 51: is_appointed_position=true |

## Next Phase Readiness

Phase 51 (ME Executives + Federal Officials + Headshots) can now proceed:
- government_id subquery pattern: `SELECT id FROM essentials.governments WHERE name = 'State of Maine'`
- Chamber lookup pattern: `SELECT id FROM essentials.chambers WHERE name = 'Maine Governor' AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Maine')`
- Maine government UUID (for reference only, never hardcode): `da88de8b-9afa-4d87-86d5-7eb83c3e9792`
- Next migration: 169

Phase 52 (ME State Legislature) can also proceed in parallel with Phase 51 — both depend only on Phase 50.

---
*Phase: 50-me-government-db*
*Completed: 2026-05-18*
