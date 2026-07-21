# Phase 215: Header Declutter — Elected Default, Compass Icons, Search-by-Name Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-21
**Phase:** 215-header-declutter-elected-default-compass-icons-search-by-name-removal
**Areas discussed:** Lens labels/tooltips, Appointed access, Search-by-name, Tab default matrix

---

## Compass Lens Buttons — Labels/Tooltips (HDR-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Icon-only desktop, label mobile | Desktop icon-only + accessible hover/focus tooltip; mobile keeps icon+label | ✓ |
| Icon-only everywhere | Strict declutter; tap-to-reveal tooltip on all breakpoints | |
| Keep labels, add tooltips only | Honor prior "labels" feedback; reclaims no space | |

**User's choice:** Icon-only desktop, label mobile.
**Notes:** Reconciles HDR-03's declutter (a desktop empty-space problem) with prior VA feedback wanting labels/tooltips; avoids the tap-to-reveal vs tap-to-select conflict on touch.

---

## Appointed Access After Elected Default (HDR-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Fully remove access | Reps/Educators elected-only, no toggle; appointed non-judges unreachable there | ✓ |
| Keep a small reveal affordance | Default Elected but keep a toggle/link to reveal appointed | |

**User's choice:** Fully remove access.
**Notes:** Matches the "honest default" intent; appointed officials remain on the Judges tab.

---

## Search-by-Name Box (SRCH-07)

| Option | Description | Selected |
|--------|-------------|----------|
| Remove entirely | Delete the box, no relocation | ✓ |
| Relocate the capability | Preserve name-filtering elsewhere | |

**User's choice:** Remove entirely.
**Notes:** Redundant post-214 LocationCombobox; result lists are short enough to scan.

---

## Per-Tab Type Default Matrix (HDR-02)

| Option | Description | Selected |
|--------|-------------|----------|
| Reps=Elected, Educators=Elected, Judges=Appointed; test @ Bloomington IN | Locks HDR-02; test where real geo-linked judges exist | ✓ |
| Adjust matrix or test location | Different defaults or test location | |

**User's choice:** Confirmed as proposed.
**Notes:** Bloomington IN chosen because CA judicial districts have NULL geo_id and would empty the Judges tab, making CA an invalid no-empty test location.

## Claude's Discretion

- Exact tooltip implementation (custom component vs ev-ui primitive), provided it supports focus + hover + `aria-label`.
- How the tab-aware Elected default reconciles with the cached `appointedFilter` value at `Results.jsx:505`.

## Deferred Ideas

- Compass on/off toggle restyle — out of scope for 215.
- Three Phase-214 search-domain todos reviewed but not folded (LocationCombobox refinements, combobox row color-coding, Phase-212 gazetteer data audit).
