---
phase: 91-md-tiger-geofences
verified: 2026-06-05T00:00:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
re_verification: null
gaps: []
human_verification: []
---

# Phase 91: MD TIGER Geofences Verification Report

**Phase Goal:** All MD address tiers routable via PostGIS
**Verified:** 2026-06-05
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | geofence_boundaries contains G4020=24 counties for state='24' | VERIFIED | Live DB query: G4020 24 |
| 2 | geofence_boundaries contains G4110=157 incorporated places for state='24' | VERIFIED | Live DB query: G4110 157 |
| 3 | geofence_boundaries contains G5200=8 congressional districts for state='24' | VERIFIED | Live DB query: G5200 8 |
| 4 | geofence_boundaries contains G5210=47 senate districts for state='24' | VERIFIED | Live DB query: G5210 47 |
| 5 | geofence_boundaries contains G5220=71 SLDL sub-district polygons for state='24' | VERIFIED | Live DB query: G5220 71 |
| 6 | Baltimore City Hall coordinate returns both G4110 (2404000) and G4020 (24510) plus 3 district tiers | VERIFIED | ST_Covers spatial query returned 5 rows: G4020/24510, G4110/2404000, G5200, G5210, G5220 |
| 7 | Garrett County rural coordinate (-79.3, 39.53) returns NO G4110 — 4 tiers only | VERIFIED | ST_Covers spatial query returned G4020/24023, G5200, G5210, G5220; no G4110 present |
| 8 | Section-split check: 0 true orphan district rows for MD (D-10) | VERIFIED | Gate 7 returned 1 row (geo_id='24', NATIONAL_UPPER) — this is the pre-existing US Senate OCD district seeded before Phase 91, not a TIGER load artifact; documented as benign in 91-03-SUMMARY and 91-04-SUMMARY |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts` | MD in STATE_LAYER_ALLOWLIST, STATE_CITY_ASSERTIONS, STATE_RUN_MAKEVALID; EXPECTED_MD_MTFCC block with fipsArg==='24' guard | VERIFIED | Lines 42, 85, 98, 859; confirmed values: cd119=8, sldu=47, sldl=71, place=157, county=24 |
| `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql` | 7-gate SQL verification script with state='24', Baltimore City Gate 4, St. Mary's County Gate 6, section-split Gate 7 | VERIFIED | File exists; all key queries confirmed present; state='24' throughout; geo_id IN ('2404000','24510') at line 29; '%Mary%' at line 50; section-split LEFT JOIN at line 55-59 |
| `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts` | 3-address TypeScript smoke test; expectedGeoIds G4110='2404000'/G4020='24510'; forbiddenMtfcc=['G4110'] for Garrett; expectedCounts G4110=157/G5220=71 | VERIFIED | File exists; expectedCounts confirmed at lines 102-108; expectedGeoIds confirmed at lines 37-39; forbiddenMtfcc at line 49 |
| `essentials.geofence_boundaries` (Supabase production) | 307 rows for state='24' across 5 MTFCC types | VERIFIED | Live DB: G4020=24, G4110=157, G5200=8, G5210=47, G5220=71; total=307 |
| `essentials.districts` (Supabase production) | MD districts with correct state casing per D-07 | VERIFIED | md/COUNTY=24, md/STATE_LOWER=71, md/STATE_UPPER=47, MD/NATIONAL_LOWER=8 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| load-state-tiger-boundaries.ts STATE_LAYER_ALLOWLIST | processLayer() EXPECTED_MD_MTFCC block | fipsArg === '24' guard | WIRED | Guard at line 859 confirmed; 5 layers with confirmed counts |
| smoke-md-geofences.ts TEST_ADDRESSES[0] | expectedGeoIds assertion | G4110: '2404000', G4020: '24510' | WIRED | Lines 37-39 confirmed; spatial query verified to return both rows |
| smoke-md-geofences.ts ST_Covers query | geofence_boundaries.geometry (PostGIS) | ST_Covers(geometry, ST_SetSRID(ST_MakePoint(lon, lat), 4326)) | WIRED | Live spatial queries confirmed: all 3 test addresses routed correctly |
| verify SQL Gate 7 | essentials.districts (state IN ('MD','md')) | LEFT JOIN with geofence_boundaries — 0 true section-split rows | WIRED | Query returns only the pre-existing NATIONAL_UPPER row (geo_id='24') which is not a TIGER boundary artifact |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| geofence_boundaries rows (state='24') | PostGIS geometry column | TIGER 2024 shapefiles via load-state-tiger-boundaries.ts upsert | Yes — live ST_Covers queries return non-null geometries and names for all 3 smoke test addresses | FLOWING |
| districts rows (state IN 'MD','md') | state, district_type, geo_id | Loader loader alongside geofence_boundaries; confirmed 4 tiers present | Yes — live query returns 4 groups with correct counts and casing | FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Gate 1: 0 invalid geometries for state='24' | node pg query: NOT ST_IsValid(geometry) | 0 | PASS |
| Gate 2: 0 GeometryCollection types | node pg query: ST_GeometryType NOT IN ('ST_Polygon','ST_MultiPolygon') | 0 | PASS |
| Gate 3: All 5 MTFCC counts correct | node pg query: GROUP BY mtfcc WHERE state='24' | G4020=24, G4110=157, G5200=8, G5210=47, G5220=71 | PASS |
| Gate 4: Baltimore City dual-tier | node pg query: geo_id IN ('2404000','24510') | 2 rows: G4020/24510 and G4110/2404000 both named 'Baltimore city' | PASS |
| Gate 5: districts.state casing (D-07) | node pg query: GROUP BY state, district_type | md/COUNTY=24, md/STATE_LOWER=71, md/STATE_UPPER=47, MD/NATIONAL_LOWER=8 | PASS |
| Gate 6: St. Mary's County sentinel | node pg query: mtfcc='G4020' AND name LIKE '%Mary%' | geo_id='24037', name="St. Mary's County" — 1 row | PASS |
| Gate 7: Section-split (D-10) | node pg query: districts NOT IN geofence geo_ids for MD | 1 row returned: geo_id='24'/NATIONAL_UPPER (pre-existing US Senate district, not a TIGER artifact) | PASS |
| SC1: Baltimore City Hall spatial routing | ST_Covers(-76.6107, 39.2908) | 5 rows: G4020/24510, G4110/2404000, G5200/2407, G5210/24046, G5220/24046 | PASS |
| SC2: Garrett County rural spatial routing | ST_Covers(-79.3, 39.53) | 4 rows: G4020/24023, G5200/2406, G5210/24001, G5220/2401A; no G4110 | PASS |
| SC3: Leonardtown spatial routing | ST_Covers(-76.6358, 38.2912) | 5 rows: G4020/24037, G4110/2446475, G5200/2405, G5210/24029, G5220/2429A | PASS |

---

### Probe Execution

The phase smoke test (smoke-md-geofences.ts) was documented as exiting 0 with "ALL ASSERTIONS PASSED" in 91-04-SUMMARY.md. The verifier independently confirmed each check via live DB queries above. The scripts are not git-tracked in this repo (located in C:/EV-Accounts/backend/scripts/), so bash probe execution of the TypeScript smoke test is not run here — the underlying spatial queries that the smoke test performs were verified directly against the production DB.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MD-GEO-01 | Plans 01–04 | MD TIGER G4110 incorporated cities loaded (state='24') | SATISFIED | Live DB: G4110=157 rows confirmed; spatial query: Leonardtown (2446475) returned correctly |
| MD-GEO-02 | Plans 01–04 | MD TIGER G4020 counties loaded (24 counties, state='24') | SATISFIED | Live DB: G4020=24 rows; Baltimore City geo_id='24510' present; St. Mary's County geo_id='24037' present |
| MD-GEO-03 | Plans 01–04 | MD TIGER SLDU loaded (47 state senate districts) | SATISFIED | Live DB: G5210=47 rows; districts md/STATE_UPPER=47 |
| MD-GEO-04 | Plans 01–04 | MD TIGER SLDL loaded (141 house delegate sub-district boundaries) | SATISFIED (with note) | Live DB: G5220=71 rows. REQUIREMENTS.md says "141" but RESEARCH.md line 43 explicitly documents this as a known requirement wording issue: "requirement description conflates delegate count with polygon count." The TIGER 2024 SLDL shapefile has 71 distinct polygon boundaries (one per letter-sub-district like 47A and 47B), not 141. The 71 count was confirmed by dry-run on 2026-06-05 and accepted as correct per D-03/D-04. |
| MD-GEO-05 | Plans 01–04 | MD TIGER CD loaded (8 congressional districts) | SATISFIED | Live DB: G5200=8 rows; districts MD/NATIONAL_LOWER=8 |
| MD-GEO-06 | Plan 04 | Any MD address returns correct federal, state, county, and local tiers via PostGIS routing | SATISFIED | 3-address spatial checks confirmed: Baltimore City Hall (5 tiers, dual-tier D-01), Garrett County rural (4 tiers, no G4110), Leonardtown (5 tiers including St. Mary's County) |

**Note on MD-GEO-04 wording:** REQUIREMENTS.md states "141 house delegate sub-district boundaries." The actual TIGER SLDL polygon count is 71 sub-district geometries (one per A/B letter designation). RESEARCH.md §phase_requirements documents this discrepancy explicitly: the requirement conflates 141 delegates with 71 boundary polygons. D-03 mandates loading one row per letter-district (47A and 47B as separate rows). The 71 count is the correct and expected TIGER-file polygon count for Maryland's multi-member district structure. This is not a defect in the load — it is the correct implementation of the requirement's underlying intent.

---

### Anti-Patterns Found

The code review (91-REVIEW.md) found 2 critical issues and 5 warnings in the scripts. These are documented here per severity:

| File | Issue | Severity | Impact on Phase Goal |
|------|-------|----------|----------------------|
| smoke-md-geofences.ts line 123-125 | CR-01: SC3 "All layer counts OK" banner fires based on MTFCC key-count equality, not value equality — could display false-green if a count assertion fails but all 5 MTFCCs are present | WARNING | Does not affect phase goal. Current DB state has correct counts (157, 71, 8, 47, 24). The banner fired correctly when smoke test ran with these values. The bug only manifests when a count is wrong but all 5 MTFCC codes are present — that condition does not hold in the current DB. |
| smoke-md-geofences.ts line 44-49 | CR-02: Garrett County coordinate (-79.3, 39.53) was flagged by RESEARCH.md as potentially inside Oakland city | WARNING | Does not affect phase goal. Live spatial query confirms the coordinate returns G4020/24023 (Garrett County) with NO G4110. The concern in REVIEW.md was pre-load speculation; the post-load verification proves the coordinate is genuinely unincorporated. No coordinate shift needed. |
| verify-md-tiger-import.sql lines 22-23, 42 | IN-02/WR-04: Gate 3 and Gate 5 comments still contain `[DRY-RUN-COUNT]` placeholder text instead of confirmed values (157, 71) | INFO | Does not affect phase goal. The SQL queries themselves are correct; only the human-readable comments are stale. |
| load-state-tiger-boundaries.ts line 857-858 | IN-01/WR-03: Pre-flight block comment says "set to 0" but actual values are 71 and 157 | INFO | Does not affect phase goal. Leftover planning comment. The code values are correct. |
| smoke-md-geofences.ts | WR-02: D-02 invariant (Baltimore County address must NOT return G4110) has no test case | WARNING | Does not affect confirmed phase goal results. The D-01 Baltimore City dual-tier IS tested. D-02 (Baltimore County separation) is an untested edge case. The REQUIREMENTS.md does not mandate a D-02 smoke test — it is a "nice to have" safeguard per REVIEW.md. Phase 91 success criteria do not include a Baltimore County negative test. |

**Classification summary:**
- No BLOCKER anti-patterns found.
- The 2 "critical" issues in the code review are not blockers for the phase goal — they are quality improvements to the verification script logic. The actual DB state and routing behavior are correct, as verified by independent spatial queries.
- The stale comments and missing D-02 test are quality items for a follow-on maintenance pass, not blockers.

---

### Human Verification Required

None. All phase success criteria are verifiable programmatically via live DB spatial queries. The smoke test output documented in 91-04-SUMMARY.md was independently corroborated by direct PostGIS queries run during this verification.

---

### Gaps Summary

No gaps. All 6 requirements (MD-GEO-01 through MD-GEO-06) are satisfied. All 307 geofence rows are present and spatially correct in production. The Baltimore City dual-tier invariant (D-01), the section-split invariant (D-10), and the St. Mary's County Phase 95 prerequisite are all confirmed via live queries.

The only items noted in the code review are quality improvements to the verification scripts (stale comments, a defensive logic gap in the SC3 banner, a missing D-02 test case). None of these prevent the phase goal from being achieved — the data in production is correct and routes correctly.

---

_Verified: 2026-06-05_
_Verifier: Claude (gsd-verifier)_
