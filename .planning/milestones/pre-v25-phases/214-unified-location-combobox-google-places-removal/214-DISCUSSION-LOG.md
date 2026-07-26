# Phase 214: Unified Location Combobox & Google Places Removal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-21
**Phase:** 214-unified-location-combobox-google-places-removal
**Areas discussed:** Address autocomplete gap, Typeahead & classification, Results resting & edit state, Picker + error/empty states, Empty-field discovery, Coordinate result label

---

## Address autocomplete gap

| Option | Description | Selected |
|--------|-------------|----------|
| Accept gap + Enter hint | No live dropdown for addresses; show a subtle "Press Enter to look up this address" hint when input looks like a street address | ✓ |
| Accept gap silently | No live dropdown and no hint; type + Enter/submit | |

**User's choice:** Accept gap + Enter hint (D-01)
**Notes:** Google Places was the only live street-address suggester; no free backend replacement exists (location-search is place-names, Census is submit-time only and must not receive bare names). Gap is a deliberate, accepted downgrade softened by the hint.

---

## Typeahead & classification

| Option | Description | Selected |
|--------|-------------|----------|
| Client heuristic + debounced DB | Coords + addresses recognized client-side (not sent to resolver); name-like input debounce-queries /location-search (~250ms, min 3 chars) | ✓ |
| Always query resolver | Every keystroke (debounced) hits /location-search regardless of shape | |
| You decide | Leave to planner | |

**User's choice:** Client heuristic + debounced DB (D-02)
**Notes:** Exact regexes / debounce / min-chars left to planner (D-06); the split is locked.

---

## Results resting & edit state

| Option | Description | Selected |
|--------|-------------|----------|
| Always-editable input | One field pre-filled with the current location label; focus selects-all | ✓ |
| Pill expands to input | Location pill at rest that swaps to input on click | |
| You decide | Leave to planner/UI-spec | |

**User's choice:** Always-editable input (D-03)
**Notes:** Resting-label text logic (address vs place vs coords) left as Claude discretion following existing Results logic (D-07).

---

## Picker + error/empty states

| Option | Description | Selected |
|--------|-------------|----------|
| Inline dropdown (reuse pattern) | Candidates in the combobox listbox reusing LocalityMatches styling — `City, ST` + area-type + Stances badge; errors inline | ✓ |
| Separate disambiguation step | Candidates on their own view after submit | |
| You decide | Leave to planner/UI-spec | |

**User's choice:** Inline dropdown, reuse LocalityMatches (D-08)
**Notes:** Stances badge driven by 212's `has_local_data`; coordinate 422 taxonomy (3 codes) mapped to inline messages.

---

## Empty-field discovery

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing (clean) | No dropdown until the user types; Landing keeps its coverage list as browse entry point | ✓ |
| Show covered-area hints | Surface covered areas on empty focus as a browse-tree replacement | |
| You decide | Leave to planner/UI-spec | |

**User's choice:** Nothing (clean) (D-04)
**Notes:** Matches the milestone declutter intent; LocationBrowser tree is retired, not reincarnated as an empty-state panel.

---

## Coordinate result label

| Option | Description | Selected |
|--------|-------------|----------|
| Echo typed coords (client) | Show the typed `lat, lng` as the field label, purely client-side, never from server | ✓ |
| Generic label | Show "Your location" or leave blank | |
| You decide | Leave to planner/UI-spec | |

**User's choice:** Echo typed coords, client-side (D-05)
**Notes:** Respects the 213 privacy contract (server returns empty `matchedAddress`) — the label is reconstructed from the user's own keystrokes, never the response.

---

## Claude's Discretion

- Exact classification regexes, debounce ms, min-char threshold (D-06).
- Refactor-in-place vs delete/replace of `localitySearch.js` (D-09).
- Shared combobox component name/location + internal WAI-ARIA implementation.
- Enter-hint / coordinate-error / no-match copy.
- Coordinate-path result rendering on Results (empty `matchedAddress`, no `browse_geo_id`).
- Resting-label derivation logic (D-07).

## Deferred Ideas

- Type-filter Elected default, compass-lens icon buttons, "Search by name" removal → Phase 215.
- Live street-address autocomplete replacement (no provider in scope; accepted gap).
- Empty-state discovery panel on Results (rejected now; possible future enhancement).
