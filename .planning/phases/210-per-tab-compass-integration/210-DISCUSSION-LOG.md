# Phase 210: Per-Tab Compass Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 210-per-tab-compass-integration
**Areas discussed:** Lens memory across tabs, Explicit-override lifetime, Educators default (209 sequencing), Representatives default + fallback

---

## Lens memory across tabs

| Option | Description | Selected |
|--------|-------------|----------|
| Per-tab memory | Each tab remembers its own lens (default first, then your explicit pick); switching tabs swaps to that tab's remembered lens | ✓ |
| Global lens, snap on entry | One shared lens snapped to the tab default on entry unless explicitly overridden (override rides across all tabs) | |

**User's choice:** Per-tab memory
**Notes:** Endorsed the "each tab = its own lens slot" mental model.

---

## Explicit-override lifetime (reset scope)

| Option | Description | Selected |
|--------|-------------|----------|
| On reload only | Per-tab picks persist across locations within the session; reset to defaults on reload | ✓ |
| On location change | Defaults re-assert on every new location; picks last only for the current place | |
| Persist across sessions | localStorage — picks survive reloads and future visits | |

**User's choice:** On reload only (in-memory, persists across locations within session)
**Notes:** No localStorage persistence for per-tab lens picks.

---

## Educators default (Phase 209 sequencing)

| Option | Description | Selected |
|--------|-------------|----------|
| Build 209 first | Do Education-lens scaffolding before 210 so Educators can default to Education; 210 ships whole | |
| Build 210 now, stub Educators | Ship 210 now (Judges→Judicial fully live); Educators falls back to Custom, auto-flips to Education once 209 + authoring land (data-only) | ✓ |

**User's choice:** Build 210 now, stub Educators to Custom until 209 lands
**Notes:** The flip to Education must require no 210 code change (data-only).

---

## Representatives default + uncalibrated fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Best Match, honest fallback | Reps keeps today's Best Match/Custom; any tab whose default lens isn't calibrated/authored falls back to Custom with honest blanks | ✓ |
| Reps also gets a fixed lens | Assign Representatives an explicit fixed default lens | |

**User's choice:** Best Match / honest fallback
**Notes:** No fabricated spokes anywhere; consistent with Phase 209's honest-blank rule.

---

## Claude's Discretion
- Exact state shape / location of the per-tab lens map (CompassContext vs. Results.jsx local state).
- Precise timing of applying a tab's default lens on tab entry.

## Deferred Ideas
- Authoring the Education lens's 8 topics — Phase 209 + content authoring.
- Cross-session (localStorage) persistence of per-tab lens picks — explicitly rejected for 210.
