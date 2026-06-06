---
phase: 94-md-headshots
plan: "01"
subsystem: headshots
tags: [headshots, maryland, federal, congress]
dependency_graph:
  requires: [migration 275_md_federal_officials.sql]
  provides: [essentials.politician_images rows for 10 MD federal officials, Supabase Storage politician_photos objects]
  affects: [MD federal politician profile pages, 94-02 gap-check verification]
tech_stack:
  added: []
  patterns: [congress.gov primary + Wikimedia Commons fallback, dynamic UUID resolution via psycopg2, idempotent NOT EXISTS guard, 4:5 crop-first then 600x750 Lanczos q90]
key_files:
  created:
    - scripts/md_federal_officials_headshots.py
  modified: []
decisions:
  - congress.gov primary (per D-01); Wikimedia Commons fallback (per D-02); never halt on per-official failure
  - Dynamic UUID resolution at startup via resolve_politician_uuids() — asserts exactly 10 rows
  - Van Hollen/Alsobrooks already had old-path DB rows from prior phase; updated to new {politician_id}-headshot.jpg path and added photo_license=public_domain
  - Two Wikimedia fallback URLs corrected at runtime (Olszewski, April McClain Delaney) using Wikipedia pageimages API
metrics:
  duration: "~25 minutes"
  completed: "2026-06-05"
  tasks_completed: 2
  files_changed: 1
---

# Phase 94 Plan 01: MD Federal Officials Headshots Summary

Sourced, processed, and uploaded headshots for all 10 MD federal officials (2 US senators + 8 US House reps), closing the only outstanding gap from Phases 92-93.

## Final Script Output

**First run SUMMARY (combined across two runs due to fallback URL corrections):**
```
OFFICIALS=10  processed=8  skipped_exists=2  failed=0
```
(Van Hollen + Alsobrooks were skipped on script runs because they already had DB rows from a prior seeding phase. Their storage objects and DB rows were updated to the standard path/license via a correction step.)

**Idempotency re-run SUMMARY:**
```
OFFICIALS=10  processed=0  skipped_exists=10  failed=0
All 10 officials complete (0 new uploads, 10 skipped)
```

## Source Mix Actually Used

| Official | Source |
|----------|--------|
| Chris Van Hollen (-400033) | congress.gov (v000128_200.jpg) |
| Angela Alsobrooks (-400034) | Wikimedia Commons (corrected URL) |
| Andy Harris (-2440001) | congress.gov (h001052_200.jpg) |
| Johnny Olszewski (-2440002) | Wikimedia Commons (corrected URL) |
| Sarah Elfreth (-2440003) | congress.gov (e000299_200.jpg) |
| Glenn Ivey (-2440004) | congress.gov (i000058_200.jpg) |
| Steny Hoyer (-2440005) | congress.gov (h000874_200.jpg) |
| April McClain Delaney (-2440006) | Wikimedia Commons (corrected URL) |
| Kweisi Mfume (-2440007) | congress.gov (m000687_200.jpg) |
| Jamie Raskin (-2440008) | congress.gov (r000606_200.jpg) |

**Summary: 7/10 from congress.gov, 3/10 from Wikimedia Commons fallback**

congress.gov 404d for: Olszewski (-2440002), April McClain Delaney (-2440006) — both served from Wikimedia.
Alsobrooks congress.gov also 404d; served from Wikimedia.

## DB Verification Query Result

```sql
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE (p.external_id IN (-400033, -400034) OR p.external_id BETWEEN -2440008 AND -2440001)
  AND pi.type = 'default';
```

**Result: COUNT = 10** (verified 2026-06-05)

All 10 rows have:
- `type = 'default'`
- `photo_license = 'public_domain'`
- URL path: `{SUPABASE_URL}/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg`

## Idempotency Confirmation

Second run (after all 10 processed):
```
OFFICIALS=10  processed=0  skipped_exists=10  failed=0
```
Script exits 0. Zero new uploads, zero new inserts.

## Storage Verification

HTTP HEAD against one storage URL:
```
GET https://kxsdzaojfaibhuzmclfq.supabase.co/storage/v1/object/public/politician_photos/ff596d3f-3056-43e2-a80a-8c4b8fd9abde-headshot.jpg
Status: 200, Content-Type: image/jpeg
```

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected three Wikimedia Commons fallback URLs**
- **Found during:** Task 2 (script execution)
- **Issue:** Three fallback URLs used `440px-` prefix or non-existent filenames, causing HTTP 400
  ("Use thumbnail sizes listed on w.wiki/GHai") or HTTP 404:
  - Olszewski: `Johnny_Olszewski_official_portrait_119th_Congress.jpg` does not exist on Commons
  - April McClain Delaney: `April_McClain_Delaney_official_portrait_119th_Congress.jpg` does not exist on Commons
  - Alsobrooks: congress.gov also 404d, and original fallback filename was wrong
- **Fix:** Located correct filenames via Wikipedia pageimages API for all three; updated to 500px canonical thumbnail sizes. Script re-run with corrected URLs succeeded.
- **Files modified:** scripts/md_federal_officials_headshots.py
- **Commit:** 7ca4042

**2. [Rule 2 - Missing] Updated Van Hollen/Alsobrooks existing rows to standard path + photo_license**
- **Found during:** Task 2 (DB inspection after script showed skipped_exists=2)
- **Issue:** Van Hollen and Alsobrooks already had `politician_images` rows from a prior seeding phase, but with old-style path (`/{politician_id}/default.jpg`) and empty `photo_license`. The new standard is `{politician_id}-headshot.jpg` path and `photo_license='public_domain'`.
- **Fix:** Downloaded, processed, and uploaded both senators' headshots to the new path; UPDATE'd their DB rows with new URL and `photo_license='public_domain'`.
- **Files modified:** DB rows updated inline (no script change needed for this step)
- **Commit:** covered by 7ca4042 (script has correct fallback URLs for future idempotent runs)

## Per-Official Notes

| Official | Dimensions | Crop applied | Source |
|----------|-----------|--------------|--------|
| Van Hollen | 178x225 -> 178x222 | top-crop (too tall) | congress.gov |
| Alsobrooks | 500x625 | none (already 4:5) | wikimedia |
| Andy Harris | 175x217 -> 173x217 | center-crop (slightly wide) | congress.gov |
| Johnny Olszewski | 500x625 | none (already 4:5) | wikimedia |
| Sarah Elfreth | 175x219 -> 175x218 | top-crop (too tall) | congress.gov |
| Glenn Ivey | 175x219 -> 175x218 | top-crop (too tall) | congress.gov |
| Steny Hoyer | 175x225 -> 175x218 | top-crop (too tall) | congress.gov |
| April McClain Delaney | 500x625 | none (already 4:5) | wikimedia |
| Kweisi Mfume | 175x275 -> 175x218 | top-crop (very tall) | congress.gov |
| Jamie Raskin | 175x227 -> 175x218 | top-crop (too tall) | congress.gov |

All final outputs: 600x750, JPEG q90.

## Known Stubs

None.

## Threat Flags

None — script writes to Supabase Storage and DB via service role key (already in threat model for headshot ingestion scripts).

## Self-Check: PASSED

- [x] scripts/md_federal_officials_headshots.py exists and parses
- [x] 10 JPEG files exist in scripts/tmp_md_federal_headshots/
- [x] DB COUNT = 10 (verified via psycopg2 query)
- [x] Idempotent re-run: processed=0, skipped_exists=10, failed=0
- [x] HTTP HEAD on one storage URL returns 200 image/jpeg
- [x] Commits exist: 6232086 (Task 1 script), 7ca4042 (Task 2 fallback URL corrections)
