# Phase 192: Arizona Legislature (seed + headshots) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-08
**Phase:** 192-arizona-legislature-seed-headshots
**Areas discussed:** House multi-member modeling, Headshot source + gap policy, Chamber & title naming, Roster snapshot & vacancy

---

## House multi-member modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Two identical offices per LD | Two undifferentiated 'State Representative' offices per district, both linked to the same SLDL district_id. Matches AZ top-two at-large reality. | ✓ |
| Seat A / Seat B posts | Distinguish the two offices with post labels. Cleaner uniqueness but AZ does not elect by seat — artificial distinction voters never see. | |
| You decide | Planner picks structure that fits offices schema, defaulting to undifferentiated. | |

**User's choice:** Two identical offices per LD (Recommended)
**Notes:** Planner must verify the `offices` table permits 2 rows on one `district_id`; if a unique constraint forbids it, surface the constraint and minimal disambiguator rather than inventing seat labels. → CONTEXT D-01.

---

## Headshot source + gap policy

| Option | Description | Selected |
|--------|-------------|----------|
| 90/90; checkpoint gaps for operator file | Source from azleg.gov (Wikimedia/Ballotpedia fallback). Truly unsourceable member → checkpoint for operator-supplied file. 191 Presmyk precedent. | ✓ |
| Accept documented gap | Record gap and proceed. Faster but leaves <90/90 and a blank profile. | |

**User's choice:** 90/90; checkpoint gaps for operator file (Recommended)
**Notes:** → CONTEXT D-03.

---

## Chamber & title naming

| Option | Description | Selected |
|--------|-------------|----------|
| Short name + full name_formal | chamber.name='State Senate'/'House of Representatives'; name_formal='Arizona State Senate'/'Arizona House of Representatives'. Titles 'State Senator'/'State Representative'. Matches 191. | ✓ |
| Full name as chamber.name (NV 160 style) | Full name in both fields. Consistent with NV Legislature but not AZ 191 executives. | |
| You decide | Planner mirrors closest existing chamber-naming pattern. | |

**User's choice:** Short name + full name_formal (Recommended)
**Notes:** → CONTEXT D-04. Planner may reconcile against exact string style of the 7 existing AZ chambers if a closer precedent exists, but must not invent a third convention.

---

## Roster snapshot & vacancy

| Option | Description | Selected |
|--------|-------------|----------|
| Current sitting members; vacancy → vacant office | Seed the current sitting 56th Legislature. Genuine vacancy → vacant office (no politician). 191 D-04. No 2026-incoming. | ✓ |
| Revisit | Discuss roster scope/timing differently. | |

**User's choice:** Current sitting members; vacancy → vacant office (Recommended)
**Notes:** → CONTEXT D-02.

---

## Claude's Discretion

- ext_id numbering — pick a clean, collision-safe AZ legislative block (NV `-3203xxx`/`-3204xxx` sibling convention; avoid the taken AZ `-400091..094`, `-4004xxx`, `-4001..-4009`, and the shared national pool past `-400503`).
- Plan/wave split (NV 160 used 3 plans; Senate vs House headshots may split into separate waves).
- Exact headshot fallback source per member when multiple exist.

## Deferred Ideas

- Compass stances for all 90 AZ legislators — deferred milestone-wide (NV v18.0 pattern).
- Legislative committee/leadership structure (Speaker, President, chairs) — not modeled.
- 2026 legislative election race shells — Phase 199.
