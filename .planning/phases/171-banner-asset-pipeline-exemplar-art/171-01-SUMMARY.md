---
phase: 171-banner-asset-pipeline-exemplar-art
plan: 01
subsystem: infra
tags: [python, PIL, supabase-storage, banner, image-processing, documentation]

# Dependency graph
requires:
  - phase: 170-section-banners-continuous-scroll-results
    provides: SectionBanner.jsx component, STATE_PANORAMAS/CURATED_LOCAL in buildingImages.js, politician_photos Storage bucket layout proven
provides:
  - Python+PIL banner processing script (1700x540 JPEG q90, center-crop, LANCZOS)
  - Supabase Storage upload script (service-role key from env, curl PUT)
  - Operator runbook docs/banner-asset-pipeline.md (8-stage procedure, D-05 path conventions)
affects:
  - 171-02 (Bloomington exemplar upload is the live test of these scripts)
  - any future phase adding standalone-city or new-state banners

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Banner image spec: 1700x540 JPEG q90 (measured from live Storage assets)"
    - "Center-crop to 3.15:1 aspect ratio without distortion, then LANCZOS resize"
    - "Storage path tiers: states/<ABBR>.jpg / national/<name>.jpg / la_county/building_photos/<geoid>.jpg / cities/<slug>.jpg (D-05 new)"
    - "Service-role key via SUPABASE_SERVICE_ROLE_KEY env var only; curl -X PUT for overwrite-safe upload"
    - "No dark overlay in source — SectionBanner.jsx applies IMAGE_OVERLAY_GRADIENT at render; --overlay flag is documented off-by-default"

key-files:
  created:
    - scripts/banners/process_banner.py
    - scripts/banners/upload_banner.py
    - docs/banner-asset-pipeline.md
  modified: []

key-decisions:
  - "Dark overlay NOT pre-baked into source JPEGs (D-01 recommendation a): SectionBanner.jsx applies at render, matching all 50 live panoramas; --overlay flag available but off by default"
  - "AI image generation explicitly dropped (D-09): real licensed photos only; documented in runbook as intentional divergence from ASST-01 text so verifier does not read absence as gap"
  - "cities/<slug>.jpg established as canonical Storage path scheme for standalone cities (D-05)"
  - "curl -X PUT used for uploads (vs POST) to support overwrite/re-source of existing keys"

patterns-established:
  - "Banner processing: scripts/banners/process_banner.py is the canonical tool for crop+resize+optimize to 1700x540 JPEG q90"
  - "Banner upload: scripts/banners/upload_banner.py reads SUPABASE_SERVICE_ROLE_KEY from env; parameterized --dest accepts any Storage tier path"
  - "Attribution tracking: // <KEY> - Title | Author | License comment convention in buildingImages.js (Stage 7 of runbook)"
  - "All Windows paths in committed docs use forward slashes inside code fences (Tailwind v4 hazard prevention)"

requirements-completed: [ASST-02]

# Metrics
duration: 8min
completed: 2026-06-27
---

# Phase 171 Plan 01: Banner Asset Pipeline — Toolchain & Runbook Summary

**Python+PIL processing script (1700x540 JPEG q90 with center-crop), curl-based Storage upload script (service-role key from env), and 8-stage operator runbook establishing the cities/<slug>.jpg path convention (D-05) and documenting AI generation as intentionally dropped (D-09)**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-06-27T18:45:15Z
- **Completed:** 2026-06-27T18:53:00Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Committed `scripts/banners/process_banner.py`: accepts local file or URL download, center-crops source to 3.15:1 without distortion, resizes to 1700x540 LANCZOS, saves JPEG q90; `--overlay` flag documented as off-by-default to match the 50 live state panoramas
- Committed `scripts/banners/upload_banner.py`: reads `SUPABASE_SERVICE_ROLE_KEY` via `os.environ.get`, guards empty key with `exit(1)`, uses `curl -X PUT` for overwrite-safe upload to parameterized `politician_photos/<dest>` path; never hardcodes or logs the bearer token
- Committed `docs/banner-asset-pipeline.md`: 8-stage operator runbook covering Sourcing → Treatment → Optimize → Upload → Path Conventions → Wiring → Attribution → Verify Live; establishes `cities/<slug>.jpg` as the new standalone-city Storage convention; explicitly documents AI generation as intentionally dropped with rationale

## Task Commits

Each task was committed atomically:

1. **Task 1: Banner processing script (PIL crop + resize + optimize)** - `7066117` (feat)
2. **Task 2: Storage upload script (service-role key from env)** - `478d608` (feat)
3. **Task 3: Operator runbook docs/banner-asset-pipeline.md** - `4426d26` (docs)

**Plan metadata:** (SUMMARY commit — see below)

## Files Created/Modified

- `scripts/banners/process_banner.py` - PIL banner processor: center-crop 3.15:1, resize 1700x540 LANCZOS, JPEG q90; accepts --input or --url; EmpoweredVote/1.0 User-Agent for Wikimedia; --overlay off by default
- `scripts/banners/upload_banner.py` - Storage uploader: SUPABASE_SERVICE_ROLE_KEY from env with empty-key guard; curl -X PUT to politician_photos/<dest>; prints public CDN URL on success
- `docs/banner-asset-pipeline.md` - 8-stage operator runbook; D-05 cities/<slug>.jpg convention table; D-09 AI-drop note; all Windows paths in code fences with forward slashes

## Decisions Made

- **Dark overlay off by default (D-01 recommendation a):** `SectionBanner.jsx` already applies `IMAGE_OVERLAY_GRADIENT` at render. The 50 live panoramas in Storage are not pre-darkened. Pre-baking would cause double-darkening and visual inconsistency. The `--overlay` flag is available but documented as the exception path, not the default.
- **AI generation explicitly dropped (D-09):** Real licensed photos (Wikimedia/Unsplash) with graceful tier-gradient fallback. Documented in runbook as an intentional divergence from ASST-01 text so a verifier does not read the absence as a gap.
- **cities/<slug>.jpg as D-05 canonical standalone-city path:** Consistent with the lowercase, tier-grouped existing schemes; slug matches the `CURATED_LOCAL` key style.
- **curl -X PUT for uploads:** Unlike the analog `upload_wiki_photos.py` which only POSTs new keys, the banner script uses PUT to support idempotent re-sourcing (D-01 intention).

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria satisfied on first attempt for all 3 tasks.

## Known Stubs

None — all three artifacts are fully functional and self-contained. The runbook references `buildingImages.js` wiring but that step is performed by the operator; no stubs in committed files.

## Threat Flags

No new network endpoints, auth paths, or schema changes introduced.

| Control | File | Status |
|---------|------|--------|
| T-171-01: Service-role key | upload_banner.py | Mitigated — env var only, never printed |
| T-171-02: Tailwind backslash hazard | docs/banner-asset-pipeline.md | Mitigated — all C: paths in code fences with forward slashes |
| T-171-03: Image provenance | runbook | Accepted — real licensed photos only documented |

## Issues Encountered

None.

## User Setup Required

Before running `upload_banner.py`, the operator must export the Supabase service-role key:

```bash
export SUPABASE_SERVICE_ROLE_KEY=<key from C:/EV-Accounts/backend/.env>
```

No additional configuration is required — the scripts read all other settings from constants or argparse.

## Next Phase Readiness

- `scripts/banners/process_banner.py` and `scripts/banners/upload_banner.py` are ready for Plan 02 (Bloomington exemplar upload — the live test of these scripts)
- Plan 02 will source a Bloomington wide cityscape, run both scripts, and wire `buildingImages.js` `CURATED_LOCAL['bloomington']` to the Storage URL

---
*Phase: 171-banner-asset-pipeline-exemplar-art*
*Completed: 2026-06-27*

## Self-Check: PASSED

- `scripts/banners/process_banner.py` — EXISTS and `--help` exits 0
- `scripts/banners/upload_banner.py` — EXISTS and `--help` exits 0; unset-key guard confirmed exits 1
- `docs/banner-asset-pipeline.md` — EXISTS with 8 `## ` sections; 4 `cities/` references; D-09 documented; 0 raw backslash Windows paths
- Task commits `7066117`, `478d608`, `4426d26` — all present in `git log`
