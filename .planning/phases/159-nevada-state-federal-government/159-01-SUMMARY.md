---
phase: 159-nevada-state-federal-government
plan: 01
subsystem: database
tags: [postgres, supabase, nevada, state-executive, headshot, migration]

requires:
  - phase: 158-nevada-geofences
    provides: NV TIGER geofences + State of Nevada government row (geo_id=32)
provides:
  - Andy Matthews (State Controller, -3200006) — 6th STATE_EXEC official under State of Nevada
  - Controller chamber + STATE_EXEC district + office + office_id back-fill
  - 600x750 Controller headshot (Wikimedia Commons CC BY-SA 3.0)
affects: [159-03 verification, v18.0 Nevada milestone]

tech-stack:
  added: []
  patterns:
    - "Single net-new STATE_EXEC official added to a partly-seeded state (5 pre-existing untouched)"
    - "Wikimedia upload.wikimedia.org requires a descriptive User-Agent (generic browser UA -> HTTP 429)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1050_nv_controller.sql (structural, registered as 1050)
    - C:/EV-Accounts/backend/migrations/1052_nv_controller_headshot.sql (audit-only, not registered)
    - C:/EV-Accounts/backend/scripts/_tmp-nv-controller-headshot.py (gitignored helper, run inline)
  modified: []

key-decisions:
  - "Headshot sourced from Wikimedia Commons (Andy_Matthews_by_Gage_Skidmore.jpg, CC BY-SA 3.0) — controller.nv.gov has no HTML portrait; campaign site avoided"
  - "photo_license recorded as cc_by_sa_3.0 (accurate + consistent with the cc_by_sa_* underscore family in the DB)"
  - "districts INSERT mirrors the 270_md column list incl. district_id='' and mtfcc=''"

patterns-established:
  - "Wikimedia-compliant User-Agent for upload.wikimedia.org downloads"

requirements-completed: [NV-STATE-01]

duration: ~25min
completed: 2026-06-23
---

# Phase 159 Plan 01: NV State Controller — Summary

**Andy Matthews seeded end-to-end as the 6th Nevada STATE_EXEC constitutional officer with a 600x750 Wikimedia-sourced headshot; the 5 pre-existing officers were left untouched.**

## Accomplishments
- Structural migration **1050** applied: Controller chamber (`name='Controller'`, `name_formal='Nevada State Controller'`) + STATE_EXEC district (`'NV'`/`'Nevada Controller'`) + politician (`Andy Matthews`, `-3200006`) + office + office_id back-fill — all idempotent, all scoped to `geo_id='32'`.
- STATE_EXEC audit returns **exactly 6** officials under State of Nevada (Lombardo, Anthony, Ford, Aguilar, Conine, **Matthews**).
- Controller headshot uploaded to `politician_photos/07a8598f-666f-4ac5-b6ee-09cb9f815783-headshot.jpg` (600x750 JPEG q90, **CDN HTTP 200**), audit migration **1052** applied — `politician_images` row present with `type='default'`, `photo_license='cc_by_sa_3.0'`.

## Task Commits (EV-Accounts repo, branch master)
1. **Task 1: structural migration 1050** — `92bc5026` (feat)
2. **Task 3: audit migration 1052** — `35bd2ef4` (feat)

_Task 2 deliverable (`_tmp-nv-controller-headshot.py`) matches the `backend/scripts/_*` gitignore rule (line 67) — current repo policy keeps new helper scripts untracked; it lives on disk and was run inline._

## Inline orchestrator operations (gsd-executor has no Supabase MCP)
- Applied 1050 via `apply_migration`; ran the headshot script (download → crop-to-4:5 → resize 600x750 → Storage upsert); applied 1052 via `execute_sql`.

## Andy Matthews identifiers
- politician UUID: `07a8598f-666f-4ac5-b6ee-09cb9f815783`
- external_id: `-3200006`

## Deviations
- **Wikimedia HTTP 429 on first run.** `upload.wikimedia.org` rejected the generic Chrome User-Agent. Fixed by switching the script's `User-Agent` to a descriptive bot string (`EmpoweredVote-HeadshotBot/1.0 (https://empowered.vote; contact chris@empowered.vote)`) per Wikimedia UA policy; re-run succeeded.
- Two header-comment rewordings in the SQL files to satisfy the literal automated grep gates (avoid the tokens `slug`, `schema_migrations`, `photo_origin_url` appearing anywhere in-file) — no behavioral change.

## Verification Results
- STATE_EXEC officials under geo_id='32': **6** (all with offices/chambers).
- Section-split (NV STATE_EXEC): **0 rows**.
- `'Nevada Controller'` districts: **1** (no duplicate).
- Ledger integer MAX: **1050**; `1050` registered; `1051`/`1052` NOT registered (audit-only) ✓.
- Controller CDN URL: **HTTP 200**, 66048 bytes.

## Self-Check: PASSED
