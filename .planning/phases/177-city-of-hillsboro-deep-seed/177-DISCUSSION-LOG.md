# Phase 177: City of Hillsboro Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 177-city-of-hillsboro-deep-seed
**Areas discussed:** Ward routing branch, Mayor modeling, Community banner, Roster & stance depth

---

## Ward routing branch

| Option | Description | Selected |
|--------|-------------|----------|
| Verify at plan time | Researcher ground-truths charter/municipal code; "WHO VOTES" tie-breaker decides ward-geofence vs at-large branch | ✓ |
| Assume ward-elected | Commit to 3 custom ward geofences without verification | |
| Assume at-large | Link all offices to 4133850 like Beaverton without verification | |

**User's choice:** Verify at plan time (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| One district per ward | 3 ward districts, 2 offices each (El Monte shared-district precedent) | ✓ |
| One district per seat | 6 districts with duplicated polygons | |
| You decide at plan time | Planner picks after seeing charter/GIS structure | |

**User's choice:** One district per ward (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Official GIS only | Hillsboro GIS / WashCo open-data portal; missing file = blocker | ✓ |
| Official GIS, Ballotpedia fallback | Allow hand-tracing from PDF maps if no machine-readable file | |

**User's choice:** Official GIS only (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| City's naming verbatim | Use exact official seat naming on office titles | |
| Simplified labels | Normalize to 'Councilor, Ward N' | |
| You decide | Planner picks after seeing the official roster page | ✓ |

**User's choice:** You decide

---

## Mayor modeling

| Option | Description | Selected |
|--------|-------------|----------|
| Verify at plan time | Charter decides: directly-elected → Beaverton LOCAL_EXEC shape; rotational → seat-with-title | ✓ |
| Assume directly-elected | Commit to LOCAL_EXEC without charter verification | |

**User's choice:** Verify at plan time (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Title-on-seat | Council President/Vice Mayor designation rides on the office title | ✓ |
| Ignore the title | Seed all six as plain Councilors | |

**User's choice:** Title-on-seat (Recommended)

---

## Community banner

| Option | Description | Selected |
|--------|-------------|----------|
| Executor picks best licensed | Priority hint downtown/civic horizon; license + crop quality decides; Wikimedia first | ✓ |
| Downtown Main Street only | Lock subject to historic downtown | |
| Civic Center only | Lock subject to Hillsboro Civic Center | |

**User's choice:** Executor picks best licensed (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| In the surfacing plan | Banner tasks join the final coverage.js plan | ✓ |
| Its own plan | Dedicated 6th banner plan | |
| With headshots | Banner joins the headshot plan | |

**User's choice:** In the surfacing plan (Recommended)

---

## Roster & stance depth

| Option | Description | Selected |
|--------|-------------|----------|
| Carry unchanged | All live topics, one agent at a time, evidence-only, honest blanks, no defaults | ✓ |
| Adjust for Hillsboro | Change depth/scope/pacing | |

**User's choice:** Carry unchanged (Recommended)

| Option | Description | Selected |
|--------|-------------|----------|
| Carry unchanged | Roster verbatim from hillsboro-oregon.gov; city-site-first headshots; researcher notes WAF status | ✓ |
| Adjust sourcing | Different roster source or fallback order | |

**User's choice:** Carry unchanged (Recommended)

---

## Claude's Discretion

- Council office title labeling (city-verbatim vs simplified) — planner decides after seeing the official roster page.
- External_id block, next migration number, custom X00xx mtcc/district_type (ward branch only) — Wave-0 probes.

## Deferred Ideas

- None — discussion stayed within phase scope. Sister cities, school boards (incl. Hillsboro SD 1J), and 2026 elections remain in their own phases.
