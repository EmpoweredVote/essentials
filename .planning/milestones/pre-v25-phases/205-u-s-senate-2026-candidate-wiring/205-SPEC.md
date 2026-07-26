# Phase 205: U.S. Senate 2026 Candidate Wiring — Specification

**Created:** 2026-07-15
**Ambiguity score:** 0.15 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

Every 2026 U.S. Senate race whose seat can be confidently identified gets its `essentials.races.office_id` set to the correct `NATIONAL_UPPER` seat office (the incumbent seat up for election in that state in 2026), so its candidates surface by address exactly like House candidates already do — changing those races from `office_id = NULL` (invisible) to correctly linked.

## Background

Verified against production (`mcp__supabase-local`) on 2026-07-15:

- **U.S. Senate races/candidates are seeded but orphaned.** `essentials.races` where `position_name ILIKE 'U.S. Senate %'` = **51 races, all with `office_id = NULL`**, **189 candidates** (`race_candidates`) across **35 states**. Multi-race states are legitimate primary(per-party)/general splits, not duplicates.
- **The address→candidates chain is `address → district → office → race → race_candidates`.** With `races.office_id` NULL, Senate races attach to no office/district, so nothing surfaces by address. This is the single broken link.
- **House is the working reference.** A House race (e.g. `U.S. House MA-01`) has `office_id` → the **incumbent seat office** (title `Representative`, incumbent Richard Neal, district `NATIONAL_LOWER`); candidates (incumbent + challengers) live in `race_candidates`. Federal incumbents and geofences are fully seeded nationwide (Senate seats: 50/50 states filled).
- **`NATIONAL_UPPER` offices are polluted and inconsistent.** Across 50 states there are ~152 `NATIONAL_UPPER` office rows: the two real seat offices per state (title `Senator` / `U.S. Senate - {State}`, with the sitting senator as incumbent) PLUS stray per-candidate rows titled `Candidate for U.S. Senate — {State}` (e.g. FL: Angie Nixon, Alex Vindman) — and inconsistently (TN has only the two seat offices, no candidate rows). House candidates never got their own offices, so these candidate-offices are stray artifacts, not link targets.
- **"Correct" requires seat selection, not just state matching.** Each state has two seats; only the one up in 2026 (Class 2, plus 2026 special elections such as OH → Husted and FL → Moody) is correct. Example correct links: MN → Tina Smith (not Klobuchar), TX → John Cornyn (not Cruz), TN → Bill Hagerty (not Blackburn).

## Requirements

1. **2026 seat map (derived)**: A per-state authoritative map of which Senate seat is up for election in 2026 exists and is reviewable.
   - Current: No explicit mapping of 2026 Senate races to seat offices; the correct seat is only implicit in public record.
   - Target: A derived per-state map (state → the 2026 incumbent / seat office to link, covering Class 2 + 2026 special elections) is produced and surfaced for the user to spot-check before any write.
   - Acceptance: The map lists every state that has a 2026 U.S. Senate race in the DB, names the specific seat office (by incumbent) chosen per state, and is presented for review; states where the seat cannot be confidently determined are listed separately as "skipped."

2. **Race → seat office linkage**: Every confidently-mapped 2026 U.S. Senate race is linked to the correct `NATIONAL_UPPER` seat office.
   - Current: All 51 `U.S. Senate %` races have `office_id = NULL`.
   - Target: Each confidently-mapped race has `office_id` set to that state's 2026 seat office — the real `Senator`/`U.S. Senate - {State}` office (never a `Candidate for U.S. Senate — {State}` stray office).
   - Acceptance: For every mapped race, `races.office_id` is non-null and resolves through `offices → districts` to a `NATIONAL_UPPER` district for the race's state, and the linked office's title is a seat title (not `Candidate for U.S. Senate%`).

3. **Candidates surface by address**: Senate candidates appear for an in-state address the same way House candidates do.
   - Current: Entering an address in a state with a 2026 Senate race shows no Senate race/candidates.
   - Target: For a state with a mapped 2026 Senate race, an in-state address surfaces that race and its `race_candidates`.
   - Acceptance: For a sample of ≥3 mapped states, the address/results path returns the Senate race with its candidate list (parity with a House race in the same response).

4. **Confident-only, flag-and-skip the rest**: No race is linked to an uncertain or wrong seat.
   - Current: N/A (nothing linked).
   - Target: Races whose 2026 seat cannot be confidently identified (missing seat office, ambiguous match) are left `office_id = NULL` and reported for manual resolution; no best-effort/guessed links.
   - Acceptance: A written report lists every skipped race with the reason; zero races are linked to a seat that is not the 2026 seat for that state.

5. **No collateral changes**: House linkage and federal incumbent data are untouched.
   - Current: House races correctly linked; incumbents seeded.
   - Target: Only `essentials.races.office_id` for `U.S. Senate %` races is modified; no changes to House races, offices, districts, politicians, or `race_candidates`.
   - Acceptance: A before/after diff shows the only mutated rows are `races` rows with `position_name ILIKE 'U.S. Senate %'` (only `office_id` changed); House race count/linkage and NATIONAL_UPPER office/incumbent rows are unchanged.

## Boundaries

**In scope:**
- Deriving the per-state 2026 Senate seat map (Class 2 + 2026 special elections) and surfacing it for spot-check.
- Setting `essentials.races.office_id` for confidently-mapped `U.S. Senate %` races to the correct `NATIONAL_UPPER` seat office (production data migration).
- Verifying candidates surface by address for a sample of mapped states (House parity).
- A report of skipped/unresolved races.

**Out of scope:**
- Cleaning up / removing the stray `Candidate for U.S. Senate — {State}` office rows — deferred to a follow-on data-hygiene pass to keep this migration low-risk (does not block surfacing).
- Senate candidate headshots — follow-on; not required to surface.
- Senate candidate compass stances — follow-on; not required to surface.
- Any frontend/API code changes — the House path already works; this is data-only.
- Backfilling additional Senate races/candidates beyond what is already seeded — this phase wires up existing data only.

## Constraints

- Production data migration against `essentials` (writes are live — `mcp__supabase-local` is production). Must be applied deliberately with before/after verification.
- Data-only: no application code changes expected; correctness is defined by parity with the existing House `race → office → district` linkage.
- Seat selection must target real seat offices (`Senator` / `U.S. Senate - {State}`), never the stray `Candidate for U.S. Senate — {State}` offices.
- Idempotent/re-runnable: applying the linkage twice must not create duplicate or conflicting state.

## Acceptance Criteria

- [ ] A per-state 2026 seat map is produced covering every state with a `U.S. Senate %` race in the DB, and is presented for user spot-check before writes.
- [ ] Every confidently-mapped `U.S. Senate %` race has a non-null `office_id` resolving to its state's `NATIONAL_UPPER` seat office (seat title, not a `Candidate for U.S. Senate%` office).
- [ ] For ≥3 mapped states, an in-state address surfaces the Senate race and its candidates (House parity confirmed).
- [ ] Every skipped race is listed with a reason; zero races are linked to a non-2026 seat.
- [ ] Before/after diff confirms only `races.office_id` on `U.S. Senate %` rows changed — House linkage, offices, districts, politicians, and `race_candidates` unchanged.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                        |
|--------------------|-------|------|--------|--------------------------------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Link 2026 Senate races to correct seat office; measurable    |
| Boundary Clarity   | 0.85  | 0.70 | ✓      | Stray-office cleanup, headshots, stances, code all excluded  |
| Constraint Clarity | 0.80  | 0.65 | ✓      | Data-only prod migration; seat-title targets; idempotent     |
| Acceptance Criteria| 0.80  | 0.70 | ✓      | 5 pass/fail criteria incl. before/after diff + address check |
| **Ambiguity**      | 0.15  | ≤0.20| ✓      |                                                              |

## Interview Log

| Round | Perspective     | Question summary                                   | Decision locked                                                        |
|-------|-----------------|---------------------------------------------------|-----------------------------------------------------------------------|
| 0     | Researcher      | What's the actual DB state? (pre-spec scouting)   | 51 orphaned Senate races (office_id NULL), 189 cands; House is wired   |
| 0     | Researcher      | How does the House linkage work?                  | race.office_id → incumbent seat office; candidates in race_candidates  |
| 1     | Boundary Keeper | Clean up stray 'Candidate for U.S. Senate' rows?  | Defer to follow-on — keep 205 to race→seat linkage only                |
| 1     | Failure Analyst | What if the 2026 seat is uncertain for a state?   | Flag & skip, report; never best-effort/guess a wrong seat             |
| 1     | Simplifier      | Source of truth for which seat is up in 2026?     | I derive (Class 2 + specials); user spot-checks before writes          |

---

*Phase: 205-u-s-senate-2026-candidate-wiring*
*Spec created: 2026-07-15*
*Next step: /gsd:discuss-phase 205 — implementation decisions (how to build what's specified above)*
