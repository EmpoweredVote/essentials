---
phase: 119-lynn-deep-seed
plan: 03
subsystem: database
tags: [postgres, sql, migration, massachusetts, lynn, headshots, civiclive, wikipedia, storage]

# Dependency graph
requires:
  - phase: 119-01
    provides: 12 Lynn city officials (external_ids -2537490001..-2537490012) for headshot upload
  - phase: 119-02
    provides: 6 Lynn SC politicians (external_ids -2507110001..-2507110006) documented as gaps
  - phase: 118-somerville-deep-seed
    provides: _tmp-somerville-headshots.py as direct analog for Python script structure
provides:
  - 12 politician_images rows with type='default' for Lynn city officials (external_ids -2537490001..-2537490012)
  - 11 CivicLive CDN headshots uploaded at 600x750 Lanczos q90 to politician_photos bucket
  - Mayor Nicholson Wikipedia Commons headshot uploaded (b9c5dd29-eeb5-4903-af31-d4ab09041b0a-headshot.jpg)
  - 6 SC member gaps documented in migration 586 with gap reason comments (D-01)
  - Migration 586 applied to production; schema_migrations ledger entry added
affects:
  - 123-ma-tier3-stances-wave2 (Lynn politicians now have headshots; stances phase next)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CivicLive CDN headshot pattern for Lynn (cdnsm5-hosted2.civiclive.com — all 11 councilors confirmed 200)"
    - "Wikipedia Commons requires WIKIMEDIA_HEADERS (descriptive UA) not Chrome UA to avoid 429 rate limits"
    - "MegieMaddrey.png (no hyphen) CDN filename despite Megie-Maddrey last_name in DB"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py
    - C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql
  modified: []

key-decisions:
  - "Wikipedia UA policy: WIKIMEDIA_HEADERS used for Mayor Nicholson — Chrome UA returned 429; Wikipedia requires descriptive bot UA"
  - "MegieMaddrey.png: CDN filename confirmed with no hyphen despite DB last_name='Megie-Maddrey' (Pitfall 2 from RESEARCH.md)"
  - "All 6 SC members documented as gaps per D-01 — no official photo source, no fallback hunting"
  - "photo_license='public_domain' for all 12 inserts (CivicLive government photos + Wikipedia Commons)"

patterns-established:
  - "CivicLive CDN headshot pattern: cdnsm5-hosted2.civiclive.com/UserFiles/Servers/Server_109726/Image/Council%20Photos/{LastName}.png"
  - "Wikipedia Commons headshots require WIKIMEDIA_HEADERS with descriptive User-Agent to avoid 429"

requirements-completed:
  - LYNN-02

# Metrics
duration: 20min
completed: 2026-06-14
---

# Phase 119 Plan 03: Lynn Headshots Summary

**12 Lynn city official headshots uploaded to politician_photos bucket at 600x750 via CivicLive CDN + Wikipedia Commons Mayor; migration 586 inserts 12 politician_images rows; 6 SC gaps documented per D-01**

## Performance

- **Duration:** 20 min
- **Started:** 2026-06-14T17:35:00Z
- **Completed:** 2026-06-14T17:55:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- 12 city official headshots uploaded to politician_photos bucket at 600x750 (11 from CivicLive CDN + 1 Mayor from Wikipedia Commons)
- Migration 586 applied cleanly; all 5 post-verification checks PASSED (12 type=default, 0 wrong-type, 0 SC rows, 0 split-orphans, ledger entry confirmed)
- Natasha Megie-Maddrey headshot uploaded successfully using MegieMaddrey.png CDN filename (Pitfall 2 confirmed)
- 6 SC members documented as gaps in migration comments with D-01 rationale (SchoolMessenger text-only site)
- LYNN-02 requirement satisfied: 12/12 city officials with headshots at 600x750; SC gaps honest per D-01
- Phase 119 complete: LYNN-01 (plans 01+02) + LYNN-02 (plan 03) both satisfied

## Task Commits

Each task was committed atomically to EV-Accounts repo:

1. **Task 1: Write _tmp-lynn-headshots.py Python upload script** - `3f39b294` (feat)
2. **Task 2: Write and apply migration 586_lynn_headshots.sql** - `4f67ed0b` (feat)

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py` — 18-entry ROSTER (12 city + 6 SC); CivicLive CDN + Wikipedia Mayor + 6 SC gaps; crop 4:5 first then resize 600x750 Lanczos q90; WIKIMEDIA_HEADERS for Mayor (Chrome UA returns 429)
- `C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql` — 12 politician_images INSERT blocks with type='default' and WHERE NOT EXISTS guards; 6 SC gap comments; post-verification DO block; migration ledger entry

## Decisions Made

- **Wikipedia User-Agent policy:** Mayor Nicholson's Wikipedia Commons URL returned HTTP 429 on first run with Chrome-like UA. Fixed by using `WIKIMEDIA_HEADERS` with descriptive bot UA (`EmpoweredVoteBot/1.0`). Wikipedia's User-Agent policy requires a descriptive agent string — not a browser mimicry UA. This is a confirmed Wikipedia behavior, not a transient error. Script updated with `WIKIMEDIA_HEADERS` constant for future reproducibility.
- **MegieMaddrey.png filename:** CDN filename confirmed as `MegieMaddrey.png` (no hyphen). Download succeeded; upload verified. DB last_name='Megie-Maddrey' correctly retains the hyphen.
- **SC gaps documented per D-01:** All 6 SC members have no official headshot source. No fallback hunting per D-01 decision. Gap reason in both script ROSTER and migration SQL comments.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Wikipedia 429 rate limit via proper User-Agent**
- **Found during:** Task 1 (_tmp-lynn-headshots.py run)
- **Issue:** Mayor Nicholson's Wikipedia Commons URL returned HTTP 429 with Chrome-like `BROWSER_HEADERS_DEFAULT`. Wikipedia's UA policy rejects browser-mimicry agents and requires a descriptive bot identification string.
- **Fix:** Added `WIKIMEDIA_HEADERS` constant with `Mozilla/5.0 (compatible; EmpoweredVoteBot/1.0; +https://empowered.vote)` UA; updated Mayor ROSTER entry to use `WIKIMEDIA_HEADERS` instead of `BROWSER_HEADERS_DEFAULT`. Retried upload — succeeded on first attempt.
- **Files modified:** `C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py`
- **Verification:** Wikipedia returned 200 with 4826691 bytes (4MB JPEG); cropped to 4000x5000 then resized 600x750; uploaded to Supabase Storage; politician_id b9c5dd29 confirmed in migration 586 INSERT block
- **Committed in:** `3f39b294` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — Bug)
**Impact on plan:** Fix required for correct behavior. Mayor Nicholson headshot now uploaded; plan's 12/12 target achieved. No scope creep.

## Issues Encountered

**Wikipedia 429 on first run:** Mayor Nicholson's headshot returned HTTP 429 on initial script run (Chrome UA). This is expected Wikipedia behavior — their API policy requires a descriptive bot User-Agent. Resolved by adding `WIKIMEDIA_HEADERS` with an appropriate bot UA string. The image uploaded successfully on the direct retry. Script updated so future re-runs use correct headers.

## User Setup Required

None — migration applied directly via psycopg2; no external service configuration required.

## Next Phase Readiness

- Migration 586 applied; 12 politician_images rows with type='default' now exist for all Lynn city officials
- Phase 119 is complete: LYNN-01 (city gov + SC seeded) + LYNN-02 (12/12 headshots) both satisfied
- SC member headshots are honest gaps per D-01 — no fallback hunting needed
- Lynn is ready for stance research (next phase in MA city sequence)

### Verification Results

| Query | Expected | Actual | Status |
|-------|----------|--------|--------|
| politician_images type=default count (both ranges) | 12 | 12 | PASS |
| politician_images type!=default count | 0 | 0 | PASS |
| SC politician_images count (all gaps) | 0 | 0 | PASS |
| Section-split orphans (geo_ids 2537490 + 2507110) | 0 | 0 | PASS |
| Migration 586 ledger entry | 1 | 1 | PASS |
| Megie-Maddrey uploaded (MegieMaddrey.png) | success | success | PASS |
| Mayor Nicholson uploaded (Wikipedia Commons) | success | success | PASS |

## Known Stubs

None — all 12 inserted politician_images rows have real CDN URLs pointing to uploaded files in politician_photos bucket. SC gaps are intentional and documented, not stubs.

## Threat Flags

No new security-relevant surface introduced. SQL-only data inserts with WHERE NOT EXISTS idempotency guards. T-119-03-02 (type field tampering) mitigated — post-verification RAISE EXCEPTION if wrong type count > 0. T-119-03-03 (schema_migrations ledger) mitigated — ON CONFLICT DO NOTHING.

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/scripts/_tmp-lynn-headshots.py`
- FOUND: `C:/EV-Accounts/backend/migrations/586_lynn_headshots.sql`
- FOUND: Migration 586 in `supabase_migrations.schema_migrations` ledger (Q5=1)
- FOUND: 12 politician_images rows type='default' for Lynn city officials (Q1=12)
- FOUND: 0 SC politician_images rows (Q3=0 — all gaps as expected)
- FOUND: Commit `3f39b294` (Task 1) exists in EV-Accounts git log
- FOUND: Commit `4f67ed0b` (Task 2) exists in EV-Accounts git log

---
*Phase: 119-lynn-deep-seed*
*Completed: 2026-06-14*
