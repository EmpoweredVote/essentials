# Phase 169: Dark-Mode Design System Foundation - Pattern Map

**Mapped:** 2026-06-24
**Files analyzed:** 5 (all MODIFY — no new files)
**Analogs found:** 5 / 5 (in-file self-analogs — this is a reconcile-and-upgrade of an existing dark-mode system)

> **Mapping note:** This phase has NO greenfield files. Every modified file already contains the
> exact pattern to mirror — the work is keep-the-names/change-the-values plus a bounded literal
> sweep on in-scope surfaces. The "analog" for each file is therefore an *existing block in the
> same file* (or a sibling file using the identical pattern). Excerpts below are the established
> shapes the executor must replicate, not invent.

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/index.css` | token source + theming override (CSS) | transform (tokens→utilities) | itself — existing `@theme` block (L13–27) + `.dark .ev-*` blocks (L120–348) | exact (self) |
| `src/main.jsx` | config (font-load entry) | n/a (import side-effects) | `src/index.css` L2 CDN `@import` (current Manrope load) | role-match |
| `src/components/Layout.jsx` | page component (header chrome) | request-response (props to ev-ui Header) | itself — `style={isDark ? {...}}` prop (L62–65) | exact (self) |
| `src/components/FilterBar.jsx` | page component (controls) | event-driven (filter callbacks) | itself — `isDark ? darkLit : lightLit` ternary palette (L26–28, 82–87) | exact (self) |
| `src/pages/Results.jsx` | page component (main surface) | transform (hierarchy→cards) | itself — tier-label + card-wrapper inline literals (L1427–1438, 1892, 1916) | exact (self) |

---

## Pattern Assignments

### `src/index.css` (token source + theming override)

This is the single source of truth (D-01). Two established patterns live here that the executor replicates verbatim.

**Pattern A — `@theme` dark token block** (L13–27). Keep the NAMES, change the VALUES (D-01/D-02). Add the new D-02 slate/text tokens and the `--font-*` tokens into this same block:
```css
@theme {
  /* Empowered Vote - Dark Mode Palette */
  --color-ev-navy: #020618;        /* → #0d1117 (page bg, D-02) */
  --color-ev-navy-card: #1a2235;   /* → #161b22 (surface, D-02) */
  --color-ev-navy-elevated: #1e2a3a; /* not in D-02 — see Open Q1 in RESEARCH */
  --color-ev-teal-light: #59b0c4;  /* → #00c8d7 (dark accent, D-02) */
  --color-ev-coral: #ff5740;       /* KEEP (D-04) */
}
```
New tokens to ADD inside the same `@theme` block (D-02 slates + text + D-05 fonts):
`--color-ev-slate #2d3748`, `--color-ev-slate-strong #4a5568`, `--color-ev-text-primary #e6edf3`,
`--color-ev-text-muted #8b949e`, `--font-sans "Inter",…`, `--font-display "Manrope",…`.

**Critical — do NOT touch the `:root` LIGHT block** (L29–36). `--ev-teal #00657c`, `--ev-light-blue #59b0c4`
are SEPARATE light tokens (D-03 / Pitfall 1). Editing `@theme` dark values does not reach them.

**Pattern B — `.dark .ev-<component> { … !important }` override block** (the reused-verbatim shape). The PoliticianCard block (L121–137) is the canonical model — copy its exact structure for every in-scope ev-ui surface, swapping only the values to the new palette:
```css
/* Dark mode: override ev-ui inline background on politician cards */
.dark .ev-politician-card {
  background-color: #1a2235 !important;   /* → #161b22 */
  border-color: rgba(255, 255, 255, 0.08) !important;  /* keep — hairline */
}
.dark .ev-politician-card:hover {
  background-color: #1e2a3a !important;   /* → elevated (Open Q1: #21262d) */
}
.dark .ev-politician-card h3 { color: #f3f4f6 !important; }  /* → #e6edf3 */
.dark .ev-politician-card p  { color: #d1d5db !important; }  /* → #8b949e */
```
`!important` is mandatory because ev-ui ships inline styles (MEMORY: `feedback_dark_mode_ev_ui_important`).

**Pattern C — section-header / eyebrow accent override** (L338–342). This is the existing teal-forcing block; repoint `#59b0c4`→`#00c8d7` and layer the D-06 eyebrow type onto it:
```css
.dark .ev-gov-body-section [role="button"] span {
  color: #59b0c4 !important;   /* → #00c8d7 (accent); add Manrope 600 uppercase 1.2px (D-06) */
}
```

**Global font default** (L42) — the keep-until-confirmed swap:
```css
html, body { font-family: 'Manrope', sans-serif; }  /* → var(--font-sans) (Inter) per D-05 */
```

**PRESERVE VERBATIM (regression guards):**
- `@source not "../.planning";` / `@source not "../**/*.md";` (L8–9) — Tailwind v4 build safety (Pitfall 5).
- `html:not(.dark)` light WCAG fixes (L353–358) — light-mode floor; deleting these regresses light (Pitfall 3).

---

### `src/main.jsx` (font-load entry — only if self-host path chosen)

**Analog:** the existing CDN `@import` at `src/index.css` L2 (`Manrope:wght@400;500;600;700`). That is the current working font-load mechanism.

**Pattern — side-effect CSS imports at the top of the entry module.** `main.jsx` already imports global CSS via side effect (L6 `import "./index.css";`). Mirror that exact shape for the `@fontsource` weights:
```js
import "./index.css";          // existing (L6)
// add (D-05, self-host path):
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
```
**Alternative (CDN, lower effort):** extend the existing `index.css` L2 `@import` to add Inter alongside Manrope — same mechanism already proven in-repo. Either satisfies D-05 (Claude's Discretion). Do NOT remove the Manrope load until the replacement is confirmed (RESEARCH font-wiring note). Gate any `@fontsource` install behind `npm view` (packages tagged `[ASSUMED]` in RESEARCH audit).

---

### `src/components/Layout.jsx` (header chrome)

**Analog:** itself — the `isDark` conditional `style` prop on the ev-ui `<Header>` (L62–65). This is the established way the app themes the header bg (D-08: bg via the Layout `style` prop, no ev-ui change).

**Pattern — one-line value swap on the existing `style` prop:**
```jsx
<Header
  darkMode={isDark}
  /* … */
  style={isDark ? {
    backgroundColor: '#020618',                       // → '#0d1117' (D-02 page bg)
    borderBottom: '1px solid rgba(255,255,255,0.08)', // keep — already hairline ✅
  } : undefined}
/>
```
Header *internals* (logo/nav/profile-menu text) are hardcoded in ev-ui to the OLD palette and are NOT reached by this prop — they need `.dark .ev-header-*` overrides in `index.css` (use Pattern B; `ev-header-secondary`/`ev-header-nav`/`ev-header-mobile-menu` are the available child class hooks per RESEARCH; `<header>` itself has no root class).

---

### `src/components/FilterBar.jsx` (controls — D-09 MINIMAL re-theme only)

**Analog:** itself — the `isDark ? darkLiteral : lightLiteral` ternary palette declared at the top of `Dropdown` (L26–28) and the main component (L82–87). This is the established inline-literal palette pattern; mirror it by swapping only the DARK side of each ternary.

**Pattern — dark-side literal swap (keep light side, keep all geometry/44px):**
```js
// Dropdown (L26–29)
const bg          = isDark ? '#1a2235' : '#fff';            // dark → #161b22
const borderColor = isActive ? '#59b0c4'                    // active → #00c8d7
                  : (isDark ? '#2d3f5a' : '#d1d5db');        // dark idle → #2d3748 (slate, D-02)
const textColor   = isActive ? (isDark ? '#59b0c4' : '#00657c')  // dark active → #00c8d7
                  : (isDark ? '#d1d5db' : '#374151');        // dark idle → #8b949e (muted floor)
const chevronStroke = isDark ? '%2359b0c4' : '%236b7280';   // dark → %2300c8d7 (URL-encoded)

// main component (L82–87)
const inputBg          = isDark ? '#1a2235' : '#fff';       // → #161b22
const inputBorder      = isDark ? '#2d3f5a' : '#d1d5db';    // → #2d3748
const inputBorderFocus = isDark ? '#59b0c4' : '#00657c';    // dark → #00c8d7
const inputText        = isDark ? '#d1d5db' : '#374151';    // dark → #8b949e (floor; never fainter)
const iconStroke       = isDark ? '#59b0c4' : '#6b7280';    // dark → #00c8d7
```
Also: checkbox `accentColor` (L159) dark `#59b0c4`→`#00c8d7`; `<option>` bg (L62) `#1a2235`→`#161b22`.
Leave ALL light-side values (`#fff`, `#d1d5db`, `#00657c`, `#374151`, `#6b7280`) untouched (D-03).
Keep every `minHeight: '44px'`, padding, and `fontFamily: "'Manrope', sans-serif"` (the latter may
become `var(--font-sans)` only if the executor tokenizes; D-09 says minimal — value swap is sufficient).

---

### `src/pages/Results.jsx` (main surface — DARK-02 primary target)

**Analog:** itself. Three established inline-literal sites; the page-shell uses Tailwind `dark:bg-ev-navy` tokens (auto-update — no edit). The work is repointing the inline literals to the new palette.

**Pattern 1 — card-wrapper / overlay-compass dark literals** (L1427, L1438, L1456):
```js
const compassBg = isDark ? '#1a2235' : isCandidate ? '#fffef5' : '#fff';   // dark → #161b22
const wrapperBorderColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2EBEF';  // keep — hairline ✅
// PoliticianCard style (L1438):
isDark ? { backgroundColor: '#1a2235', borderColor: '#2d3f5a' } : {}        // → #161b22 / #2d3748
```
Candidate accents `#fffef5` / `#fed12e` (L1438, L1816) are NOT dark-palette — KEEP (D-04 family).
`borderRadius: 10` wrapper (L1457) is a control radius — KEEP (UI-SPEC control=10). PoliticianCard
geometry is preserved (success #4) — only colors change.

**Pattern 2 — tier eyebrow label** (L1892 AND L1916, identical shape). This is the recurring eyebrow; repoint the dark literal and apply D-06 type:
```jsx
<span className="text-xs font-semibold uppercase tracking-wider"
      style={{ color: isDark ? '#59b0c4' : tierStyle.text }}>{tier}</span>
//                              ^ dark → #00c8d7 (accent); add font-display/Manrope per D-06
// NOTE: the !isDark tierStyle.bg gating (L1889/L1913) is light-only — DO NOT touch (D-03)
```

**Pattern 3 — themed link accent** (L1939, treasury link). Tailwind arbitrary-value dark class:
```jsx
className="… dark:text-[#59b0c4] dark:hover:text-[#7ec8d8] …"  // dark → #00c8d7; KEEP #7ec8d8 hover
```

**Auto-updating via tokens (NO edit needed, verify legibility only):** page shell `dark:bg-ev-navy`
(L1535/L1616), tab active `dark:text-ev-teal-light` / `dark:border-ev-teal-light` (L1794/L1804),
banners `dark:bg-ev-navy-card` (L1855). Tab INACTIVE `dark:text-gray-500` (L1795/L1805) and
empty-state `dark:text-gray-400` (L1895/L1902) are faint-gray risks on `#0d1117` (Pitfall 4) — lift
toward the `#8b949e` floor if borderline.

---

## Shared Patterns

### ev-ui inline-style override (the spine of this phase)
**Source:** `src/index.css` L121–137 (PoliticianCard block — canonical).
**Apply to:** every ev-ui surface in scope — `.ev-politician-card`, `.ev-gov-body-section`, `.ev-subgroup-grid`, `.ev-header-*`.
```css
.dark .ev-<component> { <property>: <new-palette-value> !important; }
```
`!important` is non-negotiable — ev-ui renders inline styles (MEMORY `feedback_dark_mode_ev_ui_important`). Never faint-gray on dark; muted floor `#8b949e`.

### isDark conditional palette (component inline styles)
**Source:** `FilterBar.jsx` L26–28 / Layout.jsx L62 / Results.jsx L1427.
**Apply to:** all in-repo component inline styles. Swap ONLY the `isDark ?` branch; leave the light branch verbatim (D-03).
```js
const x = isDark ? '<NEW dark value>' : '<light value — UNCHANGED>';
```

### Keep-names / change-values token strategy
**Source:** `@theme` block `src/index.css` L13–27.
**Apply to:** all dark token edits. Token *names* (`ev-navy`, `ev-navy-card`, `ev-teal-light`) stay — they are consumed across ~10 files; only the value changes, so consumers (Landing/Profile/etc.) inherit the new palette automatically (D-01, accepted global shift). Do NOT rename (avoids large blast radius).

### Hover-accent convention
**Source:** `index.css` L162/L164, L226/L228; Results L1939.
**Apply to:** link/accent hovers. Lighten accent toward `#7ec8d8` on hover — keep this existing value.

---

## No Analog Found

None. Every modified file contains its own established pattern. This is a reconcile-and-upgrade phase, not greenfield — the planner should reference the in-file analog excerpts above rather than RESEARCH.md generic examples.

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All 5 files have exact in-file self-analogs |

---

## Metadata

**Analog search scope:** `src/index.css` (full), `src/main.jsx` (full), `src/components/Layout.jsx` (full), `src/components/FilterBar.jsx` (full), `src/pages/Results.jsx` (token/tier/card ranges L1420–1499, L1785–1830, L1880–1949).
**Files scanned:** 5
**Pattern extraction date:** 2026-06-24
**Cross-cutting rules honored:** ev-ui `!important` (MEMORY), faint-gray-on-dark floor `#8b949e` (MEMORY/UI-SPEC), Tailwind `@source not` build safety (MEMORY), light-mode no-regression (D-03).
