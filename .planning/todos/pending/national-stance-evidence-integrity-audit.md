---
title: National stance evidence-integrity audit (fabricated stances + party text in displayed reasoning)
type: bug
priority: high
created: 2026-07-25
source: phase-222 (222-01 integrity audit, widened at operator request)
domain: data (inform.politician_answers / inform.politician_context) — production, all states
resolves_phase: 999.2
---

# National stance evidence-integrity audit

## How this surfaced

Phase 222 planned to close plans 222-02 (Plano) and 222-04 (McKinney) as no-op because
both cities showed zero *un-stanced* officeholders. The operator rejected that and asked
for both to be double-checked, on the grounds that they were stanced early in the project
and might contain misses. They did. The Collin-scoped audit (`222-01-INTEGRITY-AUDIT.md`)
found 12 defective rows out of 220.

Widening the same signature checks to the **whole** `inform.politician_context` table shows
Collin is a small slice of a much larger problem.

## Live national numbers (production, 2026-07-25)

Total `inform.politician_context` rows: **33,956**

| Signature | Rows | People | Meaning |
|---|---|---|---|
| **A1 — fabricated** | **387** | **89** | `sources` is NULL **and** reasoning explicitly admits "no record found" / "no public record" — a chair value was written where the researcher documented finding no evidence |
| **A2 — party in displayed text** | **2,348** | ~700+ | Reasoning names a party (Democrat / Republican / GOP / Libertarian) |
| A4 — no-statement default | 17 | ~15 | Reasoning says "has made no public statement" yet a chair was written |
| (context) rows with no sources at all | 457 | — | superset of A1 |

**A1 by state:** TX 314 rows / 71 people · IN 37 / 8 · unattributed 36 / 10.
The TX concentration is notable — the 12 Collin rows are a subset of TX's 314, so other
TX cities and older TX seeding carry the rest.

**A2 by state (top):** TX 697 · unattributed 512 · blank-state 351 · CA 172 · MD 168 ·
OR 135 · UT 101 · ME 47 · VA 39 · IN 22 · AZ 12 — present in ~45 states.

Roughly **8%** of all context rows carry at least one of these signatures.

## Why A2 matters more than it looks

`politician_context.reasoning` is **user-visible**:
- `src/pages/Citations.jsx:112-118` renders `topic.reasoning` directly.
- `src/components/CompassCard.jsx:29` — the StanceAccordion shows "topic stance labels,
  reasoning, and sources".

So 2,348 rows are putting party language on screen, which contradicts the antipartisan
display rule ([[antipartisan_display]] — party never displays on profiles). Some share of
those mentions is presumably incidental and descriptive ("voted with the Republican
majority to…") rather than inferential, so the count is an upper bound on the violation,
not a confirmed violation count. It still needs triage: every one of them is party text
rendered to a user.

## Why A1 is the most serious

A1 rows are stances that exist on public profiles with no supporting evidence, where the
stored reasoning itself says no evidence was found. This directly violates
[[stance_no_default_value]] (no evidence = blank spoke, never a defaulted stance). Four of
the five Collin instances were the `housing` topic and all were dated "Researched
2026-05-11", suggesting one early pass filled `housing` for everyone regardless of
evidence. Whether that pattern holds across the other 382 rows is unverified.

## Action

1. Re-run the three signature queries table-wide and export the full row list
   (`politician_id`, `topic_id`, state, value, reasoning) before changing anything.
2. **A1 (387 rows):** delete both the `politician_answers` and `politician_context` rows —
   blank spoke is the correct terminal state. Log every deletion in a blank register at
   (person, topic) granularity, mirroring the Phase 221/222 pattern.
3. **A2 (2,348 rows):** triage inferential vs. incidental. Inferential → delete the stance.
   Incidental → rewrite the reasoning to remove party language while keeping the cited
   action/vote. Do not silently strip text without re-reading the source.
4. **A4 (17 rows):** delete — same rationale as A1.
5. Add a DB-level or CI guard so a future pass cannot write an answer row whose paired
   context row has NULL `sources`, and flag party keywords in reasoning at write time.
6. Re-check `src/lib/coverage.js` `hasContext` chips afterwards — deletions may drop some
   entries back to zero coverage.

## Scope notes

- Not in Phase 222. Phase 222 remediates only the 12 Collin Class A rows (plan 222-02) and
  fills Plano/McKinney topic gaps (plan 222-04), both operator-approved on 2026-07-25.
- Every write here is production ([[supabase_local_is_remote]]) and outward-facing —
  deletions must go through a blocking operator apply checkpoint, never auto-applied.
- All SQL must run orchestrator-side; MCP tools are not bound in subagents
  ([[mcp_not_bound_in_subagents]]).
