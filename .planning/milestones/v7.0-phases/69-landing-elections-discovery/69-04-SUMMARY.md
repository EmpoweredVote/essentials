---
phase: 69-landing-elections-discovery
plan: "04"
subsystem: database
tags: [postgres, supabase, discovery, elections, ca]

# Dependency graph
requires:
  - phase: 69-02
    provides: CA Statewide General election row (election_date=2026-11-03, jurisdiction_level=state)
  - phase: 69-03
    provides: 52 US House race rows under CA 2026 Statewide General
provides:
  - 7 discovery_jurisdictions rows arming cron for SF/SJ/SD/SAC (June 2) + Fremont/Berkeley/CA Statewide (Nov 3)
affects:
  - discoveryCron.ts Sunday sweep (will now pick up all 6 CA cities + CA statewide)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "discovery_jurisdictions armed = row with future election_date within 180-day cron horizon; no cron_active flag needed"
    - "ON CONFLICT DO NOTHING for idempotent discovery_jurisdictions INSERTs"
    - "State-level statewide row uses jurisdiction_geoid='06' (CA FIPS state code)"

key-files:
  created:
    - supabase/migrations/223_ca_discovery_jurisdictions.sql
  modified: []

key-decisions:
  - "Use election_date='2026-06-02' for SF/SJ/SD/SAC (active June primary municipal races)"
  - "Use election_date='2026-11-03' for Fremont/Berkeley (no June 2026 municipal races; filing deadline Aug 7)"
  - "Single CA Statewide row with geo_id='06' covers both Governor + US House general discovery"
  - "LA city (0644000) and LA County (06037) rows not duplicated — already exist from migration 197"

patterns-established:
  - "CA discovery_jurisdictions geo_ids: SF=0667000, SJ=0668000, SD=0666000, SAC=0664000, Fremont=0626000, Berkeley=0606000, CA Statewide=06"

requirements-completed:
  - ELECT-04

# Metrics
duration: 5min
completed: 2026-05-28
---

# Phase 69 Plan 04: CA Discovery Jurisdictions Summary

**Migration 223 inserts 7 discovery_jurisdictions rows arming the Sunday cron for 6 CA cities + CA statewide; all 5 phase-level smoke queries confirm complete Phase 69 DB state**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-28T15:21:11Z
- **Completed:** 2026-05-28T15:26:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Inserted 7 `discovery_jurisdictions` rows for SF, SJ, SD, SAC (June 2), Fremont, Berkeley, CA Statewide (Nov 3) — satisfies ELECT-04
- Pre-flight confirmed 0 target rows existed before insert; LA city (0644000) and LA County (06037) remained unchanged (2 rows)
- All 7 new rows have non-null source_url pointing to official government pages
- Ran 5 phase-level smoke queries — all passed (see Smoke Query Results below)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migration 223 — 7 CA discovery_jurisdictions rows** — `c46a4c3` (feat)
2. **Task 2: Smoke test** — read-only SELECTs, no migration file needed; results documented below

## Files Created/Modified

- `supabase/migrations/223_ca_discovery_jurisdictions.sql` — Migration 223: 7 discovery_jurisdictions INSERTs with ON CONFLICT DO NOTHING

## Smoke Query Results

All 5 smoke queries ran without SQL errors and returned expected values:

**Query 1 — Cron horizon check:**
16 CA rows within 180-day window from 2026-05-28 (pre-existing LA-area rows + 7 new rows). All 7 new rows confirmed present: SF/SJ/SD/SAC (2026-06-02), Berkeley/Fremont/CA Statewide (2026-11-03).

**Query 2 — New rows count check:**
`COUNT(*) = 7` — exactly 7 new rows with future election_date.

**Query 3 — CA elections completeness:**
3 CA election rows: `2026 LA County Primary` (county, 2026-06-02), `CA 2026 Statewide Primary` (state, 2026-06-02), `CA 2026 Statewide General` (state, 2026-11-03).

**Query 4 — Governor race linkage:**
`election_name='CA 2026 Statewide General'`, `office_id='08454462-a1f0-4d11-9f61-aba7a173a3de'` — Governor race correctly linked.

**Query 5 — US House race count:**
`COUNT(*) = 52` — all 52 CA House races under CA 2026 Statewide General confirmed.

## Decisions Made

- Both June 2 and November 3 dates are within the cron's 180-day sweep window from today (2026-05-28 + 180 days = ~2026-11-24). No special handling needed.
- Task 2 has no commit because it is read-only smoke queries with no file artifacts.

## Deviations from Plan

None — plan executed exactly as written.

Pre-flight confirmed expected state before migration:
- 0 rows for all 7 target geo_ids
- LA city (0644000) and LA County (06037) both present with 2 total rows

All acceptance criteria passed without any auto-fixes required.

## Issues Encountered

The MCP Supabase tool (`mcp__supabase-local__execute_sql`) was not tested — used psql directly with DATABASE_URL from `C:/EV-Accounts/backend/.env`, consistent with Plan 69-02 approach.

## Known Stubs

None — this plan contains only SQL migrations with no UI code.

## Threat Flags

None — migration uses hardcoded geo_ids and government domain URLs only; ON CONFLICT DO NOTHING prevents duplicate insertion; WHERE clause on pre-flight confirmed LA rows not affected.

## Phase 69 Complete

All 4 plans in Phase 69 are now executed:
- 69-01: Landing.jsx updated with 4 new CA city cards (SF, SJ, Sacramento, Berkeley)
- 69-02: CA statewide elections foundation + Governor race patched (migration 221)
- 69-03: 52 US House race rows under CA 2026 Statewide General (migration 222)
- 69-04: 7 discovery_jurisdictions rows arming Sunday cron (migration 223)

ELECT-01 through ELECT-04 all satisfied.

## Self-Check: PASSED

- `supabase/migrations/223_ca_discovery_jurisdictions.sql` — FOUND (git log confirms c46a4c3)
- Commit `c46a4c3` — FOUND
- DB state verified via psql smoke queries: 7 new rows, 2 LA rows unchanged, all 5 smoke queries passed

---
*Phase: 69-landing-elections-discovery*
*Completed: 2026-05-28*
