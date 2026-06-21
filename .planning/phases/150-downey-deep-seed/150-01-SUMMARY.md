---
phase: 150-downey-deep-seed
plan: "01"
subsystem: database
tags: [reconcile, structural, downey, by-district, rotational-mayor, chamber-merge]
dependency_graph:
  requires: []
  provides: [downey-geo-id, downey-single-chamber, downey-district-structure]
  affects: [plan-150-02, plan-150-03, plan-150-04]
tech_stack:
  added: []
  patterns: [move-then-delete-chamber-merge, by-district-relabel, rotational-mayor-title-on-seat, triple-shared-district-repoint, orphan-row-repurpose]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/990_downey_reconcile.sql
  modified: []
decisions:
  - "Migration numbered 990 (not 985 as planned) — on-disk MAX was 989 (not 984), files 985-989 are state_exec_headshots_batch_a-e audit-only from Phase 141"
  - "Extra unused LOCAL_EXEC district fd6d5d3a ('Downey Mayor', 0 office refs) deleted to achieve ZERO LOCAL_EXEC"
  - "Triple shared-district defect on 22ff630a (Pemberton+Saab+Pelc) — Pemberton repointed to unused orphan 8468daf6, Saab+Pelc remain on 22ff630a (stale, Plan 02 unlinks them)"
  - "District 1 row repurposed from unused orphan 39e05679 (not created new — matches Pasadena Rivas pattern)"
metrics:
  duration_minutes: 35
  completed: "2026-06-20"
---

# Phase 150 Plan 01: Downey Structural Reconcile Summary

Idempotent migration 990 applied to production: geo_id backfilled, duplicate chamber merged, 5 district rows correctly labeled D1-D5, rotational mayor collapsed into District 2 title, unused LOCAL_EXEC district deleted, Trujillo name corrected. ZERO LOCAL_EXEC rows; split-section check 0 rows.

## Tasks Completed

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| Task 1 | Pre-flight verification of live DB state | COMPLETE | All pre-checks run; 3 deviations found and documented |
| Task 2 | Author + apply migration 990 | COMPLETE | Applied + idempotency verified; all post-checks green |

## Pre-flight Findings (Task 1)

### Confirmed as Expected
- Gov `1a31cf01` geo_id = empty string (matches `geo_id IS NULL OR geo_id = ''` guard), state='CA'
- Name: 'City of Downey, California, US'
- Two chambers: survivor `7cb8a90c` (official_count=5, 5 offices) + orphan `a30fd533` (official_count=NULL, 1 office: Trujillo)
- All 5 survivor offices confirmed with correct ext_ids and chamber assignments
- Orphan has exactly 1 office: Trujillo 2afa4fd2, ext_id -201200
- Trujillo: last_name='-', first_name='Mario Trujillo' (corrupted)
- Sosa's office cc3bacd0 already had title='Mayor' (pre-existing partial update — idempotent)
- Ortiz: ABSENT from DB (must be created in Plan 02)
- schema_migrations MAX = 947 (as expected)
- -201xxx convention: canonical first_name/last_name split (e.g., external_id -201299 = Lorraine Avila Moore)

### Deviations from Plan's Expected Pre-State

**Deviation 1 — On-disk MAX is 989, not 984:**
Files 985-989 are `state_exec_headshots_batch_a` through `state_exec_headshots_batch_e` (Phase 141 audit-only). The plan was authored when on-disk MAX was 984. Applied as **migration 990** (next available). All references to '985' in the plan become '990'.

**Deviation 2 — Two LOCAL_EXEC rows, not one:**
Pre-flight found `fd6d5d3a` ('Downey Mayor' LOCAL_EXEC, 0 office refs) in addition to Sosa's `22ebdde5`. Plan expected only one. The unused `fd6d5d3a` was deleted in migration 990 to achieve ZERO LOCAL_EXEC rows.

**Deviation 3 — Triple shared-district defect (worse than expected):**
District `22ff630a` was shared by 3 offices: Pemberton (675360), Saab (-700160), Pelc (-700161). Plan noted the possibility of a shared-district defect but expected at most 2 offices sharing. Resolution: Pemberton's office 3718d3c0 repointed to unused orphan row `8468daf6`, then relabeled 'District 3'. Saab+Pelc remain on `22ff630a` (stale members, unlinked in Plan 02).

**Additional finding — 7 total district rows for geo_id 0619766:**
Pre-flight found 7 district rows (not the 4 implied by the plan's analysis):
- `8468daf6` — At-Large LOCAL, 0 refs → repurposed as District 3 (Pemberton)
- `22ff630a` — At-Large LOCAL, 3 refs → Saab+Pelc shared (stale, Plan 02)
- `9c06376f` — At-Large LOCAL, 1 ref → District 4 (Frometa)
- `996396b2` — At-Large LOCAL, 1 ref → District 5 (Trujillo)
- `39e05679` — At-Large LOCAL, 0 refs → repurposed as District 1 (Ortiz placeholder)
- `22ebdde5` — At-Large LOCAL_EXEC, 1 ref → District 2 (Sosa, LOCAL_EXEC→LOCAL)
- `fd6d5d3a` — Downey Mayor LOCAL_EXEC, 0 refs → DELETED

## Migration 990 Applied

**File:** `C:/EV-Accounts/backend/migrations/990_downey_reconcile.sql`

**Executed steps:**
1. `UPDATE governments SET geo_id='0619766'` — 1 row updated
2. `UPDATE offices SET chamber_id='7cb8a90c...'` — 1 row (Trujillo moved)
3. `DO $$ assert a30fd533 empty $$` — passed
4. `DELETE chambers WHERE id='a30fd533...'` — 1 row deleted
5. `UPDATE offices SET district_id='8468daf6...'` — 1 row (Pemberton repointed)
6. Relabel District 1: `39e05679` → 'District 1' — 1 row
7. Relabel District 3: `8468daf6` → 'District 3' — 1 row
8. Relabel District 4: `9c06376f` → 'District 4' — 1 row
9. Relabel District 5: `996396b2` → 'District 5' — 1 row
10. `UPDATE districts SET district_type='LOCAL', label='District 2'` on `22ebdde5` — 1 row (Sosa)
11. `UPDATE offices SET title='Mayor'` on `cc3bacd0` — 0 rows (already 'Mayor')
12. `UPDATE offices SET title='Councilmember'` on Pemberton/Frometa/Trujillo — 3 rows
13. `DO $$ assert fd6d5d3a has 0 refs $$` — passed
14. `DELETE districts WHERE id='fd6d5d3a...'` — 1 row (unused Downey Mayor LOCAL_EXEC)
15. `UPDATE politicians SET first_name='Mario', last_name='Trujillo'` — 1 row (Trujillo name fix)
16. `INSERT schema_migrations (990, 'downey_reconcile')` — registered

**Idempotency:** Second apply = all 0-row changes, no errors.

## Post-Verification Results

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| geo_id on gov 1a31cf01 | '0619766' | '0619766' | YES |
| Chamber count under gov | 1 | 1 (7cb8a90c) | YES |
| Orphan a30fd533 deleted | 0 | 0 | YES |
| Survivor 7cb8a90c office count | 6 | 6 | YES |
| ZERO LOCAL_EXEC rows | 0 | 0 | YES |
| Sosa office title | 'Mayor' | 'Mayor' | YES |
| Sosa district label | 'District 2' | 'District 2' | YES |
| Sosa district_type | 'LOCAL' | 'LOCAL' | YES |
| Trujillo name | Mario / Trujillo | Mario / Trujillo | YES |
| split-section check (correct query) | 0 rows | 0 rows | YES |
| migration 990 registered | '990' | '990' | YES |

## District UUID Reference for Plan 02

| District | UUID | Occupant | Plan 02 Action |
|----------|------|----------|----------------|
| District 1 | `39e05679-110c-48be-be51-5434b5da6727` | Ortiz (no office yet) | Create politician + seat office |
| District 2 | `22ebdde5-9e8d-4a2c-9646-9509e7c6707b` | Sosa (675353) Mayor | No change needed |
| District 3 | `8468daf6-6faa-49f2-b034-af135d008300` | Pemberton (675360) | No change needed |
| District 4 | `9c06376f-3510-40ee-be67-ca8d84d6ad9e` | Frometa (675361) | No change needed |
| District 5 | `996396b2-872e-4d83-a9fb-27d57acdcb4c` | Trujillo (-201200) | No change needed |
| At-Large (shared) | `22ff630a-c5d5-4b13-a4a6-88d5b35389aa` | Saab+Pelc (stale) | Unlink both in Plan 02 |

## Plan 02 Prerequisites (recorded here per plan output spec)

- **Ortiz politician row:** ABSENT — must be created. Next free -700xxx: **-700659** (gap between -700658 Ontiveros-Cole and -700990; suggest using **-700990** to match migration number, or -700659 as strict next sequential).
- **Ortiz district:** `39e05679` ('District 1') already exists — just seat him.
- **Office rows for Plan 02:**
  - Saab's office `44ca5c68` (At-Large, stale) → repurpose for Ortiz District 1 after unlinking Saab
  - Pelc's office `2ecc0a3e` (At-Large, stale) → unlink Pelc; repurpose or leave empty
- **-201xxx convention confirmed:** first_name = given name only, last_name = family name (e.g., -201299 = first='Lorraine Avila', last='Moore'; Trujillo now: first='Mario', last='Trujillo')
- **Migration counter for Plan 02:** Next structural is **991** (schema_migrations MAX = 990 after this wave)
- **official_count:** Currently 5 on survivor — leave until after roster reconcile in Plan 02 (set to 5 final after Saab+Pelc unlinked and Ortiz seated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration file renamed from 985 to 990**
- **Found during:** Task 1 (on-disk file listing)
- **Issue:** Files 985-989 already existed (`state_exec_headshots_batch_a-e` from Phase 141). Plan had stale MAX of 984.
- **Fix:** Named file `990_downey_reconcile.sql`; all internal references use 990; registered as version '990' in schema_migrations.
- **Files modified:** N/A (new file created with correct number)

**2. [Rule 2 - Missing Critical] Deleted unused 'Downey Mayor' LOCAL_EXEC district (fd6d5d3a)**
- **Found during:** Task 1 pre-flight
- **Issue:** Plan expected Sosa's `22ebdde5` to be the only LOCAL_EXEC row; pre-flight found a second unused 'Downey Mayor' LOCAL_EXEC district (`fd6d5d3a`, 0 office refs). Leaving it would violate the "ZERO LOCAL_EXEC rows" success criterion.
- **Fix:** Added `DO $$ assert 0 refs $$` + `DELETE FROM essentials.districts WHERE id='fd6d5d3a...'` to migration 990.
- **Commit hash:** included in the combined task commit

**3. [Rule 1 - Bug] Triple shared-district defect on 22ff630a (3 offices, not 2)**
- **Found during:** Task 1 pre-flight
- **Issue:** Plan mentioned the possibility of a shared-district defect and documented a 2-office scenario. Actual defect was 3 offices (Pemberton + Saab + Pelc all on 22ff630a).
- **Fix:** Repointed Pemberton's office 3718d3c0 to unused orphan row 8468daf6 (labeled 'District 3'). Saab + Pelc remain on 22ff630a (acceptable — both are stale members being unlinked in Plan 02). District 1 repurposed from second unused orphan 39e05679.
- **Pattern:** Same Pomona/Pasadena orphan-repurpose approach (no new district rows created)

## Threat Flags

No new network endpoints, auth paths, or schema changes at trust boundaries beyond the planned DB writes. All STRIDE mitigations applied as designed.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/990_downey_reconcile.sql` exists (written)
- [x] geo_id='0619766' on gov 1a31cf01 confirmed via SELECT
- [x] Orphan chamber a30fd533 deleted (SELECT COUNT(*) = 0)
- [x] Survivor 7cb8a90c has 6 offices
- [x] District 1-5 all LOCAL; ZERO LOCAL_EXEC
- [x] Sosa: Mayor / District 2 / LOCAL
- [x] Trujillo: first_name='Mario' last_name='Trujillo'
- [x] split-section check (correct query): 0 rows
- [x] migration 990 in schema_migrations
- [x] Idempotency verified (second apply = all 0 rows)
