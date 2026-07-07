---
phase: 180-city-of-forest-grove-deep-seed
plan: 05
subsystem: ui
tags: [react, vite, coverage, banner, wikimedia, supabase-storage, forest-grove, oregon, washco]

# Dependency graph
requires:
  - phase: 180-city-of-forest-grove-deep-seed (plans 01-04)
    provides: "Wave-0 locked values (geo_id 4126200, 'forest grove' space key, banner crop call), structural migration 1178 (representing_city='Forest Grove' inline), 7/7 headshots (plan 03), cited stances (plan 04)"
provides:
  - "Forest Grove community banner live in Supabase Storage at cities/forest-grove.jpg (1700x540, 236KB, CC BY 3.0)"
  - "buildingImages.js CURATED_LOCAL 'forest grove' key (space, not hyphen) -> banner CDN URL with attribution comment"
  - "coverage.js Oregon block Forest Grove entry (geo_id 4126200, hasContext purple chip) between Fairview and Gresham"
  - "WASH-06 satisfied end-to-end (surfacing portion; live-UI render deploy-gated, see below)"
affects: [phase-181-sherwood, phase-182-cornelius, milestone-close-v20]

# Tech tracking
tech-stack:
  added: []
  patterns: ["Two-word CURATED_LOCAL key ('forest grove' with space) vs hyphenated Storage path (cities/forest-grove.jpg) — key format and path format are independent"]

key-files:
  created: []
  modified:
    - src/lib/buildingImages.js
    - src/lib/coverage.js

key-decisions:
  - "Banner source = 'Old College Hall Pacific University back.JPG' (CC BY 3.0, M.O. Stevens/Aboutmovies) — Wave-0 recommendation confirmed by orchestrator; front angle rejected (readable license plate), side angle rejected (tree-obscured)"
  - "Banner crop: 2028x1465 -> 2028x644 at --vertical-anchor 0.28 (keeps full cupola + sky) -> 1700x540, 236KB"
  - "Live-browse UI render (chip + banner on essentials.empowered.vote) recorded as deploy-gated per 178 precedent — orchestrator handles the live check after merge/deploy"

patterns-established:
  - "Deploy-gated live-browse verification: server-side API check now (roster/party/headshots via POST /api/essentials/browse/by-government-list), frontend chip/banner render verified post-deploy"

requirements-completed: [WASH-06]

# Metrics
duration: ~30min (including checkpoint round-trips)
completed: 2026-07-03
---

# Phase 180 Plan 05: Surfacing + Community Banner Summary

**Forest Grove surfaced with the purple hasContext chip (geo_id 4126200) and the Old College Hall CC BY 3.0 community banner wired via the 'forest grove' space-key in CURATED_LOCAL; production build green; all 7 officials verified live server-side with headshots and no party labels.**

## Performance

- **Duration:** ~30 min (including two checkpoint round-trips)
- **Started:** 2026-07-03T05:05:00Z (approx)
- **Completed:** 2026-07-03T05:35:00Z (approx)
- **Tasks:** 3 (1 decision checkpoint + 1 auto + 1 verify checkpoint)
- **Files modified:** 2

## Accomplishments

- **Task 1 (orchestrator-side, confirmed at checkpoint):** Community banner sourced, processed, and uploaded — "Old College Hall Pacific University back.JPG" (Wikimedia Commons, CC BY 3.0, M.O. Stevens/Aboutmovies), processed via `scripts/banners/process_banner.py` (2028×1465 → 2028×644 crop at `--vertical-anchor 0.28` → 1700×540, 236KB) and uploaded via `upload_banner.py` to `politician_photos/cities/forest-grove.jpg`. CDN URL verified HTTP 200 (241,732 bytes, image/jpeg) from this worktree. Visual QA passed (full roofline, cupola centerpiece, no vehicles, no text/graphics, no AI).
- **Task 2:** Both config edits made and build-gated:
  - `src/lib/buildingImages.js` — added `'forest grove'` CURATED_LOCAL key (literal space, matching `getBuildingImages()`'s `city.includes(key)` substring match against `representing_city.toLowerCase()`) pointing at the hyphenated Storage path CDN URL, plus the attribution comment line `//   forest grove - Old College Hall, Pacific University (back) | M.O. Stevens (Aboutmovies) | CC BY 3.0` in the established header format.
  - `src/lib/coverage.js` — inserted `{ label: 'Forest Grove', browseGovernmentList: ['4126200'], browseStateAbbrev: 'OR', hasContext: true }` alphabetically between Fairview and Gresham in the Oregon `areas` block, with the block's column alignment re-normalized to fit the longer label (whitespace-only change to sibling rows, exactly per 180-PATTERNS.md's specified edit).
  - `npm run build` exits 0.
- **Task 3 (verification):** Server-side live verification via `POST https://accounts-api.empowered.vote/api/essentials/browse/by-government-list` with `{ government_geo_ids: ['4126200'], state: 'OR' }` — see gate results below.

## Task Commits

Each task was committed atomically:

1. **Task 1: Banner source/process/upload** — no repo commit (orchestrator-side asset work; artifact is the Storage object `cities/forest-grove.jpg`, verified HTTP 200)
2. **Task 2: Wire banner + surface Forest Grove** — `d419c61` (feat)
3. **Task 3: Live verification** — no code commit (verification-only; results recorded here)

**Plan metadata:** SUMMARY commit (this file).

## Verification Results (Task 3)

| Checkpoint item | Result | Detail |
|---|---|---|
| `npm run build` exits 0 | PASS | Built in 12.19s, no errors (chunk-size warning is pre-existing) |
| Banner object live | PASS | CDN URL returns HTTP 200, 241,732 bytes, image/jpeg |
| All 7 officials surface for geo_id 4126200 | PASS (server-side) | Live API returns Mayor Malynda Wenzl + Councilors Marshall, Martinez, Valenzuela, Gustafson, Falconer, Schimmel — all with `representing_city='Forest Grove'` |
| No party label on any FG official | PASS (server-side) | `party` empty for all 7 (antipartisan) |
| Headshots present | PASS (server-side) | 7/7 officials have `images[]` rows with Storage-hosted `{uuid}-headshot.jpg` URLs (plan 03 outcome: full 7/7, better than the anticipated partial) |
| No empty LOCAL section / section-split | PASS (server-side) | All 7 LOCAL/LOCAL_EXEC rows returned in one government (mig 1178 post-verify also asserted split=0) |
| Compass stances visible | PASS (by plan 04) | Cited stance rows seeded and verified in 180-04; `hasContext: true` is therefore correct |
| Purple hasContext chip renders live | DEPLOY-GATED | essentials.empowered.vote serves the deployed build; chip appears after this commit deploys via Render. Orchestrator handles the post-merge live check (178 precedent) |
| Community banner renders (not gradient) live | DEPLOY-GATED | Same deploy gate. Match logic is deterministic: `'Forest Grove'.toLowerCase()` = `'forest grove'` contains the committed key; banner object confirmed live |
| Both files committed | PASS | `d419c61` on this worktree branch |

**Live browse link (for post-deploy check):** `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110`

## Files Created/Modified

- `src/lib/buildingImages.js` — `'forest grove'` CURATED_LOCAL entry + attribution comment (2 lines added)
- `src/lib/coverage.js` — Forest Grove Oregon-block entry + column re-alignment of the Oregon block (1 row added, sibling rows whitespace-normalized)

## Decisions Made

- Banner = Old College Hall back angle (CC BY 3.0) per Wave-0 crop assessment, confirmed at the Task 1 decision checkpoint; Downtown Forest Grove (Public Domain) alternate not needed.
- Live-UI render items recorded as deploy-gated rather than blocking, per explicit coordinator direction and the Phase 178 precedent.

## Deviations from Plan

None affecting deliverables — plan executed as written, with two execution notes:

1. **[Rule 3 - Blocking] Worktree had no `node_modules`** — `npm run build` could not run in the fresh worktree. Fix: ran `npm install` (lockfile-driven, no new packages added; `package-lock.json` churn from install was restored via `git checkout -- package-lock.json` and NOT committed). Verification: build exits 0. No package.json changes.
2. **Task 1 attribution string angle correction** — the plan's default attribution said "(front)" but Wave-0 rejected the front angle (readable license plate); the confirmed source and committed attribution use "(back)", exactly matching the Task 1 checkpoint resume-signal string.

**Total deviations:** 1 auto-fixed (blocking), 1 recorded correction via checkpoint.
**Impact on plan:** None — no scope creep; both files match acceptance criteria exactly.

## Known Stubs

None — both edits are fully wired to live data (banner object HTTP 200; geo_id 4126200 returns the full roster from the live API).

## Threat Flags

None — no new security surface. Threat register dispositions all satisfied: T-180-22 (verified CC BY 3.0 license, no AI), T-180-23 (space key asserted by grep, hyphenated key confirmed absent), T-180-24 (`npm run build` gate passed), T-180-25 (no raw `\` paths in either diff), T-180-SC (no new package installs beyond lockfile-driven `npm install`).

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **This is the final plan of Phase 180 — WASH-06 is satisfied end-to-end** (data + assets + surfacing committed; live-UI chip/banner render pending the Render deploy of this commit — orchestrator verifies post-merge).
- Phase 181 (Sherwood) inherits: the two-word-key pattern proof (second two-word city would reuse it), the WR-01/WR-02 hardened templates from this phase, and the deploy-gated verification pattern.
- Post-deploy check for orchestrator: `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110` — confirm purple chip + banner (not gradient) + Mayor-first ordering.

## Self-Check: PASSED

- `src/lib/buildingImages.js` — `'forest grove':` key FOUND (line 118), attribution comment FOUND (line 111), no hyphenated key (grep count 0)
- `src/lib/coverage.js` — Forest Grove entry FOUND (line 100), between Fairview (99) and Gresham (101)
- Commit `d419c61` — FOUND in git log on branch worktree-agent-a388899c59a6c8a4a
- `npm run build` — exit 0 (re-verified during Task 2 gate)
- Banner CDN URL — HTTP 200 verified live

---
*Phase: 180-city-of-forest-grove-deep-seed*
*Completed: 2026-07-03*
