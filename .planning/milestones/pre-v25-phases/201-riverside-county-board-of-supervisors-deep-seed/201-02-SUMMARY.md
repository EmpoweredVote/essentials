---
phase: 201-riverside-county-board-of-supervisors-deep-seed
plan: 02
subsystem: database
tags: [postgres, migration, riverside-county, board-of-supervisors, standalone-county, structural]

# Dependency graph
requires:
  - phase: 201-01
    provides: "5 valid WGS84 X0021/state=ca LOCAL geofences (riverside-ca-supervisor-district-1..5) — the migration's pre-flight gate"
provides:
  - "Standalone 'Riverside County, California, US' government (geo_id 06065, type County, NOT under State of CA)"
  - "Board of Supervisors chamber (official_count=5)"
  - "5 by-district supervisor offices on 5 LOCAL X0021 districts (1-per-district routing)"
  - "5 supervisor politicians (ext_id -4010001..-4010005) with captured UUIDs for Plans 03/04"
  - "Karen Spiegel (D2) 2026 Chair surfaced via title annotation only (no separate office)"
affects: [201-03-headshots, 201-04-stances, 201-05-banner-coverage, riverside-county-address-routing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Standalone-county structural migration (Pima 1288 near-exact template): government + chamber + 5 LOCAL districts + WITH ins_p CTE per-supervisor office blocks + office_id backfill + pre-flight/post-verify DO gates + ledger registration"
    - "Zero-DB-footprint rotational Chair as a title annotation on the sitting supervisor's seat (role_canonical stays NULL)"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1314_riverside_county_board_of_supervisors.sql
  modified: []

key-decisions:
  - "Disk-MAX confirmed 1313 → migration numbered 1314 (disk-authoritative)"
  - "ext_id block -4010001..-4010005 DB-verified unclaimed before hardcoding (0 rows)"
  - "No 06065 geo_id collision found in existing migrations (unlike Pima's 3-way 04019) — LOCAL/X0021 scoping discipline kept regardless; bare geo_id='06065' never joined; COUNTY G4020 boundary never touched"
  - "Board-only (D-01): exactly 5 offices, no constitutional-officer office; gate (d) asserts 0 appointed (contrast Pima's 1)"
  - "Chair (D-02): Spiegel D2 title-annotated 'Supervisor, District 2 (Chair)'; gate (f) asserts exactly-1 (Chair) on the -4010002 seat"

requirements-worked: [CV-01]

# Metrics
duration: 12min
completed: 2026-07-12
---

# Phase 201 Plan 02: Riverside County Board of Supervisors Structural Migration Summary

**Authored and applied to production the structural migration seeding Riverside County as a standalone county government (geo_id 06065, NOT nested under State of CA), a single Board of Supervisors chamber, 5 LOCAL X0021 supervisor-district rows on the Plan 01 geofences, and 5 by-district supervisor offices/politicians (Spiegel D2 carrying the 2026 Chair title annotation, board-only, no appointee) — post-verify gate PASSED and the 5 politician UUIDs captured for Plans 03/04.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-07-12
- **Tasks:** 3 (Task 1 executor-authored; Task 2 human-verify checkpoint → orchestrator-approved + applied inline; Task 3 read-only post-apply assertions)
- **Files modified:** 1 (new file, in the separate `C:/EV-Accounts` repo)

## Accomplishments
- Authored `1314_riverside_county_board_of_supervisors.sql` from the Pima 1288 near-exact template, substituting names/geo_id/mtfcc/ext_id and diverging on: (1) Chair sits on D2 not D3, (2) no appointee → gate (d) asserts 0 appointed, (3) no collision guard needed (kept LOCAL/X0021 scoping discipline anyway)
- Pre-checked live production before authoring: ext_id range `-4010001..-4010005` fully unclaimed (0 rows), X0021 geofences = 5, no existing Riverside government/districts, no `06065` reference anywhere in the migrations dir
- Passed the plan's automated grep gate (5× office↔district guard, `(Chair)` only on D2, no `(Chair)` on the other four, no `role_canonical = '...'`, no `slug` in chambers INSERT)
- **Roster + chair re-verified current at the Task 2 checkpoint** (operator independently confirmed against rivco district sites / Ballotpedia / KVCR-KESQ Jan-2026 chair coverage / June-2026 election results): all 5 incumbents returned, Spiegel confirmed 2026 Chair, no resignations/appointments/vacancies, no certification delta — applied with no roster patch
- Applied migration 1314 to production via `psql -f` — in-transaction post-verify DO gate emitted `Post-verification PASSED: gov=1, offices=5, appointed=0, split=0, chair_on=-4010002`, COMMIT, ledger row inserted
- Captured the 5 politician UUIDs and ran Task 3's independent post-apply assertions — combined boolean returned `t`

## Task Commits

1. **Task 1: Author the structural migration** — `93cbbc6b` (feat, in `C:/EV-Accounts` repo, branch `master`)
2. **Task 2: Roster re-verify + apply** — no code commit (DB-write-only via `psql -f`; migration file already committed in Task 1). Applied to production; ledger version `1314` count = 1.
3. **Task 3: Post-apply assertions** — no files (read-only DB assertions)

**Plan metadata:** committed with this SUMMARY.md in the `essentials` repo (see final commit).

## 5 Politician UUID Manifest (for Plans 03 headshots + 04 stances)

| District | external_id | politician UUID | full_name | Title | Party (stored, never displayed) |
|---|---|---|---|---|---|
| 1 | -4010001 | `ea521b54-7b19-459a-9993-4ce70a84d592` | Jose Medina | Supervisor, District 1 | Democratic |
| 2 | -4010002 | `9c4ae0c3-81fe-4034-8f64-e5cd6f815f6f` | Karen Spiegel | Supervisor, District 2 (Chair) | Republican |
| 3 | -4010003 | `8770fed4-7595-46e2-9103-246f3904a96b` | Chuck Washington | Supervisor, District 3 | Republican |
| 4 | -4010004 | `c986a6af-f09f-4934-83ed-1d9cd26a84f1` | V. Manuel "Manny" Perez | Supervisor, District 4 | Democratic |
| 5 | -4010005 | `26d3fdd0-7fd3-4e41-bd1c-88fb6e2dabae` | Dr. Yxstian Gutierrez | Supervisor, District 5 | Democratic |

**2026 Chair:** Karen Spiegel (D2, ext_id -4010002), surfaced ONLY via her office `title` annotation `'Supervisor, District 2 (Chair)'` — no separate office row, `role_canonical` NULL. The annotation rotates annually (board-selected); re-verify at any future re-execution. June-2026 election (D2/D4/D5 on the ballot) returned all incumbents — no certification delta at apply time (2026-07-12).

## Task 3 Post-Apply Assertion Results

| Assertion | Expected | Actual |
|---|---|---|
| (a) standalone Riverside County government (geo_id 06065, type County) | 1 | 1 ✓ |
| (b) offices under 'Board of Supervisors' chamber of that government | 5 | 5 ✓ |
| (c) each LOCAL X0021 district holds exactly 1 office | 0 violations | 0 ✓ |
| (d) is_appointed=true among the 5 | 0 | 0 ✓ |
| (e) DISTINCT linked-district state | ca (lowercase only) | ca ✓ |
| (e) DISTINCT linked-district mtfcc | X0021 only | X0021 ✓ |
| (f) section-split: offices under a non-Riverside government | 0 | 0 ✓ |
| (g) exactly 1 (Chair) annotation, on D2/-4010002 | 1 / -4010002 | 1 / -4010002 ✓ |
| Combined boolean SELECT | t | t ✓ |

Standalone-ness note: `essentials.governments` has columns `(id, name, type, state, city, geo_id)` only — there is NO parent/parent_id column, so a county government is standalone by construction (no possible FK linkage to State of California).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1314_riverside_county_board_of_supervisors.sql` — structural migration (registered). Standalone government + Board chamber (no `slug` in INSERT — GENERATED) + 5 LOCAL X0021 districts (lowercase `ca`) + 5 `WITH ins_p` per-supervisor politician/office blocks (uppercase `CA` on governments.state / offices.representing_state) + office_id backfill + pre-flight X0021 geofence gate + 6-gate post-verify DO block (a-f) + ledger registration `('1314', ...)` outside COMMIT.

## Decisions Made
- Numbered the migration 1314 (disk-MAX was 1313, confirmed via directory listing) — disk-authoritative per project convention.
- Kept gate (d) asserting `= 0` appointed (recon flagged no appointee; operator confirmed no appointment at checkpoint) — divergence from Pima's `= 1` (Cano).
- Chair annotation `(Chair)` locked to the D2/-4010002 seat via gate (f); the other four titles carry no marker; `role_canonical` NULL on all 5.
- Party affiliations authored from public record (D1 Dem, D2 Rep, D3 Rep, D4 Dem, D5 Dem), operator-confirmed accurate; stored but never displayed (antipartisan).

## Deviations from Plan

None — plan executed as written. One workflow note: the plan labeled Tasks 2/3 "ORCHESTRATOR-RUN" (written for a parallel-worktree executor with no DB access), but this plan runs as a **sequential** executor on the main tree with direct `psql` access (same as Plan 01), so the apply + UUID capture + post-apply assertions were completed inline in this session after the human-verify checkpoint was approved by the coordinator. Not a Rule 1-4 deviation — the objective given to this executor explicitly includes seeding + roster/chair verification against live sources.

## Issues Encountered
None. Migration applied on the first run; the in-transaction post-verify gate passed with no RAISE EXCEPTION; ledger registered cleanly.

## Known Stubs
None — this plan seeds the government/roster structure only. Headshots (Plan 03), compass stances (Plan 04), and the banner + coverage.js chip (Plan 05) are separate downstream plans by design, not stubs.

## Next Phase Readiness
- The 5 politician UUIDs above are the required input for Plan 03 (headshots — `politician_images` seed) and Plan 04 (evidence-only stances).
- Every Riverside County address now resolves to its ONE supervisor (X% MTFCC catch-all routes X0021 with no code change).
- `hasContext:true` for the Riverside County `coverage.js` chip should be set in Plan 05 only after ≥1 stance row exists (Plan 04), per Pima/WashCo precedent.
- No blockers for Plan 03.

---
*Phase: 201-riverside-county-board-of-supervisors-deep-seed*
*Completed: 2026-07-12*

## Self-Check: PASSED

- FOUND: .planning/phases/201-riverside-county-board-of-supervisors-deep-seed/201-02-SUMMARY.md
- FOUND: C:/EV-Accounts/backend/migrations/1314_riverside_county_board_of_supervisors.sql
- FOUND: commit 93cbbc6b (migration, C:/EV-Accounts repo)
- VERIFIED (live prod): 5 supervisor offices on LOCAL X0021 districts, gov=1, appointed=0, split=0, chair on -4010002; ledger version 1314 count=1; 5 UUIDs captured
