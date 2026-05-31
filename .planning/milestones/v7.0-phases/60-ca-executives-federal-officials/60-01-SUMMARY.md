---
phase: 60-ca-executives-federal-officials
plan: 01
subsystem: database
tags: [postgresql, supabase, migration, ca-federal, house-reps, senators, geofencing]

# Dependency graph
requires:
  - phase: 57-ca-geofences
    provides: CA congressional district boundaries in geofence_boundaries + 52 NATIONAL_LOWER districts in essentials.districts
  - phase: 59-ca-government-db
    provides: CA government row, 8 executive chambers, 8 constitutional officers with office rows

provides:
  - 34 new CA US House representatives seeded with politician + office rows (CDs 01-22, 24-25, 39-41, 46-52)
  - Alex Padilla external_id corrected from 666262 to -6000201, party set to Democratic
  - Pete Aguilar external_id assigned (-6000204, was NULL)
  - Tony Cárdenas external_id assigned (-6000203) and stale CD-29 office deactivated
  - Senator office guards for Padilla and Schiff on CA NATIONAL_UPPER district
  - SF Civic Center → CD-11 → Nancy Pelosi routing confirmed end-to-end
  - New -60003xx external_id scheme established for CA House reps

affects:
  - 60-02-ca-executives-federal-officials (headshots phase — uses these politician rows)
  - future CA stances/elections phases
  - any CA address routing queries (all 52 CDs now have politicians)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "-60003xx external_id scheme for CA federal House reps (CDs 01-52 → -6000301 to -6000352)"
    - "Cardenas deactivation via is_vacant=true on office row while keeping politician row"
    - "Senator office guard using (district_id, politician_id) uniqueness check"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/193_ca_federal_officials.sql"
  modified: []

key-decisions:
  - "CA House rep external_ids use -60003xx scheme (not -100049..-100117 as planned): the -100049..-100119 range was occupied by CA State Assembly members (pre-existing seed)"
  - "Pete Aguilar assigned -6000204 (not -100097 as planned): -100097 was occupied by Josh Lowenthal (CA Assembly)"
  - "Two Tony Cárdenas rows existed (accented + non-accented); targeted the one with office rows using id subquery"
  - "Total CA NATIONAL_LOWER office count is 53 (not 52): CD-29 correctly has 2 rows — Luz Rivas active + Cárdenas deactivated"

patterns-established:
  - "CA federal House rep external_ids: -6000301 (CD-01) through -6000352 (CD-52), matching CD number in last 2 digits where no gap"
  - "Stale rep row handling: assign external_id + set is_vacant=true on office row; politician row stays"

# Metrics
duration: 14min
completed: 2026-05-21
---

# Phase 60 Plan 01: CA Federal Officials Migration Summary

**Migration 193 seeds 34 CA House reps using -60003xx external_id scheme, fixes Padilla/Aguilar/Cárdenas data, and confirms SF → CD-11 → Nancy Pelosi end-to-end routing**

## Performance

- **Duration:** 14 min
- **Started:** 2026-05-21T19:53:09Z
- **Completed:** 2026-05-21T20:07:00Z
- **Tasks:** 3 of 3
- **Files modified:** 1

## Accomplishments
- Migration 193 applied: 34 new CA US House rep politicians + office rows (CDs 01-22, 24-25, 39-41, 46-52) using -60003xx external_id scheme
- 3 data fixes applied: Padilla external_id 666262→-6000201 + party='Democratic'; Pete Aguilar external_id NULL→-6000204; Tony Cárdenas external_id NULL→-6000203 + office deactivated
- SF Civic Center (-122.4191, 37.7792) returns Nancy Pelosi via CD-11 — full geofence→district→office→politician chain confirmed
- Both CA senators (Padilla -6000201 + Schiff -100047) linked to CA NATIONAL_UPPER district with Senator office rows

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 193_ca_federal_officials.sql** - migration file created (no git commit — EV-Accounts is not a git repo)
2. **Task 2: Apply migration and verify** - applied via psql; 6 verification queries passed
3. **Task 3: SF Civic Center smoke test** - Nancy Pelosi confirmed

**Plan metadata:** (see docs commit below)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/193_ca_federal_officials.sql` - Migration 193: 34 House reps + 3 data fixes + senator guards + office_id back-fill

## Decisions Made

- **-60003xx scheme for CA House reps**: The plan assigned IDs in the -100049..-100117 range. First execution attempt revealed that entire range is occupied by CA State Assembly members (pre-seeded from earlier work). Switched to -6000301..-6000352 (matching CD number in last 2 digits), consistent with the -60001xx (CA exec) and -60002xx (CA senator) conventions.
- **Pete Aguilar: -6000204 not -100097**: -100097 was occupied by Josh Lowenthal (CA Assembly). Used -6000204 in the -60002xx range (former House rep promoted to senator territory — OK since Aguilar is a sitting House rep needing a stable ID).
- **Tony Cárdenas UPDATE targeted by office_count**: Two rows existed — 'Tony Cárdenas' (accented, 1 office) and 'Tony Cardenas' (non-accented, 0 offices). Used a subquery joining offices to target exactly the politician with a stale office row.
- **Final CA NATIONAL_LOWER count is 53**: CD-29 has 2 rows (Rivas active + Cárdenas deactivated), which is expected and correct per plan spec.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] External_id range collision — rewrote all 34 rep IDs to use -60003xx scheme**
- **Found during:** Task 2 (first migration apply attempt)
- **Issue:** Plan specified -100049..-100117 for 34 new House reps, but that range is occupied by CA State Assembly (pre-existing seed). First run hit duplicate key constraint on -100097 (Josh Lowenthal) while trying to update Pete Aguilar.
- **Fix:** Rewrote migration Section 2 to use -6000301..-6000352 (CD number as last 2 digits), Section 4 BETWEEN clause updated to IN list, Aguilar fix changed to -6000204.
- **Files modified:** `C:/EV-Accounts/backend/migrations/193_ca_federal_officials.sql`
- **Verification:** Migration applied cleanly; all 34 INSERT 0 1 confirmations; spot-check verified LaMalfa (-6000301/0601), Khanna (-6000317/0617), Vargas (-6000352/0652)

**2. [Rule 1 - Bug] Tony Cárdenas UPDATE required subquery to avoid targeting duplicate name rows**
- **Found during:** Task 1 (writing migration), confirmed during Task 2
- **Issue:** Two politician rows exist for Tony Cárdenas — one accented (real, has office) and one non-accented (campaign finance artifact, no office). Using OR on both names with a single external_id slot would fail on the second update.
- **Fix:** Used a subquery `WHERE id = (SELECT p.id ... JOIN offices ... LIMIT 1)` to target exactly the politician with an existing office row.
- **Files modified:** `C:/EV-Accounts/backend/migrations/193_ca_federal_officials.sql`
- **Verification:** UPDATE 1 (exactly one row updated); external_id=-6000203 confirmed; office row deactivated

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes necessary for correct execution. External_id numbering scheme deviation is documented for future phases. No scope creep.

## Issues Encountered
- psql encoding error when running queries with accented characters inline (e.g. 'Tony Cárdenas' in -c flag). Workaround: quoted the character in the SQL file and used -f flag for application; used external_id lookups for verification queries.
- Supabase Management API JWT verification failed with service role key (401). Switched to direct psql connection using DATABASE_URL — same approach used in Phase 59.

## Next Phase Readiness
- All 52 CA congressional districts have politician + office rows; CA federal routing fully operational
- Next plan is 60-02 (headshots for CA House reps + senators)
- Next migration is 194
- CA House reps use external_id scheme -6000301..-6000352 (document for headshot ingestion phase)
- Padilla office_id was not back-filled (UPDATE 0 — he already had office_id set from original seed); no action needed

---
*Phase: 60-ca-executives-federal-officials*
*Completed: 2026-05-21*
