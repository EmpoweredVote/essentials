---
phase: 12-tx-db-foundation
plan: "02"
subsystem: database
tags: [postgres, supabase, migrations, sql, tx, local-government, seed-data]

# Dependency graph
requires:
  - phase: 12-01
    provides: geo_id column on essentials.governments + TX state and Collin County rows
provides:
  - Plano city government row (geo_id='4863000'), City Council chamber, 9 offices (Mayor + Place 1-8)
  - McKinney city government row (geo_id='4845744'), City Council chamber, 7 offices (Mayor + 2 at-large + 4 district)
  - Allen city government row (geo_id='4801924'), City Council chamber, 7 offices (Mayor + Place 1-6)
  - Frisco city government row (geo_id='4827684'), City Council chamber, 7 offices (Mayor + Place 1-6)
  - Migration 088 applied to production Supabase
affects:
  - 12-03 (Tier 2 cities — depends on same pattern)
  - 12-04 (Tier 3/4 cities)
  - Phase 13 (candidate seeding — offices are FK targets for races)
  - Phase 16 (discovery jurisdiction setup)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DO $$ DECLARE v_gov_id UUID; v_chamber_id UUID; BEGIN ... END $$; pattern for seeding relational chains"
    - "supabase db query --linked -f <file> for applying migrations to remote Supabase from CLI"
    - "slug on essentials.chambers is a GENERATED ALWAYS column — never insert explicitly"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/088_tx_tier1_cities.sql
  modified: []

key-decisions:
  - "partisan_type = NULL (not the string 'nonpartisan') for all TX municipal offices — TX is nonpartisan by law"
  - "slug excluded from chambers INSERT — it is a GENERATED ALWAYS column derived from name_formal"
  - "Applied via supabase db query --linked (psql pooler unreachable from this machine, Docker unavailable)"

patterns-established:
  - "One DO $$ block per city — keeps each city's government/chamber/offices transactionally atomic within the larger BEGIN/COMMIT"
  - "official_count on chamber must equal exact seat count (Mayor + all council seats)"

# Metrics
duration: 19min
completed: 2026-05-01
---

# Phase 12 Plan 02: Tier 1 Cities Summary

**Migration 088 seeds Plano, McKinney, Allen, and Frisco with government + City Council chamber + 30 total offices (all nonpartisan) into essentials schema**

## Performance

- **Duration:** 19 min
- **Started:** 2026-05-01T06:05:36Z
- **Completed:** 2026-05-01T06:24:33Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Written and applied migration 088: 4 city governments, 4 City Council chambers, 30 offices
- Plano: 9 offices (Mayor + Place 1-8), official_count=9
- McKinney: 7 offices (Mayor + At-Large Place 1-2 + District 1-4), official_count=7
- Allen: 7 offices (Mayor + Place 1-6), official_count=7
- Frisco: 7 offices (Mayor + Place 1-6), official_count=7
- All 30 offices verified: partisan_type = NULL (COUNT(*) WHERE partisan_type IS NOT NULL = 0)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 088** - `2280d76` (feat)
2. **Task 2: Apply migration 088 and verify** - `9e77929` (fix — schema correction during apply)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/088_tx_tier1_cities.sql` — Migration seeding all 4 Tier 1 Collin County cities

## Decisions Made

- `partisan_type = NULL` for all offices (not the string 'nonpartisan') — TX cities are legally nonpartisan; NULL is the correct representation per schema design
- `slug` column excluded from chambers INSERT — discovered during apply that `slug` is a `GENERATED ALWAYS` column derived from `name_formal` via a slugify expression; explicit insertion is forbidden by Postgres
- Used `supabase db query --linked` CLI method for applying — psql pooler was unreachable (max connections / network) and Docker not running; Supabase CLI with linked project was the reliable path

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed slug from chambers INSERT — slug is a generated column**

- **Found during:** Task 2 (Apply migration 088)
- **Issue:** Migration included `slug` in the INSERT column list for `essentials.chambers`. The actual schema has `slug` as a `GENERATED ALWAYS` column (`btrim(regexp_replace(translate(...)))` from `name_formal`). Postgres error: "cannot insert a non-DEFAULT value into column 'slug'"
- **Fix:** Removed `slug` from all 4 chamber INSERT statements. The slug auto-generates from `name_formal` (e.g. 'Plano City Council' → 'plano-city-council')
- **Files modified:** `C:/EV-Accounts/backend/migrations/088_tx_tier1_cities.sql`
- **Verification:** Migration applied cleanly, 4 rows returned with correct office counts
- **Committed in:** `9e77929` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — generated column)
**Impact on plan:** Necessary correction; slug values are identical to what the plan specified but auto-generated correctly. No data or scope impact.

## Issues Encountered

- psql connection to Supabase pooler failed (port 5432: "Max client connections reached"; port 6543: timeout). Resolved by using `supabase db query --linked -f <file>` CLI method which goes through the Supabase Management API. This is the reliable approach for this machine going forward.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 Tier 1 city government → chamber → offices chains are in place
- Pattern established for Tier 2 (12-03) and Tier 3/4 (12-04) plans
- Key learning: `slug` is auto-generated on chambers — do not include in INSERT for future plans (12-03, 12-04)
- Key learning: Use `supabase db query --linked -f <file>` for all future migration applies on this machine

---
*Phase: 12-tx-db-foundation*
*Completed: 2026-05-01*
