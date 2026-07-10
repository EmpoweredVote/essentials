---
phase: 168-nv-2026-candidate-population-statewide-us-house
plan: 01
subsystem: database
tags: [postgresql, race_candidates, elections, nevada, candidates, migration]

# Dependency graph
requires:
  - phase: 167-nv-2026-elections-discovery
    provides: 10 NV 2026 Statewide General race rows (race_ids via gen_random_uuid() in mig 1112)
  - phase: 159-nevada-state-federal-government
    provides: statewide exec politician records (Lombardo/Anthony/Aguilar/Ford/Titus/Lee/Horsford)
  - phase: 160-nevada-legislature-seed-headshots
    provides: NV legislature politician records (Nicole Cannizzaro cross-office link)
provides:
  - 21 race_candidates rows for 10 NV 2026 general-election races (6 STATE_EXEC + 4 NATIONAL_LOWER)
  - Governor of Nevada race no longer blank (Lombardo + Ford linked)
  - Cross-office D-02 links: Aaron Ford (AG->Gov) + Nicole Cannizzaro (Senator->AG)
  - Idempotent migration 1114 with 8-assertion smoke harness
affects:
  - 169-nevada-playbook-retrospective-close
  - 168-02 (Plan 02: headshots for challengers without politician records)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave-0 live-resolve pattern: race_ids from gen_random_uuid() require psql pre-check before authoring VALUES"
    - "Cross-office D-02 linking: candidate holds different DB office than the seat contested"
    - "Open-seat guard: is_incumbent=false for ALL candidates when sitting officer vacated race"
    - "Held-back comment block for unconfirmed-certified independents (D-04)"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1114_nv_2026_candidates.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1114.ts"
  modified: []

key-decisions:
  - "Aaron Ford has a Phase-159 politician record (external_id=-3200003, UUID b71cb940) as current AG — linked to Governor race as cross-office D-02 per research Pitfall 2 guidance"
  - "Nicole Cannizzaro has a Phase-160 senator record (UUID 94b171c0) — linked to AG race as cross-office D-02"
  - "Carrie Buck (NV State Senator running for NV-01): NO Phase-160 record found — politician_id NULL"
  - "Teresa Benitez-Thompson (former Assembly running for NV-02): NO record found — politician_id NULL"
  - "Zach Conine (current Treasurer, ran for AG, lost primary): zero race_candidates rows per D-03/D-04"
  - "NV-02 open-seat with 3 candidates: Flippo (R) + Benitez-Thompson (D) + Lynn Chapman (IAP, confirmed certified by 2news.com)"
  - "One migration for all 10 races vs. split: one migration (1114) per planner recommendation; idempotent by section"

patterns-established:
  - "NV House ext_id scheme confirmed: -32001 (NV-01 Titus), -32002 (NV-02 Amodei retired), -32003 (NV-03 Lee), -32004 (NV-04 Horsford)"
  - "NV STATE_EXEC ext_id scheme confirmed: -3200001 (Lombardo), -3200002 (Anthony), -3200003 (Ford/AG), -3200004 (Aguilar), -3200005 (Conine), -3200006 (Matthews)"

requirements-completed: [NV-CAND-01]

# Metrics
duration: 25min
completed: 2026-06-30
---

# Phase 168 Plan 01: NV 2026 Candidate Population (Statewide + US House) Summary

**21 race_candidates rows applied to live DB for all 10 NV 2026 general-election races via idempotent migration 1114 — Governor race no longer blank (Lombardo+Ford), 7 incumbents linked, 2 cross-office D-02 links resolved (Ford/Cannizzaro), AG+Treasurer open-seat guards clean, all 8 smoke assertions pass**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-06-30T01:09:04Z
- **Completed:** 2026-06-30
- **Tasks:** 2 (Wave-0 resolve + author/apply migration)
- **Files modified:** 2 (1114 SQL + harness TS)

## Accomplishments
- Wave-0 live-resolved all 10 race_id UUIDs (gen_random_uuid() in mig 1112 — cannot be predicted without live query)
- Resolved all incumbent politician_ids + cross-office links (Aaron Ford as AG->Governor challenger; Nicole Cannizzaro as Senator->AG challenger)
- Applied migration 1114 to production DB: 21 race_candidates rows across 10 races; idempotency confirmed (re-run inserts 0)
- All 8 smoke harness assertions pass: total count, STATE_EXEC ≥2, NATIONAL_LOWER ≥2, no multi-incumbent, open-seat guards, idempotency, active status, Conine absent

## Wave-0 Resolved Mapping

### Race IDs (resolved from essentials.races WHERE election='NV 2026 Statewide General')
| Office | race_id | district_type |
|--------|---------|---------------|
| Governor of Nevada | 7744880b-82b1-404a-9f48-58a505debcd5 | STATE_EXEC |
| Lieutenant Governor of Nevada | f45501be-ba2f-4e0e-b7d2-b55c187e32a9 | STATE_EXEC |
| Attorney General of Nevada | b5cfa5be-0eda-452b-b9e4-99b75f090ee1 | STATE_EXEC |
| Secretary of State of Nevada | 717fee53-f871-41fd-a350-233c8da669f5 | STATE_EXEC |
| State Treasurer of Nevada | 1dc513cd-30d0-4eb6-9af6-917a8525c14e | STATE_EXEC |
| State Controller of Nevada | 0180490c-b2e0-4b9b-9514-92382279fc9f | STATE_EXEC |
| U.S. Representative District 1 | a5295941-38b1-4c7f-8edf-39097ad3fb0a | NATIONAL_LOWER |
| U.S. Representative District 2 | 0c470cc0-5250-43f1-b7f7-57778cadacc6 | NATIONAL_LOWER |
| U.S. Representative District 3 | 79e7fb35-a73a-478c-847d-553e9ad11e7c | NATIONAL_LOWER |
| U.S. Representative District 4 | 81eb1a27-b710-42c3-a27c-a2c0153c2820 | NATIONAL_LOWER |

### Candidate -> politician_id Mapping
| Race | Candidate | is_incumbent | politician_id | Notes |
|------|-----------|-------------|---------------|-------|
| Governor | Joe Lombardo | true | f8e66045 | Phase 159, ext -3200001 |
| Governor | Aaron Ford | false | b71cb940 | Cross-office D-02: current AG (ext -3200003) running for Gov |
| Lt. Governor | Stavros Anthony | true | 1997a34f | Phase 159, ext -3200002 |
| Lt. Governor | Sandra Jauregui | false | NULL | No record |
| AG (open) | Nicole Cannizzaro | false | 94b171c0 | Cross-office D-02: NV State Senator (Phase 160) running for AG |
| AG (open) | Adriana Guzman Fralick | false | NULL | No record |
| SoS | Cisco Aguilar | true | dbf13dfe | Phase 159, ext -3200004 |
| SoS | Jim Marchant | false | NULL | No record |
| Treasurer (open) | Tya Mathis-Coleman | false | NULL | No record |
| Treasurer (open) | Drew Johnson | false | NULL | No record |
| Controller | Andy Matthews | true | 07a8598f | Phase 159, ext -3200006 (confirmed mig 1050) |
| Controller | Michael MacDougall | false | NULL | No record |
| NV-01 | Dina Titus | true | 786af5d2 | Phase 159, ext -32001 |
| NV-01 | Carrie Buck | false | NULL | NV State Senator but no Phase-160 record found |
| NV-02 (open) | David Flippo | false | NULL | No record |
| NV-02 (open) | Teresa Benitez-Thompson | false | NULL | Former Assembly; no Phase-160 record (current members only) |
| NV-02 (open) | Lynn Chapman | false | NULL | IAP; confirmed certified by 2news.com |
| NV-03 | Susie Lee | true | 325c7cae | Phase 159, ext -32003 |
| NV-03 | Marty O'Donnell | false | NULL | No record |
| NV-04 | Steven Horsford | true | 7644cd40 | Phase 159, ext -32004 |
| NV-04 | Cody Whipple | false | NULL | No record |

### Held-Back Candidates (D-04 — not yet certified as of 2026-06-30)
- Governor: Christopher Battenberg, Max Beck, Danielle Ford, Jordan Koteras, Allen Rheinhart, Emilio R. Rodriguez, John T. Scott (declared independents; Clark County PDF confirms Battenberg NPP but formal SoS certification not confirmed)
- NV-01: Bobby Khan, Steven St John, Anthony Thomas Jr., Victor Willert, J.E. Houston (listed on Wikipedia as general candidates but official NV SoS certification not confirmed from primary source)

## Task Commits

1. **Task 1: Wave-0 live-resolve race_ids and politician_ids** — no file commit (data-gathering only; results embedded in Task 2 migration)
2. **Task 2: Author + apply migration 1114** — `80a0f616` in C:/EV-Accounts repo (feat: seed NV 2026 general-election candidates)

**Plan metadata:** (essentials repo commit — see below)

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1114_nv_2026_candidates.sql` — 21 race_candidates INSERT rows for 10 NV 2026 races; idempotent NOT EXISTS; no schema_migrations ledger row; held-back comment block
- `C:/EV-Accounts/backend/scripts/_apply-migration-1114.ts` — 8-assertion smoke harness; gitignored per repo rules

## Decisions Made
- Aaron Ford cross-office link confirmed: he exists as current AG (ext -3200003, UUID b71cb940) — linked to Governor race as D-02 per Pitfall 2 guidance
- Adriana Guzmán Fralick: name stored without accented characters in DB ("Guzman Fralick") for SQL portability and search normalization
- One migration for all 10 races (not split): 21 rows is small enough; two INSERT sections (statewide/House) for clarity
- Andy Matthews: used hardcoded UUID (not ext_id subquery) in migration for consistency with other incumbents; UUID 07a8598f confirmed matches ext -3200006

## Deviations from Plan

None — plan executed exactly as written. Wave-0 resolved all data successfully before authoring VALUES.

## Issues Encountered
None. All 8 smoke assertions passed on first run.

## Next Phase Readiness
- Plan 02 (headshots for challengers): 11 candidates need politician records + photos via find-headshots flow: Sandra Jauregui, Adriana Guzman Fralick, Jim Marchant, Tya Mathis-Coleman, Drew Johnson, Michael MacDougall, Carrie Buck, David Flippo, Teresa Benitez-Thompson, Lynn Chapman, Marty O'Donnell, Cody Whipple (12 total)
- Live app: NV address on /elections now shows real candidates for all 10 races; Governor race no longer blank
- Browse link: essentials.empowered.vote/results?browse_state_officials=NV (use state browse for NV statewide)
- Next migration counter: **1115**

## Threat Flags

None. Pure developer-authored literal INSERT migration — no user input, no new auth surface, no new endpoints.

## Self-Check

- [x] `C:/EV-Accounts/backend/migrations/1114_nv_2026_candidates.sql` exists
- [x] Commit `80a0f616` exists in C:/EV-Accounts repo (git -C verified)
- [x] All 8 smoke assertions passed: total=21, STATE_EXEC<2=0, NATIONAL_LOWER<2=0, multi-incumbent=0, open-seat incumbents=0, idempotency 21==21, non-active=0, Conine=0
- [x] No schema_migrations row added

## Self-Check: PASSED

---
*Phase: 168-nv-2026-candidate-population-statewide-us-house*
*Completed: 2026-06-30*
