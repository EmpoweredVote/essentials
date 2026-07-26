---
phase: 96-md-2026-elections-discovery-pipeline-landing
plan: "03"
subsystem: discovery-pipeline,landing,jsx,sql
tags:
  - discovery
  - landing
  - jsx
  - sql
  - maryland
dependency_graph:
  requires:
    - 96-01 (MD election rows — 278)
    - 96-02 (MD race rows — 279, 280)
  provides:
    - essentials.discovery_jurisdictions MD rows (migration 281)
    - Landing.jsx Maryland COVERAGE_CITIES entry
  affects:
    - discovery cron agent (reads discovery_jurisdictions within 180-day window)
    - public landing page (Maryland now visible in Alpha Areas)
tech_stack:
  added:
    - migration 281 (essentials.discovery_jurisdictions — 2 MD rows)
  patterns:
    - ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING (idempotency)
    - browseGovernmentList multi-geo_id bundling (Leonardtown + St. Mary's County)
    - date-based discovery eligibility (no cron_active column — D-03 confirmed)
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-281.ts
  modified:
    - src/pages/Landing.jsx
decisions:
  - "D-03 honored: no cron_active column added to discovery_jurisdictions (date-based eligibility)"
  - "D-04 honored: exact Landing.jsx object verbatim with browseGovernmentList: ['2446475', '24037']"
  - "Ledger INSERT added after post-verification DO block (migration 277 pattern)"
metrics:
  duration: ~15m
  completed: "2026-06-06"
  tasks_completed: 2
  files_changed: 3
---

# Phase 96 Plan 03: MD 2026 Discovery Pipeline + Landing Summary

**One-liner:** Two MD discovery_jurisdictions rows (primary 2026-06-23 + general 2026-11-03) applied as migration 281; Maryland (Leonardtown) added to Landing.jsx COVERAGE_CITIES with bundled geo_ids for town + county.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Migration 281: discovery_jurisdictions | (applied to production DB; no essentials repo file) | 281_md_2026_discovery.sql, _apply-migration-281.ts |
| 2 | Landing.jsx Maryland entry | f0123ff | src/pages/Landing.jsx |

## Verification Results

### Migration 281 (discovery_jurisdictions)

Apply script output (confirmed):
```
Migration 281 applied successfully
MD discovery_jurisdictions rows: 2 (expected 2)
MD election dates: [ '2026-06-23', '2026-11-03' ]
(expected: 2026-06-23, 2026-11-03)
allowed_domains length (primary): 4 (expected 4)
source_url (primary): https://elections.maryland.gov/elections/2026/primary_candidates/index.html
(expected: https://elections.maryland.gov/elections/2026/primary_candidates/index.html)
Ledger entry 281: PRESENT
```

Idempotency confirmed: re-running apply script keeps count at 2.

### Landing.jsx

- Maryland entry inserted at line 24 (after Portland Oregon at line 23)
- `browseGovernmentList: ['2446475', '24037']` — Leonardtown town council + St. Mary's County commission
- `npm run build` passes: 758 modules transformed, no errors (pre-existing chunk size warning is not from this edit)

## Acceptance Criteria Check

- [x] File contains `'2026-06-23'`
- [x] File contains `'2026-11-03'`
- [x] File contains `'State of Maryland'`
- [x] File contains `https://elections.maryland.gov/elections/2026/primary_candidates/index.html`
- [x] File contains `ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING`
- [x] File contains `ARRAY['elections.maryland.gov', 'mgaleg.maryland.gov', 'ballotpedia.org', 'maryland.gov']`
- [x] File does NOT contain `cron_active`
- [x] File does NOT contain `2026-07-14`
- [x] File contains `RAISE EXCEPTION 'Expected 2 MD discovery_jurisdictions rows`
- [x] SQL count returns 2 MD rows
- [x] allowed_domains length = 4
- [x] source_url matches verified value
- [x] Re-run idempotent (count stays at 2)
- [x] Ledger row 281 present
- [x] Landing.jsx contains `browseGovernmentList: ['2446475', '24037']`
- [x] Landing.jsx contains `label: 'Leonardtown'`
- [x] Landing.jsx contains `browseStateAbbrev: 'MD'`
- [x] Landing.jsx contains `state: 'Maryland'`
- [x] Maryland entry is AFTER Portland Oregon entry (line 24 > line 23)
- [x] All 9 prior COVERAGE_CITIES entries unchanged
- [x] `npm run build` passes

## Phase 96 Final Row Counts

| Category | Count | Migration |
|----------|-------|-----------|
| Elections (primary + general) | 2 | 278 |
| Statewide races | 12 | 279 |
| Senate races (47 districts) | 47 | 280 |
| House races (71 SLDL geofences) | 71 | 280 |
| **Total race rows** | **130** | **279+280** |
| Discovery jurisdictions (MD) | 2 | 281 |

**Phase 96 requirements satisfied:**
- MD-ELECTIONS-01: 2 election rows (primary + general) — Plan 96-01
- MD-ELECTIONS-02: 130 race rows (12 statewide + 47 senate + 71 house) + 2 discovery_jurisdictions rows — Plans 96-02 + 96-03
- MD-ELECTIONS-03: Landing.jsx COVERAGE_CITIES Maryland entry — Plan 96-03

## Deviations from Plan

**1. [Rule 1 - Bug] Ledger INSERT missing from initial migration SQL**
- **Found during:** Task 1 verification (apply script returned "Ledger entry 281: MISSING")
- **Issue:** Initial migration 281 SQL did not include `INSERT INTO supabase_migrations.schema_migrations (version) VALUES ('281') ON CONFLICT (version) DO NOTHING` — present in migration 277 as mandatory pattern
- **Fix:** Added Section 3 ledger INSERT to 281_md_2026_discovery.sql and re-ran apply script
- **Files modified:** C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql
- **Commit:** (migration outside essentials repo; re-applied to production DB)

## Known Stubs

None — both discovery_jurisdictions rows have real source_url and allowed_domains values. Landing.jsx entry routes to confirmed production data (governments + officials from Phase 95).

## Threat Flags

No new security surface introduced. discovery_jurisdictions rows gate the cron agent's domain access — allowed_domains array correctly restricts to 4 trusted Maryland government and civic information domains.

## Self-Check: PASSED

- Migration 281 files exist at C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql and C:/EV-Accounts/backend/scripts/_apply-migration-281.ts
- DB count = 2 MD discovery_jurisdictions rows (verified twice including idempotency run)
- Landing.jsx commit f0123ff exists in git log
- Build passes

## Next Phase

Phase 97: MD Compass Stances — Executives + Senators (Wave 1)
