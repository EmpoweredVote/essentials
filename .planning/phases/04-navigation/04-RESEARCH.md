# Phase 4: Navigation - Research

**Researched:** 2026-04-13
**Domain:** React/JSX UI — Landing page card + Header nav item
**Confidence:** HIGH

## Summary

This phase adds two entry points to the Elections page: a card on the landing page and a top-level nav item in the site header. Both are pure UI additions with no new data fetching or routing setup — the `/elections` route already exists in `App.jsx`.

The codebase uses `@empoweredvote/ev-ui@^0.4.0` for the shared `Header` component. `Layout.jsx` imports `defaultNavItems` from that package and currently mutates the array inline (remapping the Read & Rank dropdown URL when an address is in query params). The Elections nav item is added by the same inline mapping pattern — insert a new flat item `{ label: "Elections", href: "/elections" }` into the array.

The landing page card replicates the exact Tailwind class string already used on the county cards: `bg-white border-2 border-[var(--ev-teal)] rounded-lg shadow-sm hover:shadow-md transition-shadow`. It navigates to `/elections` via `useNavigate`.

**Primary recommendation:** Two targeted edits — `Landing.jsx` (add Elections card JSX between county cards and browse link) and `Layout.jsx` (append Elections item to `navItems` array). No new files, no new dependencies.

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| react-router-dom | ^7.8.2 | Client-side navigation (`useNavigate`) | Already used in Landing.jsx |
| @empoweredvote/ev-ui | ^0.4.0 | `Header`, `defaultNavItems` | Already imported in Layout.jsx |
| tailwindcss | ^4.1.12 | Utility classes for card styling | Already used throughout |

No new dependencies required.

## Architecture Patterns

### How `defaultNavItems` is extended in Layout.jsx

The current pattern maps over `defaultNavItems` to rewrite dropdown hrefs. The Elections nav item is a flat top-level item (no dropdown). The correct extension point is the `navItems` variable constructed in Layout.jsx — append to it after the existing map:

```jsx
// Existing pattern (Read & Rank URL injection):
const navItems = currentAddress
  ? defaultNavItems.map(item => { /* ... mutates dropdown */ })
  : defaultNavItems;

// Extension for Elections — append after the map result:
const navItemsWithElections = [
  ...navItems,
  { label: "Elections", href: "/elections" }
];
// Then pass navItemsWithElections to <Header navItems={navItemsWithElections} ... />
```

Or equivalently, appending directly inside both branches.

### Nav item shape (from ev-ui source, HIGH confidence)

Flat top-level item:
```js
{ label: "Elections", href: "/elections" }
```

Dropdown item (for reference, not used here):
```js
{ label: "Features", href: "#", dropdown: [ { label: "...", href: "..." } ] }
```

The `Header` component iterates `navItems` with `NavLink`. `NavLink` renders an `<a>` tag. When `onNavigate` is provided (it is — `Layout.jsx` passes `(href) => { window.location.href = href; }`), clicking any nav item calls `onNavigate(href)` instead of following the `<a>` href natively. Because `/elections` is a same-app route, `window.location.href = "/elections"` performs a full-page navigation, which is consistent with how all other nav items work in this app.

### Landing page card placement

The Elections card inserts as a new JSX block between the county cards div and the "Browse by location" div:

```jsx
{/* County coverage cards */}
<div className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
  {COVERAGE_AREAS.map(...)}
</div>

{/* --- NEW: Elections card --- */}
<div className="mt-3 mb-2">
  <button
    onClick={() => navigate('/elections')}
    className="w-full text-left px-4 py-3 bg-white border-2 border-[var(--ev-teal)] rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] focus:ring-offset-2"
  >
    <div className="text-base font-semibold text-[var(--ev-teal)]">Upcoming Elections</div>
    <div className="text-sm text-gray-600">See what's on your ballot</div>
  </button>
</div>

{/* Browse by location link */}
<div className="text-center mt-2 mb-2">
  ...
</div>
```

`w-full` makes the card full-width of its `max-w-xl` container — consistent with the centered, single-column placement decision. The county cards use `flex-1` inside a flex row; the Elections card is standalone so `w-full` is the equivalent.

### Anti-Patterns to Avoid

- **Mutating `defaultNavItems` directly:** `defaultNavItems` is a module-level const exported from ev-ui. Mutating it (e.g. `defaultNavItems.push(...)`) would affect all consumers in the same module instance. Always spread into a new array.
- **Wrapping Elections card in another section header:** The county cards have a `<p className="text-sm text-gray-500 mb-3">We currently cover:</p>` label above them. The Elections card should not pick up that label — it must be placed after the county cards container, not inside it.
- **Using React Router `<Link>` inside the nav:** Layout's `onNavigate` uses `window.location.href`; mixing `<Link>` would be inconsistent and unnecessary.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Header with nav | Custom header JSX | `Header` from `@empoweredvote/ev-ui` with extended `navItems` | Already wired; consistent across all pages |
| Card hover styling | Custom CSS | Tailwind `shadow-sm hover:shadow-md transition-shadow` | Exact same string used on county cards — copy-paste correct |

## Common Pitfalls

### Pitfall 1: Nav order matters
**What goes wrong:** Elections appended at the end of `defaultNavItems` lands after "FAQ" — potentially awkward. Current defaultNavItems order is: About Us, Features, Volunteer, FAQ.
**Why it happens:** Naive append.
**How to avoid:** Insert Elections before "FAQ" or after "Features" using a splice, or accept end-of-list as reasonable. The context leaves nav order to Claude's discretion; "Elections" as a product feature fits logically after "Features" or before "Volunteer". End-of-list (after FAQ) is the least disruptive no-splice option.
**Recommendation:** Append to end — fewest lines of code, no fragile index assumptions, readable in context.

### Pitfall 2: Card layout breaks on mobile
**What goes wrong:** County cards use `flex-1` inside `sm:flex-row`; a sibling Elections card in the same flex container would be squeezed.
**Why it happens:** Adding the Elections card inside the county cards flex div.
**How to avoid:** Elections card goes in its own wrapper div outside the `flex` container, as shown in the pattern above.

### Pitfall 3: `onNavigate` in Header uses `window.location.href`
**What goes wrong:** Developer assumes the nav item href will use React Router's client-side navigation, but it performs a full reload.
**Why it happens:** Layout.jsx passes `(href) => { window.location.href = href; }` as `onNavigate`.
**Impact:** Not a bug — full reload to `/elections` works correctly. Just don't expect scroll position preservation or animated transitions.

### Pitfall 4: Two separate `navItems` variables needed
**What goes wrong:** The Read & Rank injection already produces a `navItems` variable. Adding the Elections item must be applied to BOTH branches (with-address and without-address) or wrapped as a second step.
**How to avoid:** Compute `navItems` (Read & Rank injection) first, then apply Elections append as a second step on the result, regardless of branch.

## Code Examples

### Layout.jsx — full navItems construction (verified from source)

```jsx
// Step 1: existing Read & Rank injection (unchanged)
const navItems = currentAddress
  ? defaultNavItems.map(item => {
      if (item.dropdown) {
        return {
          ...item,
          dropdown: item.dropdown.map(sub =>
            sub.label === 'Read & Rank'
              ? { ...sub, href: `https://readrank.empowered.vote?address=${encodeURIComponent(currentAddress)}` }
              : sub
          ),
        };
      }
      return item;
    })
  : defaultNavItems;

// Step 2: append Elections (new)
const navItemsWithElections = [
  ...navItems,
  { label: "Elections", href: "/elections" },
];

// Step 3: pass to Header (change navItems prop)
<Header
  ...
  navItems={navItemsWithElections}
  ...
/>
```

### Landing.jsx — Elections card JSX (verified against county card class string)

County card reference (line 61 of Landing.jsx):
```
className="flex-1 text-left px-4 py-3 bg-white border-2 border-[var(--ev-teal)] rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] focus:ring-offset-2"
```

Elections card (same classes, `w-full` instead of `flex-1`):
```jsx
<div className="mt-3 mb-2">
  <button
    onClick={() => navigate('/elections')}
    className="w-full text-left px-4 py-3 bg-white border-2 border-[var(--ev-teal)] rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--ev-teal)] focus:ring-offset-2"
  >
    <div className="text-base font-semibold text-[var(--ev-teal)]">Upcoming Elections</div>
    <div className="text-sm text-gray-600">See what's on your ballot</div>
  </button>
</div>
```

## State of the Art

No major version changes relevant to this phase. All libraries in use are current.

| Area | Status |
|------|--------|
| `/elections` route | Already exists in App.jsx (line 59) — no routing work needed |
| `ElectionsView.jsx` | Already implemented — no component work needed |
| `Layout.jsx` `defaultNavItems` pattern | Already established — extend, don't replace |

## Open Questions

None. All implementation details are resolved from codebase inspection and locked decisions.

1. **Nav item position** — Append to end is simplest and safe. Claude's discretion permits this.
2. **Card width** — `w-full` within `max-w-xl` container gives near-full-width centered card. Claude's discretion permits this.
3. **Chevron on Elections card** — County cards have no chevron; Elections card should omit it for visual consistency.

## Sources

### Primary (HIGH confidence)
- `/c/Transparent Motivations/essentials/src/pages/Landing.jsx` — County card JSX, class strings, layout structure
- `/c/Transparent Motivations/essentials/src/components/Layout.jsx` — `defaultNavItems` import, Read & Rank injection pattern, `Header` props
- `/c/Transparent Motivations/essentials/node_modules/@empoweredvote/ev-ui/dist/index.mjs` lines 1223-1238 — `defaultNavItems` shape (verified directly)
- `/c/Transparent Motivations/essentials/node_modules/@empoweredvote/ev-ui/dist/index.mjs` lines 737-742 — `handleNavClick` / `onNavigate` behavior (verified directly)
- `/c/Transparent Motivations/essentials/src/App.jsx` — `/elections` route confirmed present (line 59)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified from installed node_modules and source files
- Architecture: HIGH — patterns read directly from codebase, no inference
- Pitfalls: HIGH — derived from direct code inspection

**Research date:** 2026-04-13
**Valid until:** 60 days (stable codebase, no fast-moving dependencies involved)
