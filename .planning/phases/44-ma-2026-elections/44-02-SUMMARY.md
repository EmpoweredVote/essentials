---
phase: 44
plan: "02"
subsystem: elections-data
tags: [ma, elections, us-senate, congress, state-senate, state-house, cambridge, migration, race-candidates, markey, geofence]
one-liner: "Migration 163: Markey US Senate primary (4 candidates) + general (3 candidates) statewide; 7 Cambridge-area district general races with incumbents Clark/Pressley/DiDomenico/Brownsberger/Decker/Connolly; 2nd Middlesex general race seeded as open seat"

dependency-graph:
  requires:
    - "44-01 (MA 2026 election rows — primary/general UUIDs consumed by this plan)"
    - "40-ma-executives-federal (Katherine Clark/Pressley/Markey politician rows + office_ids for MA-05/MA-07)"
    - "39-ma-government-db (MA state senate/house offices including 25D26/27/28 and 25083/25084)"
  provides:
    - "essentials.races: 2 MA primary races + 8 MA general races (10 total)"
    - "essentials.race_candidates: 9 primary candidates + 9 general candidates"
    - "Markey statewide Senate race (office_id=NULL, shows for all MA users)"
    - "Cambridge-area district races linked by office_id (geofence-routed)"
  affects:
    - "44-03 (Cambridge challenger candidates will add to some of these races)"

tech-stack:
  added: []
  patterns:
    - "ON CONFLICT (election_id, position_name, primary_party) DO NOTHING — for primary races with non-null party"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING — for general races using partial index"
    - "WHERE NOT EXISTS guard on race_candidates (no unique constraint on race_id+full_name)"
    - "office_id=NULL sentinel for statewide races; office_id NOT NULL for district-routed races"
    - "RETURNING id INTO var + IS NULL fallback pattern for idempotent race UUID retrieval"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/163_ma_2026_key_races.sql"
  modified: []

decisions:
  - decision: "Markey Senate races use office_id=NULL (statewide sentinel)"
    rationale: "office_id=NULL combined with e.state='MA' in elections table makes races appear for all MA users via the statewide query path in getElectionsByGeoIds. Setting an office_id would restrict it to voters in a specific district, which is wrong for a US Senate race."
    impact: "All MA users will see the Markey Senate race; no geofence routing needed."
  - decision: "Seth Moulton added with politician_id=NULL"
    rationale: "Moulton is a sitting US Representative (MA-06) and has a record in essentials.politicians, but the plan correctly flagged that his politician_id was not verified in the planning research. To avoid linking to the wrong politician row, NULL is safest; this can be backfilled in Plan 44-03."
    impact: "Moulton appears as a candidate without a profile link; safe default."
  - decision: "25D27 general race seeded with 0 candidates (open seat)"
    rationale: "The general election winner of the 2nd Middlesex District will be decided by the September 2026 primary. No general election candidates are known yet. The race row must exist so the elections page shows the race to affected voters."
    impact: "Voters in 25D27 see the race exists; candidates will be added after September primary."
  - decision: "Used WHERE NOT EXISTS on all race_candidate inserts"
    rationale: "race_candidates has no unique constraint on (race_id, full_name) — documented in STATE.md from Plan 44-01. ON CONFLICT DO NOTHING would silently produce duplicates on re-run. WHERE NOT EXISTS is the correct idempotency guard."
    impact: "Migration is fully idempotent; all re-runs produce zero new rows."

metrics:
  tasks-completed: 3
  tasks-total: 3
  duration: "~5 minutes"
  completed: "2026-05-17"

commits:
  - hash: "087f611"
    message: "feat(44-02): seed MA 2026 Senate races + Cambridge district general races"
    tasks: [1, 2, 3]
---

# Phase 44 Plan 02: MA 2026 Key Races Summary

Migration 163 seeds the US Senate Markey races (primary + general) as statewide rows and 7 Cambridge-area district general races linked to their office_ids for geofence routing — covering MA-05, MA-07, 25D26, 25D27, 25D28, 25th Middlesex House, and 26th Middlesex House.

## What Was Done

### Task 1: Write migration 163 Part A — Markey Senate races
Created `C:/EV-Accounts/backend/migrations/163_ma_2026_key_races.sql` with the first DO $$ block:

**Markey Democratic Primary (Sept 1):**
- Race: `U.S. Senate Massachusetts`, primary_party='Democratic', office_id=NULL (statewide), seats=1
- 4 candidates: Ed Markey (incumbent, politician_id linked), Seth Moulton (NULL politician_id), William Gates (NULL), Alexander Rikleen (NULL)

**Markey General Election (Nov 3):**
- Race: `U.S. Senate Massachusetts`, primary_party=NULL (uses partial index), office_id=NULL (statewide), seats=1
- 3 candidates: Ed Markey (incumbent, politician_id linked), Nathan Bech (NULL), John Deaton (NULL)

### Task 2: Append to migration 163 — Cambridge-area district general races
Added the second DO $$ block for 7 district-linked general races, all using office_id NOT NULL:

| Race | office_id | Incumbent | Candidates |
|------|-----------|-----------|------------|
| U.S. House MA-05 | 395b6873 | Katherine Clark (linked) | 1 |
| U.S. House MA-07 | 9011e2ed | Ayanna Pressley (linked) | 1 |
| MA Senate Middlesex+Suffolk (25D26) | c3ea7a34 | Sal DiDomenico (linked) | 1 |
| MA Senate 2nd Middlesex (25D27) | b1ed4e2a | (open seat) | 0 |
| MA Senate Suffolk+Middlesex (25D28) | e18eeea6 | William Brownsberger (linked) | 1 |
| MA House 25th Middlesex | a0e18b1e | Marjorie Decker (linked) | 1 |
| MA House 26th Middlesex | 06e4afe2 | Mike Connolly (linked) | 1 |

### Task 3: Apply migration + register + verify idempotency
- Applied via `psql $DATABASE_URL -f 163_ma_2026_key_races.sql` — output: `DO / DO`
- Registered in `supabase_migrations.schema_migrations` as version `163`
- Re-run idempotency: second application produced no duplicate rows (verified via COUNT DISTINCT)
- Final counts: Primary has 2 distinct races (9 candidate rows); General has 8 distinct races (9 candidate rows)

## Verification Results

All plan success criteria confirmed:

1. Markey Democratic primary race exists with 4 candidates (Markey as incumbent + Moulton + Gates + Rikleen) — PASS
2. Markey general race exists with 3 candidates, office_id=NULL (statewide) — PASS
3. MA-05 general race links Katherine Clark (politician_id 7bf73fb2) as incumbent — PASS
4. MA-07 general race links Ayanna Pressley (politician_id c61baf45) as incumbent — PASS
5. 25D26 general: DiDomenico linked as incumbent — PASS
6. 25D27 general: exists with 0 candidates (open seat) — PASS
7. 25D28 general: Brownsberger linked as incumbent — PASS
8. 25th Middlesex House general: Decker linked as incumbent — PASS
9. 26th Middlesex House general: Connolly linked as incumbent — PASS
10. Migration is idempotent — PASS

## Deviations from Plan

None — plan executed exactly as written. All WHERE NOT EXISTS guards, ON CONFLICT syntax, and office_id NULL sentinel for statewide races were implemented as specified.

## Next Phase Readiness

Plan 44-03 can begin immediately. It will need:
- The race IDs for the Markey primary and 2nd Middlesex primary (for adding additional challengers)
- Research on Seth Moulton's politician_id for optional backfill
- Cambridge-area challenger candidates to add to district races
