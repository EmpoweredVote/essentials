# Phase 154: Burbank deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 154-burbank-deep-seed
**Areas discussed:** Form of government, Roster reconcile, Headshots scope (all locked with recommended defaults)

---

## Gray-area selection

| Option | Description | Selected |
|--------|-------------|----------|
| Form of government | At-large vs by-district; rotational vs directly-elected mayor; whether to create a Mayor office | ✓ |
| Roster reconcile | Dual-chamber merge + Zizette Mullins City-Clerk suspicion + which 5 are current | ✓ |
| Headshots scope | Verify-and-fix 3 existing + fill 2 gaps (Rizzotti, Takahashi) | ✓ |
| All locked — skip | Accept the recommended defaults and go straight to CONTEXT.md | ✓ |

**User's choice:** Selected all three areas AND "All locked — skip" — interpreted as: accept the recommended
default for each area, lock them in, and proceed to CONTEXT.md without a per-area Q&A loop.
**Notes:** This is the 13th city deep-seed (phases 142–153 establish a strong locked precedent); the operator
trusts the Inglewood/West-Covina/Downey pattern and the orchestrator's live-DB-grounded recommendations.

---

## Form of government

**Decision (D-02):** Defer to research, no guessed default. Recommended default = at-large + rotational mayor
(mayor is a title on a council seat, West Covina/Downey model), NOT a directly-elected LOCAL_EXEC Mayor. Research
MUST verify against burbankca.gov: (a) at-large vs by-district, (b) rotational vs directly-elected mayor.
**Rationale:** DB shows 5 At-Large rows and NO Mayor office; the Downey/El Monte lesson mandates verifying form of
government against the official site before committing.

## Roster reconcile

**Decision (D-01 + D-03):** Merge the two 'City Council' chambers into the bidirectional official_count=5 survivor
`73422d25`; the one-directional NULL-count chamber `6a72dbe8` is doomed. Repair Anthony + Mullins one-directional
links and move them to the survivor + survivor At-Large district `15458750`; drop the orphaned doomed At-Large
district. Research-verify all 5 members; **Zizette Mullins is prime suspect for being the City Clerk, not a
councilmember** — unlink-not-delete if confirmed non-member. official_count=5.
**Rationale:** Identical dual-chamber-merge mechanics to Inglewood (153) but with no person-dedup; survivor is
chosen by bidirectional-clean + official_count present.

## Headshots scope

**Decision (D-04):** Verify-and-fix the 3 existing images (Perez, Anthony, Mullins — correct person, 600×750, no
graphics, wrong-person guard); fill the 2 gaps (Rizzotti, Takahashi) from burbankca.gov (WAF status unknown —
check); honest gap if no acceptable portrait.
**Rationale:** Standard Wave-3 verify-and-fill pattern; WAF status must be checked (LA-area .gov sites frequently
WAF-403).

---

## Claude's Discretion

- Exact reconcile SQL ordering (follow 151/152/153 idempotent patterns), survivor-chamber move-then-delete
  mechanics, At-Large district consolidation mechanics, per-member stance chairs, and which existing headshots pass
  vs need re-crop.

## Deferred Ideas

- Burbank Unified School District (gov `d5ffbb65`) — separate government, out of scope.
- Burbank's own split-section check post-reconcile (expect 0 rows).
- Browse school-district-sliver display issue — separate browse-logic follow-up.
- Phase 157 (Wave-2 close-out) consumes Burbank's final per-city counts.
