---
phase: 73-or-government-db
plan: 01
subsystem: database
tags: [postgres, migration, supabase, oregon, governments, chambers]

# Dependency graph
requires:
  - phase: 72-portland-or
    provides: OR TIGER geofences loaded; State of Oregon governments row confirmed (geo_id='41')
provides:
  - 7 OR chamber scaffolds under State of Oregon government (geo_id='41')
  - Migration 222 applied and verified idempotent
  - State of Oregon UUID: 9110f6e1-8fbb-4628-b9ed-4c5026df4c6e
affects:
  - 74-or-executives-federal (needs Governor/AG/SoS/Treasurer/LaborCommissioner chamber_ids)
  - 75-or-state-legislature (needs Oregon Senate and Oregon House of Representatives chamber_ids)
  - 77-portland-city-structure (needs State of Oregon government_id for city creation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WHERE NOT EXISTS guard on chambers by (name + government_id subquery) — idempotent re-runs"
    - "GENERATED ALWAYS slug on chambers — never include in INSERT column list"
    - "government_id via subquery: SELECT id FROM essentials.governments WHERE name = 'State of Oregon'"
    - "CA short-name convention: name='Governor', name_formal='Governor of Oregon'"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql
  modified: []

key-decisions:
  - "State of Oregon UUID: 9110f6e1-8fbb-4628-b9ed-4c5026df4c6e (reference only — use name subquery, never hardcode)"
  - "Migration 222 is the applied number (CONTEXT.md listed 221 as next, but 221_sj_stances.sql landed first; 222 was first free slot)"
  - "Next migration is 223"
  - "CA short-name convention used: name='Governor' not 'Oregon Governor' (CA is most recent precedent per STATE.md)"
  - "All 7 chambers are voter-elected — is_appointed_position=false will be set on downstream offices in Phase 74"

patterns-established:
  - "OR chamber migration pattern: 7 chambers in single idempotent migration, no government row INSERT (pre-existing row)"

requirements-completed: []

# Metrics
duration: 8min
completed: 2026-05-28
---

# Phase 73 Plan 01: OR Government DB Foundation Summary

**Migration 222 seeds 7 Oregon chamber scaffolds (Governor, Oregon Senate, Oregon House of Representatives, Attorney General, Secretary of State, State Treasurer, Labor Commissioner) under the pre-existing State of Oregon government row (geo_id='41') using CA short-name convention and idempotent WHERE NOT EXISTS guards**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T00:00:00Z
- **Completed:** 2026-05-28T00:08:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Migration 222 written with all 7 idempotent INSERT statements; no government row INSERT; slug column excluded (GENERATED ALWAYS)
- Applied successfully: all 7 chamber rows inserted under State of Oregon government (geo_id='41')
- All 7 chamber slugs auto-generated and non-null (GENERATED ALWAYS confirmed)
- Idempotency confirmed: re-run produced INSERT 0 0 for all 7 statements, count gate still returned 7

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 222 SQL (7 OR chambers under State of Oregon)** - `5dc0e49` (feat, EV-Accounts repo)
2. **Task 2: Apply migration 222 and verify count gate + idempotency** - DB-only operation (no new files; verified via psql queries)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/222_or_government_chambers.sql` — Migration 222: 7 Oregon chamber scaffolds under State of Oregon; all 7 INSERTs idempotent via WHERE NOT EXISTS; no government row INSERT; no slug column; CA short-name convention

## State of Oregon Reference

- **Government UUID:** `9110f6e1-8fbb-4628-b9ed-4c5026df4c6e` (for reference — always use name subquery in migrations)
- **Government subquery:** `SELECT id FROM essentials.governments WHERE name = 'State of Oregon'`

## Chambers Reference (for Phases 74-77)

| Chamber Name | name_formal | Auto-generated Slug | Phase Use |
|---|---|---|---|
| Governor | Governor of Oregon | governor-of-oregon | Phase 74: Governor Tina Kotek |
| Attorney General | Attorney General of Oregon | attorney-general-of-oregon | Phase 74: AG Dan Rayfield |
| Secretary of State | Oregon Secretary of State | oregon-secretary-of-state | Phase 74: SoS LaVonne Griffin-Valade |
| State Treasurer | Oregon State Treasurer | oregon-state-treasurer | Phase 74: Treasurer Elizabeth Steiner |
| Labor Commissioner | Oregon Labor Commissioner | oregon-labor-commissioner | Phase 74: Christina Stephenson |
| Oregon Senate | Oregon Senate | oregon-senate | Phase 75: 30 STATE_UPPER offices |
| Oregon House of Representatives | Oregon House of Representatives | oregon-house-of-representatives | Phase 75: 60 STATE_LOWER offices |

**Chamber lookup pattern for Phase 74+:**
```sql
SELECT id FROM essentials.chambers
WHERE name = 'Governor'
  AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Oregon')
```

## Migration Number Note

CONTEXT.md (D-05) listed next migration as 221, but 221_sj_stances.sql landed before Phase 73 started. Migration 222 was used as the actual next free number (confirmed via directory listing). Next migration is 223.

## Decisions Made

- CA short-name convention for `name` column (e.g., 'Governor', not 'Oregon Governor') with state-qualified form in `name_formal` (e.g., 'Governor of Oregon') — CA is most recent precedent per STATE.md decision
- All 7 OR chambers are voter-elected (`is_appointed_position=false` on downstream offices in Phase 74+) — differs from ME where AG/SoS/Treasurer were legislature-elected (`is_appointed_position=true`)
- government_id resolved via name subquery; UUID never hardcoded in migration SQL

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 74 (OR Executives + Federal Officials) can now proceed:
- Government subquery: `SELECT id FROM essentials.governments WHERE name = 'State of Oregon'`
- Chamber lookup pattern: `SELECT id FROM essentials.chambers WHERE name = 'Governor' AND government_id = (SELECT id FROM essentials.governments WHERE name = 'State of Oregon')`
- State of Oregon UUID (for reference): `9110f6e1-8fbb-4628-b9ed-4c5026df4c6e`
- Next migration: 223

Phase 75 (OR State Legislature) can also proceed in parallel with Phase 74 — both depend only on Phase 73.

---
*Phase: 73-or-government-db*
*Completed: 2026-05-28*
