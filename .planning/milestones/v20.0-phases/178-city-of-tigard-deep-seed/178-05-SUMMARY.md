---
phase: 178-city-of-tigard-deep-seed
plan: 05
subsystem: frontend
tags: [community-banner, coverage, wikimedia, oregon, tigard]

# Dependency graph
requires:
  - phase: 178-city-of-tigard-deep-seed
    plan: 02
    provides: representing_city='Tigard' inline on all 7 offices (banner derivation)
  - phase: 178-city-of-tigard-deep-seed
    plan: 03
    provides: 7/7 headshots
  - phase: 178-city-of-tigard-deep-seed
    plan: 04
    provides: 48 cited stances
provides:
  - Licensed 1700x540 community banner at Storage cities/tigard.jpg (CDN 200)
  - buildingImages.js CURATED_LOCAL 'tigard' key + attribution comment
  - coverage.js Oregon 'Tigard' entry (purple hasContext chip) between Portland and Troutdale
  - Live-browse verification of the DB-driven roster/headshots/stances
affects: [phase-completion, WASH-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Banner vertical-anchor: street-level downtown shots need --vertical-anchor ~0.85 to keep storefronts and trim sky"

key-files:
  created: []
  modified:
    - src/lib/buildingImages.js
    - src/lib/coverage.js

key-decisions:
  - "Banner decision (Task 1, option wikimedia-downtown): Commons 'File:Downtown Tigard Oregon.JPG' | M.O. Stevens (Aboutmovies) | PUBLIC DOMAIN — license verified on the file page; research's CC BY-SA assumption (A10) was wrong in our favor (PD, no attribution required, though attribution comment kept per convention)"
  - "1024x704 source upscaled 1.66x to 1700x540 via Lanczos (acceptable at banner scale with runtime gradient); Commons alternatives (Bull Mountain Road, Broadways Car Wash) rejected on subject"
  - "Live-browse (pre-deploy): Mayor Hu first + 6 councilors, headshots + compass chips on all 7, NO party label, no empty/split section — VERIFIED via Playwright on essentials.empowered.vote"
  - "Banner render + purple hasContext chip NOT yet verifiable live — local main is 33 commits ahead of origin; frontend deploy pending (same pattern as phase 177). Verify after next deploy."

requirements-completed: [WASH-04]

# Metrics
duration: 15min
completed: 2026-07-02
---

# Phase 178 Plan 05: Banner + Surfacing Summary

**Tigard is fully wired: Public-Domain downtown banner uploaded (CDN 200), CURATED_LOCAL key + Oregon coverage entry committed (424501f), production build green, and the live app already serves the complete DB-driven roster — 7 officials, 7 headshots, 48 stances, zero party labels.**

## Accomplishments
- Task 1 (decision): selected the research-preferred Wikimedia "Downtown Tigard Oregon.JPG"; verified the license is Public Domain (not CC BY-SA); processed with `--vertical-anchor 0.85` (street-level storefront band, sky trimmed) to 1700×540 q90; uploaded to `politician_photos/cities/tigard.jpg` — CDN HTTP 200
- Task 2 (executor): `tigard:` CURATED_LOCAL key + attribution comment `//   tigard - Downtown Tigard Oregon | M.O. Stevens (Aboutmovies) | Public Domain`; coverage.js `{ label: 'Tigard', browseGovernmentList: ['4173650'], browseStateAbbrev: 'OR', hasContext: true }` between Portland and Troutdale; no other changes; no backslash paths; `npm run build` exit 0; commit 424501f
- Task 3 (live verify): Playwright on `essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110` confirmed Mayor-first ordering, all 6 councilors, correct clean headshots on all 7, compass "Compare your views" chips on all 7, NO party label, no empty LOCAL section, no section-split

## Human/deploy-pending verification (carry-over UAT)
The two frontend-code-dependent checks CANNOT pass until the essentials frontend deploys (local main is 33 commits ahead of origin):
1. Community banner renders on the Tigard Local section (not the tier gradient fallback)
2. Purple hasContext chip appears for Tigard in the Oregon coverage block

Both are pure frontend-constant lookups already validated by the green build; re-check the browse URL after the next deploy.

## Task Commits
1. **Task 1: Banner decision + upload** - N/A (Storage upload; no repo change)
2. **Task 2: Wire banner + surface Tigard** - 424501f (essentials repo)
3. **Task 3: Live-browse verification** - checkpoint resolved (DB-driven items verified; 2 items pending deploy)

## Deviations from Plan
- License turned out Public Domain rather than CC BY-SA — attribution comment kept in the standard format regardless.
- Banner + chip live-render checks deferred to post-deploy (deploy cadence is user-controlled), consistent with phase-177 practice.

## Issues Encountered
None.

## Next Phase Readiness
- WASH-04 satisfied end-to-end on the data side; browse link: https://essentials.empowered.vote/results?browse_geo_id=4173650&browse_mtfcc=G4110
- This is the final plan of phase 178.

---
*Phase: 178-city-of-tigard-deep-seed*
*Completed: 2026-07-02*
