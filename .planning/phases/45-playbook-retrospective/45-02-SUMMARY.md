---
files_updated: 5
files_created: 1
learnings_applied: 13
wrong_instructions_fixed:
  - "pg_constraint election_method query (LOCATION-ONBOARDING.md Steps 2+5, db-foundation.md)"
  - "McGovern→Siddiqui (officials-seed.md Cambridge example)"
  - "2027-11-04→2027-11-02 (discovery-setup.md Cambridge example)"
  - "ON CONFLICT (geo_id) → WHERE NOT EXISTS (db-foundation.md government INSERT)"
---

# Plan 45-02 Summary: Cambridge Learnings Written

All 13 confirmed learnings from Plan 45-01 written into 6 files. Phase 45 (PLAY-03) satisfied.

## Changes Per File

### LOCATION-ONBOARDING.md

- Added **Core Principle: Citizen Experience First** section (before Step 1) — universal anchor for all schema decisions
- Added **Cities Onboarded** table (after Core Principle, before Step 1) — Cambridge as first row
- Step 2: Replaced wrong `pg_constraint` query with [GOTCHA] noting election_method is TEXT; updated schema decisions table label
- Step 5: Replaced `pg_constraint` query instruction with [VERIFY] pointing to elections-seed template; corrected Mayor name McGovern → Siddiqui; removed stale migration number reference
- Step 6 item 2: Added [GOTCHA] — `governments` has no unique constraint on `geo_id`; use WHERE NOT EXISTS
- Step 6 item 3: Updated to [VERIFY] — check elections-seed template, not pg_constraint query
- Step 6 item 4: Added [GOTCHA] — unique index on `offices.politician_id` must be dropped for Council-Manager dual-office; added [PATTERN] for generate_series
- Step 6 item 6: Added [GOTCHA] — `race_candidates` has no unique constraint; ON CONFLICT DO NOTHING is a no-op
- Step 7: Added 5 new pitfall rows (offices unique index, government WHERE NOT EXISTS, election_method pg_constraint, race_candidates duplicate rows, office count arithmetic)
- Step 8: Added elections-seed.md link
- Checklist Summary: Added [VERIFY]/[AUTO] tags to all 8 items

### .planning/templates/db-foundation.md

- Added **Valid election_method Values** reference block (before Pre-Migration Checklist)
- Added **Council Structure Decision Tree** section (Strong Mayor / Council-Manager / Commission) with index drop requirement documented
- Fixed government INSERT: `ON CONFLICT (geo_id) DO NOTHING` → `WHERE NOT EXISTS` guard with comment
- Fixed Pre-Migration Checklist: removed pg_constraint query instruction, replaced with [GOTCHA]
- Added 3 items to Common Mistakes (geo_id ON CONFLICT, unique index drop, pg_constraint query)

### .planning/templates/officials-seed.md

- Fixed Cambridge example in Dual-Office Pattern: McGovern → Siddiqui throughout (name, pronouns, valid_from date)
- Added [GOTCHA] callout before Dual-Office Pattern — verify unique index dropped before seeding; includes diagnostic query
- Added to Common Mistakes: Cambridge Mayor name verification note

### .planning/templates/discovery-setup.md

- Added **Valid election_method Values** reference block (before Pre-Configuration Checklist)
- Fixed Cambridge example election date: `2027-11-04` → `2027-11-02` (first Tuesday after first Monday)
- Fixed discovery_jurisdictions INSERT: bare `ON CONFLICT DO NOTHING` → explicit `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` with [GOTCHA] comment; updated column names to match actual schema
- Added 2 items to Common Mistakes (wrong date, bare ON CONFLICT)

### .planning/templates/compass-stances.md

- Added **Valid election_method Values** reference block (before Pre-Research Checklist) with note that stance research is independent of election_method but the reference is useful when setting up election infrastructure

### .planning/templates/elections-seed.md (NEW)

- Created new template covering Cambridge Phase 44 patterns:
  - Valid election_method values reference block
  - Pre-Seed Checklist (city election date, odd/even year, state SoS dates)
  - Elections table INSERT with [VERIFY] tag
  - Races INSERT with [GOTCHA] — partial index ON CONFLICT syntax for general races
  - race_candidates INSERT with [GOTCHA] — WHERE NOT EXISTS (no unique constraint)
  - discovery_jurisdictions INSERT with [GOTCHA] — explicit ON CONFLICT target
  - Cron Horizon section — 180-day rule, would_be_swept behavior, Cambridge example
  - Placeholder Elections pattern
  - Verification Queries
  - Common Mistakes (7 items)

## [GOTCHA] Items Now Documented

1. `election_method` is TEXT, not a pg_constraint — pg_constraint query is a dead end
2. `essentials.governments` has no unique constraint on `geo_id` — WHERE NOT EXISTS required
3. `race_candidates` has no unique constraint on `(race_id, full_name)` — WHERE NOT EXISTS required
4. `offices.politician_id` unique index must be dropped for Council-Manager dual-office pattern
5. Partial index ON CONFLICT syntax required for general race rows
6. `discovery_jurisdictions` unique constraint is `(jurisdiction_geoid, election_date)` — be explicit
7. McGovern → Siddiqui: always verify Cambridge Mayor from official source before migrating

## Phase 45 (PLAY-03) Satisfied

- ✓ LOCATION-ONBOARDING.md reflects 13 Cambridge-specific learnings with tags
- ✓ Wrong pg_constraint instruction removed from all affected files
- ✓ officials-seed.md Cambridge example corrected to Siddiqui
- ✓ elections-seed.md template exists with Phase 44 patterns
- ✓ A future agent running db-foundation for a Council-Manager city finds the decision tree and index drop requirement
