# Phase 173: Nevada Playbook Retrospective & Close - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-30
**Phase:** 173-nevada-playbook-retrospective-close
**Areas discussed:** Phase-169 collision resolution, CCSD purple-chip honesty, Nevada Quick Reference block, Close-blocker bar, Known-issues / deferred

---

## Pre-discussion: Phase 169 directory collision

`/gsd-discuss-phase 169` resolved to the stale `169-dark-mode-design-system-foundation` directory
(a completed phase from the parked v19.0 frontend detour, which reused phase numbers 169–172 while
v18.0 was parked at 162). The active v18.0 roadmap defines Phase 169 as "Nevada Playbook
Retrospective & Close" (NV-RETRO-01), which had no directory yet. Surfaced the collision before
touching anything.

| Option | Description | Selected |
|--------|-------------|----------|
| Archive v19.0 detour dirs | Move 169–172 into a milestone archive folder; free 169 for NV-RETRO | |
| Renumber the v18.0 NV-RETRO phase | Leave detour dirs; give NV-RETRO a non-colliding number | ✓ |
| I actually meant the dark-mode phase | Revisit the completed dark-mode phase instead | |

**User's choice:** Renumber the v18.0 NV-RETRO phase.
**Notes:** Renumbered NV Retrospective 169 → **173** (next free number after parked 169–172).
Updated ROADMAP.md, STATE.md, REQUIREMENTS.md; committed `5498e9e`. `init.phase-op 173` then
resolved cleanly (no collision, no stale context). v19.0 detour dirs left untouched.

---

## CCSD purple-chip honesty

| Option | Description | Selected |
|--------|-------------|----------|
| Chip = real DB stance count | Reconcile every NV entry's hasContext against audit-time DB stance count (157 D-02); CCSD → plain | ✓ |
| School boards = roster-seeded chip | Redefine chip for school districts: CCSD stays purple meaning fully-seeded roster | |
| Leave all NV chips as-is | Keep hasContext:true everywhere regardless of count | |

**User's choice:** Chip = real DB stance count (Recommended).
**Notes:** CCSD has 0 stances by design (school-board compass deferred) → drops to plain chip, stays
listed/browsable. Las Vegas (the parked phase) + others reconciled to whatever the audit finds. No
school-board-special chip semantic.

---

## Nevada Quick Reference block (LOCATION-ONBOARDING.md)

| Option | Description | Selected |
|--------|-------------|----------|
| Full NV playbook block | Consolidated ext_id schemes, ward MTFCCs, WAF map, 'nv' casing, browse params, geo_ids, migration convention | ✓ |
| Minimal pointer block | Short block linking to per-phase artifacts, no consolidated detail | |

**User's choice:** Full NV playbook block (Recommended).
**Notes:** Highest-leverage artifact for the next NV wave / new state.

---

## Close-blocker bar for v18.0

| Option | Description | Selected |
|--------|-------------|----------|
| Structure-hard / data-soft | Block only on roster-structure correctness; deferred legislature stances, CCSD no-stance, headshot 403 gaps = documented gaps | ✓ |
| Also require stances to close | Require ≥1 stance per non-school NV jurisdiction (stricter) | |

**User's choice:** Structure-hard / data-soft (Recommended).
**Notes:** Verifying Las Vegas structure is part of the hard check (parked phase). NV has more
by-design gaps than v17.0; named explicitly as allowed.

---

## Known-issues / follow-up to record (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| NV legislature stances (deferred) | 63 legislators seeded+headshots, no stances; deferred follow-up | ✓ |
| Mesquite (future wave) | Clark County's smallest incorporated city, not seeded | ✓ |
| Browse state-leak bug | Unseeded-city browse leaks stale officials under wrong state banner | ✓ |
| v19.0 renumber note (169→173) | Record the numbering gap from the parked v19.0 detour | ✓ |

**User's choice:** All four selected.
**Notes:** Cheap to record, expensive to rediscover.

---

## Claude's Discretion

- Exact wording of GOTCHA entries, "Notable patterns" cells, and Quick Reference phrasing.
- Audit table column layout beyond the required DB-verified dimensions.
- Whether to spot-check NV headshots for wrong-person errors (recommended, not required).

## Deferred Ideas

- NV legislature compass stances → dedicated follow-up milestone.
- Mesquite → future Clark County wave.
- Browse-government-list state-leak bug → deferred fix.
- Formalizing/closing the v19.0 frontend-detour milestone (phases 169–172) → separate effort.
