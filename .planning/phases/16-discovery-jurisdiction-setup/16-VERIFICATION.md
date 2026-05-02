---
phase: 16-discovery-jurisdiction-setup
verified: 2026-05-01T23:15:00Z
status: passed
score: 3/3 must-haves verified
---

# Phase 16: Discovery Jurisdiction Setup — Verification Report

**Phase Goal:** All 23 confirmed-incorporated Collin County cities are registered in the discovery pipeline so the weekly cron will find candidates from collincountytx.gov
**Verified:** 2026-05-01T23:15:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 23 Collin County cities have rows in `discovery_jurisdictions` with correct `source_url` and Census `jurisdiction_geoid` | VERIFIED | `COUNT(*) WHERE state='TX'` = 23; all 23 GEOIDs join cleanly to `essentials.governments.geo_id` (0 orphans) |
| 2 | Each row has `allowed_domains` containing `collincountytx.gov`, `co.collin.tx.us`, and a city-official domain — no NULL arrays, no news/third-party domains | VERIFIED | 0 rows missing `collincountytx.gov`; 0 rows missing `co.collin.tx.us`; 0 NULL arrays; 0 rows with `collincountyvotes.gov`; all 23 rows carry exactly 3 elements — two county domains + one city-official domain |
| 3 | Allen test discovery run completed without error and produced >= 1 staged candidate with a valid `citation_url` from an allowed domain | VERIFIED | Run status=completed, candidates_found=2; Chris Schulmeister + Dave Shafer staged with `citation_url` = `https://www.collincountytx.gov/…/bs-2.pdf` (collincountytx.gov is in Allen's `allowed_domains`); user reviewed and approved results in admin staging UI |

**Score:** 3/3 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `/c/EV-Accounts/backend/migrations/099_collin_county_discovery_jurisdictions.sql` | Migration seeding TX election row + 23 discovery_jurisdictions rows | VERIFIED | File exists, 59 lines; seeds `essentials.elections` TX row then 23 jurisdiction rows with ON CONFLICT DO NOTHING idempotency |
| `essentials.elections` — TX 2026-05-02 row | Election anchor row required for cron join on (state, election_date) | VERIFIED | Seeded in migration 099; `name='2026 Texas Municipal General'`, `election_date='2026-05-02'`, `election_type='general'`, `jurisdiction_level='city'`, `state='TX'` |
| `essentials.discovery_jurisdictions` — 23 TX rows | One row per confirmed-incorporated Collin County city | VERIFIED | 23 rows confirmed in live DB |
| `essentials.discovery_runs` — Allen test run | Run record proving pipeline wiring end-to-end | VERIFIED | run_id=47c4085a…, status=completed, candidates_found=2 |
| `essentials.candidate_staging` — Allen staged candidates | >= 1 candidate with valid citation_url | VERIFIED | 2 rows (Chris Schulmeister, Dave Shafer), both pending, both citing collincountytx.gov PDF |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `discovery_jurisdictions.election_date` | `essentials.elections` | FK on (state, election_date) | VERIFIED | All 23 rows reference the seeded TX 2026-05-02 election row; 0 orphans |
| `discovery_jurisdictions.jurisdiction_geoid` | `essentials.governments.geo_id` | LEFT JOIN — 0 nulls | VERIFIED | All 23 GEOIDs match live governments rows |
| `discovery_runs.run_id` | `candidate_staging.run_id` | FK | VERIFIED | Allen run_id resolves to 2 candidate_staging rows |
| `candidate_staging.citation_url` domain | `discovery_jurisdictions.allowed_domains` | domain whitelist | VERIFIED | Both Allen citation_urls use `collincountytx.gov` which is element 1 of Allen's allowed_domains |

---

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| DISC-01: All 23 Collin County cities registered with correct GEOID | SATISFIED | COUNT=23; all GEOIDs resolve to governments rows |
| DISC-02: `allowed_domains` contains county + city official domains only | SATISFIED | All 23 rows: `{collincountytx.gov, co.collin.tx.us, <city-domain>}` — no news/third-party; Lavon uses lavontx.gov and Van Alstyne uses cityofvanalstyne.us (corrections from migration 090 applied) |
| DISC-03: Test discovery run completed, >= 1 staged candidate with valid citation_url | SATISFIED | Allen: 2 candidates staged, citation_url on collincountytx.gov (in allowed_domains); user approved in admin UI |

---

### Anti-Patterns Found

None. Migration uses ON CONFLICT DO NOTHING (idempotent). No NULL allowed_domains (would bypass domain safety check). No news or third-party domains in any allowed_domains array. No TODO/FIXME/placeholder patterns in migration file.

---

### Human Verification

The user reviewed the Allen test run results in the admin staging UI and confirmed Chris Schulmeister and Dave Shafer are correctly staged as Allen Mayor candidates from collincountytx.gov. Human verification is complete — no further human testing required.

---

## Gaps Summary

No gaps. All three must-haves pass against the live database and migration source. The phase goal — "All 23 confirmed-incorporated Collin County cities are registered in the discovery pipeline so the weekly cron will find candidates from collincountytx.gov" — is fully achieved.

Notable decisions confirmed correct by verification:
- Copeville excluded (0 rows for Copeville confirmed)
- `collincountyvotes.gov` never used (0 rows contain it)
- Lavon uses `lavontx.gov`, Van Alstyne uses `cityofvanalstyne.us` (both correct in live DB)
- TX election date is 2026-05-02 (seeded and confirmed)

---

_Verified: 2026-05-01T23:15:00Z_
_Verifier: Claude (gsd-verifier)_
