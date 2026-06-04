---
status: complete
phase: 89-in-me-school-board-completion
source: [89-01-SUMMARY.md, 89-02-SUMMARY.md, 89-03-SUMMARY.md]
started: 2026-06-04T00:00:00Z
updated: 2026-06-04T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. IPS — Indianapolis school board routing
expected: Enter an Indianapolis address inside IPS territory (e.g. 120 E Walnut St, Indianapolis IN). A SCHOOL section appears with Indianapolis Public Schools board members — 7 seats (D1-D5 + 2 At-Large). All show placeholder avatars (no headshots — expected).
result: pass
note: "5 of 7 IPS members have pre-existing headshots from earlier phases. D3 (Hope Duke Star) and D2 (Hasaan Rashid) show placeholders as expected."

### 2. MCCSC — Monroe County school board routing
expected: Enter a Bloomington/Monroe County address (e.g. 401 N Morton St, Bloomington IN). A SCHOOL section appears with Monroe County Community School Corporation board members — 7 seats. Placeholder avatars shown (no headshots — expected).
result: pass
note: "6 of 7 MCCSC members have pre-existing headshots. D7 (Aja Jester) shows placeholder as expected."

### 3. Lewiston ME school board
expected: Enter a Lewiston ME address (e.g. 27 Pine St, Lewiston ME). A SCHOOL section appears with Lewiston Public Schools board — 7 named members + 1 VACANT Ward 5 slot. Placeholder avatars for all.
result: pass

### 4. Bangor ME school board
expected: Enter a Bangor ME address (e.g. 73 Harlow St, Bangor ME). A SCHOOL section appears with Bangor School Committee — 7 members including Sara Luciano. Placeholder avatars for all.
result: pass

### 5. South Portland ME school board
expected: Enter a South Portland ME address (e.g. 25 Cottage Rd, South Portland ME). A SCHOOL section appears with South Portland School Department board — 6 named members + 1 VACANT District 5 (Dowling resigned April 2026). Placeholder avatars for all.
result: pass

### 6. Auburn ME school board
expected: Enter an Auburn ME address (e.g. 60 Court St, Auburn ME). A SCHOOL section appears with Auburn School Department board — 8 members. Placeholder avatars for all.
result: pass
note: "School board correct. Separate issue observed: Auburn City Council ward ordering appears wrong (wards out of numeric order). Outside Phase 89 scope — logged as gap."

### 7. Biddeford ME school board
expected: Enter a Biddeford ME address (e.g. 205 Main St, Biddeford ME). A SCHOOL section appears with Biddeford School Department board — 7 members. Placeholder avatars for all.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

- truth: "Auburn City Council ward members appear in correct numeric order by ward number"
  status: observed
  reason: "User reported ward ordering appears wrong on Auburn city council section (outside Phase 89 scope — city council, not school board)"
  severity: minor
  test: 6
  scope: "outside-phase — pre-existing city council data, not Phase 89 school board deliverable"
