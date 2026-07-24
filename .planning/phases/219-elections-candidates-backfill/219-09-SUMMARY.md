---
phase: 219-elections-candidates-backfill
plan: 09
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, verification, coverage-rollup, phase-gate]
status: complete
dependency-graph:
  requires: [219-02, 219-03, 219-04, 219-05, 219-06, 219-07, 219-08]
  provides: [phase-219-coverage-verified]
  affects: []
tech-stack:
  added: []
  patterns:
    - "Read-only phase-gate verify script: 24-government roll-up scoped by geo_id, no writes"
key-files:
  created:
    - "C:/EV-Accounts/backend/scripts/_verify-219-coverage.ts"
    - ".planning/phases/219-elections-candidates-backfill/219-COVERAGE.md"
  modified: []
decisions:
  - "Verify script scopes phase-wide checks (zero-candidate-shell, antipartisan, future-date) by joining through the 24 governments' geo_ids rather than enumerating specific election_ids — this covers every race under those governments (pre-existing + phase-new) with no hardcoded UUIDs, matching the orchestrator's authoritative consolidated roll-up shape."
  - "Melissa is coded as an explicit documented-zero-race exception in the verify script's check (4), not silently excluded — the script asserts Melissa == 0 races (not >=1 like every other zero-race-tier government), so a future accidental Melissa seed OR a future accidental Melissa regression would both be caught."
metrics:
  duration: "~40min"
  completed: "2026-07-24"
---

# Phase 219 Plan 09: Coverage Verification + Documentation Summary

Authored the reusable read-only phase-gate roll-up script (`_verify-219-coverage.ts`) and the documented coverage roll-up (`219-COVERAGE.md`) that consolidate all seven Wave-2 seeding plans (219-02 through 219-08 / migrations 1393-1399) into a single authoritative phase-close verification, using the orchestrator's already-applied production results. **No database writes were made by this plan** — it is verification + documentation only, as specified.

## Task 1: Coverage roll-up script + COVERAGE.md

Authored `C:/EV-Accounts/backend/scripts/_verify-219-coverage.ts` (mirroring migration 1393's apply-script connection pattern: `import 'dotenv/config'`, `Pool` with `ssl: { rejectUnauthorized: false }`). The script is pure-SELECT — no `INSERT`/`UPDATE`/`DELETE` anywhere — and asserts, exiting non-zero on any failure:

1. **0 zero-candidate shells** across all 24 governments (races LEFT JOINed to `race_candidates`, filtered to `rc.id IS NULL`).
2. **0 non-NULL `primary_party`** on any of the 24 governments' races (antipartisan, D-06).
3. **0 races linked to a future-dated election** (`election_date > CURRENT_DATE`, D-02).
4. **Every zero-race-tier government except Melissa has >= 1 race; Melissa has exactly 0** — coded as an explicit named exception, not a silent skip, so either direction of drift (Melissa accidentally seeded, or another government accidentally left at 0) is caught.
5. **Prints the full per-government race/office/candidate roll-up** for all 24 governments (zero-race tier + thin tier).

Type-checked clean: `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --skipLibCheck scripts/_verify-219-coverage.ts` — exit 0, zero errors.

Authored `.planning/phases/219-elections-candidates-backfill/219-COVERAGE.md` using the orchestrator's authoritative, already-applied production verification results (all 7 Wave-2 migrations 1393-1399 applied; consolidated 24-government roll-up run against prod). It documents:

- The phase-wide invariants (0 zero-candidate shells, 0 non-NULL `primary_party`, 0 future-dated races, `inform.politician_answers` unchanged at 34215).
- Net new: 37 races / 54 candidates across the phase.
- The full 24-government table (12 zero-race + 12 thin tier), each with offices/races/raced-offices counts.
- COLLIN-ELECT-01/02/03 status: **all MET**, with Melissa as the sole documented legitimately-open exception to COLLIN-ELECT-01.
- The full reconciliation of every remaining documented-[OPEN] office against each Wave-2 plan's SUMMARY (Blue Ridge P2/3/4, Farmersville, Josephine, Lavon, McKinney, Nevada, Plano [+ the Place-6 genuine-vacancy distinction], Richardson, Van Alstyne, Weston in the zero-race tier; the 41 SOURCED-ONLY thin-tier offices across Allen/Anna/Lucas/Murphy/Prosper/Parker/Celina/Frisco/Fairview/Lowry Crossing) — every one labeled legitimately-open, not a defect.
- The Longview D3 seating-gap flag (offices.politician_id hold-over Wray Wade vs. confirmed runoff winner Brandon Smith) — surfaced as an operator decision, not resolved this phase.
- The Prosper geo_id correction (real geo_id 4859696; stale 4863276 from early drafts superseded).
- A future-reconcile section: Melissa, the Longview D3 seating decision, and the 41+ SOURCED-ONLY [OPEN] offices as candidates for a future session with live WebSearch/WebFetch tooling.

## Task 2: Operator checkpoint — PENDING

**This task was NOT executed by this plan** (it is a `checkpoint:human-verify` operator-run task, per the plan's own design — the executor has no DB access and the browse spot-check is a genuine human-visual step the machine cannot perform).

Per the orchestrator's explicit instruction for this run: the orchestrator already ran the authoritative DB verification (all 7 migrations applied, consolidated 24-government roll-up confirmed against prod — the exact results now recorded in `219-COVERAGE.md`). The remaining item is the **human browse spot-check**, which is marked here as:

**Browse spot-check: PENDING OPERATOR VISUAL CONFIRMATION**

- `/results?browse_geo_id=4808872` (Blue Ridge — shared-election tier)
- `/results?browse_geo_id=4845744` (McKinney — fallback-year tier)
- `/results?browse_geo_id=4843888` (Longview — runoff-closure tier)

Confirm each shows real races + candidates rendering in the Elections section, and that no government shows an empty Elections section unless `219-COVERAGE.md` documents it as legitimately-empty (Melissa).

## Deviations from Plan

None. This plan's Task 1 executed exactly as written — read-only verify script + documentation, no seeding. Task 2 (operator checkpoint) is intentionally not auto-approved; it awaits the operator's own browse-spot-check per the plan's `gate="blocking"` design.

## Known Stubs

None introduced by this plan (no frontend/UI changes; documentation + a read-only backend script only).

## Threat Flags

None. The verify script performs no writes and introduces no new trust boundary, endpoint, or schema surface — it reads the same `essentials`/`inform` schemas every prior migration's apply-script already reads.

## Self-Check: PASSED

- FOUND: `C:/EV-Accounts/backend/scripts/_verify-219-coverage.ts` (type-checks clean, read-only, covers checks (1)-(5)).
- FOUND: `.planning/phases/219-elections-candidates-backfill/219-COVERAGE.md` (24-government table + phase invariants + COLLIN-ELECT-01/02/03 status + documented-[OPEN] reconciliation + Longview D3 flag + Prosper geo_id note + future-reconcile section).
- No production database writes made by this plan (verified: script is pure-SELECT, grepped for INSERT/UPDATE/DELETE — none found).
- Browse spot-check (Blue Ridge / McKinney / Longview) is PENDING OPERATOR VISUAL CONFIRMATION — not auto-approved, per the plan's `gate="blocking"` checkpoint design.
