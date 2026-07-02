---
status: partial
phase: 177-city-of-hillsboro-deep-seed
source: [177-VERIFICATION.md]
started: 2026-07-02T15:50:00Z
updated: 2026-07-02T15:50:00Z
---

## Current Test

[awaiting human testing — pending frontend deploy of essentials commit 2619363]

## Tests

### 1. Roster ordering and completeness on live browse
expected: https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110 shows Mayor Beach Pace FIRST, followed by all 6 councilors (Salgado, Anvery, Sinclair, Case, Alcaire, Harris); no empty LOCAL section; no split/duplicated council sections
result: [pending]

### 2. Headshots, stances, and antipartisan display
expected: all 7 officials render 600×750 headshots with no text/graphic overlays; compass stances visible on profiles (60 rows total across the roster); NO party label anywhere
result: [pending]

### 3. Community banner renders
expected: the Local section shows the Hillsboro community banner (Orenco Station Plaza / MAX train photo), not the tier-gradient fallback — confirms representing_city='Hillsboro' resolves the CURATED_LOCAL 'hillsboro' key
result: [pending]

### 4. Purple hasContext chip
expected: Hillsboro appears in the Oregon coverage list with the purple hasContext chip
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
