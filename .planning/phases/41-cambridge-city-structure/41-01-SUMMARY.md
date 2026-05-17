---
phase: 41-cambridge-city-structure
plan: 01
subsystem: database
tags: [postgres, migration, cambridge, governments, chambers, stv, election-method]

# Dependency graph
requires:
  - phase: 40-ma-executives-federal
    provides: migrations 154-156 applied; next migration is 157
  - phase: 39-ma-government-db
    provides: MA government + legislative chambers pattern
provides:
  - Cambridge LOCAL government row (geo_id=2511000, state=MA)
  - City Council chamber (9 seats, stv_proportional)
  - School Committee chamber (6 seats, stv_proportional)
  - election_method TEXT column on essentials.chambers
affects:
  - 41-02 (Cambridge offices — migration 158 looks up chambers by name + government_id)
  - 41-03 (Cambridge politicians — office seeds anchor to chambers created here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WHERE NOT EXISTS guard for government inserts (no unique constraint on geo_id)"
    - "DO block with RETURNING + fallback SELECT for idempotent UUID capture"
    - "ADD COLUMN IF NOT EXISTS runs before INSERTs to ensure column exists"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/157_cambridge_government_chambers.sql
  modified: []

key-decisions:
  - "essentials.governments has NO unique constraint on geo_id — WHERE NOT EXISTS required (ON CONFLICT (geo_id) would fail)"
  - "election_method TEXT column added to essentials.chambers — first usage is Cambridge STV elections"
  - "Cambridge slug auto-generated: cambridge-city-council / cambridge-school-committee — confirmed clean"

patterns-established:
  - "STV city pattern: official_count=9 (City Council) + official_count=6 (School Committee), both election_method=stv_proportional"
  - "Cambridge government UUID: 6f7d55bc-d50c-47ff-b521-5767d1f763fb"

# Metrics
duration: 2min
completed: 2026-05-17
---

# Phase 41 Plan 01: Cambridge City Structure Summary

**Cambridge LOCAL government row + City Council (9 seats) + School Committee (6 seats) seeded via migration 157; election_method column added to essentials.chambers**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-17T02:45:14Z
- **Completed:** 2026-05-17T02:47:03Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added `election_method TEXT` column to `essentials.chambers` (idempotent via `ADD COLUMN IF NOT EXISTS`)
- Seeded Cambridge, MA government row (`geo_id='2511000'`, `type='LOCAL'`, `state='MA'`) — the root anchor for all Cambridge offices and politicians
- Seeded City Council chamber (9 at-large seats, `election_method='stv_proportional'`)
- Seeded School Committee chamber (6 at-large seats, `election_method='stv_proportional'`)
- Verified idempotency: re-running migration produces government count=1, chamber count=2 (no duplication)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 157 — Cambridge government + chambers** - `7ca395c` (feat)
2. **Task 2: Verify idempotency and confirm DB state** - (no new files; verification only — included in plan metadata commit)

**Plan metadata:** (created in final commit below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/157_cambridge_government_chambers.sql` - Migration 157: Cambridge government + two chambers with election_method

## Key UUIDs (for migration 158 reference)

| Row | UUID |
|-----|------|
| Cambridge government | `6f7d55bc-d50c-47ff-b521-5767d1f763fb` |
| City Council chamber | `b4b8c0a1-2658-4df4-9196-9646c99d173c` |
| School Committee chamber | `41846a49-e5d5-460d-b2c2-0f4f8130b949` |

Slugs auto-generated: `cambridge-city-council` / `cambridge-school-committee`

## Decisions Made

- **WHERE NOT EXISTS pattern used** (not `ON CONFLICT (geo_id)`): The `essentials.governments` table has no unique constraint on `geo_id` — only a primary key on `id`. Using `ON CONFLICT (geo_id)` would have caused a syntax error. The `WHERE NOT EXISTS` + fallback `SELECT` pattern inside a `DO` block achieves safe idempotency.
- **election_method TEXT column added here**: First use of this column is Cambridge STV elections. `ADD COLUMN IF NOT EXISTS` ensures migration is safe to re-run.
- **No slug in INSERT**: `slug` is `GENERATED ALWAYS` on `essentials.chambers` — including it would cause a fatal error. Slugs generated automatically from `name_formal`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced ON CONFLICT (geo_id) with WHERE NOT EXISTS**
- **Found during:** Task 1 — schema inspection before writing migration
- **Issue:** The plan's primary SQL template used `ON CONFLICT (geo_id) DO NOTHING` but `essentials.governments` has no unique constraint on `geo_id` (only a PK on `id`) — this syntax would fail at runtime
- **Fix:** Used `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '2511000')` + fallback SELECT in the DO block (the plan's alternative pattern, explicitly provided as the fallback)
- **Files modified:** `157_cambridge_government_chambers.sql`
- **Verification:** Migration applied without errors; government count=1 on re-run
- **Committed in:** `7ca395c` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — schema verification caught before runtime failure)
**Impact on plan:** Necessary correction; the plan explicitly provided the WHERE NOT EXISTS alternative. No scope creep.

## Issues Encountered

None beyond the schema verification catch documented above.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- CAMB-01, CAMB-02, CAMB-03 all satisfied
- `election_method` column live on `essentials.chambers` — migration 158 can use it immediately
- Migration 158 should look up Cambridge chambers by `name + government_id` (not by UUID hardcoding, though UUIDs are recorded above for debugging)
- Next migration is 158

---
*Phase: 41-cambridge-city-structure*
*Completed: 2026-05-17*
