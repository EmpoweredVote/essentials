---
title: Color-code city/county/state area-type in LocationCombobox rows
type: enhancement
priority: medium
created: 2026-07-21
source: phase-214 human verification (214-06)
domain: frontend (essentials) — requires 214 UI-SPEC color-contract revision
---

# Color-code area-type in LocationCombobox candidate rows

Requested during Phase 214 verification: visually separate city / county / state
candidate rows so the type is scannable at a glance (currently conveyed only by the
`city`/`county`/`state` pill + `COUNTY`/`AREA`/`STANCES` badges).

## Why this is not a drop-in tweak
The Phase 214 UI-SPEC has a *locked* color contract: teal (`--ev-teal`) and coral
(`--ev-coral`) are reserved for specific roles, and color is explicitly "never used
for … decorative fills." Per-type coloring changes that contract, so this needs a
design decision, not just an edit:
- Which palette distinguishes the ~3 types without clashing with the reserved teal
  focus/accent and coral error colors?
- Dark-mode contrast for each type color.
- Consistency with the app's antipartisan-neutral aesthetic (no partisan reds/blues).

## Action
1. Revise the 214 UI-SPEC color section to admit a small type-indicator palette.
2. Implement in `src/components/LocationCombobox.jsx` candidate-row rendering.
3. Verify light + dark contrast.
