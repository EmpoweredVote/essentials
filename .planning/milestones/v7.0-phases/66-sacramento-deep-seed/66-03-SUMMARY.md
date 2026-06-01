---
phase: 66-sacramento-deep-seed
plan: 03
subsystem: storage + database
tags: [headshots, supabase-storage, politician-images, sacramento]

# Dependency graph
requires:
  - phase: 66-02
    provides: 9 Sacramento politicians with office_id back-filled
provides:
  - 9 Sacramento headshots in Supabase Storage (politician_photos bucket)
  - 9 essentials.politician_images rows (type='default', photo_license='public_domain')
  - sac_headshots.sql audit file

# Tech tracking
tech-stack:
  added: []
  patterns:
    - All 9 headshots sourced from cityofsacramento.gov CSS background-image attributes
    - Square sources (514x514 or 500x500): center crop to 4:5 ratio (width = height*4/5), then resize to 600x750 Lanczos q90
    - Tall sources (514xN): top crop to 514x(514*5/4), then resize to 600x750 Lanczos q90
    - Upload via Supabase Storage REST API (POST with x-upsert:true, service role key)
    - politician_images.type must be 'default' (not 'headshot')

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/sac_headshots.sql
  modified: []

key-decisions:
  - "All 9 sourced from cityofsacramento.gov official city website (public_domain) — no Wikimedia needed"
  - "Headshots embedded as CSS background-image in style attributes, not <img> src — requires raw HTML grep, not WebFetch"
  - "3 officials had square 514x514 sources (McCarty, Pluckebaum, Jennings), 3 had 500x500 (Talamantes, Guerra, Vang), 3 had tall portrait sources"

patterns-established:
  - "Sacramento headshot source: cityofsacramento.gov/mayor-council/{role} CSS background-image, pattern: /content/dam/portal/mayor-council/{district}/..."
  - "Square CMS renditions use cq5dam.web.514.1028.jpeg suffix but may return 514x514 if source is square"

# Metrics
duration: ~30min
completed: 2026-05-28
---

# Phase 66 Plan 03: Sacramento Headshots Summary

**9/9 Sacramento officials have headshots uploaded to Supabase Storage and politician_images rows inserted; Phase 66 fully complete**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-05-28
- **Files modified:** 1 (sac_headshots.sql created)

## Accomplishments
- Found all 9 headshot URLs from cityofsacramento.gov CSS background-image attributes (curl + grep pattern)
- Downloaded 9 raw images; processed with Python/Pillow to 600x750 JPEG q90 (4:5 crop-then-resize)
- Viewed all 9 processed images — no text overlays, clean portraits, full head + shoulders
- Uploaded all 9 to Supabase Storage (politician_photos bucket) via REST API — all HTTP 200
- Inserted 9 politician_images rows with type='default', photo_license='public_domain'
- Verification query: 9/9 rows confirmed with correct type and license

## Source Details

| Official | External ID | Source | Raw Size | Crop |
|---|---|---|---|---|
| Kevin McCarty (Mayor) | -660001 | cityofsacramento.gov | 514×514 | center 411×514 |
| Lisa Kaplan (D1) | -660010 | cityofsacramento.gov | 514×641 | center 512×641 |
| Roger Dickinson (D2) | -660011 | cityofsacramento.gov | 514×685 | top 514×642 |
| Karina Talamantes (D3) | -660012 | cityofsacramento.gov | 500×500 | center 400×500 |
| Phil Pluckebaum (D4) | -660013 | cityofsacramento.gov | 514×514 | center 411×514 |
| Caity Maple (D5) | -660014 | cityofsacramento.gov | 514×656 | top 514×642 |
| Eric Guerra (D6) | -660015 | cityofsacramento.gov | 500×500 | center 400×500 |
| Rick Jennings II (D7) | -660016 | cityofsacramento.gov | 514×514 | center 411×514 |
| Mai Vang (D8) | -660017 | cityofsacramento.gov | 500×500 | center 400×500 |

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/sac_headshots.sql` — audit-only, 9 politician_images INSERTs

## Decisions Made
- **Wikimedia not needed:** All 9 officials had usable headshots on cityofsacramento.gov — the plan's Wikimedia fallback for McCarty was not required
- **CSS background-image pattern:** Sacramento uses AEM/CQ5 CMS with headshots in `style="background-image:url(...)"` — WebFetch can't extract these; raw HTML grep required

## Next Phase Readiness
- Phase 66 fully complete (all 3 plans done)
- Human verification step: enter Sacramento address in app, confirm council member + Mayor appear with headshots
- Next phase: Phase 69 (per roadmap — see STATE.md)
