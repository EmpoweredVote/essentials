# Phase 184 — Plan 03 (headshots) SUMMARY

**Executed inline (no subagents):** 2026-07-04
**ETL:** `_tmp-westmetro-school-wave2-headshots.py` (gitignored) — ran via `py`.
**Migration applied:** `1209_or_westmetro_school_boards_wave2_headshots.sql` (audit-only; renumbered from planned 1207 — MO workstream).
**Status:** 14/14 uploaded, 0 failed. Migration applied, uuid-embed gate passed. All gates green.

## Manifest — 14/14 SUCCESS across 3 CDN paths
| ext_id | Name | CDN path | UUID |
|--------|------|----------|------|
| -4112241 | David Jaimes | finalsite (upscaled) | 38449e1d-d7b6-42ba-a276-23f8eb7577c9 |
| -4112242 | Kristen Miles | finalsite (upscaled) | cf4a4d49-6c3c-4301-854c-5ca675bc7637 |
| -4112243 | Tristan Irvin | finalsite (upscaled) | 641306e7-77fe-4b51-be95-a2523c89838f |
| -4112244 | Jill Zurschmeide | finalsite (upscaled) | c9a660c1-7056-4986-92dd-05e8dae75ffb |
| -4112245 | Crystal Weston | finalsite (upscaled) | 8a480326-0f2d-4b19-b32b-566f5415152e |
| -4105161 | Brisa Franco | Edlio | 9b4ff67f-41d4-489f-8425-4c3373bc1bdd |
| -4105162 | Pete Truax | Edlio | 7f1e8356-75a4-4ce5-8410-efefa0277f2f |
| -4105163 | Alma Lozano | Edlio | 6e7c4b85-7aec-45f1-9c3f-8994e0d29738 |
| -4105165 | Kristy Kottkey | Edlio | 81000b71-a70a-421c-a957-b4abf3459ec5 |
| -4111291 | Harmony Carson | WP-REST large | b890e3ea-5c9c-46bc-9de2-162a4bba682f |
| -4111292 | Matt Kaufman | WP-REST large (center-cropped) | 80d8161b-176a-417c-894b-9ce87e0ee469 |
| -4111293 | Abby Hawkins | WP-REST large | db661550-a3ce-454d-a2ca-7f48fcd5c635 |
| -4111294 | Hans Moller | WP-REST large | 7da7aada-692c-4a8f-8b12-7ca10806aa65 |
| -4111295 | Matt Thornton | WP-REST large | 18bb831c-13b2-4b8a-978f-53593539a772 |

## Linda Harrington (FGSD Position 4, -4105164) — DOCUMENTED GAP (D-R5)
- District on-page image = "Coming Soon" placeholder (4.3KB), confirmed at Wave-0.
- Local-news attempt: the Forest Grove News-Times June 25 2026 appointment article's only image is a **two-person scene photo** (648×486, faces small/ambiguous) — NOT a usable single-face portrait. Downloaded + visually inspected; rejected.
- Decision: **honest gap, no row inserted, no placeholder shipped.** She is seated in the DB (office row present from 1208); only her image is absent.

## Gates
| Gate | Expected | Actual |
|------|----------|--------|
| politician_images count (15 ext_ids) | 14 | 14 ✓ |
| uuid-embed post-verify (in-migration) | pass | passed (no exception) ✓ |
| ledger row '1209' | 0 (audit-only) | 0 ✓ |
| 0-stance baseline | 0 | 0 ✓ |
| Harrington image rows | 0 (gap) | 0 ✓ |
| CDN spot-checks (Jaimes/Carson/Kaufman) | 200 | 200 (44KB/70KB/101KB) ✓ |
| Kaufman center-crop visual | clean head-and-shoulders | confirmed (600×750, face centered, no clip) ✓ |

## Fixes applied
- **IN-01** — ETL `.env` parser strips `export ` + surrounding quotes.
- **WR-03** — every INSERT uses `FROM essentials.politicians p WHERE p.external_id = -N AND NOT EXISTS (...)` (skips on missing politician; never NULL politician_id).
- **New pattern** — `resolve_wp_media_large_url()` (WP REST `media_details.sizes.large.source_url`), validated for all 5 Sherwood sources; fly-images trap avoided.
- All 14 processed crop-4:5-first → 600×750 Lanczos q90; TTSD small circular sources upscaled with documented caveat (A5); Kaufman near-square center-cropped (A6).

## Outstanding
- The `.py` script is gitignored (never committed). Migration `1209...sql` applied to DB but **not yet committed to C:/EV-Accounts** (batching at phase end per operator).
- Handoff to plan 04: append 3 coverage.js entries, full E2E gate suite, ship frontend, Playwright browse of all 3 G5420 links.
