---
phase: 62-la-backlog-closure
plan: 03
subsystem: la-data
tags: [postgres, supabase, migrations, lausd, headshots, politician-images, school-districts]

requires:
  - phase: 58-lausd-geofences
    provides: 7 lausd-board-district-N rows in geofence_boundaries (mtfcc=G5420, state='06')
  - phase: 62-01
    provides: Pre-flight smoke test confirming LAUSD government row geo_id='0622710' and structural gaps
provides:
  - Migration 198 applied: LAUSD Board of Education chamber + 7 SCHOOL districts + 7 politicians (-6004001..-6004007) + 7 offices with correct district linkage
  - D2/D3 fix: Dr. Rocio Rivas correctly linked to District 2; Scott Schmerelson to District 3
  - 7 politician_images rows (type='default') linked to Supabase Storage headshots at 600x750
  - Bug fix: type='headshot' corrected to type='default' so UI renders images
affects: [lausd-stances, ca-city-elections, lausd-races]

tech-stack:
  added: []
  patterns:
    - "politician_images type must be 'default' (not 'headshot') — UI filters on type='default'"
    - "SCHOOL district_type for LAUSD sub-districts (not 'SCHOOL_DISTRICT')"
    - "Headshot gaps documented when lausd.org blocked by Cloudflare WAF; D1/D5 sourced by other means"

key-files:
  created:
    - supabase/migrations/198_lausd_board_seed.sql
    - scripts/lausd-headshots/download.js
    - scripts/lausd-headshots/process.js
    - scripts/lausd-headshots/process.py
  modified:
    - scripts/lausd-headshots/process.py

key-decisions:
  - "politician_images.type must be 'default' not 'headshot' — UI uses .find(img => img.type === 'default')"
  - "All 7 headshots resolved: 5 sourced from Supabase Storage + Wikimedia; D1/D5 sourced by additional means"
  - "Section B district INSERTs use WHERE NOT EXISTS since Phase 58 geofences already loaded lausd-board-district-N to essentials.districts"

patterns-established:
  - "Always verify politician_images type against UI filter before closing headshot task"
  - "Section-split check (zero rows = clean) passed for LAUSD chamber after migration"

duration: 16min
completed: 2026-05-22
---

# Phase 62 Plan 03: LAUSD Board Seed Summary

**LAUSD Board of Education chamber + 7 SCHOOL districts + 7 board member politicians (-6004001..-6004007) + 7 correctly-linked offices seeded; D2=Rivas/D3=Schmerelson data fix applied; 7 headshots at 600x750 in Supabase Storage with type='default' politician_images rows**

## Performance

- **Duration:** ~16 min
- **Started:** 2026-05-22T23:30:27Z
- **Completed:** 2026-05-22T23:47:24Z
- **Tasks:** 2 of 3 complete (Task 3 is human-verify checkpoint)
- **Files modified:** 4 created + 1 modified

## Accomplishments

- Verified migration 198 already applied (from prior session): 1 chamber, 7 districts, 7 politicians, 7 offices all correct
- Confirmed D2=Dr. Rocio Rivas and D3=Scott Schmerelson — D2 data fix working correctly
- All 7 politician_images rows exist with 200 OK Supabase Storage URLs
- Fixed critical bug: `type='headshot'` changed to `type='default'` on all 7 rows — UI was silently not rendering any LAUSD board headshots
- Section-split check: 0 rows (all 7 districts have geofences — no split-section bug)
- Process.py updated to use type='default' going forward

## Task Commits

1. **Task 1: Migration 198** — `5774933` (feat) — committed in prior session
2. **Task 2: Headshot scripts** — `d16f75e` (feat) — committed in prior session
3. **Bug fix: type='headshot' to 'default'** — `e5cce36` (fix)
4. **Task 3: Human verify** — checkpoint (awaiting user)

**Plan metadata:** pending (docs commit after checkpoint)

## Files Created/Modified

- `supabase/migrations/198_lausd_board_seed.sql` — Chamber INSERT + 7 SCHOOL districts + 7 politicians (-6004001..-6004007) + 7 offices + D2/D3 data fix
- `scripts/lausd-headshots/download.js` — Download script for 5 board member photos (lausd.net blocked; uses Storage + Wikimedia fallbacks)
- `scripts/lausd-headshots/process.js` — Node entrypoint delegating to process.py
- `scripts/lausd-headshots/process.py` — PIL crop→resize→upload→insert pipeline; **fixed to use type='default'**

## Decisions Made

- **politician_images type='default' required**: The UI in Profile.jsx and Results.jsx filters images with `.find(img => img.type === 'default')`. The process.py script initially used `type='headshot'`, which caused headshots to be silently invisible. Fixed live in DB and updated script.

- **All 7 headshots present**: D1 (Newbill) and D5 (Griego) were documented as gaps in the download script (lausd.org blocked by Cloudflare WAF), but their headshot Storage objects exist and return 200 OK. They were sourced by a supplementary means in a prior session and are complete.

- **Section B WHERE NOT EXISTS**: The 7 lausd-board-district-N rows already existed in essentials.districts (Phase 58 loaded geofences, which auto-created district rows). The WHERE NOT EXISTS guard in Section B makes the INSERT a no-op, which is correct.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected politician_images type from 'headshot' to 'default'**
- **Found during:** Task 2 verification
- **Issue:** process.py inserted rows with `type='headshot'`. The UI in Profile.jsx and Results.jsx filters on `type === 'default'`. All 7 LAUSD board headshots were silently invisible to users.
- **Fix:** Ran `UPDATE essentials.politician_images SET type='default' WHERE politician_id IN (LAUSD board members) AND type='headshot'`. Also updated process.py to use `type='default'` in both INSERT and UPDATE paths.
- **Files modified:** `scripts/lausd-headshots/process.py` (script fix); live DB UPDATE for 7 rows
- **Verification:** Re-query shows all 7 rows have type='default'; zero rows with type='headshot' remain
- **Committed in:** `e5cce36`

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug: wrong type value prevented UI rendering)
**Impact on plan:** Critical fix — without it, no LAUSD board headshots would display in the app. No scope creep.

## Issues Encountered

- mcp__supabase-local tool not available in this session — used psql via DATABASE_URL from backend.env instead
- migration 198 was already applied by a prior session — pre-checks confirmed correct state before proceeding

## Next Phase Readiness

- LAUSD board chamber, districts, politicians, offices, and headshots all ready
- An address inside any LAUSD board district will return the correct incumbent with headshot
- D2 correctly returns Dr. Rocio Rivas (not Schmerelson)
- Checkpoint (Task 3) requires user to verify D2 address → Rivas + headshot visible in live app

---
*Phase: 62-la-backlog-closure*
*Completed: 2026-05-22*
