# Plan 143-03 Summary — Santa Clarita Headshots

**Status:** ✅ Complete (human-verify checkpoint approved 2026-06-19)
**Wave:** 3
**Migration:** 896 (`C:/EV-Accounts/backend/migrations/896_santa_clarita_headshots.sql`) — **audit-only**, applied via raw SQL; NOT registered in `schema_migrations` (ledger MAX stays 895)
**Date:** 2026-06-19

## What was done

Sourced/processed official portraits from santaclarita.gov (WordPress CDN, HTTP 200) → crop to 4:5 → resize 600×750 Lanczos q90 JPEG → uploaded to Supabase Storage `politician_photos/{uuid}-headshot.jpg` → updated DB rows. Reseat context meant McLean/Miranda already had (poor, scraped) image rows, so 896 **UPDATEs** the existing single row per official rather than INSERTing (no duplicates).

| Official | Action | Result |
|----------|--------|--------|
| Marsha McLean (-201394) | Re-sourced (was scraped_no_license, old path, no origin) | 600×750 press_use, canonical path, origin set |
| Bill Miranda (-200980) | Re-sourced (was scraped_no_license, old path, no origin) | 600×750 press_use, canonical path, origin set |
| Laurene Weste (665693) | Re-sourced (was **empty** license, old path) | 600×750 press_use, canonical path |
| Patsy Ayala (665689) | License upgrade only (already canonical + santaclarita.gov origin) | press_use |
| Jason Gibbs (665692) | Untouched (already clean press_use canonical from Plan 01 dedupe) | press_use |
| Cameron Smyth (-700180) | None (retired) | 0 images (correct) |

All 3 re-sourced portraits visually verified (by Claude + user checkpoint): correct person, no superimposed text/graphics, eyes ~1/3 from top, head+shoulders, not stretched.

## Verification (all green)

| Check | Result |
|-------|--------|
| current officials (5) with exactly 1 type='default' image | 5/5 |
| all 5 licenses | press_use |
| all 5 canonical `{uuid}-headshot.jpg` path | true |
| all 5 photo_origin_url set | true |
| processed dimensions | 600×750 (all 3) |
| storage objects reachable | HTTP 200 image/jpeg |
| Smyth (-700180) images | 0 |
| schema_migrations MAX (896 not registered) | 895 |

## Deviations / notes

- **Scope expanded slightly beyond the 2 required (McLean/Miranda)** due to the reseat: also re-sourced Weste (empty-license defect) and upgraded Ayala's license, leaving all 5 consistent press_use canonical. Within plan's discretionary "optional quality pass."
- **Orphaned old storage objects** remain in the bucket for McLean/Miranda/Weste at their former `{uuid}/default.png|jpg` paths (DB no longer references them). Harmless; not deleted.

## key-files
- created: `C:/EV-Accounts/backend/migrations/896_santa_clarita_headshots.sql`

## Self-Check: PASSED

896 applied (audit-only, ledger untouched), full-roster image coverage clean (5/5 single press_use canonical), checkpoint approved. Ready for stances (Wave 4).
