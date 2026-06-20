---
phase: 148-torrance-deep-seed
plan: 03
wave: 3
status: complete
requirements: [TORR-01]
migrations: [938_torrance_headshots.sql]
note: AUDIT-ONLY — migration 938 NOT registered in schema_migrations; ledger MAX stays 937
checkpoint: human-verify APPROVED (2026-06-20)
---

# Phase 148 Wave 3 — Torrance Headshots — SUMMARY

**Outcome:** All 7 CURRENT Torrance members (ROSTER OVERRIDE — Chen seated Mayor incl.) have a single
canonical 600×750 `type='default'` `press_use` image at `politician_photos/{uuid}-headshot.jpg`, identity-
verified and human-approved. Migration **938** applied audit-only (ledger stays 937).

## Image coverage (final, all 7 = exactly one canonical default row)
| Member | ext_id | uuid | source | note |
|--------|--------|------|--------|------|
| George Chen (Mayor) | -201036 | 3dfd7349 | torranceca.gov council portrait | replaced old 250×320 cc_by_sa default.jpeg; license→press_use |
| Sharon Kalani | 683370 | 0695e308 | torranceca.gov council portrait | new row |
| Asam Sheikh | -201102 | 9ac3ac10 | scag.ca.gov (1920×2400, high-res) | resized; sharpest of the set |
| Jon Kaji | 683364 | e9af3b91 | torranceca.gov council portrait | new row |
| Bridgett Lewis | 683366 | 9e24181e | torranceca.gov council portrait | the REAL Lewis (not deleted Brigitte dup) |
| Jeremy Gerson | 683376 | d8767eea | torranceca.gov council portrait | new row |
| Aurelio Mattucci | -201103 | 2b4b35a8 | torranceca.gov council portrait | replaced old 200×200 'unknown'-license row |

## Deviation from RESEARCH (significant)
- **RESEARCH §7 "torranceca.gov NO WAF" is WRONG.** The site is Akamai WAF-403 for curl, WebFetch, AND
  PowerShell/SChannel — fully blocked to automated fetch. WebSearch was also down during this wave.
- Per a user checkpoint, the operator downloaded the 6 official council portraits in-browser. These were the
  **council-listing 150×150 official thumbnails**, Lanczos-upscaled to 600×750 4:5. Clean + correct but
  **soft** (comparable to existing live 200×200 portraits). Sheikh sourced high-res from his SCAG profile.
- All other automated alt-sources were too low-res (vote-usa.org 200×200) or absent (Ballotpedia/Wikipedia).
- Follow-up option: swap in full-res `/files/assets/city/v/...` versions later (also in-browser) for the 6 upscaled.

## Processing (per project memory)
- Crop to 4:5 FIRST (centered horizontally on the square thumbnails), then resize 600×750 Lanczos q90 JPEG.
- Uploaded to Storage politician_photos via SUPABASE_SERVICE_ROLE_KEY, x-upsert:true; all public URLs HTTP 200.
- No superimposed text/graphics; single person each; eyes ~1/3 from top.

## Post-verification — ALL GREEN
- Every member: exactly 1 type='default' row, press_use, canonical {uuid}-headshot.jpg url (0 members >1, 0 gaps)
- Bridgett Lewis (683366) shown — not the deleted Brigitte dup; Chen has canonical Mayor portrait
- photo_origin_url backfilled to torranceca.gov council page for Chen/Gerson/Lewis/Mattucci (Kaji/Kalani keep showpublishedimage origins; Sheikh keeps SCAG)
- Licenses honest: press_use for all (no cc_by_sa carried onto a press_use row — Chen's old cc_by_sa row's url+license were both replaced by the official city portrait)
- schema_migrations MAX unchanged (937); migration 938 not registered
- Human-verify checkpoint APPROVED
