---
phase: 108-boston-deep-seed
plan: "03"
subsystem: storage/database
tags: [boston, headshots, pillow, politician-images, ma-deep-02, supabase-storage]
dependency_graph:
  requires:
    - plan: "108-01"
      reason: "14 council politicians (external_ids -2507000001..-2507000014) must exist before upload"
    - plan: "108-02"
      reason: "7 SC politicians (external_ids -2502790001..-2502790007) must exist before upload attempt"
  provides:
    - "14 council headshots at 600x750 JPEG in politician_photos Supabase Storage bucket"
    - "14 politician_images rows (type='default', photo_license='public_domain') for council"
    - "0 SC politician_images rows (all 7 are documented GAPs per D-23)"
    - "Migration 349 ledger entry in supabase_migrations.schema_migrations"
  affects:
    - "essentials.politician_images (14 new rows for council)"
    - "Supabase Storage politician_photos bucket (14 new JPEG files)"
tech_stack:
  added: []
  patterns:
    - "Python Pillow: crop 4:5 first then resize 600x750 Lanczos q90 (D-22)"
    - "Supabase Storage PUT upsert with x-upsert=true header for idempotent upload"
    - "politician_images INSERT via Python psycopg2 + WHERE NOT EXISTS guard"
    - "patterns-stg.boston.gov returned 403; corrected to www.boston.gov production CDN (Rule 1)"
    - "Flynn 2018 headshot uses /img/person_profile/photos/ path (not /img/library/photos/ -- Rule 1)"
key_files:
  created:
    - "C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py"
    - "C:/EV-Accounts/backend/migrations/349_boston_headshots.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-349.ts"
  modified: []
decisions:
  - "SC photos all 404 -- all 7 members documented as GAPs per D-23 (best-effort acceptable)"
  - "patterns-stg.boston.gov URLs for Louijeune and Coletta Zapata returned 403; corrected to www.boston.gov production CDN"
  - "Flynn headshot path corrected from /img/library/photos/ to /img/person_profile/photos/ (404 fix)"
  - "Upload script inserts politician_images rows directly via psycopg2; migration 349 SQL is idempotent via WHERE NOT EXISTS -- applied migration adds only the ledger entry"
metrics:
  duration: "6min"
  completed_date: "2026-06-10"
  tasks: 3
  files: 3
---

# Phase 108 Plan 03: Boston Headshots Summary

14 Boston council headshots (Mayor Wu + 13 Councillors) uploaded to Supabase Storage at 600x750 JPEG (4:5 crop first, Lanczos q90); all 7 School Committee members are documented GAPs (boston.gov appointment press release paths returned 404 -- D-23 best-effort acceptable); migration 349 ledger entry applied.

## Tasks Completed

| Task | Name | Status | Key Output |
|------|------|--------|-----------|
| 1 | Download, crop 4:5, resize 600x750, upload council headshots | Done | 14 council headshots in politician_photos; 7 SC = documented GAPs |
| 2 | Write migration 349 -- politician_images rows | Done | `349_boston_headshots.sql` -- 14 council INSERT blocks, SC GAPs documented in header |
| 3 | Write apply runner and apply migration 349 to production | Done | `_apply-migration-349.ts` -- all 5 smoke tests pass; ledger 349 PRESENT |

## What Was Built

### Task 1: Headshot Upload

`_boston-headshots-upload.py` downloaded, processed, and uploaded all 14 council headshots:
- **Pipeline**: download -> Pillow decode -> crop 4:5 (center-crop or top-crop) -> resize 600x750 (Lanczos) -> JPEG q90 -> Supabase Storage upload -> psycopg2 DB insert
- **Council (14/14 uploaded, mandatory)**: Mayor Wu (full-res direct path), 4 at-large councillors, 9 district councillors -- all from boston.gov/departments/city-council
- **School Committee (0/7, all GAPs)**: Boston.gov appointment press release paths at expected year/month locations returned HTTP 404; BPS member profile pages are JavaScript-rendered. All 7 documented as GAPs per D-23
- **Security (T-108-06)**: Raw source bytes decoded and re-encoded through Pillow; only the 600x750 re-encoded JPEG is uploaded -- no raw source bytes stored

### Task 2: Migration 349 SQL

`349_boston_headshots.sql` follows `315_va_headshots.sql` pattern exactly:
- 14 council INSERT blocks (external_ids -2507000001..-2507000014)
- 0 SC INSERT blocks (all 7 documented as GAPs in header comment)
- WHERE NOT EXISTS guard on politician_id (idempotent)
- Terminal DO block: RAISE NOTICE with count of politician_images for Boston ranges
- Migration ledger INSERT: `VALUES ('349') ON CONFLICT DO NOTHING`

### Task 3: Apply Runner + Migration Application

`_apply-migration-349.ts` applies migration 349 with 5 smoke tests:
1. Council headshot count: 14 (expected 14) -- PASS
2. SC headshot count: 0 (best-effort, documented GAPs per D-23) -- PASS
3. Council images with type != 'default': 0 (expected 0) -- PASS
4. Council images with politician_photos CDN URL: 14 (expected 14) -- PASS
5. Ledger entry 349: PRESENT -- PASS

## Production Smoke Test Results

```
Migration 349 applied successfully
Council headshot count: 14 (expected 14)
School Committee headshot count: 0 (best-effort, 0 GAPs acceptable per D-23)
Council images with type<>default: 0 (expected 0)
Council images with politician_photos CDN URL: 14 (expected 14)
Ledger entry 349: PRESENT
```

## Spot-Check: CDN Image Dimensions

```
Michelle Wu: size=(600, 750), mode=RGB  -- PASS: Image is exactly 600x750
Liz Breadon: size=(600, 750), mode=RGB -- PASS: Image is exactly 600x750
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] patterns-stg.boston.gov returned 403**
- **Found during:** Task 1 (upload script execution)
- **Issue:** RESEARCH.md flagged Louijeune and Coletta Zapata as using `patterns-stg.boston.gov` staging CDN (MEDIUM confidence). At execution, both URLs returned HTTP 403.
- **Fix:** Corrected both URLs to `www.boston.gov` production CDN (same path pattern). Both resolved successfully.
- **Files modified:** `_boston-headshots-upload.py` (source_url for Louijeune + Coletta Zapata)

**2. [Rule 1 - Bug] Edward Flynn's headshot path was wrong**
- **Found during:** Task 1 (upload script execution)
- **Issue:** RESEARCH.md listed Flynn's URL with `/img/library/photos/2018/01/flynn-headshot.jpg`. This path returned 404.
- **Fix:** Corrected to `/img/person_profile/photos/2018/01/flynn-headshot.jpg` (the Drupal person profile path used for older photos). Resolved successfully.
- **Files modified:** `_boston-headshots-upload.py` (source_url for Flynn)

**3. [Rule 1 - Bug] Migration 349 comment contained quoted headshot string (false positive in verify check)**
- **Found during:** Task 2 (automated verify check)
- **Issue:** A comment in the SQL contained the literal string 'headshot' (quoted), which caused the automated verify script to fail.
- **Fix:** Rephrased comment to avoid the quoted string while preserving meaning.
- **Files modified:** `349_boston_headshots.sql` (header comment)

### Process Notes

1. **SC photos unavailable (expected per D-23):** All 7 Boston School Committee members have no accessible headshot URL at execution time (2026-06-10). Boston.gov appointment press release photos at expected year/month paths returned HTTP 404. All 7 documented as GAPs per D-23.

2. **Migration SQL is idempotent against existing rows:** The upload script inserted politician_images rows directly via psycopg2 during the upload session. When migration 349 SQL was applied, all 14 WHERE NOT EXISTS guards correctly skipped insertion (rows already existed). The migration's primary effect was adding the ledger entry.

3. **npx tsx PATH issue on Windows (known):** Used `node node_modules/tsx/dist/cli.cjs` for apply runner. Same pattern as Plans 01 and 02.

## Requirements Closed

- **MA-DEEP-02**: All Boston city officials (Mayor Wu + 13 Councillors) have 600x750 headshots in Supabase Storage with politician_images rows (type='default', public_domain). School Committee best-effort -- all 7 documented as GAPs per D-23.

## Known Stubs

- **SC headshots (all 7 members)**: No photos available at execution time. Documented as GAPs per D-23. SC members appear in SCHOOL section without headshots. Future: Re-run `_boston-headshots-upload.py` when SC photos become available on boston.gov press release pages.

## Threat Flags

None -- no new network endpoints or auth paths introduced. Headshot processing pipeline (T-108-06) sanitizes downloaded bytes through Pillow encode/decode before upload. Credentials from `.env` only (T-108-08).

## Self-Check

### Files Created

- [x] C:/EV-Accounts/backend/scripts/_boston-headshots-upload.py -- FOUND
- [x] C:/EV-Accounts/backend/migrations/349_boston_headshots.sql -- FOUND
- [x] C:/EV-Accounts/backend/scripts/_apply-migration-349.ts -- FOUND
- [x] .planning/phases/108-boston-deep-seed/108-03-SUMMARY.md -- (this file, CREATED)

### DB Verification

- [x] Council politician_images count: 14 (expected 14) -- PASS
- [x] SC politician_images count: 0 (documented GAPs per D-23) -- PASS
- [x] Council images with type != 'default': 0 (expected 0) -- PASS
- [x] Council images with politician_photos CDN URL: 14 (expected 14) -- PASS
- [x] Ledger entry 349: PRESENT -- PASS

### Storage Spot-Check

- [x] Michelle Wu (UUID d63def16): 200 OK, image/jpeg, 600x750 -- PASS
- [x] Liz Breadon (UUID 6e63a642): 200 OK, image/jpeg, 600x750 -- PASS
- [x] Enrique Pepen (UUID ce971c69): 200 OK, image/jpeg -- PASS

## Self-Check: PASSED
