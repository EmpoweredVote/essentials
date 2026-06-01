# Phase 82: OR State Legislature Compass Stances - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-31
**Phase:** 82-or-state-legislature-compass-stances
**Areas discussed:** Source strategy, Sub-batch structure, Urban/rural coverage calibration

---

## Source Strategy

### Primary source

| Option | Description | Selected |
|--------|-------------|----------|
| Vote history first | OregonLegislature.gov bill/vote history as primary — strongest verifiable evidence, best for citation quality | ✓ |
| Voter's Pamphlet first | Oregon Voter's Pamphlet (sos.oregon.gov) as primary — rich stated positions, unique to OR | |
| Both co-equal | Vote history + Voter's Pamphlet checked simultaneously — more thorough, more complex instructions | |

**User's choice:** Vote history first (Recommended)

### Secondary sources

| Option | Description | Selected |
|--------|-------------|----------|
| Voter's Pamphlet + Ballotpedia | Oregon Voter's Pamphlet for stated positions, Ballotpedia for structured summaries | ✓ |
| Ballotpedia + OPB/Oregonian news | Ballotpedia first, then Oregon news archives for floor statements and quotes | |
| Researcher's discretion | Leave secondary selection entirely to the research agent | |

**User's choice:** Voter's Pamphlet + Ballotpedia (Recommended)

### Tertiary / fallback sources

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, tertiary — if primaries come up empty | Campaign websites + OPB/Oregonian as fallback; only check if primary+secondary yield nothing | ✓ |
| Yes, check all sources for every legislator | Always check campaign sites and news regardless of primary yield | |
| No — stop at Ballotpedia if empty | Document as not-found rather than dig into campaign sites | |

**User's choice:** Tertiary — check only if primaries empty (Recommended)

---

## Sub-Batch Structure

### Group size and commit cadence

| Option | Description | Selected |
|--------|-------------|----------|
| Sub-batch ~10 per group, commit between groups | Groups of ~10 within each plan; commit CSV/script artifacts after each group | ✓ |
| One full sequential run per plan | All 30 senators or 60 house reps in one unbroken run; no intermediate commits | |
| Split into more plans (by district cluster) | Break into 3 plans of 10 senators each; 6 plans of 10 house reps each | |

**User's choice:** Sub-batch ~10 per group, commit between groups (Recommended)

### Per-person flow within a sub-batch

| Option | Description | Selected |
|--------|-------------|----------|
| CSV rows added + apply script run for that person | Per-person: research → CSV → apply script → move to next; DB updated per person | ✓ |
| CSV rows only per person, bulk apply at end of group | CSV for all 10 first, then one bulk apply run | |
| You decide | Leave to planner based on Phase 70/80 precedent | |

**User's choice:** CSV rows added + apply script run per person (Recommended)

### Migration timing

| Option | Description | Selected |
|--------|-------------|----------|
| At the very end of all sub-batches | One consolidated migration (242/243) after all politicians in the plan are done | ✓ |
| At the end of each sub-batch of ~10 | One migration per group (242a, 242b, 242c) | |
| You decide | Leave migration timing to the planner | |

**User's choice:** Single migration at end of all sub-batches (Recommended)

---

## Urban/Rural Coverage Calibration

| Option | Description | Selected |
|--------|-------------|----------|
| Uniform threshold + flag expected asymmetry | Same acceptance standard for all 90; research brief notes Eastern OR members expected to yield fewer stances; don't spend extra effort on low-yield searches | ✓ |
| Uniform threshold, no special note | Treat all 90 identically without mentioning east/west divide | |
| Two-tier effort: higher for urban, faster accept for rural | Portland-metro gets full tier checks; Eastern OR stops at secondary if primary sparse | |

**User's choice:** Uniform threshold + flag expected asymmetry (Recommended)

---

## Claude's Discretion

- Plan subdivision specifics (exact groupings of SD-01 through SD-30 into ~10-senator batches) — left to the planner
- Research source mechanics for OregonLegislature.gov bill/vote searches — left to the researcher
- Exact format of not-found documentation per legislator — left to the planner following Phase 80/70 precedent

## Deferred Ideas

None — discussion stayed within phase scope.
