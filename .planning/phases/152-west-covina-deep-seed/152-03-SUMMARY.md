# 152-03 SUMMARY — West Covina Headshots (Wave 3)

**Status:** ✅ Complete (operator-approved at blocking checkpoint 2026-06-21)
**Requirement:** WCOV-01
**Migration:** 1012_west_covina_headshots.sql (AUDIT-ONLY — NOT registered; ledger stays 1011; committed to EV-Accounts `0c70c134`)
**Date:** 2026-06-21

## Outcome — all 5 members have one verified 600×750 `type='default'` image
| Seat | Member | Source | KEEP/RE-SOURCE | License |
|---|---|---|---|---|
| D1 | Brian Gutierrez | city documentID 1053 | **RE-SOURCED (wrong-person fix)** | press_use |
| D2 | Letty Lopez-Viado (Mayor) | city documentID 1054 | re-cropped 600×750 | press_use |
| D3 | Rosario Diaz | city documentID 1056 | re-cropped 600×750 | press_use |
| D4 | Ollie Cantos (Mayor Pro Tem) | **operator-supplied** | re-sourced (city only had full-body) | fair_use |
| D5 | Tony Wu | city documentID 1055 | re-cropped 600×750 | press_use |

## Key findings
- **⚠ Wrong-person defect caught (D1 Gutierrez):** the stored image was **Brian Gutiérrez the Chicago Fire MLS soccer player** (name collision, `cc_by_sa_4.0` — scraped from Wikimedia). Replaced with the real West Covina councilman from the official city portrait (documentID 1053). This is the most important catch of the wave.
- **Cantos (D4):** West Covina's CMS only had a low-res **full-body** shot (head ~34px) — unusable as a headshot. Operator supplied a head-and-shoulders portrait (`C:\tmp\govheadshots\Ollie-Cantos_Covina.png`, 600×900), cropped to 600×750. `photo_origin_url` cleared (no canonical source URL); license `fair_use`.
- **Resolution caveat (operator-approved):** the 4 city portraits are upscaled from ~150×190 CivicEngage thumbnails — correct identity + clean 4:5 framing, but acceptably **soft**. West Covina serves no higher-res. NO WAF (direct curl worked for all 5).

## Processing / upload
- Each: convert RGB → crop 4:5 (eyes ~1/3 from top) → resize 600×750 Lanczos q90 JPEG → upload to `politician_photos/{uuid}-headshot.jpg` (x-upsert). All public-fetch HTTP 200 at 600×750.

## Verification (all green)
- 5/5 members exactly one `type='default'` row at canonical `{uuid}-headshot.jpg` ✓ · no member >1 ✓
- correct person each (visually verified + operator-approved) ✓ · no overlays ✓ · 600×750 4:5 ✓
- schema_migrations MAX unchanged — 1012 NOT registered (1010/1011 are; audit-only correct) ✓
- migration 1012 committed to EV-Accounts ✓

## Handoff to Plan 04 (Wave 4 — Stances)
- All 5 = 0 stances → full greenfield. Evidence-only CHAIRS, 100% citation, no defaults, NO judicial topics, ONE research agent at a time.
- Diaz/Gutierrez (elected Nov 2024) likely thin records → honest blanks expected. Wu/Cantos richer.
- Stance migrations are audit-only (not registered); next file numbers 1013+.
