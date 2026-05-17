---
confirmed_learning_count: 13
files_to_update:
  - LOCATION-ONBOARDING.md
  - .planning/templates/db-foundation.md
  - .planning/templates/officials-seed.md
  - .planning/templates/discovery-setup.md
  - .planning/templates/compass-stances.md
new_files_to_create:
  - .planning/templates/elections-seed.md
---

# Plan 45-01 Summary: Cambridge Learnings Confirmed

User reviewed and confirmed all 13 candidate learnings. No cuts requested. Full list proceeds to Plan 02.

## Confirmed Learning List

### SCHEMA CORRECTNESS

**1. `election_method` is a TEXT column, not a pg_constraint CHECK enum**
- Learning: `SELECT constrname, consrc FROM pg_constraint...` returns nothing useful for election_method — it is a TEXT column (added migration 157), not a CHECK constraint. Do not run this query to verify valid values.
- Tag: [GOTCHA]
- Category: universal-principle
- Target: `LOCATION-ONBOARDING.md` Steps 2+5, `db-foundation.md`, `elections-seed.md` [NEW]

**2. `essentials.governments` has NO unique constraint on `geo_id`**
- Learning: `ON CONFLICT (geo_id) DO NOTHING` fails with "no unique constraint" error. Use `WHERE NOT EXISTS (SELECT 1 FROM essentials.governments WHERE geo_id = '...')`.
- Tag: [GOTCHA]
- Category: universal-principle
- Target: `db-foundation.md`, `LOCATION-ONBOARDING.md` Step 6

**3. `race_candidates` has NO unique constraint on `(race_id, full_name)`**
- Learning: `ON CONFLICT DO NOTHING` is a no-op on race_candidates — no unique constraint exists. Use `WHERE NOT EXISTS` guards or risk silent duplicate rows.
- Tag: [GOTCHA]
- Category: universal-principle
- Target: `elections-seed.md` [NEW], `LOCATION-ONBOARDING.md` Step 6

### COUNCIL STRUCTURE PATTERNS

**4. Council-Manager cities require `offices.politician_id` unique index drop before seeding incumbents**
- Learning: When Mayor is a sitting councillor, one politician links to two office rows. The unique index on `offices.politician_id` must be dropped (and replaced with a non-unique index) in the offices migration before any politician_id assignments.
- Tag: [GOTCHA]
- Category: universal-principle
- Target: `db-foundation.md` (council structure decision tree), `officials-seed.md`, `LOCATION-ONBOARDING.md` Step 6

**5. Council-Manager Mayor: `district_type=LOCAL`, `is_appointed_position=true` (NOT `LOCAL_EXEC`)**
- Learning: `LOCAL_EXEC` is reserved for directly-elected executives (Strong Mayor). Council-Manager mayor is a council-internal title — use `LOCAL`.
- Tag: [PATTERN]
- Category: universal-principle
- Target: `db-foundation.md` (council structure decision tree)

### MIGRATION GUARDS

**6. Cambridge Mayor is Sumbul Siddiqui — `officials-seed.md` says Marc C. McGovern (WRONG)**
- Learning: McGovern example in officials-seed.md Dual-Office Pattern section is outdated. Siddiqui has held the Mayor title since 2026-01-05 (third term, elected by council).
- Tag: [GOTCHA]
- Category: cambridge-example
- Target: `officials-seed.md`

**7. `generate_series(1, N)` for N identical at-large offices avoids arithmetic errors**
- Learning: Cambridge planning docs said 16 offices; correct count is 17 (9+1+1+6=17). `generate_series` makes the count explicit and avoids copy-paste errors that survive review.
- Tag: [PATTERN]
- Category: universal-principle
- Target: `db-foundation.md`, `LOCATION-ONBOARDING.md` Step 6

**8. Partial index ON CONFLICT syntax required for general race rows**
- Learning: General races (primary_party IS NULL) require `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`. Plain `ON CONFLICT DO NOTHING` is insufficient.
- Tag: [GOTCHA]
- Category: universal-principle
- Target: `elections-seed.md` [NEW]

**9. `discovery_jurisdictions` unique constraint is `(jurisdiction_geoid, election_date)`**
- Learning: Use `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING` — not bare `DO NOTHING`. The explicit target documents what constraint future agents can rely on.
- Tag: [GOTCHA]
- Category: universal-principle
- Target: `discovery-setup.md`, `elections-seed.md` [NEW]

### TIGER / GEOFENCE PATTERNS

**10. MA TIGER has only 58 G4110 incorporated cities; 293 MA towns are G4040 COUSUB (not loaded)**
- Learning: When loading MA TIGER place boundaries, expect 58 rows not ~351. Anything else is a loader bug. MA distinguishes incorporated cities (G4110) from towns (G4040 COUSUB). Not all states use this distinction.
- Tag: [VERIFY]
- Category: cambridge-example
- Target: `LOCATION-ONBOARDING.md` Step 3

### ELECTION DATA PATTERNS

**11. Cambridge election date is `2027-11-02` — `discovery-setup.md` says `2027-11-04` (WRONG)**
- Learning: First Tuesday after first Monday in November 2027 = November 2. The template had the wrong date.
- Tag: [GOTCHA]
- Category: cambridge-example
- Target: `discovery-setup.md`

**12. Cron horizon: elections >180 days out need `would_be_swept=false`**
- Learning: The discovery cron fires for `election_date <= CURRENT_DATE + INTERVAL '180 days'`. Far-future elections must be set `would_be_swept=false` at setup time to avoid immediate false cron sweeps.
- Tag: [PATTERN]
- Category: universal-principle
- Target: `elections-seed.md` [NEW], `discovery-setup.md`

### TEMPLATE GAPS

**13. No `elections-seed.md` template exists**
- Learning: Cambridge Phase 44 established patterns for election rows, race seeding, statewide race sentinel (office_id=NULL), partial index ON CONFLICT, race_candidates WHERE NOT EXISTS, discovery_jurisdictions constraint, and cron horizon. None of this is currently templated.
- Tag: [AUTO]
- Category: universal-principle
- Target: `.planning/templates/elections-seed.md` [NEW]

## Core Principle Items (confirmed)

1. Honor how a city presents itself to residents — "Councillor" double-L, "City of Cambridge" not "Cambridge MA", Council-Manager mayor as LOCAL not LOCAL_EXEC
2. Model the government as residents experience it — the Mayor title is an internal council designation, not a voter-facing executive mandate
3. When citizen experience conflicts with schema convenience, citizen experience wins

## Cities Onboarded Table — First Row (confirmed)

| City | State | Onboarded | Election method | Notable patterns |
|------|-------|-----------|-----------------|-----------------|
| Cambridge | MA | 2026-05-17 | stv_proportional | Council-Manager; odd-year (next: 2027-11-02); 17 offices (9 councillors + 1 Mayor + 1 City Manager + 6 School Committee); STV since 1941 |

## Plan 02 Scope (confirmed)

| File | Changes |
|------|---------|
| `LOCATION-ONBOARDING.md` | Core Principle section + Cities Onboarded table + [GOTCHA] tags in Steps 2, 5, 6, 7, 8 |
| `db-foundation.md` | Council structure decision tree + WHERE NOT EXISTS government INSERT fix + election_method TEXT reference block |
| `officials-seed.md` | McGovern → Siddiqui + unique index drop [GOTCHA] callout |
| `discovery-setup.md` | `2027-11-04` → `2027-11-02` + election_method reference block + discovery_jurisdictions ON CONFLICT target |
| `compass-stances.md` | election_method reference block added |
| `elections-seed.md` | NEW template: Cambridge Phase 44 patterns |
