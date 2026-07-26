# Phase 215: Header Declutter — Elected Default, Compass Icons, Search-by-Name Removal - Research

**Researched:** 2026-07-21
**Domain:** React frontend UI refactor (no backend/API changes) — filter-state architecture + accessible icon-button/tooltip pattern
**Confidence:** HIGH

## Summary

This phase is a pure frontend refactor confined to `src/pages/Results.jsx` and three of its child
components (`FilterBar.jsx`, `CompassControlsBar.jsx`, `LensChipRow.jsx`). No new npm packages, no
backend calls, no schema changes. The codebase already contains every primitive this phase needs:
`@floating-ui/react` (already a dependency, already used for an in-repo accessible-tooltip pattern in
`src/components/IconOverlay.jsx`) and a `TAB_TYPE_DEFAULTS`-shaped constant slot already established
by precedent in `src/lib/classify.js` (`FEDERAL_ORDER`, `STATE_ORDER`, `JUDGE_DISTRICT_TYPES`, etc.).

The single most important architectural finding: `appointedFilter` in `Results.jsx` today is **one
global `useState`** applied identically to all three tab hierarchies (`filteredHierarchy`,
`educatorsFilteredHierarchy`, `judgesFilteredHierarchy`) via a shared `applyAppointedFilter(hier,
appointedFilter)` call. Because the dropdown is being removed entirely (CONTEXT.md D-04) and no
per-tab override affordance survives (D-06), there is **no remaining reason for `appointedFilter` to
be stateful at all**. The correct fix is to delete the shared state and instead apply a **fixed,
per-bucket constant** to each of the three hierarchies independently — `'Elected'` to
representatives, `'Elected'` to educators, `'Appointed'` to judges — regardless of which tab is
currently active. This is what actually satisfies HDR-02 (the Judges tab is never affected by
whichever filter would otherwise apply to the active tab, because there is no longer a shared value to
leak between tabs). This closes the "Claude's Discretion" question CONTEXT.md left open about
reconciling the cached `appointedFilter` value — the answer is: the cache key goes away, because the
filter is no longer a user preference.

A second important finding corrects a stale assumption in CONTEXT.md's Integration Points: it states
filter controls render in "three surfaces — `FilterBar.jsx`, `LocalFilterSidebar.jsx`,
`ResultsHeader.jsx`." Direct inspection of the current codebase shows this is **no longer true**:
`LocalFilterSidebar.jsx` is imported into `Results.jsx` but **never rendered** in any JSX branch (dead
import), and `ResultsHeader.jsx` is **not imported anywhere in `src/`** (fully orphaned component). Both
files still contain the "All types" dropdown and "Search by name" input as dead code, but neither can
appear in the live UI today. See "Architecture Patterns → Dead Surfaces" below for the precise
disposition recommendation.

Third, the compass-lens icon-only conversion has one concrete, code-level interaction hazard: the
existing lens button already has manual `onMouseEnter`/`onMouseLeave` handlers (for the "Calibrate this
lens?" hover-reveal prompt) and **no `aria-label`** — its accessible name today comes entirely from the
visible `<span>{lens.name}</span>` text node. Hiding that span for icon-only desktop mode without adding
an explicit `aria-label` would leave the button with **no accessible name at all**. Additionally,
naively spreading `@floating-ui/react`'s `getReferenceProps()` onto the button either before or after
the existing manual `onMouseEnter`/`onMouseLeave` JSX attributes will **silently break one of the two
hover behaviors** (later JSX prop wins; a bare spread doesn't merge handlers) — the correct call is
`getReferenceProps({ onMouseEnter: ..., onMouseLeave: ... })`, which floating-ui documents as its
supported merge point for custom listeners.

**Primary recommendation:** Delete `appointedFilter` state; apply the constant filter map from
`classify.js` per-bucket at the three `applyAppointedFilter(...)` call sites. Delete the dropdown +
search UI from `FilterBar.jsx` (and decide the disposition of the two dead-code surfaces). Build the
lens tooltip by extracting/adapting the already-proven `IconWithTooltip` pattern from
`IconOverlay.jsx`, merging its interaction handlers into (not replacing) `LensChipRow`'s existing hover
state via `getReferenceProps({ onMouseEnter, onMouseLeave })`, and add `aria-label={lens.name}` to every
lens button (mobile included, for robustness).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Elected/Appointed default-per-tab filtering | Frontend Server / Client (SPA) | — | Pure client-side derived filtering of an already-fetched list (`src/pages/Results.jsx`); no backend involvement — the API already returns `is_elected`/`is_appointed`/`faces_retention_vote` fields, resolution happens entirely in `resolveIsAppointed`/`matchesAppointedFilter` |
| Compass lens icon buttons + tooltip | Browser / Client | — | Pure presentational component state (`LensChipRow.jsx`); tooltip positioning is a client-only concern (`@floating-ui/react`) |
| Search-by-name removal | Browser / Client | — | Client-side `Array.filter` over already-fetched `list`; removing the UI control removes the entire feature, no server contract involved |
| Tab routing / bucket classification (`classifyBucket`) | Browser / Client | — | Already-existing pure function in `src/lib/classify.js`, unchanged by this phase except a new sibling constant |

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Compass Lens Display (HDR-03)**
- D-01: Desktop = icon-only lens buttons (reclaim header space); mobile = keep icon + text label (mobile is a cramped horizontal scroll strip; a tap already selects a lens, so tap-to-reveal tooltips would conflict).
- D-02: Tooltip affordance must be keyboard-focus- and hover-accessible on desktop with an `aria-label` on every button — NOT the native `title` attribute (fails keyboard/touch; current mechanism in `LensChipRow`). Judicial lens uses the existing gavel icon.
- D-03: Partially honors prior VA compass feedback (wanted tooltips + larger labels): tooltips added, labels survive on mobile; desktop trades visible labels for the decluttered icon-only row.

**Officials Type Filter (HDR-01 / HDR-02)**
- D-04: Remove the All/Appointed type dropdown entirely from every surface it appears on (`FilterBar.jsx`, `LocalFilterSidebar.jsx`, `ResultsHeader.jsx`).
- D-05: Per-tab default matrix: Representatives = Elected, Educators = Elected, Judges = Appointed. The Judges override is what keeps HDR-01's Elected default from emptying the Judges tab.
- D-06: Accepted trade-off: with the dropdown gone, appointed non-judge officials become unreachable on the Reps/Educators tabs. Intended per the "honest default" goal; appointed officials remain visible on the Judges tab.

**Search-by-Name (SRCH-07)**
- D-07: Remove the in-list "Search by name" box entirely — do not relocate the capability. Redundant now that the Phase-214 LocationCombobox handles finding places and per-location result lists are short enough to scan.

**Verification**
- D-08: Prove the Judges tab is not silently emptied by the Elected default at Bloomington, IN — a location with real geo-linked judges (CA judicial districts have NULL geo_id and would empty the Judges tab, so CA is not a valid test location). Research confirms Bloomington, IN was already the human-verify location for the prior Phase 210 Judges-tab work for this exact reason (`.planning/STATE.md` line 809), corroborating this is a real, populated test fixture, not a hypothetical.

### Claude's Discretion
- Exact tooltip implementation (custom lightweight component vs an ev-ui primitive) — as long as it satisfies D-02 (focus + hover + `aria-label`). **Research finding: ev-ui 0.9.9 exports no Tooltip primitive** (checked `Object.keys` of the installed package) — build custom, reusing the in-repo `@floating-ui/react` pattern (see Code Examples).
- How the new tab-aware Elected default reconciles with the cached `appointedFilter` value (`Results.jsx:505`) — **research recommendation: delete the cache key entirely**; see Summary and Architecture Patterns.

### Deferred Ideas (OUT OF SCOPE)
- Compass on/off toggle restyle — the FilterBar Compass toggle is a header element but outside this phase's four requirements; any restyle is its own future work.
- Three Phase-214 search/combobox-domain todos reviewed but not folded (LocationCombobox non-blocking refinements, combobox row color-coding, Phase-212 gazetteer data audit).

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SRCH-07 | The "Search by name" results-filter box is removed | `FilterBar.jsx:107-125` is the only *live* instance; `LocalFilterSidebar.jsx:90-115` and `ResultsHeader.jsx:9-35` contain dead-code copies that are never rendered (see Architecture Patterns → Dead Surfaces) |
| HDR-01 | The officials type filter defaults to Elected and the All/Appointed dropdown is removed | `FilterBar.jsx:11-15,17-60,89-96` (Dropdown + TYPE_OPTIONS) is the live dropdown; `Results.jsx:503-506` holds the stateful default today |
| HDR-02 | The Judges tab still shows appointed officials (per-tab override so the Elected default does not empty it) | `Results.jsx:1530-1541` (three `applyAppointedFilter` calls) currently share one filter value — must diverge per bucket; `matchesAppointedFilter`/`resolveIsAppointed` (`Results.jsx:1096-1114`) already correctly implement the elected/appointed resolution logic and need zero changes |
| HDR-03 | Compass lens controls collapse to icon buttons with accessible tooltips (gavel icon for Judicial), reclaiming the header's empty space | `LensChipRow.jsx` — `renderLensIcon()` already has the gavel icon for `key === 'judicial'`; the button JSX (`LensChipRow.jsx:139-157`) needs the icon-only/tooltip/aria-label work |

## Standard Stack

### Core
No new packages. This phase uses only what's already installed:

| Library | Version (installed) | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@floating-ui/react` | 0.27.19 (`package.json` dependencies) | Accessible, positioned tooltip (hover + focus + dismiss + `role="tooltip"`) | Already the project's chosen solution for exactly this problem — see `src/components/IconOverlay.jsx`'s `IconWithTooltip` and `src/components/CampaignFinance/InfoTooltip.jsx`. No reason to hand-roll a second implementation. |
| `@empoweredvote/ev-ui` | 0.9.9 | `useMediaQuery` (existing desktop/mobile breakpoint hook, already threaded through `Results.jsx` → `CompassControlsBar` → `LensChipRow` as `isDesktop`) | Already the project's breakpoint primitive; `(min-width: 769px)` is the established desktop threshold used consistently across `Results.jsx` and `FilterBar.jsx`. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@floating-ui/react`'s `useHover`/`useFocus`/`useDismiss`/`useRole` composition | Native `title` attribute | Explicitly rejected by CONTEXT.md D-02 — `title` is unreliable across assistive technologies and unusable via keyboard-only/touch. Confirmed against current W3C ARIA APG guidance (see Sources). |
| Custom tooltip component | A design-system Tooltip package (e.g. Radix `@radix-ui/react-tooltip`) | Not installed, would be a new dependency for a problem the codebase has already solved twice in-repo with `@floating-ui/react`. No justification to add a new package. |

**Installation:** None required — no `npm install` needed for this phase.

## Package Legitimacy Audit

**N/A — this phase introduces zero new npm packages.** `@floating-ui/react` is already installed
(`package.json` confirms `"@floating-ui/react": "^0.27.19"` under `dependencies`, already used in three
existing components). No package-legitimacy check applies.

## Architecture Patterns

### System Architecture Diagram

```
                     Results.jsx (page)
                            |
   ,------------------------+------------------------.
   |                        |                         |
appointedFilter        FilterBar.jsx            CompassControlsBar.jsx
(DELETE — becomes      (Compass toggle          (renders LensChipRow)
 TAB_TYPE_DEFAULTS      only, after this
 constants applied      phase's edit)                  |
 per-bucket below)                                      v
   |                                              LensChipRow.jsx
   v                                             (icon-only on desktop +
hierarchy (Representatives)  --> applyAppointedFilter(hier, 'Elected')  --> filteredHierarchy
educatorsHierarchy           --> applyAppointedFilter(hier, 'Elected')  --> educatorsFilteredHierarchy
judgesHierarchy              --> applyAppointedFilter(hier, 'Appointed')--> judgesFilteredHierarchy
                                                                                  |
                                                                      renderPeopleTab(hier, ..., viewName)
                                                                       (byte-identical render pipeline;
                                                                        only hier + viewName vary — this
                                                                        function ALREADY receives viewName,
                                                                        so empty-state text just needs to
                                                                        read TAB_TYPE_DEFAULTS[viewName]
                                                                        instead of the deleted shared var)
```

The key data-flow correction this phase makes: today all three `hierarchy → filteredHierarchy` arrows
are driven by **the same** `appointedFilter` value (whichever the user last picked). After this phase,
each arrow is driven by **its own fixed constant**, independent of which tab is active or was
previously selected — eliminating any possibility of tab-to-tab "leakage" of a type-filter selection
that no longer exists.

### Dead Surfaces (correction to CONTEXT.md's Integration Points)

CONTEXT.md states filter controls render in "three surfaces." Direct source inspection shows this is
stale:

| File | Status | Evidence |
|------|--------|----------|
| `src/components/FilterBar.jsx` | **LIVE** — rendered once, at `Results.jsx:2069` | Only live instance of the dropdown + search box |
| `src/components/LocalFilterSidebar.jsx` | **DEAD** — imported at `Results.jsx:11` but never referenced again in the file (no `<LocalFilterSidebar` JSX anywhere) | `grep -n "LocalFilterSidebar" src/pages/Results.jsx` returns only the import line |
| `src/components/ResultsHeader.jsx` | **FULLY ORPHANED** — not imported by any file in `src/` | `grep -rn "ResultsHeader" src/` returns only its own `export default function` declaration |
| `src/components/SegmentedControl.jsx` | **DEAD (transitively)** — used only inside the dead `LocalFilterSidebar.jsx`, plus one unused import in `Results.jsx:13` | Confirmed via repo-wide grep |

**Recommendation for the planner:** because neither dead file is reachable from any route, the literal
SRCH-07/HDR-01/HDR-02 acceptance criteria ("no longer appears anywhere in the UI") are already
technically satisfied for these two files. However, leaving live-looking dropdown/search JSX in two
component files whose *only* purpose was to hold this exact removed feature is a regression trap (a
future `<LocalFilterSidebar />` mount would silently reintroduce the removed controls). Two viable
dispositions — planner should pick one and make it an explicit task, not skip it silently:
1. **Delete both files** (`LocalFilterSidebar.jsx`, `ResultsHeader.jsx`) plus their dead imports in
   `Results.jsx` (lines 11, 13) — cleanest, matches the "declutter" spirit of the phase.
2. **Leave the files but strip the dropdown+search JSX from each** — smaller diff, but leaves two
   still-imported-nowhere components with reduced purpose; less clean.
Given neither file has any other consumer or historical significance noted in `STATE.md`, deletion
(Option 1) is the lower-risk, lower-maintenance choice.

### Pattern 1: Per-bucket constant type filter (replaces shared `appointedFilter` state)

**What:** A named constant map co-located with the other tab-classification constants in
`src/lib/classify.js`, applied independently to each of the three already-computed hierarchies.
**When to use:** Whenever a filter default varies by a discrete, small, closed set of tabs/views and
there is no remaining user-facing override control.
**Example:**
```javascript
// src/lib/classify.js — alongside FEDERAL_ORDER / STATE_ORDER / JUDGE_DISTRICT_TYPES
// HDR-02: per-tab type-filter default. Judges intentionally diverges from
// Representatives/Educators — appointed judges must never be hidden by the
// Elected-by-default policy that applies everywhere else (D-05).
export const TAB_TYPE_DEFAULTS = {
  representatives: 'Elected',
  educators: 'Elected',
  judges: 'Appointed',
};
```
```javascript
// src/pages/Results.jsx — replaces the single shared `appointedFilter` state
// and its three identical applyAppointedFilter(hier, appointedFilter) calls.
import { TAB_TYPE_DEFAULTS } from '../lib/classify';

const filteredHierarchy = useMemo(
  () => applyAppointedFilter(hierarchy, TAB_TYPE_DEFAULTS.representatives),
  [hierarchy]
);
const educatorsFilteredHierarchy = useMemo(
  () => applyAppointedFilter(educatorsHierarchy, TAB_TYPE_DEFAULTS.educators),
  [educatorsHierarchy]
);
const judgesFilteredHierarchy = useMemo(
  () => applyAppointedFilter(judgesHierarchy, TAB_TYPE_DEFAULTS.judges),
  [judgesHierarchy]
);
```
`applyAppointedFilter` and `matchesAppointedFilter`/`resolveIsAppointed` (`Results.jsx:1096-1114,
1513-1528`) require **zero logic changes** — they already accept an arbitrary filter string; only the
call sites change from "shared state variable" to "per-bucket constant."

### Pattern 2: Empty-state text keyed on `viewName`, not the deleted shared variable

`renderPeopleTab(hier, fallbackListLength, viewName)` (`Results.jsx:2089`) is called three times, once
per tab, and **already receives `viewName`** (`'representatives' | 'educators' | 'judges'`). The two
empty-state strings that currently read the shared `appointedFilter` variable (`Results.jsx:2129-2131`
and `2234-2238`) should instead read `TAB_TYPE_DEFAULTS[viewName]`:
```javascript
// Results.jsx:2129 (inside renderPeopleTab, has `viewName` in scope)
const emptyMessage = `No ${TAB_TYPE_DEFAULTS[viewName].toLowerCase()} officials found at the ${tier.toLowerCase()} level.`;
// NOTE: since the dropdown is gone there is no more 'All' branch to guard against —
// the ternary that checked `appointedFilter !== 'All'` can be deleted outright.
```
```javascript
// Results.jsx:2234 (same function)
{fallbackListLength > 0 && hier.length === 0 && (
  <p ...>No {TAB_TYPE_DEFAULTS[viewName].toLowerCase()} officials found for this area.</p>
)}
// The `appointedFilter !== 'All'` guard is deleted along with the dropdown — a
// per-tab filter is now ALWAYS active, so this branch is unconditional on hier.length === 0.
```

### Pattern 3: Icon-only responsive lens button with accessible tooltip (in-repo precedent)

**What:** Icon trigger + `aria-label` + hover/focus-only floating tooltip, positioned via
`@floating-ui/react`, rendered through a portal.
**When to use:** Any icon-only control needing a discoverable name/description without a visible label.
**Example — the exact in-repo pattern to adapt** (`src/components/IconOverlay.jsx:22-81`,
`IconWithTooltip`):
```jsx
// Source: src/components/IconOverlay.jsx (already shipped, already accessible)
function IconWithTooltip({ IconComponent, color, tooltip, size = 14, onClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [offset(8), flip(), shift({ padding: 4 })],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context);
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <>
      <span ref={refs.setReference} aria-label={tooltip} tabIndex={0} {...getReferenceProps()}>
        <IconComponent size={size} color={color} />
      </span>
      {isOpen && (
        <FloatingPortal>
          <div ref={refs.setFloating} style={{ ...floatingStyles, /* ...tooltip box styling */ }} {...getFloatingProps()}>
            {tooltip}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
```
**Adaptation needed for `LensChipRow.jsx` (not a direct reuse — three differences):**
1. The reference element is already a `<button>` (focusable by default) — do not wrap in a `<span
   tabIndex={0}>`; put `ref={refs.setReference}` directly on the existing `<button>`.
2. The button already has manual `onMouseEnter`/`onMouseLeave` (for the separate "Calibrate this
   lens?" prompt) — these MUST be merged into, not replaced by, floating-ui's handlers (see Pitfall 1).
3. Desktop-only: the tooltip should not render on mobile at all (D-01) — gate the `useFloating`
   `open` state (or the whole hook usage) behind the existing `isDesktop` prop already passed into
   `LensChipRow`.

### Anti-Patterns to Avoid
- **Native `title` attribute for the lens tooltip:** explicitly rejected by CONTEXT.md D-02; also
  inconsistent across assistive technologies per current W3C ARIA APG guidance (see Sources). Remove
  the existing `title={lens.description || lens.name}` (`LensChipRow.jsx:145`) — do not simply leave it
  as a fallback alongside the new tooltip (redundant/conflicting hover affordances).
- **Spreading `getReferenceProps()` without merging existing manual hover handlers:** a bare
  `{...getReferenceProps()}` placed after `onMouseEnter`/`onMouseLeave` JSX attributes silently
  discards floating-ui's own hover handling (or vice-versa, whichever comes last in source order,
  since JSX resolves duplicate prop names by last-one-wins) — always pass existing handlers into
  `getReferenceProps({ onMouseEnter, onMouseLeave })` so floating-ui composes them (see Pitfall 1).
- **A stateful `appointedFilter` "migration" (e.g., keeping `useState` but seeding it per tab on tab
  switch):** unnecessary complexity given D-04/D-06 remove all user override entirely. A derived
  constant per bucket is simpler, cannot drift, and needs no `useEffect` to reset on tab change.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Accessible hover/focus tooltip positioning, viewport-edge flipping, portal rendering | A custom `position: absolute` tooltip with manual viewport-edge math | `@floating-ui/react`'s `useFloating` + `offset`/`flip`/`shift` middleware + `FloatingPortal` | Already installed, already proven twice in this exact codebase (`IconOverlay.jsx`, `InfoTooltip.jsx`); flip/shift middleware handles edge cases (e.g., a rightmost lens chip near the viewport edge) that a hand-rolled tooltip would need to reinvent |
| Merging a component's existing manual event handlers with a new interaction library's handlers | Two separate `onMouseEnter` review passes, or wrapping the button in an extra DOM node just to attach a second set of hover listeners | `getReferenceProps({ onMouseEnter, onMouseLeave })` — floating-ui's documented composition point | Passing handlers through the prop-getter is the library's designed mechanism for exactly this situation (confirmed against floating-ui.com's `useInteractions` docs) |

**Key insight:** every primitive this phase needs (tooltip positioning, hover/focus/dismiss
composition, breakpoint detection) is already installed and already has at least one working in-repo
example. This phase is override-and-delete work (removing a dropdown, a search box, an unused state
variable) plus one adaptation of an existing pattern (icon-only tooltip) — there is no green-field
library research required.

## Common Pitfalls

### Pitfall 1: Losing the accessible name when the visible label span is removed
**What goes wrong:** `LensChipRow`'s button today has no `aria-label` — its accessible name comes
entirely from the visible `<span>{lens.name}</span>` text node (`LensChipRow.jsx:156`). If the icon-only
desktop variant simply omits that span without adding `aria-label`, the button becomes a screen-reader
black hole (announced as "button" with no name).
**Why it happens:** the current implementation relies on visible text content for the accessible name
instead of an explicit `aria-label`, so removing the text silently removes the name too — there is no
compiler/lint error for this in a plain React app.
**How to avoid:** add `aria-label={lens.name}` to the button unconditionally (both desktop and mobile —
D-02 says "aria-label on every button"; applying it universally is a strict superset of the literal
requirement and costs nothing since mobile keeps its visible label too).
**Warning signs:** a screen reader (VoiceOver/NVDA) announces the lens button as "button" with no
further text; axe DevTools / Lighthouse accessibility audit flags "buttons must have discernible text."

### Pitfall 2: Floating-ui reference props silently overriding hand-written hover handlers
**What goes wrong:** `LensChipRow`'s button already has `onMouseEnter`/`onMouseLeave` for the
needs-calibration hover-reveal prompt (`LensChipRow.jsx:143-144`). Spreading `{...getReferenceProps()}`
onto the same button — whether before or after those two JSX attributes — will make one of the two
behaviors silently stop working (JSX/React resolves duplicate prop names by last-declaration-wins; a
bare object spread does not merge function values).
**Why it happens:** this is a general JSX/React gotcha, not specific to floating-ui, but it is easy to
miss when adding a library-driven prop getter onto a button that already has manual handlers.
**How to avoid:** call `getReferenceProps({ onMouseEnter: existingHandler, onMouseLeave:
existingHandler })` — floating-ui's `useInteractions` composes (calls both) rather than replaces when
handlers are passed through the getter this way. [CITED: floating-ui.com/docs/useInteractions]
**Warning signs:** the "Calibrate this lens?" hover prompt stops appearing on desktop hover (or the new
tooltip never shows) after wiring in the tooltip.

### Pitfall 3: New tooltip visually stacking with the existing "Calibrate this lens?" prompt
**What goes wrong:** for a needs-calibration lens chip, `LensChipRow` already renders an
absolutely-positioned "Calibrate this lens?" prompt directly below the button on hover/tap
(`LensChipRow.jsx:158-184`). If the new hover/focus tooltip is also active for that same chip, both
could render simultaneously, producing two overlapping popups.
**Why it happens:** the two affordances (name/description tooltip vs. calibration nudge) are logically
independent state (`hoveredKey`/`tappedKey` vs. the new floating-ui `isOpen`), so nothing currently
prevents both from being true at once.
**How to avoid:** suppress the new tooltip's open state whenever `needsCalibration && showPrompt` is
already true for that lens (i.e., don't show "explain the lens" and "prompt to calibrate it" at the
same time — the calibration prompt already explains enough in that moment).
**Warning signs:** two overlapping boxes appear below a needs-calibration lens chip on hover.

### Pitfall 4: Deleting the dropdown/search UI without deleting the now-dead state machinery
**What goes wrong:** removing the `<input>`/`<select>` JSX from `FilterBar.jsx` alone leaves
`searchQuery`/`deferredQuery`/`trimmedSearch`/`visibleList` (`Results.jsx:508-533`) and the "No matches
for..." empty-state block (`Results.jsx:2140-2145`) as permanently-dead code (searchQuery can never
become non-empty again with no input to type into) — technically harmless but confusing for future
maintainers and adds unnecessary `useDeferredValue` overhead.
**Why it happens:** the search-box removal and the underlying filter-cascade removal are two separable
edits, and it's easy to do only the visible one.
**How to avoid:** when removing the search box, also remove `searchQuery`/`setSearchQuery`,
`deferredQuery`, `trimmedSearch`, `visibleList`, and fold `filteredPols = useMemo(() => visibleList,
...)` back down to just `filteredPols = list` (or delete the alias and use `list` directly at its two
call sites). Remove the "No matches for..." block since it can never render.
**Warning signs:** `eslint` (already configured, `npm run lint`) will flag unused variables if this
cleanup is skipped in a way that literally orphans a variable; more subtly, nothing will flag "dead but
still-referenced" state like `searchQuery` since it's still read by the removed empty-state string —
delete both together.

### Pitfall 5: `vitest`'s default environment is Node, not jsdom
**What goes wrong:** any new test file that touches `window`/`document` (e.g., a naive component-render
test for the new tooltip) will throw immediately, the same failure mode already hit and fixed in Phase
214 (`.planning/STATE.md`: "Guarded api.jsx top-level window reference... Vitest's default node test
environment lacks window").
**Why it happens:** this repo's `vitest.config` is inline in `vite.config.js` with no `test.environment`
override, and no `jsdom`/`@testing-library/react` devDependency is installed.
**How to avoid:** keep this phase's automated tests to pure-logic assertions (e.g., `TAB_TYPE_DEFAULTS`
values, `matchesAppointedFilter` behavior) in `.test.js` files under `src/lib/`, matching the existing
`classify.test.js` convention. Do not attempt to render `LensChipRow`/`FilterBar` in vitest without
first adding `jsdom` + `@testing-library/react` as a separate, explicit setup task (out of scope for
this phase unless the planner deliberately chooses to add it).
**Warning signs:** `ReferenceError: window is not defined` / `document is not defined` when running
`npm test`.

## Code Examples

### Per-tab type-filter constant (new, to add to `src/lib/classify.js`)
```javascript
// Source: pattern matches existing FEDERAL_ORDER/STATE_ORDER constants in the same file
export const TAB_TYPE_DEFAULTS = {
  representatives: 'Elected',
  educators: 'Elected',
  judges: 'Appointed',
};
```

### Accessible icon-only tooltip merge point (adapted from `src/components/IconOverlay.jsx`)
```jsx
// Source: src/components/IconOverlay.jsx (IconWithTooltip), adapted for LensChipRow's
// existing button + existing manual hover handlers.
const { refs, floatingStyles, context } = useFloating({
  open: isDesktop && tooltipOpen,
  onOpenChange: setTooltipOpen,
  placement: 'bottom',
  middleware: [offset(8), flip(), shift({ padding: 8 })],
  whileElementsMounted: autoUpdate,
});
const hover = useHover(context, { enabled: isDesktop });
const focus = useFocus(context, { enabled: isDesktop });
const dismiss = useDismiss(context);
const role = useRole(context, { role: 'tooltip' });
const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

// ...on the existing <button>:
<button
  ref={refs.setReference}
  aria-label={lens.name}
  {...getReferenceProps({
    onMouseEnter: () => { if (needsCalibration && isDesktop) setHoveredKey(lens.key); },
    onMouseLeave: () => { if (isDesktop) setHoveredKey((k) => (k === lens.key ? null : k)); },
  })}
  // ...existing onClick / className / style unchanged
>
  {renderLensIcon(lens)}
  {!isDesktop && <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{lens.name}</span>}
</button>
{isDesktop && tooltipOpen && !showPrompt && (
  <FloatingPortal>
    <div ref={refs.setFloating} style={{ ...floatingStyles, zIndex: 70, background: isDark ? '#1f2937' : '#fff', color: isDark ? '#e5e7eb' : '#111827', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} {...getFloatingProps()}>
      {lens.description || lens.name}
    </div>
  </FloatingPortal>
)}
```
Note `!showPrompt` in the gate above — this is Pitfall 3's fix (never show both popups for the same
chip at once).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single global `appointedFilter` `useState`, one dropdown, applied identically to all three tab hierarchies | Per-bucket fixed constant (`TAB_TYPE_DEFAULTS`), no dropdown, no shared state | This phase (215) | Removes an entire class of "which tab's filter am I looking at" bugs; Judges tab can never be silently emptied by a Representatives-tab selection because there is no longer a shared selection |
| Native `title` attribute for lens description on hover | `@floating-ui/react`-driven `role="tooltip"` with hover+focus+`aria-label` | This phase (215); matches the pattern already used elsewhere in the app since at least Phase 214's LocationCombobox work | Keyboard and touch-hybrid users can now discover lens descriptions; matches current W3C ARIA APG guidance |

**Deprecated/outdated:**
- The "All types" dropdown (`FilterBar.jsx` `TYPE_OPTIONS`/`Dropdown`) — removed as of this phase per D-04.
- `LocalFilterSidebar.jsx` and `ResultsHeader.jsx` — already functionally dead (see Dead Surfaces); this phase is a natural point to formally delete them.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Deleting `LocalFilterSidebar.jsx` and `ResultsHeader.jsx` entirely is the right disposition (vs. leaving them stripped-but-present) | Architecture Patterns → Dead Surfaces | Low — this is presented as a planner decision point with both options laid out, not asserted as the only correct answer; verified facts (dead/orphaned status) are solid, the *recommendation* to delete is a judgment call flagged as such |
| A2 | `aria-label` should be applied to lens buttons on **both** mobile and desktop (D-02's literal wording only clearly requires it where the visible label is hidden) | User Constraints / Pitfall 1 | Very low — applying `aria-label` universally is a strict superset of the requirement and cannot break anything; flagged here only so the planner knows this goes slightly beyond the literal CONTEXT.md wording |

**No claim in this research required an unverifiable, training-only assertion about an external
library's behavior** — the one nontrivial library-behavior claim (floating-ui's `getReferenceProps`
handler composition) was confirmed against floating-ui.com's own documentation this session (see
Sources), so it is tagged `[CITED]`, not `[ASSUMED]`.

## Open Questions

1. **Exact aria-label / tooltip text wording for the "Best Match" (`custom`) lens chip**
   - What we know: the four real API-backed lenses have a `.description` field with a full sentence (e.g., "8 issues most U.S. House & Senate members and candidates have answered" for Federal); the synthesized "Best Match" chip (`Results.jsx` `augmentedLenses`, `key: 'custom'`) is built inline in `Results.jsx` and currently has no `description` field set.
   - What's unclear: whether the planner should add a short description string for "Best Match" (e.g., "Compares every topic you've answered") or fall back to just the name `"Best Match"` as both aria-label and tooltip text.
   - Recommendation: default the tooltip body to `lens.description || lens.name` (already the existing `title` fallback pattern at `LensChipRow.jsx:145`) — this requires no new copy and preserves current behavior for the one lens that has no description.

## Environment Availability

Skipped — this phase has no external tool/service/runtime dependency beyond what's already installed
and already running (Node/Vite dev server, the already-live `accounts-api.empowered.vote` backend for
manual smoke verification). No new CLI, database, or service dependency is introduced.

## Validation Architecture

`workflow.nyquist_validation` is not set in `.planning/config.json` (absent = enabled per protocol), so
this section is included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.4 (`package.json` devDependencies) |
| Config file | none dedicated — inline in `vite.config.js` (no `test.environment` override → defaults to Node, not jsdom; no `jsdom`/`@testing-library/react` installed) |
| Quick run command | `npx vitest run src/lib/classify.test.js` |
| Full suite command | `npm test` (runs `vitest run`) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HDR-01 | `TAB_TYPE_DEFAULTS.representatives === 'Elected'` and `.educators === 'Elected'` | unit | `npx vitest run src/lib/classify.test.js -t "TAB_TYPE_DEFAULTS"` | ❌ Wave 0 (new `describe` block to add to existing `classify.test.js`) |
| HDR-02 | `TAB_TYPE_DEFAULTS.judges === 'Appointed'`; `matchesAppointedFilter(judgePol, 'Appointed')` returns true for an appointed judge | unit | `npx vitest run src/lib/classify.test.js -t "TAB_TYPE_DEFAULTS"` | ❌ Wave 0 (same new block; `matchesAppointedFilter` itself is currently inline in `Results.jsx`, not exported/testable — planner should decide whether to extract it into `classify.js` alongside `TAB_TYPE_DEFAULTS` for testability, or accept manual-only verification for that specific function) |
| HDR-02 (live) | Judges tab at Bloomington, IN is non-empty and shows appointed judges by default, with zero manual filter interaction | manual (browser) | N/A — navigate the running app to Bloomington, IN and inspect the Judges tab | N/A — this is the D-08-mandated real-data smoke test; no automated e2e framework (Playwright/Cypress) exists in this repo to script it |
| HDR-03 | Lens buttons have `aria-label` and render the gavel icon for `judicial`; icon-only on desktop, icon+label on mobile | manual (browser, both breakpoints) + visual | N/A for the responsive/visual behavior; existing `renderLensIcon` gavel-icon mapping is unchanged code, not newly at risk | N/A |
| SRCH-07 | "Search by name" text string does not appear in the rendered header on any tab | manual (browser) + optional acceptance grep | `grep -rn "Search by name" src/pages/Results.jsx src/components/FilterBar.jsx` (should return 0 hits after the edit; per SRCH-08's own established acceptance-grep convention in this same milestone) | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/classify.test.js` (fast, pure-logic, covers HDR-01/HDR-02's derivable-constant behavior)
- **Per wave merge:** `npm test` (full suite) + `npm run lint` (catches the dead-variable risk in Pitfall 4)
- **Phase gate:** Full suite green, then the D-08 live manual smoke test at Bloomington, IN (Judges tab non-empty, shows appointed judges, no dropdown/search box visible anywhere, lens buttons icon-only on desktop / icon+label on mobile with working tooltips) before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] Add a `describe('TAB_TYPE_DEFAULTS')` block to the existing `src/lib/classify.test.js` — covers HDR-01/HDR-02's per-tab default values.
- [ ] Decide (planner discretion, not required by the phase's literal acceptance criteria) whether to extract `resolveIsAppointed`/`matchesAppointedFilter` out of `Results.jsx` into `classify.js` for direct unit-testability, or leave them inline and rely on the manual Bloomington-IN smoke test alone for HDR-02's end-to-end behavior.
- [ ] No jsdom/`@testing-library/react` setup exists — do not add component-render tests for `LensChipRow`/`FilterBar` in this phase unless the planner explicitly scopes in that infrastructure work (see Pitfall 5).

## Security Domain

`security_enforcement` is not explicitly set to `false`, so this section is included per protocol, but
its content is minimal because this phase touches no authentication, session, cryptography, or
server-side input-handling code.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase touches no auth/session code |
| V3 Session Management | No | Phase touches no session code |
| V4 Access Control | No | No new access-control surface; the type-filter change is a *display* default, not an authorization boundary — appointed non-judge officials remain fully queryable via the underlying API, they are simply not shown in this UI by default (D-06 explicitly accepts this as intended, not a security control) |
| V5 Input Validation | Partially — being *removed*, not added | The only user-text-input surface this phase touches (`FilterBar.jsx`'s search box) is being deleted entirely, net-reducing the client-side input surface. No new input validation is introduced. |
| V6 Cryptography | No | N/A |

### Known Threat Patterns for this stack
None applicable — no new data flow, no new input surface, no new trust boundary. The `aria-label`/
tooltip text values are all app-owned static/API-sourced strings (`lens.name`, `lens.description`),
never raw user input, so there is no XSS/injection consideration introduced by this phase (React's
default JSX text-content escaping already covers this, and no `dangerouslySetInnerHTML` is used
anywhere in the touched files).

## Sources

### Primary (HIGH confidence)
- `src/components/IconOverlay.jsx` (in-repo, read this session) — the exact accessible icon+tooltip pattern to adapt.
- `src/components/CampaignFinance/InfoTooltip.jsx` (in-repo, read this session) — a second in-repo `@floating-ui/react` tooltip/popover precedent (role="dialog" variant, for contrast).
- `src/pages/Results.jsx` (in-repo, read this session, full appointedFilter/hierarchy/renderPeopleTab data flow traced).
- `src/components/FilterBar.jsx`, `src/components/LensChipRow.jsx`, `src/components/CompassControlsBar.jsx`, `src/components/LocalFilterSidebar.jsx`, `src/components/ResultsHeader.jsx` (in-repo, read this session).
- `src/lib/classify.js`, `src/lib/classify.test.js` (in-repo, read this session — confirms existing constant-map convention and vitest test-file convention).
- `package.json` (in-repo, read this session — confirms `@floating-ui/react` ^0.27.19 already a dependency, no jsdom/@testing-library/react devDependency, vitest 4.1.4).
- `.planning/STATE.md` lines 805-819 (in-repo, read this session — Phase 208/210/214 GOTCHAs directly relevant: `renderPeopleTab` viewName-gating precedent, Bloomington-IN human-verify precedent, vitest node-environment `window` gotcha).

### Secondary (MEDIUM confidence)
- [Tooltip Pattern | APG | WAI | W3C](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) — confirms `aria-describedby`/`role="tooltip"` is the recommended pattern over the native `title` attribute, corroborating CONTEXT.md D-02's requirement.
- [useInteractions | Floating UI](https://floating-ui.com/docs/useinteractions) — confirms `getReferenceProps(userProps)` composes (does not overwrite) custom event handlers passed alongside the interaction hooks' own handlers, the basis for Pitfall 2's fix.

### Tertiary (LOW confidence)
None — every claim in this research was either verified directly against the current source tree or
cited against official documentation this session.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; existing dependency confirmed via `package.json` inspection and `Object.keys()` of the installed ev-ui build.
- Architecture: HIGH — every data-flow claim (shared `appointedFilter`, dead `LocalFilterSidebar`/`ResultsHeader`, `renderPeopleTab`'s existing `viewName` parameter) was confirmed by direct source reading and repo-wide grep this session, not inferred.
- Pitfalls: HIGH — Pitfalls 1, 2, and 4 are derived from reading the exact current code (not generic React advice); Pitfall 2's floating-ui behavior claim was cross-checked against official docs; Pitfall 5 is corroborated by an existing Phase-214 GOTCHA in `STATE.md`.

**Research date:** 2026-07-21
**Valid until:** 30 days (stable, in-repo-only findings; the two external citations are stable W3C/library-doc references unlikely to change on this timescale)
