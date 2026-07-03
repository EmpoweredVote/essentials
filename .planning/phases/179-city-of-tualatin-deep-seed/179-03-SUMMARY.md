---
phase: 179-city-of-tualatin-deep-seed
plan: 03
subsystem: database
tags: [postgres, supabase, python, pillow, oregon, tualatin, headshots]

# Dependency graph
requires:
  - phase: 179-city-of-tualatin-deep-seed
    plan: 02
    provides: 7 politician UUIDs by external_id (-4174951..-4174957), migration number 1170
provides:
  - "_tmp-tualatin-headshots.py pipeline script (gitignored, orchestrator-run) — downloads, crops 4:5, resizes 600x750 Lanczos q90, uploads all 7 portraits to Supabase Storage politician_photos bucket"
  - "1170_tualatin_headshots.sql audit-only migration with all 7 politician_images INSERTs (UUIDs pre-filled from mig 1169) and the WR-02 url-embeds-uuid post-verify gate"
  - "D-16 fallback chain explicitly documented as NOT NEEDED — all 7 sourced cleanly from tualatinoregon.gov, no WAF"
affects: [179-05-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hillsboro-style HARD assert len(OFFICIALS)==7 (not Tigard's soft partial-outcome tolerance) — used when RESEARCH confirms zero genuine sourcing gaps"
    - "Migration URLs pre-filled with already-known UUIDs (from prior structural migration) rather than pasted post-hoc from the pipeline manifest, since Plan 02 already minted and recorded all 7 UUIDs"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py
    - C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql
  modified: []

key-decisions:
  - "All 7 fallback_url entries set to None — D-16 pre-authorized local-news fallback chain is NOT needed for Tualatin (RESEARCH found zero genuine gaps; tualatinoregon.gov has no WAF)"
  - "HARD assert len(OFFICIALS)==7 in the script (Hillsboro-style), not Tigard's soft/partial-outcome pattern — appropriate given confirmed zero-gap sourcing"
  - "photo_license='press_use' for all 7 (official government-hosted portrait convention, consistent with the rest of the milestone)"
  - "Migration 1170 is audit-only — not registered in the schema_migrations ledger, per the project's audit-only headshot/stance migration convention"

patterns-established: []

requirements-completed: []

# Metrics
duration: ~10min
completed: 2026-07-02
---

# Phase 179 Plan 03: Tualatin Headshot Pipeline & Audit Migration Summary

**Authored the 7-official headshot pipeline script (_tmp-tualatin-headshots.py, HARD-asserts 7/7) and the audit-only politician_images migration (1170_tualatin_headshots.sql, WR-02 url-embeds-uuid gate) for the cleanest headshot sourcing situation in the v20.0 milestone — all 7 portraits confirmed directly retrievable from tualatinoregon.gov with no WAF and no fallback chain needed.**

## Performance

- **Duration:** ~10 min (Tasks 1-2 authored by executor; Task 3 script-run + migration-apply is an orchestrator-only checkpoint, not yet resolved)
- **Completed:** 2026-07-02 (authoring only — see Next Phase Readiness for pending orchestrator action)
- **Tasks:** 2 of 3 complete (1 auto + 1 auto; Task 3 is `checkpoint:human-verify` awaiting orchestrator execution — this executor has no DB/Storage access)
- **Files modified:** 2 (both in the C:/EV-Accounts repo — NOT committed there by this executor, per the two-repo split; the orchestrator commits the migration after applying it)

## Accomplishments
- Authored `_tmp-tualatin-headshots.py` — full download/crop/resize/upload pipeline modeled on the Tigard analog (474 lines), with all 7 `OFFICIALS` entries populated from the confirmed `tualatinoregon.gov/app/uploads/2025/09/` URLs, `fallback_url: None` for all 7 (D-16 documented as unused), and a HARD `assert len(OFFICIALS) == 7` (Hillsboro-style — appropriate since RESEARCH found zero genuine gaps, unlike Tigard's soft-tolerance pattern)
- UUIDs resolved at RUNTIME by `external_id` via psycopg2 inside the script (never hardcoded in the pipeline itself)
- Authored `1170_tualatin_headshots.sql` — 7 `politician_images` INSERT...SELECT statements (columns exactly `id, politician_id, url, type, photo_license`, no `photo_origin_url`), each guarded `WHERE NOT EXISTS` on `politician_id`, `type='default'`, `photo_license='press_use'`; URLs pre-filled with the 7 UUIDs already minted and recorded by migration 1169 (see 179-02-SUMMARY.md), so no post-hoc `{uuid}` substitution is needed before the orchestrator applies it
- Migration includes the WR-02 url-embeds-uuid post-verify `DO` block asserting exactly 7 rows (no "lower the count" caveat, since 7/7 is the expected and required outcome)
- Confirmed no `photo_origin_url`/`slug`/`schema_migrations` literal strings appear anywhere in the migration comments (audit-only convention preserved)

## Task Commits

1. **Task 1: Author the headshot pipeline script** — not committed (file lives in the C:/EV-Accounts repo, which this executor's worktree does not commit to; orchestrator convention treats `_tmp-*.py` as a gitignored helper, never committed)
2. **Task 2: Author the audit-only headshot migration** — not committed (file lives in the C:/EV-Accounts repo; the orchestrator commits it there, per the two-repo split, only after applying it live — see Task 3)
3. **Task 3: Orchestrator runs pipeline, applies migration, verifies identity + quality** — `checkpoint:human-verify` (gate="blocking") — **NOT YET RESOLVED**. This executor has no DATABASE_URL/Supabase Storage credentials and cannot run the script or apply the migration. See the CHECKPOINT REACHED block returned alongside this summary for the exact commands the orchestrator must run.

**Plan metadata:** this SUMMARY.md commit (essentials worktree) — `docs(179-03): author headshot pipeline + audit migration, pending orchestrator checkpoint`

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py` — gitignored pipeline helper; downloads all 7 portraits from tualatinoregon.gov, composites RGBA-to-white if needed, crops 4:5 FIRST then resizes to 600×750 Lanczos q90, uploads to `politician_photos/{uuid}-headshot.jpg`, prints a manifest. HARD-asserts `len(OFFICIALS)==7`.
- `C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql` — audit-only migration (not registered in the ledger); 7 `politician_images` INSERTs with URLs pre-filled using the UUIDs from migration 1169; WR-02 post-verify gate expects exactly 7 url-embeds-uuid matches.
- `.planning/phases/179-city-of-tualatin-deep-seed/179-03-SUMMARY.md` — this file (essentials worktree).

## Decisions Made
- Pre-filled the migration's `{uuid}` segments directly from the already-known Plan 02 UUID table (rather than leaving placeholder text for post-pipeline substitution, as Tigard's migration did) — since all 7 UUIDs were already minted and recorded before this plan ran, there is no uncertainty to defer; this also means the orchestrator does not need to hand-edit the migration file before applying it, only confirm the pipeline's manifest matches these UUIDs.
- Kept the migration's post-verify assertion at a hard `<> 7` check with no gap-tolerance caveat in the comment, reflecting RESEARCH's explicit zero-gap finding for Tualatin.

## Deviations from Plan

None — plan executed exactly as written. Both authoring tasks followed the Tigard/Hillsboro analogs and the 179-PATTERNS.md pattern assignments precisely.

## Issues Encountered

None during authoring. Task 3 (script run + migration apply) is intentionally deferred to the orchestrator per the `<orchestrator_split>` instructions — this executor has no database or Supabase Storage credentials.

## User Setup Required

None — Task 3 requires only orchestrator action (already has the necessary environment credentials), not new user-facing setup.

## Next Phase Readiness

**BLOCKING for Plan 05 (surfacing/verification):** Task 3 must be resolved before Plan 05's headshot-render checks can pass. The orchestrator must:

1. Run `python C:/EV-Accounts/backend/scripts/_tmp-tualatin-headshots.py` and confirm all 7 images download from tualatinoregon.gov and upload successfully (expect 7/7; if any 404s, STOP and re-search that one URL — do not fabricate).
2. Apply `psql "$DATABASE_URL" -f C:/EV-Accounts/backend/migrations/1170_tualatin_headshots.sql` and confirm the WR-02 `DO` block passes (politician_images row count = 7).
3. Visually confirm each of the 7 portraits is the correct person, 600×750, 4:5 framing, no superimposed text/graphics.
4. Commit the migration in the EV-Accounts repo: `git -C "C:/EV-Accounts" add backend/migrations/1170_tualatin_headshots.sql && git -C "C:/EV-Accounts" commit`. Do NOT commit the `_tmp-*.py` helper.

Once Task 3 is resolved, Plan 04 (stances, migrations 1171-1177) and Plan 05 (surfacing) can proceed — Plan 04 does not structurally depend on headshots, but Plan 05's full-coverage verification does.

---
*Phase: 179-city-of-tualatin-deep-seed*
*Completed: 2026-07-02 (authoring only; Task 3 checkpoint pending orchestrator execution)*
