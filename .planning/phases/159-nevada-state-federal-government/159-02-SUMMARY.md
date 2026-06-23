---
phase: 159-nevada-state-federal-government
plan: 02
subsystem: database
tags: [postgres, supabase, nevada, us-house, headshot, migration, public-domain]

requires:
  - phase: 158-nevada-geofences
    provides: NV CD geofences (tiger_geoid 3201-3204) + 4 House politician rows
provides:
  - 600x750 headshots for all 4 NV US House reps (Titus, Amodei, Lee, Horsford)
  - 4 politician_images rows (audit migration 1051, public_domain)
affects: [159-03 verification, v18.0 Nevada milestone]

tech-stack:
  added: []
  patterns:
    - "Resize-only headshot pipeline for already-4:5 unitedstates.github.io 450x550 congressional images"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1051_nv_house_headshots.sql (audit-only, not registered)
    - C:/EV-Accounts/backend/scripts/_tmp-nv-house-headshots.py (gitignored helper, run inline)
  modified: []

key-decisions:
  - "All 4 reps sourced from unitedstates.github.io 450x550 (public_domain); clerk.house.gov fallback never needed"
  - "Susie Lee bioguide L000602 (Assumption A1, LOW confidence) confirmed correct — primary URL returned a real image, no 404 fallback"

patterns-established:
  - "Resize-only (no crop) for 4:5 source images"

requirements-completed: [NV-STATE-02]

duration: ~10min
completed: 2026-06-23
---

# Phase 159 Plan 02: NV US House Headshots — Summary

**All 4 Nevada US House representatives now have 600x750 public-domain headshots; no politician/chamber/district/office rows were created.**

## Accomplishments
- Uploaded 4/4 headshots from `unitedstates.github.io/images/congress/450x550/{bioguide}.jpg` (already 4:5 → resize-only to 600x750 Lanczos q90) to `politician_photos/{uuid}-headshot.jpg`.
- Applied audit migration **1051**: 4 `politician_images` rows (`type='default'`, `photo_license='public_domain'`), each guarded by `WHERE NOT EXISTS`.
- **Assumption A1 resolved:** Susie Lee's LOW-confidence bioguide `L000602` returned a real 272KB image from the primary source (no `clerk.house.gov` fallback), confirming the bioguide is correct. Visual right-person check deferred to the Plan 03 human checkpoint.

## Task Commits (EV-Accounts repo, branch master)
1. **Task 2: audit migration 1051** — `c9d42d90` (feat)

_Task 1 deliverable (`_tmp-nv-house-headshots.py`) matches the `backend/scripts/_*` gitignore rule — kept untracked per current repo policy; run inline._

## Inline orchestrator operations
- Ran the script (download → resize 600x750 → Storage upsert, 4/4 succeeded); applied 1051 via `execute_sql`.

## Verification Results
- `politician_images` for -32001..-32004: **4 rows**, all non-null url, `type='default'`, `public_domain`.
- CDN spot-check (all 4): **HTTP 200** (85920 / 58630 / 109870 / 89579 bytes).
- 1051 is audit-only — NOT registered in the ledger (ledger stays 1050).

## Self-Check: PASSED
