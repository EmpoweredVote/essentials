---
phase: 182-city-of-cornelius-deep-seed
plan: 05
subsystem: frontend
tags: [coverage, buildingimages, banner, oregon, cornelius, hascontext, wr-03, circle-inscribed-crop]

# Dependency graph
requires:
  - phase: 182-city-of-cornelius-deep-seed
    plan: 02
    provides: "geo_id 4115550 (CORRECTED, not 4115350/Coquille); migration 1196 applied"
  - phase: 182-city-of-cornelius-deep-seed
    plan: 03
    provides: "4/4 filled-seat headshots live"
  - phase: 182-city-of-cornelius-deep-seed
    plan: 04
    provides: "4 evidence-only stance rows across 3 of 4 filled officials"
provides:
  - "coverage.js Oregon block has a 'Cornelius' entry (geo_id 4115550, hasContext:true) between Beaverton and Fairview"
  - "buildingImages.js CURATED_LOCAL has a single-word 'cornelius' key (post-WR-03 {state:'OR', src} format) + attribution comment, pointing at cities/cornelius.jpg"
  - "npm run build passes; built bundle content-checked for '4115550' and 'cornelius' (both present)"
  - "1700×540 Cornelius Civic Center banner LIVE at cities/cornelius.jpg (CDN HTTP 200, 117,431 bytes; CC BY-SA 3.0, M.O. Stevens)"
  - "Render deploy LIVE on ea0a78d, verified by bundle CONTENT (served JS contains 4115550 + cities/cornelius.jpg); live browse verified end-to-end via Playwright"
  - "Circle-inscribed 4:5 headshot crop (UAT fix): all 4 Cornelius headshots re-cropped and re-uploaded to canonical URLs; _tmp-cornelius-headshots.py is now the successor headshot template for Phase 183+ (supersedes Sherwood's)"
affects: []  # this plan closes phase 182 — WASH-08 satisfied end-to-end

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel-worktree split of a plan with orchestrator-only steps (banner processing/upload, git push, Render deploy verification, Playwright live checks) from in-repo code edits (coverage.js/buildingImages.js) — the worktree agent executes and commits only the in-repo edit task, returning a checkpoint for the remaining orchestrator-owned steps"
    - "Circle-inscribed 4:5 headshot crop for circular-cutout PNG sources: crop the largest 4:5 rectangle inscribed in the photo circle (corners inside the radius) BEFORE resize, so no white circle edge shows inside the site's round avatar mask — logic added to _tmp-cornelius-headshots.py (auto-detects square alpha bbox), the successor template for Phase 183+"

key-files:
  created: []
  modified:
    - "C:/Transparent Motivations/essentials/src/lib/coverage.js"
    - "C:/Transparent Motivations/essentials/src/lib/buildingImages.js"

key-decisions:
  - "Banner source decision pre-resolved by the orchestrator at Wave-0 (auto-mode): 'Cornelius Civic Center - Oregon.JPG' (Wikimedia Commons, CC BY-SA 3.0, M.O. Stevens) — the D-14 named alternate (Public Library/City Hall), viewed at the 3.15:1 band crop and assessed workable (sign legible, entrance visible). This worktree agent did not re-adjudicate the decision; it wired the attribution string and CDN path assuming this candidate is what the orchestrator will process and upload."
  - "Cornelius CURATED_LOCAL key added as a single word (no space/hyphen trap, unlike 'forest grove') in the post-WR-03 {state:'OR', src} format, placed alongside the other Oregon entries (beaverton/hillsboro/tigard/tualatin/'forest grove'/sherwood)"
  - "coverage.js Cornelius entry placed alphabetically between Beaverton and Fairview per the plan's explicit ordering instruction ('Be' < 'Co' < 'Fa')"

requirements-completed: [WASH-08]  # all three tasks done: Task 2 (worktree agent, a5f0724) + Tasks 1 and 3 (orchestrator — banner live, deploy content-verified on ea0a78d, live browse confirmed) + UAT headshot-crop fix. WASH-08 satisfied end-to-end.

# Metrics
duration: 15min (worktree Task 2) + orchestrator Tasks 1/3 + UAT-fix round-trip
completed: 2026-07-04
---

# Phase 182 Plan 05: City of Cornelius Banner + Coverage Surfacing Summary

**Closed phase 182 end-to-end: wired the single-word `cornelius` CURATED_LOCAL banner key (post-WR-03 `{state:'OR', src}` format) in buildingImages.js and surfaced Cornelius with the purple `hasContext` chip (geo_id 4115550, CORRECTED) between Beaverton and Fairview in coverage.js (Task 2, worktree agent, `a5f0724`); the orchestrator processed and uploaded the 1700×540 Cornelius Civic Center banner (CC BY-SA 3.0, M.O. Stevens) to `cities/cornelius.jpg` (Task 1), merged/pushed to `ea0a78d`, verified the Render deploy by bundle CONTENT per D-16 (served JS contains `4115550` + `cities/cornelius.jpg`), and confirmed the full live browse via Playwright — Mayor Dalin first, honest-blank Baker, accented Edén López intact, vacant seat cleanly absent, banner rendering (not gradient), no party labels (Task 3) — plus a same-session UAT fix re-cropping all 4 headshots with a circle-inscribed 4:5 crop, making the Cornelius script the Phase 183+ headshot template. WASH-08 satisfied end-to-end.**

## Performance

- **Duration:** ~15 min (worktree Task 2) + orchestrator Tasks 1/3 + UAT-fix round-trip
- **Completed:** 2026-07-04 (all 3 tasks + UAT fix)
- **Tasks:** 3 of 3 completed — Task 2 by this worktree agent; Tasks 1 and 3 (checkpoints) by the orchestrator per the dispatch instructions ("Banner processing/upload, git push to origin, Render deploy verification, and Playwright live checks are ORCHESTRATOR work")
- **Files modified:** 2 in this repo (`src/lib/coverage.js`, `src/lib/buildingImages.js`) + banner asset in Storage + 4 headshot re-uploads (UAT fix) + `_tmp-cornelius-headshots.py` crop-logic update (C:/EV-Accounts, gitignored)

## Accomplishments

- **Edit 1 — buildingImages.js:** Added a `cornelius: { state: 'OR', src: 'https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/cities/cornelius.jpg' }` entry to `CURATED_LOCAL`, placed immediately after the `sherwood` entry (alongside the other Oregon curated cities). Added an attribution comment line above `CURATED_LOCAL`:
  `//   cornelius - Cornelius Civic Center - Oregon.JPG (city hall / public library) | M.O. Stevens | CC BY-SA 3.0`
  matching the existing comment-block format and using the pre-resolved Wave-0 banner decision (per this agent's dispatch instructions: "leading candidate ... M.O. Stevens ... Use it as the selected candidate").
- **Edit 2 — coverage.js:** Inserted `{ label: 'Cornelius', browseGovernmentList: ['4115550'], browseStateAbbrev: 'OR', hasContext: true }` into the Oregon `areas` array, alphabetically between `'Beaverton'` and `'Fairview'`. Used geo_id `4115550` (CORRECTED — verified in 182-01/182-02, never the stated `4115350` which resolves to Coquille).
- **Build verification:** `npm run build` (run from the worktree root) completed successfully in ~59s, `dist/` produced, no errors. Content-checked the built bundle (`grep -c` on `dist/assets/index-*.js`) for `cornelius` (1 match) and `4115550` (1 match) — both present, confirming the source edits reach the production bundle without relying on a build-hash comparison (D-16 discipline applied even at this local-build stage).
- **No other lines changed** in either file; no raw Windows `\` path introduced (Tailwind hygiene preserved — all CDN URLs use forward slashes).

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 2 | Wire the banner in buildingImages.js and surface Cornelius in coverage.js | `a5f0724` | `src/lib/coverage.js`, `src/lib/buildingImages.js` |

Commit message: `feat(182-05): surface Cornelius purple chip + wire cornelius CURATED_LOCAL banner key`

## Files Created/Modified

- `C:/Transparent Motivations/essentials/src/lib/coverage.js` — added Cornelius Oregon-block entry (geo_id 4115550, hasContext:true)
- `C:/Transparent Motivations/essentials/src/lib/buildingImages.js` — added `cornelius` CURATED_LOCAL key + attribution comment

## Deviations from Plan

None — Task 2 executed exactly as written (single-word key, post-WR-03 `{state, src}` format, exact coverage.js entry shape, geo_id 4115550, alphabetical placement). No Rule 1-4 deviations triggered; no bugs found, no missing critical functionality, no blocking issues, no architectural changes.

## Task 1 and Task 3 — executed by the orchestrator (per dispatch execution split)

Per this agent's explicit dispatch instructions (`<parallel_execution>` EDIT SCOPE note), this worktree agent's scope was limited to the in-repo code edits (Task 2). Tasks 1 and 3 were checkpoint tasks executed by the orchestrator and are COMPLETE — full results recorded verbatim in the "Orchestrator Results" section below. The pre-resolved Wave-0 banner decision (Wikimedia Commons "Cornelius Civic Center - Oregon.JPG", CC BY-SA 3.0, M.O. Stevens — the D-14 named alternate) was carried through as planned; the D-14 post-hoc-swap precedent remains available to the operator if a better street-level candidate ever surfaces.

## Known Stubs

None. The `cornelius` CURATED_LOCAL entry's target asset `cities/cornelius.jpg` is uploaded and live (CDN HTTP 200, 117,431 bytes) — the wiring-before-upload sequencing gap that existed at the Task 2 commit was closed by the orchestrator's Task 1 in the same session, before the Task 3 live-browse check.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The edits are additive data-only changes to two existing config modules already covered by the plan's threat model (T-182-27 through T-182-33).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**This plan (182-05) and phase 182 are COMPLETE — WASH-08 satisfied end-to-end** (roster/structure 1196, headshots 1197 + UAT circle-inscribed re-crop, stances 1198-1201, banner + purple chip + live verification, all confirmed live). Notes for successor phases:

- **Live browse link (phase close):** `essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110`
- **Headshot template succession:** Phase 183+ deep-seeds must clone `_tmp-cornelius-headshots.py` (NOT Sherwood's) — it carries WR-01/WR-02/WR-C plus the new circle-inscribed 4:5 crop logic (auto-detects a square alpha bbox) that prevents white circle edges inside the round avatar mask.
- **Migration counter:** on-disk MAX = 1201; next = 1202 (per 182-04-SUMMARY; this plan added no migrations).
- **D-14 post-hoc swap:** the Civic Center banner is live and acceptable; the operator may still swap in a better street-level Cornelius scene later per precedent.
- **Vacant 5th seat:** application window closed 2026-07-22 — a future refresh pass should seat the appointee (and revisit Baker's honest-blank stances once post-appointment minutes publish).

## Self-Check: PASSED

- FOUND: `C:/Transparent Motivations/essentials/src/lib/coverage.js` contains `'Cornelius'` (geo_id 4115550, on main post-merge)
- FOUND: `C:/Transparent Motivations/essentials/src/lib/buildingImages.js` contains `cornelius:` + attribution comment
- FOUND: commits `a5f0724` (Task 2) and `2c0e68c` (SUMMARY) in `git log`, merged to main at `ea0a78d`
- `npm run build` exit 0 (worktree + post-merge); served bundle content-verified by orchestrator (`4115550`, `cities/cornelius.jpg`)
- No unexpected file deletions in the commits (`git diff --diff-filter=D --name-only` empty)

## Orchestrator Results — Tasks 1 and 3 COMPLETE (2026-07-04)

**Task 1 — Banner (done):** "Cornelius Civic Center - Oregon.JPG" (Wikimedia Commons, CC BY-SA 3.0, M.O. Stevens) processed via `process_banner.py --vertical-anchor 0.55` (1679×1412 → 1700×540, 114.7 KB; "Cornelius Civic Center" sign legible, entrance + street-level greenery in frame) and uploaded via `upload_banner.py` to `cities/cornelius.jpg` — CDN HTTP 200 (117,431 bytes). Post-hoc operator swap remains available per D-14 precedent.

**Task 3 — Push / deploy / live-verify (done):**
- Worktree merged to main; `npm run build` passed post-merge; local bundle contains `4115550`.
- Pushed `f3b6c99..ea0a78d` to origin/main; Render deploy LIVE on commit `ea0a78d` (service srv-d7290ltm5p6s73ct3a2g).
- Deploy verified by bundle CONTENT per D-16: served `assets/index-OlAU6Cvp.js` contains `4115550` and `cities/cornelius.jpg` (bundle hash differs from local build as expected — ignored).
- Live browse (`essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110`, Playwright): Civic Center banner renders (not gradient) behind "Cornelius, OR"; Mayor Jeffrey Dalin FIRST with compass icon; Cornelius City Council shows Edgar Baker (no compass icon — honest blank, correct), Angeles Godinez Valencia (compass), Edén López (accent renders, compass); vacant seat cleanly absent; NO party labels; no section-split; County/State/US sections nest correctly.

**UAT fix (user-reported, same session):** the 4 headshots showed white circle edges inside the site's round avatar mask (full-frame white composite of the circular-cutout sources). Fixed by re-cropping the largest 4:5 rectangle INSCRIBED in the photo circle (998×1248 centered on the circle center (800,1000); corner distance 799 < r=800) → 600×750 Lanczos q90, re-uploaded to the SAME canonical Storage URLs — `politician_images` rows unchanged, migration 1197 untouched. All 4 canonical CDN URLs byte-verified (`cmp`) serving the fixed crops. The circle-inscribed-crop logic (auto-detects a square alpha bbox) was added to `_tmp-cornelius-headshots.py`, making the **Cornelius script the successor headshot template for Phase 183+** (supersedes Sherwood's).

---
*Phase: 182-city-of-cornelius-deep-seed*
*Plan 05 completed 2026-07-04 — Task 2 by worktree agent (`a5f0724`); Tasks 1 and 3 + UAT headshot-crop fix by orchestrator.*
