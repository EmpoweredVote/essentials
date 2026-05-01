---
phase: 12-tx-db-foundation
plan: 04
subsystem: database
tags: [postgres, supabase, migration, collin-county, texas, governments, chambers, offices]

requires:
  - phase: 12-01
    provides: geo_id column on essentials.governments, TX state row, Collin County row

provides:
  - 15 Tier 3-4 Collin County city/town government rows with Census GEOIDs
  - 15 city council / town council chamber rows
  - 97 office rows (Mayor + council member positions per city)
  - Princeton seeded with 8 seats (Mayor + Place 1-7, confirmed from research)
  - Fairview seeded as Town with Town Council and Seat N naming

affects:
  - 12-05 (if any — future TX office/race seeding plans)
  - Phase 16 (Discovery Jurisdiction Setup — depends on government rows)
  - Phase 13 (TX Races) — needs these government rows to link races

tech-stack:
  added: []
  patterns:
    - "DO $$ DECLARE v_gov_id UUID; v_chamber_id UUID; BEGIN ... END $$; pattern for atomic city seeding"
    - "slug is a generated column on essentials.chambers — never include in INSERT"
    - "partisan_type = NULL for all Texas municipal offices (nonpartisan elections)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/090_tx_tier34_cities.sql
  modified: []

key-decisions:
  - "Copeville (GEOID 4816600) excluded — may be unincorporated CDP; documented in migration header comment"
  - "Princeton has 8 seats (Mayor + Place 1-7), not 7 — verified from research"
  - "Fairview uses Seat N naming (not Place N) and Town Council (not City Council)"
  - "slug column on essentials.chambers is generated — do not include in INSERT (matched pattern from 088/089)"
  - "Tier 4 small cities (Weston, Lowry Crossing, Josephine, Blue Ridge) seeded with 5 seats (Mayor + Place 1-4)"

patterns-established:
  - "Generated columns (slug) must be omitted from INSERT — inherited from migration 089 pattern"
  - "All TX municipal offices: partisan_type = NULL, is_appointed_position = false"
  - "city = NULL on government rows for municipalities (geo_id + name carries location)"

duration: ~25min
completed: 2026-04-30
---

# Phase 12 Plan 04: TX Tier 3-4 Cities Summary

**Migration 090 seeds 15 Collin County Tier 3-4 city/town governments, chambers, and 97 total offices via DO $$ blocks — Princeton with 8 seats, Fairview as a Town, Copeville excluded with explanatory comment**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-04-30T00:00:00Z
- **Completed:** 2026-04-30
- **Tasks:** 2
- **Files modified:** 1 (migration created + corrected)

## Accomplishments

- 15 Tier 3-4 Collin County cities/towns seeded: Anna, Melissa, Princeton, Lucas, Lavon, Fairview, Van Alstyne, Farmersville (Tier 3) + Parker, Saint Paul, Nevada, Weston, Lowry Crossing, Josephine, Blue Ridge (Tier 4)
- Princeton correctly seeded with 8 total seats (Mayor + Council Member Place 1 through Place 7)
- Fairview correctly seeded as "Town of Fairview, Texas, US" with "Town Council" chamber and "Council Member Seat N" office titles
- All 97 office rows have partisan_type = NULL (Texas nonpartisan municipal elections)
- Copeville documented as excluded (potentially unincorporated CDP) in migration header
- Migration applied successfully to production Supabase via `supabase db query --linked`

## Task Commits

1. **Task 1: Write migration 090** - `ac12b7c` (feat — initial file with slug in chambers INSERT)
2. **Task 1 fix: Remove slug from chambers INSERT** - `4d78afa` (fix — slug is generated column)

**Plan metadata:** (see docs commit below)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/090_tx_tier34_cities.sql` - 15 DO $$ blocks seeding Tier 3-4 city governments, chambers, and offices

## Decisions Made

- Copeville excluded from seeding — Census GEOID 4816600 may refer to a Census-designated place (CDP) rather than an incorporated municipality. Documented in migration header. A follow-up migration can add it if confirmed incorporated.
- Princeton has 8 seats per research confirmation (Mayor + Place 1-7). The plan specifies 8; this was honored precisely.
- Fairview uses "Seat N" naming convention (not "Place N") and "Town Council" per its legal status as a Town.
- Tier 4 smallest cities (Weston, Lowry Crossing, Josephine, Blue Ridge) seeded with 5 seats based on research; Parker, Saint Paul, Nevada seeded with 6.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] slug is a generated column — removed from all chamber INSERTs**

- **Found during:** Task 2 (Apply migration 090)
- **Issue:** Initial migration file included `slug` in the `INSERT INTO essentials.chambers` column list and values. PostgreSQL rejected this with error `ERROR: 428C9: cannot insert a non-DEFAULT value into column "slug" — Column "slug" is a generated column.`
- **Fix:** Rewrote all 15 chamber INSERT statements to omit `slug` from the column list and values, matching the pattern established in migrations 088 and 089. Added a header comment: "slug is a generated column — do not include in INSERT statements."
- **Files modified:** `C:/EV-Accounts/backend/migrations/090_tx_tier34_cities.sql`
- **Verification:** Migration applied successfully via `supabase db query --linked`; all 15 rows returned in verification query
- **Committed in:** `4d78afa` (fix commit after initial feat commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required to apply the migration at all. No scope changes. Pattern documented in migration header and this summary for future migrations.

## Issues Encountered

- Supabase connection pooler (`aws-0-us-west-1.pooler.supabase.com:5432`) returned "Max client connections reached" consistently — could not connect via psql or Node.js pg client. Applied migration via `supabase db query --linked` which uses the Supabase Management API instead of direct pooler. This approach works reliably and is preferred for migration application going forward.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 15 Tier 3-4 Collin County cities have complete government → chamber → offices chains
- Tier 1, 2, 3, and 4 cities are all seeded (Phase 12 plans 02-04 complete)
- Phase 12-05 (TX state legislature offices) or Phase 13 (TX races) can proceed
- Phase 16 (Discovery Jurisdiction Setup) can now reference all Collin County governments

---
*Phase: 12-tx-db-foundation*
*Completed: 2026-04-30*
