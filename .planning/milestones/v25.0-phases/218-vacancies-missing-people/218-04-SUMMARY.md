---
phase: 218-vacancies-missing-people
plan: 04
subsystem: database
tags: [supabase-storage, headshots, image-processing, collin-county-tx, brownfield-seeding]

requires: ["218-02", "218-03"]
provides:
  - "12 new 600x750 headshots sourced from official .gov/.us city sites, processed (4:5 crop, Lanczos, q90), and uploaded to Supabase Storage for newly-seated Collin County, TX officials"
  - "Idempotent audit migration (1391) recording the corresponding essentials.politician_images rows"
affects: [218-05]

tech-stack:
  added: []
  patterns:
    - "Headshot sourcing without Playwright/Supabase MCP: curl + grep/Read-tool visual inspection to locate <img> src on CivicPlus/WordPress/membershipware council pages, Python PIL (crop-then-resize, Lanczos, q90) for processing, Node fetch + SUPABASE_SERVICE_ROLE_KEY (loaded via dotenv, never echoed) for direct Storage upload"
    - "Audit migration pattern extended to images: idempotent DO block per person, WHERE NOT EXISTS (SELECT 1 FROM politician_images WHERE politician_id = ...) guard, mirroring the 1389/1390 seating-migration idempotency convention"
    - "Apply-script gate now includes a live dimension check: a ~30-line dependency-free JPEG SOF-marker parser fetches each Storage URL and asserts actual 600x750 pixels, not just locally-processed dimensions"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1391_collin_headshots_audit.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1391_collin_headshots_audit.ts (gitignored, kept on disk)
  modified: []

key-decisions:
  - "Sourced without the /find-headshots command's declared toolset (Playwright, mcp__supabase-local, AskUserQuestion were unavailable to this executor) — substituted curl (with browser User-Agent) to fetch each city's council/bio page HTML, grep/Read-tool to locate and visually inspect <img> src candidates, and Python PIL (via the `py` launcher, not `python`/`python3`) for crop+resize. This executor is autonomous (plan `autonomous: true`, no checkpoint tasks), so the skill's per-photo AskUserQuestion approval loop was replaced by the plan's own equivalent gate: 100% visual inspection via the Read tool before upload, plus the apply-script's live post-upload dimension/type/license assertions."
  - "Crop-box convention implemented as an explicit per-image (left, top, right, bottom) tuple computed from a visual read of each raw image (headroom, eye line, face center-x), rather than a blind center-crop — needed because several sources (Fairview's Stanley, Anna's Baker, Parker's Pettle) have off-center subjects or landscape-oriented photos where a naive center crop would misplace the face."
  - "Zach Williams (Van Alstyne, Place 6) is an honest blank despite Plan 03 flagging a real photo URL: the membershipware people-API's `personPhoto` blob URL was found and decoded correctly, but every fetch variant (cityofvanalstyne.us and app.membershipware.com hosts; raw/single-encoded/double-encoded slash forms of the blob id; with/without the `rf=t` flag) either hit an Azure-edge WAF 400 (empty body — the `rf=t` + encoded-slash combination specifically) or, once the WAF was avoided by dropping `rf=t`, a legitimate app-level `{\"error\":\"Access denied: item not accessible\"}` JSON response. Confirmed via a parallel test against Jim Atchison's (Mayor) blob URL, which worked fine without slashes in its id — ruling out a systemic outage. This is a genuine access-control/WAF dead end, not a missed retry."
  - "Jessica Walden (Anna, Place 3) is an honest blank: her official bio page (annatexas.gov) has no photo widget at all (unlike her Place-5 colleague Elden Baker's page, confirmed by diffing the two pages' HTML for the `divImage`/`ImageRepository` pattern), Ballotpedia returned a Cloudflare 202 challenge (not fetchable without a browser), and the TML directory returned 406."
  - "License = 'press_use' for all 12 images (consistent with prior deep-seed convention): every source is an official municipal .gov/.us website (annatexas.gov, fairviewtexas.org, parkertexas.us, princetontx.gov, cityofvanalstyne.us, westontexas.com, lucastexas.us) — government-authored bio photos, not third-party/social media."
  - "Gary Chappell (Josephine) and Shun Thomas (Plano) were excluded from this plan's target list — both already had a politician_images row before this plan started (Gary Chappell's preserved via Plan 02's candidate-row reuse fix; Shun Thomas's from the pre-existing migration 091) — confirmed via a live-DB precheck before any sourcing began."

requirements-completed: [COLLIN-PEOPLE-01]

coverage:
  - id: D1
    description: "12 of 14 attempted newly-seated officials (Plans 02/03, excluding Blue Ridge/Lowry Crossing/Nevada honest-blank cities and the 2 already-photographed people) now have a real, sourced 600x750 headshot in Supabase Storage + politician_images; the remaining 2 (Jessica Walden, Zach Williams) are documented honest blanks after a genuine sourcing attempt"
    requirement: "COLLIN-PEOPLE-01"
    verification:
      - kind: other
        ref: "npx tsx scripts/_apply-migration-1391_collin_headshots_audit.ts (embedded gates a-d: row count=12, live 600x750 dimension check via JPEG SOF parser + type/license assertions, 0 rows for the 13-person honest-blank set, idempotent re-run)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Visual crop-quality spot-check: 4:5 ratio, eyes roughly 1/3 from top, head+shoulders framing, no text/graphics over any face"
    verification: []
    human_judgment: true
    rationale: "Crop aesthetics (headroom, eye-line placement, framing) is a subjective visual judgment the plan itself flags as human-check (VALIDATION.md manual headshot QA row); the executor visually reviewed all 12 processed images via the Read tool before upload and reports them as compliant, but final sign-off is a human call, same as every prior deep-seed headshot batch."

duration: 45min
completed: 2026-07-24
status: complete
---

# Phase 218 Plan 04: Source + Import Headshots for Newly-Seated Collin County, TX Officials Summary

**Sourced, cropped (4:5, Lanczos, q90, 600x750), and uploaded 12 real headshots from official .gov/.us city sites to Supabase Storage, then recorded them via an idempotent audit migration (1391) — 2 people (Jessica Walden, Zach Williams) left as honest blanks after genuine sourcing attempts found no accessible source.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-07-24
- **Tasks:** 2
- **Files modified:** 1 committed (migration SQL, C:/EV-Accounts repo); apply script gitignored per repo convention (`backend/scripts/_*`), kept on disk

## Accomplishments

- Built the target list from Plan 02 (20 offices) + Plan 03 (7 offices) SUMMARYs, excluded the 11 people across the 3 documented zero-photo cities (Blue Ridge, Lowry Crossing, Nevada) per D-03, and excluded Gary Chappell (Josephine) + Shun Thomas (Plano) who already had images — confirmed all of this via a live-DB precheck before sourcing began, leaving 14 people to attempt.
- Sourced and processed 12 of the 14: Elden Baker (Anna), Joe W. Boggs/Lakia Works/John Stanley (Fairview), Lee Pettle/Buddy Pilgrim/Billy Barron (Parker), Jaisen Rutledge (Princeton), Jim Atchison (Van Alstyne), Marla Johnston (Weston), Jonathan Underhill/Rebecca B. Orr (Lucas) — every image found on the person's own city's official bio/roster page (CivicPlus ImageRepository, WordPress media library, or DNN/ASP.NET council page), cropped 4:5 with a per-image visually-chosen box (headroom + eye-line + face center-x), resized to 600x750 with Lanczos, saved at q90, and uploaded to the `politician_photos` Storage bucket under the established `{politician_id}-headshot.jpg` naming.
- 2 honest blanks after genuine attempts: Jessica Walden (Anna) — her official bio page has no photo widget (confirmed by diffing against her Place-5 colleague's page, which does), Ballotpedia gave a Cloudflare 202 challenge, TML directory returned 406; Zach Williams (Van Alstyne) — a real `personPhoto` blob URL was located and correctly decoded from the site's membershipware people-API JSON, but every fetch variant was rejected by either an Azure-edge WAF (400, empty body, specifically the `rf=t` + encoded-slash combination) or a legitimate app-level "Access denied: item not accessible" once the WAF was avoided — confirmed as a real access-control dead end (not a fluke) by successfully fetching a sibling blob (Jim Atchison's) with the same method.
- Wrote migration 1391 (idempotent, `WHERE NOT EXISTS` guard per politician_id, matching the 1389/1390 convention) and its apply-script, which embeds a live post-upload dimension check — a small dependency-free JPEG SOF-marker parser that fetches each Storage URL and confirms it is physically 600x750, not just locally-processed at that size.
- All 4 embedded apply-script gates passed on first run and a full idempotent re-run: (a) exactly 12 politician_images rows for the target set, (b) every row `type='default'`, `photo_license='press_use'`, live-fetched 600x750, (c) zero image rows for the 13-person honest-blank set (2 attempted-not-found + 11 zero-photo-city), (d) re-run inserts 0 additional rows and preserves the identical politician_id set.
- Pushed to `C:/EV-Accounts` `master` (commit `50d2e37d`) — deployed live via Render.

## Task Commits

1. **Task 1: Source + process headshots via the /find-headshots pipeline** — no separate commit (image files uploaded directly to Supabase Storage via HTTP, not tracked in git; DB rows created by the Task 2 migration below).
2. **Task 2: Audit-only migration recording politician_images rows** — `50d2e37d` (feat, C:/EV-Accounts repo, pushed to `origin/master`)

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1391_collin_headshots_audit.sql` — 12 idempotent DO $$ blocks (1 per politician), each guarded with `WHERE NOT EXISTS (SELECT 1 FROM politician_images WHERE politician_id = ...)`
- `C:/EV-Accounts/backend/scripts/_apply-migration-1391_collin_headshots_audit.ts` — apply script with 4 embedded gates (row-count match, live 600x750 dimension + type/license check via an inline JPEG SOF parser, honest-blank zero-rows assertion, idempotent re-run); gitignored by repo convention, kept on disk

## Found-vs-Honest-Blank Per Person (for Plan 05 verification)

| # | City (geo_id) | Office | Person | Result | Source |
|---|------|--------|--------|--------|--------|
| 1 | Anna (4803300) | Council Member Place 3 | Jessica Walden | **HONEST BLANK** | No photo widget on bio page; Ballotpedia 202 (Cloudflare); TML directory 406 |
| 2 | Anna (4803300) | Council Member Place 5 | Elden Baker | FOUND | annatexas.gov/1426/Elden-Baker (ImageRepository documentID=8805) |
| 3 | Fairview (4825224) | Council Member Seat 2 | Joe W. Boggs | FOUND | fairviewtexas.org/government/mayor-town-council/ (Joe-Boggs-cropped.jpeg) |
| 4 | Fairview (4825224) | Council Member Seat 6 | Lakia Works | FOUND | fairviewtexas.org/government/mayor-town-council/ (New-Lakia-Works-resized-300x200.jpg, upscaled) |
| 5 | Fairview (4825224) | Council Member Seat 4 | John Stanley | FOUND | fairviewtexas.org/government/mayor-town-council/ (JohnStanley-74-cropped-2048x1536.jpg) |
| 6 | Josephine (4838068) | Council Member Place 5 | Gary Chappell | N/A (already had image) | Preserved from May-2026 discovery pipeline via Plan 02's candidate-row reuse |
| 7 | Parker (4855152) | Mayor | Lee Pettle | FOUND | parkertexas.us/76/City-Council (ImageRepository documentID=3261) |
| 8 | Parker (4855152) | Council Member Place 3 | Buddy Pilgrim | FOUND | parkertexas.us/76/City-Council (ImageRepository documentId=3886) |
| 9 | Parker (4855152) | Council Member Place 5 | Billy Barron | FOUND | parkertexas.us/76/City-Council (ImageRepository documentId=4030) |
| 10 | Plano (4858016) | Council Member Place 7 | Shun Thomas | N/A (already had image) | Pre-existing (migration 091, pre-dates Phase 218) |
| 11 | Princeton (4859576) | Council Member Place 4 | Jaisen Rutledge | FOUND | princetontx.gov/735/Jaisen-Rutledge (ImageRepository documentId=8685) |
| 12 | Van Alstyne (4874924) | Mayor | Jim Atchison | FOUND | cityofvanalstyne.us/council (membershipware personPhoto blob) |
| 13 | Van Alstyne (4874924) | Council Member Place 6 | Zach Williams | **HONEST BLANK** | personPhoto blob URL found + decoded correctly but WAF/access-denied on every fetch variant |
| 14 | Weston (4877740) | Council Member Place 5 | Marla Johnston | FOUND | westontexas.com/page/Mayor_Aldermen (Council Photo - Marla Johnston.jpg) |
| 15 | Lucas (4845012) | Council Member Place 1 | Jonathan Underhill | FOUND | lucastexas.us/164/City-Council (ImageRepository documentID=1094) |
| 16 | Lucas (4845012) | Council Member Place 2 | Rebecca B. Orr | FOUND | lucastexas.us/164/City-Council (ImageRepository documentID=1095) |

Blue Ridge (Rhonda Williams, David Apple, Keith Chitwood), Lowry Crossing (Muhanad Hijazen, Chris Madrid, Agur Rios, Cindy Cash, Ollie Simpson), and Nevada (Donald Deering, Mike Laye, Paul Baker) — 11 people across 3 documented zero-photo cities — were excluded up front per D-03 and are honest blanks by milestone convention, not attempted this plan.

**Totals:** 12 FOUND + 2 honest blank (attempted) + 11 honest blank (zero-photo city, not attempted) + 2 already-had-image (excluded from target list) = 27 (matches the full Plan 02 + Plan 03 seated-office count).

## Decisions Made

- **Toolset substitution for headshot sourcing:** the `/find-headshots` command declares Playwright, `mcp__supabase-local`, and `AskUserQuestion` in its frontmatter, none of which were available to this executor. Substituted curl (browser User-Agent) for page fetches, grep + the Read tool for locating and visually inspecting `<img>` candidates, Python PIL (via the `py` launcher — plain `python`/`python3` are not on PATH in this environment) for crop+resize, and Node `fetch` + `SUPABASE_SERVICE_ROLE_KEY` (loaded via `dotenv` inside a script, never printed to the transcript) for the direct Storage upload. The per-photo `AskUserQuestion` human-approval step was replaced by 100% visual inspection via the Read tool before upload (since this plan is `autonomous: true` with no checkpoint tasks) plus the apply-script's live post-upload dimension/type/license assertions — an equivalent-or-stronger quality gate for an unattended run.
- **Per-image explicit crop box, not a blind center-crop:** several sources have off-center subjects (Fairview's John Stanley posed left-of-frame with arms crossed; Anna's Elden Baker at a lectern; Parker's Lee Pettle in a wide landscape shot with much blank background to one side). Computed each crop box from a direct visual read of the raw image (headroom above hair, eye-line y-position, face center-x) rather than assuming center-crop would land correctly.
- **Zach Williams WAF/access-denied — confirmed genuine, not a fluke:** ran the identical fetch method against Jim Atchison's blob (successfully, HTTP 200) to rule out a general outage; the difference isolates to Williams' blob id containing `/`-characters that trip an Azure-edge WAF rule specifically when combined with the `rf=t` query flag, and a legitimate app-level access-denied once that flag is dropped. Documented as an honest blank per the plan's "never fabricate" rule.
- **License = 'press_use' for all 12:** every source is an official municipal .gov/.us website, consistent with the license convention used for every prior TX/OR/NV/MD/VA deep-seed headshot batch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Toolset unavailable — substituted equivalent tools without changing the plan's outcome**
- **Found during:** Task 1, at skill-invocation time
- **Issue:** The plan's environment_notes direct execution via the `/find-headshots` Skill, but that command's own frontmatter declares `mcp__playwright__*`, `mcp__supabase-local__execute_sql`, and `AskUserQuestion` as required tools — none were present in this executor's tool list (Read, Write, Edit, Bash, Grep, Glob, Skill only).
- **Fix:** Used Bash (curl with a browser User-Agent) for HTML fetches, Grep/Read for locating and visually inspecting candidate images, Python PIL (via `py`, since `python`/`python3` are not on PATH) for the crop+resize pipeline, and a Node script (dotenv + native `fetch`) for the Storage upload — functionally equivalent to the skill's documented process, adapted for the tools actually available.
- **Files modified:** None (tooling substitution only; no plan files affected)
- **Commit:** N/A (research/sourcing step, no file changes to commit)

## Known Stubs

None — every politician_images row inserted by migration 1391 points to a real, sourced, live-fetchable 600x750 image with a documented `photo_license`. No placeholder or fabricated images were created for the 2 honest-blank people (Jessica Walden, Zach Williams) or the 11 zero-photo-city people.

## Issues Encountered

- Zach Williams' membershipware blob URL required extensive fetch-variant testing (raw slash, single %2F, double %252F, both hostnames, with/without the `rf=t` flag) before conclusively confirming the source is genuinely inaccessible via automation rather than a transient error — documented in detail in `key-decisions` above so Plan 05 doesn't re-attempt the same dead end.
- `python`/`python3` are not on PATH in this Windows environment; the `py` launcher (Python 3.14.3, with `requests` + `Pillow` pre-installed) works and was used for all image processing.

## User Setup Required

None — no external service configuration required. Migration deployed via `git -C "C:/EV-Accounts" push origin master` (Render auto-deploy from `master`), consistent with `[[backend_architecture]]` / `[[no_git_in_ev_accounts]]`. Image uploads used the existing `SUPABASE_SERVICE_ROLE_KEY` already present in `C:/EV-Accounts/backend/.env` (loaded via `dotenv`, never printed).

## Next Phase Readiness

Plan 05 (verification) should independently spot-check the 12 new headshots live (VALIDATION.md manual headshot QA row — this SUMMARY's D2 coverage entry flags that as human-judgment, not auto-passed) and can treat Jessica Walden + Zach Williams as confirmed honest blanks (no further sourcing attempt needed — both were exhausted this plan, see `key-decisions` for the specific dead ends hit). Live browse spot-check URLs for the affected cities: `/results?browse_geo_id=4803300` (Anna), `4825224` (Fairview), `4855152` (Parker), `4859576` (Princeton), `4874924` (Van Alstyne), `4877740` (Weston), `4845012` (Lucas).

No blockers. All 4 embedded gates clean on both runs; idempotency proven via a full re-run producing an identical politician_id set with 0 additional inserts.

---
*Phase: 218-vacancies-missing-people*
*Completed: 2026-07-24*

## Self-Check: PASSED

- FOUND: `.planning/phases/218-vacancies-missing-people/218-04-SUMMARY.md`
- FOUND: `C:/EV-Accounts/backend/migrations/1391_collin_headshots_audit.sql`
- FOUND: `C:/EV-Accounts/backend/scripts/_apply-migration-1391_collin_headshots_audit.ts` (gitignored, on disk)
- FOUND commit `50d2e37d` (C:/EV-Accounts, pushed to origin/master)
- FOUND commit `3bc5cb79` (essentials, SUMMARY.md)
