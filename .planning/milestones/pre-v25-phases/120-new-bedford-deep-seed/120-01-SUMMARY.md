---
plan: 120-01
phase: 120-new-bedford-deep-seed
status: complete
completed: "2026-06-14"
duration: ~15m
tasks_completed: 1
files_created: 1
---

# Plan 120-01 Summary: New Bedford City Government Seed

## What Was Built

Migration 587 seeded the City of New Bedford, Massachusetts city government:
- 1 government row: 'City of New Bedford, Massachusetts, US'
- 1 chamber: 'New Bedford City Council'
- 2 districts: LOCAL_EXEC (Mayor) + LOCAL (all 11 councilors)
- 12 politicians: Mayor Jon Mitchell + 5 at-large + 6 ward councilors
- 12 offices with correct titles; all office_ids back-filled

## Key Files

| File | Description |
|------|-------------|
| `C:/EV-Accounts/backend/migrations/587_new_bedford_city_government.sql` | City government seed — 12 politicians, 12 offices, 2 districts |

## Verification Results

All 7 post-verification gates PASSED:
- Gate (a): gov=1 ✓
- Gate (b): chambers=1 ✓
- Gate (c): districts=2 ✓
- Gate (d): politicians=12 ✓
- Gate (e): offices=12 ✓
- Gate (f): split_orphans=0 ✓
- Gate (g): null_office_ids=0 ✓

Additional acceptance criteria:
- mayor_title='Mayor' ✓
- pereira_title='City Councilor (Ward 6)' (NOT 'City Council President') ✓
- ward_count=6 (Wards 1–6 only, no Ward 7) ✓
- section_split=0 ✓

## Decisions Made

- full_name='Jon Mitchell' (not 'Jonathan F. Mitchell') — official goes by Jon; consistent with research
- Middle initials dropped for Burgo, Carney (R.A.), Gomes, Lopes, Pereira per DB convention
- Ryan Pereira title='City Councilor (Ward 6)' — Council President is internal role, not charter office (D-06)
- 'City Councilor' spelling (single-L American) — confirmed per newbedfordlight.org

## Self-Check: PASSED

NEWBED-01 satisfied: New Bedford address will return LOCAL section with Mayor Mitchell + 11 City Councilors.
