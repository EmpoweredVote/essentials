---
phase: 178-city-of-tigard-deep-seed
plan: 03
subsystem: database
tags: [headshots, supabase-storage, tigardlife, oregon, tigard]

# Dependency graph
requires:
  - phase: 178-city-of-tigard-deep-seed
    plan: 02
    provides: 7 seated Tigard politicians with minted UUIDs (resolved at runtime by external_id)
provides:
  - 7/7 Tigard officials with 600x750 headshots in Supabase Storage (politician_photos/{uuid}-headshot.jpg)
  - 7 politician_images rows (type='default', photo_license='press_use') via audit-only migration 1160
affects: [178-05-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "No-bulk-portal city: per-official tigardlife.com candidate-profile/article portraits — the 2024 election profile pages (tigardlife.com/local-news/<name>-2/) carry clean individual portraits for every recent candidate"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-tigard-headshots.py
    - C:/EV-Accounts/backend/migrations/1160_tigard_headshots.sql
  modified: []

key-decisions:
  - "7/7 found (better than the acceptable 5-7 partial): all from tigardlife.com (press_use)"
  - "Hu's Oct-2025 Mayor's Corner image REJECTED (text-overlay graphic banner); used his clean 2022 candidate-profile portrait instead (2022/09/Yi-Kang-Hu.jpg, 509x815)"
  - "Wolf's source filename is genuinely misspelled 'Mareen-Wolf.jpg' on tigardlife's CDN — recorded so nobody 'fixes' it into a 404"
  - "Shaw upgraded from the RESEARCH 696x462 variant to the full-size 1024x680 original"
  - "Committed in EV-Accounts repo as 837564d5 (master); _tmp .py NOT committed (gitignored)"

patterns-established:
  - "Pillarbox check: tigardlife 2024 candidate photos are 1024x680 with soft side margins — verified the centered 4:5 crop window stays inside photo content before running the pipeline"

requirements-completed: []

# Metrics
duration: 12min
completed: 2026-07-02
---

# Phase 178 Plan 03: Tigard Headshots Summary

**All 7 Tigard officials now have clean 600×750 tigardlife.com-sourced headshots uploaded to Supabase Storage and recorded via audit-only migration 1160 — no gaps needed despite Tigard having no bulk portal.**

## Per-official sources (all press_use, all verified correct person, no overlays)

| Official | Source | Notes |
|----------|--------|-------|
| Yi-Kang Hu | tigardlife.com/wp-content/uploads/2022/09/Yi-Kang-Hu.jpg | 2022 candidate profile; Mayor's Corner graphic rejected (text overlay) |
| Tom Anderson | tigardlife.com/wp-content/uploads/2026/01/93-Councilor-Tom-Anderson-WEB.jpg | Jan-2026 interim-appointment article (1536×1020) |
| Faraz Ghoddusi | tigardlife.com/wp-content/uploads/2024/09/Faraz-Ghoddusi.jpg | 2024 candidate profile |
| Heather Robbins | tigardlife.com/wp-content/uploads/2024/09/Heather-Robbins.jpg | 2024 candidate profile |
| Jake Schlack | tigardlife.com/wp-content/uploads/2024/09/Jake-Schlack.jpg | 2024 candidate profile |
| Jeanette Shaw | tigardlife.com/wp-content/uploads/2024/09/Jeanette-Shaw.jpg | full-size original (research variant kept as fallback) |
| Maureen Wolf | tigardlife.com/wp-content/uploads/2024/09/Mareen-Wolf.jpg | filename misspelled on source CDN (genuine) |

## Accomplishments
- Authored the pipeline script (Hillsboro template: runtime UUID resolution via psycopg2, crop-4:5-FIRST then 600×750 Lanczos q90, white-composite, test-download guard, no len==7 hard-assert)
- Orchestrator searched per-official, visually verified all 7 source portraits (correct person, no text/graphics), verified crop windows clear the source pillarbox margins
- Pipeline ran 7/7 SUCCESS; all CDN URLs return HTTP 200; spot-checked processed Hu + Wolf at 600×750 with correct framing
- Applied audit-only migration 1160 (7 politician_images INSERTs, WHERE NOT EXISTS guards, no ledger row); verified count = 7
- Committed migration in EV-Accounts as 837564d5

## Task Commits

1. **Task 1: Pipeline script** - N/A (gitignored _tmp-* helper)
2. **Task 2: Audit migration** - EV-Accounts commit 837564d5
3. **Task 3: Orchestrator run + verify + commit** - checkpoint resolved (7/7, no gaps)

## Deviations from Plan

- Hu's plan-suggested sources (mayoral-appointment coverage) yielded only a text-overlay graphic and a speaking photo; his 2022 tigardlife candidate profile provided the clean portrait. Within the plan's per-official-search contingency.
- 7/7 outcome exceeded the expected partial (5–7) coverage.

## Issues Encountered

None — no WAF blocks hit (tigard-or.gov never fetched; tigardlife.com serves images with a descriptive UA).

## Next Phase Readiness
- Plan 05 live-browse verification can expect headshots on all 7 profiles.

---
*Phase: 178-city-of-tigard-deep-seed*
*Completed: 2026-07-02*
