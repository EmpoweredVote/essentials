# Phase 214: Unified Location Combobox & Google Places Removal - Research

**Researched:** 2026-07-21
**Domain:** Frontend accessible combobox (React 19 + @floating-ui/react) + Google Places retirement
**Confidence:** HIGH (codebase-grounded; ARIA/floating-ui claims cross-verified against official docs)

## Summary

This phase replaces Results.jsx's Address/Browse toggle + `LocationBrowser` tree, and Landing.jsx's
Google Places-bound input, with one shared `<LocationCombobox>` component. The heavy lifting is
**client-side classification** (regex-based, no library needed) that routes typed input to one of
three already-live paths: the existing Census address search (`handleAddressSearch`/`searchPoliticians`),
a new debounced call to `GET /essentials/location-search` (Phase 212, not yet wired into `api.jsx`),
or a new call to `POST /essentials/coordinate-lookup` (Phase 213, also not yet wired). `@floating-ui/react`
0.27.19 is already a direct dependency and already used in 4 files in this exact idiomatic way
(`useFloating` + `useInteractions` + a manual middleware stack) — this phase's positioning code should
match that established local pattern, not invent a new one. The accessible listbox itself is best built
with `@floating-ui/react`'s `useListNavigation({ virtual: true })`, which manages `aria-activedescendant`
automatically and keeps DOM focus on the `<input>` — this directly supersedes `LocalityMatches.jsx`'s
document-level `keydown` capture-phase hack, which existed only to out-race Google's own listener and
has no reason to exist once Google is gone.

The Google-removal surface is broader than "delete 2 files" — `localitySearch.js`'s `classifyQuery`
(Google Geocoder) is the *existing* classification mechanism for Results/Landing and must be replaced
wholesale by the D-02 client heuristic, while `resolveLocalityRoute`'s *routing* logic (candidate lookup
via `fetchBrowseAreas` + `coverageAreaToPath`) is largely reusable/adaptable to the new place-name
resolver response. A careful reading shows some `google` string hits in the repo (`buildingImages.js`,
`VoterResourcesCard.jsx`, `voterResourceLinks.js`, a stale comment in `coverage.js`) are **not** part of
the Places-autocomplete surface — one is a comment about Census address-format parity, two are the
unrelated Google Civic Information API (voter/polling-location data) that this phase must NOT touch.
The end-of-phase acceptance grep must be scoped precisely or it will produce false "failures" against
code this phase should leave alone.

**Primary recommendation:** Build `<LocationCombobox>` as a new component (e.g.
`src/components/LocationCombobox.jsx`) using `@floating-ui/react`'s `useListNavigation({ virtual: true })`
+ `useRole('listbox')` + `useInteractions`, reusing `LocalityMatches`' visual row markup, backed by two
new thin `api.jsx` functions (`searchLocationsByName`, `lookupCoordinate`) and a new pure client-side
classifier module (e.g. `src/lib/inputClassifier.js`) that is unit-testable in isolation via `vitest`
with zero DOM dependency.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Input classification (address / place / coordinate) | Browser / Client | — | Pure regex logic on keystrokes, must run before any network call fires (D-02); zero backend involvement |
| Place-name candidate search | API / Backend | Browser / Client | `/location-search` does the pg_trgm ranking (212); client only debounces + renders |
| Coordinate → officials resolution | API / Backend | Browser / Client | `/coordinate-lookup` does `ST_Covers` (213); client reconstructs the display label only (D-05) |
| Street address → officials resolution | API / Backend | Browser / Client | Unchanged existing Census geocode path (`searchPoliticians`/`handleAddressSearch`) |
| Listbox positioning/rendering | Browser / Client | — | `@floating-ui/react` anchors purely client-side; no SSR in this app (Vite SPA) |
| Candidate disambiguation UX | Browser / Client | — | D-08: inline listbox row selection, no server round-trip beyond the initial search |
| Google Places removal | Browser / Client | Build tooling | Dependency lives in `package.json`/`node_modules`; no backend involvement |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Accept the loss of live street-address autocomplete + show an Enter-hint. No live dropdown for address-shaped input — user types, presses Enter/clicks Search, and the existing Census geocode path (`handleAddressSearch`) fires on submit.
- **D-02:** Client-side heuristic classification + debounced DB query for names only. Coordinates recognized locally via decimal `lat, lng` regex → dispatched to `POST /essentials/coordinate-lookup` on submit (not sent to `/location-search`). Street addresses recognized locally (leading street number/digits) → handled on submit via the existing address path (not sent to the resolver). Bare place-names → debounce-queries `GET /essentials/location-search` (~250ms debounce, ~3-char minimum — planner may tune) for live candidate suggestions.
- **D-03:** One always-editable text input, pre-filled with the current location label; focus selects-all for easy replacement. No pill→input display/edit toggle.
- **D-04:** Nothing on empty focus — keep it clean. No dropdown until the user types. Landing keeps its existing coverage list as the browse entry point.
- **D-05:** Echo the typed `lat, lng` as the field label — client-side only, never from the server response (213 deliberately returns empty `matchedAddress`).
- **D-06:** Exact classification regexes, debounce interval, min-char threshold are planner/researcher discretion; the split (coords + addresses local, names → resolver) is locked.
- **D-07:** Resting label text (Claude's discretion, follow existing Results logic): address resolve → formatted address (title-cased via existing `toAddressTitleCase`); place-name resolve → place label (`City, ST`); coordinate resolve → typed coordinates (per D-05).
- **D-08:** Inline dropdown, reuse the `LocalityMatches` listbox pattern. Ambiguous candidates render in the combobox listbox (not a separate step/screen). Each row shows the state qualifier (`City, ST` / `County, ST` / `ST`), an area-type tag, and a "Stances" badge when `has_local_data` is true. No silent best-guess — the user always picks. Coordinate-lookup 422s (3 codes) and no-match/uncovered results render as an inline message row under the field.
- **D-09:** Full retirement, verified by grep. Delete `src/hooks/useGooglePlacesAutocomplete.js`; remove the Google Geocoder `classifyQuery` path from `src/lib/localitySearch.js`; drop the `.pac-container { display:none }` workaround CSS; uninstall `@googlemaps/js-api-loader`. End-of-phase acceptance: full-repo grep for `google`/`pac-container`/`window.google` returns zero hits outside deleted files.

### Claude's Discretion
- Exact classification regexes, debounce interval, min-char threshold (D-06).
- Whether `localitySearch.js` is refactored in place or deleted and replaced (D-09) — as long as no Google dependency survives and covered-city/county/state routing still works via the new resolver.
- Component name/location for the shared combobox, its internal WAI-ARIA implementation (roles, `aria-activedescendant`, keyboard handling), and how it supersedes `LocalityMatches`' document-level key-capture hack.
- Exact friendly copy for the Enter-hint (D-01), the 3 coordinate-error messages (D-08), and the no-match/uncovered message.
- How the coordinate path renders results on Results (`AddressSearchResult`-shaped payload with empty `matchedAddress` and no `browse_geo_id`) — dispatch mechanics are planner discretion.

### Deferred Ideas (OUT OF SCOPE)
- Type-filter Elected default, compass-lens icon buttons, "Search by name" results-filter removal — all **Phase 215** (SRCH-07, HDR-01/02/03).
- Live street-address autocomplete replacement — no provider in scope; explicitly accepted as a gap (D-01).
- Empty-state discovery panel on Results (recent/popular/covered hints) — rejected for now (D-04).

None of these expand the phase boundary.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-01 | Results header: single pre-filled, click-to-edit location field replacing Address/Browse toggle + LocationBrowser | See "Recommended Project Structure" + "Dispatch/Navigation Wiring" — `<LocationCombobox>` replaces lines ~1957-2103 of Results.jsx; `LocationBrowser.jsx` deleted (Results is its only consumer — confirmed below) |
| SRCH-02 | Accessible combobox typeahead (WAI-ARIA + full keyboard) suggesting covered-area/DB matches | See "Accessible Combobox Pattern" — `useListNavigation({virtual:true})` + `useRole('listbox')` blueprint |
| SRCH-03 | Auto-classify input (address/place/coordinate), dispatch with no manual mode switch | See "Input Classification Heuristic" — concrete regexes + decision tree |
| SRCH-04 | Ambiguous place names surface candidate list with state qualifier, user picks | See "Candidate Picker" pattern — reuses `LocalityMatches` row markup, backed by `/location-search` `{geo_id, mtfcc, label, state, has_local_data}` |
| SRCH-05 | Decimal-degree coordinate input resolves to a location profile | See "Coordinate Dispatch" — `POST /essentials/coordinate-lookup` wiring + `AddressSearchResult`-shaped render path |
| SRCH-06 | Same combobox powers Landing search bar | See "Landing Integration" — Landing's existing address input/LocalityMatches wiring is the direct swap target |
| SRCH-08 | Google Places fully removed, zero google/pac-container references (scoped grep) | See "Google Places Removal Surface" — enumerated file list + exact (scoped) acceptance grep commands |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@floating-ui/react` | 0.27.19 (installed — confirmed via `node_modules/@floating-ui/react/package.json`) [VERIFIED: local node_modules] | Combobox listbox positioning + accessible interaction hooks (`useFloating`, `useListNavigation`, `useRole`, `useDismiss`, `useInteractions`) | Already the project's sole positioning primitive (used in `InfoTooltip.jsx`, `SectionBanner.jsx`, `ElectionsView.jsx`, `IconOverlay.jsx`); UI-SPEC mandates it explicitly |
| React | 19.1.1 [VERIFIED: package.json] | Component runtime | Existing project version, unrelated to this phase |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new) | — | — | This phase needs no new runtime dependency — classification is plain regex, positioning is the already-installed `@floating-ui/react`, and both new endpoints are plain `fetch` via the existing `apiFetch`/`publicFetch` wrappers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@floating-ui/react`'s `useListNavigation({virtual:true})` for activedescendant management | Hand-rolled `aria-activedescendant` state + manual `document.addEventListener('keydown', ..., true)` (the current `LocalityMatches` approach) | Hand-rolled works but is the exact pattern D-09 says to retire (it exists only to beat Google's own listener); with Google gone there's no race to win, and floating-ui's hook is already a project dependency with zero cost to adopt |
| A dedicated combobox library (Downshift, react-aria, Headless UI Combobox) | None — build directly on `@floating-ui/react` primitives | Introducing a new combobox-specific library forks the "hand-rolled Tailwind + no component library" design system precedent noted explicitly in 214-UI-SPEC.md ("shadcn NOT initialized... this spec assumes no by default"). `@floating-ui/react` is positioning + interaction primitives, not a full component kit, so it doesn't violate that precedent the way Downshift/react-aria would |

**Installation:**
```bash
# No new install — @floating-ui/react is already a dependency.
# Uninstall step (D-09):
npm uninstall @googlemaps/js-api-loader
```

**Version verification:** `@floating-ui/react` is confirmed installed at 0.27.19 via direct `node_modules` read (not a registry query — this is an already-installed, already-used dependency, so no new package-legitimacy concern applies to it).

## Package Legitimacy Audit

No new packages are being installed by this phase — only an existing dependency (`@googlemaps/js-api-loader`) is being **removed**. Per the Package Legitimacy Gate protocol, the audit table below documents the one package touched (removal, not install) and confirms no new install candidates exist.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@googlemaps/js-api-loader` | npm | Long-established (Google-maintained, ^2.0.2 already in lockfile) | High (official Google package) | github.com/googlemaps/js-api-loader | N/A (removal, not install) | **REMOVE** (D-09) — no legitimacy concern, this is a planned uninstall of a legitimate but no-longer-wanted dependency |

**Packages removed due to slopcheck [SLOP] verdict:** none (no new installs this phase).
**Packages flagged as suspicious [SUS]:** none.

slopcheck was not run — not applicable, since this phase's only package-manager action is `npm uninstall`, not `npm install`. No new package enters `package.json`.

## Architecture Patterns

### System Architecture Diagram

```
User keystroke in <LocationCombobox> (Results header OR Landing search bar)
        │
        ▼
inputClassifier.js — classify(value) [pure client function, D-02]
        │
        ├─ looks like "lat, lng" decimal pair ──────────────► coordinate mode
        │                                                        │ (no live query;
        │                                                        │  Enter-hint shown)
        │                                                        ▼
        │                                              on Submit (Enter/Search click):
        │                                              POST /essentials/coordinate-lookup
        │                                              {lat,lng} → api.jsx lookupCoordinate()
        │                                                        │
        │                                                        ▼
        │                                          AddressSearchResult-shaped payload
        │                                          (empty matchedAddress, 422 taxonomy)
        │                                                        │
        │                                                        ▼
        │                                          Results renders officials; resting
        │                                          label = client-echoed "lat, lng" (D-05)
        │
        ├─ leading digits / street-number pattern ──────────► address mode
        │                                                        │ (no live query;
        │                                                        │  Enter-hint shown)
        │                                                        ▼
        │                                              on Submit: existing
        │                                              handleAddressSearch() → Census
        │                                              geocode (searchPoliticians/
        │                                              usePoliticianData) — UNCHANGED
        │
        └─ everything else (name-like) ─────────────────────► debounced live search
                                                                 │ (~250ms, ≥3 chars)
                                                                 ▼
                                                    GET /essentials/location-search?q=
                                                    → api.jsx searchLocationsByName()
                                                                 │
                                                                 ▼
                                          candidates [{geo_id, mtfcc, label, state,
                                                       has_local_data}]
                                                                 │
                                                                 ▼
                                          <LocationCombobox> listbox (role="listbox")
                                          renders LocalityMatches-style rows;
                                          useListNavigation manages aria-activedescendant
                                                                 │
                                                    user picks a row (click/Enter)
                                                                 │
                                                                 ▼
                                          coverageAreaToPath()-equivalent routing →
                                          navigate(/results?browse_geo_id=...&browse_mtfcc=...)
                                          (existing browseByArea/browseByGovernmentList
                                           dispatch — UNCHANGED downstream)
```

### Recommended Project Structure
```
src/
├── components/
│   ├── LocationCombobox.jsx     # NEW — shared component (Results header + Landing)
│   ├── LocalityMatches.jsx      # RETIRE — visual pattern lifted into LocationCombobox, file deleted
│   └── LocationBrowser.jsx      # DELETE (D-04/D-09) — state→county→city tree, no other consumers
├── lib/
│   ├── inputClassifier.js       # NEW — pure classify(value) -> 'address'|'coordinate'|'name'
│   ├── localitySearch.js        # REFACTOR — drop classifyQuery (Google), keep/adapt resolveLocalityRoute
│   ├── api.jsx                  # EXTEND — add searchLocationsByName(), lookupCoordinate()
│   └── coverage.js              # MINOR EDIT — stale comment referencing "Google address autocomplete" (line ~319) needs updating; searchCoverageAreas() itself is unaffected
├── hooks/
│   └── useGooglePlacesAutocomplete.js   # DELETE (D-09)
├── pages/
│   ├── Results.jsx               # EDIT — swap toggle+LocationBrowser+addressInput wiring for <LocationCombobox>
│   └── Landing.jsx               # EDIT — swap address input + LocalityMatches for <LocationCombobox>
└── index.css                     # EDIT — delete .pac-container/.pac-item* block (lines 60-102, 120-123)
```

### Pattern 1: Accessible Combobox with Virtual Listbox Navigation

**What:** A text `<input role="combobox">` paired with a `<ul role="listbox">` popup, where
`aria-activedescendant` (not real DOM focus) tracks the highlighted candidate. `@floating-ui/react`'s
`useListNavigation({ virtual: true })` manages this for you — it keeps real focus on the `<input>`
while arrow keys move a virtual pointer through the list.

**When to use:** Any typeahead where the input must stay focused while a listbox below it takes
keyboard navigation — exactly SRCH-02's requirement.

**Example (blueprint, following the InfoTooltip.jsx precedent + official useListNavigation API):**
```jsx
// Source: @floating-ui/react docs (useFloating, useListNavigation, useRole) +
// src/components/CampaignFinance/InfoTooltip.jsx (project's existing floating-ui idiom)
import { useState, useRef, useId } from 'react';
import {
  useFloating, useInteractions, useListNavigation, useRole, useDismiss,
  FloatingFocusManager, FloatingPortal, offset, flip, size, autoUpdate,
} from '@floating-ui/react';

export default function LocationCombobox({ value, onSubmit, /* ...props */ }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const listRef = useRef([]);
  const listboxId = useId();

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: 'bottom-start',
    middleware: [
      offset(4),
      flip({ padding: 8 }),
      // Match the floating listbox width to the input (SRCH-02 visual requirement).
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, { width: `${rects.reference.width}px` });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const role = useRole(context, { role: 'listbox' });
  const dismiss = useDismiss(context);
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    virtual: true,               // keeps DOM focus on the <input>
    onNavigate: setActiveIndex,
    loop: true,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } =
    useInteractions([role, dismiss, listNav]);

  return (
    <>
      <input
        ref={refs.setReference}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          activeIndex != null ? `location-option-${activeIndex}` : undefined
        }
        type="text"
        autoComplete="off"
        spellCheck={false}
        {...getReferenceProps()}
      />
      {isOpen && candidates.length > 0 && (
        <FloatingPortal>
          <ul
            ref={refs.setFloating}
            id={listboxId}
            role="listbox"
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {candidates.map((c, i) => (
              <li
                key={c.geo_id}
                id={`location-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                ref={(node) => { listRef.current[i] = node; }}
                {...getItemProps({ onClick: () => onSubmit(c) })}
              >
                {c.label}, {c.state} {c.has_local_data && <span>Stances</span>}
              </li>
            ))}
          </ul>
        </FloatingPortal>
      )}
    </>
  );
}
```

Notes on this blueprint:
- `virtual: true` is the load-bearing option — it is what supersedes `LocalityMatches`' manual
  `document.addEventListener('keydown', ..., true)` capture hack (D-09's stated rationale: that hack
  existed only to out-race Google's own Places listener on the same input; with Google gone, there is
  no competing listener, but *still* no reason to hand-roll keydown capture when floating-ui's
  `useListNavigation` does it correctly, including `Home`/`End`/loop semantics).
- `useRole(context, { role: 'listbox' })` sets the correct `role="listbox"` ARIA wiring pattern
  floating-ui expects for a combobox-listbox pairing.
- The `size()` middleware `apply` callback is the exact mechanism for "listbox matches input width" —
  confirmed via official Floating UI docs (`size` middleware resizes the floating element, commonly to
  match the reference's width).
- `FloatingFocusManager` is intentionally omitted here (unlike `InfoTooltip.jsx`, which uses a dialog)
  because a combobox listbox should NOT trap or move focus — the input keeps focus throughout, per the
  WAI-ARIA combobox pattern ("DOM focus remains on the textbox").

### Pattern 2: Client-Side Input Classification (D-02/D-06)

See "Input Classification Heuristic" section below for the concrete regex/threshold recommendation —
this is a pure function, testable with plain `vitest` (matches the project's existing `classify.test.js`
pattern), no component/DOM dependency required.

### Anti-Patterns to Avoid
- **Reintroducing a document-level keydown capture listener:** `LocalityMatches`' current pattern exists
  ONLY to beat Google's own Autocomplete listener (explicitly documented in its own comments). Once
  Google is removed, a new component should use `useListNavigation({ virtual: true })` instead —
  reintroducing manual capture-phase key handling would recreate exactly what D-09 says to retire.
- **Sending address-shaped or coordinate-shaped input to `/location-search`:** The milestone convention
  is explicit — "Never route bare place-name queries through the Census address geocoder" — the
  inverse also holds here: never route address/coordinate-shaped input through the place-name resolver.
  The classifier must gate the debounced call so it only fires for the "name-like" branch.
  Enforce this gate in `inputClassifier.js`'s return value; do not scatter shape checks across the
  component.
- **Re-fetching `location-search` on every keystroke without a debounce guard:** the existing
  `Landing.jsx` name-search debounce (`nameQuery` effect, lines 170-185) is the local precedent —
  300ms there; CONTEXT.md recommends ~250ms for this phase. Use the same `setTimeout`+`clearTimeout`
  ref pattern already established in that file, not a new debounce utility.
- **Applying `size()`'s width-matching without `box-sizing: border-box`** on the floating listbox — the
  official Floating UI docs flag this as a common gotcha; Tailwind's preflight already sets
  `border-box` globally in this codebase, so this is a non-issue here but worth a smoke-check.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Listbox positioning relative to a scrolling/resizing input | Manual `getBoundingClientRect()` + `position: absolute` math | `@floating-ui/react`'s `useFloating` + `autoUpdate` + `flip`/`size`/`offset` middleware | Already the project's positioning primitive; handles viewport-edge flipping, scroll/resize re-anchoring, and reference-width matching correctly — reinventing this is exactly the "hand-rolled offsets" the UI-SPEC explicitly says to avoid |
| Keyboard navigation + `aria-activedescendant` bookkeeping | A second document-level keydown listener (the pattern being retired) | `useListNavigation({ virtual: true })` | Handles Arrow Up/Down, Home/End, loop, and activedescendant id wiring correctly per the WAI-ARIA APG combobox pattern; hand-rolling risks missing Home/End or looping edge cases that D-09's retired code never had to handle either |
| Debounce timer management | A generic debounce npm package | The existing inline `setTimeout`/`clearTimeout` ref pattern already used in `Landing.jsx`'s `nameQuery` effect (lines 170-185) | Zero new dependency; matches established codebase idiom exactly |
| Decimal coordinate detection | A geo-parsing library | A simple regex (see Input Classification Heuristic below) | Decimal `lat, lng` is a narrow, well-defined format (per REQUIREMENTS.md's explicit "DMS deferred" scoping) — a library is disproportionate for one regex |

**Key insight:** Every piece of this phase's "hard" infrastructure (positioning, keyboard nav, debounce)
already has an established, working precedent somewhere in this exact codebase. The work is
integration and classification logic, not new infrastructure.

## Input Classification Heuristic (D-02/D-06 — Discretion)

Recommended pure-function classifier, `src/lib/inputClassifier.js`:

```js
// Source: derived from CONTEXT.md D-02 + REQUIREMENTS.md v2 scoping (DMS deferred = decimal-only)
const COORDINATE_RE = /^\s*-?\d{1,3}(?:\.\d+)?\s*,\s*-?\d{1,3}(?:\.\d+)?\s*$/;
// Leading digit (street number) OR a 5-digit ZIP-shaped token anywhere — both are
// "let the Census geocoder try it" per D-02 (ZIP is accepted as a weak signal per
// REQUIREMENTS.md's "ZIP as a primary/high-weight resolution signal" Out-of-Scope note —
// i.e. ZIPs flow through the EXISTING address path, they are not a resolver candidate).
const ADDRESS_LEADING_DIGIT_RE = /^\s*\d+\s+\S/;
const ZIP_RE = /\b\d{5}(-\d{4})?\b/;

export function classifyInput(raw) {
  const value = (raw || '').trim();
  if (!value) return { kind: 'empty' };
  if (COORDINATE_RE.test(value)) {
    const [lat, lng] = value.split(',').map((s) => Number(s.trim()));
    return { kind: 'coordinate', lat, lng };
  }
  if (ADDRESS_LEADING_DIGIT_RE.test(value) || ZIP_RE.test(value)) {
    return { kind: 'address' };
  }
  return { kind: 'name' };
}
```

**Edge cases considered:**
- `"123 Main St"` → leading digit → `address`. Correct (D-02).
- `"90210"` → no leading digit at position 0 relative to a street pattern, but `ZIP_RE` still
  matches → `address`. This routes ZIPs to the existing Census/`searchPoliticians` path, consistent
  with REQUIREMENTS.md's explicit note that ZIP is "accepted only as a weak signal, never the
  primary path" for the *resolver* — it does not forbid ZIP from the address geocoder, which already
  accepts ZIP-only queries today (confirmed: `searchPoliticians` → `/essentials/candidates/search`
  is the same endpoint Results already uses for freeform `q=` values including bare ZIPs).
- `"5th Ward"` → no leading digit at string start position 0? Actually `ADDRESS_LEADING_DIGIT_RE`
  requires the string to START with digits — `"5th Ward"` starts with `5` followed by `th` (not
  whitespace), so `\d+\s+\S` does NOT match (`5th` is one token, no space after the digits) → falls
  through to `name`. This is correct — "5th Ward" is a place-name-ish query, not a street address.
  **Caution:** a genuinely ambiguous case like `"5 Points"` (a real neighborhood name in several
  cities) WOULD match `ADDRESS_LEADING_DIGIT_RE` (digit, space, then a word) and get routed to the
  address path incorrectly. This is an accepted, documented tradeoff — flag as an Open Question below
  rather than over-engineering the regex against a name corpus that doesn't exist client-side.
- `"39.17, -86.52"` → matches `COORDINATE_RE` → `coordinate`. Correct.
- `"39.17 -86.52"` (no comma) → does NOT match `COORDINATE_RE` (comma required) → falls to `name`
  (no leading digit+space+non-space pattern either, since two numbers separated by space also fails
  `ADDRESS_LEADING_DIGIT_RE`'s digit-then-nonwhitespace requirement... actually verify: `"39.17 -86.52"`
  — first char sequence is `39.17` then space then `-86.52` which starts with `-`, a non-whitespace
  char, so `ADDRESS_LEADING_DIGIT_RE` (`^\s*\d+\s+\S`) DOES match (digits, then whitespace, then a
  non-whitespace `-`). This means space-separated coordinates without a comma get misclassified as
  `address` and silently fail the Census geocoder. **Recommendation:** either (a) accept this as a
  documented gap — the D-01/UI-SPEC copy explicitly says "decimal degrees" with a comma example
  (`39.17, -86.52`), training the user toward the comma format, or (b) add a secondary space-separated
  coordinate regex as a planner discretion enhancement. Flagged in Open Questions below.
- Debounce: **250ms**, min-chars: **3** (per D-06 discretion, matching the CONTEXT.md-suggested
  defaults; `Landing.jsx`'s existing name-search debounce uses 300ms/2-char as the closest local
  precedent — 250ms/3-char is a reasonable, cheap-to-tune constant, not a hard architectural choice).

## Two New api.jsx Client Functions

Following the exact conventions already established in `src/lib/api.jsx` (every function: `try/catch`,
`{ data, error }` or domain-specific return shape, `publicFetch` for anonymous endpoints since both 212
and 213 are explicitly anonymous/public per their CONTEXT.md — no auth required):

```js
// Source: pattern matches existing browseByArea/fetchBrowseAreas in src/lib/api.jsx (lines 318-345)

/** Ranked place-name candidates from the Phase 212 resolver.
 *  Response shape: [{ geo_id, mtfcc, label, state, has_local_data }] */
export async function searchLocationsByName(query) {
  try {
    const res = await publicFetch(`/essentials/location-search?q=${encodeURIComponent(query)}`);
    if (!res || !res.ok) return { data: [], error: `${res?.status ?? 'unknown'}` };
    const data = await res.json();
    return { data: Array.isArray(data) ? data : (data.candidates || []), error: null };
  } catch (err) {
    console.error('searchLocationsByName error:', err);
    return { data: [], error: err.message };
  }
}

/** Phase 213 anonymous coordinate lookup. Body: { lat, lng }.
 *  Response is AddressSearchResult-shaped (same as address search) with an
 *  empty matchedAddress (never echoes the coordinate — 213 D-06 privacy contract)
 *  and a distinct 422 taxonomy: OUTSIDE_US_BOUNDS / SWAPPED_COORDINATES / INVALID_COORDINATES. */
export async function lookupCoordinate(lat, lng) {
  try {
    const res = await publicFetch('/essentials/coordinate-lookup', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
    if (!res) return { data: [], error: null, code: null, formattedAddress: '' };
    if (res.status === 422) {
      let code = 'INVALID_COORDINATES';
      try {
        const errJson = await res.json();
        if (errJson?.code) code = errJson.code;
      } catch { /* fall through to default code */ }
      return { data: [], error: 'validation', code, formattedAddress: '' };
    }
    if (!res.ok) return { data: [], error: `${res.status}`, code: null, formattedAddress: '' };
    const data = await res.json();
    // Mirrors AddressSearchResult shape: { politicians, tribal_land?, ... } or a flat array —
    // confirm exact wrapper shape against the live 213 response during planning/execution
    // (see Open Questions — searchPoliticians already handles both shapes defensively).
    const politicians = Array.isArray(data) ? data : (data.politicians || []);
    return { data: politicians, error: null, code: null, formattedAddress: data.matchedAddress ?? '' };
  } catch (err) {
    console.error('lookupCoordinate error:', err);
    return { data: [], error: err.message, code: null, formattedAddress: '' };
  }
}
```

**Base URL / host:** Both functions use `publicFetch` (from `src/lib/auth.js`), which prepends
`API_BASE` (`${VITE_API_URL}/api` or `/api` in dev via the Vite proxy to
`https://accounts-api.empowered.vote`). So `publicFetch('/essentials/location-search?q=...')` resolves
to `.../api/essentials/location-search?q=...` — this must match the actual mounted route path from
Phase 212/213. Per 212-CONTEXT.md the route lands in `src/routes/essentialsBrowse.ts` as
`GET /essentials/location-search` (mounted under the `/api` prefix accounts-api already uses for all
essentials routes — confirmed consistent with every existing `api.jsx` function, e.g.
`/essentials/browse/by-area`). Per 213-CONTEXT.md and STATE.md's live-smoke note, the coordinate route
is confirmed live as `POST /api/essentials/coordinate-lookup` — i.e. `publicFetch('/essentials/coordinate-lookup', ...)` is the correct call. **Verify the exact `/location-search` mount path against the live accounts-api route file during planning** (212's own CONTEXT doesn't pin the final path with 100% certainty beyond "lands in `essentialsBrowse.ts`") — this is flagged as `[ASSUMED]` in the Assumptions Log.

**publicFetch vs apiFetch:** Use `publicFetch`, not `apiFetch` — both 212 and 213 are explicitly
anonymous/unauthenticated endpoints (213-CONTEXT.md D-01 "zero auth"; 212 is a public place-name
search). `apiFetch` redirects to login on a 401, which is wrong behavior for an anonymous combobox
typeahead that should never trigger an auth redirect just because a user isn't logged in.

**Error surfacing:** A 422 from `/coordinate-lookup` must be distinguished from a network/5xx error so
the combobox can render the correct one of the 3 specific coral error messages (D-08) rather than a
generic failure. The shape above threads `code` through for exactly that purpose.

## Dispatch/Navigation Wiring

Mapped precisely against the current Results.jsx/Landing.jsx code read during this research:

### Address path (unchanged)
- Results: `handleAddressSearch(addr)` (Results.jsx:969) already does everything needed — clears
  browse state, sets `searchMode('address')`, sets `?q=` in the URL. The combobox's "submit" handler
  for an `address`-classified value should call this function directly (already exists, already wired
  to `usePoliticianData`/`searchPoliticians`).
- Landing: `handleSearch()` (Landing.jsx:83) currently calls `resolveLocalityRoute(q)` first (Google
  Geocoder classification) — **this whole call is replaced** by the new client classifier: if
  `classifyInput(q).kind === 'address'`, navigate directly to `/results?q=${q}` (skip
  `resolveLocalityRoute` entirely for address-shaped input, since D-02 says addresses go straight to
  the existing address path with no resolver detour).

### Place-name path (new)
- Selecting a candidate row (`{geo_id, mtfcc, label, state, has_local_data}`) needs a route-building
  helper equivalent to `coverageAreaToPath()` in `src/lib/coverage.js`, but consuming the *live*
  resolver response shape rather than the static `COVERAGE_STATES` catalog shape. The existing
  `coverageAreaToPath` expects `area.browseGovernmentList`/`area.browseGeoId`/`area.browseState` fields
  that the 212 candidate shape does NOT carry (`geo_id`+`mtfcc` only). **Recommend**: build the browse
  URL directly from `{geo_id, mtfcc, label}` using the SAME query-param convention Results.jsx already
  reads (`browse_geo_id`, `browse_mtfcc`, `browse_label`, `from_locality=1` per the `browseAreaRoute`
  helper in `localitySearch.js` lines 79-88) rather than trying to force the resolver shape through
  `coverageAreaToPath`'s catalog-shaped branches. This keeps `browseByArea(geoId, mtfcc)` (already in
  `api.jsx`) as the actual data-fetch, unchanged.
- `has_local_data: false` (state/national-fallback-only match) still routes to the same
  `browse_geo_id`/`browse_mtfcc` URL — Results.jsx's existing `browseByArea` handler renders whatever
  the backend returns (national fallback floor per 212 D-01/D-02), no special no-data UI branch is
  needed in the combobox itself beyond the coverage badge.

### Coordinate path (new)
- On submit of a `coordinate`-classified value, call `lookupCoordinate(lat, lng)`.
- Success: the response is `AddressSearchResult`-shaped (per 213 D-04) — i.e. structurally close to
  what `searchPoliticians()`/`usePoliticianData` already produce for the address path. **Recommend**:
  do NOT try to route this through `usePoliticianData`'s existing `q=`-driven fetch hook (which expects
  to geocode via the backend's address-search endpoint) — instead, either (a) store the coordinate
  result in the same `cachedResult`/`browseResults`-style local state Results.jsx already uses for
  browse-mode data injection (see `browseResults`/`setBrowseResults` pattern, Results.jsx:396-397,
  which already supports "inject a politician list directly, bypass the address-search hook"), or (b)
  add a third `searchMode` value (e.g. `'coordinate'`) alongside `'address'`/`'browse'` that reuses the
  `browseResults`-style direct-injection list rendering path. Given `searchMode === 'browse'` already
  means "list injected directly, not via `usePoliticianData`" (Results.jsx:490-495), option (a) is
  simpler: reuse `browseResults`/`browseLoading` state for the coordinate case too, just skip setting
  `browse_geo_id`/`browse_mtfcc` in the URL (there is no geo_id for a raw coordinate) and instead
  synthesize the resting label from `${lat}, ${lng}` per D-05.
- Resting label after a coordinate resolve: `${lat}, ${lng}` as literally typed by the user (D-05) —
  must be captured in component state BEFORE the fetch fires (the request body), never derived from
  the response.
- 422 error: render the matching one of the 3 coral messages inline; do NOT navigate, do NOT clear the
  input (per the UI-SPEC's "Coordinate submitted" row: "field stays in edit state (no navigation, no
  results swap)").

### Landing integration
- Landing's coverage list (`COVERAGE_STATES`/`handleAreaClick`, lines 112-139) and its own routing
  (`browse_government_list`/`browse_geo_id`/`browse_state_officials` URL param construction) are
  **unchanged** — D-04 explicitly preserves this as the discovery/browse entry point. Only the address
  input + `LocalityMatches` + `useGooglePlacesAutocomplete` block (Landing.jsx lines 33-56, 279-314) is
  replaced by `<LocationCombobox>`.
- Landing's separate "Search candidates by name" input (lines 165-235, `nameQuery`/`searchPoliticiansByName`)
  is a DIFFERENT feature (searches politicians by their own name, not a location) — **not in scope**,
  do not conflate with the location combobox.

## Google Places Removal Surface

### Files confirmed via direct grep of `src/` for `google`/`pac-container`/`window.google` (case-insensitive)

| File | What's there | Action |
|------|--------------|--------|
| `src/pages/Results.jsx` | `import useGooglePlacesAutocomplete`; `useGooglePlacesAutocomplete(addressInputRef, {...})` call (lines 1007-1013) | Remove import + call; wire `<LocationCombobox>` instead |
| `src/pages/Landing.jsx` | `import useGooglePlacesAutocomplete`; hook call (lines 7, 50-56) | Remove import + call; wire `<LocationCombobox>` instead |
| `src/hooks/useGooglePlacesAutocomplete.js` | Entire file — `@googlemaps/js-api-loader` import, `Autocomplete` instantiation, `window.google.maps.event.clearInstanceListeners` cleanup | **DELETE** (D-09) |
| `src/lib/localitySearch.js` | `import { setOptions, importLibrary } from '@googlemaps/js-api-loader'`; `classifyQuery()` (Geocoder-based, lines 13, 35-71) | Remove the Google import + `classifyQuery`; **keep/adapt** `resolveLocalityRoute`'s candidate-lookup logic (lines 100-132) — see below |
| `src/components/LocalityMatches.jsx` | `.pac-container { display: none !important; }` inline `<style>` (line 63); document-level keydown capture comment explaining it exists "before Google's keydown listener" (lines 12-15, 51) | File's visual/row markup is **reused** inside `LocationCombobox`; the Google-specific styling + capture-hack comments are dropped. Whether the file itself is deleted or its JSX is inlined into the new component is planner discretion |
| `src/index.css` | `/* Google Places Autocomplete dropdown */` comment + full `.pac-container`/`.pac-item*`/`.pac-icon`/`.pac-matched`/`.pac-item-query` block (lines 60-102, 120-123) | **DELETE** entire block |
| `package.json` | `"@googlemaps/js-api-loader": "^2.0.2"` (line 21) | `npm uninstall @googlemaps/js-api-loader` (also updates `package-lock.json`) |

### False positives — DO NOT touch (confirmed by reading each hit in context)

| File | Hit | Why it's NOT in scope |
|------|-----|------------------------|
| `src/lib/buildingImages.js:663` | Comment: `"...and Google's "…, CO 80202, USA"."` | Documents an address-string-format historical note inside `parseStateFromAddress` (a regex-parsing helper for Census-formatted addresses); no functional Google dependency. Leave as-is (or optionally reword the comment — not required for the grep gate to pass since it's a false-positive the gate must be scoped to exclude, not a thing to delete) |
| `src/components/VoterResourcesCard.jsx` | `Google Civic Information API`, `www.google.com/maps/dir` (directions deep-link) | **Different feature entirely** — this is the Elections-tab voter/polling-location card, backed by `/api/essentials/voter-info` which wraps the Google Civic Information API on the backend. Completely unrelated to Places Autocomplete. Out of scope for this phase — do not remove |
| `src/lib/voterResourceLinks.js` | Comment referencing "the Google" (Civic API) fallback | Same feature as above — out of scope |
| `src/lib/coverage.js:319` | Comment: `"...Google address autocomplete owns that path..."` inside `searchCoverageAreas`'s docstring | Stale comment describing the OLD architecture (LocalityMatches deferring to Google for address-shaped queries). Should be **updated** as part of this phase for accuracy (the function's actual behavior — skip queries with a leading digit — doesn't change, but the comment's rationale does, since there's no more Google to "own" that path) |

### Recommended acceptance grep (scoped correctly — this is the critical gotcha)

The milestone convention says "zero hits outside deleted files" for `google`/`pac-container`/
`window.google`. A **naive** case-insensitive grep for the bare word `google` across the whole repo
WILL still match `VoterResourcesCard.jsx` and `voterResourceLinks.js` (Google Civic Information API —
an unrelated, in-scope-to-KEEP feature) and will false-fail the gate. The plan's verification step must
scope the grep to the Places-autocomplete-specific surface, e.g.:

```bash
# Scoped to Places-autocomplete surface only — excludes the unrelated Google Civic
# Information API (voter-info/polling-location feature, out of scope for this phase).
grep -rn "pac-container\|pac-item\|window\.google\|@googlemaps" src/ package.json
# Expect: zero hits (package.json line for @googlemaps/js-api-loader must be gone too)

# Confirm the dependency itself is gone:
grep -n "@googlemaps" package.json package-lock.json
# Expect: zero hits in package.json; package-lock.json should also be regenerated
# clean after `npm uninstall` (verify no stray @googlemaps/js-api-loader node in the lockfile)

# Separately confirm the two files that legitimately still say "google" are the
# UNRELATED Voter Info feature, not a missed Places reference:
grep -rln "google" src/ -i
# Expect exactly: src/components/VoterResourcesCard.jsx, src/lib/voterResourceLinks.js
# (Google Civic Information API — explicitly out of scope), plus src/lib/buildingImages.js
# (a comment, not a dependency) and src/lib/coverage.js (a stale comment to reword).
# Any OTHER file appearing here is a real regression.
```

### LocationBrowser.jsx consumer check

Confirmed via `grep` of `src/` for `LocationBrowser` — the ONLY import/usage is in
`src/pages/Results.jsx` (line 27 import, line 2061 JSX usage). No other page or component imports it.
Safe to delete entirely once Results.jsx's browse-mode UI is replaced by the combobox
(per D-04, its state→county→city tree is retired outright, not reincarnated).

## Common Pitfalls

### Pitfall 1: Blind grep-gate false-failure from the unrelated Google Civic Information API
**What goes wrong:** Running a bare `grep -ri google` at phase end reports "failures" in
`VoterResourcesCard.jsx`/`voterResourceLinks.js`, and an executor under pressure to hit "zero hits"
either incorrectly deletes/breaks the voter-info feature, or wastes time investigating a non-issue.
**Why it happens:** The word "google" appears in this codebase for TWO unrelated integrations (Maps
Places Autocomplete — being removed; Civic Information API — untouched, different feature, different
backend endpoint).
**How to avoid:** Use the scoped grep commands above (targeting `pac-container`/`window.google`/
`@googlemaps` specifically, not the bare word `google`) as the actual pass/fail gate; use the bare-word
grep only as a secondary sanity check with the two known-expected files documented.
**Warning signs:** Grep gate written as `grep -ri google src/` with no exclusions in the plan's
verification step.

### Pitfall 2: `useGooglePlacesAutocomplete`'s "read the ref, not React state" lesson gets lost
**What goes wrong:** Both `handleAddressSearch` (Results.jsx:975) and Landing's `handleSearch`
(Landing.jsx:89) have an explicit, commented workaround: read `addressInputRef.current?.value` instead
of the React `addressInput` state, because "Google Places Autocomplete writes to the input element and
not every write fires onChange." Once Google is removed, this specific reason evaporates — BUT if the
new `<LocationCombobox>` is uncontrolled in any part of its internals (e.g., a candidate-select handler
that writes to the DOM input directly for perceived-instant feedback before React re-renders), the same
class of stale-state bug could resurface for a different reason. A fully-controlled `<input value=...
onChange=...>` component (which is what the new component should be, since Google's direct-DOM-write
quirk is gone) sidesteps this entirely.
**How to avoid:** Make `<LocationCombobox>` a standard fully-controlled input (`value`/`onChange` only,
no imperative DOM writes) — now safe to do since the reason for the ref-reading workaround (Google's
direct DOM manipulation) no longer exists. Do not carry the `addressInputRef.current?.value ?? ...`
pattern forward into new code; it was a Google-specific workaround, not a general best practice.
**Warning signs:** New code still reading `ref.current.value` as a fallback for a fully-controlled input.

### Pitfall 3: `representing_city` banner hijack regression
**What goes wrong:** Results.jsx's `representingCity` derivation (line ~1148-1157, continues past the
read window) already has a specific guard: in browse mode, it prefers `browse_label` over deriving the
city from politician records, specifically because deriving from records can surface a neighboring
city's `representing_city` value when districts overlap. If the new combobox's place-name/coordinate
dispatch paths don't ALSO set the same `browse_label` URL param (or an equivalent explicit label the
banner logic can read), this same hijack bug can resurface for the new dispatch paths.
**Why it happens:** The guard is keyed specifically on `searchMode === 'browse'` + `browse_label` being
present — a new `searchMode` value (e.g. `'coordinate'`, per Dispatch Wiring above) that skips setting
`browse_label` would fall through to the "derive from politician records" branch and reintroduce the
exact bug this project has already fixed twice (per `project_representing_city_banner_hijack.md`).
**How to avoid:** Whatever dispatch path/searchMode the coordinate result uses, ensure the banner-city
derivation logic (`representingCity` useMemo) is extended to also check for it explicitly, OR set an
equivalent `browse_label`-style value even in coordinate mode (there's no city geo_id, but the combobox
still knows what the user typed — reuse that as the label-of-record for banner purposes, being careful
this is DIFFERENT from D-05's "never derive the resting-input-label from the server" rule — the banner
label and the input's resting label are two different UI surfaces).
**Warning signs:** A coordinate lookup near a jurisdiction boundary shows the WRONG city's banner.

### Pitfall 4: Debounce firing a request for address/coordinate-shaped text
**What goes wrong:** If the debounce timer is set up generically (fires for ANY input change) rather
than gated by the classifier's `kind === 'name'` check, typing a street address character-by-character
will fire a stream of `/location-search` requests for partial address fragments (e.g. "123 Ma" → "123
Mai" → "123 Main"), wasting resolver calls that will never produce a useful place-name match and
violating the milestone convention against feeding non-place-name text to place-name resolution paths.
**How to avoid:** Gate the debounce effect itself on `classifyInput(value).kind === 'name'` — do not
just gate the UI rendering of results; gate the network call.
**Warning signs:** Network tab shows `/location-search?q=123` style calls while typing a street address.

### Pitfall 5: `@floating-ui/react`'s `size()` middleware requires `box-sizing: border-box`
**What goes wrong:** If the floating listbox element doesn't have `border-box` sizing, the
width-matching `size()` middleware's computed width (which measures the reference/input's border-box
width) will be visually off by the padding/border amount, making the listbox slightly narrower or wider
than the input.
**How to avoid:** Tailwind's Preflight (`@import "tailwindcss"` in `index.css`) already sets
`box-sizing: border-box` globally — this is very likely a non-issue in this codebase, but worth a
one-line visual smoke-check once the listbox is built (per official Floating UI docs, which flag this
explicitly as a common gotcha).
**Warning signs:** Listbox border misaligned with input border by a few pixels.

## Code Examples

### WAI-ARIA combobox input attributes (per 214-UI-SPEC.md, cross-verified against W3C APG)
```jsx
// Source: W3C WAI-ARIA APG Combobox Pattern (https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
// + 214-UI-SPEC.md's explicit attribute contract
<input
  type="text"                          // never "search"/"tel" — keeps mobile keyboard alphabetic
  role="combobox"
  aria-expanded={isOpen}
  aria-controls={listboxId}
  aria-autocomplete="list"
  aria-activedescendant={activeId}     // set only while isOpen; omit/undefined when closed
  autoComplete="off"
  spellCheck={false}
  aria-label="Search by address, city, county, state, or decimal coordinates"
  placeholder="Address, city, or coordinates"
/>
```
Per the W3C APG pattern: "When a descendant of a listbox... popup is focused, DOM focus remains on the
combobox and the combobox has `aria-activedescendant` set to a value that refers to the focused element
within the popup" — this is exactly what `useListNavigation({ virtual: true })` automates.

### Debounced name-search gated by classifier (extends the existing Landing.jsx pattern)
```jsx
// Source: adapts src/pages/Landing.jsx lines 165-185 (existing nameQuery debounce pattern)
// + gates the network call on the D-02 classifier so address/coordinate input never
// reaches the place-name resolver.
const debounceRef = useRef(null);
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  const classified = classifyInput(value);
  if (classified.kind !== 'name' || value.trim().length < 3) {
    setCandidates([]);
    return;
  }
  debounceRef.current = setTimeout(async () => {
    const { data } = await searchLocationsByName(value.trim());
    setCandidates(data);
  }, 250);
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [value]);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|---------------|--------|
| Google Places Autocomplete (`@googlemaps/js-api-loader`) classifies + suggests addresses/places | Client regex classifier (D-02) + DB-truth `/location-search` (Phase 212) + `/coordinate-lookup` (Phase 213) | This phase (214) | No more per-keystroke Google API billing/dependency; place-name ranking now reflects this app's own curated+Gazetteer data (boosts seeded cities), not generic Google relevance |
| Document-level keydown capture to beat Google's own listener | `@floating-ui/react`'s `useListNavigation({virtual:true})` managing `aria-activedescendant` | This phase (214) | Removes a documented hack; standard, tested library behavior instead of a hand-rolled race condition workaround |
| Manual Address/Browse mode toggle (explicit user mode switch) | Silent input classification, single field | This phase (214) | Matches SRCH-03's "no manual mode switch" requirement; removes a whole branch of Results.jsx UI state (`searchMode`, mode-toggle buttons) — though `searchMode`-equivalent internal state likely still exists for data-fetch routing (browse vs. address vs. new coordinate case), just not exposed as a user-facing toggle |

**Deprecated/outdated:**
- `useGooglePlacesAutocomplete.js` hook — fully retired, no replacement needed (its job is split
  between the client classifier and the two new resolver endpoints).
- `localitySearch.js`'s `classifyQuery()` (Google Geocoder-based classification) — retired, replaced by
  `inputClassifier.js`'s pure regex classifier.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The exact mounted route path for Phase 212's endpoint is `GET /essentials/location-search` (i.e. resolves to `/api/essentials/location-search` via `publicFetch`) | Two New api.jsx Client Functions | If the actual live path differs (e.g. a different route prefix or an extra `/resolve` distinction for the "national floor" variant), `searchLocationsByName()` will 404. Low risk — 212-CONTEXT.md's canonical_refs explicitly names this route in `essentialsBrowse.ts`, and the roadmap's Phase 212 plan 05 confirms `GET /essentials/location-search` + `/resolve` were both shipped and smoke-tested; but the EXACT response wrapper shape (bare array vs. `{candidates: [...]}`) was not independently re-verified with a live curl in this research session — recommend a quick live curl check at plan/execute time |
| A2 | The response envelope for `/location-search` is either a bare array or has a `.candidates` key (handled defensively in the recommended `searchLocationsByName` code) | Two New api.jsx Client Functions | If it's wrapped in some OTHER key name, the defensive `Array.isArray(data) ? data : (data.candidates \|\| [])` fallback would silently return `[]` instead of erroring loudly — low-severity but could look like "no matches" when it's actually a shape mismatch. Recommend a live curl smoke-check as an early plan task |
| A3 | The `/coordinate-lookup` response wraps politicians the same way `searchPoliticians()`/`AddressSearchResult` does (`{politicians: [...], tribal_land?}` or a flat array) | Two New api.jsx Client Functions | 213-CONTEXT.md D-04 says it reuses the `AddressSearchResult` shape, which IS already confirmed (`essentialsService.ts:153`) to have no lat/lng fields — but the exact JSON key casing/wrapper for the HTTP response body (as opposed to the internal TS interface) wasn't independently re-curled in this session. STATE.md's phase-213 smoke-test note confirms `matchedAddress: ""` and correct officials list, giving reasonable confidence, but a live curl during 214 planning is cheap insurance |
| A4 | 250ms debounce / 3-char minimum are reasonable defaults | Input Classification Heuristic | CONTEXT.md explicitly marks these as planner discretion (D-06) with "~250ms"/"~3-char" as suggested-not-locked values — no risk beyond UX tuning; not a functional risk |

**If this table is empty:** N/A — see above; all four are read/UX-shape verification gaps, not
architectural risks. Every locked CONTEXT.md decision (D-01 through D-09) is treated as ground truth,
not re-litigated here.

## Open Questions

1. **`"5 Points"`-style digit-leading place names may misclassify as addresses**
   - What we know: the recommended `ADDRESS_LEADING_DIGIT_RE` (`^\s*\d+\s+\S`) correctly separates
     `"123 Main St"` (address) from `"5th Ward"` (name, since `5th` has no space after the digit) — but
     a genuine place name that happens to start with "digit + space + word" (e.g. "5 Points",
     "10 Cent Beer Night" as an event name — unlikely for this domain but "5 Corners" or similar
     hamlet names do exist) would be misrouted to the address path and silently fail geocoding.
   - What's unclear: how common such place names are among this app's actual search traffic; no
     analytics exist yet to quantify this.
   - Recommendation: accept as a documented, low-frequency edge case for v1 (the UI-SPEC's zero-match
     inline copy — "Check the spelling, or press Enter to search it as a street address" — already
     provides a soft recovery path for exactly this failure mode, since a misclassified name-as-address
     would fail the Census geocode and the user sees an error, at which point they'd need to retype
     without the leading number, or the planner could special-case very short leading-digit-plus-word
     inputs against a known-hamlet-name allowlist — likely overkill for v1).

2. **Space-separated coordinates without a comma (`"39.17 -86.52"`) currently misclassify as `address`**
   - What we know: the recommended `COORDINATE_RE` requires a comma separator; the UI-SPEC's own copy
     and error messages consistently show the comma format (`39.17, -86.52`), suggesting the product
     intentionally only supports comma-separated decimal pairs for v1.
   - What's unclear: whether real users will paste space-separated coordinates from other sources
     (e.g. some map tools copy `"lat lng"` without a comma) often enough to matter.
   - Recommendation: ship comma-only for v1 (matches UI-SPEC copy exactly); if telemetry later shows
     users frequently submit space-separated pairs that fail as addresses, add a secondary regex as a
     fast follow-up. Not worth over-engineering against unverified traffic patterns now.

3. **Exact shape of the coordinate-mode "searchMode" / render-state integration in Results.jsx**
   - What we know: CONTEXT.md D-08/D-05 and the UI-SPEC's "Coordinate submitted" row describe the
     REQUIRED behavior precisely (resting label = typed coords; no `browse_geo_id`; renders like an
     `AddressSearchResult`). The Dispatch/Navigation Wiring section above recommends reusing the
     `browseResults`/`browseLoading` direct-injection state rather than inventing a third fetch-hook
     path, since that's the closest existing precedent for "list injected directly, not derived from
     `usePoliticianData`'s address-geocode flow."
   - What's unclear: whether reusing `browseResults` (which today implies `searchMode === 'browse'`
     and therefore triggers the browse-mode elections-fetch branch, government-list URL params, etc.)
     cleanly composes with a coordinate result that has none of those browse-specific URL params — or
     whether a cleaner path is a genuinely separate `searchMode === 'coordinate'` value with its own
     small, parallel set of effects (skipping the browse-specific elections-by-area fetch in favor of,
     e.g., a coordinate-scoped elections-by-address-style call, if one exists, or simply omitting the
     elections tab data for coordinate results until a follow-up phase).
   - Recommendation: this is exactly the kind of design decision the plan's task breakdown should make
     explicit and testable (e.g., a dedicated Wave/task for "coordinate render path" with its own
     acceptance criteria), rather than something this research should pre-decide. Flagging as the
     single biggest genuine design decision left for the planner within an otherwise well-constrained
     phase.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `@floating-ui/react` | Combobox listbox positioning + interaction hooks | ✓ | 0.27.19 (confirmed in `node_modules`) | — |
| `GET /essentials/location-search` (accounts-api, live) | Place-name candidate search | ✓ (per STATE.md: Phase 212 marked Complete 2026-07-21, live-smoke-tested) | — | — |
| `POST /essentials/coordinate-lookup` (accounts-api, live) | Coordinate → officials lookup | ✓ (per STATE.md: live SMOKE_OK on accounts-api.empowered.vote, confirmed 2026-07-21) | — | — |
| Node/npm (for `npm uninstall @googlemaps/js-api-loader`) | Dependency removal | ✓ (existing project tooling) | — | — |

**Missing dependencies with no fallback:** none — both backend endpoints are confirmed live per
STATE.md's Phase 212/213 completion notes; this phase can proceed without blocking on backend work.

**Missing dependencies with fallback:** none applicable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 (already a devDependency; `npm test` → `vitest run`) [VERIFIED: package.json] |
| Config file | none — no `vitest.config.*` found; Vitest runs with defaults via the `vite.config.js`/CLI defaults. Existing tests (`classify.test.js`, `compass.test.js`, `groupHierarchy.test.js`, etc.) are all pure-function unit tests with no DOM/jsdom dependency |
| Quick run command | `npx vitest run src/lib/inputClassifier.test.js` |
| Full suite command | `npm test` (runs all `*.test.js` under `src/`) |

**Gap:** no `@testing-library/react` or `jsdom` environment is currently configured — every existing
test targets a pure function, not a rendered component. This phase's core LOGIC (the classifier, the
new `api.jsx` functions with mocked `fetch`) fits this exact existing pattern and needs NO new test
infrastructure. Full component-level rendering/interaction tests for `<LocationCombobox>` (e.g.
simulating arrow-key navigation) would require adding `jsdom` + `@testing-library/react` as new
devDependencies — recommend scoping automated tests to the classifier + API functions (matches
existing project test depth) and covering the component's keyboard/ARIA behavior via the phase's
manual/live browser verification step instead, consistent with how this codebase has tested UI so far
(no existing component test precedent to extend).

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-03 | `classifyInput()` correctly buckets address/coordinate/name inputs (incl. documented edge cases) | unit | `npx vitest run src/lib/inputClassifier.test.js` | ❌ Wave 0 |
| SRCH-05 | `lookupCoordinate()` parses success + all 3 distinct 422 codes correctly (mocked `fetch`) | unit | `npx vitest run src/lib/api.test.js` | ❌ Wave 0 |
| SRCH-04 | `searchLocationsByName()` returns candidates array regardless of bare-array vs. wrapped-object response shape | unit | `npx vitest run src/lib/api.test.js` | ❌ Wave 0 |
| SRCH-02 | Combobox ARIA attributes (`role`, `aria-expanded`, `aria-activedescendant`) present and keyboard nav works | manual-only | — (no component-test infra exists in this repo; live browser + screen-reader spot-check) | N/A — manual |
| SRCH-01, SRCH-06 | Same component renders correctly in both Results header and Landing search bar | manual-only | — (live browser check on both pages) | N/A — manual |
| SRCH-08 | Zero `pac-container`/`window.google`/`@googlemaps` hits outside deleted files | automated (shell, not vitest) | `grep -rn "pac-container\|window\.google\|@googlemaps" src/ package.json` (expect empty) | ✅ shell-only, no new file needed |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/inputClassifier.test.js src/lib/api.test.js` (fast, no
  DOM, matches existing project test speed)
- **Per wave merge:** `npm test` (full suite) + the scoped grep-gate command above
- **Phase gate:** Full suite green + grep-gate empty + live manual combobox keyboard/screen-reader
  check on both Results and Landing before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/inputClassifier.test.js` — covers SRCH-03 (classification correctness + documented edge
      cases from Open Questions 1/2)
- [ ] `src/lib/api.test.js` (or extend an existing api-focused test file if one is added elsewhere) —
      covers SRCH-04/SRCH-05 (`searchLocationsByName`/`lookupCoordinate` response-shape handling +
      422-code mapping), using mocked `global.fetch` the same way Vitest projects typically stub fetch
      (no existing `api.jsx` test file to extend — this would be a new file, matching the granularity
      of existing `*.test.js` files like `treasury.test.js`/`bannerProps.test.js`)
- [ ] Framework install: none needed — Vitest is already configured and running

*(Component-level ARIA/keyboard-interaction automated testing is NOT a gap relative to this project's
existing test depth — no prior phase has automated component rendering tests, so introducing that
infrastructure here would be disproportionate scope creep. Manual verification is the consistent,
established bar for UI behavior in this codebase.)*

## Security Domain

> `security_enforcement` is absent from `.planning/config.json` → treated as enabled per protocol.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-------------------|
| V2 Authentication | No | Both new endpoints (212/213) are explicitly anonymous/public by design — no auth control applies to the combobox's network calls |
| V3 Session Management | No | No session state introduced by this phase |
| V4 Access Control | No | Public read-only endpoints; no access-control surface added |
| V5 Input Validation | Yes | The client classifier is a UX convenience, NOT a security boundary — actual validation (coordinate bounds, swap-guard, 422 taxonomy) is enforced server-side by Phase 213 (already shipped, per its D-02/D-03/D-07). The frontend must not assume client-side classification is sufficient validation; it always calls the real endpoint and handles the real 422 response, never short-circuits based on client-side "looks valid" logic alone |
| V6 Cryptography | No | No cryptographic operations in this phase |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|----------------------|
| Reflected XSS via unescaped candidate labels (`label`, `state` from `/location-search`) rendered into JSX | Tampering/Information Disclosure | React's default JSX text-node escaping already mitigates this (no `dangerouslySetInnerHTML` anywhere in the recommended component) — explicitly avoid introducing raw HTML rendering for candidate rows |
| Coordinate value leaking into analytics/logs client-side (mirrors the 213 backend's own "no coordinate leak" contract) | Information Disclosure | The 213 backend already guarantees no server-side coordinate echo/logging (D-06/D-08); the FRONTEND must independently honor the same spirit — do not `posthog?.capture()` the raw lat/lng in any new PostHog event for the coordinate path (existing `essentials_address_searched`/`essentials_locality_searched` events capture labels/method, not raw coordinates — follow that precedent, capture method/outcome only, never the raw `{lat,lng}` pair) |
| Open redirect via a maliciously-crafted `label`/`geo_id` driving `navigate()` to an attacker-controlled URL | Spoofing | The recommended dispatch only ever builds INTERNAL `/results?...` paths from `geo_id`/`mtfcc` (both simple identifiers, never full URLs) via `URLSearchParams` — no attacker-controlled string is ever passed directly to `navigate()` as a full URL. Maintain this pattern; never do `navigate(candidate.someUrlField)` |

## Sources

### Primary (HIGH confidence)
- Direct codebase reads (this session): `src/pages/Results.jsx`, `src/pages/Landing.jsx`,
  `src/components/LocalityMatches.jsx`, `src/components/LocationBrowser.jsx`,
  `src/lib/localitySearch.js`, `src/hooks/useGooglePlacesAutocomplete.js`, `src/lib/api.jsx`,
  `src/lib/auth.js`, `src/lib/coverage.js`, `src/index.css`, `src/components/CampaignFinance/InfoTooltip.jsx`,
  `package.json`, `node_modules/@floating-ui/react/package.json`, `vite.config.js`
- `.planning/phases/212-backend-place-name-resolver-national-fallback/212-CONTEXT.md` — candidate shape,
  ranking, coverage signal contract
- `.planning/phases/213-anonymous-coordinate-lookup-endpoint/213-CONTEXT.md` — request/response contract,
  422 taxonomy, privacy guarantees
- `.planning/STATE.md` — live smoke-test confirmation for both 212 and 213
- [Combobox Pattern | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — ARIA
  combobox semantics, `aria-activedescendant` focus-management model
- [size | Floating UI](https://floating-ui.com/docs/size) — width-matching middleware behavior +
  `box-sizing: border-box` gotcha

### Secondary (MEDIUM confidence)
- WebFetch of `floating-ui.com/docs/react-examples` and `floating-ui.com/docs/uselistnavigation` —
  `useListNavigation({virtual:true})` API shape for combobox `aria-activedescendant` management
  (summarized by an intermediate fetch-and-extract model, not read verbatim from the raw docs page;
  cross-checked against the WebSearch results and the already-installed package version's documented
  public API surface, which is consistent)

### Tertiary (LOW confidence)
- None — all findings in this research trace to either direct file reads, the two upstream phase
  CONTEXT.md files, or official Floating UI / W3C documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@floating-ui/react` is already installed and used 4x in this exact codebase;
  no new dependency choice to justify
- Architecture: HIGH — every wiring point (dispatch, URL params, existing hooks) was read directly from
  the current source, not inferred from documentation
- Pitfalls: HIGH — all 5 pitfalls trace to either a documented in-code comment (Google ref-reading
  workaround, keydown-capture rationale) or a named prior-incident memory file
  (`project_representing_city_banner_hijack.md`)

**Research date:** 2026-07-21
**Valid until:** 30 days (stable stack; the only fast-moving element — the exact live response shape of
`/location-search`/`/coordinate-lookup` — is already shipped/smoke-tested per STATE.md, so it should not
drift during the planning/execution window)
