---
phase: 51-me-executives-federal-headshots
verified: 2026-05-19T08:30:00Z
status: passed
score: 5/5 must-haves verified
re_verification: false
---

# Phase 51: ME Executives + Federal Officials + Headshots Verification Report

**Phase Goal:** Maine's Governor, AG, Secretary of State, Treasurer, US Senators, and US House members are seeded with offices and headshots; legislature-elected offices are correctly modeled as appointed.
**Verified:** 2026-05-19T08:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Governor Janet Mills appears with office title 'Governor' (external_id -230001) | VERIFIED | Row confirmed: full_name='Janet T. Mills', title='Governor', district_type='STATE_EXEC', state='ME', geo_id='23' |
| 2 | AG/SoS/Treasurer have is_appointed_position=true; no races rows | VERIFIED | All 3 offices have is_appointed_position=t, is_appointed=t; races count=0 |
| 3 | Collins + King appear as Senators on NATIONAL_UPPER ME district | VERIFIED | Both rows: district_type='NATIONAL_UPPER', state='ME', geo_id='23', is_appointed_position=f |
| 4 | Pingree on geo_id=2301 (ME-01), Golden on geo_id=2302 (ME-02) | VERIFIED | Pingree: geo_id='2301' NATIONAL_LOWER ME; Golden: geo_id='2302' NATIONAL_LOWER ME |
| 5 | All 8 officials have politician_images rows with non-null url and photo_license | VERIFIED | 8/8 rows with Supabase Storage URLs; licenses: public_domain (Mills, Frey, Perry) + cc_by_sa (Bellows, Collins, King, Pingree, Golden); Collins URL returns HTTP 200 at 66KB |

**Score:** 5/5 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| essentials.politicians rows (-230001 to -230004) | 4 ME executives | VERIFIED | Mills, Frey, Bellows, Perry all present |
| essentials.politicians rows (-230101, -230102, -230201, -230202) | 4 federal officials | VERIFIED | Collins, King, Pingree, Golden all present |
| essentials.offices with is_appointed_position | Correct flags per office | VERIFIED | Governor=false; AG/SoS/Treasurer=true; all 4 federal=false |
| essentials.districts STATE_EXEC ME | 4 STATE_EXEC districts | VERIFIED | state='ME', geo_id='23', all 4 executives |
| essentials.districts NATIONAL_UPPER ME | 1 shared senator district | VERIFIED | geo_id='23', state='ME' |
| essentials.districts NATIONAL_LOWER ME | geo_ids 2301 + 2302 | VERIFIED | Pre-existing from Phase 49; Pingree and Golden wired correctly |
| migration 169_me_state_executives.sql | Executives migration file | VERIFIED | File exists at C:/EV-Accounts/backend/migrations/169_me_state_executives.sql |
| migration 170_me_federal_officials.sql | Federal officials migration file | VERIFIED | File exists at C:/EV-Accounts/backend/migrations/170_me_federal_officials.sql |
| essentials.politician_images (8 rows) | Headshots for all 8 officials | VERIFIED | 8/8 rows with non-null url + photo_license in {public_domain, cc_by_sa} |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| politicians (-230001 to -230004) | offices (is_appointed_position) | office_id back-fill | WIRED | All 4 executives have office_id set; correct flags per office |
| politicians (-230101 to -230202) | offices (is_appointed_position=false) | office_id back-fill | WIRED | All 4 federal officials have office_id set; voter-elected offices |
| AG/SoS/Treasurer offices | essentials.races | no link (correct) | VERIFIED | COUNT=0 — no election races for legislature-appointed offices |
| senators | NATIONAL_UPPER district (geo_id='23') | office → district_id | WIRED | Both Collins and King correctly wired to shared ME NATIONAL_UPPER district |
| Pingree | NATIONAL_LOWER geo_id='2301' | office → district_id | WIRED | Confirmed via direct query |
| Golden | NATIONAL_LOWER geo_id='2302' | office → district_id | WIRED | Confirmed via direct query |
| politician_images | Supabase Storage | url column | WIRED | Collins URL HTTP 200, 66KB returned |

### Anti-Patterns Found

None. No TODO/FIXME, no placeholder rows, no empty returns. All 8 officials have substantive politician + office + district linkage plus headshots.

### Human Verification Required

One item warrants optional human spot-check but does not block goal achievement:

**Visual headshot quality for Frey (Aaron M. Frey)**
- Test: Open the Frey profile page and inspect headshot quality
- Expected: Recognizable professional headshot at 600x750
- Why: Source was 200x280 (maine.gov), upscaled via Lanczos. PIL confirms dimensions are correct, but visual quality at 3x upscale may show softness.
- Risk level: Low — AG is a less-prominent official; acceptable per plan decision

---

## Gaps Summary

No gaps. All 5 must-haves pass against the live production database.

- Governor Mills: STATE_EXEC row with is_appointed_position=false (voter-elected)
- AG Frey, SoS Bellows, Treasurer Perry: STATE_EXEC rows with is_appointed_position=true + is_appointed=true + zero races rows (correctly modeled as legislature-elected)
- Collins + King: NATIONAL_UPPER ME district (geo_id='23'), is_appointed_position=false
- Pingree: NATIONAL_LOWER geo_id='2301', Golden: NATIONAL_LOWER geo_id='2302'
- All 8 politician_images rows exist with Supabase Storage URLs (HTTP 200 confirmed on spot-check) and valid photo_license values

---

_Verified: 2026-05-19T08:30:00Z_
_Verifier: Claude (gsd-verifier)_
