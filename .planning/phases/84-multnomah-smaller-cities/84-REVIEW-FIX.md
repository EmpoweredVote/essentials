---
phase: 84-multnomah-smaller-cities
fixed_at: 2026-05-31T07:15:00Z
review_path: .planning/phases/84-multnomah-smaller-cities/84-REVIEW.md
iteration: 1
fix_scope: critical_warning
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Phase 84: Code Review Fix Report

**Fixed at:** 2026-05-31T07:15:00Z
**Source review:** .planning/phases/84-multnomah-smaller-cities/84-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5
- Fixed: 5
- Skipped: 0

## Fixed Issues

### CR-01: CTE `ON CONFLICT DO NOTHING` silently skips office INSERT on re-run

**Files modified:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql`
**Commit:** b93c434
**Applied fix:** Replaced all 31 occurrences of `ON CONFLICT (external_id) DO NOTHING` with `ON CONFLICT (external_id) DO UPDATE SET is_active = EXCLUDED.is_active` so the CTE RETURNING clause always fires and returns the politician id (existing or newly inserted). Also removed the now-redundant `AND p.id IS NOT NULL` guard from each office INSERT WHERE clause since the CTE can no longer return zero rows.

---

### WR-01: `queryLocalOfficials` missing `gb.mtfcc` filter — potential duplicate rows

**Files modified:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts`
**Commit:** 22d50f0
**Applied fix:** Added `AND gb.mtfcc = 'G4110'` as a JOIN condition on the `geofence_boundaries` join in `queryLocalOfficials`, preventing duplicate rows if a city geo_id exists under multiple mtfcc codes in the boundaries table.

---

### WR-02: Pre-flight guard emits NOTICE instead of EXCEPTION — double-apply proceeds silently

**Files modified:** `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql`
**Commit:** 5865b59
**Applied fix:** Changed `RAISE NOTICE 'One or more city government rows already exist — idempotent re-run'` to `RAISE EXCEPTION 'Migration 246 already applied — aborting re-run'`. Also updated the section comment from "idempotency guard" to "hard abort guard" to match the new behavior.

---

### WR-03: `process.exit(1)` in pre-flight leaks DB connection

**Files modified:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts`
**Commit:** 7cab2ca
**Applied fix:** Added `await client.end()` immediately before `process.exit(1)` in the pre-flight boundary count failure branch, ensuring the Postgres connection is cleanly released before the process terminates (the `finally` block does not run when `process.exit` is called).

---

### WR-04: Audit-only migration 247 has no transaction wrapper / safety guard

**Files modified:** `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql`
**Commit:** f794abe
**Applied fix:** Added a `DO $$ BEGIN RAISE EXCEPTION '...' END $$;` block at the top of the file (after the header comment, before the first INSERT section). Any accidental direct application via `psql -f` will now immediately fail with a descriptive error rather than partially committing rows in autocommit mode.

---

## Skipped Issues

None.

---

_Fixed: 2026-05-31T07:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
