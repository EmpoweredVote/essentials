# Phase 169: Dark-Mode Design System Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-24
**Phase:** 169-dark-mode-design-system-foundation
**Areas discussed:** Token strategy, Typography, Theme scope, Filter row & tabs

---

## Token strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Update shared tokens globally | Set `@theme` dark tokens to Figma values as single source of truth; other dark pages shift too; no duplication | ✓ |
| Scope new palette to Results+Elections | Add Figma palette as new tokens applied only on redesigned pages; two palettes coexist | |

**User's choice:** Update shared tokens globally
**Notes:** Aligns with the phase's single-source-of-truth success criterion. Existing tokens are
already close to the Figma values; shift on un-redesigned dark pages accepted as a net improvement.
Keep existing `ev-coral` (no Figma equivalent); touch only dark-specific teal, not light-mode teal.

---

## Typography

| Option | Description | Selected |
|--------|-------------|----------|
| Adopt Inter + Manrope now | Wire Inter (body) + Manrope (display/labels) into type tokens this phase | ✓ |
| Keep current fonts, re-color only | Defer font swap to later polish | |

**User's choice:** Adopt Inter + Manrope now
**Notes:** This phase is the design-system foundation; fonts are core to the Figma identity. Section
labels = Manrope SemiBold 12px uppercase, tracking 1.2px, teal #00c8d7.

---

## Theme scope

| Option | Description | Selected |
|--------|-------------|----------|
| Results content + global header chrome | Re-theme Results + always-visible top nav/header (Layout + ev-ui Header via !important) | ✓ |
| Results main content only | Defer global header to a later phase | |

**User's choice:** Results content + global header chrome
**Notes:** Half-themed header over a Figma-dark page reads as broken. No ev-ui repo change needed —
Header already takes `isDark`; overrides live in essentials `index.css`.

---

## Filter row & tabs

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal re-theme now, full rework in 170 | Just make FilterBar + tabs dark-legible; full restyle deferred | ✓ |
| Fully restyle filter row + tabs now | Full Figma treatment now, adapt again in 170 | |

**User's choice:** Minimal re-theme now, full rework in 170
**Notes:** Phase 170 removes the tier dropdown and inserts banners in this exact area — full restyle
now would be thrown away.

---

## Claude's Discretion

- Exact `@theme` token names/structure, Inter/Manrope loading method (self-hosted vs CDN), and
  precise `!important` override selectors — planner/executor's call within the locked decisions.
- Keep old token names with new values vs rename — planner's call, provided single source of truth
  holds and light mode is preserved.

## Deferred Ideas

- Banners + continuous scroll + tier-sort removal → Phase 170.
- Banner art + pipeline → Phase 171. Elections parity → Phase 172.
- Landing + profile full dark redesign → future milestone (inherit global tokens only).
- ROADMAP.md Phase 171 section is mis-stitched (shows Elections-parity body) — fix when planning 171/172.
