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

## ⚠️ NOT A NEW DISCOVERY — merge with the existing EV-Accounts audit first

**Read `C:/EV-Accounts/.planning/todos/2026-07-24-party-prior-stance-contamination-audit.md` before
doing anything with this file.** That audit predates this one by a day, is more thorough, and already
has working tooling. This file was written on 2026-07-25 during Phase 222 without knowledge of it;
its "discovered during Phase 222" framing is wrong. Do not run a second sweep in parallel.

What the existing audit already establishes (measured, not estimated):
- **907 context rows across 293 politicians** are sourced *only* to a Ballotpedia **biography** URL
  (`ballotpedia.org/<Name>`), which carries no stance content in either direction. By state:
  (none) 137, OR 97, TX 23, VA 18, CA 11, MD 2, ME 2, MA 1, UT 1, AZ 1.
- Oregon legislators + federal OR reps (n=96): 668 context rows, **293 (44%)** bio-page-only,
  **zero quotes across the entire cohort**.
- Party-prior inference with verbatim samples ("consistent progressive voting record from Portland
  district"; "conservative Marion/Polk County district priorities").
- A confabulation proof: Emerson Levy's civil-rights reasoning cites a "voting record from Lake
  Oswego district" — Levy represents HD 53, Bend/Redmond/Sisters, ~130 miles away.
- **A defect class this file missed entirely: stances citing votes cast before the member was
  seated.** 7 of 8 bill-cited Oregon rows attribute a roll call from before the member took office.

Tooling already built, in `C:/EV-Accounts/backend/scripts/`:
`sweep-or-preseating.mjs`, `retire-or-preseating.mjs`, `check-source-supports.py`.

Work already completed: **Oregon pre-seating sweep retired 102 fabricated rows across 39
legislators** (commit `905a6514`), and a source-supports check run over Oregon found **153
actionable rows** with an adjudication queue at
`backend/.../or-bend-stateleg/adjudication-queue-OR.json` (commit `df8b0d44`).

**That Oregon sweep is also the answer to the ~102-row mystery recorded further down this file** —
`inform.politician_context` dropped 33,956 → 33,827 during Phase 222, and 102 of those rows were
retired by the Oregon sweep, not lost. Treat that item as resolved.

**What this file still adds** (verified 2026-07-25, not in the EV-Accounts audit):
1. **921 `politician_answers` rows have no `politician_context` row at all** — a chair displayed with
   zero reasoning and zero sources. Different signature from bio-page-only; needs its own pass.
2. **2,304 rows carry party language in reasoning attached to a live stance**, table-wide count.
3. The Collin County slice, now remediated by Phase 222 plan 222-02 (27 pairs deleted).
4. Two schema gaps: `politician_answers_value_half_step` permits `x.5`; nothing prevents an answer
   row without a context row.
5. **One Collin row matches the bio-page-only signature and is still live:** Dan Barrios
   (Richardson) `e8c863a7-d116-480e-a81f-47d26f45e264` / `healthcare`, sourced solely to
   `https://ballotpedia.org/Dan_Barrios`. Phase 222's A1 signature required NULL sources so it was
   missed; two of Barrios's other rows were deleted. **Not yet deleted — needs operator approval.**

## How this surfaced

Phase 222 planned to close plans 222-02 (Plano) and 222-04 (McKinney) as no-op because
both cities showed zero *un-stanced* officeholders. The operator rejected that and asked
for both to be double-checked, on the grounds that they were stanced early in the project
and might contain misses. They did. The Collin-scoped audit (`222-01-INTEGRITY-AUDIT.md`)
found 12 defective rows out of 220.

Widening the same signature checks to the **whole** `inform.politician_context` table shows
Collin is a small slice of a much larger problem.

## Live national numbers (production)

> **CORRECTED 2026-07-25 after the 222-02 apply.** The first pass at these numbers counted
> signature matches in `inform.politician_context` **without checking whether each row had a
> paired `inform.politician_answers` row.** That conflated two very different things: a context
> row WITH an answer row is a displayed stance (a real defect), while a context row WITHOUT an
> answer row is a "searched, found nothing" note with no chair attached — which is the CORRECT
> blank-spoke outcome this project wants, not a defect. The A1 count was overstated by ~190x as
> a result. Corrected figures below; always join to `politician_answers` before calling a
> context row a defect.

Total `inform.politician_context` rows: **33,827** · total `inform.politician_answers` rows: **34,196**

| Signature | Context rows | **With paired answer (REAL defect)** | No answer row (correct blank note) |
|---|---|---|---|
| A1 — reasoning admits "no record found", `sources` NULL | 382 | **2** | 380 |
| A2 — party named in reasoning | 2,306 | **2,304** | 2 |

**Revised severity ranking:**

1. **A2 — party language in displayed reasoning: 2,304 live rows.** This is the big one. The text
   renders to users (`src/pages/Citations.jsx:112`, StanceAccordion via `CompassCard.jsx:29`) and
   contradicts the antipartisan display rule ([[antipartisan_display]]). Some share is presumably
   incidental/descriptive ("voted with the Republican majority to…") rather than inferential, so
   2,304 is an upper bound on true violations — but every one is party text shown to a user.
   Spread across ~45 states; top by state (pre-correction sample): TX 697, unattributed 512,
   blank-state 351, CA 172, MD 168, OR 135, UT 101.
2. **921 `politician_answers` rows have NO `politician_context` row at all.** A chair displayed on
   a public profile with zero reasoning and zero sources. Found during the 222-02 post-apply
   verification. Larger than A1 and previously unmeasured — needs its own triage pass.
3. **A1 — only 2 rows remain nationally.** Was 7 before Phase 222; plan 222-02 deleted 5 of them
   (the Collin slice). Small, and cheap to finish off.

**Two schema gaps found while verifying:**
- `politician_answers_value_half_step` CHECK permits `x.5` values (`value*2 = round(value*2)`), so
  the whole-integer-1-to-5 rule is convention only. This is how the earlier fractional-stance
  corruption got in ([[corrupted_fractional_stances]]). Consider tightening to whole integers.
- Nothing prevents an answer row from existing without a context row (see item 2), and nothing
  prevents a context row with NULL `sources` from pairing with an answer row (A1). Both want a
  write-time guard or a CHECK/trigger.

**Unexplained, needs investigation:** `politician_context` measured 33,956 before the 222-02 apply
and 33,827 after. The apply deleted exactly 27 (both tables are `PRIMARY KEY (politician_id,
topic_id)`, so no duplicate-removal effect). That leaves ~102 rows unaccounted for. Collin scope
reconciles exactly (220 → 193 answers), so the drift is outside the applied change. Candidate
causes: concurrent writes on the production DB from another session, or a `compass_topics` row
deletion cascading via `topic_id … ON DELETE CASCADE` on both tables. No baseline exists to
confirm either — establish one before the 999.2 sweep so the sweep's own deltas are trustworthy.

## Why A2 is the headline

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

## Why A1 still matters despite being small

An A1 row is a stance on a public profile with no supporting evidence, where the stored
reasoning itself says no evidence was found — a direct violation of
[[stance_no_default_value]]. Four of the five Collin instances were `housing` and all were
dated "Researched 2026-05-11", suggesting one early pass filled `housing` for everyone
regardless of evidence. Only 2 such rows remain nationally, so this is now a quick cleanup
rather than a project.

## Action (revised priority order)

1. **Establish a baseline row count** for both tables and investigate the unexplained ~102-row
   `politician_context` drift before any bulk change, so the sweep's own deltas mean something.
2. **A2 — 2,304 party-in-reasoning rows with live stances.** Export the full list, then triage
   inferential vs. incidental. Inferential (party used to derive the chair) → delete the stance
   and log the blank. Incidental (party named while describing a real vote) → rewrite the
   reasoning to drop party language while keeping the cited action. Never strip text without
   re-reading the source. This is the bulk of the work.
3. **921 answers with no context row.** Decide per row: source it properly, or delete the chair.
   A displayed stance with no reasoning and no citation cannot be defended.
4. **A1 — 2 remaining rows.** Delete both sides, log the blanks. Trivial.
5. **Add write-time guards** so this cannot recur: reject an answer row whose paired context row
   has NULL `sources`; reject an answer row with no context row at all; flag party keywords in
   reasoning at write time; and tighten `politician_answers_value_half_step` to whole integers.
6. **Re-check `src/lib/coverage.js` `hasContext` chips** afterwards — deletions may drop some
   entries back to zero coverage.

Always join `politician_context` to `politician_answers` before classifying a row as a defect.
A context row with no answer row is a correct blank, not a problem — getting this wrong is what
inflated the first version of this document.

## Scope notes

- Not in Phase 222. Phase 222 remediates only the 12 Collin Class A rows (plan 222-02) and
  fills Plano/McKinney topic gaps (plan 222-04), both operator-approved on 2026-07-25.
- Every write here is production ([[supabase_local_is_remote]]) and outward-facing —
  deletions must go through a blocking operator apply checkpoint, never auto-applied.
- All SQL must run orchestrator-side; MCP tools are not bound in subagents
  ([[mcp_not_bound_in_subagents]]).
