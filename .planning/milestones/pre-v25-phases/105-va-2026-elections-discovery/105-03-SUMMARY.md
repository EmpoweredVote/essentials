---
plan: 105-03
phase: 105-va-2026-elections-discovery
status: complete
completed: 2026-06-09
duration: 3m
tasks_completed: 2
files_created: 2
files_modified: 1
requirements:
  - VA-ELECTIONS-03
tags:
  - discovery
  - landing
  - jsx
  - sql
  - virginia
  - va-2026
key_decisions:
  - "Migration 325 follows MD migration 281 pattern verbatim; jurisdiction_geoid='51' (2-digit FIPS, not '5100000')"
  - "tsx invoked via node backend/node_modules/tsx/dist/cli.mjs (same backend-dir pattern as plans 01+02)"
  - "Alexandria dual-tier geo_ids: 5101000 (G4110 incorporated place) + 51510 (G4020 county-equivalent independent city)"
---

# Phase 105 Plan 03: VA 2026 Discovery Jurisdictions + Landing.jsx (Migration 325)

## What Was Built

Migration 325 arms Virginia's 2026 federal discovery cron by seeding 2 rows into `essentials.discovery_jurisdictions`. The Landing.jsx COVERAGE_CITIES array gains Alexandria as the 11th entry, making Virginia visible on the public landing page. This completes Phase 105 (v12.0 VA milestone).

## Files Created

- `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` — 2 VA discovery_jurisdictions rows + post-verify DO $$ block + ledger INSERT
- `C:/EV-Accounts/backend/scripts/_apply-migration-325.ts` — Apply script with 5 smoke tests; applied to production

## Files Modified

- `src/pages/Landing.jsx` — Alexandria/Virginia entry added after Leonardtown/Maryland in COVERAGE_CITIES (line 25)

## Apply Script Output (All 5 Smoke Tests Passed)

```
Migration 325 applied successfully
VA discovery_jurisdictions rows: 2 (expected 2)
VA election dates: [ '2026-08-04', '2026-11-03' ]
(expected: 2026-08-04, 2026-11-03)
allowed_domains length (primary): 4 (expected 4)
source_url (primary): https://ballotpedia.org/United_States_Congress_elections_in_Virginia,_2026
(expected: https://ballotpedia.org/United_States_Congress_elections_in_Virginia,_2026)
Ledger entry 325: PRESENT
```

Idempotency confirmed: re-running keeps row count at 2 (ON CONFLICT DO NOTHING).

## Landing.jsx Diff

```diff
  { label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' },
+ { label: 'Alexandria', state: 'Virginia', browseGovernmentList: ['5101000', '51510'], browseStateAbbrev: 'VA' },
];
```

Alexandria entry at line 25 (after Leonardtown at line 24).

## Build Output

```
✓ built in 12.97s
```

Pre-existing chunk size warning (1,242 kB) is acceptable per MD Phase 96 Plan 03 precedent.

## Task 2 Commit

- `fa11b5a` — `feat(105-03): add Virginia (Alexandria) to Landing.jsx COVERAGE_CITIES`

## Acceptance Criteria — All Passed

### Task 1: Migration 325

- [x] File `C:/EV-Accounts/backend/migrations/325_va_2026_discovery.sql` exists
- [x] SQL contains `jurisdiction_geoid` value `'51'`
- [x] SQL contains `'Commonwealth of Virginia'`
- [x] SQL contains `'2026-08-04'`
- [x] SQL contains `'2026-11-03'`
- [x] SQL contains `'https://ballotpedia.org/United_States_Congress_elections_in_Virginia,_2026'`
- [x] SQL contains `ARRAY['ballotpedia.org', 'vpap.org', 'elections.virginia.gov', 'virginia.gov']`
- [x] SQL contains `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING`
- [x] SQL does NOT contain `cron_active` (D-03 from MD Phase 96)
- [x] SQL contains `RAISE EXCEPTION 'Expected 2 VA discovery_jurisdictions rows`
- [x] SQL contains `VALUES ('325')` (ledger entry)
- [x] File `C:/EV-Accounts/backend/scripts/_apply-migration-325.ts` exists and references `325_va_2026_discovery.sql`
- [x] Apply script prints `VA discovery_jurisdictions rows: 2 (expected 2)`
- [x] Apply script prints `VA election dates:` followed by `[ '2026-08-04', '2026-11-03' ]`
- [x] Apply script prints `allowed_domains length (primary): 4 (expected 4)`
- [x] Apply script prints `Ledger entry 325: PRESENT`
- [x] Re-running apply script keeps row count at 2 (idempotency confirmed)
- [x] Production DB `SELECT COUNT(*) FROM essentials.discovery_jurisdictions WHERE state='VA'` returns 2

### Task 2: Landing.jsx

- [x] File `src/pages/Landing.jsx` contains `label: 'Alexandria'`
- [x] File `src/pages/Landing.jsx` contains `state: 'Virginia'`
- [x] File `src/pages/Landing.jsx` contains `browseGovernmentList: ['5101000', '51510']`
- [x] File `src/pages/Landing.jsx` contains `browseStateAbbrev: 'VA'`
- [x] Alexandria entry (line 25) appears AFTER Leonardtown/Maryland entry (line 24)
- [x] All 10 prior COVERAGE_CITIES entries unchanged (now 11 total, incremented by exactly 1)
- [x] COVERAGE_COUNTIES unchanged
- [x] `npm run build` exits with status 0
- [x] `npm run build` output contains `✓ built in`
- [x] Git commit `feat(105-03): add Virginia (Alexandria) to Landing.jsx COVERAGE_CITIES` exists (`fa11b5a`)

## Deviations

None — plan executed exactly as written.

- tsx invoked via `node backend/node_modules/tsx/dist/cli.mjs` from `C:/EV-Accounts/backend` directory (not `C:/EV-Accounts` root — tsx lives in `backend/node_modules/` not root `node_modules/`). Same workaround established in Plans 01+02.

## Phase 105 Closing Checklist

| Requirement | Plan | Status |
|-------------|------|--------|
| VA-ELECTIONS-01 | 105-01 | SATISFIED — 2 rows in essentials.elections (migration 322) |
| VA-ELECTIONS-02 | 105-02 | SATISFIED — 12 rows in essentials.races (migration 324) |
| VA-ELECTIONS-03 | 105-03 | SATISFIED — 2 rows in essentials.discovery_jurisdictions (migration 325) + Landing.jsx Alexandria entry |

Phase 105 (v12.0 VA Essentials — Elections + Discovery) is complete.

## Self-Check: PASSED
