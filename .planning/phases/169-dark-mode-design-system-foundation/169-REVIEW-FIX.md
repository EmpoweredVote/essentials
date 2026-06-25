---
phase: 169-dark-mode-design-system-foundation
fixed_at: 2026-06-24T18:21:00Z
review_path: .planning/phases/169-dark-mode-design-system-foundation/169-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 169: Code Review Fix Report

**Fixed at:** 2026-06-24T18:21:00Z
**Source review:** .planning/phases/169-dark-mode-design-system-foundation/169-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-03, WR-04 — WR-02 deferred by instruction)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-03: getFeedbackUrl shim — corrected comment and attribution params

**Files modified:** `src/components/Layout.jsx`
**Commits:** `6e04538`, `29fc16f`
**Applied fix:** The stale shim comment incorrectly cited ev-ui 0.7.2; installed
package is 0.9.6 which does export `getFeedbackUrl`. However a local
`../ev-ui/dist` alias in vite.config.js (present in dev environment) overrides
node_modules and that local build lacks the export — so a direct
`import { Header, getFeedbackUrl } from "@empoweredvote/ev-ui"` breaks the
build. Kept the shim but replaced the bare `"https://empowered.vote/feedback"`
return with a full attribution-params implementation matching the real
`getFeedbackUrl` signature: appends `?feature=<value>&url=<window.location.href>`.
Updated the comment to state the true installed version (0.9.6), explain the
local alias blocker, and include a migration comment for when the local build
is updated. The `feedbackItem` onClick already called `getFeedbackUrl()` from
the first commit; the corrected shim now passes `{ feature: 'essentials' }`.

Note: commit 6e04538 transiently held the broken direct-import form; commit
29fc16f is the final correct state. `npm run build` and `npm test` (47/47)
both pass against 29fc16f.

### WR-01: Stale dark-navy literals aligned to migrated token values

**Files modified:** `src/index.css`
**Commit:** `390f931`
**Applied fix:** Six dark-scoped rules still hardcoded the pre-migration palette
values after the Phase 169 @theme token migration. Replaced all six:

| Rule | Old value | New value |
|------|-----------|-----------|
| `.dark .ev-politician-profile > div` | `#1a2235` | `#161b22` |
| `.dark [role="region"][aria-label="Compass legend"]` | `#1a2235` | `#161b22` |
| `.dark .ev-legislative-record-wrapper [style*="background"]` | `#1a2235` | `#161b22` |
| `.dark .ev-legislative-record-wrapper select` | `#1a2235` | `#161b22` |
| `.dark .stance-btn` background | `#1a2235` | `#161b22` |
| `.dark .stance-btn:hover` background | `#1e2a3a` | `#21262d` |

Light-mode `:root` block (`--ev-light-blue: #59b0c4`, `--ev-teal: #00657c`)
and all `html:not(.dark)` rules are byte-for-byte unchanged. Post-fix grep
confirms zero occurrences of `#1a2235`, `#1e2a3a`, or `#2d3f5a` in any
`.dark`-scoped rule in index.css.

### WR-04: Eyebrow teal raw literal replaced with CSS token

**Files modified:** `src/pages/Results.jsx`
**Commit:** `702c734`
**Applied fix:** Both tier-label eyebrow `<span>` elements (empty-tier state
at ~L1892 and main render at ~L1916) used the raw `#00c8d7` literal as the
dark-mode color. Replaced both with `var(--color-ev-teal-light)` so a future
palette change only requires updating the @theme token. The only remaining
`#00c8d7` in Results.jsx is a Tailwind `dark:text-[#00c8d7]` utility on the
Treasury link (a different element — intentional, not an eyebrow span). Behavior
is identical; the index.css D-06 rule is unmodified.

## Skipped Issues

None — all three in-scope findings were fixed.

---

_Fixed: 2026-06-24T18:21:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
