# Phase 106: VA Compass Stances - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-09
**Phase:** 106-va-compass-stances
**Areas discussed:** Topic scope by tier, Alexandria depth strategy, Migration file organization

---

## Topic Scope by Tier

| Option | Description | Selected |
|--------|-------------|----------|
| All topics, evidence-only | Research all ~44 topics for every official regardless of tier — skip only topics with zero evidence | ✓ |
| Federal+state only, skip city-level | Exclude 7 explicitly local topics (city-sanitation, residential-zoning, local-immigration, rent-regulation, jail-capacity, transportation-priorities, data-centers) for exec/senator tiers | |

**User's choice:** All 44 topics, evidence-only for all officials
**Notes:** User specified "using the chair philosophy, and not guessing (it's not highly agree/agree/neutral/disagree/highly disagree)." Clarified the 1–5 scale is a compass position scale, not a Likert scale. User also noted: "many that are local are relevant to state/federal and vice versa" — reinforced full-pass approach.

---

## Alexandria Depth Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Cap at 15 min per person, then move on | If no substantive stances in ~15 min, declare no public record and skip | |
| Full research pass for every official | Same depth as Spanberger/Warner — all 44 topics per person | |
| Council only — skip ACPS board | Research all 6 council members, skip all 9 ACPS board | |

**User's choice:** 5-minute sliding cap (not one of the preset options — custom rule)
**Notes:** "For local races, we could cap it at 5 minutes per person, but if an answer comes in during the last 3 minutes, they will have 3 minutes more at a minimum." This creates a sliding window: 5-minute base cap, +3 min extension triggered by any finding in the last 3 minutes.

---

## Migration File Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Per-individual SQL files | One migration per politician — aligns with sequential research pattern | ✓ |
| Per-tier files | 3 files (exec, senators, Alexandria) — cleaner but can't apply until full tier is researched | |

**User's choice:** Per-individual SQL files
**Notes:** Matches the sequential one-at-a-time research pattern. Starting migration number: 326 (325 was last VA elections migration from Phase 105).

---

## Claude's Discretion

None — all areas had clear user direction.

## Deferred Ideas

None — discussion stayed within phase scope.
