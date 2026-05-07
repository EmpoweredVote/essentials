---
phase: 27-judicial-compass-db
plan: 01
subsystem: database
tags: [postgres, supabase, migrations, compass, judicial]

# Dependency graph
requires:
  - phase: 25-compass-scope-wiring
    provides: compass_topic_roles role_scope constraint pattern (federal/state/local)
  - phase: 22-compass-scope-audit
    provides: compass schema audit — confirmed scope lives in compass_topic_roles not compass_stances
provides:
  - judicial_role column on inform.compass_topics (nullable, CHECK judge|city_attorney_da)
  - chk_role_scope_tier constraint expanded to include 'judicial' scope value
  - 4 universal judicial compass topics live in DB (criminal-justice, access-to-justice, government-deference, transparency)
  - 20 stances seeded (5 per topic, values 1-5)
  - 4 compass_topic_roles rows with role_scope='judicial'
  - Migration 112 applied to production
  - Migration 113 file (Part A) ready for Plan 27-02 extension
affects:
  - phase: 27-02 (Plan 27-02 extends migration 113 with 4 role-specific topics)
  - phase: 27-03 (applies migration 113 to production after Part B is added)
  - phase: 28 (wires JUDICIAL districtScope to compass filtering)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Judicial compass topic DO $$ idempotency: RETURN early if topic_key exists with is_live=true"
    - "judicial_role=NULL encodes universal topics (applies to all judicial sub-roles)"
    - "Apply script pre-check: test column existence in information_schema before running migration"

key-files:
  created:
    - C:\EV-Accounts\backend\migrations\112_judicial_compass_schema.sql
    - C:\EV-Accounts\backend\migrations\113_judicial_compass_topics.sql
    - C:\EV-Accounts\backend\scripts\_apply-migration-112.ts
  modified: []

key-decisions:
  - "Constraint name confirmed chk_role_scope_tier — matches plan expectation; no rename needed"
  - "judicial_role=NULL for all 4 universal topics (not a string default — NULL encodes universality)"
  - "Migration 113 left open-ended with Part B comment — Plan 27-02 will append 4 more DO $$ blocks"
  - "Apply script pre-check tests information_schema.columns (not a data row) — correct pattern for schema migrations"

patterns-established:
  - "Schema migration apply script pattern: pre-check column in information_schema, post-verify column + constraint"
  - "Judicial topic idempotency: IF EXISTS on topic_key + is_live=true before inserting topic/stances/role rows"

# Metrics
duration: 2min
completed: 2026-05-07
---

# Phase 27 Plan 01: Judicial Compass DB Schema Foundation Summary

**judicial_role column + expanded role_scope CHECK constraint applied to production; 4 universal judicial compass topics with 20 stances and 4 role rows seeded in migration 113**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-07T03:34:35Z
- **Completed:** 2026-05-07T03:36:42Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Migration 112 authored and applied to production: `judicial_role` nullable TEXT column on `inform.compass_topics` with CHECK constraint (`'judge'|'city_attorney_da'`); `chk_role_scope_tier` expanded to accept `'judicial'` as a valid `role_scope` value
- Migration 113 Part A authored: 4 universal judicial compass topics seeded with full 5-stance text each and one `role_scope='judicial'` row per topic; `judicial_role=NULL` for all 4 (universal)
- Apply script `_apply-migration-112.ts` written and confirmed: pre-check skips if already applied; post-verify confirms column nullable + constraint clause; "All checks passed." on first run

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 112 (schema changes)** - `c46036b` (feat)
2. **Task 2: Write migration 113 part A (4 universal topics + 20 stances + 4 role rows)** - `1480b70` (feat)
3. **Task 3: Write apply script and apply migration 112** - `587f2b8` (feat)

## Files Created/Modified

- `C:\EV-Accounts\backend\migrations\112_judicial_compass_schema.sql` - Schema migration: judicial_role column + expanded chk_role_scope_tier constraint; BEGIN/COMMIT wrapped; schema-only
- `C:\EV-Accounts\backend\migrations\113_judicial_compass_topics.sql` - Content migration Part A: 4 DO $$ blocks for universal judicial topics; Part B placeholder for Plan 27-02
- `C:\EV-Accounts\backend\scripts\_apply-migration-112.ts` - Apply script with pre-check + post-verify; applied live

## Decisions Made

- Constraint name `chk_role_scope_tier` confirmed via `information_schema.check_constraints` query before writing migration — matches plan expectation exactly
- `judicial_role = NULL` encodes "universal" (not a string default). NULL is the correct semantic for "applies to all judicial roles"
- Migration 113 file structure: Part A is a complete standalone `BEGIN; ... COMMIT;` block. Plan 27-02 will extend the file by appending 4 more `DO $$` blocks before the final `COMMIT;`. A comment marks the Part B insertion point.
- Apply script uses `information_schema.columns` for pre-check (schema presence, not data presence) — correct pattern for schema-only migrations

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Migration 112 is live in production: `judicial_role` column + `'judicial'` scope value ready for use
- Migration 113 Part A content is authored and validated; file is ready for Plan 27-02 to append Part B (4 role-specific topics)
- Plan 27-02 should append its 4 DO $$ blocks to `113_judicial_compass_topics.sql` before the `-- Part B` comment and before the closing `COMMIT;`
- Plan 27-03 applies migration 113 to production after both parts are complete

---
*Phase: 27-judicial-compass-db*
*Completed: 2026-05-07*
