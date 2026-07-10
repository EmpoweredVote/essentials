---
phase: 190-arizona-tiger-geofences
plan: 01
subsystem: geofence-loader
tags: [tiger, geofences, arizona, loader-scaffold, dry-run]
requires: []
provides:
  - AZ registered in load-state-tiger-boundaries.ts (STATE_LAYER_ALLOWLIST, STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID)
  - EXPECTED_AZ_MTFCC pre-flight block with confirmed counts (cd119=9, sldu=30, sldl=30, place=91, county=15)
  - verify-az-tiger-import.sql (7 gates for state='04')
  - smoke-az-geofences.ts (6 AZ addresses, expectedCounts synced)
affects:
  - Phase 190 Plan 02 (live AZ TIGER load — now unblocked)
tech-stack:
  added: []
  patterns: [NV/VA/MD 5-layer TIGER pattern, read-only shapefile count for count discovery]
key-files:
  created:
    - C:/EV-Accounts/backend/scripts/verify-az-tiger-import.sql
    - C:/EV-Accounts/backend/scripts/smoke-az-geofences.ts
  modified:
    - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
decisions:
  - "SLDL confirmed EXACTLY 30 polygons (D-04) — one polygon per legislative district shared by 2 house seats, NOT 60"
  - "place (G4110) confirmed 91 AZ incorporated municipalities"
  - "Current loader --dry-run short-circuits before the pre-flight assertion; counts discovered via a read-only shapefile-count helper instead (documented deviation)"
metrics:
  tasks_completed: 3
  files_created: 2
  files_modified: 1
  db_rows_written: 0
  duration_minutes: 20
  completed_date: 2026-07-08
---

# Phase 190 Plan 01: Arizona TIGER Geofences Loader Scaffold Summary

Armed the generalized TIGER loader for Arizona (FIPS 04) across all three inline
config blocks plus the EXPECTED_AZ_MTFCC pre-flight, created the verify + smoke
scripts, and confirmed the actual TIGER 2024 FIPS 04 polygon counts (headline: SLDL
is EXACTLY 30, not 60) — all with zero database rows written. Plan 02's live load is
now unblocked.

## What Was Built

### Task 1 — AZ registered in the loader (commit c1ec0fe4)
Three additive config edits + one pre-flight block in `load-state-tiger-boundaries.ts`,
each placed immediately after the NV entry:
- `STATE_LAYER_ALLOWLIST`: `AZ: new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])` — `cd119` key per D-00 (not bare `cd`); no `cousub` (D-03), no `aiannh` (D-01)
- `STATE_CITY_ASSERTIONS`: `AZ: ['Tucson city', 'Oro Valley town', 'Marana town', 'Sahuarita town', 'South Tucson city']` — note the town/city LSAD split
- `STATE_RUN_MAKEVALID`: `AZ: new Set([...5 layers])`
- `EXPECTED_AZ_MTFCC` block guarded by `if (fipsArg === '04')`, copied verbatim from the NV block; initial sentinels cd119=9, sldu=30, sldl=0, place=0, county=15
- `FIPS_TO_STATE` already had `'04': 'az'` — no duplicate added (would be a TS duplicate-key error)

### Task 2 — verify + smoke scripts (commit b0dae6b0)
- `verify-az-tiger-import.sql`: 7 gates for `state='04'` — invalid geometry, GeometryCollection, per-layer counts, Gate 4 unincorporated-Pima probe at Catalina Foothills (-110.9210, 32.3130) expecting NO G4110/G4040, Gate 5 districts casing, Gate 6 Pima County sentinel (04019), Gate 7 OR-direction section-split.
- `smoke-az-geofences.ts`: 6 AZ addresses (Catalina Foothills unincorporated + Tucson / Oro Valley / Marana / Sahuarita / South Tucson). Catalina Foothills forbids G4110 + G4040. No G5420 tier (AZ does not load the `unsd` school-district layer this phase, unlike the NV analog).

### Task 3 — pre-existing checks + count discovery + sentinel update (commit c7423dcb)
- Pre-existing-row checks run read-only against production.
- Confirmed counts and updated EXPECTED_AZ_MTFCC.sldl 0→30 and .place 0→91; synced smoke test expectedCounts G5220 0→30 and G4110 0→91.

## Confirmed Values (for Plan 02 reference)

| Layer | MTFCC | Confirmed count | Notes |
|-------|-------|-----------------|-------|
| cd119 | G5200 | 9 | 9 AZ congressional districts |
| sldu | G5210 | 30 | 30 legislative districts (single senator each) |
| sldl | G5220 | **30** | **D-04: 30 polygons (2 house seats per district, ONE polygon) — NOT 60** |
| place | G4110 | 91 | 91 AZ incorporated municipalities |
| county | G4020 | 15 | 15 AZ counties, no independent cities |

**cd119 loader-key verification:** resolved URL is `https://www2.census.gov/geo/tiger/TIGER2024/CD/tl_2024_04_cd119.zip` — filename contains `cd119` (not bare `cd`), satisfying D-00. (State-scoped `_04_` file, not the `_us_` national file the NV plan text described; loader uses `filterByStatefp=true` for cd119.)

**Confirmed municipality NAMELSAD strings (exact, city/town LSAD correct):**
`Tucson city`, `Oro Valley town`, `Marana town`, `Sahuarita town`, `South Tucson city` — all 5 matched in the TIGER 2024 place shapefile; no LSAD mismatch, no assertion-string mutation needed.

## Pre-existing-row Check Results

**`essentials.geofence_boundaries` WHERE state='04':**
- `G5200 = 9` (9 pre-existing congressional-district geofences). NOT greenfield — analogous to NV 158's 4 stray CD rows. This is the CD layer at exactly expected volume; the loader upsert is `ON CONFLICT (geo_id, mtfcc) DO NOTHING` (idempotent), so Plan 02 will report `already_exists:9` for cd119 and write 0 new G5200 rows. No non-CD stray rows found.

**`essentials.districts` WHERE state IN ('AZ','az'):**
- `AZ | NATIONAL_LOWER | 9`
- `AZ | NATIONAL_UPPER | 1`
- `AZ | STATE_EXEC | 4`
- 14 pre-existing UPPERCASE 'AZ' rows total, exactly matching the plan's expected prior-seed inventory. The `AZ|NATIONAL_LOWER|9` rows are present and uppercase, so Gate 5's uppercase expectation holds via the pre-existing seed (the loader itself writes only lowercase 'az' and its 9 cd119 writes are skipped by the NOT-EXISTS guard). NATIONAL_LOWER is neither absent nor lowercase — no escalation required. county/sldu/sldl are genuinely new and will be written lowercase 'az' by Plan 02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Loader `--dry-run` no longer reaches the pre-flight assertion**
- **Found during:** Task 3 STEP B
- **Issue:** The plan (inherited from NV 158) expects `--dry-run` to stream the shapefiles and fire `MtfccAssertionError` to reveal the sldl/place counts and print "5 PASSED" lines. The current `load-state-tiger-boundaries.ts` `processLayer()` short-circuits in dry-run mode at the "Dry run short-circuit BEFORE any I/O or DB call" return (line 608), which is BEFORE both the `STATE_CITY_ASSERTIONS` gate and every `EXPECTED_*_MTFCC` pre-flight block. So `--dry-run` prints only a dispatch summary and never counts records — it cannot reveal counts or print PASSED lines. (The loader was refactored to make dry-run zero-download after NV was executed.)
- **Fix:** Wrote a temporary read-only count helper (`backend/count-az-tmp.ts`, deleted after use, not committed) that downloads the AZ TIGER 2024 files and counts records using the IDENTICAL filter logic as the pre-flight block (filterByStatefp, place MTFCC===G4110 guard, districtNumField skipDistrictCodes) for all 5 layers. This discovered the counts with NO DB writes and validated all 5 against EXPECTED_AZ_MTFCC (cd119=9, sldu=30, sldl=30, place=91, county=15 → ALL PASS), plus confirmed all 5 city NAMELSAD strings. This proves Plan 02's LIVE pre-flight (which does run, gating before each layer's DB write) will pass with the committed values.
- **Files modified:** none committed (temp helper deleted); the intended sentinel edits to loader + smoke test were applied as planned.
- **Note:** I did NOT modify the shared dry-run behavior — that would alter dry-run for all 12 states (CA/TX/UT/.../NV/DC) and force downloads on every dry-run (Rule 4 architectural scope). The pre-flight assertion logic itself is unchanged and copied verbatim from the NV block.

## Database Safety

Zero database rows written. Only read-only `SELECT` queries (pre-existing-row checks) and read-only HTTPS downloads from census.gov (TIGER shapefiles) were performed.

## Self-Check: PASSED
- Created files exist: `verify-az-tiger-import.sql` FOUND, `smoke-az-geofences.ts` FOUND
- Commits exist (EV-Accounts repo): c1ec0fe4 (Task 1), b0dae6b0 (Task 2), c7423dcb (Task 3) — all FOUND
- Loader verification: `AZ: new Set` ×2, `fipsArg === '04'` ×1, `sldl: 30` with confirmed comment, single `'04': 'az'` FIPS key, NV/VA/MD blocks intact (no regression), TypeScript compiles clean (exit 0 with project esModuleInterop)
