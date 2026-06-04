---
status: complete
phase: 88-tx-collin-county-school-boards
source: 88-01-SUMMARY.md, 88-02-SUMMARY.md
started: 2026-06-03T00:00:00Z
updated: 2026-06-03T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: skipped
reason: User tests on live production; server already running with migrations applied.

### 2. Plano ISD Routing
expected: Enter a Plano TX address (e.g. inside Plano city limits). The Representatives tab shows a "Plano Independent School District" section with 7 board members listed, titled "Board Member, Place 1" through "Board Member, Place 7".
result: issue
reported: "The Plano Independent school district people are all there, but they should be ordered by their place name Place 1, Place 2, Place 3, etc. Not by alphabetical. Also, the Mayor (John Muns) should be first in his section."
severity: major

### 3. McKinney ISD Routing
expected: Enter a McKinney TX address. The Representatives tab shows "McKinney Independent School District" with 7 board members, Place 1-7 titles. Six of seven members have headshot photos. Roxane Morrison (Place 4) appears without a photo but is still listed correctly.
result: issue
reported: "Both of the same concerns, the Board Members aren't in 'place #' order and should be and the mayor is not first."
severity: major

### 4. Allen ISD — No Headshots Acceptable
expected: Enter an Allen TX address. The Representatives tab shows "Allen Independent School District" with 7 board members listed (Place 1-7 titles). None of the 7 members have headshot photos — this is expected and acceptable; members still display with name and title.
result: issue
reported: "same issues - I don't even see a mayor at all for Allen."
severity: major

### 5. Frisco ISD Routing and Headshots
expected: Enter a Frisco TX address (e.g. Frisco city limits in Collin County). The Representatives tab shows "Frisco Independent School District" with 7 board members, all with headshot photos rendering correctly.
result: issue
reported: "same issues frisco City Council is called 'Council Place 3' instead of 'Frisco City Council', Mayor isn't first, and the Place #'s don't dictate order."
severity: major

### 6. Richardson ISD — Hybrid District/Place Titles
expected: Enter a Richardson TX address (or a Dallas-Collin overlap address inside Richardson ISD). The Representatives tab shows "Richardson Independent School District" with 7 board members. Board Members for seats 1-5 are titled "Board Member, District 1" through "District 5". Seats 6-7 are titled "Board Member, Place 6" and "Board Member, Place 7". All 7 have headshot photos.
result: issue
reported: "same issues, plus all of the pictures for the board members have a circle crop - white corner edges. None of these pictures work - no crops. Also, mayor isn't first and both the City Council and School district should be in order based on the number in the titles."
severity: major

### 7. Debbie Renteria — Accented Name Display
expected: In the Richardson ISD board section, the accented character in "Renteria" displays correctly rendered (not garbled). The name also appears correctly in any search or profile context.
result: pass
note: Name displays with correct accented i (i with acute). SUMMARY incorrectly documented the accented character as e — the actual Spanish spelling Renteria uses i-acute, confirmed correct in UI.

## Summary

total: 7
passed: 1
issues: 6
pending: 0
skipped: 1
blocked: 0

## Gaps

- truth: "School board members ordered by place/district number (Place 1, Place 2, ... Place 7)"
  status: failed
  reason: "User reported: The Plano Independent school district people are all there, but they should be ordered by their place name Place 1, Place 2, Place 3, etc. Not by alphabetical."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Mayor appears first in city government section"
  status: failed
  reason: "User reported: The Mayor, John Muns, should also be first (Plano/McKinney). Allen has no mayor showing at all."
  severity: major
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Allen TX address returns city mayor/council members"
  status: failed
  reason: "User reported: I don't even see a mayor at all for Allen."
  severity: major
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Frisco city council section labeled 'Frisco City Council'"
  status: failed
  reason: "User reported: Frisco City Council is called 'Council Place 3' instead of 'Frisco City Council'."
  severity: major
  test: 5
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "School board headshots display as rectangular photos without circular cropping"
  status: failed
  reason: "User reported: all of the pictures for the board members have a circle crop - white corner edges. None of these pictures work - no crops."
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
