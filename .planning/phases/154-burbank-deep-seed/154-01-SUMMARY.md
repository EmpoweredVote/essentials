---
phase: 154-burbank-deep-seed
plan: 01
subsystem: database
tags: [supabase, sql, migration, burbank, reconcile, geo_id, chamber-merge, at-large]

requires:
  - phase: 153-inglewood-deep-seed
    provides: dual-chamber-merge + one-directional link repair + geo_id backfill pattern (1018)
  - phase: 152-west-covina-deep-seed
    provides: at-large chamber merge template (1010) + rotational-mayor model

provides:
  - "gov 3e3deaea geo_id='0608954' backfilled — browse route resolves Burbank"
  - "single 'City Council' chamber 73422d25 holding all 5 At-Large offices bidirectionally"
  - "Anthony (-201161) + Mullins (-201162) one-directional links repaired"
  - "doomed chamber 6a72dbe8 + doomed district 809bbb35 deleted"
  - "migration 1026 registered in schema_migrations; file committed to EV-Accounts"

affects: [154-02-burbank-complete, 154-03-burbank-headshots, 154-04-burbank-stances]

tech-stack:
  added: []
  patterns:
    - "At-Large reconcile: chamber merge WITHOUT district relabel (Burbank is at-large through Nov 2026 CVRA ballot)"
    - "IS DISTINCT FROM guard for idempotent link repair"
    - "Move-then-assert-then-delete pattern for chamber merge"
    - "Orphan-district delete guarded by NOT EXISTS"
    - "Ledger registration OUTSIDE the transaction block (after COMMIT)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1026_burbank_reconcile.sql"
  modified: []

key-decisions:
  - "SURVIVOR chamber 73422d25 (official_count=5, 3 bidirectional offices) — DOOMED chamber 6a72dbe8 (official_count=NULL, 2 one-directional offices) — targeting by UUID only since both share name+slug"
  - "Mullins is a LEGITIMATE seated council member (Vice Mayor), NOT the City Clerk — DO NOT unlink — confirmed by RESEARCH §Roster Verdict"
  - "At-Large labels preserved (no relabel) — CVRA ballot measures not yet passed; Burbank is at-large through at least Nov 2026 — confirmed by RESEARCH §Form of Government Verdict"
  - "Rotational Mayor (Wave 2 title-on-seat) NOT a new LOCAL_EXEC office — West Covina/Downey model, handled in Plan 02"
  - "geo_id guard: IS NULL OR geo_id='' (empty string, not NULL, was what the DB had)"

patterns-established:
  - "At-Large city reconcile: 1026 is the reference file for at-large dual-chamber merges with no relabel"
  - "Split-section check via government_bodies.body_key COUNT — not government_bodies.mtfcc (Burbank only has one body_key row for geo_id 0608954)"

requirements-completed: [BURB-01]

duration: 25min
completed: 2026-06-22
---

# Phase 154 Plan 01: Burbank Reconcile Summary

**geo_id backfill + dual-chamber merge + one-directional link repair + At-Large district consolidation for City of Burbank (gov 3e3deaea), migration 1026 applied live and registered**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-22T00:00:00Z
- **Completed:** 2026-06-22T00:25:00Z
- **Tasks:** 2 (pre-flight + migration author/apply)
- **Files modified:** 1 (1026_burbank_reconcile.sql)

## Pre-Flight Findings Block (Task 1)

All invariants confirmed against CONTEXT.md §code_context. NO DRIFT.

| Check | Pre-flight Result | Expected | Status |
|-------|------------------|----------|--------|
| gov geo_id | '' (empty string) | NULL or '' | PASS |
| gov state | CA | CA | PASS |
| chamber count | 2 (both 'City Council') | 2 | PASS |
| SURVIVOR 73422d25 official_count | 5 | 5 | PASS |
| DOOMED 6a72dbe8 official_count | NULL | NULL | PASS |
| offices total | 5 offices / 5 distinct people | 5 / 5 | PASS |
| Anthony (-201161) in DOOMED | one-directional (pol.office_id NULL) | one-directional | PASS |
| Mullins (-201162) in DOOMED | one-directional (pol.office_id NULL) | one-directional | PASS |
| Survivor district 15458750 | At-Large, 3 offices | 3 offices | PASS |
| Doomed district 809bbb35 | At-Large, 2 offices | 2 offices | PASS |
| Live schema_migrations MAX | 999 | 999 | PASS |
| On-disk migration MAX | 1025 | 1025 | PASS |
| Next migration | 1026 | 1026 | PASS |

**Resolved full office UUIDs (from scan):**
- Anthony office: `1294961c-40db-47ed-8caf-9a721073d902`
- Mullins office: `9969febe-0fe8-4a66-af5e-49eea7367390`

## Accomplishments

- geo_id '0608954' backfilled on gov `3e3deaea-c5f4-4a68-b3ae-a79589f544ea` (was empty string)
- Dual-chamber merge: DOOMED `6a72dbe8` offices moved to SURVIVOR `73422d25`, doomed chamber deleted
- One-directional links repaired: Anthony (-201161) and Mullins (-201162) politicians.office_id now non-null
- Anthony + Mullins re-pointed from doomed district `809bbb35` to surviving district `15458750`
- Orphaned doomed At-Large district `809bbb35` deleted
- All 5 offices in survivor chamber, bidirectional, on 'At-Large' district (no relabel)
- Migration 1026 registered in schema_migrations; committed to EV-Accounts (501f76c7)

## Task Commits

1. **Task 1: STOP-on-drift pre-flight** — read-only; no file written; findings documented above
2. **Task 2: Author + apply 1026_burbank_reconcile.sql** — `501f76c7` (feat) in EV-Accounts repo

## Post-Apply Acceptance Assertions (all PASS)

| Assertion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| geo_id on gov 3e3deaea | '0608954' | '0608954' | PASS |
| Chamber count (City Council) | 1 | 1 | PASS |
| Doomed chamber 6a72dbe8 count | 0 | 0 | PASS |
| Offices in survivor 73422d25 | 5 | 5 | PASS |
| Bidirectional mismatches | 0 | 0 | PASS |
| Anthony (-201161) office_id | NOT NULL | 1294961c... | PASS |
| Mullins (-201162) office_id | NOT NULL | 9969febe... | PASS |
| Doomed district 809bbb35 count | 0 | 0 | PASS |
| At-Large labels preserved | 5 | 5 | PASS |
| Ledger MAX (schema_migrations) | 1026 | 1026 | PASS |
| Split-section check | 0 split rows | 1 body_key (clean) | PASS |

**Health one-liner:** geo_id='0608954', chamber_count=1, official_count=5

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1026_burbank_reconcile.sql` — Structural migration: geo_id backfill + dual-chamber merge + link repair + At-Large district consolidation; registered in schema_migrations

## Decisions Made

- **Mullins NOT unlinked:** Research §Roster Verdict confirms she is a seated council member and current Vice Mayor (Dec 2025–Dec 2026). The "prime suspect" warning in CONTEXT.md was a precaution, not a finding. DO NOT unlink in any subsequent wave.
- **No At-Large relabeling:** RESEARCH §Form of Government Verdict confirms Burbank is at-large through at least November 2026 (CVRA ballot measures pending). All 5 'At-Large' labels correct.
- **geo_id guard confirmed empty string:** DB had geo_id='' (empty string, not NULL). The `IS NULL OR geo_id=''` guard is essential for CA cities — not all have true NULLs.
- **offices table has no government_id column:** Query (c) was adapted to join via chamber_id IN (SURVIVOR, DOOMED) instead of WHERE government_id=... (schema difference from plan's suggested query).

## Deviations from Plan

None — plan executed exactly as written. The offices query was adapted due to schema structure (offices has no government_id column; queried via chamber membership instead), but this is a query-formulation adaptation, not a deviation from the intended outcome.

## Issues Encountered

- `SELECT MAX(version::int) FROM supabase_migrations.schema_migrations` failed with integer overflow because newer Supabase migrations use timestamp-format version strings (e.g., '20260602031258'). Used `ORDER BY version DESC LIMIT 10` instead to confirm the manual migration series (999, 992, 991...) is intact. MAX = 999 for the numbered series.
- `offices` table has no `government_id` or `district_type` columns — the pre-flight query (c) was adapted to use `WHERE chamber_id IN (SURVIVOR_UUID, DOOMED_UUID)` and omit district_type.
- `government_bodies` table has no `mtfcc` column — the split-section check was adapted to count `DISTINCT body_key` for geo_id '0608954' (returns 1 = clean, no split-section defect).

## Split-Section Verdict

**CLEAN** — `government_bodies` has exactly 1 row for geo_id '0608954' (body_key='Burbank City Council'). Burbank is not in the known split-section defect set. Post-reconcile: 1 survivor chamber, 1 surviving At-Large district, all 5 offices consolidated.

## Next Phase Readiness

Wave 1 complete. All structural foundations for Burbank are in place:
- Browse route `https://essentials.empowered.vote/results?browse_geo_id=0608954&browse_mtfcc=G4110` now resolves (geo_id backfilled)
- Single chamber `73422d25` holds all 5 bidirectional At-Large offices
- Wave 2 (Plan 02): set Mayor/Vice Mayor titles on seats (Takahashi=Mayor, Mullins=Vice Mayor) + official_count=5 + any remaining roster verification (next migration = 1027)

## Known Stubs

None — this plan is purely structural (no UI data, no headshots, no stances). The browse link will show correct officials after Wave 1.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes at trust boundaries. Migration SQL is scoped to specific UUIDs; all STRIDE mitigations from the plan's threat model were applied (T-154-01: UUID-only targeting + empty-assert; T-154-02: school-district gov never touched; T-154-03: idempotent guards; T-154-04: At-Large preserved + Mullins not unlinked).

---
*Phase: 154-burbank-deep-seed*
*Completed: 2026-06-22*
