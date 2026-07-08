---
status: passed
phase: 168-nv-2026-candidate-population-statewide-us-house
requirements: [NV-CAND-01]
verified: 2026-06-29
method: human-verified (live /elections) + DB-confirmed
---

# Phase 168 Verification — NV 2026 Candidate Population (Statewide & US House)

**Goal:** NV users on `/elections` see the actual Nov-3-2026 general-election candidates for the 6 statewide constitutional offices + 4 US House districts (Governor no longer blank), curated from the decided June 9 primary field, with headshots for challengers.

**Result: PASSED.**

## Success criteria

1. **race_candidates seeded for all 10 races, bound to Phase 167 race_ids + politician records where they exist** — ✅ Migration 1114 applied; 21 rows across all 10 races (6 statewide execs + 4 US House). Cross-office links resolved (Aaron Ford AG→Governor, Nicole Cannizzaro Senator→AG). DB-confirmed: each statewide race has 2 candidates; US House D1/D3/D4 have 2, D2 has 3.
2. **General field only, no primary losers / dupes, evidence-cited** — ✅ 1072-analog single-step seed, confirmed Nov-3 nominees + 1 certified minor-party (Lynn Chapman IAP, NV-02); uncertified independents held back per D-04; party stored nowhere (antipartisan); each row carries a citation `source`.
3. **Live `/elections` shows candidates (Governor not blank)** — ✅ **Human-verified by user 2026-06-29** ("This works") with a Las Vegas NV address; Governor of Nevada shows Lombardo + Ford.
4. **Challenger headshots fetched (honest-skip where none)** — ✅ 10 imaged (9 fetched 600×750 from Ballotpedia CC-BY-SA + Sandra Jauregui linked to existing record), 2 honest-skips (Adriana Guzman Fralick, Lynn Chapman). DB-confirmed: 19/21 candidates carry a photo; the 2 without are exactly the recorded honest-skips.

## Decision coverage
D-01..D-06 all satisfied (verified by gsd-plan-checker pre-execution and by executor SUMMARYs). Idempotent migration (re-run inserts 0). No `schema_migrations` ledger row. Next migration counter = 1115.

## Notes / carry-forward
- A separate **pre-existing** issue surfaced during the live check: CCSD Board of Trustees sort alphabetically by name instead of by district letter A–G. This is a **deploy gap, not a Phase 168 defect** — the fix already exists in committed code (`6c85a66`) but is unpushed/undeployed (essentials `main` is 56 commits ahead of origin). Resolved by deploying the essentials frontend.
- Out of scope (deferred): legislative candidate population (11 Senate + 42 Assembly), candidate compass stances.
