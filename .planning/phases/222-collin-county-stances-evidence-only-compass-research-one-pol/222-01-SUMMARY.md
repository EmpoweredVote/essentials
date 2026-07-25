---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 01
subsystem: database
tags: [postgres, supabase, compass, stance-research, data-integrity, requirements]

requires: []
provides:
  - "Live-derived 222-01-WORKLIST.md: 164/57/107 BEFORE snapshot, verified topic UUIDs, live next migration number 1416, exhaustive per-plan assignment table for the 107 un-stanced worklist"
  - "222-CONFIRMED-BLANK.md blank-register skeleton (D-08), per-person-per-topic granularity"
  - "COLLIN-STANCE-01/02 promoted into .planning/REQUIREMENTS.md with traceability rows; stale deferral bullet superseded in place"
  - "222-01-INTEGRITY-AUDIT.md: county-wide audit of the 220 pre-existing already-stanced answer rows, 12 Class A rows flagged for deletion, 19 Class B2 rows flagged for hand review"
  - "Operator-approved re-scope of 222-02 (Plano no-op -> county-wide stance-integrity remediation) and 222-04 (McKinney no-op -> Plano+McKinney topic-gap fill)"
affects: [222-02, 222-03, 222-04, 222-05, 222-06, 222-07, 222-08, 222-09, 222-10, 222-11, 222-12, 222-13, 222-14, 222-15, 222-16, 222-17, 222-18]

tech-stack:
  added: []
  patterns:
    - "Live-derive-then-checkpoint: never trust a discussion-time DB anchor, re-derive at execution, gate wave 2 on an explicit operator sign-off"
    - "Per-(politician_id, topic_id) granularity for both the do-not-overwrite set and the blank-register completeness contract"

key-files:
  created:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-01-WORKLIST.md"
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-01-INTEGRITY-AUDIT.md"
  modified:
    - ".planning/REQUIREMENTS.md"

key-decisions:
  - "BEFORE snapshot is live data (164 total in-scope / 57 with >=1 stance / 107 without), superseding CONTEXT.md's discussion-time 157/55/102 anchor"
  - "Assignment exhaustiveness confirmed: 107 worklist rows = 107 assignment-table rows, 0 unassigned, 0 duplicated"
  - "Frisco Place 4 resolves to a single active politician, Jared Elad, not Gopal Ponangi (who is is_active=false, office_id=NULL, a known non-regression per 221-CONFIRMED-BLANK.md)"
  - "housing/taxes/healthcare live question_text matches RESEARCH.md section B verbatim; no wording override needed for downstream research plans"
  - "REQUIREMENTS.md promotion accepted: COLLIN-STANCE-01/02 tracked, stale Collin-stances deferral bullet superseded in place (not deleted)"
  - "Longview (5 un-stanced, exceeding the plan's own 3-person threshold) APPROVED to stay in 222-07 as an 8-person plan (Prosper 1 + Celina 2 + Longview 5); no 19th plan created"
  - "The 57-person partially-stanced residual (nobody holds all 11 topics) ACCEPTED as out of scope for Phase 222 per D-07, EXCEPT Plano and McKinney, which are pulled back into scope via the repurposed 222-04"
  - "Blank-register contract CONFIRMED as per-person-per-topic, not per-person: a person may legitimately appear in both the applied-migration bucket and the blank register for different topics; 222-18 reconciles at (person, topic) granularity"
  - "222-02 REPURPOSED from 'Plano, 0 un-stanced, no-op' into a county-wide stance-integrity remediation plan: delete 12 Class A defective rows, hand-review 19 Class B2 rows, log every deletion in 222-CONFIRMED-BLANK.md at (person, topic) granularity"
  - "222-04 REPURPOSED from 'McKinney, 0 un-stanced, no-op' into a Plano + McKinney topic-gap fill: evidence-only research for ~93 unfilled topic slots across 15 people, to be re-derived live at execution (the Class A deletions shrink several per-person counts)"

patterns-established:
  - "Value-integrity vs. reasoning-integrity split: a stance row can be numerically clean (integer, in-range, paired context row) while still being an evidence-bar violation in its reasoning text/sourcing — audit both dimensions separately"
  - "D-07 ('leave existing records as-is') read as 'do not redo settled research', never as 'retain rows now known to be unsourced' — a blank spoke is always the correct terminal state for a row that fails the evidence bar, regardless of which phase originally wrote it"

requirements-completed: [COLLIN-STANCE-01, COLLIN-STANCE-02]

coverage:
  - id: D1
    description: "Live worklist derivation (164/57/107 BEFORE snapshot) supersedes CONTEXT.md's discussion-time 157/55/102 anchor, using the is_vacant IS NULL OR-form filter"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Operator Task 3 checkpoint sign-off, 2026-07-25 — confirmed BEFORE snapshot is live data dated today"
        status: pass
    human_judgment: false
  - id: D2
    description: "Exhaustive, non-overlapping per-plan assignment table for the 107-person worklist across plans 222-02..222-17 (post re-scope: 222-03 and 222-05..222-17)"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "Operator Task 3 checkpoint sign-off, 2026-07-25 — confirmed assignment exhaustiveness (107=107, 0 unassigned, 0 duplicated)"
        status: pass
    human_judgment: false
  - id: D3
    description: "11 canonical topic UUIDs verified live in inform.compass_topics; housing/taxes/healthcare question_text checked against RESEARCH.md section B with no divergence found"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Operator Task 3 checkpoint sign-off, 2026-07-25 — confirmed wording-check result, no override needed"
        status: pass
    human_judgment: false
  - id: D4
    description: "REQUIREMENTS.md carries COLLIN-STANCE-01/02 with traceability rows; stale deferral bullet superseded in place, not deleted"
    requirement: "COLLIN-STANCE-01"
    verification:
      - kind: manual_procedural
        ref: "grep -n COLLIN-STANCE .planning/REQUIREMENTS.md — lines 49, 54, 55, 59, 88, 89 present"
        status: pass
    human_judgment: false
  - id: D5
    description: "County-wide integrity audit of the 220 pre-existing already-stanced answer rows: value-integrity clean, 12 Class A rows flagged for deletion, 19 Class B2 rows flagged for hand review, feeding the repurposed 222-02/222-04"
    verification: []
    human_judgment: true
    rationale: "The audit's severity classification (which rows are evidence-bar violations vs. acceptable inference-style prose) is a judgment call about reasoning-text quality, not something a test can assert; the operator already reviewed and approved the resulting re-scope at the Task 3 checkpoint, but the underlying 12+19-row classification itself should remain human-auditable rather than silently auto-passed."

duration: n/a (continuation agent; timing spans the original Task 1/2 execution plus this Task 3 aftermath)
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 01: Live Worklist, BEFORE Snapshot & Operator Sign-Off (with Integrity-Driven Re-Scope) Summary

**Live-derived 164/57/107 Collin County stance worklist, operator-approved with two plans (222-02, 222-04) repurposed from no-op into county-wide integrity remediation and a Plano+McKinney gap-fill after a widened audit found 12 evidence-bar-violating rows and 19 rows needing hand review in the already-stanced cohort.**

## Performance

- **Tasks:** 3 of 3 (Task 1 + Task 2 executed by the prior agent session; Task 3's blocking checkpoint reached, operator approved with amendments; this continuation agent recorded the sign-off, wrote the integrity audit, amended the worklist, and closed out the plan)
- **Files modified:** 4 (222-01-WORKLIST.md, 222-CONFIRMED-BLANK.md, .planning/REQUIREMENTS.md, plus this plan's new 222-01-INTEGRITY-AUDIT.md)

## Accomplishments

- Derived the live ground truth for Phase 222: 164 total in-scope active/not-vacant Collin officeholders, 57 already holding >= 1 stance, 107 with zero stances (the worklist this phase's research plans target) — both the any-topic and 11-topic-restricted variants are identical, settling RESEARCH.md Open Question 1.
- Verified all 11 canonical topic UUIDs resolve live in `inform.compass_topics` with `is_live = true`, confirmed the `homelessness-response` decoy does not collide, and confirmed the housing/taxes/healthcare `question_text` matches RESEARCH.md section B verbatim.
- Resolved Frisco Place 4 to a single active politician (Jared Elad) and confirmed Gopal Ponangi is a known non-regression (`is_active = false`, `office_id = NULL`).
- Determined Longview has 5 un-stanced officeholders (exceeding the plan's own 3-person threshold) and recorded it as an operator decision point.
- Built an exhaustive, non-overlapping per-plan assignment table covering all 107 worklist rows across plans 222-02 through 222-17, with zero names unassigned and zero duplicated.
- Created the `222-CONFIRMED-BLANK.md` blank-register skeleton and promoted `COLLIN-STANCE-01`/`COLLIN-STANCE-02` into `.planning/REQUIREMENTS.md` with traceability rows, superseding (not deleting) the stale deferral bullet.
- At the Task 3 blocking checkpoint, the operator approved the overall scope but rejected the "close 222-02/222-04 as no-op" recommendation, asking for Plano and McKinney to be double-checked as an early-stanced cohort. That check — widened county-wide by the orchestrator — surfaced 12 evidence-bar-violating rows (Class A: unsupported defaults, party naming, ethnicity/religion/birthplace inference) and 19 weak-adjacency rows needing hand review (Class B2) across the 57 already-stanced people. This is documented in the new `222-01-INTEGRITY-AUDIT.md`.
- Recorded the operator's four resolved decisions and amended the worklist's assignment table and decisions section to reflect the re-scoped 222-02 (county-wide remediation) and 222-04 (Plano+McKinney gap-fill), with an explicit note that the 107-person research worklist's coverage is unchanged by this re-scope.

## Task Commits

Each task was committed atomically by the original executor session and this continuation session:

1. **Task 1: Derive live worklist, BEFORE snapshot, topic-UUID verification, migration number** — read-only, no commit (SQL run by the orchestrator; no files written).
2. **Task 2: Write 222-01-WORKLIST.md, blank register, promote REQUIREMENTS.md** — `ac8a1220` (docs)
3. **Task 3 aftermath: record operator sign-off, write integrity audit, amend worklist, close plan** — see commit below (this session)

**Plan metadata:** committed alongside the Task 3 aftermath commit.

## Files Created/Modified

- `.planning/phases/222-.../222-01-WORKLIST.md` — BEFORE snapshot, topic verification, Frisco/Longview determinations, per-plan assignment table (amended: 222-02/222-04 rows re-scoped, operator decisions marked RESOLVED, coverage-unchanged note added), 107-row worklist, do-not-overwrite set.
- `.planning/phases/222-.../222-CONFIRMED-BLANK.md` — blank-register skeleton, D-08 completeness contract (per-person-per-topic).
- `.planning/REQUIREMENTS.md` — COLLIN-STANCE-01/02 added, traceability rows added, stale deferral bullet superseded in place.
- `.planning/phases/222-.../222-01-INTEGRITY-AUDIT.md` (new) — county-wide audit of the 220 pre-existing already-stanced rows: clean-value finding, severity bucket table, full 12-row Class A table with politician_id/topic_id and verbatim excerpts, 19-row Class B2 list, Plano/McKinney gap detail, disposition statement assigning remediation to 222-02 and gap-fill to 222-04.

## Decisions Made

See `key-decisions` in frontmatter for the full list. Highlights:

- BEFORE snapshot (164/57/107) is authoritative live data, superseding CONTEXT.md's 157/55/102 discussion-time anchor.
- Longview stays in 222-07 as an 8-person plan; no 19th plan.
- The 57-person partially-stanced residual is accepted out of scope per D-07, **except** Plano and McKinney, which get a dedicated gap-fill via the repurposed 222-04.
- Blank-register completeness is tracked at (person, topic) granularity, not (person) granularity — a person can legitimately have both sourced-and-applied topics and unsourced-and-blanked topics simultaneously.
- 222-02 is repurposed from a no-op Plano plan into a county-wide stance-integrity remediation plan (delete 12 Class A rows, hand-review 19 Class B2 rows).
- 222-04 is repurposed from a no-op McKinney plan into a Plano + McKinney topic-gap fill (~93 unfilled slots across 15 people, re-derived live).

## Deviations from Plan

### Auto-fixed / Operator-Directed Issues

**1. [Rule 4 - Architectural/scope decision, operator-directed] 222-02 and 222-04 repurposed rather than closed as no-op**
- **Found during:** Task 3 blocking checkpoint
- **Issue:** The plan's own how-to-verify step recommended closing 222-02 (Plano) and 222-04 (McKinney) as no-op plans since both cities have zero un-stanced officeholders. The operator rejected this recommendation and asked for both cities to be double-checked, since they were stanced early in the project and might contain quality misses.
- **Fix:** The orchestrator ran a widened, county-wide integrity audit of all 220 existing `inform.politician_answers` rows held by the 57 already-stanced people (not just Plano/McKinney). The audit found the values themselves are clean (no non-integer/out-of-range values, no orphaned rows) but found 12 rows that violate the evidence-only bar (D-04) — unsupported defaults, party naming, ethnicity/religion/birthplace-based inference — and 19 rows with weak-adjacency reasoning needing hand review. This is documented in full in `222-01-INTEGRITY-AUDIT.md`.
- **Files modified:** `.planning/phases/222-.../222-01-INTEGRITY-AUDIT.md` (new), `.planning/phases/222-.../222-01-WORKLIST.md` (assignment table + decisions section amended)
- **Operator sign-off:** the operator confirmed both re-scope decisions explicitly (see `<operator_decisions_at_task3_gate>` in this continuation's task brief). No stance rows were written, deleted, or migrated by this plan — 222-02 and 222-04 will execute the actual delete/hand-review/gap-fill work in their own plans.
- **Committed in:** this session's Task 3 aftermath commit.

**2. [Rule 3 - Blocking, tool-availability] `mcp__supabase-local__execute_sql` not bound in executor sessions**
- **Found during:** Task 1 (original executor session) and again confirmed in this continuation session
- **Issue:** This plan's Task 1 requires running live SQL against production (`mcp__supabase-local__execute_sql`), but that tool is not bound in executor agent sessions — only in orchestrator sessions. The plan's own Task 1 action explicitly anticipates this ("If `mcp__supabase-local__execute_sql` is not bound in this session, STOP and emit the exact SQL to the operator as a blocking request").
- **Fix:** All Task 1 SQL (worklist derivation, topic-UUID verification, Frisco Place 4 / Longview cross-checks, migration-number directory listing) and the Task 3 aftermath's widened integrity audit were run by the orchestrator, which does have the binding, and the results were handed to this executor inline. No estimates were substituted; no work proceeded on CONTEXT.md's discussion-time numbers.
- **Impact on downstream plans:** plans 222-02 through 222-18 will hit the identical tool-availability wall for their own live SQL (worklist re-verification, migration authoring/application, before/after deltas). **Each of those plans' SQL must be run orchestrator-side or by the operator directly** — this is a structural constraint of the current session model, not a one-off gap in this plan.
- **Committed in:** n/a (no code/data written by this deviation — informational, carried forward as a standing note for every downstream plan).

---

**Total deviations:** 2 (1 operator-directed scope re-repurposing following a widened integrity audit; 1 standing tool-availability constraint affecting all downstream plans in this phase).
**Impact on plan:** No stance data was written, deleted, or migrated by this plan — Phase 222's zero-stance-rows-written invariant for Plan 01 holds. The re-scope adds well-scoped remediation/gap-fill work to two already-planned plan slots without touching the 107-person worklist's coverage or exhaustiveness.

## Issues Encountered

None beyond the two deviations above, both resolved within this plan's scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 (222-02) is unlocked: the operator has approved the live scope, including the re-scoped 222-02 (county-wide remediation) and 222-04 (Plano+McKinney gap-fill).
- 222-02 must read `222-01-INTEGRITY-AUDIT.md` for the exact 12 Class A rows to delete and the 19 Class B2 rows to hand-review, and must log every deletion in `222-CONFIRMED-BLANK.md` at (person, topic) granularity.
- 222-04 must re-derive its exact Plano+McKinney gap list live at execution start rather than trusting the ~93-slot pre-deletion snapshot in the integrity audit, since 222-02's deletions shrink several per-person topic counts.
- 222-03 and 222-05..222-17 proceed unchanged against the original 107-person worklist.
- Every downstream plan (222-02 through 222-18) will need its live SQL run orchestrator-side or by the operator, since `mcp__supabase-local__execute_sql` is not bound in executor sessions — flag this at the start of each plan rather than rediscovering it.
- 222-18's close-out reconciliation must check the 107-worklist coverage (unaffected by this plan's re-scope) AND separately verify 222-02's deletions/reviews and 222-04's gap-fill landed correctly, at (person, topic) granularity per the blank-register contract confirmed in this plan.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*
