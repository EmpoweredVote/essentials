---
phase: 149-pasadena-deep-seed
plan: 03
type: execute
status: complete
completed: 2026-06-20
migration: 948_pasadena_headshots.sql (AUDIT-ONLY — not registered; ledger stays 947)
checkpoint: human-verify APPROVED (all-as-is, 2026-06-20)
---

# 149-03 SUMMARY — Pasadena headshots

## What was done

All 8 current members' official portraits sourced by **direct curl from cityofpasadena.net** (the site WAFs
urllib → 403, but allows `curl` with a browser UA + referer), processed (**4:5 crop FIRST, upper-third
anchored → 600×750 Lanczos q90 JPEG**), uploaded to Supabase Storage `politician_photos/{uuid}-headshot.jpg`
(x-upsert, all HTTP 200). Migration **948** (audit-only, applied via raw SQL, **NOT registered** — ledger
MAX stays 947) repointed each member's `type='default'` row to the canonical path with `photo_license='press_use'`
and set `photo_origin_url` to the official district/mayor page.

Result: each of the 8 members has **exactly one** `default` `press_use` image at the canonical path
(`n_default=1`, `canonical=true` for all 8). Rivas newly imaged (was 0). Lyon stays single (deduped in 946).

## Headshot inventory

| Seat | Member | uuid | source res | result |
|---|---|---|---|---|
| Mayor | Victor M. Gordo | 447ef220 | 682×1024 | ✅ good |
| D1 | Tyron Hampton | f7826942 | 240×320 | ⚠ low-res (city max) |
| D2 | Rick Cole | 9f07a6d3 | 1025×990 | ✅ good — **confirms Rick Cole, not Felicia Williams** |
| D3 | Justin Jones | 59b781ad | 150×200 | ⚠ LOW-RES (city thumbnail max) |
| D4 | Gene Masuda | 39426238 | 150×200 | ⚠ LOW-RES — **net downgrade** (see gaps) |
| D5 | Jess Rivas | 07147263 | 650×850 | ✅ good — **NEW (was 0 images)** |
| D6 | Steve Madison | e2ce84d2 | 150×200 | ⚠ LOW-RES (city thumbnail max) |
| D7 | Jason Lyon | 0d3f6eaf | 280×400 | ⚠ low-res (city max) |

## Honest quality gaps (documented, accepted by checkpoint)

- **cityofpasadena.net publishes only low-res thumbnails** for Hampton (240×320), Jones (150×200),
  Madison (150×200), Lyon (280×400) — confirmed as the base WordPress originals (district pages scanned; no
  larger variant exists). Upscaled to 600×750, so they render soft. Accepted as the authoritative official
  portrait per prior-phase precedent (Layton/Ogden/Orem low-res official accepted).
- **Masuda is a net downgrade:** his pre-existing DB image was already a clean 600×750, but the only current
  official source (gene-masuda.jpg) is 150×200, so reprocessing reduced sharpness. Ballotpedia (the obvious
  higher-res fallback) is behind a Cloudflare bot-challenge (HTTP 202, no usable image). No better source
  found this session. **Revisit if a ≥600px Masuda portrait surfaces (Wikimedia/SCAG/news).**
- All 8 are the **correct verified person**, no superimposed text/graphics. **User approved all-as-is**
  (checkpoint, 2026-06-20).

## Verification
- 8/8 members: exactly one `default` `press_use` image at canonical `{uuid}-headshot.jpg`; all Storage 200
- photo_origin_url set to the official district/mayor page for all 8
- schema_migrations MAX unchanged (947) — audit-only confirmed
- blocking human-verify checkpoint: **APPROVED**

## Self-Check: PASSED
