---
phase: 154-burbank-deep-seed
plan: 03
subsystem: database
tags: [supabase, sql, migration, burbank, headshots, storage, audit-only, wrong-person-guard]

requires:
  - phase: 154-burbank-deep-seed plan-02
    provides: final 5-member roster with rotational Mayor/Vice Mayor titles; resolved pol UUIDs
  - phase: 153-inglewood-deep-seed
    provides: audit-only headshots migration template (1020); UPDATE-existing + greenfield-INSERT mix

provides:
  - "All 5 current Burbank officials have exactly one type='default' headshot at canonical politician_photos/{uuid}-headshot.jpg"
  - "Rizzotti + Takahashi 0-image gaps filled from Dec 2025 official burbankca.gov portraits"
  - "Perez/Anthony/Mullins existing images replaced (old la_county/cities/burbank scraped_no_license path → canonical press_use)"
  - "photo_origin_url backfilled on all 5 politicians (burbankca.gov adaptive-media source)"
  - "migration 1028 applied audit-only (NOT registered; ledger stays 1027); file committed to EV-Accounts"

affects: [154-04-burbank-stances]

tech-stack:
  added: []
  patterns:
    - "burbankca.gov Liferay adaptive-media: WebFetch 403, curl WITH Chrome UA returns HTTP 200"
    - "Crop 4:5 FIRST then resize 600x750 Lanczos q90 (never stretch)"
    - "Canonical Storage host = kxsdzaojfaibhuzmclfq.storage.supabase.co (.storage. form, matches existing rows)"
    - "Wrong-person guard + Mullins council-vs-clerk special check at blocking human-verify checkpoint"
    - "photo_origin_url lives on essentials.politicians, not politician_images"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1028_burbank_headshots.sql"
  modified: []

key-decisions:
  - "All 3 existing images (Perez/Anthony/Mullins) were stale la_county/cities/burbank/ scraped_no_license URLs — replaced with canonical {uuid}-headshot.jpg at press_use"
  - "Mullins special check PASSED: Dec 2024 portrait (3176813) is a council-member headshot (red blazer, blue background), NOT a stale City-Clerk image"
  - "All 5 wrong-person checks PASSED: each portrait is the actual Burbank official, no name-collision, no superimposed text"
  - "Audit-only migration 1028 NOT registered in schema_migrations — ledger stays 1027 per deep-seed convention"

patterns-established:
  - "1028 is the reference for verify-and-fix-existing + fill-gaps headshots with Chrome-UA-required source"

requirements-completed: [BURB-01]

duration: 11min
completed: 2026-06-22
---

# Phase 154 Plan 03: Burbank Headshots Summary

**All 5 current Burbank officials given a clean, correct, 600×750 official portrait (3 verify-and-fixed, 2 gaps filled) sourced from burbankca.gov via Chrome-UA curl; migration 1028 applied audit-only. Operator-approved at the blocking human-verify checkpoint.**

## Pre-Flight Findings Block (Task 1)

Entering image state: Perez/Anthony/Mullins each had 1 existing image on the old `la_county/cities/burbank/` path with `scraped_no_license`; Rizzotti and Takahashi had 0 images. Plan: 3 UPDATE (replace stale URL → canonical, press_use) + 2 greenfield INSERT. Canonical Storage host confirmed against existing rows = `kxsdzaojfaibhuzmclfq.storage.supabase.co` (`.storage.` form).

## Wrong-Person Guard Results (all 5 PASSED)

| Official | Role | Source fileEntryId | Portrait date | Plan | Check |
|----------|------|--------------------|---------------|------|-------|
| Tamala Takahashi | Mayor | 3949213 | Dec 8 2025 | INSERT (gap) | PASS |
| Christopher John Rizzotti | Council Member | 3940848 | Dec 15 2025 | INSERT (gap) | PASS |
| Zizette Mullins | Vice Mayor | 3176813 | Dec 23 2024 | UPDATE | PASS — council portrait, NOT City Clerk |
| Konstantine Anthony | Council Member | 2161825 | Dec 19 2022 | UPDATE | PASS |
| Nikki Perez | Council Member | 2168721 | Dec 22 2022 | UPDATE | PASS |

**Mullins special check:** Dec 2024 portrait (`20241223-zizette-mullins-portrait-002.jpg`) confirmed a professional council-member headshot (red blazer, blue background) — not a stale City Clerk image. PASS.

## Post-Apply Acceptance Assertions (all PASS — orchestrator-verified via MCP)

| Assertion | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Each of 5 officials has exactly 1 type='default' image | n=1 ×5 | n=1 ×5 | PASS |
| Rizzotti + Takahashi gaps filled | 1 each | 1 each | PASS |
| All 5 URLs canonical politician_photos/{uuid}-headshot.jpg | yes | yes | PASS |
| All 5 photo_license | press_use | press_use | PASS |
| photo_origin_url set on all 5 (adaptive-media) | non-NULL ×5 | non-NULL ×5 | PASS |
| Images 600×750 (4:5, Lanczos q90) | yes | yes | PASS |
| Ledger unchanged (1028 NOT registered) | 1027 | 1027 | PASS |

## Task Commits

1. **Task 1: Headshot pre-flight** — read-only; findings documented above
2. **Task 2: Source + process + upload + author/apply/commit 1028** — `12f7d993` (feat) in EV-Accounts repo
3. **Task 3: Blocking human-verify checkpoint** — operator typed "approved" 2026-06-22

## Deviations from Plan

None on substance. The 3 "existing" images turned out to be stale low-quality `scraped_no_license` URLs rather than already-canonical rows, so all 3 were effectively replaced (URL + license) rather than lightly touched — within the verify-and-fix mandate.

## Next Phase Readiness

Wave 3 headshots complete and operator-approved. Browse view renders all 5 with photos.

- Browse link: `https://essentials.empowered.vote/results?browse_geo_id=0608954&browse_mtfcc=G4110`
- Wave 4 (Plan 04): evidence-only compass stances, greenfield all 5, one agent at a time (Anthony → Perez → Takahashi → Mullins → Rizzotti); migrations 1029–1033 audit-only.

## Threat Flags

- T-154-09 (wrong-person headshot): MITIGATED — all 5 visually verified + operator-approved
- T-154-10 (Mullins stale City-Clerk image): MITIGATED — confirmed council portrait
- T-154-11 (duplicate image row on INSERT): MITIGATED — guarded NOT EXISTS; exactly 1 per member
- T-154-12 (missing photo_origin_url): MITIGATED — all 5 backfilled

---
*Phase: 154-burbank-deep-seed*
*Completed: 2026-06-22*
