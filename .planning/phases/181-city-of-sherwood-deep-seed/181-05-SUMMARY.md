---
phase: 181-city-of-sherwood-deep-seed
plan: 05
subsystem: surfacing
tags: [banner, coverage, sherwood, or, live-verification]
dependency-graph:
  requires:
    - "181-01 (banner crop call: Railroad St primary at anchor 0.5; verified geo_id 4167100)"
    - "181-02/03/04 (structural + headshots + stances live — everything the browse page renders)"
  provides:
    - "Sherwood purple hasContext chip in src/lib/coverage.js Oregon block (browse via ['4167100'])"
    - "Community banner cities/sherwood.jpg live in Storage + CURATED_LOCAL 'sherwood' key"
    - "Live verification of all 4 ROADMAP success criteria"
  affects:
    - "Phase 182 Cornelius (next city — same shape)"
tech-stack:
  added: []
  patterns:
    - "Code-first surfacing (coverage.js + buildingImages.js land before the Storage asset — Forest Grove pattern)"
    - "Render bundle hash differs from local build hash (env differences) — verify deploys by bundle CONTENT (grep for geo_id/asset path), never by comparing hashes"
key-files:
  created: []
  modified:
    - "src/lib/coverage.js (Sherwood entry, Oregon block, alphabetical)"
    - "src/lib/buildingImages.js (CURATED_LOCAL 'sherwood' + attribution comment)"
decisions:
  - "Banner: Railroad St (Old Town commercial street scene | dreid1987 | CC BY 3.0) selected as the AFK-default from the two Wave-0 candidates — it is the recommended primary per D-14 (recognizable everyday street level) and the operator question timed out. Downtown-cottages alternate documented. Amendable post-hoc like Forest Grove."
  - "Executor died on session quota after completing both code edits; orchestrator finished the plan inline (banner upload, build, commit 759a810, deploy verification, live Playwright pass) — same-session live verification preserved (179/180 pattern)"
metrics:
  duration: "~1.5 hours including a 45-minute false-wait caused by comparing Render's bundle hash to the local hash"
  completed: 2026-07-03
---

# Phase 181 Plan 05: Sherwood Surfacing + Live Verification Summary

Surfaced Sherwood end-to-end: coverage chip, Railroad St community banner, and a full live
verification pass. Commit 759a810 (essentials), banner at politician_photos/cities/sherwood.jpg.

## Live verification (Playwright, essentials.empowered.vote, 2026-07-03)

| Check | Result |
|-------|--------|
| Browse `results?browse_geo_id=4167100&browse_mtfcc=G4110` | Renders "Sherwood, OR" with the Railroad St banner (photo, not gradient) |
| Mayor-first ordering | Tim Rosener (MAYOR section) above SHERWOOD CITY COUNCIL |
| Roster | All 7 render with portraits (Rosener, Brouse, Giles, Mays, Scott, Standke, Young) |
| Party display | Absent everywhere (antipartisan) — API serves party:"" |
| Stances | Rosener profile shows Stance Breakdown with highlighted chairs (housing 3, zoning 2, etc.) |
| Landing chip | "Oregon OR 12 areas" expander now lists Sherwood |
| Browse API | POST /api/essentials/browse/by-area returns 53 officials for a Sherwood address, 7 tagged representing_city='Sherwood', district_label 'Sherwood (Mayor, Citywide, 2-Year Term)' on LOCAL_EXEC |

All 4 ROADMAP success criteria for WASH-07 are TRUE.

## Deploy note (lesson)

Render's static build produces a different bundle hash than the local build (different env/ev-ui
resolution). The deploy was live at 21:54 UTC while the orchestrator waited 45 minutes comparing
hashes. Verify deploys by bundle CONTENT (`grep 4167100` / `grep cities/sherwood.jpg` in the served
JS), never by hash equality with a local build.
