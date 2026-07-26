---
phase: 109-ma-tier-2-cities
plan: "04"
subsystem: database/seeding
tags: [migration, brockton, ma-tier2, government, city-council]
dependency_graph:
  requires:
    - "Phase 38 MA TIGER load (geo_id='2509000' G4110 geofence)"
  provides:
    - "City of Brockton government seeded in production (geo_id='2509000')"
    - "12 Brockton officials with non-NULL office_ids"
    - "MA-TIER2-02 Brockton portion complete"
  affects:
    - "essentials.governments"
    - "essentials.chambers"
    - "essentials.districts"
    - "essentials.politicians"
    - "essentials.offices"
    - "supabase_migrations.schema_migrations"
tech_stack:
  added: []
  patterns:
    - "WITH ins_p CTE + CROSS JOIN office insert (7-step pattern)"
    - "NOT EXISTS guard on government insert (no unique constraint on geo_id)"
    - "mtfcc=NULL on LOCAL/LOCAL_EXEC districts (Tier 2 — no per-district geofences)"
    - "Ward title encoding in office.title: 'City Councilor (Ward N)'"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/354_brockton_government.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-354.ts"
  modified: []
decisions:
  - "Rodrigues (not the prior mayor) seeded as Mayor: per research CRITICAL CORRECTION note, Moises M. Rodrigues was inaugurated 2026-01-05 after winning November 2025 election"
  - "Tier 2 pattern used: single LOCAL district shared by all 11 councillors; ward/at-large distinction encoded in office.title only (no per-ward geofences)"
  - "John Lally's Council President procedural title NOT stored as a separate office (matches Boston precedent for Liz Breadon)"
  - "Susan Nicastro spelling: official brockton.ma.us spelling confirmed (not 'Suan' as in some sources)"
  - "Winthrop Farwell Jr.: last_name='Farwell' (suffix in full_name only)"
metrics:
  duration: "~15 minutes"
  completed: "2026-06-10"
  tasks_completed: 3
  files_created: 2
---

# Phase 109 Plan 04: City of Brockton Government Seed Summary

**One-liner:** Mayor-council government with Moises M. Rodrigues (51st Mayor, inaugurated 2026-01-05) + 11 councillors (7 ward + 4 at-large) seeded via migration 354, Tier 2 pattern.

## What Was Built

Migration `354_brockton_government.sql` seeds the complete City of Brockton government into production:

- **1 government row:** `City of Brockton, Massachusetts, US` (type=LOCAL, state=MA, geo_id=2509000)
- **1 chamber:** `Brockton City Council` (no slug — GENERATED ALWAYS)
- **2 districts:** LOCAL_EXEC for Mayor (`Brockton (Citywide)`) + LOCAL for all councillors (`Brockton`)
- **12 politicians:** Mayor Rodrigues + 7 ward councillors + 4 at-large councillors
- **12 offices:** all with non-NULL office_ids after back-fill
- **Ledger entry:** version='354' in supabase_migrations.schema_migrations

## Task Results

### Task 1: Migration 354 written

**File:** `C:/EV-Accounts/backend/migrations/354_brockton_government.sql`

All acceptance criteria met:
- External IDs -250900001 through -250900012 present
- Mayor block: `full_name='Moises M. Rodrigues'`, `external_id=-250900001`, `title='Mayor'`, LOCAL_EXEC district
- String 'Sullivan' does NOT appear
- Ward titles 'City Councilor (Ward 1)' through 'City Councilor (Ward 7)' all present
- District INSERTs use mtfcc=NULL; chamber INSERT has no 'slug' column
- Ledger INSERT version='354' present

### Task 2: Apply harness written

**File:** `C:/EV-Accounts/backend/scripts/_apply-migration-354.ts`

5 smoke tests:
1. Government row count expected 1
2. Politicians in external_id range expected 12
3. Districts (LOCAL_EXEC + LOCAL) expected 2
4. NULL office_id count expected 0
5. Ledger entry '354' PRESENT/MISSING

### Task 3: Migration applied to production

Applied via pg Pool to production Supabase DB (DATABASE_URL from .env, ssl rejectUnauthorized: false). All 7 post-verification gates passed inside the migration's DO block.

**Confirmed results:**

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Brockton government rows | 1 | 1 | PASS |
| Brockton politicians | 12 | 12 | PASS |
| Brockton districts | 2 | 2 | PASS |
| NULL office_ids | 0 | 0 | PASS |
| Ledger entry '354' | PRESENT | PRESENT | PASS |
| Mayor full_name | Moises M. Rodrigues | Moises M. Rodrigues | PASS |
| MA G4110 orphan count | decremented | 54 | PASS |

**Section-split invariant:** geo_id=2509000 is no longer in the MA G4110 orphan set (count now 54, previously higher by 1 before this migration).

## Officials Seeded

| external_id | full_name | title | district_type |
|-------------|-----------|-------|---------------|
| -250900001 | Moises M. Rodrigues | Mayor | LOCAL_EXEC |
| -250900002 | Marlon D. Green | City Councilor (Ward 1) | LOCAL |
| -250900003 | Maria T. Tavares | City Councilor (Ward 2) | LOCAL |
| -250900004 | Philip E. Griffin | City Councilor (Ward 3) | LOCAL |
| -250900005 | Susan Nicastro | City Councilor (Ward 4) | LOCAL |
| -250900006 | Jeffrey A. Thompson | City Councilor (Ward 5) | LOCAL |
| -250900007 | John Lally | City Councilor (Ward 6) | LOCAL |
| -250900008 | Shirley Asack | City Councilor (Ward 7) | LOCAL |
| -250900009 | Carla Darosa | City Councilor | LOCAL |
| -250900010 | Jeff Charnel | City Councilor | LOCAL |
| -250900011 | Winthrop Farwell Jr. | City Councilor | LOCAL |
| -250900012 | David C. Teixeira | City Councilor | LOCAL |

## Deviations from Plan

None - plan executed exactly as written. One minor auto-fix applied during authoring:

**Auto-fix:** Initial migration draft included the string 'Sullivan' in two comment lines (per plan requirement to not include that string). Both instances were removed before committing; the test `node -e "if(/Sullivan/i.test(s))"` confirmed clean. This was caught during Task 1 verification before any commit.

## Known Stubs

None. All 12 politicians are fully wired with offices, office_ids, and belong to the Brockton City Council chamber under the City of Brockton government.

## Threat Flags

None. All officials are public elected officials from official city websites; no non-public PII. Migration is idempotent (ON CONFLICT DO NOTHING + WHERE NOT EXISTS guards on all inserts).

## Self-Check: PASSED

- `C:/EV-Accounts/backend/migrations/354_brockton_government.sql` — FOUND (26KB, verified)
- `C:/EV-Accounts/backend/scripts/_apply-migration-354.ts` — FOUND (verified)
- Migration 354 applied: 12 politicians confirmed, 0 NULL office_ids, Mayor = Moises M. Rodrigues
- geo_id 2509000 no longer a section-split orphan (MA G4110 count = 54 post-migration)
