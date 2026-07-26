---
phase: 194-city-of-tucson-deep-seed
plan: 03
subsystem: database
tags: [headshots, politician_images, storage, playwright, waf-fallback, tucson]

requires:
  - phase: 194-02
    provides: 7 politician UUIDs (external_id -4008001..-4008007) the images bind to
provides:
  - 7/7 City of Tucson officials serve a 600x750 headshot from the politician_photos CDN
  - Audit-only migration 1297 (7 politician_images rows, per-image license, unregistered)
affects: [194-06]

tech-stack:
  added: []
  patterns:
    - "WAF-fallback headshot sourcing: official host (Akamai WAF, 403) never fetched; portraits resolved from non-WAF hosts (Wikimedia / Ballotpedia S3 / campaign/alumni sites) via Playwright"
    - "Optional per-member crop_box_frac in the pipeline for non-headshot-framed sources (waist-up → head+shoulders, eyes ~1/3 from top)"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-tucson-headshots.py (gitignored, not committed)
    - C:/EV-Accounts/backend/migrations/1297_city_of_tucson_headshots.sql
  modified: []

key-decisions:
  - "Ballotpedia S3 originals (files/{Name}) used for 5 ward members — reliable, requests-fetchable, current official portraits"
  - "Barajas (no Ballotpedia portrait, newly seated Dec 2025) sourced from her UCLA Luskin alumna feature (4000x6000), pre-cropped to head+shoulders"
  - "Romero from Wikimedia Commons (public domain) — cleanest license"

patterns-established:
  - "photo_license documented PER image (never a uniform value): wikimedia_public_domain / ballotpedia_portrait / ucla_luskin_feature"

requirements-completed: [TUC-01]

duration: ~35min
completed: 2026-07-10
---

# Phase 194 Plan 03: 7/7 City of Tucson Headshots Summary

**All 7 City of Tucson officials serve a 600×750 CDN headshot bound to their current politician row — sourced from non-WAF hosts (Wikimedia PD, Ballotpedia S3, UCLA Luskin) via Playwright because the official city host is Akamai-WAF-blocked.**

## Performance

- **Duration:** ~35 min
- **Tasks:** 3 (author pipeline → author audit migration → resolve URLs via Playwright + run + apply + assert)
- **Files modified:** 2 (1 gitignored script + 1 committed audit migration, both in C:/EV-Accounts)

## Accomplishments
- Authored `_tmp-tucson-headshots.py` (gitignored) from the Pima analog; added an optional per-member `crop_box_frac` pre-crop for non-headshot-framed sources.
- Authored audit-only migration `1297` (7 `politician_images` rows, unregistered).
- Resolved 7 non-WAF source URLs via Playwright, uploaded all 7 processed 600×750 images to the `politician_photos` bucket, applied the audit migration.
- Verified: `politician_images` count for the 7 ext_ids = 7; all 7 CDN URLs HTTP 200; PIL sample (Romero + Barajas) = exactly 600×750.

## Final Headshot Manifest

| ext_id | official | source host | photo_license |
|---|---|---|---|
| -4008001 | Regina Romero (Mayor) | Wikimedia Commons | wikimedia_public_domain |
| -4008002 | Lane Santa Cruz (W1/VM) | Ballotpedia S3 | ballotpedia_portrait |
| -4008003 | Paul Cunningham (W2) | Ballotpedia S3 | ballotpedia_portrait |
| -4008004 | Kevin Dahl (W3) | Ballotpedia S3 | ballotpedia_portrait |
| -4008005 | Nikki Lee (W4) | Ballotpedia S3 | ballotpedia_portrait |
| -4008006 | Selina Barajas (W5) | UCLA Luskin feature (head+shoulders pre-crop) | ucla_luskin_feature |
| -4008007 | Miranda Schubert (W6) | Ballotpedia S3 | ballotpedia_portrait |

All CDN paths: `politician_photos/{uuid}-headshot.jpg`.

## Task Commits
1. **Task 1: Pipeline script** — authored (gitignored `backend/scripts/_*`, never committed)
2. **Task 2: Audit migration** — `30d50581` (feat) — committed to `C:/EV-Accounts`
3. **Task 3: Resolve + run + apply + assert** — orchestrator-run; Storage uploads + read-only assertions

## Decisions Made
- Ballotpedia S3 originals chosen for the 5 ward members over their dated 2019 campaign sites (Ballotpedia carries current official portraits and is `requests`-fetchable).
- Barajas had no Ballotpedia portrait (newly seated Dec 2025); used her UCLA Luskin alumna-feature portrait with a head+shoulders pre-crop.
- Kevin Dahl's campaign bio still described *him* as Vice Mayor ("for the past year") — a stale 2025-term line; the Dec-2025 re-vote moved Vice Mayor to Santa Cruz (confirmed by operator at the Plan 02 checkpoint).

## Deviations from Plan
Minor enhancement (within plan intent): added an optional `crop_box_frac` pre-crop to the pipeline so a non-headshot-framed source (Barajas, waist-up) yields a proper head+shoulders headshot. The plan anticipated per-source sizing differences; this is the mechanism.

## Issues Encountered
- Barajas has no clean headshot on Ballotpedia / a dedicated campaign site; resolved via the UCLA Luskin feature + pre-crop.

## Next Phase Readiness
- ROADMAP #2 (7/7 600×750 headshots) TRUE in production; each binds to the current member (no Fimbres/Kozachik).
- Wrong-but-present image risk (T-194-WRONG) deferred to the Plan 06 human identity spot-check (esp. the Dec-2025 new members Barajas/Schubert).

---
*Phase: 194-city-of-tucson-deep-seed*
*Completed: 2026-07-10*
