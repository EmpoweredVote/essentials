# Phase 165 Plan 01 — Summary

**Plan:** 165-01 (Boulder City structural seed + surfacing)
**Status:** ✅ Complete
**Requirement:** CLARK-05 (structural + surfacing halves)
**Date:** 2026-06-29

## What was built

Standalone **City of Boulder City, Nevada, US** government + **Boulder City City Council** chamber (official_count=5) + **exactly 2 districts on geo_id 3206500** (1 LOCAL_EXEC Mayor + 1 shared LOCAL for the 4 at-large council) + 5 politician/office rows. Boulder City appended to the coverage.js Nevada block. **At-large model — no ward loader, no new geofence rows.**

## Wave-0 BLOCKING probes (operator-approved 2026-06-29)

| Probe | Result |
|-------|--------|
| On-disk migration MAX | **1099** → structural = **1100** (no drift; no renumbering) |
| external_id collisions (−3208005..−3208001) | 0 |
| Pre-existing "City of Boulder City" govt | 0 (greenfield) |
| Pre-existing districts on 3206500/nv | 0 |
| Boulder City G4110 geofence | geo_id 3206500, state '32', "Boulder City city" |
| coverage.js NV block (pre-edit) | LV 3240000 + Henderson 3231900 + NLV 3251800 |
| Roster (operator-confirmed) | Hardy + Jorgensen/Booth/Walton/Ashurst = 5, at-large, Jorgensen NOT a 6th seat, Hardy/Booth/Walton seated |

## Migration 1100 — applied, post-verify PASSED

`C:/EV-Accounts/backend/migrations/1100_boulder_city_city_council.sql` (342 lines, registered in ledger as 1100).

Post-verify DO block: **gov=1, districts=2, exec=1, local=4, split_orphans=0.**

Inline audits:
- districts on 3206500/nv: 1 LOCAL_EXEC + 1 LOCAL (exactly 2)
- offices on 3206500/nv: 1 LOCAL_EXEC + 4 LOCAL (5 total)
- chamber official_count = 5
- ledger: version 1100 registered ✓

## external_id → UUID map (consumed by Plans 02/03)

| external_id | UUID | Name | Title | district_type |
|-------------|------|------|-------|---------------|
| −3208001 | `df1a6a02-6248-41df-8274-b589f6770aee` | Joe Hardy | Mayor | LOCAL_EXEC |
| −3208002 | `d604777b-9e3a-4f3b-b1a3-3ee965177788` | Sherri Jorgensen | Council Member | LOCAL |
| −3208003 | `49226ba0-9a4f-4269-8415-eac2395fe696` | Cokie Booth | Council Member | LOCAL |
| −3208004 | `59d2cdfd-ca4a-4a1b-9a62-1e00ec79b549` | Steve Walton | Council Member | LOCAL |
| −3208005 | `d593c322-4c04-409a-9da4-c77294b1772d` | Denise E. Ashurst | Council Member | LOCAL |

## coverage.js

`src/lib/coverage.js` Nevada block now: Las Vegas (3240000) + Henderson (3231900) + North Las Vegas (3251800) + **Boulder City (3206500, hasContext:true)**. Single NV block; TX "Nevada" city untouched; Landing.jsx untouched.

## Confirmed migration numbering for downstream plans

Structural ledger stays at **1100**. Plan 02 headshot migration = **1101** (audit-only). Plan 03 stance migrations = **1102–1106** (audit-only). No offset (on-disk MAX was exactly 1099).

## key-files
created:
- C:/EV-Accounts/backend/migrations/1100_boulder_city_city_council.sql
modified:
- C:/Transparent Motivations/essentials/src/lib/coverage.js

## Self-Check: PASSED
- Wave-0 probes + roster checkpoint recorded and operator-approved before any write.
- Migration 1100 applied; post-verify gov=1/districts=2/exec=1/local=4/split=0; registered at 1100.
- 5 external_id→UUID map captured.
- Boulder City surfaces in coverage.js (hasContext:true); LV+Henderson+NLV preserved.
