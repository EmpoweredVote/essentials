---
phase: 62-la-backlog-closure
plan: 02
subsystem: ca-state-elections
tags: [postgres, supabase, migrations, ca-governor, race-candidates, discovery-jurisdictions]

requires:
  - phase: 62-01
    provides: LA Council votes backfill and migration 196

provides:
  - Canonical external_ids -6003001..-6003008 for 8 CA Governor 2026 challengers (Becerra, Bianco, Hilton, Mahan, Porter, Steyer, Villaraigosa, Yee)
  - All 9 Calmatters-sourced Governor race_candidates rows confirmed linked to politician_ids
  - lavote.gov discovery_jurisdictions row (jurisdiction_geoid=06037, election_date=2026-06-03, id=4338)

affects: [ca-governor-headshots, ca-governor-stances, phase-63-plus-ca-city-governments]

tech-stack:
  added: []
  patterns:
    - "UPDATE existing NULL external_id rows rather than INSERT new duplicate politicians when discovery agent pre-seeded rows"
    - "jurisdiction_geoid required on discovery_jurisdictions — use TIGER FIPS format (06037 for LA County)"

key-files:
  created:
    - supabase/migrations/197_ca_governor_challengers.sql
    - .planning/phases/62-la-backlog-closure/62-02-SUMMARY.md
  modified: []

key-decisions:
  - "Pre-check revealed discovery agent already created politician rows for all 8 challengers with external_id=NULL — UPDATE existing rows rather than INSERT new ones to avoid duplicates"
  - "lavote.gov row did not exist — required INSERT with jurisdiction_geoid='06037' and election_date='2026-06-03'"
  - "ON CONFLICT (external_id) DO NOTHING pattern in original plan would have created duplicate politician rows since NULLs are not equal in Postgres unique indexes"

patterns-established:
  - "Before any migration for pre-seeded data, pre-check DB state — discovery agents create politician rows with NULL external_ids"
  - "discovery_jurisdictions INSERT requires jurisdiction_geoid (NOT NULL) and election_date (NOT NULL)"

duration: 13min
completed: 2026-05-22
---

# Phase 62 Plan 02: CA Governor Challengers Summary

**Assigned canonical external_ids -6003001..-6003008 to 8 CA Governor 2026 challengers and inserted lavote.gov discovery row; all 9 Calmatters-sourced race_candidates confirmed linked**

## Performance

- **Duration:** ~13 min
- **Started:** 2026-05-22T02:04:46Z
- **Completed:** 2026-05-22T02:18:08Z
- **Tasks:** 3
- **Files modified:** 1 migration + 1 summary

## Pre-existing State (Task 1 Findings)

| Check | Expected | Actual |
|-------|----------|--------|
| Governor race row | 1 row, primary_party=NULL | Confirmed: id=bc936a36, primary_party=NULL |
| Calmatters race_candidates | 9 rows, mostly NULL politician_id | All 9 already had politician_id set (discovery agent pre-linked) |
| -6003xxx politicians | 0 rows | Confirmed: 0 rows existed |
| Politician rows for 8 challengers | External_id=NULL | Confirmed: 8 rows with external_id=NULL, 1 row each |
| Tony Thurmond | pre-existing -6000108 | Confirmed: already linked to race_candidates |
| lavote.gov discovery row | 1 row with id=4338 | Not found — no lavote.gov row existed at all |

Race had far more than 9 candidates (60+ total from discovery agent), with 43 already having politician_id set before this migration ran.

## Politicians Updated (Section A)

8 existing politician rows (created by discovery agent with external_id=NULL) had canonical external_ids assigned:

| External ID | Full Name |
|-------------|-----------|
| -6003001 | Xavier Becerra |
| -6003002 | Chad Bianco |
| -6003003 | Steve Hilton |
| -6003004 | Matt Mahan |
| -6003005 | Katie Porter |
| -6003006 | Tom Steyer |
| -6003007 | Antonio Villaraigosa |
| -6003008 | Betty Yee |

Slots -6003009 through -6003013 remain reserved for future challengers.

## Thurmond Linkage (Section C)

Tony Thurmond (external_id=-6000108, CA Superintendent) was already linked to his Governor race_candidates row before this migration. Section C's `politician_id IS NULL` guard was a no-op, which is correct. No duplicate politician row was created.

## Linkage Verification

Post-migration count of race_candidates with non-NULL politician_id for the Governor race: **43** (all 9 Calmatters-sourced names confirmed linked with correct external_ids).

| Candidate | external_id | linked |
|-----------|-------------|--------|
| Antonio Villaraigosa | -6003007 | true |
| Betty Yee | -6003008 | true |
| Chad Bianco | -6003002 | true |
| Katie Porter | -6003005 | true |
| Matt Mahan | -6003004 | true |
| Steve Hilton | -6003003 | true |
| Tom Steyer | -6003006 | true |
| Tony Thurmond | -6000108 | true |
| Xavier Becerra | -6003001 | true |

## lavote.gov Action (Section D)

**Action taken: INSERT** (no prior row existed).

- id: `9fd492a8-895e-4bd7-91e7-81f9bfa2b3e2`
- jurisdiction_geoid: `06037` (LA County FIPS: CA=06, County=037)
- jurisdiction_name: Los Angeles County
- state: CA
- election_date: 2026-06-03
- source_url: `https://www.lavote.gov/Apps/CandidateList/Index?id=4338`

Pre-check confirmed id=4338 is valid for June 2026 cycle (WebFetch verified 2026-05-21).

**Post-June-3 follow-up required:** After the June 3 2026 primary, lavote.gov will use a new election ID for the November general ballot. The source_url will need updating. Add to STATE.md backlog.

## Task Commits

1. **Task 2: Write and apply migration 197** - `a2b68ef` (feat)
2. **Task 3: Verify and write SUMMARY** - (docs commit below)

## Files Created/Modified

- `supabase/migrations/197_ca_governor_challengers.sql` — Assigns -6003001..-6003008 to 8 challengers, idempotent race_candidates link passes, inserts lavote.gov discovery row

## Decisions Made

- **UPDATE not INSERT for existing politicians**: The original plan called for INSERT...ON CONFLICT DO NOTHING. Pre-check revealed the discovery agent had already created politician rows with external_id=NULL. Since Postgres unique indexes allow multiple NULLs (NULLs are not equal), the INSERT would have created 8 duplicate politician rows. Correct approach was UPDATE by full_name match.

- **INSERT lavote.gov row**: Original plan expected a conditional UPDATE (update if stale, no-op if current). Pre-check found no row existed. Changed to INSERT with required NOT NULL fields (jurisdiction_geoid='06037', election_date='2026-06-03').

- **election_date='2026-06-03'**: LA County primary is June 3, 2026. Other CA cities used 2026-06-02 — LA County is one day later.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Changed Section A from INSERT to UPDATE for 8 challenger politicians**
- **Found during:** Task 1 (pre-check queries)
- **Issue:** Plan specified INSERT...ON CONFLICT (external_id) DO NOTHING, but the 8 challenger politician rows already existed with external_id=NULL (created by discovery agent). Postgres unique indexes allow multiple NULLs — ON CONFLICT would not fire, creating duplicate politician rows.
- **Fix:** Changed to UPDATE...WHERE lower(full_name) = ... AND external_id IS NULL pattern. Idempotent guard prevents double-assignment on re-run.
- **Files modified:** supabase/migrations/197_ca_governor_challengers.sql
- **Verification:** Post-migration query confirmed 8 rows with -6003001..-6003008, 0 duplicates
- **Committed in:** a2b68ef

**2. [Rule 1 - Bug] Changed Section D from conditional UPDATE to INSERT for lavote.gov**
- **Found during:** Task 1 (pre-check query #4)
- **Issue:** Plan said "conditional UPDATE if stale, no-op if already current." Pre-check found no lavote.gov row at all in discovery_jurisdictions.
- **Fix:** Changed to INSERT with required NOT NULL columns (jurisdiction_geoid, election_date) plus ON CONFLICT DO NOTHING for idempotency.
- **Files modified:** supabase/migrations/197_ca_governor_challengers.sql
- **Verification:** Post-migration confirmed row present with source_url containing ?id=4338
- **Committed in:** a2b68ef

---

**Total deviations:** 2 auto-fixed (both Rule 1 — correcting plan assumptions that didn't match actual DB state)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered

- `discovery_jurisdictions` has NOT NULL constraints on `jurisdiction_geoid` and `election_date` — not documented in plan. Discovered when first INSERT attempt failed. Fixed by adding both fields.

## Next Phase Readiness

- 8 CA Governor challengers have profile pages (politician rows with canonical external_ids)
- Governor race displays complete field with all 9 Calmatters-sourced candidates
- lavote.gov discovery row ready for discovery cron to use for LA County elections
- **Post-June-3 follow-up**: lavote.gov source_url will need new election ID for November general ballot

---
*Phase: 62-la-backlog-closure*
*Completed: 2026-05-22*
