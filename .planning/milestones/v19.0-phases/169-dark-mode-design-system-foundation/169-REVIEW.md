---
phase: 169-dark-mode-design-system-foundation
reviewed: 2026-06-24T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - src/index.css
  - src/main.jsx
  - src/components/Layout.jsx
  - src/components/FilterBar.jsx
  - src/pages/Results.jsx
  - package.json
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 169: Code Review Report

**Reviewed:** 2026-06-24
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 169 migrates the dark-mode palette from the old hand-rolled navy set
(`#020618` / `#1a2235` / `#1e2a3a` / accent `#59b0c4`) to the Figma GitHub-dark
tokens (`#0d1117` / `#161b22` / `#21262d` / accent `#00c8d7`), adds D-02 text +
slate tokens and D-05 typography tokens, and replaces the Google Fonts
`@import` with self-hosted `@fontsource` packages.

Verified clean per the review-context risk list:
- **Light-mode values untouched.** The `:root` block (`--ev-light-blue: #59b0c4`,
  `--ev-teal: #00657c`, etc.) is byte-for-byte unchanged in the diff. The shared
  `#59b0c4` hex now lives only in light contexts (`--ev-light-blue`, the
  active-filter light border) — dark scopes correctly moved to `#00c8d7`.
- **Font wiring is correct.** `@fontsource/inter` and `@fontsource/manrope` are in
  `package.json`, the four imported CSS files exist on disk, and `@theme`
  `--font-sans`/`--font-display` reference `"Inter"`/`"Manrope"` matching the
  imported weights (Inter 400/600, Manrope 600/700).
- **PoliticianCard geometry is color-only.** The Results.jsx card diff changes only
  `backgroundColor`/`borderColor` hex values; `imageWidth`, `variant`, the 4:5
  geometry, and `contentVisibility`/`containIntrinsicSize` are unchanged.
- **`.dark` class wiring intact** (useTheme.js MutationObserver + `documentElement`).

The defects below are quality/consistency issues — primarily that the palette
migration was applied incompletely, leaving the OLD token hex literals scattered
through `index.css` and an adjacent shared component. No correctness or security
defects found.

## Warnings

### WR-01: Old navy-card/elevated hex literals left behind in index.css — palette migration is incomplete

**File:** `src/index.css:152, 201, 246, 257, 304, 309`
**Issue:** The phase migrated `--color-ev-navy-card` from `#1a2235` → `#161b22`
and `--color-ev-navy-elevated` from `#1e2a3a` → `#21262d`, and the diff updated the
`.ev-politician-card` rules accordingly. But six other dark-mode rules in the same
file still hardcode the OLD values:
- L152 `.dark .ev-politician-profile > div` → `#1a2235`
- L201 `.dark [role="region"][aria-label="Compass legend"]` → `#1a2235`
- L246 `.dark .ev-legislative-record-wrapper [style*="background"]` → `#1a2235`
- L257 `.dark .ev-legislative-record-wrapper select` → `#1a2235`
- L304 `.dark .stance-btn` background → `#1a2235`
- L309 `.dark .stance-btn:hover` background → `#1e2a3a`

This is a visible regression risk, not just cosmetic drift: a politician card now
paints at `#161b22` while the profile card, the CompassKey legend pill, the
LegislativeRecord surfaces, and the Stance Min/Max buttons sitting right beside the
legend still paint at the old `#1a2235`. Two adjacent "card" surfaces will render
slightly different shades of navy in dark mode. It also defeats the stated
single-source-of-truth goal — these are raw literals, not token references.
**Fix:** Replace the stale literals with the new token values (or, better,
`var(--color-ev-navy-card)` / `var(--color-ev-navy-elevated)` where a literal isn't
required). Concretely:
```css
.dark .ev-politician-profile > div { background-color: #161b22 !important; }
.dark [role="region"][aria-label="Compass legend"] { background: #161b22 !important; }
.dark .ev-legislative-record-wrapper [style*="background"] { background-color: #161b22 !important; }
.dark .ev-legislative-record-wrapper select { background-color: #161b22 !important; }
.dark .stance-btn { background: #161b22; /* … */ }
.dark .stance-btn:hover { background: #21262d; /* … */ }
```

### WR-02: Adjacent ElectionsView cards still use the OLD dark palette — visible mismatch beside migrated Results cards

**File:** `src/components/ElectionsView.jsx:710, 742, 775` (not in the phase diff, but a direct consequence of this phase)
**Issue:** `Results.jsx:1438` migrated its candidate/politician card inline style to
`{ backgroundColor: '#161b22', borderColor: '#2d3748' }`. `ElectionsView.jsx`
renders the same card pattern on the Elections tab of the same page and was left at
the old `{ backgroundColor: '#1a2235', borderColor: '#2d3f5a' }` (L710) plus two
more `#1a2235` option/cell backgrounds (L742, L775). Because the Elections view is
reached by a tab toggle on the very page being migrated, a user flipping tabs in
dark mode sees the card background shift from `#161b22` to `#1a2235`. The migration
should have covered this sibling.
**Fix:** Update ElectionsView's dark-mode inline literals to match the new palette
(`#161b22` background, `#2d3748` border) so the two tabs are consistent. (If the
phase scope deliberately excluded ElectionsView, add a follow-up task rather than
shipping the mismatch silently.)

### WR-03: Layout.jsx `getFeedbackUrl` shim comment is factually wrong; shim drops feedback attribution params

**File:** `src/components/Layout.jsx:9-11`
**Issue:** The comment states `getFeedbackUrl` "is available in ev-ui ≥0.9.5 but not
in the local build (0.7.2)." The installed package is **0.9.6** (`package.json`
pins `^0.9.6`; `node_modules/@empoweredvote/ev-ui/package.json` reports `0.9.6`) and
it **does** export `getFeedbackUrl` (confirmed at dist line 6872 with a real
implementation at line 1627). So the build-unblock rationale no longer holds — the
import would resolve. The inlined shim returns the bare base
`https://empowered.vote/feedback`, whereas the real `getFeedbackUrl()` appends
`?feature=<detected>&url=<window.location.href>` for feedback attribution. The shim
therefore silently strips the feature/source context the feedback system expects.
Per the review brief this was a deliberate build-unblock and is flagged, not
required to fix — but the comment is now misleading (wrong version, wrong claim) and
the dropped query params are a real behavioral regression for feedback routing.
**Fix:** Either restore the real import now that 0.9.6 exports it:
```js
import { Header, getFeedbackUrl } from "@empoweredvote/ev-ui";
```
and call `getFeedbackUrl({ feature: 'essentials' })`, or — if the shim must stay —
correct the comment to reflect the true installed version and note that
feature/url attribution is intentionally omitted.

### WR-04: D-06 eyebrow styling duplicated as raw inline literals in Results.jsx instead of using the tokens/CSS rule

**File:** `src/pages/Results.jsx:1892, 1916`
**Issue:** The phase added a D-06 eyebrow rule in `index.css:360-366`
(`.dark .ev-gov-body-section [role="button"] span` → `#00c8d7`, `var(--font-display)`,
600, uppercase, 1.2px). But the two tier-label spans in Results.jsx re-implement the
exact same eyebrow by hand with a raw `#00c8d7` literal and inline
`fontFamily: 'var(--font-display)', fontWeight: 600, textTransform: 'uppercase',
letterSpacing: '1.2px'`. The accent hex is duplicated (should be
`var(--color-ev-teal-light)`), so a future palette tweak must be made in three
places (css rule + two JSX spans) and they will drift. This is the same
single-source-of-truth violation as WR-01, in JSX form.
**Fix:** Reference the token for the color (`color: isDark ? 'var(--color-ev-teal-light)' : tierStyle.text`)
and, ideally, hoist the repeated eyebrow style object to a shared const so both tier
spans and the empty-tier span share one definition.

## Info

### IN-01: Muted card subtitle floored at `#8b949e` on `#161b22` — verify it clears the no-faint-gray bar

**File:** `src/index.css:148` (`.dark .ev-politician-card p`)
**Issue:** The diff darkened the card subtitle from `#d1d5db` to the muted floor
`#8b949e`. On the new card bg `#161b22`, `#8b949e` computes to roughly ~4.8:1 — above
WCAG AA for the project's stated "muted floored at #8b949e" rule, so this is
compliant. Noting only because it is the lowest-contrast text the phase introduces
and is the exact floor value; any future bg darkening must not drop it below 4.5:1.
**Fix:** None required; keep `#8b949e` as the documented muted floor and do not go
lighter-on-darker than this pairing.

### IN-02: Stale "Google Places Autocomplete" CSS retained while project uses plain-text address inputs

**File:** `src/index.css:60-97, 115-118`
**Issue:** The `.pac-container` / `.pac-item` / `.pac-matched` rules style Google
Places Autocomplete dropdowns. Project memory notes the app uses plain-text address
inputs (no Google Places autocomplete in the address flow), though
`useGooglePlacesAutocomplete` is still imported in Results.jsx. Not introduced by
this phase, but it is dead/near-dead styling carrying old light-mode hex (`#374151`,
`#111827`) with no dark-mode counterpart — if autocomplete ever renders in dark mode
it will be unstyled light text. Out of scope to remove here; flagging for awareness.
**Fix:** Confirm whether Places autocomplete is still wired; if not, delete the
`.pac-*` block. If it is, add `.dark` overrides so the dropdown isn't light-on-dark.

---

_Reviewed: 2026-06-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
