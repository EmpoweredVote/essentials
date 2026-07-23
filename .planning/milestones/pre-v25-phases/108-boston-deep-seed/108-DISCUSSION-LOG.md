# Phase 108: Boston Deep Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-10
**Phase:** 108-Boston Deep Seed
**Areas discussed:** School Committee model, Plan breakdown, Election methods

---

## School Committee Model

| Option | Description | Selected |
|--------|-------------|----------|
| All at-large (1 SCHOOL district) | All 13 members represent whole city. Single SCHOOL district row, like ACPS Alexandria. Simplest path. | |
| 7 districts + 6 at-large (hybrid) | 7 sub-district members + 6 at-large. Needs 7 sub-district geofences. More complex. | |
| Researcher should figure it out | Let phase researcher look up 2024 ballot measure structure and find correct TIGER topology. | ✓ |

**User's choice:** Researcher should figure it out
**Notes:** November 2024 ballot measure (Question 5) changed Boston SC from appointed to elected. Researcher directed to verify district vs at-large topology and find BPS TIGER UNSD geo_id(s) from census.gov. ACPS migration (313) and LAUSD pattern both provided as canonical refs so researcher can adapt to whichever topology is correct.

---

## Plan Breakdown

| Option | Description | Selected |
|--------|-------------|----------|
| 3 plans (Recommended) | Plan 01: City gov structure. Plan 02: School Committee. Plan 03: Headshots. Matches Alexandria. | ✓ |
| 2 plans | City gov + school committee combined, then headshots. | |

**User's choice:** 3 plans
**Notes:** Mirrors Alexandria (Phase 103) exactly. Each plan is independently verifiable.

---

## Election Methods

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher confirms both (Recommended) | Researcher verifies from official Boston sources before writing migrations. | ✓ |
| plurality for both | Assume plurality, researcher validates, defaults to 'plurality' if unclear. | |
| NULL for both | Leave nullable, set only when non-standard method confirmed. | |

**User's choice:** Researcher confirms both
**Notes:** Boston City Council believed to use plurality-at-large (no RCV as of 2026) but researcher verifies. School Committee election method under new 2024 model is unknown — researcher finds and documents before writing chamber rows.

---

## Claude's Discretion

- External ID scheme: `-2507000001` through `-2507000014` for Mayor + 13 councillors (geo_id-based pattern)
- Government name: `'City of Boston, Massachusetts, US'`
- Migration numbering starts at 347

## Deferred Ideas

- Compass stances for Mayor Wu, councillors, school committee → Phases 111+ (MA Stances)
- MA 2026 elections and discovery pipeline → Phase 110
