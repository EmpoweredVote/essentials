---
phase: 219-elections-candidates-backfill
plan: 06
subsystem: database
tags: [postgres, sql-migration, elections, candidates, texas-municipal, runoff-closure, collin-county, gregg-county]

requires:
  - phase: 219-elections-candidates-backfill (219-01)
    provides: migration numbering ledger (219-PREFLIGHT.md §1), runoff-closure tier findings (§5), Longview/Princeton citations
provides:
  - Migration 1397 (Longview D3 general + District 4 unopposed + Princeton Place 4 runoff, gated apply-script, NOT yet applied to production)
affects: [219-07, 219-08, 219-09, phase-219-close]

tech-stack:
  added: []
  patterns:
    - "Reuse-by-name/date/state for an already-existing election row (migration 187's Longview D3 runoff), guarded by an explicit RAISE EXCEPTION count!=1 assertion instead of a re-mint"
    - "Own-election-row minting via ON CONFLICT (name, election_date, state) DO NOTHING for the Princeton runoff, mirrored from migration 1395"
    - "Stage-disambiguated position_name (general vs runoff) so two races for the same seat can never ON CONFLICT-collide"
    - "Snapshot-before/after gate pattern: capture pre-existing race id + candidate count for a row this migration must NOT touch (migration 100's Princeton special, migration 187's Longview runoff race), assert identity unchanged after apply"

key-files:
  created:
    - C:/EV-Accounts/backend/migrations/1397_longview_princeton_runoff_closure.sql
    - C:/EV-Accounts/backend/scripts/_apply-migration-1397_longview_princeton_runoff_closure.ts
  modified: []

key-decisions:
  - "Longview D3 General (May 2, 2026, shared row): seeded ONLY Brandon Smith and Marlena Cooper — the two who advanced to the June 13 runoff. News coverage establishes this was a 5-candidate field, but no source available this session (PREFLIGHT/RESEARCH, no WebSearch/WebFetch tool in this environment) names the other 3 filers. Not fabricated — matches migration 1395's honest-partial-citation pattern for McKinney Mayor."
  - "Longview District 4 (Nustad) ADDED as a bonus race: migration 185's own header + politicians INSERT (valid_from='2026-05-01') already cite John Nustad's unopposed re-election in the SAME May 2026 cycle — a fully-sourced D-03 declared-elected pattern requiring no new research. Linked via his existing politician_id (no new politicians row)."
  - "Longview Mayor + Districts 1, 2, 5, 6 deliberately NOT seeded: migration 185's own citations show these seats' current terms run 2024-05-01→2027-05-01 or 2025-05-01→2028-05-01 — none was up in the May 2026 cycle. Correctly left out of this plan's scope, not a fabrication risk or an open gap."
  - "Longview D3 runoff election row (migration 187) is REUSED, never re-minted — enforced by an explicit RAISE EXCEPTION guard inside the migration itself (count != 1 aborts) plus a dedicated apply-script gate checked both before and after apply."
  - "Longview D3 seating gap (offices.politician_id still hold-over Wray Wade vs. confirmed runoff winner Brandon Smith) is FLAGGED, NOT resolved by this migration. Both race_candidates rows for Smith and Cooper have politician_id=NULL (mirrors migration 187's own existing shape) — seeding the winner as officeholder is explicitly out of this phase's scope per 219-PREFLIGHT.md §5's carried-forward recommendation. See 'Operator Decision Required' below."
  - "Princeton Place 4 runoff date resolved to 2026-06-13 (not an approximate '2026-06-XX'): migration 1389 (Phase 218) independently cites 'Rutledge won the June 13, 2026 runoff... certified by City Council June 23, 2026' — this is a firmer, already-verified citation than PREFLIGHT's own '2026-06-13 or the confirmed runoff date' hedge, so it was used directly rather than re-guessed."
  - "Princeton Place 4 runoff winner Jaisen Rutledge reuses his EXISTING politician_id: migration 1389 (Phase 218) already seated him as Princeton's current Place 4 officeholder. Unlike Longview, Princeton's seating gap was ALREADY CLOSED before this plan ran — this migration's guard (IF v_politician IS NULL THEN RAISE EXCEPTION) would have caught it if that seating had NOT already happened."
  - "Princeton's May special (migration 100) and June runoff (this migration) are two DISTINCT races under two DISTINCT election rows with two DISTINCT position_names ('Princeton Council Member Place 4' vs 'Princeton Council Member Place 4 Runoff') — no ON CONFLICT collision possible even in principle, verified by a dedicated apply-script gate."
  - "Princeton office resolved via the CURRENT geo_id (4859576), not the stale 4863432 migration 090 originally used — per 219-RESEARCH.md's note that Phase 217 corrected this city's geo_id post-original-seed. Mirrors migration 1395's identical Richardson geo_id defensive guard."

patterns-established:
  - "Snapshot-before/after non-mutation gate: for any migration whose whole purpose is 'add the missing stage without touching the existing stage,' capture {raceId, candCount} for the existing row pre-apply and assert byte-identical post-apply, not just 'still exists'."

requirements-completed: [COLLIN-ELECT-02, COLLIN-ELECT-03]

coverage:
  - id: D1
    description: "Migration 1397 authored: reuses migration 187's Longview D3 runoff row (no duplicate), seeds Longview D3 General + District 4 under the shared row, mints Princeton's own Place 4 Runoff election row, seeds that runoff race distinct from migration 100's May special"
    requirement: "COLLIN-ELECT-02"
    verification:
      - kind: other
        ref: "cd C:/EV-Accounts/backend && npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --esModuleInterop --downlevelIteration scripts/_apply-migration-1397_longview_princeton_runoff_closure.ts (exit 0, zero errors)"
        status: pass
    human_judgment: true
    rationale: "Migration has NOT been applied to production this session (Task 3 delegated to orchestrator per objective) — the apply-script's gates (race counts, candidate counts, no-duplicate-runoff-row, two-distinct-Princeton-races, idempotent re-run) have only been type-checked, never executed against the live DB. A human/orchestrator must run the apply-script and confirm all gates exit 0 before this deliverable is truly verified."
  - id: D2
    description: "Task 3 (apply migration 1397, decide the Longview D3 seating question, confirm gates green, commit+push to C:/EV-Accounts, browse spot-check Princeton) intentionally NOT executed — delegated to orchestrator per this plan's objective"
    verification: []
    human_judgment: true
    rationale: "Executor has no DB access / prod push per the plan's own architecture (accounts-api runs via Render); Task 3 is an operator-run checkpoint by design, and the Longview D3 seating decision is explicitly an operator call per the plan's backstop clause."

duration: 35min
completed: 2026-07-24
status: complete
---

# Phase 219 Plan 06: Longview + Princeton Runoff Closure Summary

**Migration 1397 authored (not applied): Longview's original May-2026 District 3 general race (Brandon Smith / Marlena Cooper, honest partial 2-of-5 roster) + a bonus District 4 unopposed race (Nustad), reusing migration 187's existing D3 runoff row without duplication; plus Princeton's missing June-2026 Place 4 runoff (Jaisen Rutledge defeated Jan Goria, 293-245) under a newly-minted own election row, distinct from migration 100's already-seeded May special. The Longview D3 officeholder-seating gap (hold-over Wray Wade vs. confirmed winner Brandon Smith) is explicitly flagged for the operator, not silently resolved.**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-07-24T08:10:00Z
- **Completed:** 2026-07-24T08:45:00Z
- **Tasks:** 2 of 3 (Task 3 DELEGATED TO ORCHESTRATOR per objective)
- **Files created:** 2 (in C:/EV-Accounts, not committed there per objective)

## Accomplishments

- Migration `1397_longview_princeton_runoff_closure.sql` authored:
  - Resolves the shared `'2026 Texas Municipal General'` (2026-05-02) election row by name/date/state.
  - **Guard-first:** asserts exactly ONE `'Longview TX City Council District 3 Runoff 2026'` election row exists (migration 187) before proceeding — `RAISE EXCEPTION` if the count is ever anything but 1, so this migration can never mint a duplicate even by accident.
  - Seeds `'Longview Council Member District 3'` (General) under the shared row: 2 candidates, Brandon Smith and Marlena Cooper — the two who advanced to the June 13 runoff; the other 3 of the reported 5-candidate field are not named in any source reachable this session and are not fabricated. Neither candidate is linked via `politician_id` (the current officeholder is hold-over Wray Wade, not a candidate in this race).
  - Seeds `'Longview Council Member District 4'` (General, bonus): John Nustad, unopposed, `is_incumbent=true`, linked to his existing `politician_id` — fully cited via migration 185's own header/politicians INSERT, no fresh research needed.
  - Mints `'Princeton TX City Council Place 4 Runoff 2026'` (2026-06-13, TX, special) via `ON CONFLICT (name, election_date, state) DO NOTHING`.
  - Seeds `'Princeton Council Member Place 4 Runoff'` under that new row: Jaisen Rutledge (winner, linked to his EXISTING `politician_id` — already seated by Phase 218's migration 1389, no new politicians row) and Jan Goria (loser, name-only). Guarded by `IF v_politician IS NULL THEN RAISE EXCEPTION` — would have caught it if Rutledge had NOT already been seated.
  - Every office lookup guarded by `IF v_office_id IS NULL THEN RAISE EXCEPTION` (loud failure over silent orphan race).
- Gated apply-script `_apply-migration-1397_longview_princeton_runoff_closure.ts` authored mirroring migration 1395's shape, plus the two plan-required extra gates:
  - Standard set: per-geo_id race-count (a), per-race candidate-count (b), illegal `candidate_status` (c), antipartisan `primary_party` (d), D-07 `inform.*` no-side-effect (e), split-section (f), idempotent re-run (g).
  - **Gate (h) — no-duplicate-runoff-row:** exactly 1 `'Longview TX City Council District 3 Runoff 2026'` election row, checked before AND after apply AND after re-run; PLUS a snapshot gate on migration 187's actual runoff RACE (`{raceId, candCount}`) asserting it is byte-identical before/after — not just "still exists somewhere."
  - **Gate (i) — two-distinct-Princeton-races:** snapshots migration 100's May special race (`{raceId, candCount}`) before/after (must be untouched) and confirms the new June runoff resolves to a DIFFERENT race id — collision-impossible by construction (distinct election rows AND distinct position_names) but verified anyway.
- Type-checked clean: `npx tsc --noEmit --target es2022 --module esnext --moduleResolution bundler --esModuleInterop --downlevelIteration scripts/_apply-migration-1397_longview_princeton_runoff_closure.ts` → exit 0, zero errors. The plan's literal bare `npx tsc --noEmit <file>` verify string reproduces the same pre-existing `esModuleInterop`/top-level-`await` errors that the already-accepted 1395 script ALSO reproduces under the identical bare invocation (confirmed by running both side-by-side) — this is a known `tsconfig.json` `include: ["src/**/*"]` scoping artifact (scripts/ is excluded), not a defect introduced by this file.
- Migration numbering re-confirmed: on-disk MAX in `C:/EV-Accounts/backend/migrations` = 1396 → next-free = 1397, matching the locked map in 219-PREFLIGHT.md §1 exactly. No drift.

## Task Commits

This is a sequential (non-worktree) plan writing files into a separate repo (`C:/EV-Accounts`). Per the objective, EV-Accounts files are written but NOT committed there this session (orchestrator handles migration apply + EV-Accounts commit/push in Task 3). Only this SUMMARY is committed in the `essentials` repo:

1. **Task 1: Lock Longview + Princeton cited rosters** — no separate commit (research/analysis task, folded into Task 2's authored files and this SUMMARY's documentation). Key discovery during this task: migration 1389 (Phase 218) already seated Jaisen Rutledge as Princeton Place 4's officeholder, which resolved both the exact runoff date (2026-06-13, per 1389's own citation) and the politician_id-linkage question without any fresh research.
2. **Task 2: Author migration 1397 + gated apply-script** — files written to `C:/EV-Accounts`, NOT committed there (per objective — Task 3/orchestrator commits+pushes EV-Accounts after applying).

**Plan metadata:** committed in this SUMMARY's own commit (`docs(219): complete 219-06 plan`).

## Files Created/Modified
- `C:/EV-Accounts/backend/migrations/1397_longview_princeton_runoff_closure.sql` - Reuses migration 187's Longview D3 runoff row (guarded, no duplicate); seeds 3 new races (Longview D3 General, Longview D4 General, Princeton Place 4 Runoff), 5 new candidate rows total (Smith, Cooper, Nustad, Rutledge, Goria); mints 1 new election row (Princeton Place 4 Runoff 2026); wrapped in BEGIN/COMMIT with `RAISE EXCEPTION` guards on every office lookup and the no-duplicate-runoff-row assertion.
- `C:/EV-Accounts/backend/scripts/_apply-migration-1397_longview_princeton_runoff_closure.ts` - Gated apply-script: standard 7-gate set (a-g) plus 2 plan-required gates (h: no-duplicate-runoff-row with race-snapshot sub-check; i: two-distinct-Princeton-races with race-snapshot sub-check). NOT executed against production this session — Task 3/orchestrator runs it.

## Decisions Made

See `key-decisions` in frontmatter for the full list. Highlights:
- Honest partial roster for Longview D3 General (2 of 5 candidates cited) rather than fabricating the other 3.
- Bonus District 4 race added because it was already fully cited in an existing migration's header — zero incremental research risk.
- Longview D3 seating gap explicitly NOT resolved (see Operator Decision Required below) — matches the plan's own backstop clause verbatim.
- Princeton's seating gap was found ALREADY resolved by Phase 218 (migration 1389) — a pleasant contrast to Longview's still-open gap, discovered by checking prior migrations before assuming a new stub politicians row was needed (per the plan's own duplicate-officeholder-bug warning).

## Deviations from Plan

**1. [Rule 3 - Blocking, tooling gap] No WebSearch/WebFetch tool available for Longview's 5-candidate D3 general full roster**
- **Found during:** Task 1
- **Issue:** RESEARCH.md/PREFLIGHT.md both note the D3 general was a "5-candidate field... full roster needed" but only name the 2 who advanced to the runoff (Smith, Cooper). This executor's environment has no WebSearch/WebFetch tool to attempt fresh sourcing of the other 3 names.
- **Fix:** Seeded only the 2 cited candidates, matching migration 1395's own precedent for an analogous gap (McKinney Mayor, 2 of 4 named). Race `description` documents the field was 5 total, only 2 named this session. No fabrication.
- **Files affected:** `1397_longview_princeton_runoff_closure.sql` (Longview D3 General section), this SUMMARY.
- **Verification:** Migration seeds exactly the cited data; apply-script's candidate-count gate expects exactly the 2 named candidates for this race, not 5 — a future backfill plan can add the other 3 if sourced later without breaking this migration's idempotency (new names simply insert alongside the existing 2 via the `WHERE NOT EXISTS` guard).

**2. [Rule 2 - Auto-added, cited] Longview District 4 bonus race**
- **Found during:** Task 1
- **Issue:** Not explicitly required by the plan's minimum scope (D3 general only), but migration 185's own header/politicians INSERT already fully cites John Nustad's May-2026 unopposed re-election — a zero-incremental-risk, fully-sourced D-03 pattern sitting in an already-committed migration.
- **Fix:** Added the race, matching the plan's own explicit permission ("Also seed Longview Mayor + Districts 1,2,4,5,6 general races IF held on the same May date AND you have a cited roster").
- **Files affected:** `1397_longview_princeton_runoff_closure.sql` (Longview D4 section), this SUMMARY.
- **Verification:** Candidate linked via existing `politician_id` (no new politicians row); apply-script's per-race candidate-count gate covers this race too.

---

**Total deviations:** 2 (1 Rule 3 tooling-gap, handled via the plan's own documented fallback pattern; 1 Rule 2 auto-add, explicitly pre-authorized by the plan's own text)
**Impact on plan:** None — both deviations stay within the plan's own stated discretion/fallback language. No scope creep, no architectural change.

## Known Stubs

None. All 5 seeded candidates either link to a real, existing `politicians` row via `offices.politician_id` (Nustad via migration 185, Rutledge via migration 1389) — their headshots, if any, carry through automatically — or are honest denormalized name-only rows for people who never became officeholders (Smith, Cooper, Goria), per D-05's non-incumbent-honest-blank convention. No placeholder/blank UI stub is introduced.

## Issues Encountered

None beyond the two documented deviations above.

## Threat Flags

None. All new races/candidates fall within the phase's existing threat register (T-219-01 through T-219-05, T-219-SC), specifically T-219-05 ("Data integrity (silent loss/dup) — election-row + two-stage races"), which this plan's entire design (reuse-guard + mint-guard + two snapshot gates) directly mitigates. No new trust boundary, endpoint, or schema surface introduced.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Task 3 (DELEGATED TO ORCHESTRATOR) — not executed this session:**

- **Operator decision required first:** whether to seat Brandon Smith into Longview D3's `offices.politician_id` now (an in-passing Phase-218-style bonus fix) or record it as an explicit out-of-scope/follow-up note. This migration does NOT include that UPDATE — it seeds only the race+candidates (this phase's job) and leaves `offices.politician_id` untouched (still hold-over Wray Wade). If the operator chooses to seat Smith, that requires an ADDITIONAL small migration/UPDATE not present in 1397 — it was deliberately not bundled in, per the plan's own backstop clause ("an operator decision surfaced at the checkpoint; the elections/candidates seed itself is 219's job regardless").
- `cd C:/EV-Accounts/backend && npx tsx scripts/_apply-migration-1397_longview_princeton_runoff_closure.ts` — apply migration 1397 against production and confirm all gates (a through i) exit green, including the no-duplicate-runoff-row and two-distinct-Princeton-races gates.
- **Expected per-election race/candidate counts after apply:**
  - `2026 Texas Municipal General` (2026-05-02, shared row): +2 races (`Longview Council Member District 3` [2 candidates: Smith, Cooper], `Longview Council Member District 4` [1 candidate: Nustad]).
  - `Longview TX City Council District 3 Runoff 2026` (2026-06-13, migration 187): UNCHANGED — still 1 race (`Council Member District 3`), still 2 candidates (Smith, Cooper) — verified by the gate's before/after snapshot.
  - `Princeton TX City Council Place 4 Runoff 2026` (2026-06-13, newly minted): 1 race (`Princeton Council Member Place 4 Runoff`), 2 candidates (Rutledge, Goria).
  - `2026 Texas Municipal General` Princeton May special (migration 100, `Princeton Council Member Place 4`): UNCHANGED — still 1 race, still 4 candidates (Ramani, Goria, Rutledge, Abdulkareem) — verified by the gate's before/after snapshot.
- **Reused vs. minted rows:** REUSED — the shared `2026 Texas Municipal General` row (8eaba170...) and migration 187's Longview D3 runoff row (both resolved by name/date/state, neither re-minted). MINTED — `Princeton TX City Council Place 4 Runoff 2026` (2026-06-13, TX, special), the only new election row this migration creates.
- **Open/race-less seats (documented, not fabricated):** Longview Mayor, District 1, District 2, District 5, District 6 — none was up in the May 2026 cycle per migration 185's own term-date citations (2024/2025 elections, terms running to 2027/2028); correctly out of this plan's scope, not an open gap needing future research.
- **Holder-vs-cited-winner mismatches:** ONE, flagged above — Longview District 3's `offices.politician_id` (hold-over Wray Wade) does NOT match the cited runoff winner (Brandon Smith). This is the plan's headline flag, requiring an explicit operator decision before (or instead of) any seating UPDATE. Princeton Place 4 has NO mismatch — Rutledge is already correctly seated (migration 1389).
- After gates pass AND the seating decision is made: `git -C "C:/EV-Accounts" add -A && git -C "C:/EV-Accounts" commit -m "feat(219): close Longview D3 general + Princeton Place 4 runoff" && git -C "C:/EV-Accounts" push origin master`, then browse-spot-check `/results?browse_geo_id=4859576` (Princeton) confirming BOTH the May special and the June runoff render, and optionally `/results?browse_geo_id=4843888` (Longview) confirming the new D3 general + D4 races render alongside the existing D3 runoff.

- Migration 1397 is ready for the orchestrator to apply; the only open item is the Longview D3 seating decision (operator call, not a blocker to applying the migration itself). 219-07/219-08/219-09 (the remaining Wave-2/close plans) are unaffected by this plan's scope and can proceed independently once their own migration numbers are confirmed against the then-current on-disk MAX.

---
*Phase: 219-elections-candidates-backfill*
*Completed: 2026-07-24*
