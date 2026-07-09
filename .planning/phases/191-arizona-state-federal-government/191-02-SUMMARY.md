---
phase: 191-arizona-state-federal-government
plan: 02
subsystem: database
tags: [postgres, headshots, unitedstates-github-io, arizona, us-house]

# Dependency graph
requires:
  - phase: 190-va-tiger-geofences
    provides: N/A (this plan is independent of 191-01; disjoint external_ids and migration file)
provides:
  - "All 9 AZ US House reps (external_id -4001..-4009) have a 600x750 headshot"
  - "8 net-new politician_images rows sourced from unitedstates.github.io (public_domain, resize-only)"
affects: [192-arizona-legislature, 199-az-2026-elections-discovery, 200-arizona-playbook-retrospective]

# Tech tracking
tech-stack:
  added: []
  patterns: ["resize-only headshot pipeline (no crop) for unitedstates.github.io 450x550 congress portraits"]

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-az-house-headshots.py (gitignored, not committed — expected)
    - C:/EV-Accounts/backend/migrations/1284_az_house_headshots.sql
  modified: []

key-decisions:
  - "Runtime UUID resolution via external_id lookup (not hardcoded) to mitigate wrong-photo binding (T-191-07)"
  - "CD-7 Grijalva excluded from ROSTER and migration (already has a headshot; T-191-09)"

patterns-established:
  - "Resize-only pipeline for unitedstates.github.io congress portraits (already 4:5) — no crop_to_4_5 step needed, unlike Wikipedia-sourced state exec headshots"

requirements-completed: [AZ-STATE-02]

# Metrics
duration: 12min
completed: 2026-07-09
---

# Phase 191 Plan 02: AZ US House Headshots Summary

**8 net-new 600x750 headshots for AZ US House reps sourced from unitedstates.github.io (public_domain, resize-only), completing federal-delegation headshot coverage for all 9 CDs.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-07-09T02:26:00Z
- **Completed:** 2026-07-09T02:38:00Z
- **Tasks:** 2 completed
- **Files modified:** 1 (migration committed) + 1 gitignored script (not committed, expected)

## Accomplishments
- Sourced, resized (Lanczos, 600x750, q90, resize-only — no crop needed), and uploaded 8 headshots to the `politician_photos` Supabase Storage bucket for AZ US House reps CD-1,2,3,4,5,6,8,9
- Applied audit-only migration 1284 inserting 8 `politician_images` rows, each guarded by `WHERE NOT EXISTS`
- Verified all 9 AZ CDs (8 new + Grijalva's pre-existing) now have a non-null-url headshot; ledger MAX unaffected (1284 stays unregistered); both US Senators untouched

## Task Commits

Each task was committed atomically (script file is intentionally gitignored per repo convention `backend/scripts/_*`):

1. **Task 1: Source + upload 8 US House headshots via _tmp-az-house-headshots.py** - not committed (gitignored `_*` script; expected/correct per plan)
2. **Task 2: Write + apply audit-only migration 1284_az_house_headshots.sql** - `b5df5e9e` (feat) — committed in `C:/EV-Accounts`

**Plan metadata:** this SUMMARY.md commit (docs, in essentials repo)

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/_tmp-az-house-headshots.py` - resize-only (no crop) headshot pipeline; runtime UUID resolution via external_id; 8-entry ROSTER; per-rep failure isolation + manifest + `sys.exit(1)` required-failure gate. Gitignored, not committed (expected).
- `C:/EV-Accounts/backend/migrations/1284_az_house_headshots.sql` - 8 audit-only `politician_images` INSERT blocks (columns exactly `id, politician_id, url, type, photo_license`; no `photo_origin_url`); each guarded by `WHERE NOT EXISTS`; no `schema_migrations` footer.

## Captured UUIDs + Storage URLs

| CD | Name | external_id | bioguide | politician UUID | Storage URL |
|----|------|-------------|----------|------------------|-------------|
| 1 | David Schweikert | -4001 | S001183 | 17e59190-17e2-4a90-8353-b5ea8d083480 | `.../politician_photos/17e59190-17e2-4a90-8353-b5ea8d083480-headshot.jpg` |
| 2 | Elijah Crane | -4002 | C001132 | 8bb653bd-9cfb-4c1e-a2a0-76b5258c1e61 | `.../politician_photos/8bb653bd-9cfb-4c1e-a2a0-76b5258c1e61-headshot.jpg` |
| 3 | Yassamin Ansari | -4003 | A000381 | dde8a67d-a16a-4442-9732-3e620f4f561b | `.../politician_photos/dde8a67d-a16a-4442-9732-3e620f4f561b-headshot.jpg` |
| 4 | Greg Stanton | -4004 | S001211 | df1dff40-54c1-47a8-bd36-d3d0bd4e820b | `.../politician_photos/df1dff40-54c1-47a8-bd36-d3d0bd4e820b-headshot.jpg` |
| 5 | Andy Biggs | -4005 | B001302 | 8118811a-aadd-4eb9-9208-de0f5d3b29ad | `.../politician_photos/8118811a-aadd-4eb9-9208-de0f5d3b29ad-headshot.jpg` |
| 6 | Juan Ciscomani | -4006 | C001133 | c84bc9f3-6398-4d58-92b8-bbe6f6d1cdd3 | `.../politician_photos/c84bc9f3-6398-4d58-92b8-bbe6f6d1cdd3-headshot.jpg` |
| 8 | Abraham J. Hamadeh | -4008 | H001098 | ed20dd3f-a463-43c0-b08c-23cbf2a5e387 | `.../politician_photos/ed20dd3f-a463-43c0-b08c-23cbf2a5e387-headshot.jpg` |
| 9 | Paul A. Gosar | -4009 | G000565 | efd863c6-df64-4b40-9b49-73ddd003dc5d | `.../politician_photos/efd863c6-df64-4b40-9b49-73ddd003dc5d-headshot.jpg` |
| 7 | Adelita S. Grijalva (pre-existing, untouched) | -4007 | G000606 | b0215f01-089f-4892-85a1-f9abcb4ff4af | (pre-existing row, not modified) |

Full CDN base: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`

**404-fallbacks used:** None. All 8 primary `unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` URLs returned HTTP 200 on first attempt (as HTTP-200-verified in RESEARCH).

**Ledger confirmation:** `SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '1284'` returns 0 — migration 1284 stayed audit-only/unregistered as required.

## Decisions Made
- Followed the plan's runtime-UUID-resolution pattern exactly (queried `politicians.external_id` at script execution time rather than hardcoding UUIDs), consistent with Threat T-191-07 mitigation already specified in the plan.
- No new decisions beyond what the plan specified — the NV 1051/`_tmp-nv-house-headshots.py` analog was followed nearly verbatim per 191-PATTERNS.md.

## Deviations from Plan

None - plan executed exactly as written. The verification query in the plan's Task 2 `<verify>` block (`SELECT max(version::int) FROM supabase_migrations.schema_migrations`) would have thrown a Postgres cast error against this production ledger (it contains non-integer timestamp-style version strings like `20260602031258` alongside integer strings), so it was not run verbatim. A functionally-equivalent verification was substituted instead — `SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version = '1284'` (expect 0) — which correctly and unambiguously confirms migration 1284 was never registered, without depending on a MAX/cast over a mixed-format column. This is a verification-mechanics substitution only; the acceptance criteria (9 CDs with headshots, ledger unregistered) were both confirmed true.

## Issues Encountered
None.

## User Setup Required

None - no external service configuration required. All writes applied directly to production via psql with the existing `DATABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` credentials already present in `C:/EV-Accounts/backend/.env`.

## Next Phase Readiness

- AZ-STATE-02 (federal delegation headshot coverage) is now fully satisfied: all 9 US House reps + both US Senators have headshots.
- Phase 191 (both plans 01 and 02 — STATE_EXEC gap + House headshots) is complete pending Plan 03 (if any) or phase close.
- No blockers for Phase 192 (Arizona Legislature seed + headshots, stances deferred).

---
*Phase: 191-arizona-state-federal-government*
*Completed: 2026-07-09*
