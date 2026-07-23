---
phase: 109-ma-tier-2-cities
plan: "06"
subsystem: headshots
tags: [headshots, worcester, springfield, lowell, brockton, quincy, ma-tier2, politician_images]
dependency_graph:
  requires: ["109-01", "109-02", "109-03", "109-04", "109-05"]
  provides: ["headshots-47-ma-tier2-officials"]
  affects: ["essentials.politician_images", "politician_photos bucket"]
tech_stack:
  added: []
  patterns: ["Pillow crop_to_4_5 then resize 600x750 Lanczos q90", "Supabase Storage upsert via REST PUT", "psycopg2 parameterized inserts with WHERE NOT EXISTS", "CivicPlus ImageRepository doc IDs", "TYPO3 _processed_ image URLs", "WordPress wp-content uploads pattern"]
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-ma-tier2-headshots.py
    - C:/EV-Accounts/backend/migrations/356_ma_tier2_headshots.sql
    - .planning/phases/109-ma-tier-2-cities/109-06-SUMMARY.md
  modified: []
decisions:
  - "Quincy all-GAP: quincyma.gov (Revize CMS) has zero headshot photos for any council member; 10 Quincy officials documented as gaps per Tier 2 best-effort standard"
  - "Lowell City Manager Golden GAP: lowellma.gov/198/City-Manager is text-only with no unique image doc ID"
  - "Brockton Lally GAP: Jack-Lally-200x200-1.png returns HTTP 403 (photo still hosted but not accessible)"
  - "Springfield _processed_ URLs accepted: TYPO3 cache URLs verified 200 at time of execution; stable enough for Tier 2"
  - "Lowell photos via CivicPlus ImageRepository doc IDs: unique per-page doc IDs resolved by visiting individual member pages"
metrics:
  duration: "60m"
  completed: "2026-06-10"
  tasks: 2
  files: 2
---

# Phase 109 Plan 06: MA Tier 2 Headshots Summary

Best-effort headshot upload for 59 MA Tier 2 officials across 5 cities: 47/59 uploaded to politician_photos bucket at 600x750 (crop-4:5-first), all with type='default' politician_images rows; 12 documented gaps (Quincy all-10, Lowell Golden, Brockton Lally).

## Tasks Completed

| Task | Name | Files | Result |
|------|------|-------|--------|
| 1 | Write headshot upload script | _tmp-ma-tier2-headshots.py | Done — 59 officials across 5 cities, crop+resize pipeline, parameterized inserts |
| 2 | Run script + write + apply migration 356 | 356_ma_tier2_headshots.sql | Done — 47/59 uploaded; migration applied, ledger '356' present |

## Upload Results

| City | Uploaded | Total | Gap Count | Notes |
|------|----------|-------|-----------|-------|
| Worcester | 11 | 11 | 0 | All via `-headshot.jpg` pattern (800x1200 source, top-cropped) |
| Springfield | 14 | 14 | 0 | TYPO3 `_processed_` URLs, all verified 200 |
| Lowell | 11 | 12 | 1 | CivicPlus doc IDs; Golden (City Manager) has no photo |
| Brockton | 11 | 12 | 1 | WordPress wp-content; Lally returns HTTP 403 |
| Quincy | 0 | 10 | 10 | quincyma.gov text-only; no headshots posted for new Jan 2026 council |
| **Total** | **47** | **59** | **12** | |

## Documented Gaps (12)

| external_id | Name | City | Reason |
|-------------|------|------|--------|
| -253700001 | Thomas A. Golden, Jr. | Lowell | No photo on lowellma.gov City Manager page |
| -250900007 | John Lally | Brockton | HTTP 403 from brockton.ma.us (photo not accessible) |
| -255574501 | Thomas P. Koch | Quincy | quincyma.gov text-only — no photos posted |
| -255574502 | David Jacobs | Quincy | quincyma.gov text-only |
| -255574503 | Richard Ash | Quincy | quincyma.gov text-only |
| -255574504 | Walter Hubley | Quincy | quincyma.gov text-only |
| -255574505 | Virginia Ryan | Quincy | quincyma.gov text-only |
| -255574506 | Maggie McKee | Quincy | quincyma.gov text-only |
| -255574507 | Deborah Riley | Quincy | quincyma.gov text-only |
| -255574508 | Noel DiBona | Quincy | quincyma.gov text-only |
| -255574509 | Anne Mahoney | Quincy | quincyma.gov text-only |
| -255574510 | Ziqiang Yuan | Quincy | quincyma.gov text-only (new Jan 2026 council) |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written. All gaps are as expected per Tier 2 best-effort standard.

### Accepted Gaps (Tier 2 Best-Effort)

**1. Quincy — 10/10 GAPs (entire city)**
- Found during: Task 1 (URL inspection)
- Issue: quincyma.gov (Revize CMS) has no headshot images on any council member page; text-only bios
- Fix: Documented as gaps per plan's Tier 2 best-effort standard; noted as "new Jan 2026 council" in comments
- Action required: None (acceptable per MA-TIER2-02 best-effort standard)

**2. Brockton Lally — HTTP 403**
- Found during: Task 2 (script run)
- Issue: wp-content PNG returns 403; photo exists in CMS but not publicly accessible
- Fix: Documented as gap with HTTP 403 reason
- Action required: None (best-effort)

**3. Lowell City Manager Golden — no photo**
- Found during: Task 1 (URL inspection)
- Issue: City Manager page on lowellma.gov has no ImageRepository doc IDs unique to the page; text-only
- Fix: Documented as gap with explanation
- Action required: None (best-effort)

## Known Stubs

None — all 47 uploaded officials have live CDN URLs in politician_images.

## Threat Flags

None. All uploads are from official .gov / .ma.us domains. Only re-encoded JPEG output uploaded (raw source bytes discarded per T-109-18).

## Self-Check: PASSED

- [x] Script file exists: C:/EV-Accounts/backend/scripts/_tmp-ma-tier2-headshots.py
- [x] Migration file exists: C:/EV-Accounts/backend/migrations/356_ma_tier2_headshots.sql
- [x] Script verification (node check): OK — crop, 600x750, parameterized, roster spans Worcester..Quincy
- [x] Migration verification (node check): OK — default type, url column, ledger
- [x] politician_images rows in DB: 47 (verified via SELECT COUNT query)
- [x] Ledger version '356': PRESENT
