# Phase 208: Educators & Judges Tabs - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-18
**Phase:** 208-educators-judges-tabs
**Areas discussed:** Tab order & mobile fit, Greyed-tab affordance, Per-tab rendering parity, Active-tab fallback

---

## Tab order & mobile fit

| Option | Description | Selected |
|--------|-------------|----------|
| Reps · Educators · Judges · Elections | Groups the three people-tabs, Elections last | ✓ |
| Reps · Elections · Educators · Judges | Keeps current pair adjacent, appends new tabs | |
| Reps · Judges · Educators · Elections | Same grouping, Judges before Educators | |

**User's choice:** Representatives · Educators · Judges · Elections

| Option (mobile) | Description | Selected |
|--------|-------------|----------|
| Short labels + horizontal scroll | Keep all four, shorten, scroll if tight | ✓ (with modification) |
| Abbreviate aggressively, no scroll | Force one row, cryptic abbreviations | |
| You decide at build time | Tune against real 280px render | |

**User's choice:** Short labels + horizontal scroll — **plus** reduce what the Elections tab
displays. The date is useful but doesn't need to live in the tab.

**Follow-up (freeform + mockup `C:\tmp\central.jpg`):** Tab becomes plain "Elections"; the full
election summary (`Elections - California General · Nov 3, 2026 · 109 days away`) moves UP to the
top location-header line (next to the location name). Election info is central to Empowered
Essentials and belongs at page-header level, persistent across tabs — not as a tab decoration.

---

## Greyed-tab affordance

| Option | Description | Selected |
|--------|-------------|----------|
| Greyed + unclickable | Visible but dimmed/non-interactive (matches original TAB-03) | |
| Greyed but clickable → empty message | Dimmed, clickable, shows empty-state panel | |
| Hidden entirely | Remove the tab when empty | ✓ |

**User's choice:** Hidden entirely — mid-discussion the user reversed the greyed-out approach.

**Notes:** "I just decided to not do the greyed out approach, and instead hide it entirely if
it's not populated. I'm not sure when I will have time to get all of the school-board folks and
judges, but some areas I've already done it." This **revises TAB-03 and Success Criterion #4**
(originally "greyed out / disabled"). The hint/tooltip question became moot.

---

## Active-tab fallback

| Option | Description | Selected |
|--------|-------------|----------|
| Fall back to Representatives | Auto-switch to Reps when active tab vanishes | ✓ |
| Fall back to Elections | Switch to Elections instead | |
| You decide | Default to Reps at build time | |

**User's choice:** Fall back to Representatives.

| Option (URL) | Description | Selected |
|--------|-------------|----------|
| Yes — same fallback | Stale ?view=judges to empty location falls back too | ✓ |
| Handle only at runtime | Only on in-session location change | |

**User's choice:** Yes — same fallback for stale `?view=` URLs. One rule for both cases.

---

## Per-tab rendering parity

| Option | Description | Selected |
|--------|-------------|----------|
| Full parity — reuse the pipeline | Same groupIntoHierarchy render on bucket subset | ✓ |
| Flat list, no tier grouping | Simpler flat card list, own layout | |
| You decide | Default to full parity | |

**User's choice:** Full parity — reuse the pipeline.

| Option (filters) | Description | Selected |
|--------|-------------|----------|
| Same FilterBar on all tabs | Keep appointed filter + name search + compass control | ✓ (partial) |
| Name search only | Drop appointed filter on new tabs | |
| You decide | Default to same everywhere | |

**User's choice:** Compass-mode control must apply to Educators/Judges tabs. The
elected/appointed box will "probably get rid of" — confirmed as a **deferred** separate change,
not part of Phase 208.

---

## Claude's Discretion

- Exact mobile label strings / horizontal-scroll threshold.
- Where the bucket partition happens in the render pipeline (as long as it uses `classifyBucket`).
- Visual placement/spacing of the relocated election summary within the location-header row.
- Whether to extend the `essentials_tab_switched` analytics event for the two new tab values.

## Deferred Ideas

- Search by Address / Browse by Location toggle redesign — its own future phase (clunky UX).
- Remove the elected/appointed filter box + functionality — its own phase (global FilterBar cleanup).
- Per-tab default compass-lens shift — Phase 210.
- Education lens data entry — Phase 209.
