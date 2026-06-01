---
phase: 85-multnomah-elections-discovery
plan: "01"
subsystem: database
tags:
  - sql-migration
  - elections
  - multnomah
dependency_graph:
  requires:
    - "C:/EV-Accounts/backend/migrations/244_multnomah_county_government.sql (county office_ids)"
    - "C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql (city office_ids)"
    - "essentials.elections row 'OR 2026 General' (id=de10e3a7-f5c2-47e6-acd7-ee87be9413db)"
  provides:
    - "18 race rows in essentials.races for OR 2026 General (2 county + 16 city)"
    - "Migration ledger entry version='251'"
  affects:
    - "essentials.races"
    - "supabase_migrations.schema_migrations"
tech_stack:
  added: []
  patterns:
    - "DO $$ DECLARE block for PL/pgSQL migration (migration 240 pattern)"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING (partial index guard)"
    - "Post-verify DO block with RAISE EXCEPTION on count mismatch"
    - "pg.Pool + readFileSync apply script pattern (migration 244 pattern)"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-251.ts"
  modified: []
decisions:
  - "seats=1 for all 18 rows — RCV is an election method, not a multi-seat structure"
  - "primary_party=NULL for all 18 rows — nonpartisan races + general election convention"
  - "Seat numbers (Seat 1/2/3) researcher-assigned for at-large councils (Troutdale, Wood Village, Maywood Park) — no official position numbers exist"
  - "County Auditor and County Sheriff excluded — no office rows exist in DB for these positions"
  - "Wood Village Mayor and Maywood Park Mayor excluded — both are council-selected (is_appointed_position=true)"
metrics:
  duration: "10 minutes"
  completed_date: "2026-06-01"
  tasks_completed: 2
  files_created: 2
---

# Phase 85 Plan 01: Multnomah Elections Race Rows Summary

Migration 251 seeds 18 race rows for the OR 2026 November General election covering Multnomah County Chair + Commissioner District 2 and council/mayor seats for all 5 smaller incorporated cities (Gresham, Troutdale, Fairview, Wood Village, Maywood Park).

## What Was Built

### Task 1: Migration 251 SQL

`C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql`

Single DO $$ DECLARE block containing 18 INSERT statements into essentials.races. Structure:

- Header comment with row count breakdown
- SELECT election_id by name+state (resilient to DB restore)
- RAISE EXCEPTION guard if election row is missing
- 18 INSERT statements: 2 county + 4 Gresham + 3 Troutdale + 4 Fairview + 2 Wood Village + 3 Maywood Park
- Every INSERT ends with `ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`
- Post-verify DO block: RAISE EXCEPTION if county_rows < 2 or city_rows < 16
- Ledger entry: `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('251') ON CONFLICT (version) DO NOTHING`

### Task 2: Apply Script + Migration Applied

`C:/EV-Accounts/backend/scripts/_apply-migration-251.ts`

pg.Pool apply script following _apply-migration-244.ts pattern exactly. Runs 251_multnomah_elections.sql then logs three verification counts.

**Apply script output (first run):**
```
Migration 251 applied successfully
County race rows: 2 (expected 2)
City race rows: 16 (expected 16)
Ledger entry: 1 (expected 1)
```

**Idempotency check (second run — same counts, zero duplicates):**
```
Migration 251 applied successfully
County race rows: 2 (expected 2)
City race rows: 16 (expected 16)
Ledger entry: 1 (expected 1)
```

## Race Rows Inserted

| City / Area | Position Name | Office_ID |
|-------------|---------------|-----------|
| Multnomah County | Multnomah County Chair | 4b4821cf-9a97-4044-8132-706290d22e27 |
| Multnomah County | Multnomah County Commissioner District 2 | 3f01e9e8-bac6-4f0c-9793-ed14fbe2b22b |
| Gresham | Gresham Mayor | 4658f141-8cfd-4739-a959-23322a3182e7 |
| Gresham | Gresham City Council Position 2 | be91f6d5-b46f-4ca2-9605-a1eb62b47c01 |
| Gresham | Gresham City Council Position 4 | 3c3cc31d-384e-4837-bd72-5c43faca3bc8 |
| Gresham | Gresham City Council Position 6 | 4cf1b2b1-e005-48d7-b8a4-67040d8199cd |
| Troutdale | Troutdale City Council Seat 1 | 0b80a890-44f1-47be-bf6b-b17fc3eef9cb |
| Troutdale | Troutdale City Council Seat 2 | f291ef52-c368-472c-bce1-948e803eaf23 |
| Troutdale | Troutdale City Council Seat 3 | 10292aee-a4c1-4a74-88b2-b85e3ff40722 |
| Fairview | Fairview Mayor | 0ff020a1-224f-4363-9c2f-8944b12ffcf2 |
| Fairview | Fairview City Council Position 4 | 15f9aaf4-3d4b-4f34-9213-cb3a8ca19e94 |
| Fairview | Fairview City Council Position 5 | 15da3e65-a69f-429b-b0db-c4d450fb1c71 |
| Fairview | Fairview City Council Position 6 | db927fb8-7627-4a22-b486-9888c22559b4 |
| Wood Village | Wood Village City Council Seat 1 | 8e42ac99-e2bb-4ea5-b8f6-02372ca0b4a6 |
| Wood Village | Wood Village City Council Seat 2 | c6c3259e-8883-4893-9fe4-50384d131f72 |
| Maywood Park | Maywood Park City Council Seat 1 | 23370dd5-9602-40b7-a820-74fd4b5055a1 |
| Maywood Park | Maywood Park City Council Seat 2 | bec2352c-e2ff-46c9-bdda-bd5bf13ae254 |
| Maywood Park | Maywood Park City Council Seat 3 | bbd553e7-1e67-4504-96dc-5f5c017eabd5 |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all 18 race rows are fully materialized with real office_ids and position_names from verified production DB data.

## Threat Flags

None — this plan writes to essentials.races via developer-privileged DATABASE_URL. No new public-facing API surface introduced. No secrets stored.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql` exists
- [x] `C:/EV-Accounts/backend/scripts/_apply-migration-251.ts` exists
- [x] Apply script output confirms: County race rows: 2, City race rows: 16, Ledger entry: 1
- [x] Idempotency check passed: re-run counts unchanged
- [x] Post-verify DO block in migration raises on count mismatch (RAISE EXCEPTION path)
- [x] 18 INSERT statements (grep -c confirmed 18)
- [x] 18 ON CONFLICT clauses (grep -c confirmed 18)
- [x] No reference to County Auditor, County Sheriff, Wood Village Mayor, Maywood Park Mayor, or Council President Bussema
- [x] No INSERT INTO essentials.elections (SELECT-only)
- [x] Ledger entry version='251' in supabase_migrations.schema_migrations
