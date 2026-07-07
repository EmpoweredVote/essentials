---
phase: 181-city-of-sherwood-deep-seed
plan: 03
subsystem: headshots
tags: [headshots, pipeline, sherwood, or, audit-migration, wr-c, wr-a]
dependency-graph:
  requires:
    - "181-01 (confirmed 7/7 direct-download URLs, square-source crop nuance, daniel-standke filename)"
    - "181-02 (minted politician ext_ids -4167101..-4167107, structural migration 1187)"
  provides:
    - "_tmp-sherwood-headshots.py pipeline script (gitignored, awaiting orchestrator run)"
    - "1188_sherwood_headshots.sql audit-only migration (authored, awaiting orchestrator apply)"
  affects:
    - "181-04-PLAN.md (stances; consumes the same 7 ext_ids/UUIDs)"
    - "181-05-PLAN.md (banner)"
tech-stack:
  added: []
  patterns:
    - "D-15 WR-A: ORCHESTRATOR NOTE expected-count text kept literally in sync with the post-verify gate's `IF n <> 7` at authoring time"
    - "D-15 WR-C: `if len(OFFICIALS) > 0:` guard before test_download_guard(OFFICIALS[0])"
    - "Square-source (600x600) crop-to-4:5 trims WIDTH (600->480 centered) rather than the usual height-trim"
key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py (gitignored, separate EV-Accounts repo)"
    - "C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql (separate EV-Accounts repo, committed 9ce7f5a8)"
  modified: []
decisions:
  - "Hard-asserted len(OFFICIALS)==7 in the script (unlike Forest Grove's tolerant partial-outcome assert) — RESEARCH confirmed 7/7 direct sourcing with no genuine gap expected, the best sourcing outcome of the milestone"
  - "photo_license='press_use' for all 7 (uniform government-hosted studio portraits) — no D-16 fallback tier needed, unlike Forest Grove's mixed 'sourced' licenses"
  - "WR-A fix applied: 1188's ORCHESTRATOR NOTE states the expected count as 7, matching the post-verify gate's literal `IF n <> 7` at authoring time (the live 1179 file left a stale 'currently 0' note against a `<> 7` gate — not repeated here)"
  - "WR-C fix applied: main() guards `if len(OFFICIALS) > 0:` before test_download_guard(OFFICIALS[0]) (the live _tmp-forest-grove-headshots.py has no such guard)"
  - "Keith Mays's official sherwoodoregon.gov portrait appears to be an older photo of him — accepted as-is since it is the portrait the city itself serves (no fresher alternative source in scope)"
metrics:
  duration: "~35 minutes (Task 1 + Task 2 authoring + Task 3 orchestrator run/verify)"
  completed: 2026-07-03
---

# Phase 181 Plan 03: Sherwood Headshot Pipeline + Audit Migration Summary

Authored the headshot pipeline script and the audit-only migration for the City of Sherwood's 7
officials, carrying forward the already-shipped WR-01 non-zero-exit fix and applying the two new
D-15 fixes (WR-C empty-roster guard in the script, WR-A note-text sync in the migration). This plan
ends at a blocking checkpoint — the orchestrator must run the script and apply the migration; the
executor has no DB/Storage access.

## What Was Built

**Task 1** authored `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py` (457 lines,
gitignored via the repo's `backend/scripts/_*` rule, confirmed via `git check-ignore`), copied
from the Forest Grove template structure with all city-specific strings renamed. Key content:

- `OFFICIALS` list with exactly 7 dicts (ext_ids -4167101..-4167107), each pointing at the
  Wave-0-confirmed `sherwoodoregon.gov/wp-content/uploads/2025/02/<name>-600.jpg` URL, all with
  `license='press_use'`. Dan Standke's entry correctly uses the `daniel-standke-600.jpg` filename
  (not `dan-standke`) per the 181-01/181-02 filename-nuance note.
- Hard assertions: unique ext_ids, `len(OFFICIALS) == 7` (RESEARCH confirmed 7/7 direct sourcing —
  no genuine gap tolerated, unlike Forest Grove's partial-outcome-tolerant assert), and a
  license-present check.
- Runtime UUID resolution by `external_id` via `psycopg2` — no hardcoded UUIDs.
- Pipeline order preserved: download -> white-composite-if-transparent guard -> `crop_to_4_5()`
  FIRST -> `resize_600x750()` Lanczos q90 SECOND -> upload to
  `politician_photos/{uuid}-headshot.jpg` via PUT with `x-upsert: true`. `crop_to_4_5()`'s
  center-horizontal (width-trim) branch is the one exercised by these square 600x600 sources
  (1.0 > 0.8 target ratio), documented inline in both the docstring and the function comment.
- `CDN_BASE` derived from `SUPABASE_URL` (never hardcoded project ref); `BUCKET='politician_photos'`,
  `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `RESAMPLE=Image.Resampling.LANCZOS`.
- WR-01 (already shipped): `main()` collects per-official results and calls `sys.exit(1)` if any
  official failed to upload.
- **D-15 WR-C fix applied:** `main()` now guards `if len(OFFICIALS) > 0:` before calling
  `test_download_guard(OFFICIALS[0])`, closing the IndexError risk present in the live
  `_tmp-forest-grove-headshots.py` (line 455, no length guard).
- Module docstring documents the best-in-milestone direct sourcing (no D-16 fallback chain), the
  square-source crop nuance, the WR-01 fix, and marks the file a gitignored orchestrator-run helper.

**Task 2** authored `C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql` (125 lines),
an audit-only migration (no `schema_migrations` ledger row) modeled on `1179_forest_grove_headshots.sql`:

- Header documents the AUDIT-ONLY status and the best-in-milestone direct-download sourcing note
  (no D-16 fallback needed, full 7/7 expected).
- Seven `politician_images` INSERT ... SELECT blocks, one per official, columns exactly
  `(id, politician_id, url, type, photo_license)` — no `photo_origin_url` (confirmed absent from
  schema). `politician_id` resolved via subselect on `external_id`. `type='default'`,
  `photo_license='press_use'` for all 7. Each guarded `WHERE NOT EXISTS` on `politician_id`
  (idempotent). The `url` value carries a literal `{uuid}` placeholder for the orchestrator to
  fill in per official from the script's manifest before applying.
- Keith Mays's block carries a comment reiterating the plain-title (former Mayor/Council
  President) treatment; Dan Standke's block notes the `daniel-standke` filename nuance without
  using the literal word restricted from comments.
- Post-verification `DO` block: url-embeds-uuid gate, `IF n <> 7 THEN RAISE EXCEPTION`.
- **D-15 WR-A fix applied:** the ORCHESTRATOR NOTE's stated expected count (7) is written to
  literally match the post-verify gate's `IF n <> 7` check at authoring time — no "currently 0"
  stale-default text left behind, unlike the live `1179_forest_grove_headshots.sql` (whose note
  still says "currently 0" against an applied `<> 7` gate).
- Hygiene confirmed via grep: no literal `photo_origin_url`, `schema_migrations`, or `slug`
  strings anywhere in the file's comments (the one near-miss — "filename slug" wording in the
  Standke comment — was reworded to avoid the restricted literal).

**Task 3** (orchestrator-run blocking checkpoint) executed 2026-07-03, ALL PASS:

- **Pipeline run:** `python _tmp-sherwood-headshots.py` exited 0 — 7/7 downloaded from
  sherwoodoregon.gov (source content-type was `image/webp` despite the `.jpg` extension — handled
  transparently by Pillow's format-sniffing, no code change needed). Each portrait width-cropped
  600×600→480×600 (4:5, centered on face per the square-source nuance), resized to 600×750 Lanczos
  q90, uploaded to `politician_photos/{uuid}-headshot.jpg` via PUT with `x-upsert:true`. WR-01's
  non-zero-exit gate was present and armed but never fired (0 failures). Manifest confirmed all 7
  entries `SUCCESS` with `license=press_use`, `source=primary`.
- **Visual identity + quality check:** all 7 portraits downloaded back from the CDN and visually
  verified against the city's own roster page — correct person per official (Rosener, Young,
  Brouse, Giles, Mays, Scott, Standke), faces centered after the width-crop, 600×750, no
  superimposed text/graphics. One note: Keith Mays's official portrait appears to be an older
  photo of him — since it is the portrait the city itself currently serves for his seat, it was
  accepted as the official image (no fresher city-hosted alternative in scope).
- **Migration 1188 applied:** orchestrator filled the 7 `{uuid}` URL placeholders from the pipeline
  manifest (one per ext_id block; the line-4 header-comment placeholder was intentionally left
  generic, not politician-specific), then applied via `psql -f`. Result: 7 INSERTs, the
  url-embeds-uuid `DO` post-verify gate passed (count=7), `COMMIT` clean — no rollback.
- **Post-apply DB verify:** `politician_images` rows confirmed for all 7 Sherwood officials,
  `type='default'`, `photo_license='press_use'`, `url_embeds_uuid=true` for every row.
- **EV-Accounts commit:** `9ce7f5a8` — migration file only (`1188_sherwood_headshots.sql`); the
  `_tmp-sherwood-headshots.py` helper stays gitignored and was never committed, per the plan's
  explicit design.

## Deviations from Plan

**1. [Rule 1 - Bug, non-blocking] Source images served as `image/webp` despite `.jpg` URLs.**
- **Found during:** Task 3 pipeline run.
- **Issue:** sherwoodoregon.gov's CDN returns `Content-Type: image/webp` for the `*-600.jpg` URLs
  confirmed at RESEARCH/Wave-0 time, rather than the expected `image/jpeg`.
- **Fix:** No code change was required — Pillow's `Image.open()` sniffs the actual container
  format from file bytes rather than trusting the URL extension or HTTP header, so the existing
  pipeline (composite-if-transparent guard, crop, resize, re-encode as JPEG on upload) handled it
  transparently. Verified all 7 output files are valid JPEGs at the CDN destination.
- **Files modified:** none (no code change; documented here for the milestone's headshot-pipeline
  pattern record).
- **Commit:** n/a (behavioral note only, folded into the Task 3 checkpoint approval).

No architectural changes, no re-plan required otherwise — Tasks 1-2 executed exactly as written,
and Task 3 completed with a full 7/7 outcome (the best-in-milestone sourcing prediction held).

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/scripts/_tmp-sherwood-headshots.py` (457 lines, confirmed present on disk, confirmed gitignored via `git check-ignore`)
- FOUND: `C:/EV-Accounts/backend/migrations/1188_sherwood_headshots.sql` (125 lines, applied to DB, committed to EV-Accounts at `9ce7f5a8`)
- FOUND: `.planning/phases/181-city-of-sherwood-deep-seed/181-03-SUMMARY.md` (this file)
- FOUND: EV-Accounts commit `9ce7f5a8` (migration-only, `.py` helper correctly excluded)
- CONFIRMED: `essentials.politician_images` — 7/7 Sherwood rows, `type='default'`, `photo_license='press_use'`, `url_embeds_uuid=true`
