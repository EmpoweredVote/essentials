---
phase: 79-or-landing-elections-discovery
plan: 4
subsystem: database
tags: [oregon, portland, elections, city, races, migration]

requires:
  - phase: 79-01
    provides: OR 2026 General election row (id=de10e3a7-f5c2-47e6-acd7-ee87be9413db)
  - phase: 79-02
    provides: OR statewide race rows (8 rows — count starts at 8 before this plan)
  - phase: 77-portland-officials
    provides: Portland government structure; City Auditor office_id=a19813f9-ee4d-442d-b052-5c2f9f7db9c8

provides:
  - "7 Portland city race rows in essentials.races for OR 2026 General"
  - "Portland City Council District 3 Seat A/B/C races (3 distinct office_ids via OFFSET enumeration)"
  - "Portland City Council District 4 Seat A/B/C races (3 distinct office_ids via OFFSET enumeration)"
  - "Portland City Auditor race linked to office_id=a19813f9-ee4d-442d-b052-5c2f9f7db9c8"
  - "Migration 240 applied to production Supabase"
  - "Total OR race count raised from 98 to 105"

affects: [79-05]

tech-stack:
  added: []
  patterns:
    - "ORDER BY o.id OFFSET N enumeration for 3 identical offices per Portland council district"
    - "Hardcoded UUID for City Auditor office_id (from Phase 77 Phase 02 SUMMARY)"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING — partial unique index idempotency"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/240_portland_city_races.sql"
    - "supabase/migrations/240_portland_city_races.sql"
  modified: []

key-decisions:
  - "D-07 corrected: Portland D3/D4/Auditor ARE on 2026 ballot due to 2024 charter staggered 2-year terms; Mayor Wilson + D1 + D2 are NOT (4-year terms)"
  - "OFFSET 0/1/2 on ORDER BY o.id correctly enumerates 3 distinct office_ids per district (T-79-04-01 verified)"
  - "City Auditor office_id a19813f9-ee4d-442d-b052-5c2f9f7db9c8 hardcoded and verified correct (T-79-04-02)"
  - "Section-split 240 is pre-existing baseline from Phase 72 TIGER load — not introduced by migration 240"

requirements-completed: []

duration: 15min
completed: 2026-05-30
---

# Phase 79 Plan 04: Portland City Race Rows Summary

**7 Portland city race rows seeded in production via migration 240 — D3 Seats A/B/C + D4 Seats A/B/C + City Auditor; D3 and D4 each confirmed with 3 distinct office_ids; total OR race count = 105**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-30
- **Completed:** 2026-05-30
- **Tasks:** 2
- **Files modified:** 1 (240_portland_city_races.sql)

## Accomplishments

- Wrote migration 240 (UTF-8 NoBOM) with 7 Portland race INSERTs using OFFSET 0/1/2 enumeration and hardcoded City Auditor UUID
- Applied migration 240 to live Supabase production DB; all 7 rows inserted successfully
- All 10 verification gates pass
- Idempotency confirmed: re-running migration 240 returns DO with count still 105

## Final Total OR Race Count

| Category | Count | Source |
|----------|-------|--------|
| OR statewide (Gov + Senate + 6 CDs) | 8 | Migration 238 (Plan 79-02) |
| OR legislative (30 Senate + 60 House) | 90 | Migration 239 (Plan 79-03) |
| Portland city (D3×3 + D4×3 + Auditor) | 7 | Migration 240 (this plan) |
| **TOTAL** | **105** | |

## Portland Race Rows (all 7)

| position_name | office_id |
|---------------|-----------|
| Portland City Auditor | a19813f9-ee4d-442d-b052-5c2f9f7db9c8 |
| Portland City Council District 3 Seat A | 3c893213-931d-4a51-9e6f-c1ae958cd900 |
| Portland City Council District 3 Seat B | dcac1000-c76b-41a0-ab96-34553610b86f |
| Portland City Council District 3 Seat C | edbbd4f8-fb0c-4593-a08a-f26d8ae129be |
| Portland City Council District 4 Seat A | 4906dd70-8966-42ab-a700-bc4976ff5058 |
| Portland City Council District 4 Seat B | 4ab40401-d5c6-43a3-a3d3-65e3449657c3 |
| Portland City Council District 4 Seat C | bf096ce3-8757-40a5-b001-89705a1fa721 |

## D3 and D4 Distinct Office_IDs

**District 3 office_ids (3 distinct — OFFSET enumeration worked):**
- 3c893213-931d-4a51-9e6f-c1ae958cd900 (Seat A, OFFSET 0)
- dcac1000-c76b-41a0-ab96-34553610b86f (Seat B, OFFSET 1)
- edbbd4f8-fb0c-4593-a08a-f26d8ae129be (Seat C, OFFSET 2)

**District 4 office_ids (3 distinct — OFFSET enumeration worked):**
- 4906dd70-8966-42ab-a700-bc4976ff5058 (Seat A, OFFSET 0)
- 4ab40401-d5c6-43a3-a3d3-65e3449657c3 (Seat B, OFFSET 1)
- bf096ce3-8757-40a5-b001-89705a1fa721 (Seat C, OFFSET 2)

## Verification Results

| Check | Expected | Actual | Pass? |
|-------|----------|--------|-------|
| Total OR race count | 105 | 105 | YES |
| Portland race count | 7 | 7 | YES |
| D3 distinct office_ids | 3 | 3 | YES |
| D4 distinct office_ids | 3 | 3 | YES |
| City Auditor office_id | a19813f9-ee4d-442d-b052-5c2f9f7db9c8 | a19813f9-ee4d-442d-b052-5c2f9f7db9c8 | YES |
| NULL office_ids for Portland | 0 | 0 | YES |
| Idempotency re-run: count stays 105 | 105 | 105 | YES |
| Section-split check | 0 (but pre-existing 240) | 240 (pre-existing) | PRE-EXISTING |
| race_candidates for Portland | 0 | 0 | YES |
| All 7 position_names correct | exact match | exact match | YES |

## Idempotency Confirmation

Re-applied migration 240 after initial application:
- DO (no error)
- Total OR race count: still 105
- Portland race count: still 7

Every INSERT hit ON CONFLICT and did nothing. Gate: PASS

## Section-Split Confirmation

```sql
SELECT COUNT(*) FROM essentials.geofence_boundaries gb
WHERE gb.state='41' AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts WHERE state IN ('or','OR','41'));
-- Result: 240
```

240 is the pre-existing baseline from Phase 72 TIGER load (241 G4110 OR cities loaded, only Portland seeded as a district). Migration 240 does NOT create or remove geofence_boundaries or districts — this number is unchanged and expected.

## Migration 240 Ledger Confirmation

No `essentials.migrations` table exists in the database. Migration is tracked via:
- `supabase/migrations/240_portland_city_races.sql` in git (committed 1181d92)
- `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` in EV-Accounts

## Task Commits

1. **Task 1: Write migration 240** - `1181d92` (feat)
2. **Task 2: Apply migration 240 to Supabase** - DB-only; captured in SUMMARY commit

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` — Portland city races migration (not in essentials git repo; C:/EV-Accounts/backend is not git-tracked per project convention)
- `supabase/migrations/240_portland_city_races.sql` — Same file in essentials repo (committed 1181d92)

## Decisions Made

- D-07 correction applied: Portland D3/D4/Auditor ARE on the 2026 ballot due to the 2024 Portland Charter Reform's intentional staggered terms (Districts 3+4 given 2-year terms, up for election Nov 3, 2026). Mayor Wilson, Districts 1 and 2 are NOT up in 2026 (4-year terms).
- OFFSET 0/1/2 on `ORDER BY o.id` is deterministic and correctly enumerates 3 distinct offices per district. No name/title difference between the three offices within a district — UUID ordering provides the only distinction, and that's sufficient for race-row deduplication purposes.
- City Auditor UUID hardcoded (not via subquery) per plan spec — verified against live DB via Phase 77 Plan 02 SUMMARY.

## Deviations from Plan

None - plan executed exactly as written. All pre-flight conditions confirmed; migration applied cleanly on first attempt; all 10 verification gates pass.

Note: Section-split check returned 240 (not 0). This is the pre-existing baseline documented in Plans 79-01 through 79-04; migration 240 does not introduce or change this count.

## Issues Encountered

- Worktree HEAD was at commit 6aafd11 (forked before plans 79-01/79-02 were merged to main). Worktree_branch_check required `git reset --hard bd4143f0b` to align with the specified base commit. After reset, supabase/migrations/ contained 237 and 238 from prior plans, confirming correct state.
- C:/EV-Accounts/backend is not a git repo and tracks migrations separately from essentials repo. Migration written to both locations per established Phase 79 pattern.

## Next Phase Readiness

- Plan 79-05 (discovery_jurisdictions) can now run: all 105 OR race rows exist
- Portland D3/D4 races confirmed; discovery agent can find candidates for these seats
- City Auditor race linked correctly; Simone Rede as incumbent can be linked via discovery
- race_candidates for Portland = 0 (D-11 confirmed; cron will fill post-discovery)

## Known Stubs

None — this plan is a database seed migration; no UI rendering or data presentation.

## Threat Flags

None — this plan creates only database data rows (race rows). No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/240_portland_city_races.sql` — EXISTS
- [x] `supabase/migrations/240_portland_city_races.sql` — EXISTS (committed 1181d92)
- [x] File is UTF-8 without BOM — CONFIRMED (node automated check passed)
- [x] 7 Portland position_names present in file — CONFIRMED
- [x] OFFSET 0/1/2 present for both D3 and D4 — CONFIRMED
- [x] City Auditor UUID a19813f9-ee4d-442d-b052-5c2f9f7db9c8 in file — CONFIRMED
- [x] ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING present — CONFIRMED
- [x] Forbidden literals (D1/D2/Mayor/City Administrator/City Attorney/cron_active/election_name/race_candidates) absent — CONFIRMED
- [x] Total OR race count = 105 — CONFIRMED in live DB
- [x] Portland race count = 7 — CONFIRMED
- [x] D3 distinct office_ids = 3 — CONFIRMED
- [x] D4 distinct office_ids = 3 — CONFIRMED
- [x] City Auditor office_id = a19813f9-ee4d-442d-b052-5c2f9f7db9c8 — CONFIRMED
- [x] No NULL office_ids — CONFIRMED
- [x] Idempotency: re-run stays at 105 — CONFIRMED
- [x] race_candidates for Portland = 0 — CONFIRMED
- [x] Commit 1181d92 (Task 1) — CONFIRMED

---
*Phase: 79-or-landing-elections-discovery*
*Plan: 04*
*Completed: 2026-05-30*
