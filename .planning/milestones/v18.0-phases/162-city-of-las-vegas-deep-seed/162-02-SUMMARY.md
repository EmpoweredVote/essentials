# 162-02 SUMMARY — City of Las Vegas council headshots

**Status:** ✅ Complete (CLARK-02 SC#2 — headshot half)
**Date:** 2026-06-28

## What was built

- **7/7 council headshots** downloaded from official lasvegasnevada.gov Azure Blob portraits (`sawebfilesprod001.blob.core.windows.net`, no WAF, plain `requests.get`), crop-to-4:5 → resized 600×750 (Lanczos, q90, EXIF stripped via re-encode), uploaded to the `politician_photos` bucket at `{uuid}-headshot.jpg`.
- **Audit-only migration 1076** (`1076_las_vegas_city_council_headshots.sql`, renumbered from 1065) inserted 7 `politician_images` rows (type='default', photo_license='us_government_work'), guarded `WHERE NOT EXISTS` on politician_id. **NOT registered** in the ledger; structural ledger stays 1075.
- **0 documented gaps** — every member sourced.

## Upload manifest (7/7, 0 gaps)

| ext_id | Name | UUID | source dims → 600×750 |
|--------|------|------|----------------------|
| -3205001 | Shelley Berkley | 2568b40c… | 600×800 top-crop |
| -3205002 | Brian Knudsen | 169596c9… | source res → crop |
| -3205003 | Kara Kelley | 1c488168… | 600×800 top-crop |
| -3205004 | Olivia Diaz | 168705cc… | **600×400 landscape** → center-crop 320×400 → upscale (Pasadena precedent) |
| -3205005 | Francis Allen-Palenske | 91544dd2… | 600×800 top-crop |
| -3205006 | Shondra Summers-Armstrong | 6f433371… | 600×803 top-crop |
| -3205007 | Nancy E. Brune | 0a0ea0c6… | 960×1440 top-crop (%20 URL handled) |

## Verification

- Script manifest: **7/7 uploaded, 0 gaps**.
- `politician_images` for the 7 ext_ids: 7 rows / 7 distinct people / all type='default' / all photo_license='us_government_work'.
- CDN spot-check HTTP 200: Berkley, Diaz, Brune.
- Structural ledger unchanged (1076 audit-only, NOT registered).

## Key files

- `C:/EV-Accounts/backend/scripts/_tmp-lv-city-council-headshots.py` (gitignored `_tmp-*`, not committed)
- `C:/EV-Accounts/backend/migrations/1076_las_vegas_city_council_headshots.sql` (commit `086ed196`, applied)

## Self-Check: PASSED
