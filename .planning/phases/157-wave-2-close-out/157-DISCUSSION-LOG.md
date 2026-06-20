# Phase 157: Wave 2 close-out - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 157-wave-2-close-out
**Areas discussed:** Purple-chip criteria, Audit pass bar, Split-section cleanup, Audit doc format

---

## Purple-chip criteria

| Option | Description | Selected |
|--------|-------------|----------|
| ≥1 stance = purple | List all 15 as browsable; hasContext:true only for cities with ≥1 seeded stance. Roster-only/0-stance city listed but plain. Honest, matches convention. | ✓ |
| Roster = purple | Any city with a seeded roster gets the chip even with 0 stances. Simpler but overpromises context. | |
| Threshold (e.g. ≥5) | Only chip cities above a minimum stance count. Stronger bar but risks hiding legitimately thin small cities. | |

**User's choice:** ≥1 stance = purple
**Notes:** Keeps the purple chip's "has compass context" promise honest; per-city stance count read from live DB at audit time, not assumed.

---

## Audit pass bar

| Option | Description | Selected |
|--------|-------------|----------|
| Structure hard / data soft | Hard: gov + chamber + correct roster for all 15. Headshot gaps + thin/blank stances = documented acceptable gaps. Missing structure/roster = blocker. | ✓ |
| Full Tier 1 required | Every city must have gov + chamber + roster + headshots + stances before close. Unrealistic given 403 walls + honest-blank policy. | |
| Roster-only | Only require gov + chamber + roster; don't verify headshots/stances. Weak — wouldn't surface coverage gaps. | |

**User's choice:** Structure hard / data soft
**Notes:** Matches prior-wave reality (100% headshot gaps acceptable; honest-blank stances acceptable). Acceptable gaps documented, not treated as failures.

---

## Split-section cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Defer + document | Keep out of scope. Record in audit known-issues + as deferred idea. No data changes in 157. | ✓ |
| Fold cleanup in | Fix all 5 cities' defects in close-out. Cleaner but scope creep. | |
| Create phase now | Add an explicit new ROADMAP.md phase for the cleanup. More formal than a deferred note. | |

**User's choice:** Defer + document
**Notes:** Defects are pre-existing (v7.0/v15.0), already flagged OUT-OF-SCOPE in Phase 143. Candidate for its own future cleanup phase.

---

## Audit doc format

| Option | Description | Selected |
|--------|-------------|----------|
| Root file + per-city table | .planning/v17.0-MILESTONE-AUDIT.md (matches recent v16/v11/v10) with per-city DB-verified table + verdicts; then MILESTONES.md entry + STATE/PROJECT flip. | ✓ |
| milestones/ subdir | Same content in .planning/milestones/ (older convention). Diverges from 3 most recent milestones. | |
| MILESTONES.md only | Put the table directly in MILESTONES.md; no standalone file. Buries DB-verified detail, breaks pattern. | |

**User's choice:** Root file + per-city table
**Notes:** Follows the location of the 3 most recent milestone audits (v16.0/v11.0/v10.0).

---

## Claude's Discretion

- Exact wording of GOTCHA entries and "Notable patterns" cells in LOCATION-ONBOARDING.md — synthesized from per-city artifacts.
- Audit table column layout beyond the required DB-verified dimensions.

## Deferred Ideas

- Split-section defect cleanup across 5 cities (Whittier/Compton/Carson/South El Monte/South Pasadena) — deferred to a future dedicated cleanup phase; documented in the v17.0 audit known-issues section.
