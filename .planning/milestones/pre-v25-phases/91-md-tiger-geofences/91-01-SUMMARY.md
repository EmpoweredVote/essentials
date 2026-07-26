---
phase: 91-md-tiger-geofences
plan: "01"
subsystem: backend-scripts
tags: [tiger, geofences, maryland, loader, smoke-test, verification]
dependency_graph:
  requires: []
  provides:
    - MD entries in load-state-tiger-boundaries.ts STATE_LAYER_ALLOWLIST/STATE_CITY_ASSERTIONS/STATE_RUN_MAKEVALID
    - EXPECTED_MD_MTFCC pre-flight assertion block in processLayer()
    - verify-md-tiger-import.sql 7-gate verification script
    - smoke-md-geofences.ts 3-address TypeScript smoke test
  affects:
    - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
tech_stack:
  added: []
  patterns:
    - TIGER loader per-state config block pattern (STATE_LAYER_ALLOWLIST / STATE_CITY_ASSERTIONS / STATE_RUN_MAKEVALID)
    - MtfccAssertionError dry-run sentinel (0 values for TBD counts)
    - Baltimore City dual-tier (G4110 + G4020 both expected for independent city)
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql
    - C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts
  modified:
    - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
decisions:
  - "sldl and place EXPECTED_MD_MTFCC entries set to 0 (not TBD keyword) so dry-run MtfccAssertionError immediately reveals actual counts; Plan 02 updates before live load"
  - "Baltimore City dual-tier: G4110 geo_id=2404000 (incorporated place) AND G4020 geo_id=24510 (independent city-county) both required; smoke test Gate 4 asserts both"
  - "Garrett County rural test coordinate (-79.3, 39.53) per RESEARCH.md; forbiddenMtfcc=['G4110'] enforces no-LOCAL invariant for unincorporated address"
metrics:
  duration: "25 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  files_count: 3
requirements:
  - MD-GEO-01
  - MD-GEO-02
  - MD-GEO-03
  - MD-GEO-04
  - MD-GEO-05
  - MD-GEO-06
---

# Phase 91 Plan 01: MD TIGER Loader Scaffold Summary

**One-liner:** Maryland (FIPS 24) added to generalized TIGER loader with 4 config entries + EXPECTED_MD_MTFCC pre-flight block; verify SQL (7 gates) and smoke test (3 addresses, D-01 dual-tier) created.

## What Was Built

### Task 1: Load-state-tiger-boundaries.ts — 4 additive config edits

Four additions to the generalized TIGER loader registered Maryland (FIPS 24):

1. `STATE_LAYER_ALLOWLIST['MD']`: `new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])` — `cd119` key (not `cd`), no `cousub` per D-05/D-08
2. `STATE_CITY_ASSERTIONS['MD']`: `['Baltimore city']` — sentinel matching TIGER NAMELSAD exactly (lowercase 'city')
3. `STATE_RUN_MAKEVALID['MD']`: `new Set(['cd119', 'sldu', 'sldl', 'place', 'county'])` — all 5 layers get ST_MakeValid (OR/ME pattern)
4. `EXPECTED_MD_MTFCC` block (after OR block, `fipsArg === '24'` guard):
   - `cd119: 8` (confirmed — 8 post-2022 congressional districts)
   - `sldu: 47` (confirmed — 47 MD Senate districts)
   - `sldl: 0` (sentinel — ~71 sub-district polygons expected; Plan 02 updates after dry-run)
   - `place: 0` (sentinel — ~311 G4110 places expected; Plan 02 updates after dry-run)
   - `county: 24` (confirmed — 23 counties + Baltimore City independent city)

**Dry-run verification:** `npx tsx scripts/load-state-tiger-boundaries.ts --state MD --fips 24 --layers cd119 --dry-run` completed without "not in allowlist" error, confirming all allowlist entries are wired correctly.

### Task 2: verify-md-tiger-import.sql and smoke-md-geofences.ts

**verify-md-tiger-import.sql** — 7-gate verification script adapted from verify-or-tiger-import.sql:
- Gates 1–2: Invalid geometry and GeometryCollection checks (state='24')
- Gate 3: Per-layer row counts (G4020|24, G4110|DRY-RUN, G5200|8, G5210|47, G5220|DRY-RUN)
- Gate 4: Baltimore City dual-tier sentinel — `geo_id IN ('2404000', '24510')`, expects 2 rows (G4020 + G4110)
- Gate 5: districts table state casing check (`state IN ('MD', 'md')`)
- Gate 6: St. Mary's County sentinel — `name LIKE '%Mary%'`, expects geo_id='24037' (Phase 95 prerequisite)
- Gate 7: Section-split check — districts WHERE state IN ('MD', 'md') lacking geofence coverage; expects 0 rows

**smoke-md-geofences.ts** — 3-address TypeScript smoke test adapted from smoke-or-geofences.ts:
- Address 1 (Baltimore City Hall, -76.6107, 39.2908): asserts G4020+G4110+G5200+G5210+G5220; D-01 invariant — both `G4110='2404000'` AND `G4020='24510'` must be present
- Address 2 (Rural Garrett County, -79.3, 39.53): asserts G4020+G5200+G5210+G5220; `forbiddenMtfcc=['G4110']` enforces unincorporated routing
- Address 3 (Leonardtown, -76.6358, 38.2912): asserts G4020+G4110+G5200+G5210+G5220 (St. Mary's County Phase 95 dependency)
- expectedCounts for SC3: G4020=24, G4110=0 (sentinel), G5200=8, G5210=47, G5220=0 (sentinel); Plan 02 updates G4110/G5220 after dry-run
- TypeScript compilation: `npx tsc --noEmit --skipLibCheck scripts/smoke-md-geofences.ts` — no errors

## Deviations from Plan

None - plan executed exactly as written.

The RESEARCH.md and PATTERNS.md specified `TBD` as comment text within values, but PLAN.md correctly specified using `0` as the actual TypeScript numeric value (with `// TBD` as a comment). Used 0 per PLAN.md instruction to avoid TypeScript compile error and to make the assertion fire immediately on dry-run. This matches the plan's explicit guidance: "The sldl and place values are intentionally set to 0 (not TBD keyword which would cause a TypeScript compile error)."

## Known Stubs

- `EXPECTED_MD_MTFCC.sldl = 0` and `EXPECTED_MD_MTFCC.place = 0` in load-state-tiger-boundaries.ts (line ~863–864) — intentional sentinels; Plan 02 updates after dry-run reveals actual TIGER counts
- `expectedCounts.G4110 = 0` and `expectedCounts.G5220 = 0` in smoke-md-geofences.ts (lines ~105–111) — intentional sentinels matching loader; Plan 02 updates both

These stubs are required by D-04/D-09 design decisions: dry-run must confirm actual TIGER file polygon counts before any live write.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes introduced. All changes are read-only scripts (SQL queries SELECT only; smoke test reads from DB). T-91-03 (sldl/place=0 sentinels) is the only threat disposition for this plan — mitigated by MtfccAssertionError design.

## Self-Check: PASSED

- `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` — FOUND (modified)
- `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql` — FOUND (created)
- `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts` — FOUND (created)
- Task 1 commit: 9bbdebb (feat(91-01): add MD to TIGER loader)
- Task 2 commit: d36d38f (feat(91-01): create verify and smoke scripts)
- Dry-run verification: no "not in allowlist" error for MD --layers cd119
- TypeScript compile: no errors for smoke-md-geofences.ts
