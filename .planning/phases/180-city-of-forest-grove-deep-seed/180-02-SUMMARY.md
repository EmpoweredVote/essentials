---
phase: 180-city-of-forest-grove-deep-seed
plan: 02
subsystem: database
tags: [postgres, psql, migration, forest-grove, oregon, washco, structural-seed]

# Dependency graph
requires:
  - phase: 180-city-of-forest-grove-deep-seed (plan 01)
    provides: "Wave-0 verified facts: geo_id 4126200 confirmed, ext_id block -4126201..-4126207 free, migration number 1178, roster re-confirmed 7/7 elected"
provides:
  - "Migration 1178 applied to production: City of Forest Grove government + City Council chamber (official_count=7) + 2 citywide districts (LOCAL_EXEC + LOCAL, state='or') + 7 politicians + 7 offices"
  - "Plain-title convention on all 7 offices ('Mayor' x1 + 'Councilor' x6, no positions, no wards) with representing_city='Forest Grove' inline"
  - "Uniform zero-appointed roster: all 7 is_appointed=false + is_appointed_position=false"
  - "D-14 WR-02 in-file identity gate — NEW template-hardening pattern, first structural migration to carry it"
  - "Minted politician UUIDs by external_id (table below) for plans 03 (headshots) and 04 (stances)"
affects: [180-03, 180-04, 180-05, 181, 182]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WR-02 in-file identity gate: post-verify DO block asserts full_name IN (researched roster) count = 7 on the ext_id block — generalizes the stance-file per-politician identity gate to whole-roster scope; phases 181-182 inherit this"
    - "Hybrid structural shape: Tualatin 1169 district/politician template (directly-elected Mayor + shared at-large LOCAL + zero appointed) overlaid with Tigard 1159 plain title strings"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql (442 lines, separate repo, committed there as 4bb5cc0d)"
  modified: []

key-decisions:
  - "WR-02 identity gate authored as a count-based full_name IN (...) assertion (not per-row UUID checks) since structural migrations mint UUIDs at apply time"
  - "Valenzuela seeded is_appointed=false: her 2020 appointment is superseded by her Nov 2022 election (Tualatin-Pratt treatment class); Council President is title-on-seat, one office row"
  - "Falconer's pre-2022 Milwaukie, OR record excluded from Forest Grove tenure; Peter Truax not seeded (lost 2024 race to Schimmel)"

patterns-established:
  - "WR-02: structural post-verify identity gate (whole-roster name assertion) — first use, template for phases 181-182"

requirements-completed: [WASH-06]

# Metrics
duration: ~20min (including checkpoint round-trip)
completed: 2026-07-03
---

# Phase 180 Plan 02: Forest Grove Structural Migration Summary

**Migration 1178 applied clean to production: Forest Grove government + 7-seat City Council seeded as a Tualatin-shape/Tigard-title hybrid (directly-elected Mayor + 6 at-large plain-'Councilor' seats, zero appointed), with the milestone's first in-file WR-02 identity gate passing at identity_gate=7.**

## Performance

- **Duration:** ~20 min (including orchestrator apply/verify checkpoint round-trip)
- **Started:** 2026-07-03 (wave 2)
- **Completed:** 2026-07-03
- **Tasks:** 2 (1 auto + 1 blocking checkpoint, both complete)
- **Files modified:** 1 (migration file in the separate EV-Accounts repo; nothing in this repo besides this SUMMARY)

## Accomplishments

- Authored `1178_forest_grove_city_council.sql` (442 lines, single BEGIN…COMMIT): pre-flight hard-abort guard, government (geo_id '4126200', state 'OR'), chamber (official_count=7, name_formal='Forest Grove City Council'), 2 districts (LOCAL_EXEC 'Forest Grove (Mayor, Citywide)' + LOCAL 'Forest Grove (At-Large)', both state='or' lowercase, mtfcc NULL), 7 politician+office CTE blocks, office_id back-fill, 7-gate post-verify DO block, ledger INSERT ('1178').
- **D-14 WR-02 identity gate shipped** — the first structural migration in the repo to assert the seated full_names match the researched roster in-transaction (prior migrations 1150/1159/1169 only asserted counts). Catches an ON CONFLICT (external_id) DO UPDATE that silently re-attaches a stale/wrong name on re-run.
- Orchestrator applied the migration live (2026-07-03): in-migration DO block emitted exactly `Post-verification PASSED: Forest Grove gov=1, offices=7, geofence>=1, section-split=0, office_id nulls=0, representing_city=7, identity_gate=7`.
- Independent E2E gate a–i all PASS (recorded below); migration committed in EV-Accounts as `4bb5cc0d`.

## Minted Politician UUIDs (for plans 03 and 04)

| external_id | Name | Seat | politician UUID |
|-------------|------|------|-----------------|
| -4126201 | Malynda Wenzl | Mayor (LOCAL_EXEC) | `749da610-7755-4c36-8f2d-efdacc522b2c` |
| -4126202 | Michael Marshall | Councilor | `acef8291-5eeb-43b9-905d-ac5ede610223` |
| -4126203 | Karen Martinez | Councilor | `cdc010a8-66d5-4cd6-ab5f-ca10f5101e88` |
| -4126204 | Mariana Valenzuela | Councilor (Council President title-on-seat) | `93e6276a-4206-46d1-8e31-a7403e1aae14` |
| -4126205 | Donna Gustafson | Councilor | `47f5c014-2100-45cf-a4c7-da6b6782b6e5` |
| -4126206 | Angel Falconer | Councilor | `8a09c44f-b45f-4ece-9636-4d49b4a09679` |
| -4126207 | Brian Schimmel | Councilor | `01e1da66-778b-4bac-9a41-9c7fa9f3bbc3` |

## E2E Structural Gate Results (orchestrator, live production, 2026-07-03)

| Gate | Result | Detail |
|------|--------|--------|
| a. Government count | PASS (=1) | 'City of Forest Grove, Oregon, US' |
| b. Chamber | PASS | name='City Council', name_formal='Forest Grove City Council', official_count=7 |
| c. Districts | PASS | Exactly 1 LOCAL_EXEC + 1 LOCAL on 4126200, both state='or'; zero ward/X00xx/per-seat rows |
| d. Offices | PASS (=7) | 'Mayor' x1 + 'Councilor' x6; representing_city='Forest Grove' on all 7 |
| e. Section-split scan | PASS (=0) | Canonical GROUP BY/HAVING query, 0 rows |
| f. office_id back-fill | PASS | 7 non-null, 0 null |
| g. Appointed flags | PASS | is_appointed=false x7 + is_appointed_position=false x7; Valenzuela exactly 1 office row |
| h. Geofence presence | PASS (>=1) | geo_id 4126200 + mtfcc G4110 (asserted in-migration and re-confirmed vs Wave-0) |
| i. Identity roll call | PASS | Exact 7 researched names seated; no Peter Truax seated (4 global 'TRUAX%' rows in DB are stale inactive campaign-committee entities from other jurisdictions, zero government linkage — unrelated, untouched) |

## Task Commits

1. **Task 1: Author the Forest Grove structural migration** — no commit in this repo (file lives in the separate `C:/EV-Accounts` repo; committed there by the orchestrator as `4bb5cc0d` "feat(migrations): 1178 Forest Grove city council structural seed", via `git -C`, migration file only)
2. **Task 2: Checkpoint — orchestrator apply + E2E gate + commit** — no commit (verification/apply task; results recorded here)

**Plan metadata:** SUMMARY commit (this file).

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql` — 442-line structural seed: government + chamber + 2 districts + 7 offices + office_id back-fill + 7-gate post-verify DO block (independent geofence assertion + canonical section-split + WR-02 identity gate) + ledger row. Committed in EV-Accounts as `4bb5cc0d`.

## Decisions Made

- WR-02 identity gate implemented as a whole-roster count assertion (`external_id IN (...) AND full_name IN (...)` must equal 7) rather than per-row UUID checks — structural migrations mint UUIDs at apply time, so name-set matching is the correct in-transaction form; the per-politician UUID identity gate remains the stance-file pattern.
- Valenzuela is_appointed=false (2020 appointment superseded by Nov 2022 election; Tualatin-Pratt treatment class); Council President recorded as title-on-seat comment only, single office row, plain 'Councilor' title.
- All Wave-0 locked values used verbatim: geo_id 4126200, ext_ids -4126201..-4126207, migration 1178, state 'or' lowercase on districts.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. (The 4 global 'TRUAX%' rows found during gate i are pre-existing, inactive campaign-committee entities in other jurisdictions with zero government linkage — out of scope, untouched, noted for the record.)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- **Plan 03 (headshots):** politician UUIDs minted and recorded above — start directly at the D-16 fallback chain (city site confirmed photo-less at Wave-0); WR-01 non-zero-exit fix mandatory in the pipeline script; audit migration 1179 uses these UUIDs in Storage paths.
- **Plan 04 (stances):** hardcode the UUIDs above per official; 44-topic live list captured at Wave-0; skip all 8 judicial-* topics; Falconer research must not cite her pre-2022 Milwaukie record as Forest Grove tenure.
- **Plan 05 (surfacing/banner):** representing_city='Forest Grove' live on all 7 offices — CURATED_LOCAL key `'forest grove'` (space) will match; coverage.js entry geo_id 4126200.
- Browse link once surfaced: `essentials.empowered.vote/results?browse_geo_id=4126200&browse_mtfcc=G4110`.

## Self-Check: PASSED

- `C:/EV-Accounts/backend/migrations/1178_forest_grove_city_council.sql` — FOUND on disk (442 lines); committed in EV-Accounts (`4bb5cc0d`)
- All Task 1 acceptance criteria verified by grep before checkpoint (no `slug`/`photo_origin_url` literals in comments; 7 office blocks; plain titles; 2 districts; ledger '1178'; WR-02 gate present)
- All Task 2 acceptance criteria recorded with PASS results above (in-migration NOTICE incl. identity_gate=7; E2E gates a–i)

---
*Phase: 180-city-of-forest-grove-deep-seed*
*Completed: 2026-07-03*
