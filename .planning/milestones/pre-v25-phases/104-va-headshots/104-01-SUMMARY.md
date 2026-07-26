---
phase: 104-va-headshots
plan: "01"
subsystem: data-ingestion
tags: [headshots, virginia, storage, python-script]
dependency_graph:
  requires: [103-alexandria-deep-seed]
  provides: [va-exec-headshots-in-storage]
  affects: [104-05-migration-315]
tech_stack:
  added: []
  patterns: [PIL-lanczos-crop-resize, supabase-storage-upsert, runtime-uuid-resolution]
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py
  modified: []
decisions:
  - "Runtime UUID resolution via SELECT id FROM politicians WHERE external_id (not hardcoded) — migrations used gen_random_uuid()"
  - "Jay Jones landscape 425x283 source accepted with visual quality warning logged to stdout"
metrics:
  duration: "~4 minutes"
  completed: "2026-06-09"
  tasks_completed: 2
  files_created: 1
---

# Phase 104 Plan 01: VA Exec Headshots Summary

Upload the 3 VA state executive headshots (Spanberger, Hashmi, Jones) to Supabase Storage at 600x750 JPEG q90 using a PIL LANCZOS crop-first pipeline matching the Alexandria template.

## Tasks Completed

| Task | Description | Status | Commit |
|------|-------------|--------|--------|
| 1 | Write `_tmp-va-execs-headshots.py` from Alexandria template | DONE | e454ac6 |
| 2 | Run script and verify 3 execs uploaded | DONE | e454ac6 |

## Manifest (Plan 05 Input)

Verbatim output from `python scripts/_tmp-va-execs-headshots.py`:

```
[_tmp-va-execs-headshots] Phase 104 Plan 01 headshot upload
  Roster: 3 officials (3 VA state executives)
  Target: 600x750 JPEG q90 via Lanczos
  Bucket: politician_photos

Resolving politician UUIDs from DB...
  external_id=-510001 -> UUID=46c6ebb0-137a-46aa-b6fa-17af31aa4ef1
  external_id=-510002 -> UUID=9e3f9d94-ec56-4d9e-811f-8b4672494362
  external_id=-510003 -> UUID=eef42ac4-5573-47c7-8b41-f2f1e0769aec

============================================================
=== VA EXECS HEADSHOT MANIFEST ===

--- VA State Executives (3 officials) ---
SUCCESS: -510001 Abigail Spanberger 46c6ebb0-137a-46aa-b6fa-17af31aa4ef1 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/46c6ebb0-137a-46aa-b6fa-17af31aa4ef1-headshot.jpg
SUCCESS: -510002 Ghazala Hashmi 9e3f9d94-ec56-4d9e-811f-8b4672494362 -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/9e3f9d94-ec56-4d9e-811f-8b4672494362-headshot.jpg
SUCCESS: -510003 Jay Jones eef42ac4-5573-47c7-8b41-f2f1e0769aec -> https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/eef42ac4-5573-47c7-8b41-f2f1e0769aec-headshot.jpg

TOTALS: VA Execs 3/3 succeeded
=== END MANIFEST ===

All 3 VA exec headshots uploaded successfully. VA-GOV-06 (exec portion) met.
```

## Source Metadata (Plan 05 / Migration 315 Input per D-10)

| Official | external_id | Politician UUID | Source URL | Original Dims | Crop Dims | Final |
|---------|-------------|-----------------|------------|---------------|-----------|-------|
| Abigail Spanberger | -510001 | 46c6ebb0-137a-46aa-b6fa-17af31aa4ef1 | governor.virginia.gov/...Governor-Spanberger-Official-Portrait.jpg | 784x1000 JPEG | 784x980 (top-crop) | 600x750 |
| Ghazala Hashmi | -510002 | 9e3f9d94-ec56-4d9e-811f-8b4672494362 | ltgov.virginia.gov/...Portrait-LT-Governor-Ghazala-Hashmi.jpg | 1125x1472 JPEG | 1125x1406 (top-crop) | 600x750 |
| Jay Jones | -510003 | eef42ac4-5573-47c7-8b41-f2f1e0769aec | ag.virginia.gov/images/Jones-headshot-20260320.jpg | 425x283 JPEG (LANDSCAPE) | 226x283 (center-horizontal crop) | 600x750 |

## Jay Jones Visual Quality Observation

Jay Jones's source image is landscape 425x283px. After center-horizontal crop to 226x283 and upscale to 600x750 via Lanczos, the resulting JPEG is 62,797 bytes. **Human spot-check required before Plan 05 migration 315 is finalized.** If the upscaled result looks blurry/pixelated, fall back to:
- `https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Jay_Jones_Speaks_at_rally_in_Fairfax_City_%28cropped%29.png/` (higher-res base available on Wikimedia Commons page)

CDN URL for spot-check: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/eef42ac4-5573-47c7-8b41-f2f1e0769aec-headshot.jpg`

## CDN Verification

All 3 Storage URLs confirmed HTTP 200 immediately after upload:
- `46c6ebb0-...-headshot.jpg` — HTTP 200
- `9e3f9d94-...-headshot.jpg` — HTTP 200
- `eef42ac4-...-headshot.jpg` — HTTP 200

## Deviations from Plan

None — plan executed exactly as written. The only notable fact is that the `politician-headshots` string appears in docstring comments (warning notes) matching the Alexandria template, but not in any executable code — the `BUCKET` variable is correctly set to `'politician_photos'`.

## Known Stubs

None — all 3 headshots are real photos uploaded to live Storage.

## Threat Flags

None — all images downloaded from official government domains (*.virginia.gov); no new endpoints or auth paths introduced.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/scripts/_tmp-va-execs-headshots.py` exists
- [x] Commit e454ac6 exists in C:/EV-Accounts master
- [x] 3 CDN URLs confirmed HTTP 200
- [x] DB confirms 3 politicians with external_id IN (-510001, -510002, -510003)
- [x] Script exit code 0
- [x] Manifest contains exactly 3 SUCCESS lines and "TOTALS: VA Execs 3/3 succeeded"
