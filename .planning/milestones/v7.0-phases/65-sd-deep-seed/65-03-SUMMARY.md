---
phase: 65-sd-deep-seed
plan: "03"
subsystem: essentials-data
tags: [san-diego, headshots, politician-images, supabase-storage, public-domain]

# Dependency graph
requires:
  - phase: 65-02
    provides: 11 SD politicians with politician_id UUIDs, all active, all with office_id back-filled
provides:
  - sd-headshots-complete
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns: [audit-only-migration, pil-crop-then-resize, python-storage-upload]

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/209_sd_headshots.sql (audit-only)
  modified: []

key-decisions:
  - "209_sd_headshots.sql is AUDIT-ONLY — NOT applied via Supabase migrations ledger; next applied migration is 210"
  - "All 11 headshots sourced from official sandiego.gov pages — photo_license='public_domain'"
  - "Henry L. Foster III D4 image confirmed correct despite cd7-henry-foster-iii.png CMS filename anomaly"
  - "Storage path pattern: {politician_id}-headshot.jpg for all 11 officials"
  - "?v=N cache-buster query params stripped from photo_origin_url but used in fetch"

patterns-established:
  - "Audit-only migration pattern (mirrors 200_sf_headshots.sql): real SQL executed live during skill loop; migration file for replay/audit only; NOT in Supabase ledger sequence"
  - "PIL crop-to-4:5-first then resize-to-600x750-Lanczos-q90: always crop before resize, never stretch"
  - "Python upload script (not curl) for Supabase Storage PUT — avoids multipart/signed-URL edge cases"

metrics:
  duration: "45 minutes"
  completed: "2026-05-22"
---

# Phase 65 Plan 03: SD Headshots Summary

**11/11 SD officials headshots imported from official sandiego.gov (public_domain); all 600x750 JPEG in Supabase Storage; Henry L. Foster III D4 image confirmed correct despite cd7-henry-foster-iii.png CMS filename anomaly; Phase 65 fully complete.**

## Performance

- **Duration:** ~45 min
- **Completed:** 2026-05-22
- **Tasks:** 1 (+ 1 checkpoint approved)
- **Files modified:** 1 (209_sd_headshots.sql created)

## Coverage Table

| Chamber | politicians_in_db | with_headshot | missing |
|---------|-------------------|---------------|---------|
| City Attorney | 1 | 1 | 0 |
| City Council | 9 | 9 | 0 |
| Mayor | 1 | 1 | 0 |
| **Total** | **11** | **11** | **0** |

## Per-Politician Import Log

All 11 sourced from official sandiego.gov pages. `photo_license='public_domain'` for all.

| external_id | Name | Chamber | Source URL (cleaned) | Notes |
|-------------|------|---------|----------------------|-------|
| -650001 | Todd Gloria | Mayor | `https://www.sandiego.gov/sites/default/files/todd-gloria-2.png` | PNG source; RGBA flattened to RGB |
| -650002 | Heather Ferbert | City Attorney | `https://www.sandiego.gov/sites/default/files/2025-08/city-attorney-ferbert-headshot.jpg` | JPEG; 2025-08 date folder |
| -650010 | Joe LaCava | City Council (D1) | `https://www.sandiego.gov/sites/default/files/joe-lacava-sq.jpg` | "-sq" square source; cropped to 4:5 |
| -650011 | Jennifer Campbell | City Council (D2) | `https://www.sandiego.gov/sites/default/files/jennifer-campbell-sq.jpg` | "-sq" square source; cropped to 4:5 |
| -650012 | Stephen Whitburn | City Council (D3) | `https://www.sandiego.gov/sites/default/files/2024-10/stephen-whitburn-v2.jpg` | 2024-10 date folder |
| -650013 | Henry L. Foster III | City Council (D4) | `https://www.sandiego.gov/sites/default/files/2024-04/cd7-henry-foster-iii.png` | **CMS filename anomaly** (see note below); image visually confirmed correct |
| -650014 | Marni von Wilpert | City Council (D5) | `https://www.sandiego.gov/sites/default/files/2024-10/councilmember-marni-von-wilpert.jpg` | 2024-10 date folder |
| -650015 | Kent Lee | City Council (D6) | `https://www.sandiego.gov/sites/default/files/councilmember-kent-lee-cd6.jpg` | Standard path |
| -650016 | Raul Campillo | City Council (D7) | `https://www.sandiego.gov/sites/default/files/raul-campillo-sq.jpg` | "-sq" square source; cropped to 4:5 |
| -650017 | Vivian Moreno | City Council (D8) | `https://www.sandiego.gov/sites/default/files/2024-05/councilmember-vivian-moreno-headshot.jpg` | 2024-05 date folder |
| -650018 | Sean Elo-Rivera | City Council (D9) | `https://www.sandiego.gov/sites/default/files/sean-elo-rivera-sq.jpg` | "-sq" square source; cropped to 4:5 |

### Henry L. Foster III — D4 CMS Filename Anomaly

The source URL filename is `cd7-henry-foster-iii.png` — note "cd7" in the filename despite this being the District 4 council member. This is a CMS naming error confirmed by RESEARCH: the URL was scraped from the District 4 section of sandiego.gov/citycouncil, not District 7. The image was visually confirmed at the human checkpoint to show Henry L. Foster III (the District 4 council member) and NOT a District 7 person.

## Gap Section

**None** — all 11 officials have headshots imported.

## PIL Spot-Check Results

All 11 images confirmed `(600, 750) RGB` via PIL spot-check from Storage CDN. Sample outputs:

- Todd Gloria (Mayor, -650001): `(600, 750) RGB` — confirmed
- Heather Ferbert (City Attorney, -650002): `(600, 750) RGB` — confirmed
- Henry L. Foster III (D4, -650013): `(600, 750) RGB` — confirmed; visually verified as correct person

## Human Checkpoint

**Approved** — all 11 headshots verified acceptable:
- Todd Gloria: official portrait, no banners/text, confirmed correct person
- Heather Ferbert: official portrait, no banners/text
- Henry L. Foster III: image confirmed correct despite `cd7-henry-foster-iii.png` CMS filename anomaly
- Joe LaCava, Jennifer Campbell, Raul Campillo, Sean Elo-Rivera: "-sq" square sources, clean 4:5 crop confirmed
- Marni von Wilpert, Stephen Whitburn, Vivian Moreno: date-folder images, clean headshots

## Audit Migration

**File:** `C:/EV-Accounts/backend/migrations/209_sd_headshots.sql`

**AUDIT-ONLY** — this file is NOT applied via the Supabase migrations ledger. The actual SQL was executed live during the find-headshots skill loop. The file exists for audit, replay (e.g., bootstrapping a new environment), and traceability only.

- Header comment explicitly states: "AUDIT ONLY — NOT applied via Supabase migrations ledger"
- Contains 11 INSERT INTO essentials.politician_images blocks + 11 UPDATE essentials.politicians SET photo_origin_url blocks
- Wrapped in `BEGIN; ... COMMIT;`
- Mirrors the SF Phase 63 pattern (`200_sf_headshots.sql`)

**Supabase ledger sequence for Phase 65:** 207, 208. Next applied migration is 210 (not 209).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. The Henry L. Foster III filename anomaly was anticipated in the plan and verified at the checkpoint gate.

## Backlog Items (future phases)

Two UX gaps noted for future improvement:

1. **Search partial-name matching (medium priority):** Searching for "Henry Foster" does not match Henry L. Foster III — only the exact string "Henry L. Foster III" returns a result. The middle initial is required. A partial-name or fuzzy-match improvement to the search backend would fix this.

2. **District number on profile page (low priority):** Henry Foster's politician profile page does not display his district number (D4). There is no visible D4/D7 distinction. Future UX improvement: show district label on profile.

## Next Phase Readiness

**Phase 65 is fully complete.** All 4 roadmap success criteria satisfied:

1. SD council district geofences loaded (Phase 65-01, 9 X0007 rows)
2. SD government structure seeded (migration 207 — 1 government, 3 chambers, 10 districts)
3. SD officials seeded (migration 208 — 11 politicians, 11 offices)
4. All 11 SD officials have headshots at 600x750 in Supabase Storage (this plan)

SD address lookups now return the full local officials list with headshots: Mayor + City Attorney (citywide) + the district-specific Council Member.

**Storage URL pattern:** `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{politician_id}-headshot.jpg`

**Next migration is 210.**

---
*Phase: 65-sd-deep-seed*
*Completed: 2026-05-22*
