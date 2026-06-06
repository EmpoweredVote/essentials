# Phase 95: Leonardtown / St. Mary's County Deep Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-05
**Phase:** 95-Leonardtown / St. Mary's County Deep Seed
**Areas discussed:** County board model, Appointed positions, Plan structure, Headshot fallback

---

## County Board Model

| Option | Description | Selected |
|--------|-------------|----------|
| All 5 elected county-wide (at-large) | All 5 share one COUNTY district row (geo_id='24037'). Title pattern: 'Commissioner (At-Large)' or 'President' + 'Commissioner'. | |
| 5 district seats (each rep a geographic district) | Each commissioner has their own district — similar to Multnomah D1-D4 but with 5 seats. Requires 5 separate district rows or a different modeling approach. | |
| Mixed (President at-large + 4 by district) | President is county-wide; 4 commissioners each represent a geographic district. Hybrid SQL structure. | |

**User's choice:** "Can you research this?" — deferred to researcher
**Notes:** Researcher must confirm election model via stmaryscountymd.gov before writing migration. CONTEXT.md documents all 3 SQL patterns so planner can pick the right one.

---

## Appointed Positions

| Option | Description | Selected |
|--------|-------------|----------|
| Elected officials only | Only seed positions voters directly choose: County Commissioners + Mayor and Council members. No County Admin, Town Manager, or other staff. | ✓ |
| Include top appointed admin roles | Also seed County Administrator and/or Leonardtown Town Manager with is_appointed=true offices. | |

**User's choice:** Elected officials only (Recommended)
**Notes:** Consistent with Multnomah County, OR pattern and the general EV design of showing democratically-accountable positions.

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans: seeding + headshots | Plan 95-01: County + Town government seeding. Plan 95-02: Headshots + verification. | ✓ |
| 3 plans: county, town, headshots | Separate plans for county seeding, town seeding, headshots. More granular. | |

**User's choice:** 2 plans (Recommended)
**Notes:** Small total scope (~10-12 officials across both governments) fits comfortably in 2 plans. Mirrors Cambridge + Multnomah County approach.

---

## Headshot Fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Document as gap | If official website has no photo, record the gap and move on. No LinkedIn or news photos. | ✓ |
| Try secondary sources | Try Wikimedia Commons or official campaign/news photos as fallback before giving up. | |

**User's choice:** Document as gap (Recommended)
**Notes:** Consistent with Collin County Tier 3-4 gap documentation pattern. Avoids non-official photo quality issues.

---

## Claude's Discretion

- External ID scheme for St. Mary's County and Leonardtown officials
- Migration numbering (start from 276, verify by listing migrations dir)
- Headshot script name (`md_local_headshots.py`)
- Post-verification DO block structure for both migrations

## Deferred Ideas

None — discussion stayed within phase scope.
