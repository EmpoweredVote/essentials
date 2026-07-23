---
phase: 191-arizona-state-federal-government
plan: 01
subsystem: database
tags: [postgres, supabase, data-seeding, arizona, state-executives]

# Dependency graph
requires:
  - phase: 190-arizona-tiger-geofences
    provides: AZ TIGER geofences (STATE_EXEC routing doesn't need geofences, but confirms the AZ FIPS/state foundation)
provides:
  - 7 net-new AZ STATE_EXEC officials (Superintendent, State Mine Inspector, 5-member Corporation Commission)
  - Arizona Corporation Commission modeled as a 5-seat collegial body on 1 shared district/chamber
  - 6/7 net-new officials with 600x750 headshots and recorded licenses
affects: [191-02-arizona-us-house-headshots, 199-az-2026-elections-discovery, 200-arizona-playbook-retrospective]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "5-officers-share-1-district collegial body, office guard on (district_id, politician_id) not (district_id, chamber_id)"
    - "politicians.is_appointed=true + offices.is_appointed_position=false for an appointed holder on an elected office"
    - "Wikimedia Special:FilePath redirect to avoid hand-guessing hash-prefixed upload.wikimedia.org paths"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1282_az_state_exec_gap.sql
    - C:/EV-Accounts/backend/migrations/1283_az_state_exec_headshots.sql
    - C:/EV-Accounts/backend/scripts/_tmp-az-state-exec-headshots.py (untracked — see Deviations)
  modified: []

key-decisions:
  - "Presmyk headshot deferred to Plan 03 human-verify checkpoint — no licensed source found (Wikimedia none, Wikipedia infobox has no image, Ballotpedia placeholder-only, AZGOP press URL 404s, asmi.az.gov WAF-403)"
  - "azcc.gov thumb200 sources for Myers/Walden are 133x200 — upscaled to 600x750 (min_dim threshold lowered from 150 to 100 to accept legitimate small-but-valid thumbnails, matching NV Henderson/ME legislature precedent)"
  - "_tmp-az-state-exec-headshots.py left untracked per repo .gitignore (backend/scripts/_* is intentionally excluded) rather than force-added"

patterns-established:
  - "Corporation Commission collegial-body office guard: NOT EXISTS (district_id, politician_id) — required whenever N>1 officials share both district_id AND chamber_id"

requirements-completed: [AZ-STATE-01]

# Metrics
duration: ~14min
completed: 2026-07-09
---

# Phase 191 Plan 01: Arizona STATE_EXEC Gap Summary

**Seeded the 7 missing AZ statewide elected officials (Superintendent, State Mine Inspector, 5-member Corporation Commission) via structural migration 1282, then uploaded 6/7 headshots via migration 1283 — Presmyk deferred to a checkpoint.**

## Performance

- **Duration:** ~14 min
- **Started:** 2026-07-09T02:05:37Z (approx, per STATE.md phase-execution-started marker)
- **Completed:** 2026-07-09T02:19:00Z
- **Tasks:** 3/3 completed
- **Files modified:** 2 tracked (EV-Accounts) + 1 untracked script + 1 SUMMARY (essentials)

## Accomplishments
- Closed the AZ STATE_EXEC gap: 11 of 11 statewide elected officials now exist under State of Arizona (4 pre-existing + 7 net-new).
- Arizona Corporation Commission correctly modeled as ONE 5-member collegial body sharing a single STATE_EXEC district + chamber (official_count=5), not 5 sibling districts.
- Les Presmyk (State Mine Inspector) correctly flagged: `politicians.is_appointed=true` (his personal path — gubernatorial appointment to fill a vacancy) while `offices.is_appointed_position=false` (the office itself is Arizona's only directly-elected mine-inspector post).
- 6/7 net-new officials have a 600x750 headshot with a recorded photo_license; Presmyk flagged non-blocking for the Plan 03 checkpoint.
- Zero AZ section-split defects (pre- and post-migration); no phantom Lieutenant Governor row (confirms D-03a).

## Task Commits

Each task was committed atomically (in the `C:/EV-Accounts` repo, branch `master`):

1. **Task 1: DB pre-check + collision gate** — read-only, no commit (all 6 assertions passed via inline psql).
2. **Task 2: Write + apply structural migration 1282** — `0cb64f1e` (feat) — 3 chambers, 3 STATE_EXEC districts, 7 politicians (-4004001..-4004007), 7 offices, office_id back-fill. Registered in `schema_migrations` as `('1282','az_state_exec_gap')`.
3. **Task 3: Source 6/7 headshots + audit-only migration 1283** — `5e029f74` (feat) — `politician_images` rows for Horne, Myers, Walden, Márquez Peterson, Thompson, Lopez. Audit-only; ledger MAX unchanged at 1282.

**Plan metadata:** (this commit, essentials repo) `docs(191-01): complete Arizona STATE_EXEC gap plan`

## Files Created/Modified

**C:/EV-Accounts (backend, branch master):**
- `backend/migrations/1282_az_state_exec_gap.sql` — structural, registered. Creates Superintendent + State Mine Inspector single-seat blocks, Corporation Commission 5-officer collegial block, office_id back-fill, and post-verification `DO $$` gates (row counts, Presmyk flags, section-split).
- `backend/migrations/1283_az_state_exec_headshots.sql` — audit-only. 6 `politician_images` INSERT blocks (Horne, Myers, Walden, Márquez Peterson, Thompson, Lopez). Presmyk deliberately omitted.
- `backend/scripts/_tmp-az-state-exec-headshots.py` — download/crop/resize/upload pipeline for the 7-official ROSTER. Present on disk but **not tracked by git** (repo `.gitignore` line 71 excludes `backend/scripts/_*` — matches the established convention that no `_tmp-*.py` headshot script in this project's history is committed).

**C:/Transparent Motivations/essentials:**
- `.planning/phases/191-arizona-state-federal-government/191-01-SUMMARY.md` (this file)

## Decisions Made

- **Presmyk headshot fallback exhausted, deferred non-blocking:** Attempted Wikimedia Commons (no portrait exists under his name — only mineral-specimen photos, confirming RESEARCH.md), `en.wikipedia.org/wiki/Les_Presmyk` (article exists with a full infobox but NO image field populated), Ballotpedia (`ballotpedia.org/Les_Presmyk` renders only the generic "SubmitPhoto" placeholder — confirms no photo on file), AZGOP press-release URL from RESEARCH.md (404), and `asmi.az.gov/about/team` (WAF-403, as RESEARCH.md predicted). No `/find-headshots`-equivalent WebSearch/Playwright tool was available in this execution environment, so the skill itself could not be run — exhausted the available curl-based fallback chain instead. Flagged for the Plan 03 human-verify checkpoint per the NV 159 Andy Matthews precedent; does not block the other 6.
- **min_dim threshold lowered 150→100 in the headshot script:** The azcc.gov `tmb-thumb200` portraits for Myers and Walden are 133x200 — a legitimate (if small) source image, not a broken/tiny icon. The original 150px floor incorrectly rejected them. Lowered to 100px, matching this project's established low-res-thumbnail-upscale precedent (NV Henderson Ballotpedia 200×300, ME legislature 152×202). Both now upload successfully at 600x750.
- **Script left untracked by git:** `backend/scripts/_*` files are excluded by this repo's own `.gitignore` (line 71) — a deliberate project convention for throwaway/temp scripts (confirmed: the closest analog, `_tmp-nv-controller-headshot.py`, has zero commit history in this repo either). Followed the established repo convention rather than force-adding with `-f`, which would have fought the project's own configuration. The script remains on disk at the documented path for reference; its output (the migration + uploaded images) is what matters and is fully committed/applied.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Headshot pipeline min_dim threshold incorrectly rejected valid small-but-legitimate source images**
- **Found during:** Task 3 (headshot sourcing for Myers/Walden)
- **Issue:** The script's `min_dim = 150` guard rejected azcc.gov's `tmb-thumb200` portraits (133x200) as "too small," even though these are genuine, correctly-licensed official commissioner portraits — just a small thumbnail format, matching precedent already accepted elsewhere in this project (NV/ME low-res upscales).
- **Fix:** Lowered `min_dim` to 100 in `_tmp-az-state-exec-headshots.py`. Re-ran the script; both Myers and Walden now upload successfully at 600x750 (upscaled via Lanczos).
- **Files modified:** `C:/EV-Accounts/backend/scripts/_tmp-az-state-exec-headshots.py`
- **Verification:** Script exits 0; `politician_images` rows confirmed via psql for both officials with non-null `url` and `photo_license='press_use'`.
- **Committed in:** N/A (script is untracked per repo convention — see Decisions Made); the resulting DB rows are captured in migration `1283_az_state_exec_headshots.sql`, commit `5e029f74`.

**2. [Rule 3 - Blocking] Repo `.gitignore` blocked the plan's literal instruction to commit the headshot script**
- **Found during:** Task 3, commit step
- **Issue:** The plan's `files_modified` list and Task 3 instructions call for committing `_tmp-az-state-exec-headshots.py` to `C:/EV-Accounts`. The repo's own `.gitignore` (line 71: `backend/scripts/_*`) blocks this — `git add` failed with "ignored by .gitignore" until `-f` is used.
- **Fix:** Did NOT force-add (`-f`) — that would fight an intentional, pre-existing project convention (confirmed no `_tmp-*.py` headshot script has ever been committed in this repo's history). Committed only the two SQL migration files (1282, 1283), which are not gitignored. The script remains present on disk at the documented path.
- **Files modified:** None (decision not to force-add)
- **Verification:** `git log --all -- backend/scripts/_tmp-nv-controller-headshot.py` returns empty, confirming this is the established pattern, not a one-off gap.
- **Committed in:** N/A — deliberately left uncommitted; documented here instead.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking/convention-conflict)
**Impact on plan:** Both were necessary corrections. No scope creep — the DB state (migrations, Storage uploads) fully satisfies the plan's acceptance criteria; only the plan's literal "commit the script" instruction yielded to the repo's own configuration.

## Issues Encountered

- No `mcp__supabase-local` or WebSearch/Playwright tool was exposed to this executor (matches the RESEARCH.md finding) — all DB writes/reads used `psql` directly against `DATABASE_URL`, and the Presmyk headshot search used curl-based fallback checks instead of the full `/find-headshots` skill (which requires WebSearch/Playwright). This did not block the plan — Presmyk was already a non-blocking, deferred item by design.
- Python was not on `PATH` as `python`/`python3` in this shell (Windows Store alias stubs) — used the `py` launcher (`py -3`, resolved to Python 3.14.3 with PIL 12.1.1, psycopg2, requests all present) instead.

## User Setup Required

None — no external service configuration required. All writes were made directly to production via `psql`/Supabase Storage REST API using credentials already present in `C:/EV-Accounts/backend/.env`.

## Next Phase Readiness

- **AZ-STATE-01 substantially complete:** 11/11 STATE_EXEC officials seeded; 10/11 have headshots (Presmyk pending).
- **Open item carried to Plan 03 (per the phase's own recommended split):** Les Presmyk (State Mine Inspector, external_id -4004002, politician UUID `8bcdaf44-f392-410d-83c3-7597a52a8140`) needs a human-verify checkpoint to source a licensed headshot — recommend the `/find-headshots` skill (requires WebSearch + Playwright, unavailable to this executor) or manual sourcing, then a follow-up audit-only `politician_images` INSERT using the same shape as `1283_az_state_exec_headshots.sql`.
- Plan 02 (AZ US House headshots, AZ-STATE-02) is unblocked and has no dependency on this plan's open item.
- Migration ledger MAX remains 1282 (registered); files 1283 exists audit-only. Next structural migration number for Phase 192 should re-verify both ledger MAX and on-disk MAX before assigning (per Pitfall 2 in 191-RESEARCH.md — drift is expected to recur).

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1282_az_state_exec_gap.sql`
- FOUND: `C:/EV-Accounts/backend/migrations/1283_az_state_exec_headshots.sql`
- FOUND: `C:/EV-Accounts/backend/scripts/_tmp-az-state-exec-headshots.py` (on disk, untracked by design)
- FOUND commit `0cb64f1e` in `C:/EV-Accounts` git log
- FOUND commit `5e029f74` in `C:/EV-Accounts` git log
- FOUND: 7 politicians external_id -4004001..-4004007 in production DB (psql-verified)
- FOUND: 5 offices on the 'Arizona Corporation Commission' STATE_EXEC district (psql-verified)
- FOUND: 6 `politician_images` rows for the net-new officials, all non-null url + photo_license (psql-verified)
- FOUND: ledger MAX = 1282 (psql-verified)

---
*Phase: 191-arizona-state-federal-government*
*Completed: 2026-07-09*
