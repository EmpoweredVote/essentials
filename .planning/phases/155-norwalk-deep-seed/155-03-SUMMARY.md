# Phase 155 Wave 3 (155-03) — SUMMARY

**Plan:** 155-03 (headshots) · **Wave:** 3 · **Status:** ✅ Complete (operator approved 2026-06-22)
**Migration:** `1036_norwalk_headshots.sql` (AUDIT-ONLY — NOT registered; ledger stays 1035) — applied live + committed to EV-Accounts
**Requirement:** NRWK-01

## Self-Check: PASSED (pending human checkpoint)

## Task 1 — headshot pre-flight

All 5 had exactly 1 existing default image → all UPDATE (0 greenfield). Two storage layouts found:
- **Ayala, Perez:** already canonical `{uuid}-headshot.jpg` (press_use), but photo_origin_url pointed at **norwalk.org** → re-pointed to norwalkca.gov (Pitfall 6).
- **Valencia, Rios, Ramirez:** OLD scraped path `politician_photos/la_county/cities/norwalk/{name}.jpg` (scraped_no_license, NULL origin) → migrated to canonical + press_use.
Canonical Storage host confirmed: `kxsdzaojfaibhuzmclfq.storage.supabase.co`.

## Task 2 — source + process + upload + 1036

All 5 fetched from norwalkca.gov Revize (NO WAF, `curl -L`, HTTP 200, exact expected byte sizes). **Ramirez** used the corrected `RR - Digital Images - Copy.jpg` (old `638169002126970000.jpg` 404s). **Rios** used the `%20%20` double-space folder path. 4 sources were already 480×600 (4:5 → resize); **Valencia** 400×600 → 4:5 top-biased crop then resize. All processed 4:5 → 600×750 Lanczos q90, uploaded x-upsert to `politician_photos/{uuid}-headshot.jpg`. Visually inspected — all 5 are distinct, correct-person, head+shoulders, no superimposed text/graphics (sourced from each member's own named norwalkca.gov folder).

## Post-apply acceptance (all PASS)

| Official | ext_id | n_default | license | canonical url | origin norwalkca | Storage HTTP |
|---|---|---|---|---|---|---|
| Jennifer Perez (Mayor) | 666845 | 1 | press_use | ✅ | ✅ | 200 |
| Margarita L. Rios (VM) | -201328 | 1 | press_use | ✅ | ✅ (`%20%20`) | 200 |
| Tony Ayala | -200876 | 1 | press_use | ✅ | ✅ | 200 |
| Rick Ramirez | -201327 | 1 | press_use | ✅ (replaced 404 URL) | ✅ (corrected) | 200 |
| Ana Valencia | -201329 | 1 | press_use | ✅ | ✅ | 200 |

Ledger unchanged (1035). File committed to EV-Accounts.

## Per-official source URLs (photo_origin_url)
- Perez: `…/Jennifer Perez/JP - Digital Images - Copy.jpg?t=202512101807300`
- Rios: `…/Margarita%20%20Rios/MR - Digital Images - Copy.jpg?t=202512101808020`
- Ayala: `…/Tony Ayala/TA - Digital Images - Copy.jpg?t=202508201329270`
- Ramirez: `…/Rick Ramirez/RR - Digital Images - Copy.jpg?t=202508201332230` (corrected)
- Valencia: `…/Ana Valencia/AV - Digital Images - Copy.jpg?t=202508201340330`

## Deviations
- DB image state differed from plan's "all canonical" assumption: 3 of 5 were on the old scraped path. Migrated all to canonical (no behavior change to the plan's intent — verify-and-fix all 5).
- No honest gaps — all 5 have an official portrait.

## Checkpoint
Blocking human-verify checkpoint — operator **approved** 2026-06-22.
