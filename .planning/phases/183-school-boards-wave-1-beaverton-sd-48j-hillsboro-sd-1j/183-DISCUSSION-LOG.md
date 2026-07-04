# Phase 183: School Boards Wave 1 — Beaverton SD 48J + Hillsboro SD 1J - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-03
**Phase:** 183-school-boards-wave-1-beaverton-sd-48j-hillsboro-sd-1j
**Areas discussed:** Zone-routing branch, Banner treatment, Plan shape, Roster edge cases

> User selected all four gray areas, answered the first zone-routing question live, then went AFK.
> All remaining questions were resolved with the recommended option per the Phase 181/182 AFK
> handling precedent. Amendable before planning.

---

## Zone-routing branch

### Q1: How should the planner decide whether the boards need sub-zone geofences?

| Option | Description | Selected |
|--------|-------------|----------|
| Who-votes tie-breaker (Recommended) | Carry D-02 forward: zone voters alone elect → sub-zone geofences (LAUSD pattern); whole district votes → single G5420 (PPS/Multnomah pattern). Verified at plan time. | ✓ |
| Whole-district always | Model both boards on the single G5420 regardless of election method (all 11+ prior school boards). | |
| You decide | Claude picks at plan time. | |

**User's choice:** Who-votes tie-breaker (answered live)
**Notes:** Beaverton SD 48J genuinely uses zones, so the branch is real, not theoretical.

### Q2: If zone-VOTED but no official machine-readable zone GIS exists?

| Option | Description | Selected |
|--------|-------------|----------|
| Whole-district fallback (Recommended) | Seed on the single G5420 with the zone structure documented as a modeling caveat; success criteria are district-level; never hand-trace. | ✓ (AFK default) |
| Blocker — strict city rule | Surface the missing-GIS blocker and pause the affected board. | |
| You decide | Claude picks at plan time. | |

**User's choice:** Recommended option applied (user AFK — 60s no response)
**Notes:** Softer than the city D-02 blocker because Phase 183 success criteria don't demand zone precision.

---

## Banner treatment

Not presented individually (user AFK) — resolved with the recommended option flagged in the
area-selection round: **No banner for school districts.** The licensed-banner standing constraint
is city-scoped; CCSD shipped plain. District browse inherits default banner behavior. Alternative
considered: extend the city banner constraint to districts (deferred as a future idea instead).

---

## Plan shape

Not presented individually (user AFK) — resolved with the recommended option: **Single shared
plan-set covering both districts** (v10.0 shape — 6 Multnomah boards in one phase/migration 254);
~4-plan phase (Wave-0 → structural → headshots → surfacing; no stances, no banner plan).
Alternative considered: two per-district plan chains mirroring the city phases.

---

## Roster edge cases

Not presented individually (user AFK) — resolved with the recommended option: **city conventions
transfer unchanged** — verbatim roster/body name from official district sites; office title per
district convention (never assume "Board Member"); Chair/Vice-Chair = title-on-seat; non-voting
seats (superintendent, student reps) excluded; vacancies documented, never placeholder people;
standing headshot pipeline incl. circle-cutout inscribed-crop lesson.

---

## Claude's Discretion

- External_id block (geo_id-derived analog, Wave-0 verified)
- Next migration number (on-disk MAX verified 1202 this session → next 1203; Wave-0 re-confirms)
- School-district government naming (CCSD 1107 / Multnomah 254 precedents)
- Structural migration granularity (one file for both vs one per district)

## Deferred Ideas

- District banners (licensed banner art for school-district browse) — future backlog
- Wave 2 boards (Phase 184), school-board election races + discovery (Phase 185)
