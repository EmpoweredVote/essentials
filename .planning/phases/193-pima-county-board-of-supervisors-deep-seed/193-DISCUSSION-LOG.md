# Phase 193: Pima County Board of Supervisors Deep-Seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-09
**Phase:** 193-pima-county-board-of-supervisors-deep-seed
**Areas discussed:** Supervisor-district geofences, Board structure & Chair, Compass stance scope, Pima County banner subject

---

## Supervisor-district geofences

| Option | Description | Selected |
|--------|-------------|----------|
| Source custom districts; pause on failure | Load 5 official supervisor-district boundaries from Pima County GIS as custom LOCAL geofences (LV-ward X00xx pattern) → per-district routing; PAUSE + flag if boundaries can't be sourced cleanly | ✓ |
| Source custom districts; county-wide fallback | Same primary, but degrade to attaching all 5 to the county boundary (04019) if sourcing fails | |
| County-wide attachment only | Skip sourcing; attach all 5 to county boundary (no per-district routing) — fails success criterion #1 | |

**User's choice:** Source custom districts; pause on failure
**Notes:** True per-district routing is the intent; no silent degradation. Only the whole-county boundary `04019` exists today (Phase 190); the 5 sub-county districts must be sourced.

---

## Board structure & Chair

| Option | Description | Selected |
|--------|-------------|----------|
| 1 chamber, 5 district seats, Chair as title | Single Board of Supervisors chamber; 5 by-district offices; rotational Chair = title annotation on the sitting supervisor | ✓ |
| 1 chamber, 5 seats, no Chair marker | Same 5 offices but don't surface the Chair role at all | |
| Separate Chair office | Model Chair as its own office — rejected (chair isn't separately elected; double-counts a person) | |

**User's choice:** 1 chamber, 5 district seats, Chair as title
**Notes:** Chair is board-selected annually (rotational), so it's a title on the occupant, not a seat.

---

## Compass stance scope

| Option | Description | Selected |
|--------|-------------|----------|
| Existing live compass, all topics | Research every live compass topic, evidence-only, honest blanks; unreviewed local-lens topics stay out | ✓ |
| Include proposed local-lens topics | Also research the 10 proposed local questions / 8 Local Lens topics (still awaiting review) | |
| Curated county-relevant subset | Research only a hand-picked subset of live topics — diverges from the research-all-topics rule | |

**User's choice:** Existing live compass, all topics
**Notes:** First AZ jurisdiction to get stances; sets the template for Tucson + suburbs. Local-lens topics deferred until separately finalized.

---

## Pima County banner subject

| Option | Description | Selected |
|--------|-------------|----------|
| Catalinas / Sonoran desert landscape | Santa Catalina Mountains + saguaro/Sonoran-desert scene; distinct from Tucson-city + Phoenix-state banners; no AI/aerial | ✓ |
| Pima County civic/landmark | Ground-level shot of a county civic landmark (institution-forward) | |
| You source options, I'll pick | Source 2–3 licensed candidates at execute time for selection | |

**User's choice:** Catalinas / Sonoran desert landscape
**Notes:** Must read as "Pima County the place," kept visually distinct from the future Tucson-city banner (downtown streetscape reserved for Phase 194) and the live AZ-state Phoenix skyline.

---

## Claude's Discretion

- County `ext_id` range + custom geo_id X-code scheme for the 5 supervisor districts (LV ward convention).
- Blocking roster-currency human-verify checkpoint before seeding (Phase 192 Task 2 pattern).
- Structural-vs-audit migration split; plan/wave split.
- Per-supervisor headshot source selection + license documentation.

## Deferred Ideas

- 10 proposed local compass questions / 8 Local Lens topics — out until separately reviewed.
- City of Tucson + 4 suburbs deep-seeds — Phases 194–198.
- 2026 Arizona election shells — Phase 199.
