---
phase: 170-section-banners-continuous-scroll-results
plan: "04"
subsystem: frontend-page
tags: [section-banner, human-verify, uat, banner-imagery, address-autocomplete, supabase-storage]
dependency_graph:
  requires: [170-01-SectionBanner-component, 170-02-FilterBar-tier-removal, 170-03-Results-wiring]
  provides: [human-approved section-banner Results redesign, 50-state + federal + LA-county banner imagery in production storage]
  affects: [src/components/SectionBanner.jsx, src/lib/buildingImages.js, src/pages/Results.jsx, src/hooks/useGooglePlacesAutocomplete.js]
tech_stack:
  added: []
  patterns:
    - "onError image fallback to tier gradient (never a broken <img>)"
    - "parseCityFromAddress fallback for browse/address city resolution"
    - "STATE_PANORAMAS set keyed by abbrev → production storage banner, capitol fallback"
key_files:
  created: []
  modified:
    - src/components/SectionBanner.jsx
    - src/lib/buildingImages.js
    - src/pages/Results.jsx
    - src/hooks/useGooglePlacesAutocomplete.js
decisions:
  - "Removed pin + eyebrow from banners (overrides locked UI-SPEC D-01/D-02/D-03) at user request — title-only banners"
  - "Migrated 11 LA-county building photos off a paused secondary Supabase project to production (re-sourced from Wikimedia)"
  - "All 50 states get curated panoramic banners (skyline if iconic, else landscape); prefer daytime shots"
  - "Vegas/Chicago/Denver: kept dusk only where it reads as attractive evening glow (IL, CO); NV converted to daytime Strip"
requirements-completed: [BANR-01, BANR-02, BANR-03, BANR-04, NAV-01]
metrics:
  duration: "checkpoint + UAT iteration across 2 sessions"
  completed: "2026-06-26"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 4
---

# Phase 170 Plan 04: Human Visual + Functional Sign-off Summary

**One-liner:** Human approved the section-banner Results redesign on the live deploy after a UAT round that fixed broken banner imagery, migrated curated photos off a paused storage project, simplified the banner chrome, fixed address-city search, and added daytime panoramic banners for all 50 states + the federal tier.

## Performance
- **Tasks:** 2/2 (dev server + human checkpoint)
- **Files modified (during UAT):** 4
- **Completed:** 2026-06-26

## Checkpoint Outcome
**APPROVED.** The user reviewed the banners on the live deploy (essentials.empowered.vote) and confirmed the City → State → Federal continuous-scroll layout, location-aware banners, graceful fallback, and the reconciled Type filter + name search.

## Post-Checkpoint UAT Fixes (commits)
The initial live review surfaced real defects; each was fixed, pushed, and re-reviewed:

1. **Graceful fallback + city resolution** — `7a6124c`: added `onError` so a 404 image (e.g. paused bucket) degrades to the tier gradient instead of a broken `<img>` (BANR-03); added `parseCityFromAddress` so address searches resolve the city (Bloomington showed "Your City" + no image).
2. **LA-county photo migration** — `2ad24c5`: the 11 curated city-hall photos lived on a *paused* secondary Supabase project (`zlbutxtrjcixpdgfzrgv`). Re-sourced all 11 from their original Wikimedia URLs (tracked in `essentials.building_photos`), optimized (~19MB→2.3MB), and uploaded to the production bucket; updated `buildingImages.js` + DB.
3. **LA skyline** — `1fa520b`: replaced the vertical LA City Hall tower (unrecognizable when cropped) with a skyline-centered Echo Park sunset view.
4. **Address autocomplete** — `b1ce43b`: `types: ['address']` → `['geocode']` so city names (e.g. "Bloomington, IN") suggest correctly instead of matching an unrelated street.
5. **Banner simplification** — `1059ae3`: removed the coral pin + teal eyebrow (title-only), fixed the State label in browse mode ("Your State" → "California"), and set a public-domain US Capitol federal banner.
6. **State panoramas** — `744717d` (sample of 5: NY/IL/WY/FL/CO) then `4b8bd5f` (all 50): curated wide panoramic banners (skyline where iconic, natural landscape otherwise), re-sourced from Wikimedia, optimized, uploaded to `politician_photos/states/<ABBR>.jpg`; attribution tracked in comments.
7. **Daytime preference** — `9c341e5`: swapped 9 night/evening state shots (AZ, HI, ID, KS, MI, MN, NM, NV, TX) to daytime; kept approved dusk shots for IL + CO.

## Requirements Verified
- **BANR-01** — reusable `SectionBanner` renders the per-tier banner ✓
- **BANR-02** — City → State → Federal in one continuous scroll ✓
- **BANR-03** — location-aware imagery + graceful fallback (now also `onError`) ✓
- **BANR-04** — stats + feature-icon scaffolding slots present (hidden) ✓
- **NAV-01** — tier sort control gone; Type filter + name search work ✓

## Deviations from Plan
The phase scope expanded substantially during live UAT beyond the original 4 plans — banner imagery sourcing/migration (originally deferred to "Phase 171"), address-autocomplete fix, and removal of the pin/eyebrow (locked UI-SPEC decisions). All changes were user-directed during review.

## Issues Encountered
- A secondary Supabase storage project was paused, 404-ing all LA-county banner images — resolved by re-sourcing from Wikimedia and migrating to production.
- Wikimedia titles don't reliably indicate night vs. day or correct location — required visual spot-checks + location-token filtering to avoid wrong-state/night picks.

## Next Phase Readiness
Phase 170 complete. Banner imagery now lives entirely in production storage (no dependency on the paused project). Future: per-image attribution display (currently stored, not surfaced); the time-of-day banner switching idea was considered and declined as overkill.

---
*Phase: 170-section-banners-continuous-scroll-results*
*Completed: 2026-06-26*
