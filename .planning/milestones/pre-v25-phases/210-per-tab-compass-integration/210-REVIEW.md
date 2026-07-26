---
phase: 210-per-tab-compass-integration
reviewed: 2026-07-19T11:15:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/lib/compass.js
  - src/lib/compass.test.js
  - src/pages/Results.jsx
findings:
  critical: 1
  warning: 0
  info: 2
  total: 3
status: resolved
resolution: "CR-01 fixed in gap-closure Phase 210.1 (commit 2e5e5870). IN-01/IN-02 accepted as low-priority info notes."
---

# Phase 210: Code Review Report

**Reviewed:** 2026-07-19T11:15:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the phase-210 diff (`97d54e3f^..a5b200f3`) touching `src/lib/compass.js` (new `TAB_DEFAULTS` + `resolveTabLens`), `src/lib/compass.test.js` (new `describe('resolveTabLens')` block), and `src/pages/Results.jsx` (new `tabLensMemory` state, tab-entry `useEffect`, and `handleSelectLens` interception).

`resolveTabLens` itself is correct: it is pure, composes `isLensCalibrated` rather than re-deriving it, and provably resolves every input to a key that either exists+is-calibrated in `lenses` or degrades to `'custom'` (verified against the unit tests, which pass — `npx vitest run src/lib/compass.test.js` → 35/35 green). The `handleSelectLens`-write-before-`setActiveLens` ordering, the `effectiveActiveView === 'elections'` early return, and the exclusion of `activeLensKey` from the tab-entry effect's deps are all implemented exactly as specced, and no dead code (`computeVariant`, `CompassCardVertical`, `deriveScopedTopics`, `switchView`, the `effectiveActiveView` `useMemo`) was touched.

However, tracing the tab-entry effect's interaction with the **pre-existing** "auto-select lens on return from calibration" effect in `CompassContext.jsx:447-456` (which this phase's `<read_first>` list explicitly pointed at but whose write path was never wired into `tabLensMemory`) surfaces a real cross-effect race that silently discards a user's just-completed lens calibration. This is filed as CR-01 below. Two Info-level process/quality notes round out the findings.

## Critical Issues

### CR-01: Tab-entry effect can silently discard a lens the user just calibrated via "Calibrate" (return-from-calibration race)

> **✅ RESOLVED — Phase 210.1 (commit `2e5e5870`).** `src/pages/Results.jsx` now seeds
> `tabLensMemory[activeView]` from the pending-calibration marker (`loadLensPending()`) on the
> return mount, keyed on the raw `activeView` URL param and running once on mount only (the
> calibrate flow always does a full-page navigation). This records the calibration as the tab's
> explicit pick BEFORE any later async `rawUserAnswers`/`lenses` re-fire of the tab-entry effect,
> so `resolveTabLens` resolves to the calibrated key instead of reverting to the tab default. The
> tab-entry effect, `resolveTabLens`, and the localStorage marker protocol were left unchanged;
> `npm run build` and `npx vitest run` (211/211) both pass. A live re-check of the exact
> calibrate-and-return sequence remains a recommended manual follow-up (see 210.1 SUMMARY).

**File:** `src/pages/Results.jsx:1480-1484` (new tab-entry effect), interacting with `src/contexts/CompassContext.jsx:447-456` (pre-existing pending-lens auto-select effect) and `src/pages/Results.jsx:598-602` (`handleCalibrateLens`)

**Issue:**
`handleCalibrateLens` (unchanged by this phase) redirects the user off-site to calibrate an *uncalibrated* lens and, on return, `CompassContext`'s pre-existing pending-lens effect applies that lens via `setActiveLens(pendingKey)` once it becomes calibrated — but it does **not** know about `tabLensMemory`, and nothing in this phase's diff teaches it to write into `tabLensMemory[effectiveActiveView]`. `handleSelectLens` (the *only* place that records `tabLensMemory` in this phase) is never invoked on this path — the pending-effect calls `setActiveLens` directly.

Concretely:
1. User is on the Judges tab (`TAB_DEFAULTS.judges = 'judicial'`, still uncalibrated). They select/calibrate a *different* lens (e.g. `'federal'`) via the chip row's `onCalibrate` → `handleCalibrateLens('federal')` → `saveLensPending('federal')` → full-page redirect to `compass.empowered.vote`, then back to the `return` URL (a fresh mount of `Results.jsx`, `?view=judges` preserved in the return URL).
2. On the fresh mount, `tabLensMemory` re-initializes to `{}` (by design — D-02, session-only memory). `CompassContext.loadCompassData` fires `fetchLenses()` **non-blocking** (`CompassContext.jsx:140-142`) and separately awaits topics/answers/verdicts before calling `setCompassDataLoaded(true)` (`CompassContext.jsx:278`).
3. Once `compassDataLoaded` flips true, `CompassContext`'s pending effect (`CompassContext.jsx:447-456`) sees `pendingKey === 'federal'`, finds it now calibrated, and calls `setActiveLens('federal')`, then `clearLensPending()`.
4. **Any subsequent re-fire of the new tab-entry effect** — triggered by its `lenses` or `rawUserAnswers` dependency changing again for an unrelated reason (e.g. `fetchLenses()` resolving *after* the pending effect already ran and calling `setLenses(...)`, or a later cross-subdomain `userAnswers` sync) — recomputes `resolveTabLens('judges', {}, lenses, rawUserAnswers)`. Since `tabLensMemory` was never told about the `'federal'` pick, and `'judicial'` (the tab default) is still uncalibrated, this resolves to `'custom'` and calls `setActiveLens('custom')`, **silently reverting the user's just-completed calibration** back to Best Match.

Because `fetchLenses()` and the answers/verdicts await-chain are two independent async operations racing each other, whether this reversion happens depends on network timing, not user action — it is not a rare edge case, it's a coin-flip on every return-from-calibration visit to a tab whose default differs from the just-calibrated lens. Nothing in `210-CONTEXT.md`, `210-RESEARCH.md`, or `210-PATTERNS.md` analyzes this interaction (they analyze reset-on-reload and explicit-pick-via-chip-click, but not the calibrate-and-return path), so this gap was not caught by planning, and Plan 02's live-verification script (`210-02-PLAN.md`) does not include a "calibrate a non-default lens, return, and confirm it sticks" step.

**Fix:** Have the tab-entry effect (or a small new effect) also seed `tabLensMemory` when `activeLensKey` changes due to a source other than itself — e.g. expose the pending-lens resolution from `CompassContext` (or watch `loadLensPending()`/its clearing) and write `setTabLensMemory((prev) => ({ ...prev, [effectiveActiveView]: resolvedKey }))` at the moment the calibrate-return selection is applied, before the tab-entry effect can re-fire and stomp it. Alternatively, gate the tab-entry effect so it does not re-apply `resolveTabLens` when the current `activeLensKey` was *just* set to a real, calibrated lens matching the pending-calibration flow (requires threading a flag/ref from `CompassContext` to `Results.jsx`, or lifting the pending-lens logic to be tab-aware). Add a live-verify step exercising exactly this sequence (Calibrate a non-default lens from a non-matching tab → return → switch away and back, or simply wait for the async `lenses` hydration to complete → confirm the calibrated lens is still active, not reverted to the tab default).

## Info

### IN-01: `resolveTabLens` JSDoc's "defined just above" is inaccurate, and the real reason for the placement is a grep-window dodge

**File:** `src/lib/compass.js:556-570`
**Issue:** The `resolveTabLens` JSDoc states it "composes `isLensCalibrated` (defined just above)", but two unrelated exported constants (`LENS_SELECTION_KEY`, `LENS_PENDING_KEY`, lines 557-558) sit between them. Per `210-01-SUMMARY.md`'s own "Decisions Made" section, this placement was chosen specifically so the function's body/JSDoc wouldn't have a `storage`-mentioning comment fall inside the acceptance criteria's `grep -n 'resolveTabLens' -A 12 ... | grep -c -i storage` window — i.e., code was arranged to satisfy an automated verification pattern's literal text-window rather than for a genuine architectural reason. This is a process smell: it works today (confirmed: the grep returns 0) but it means the acceptance check is validating physical-proximity-to-a-comment rather than the actual invariant it's meant to guard (no storage access in `resolveTabLens`), and future refactors could reintroduce the comment nearby without the check catching it, or could remove real storage-adjacent code assuming the check is meaningful when it's actually decoupled from the function's real body.
**Fix:** Tighten the acceptance-check grep to scope strictly to the function's own body (e.g. matching from `export function resolveTabLens` to its closing `}` rather than a fixed `-A 12` line count), or drop the "defined just above" wording since it's no longer textually true.

### IN-02: `TAB_DEFAULTS` is an unfrozen, mutable exported object

**File:** `src/lib/compass.js:565-569`
**Issue:** `TAB_DEFAULTS` is a plain object literal exported directly. Since JS objects are mutable by reference, any consumer that accidentally does `TAB_DEFAULTS.representatives = 'x'` (typo, bad merge, future refactor) would silently change per-tab default resolution app-wide with no error. Low likelihood given the current single call site, but cheap to harden.
**Fix:**
```js
export const TAB_DEFAULTS = Object.freeze({
  representatives: 'custom',
  educators: 'education',
  judges: 'judicial',
});
```

---

_Reviewed: 2026-07-19T11:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
