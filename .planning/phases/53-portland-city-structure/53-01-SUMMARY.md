---
phase: 53-portland-city-structure
plan: 01
subsystem: essentials-data
tags: [sql, postgres, migration, maine, local-government, supabase]

requires:
  - phase: 49-me-geofences
    provides: TIGER G4110 geofence_boundaries for 23 ME cities (but zero LOCAL district rows)
  - phase: 50-me-government-db
    provides: State of Maine government + executive/legislative chambers (established LOCAL pattern)
  - phase: 41-cambridge-city-structure
    provides: Cambridge migration 157/167 — canonical city-scaffold + LOCAL district back-fill pattern

provides:
  - 23 ME city governments in essentials.governments (type=LOCAL, state=ME)
  - 23 LOCAL district rows (district_type=LOCAL, mtfcc=G4110, state=me) for address routing
  - 4 school chambers (Portland Board of Public Education, Westbrook School Board, Lewiston School Committee, Augusta School Committee)
  - 206 skeletal office rows (politician_id=NULL, is_vacant=true) all with district_id linked
  - Portland + Westbrook chambers with election_method=rcv

affects:
  - phase-53-plan-02-portland-incumbents
  - phase-54-other-22-cities-incumbents

tech-stack:
  added: []
  patterns:
    - "ME LOCAL district insert: district_type=LOCAL, mtfcc=G4110, state=me (lowercase), one per city geo_id"
    - "Embedded title pattern for office seat labeling: 'Council Member (Ward N)', 'Council Member (At-Large N)', 'Council Member (District N)' — no seat_label column exists on essentials.offices"
    - "5-step DO block per city: government → LOCAL district → chamber(s) → offices → UPDATE district_id"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/177_me_cities_scaffolding.sql
  modified: []

key-decisions:
  - "essentials.offices has no seat_label column — embedded title pattern used: 'Council Member (Ward N)', 'Council Member (At-Large N)', 'Council Member (District N)'"
  - "essentials.offices has no is_active column — omitted from all INSERTs"
  - "essentials.districts has no short_label column — only label used"
  - "Biddeford official_count=10 (Mayor+7W+2AL), South Portland official_count=8 (Mayor+5D+2AL), Westbrook City Council official_count=8 (Mayor+5W+2AL) — research inventory seat-count descriptions were off-by-one (excluded Mayor from total)"
  - "Sanford, Ellsworth, Eastport mayor model defaulted to voter-elected on-council (is_appointed_position=false)"
  - "LOCAL districts use state='me' lowercase — matching Phase 49 ME TIGER convention"

patterns-established:
  - "ME LOCAL district insert: state='me' (lowercase) to match Phase 49 TIGER rows"
  - "All 23 ME city offices route through city-level LOCAL district (no sub-district layer for school boards)"
  - "Council-selected mayor: title='Mayor', is_appointed_position=true (Bangor, South Portland, Presque Isle, Rockland)"
  - "No-mayor cities: no Mayor row at all (Bath=Council Chair, Old Town=Council President)"

duration: 25min
completed: 2026-05-19
---

# Phase 53 Plan 01: ME 23-City Scaffolding Summary

**Migration 177: all 23 Maine incorporated city governments, LOCAL G4110 district rows, chambers, and 206 skeletal offices with district_id back-filled — Portland/Westbrook use RCV; address routing gate closed**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-05-19T18:30:00Z
- **Completed:** 2026-05-19T18:56:34Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Created and applied migration 177 with 23 DO blocks (one per ME city), all idempotent via WHERE NOT EXISTS guards
- 23 LOCAL district rows (district_type=LOCAL, mtfcc=G4110, state=me) — Phase 49 loaded geofence_boundaries but zero LOCAL district rows; this closes the address-routing gap
- 206 office rows created, all with district_id correctly linked to their city's LOCAL district row (Query 10b Step 1 = 0)
- Portland has 2 RCV chambers (City Council + Board of Public Education, 9 seats each); Westbrook has 2 RCV chambers (City Council + School Board, 8+7 seats)
- 4 council-selected mayors marked is_appointed_position=true (Bangor, South Portland, Presque Isle, Rockland)
- Bath and Old Town have no Mayor office row (Council Chair / Council President model)

## Schema Check

**Pre-flight column discovery on essentials.offices:**

```
 id                       | uuid
 politician_id            | uuid
 chamber_id               | uuid
 district_id              | uuid
 title                    | text
 representing_state       | text
 representing_city        | text
 description              | text
 seats                    | bigint
 normalized_position_name | text
 partisan_type            | text
 salary                   | text
 is_appointed_position    | boolean
 is_vacant                | boolean
 vacant_since             | timestamp with time zone
 faces_retention_vote     | boolean
 role_canonical           | text
```

**CRITICAL: No `seat_label` column and no `is_active` column exists on essentials.offices.**

**Labeling strategy chosen:** Embedded title pattern — seat identifiers embedded in the `title` column:
- Mayor: `title='Mayor'`
- Ward seats: `title='Council Member (Ward N)'`
- District seats: `title='Council Member (District N)'`
- At-large (multiple): `title='Council Member (At-Large N)'`
- School variants: `title='School Board Member (Ward N)'`, `title='School Committee Member (Ward N)'`, etc.

**Rationale:** No `seat_label` column means idempotency WHERE clauses and Plan 53-02's UPDATE patterns must use the full title string. All titles are unique within a chamber, making this unambiguous.

**Plan 53-02 UPDATE pattern:** `UPDATE essentials.offices SET politician_id=..., is_vacant=false WHERE chamber_id=(SELECT id FROM essentials.chambers ch JOIN essentials.governments g ON ch.government_id=g.id WHERE g.geo_id='2360545' AND ch.name='City Council') AND title='Mayor';`

## Baseline Counts

**Before migration 177:**

| district_type | count |
|---|---|
| COUNTY | 16 |
| NATIONAL_LOWER | 2 |
| NATIONAL_UPPER | 1 |
| STATE_EXEC | 4 |
| STATE_LOWER | 151 |
| STATE_UPPER | 35 |
| LOCAL | 0 (did not exist) |

ME election_races (essentials.races): 0 (table exists but no ME races yet)

**After migration 177:**

| district_type | count |
|---|---|
| COUNTY | 16 (unchanged) |
| NATIONAL_LOWER | 2 (unchanged) |
| NATIONAL_UPPER | 1 (unchanged) |
| STATE_EXEC | 4 (unchanged) |
| STATE_LOWER | 151 (unchanged) |
| STATE_UPPER | 35 (unchanged) |
| LOCAL | 23 (NEW — one per city) |

## Per-City Office Row Counts

| # | City | geo_id | Chambers | Council seats | School seats | Total offices |
|---|------|--------|----------|---------------|-------------|---------------|
| 1 | Portland | 2360545 | 2 (Council+Board of Public Ed) | 9 | 9 | 18 |
| 2 | Lewiston | 2338740 | 2 (Council+School Comm.) | 8 | 8 | 16 |
| 3 | Bangor | 2302795 | 1 | 9 | — | 9 |
| 4 | South Portland | 2371990 | 1 | 8 | — | 8 |
| 5 | Auburn | 2302060 | 1 | 8 | — | 8 |
| 6 | Biddeford | 2304860 | 1 | 10 | — | 10 |
| 7 | Sanford | 2365725 | 1 | 7 | — | 7 |
| 8 | Augusta | 2302100 | 2 (Council+School Comm.) | 9 | 9 | 18 |
| 9 | Saco | 2364675 | 1 | 8 | — | 8 |
| 10 | Westbrook | 2382105 | 2 (Council+School Board) | 8 | 7 | 15 |
| 11 | Waterville | 2380740 | 1 | 8 | — | 8 |
| 12 | Brewer | 2306925 | 1 | 5 | — | 5 |
| 13 | Presque Isle | 2360825 | 1 | 7 | — | 7 |
| 14 | Bath | 2303355 | 1 | 9 (no Mayor) | — | 9 |
| 15 | Ellsworth | 2323200 | 1 | 7 | — | 7 |
| 16 | Gardiner | 2327085 | 1 | 8 | — | 8 |
| 17 | Hallowell | 2330550 | 1 | 8 | — | 8 |
| 18 | Calais | 2309585 | 1 | 7 | — | 7 |
| 19 | Belfast | 2303950 | 1 | 6 | — | 6 |
| 20 | Old Town | 2355225 | 1 | 7 (no Mayor) | — | 7 |
| 21 | Eastport | 2321730 | 1 | 5 | — | 5 |
| 22 | Rockland | 2363590 | 1 | 5 | — | 5 |
| 23 | Caribou | 2310565 | 1 | 7 | — | 7 |
| **TOTAL** | | | **27 chambers** | | | **206 offices** |

Note: Biddeford has 10 offices (Mayor+7W+2AL=10; research description "9 (Mayor+7W+2AL)" was a counting error in the inventory). South Portland has 8 offices (Mayor+5D+2AL=8; research "7" excluded Mayor). Westbrook City Council has 8 offices (Mayor+5W+2AL=8; research "7" excluded Mayor). official_count values on chambers were corrected to match.

## Verification Query Outputs

**Query 1 — 23 city governments:** `gov_count = 23` ✓

**Query 1b — 23 LOCAL district rows:** `local_district_count = 23` ✓

**Query 2+3 — Portland chambers (RCV):**
```
           name            | election_method | official_count | office_count
---------------------------+-----------------+----------------+--------------
 Board of Public Education | rcv             |              9 |            9
 City Council              | rcv             |              9 |            9
```

**Query 4 — Westbrook chambers (both RCV):**
```
     name     | election_method | official_count
--------------+-----------------+----------------
 City Council | rcv             |              8
 School Board | rcv             |              7
```

**Query 5 — Lewiston + Augusta (non-RCV, 2 chambers each):**
```
 geo_id  |       name       | election_method
---------+------------------+-----------------
 2302100 | City Council     |
 2302100 | School Committee |
 2338740 | City Council     |
 2338740 | School Committee |
```

**Query 6 — 19 non-school cities: all chamber_count=1** ✓ (19 rows, all count=1)

**Query 7 — 4 council-selected mayors (is_appointed_position=true):**
```
 geo_id  | title | is_appointed_position
---------+-------+-----------------------
 2302795 | Mayor | t   (Bangor)
 2360825 | Mayor | t   (Presque Isle)
 2363590 | Mayor | t   (Rockland)
 2371990 | Mayor | t   (South Portland)
```

**Query 8 — 17 voter-elected mayor cities:** 17 rows, all mayor_row_count=1 ✓

**Query 9 — Bath + Old Town have NO Mayor row:**
```
 geo_id  | mayor_count
---------+-------------
 2303355 |           0
 2355225 |           0
```

**Query 10 — All offices skeletal:** `count = 0` ✓ (no politician_id set, no is_vacant=false)

**Query 10b Step 1 — No offices with NULL district_id:** `offices_with_null_district_id = 0` ✓ (address routing gate closed)

**Query 10b Step 2 — Every office points to own city LOCAL district:** `offices_with_correct_district_link = 206` ✓ (matches total office count)

**Query 11 — District counts:** LOCAL increased by exactly 23 (0 → 23); all TIGER types unchanged ✓

**Query 12 — Idempotency (re-run):** BEGIN, 23 DO, COMMIT — no errors. Counts unchanged at 23 governments, 23 LOCAL districts, 206 offices ✓

## Research Uncertainties Resolved

| City | Uncertainty | Resolution | Rationale |
|------|-------------|------------|-----------|
| Sanford | Mayor model (council-selected vs voter-elected unclear) | Voter-elected on-council, is_appointed_position=false | Research inventory says "On-council" model; defaulted per plan instructions |
| Ellsworth | Mayor model (research noted uncertain) | Voter-elected on-council, is_appointed_position=false | Research inventory says "On-council (default)"; defaulted per plan instructions |
| Eastport | Mayor model (research noted uncertain) | Voter-elected on-council, is_appointed_position=false | Research inventory says "On-council (default)"; defaulted per plan instructions |

## Task Commits

1. **Task 1+2: Write and apply migration 177** — `62b80b2` (feat) — committed to EV-Accounts repo

## Files Created

- `C:/EV-Accounts/backend/migrations/177_me_cities_scaffolding.sql` — 23-city ME scaffolding migration, 1568 lines, applied to live DB

## Decisions Made

- `seat_label` column does not exist on essentials.offices — embedded title pattern used throughout (e.g., 'Council Member (Ward 1)')
- `is_active` column does not exist on essentials.offices — omitted from all INSERTs
- `short_label` column does not exist on essentials.districts — only `label` used
- Biddeford, South Portland, Westbrook City Council official_count values corrected post-INSERT (research description off-by-one — excluded Mayor from seat total)
- LOCAL districts use state='me' lowercase (matches Phase 49 TIGER convention for ME)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] official_count mismatch on Biddeford, South Portland, Westbrook City Council**

- **Found during:** Task 2 verification (final overview query)
- **Issue:** The research inventory descriptions "9 (Mayor+7W+2AL)", "7 (5D+2AL)", and "7 (Mayor+5W+2AL)" were ambiguous. The migration inserted 10, 8, and 8 offices respectively (correct, matching breakdown), but the chamber official_count was set to 9, 7, and 7 (incorrect, matching the inventory number not the actual seat breakdown)
- **Fix:** Direct UPDATE on chambers table; migration file official_count values corrected to 10, 8, 8
- **Files modified:** 177_me_cities_scaffolding.sql (corrected), live DB (UPDATE applied)
- **Verification:** Final overview query shows office_rows match official_count for all 27 chamber rows

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug fix)
**Impact on plan:** Correctness fix only. official_count must match actual seat count for UI display.

## Issues Encountered

None - migration applied cleanly in first run.

## Next Phase Readiness

- Plan 53-02 (Portland incumbents) is fully unblocked: Portland City Council (9 offices) + Board of Public Education (9 offices) exist, all have district_id set, all are skeletal awaiting UPDATE
- Phase 54 (other 22 cities' incumbents) is unblocked: all 22 cities have skeletal office rows with district_id linked
- Address routing is fully wired: getRepresentativesByAddress can now JOIN office.district_id → district.id for all 23 ME cities
- Plan 53-02 UPDATE pattern: match on `(chamber_id, title)` since no seat_label column exists

---
*Phase: 53-portland-city-structure*
*Completed: 2026-05-19*
