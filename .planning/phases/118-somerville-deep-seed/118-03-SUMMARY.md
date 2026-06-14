---
phase: 118-somerville-deep-seed
plan: "03"
subsystem: database
tags: [somerville, ma, headshots, migration, politician-images, storage]
dependency_graph:
  requires: [118-01-somerville-city-government, 118-02-somerville-school-committee]
  provides: [somerville-headshots-9, somerville-politician-images-9]
  affects: [essentials.politician_images, supabase-storage-politician_photos]
tech_stack:
  added: []
  patterns: [headshot-upload-python-script, crop-4-5-first-resize-600x750-lanczos, politician-images-where-not-exists-guard]
key_files:
  created:
    - C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py
    - C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql
  modified: []
decisions:
  - "9/12 city officials uploaded from somervillema.gov — 3 gaps (Link/Wheeler/Hardt newly elected Nov 2025; no city site photos yet)"
  - "All 7 SC members are gaps — somervillema.gov and somerville.k12.ma.us have no individual headshots; group photo only"
  - "Jake Wilson photo sourced from S3 somervillema-live bucket (JW_City_Hall_Steps.jpeg) — wider landscape crop handled by center-width crop logic"
  - "Pitfall 3 avoided — Emily Hardt /councilor-emily-hardt-2022.jpg NOT attempted; url=None in roster"
  - "photo_license='public_domain' for all official city website photos"
metrics:
  duration: 25m
  completed: "2026-06-14"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 0
---

# Phase 118 Plan 03: Somerville Headshots Summary

9 Somerville city official headshots uploaded to politician_photos bucket at 600x750 Lanczos q90; migration 583 applied with all 9 politician_images rows at type='default'; 10 gap officials documented (3 city newly-elected + 7 SC no online source). SOMERVILLE-02 satisfied at best-effort (75% city coverage + 0% SC).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write and run Somerville headshot script | (see below) | C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py |
| 2 | Write and apply migration 583 — Somerville headshots | (see below) | C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql |

## Script Output Summary

**Run date:** 2026-06-14
**Total officials attempted:** 19 (12 city + 7 SC)
**Uploaded:** 9 (all city confirmed-200 officials)
**Gaps:** 10 (3 city newly-elected + 7 SC)

### UPLOADED (9 city officials)

| Official | External ID | Section | Source |
|----------|-------------|---------|--------|
| Jake Wilson | -2562535001 | Mayor | S3 somervillema-live (JW_City_Hall_Steps.jpeg) |
| Wilfred N. Mbah | -2562535003 | At-Large | S3 somervillema-live (profile-councilor-mbah.jpg) |
| Kristen E. Strezo | -2562535004 | At-Large | S3 somervillema-live (profile-councilor-strezo.jpg) |
| Matthew McLaughlin | -2562535006 | Ward 1 | somervillema.gov/sites/default/files/ (-2022.jpg) |
| Jefferson Thomas Scott | -2562535007 | Ward 2 | somervillema.gov/sites/default/files/ (-2022.jpg) |
| Ben Ewen-Campen | -2562535008 | Ward 3 | somervillema.gov/sites/default/files/ (-2022.jpg) |
| Jesse Clingan | -2562535009 | Ward 4 | somervillema.gov/sites/default/files/ (-2022.jpg) |
| Naima Sait | -2562535010 | Ward 5 | S3 somervillema-live (headshot-naima-sait.jpg) |
| Lance L. Davis | -2562535011 | Ward 6 | somervillema.gov/sites/default/files/ (-2022.jpg) |

### GAP Officials (10 total — not blocking per SOMERVILLE-02)

| Official | External ID | Section | Reason |
|----------|-------------|---------|--------|
| Jon Link | -2562535002 | At-Large | Newly elected Nov 2025 — no city site photo yet; fallback: jonforsomerville.com |
| Ben Wheeler | -2562535005 | At-Large | Newly elected Nov 2025 — no city site photo yet; fallback: benwheelerforsomerville.com |
| Emily Hardt | -2562535012 | Ward 7 | Newly elected Nov 2025; Ward 7 page stale; /councilor-emily-hardt-2022.jpg returns 403; fallback: emilyhardtforsomerville.com |
| Emily Ackman | -2510890001 | SC Ward 1 | No individual headshots on SPS site; fallback: emilyackmanforward1 Facebook / Ballotpedia |
| Elizabeth Eldridge | -2510890002 | SC Ward 2 | No individual headshots on SPS site; fallback: Somerville SEPAC sources |
| Michele Lippens | -2510890003 | SC Ward 3 | No individual headshots on SPS site; fallback: local news election coverage |
| Andre L. Green | -2510890004 | SC Ward 4 | No individual headshots on SPS site; fallback: local news election coverage |
| Laura Pitone | -2510890005 | SC Ward 5 | No individual headshots on SPS site; fallback: local news election coverage |
| Emma Stellman | -2510890006 | SC Ward 6 | No individual headshots on SPS site; fallback: local news election coverage |
| Leiran Biton | -2510890007 | SC Ward 7 | No individual headshots on SPS site; fallback: leiran4somerville Facebook / thesomervilletimes.com |

## Verification Results

Migration 583 post-verification PASSED:
- type=default rows: 9 (expected: 9) — matches UPLOADED count
- type!=default rows: 0 (expected: 0)
- Ledger entry '583': present in supabase_migrations.schema_migrations
- Minimum 9 rows confirmed (all 9 confirmed-200 city officials)
- No duplicate politician_images rows (WHERE NOT EXISTS guard functional)

## Deviations from Plan

None — plan executed exactly as written.

Pitfalls avoided:
- Pitfall 3 (Emily Hardt stale URL): url=None in roster; /councilor-emily-hardt-2022.jpg NOT attempted
- T-118-10 (wrong bucket name): script hardcodes bucket='politician_photos' throughout
- T-118-11 (wrong type): post-verification gate confirmed 0 wrong-type rows
- T-118-12 (stale Hardt URL): roster entry has url=None — guard confirmed functional

## Known Stubs

None that affect plan goal. Gap officials are documented and acknowledged as best-effort per SOMERVILLE-02. The plan objective (minimum 9 city officials uploaded) is fully met.

## Threat Flags

None. All STRIDE threats from plan mitigated:
- T-118-08 (image substitution): 9 source URLs logged; all match official city identity from somervillema.gov
- T-118-09 (sensitive image content): only official public-domain government/campaign photos used; photo_license='public_domain'
- T-118-10 (wrong bucket): script uses 'politician_photos' throughout; confirmed in upload output
- T-118-11 (wrong type): post-verification gate passed; 0 non-'default' rows
- T-118-12 (stale Hardt URL): Pitfall 3 guard active; no attempt made on -2022.jpg path

## Self-Check: PASSED

- C:/EV-Accounts/backend/scripts/_tmp-somerville-headshots.py — FOUND (created)
- C:/EV-Accounts/backend/migrations/583_somerville_headshots.sql — FOUND (created)
- essentials.politician_images type='default' for Somerville range — 9 rows
- essentials.politician_images type!='default' for Somerville range — 0 rows
- supabase_migrations.schema_migrations version='583' — present
- All 9 uploads confirmed in script output with CDN URLs
