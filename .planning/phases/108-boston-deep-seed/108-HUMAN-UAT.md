---
status: partial
phase: 108-boston-deep-seed
source: [108-VERIFICATION.md]
started: 2026-06-10
updated: 2026-06-10
---

## Current Test

[awaiting human testing]

## Tests

### 1. Boston address → LOCAL section routing
expected: A Boston citywide address returns Mayor Wu (LOCAL_EXEC) + the correct district councillor + all 4 at-large councillors in the LOCAL section
result: [pending]

### 2. Boston address → SCHOOL section routing
expected: A Boston address returns all 7 BPS School Committee members in the SCHOOL section (is_appointed=true)
result: [pending]

### 3. Council district routing accuracy
expected: Test 3+ different Boston district addresses and confirm each returns the correct per-district councillor (e.g., South Boston/District 2 → Edward M. Flynn)
result: [pending]

### 4. Headshot visual rendering
expected: All 14 council officials display a 600×750 headshot with no distortion; School Committee members show no photo (documented gap)
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
