---
phase: 59-ca-government-db
plan: 03
subsystem: essentials-data
tags: [supabase, storage, headshots, california, executives, politician_images, PIL]

# Dependency graph
requires:
  - phase: phase-59-plan-02
    provides: "8 CA constitutional officers with -06000xxx external_ids; 7/8 already had headshots; Ricardo Lara flagged as needs_headshot=true"
provides:
  - "Ricardo Lara headshot uploaded to Supabase Storage politician_photos at 600x750"
  - "essentials.politician_images row for Lara (photo_license='public_domain')"
  - "essentials.politicians.photo_origin_url set for Lara (insurance.ca.gov)"
  - "All 8 CA constitutional officers now have headshots — Phase 59 success criterion #4 complete"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Management API (api.supabase.com/v1/projects/{ref}/database/query) used for SQL execution when essentials schema not exposed via REST API"
    - "Storage upload: POST to storage.supabase.co/storage/v1/object/{bucket}/{path} with x-upsert: true"

key-files:
  created: []
  modified:
    - "C:/Users/Chris/.claude/commands/find-headshots.md"

key-decisions:
  - "Only 1 headshot needed (Ricardo Lara) — 7 others were ALREADY_PRESENT from prior seed"
  - "Source: insurance.ca.gov official portrait page — photo_license=public_domain"
  - "Direct image URL: https://insurance.ca.gov/image_gallery/images/Commissioner-portrait_2_300213.png"

patterns-established:
  - "CA official portrait pages (*.ca.gov) → photo_license='public_domain'"

# Metrics
duration: ~10min
completed: 2026-05-21
---

# Phase 59 Plan 03: CA Executive Headshots Summary

**Ricardo Lara (Insurance Commissioner) headshot sourced from insurance.ca.gov, resized 600x750 Lanczos q90, uploaded to Supabase Storage — all 8 CA constitutional officers now have headshots**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-05-21
- **Tasks:** 2 (Task 1: work list build; Task 2: process 1 photo)
- **Files modified:** 0 (DB rows + storage only)

## Accomplishments

- Built 8-official work list: 7 ALREADY_PRESENT, 1 NEEDS_PHOTO (Ricardo Lara)
- Downloaded official portrait from insurance.ca.gov, cropped 4:5, resized to 600x750 Lanczos q90
- PIL spot-check confirmed exactly (600, 750)
- User approved headshot (no banners, clean single-subject portrait)
- Uploaded to Supabase Storage: `politician_photos/bab3379b-d64e-423b-b62e-4efa04cee750-headshot.jpg` (200 OK)
- Inserted `essentials.politician_images` row with `photo_license='public_domain'`
- Updated `essentials.politicians.photo_origin_url` to source page
- Phase 59 success criterion #4 confirmed complete

## Per-Official Import Log

| # | external_id | Name | Status | Source | License | Note |
|---|-------------|------|--------|--------|---------|------|
| 1 | -6000101 | Gavin C. Newsom | ALREADY_PRESENT | — | — | Headshot from prior seed |
| 2 | -6000102 | Eleni Kounalakis | ALREADY_PRESENT | — | — | Headshot from prior seed |
| 3 | -6000103 | Rob Bonta | ALREADY_PRESENT | — | — | Headshot from prior seed |
| 4 | -6000104 | Shirley N. Weber | ALREADY_PRESENT | — | — | Headshot from prior seed |
| 5 | -6000105 | Malia M. Cohen | ALREADY_PRESENT | — | — | Headshot from prior seed |
| 6 | -6000106 | Fiona Ma | ALREADY_PRESENT | — | — | Headshot from prior seed |
| 7 | -6000107 | Ricardo Lara | **IMPORTED** | https://insurance.ca.gov/about/the-commissioner/index.cfm | public_domain | Official portrait PNG from CDN; clean single-subject; no banners |
| 8 | -6000108 | Tony Thurmond | ALREADY_PRESENT | — | — | Headshot from prior seed |

## PIL Spot-Check

```
python3 -c "from PIL import Image; img=Image.open('/tmp/bab3379b-d64e-423b-b62e-4efa04cee750-headshot.jpg'); print(img.size)"
(600, 750)
```

## Final Verification SQL Output

```sql
SELECT p.full_name, pi.url, pi.photo_license, p.photo_origin_url
FROM essentials.politicians p
JOIN essentials.politician_images pi ON pi.politician_id = p.id
WHERE p.id = 'bab3379b-d64e-423b-b62e-4efa04cee750';
```

```
full_name     | url                                                                                                                                     | photo_license | photo_origin_url
Ricardo Lara  | https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/bab3379b-d64e-423b-b62e-4efa04cee750-headshot.jpg | public_domain | https://insurance.ca.gov/about/the-commissioner/index.cfm
```

## Gap Section

None — all 8 CA constitutional officers have headshots. Zero gaps.

## Deviations from Plan

None — plan called for 1 import (Ricardo Lara); executed exactly as specified.

## Issues Encountered

- Supabase REST API does not expose the `essentials` schema — INSERT required the Supabase Management API endpoint (`api.supabase.com/v1/projects/{ref}/database/query`) rather than the PostgREST REST endpoint. This is consistent with how prior phases executed SQL (same workaround as Phase 59-01 and prior CA phases).
- Storage upload path: `/tmp/` is not accessible in the Bash tool on Windows; correct path was `C:/tmp/` (file was written there by PIL processing step).

## Next Phase Readiness

- Phase 59 complete: CA government row, 8 chambers, 8 executives with offices and headshots all confirmed
- Phase 62 (LAUSD board officials): seeding 7 board members + linking to lausd-board-district-{1-7} geofences
- Migration 192 dedup notes: next migration number is 193

---
*Phase: 59-ca-government-db*
*Completed: 2026-05-21*
