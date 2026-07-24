---
phase: 219-elections-candidates-backfill
plan: 03
subsystem: data-seeding
tags: [collin-county, elections, races, candidates, texas, sql-migration, off-cycle]
status: complete
dependency-graph:
  requires: [219-01]
  provides: [migration-1394-authored]
  affects: [essentials.elections, essentials.races, essentials.race_candidates]
tech-stack:
  added: []
  patterns:
    - "Mint own election row by (name, election_date, state) via ON CONFLICT (name, election_date, state) DO NOTHING (migration 044's elections_name_date_state_unique constraint) — resolved afterward by name/date/state, never a hardcoded literal UUID"
    - "ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING (races)"
    - "WHERE NOT EXISTS (race_id, full_name) guard (race_candidates)"
    - "candidate_status='active' always; winner expressed via politician_id linkage, never a status value"
    - "Reuse offices.politician_id for a winner ONLY when the office already holds that exact cited person (verified via migrations 097/098's own seeding record, not a runtime name-match assertion)"
key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1394_collin_offcycle_zero_race.sql"
    - "C:/EV-Accounts/backend/scripts/_apply-migration-1394_collin_offcycle_zero_race.ts"
  modified: []
decisions:
  - "Josephine Place 1/2/4 winners (Aurand/Ridgway/Sardo) linked via offices.politician_id because migration 098 already seated each as the exact cited candidate for that seat — the plan's explicit criterion for linkage. Winner-vs-loser was NOT independently re-confirmed beyond that office-holder match (no citation found this session); documented as a conservative, evidence-bounded linkage in the migration header, not a fresh canvass confirmation."
  - "Lavon's three winners (Sanson/Cook/Dumas) are linked via offices.politician_id (migration 097 already seats each) but is_incumbent is set to FALSE for all of them — no citation this session states any of the three 'retained'/'re-elected' their seat, so incumbency was not assumed from 'office currently holds this person' alone."
  - "Saint Paul's 2025-05-03 Nail/Dryden and its 2026-05-02 cancelled-unopposed Trevino/Pierson/Bewley/Simmons both use migration 098's own header language ('continuing incumbents' vs '4 newly-elected') as the direct citation for is_incumbent true/false, respectively."
  - "Melissa (4847496) deliberately seeded with ZERO races this plan — no cited election-result roster exists for either of its two real reference cycles; only the current officeholder roster (not an election-result citation) was available. Documented as an explicit open gap per the plan's backstop, not guessed."
metrics:
  duration: "~1.5h (Tasks 1-2 only; Task 3 delegated to orchestrator)"
  completed: "2026-07-24"
---

# Phase 219 Plan 03: Josephine/Lavon/Saint Paul Off-Cycle Race Seeding Summary

Authored migration 1394 (12 races / 18 candidates across Josephine, Lavon, Saint Paul — 3 of the plan's original 4 target cities) plus its gated apply-script under `C:/EV-Accounts`, minting three new own-election rows by name/date/state and reusing the existing shared 2026-05-02 row for Saint Paul's cancelled-unopposed cohort. Melissa is deliberately left unseeded (documented open gap — see below). **Task 3 (operator apply/push/verify) was NOT executed — delegated to the orchestrator.**

## Task 1: Cited rosters (confirmed via 219-PREFLIGHT.md §4 + existing migration record; no fresh WebSearch/WebFetch tool was available this session)

I read `219-PREFLIGHT.md` §4 (the settled per-city reference-cycle decisions), `219-RESEARCH.md`, `219-CONTEXT.md`, and `219-01-PROBE-RESULTS.md`, then cross-checked every cited candidate name against the **existing DB office/politician seeding record** (migrations 090, 097, 098, 1388, 1389, 1390) — since I have no live DB access or WebSearch/WebFetch tool this session, this cross-check was the mechanism for confirming "does the office already hold this exact cited person" (the plan's explicit linkage criterion), rather than a runtime SQL check.

**Josephine (4838068)** — May 2026 ballot = props-only (matches migration 100's comment). Real most-recent HELD election = **November 4, 2025**: Place 1 Doug Ewing vs April Aurand; Place 2 Brad Ahlfinger vs Jane Ridgway; Place 4 Kenny McCarty vs Pamela Sardo (all cited via `cityofjosephinetx.com`'s official sample ballot PDF + Ballotpedia). Cross-checking migration 098 confirmed the office's CURRENT `politician_id` holders for these 3 seats are exactly April Aurand (Place 1), Jane Ridgway (Place 2), and Pam Sardo (Place 4, DB spelling drops "-ela") — each is one of the two cited candidates for that seat, satisfying the plan's exact linkage rule. Winner-of-record was **not** independently re-verified beyond this office-holder match (the one citizenportal.ai snippet naming a slightly different roster 403'd on fetch and was not used). Mayor + Place 3 (Jason Turney / Alex Esquivel, per migration 098): **no citation of any election found — left race-less, [OPEN]**. Place 5 (Gary Chappell): continuing incumbent, not up this cycle — no seeding action.

**Lavon (4841800)** — Real most-recent HELD election = **November 4, 2025**: Mayor Vicki Sanson (592-500, 54.21%-45.79%) defeated Joshua Murray; Place 4 Rachel Dumas defeated Ted Dill; Place 2 Mike Cook uncontested. Cited via `votes.decisiondeskhq.com` per-race pages + `ballotpedia.org` (Dumas) + `lavontx.gov` council minutes cross-check. Migration 097 confirms the office's current `politician_id` holders are exactly Sanson/Cook/Dumas — linked. `is_incumbent` set to **false** for all three (conservative choice — no "retained" language cited, unlike Van Alstyne's Atchison in migration 1393). Places 1, 3, 5 (Shepard/Jacob/Hedge): not on the Nov-2025 ballot per the sourced race pages — **left race-less, [OPEN]**.

**Saint Paul (4864220)** — SPLIT across two real cycles, resolving the "Seat"/"Place" naming-drift by joining on the DB's actual stored title (`Council Member Place N`, confirmed via migration 090): (a) **2025-05-03 own election**: Place 1 Larry Nail defeated Jason Sobotka; Place 2 David Dryden (Mayor Pro-tem) uncontested. Migration 098's own header comment ("2 continuing incumbents ... keep original valid_from") is the direct citation for `is_incumbent=true` on both. (b) **existing shared 2026-05-02 row**: the town's own General + Special were cancelled due to unopposed candidates — Mayor J.T. Trevino, Place 3 Gregory Pierson (DB: "Greg Pierson"), Place 4 Kristen Bewley, Place 5 Robert Simmons, all seeded per D-03. Migration 098's comment ("4 newly-elected take office 2026-06-01"; Trevino himself moved up from Place 4) is the direct citation for `is_incumbent=false` on all four. No Saint Paul seat left open — all 6 seeded across the two cycles.

**Melissa (4847496)** — Per PREFLIGHT, the props-only-vs-candidate-race conflict IS resolved (city council not on 2026-05-02 ballot), but **no cited election-result roster was found for either of Melissa's two real reference cycles** (fallback-2025-05-03 Mayor/Place2/Place4; fallback-2024-05-04 Place1/3/5/6) — only the current officeholder roster (a cross-check, not an election-result citation). Per the plan's explicit backstop, **Melissa is seeded with NOTHING this migration**; all 7 offices remain race-less, documented as an open gap for a future canvass-sourced reconcile phase.

## Task 2: Migration 1394 + apply-script

Confirmed migration numbering: `ls C:/EV-Accounts/backend/migrations` shows on-disk MAX = 1393 (219-02's migration, already committed) — 1394 is next-free, matching PREFLIGHT's locked map exactly, no drift.

Authored `C:/EV-Accounts/backend/migrations/1394_collin_offcycle_zero_race.sql`:
- Wrapped in `BEGIN`/`COMMIT`, single `DO $$` block.
- **Mints 3 own election rows** — `Josephine TX City General 2025` (2025-11-04), `Lavon TX City General 2025` (2025-11-04), `Saint Paul TX City General 2025` (2025-05-03) — each via `INSERT ... ON CONFLICT (name, election_date, state) DO NOTHING` (migration 044's `elections_name_date_state_unique` constraint), then resolved into a local variable by name/date/state (never a hardcoded UUID). Raises an exception if any mint+resolve fails.
- **Resolves the existing shared `2026 Texas Municipal General` row** (2026-05-02) the same way, for Saint Paul's 4 cancelled-unopposed seats.
- 12 races total, each city-prefixed (`'Josephine Council Member Place 1'`, `'Lavon Mayor'`, `'Saint Paul Council Member Place 3'`, etc.), `office_id` resolved via `geo_id` + `title` subquery join, `primary_party` NULL throughout (D-06), each `INSERT ... ON CONFLICT (election_id, position_name) WHERE primary_party IS NULL DO NOTHING`.
- 18 candidate rows, each `WHERE NOT EXISTS (race_id, full_name)` guarded. Winners carry `politician_id` resolved from `offices.politician_id` (reusing the already-seeded officeholder and photo, D-05); losers have no `politician_id`, name fields only. Every row `candidate_status='active'`; `is_incumbent` set explicitly per seat per the citation basis documented above.
- Melissa (4847496): zero SQL — documented in the header comment only.

Authored `C:/EV-Accounts/backend/scripts/_apply-migration-1394_collin_offcycle_zero_race.ts`, mirroring 1393's gate shape but generalized for 4 distinct elections (unlike 1393's single shared election):
- Captures `inform.politician_answers` count and Melissa's race count before any writes.
- Applies the migration SQL.
- Gate (a): per-geo_id race count > 0 for Josephine/Lavon/Saint Paul.
- Gate (b): every one of the 12 target races has ≥1 candidate.
- Gate (c): 0 candidate rows with `candidate_status NOT IN ('active','withdrawn','filed')` among this migration's races (checked per distinct election).
- Gate (d): 0 seeded races with non-NULL `primary_party` (checked per distinct election).
- Gate (e): `inform.politician_answers` total count unchanged before/after (D-07).
- Gate (f): the project-standard split-section SQL check returns 0 rows.
- **Gate (m)**: Melissa's (4847496) race count is asserted unchanged before/after — the explicit documented-empty gate required by the plan's acceptance criteria, with an inline comment citing the reason (no roster found).
- Gate (g): re-applies the same SQL a second time in-script and asserts both per-geo_id race counts and total candidate counts are unchanged (idempotency).
- Exits non-zero if any gate fails; prints a summary of all counts either way.

**Type-check:** `cd "C:/EV-Accounts/backend" && npx tsc --noEmit --target ES2022 --module ESNext --moduleResolution bundler --esModuleInterop --strict --skipLibCheck scripts/_apply-migration-1394_collin_offcycle_zero_race.ts` — clean, zero errors. A bare `npx tsc --noEmit <file>` (no explicit flags) reports the same category of pre-existing project-config-gap errors (`esModuleInterop`/top-level-`await`) that the identical bare invocation produces on the already-working `_apply-migration-1393...ts` script (this repo's `tsconfig.json` scopes `include` to `src/**/*` only, excluding `scripts/`, so an explicit file argument bypasses project-config detection and falls back to ES3-era defaults) — confirmed clean against the project's actual intended settings, matching 219-02's precedent exactly.

## Expected apply-time counts (for the orchestrator's Task 3 verification)

| City | Election | Races | Candidates |
|------|----------|-------|-----------|
| Josephine (4838068) | Josephine TX City General 2025 (2025-11-04) | 3 (Place 1, Place 2, Place 4) | 6 |
| Lavon (4841800) | Lavon TX City General 2025 (2025-11-04) | 3 (Mayor, Place 2, Place 4) | 5 |
| Saint Paul (4864220) | Saint Paul TX City General 2025 (2025-05-03) | 2 (Place 1, Place 2) | 3 |
| Saint Paul (4864220) | 2026 Texas Municipal General (2026-05-02, shared) | 4 (Mayor, Place 3, Place 4, Place 5) | 4 |
| **Total** | — | **12** | **18** |

## Seats left race-less (documented reasons)

- Josephine Mayor, Place 3 (Jason Turney, Alex Esquivel) — no citation of any election found this session; [OPEN] per PREFLIGHT.
- Josephine Place 5 (Gary Chappell) — continuing incumbent, not up this cycle; no seeding action (matches migration 1389/1390's own documentation).
- Lavon Places 1, 3, 5 (Mike Shepard, Travis Jacob, Lindsey Hedge) — not on the Nov-2025 ballot per the sourced decisiondeskhq.com race pages; [OPEN] per PREFLIGHT.
- **Melissa (4847496) — all 7 offices (Mayor + Place 1-6)**: no cited election-result roster found for either real reference cycle (fallback-2025-05-03 or fallback-2024-05-04); the only available data (current officeholder roster) is not an election-result citation. Deferred to a future canvass-sourced reconcile phase per the plan's explicit backstop.

## Task 3 — DELEGATED TO ORCHESTRATOR

**Task 3 (operator applies 1394, confirms gates green, pushes, browse spot-check) was NOT executed by this subagent.** Per the objective's explicit instruction, the orchestrator (with Chris's authorization to apply/verify/push against production) performs: `npx tsx scripts/_apply-migration-1394_collin_offcycle_zero_race.ts` from `C:/EV-Accounts/backend`, confirms all gates print green (including the new Melissa documented-empty gate m), commits + pushes `C:/EV-Accounts` (Render auto-deploys), and does the live browse spot-check (e.g. `/results?browse_geo_id=4838068` Josephine, `/results?browse_geo_id=4841800` Lavon, `/results?browse_geo_id=4864220` Saint Paul).

This subagent made **zero writes to the production database** and made **zero commits/pushes to `C:/EV-Accounts`** — the migration and apply-script files exist only as untracked files on disk in that repo, ready for the orchestrator to apply.

## Deviations from Plan

### Auto-fixed / Research-adjusted

**1. [Rule 3-adjacent — tooling constraint] No WebSearch/WebFetch tool available this execution session**
- **Found during:** Task 1.
- **Issue:** The plan's Task 1 `<action>` calls for confirming rosters "using WebSearch/WebFetch + the Collin canvass PDF," but this subagent's toolset this session did not include WebSearch or WebFetch.
- **Fix:** Relied entirely on the already-extensive, multiply-cited PREFLIGHT.md §4 findings (which themselves were produced by a prior WebSearch/WebFetch-equipped session) plus a fresh cross-check against the existing on-disk migration record (090/097/098/1388/1389/1390) to confirm office→politician linkage eligibility. No new claims were fabricated; every seeded fact traces to a PREFLIGHT citation or an existing migration's own documented seeding record.
- **Files modified:** N/A (research-only; no incorrect facts were carried forward — PREFLIGHT's findings for these 3 cities were already fully resolved, not left as [RE-VERIFY]).
- **Commit:** N/A.

**2. [Rule 2 — documentation completeness] Added an explicit Melissa "documented-empty" gate to the apply-script**
- **Found during:** Task 2.
- **Issue:** The plan's acceptance criteria required that a documented-empty city's gate "asserts an explicit expected-0 with a comment citing the reason (not a silent skip)" — this wasn't automatically covered by the 1393-style gate shape (which only tracks cities the migration actually seeds).
- **Fix:** Added gate (m), a before/after race-count assertion scoped to Melissa's geo_id, with the reason cited inline in both the migration header and the apply-script comment.
- **Files modified:** `1394_collin_offcycle_zero_race.sql` (header), `_apply-migration-1394_collin_offcycle_zero_race.ts` (gate m).
- **Commit:** N/A this repo (files live in `C:/EV-Accounts`, not yet committed — see Task 3 delegation above).

No other deviations. No bugs, no blocking issues, no architectural questions encountered.

## Self-Check: PASSED
