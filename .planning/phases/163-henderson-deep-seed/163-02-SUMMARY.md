---
phase: 163-henderson-deep-seed
plan: 02
subsystem: database
tags: [headshots, supabase-storage, politician_images, pillow, ballotpedia, nevada, henderson]

requires:
  - phase: 163-henderson-deep-seed (plan 01)
    provides: 5 council-member politician rows + external_id→UUID map (mig 1084)
provides:
  - 5/5 Henderson council headshots (600×750, 4:5) mirrored to Storage politician_photos/{uuid}-headshot.jpg
  - migration 1085 (audit-only) — politician_images rows for all 5 members
affects: [163-03-stances]

tech-stack:
  added: []
  patterns:
    - "Per-member fallback headshot sourcing (WAF-403 city site bypassed): NVBiz/campaign/Ballotpedia"
    - "RGBA→white-composite in pipeline to prevent black-halo on transparent PNG sources"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-henderson-council-headshots.py (gitignored)
    - C:/EV-Accounts/backend/migrations/1085_henderson_city_council_headshots.sql
  modified: []

key-decisions:
  - "All 5 photo_license='press_use' (campaign/editorial/Ballotpedia — none are official government works)"
  - "Cox: used Ballotpedia clean headshot; rejected campaign hero (4-person group photo with E.A.T. signs)"
  - "Larson/Stewart: Ballotpedia (campaign sites exposed no clean portrait — Larson none, Stewart wide banner only)"

patterns-established:
  - "Pipeline white-composites RGBA/PNG sources onto white before RGB convert (Seebock)"

requirements-completed: [CLARK-03]

duration: ~30min
completed: 2026-06-28
---

# Phase 163 Plan 02: Henderson Headshots Summary

**5/5 City of Henderson council headshots sourced (city site WAF-403 bypassed), processed to 600×750 4:5, mirrored to Storage, and inserted via audit-only migration 1085 — 0 gaps.**

## Performance
- **Duration:** ~30 min
- **Tasks:** 2
- **Files modified:** 2 created (EV-Accounts; script gitignored) + 1 SUMMARY

## Headshot Manifest (5/5 uploaded, 0 gaps) — all license=press_use
| ext_id | Member | Source | Source dims | CDN (politician_photos/{uuid}-headshot.jpg) |
|--------|--------|--------|-------------|---------------------------------------------|
| -3206001 | Michelle Romero | Nevada Business Magazine editorial portrait | 2560×1707 | `494202b1-…-headshot.jpg` |
| -3206002 | Jim Seebock | votejimseebock.com campaign portrait (PNG/RGBA) | 634×617 | `99d43f01-…-headshot.jpg` |
| -3206003 | Monica Larson | Ballotpedia (`MonicaLarson2024-min`) | 200×300 | `e0d8ef1b-…-headshot.jpg` |
| -3206004 | Carrie Cox | Ballotpedia (`CarrieCoxNevada`) | 200×300 | `64f92bb3-…-headshot.jpg` |
| -3206005 | Dan H. Stewart | Ballotpedia (`dstewart`) | 200×300 | `50682ef1-…-headshot.jpg` |

All 5 CDN URLs return **HTTP 200**. All processed crop-4:5-FIRST → 600×750 Lanczos q90.

## Verification
- `politician_images` rows for -3206001..-3206005 = **5** ✓
- Migration 1085 **NOT registered** (audit-only); ledger MAX = **1084** ✓
- Visual inspection (orchestrator Read): every source AND the two highest-risk finals
  (Seebock white-composite, Romero landscape center-crop) confirmed clean head-and-shoulders,
  correct person, no text/graphic overlay.

## Decisions Made
- **All press_use**: NVBiz (editorial), campaign site, and Ballotpedia are not government works.
- **Cox source**: Ballotpedia clean headshot chosen; the campaign hero (`123_1 5.JPEG`, up to w:2558)
  is a **4-person group photo holding "E.A.T." signs** — rejected (multiple people + graphic overlays).
- **Larson/Stewart**: Ballotpedia (Larson's campaign site exposed no portrait; Stewart's only had a wide banner).

## Deviations from Plan
- **Added RGBA→white compositing** to `process_headshot_bytes` (not in the LV analog). Seebock's source
  is a transparent PNG; the analog's bare `convert('RGB')` would have composited transparency onto **black**
  (black halo). The pipeline now pastes RGBA/LA/transparent-P sources onto a white background first.
  Verified: Seebock final has a clean white background. Necessary for correctness; no scope creep.
- **Ballotpedia 200×300 sources upscale ~3×** to 600×750 (only resolution available; higher-res renders 404).
  Within the established Pasadena 150×200 precedent (approved 2026-06-20). Romero (2560×1707) and Seebock
  (634×617) are native/near-native resolution.

## Issues Encountered
- Campaign-site portrait URLs were not extractable via WebFetch markdown; resolved by curl+grep of raw HTML
  and falling back to Ballotpedia's S3 thumbs for the 3 ward members.

## Next Phase Readiness
- Plan 03 (stances) ready — same external_id→UUID map. Next audit-only migrations: **1086–1090** (one per member).
- Plan 03 human checkpoint will re-confirm correct-person identity on the live app.

---
*Phase: 163-henderson-deep-seed*
*Completed: 2026-06-28*
