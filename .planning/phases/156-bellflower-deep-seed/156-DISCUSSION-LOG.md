# Phase 156: Bellflower deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-22
**Phase:** 156-bellflower-deep-seed
**Areas discussed:** Form of government, Roster + missing 5th, Structure / link repair, Headshots + stances

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Form of government | Dunton's separate LOCAL_EXEC Mayor: directly-elected vs rotational mis-seed; at-large vs by-district CVRA check; research-verify, no guessed default | ✓ |
| Roster + missing 5th | Only 4 of normal 5 seated → research-verify roster, seat missing 5th (-7010xx), unlink-not-delete departed | ✓ |
| Structure / link repair | Single chamber (no merge); geo_id 0604982 backfill; repair 4 one-directional back-pointers; normalize titles | ✓ |
| Headshots + stances | Verify-and-fix 4 existing images + fill 5th; evidence-only greenfield stances | ✓ |

**User's choice:** All four areas selected (multiSelect).
**Notes:** Orchestrator ran a live DB pre-check before presenting areas (gov + single chamber + 4 one-directional offices confirmed pre-existing).

---

## Lock decision

| Option | Description | Selected |
|--------|-------------|----------|
| Lock all (recommended) | Accept recommended defaults for all 4 areas — Norwalk-class minus the dual-chamber merge | ✓ |
| Drill into form-of-gov | Discuss Dunton Mayor-office resolution / by-district / directly-elected edge cases further | |
| Drill into roster | Discuss missing-5th handling, ext_id scheme, Nov-2024 turnover edge cases | |

**User's choice:** Lock all (recommended).
**Notes:** Form of government is the only genuine uncertainty and is research-deferred by design (no guessed default; hypothesis = general-law rotational mayor → convert Dunton's separate Mayor office to a council seat with mayor-as-title, per Norwalk/Downey). Everything else follows the locked 142–155 pattern with no real variance.

---

## Claude's Discretion

- Exact reconcile SQL ordering (follow 151–155 idempotent patterns)
- Back-pointer-repair mechanics for the 4 one-directional links
- Mayor-office conversion mechanics (if research confirms rotational)
- Per-member stance chairs; which existing headshots pass vs need re-crop

## Deferred Ideas

- Bellflower Unified School District (gov `f85ca154`) — separate government, out of scope
- Bellflower split-section check post-reconcile (expect 0 rows — single chamber/single At-Large district)
- Browse school-district-sliver display issue — separate browse-logic follow-up
- Phase 157 (Wave-2 close-out) consumes Bellflower's final per-city counts
