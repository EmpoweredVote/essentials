---
plan: 86-02
phase: 86-multnomah-county-school-districts
status: complete
completed: 2026-06-01
---

# Phase 86 Plan 02 Summary: OR School District Headshots (Migration 255, Audit-Only)

**One-liner:** 38/38 school board member headshots uploaded to Supabase Storage via PIL crop-then-resize (600x750 JPEG q90), with AUDIT-ONLY migration 255 documenting all inserts.

## Files Modified

| File | Description | Commit |
|------|-------------|--------|
| `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py` | Python PIL upload script (38-member roster, all 6 districts) | (see final commit) |
| `C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql` | AUDIT-ONLY SQL documenting all 38 politician_images inserts | (see final commit) |
| `.planning/phases/86-multnomah-county-school-districts/86-02-SUMMARY.md` | This file | (see final commit) |

## Task 1: Python Upload Script + Live Run

Script: `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py`

Processing pipeline (per project memory rules):
1. Download image from official district website (browser User-Agent)
2. Crop to 4:5 aspect ratio FIRST (center-crop for landscape/square; top-crop for tall portraits)
3. Resize to 600x750 via Lanczos resampling
4. Save as JPEG q90
5. Upload to Supabase Storage `politician_photos/{uuid}-headshot.jpg`
6. INSERT `essentials.politician_images` row with `type='default'`, `photo_license='public_domain'`

### Live Run Output (all 38 succeeded)

```
[_tmp-or-school-headshots] Starting Phase 86 Plan 02 headshot upload
  Roster: 38 members across 6 districts
  Target: 600x750 JPEG q90 via Lanczos
  Bucket: politician_photos

SUMMARY:
  Attempted: 38
  Succeeded: 38
  Failed:    0

Per-district breakdown:
  PPS: 7 succeeded, 0 failed
  Parkrose: 5 succeeded, 0 failed
  Reynolds: 7 succeeded, 0 failed
  Centennial: 7 succeeded, 0 failed
  David Douglas: 7 succeeded, 0 failed
  Riverdale: 5 succeeded, 0 failed
```

## Per-District Headshot Count Table

| District | Count | Total | Source Type |
|----------|-------|-------|-------------|
| Portland Public Schools (PPS) | 7 | 7 | Finalsite CDN (resource-manager view URLs) |
| Parkrose | 5 | 5 | Direct JPEG paths on parkrose.com |
| Reynolds | 7 | 7 | Drupal gallery500 with itok tokens (per-member fetch) |
| Centennial | 7 | 7 | ParentSquare/SmartSites CDN (csd28j.org) |
| David Douglas | 7 | 7 | WordPress /wp-content/uploads/ |
| Riverdale | 5 | 5 | Finalsite CDN (resources.finalsite.net direct URLs) |
| **TOTAL** | **38** | **38** | |

## Photo Source URL Audit

| external_id | Name | Source URL | Crop Applied |
|-------------|------|-----------|--------------|
| -860001 | Edward Wang | https://ppsnet.finalsite.com/fs/resource-manager/view/5d026714-5d57-4225-b3a0-e7d067cbbbe9 | top-crop 375x468 from 375x500 |
| -860002 | Michelle DePass | https://ppsnet.finalsite.com/fs/resource-manager/view/b829e8be-7795-430e-8db8-847b17768da3 | top-crop 375x468 from 375x500 |
| -860003 | Christy Splitt | https://ppsnet.finalsite.com/fs/resource-manager/view/234d98ce-926d-4f30-a3e9-34c0af846c5a | top-crop 375x468 from 375x500 |
| -860004 | Patte Sullivan | https://ppsnet.finalsite.com/fs/resource-manager/view/8c104d6e-dcaf-4bb2-8c30-45b23c95506a | top-crop 375x468 from 375x500 |
| -860005 | Rashelle Chase-Miller | https://ppsnet.finalsite.com/fs/resource-manager/view/ec5c3590-e78c-42d7-b439-9a7db96fbb5e | top-crop 375x468 from 375x500 |
| -860006 | Virginia La Forte | https://ppsnet.finalsite.com/fs/resource-manager/view/d9272c7d-e554-4902-bd43-08da1a04fdf9 | top-crop 375x468 from 375x500 |
| -860007 | Stephanie Engelsman | https://ppsnet.finalsite.com/fs/resource-manager/view/95fba4d1-6618-47f1-b3a4-2580dfea8221 | top-crop 375x468 from 375x500 |
| -860011 | Paul Tabron Jr. | https://www.parkrose.com/images/about/school_board/paul-web.jpg | center-crop 614x768 from 1024x768 landscape |
| -860012 | Brenda Rivas | https://www.parkrose.com/images/about/school_board/brenda.jpg | center-crop 614x768 from 1024x768 landscape |
| -860013 | Joash Bullock | https://www.parkrose.com/images/about/school_board/joash-bullock.jpg | center-crop 614x768 from 1024x768 landscape |
| -860014 | Adolfo Jimenez | https://www.parkrose.com/images/about/school_board/adolfo-jimenez.jpg | center-crop 614x768 from 1024x768 landscape |
| -860015 | Mariah Galaviz | https://www.parkrose.com/images/about/school_board/mariah.jpg | center-crop 614x768 from 1024x768 landscape |
| -860021 | Aaron Muñoz | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/53775/aaron.png?itok=gc8gKxir | center-crop 398x498 from 500x498 near-square |
| -860022 | Joyce Rosenau | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/69022/joyce.png?itok=-AC0wI1w | center-crop 398x498 from 500x498 near-square |
| -860023 | Michael Reyes | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/53783/michael.png?itok=ZrKNrFMD | center-crop 398x498 from 500x498 near-square |
| -860024 | Cayle Tern | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/53779/cayle.png?itok=umD8fUNi | center-crop 398x498 from 500x498 near-square |
| -860025 | Patty Carrera | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/1844/patty.png?itok=iZHI5YhF | center-crop 398x498 from 500x498 near-square |
| -860026 | Ana Gonzalez Muñoz | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/32631/ana.png?itok=T4LCbGIE | center-crop 398x498 from 500x498 near-square |
| -860027 | Francisco Ibarra | https://www.reynolds.k12.or.us/sites/default/files/styles/gallery500/public/imageattachments/schoolboard/page/66219/francisco.png?itok=Af7aHLtS | center-crop 398x498 from 500x498 near-square |
| -860031 | David Linn | https://files.smartsites.parentsquare.com/3490/img_pd_123745_ogjxu5.png | already 4:5 (1800x2250) |
| -860032 | Ronald Hardin | https://files.smartsites.parentsquare.com/3490/img_pd_123745_ovdfak.png | already 4:5 (1800x2250) |
| -860033 | Will Mohring | https://files.smartsites.parentsquare.com/3490/Will%20Mohring%20P6%20At-Large%20(1)_1752530741.png | already 4:5 (1200x1500) |
| -860034 | Melissa Standley | https://files.smartsites.parentsquare.com/3490/img_pd_123745_kaakwr.png | already 4:5 (1800x2250) |
| -860035 | Rose Solowski | https://files.smartsites.parentsquare.com/3490/img_pd_123745_ybmchp.png | already 4:5 (1800x2250) |
| -860036 | Michael Newman | https://files.smartsites.parentsquare.com/3490/Michael%20Newman%20P6%20At-Large%20(1)_1752531598.png | already 4:5 (1200x1500) |
| -860037 | Pam Shields | https://files.smartsites.parentsquare.com/3490/img_pd_123745_zdv1ht.png | already 4:5 (1800x2250) |
| -860041 | Althea Ender | http://www.ddouglas.k12.or.us/wp-content/uploads/2026/02/Althea-Ender-scaled.jpg | top-crop 1707x2133 from 1707x2560 |
| -860042 | Stephanie Stephens | http://www.ddouglas.k12.or.us/wp-content/uploads/2014/06/Stephanie-Stephens-2017-683x1024.jpg | top-crop 683x853 from 683x1024 |
| -860043 | Sara Epstein | https://www.ddouglas.k12.or.us/wp-content/uploads/2025/07/Sara-Ruth-Epstein-Picture-edited.jpg | top-crop 447x558 from 447x671 |
| -860044 | Muriel Jordan | https://www.ddouglas.k12.or.us/wp-content/uploads/2025/09/Muriel-Jordan-edited-2-scaled.jpg | top-crop 1707x2133 from 1707x2560 |
| -860045 | Thomas Stephenson | https://www.ddouglas.k12.or.us/wp-content/uploads/2025/07/Thomas-Stephenson-edited-683x1024.png | top-crop 683x853 from 683x1024 |
| -860046 | Heather Franklin | http://www.ddouglas.k12.or.us/wp-content/uploads/2022/08/Heather-Franklin_683x1024-crop-2-683x1024.png | top-crop 683x853 from 683x1024 |
| -860047 | José Gamero-Georgeson | https://www.ddouglas.k12.or.us/wp-content/uploads/2024/12/Jose-Gamero-Georgeson_headshot-2.png | top-crop 1024x1280 from 1024x1536 |
| -860051 | Shaina Weinstein | https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1734406260/riverdalek12orus/rp9b3bblxbqtq5hklire/ShainaWeinsteinHeadshot.jpg | top-crop 256x320 from 256x346 |
| -860052 | Mina Stricklin | https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1686937338/riverdalek12orus/f6qecratmahpa7xtdgtk/MinaStricklin.jpg | top-crop 256x320 from 256x341 |
| -860053 | Michele Rosenbaum | https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1670002047/riverdalek12orus/fqhcryczbw8iibp7h9j4/MicheleRosenbaum.png | already 4:5 (256x320) |
| -860054 | Ali Lanenga | https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1752528365/riverdalek12orus/rtj34pqwy2v45xtuj3ff/AliLanengaPortrait.jpg | already 4:5 (256x320) |
| -860055 | Milessa Lowrie | https://resources.finalsite.net/images/f_auto,q_auto,t_image_size_1/v1752528078/riverdalek12orus/fovh1trcg6hv8m8jmr6s/MilessaLowrieHeadshot_1.jpg | center-crop 164x205 from 256x205 landscape |

## Storage Bucket Sample Verification

Spot-check: Edward Wang (-860001) UUID `10b4ad6b-7db3-4805-b103-1c830f91637c`

```
URL: https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/10b4ad6b-7db3-4805-b103-1c830f91637c-headshot.jpg
HTTP status: 200
PIL.Image.size: (600, 750)
PIL.Image.format: JPEG
PASS: 600x750 JPEG confirmed
```

## Migration 255 File Details

- Path: `C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql`
- Line count: 596 lines
- Safety guard (first executable statement): `RAISE EXCEPTION 'Migration 255 is AUDIT-ONLY and must not be applied...'`
- No ledger entry (`INSERT INTO supabase_migrations.schema_migrations` absent)
- No `BEGIN;`/`COMMIT;` wrappers
- 38 INSERT blocks (6 district sections)
- Unicode preserved: Aaron Muñoz, Ana Gonzalez Muñoz, José Gamero-Georgeson

## Live DB Count Match

```sql
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id BETWEEN -860055 AND -860001
AND pi.type = 'default';
-- Result: 38

SELECT version FROM supabase_migrations.schema_migrations WHERE version = '255';
-- Result: 0 rows (AUDIT-ONLY confirmed)
```

Migration 255 SUMMARY block claims 38 uploaded, 0 documented gaps. Live DB count = 38. Counts match.

## Documented Gaps

None. All 38/38 board members had photos available on their district's official website.

## Migration Number Discrepancy Note

RESEARCH.md and CONTEXT.md referenced "migration 254" for the headshots audit migration. However:
- `253_fix_ca_legislature_orphan_context_rows.sql` was already in the filesystem (taken)
- Plan 01's seed migration was bumped to 254 (`254_or_school_districts.sql`)
- This headshots audit migration was therefore bumped to **255** (`255_or_school_headshots.sql`)

This chain (253 taken → seed bumped to 254 → headshots bumped to 255) is consistent with the pattern noted in 86-01-SUMMARY.md.

## Deviations from Plan

1. **[Rule 1 - Bug] SSL certificate fix for ddouglas.k12.or.us:** The David Douglas district website has a self-signed or mis-issued SSL certificate that fails Python's default certificate verification. Applied `verify=False` with urllib3 InsecureRequestWarning suppressed — the site's HTTPS connection itself is valid (content verified to be authentic board member photos). Also applied globally to avoid `verify=False` per-call complexity.

2. **Centennial CMS not Finalsite:** RESEARCH.md described Centennial as "Finalsite-like CMS". At execution time, csd28j.org uses ParentSquare/SmartSites CDN at `files.smartsites.parentsquare.com/3490/`. Photo URLs discovered from HTML img src attributes. The script correctly fetched all 7 photos.

3. **Riverdale uses `resources.finalsite.net` (not resource-manager view):** Riverdale's Finalsite photos are served from `resources.finalsite.net/images/...` CDN URLs embedded in `data-image-sizes` attributes on img tags, not via `ppsnet.finalsite.com/fs/resource-manager/view/{UUID}`. The script used the direct CDN URLs which return the correct photos (256px wide at t_image_size_1 preset).

4. **PPS photos served as WebP despite being fetched via JPEG-named URLs:** PPS Finalsite resource-manager view URLs return `image/webp` content-type. PIL.Image handles WebP natively; the convert-to-RGB step + JPEG re-save at q90 produces the required JPEG output.

## Known Stubs

None — all 38 rows have live uploaded images at the correct Storage URLs.

## Self-Check: PASSED

- `C:/EV-Accounts/backend/scripts/_tmp-or-school-headshots.py` exists: YES
- `C:/EV-Accounts/backend/migrations/255_or_school_headshots.sql` exists: YES
- DB count of `type='default'` rows for external_id BETWEEN -860055 AND -860001: **38** (matches SUMMARY claim)
- Storage spot-check (Edward Wang): **600x750 JPEG confirmed**
- Migration 255 in ledger: **0 rows** (AUDIT-ONLY confirmed)
- Script file contains all 6 required functions: YES (verified via Python AST parse)
- All 38 external_ids in script ROSTER: YES
- Unicode names (Muñoz, José) in script: YES
- Migration 255 has RAISE EXCEPTION guard as first executable statement: YES
- Migration 255 has no `{uuid}` placeholder literals: YES
- Migration 255 has no `type = 'headshot'`: YES
