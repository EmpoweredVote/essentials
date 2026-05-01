---
phase: 12-tx-db-foundation
plan: 03
subsystem: database
tags: [postgres, supabase, migrations, tx-cities, essentials-schema]

# Dependency graph
requires:
  - phase: 12-01
    provides: geo_id column on essentials.governments + TX state and Collin County rows
provides:
  - Murphy city government, City Council chamber, 7 offices (Mayor + Places 1-6)
  - Celina city government, City Council chamber, 7 offices (Mayor + Places 1-6)
  - Prosper town government (Town of Prosper), Town Council chamber, 7 offices (Mayor + Places 1-6)
  - Richardson city government, City Council chamber, 7 offices (Mayor + Districts 1-4 + Places 5-6)
affects:
  - 12-04 (Tier 3 cities — same pattern)
  - 16 (Discovery Jurisdiction Setup — needs these government rows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TX city migration pattern: BEGIN + 4 DO $$ blocks (one per city) + COMMIT"
    - "slug is a generated column on essentials.chambers — never include in INSERT"
    - "partisan_type = NULL (not string) for all nonpartisan TX municipal offices"
    - "Prosper is legally a Town — government name and chamber name use 'Town' not 'City'"
    - "Richardson mixed structure: single-member districts + at-large places in one chamber"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/089_tx_tier2_cities.sql
  modified: []

key-decisions:
  - "Removed slug from chamber INSERT — it is a ALWAYS GENERATED column derived from name_formal"
  - "Prosper named 'Town of Prosper, Texas, US' with 'Town Council' (legally a Town, not a City)"
  - "Richardson offices: Mayor + Council Member District 1-4 + Council Member Place 5-6"

patterns-established:
  - "Pattern: slug generated column — all future chamber migrations must omit slug from INSERT"
  - "Pattern: partisan_type = NULL literal (not string 'nonpartisan') for TX nonpartisan cities"

# Metrics
duration: 6min
completed: 2026-05-01
---

# Phase 12 Plan 03: Tier 2 TX Cities Summary

**Migration 089 applied: Murphy, Celina, Prosper (Town), and Richardson seeded with 4 governments, 4 chambers, and 28 offices in essentials schema**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-01T06:06:24Z
- **Completed:** 2026-05-01T06:12:34Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Migration 089 written and applied to Supabase — 4 city/town governments, 4 chambers, 28 offices
- Prosper correctly named 'Town of Prosper, Texas, US' with 'Town Council' chamber
- Richardson mixed seat structure seeded: Mayor + Districts 1-4 (single-member) + Places 5-6 (at-large)
- All 28 offices have partisan_type = NULL (correctly nonpartisan)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 089 — Tier 2 city governments, chambers, offices** - `8d5b2c3` (feat)
2. **Task 2: Apply migration 089 and verify all Tier 2 structures** - `b5e1faf` (feat)

**Plan metadata:** see docs commit below

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/089_tx_tier2_cities.sql` - Tier 2 TX city seed migration (Murphy, Celina, Prosper, Richardson)

## Decisions Made

- Removed `slug` from all chamber INSERT statements — the column is `ALWAYS GENERATED` from `name_formal` via regex transformation; inserting it directly throws ERROR 428C9
- Prosper named 'Town of Prosper, Texas, US' — per plan specification (legally a Town)
- Richardson uses a mixed office structure per plan: Districts 1-4 + at-large Places 5-6

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed generated column slug from chamber INSERTs**

- **Found during:** Task 2 (Apply migration 089)
- **Issue:** Migration 088 pattern included `slug` in chamber INSERT column list. The `slug` column on `essentials.chambers` is `ALWAYS GENERATED` from `name_formal`. Attempting to INSERT a non-DEFAULT value raises ERROR 428C9.
- **Fix:** Removed `slug` from the INSERT column list in all four DO $$ blocks. Slug auto-generates from `name_formal` (e.g., 'Murphy City Council' → 'murphy-city-council').
- **Files modified:** C:/EV-Accounts/backend/migrations/089_tx_tier2_cities.sql
- **Verification:** Migration applied successfully, all 4 rows confirmed in DB
- **Committed in:** b5e1faf (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential fix — migration would have failed without it. The same fix is needed for migration 088 (Tier 1 cities) when it is applied.

## Issues Encountered

- Migration 088 (Tier 1 cities) also has the slug-in-INSERT bug and has not been applied. This does not block plan 12-03 but should be fixed before applying 088.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Migration 089 is live. Tier 2 structure complete in Supabase.
- Migration 088 (Tier 1 cities) needs the same slug fix before it can be applied — it was committed but not yet applied.
- Plan 12-04 (Tier 3 cities) can proceed using the corrected pattern (no slug in chamber INSERT).
- All 4 Tier 2 government rows are ready for Phase 16 (Discovery Jurisdiction Setup).

---
*Phase: 12-tx-db-foundation*
*Completed: 2026-05-01*
