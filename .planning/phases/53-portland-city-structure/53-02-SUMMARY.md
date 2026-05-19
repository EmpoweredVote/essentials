---
phase: 53-portland-city-structure
plan: 02
subsystem: essentials-data
tags: [postgres, migration, portland, maine, city-council, school-board, nonpartisan, rcv]

# Dependency graph
requires:
  - phase: 53-portland-city-structure
    plan: 01
    provides: "Portland City Council + Board of Public Education chambers + 18 skeletal offices (politician_id=NULL)"

provides:
  - "18 Portland city politicians seeded: Mayor Mark Dion + 8 City Council + 9 Board of Public Education"
  - "All 18 Portland offices populated (politician_id NOT NULL, is_vacant=false)"
  - "All 18 politicians office_id back-filled"
  - "Migration 178 (City Council incumbents) applied to live DB"
  - "Migration 179 (Board of Public Education incumbents) applied to live DB"

affects:
  - "phase-53-plan-03-headshots-landing"
  - "phase-54-portland-elections"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WITH ins_p CTE + fallback UPDATE idempotency pattern for politician seeding"
    - "Portland nonpartisan rule: party=NULL for all city council and school board politicians"
    - "External_id namespace -23601001..-23601018 for Portland city officials (geo_id prefix 23601)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/178_portland_council_incumbents.sql"
    - "C:/EV-Accounts/backend/migrations/179_portland_school_board_incumbents.sql"
  modified: []

key-decisions:
  - "Anna Bullett (District 4) CONFIRMED via Wikipedia Portland City Council (Maine) page — no replacement needed"
  - "At-Large seat assignment (council): Pious Ali=AL1, April Fournier=AL2, Benjamin Grant=AL3 (alphabetical-by-last-name ordering, consistent with migration 177)"
  - "At-Large seat assignment (school board): Maya Lena=AL1, Sarah Lentz=AL2, Usira Ali=AL3, Jayne Sawtelle=AL4 (alphabetical-by-last-name ordering, consistent with migration 177)"
  - "office title column (not seat_label) is the seat identifier — confirmed from DB: essentials.offices has NO seat_label column"
  - "All Portland city officials party=NULL — Portland elections are nonpartisan (locked rule)"

patterns-established:
  - "Portland city external_id namespace: -23601NNN (city geo_id prefix 23601 + 3-digit sequence)"

# Metrics
duration: 25min
completed: 2026-05-19
---

# Phase 53 Plan 02: Portland City Council + School Board Incumbents Summary

**18 Portland city politicians seeded across City Council (Mayor + 8) and Board of Public Education (9), all party=NULL (nonpartisan), linked to offices via migration 177 skeletal rows, with idempotent CTE pattern**

## Performance

- **Duration:** 25 min
- **Started:** 2026-05-19T~14:00Z
- **Completed:** 2026-05-19
- **Tasks:** 2 (write + apply migrations)
- **Files modified:** 2 migration files created

## Accomplishments

- Verified Anna Bullett as confirmed Portland City Council District 4 incumbent via Wikipedia
- Wrote and applied migration 178 (City Council: Mayor Dion + 8 councilors) — 9 politicians, 9 office UPDATEs, office_id back-fill
- Wrote and applied migration 179 (Board of Public Education: 9 members) — 9 politicians, 9 office UPDATEs, office_id back-fill
- All 18 Portland officials now visible via geo_id=2360545 lookup; both chambers 9/9 filled, 0 vacant

## Anna Bullett Verification

**Status: CONFIRMED — no replacement needed**

- **Method:** Wikipedia Portland City Council (Maine) page TOC + member list
- **Source URL:** https://en.wikipedia.org/wiki/Portland_City_Council_(Maine)
- **Result:** Anna Bullett confirmed as District 4 councilor (since 2023)
- **Note:** portlandmaine.gov uses CivicPlus CMS with JavaScript-rendered content — curl returns empty body; Wikipedia confirmed all 9 council names instead
- **All 9 council members confirmed:** Mark Dion (Mayor), Sarah Michniewicz (D1), Wesley Pelletier (D2), Regina Phillips (D3), Anna Bullett (D4), Kate Sykes (D5), Pious Ali (AL1), April Fournier (AL2), Benjamin Grant (AL3)

## Migration Output

### Migration 178 (first run)

```
BEGIN
UPDATE 1  (Mark Dion CTE → Mayor office)
UPDATE 0  (fallback — politician already created)
UPDATE 1  (Sarah Michniewicz CTE → D1 office)
UPDATE 0  (fallback)
UPDATE 1  (Wesley Pelletier CTE → D2 office)
UPDATE 0  (fallback)
UPDATE 1  (Regina Phillips CTE → D3 office)
UPDATE 0  (fallback)
UPDATE 1  (Anna Bullett CTE → D4 office)
UPDATE 0  (fallback)
UPDATE 1  (Kate Sykes CTE → D5 office)
UPDATE 0  (fallback)
UPDATE 1  (Pious Ali CTE → AL1 office)
UPDATE 0  (fallback)
UPDATE 1  (April Fournier CTE → AL2 office)
UPDATE 0  (fallback)
UPDATE 1  (Benjamin Grant CTE → AL3 office)
UPDATE 0  (fallback)
UPDATE 9  (office_id back-fill — all 9 council politicians)
COMMIT
```

### Migration 179 (first run)

```
BEGIN
UPDATE 1  (Maya Lena CTE → AL1 office)
UPDATE 0 ... (same pattern × 9)
UPDATE 9  (office_id back-fill — all 9 school board politicians)
COMMIT
```

### Idempotency check (both migrations re-run)

Both migrations produced all UPDATE 0 on re-run — fully idempotent.

## Verification Query Results

**Q1 — 18 politicians exist:**
```
 q1_count
----------
       18
```
PASS

**Q2 — all party=NULL:**
```
 q2_party_null
---------------
            18
```
PASS

**Q3 — all office_id back-filled (0 NULL):**
```
 q3_office_id_null
-------------------
                 0
```
PASS

**Q4 — all 18 Portland offices filled:**
```
           name            | total | filled | vacant
---------------------------+-------+--------+--------
 Board of Public Education |     9 |      9 |      0
 City Council              |     9 |      9 |      0
```
PASS

**Q5 — Mark Dion is Mayor:**
```
 full_name | title |   chamber
-----------+-------+--------------
 Mark Dion | Mayor | City Council
```
PASS

**Q6/Q7 — distinct party:**
```
 party
-------
 
(1 row — NULL)
```
PASS

**Q8 — City Council seat-by-seat:**
```
            title            |     full_name     | external_id
-----------------------------+-------------------+-------------
 Council Member (At-Large 1) | Pious Ali         |   -23601007
 Council Member (At-Large 2) | April Fournier    |   -23601008
 Council Member (At-Large 3) | Benjamin Grant    |   -23601009
 Council Member (District 1) | Sarah Michniewicz |   -23601002
 Council Member (District 2) | Wesley Pelletier  |   -23601003
 Council Member (District 3) | Regina Phillips   |   -23601004
 Council Member (District 4) | Anna Bullett      |   -23601005
 Council Member (District 5) | Kate Sykes        |   -23601006
 Mayor                       | Mark Dion         |   -23601001
```
PASS — 9 rows, all politicians non-NULL

**Q9 — School Board seat-by-seat:**
```
              title               |       full_name       | external_id
----------------------------------+-----------------------+-------------
 School Board Member (At-Large 1) | Maya Lena             |   -23601010
 School Board Member (At-Large 2) | Sarah Lentz           |   -23601011
 School Board Member (At-Large 3) | Usira Ali             |   -23601012
 School Board Member (At-Large 4) | Jayne Sawtelle        |   -23601013
 School Board Member (District 1) | Abusana "Micky" Bondo |   -23601014
 School Board Member (District 2) | Ali Ali               |   -23601015
 School Board Member (District 3) | Julianne Opperman     |   -23601016
 School Board Member (District 4) | Fatuma Noor           |   -23601017
 School Board Member (District 5) | Sarah Brydon          |   -23601018
```
PASS — 9 rows, all politicians non-NULL

**Orphan office check:**
```
 q9_orphan_offices
-------------------
                 0
```
PASS

**Q12 — End-to-end integration (18 rows active incumbents):**
```
       full_name       |              title               |          chamber
-----------------------+----------------------------------+---------------------------
 Maya Lena             | School Board Member (At-Large 1) | Board of Public Education
 Sarah Lentz           | School Board Member (At-Large 2) | Board of Public Education
 Usira Ali             | School Board Member (At-Large 3) | Board of Public Education
 Jayne Sawtelle        | School Board Member (At-Large 4) | Board of Public Education
 Abusana "Micky" Bondo | School Board Member (District 1) | Board of Public Education
 Ali Ali               | School Board Member (District 2) | Board of Public Education
 Julianne Opperman     | School Board Member (District 3) | Board of Public Education
 Fatuma Noor           | School Board Member (District 4) | Board of Public Education
 Sarah Brydon          | School Board Member (District 5) | Board of Public Education
 Pious Ali             | Council Member (At-Large 1)      | City Council
 April Fournier        | Council Member (At-Large 2)      | City Council
 Benjamin Grant        | Council Member (At-Large 3)      | City Council
 Sarah Michniewicz     | Council Member (District 1)      | City Council
 Wesley Pelletier      | Council Member (District 2)      | City Council
 Regina Phillips       | Council Member (District 3)      | City Council
 Anna Bullett          | Council Member (District 4)      | City Council
 Kate Sykes            | Council Member (District 5)      | City Council
 Mark Dion             | Mayor                            | City Council
(18 rows)
```
PASS

## Final 18-Row Portland Officials Table (for Plan 53-03 headshot pass)

| external_id | full_name | chamber | title |
|---|---|---|---|
| -23601001 | Mark Dion | City Council | Mayor |
| -23601002 | Sarah Michniewicz | City Council | Council Member (District 1) |
| -23601003 | Wesley Pelletier | City Council | Council Member (District 2) |
| -23601004 | Regina Phillips | City Council | Council Member (District 3) |
| -23601005 | Anna Bullett | City Council | Council Member (District 4) |
| -23601006 | Kate Sykes | City Council | Council Member (District 5) |
| -23601007 | Pious Ali | City Council | Council Member (At-Large 1) |
| -23601008 | April Fournier | City Council | Council Member (At-Large 2) |
| -23601009 | Benjamin Grant | City Council | Council Member (At-Large 3) |
| -23601010 | Maya Lena | Board of Public Education | School Board Member (At-Large 1) |
| -23601011 | Sarah Lentz | Board of Public Education | School Board Member (At-Large 2) |
| -23601012 | Usira Ali | Board of Public Education | School Board Member (At-Large 3) |
| -23601013 | Jayne Sawtelle | Board of Public Education | School Board Member (At-Large 4) |
| -23601014 | Abusana "Micky" Bondo | Board of Public Education | School Board Member (District 1) |
| -23601015 | Ali Ali | Board of Public Education | School Board Member (District 2) |
| -23601016 | Julianne Opperman | Board of Public Education | School Board Member (District 3) |
| -23601017 | Fatuma Noor | Board of Public Education | School Board Member (District 4) |
| -23601018 | Sarah Brydon | Board of Public Education | School Board Member (District 5) |

## At-Large Seat Mapping (for Phase 54+ continuity)

### City Council at-large seats
- **Council Member (At-Large 1)** → Pious Ali (external_id -23601007)
- **Council Member (At-Large 2)** → April Fournier (external_id -23601008)
- **Council Member (At-Large 3)** → Benjamin Grant (external_id -23601009)

Ordering: alphabetical-by-last-name (Ali, Fournier, Grant). Consistent with migration 177 at-large seat creation order.

### Board of Public Education at-large seats
- **School Board Member (At-Large 1)** → Maya Lena (external_id -23601010)
- **School Board Member (At-Large 2)** → Sarah Lentz (external_id -23601011)
- **School Board Member (At-Large 3)** → Usira Ali (external_id -23601012)
- **School Board Member (At-Large 4)** → Jayne Sawtelle (external_id -23601013)

Ordering: alphabetical-by-last-name (Lena, Lentz, Ali→Usira, Sawtelle). Consistent with migration 177 seat creation order.

**Important:** When a seat turns over, the new incumbent should be assigned to the same numbered seat (not renumbered). The office row UUID is stable; only politician_id changes.

## Decisions Made

1. Anna Bullett verification: Used Wikipedia (full list confirmed, including "since 2023") since portlandmaine.gov uses JavaScript-rendered CivicPlus CMS which returns empty body to curl. All 9 names cross-confirmed.
2. office title vs seat_label: Confirmed during pre-flight that `essentials.offices` has NO `seat_label` column. UPDATE WHERE clauses use `o.title` to match office rows. Exact titles obtained from DB query before writing SQL.
3. Migration pattern adaptation: Plan document showed `seat_label` in WHERE clauses; adapted to `title` column which is the actual seat identifier in the schema.

## Deviations from Plan

None - plan executed exactly as written, with one schema adaptation: `o.title` used in WHERE clauses instead of `o.seat_label` (which does not exist). This was called out as the correct approach in STATE.md ("Plan 53-02 UPDATE pattern: match on (chamber_id, title)").

## Issues Encountered

**portlandmaine.gov JavaScript rendering:** The Portland city website uses CivicPlus CMS which renders content via JavaScript — curl returns empty body. Used Wikipedia Portland City Council (Maine) page instead, which contains the full member list in static HTML. All 9 council names confirmed. School board verified from research (portlandschools.org, HIGH confidence).

## Next Phase Readiness

- Plan 53-03 (headshots + Landing.jsx) is fully unblocked
- All 18 politicians have UUIDs and are linked to office rows
- Portland is the first ME city with full incumbent coverage
- Next migration number is 180
- Headshot upload: 18 politicians need photos (politician UUIDs available via office lookup)

---
*Phase: 53-portland-city-structure*
*Completed: 2026-05-19*
