---
phase: 182-city-of-cornelius-deep-seed
plan: 05
subsystem: frontend
tags: [coverage, buildingimages, banner, oregon, cornelius, hascontext, wr-03, worktree-partial]

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
affects: []  # this plan closes phase 182; orchestrator completes the remaining banner-upload + deploy/live-verify steps

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Parallel-worktree split of a plan with orchestrator-only steps (banner processing/upload, git push, Render deploy verification, Playwright live checks) from in-repo code edits (coverage.js/buildingImages.js) — the worktree agent executes and commits only the in-repo edit task, returning a checkpoint for the remaining orchestrator-owned steps"

key-files:
  created: []
  modified:
    - "C:/Transparent Motivations/essentials/src/lib/coverage.js"
    - "C:/Transparent Motivations/essentials/src/lib/buildingImages.js"

key-decisions:
  - "Banner source decision pre-resolved by the orchestrator at Wave-0 (auto-mode): 'Cornelius Civic Center - Oregon.JPG' (Wikimedia Commons, CC BY-SA 3.0, M.O. Stevens) — the D-14 named alternate (Public Library/City Hall), viewed at the 3.15:1 band crop and assessed workable (sign legible, entrance visible). This worktree agent did not re-adjudicate the decision; it wired the attribution string and CDN path assuming this candidate is what the orchestrator will process and upload."
  - "Cornelius CURATED_LOCAL key added as a single word (no space/hyphen trap, unlike 'forest grove') in the post-WR-03 {state:'OR', src} format, placed alongside the other Oregon entries (beaverton/hillsboro/tigard/tualatin/'forest grove'/sherwood)"
  - "coverage.js Cornelius entry placed alphabetically between Beaverton and Fairview per the plan's explicit ordering instruction ('Be' < 'Co' < 'Fa')"

requirements-completed: []  # WASH-08 is NOT fully closed by this worktree agent — banner upload + Render deploy + live-browse verification remain orchestrator-owned steps (Tasks 1 and 3). Do not mark WASH-08 complete until those steps are confirmed.

# Metrics
duration: 15min
completed: 2026-07-04
---

# Phase 182 Plan 05: City of Cornelius Banner + Coverage Surfacing Summary (PARTIAL — Task 2 only)

**Wired the single-word `cornelius` CURATED_LOCAL banner key (post-WR-03 `{state:'OR', src}` format, pointing at `cities/cornelius.jpg`) in buildingImages.js and surfaced Cornelius with the purple `hasContext` chip (geo_id 4115550, CORRECTED) between Beaverton and Fairview in coverage.js — `npm run build` passes and the built bundle was content-checked (not hash-checked, per D-16) for both `4115550` and `cornelius`, both present exactly once. This worktree agent executed ONLY Task 2 of the plan; Task 1 (banner sourcing/processing/upload to Supabase Storage) and Task 3 (git push, Render deploy verification by bundle content, live-browse end-to-end confirmation) are explicitly orchestrator-owned steps per this agent's dispatch instructions and remain outstanding.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-04 (Task 2 only; Tasks 1 and 3 pending orchestrator action)
- **Tasks:** 1 of 3 completed by this worktree agent (Task 2); Tasks 1 and 3 are checkpoint tasks explicitly reserved for the orchestrator per the dispatch instructions ("Banner processing/upload, git push to origin, Render deploy verification, and Playwright live checks are ORCHESTRATOR work — return checkpoints for those")
- **Files modified:** 2 (`src/lib/coverage.js`, `src/lib/buildingImages.js`)

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

## Task 1 and Task 3 — NOT executed by this worktree agent (orchestrator-owned)

Per this agent's explicit dispatch instructions (`<parallel_execution>` EDIT SCOPE note), this worktree agent's scope was limited to the in-repo code edits (Task 2). The following remain outstanding and must be completed by the orchestrator:

**Task 1 — banner sourcing/processing/upload:**
- Pre-resolved decision (per dispatch instructions, auto-mode Wave-0): source = Wikimedia Commons "Cornelius Civic Center - Oregon.JPG", CC BY-SA 3.0, photographer M.O. Stevens. Attribution string used in this plan's code edit: "M.O. Stevens, CC BY-SA 3.0, via Wikimedia Commons."
- **Post-hoc-swap precedent note:** per D-14, this candidate required the heaviest crop of the milestone (native ~1.19:1 to the 3.15:1 target). The orchestrator assessed the crop as workable at Wave-0 ("Cornelius Civic Center" sign legible, entrance visible) but the actual `process_banner.py --vertical-anchor` run and final visual review have NOT been performed by this agent. If the final 1700x540 crop looks materially worse than the Wave-0 preview, the orchestrator retains authority to swap to the `unsplash` fallback option per the plan's Task 1 decision options — this is the "post-hoc-swap precedent" referenced in the dispatch instructions.
- Outstanding steps: run `python scripts/banners/process_banner.py --input <raw> --output <processed_1700x540.jpg> --vertical-anchor <0.4-0.55>`, then `python scripts/banners/upload_banner.py --file <processed_1700x540.jpg> --path cities/cornelius.jpg`, and confirm the CDN URL returns HTTP 200.

**Task 3 — deploy, live-browse verification, push:**
- The code edits from Task 2 are committed in this worktree (`a5f0724`) but have NOT been pushed to origin from this worktree agent — the orchestrator owns merging worktree branches and pushing to trigger the Render deploy.
- After deploy, the orchestrator must verify by bundle CONTENT (grep the served JS for `4115550` or `cities/cornelius.jpg`), never by hash comparison (D-16 — a 45-min false wait occurred in phase 181 from hash-chasing).
- Live-browse verification at `essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110` — confirm Mayor Dalin sorts first, 3 filled councilors follow, vacant seat renders cleanly, headshots/stances render, banner renders (not gradient fallback), purple chip appears, no party label.

## Known Stubs

None introduced by this plan's edits. The `cornelius` CURATED_LOCAL entry points at `cities/cornelius.jpg`, which does NOT yet exist in Supabase Storage as of this agent's commit (Task 1 pending) — until the orchestrator uploads the banner, `getBuildingImages()` will return this URL but the underlying asset will 404, and the Local section will show a broken image rather than the gradient fallback (the code has no existence check; this mirrors every prior phase's plan-05 sequencing, where the CURATED_LOCAL key is always wired before the upload completes). This is expected sequencing, not a defect — Task 1 must complete before Task 3's live-browse check.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. The edits are additive data-only changes to two existing config modules already covered by the plan's threat model (T-182-27 through T-182-33).

## User Setup Required

None from this agent's edits. The orchestrator's remaining Task 1/Task 3 work requires: Supabase Storage upload credentials (already available to the orchestrator per the banner-asset-pipeline convention) and the Render API key at `C:/EV-Accounts/backend/.env` (service `srv-d7290ltm5p6s73ct3a2g`) for deploy-status polling.

## Next Phase Readiness

**This plan (182-05) and phase 182 are NOT yet complete.** Task 2 (this agent's scope) is done and committed. The orchestrator must still:
1. Run the banner pipeline (Task 1) using the pre-resolved Wikimedia Commons candidate, upload to `cities/cornelius.jpg`, confirm HTTP 200.
2. Push this worktree's commit (`a5f0724`) to origin/main (merge per the harness's worktree-merge convention).
3. Verify the Render deploy by bundle content (never hash).
4. Perform the live-browse end-to-end check and confirm all Task 3 acceptance criteria.
5. Only after all of the above pass should WASH-08 be marked complete and STATE.md/ROADMAP.md updated — this worktree agent explicitly did NOT touch STATE.md or ROADMAP.md per its dispatch instructions.

Live browse link (once the above completes): `essentials.empowered.vote/results?browse_geo_id=4115550&browse_mtfcc=G4110`

## Self-Check: PASSED

- FOUND: `C:/Transparent Motivations/essentials/.claude/worktrees/agent-af4c6e5d63c83f677/src/lib/coverage.js` contains `'Cornelius'`
- FOUND: `C:/Transparent Motivations/essentials/.claude/worktrees/agent-af4c6e5d63c83f677/src/lib/buildingImages.js` contains `cornelius:`
- FOUND: commit `a5f0724` in `git log --oneline`
- `npm run build` exit 0; built bundle grep confirms `4115550` (1 match) and `cornelius` (1 match)
- No unexpected file deletions in the commit (`git diff --diff-filter=D --name-only HEAD~1 HEAD` empty)

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
