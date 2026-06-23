---
phase: 160-nevada-legislature-seed-headshots
plan: 02
status: complete
completed: 2026-06-23
requirements: [NV-LEG-01, NV-LEG-02]
migration: 1054
---

# Plan 160-02 Summary — NV Legislature headshots

**Goal achieved:** All 63 legislators have a 600×750 crop-to-4:5 headshot in the `politician_photos` bucket and a `politician_images` row (type='default'). **63/63 uploaded, 0 gaps.** Migration 1054 is audit-only (NOT registered); ledger MAX stays 1053.

## Pipeline run (inline orchestrator)
- Ran `python C:/EV-Accounts/backend/scripts/_tmp-nv-legislature-headshots.py` from the backend dir (reads `.env`). Python 3.14.3.
- Source: `archive.leg.state.nv.us/Session/84th2027/legislators/{Senators,Assembly}/Images/{Mangled}.{id}.jpg` (full-size, 3–6 MB originals).
- Per member: download → convert RGB → crop to 4:5 (top-crop, head retained) → resize 600×750 Lanczos → JPEG q90 optimize → Storage PUT `x-upsert` to `politician_photos/{uuid}-headshot.jpg`. UUIDs resolved at runtime by external_id.
- **Manifest: 63/63 SUCCESS, 0 FAILED.** No fallback (D-02) needed — all 63 primary archive URLs resolved.
- License: `us_government_work` for all (NV state-legislature official portraits).

## Migration 1054 (audit-only)
- `C:/EV-Accounts/backend/migrations/1054_nv_legislature_headshots.sql` — 63 idempotent `essentials.politician_images` INSERTs, columns exactly `(id, politician_id, url, type, photo_license)`, `type='default'`, `politician_id` via `external_id` subquery, NOT EXISTS guard on (politician_id, type='default'). No removed image-origin column; no ledger-registration line.
- Generated deterministically from the manifest external_id→UUID map, applied via psql (audit path) — `63 INSERT 0 1`.

## Verification
| Check | Expected | Actual |
|-------|----------|--------|
| politician_images for the 63 ext_ids (type='default') | 63 | **63** ✓ |
| distinct legislators with image | 63 | **63** ✓ |
| ledger MAX (1054 unregistered) | 1053 | **1053** ✓ |
| CDN spot-check (3 URLs) | HTTP 200 | **200** (66KB/73KB/61KB) ✓ |

## Deviations
None. All 63 primary URLs HTTP-200 as research predicted; no genuine gaps.

## Artifacts
- `C:/EV-Accounts/backend/scripts/_tmp-nv-legislature-headshots.py` (gitignored `_tmp-*`)
- `C:/EV-Accounts/backend/migrations/1054_nv_legislature_headshots.sql` (audit-only, committed)
- 63 × 600×750 JPEGs in `politician_photos` bucket
