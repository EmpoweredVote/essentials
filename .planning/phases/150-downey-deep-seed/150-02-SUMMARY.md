---
phase: 150-downey-deep-seed
plan: "02"
subsystem: database
tags: [reconcile, structural, downey, roster, create-politician, unlink-stale, back-pointer-repair, rotational-mayor]
dependency_graph:
  requires: [plan-150-01]
  provides: [downey-complete-roster, downey-ortiz-created, downey-5-member-consistent]
  affects: [plan-150-03, plan-150-04]
tech_stack:
  added: []
  patterns: [create-and-seat-new-politician, unlink-not-delete, back-pointer-repair, repurpose-stale-office, official_count-guard]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/991_downey_complete.sql
  modified: []
decisions:
  - "Migration numbered 991 (not 986 as planned) — plan was authored before Plan 01 ran; Plan 01 used 990; on-disk MAX is now 990; 986 is already taken by state_exec_headshots_batch_b; 991 is the correct next structural migration"
  - "Ortiz ext_id = -700991 (range -700659 to -700990 fully empty; chose -700991 to align with migration number 991)"
  - "Pelc's surplus office 2ecc0a3e: politician_id NULLed (not repurposed); D1 office covered by repurposed Saab office 44ca5c68; no seat lacked an office"
  - "Saab's office 44ca5c68 repurposed for Ortiz District 1 — district_id updated from 22ff630a (At-Large stale) to 39e05679 (District 1)"
metrics:
  duration_minutes: 45
  completed: "2026-06-20"
---

# Phase 150 Plan 02: Downey Roster Reconcile Summary

Idempotent migration 991 applied to production: Horacio Ortiz created (ext_id -700991, UUID 13dc32dd-fac5-440d-9f10-f1f1892acf68) and seated in District 1 (office 44ca5c68 repurposed from Saab); Saab + Pelc unlinked (office_id NULL, is_active=false, rows KEPT); Trujillo back-pointer repaired (office_id was NULL after Plan 01 chamber move); official_count=5. ZERO LOCAL_EXEC rows; split-section check 0 rows. Exactly 5 active members with consistent bidirectional links across D1-D5.

## Tasks Completed

| Task | Description | Status | Notes |
|------|-------------|--------|-------|
| Task 1 Pre-flight | Live DB re-confirmation of back-pointer state, ext_id, Pelc's district, Ortiz absence, official_count | COMPLETE | All 7 checks run; 2 deviations found + documented |
| Task 1 Migration | Author + apply migration 991 | COMPLETE | Applied + idempotency verified; all post-checks green |

## Pre-flight Findings (Task 1)

### Confirmed as Expected
- Ortiz: ABSENT from DB (confirmed via ILIKE search) — created in migration
- Saab (-700160): office_id=44ca5c68, is_active=true (as expected — unlinked in migration)
- Pelc (-700161): office_id=2ecc0a3e, is_active=true (as expected — unlinked in migration)
- Trujillo (-201200): office_id=NULL (desync after Plan 01 chamber move — repaired in migration)
- Sosa (675353): office_id=cc3bacd0 (already correct — guarded no-op)
- Pemberton (675360): office_id=3718d3c0 (already correct — guarded no-op)
- Frometa (675361): office_id=6fa79f0e (already correct — guarded no-op)
- District 1 UUID 39e05679 confirmed: label='District 1', district_type='LOCAL', geo_id='0619766'
- Chamber 7cb8a90c official_count=5 (already set in Plan 01 — guard idempotent)
- schema_migrations MAX = 990 (as expected after Plan 01)
- Pelc's office 2ecc0a3e: on district 22ff630a (At-Large stale, same as Saab's) — surplus office; nulled politician_id

### Deviations from Plan's Expected Pre-State

**Deviation 1 — Migration file numbered 991 (not 986 as in PLAN.md filename):**
The plan was authored as `986_downey_complete.sql` when the expected on-disk MAX was 984 (research-time). Plan 01 ran and found the MAX was actually 989, used 990. So on-disk MAX is now 990, and 986 is taken by `986_state_exec_headshots_batch_b.sql`. Applied as migration **991** (next available). Registered as version '991' in schema_migrations.

**Deviation 2 — ext_id for Ortiz is -700991 (not ~-700985 as estimated in plan):**
`SELECT MIN(external_id) ... WHERE external_id <= -700659 AND external_id > -701000` returned NULL (range completely empty — no entries between -700658 and -701000). Used -700991 to align with migration number. The plan cited "research expects ~-700985 given the migration ledger" — the ledger is now 990 not 985.

## Migration 991 Applied

**File:** `C:/EV-Accounts/backend/migrations/991_downey_complete.sql`

**Executed steps:**

**Part A — Create + Seat Ortiz (D1):**
1. `INSERT essentials.politicians (ext_id=-700991, 'Horacio', 'Ortiz', is_active=true)` — 1 row inserted (ON CONFLICT DO NOTHING guard)
2. `UPDATE offices SET politician_id=<Ortiz UUID>, district_id='39e05679...', title='Council Member' WHERE id='44ca5c68...'` — 1 row (Saab's freed office repurposed for District 1)
3. `UPDATE politicians SET office_id='44ca5c68...' WHERE external_id=-700991` — 1 row (back-pointer set)

**Part B — Unlink stale Saab + Pelc (KEEP rows):**
4. `UPDATE politicians SET office_id=NULL, is_active=false WHERE external_id=-700160` — 1 row (Saab unlinked)
5. `UPDATE politicians SET office_id=NULL, is_active=false WHERE external_id=-700161` — 1 row (Pelc unlinked)
6. `UPDATE offices SET politician_id=NULL WHERE id='2ecc0a3e...'` — 1 row (Pelc's surplus office freed)

**Part C — Repair back-pointers + official_count:**
7. `UPDATE politicians SET office_id='2afa4fd2...' WHERE external_id=-201200` — 1 row (Trujillo repaired)
8. Sosa/Pemberton/Frometa back-pointer guards — 0 rows each (already correct per pre-flight)
9. `UPDATE chambers SET official_count=5 WHERE id='7cb8a90c...'` — 0 rows (already 5 from Plan 01)
10. `INSERT schema_migrations (991, 'downey_complete')` — 1 row registered

**Idempotency:** Second apply = all 0-row changes, no errors.

## Post-Verification Results

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| Active members with consistent bidirectional links in 7cb8a90c | 5 | 5 | YES |
| D1 Ortiz (Council Member, District 1) | ✓ | ✓ | YES |
| D2 Sosa (Mayor, District 2) | ✓ | ✓ | YES |
| D3 Pemberton (Councilmember, District 3) | ✓ | ✓ | YES |
| D4 Frometa (Councilmember, District 4) | ✓ | ✓ | YES |
| D5 Trujillo (Councilmember, District 5) | ✓ | ✓ | YES |
| Both pointers consistent for all 5 (pol_ptr_ok=true, off_ptr_ok=true) | ✓ | ✓ | YES |
| Saab (-700160) row KEPT, office_id NULL, is_active=false | ✓ | ✓ | YES |
| Pelc (-700161) row KEPT, office_id NULL, is_active=false | ✓ | ✓ | YES |
| Ortiz: external_id=-700991, UUID=13dc32dd-fac5-440d-9f10-f1f1892acf68 | ✓ | ✓ | YES |
| official_count = 5 | 5 | 5 | YES |
| LOCAL_EXEC rows = 0 | 0 | 0 | YES |
| migration 991 in schema_migrations | '991' | '991' | YES |
| Idempotency (second apply = no error) | [] | [] | YES |
| Split-section check (no LOCAL_EXEC offices) | 0 rows | 0 rows | YES |

## Roster Reference for Plan 03 (Headshots)

| District | Member | ext_id | Politician UUID | Office UUID | Status |
|----------|--------|--------|-----------------|-------------|--------|
| D1 | Horacio Ortiz | -700991 | `13dc32dd-fac5-440d-9f10-f1f1892acf68` | `44ca5c68-3e7e-4e96-93eb-3c1773df842a` | NEW (0 photos) |
| D2 | Hector Sosa (Mayor) | 675353 | `92d68971-8cc2-480b-8e29-9938f7a280f1` | `cc3bacd0-5026-4914-b271-c6e40c929a9c` | 0 photos |
| D3 | Dorothy Pemberton | 675360 | `71c35909-e5b5-40ca-883f-21af5c287b5e` | `3718d3c0-f7f0-40d0-8a8e-f8654ba779b8` | 0 photos |
| D4 | Claudia Frometa | 675361 | `4967617f-5919-4816-8661-a675f05e8b66` | `6fa79f0e-a3d8-47f3-b67d-29009818f2ee` | 0 photos |
| D5 | Mario Trujillo | -201200 | `06b1dae6-5fcf-4a1f-ba89-d06cbae5c19d` | `2afa4fd2-708e-4990-9b9a-c01131e2226b` | 0 photos |

**Stale (unlinked, rows KEPT):**
- Saab (-700160, UUID `293e51e3-dc01-4cfe-a0c5-dfb6a54e7ed5`): office_id NULL, is_active=false
- Pelc (-700161, UUID `a0f4f3b1-2cf9-4559-80ba-64f382fd081f`): office_id NULL, is_active=false

**Headshot sources (all 5 → Plan 03):**
- Ortiz: downeyca.org portrait (in-browser) — WAF-403 to curl
- Sosa: downeyca.org portrait (in-browser)
- Pemberton: downeyca.org portrait (in-browser)
- Frometa: SCAG `https://scag.ca.gov/sites/default/files/styles/memeber_image/public/2024-08/claudia-frometa.jpg` (HTTP 200 confirmed)
- Trujillo: downeyca.org portrait (in-browser)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration file renamed from 986 to 991**
- **Found during:** Task 1 pre-flight (on-disk file listing)
- **Issue:** `986_state_exec_headshots_batch_b.sql` already exists on disk; plan was authored when expected next was 985/986. Plan 01 used 990 (discovered on-disk MAX was 989). Next available = 991.
- **Fix:** Named file `991_downey_complete.sql`; registered as version '991' in schema_migrations.
- **Files modified:** N/A (new file created with correct number)

**2. [Rule 1 - Bug] Ortiz ext_id revised from ~-700985 to -700991**
- **Found during:** Task 1 pre-flight (SELECT MIN(external_id))
- **Issue:** Plan estimated -700985; actual `MIN(external_id) WHERE ext_id <= -700659 AND ext_id > -701000` returned NULL (range completely empty). Used -700991 to align with migration number 991.
- **Fix:** Used -700991 in the INSERT; ON CONFLICT DO NOTHING guard prevents duplicates.
- **Impact:** None — Ortiz UUID is 13dc32dd; ext_id -700991 is unique and verifiable.

## Threat Flags

No new network endpoints, auth paths, or schema changes at trust boundaries beyond the planned DB writes. All STRIDE mitigations applied as designed.

## Known Stubs

None. All 5 council seats have politician rows with names, office links, and is_active=true. No placeholder text, hardcoded empty values, or unresolved TODO patterns.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/991_downey_complete.sql` exists (written)
- [x] Ortiz created (external_id=-700991, UUID=13dc32dd-fac5-440d-9f10-f1f1892acf68) — verified via SELECT
- [x] 5 active members with consistent bidirectional links (COUNT=5) — verified
- [x] Saab (-700160): office_id NULL, is_active=false, row KEPT (SELECT returns 1 row)
- [x] Pelc (-700161): office_id NULL, is_active=false, row KEPT (SELECT returns 1 row)
- [x] official_count=5 — verified
- [x] ZERO LOCAL_EXEC rows — verified (count=0)
- [x] migration 991 in schema_migrations — verified (SELECT returns '991')
- [x] Idempotency verified (second apply = all 0 rows, no errors)
- [x] Split-section check: 0 LOCAL_EXEC offices under Downey government
