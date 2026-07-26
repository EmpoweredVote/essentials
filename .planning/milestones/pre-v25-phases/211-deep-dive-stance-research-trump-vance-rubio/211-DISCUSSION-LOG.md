# Phase 211: Deep-Dive Stance Research (Trump, Vance, Rubio) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-19
**Phase:** 211-deep-dive-stance-research-trump-vance-rubio
**Areas discussed:** Topic scope, Existing answers, Evidence hierarchy, Rubio framing

---

## Topic scope

| Option | Description | Selected |
|--------|-------------|----------|
| National only (~25) | Federal/national topics only; skip judicial-* and hyper-local (blank anyway) | |
| National + local (~36) | National + hyper-local; skip the 8 judicial-* | |
| All 44 | Every active topic including judicial-*; honest blanks where no evidence | ✓ |

**User's choice:** All 44
**Notes:** Research every active topic for each official; judicial-* and hyper-local expected mostly blank for federal figures — that's acceptable and honest.

---

## Existing answers

| Option | Description | Selected |
|--------|-------------|----------|
| Overwrite all (fresh pass) | Research 44 from scratch, replace existing values; 100% cited | ✓ |
| Fill gaps only | Keep existing 21/24, research only missing topics; leaves legacy uncited | |
| Overwrite only on conflict | Keep matching values, overwrite differing ones; matched values still uncited | |

**User's choice:** Overwrite all (fresh pass)

### Follow-up: unsourced legacy answers

| Option | Description | Selected |
|--------|-------------|----------|
| Delete it (true blank) | Remove legacy answer with no citable evidence; spoke goes blank | ✓ |
| Keep, flag for review | Leave value, log as legacy/uncited | |
| Re-research harder | Second deeper pass before deleting | |

**User's choice:** Delete it (true blank)
**Notes:** Claude to snapshot pre-existing values before overwrite (auditable) — captured as discretion, not asked.

---

## Evidence hierarchy

| Option | Description | Selected |
|--------|-------------|----------|
| Actions > statements | Official acts/votes highest, statements next, campaign rhetoric tiebreaker | ✓ |
| Statements = actions | Equal weight to statements and acts | |
| Most recent wins | Recency over evidence type | |

**User's choice:** Actions > statements

### Follow-up: recency

| Option | Description | Selected |
|--------|-------------|----------|
| Recent governs, full record cited | Latest authoritative action = assigned chair; older record cited as context | ✓ |
| Recent term only | Only current office/term (2025+) in scope | |
| Whole career, weight by strength | Entire record equal; strongest evidence wins regardless of date | |

**User's choice:** Recent governs, full record cited

---

## Rubio framing

| Option | Description | Selected |
|--------|-------------|----------|
| Senate record primary, SecState supplements | Anchor Senate record, layer in SecState where personal | |
| Current SecState role first | Lead with SecState actions, Senate backfills | ✓ |
| Full record, equal footing | Senate + primary + SecState as one pool | |

**User's choice:** Current SecState role first
**Notes:** Attribution guardrail added — flag SecState actions that execute the President's agenda vs. Rubio's own position; cite Senate record alongside where it speaks to the same chair.

## Claude's Discretion

- Per-topic batching within a single agent run (subject to one-agent-at-a-time rule).
- Source-count/corroboration threshold per stance (default: ≥1 authoritative source per assigned chair).
- Whether SC-4 render verification is its own plan/wave.
- Pre-pass snapshot of legacy answers for auditability.

## Deferred Ideas

- Broad school-board / judicial stance research (milestone-level deferred; RES-01 = Trump/Vance/Rubio only).
- Authoring the 8 Education-lens topics (Phase 209, deferred).
