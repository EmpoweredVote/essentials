---
phase: 84-multnomah-smaller-cities
plan: "02"
subsystem: database/backend
tags: [phase-84, multnomah, oregon, cities, headshots, image-processing]
dependency_graph:
  requires: [phase-84-01]
  provides: [gresham-headshots, troutdale-headshots, wood-village-headshots, cities-06]
  affects: [politician_images, supabase-storage-politician-photos]
tech_stack:
  added: []
  patterns: [python-pil-headshot-pipeline, supabase-storage-upsert, audit-only-migration]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql
  modified: []
  deleted:
    - C:/EV-Accounts/backend/scripts/_tmp-cities-headshots.py (one-shot; deleted after migration 247 finalized)
decisions:
  - "Troutdale URL scrape: all 7 URLs discovered from live page (pre-researched filenames were wrong — underscores not hyphens)"
  - "Wood Village: Patricia Smith photo discovered via live scrape (IMG_8248); Rios-Campos matched by filename 'Campos188' not 'Tan'"
  - "Maywood Park: live probe of cityofmaywoodpark.com/government returned 545K HTML but 0 council member images — confirmed no-photo"
  - "19/19 officials with discoverable photos uploaded at 600x750 JPEG; 12 documented as no-photo"
metrics:
  duration: "90 minutes"
  completed: "2026-06-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
---

# Phase 84 Plan 02: Multnomah Smaller Cities Headshots Summary

**One-liner:** 19 headshots (Gresham 7/7, Troutdale 7/7, Wood Village 5/5) uploaded at 600x750 JPEG to Supabase Storage; 12 no-photo officials documented in audit-only migration 247.

## What Was Built

### Task 1: Python headshot pipeline (`_tmp-cities-headshots.py`)

One-shot Python script (now deleted) that:
1. Fetched politician UUIDs via psycopg2 DB query at startup
2. Pre-scraped `troutdaleoregon.gov/node/721` to extract all 7 Troutdale WebP URLs via regex
3. Pre-scraped `woodvillageor.gov/government/city-council/` to discover all 5 Wood Village image URLs via position-based context matching
4. Probed `cityofmaywoodpark.com/government` (545K HTML, 0 council photos found)
5. Processed each image: crop to 4:5 ratio FIRST, then resize to 600x750 Lanczos q90
6. Uploaded to Supabase Storage `politician_photos/{politician_id}-headshot.jpg` with x-upsert=true
7. Inserted `essentials.politician_images` rows with `type='default'`, `photo_license='public_domain'`

**Deviation required:** Initial run had 2 failures (Ripma and Carol Allen — pre-researched URLs had wrong filenames with hyphens vs actual underscores) and 1 wrong photo match (Rios-Campos matched to Tan's image by context proximity). Fixed by targeted re-uploads using live-scraped correct URLs + direct DB inserts/update.

### Task 2: Audit-only migration 247

`C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` — AUDIT-ONLY record of all 31 officials, matching `245_multnomah_county_headshots.sql` pattern. 19 INSERT blocks (photo uploaded) + 12 no-photo comment blocks (Fairview 7, Maywood Park 5).

## Per-City Photo Upload Outcome

| City | Photos | Count | Notes |
|------|--------|-------|-------|
| Gresham | 7/7 | 7 | All from greshamoregon.gov/globalassets/ (served as WebP despite .jpg extension) |
| Troutdale | 7/7 | 7 | WebP from troutdaleoregon.gov /sites/g/files/vyhlif13696/ — all 7 URLs discovered by live scrape |
| Wood Village | 5/5 | 5 | JPEG/PNG from woodvillageor.gov/wp-content/uploads/ — all 5 discovered by live scrape |
| Fairview | 0/7 | 0 | Confirmed no photos on fairvieworegon.gov (verified absent) |
| Maywood Park | 0/5 | 0 | cityofmaywoodpark.com probed live — 0 council member photos found |
| **Total** | **19/31** | **19** | |

## CDN URLs Written to politician_images

### Gresham

| external_id | full_name | CDN URL |
|-------------|-----------|---------|
| -4131251 | Travis Stovall | `.../8152aa41-5920-4b77-9b4b-14c5bde40c44-headshot.jpg` |
| -4131252 | Kayla Brown | `.../1fc5a9ec-086d-4f15-9d35-c11149783b82-headshot.jpg` |
| -4131253 | Eddy Morales | `.../15010acf-81a8-467b-9a84-18de494c2d67-headshot.jpg` |
| -4131254 | Cathy Keathley | `.../81648f4a-eb28-43dd-9368-97ccc19463bc-headshot.jpg` |
| -4131255 | Jerry Hinton | `.../2efbeccb-be43-4637-ba5f-4b78aa169574-headshot.jpg` |
| -4131256 | Sue Piazza | `.../436f618a-84ec-48cf-a16d-e1b5532b8fd4-headshot.jpg` |
| -4131257 | Janine Gladfelter | `.../3881e5da-ad55-4f1e-b6b5-5091332ad2e7-headshot.jpg` |

### Troutdale

| external_id | full_name | CDN URL | Source filename |
|-------------|-----------|---------|-----------------|
| -4174851 | David Ripma | `.../3d541a36-ded8-4526-ab81-a19e347dc7cd-headshot.jpg` | `david_ripma_new_2023_color.jpg.webp` |
| -4174852 | Carol Allen | `.../bcb580d9-b8a5-49fe-8c94-b45d502b7501-headshot.jpg` | `carol_allen_color.jpg.webp` |
| -4174853 | Jesse Davidson | `.../9fbd31da-61c3-4cfb-97d7-b46e5662d685-headshot.jpg` | `jesse_davidson_color.jpg.webp` |
| -4174854 | John Leamy | `.../f0a0b603-5252-4814-b806-36f9811d4cb7-headshot.jpg` | `john_leamy_color.jpg.webp` |
| -4174855 | Glenn White | `.../fa52105e-0278-44a3-bc6f-5c4a83b9bf2e-headshot.jpg` | `glenn_white_color.jpg.webp` |
| -4174856 | Geoffrey Wunn | `.../8c90648b-d5a5-45e9-8bf2-72bb2bb41c38-headshot.jpg` | `geoffrey_2023_color.jpg.webp` |
| -4174857 | Zach Andrews | `.../cc6afbef-7404-4b5b-b8f6-6e9771fac247-headshot.jpg` | `zach_andrews_color.jpg.webp` |

### Wood Village

| external_id | full_name | CDN URL | Source filename |
|-------------|-----------|---------|-----------------|
| -4183951 | Jairo Rios-Campos | `.../964c9691-3f40-4b95-86c9-d22cf10cc92d-headshot.jpg` | `Campos188_RT-5x7-1-1143x1600.jpg` |
| -4183952 | Dara Tan | `.../0f7137d2-e780-4ca1-bdc4-7406f13df4ca-headshot.jpg` | `Tan-0257_RT-5x7-1-1143x1600.jpg` |
| -4183953 | John Miner | `.../28119052-7b7e-4bb5-b4f4-fce0afcc88d4-headshot.jpg` | `IMG_8898_Miner-571x800-1-243x340.jpeg` |
| -4183954 | Charlene Gothard | `.../40d9f9da-55d0-451b-827d-113d75ea3a6e-headshot.jpg` | `Councilor-Gothard-1280x1600.png` |
| -4183955 | Patricia Smith | `.../2411c25a-4141-4b5b-9e36-3b137430dec3-headshot.jpg` | `IMG_8248-533x800.jpg` |

Base URL prefix: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`

## Source Image Dimensions and Crop Method

| Official | Source Format | Source Size | Crop Applied | Output |
|----------|--------------|-------------|-------------|--------|
| Gresham officials | WebP (from CDN despite .jpg ext) | 91×127-129px | portrait crop (ratio ~1.40) | 600×750 JPEG q90 |
| Troutdale officials | WebP / JPEG | 175×225px | portrait crop (ratio ~1.29) | 600×750 JPEG q90 |
| Jairo Rios-Campos | JPEG | 1143×1600px | portrait crop (ratio ~1.40) | 600×750 JPEG q90 |
| Dara Tan | JPEG | 1143×1600px | portrait crop (ratio ~1.40) | 600×750 JPEG q90 |
| John Miner | JPEG | 243×340px | portrait crop (ratio ~1.40) | 600×750 JPEG q90 |
| Charlene Gothard | PNG | 1280×1600px | portrait crop (ratio 1.25 = exact 4:5) | 600×750 JPEG q90 |
| Patricia Smith | JPEG | 533×800px | portrait crop (ratio ~1.50) | 600×750 JPEG q90 |

All Gresham source URLs return WebP images despite having `.jpg` extensions (CDN content negotiation). Pillow's `Image.open()` handles this transparently.

## Source-Site Fetch Failures

| Official | URL Used | Failure | Resolution |
|----------|----------|---------|------------|
| David Ripma | Pre-researched `david-ripma-mayor.jpg.webp` | HTTP 404 | Re-fetched with live-scraped `david_ripma_new_2023_color.jpg.webp` |
| Carol Allen | Pre-researched `carol-allen.jpg.webp` | HTTP 404 | Re-fetched with live-scraped `carol_allen_color.jpg.webp` |
| Jairo Rios-Campos | Initial context match returned Tan's URL | Wrong photo | Re-processed with correct `Campos188_*` URL |
| Patricia Smith | Not in initial OFFICIALS list | Missing | Discovered via live scrape `IMG_8248-533x800.jpg` |

All failures resolved. Final photo count: 19/19 officials with discoverable photos = 100% success rate.

## Post-Run SQL Gate Output

```
Gate (a) Gresham: 7 (expect 7)       PASS
Gate (b) Troutdale: 7 (expect 7)     PASS
Gate (c) Wood Village: 5 (expect 5)  PASS
Gate (d) Fairview: 0 (expect 0)      PASS
Gate (e) Maywood Park: 0 (expect 0)  PASS
```

## Storage Spot-Check

| Official | CDN Download | Size | Format | OK |
|----------|-------------|------|--------|----|
| Travis Stovall | OK | (600, 750) | JPEG | YES |
| David Ripma | OK | (600, 750) | JPEG | YES |
| Jairo Rios-Campos | OK | (600, 750) | JPEG | YES |
| Patricia Smith | OK | (600, 750) | JPEG | YES |

## Temp Script Deletion

`C:/EV-Accounts/backend/scripts/_tmp-cities-headshots.py` — DELETED after migration 247 finalized.

## Audit Migration 247 Summary Block

```
-- =============== SUMMARY ===============
-- Total officials: 31
-- Headshots uploaded: 19 (Gresham 7, Troutdale 7, Wood Village 5, Maywood Park 0)
-- No photo documented: 12 (Fairview 7, Maywood Park 5)
-- =====================================
```

## Deviations from Plan

### Auto-Fixed Issues

**1. [Rule 1 - Bug] Pre-researched Troutdale URL filenames were wrong (hyphens vs underscores)**
- **Found during:** Task 1 script run — David Ripma and Carol Allen returned HTTP 404
- **Issue:** RESEARCH.md A4 pre-confirmed Mayor Ripma ID=821 and Carol Allen ID=30261. The script used guessed filenames `david-ripma-mayor.jpg.webp` and `carol-allen.jpg.webp` (hyphens). Actual live filenames use underscores: `david_ripma_new_2023_color.jpg.webp`, `carol_allen_color.jpg.webp`
- **Fix:** Removed hardcoded pre-researched URLs; all 7 Troutdale URLs now discovered exclusively via live scrape — correct filenames returned by `re.findall` on the live page HTML
- **Resolution:** Targeted re-upload using live-scraped URLs; DB INSERT added for both officials

**2. [Rule 1 - Bug] Wood Village scrape assigned Tan's photo to Rios-Campos**
- **Found during:** Task 1 script run — context-matching algorithm matched `Tan-0257_*` to Rios-Campos because "Tan" appeared in the HTML context region before "Rios-Campos"
- **Issue:** The initial context-based scraping found Tan's image first in the HTML and matched it to Rios-Campos (context contamination)
- **Fix:** Post-run analysis confirmed `Campos188_*` filename belongs to Rios-Campos (by position-based name-to-image matching). Re-uploaded correct `Campos188_RT-5x7-1-1143x1600.jpg`; existing DB row's URL updated via direct UPDATE statement
- **Script updated:** `scrape_wood_village_urls()` now uses position-based matching (finds each official name in the HTML then searches 2000 chars before for nearby image) to prevent cross-official contamination

**3. [Rule 2 - Missing data] Patricia Smith not initially in OFFICIALS list**
- **Found during:** Post-run DB check — Patricia Smith (-4183955) had NO_IMG despite having a photo on official site
- **Issue:** The initial script's Wood Village context-based scrape failed to match `IMG_8248-*` to Patricia Smith (no obvious name in filename; context match missed)
- **Fix:** Identified via position-based HTML analysis: `IMG_8248-533x800.jpg` appears in the context region before "Patricia Smith". Added targeted upload and DB INSERT

## Known Stubs

None — all 31 officials are documented in migration 247 (19 with photos, 12 confirmed no-photo). No placeholder values.

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes. Only reads from public government sites and writes to existing Supabase Storage + `essentials.politician_images` table. Follows same security posture as Phase 83.

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/247_multnomah_cities_headshots.sql` — EXISTS
- [x] `C:/EV-Accounts/backend/scripts/_tmp-cities-headshots.py` — DELETED (one-shot script)
- [x] SQL Gate (a) Gresham: 7 — PASS
- [x] SQL Gate (b) Troutdale: 7 — PASS
- [x] SQL Gate (c) Wood Village: 5 — PASS
- [x] SQL Gate (d) Fairview: 0 — PASS
- [x] SQL Gate (e) Maywood Park: 0 — PASS
- [x] Storage spot-check: 4 officials verified at exactly 600x750 JPEG
- [x] Migration 247: AUDIT-ONLY header, no ledger entry, 19 INSERT blocks, 12 no-photo comments, all 31 external_ids referenced
- [x] All INSERT blocks use type='default' and photo_license='public_domain'
- [x] Fairview: 0 INSERTs confirmed (7 no-photo comments only)
- [x] Maywood Park: 0 INSERTs confirmed (5 no-photo comments, city probed live)

## Self-Check: PASSED
