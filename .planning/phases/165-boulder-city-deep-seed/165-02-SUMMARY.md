# Phase 165 Plan 02 — Summary

**Plan:** 165-02 (Boulder City headshots)
**Status:** ✅ Complete
**Requirement:** CLARK-05 (SC#2 — headshots)
**Date:** 2026-06-29

## What was built

600×750 (4:5, Lanczos q90) headshots for all 5 Boulder City council members, mirrored to Supabase Storage `politician_photos/{uuid}-headshot.jpg`, plus audit-only migration 1101 inserting the `politician_images` rows. **5/5 sourced, 0 gaps.** flybouldercity.com is clean (no WAF).

## Headshot manifest (5/5 SUCCESS, 0 gaps)

| ext_id | Name | Source documentId | Orig size | License | CDN |
|--------|------|-------------------|-----------|---------|-----|
| −3208001 | Joe Hardy (Mayor) | flybouldercity 10964 | 2080×2499 RGB | us_government_work | 200 |
| −3208002 | Sherri Jorgensen | flybouldercity 9459 | 2080×2600 RGB | us_government_work | 200 |
| −3208003 | Cokie Booth | flybouldercity 10924 | 1857×2600 RGB | us_government_work | 200 |
| −3208004 | Steve Walton | flybouldercity 10899 | 2080×2600 RGB | us_government_work | 200 |
| −3208005 | Denise E. Ashurst | flybouldercity 14763 | 1733×2042 RGB | us_government_work | 200 |

All sources well above 600×750 — pure downscale, no upscaling artifacts. All RGB JPEG. Crop-to-4:5 FIRST then resize-600×750 q90.

## Correct-person visual spot-check (PASSED)

All 5 inspected after upload: clean professional head-and-shoulders portraits from the same official Boulder City studio set (consistent gray-green backdrop), distinct individuals, **no text/graphic overlays, no "Re-Elect" banners, no placeholders**. Hardy shows the signature turquoise bolo tie. Framing 4:5 with eyes ~upper third. No wrong-person or overlay rejections.

## Migration 1101 — applied (audit-only)

`C:/EV-Accounts/backend/migrations/1101_boulder_city_council_headshots.sql` — 5 INSERT blocks, type='default', NOT EXISTS idempotency, photo_license='us_government_work' (×5).

Inline verification:
- `politician_images` rows for ext_id −3208005..−3208001: **5** (all type='default')
- CDN urls: all **HTTP 200**
- ledger: mig 1101 **NOT registered** (structural ledger stays at 1100) ✓

## key-files
created:
- C:/EV-Accounts/backend/scripts/_tmp-boulder-city-council-headshots.py (gitignored _tmp helper)
- C:/EV-Accounts/backend/migrations/1101_boulder_city_council_headshots.sql

## Self-Check: PASSED
- 5/5 headshots 600×750 in Storage; 0 gaps; no fabrication.
- Correct-person spot-check passed (no overlay, distinct individuals).
- Migration 1101 applied audit-only; 5 politician_images rows; CDN-200; ledger stays 1100.
