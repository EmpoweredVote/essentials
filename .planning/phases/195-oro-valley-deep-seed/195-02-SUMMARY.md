---
phase: 195-oro-valley-deep-seed
plan: 02
status: complete
completed: 2026-07-10
requirements: [SUB-01]
---

# 195-02 Summary — Town of Oro Valley headshots (7/7)

## What was built
All 7 sitting officials now serve a **600×750** (4:5, Lanczos q90, crop-first) headshot from the
`politician_photos` Storage bucket, bound to the correct Plan-01 politician row. Audit-only migration
`1306_town_of_oro_valley_headshots.sql` (7 `politician_images` rows, unregistered) applied to prod.
Pipeline script `_tmp-oro-valley-headshots.py` (gitignored, never committed). Migration committed to
`C:/EV-Accounts` @ `9b20b19b`.

## WAF handling
`orovalleyaz.gov` (Akamai WAF) was **never fetched** — all sources resolved from NON-WAF hosts. No
header-spoofing. voteorovalley.com (the incumbent slate site) was down/unreachable; sourced each
official individually instead.

## Final manifest (external_id → UUID → source → license)
| ext_id | official | source host | photo_license | crop |
|---|---|---|---|---|
| -4009001 | Winfield (Mayor) | joewinfieldmayor.com | campaign, press_use | center |
| -4009002 | Barrett (VM) | melaniebarrett.org | campaign, press_use | **left-anchor** (off-center hero) |
| -4009003 | Jones-Ivey | tucsonlocalmedia.com (Explorer News) | news_press_use | native 4:5 |
| -4009004 | Nicolson | joshfororovalley.com | campaign, press_use | center |
| -4009005 | Greene | iloveov.com candidate profile | candidate-submitted | center |
| -4009006 | Murphy | iloveov.com candidate profile | candidate-submitted | center |
| -4009007 | Robb | iloveov.com candidate profile | candidate-submitted | center |

CDN base: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{uuid}-headshot.jpg`

## Verification
- politician_images count for the 7 ext_ids = **7**; 0 leftover TODO licenses.
- `curl -sI` each of the 7 CDN URLs → **HTTP 200**; PIL dims on all 7 = exactly **600×750**.
- Visual QA (7-up contact sheet): all 7 read as clean, correctly-framed, correctly-identified portraits
  of distinct individuals. Barrett's left-anchor crop framed her face (not the Pusch-Ridge backdrop).

## Deviations / notes
- Added a small orchestrator tuning to the gitignored pipeline: an optional per-member `crop_anchor_x`
  (default 0.5=center) on `crop_to_4_5`, set to 0.0 for Barrett so her far-left position in a wide
  landscape hero photo is framed on the face. Also a GET fallback in the dry-run HEAD check (framerusercontent
  and townnews/bloximages reject HEAD but serve GET). Script is gitignored — no repo impact.
- Greene's source (iloveov, 480×300) and Robb's (300×357) are on the smaller side (mild upscaling); both
  above the MIN_DIM=100 floor and visually acceptable. Identity per source captions.
- T-195-WRONG (wrong-but-present) mitigated by direct visual review of every source AND every processed
  CDN image before sign-off.
