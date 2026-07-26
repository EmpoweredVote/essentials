# 202-03 Summary — Palm Springs Councilmember Headshots

**Plan:** 202-03 | **Wave:** 3 | **Status:** ✅ Complete | **Date:** 2026-07-12

## What was built
Authored the headshot ETL pipeline `C:/EV-Accounts/backend/scripts/_tmp-palmsprings-headshots.py` (gitignored, orchestrator-run) and the audit-only migration `1330_palm_springs_headshots.sql`. All 5 councilmembers now have a 600×750 (4:5 crop-first, Lanczos q90) headshot in the `politician_photos` Storage bucket, bound via `politician_images` rows (`type='default'`).

## Sourcing (palmspringsca.gov WAF-403 avoided; per-member campaign/press)
Ballotpedia coverage was thin (no S3 hits), so all 5 came from campaign sites + press. Because several sources were full-body / landscape / group shots, naive center-crop would have mis-framed them — each member got an explicit **face-aware crop box** (validated via a local contact-sheet QA and an operator-approved review artifact) instead of the naive `crop_to_4_5` fallback.

| ext_id | member | title | source | note |
|--------|--------|-------|--------|------|
| -4011001 | Grace Elena Garner | Councilmember | wewinwithgrace.com `Grace-Garner-2026.jpg` | rejected `about-grace.png` (purple group photo w/ seal graphic) |
| -4011002 | Jeffrey Bernstein | Councilmember | jeffreyforps.com (Wix asset) | outdoor 3/4 portrait |
| -4011003 | Ron deHarte | Councilmember | rondeharte.com (Wix asset) | transparent PNG → white-composited |
| -4011004 | Naomi Soto | Mayor | naomisoto.com (Squarespace asset) | three-quarter portrait |
| -4011005 | David H. Ready | Mayor Pro Tem | kesq.b-cdn.net original | right-crop excludes KESQ chevron graphic |

## Production result (blocking visual-QA gate — operator approved via review artifact)
- Pipeline: 5/5 uploaded, 0 gaps. All CDN URLs HTTP 200 (image/jpeg).
- `politician_images`: 5 rows, all `type='default'`, all `photo_license='press_use'`, all bound by external_id→UUID (manifest from 202-02).

## Photo license rationale
All 5 are publicly-distributed campaign/press promotional portraits — none `.gov` (so never `us_government_work`), none Wikimedia. `press_use` is the honest label per project convention.

## Manifest (UUID → Storage URL)
- -4011001 Garner → `.../13979c8e-df26-4d07-918e-e064fce6dc53-headshot.jpg`
- -4011002 Bernstein → `.../befbbea4-9e33-4f37-9745-c7184e824d48-headshot.jpg`
- -4011003 deHarte → `.../24ba9d44-a972-4125-b370-380b457a226c-headshot.jpg`
- -4011004 Soto → `.../d76aaa6c-b6a1-42f4-8b12-67cd523c4cf7-headshot.jpg`
- -4011005 Ready → `.../59c2f45b-5369-4db0-936b-df94a57527c9-headshot.jpg`

(CDN base: `https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/`)

## Notes
- `_tmp-palmsprings-headshots.py` confirmed gitignored (never committed). Migration 1330 committed to `C:/EV-Accounts` @ `4964005a`.
- Pipeline extended with a `crop_box` per-member override (face-aware); `crop_to_4_5` retained as fallback.
