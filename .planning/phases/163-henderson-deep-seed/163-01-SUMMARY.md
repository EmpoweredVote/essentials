---
phase: 163-henderson-deep-seed
plan: 01
subsystem: database
tags: [postgres, postgis, geofence, arcgis, supabase, coverage, nevada, henderson]

requires:
  - phase: 158-nevada-tiger-geofences
    provides: Henderson G4110 city geofence (geo_id='3231900', state='32')
  - phase: 162-city-of-las-vegas-deep-seed
    provides: LV deep-seed analog (loader 1075, X0015 pattern, coverage.js NV block)
provides:
  - City of Henderson standalone government + Henderson City Council chamber (official_count=5)
  - 4 X0016 ward geofences (henderson-nv-council-ward-1..4, ST_IsValid)
  - 1 LOCAL_EXEC Mayor district + 4 LOCAL ward districts (state='nv')
  - 5 politician+office rows (Romero Mayor + Seebock/Larson/Cox/Stewart wards I-IV)
  - Henderson surfaced in coverage.js Nevada block (hasContext:true)
affects: [163-02-headshots, 163-03-stances]

tech-stack:
  added: []
  patterns:
    - "Henderson ward loader mirrors LV loader; X0016 MTFCC; string WARD attribute"
    - "Standalone city government (NOT nested under State of Nevada geo_id=32)"
    - "Two-district-type city: 1 LOCAL_EXEC (directly-elected Mayor) + N LOCAL wards"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/load-henderson-ward-boundaries.ts
    - C:/EV-Accounts/backend/migrations/1084_henderson_city_council.sql
  modified:
    - C:/Transparent Motivations/essentials/src/lib/coverage.js

key-decisions:
  - "X0016 ward path taken (not D-01b single-city fallback) — all 4 wards sourced clean"
  - "Live ring counts differ from research (Ward 2=19 rings, Ward 3=3) — loader ring-count-agnostic, ST_MakeValid repaired Ward 2"

patterns-established:
  - "Roman-numeral ward titles ('Council Member, Ward I'..'IV') + Arabic geo_id slugs"

requirements-completed: [CLARK-03]

duration: ~25min
completed: 2026-06-28
---

# Phase 163 Plan 01: Henderson Structural Seed Summary

**City of Henderson seeded structurally — standalone government + council (official_count=5) + Mayor (LOCAL_EXEC) + 4 ward-routed LOCAL districts on X0016 polygons, surfaced in coverage.js.**

## Performance
- **Duration:** ~25 min
- **Tasks:** 4 (1 checkpoint + 3 auto)
- **Files modified:** 3 (2 created EV-Accounts, 1 modified essentials)

## Wave-0 BLOCKING Probes (Task 1) — ALL PASSED
- **(a) Migration counter:** on-disk MAX = **1083** → structural # = **1084**. Ledger MAX (integer-filtered) = 1075 (1076–1083 are LV audit-only, unregistered). No drift offset needed.
- **(b) external_id `-3206001..-3206005`:** 0 rows — block free.
- **(c) MTFCC X0016:** absent (claimed: X0001,X0003–X0015,X-MCC-DIST; X0015=LV/6 rows) → **X0016 unclaimed**.
- **(d) Henderson G4110:** `geo_id='3231900', state='32'` confirmed (disambiguated from MD-2437925 & TX-4833212).
- **Roster checkpoint:** operator-approved 2026-06-28 — Mayor Romero + Ward I Seebock / II Larson / III Cox (still seated to Nov 2026) / IV Stewart = 5 seats, matches live source.

## Accomplishments
- 4 X0016 ward geofences loaded, `COUNT=4, bool_and(ST_IsValid)=true`. Ward 2 (19 rings) repaired via ST_MakeValid; Wards 1/3/4 valid on insert.
- Migration 1084 applied; post-verify **PASSED (gov=1, exec=1, local=4, split_orphans=0)**; `UPDATE 5` office_id back-fill; registered in ledger.
- Henderson appended to coverage.js NV block (single block, LV preserved).

## external_id → UUID map (consumed by Plans 02/03)
| ext_id | UUID | Member | Title | district |
|--------|------|--------|-------|----------|
| -3206001 | `494202b1-2cf0-4780-b164-7ae84a1c5185` | Michelle Romero | Mayor | LOCAL_EXEC 3231900 |
| -3206002 | `99d43f01-4b07-471f-bacf-e89d2a1c36b2` | Jim Seebock | Council Member, Ward I | henderson-nv-council-ward-1 |
| -3206003 | `e0d8ef1b-26b6-4e3d-add7-0ff35bc9a486` | Monica Larson | Council Member, Ward II | henderson-nv-council-ward-2 |
| -3206004 | `64f92bb3-0d32-44bf-bbb6-2191060a93f7` | Carrie Cox | Council Member, Ward III | henderson-nv-council-ward-3 |
| -3206005 | `50682ef1-360a-4597-9e1a-eaf43c50673d` | Dan H. Stewart | Council Member, Ward IV | henderson-nv-council-ward-4 |

## Task Commits
1. **Task 2: ward loader** — `214f09d6` (feat) [EV-Accounts]
2. **Task 3: structural migration 1084** — `cc741e26` (feat) [EV-Accounts]
3. **Task 4: coverage.js + this SUMMARY** — essentials commit (feat)
_(Task 1 is an inline checkpoint — no file commit.)_

## Decisions Made
- **X0016 ward path** taken (not D-01b single-city fallback): all 4 wards sourced clean and valid.
- Migration applied via `psql -f` against backend/.env DATABASE_URL (gsd-executor has no DB access; all DB steps inline-orchestrator).

## Deviations from Plan
- **Live ward ring counts differ from research notes.** Research expected Ward III=4 rings (others 1); live data: Ward 1=1, **Ward 2=19**, **Ward 3=3**, Ward 4=1. Loader is ring-count-agnostic (ST_Multi + ST_MakeValid fallback), so no code change — Ward 2 was repaired via ST_MakeValid, all 4 end ST_IsValid. No impact.

## Issues Encountered
- `dotenv/config` loads `.env` from cwd; the loader must run from `C:/EV-Accounts/backend` (where `.env` lives), not the repo root as the plan text suggested. Ran from backend dir — succeeded.
- **Operator surfaced a separate browse bug** at the Wave-0 checkpoint: government-list browse of an unseeded city shows stale prior-location officials under the wrong state banner ("Los Angeles, NV" + CA pols + NV banner). Root-caused (Results.jsx `userState` only FIPS-guards `browse_geo_id`, not `browse_government_list`; plus stale-context not cleared). Decision: fix as a focused follow-up AFTER the Henderson seed. Recorded in memory `project_browse_government_list_state_leak`.

## Next Phase Readiness
- Plan 02 (headshots) ready — UUID map above; cityofhenderson.com is Akamai WAF-403 → per-member fallback sources. Next audit-only migration: **1085**.
- Browse link: essentials.empowered.vote/results?browse_geo_id=3231900&browse_mtfcc=G4110

---
*Phase: 163-henderson-deep-seed*
*Completed: 2026-06-28*
