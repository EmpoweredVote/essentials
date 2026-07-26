---
phase: 192-arizona-legislature-seed-headshots
plan: 02
status: complete
completed: 2026-07-09
requirements: [AZ-LEG-01]
migration: "1287_az_legislature_headshots.sql"
migration_registered: false
---

# 192-02 Summary — 90/90 Legislator Headshots

## What was built

- **`C:/EV-Accounts/backend/scripts/_tmp-az-legislature-headshots.py`** (gitignored, uncommitted) —
  the azleg.gov headshot pipeline: 90-member ROSTER (30 Senate + 60 House) → per-member fetch from
  `azleg.gov/alisImages/MemberPhotos/57leg/{Senate|House}/{SURNAME}.jpg` → `crop_to_4_5` (crop-first,
  never distort) → `resize_600x750` (Lanczos q90) → `convert('RGB')` + JPEG `optimize=True` (strips
  EXIF/embedded payloads) → `upload_to_storage` (x-upsert) to the `politician_photos` bucket.
  Percent-encodes the 4 accented surnames; resolves `politician_id` at runtime via parameterized
  `external_id=%s`; excludes the 3 departed members; `sys.exit(1)` on any required-member failure.
- **`C:/EV-Accounts/backend/migrations/1287_az_legislature_headshots.sql`** (audit-only, UNregistered)
  — 90 idempotent `INSERT INTO essentials.politician_images (id, politician_id, url, type,
  photo_license)` rows bound to the Plan 01 UUIDs; commit `7b4a8a13` in the `C:/EV-Accounts` repo.

## Verification (production)

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Pipeline dry-run HEAD (90 URLs) | all 200 | 90 × 200, 0 non-OK | ✅ |
| Pipeline upload result | 90/90, 0 gaps | `90/90 uploaded, 0 gaps` (exit 0) | ✅ |
| `politician_images` for 90 AZ-leg ext_ids | 90 | 90 | ✅ |
| Migration 1287 ledger registration | 0 (unregistered) | 0 | ✅ |
| CDN HTTP (Sears SD-9, Reim HD-3, Allen HD-7) | 200 | 200 / 200 / 200 | ✅ |
| CDN HTTP (Peña, Gabaldón — accented) | 200 | 200 / 200 | ✅ |
| PIL dimension (Sears + Peña sample) | 600×750 | (600, 750) / (600, 750) | ✅ |
| Departed members (Chaplik/Marshall/Burch) uploaded | none | none (roster-only fetch) | ✅ |

Operator-supplied exceptions: **0** (research's 90/90 azleg.gov coverage held — no fallback needed).

## Final manifest

All 90 images follow the deterministic pattern:
`{external_id} → {UUID} → https://kxsdzaojfaibhuzmclfq.storage.supabase.co/storage/v1/object/public/politician_photos/{UUID}-headshot.jpg`

The 90 `external_id → UUID` rows are recorded in **192-01-SUMMARY.md** (§ 90 Politician UUID Manifest);
every CDN url is `{CDN_BASE}/{that UUID}-headshot.jpg`. Notable:
- Appointees: Sears `fef8eb85…` (SD-9), Reim `85937da6…` (HD-3), Allen `9f5a84e0…` (HD-7).
- Accented: Peña `81b3d4cc…`, Luna-Nájera `8d470040…`, Márquez `0df9cd85…`, Gabaldón `8cbc6c91…`.

## Self-Check: PASSED
