---
phase: 201-riverside-county-board-of-supervisors-deep-seed
plan: 03
subsystem: media-pipeline
tags: [python, pillow, headshots, riverside-county, board-of-supervisors, audit-only]

# Dependency graph
requires:
  - phase: 201-02
    provides: "5 politician UUIDs (ext_id -4010001..-4010005) bound to the 5 supervisor offices"
provides:
  - "5/5 Riverside County Supervisor headshots, 600x750 4:5 crop-first Lanczos q90, uploaded to politician_photos Storage bucket"
  - "5 politician_images rows (audit-only, unregistered), type='default', per-image actual photo_license"
affects: [201-04-stances, 201-05-banner-coverage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RGBA->white-composite fix (Rule 1 bug) added to process_headshot_bytes: a naive convert('RGB') on a transparent-background PNG can leave a BLACK backdrop instead of white (confirmed live on Chuck Washington's own-site portrait) -- composite onto a white canvas via the alpha channel as mask BEFORE crop/resize"
    - "CMS-asset-host-vs-HTML-page WAF discrepancy: Cloudflare Managed Challenge blocks the HTML page on all 5 rivcodistrict*.org/rivco4.org domains, but the same domains' Drupal image-derivative asset paths (sites/g/files/.../styles/...) are NOT behind that challenge and return HTTP 200 to a plain requests.get -- confirmed individually for 4/5 domains; Wayback Machine (web.archive.org) used only for URL *discovery* on the WAF-blocked bio pages, never for the final fetch"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-riverside-supervisors-headshots.py (gitignored, not committed)
    - C:/EV-Accounts/backend/migrations/1315_riverside_county_headshots.sql
  modified: []

key-decisions:
  - "Chuck Washington sourced from Ballotpedia (200x300, press_use) instead of his own site's only available portrait -- that source was an off-center 650x650 full-body crop with the subject pushed into the right third of frame; a center-crop-to-4:5 would have left excessive empty space on the left. Ballotpedia's already-centered headshot produced correct framing after the standard crop-first pipeline."
  - "4/5 supervisors (Medina/Spiegel/Perez/Gutierrez) sourced from their own official district-site CMS asset host, license='us_government_work' -- even though the SITE PAGE itself is WAF-403 (Cloudflare Managed Challenge), the underlying asset host is not behind that same challenge and was fetched live and directly (not via Wayback) by the pipeline script"
  - "Added an RGBA-to-white-composite step ahead of crop/resize (Rule 1 bug fix) -- the Pima/prior-phase analog's plain convert('RGB') would have produced a black backdrop on at least one candidate source image; fixed before it could reach Storage"

requirements-worked: [CV-01]

# Metrics
duration: 45min
completed: 2026-07-12
---

# Phase 201 Plan 03: Riverside County Board of Supervisors Headshots Summary

**Sourced, processed (crop-first 4:5 -> 600x750 Lanczos q90), and uploaded all 5 Riverside County Board of Supervisors headshots to the politician_photos Storage bucket, then applied the audit-only politician_images migration (1315) -- all 4 official-district-site sources bind license='us_government_work', Ballotpedia-sourced Chuck Washington binds 'press_use'; all 5 CDN URLs verified HTTP 200 at exactly 600x750.**

## Performance

- **Duration:** ~45 min (recon-heavy: primary + all 5 district-site domains WAF-403, required per-domain asset-host discovery)
- **Completed:** 2026-07-12
- **Tasks:** 3 (Task 1 script authored; Task 2 migration authored + committed; Task 3 run inline by this sequential executor -- pipeline run, migration applied, assertions verified)
- **Files modified:** 2 (1 gitignored script, not committed; 1 migration, committed to `C:/EV-Accounts`)

## Accomplishments

- **Recon confirmed the full WAF-403 surface is wider than the CONTEXT.md-documented `rivco.gov`/`rivcocob.org`:** all 5 individual district-site HTML pages (`rivcodistrict1.org`, `rivcodistrict2.org`, `supervisorchuckwashington.com`, `rivco4.org`, `rivcodistrict5.org`) also return Cloudflare "Managed Challenge" 403 to a bare HTTP client. However, each site's underlying Drupal CMS **image-derivative asset host** (`sites/g/files/.../styles/.../public/...`) is NOT behind the same challenge and returns HTTP 200 directly -- confirmed individually per domain via live HEAD probes before hardcoding any URL.
- **Used the Wayback Machine (web.archive.org) purely as a discovery tool**, not a fetch source: mirrored copies of the WAF-blocked bio/homepage HTML let this executor find each supervisor's actual image filename (e.g. `Yxstian-Gutierrez-Head-Shoulders-4.png`, `JM Personal Headshot copy Small.png`, `Manuel-Perez_0.png`, `DSC_9417_1.jpeg`), then confirmed each file is reachable **live and directly** from the original domain (not via archive.org) before hardcoding it into the ROSTER.
- **Chuck Washington source swap:** his own site's only available portrait (`CW Headshot 2.png`, a 650x650 transparent PNG) placed the subject in the right third of the canvas with excessive empty space on the left -- a center-crop-to-4:5 would have produced an unbalanced, awkward frame. Rejected in favor of Ballotpedia's already-centered 200x300 headshot (license='press_use', matching the project's established convention for Ballotpedia-sourced portraits).
- **Rule 1 bug fix (RGBA-to-white-composite):** confirmed via direct visual inspection that a naive `img.convert('RGB')` on the Washington transparent PNG left a **solid black backdrop** instead of white. Added a `to_rgb_white_background()` step (composite via alpha-channel mask onto a white canvas) ahead of the crop step in `process_headshot_bytes()`, per the project's established `RGBA->white-composite` fix (see `project_phase163_complete` memory note, Henderson City Council). Verified visually on all 5 candidates post-fix before running the real pipeline.
- Authored and ran `_tmp-riverside-supervisors-headshots.py`: dry-run HEAD check 5/5 passed, then downloaded/cropped/resized/uploaded all 5 -- script exited 0, manifest printed.
- Authored and applied migration `1315_riverside_county_headshots.sql` (audit-only, unregistered) -- 5/5 `INSERT 0 1` (idempotent `WHERE NOT EXISTS` guard, first-run inserts).
- Verified in production: `politician_images` count for the 5 Riverside ext_ids = 5; all 5 CDN URLs return HTTP 200; PIL dimension check on all 5 downloaded CDN images = exactly 600x750; `type='default'` on all 5; ledger `schema_migrations` has no `1315` row (audit-only confirmed).

## Final Manifest

| Dist | external_id | politician UUID | Full Name | Source | photo_license |
|---|---|---|---|---|---|
| 1 | -4010001 | ea521b54-7b19-459a-9993-4ce70a84d592 | Jose Medina | rivcodistrict1.org (official site asset host) | us_government_work |
| 2 | -4010002 | 9c4ae0c3-81fe-4034-8f64-e5cd6f815f6f | Karen Spiegel (Chair) | rivcodistrict2.org (official site asset host) | us_government_work |
| 3 | -4010003 | 8770fed4-7595-46e2-9103-246f3904a96b | Chuck Washington | Ballotpedia (his own site's photo was off-center; Ballotpedia already-centered) | press_use |
| 4 | -4010004 | c986a6af-f09f-4934-83ed-1d9cd26a84f1 | V. Manuel "Manny" Perez | rivco4.org (official site asset host) | us_government_work |
| 5 | -4010005 | 26d3fdd0-7fd3-4e41-bd1c-88fb6e2dabae | Dr. Yxstian Gutierrez | rivcodistrict5.org (official site asset host; URL discovered via Wayback mirror of the WAF-blocked bio page, fetched live/direct) | us_government_work |

CDN base: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg`

No `/find-headshots` skill invocation or operator-supplied file was needed -- all 5 required sources resolved cleanly during recon.

## Task Commits

1. **Task 1: Author the supervisor headshot pipeline script** -- no commit (file is gitignored `backend/scripts/_*`, never committed, matching every prior phase's `_tmp-*` convention).
2. **Task 2: Author the audit-only headshot migration** -- `7d95c1bb` (feat, `C:/EV-Accounts` repo, branch `master`).
3. **Task 3: Run pipeline + apply migration + assert 5/5** -- no code commit (DB-write-only via script run + `psql -f`; migration file already committed in Task 2). Applied to production; all 5 `politician_images` rows inserted; ledger unchanged (0 rows at version '1315').

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/_tmp-riverside-supervisors-headshots.py` -- headshot ETL pipeline (gitignored, not committed). Adapted from `_tmp-pima-supervisors-headshots.py`: reused `resolve_politician_id`/`head_check`/`download_image`/`crop_to_4_5`/`resize_600x750`/`upload_to_storage`/`dry_run_head_check` verbatim; added `to_rgb_white_background()` (Rule 1 fix) ahead of the crop step; new 5-member ROSTER with per-member hardcoded source URLs and per-image `photo_license`.
- `C:/EV-Accounts/backend/migrations/1315_riverside_county_headshots.sql` -- audit-only migration (unregistered). 5 idempotent `INSERT ... WHERE NOT EXISTS` rows into `essentials.politician_images`, columns exactly `(id, politician_id, url, type, photo_license)`, `type='default'` on all 5, per-image `photo_license` (4x `us_government_work`, 1x `press_use`).

## Decisions Made

- Confirmed and documented that the WAF-403 surface extends beyond the two primary domains named in CONTEXT.md to all 5 individual district-site HTML pages -- but their CMS asset hosts are unaffected, so no `/find-headshots` fallback or operator-supplied file was required.
- Swapped Chuck Washington's source from his own site (off-center framing) to Ballotpedia (well-centered) -- a quality-driven source substitution, not a fallback-for-failure; his own site's asset was technically reachable (HTTP 200) but produced an unacceptable crop.
- Added the RGBA-to-white-composite fix to the pipeline (Rule 1 -- bug: the un-fixed pipeline would have produced a black-backdrop image for at least one candidate source).

## Deviations from Plan

- **[Rule 1 - Bug] Added RGBA->white-composite step before crop/resize.** The Pima analog's `process_headshot_bytes()` does a plain `img.convert('RGB')` on any non-RGB source, which silently drops the alpha channel and can leave the RAW (frequently black) color data for fully-transparent pixels instead of compositing to white. Confirmed this would have produced a black backdrop on the Chuck Washington source candidate during recon (visual side-by-side comparison). Fixed by adding `to_rgb_white_background()`, which composites RGBA/LA/transparent-palette images onto a white canvas via the alpha channel as mask before any crop step. Verified visually on all 5 final candidates post-fix. Files: `_tmp-riverside-supervisors-headshots.py`. No commit (gitignored).
- **[Source substitution, not a Rule 1-4 deviation] Chuck Washington sourced from Ballotpedia, not his own official district site.** His own site's only available portrait was reachable (HTTP 200) but framed with the subject in the right third of a 650x650 canvas; a standard center-crop-to-4:5 would leave excessive empty space. This is a quality decision within the plan's explicit "hardcode per member after an individual probe" latitude, not a failure requiring `/find-headshots` -- documented here for traceability. `photo_license` correctly reflects the actual Ballotpedia source (`press_use`), not defaulted to `us_government_work`.
- **[Workflow note, same as 201-02]** Task 3 is labeled "ORCHESTRATOR-RUN" in the plan (written for a parallel-worktree executor with no DB/Storage access), but this plan runs as a sequential executor on the main tree with direct `psql`/Storage access (per the objective's explicit instruction), so the pipeline run + migration apply + assertions were completed inline in this session. Not a Rule 1-4 deviation.

## Issues Encountered

None blocking. The WAF-403 surface was wider than documented (all 5 district-site HTML pages, not just the 2 primary domains), but every asset host resolved cleanly on the first per-domain probe, so no `/find-headshots` fallback was triggered.

## Known Stubs

None -- 5/5 headshots are live, bound, and verified at 600x750 HTTP 200. Compass stances (Plan 04) and the banner + coverage.js chip (Plan 05) are separate downstream plans by design, not stubs.

## Threat Flags

None -- all image-fetch/binding/license/key-handling surface was already anticipated in the plan's `<threat_model>` (T-201-IMG, T-201-BIND, T-201-LIC, T-201-KEY, T-201-WRONG, T-201-SC); no new surface introduced.

## Next Phase Readiness

- The headshot half of ROADMAP success criterion #3 (5/5 supervisors have 600x750 headshots) is now TRUE in production.
- T-201-WRONG (wrong-but-present image, row-count cannot detect) remains transferred to Plan 06's human-verify spot-check, per the threat model's disposition.
- No blockers for Plan 04 (evidence-only compass stances).

---
*Phase: 201-riverside-county-board-of-supervisors-deep-seed*
*Completed: 2026-07-12*

## Self-Check: PASSED

- FOUND: C:/EV-Accounts/backend/scripts/_tmp-riverside-supervisors-headshots.py
- FOUND: C:/EV-Accounts/backend/migrations/1315_riverside_county_headshots.sql
- FOUND: .planning/phases/201-riverside-county-board-of-supervisors-deep-seed/201-03-SUMMARY.md
- FOUND: commit 7d95c1bb (migration, C:/EV-Accounts repo)
- VERIFIED (live prod): politician_images count=5 for ext_ids -4010001..-4010005; all 5 CDN URLs HTTP 200; PIL dimension check=600x750 on all 5; type='default' on all 5; ledger has 0 rows at version '1315' (audit-only confirmed)
