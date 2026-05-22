---
phase: 63-sf-deep-seed
plan: "03"
subsystem: essentials-data
tags: [sf, headshots, politician_images, supabase-storage]
requires:
  - 63-02
provides:
  - 20 SF official headshots in Supabase Storage at 600x750
  - 20 politician_images rows (one per official)
  - photo_origin_url set on all 20 politicians
  - migrations/200_sf_headshots.sql audit file
affects:
  - Profile page rendering (politician_images COALESCE chain)
tech-stack:
  added: []
  patterns:
    - circular RGBA PNG -> 4:5 center crop (transparent corners outside crop region) -> RGB JPEG
    - Wikimedia Commons official portrait as public domain fallback for sfsheriff.com gap
key-files:
  created:
    - C:/EV-Accounts/backend/migrations/200_sf_headshots.sql
  modified:
    - essentials.politician_images (20 rows inserted)
    - essentials.politicians.photo_origin_url (20 rows updated)
    - Supabase Storage politician_photos bucket (20 files uploaded)
decisions:
  - id: supervisor-circular-pngs-usable
    summary: "sf.gov circular _profile.png files accepted for supervisors"
    rationale: "The PNGs have RGBA with transparent (alpha=0) corners, NOT white corners. After 4:5 center crop (left=34, right=310 of 345px width), all four corners are fully opaque (verified per-pixel). No white corner artifacts. Both sf.gov and sfbos.org only expose the circular PNG; no rectangular alternative exists."
  - id: miyamoto-wikimedia-commons
    summary: "Sheriff Miyamoto sourced from Wikimedia Commons (public domain)"
    rationale: "www.sfsheriff.com has no individual headshot page for the sheriff. The about page has a group/staff photo (152x152). Wikimedia Commons has the official SFSO portrait (650x867, PD California) credited to the SF Sheriff's Office. Commons page: https://commons.wikimedia.org/wiki/File:Paul_Miyamoto,_2020.jpg"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-22"
---

# Phase 63 Plan 03: SF Headshots Summary

**One-liner:** 20/20 SF officials with 600x750 JPEG headshots; supervisors use circular sf.gov PNGs (transparent corners outside 4:5 crop); Miyamoto from Wikimedia Commons public domain official portrait.

## Coverage Table

| Chamber              | In DB | With Headshot | Missing |
|---------------------|-------|---------------|---------|
| Assessor-Recorder    | 1     | 1             | 0       |
| Board of Supervisors | 11    | 11            | 0       |
| City Administrator   | 1     | 1             | 0       |
| City Attorney        | 1     | 1             | 0       |
| Controller           | 1     | 1             | 0       |
| District Attorney    | 1     | 1             | 0       |
| Mayor                | 1     | 1             | 0       |
| Public Defender      | 1     | 1             | 0       |
| Sheriff              | 1     | 1             | 0       |
| Treasurer            | 1     | 1             | 0       |
| **TOTAL**            | **20**| **20**        | **0**   |

## Per-Politician Import Log

| ext_id   | Name               | Chamber              | Source URL                                                                                             | License      | Notes                                     |
|----------|--------------------|----------------------|--------------------------------------------------------------------------------------------------------|--------------|-------------------------------------------|
| -630001  | Connie Chan        | Board of Supervisors | media.api.sf.gov/...D01-Connie_Chan_2025_profile.png                                                  | public_domain | circular PNG; transparent corners outside 4:5 crop |
| -630002  | Stephen Sherrill   | Board of Supervisors | media.api.sf.gov/...D02-Stephen_Sherrill_2025_profile.png                                             | public_domain | circular PNG |
| -630003  | Danny Sauter       | Board of Supervisors | media.api.sf.gov/...D03-Danny_Sauter_2025_profile.png                                                 | public_domain | circular PNG |
| -630004  | Alan Wong          | Board of Supervisors | media.api.sf.gov/...D04-Alan_Wong_2026_profile.png                                                    | public_domain | circular PNG |
| -630005  | Bilal Mahmood      | Board of Supervisors | media.api.sf.gov/...D05-Bilal_Mahmood_2025_profile.png                                                | public_domain | circular PNG |
| -630006  | Matt Dorsey        | Board of Supervisors | media.api.sf.gov/...D06-Matt_Dorsey_2025_profile.png                                                  | public_domain | circular PNG |
| -630007  | Myrna Melgar       | Board of Supervisors | media.api.sf.gov/...D07-Myrna_Melgar_2025_profile.png                                                 | public_domain | circular PNG |
| -630008  | Rafael Mandelman   | Board of Supervisors | media.api.sf.gov/...D08-Rafael_Mandelman_2025_profile.png                                             | public_domain | circular PNG |
| -630009  | Jackie Fielder     | Board of Supervisors | media.api.sf.gov/...D09-Jackie-Fielder_2025_profile.png                                               | public_domain | circular PNG |
| -630010  | Shamann Walton     | Board of Supervisors | media.api.sf.gov/...D10-Shamann_Walton_2025_profile.png                                               | public_domain | circular PNG |
| -630011  | Chyanne Chen       | Board of Supervisors | media.api.sf.gov/...D11-Chyanne_Chen_2025_profile.png                                                 | public_domain | circular PNG |
| -630020  | Daniel Lurie       | Mayor                | media.api.sf.gov/...daniel_lurie_KeVK6TD.jpg                                                          | public_domain | standard rectangular JPEG |
| -630021  | David Chiu         | City Attorney        | media.api.sf.gov/...DC_Headshot.jpg                                                                   | public_domain | standard rectangular JPEG |
| -630022  | Brooke Jenkins     | District Attorney    | media.api.sf.gov/...Brooke_Jenkins_-_cropped_m2XGRTD.jpg                                             | public_domain | standard rectangular JPEG |
| -630023  | Paul Miyamoto      | Sheriff              | upload.wikimedia.org/wikipedia/commons/2/28/Paul_Miyamoto%2C_2020.jpg                                | public_domain | Wikimedia Commons official SFSO portrait (650x867); sfsheriff.com has no individual headshot page |
| -630024  | Joaquin Torres     | Assessor-Recorder    | media.api.sf.gov/...Joaquin_Torres_-_spotlight_image.jpeg                                             | public_domain | standard rectangular JPEG |
| -630025  | Jose Cisneros      | Treasurer            | sftreasurer.org/sites/default/files/inline-images/IMG_8134b_0.jpg                                    | public_domain | official site headshot; verified loadable |
| -630026  | Manohar Raju       | Public Defender      | media.api.sf.gov/...Manohar_Raju_-_cropped.png                                                        | public_domain | standard PNG |
| -630027  | Greg Wagner        | Controller           | media.api.sf.gov/...Greg_Wagner_for_SF.GOV__0_6ERJ9o4.jpg                                            | public_domain | standard rectangular JPEG |
| -630028  | Carmen Chu         | City Administrator   | media.api.sf.gov/...carmen_chu_hero_two_ts2GlAY.png                                                   | public_domain | standard PNG |

## Gap Section

None — all 20 officials have headshots. No gaps.

## PIL Spot-Check Outputs

```
Connie Chan (supervisor): (600, 750) mode=RGB
Daniel Lurie (mayor): (600, 750) mode=RGB
Greg Wagner (controller): (600, 750) mode=RGB
```
All three confirmed at exactly 600x750.

## Deviations from Plan

### Auto-resolved Issues

**1. [Rule 1 - Bug] Circular PNG "white corner" issue — not actually a white corner problem**

- **Found during:** Investigation of supervisor sf.gov profile images
- **Issue:** User reported white corners visible from circular PNGs. Investigation showed the corners have alpha=0 (transparent), not white. The apparent white is from RGBA->RGB JPEG conversion compositing transparent pixels over white. However, verified via per-pixel numpy analysis that all four corners of the 4:5 center crop region are fully opaque (alpha=255). The transparent zone (rows 0 and 344, cols 0-24 and 320-344 of the 345x345 image) is entirely outside the 4:5 crop window (col 34 to 310). No white corners appear in the final 600x750 JPEG.
- **Resolution:** Standard 4:5 center crop with RGBA->RGB conversion is safe; no special handling needed.
- **Conclusion:** Circular PNGs accepted as-is; sf.gov and sfbos.org both only expose the circular PNG.

**2. [Rule 1 - Bug] Sheriff Miyamoto "ewww" subdomain URL was a typo**

- **Found during:** Testing the URL `https://ewww.sfsheriff.com/images/Miyamoto_sm1.png`
- **Issue:** The "ewww" subdomain redirects to the sfsheriff.com homepage (HTTP 200 on the homepage, not the image).
- **Resolution:** Tried `https://www.sfsheriff.com/images/Miyamoto_sm1.png` — also redirected to homepage. `sfsheriff.com` has no individual headshot page for Miyamoto anywhere. Found Wikimedia Commons public domain official portrait (650x867, PD California) at https://commons.wikimedia.org/wiki/File:Paul_Miyamoto,_2020.jpg. Used that instead.

## Audit File

`C:/EV-Accounts/backend/migrations/200_sf_headshots.sql` — 20 idempotent INSERTs into `essentials.politician_images`. Audit-only; not applied via Supabase ledger. Next migration is 207.

## Phase 63 Completion

Phase 63 (SF deep seed) is now fully complete:
- 63-01: SF government structure (1 government, 10 chambers, 12 districts)
- 63-02: SF officials seed (20 politicians + 20 offices)
- 63-03: SF headshots (20/20 at 600x750, 0 gaps)

SF address lookups now return a full local officials list with headshots for all 20 active non-vacant SF officials.
