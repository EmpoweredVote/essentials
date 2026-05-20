---
phase: 54-me-city-officials-tiers-2-4
plan: 03
subsystem: media
tags: [headshots, supabase-storage, maine, city-officials, python-pil]

# Dependency graph
requires:
  - phase: 54-01
    provides: Lewiston/Bangor/South Portland politician IDs
  - phase: 54-02
    provides: Auburn/Biddeford politician IDs; GAPS.md structure
provides:
  - 27 headshots uploaded to Supabase Storage across 5 Maine Tier 2 cities
  - 15 officials documented as source not found in GAPS.md section 3
  - GAPS.md section 3 fully updated (no TBD values)
  - HEAD-05 requirement closed
  - Phase 54 fully complete: MCITY-03, MCITY-04, HEAD-05 all closed
affects:
  - Politician profile pages — 27 officials now show headshots instead of generic placeholder

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Biddeford bio pages at /[N]/Name-Ward-N — unique image doc IDs per bio (not shared nav IDs)"
    - "Lewiston ward pages serve circle-cropped PNGs (RGBA with baked transparency) — not usable as rectangular headshots"
    - "Auburn councilor profile pages all 404 on rebuilt site; annual report uses map layout only"
    - "Supabase MCP (mcp__supabase-local) more reliable than psql background jobs for DB inserts"

key-files:
  created:
    - ".planning/phases/54-me-city-officials-tiers-2-4/54-03-SUMMARY.md"
  modified:
    - ".planning/phases/54-me-city-officials-tiers-2-4/GAPS.md"

key-decisions:
  - "Lewiston circle PNGs rejected — baked RGBA transparency makes them unsuitable as rectangular headshots; Mayor Sheline's JPEG from /1182/Mayor was the only usable image"
  - "Auburn 7 councilor pages all 404 on rebuilt site — annual report (9MB PDF) confirmed map-only layout, no individual headshots; Mayor Harmon only"
  - "Biddeford used /[N]/Name-Ward-N bio pages (not /directory.aspx?EID= pages) — bio pages have unique document IDs; directory pages share only nav images"
  - "psql background jobs unreliable for DB inserts in this session — used Supabase MCP for all final inserts"

# Metrics
duration: ~90min (interactive, user-approved each batch)
completed: 2026-05-20
---

# Phase 54 Plan 03: ME Tier 2 City Headshots Summary

**27 headshots uploaded across 5 Maine Tier 2 cities; 15 officials documented as source not found; GAPS.md section 3 complete; HEAD-05 closed; Phase 54 fully complete.**

## Performance

- **Duration:** ~90 min (interactive with user approval per city batch)
- **Completed:** 2026-05-20
- **Tasks:** 6 (5 city blocks + GAPS.md update)
- **Files modified:** 1 (GAPS.md section 3)
- **Files created:** 1 (this SUMMARY)

## Accomplishments

- Uploaded 27 headshots to Supabase Storage across all 5 Tier 2 cities
- All photos sourced exclusively from official city websites — no social media, news, or campaign sites
- All photos processed to 600×750px (4:5 ratio, crop-then-resize, Lanczos, q90)
- GAPS.md section 3 updated with final per-city counts and root-cause notes for missing photos
- HEAD-05 requirement satisfied: Tier 2 city headshots uploaded where available, gaps fully documented
- Phase 54 fully complete: MCITY-03 ✓, MCITY-04 ✓, HEAD-05 ✓

## Per-City Results

| City | Uploaded | Missing | Coverage |
|------|----------|---------|----------|
| Bangor | 9 | 0 | 100% — all 9 from bangormaine.gov/446 directory |
| South Portland | 7 | 0 | 100% — all 7 from southportland.gov; Tipton counted once |
| Biddeford | 9 | 1 | 90% — 9 bio pages had JPEGs; Vadnais (At-Large 2) no photo |
| Auburn | 1 | 7 | 13% — Mayor Harmon only; 7 ward/at-large pages all 404 |
| Lewiston | 1 | 7 | 13% — Mayor Sheline only; ward pages serve circle PNGs (RGBA) |
| **Total** | **27** | **15** | **64%** |

## Notable Sourcing Findings

### Bangor / South Portland — Full Coverage
Both cities use CivicPlus directory pages with individual JPEG headshots linked from the main council page. Pattern: `/directory.aspx?eid=[N]` → `ImageRepository/Document?documentId=[N]`. Reliable and straightforward.

### Biddeford — 9/10
Biddeford uses individual bio pages at `/[N]/Name-Ward-N` (not the directory EID pages — those share only nav images). Each bio page has a unique `documentID` pointing to a full-size JPEG. All images were 1733×2600 or 2080×2600 — high quality. Vadnais had no photo on her bio page.

### Auburn — 1/8
The Auburn city website was recently rebuilt. All 7 ward/at-large councilor profile pages return HTTP 404. The annual report PDF (9MB) was checked — it uses a ward-map layout with no individual headshots. The `/Images/Government/CityCouncil/` directory returns 404. Only Mayor Harmon's image at `/Images/Government/Mayor/JEFFREY D. HARMON.jpg` survived the rebuild.

### Lewiston — 1/8
Lewiston's ward councilor pages load successfully but serve circle-cropped PNG files (RGBA mode with baked-in transparency). Downloading reveals `Image.mode = RGBA`, size ~374×348px — the circle cutout is embedded in the file, not applied via CSS. These cannot be converted to rectangular headshots without a visible white/transparent border artifact. Only Mayor Sheline's page at `/1182/Mayor` served a standard JPEG (1095×1246px). Susan Longchamps (Ward 2) had no photo at all on her page.

### Susan Faloon (Bangor) — Re-crop
Faloon's source image had a white strip at the bottom-right corner. Re-processed with 10% right trim + 15% bottom trim before 4:5 crop. User approved the re-cropped version.

## Missing Officials (15 total)

| City | Official | Reason |
|------|----------|--------|
| Auburn | Rachel B. Randall (W1) | Profile page 404 |
| Auburn | Timothy M. Cowan (W2) | Profile page 404 |
| Auburn | Mathieu Duvall (W3) | Profile page 404 |
| Auburn | Kelly Butler (W4) | Profile page 404 |
| Auburn | Leroy G. Walker, Sr. (W5) | Profile page 404 |
| Auburn | Belinda A. Gerry (AL1) | Profile page 404 |
| Auburn | Adam R. Platz (AL2) | Profile page 404 |
| Lewiston | Joshua L. Nagine (W1) | Circle PNG (RGBA) — not usable |
| Lewiston | Susan G. Longchamps (W2) | No photo on page |
| Lewiston | Scott A. Harriman (W3) | Circle PNG (RGBA) — not usable |
| Lewiston | Michael R. Roy (W4) | Circle PNG (RGBA) — not usable |
| Lewiston | Chrissy Noble (W5) | Circle PNG (RGBA) — not usable |
| Lewiston | David B. Chittim (W6) | Circle PNG (RGBA) — not usable |
| Lewiston | Bret Martel (W7) | Circle PNG (RGBA) — not usable |
| Biddeford | Lisa Vadnais (AL2) | No photo on bio page |

## Phase 54 Completion Statement

All three Phase 54 requirements are now closed:

- **MCITY-03**: 5 Tier 2 cities seeded — Lewiston (8), Bangor (9), South Portland (7), Auburn (8), Biddeford (10) = 42 unique politicians ✓
- **MCITY-04**: 17 Tier 3-4 cities documented as `not attempted` in GAPS.md ✓
- **HEAD-05**: 27 headshots uploaded where available on official city sites; 15 gaps documented in GAPS.md section 3 with root-cause notes ✓

---
*Phase: 54-me-city-officials-tiers-2-4*
*Completed: 2026-05-20*
