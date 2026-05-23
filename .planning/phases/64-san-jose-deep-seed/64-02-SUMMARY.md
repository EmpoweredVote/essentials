---
phase: 64-san-jose-deep-seed
plan: 02
subsystem: database
tags: [postgres, supabase, san-jose, officials, politicians, offices, migrations]

# Dependency graph
requires:
  - phase: 64-01-sj-geofences-government-structure
    provides: essentials.governments row (City of San Jose), 2 chambers (Mayor + City Council), 11 districts (10 LOCAL + 1 LOCAL_EXEC geo_id=0668000)
provides:
  - 11 San Jose politicians in essentials.politicians (external_ids -640001, -640010..-640019)
  - 11 office rows in essentials.offices, each linked to correct district and chamber
  - office_id back-filled on all 11 politicians (non-NULL)
  - End-to-end routing: SJ City Hall -> Anthony Tordillos (District 3)
  - Mayor routing: Matt Mahan linked to LOCAL_EXEC district geo_id=0668000
  - Migration 218 applied idempotently
affects: [64-03-sj-headshots, 69-landing-elections-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - WITH ins_p AS (INSERT ... ON CONFLICT (external_id) DO NOTHING RETURNING id) CROSS JOIN pattern
    - NOT EXISTS guard prevents duplicate office rows on re-run
    - office_id back-fill UPDATE as final section (required for headshot worklist JOIN)

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/218_sj_officials.sql
  modified: []

key-decisions:
  - "No City Attorney or City Auditor seeded — both appointed per SJ Charter; is_appointed_position=false for all 11 elected officials"
  - "party=NULL for all 11 politicians (antipartisan design)"
  - "D3 incumbency: Anthony Tordillos (NOT Omar Torres who resigned; Tordillos won special election Aug 2025)"
  - "D10 incumbency: George Casey (NOT Arjun Batra who lost Nov 2024)"
  - "geofence_boundaries.state='06' vs districts.state='CA' — join on geo_id alone for routing; state fields differ by design"

patterns-established:
  - "SJ external_id range: Mayor=-640001, Council D1-D10 = -640010..-640019"
  - "Mayor office uses LOCAL_EXEC district WHERE d.geo_id='0668000' AND d.district_type IN ('LOCAL','LOCAL_EXEC')"
  - "geofence_boundaries state='06' does NOT match districts state='CA' — join on geo_id only, not state"

# Metrics
duration: 8min
completed: 2026-05-23
---

# Phase 64 Plan 02: San Jose Officials Seed Summary

**11 San Jose politicians (Mayor Matt Mahan + 10 council members D1-D10) seeded via migration 218 with office rows, chamber links, and office_id back-fill; end-to-end address routing confirmed**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-23T07:23:12Z
- **Completed:** 2026-05-23T07:31:34Z
- **Tasks:** 2
- **Files created:** 1

## Accomplishments
- Migration 218 applied: 11 politician INSERTs + 11 office INSERTs + UPDATE 11 office_id back-fills
- SJ City Hall (-121.88, 37.335) resolves to Anthony Tordillos, Council Member (District 3)
- Mayor Matt Mahan linked to LOCAL_EXEC district geo_id=0668000; routing confirmed
- Section-split detector: 0 rows (clean)
- office_id NULL count: 0 (all 11 back-filled; Plan 64-03 headshot worklist query will return 11 rows)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write migration 218_sj_officials.sql** - committed as part of combined task commit
2. **Task 2: Apply migration 218 and verify end-to-end routing** - `e730653` (feat)

**Plan metadata:** see final commit below

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/218_sj_officials.sql` - 11 WITH ins_p blocks (D1-D10 council + Mayor); office_id back-fill UPDATE; BEGIN/COMMIT wrapped; ON CONFLICT idempotency guards

## Decisions Made
- **No City Attorney or City Auditor:** Both appointed by City Council per San Jose Charter. Seeding them as is_appointed_position=false would be factually wrong. Scope strictly Mayor + 10 council members.
- **D3 = Anthony Tordillos:** Omar Torres resigned in disgrace; Tordillos won the special general runoff (June 24, 2025, 64.3%), sworn in Aug 12, 2025. ArcGIS COUNCILMEMBER field confirms Tordillos.
- **D10 = George Casey:** Casey defeated Arjun Batra in Nov 2024. Batra is no longer the incumbent.
- **party=NULL everywhere:** Antipartisan design — no party field set even where party is known.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Routing verification query had join condition mismatch**
- **Found during:** Task 2 (V4 end-to-end routing check)
- **Issue:** Plan's verification query joined `d.state = gb.state` but `geofence_boundaries.state='06'` (FIPS) while `districts.state='CA'` (ISO). This caused 0 rows on the exact query in the plan.
- **Fix:** Dropped the `d.state = gb.state` join condition in verification; confirmed the actual application routing (which uses geo_id join) returns Anthony Tordillos correctly.
- **Impact:** Routing works as intended. The join discrepancy is by design — FIPS vs ISO state codes have always been separate fields. No data change required.
- **Committed in:** e730653 (Task 2 commit)

---

**Total deviations:** 1 auto-diagnosed (query join condition; no code change needed — routing confirmed working)
**Impact on plan:** No scope creep. The routing functions correctly; only the verification query syntax differed from what the plan specified.

## Issues Encountered
- psql -c with Unicode em-dash in comments caused encoding error on Windows. Resolved by writing SQL to /tmp files and using psql -f.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- **Plan 64-03 (SJ Headshots):** All prerequisites met. 11 politicians exist with non-NULL office_id. The headshot worklist JOIN (politicians JOIN offices ON o.id = p.office_id WHERE p.external_id BETWEEN -640019 AND -640001) will return 11 rows.
- **sanjoseca.gov WAF:** Node.js fetch with Chrome User-Agent + Referer header required (CivicPlus platform, same as fremont.gov). The /find-headshots skill handles this.
- **No blockers.**

---
*Phase: 64-san-jose-deep-seed*
*Completed: 2026-05-23*
