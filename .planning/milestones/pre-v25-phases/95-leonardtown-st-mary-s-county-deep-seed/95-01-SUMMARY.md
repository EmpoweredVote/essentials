---
phase: 95-leonardtown-st-mary-s-county-deep-seed
plan: 01
subsystem: database
tags: [md, local-government, county-seed, migration]
dependency_graph:
  requires: [phase-91-md-geofences]
  provides: [md-county-government, md-local-government, stmarys-districts, leonardtown-districts]
  affects: [address-routing, representatives-lookup, phase-95-02-headshots]
tech_stack:
  added: []
  patterns: [county-government-seed, local-government-seed, county-district, local-exec-district, local-district, post-verification-do-block]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql
    - C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-276.ts
    - C:/EV-Accounts/backend/scripts/_apply-migration-277.ts
  modified: []
decisions:
  - "D-05 confirmed Option A: all 5 St. Mary's commissioners share one COUNTY district (county-wide election model)"
  - "Leonardtown geo_id confirmed as 2446475 (not estimated 2443700)"
  - "Migration 277 uses LOCAL_EXEC for Mayor + LOCAL for 5 council (per migration 246 analog)"
  - "Christy Hollander uses short-form official name (not 2026 ballot name 'Christy Sterling Hollander')"
metrics:
  duration: 25m
  completed: "2026-06-06"
  tasks: 3
  files: 4
---

# Phase 95 Plan 01: St. Mary's County + Leonardtown Government Seed Summary

St. Mary's County Board of County Commissioners (5 officials) and Town of Leonardtown (Mayor + 5 Council Members) seeded via migrations 276 + 277 with idempotent WHERE NOT EXISTS guards, post-verification DO blocks, and office_id back-fill — both migrations applied to production Supabase and verified clean.

## Tasks Completed

| Task | Name | Status | Notes |
|------|------|--------|-------|
| 1 | Write migration 276 — St. Mary's County | DONE | 276_stmarys_county_government.sql, all structural assertions PASS |
| 2 | Write migration 277 — Leonardtown | DONE | 277_leonardtown_government.sql, all structural assertions PASS |
| 3 | Apply migrations 276 and 277 + verify | DONE | Both applied, post-verification DO blocks PASSED, idempotency confirmed |

## DB Assertions — All Passed

### Migration 276: St. Mary's County

| Assertion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| government rows for 'St. Mary's County, Maryland, US' | 1 | 1 | PASS |
| offices linked to COUNTY district (geo_id='24037') | 5 | 5 | PASS |
| politicians (external_id -24037001 to -24037005) | 5 | 5 | PASS |
| politicians with office_id back-filled | 5 | 5 | PASS |
| section-split orphans (geo_id='24037') | 0 | 0 | PASS |
| ledger entry '276' in schema_migrations | present | present | PASS |

### Migration 277: Leonardtown

| Assertion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| government rows for 'Town of Leonardtown, Maryland, US' | 1 | 1 | PASS |
| offices linked to geo_id='2446475' districts (all types) | 6 | 6 | PASS |
| politicians (external_id -2446475001 to -2446475006) | 6 | 6 | PASS |
| politicians with office_id back-filled | 6 | 6 | PASS |
| section-split orphans (geo_id='2446475') | 0 | 0 | PASS |
| ledger entry '277' in schema_migrations | present | present | PASS |

## Post-Verification DO Block RAISE NOTICE Text

**Migration 276 (St. Mary's County):**
```
Post-verification PASSED: gov_count=1, office_count=5, split_orphans=0
```

**Migration 277 (Leonardtown):**
```
Post-verification PASSED: gov_count=1, office_count=6, split_orphans=0
```

## ID Mapping Table (for Plan 95-02 headshots)

| external_id | politician.id (UUID) | full_name |
|-------------|---------------------|-----------|
| -24037001 | 608317e3-1436-4ee0-8c2d-fb675e33a9fa | James R. Guy |
| -24037002 | b044452b-8a0e-4dee-8074-1210b1285ef5 | Eric Colvin |
| -24037003 | 73c68742-794a-4e95-ad38-a946be0d8735 | Michael L. Hewitt |
| -24037004 | 5cc5428a-b730-4ef5-b321-3cd0f3c52d17 | Mike Alderson, Jr. |
| -24037005 | 98bd2860-24b5-48e1-9dff-1606a0fe2a56 | Scott R. Ostrow |
| -2446475001 | 6eeea63e-ce0d-4b66-a543-e4059f92b845 | Daniel W. Burris |
| -2446475002 | 27de208e-77ca-4205-bd6c-c486279735da | J. Maguire Mattingly IV |
| -2446475003 | 7b448bfb-6c57-4674-a9d2-0b8a2fa11804 | Nick B. Colvin |
| -2446475004 | 469e0778-4bf5-4857-84bf-40112f0bb12a | Heather M. Earhart |
| -2446475005 | f3097aa4-833e-48b5-8aa2-7ee0a7f13078 | Christy Hollander |
| -2446475006 | 56293210-08d5-4c0a-995d-825f72f28c7c | Mary Maday Slade |

## Idempotency Re-run Row Counts

Both migrations re-applied a second time. All counts unchanged:

| Check | After 1st Apply | After 2nd Apply | Delta |
|-------|----------------|----------------|-------|
| St. Mary's government rows | 1 | 1 | 0 |
| St. Mary's offices | 5 | 5 | 0 |
| St. Mary's politicians | 5 | 5 | 0 |
| Leonardtown government rows | 1 | 1 | 0 |
| Leonardtown offices | 6 | 6 | 0 |
| Leonardtown politicians | 6 | 6 | 0 |

Idempotency: CONFIRMED (no additional rows on re-run).

## Ledger Entry Confirmation

```sql
SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('276','277') ORDER BY version;
-- Result: '276', '277'
```

Both versions present in ledger.

## Cross-Check: Section-Split Detector (Both geo_ids)

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.geo_id IN ('24037','2446475')
  AND NOT EXISTS (SELECT 1 FROM essentials.districts d WHERE d.geo_id = gb.geo_id AND d.state = 'md');
-- Result: 0
```

Zero orphan geofences across both jurisdictions.

## Requirements Status

| Requirement | Status | Evidence |
|-------------|--------|---------|
| MD-DEEP-01: St. Mary's County government + Board of County Commissioners chamber seeded; county boundary linked | COMPLETE (data) | 1 government row + 1 chamber + 1 COUNTY district; section-split=0 |
| MD-DEEP-03: Leonardtown government + town officials seeded | COMPLETE (data) | 1 government row + 1 Town Council chamber + LOCAL_EXEC + LOCAL districts + 6 officials |
| MD-DEEP-02: Commissioners seeded with offices | COMPLETE (data side) | 5 commissioners + 5 offices; headshots in Plan 95-02 |

## Decisions Made

1. **D-05 final confirmation:** Option A (single COUNTY district) for St. Mary's County. All 5 commissioners share geo_id='24037' COUNTY district. Matches Multnomah County precedent (migration 244).
2. **Leonardtown geo_id:** 2446475 (confirmed via DB query; CONTEXT.md estimated 2443700 was incorrect).
3. **Migration 277 district pattern:** LOCAL_EXEC for Mayor (townwide) + LOCAL for all 5 council members (at-large). mtfcc=NULL on both (migration 246 pattern).
4. **Christy Hollander name:** 'Christy Hollander' — official government website display form, not 2026 ballot name 'Christy Sterling Hollander'.
5. **Mattingly title:** 'Council Member' (not 'Vice President' — Vice President is a council-chosen internal role, not an elected office title).

## Deviations from Plan

None — plan executed exactly as written. All 3 tasks completed in sequence with all acceptance criteria met.

## Known Stubs

None — all 11 politicians are fully seeded with offices and office_id back-filled. Headshots are pending Plan 95-02 (out of scope for this plan per D-02).

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries. SQL-only migration with WHERE NOT EXISTS guards on all inserts; post-verification DO blocks enforce data integrity.

## Self-Check: PASSED

- Migration 276 file: FOUND at C:/EV-Accounts/backend/migrations/276_stmarys_county_government.sql
- Migration 277 file: FOUND at C:/EV-Accounts/backend/migrations/277_leonardtown_government.sql
- Apply script 276: FOUND at C:/EV-Accounts/backend/scripts/_apply-migration-276.ts
- Apply script 277: FOUND at C:/EV-Accounts/backend/scripts/_apply-migration-277.ts
- DB: St. Mary's government row = 1 (CONFIRMED)
- DB: St. Mary's offices = 5 (CONFIRMED)
- DB: Leonardtown government row = 1 (CONFIRMED)
- DB: Leonardtown offices = 6 (CONFIRMED)
- DB: Section-split detector = 0 for both geo_ids (CONFIRMED)
- DB: Ledger versions '276' + '277' present (CONFIRMED)
- DB: All 11 office_id back-fills complete (CONFIRMED)
- Idempotency: re-run produces 0 delta rows (CONFIRMED)
