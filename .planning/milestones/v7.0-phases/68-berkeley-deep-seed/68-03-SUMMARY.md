---
phase: 68-berkeley-deep-seed
plan: "03"
subsystem: essentials-data
tags: [berkeley, headshots, supabase-storage, politician-images, berkeleyca-gov]

requires:
  - phase: 68-02
    provides: "10 Berkeley politicians seeded with office_id back-filled"

provides:
  - "10 essentials.politician_images rows for all Berkeley officials"
  - "politicians.photo_origin_url set on all 10 Berkeley officials"
  - "10 headshots in Supabase Storage politician_photos at 600×750"
  - "Audit migration 215_berkeley_headshots.sql (AUDIT-ONLY)"

affects:
  - "Profile pages for all Berkeley officials now render headshots"

tech-stack:
  added: []
  patterns:
    - "berkeleyca.gov elected-office-holder direct file paths (no 403 — standard User-Agent)"
    - "300×300 square originals → horizontal center crop to 4:5 → 600×750 Lanczos q90"
    - "Audit-only migration pattern (215 mirrors 212/209/200)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/215_berkeley_headshots.sql (AUDIT-ONLY)"
  modified:
    - "essentials.politician_images (10 new rows)"
    - "essentials.politicians.photo_origin_url (10 updates)"
    - "Supabase Storage politician_photos (10 uploaded JPGs)"

key-decisions:
  - "berkeleyca.gov /sites/default/files/elected-office-holder/ paths returned HTTP 200 with standard User-Agent — no 403 workaround needed (unlike fremont.gov)"
  - "All 10 originals were 300×300 square — horizontal center crop to 240×300 (4:5) then resize to 600×750"
  - "215_berkeley_headshots.sql is AUDIT-ONLY; next applied Supabase migration is 216"
  - "photo_license='public_domain' for all 10 (berkeleyca.gov government portraits)"

duration: 15min
completed: 2026-05-22
---

# Phase 68 Plan 03: Berkeley Headshots Summary

**10/10 Berkeley officials imaged from berkeleyca.gov (public_domain), 600×750 JPEG, no gaps; audit migration 215 written; human-verified approved**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-05-22
- **Tasks:** 1 (+ checkpoint)
- **Files modified:** DB rows + Storage objects (outside essentials git repo)

## Accomplishments

- Fetched all 10 Berkeley official headshots from `berkeleyca.gov/sites/default/files/elected-office-holder/` — no 403 issues (standard User-Agent sufficient)
- Cropped 300×300 square originals to 240×300 (4:5) via horizontal center crop, resized to 600×750 Lanczos q90
- Uploaded all 10 to Supabase Storage `politician_photos/{politician_id}-headshot.jpg`
- Inserted 10 `essentials.politician_images` rows (type='default', photo_license='public_domain')
- Set `politicians.photo_origin_url` on all 10 Berkeley officials
- Wrote audit migration `215_berkeley_headshots.sql` (AUDIT-ONLY header, BEGIN/COMMIT)
- Human verification approved

## Task Commits

No code commits in essentials git repo — all changes are DB rows and Storage objects in live Supabase.

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/215_berkeley_headshots.sql` — AUDIT-ONLY; 10 INSERT + 10 UPDATE pairs
- `essentials.politician_images` — 10 new rows
- `essentials.politicians.photo_origin_url` — 10 updates
- Supabase Storage `politician_photos` — 10 new JPGs at `{politician_id}-headshot.jpg`

## Coverage Table

| Chamber | In DB | With Headshot | Missing |
|---------|-------|---------------|---------|
| City Auditor | 1 | 1 | 0 |
| City Council | 8 | 8 | 0 |
| Mayor | 1 | 1 | 0 |
| **Total** | **10** | **10** | **0** |

## Per-Politician Import Log

| ext_id | Name | Source URL | License | Notes |
|--------|------|------------|---------|-------|
| -680001 | Adena Ishii | berkeleyca.gov/…/adena-ishii.jpg | public_domain | 300×300 original |
| -680002 | Jenny Wong | berkeleyca.gov/…/Jenny_Wong.jpg | public_domain | 300×300 original |
| -680010 | Rashi Kesarwani | berkeleyca.gov/…/kesarwani.jpg | public_domain | 300×300 original |
| -680011 | Terry Taplin | berkeleyca.gov/…/Terry%20Taplin.jpg | public_domain | 300×300 original |
| -680012 | Ben Bartlett | berkeleyca.gov/…/Ben-Bartlet.jpg | public_domain | 300×300 original |
| -680013 | Igor Tregub | berkeleyca.gov/…/Igor-Tregub-headshot.jpg | public_domain | 300×300 original |
| -680014 | Shoshana O'Keefe | berkeleyca.gov/…/OKeefe240628-499.jpg | public_domain | 300×300 original |
| -680015 | Brent Blackaby | berkeleyca.gov/…/brent_blackaby_square_headshot-medium.jpg | public_domain | 300×300 original |
| -680016 | Cecilia Lunaparra | berkeleyca.gov/…/cecilia-lunaparra.jpg | public_domain | 300×300 original |
| -680017 | Mark Humbert | berkeleyca.gov/…/Mark-Humbert-300px.jpg | public_domain | 300×300 original |

## PIL Spot-Check

```
Adena Ishii (Mayor, -680001):       HTTP 200, 72414 bytes — (600, 750) RGB — PASS
Igor Tregub (Council D4, -680013):  HTTP 200, 56581 bytes — (600, 750) RGB — PASS
```

## Gap Section

None — all 10 Berkeley officials have headshots.

## Decisions Made

- **berkeleyca.gov vs fremont.gov**: Berkeley's CMS serves headshots at stable `/sites/default/files/elected-office-holder/` paths without WAF blocking. No Node.js CDN-path-extraction workaround needed (unlike fremont.gov).
- **Square originals**: All 10 berkleyca.gov portraits were 300×300 (1:1). Crop strategy: horizontal center crop to 240×300 (4:5 ratio), then resize to 600×750. This preserves face centering without top-crop bias.
- **215 is AUDIT-ONLY**: Next applied Supabase migration is 216, not 215. Pattern mirrors 212 (Fremont), 209 (SD), 200 (SF).

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- Phase 68 fully complete: Berkeley address lookups return complete local officials list with headshots
- Profile pages for all 10 Berkeley officials render headshots
- Phase 69 TODO: set `election_method='RCV'` on all 3 Berkeley chambers (Mayor, City Council, City Auditor)
- Next migration is 216

---
*Phase: 68-berkeley-deep-seed*
*Completed: 2026-05-22*
