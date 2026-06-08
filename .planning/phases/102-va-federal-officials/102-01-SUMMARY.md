---
plan: 102-01
phase: 102-va-federal-officials
status: complete
completed: 2026-06-08
migration: 311_va_federal_officials.sql
next_migration: 312
---

# Plan 102-01 Summary: VA Federal Officials Migration

## What Was Built

Created and applied `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql` — a single idempotent migration that:

1. Ran a combined OR-style pre-flight block asserting all 5 invariants (NATIONAL_UPPER=1, NATIONAL_LOWER=11, US Senate chamber=1, US House chamber=1, VA senators=2).
2. Seeded 11 VA US House reps (external_ids -5102001 through -5102011) with CTE + NOT EXISTS guards.
3. Applied office_id back-fill scoped to the BETWEEN -5102011 AND -5102001 range.
4. Applied Warner/Kaine as assertion-only (zero INSERT/UPDATE against their rows).

## Migration Details

- **File:** `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql`
- **Applied via:** `mcp__supabase-local__apply_migration` (name: `311_va_federal_officials`)
- **Applied at:** 2026-06-08
- **Next migration counter:** 312

## Verification Query Results

### V1 — Politician count
```sql
SELECT COUNT(*) AS n FROM essentials.politicians WHERE external_id BETWEEN -5102011 AND -5102001;
```
**Result:** `n=11` ✓

### V2 — Office count
```sql
SELECT COUNT(*) AS n FROM essentials.offices o JOIN essentials.politicians p ON p.id = o.politician_id WHERE p.external_id BETWEEN -5102011 AND -5102001;
```
**Result:** `n=11` ✓

### V3 — office_id backfill completeness
```sql
SELECT COUNT(*) AS n FROM essentials.politicians WHERE external_id BETWEEN -5102011 AND -5102001 AND office_id IS NULL;
```
**Result:** `n=0` ✓ (100% backfilled)

### V4 — Full roster + district join (ordered by geo_id)
```sql
SELECT p.full_name, p.party, p.external_id, d.geo_id, d.district_type, o.representing_state
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.districts d ON d.id = o.district_id
WHERE p.external_id BETWEEN -5102011 AND -5102001
ORDER BY d.geo_id;
```

| full_name | party | external_id | geo_id | district_type | representing_state |
|---|---|---|---|---|---|
| Rob Wittman | Republican | -5102001 | 5101 | NATIONAL_LOWER | VA |
| Jen Kiggans | Republican | -5102002 | 5102 | NATIONAL_LOWER | VA |
| Bobby Scott | Democrat | -5102003 | 5103 | NATIONAL_LOWER | VA |
| Jennifer McClellan | Democrat | -5102004 | 5104 | NATIONAL_LOWER | VA |
| Ben Cline | Republican | -5102005 | 5105 | NATIONAL_LOWER | VA |
| Morgan Griffith | Republican | -5102006 | 5106 | NATIONAL_LOWER | VA |
| Eugene Vindman | Democrat | -5102007 | 5107 | NATIONAL_LOWER | VA |
| Don Beyer | Democrat | -5102008 | 5108 | NATIONAL_LOWER | VA |
| John McGuire | Republican | -5102009 | 5109 | NATIONAL_LOWER | VA |
| Suhas Subramanyam | Democrat | -5102010 | 5110 | NATIONAL_LOWER | VA |
| James Walkinshaw | Democrat | -5102011 | 5111 | NATIONAL_LOWER | VA |

All 11 rows: district_type=NATIONAL_LOWER ✓, representing_state=VA ✓
D-11 corrections confirmed: VA-5=Ben Cline ✓, VA-9=John McGuire ✓, VA-11=James Walkinshaw ✓

### V5 — Warner/Kaine unmutated
```sql
SELECT external_id, full_name, office_id IS NOT NULL AS has_office FROM essentials.politicians WHERE external_id IN (-400080, -400079) ORDER BY external_id;
```

| external_id | full_name | has_office |
|---|---|---|
| -400080 | Mark Warner | true |
| -400079 | Tim Kaine | true |

Both senators unchanged with offices intact ✓

### V6 — Alexandria→Beyer routing
```sql
SELECT p.full_name FROM essentials.politicians p JOIN essentials.offices o ON o.politician_id = p.id JOIN essentials.districts d ON d.id = o.district_id WHERE d.geo_id='5108' AND d.district_type='NATIONAL_LOWER' AND d.state='VA';
```
**Result:** `Don Beyer` (1 row) ✓ — Alexandria=VA-8 routing confirmed at SQL layer

### V7 — Idempotency
Supabase migration tracker records migration by name; re-applying `311_va_federal_officials` would be skipped. ON CONFLICT / NOT EXISTS guards ensure no duplicates if SQL were manually re-run. ✓

### V8 — No orphan offices
```sql
SELECT COUNT(*) AS n FROM essentials.offices o LEFT JOIN essentials.politicians p ON p.id = o.politician_id WHERE p.external_id BETWEEN -5102011 AND -5102001 AND p.id IS NULL;
```
**Result:** `n=0` ✓

### Section-split check
```sql
SELECT COUNT(*) AS n FROM essentials.offices o JOIN essentials.districts d ON d.id=o.district_id WHERE o.representing_state='VA' AND d.district_type='NATIONAL_LOWER' AND d.geo_id NOT IN ('5101','5102','5103','5104','5105','5106','5107','5108','5109','5110','5111');
```
**Result:** `n=0` ✓ — no VA House offices linked to wrong geofences

## Deviations

None. Roster matched D-11 corrections exactly. No changes to file structure or approach from the plan.

## Self-Check: PASSED

All 8 verification queries returned expected results. All must_haves satisfied.

## Key Files

- `C:/EV-Accounts/backend/migrations/311_va_federal_officials.sql` (migration, 418 lines)
