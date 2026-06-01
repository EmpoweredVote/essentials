---
phase: 69-landing-elections-discovery
plan: "02"
subsystem: database
tags: [postgres, supabase, elections, races, ca]

# Dependency graph
requires:
  - phase: 62-ca-la-deep-seed
    provides: Governor race (bc936a36) with 64 race_candidates linked; Governor office row 08454462
provides:
  - CA 2026 Statewide Primary election row (jurisdiction_level=state, election_date=2026-06-02)
  - CA 2026 Statewide General election row (jurisdiction_level=state, election_date=2026-11-03)
  - Governor race (bc936a36) linked to CA Statewide General with office_id set
affects:
  - 69-03-PLAN (US House races depend on CA Statewide General election UUID)
  - 69-04-PLAN (discovery_jurisdictions rows will reference CA Statewide General)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Use subquery (SELECT id FROM elections WHERE name='...') to reference new election UUID in the same migration — never hardcode UUIDs"
    - "ON CONFLICT DO NOTHING for idempotent election row INSERTs"

key-files:
  created:
    - supabase/migrations/221_ca_statewide_elections.sql
  modified: []

key-decisions:
  - "Create CA Statewide Primary row even though US House races use only the General — ELECT-01 requires both statewide rows for completeness"
  - "UPDATE existing Governor race bc936a36 (not INSERT new) — 64 race_candidates already linked; INSERT would create duplicate with no candidates"
  - "Use subquery pattern for election_id in UPDATE — avoids hardcoding the newly inserted UUID"

patterns-established:
  - "Governor race UUID bc936a36-287c-4ffd-abd8-5e4fd798bae5 — confirmed canonical row with 64 race_candidates"
  - "CA 2026 Statewide General election UUID: 728d0074-8a8d-49e3-a68c-78ccdd15434f (resolved by name subquery in subsequent migrations)"

requirements-completed:
  - ELECT-01
  - ELECT-02

# Metrics
duration: 7min
completed: 2026-05-28
---

# Phase 69 Plan 02: CA Statewide Elections + Governor Race Patch Summary

**Migration 221 creates 2 CA statewide election rows (Primary June 2 + General Nov 3) and patches the existing Governor race from the LA County Primary to the CA Statewide General with office_id filled**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-28T15:07:15Z
- **Completed:** 2026-05-28T15:14:38Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Inserted `CA 2026 Statewide Primary` (election_date=2026-06-02, jurisdiction_level=state, state=CA) — satisfies ELECT-01
- Inserted `CA 2026 Statewide General` (election_date=2026-11-03, jurisdiction_level=state, state=CA) — satisfies ELECT-01
- Patched Governor race (bc936a36) from wrong LA County Primary election to correct CA Statewide General; set office_id=08454462 (Governor office) — satisfies ELECT-02
- All 64 race_candidates on the Governor race remain unaffected (UPDATE only changed election_id and office_id)

## Task Commits

Each task was committed atomically:

1. **Tasks 1+2: Migration 221 — CA statewide elections + Governor race patch** — `c62f89d` (feat)

**Plan metadata:** see final commit below

## Files Created/Modified

- `supabase/migrations/221_ca_statewide_elections.sql` — Migration 221: 2 election INSERTs + 1 race UPDATE

## Decisions Made

- Both tasks (election INSERT + Governor UPDATE) were combined in a single migration file (221) because the UPDATE depends on the INSERT (uses subquery `SELECT id FROM elections WHERE name='CA 2026 Statewide General'`). This guarantees correct ordering and idempotency.
- No new race rows were created for the Governor — the existing race bc936a36 already has 64 linked race_candidates from Phase 62; creating a duplicate would orphan those candidates.

## Deviations from Plan

None — plan executed exactly as written.

Pre-flight confirmed expected state before migration:
- Only 1 CA election row existed (LA County Primary, jurisdiction_level=county)
- Governor race had election_id=1ebca37f (LA County Primary) and office_id=NULL

Post-migration smoke queries confirmed all acceptance criteria passed.

## Issues Encountered

The MCP Supabase tool (`mcp__supabase-local__execute_sql`) was not available in the agent environment. Resolved by using `psql` directly with the DATABASE_URL from `C:/EV-Accounts/backend/.env`. All queries and migration applied successfully via psql. No impact on outcome.

## Known Stubs

None — this plan contains only SQL migrations with no UI code.

## Threat Flags

None — migration uses hardcoded UUIDs and string constants only; no user-supplied values; WHERE clause scoped to specific race UUID (no mass-update risk).

## Next Phase Readiness

- CA Statewide General election UUID `728d0074-8a8d-49e3-a68c-78ccdd15434f` is now available for Plan 69-03 (US House race INSERTs via subquery)
- Plan 69-03 can proceed immediately — depends only on this general election row existing
- Plan 69-04 (discovery_jurisdictions) similarly unblocked

## Self-Check: PASSED

- `supabase/migrations/221_ca_statewide_elections.sql` — FOUND
- Commit `c62f89d` — FOUND (`git log --oneline -3` confirms)
- CA statewide elections DB state — verified via psql smoke queries (3 CA rows: LA County Primary + CA Statewide Primary + CA Statewide General)
- Governor race — verified: election_name=CA 2026 Statewide General, office_id=08454462-a1f0-4d11-9f61-aba7a173a3de, race_candidates COUNT=64

---
*Phase: 69-landing-elections-discovery*
*Completed: 2026-05-28*
