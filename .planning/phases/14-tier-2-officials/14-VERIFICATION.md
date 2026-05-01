---
status: passed
phase: 14-tier-2-officials
verified: 2026-05-01
score: 3/3 must-haves verified
---

# Phase 14 Verification Report

**Phase Goal:** All incumbent mayor and council members for the six Tier 2 cities (Allen, Frisco, Murphy, Celina, Prosper, Richardson) are in the database, linked to their office rows.
**Verified:** 2026-05-01
**Status:** PASSED
**Re-verification:** No — initial verification

## Result: PASSED

All three success criteria met. 42 active incumbent politicians across 6 cities, all linked to valid office rows, all with contact info (email or bio URL).

## Must-Haves Checked

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | Incumbent rows for all 6 cities (7 each, 42 total) | VERIFIED | Query 1: exactly 6 rows, each with active_incumbents = 7 |
| 2 | All rows linked via office_id + back-link | VERIFIED | Query 2: total_rows = has_office_id = has_back_link = 7 for all cities |
| 3 | Contact info (email or bio URL) for every row | VERIFIED | Query 3: has_contact = 7 for all cities (100% coverage) |

## City Breakdown

| City | Incumbents | Office Links | Back-links | Email | Bio URL |
|------|------------|--------------|------------|-------|---------|
| Allen | 7 | 7/7 | 7/7 | 7/7 | 7/7 |
| Celina | 7 | 7/7 | 7/7 | 1/7 | 7/7 |
| Frisco | 7 | 7/7 | 7/7 | 0/7 | 7/7 |
| Murphy | 7 | 7/7 | 7/7 | 0/7 | 7/7 |
| Richardson | 7 | 7/7 | 7/7 | 7/7 | 7/7 |
| Prosper | 7 | 7/7 | 7/7 | 0/7 | 7/7 |

## Spot-Check: All 42 Rows

**Allen (data_source: cityofallen.org)**
Mayor: Baine Brooks | CM Place 1: Michael Schaeffer | Place 2: Tommy Baril | Place 3: Ken Cook | Place 4: Amy Gnadt | Place 5: Carl Clemencich | Place 6: Ben Trahan

**Celina (data_source: celina-tx.gov)**
Mayor: Ryan Tubbs | CM Place 1: Philip Ferguson | Place 2: Eddie Cawlfield | Place 3: Andy Hopkins | Place 4: Wendie Wigginton | Place 5: Mindy Koehne | Place 6: Brandon Grumbles

**Frisco (data_source: friscotexas.gov)**
Mayor: Jeff Cheney | CM Place 1: Ann Anderson | Place 2: Burt Thakur | Place 3: Angelia Pelham | Place 4: Jared Elad | Place 5: Laura Rummel | Place 6: Brian Livingston

**Murphy (data_source: murphytx.org)**
Mayor: Scott Bradley | CM Place 1: Elizabeth Abraham | Place 2: Scott Smith | Place 3: Andrew Chase | Place 4: Ken Oltmann | Place 5: Laura Deel | Place 6: Jené Butler

**Prosper (data_source: prospertx.gov)**
Mayor: David F. Bristol | CM Place 1: Marcus E. Ray | Place 2: Craig Andres | Place 3: Amy Bartley | Place 4: Chris Kern | Place 5: Jeff Hodges | Place 6: Cameron Reeves

**Richardson (data_source: cor.net)**
Mayor: Amir Omar | CM District 1: Curtis Dorian | District 2: Jennifer Justice | District 3: Dan Barrios | District 4: Joe Corcoran | Place 5: Ken Hutchenrider | Place 6: Arefin Shamsul

## Notable Items

- **Email coverage varies by city:** Allen and Richardson have direct email addresses for all 7 incumbents; Celina has 1; Frisco, Murphy, and Prosper have none. All rows still satisfy criterion 3 because every row has a bio URL. Email gaps reflect city website policy (no public direct emails listed), not a data loading failure.
- **Richardson seat structure:** Districts 1–4 use district-based titles; Places 5–6 use place-based titles. This matches Richardson's actual hybrid council structure and is correctly modeled in the offices table.
- **Prosper is a Town, not a City:** Stored as "Town of Prosper, Texas, US" — correct per official designation.
- **All party fields are empty:** Expected for nonpartisan local Texas municipal races; not a gap.
- **is_active and is_incumbent both true for all 42 rows:** Confirmed via Query 1 filter.

## Conclusion

Phase 14 goal is fully achieved. All 42 incumbent politician rows (7 per city × 6 cities) exist in `essentials.politicians` with `is_active = true` and `is_incumbent = true`. Every row is linked to a valid `essentials.offices` row via `office_id` with the back-link (`offices.politician_id`) also set. Contact coverage is 100% — all rows have at minimum a bio URL sourced from each city's official website.

---

_Verified: 2026-05-01_
_Verifier: Claude (gsd-verifier)_
