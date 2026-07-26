---
phase: 194-city-of-tucson-deep-seed
plan: 02
subsystem: database
tags: [migration, governments, chambers, districts, offices, tucson, local_exec, vice-mayor]

requires:
  - phase: 194-01
    provides: 6 X0020 ward geofences that the LOCAL ward districts + pre-flight gate consume
  - phase: 190 (AZ foundation)
    provides: whole-city G4110 geofence (geo_id 0477000) reused by the new LOCAL_EXEC Mayor district
provides:
  - Greenfield 'City of Tucson, Arizona, US' government (geo_id 0477000, type City)
  - 'City Council' chamber (official_count 7) with 7 offices — at-large Mayor + 6 by-ward members
  - 1 NEW LOCAL_EXEC/G4110/0477000 Mayor district (Pitfall 5) + 6 LOCAL/X0020 ward districts
  - Vice Mayor as title annotation on Ward 1 (Santa Cruz) — no 8th office
  - 7 politician UUIDs (ext_id -4008001..-4008007) for Plans 03 (headshots) and 04 (stances)
affects: [194-03, 194-04, 194-05, 194-06]

tech-stack:
  added: []
  patterns:
    - "One-chamber-two-district-types: at-large LOCAL_EXEC Mayor + LOCAL ward members in a single City Council chamber (Beaverton/La Verne precedent)"
    - "New LOCAL_EXEC districts row reusing a pre-existing whole-city G4110 geofence (no geometry work) — the Mayor-routing row Pima never needed (Pitfall 5)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1296_city_of_tucson.sql
  modified: []

key-decisions:
  - "Vice Mayor modeled as a title annotation on the sitting Ward 1 seat (D-05), identical shape to Phase 193's Pima Chair — role_canonical stays NULL on all 7"
  - "All 7 stored party='Democratic' (D-04) — stored, never displayed (antipartisan)"
  - "Departed members Fimbres (Ward 5) and Kozachik (Ward 6) NOT seeded — Barajas/Schubert are the Dec-2025 successors"

patterns-established:
  - "Every office↔district join scoped by district_type + mtfcc + state='az' to guard the 0477000 collision (geofence stores it as FIPS '04'); never a bare geo_id join"

requirements-completed: [TUC-01]

duration: ~20min
completed: 2026-07-10
---

# Phase 194 Plan 02: Greenfield City of Tucson Structural Seed Summary

**Greenfield City of Tucson government + City Council chamber + 7 offices (at-large Mayor on a NEW LOCAL_EXEC/G4110 district + 6 ward members on LOCAL X0020 districts) applied to production; Vice Mayor is a title annotation on the Ward 1 seat, no 8th office.**

## Performance

- **Duration:** ~20 min
- **Tasks:** 3 (author migration → blocking roster-currency checkpoint + apply → post-apply assertions)
- **Files modified:** 1 (in C:/EV-Accounts)

## Accomplishments
- Authored & applied structural migration `1296_city_of_tucson.sql` (disk-MAX 1295 → 1296).
- Seeded greenfield government `City of Tucson, Arizona, US` (geo_id 0477000, type City) + `City Council` chamber (official_count 7).
- Created 6 LOCAL/X0020 ward districts + 1 **new** LOCAL_EXEC/G4110/0477000 Mayor district (Pitfall 5 — reuses the Phase-190 geofence, no geometry work).
- Seeded 7 politicians/offices; Vice Mayor surfaced as `Council Member, Ward 1 (Vice Mayor)` on Santa Cruz's seat only — no separate 8th office; `role_canonical` NULL on all 7.
- In-transaction post-verify DO gate passed (`gov=1, offices=7, exec_district=1, split=0, vice_mayor_on=-4008002`); ledger registered.

## 7 Politician UUID Manifest (for Plans 03/04)

| ext_id | UUID | full_name | seat |
|---|---|---|---|
| -4008001 | 27e6aaca-8af5-4ec5-a30b-ac4aa19d2df5 | Regina Romero | Mayor (at-large) |
| -4008002 | 4c8cda02-3918-4593-b225-b22651b194d0 | Lane Santa Cruz | Ward 1 (Vice Mayor) |
| -4008003 | 29c8d055-b661-4940-a052-20eece394d6f | Paul Cunningham | Ward 2 |
| -4008004 | 3265b939-5585-4edc-a524-2841c7fe6f3d | Kevin Dahl | Ward 3 |
| -4008005 | a289a080-4a6c-4a46-8772-84c02c2d4903 | Nikki Lee | Ward 4 |
| -4008006 | 01feb7ad-df57-42bd-9533-073a9edf8c52 | Selina Barajas | Ward 5 |
| -4008007 | bf1901df-040d-4005-86e9-ef3e975295b7 | Miranda Schubert | Ward 6 |

## Task Commits
1. **Task 1: Author migration** — `4ca56981` (feat) — committed to `C:/EV-Accounts`
2. **Task 2: Blocking roster-currency verify + apply** — human-approved ("Confirmed — apply 1296"); applied via `psql -f`
3. **Task 3: Post-apply assertions** — read-only; combined boolean returned `t`

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1296_city_of_tucson.sql` — greenfield gov + chamber + 7 districts + 7 offices, pre-flight + post-verify gates, ledger registration

## Decisions Made
- Followed plan exactly. Vice Mayor confirmed as Lane Santa Cruz (Ward 1) at the roster checkpoint (annotation rotates annually — informational for future re-verify).

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- 7 offices live and routable (X% catch-all + G4110 LOCAL_EXEC mapping route wards + Mayor with no code change).
- 7 UUIDs captured → Plans 03 (headshots) and 04 (stances) can bind by external_id / UUID.

---
*Phase: 194-city-of-tucson-deep-seed*
*Completed: 2026-07-10*
