---
phase: 83-multnomah-county-government-routing
plan: "02"
subsystem: database/storage
tags: [multnomah-county, oregon, headshots, politician-images, supabase-storage, audit-migration]
dependency_graph:
  requires:
    - Plan 83-01 (5 politician rows with external_ids -410001, -410010..-410013 must exist)
    - Phase 72 OR TIGER geofences (G4020 geo_id=41051 already loaded)
  provides:
    - 5 Supabase Storage objects in politician_photos bucket (600x750 JPEG)
    - 5 essentials.politician_images rows (type='default', photo_license='public_domain')
    - Audit migration 245 documenting the live writes
  affects:
    - Commissioner cards in the UI will now display headshots (type='default' filter satisfied)
tech_stack:
  added: []
  patterns:
    - Python PIL for image processing (canonical pattern — Portland/SJ precedent)
    - Supabase Storage REST API for upload (upsert via x-upsert header)
    - psycopg2 for direct DB insert of politician_images rows
    - AUDIT-ONLY migration pattern (225_or_headshots.sql precedent)
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql
  modified: []
  deleted:
    - C:/EV-Accounts/backend/scripts/_tmp-multnomah-headshots.py (one-shot temp script, deleted post-run)
decisions:
  - "Python+PIL used instead of TypeScript+sharp — sharp is not installed in the backend (deviation Rule 3 auto-fix)"
  - "All 5 sources used primary WebP URLs — fallback JPEG URLs all returned HTTP 404 on multco.us (source files not publicly accessible)"
  - "All sources were 330x330 square WebP — center-crop strategy applied (264x330 crop, then 600x750 resize)"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-31"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
  files_deleted: 1
---

# Phase 83 Plan 02: Multnomah County Commissioner Headshots Summary

**One-liner:** 5 Multnomah County commissioner headshots uploaded to Supabase Storage as 600x750 JPEG (center-crop from 330x330 square WebP source), with politician_images rows (type='default', public_domain) and audit migration 245.

## What Was Built

### Headshot Upload Script (_tmp-multnomah-headshots.py — deleted after run)

One-shot Python script at `C:/EV-Accounts/backend/scripts/_tmp-multnomah-headshots.py`.

- Loaded SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL from `.env`
- For each of 5 officials: tried fallback JPEG first, fell back to primary WebP
- Processed with PIL: convert to RGB, center-crop to 4:5 ratio (264x330 from 330x330 square), resize to 600x750 Lanczos, JPEG q90
- Uploaded to `politician_photos/{politician_id}-headshot.jpg` via Supabase Storage REST API (x-upsert: true)
- Inserted politician_images row via psycopg2 (WHERE NOT EXISTS guard — idempotent)
- Exited 0 with "5/5 headshots uploaded" on success

### Audit Migration 245

File: `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql`

AUDIT-ONLY: documents the 5 politician_images INSERTs. Not applied via Supabase ledger.
No `INSERT INTO supabase_migrations.schema_migrations` entry.

## Production DB State After Script Run

### Supabase Storage Objects

| external_id | full_name | Storage URL |
|-------------|-----------|-------------|
| -410001 | Jessica Vega Pederson | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/27f6b552-0e36-429a-a6fd-bb7108b80b35-headshot.jpg` |
| -410010 | Meghan Moyer | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/bfaf8f7d-59f9-4747-925b-c546d84b58ad-headshot.jpg` |
| -410011 | Shannon Singleton | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/9c2b5568-9201-4d99-95e3-f2ecc1eaf2d3-headshot.jpg` |
| -410012 | Julia Brim-Edwards | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/0e37f57f-ccdb-4a6c-90b9-8f5fd7410080-headshot.jpg` |
| -410013 | Vince Jones-Dixon | `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/28a723ed-300a-4ed6-8454-fca5bdb4ae4a-headshot.jpg` |

### Image Processing Details

| external_id | Source URL | Source Size | Crop Method | Final Size |
|-------------|------------|-------------|-------------|------------|
| -410001 | multco.us .../2026-01/54a2249-edit-chair-8x10-1.jpg.webp | 330x330 (square) | center-crop 264x330 | 600x750 |
| -410010 | multco.us .../2026-01/moyer-2026-portrait-a2_0.jpg.webp | 330x330 (square) | center-crop 264x330 | 600x750 |
| -410011 | multco.us .../2024-12/20241202-commissioner-shannon-singleton-mn-04-4x3.jpg.webp | 330x330 (square) | center-crop 264x330 | 600x750 |
| -410012 | multco.us .../2023-06/20230526-D3-Commissioner-Jullia-Brim-Edwards-MN-%252816x9%2529.jpg.webp | 330x330 (square) | center-crop 264x330 | 600x750 |
| -410013 | multco.us .../2024-12/20241217-commissioner-vince-jones-dixon-mn-4x6.jpg.webp | 330x330 (square) | center-crop 264x330 | 600x750 |

Note: All sources were 330x330 square (Drupal 1_1_large style enforces square), despite some having aspect ratio hints in filenames (4x3, 4x6). The 1_1_large Drupal image style resizes all to square before serving.

### politician_images Rows Inserted

| politician_id | url | type | photo_license | image row id |
|---------------|-----|------|---------------|-------------|
| 27f6b552-... | ...27f6b552...-headshot.jpg | default | public_domain | 790a4723-cb0d-4031-8b81-289a0d41aaec |
| bfaf8f7d-... | ...bfaf8f7d...-headshot.jpg | default | public_domain | 11f7afd5-9251-4cc6-9084-cc93b0b2fda6 |
| 9c2b5568-... | ...9c2b5568...-headshot.jpg | default | public_domain | 6edc5555-1fb4-4d15-b5bc-19fb52b4fd6d |
| 0e37f57f-... | ...0e37f57f...-headshot.jpg | default | public_domain | 34a7a6a2-9a26-4239-95d0-e43378bb9aa0 |
| 28a723ed-... | ...28a723ed...-headshot.jpg | default | public_domain | 8fd30116-0c37-42d1-a045-2d0daa3f5a83 |

## Post-Run SQL Gate Results

| Gate | Query | Result | Expected | Status |
|------|-------|--------|----------|--------|
| 83-02-01 | COUNT(*) FROM politician_images JOIN politicians WHERE external_id IN (...) AND type='default' | 5 | 5 | PASS |
| Audit file exists | ls migrations/245_multnomah_county_headshots.sql | exists | exists | PASS |
| 5 INSERT statements | grep -c "INSERT INTO essentials.politician_images" 245_multnomah_county_headshots.sql | 5 | 5 | PASS |
| AUDIT-ONLY header | grep -c "AUDIT-ONLY" 245_multnomah_county_headshots.sql | 2 | >=1 | PASS |
| No ledger entry | grep "INSERT INTO supabase_migrations" 245... | no match | no match | PASS |
| Temp script deleted | ls _tmp-multnomah-headshots.py | not found | not found | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Python+PIL used instead of TypeScript+sharp**
- **Found during:** Task 1 setup
- **Issue:** Plan specified TypeScript with sharp, but `sharp` is not installed in `C:/EV-Accounts/backend/node_modules/` and is not in `package.json`. Installing it would require a package legitimacy checkpoint. The established codebase pattern for headshot processing is Python+PIL (see `portland-headshots-process.py`, `sj-headshots-process.py`).
- **Fix:** Wrote `_tmp-multnomah-headshots.py` using Python PIL + requests + psycopg2, matching the portland/SJ headshot scripts. All plan requirements (600x750, 4:5 crop, Lanczos, q90, Supabase Storage upsert, politician_images INSERT with type='default', idempotent) are fully satisfied.
- **Files modified:** `scripts/_tmp-multnomah-headshots.py` (deleted post-run as designed)
- **Commit:** `d615fe7`

**2. [Rule 1 - Observation] Fallback JPEG URLs all return HTTP 404**
- **Found during:** Task 1 execution
- **Issue:** The plan's fallback URLs (stripping `/styles/1_1_large/` from the path) all returned HTTP 404 on multco.us. The underlying JPEG source files are not publicly accessible.
- **Fix:** Script fell back automatically to primary WebP URLs per the designed fallback logic. All 5 downloaded successfully from primary WebP URLs. No functional impact — WebP is handled by PIL.
- **Files modified:** None (fallback logic was already in the script)
- **Note:** All 5 sources arrived as 330x330 square WebP regardless of aspect ratio hints in filenames (4x3, 4x6, 8x10 in filename of Vega Pederson). The Drupal 1_1_large style enforces square output.

## Requirements Satisfied

| ID | Description | Status |
|----|-------------|--------|
| COUNTY-03 | Commissioner headshots at 600x750 in Supabase Storage | SATISFIED |

## Commits

| Task | Commit | Files | Description |
|------|--------|-------|-------------|
| Task 1 | `d615fe7` | `scripts/_tmp-multnomah-headshots.py` | Headshot upload script (Python+PIL) |
| Task 2 | `08a2e8e` | `migrations/245_multnomah_county_headshots.sql` (added), `scripts/_tmp-multnomah-headshots.py` (deleted) | Audit migration 245 + temp script deletion |

Both commits in EV-Accounts repo (C:/EV-Accounts).

## Known Stubs

None. All 5 politician_images rows have live Supabase Storage URLs. Images are real commissioner headshots from multco.us (government public domain portraits). UI can immediately render headshots on commissioner cards.

## Threat Flags

No new security-relevant surface. SUPABASE_SERVICE_ROLE_KEY loaded from .env only, never logged; temp script deleted.

## Self-Check: PASSED

- [x] `C:/EV-Accounts/backend/migrations/245_multnomah_county_headshots.sql` — exists
- [x] `C:/EV-Accounts/backend/scripts/_tmp-multnomah-headshots.py` — deleted (confirmed: file not found)
- [x] SQL gate 83-02-01: COUNT = 5 — confirmed
- [x] 5 politician_images rows with type='default' and photo_license='public_domain' — confirmed
- [x] Audit migration has 5 INSERT statements and AUDIT-ONLY header — confirmed (grep counts: 5, 2)
- [x] No ledger entry in audit migration — confirmed (grep no match)
- [x] Commit `d615fe7` exists in EV-Accounts repo — confirmed
- [x] Commit `08a2e8e` exists in EV-Accounts repo — confirmed
