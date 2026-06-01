---
phase: 84-multnomah-smaller-cities
reviewed: 2026-06-01T06:20:53Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql
  - C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts
  - C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql
findings:
  critical: 1
  warning: 4
  info: 5
  total: 10
status: issues_found
---

# Phase 84: Code Review Report

**Reviewed:** 2026-06-01T06:20:53Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the government seeding migration (246), the TypeScript smoke test, and the audit-only headshots migration (247).

The state casing, district type, apostrophe escaping, chamber slug exclusion, office_id back-fill strategy, and post-verification EXCEPTION gates are all correctly implemented. The critical issue is a silent data-loss path in the `ON CONFLICT DO NOTHING` + CTE + CROSS JOIN office-insert pattern used for all 31 officials: on any re-run where a politician row already exists, the office INSERT is silently skipped even if the office was never written. The smoke test has a missing mtfcc filter that could produce false SC2 results against a production database.

---

## Critical Issues

### CR-01: CTE `ON CONFLICT DO NOTHING` silently skips office INSERT on re-run

**File:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql:87-116` (and all 30 analogous blocks)

**Issue:** Every politician+office block uses this pattern:

```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians (...)
  VALUES (...)
  ON CONFLICT (external_id) DO NOTHING
  RETURNING id          -- returns ZERO ROWS when the conflict fires
)
INSERT INTO essentials.offices (...)
SELECT ...
FROM essentials.districts d
CROSS JOIN ins_p p      -- CROSS JOIN of zero rows = zero rows
WHERE ... AND p.id IS NOT NULL  -- never reached
  AND NOT EXISTS (...);
```

When `ON CONFLICT DO NOTHING` fires (politician already exists from a prior partial run), the CTE returns no rows. The `CROSS JOIN ins_p p` therefore produces an empty result set, and the office INSERT emits zero rows — silently, with no error. The `p.id IS NOT NULL` guard does not rescue this: when the CTE is empty, there are no rows to filter at all.

The failure scenario: a prior run created the politician row but crashed or was rolled back after committing that row (e.g., Supabase timeout mid-transaction). On re-run, the politician INSERT fires `DO NOTHING`, the CTE is empty, and the office for that politician is never created. The post-verification gate (Gate b1-b5) will catch this and raise an EXCEPTION — but only if the exact expected office count is wrong. If another office was inserted by a different path, the count check could pass with a ghost official.

**Fix:** Replace the silent `DO NOTHING` with a `DO UPDATE` that touches a no-op column and always returns the existing id, or use a two-step approach: INSERT the politician, then lookup the existing id unconditionally:

```sql
WITH ins_p AS (
  INSERT INTO essentials.politicians
    (id, full_name, first_name, last_name, party, is_active, is_appointed,
     is_vacant, is_incumbent, external_id)
  VALUES (gen_random_uuid(), 'Travis Stovall', 'Travis', 'Stovall', NULL,
          true, false, false, true, -4131251)
  ON CONFLICT (external_id) DO UPDATE
    SET is_active = EXCLUDED.is_active   -- no-op but forces RETURNING to fire
  RETURNING id
)
INSERT INTO essentials.offices (...)
SELECT ...
FROM essentials.districts d
CROSS JOIN ins_p p
WHERE ...;
```

Alternatively, replace the CTE entirely with a subquery lookup:

```sql
INSERT INTO essentials.politicians (...) VALUES (...)
ON CONFLICT (external_id) DO NOTHING;

INSERT INTO essentials.offices (...)
SELECT gen_random_uuid(),
       d.id, (SELECT id FROM essentials.chambers WHERE ...), 
       (SELECT id FROM essentials.politicians WHERE external_id = -4131251),
       'Mayor', 'OR', false, false, NULL
FROM essentials.districts d
WHERE d.geo_id = '4131250'
  AND d.district_type = 'LOCAL_EXEC'
  AND d.state = 'or'
  AND NOT EXISTS (
    SELECT 1 FROM essentials.offices o
    JOIN essentials.politicians p2 ON p2.id = o.politician_id
    WHERE o.district_id = d.id AND p2.external_id = -4131251
  );
```

The subquery form is safer because it never depends on the CTE having returned rows.

---

## Warnings

### WR-01: `queryLocalOfficials` missing `gb.mtfcc` filter — potential duplicate rows

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts:132-143`

**Issue:** The SC2 query joins `geofence_boundaries` on `gb.geo_id = d.geo_id` with no `AND gb.mtfcc = 'G4110'` filter. If a city geo_id (e.g., `4131250`) exists in `geofence_boundaries` under more than one mtfcc code, the spatial ST_Covers check will run against all matching boundary rows, and the query will return duplicate `full_name` rows (one per matching boundary geometry). This would cause the SC2 count check to fail with "got 14 officials, expected 7" for Gresham, or produce false unexpected-name entries. The boundary load from Phase 72 loaded G4110 for these 5 cities, but the query has no defense if any of these geo_ids also appear under another mtfcc.

**Fix:**

```typescript
const res = await client.query<{ full_name: string; district_type: string }>(
  `SELECT p.full_name, d.district_type
   FROM essentials.politicians p
   JOIN essentials.offices o ON o.politician_id = p.id
   JOIN essentials.districts d ON d.id = o.district_id
   JOIN essentials.geofence_boundaries gb ON gb.geo_id = d.geo_id
                                          AND gb.mtfcc = 'G4110'   -- ADD THIS
   WHERE gb.state = '41'
     AND d.district_type IN ('LOCAL', 'LOCAL_EXEC')
     AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
   ORDER BY p.full_name`,
  [lon, lat],
);
```

---

### WR-02: Pre-flight guard emits NOTICE instead of EXCEPTION — double-apply proceeds silently

**File:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql:26-38`

**Issue:** The pre-flight DO block raises `RAISE NOTICE` when it detects existing government rows, then continues. This means a double-application of the migration proceeds past the guard and attempts all 31 INSERT blocks. Because RAISE NOTICE does not abort execution in PL/pgSQL, the only protection against a corrupted double-apply is the per-INSERT WHERE NOT EXISTS guards — which are correct, but the pre-flight's stated purpose is to warn of a re-run, not silently allow one. In Supabase's migration runner, NOTICE messages are easy to miss.

**Fix:** Change the pre-flight to abort:

```sql
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM essentials.governments
      WHERE name IN (
        'City of Gresham, Oregon, US',
        'City of Troutdale, Oregon, US',
        'City of Fairview, Oregon, US',
        'City of Wood Village, Oregon, US',
        'City of Maywood Park, Oregon, US'
      )) > 0 THEN
    RAISE EXCEPTION 'Migration 246 already applied — aborting re-run';
  END IF;
END $$;
```

If idempotent re-runs are intentionally supported, rename the block to "idempotency check" and document that the WHERE NOT EXISTS guards handle safety — but don't call it a "Pre-flight" guard that implies a hard stop.

---

### WR-03: `process.exit(1)` in pre-flight leaks DB connection

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts:171-176`

**Issue:** When the pre-flight boundary count check fails (line 171), the code calls `process.exit(1)` immediately inside the `try` block. The `finally` block at line 293 (`await client.end()`) never runs because `process.exit` terminates the process before the finally clause executes. The Postgres connection is leaked to the server until it times out.

```typescript
// Lines 171-175
if (pfCount !== 5) {
  console.error(`Pre-flight FAIL: ...`);
  process.exit(1);   // <-- finally block never reached
}
```

**Fix:** Call `client.end()` before exiting, or restructure to throw an error that the finally block catches:

```typescript
if (pfCount !== 5) {
  console.error(`Pre-flight FAIL: not all 5 G4110 city boundaries loaded (found ${pfCount})`);
  await client.end();
  process.exit(1);
}
```

---

### WR-04: Audit-only migration 247 has no transaction wrapper — accidental application partially commits

**File:** `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql:1-322`

**Issue:** The file header prominently warns "DO NOT apply via Supabase ledger," but the file contains no `BEGIN`/`COMMIT` block and no guard that would cause it to fail fast if accidentally applied. If run directly (e.g., via `psql -f`), each of the 19 INSERT statements executes in autocommit mode. A mid-run failure (network drop, constraint error) leaves some inserts committed and others not, producing a partially-headshot state that is difficult to diagnose. Other headshot migrations in this project (e.g., 245_multnomah_county_headshots.sql per the header comment) should be checked to see if they include a transaction wrapper.

**Fix:** Add a safety abort at the top of the file:

```sql
-- Safety guard: this file is AUDIT-ONLY. Abort if run directly.
DO $$
BEGIN
  RAISE EXCEPTION 'Migration 247 is AUDIT-ONLY and must not be applied. Actual DB writes happened live via scripts/_tmp-cities-headshots.py.';
END $$;
```

This makes accidental application a hard error rather than a silent partial write.

---

## Info

### IN-01: `forbiddenMtfcc` interface field is declared but never evaluated

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts:22`

**Issue:** The `AddressTest` interface declares `forbiddenMtfcc?: string[]`, but no code in the test loop checks this field. No test entry populates it. The field is dead interface surface area.

**Fix:** Either implement the check (iterate `addr.forbiddenMtfcc` and assert none are in `returnedMtfcc`), or remove the field from the interface.

---

### IN-02: SC2 count mismatch and name mismatch produce overlapping error messages

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts:239-263`

**Issue:** When `officials.length !== expectedNames.length`, the code logs a count-mismatch error and continues (no `continue` or early exit). It then also computes and logs `missingNames`/`unexpectedNames` errors. A single SC2 failure can emit two or three overlapping messages for the same root cause, making the output harder to read.

**Fix:** Add a `continue` after the count-mismatch error push, or gate the name-diff checks on count equality:

```typescript
if (officials.length !== expectedNames.length) {
  const msg = `SC2 FAIL: ${addr.label}: got ${officials.length} officials, expected ${expectedNames.length}`;
  errors.push(msg);
  allPassed = false;
  // fall through to name checks anyway — name lists provide the useful detail
}
// The name checks below are still useful even when counts differ
```

Alternatively, log the count discrepancy only as part of the name-diff output so there is one coherent message per city.

---

### IN-03: `ssl: { rejectUnauthorized: false }` disables TLS certificate verification

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts:153`

**Issue:** TLS cert validation is disabled. This is a known pattern for Supabase pooler connections from this codebase, so it is not unexpected, but it means the smoke test cannot detect a man-in-the-middle on the DB connection during execution.

**Fix:** No immediate action required given project conventions; document in the script comment that this matches the established pattern from other smoke tests in the codebase.

---

### IN-04: office_id back-fill UPDATE has no ORDER BY / LIMIT on the offices join

**File:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql:1274-1285`

**Issue:** `UPDATE essentials.politicians p SET office_id = o.id FROM essentials.offices o WHERE o.politician_id = p.id AND ...` — if a politician somehow has two office rows (not expected in normal operation, but possible from a partial prior run), PostgreSQL will pick an arbitrary `o.id` to write into `office_id`. The result is non-deterministic.

**Fix:** Add a subquery that selects the most-recently-inserted office (or the one linked to the specific district types used in this migration):

```sql
UPDATE essentials.politicians p
SET office_id = (
  SELECT o.id FROM essentials.offices o
  WHERE o.politician_id = p.id
  ORDER BY o.id   -- deterministic tie-breaker
  LIMIT 1
)
WHERE p.external_id IN ( ... )
  AND p.office_id IS NULL;
```

---

### IN-05: Migration 247 summary comment counts are correct but "Maywood Park 0" is listed in the uploaded count

**File:** `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql:319`

**Issue:** Line 319 reads `Headshots uploaded: 19 (Gresham 7, Troutdale 7, Wood Village 5, Maywood Park 0)`. Including "Maywood Park 0" in the uploaded-count parenthetical is misleading — it implies Maywood Park was attempted. The "No photo documented: 12 (Fairview 7, Maywood Park 5)" line on 320 is the correct place for that. Minor documentation inconsistency only.

**Fix:** Change to `Headshots uploaded: 19 (Gresham 7, Troutdale 7, Wood Village 5)`.

---

_Reviewed: 2026-06-01T06:20:53Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
