# Plan 142-03 Summary — Long Beach Headshots

**Status:** ✅ Complete (human-verified)
**Wave:** 3
**Migration:** 880 (`C:/EV-Accounts/backend/migrations/880_long_beach_headshots.sql`) — **audit-only, NOT in ledger** (MAX(version) stays 879)
**Date:** 2026-06-19

## What was done

Gave the 4 new officials official 600×750 portraits and cleaned up the full roster's image licensing.

**New headshots (4):** downloaded from longbeach.gov globalassets CDN, cropped 4:5 (crop-only, no stretch), resized 600×750 Lanczos q90, uploaded to Supabase Storage `politician_photos/{uuid}-headshot.jpg`, inserted `politician_images` rows (`type='default'`, `photo_license='press_use'`), and backfilled `photo_origin_url`.

| Official | UUID | Source | Result |
|----------|------|--------|--------|
| Tunua Thrash-Ntuk (D8) | 61aa19c9 | 185×200 | upscaled 600×750 |
| Dawn McIntosh (City Attorney) | 769374f9 | 800×1000 | downscaled 600×750 (sharp) |
| Doug Haubert (City Prosecutor) | 2c36a446 | 185×200 | upscaled 600×750 |
| Laura Doud (City Auditor) | fe801750 | 185×200 | upscaled 600×750 |

**Human checkpoint:** User approved all 4 (correct person, clean crop, no overlays). The three 185×200 sources are the only resolution longbeach.gov publishes for those officials → upscaled 3.75× (slightly soft, consistent with prior gov-headshot upscale precedent).

**License cleanup (audit):** upgraded 6 existing officials from `scraped_no_license` → `press_use` after verifying each image's `photo_origin_url` is the official longbeach.gov CDN: Kerr, Uranga (the Wave-1 dedupe survivors), plus Zendejas, Duggan, Saro, Ricks-Oddie.

## Verification (all green)

| Check | Result |
|-------|--------|
| new officials with type='default' image | 4 |
| roster officials missing an image | 0 |
| officials with >1 type='default' image | 0 |
| full roster total | 13 |
| roster images on press_use | 12 / 13 |
| schema_migrations MAX (audit-only) | 879 (unchanged) |
| all 4 public Storage URLs | HTTP 200 |

## Deviations / notes

- **Rex Richardson (-200813) left on `scraped_no_license`** — his image `photo_origin_url` is NULL, so the source is unverified; claiming press_use would be dishonest. He HAS an image (no coverage gap) — only the license provenance is unknown. Minor pre-existing item; could be resolved later by sourcing his portrait from longbeach.gov/mayor.
- The 3 upscaled portraits could be re-sourced if longbeach.gov ever publishes higher-resolution versions.

## key-files
- created: `C:/EV-Accounts/backend/migrations/880_long_beach_headshots.sql`

## Self-Check: PASSED

13/13 roster image coverage, single image each, 4 new portraits human-verified, 12/13 press_use (1 honest license gap), ledger preserved. Ready for stances (Wave 4).
