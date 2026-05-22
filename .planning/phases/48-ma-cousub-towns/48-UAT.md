---
status: diagnosed
phase: 48-ma-cousub-towns
source: 48-01-SUMMARY.md, 48-02-SUMMARY.md
started: 2026-05-18T00:00:00Z
updated: 2026-05-18T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Lexington MA address returns officials
expected: Enter a Lexington MA address (e.g. "1 Meriam St, Lexington, MA"). The results page should load and show state + federal officials for Lexington: at minimum a US House rep (Congressional District 5 — Katherine Clark), MA state senator (Fourth Middlesex), and MA state house rep (15th Middlesex). No error or empty results screen.
result: pass
note: "User confirmed 21st Middlesex (Kenneth Gordon) shown — correct for that address; smoke test center hit 15th Middlesex but Lexington spans multiple districts"

### 2. Concord MA address returns officials
expected: Enter a Concord MA address (e.g. "50 Main St, Concord, MA"). The results page should load and show state + federal officials for Concord: at minimum a US House rep (Congressional District 3 — Lori Trahan), MA state senator (Third Middlesex), and MA state house rep (13th Middlesex). No error or empty results screen.
result: pass
note: "User confirmed 14th Middlesex shown — correct for that address; smoke test center hit 13th Middlesex but Concord spans multiple districts"

### 3. Cambridge address unchanged (regression)
expected: Enter a Cambridge MA address (e.g. "1 Harvard Sq, Cambridge, MA"). Results should still load correctly with Cambridge city councillors, state + federal officials. This verifies the new G4040 COUSUB layer didn't break the existing G4110 Cambridge city routing.
result: issue
reported: "No, failed. I'm certain we have local information, but no local rep data is available for this area."
severity: major

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Cambridge address returns city councillors alongside state + federal officials"
  status: failed
  reason: "User reported: No, failed. I'm certain we have local information, but no local rep data is available for this area."
  severity: major
  test: 3
  root_cause: "Cambridge offices have district_id=NULL (never set in migrations 158/159). getRepresentativesByAddress in essentialsService.ts line 579 uses INNER JOIN offices o ON o.district_id = d.id — NULL district_id silently drops all Cambridge officials. Browse mode works because getPoliticiansByGovernmentList joins governments→chambers→offices directly without needing district_id."
  artifacts:
    - path: "C:/EV-Accounts/backend/migrations/158_cambridge_offices.sql"
      issue: "17 Cambridge office rows inserted with no district_id set"
    - path: "C:/EV-Accounts/backend/src/lib/essentialsService.ts"
      issue: "line 579 INNER JOIN on district_id silently drops NULL-district_id offices"
  missing:
    - "INSERT row into essentials.districts for geo_id='2511000' (LOCAL, G4110, Cambridge)"
    - "UPDATE all Cambridge offices SET district_id = <new_uuid>"
  debug_session: ".planning/debug/cambridge-locals-missing.md"
