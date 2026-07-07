---
phase: 180-city-of-forest-grove-deep-seed
plan: 03
subsystem: database
tags: [python, pillow, psycopg2, supabase-storage, headshots, forest-grove, oregon, washco]

# Dependency graph
requires:
  - phase: 180-city-of-forest-grove-deep-seed (plan 01)
    provides: "Wave-0 finding: city site has NO photos even via JS fetch (perpetual ajax-loader) — D-16 fallback chain REQUIRED for all 7; directory EIDs 58-64 mapped"
  - phase: 180-city-of-forest-grove-deep-seed (plan 02)
    provides: "Minted politician UUIDs by external_id (-4126201..-4126207) used in Storage paths and migration 1179"
provides:
  - "7/7 Forest Grove officials with 600x750 headshots live in Supabase Storage politician_photos/{uuid}-headshot.jpg (HTTP 200 CDN-verified)"
  - "Migration 1179 applied to production (audit-only, NOT in the ledger): 7 politician_images rows, type='default', photo_license='sourced', url-embeds-uuid gate passed at 7"
  - "D-14 WR-01 fix shipped: _tmp-forest-grove-headshots.py main() exits non-zero on ANY upload failure — first headshot pipeline in the milestone without the silent-partial-success defect; phases 181-182 inherit this"
  - "D-16 chain outcome documented: Ballotpedia 0/7 (no individual profiles), Wikimedia 0/7, local-news/campaign tier 7/7"
affects: [180-04, 180-05, 181, 182]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WR-01: headshot pipeline main() collects per-official results and calls sys.exit(1) if ANY configured official failed to upload — chained automation cannot apply the audit migration on a silently-partial run (fixes the latent defect in every prior _tmp-*-headshots.py)"
    - "Fail-closed template pattern: executor (no WebSearch/DB) ships both files with placeholder sources + a DO-gate default of 0, so an unedited run/apply refuses to proceed; orchestrator fills sources/licenses/count at the checkpoint"
    - "Actual-count url-embeds-uuid gate: audit headshot migration asserts the ACTUAL sourced count (honest-partial framing, per Tigard) instead of a hard 7 (Tualatin's no-caveat version)"

key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py (505 lines, separate repo, gitignored _tmp helper — intentionally NOT committed)"
    - "C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql (separate repo, committed there as 95925382)"
  modified: []

key-decisions:
  - "photo_license='sourced' for all 7 (press/campaign courtesy photos, NOT government-hosted — press_use would violate D-09; 'sourced' is the established value with 461 prior rows)"
  - "Migration 1179 authored as a fail-closed pre-filled template: 7 blocks with known 180-02 UUIDs + DO-gate default 0, so applying unedited RAISEs and rolls back"
  - "Officials with no usable photo were to be REMOVED from OFFICIALS (not left as placeholders) so the WR-01 gate only fires on genuine failures — ultimately moot at 7/7"

patterns-established:
  - "WR-01: non-zero exit on partial headshot upload failure — template for phases 181-182"

requirements-completed: [WASH-06]

# Metrics
duration: ~35min (including quota-interrupt resume + checkpoint round-trip)
completed: 2026-07-03
---

# Phase 180 Plan 03: Forest Grove Headshots Summary

**7/7 Forest Grove officials sourced through the D-16 local-news/campaign tier (city site confirmed photo-less at Wave-0), processed crop-first to 600×750 and uploaded to Storage by the milestone's first WR-01-fixed pipeline; audit migration 1179 applied clean with the url-embeds-uuid gate at 7.**

## Performance

- **Duration:** ~35 min (including a provider-quota interrupt/resume and the orchestrator checkpoint round-trip)
- **Started:** 2026-07-03 (wave 3)
- **Completed:** 2026-07-03
- **Tasks:** 3 (2 auto + 1 blocking checkpoint, all complete)
- **Files modified:** 2 (both in the separate EV-Accounts repo; nothing in this repo besides this SUMMARY)

## Accomplishments

- Authored `_tmp-forest-grove-headshots.py` (505 lines) from the Tualatin template with the **D-14 WR-01 fix**: main() tallies per-official results and calls `sys.exit(1)` when ANY configured official fails to upload — the inherited script only printed a WARNING and returned 0 on partial success. First pipeline in the milestone to carry this; 181-182 inherit it.
- Authored audit-only migration `1179_forest_grove_headshots.sql` (140 lines): 7 politician_images INSERTs with columns exactly `(id, politician_id, url, type, photo_license)`, politician_id via external_id subselect, `WHERE NOT EXISTS` guards, and the url-embeds-uuid post-verify gate asserting the ACTUAL sourced count (honest-partial framing) — no ledger write.
- Orchestrator ran the D-16 chain and the pipeline (2026-07-03): **7/7 uploaded, 0 failed, exit 0**; all CDN URLs HTTP 200. Migration applied clean (7× `INSERT 0 1`, DO gate passed at 7); committed in EV-Accounts as `95925382`.
- Honest-gap discipline held end-to-end: no fabrication, every identity visually verified before upload (including the two flagged wrong-person risks: no Truax on the Schimmel seat, no Milwaukie-era image for Falconer).

## Per-Official Sources (D-16 chain — city site = NONE for all 7, per Wave-0)

| external_id | Official | Source (D-16 tier: local news / campaign) | Source dims | License |
|-------------|----------|-------------------------------------------|-------------|---------|
| -4126201 | Malynda Wenzl (Mayor) | News-Times file photo via NewsBreak syndication ("Wenzl to run for mayor"; NAMS-classroom setting matches her teaching bio) | 461×600 | sourced |
| -4126202 | Michael Marshall | Candidate courtesy photo, News-Times Sept-2022 council-race roundup via NewsBreak | 379×600 | sourced |
| -4126203 | Karen Martinez | Candidate courtesy photo, same 2022 roundup (narrowest source; see re-crop deviation) | 291×600 | sourced |
| -4126204 | Mariana Valenzuela | Candidate courtesy photo, same 2022 roundup | 533×600 | sourced |
| -4126205 | Donna Gustafson | Campaign courtesy photo, her own Sept-2024 News-Times reelection announcement (WordPress-served original) | 1279×1400 | sourced |
| -4126206 | Angel Falconer | Her own campaign-site portrait (angelfalconer.com, served as WebP; identity cross-verified vs the WashCo Dems Forest Grove endorsement graphic — NOT a Milwaukie-era wrong-person image) | 2500×1667 | sourced |
| -4126207 | Brian Schimmel | Campaign courtesy photo, his own Sept-2024 News-Times candidacy announcement (visually confirmed NOT Peter Truax) | 1400×1397 | sourced |

Chain results: Ballotpedia — no individual profiles for any Forest Grove official (outside coverage scope); Wikimedia Commons — nothing; local-news/campaign tier (pre-authorized per D-16) — 7/7. WebP-in-.jpg sources handled by PIL auto-detect.

**License note:** all 7 recorded as `photo_license='sourced'` — press/campaign courtesy photos are NOT government-hosted, so `press_use` would have violated the D-09 rule the plan (and the migration's own header) mandates; 'sourced' is the established value with 461 prior rows.

## Task Commits

1. **Task 1: Author the headshot pipeline script (WR-01 fix)** — no commit (gitignored `_tmp-*` helper in the separate `C:/EV-Accounts` repo; the plan explicitly forbids committing it; confirmed gitignored via `git check-ignore`)
2. **Task 2: Author the audit-only headshot migration** — no commit in this repo (file lives in the separate EV-Accounts repo; committed there by the orchestrator as `95925382` "feat(migrations): 1179 Forest Grove headshots (audit-only)", via `git -C`, migration file only)
3. **Task 3: Checkpoint — orchestrator sourcing + pipeline run + apply + identity/quality QA + commit** — no commit (verification/apply task; results recorded here)

**Plan metadata:** SUMMARY commit (this file).

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py` — 505-line download → white-composite → crop-4:5-FIRST → resize 600×750 Lanczos q90 → PUT x-upsert pipeline; runtime UUID resolution by external_id (psycopg2); unique-ext_id assert with NO hard 7/7 assert (partial outcome expected per the sourcing gap); WR-01 non-zero-exit main(). Gitignored, not committed by design.
- `C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql` — audit-only politician_images migration: 7 guarded INSERTs (final: photo_license='sourced', per-block actual-source comments) + url-embeds-uuid DO gate at the actual count (7). No ledger write. Committed in EV-Accounts as `95925382`.

## Decisions Made

- **photo_license='sourced' for all 7** — the D-16 outcome landed entirely on the non-government tier, so the plan's "press_use only for government-hosted" rule excluded press_use for every official.
- **Fail-closed template handoff** — since the executor has no WebSearch/DB/browser and Wave-0 confirmed the city site was photo-less, both artifacts shipped fail-closed: the script's `all(m['license'])` assert refuses to run on placeholders, and the migration's DO-gate default of 0 makes an unedited apply RAISE and roll back. The orchestrator filled sources/licenses/count at the checkpoint.
- **Pre-filled migration UUIDs from 180-02** (Tualatin 1170 precedent) rather than leaving blocks for the orchestrator to author — delete-unsourced is less error-prone than write-from-scratch; also satisfies the plan's key_link pattern.

## Deviations from Plan

### Auto-fixed / Orchestrator-handled Issues

**1. [Adaptation — plan-anticipated] Fail-closed template pattern for both artifacts**
- **Found during:** Task 1/Task 2 authoring
- **Issue:** Task 2's read_first referenced the "headshot manifest (from Task 1 run)" which cannot exist until the orchestrator runs the pipeline at Task 3 (executor has no DB/Storage/WebSearch; Wave-0 found zero city-site sources)
- **Fix:** Shipped both files as fail-closed templates (placeholder URLs + license assert in the script; pre-filled UUID blocks + DO-gate default 0 in the migration) with an explicit orchestrator fill-in protocol
- **Files modified:** both plan artifacts
- **Verification:** orchestrator filled sources/licenses/count at the checkpoint; migration applied clean at gate=7
- **Committed in:** EV-Accounts `95925382` (final edited migration)

**2. [Rule 1 - Quality] Martinez chin-clip re-crop (orchestrator, at checkpoint QA)**
- **Found during:** Task 3 visual quality check
- **Issue:** The pipeline's generic center-crop clipped Karen Martinez's chin — her 291×600 source was the narrowest of the 7, and the top-anchored tall-image crop window landed too high
- **Fix:** Orchestrator re-cropped with a top-weighted 4:5 window (eye-line ~1/3 from top, source y-window 122..485) via a one-off scratchpad script and re-uploaded over the same Storage object (x-upsert). Final crop visually verified good. All other 6 crops passed visual QA as pipeline-produced.
- **Files modified:** Storage object `politician_photos/cdc010a8-66d5-4cd6-ab5f-ca10f5101e88-headshot.jpg` only (no code/migration change)
- **Verification:** visual QA re-pass; CDN HTTP 200
- **Committed in:** n/a (Storage-only change)

---

**Total deviations:** 2 (1 plan-anticipated structural adaptation, 1 orchestrator quality re-crop)
**Impact on plan:** None adverse — the adaptation is the mechanism by which the plan's own executor/orchestrator split was honored; the re-crop upheld the no-distortion/eyes-at-1/3 headshot standards. No scope creep.

## Issues Encountered

- Executor session was interrupted mid-plan by a provider quota limit after Task 1/2 authoring; resumed from on-disk state with no rework (both files verified complete against acceptance criteria on resume, migration strengthened with pre-filled UUID blocks).
- Ballotpedia and Wikimedia both returned nothing for all 7 officials — expected per RESEARCH; the pre-authorized local-news/campaign tier carried the full outcome.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 04 (stances):** independent of headshots (runs on migrations 1180-1186 with hardcoded 180-02 UUIDs); no coupling to this plan's artifacts.
- **Plan 05 (surfacing/banner):** all 7 officials now render with 600×750 portraits — profile cards will be photo-complete when Forest Grove is surfaced in coverage.js; browse link once surfaced: `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110`.
- **Phases 181-182 (Sherwood, Cornelius):** inherit the WR-01-fixed pipeline template from `_tmp-forest-grove-headshots.py` — do NOT copy the Tualatin main() (it carries the silent-partial-success defect).

## Self-Check: PASSED

- `C:/EV-Accounts/backend/scripts/_tmp-forest-grove-headshots.py` — FOUND on disk (505 lines, `py` AST syntax check OK, `git check-ignore` confirms gitignored)
- `C:/EV-Accounts/backend/migrations/1179_forest_grove_headshots.sql` — FOUND on disk; committed in EV-Accounts (`95925382`); applied to production with the url-embeds-uuid gate passing at 7
- Task 1 acceptance criteria all grep-verified PASS (WR-01 `sys.exit(1)` on failures; no hard `len(OFFICIALS)==7` assert; unique ext_id assert; runtime UUID resolution; 600×750/q90/Lanczos; crop-before-resize order; SOURCE NOTE docstring)
- Task 2 acceptance criteria all grep-verified PASS (5-column INSERTs only; no ledger write; external_id subselects in range; WHERE NOT EXISTS guards; actual-count url-embeds-uuid gate; forbidden literal strings absent from comments)
- Task 3 acceptance criteria recorded with PASS results above (7/7 uploaded exit 0; 7 rows post-apply, url_embeds_uuid=t ×7; identity QA incl. no-Truax/no-Milwaukie checks; migration committed, _tmp .py not committed)

---
*Phase: 180-city-of-forest-grove-deep-seed*
*Completed: 2026-07-03*
