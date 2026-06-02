---
status: complete
phase: 87-ca-city-school-boards
source: [87-01-SUMMARY.md, 87-02-SUMMARY.md]
started: 2026-06-02T16:00:00Z
updated: 2026-06-02T16:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: The backend is running and the 34 newly-seeded CA school board officials are queryable from a cold start. A quick DB check (or health endpoint) returns live data without migration or startup errors.
result: skipped
reason: Testing on live production — migration 257 already applied, backend running on Render

### 2. SFUSD SCHOOL section
expected: Entering an address inside the SFUSD boundary (e.g., somewhere in San Francisco) shows a SCHOOL section on the Reps tab. It lists 7 officials with the title "Commissioner" — one for each of the 7 SFUSD board seats.
result: issue
reported: "SFUSD headshots are greyscale (B&W source photos). Officials' tiles are smaller than other sections — cascading layout effects. Title shows 'San Francisco Unified School District Board of Education' instead of 'Commissioner'."
severity: major

### 3. SDUSD SCHOOL section
expected: Entering an address inside the SDUSD boundary (somewhere in San Diego) shows a SCHOOL section listing 5 officials titled "Board Member (District A)" through "Board Member (District E)".
result: issue
reported: "Same title issue (shows chamber/government name instead of office title) and smaller tiles. Greyscale confirmed as a bug — validation boundary should prevent greyscale headshots from being accepted."
severity: major

### 4. SCUSD SCHOOL section
expected: Entering an address inside the Sacramento City USD boundary shows a SCHOOL section with 7 officials titled "Board Member (Area 1)" through "Board Member (Area 7)".
result: issue
reported: "Same title bug (shows 'Sacramento City Unified School District Board of Education') and smaller tiles. SCUSD headshots are color — no greyscale issue."
severity: major

### 5. SJUSD SCHOOL section
expected: Entering an address inside the SJUSD core boundary (southern/central San Jose) shows a SCHOOL section with 5 officials titled "Board Member (Trustee Area 1)" through "Board Member (Trustee Area 5)".
result: issue
reported: "Officials present, no headshots (expected). Tiles still small with no images — confirms size bug is CSS/layout, not image-driven. Section header and category name display 'San José' (with accent) while San Jose City Council shows 'San Jose' (no accent) — inconsistent spelling."
severity: major

### 6. FUSD SCHOOL section
expected: Entering an address inside the Fremont Unified SD boundary shows a SCHOOL section with 5 officials titled "Board Member (Area 1)" through "Board Member (Area 5)".
result: issue
reported: "No data returned for Fremont addresses — 'couldn't find any information'. FUSD officials are seeded but SCHOOL section never appears. Possible geofence routing failure for FUSD G5420 district."
severity: blocker

### 7. BUSD SCHOOL section
expected: Entering an address inside the Berkeley Unified SD boundary shows a SCHOOL section with 5 officials titled "Director" — using Berkeley's official term, not "Board Member".
result: issue
reported: "Same title bug and small tiles."
severity: major

### 8. Headshots on school board profiles
expected: Clicking through to a SFUSD, SDUSD (except Whitehurst-Payne), SCUSD, FUSD, or BUSD board member shows their headshot. SJUSD officials show no headshot (none available). Sharon Whitehurst-Payne (SDUSD District E) shows no headshot.
result: issue
reported: "SCUSD headshots display correctly in color. SFUSD headshots confirmed B&W/greyscale on profile pages."
severity: major

## Summary

total: 8
passed: 0
issues: 6
pending: 0
skipped: 1

## Gaps

- truth: "School board official tiles display at normal size matching other rep sections"
  status: failed
  reason: "User reported: tiles are smaller than other sections, cascading layout effects. Confirmed CSS/layout bug — SJUSD tiles are small even with NO headshots, ruling out image dimensions as the cause. Affects all districts."
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: "FUSD SCHOOL section appears for Fremont addresses"
  status: failed
  reason: "User reported: 'couldn't find any information' for multiple Fremont addresses. FUSD officials are seeded but SCHOOL routing never resolves — likely FUSD G5420 geofence not loaded or not matching."
  severity: blocker
  test: 6
  artifacts: []
  missing: []

- truth: "City name spelling is consistent across sections (San Jose)"
  status: failed
  reason: "User reported: SJUSD section header/category shows 'San José' (with accent) while San Jose City Council shows 'San Jose' (no accent). Seeded government name uses the accent per SJUSD's official name."
  severity: cosmetic
  test: 5
  artifacts: []
  missing: []

- truth: "School board officials show their office title (e.g. 'Commissioner', 'Board Member (District A)')"
  status: failed
  reason: "User reported: title shows chamber/government name ('San Francisco Unified School District Board of Education') instead of the office title. Affects SFUSD and SDUSD."
  severity: major
  test: 2
  artifacts: []
  missing: []

- truth: "Headshot upload pipeline rejects greyscale images — only color photos accepted"
  status: failed
  reason: "User reported: SFUSD headshots are greyscale (B&W source photos uploaded without validation). A boundary/check should prevent greyscale uploads — it was not enforced. SDUSD also affected."
  severity: major
  test: 2
  artifacts: []
  missing: []
