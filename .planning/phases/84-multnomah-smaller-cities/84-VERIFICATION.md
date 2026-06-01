---
phase: 84-multnomah-smaller-cities
verified: 2026-06-01T18:00:00Z
status: human_needed
score: 9/9 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Load a Gresham address (e.g. '1333 NW Eastman Pkwy, Gresham, OR 97030') in the app's Representatives tab"
    expected: "LOCAL section shows Mayor Travis Stovall and 6 council members (Kayla Brown, Eddy Morales, Cathy Keathley, Jerry Hinton, Sue Piazza, Janine Gladfelter), all with headshot photos"
    why_human: "UI rendering requires a running app and visual confirmation that politician card images load correctly at 600x750 crop"
  - test: "Load a Wood Village address (e.g. '2055 NE 238th Dr, Wood Village, OR 97060') in the app's Representatives tab"
    expected: "LOCAL section shows Mayor Jairo Rios-Campos BEFORE 'Wood Village City Council' sub-group containing Dara Tan, John Miner, Charlene Gothard, Patricia Smith — all with headshots"
    why_human: "Ordering fix (groupHierarchy.js) must be verified in the live rendered UI, not just by grep; UAT previously caught the ordering inversion"
  - test: "Load '10100 NE Marx St, Maywood Park, OR 97220' in the app's Representatives tab"
    expected: "LOCAL section shows Mayor Jim Akers and 4 council members (Kevin Bussema, Jeff Baltzell, Miriam Berman, Thomas Welander) — NOT Portland leadership; no geocoder autocorrect to Portland"
    why_human: "Enclave-city alias fix in essentialsService.ts requires live routing verification; this address previously returned Portland officials and requires re-confirmation post-deployment"
  - test: "Load a Fairview address (e.g. '300 Main St, Fairview, OR 97024') in the app's Representatives tab"
    expected: "LOCAL section shows Mayor Keith Kudrna and 6 council members with placeholder avatars (no headshots). No broken images."
    why_human: "Fairview has no headshots per CITIES-06; the app must gracefully render placeholder avatars for officials with no politician_images row"
---

# Phase 84: Multnomah Smaller Cities Verification Report

**Phase Goal:** All 5 incorporated cities in Multnomah County outside Portland have government bodies and elected officials seeded so residents see their local representatives
**Verified:** 2026-06-01T18:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria + PLAN must_haves)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Government bodies exist for all 5 cities (Gresham, Troutdale, Fairview, Wood Village, Maywood Park) with City Council chambers and officials seeded | VERIFIED | Migration 246 creates 5 governments + 5 chambers + 10 districts + 31 politicians + 31 offices; all 10 SQL gates confirmed in 84-01-SUMMARY.md; commits exist in ev-accounts-backend repo |
| 2 | A Gresham address lookup returns Gresham city officials (Mayor + council members) — no empty LOCAL section | VERIFIED | Smoke test SC2 for geo_id=4131250 passes (7 officials returned); Travis Stovall + 6 council members confirmed by smoke test |
| 3 | Troutdale, Fairview, Wood Village, and Maywood Park addresses return that city's officials without routing errors | VERIFIED | Smoke test SC1/SC2 for all 4 city centroids pass; ENCLAVE_CITY_ALIASES in essentialsService.ts fixes Maywood Park enclave routing (commit 5520fdc + tightened 11cc399) |
| 4 | Headshots at 600x750 uploaded for all officials where public online source exists | VERIFIED | 19/31 headshots uploaded (Gresham 7/7, Troutdale 7/7, Wood Village 5/5); Fairview 0/7 (confirmed no photos); Maywood Park 0/5 (confirmed no photos); spot-check confirms 600x750 JPEG format; audit migration 247 documents all 31 outcomes |
| 5 | Wood Village LOCAL section: Mayor appears BEFORE City Council sub-group (district_type guard on EXECUTIVE_KW) | VERIFIED | groupHierarchy.js lines 382-387 contain `pols.every(p => p.district_type === 'LOCAL_EXEC')` guard; commit a88076f confirmed; diff verified against source |
| 6 | Maywood Park address returns Maywood Park officials (not Portland officials) | VERIFIED | ENCLAVE_CITY_ALIASES constant at line 75 of essentialsService.ts with 'maywood park' → hostCity:'portland'; override block at line 557-568 substitutes resolvedLat/Lng; passed to districtQueryText at line 697; tightened by commit 11cc399 to use city field instead of state fallback |
| 7 | 31 politicians have non-null office_id (office_id back-fill complete) | VERIFIED | SQL Gate 6 in 84-01-SUMMARY.md: COUNT(*) WHERE office_id IS NULL = 0 for all 31 external_ids; back-fill UPDATE confirmed in migration 246 |
| 8 | Section-split check returns 0 rows for all 5 G4110 geo_ids | VERIFIED | Smoke test SC3 passes; SQL Gate 7 in 84-01-SUMMARY.md: 0 rows; section-split query confirmed in smoke-multnomah-cities.ts lines 168-179 |
| 9 | Audit-only migration 247 documents all 31 officials; temp upload script deleted | VERIFIED | Migration 247 confirmed EXISTS, AUDIT-ONLY header present, no BEGIN/COMMIT/ledger entry, RAISE EXCEPTION abort guard on direct execution; all 31 external_ids referenced; _tmp-cities-headshots.py confirmed DELETED |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/migrations/246_multnomah_cities_government.sql` | Single BEGIN/COMMIT migration seeding 5 governments + 31 officials | VERIFIED | File exists; contains all 5 government name literals with type='LOCAL', state='OR'; 10 districts with state='or' (lowercase); E''an Todd with doubled ASCII apostrophe; is_appointed_position=true on Wood Village Mayor (-4183951) and Maywood Park Mayor (-4146731) only; no district_type='COUNTY' or 'SCHOOL'; no mtfcc X0013-X0018 references |
| `C:/EV-Accounts/backend/scripts/smoke-multnomah-cities.ts` | 5-coordinate routing smoke test with SC1/SC2/SC3 | VERIFIED | File exists; TEST_ADDRESSES with exactly 5 entries and correct geo_ids; EXPECTED_NAMES_BY_GEO_ID with all 31 names; queryLocalOfficials uses IN ('LOCAL','LOCAL_EXEC'); SC3 section-split query present |
| `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` | AUDIT-ONLY migration documenting 31 officials | VERIFIED | File exists; AUDIT-ONLY header; DO NOT apply via Supabase ledger; RAISE EXCEPTION guard; no BEGIN/COMMIT/ledger entry; 19 INSERT blocks (Gresham 7, Troutdale 7, Wood Village 5) with type='default' and photo_license='public_domain'; 12 no-photo comment blocks (Fairview 7, Maywood Park 5); SUMMARY block at end |
| `src/lib/groupHierarchy.js` | subGroupOrderScore with district_type guard | VERIFIED | File exists at line 382-387 with `pols.every(p => p.district_type === 'LOCAL_EXEC')` guard on EXECUTIVE_KW return-10 branch; second EXECUTIVE_KW branch returns 20 for LOCAL sub-groups |
| `C:/EV-Accounts/backend/src/lib/essentialsService.ts` | ENCLAVE_CITY_ALIASES constant + override block | VERIFIED | ENCLAVE_CITY_ALIASES at line 75 with 'maywood park' entry (lat: 45.5525170, lng: -122.5617782, hostCity: 'portland'); override block at lines 555-568; resolvedLat/resolvedLng passed to both districtQueryText and tribalQueryText at line 697; tightened to use city field not state fallback (commit 11cc399) |
| `C:/EV-Accounts/backend/scripts/_tmp-cities-headshots.py` | One-shot temp script — should be DELETED | VERIFIED | File confirmed absent (DELETED as required by plan convention) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| essentials.offices.district_id (31 rows) | essentials.districts.id (10 rows: 5 LOCAL_EXEC + 5 LOCAL) | FK join validated by post-verification DO block inside migration | WIRED | SQL Gate 5: COUNT offices via districts JOIN = 31; post-verification DO block gates confirmed passed in 84-01-SUMMARY.md |
| essentials.geofence_boundaries (5 G4110 rows, state='41') | essentials.districts (10 new rows, state='or') | geo_id JOIN in districtQueryText routing query | WIRED | Smoke test SC1 + SC2 for all 5 city centroids passes; routing query confirmed in essentialsService.ts via geo_id = gb.geo_id AND district_type IN ('LOCAL','LOCAL_EXEC') |
| essentials.politicians.office_id (31 rows) | essentials.offices.id (31 rows) | back-fill UPDATE at end of migration | WIRED | SQL Gate 6: 0 NULL office_ids; UPDATE with explicit IN list of all 31 external_ids confirmed in migration 246 |
| groupHierarchy.js subGroupOrderScore | district_type field on politician objects | pols[0].district_type check before EXECUTIVE_KW score | WIRED | grep confirms `pols.every(p => p.district_type === 'LOCAL_EXEC')` at line 384; commit a88076f diff verified |
| essentialsService.ts getRepresentativesByAddress | geocodeAddress result | ENCLAVE_CITY_ALIASES lookup after geocodeAddress call | WIRED | resolvedLat/resolvedLng substitution at lines 557-568; passed to districtQueryText at line 697; commit 5520fdc + tightening commit 11cc399 verified |
| Supabase Storage politician_photos | essentials.politician_images.url | CDN URL written at upload time | WIRED | 19 politician_images rows with URLs matching kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/; spot-check confirms 600x750 JPEG at 4 sampled URLs |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CITIES-01 | 84-01 | Gresham city council government body + elected officials seeded | SATISFIED | Government row + 7 officials (Travis Stovall + 6 council members) + 7 offices confirmed via SQL gates and smoke test SC2 geo_id=4131250 |
| CITIES-02 | 84-01 | Troutdale city council government body + elected officials seeded | SATISFIED | Government row + 7 officials (David Ripma + 6 councilors) + 7 offices confirmed via SQL gates and smoke test SC2 geo_id=4174850 |
| CITIES-03 | 84-01 | Fairview city council government body + elected officials seeded | SATISFIED | Government row + 7 officials (Keith Kudrna + 6 including E'an Todd) + 7 offices confirmed; E''an escaped correctly in SQL |
| CITIES-04 | 84-01, 84-03 | Wood Village city council government body + elected officials seeded; Mayor ordering correct | SATISFIED | Government row + 5 officials seeded; groupHierarchy.js district_type guard fixes Mayor-before-council ordering; commit a88076f confirmed |
| CITIES-05 | 84-01, 84-03 | Maywood Park city council government body + elected officials seeded; routing correct | SATISFIED | Government row + 5 officials seeded; ENCLAVE_CITY_ALIASES fixes Census TIGER/USPS city name mismatch routing to Portland; commits 5520fdc + 11cc399 confirmed |
| CITIES-06 | 84-02 | Headshots for smaller city officials where available online | SATISFIED | 19/31 headshots uploaded at 600x750 JPEG q90; Gresham 7/7, Troutdale 7/7, Wood Village 5/5; Fairview 0/7 and Maywood Park 0/5 documented in audit migration 247 with explicit no-photo comments |

All 6 phase requirements (CITIES-01 through CITIES-06) are satisfied. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `246_multnomah_cities_government.sql` | Pre-flight | Pre-flight DO block RAISE EXCEPTION aborts on re-run rather than being idempotent | INFO | Note: idempotency is preserved by WHERE NOT EXISTS guards on all INSERTs; pre-flight only aborts a full second BEGIN...COMMIT transaction, not individual statements. The plan's own idempotency spec (D-13) says "re-applying inserts 0 additional rows" — the pre-flight RAISE EXCEPTION means a second direct apply would hard-abort rather than silently skip, which is more conservative than D-13 intended. Not a bug; migration was designed single-use. |

No TBD/FIXME/XXX markers found in phase-modified files. No stub returns. No hardcoded empty arrays used for rendering. No placeholder text in visible data.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Smoke test exits 0 for all 5 cities | `npx tsx scripts/smoke-multnomah-cities.ts` | SC1/SC2/SC3 all PASS per 84-03-SUMMARY.md smoke test output | PASS (per SUMMARY) |
| ENCLAVE_CITY_ALIASES constant present at correct location | `grep -n "ENCLAVE_CITY_ALIASES" essentialsService.ts` | Lines 75, 560 | PASS |
| district_type guard present in groupHierarchy.js | `grep -n "district_type.*LOCAL_EXEC" groupHierarchy.js` | Line 384 | PASS |
| Migration 247 has no BEGIN/COMMIT/ledger entry | grep check | 0 matches for BEGIN;, COMMIT;, INSERT INTO supabase_migrations | PASS |
| Temp upload script deleted | `ls _tmp-cities-headshots.py` | File not found | PASS |

Note: Live smoke test rerun was not performed here (requires live Supabase connection with DATABASE_URL). The SUMMARY.md-reported smoke test output is corroborated by static code verification showing all 5 geo_ids, correct queryLocalOfficials filter, and SC3 section-split SQL in the smoke test file.

### Human Verification Required

The following items require live app testing to fully confirm the phase goal. Two UAT failures from the original UAT session (test 4 — Wood Village ordering, test 6 — Maywood Park routing) were addressed by Plan 03 gap closure. Re-verification of those specific tests in the live app is needed.

#### 1. Gresham Address Lookup with Headshots

**Test:** Load '1333 NW Eastman Pkwy, Gresham, OR 97030' (City Hall — valid Census TIGER address, per UAT gap note) in the app's Representatives tab.
**Expected:** LOCAL section shows Mayor Travis Stovall and 6 council members (Kayla Brown, Eddy Morales, Cathy Keathley, Jerry Hinton, Sue Piazza, Janine Gladfelter). All 7 display headshot photos from Supabase Storage (not broken images). County section also shows Multnomah County commissioners.
**Why human:** UAT test 2 failed with a bad test address ('200 NE Russell St'); the correct address was identified as not-a-bug. This is the re-test with the correct address. Photo rendering requires visual confirmation in the live UI.

#### 2. Wood Village Mayor Ordering (post-Plan-03 fix)

**Test:** Load '2055 NE 238th Dr, Wood Village, OR 97060' in the app's Representatives tab.
**Expected:** LOCAL section shows Mayor Jairo Rios-Campos BEFORE the 'Wood Village City Council' sub-group. All 5 officials display headshot photos. The Council President (Dara Tan) appears within the council sub-group, not ahead of the Mayor.
**Why human:** UAT test 4 originally failed (Mayor appeared after council). Plan 03 fixed groupHierarchy.js with a district_type guard. The fix is confirmed in the source code, but the ordering change must be re-confirmed in the live rendered UI.

#### 3. Maywood Park Routing (post-Plan-03 fix)

**Test:** Load '10100 NE Marx St, Maywood Park, OR 97220' in the app's Representatives tab.
**Expected:** LOCAL section shows Jim Akers (Mayor) and 4 council members (Kevin Bussema, Jeff Baltzell, Miriam Berman, Thomas Welander). The section does NOT show Portland leadership. No geocoder autocorrect behavior visible to the user.
**Why human:** UAT test 6 originally failed (geocoder returned Portland). Plan 03 added ENCLAVE_CITY_ALIASES to essentialsService.ts (commits 5520fdc + tightening 11cc399). Backend requires re-deployment for the fix to take effect in production; live API response must be confirmed.

#### 4. Fairview Address — Placeholder Avatars (no headshots)

**Test:** Load '300 Main St, Fairview, OR 97024' (corrected address per UAT gap, no directional prefix) in the app's Representatives tab.
**Expected:** LOCAL section shows Mayor Keith Kudrna and 6 council members with placeholder avatars (no politician_images rows exist for Fairview). No broken images — graceful fallback to avatar.
**Why human:** UAT test 5 failed with a bad test address. Correct address identified in UAT gap analysis. This tests the no-headshot graceful-degradation path.

---

## Gaps Summary

No gaps found. All 9 must-have truths are verified. All 6 requirement IDs (CITIES-01 through CITIES-06) are satisfied. The 4 human verification items above are re-tests of previously-failed UAT tests (2 were bad-address non-bugs, 2 were real bugs fixed by Plan 03 gap closure). Automated checks confirm the code-level fixes are in place; live app confirmation is the remaining step.

The phase's critical data integrity decisions are all verified:
- E'an Todd: `E''an Todd` (doubled ASCII apostrophe U+0027) confirmed in migration SQL
- Wood Village + Maywood Park Mayors: is_appointed=true + is_appointed_position=true confirmed (SQL Gate 8 = 2)
- districts.state='or' (lowercase) maintained throughout migration
- No Gresham ward geofences (X0013-X0018) — D-05 correctly overridden
- Audit migration 247 has RAISE EXCEPTION abort guard so it cannot be applied accidentally

---

_Verified: 2026-06-01T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
