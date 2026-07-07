---
phase: 177-city-of-hillsboro-deep-seed
plan: 05
subsystem: ui
tags: [coverage.js, buildingImages.js, community-banner, supabase-storage, wikimedia-commons]

# Dependency graph
requires:
  - phase: 177-03
    provides: Hillsboro headshots + roster (offices.representing_city='Hillsboro' set inline in mig 1150)
  - phase: 177-04
    provides: Hillsboro evidence-only stances (60 rows, 7 officials)
provides:
  - Hillsboro community banner uploaded to Supabase Storage (cities/hillsboro.jpg)
  - buildingImages.js CURATED_LOCAL 'hillsboro' key wired to the banner CDN URL
  - coverage.js Oregon block surfaces Hillsboro with the purple hasContext chip
affects: [178-city-of-tigard-deep-seed, 186-west-metro-playbook-retrospective]

# Tech tracking
tech-stack:
  added: []
  patterns: [community-banner-pipeline (process_banner.py + upload_banner.py, existing tooling reused), CURATED_LOCAL lowercase-key substring match]

key-files:
  created: []
  modified:
    - src/lib/buildingImages.js
    - src/lib/coverage.js

key-decisions:
  - "Banner subject: Wikimedia Commons photo of Orenco Station Plaza with a MAX train arriving (2016), by Steve Morgan, CC BY-SA 4.0 — chosen over an Unsplash fallback because it is a clean-licensed, crop-friendly civic/transit landmark shot recognizable as Hillsboro"
  - "geo_id 4134100 used for the coverage.js browseGovernmentList entry (not 4133850) per plan spec"
  - "Live visual verification (banner render, purple chip, roster ordering) is DEFERRED to a pending human UAT pass after the frontend deploy of commit 2619363 — the human-verify checkpoint was auto-approved by the orchestrator (auto-mode chain) based on code-level evidence (npm run build passing, correct file contents), not a live-app visual check"

patterns-established:
  - "Banner attribution comment format above CURATED_LOCAL: '//   <slug> - <Title> | <Author> | <License>'"

requirements-completed: [WASH-03]

# Metrics
duration: 15min
completed: 2026-07-02
---

# Phase 177 Plan 05: City of Hillsboro Deep-Seed — Banner & Coverage Wiring Summary

**Hillsboro community banner (Orenco Station Plaza MAX photo, CC BY-SA 4.0) uploaded to Supabase Storage and wired into buildingImages.js + coverage.js, closing WASH-03 with the purple hasContext chip; live visual confirmation is a pending post-deploy UAT item, not yet verified.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-07-02T15:10:00Z (approx, continuation agent)
- **Completed:** 2026-07-02T15:25:00Z
- **Tasks:** 3 (1 checkpoint:decision, 1 auto, 1 checkpoint:human-verify — auto-approved)
- **Files modified:** 2 (plus 1 Storage asset)

## Accomplishments
- Sourced, processed (1700×540, Lanczos, q90), and uploaded a legally-licensed Hillsboro community banner to Supabase Storage at `cities/hillsboro.jpg` (CDN returns 200)
- Wired the banner into `buildingImages.js` CURATED_LOCAL via a lowercase `hillsboro` key, with an attribution comment matching the existing format
- Added the `Hillsboro` entry to the Oregon block of `coverage.js` (alphabetically between Gresham and Maywood Park) with `hasContext: true`, surfacing the purple chip
- `npm run build` passes with both edits (exit 0)
- WASH-03 is satisfied end-to-end at the code/data level; final live-app visual confirmation remains outstanding pending deploy

## Task Commits

Each task was committed atomically:

1. **Task 1: Banner sourced/processed/uploaded** - asset-only (no code commit; Supabase Storage upload of `cities/hillsboro.jpg`)
2. **Task 2: buildingImages.js + coverage.js wiring** - `2619363` (feat)
3. **Task 3: Live-browse end-to-end verification** - auto-approved by orchestrator (auto-mode chain); no additional commit required since Task 2 already committed both files

**Plan metadata:** (this commit) `docs(177-05): complete Hillsboro banner & coverage plan`

## Files Created/Modified
- `src/lib/buildingImages.js` - Added lowercase `hillsboro` key to `CURATED_LOCAL` pointing at `.../politician_photos/cities/hillsboro.jpg`, plus an attribution comment line (`hillsboro - East end of Orenco Station Plaza with MAX train arriving (2016) | Steve Morgan | CC BY-SA 4.0`)
- `src/lib/coverage.js` - Inserted `{ label: 'Hillsboro', browseGovernmentList: ['4134100'], browseStateAbbrev: 'OR', hasContext: true }` into the Oregon `areas` array between Gresham and Maywood Park
- Supabase Storage `politician_photos/cities/hillsboro.jpg` - 1700×540 community banner asset (not a repo file)

## Decisions Made
- Wikimedia Commons chosen over Unsplash for the banner source: clear CC BY-SA 4.0 attribution string, matches the established precedent (Beaverton's M.O. Stevens CC BY 3.0 banner), and the Orenco Station Plaza MAX photo is a recognizable Hillsboro civic/transit landmark that crops cleanly to 3.15:1
- Used geo_id `4134100` per plan spec (not `4133850`)

## Deviations from Plan

None - plan executed exactly as written. Both file edits match the plan's exact specification (key placement, entry format, alphabetical position, attribution comment format). No raw Windows `\` paths introduced.

## Issues Encountered

None during execution. However, per the orchestrator's auto-mode chain, the Task 3 `checkpoint:human-verify` was auto-approved based on code-level evidence (build passing, correct diffs) rather than an actual live-app visual check. See "Known Stubs / Pending Verification" below — this is not a defect, but it means the plan's stated acceptance criteria for Task 3 are not yet independently confirmed against the deployed app.

## Pending Human UAT (Deferred Live-Visual Verification)

The following items from Task 3's acceptance criteria are **DEFERRED** pending the frontend deploy of commit `2619363` and must be confirmed by a human against the live app before treating them as verified facts:

1. Mayor Beach Pace sorts first + all 6 councilors follow; no empty LOCAL section; no section-split
2. Headshots render 600×750 with no overlays; compass stances visible; no party label (antipartisan)
3. The Hillsboro community banner renders in the Local section (not the tier-gradient fallback) — confirms `offices.representing_city='Hillsboro'` (mig 1150) + the lowercase `CURATED_LOCAL` key resolve correctly
4. The purple `hasContext` chip appears for Hillsboro in the coverage list

**Verification link:** https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110

These four items should be confirmed as a follow-up UAT pass (e.g., during Phase 186 West-Metro Playbook Retrospective, or immediately after the next frontend deploy) rather than assumed complete from this plan alone.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- WASH-03 satisfied at the code/data level; Phase 177 (City of Hillsboro Deep-Seed) is complete pending the deferred live-visual UAT pass noted above
- Ready to proceed to Phase 178 (City of Tigard Deep-Seed, WASH-04)
- Recommend folding the 4 deferred UAT items into the Phase 186 retrospective's DB-verified audit, or spot-checking immediately after the next deploy

---
*Phase: 177-city-of-hillsboro-deep-seed*
*Completed: 2026-07-02*

## Self-Check: PASSED

All referenced files and commits verified to exist.
