---
phase: 161-clark-county-commission-deep-seed
plan: 02
status: complete
completed: 2026-06-23
requirements: [CLARK-01]
migration: 1056
---

# Plan 161-02 Summary — Clark County headshots + coverage surfacing

**Goal achieved:** All 7 commissioners have a 600×750 crop-to-4:5 headshot in `politician_photos` + a `politician_images` row (type='default'). Clark County added to coverage.js COVERAGE_COUNTIES (purple chip). **7/7 uploaded, 0 gaps.** Migration 1056 audit-only (NOT registered); ledger MAX stays 1055.

## Pipeline run (inline orchestrator)
- Ran `_tmp-clark-county-commission-headshots.py`. Source: clarkcountynv.gov AEM `/original/as/` portraits (175×175 squares) → crop 4:5 (140×175) → resize 600×750 Lanczos q90 (~4.3× upscale, Pasadena precedent) → Storage upsert. UUIDs resolved at runtime by external_id.
- **Manifest: 7/7 SUCCESS, 0 FAILED.** No Wikimedia fallback needed. license `us_government_work` for all 7 (county source kept as primary; Kirkpatrick Wikimedia-primary left as an unused commented switch).

## Migration 1056 (audit-only)
- `C:/EV-Accounts/backend/migrations/1056_clark_county_commission_headshots.sql` — 7 idempotent `essentials.politician_images` INSERTs, columns exactly (id, politician_id, url, type, photo_license), type='default', external_id subquery, NOT EXISTS guard, no image-origin column, no ledger registration. Generated from the manifest UUID map; applied via psql → `7 INSERT 0 1`.

## coverage.js (essentials repo)
- Added `{ label: 'Clark County', browseGovernmentList: ['32003'], browseStateAbbrev: 'NV', hasContext: true }` to COVERAGE_COUNTIES after the Weber County entry. No COVERAGE_STATES change; county-branch logic untouched.

## Verification
| Check | Expected | Actual |
|-------|----------|--------|
| politician_images for the 7 (type='default') | 7 | **7** ✓ |
| ledger MAX (1056 unregistered) | 1055 | **1055** (1056 not registered) ✓ |
| CDN spot-check (3 URLs) | 200 | **200** (52KB/40KB/45KB) ✓ |
| coverage.js Clark County entry | present | hasContext:true, ['32003'] ✓ |

## Note
Source portraits are low-res 175×175 (upscaled to 600×750). Acceptable per precedent; correct-person/quality confirmed at the Plan 03 human-verify checkpoint.

## Artifacts
- `C:/EV-Accounts/backend/scripts/_tmp-clark-county-commission-headshots.py` (gitignored)
- `C:/EV-Accounts/backend/migrations/1056_clark_county_commission_headshots.sql` (audit-only)
- `src/lib/coverage.js` (COVERAGE_COUNTIES Clark County entry)
- 7 × 600×750 JPEGs in politician_photos
