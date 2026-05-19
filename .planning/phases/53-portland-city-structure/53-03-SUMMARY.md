---
phase: 53-portland-city-structure
plan: "03"
subsystem: essentials-data,essentials-frontend
tags: [supabase-storage, headshots, pillow, civicplus, finalsite, landing-page, portland-maine]

requires:
  - phase: 53-portland-city-structure-plan-02
    provides: 18 Portland politicians seeded (9 City Council + 9 Board of Public Education)

provides:
  - 18 headshot JPGs in Supabase Storage politician_photos bucket (all 600x750 LANCZOS q90)
  - 18 essentials.politician_images rows (type=default, photo_license=public_domain)
  - 18 essentials.politicians.photo_origin_url values set
  - Landing.jsx 5th COVERAGE_AREAS entry for Portland, Maine (browseGovernmentList 2360545)

affects:
  - phase-54-other-cities-incumbents
  - phase-55-me-elections

tech-stack:
  added: []
  patterns:
    - "CivicPlus CMS headshot extraction: use /api/apps/{appName}/all OData endpoint with $filter id eq ... (not /api/articles/{appName}/{id} which returns 404)"
    - "Finalsite CDN headshots: f_auto,q_auto URL variant returns full-quality JPEG regardless of extension shown as .png"
    - "Landscape 1200x900 school board photos crop to portrait: new_w = int(h * 4/5) centered, then resize 600x750"
    - "CivicPlus PNG images are RGBA - composite on white RGB before JPEG save"

key-files:
  created:
    - "Supabase Storage: 18 files in politician_photos bucket"
  modified:
    - "C:/Transparent Motivations/essentials/src/pages/Landing.jsx"
    - "essentials.politician_images (18 INSERTs)"
    - "essentials.politicians.photo_origin_url (18 UPDATEs)"

key-decisions:
  - "CivicPlus API endpoint pattern: /api/apps/me-portland/all with OData $filter — discovered via Playwright network interception (not documented, /api/articles/ returns 404)"
  - "School board photos from portlandschools.org (Finalsite CMS), not portland.k12.me.us (SSL unreachable)"
  - "Council photos are 185x250 (thumbnail size) — upscaled to 600x750 LANCZOS (same approved pattern as Phase 52 ME house reps at 152x202)"
  - "School board photos are 1200x900 landscape — cropped to 720x900 portrait then resized to 600x750 (high quality source)"

patterns-established:
  - "CivicPlus OData batch fetch: /api/apps/{appName}/all?$filter=(id eq {uuid} or id eq {uuid}...)"
  - "Finalsite CDN: replace t_image_size_N with f_auto,q_auto for full resolution"

duration: 29min
completed: 2026-05-19
---

# Phase 53 Plan 03: Portland Headshots + Landing Summary

**18 Portland city officials headshots uploaded (0 gaps) from portlandmaine.gov CivicPlus API and portlandschools.org Finalsite CDN; Portland/Maine added as 5th Landing.jsx coverage area**

## Performance

- **Duration:** 29 min
- **Started:** 2026-05-19T20:08:28Z
- **Completed:** 2026-05-19T20:37:08Z
- **Tasks:** 3
- **Files modified:** 1 (Landing.jsx) + 18 Supabase Storage files + 36 DB rows

## Accomplishments

- 9 Portland City Council headshots uploaded from portlandmaine.gov (CivicPlus CMS) — all 600x750 LANCZOS q90
- 9 Portland Board of Public Education headshots uploaded from portlandschools.org (Finalsite CDN) — all 600x750 LANCZOS q90, 0 gaps total
- Landing.jsx COVERAGE_AREAS updated with 5th entry for Portland, Maine (geo_id 2360545)
- Build smoke test passes cleanly

## Per-Official Headshot Outcome Table

### City Council (9/9 uploaded)

| Seat | Full Name | politician_id | Status | photo_origin_url |
|------|-----------|---------------|--------|-----------------|
| Mayor | Mark Dion | e8e209da-7eb3-49b2-8c5a-c32d81feaa4a | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| D1 | Sarah Michniewicz | 0aec03fa-3ce5-457a-ac0e-f5cc11a40288 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| D2 | Wesley Pelletier | 83fe9b1f-e3bd-4241-b1e3-caa1ea95e086 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| D3 | Regina Phillips | 2c91c0ef-1e3e-4b6b-8801-f8443b60f349 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| D4 | Anna Bullett | c46458f4-1b75-4c7c-b5bb-fe558da92aa0 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| D5 | Kate Sykes | 08136902-1f43-41f5-b079-d892b637bc38 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| AL1 | Pious Ali | d0847a9b-515f-4944-a7d1-2df539283668 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| AL2 | April Fournier | 9a358472-ddfa-451e-b7a5-3b3295f55ea6 | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |
| AL3 | Benjamin Grant | 884f103d-dca7-48fc-977b-4fcafffdba6e | uploaded 600x750 | portlandmaine.gov/741/Council-Bios |

### Board of Public Education (9/9 uploaded)

| Seat | Full Name | politician_id | Status | photo_origin_url |
|------|-----------|---------------|--------|-----------------|
| AL1 | Maya Lena | fb8d20df-c81d-4572-9e8b-c729c5ab84f0 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| AL2 | Sarah Lentz | 788d2399-192a-4836-b247-9b87cddae166 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| AL3 | Usira Ali | 6463e2c4-4141-44f9-904d-9e264e0096a9 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| AL4 | Jayne Sawtelle | 2bc6dd42-3cf5-492a-9f86-5063e3357355 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| D1 | Abusana "Micky" Bondo | 94619e6f-91b3-4a2a-ab2b-8314a96c0c13 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| D2 | Ali Ali | a1f34c2e-9e1c-4137-ad22-f9706dcdbfae | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| D3 | Julianne Opperman | 38301f80-0296-4999-b62a-044db0cf0241 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| D4 | Fatuma Noor | 18d992f1-2e1e-4380-8b81-63362b5bacf1 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |
| D5 | Sarah Brydon | eb9d8495-f015-483b-8da4-4296a7f0cec9 | uploaded 600x750 | portlandschools.org/about/board-of-education/board-members |

**Final coverage: 18 officials, 18 headshots uploaded, 0 gaps**

## Gap List

None — all 18 Portland city officials had usable headshots on their respective official websites.

## Task Commits

Tasks 1 and 2 involved no code file changes (only DB writes and storage uploads). Task 3 produced:

1. **Task 3: Landing.jsx + STATE.md** - `8443308` (feat(53-03): add Maine/Portland to Landing.jsx coverage areas)
2. **Plan metadata** - committed with SUMMARY below

## Landing.jsx Diff

```diff
   { county: 'Cambridge', state: 'Massachusetts', browseGovernmentList: ['2511000'], browseStateAbbrev: 'MA' },
+  { county: 'Portland', state: 'Maine', browseGovernmentList: ['2360545'], browseStateAbbrev: 'ME' },
 ];
```

## Build Smoke Test

```
vite v7.3.1 building client environment for production...
transforming...
✓ 754 modules transformed.
(!) Dynamic import warning (pre-existing, unrelated to this change)
dist/index.html         1.65 kB │ gzip:   0.86 kB
dist/assets/index.css  54.62 kB │ gzip:  10.48 kB
dist/assets/index.js  1,022.83 kB │ gzip: 307.18 kB
✓ built in 5.62s
```

No errors related to Landing.jsx. Pre-existing chunk size warning is unrelated.

## Verification SQL Outputs

### Task 1: City Council (9/9)

```
council_with_headshots
------------------------
                      9
(1 row)
```

URL format verified: all start with `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`
photo_origin_url: all set to `https://www.portlandmaine.gov/741/Council-Bios`

### Task 2: School Board (9/9)

```
          chamber          | total_officials | officials_with_headshot | gaps
---------------------------+-----------------+-------------------------+------
 Board of Public Education |               9 |                       9 |    0
 City Council              |               9 |                       9 |    0
```

photo_origin_url: all set to `https://www.portlandschools.org/about/board-of-education/board-members`

### Task 3: Final Phase-53 Verification

```
 portland_officials | portland_with_headshots | me_cities_seeded
--------------------+-------------------------+------------------
                 18 |                      18 |               23
(1 row)
```

### PIL Spot Checks

- Mark Dion (council): OK: (600, 750), mode=RGB
- Sarah Lentz (school board): OK: (600, 750), mode=RGB

## Decisions Made

- **CivicPlus API pattern:** The correct endpoint is `/api/apps/me-portland/all` with OData `$filter` (discovered via Playwright network interception). Direct `/api/articles/me-portland/{id}` returns 404. The batch format is: `$filter=(id eq {uuid} or id eq {uuid}...)`
- **School board source:** portlandschools.org (Finalsite CMS), not portland.k12.me.us (SSL certificate unreachable). Images are 1200x900 JPEG landscape, served as `.png` URL but actually JPEG content.
- **Council image upscaling:** CivicPlus serves thumbnails at 185x250. Upscaled to 600x750 LANCZOS — same approved pattern as Phase 52 ME house reps (152x202 upscaled).
- **RGBA handling:** CivicPlus PNG assets are RGBA mode — composited on white background before JPEG save to avoid transparent-to-black conversion.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] CivicPlus API endpoint discovery via Playwright**
- **Found during:** Task 1 (City Council headshots)
- **Issue:** Plan specified portlandmaine.gov profile pages as source. The site is a JavaScript SPA using CivicPlus CMS with no static HTML content. Direct HTTP fetch returns widget shell with no photo data. The `/api/articles/me-portland/{id}` endpoints documented in CivicPlus docs all return 404.
- **Fix:** Used Playwright to intercept network requests from the live page. Discovered the correct API is `/api/apps/me-portland/all` with OData `$filter`. The token from the page's `hcmsClientToken` cookie is valid for this endpoint. Image asset IDs extracted from `data.image.en[0]` field; images fetched from `https://content.civicplus.com/api/assets/{asset_id}` (no auth required).
- **Files modified:** None (research only, no files changed)
- **Verification:** All 9 council members fetched and uploaded successfully

**2. [Rule 1 - Deviation] School board domain changed from portland.k12.me.us to portlandschools.org**
- **Found during:** Task 2 (School Board headshots)
- **Issue:** Plan specified `portland.k12.me.us` as source but SSL handshake fails (connection reset). The district's current domain is `portlandschools.org` (Finalsite CMS).
- **Fix:** Used `portlandschools.org/about/board-of-education/board-members` which has all 9 members with photos from `resources.finalsite.net`. Photos are 1200x900 landscape JPEG.
- **Verification:** All 9 board members fetched and uploaded; photo_origin_url set to portlandschools.org

---

**Total deviations:** 2 (1 blocking, 1 source URL correction)
**Impact on plan:** Both corrections required for plan completion. No scope creep. All 18 headshots delivered as planned.

## Issues Encountered

- CivicPlus SPA architecture required Playwright interception to discover working API endpoint — straightforward once discovered
- Landscape-to-portrait crop for school board photos (1200x900 landscape): cropped center column to 720x900, then resized to 600x750

## Next Phase Readiness

Phase 53 is fully complete:
- 23 ME city governments scaffolded (Plan 53-01)
- 18 Portland incumbents seeded (Plan 53-02)
- 18 Portland headshots uploaded (Plan 53-03)
- Landing.jsx updated with Portland/Maine

Phase 54 can now seed incumbents for the other 22 ME cities (Bangor, Lewiston, Auburn, etc.).
Phase 55 (ME elections) can proceed independently.

**Phase 53 closeout:** All 3 plans complete. Delivered MCITY-01 (23-city scaffolding), MCITY-02 (Portland incumbents), HEAD-04 (Portland headshots from official websites), LAND-01 (Maine entry in Landing.jsx).

---
*Phase: 53-portland-city-structure*
*Completed: 2026-05-19*
