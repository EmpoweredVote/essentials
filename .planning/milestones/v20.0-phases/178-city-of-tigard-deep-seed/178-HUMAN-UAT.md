---
status: complete
phase: 178-city-of-tigard-deep-seed
source: [178-VERIFICATION.md]
started: 2026-07-02T22:45:00Z
updated: 2026-07-03T00:25:00Z
---

## Current Test

[all tests complete — verified live 2026-07-02 after Netlify deploy of main@583ed6f]

## Tests

### 1. Tigard community banner renders on live browse
expected: After the next essentials frontend deploy, https://essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110 shows the Downtown Tigard Main Street banner photo on the City of Tigard section (NOT the tier gradient fallback). CDN asset already live (cities/tigard.jpg, HTTP 200); CURATED_LOCAL 'tigard' key committed in 424501f.
result: PASS — live page renders img src cities/tigard.jpg (verified via Playwright post-deploy; no gradient fallback)

### 2. Purple hasContext chip for Tigard
expected: After deploy, Tigard appears in the Oregon coverage block (between Portland and Troutdale) with the purple hasContext chip. coverage.js entry committed in 424501f; build green.
result: PASS — Oregon shows 9 areas; Tigard chip carries the purple hasContext classes (bg-purple-100/text-purple-700), identical to Hillsboro/Portland, between Portland and teal Troutdale

## Summary

total: 2
passed: 2
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
