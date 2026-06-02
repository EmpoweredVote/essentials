---
phase: 87-ca-city-school-boards
plan: 05
status: complete
---

## What Was Built

Script `scripts/sfusd-color-headshots.py` downloads, crops, resizes, and uploads color headshots for all 7 SFUSD commissioners, replacing the greyscale images loaded in phase 87-02.

| Name | Source | Original Size | Mode | Upload Status |
|------|--------|--------------|------|---------------|
| Alida Fisher | sfstandard.com | 3840x3840 | RGBA | OK |
| Jaime Huling | website-files.com (Gary Sexton photo) | 2159x1440 | RGB | OK |
| Lisa Weissman-Ward | sfstandard.com | 3839x2559 | RGB | OK |
| Matt Alexander | squarespace-cdn.com | 2500x1875 | RGB | OK |
| Parag Gupta | thefrisc.com (direct, not wp.com CDN) | 493x689 | RGB | OK |
| Phil Kim | sfstandard.com | 3840x2561 | RGB | OK |
| Supryia Ray | thefrisc.com (direct, not wp.com CDN) | 569x736 | RGB | OK |

Notes:
- Alida Fisher source was RGBA (PNG with alpha) — converted to RGB before JPEG save
- Parag Gupta and Supryia Ray: the `i0.wp.com` CDN URLs in the plan returned 404; direct `thefrisc.com` URLs worked fine
- Auth fix: `.env` defines both `SUPABASE_SECRET_KEY` (sb_secret_... format) and `SUPABASE_SERVICE_ROLE_KEY` (JWT). Storage REST API requires the JWT; script now prefers the JWT key explicitly

## Verification Results

```
full_name          | url
-------------------+--------------------------------------------------------------
Alida Fisher       | .../ab26f9f3-3cc1-43d3-b40a-717667af2284-headshot.jpg
Jaime Huling       | .../6ef8e4aa-1262-4461-9124-93ef2aa34dc5-headshot.jpg
Lisa Weissman-Ward | .../948dd349-1f56-4b65-bc1d-4a7affc05051-headshot.jpg
Matt Alexander     | .../f7d1b584-8c95-4e68-bedb-6f1b3fabab87-headshot.jpg
Parag Gupta        | .../8ca7781e-b688-4979-870d-80e36e21169f-headshot.jpg
Phil Kim           | .../df88c679-1a6c-4ecf-8b55-3b6a59f01686-headshot.jpg
Supryia Ray        | .../61965a0c-e156-4a4a-bd4e-229ea6a15bf2-headshot.jpg
```

All 7 rows confirmed in `essentials.politician_images` with correct storage URLs.

## Success Criteria Met

- All 7 SFUSD commissioners now have color 600x750 headshots in Supabase Storage
- politician_images rows confirmed updated via DB query
- Greyscale rejection guard (from 87-04) is active — any B&W re-run would be caught (RGBA Alida Fisher passed because RGBA is a color mode, correctly converted to RGB)
- Storage upsert used x-upsert: true so existing greyscale files were overwritten in-place
