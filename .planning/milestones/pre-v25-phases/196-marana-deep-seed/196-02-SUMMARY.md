---
phase: 196-marana-deep-seed
plan: 02
status: complete
completed: 2026-07-16
requirements: [SUB-02]
migration: 1346_town_of_marana_headshots.sql
commits: [26e98ac0, b21e0c34]
---

# Plan 196-02 Summary — Town of Marana headshots (7/7)

**Outcome:** All 7 seated officials now serve a **600×750** (4:5, Lanczos q90) headshot from the
`politician_photos` CDN, each bound to the correct Plan-01 politician UUID. Audit migration `1346`
(unregistered) applied to production; `politician_images` count for the 7 Marana ext_ids = **7**.

## Source resolution (Task 3) — official town portraits via sanctioned Playwright

`maranaaz.gov` is Akamai-WAF-blocked to raw HTTP (curl/WebFetch/`requests` all get 403, confirmed live
on both HTML pages **and** `/files/assets/` static images). Header-spoofing is forbidden (T-196-WAF).
The **sanctioned Playwright real-browser flow cleared the WAF**, so I pulled each official's
authoritative high-res portrait straight from their maranaaz.gov bio page (fetched in-page at
`?w=1500` → 1500×2250, saved locally), then the gitignored pipeline processed them (top-crop 2:3→4:5,
resize 600×750 Lanczos q90, EXIF-stripped JPEG q90, x-upsert to Storage). This is strictly better than
the RESEARCH Ballotpedia-first fallback: authoritative, current, correct-person guaranteed, high-res.

Pipeline edit (gitignored `_tmp-*` script, orchestrator-run): ROSTER `photo_url` pointed at the 7
locally-saved official portraits; `download_image`/`head_check` gained a local-file branch; per-image
`photo_license` set to the municipal-government-work provenance.

## Manifest (external_id → UUID → CDN url → license)

All 7 licensed as **"Town of Marana official council portrait (municipal government work; public/press
use)"**. CDN base: `.../politician_photos/{uuid}-headshot.jpg`.

| ext_id | name | UUID |
|--------|------|------|
| -4013001 | Jon Post | `3b09d8a3-641f-43f9-b3cc-0ce695b54aef` |
| -4013002 | Roxanne Ziegler | `4a9bf58b-fd95-4010-81fa-481e1561633d` |
| -4013003 | Patrick Cavanaugh | `cb526b61-89e2-4c0f-b60c-f359e7193192` |
| -4013004 | Patti Comerford | `ad923125-6ce2-44ea-ac1d-a8eb701bff01` |
| -4013005 | Herb Kai | `84e71183-dc0c-46de-8b28-d99c41dc8579` |
| -4013006 | Teri Murphy | `e974aae0-fd87-4bf7-91dc-6935533a80ba` |
| -4013007 | John Officer | `d2690186-3c41-455f-b2c4-a94cb8eb5ff5` |

## Verification (all green)
- `politician_images` count for the 7 ext_ids = 7.
- CDN spot-check: Post + Kai both HTTP 200, `image/jpeg`, PIL dims exactly **600×750** RGB.
- All 7 pipeline runs exited SUCCESS (7/7 uploaded, 0 gaps); no operator-supplied exception needed.
- Source images: all 1500×2250 (2:3), top-cropped to 1500×1875 then resized — crisp, no upscale.

## Deviations
Source host = official `maranaaz.gov` (via sanctioned Playwright), not the RESEARCH-anticipated
Ballotpedia/Wikipedia. Justified by T-196-WAF (real-browser context is sanctioned) and superior
provenance. No `maranaaz.gov` URL is stored in the committed migration; the gitignored script references
the local Playwright-sourced files. Audit migration `1346` left unregistered per plan.

## Next
Wave 2 continues with Plan 03 (evidence-only stances, one official at a time). Roster + UUIDs above.
