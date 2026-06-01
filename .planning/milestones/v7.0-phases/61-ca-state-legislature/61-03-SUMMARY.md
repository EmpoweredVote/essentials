---
phase: 61-ca-state-legislature
plan: 03
subsystem: media
tags: [headshots, supabase-storage, python, images, ca-assembly, ca-senate, politician-images]

# Dependency graph
requires:
  - phase: 61-02
    provides: "80 CA Assembly politicians (-6002001..-6002080) and 40 CA Senate politicians (-6001001..-6001040) seeded with canonical external_ids"
provides:
  - "120 politician_images rows with type='default', photo_license='public_domain'"
  - "120 600x750 JPEG headshots in Supabase Storage at {politician_id}-headshot.jpg"
  - "80 Assembly headshots sourced from webapi.assembly.ca.gov bulk API (completed by previous agent)"
  - "40 Senate headshots sourced from www.senate.ca.gov/senators page data-src attributes"
affects: [62-lausd, 63-sf-city, 64-la-city, 65-sj-city, 66-sd-city]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase Storage upload via PUT to /storage/v1/object/{bucket}/{filename} with service role key"
    - "Image crop-then-resize: crop to 4:5 first (center crop if wider, top crop if taller), then resize 600x750 Lanczos"
    - "senate.ca.gov uses double-encoded %25xx paths in data-src; use path as-is (no additional decoding)"
    - "politician_images schema: id, politician_id, url, type, photo_license, focal_point (NO photo_origin_url column)"

key-files:
  created:
    - "C:/Transparent Motivations/essentials/scripts/ca_skip_check.py"
    - "C:/Transparent Motivations/essentials/scripts/ca_senate_headshots.py"
    - "C:/Transparent Motivations/essentials/scripts/ca_senate_insert_rows.py"
  modified: []

key-decisions:
  - "Senate headshots sourced from centralized www.senate.ca.gov/senators page rather than 40 individual district sites — all 40 images found there with data-src lazy-load pattern"
  - "photo_origin_url column does not exist on essentials.politician_images — plan doc was wrong; actual columns are id/politician_id/url/type/photo_license/focal_point"
  - "Storage upload succeeded for all 40 senators before DB insert failure was detected — recovery script ran inserts with correct schema separately"
  - "All 80 Assembly headshots were completed by a previous agent before rate limit hit; this agent processed all 40 senators"

# Metrics
duration: 15min
completed: 2026-05-21
---

# Phase 61 Plan 03: CA State Legislature Headshots Summary

**120 CA legislators (80 Assembly + 40 Senate) all have 600x750 official government headshots in Supabase Storage and politician_images rows; sourced from assembly.ca.gov API (Assembly) and senate.ca.gov/senators centralized roster (Senate)**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-05-21
- **Tasks:** 2 (Assembly already complete; Senate sourcing + upload)
- **Files created:** 3 Python scripts

## Accomplishments

- Confirmed 80 Assembly members already had headshots (completed by previous agent)
- Sourced all 40 Senate headshot URLs from www.senate.ca.gov/senators page (data-src lazy-load attributes)
- Downloaded, cropped to 4:5, resized to 600x750 Lanczos, and uploaded all 40 Senate headshots to Supabase Storage
- Inserted 40 politician_images rows for Senate members with type='default', photo_license='public_domain'
- Verification confirmed: 120/120 legislators have headshots, 0 missing

## Verification Results

```
Total with headshot (expected 120): 120
Missing headshots (expected 0): 0
Verification PASSED
```

Sample spot-checks (all 600x750 RGB):
- Megan Dahle (SD-01): OK
- Scott Wiener (SD-11): OK
- Brian Jones (SD-40): OK
- Sasha Perez (SD-25): OK

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] politician_images has no photo_origin_url column**

- **Found during:** First Senate DB insert attempt
- **Issue:** Plan specified inserting `photo_origin_url` but actual table schema has `focal_point` instead; the column does not exist
- **Fix:** Removed `photo_origin_url` from INSERT statement; used only (id, politician_id, url, type, photo_license)
- **Files modified:** `ca_senate_insert_rows.py` (separate recovery script)
- **Impact:** All 40 Storage uploads succeeded before the error was detected; only DB inserts needed to be retried

**2. [Rule 3 - Blocking] Previous agent hit rate limit after Assembly; Senate not started**

- **Found during:** Skip-check queries at session start
- **Issue:** Previous agent completed all 80 Assembly members but left all 40 Senate members with no headshots
- **Fix:** This agent focused entirely on Senate headshots; Assembly was skipped (already complete)
- **Result:** Seamless continuation; no duplicate work

### Technical discoveries

- **senate.ca.gov URL encoding**: The page HTML contains double-encoded `%25xx` paths in `data-src` attributes. Using these paths verbatim (without any additional decoding) returns HTTP 200 with correct JPEG images. Decoding the paths results in 404.
- **senate.ca.gov lazy images**: The `<img src>` attribute contains a 1x1 GIF placeholder; real URLs are in `data-src`. Any scraping approach using `img.src` will see blank base64 GIFs.
- **sd37.senate.ca.gov redirect**: SD-37 (Steven Choi) redirects to www.senate.ca.gov instead of a district page — but his headshot appears correctly in the centralized senators roster on senate.ca.gov/senators.
- **Senate headshot dimensions**: Most senate.ca.gov images are 343x480 or 368x480 (already approximately 4:5); the crop-then-resize pipeline adds only a few pixels of crop before upscaling to 600x750.

## Issues Encountered

None after schema correction. All 40 senators processed successfully.

## Next Phase Readiness

- Phase 62 (LAUSD board members) can proceed — no blockers
- All 120 CA state legislators are now fully seeded with headshots
- Politician profile pages for CA Assembly + Senate will show photos immediately
- The `politician_images` schema correction (no `photo_origin_url`) should be noted for any future phases inserting headshots
