---
phase: 214-unified-location-combobox-google-places-removal
reviewed: 2026-07-21T20:24:06Z
depth: deep
files_reviewed: 9
files_reviewed_list:
  - src/lib/inputClassifier.js
  - src/lib/inputClassifier.test.js
  - src/lib/api.jsx
  - src/lib/api.test.js
  - src/lib/localitySearch.js
  - src/components/LocationCombobox.jsx
  - src/pages/Results.jsx
  - src/pages/Landing.jsx
  - src/index.css
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: resolved
resolution: 2026-07-21
resolution_note: >
  CR-01 (keyboard onKeyDown/onFocus clobbered by getReferenceProps spread order)
  and CR-02 (mount-only browse effect left in-page combobox re-search stale) both
  FIXED in commit e3edfc35 and re-verified live by the operator. CR-03 assessed as
  benign unreachable dead code (branch behavior is correct), left as-is. Warnings
  WR-01/WR-02 captured as a follow-up todo; WR-03/04/05 + info items documented
  here for future polish, not blocking.
---

# Phase 214: Code Review Report

**Reviewed:** 2026-07-21T20:24:06Z
**Depth:** deep
**Files Reviewed:** 9 (+ App.jsx / src/lib/coverage.js consulted for cross-file tracing)
**Status:** issues_found

## Summary

Reviewed the Phase 214 diff: `inputClassifier.js` (new), `api.jsx` (new `searchLocationsByName`/`lookupCoordinate`), `localitySearch.js` (Google removal, new `browseAreaRoute`/`coordinateRoute`), the new `LocationCombobox.jsx`, and the `Results.jsx`/`Landing.jsx` rewiring. Google Places removal (D-09/SRCH-08) is genuinely clean — verified zero `google`/`pac-container`/`@googlemaps` residue outside the documented Civic-API allow-list, and `package.json`/`package-lock.json` are clean.

However, deep-tracing the `@floating-ui/react` wiring in `LocationCombobox.jsx` against the installed library's actual source turned up a serious defect: the component's own `onKeyDown`/`onFocus` handlers are silently discarded by prop-spread ordering, which — if this reproduces in the browser as the code indicates — means **pressing Enter never submits the field** and **focus-select-all (D-03) never fires**, contradicting both the UI-SPEC contract and the Plan 06 human-verification sign-off. A second, independently-provable issue: selecting a candidate (or any `browse_*` shortcut) while already on `/results` updates the URL but never re-fetches, because the reading effects use `useEffect(..., [])` and `<Route path="/results">` has no `key` to force a remount. Both are presented with concrete code/library evidence below. Several lower-severity logic gaps (dead code, a debounce race condition, a silent Elections-tab gap for coordinate results, and a threat-model claim that doesn't fully hold) round out the findings.

## Critical Issues

### CR-01: LocationCombobox's own onKeyDown/onFocus handlers are silently overridden by `{...getReferenceProps()}` — Enter-to-submit and focus-select-all likely broken

**File:** `src/components/LocationCombobox.jsx:222-240`

**Issue:** The `<input>` declares its own `onFocus` (line 235, D-03 select-all) and `onKeyDown` (line 236, Enter → `dispatchSubmit()`) handlers, then spreads `{...getReferenceProps()}` (line 239) *after* them in the JSX attribute list:

```jsx
<input
  ...
  onFocus={(e) => e.target.select()}
  onKeyDown={handleKeyDown}
  placeholder={placeholder}
  className="..."
  {...getReferenceProps()}
/>
```

In JSX, a spread that appears after an explicit prop with the same name **wins** (standard `Object.assign`-style merge — this is not framework-specific, it's how every JSX runtime resolves duplicate prop keys). I traced the installed `@floating-ui/react` source (`node_modules/@floating-ui/react/dist/floating-ui.react.esm.js`) to confirm `useListNavigation`'s `reference` object *does* return its own `onKeyDown` (arrow/Home/End navigation) and `onFocus` (a near-no-op when `virtual: true`) handlers, and that `useInteractions`'s `mergeProps(userProps, propsList, elementKey)` **only composes a caller's handler with the library's own handlers of the same name when that handler is passed as the `userProps` argument to `getReferenceProps(userProps)`** — composition happens via a `Map` of handler arrays keyed by event name, populated from `propsList` plus whatever was passed into the getter call. Here `getReferenceProps()` is called with **no argument**, so the merged object it returns contains only the library's own `onKeyDown`/`onFocus` — the component's own handlers were never given to the merge function, and are then clobbered by the later spread.

Net effect: the DOM `<input>` ends up with exactly one `onKeyDown` listener — floating-ui's internal arrow-key/typeahead handler — and exactly one `onFocus` listener — floating-ui's near-no-op. `handleKeyDown` (which calls `e.preventDefault(); dispatchSubmit();` for Enter) and the D-03 `e.target.select()` focus behavior are never attached to the DOM at all. There is no `<form>` wrapping the input, so there's no native browser fallback for Enter either — the only way to submit becomes clicking the "Search" button.

This directly contradicts:
- UI-SPEC's "Coordinate submitted"/"Address submitted"/"Candidate selected" rows, all of which are Enter-driven.
- D-03 ("focus selects-all for easy replacement").
- The Plan 06 human sign-off (`214-06-SUMMARY.md`), which explicitly claims *"Enter selects and navigates"* and *"focus retained... ArrowDown/Up move the highlight"* as verified — this needs re-verification against the actual deployed build, since the code as written should not support it.

Note the component *does* use the correct floating-ui pattern elsewhere — `getItemProps({ onClick: () => handleSelectCandidate(candidate) })` (line 279) correctly passes the handler as an argument so it's composed, not clobbered. The reference-props call is the one place this pattern wasn't followed.

**Fix:**
```jsx
const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);

// ...

<input
  ref={refs.setReference}
  role="combobox"
  ...
  value={value}
  onChange={(e) => onChange(e.target.value)}
  placeholder={placeholder}
  className="..."
  {...getReferenceProps({
    onFocus: (e) => e.target.select(),
    onKeyDown: handleKeyDown,
  })}
/>
```
Passing the handlers as the `userProps` argument lets `mergeProps` compose them with the library's own arrow-key/dismiss handlers instead of one silently replacing the other.

---

### CR-02: Selecting a candidate (or any browse shortcut) while already on `/results` updates the URL but never re-fetches — stale results shown

**File:** `src/pages/Results.jsx:1978-1981` (new `onSelectCandidate` wiring), `src/pages/Results.jsx:886-924` / `928-942` / `948-961` / `858-879` (the `browse_*` on-mount readers, all `useEffect(..., [])`), `src/App.jsx:101` (`<Route path="/results" element={<Results />} />`, no `key`)

**Issue:** `onSelectCandidate` navigates via `navigate(browseAreaRoute(candidate))` → `/results?browse_geo_id=...&browse_mtfcc=...&browse_label=...&from_locality=1`. When the user is already on `/results` (the primary case this combobox exists for — it replaces the in-page Address/Browse toggle), React Router does **not** remount `<Results />` for a same-route, query-only navigation (there's no `key` prop on the `<Route>` in `App.jsx`, and `Results` doesn't key itself off `location.search`). The effect that actually performs the fetch for `browse_geo_id`/`browse_mtfcc` (`src/pages/Results.jsx:886-924`) is declared `useEffect(() => {...}, [])` — it runs exactly once, at the component's first mount. The same is true for the `browse_government_list`, `browse_state_officials`, and `browse_federal_officials` on-mount readers, and for the new `lat`/`lng`/`coord_raw` hand-off reader added by this phase (`969-979`).

Consequence: picking a *second* location candidate (or any browse shortcut) while remaining on the Results page changes the URL's query string but `browseByArea()`/`browseByState()`/etc. never fires again — `browseResults` keeps showing the *previous* location's officials. This is exactly the flow Plan 03's own must-have criterion describes ("Picking a place candidate navigates to /results?browse_geo_id=..."), and it's also exercised implicitly any time a user tries a second search from the Results header instead of Landing. `fromLocality` (a plain `searchParams.get(...)` read, reactive) will correctly flip the "imprecise" banner, but the actual officials list will not update — a confusing partial-update state (URL says one place, banner text may shift, data still shows the old place).

This bug is not literally introduced by Plan 03 (the pre-existing `LocalityMatches.onSelect` in the old code had the identical `navigate(coverageAreaToPath(area))` pattern), but Phase 214 makes this the **primary, only** way to change location from within the Results page (the old address-input/toggle path and the `SHORTCUTS` quick buttons that also had this problem were both removed), so it's now the main interaction most likely to hit it, and it directly undermines a criterion this phase's own plan required to work.

**Fix:** Either (a) give the candidate-select / browse-shortcut navigations a mechanism that works whether or not `Results` is already mounted — e.g. call `browseByArea(candidate.geo_id, candidate.mtfcc)` directly from `onSelectCandidate` and `setBrowseResults`/`setSearchParams` in place (mirroring how the old `LocationBrowser.onResults` callback worked, pre-214), rather than relying purely on `navigate()` + a mount-only effect; or (b) widen the on-mount readers' dependency arrays to include the relevant `searchParams` values (with logic to avoid re-firing on unrelated param changes) so they react to same-route navigations, not just the initial mount.

---

### CR-03: `resolveLocalityRoute`'s "manual submit locality fallback" branch in `handleAddressSearch` is unreachable — dead code that no longer does what its comment/SUMMARY claim

**File:** `src/pages/Results.jsx:994-1032` (specifically the `if (!isOverride) {...}` block, lines 1004-1009)

**Issue:** `handleAddressSearch(overrideAddress)` computes `isOverride = typeof overrideAddress === 'string'` and only runs the `resolveLocalityRoute(addr)` locality-shortcut check when `!isOverride`. The **only** call site is `onSubmitAddress={(raw) => handleAddressSearch(raw)}` (line 1976), which always passes a string. `isOverride` is therefore always `true`, and the `resolveLocalityRoute` branch can never execute at runtime. (Functionally this is inert either way — `onSubmitAddress` only fires when `classifyInput` already returned `kind: 'address'`, and `resolveLocalityRoute` internally re-runs the same classifier and short-circuits to `{kind: 'address'}` for anything that isn't `'name'` — so no incorrect behavior results today, but the code and its comment ("Manual submit (not an autocomplete pick): apply the ADR-0001 locality fallback...") are misleading, and `214-03-SUMMARY.md` explicitly (and incorrectly) documents that address submissions from the combobox "still run the resolveLocalityRoute locality-shortcut check before falling through to the Census address path" — they do not.)

Classified as a Critical-tier finding because it's dead code whose surrounding documentation asserts a behavior contract (locality-shortcut fallback on manual address submit) that does not hold, which is exactly the kind of drift that causes a future maintainer to rely on behavior that isn't there.

**Fix:** Either delete the dead `if (!isOverride) { resolveLocalityRoute... }` block and the now-inaccurate comment/import, or (if the fallback is still desired for some future direct caller) fix the call site so a genuine "manual, non-combobox-classified" path exists that can hit it. Correct the `214-03-SUMMARY.md` claim if it's kept as historical record.

## Warnings

### WR-01: Debounced name search has no request-cancellation/sequencing guard — stale, out-of-order responses can populate the candidate list or get silently selected on Enter

**File:** `src/components/LocationCombobox.jsx:123-152`

**Issue:** The debounce effect clears/resets a single `setTimeout` per keystroke (correctly preventing *concurrent scheduling*), but does nothing to prevent two `searchLocationsByName()` fetches from being **in flight simultaneously** when the user pauses, gets a request going, then resumes typing before that request resolves and pauses again. If the earlier (shorter-query) response arrives after the later (longer-query) one — plausible under real-world network jitter — `setCandidates`/`setActiveIndex`/`setIsOpen` will be overwritten with stale results that no longer match the current input text. There's no `AbortController`, and no request-sequence/id check to discard out-of-order responses. Because `dispatchSubmit()`'s name-kind branch (`src/components/LocationCombobox.jsx:168-171`) auto-picks `candidates[activeIndex] ?? candidates[0]` on Enter, a user who types quickly and presses Enter can be silently routed to a candidate that doesn't correspond to what's currently in the field.

**Fix:** Track a monotonically increasing request id (or use `AbortController`, aborting the previous fetch on each new debounced call) and ignore/drop the response if it doesn't correspond to the latest fired request or the latest `value`.

### WR-02: Zero-candidate name query's "press Enter to search it as a street address" hint is not implemented

**File:** `src/components/LocationCombobox.jsx:163-172` (`dispatchSubmit`), `207-214` (`renderInlineRow`'s no-match copy)

**Issue:** UI-SPEC's copy for the zero-candidate state explicitly promises: *"No matches for "{query}." Check the spelling, or press Enter to search it as a street address."* But `dispatchSubmit()`'s `'name'` branch only does `const active = activeIndex != null ? candidates[activeIndex] : candidates[0]; if (active) handleSelectCandidate(active);` — when `candidates` is empty (the exact no-match state this copy is shown for), `active` is `undefined` and nothing happens. Pressing Enter on a no-match name query is a dead end: no address search fires, contradicting the copy's explicit instruction. (This is a distinct bug from CR-01 — even after CR-01 is fixed so Enter reaches `dispatchSubmit()`, this fallback still needs to be added.)

**Fix:** In the `'name'` branch, when there's no active/available candidate, fall back to `onSubmitAddress?.(value.trim())` (treat the no-match query as an address submission), matching the UI-SPEC copy's promise.

### WR-03: Elections tab / election-date summary is silently empty for coordinate-mode results

**File:** `src/pages/Results.jsx:793-847` (the elections-fetch effect)

**Issue:** The effect branches only on `searchMode === 'browse'` vs. everything else (the `else` branch assumes address mode and requires `activeQuery` to be non-empty). There is no `searchMode === 'coordinate'` branch. Since `resolveCoordinate` explicitly deletes the `q` URL param (`src/pages/Results.jsx:1056`), `activeQuery` (`= queryFromUrl = searchParams.get('q')`) is always empty for a coordinate result, so `if (!activeQuery) return;` bails out silently — `fetchElectionsByAddress` never fires, `electionsData` stays `null`, and the Elections tab / inline "Elections - ..." summary just look like "no elections" for every coordinate search, with no distinguishing message that this is a data-availability gap rather than an actual absence of elections. (There is no backend elections-by-coordinate endpoint today, so a full fix may be out of scope for this phase, but the UI should not present a silent, indistinguishable-from-real-empty state.)

**Fix:** At minimum, add an explicit `searchMode === 'coordinate'` branch that sets a distinct "not available for a raw coordinate" state (or suppresses the Elections tab count/summary rather than rendering it as zero), so users aren't told there are no upcoming elections when the truth is "we didn't check."

### WR-04: Partial coordinate input still streams to the place-name resolver, partly undermining the T-214-04 threat-model claim

**File:** `src/lib/inputClassifier.js:14, 38-41`, `src/components/LocationCombobox.jsx:123-135`, `214-02-PLAN.md` threat register (T-214-04)

**Issue:** `COORDINATE_RE` only matches a *complete* `lat, lng` pair. While a user is progressively typing a coordinate (e.g. `39.17, -8`), the partial string matches neither `COORDINATE_RE` nor `ADDRESS_LEADING_DIGIT_RE`/`ZIP_RE` (no trailing whitespace after the digit run, no 5-digit ZIP), so `classifyInput` returns `kind: 'name'`. Once the partial string reaches `MIN_NAME_CHARS` (3), the debounce effect fires a real `/location-search` request for that numeric fragment. This contradicts the Plan 02 threat register's explicit claim: *"Debounced (~250ms) AND gated on kind==='name' + ≥3 chars so address/coordinate typing never streams partial-fragment resolver calls."* In practice, coordinate typing *does* stream partial-fragment resolver calls until the full pattern is completed. The volume is bounded by the debounce and is not itself a security issue, but the documented mitigation claim doesn't fully hold and the resolver receives numeric noise it was never meant to see.

**Fix:** Either accept and re-document this as a known v1 gap (consistent with D-06's "planner discretion" framing for other classifier edge cases), or add a lightweight "looks like it might still be typing a coordinate" heuristic (e.g. a lone leading digit/minus-sign/decimal-point run with no letters) to suppress the resolver call until either a full coordinate or a letter appears.

### WR-05: `LocationCombobox` candidate rows nest an interactive `<button>` inside a `role="option"` `<li>`

**File:** `src/components/LocationCombobox.jsx:266-299`

**Issue:** The WAI-ARIA listbox pattern expects the `role="option"` element itself to be the interactive unit; nesting a `<button>` with its own click/`getItemProps` handlers inside the `<li role="option">` is non-standard and can confuse some assistive-technology combinations, even though `virtual: true` keeps real DOM focus on the `<input>` so the button itself is never tab-focused directly. Functionally the click handler still works (it's an explicit event, not something that needs event delegation to the `<li>`), so this is a correctness-adjacent a11y nit rather than a functional bug.

**Fix:** Move `role="option"`, `aria-selected`, and the click/item props directly onto a single element (e.g. drop the wrapping `<button>` and make the `<li>` itself the interactive/styled element, or make the `<button>` the sole element carrying `role="option"` and drop the extra `<li>` wrapper).

## Info

### IN-01: `listRef.current[i]` entries are never pruned when the candidate list shrinks

**File:** `src/components/LocationCombobox.jsx:86, 274`

**Issue:** `listRef.current[i] = node` is set via a ref callback but old indices beyond the new list's length are never cleared (`node` callback only fires for currently-rendered items; stale trailing entries from a longer previous list persist in the array until overwritten by a same-index render). Given the list is fully replaced (`setCandidates(list)`) each time and floating-ui indexes primarily by the current array length, this is unlikely to cause visible symptoms, but it's untidy state that could bite if a `.length`-independent consumer of `listRef.current` is ever added.

**Fix:** Truncate `listRef.current.length = candidates.length` (or reset to `[]`) at the top of the render/candidates-list effect.

### IN-02: `coordinateRoute(lat, lng, raw)` will coerce `undefined`/`null` `raw` to the literal string `"undefined"`/`"null"` in the URL

**File:** `src/lib/localitySearch.js:48-55`

**Issue:** `new URLSearchParams({ lat: String(lat), lng: String(lng), coord_raw: raw })` — if `raw` is ever `undefined`/`null` (not observed in the current call sites, which always pass the controlled input's string `value`), `URLSearchParams`'s object-constructor path stringifies it to the literal text `"undefined"`/`"null"`, which would then render as the resting label on Results. Not reachable today given the current callers, but worth guarding defensively since it's a public routing helper.

**Fix:** `coord_raw: raw != null ? String(raw) : \`${lat}, ${lng}\`` (mirroring the fallback already used on the Results-side reader).

---

_Reviewed: 2026-07-21T20:24:06Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
