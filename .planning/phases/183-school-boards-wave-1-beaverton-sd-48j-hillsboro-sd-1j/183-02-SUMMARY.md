---
phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j
plan: 02
subsystem: database
tags: [postgres, supabase, school-boards, oregon, structural-migration]

# Dependency graph
requires:
  - phase: 174-west-metro-school-district-geofences
    provides: "G5420 geofences geo_id 4101920 (Beaverton SD 48J) and geo_id 4100023 (Hillsboro SD 1J)"
  - phase: 183-01
    provides: "Wave-0 confirmed geo_ids, ext_id blocks, migration number 1203, lowercase 'or' casing, both 7-director rosters with Zone/Position seats + Chair/Vice-Chair title-on-seat, verbatim chamber/office-title strings"
provides:
  - "Migration 1203 (STRUCTURAL, registered): 2 governments (Beaverton School District 48J / Hillsboro School District 1J), 2 verbatim-named chambers ('School Board' / 'Board of Directors', official_count=7 each), 2 single-shared SCHOOL districts on existing Phase-174 G5420 geofences, 14 director politician+office rows"
  - "14 external_id -> politician UUID map for plan 03's headshot migration (recorded below)"
  - "Post-verify + independent SQL gates confirming 7/7 office counts, lowercase 'or' casing, verbatim chamber names, 0 section-split orphans"
  - "Address-routing smoke test (smoke-or-westmetro-school.ts) reconfirmed for both geo_ids post-seed"
affects: [183-03, 183-04, 184-school-boards-wave-2]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single-shared-SCHOOL-district-per-government pattern (1107 CCSD analog) applied to two whole-district-at-large boards in one structural migration file"
    - "Ledger INSERT (version)-only placed INSIDE the transaction before COMMIT, per the 1159/1178/1196 convention — not the plan's literal 1107-era 'after COMMIT' text"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql (685 lines, separate repo)"
  modified: []

key-decisions:
  - "Ledger registration convention: INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('1203') placed inside the transaction immediately before COMMIT, matching the proven 1159/1178/1196 precedent rather than the plan action text's literal 1107-era 'INSERT after COMMIT' instruction. This is a deliberate deviation from the plan's literal wording, documented here per the executor's own note."
  - "office_id back-fill UPDATE included for both ext_id ranges because 1196 (freshest structural migration) still writes it"

patterns-established:
  - "Dual-district single-file structural migration shape (2 govs + 2 chambers + 2 shared districts + 14 CTEs + dual-gate post-verify) reusable for phase 184 (Tigard-Tualatin SD 23J + Forest Grove SD 15 + Sherwood SD 88J)"

requirements-completed: [WSCH-01, WSCH-02]

# Metrics
duration: 25min
completed: 2026-07-04
---

# Phase 183 Plan 02: Structural Migration 1203 Summary

**Migration 1203 applied to production: 2 school-district governments, 2 verbatim-named chambers (School Board / Board of Directors), 2 single-shared SCHOOL districts on existing Phase-174 geofences, and 14 director politician/office rows — all gates PASS**

## Performance

- **Duration:** 25 min
- **Started:** 2026-07-04T15:35:00Z
- **Completed:** 2026-07-04T16:00:00Z
- **Tasks:** 2 (1 auto + 1 checkpoint:human-verify)
- **Files modified:** 1

## Accomplishments
- Authored the single structural migration 1203 seeding both Beaverton SD 48J and Hillsboro SD 1J end-to-end (governments, chambers, districts, 14 director offices/politicians)
- Orchestrator applied 1203 to production; in-migration post-verify DO block passed on first run (no rollback)
- All independent SQL gates confirmed: 7/7 office counts, lowercase `'or'` casing, verbatim chamber names (not the 254_or blanket "Board of Education"), 0 section-split orphans
- Address-routing smoke test reconfirmed both geo_ids route correctly post-seed
- Recorded the full 14-member external_id -> politician UUID map for plan 03's headshot migration

## Task Commits

Each task was committed atomically:

1. **Task 1: Author structural migration 1203 for both school-district boards** - `2a38f9a9` (feat, repo `C:/EV-Accounts`, branch `master`) — `backend/migrations/1203_or_westmetro_school_boards_wave1.sql` (685 lines)
2. **Task 2: Orchestrator applies 1203, confirms post-verify + SQL gates + address routing** - checkpoint:human-verify, resolved "approved" with full recorded results (no code commit; DB write happened via psql, not via a git-tracked change in this repo)

**Plan metadata:** (this commit) `docs(183-02): complete structural migration plan`

## Migration 1203 Apply Results (recorded from orchestrator verification, 2026-07-04)

### A. Apply run

`psql "$DATABASE_URL" -f C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` ran clean, ending with:

```
NOTICE: Post-verification PASSED: BSD gov=1/off=7, HSD gov=1/off=7, split_orphans=0, office_id_nulls=0
INSERT 0 1
COMMIT
```

No RAISE EXCEPTION — the transaction committed. Ledger gate: `SELECT version FROM supabase_migrations.schema_migrations WHERE version='1203'` returns 1 row.

### B. Independent SQL gates (all PASS)

| Gate | Result | Status |
|------|--------|--------|
| Beaverton office count | 7 offices JOIN districts WHERE geo_id='4101920' AND district_type='SCHOOL' AND state='or' | PASS |
| Hillsboro office count | 7 offices JOIN districts WHERE geo_id='4100023' AND district_type='SCHOOL' AND state='or' | PASS |
| Casing | `SELECT DISTINCT state FROM districts WHERE geo_id IN ('4101920','4100023') AND district_type='SCHOOL'` -> only `'or'` | PASS |
| Chamber names | 'School Board' + 'Board of Directors' (NOT 'Board of Education') | PASS |
| Section-split orphans | 0 (post-verify + independent join, both G5420 geo_ids) | PASS |
| Single-shared-district | Each board = exactly 1 shared SCHOOL district | PASS |
| office_id nulls | 0 | PASS |

### C. Address-routing smoke test

`cd C:/EV-Accounts/backend && npx tsx scripts/smoke-or-westmetro-school.ts` -> ALL ASSERTIONS PASSED: SC1 (Beaverton City Hall -> 4101920), SC2 (Hillsboro City Hall -> 4100023), SC3-SC6 also pass. No routing regression from the new offices.

### D. External_id -> politician UUID map (LOCKED for plan 03's headshot migration)

**Beaverton SD 48J — School Board:**

| Ext ID | UUID | Director | Seat |
|--------|------|----------|------|
| -4101921 | `152ef0c5-5eef-4edb-9704-065c1fb398fc` | Van Truong | Zone 1 |
| -4101922 | `6a6c94b1-4c69-4c85-b270-0004fcfe47ee` | Karen Pérez | Zone 2 |
| -4101923 | `60f85f8b-cade-443f-96a2-f818b29f034f` | Melissa Potter | Zone 3 (Vice Chair) |
| -4101924 | `ae9e41ea-2220-4b0c-a9dc-c4ee498f8c65` | Sunita Garg | Zone 4 |
| -4101925 | `f473703c-14ac-4279-8a6f-674b5a994ebb` | Syed Qasim | Zone 5 |
| -4101926 | `66d83b18-fba9-4a4e-82aa-fd23db5964e5` | Justice Rajee | Zone 6 (Chair) |
| -4101927 | `b77caa26-b55a-4d98-a74c-cb210542b16e` | Tammy Carpenter | Zone 7 |

**Hillsboro SD 1J — Board of Directors:**

| Ext ID | UUID | Director | Seat |
|--------|------|----------|------|
| -4100024 | `84569649-054b-4e50-89c7-9ec858d83fd6` | Yessica Hardin Mercado | Position 1 |
| -4100025 | `dffd7327-21fc-4934-8e93-c1814964097d` | Mark Watson | Position 2 |
| -4100026 | `e9c1abfe-d70f-4f92-81df-cbb22a6f859a` | Nancy Thomas | Position 3 |
| -4100027 | `35cd5b91-858e-4da2-b31e-e05a9f27ac73` | See Eun Kim | Position 4 (Vice Chair) |
| -4100028 | `1da5bc5c-a083-44b1-b9e2-6053814b2dab` | Ivette Pantoja | Position 5 (Chair) |
| -4100029 | `32e4adbb-4faf-4c25-bb90-6ceb521e4401` | Katie Rhyne | Position 6 |
| -4100030 | `553ad874-7ebe-43e0-aab9-2ee3434a6956` | Patrick Maguire | Position 7 |

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql` - Structural migration: 2 governments + 2 verbatim chambers + 2 single-shared SCHOOL districts + 14 director politician/office CTEs + dual-gate post-verify DO block + ledger registration

## Decisions Made
- Ledger INSERT `(version)`-only placed inside the transaction immediately before COMMIT, matching the 1159/1178/1196 convention rather than the plan action text's literal 1107-era "register after COMMIT" instruction. This is a deliberate, documented deviation — functionally equivalent (both approaches register the ledger row atomically with the migration in current practice) and consistent with every recent structural migration in this codebase.
- office_id back-fill UPDATE included for both ext_id ranges since 1196 (freshest structural migration checked per the plan's read_first) still writes it

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking/Convention] Ledger INSERT placement moved inside transaction, before COMMIT**
- **Found during:** Task 1 (authoring migration 1203)
- **Issue:** The plan's action text specified registering the ledger row via `INSERT INTO supabase_migrations.schema_migrations ... ON CONFLICT (version) DO NOTHING` AFTER `COMMIT;`, following 1107's literal era-specific pattern. The freshest structural migrations (1159, 1178, 1196) instead place the ledger INSERT inside the transaction, immediately before COMMIT, so that ledger registration and the structural writes succeed or fail atomically together.
- **Fix:** Placed the ledger `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('1203') ON CONFLICT (version) DO NOTHING;` inside the transaction, immediately before `COMMIT;`, matching the 1159/1178/1196 convention rather than the plan's literal 1107-era text.
- **Files modified:** `C:/EV-Accounts/backend/migrations/1203_or_westmetro_school_boards_wave1.sql`
- **Verification:** Apply run confirmed the ledger row registered (`SELECT version FROM supabase_migrations.schema_migrations WHERE version='1203'` returns 1 row) and the migration committed cleanly with no exception.
- **Committed in:** `2a38f9a9` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking/convention alignment)
**Impact on plan:** Aligns with the codebase's current, proven ledger-registration convention. No scope creep; migration still satisfies every plan acceptance criterion (BEGIN...COMMIT wrapping, WHERE NOT EXISTS guards, verbatim naming, casing, 14 offices, post-verify DO block, ledger registration).

## Issues Encountered

None. The migration applied cleanly on the first attempt — no rollback, no exception, all post-verify and independent gates passed without remediation.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan 03 (headshot migration 1204) may proceed using:
- The full external_id -> politician UUID map recorded above (14 rows)
- Beaverton headshot sources: all 7 genuine originals are already >=600x750-equivalent (per 183-01 Wave-0 findings) — direct crop->600x750 Lanczos, no upscale needed
- Hillsboro headshot sources: use the genuine small originals (256x320 / 320x400 / 172x215) + Lanczos upscale to 600x750, NOT the CDN's interpolated `t_image_size_6` rendition (per 183-01 finding)
- Next migration number: 1204 (audit-only, headshots)

No blockers.

---
*Phase: 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j*
*Completed: 2026-07-04*
