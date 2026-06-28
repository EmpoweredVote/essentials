# 162-01 SUMMARY — City of Las Vegas structural seed

**Status:** ✅ Complete (CLARK-02 structural + surfacing half)
**Date:** 2026-06-28

## What was built

- **6 LV ward geofences** loaded into `essentials.geofence_boundaries` as **X0015** rows (state='nv' lowercase, geo_id `las-vegas-nv-council-ward-1`..`-6`), all `ST_IsValid=true`. Project's FIRST custom non-TIGER ward geofences. Wards 4/5/6 (21–30 rings each, enclaves/holes) auto-repaired via `ST_MakeValid` in the loader.
- **Standalone government** `City of Las Vegas, Nevada, US` (type='City', state='NV' uppercase, geo_id='3240000') — NOT nested under State of Nevada (D-03).
- **Chamber** `Las Vegas City Council` (official_count=7).
- **1 LOCAL_EXEC district** (Mayor, geo_id='3240000', mtfcc='G4110', reusing Phase 158 city geofence) + **6 LOCAL ward districts** (X0015), all state='nv' lowercase.
- **7 politicians + offices**; office_id back-filled for all 7.
- **coverage.js** COVERAGE_STATES gained a Nevada block with Las Vegas (browseGovernmentList ['3240000'], hasContext:true → purple chip). Essentials repo, commit `c089c8f`.

## Wave-0 probe results

| Probe | Result |
|-------|--------|
| P1 ledger MAX | registered MAX **1055**; on-disk consumed through **1074** → **next structural = 1075** |
| P2 external_id −3205001..−3205007 | NONE (unused) ✓ |
| P3 X0015 before loader | 0 (unclaimed) ✓ → 6 after loader |
| P4 LV G4110 | geo_id='3240000' present (geofence state '32'; North Las Vegas 3251800 also matched ILIKE) ✓ |

## ⚠ DEVIATION — migration renumber 1064 → 1075

The on-disk EV-Accounts `backend/migrations/` directory already contained **1064–1074** (LA mayor election, RLS/search-path fixes, CA/other-state governor races, US Senate visibility, 2026 statewide candidates, etc. — work that landed while v18.0 NV was parked during the v19.0 dark-mode milestone). Per the plan's pre-authorized instruction, all phase-162 migration numbers were shifted:

| Plan | Original | Applied/Reserved |
|------|----------|------------------|
| 01 structural | 1064 | **1075** (registered) |
| 02 headshots | 1065 | **1076** (audit-only) |
| 03 Berkley | 1066 | **1077** |
| 03 Knudsen | 1067 | **1078** |
| 03 Kelley | 1068 | **1079** |
| 03 Diaz | 1069 | **1080** |
| 03 Allen-Palenske | 1070 | **1081** |
| 03 Summers-Armstrong | 1071 | **1082** |
| 03 Brune | 1072 | **1083** |

**Next migration after this phase: 1084.**

## Task-5 audit (all pass)

1. Ward geofences: 6 / all_valid=true. 2. 1 gov / chamber official_count=7. 3. 1 LOCAL_EXEC Mayor office. 4. 6 LOCAL ward offices. 5. 7 total council offices (no phantom 8th). 6. office_id back-fill = 7. 7. Linked-district DISTINCT state = `nv` only. 8. Section-split = 0 orphans. 9. Ledger `('1075','las_vegas_city_council')` registered.

## external_id → politician UUID map (for Plans 02 + 03)

| external_id | UUID | Name | Title |
|-------------|------|------|-------|
| -3205001 | `2568b40c-a517-4eaa-b0da-eb946f9b6df9` | Shelley Berkley | Mayor |
| -3205002 | `169596c9-1ece-4a8a-b601-ce87af369a33` | Brian Knudsen | Council Member, Ward 1 |
| -3205003 | `1c488168-519f-4119-bce6-ae848a6d3001` | Kara Kelley | Council Member, Ward 2 |
| -3205004 | `168705cc-2899-4432-b062-cb8583ac99e6` | Olivia Diaz | Council Member, Ward 3 |
| -3205005 | `91544dd2-07c7-4885-943f-f431836ddecf` | Francis Allen-Palenske | Council Member, Ward 4 |
| -3205006 | `6f433371-e691-41ed-9f0e-580626e0cb32` | Shondra Summers-Armstrong | Council Member, Ward 5 |
| -3205007 | `0a0ea0c6-ed7b-4e84-833d-f6a04d3350e9` | Nancy E. Brune | Council Member, Ward 6 |

## Key files

- `C:/EV-Accounts/backend/scripts/load-lv-ward-boundaries.ts` (commit `f850c527`)
- `C:/EV-Accounts/backend/migrations/1075_las_vegas_city_council.sql` (commit `9a7563b5`, applied + registered)
- `C:/Transparent Motivations/essentials/src/lib/coverage.js` (commit `c089c8f`)

## Self-Check: PASSED
