---
phase: 118-somerville-deep-seed
verified: 2026-06-14T00:00:00Z
status: passed
score: 12/12 must-haves verified
overrides_applied: 0
---

# Phase 118: Somerville Deep Seed Verification Report

**Phase Goal:** A Somerville address returns a populated LOCAL section with Mayor + City Council + School Committee officials and headshots.
**Verified:** 2026-06-14
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | A Somerville, MA address returns a LOCAL section with Mayor Jake Wilson + 11 City Councillors | VERIFIED | DB: 12 officials in external_id range -2562535001..-2562535012; 12 offices linked to LOCAL_EXEC + LOCAL districts on geo_id=2562535 |
| 2 | Somerville city government row exists in essentials.governments | VERIFIED | DB: 1 row WHERE name = 'City of Somerville, Massachusetts, US' |
| 3 | Somerville section-split check returns 0 orphan rows (geo_id=2562535, mtfcc=G4110) | VERIFIED | DB: split_orphans = 0 (geofence_boundaries has matching districts) |
| 4 | All 12 city officials have non-NULL office_id | VERIFIED | DB: null_city_office_ids = 0 |
| 5 | Ward 6 councillor Lance L. Davis has title 'City Councilor (Ward 6)' (NOT 'City Council President') | VERIFIED | DB: external_id=-2562535011 has title='City Councilor (Ward 6)' |
| 6 | All councillor titles use American spelling 'Councilor' (not 'Councillor') | VERIFIED | DB: all office titles confirmed; SQL INSERT VALUES use 'City Councilor' (single L) — British spelling appears only in SQL block comments |
| 7 | A Somerville, MA address returns a SCHOOL section with 7 elected SC + Mayor Wilson (ex officio) + Council President Davis (ex officio) = 9 total | VERIFIED | DB: 9 offices linked to SCHOOL district geo_id=2510890 |
| 8 | G5420 geofence for geo_id='2510890' exists with state='25' | VERIFIED | DB: geofence_boundaries has 1 row (geo_id='2510890', mtfcc='G5420', state='25') |
| 9 | Somerville school section-split returns 0 (geo_id=2510890, mtfcc=G5420) | VERIFIED | DB: school_split_orphans = 0 |
| 10 | Mayor Wilson's office_id still points to LOCAL_EXEC (not overwritten by migration 582) | VERIFIED | DB: external_id=-2562535001 office_id -> LOCAL_EXEC district geo_id=2562535 |
| 11 | Council President Davis's office_id still points to LOCAL (not overwritten by migration 582) | VERIFIED | DB: external_id=-2562535011 office_id -> LOCAL district geo_id=2562535 |
| 12 | At minimum 9 city officials have type='default' headshots in politician_images | VERIFIED | DB: 9 rows (Jake Wilson, Mbah, Strezo, McLaughlin, Scott, Ewen-Campen, Clingan, Sait, Davis); 0 rows with type!='default'; 10 gap officials documented in migration 583 |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/581_somerville_city_government.sql` | City government seed — Mayor + 11 councillors | VERIFIED | File exists; 665 lines; 12 politician+office blocks; 7-gate post-verification DO block; ledger entry '581' |
| `C:/EV-Accounts/backend/migrations/582_somerville_school_committee.sql` | School committee seed — 7 elected + 2 ex-officio | VERIFIED | File exists; 614 lines; 9 office blocks (Blocks 8+9 use subquery pattern); 10-gate post-verification DO block; ledger entry '582' |
| `C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql` | Headshot INSERT rows for 9 officials | VERIFIED | File exists; 9 INSERT blocks; type='default' throughout; gap comments for 10 officials; post-verification gate confirms 0 wrong-type rows; ledger entry '583' |
| `C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py` | Python upload script — crop 4:5, resize 600x750 Lanczos q90 | VERIFIED | File exists; correct bucket='politician_photos'; TARGET_SIZE=(600,750); RESAMPLE=LANCZOS; crop-first-then-resize logic present |
| `essentials.governments (DB)` | Somerville city government row | VERIFIED | 1 row: 'City of Somerville, Massachusetts, US' |
| `essentials.politicians (DB) — city range` | 12 city officials | VERIFIED | 12 rows in external_id -2562535001..-2562535012 |
| `essentials.politicians (DB) — SC range` | 7 SC elected members | VERIFIED | 7 rows in external_id -2510890001..-2510890007 |
| `essentials.offices (DB) — city` | 12 city offices | VERIFIED | 12 offices linked to LOCAL_EXEC + LOCAL districts geo_id=2562535 |
| `essentials.offices (DB) — school` | 9 SCHOOL offices | VERIFIED | 9 offices linked to SCHOOL district geo_id=2510890 (7 elected + 2 ex-officio) |
| `essentials.politician_images (DB)` | 9 default-type headshot rows | VERIFIED | 9 rows type='default'; 0 rows type!='default'; CDN URLs present |
| `essentials.geofence_boundaries (DB)` | G5420 geofence geo_id=2510890 state=25 | VERIFIED | 1 row (geo_id='2510890', mtfcc='G5420', state='25') |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| essentials.offices | essentials.districts (LOCAL_EXEC) | district_id JOIN on geo_id='2562535', district_type='LOCAL_EXEC' | WIRED | Mayor Jake Wilson (-2562535001) linked to LOCAL_EXEC district |
| essentials.offices | essentials.districts (LOCAL) | district_id JOIN on geo_id='2562535', district_type='LOCAL' | WIRED | 11 councillors linked to LOCAL district |
| essentials.offices (Mayor ex-officio) | essentials.politicians (-2562535001) | subquery cross-join (no new INSERT) | WIRED | 'Mayor (ex officio)' office in SCHOOL district; politician seeded once total |
| essentials.offices (Davis ex-officio) | essentials.politicians (-2562535011) | subquery cross-join (no new INSERT) | WIRED | 'City Council President (ex officio)' office in SCHOOL district; politician seeded once total |
| essentials.offices | essentials.districts (SCHOOL) | district_id JOIN on geo_id='2510890', district_type='SCHOOL' | WIRED | 9 offices linked to SCHOOL district |
| migration 583 | essentials.politicians | SELECT id FROM essentials.politicians WHERE external_id = -XXXX | WIRED | WHERE NOT EXISTS guard on politician_id; 9 rows inserted |

### Data-Flow Trace (Level 4)

These are database seed migrations, not UI components. Data-flow verification is at the SQL layer.

| Layer | Data Variable | Source | Produces Real Data | Status |
|-------|---------------|--------|-------------------|--------|
| LOCAL section routing | geo_id='2562535' → districts → offices → politicians | essentials.geofence_boundaries G4110 geofence + 2 district rows | Yes — 12 officials returned | FLOWING |
| SCHOOL section routing | geo_id='2510890' → SCHOOL district → offices → politicians | essentials.geofence_boundaries G5420 geofence + 1 SCHOOL district | Yes — 9 officials returned | FLOWING |
| Headshot display | politician_images.url WHERE type='default' | Supabase Storage politician_photos bucket | Yes — 9 CDN URLs present; type='default' on all | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| City government seeded | `SELECT COUNT(*) FROM essentials.politicians WHERE external_id BETWEEN -2562535012 AND -2562535001` | 12 | PASS |
| City offices correct | `SELECT COUNT(*) FROM essentials.offices o JOIN essentials.districts d ON d.id = o.district_id WHERE d.geo_id = '2562535' AND d.state = 'ma'` | 12 | PASS |
| Davis Ward 6 title correct | `SELECT title FROM offices o JOIN politicians p ON p.id = o.politician_id WHERE p.external_id = -2562535011 AND d.geo_id = '2562535'` | 'City Councilor (Ward 6)' | PASS |
| School committee seeded | `SELECT COUNT(*) FROM offices o JOIN districts d ON d.id = o.district_id WHERE d.geo_id = '2510890' AND d.district_type = 'SCHOOL'` | 9 | PASS |
| Mayor office_id intact | `SELECT d.district_type FROM politicians p JOIN offices o ON o.id = p.office_id JOIN districts d ON d.id = o.district_id WHERE p.external_id = -2562535001` | 'LOCAL_EXEC' | PASS |
| Davis office_id intact | same as above for -2562535011 | 'LOCAL' | PASS |
| Section-split city | 0 orphan rows for geo_id=2562535 | 0 | PASS |
| Section-split school | 0 orphan rows for geo_id=2510890 | 0 | PASS |
| Headshots count | 9 type='default' rows in Somerville ranges | 9 | PASS |
| Wrong type count | 0 rows type!='default' | 0 | PASS |
| Migration ledger | versions '581', '582', '583' in schema_migrations | 3 rows | PASS |

### Probe Execution

No explicit probe scripts defined for Phase 118. Post-verification DO blocks within the migrations serve as the embedded probe mechanism — each migration raises EXCEPTION on any gate failure and emits a NOTICE on pass. The SUMMARY.md documents all three migrations as PASSED with specific gate values.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| SOMERVILLE-01 | 118-01, 118-02 | Somerville address returns LOCAL section with Mayor + City Council + School Committee members | SATISFIED | 12 city officials in DB with 12 offices; 9 school officials (7 elected + 2 ex-officio) with 9 offices; routing confirmed via G4110 + G5420 geofences with matching districts |
| SOMERVILLE-02 | 118-03 | All Somerville officials have headshots at 600x750 in Supabase Storage; best-effort | SATISFIED | 9/12 city officials have type='default' headshots; 10 gap officials (3 newly-elected city + 7 SC) documented in migration 583 with fallback sources; best-effort threshold explicitly met |
| SOMERVILLE-03 | Not in Phase 118 | Compass stance data — REQUIREMENTS.md maps this to Phase 122 | NOT APPLICABLE | Phase 122 scope; SOMERVILLE-03 not claimed by any 118 plan |

**Orphaned requirements check:** SOMERVILLE-03 appears in REQUIREMENTS.md under the Somerville section but is correctly mapped to Phase 122 in the traceability table — not orphaned.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| 581_somerville_city_government.sql | 186, 218, 250, 282, 314, 346, 379, 411, 443, 475, 510 | SQL comment headers use 'Councillor' (British spelling) | INFO | Comments only — INSERT VALUES correctly use 'City Councilor' (American spelling). DB data is correct. No impact. |

No blockers, no warnings, no unresolved debt markers (TBD/FIXME/XXX).

### Human Verification Required

None. All truths are verifiable programmatically via direct DB queries. The one item warranting optional human spot-check (image quality / correct person in each headshot) is a post-hoc quality concern, not a phase-goal blocker — 9 source URLs are logged in SUMMARY-03 and all come from official somervillema.gov CMS or official S3 bucket.

### Gaps Summary

No gaps. All 12 must-have truths verified against live DB. All artifacts exist and are substantive. All key links are wired. All requirement IDs (SOMERVILLE-01, SOMERVILLE-02) satisfied. SOMERVILLE-03 is correctly deferred to Phase 122 and not orphaned.

---

_Verified: 2026-06-14_
_Verifier: Claude (gsd-verifier)_
