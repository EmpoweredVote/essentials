---
phase: 177-city-of-hillsboro-deep-seed
plan: 03
subsystem: database
tags: [supabase-storage, pillow, psycopg2, civicweb, oregon, headshots]

# Dependency graph
requires:
  - phase: 177-city-of-hillsboro-deep-seed
    plan: 02
    provides: Minted politician UUIDs for the 7-member roster (keyed by external_id -4134101..-4134107)
provides:
  - "7/7 Hillsboro City Council officials have a 600x750 headshot uploaded to Supabase Storage politician_photos/{uuid}-headshot.jpg"
  - "7 politician_images rows (type='default', photo_license='press_use') recorded via audit-only migration 1151"
affects: [177-04-PLAN, 177-05-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CivicWeb portal (hillsboro-oregon.civicweb.net) as primary headshot source when the city's own domain is Akamai WAF-403"
    - "Crop-to-4:5 FIRST then resize to 600x750 Lanczos q90 — accepted upscale precedent extended to 165x215 CivicWeb source images (~3.6x upscale, same precedent class as prior Ballotpedia 200x300 upscales)"
    - "Runtime UUID resolution by external_id via psycopg2 inside the pipeline script (never hardcoded)"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-hillsboro-headshots.py
  modified:
    - C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql

key-decisions:
  - "All 7 headshots sourced from the CivicWeb portal (source=civicweb, license=press_use) — no Ballotpedia/campaign fallback was needed; test-download guard passed on first official"
  - "Source images were low-resolution (165x215); accepted the upscale per the existing Ballotpedia-upscale precedent (Pasadena, Henderson) rather than blocking on resolution"
  - "Migration 1151 applied AUDIT-ONLY: no ledger row written; on-disk migration counter remains authoritative at 1150 registered / next-number 1152"

requirements-completed: [WASH-03]

# Metrics
duration: ~20min (authoring + orchestrator pipeline run + apply + visual verification)
completed: 2026-07-01
---

# Phase 177 Plan 03: City of Hillsboro Headshots Summary

**7/7 Hillsboro City Council headshots sourced from the CivicWeb portal, cropped 4:5 then upscaled to 600x750 Lanczos q90, uploaded to Supabase Storage, and recorded via audit-only migration 1151.**

## Performance

- **Duration:** ~20 min (Task 1 script authoring + Task 2 migration authoring + Task 3 orchestrator pipeline run/apply/verify)
- **Completed:** 2026-07-01
- **Tasks:** 3 (2 auto + 1 checkpoint:human-verify)
- **Files modified:** 2 (1 gitignored pipeline script, 1 committed migration)

## Accomplishments
- Authored `_tmp-hillsboro-headshots.py` mirroring the Beaverton pipeline template: 7-official OFFICIALS list with CivicWeb `user-{N}.jpg` URLs, runtime UUID resolution by external_id via psycopg2, test-download guard, crop-4:5-then-resize-600x750-Lanczos-q90 pipeline, upload to `politician_photos/{uuid}-headshot.jpg` with `x-upsert:true`.
- Authored audit-only migration `1151_hillsboro_headshots.sql` with 7 `politician_images` INSERT...SELECT statements guarded `WHERE NOT EXISTS`, columns exactly `(id, politician_id, url, type, photo_license)` — no `photo_origin_url`.
- Orchestrator ran the pipeline: test-download guard passed, **7/7 SUCCESS, 0 gaps**, all `source=civicweb`, all `license=press_use`. Filled the migration's `{uuid}` placeholders from the pipeline's success manifest (commit `5f4776d3`) and applied via `psql -f` — BEGIN + 7x INSERT 0 1 + COMMIT.
- Orchestrator visually verified all 7 processed images: consistent official city-portrait series (same blue studio backdrop), correct person per portal userId mapping, professional 4:5 framing with eyes ~1/3 from top, full head+shoulders, no superimposed text/graphics, no distortion.
- Post-apply row count confirmed: 7 `politician_images` rows for ext_ids -4134101..-4134107. Migration ledger MAX confirmed still 1150 (1151 correctly NOT registered — audit-only).

## Task Commits

Each task was committed atomically:

1. **Task 1: Author headshot pipeline script** - N/A (gitignored `_tmp-*.py` by design, per plan architecture — orchestrator runs it, never committed)
2. **Task 2: Author audit-only headshot migration** - `e3c48dbf` (C:/EV-Accounts repo) - `feat(177-03): author Hillsboro headshot pipeline + audit-only migration` - `backend/migrations/1151_hillsboro_headshots.sql` (95 lines, UUID placeholders)
3. **Task 3: Orchestrator runs pipeline, fills UUIDs, applies migration** - `5f4776d3` (C:/EV-Accounts repo) - `fix(177-03): fill Hillsboro headshot UUIDs from pipeline manifest` - same migration file, UUIDs filled from the 7/7 success manifest, then applied audit-only via `psql -f`

**Plan metadata:** (this commit, essentials repo)

## Files Created/Modified
- `C:/EV-Accounts/backend/scripts/_tmp-hillsboro-headshots.py` - Gitignored pipeline: downloads 7 CivicWeb portraits, crops 4:5 then resizes 600x750 Lanczos q90, uploads to Supabase Storage
- `C:/EV-Accounts/backend/migrations/1151_hillsboro_headshots.sql` - Audit-only migration recording 7 `politician_images` rows

## Storage URLs (all verified 600x750 JPEG by re-download)

| external_id | name | office | storage object |
|---|---|---|---|
| -4134101 | Beach Pace | Mayor | 95a6d0c4-2b0e-4c4f-9f53-02eb55543fb7-headshot.jpg |
| -4134102 | Cristian Salgado | Councilor, Ward 1, Position A | 44d84b41-36f0-4b46-8235-df1ca4ed7da7-headshot.jpg |
| -4134103 | Saba Anvery | Councilor, Ward 1, Position B | 2615c597-7974-441e-a9f1-93616b2da33c-headshot.jpg |
| -4134104 | Kipperlyn Sinclair | Councilor, Ward 2, Position A | 92ad1ef9-117d-4042-a19e-438c0ec7dea6-headshot.jpg |
| -4134105 | Elizabeth Case | Councilor, Ward 2, Position B | c95bfe4d-65c0-41a2-9c54-21a958f54f58-headshot.jpg |
| -4134106 | Olivia Alcaire | Councilor, Ward 3, Position A | 6f901dde-b4d9-49d9-90ef-f318166664d9-headshot.jpg |
| -4134107 | Rob Harris | Councilor, Ward 3, Position B (Council President) | 38aa9579-5fdf-40a5-8f7a-738f16b3d655-headshot.jpg |

## Decisions Made
- All 7 sourced from CivicWeb portal directly — no fallback to Ballotpedia/campaign sites was needed despite the plan reserving that path.
- Accepted the ~3.6x upscale from 165x215 source images to 600x750 (same precedent class as prior Ballotpedia 200x300 upscales in Pasadena/Henderson phases) — slightly soft but clean, no artifacts, no overlays.
- `photo_license='press_use'` applied uniformly (official government CivicWeb portal photos).
- Migration 1151 applied strictly audit-only per the phase's headshot/stance migration convention — on-disk counter remains authoritative; next migration number is 1152.

## Deviations from Plan

None - plan executed exactly as written. Test-download guard passed on the first official; no fallback sources were needed; all 7 uploads succeeded on the first pipeline run.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 04 (stances) can proceed immediately using the UUID table from 177-02-SUMMARY.md.
- All 7 Hillsboro officials now render with 600x750 photos on the live app.
- Live browse link: https://essentials.empowered.vote/results?browse_geo_id=4134100&browse_mtfcc=G4110
- Next migration number: 1152 (on-disk counter authoritative).
- No blockers identified.

## Self-Check: PASSED

- FOUND: `.planning/phases/177-city-of-hillsboro-deep-seed/177-03-SUMMARY.md`
- FOUND: commit `e3c48dbf` (C:/EV-Accounts)
- FOUND: commit `5f4776d3` (C:/EV-Accounts)

---
*Phase: 177-city-of-hillsboro-deep-seed*
*Completed: 2026-07-01*
