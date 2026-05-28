---
phase: 69-landing-elections-discovery
plan: "03"
subsystem: database
tags: [postgres, supabase, elections, races, ca, us-house, congressional]

# Dependency graph
requires:
  - phase: 69-landing-elections-discovery
    plan: "02"
    provides: CA 2026 Statewide General election row (UUID resolvable via name subquery)
provides:
  - 52 CA US House race rows in essentials.races for CA 2026 Statewide General election
  - All 52 congressional districts represented with verified office_ids
  - CD-29 correctly using active Luz Rivas office (not vacant Cárdenas row)
affects:
  - 69-04-PLAN (discovery_jurisdictions rows can now sweep against these race rows)
  - discovery cron (52 CA House races now available for candidate sweep)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WITH subquery captures election UUID once for bulk race INSERT — avoids hardcoding UUID across 52 VALUES rows"
    - "ON CONFLICT DO NOTHING for idempotent race row INSERTs"

key-files:
  created:
    - supabase/migrations/222_ca_us_house_races.sql
  modified: []

key-decisions:
  - "Used WITH subquery pattern to capture CA Statewide General election_id — safer than hardcoded UUID, consistent with migration 221 pattern"
  - "CD-29 uses office_id a2fe1b46 (Luz Rivas, is_vacant=false) per explicit plan/research warning — Cárdenas (ebee1293, is_vacant=true) row excluded"
  - "Existing CD-34 race row (tied to LA County Primary) left as-is — ON CONFLICT DO NOTHING does not touch it; new CD-34 general race added alongside it"

patterns-established:
  - "CA US House race UUID lookup: use subquery on office.title + state to find office, or reference the verified 52-row table in 69-RESEARCH.md"
  - "Migration 222 is idempotent — safe to re-run"

requirements-completed:
  - ELECT-03

# Metrics
duration: 6min
completed: 2026-05-28
---

# Phase 69 Plan 03: CA US House Race Rows Summary

**Migration 222 seeds 52 CA US House general election races via WITH subquery pattern, all linked to CA 2026 Statewide General with verified office_ids and correct CD-29 active office**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-28T15:20:00Z
- **Completed:** 2026-05-28T15:26:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Inserted 52 `essentials.races` rows, one per CA congressional district, all linked to the CA 2026 Statewide General election
- All 52 rows have non-null office_ids sourced from the verified DB table in 69-RESEARCH.md
- CD-29 uses active Luz Rivas office (a2fe1b46, is_vacant=false) — the vacant Cárdenas row (ebee1293) was correctly excluded
- seats=1 for all rows; ON CONFLICT DO NOTHING ensures idempotency
- Satisfies ELECT-03: discovery cron can now sweep all 52 CA House districts for candidates

## Task Commits

1. **Task 1: Migration 222 — 52 CA US House race rows** — `52a3c88` (feat)

**Plan metadata:** see final commit below

## Files Created/Modified

- `supabase/migrations/222_ca_us_house_races.sql` — Migration 222: WITH subquery + 52-row VALUES INSERT for all CA congressional districts

## Decisions Made

- Combined all 52 rows into a single INSERT statement using a WITH subquery and a VALUES list — this ensures the election_id subquery is evaluated once and all rows are inserted atomically
- No changes to the existing CD-34 row (linked to LA County Primary) — it remains under that election; a new CD-34 general race row was added for the CA Statewide General

## Deviations from Plan

None - plan executed exactly as written.

Pre-flight query confirmed 0 rows existed before migration. Post-migration smoke queries confirmed all acceptance criteria.

## Issues Encountered

MCP `mcp__supabase-local__execute_sql` was not available (consistent with plan 69-02). Used psql directly with DATABASE_URL from C:/EV-Accounts/backend/.env — same fallback as plan 69-02. No impact on outcome.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — this plan contains only SQL migrations with no UI code.

## Threat Flags

None — migration uses only hardcoded UUIDs and string constants from the verified research table; no user-supplied values; ON CONFLICT DO NOTHING prevents duplicates.

## Next Phase Readiness

- Plan 69-04 (discovery_jurisdictions) can proceed immediately — the 52 race rows and CA Statewide General election row are both in place
- Verification queries all pass: COUNT=52, NULL office_ids=0, CD-29 is_vacant=false, all Districts 1-52 present

## Self-Check: PASSED

- `supabase/migrations/222_ca_us_house_races.sql` — FOUND
- Commit `52a3c88` — FOUND
- DB smoke query COUNT=52 — VERIFIED via psql
- NULL office_id check=0 — VERIFIED via psql
- CD-29 is_vacant=false — VERIFIED via psql
- All 52 districts present — VERIFIED via psql (52 rows returned in ORDER BY position_name)

---
*Phase: 69-landing-elections-discovery*
*Completed: 2026-05-28*
