---
quick_id: 260729-hdz
description: Seed Dane County WI — government, banner, stances, headshots
status: complete
completed: 2026-07-29
---

# Summary — Dane County WI seed (260729-hdz)

Full Racine-shape clone for Dane County (geo_id 55025), everything applied to production
and verified. Final counts: **61 offices / 61 seated / 60 with photos / 42 with stances
(170 evidence rows)**.

## What shipped

1. **Polygons** — 37 supervisory districts from the WI LTSB "(Current)" ArcGIS layer,
   mtfcc `X-DC-SUP`, geo_id `55025-sup-d{1..37}`; 3 probe addresses each land in exactly
   one district. Script: `EV-Accounts backend/scripts/import-dane-supervisor-districts.ts`.
2. **Migration 1491** (`EV-Accounts backend/migrations/1491_dane_county_government.sql`,
   applied, gate PASSED) — government row, 3 chambers, ADOPTED the chamber-less 1480
   County Executive office (Melissa Agard) instead of duplicating it, 6 officers + 37
   supervisors + 17 judges seated (supervisors 2026-04-01 'month'; DA Ozanne 2010-08-01
   'month'; others NULL/'unknown' — honest precision), judge_details with Genovese as
   the lone Chief Judge. Split-section check: 0 rows.
3. **Surfacing** — `COVERAGE_COUNTIES` search-only chip (essentials dbd04c81), flipped
   `hasContext: true` after the stance push (a7b21886). Both pushed to main.
4. **Banner** — Driftless Area / Ice Age Trail near Berry (Corey Coyle, CC BY 3.0),
   1700x540 at `cities/dane-county.jpg`; chosen over the oversaturated courthouse
   street shot; distinct from Madison's Capitol-skyline city banner.
5. **Headshots** — 59 sourced (37 supervisor county portraits, 17 judges via
   courts.danecounty.gov GetPhoto, 5 officers), operator approved all via review
   artifact, uploaded as `{pid}-headshot.jpg` + politician_images rows. Agard already
   had one → 60/61. **Adam Gallagher = honest blank** (no published portrait anywhere).
6. **Stances** — 4 sequential evidence-only agents (countywide, D1-12, D13-25, D26-37);
   170 answers / 42 officials applied via `apply-dane-county-stances.ts`
   (`npx tsx --env-file=.env`). Treasurer Gallagher + Register of Deeds Chlebowski have
   zero evidenced positions (blank spokes, correct). Judges excluded by design.
   Legistar API (webapi.legistar.com/v1/dane) sponsor lists + roll calls were the
   richest suburban-district evidence source. RES-026 gender-affirming-care co-sponsor
   scores normalized to 2 on same-sex-marriage/civil-rights scales.
7. **TT ping** — `TT-TEAM-NOTE-dane-county-landed-2026-07-29.md` committed in
   treasury-tracker (local; TT session owns the push).

## Gotchas recorded for future county seeds

- Migration 1480 left the Dane County Executive office with `chamber_id NULL`; the
  (district, chamber, title) office guard does NOT see chamber-less rows — adopt first.
- Dane County's own ArcGIS is token-locked (error 499); WI LTSB's statewide supervisory
  layer works (`SUPERID` field, outSR=4326 required, native EPSG:3070).
- `seat_officeholder` refuses NULL term_start by design; occupancy-only rows go straight
  into `office_terms` (NULL start, 'unknown' precision — the 1459 backfill precedent).
- board.danecounty.gov roster renders via base64-embedded thumbs; real photos live at
  `/supervisors/photo/{internal-id}` discovered per Detail page (id ≠ district number).
- Ph222's stale migration-number claim (1468-1490) was already violated by 1480-1485;
  1491 claimed from origin/master max.

## Commits

- EV-Accounts (LOCAL-ONLY, not pushed): 7bf56043 (seed), 6639bdfc (stance script)
- essentials (pushed): dbd04c81 (chip+banner), a7b21886 (hasContext)
- treasury-tracker (local): 19dc3a0 (TT ping)
