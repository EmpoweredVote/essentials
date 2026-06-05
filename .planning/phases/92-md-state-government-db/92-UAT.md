---
status: complete
phase: 92-md-state-government-db
source:
  - .planning/phases/92-md-state-government-db/92-01-SUMMARY.md
  - .planning/phases/92-md-state-government-db/92-02-SUMMARY.md
started: 2026-06-05T00:00:00Z
updated: 2026-06-05T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test — Headshot Script Idempotency
expected: |
  Run updated script (psycopg2 rewrite). All 5 officials skipped, exits 0.
result: pass

### 2. MD Chambers Seeded
expected: |
  5 rows under State of Maryland: Attorney General, Comptroller, Governor,
  Lieutenant Governor, State Treasurer — with correct name_formal values.
result: pass

### 3. MD Politicians and Offices
expected: |
  5 politicians external_id -240001..-240005, all with office_id non-null.
  Davis (−240005) only one with is_appointed_position=true.
result: pass

### 4. Headshots Accessible in Storage
expected: |
  All 5 headshot URLs return HTTP 200.
result: pass

### 5. Lieutenant Governor Has Standalone Chamber
expected: |
  Moore → "Governor" chamber, Miller → "Lieutenant Governor" chamber (distinct).
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
