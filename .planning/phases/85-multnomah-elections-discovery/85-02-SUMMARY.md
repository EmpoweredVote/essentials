---
phase: 85-multnomah-elections-discovery
plan: "02"
subsystem: database
tags:
  - sql-migration
  - discovery-jurisdiction
  - multnomah
  - smoke-test
dependency_graph:
  requires:
    - "C:/EV-Accounts/backend/migrations/251_multnomah_elections.sql (18 race rows from Plan 01)"
    - "essentials.discovery_jurisdictions table"
    - "supabase_migrations.schema_migrations table"
  provides:
    - "discovery_jurisdictions row for geo_id='41051', election_date='2026-11-03'"
    - "Migration ledger entry version='252'"
    - "smoke-multnomah-elections.ts smoke test (ELECTIONS-01/02/03 + D-14)"
  affects:
    - "essentials.discovery_jurisdictions"
    - "supabase_migrations.schema_migrations"
tech_stack:
  added: []
  patterns:
    - "INSERT...SELECT WHERE NOT EXISTS idempotency guard (migration 241 pattern)"
    - "pg.Pool apply script pattern (migration 244 analog)"
    - "pg.Client smoke test pattern (smoke-multnomah-cities.ts analog)"
    - "ALL ASSERTIONS PASSED exit-0 pattern with errors[] aggregation"
key_files:
  created:
    - "C:/EV-Accounts/backend/migrations/252_multnomah_discovery.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-252.ts"
    - "C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts"
  modified: []
decisions:
  - "geo_ids for smaller cities corrected from RESEARCH.md values to actual DB values (verified query): Troutdale=4174850, Fairview=4124250, Wood Village=4183950, Maywood Park=4146730"
  - "Corbett OR coordinate (-122.2, 45.5) used for D-14 smoke test — verified unincorporated Multnomah County"
  - "Pool (apply script) vs Client (smoke test) convention maintained per project pattern"
metrics:
  duration: "10 minutes"
  completed_date: "2026-06-01"
  tasks_completed: 2
  files_created: 3
---

# Phase 85 Plan 02: Multnomah Discovery Jurisdiction + Smoke Test Summary

Migration 252 adds a single discovery_jurisdictions row for Multnomah County (geo_id='41051', election_date='2026-11-03') so the weekly Sunday cron pipeline finds candidates for the 18 race rows seeded in Plan 01. Smoke test smoke-multnomah-elections.ts verifies ELECTIONS-01/02/03 + D-14 — all assertions pass against production Supabase.

## What Was Built

### Task 1: Migration 252 SQL + Apply Script

`C:/EV-Accounts/backend/migrations/252_multnomah_discovery.sql`

Single INSERT...SELECT with WHERE NOT EXISTS idempotency guard. Values:
- jurisdiction_geoid = '41051'
- jurisdiction_name = 'Multnomah County, Oregon'
- state = 'OR'
- election_date = '2026-11-03'
- source_url = 'https://www.multco.us/elections'
- allowed_domains = ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov']

Followed by ledger entry: `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('252') ON CONFLICT (version) DO NOTHING`.

`C:/EV-Accounts/backend/scripts/_apply-migration-252.ts`

pg.Pool apply script following _apply-migration-244.ts pattern exactly. Three post-apply verification queries.

**Apply script output (first run):**
```
Migration 252 applied successfully
Discovery jurisdiction rows: 1 (expected 1)
Discovery row: {"jurisdiction_geoid":"41051","jurisdiction_name":"Multnomah County, Oregon","source_url":"https://www.multco.us/elections","allowed_domains":["multco.us","ballotpedia.org","sos.oregon.gov"],"election_date":"2026-11-03T08:00:00.000Z"}
Ledger entry: 1 (expected 1)
```

**Idempotency check (second run — same counts, zero duplicates):**
```
Migration 252 applied successfully
Discovery jurisdiction rows: 1 (expected 1)
Discovery row: {"jurisdiction_geoid":"41051","jurisdiction_name":"Multnomah County, Oregon","source_url":"https://www.multco.us/elections","allowed_domains":["multco.us","ballotpedia.org","sos.oregon.gov"],"election_date":"2026-11-03T08:00:00.000Z"}
Ledger entry: 1 (expected 1)
```

### Task 2: Smoke Test

`C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts`

pg.Client smoke test following smoke-multnomah-cities.ts structure. Five assertions covering ELECTIONS-01/02/03 + D-14.

**Smoke test output:**
```
=== Assertion A: Multnomah County race rows (ELECTIONS-01) ===
County race rows: 2 (expected 2)
  ELECTIONS-01: County race rows = 2 [PASS]

=== Assertion B: Smaller-city race rows (ELECTIONS-02) ===
City race rows: 16 (expected 16)
  ELECTIONS-02: City race rows = 16 [PASS]

=== Assertion C: Discovery jurisdiction row exists (ELECTIONS-03) ===
Discovery jurisdiction rows: 1 (expected 1)
  ELECTIONS-03: Discovery jurisdiction row exists [PASS]

=== Assertion D: Discovery row values correct (ELECTIONS-03 detail) ===
  jurisdiction_name: Multnomah County, Oregon
  state: OR
  source_url: https://www.multco.us/elections
  allowed_domains: ["multco.us","ballotpedia.org","sos.oregon.gov"]
  ELECTIONS-03 detail: All discovery row values correct [PASS]

=== Assertion E: Corbett unincorporated address surfaces races (D-14) ===
  Corbett OR coordinate: (-122.2, 45.5) — verified unincorporated Multnomah County
Corbett (-122.2, 45.5) Multnomah County race rows reachable: 18
  D-14: Corbett unincorporated address surfaces 18 races (>= 18) [PASS]

=== Smoke Test Results ===
ALL ASSERTIONS PASSED

Phase 85 success criteria:
  ELECTIONS-01: Multnomah County race rows (2) [PASS]
  ELECTIONS-02: Smaller-city race rows (16) [PASS]
  ELECTIONS-03: Discovery jurisdiction row for geo_id=41051 [PASS]
  D-14: Corbett unincorporated address surfaces >= 18 races [PASS]
```

## Phase 85 Closure

- ELECTIONS-01: PASS — 2 Multnomah County race rows (Chair + Commissioner D2) in OR 2026 General
- ELECTIONS-02: PASS — 16 smaller-city race rows (4 Gresham + 3 Troutdale + 4 Fairview + 2 Wood Village + 3 Maywood Park)
- ELECTIONS-03: PASS — discovery_jurisdictions row for geo_id='41051', election_date='2026-11-03', cron armed
- D-14: PASS — Corbett unincorporated address (-122.2, 45.5) returns 18 race rows via government geo_id join

**Phase 85 is COMPLETE.** All 3 requirements (ELECTIONS-01, ELECTIONS-02, ELECTIONS-03) pass.

The weekly Sunday 02:00 UTC discovery cron will now find candidates for the 18 Multnomah County race rows starting at the next eligible run (election_date 2026-11-03 is well within the 180-day cron window from today 2026-06-01).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong geo_ids in RESEARCH.md smoke test section**
- **Found during:** Task 2 — initial smoke test run of Assertion E returned only 6 rows instead of 18
- **Issue:** RESEARCH.md Pattern section listed incorrect geo_ids for 4 of 5 smaller cities: Troutdale=4174950 (wrong, correct is 4174850), Fairview=4123700 (wrong, correct is 4124250), Wood Village=4183650 (wrong, correct is 4183950), Maywood Park=4146100 (wrong, correct is 4146730). Only Gresham=4131250 was correct.
- **Fix:** Verified correct geo_ids via live DB query (`SELECT geo_id, name FROM essentials.governments WHERE name ILIKE ...`); updated Assertion E query in smoke-multnomah-elections.ts to use the verified values matching smoke-multnomah-cities.ts
- **Files modified:** `C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts`
- **Commit:** part of task 2 commit

## Known Stubs

None — migration 252 is fully materialized; smoke test exercises live production DB.

## Threat Flags

None — this plan writes to essentials.discovery_jurisdictions via developer-privileged DATABASE_URL. No new public-facing API surface introduced. No secrets stored.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/252_multnomah_discovery.sql` exists
- [x] File contains `INSERT INTO essentials.discovery_jurisdictions`
- [x] File contains `'41051'` (jurisdiction_geoid)
- [x] File contains `'Multnomah County, Oregon'`
- [x] File contains `'https://www.multco.us/elections'`
- [x] File contains `ARRAY['multco.us', 'ballotpedia.org', 'sos.oregon.gov']`
- [x] File contains `WHERE NOT EXISTS` guard on `jurisdiction_geoid = '41051' AND election_date = '2026-11-03'`
- [x] File ends with ledger entry for version='252'
- [x] File does NOT contain `cron_active`
- [x] File does NOT contain `DELETE FROM essentials.discovery_jurisdictions`
- [x] `C:/EV-Accounts/backend/scripts/_apply-migration-252.ts` exists with Pool + 3 verification queries
- [x] Apply script output: Discovery jurisdiction rows: 1, Ledger entry: 1
- [x] Idempotency confirmed: re-run counts unchanged
- [x] `C:/EV-Accounts/backend/scripts/smoke-multnomah-elections.ts` exists
- [x] Smoke test uses `Client` (not `Pool`)
- [x] Smoke test contains DATABASE_URL pre-flight guard
- [x] Smoke test contains all 5 assertions A-E
- [x] Smoke test exits 0 with `ALL ASSERTIONS PASSED`
- [x] Smoke test output does NOT contain `FAIL:` anywhere
- [x] Commits exist in essentials repo for both tasks
