---
phase: 88-tx-collin-county-school-boards
plan: "05"
subsystem: headshots
tags:
  - tx
  - richardson-isd
  - headshots
  - supabase-storage
  - gap-closure
dependency_graph:
  requires:
    - 88-01 (Richardson ISD politicians seeded; politician_images rows already present)
  provides:
    - 7 Richardson ISD headshots replaced with clean rectangular crops (no white corners)
  affects:
    - Supabase Storage: politician_photos bucket (7 objects upserted)
metrics:
  duration_minutes: 20
  completed_date: "2026-06-04"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 7
  db_rows_inserted: 0
---

# Phase 88 Plan 05: Richardson ISD Headshot Fix Summary

**One-liner:** Replaced 7 Richardson ISD board member headshots (circular-masked 500×500 WordPress JPEGs with white corners) with clean 600×750 rectangular crops sourced from the same official bio pages; no DB changes required.

## What Was Done

The RISD WordPress CMS only serves 500×500 circular-masked JPEGs from `web.risd.org/board/wp-content/uploads/`. No rectangular alternates exist on the official site (news archives, press sections all returned 404s; variant URL probing returned HTML 404 pages). 

**Resolution approach:** Center-cropped the 500×500 sources to 280×350 (verified all 4 crop corners land inside the circle boundary at radius ~236px from center), then resized to 600×750 Lanczos q90. This yields clean rectangular photos with no white corners and no circular masking artifacts visible. All images upserted to Supabase Storage at existing paths — the pre-existing `politician_images` rows with `type='default'` automatically serve the new images.

## Members Processed

| Name | External ID | Politician ID | Source URL |
|------|-------------|---------------|------------|
| Megan Timme | -880029 | 8470a90b | web.risd.org/board/megan-timme/ → `Megan-Timme-1.jpg` |
| Vanessa Pacheco | -880030 | 5251f0ce | web.risd.org/board/vanessapacheco/ → `VanessaP.jpg` |
| Debbie Rentería | -880031 | ec88a426 | web.risd.org/board/debbie-renteria/ → `DebbieR.jpg` |
| Regina Harris | -880032 | 39e1ba04 | web.risd.org/board/regina-harris/ → `ReginaH.jpg` |
| Rachel McGowan | -880033 | f647b141 | web.risd.org/board/rachel-mcgowan/ → `RachelM-1.jpg` |
| Eric Eager | -880034 | d7ef4dbe | web.risd.org/board/eric-eager/ → `EricE.jpg` |
| Chris Poteet | -880035 | d6406c4a | web.risd.org/board/chris-poteet/ → `ChrisP.jpg` |

## Processing Method

- Source: 500×500 JPEG (WordPress circular-masked)
- Circle radius: ~236px centered at (250,250)
- Crop: 280×350 centered at (250,250) — all 4 corners at ~224px from center (inside circle)
- Resize: 600×750 Lanczos, q90 JPEG
- Upload: Supabase Storage `politician_photos` bucket, `x-upsert: true`

## Human Verify Result

Approved 2026-06-04:
- All 7 Richardson ISD board member photos display as clean rectangular headshots ✓
- No white corner artifacts visible ✓
- Debbie Rentería's name renders with correct accented í ✓

## Deviations from Plan

No true rectangular-source replacement photos found on official RISD website (only 500×500 circular-masked from WordPress CMS). Resolved via center-crop technique that stays within the circle boundary — produces visually clean rectangular headshots without uploading circular-masked images. Source restriction to official RISD website (D-17) honored throughout.

## Self-Check

PASSED:
- 7 Storage uploads: HTTP 200 for all
- DB rows: 7 politician_images rows with type='default' confirmed post-upload
- Debbie Rentería: `é` preserved in `full_name` (accent is on `í` in Rentería — confirmed by user)
- Source restriction: all photos from web.risd.org only (D-17 compliant)
- No circular-masked images uploaded — all uploads are cropped-rectangular
