---
phase: 52-me-state-legislature
plan: 03
subsystem: essentials-data
tags: [headshots, maine, state-senate, state-house, supabase-storage, upscaling]

# Dependency graph
requires:
  - phase: phase-52-plan-01
    provides: 35 ME senator politician UUIDs
  - phase: phase-52-plan-02
    provides: 150 ME house rep politician UUIDs
provides:
  - 35 senator headshots in Supabase Storage (600×750, public_domain)
  - 150 house rep headshots in Supabase Storage (600×750, public_domain, upscaled from 152×202)
  - 185 politician_images rows (type='default', photo_license='public_domain')
  - 185 politicians.photo_origin_url values pointing at legislature.maine.gov
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Senate: full-res photos at /uploads/visual_edit/ via individual profile page scrape"
    - "House: 152×202 thumbnails upscaled — crop to 152×190 (remove bottom 12px, preserve forehead), resize to 600×750 LANCZOS q90"
    - "User-approved upscale: house thumbnails are the only available source; upscaled images pass visual review"

key-files:
  created: []
  modified:
    - essentials.politician_images (185 rows inserted)
    - essentials.politicians.photo_origin_url (185 rows updated)
    - Supabase Storage politician_photos bucket (185 JPGs uploaded)

key-decisions:
  - "House thumbnails upscaled to 600×750 rather than gapped — user reviewed samples and approved 2026-05-19"
  - "Bottom 12px cropped (not top) for 4:5 conversion — preserves forehead, trims torso only"
  - "All 185 legislators have photos; 0 documented gaps in either chamber"

# Metrics
duration: ~2hr (including investigation of alternative sources + user approval of upscale approach)
completed: 2026-05-19
---

# Phase 52 Plan 03: ME State Legislature Headshots Summary

**185/185 Maine legislators have headshots — 35 senators at full resolution, 150 house reps upscaled from 152×202 official thumbnails; 0 gaps in either chamber**

## Performance

- **Duration:** ~2 hr (including source investigation)
- **Completed:** 2026-05-19
- **Tasks:** 3/3 (Task 1 senate, Task 2 house, Task 3 checkpoint)
- **Files modified:** Supabase Storage (185 JPGs), DB (185 politician_images + 185 photo_origin_url)

## Accomplishments

- Senate pass (Task 1): 35/35 senators uploaded from full-resolution profile photos at `/uploads/visual_edit/` — commit `42866a2`
- House pass (Task 2): 150/150 named house reps uploaded — commit `2aa8a5c` (149 upscaled + 1 full-res Sinclair from earlier pass `78b618e`)
- Visual review of all 185 legislators via contact sheet — user approved
- 0 gaps in either chamber

## Source Investigation (House thumbnails)

Original plan rejected images below 600×750 raw resolution. Investigation revealed:

| Path | Result |
|------|--------|
| `/house/Repository/MemberProfiles/` thumbnail endpoint | 152×202px — all reps |
| Individual profile pages (`/house/MemberProfiles/Details/{id}`) | Same 152×202px images, UUID-prefixed filenames |
| Ballotpedia | Blocked scraping |
| Wikipedia | Not pursued — upscale approved instead |

**Resolution:** User reviewed 3 sample upscales (Fecteau, Faulkingham, Abdi) and approved the approach. The 4x Lanczos upscale from these portrait-style thumbnails produces acceptable quality — the originals are well-composed with simple backgrounds.

**Processing for house reps:**
```python
img = Image.open(raw)  # 152×202
img = img.crop((0, 0, 152, 190))  # remove bottom 12px only — forehead untouched
img = img.resize((600, 750), Image.LANCZOS)
img.save(out, "JPEG", quality=90)
```

## Coverage

| Chamber | Total | With Photo | Without Photo | Coverage |
|---------|-------|------------|---------------|----------|
| Maine Senate | 35 | 35 | 0 | 100% |
| Maine House of Representatives | 150 | 150 | 0 | 100% |
| **Total** | **185** | **185** | **0** | **100%** |

Note: "150 named house reps" = 151 districts minus 1 vacant (D29, Kathy Javner deceased). Vacancies have no politician row and are correctly absent from both lists.

## Gap List

None. All 185 legislators have headshots.

## Task Commits

1. **Task 1 (Senate pass):** `42866a2` — feat(52-03): import senate headshots — 35 uploaded, 0 gapped
2. **Task 2 (House pass, initial):** `78b618e` — feat(52-03): import house headshots — 1 uploaded, 149 gapped (David Sinclair D50 only full-res found)
3. **Task 2 (House pass, upscale):** `2aa8a5c` — feat(52-03): import house headshots — 149 uploaded (upscaled from 152×202), 0 gapped

## PIL Spot-Checks

- Senator sample (Baldacci, -231009): `(600, 750)` ✓
- House rep sample (McCabe, -232093): `(600, 750)` ✓

## DB Sanity Checks

- Orphan politician_images rows: 0 ✓
- photo_origin_url outside legislature.maine.gov: 0 ✓
- photo_license != 'public_domain': 0 ✓

## Visual Review

Contact sheet of all 185 legislators reviewed by user 2026-05-19. No rejects. Quality consistent throughout — upscaled house thumbnails blend acceptably with full-resolution senate photos.

---
*Phase: 52-me-state-legislature*
*Completed: 2026-05-19*
