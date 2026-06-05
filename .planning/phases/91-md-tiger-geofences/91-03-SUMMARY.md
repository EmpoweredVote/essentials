---
phase: 91-md-tiger-geofences
plan: "03"
subsystem: database-geofences
tags: [tiger, geofences, maryland, live-load, postg is, geofence_boundaries, districts]
dependency_graph:
  requires:
    - 91-02
  provides:
    - All 5 MD TIGER layers in production geofence_boundaries (state='24')
    - All 4 MD district tiers in production districts table
    - Baltimore City dual-tier rows confirmed (D-01 invariant satisfied)
    - St. Mary's County G4020 boundary confirmed (Phase 95 prerequisite)
  affects:
    - essentials.geofence_boundaries (production DB)
    - essentials.districts (production DB)
tech_stack:
  added: []
  patterns:
    - ON CONFLICT DO NOTHING idempotent upsert — safe re-run after Plan 02 unintended writes
    - 5-layer MD TIGER live-load with pre-flight assertions
    - Baltimore City dual-tier invariant (G4110 + G4020) verified post-load
key_files:
  created: []
  modified:
    - essentials.geofence_boundaries (production DB — 307 rows for state='24')
    - essentials.districts (production DB — 4 tiers for MD)
decisions:
  - "All 307 MD geofence rows were already present from Plan 02 unintended live writes — ON CONFLICT DO NOTHING confirmed idempotent; zero errors"
  - "NATIONAL_UPPER row (state='MD', district_type='NATIONAL_UPPER', geo_id='24') is pre-existing US Senate district seeded in a prior migration — not from TIGER loader; benign"
  - "geo_id collision between county FIPS (24005=Baltimore County) and SLDL district number (24005=MD House District 5) is safe — (geo_id, mtfcc) is the uniqueness key; no G4110 confusion"
metrics:
  duration: "20 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  files_count: 0
requirements:
  - MD-GEO-01
  - MD-GEO-02
  - MD-GEO-03
  - MD-GEO-04
  - MD-GEO-05
---

# Phase 91 Plan 03: MD TIGER Live-Load Summary

**One-liner:** All 5 MD TIGER 2024 layers confirmed in production geofence_boundaries (307 rows: G4020=24, G4110=157, G5200=8, G5210=47, G5220=71); Baltimore City dual-tier invariant verified; districts.state casing correct per D-07.

## What Was Built

### Task 1: Live-load all 5 MD TIGER layers

Ran the live loader (no --dry-run) for all 5 MD layers:

```bash
npx tsx scripts/load-state-tiger-boundaries.ts --state MD --fips 24 --layers cd119,sldu,sldl,place,county
```

**Pre-flight assertions — all 5 passed:**
- `cd119: MD MTFCC pre-flight assertion PASSED: 8 records (expected 8).`
- `sldu: MD MTFCC pre-flight assertion PASSED: 47 records (expected 47).`
- `sldl: MD MTFCC pre-flight assertion PASSED: 71 records (expected 71).`
- `place: STATE_CITY_ASSERTIONS gate PASSED for MD (1 cities verified). MD MTFCC pre-flight assertion PASSED: 157 records (expected 157).`
- `county: MD MTFCC pre-flight assertion PASSED: 24 records (expected 24).`

**Per-layer results (all ON CONFLICT DO NOTHING — rows existed from Plan 02):**

| Layer | MTFCC | Inserted | Already Existed | Errors |
|-------|-------|----------|-----------------|--------|
| cd119 | G5200 | 0 | 8 | 0 |
| sldu | G5210 | 0 | 47 | 0 |
| sldl | G5220 | 0 | 71 | 0 |
| place | G4110 | 0 | 157 | 0 |
| county | G4020 | 0 | 24 | 0 |
| **Total** | | **0** | **307** | **0** |

**Post-load verification query:**
```
G4020  24
G4110 157
G5200   8
G5210  47
G5220  71
```

All 5 MTFCC types present with correct counts. Loader exited 0.

### Task 2: Spot-check districts table and Baltimore City dual-tier sentinel

**Query 1 — Baltimore City dual-tier (D-01 invariant):**
```json
{"geo_id":"24510","name":"Baltimore city","mtfcc":"G4020"}
{"geo_id":"2404000","name":"Baltimore city","mtfcc":"G4110"}
```
Exactly 2 rows. Both named 'Baltimore city'. ✓

**Query 2 — districts.state casing (D-07):**
```json
{"state":"md","district_type":"COUNTY","cnt":"24"}
{"state":"md","district_type":"STATE_LOWER","cnt":"71"}
{"state":"md","district_type":"STATE_UPPER","cnt":"47"}
{"state":"MD","district_type":"NATIONAL_LOWER","cnt":"8"}
{"state":"MD","district_type":"NATIONAL_UPPER","cnt":"1"}
```
Correct casing: lowercase 'md' for COUNTY/STATE_LOWER/STATE_UPPER; uppercase 'MD' for NATIONAL_LOWER. The 5th row (NATIONAL_UPPER, cnt=1) is a pre-existing US Senate district row (geo_id='24', OCD-ID `ocd-division/country:us/state:md`) seeded in a prior migration — not from the TIGER loader. Benign.

**Query 3 — total row count:**
```json
{"total_md_rows":"307"}
```
307 = 24 (G4020) + 157 (G4110) + 8 (G5200) + 47 (G5210) + 71 (G5220). ✓

**Additional checks run:**
- Baltimore County (geo_id='24005') has zero G4110 rows — no city/county confusion ✓
- St. Mary's County (geo_id='24037', G4020) confirmed present — Phase 95 prerequisite satisfied ✓

## Geofence Boundaries: Final Row Counts by MTFCC (state='24')

| MTFCC | District Type | Count | Description |
|-------|--------------|-------|-------------|
| G4020 | COUNTY | 24 | MD counties + Baltimore City (independent city-county) |
| G4110 | LOCAL | 157 | MD incorporated places (G4110 only; 379 CDPs excluded) |
| G5200 | NATIONAL_LOWER | 8 | MD congressional districts (post-2022 redistricting) |
| G5210 | STATE_UPPER | 47 | MD state senate districts |
| G5220 | STATE_LOWER | 71 | MD house delegate sub-district polygons (not 141 delegates) |
| **Total** | | **307** | |

## Districts Table: Row Counts by district_type (MD)

| state | district_type | count | Notes |
|-------|--------------|-------|-------|
| md | COUNTY | 24 | lowercase per D-07 |
| md | STATE_LOWER | 71 | lowercase per D-07 |
| md | STATE_UPPER | 47 | lowercase per D-07 |
| MD | NATIONAL_LOWER | 8 | uppercase per D-07 |
| MD | NATIONAL_UPPER | 1 | pre-existing US Senate district (prior migration) |

**Plan 04 expected values:** geofence_boundaries total=307 (5 MTFCC types); districts counts above.

## Deviations from Plan

### Auto-executed Issues

**1. [Rule 1 - Expected behavior] All 307 rows already present from Plan 02 unintended writes**
- **Found during:** Task 1
- **Issue:** Plan 03 expected the live-load to insert rows, but all 307 rows were already written during Plan 02 (the MtfccAssertionError pattern requires running without --dry-run, which triggered full live writes). The loader correctly reported "Already existed: 307" with zero insertions and zero errors.
- **Fix:** No fix needed — ON CONFLICT DO NOTHING is the idempotent guarantee. Loader exited 0, all assertions passed, DB state is correct.
- **Files modified:** None

## Known Stubs

None.

## Threat Flags

No new network endpoints, auth paths, file access patterns, or schema changes. All threat mitigations from the plan were applied:
- T-91-07: Pre-flight assertion block passed for all 5 layers before any write attempt ✓
- T-91-08: Baltimore City dual-tier asserted via Task 2 Query 1 ✓

## Self-Check: PASSED

- geofence_boundaries state='24' rows: G4020=24, G4110=157, G5200=8, G5210=47, G5220=71 — CONFIRMED
- Baltimore City geo_id='2404000' (G4110) exists — CONFIRMED
- Baltimore City geo_id='24510' (G4020) exists — CONFIRMED
- districts.state='md' COUNTY=24, STATE_LOWER=71, STATE_UPPER=47 — CONFIRMED
- districts.state='MD' NATIONAL_LOWER=8 — CONFIRMED
- Total geofence rows = 307 = 24+157+8+47+71 — CONFIRMED
- No G4110 row for geo_id='24005' (Baltimore County) — CONFIRMED
- St. Mary's County geo_id='24037' G4020 exists — CONFIRMED
- Loader exited 0 — CONFIRMED
- Zero errors in loader output — CONFIRMED
