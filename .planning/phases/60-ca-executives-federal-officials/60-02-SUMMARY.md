---
phase: 60-ca-executives-federal-officials
plan: 02
subsystem: database
tags: [headshots, supabase-storage, congress, bioguide, powershell, image-resize]

# Dependency graph
requires:
  - phase: 60-01
    provides: "34 CA House rep politicians seeded with -60003xx external_ids; Pete Aguilar -6000204"
provides:
  - "35 headshots uploaded to Supabase Storage at 600x750 (politician_id-headshot.jpg pattern)"
  - "35 politician_images rows with photo_license='public_domain'"
  - "35 politicians.photo_origin_url values set"
  - "Phase 60 complete — all CA federal officials seeded with photos"
affects: [61, 62, 63-68, ca-city-officials-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Storage path: {politician_id}-headshot.jpg (consistent with ME federal officials pattern)"
    - "Public URL: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg"
    - "politician_images insert: WHERE NOT EXISTS pattern (no unique constraint on politician_id)"
    - "Fallback source: clerk.house.gov for new members not yet in unitedstates/images repo"

key-files:
  created:
    - "C:/tmp/upload_ca_headshots_v2.ps1 (upload script, temp artifact)"
  modified: []

key-decisions:
  - "5 new members (Simon, Gray, Liccardo, Fong, Min) not in unitedstates/images 450x550 repo — used clerk.house.gov/images/members/{bioguide}.jpg (335x410, 4:5 ratio, no crop needed)"
  - "Storage path uses {politician_id}-headshot.jpg not {politician_id}/default.jpg (consistent with Phase 52/53/51 ME federal pattern, not Indiana pattern)"
  - "photo_license='public_domain' for all 35 — congress.gov and clerk.house.gov official government images"
  - "INSERT uses WHERE NOT EXISTS (not ON CONFLICT) because politician_images has no unique constraint on politician_id"

patterns-established:
  - "New Congress member fallback: clerk.house.gov/images/members/{bioguide_id}.jpg (200 OK confirmed 2026-05-21)"
  - "unitedstates/images 404 = member not yet indexed; not a data error; use clerk.house.gov"

# Metrics
duration: 13min
completed: 2026-05-21
---

# Phase 60 Plan 02: CA Federal Officials Headshots Summary

**35 CA House rep headshots (600x750, public domain) uploaded from unitedstates/images + clerk.house.gov fallback for 5 new members not yet indexed**

## Performance

- **Duration:** 13 min
- **Started:** 2026-05-21T20:11:02Z
- **Completed:** 2026-05-21T20:24:21Z
- **Tasks:** 2 (pre-flight query + 35 sequential uploads)
- **Files modified:** 0 code files (storage + DB only)

## Accomplishments

- Pre-flight query confirmed all 35 politicians (34 House reps + Pete Aguilar) had NEEDS_HEADSHOT status
- 35 headshots downloaded, resized to 600x750 via System.Drawing HighQualityBicubic, uploaded to Supabase Storage
- 35 `politician_images` rows inserted with `url`, `type='default'`, `photo_license='public_domain'`
- 35 `politicians.photo_origin_url` values set to original source URL
- 5 new members (Lateefah Simon CD-12, Adam Gray CD-13, Sam Liccardo CD-16, Vince Fong CD-20, Dave Min CD-47) sourced from `clerk.house.gov` — not yet in unitedstates/images repo
- Phase 60 complete: all CA federal officials (8 execs + 2 senators + 52 House reps) seeded with photos

## Task Commits

No code file commits for this plan — all work was storage uploads and direct DB writes.
Planning docs committed separately as docs(60-02).

## Files Created/Modified

- `Supabase Storage: politician_photos/` — 35 new objects at `{politician_id}-headshot.jpg`
- `essentials.politician_images` — 35 new rows
- `essentials.politicians.photo_origin_url` — 35 rows updated

## Decisions Made

1. **clerk.house.gov fallback**: 5 new members (Simon, Gray, Liccardo, Fong, Min) returned 404 on unitedstates/images. Sourced from `https://clerk.house.gov/images/members/{bioguide_id}.jpg` which returned 200 OK for all 5. Images are 335x410 (4:5 ratio, no crop needed, resize only).

2. **Storage path pattern**: Used `{politician_id}-headshot.jpg` (matching ME senators/reps, ME federal officials from Phase 51-52) rather than `{politician_id}/default.jpg` (Indiana pattern). Consistent with most recent multi-phase pattern.

3. **photo_license**: `'public_domain'` for all 35. Congressional headshots from official government sources (congress.gov photographer database, House Clerk office) are in the public domain.

4. **DB insert**: Used `WHERE NOT EXISTS` pattern because `politician_images` has no unique constraint on `politician_id` — `ON CONFLICT` would require a named constraint.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong DB schema — storage_path column does not exist**
- **Found during:** Task 2 (first upload attempt)
- **Issue:** Plan specified `storage_path` and `is_primary` columns; actual table has `url` and `type` columns; no `is_primary` column exists
- **Fix:** Corrected INSERT to use `url` (full public URL), `type='default'` per actual schema
- **Verification:** 35 rows inserted successfully; spot-check confirmed URLs resolve correctly
- **Committed in:** DB write (no code file commit)

**2. [Rule 1 - Bug] 5 unitedstates/images 404s for new members**
- **Found during:** Task 2 (download phase)
- **Issue:** Lateefah Simon (S001231), Adam Gray (G000605), Sam Liccardo (L000607), Vince Fong (F000480), Dave Min (M001241) all 404 on `unitedstates.github.io` — new 119th Congress members not yet indexed
- **Fix:** Used `clerk.house.gov/images/members/{bioguide_id}.jpg` as fallback — all 5 returned 200 OK; images are 335x410 (4:5, resize only)
- **Verification:** 5 uploads completed successfully; photo_origin_url points to clerk.house.gov

**3. [Rule 1 - Bug] ON CONFLICT syntax error — no unique constraint on politician_id**
- **Found during:** Task 2 (schema investigation)
- **Issue:** `ON CONFLICT (politician_id) DO NOTHING` requires unique constraint; only index exists
- **Fix:** Changed to `WHERE NOT EXISTS (SELECT 1 FROM essentials.politician_images WHERE politician_id = ...)` pattern
- **Verification:** All 35 inserts completed successfully

---

**Total deviations:** 3 auto-fixed (all Rule 1 bugs — wrong column names, missing images, wrong conflict syntax)
**Impact on plan:** All auto-fixes required for correctness. No scope changes.

## Issues Encountered

- **First run orphaned 30 files**: Initial script run uploaded files as `{politician_id}.jpg` (wrong path) before failing at DB insert. Second run uploaded correct `{politician_id}-headshot.jpg` paths. Orphaned objects remain in storage but are harmless (no DB rows reference them).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 60 fully complete: CA federal officials (8 execs + 2 senators + 52 House reps) all seeded with headshots
- All 35 headshots accessible at public Supabase Storage URLs
- Phase 62 CA elections/LAUSD can proceed
- Next migration is 194

---
*Phase: 60-ca-executives-federal-officials*
*Completed: 2026-05-21*
