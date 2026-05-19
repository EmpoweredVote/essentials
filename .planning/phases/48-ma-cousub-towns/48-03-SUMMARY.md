---
phase: 48-ma-cousub-towns
plan: "03"
subsystem: database
tags: [postgresql, migration, districts, offices, cambridge, geofence, address-lookup]

# Dependency graph
requires:
  - phase: 48-02
    provides: MA COUSUB town boundaries loaded via PostGIS; Cambridge geofence G4110 present
  - phase: 41-cambridge-city-structure
    provides: Cambridge offices seeded (17 offices across City Council + School Committee chambers)
provides:
  - Migration 167 applied: Cambridge district row (geo_id=2511000, G4110, LOCAL, MA) inserted
  - All 17 Cambridge offices point at correct G4110/MA district
  - Address-based representative lookup for Cambridge now returns local officials
affects: [address-lookup, getRepresentativesByAddress, cambridge, representatives-me]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "District back-fill pattern: INSERT WHERE NOT EXISTS + UPDATE unconditionally to correct legacy pointers"
    - "Verification DO block: raise exception to roll back entire transaction on any gate failure"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/167_cambridge_offices_district_id.sql
  modified: []

key-decisions:
  - "UPDATE must be unconditional (not AND district_id IS NULL) — offices had district_id set to legacy rows with no mtfcc; NULL guard silently no-ops"
  - "Root cause was mtfcc mismatch: legacy districts had mtfcc='' but geofence is G4110; getRepresentativesByAddress joins on geo_id+mtfcc"
  - "Migration 167 uses IS DISTINCT FROM subquery as idempotency guard (re-run safe, updates only offices not already pointing at correct district)"

patterns-established:
  - "When Cambridge offices silently drop from address lookup: check district mtfcc matches geofence_boundaries.mtfcc — not just geo_id"
  - "essentials.districts has NO unique constraint on geo_id — always WHERE NOT EXISTS for INSERT idempotency"

# Metrics
duration: 15min
completed: 2026-05-18
---

# Phase 48 Plan 03: Cambridge district_id back-fill Summary

**Migration 167 inserts Cambridge G4110/MA district row and re-points 17 Cambridge offices to it, restoring address-based representative lookup for Cambridge residents**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-18T (continuation from rate-limited session)
- **Completed:** 2026-05-18
- **Tasks:** 2
- **Files modified:** 1 (migration 167)

## Accomplishments

- Diagnosed root cause: Cambridge offices pointed at legacy district rows (mtfcc='', state='25') that don't match the G4110 geofence; getRepresentativesByAddress joins on geo_id+mtfcc so all 17 offices were silently dropped
- Inserted one Cambridge district row (geo_id='2511000', mtfcc='G4110', district_type='LOCAL', state='MA') via WHERE NOT EXISTS guard
- Updated all 17 Cambridge offices (City Council + School Committee) to point at the correct G4110/MA district
- Verified spot-check JOIN through districts returns all 17 offices linked to Cambridge G4110 district

## Task Commits

1. **Task 1: Write migration 167** - previous session (file existed, DB partially applied)
2. **Task 2: Apply migration 167 and verify** - `922460b` (fix) — re-pointed all 17 offices to correct district; committed to backend repo

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/167_cambridge_offices_district_id.sql` — Data-only migration: INSERT Cambridge district (G4110/MA) + UPDATE 17 Cambridge offices with correct district_id; DO $$ verification block with 3 gates

## Decisions Made

- UPDATE must not filter `AND district_id IS NULL` — offices already had district_id set to legacy rows; the NULL guard caused the UPDATE to silently no-op. Updated migration to use `IS DISTINCT FROM (SELECT id FROM districts WHERE geo_id='2511000' AND mtfcc='G4110' AND state='MA')` for correct idempotency.
- Verification gate 3 in the DO block now checks that offices JOIN to the correct G4110/MA district (not just that district_id IS NOT NULL).
- Discovered 3 district rows exist for geo_id='2511000': one with G4110/MA (correct), two legacy rows with no mtfcc/state='25'. The legacy rows remain (no cleanup) — the offices now point at the correct one.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] UPDATE silently no-oped because offices already had district_id set to legacy rows**

- **Found during:** Task 2 (Apply migration 167 and verify)
- **Issue:** Migration 167 as written had `AND district_id IS NULL`. The 17 Cambridge offices already had district_id set to two legacy district rows (mtfcc='', state='25'). These legacy rows don't match the G4110 geofence so offices still dropped from address lookup. The migration applied with `UPDATE 17` count but pointed at wrong legacy district, not the newly inserted G4110/MA row.
- **Fix:** Ran direct UPDATE to point all 17 offices at the correct G4110/MA district. Rewrote migration 167 to remove `IS NULL` guard and use `IS DISTINCT FROM` idempotency instead — unconditionally points all Cambridge chamber offices at the correct district.
- **Files modified:** C:/EV-Accounts/backend/migrations/167_cambridge_offices_district_id.sql
- **Verification:** Spot-check JOIN returns 17 rows; all with mtfcc='G4110', state='MA'
- **Committed in:** 922460b

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required fix for correctness — the original migration would have committed a no-op UPDATE leaving Cambridge officials still absent from address lookup.

## Issues Encountered

- Previous session hit rate limit mid-execution; migration file was written and DB was partially modified (district row inserted, offices updated to point at wrong district via the IS NULL guard). Continuation session diagnosed and corrected.

## User Setup Required

None — data-only migration applied directly to production DB via psql. Backend repo committed but NOT pushed. User triggers Render redeploy when ready.

## Next Phase Readiness

- Cambridge address-based lookup is now fixed: a Cambridge address search should return City Councillors + School Committee members alongside state/federal officials
- Phase 48 (48-ma-cousub-towns) is complete: 3/3 plans done
  - 48-01: COUSUB loader + 293 MA town boundaries
  - 48-02: Verification gates for COUSUB import
  - 48-03: Cambridge district_id back-fill (this plan)
- Next: User confirms UAT passing (Cambridge address search returns local reps); user pushes backend repo to Render when ready to redeploy

---
*Phase: 48-ma-cousub-towns*
*Completed: 2026-05-18*
