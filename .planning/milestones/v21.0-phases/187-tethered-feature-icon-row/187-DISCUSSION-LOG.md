# Phase 187: Tethered Feature-Icon Row - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-07
**Phase:** 187-tethered-feature-icon-row
**Areas discussed:** Product scope & extensibility, Placement & look, Tooltip, State/federal Treasury resolution, Unhooked-icon rendering

---

## Product Scope & Extensibility

| Option | Description | Selected |
|--------|-------------|----------|
| Generic registry, Treasury-only wired | Product-registry framework; only Treasury's resolver wired now | ✓ (via notes) |
| Treasury-specific only | Hardcode a single Treasury icon, no abstraction | |

**User's choice:** Generic registry (clarified via notes).
**Notes:** "We should know where the placement of each icon would be on a banner, even if they aren't hooked up, yet. We should also hook it up." → Reserve layout for all products; wire Treasury for real.

---

## Placement & Look

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right, circular chip | Row top-right, semi-transparent rounded chips | |
| Bottom-right, bare symbols | Bottom-right, plain SVG symbols on the title baseline | |
| Let me describe it | User specifies | ✓ (via notes) |

**User's choice:** Free-text — bottom-right with circular chips.
**Notes:** "Row of icons are Bottom right with circular chips, population is towards the top right, but not shoved in the corner." → Icons bottom-right + circular chips; population stat (Phase 188) reserved top-right, not corner-jammed.

---

## Tooltip (ICON-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal accessible tooltip | Custom tooltip on hover AND focus, aria-label for SR | ✓ |
| Reuse existing tooltip pattern | Adapt IconOverlay/CompassCard tooltip | |

**User's choice:** Minimal accessible tooltip.
**Notes:** Native `title=` rejected — no keyboard-focus display.

---

## State / Federal Treasury Resolution (TETH-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Researcher probes /treasury/cities | Inspect live API to discover state/federal entity shapes | ✓ |
| I know the entity naming | User describes naming to lock now | |
| City-tier only this phase | Descope TETH-04 | |

**User's choice:** Researcher probes `/treasury/cities`.
**Notes:** Discover state General Fund + federal entity shapes before designing the resolver.

---

## Unhooked-icon rendering (clarifying follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Design the layout, render only working icons | Reserve icon order; render only icons with a real link (Treasury) | ✓ |
| Show all icons, greyed if not hooked up | Render Compass/ReadRank greyed — would contradict TETH-03 | |

**User's choice:** Design the layout, render only working icons.
**Notes:** Honors TETH-03 — no greyed/dead placeholders. Row left-aligns whatever is live; Compass/ReadRank appear later with no layout change.

---

## Claude's Discretion

- Whether link resolution lives inside `SectionBanner` or is passed via a resolved `featureIcons` prop (planner decides, mindful of Phase 189's shared-component goal).
- Treasury-cities fetch/caching strategy across the 3 stacked banners.
- Exact chip size, opacity, spacing, and SVG sizing within legibility + no-overlap constraints.

## Deferred Ideas

- Compass & Read & Rank icons — until each exposes a per-location deep-link contract (layout reserves slots now).
- Reciprocal icons on other apps' banners — out of v21.0 scope.
- Population / Census stats strip — Phase 188.
- Shared-component consolidation across Results + Elections — Phase 189.
