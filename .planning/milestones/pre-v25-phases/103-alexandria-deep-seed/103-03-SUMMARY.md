---
phase: 103-alexandria-deep-seed
plan: "03"
subsystem: database
tags:
  - virginia
  - alexandria
  - headshots
  - migration
dependency_graph:
  requires:
    - Phase 103 Plan 01 (Alexandria city government seeded — 7 politician UUIDs)
    - Phase 103 Plan 02 (ACPS school board seeded — 9 politician UUIDs)
  provides:
    - 7 Alexandria city official headshots in politician_photos bucket
    - 9 ACPS board member headshots in politician_photos bucket
    - politician_images rows for all 16 officials (type='default')
    - VA-DEEP-03 requirement satisfied
  affects:
    - Supabase Storage bucket: politician_photos (16 new files)
    - essentials.politician_images (16 rows added)
tech_stack:
  added: []
  patterns:
    - Pillow crop-4:5-then-resize-600x750-Lanczos-q90 (project standard)
    - Supabase Storage PUT with x-upsert:true header
    - politician_images INSERT with WHERE NOT EXISTS guard (migration 271 pattern)
    - Post-verification DO block with hard gate on Alexandria count (v_expected_alex:=7)
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py
    - C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql
  modified:
    - C:/Transparent Motivations/essentials/.planning/STATE.md
decisions:
  - "Sandy Marks source: no individual profile on alexandriava.gov as of 2026-06-08 (special election April 2026, sworn in May 2026); used alxnow.com election night photo IMG_3246.jpeg (1600x1200 landscape, center-cropped to 960x1200 for 4:5, then resized to 600x750)"
  - "Sandy Marks photo review: no text/graphics superimposed over the face (feedback_headshot_no_graphics rule satisfied); campaign button on jacket lapel is a physical item worn, not an overlay"
  - "ACPS images: Finalsite CDN; removed 't_image_size_1' transform from URLs to get 1400px+ originals instead of 256px thumbnails; stored as f_auto,q_auto pattern"
  - "Alexandria city images: used /sites/default/files/{year}/{filename} original files (not the crop_card_image or crop_head_shot Drupal styles) — originals are 1294x2000 PNG portraits"
metrics:
  duration: "~50m"
  completed: "2026-06-09"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 103 Plan 03: Alexandria + ACPS Headshots Summary

**One-liner:** 7 Alexandria city council + 9 ACPS board headshots uploaded to politician_photos Supabase Storage bucket and inserted as politician_images rows via migration 314; VA-DEEP-03 satisfied.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Download + process + upload headshots via Python script | Done | cf484da |
| 2 | Write + apply migration 314_alexandria_headshots.sql | Done | 03a4355 |

## Manifest — Alexandria City Council (7/7 SUCCESS)

| external_id | full_name | politician_id | storage URL |
|-------------|-----------|---------------|-------------|
| -5101000001 | Alyia Gaskins | c217f344-476f-4b84-90bc-6c731bfb4161 | ...politician_photos/c217f344-476f-4b84-90bc-6c731bfb4161-headshot.jpg |
| -5101000002 | Canek Aguirre | b5ff1baa-42fa-440d-a9a5-e84ded256ac1 | ...politician_photos/b5ff1baa-42fa-440d-a9a5-e84ded256ac1-headshot.jpg |
| -5101000003 | Sarah Bagley | ce2be866-a3aa-493b-8475-4a051bcc2461 | ...politician_photos/ce2be866-a3aa-493b-8475-4a051bcc2461-headshot.jpg |
| -5101000004 | John Chapman | 5054e061-1c2b-4158-bfd7-b4ed36b544a0 | ...politician_photos/5054e061-1c2b-4158-bfd7-b4ed36b544a0-headshot.jpg |
| -5101000005 | Abdel-Rahman Elnoubi | ffd87afa-bc0a-43b8-a15c-2eb3f2f83186 | ...politician_photos/ffd87afa-bc0a-43b8-a15c-2eb3f2f83186-headshot.jpg |
| -5101000006 | Jacinta E. Greene | cc96438c-0f0f-4824-98ae-8997aedfa496 | ...politician_photos/cc96438c-0f0f-4824-98ae-8997aedfa496-headshot.jpg |
| -5101000007 | Sandy Marks | edbf3aa4-b992-4ed8-85a9-7189642b517c | ...politician_photos/edbf3aa4-b992-4ed8-85a9-7189642b517c-headshot.jpg |

All 7 URLs base: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/`

## Manifest — ACPS School Board (9/9 SUCCESS)

| external_id | full_name | politician_id | storage URL |
|-------------|-----------|---------------|-------------|
| -5100090001 | Michelle Rief | b40e4216-08aa-4b4f-a6e1-0ca75331d05f | ...politician_photos/b40e4216-08aa-4b4f-a6e1-0ca75331d05f-headshot.jpg |
| -5100090002 | Christopher Harris | 0cd3dd1e-34ab-4380-a476-b935d6ff1a2d | ...politician_photos/0cd3dd1e-34ab-4380-a476-b935d6ff1a2d-headshot.jpg |
| -5100090003 | Abdulahi Abdalla | d2a8a3c6-4383-4764-a009-d3c72f340d88 | ...politician_photos/d2a8a3c6-4383-4764-a009-d3c72f340d88-headshot.jpg |
| -5100090004 | Tim Beaty | 3ce0d684-b942-4a13-844f-720220d37de8 | ...politician_photos/3ce0d684-b942-4a13-844f-720220d37de8-headshot.jpg |
| -5100090005 | Kelly Carmichael Booz | c81b3c02-aac0-440b-90d3-4dd33a326af3 | ...politician_photos/c81b3c02-aac0-440b-90d3-4dd33a326af3-headshot.jpg |
| -5100090006 | Donna Kenley | 24088e84-a138-4374-9117-1e136669890e | ...politician_photos/24088e84-a138-4374-9117-1e136669890e-headshot.jpg |
| -5100090007 | Ryan Reyna | ee18fc57-9d65-4f6a-a376-035539ff3e79 | ...politician_photos/ee18fc57-9d65-4f6a-a376-035539ff3e79-headshot.jpg |
| -5100090008 | Alexander Crider Scioscia | 4fc3ad7a-5aa7-4394-8654-0e79c6c2f671 | ...politician_photos/4fc3ad7a-5aa7-4394-8654-0e79c6c2f671-headshot.jpg |
| -5100090009 | Ashley Simpson Baird | 6025b714-c80e-4613-9da8-f5e6b66c4384 | ...politician_photos/6025b714-c80e-4613-9da8-f5e6b66c4384-headshot.jpg |

## Spot-Check Query Results

| Query | Description | Expected | Actual | Status |
|-------|-------------|----------|--------|--------|
| A | Alexandria politician_images count (type='default') | 7 | 7 | PASS |
| B | ACPS politician_images count (type='default') | 6-9 | 9 | PASS |
| C | URL format check (7 Alexandria rows) | all match bucket+path pattern | all PASS | PASS |
| - | Migration ledger version '314' | present | present | PASS |
| - | Storage HEAD probe (all 16 URLs) | HTTP 200 | 16/16 | PASS |
| - | Post-verification DO block | PASSED | PASSED | PASS |

## Image Processing Details

All images: crop 4:5 FIRST then resize 600x750 Lanczos JPEG q90 (per feedback_headshot_resize_no_distort).

| Official | Source dimensions | Crop operation | Final |
|----------|-------------------|----------------|-------|
| Gaskins | 1294x2000 PNG | top-crop 1294x1617 | 600x750 |
| Aguirre | 1294x2000 PNG | top-crop 1294x1617 | 600x750 |
| Bagley | 1294x2000 PNG | top-crop 1294x1617 | 600x750 |
| Chapman | 1294x2000 PNG | top-crop 1294x1617 | 600x750 |
| Elnoubi | 1294x2000 PNG | top-crop 1294x1617 | 600x750 |
| Greene | 1294x2000 PNG | top-crop 1294x1617 | 600x750 |
| Marks | 1600x1200 JPEG | center-horizontal crop 960x1200 | 600x750 |
| Rief | 1400x1523 WebP | center-horizontal crop 1218x1523 | 600x750 |
| Harris | 1440x1654 WebP | center-horizontal crop 1323x1654 | 600x750 |
| Abdalla | 2774x2912 WebP | center-horizontal crop 2329x2912 | 600x750 |
| Beaty | 1400x1486 WebP | center-horizontal crop 1188x1486 | 600x750 |
| Carmichael Booz | 1400x1624 WebP | center-horizontal crop 1299x1624 | 600x750 |
| Kenley | 1400x1576 WebP | center-horizontal crop 1260x1576 | 600x750 |
| Reyna | 1400x1684 WebP | center-horizontal crop 1347x1684 | 600x750 |
| Scioscia | 1400x1621 WebP | center-horizontal crop 1296x1621 | 600x750 |
| Simpson Baird | 1400x1579 WebP | center-horizontal crop 1263x1579 | 600x750 |

## Migration 314 Applied

- **File:** C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql
- **Applied:** 2026-06-09 via `npx supabase db query --linked --file`
- **Supabase migration ledger:** version '314' inserted into `supabase_migrations.schema_migrations`
- **Post-verification:** DO block PASSED (alex_img_count=7)
- **Statements:** 16 INSERT INTO essentials.politician_images + 1 DO block + 1 ledger entry
- **Column used:** `url` (NOT 'storage_url') per PATTERNS.md §314 and RESEARCH.md Pitfall 4
- **type value:** 'default' (NOT 'headshot') per D-18

## STATE.md Updated

- "Next migration" advanced from 314 to 315
- Accumulated Context line added: "Migration 314 applied: 7 Alexandria + 9 ACPS headshots in politician_photos bucket; VA-DEEP-03 satisfied"

## Deviations from Plan

### Auto-fixed / Discovered Issues

**1. [Rule 1 - Discovered] Sandy Marks no official portrait on alexandriava.gov**
- **Found during:** Task 1 web scraping
- **Issue:** Sandy Marks won a special election April 2026 and was sworn in May 2026. As of 2026-06-08, alexandriava.gov only shows a group 16:9 photo (800x450) for her card — no individual profile page exists. The group photo shows "woman with flag in background smiling at camera" but is landscape and cannot be cropped to a usable headshot.
- **Fix:** Used election night photo from alxnow.com article (published 2026-04-21): `IMG_3246.jpeg` (1600x1200). The photo shows Sandy Marks facing forward with her head and upper body clearly visible. No text or graphics are superimposed over her face (feedback_headshot_no_graphics satisfied — campaign button on lapel is a physical item, not an overlay). Center-cropped to 960x1200 then resized to 600x750.
- **Files modified:** _tmp-alexandria-headshots.py (source_url for Marks), 314_alexandria_headshots.sql (URL value)
- **Alternative check:** Wikimedia Commons (404), Wikipedia (404), alxnow.com news photos — all other available photos were also landscape/event photos with no better portrait option.
- **Note for future:** Once alexandriava.gov creates an official profile for Sandy Marks, her headshot should be replaced with the official portrait. The upsert=True flag on the Storage upload means re-running the script with the official URL would overwrite cleanly.

**2. [Discovered] ACPS images are 256px thumbnails at t_image_size_1**
- **Found during:** Task 1 pre-scripting discovery
- **Issue:** The data-image-sizes JSON on the ACPS board page included URLs with the `t_image_size_1` Finalsite transform, which produces 256px thumbnails. Resizing 256px up to 600px would produce unacceptable artifacts.
- **Fix:** Removed `t_image_size_1` from the URLs (kept `f_auto,q_auto` prefix) to access full-resolution originals (1400-2774px wide). This is a standard Finalsite CDN pattern used in the OR school headshots phase as well.
- **Files modified:** source_url values in _tmp-alexandria-headshots.py

## Known Stubs

None. All 16 headshots point to real uploaded storage objects. politician_images rows have correct URLs, type='default', and valid politician_id references.

## Threat Flags

No new security-relevant surface beyond the threat model documented in the plan.

- T-103-03-01 (Tampering/EXIF): Pillow re-encoded all images as fresh JPEG at q90 — strips EXIF and any stego payload. MITIGATED.
- T-103-03-02 (Wrong bucket name): Script uses 'politician_photos' (verified). Migration uses same bucket in URL string. MITIGATED.
- T-103-03-03 (Key disclosure): SERVICE_KEY read from .env only, never logged or committed. MITIGATED.
- T-103-03-04 (Overlay graphics): Sandy Marks photo reviewed — no text/graphics superimposed over face. MITIGATED.
- T-103-03-05 (DoS from failed uploads): All 7 Alexandria uploads succeeded before migration applied. MITIGATED.
- T-103-03-06 (Distortion): Crop-first-then-resize pipeline enforced. MITIGATED.
- T-103-03-07 (Dead storage URL): All 16 URLs verified HTTP 200 via HEAD. MITIGATED.

## Self-Check: PASSED

File check:
- C:/EV-Accounts/backend/scripts/_tmp-alexandria-headshots.py: EXISTS
- C:/EV-Accounts/backend/migrations/314_alexandria_headshots.sql: EXISTS
- C:/Transparent Motivations/essentials/.planning/STATE.md "Next migration: 315": CONFIRMED

Commit check:
- cf484da (feat(103-03): upload Alexandria + ACPS headshots to Supabase Storage): FOUND
- 03a4355 (feat(103-03): apply migration 314 + advance STATE.md to 315): FOUND

DB spot-check:
- Query A=7 (Alexandria): PASS
- Query B=9 (ACPS): PASS
- Query C all URLs match: PASS
- Migration version '314' in ledger: PASS
- Storage HEAD probe 16/16: PASS
