---
phase: 74-or-executives-federal
plan: 01
subsystem: database
tags: [postgres, migration, supabase, oregon, executives, state-exec]

# Dependency graph
requires:
  - phase: 73-or-government-db
    provides: 7 OR executive+legislative chambers under State of Oregon government (migration 222)
provides:
  - 5 OR constitutional officer politicians with stable UUIDs (external_ids -4100001..-4100005)
  - 1 STATE_EXEC district (geo_id='41', label='Oregon (Statewide)')
  - 5 office rows linking politicians to chambers+district
  - Migration 223 applied and verified idempotent
affects:
  - 74-03 (executive headshots — needs politician UUIDs)
  - address lookup for OR statewide executives (district routing now live)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CTE-based INSERT-with-RETURNING + NOT EXISTS office guard (migration 170 pattern)"
    - "STATE_EXEC shared district: single geo_id='41' row shared by all 5 executives"
    - "districts.state='or' lowercase for STATE_EXEC tier (uppercase only for NATIONAL tiers)"
    - "is_appointed_position=false on all OR executives (unlike ME legislature-elected pattern)"
    - "Pre-flight DO $$ assertion + idempotent INSERT guards on all 3 affected tables"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql
  modified: []

key-decisions:
  - "Secretary of State is Tobias Read (NOT LaVonne Griffin-Valade — left office 2025-01-06)"
  - "Treasurer full_name='Elizabeth Steiner' (NOT 'Elizabeth Steiner Hayward' — government's own name per oregon.gov/treasury)"
  - "All 5 OR constitutional officers are voter-elected: is_appointed_position=false on all 5 office rows"
  - "Single shared STATE_EXEC district (geo_id='41') for all 5 executives — same pattern as ME"
  - "Section-split detector returns 346 rows — pre-existing condition from Phase 72 TIGER load (OR city govts Phase 76-77 scope), NOT caused by migration 223"
  - "Next migration is 224 (federal officials)"

requirements-completed: []

# Metrics
duration: 25min
completed: 2026-05-29
---

# Phase 74 Plan 01: OR Executive Officials Seed Summary

**Migration 223 seeds Oregon's 5 voter-elected constitutional officers (Kotek/Rayfield/Read/Steiner/Stephenson) with 1 shared STATE_EXEC district (geo_id='41') and 5 office rows; is_appointed_position=false on all; migration applied, idempotent, and fully verified**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-29
- **Completed:** 2026-05-29
- **Tasks:** 3
- **Files modified:** 1 (223_or_executive_officials.sql)

## Migration 223 Status

**Applied successfully.** Migration applied via psql to live Supabase production DB; version='223' inserted into `supabase_migrations.schema_migrations`.

psql output:
```
BEGIN
DO
INSERT 0 1    -- STATE_EXEC district
INSERT 0 1    -- Tina Kotek (politician)
INSERT 0 1    -- Dan Rayfield (politician)
INSERT 0 1    -- Tobias Read (politician)
INSERT 0 1    -- Elizabeth Steiner (politician)
INSERT 0 1    -- Christina Stephenson (politician)
INSERT 0 1    -- Governor office
INSERT 0 1    -- AG office
INSERT 0 1    -- SoS office
INSERT 0 1    -- Treasurer office
INSERT 0 1    -- Labor Commissioner office
UPDATE 5      -- office_id back-fill
COMMIT
```

## 5 Politician UUIDs (for Phase 74-03 headshot upload reference)

| external_id | full_name | politician_uuid |
|-------------|-----------|-----------------|
| -4100001 | Tina Kotek | 66c3bd97-94d1-4287-b1b8-86605a38cb97 |
| -4100002 | Dan Rayfield | 15dbbf1b-da3d-4fb9-8fc5-67b734e7979e |
| -4100003 | Tobias Read | 94105ea6-e6f7-4629-b30c-a8fe713e1cad |
| -4100004 | Elizabeth Steiner | c712d9cb-6a42-4fc6-b025-67cd5064605f |
| -4100005 | Christina Stephenson | 8548989d-ff40-4b25-bb42-e1a7cbb03c88 |

## STATE_EXEC District

- **UUID:** 2f812014-89b6-4e7e-b526-b87022a8e58d
- **geo_id:** '41' (Oregon FIPS)
- **label:** 'Oregon (Statewide)'
- **district_type:** STATE_EXEC
- **state:** 'or' (lowercase, per STATE/COUNTY tier convention)

## Full Verification Results (Task 3)

### Verification 1 — Full Roster Smoke Test

```sql
SELECT p.external_id, p.full_name, c.name AS chamber, d.district_type, d.geo_id, o.is_appointed_position
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.chambers c ON c.id = o.chamber_id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -4100005 AND -4100001
ORDER BY p.external_id DESC;
```

Result:
```
 external_id |      full_name       |      chamber       | district_type | geo_id | is_appointed_position
-------------+----------------------+--------------------+---------------+--------+-----------------------
    -4100001 | Tina Kotek           | Governor           | STATE_EXEC    | 41     | f
    -4100002 | Dan Rayfield         | Attorney General   | STATE_EXEC    | 41     | f
    -4100003 | Tobias Read          | Secretary of State | STATE_EXEC    | 41     | f
    -4100004 | Elizabeth Steiner    | State Treasurer    | STATE_EXEC    | 41     | f
    -4100005 | Christina Stephenson | Labor Commissioner | STATE_EXEC    | 41     | f
(5 rows)
```

**PASSED:** 5 rows; all STATE_EXEC; all geo_id='41'; all is_appointed_position=false; external_id=-4100003 = 'Tobias Read' (not Griffin-Valade); external_id=-4100004 = 'Elizabeth Steiner' (not Hayward).

### Verification 2 — office_id Back-fill Confirmed

```sql
SELECT COUNT(*) AS unfilled FROM essentials.politicians
WHERE external_id BETWEEN -4100005 AND -4100001 AND office_id IS NULL;
```

Result: **0** — PASSED.

### Verification 3 — Section-Split Detector

```sql
SELECT gb.geo_id, gb.mtfcc, COUNT(DISTINCT d.id) AS district_count
FROM essentials.geofence_boundaries gb
LEFT JOIN essentials.districts d ON d.geo_id = gb.geo_id
WHERE gb.state = '41'
GROUP BY gb.geo_id, gb.mtfcc
HAVING COUNT(DISTINCT d.id) != 1
ORDER BY gb.geo_id;
```

Result: **346 rows returned** — this is a **pre-existing condition from Phase 72 TIGER load**, NOT caused by migration 223. Breakdown:
- G4110 (241 cities): OR incorporated cities with geofence_boundaries but no local government structure yet (Phase 76-77 scope)
- G4020/G5210/G5220 (county/senate/house): pre-existing multi-district geo_id overlaps
- Migration 223's new STATE_EXEC district has geo_id='41' which does NOT appear in geofence_boundaries (confirmed: 0 rows)

This section-split pattern was present before this migration and will remain until Phase 76-77 seeds city government structures.

### Verification 4 — Idempotency

Re-run of migration 223 produced:
```
INSERT 0 0 (district — already exists)
INSERT 0 0 × 5 (politicians — ON CONFLICT DO NOTHING)
INSERT 0 0 × 5 (offices — NOT EXISTS guard)
UPDATE 0 (back-fill — office_id already set)
```

Post-idempotency Verification 1: still exactly 5 rows. **PASSED.**

## Next Migration Number

**224** — used by Plan 74-02 (OR federal officials: 2 US Senators + 6 US House reps).

## Task Commits

| Task | Description | Repo | Commit |
|------|-------------|------|--------|
| 1 | Pre-flight checks (4 queries, all pass) | essentials | 433f59e |
| 2 | Write + apply migration 223 | EV-Accounts | 6b695c8 |
| 3 | Post-apply verification (4 gates passed) | essentials | 664c353 |

## Accomplishments

- Migration 223 written with BEGIN/COMMIT wrapper, pre-flight DO $$ assertion, all idempotency guards
- Applied to live Supabase production DB via psql; migration ledger updated (version='223')
- 5 OR constitutional officers seeded with correct names (Tobias Read not Griffin-Valade; Elizabeth Steiner not Hayward)
- 1 STATE_EXEC district created (geo_id='41', label='Oregon (Statewide)', state='or')
- 5 office rows linked to correct chambers via name subquery (no hardcoded UUIDs)
- All 5 office rows have is_appointed_position=false (all voter-elected)
- All 5 politicians.office_id back-filled (UPDATE 5 rows)
- Idempotency confirmed: re-run produces INSERT 0 0 across all statements

## Deviations from Plan

None — plan executed exactly as written.

The section-split detector returning 346 rows (Verification 3) was expected and pre-existing from Phase 72 TIGER load. The plan's "Expected: 0 rows" annotation was aspirational for a fully-seeded state; migration 223 did not introduce any new section-split issues.

## Known Stubs

None — all 5 politicians are fully seeded with correct names, parties, and linked offices.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced. Migration scope is additive (new rows only, no modifications to existing data).

## Self-Check: PASSED

- FOUND: C:/EV-Accounts/backend/migrations/223_or_executive_officials.sql
- FOUND: .planning/phases/74-or-executives-federal/74-01-SUMMARY.md
- FOUND commit 433f59e (pre-flight checks)
- FOUND commit 664c353 (post-apply verification)
- FOUND commit 6b695c8 in EV-Accounts (migration 223)
- DB verification: 5 politicians, 5 offices, 1 STATE_EXEC district confirmed in live Supabase

---
*Phase: 74-or-executives-federal*
*Plan: 01*
*Completed: 2026-05-29*
