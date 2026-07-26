---
phase: 219-elections-candidates-backfill
plan: 05
subsystem: database
tags: [postgres, sql-migration, elections, candidates, texas-municipal, collin-county]

requires:
  - phase: 219-elections-candidates-backfill (219-01)
    provides: migration numbering ledger (219-PREFLIGHT.md §1), per-city reference-cycle decisions (§4), Plano/Weston research findings
provides:
  - Migration 1396 (Plano Jan-2026 special + Weston November-2024 race, gated apply-script, NOT yet applied to production)
affects: [219-06, 219-07, 219-08, phase-219-close]

tech-stack:
  added: []
  patterns:
    - "Own-election-row minting via ON CONFLICT (name, election_date, state) DO NOTHING, mirrored from migration 1395"
    - "Explicit RAISE EXCEPTION office-lookup guards (loud failure over silent orphan race)"
    - "Documented-vacancy zero-race guard (Plano Place 6) as a first-class apply-script gate, not just a code comment"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1396_plano_weston_staggered_races.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1396_plano_weston_staggered_races.ts
  modified: []

key-decisions:
  - "Plano Council Member Place 7 special election (Jan 31, 2026) minted as its own election row 'Plano TX City Special 2026'; only Shun Thomas seeded as winner (~60.4%) — no opponent is cited anywhere in PREFLIGHT/RESEARCH, so none was fabricated; race description documents the field was not fully sourced."
  - "Plano Council Member Place 6 receives ZERO races anywhere in this migration, matching the documented genuine vacancy from migration 1392 — enforced by a dedicated apply-script gate (not just a comment)."
  - "Plano's other 7 offices (Mayor, Places 1-5, 8) are left race-less/[OPEN] — staggered 2023-2025 term history is legitimately out of this backfill's cheap research horizon per RESEARCH.md Pitfall 3; no cycle guessed."
  - "Weston Council Member Place 5 (Marla Johnston, term 2024-11-01 to 2026-11-01) minted under its own new election row 'Weston TX City General 2024' dated 2024-11-05 (Texas's November uniform election date), per the plan's explicit fallback instruction — this executor has no WebSearch/WebFetch tool available this session, so no fresh roster research was possible; only Johnston's cited term-date range was used, no opponent/incumbency fabricated."
  - "Weston's other 5 offices (Mayor, Places 1-4) are left race-less/[OPEN] — their migration-098 term dates are placeholder May-cycle dates that don't match Weston's confirmed November voting cycle and have no independent election citation."
  - "Neither Plano nor Weston is linked to the shared 2026-05-02 'Texas Municipal General' election row anywhere in this migration — enforced by two dedicated apply-script gates (combined Plano+Weston check, plus an explicit Weston-only check per the plan's requirement)."

patterns-established:
  - "Pattern: dual-gate wrong-row guard (a combined check across all target geo_ids, plus an explicit per-plan-named single-city check) for extra traceability when a plan calls out one city by name."

requirements-completed: [COLLIN-ELECT-01, COLLIN-ELECT-03]

coverage:
  - id: D1
    description: "Migration 1396 authored: mints Plano's Jan-31-2026 special election row + Weston's November-2024 election row, seeds exactly 2 races/2 candidates, explicitly excludes Plano Place 6 and the shared 2026-05-02 row"
    requirement: "COLLIN-ELECT-01"
    verification:
      - kind: other
        ref: "cd C:/EV-Accounts/backend && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict --skipLibCheck scripts/_apply-migration-1396_plano_weston_staggered_races.ts (exit 0, zero errors)"
        status: pass
    human_judgment: true
    rationale: "Migration has NOT been applied to production this session (Task 3 delegated to orchestrator per objective) — the apply-script's gates (race counts, candidate counts, Place-6 zero-race guard, Weston wrong-row guard, idempotent re-run) have only been type-checked, never executed against the live DB. A human/orchestrator must run the apply-script and confirm all gates exit 0 before this deliverable is truly verified."
  - id: D2
    description: "Task 3 (apply migration 1396, confirm gates green, commit+push to C:/EV-Accounts, browse spot-check) intentionally NOT executed — delegated to orchestrator per this plan's objective"
    verification: []
    human_judgment: true
    rationale: "Executor has no DB access / prod push per the plan's own architecture (accounts-api runs via Render); Task 3 is an operator-run checkpoint by design."

duration: 25min
completed: 2026-07-24
status: complete
---

# Phase 219 Plan 05: Plano + Weston Staggered Races Summary

**Migration 1396 authored (not applied): Plano's Jan-31-2026 Place-7 special election (Shun Thomas) + Weston's minted November-2024 Place-5 race (Marla Johnston), with dedicated apply-script gates guarding Plano's Place-6 documented vacancy and both cities' non-linkage to the shared 2026-05-02 election row.**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-07-24T07:07:00Z
- **Completed:** 2026-07-24T07:32:00Z
- **Tasks:** 2 of 3 (Task 3 delegated to orchestrator per objective)
- **Files created:** 2 (in C:/EV-Accounts, not committed there per objective)

## Accomplishments
- Migration `1396_plano_weston_staggered_races.sql` authored: mints two new own-election rows (`Plano TX City Special 2026` 2026-01-31, `Weston TX City General 2024` 2024-11-05), inserts exactly 2 races (Plano Council Member Place 7 Special; Weston Council Member Place 5) and 2 candidates (Shun Thomas; Marla Johnston), both linked via existing `offices.politician_id` (no new politician rows, no new headshot work).
- Gated apply-script `_apply-migration-1396_plano_weston_staggered_races.ts` authored mirroring migration 1395's shape: per-geo_id race-count gate, per-race candidate-count gate, illegal-`candidate_status` gate, antipartisan (`primary_party`) gate, D-07 inform.* no-side-effect gate, split-section gate, combined shared-row wrong-row guard, an EXPLICIT Weston-only shared-row guard (plan requirement i), an EXPLICIT Plano-Place-6-zero-race guard (plan requirement ii), and an idempotent-re-run gate re-checking all of the above.
- Type-checked clean under the project's actual tsconfig settings (`--target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict --skipLibCheck`) — exit 0, zero errors. The bare `npx tsc --noEmit <file>` invocation from the plan's literal verify string reproduces the same pre-existing `esModuleInterop`/top-level-`await` errors that the already-working 1394/1395 scripts also reproduce under a bare invocation (tsconfig.json's `include` scopes to `src/**/*` only, excluding `scripts/` — confirmed against 219-03/219-04's identical precedent).
- Migration numbering re-confirmed: on-disk MAX in `C:/EV-Accounts/backend/migrations` = 1395 → next-free = 1396, matching the locked map in 219-PREFLIGHT.md §1 exactly. No drift.

## Task Commits

This is a sequential (non-worktree) plan writing files into a separate repo (`C:/EV-Accounts`). Per the objective, EV-Accounts files are written but NOT committed there this session (orchestrator handles migration apply + EV-Accounts commit/push in Task 3). Only this SUMMARY is committed in the `essentials` repo:

1. **Task 1: Lock Plano + Weston cited rosters** — no separate commit (research/analysis task, folded into Task 2's authored files and this SUMMARY's documentation).
2. **Task 2: Author migration 1396 + gated apply-script** — files written to `C:/EV-Accounts`, NOT committed there (per objective — Task 3/orchestrator commits+pushes EV-Accounts after applying).

**Plan metadata:** committed in this SUMMARY's own commit (`docs(219): complete 219-05 plan`).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1396_plano_weston_staggered_races.sql` - Mints Plano's Jan-2026 special + Weston's Nov-2024 election rows; seeds 2 races (Plano Place 7 Special, Weston Place 5), 2 candidates (Shun Thomas, Marla Johnston); explicitly seeds NOTHING for Plano Place 6 or either city's other race-less offices; wrapped in BEGIN/COMMIT with `RAISE EXCEPTION` guards on every office lookup.
- `C:/EV-Accounts/backend/scripts/_apply-migration-1396_plano_weston_staggered_races.ts` - Gated apply-script: 11 named gates (a-k) covering race/candidate counts, illegal status, antipartisan, D-07 no-stance-side-effect, split-section, combined + Weston-only wrong-row guards, Plano-Place-6 vacancy guard, and idempotent re-run. NOT executed against production this session — Task 3/orchestrator runs it.

## Decisions Made
- **Plano Place 7 opponent not fabricated:** PREFLIGHT/RESEARCH cite only Shun Thomas's ~60.4% win — no opponent name appears in either document. Per the plan's explicit override instruction (which supersedes Task 1's `read_first` phrase "full filed field, cited"), only Thomas was seeded; the race's `description` column documents that the full field was not sourced this session.
- **Weston roster resolution limited by tool availability:** this executor's environment has no WebSearch/WebFetch tool. Per the plan's explicit fallback instruction for exactly this scenario, only Marla Johnston (Place 5, the one seat with a cited term-date range) was seeded, under a minted `'Weston TX City General 2024'` row dated 2024-11-05 (the plan's own cited fallback date). No opponent, no incumbency status, and no roster for Weston's other 5 offices were fabricated.
- **is_incumbent=false for both seeded candidates:** Thomas won an open Place-7 seat via special election (no source states he held it before); Johnston's incumbency was never cited this session. Both seeded `false` rather than guessed `true`, per D-06 no-fabrication.
- **Dual wrong-row gate design:** implemented both a combined (Plano+Weston) shared-row check AND an explicit Weston-only shared-row check, satisfying the plan's literal requirement (ii) for unambiguous per-plan traceability while also giving broader coverage.

## Deviations from Plan

**1. [Rule 3 - Blocking, tooling gap] No WebSearch/WebFetch tool available for Weston roster research**
- **Found during:** Task 1
- **Issue:** The plan's Task 1 instructs "Research (if a web tool is available) to resolve Weston's November-2024 roster." No such tool is registered in this executor's environment.
- **Fix:** Followed the plan's own explicit fallback path for this exact scenario — seeded only the one citable seat (Marla Johnston, Place 5) under the plan's own suggested minted row/date, left the rest documented-[OPEN]. No architectural change, no scope change; this is the plan's designed contingency, not an improvisation.
- **Files affected:** `1396_plano_weston_staggered_races.sql` (Weston section), this SUMMARY.
- **Verification:** Migration seeds exactly the cited data; apply-script's gates (once run by the orchestrator) will confirm no fabricated rows exist.

---

**Total deviations:** 1 (Rule 3, tooling gap — handled via the plan's own documented fallback, not an improvisation)
**Impact on plan:** None — the plan anticipated this exact contingency and specified the fallback inline. No scope creep, no architectural change.

## Known Stubs

None. Both seeded candidates (Shun Thomas, Marla Johnston) link to real, existing `politicians` rows via `offices.politician_id` (seated by prior migrations 091/1389) — their headshots, if any, carry through automatically. No placeholder/blank UI stub is introduced by this migration; race-less offices simply have no race row (correctly hidden by `ElectionsView.jsx`'s existing zero-candidate-shell filter, per D-08 — no code change needed or made).

## Issues Encountered
None beyond the documented tooling-gap deviation above.

## Threat Flags

None. Both new races/candidates fall within the phase's existing threat register (T-219-01 through T-219-05, T-219-SC) — no new trust boundary, endpoint, or schema surface introduced beyond what those entries already cover.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Task 3 (DELEGATED TO ORCHESTRATOR) — not executed this session:**
- `cd C:/EV-Accounts/backend && npx tsx scripts/_apply-migration-1396_plano_weston_staggered_races.ts` — apply migration 1396 against production and confirm all 11 gates (a through k) exit green, including the Place-6 vacancy guard and the Weston wrong-row guard.
- **Expected per-election race/candidate counts after apply:** `Plano TX City Special 2026` (2026-01-31): 1 race (`Plano Council Member Place 7 Special`), 1 candidate (Shun Thomas). `Weston TX City General 2024` (2024-11-05): 1 race (`Weston Council Member Place 5`), 1 candidate (Marla Johnston). Total: 2 minted election rows, 2 races, 2 candidates.
- **Minted rows:** `Plano TX City Special 2026` (2026-01-31, TX, special, city); `Weston TX City General 2024` (2024-11-05, TX, general, city). Neither resolves to or reuses the shared `8eaba170-95f5-4c98-849e-19ff93a17680` (`2026 Texas Municipal General`, 2026-05-02) row.
- **Open/race-less seats (documented, not fabricated):** Plano — Mayor, Council Member Place 1, 2, 3, 4, 5, 8 (staggered 2023-2025 term history out of this backfill's cheap research horizon, RESEARCH.md Pitfall 3). Weston — Mayor, Council Member Place 1, 2, 3, 4 (migration-098 placeholder May-cycle term dates don't match Weston's confirmed November cycle; no independent citation this session).
- **Holder-vs-cited-winner mismatches:** none found. Both office holders already seated by prior migrations (Plano Place 7 = Shun Thomas via migration 091; Weston Place 5 = Marla Johnston via migration 1389) exactly match the cited race winner named in PREFLIGHT — reuse via `offices.politician_id` is a clean 1:1 match in both cases, no conflict for the orchestrator to arbitrate.
- After gates pass: `git -C "C:/EV-Accounts" add -A && git -C "C:/EV-Accounts" commit -m "feat(219): seed Plano staggered + Jan-2026 special + Weston November races" && git -C "C:/EV-Accounts" push origin master`, then browse-spot-check `/results?browse_geo_id=4858016` (Plano) confirming the seeded race renders and Place 6 remains correctly race-less.

- Migration 1396 is ready for the orchestrator to apply; no blockers identified. 219-06/219-07/219-08 (the remaining Wave-2 seeding plans) are unaffected by this plan's scope and can proceed independently once their own migration numbers (1397-1399) are confirmed against the then-current on-disk MAX.

---
*Phase: 219-elections-candidates-backfill*
*Completed: 2026-07-24*
