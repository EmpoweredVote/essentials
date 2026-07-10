---
phase: 164-north-las-vegas-deep-seed
plan: 02
title: North Las Vegas council headshots
status: complete
completed: 2026-06-29
requirements: [CLARK-04]
---

# Phase 164 Plan 02 — Summary

Sourced, processed (crop-4:5-first → 600×750 Lanczos q90), and installed headshots
for all 5 City of North Las Vegas council members. **5/5 uploaded, 0 gaps.**

## Sourcing

`cityofnorthlasvegas.com` is Akamai WAF-403 (skipped entirely). Sourced via the
per-member fallback chain; **each portrait visually spot-checked** before use
(clean head-and-shoulders, no text/graphic overlay over the face, identity
consistent with the office).

| ext_id | Member | Source | License |
|--------|--------|--------|---------|
| −3207001 | Pamela Goynes-Brown | Wikimedia Commons (Sen. Rosen office photo, 476×635) | public_domain |
| −3207002 | Isaac E. Barrón | Ballotpedia infobox `IsaacBarron1.jpg` (200×300) | press_use |
| −3207003 | Ruth Garcia-Anderson | Ballotpedia infobox `rganderson.jpg` (200×300) | press_use |
| −3207004 | Scott Black | Ballotpedia official `Scott_Black__Official_-6_fixed.png` (200×300) | press_use |
| −3207005 | Richard Cherchio | Ballotpedia infobox `Richard_Cherchio.jpg` (200×300) | press_use |

Wikimedia required a **descriptive User-Agent** (`ev-essentials-research/1.0`) — the
script switches UA for any `wikimedia.org` host (429s on a browser UA). Scott
Black's PNG was white-composited (no transparency halo).

## Manifest (consumed by migration 1094)

```
SUCCESS: -3207001 Pamela Goynes-Brown   bc59a9f6-e308-4c1c-af96-0aebb8ac72c6 -> .../bc59a9f6-...-headshot.jpg [public_domain]
SUCCESS: -3207002 Isaac E. Barrón       59c8b352-1ffb-44fc-89c2-68627ade8a8c -> .../59c8b352-...-headshot.jpg [press_use]
SUCCESS: -3207003 Ruth Garcia-Anderson  cefd942b-7c4f-4d7b-9726-95d8c5a42c9f -> .../cefd942b-...-headshot.jpg [press_use]
SUCCESS: -3207004 Scott Black           80a3329f-c338-4991-afb3-b1670996ef7b -> .../80a3329f-...-headshot.jpg [press_use]
SUCCESS: -3207005 Richard Cherchio      806dbfb2-3e81-4d76-bd04-085bc523b76a -> .../806dbfb2-...-headshot.jpg [press_use]
5/5 uploaded, 0 gaps
```

All mirrored to `politician_photos/{uuid}-headshot.jpg`.

## Migration 1094 (audit-only) — applied + verified

- 5 INSERT blocks (type='default', NOT EXISTS idempotency), applied via `psql -f` (5× INSERT 0 1).
- `politician_images` rows for −3207001..−3207005 = **5**.
- All 5 CDN URLs return **HTTP 200**.
- **1094 NOT registered** in the ledger (audit-only); structural ledger stays at **1093**.
- No forbidden tokens in comments (removed image-origin column paraphrased).

## Files

- `C:/EV-Accounts/backend/scripts/_tmp-north-las-vegas-council-headshots.py` (gitignored helper — NOT committed)
- `C:/EV-Accounts/backend/migrations/1094_north_las_vegas_city_council_headshots.sql` (audit-only)

## Next

- **Next migration: 1095** (Plan 03 stances, audit-only, one per member 1095–1099).
- Plan 03: evidence-only compass stances (one research agent at a time) + final E2E verification + human checkpoint.
