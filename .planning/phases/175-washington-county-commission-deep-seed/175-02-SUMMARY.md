---
phase: 175-washington-county-commission-deep-seed
plan: 02
status: complete
completed: 2026-06-30
requirements: [WASH-01]
---

# Plan 175-02 Summary — WashCo Commissioner Headshots

## What was built

5/5 seated Washington County commissioners now render with 600×750 headshots. Portraits sourced
from the official county-officials page (media-production.washcotech.net CDN), 4:5-cropped FIRST
then Lanczos-resized to 600×750 q90, RGBA→white-composite where needed, mirrored to Supabase
Storage `politician_photos/{uuid}-headshot.jpg`. Migration 1121 records one `politician_images`
row per commissioner (`type='default'`, `photo_license='us_government_work'`). **Audit-only — NOT
ledger-registered.**

## Files

- `C:/EV-Accounts/backend/scripts/_tmp-washco-headshots.py` — pipeline (gitignored per `backend/scripts/_*`).
- `C:/EV-Accounts/backend/migrations/1121_washco_commission_headshots.sql` — committed @ 8a3f2f96.

## Per-commissioner manifest (all SUCCESS, 0 gaps)

| Seat | Name | Source | Final | Storage path |
|------|------|--------|-------|--------------|
| Chair | Harrington | `2023-01/Chair Harrington 22.jpg` | 600×750 | `76b00811-…-headshot.jpg` |
| D1 | Fai | `2023-01/Fai D1 22.jpg` | 600×750 | `a1fe6f71-…-headshot.jpg` |
| D2 | Treece | `2023-01/Treece D2 22.jpg` | 600×750 | `0cb0bffc-…-headshot.jpg` |
| D3 | Snider | `2025-01/snider.jpg` | 600×750 | `a98aeea6-…-headshot.jpg` |
| D4 | Willey | `2023-01/Willey D4 22.jpg` | 600×750 | `f010b78a-…-headshot.jpg` |

## Verification gates (all pass)

1. Headshot count (external_id -410113..-410100): **5** ✓
2. Schema shape: **5/5** rows `type='default'` + `photo_license='us_government_work'` ✓
3. Storage reachability: all 5 URLs **HTTP 200** ✓
4. Ledger NOT registered (1121): **0** ✓ (audit-only)
5. Documented gaps: **none** — all 5 sourced.

## ⚠ Quality flag for human-verify checkpoint

The county CDN's native source portraits are only **165×215 px** — the `max_966_wide` style serves
them at native size (cannot upscale beyond original). The pipeline upscaled ~3.6× to reach 600×750,
so these render **soft/low-detail**. This is the best available OFFICIAL county source and matches
prior-phase precedent (Pasadena/Henderson accepted upscaled low-res official portraits). If a sharper
source is desired, an operator can point to a higher-res portrait and re-run the pipeline.

**Identity checkpoint (T-175-H1):** all 5 sourced from the identity-bound official county-officials
page (name+district labeled). Recommend a visual confirmation at the phase browse checkpoint.

## Self-Check: PASSED
