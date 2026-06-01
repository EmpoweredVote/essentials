---
phase: 83-multnomah-county-government-routing
reviewed: 2026-05-31T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql
  - C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts
  - C:/EV-Accounts/backend/scripts/_apply-migration-244.ts
  - C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 83: Code Review Report

**Reviewed:** 2026-05-31
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Reviewed the Multnomah County government seeding migration (244), its apply script, the Phase 83 smoke test, and the headshot audit migration (245). The migrations follow established patterns correctly — state case conventions, idempotency guards, and post-verification gates are all sound. Three quality issues are present, none of which block correctness on first apply, but two carry meaningful re-run risk.

---

## Warnings

### WR-01: `office_id` backfill BETWEEN range covers 8 unintended external_id slots

**File:** `C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql:259`

**Issue:** The backfill UPDATE uses `BETWEEN -410013 AND -410001`. In SQL numeric ordering, this range is `>= -410013 AND <= -410001`, which correctly captures all five target IDs (`-410001, -410010, -410011, -410012, -410013`) but also silently matches eight unoccupied IDs: `-410002` through `-410009`. If any future migration uses those external_id slots before this backfill is retired, a re-run of migration 244 would incorrectly set `office_id` on unrelated politicians.

The established pattern in comparable migrations (107, 109, 110, 154, 155, etc.) also uses BETWEEN ranges that span gaps — so this is consistent — but those migrations all span a contiguous block. Here the jump from `-410001` to `-410010` creates 8 gap slots that will be populated by District 5 (if Multnomah County ever adds a fifth commissioner district) or by other county entities in the OR namespace. The `WHERE p.office_id IS NULL` guard limits blast radius but does not eliminate it.

**Fix:** Use an explicit IN list to match only the five actual external_ids, which removes ambiguity entirely:

```sql
UPDATE essentials.politicians p
SET office_id = o.id
FROM essentials.offices o
WHERE o.politician_id = p.id
  AND p.external_id IN (-410001, -410010, -410011, -410012, -410013)
  AND p.office_id IS NULL;
```

---

### WR-02: `_apply-migration-244.ts` has no `DATABASE_URL` guard — silently connects with undefined credentials

**File:** `C:/EV-Accounts/backend/scripts/_apply-migration-244.ts:6`

**Issue:** The Pool is constructed at module scope with `process.env['DATABASE_URL']` without any prior validation. If `DATABASE_URL` is unset, `pg.Pool` accepts `undefined` for `connectionString` and does not throw at construction time; it fails only on the first `pool.query()` call, at which point the error surfaces in the `catch` block with a cryptic connection error rather than a clear "DATABASE_URL not set" message. The companion smoke test (`smoke-multnomah-county.ts` lines 98-101) and older apply scripts (e.g., `_apply-migration-069.ts` lines 16-20) both include an explicit guard.

**Fix:**

```typescript
if (!process.env['DATABASE_URL']) {
  process.stderr.write('ERROR: DATABASE_URL not set\n');
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env['DATABASE_URL'], ssl: { rejectUnauthorized: false } });
```

---

### WR-03: `queryCountyOfficials` smoke query omits `gb.mtfcc = 'G4020'` filter — diverges from production join logic

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts:83-95`

**Issue:** The `queryCountyOfficials` function joins `geofence_boundaries` on `gb.geo_id = d.geo_id` with only `gb.state = '41'` and `d.district_type = 'COUNTY'` as filters. The production `essentialsService.ts` query (line 571) includes an explicit `gb.mtfcc = 'G4020'` constraint when joining for COUNTY districts, preventing cross-matching against other boundary types that share the same `geo_id`. Without the `mtfcc` filter, the smoke query could match additional geofence rows for `geo_id='41051'` if a non-G4020 boundary with that geo_id exists (e.g., a custom X-series geofence), potentially causing the officials count assertion to return more than 5 and falsely fail — or, in an edge case, returning duplicate rows via the unconstrained JOIN.

**Fix:** Add `AND gb.mtfcc = 'G4020'` to the WHERE clause to match production behavior:

```sql
SELECT p.full_name, d.district_type
FROM essentials.politicians p
JOIN essentials.offices o ON o.politician_id = p.id
JOIN essentials.districts d ON d.id = o.district_id
JOIN essentials.geofence_boundaries gb ON gb.geo_id = d.geo_id
  AND gb.mtfcc = 'G4020'
WHERE gb.state = '41'
  AND d.district_type = 'COUNTY'
  AND ST_Covers(gb.geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
ORDER BY p.full_name
```

---

## Info

### IN-01: `245_multnomah_county_headshots.sql` lacks `BEGIN` / `COMMIT` / ledger entry — inconsistency with 225 audit pattern

**File:** `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql:1-86`

**Issue:** Migration 225 (`225_or_headshots.sql`), which is cited in the header as the canonical audit-only pattern, wraps its INSERTs in `BEGIN; ... COMMIT;`. Migration 245 contains no transaction wrapper and no `supabase_migrations.schema_migrations` ledger entry. The header comment says "DO NOT apply via Supabase ledger" — but that refers to the automated runner, not the manual `BEGIN/COMMIT` convention that makes the file safe to replay. Without `BEGIN/COMMIT`, each INSERT is auto-committed individually; a mid-file failure leaves partial writes with no rollback.

**Fix:** Wrap with `BEGIN; ... COMMIT;` to match the 225 pattern. (The ledger entry omission is acceptable for audit-only migrations, consistent with how 225 does it.)

---

### IN-02: Smoke test SC1/SC3 console section header is mislabeled

**File:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-county.ts:154`

**Issue:** The console log at line 154 reads `'=== SC1/SC3: Boundary tests ==='`. SC3 is defined in the file header (line 12-13) as testing the Corbett unincorporated address. The loop at lines 155-215 does iterate over both `TEST_ADDRESSES` entries (Portland and Corbett), so SC3 boundary checks are indeed done here. However, the separate SC3 officials section (lines 252-279) logs `'=== SC3: Corbett OR COUNTY officials ==='` — implying SC3 is split across two sections. This makes it hard to determine at a glance whether SC3 passed or failed when reading console output. Not a correctness issue, but a maintainability concern.

**Fix:** Rename line 154 to `'=== SC1: Portland boundary test ==='` and add a separate `'=== SC3 (boundary): Corbett OR boundary test ==='` label around the Corbett loop iteration, mirroring how SC2 and SC3 officials are each given their own labeled section.

---

_Reviewed: 2026-05-31_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
