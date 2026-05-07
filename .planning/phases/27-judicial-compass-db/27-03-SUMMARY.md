---
phase: 27-judicial-compass-db
plan: 03
subsystem: database
tags: [postgresql, compass, judicial, typescript, react, jsx, migration]

# Dependency graph
requires:
  - phase: 27-01
    provides: migration 112 (judicial_role column + expanded role_scope constraint)
  - phase: 27-02
    provides: migration 113 file (8 topics + 40 stances + 8 role rows authored)
provides:
  - Migration 113 applied to production: 8 judicial topics, 40 stances, 8 role rows live
  - compassService.ts applies_judicial flag propagated with false fallback
  - Profile.jsx districtScope derivation returns 'judicial' for JUDICIAL/NATIONAL_JUDICIAL
  - CompassCard.jsx maps districtScope='judicial' to applies_judicial key
affects:
  - phase-28-judicial-profiles (wires judicial record display — builds on districtScope now live)
  - future-stance-research (judicial topics ready to receive politician_answers rows)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "apply-script pattern: pre-check topic count → skip if already applied → apply SQL → post-verify"
    - "applies_judicial defaults to false (not true) — existing cross-cutting topics must NOT appear on judicial profiles"
    - "districtScope judicial check ordered BEFORE NATIONAL_ prefix catch-all (NATIONAL_JUDICIAL safety)"
    - "four-arm ternary in CompassCard key derivation: local/state/judicial/federal(fallback)"

key-files:
  created:
    - C:\EV-Accounts\backend\scripts\_apply-migration-113.ts
  modified:
    - C:\EV-Accounts\backend\src\lib\compassService.ts
    - C:\Transparent Motivations\essentials\src\pages\Profile.jsx
    - C:\Transparent Motivations\essentials\src\components\CompassCard.jsx

key-decisions:
  - "applies_judicial fallback is false (not true) — prevents all existing cross-cutting topics from appearing on judicial profiles"
  - "JUDICIAL check placed as third arm in districtScope IIFE, after STATE_ and before NATIONAL_ prefix — critical ordering to prevent NATIONAL_JUDICIAL being caught as 'federal'"
  - "CompassCard fourth arm fallback remains 'applies_federal' — future federal-only topics continue to work for federal officials"

patterns-established:
  - "judicial scope isolation: role_scope='judicial' rows on judicial topics; no federal/state/local rows; applies_judicial=false default"
  - "districtScope derivation order: LOCAL → STATE_ → JUDICIAL/NATIONAL_JUDICIAL → NATIONAL_ → null"

# Metrics
duration: 3min
completed: 2026-05-07
---

# Phase 27 Plan 03: Judicial Compass DB — Apply & Wire Summary

**Migration 113 applied to production (8 topics, 40 stances, 8 judicial role rows), applies_judicial propagated through compassService.ts, Profile.jsx, and CompassCard.jsx — judicial scope wiring complete**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-07T03:42:49Z
- **Completed:** 2026-05-07T03:46:25Z
- **Tasks:** 4
- **Files modified:** 4

## Accomplishments

- Applied migration 113 to production DB: 8 judicial compass topics live with 40 stances and 8 role rows (all role_scope='judicial', 0 contamination from federal/state/local)
- Patched compassService.ts to expose `applies_judicial` flag with a critical `false` fallback — cross-cutting topics correctly excluded from judicial profiles
- Updated Profile.jsx districtScope derivation to return 'judicial' for JUDICIAL and NATIONAL_JUDICIAL district_types, with the check placed BEFORE the `NATIONAL_` prefix catch-all
- Updated CompassCard.jsx scope key derivation with a four-arm ternary mapping 'judicial' to 'applies_judicial'

## Task Commits

Each task was committed atomically:

1. **Task 1: Apply migration 113** - `21e2f50` (feat) — backend repo
2. **Task 2: Patch compassService.ts** - `f2a9619` (feat) — backend repo
3. **Task 3: Update Profile.jsx districtScope** - `df4e8fb` (feat) — frontend repo
4. **Task 4: Patch CompassCard.jsx scope key** - `90ead11` (feat) — frontend repo

**Plan metadata:** committed with docs commit (below)

## Files Created/Modified

- `C:\EV-Accounts\backend\scripts\_apply-migration-113.ts` — Apply script; pre-check + SQL application + 5-point post-verify (topics=8, stances=40, role rows=8, all judicial, 0 non-judicial)
- `C:\EV-Accounts\backend\src\lib\compassService.ts` — Added `applies_judicial` to `getCompassTopics()` return and `tierFlagsFor()` helper in `getCompassCategories()`
- `C:\Transparent Motivations\essentials\src\pages\Profile.jsx` — Added `if (dt === 'JUDICIAL' || dt === 'NATIONAL_JUDICIAL') return 'judicial';` as third arm in districtScope IIFE (before NATIONAL_ prefix check)
- `C:\Transparent Motivations\essentials\src\components\CompassCard.jsx` — Replaced three-arm ternary with four-arm version; 'judicial' → 'applies_judicial'; JSDoc prop comment updated

## Decisions Made

- **applies_judicial fallback = false:** Existing cross-cutting topics (6 topics with no role rows) must NOT appear on judicial profiles. The `false` default enforces this without requiring explicit exclusion rows.
- **Judicial check ordering in districtScope IIFE:** NATIONAL_JUDICIAL starts with 'NATIONAL_' — if the judicial check is placed after the NATIONAL_ prefix arm, NATIONAL_JUDICIAL judges would incorrectly receive federal scope and see non-judicial topics. Third arm (after STATE_, before NATIONAL_) is the only safe position.
- **Fallback arm in CompassCard remains 'applies_federal':** NATIONAL_ officials correctly fall through to 'applies_federal' as before; 'judicial' is handled before the fallback.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None — all four tasks executed cleanly. TypeScript type-check passed with zero errors. Frontend build passed (pre-existing chunk size warning is unrelated).

## User Setup Required

None — no external service configuration required. All changes are deployed via normal Render push flows.

## Next Phase Readiness

Phase 27 (Judicial Compass DB) is complete. All 5 success criteria satisfied:

1. Migration 113 applied: 8 judicial topics live in production DB
2. compassService.ts: `applies_judicial` propagated correctly (true for judicial topics, false for all others including cross-cutting)
3. Profile.jsx: JUDICIAL/NATIONAL_JUDICIAL → 'judicial' scope, checked before NATIONAL_ prefix
4. CompassCard.jsx: 'judicial' scope maps to 'applies_judicial' key
5. TypeScript compile + frontend build both pass

Phase 28 (Judicial Profiles) can begin — it builds on the `districtScope='judicial'` routing and judicial topic content now live.

---
*Phase: 27-judicial-compass-db*
*Completed: 2026-05-07*
