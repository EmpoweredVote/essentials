---
phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j
plan: 03
subsystem: database
tags: [postgres, supabase, school-boards, oregon, headshots, storage, image-pipeline]

# Dependency graph
requires:
  - phase: 183-02
    provides: "Migration 1203 (structural, registered) — 14 director politician/office rows and the locked external_id -> politician UUID map for both boards"
provides:
  - "Headshot ETL pipeline _tmp-westmetro-school-wave1-headshots.py (gitignored, not committed) — 14/14 uploads to Supabase Storage politician_photos/{uuid}-headshot.jpg, all HTTP 200 on spot-check"
  - "Migration 1205 (AUDIT-ONLY, not registered): 14 essentials.politician_images INSERT blocks, one per director, idempotent via WHERE NOT EXISTS, with a url-embeds-uuid post-verify gate"
  - "14/14 headshot-count gate confirmed; 0 compass stance rows re-confirmed (0-by-design success state)"
affects: [183-04, 184-school-boards-wave-2]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "On-disk-MAX-authoritative migration numbering (same convention that renumbered 183-02's structural migration): 1204 was claimed on-disk by a concurrent AZ workstream (1204_az_ballot_ineligible_reconciliation.sql, untracked in git) before this file was authored, so the headshot migration is numbered 1205 instead of the plan's literal 1204"
    - "Hillsboro-genuine-original-over-CDN-upscale rule: Lanczos-upscale from the district's own untransformed original image rather than the finalsite CDN's interpolated t_image_size_6 rendition, to avoid amplifying fabricated detail (D-R5)"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py (608 lines, gitignored _tmp-* helper, separate repo, NOT committed)"
    - "C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql (253 lines, separate repo)"
  modified: []

key-decisions:
  - "Migration renumbered 1204 -> 1205 at execution time because 1204 was already claimed on-disk by a concurrent AZ ballot-ineligible-reconciliation workstream (untracked in git); the on-disk-MAX-authoritative convention (established in 183-01/183-02) takes precedence over the plan's literal filename guess. Next migration after this one: 1206."
  - "Hillsboro's 7 headshots are honest partial-quality upscales of genuine small originals (256x320 / 320x400 / 172x215, all already exactly 4:5) rather than fabricated or CDN-interpolated detail — documented per-member in the migration header and manifest, not shipped silently as full-resolution."

patterns-established:
  - "Reused the cornelius-headshots.py structural shape (WR-01 non-zero exit on any failure, WR-02 test-download-guard byte reuse, WR-C len(OFFICIALS)>0 guard, SUPABASE_URL-derived CDN base, crop-4:5-first then 600x750 Lanczos q90, RGBA/circle-cutout white-composite branch) for a 14-official school-board roster — reusable for phase 184's Wave-2 boards"

requirements-completed: [WSCH-01, WSCH-02]

# Metrics
duration: 15min
completed: 2026-07-04
---

# Phase 183 Plan 03: Headshot Pipeline + Audit-Only Migration 1205 Summary

**All 14 director headshots (7 Beaverton SD 48J genuine high-res + 7 Hillsboro SD 1J genuine-original Lanczos-upscaled) uploaded to Supabase Storage and recorded via audit-only migration 1205, applied clean with 14/14 headshot-count gate and 0-stance baseline reconfirmed**

## Performance

- **Duration:** 15 min (this continuation segment; full plan including Tasks 1-2 authoring ~40 min)
- **Started:** 2026-07-04T16:40:00Z
- **Completed:** 2026-07-04T16:55:00Z
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify, resolved "approved")
- **Files modified:** 2 (1 gitignored script, 1 committed migration)

## Accomplishments
- Authored the 14-official headshot ETL pipeline `_tmp-westmetro-school-wave1-headshots.py`, adapted from the cornelius-headshots.py analog with WR-01/WR-02/WR-C fixes carried verbatim, runtime UUID resolution by external_id, and a SUPABASE_URL-derived CDN base
- Authored audit-only migration 1205 (renumbered from the plan's literal 1204 due to an on-disk collision with a concurrent AZ workstream) with 14 idempotent `politician_images` INSERT blocks and a url-embeds-uuid post-verify gate
- Orchestrator ran the pipeline via `py`: **14/14 uploaded, 0 failed** — all license=press_use, source=primary (official district finalsite CDN, no WAF, no fallback chain needed)
- Orchestrator applied 1205 clean: 14 INSERTs, post-verify DO block passed, COMMIT, confirmed audit-only (0 ledger rows for version '1205')
- Headshot-count gate: 14 politician_images rows across both ext_id ranges (7 Beaverton + 7 Hillsboro)
- 0-stance gate re-confirmed: 0 rows in inform.politician_answers across both ranges (success state); no student-rep/secretary rows exist (structurally never seeded)
- 3/3 CDN spot-checks returned HTTP 200 (Truong 57562B, Rhyne 49906B, Pantoja 68157B)

## Task Commits

Each task was committed atomically:

1. **Task 1: Author headshot ETL pipeline script** - N/A (gitignored `_tmp-*` helper, never committed per plan design) — `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` (608 lines)
2. **Task 2: Author audit-only headshot migration** - `9b92a57b` (feat, repo `C:/EV-Accounts`, branch `master`) — `backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` (253 lines, renumbered from 1204 to 1205)
3. **Task 3: Orchestrator runs pipeline + applies 1205 + confirms gates** - checkpoint:human-verify, resolved "approved" with full recorded manifest, apply, and gate results (no code commit; DB/Storage write happened via `py` + `psql`, not via a git-tracked change in this repo)

**Plan metadata:** (this commit) `docs(183-03): complete headshot pipeline + migration 1205 plan`

## Pipeline Run Results (recorded from orchestrator verification, 2026-07-04)

### A. Manifest — 14/14 SUCCESS

`py C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` exited 0. All 14 UUIDs match the 183-02-SUMMARY.md external_id -> UUID map exactly. All 14 uploaded to Storage `politician_photos/{uuid}-headshot.jpg` on the `kxsdzaojfaibhuzmclfq` public bucket. All license=press_use, source=primary (official district sites, resources.finalsite.net — the districts' own CDN, no WAF, no fallback chain needed).

**Beaverton SD 48J (7/7, genuine high-resolution native originals, direct crop-4:5 no-op -> resize, no upscale):**

| Ext ID | Director | Seat | Source Note |
|--------|----------|------|--------------|
| -4101921 | Van Truong | Zone 1 | genuine high-res |
| -4101922 | Karen Pérez | Zone 2 | genuine high-res |
| -4101923 | Melissa Potter | Zone 3 (Vice Chair) | genuine high-res |
| -4101924 | Sunita Garg | Zone 4 | genuine high-res |
| -4101925 | Syed Qasim | Zone 5 | genuine high-res |
| -4101926 | Justice Rajee | Zone 6 (Chair) | genuine high-res |
| -4101927 | Tammy Carpenter | Zone 7 | genuine high-res |

**Hillsboro SD 1J (7/7, genuine small originals Lanczos-upscaled to 600x750 — never the CDN's interpolated `t_image_size_6` rendition):**

| Ext ID | Director | Seat | Native Resolution (genuine original) |
|--------|----------|------|----------------------------------------|
| -4100024 | Yessica Hardin Mercado | Position 1 | 256×320 |
| -4100025 | Mark Watson | Position 2 | 256×320 |
| -4100026 | Nancy Thomas | Position 3 | 256×320 |
| -4100027 | See Eun Kim | Position 4 (Vice Chair) | 320×400 |
| -4100028 | Ivette Pantoja | Position 5 (Chair) | 320×400 |
| -4100029 | Katie Rhyne | Position 6 | 172×215 (softest of the 14) |
| -4100030 | Patrick Maguire | Position 7 | 320×400 |

All 7 Hillsboro originals were already exactly 4:5 — no crop distortion needed, only Lanczos upscale. Documented per D-R5: honest partial-quality upscale of a real source, not a fabrication.

### B. Reconciliation against 1205

No reconciliation edits needed to 1205 — zero pipeline failures, so all 14 INSERT blocks were retained as authored. Each block's UUID matches both the manifest and the 183-02-SUMMARY.md map.

### C. Apply

`psql "$DATABASE_URL" -f C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` ran clean: 14 INSERTs, post-verify DO block (url-embeds-uuid gate) passed with no exception, COMMIT.

Audit-only confirmed: `SELECT COUNT(*) FROM supabase_migrations.schema_migrations WHERE version='1205'` -> 0.

### D. Headshot-count gate

14 `politician_images` rows across both ext_id ranges (7 Beaverton + 7 Hillsboro) — matches the 14/14 SUCCESS count exactly.

### E. 0-stance-by-design re-confirmation

0 rows in `inform.politician_answers` across both ext_id ranges (success state, unchanged from 183-02). No student-rep or secretary image row exists — structurally impossible, since no such politician/office rows were ever seeded for either board.

### F. CDN spot-checks

3/3 HTTP 200: Truong (57562B), Rhyne (49906B), Pantoja (68157B).

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py` - Gitignored ETL helper: downloads 14 finalsite headshots, crops 4:5-first, resizes to 600x750 Lanczos q90, white-composites any RGBA source, uploads to Storage with x-upsert, resolves politician UUID at runtime by external_id, prints SUCCESS/FAILED manifest, exits non-zero on any failure (WR-01)
- `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` - Audit-only migration: 14 idempotent `politician_images` INSERTs (one per director) + url-embeds-uuid post-verify DO block; no ledger row written

## Decisions Made
- Migration renumbered 1204 -> 1205 at execution time: 1204 was already claimed on-disk by a concurrent AZ ballot-ineligible-reconciliation workstream (`1204_az_ballot_ineligible_reconciliation.sql`, untracked in git but present on disk before this file was authored). Applied the on-disk-MAX-authoritative convention established in 183-01/183-02 rather than the plan's literal "1204" filename guess. Next migration after this one: 1206.
- Hillsboro's 7 director headshots use Lanczos upscale from each director's genuine small original (never the finalsite CDN's interpolated `t_image_size_6` rendition) — an honest partial-quality result documented per-member in both the migration header and the manifest, consistent with D-R5 (no fabrication).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/Convention] Migration renumbered 1204 -> 1205 due to on-disk collision**
- **Found during:** Task 2 (authoring migration 1204/1205)
- **Issue:** The plan specified filename `1204_or_westmetro_school_boards_wave1_headshots.sql`. At execution time, `1204` was already claimed on-disk by a concurrent AZ workstream (`1204_az_ballot_ineligible_reconciliation.sql`), untracked in git but present in the migrations directory before this file was authored.
- **Fix:** Authored the file as `1205_or_westmetro_school_boards_wave1_headshots.sql` instead, following the on-disk-MAX-authoritative numbering convention already established in this phase (183-01 renumbered its structural migration guess to 1203 for the same reason — see 183-01-SUMMARY.md). Documented the renumbering explicitly in the migration's header comment.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql` (filename itself; no content impact — all column/UUID/gate content matches the plan's specification exactly)
- **Verification:** Applied cleanly under the new filename; post-verify DO block passed; audit-only confirmed (0 ledger rows for '1205').
- **Committed in:** `9b92a57b` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking/convention numbering collision)
**Impact on plan:** Pure filename/numbering adjustment required by a concurrent unrelated workstream claiming the plan's literal guess. No scope creep — every acceptance criterion from the plan (AUDIT-ONLY header, no ledger row, 14 INSERT blocks with the exact column list, WHERE NOT EXISTS guards, no `photo_origin_url`/`slug` literals, UTF-8) is satisfied under the corrected filename.

## Issues Encountered

None. The pipeline uploaded all 14 headshots on the first run (0 failed), and migration 1205 applied cleanly on the first attempt — no rollback, no exception, all gates (headshot-count, 0-stance, CDN spot-check, post-verify DO block) passed without remediation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 04 may proceed using:
- All 14 director headshots live in Supabase Storage (`politician_photos/{uuid}-headshot.jpg`, HTTP 200 confirmed) and recorded in `essentials.politician_images` via migration 1205
- 0 compass stance rows confirmed for all 14 directors (success state — 0-by-design, no stances expected for this milestone unit)
- Next migration number: **1206** (1204 consumed by a concurrent AZ workstream; 1205 consumed by this plan)

No blockers.

---
*Phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j*
*Completed: 2026-07-04*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/scripts/_tmp-westmetro-school-wave1-headshots.py`
- FOUND: `C:/EV-Accounts/backend/migrations/1205_or_westmetro_school_boards_wave1_headshots.sql`
- FOUND: commit `9b92a57b` in `C:/EV-Accounts` (branch master)
