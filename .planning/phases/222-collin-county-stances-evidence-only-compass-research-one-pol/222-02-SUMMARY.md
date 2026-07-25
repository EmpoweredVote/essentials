---
phase: 222-collin-county-stances-evidence-only-compass-research-one-pol
plan: 02
subsystem: database
tags: [postgres, supabase, data-integrity, compass-stances, migration]

# Dependency graph
requires:
  - phase: 222-01
    provides: "222-01-INTEGRITY-AUDIT.md (Class A / Class B2 defect tables) and the live migration-number/worklist scaffolding this plan executes against"
provides:
  - "27 evidence-integrity deletions applied to production (12 Class A + 15 Class B2), removing chairs whose stored reasoning did not clear the D-04 evidence bar"
  - "AUDIT-ONLY migration 1416_222_collin_stance_integrity_remediation.sql (revised in-place to 27 pairs) committed and applied"
  - "222-CONFIRMED-BLANK.md 'Phase 222 integrity remediation' section, 27 (person, topic) entries, Count: 27"
  - "Three out-of-scope findings routed to backlog Phase 999.2 (corrected national A1 figure, 921 contextless answer rows, ~102-row politician_context drift)"
affects: [222-03, 222-04, 222-18, 999.2]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AUDIT-ONLY remediation migration (delete-only, single BEGIN/COMMIT, not registered in schema_migrations) as the correction mechanism for reasoning/sourcing defects, as distinct from value-corruption fixes"
    - "Per-row re-read as a required override step when the executing agent lacks DB access and must apply an uncertainty tie-breaker at authoring time"

key-files:
  created:
    - "C:/EV-Accounts/backend/migrations/1416_222_collin_stance_integrity_remediation.sql"
  modified:
    - ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md"
    - ".planning/todos/pending/national-stance-evidence-integrity-audit.md"
    - ".planning/ROADMAP.md"

key-decisions:
  - "Executor (no DB access) correctly applied the plan's uncertainty tie-breaker to all 19 Class B2 rows (mark DELETE, flag for DB-access re-read) rather than guess at stored reasoning it could not read"
  - "Orchestrator re-read all 19 Class B2 rows against live reasoning/sources; 4 rows cleared the D-04 bar on a specific person's own vote, quote, or dated forum statement and were kept in production"
  - "2 of the 15 confirmed Class B2 deletions were worse than adjacency on re-read and re-labelled Class-A-grade (self-admitted 'no statement found' plus a defaulted chair) rather than left as ordinary B2 entries"
  - "Migration revised in-place from 31 to 27 target pairs before apply; both EV-Accounts and essentials commits for the revision are separate from the original authoring commits, preserving the audit trail of the correction itself"
  - "Three findings surfaced only by post-apply verification (overstated national A1 count, 921 contextless answer rows, unexplained ~102-row politician_context drift) were routed to backlog Phase 999.2 rather than folded into this plan's scope"

requirements-completed: []  # COLLIN-STANCE-02 advanced but NOT complete — 222-04 through 222-17 still write evidence-backed stances under this requirement

coverage:
  - id: D1
    description: "27 evidence-integrity-defective (politician_id, topic_id) pairs deleted from production (both politician_answers and politician_context, paired) via AUDIT-ONLY migration 1416"
    requirement: "COLLIN-STANCE-02"
    verification:
      - kind: manual_procedural
        ref: "Post-apply verification queries run by orchestrator via mcp__supabase-local__execute_sql: 0 target pairs remaining in politician_answers, 0 in politician_context, 4 kept rows still present, Collin-scope answer count 220 -> 193 (exactly -27), 0 orphaned answers, 0 Class A rows remaining in Collin scope"
        status: pass
    human_judgment: true
    rationale: "This deletes real, currently-visible public data about named officeholders; the operator's blocking apply checkpoint and the post-apply signature-query re-run are the verification, not an automated test suite"
  - id: D2
    description: "222-CONFIRMED-BLANK.md 'Phase 222 integrity remediation' section logs all 27 deletions at (person, topic) granularity, one-for-one with the applied migration"
    verification:
      - kind: manual_procedural
        ref: ".planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md, 'Phase 222 integrity remediation (2026-07-25)' section, Count: 27"
        status: pass
    human_judgment: false

# Metrics
duration: N/A (multi-session; Task 3 checkpoint spanned an operator approval cycle)
completed: 2026-07-25
status: complete
---

# Phase 222 Plan 02: Collin County Stance-Integrity Remediation Summary

**Deleted 27 evidence-integrity-defective stance pairs (12 flat D-04 violations + 15 weak-adjacency rows) from the pre-existing Collin cohort, applied live to production, keeping 4 rows that a per-row re-read confirmed do cite the specific person's own vote, quote, or dated statement.**

A blank spoke on all 27 profiles is the intended, successful outcome of this plan — not data loss. Every deleted chair was a public claim the stored reasoning could not actually support; removing it and logging it in the blank register is exactly what D-04/D-08 require.

## Performance

- **Tasks:** 3 (Task 1 decide, Task 2 author+commit, Task 3 blocking operator apply — all satisfied)
- **Rows deleted:** 27 of the original 31 candidate pairs (12 Class A + 15 of 19 Class B2)
- **Rows kept:** 4 (Class B2 rows that cleared the D-04 bar on re-read)
- **People affected (deletions):** 19 distinct officeholders across Allen, Celina, Frisco, McKinney, Plano, Richardson

## Accomplishments

- 12 Class A rows (A1 no-evidence-found-yet-chaired, A2 party-in-reasoning, A3 identity-inference, A4 city-wide-policy-defaulted) deleted — these flatly violated D-04 with no ambiguity.
- 15 of 19 Class B2 weak-adjacency rows deleted after a genuine per-row read of stored reasoning and sources; 4 kept because they cite the specific person's own recorded vote, quote, or dated forum statement.
- AUDIT-ONLY migration `1416_222_collin_stance_integrity_remediation.sql` authored, revised, committed (not pushed), and applied to production by the operator at the Task 3 blocking checkpoint.
- `222-CONFIRMED-BLANK.md` "Phase 222 integrity remediation" section logs all 27 deletions at (person, topic) granularity with explicit "searched, evidence found insufficient, chair removed" framing — not "never searched."
- Post-apply verification confirmed the migration matched its own audit trail exactly, with zero collateral changes outside the 27 targeted pairs.

## Task Commits

1. **Task 1: Confirm the Class A defect set and decide the 19 Class B2 rows** — no file writes (decision table carried into Task 2); executor applied the plan's uncertainty tie-breaker and marked all 19 Class B2 rows DELETE, explicitly flagging the need for a DB-access re-read (see Deviation 1 below).
2. **Task 2: Author the remediation migration, append the blank register, and commit** —
   - EV-Accounts: `54364e12` (initial migration authoring, 31 pairs) — repo `C:/EV-Accounts`, not pushed.
   - essentials: `18b7204f` (register append, 31 deletions) — `docs(222): log 31 stance-integrity deletions to blank register`.
   - Revision after Deviation 1 re-read:
     - EV-Accounts: `89d576f7` — `fix(222-02): per-row re-read of Class B2 — keep 4, delete 27 not 31` — not pushed.
     - essentials: `0d3ccc3b` — `docs(222-02): correct blank register to 27 deletions after per-row Class B2 re-read`.
3. **Task 3: [BLOCKING] Operator applies the deletion migration** — operator approved 2026-07-25; orchestrator applied via `mcp__supabase-local__execute_sql`; migration correctly NOT registered in `schema_migrations` (audit-only by design).

**This plan's metadata commit:** recorded separately after this SUMMARY (see Files Created/Modified).

_Note: all EV-Accounts commits above are local-only per plan constraints — no push was executed against the EV-Accounts remote._

## Files Created/Modified

- `C:/EV-Accounts/backend/migrations/1416_222_collin_stance_integrity_remediation.sql` — AUDIT-ONLY delete-only migration, single BEGIN/COMMIT, header comment lists every deleted row's politician_id/topic_key/bucket/rationale; revised in place from 31 to 27 target pairs before apply.
- `.planning/phases/222-collin-county-stances-evidence-only-compass-research-one-pol/222-CONFIRMED-BLANK.md` — "Phase 222 integrity remediation (2026-07-25)" section appended, then corrected; `Count: 27` at the top of the register.
- `.planning/todos/pending/national-stance-evidence-integrity-audit.md` — corrected post-apply (see Deviation 2, finding 1); commit `2745f7a9`.
- `.planning/ROADMAP.md` — Phase 999.2 backlog entry corrected alongside the todo file, same commit `2745f7a9`.

## Post-Apply Verification (production, orchestrator-run)

| Check | Result |
|---|---|
| 27 target pairs remaining in `politician_answers` | 0 |
| 27 target pairs remaining in `politician_context` | 0 |
| 4 kept rows still present | 4 |
| Collin-scope answer rows | 220 → 193 (exactly −27) |
| Orphaned answers created in Collin scope | 0 |
| Class A rows with a live chair remaining in Collin scope | 0 |

Migration was NOT registered in `schema_migrations` (audit-only, as designed).

## Decisions Made

- **Task 1 executor decision (correct, and it caught a real problem):** with no DB access and only class-level characterization of the 19 Class B2 rows in `222-01-INTEGRITY-AUDIT.md` (no per-row reasoning excerpts), the executor did not guess. It applied the plan's stated uncertainty tie-breaker — "when genuinely uncertain whether a row clears the bar, delete it" — marked all 19 DELETE, and explicitly flagged that a reader with DB access should re-decide per-row before the migration is finalized.
- **Orchestrator per-row re-read (Deviation 1):** re-read all 19 Class B2 rows against live `reasoning`/`sources` text. Outcome: 4 of 19 clear the D-04 bar and were removed from the migration (kept in production); 15 confirmed DELETE; 2 of those 15 proved worse than adjacency on inspection and were re-labelled Class-A-grade. Migration revised from 31 pairs to 27.
- Migration remains AUDIT-ONLY (not registered in `schema_migrations`) — consistent with every other Phase 222 migration and with the "correction, not schema change" nature of a delete-only reasoning-integrity fix.

## Deviations from Plan

### Deviation 1 — Orchestrator re-read all 19 Class B2 rows against live reasoning/sources (per-row correction of Task 1's flagged uncertainty)

- **Found during:** Between Task 2 (authoring) and Task 3 (apply) — the executor's Task 1 flag was acted on before the operator's apply checkpoint.
- **Issue:** The executor had no DB access and could not read the 19 Class B2 rows' stored reasoning; `222-01-INTEGRITY-AUDIT.md` carried only class-level characterization for B2 (people/topics list), not per-row excerpts. All 19 were marked DELETE per the plan's uncertainty tie-breaker, with an explicit flag that a DB-access re-read should happen before final apply.
- **Outcome:** 4 of 19 rows cleared the D-04 bar and were removed from the migration (kept live in production):
  - Michael Schaeffer (`c7a0ecf6-b416-474b-9647-a25e404f4bc4`, Allen) / economic-development — his own dated recorded vote approving the Kalahari Resort ($950M) incentive deal, Feb 2025.
  - Michael Jones (`09dbafc2-9252-40e4-9a1c-afda5b069f2e`, McKinney) / economic-development — verbatim first-person commitment quote about attracting higher-paying employers.
  - Rick Franklin (`6ee726c1-79af-4fef-abb8-fa7f4208ae14`, McKinney) / residential-zoning — his own zoning votes plus his own quote calling an 11-acre development one of the "worst ones" for density.
  - Arefin Shamsul (`9f93ae55-9228-478d-84a9-971cf4686649`, Richardson) / residential-zoning — dated April 2025 LWV Forum statement endorsing "missing middle housing."
  - 15 of the 19 were confirmed DELETE on re-read.
  - 2 of those 15 proved worse than ordinary adjacency and were re-labelled Class-A-grade (still deleted, not kept):
    - Amy Gnadt (Allen) / housing — reasoning calls the chair "the default moderate-conservative suburban position" after self-admitting no statements were found.
    - Dan Barrios (Richardson) / homelessness — chair derived from "his progressive Democratic lean" while reasoning admits "No direct policy statement on public camping found."
- **Files modified:** `C:/EV-Accounts/backend/migrations/1416_222_collin_stance_integrity_remediation.sql` (revised in place); `222-CONFIRMED-BLANK.md` (corrected).
- **Commits:** EV-Accounts `89d576f7`; essentials `0d3ccc3b`.
- **Assessment:** This is the correct outcome of the plan's own design — Task 1's tie-breaker was meant to be conservative-by-default when the executor could not read the underlying data, precisely so a DB-capable reader could safely tighten the scope afterward without risk of the reverse (a defective row slipping through). No data was lost by the initial over-inclusive marking; the review caught and corrected it before anything was applied to production.

### Deviation 2 — Post-apply verification surfaced three findings beyond this plan's scope, routed to backlog Phase 999.2

These are recorded as findings routed to backlog, not as gaps in this plan — none required or permitted a change to this plan's own Collin-scoped write set.

1. **The earlier national A1 figure was overstated.** Counting A1-signature rows in `politician_context` without joining to `politician_answers` conflated displayed stances (which carry a chair) with "searched, found nothing" notes (which carry no chair and are not defects). Corrected: 382 A1-signature context rows nationally, of which only **2** have a paired answer row (real defects); the other 380 are correct blank notes with no associated stance. The Phase 999.2 backlog entry and `.planning/todos/pending/national-stance-evidence-integrity-audit.md` were corrected to reflect this, and pushed (`2745f7a9`).
2. **921 `politician_answers` rows nationally have no `politician_context` row at all** — a chair is displayed with zero reasoning and zero sources. This was previously unmeasured and is now the largest single item logged in the 999.2 backlog entry.
3. **Unexplained ~102-row drift in `politician_context`.** The table held 33,956 rows before the apply and 33,827 rows after, against an expected delta of exactly −27. Both `politician_answers` and `politician_context` are `PRIMARY KEY (politician_id, topic_id)`, so this is not duplicate-row collapse, and the Collin-scope reconciliation (220 → 193, exactly −27) confirms the drift is outside the applied change. Candidates noted in the 999.2 entry: concurrent production writes during the apply window, or a `compass_topics` deletion cascading via a `topic_id ... ON DELETE CASCADE` foreign key. Recommendation logged: establish a row-count baseline immediately before any future national-scope sweep so this class of drift is caught at the time it happens rather than discovered after the fact.

Also noted (not actioned, informational only): the `politician_answers_value_half_step` CHECK constraint permits `x.5` values — the "whole integer only" rule from `222-01-INTEGRITY-AUDIT.md`'s value-integrity finding is a convention this phase's data happens to follow, not a schema-enforced invariant.

---

**Total deviations:** 2 (1 correction of an explicitly-flagged uncertainty resolution; 1 set of three out-of-scope findings routed to backlog, not acted on).
**Impact on plan:** Deviation 1 tightened the plan's own write scope in the direction the plan's design intended (fewer, more defensible deletions) and was resolved before any production write occurred. Deviation 2 produced no change to this plan's scope or writes — all three findings are backlog-only.

## Issues Encountered

None beyond the two deviations above, both of which were resolved before or as part of this plan's own completion.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Collin County's pre-existing already-stanced cohort (57 people, 220 rows) is now evidence-clean: 0 Class A rows remain, and every kept Class B2 row cites a specific person's own vote, quote, or dated statement.
- `COLLIN-STANCE-02` is **advanced but not complete** — this plan repaired the pre-existing cohort's evidence integrity; it did not write any new stances. 222-03 through 222-17 (the 107-name un-stanced worklist, all 24 in-scope governments) still carry the requirement to completion.
- Blank register (`222-CONFIRMED-BLANK.md`) is correctly seeded with 27 (person, topic) integrity-remediation blanks before 222-03 begins appending its own per-government sections.
- No blocker for 222-03 (Frisco) — this plan's writes and the blank register are self-contained and do not depend on anything 222-03 needs to produce.

---
*Phase: 222-collin-county-stances-evidence-only-compass-research-one-pol*
*Completed: 2026-07-25*
