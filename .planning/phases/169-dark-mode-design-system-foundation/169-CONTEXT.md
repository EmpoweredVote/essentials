# Phase 169: Dark-Mode Design System Foundation - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Bring the **Results/Representatives page** to the Figma dark-mode treatment, driven by a **single
source of design tokens** in `src/index.css`. This phase establishes the dark-mode design-system
foundation (color, type, spacing tokens reconciled to the Figma style guide) and applies it to
Results + the global header chrome. Requirements: **DARK-01** (extract/reconcile tokens) and
**DARK-02** (Results renders in the Figma dark treatment).

**NOT this phase:** section banners + continuous scroll + tier-sort removal (Phase 170);
banner art (Phase 171); Elections page (Phase 172); any light-mode change; any tile shape/size
change; backend/DB.
</domain>

<decisions>
## Implementation Decisions

### Token strategy (DARK-01)
- **D-01:** Update the **shared `@theme` dark tokens globally** to the Figma values as the single
  source of truth — NOT a Results-scoped parallel palette. Other dark pages (Landing, profiles)
  will shift to the new palette too; that is accepted (net improvement, full redesign comes later).
  No token duplication.
- **D-02:** Target Figma dark palette (from the style-guide mockup, node `3957:563`):
  - Page background `#0d1117` (replaces `ev-navy #020618`)
  - Card/tile/control surface `#161b22` (replaces `ev-navy-card #1a2235`)
  - Primary text `#e6edf3` (replaces `#f3f4f6`)
  - Muted/secondary text `#8b949e` (replaces `#d1d5db`)
  - Accent teal `#00c8d7` (replaces dark `ev-teal-light #59b0c4`)
  - Hairline border `rgba(255,255,255,0.08)` (already matches — keep)
  - Border/divider slates `#2d3748`, `#4a5568`
- **D-03:** **Light mode must not regress.** Only the DARK token values change. The teal token is
  used in light mode too (`--ev-teal #00657c`) — the planner must touch only the *dark-specific*
  token(s), not light-mode teal. Verify light mode renders unchanged.
- **D-04:** No coral/alert color exists in the Figma mockup — **keep the existing `ev-coral #ff5740`**
  for alerts/notices (unopposed/no-candidate states etc.).

### Typography (DARK-01)
- **D-05:** **Adopt Inter + Manrope now.** Inter = body/UI; Manrope = display/section labels.
  Wire into the type tokens this phase (the "design system foundation"). Web-font loading is added;
  this sets the app-wide font family.
- **D-06:** Section/eyebrow label treatment = **Manrope SemiBold, 12px, `uppercase`, letter-spacing
  `1.2px`, teal `#00c8d7`** (the recurring "YOUR LOCATION" label style). Hero title = Manrope Bold
  30px / 36px line-height / `-0.75px` tracking.
- **D-07:** Type scale from the mockup: 12px/16lh (labels/meta, dominant), 14px/20lh (body/names),
  16px, 30px/36lh (hero). Weights: SemiBold + Regular dominant. Reconcile into tokens, not inline.

### Theme scope (DARK-02)
- **D-08:** Scope = **Results main content + the global top nav/header chrome** (`Layout.jsx` +
  ev-ui `Header`). The always-visible header must match the new dark page. Theme it via `!important`
  overrides in essentials `src/index.css` — **no ev-ui repo change** (the Header already receives an
  `isDark` prop; overrides live in essentials). Do NOT theme Landing/profile bodies (deferred).

### Filter row & tabs (DARK-02)
- **D-09:** **Minimal re-theme only** of `FilterBar.jsx` + the tab strip in 169 — make them
  dark-legible (correct colors, no light bleed, no faint-gray-on-dark). Phase 170 removes the tier
  dropdown and inserts banners, so a full Figma restyle of this area now would be thrown away.

### Claude's Discretion
- Exact token names/structure in `index.css` (`@theme` keys), how Inter/Manrope are loaded
  (self-hosted vs CDN), and the precise `!important` override selectors — implementation detail for
  the planner/executor, constrained by D-01..D-09 above.
- Whether to keep the old token *names* (e.g. `ev-navy`) with new values, or rename — planner's call,
  as long as it stays a single source of truth and light mode is preserved.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design source (Figma)
- Figma file `J9mfnUSnc2k6fUQDhw9L7h`, node `3957:563` ("Empowered Vote Style Guide" — Essentials
  dark mockup). Pull via Figma MCP `get_design_context` / `get_screenshot` / `get_variable_defs`.
  Full token extraction saved this session (colors/fonts/spacing) — see D-02/D-05/D-06/D-07.
- `scratchpad/figma/essentials-design.png` — downloaded screenshot of node 3957:563 for reference.

### Project specs
- `.planning/REQUIREMENTS.md` — v19.0 requirements (DARK-01, DARK-02 are this phase); "Existing
  infrastructure to reuse" section lists exact files.
- `.planning/ROADMAP.md` §"Phase 169" — goal + 5 success criteria (single-source-of-truth tokens,
  no faint-gray-on-dark, ev-ui `!important`, PoliticianCard unchanged, no light regression).

### Memory / prior decisions (apply)
- Dark-mode rule: ev-ui inline styles require `!important` on ALL dark overrides; never faint gray
  on dark backgrounds (long-standing project feedback — honor in every override).
- Tailwind v4 auto-scans `.planning/*.md`; avoid raw Windows backslash paths in committed files
  (`@source not` hardening already in `src/index.css`).
- ev-ui is a separate GitHub repo (local copy has no .git); this phase needs NO ev-ui change —
  theme via essentials overrides only.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.css` — has `@theme` block with existing dark tokens (`--color-ev-navy #020618`,
  `ev-navy-card #1a2235`, `ev-teal-light #59b0c4`, `ev-coral #ff5740`) + `:root` light vars
  (`--ev-bg-light`, `--ev-teal #00657c`) + `.dark .ev-*` `!important` override blocks. THIS is the
  single token source to update (D-01).
- `src/hooks/useTheme.js` — reads/writes `document.documentElement.classList` `dark` + `ev:color-scheme`
  localStorage + `ev_theme` cross-domain cookie. No change needed; drives the dark class.
- `src/components/PoliticianCard.jsx` — 4:5 tile; PRESERVE shape/size, re-color only (success crit #4).
- `src/components/FilterBar.jsx` — tier dropdown + type dropdown + name search + compass toggle;
  inline styles with `isDark` prop. Minimal re-theme only (D-09).

### Established Patterns
- Dark overrides for ev-ui components use `.dark .ev-<component> { ... !important }` in `index.css`
  because ev-ui renders inline styles. Section tier labels currently forced to teal `#59b0c4` on dark.
- `Layout.jsx` passes `isDark` to the ev-ui `Header`; theming the header = `!important` overrides
  in essentials, not an ev-ui change (D-08).

### Integration Points
- `src/pages/Results.jsx` (~L1907–1973) renders tier sections + `GovernmentBodySection` /
  `SubGroupSection` (ev-ui) + `renderPoliticianCard`. This is the primary surface to re-theme (DARK-02).
- Font wiring: add Inter + Manrope to the type tokens / global CSS; ensure `@source` safelist + build
  not broken (Tailwind v4).
</code_context>

<specifics>
## Specific Ideas

- The look is GitHub-dark-style (`#0d1117` page / `#161b22` surfaces / 8%-white hairline borders /
  no drop-shadows — depth comes from surface contrast + hairlines, not shadows). Match that: avoid
  adding shadows; use the hairline-border + surface-contrast approach.
- Card radius 14px, button/control radius 10px (radius differentiates card vs control in the mockup).
- "Single source of truth" is an explicit success criterion — no scattered inline color literals on
  Results; everything traces to `index.css` tokens.
</specifics>

<deferred>
## Deferred Ideas

- Section banners + continuous scroll + tier-sort removal → **Phase 170**.
- Banner art + sourcing pipeline → **Phase 171**.
- Elections page dark treatment + banner parity → **Phase 172**.
- Landing page + politician/candidate profile pages full dark redesign → future milestone (they will
  inherit the new global token palette from D-01, but their layout/treatment is out of v19.0 scope).
- **Roadmap defect to fix before Phase 171:** ROADMAP.md's "Phase 171" section body was mis-stitched
  by the roadmapper — its goal line says "Banner Asset Pipeline" but the requirements/criteria under
  it are the Elections-parity (Phase 172) content, plus a duplicate self-referential `Depends on`.
  Not a 169 blocker; fix when planning 171/172.
</deferred>

---

*Phase: 169-dark-mode-design-system-foundation*
*Context gathered: 2026-06-24*
