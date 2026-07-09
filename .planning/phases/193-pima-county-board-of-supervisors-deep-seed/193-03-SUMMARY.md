---
phase: 193-pima-county-board-of-supervisors-deep-seed
plan: 03
subsystem: infra
tags: [headshots, storage, civicplus, pillow, politician_images, pima-county, arizona]

requires:
  - phase: 193-02
    provides: "5 supervisor politician UUIDs (external_id → UUID manifest)"
provides:
  - "5/5 supervisor headshots (600×750, 4:5 Lanczos q90) in the politician_photos Storage bucket, bound to current roster members"
  - "Audit-only migration 1289 (unregistered) with 5 politician_images rows"
affects: [193-06]

tech-stack:
  added: []
  patterns: ["CivicPlus uuid-keyed asset fetch → crop_to_4_5 → resize 600×750 → Storage x-upsert; runtime UUID resolution by external_id"]

key-files:
  created: ["C:/EV-Accounts/backend/scripts/_tmp-pima-supervisors-headshots.py (gitignored)", "C:/EV-Accounts/backend/migrations/1289_pima_county_headshots.sql"]
  modified: []

key-decisions:
  - "4/5 CivicPlus asset URLs were missing from RESEARCH (only Scott documented); executor refused to fabricate and left fail-fast TODO sentinels — orchestrator scraped + curl-verified the 4 real URLs from pima.gov/2317 before running"
  - "photo_license='us_government_work' for all 5; columns exactly (id, politician_id, url, type, photo_license); audit-only, NOT ledger-registered"

patterns-established:
  - "Executor authors headshot pipeline with sentinel-guarded gaps; orchestrator supplies network-sourced URLs — no fabricated asset IDs"

requirements-completed: [PIMA-01]

duration: ~15min
completed: 2026-07-09
---

# Phase 193 Plan 03: Supervisor Headshots Summary

**All 5 Pima County supervisors serve a 600×750 (crop-first, Lanczos q90) headshot from the CDN, sourced from official pima.gov CivicPlus portraits and bound to the current roster politician rows via audit-only migration 1289.**

## Performance
- **Duration:** ~15 min
- **Completed:** 2026-07-09
- **Tasks:** 3 (Tasks 1&2 executor-authored; Task 3 orchestrator-run pipeline+apply+assert)
- **Files:** 2 created (1 gitignored script + 1 committed migration)

## Accomplishments
- Pipeline fetched, cropped-to-4:5, resized to 600×750, and x-upsert-uploaded 5/5 supervisor portraits; 0 gaps.
- Applied audit-only migration 1289 (5 idempotent politician_images rows); count for the Pima ext_id block = 5.
- All 5 CDN URLs return HTTP 200; sampled Scott + Cano images verified exactly 600×750 by PIL.

## Headshot Manifest (production CDN)

| external_id | UUID | supervisor | CDN path | source (CivicPlus asset) |
|-------------|------|-----------|----------|--------------------------|
| -4007001 | b33f37df-5537-4eee-bb5b-b401a135bc1b | Rex Scott | …/b33f37df-…-headshot.jpg | az-pimacounty/2aa1d923-… |
| -4007002 | be550e00-b04c-4717-99bc-75bd4e8d6608 | Dr. Matt Heinz | …/be550e00-…-headshot.jpg | az-pimacounty/77f8cf13-… |
| -4007003 | f928a8f0-07fc-47c4-98b2-9801e6adf3dd | Jennifer Allen | …/f928a8f0-…-headshot.jpg | az-pimacounty/55ce9aaf-… |
| -4007004 | 41c2b862-78c8-4a27-96c5-50dcdb3a254e | Steve Christy | …/41c2b862-…-headshot.jpg | az-pimacounty/e339a87c-… |
| -4007005 | 0e4bebcf-76b4-49df-9197-c114e84d3bd1 | Andrés Cano | …/0e4bebcf-…-headshot.jpg | az-pimacounty/4125afd9-… |

Source resolutions: Scott 733×1100, Heinz ~360×540, Allen 360×540, Christy 300×450, Cano 530×865 — all ≥ MIN_DIM=100, cropped top to 4:5, upscaled/downscaled to 600×750.

## Task Commits
1. **Task 1: Author pipeline script** — executor (gitignored `_tmp-*`, never committed)
2. **Task 2: Author audit migration** — `9a…`/committed as `feat(pima-193): audit-only headshot rows … (1289, unregistered)`
3. **Task 3: Run + apply + assert** — orchestrator-run; 5/5 uploaded, migration applied, count=5, CDN 200×5, PIL 600×750

## Decisions Made
- **Missing CivicPlus URLs handled without fabrication:** RESEARCH documented only Rex Scott's asset UUID. The executor left fail-fast `TODO_CIVICPLUS_ASSET_URL` sentinels for the other 4 rather than invent IDs. As orchestrator I scraped the 4 real asset URLs from https://www.pima.gov/2317/Board-of-Supervisors, curl-verified each returns `200 image/jpeg` (and Scott's scraped UUID matched the RESEARCH-documented one, validating the scrape), then wired them into ROSTER. This is the correct sentinel-guarded pattern for network gaps.

## Deviations from Plan
- Task 1 required an orchestrator patch (the 4 network-sourced URLs) that the plan anticipated ("scrape the four real img src asset URLs"). No structural deviation.

## Issues Encountered
- Windows console renders "Andrés" as "Andr�s" (cp1252 stdout) — cosmetic only; the DB/full_name stores the correct accented form.
- Wrong-but-present photo risk (T-193-WRONG) is not detectable by row count — deferred to the Plan 06 human identity spot-check.

## Next Phase Readiness
- Headshots complete. Wave 3's sibling (193-04 stances) and the Plan 06 verification (incl. headshot identity spot-check) can proceed.

---
*Phase: 193-pima-county-board-of-supervisors-deep-seed*
*Completed: 2026-07-09*
