# Phase 86: Multnomah County School Districts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 86-multnomah-county-school-districts
**Areas discussed:** Plan structure, G5420 loader approach, Riverdale edge case, School board elections

---

## Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| 2 plans | Plan 1: geofences + government bodies + officials + smoke test; Plan 2: headshots audit-only | ✓ |
| 3 plans | Plan 1: geofences only; Plan 2: government bodies + officials + smoke test; Plan 3: headshots | |
| 4 plans | Most granular — separate geofences, chambers, officials, headshots | |

**User's choice:** 2 plans (recommended)
**Notes:** Mirrors the Phase 83/84 Multnomah structure.

---

## G5420 Loader Approach

| Option | Description | Selected |
|--------|-------------|----------|
| New dedicated OR UNSD loader | load-or-school-boundaries.ts following load-lausd-board-boundaries.ts pattern | ✓ |
| Extend existing TIGER loader | Add G5420 to load-state-tiger-boundaries.ts | |

**User's choice:** New dedicated loader (recommended)
**Notes:** Keeps shared TIGER loader clean.

---

## Riverdale Edge Case

| Option | Description | Selected |
|--------|-------------|----------|
| Include if TIGER has G5420 row | Researcher checks TIGER UNSD; include if present, document gap if absent | ✓ |
| Always include all 6 | Fall back to manual polygon if TIGER lacks Riverdale | |
| Drop Riverdale | Only seed 5 larger districts | |

**User's choice:** Include if TIGER has G5420 row (recommended)
**Notes:** No manual polygon fallbacks — TIGER is authoritative.

---

## School Board Elections

| Option | Description | Selected |
|--------|-------------|----------|
| No — officials only, elections later | Phase 86 scopes to OR-SCHOOL-01..04 only | ✓ |
| Yes — seed race rows too | Add 2026 race rows + discovery_jurisdictions for each district | |

**User's choice:** Officials only (recommended)
**Notes:** Elections for school boards deferred to a future phase.

---

## Claude's Discretion

None — user selected recommendations on all four areas.

## Deferred Ideas

- School board 2026 election race rows + discovery pipeline — future phase
