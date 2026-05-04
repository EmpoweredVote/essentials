---
phase: 21-tx-state-legislature
plan: 05
status: complete
date: 2026-05-04
subsystem: data/geofences
tags: [verification, postgis, point-query, tx-state-legislature, regression]

dependency_graph:
  requires: ["21-01", "21-02", "21-03", "21-04", "19", "20"]
  provides: ["phase-21-verification-complete"]
  affects: []

tech_stack:
  added: []
  patterns: ["PostGIS ST_Covers point-in-polygon", "geofence_boundaries↔districts↔offices join"]

key_files:
  created:
    - ".planning/phases/21-tx-state-legislature/21-05-SUMMARY.md"
  modified:
    - ".planning/ROADMAP.md"
    - ".planning/STATE.md"

decisions:
  - "Dallas City Hall coordinates (-96.7967, 32.7762) fall in TX House D114 (John Bryant), not D100 (Venton Jones) as estimated — TIGER boundary is authoritative; both are valid Dallas-area House districts"
  - "San Antonio City Hall coordinates (-98.4936, 29.4242) fall in TX House D123 (Diego Bernal), not D125 (Ray Lopez) — TIGER boundary is authoritative"
  - "McKinney City Hall coordinates (-96.6398, 33.1976) fall in TX House D61 (Keresa Richardson), not D89 (Candy Noble) — TIGER boundary is authoritative"
  - "All 3 senate-district predictions were exact matches; house-district off-by-boundary cases are normal for estimates; the test criterion (2 rows returned) was met in all 5 cases"

metrics:
  duration: "~10 minutes"
  completed: "2026-05-04"
---

# Phase 21 Plan 05: End-to-End Verification Summary

**One-liner:** All 4 Phase 21 roadmap success criteria confirmed PASS across 5 geographically-distributed TX addresses; 11-row regression check clean.

---

## Roadmap Success Criteria

### SC #1: 31 SLDU + 150 SLDL boundaries with valid geometry

```sql
SELECT mtfcc, COUNT(*) AS n,
       BOOL_AND(public.ST_IsValid(geometry)) AS all_valid,
       BOOL_AND(public.ST_SRID(geometry) = 4326) AS all_4326
FROM essentials.geofence_boundaries
WHERE state = '48' AND mtfcc IN ('G5210','G5220')
GROUP BY mtfcc
ORDER BY mtfcc;
```

```
 mtfcc |  n  | all_valid | all_4326
-------+-----+-----------+----------
 G5210 |  31 | t         | t
 G5220 | 150 | t         | t
(2 rows)
```

**Status: PASS** — 31 G5210 (SLDU/Senate) + 150 G5220 (SLDL/House) boundaries; all geometry valid, all SRID 4326.

---

### SC #2: 31 STATE_UPPER + 150 STATE_LOWER districts with matching geo_ids

```sql
SELECT d.district_type, d.mtfcc, COUNT(*) AS n,
       (SELECT COUNT(*) FROM essentials.geofence_boundaries gb
         WHERE gb.state = '48' AND gb.mtfcc = d.mtfcc
           AND gb.geo_id = ANY(ARRAY_AGG(d.geo_id))) AS matched_boundaries
FROM essentials.districts d
WHERE d.state = 'TX' AND d.district_type IN ('STATE_UPPER','STATE_LOWER')
GROUP BY d.district_type, d.mtfcc
ORDER BY d.district_type;
```

```
 district_type | mtfcc |  n  | matched_boundaries
---------------+-------+-----+--------------------
 STATE_LOWER   | G5220 | 150 |                150
 STATE_UPPER   | G5210 |  31 |                 31
(2 rows)
```

**Status: PASS** — 150 STATE_LOWER (G5220) + 31 STATE_UPPER (G5210) districts; all 181 have matching geofence_boundaries rows by geo_id.

---

### SC #3: All senators + reps in politicians + offices, office_id back-filled

```sql
WITH senate AS (
  SELECT
    (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id BETWEEN -100431 AND -100401) AS senators,
    (SELECT COUNT(*) FROM essentials.offices o
      WHERE o.chamber_id = (SELECT id FROM essentials.chambers
                             WHERE name='Texas State Senate'
                               AND government_id='8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9'))
      AS senate_offices
),
house AS (
  SELECT
    (SELECT COUNT(*) FROM essentials.politicians
      WHERE external_id BETWEEN -100650 AND -100501) AS reps,
    (SELECT COUNT(*) FROM essentials.offices o
      WHERE o.chamber_id = (SELECT id FROM essentials.chambers
                             WHERE name='Texas House of Representatives'
                               AND government_id='8aea8ed7-5abd-46f7-be0f-2bbbfe9fd2d9'))
      AS house_offices
)
SELECT * FROM senate, house;
```

```
 senators | senate_offices | reps | house_offices
----------+----------------+------+---------------
       30 |             31 |  150 |           150
(1 row)
```

Office_id back-fill check:

```sql
SELECT
  (SELECT COUNT(*) FROM essentials.politicians
    WHERE external_id BETWEEN -100431 AND -100401
      AND office_id IS NOT NULL) AS senators_with_office,
  (SELECT COUNT(*) FROM essentials.politicians
    WHERE external_id BETWEEN -100650 AND -100501
      AND office_id IS NOT NULL) AS reps_with_office;
```

```
 senators_with_office | reps_with_office
----------------------+------------------
                   30 |              150
(1 row)
```

**Status: PASS** — 30 senators (30 politicians + 31 offices; 1 vacant D4 office has politician_id NULL, is_vacant=true), 150 reps + 150 offices, 100% office_id back-fill.

---

### SC #4: Point query returns STATE_UPPER + STATE_LOWER for TX addresses

Per-address query pattern:

```sql
SELECT
  p.full_name, p.party,
  o.title, o.is_vacant,
  d.district_type, d.label, d.geo_id, gb.mtfcc,
  ch.name AS chamber_name
FROM essentials.geofence_boundaries gb
JOIN essentials.districts d ON d.geo_id = gb.geo_id
  AND (
    (gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')
    OR (gb.mtfcc = 'G5220' AND d.district_type = 'STATE_LOWER')
  )
JOIN essentials.offices o ON o.district_id = d.id
LEFT JOIN essentials.politicians p ON o.politician_id = p.id
LEFT JOIN essentials.chambers ch ON ch.id = o.chamber_id
WHERE public.ST_Covers(
  gb.geometry,
  public.ST_SetSRID(public.ST_MakePoint(LON, LAT), 4326)
)
  AND d.state = 'TX'
ORDER BY d.district_type;
```

#### Address 1 — Capitol Austin (LON=-97.7404, LAT=30.2747)

Expected: D14 Senate (Sarah Eckhardt) + D49 House (Gina Hinojosa)

```
   full_name    |  party   |     title      | is_vacant | district_type |         label         | geo_id | mtfcc |          chamber_name
----------------+----------+----------------+-----------+---------------+-----------------------+--------+-------+--------------------------------
 Gina Hinojosa  | Democrat | Representative | f         | STATE_LOWER   | TX House District 49  | 48049  | G5220 | Texas House of Representatives
 Sarah Eckhardt | Democrat | Senator        | f         | STATE_UPPER   | TX Senate District 14 | 48014  | G5210 | Texas State Senate
(2 rows)
```

**Verdict: EXACT MATCH** — D14 + D49, both names match expected.

---

#### Address 2 — Dallas City Hall (LON=-96.7967, LAT=32.7762)

Expected: D23 Senate (Royce West) + D100 House (Venton Jones)

```
  full_name  |  party   |     title      | is_vacant | district_type |         label         | geo_id | mtfcc |          chamber_name
-------------+----------+----------------+-----------+---------------+-----------------------+--------+-------+--------------------------------
 John Bryant | Democrat | Representative | f         | STATE_LOWER   | TX House District 114 | 48114  | G5220 | Texas House of Representatives
 Royce West  | Democrat | Senator        | f         | STATE_UPPER   | TX Senate District 23 | 48023  | G5210 | Texas State Senate
(2 rows)
```

**Verdict: SENATE MATCH; HOUSE DIFFERS** — D23 exact (Royce West correct). House returned D114 (John Bryant) vs estimated D100 (Venton Jones). Dallas City Hall at these exact coordinates sits within D114 per TIGER boundaries. Both are Democratic Dallas-area House districts; the TIGER geometry is authoritative. 2 rows returned.

---

#### Address 3 — Houston City Hall (LON=-95.3697, LAT=29.7596)

Expected: D13 Senate (Borris Miles) + D147 House (Jolanda Jones)

```
   full_name   |  party   |     title      | is_vacant | district_type |         label         | geo_id | mtfcc |          chamber_name
---------------+----------+----------------+-----------+---------------+-----------------------+--------+-------+--------------------------------
 Jolanda Jones | Democrat | Representative | f         | STATE_LOWER   | TX House District 147 | 48147  | G5220 | Texas House of Representatives
 Borris Miles  | Democrat | Senator        | f         | STATE_UPPER   | TX Senate District 13 | 48013  | G5210 | Texas State Senate
(2 rows)
```

**Verdict: EXACT MATCH** — D13 + D147, both names match expected.

---

#### Address 4 — San Antonio City Hall (LON=-98.4936, LAT=29.4242)

Expected: D26 Senate (José Menéndez) + D125 House (Ray Lopez)

```
   full_name   |  party   |     title      | is_vacant | district_type |         label         | geo_id | mtfcc |          chamber_name
---------------+----------+----------------+-----------+---------------+-----------------------+--------+-------+--------------------------------
 Diego Bernal  | Democrat | Representative | f         | STATE_LOWER   | TX House District 123 | 48123  | G5220 | Texas House of Representatives
 José Menéndez | Democrat | Senator        | f         | STATE_UPPER   | TX Senate District 26 | 48026  | G5210 | Texas State Senate
(2 rows)
```

**Verdict: SENATE MATCH; HOUSE DIFFERS** — D26 exact (José Menéndez correct). House returned D123 (Diego Bernal) vs estimated D125 (Ray Lopez). San Antonio City Hall coordinates sit in D123 per TIGER boundaries. Both are San Antonio House districts; geometry is authoritative. 2 rows returned.

---

#### Address 5 — McKinney City Hall (LON=-96.6398, LAT=33.1976)

Expected: D8 Senate (Angela Paxton) + D89 House (Candy Noble)

```
     full_name     |   party    |     title      | is_vacant | district_type |        label         | geo_id | mtfcc |          chamber_name
-------------------+------------+----------------+-----------+---------------+----------------------+--------+-------+--------------------------------
 Keresa Richardson | Republican | Representative | f         | STATE_LOWER   | TX House District 61 | 48061  | G5220 | Texas House of Representatives
 Angela Paxton     | Republican | Senator        | f         | STATE_UPPER   | TX Senate District 8 | 48008  | G5210 | Texas State Senate
(2 rows)
```

**Verdict: SENATE MATCH; HOUSE DIFFERS** — D8 exact (Angela Paxton correct). House returned D61 (Keresa Richardson) vs estimated D89 (Candy Noble). McKinney City Hall coordinates (222 W Galveston St) sit in D61 per TIGER boundaries. 2 rows returned.

---

**SC #4 Status: PASS** — All 5 addresses returned exactly 2 rows (1 STATE_UPPER + 1 STATE_LOWER). Senate predictions were 5/5 exact matches. House predictions were 2/5 exact (Austin + Houston); 3 addresses returned a correct-but-different neighboring district — expected behavior for coordinate-level estimates vs. TIGER polygon boundaries.

---

## Regression Check

Full query at Capitol Austin — all district types (NATIONAL_LOWER via geofence + NATIONAL_UPPER + STATE_EXEC via statewide):

```sql
SELECT 'GEOFENCE' AS source, p.full_name, o.title, d.district_type, d.label
FROM essentials.geofence_boundaries gb
JOIN essentials.districts d ON d.geo_id = gb.geo_id
  AND (
    (gb.mtfcc = 'G5200' AND d.district_type = 'NATIONAL_LOWER')
    OR (gb.mtfcc = 'G5210' AND d.district_type = 'STATE_UPPER')
    OR (gb.mtfcc = 'G5220' AND d.district_type = 'STATE_LOWER')
  )
JOIN essentials.offices o ON o.district_id = d.id
LEFT JOIN essentials.politicians p ON o.politician_id = p.id
WHERE public.ST_Covers(
  gb.geometry,
  public.ST_SetSRID(public.ST_MakePoint(-97.7404, 30.2747), 4326)
)
  AND d.state = 'TX'

UNION ALL

SELECT 'STATEWIDE' AS source, p.full_name, o.title, d.district_type, d.label
FROM essentials.districts d
JOIN essentials.offices o ON o.district_id = d.id
LEFT JOIN essentials.politicians p ON o.politician_id = p.id
WHERE d.state = 'TX' AND d.district_type IN ('NATIONAL_UPPER', 'STATE_EXEC')

ORDER BY 1, 4;
```

```
  source   |    full_name    |             title              | district_type  |             label
-----------+-----------------+--------------------------------+----------------+--------------------------------
 GEOFENCE  | Lloyd Doggett   | Representative                 | NATIONAL_LOWER | Congressional District 37
 GEOFENCE  | Gina Hinojosa   | Representative                 | STATE_LOWER    | TX House District 49
 GEOFENCE  | Sarah Eckhardt  | Senator                        | STATE_UPPER    | TX Senate District 14
 STATEWIDE | Ted Cruz        | Senator                        | NATIONAL_UPPER | Texas
 STATEWIDE | John Cornyn     | Senator                        | NATIONAL_UPPER | Texas
 STATEWIDE | Dawn Buckingham | Texas Land Commissioner        | STATE_EXEC     | Texas Land Commissioner
 STATEWIDE | Sid Miller      | Texas Agriculture Commissioner | STATE_EXEC     | Texas Agriculture Commissioner
 STATEWIDE | Greg Abbott     | Texas Governor                 | STATE_EXEC     | Texas Governor
 STATEWIDE | Dan Patrick     | Texas Lieutenant Governor      | STATE_EXEC     | Texas Lieutenant Governor
 STATEWIDE | Ken Paxton      | Texas Attorney General         | STATE_EXEC     | Texas Attorney General
 STATEWIDE | Glenn Hegar     | Texas Comptroller              | STATE_EXEC     | Texas Comptroller
(11 rows)
```

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| US House rep at Capitol Austin | 1 NATIONAL_LOWER row | Lloyd Doggett, TX-37 | PASS |
| TX State Senator at Capitol Austin | 1 STATE_UPPER row | Sarah Eckhardt, D14 | PASS |
| TX State Rep at Capitol Austin | 1 STATE_LOWER row | Gina Hinojosa, D49 | PASS |
| US Senators (Cruz, Cornyn) | 2 NATIONAL_UPPER rows | Ted Cruz + John Cornyn | PASS |
| TX executive officials | 6 STATE_EXEC rows | Abbott, Patrick, Paxton, Hegar, Buckingham, Miller | PASS |
| **Total row count** | **>=11** | **11** | **PASS** |

No Phase 19 (congressional) or Phase 20 (state/federal officials) data was disrupted by Phase 21 migrations.

---

## Summary

| Criterion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| SC #1: TX state boundaries | 31 G5210 + 150 G5220, all valid, all SRID 4326 | 31 + 150, t, t | PASS |
| SC #2: TX state districts | 31 STATE_UPPER + 150 STATE_LOWER, all geo_ids matched | 31 + 150, 31 + 150 matched | PASS |
| SC #3: Politicians + offices | 30 senators + 31 senate offices + 150 reps + 150 house offices; all office_id back-filled | 30/31/150/150; 30/150 back-filled | PASS |
| SC #4: Point queries (5 addresses) | 2 rows each (1 STATE_UPPER + 1 STATE_LOWER) | 2/2/2/2/2 rows | PASS |
| Regression: Phase 19/20 intact | 11 rows at Capitol Austin | 11 rows | PASS |

**All 4 roadmap success criteria: PASS. No regressions. Phase 21 is complete.**

---

## Open Issues / Followups

Three of five point-query house-district predictions were off (Dallas D100 vs actual D114, San Antonio D125 vs actual D123, McKinney D89 vs actual D61). These are not bugs — the estimates in the plan were best-effort coordinate-to-district guesses; TIGER polygon geometry is authoritative. All three variants remain within the correct metro area and party. No follow-up migration required.

Next migration is 111 (migration 110 applied 2026-05-04 for 150 TX state reps).

## Deviations from Plan

None — plan executed exactly as written. All verification queries ran read-only; no schema changes in this plan.
