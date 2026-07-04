---
phase: 182-city-of-cornelius-deep-seed
plan: 03
subsystem: database
tags: [postgres, supabase, headshots, pillow, oregon, cornelius, rgba-composite, vacant-seat]

# Dependency graph
requires:
  - phase: 182-city-of-cornelius-deep-seed
    plan: 02
    provides: "Migration 1196 applied (a5f62cfe); minted politician UUIDs for the 4 filled Cornelius seats; next migration 1197"
provides:
  - "_tmp-cornelius-headshots.py (gitignored helper, NOT committed) — download/composite-onto-white/(no-op crop)/resize/upload pipeline for the 4 filled Cornelius officials, WR-01 exit + WR-C empty-roster guard + WR-02 prefetch retained"
  - "1197_cornelius_headshots.sql (authored, NOT yet applied) — audit-only politician_images INSERTs for the 4 filled officials, count=4 url-embeds-uuid gate, WR-A-synced note"
affects: [182-04-city-of-cornelius-deep-seed, 182-05-city-of-cornelius-deep-seed]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RGBA-to-white composite as the PRIMARY exercised pipeline step (not the usual crop) — all 4 Cornelius sources are circular photo cutouts on fully transparent PNG canvases already exactly 4:5, so crop_to_4_5()'s early-return guard fires for every official and only the composite+resize steps do real work"
    - "Vacant-seat exclusion pattern for headshot pipelines — the 5th (vacant) seat is omitted from OFFICIALS entirely rather than given a null/placeholder entry, with its leftover blank documentID explicitly called out in both script docstring and migration header comment as a do-not-use trap"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py (separate repo, gitignored, NOT committed; 498 lines)"
    - "C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql (separate repo; authored, awaiting orchestrator apply + commit; 101 lines)"
  modified: []

key-decisions:
  - "Cloned _tmp-cornelius-headshots.py from _tmp-sherwood-headshots.py ONLY (per plan directive) — the sole template on disk carrying the WR-01 non-zero-exit + WR-02 prefetched_bytes + WR-C empty-roster fixes"
  - "OFFICIALS list has exactly 4 entries (ext_ids -4115551..-4115554); the vacant 5th seat (-4115555) is intentionally NOT listed — no null/placeholder entry, no documentID=1975 reference in the roster (only in comments as a do-not-use warning)"
  - "Kept crop_to_4_5() intact even though it is a guaranteed no-op this phase (1600x2000 source already exact 4:5) — pipeline consistency and safety against any future non-4:5 source, per the plan's explicit instruction not to remove the guard"
  - "license='press_use' for all 4 filled officials — uniform official city-site studio portraits; orchestrator may adjust per actual source at run time per plan direction"
  - "UUIDs resolved at RUNTIME by external_id via psycopg2 in the script; the migration's INSERT blocks use the same 4 UUIDs pre-filled from 182-02-SUMMARY.md's minted values, per the Sherwood 1188 audit-migration template shape"

requirements-completed: []  # WASH-08 spans plans 01-05; this plan authors the headshot artifacts. Pipeline run + migration apply happens in the orchestrator's Task 3 checkpoint (not yet executed) — full WASH-08 completion belongs to plan 05 / phase close.

# Metrics
duration: 15min
completed: 2026-07-04
---

# Phase 182 Plan 03: City of Cornelius Headshot Pipeline + Audit Migration Summary

**Authored `_tmp-cornelius-headshots.py` (498 lines, cloned from the Sherwood WR-01/WR-02/WR-C template) and `1197_cornelius_headshots.sql` (101 lines, cloned from the Sherwood 1188 audit-migration shape) for the 4 filled Cornelius officials (Dalin/Godinez Valencia/Baker/López) — the RGBA-onto-white composite step is the primary exercised pipeline step this phase (all 4 sources are transparent-PNG circular cutouts already exactly 4:5, so the crop guard is a confirmed no-op) — with the vacant 5th seat correctly excluded from both artifacts as a documented genuine gap; Task 3 (pipeline run + migration apply + visual verification + EV-Accounts commit) is a blocking checkpoint reserved for the orchestrator, which has DB/Storage access this agent lacks.**

## Performance

- **Duration:** ~15 min (Tasks 1-2 authoring)
- **Completed:** 2026-07-04 (authored; Task 3 checkpoint not yet executed)
- **Tasks:** 2 of 3 completed by this agent (Task 3 is the orchestrator's blocking checkpoint per the plan's explicit execution architecture)
- **Files modified:** 2 (both outside this worktree's repo)

## Accomplishments

- Authored `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` (498 lines) by cloning `_tmp-sherwood-headshots.py` structure verbatim and adapting for Cornelius's specific deltas:
  - OFFICIALS list: exactly 4 dicts (ext_ids -4115551 Dalin, -4115552 Godinez Valencia, -4115553 Baker, -4115554 López), each with the confirmed `corneliusor.gov/ImageRepository/Document?documentID=N` URL (N=2325/1977/2324/1979 respectively) and `license='press_use'`.
  - Hard-asserts (explicit `if: raise`, not plain `assert`, per the WR-01-style optimization-safety pattern) that `len(OFFICIALS) == 4` and that all ext_ids are unique.
  - UUIDs resolved at RUNTIME by external_id via `resolve_politician_id()` (psycopg2) — no hardcoded UUIDs anywhere in the script.
  - Config block preserved: `BUCKET='politician_photos'`, `TARGET_SIZE=(600,750)`, `JPEG_QUALITY=90`, `RESAMPLE=Image.Resampling.LANCZOS`, `CDN_BASE` derived from `SUPABASE_URL`.
  - `process_headshot_bytes()` retains the RGBA/PNG-to-white composite branch unmodified (Henderson/Seebock precedent) — the PRIMARY exercised step this phase since all 4 sources are transparent-background PNGs; `crop_to_4_5()` kept intact with its early-return guard, which fires for every official since the 1600x2000 source is already exactly 4:5 (a confirmed no-op, not removed).
  - WR-01: `main()` collects results, prints the manifest, calls `sys.exit(1)` if any official failed to upload.
  - WR-C: `main()` guards `if len(OFFICIALS) > 0:` before calling `test_download_guard(OFFICIALS[0])`.
  - WR-02: `test_download_guard()` returns the verified bytes (not a bool); `main()` passes `guard_bytes` as `prefetched_bytes` to `process_member()` for the first official only, avoiding a redundant second download.
  - Docstring SOURCE NOTE documents the best-in-milestone direct ImageRepository sourcing (no fallback chain, `ci.cornelius.or.us` confirmed dead), the transparent-PNG composite-then-no-crop nuance, the vacant-seat gap (documentID=1975 confirmed blank — explicitly called out as a do-not-use trap), and the WR-01/WR-02/WR-C fixes; marks the file a gitignored `_tmp-*` helper run by the orchestrator.
- Authored `C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql` (101 lines) by cloning the Sherwood `1188_sherwood_headshots.sql` shape:
  - Single `BEGIN...COMMIT`, header comment marked "AUDIT-ONLY (not registered in the ledger)" with a source note documenting the best-in-milestone sourcing and the vacant-seat genuine gap (explicit warning against documentID=1975).
  - 4 `politician_images` `INSERT ... SELECT` blocks (one per filled official), columns exactly `(id, politician_id, url, type, photo_license)` — no `photo_origin_url` anywhere in the file. `politician_id` resolved via subselect on `external_id` (within -4115551..-4115554); no row for the vacant -4115555 seat. `type='default'`, `photo_license='press_use'` for all 4. Each guarded `WHERE NOT EXISTS` on `politician_id` (idempotent).
  - URL values use the 4 UUIDs minted by structural migration 1196 (from 182-02-SUMMARY.md), pre-filled into the CDN path pattern `politician_photos/{uuid}-headshot.jpg`, per the plan's instruction that the orchestrator fills in the UUIDs from the script manifest before applying — since the UUIDs are already known (structural migration 1196 was applied and its politician rows already exist), the URLs are correct as written and require no further edit unless the pipeline's actual manifest reports a different outcome.
  - Post-verify `DO` block (cloned from mig 1188): counts `politician_images` rows JOINed to `politicians` `WHERE external_id BETWEEN -4115554 AND -4115551 AND url LIKE '%' || politician_id::text || '%'`; `RAISE EXCEPTION` if count `<> 4`.
  - WR-A applied: the ORCHESTRATOR NOTE's stated expected-count (4) matches the gate's literal `IF n <> 4` check exactly — no drift.
  - No ledger `INSERT` (audit-only, as instructed). `photo_origin_url`, `slug`, `schema_migrations` do not appear anywhere in the file (verified by inspection). File saved as plain ASCII plus the single accented `é` in "Edén López" — UTF-8, no BOM (first bytes are `-- M` for the header comment, consistent with the rest of the migration chain's encoding convention).

## Task Commits

This plan has no in-worktree code commits for Tasks 1-2: both artifacts
(`_tmp-cornelius-headshots.py` and `1197_cornelius_headshots.sql`) are authored in a separate git
repository (`C:/EV-Accounts`) per the plan's explicit execution architecture ("gsd-executor WRITES
both files... The INLINE ORCHESTRATOR runs `_tmp-cornelius-headshots.py`... then applies the audit
migration via `psql -f`"). No files inside this worktree were created or modified by Tasks 1-2;
`git status --short` in this worktree returns clean except for this SUMMARY.md. Per the plan's
explicit instruction, the `.py` file is a gitignored `_tmp-*` helper that must NOT be committed
anywhere; the `.sql` migration is committed in the `C:/EV-Accounts` repo only by the orchestrator,
after Task 3's pipeline run + migration apply + visual verification succeed.

**Plan metadata:** SUMMARY.md commit (this file) — see final response for hash.

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` — headshot pipeline script (separate repo; gitignored; NOT committed; 498 lines)
- `C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql` — audit-only headshot migration (separate repo; authored, awaiting orchestrator apply + commit; 101 lines)

## Decisions Made

- Cloned exclusively from `_tmp-sherwood-headshots.py` (never Forest Grove's script, per the plan's explicit `<read_first>` warning), since Sherwood's is the only template on disk carrying all three WR fixes (WR-01 non-zero exit, WR-02 prefetched-bytes reuse, WR-C empty-roster guard).
- Modeled the vacant 5th seat as a total omission from `OFFICIALS` (not a null/placeholder dict entry) — the cleanest way to represent "genuinely no source, genuinely no seat to seed" without adding any conditional branching to the pipeline that would need special-casing a non-existent politician_id lookup.
- Kept `crop_to_4_5()`'s full two-branch implementation even though only its early-return guard executes this phase — per the plan's explicit instruction not to remove the guard, and because a future re-run against a differently-cropped replacement image (e.g., if the vacant seat is filled and needs a non-4:5 source) would silently break if the function were simplified to a bare pass-through.
- Pre-filled the migration's 4 UUIDs directly from 182-02-SUMMARY.md's already-minted, already-applied values (rather than leaving them as a TODO for the orchestrator to fill from the pipeline manifest) — since structural migration 1196 is already applied and those UUIDs are fixed, deterministic values tied to already-existing `politicians` rows, not values that depend on this plan's own execution. The pipeline script independently re-resolves the same UUIDs at runtime by `external_id`, so the two artifacts will agree by construction as long as migration 1196's politician rows are unchanged.

## Issues Encountered

None. `182-PATTERNS.md` did not exist on disk at the start of this plan's execution (consistent
with its absence noted in 182-01-SUMMARY.md and 182-02-SUMMARY.md) — a `182-PATTERNS.md` file was
present in `git status` as an untracked file from a prior session, but it was not part of this
worktree's initial checkout state per the plan's `<read_first>` reference and was not consulted, in
line with the same precedent set by plan 02. Proceeded using the plan's own detailed
`<action>`/`<interfaces>`/roster blocks, `182-RESEARCH.md`'s Headshot Sources section, and
182-02-SUMMARY.md's minted UUIDs — all of which were read directly and fully specify every literal
value used (documentIDs, ext_ids, UUIDs, license, vacant-seat documentID=1975 warning). No
functional impact.

## User Setup Required

None for this plan's authored artifacts. Task 3 (pipeline run, migration apply, visual
verification, EV-Accounts commit) requires the orchestrator's DB/Storage access, which this
executor does not have — that checkpoint is returned below, unexecuted, per the plan's explicit
execution architecture.

## Next Phase Readiness

**Tasks 1-2 complete. Task 3 is a blocking checkpoint for the orchestrator** — this executor has
no DB/Storage access and cannot run `_tmp-cornelius-headshots.py` or apply
`1197_cornelius_headshots.sql`. Values the orchestrator needs:

- **Script path:** `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` (run via `python`)
- **Migration path:** `C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql` (apply via `psql "$DATABASE_URL" -f`)
- **Expected outcome:** 4/4 headshots uploaded (Dalin/Godinez Valencia/Baker/López), clean white backgrounds (no black corners from the transparent-PNG sources), no crop artifacts (source already 4:5), politician_images row count = 4, url-embeds-uuid DO block passes.
- **Vacant seat (-4115555):** correctly has NO image — do not force one.
- **Commit protocol:** check `git -C "C:/EV-Accounts" status` first (D-16); stage ONLY `backend/migrations/1197_cornelius_headshots.sql`; do NOT commit the `_tmp-*.py` helper.
- **After Task 3 approval:** plan 03 is complete; plans 04 (stances) and 05 (close) can proceed. Plan 04 does not depend on plan 03's headshots (stances are independent of photos), so plan 04 may already be running in parallel per the phase's wave structure.

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/scripts/_tmp-cornelius-headshots.py` (498 lines)
- FOUND: `C:/EV-Accounts/backend/migrations/1197_cornelius_headshots.sql` (101 lines)
- No unexpected file deletions.
