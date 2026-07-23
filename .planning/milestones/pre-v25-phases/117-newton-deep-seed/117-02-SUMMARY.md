---
phase: 117-newton-deep-seed
plan: "02"
subsystem: database
tags: [newton, massachusetts, school-committee, migration, seed, school-district]
dependency_graph:
  requires: [117-01-newton-city-government]
  provides: [newton-school-committee, newton-public-schools-government]
  affects: [essentials.governments, essentials.chambers, essentials.districts, essentials.politicians, essentials.offices, essentials.geofence_boundaries]
tech_stack:
  added: []
  patterns: [G5420-geofence-direct-insert, SCHOOL-district-type, WITH-ins-p-CTE-office-insert, ex-officio-subquery-no-new-politician, post-verification-9-gate-DO-block]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/579_newton_school_committee.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-579.ts
    - C:/EV-Accounts/backend/scripts/_verify-migration-579.ts
  modified: []
decisions:
  - "Newton SC members are ward-elected (is_appointed=false) — different from Boston SC (mayor-appointed, is_appointed=true); RESEARCH.md Correction 2 is Boston-specific only"
  - "Mayor Laredo reuses existing politician row (external_id=-2545560001) from migration 578; no second INSERT; subquery pattern for Block 9 ex-officio office"
  - "office_id back-fill explicitly excludes external_id=-2545560001; Mayor's canonical office_id remains LOCAL_EXEC from migration 578"
  - "geo_id='2508610' (NCES LEAID) used for school district — different from city geo_id='2545560'; G5420 geofence inserted directly (no TIGER loader)"
  - "9 gates in post-verification DO block — gate (i) new vs Boston 348 pattern, explicitly validates Mayor's LOCAL_EXEC office_id was not overwritten"
metrics:
  duration: "~15m"
  completed: "2026-06-14"
  tasks_completed: 1
  files_created: 3
---

# Phase 117 Plan 02: Newton School Committee Seed Summary

**One-liner:** Newton Public Schools school committee seeded — 8 ward-elected members + Mayor Laredo ex-officio linkage via migration 579, G5420 geofence, SCHOOL district, 9 offices, all 9 verification gates PASSED.

## What Was Built

Migration 579 (`579_newton_school_committee.sql`) seeds the Newton Public Schools school committee:

- 1 `essentials.geofence_boundaries` row: geo_id='2508610', mtfcc='G5420', state='25' (MA FIPS)
- 1 `essentials.governments` row: `Newton Public Schools, Massachusetts, US` (type=LOCAL, state=MA, geo_id=2508610)
- 1 `essentials.chambers` row: `School Committee` / `Newton School Committee`
- 1 `essentials.districts` row: district_type='SCHOOL', state='ma', geo_id='2508610', label='Newton Public Schools', mtfcc='G5420'
- 8 new `essentials.politicians` rows: external_ids -2508610001 through -2508610008 (ward-elected SC members, is_appointed=false)
- 9 `essentials.offices` rows: 8 elected SC members linked to SCHOOL district + 1 Mayor ex-officio (subquery on existing external_id=-2545560001)
- office_id back-fill: all 8 new SC politicians have non-NULL office_id; Mayor Laredo's office_id unchanged (still LOCAL_EXEC)

**School Committee structure:**
| External ID | Name | Ward | Title |
|-------------|------|------|-------|
| -2508610001 | Arrianna Proia | Ward 1 | School Committee Member |
| -2508610002 | Linda Swain | Ward 2 | School Committee Member |
| -2508610003 | Jason Bhardwaj | Ward 3 | School Committee Vice Chair |
| -2508610004 | Tamika Olszewski | Ward 4 | School Committee Member |
| -2508610005 | Ben Schlesinger | Ward 5 | School Committee Member |
| -2508610006 | Jonathan Greene | Ward 6 | School Committee Member |
| -2508610007 | Alicia Piedalue | Ward 7 | School Committee Chair |
| -2508610008 | Victor Lee | Ward 8 | School Committee Member |
| -2545560001 | Marc C. Laredo | Ex officio | Mayor (ex officio) |

## Verification Results

Post-verification DO block (9 gates) embedded in migration SQL — all PASSED on first run.
Standalone verify script (`_verify-migration-579.ts`) confirmed all 9 gates + 2 extra checks:

| Gate | Check | Result | Expected |
|------|-------|--------|----------|
| (a) | NPS government rows | 1 | 1 |
| (b) | School Committee chamber | 1 | 1 |
| (c) | SCHOOL district rows | 1 | 1 |
| (d) | SC politicians (elected range) | 8 | 8 |
| (e) | Total SCHOOL offices | 9 | 9 |
| (f) | Section-split orphans | 0 | 0 |
| (g) | NULL office_ids (SC range) | 0 | 0 |
| (h) | G5420 geofence | 1 | 1 |
| (i) | Mayor LOCAL_EXEC office_id intact | 1 | 1 |
| Extra | Mayor seeded exactly once | 1 | 1 |
| Extra | Mayor full_name | Marc C. Laredo | Marc C. Laredo |
| Ledger | schema_migrations entry '579' | PRESENT | PRESENT |

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write + apply migration 579 | (SUMMARY commit) | 579_newton_school_committee.sql, _apply-migration-579.ts, _verify-migration-579.ts |

Note: Migration files are in C:/EV-Accounts/backend/migrations/ (not a git repo per project rules). Planning artifacts committed to essentials repo.

## Deviations from Plan

None — plan executed exactly as written. Boston SC migration 348 pattern applied cleanly with Newton-specific adaptations (is_appointed=false for elected members, ex-officio subquery for Mayor). All pre-flight, post-verification (9 gates), and smoke-test checks passed on first run.

## Known Stubs

None — all 8 elected SC members seeded with correct names, titles, and office linkages. Mayor Laredo's ex-officio SCHOOL office inserted using existing politician row. Migration 579 is a complete, self-verified deliverable.

## Threat Flags

No new security-relevant surface introduced. Migration 579 is INSERT-only SQL with WHERE NOT EXISTS idempotency guards. Pre-flight RAISE EXCEPTION blocks abort on dirty state (T-117-03 mitigated: Mayor subquery used, no duplicate insert possible). office_id back-fill range excludes -2545560001 (T-117-04 mitigated: gate (i) confirms Mayor's LOCAL_EXEC office_id unchanged). geo_id='2508610' explicitly checked in all queries (T-117-05 mitigated: pre-flight + all district JOINs specify geo_id='2508610'). No new network endpoints or auth paths.

## Self-Check

- [x] Migration file exists: C:/EV-Accounts/backend/migrations/579_newton_school_committee.sql
- [x] Apply script exists: C:/EV-Accounts/backend/scripts/_apply-migration-579.ts
- [x] Verify script exists: C:/EV-Accounts/backend/scripts/_verify-migration-579.ts
- [x] Migration applied to production DB (apply script completed without error)
- [x] Post-verification DO block raised NOTICE (all 9 gates PASSED)
- [x] 8 new SC politicians in external_id range -2508610001..-2508610008
- [x] 9 offices linked to geo_id=2508610 SCHOOL district
- [x] G5420 geofence present (geo_id='2508610', mtfcc='G5420', state='25')
- [x] Section-split = 0 (Newton G5420 geofence has matching SCHOOL district row)
- [x] 0 NULL office_ids for SC range
- [x] Mayor Laredo (external_id=-2545560001) seeded exactly once total
- [x] Mayor's office_id points to LOCAL_EXEC district from migration 578 (gate (i) PASS)
- [x] Ledger entry '579' PRESENT in supabase_migrations.schema_migrations

## Self-Check: PASSED
