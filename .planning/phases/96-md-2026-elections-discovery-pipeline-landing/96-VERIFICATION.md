---
phase: 96-md-2026-elections-discovery-pipeline-landing
verified: 2026-06-06T00:00:00Z
status: passed
score: 9/9 must-haves verified
overrides_applied: 0
---

# Phase 96: MD 2026 Elections, Discovery Pipeline, Landing Verification Report

**Phase Goal:** Maryland 2026 election rows are seeded, the discovery pipeline is armed for the election cycle, and MD appears on the Landing page
**Verified:** 2026-06-06
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | essentials.elections contains 2 rows where state='MD' (primary 2026-06-23 + general 2026-11-03) | VERIFIED | `_apply-migration-278.ts` output: "MD 2026 election rows: 2 (expected 2)"; dates confirmed 2026-06-23 and 2026-11-03 |
| 2 | Re-applying migration 278 inserts zero additional rows | VERIFIED | Script ran idempotently; count remained 2; ON CONFLICT (name, election_date, state) DO NOTHING confirmed in SQL |
| 3 | Migration 278 ledger entry exists | VERIFIED | Script output: "Ledger entry 278: PRESENT" |
| 4 | essentials.races has exactly 130 MD race rows (12 statewide + 47 senate + 71 SLDL) linked to 2026 MD general election | VERIFIED | `_apply-migration-280.ts` output: "Total MD race rows: 130 (expected 130)"; breakdown: 12 statewide, 47 senate, 29 whole-district house, 42 sub-district house |
| 5 | No race row has office_id IS NULL | VERIFIED | Script output: "MD races with NULL office_id: 0 (expected 0)" |
| 6 | Ledger entries 279 and 280 present | VERIFIED | `_apply-migration-279.ts`: "Ledger entry 279: PRESENT"; `_apply-migration-280.ts`: "Ledger entry 280: PRESENT" |
| 7 | essentials.discovery_jurisdictions contains 2 MD rows (state='MD') with correct dates, source_url, and 4-entry allowed_domains | VERIFIED | `_apply-migration-281.ts` output: "MD discovery_jurisdictions rows: 2 (expected 2)"; dates: 2026-06-23 + 2026-11-03; allowed_domains length: 4; source_url: https://elections.maryland.gov/elections/2026/primary_candidates/index.html |
| 8 | Ledger entry 281 present | VERIFIED | Script output: "Ledger entry 281: PRESENT" |
| 9 | src/pages/Landing.jsx COVERAGE_CITIES contains Maryland entry with browseGovernmentList=['2446475','24037'] after Portland Oregon entry | VERIFIED | File line 23: Portland Oregon; line 24: Leonardtown Maryland with browseGovernmentList: ['2446475', '24037'], browseStateAbbrev: 'MD' |

**Score:** 9/9 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/278_md_2026_elections.sql` | Two MD election row INSERTs, idempotent, date 2026-06-23 | VERIFIED | Contains '2026-06-23', 'ON CONFLICT (name, election_date, state) DO NOTHING'; no '2026-07-14' |
| `C:/EV-Accounts/backend/scripts/_apply-migration-278.ts` | Apply script with verification queries | VERIFIED | File exists; ran successfully |
| `C:/EV-Accounts/backend/migrations/279_md_2026_statewide_races.sql` | 12 statewide race rows via WITH gen_elec + VALUES | VERIFIED | File exists; contains WITH gen_elec, all 12 office_ids, ON CONFLICT partial index clause |
| `C:/EV-Accounts/backend/scripts/_apply-migration-279.ts` | Apply script for migration 279 | VERIFIED | File exists; ran successfully; all 12 statewide positions confirmed |
| `C:/EV-Accounts/backend/migrations/generate_md_legislative_races.ps1` | PowerShell generator with UTF-8 no-BOM write | VERIFIED | File exists; [System.Text.UTF8Encoding]::new($false) confirmed in generator |
| `C:/EV-Accounts/backend/migrations/280_md_2026_legislative_races.sql` | 118 legislative DO $$ blocks; d.state='md' lowercase | VERIFIED | File exists; 118 occurrences of d.state = 'md' (lowercase); no uppercase MD casing |
| `C:/EV-Accounts/backend/scripts/_apply-migration-280.ts` | Apply script for migration 280 with NULL detection | VERIFIED | File exists; ran successfully; all counts matched |
| `C:/EV-Accounts/backend/migrations/281_md_2026_discovery.sql` | Two discovery_jurisdictions INSERTs; no cron_active | VERIFIED | File exists; no 'cron_active' string; correct URL and ARRAY domains; idempotency clause present |
| `C:/EV-Accounts/backend/scripts/_apply-migration-281.ts` | Apply script for migration 281 | VERIFIED | File exists; ran successfully |
| `src/pages/Landing.jsx` | COVERAGE_CITIES Maryland entry with bundled geo_ids | VERIFIED | Line 24 contains exact entry; 9 prior entries unchanged |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| 278_md_2026_elections.sql | essentials.elections | INSERT ... ON CONFLICT (name, election_date, state) DO NOTHING | WIRED | Confirmed in file; DB count = 2 |
| 279_md_2026_statewide_races.sql | essentials.elections | WITH gen_elec AS (SELECT id ... WHERE name = '2026 Maryland General Election' AND state = 'MD') | WIRED | Confirmed in file; 12 statewide rows in DB |
| 280_md_2026_legislative_races.sql | essentials.offices | office_id subquery via d.geo_id + d.state='md' + ch.name = 'Maryland Senate'/'Maryland House of Delegates' | WIRED | DB: zero NULL office_ids across all 118 legislative rows |
| 281_md_2026_discovery.sql | essentials.discovery_jurisdictions | INSERT ... ON CONFLICT (jurisdiction_geoid, election_date) DO NOTHING | WIRED | DB: 2 MD discovery rows with correct dates/URL/domains |
| Landing.jsx COVERAGE_CITIES | essentials.governments (via API) | browseGovernmentList: ['2446475', '24037'] passed to /results route | WIRED | Geo_ids confirmed seeded in Phase 95; handleAreaClick routes via browse_government_list param |

---

## Data-Flow Trace (Level 4)

Not applicable — this phase produces DB rows and a static array entry (no dynamic rendering components added). Landing.jsx COVERAGE_CITIES is a static constant read at render time; the geo_ids route through an existing wired handleAreaClick function.

---

## Behavioral Spot-Checks

All checks run via apply scripts against live production DB:

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| 2 MD election rows with correct dates | `_apply-migration-278.ts` (idempotency run) | 2 rows; 2026-06-23 + 2026-11-03 | PASS |
| 130 MD race rows, 0 NULL office_ids | `_apply-migration-280.ts` (idempotency run) | 130 rows; 0 NULLs; sub-checks all match | PASS |
| 2 MD discovery_jurisdictions rows | `_apply-migration-281.ts` (idempotency run) | 2 rows; domains=4; URL verified | PASS |
| Ledger entries 278–281 all present | Included in apply script outputs | All 4 versions PRESENT | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MD-ELECTIONS-01 | 96-01, 96-02 | 2 election rows + 130 race rows (12 statewide + 47 senate + 71 SLDL house) | SATISFIED | Elections: 2 rows confirmed. Races: 130 rows confirmed, 0 NULL office_ids. Note: REQUIREMENTS.md still shows `[ ]` (checkbox not updated) — does not affect satisfaction. |
| MD-ELECTIONS-02 | 96-03 | discovery_jurisdictions row for MD, armed for 2026 election cycle | SATISFIED (with schema deviation noted) | 2 MD discovery rows exist with correct dates, URL, and allowed_domains. REQUIREMENTS.md text says "cron_active=true" — that column does not exist in the schema (D-03 confirmed). The intent (arming the cron agent) is met via date-based eligibility. |
| MD-ELECTIONS-03 | 96-03 | Landing.jsx updated with MD entry | SATISFIED | Leonardtown entry at line 24, after Portland Oregon at line 23; browseGovernmentList: ['2446475', '24037'] verified in file |

**Note on MD-ELECTIONS-02 wording:** REQUIREMENTS.md says "cron_active=true" but the discovery_jurisdictions table has no such column (documented as D-03 in CONTEXT.md, confirmed before phase execution). The requirement intent is satisfied: 2 rows exist and both election_dates are within the 180-day cron eligibility window as of 2026-06-06 (primary ~17 days out; general ~150 days out). REQUIREMENTS.md checkbox language is stale but the functional goal is achieved.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| REQUIREMENTS.md | 39-41 | `[ ]` checkboxes for MD-ELECTIONS-01/02/03 | Info | Requirements file not updated to `[x]` after phase completion — cosmetic only; does not affect goal achievement |

No TBD/FIXME/XXX markers found in modified files. No stub patterns found in any phase artifact.

---

## Human Verification Required

None. All truths are verifiable programmatically via DB queries and file inspection. Landing.jsx addition routes to confirmed production geo_ids from Phase 95.

---

## Gaps Summary

No gaps. All 9 must-haves are VERIFIED with live DB evidence from idempotency re-runs of all four apply scripts.

---

## Documented Deviations (Not Gaps)

1. **ROADMAP 198 vs actual 130 race rows**: ROADMAP estimated 198 rows (one-per-seat model); actual is 130 (one-per-district, enforced by UNIQUE constraint). Documented in migration 280 header. The phase plan explicitly anticipated and accepted this deviation.

2. **Senate chamber name**: `ch.name = 'Maryland Senate'` (not 'Maryland State Senate'); the formal name is in `name_formal`. Auto-corrected during execution of plan 96-02; all 47 senate races have valid office_ids.

3. **MD-ELECTIONS-02 "cron_active=true" language**: Stale requirement wording; discovery_jurisdictions has no such column. Date-based eligibility is the correct mechanism; both MD rows are within the 180-day window.

---

_Verified: 2026-06-06_
_Verifier: Claude (gsd-verifier)_
