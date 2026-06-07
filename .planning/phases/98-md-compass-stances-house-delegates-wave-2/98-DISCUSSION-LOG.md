# Phase 98: MD Compass Stances — House Delegates (Wave 2) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-07
**Phase:** 98-md-compass-stances-house-delegates-wave-2
**Areas discussed:** Batch plan count, Compass verification

---

## Batch Plan Count

| Option | Description | Selected |
|--------|-------------|----------|
| 7 plans (~20 each) | Closest to Phase 97's pace (~16 senators/plan). Each plan runs ~20 research agents + generates one migration. 7 migrations total (286–292). Easier to pause and resume mid-phase. | ✓ |
| 6 plans (~24 each) | Slightly fewer plans, slightly more delegates per batch. 6 migrations (286–291). Still manageable context per plan. | |
| 5 plans (~28 each) | Fewer plans overall. 5 migrations (286–290). Each plan is heavier — 28 sequential research runs in one context window. | |

**User's choice:** 7 plans (~20 each)
**Notes:** Recommended option selected. Matches Phase 97 pacing. Exact batch boundaries (by district range) are researcher's call.

---

## Compass Verification

| Option | Description | Selected |
|--------|-------------|----------|
| Embed in last batch plan | The final research batch plan (Plan 98-07) does stances + applies migration + runs compass smoke test (3 senators + 3 delegates). No extra plan file. Matches Phase 97 pattern. | ✓ |
| Dedicated verification plan | Add Plan 98-08 after all 7 research batches complete. That plan only runs the UI spot-check. Cleaner separation; easier to retry if the compass check fails without re-running research. | |

**User's choice:** Embed in last batch plan
**Notes:** Recommended option selected. MD-STANCES-04 closes at end of Plan 98-07 after migration 292 applied.

---

## Claude's Discretion

- Exact district-range batch boundaries (researcher queries DB to determine cutpoints aiming for ~20 delegates each)
- A/B subdistrict delegate grouping (keep within same batch as parent district)
- Primary source strategy per delegate (mgaleg, ballotpedia, ontheissues; fewer stances OK for low-profile delegates)

## Deferred Ideas

None — discussion stayed within phase scope.
