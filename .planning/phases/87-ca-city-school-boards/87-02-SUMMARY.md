---
phase: "87"
plan: "02"
subsystem: database
tags: [school-boards, california, headshots, migration]
dependency_graph:
  requires: [87-01-PLAN]
  provides: [ca-school-board-headshots]
  affects: [politician_images, supabase-storage]
tech_stack:
  added: []
  patterns: [phase-86-headshot-pattern, audit-only-migration, direct-psql-inserts]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql
    - C:/Transparent Motivations/essentials/scripts/_tmp-ca-school-headshots.py
  modified: []
decisions:
  - "SFUSD photos found directly from sfusd.edu board page (not JS-rendered — Drupal CMS exposes src attributes)"
  - "SCUSD photos extracted from Finalsite CDN data-image-sizes attributes on scusd.edu board page"
  - "BUSD photos mapped by name from adjacent text on berkeleyschools.net/schoolboard"
  - "SDUSD: Petterson URL found via HTTP redirect test; Whitehurst-Payne no URL found (Cloudflare)"
  - "SJUSD: 0/5 photos — sjusd.org board page confirmed to have no photos"
  - "FUSD: 5/5 URLs confirmed by user before this task began"
  - "DB inserts done via direct psql (Supabase REST API does not expose essentials schema)"
metrics:
  duration: "35 minutes"
  completed: "2026-06-02T14:15:00Z"
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 0
---

# Phase 87 Plan 02: CA City School Board Headshots Summary

CA school board headshots: 28 of 34 officials processed and uploaded (600x750 JPEG, 4:5 crop, Lanczos q90).

## What Was Built

Downloaded, processed (4:5 crop + 600x750 Lanczos resize), uploaded to Supabase Storage, and inserted `politician_images` rows for 28 CA school board officials across 5 of 6 districts. Migration 258 (audit-only SQL) documents all insertions and photo sources.

## Results by District

| District | Officials | Photos Found | Notes |
|----------|-----------|--------------|-------|
| SFUSD | 7 | 7/7 | sfusd.edu Drupal CMS; B&W headshots |
| SDUSD | 5 | 4/5 | sharpschool CDN; Whitehurst-Payne not found |
| SCUSD | 7 | 7/7 | resources.finalsite.net CDN |
| SJUSD | 5 | 0/5 | No photos on sjusd.org |
| FUSD | 5 | 5/5 | fremontunified.org WP media (URLs from user) |
| BUSD | 5 | 5/5 | berkeleyschools.net WP media |
| **TOTAL** | **34** | **28/34** | |

## Deviations from Plan

### Auto-resolved Technical Issues

**1. [Rule 3 - Blocking] Supabase Python SDK missing transitive dependencies**
- **Found during:** Image upload step
- **Issue:** `supabase` Python package failed to import due to missing pyiceberg, deprecation, yarl, pydantic, websockets dependencies (broken install). REST API also not usable — essentials schema not in the exposed schema list.
- **Fix:** Used direct urllib HTTP calls for Storage uploads; used psql for DB inserts.
- **Files modified:** `scripts/_tmp-ca-school-headshots.py`

**2. [Rule 1 - Bug] Windows stdout encoding error with Unicode arrow character**
- **Found during:** First script run
- **Issue:** Print statement with `→` character (U+2192) failed on Windows CP1252 terminal.
- **Fix:** Replaced `→` with ASCII `->` in print statement.

### Coverage Gaps (Not Bugs)

**SJUSD (5 officials, no photos):** sjusd.org board page confirmed to have no photos — names and titles only. All 5 marked as "No photo found on official district website" in migration 258.

**SDUSD Sharon Whitehurst-Payne:** sandiegounified.org is Cloudflare-protected. All individual bio page URLs return JS challenge pages. URL filename guessing against sharpschool CDN exhausted without finding her photo. Marked in migration 258 as requiring manual browser check.

## DB Verification

```sql
SELECT COUNT(*) FROM essentials.politician_images pi
JOIN essentials.politicians p ON p.id = pi.politician_id
WHERE p.external_id BETWEEN -870034 AND -870001
AND pi.type = 'default';
-- Result: 28
```

## Known Stubs

None — all 28 uploaded photos are real official headshots from district websites.

## Self-Check: PASSED

- Migration 258 file created: `C:/EV-Accounts/backend/migrations/258_ca_city_school_headshots.sql`
- Headshot script created: `C:/Transparent Motivations/essentials/scripts/_tmp-ca-school-headshots.py`
- DB verified: 28 politician_images rows for external_ids -870001 to -870034
- Commit: 03d8b4a
