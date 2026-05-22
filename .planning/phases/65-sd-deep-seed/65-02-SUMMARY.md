---
phase: 65-sd-deep-seed
plan: "02"
subsystem: essentials-data
tags: [san-diego, officials, seed, migration, postgresql]
requires: [65-01]
provides: [sd-officials-seed]
affects: [65-03]
tech-stack:
  added: []
  patterns: [with-ins-p-cte, idempotent-seed, office-id-backfill]
key-files:
  created:
    - C:/EV-Accounts/backend/migrations/208_sd_officials.sql
  modified: []
decisions:
  - "LaCava has 1 office only (Council President is governance role, not a separate office row)"
  - "Campbell (D2) + Moreno (D8) seeded as incumbents (is_active=true, is_vacant=false) — term-limited Jun 2026 but remain through certification"
  - "Henry L. Foster III: full_name includes middle initial L. — ArcGIS NAME field omits it; plan constraint takes precedence"
  - "is_appointed_position=false for all 11 (Mayor + City Attorney are elected in San Diego)"
metrics:
  duration: "9 minutes"
  completed: "2026-05-22"
---

# Phase 65 Plan 02: SD Officials Seed Summary

**One-liner:** 11 SD officials seeded via WITH ins_p CTE pattern (Mayor Gloria + City Attorney Ferbert + 9 Council Members); all office_ids back-filled; end-to-end routing confirmed via ST_Covers to Whitburn/D3.

## Pre-flight Checks (all 5 passed)

| Check | Query | Result |
|-------|-------|--------|
| 1 | -650xxx range clear | 0 rows (range empty, safe to use) |
| 2 | 3 SD chambers exist | City Attorney, City Council, Mayor |
| 3 | 9 council districts exist | COUNT=9 |
| 4 | SD-wide LOCAL_EXEC district | geo_id=0666000, district_type=LOCAL_EXEC |
| 5 | 9 X0007 geofence boundaries | COUNT=9 |

## Migration Applied

**File:** `C:/EV-Accounts/backend/migrations/208_sd_officials.sql`
**Ledger:** version='208', name='208_sd_officials'

Pattern: WITH ins_p CTE (copied from 199_sf_officials.sql), one block per official. Back-fill UPDATE at end.

## SD Officials Roster (from Verification Query 6 + 9)

### City Council (9 members)

| District | external_id | full_name | Title |
|----------|-------------|-----------|-------|
| sd-council-district-1 | -650010 | Joe LaCava | Council Member |
| sd-council-district-2 | -650011 | Jennifer Campbell | Council Member |
| sd-council-district-3 | -650012 | Stephen Whitburn | Council Member |
| sd-council-district-4 | -650013 | Henry L. Foster III | Council Member |
| sd-council-district-5 | -650014 | Marni von Wilpert | Council Member |
| sd-council-district-6 | -650015 | Kent Lee | Council Member |
| sd-council-district-7 | -650016 | Raul Campillo | Council Member |
| sd-council-district-8 | -650017 | Vivian Moreno | Council Member |
| sd-council-district-9 | -650018 | Sean Elo-Rivera | Council Member |

### Citywide Officials (2)

| geo_id | external_id | full_name | Title | district_type |
|--------|-------------|-----------|-------|---------------|
| 0666000 | -650001 | Todd Gloria | Mayor | LOCAL_EXEC |
| 0666000 | -650002 | Heather Ferbert | City Attorney | LOCAL_EXEC |

## Verification Results (all 9 passed)

**Query 1 — 11 SD politicians:**
All 11 rows: is_active=t, is_incumbent=t, has_office_id=t

**Query 2 — offices by chamber:**
City Attorney=1, City Council=9, Mayor=1

**Query 3 — is_appointed_position:**
All 11 rows: is_appointed_position=false

**Query 4 — Henry L. Foster III:**
full_name='Henry L. Foster III', first_name='Henry', last_name='Foster III'

**Query 5 — LaCava office count:**
1 row only: Joe LaCava | Council Member | sd-council-district-1

**Query 6 — Council district mapping:**
9 rows, district→person mapping exactly as planned

**Query 7 — Section-split detector:**
0 rows (clean — no split-section bugs)

**Query 8 — SD City Hall routing (end-to-end):**
(-117.1546, 32.7157) → sd-council-district-3 → Stephen Whitburn, Council Member

**Query 9 — Mayor + City Attorney citywide routing:**
Todd Gloria (Mayor) + Heather Ferbert (City Attorney) both on geo_id='0666000', LOCAL_EXEC

## Deviations from Plan

None — plan executed exactly as written.

## Next Phase Readiness

- **65-03 (headshots):** 11 SD politicians ready for headshot upload; all have politician_id UUIDs assigned via the seed. External_ids -650001/-650002/-650010..-650018 confirmed live.
- **Next migration is 209.**
