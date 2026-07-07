---
status: complete
phase: 177-city-of-hillsboro-deep-seed
source: [177-VERIFICATION.md]
started: 2026-07-02T15:50:00Z
updated: 2026-07-03T00:25:00Z
---

## Current Test

[all tests complete — verified live 2026-07-02 after Netlify deploy of main@583ed6f (includes 2619363)]

## Tests

### 1. Roster ordering and completeness on live browse
expected: https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110 shows Mayor Beach Pace FIRST, followed by all 6 councilors (Salgado, Anvery, Sinclair, Case, Alcaire, Harris); no empty LOCAL section; no split/duplicated council sections
result: PASS — Playwright post-deploy: Beach Pace first, then Anvery, Salgado, Case, Sinclair, Alcaire, Harris; single City of Hillsboro section, no split

### 2. Headshots, stances, and antipartisan display
expected: all 7 officials render 600×750 headshots with no text/graphic overlays; compass stances visible on profiles (60 rows total across the roster); NO party label anywhere
result: PASS — all 7 portraits loaded from CDN (naturalWidth > 0); compass "Compare your views" chips present on cards; zero party strings anywhere in page text

### 3. Community banner renders
expected: the Local section shows the Hillsboro community banner (Orenco Station Plaza / MAX train photo), not the tier-gradient fallback — confirms representing_city='Hillsboro' resolves the CURATED_LOCAL 'hillsboro' key
result: PASS — live page renders img src cities/hillsboro.jpg (no gradient fallback)

### 4. Purple hasContext chip
expected: Hillsboro appears in the Oregon coverage list with the purple hasContext chip
result: PASS — Hillsboro chip carries the purple hasContext classes (bg-purple-100/text-purple-700) in the Oregon coverage list

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
