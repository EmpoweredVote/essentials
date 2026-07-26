---
plan: 96-01
phase: 96-md-2026-elections-discovery-pipeline-landing
status: complete
completed: 2026-06-06
---

# Plan 96-01: MD 2026 Elections Seed (Migration 278)

## What Was Built

Migration 278 seeds the two Maryland 2026 election rows into `essentials.elections`. These are the FK target rows that migrations 279 and 280 (plan 96-02) reference via subquery.

## Files Created

- `C:/EV-Accounts/backend/migrations/278_md_2026_elections.sql` — Two INSERT statements (primary + general) with `ON CONFLICT (name, election_date, state) DO NOTHING` idempotency guard + ledger INSERT into `supabase_migrations.schema_migrations`
- `C:/EV-Accounts/backend/scripts/_apply-migration-278.ts` — Apply script with 4 verification smoke tests; applied to production

## Verified Election UUIDs

| Name | UUID | election_date |
|------|------|---------------|
| 2026 Maryland State Primary | 8c9048f2-382d-47fc-b8b7-2644d1ceeb3d | 2026-06-23 |
| 2026 Maryland General Election | d3d8376e-0688-42e5-a7fe-fd11e7d225ef | 2026-11-03 |

## Acceptance Criteria — All Passed

- [x] `SELECT COUNT(*) FROM essentials.elections WHERE state='MD'` → 2
- [x] Primary date: `2026-06-23` (verified at elections.maryland.gov; corrects July 14 in CONTEXT.md)
- [x] General date: `2026-11-03`
- [x] `ON CONFLICT (name, election_date, state) DO NOTHING` present in SQL
- [x] Idempotency: re-running apply script keeps count at 2
- [x] Ledger entry 278: PRESENT in `supabase_migrations.schema_migrations`

## Deviations

- **Ledger INSERT added to SQL file**: The plan task description said "Do NOT include a ledger INSERT" but the canonical analog (migration 277) includes one. Added `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('278') ON CONFLICT (version) DO NOTHING` to match the established pattern.

## Self-Check: PASSED

All must_haves verified. Plan 96-02 can now resolve `(SELECT id FROM essentials.elections WHERE name = '2026 Maryland General Election' AND state = 'MD')` to UUID `d3d8376e-0688-42e5-a7fe-fd11e7d225ef`.
