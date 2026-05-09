# Phase 30: Legal Candidate Stance Research - Context

**Gathered:** 2026-05-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Research and insert judicial compass stances for 3 LA City Attorney candidates — Aida Ashouri, John McKinney, and Marissa Roy — across the 6 applicable topics (4 universal + 2 City Attorney/DA-specific). Stances are drawn exclusively from public record sources and inserted into `inform.politician_answers` with source citations. Judge-specific topics are out of scope for these candidates.

</domain>

<decisions>
## Implementation Decisions

### Source hierarchy

Tier 1 (priority order):
1. Candidate questionnaires — written responses to structured policy questions from bar associations, endorsing orgs, or newspapers; most specific and directly quotable
2. Voting record — for candidates who have held legislative office; a vote IS their position and is the most objective signal available

Tier 2 (secondary, used when Tier 1 is absent):
3. Campaign website policy pages — official but often vague; usable as supporting evidence
4. News interviews and debates — on-record quotes in journalism or recorded public forums; article URL or YouTube URL with timestamp both acceptable

Explicitly prohibited sources (never cite as basis for a value):
- Third-party advocacy scorecards (ACLU ratings, NAACP grades, etc.) — these reflect the grader's interpretation, not the candidate's stated position
- Social media (Twitter/X, Facebook) — volatile; easy to delete or misread context

### Evidence threshold

Minimum standard: **direct statement OR clear implication from a closely related position**. The agent does not need an explicit "I believe X" quote, but must be able to articulate why a candidate's stated position maps to the specific stance description.

For candidates with a legislative voting record (e.g., Ashouri as sitting LA City Council member): voting record is a first-class source and should be actively mined alongside questionnaires.

For judicial candidates specifically (judges): voting records do not apply — no public legislative votes to draw from.

**Key rule on value placement:** The 1–5 values are specific stance descriptions, not a political spectrum dial. Value 3 is not "moderate" — it is a defined policy position. The agent must read what values 1–5 actually say for the specific topic, then find the closest match to what the candidate stated.

**Conflict tiebreaker:** When sources conflict on the same topic:
1. Most recent source wins
2. If equally recent, most specific source wins (detailed questionnaire > vague campaign blurb)

**Inference flagging:** When a value is placed via implication (not a direct quote), note it in the evidence field: "inferred from [X]" with a link to the source. This preserves transparency for future researchers.

### Missing data policy

When no public record exists for a candidate on a specific topic:
- Insert a row with `null` value + note in the evidence/citation field: "researched 2026-05-XX — no public record found"
- This distinguishes "not yet researched" from "checked and found nothing" — prevents duplicate research effort

**UI behavior:** Topics with no placed stance value are hidden entirely from the voter-facing profile. The compass section only renders if the candidate has at least **3 placed stances**. Fewer than 3 → the entire compass section is hidden.

### Per-candidate research approach

**Candidates with a legislative voting record** (e.g., Ashouri — current LA City Council member):
- Voting record is a first-class source; agent actively mines it alongside questionnaires
- Check council votes on criminal justice, police oversight, and related topics as primary evidence

**Attorney candidates without a voting record** (McKinney, Roy):
- Fixed source checklist — check all four, then stop; no open-ended search
- Checklist:
  1. LA Times voter guide
  2. LACBA questionnaire / bar association materials
  3. League of Women Voters / Vote411
  4. Endorsing org questionnaires (LA Times editorial board responses, Knock LA, Abundant Housing LA)
- If none of the four sources covers a topic, result is "researched, not found" — no further searching

This fixed checklist is the **systemic standard for City Attorney/DA candidates** in all future phases.

### Claude's Discretion
- Exact wording of "researched, not found" evidence field entries
- Whether to group all four source checks in one pass or sequential
- How to handle paywalled articles (treat as inaccessible; equivalent to not found)

</decisions>

<specifics>
## Specific Ideas

- Ashouri's council voting record is the highest-value research target for this phase — her votes on LAPD budget, police oversight, homelessness, and criminal justice are directly on-topic
- The 1–5 scale is stance-definition matching, not liberal-conservative placement — this distinction must be explicit in the research agent prompt
- The fixed source checklist (4 sources) is intentionally bounded; it creates a repeatable, auditable research process for future legal candidate phases

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 30-legal-candidate-stance-research*
*Context gathered: 2026-05-09*
