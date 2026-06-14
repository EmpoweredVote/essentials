---
phase: 117-newton-deep-seed
verified: 2026-06-14T00:00:00Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
re_verification: null
gaps: []
deferred: []
human_verification: []
---

# Phase 117: Newton Deep Seed Verification Report

**Phase Goal:** A Newton address returns a populated LOCAL section with Mayor + council + school committee officials and headshots.
**Verified:** 2026-06-14
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Newton city government row exists in essentials.governments | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.governments WHERE name = 'City of Newton, Massachusetts, US'` = 1 |
| 2 | 25 city officials (Mayor + 24 councillors) seeded in external_id range | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2545560025 AND -2545560001` = 25 |
| 3 | 25 city offices linked to geo_id='2545560' districts | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id WHERE d.geo_id = '2545560' AND d.state = 'ma'` = 25 |
| 4 | City section-split check returns 0 orphans (geo_id=2545560, mtfcc=G4110) | VERIFIED | DB: split orphan query = 0 |
| 5 | All 25 city officials have non-NULL office_id | VERIFIED | DB: `SELECT COUNT(*) ... WHERE external_id BETWEEN -2545560025 AND -2545560001 AND office_id IS NULL` = 0 |
| 6 | Newton Public Schools government row exists | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.governments WHERE name = 'Newton Public Schools, Massachusetts, US'` = 1 |
| 7 | 8 elected SC politicians seeded (external_id range -2508610008 to -2508610001) | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2508610008 AND -2508610001` = 8 |
| 8 | 9 SCHOOL offices present (8 elected + 1 Mayor ex-officio) | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id WHERE d.geo_id = '2508610' AND d.district_type = 'SCHOOL' AND d.state = 'ma'` = 9 |
| 9 | G5420 geofence present for Newton school district | VERIFIED | DB: `SELECT COUNT(*) FROM essentials.geofence_boundaries WHERE geo_id = '2508610' AND mtfcc = 'G5420' AND state = '25'` = 1 |
| 10 | Mayor Laredo office_id points to LOCAL_EXEC district (not overwritten by migration 579) | VERIFIED | DB: mayor_local_exec query = 1; Mayor seeded exactly once (count = 1) |
| 11 | All headshot gaps documented in migration 580; zero wrong-type rows | VERIFIED | DB: `headshot_default` = 0 (all-gap documented); `wrong_type` = 0; migration 580 comment lists all 33 gaps with HTTP error codes |
| 12 | Migrations 578, 579, 580 all present in ledger | VERIFIED | DB: `SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('578','579','580')` returns all 3 rows |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/578_newton_city_government.sql` | Newton city government seed (Mayor + 24 councillors) | VERIFIED | File exists; substantive — 250+ lines with 25 politician+office CTE blocks, pre-flight gates, post-verification DO block, ledger entry |
| `C:/EV-Accounts/backend/migrations/579_newton_school_committee.sql` | Newton School Committee seed (8 elected + Mayor ex-officio) | VERIFIED | File exists; substantive — G5420 geofence, SCHOOL district, 9-gate post-verification DO block, ex-officio subquery pattern |
| `C:/EV-Accounts/backend/migrations/580_newton_headshots.sql` | Best-effort headshot documentation (all 33 gaps) | VERIFIED | File exists; substantive — all 33 gap officials documented with specific HTTP error codes and URL patterns attempted |
| `C:/EV-Accounts/backend/scripts/_tmp-newton-headshots.py` | Python download/upload script | VERIFIED | File exists per SUMMARY-03 self-check; ran to completion without exceptions; resolved all 33 politician UUIDs from DB |
| `essentials.governments (DB)` | Newton city government row | VERIFIED | count = 1 |
| `essentials.governments (DB)` | Newton Public Schools government row | VERIFIED | count = 1 |
| `essentials.politicians (DB)` | 25 city officials | VERIFIED | count = 25 |
| `essentials.politicians (DB)` | 8 SC elected members | VERIFIED | count = 8 |
| `essentials.offices (DB)` | 25 city offices | VERIFIED | count = 25 |
| `essentials.offices (DB)` | 9 SCHOOL offices | VERIFIED | count = 9 |
| `essentials.geofence_boundaries (DB)` | G5420 geofence for Newton school district | VERIFIED | count = 1 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| essentials.offices | essentials.districts | district_id JOIN on geo_id='2545560' | WIRED | 25 offices linked; district_type IN ('LOCAL_EXEC','LOCAL') verified |
| essentials.politicians | essentials.offices | office_id back-fill UPDATE | WIRED | 0 NULL office_ids in -2545560025..-2545560001 range |
| essentials.offices (Mayor ex-officio) | essentials.politicians (external_id=-2545560001) | subquery SELECT id WHERE external_id=-2545560001 | WIRED | 9 SCHOOL offices present; Mayor's LOCAL_EXEC office_id intact (gate (i) = 1) |
| essentials.offices | essentials.districts (SCHOOL) | district_id JOIN on geo_id='2508610' | WIRED | 9 school offices linked to geo_id='2508610', district_type='SCHOOL' |
| essentials.politicians (SC) | essentials.offices | office_id back-fill (excludes Mayor) | WIRED | 0 NULL office_ids in -2508610008..-2508610001 range |

---

### Data-Flow Trace (Level 4)

Not applicable — this phase is a pure DB seed (no new UI components or API routes introduced). Routing uses pre-existing geo_id-based query that now returns Newton officials due to seeded rows. No new render path to trace.

---

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Mayor title correct | `SELECT title ... WHERE external_id=-2545560001 AND district_type='LOCAL_EXEC'` | 'Mayor' | PASS |
| At-large councillor title (American spelling) | `SELECT title ... WHERE external_id=-2545560002` | 'City Councilor' (not 'City Councillor') | PASS |
| Ward councillor title format | `SELECT title ... WHERE external_id=-2545560018` | 'City Councilor (Ward 7)' | PASS |
| Mayor seeded exactly once | `SELECT COUNT(*) ... WHERE external_id=-2545560001` | 1 | PASS |
| School section-split clean | school split orphan query | 0 | PASS |
| City section-split clean | city split orphan query | 0 | PASS |
| No wrong-type headshot rows | `SELECT COUNT(*) ... pi.type != 'default'` | 0 | PASS |

---

### Probe Execution

No probe scripts exist for this phase. The migrations embed post-verification DO blocks (7 gates for migration 578; 9 gates for migration 579) that ran at apply time and raised NOTICE on all gates passing. These are documented in the SUMMARYs and confirmed by the DB spot-checks above.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| NEWTON-01 | 117-01, 117-02 | Newton LOCAL section: Mayor + City Council + School Committee with correct offices linked to geo_id=2545560 | SATISFIED | 25 city officials + 9 school committee offices confirmed in DB; Mayor (LOCAL_EXEC) + 24 councillors (LOCAL) + 8 elected SC + Mayor ex-officio (SCHOOL); geo_id=2545560 for city, 2508610 for school (correct per NCES LEAID); all districts, chambers, and office_ids verified |
| NEWTON-02 | 117-03 | Headshots at 600x750 in politician_photos bucket; best-effort | SATISFIED (best-effort) | 0/33 uploaded due to newtonma.gov HTTP 403 (CivicEngage bot-detection blocks all programmatic access including Chrome UA) and laredofornewton.com 404 (post-election removal) and newton.k12.ma.us 404/429; all 33 gaps documented in migration 580 with specific HTTP error codes; 0 wrong-type rows; plan explicitly states "gaps are acceptable and must be documented in migration 580 comments" — best-effort acceptance rule applies |

**NEWTON-03** is mapped to Phase 122 in REQUIREMENTS.md — not in scope for Phase 117. Not checked here.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No debt markers (TBD/FIXME/XXX) found in any Phase 117 migration files |

Grep scanned: 578_newton_city_government.sql, 579_newton_school_committee.sql, 580_newton_headshots.sql — zero matches for any debt marker pattern.

---

### Human Verification Required

None. All must-haves are verifiable programmatically against the DB. The NEWTON-02 best-effort outcome is clearly documented and the plan's acceptance rule explicitly covers 0-headshot results. No visual appearance or real-time behavior introduced.

---

### Gaps Summary

No gaps. All 12 must-haves verified. Both NEWTON-01 and NEWTON-02 are satisfied:

- **NEWTON-01:** Complete. Newton address returns LOCAL section (Mayor Marc C. Laredo + 24 City Councillors via geo_id=2545560) and SCHOOL section (8 elected SC members + Mayor ex-officio via geo_id=2508610). All offices correctly linked. Section-split clean for both geofences.

- **NEWTON-02:** Best-effort complete. All 33 officials attempted; 0 uploaded due to impenetrable CivicEngage/Revize CMS bot-detection on newtonma.gov and no viable fallback sources. Migration 580 documents every gap with specific HTTP failure codes. Zero wrong-type rows in politician_images. Plan acceptance rule explicitly permits all-gap outcomes.

---

_Verified: 2026-06-14T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
