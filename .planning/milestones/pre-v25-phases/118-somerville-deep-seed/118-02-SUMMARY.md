---
phase: 118-somerville-deep-seed
plan: "02"
subsystem: database
tags: [somerville, ma, migration, school-committee, school-district, g5420]
dependency_graph:
  requires: [118-01-somerville-city-government]
  provides: [somerville-school-committee, somerville-school-district-geofence, somerville-school-officials-9]
  affects: [essentials.governments, essentials.chambers, essentials.districts, essentials.politicians, essentials.offices, essentials.geofence_boundaries]
tech_stack:
  added: []
  patterns: [newton-g5420-geofence-direct-insert, with-ins_p-politician-office-block, dual-exofficio-subquery-pattern, post-verification-do-block]
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/582_somerville_school_committee.sql
  modified: []
decisions:
  - "Two ex-officio blocks (Mayor Wilson -2562535001 + Council President Davis -2562535011) use subquery pattern — no new politician rows inserted for either"
  - "office_id back-fill range -2510890001..-2510890007 excludes BOTH ex-officio external IDs; both city office_ids confirmed intact via Gates (i) and (j)"
  - "Michele Lippens spelled with ONE 'l' per official somerville.k12.ma.us — NOT 'Michelle'"
  - "G5420 geofence inserted directly in migration (no MA G5420 TIGER loader); state='25' FIPS numeric string"
  - "district_type='SCHOOL' (NOT 'SCHOOL_DISTRICT') — consistent with Newton/Multnomah pattern"
metrics:
  duration: 6m
  completed: "2026-06-14"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 118 Plan 02: Somerville School Committee Seed Summary

Somerville Public Schools school committee seeded via migration 582 — G5420 geofence + government + chamber + SCHOOL district + 7 elected members (Ward 1-7) + Mayor Wilson ex-officio + City Council President Davis ex-officio = 9 total offices. Dual ex-officio pattern (unique to Somerville vs. Newton's single ex-officio) executed correctly with both city office_ids confirmed intact.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Write and apply migration 582 | (see below) | C:/EV-Accounts/backend/migrations/582_somerville_school_committee.sql |

## Verification Results

Migration 582 post-verification PASSED (all 10 gates):
- gov=1, chambers=1, districts=1, sc_politicians=7, total_school_offices=9
- split_orphans=0, null_sc_office_ids=0, geo_count=1
- mayor_local_exec_intact=1, davis_local_intact=1

Spot-check results confirmed:
- 7 politicians in external_id range -2510890007 to -2510890001
  - Emily Ackman (-2510890001), Elizabeth Eldridge (-2510890002), Michele Lippens (-2510890003)
  - Andre L. Green (-2510890004), Laura Pitone (-2510890005), Emma Stellman (-2510890006)
  - Leiran Biton (-2510890007)
- 9 offices linked to SCHOOL district geo_id='2510890'
- Both ex-officio titles confirmed: 'City Council President (ex officio)', 'Mayor (ex officio)'
- Mayor Wilson (external_id=-2562535001) office_id still points to LOCAL_EXEC district — confirmed 'Jake Wilson'
- Council President Davis (external_id=-2562535011) office_id still points to LOCAL district — confirmed 'Lance L. Davis'
- Wilson + Davis each seeded exactly once (total count = 2, no re-seed)
- G5420 geofence present (geo_id='2510890', state='25')
- Section-split check = 0 (no orphan geofences)
- Ledger entry '582' present in supabase_migrations.schema_migrations

## Deviations from Plan

None — plan executed exactly as written.

All pitfalls avoided:
- Pitfall 2 (only one ex-officio): TWO ex-officio blocks included (Mayor + Council President)
- Pitfall 4 (duplicate politician rows): both ex-officio blocks used subquery on existing external_ids — 0 new politician rows for Wilson/Davis
- Pitfall 5 (office_id overwrite): back-fill range was -2510890001..-2510890007 only; Gates (i) and (j) confirmed both city office_ids intact
- Pitfall 6 (wrong LEAID): geo_id='2510890' used throughout (not '2562535')
- Pitfall 7 (slug column): not included in chambers INSERT
- Pitfall 9 (Michele spelling): 'Michele Lippens' (one L) confirmed in DB

## Known Stubs

None. All 7 new SC politicians have non-NULL office_ids. Both ex-officio rows are fully wired to existing politician rows.

## Threat Flags

None. All STRIDE threats from plan mitigated:
- T-118-04 (Mayor dual-insert): Pre-flight Gate 3 passed; Block 8 used subquery; politician count intact
- T-118-05 (Davis dual-insert): Pre-flight Gate 4 passed; Block 9 used subquery; post-verification Gate (j) confirmed
- T-118-06 (office_id overwrite — both ex-officio): back-fill range -2510890001..-2510890007; Gates (i)+(j) confirmed
- T-118-07 (wrong geo_id): geo_id='2510890' throughout; Gates (c)+(f)+(h) confirmed

## Self-Check: PASSED

- C:/EV-Accounts/backend/migrations/582_somerville_school_committee.sql — FOUND (created)
- essentials.governments WHERE name = 'Somerville Public Schools, Massachusetts, US' — 1 row
- essentials.politicians WHERE external_id BETWEEN -2510890007 AND -2510890001 — 7 rows
- essentials.offices (SCHOOL district geo_id=2510890) — 9 rows
- Both ex-officio titles confirmed: 'Mayor (ex officio)' + 'City Council President (ex officio)'
- Mayor Wilson office_id: LOCAL_EXEC district confirmed
- Davis office_id: LOCAL district confirmed
- section-split (geo_id=2510890, mtfcc=G5420) — 0 orphans
- null office_ids in elected SC range — 0
- supabase_migrations.schema_migrations version='582' — present
