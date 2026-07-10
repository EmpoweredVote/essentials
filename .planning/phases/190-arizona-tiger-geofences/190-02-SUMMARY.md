---
phase: 190-arizona-tiger-geofences
plan: 02
subsystem: geofence-loader
tags: [tiger, geofences, arizona, live-load, production-write, section-split]
requires:
  - 190-01
provides:
  - essentials.geofence_boundaries state='04' rows for all 5 MTFCC types (G4020/15, G4110/91, G5200/9, G5210/30, G5220/30)
  - essentials.districts AZ rows (az|COUNTY|15, az|STATE_UPPER|30, az|STATE_LOWER|30; AZ|NATIONAL_LOWER|9 pre-existing)
  - AZ addresses fully routable end-to-end (Catalina Foothills unincorporated invariant verified)
affects:
  - Phase 191 (Arizona State & Federal Government)
  - Phases 192-199 (legislature, Pima County + Tucson-metro deep-seeds, elections) — all depend on these geofence/district rows
tech-stack:
  added: []
  patterns: [NV/VA/MD 5-layer TIGER live-load, ON CONFLICT DO NOTHING idempotent upsert, OR-direction section-split gate]
key-files:
  created:
    - .planning/phases/190-arizona-tiger-geofences/190-02-SUMMARY.md
  modified: []
decisions:
  - "SLDL loaded as EXACTLY 30 G5220 polygons (D-04 — 2 house seats per district, one polygon; NOT 60) — confirmed by both loader summary and Gate 3 SQL"
  - "cd119 wrote 0 new district rows — all 9 AZ|NATIONAL_LOWER geo_ids pre-existed uppercase from a prior seed; NOT-EXISTS guard skipped them (Gate 5 uppercase rows come from that seed)"
  - "No source files modified and no smoke coordinate refinement needed — zero code commits in EV-Accounts; the loader script IS the data-write mechanism (on-disk migration counter NOT advanced)"
metrics:
  tasks_completed: 3
  files_created: 1
  files_modified: 0
  db_rows_written: 241
  duration_minutes: 10
  completed_date: 2026-07-08
---

# Phase 190 Plan 02: Arizona TIGER Geofences Live Load Summary

Live-loaded all 5 AZ TIGER layers (FIPS 04) into production essentials.geofence_boundaries
and essentials.districts, then verified via 7 SQL gates and a 6-address smoke test. Arizona
is now geographically routable end-to-end — the headline correctness check (Catalina Foothills
resolves to Pima County with NO city) passes, section-split is clean, and SLDL is exactly 30
polygons per D-04. This was the single live data write of Phase 190.

## What Was Done

### Task 1 — Live load of all 5 AZ TIGER layers (data write, no commit)
Ran `npx tsx scripts/load-state-tiger-boundaries.ts --state AZ --fips 04 --layers cd119,sldu,sldl,place,county`
from `C:/EV-Accounts/backend`. State+FIPS banner read **AZ (FIPS 04)** before any write. Every
per-layer pre-flight assertion PASSED against the actual shapefile parse, and the place-layer
STATE_CITY_ASSERTIONS gate PASSED for all 5 AZ municipalities.

| Layer | MTFCC | Boundaries inserted | Districts inserted | Already existed |
|-------|-------|---------------------|--------------------|-----------------|
| cd119 | G5200 | 0 | 0 | 9 (pre-existing seed) |
| sldu  | G5210 | 30 | 30 (az\|STATE_UPPER) | 0 |
| sldl  | G5220 | **30** (D-04, NOT 60) | 30 (az\|STATE_LOWER) | 0 |
| place | G4110 | 91 | 0 (place writes no district rows) | 0 |
| county| G4020 | 15 | 15 (az\|COUNTY, incl. Pima 04019) | 0 |

Grand total: 166 boundary rows + 75 district rows written; 9 already existed; 0 errors.

### Task 2 — Verification gates (read-only)
Ran all 7 gates inline via the pg client (backend is an ESM package, so a temp `.cts`
CommonJS helper was used and deleted; not committed). All gates green:

- **Gate 1** invalid geometry: **0**
- **Gate 2** GeometryCollection: **0**
- **Gate 3** per-layer counts: **G4020=15, G4110=91, G5200=9, G5210=30, G5220=30**
- **Gate 4 (HEADLINE)** Catalina Foothills probe (-110.9210, 32.3130): returns G4020 `04019` Pima County + G5200 `0406` CD6 + G5210 `04018` SD18 + G5220 `04018` HD18; **G4110_present=false, G4040_present=false** — unincorporated invariant holds
- **Gate 5** districts casing: `az|COUNTY|15`, `az|STATE_LOWER|30`, `az|STATE_UPPER|30`, `AZ|NATIONAL_LOWER|9` (plus pre-existing `AZ|NATIONAL_UPPER|1`, `AZ|STATE_EXEC|4` — not defects)
- **Gate 6** Pima County sentinel: exactly **1** row (`04019` Pima County G4020)
- **Gate 7** section-split OR-direction: **0 rows** (success criterion #5 — every G5200/G5210/G5220/G4020 geofence has a matching districts row)

### Task 3 — Smoke test (read-only)
`npx tsx scripts/smoke-az-geofences.ts` — **exit code 0, ALL ASSERTIONS PASSED**:
- Catalina Foothills (Address 1): G4020 (Pima `04019`) + G5200/G5210/G5220, NO G4110/G4040 — headline check
- Tucson (`0477000`), Oro Valley (`0451600`), Marana (`0444270`), Sahuarita (`0462140`), South Tucson (`0468850`) each return all 5 tiers; South Tucson correctly resolves to `South Tucson city`, not `Tucson city`
- SC1/SC2/SC3/SC4 all PASS

## Recorded Results (per output spec)

- **Final row counts (geofence_boundaries state='04'):** G4020=15, G4110=91, G5200=9, G5210=30, **G5220=30 (D-04)**
- **Catalina Foothills:** unincorporated — Pima County tiers only, NO G4110/G4040 (confirmed by Gate 4 and smoke Address 1)
- **Districts casing:** lowercase `az` for COUNTY/STATE_UPPER/STATE_LOWER (this load); uppercase `AZ` for NATIONAL_LOWER (pre-existing seed)
- **Gate 7 (section-split):** 0 rows — clean
- **Smoke test exit code:** 0

## Deviations from Plan

**1. [Rule 3 - Blocking] ESM package broke the inline verify helper**
- **Found during:** Task 2
- **Issue:** `C:/EV-Accounts/backend` `package.json` sets `"type": "module"`, so a `.ts` temp helper loaded as ESM and `require()` was undefined; the multi-line `npx tsx -e` form also produced empty output under the shell.
- **Fix:** Ran the 7 gates from a temporary `.cts` (CommonJS) helper inside the backend dir so `node_modules` (pg, dotenv) resolved. Helper deleted after use; not committed.
- **Files modified:** none committed.

No other deviations — the live load ran exactly as planned. No MtfccAssertionError, no STATE_CITY_ASSERTIONS failure, no D-04 violation, no non-`already_exists` errors, loader exited 0.

## Database Safety

241 rows written to production essentials (166 geofence_boundaries + 75 districts), all via
`ON CONFLICT DO NOTHING` idempotent upserts guarded by a passing pre-flight assertion. No
officials/government data touched (Phases 191+ own that). No source files modified; on-disk
migration counter NOT advanced (loader is the TIGER-geofence write mechanism per NV/VA/MD/OR precedent).

## Next Phase

Phase 191 — Arizona State & Federal Government (Hobbs + constitutional officers + 2 US Senators
+ 9 US House). All of 191-199 are now unblocked on the geofence/district foundation.

## Self-Check: PASSED
- SUMMARY.md created at `.planning/phases/190-arizona-tiger-geofences/190-02-SUMMARY.md` — FOUND
- geofence_boundaries state='04' counts verified live: G4020=15, G4110=91, G5200=9, G5210=30, G5220=30 — FOUND
- No STATE.md / ROADMAP.md modifications made (orchestrator owns those writes)
- No EV-Accounts code commits (data-write-only plan, no coordinate refinement needed) — as planned
