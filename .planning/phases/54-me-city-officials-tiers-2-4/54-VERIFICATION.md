---
phase: 54-me-city-officials-tiers-2-4
verified: 2026-05-19T23:00:00Z
status: passed
score: 5/5 must-haves verified
---

# Phase 54: ME City Officials Tiers 2-4 Verification Report

**Phase Goal:** Lewiston, Bangor, South Portland, Auburn, and Biddeford incumbents are seeded; remaining cities have documented coverage gaps.
**Verified:** 2026-05-19
**Status:** passed
**Re-verification:** No - initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Lewiston, Bangor, South Portland, Auburn, Biddeford have Mayor + Council incumbents seeded | VERIFIED | DB Check 1: 43 office rows (42 unique politicians, Tipton dual-office) across all 5 cities |
| 2 | 17 Tier 3-4 cities have skeletal offices present (is_vacant=true, politician_id=NULL) | VERIFIED | DB Check 2 corrected: 17 cities with all offices vacant, 0 filled |
| 3 | GAPS.md documents Tier 3-4 cities as known gaps, not silent omissions | VERIFIED | GAPS.md section 1: 17 cities listed with status not-attempted and actual skeletal office counts |
| 4 | Headshots uploaded for Tier 2 officials where available online | VERIFIED | DB Check 4: 27 of 42 politicians have has_image=true |
| 5 | GAPS.md section 3 has final counts with no TBD values | VERIFIED | GAPS.md section 3: all 5 cities have actual numbers with root-cause notes per official |

**Score: 5/5 truths verified**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| migrations/180_me_tier2_lewiston_bangor_southportland_incumbents.sql | Lewiston + Bangor + South Portland seeding | VERIFIED | 24 politicians inserted, 25 office rows updated, idempotent |
| migrations/181_me_tier2_auburn_biddeford_incumbents.sql | Auburn + Biddeford seeding | VERIFIED | 18 politicians inserted, 18 office rows updated, idempotent |
| .planning/phases/54-me-city-officials-tiers-2-4/GAPS.md | Gap documentation for Tier 3-4 cities and headshots | VERIFIED | 3 sections complete with live DB counts; no TBD values |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Politicians (42 rows) | Offices (43 rows) | politician_id FK | WIRED | All 5 cities confirmed; all office rows have politician_id set |
| Offices (Tier 3-4) | Governments (17 cities) | chamber_id FK | WIRED | 17 cities; all offices is_vacant=true, politician_id=NULL |
| Politicians (42) | politician_images | politician_id FK | WIRED | 27 true / 15 false; matches GAPS.md section 3 exactly |
| GAPS.md section 1 | 17 Tier 3-4 city names + counts | manual documentation | WIRED | Counts match DB actuals exactly |

---

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| MCITY-03: 5 Tier 2 cities seeded with Mayor + Council incumbents | SATISFIED | 42 unique politicians across all 5 cities |
| MCITY-04: Remaining 17+ cities documented as known gaps | SATISFIED | GAPS.md section 1 lists exactly 17 cities as not-attempted |
| HEAD-05: Tier 2 headshots uploaded where available; gaps documented | SATISFIED | 27 uploaded; 15 gaps with root-cause notes in GAPS.md section 3 |

---

## DB Query Evidence

### Check 1 - Tier 2 Incumbents (MCITY-03)

Query returned 43 rows (42 unique politicians; Elyse Tipton appears twice as Mayor + District 5):

- Auburn: 8 rows (Mayor Harmon + 7 council members)
- Bangor: 9 rows (Mayor Hawes + 8 at-large council members)
- Biddeford: 10 rows (Mayor LaFountain + 9 council members)
- Lewiston: 8 rows (Mayor Sheline + 7 ward council members)
- South Portland: 8 rows from 7 unique politicians (Tipton dual-office confirmed)

All rows have is_active=true. All office titles populated with Mayor or Council Member plus seat designation.

### Check 2 - Tier 3-4 Skeletal Offices (MCITY-04)

Two corrections required vs. the verification instructions:

1. ME governments use type=LOCAL not type=CITY. The CITY variant returns 0 rows.
2. Exclusion list had 2302010 (does not exist in DB) instead of Auburn actual geo_id 2302060.

Corrected query returned 18 rows. Auburn (geo_id 2302060) shows filled=8, vacant=0 - correctly seeded as Tier 2.
The remaining 17 Tier 3-4 cities all show filled=0, all offices is_vacant=true:

Augusta (18 offices), Bath (9), Belfast (6), Brewer (5), Calais (7), Caribou (7), Eastport (5),
Ellsworth (7), Gardiner (8), Hallowell (8), Old Town (7), Presque Isle (7), Rockland (5),
Saco (8), Sanford (7), Waterville (8), Westbrook (15).

All counts match GAPS.md section 1 exactly.

### Check 3 - GAPS.md Section 1 (MCITY-04)

GAPS.md section 1 lists all 17 cities with name, geo_id, skeletal office count, incumbents filled (0), and status not-attempted.
Explicit total: "Total Tier 3-4 cities deferred: 17." Note explains Augusta (18) and Westbrook (15) having more offices
due to larger council structures. No city is silently omitted.

### Check 4 - Headshots (HEAD-05)

Query on external_id BETWEEN -238661010 AND -230201001 returned 42 rows (one per unique politician):

has_image=true: 27 politicians
- Bangor: 9/9 (Mayor Hawes + 8 at-large)
- South Portland: 7/7 (Tipton + 6 council; Tipton counted once)
- Biddeford: 9/10 (Vadnais has_image=false)
- Auburn: 1/8 (Mayor Harmon only)
- Lewiston: 1/8 (Mayor Sheline only)

has_image=false: 15 politicians
- Auburn 7: all ward/at-large councilor profile pages 404 after site rebuild
- Lewiston 7: ward pages serve RGBA circle PNGs (baked transparency, not usable as rectangular headshots); Longchamps has no photo
- Biddeford 1: Vadnais no photo on bio page

Count matches GAPS.md section 3 exactly: 27 uploaded, 15 source not found.

### Check 5 - GAPS.md Section 3 (HEAD-05)

Section 3 updated by plan 54-03. All 5 cities have actual numbers with no TBD values. Root causes documented per city:

- Bangor: 9/9 - all from bangormaine.gov/446 directory pages
- South Portland: 7/7 - all from southportland.gov; Tipton counted once
- Biddeford: 9/10 - 9 bio pages had JPEGs; Vadnais no photo on her bio page
- Auburn: 1/8 - Mayor only; 7 ward/at-large pages all 404 on rebuilt site; annual report uses map layout only
- Lewiston: 1/8 - Mayor only; ward pages serve circle-cropped RGBA PNGs not suitable as rectangular headshots

---

## Anti-Patterns Found

None. Production artifacts (migrations, GAPS.md) contain no placeholder content or TODO comments.
Both migrations are idempotent with ON CONFLICT DO NOTHING and politician_id IS NULL guards.
Summaries document actual verified DB states post-migration.

---

## Notes on Verification Instruction Errors

The Check 2 SQL in the verification instructions has two issues that cause it to return 0 rows:

1. g.type = CITY - ME governments use type=LOCAL. The CITY variant returns 0 rows for all ME cities.
2. Exclusion list contains 2302010 (does not exist in DB) instead of Auburn actual geo_id 2302060.

These are errors in the verification instructions only. The underlying DB state is correct.
Verification was performed using corrected queries.

---

## Final Verdict

PASSED. All three requirements satisfied:

- MCITY-03: 42 unique politicians seeded across 5 Tier 2 Maine cities with correct Mayor + Council incumbents,
  available contact data, and wired office rows. Tipton dual-office (Mayor + District 5) confirmed in DB.
- MCITY-04: 17 Tier 3-4 cities have skeletal offices in DB (all is_vacant=true, politician_id=NULL) and are
  explicitly documented in GAPS.md section 1 as not-attempted. No silent omissions.
- HEAD-05: 27 headshots uploaded from official city websites only; 15 gaps documented in GAPS.md section 3
  with specific root-cause notation per official (404 pages, circle PNGs, no-photo bio pages).

---

_Verified: 2026-05-19_
_Verifier: Claude (gsd-verifier)_
