# Phase 169: Dark-Mode Design System Foundation - Research

**Researched:** 2026-06-24
**Domain:** Tailwind CSS 4 design tokens + dark-mode theming of React 19 / Vite app with shared inline-styled ev-ui components
**Confidence:** HIGH (codebase is fully readable and authoritative; all token usage enumerated by grep; ev-ui internals inspected directly from `node_modules/@empoweredvote/ev-ui/dist`)

## Summary

Dark mode already exists in this app via a `.dark` class toggled on `<html>` (driven by `useTheme.js`), a Tailwind v4 `@theme` block in `src/index.css` defining `--color-ev-navy`/`-card`/`-elevated`/`-teal-light`/`-coral`, and a large set of `.dark .ev-* { … !important }` override blocks that re-color the inline styles ev-ui ships. This phase is a **reconcile-and-upgrade**: change the *dark* token values to the Figma GitHub-dark palette (`#0d1117` page / `#161b22` surface / `#00c8d7` accent / `#e6edf3` primary text / `#8b949e` muted), wire Inter + Manrope as type tokens, and apply the new palette to Results main content + the global header chrome — without touching light mode and without changing ev-ui.

The single biggest risk is **light-mode regression** and **the literal-hex sprawl**: the old dark hex values (`#1a2235`, `#59b0c4`, `#f3f4f6`, `#d1d5db`, `#020618`, `#1e2a3a`) are hardcoded as literals in ~40 places across `index.css`, `Results.jsx`, `Layout.jsx`, `FilterBar.jsx`, and several other components — NOT all routed through tokens. Critically, **ev-ui's `Header` and `tierColors` hardcode the OLD dark palette internally** (`#1a2235`, `#59b0c4`, `#f3f4f6`, `#d1d5db`), so even after token renames the header chrome and any ev-ui-rendered dark color will keep the old values unless overridden with `!important` in essentials.

**Primary recommendation:** Treat `src/index.css` `@theme`/`:root` as the single token source. Change ONLY the dark token *values* (keep the names — `bg-ev-navy` etc. are used across many files; renaming would be a large unnecessary blast radius). Then sweep the literal-hex occurrences on the in-scope surfaces (Results, Layout, FilterBar, the index.css override blocks) and repoint them to tokens/new values. Self-host Inter + Manrope via `@fontsource` and register them as `@theme` `--font-*` tokens. Validate visually + with a build pass + a light-mode-unchanged diff; there is no automated CSS test harness and none should be invented for this phase.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Design token definition (color/type/radius) | Browser/Client CSS (`src/index.css` `@theme` + `:root`) | — | Tailwind v4 compiles tokens to CSS custom properties; single source of truth lives here |
| Dark/light mode switching | Browser/Client (`useTheme.js` toggles `.dark` on `<html>`) | `index.html` inline boot script (FOUC prevention) | Class-based variant; no server involvement |
| ev-ui component theming | Browser/Client CSS overrides (`.dark .ev-* !important` in essentials) | — | ev-ui ships inline styles; essentials cannot change ev-ui repo (D-08), only override |
| Results page chrome (tabs, banners, tier labels) | Browser/Client (`Results.jsx` Tailwind classes + inline `style`) | — | Page-owned markup; mix of Tailwind dark: utilities + inline literals |
| Global header chrome | Browser/Client (`Layout.jsx` passes `style`+`darkMode` to ev-ui `Header`) | essentials CSS overrides | Header is ev-ui; bg set via Layout `style` prop, internals via `!important` |
| Web-font loading | Build/bundler (`@fontsource` import) OR CDN `@import` in `index.css` | — | Vite bundles self-hosted fonts; CDN is a network dependency |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Update the shared `@theme` dark tokens **globally** to Figma values — single source of truth, NOT a Results-scoped parallel palette. Other dark pages (Landing, profiles) shifting to the new palette is accepted. No token duplication.
- **D-02:** Target Figma dark palette:
  - Page background `#0d1117` (replaces `ev-navy #020618`)
  - Card/tile/control surface `#161b22` (replaces `ev-navy-card #1a2235`)
  - Primary text `#e6edf3` (replaces `#f3f4f6`)
  - Muted/secondary text `#8b949e` (replaces `#d1d5db`)
  - Accent teal `#00c8d7` (replaces dark `ev-teal-light #59b0c4`)
  - Hairline border `rgba(255,255,255,0.08)` (already matches — keep)
  - Border/divider slates `#2d3748` (default), `#4a5568` (emphasized/active)
- **D-03:** **Light mode must not regress.** Only the DARK token values change. Do NOT touch light teal `--ev-teal #00657c`. Verify light mode renders unchanged.
- **D-04:** No coral/alert color in Figma — **keep `ev-coral #ff5740`** for alerts/notices.
- **D-05:** Adopt Inter (body/UI) + Manrope (display/section labels) now; wire into type tokens. Add web-font loading.
- **D-06:** Section/eyebrow label = Manrope SemiBold, 12px, `uppercase`, letter-spacing `1.2px`, teal `#00c8d7`. Hero title = Manrope Bold 30px / 36px lh / `-0.75px` tracking.
- **D-07:** Type scale: 12px/16lh, 14px/20lh, 16px, 30px/36lh. Weights Regular(400)+SemiBold(600) dominant; Bold(700) ONLY on the hero title. Reconcile into tokens, not inline.
- **D-08:** Scope = Results main content + global top nav/header chrome (`Layout.jsx` + ev-ui `Header`). Theme via `!important` overrides in essentials `src/index.css` — **no ev-ui repo change**. Do NOT theme Landing/profile bodies.
- **D-09:** **Minimal re-theme only** of `FilterBar.jsx` + the tab strip — dark-legible (correct colors, no light bleed, no faint gray). No full Figma restyle (Phase 170 reworks this area). Keep 44px touch targets.

### Claude's Discretion
- Exact token names/structure in `index.css` (`@theme` keys), how Inter/Manrope are loaded (self-hosted vs CDN), and the precise `!important` override selectors.
- Whether to keep old token names (e.g. `ev-navy`) with new values, or rename — as long as it stays a single source of truth and light mode is preserved.

### Deferred Ideas (OUT OF SCOPE)
- Section banners + continuous scroll + tier-sort removal → **Phase 170**.
- Banner art + sourcing pipeline → **Phase 171**.
- Elections page dark treatment + banner parity → **Phase 172**.
- Landing page + politician/candidate profile pages full dark redesign → future (they inherit the new global palette from D-01, but layout/treatment is out of v19.0 scope).
- ROADMAP.md "Phase 171" section body mis-stitch — fix when planning 171/172, not a 169 blocker.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DARK-01 | Extract/reconcile dark tokens into `src/index.css` as single source of truth (color + type + radius); adopt Inter+Manrope | Token Inventory below enumerates exact `@theme` keys + every literal-hex consumer; Font Wiring section gives the Tailwind v4 `--font-*` + `@fontsource` approach |
| DARK-02 | Results renders in the Figma dark treatment (+ global header chrome) | Results/Layout/FilterBar touchpoint tables below list exact lines + ev-ui Header dark-internals that need `!important` overrides |

---

## Token Inventory (HIGHEST PRIORITY — light-mode safety)

### `@theme` dark tokens defined in `src/index.css` (lines 13–27)

These are the *dark* palette tokens. Tailwind v4 compiles `--color-ev-navy` into the utility class `bg-ev-navy` / `text-ev-navy` / `border-ev-navy`, etc.

| Token (line) | Current value | New value (D-02) | Consumed via |
|--------------|---------------|------------------|--------------|
| `--color-ev-navy` (L20) | `#020618` | `#0d1117` | `dark:bg-ev-navy` (page bg) — Results L1535, L1616; Landing, Citations, Profile, CandidateProfile, LegislativeRecord |
| `--color-ev-navy-card` (L21) | `#1a2235` | `#161b22` | `dark:bg-ev-navy-card` — Results L1855, banners; Landing; CompassCard L308 |
| `--color-ev-navy-elevated` (L22) | `#1e2a3a` | (not in D-02 — see Open Q1) | `dark:bg-ev-navy-elevated` — Landing L340; hover states |
| `--color-ev-teal-light` (L24) | `#59b0c4` | `#00c8d7` | `dark:text-ev-teal-light` / `dark:border-ev-teal-light` — Results tabs L1794/1804, banners; Landing (many); LocalityMatches |
| `--color-ev-coral` (L25) | `#ff5740` | KEEP (D-04) | alerts |
| `--color-ev-black` (L23) | `#1c1c1c` | — | — |
| `--color-ev-blue` (L26) | `#3b82f6` | — | — |

### `:root` LIGHT tokens (lines 29–36) — DO NOT TOUCH (D-03)

| Token | Value | Note |
|-------|-------|------|
| `--ev-bg-light` | `#f0f8fa` | light page bg — leave |
| `--ev-teal` | `#00657c` | **light teal — D-03 explicitly forbids touching** |
| `--ev-teal-dark` | `#004d5c` | light hover — leave |
| `--ev-coral` | `#ff5740` | leave |
| `--ev-light-blue` | `#59b0c4` | ⚠ **shares the old dark value but is a SEPARATE light-mode token** — see Pitfall 1 |
| `--ev-yellow` | `#fed12e` | leave |

**Critical separation:** the dark accent (`--color-ev-teal-light`) and the light `--ev-teal`/`--ev-light-blue` are distinct tokens. Changing `--color-ev-teal-light` to `#00c8d7` does NOT touch light mode. ✅ The token model already cleanly separates light/dark — confirmed safe to change dark values in isolation.

### Literal-hex usage that BYPASSES tokens (the real work)

These hardcode the *old dark* values inline and will NOT update when tokens change. Each must be repointed on the in-scope surfaces. `[VERIFIED: grep src/]`

**In `src/index.css` (`.dark .ev-*` override blocks):** literal `#1a2235` (L122,141,190,235,246,293), `#1e2a3a` (L127,298), `#f3f4f6` (L46,132,147,211,252,265), `#d1d5db` (L53,136,169,195,219,245,256,261,295), `#59b0c4` (L159,341,347), `#9ca3af`/`#9CA3AF` (muteds in profile/committee blocks). These are the override blocks that re-color ev-ui inline styles; for in-scope surfaces (PoliticianCard, gov-body-section, header) they must move to the new palette.

**In `src/components/Layout.jsx` (L62–65):** header dark `style` prop hardcodes `backgroundColor: '#020618'` → must become `#0d1117`. Border already `rgba(255,255,255,0.08)` ✅.

**In `src/components/FilterBar.jsx` (L26–28, 62, 82–87, 159):** `#1a2235`, `#59b0c4`, `#2d3f5a`, `#d1d5db`, `#9ca3af`, `#00657c` (light), `#6b7280` — minimal re-theme per D-09 (repoint dark literals to new palette, keep 44px). Note `#2d3f5a` is an existing FilterBar-only border slate (not a token); D-02 introduces `#2d3748`/`#4a5568` as the canonical slates.

**In `src/pages/Results.jsx`:** `#1a2235` (L1427 compassBg, L1438 card style), `#2d3f5a` (L1438), `#59b0c4` (L1892, L1916 tier labels), `#fffef5`/`#fed12e` (candidate accents — keep), tab classes use `dark:text-ev-teal-light` (token ✅, auto-updates). The tier-label inline `#59b0c4` (L1892/1916) should become the accent `#00c8d7` (eyebrow label spec D-06).

**Out-of-scope files that will visually shift (accepted per D-01):** `Landing.jsx`, `Citations.jsx`, `Profile.jsx`, `CandidateProfile.jsx`, `LegislativeRecord.jsx`, `CompassCard.jsx`, `ElectionsView.jsx`, `VoterResourcesCard.jsx`, `MiniCompass.jsx`, `LocalityMatches.jsx` — these consume the dark tokens (and some hardcode `#59b0c4`). They WILL change color when tokens change. D-01 accepts the global shift; the planner should NOT re-theme them but SHOULD note they inherit the new palette, and decide whether their hardcoded-`#59b0c4` literals (e.g. MiniCompass L180, CompassCard L469/531, ElectionsView, VoterResourcesCard) get repointed now or left for the future redesign. **MiniCompass L180/CompassCard appear ON Results** (the overlay/stacked compass) — those `#59b0c4`/`#59B0C4` literals are visible on the in-scope surface and likely SHOULD be updated to `#00c8d7` so the Results compass matches the new accent.

## Font Wiring (Tailwind v4 + Vite)

### Current state
- `src/index.css` L2 loads **Manrope only** via Google Fonts CDN `@import` (`wght@400;500;600;700`). **Inter is NOT loaded** today.
- Global font is set imperatively: `html, body { font-family: 'Manrope', sans-serif; }` (L42). No `@theme --font-*` tokens exist.
- `package.json` has **no `@fontsource/*` deps** `[VERIFIED: package.json]`.
- ev-ui components set their own `fontFamily` inline (e.g. FilterBar uses `'Manrope', sans-serif` inline) — those won't pick up a token automatically.

### Recommended approach (self-host via @fontsource) `[CITED: tailwindcss.com/docs/font-family + fontsource.org]`
Tailwind v4 registers font families as theme tokens with the `--font-*` namespace, which generates `font-sans` / `font-display` utilities and exposes `var(--font-sans)`:

```css
/* src/index.css @theme block */
@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;     /* body/UI (D-05) */
  --font-display: "Manrope", ui-sans-serif, system-ui, sans-serif; /* display/labels (D-05) */
}
```

Loading: prefer **self-hosting via `@fontsource`** over the CDN `@import` for performance/privacy/offline-build resilience and to avoid a third network dependency at runtime:

```bash
npm install @fontsource/inter @fontsource/manrope   # VERIFY on npm before install (see audit)
```
```js
// src/main.jsx — import the weights actually used (400, 600, + 700 for Manrope hero)
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
```
Then set the global default: `html, body { font-family: var(--font-sans); }` (replaces the hardcoded `'Manrope'`), and apply `font-display`/Manrope to the eyebrow labels + hero title.

**Alternative (CDN, lower effort):** keep/extend the existing Google Fonts `@import` to add Inter alongside Manrope. Tradeoff: runtime network dependency + render-blocking; the project already does this for Manrope so it is a known-working path. Either is acceptable (Claude's Discretion D-05); self-host is the stronger recommendation. **Do not remove the Manrope `@import` until the self-hosted load is confirmed**, or the app loses its current font.

### Build-safety note (PROJECT rule)
The `@source not "../.planning";` / `@source not "../**/*.md";` hardening at L8–9 of `index.css` MUST remain — Tailwind v4 auto-scans the git tree and Windows backslash paths in committed `.md` crash the build. Do not introduce raw `\` Windows paths in any committed file this phase. `[VERIFIED: index.css L4-9 + MEMORY feedback_tailwind_scans_planning_md]`

## ev-ui Header / Section dark theming

### How Layout passes theme to the Header
`Layout.jsx` (L53–66) renders ev-ui `<Header darkMode={isDark} style={isDark ? {backgroundColor:'#020618', borderBottom:'1px solid rgba(255,255,255,0.08)'} : undefined} … />`. So:
- **Header background** is controlled by the `style` prop in essentials → change `#020618` → `#0d1117` (one-line edit, no override needed).
- **Header internals** (logo text, profile-menu trigger, nav text) are styled by ev-ui's internal `darkMode` palette, which hardcodes the OLD values: `darkMode ? "#f3f4f6"` (primary text), `"#d1d5db"`, `"#59b0c4"` (accent), `"#1a2235"` (surface), `"#9ca3af"`/`"#6b7280"` (muted). `[VERIFIED: node_modules/@empoweredvote/ev-ui/dist/index.mjs]` These will keep the old palette unless overridden.

### Override hooks available
ev-ui's `<Header>` root is `<header style={…}>` with **no root class** — but children carry stable classes: `ev-header-cta`, `ev-header-secondary`, `ev-header-nav`, `ev-header-mobile-menu`, `ev-header-mobile-toggle` `[VERIFIED: dist grep]`. The mobile toggle is already targeted (`.ev-header-mobile-toggle`, L308). To re-color header text/menu in dark, add `.dark .ev-header-secondary`, `.dark .ev-header-nav`, `.dark .ev-header-mobile-menu` `{ color: … !important }` blocks. Because `<header>` itself has no class, target it via the page wrapper or accept that its bg is fully owned by the Layout `style` prop (which is the cleaner path).

### Section components on Results
- `ev-gov-body-section` — jurisdiction header; its `[role="button"] span` is already forced to `#59b0c4` in dark (L340–341). Repoint to `#00c8d7` (D-02 accent + the section-header reserved-accent list).
- `ev-subgroup-grid` / `SubGroupSection` labels — light-mode label color fixed at L353 (`html:not(.dark)`); the dark label color comes from ev-ui inline (`letter-spacing: 0.8px` spans). May need a `.dark` override to hit the eyebrow style (D-06).
- `ev-politician-card` — dark bg `#1a2235`→`#161b22` (L122), hover `#1e2a3a` (L127), `h3` `#f3f4f6`→`#e6edf3` (L132), `p` `#d1d5db`→`#8b949e` (L136), border already `rgba(255,255,255,0.08)` ✅. **Shape/size preserved** — only these colors change (success #4).

### Established override pattern (reuse verbatim)
`.dark .ev-<component> { property: <value> !important; }` — required because ev-ui renders inline styles. Long-standing project rule. `[VERIFIED: index.css + MEMORY feedback_dark_mode_ev_ui_important]`

## Results.jsx theming touchpoints

| Area | Lines | Current literal / class | Action |
|------|-------|-------------------------|--------|
| Page shell bg | L1535, L1616 | `dark:bg-ev-navy` | token auto-updates to `#0d1117` ✅ |
| Card wrapper bg/border | L1427, L1438 | `#1a2235`, `#2d3f5a` (inline) | repoint to `#161b22` + slate `#2d3748`; consider tokenizing |
| Card wrapper radius | L1457 | `borderRadius: 10` | control radius — keep 10 (D); card-surface radius 14 applies to the PoliticianCard, which is preserved |
| MiniCompass overlay bg | L1486, L1506 | `compassBg = #1a2235` | repoint to `#161b22` |
| Tier section eyebrow labels | L1892, L1916 | inline `#59b0c4` | repoint to accent `#00c8d7` + Manrope eyebrow style (D-06) |
| Tier section bg (light only) | L1889, L1913 | `tierStyle.bg` gated `!isDark` | light-only; do not touch |
| Tab strip active state | L1794, L1804 | `dark:text-ev-teal-light` + `dark:border-ev-teal-light` | token auto-updates ✅; verify legibility |
| Tab strip inactive | L1795, L1805 | `dark:text-gray-500`, `dark:hover:text-gray-300` | check faint-gray-on-dark; `gray-500` (#6b7280) on `#0d1117` ≈ borderline — may need lift to `#8b949e` |
| Tab strip divider | L1789 | `dark:border-gray-800` | minimal re-theme; ok or move to hairline |
| Precision/locality banners | L1028, L1855 | `dark:bg-ev-navy-card`, `dark:border-ev-teal-light` | tokens auto-update ✅ |
| Treasury link | L1939 | `dark:text-[#59b0c4] dark:hover:text-[#7ec8d8]` | repoint accent `#00c8d7`; keep `#7ec8d8` hover (D color spec) |
| Error message | L1846 | `text-red-600 bg-red-50` (no dark variant) | ensure dark-legible (D copywriting contract) |
| Empty-state text | L1895, L1902 | `dark:text-gray-400` | check contrast — `gray-400` (#9ca3af) ok but consider `#8b949e` floor |

**FilterBar (D-09 minimal):** repoint the dark literals in FilterBar.jsx (`#1a2235`→`#161b22`, `#59b0c4`→`#00c8d7`, `#2d3f5a`→`#2d3748`, `#d1d5db`→`#8b949e` for muted text, `#9ca3af` muted) — keep all geometry + 44px. The chevron SVG uses URL-encoded `%2359b0c4` (L29) → `%2300c8d7`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color/type token system | A new JS theme object or context | Tailwind v4 `@theme` CSS vars (already the source of truth) | Compiles to utilities + `var()`; single source already exists |
| Dark/light switch | New toggle logic | Existing `useTheme.js` + `.dark` class + `index.html` boot script | Already cross-domain (cookie + localStorage), FOUC-safe |
| ev-ui re-skinning | Forking/patching ev-ui | `.dark .ev-* !important` overrides in essentials | D-08 forbids ev-ui change; established pattern |
| Self-hosted font pipeline | Manual `@font-face` + woff files | `@fontsource/inter`, `@fontsource/manrope` | Pre-packaged subsets + weights, Vite-bundled |
| Depth/elevation | `box-shadow` cards | surface contrast `#0d1117`→`#161b22` + 8% hairline | Figma is GitHub-dark, no shadows (D specifics) |

**Key insight:** Almost everything needed already exists. The phase's value is *reconciliation and de-duplication of literals*, not building new infrastructure. The temptation to "tokenize everything" should be bounded to in-scope surfaces (Results/Layout/FilterBar/index.css overrides); a full literal-hex sweep of the whole app is Phase-170+ territory.

## Common Pitfalls

### Pitfall 1: Confusing the two `#59b0c4` tokens
**What goes wrong:** `--color-ev-teal-light` (dark accent, L24) and `--ev-light-blue` (light `:root`, L34) both equal `#59b0c4` today. A naive "find and replace `#59b0c4` → `#00c8d7`" hits both and changes light mode.
**How to avoid:** Change only `--color-ev-teal-light` (the dark token). Leave `--ev-light-blue` and `--ev-teal` untouched. For literal `#59b0c4` occurrences, only repoint those gated behind `.dark`/`dark:` or `isDark`.
**Warning signs:** Light-mode accent shifts cyan; light teal links change.

### Pitfall 2: ev-ui hardcodes the old palette internally
**What goes wrong:** After token rename, the global header text / profile menu / any ev-ui dark surface still shows `#1a2235`/`#59b0c4`/`#f3f4f6` because ev-ui's compiled `darkMode` palette is hardcoded and won't read your tokens.
**How to avoid:** Override with `.dark .ev-* { … !important }`. For the Header, set bg via the Layout `style` prop and internals via `.dark .ev-header-*` overrides.
**Warning signs:** Header looks navy-blue while page body is GitHub-dark; mismatched accent teal between cards and header.

### Pitfall 3: Light-mode regression from shared override blocks
**What goes wrong:** Editing `.dark .ev-politician-card` etc. is safe, but the bottom-of-file `html:not(.dark)` WCAG fixes (L353–358) must remain; deleting/refactoring index.css can drop them.
**How to avoid:** Preserve the `html:not(.dark)` blocks verbatim. Only touch `.dark`-scoped rules and dark token values.
**Warning signs:** Light-mode meta labels go faint (<4.5:1) again.

### Pitfall 4: Faint-gray-on-dark with the new darker page (#0d1117)
**What goes wrong:** `#0d1117` is darker than the old `#020618`? No — `#020618` is actually darker. But `#161b22` cards are *lighter* than old `#1a2235`'s perceived depth, and several mutes use `gray-400/500/9ca3af`. Tab inactive `dark:text-gray-500` (#6b7280) on `#0d1117` ≈ 3.9:1 — borderline.
**How to avoid:** Floor muted readable text at `#8b949e` (passes ~5.4:1 on `#0d1117`). Audit `gray-500`/`gray-400` usages on in-scope surfaces.
**Warning signs:** Inactive tab labels, empty-state copy hard to read.

### Pitfall 5: Breaking the Tailwind build via planning-dir scan
**What goes wrong:** Adding new committed `.md` (like this file) with raw Windows `\` paths crashes the v4 build.
**How to avoid:** Keep `@source not` lines; avoid raw backslash paths in committed files.

## Code Examples

### Token block after reconciliation (illustrative)
```css
/* src/index.css — keep names, change dark VALUES only (D-01/D-02) */
@theme {
  --color-ev-navy: #0d1117;        /* was #020618 — page bg */
  --color-ev-navy-card: #161b22;   /* was #1a2235 — surface */
  --color-ev-navy-elevated: #1e2a3a; /* see Open Q1 */
  --color-ev-teal-light: #00c8d7;  /* was #59b0c4 — dark accent */
  --color-ev-coral: #ff5740;       /* keep (D-04) */
  --color-ev-slate: #2d3748;       /* new divider (D-02) */
  --color-ev-slate-strong: #4a5568;/* new emphasized (D-02) */
  --color-ev-text-primary: #e6edf3;/* new (D-02) */
  --color-ev-text-muted: #8b949e;  /* new floor (D-02) */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Manrope", ui-sans-serif, system-ui, sans-serif;
}
/* :root LIGHT tokens unchanged (D-03) */
```

### Eyebrow / section label (D-06)
```css
/* Manrope SemiBold 12px uppercase tracking 1.2px teal accent */
.dark .ev-gov-body-section [role="button"] span {
  color: #00c8d7 !important;           /* was #59b0c4 (L341) */
  font-family: var(--font-display);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.2px;
}
```

### Header bg fix (Layout.jsx)
```jsx
style={isDark ? {
  backgroundColor: '#0d1117',          // was '#020618'
  borderBottom: '1px solid rgba(255,255,255,0.08)',
} : undefined}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` `theme.extend` | Tailwind v4 CSS-first `@theme` block in CSS | Tailwind v4 (Jan 2025) | Tokens live in `index.css`; project already uses this |
| `@font-face` hand-rolled / CDN | `@fontsource` self-host or `@theme --font-*` | current | Recommended self-host path |

**Deprecated/outdated:** No `tailwind.config.js` exists (v4 CSS-first). Don't reintroduce one.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `@fontsource/inter` + `@fontsource/manrope` are the correct package names | Font Wiring | Low — verify on npm before install (audit gate); CDN `@import` is a known-working fallback already used for Manrope |
| A2 | ev-ui Header `<header>` has no root class hook (only `ev-header-*` children) | Header theming | Low — verified by dist grep; if wrong, simply more selectors available |
| A3 | `gray-500`/`#6b7280` tab-inactive on `#0d1117` is ~3.9:1 (borderline) | Pitfall 4 | Low — exact ratio should be re-checked; the mitigation (floor at `#8b949e`) is safe regardless |

## Open Questions

1. **`--color-ev-navy-elevated #1e2a3a` not in D-02.** It's used for card hover (index.css L127) and Landing (L340). D-02 gives no "elevated" value. Recommendation: derive a GitHub-dark elevated surface (e.g. `#1c2128` or `#21262d`, GitHub's `canvas.overlay`/`subtle`) for the card hover, or keep `#1e2a3a` for now since hover is subtle and out-of-Figma. Flag for planner to pick one value; not a blocker.
   - What we know: D-02 specifies page + surface but not hover/elevated.
   - What's unclear: exact Figma hover token.
   - Recommendation: use `#21262d` (GitHub canvas.subtle) for `.dark .ev-politician-card:hover` to stay in-family; confirm visually.

2. **Slate `#2d3f5a` (FilterBar/Results inline) vs D-02 slate `#2d3748`.** The existing inline border slate is `#2d3f5a` (bluish), D-02 introduces `#2d3748` (neutral). Recommendation: replace in-scope `#2d3f5a` with `#2d3748` for consistency.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node/npm | install @fontsource | ✓ (project builds) | — | — |
| `@fontsource/inter` | Inter self-host (D-05) | ✗ (not installed) | — | Google Fonts CDN `@import` (already used for Manrope) |
| `@fontsource/manrope` | Manrope self-host | ✗ (not installed) | — | Existing CDN `@import` (keep as-is) |
| Tailwind CSS 4 | token compile | ✓ | `^4.1.12` | — |
| Figma MCP | pull design context if needed | ✓ (server present) | — | `scratchpad/figma/essentials-design.png` screenshot |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** `@fontsource/*` — fallback is the existing Google Fonts CDN `@import` (extend to add Inter). Either path satisfies D-05.

## Package Legitimacy Audit

This phase MAY install `@fontsource/inter` + `@fontsource/manrope` (only if self-host path chosen; the CDN fallback installs nothing).

slopcheck was not run in this research session (no network/tool invocation made for it). Per protocol, the two candidate packages are therefore tagged `[ASSUMED]` and the planner should gate their install behind a `checkpoint:human-verify` (or simply run `npm view @fontsource/inter version` / `npm view @fontsource/manrope version` at execution time). These are extremely well-known packages (the official Fontsource project, millions of weekly downloads, `github.com/fontsource/fontsource`), so risk is low — but verify on the npm registry at execution time before installing.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `@fontsource/inter` | npm | well-established (ASSUMED) | very high (ASSUMED) | github.com/fontsource/fontsource | not run | [ASSUMED] — verify `npm view` before install |
| `@fontsource/manrope` | npm | well-established (ASSUMED) | very high (ASSUMED) | github.com/fontsource/fontsource | not run | [ASSUMED] — verify `npm view` before install |

**Packages removed due to slopcheck [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Validation Architecture

> nyquist_validation is enabled. CSS/token theming is largely **visually** verified; there is no automated CSS-rendering harness in this repo and none should be invented for this phase.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `^4.1.4` (`npm run test` → `vitest run`) |
| Config file | none dedicated — uses Vite defaults via `vite.config.js` (no `test:` block) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test` |
| Existing tests | `src/lib/*.test.js` (pure logic: classify, compass, candidatePhoto, groupHierarchy) — NO component/CSS tests |

The existing test suite is logic-only and will be **unaffected** by this phase. There is no jsdom/RTL setup; do not add a heavyweight component-render test harness for a token/CSS change (out of proportion to the work).

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DARK-01 | Build compiles with new tokens + fonts (no Tailwind crash) | build/smoke | `npm run build` | ✅ (vite build) |
| DARK-01 | Existing logic tests still green (no regression) | unit | `npm run test` | ✅ existing |
| DARK-02 | Results renders dark Figma palette | manual/visual | dev server + Results page in dark mode | ❌ visual-only |
| DARK-02 | Light mode unchanged | manual/visual diff | toggle theme, compare light Results/Landing to pre-change | ❌ visual-only |
| DARK-02 | No faint-gray-on-dark | manual + contrast check | inspect muted text ≥ `#8b949e` on `#0d1117`; spot-check with a contrast tool | ❌ visual-only |
| DARK-02 | PoliticianCard shape/size unchanged | manual/visual | compare card geometry before/after (re-color only) | ❌ visual-only |

### Sampling Rate
- **Per task commit:** `npm run build` (catches Tailwind `@source`/token compile failures) + `npm run test` (logic regression).
- **Per wave merge:** full `npm run build` + manual dark/light Results walkthrough.
- **Phase gate:** build green + logic tests green + manual visual sign-off on (a) Results dark matches Figma, (b) light mode unchanged, (c) header chrome matches page, (d) no faint-gray, (e) PoliticianCard geometry preserved — these map 1:1 to the 5 success criteria.

### Wave 0 Gaps
- None — existing build + logic test infrastructure is sufficient. No new test files or framework install needed for a CSS/token phase. (If the planner wants a guardrail, a tiny assertion test that `src/index.css` still contains the `@source not` lines and the `:root` light tokens is cheap insurance against light-mode regression, but it is optional.)

## Security Domain

Not applicable in the traditional sense — this is a client-side CSS/token + font-loading change with no auth, input handling, data, or crypto. The only adjacent concern is the **supply-chain risk of the new font packages**, addressed in the Package Legitimacy Audit above (verify `@fontsource/*` on npm before install; the CDN fallback adds a third-party network/runtime dependency — Google Fonts — which the project already accepts for Manrope). No ASVS category materially applies; V5 (input validation) and V6 (crypto) are not engaged by this phase.

## Sources

### Primary (HIGH confidence)
- `src/index.css` (read in full) — token definitions, override blocks, `@source` hardening, light WCAG fixes.
- `src/components/Layout.jsx`, `src/components/FilterBar.jsx`, `src/pages/Results.jsx` (relevant ranges) — touchpoints.
- `node_modules/@empoweredvote/ev-ui/dist/index.mjs` (grep) — ev-ui class names + hardcoded dark palette (`#1a2235`/`#59b0c4`/`#f3f4f6`/`#d1d5db`), Header structure (no root class; `ev-header-*` children), `darkMode` prop handling.
- `package.json`, `index.html`, `vite.config.js` — deps, font load state, theme boot, test/build commands.
- Grep sweep across `src/` for `#020618|#1a2235|#59b0c4|#f3f4f6|#d1d5db|#1e2a3a|ev-navy|ev-teal-light` — full literal-usage enumeration.
- `169-CONTEXT.md`, `169-UI-SPEC.md` — locked decisions D-01..D-09.

### Secondary (MEDIUM confidence)
- Tailwind v4 `@theme`/`--font-*` namespace + font-family token behavior (training + tailwindcss.com docs convention).
- Fontsource self-host pattern (`@fontsource/<font>/<weight>.css` imports).

### Tertiary (LOW confidence)
- Exact WCAG contrast ratio for `#6b7280` on `#0d1117` (Pitfall 4) — directional estimate; mitigation is safe regardless.

## Metadata

**Confidence breakdown:**
- Token inventory / light-mode safety: HIGH — every consumer enumerated by grep; light/dark token separation verified.
- ev-ui Header/section theming: HIGH — internals read directly from compiled dist.
- Font wiring: MEDIUM — package names ASSUMED (verify on npm); both self-host and CDN paths are viable.
- Validation: HIGH — test/build commands confirmed; correctly scoped as visual-verified.

**Research date:** 2026-06-24
**Valid until:** ~2026-07-24 (stable; only ev-ui version bump or Tailwind major would invalidate)
