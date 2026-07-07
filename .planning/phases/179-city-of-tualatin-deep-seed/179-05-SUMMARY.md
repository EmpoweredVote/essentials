---
phase: 179-city-of-tualatin-deep-seed
plan: 05
subsystem: frontend
tags: [coverage, banner, surfacing, tualatin]

# Dependency graph
requires:
  - phase: 179-city-of-tualatin-deep-seed
    plan: 03
    provides: 7/7 headshots in Storage + politician_images rows
  - phase: 179-city-of-tualatin-deep-seed
    plan: 04
    provides: 59 evidence-only stances
provides:
  - Tualatin purple hasContext chip in coverage.js Oregon block (geo_id 4174950)
  - Community banner cities/tualatin.jpg (Tualatin Commons, CC BY-SA 3.0) wired via CURATED_LOCAL
  - Live end-to-end verification of the full WASH-05 deliverable
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/lib/coverage.js
    - src/lib/buildingImages.js

key-decisions:
  - "Banner: Wikimedia Commons 'Tualatin Commons daytime.JPG' | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0 — D-15 first-hint subject, license confirmed via imageinfo API, composition viewed at full res AND at the 1700×540 crop before upload"
  - "coverage.js entry inserted between Troutdale and Wood Village (correct alphabetical slot — NOT next to Tigard)"
  - "Committed directly to main and pushed (be1816d) — deploy verified live in-session, so no deploy-gated UAT items remain (improvement over 178, which closed its UAT post-deploy)"

patterns-established: []

requirements-completed: [WASH-05]

# Metrics
duration: ~15min
completed: 2026-07-02
---

# Phase 179 Plan 05: Surfacing + Banner + Live Close Summary

**Tualatin is fully surfaced and verified live: the Tualatin Commons banner renders on the Local section (not the gradient), the purple hasContext chip shows on the landing Oregon card between Troutdale and Wood Village, and the live browse shows Mayor Bubenik first + all 6 councilors with headshots and compass stances, no party labels, no section-split. WASH-05 is satisfied end-to-end.**

## Task Results

1. **Task 1 (banner decision checkpoint):** wikimedia-commons option selected (auto-mode recommended + composition visually confirmed twice — full-res and post-crop). Pipeline: `process_banner.py` 3655×2345 → crop 3655×1161 (anchor 0.5) → 1700×540 (197.6 KB) → `upload_banner.py` → `cities/tualatin.jpg` (CDN HTTP 200, 202,305 bytes). Attribution: `Tualatin Commons daytime | M.O. Stevens (Aboutmovies) | CC BY-SA 3.0`. No AI images; no baked-in text.
2. **Task 2 (file edits):** buildingImages.js `tualatin:` CURATED_LOCAL key + attribution comment; coverage.js `{ label: 'Tualatin', browseGovernmentList: ['4174950'], browseStateAbbrev: 'OR', hasContext: true }` between Troutdale and Wood Village. `4175200` appears nowhere. `npm run build` exits 0.
3. **Task 3 (live verification):** committed `be1816d`, pushed, deploy landed in-session. Verified live at `essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110`:
   - Mayor Frank Bubenik sorts FIRST (Mayor section, Executive icon), then Tualatin City Council with all 6 (Brooks, Gonzalez, Hillier, Pratt, Reyes, Sacco)
   - All 7 portraits render; compass ("Compare your views") icons present on all 7
   - NO party label anywhere (antipartisan)
   - No empty LOCAL section, no section-split; Washington County + Oregon + US sections all resolve in the same browse
   - Community banner (Tualatin Commons photo) renders behind "Tualatin, OR" — confirms representing_city inline + lowercase CURATED_LOCAL key
   - Landing Oregon card shows the Tualatin chip in the correct slot

## Live Browse Link (WASH-05 deliverable)

https://essentials.empowered.vote/results?browse_geo_id=4174950&browse_mtfcc=G4110

## Task Commits

1. **coverage.js + buildingImages.js** — essentials `be1816d` (pushed to main; deploy verified)

## Deviations from Plan

- Tasks 1 and 3 (orchestrator-side checkpoints) were executed directly by the orchestrator under auto-mode rather than via executor checkpoint round-trips — all acceptance criteria verified live in-session.

## Issues Encountered

None.

## User Setup Required

None.

## Next Phase Readiness

- Phase 179 is the last plan — WASH-05 satisfied end-to-end and verified live. Next phase per roadmap: 180 (Forest Grove deep-seed).

---
*Phase: 179-city-of-tualatin-deep-seed*
*Completed: 2026-07-02*
