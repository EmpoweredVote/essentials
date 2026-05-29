---
phase: 74-or-executives-federal
plan: 02
subsystem: database
tags: [postgres, migration, supabase, oregon, federal, senators, house]

# Dependency graph
requires:
  - phase: 72-portland-or
    provides: OR TIGER geofences loaded; NATIONAL_UPPER (geo_id='41') and NATIONAL_LOWER (geo_ids 4101-4106) districts pre-seeded
  - phase: 74-02 task 1 (pre-flight)
    provides: federal chamber names confirmed; senator pre-existence deviation identified
provides:
  - 2 OR US Senators with canonical external_ids (-4101001, -4101002) linked to NATIONAL_UPPER district
  - 6 OR US House reps (external_ids -4102001..-4102006) linked to NATIONAL_LOWER districts CD-01..CD-06
  - Migration 224 applied and verified idempotent
  - OR federal address routing live (Portland City Hall → Bonamici/CD-01 confirmed)
affects:
  - 74-03 (headshots for 8 federal officials — needs politician UUIDs)
  - address lookup for any OR address (NATIONAL_LOWER routing now complete)
  - Phase 75 (OR state legislature) — federal foundation established

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Senator deviation: UPDATE external_id rather than INSERT when senators pre-exist with correct offices"
    - "House rep CTE INSERT-with-RETURNING + NOT EXISTS office guard (migration 170 pattern)"
    - "Federal chamber resolution via name subquery (never hardcoded UUID)"
    - "Senator uniqueness key: (district_id, politician_id) NOT (district_id, chamber_id)"
    - "office_id back-fill scoped by external_id range with IS NULL guard"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/224_or_federal_officials.sql
  modified: []

key-decisions:
  - "Senators Ron Wyden and Jeff Merkley pre-existed under external_ids -400065/-400066 with correct offices — migration UPDATEs external_ids to canonical scheme, no new politician/office INSERTs needed for senators"
  - "Section-split detector returned 346 rows — pre-existing condition from Phase 72 TIGER load, same as documented in 74-01-SUMMARY; OR city governments not yet seeded (Phase 76-77 scope)"
  - "Chamber IDs resolved via name subquery: name='U.S. Senate' and name='U.S. House of Representatives'"
  - "Next migration is 225"

patterns-established:
  - "Federal officials migration pattern for OR: senators UPDATE-only (pre-exist); House reps CTE INSERT"

requirements-completed: []

# Metrics
duration: 30min
completed: 2026-05-29
---

# Phase 74 Plan 02: OR Federal Officials Seed Summary

**Migration 224 seeds Oregon's 2 US Senators (Wyden/Merkley, external_ids updated from -40006x to -4101001/-4101002) and 6 US House reps (Bonamici/Bentz/Dexter/Hoyle/Bynum/Salinas, -4102001..-4102006) with all 8 office rows linked to pre-existing NATIONAL_UPPER/LOWER districts; Portland City Hall address routing confirmed returning Suzanne Bonamici (CD-01)**

## Performance

- **Duration:** ~30 min
- **Started:** 2026-05-29
- **Completed:** 2026-05-29
- **Tasks:** 3 (Task 1 pre-flight committed separately as 19aa3e9)
- **Files modified:** 1 (224_or_federal_officials.sql)

## Migration 224 Status

**Applied successfully.** Migration applied to live Supabase production DB via psql; version='224' inserted into `supabase_migrations.schema_migrations`.

psql output (idempotent re-run confirming data already present):
```
BEGIN
NOTICE: Pre-flight passed: NATIONAL_UPPER=1, NATIONAL_LOWER=6, US Senate chambers=1, US House chambers=1
DO
UPDATE 0    -- Wyden external_id already at -4101001
UPDATE 0    -- Merkley external_id already at -4101002
INSERT 0 0  -- Bonamici (ON CONFLICT DO NOTHING)
INSERT 0 0  -- Bentz (same)
INSERT 0 0  -- Dexter (same)
INSERT 0 0  -- Hoyle (same)
INSERT 0 0  -- Bynum (same)
INSERT 0 0  -- Salinas (same)
UPDATE 0    -- office_id back-fill (all already filled)
COMMIT
```

Post-apply count gates:
- `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -4102006 AND -4101001` = **8** (PASS)
- `SELECT COUNT(*) FROM essentials.offices JOIN politicians WHERE external_id BETWEEN -4102006 AND -4101001` = **8** (PASS)

## Politician UUIDs (for Phase 74-03 Headshot Upload)

| External ID | Full Name | Politician UUID | Office UUID |
|-------------|-----------|-----------------|-------------|
| -4101001 | Ron Wyden | 2147281e-e1b1-4416-a5d9-dae9d4f31be0 | ea19f57a-ba47-476f-a5b0-54fae6ffc752 |
| -4101002 | Jeff Merkley | 0eabc969-c1a1-47b7-8d34-6113b723a170 | 3db3e08a-ed6c-4365-9e5a-9af1f94c4372 |
| -4102001 | Suzanne Bonamici | 6ffb9093-7489-4197-aebc-67065c239fc3 | 617febb8-3b45-4787-87af-8b8ecc008b05 |
| -4102002 | Cliff Bentz | fb00c887-11f5-46f2-b822-f9848368bbd2 | 41b9876c-304d-4268-a751-25ea7e2009cc |
| -4102003 | Maxine Dexter | 13dcf1a8-c0bf-4e2f-92aa-46637182b42a | 62cb1965-8401-430c-8681-03a3e22e7c77 |
| -4102004 | Val Hoyle | f6202cef-4e46-4db5-a9c0-c69ac9a8eccd | 94d89181-58c5-42b3-886f-4538131fd461 |
| -4102005 | Janelle Bynum | 7aad2a83-2f05-4570-aa7a-eb7a8c602ebd | 1207f28b-6eea-4113-889c-3127292e29b9 |
| -4102006 | Andrea Salinas | 5f6c498b-87dd-48fe-b744-62c8dced2ac3 | 1e17d814-d999-4399-974c-3b36ec825ba7 |

Storage paths for Phase 74-03: `{politician_uuid}-headshot.jpg`

## Federal Chamber Names + UUIDs (for future federal phase reference)

| Chamber | Exact name (use in WHERE clauses) | UUID |
|---------|-----------------------------------|------|
| US Senate | `U.S. Senate` | 7cbe07bc-84b8-433b-952b-540e7de18a92 |
| US House | `U.S. House of Representatives` | c2facc31-7b13-428c-b7b9-32d0d3b95f76 |

## Senator Shared District_id UUID (for Phase 75 pattern reference)

Both OR senators (Wyden + Merkley) share NATIONAL_UPPER district:
- **district_id**: `1552f454-5342-4460-9127-57ee0973f5e3`
- **geo_id**: `41`
- **district_type**: `NATIONAL_UPPER`
- **state**: `OR`

## Verification Results (Task 3)

### Verification 1 — Full federal roster smoke test

```
 external_id |    full_name     |   party    |            chamber            | district_type  | geo_id | is_appointed_position
     -4101001 | Ron Wyden        | Democrat   | U.S. Senate                   | NATIONAL_UPPER | 41     | f
     -4101002 | Jeff Merkley     | Democrat   | U.S. Senate                   | NATIONAL_UPPER | 41     | f
     -4102001 | Suzanne Bonamici | Democrat   | U.S. House of Representatives | NATIONAL_LOWER | 4101   | f
     -4102002 | Cliff Bentz      | Republican | U.S. House of Representatives | NATIONAL_LOWER | 4102   | f
     -4102003 | Maxine Dexter    | Democrat   | U.S. House of Representatives | NATIONAL_LOWER | 4103   | f
     -4102004 | Val Hoyle        | Democrat   | U.S. House of Representatives | NATIONAL_LOWER | 4104   | f
     -4102005 | Janelle Bynum    | Democrat   | U.S. House of Representatives | NATIONAL_LOWER | 4105   | f
     -4102006 | Andrea Salinas   | Democrat   | U.S. House of Representatives | NATIONAL_LOWER | 4106   | f
(8 rows)
```

**PASS:** 8 rows, 2 NATIONAL_UPPER (geo_id='41') + 6 NATIONAL_LOWER (4101-4106), all is_appointed_position=false, 7 Democrat + 1 Republican (Bentz). 'Tobias Read' not in output (correct — Plan 01 range).

### Verification 2 — Senator shared district_id

```
 distinct_district_ids | senator_offices
                     1 |               2
(1 row)
```

**PASS:** Both senators share exactly 1 NATIONAL_UPPER district_id; 2 office rows confirmed.

### Verification 3 — office_id back-fill

```
 unfilled
        0
(1 row)
```

**PASS:** All 8 politicians have office_id back-filled.

### Verification 4 — Address routing smoke test

```
    full_name     | external_id | geo_id | district_type
 Suzanne Bonamici |    -4102001 | 4101   | NATIONAL_LOWER
(1 row)
```

**PASS:** Portland City Hall (-122.6794, 45.5231) routes to Suzanne Bonamici, CD-01, geo_id='4101'. End-to-end routing confirmed: geofence_boundaries → districts → offices → politicians.

### Verification 5 — Section-split detector

**346 rows returned — PRE-EXISTING CONDITION (not caused by migration 224).**

Same 346 rows documented in Phase 74-01-SUMMARY: pre-existing from Phase 72 TIGER load. Two categories:
1. County/legislative (G4020/G5210/G5220) with district_count=2-3 — normal multi-district routing
2. OR city G4110 geo_ids with district_count=0 — cities not yet seeded (Phase 76-77 scope)

Migration 224 introduces 0 new geofence_boundaries rows. This condition predates Plan 02.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Deviation] Senators pre-existed under different external_ids**
- **Found during:** Task 1 (pre-flight)
- **Issue:** Ron Wyden (external_id=-400065) and Jeff Merkley (external_id=-400066) already existed in DB with correct offices already linked to the NATIONAL_UPPER OR district (geo_id='41'). Standard INSERT path would fail on the NOT EXISTS guard or create duplicate records.
- **Fix:** Migration STEP 2 uses UPDATE to set external_ids to canonical -4101001/-4101002 scheme. No new politician/office INSERTs for senators. The senator-specific INSERT+office blocks were not executed.
- **Files modified:** 224_or_federal_officials.sql (STEP 2 uses UPDATE not CTE INSERT)
- **Commit:** 98f9f73

**2. [Rule 1 - Pre-existing] Section-split detector returns 346 rows**
- **Found during:** Task 3 (Verification 5)
- **Issue:** Section-split detector query returned 346 rows. Plan expected 0.
- **Fix:** Not a bug from this migration — documented pre-existing condition from Phase 72 TIGER load. Same condition noted in 74-01-SUMMARY. OR city governments are Phase 76-77 scope.
- **Not a defect of migration 224.**

## Next Migration

**Next migration is 225** (headshots audit SQL for OR federal officials — AUDIT-ONLY, not in migration ledger sequence per Phase 74 research plan).

## Known Stubs

None — all 8 politician rows have full data (name, party, external_id, office_id, is_active, is_incumbent).

## Threat Flags

No new security-relevant surface introduced. Migration 224 adds data rows only (politician/office inserts + external_id updates). No new endpoints, auth paths, or schema changes.

## Self-Check: PASSED

- [x] Migration file exists: C:/EV-Accounts/backend/migrations/224_or_federal_officials.sql
- [x] 8 politicians confirmed in DB (external_id BETWEEN -4102006 AND -4101001)
- [x] 8 offices confirmed in DB (JOIN via politician_id)
- [x] Senator shared district confirmed (1 distinct district_id for 2 senator offices)
- [x] 0 unfilled office_id columns
- [x] Portland routing confirmed: Suzanne Bonamici
- [x] Migration version '224' in schema_migrations ledger
- [x] Task 2 commit: 98f9f73
- [x] Task 3 commit: 08ed599

---
*Phase: 74-or-executives-federal*
*Plan: 02*
*Completed: 2026-05-29*
