---
phase: 113-ma-stances-house-wave-1
plan: "02"
subsystem: inform/compass
tags: [stances, massachusetts, house, essex-county, evidenced-only]
dependency_graph:
  requires:
    - 113-01 (wave 1 stances HD-01–HD-20)
  provides:
    - Compass stances for 20 MA House reps HD-21–HD-40
  affects:
    - inform.politician_answers
    - inform.politician_context
tech_stack:
  added: []
  patterns:
    - ON CONFLICT upsert for both politician_answers and politician_context
    - AOM green_check/red_x parsing for co-sponsorship detection
    - psql CLI with DATABASE_URL (mcp__supabase-local unavailable)
key_files:
  created:
    - C:/EV-Accounts/backend/migrations/448_daniel_cahill_stances.sql
    - C:/EV-Accounts/backend/migrations/449_sean_reid_stances.sql
    - C:/EV-Accounts/backend/migrations/450_thomas_walsh_stances.sql
    - C:/EV-Accounts/backend/migrations/451_sally_kerans_stances.sql
    - C:/EV-Accounts/backend/migrations/452_adrianne_ramos_stances.sql
    - C:/EV-Accounts/backend/migrations/453_ryan_hamilton_stances.sql
    - C:/EV-Accounts/backend/migrations/454_francisco_paulino_stances.sql
    - C:/EV-Accounts/backend/migrations/455_frank_moran_stances.sql
  modified: []
decisions:
  - "Thomas Walsh (HD-35) zero AOM co-sponsorships — moderate Democrat; stances extracted from sponsored bills only (healthcare, housing, economic-development)"
  - "Ryan Hamilton voting-rights topic UUID corrected: c0b71b2f invalid -> d1792200-1d3b-4955-a0b7-0e6980d7a7b2"
  - "Francisco Paulino ai-regulation UUID corrected: 4559b513 (data-centers) invalid -> 666bf03d-81fc-4138-ab15-69ae734c9023"
  - "Frank Moran fossil-fuels value=4.0 (not 5.0): pipeline safety reform bills reflect accountability/transparency framing, not elimination; renewable energy sponsorship signals transition support rather than total fossil fuel opposition"
metrics:
  duration: "~3 hours"
  completed: "2026-06-11"
  tasks_completed: 8
  files_created: 8
---

# Phase 113 Plan 02: MA House Wave 1 Stances (HD-21–HD-40) Summary

Evidence-only compass stances for 20 MA House representatives HD-21 through HD-40 (12th Bristol through 17th Essex Districts). Migrations 448–455 applied to production Supabase. All 20 reps from this wave had been completed across plans 01 and 02.

## Stance Counts Per Representative (HD-33 through HD-40, this plan)

| External ID | Name | District | Migration | Stance Count | Notes |
|-------------|------|----------|-----------|--------------|-------|
| -210073 | Daniel F. Cahill | 10th Essex (Lynn) | 448 | 7 new (16 total) | Chair JC Environment; Safe Communities; H.1472-1474 housing |
| -210074 | Sean Reid | 11th Essex (Lynn/Nahant) | 449 | 4 | H.1557 tenant protections; H.1295-1296 healthcare; H.2326 wetlands |
| -210075 | Thomas J. Walsh | 12th Essex (Peabody) | 450 | 3 | No AOM co-sponsorships; H.1343 direct primary care; H.1574 homebuyer rights |
| -210076 | Sally P. Kerans | 13th Essex (Danvers) | 451 | 5 | AOM Abortion Access + LGBTQ+ + Indigenous; H.1814 tenant advocate; H.1815 abortion |
| -210077 | Adrianne P. Ramos | 14th Essex (North Andover) | 452 | 7 new (16 total) | H.3547 prevent gas expansion (5.0 anti-fossil); AOM Abortion/LGBTQ+/Cherish/THRIVE |
| -210078 | Ryan M. Hamilton | 15th Essex (Haverhill) | 453 | 5 | AOM Cherish/THRIVE/LGBTQ+/VotingRights; H.595 school mental health; H.1509 housing cooperatives |
| -210079 | Francisco E. Paulino | 16th Essex (Methuen) | 454 | 5 new (16 total) | House Climate Action Committee; H.3208 digital ad tax; H.1931 AI/child exploitation |
| -210080 | Frank A. Moran | 17th Essex (Lawrence) | 455 | 9 new (17 total) | AOM Safe Communities/THRIVE/LGBTQ+; H.274 homelessness rights; H.3530-3534 gas reform |

## Full Wave Results (Plans 01 + 02 Combined, HD-21–HD-40)

| External ID | Name | District | Stance Count | Blank? |
|-------------|------|----------|--------------|--------|
| -210061 | Norman J. Orrall | 12th Bristol | 3 | No |
| -210062 | Antonio F. Cabral | 13th Bristol | 15 | No |
| -210063 | Adam J. Scanlon | 14th Bristol | 15 | No |
| -210064 | Dawne Shand | 1st Essex | 17 | No |
| -210065 | Kristin Kassner | 2nd Essex | 5 | No |
| -210066 | Andres X. Vargas | 3rd Essex | 19 | No |
| -210067 | Estela A. Reyes | 4th Essex | 17 | No |
| -210068 | Andrew F. Tarr | 5th Essex | 0 | YES — intentional (newer rep, no sponsored bills) |
| -210069 | Hannah L. Bowen | 6th Essex | 13 | No |
| -210070 | Manny Cruz | 7th Essex | 9 | No |
| -210071 | Jennifer Balinsky Armini | 8th Essex | 15 | No |
| -210072 | Donald H. Wong | 9th Essex (Saugus) | 13 | No (pre-existing rows only) |
| -210073 | Daniel F. Cahill | 10th Essex (Lynn) | 16 | No |
| -210074 | Sean Reid | 11th Essex (Lynn/Nahant) | 4 | No |
| -210075 | Thomas J. Walsh | 12th Essex (Peabody) | 3 | No |
| -210076 | Sally P. Kerans | 13th Essex (Danvers) | 5 | No |
| -210077 | Adrianne P. Ramos | 14th Essex (N. Andover) | 16 | No |
| -210078 | Ryan M. Hamilton | 15th Essex (Haverhill) | 5 | No |
| -210079 | Francisco E. Paulino | 16th Essex (Methuen) | 16 | No |
| -210080 | Frank A. Moran | 17th Essex (Lawrence) | 17 | No |

**Phase-wide totals:** 20 rows; uncited=0; unpaired=0.

## Reps with Blank Spokes (Intentional)

- **Andrew F. Tarr (-210068, HD-28)**: Newer Democratic rep for 5th Essex (Gloucester area). No sponsored bills in 194th General Court, no committees, no AOM profile. Blank spokes are correct per D-01.

## Reps with Pre-Existing Rows Only (No New Stances from this Research)

- **Donald H. Wong (-210072, HD-32)**: Republican, only 1 local retirement bill sponsored. Did not co-sponsor any tracked bills. 13 pre-existing rows from prior AOM agent run retained; no new evidence found. Migration 447 is a blank BEGIN/COMMIT.

## Source Domains Used

| Source | Usage |
|--------|-------|
| malegislature.gov/Bills/194/HXXXX | Primary bill evidence for all reps |
| actonmass.org/legislators/* | Co-sponsorship tracking (AOM green_check/red_x parsing) |
| malegislature.gov/Legislators/Profile/*/Committees | Committee assignments |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong voting-rights topic UUID in migration 453 (Ryan Hamilton)**
- **Found during:** Task 19 apply step — foreign key constraint violation
- **Issue:** Used UUID `c0b71b2f-fa77-4bde-9ef0-57deb3e6c040` which does not exist in compass_topics
- **Fix:** Queried DB for correct voting-rights UUID → `d1792200-1d3b-4955-a0b7-0e6980d7a7b2`
- **Files modified:** `C:/EV-Accounts/backend/migrations/453_ryan_hamilton_stances.sql`
- **Commit:** 5176a17

**2. [Rule 1 - Bug] Wrong ai-regulation topic UUID in migration 454 (Francisco Paulino)**
- **Found during:** Task 20 apply step — foreign key constraint violation
- **Issue:** Used UUID `4559b513-c1b6-4b44-a31e-e1aa9f1fbddb` (the data-centers topic from Phase 111 patterns) for ai-regulation
- **Fix:** Queried DB for correct ai-regulation UUID → `666bf03d-81fc-4138-ab15-69ae734c9023`
- **Files modified:** `C:/EV-Accounts/backend/migrations/454_francisco_paulino_stances.sql`
- **Commit:** 41f054b

### UUID Reference Corrections for Future Plans

The following UUIDs were found to be incorrect in working memory vs. the live DB:
- **ai-regulation**: Use `666bf03d-81fc-4138-ab15-69ae734c9023` (not `4559b513-c1b6-4b44-a31e-e1aa9f1fbddb`)
- **voting-rights**: Use `d1792200-1d3b-4955-a0b7-0e6980d7a7b2` (not `c0b71b2f-fa77-4bde-9ef0-57deb3e6c040`)

### Context

Plan 02 of Phase 113 continued from a context-compacted session. Tasks 1–13 were completed before compaction (migrations 436–447); Tasks 14–21 were completed in this session (migrations 448–455).

## Known Stubs

None — all stances have concrete legislative evidence. No placeholder values or "coming soon" patterns.

## Threat Flags

None. No new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- Migration files 448–455 exist at C:/EV-Accounts/backend/migrations/
- Phase-wide DB verification: 20 rows, uncited=0, unpaired=0
- Git commits: 8224f76 (Cahill), a0663c4 (Reid), 560035f (Walsh), 21270fb (Kerans), a034548 (Ramos), 5176a17 (Hamilton), 41f054b (Paulino), febe2ca (Moran)
