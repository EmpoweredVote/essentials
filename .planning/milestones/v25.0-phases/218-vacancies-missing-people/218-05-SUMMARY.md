---
phase: 218-vacancies-missing-people
plan: 05
subsystem: database
tags: [postgres, sql-verification, collin-county-tx, municipal-offices, phase-gate]

requires:
  - phase: 218-01
    provides: "6 missing office rows (Blue Ridge +1, Lowry Crossing +4, Weston +1)"
  - phase: 218-02
    provides: "20 directly-cited incumbents seated across 10 Collin County, TX councils"
  - phase: 218-03
    provides: "7 deeper D-04 re-verified seats (Fairview, Van Alstyne, Nevada, Lucas)"
  - phase: 218-04
    provides: "12 sourced headshots + audit migration for newly-seated officials"
provides:
  - "Re-runnable full SQL verification battery (6 gate groups) proving 0 ambiguous empty seats across all 23 Collin County, TX resolving governments"
  - "Discovery + documentation of a 7th ambiguous office (Plano Council Member Place 6) missed by the original 21-office target list, resolved as a genuine vacancy via migration 1392"
  - "Human-approved live browse spot-check confirming newly-seated names, vacancy flags, and headshots render correctly"
affects: []

tech-stack:
  added: []
  patterns:
    - "Read-only verification script mirroring the pg-Pool/DATABASE_URL structure of prior apply scripts, asserting PASS/FAIL per gate group and exiting non-zero on any failure"

key-files:
  created:
    - C:/EV-Accounts/backend/scripts/_verify-collin-218-completeness.ts
  modified:
    - C:/EV-Accounts/backend/migrations/1392_plano_place6_documented_vacancy.sql

key-decisions:
  - "The full-23-government sweep (not just the 21-office target list) surfaced an undiscovered ambiguous office: Plano 'Council Member Place 6' — politician_id NULL, is_vacant NOT true — that was never named in RESEARCH.md, CONTEXT.md, or any of Plans 01-04's target lists (which only tracked Plano's Place 7 seat)."
  - "Plano Place 6 resolved as a documented genuine vacancy (is_vacant=true, no placeholder politician row) after D-04 evidence exhaustion: plano.gov's own current official roster (Mayor Muns + 7 named councilmembers, cross-referenced against each person's individual bio page Place number) and Ballotpedia's dedicated 2026 Plano election tracker (only Place 7's Jan-2026 special election listed) both independently confirm no 8th sitting councilmember and no pending Place 6 race. Matches the established TX documented-vacancy pattern (migrations 105/109)."
  - "Weston's chambers.official_count (5) does not match its actual office-row count (6, after Plan 01's Place 5 addition) — logged as a minor data-hygiene note, not acted on: office_count > official_count means the chamber-metadata column is stale, not that a seat is missing. This does not trigger the D-02 missing-seat flag (which looks for the opposite direction: office rows fewer than official_count) and does not affect any ambiguous-seat gate."
  - "Live browse spot-check (Task 2) approved by human operator across Parker, Princeton, Van Alstyne, Lowry Crossing, and Plano — newly-seated names, the new Plano Place 6 flagged vacancy, and sourced headshots all render correctly with no ambiguous blank seats and no placeholder faces."

requirements-completed: [COLLIN-PEOPLE-01, COLLIN-PEOPLE-02]

coverage:
  - id: D1
    description: "All 6 SQL gate groups pass across all 23 resolving Collin County, TX governments: COLLIN-PEOPLE-02 all-23 ambiguous-seat gate (0 rows), COLLIN-PEOPLE-01 11-target ambiguous-seat gate (0 rows), D-02 missing-seat spot-check on the other 12 non-target governments (clean, no undiscovered gap beyond the Plano Place 6 finding, which was fixed before this gate's final pass), split-section gate (0 rows), no-duplicate gate (0 rows), and full reconcile (27/27 target offices seated-or-documented)"
    requirement: "COLLIN-PEOPLE-02"
    verification:
      - kind: other
        ref: "npx tsx scripts/_verify-collin-218-completeness.ts (all 6 gate groups)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Undiscovered ambiguous office (Plano Council Member Place 6) found by the full-23-gov sweep, evidence-exhausted via D-04 (plano.gov roster + Ballotpedia 2026 tracker), and documented as a genuine vacancy (is_vacant=true, no placeholder) via migration 1392"
    requirement: "COLLIN-PEOPLE-01"
    verification:
      - kind: other
        ref: "npx tsx scripts/_verify-collin-218-completeness.ts gate (1)+(2) re-run clean after migration 1392 applied"
        status: pass
    human_judgment: false
  - id: D3
    description: "Live browse spot-check: newly-seated names, the new Plano Place 6 flagged vacancy, and sourced headshots render correctly for Parker, Princeton, Van Alstyne, Lowry Crossing, and Plano"
    verification: []
    human_judgment: true
    rationale: "Visual/functional rendering on the live resident-facing app requires a human operator to load the pages and confirm correct display — no headless browse test harness exists per VALIDATION.md's Manual-Only Verifications table."

duration: 40min
completed: 2026-07-24
status: complete
---

# Phase 218 Plan 05: Full Verification Battery + Live Browse Spot-Check Summary

**Full 6-gate SQL verification battery across all 23 Collin County, TX governments (0 ambiguous empty seats) plus discovery and documentation of an undiscovered Plano vacancy (Council Member Place 6, migration 1392), closed out by a human-approved live browse spot-check of newly-seated names, vacancy flags, and headshots.**

## Performance

- **Duration:** ~40 min
- **Completed:** 2026-07-24
- **Tasks:** 2
- **Files modified:** 2 (verification script + the Plano Place 6 documented-vacancy migration, both C:/EV-Accounts repo)

## Accomplishments

- Wrote and ran a re-runnable, read-only SQL verification script (`_verify-collin-218-completeness.ts`) covering all 6 gate groups required by VALIDATION.md's sign-off contract:
  1. **COLLIN-PEOPLE-02 all-23 gate:** `offices WHERE politician_id IS NULL AND is_vacant IS NOT TRUE` across all 23 Collin geo_ids — **0 rows**.
  2. **COLLIN-PEOPLE-01 11-target gate:** same query scoped to the 11 target cities — **0 rows**.
  3. **D-02 missing-seat spot-check on the other 12 non-target governments** (Allen, Celina, Frisco, Farmersville, Lavon, McKinney, Melissa, Murphy, Prosper, Richardson, Saint Paul, Weston): office-row count vs. `chambers.official_count` per government — **clean** (Weston's stale `official_count=5` vs. actual 6 office rows is a metadata-lag note, not a missing-seat gap; office rows exceeding `official_count` is the opposite direction from what the gate flags).
  4. **Split-section gate** ([[section_split_check]]) across all 23 govs — **0 rows**.
  5. **No-duplicate gate** across all 23 govs — **0 rows**.
  6. **Full reconcile:** re-ran the offices/seated/unseated count per city and confirmed it matches the RESEARCH target table — **27/27 offices seated-or-documented** (the original 21-office target plus the 6 rows added in Plan 01, plus the newly-discovered Plano Place 6 documented in this plan).
- **Phase-close finding:** the first full-23-gov run of gate (1) surfaced a 7th ambiguous office never named in RESEARCH.md, CONTEXT.md, or any prior plan's target list — Plano's "Council Member Place 6" (`politician_id IS NULL`, `is_vacant IS NOT TRUE`). Ran the same D-04 evidence-exhaustion ladder used in Plan 03: plano.gov's own current official roster (Mayor Muns + 7 named councilmembers, cross-referenced against each person's individual bio page's own Place number) plus Ballotpedia's dedicated 2026 Plano election tracker (only Place 7's January-2026 special election listed) both independently confirmed no 8th sitting councilmember and no pending Place 6 race. Documented as a genuine vacancy (`is_vacant=true`, no placeholder politician row inserted) via migration `1392_plano_place6_documented_vacancy.sql` — matching the established TX documented-vacancy pattern from migrations 105/109. Re-ran gates (1) and (2) after applying the migration — both clean.
- Confirmed a minor, non-actionable data-hygiene note: Weston's `chambers.official_count` is still `5` while its actual office-row count is `6` (Plan 01 added the 6th, Place 5, seat). This is a stale-metadata artifact, not a missing-seat gap — the D-02 gate direction (office rows fewer than `official_count`) does not trigger, and no ambiguous-seat gate is affected. Logged for awareness, no fix applied (out of this plan's scope).
- **Task 2 (live browse spot-check):** human operator loaded live browse for Parker, Princeton, Van Alstyne, Lowry Crossing, and Plano and confirmed: newly-seated names from Plans 02/03 render correctly on their offices; the new Plano Place 6 vacancy renders as a flagged vacancy, not an ambiguous blank row; sourced headshots display correctly for the spot-checked people; honest-blank cities show a blank, not a placeholder face. Operator response: **"approved"**.

## Task Commits

1. **Task 1: Full SQL verification battery across all 23 govs** — `d1ae2f4b` (fix, C:/EV-Accounts repo; migration `1392_plano_place6_documented_vacancy.sql` documenting the Plano Place 6 discovery; verification script `_verify-collin-218-completeness.ts` kept on disk per repo's gitignored `backend/scripts/_*` convention, not committed)
2. **Task 2: Live browse spot-check** — checkpoint task, no code commit; human operator approval recorded above.

**Plan metadata:** (this SUMMARY + STATE.md + ROADMAP.md commit, essentials repo — see final commit below)

## Files Created/Modified

- `C:/EV-Accounts/backend/scripts/_verify-collin-218-completeness.ts` — read-only verification script, 6 gate groups, PASS/FAIL assertions, non-zero exit on failure; gitignored by repo convention (`backend/scripts/_*`), kept on disk for potential re-run
- `C:/EV-Accounts/backend/migrations/1392_plano_place6_documented_vacancy.sql` — idempotent migration documenting Plano Council Member Place 6 as a genuine vacancy (`is_vacant=true`), committed `d1ae2f4b`

## Decisions Made

- **Plano Place 6 documented as vacancy, not seated:** exhausted D-04 evidence (city's own current roster + Ballotpedia's dedicated 2026 tracker) with both sources agreeing there is no 8th sitting councilmember and no pending race for the seat — the correct disposition per COLLIN-PEOPLE-02 is a documented vacancy, not a placeholder seating.
- **Weston official_count discrepancy logged, not fixed:** the gap runs in the safe direction (office rows > official_count, a metadata staleness issue) and does not create any ambiguous-seat risk; fixing `chambers.official_count` metadata is out of scope for this verification-only plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Undiscovered ambiguous office (Plano Council Member Place 6) found and documented**
- **Found during:** Task 1, first full-23-government run of gate (1)
- **Issue:** The all-23-gov ambiguous-seat gate is the first time the phase's verification surface extended beyond the original 21-office target list (which only named Plano's Place 7 seat). It surfaced a genuinely undiscovered ambiguous office — Plano Council Member Place 6 — that no prior plan had targeted.
- **Fix:** Ran the same D-04 evidence-exhaustion ladder established in Plan 03 (direct city-site fetch + independent second source) before disposing the seat. Both plano.gov's own current roster and Ballotpedia's 2026 Plano election tracker confirmed no 8th sitting councilmember and no pending race — documented as a genuine vacancy via migration 1392, matching the established documented-vacancy pattern (no placeholder politician row).
- **Files modified:** `C:/EV-Accounts/backend/migrations/1392_plano_place6_documented_vacancy.sql`
- **Commit:** `d1ae2f4b`

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Necessary for COLLIN-PEOPLE-02 correctness — an ambiguous seat this plan's own gate was designed to catch would have silently persisted past phase close otherwise. No scope creep beyond the phase's own vacancy-or-seat disposition process.

## Issues Encountered

None beyond the Plano Place 6 discovery documented above, which is the intended purpose of running the full-23-gov sweep (rather than only the 21-office target list) at phase close.

## User Setup Required

None — no external service configuration required. Migration deployed via `git -C "C:/EV-Accounts" push origin master` (Render auto-deploy from `master`), consistent with `[[backend_architecture]]` / `[[no_git_in_ev_accounts]]`.

## Next Phase Readiness

Phase 218 is fully gated closed on its own verification contract: 0 ambiguous empty seats across all 23 Collin County, TX governments (COLLIN-PEOPLE-02), the 11-target-city gate clean (COLLIN-PEOPLE-01), the other-12-government D-02 spot-check clean (Weston metadata note aside — non-blocking), split-section and no-duplicate gates clean, and the human-approved live browse spot-check confirming real, correct rendering. VALIDATION.md's sign-off checklist is now fully satisfiable — `nyquist_compliant` flipped to `true` as part of this plan's finalization writes.

No blockers. Phase-level completion (roadmap/milestone closure) is the orchestrator's responsibility, not this plan's.

---
*Phase: 218-vacancies-missing-people*
*Completed: 2026-07-24*

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/migrations/1392_plano_place6_documented_vacancy.sql`
- FOUND commit `d1ae2f4b` (C:/EV-Accounts, pushed to origin/master)
- FOUND: `.planning/phases/218-vacancies-missing-people/218-05-SUMMARY.md`
