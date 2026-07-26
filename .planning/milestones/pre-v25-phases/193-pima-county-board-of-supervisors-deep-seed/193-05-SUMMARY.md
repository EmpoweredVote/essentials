---
phase: 193-pima-county-board-of-supervisors-deep-seed
plan: 05
subsystem: ui
tags: [banner, storage, coverage, buildingImages, wikimedia, pima-county, arizona]

requires:
  - phase: 193-04
    provides: "≥1 stance row → honest hasContext:true coverage chip"
provides:
  - "Licensed Pima County community banner (1700×540) at Storage cities/pima-county.jpg"
  - "buildingImages.js CURATED_LOCAL 'pima county' entry (first county-tier key)"
  - "coverage.js COVERAGE_COUNTIES 'Pima County' chip (hasContext:true, browses geo_id 04019)"
affects: [193-06, tucson-arizona]

tech-stack:
  added: []
  patterns: ["county-tier CURATED_LOCAL banner (state-scoped, space-form key); one-at-a-time Wikimedia sourcing + process_banner.py/upload_banner.py toolchain"]

key-files:
  created: []
  modified: ["src/lib/buildingImages.js", "src/lib/coverage.js"]

key-decisions:
  - "Banner subject: Santa Catalina Mountains + Sonoran-desert saguaro foreground (D-04) — reads as Pima County the place, distinct from the future Tucson-city streetscape (Phase 194) and the live AZ-state Phoenix skyline"
  - "hasContext:true is honest — Plan 04 seeded 53 stance rows"
  - "getBuildingImages() + parseCityFromAddress unchanged (Pitfall 7): banner renders via the COVERAGE_COUNTIES browse chip, not arbitrary Tucson-address parsing (graceful degradation, same as Clark/WashCo)"

patterns-established:
  - "First COUNTY-tier banner in CURATED_LOCAL — county banners live in the cities/ storage tier (keyed by banner type, not government type)"

requirements-completed: [BANR-01, PIMA-01]

duration: ~20min
completed: 2026-07-09
---

# Phase 193 Plan 05: Pima County Banner + Coverage Chip Summary

**Licensed Santa Catalina Mountains / Sonoran-desert banner (real ground-level photo, 1700×540) sourced one-at-a-time from Wikimedia Commons, uploaded to cities/pima-county.jpg, and wired into buildingImages.js CURATED_LOCAL (first county-tier key) + a DB-honest hasContext:true coverage chip that browses geo_id 04019.**

## Banner Attribution
- **Title:** View of the Santa Catalina Mountains from West Saguaro National Park near Tucson, AZ
- **Author:** WClarke
- **License:** CC BY-SA 4.0 (Wikimedia Commons)
- **Source:** https://commons.wikimedia.org/wiki/File:View_of_the_Santa_Catalina_Mountains_from_West_Saguaro_National_Park_near_Tuscon,_AZ.jpg
- **CDN:** https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/pima-county.jpg
- **Processing:** process_banner.py --vertical-anchor 0.42 (4000×1897 → crop 4000×1270 → resize 1700×540, LANCZOS q90)

## Performance
- **Duration:** ~20 min
- **Completed:** 2026-07-09
- **Tasks:** 2 (Task 1 orchestrator-run source/process/upload + human-verify; Task 2 frontend wiring)
- **Files:** 2 modified (essentials repo)

## Checkpoint (Task 1 — blocking banner review)
Sourced from Wikimedia Commons via a one-at-a-time pass (10 candidates screened; ranked by closeness
to 3.15:1 + on-subject match). Chose the WClarke Catalinas-from-Saguaro-NP shot over a Michelle-Maria
desert-sunset panorama because it shows the Catalinas AND a full Sonoran saguaro/cholla/prickly-pear
foreground — the strongest "Pima County the place" read. Uploaded (CDN 200, 1700×540 confirmed),
previewed the actual crop, operator approved.

## Task Commits
1. **Task 1: Source + process + upload banner** — orchestrator-run (Storage upload; no repo commit)
2. **Task 2: Wire frontend** — `beb111dc` (feat, essentials): CURATED_LOCAL 'pima county' + COVERAGE_COUNTIES 'Pima County'

## Files Modified
- `src/lib/buildingImages.js` — CURATED_LOCAL 'pima county' → cities/pima-county.jpg (state 'AZ') + attribution comment; first county-tier key
- `src/lib/coverage.js` — COVERAGE_COUNTIES: `{ label: 'Pima County', browseGovernmentList: ['04019'], browseStateAbbrev: 'AZ', hasContext: true }`

## Decisions Made
- Followed plan as specified. getBuildingImages() and parseCityFromAddress untouched (Pitfall 7 respected).

## Deviations from Plan
- process_banner.py flag is `--input` (plan text illustratively said `--file`); used `--input`. No behavioral change.

## Issues Encountered
None. Both files parse cleanly via `node --input-type=module -e import(...)`.

## Next Phase Readiness
- Banner + chip live (will ship to Render on push). Wave 5 verification can confirm CDN 200, chip presence, and the full production audit.

---
*Phase: 193-pima-county-board-of-supervisors-deep-seed*
*Completed: 2026-07-09*
