---
phase: 85-multnomah-elections-discovery
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql
  - C:/EV-Accounts/backend/scripts/_apply-migration-251.ts
  - C:/EV-Accounts/backend/migrations/252_multnomah_discovery.sql
  - C:/EV-Accounts/backend/scripts/_apply-migration-252.ts
  - C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts
findings:
  critical: 2
  warning: 3
  info: 1
  total: 6
status: issues_found
---

# Phase 85: Code Review Report

**Reviewed:** 2026-06-01T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 85 seeds 18 race rows across Multnomah County and 5 smaller cities (migration 251) and registers a discovery jurisdiction for the county (migration 252). The migration SQL logic is structurally sound — ON CONFLICT clauses are correctly formed against the partial unique index established in migration 044, election UUID lookup is resilient, and the post-verify blocks will catch missing rows. Two correctness bugs stand out: both migration files are missing top-level transaction wrappers (partial-failure risk), and the smoke test's Assertion E (D-14 Corbett address check) queries all 6 Multnomah geo_ids as if a Corbett resident would be shown races for all incorporated cities — which is incorrect and gives a false-passing result. Three warnings round out quality and robustness issues.

---

## Critical Issues

### CR-01: Migration 251 has no top-level transaction — partial failure leaves orphan rows

**File:** `C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql:1`

**Issue:** The file wraps inserts in two `DO $$ ... END $$` PL/pgSQL blocks but has no outer `BEGIN;` / `COMMIT;` transaction. The two anonymous blocks each run in auto-commit mode. If the first block succeeds (inserting up to 18 race rows) but the second block raises (the post-verify assertion fails), those 18 rows are already committed and cannot be rolled back. The database ends up in an inconsistent partially-seeded state requiring manual cleanup.

Compare migration 100 (`100_collin_county_may2026_races.sql` line 19), which wraps an equivalent pattern in `BEGIN; ... COMMIT;` at the top level. The PL/pgSQL `DO $$` blocks themselves participate in the outer transaction when one exists.

**Fix:** Wrap the entire file in a top-level transaction:

```sql
BEGIN;

DO $$
DECLARE
  v_general_id UUID;
BEGIN
  -- ... existing first block unchanged ...
END $$;

DO $$
DECLARE
  v_county_count INTEGER;
  v_city_count INTEGER;
BEGIN
  -- ... existing post-verify block unchanged ...
END $$;

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('251')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### CR-02: Smoke test Assertion E (D-14) uses an incorrect query that will always pass even if the routing logic is broken

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts:162-186`

**Issue:** The D-14 assertion is supposed to verify that a Corbett OR unincorporated address (which falls inside Multnomah County but outside any incorporated city) surfaces at least 18 races. The query does this by counting `DISTINCT` race rows reachable through any of the 6 geo_ids: `41051` (county) plus all 5 city geo_ids (`4131250`, `4174850`, `4124250`, `4183950`, `4146730`).

This is wrong in two ways:

1. A Corbett resident (unincorporated Multnomah County) should NOT be shown city races for Gresham, Troutdale, Fairview, Wood Village, or Maywood Park — they do not live in those cities. The 16 city race rows should not appear on their ballot.

2. The assertion passes trivially because it counts all 18 rows seeded in migration 251 (2 county + 16 city), which reaches `>= 18`. The actual backend routing path (geofence lookup via ST_Contains or geo_id match) is never exercised. A resident who is actually inside Gresham would see Gresham races, not a Corbett unincorporated resident.

The correct D-14 check for a Corbett unincorporated address should query only the county geo_id (`41051`) and verify that at least 2 county race rows are returned (the only races that legitimately apply). The `>= 18` threshold and inclusion of city geo_ids is a logic error that makes the test vacuously true.

**Fix:**

```typescript
// Assertion E — Corbett unincorporated: only county races apply (geo_id=41051)
const rE = await client.query<{ geo_id: string; position_name: string }>(
  `SELECT DISTINCT g.geo_id, r.position_name
   FROM essentials.races r
   JOIN essentials.offices o ON o.id = r.office_id
   JOIN essentials.chambers c ON c.id = o.chamber_id
   JOIN essentials.governments g ON g.id = c.government_id
   JOIN essentials.elections e ON e.id = r.election_id
   WHERE e.name = 'OR 2026 General'
     AND g.geo_id = '41051'`  -- county only; unincorporated Corbett residents see county races
);
const corbettRaceCount = rE.rows.length;
// Corbett is unincorporated: should see 2 county races (Chair + Commissioner D2)
if (corbettRaceCount < 2) {
  errors.push(`FAIL: Corbett county-only query yielded ${corbettRaceCount} race rows, expected >= 2`);
  allPassed = false;
}
```

If the intent is to also test that a Gresham resident sees all of: county races + their city races, that is a separate assertion requiring a separate geo_id set (`['41051', '4131250']`) and a threshold of `2 + 4 = 6`.

---

## Warnings

### WR-01: Migration 252 has no top-level transaction

**File:** `C:/EV-Accounts/backend/migrations/252_multnomah_discovery.sql:1`

**Issue:** Like migration 251, migration 252 has no `BEGIN;` / `COMMIT;` wrapper. The file performs two statements (an `INSERT ... WHERE NOT EXISTS` and a ledger `INSERT`). If the ledger insert fails (e.g., schema_migrations table issue), the discovery_jurisdictions row is already committed with no way to roll it back automatically. The risk is lower than migration 251 (only 2 statements vs. 20+), but the pattern is still inconsistent with established project practice and should be corrected for uniformity.

**Fix:**

```sql
BEGIN;

INSERT INTO essentials.discovery_jurisdictions ...;  -- existing statement unchanged

INSERT INTO supabase_migrations.schema_migrations (version)
VALUES ('252')
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

---

### WR-02: Post-verify count thresholds in migration 251 are not tight enough — could silently pass with pre-existing data from a re-run

**File:** `C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql:136-148`

**Issue:** The post-verify block checks `v_county_count < 2` and `v_city_count < 16`. These are lower-bound checks, not exact checks. If migration 251 was partially applied in a previous run (say 10 city rows landed before a crash), a re-run with `ON CONFLICT DO NOTHING` would add the missing rows, and the post-verify would pass at `>= 16`. This is acceptable behavior. However, if a prior migration had already seeded some of these same city names into the same election from a different source, the count could be `>= 16` without this migration having contributed all its rows, masking a silent identity conflict.

More concretely: if, hypothetically, `Gresham Mayor` was already seeded by a different migration, `ON CONFLICT DO NOTHING` silently skips it, and the count still passes even though this migration's rows are not all in the DB with this migration's `office_id` values. The root correctness risk is the office_id values — those are hardcoded UUIDs and are the most important thing to verify.

**Fix:** After the count checks, add a spot-check on at least one critical office_id to confirm the row actually landed with the correct office_id (not a pre-existing row with a different office_id that happened to match on position_name):

```sql
-- Spot-check: confirm Multnomah Chair race has the expected office_id
DECLARE
  v_chair_office_id UUID;
BEGIN
  SELECT o.id INTO v_chair_office_id
  FROM essentials.races r
  JOIN essentials.elections e ON e.id = r.election_id
  JOIN essentials.offices o ON o.id = r.office_id
  WHERE e.name = 'OR 2026 General'
    AND r.position_name = 'Multnomah County Chair';

  IF v_chair_office_id IS DISTINCT FROM '4b4821cf-9a97-4044-8132-706290d22e27'::uuid THEN
    RAISE EXCEPTION 'Multnomah Chair race has unexpected office_id: %', v_chair_office_id;
  END IF;
END;
```

---

### WR-03: Apply script 251 catches the error but does not distinguish between constraint violations (idempotent re-run) and genuine failures

**File:** `C:/EV-Accounts/backend/scripts/_apply-migration-251.ts:35-38`

**Issue:** The `catch` block catches `any` error, logs `e.message`, and exits with code 1. This is correct behavior, but because the SQL migration has no top-level transaction (see CR-01), a partial failure that commits some rows before raising an exception will log an error message and exit 1, leaving the operator to manually identify which rows landed and which did not. There is no rollback, no idempotency indicator in the message, and no suggestion of what to clean up. Combined with the missing transaction, this can leave the DB in an ambiguous state silently.

This warning resolves automatically if CR-01 is fixed (the transaction will roll back everything on error), but if CR-01 is not fixed, the catch block should at minimum log the partial state by querying the race row count before exiting:

```typescript
} catch (e: any) {
  console.error('Error applying migration 251:', e.message);
  // Partial-state diagnostic: show how many rows landed before the error
  try {
    const diag = await pool.query(
      `SELECT COUNT(*) as cnt FROM essentials.races r
       JOIN essentials.elections e ON e.id = r.election_id
       WHERE e.name = 'OR 2026 General'
         AND r.position_name ~ '(Multnomah County|Gresham|Troutdale|Fairview|Wood Village|Maywood Park)'`
    );
    console.error('Partial rows in DB at time of error:', diag.rows[0].cnt);
  } catch (_) { /* ignore secondary failure */ }
  process.exit(1);
}
```

---

## Info

### IN-01: Smoke test Assertion D queries discovery_jurisdictions without election_date filter — would return wrong row if multiple rows exist for geo_id 41051

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts:99-104`

**Issue:** Assertion D's detail query selects `WHERE jurisdiction_geoid = '41051'` without also filtering on `election_date = '2026-11-03'`. If future elections add another `41051` row for a different election cycle (e.g., a 2028 general), `rD.rows[0]` would be whatever Postgres returns first (undefined ordering without `ORDER BY`), potentially checking the wrong row's values and giving a false pass or false fail.

Assertion C (the count check) does include the election_date filter; the inconsistency only affects Assertion D's detail verification.

**Fix:**

```typescript
const rD = await client.query<{ ... }>(
  `SELECT jurisdiction_name, source_url, allowed_domains, state
   FROM essentials.discovery_jurisdictions
   WHERE jurisdiction_geoid = '41051' AND election_date = '2026-11-03'`
                                        // ^^^ add election_date filter
);
```

---

_Reviewed: 2026-06-01T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
