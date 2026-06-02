---
phase: 86-multnomah-county-school-districts
verified: 2026-06-01T00:00:00Z
status: human_needed
score: 12/12 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Visual review of 38 uploaded headshots — confirm no banner/text overlay over faces"
    expected: "All 38 photos show clean headshots with no 'Re-Elect' banners, campaign graphics, or superimposed text over the face; each sourced from the district's official website"
    why_human: "PIL/grep cannot detect superimposed graphics — only visual inspection can verify the feedback_headshot_no_graphics.md constraint"
  - test: "Visual review of cropping and composition for a sample of 6 headshots (one per district)"
    expected: "Eyes positioned at roughly 1/3 from the top; full head and shoulders visible; 4:5 aspect ratio maintained without distortion; no stretching"
    why_human: "Pixel dimensions (600x750) are verifiable programmatically but correct subject positioning (eyes at ~1/3, head+shoulders) requires human visual confirmation per feedback_headshot_cropping.md"
---

# Phase 86: Multnomah County School Districts — Verification Report

**Phase Goal:** 6 Multnomah County school district G5420 geofences + board members seeded; 38 board member headshots uploaded
**Verified:** 2026-06-01
**Status:** human_needed (all automated checks pass; 2 visual headshot checks require human review)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 6 G5420 geofence_boundaries rows exist for all 6 Multnomah County school districts with correct geo_ids, state='41', source='tiger_unsd_or_2024' | ✓ VERIFIED | DB query returns COUNT=6; rows confirmed for geo_ids 4110040, 4109480, 4110520, 4102800, 4103940, 4110560 |
| 2 | 6 essentials.governments rows exist with type='LOCAL', state='OR' (uppercase) | ✓ VERIFIED | DB query returns COUNT=6; migration 254 uses 'OR' uppercase for governments.state |
| 3 | 6 essentials.chambers rows exist (one Board of Education per government), no slug in INSERT | ✓ VERIFIED | DB query returns COUNT=6; migration 254 chambers INSERT column list confirmed to exclude slug |
| 4 | 6 essentials.districts rows exist with district_type='SCHOOL' (not 'SCHOOL_DISTRICT'), state='or' (lowercase), mtfcc='G5420' | ✓ VERIFIED | DB query returns COUNT=6; migration 254 uses 'SCHOOL' and 'or' lowercase throughout |
| 5 | 38 politicians exist with external_ids -860001..-860007 (PPS), -860011..-860015 (Parkrose), -860021..-860027 (Reynolds), -860031..-860037 (Centennial), -860041..-860047 (David Douglas), -860051..-860055 (Riverdale); party=NULL, is_appointed=false, is_incumbent=true | ✓ VERIFIED | DB query returns COUNT=38; all 38 external_ids present in migration 254; party=NULL, is_appointed=false verified in SQL |
| 6 | 38 offices exist linking each politician to its SCHOOL district; titles follow per-district convention (Zone/Position/Seat) | ✓ VERIFIED | DB query returns COUNT=38 offices joined to SCHOOL districts; migration 254 uses 'Board Member (Zone N)', 'Board Member (Position N)', 'Board Member (Seat N)' per district |
| 7 | All 38 politicians have non-NULL office_id (back-fill complete) | ✓ VERIFIED | DB query: COUNT WHERE office_id IS NULL = 0 |
| 8 | Section-split check returns 0 orphan geofences | ✓ VERIFIED | DB query: 0 G5420 geofences among the 6 target geo_ids lack a matching SCHOOL district row |
| 9 | Portland City Hall coordinate (-122.6794, 45.5231) returns 7 PPS board members via SCHOOL routing JOIN | ✓ VERIFIED | DB routing query returns 7 rows, all geo_id='4110040' |
| 10 | Riverdale coordinate (-122.6627, 45.4450) returns 5 Riverdale members and 0 PPS members (district isolation) | ✓ VERIFIED | DB routing query returns 5 rows, all geo_id='4110560'; PPS cross-contamination = 0 (note: coordinate was corrected from (-122.6794, 45.4472) — original falls inside PPS polygon; centroid (-122.6627, 45.4450) confirmed within Riverdale TIGER polygon per 86-01-SUMMARY.md deviation note) |
| 11 | Migration 254 applied to production; ledger entry for '254' exists; re-run raises exception | ✓ VERIFIED | DB query: supabase_migrations.schema_migrations WHERE version='254' returns 1 row |
| 12 | 38 politician_images rows exist with type='default'; all URLs use correct Supabase Storage pattern; migration 255 is AUDIT-ONLY (no ledger entry) | ✓ VERIFIED | DB: COUNT=38 with type='default'; COUNT=38 with correct kxsdzaojfaibhuzmclfq Storage URL; version='255' returns 0 rows; Edward Wang spot-check URL confirmed |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `C:/EV-Accounts/backend/scripts/load-or-school-boundaries.ts` | TIGER UNSD downloader + G5420 inserter for 6 OR school districts | ✓ VERIFIED | 268 lines (>200 min); contains TIGER URL, all 6 GEOIDs, downloadWithRedirects, extractZip, ST_ForcePolygonCCW, ST_GeomFromGeoJSON, ON CONFLICT (geo_id, mtfcc) DO NOTHING |
| `C:/EV-Accounts/backend/scripts/smoke-phase86.ts` | Phase 86 smoke test — 5 labeled assertions SC1-SC5 | ✓ VERIFIED | 246 lines (>150 min); contains district_type='SCHOOL', state='or', both test coordinates, ST_Covers, section-split NOT EXISTS, process.exit(0)/exit(1) |
| `C:/EV-Accounts/backend/migrations/254_or_school_districts.sql` | 6 governments + 6 chambers + 6 SCHOOL districts + 38 politicians + 38 offices + office_id back-fill + post-verification DO block + ledger entry | ✓ VERIFIED | 1631 lines (>800 min); all 38 external_ids present; district_type='SCHOOL', state='or', governments.state='OR'; no slug in chambers INSERT; Unicode ñ/é present; ledger entry VALUES ('254') confirmed |
| `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py` | Python PIL upload script — downloads, crops 4:5, resizes 600x750 Lanczos q90, uploads | ✓ VERIFIED | 714 lines (>100 min); all 6 required functions present (crop_to_4_5, resize_600x750, upload_to_storage, insert_politician_images_row, process_member, main); TARGET_SIZE=(600,750), JPEG_QUALITY=90, LANCZOS; type='default'; all 38 external_ids in roster |
| `C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql` | AUDIT-ONLY documentation of 38 politician_images inserts — safety guard, 6 district sections, no ledger entry | ✓ VERIFIED | 595 lines (>250 min); RAISE EXCEPTION guard as first executable statement; no INSERT INTO supabase_migrations; no BEGIN/COMMIT; 38 external_ids covered across 6 district sections; type='default', photo_license='public_domain'; Unicode ñ/é in comments; SUMMARY block claims 38/38 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| load-or-school-boundaries.ts | essentials.geofence_boundaries (mtfcc='G5420', state='41') | INSERT with ON CONFLICT (geo_id, mtfcc) DO NOTHING | ✓ WIRED | 6 rows confirmed in production DB; ST_ForcePolygonCCW(ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON($6)), 4326)) verified in source |
| essentials.offices.district_id | essentials.districts (district_type='SCHOOL', state='or', geo_id IN 6 GEOIDs) | FK JOIN inside migration; verified by section-split detector and post-verification DO block | ✓ WIRED | 38 offices confirmed joined to SCHOOL districts; section-split = 0 |
| essentials.geofence_boundaries (G5420, state='41') | essentials.districts (SCHOOL, state='or') | geo_id JOIN used by essentialsService.ts address lookup | ✓ WIRED | Portland City Hall → 7 PPS members; Riverdale centroid → 5 Riverdale members; no cross-contamination |
| essentials.politicians.office_id | essentials.offices.id | back-fill UPDATE at end of migration; WHERE external_id BETWEEN -860055 AND -860001 AND office_id IS NULL | ✓ WIRED | COUNT of NULL office_id = 0 confirmed in production DB |
| essentials.politician_images.url | Supabase Storage politician_photos/{politician_id}-headshot.jpg | live INSERTs by _tmp-or-school-headshots.py; documented in migration 255 | ✓ WIRED | 38 rows with correct kxsdzaojfaibhuzmclfq.storage URL pattern; Edward Wang UUID confirmed as 10b4ad6b-7db3-4805-b103-1c830f91637c |
| essentials.politician_images.type='default' | Frontend .find(img => img.type === 'default') | type literal in Python script INSERT and migration 255 | ✓ WIRED | All 38 rows confirmed type='default' in production DB; no type='headshot' rows |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| essentialsService.ts (school routing) | SCHOOL board members returned to address lookup | G5420 geofence_boundaries → districts (SCHOOL) → offices → politicians via ST_Covers | Yes — 7 PPS members and 5 Riverdale members confirmed via live DB routing query | ✓ FLOWING |
| politician_images rows | Headshot URLs in Storage | _tmp-or-school-headshots.py — live DB INSERT from official district websites → Storage upload | Yes — 38 rows confirmed; Edward Wang URL returns 200 per SUMMARY spot-check | ✓ FLOWING |

---

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| G5420 geofences loaded for all 6 districts | `SELECT COUNT(*) ... WHERE state='41' AND mtfcc='G5420' AND source='tiger_unsd_or_2024'` | 6 | ✓ PASS |
| 6 SCHOOL district government bodies seeded | `SELECT COUNT(*) FROM essentials.governments WHERE name IN (6 names)` | 6 | ✓ PASS |
| 38 politicians seeded with correct external_id range | `SELECT COUNT(*) ... WHERE external_id BETWEEN -860055 AND -860001` | 38 | ✓ PASS |
| All 38 office_ids back-filled | `SELECT COUNT(*) ... WHERE office_id IS NULL` | 0 | ✓ PASS |
| Portland City Hall → PPS routing | ST_Covers(-122.6794, 45.5231) via SCHOOL JOIN | 7 rows, all geo_id='4110040' | ✓ PASS |
| Riverdale centroid → Riverdale routing (district isolation) | ST_Covers(-122.6627, 45.4450) via SCHOOL JOIN | 5 rows, all geo_id='4110560', 0 PPS | ✓ PASS |
| Section-split = 0 | NOT EXISTS query across 6 target geo_ids | 0 orphan geofences | ✓ PASS |
| 38 headshots with type='default' in politician_images | `SELECT COUNT(*) ... WHERE type='default' AND external_id BETWEEN -860055 AND -860001` | 38 | ✓ PASS |
| Migration 255 NOT in ledger (audit-only) | `SELECT version FROM supabase_migrations.schema_migrations WHERE version='255'` | 0 rows | ✓ PASS |
| Migration 254 in ledger | `SELECT version FROM supabase_migrations.schema_migrations WHERE version='254'` | 1 row | ✓ PASS |

---

### Probe Execution

Step 7c: No probe scripts (scripts/tests/probe-*.sh pattern) declared or found for Phase 86. Smoke test verified via direct DB queries above.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| OR-SCHOOL-01 | 86-01 | G5420 geofences loaded for all 6 Multnomah County school districts | ✓ SATISFIED | 6 G5420 rows in geofence_boundaries with state='41', source='tiger_unsd_or_2024'; all 6 target geo_ids confirmed |
| OR-SCHOOL-02 | 86-01 | School board government bodies seeded (district_type='SCHOOL') | ✓ SATISFIED | 6 governments + 6 Board of Education chambers + 6 SCHOOL districts confirmed in production DB |
| OR-SCHOOL-03 | 86-01 | Board member officials + offices seeded for all 6 districts | ✓ SATISFIED | 38 politicians + 38 offices + 0 NULL office_ids confirmed |
| OR-SCHOOL-04 | 86-02 | Board member headshots at 600x750 where available online | ✓ SATISFIED | 38/38 politician_images rows with type='default'; all URLs point to correct Supabase Storage bucket; 38/38 succeeded (0 documented gaps) |

**Note on REQUIREMENTS.md documentation state:** The REQUIREMENTS.md traceability table shows OR-SCHOOL-01, OR-SCHOOL-02, OR-SCHOOL-03 as "Pending" and their checkbox as `[ ]`. This is a documentation artifact — the requirements file was not updated after phase completion. The codebase evidence (DB queries, migrations, source files) definitively proves all 4 requirements are satisfied. OR-SCHOOL-04 is correctly marked `[x]` Complete. No code gap exists; the requirements file needs a documentation update only.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none) | — | No TBD, FIXME, XXX, or PLACEHOLDER markers found in any of the 5 phase 86 files | — | — |

One notable item from _tmp-or-school-headshots.py: the David Douglas district (ddouglas.k12.or.us) required `verify=False` for SSL due to a certificate issue on their site. The SUMMARY documents this as deviation #1 and notes the site content was verified as authentic. This is a sourcing workaround, not a data integrity problem — the headshots uploaded are genuine board member photos from the official district website.

---

### Human Verification Required

#### 1. Visual Headshot Review — No Banner/Text Overlay

**Test:** Open a sample of the 38 uploaded headshots (recommend 1-2 per district) and visually confirm no superimposed text, campaign graphics, or banners appear over the face.

**Expected:** Clean headshots showing only the board member's face and shoulders; no "Re-Elect", district logo watermarks, or other text overlaid on the face.

**Why human:** PIL/grep cannot detect visual overlay graphics. The constraint from `memory/feedback_headshot_no_graphics.md` requires human visual confirmation. The Python script documents sourcing from official district websites but cannot detect if a given official photo happens to have a graphic overlay.

Sample URLs to check:
- PPS (Finalsite WebP): `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/10b4ad6b-7db3-4805-b103-1c830f91637c-headshot.jpg` (Edward Wang, -860001)
- Parkrose (landscape crop): spot-check Paul Tabron Jr. (-860011)
- Reynolds (near-square Drupal): spot-check Aaron Muñoz (-860021)
- David Douglas (SSL-bypassed source): spot-check José Gamero-Georgeson (-860047)
- Riverdale (small Finalsite): spot-check Milessa Lowrie (-860055)

#### 2. Visual Headshot Composition Review — Eyes at 1/3, Head+Shoulders

**Test:** For the same sample, confirm (a) eyes appear at approximately the upper third of the frame, (b) full head and crown visible, (c) shoulders included, (d) image is not visibly stretched or distorted.

**Expected:** Natural portrait composition; no awkward cropping that cuts off forehead or makes subjects appear squeezed.

**Why human:** Pixel dimensions (600x750) are confirmed programmatically. Subject positioning quality — whether the crop preserves a natural headshot composition with the correct eye-line — requires human visual judgment per `memory/feedback_headshot_cropping.md`. The SUMMARY's crop table shows "top-crop" applied for tall portraits and "center-crop" for landscape/square sources, which is the correct algorithm, but edge cases (Riverdale sources were only 256px wide; Parkrose was 1024x768 landscape) may have unusual compositions that warrant a quick look.

---

### Deviations from Plan

The following deviations were documented in SUMMARY files — all are acceptable and do not affect correctness:

1. **Riverdale smoke test coordinate corrected:** Original plan coordinate (-122.6794, 45.4472) falls inside the PPS polygon, not Riverdale. Corrected to polygon centroid (-122.6627, 45.4450) confirmed within Riverdale TIGER geometry. The verification above uses the corrected coordinate and confirms correct district isolation.

2. **Migration number shift:** RESEARCH.md said migration 253 (seed) and 254 (headshots). Because 253_fix_ca_legislature_orphan_context_rows.sql already existed, the seed became 254 and the headshots audit became 255. Both are applied/documented correctly.

3. **David Douglas SSL:** ddouglas.k12.or.us has a certificate issue requiring `verify=False`. Content authenticity confirmed by executor visual review during upload. All 7 David Douglas photos are in production Storage.

4. **Centennial CMS:** RESEARCH.md described Centennial as "Finalsite-like" but execution found ParentSquare/SmartSites CDN. Photos discovered from HTML img src attributes. All 7 photos successfully uploaded.

5. **PPS WebP content-type:** PPS Finalsite resource-manager URLs return image/webp despite JPEG-looking paths. PIL handles WebP natively; re-save as JPEG q90 produces correct output.

---

### Gaps Summary

No automated-check gaps. All 12 must-have truths are verified against the production database. The only items requiring attention are the 2 visual headshot checks listed above (human verification), which cannot be satisfied programmatically.

The REQUIREMENTS.md documentation discrepancy (OR-SCHOOL-01/02/03 showing as Pending/unchecked) is a documentation state issue only, not a code or data gap.

---

_Verified: 2026-06-01_
_Verifier: Claude (gsd-verifier)_
