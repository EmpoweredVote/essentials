---
phase: 194-city-of-tucson-deep-seed
plan: 05
subsystem: ui
tags: [banner, coverage, buildingImages, storage, tucson, arizona]

requires:
  - phase: 194-04
    provides: seeded stances that make the coverage chip's hasContext:true DB-honest
  - phase: 194-02
    provides: geo_id 0477000 the browseGovernmentList points at
provides:
  - Licensed downtown-Tucson banner at Storage cities/tucson.jpg + CURATED_LOCAL 'tucson' wiring
  - NEW Arizona COVERAGE_STATES block with a DB-honest 'Tucson' chip (browse geo_id 0477000)
affects: [194-06, 195, 196, 197, 198]

tech-stack:
  added: []
  patterns:
    - "First AZ city-tier banner + first Arizona COVERAGE_STATES block (Pima County stays in COVERAGE_COUNTIES)"

key-files:
  created: []
  modified:
    - src/lib/buildingImages.js
    - src/lib/coverage.js

key-decisions:
  - "Banner: downtown-Tucson palm-framed high-rise streetscape (Bill Morrow, CC BY 2.0) — real photo, non-aerial, distinct from Pima Catalinas + AZ Phoenix skyline (operator-approved with all 3 shown)"
  - "coverage.js: NEW Arizona block in COVERAGE_STATES (none existed); COVERAGE_COUNTIES (Pima) untouched (Pitfall 6)"

patterns-established:
  - "Flagship city-unit template for the 4 suburb deep-seeds (195-198)"

requirements-completed: [BANR-01, TUC-01]

duration: ~20min
completed: 2026-07-10
---

# Phase 194 Plan 05: Tucson Banner + Arizona Coverage Chip Summary

**Licensed downtown-Tucson streetscape banner (cities/tucson.jpg) processed, uploaded, and wired; City of Tucson surfaced via a brand-new Arizona COVERAGE_STATES block with a DB-honest hasContext:true chip.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 2 (source+process+upload+approve banner → wire buildingImages.js + coverage.js)
- **Files modified:** 2 (essentials repo)

## Accomplishments
- Sourced, processed (1700×540 LANCZOS q90, vertical-anchor 0.45), and uploaded a licensed downtown-Tucson banner to `cities/tucson.jpg` (CDN HTTP 200); operator-approved as a real, non-aerial, downtown-Tucson streetscape distinct from the Pima County (Catalinas/saguaro) and Arizona-state (Phoenix skyline) banners.
- Added `tucson: { state: 'AZ', src: ... }` to `CURATED_LOCAL` with attribution comment; `getBuildingImages()` unchanged.
- Added a NEW `{ name: 'Arizona', abbrev: 'AZ', areas: [{ label: 'Tucson', browseGovernmentList: ['0477000'], browseStateAbbrev: 'AZ', hasContext: true }] }` block to `COVERAGE_STATES` (first AZ city block; Pitfall 6). `COVERAGE_COUNTIES` (Pima) untouched.
- Both modules parse (`node import`), `buildingImages.test.js` green (11/11).

## Banner Attribution
**Tucson May 2019 28 (Hotel Congress)** | Michael Barera | **CC BY-SA 4.0**
Source: Wikimedia Commons `File:Tucson May 2019 28 (Hotel Congress).jpg` (6000×4000 → cropped to 1700×540 @ vertical-anchor 0.45)
CDN: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/tucson.jpg`
_Note (revised 2026-07-12, during Phase 201): the banner was refreshed twice post-original-UAT. (1) The original palm-framed downtown shot (Bill Morrow, CC BY 2.0) was replaced during Phase-194 UAT with a Sentinel Peak skyline (John Diebolt, PD). (2) The operator later flagged the skyline as still tilted (left too high); it was re-leveled −3.0° and pushed, then replaced entirely per operator request with this ground-level **Hotel Congress** street scene (the iconic downtown historic-district landmark) — a real, level, non-aerial photo distinct from the Pima County (Catalinas/saguaro) and AZ-state (Phoenix) banners. Storage overwrite = live instantly._

## Task Commits
1. **Task 1: Source+process+upload+approve banner** — orchestrator-run; human-approved ("Approved — wire it")
2. **Task 2: Wire frontend** — committed to the essentials repo (see below)

## Files Modified
- `src/lib/buildingImages.js` — CURATED_LOCAL `tucson` entry + attribution comment
- `src/lib/coverage.js` — NEW Arizona COVERAGE_STATES block with the Tucson chip

## Decisions Made
- Followed plan exactly. hasContext:true is honest (Plan 04 seeded 5 stances for the Mayor's ward-mates + 9 for the Mayor; the browse target 0477000 resolves the whole city).

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None. The RESEARCH-shortlisted strongest candidate (Bill Morrow CC BY 2.0) was usable on the first sourcing pass — no re-source needed.

## Next Phase Readiness
- ROADMAP #4 (banner) + #5 (DB-honest coverage chip) TRUE.
- Not yet pushed to Render — deploy is the operator's call (frontend ships on push). Plan 06 live-browse verify will exercise the rendered banner + routing.

---
*Phase: 194-city-of-tucson-deep-seed*
*Completed: 2026-07-10*
