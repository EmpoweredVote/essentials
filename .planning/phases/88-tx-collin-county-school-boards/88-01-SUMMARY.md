---
phase: 88-tx-collin-county-school-boards
plan: "01"
subsystem: db-seed
tags:
  - tx
  - school-boards
  - tiger
  - geofences
  - migration
dependency_graph:
  requires:
    - Phase 83-87 (geofence loader patterns established)
    - OR school boundaries loader (load-or-school-boundaries.ts canonical template)
    - CA school boards migration 257 (canonical SQL template)
  provides:
    - 5 Collin County TX ISD G5420 geofences in essentials.geofence_boundaries
    - 5 ISD governments + 5 chambers + 5 SCHOOL districts + 35 politicians + 35 offices
    - TX resident lookups return school board members alongside city council + state officials
  affects:
    - essentials.geofence_boundaries (5 new G5420 rows)
    - essentials.governments (5 new ISD rows)
    - essentials.chambers (5 new Board of Trustees rows)
    - essentials.districts (5 new SCHOOL district rows)
    - essentials.politicians (35 new board member rows)
    - essentials.offices (35 new office rows)
tech_stack:
  added:
    - load-tx-school-boundaries.ts (Node.js/TypeScript TIGER UNSD loader, parallel to load-or-school-boundaries.ts)
    - migration 261_tx_collin_county_school_boards.sql (SQL seed migration)
  patterns:
    - G5420 geofence loading from TIGER UNSD zip (census.gov)
    - WITH ins_p CTE pattern for atomic politician+office INSERT
    - 3-preflight + 7-gate post-verification migration structure
    - Richardson ISD hybrid seat structure (Districts 1-5 + At-Large Places 6-7)
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/load-tx-school-boundaries.ts
    - C:/EV-Accounts/backend/migrations/261_tx_collin_county_school_boards.sql
  modified: []
decisions:
  - "district_type='SCHOOL' (not 'SCHOOL_DISTRICT') per D-06 — routing key for essentialsService.ts"
  - "districts.state='tx' (lowercase) per D-07 — routing convention; governments.state='TX' uppercase"
  - "Richardson ISD hybrid: Districts 1-5 use 'Board Member, District [N]'; At-Large 6-7 use 'Board Member, Place [N]'"
  - "Full TIGER G5420 polygon for Frisco ISD (Collin+Denton) and Richardson ISD (Collin+Dallas) — no clipping per D-13/D-14"
  - "party=NULL on all 35 politicians — antipartisan design per D-10"
  - "is_appointed=false, is_appointed_position=false — all board members are elected per D-11"
  - "Plano ISD Place 4-7 name-to-place assignments are INFERRED from election records (A1 in assumptions log)"
  - "McKinney ISD Place 4 (Roxane Morrison) is ASSUMED from secondary sources (A2 in assumptions log)"
metrics:
  duration_minutes: 35
  completed_date: "2026-06-03"
  tasks_completed: 4
  tasks_total: 4
  files_created: 2
  files_modified: 0
  db_rows_inserted: 55
---

# Phase 88 Plan 01: TX Collin County School Boards Seed Summary

**One-liner:** G5420 TIGER UNSD geofences for 5 Collin County ISDs + 35 board members seeded via loader script and migration 261, with Richardson ISD hybrid District/Place seat structure correctly applied.

## What Was Built

### Task 1: load-tx-school-boundaries.ts
Written as a direct copy of `load-or-school-boundaries.ts` with 5 constant substitutions:
- `TIGER_URL` → Texas FIPS 48 UNSD zip
- `STATE` → `'48'`
- `SOURCE` → `'tiger_unsd_tx_2024'`
- `EXPECTED_COUNT` → `5`
- `TARGET_GEOIDS` → 5 TX ISDs
- `baseName` / `tmpRoot` → tx variants
- Console labels → `[load-tx-school-boundaries]`

Dry-run confirmed all 5 target GEOIDs found in shapefile.

### Task 2: Loader Run (Live)
Loader executed against production DB. All 5 G5420 rows inserted:
- `4835100` — Plano Independent School District
- `4829850` — McKinney Independent School District
- `4807890` — Allen Independent School District
- `4820010` — Frisco Independent School District
- `4837020` — Richardson Independent School District

### Task 3: Migration 261 Authored
Migration `261_tx_collin_county_school_boards.sql` written following the 7-step structure of migration 257:
- 3 pre-flight DO blocks (government name check, external_id block check, geofence existence check)
- Step 1: 5 government rows (`state='TX'`, `WHERE NOT EXISTS`)
- Step 2: 5 Board of Trustees chambers (NO slug column — GENERATED ALWAYS)
- Step 3: 5 SCHOOL districts (`state='tx'` lowercase, `district_type='SCHOOL'`)
- Step 4: 35 politician+office WITH CTE blocks
- Step 5: office_id back-fill UPDATE
- Step 6: 7-gate post-verification DO block
- Step 7: Migration ledger entry (`VALUES ('261')`)

Richardson ISD hybrid structure correctly applied:
- Districts 1-5 (`-880029..-880033`): `'Board Member, District [N]'`
- At-Large Places 6-7 (`-880034..-880035`): `'Board Member, Place [N]'`

File saved UTF-8 — `é` in `Debbie Rentería` verified via byte check (0xC3 0xA9 present).

### Task 4: Migration 261 Applied + Verified

Migration applied to production DB. All 7 post-verification gates PASS:

| Gate | Expected | Got | Status |
|------|----------|-----|--------|
| (a) 5 government rows | 5 | 5 | PASS |
| (b) 5 Board of Trustees chambers | 5 | 5 | PASS |
| (c) 5 SCHOOL district rows (state='tx') | 5 | 5 | PASS |
| (d) 35 politicians in -880035..-880001 | 35 | 35 | PASS |
| (e) 35 offices linked to SCHOOL districts | 35 | 35 | PASS |
| (f) Section-split = 0 orphan G5420 geofences | 0 | 0 | PASS |
| (g) 0 NULL office_id in -880035..-880001 | 0 | 0 | PASS |

Migration ledger: `supabase_migrations.schema_migrations` version='261' confirmed.

## PostGIS Coordinate Smoke Results

All 5 ISDs route correctly via `ST_Covers` with `mtfcc='G5420'`:

| ISD | Test Coordinate | Routed Name | Status |
|-----|-----------------|-------------|--------|
| Plano ISD | (-96.6989, 33.0198) | Plano Independent School District | PASS |
| McKinney ISD | (-96.6155, 33.1976) | McKinney Independent School District | PASS |
| Allen ISD | (-96.6706, 33.1032) | Allen Independent School District | PASS |
| Frisco ISD | (-96.8236, 33.1501) | Frisco Independent School District | PASS |
| Richardson ISD | (-96.7298, 32.9482) | Richardson Independent School District | PASS |

## Richardson Hybrid Title Spot-Checks

- `-880031` (Debbie Rentería): `'Board Member, District 3'` — PASS
- `-880035` (Chris Poteet): `'Board Member, Place 7'` — PASS

## Frisco ISD Post-May-2026 Roster Confirmation

Open Question 3 from RESEARCH.md resolved: Mark Hill is confirmed on the current friscoisd.org meet-the-board page as Board Secretary, Place 5 (Misty Wamhoff no longer listed). The 7-member roster (Manduva/Sample/Elad elected May 2026 for Places 1/2/3; Davis/Maddox incumbents; Hill Place 5; Salas Place 6) is current.

## Assumption Log Adjustments During Execution

| Assumption | Status | Notes |
|-----------|--------|-------|
| A1: Plano Place 4-7 (Cook/Lantz/Klein/Goodwin) | INFERRED — not confirmed | Names from official page; place numbers from election record cross-reference. Acceptable for Phase 88. |
| A2: McKinney Place 4 = Roxane Morrison | ASSUMED | From secondary sources only. Not confirmed on official page. Acceptable for Phase 88. |
| A6: Allen Place 7 = Bill Parker | MEDIUM confidence | From May 2023 election records. Allen ISD official page not directly confirmed. |
| A7: Frisco Place 5 = Mark Hill | CONFIRMED | Appears on current friscoisd.org meet-the-board page as Board Secretary |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Minor Notes

- The PLAN.md verification check for `SCHOOL_DISTRICT` is a false positive: it flags comment lines that say "NOT 'SCHOOL_DISTRICT'" (same text present in the canonical template migration 257). All actual SQL `district_type` assignments correctly use `'SCHOOL'` — verified separately.

## Known Stubs

None — all 35 politicians have offices linked with correct titles. No empty arrays or placeholder values in the seeded data.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes beyond planned scope.

## Next Steps

- Plan 02 (migration 262): Headshots audit migration for 35 TX ISD board members. SQL-only file documenting headshot sources (Frisco ISD and Richardson ISD photo URLs confirmed; Plano/McKinney/Allen require manual verification of official CMS pages).
- Next migration number: 262

## Self-Check

PASSED — verified before writing this summary:
- `C:/EV-Accounts/backend/scripts/load-tx-school-boundaries.ts` — exists
- `C:/EV-Accounts/backend/migrations/261_tx_collin_county_school_boards.sql` — exists
- All 7 DB gates verified via pg client queries
- 5 PostGIS smoke queries pass
- Richardson title spot-checks pass
- Migration ledger entry confirmed
