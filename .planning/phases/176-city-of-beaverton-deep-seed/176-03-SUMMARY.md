---
plan: 176-03
status: complete
completed: 2026-06-30
---

# 176-03 Summary — Beaverton Headshots

7/7 officials have 600×750 headshots mirrored to Supabase Storage. **0 gaps.**
Pipeline: crop-to-4:5 first → resize 600×750 Lanczos q90. Audit-only migration 1132 applied
(7 `essentials.politician_images` rows) + committed in `C:/EV-Accounts` (4420b0a4). CDN URLs
return HTTP 200 image/jpeg.

| ext_id | Official | photo_license | Source | Note |
|--------|----------|---------------|--------|------|
| -4105351 | Lacey Beaty | cc_by_2.0 | Wikimedia Commons | high-res |
| -4105352 | Ashley Hartmeier-Prigg | press_use | Oregon SoS voters' guide | high-res |
| -4105353 | Kevin Teater | press_use | Beaverton Valley Times | ok |
| -4105354 | Edward Kimmi | press_use | official campaign site | high-res |
| -4105355 | Allison Tivnon | press_use | Joint Water Commission page | small source (300×300 upscaled) |
| -4105356 | John Dugger | press_use | Beaverton Valley Times | ok |
| -4105357 | Nadia Hasan | press_use | personal official site | high-res (2500×3658) |

**Quality note:** Tivnon's only available portrait was 300×300 (upscaled to 600×750) — acceptable but lower-res than the others; a higher-res source can replace it later if one surfaces. No text/graphic overlays on any image (Canva endorsement graphics for Dugger/Hasan/Hartmeier-Prigg were explicitly rejected).

Artifacts: `_tmp-beaverton-headshots.py` (gitignored), `1132_beaverton_headshots.sql` (committed).
