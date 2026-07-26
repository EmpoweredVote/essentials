---
phase: 93-md-legislature-federal-officials
plan: "03"
subsystem: database
tags:
  - maryland
  - delegates
  - migration
  - multi-member
  - powershell-generator
dependency_graph:
  requires:
    - "Phase 91: 71 STATE_LOWER SLDL districts loaded (geo_ids 24003..24046 whole + 2401A-2447B subdistricts)"
    - "Migration 272 (Plan 93-01): Maryland House of Delegates chamber seeded"
    - "Migration 174: State of Maryland government row (geo_id='24')"
  provides:
    - "generate_md_house.ps1 — PowerShell generator with 141-entry multi-member roster"
    - "274_md_delegates.sql — 141 CTE blocks + office_id back-fill (multi-member NOT EXISTS guard)"
    - "Migration 274 applied to production DB (2026-06-05)"
    - "141 essentials.politicians rows (external_id -2420001..-2420141)"
    - "141 essentials.offices rows linked to Maryland House of Delegates + STATE_LOWER districts"
    - "District 42A vacant placeholder (is_vacant=true on both politician and office)"
  affects:
    - "Phase 96 (MD Elections): 141 delegate offices available for election race rows"
    - "Phase 97/98 (Stances): 141 delegate politician_ids available for compass stances"
    - "Phase 94 (Headshots): 141 delegate rows exist to receive politician_images"
tech_stack:
  added: []
  patterns:
    - "Multi-member NOT EXISTS guard: (district_id, politician_id) not (district_id, chamber_id)"
    - "Whole district multi-member: 3 CTE blocks per geo_id with distinct ext_ids and politician rows"
    - "Vacant seat pattern: is_vacant=true on both politician (is_active=false) and office"
    - "PowerShell generator with geo_id split: PadLeft(3) for whole, PadLeft(2)+letter for subdistricts"
    - "Non-ASCII name encoding: [char]0x00F1 for ñ in Joseline Pena-Melnyk"
    - "UTF-8 NoBOM file writer ([System.Text.UTF8Encoding]::new($false)) for non-ASCII safety"

key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/generate_md_house.ps1"
    - "C:/EV-Accounts/backend/migrations/274_md_delegates.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-274.ts"
  modified: []
key-decisions:
  - "NOT EXISTS guard uses (district_id, politician_id) — critical for multi-member whole districts where (district_id, chamber_id) would block 2nd and 3rd office inserts"
  - "Roster verified at execution time (2026-06-05): 141 entries, District 42A still vacant"
  - "A/B split for all 12 A/B parent districts: 3 delegates each (2+1 or 1+2 split)"
  - "Only 1 accented name found: Joseline Pena-Melnyk (District 21, Speaker of the House), ñ encoded as [char]0x00F1"
  - "Migration 274 applied out-of-sequence after 275 — Supabase tracks by name, not strict counter order; STATE.md remains at 276 (correct)"

patterns-established:
  - "Multi-member delegate seeding: 3 offices per whole district linked to same geo_id via NOT EXISTS (district_id, politician_id)"
  - "PowerShell generator validation: roster count check before generate + CTE count verification after write"
  - "_apply-migration-NNN.ts pattern: reads SQL file from disk via readFileSync, handles large files"

requirements-completed:
  - MD-GOV-04

duration: 45min
completed: "2026-06-05"
---

# Phase 93 Plan 03: MD House of Delegates Migration Summary

**141 Maryland delegate offices seeded via multi-member PowerShell generator (migration 274) — first project migration using (district_id, politician_id) NOT EXISTS guard enabling 3 offices per whole district geo_id**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-06-05T22:35:00Z
- **Completed:** 2026-06-05T23:20:00Z
- **Tasks:** 3 (roster verification + generator authoring + migration apply)
- **Files modified:** 3 created

## Accomplishments

- Verified 141-delegate roster at execution time from mgaleg.maryland.gov (87 whole + 54 subdistrict; District 42A confirmed vacant)
- Wrote `generate_md_house.ps1` with full 141-entry roster and multi-member NOT EXISTS guard `(district_id, politician_id)`
- Applied migration 274: 141 politicians seeded, 141 offices linked, 141 office_ids back-filled
- All 3 multi-member integrity gates pass: 0 whole-district violations, 0 A/B violations, 0 A/B/C violations
- Joseline Peña-Melnyk (HD-21, Speaker of the House) encoded correctly with ñ = `[char]0x00F1`

## Roster Verification (Task 1)

**Verified from:** `https://mgaleg.maryland.gov/mgawebsite/Members/Index/house`
**Verification timestamp:** 2026-06-05

| Category | Districts | Entries | Total |
|----------|-----------|---------|-------|
| Whole districts (3 offices/district) | 29 | 87 | 87 |
| A/B/C subdistricts (1 office/sub) | 6 parents × 3 = 18 | 18 | 18 |
| A/B subdistricts (1-2 offices/sub, sum=3/parent) | 12 parents × 3 = 36 | 36 | 36 |
| **Total** | **47 parent districts** | **141** | **141** |

**District 42A status at execution time:** VACANT (no name, no image on mgaleg.maryland.gov)
- Seeded with `full_name='Vacant', is_active=false, is_vacant=true, is_incumbent=false`
- Office row also `is_vacant=true`

**Non-ASCII names found:** 1
- Joseline Peña-Melnyk (HD-21): ñ (`[char]0x00F1`) — Speaker of the House

## Migration 274 Application (Task 3)

**Apply timestamp:** 2026-06-05
**Method:** `_apply-migration-274.ts` via `npx tsx`

**Migration accepted with:** Migration applied successfully (no errors)

## Final Counts

| Metric | Expected | Actual | Pass |
|--------|----------|--------|------|
| Delegate offices (Maryland House of Delegates chamber) | 141 | 141 | YES |
| Politician rows (external_id in range) | 141 | 141 | YES |
| Politicians with office_id back-filled | 141 | 141 | YES |
| NULL office_id count | 0 | 0 | YES |

## Multi-Member Integrity Gates

| Gate | Expected violations | Actual | Pass |
|------|---------------------|--------|------|
| Whole-district integrity (each of 29 whole districts = 3 offices) | 0 rows | 0 | YES |
| A/B parent integrity (each of 12 A/B parents sums to 3) | 0 rows | 0 | YES |
| A/B/C parent integrity (each of 6 A/B/C parents = 3) | 0 rows | 0 | YES |

## Spot-Check Verification

| Spot-check | Expected | Actual |
|------------|----------|--------|
| HD-3 (whole district, 3 delegates, same geo_id) | geo_id='24003' × 3 | Kris Fair -2420007, Kenneth Kerr -2420008, Karen Simpson -2420009 |
| HD-2A (subdistrict, 2 delegates) | geo_id='2402A' × 2 | William Valentine -2420004, William Wivell -2420005 |
| HD-42A (vacant) | is_vacant=true, is_active=false | CONFIRMED |
| Peña-Melnyk (non-ASCII) | full_name = 'Joseline Peña-Melnyk' | CONFIRMED (ñ correct) |

## Idempotency

Re-applied migration 274: counts remain 141, no errors, 0 new rows inserted. Idempotency confirmed.

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria satisfied.

The migration applied out-of-sequence (migration 274 after migration 275 which was already applied in Plan 93-04). Supabase tracks migrations by name, not strict numeric order, so this is safe. STATE.md was already at "Next migration: 276" which remains correct.

## Next Migration Counter

STATE.md `Next migration` remains at **276** (migration 275 was already applied in Plan 93-04; migration 274 was applied out-of-sequence and does not change the counter).

## Self-Check: PASSED

- File `C:/EV-Accounts/backend/migrations/generate_md_house.ps1` exists — FOUND
- File `C:/EV-Accounts/backend/migrations/274_md_delegates.sql` exists — FOUND
- Generator outputs "CTE blocks (delegates): 141  (expected 141)" — CONFIRMED
- Migration applied: 141 politicians + 141 offices + 141 back-fills — CONFIRMED via smoke tests
- All 3 integrity gates: 0 violations — CONFIRMED
- District 42A: is_vacant=true — CONFIRMED
- Joseline Peña-Melnyk encoded correctly — CONFIRMED
- Idempotency re-apply: 0 new rows — CONFIRMED
