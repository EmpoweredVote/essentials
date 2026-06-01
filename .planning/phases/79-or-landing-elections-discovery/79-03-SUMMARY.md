---
phase: 79-or-landing-elections-discovery
plan: 3
subsystem: database
tags: [oregon, elections, legislature, races, migration, powershell-generator]

requires:
  - phase: 79-02
    provides: 8 OR statewide race rows; total OR races = 8 before this plan

provides:
  - "30 OR State Senate race rows (SD-01..SD-30) in essentials.races for OR 2026 General"
  - "60 OR State House race rows (HD-01..HD-60) in essentials.races for OR 2026 General"
  - "Migration 239 applied to production Supabase; total OR races = 98"
  - "PowerShell generator generate_or_legislative_races.ps1 (reusable)"
  - "district_type disambiguation verified: SD-01 office_id e319ea99 != HD-01 office_id 74263a7b"

affects: [79-04, 79-05]

tech-stack:
  added: []
  patterns:
    - "PowerShell generator with UTF-8 NoBOM WriteAllLines for 90-block SQL batch"
    - "district_type STATE_UPPER/STATE_LOWER disambiguation in office subquery (Pitfall 1 resolved)"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING — idempotent DO blocks"

key-files:
  created:
    - "supabase/migrations/generate_or_legislative_races.ps1"
    - "supabase/migrations/239_or_legislative_races.sql"
    - "C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1"
    - "C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql"
  modified: []

key-decisions:
  - "district_type disambiguation is critical: SD-01 and HD-01 both use geo_id='41001'; STATE_UPPER/STATE_LOWER resolves them to different office_ids"
  - "Generator outputs general-only (90 rows), unlike ME Phase 55 which had primary+general (372 rows)"
  - "UTF-8 NoBOM via [System.IO.File]::WriteAllLines + UTF8Encoding($false) — Out-File -Encoding UTF8 forbidden due to BOM"
  - "Section-split check 240 is pre-existing baseline from Phase 72 TIGER load; not a regression from migration 239"

requirements-completed: []

duration: 6min
completed: 2026-05-30
---

# Phase 79 Plan 03: OR 2026 Legislative Race Scaffold Summary

**90 OR legislative race rows seeded in production via migration 239: 30 Senate (SD-01..SD-30) + 60 House (HD-01..HD-60), all linked to OR 2026 General with correct disambiguated office_ids; total OR races now 98**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-30T18:19:28Z
- **Completed:** 2026-05-30T18:25:35Z
- **Tasks:** 3
- **Files created:** 4 (generator .ps1 x2 locations, SQL x2 locations)

## Accomplishments

- PowerShell generator `generate_or_legislative_races.ps1` written with both loops (Senate 1..30, House 1..60), district_type disambiguation, UTF-8 NoBOM emission
- Generator executed successfully: produced `239_or_legislative_races.sql` (1534 lines, 90 DO blocks, 63,376 bytes, no BOM)
- Migration 239 applied to production Supabase via psql; all 90 DO blocks returned `DO`
- All 90 race rows have non-null office_ids (district_type disambiguation succeeded)
- Disambiguation spot-check confirmed: OR State Senate District 1 → office_id `e319ea99-cbf5-40b3-a848-184c06e19f64` (STATE_UPPER / Oregon Senate); OR State House District 1 → office_id `74263a7b-afde-4ca7-9b91-e442472a01f2` (STATE_LOWER / Oregon House of Representatives)
- Idempotency confirmed: re-applying migration returns 90 `DO` but count stays at 98
- race_candidates for all 90 legislative rows = 0 (D-11 compliant)
- Section-split check = 240 (pre-existing baseline unchanged)

## Final OR Race Count After Migration 239

| Category | Count | Cumulative |
|----------|-------|------------|
| Governor + US Senate + US House (Plans 01-02) | 8 | 8 |
| OR State Senate SD-01..SD-30 (this plan) | 30 | 38 |
| OR State House HD-01..HD-60 (this plan) | 60 | 98 |
| **Total OR races** | | **98** |

Expected after Plan 79-04 (Portland city races): 105

## District-Type Disambiguation Spot-Check (CRITICAL Pitfall 1)

| position_name | office_id | district_type | chamber |
|---------------|-----------|---------------|---------|
| OR State Senate District 1 | e319ea99-cbf5-40b3-a848-184c06e19f64 | STATE_UPPER | Oregon Senate |
| OR State House District 1 | 74263a7b-afde-4ca7-9b91-e442472a01f2 | STATE_LOWER | Oregon House of Representatives |

Both rows exist (2 rows returned). Office IDs are different. Each resolves to the correct chamber via district_type. Pitfall 1 fully mitigated.

## Verification Results

| Check | Query | Expected | Actual | Pass? |
|-------|-------|----------|--------|-------|
| Total OR races | SELECT COUNT(*) WHERE e.state='OR' | 98 | 98 | YES |
| Senate count | LIKE 'OR State Senate District %' | 30 | 30 | YES |
| House count | LIKE 'OR State House District %' | 60 | 60 | YES |
| NULL office_ids | WHERE office_id IS NULL (legislative) | 0 | 0 | YES |
| Disambiguation SD-01 vs HD-01 | spot-check 2 rows | different office_ids | different (e319ea99 vs 74263a7b) | YES |
| Idempotency re-run | re-apply migration 239 | count stays 98 | 98 | YES |
| Section-split check | geofence_boundaries orphans | 0 (pre-existing 240) | 240 | PRE-EXISTING |
| race_candidates for legislative | SELECT COUNT(*) WHERE Senate/House | 0 | 0 | YES |

## Generator Script Usage (for future re-runs)

```powershell
# Run from migrations directory:
cd C:/EV-Accounts/backend/migrations
powershell -ExecutionPolicy Bypass -File generate_or_legislative_races.ps1
# Outputs: 239_or_legislative_races.sql (90 DO blocks, UTF-8 NoBOM)
```

Generator script path: `C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1`
Also tracked in git: `supabase/migrations/generate_or_legislative_races.ps1`

## Task Commits

1. **Task 1: Write PowerShell generator** - `6603c5a` (feat)
2. **Task 2: Generate SQL** - `7ed60c6` (feat)
3. **Task 3: Apply migration 239 to Supabase** - DB-only operation; captured in SUMMARY commit

## Files Created/Modified

- `supabase/migrations/generate_or_legislative_races.ps1` - Generator script (committed 6603c5a)
- `supabase/migrations/239_or_legislative_races.sql` - 90 DO blocks, 1534 lines (committed 7ed60c6)
- `C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1` - EV-Accounts copy (not git-tracked per project convention)
- `C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql` - EV-Accounts copy (not git-tracked)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Verification] Forbidden string 'Out-File -Encoding UTF8' in comment**
- **Found during:** Task 1 automated verification
- **Issue:** The acceptance criteria verification script checks for the literal string `Out-File -Encoding UTF8` as a forbidden pattern (to ensure the BOM-emitting approach is not present). The original generator comment included this exact string as a documentation anti-example.
- **Fix:** Rewrote the comment to avoid the forbidden literal while retaining the documentation intent: changed `-- NOT Out-File -Encoding UTF8 / Out-File -Encoding UTF8 writes a BOM...` to `-- the PowerShell default Out-File appends a BOM...`
- **Files modified:** C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1, supabase/migrations/generate_or_legislative_races.ps1
- **Verification:** Re-ran node verification script — passed OK

## Migration 239 Ledger Confirmation

Migration 239 applied to production Supabase on 2026-05-30 via psql (DATABASE_URL from C:/EV-Accounts/backend/.env).

Migration is tracked via:
- `supabase/migrations/239_or_legislative_races.sql` in git (committed 7ed60c6)
- `C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql` in EV-Accounts

## Next Phase Readiness

- Plan 79-04 (7 Portland city races) can proceed — total OR races currently 98, expected 105 after Plan 04
- Plan 79-05 (discovery_jurisdictions) unblocked
- Plan 79-06 (verification) will confirm final counts across all plans

## Threat Flags

None — pure data migration. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries.

## Self-Check: PASSED

- supabase/migrations/generate_or_legislative_races.ps1: FOUND
- supabase/migrations/239_or_legislative_races.sql: FOUND
- C:/EV-Accounts/backend/migrations/generate_or_legislative_races.ps1: FOUND
- C:/EV-Accounts/backend/migrations/239_or_legislative_races.sql: FOUND
- Commit 6603c5a (Task 1): FOUND
- Commit 7ed60c6 (Task 2): FOUND
- DB: 90 legislative race rows confirmed in production Supabase
- Total OR race count: 98 (8 statewide + 90 legislative)
- All 90 office_ids non-null (NULL check = 0)
- Senate/House split: 30/60 confirmed
- Disambiguation: SD-01 office_id != HD-01 office_id, correct chambers
- Idempotency: re-run count stays 98
- race_candidates for legislative = 0

---
*Phase: 79-or-landing-elections-discovery*
*Plan: 03*
*Completed: 2026-05-30*
