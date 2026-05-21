---
phase: 59-ca-government-db
plan: 02
subsystem: essentials-data
tags: [supabase, postgres, sql, migration, california, executives, dedup]

# Dependency graph
requires: [phase-59-plan-01]
provides:
  - "8 CA constitutional officers with external_ids -06000101 to -06000108"
  - "8 offices linked to correct CA chambers and STATE_EXEC districts with geo_id='06'"
  - "All 8 politicians have office_id back-filled"
  - "7/8 already have headshots from pre-existing seed"
affects: [phase-59-plan-03, phase-62-plan-02]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pre-existing CA executives had positive external_ids (665324, etc.) and party='Democratic' — migration 190 created duplicates; migration 192 cleaned up"
    - "Dedup pattern: null out office_id on duplicates → delete offices → delete politicians → delete districts → update old external_ids"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/190_ca_state_executives.sql"
    - "C:/EV-Accounts/backend/migrations/192_ca_exec_dedup.sql"
  modified: []

key-decisions:
  - "Migration 190 created 8 duplicate politician rows — all 8 CA execs were already seeded from prior work"
  - "Migration 192 removed duplicates and updated old external_ids to -06000xxx scheme"
  - "Pre-existing records retained because 7/8 already had headshots; only Ricardo Lara (-06000107) needs a headshot"
  - "Next migration number: 193"

# Metrics
duration: ~15min (including dedup)
completed: 2026-05-21
---

# Phase 59 Plan 02: CA State Executives Summary

**All 8 CA constitutional officers confirmed with -06000xxx external_ids, correct offices, and STATE_EXEC districts — 7/8 have headshots from prior seed**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-05-21
- **Tasks:** 2 (+ dedup fix)
- **Files modified:** 2 migration files

## Accomplishments

- Migration 190 written (8 STATE_EXEC districts + 8 politician+office CTEs + back-fill)
- Discovered all 8 CA executives already existed in production from prior seed
- Migration 192 applied to remove 8 duplicate rows and update external_ids to -06000xxx scheme
- Thurmond's title fixed: "Superintendent" → "Superintendent of Public Instruction"
- STATE_EXEC districts geo_id updated from '' to '06'

## Final Verification

```
external_id | full_name          | title                              | geo_id | has_headshot
-6000101    | Gavin Newsom        | Governor                           | 06     | true
-6000102    | Eleni Kounalakis    | Lieutenant Governor                | 06     | true
-6000103    | Rob Bonta           | Attorney General                   | 06     | true
-6000104    | Shirley N. Weber    | Secretary of State                 | 06     | true
-6000105    | Malia M. Cohen      | Controller                         | 06     | true
-6000106    | Fiona Ma            | Treasurer                          | 06     | true
-6000107    | Ricardo Lara        | Commissioner of Insurance          | 06     | false  ← needs headshot
-6000108    | Tony Thurmond       | Superintendent of Public Instruction| 06    | true
```

## Politician UUIDs (for Plan 59-03)

| external_id | UUID | needs_headshot |
|-------------|------|----------------|
| -6000101 | f26309c8-2525-49b2-bdaf-62980cbb1853 | false (already present) |
| -6000102 | 03df7cce-7502-4089-acd5-139841002cbe | false |
| -6000103 | 8b183a30-3afb-4d9e-aa40-aa2ad2c674aa | false |
| -6000104 | 4ba62f32-dd20-48ce-8d84-d09bb129ad59 | false |
| -6000105 | ea85dfe3-1092-468e-a799-cb8054c135db | false |
| -6000106 | 41ef8aaa-b604-4725-b46d-dab1656cc198 | false |
| -6000107 | bab3379b-d64e-423b-b62e-4efa04cee750 | **true — upload needed** |
| -6000108 | f8808ac0-8a9d-4657-8bf7-2ae60d96399c | false |

## Deviations from Plan

**[Auto-fixed] Migration 190 created 8 duplicate politician rows**
- All 8 CA constitutional officers were already seeded in production with positive external_ids (665324–692840) and party='Democratic'
- Migration 190's `ON CONFLICT (external_id) DO NOTHING` did not prevent insertion because the old records used different (positive) external_ids
- Fix: migration 192 removed duplicates, updated old external_ids to -06000xxx scheme, preserved all existing headshots and data

**[Auto-fixed] Migration number collision**
- 185-188 occupied by Longview TX; 190 used for this migration; 191 occupied; 192 used for dedup
- Next available: 193

## Issues Encountered

None beyond the deviations documented above. 7/8 headshots already present is a net positive — Plan 59-03 only needs to source Ricardo Lara's photo.

## Next Phase Readiness

- All 8 CA exec politician UUIDs available for headshot upload
- Plan 59-03 scope: **Ricardo Lara only** (1 headshot, not 8)
- Next migration number: 193
