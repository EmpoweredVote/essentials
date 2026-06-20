# Phase 142: Long Beach deep-seed - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 142-long-beach-deep-seed
**Areas discussed:** Citywide elected officers, Stance scope, School board (LBUSD), Council district structure, Phase framing (post DB pre-check), Milestone-wide pre-check

---

## Citywide elected officers

| Option | Description | Selected |
|--------|-------------|----------|
| Include all three | Seat City Attorney + City Prosecutor + City Auditor alongside Mayor + council | ✓ |
| Mayor + council only | Match SF/Sacramento/Fremont pattern (officers excluded) | |
| Attorney + Auditor only | Include Attorney + Auditor, exclude City Prosecutor | |

**User's choice:** Include all three
**Notes:** Long Beach directly elects these officers citywide (unlike other CA cities done so far where they are appointed). They belong on the ballot the voter sees.

---

## Stance scope in 142

| Option | Description | Selected |
|--------|-------------|----------|
| End-to-end, stances last | Seed/reconcile structure + headshots first, then run evidence-only stances as final wave | ✓ |
| Split stances out | Phase 142 = structure + headshots only; stances become a separate later pass | |

**User's choice:** End-to-end, stances last
**Notes:** Satisfies roadmap success criterion 4 while letting structure/headshots verify independently. After DB pre-check (0/9 stances), stances became the bulk of the phase.

---

## School board (LBUSD)

| Option | Description | Selected |
|--------|-------------|----------|
| City government only | Exclude LBUSD; defer school boards (CA precedent) | ✓ |
| Include LBUSD board | Fold elected Board of Education into this phase (MA-style) | |

**User's choice:** City government only
**Notes:** LBUSD is a separate independent district; folding 15 boards across the wave balloons the milestone. Deferred.

---

## Council district structure

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher confirms pattern | Verify current district map; follow established CA pattern | ✓ |
| Flat single LOCAL district | All seats under one LOCAL district, number in title | (confirmed by DB) |
| Per-district geofences | 9 per-district geofences for address routing | |

**User's choice:** Researcher confirms pattern
**Notes:** DB pre-check later showed the existing seed already uses the flat single-LOCAL pattern (8 LOCAL + 1 LOCAL_EXEC, all geo_id=0643000). Decision resolved to: keep flat, researcher confirms the missing 9th district.

---

## Phase framing (after DB pre-check discovery)

| Option | Description | Selected |
|--------|-------------|----------|
| Reconcile + complete + stances | Pre-check/reconcile existing seed, fix data hygiene, add 9th district + 3 officers, then stances | ✓ |
| Stances-focused only | Treat structure/headshots as done; minimal additions | |
| Full greenfield rebuild | Re-seed from scratch | |

**User's choice:** Reconcile + complete + stances
**Notes:** DB pre-check revealed Long Beach is NOT greenfield — gov + 2 chambers + 9 officials seated (v7.0 + mig 294), 9/9 headshots, 0/9 stances, geo_id NULL, duplicate "Long Beach City Council" chamber, only 8 of 9 council districts.

---

## Milestone-wide pre-check

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, flag it | Add note + deferred item: every Wave-2 phase must DB-pre-check before assuming greenfield | ✓ |
| Just this phase | Keep finding scoped to Long Beach only | |

**User's choice:** Yes, flag it
**Notes:** At least Long Beach and Carson were pre-seeded; ROADMAP/STATE "all 15 greenfield" Key Fact should be softened. Captured as deferred idea.

---

## Claude's Discretion

- Specific data-hygiene mechanics (geo_id backfill, chamber rename target name, image dedupe, office_id back-fill) left to planner within the reconcile framing.

## Deferred Ideas

- Wave-2 greenfield assumption is wrong (milestone-level) — every Wave-2 phase must DB-pre-check; ROADMAP/STATE Key Fact needs softening.
- LBUSD elected Board of Education — candidate for a future school-board coverage milestone.
