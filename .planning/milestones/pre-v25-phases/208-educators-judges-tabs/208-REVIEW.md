---
phase: 208-educators-judges-tabs
reviewed: 2026-07-18T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/pages/Results.jsx
  - src/lib/classify.js
  - src/index.css
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 208: Code Review Report

**Reviewed:** 2026-07-18
**Depth:** standard
**Files Reviewed:** 3 (src/pages/Results.jsx, src/lib/classify.js, src/index.css)
**Status:** issues_found

## Summary

Reviewed the four-tab officials view (`Results.jsx`), the `classifyBucket` routing logic
(`classify.js`), and the mobile-header CSS override (`index.css`) added/modified across Plans
208-01 and 208-02. The phase is frontend-only and was human-verified on production, and the core
mechanisms hold up well under adversarial tracing: the `bucketed` useMemo's SCOTUS fold-back is
computed correctly (mutation happens inside the memo callback, not on a stale ref, and
`hasEducators`/`hasJudges` are derived from the *post-fold-back* bucket so the "SCOTUS-only must
not unhide Judges" rule is genuinely enforced); `effectiveActiveView`'s switch-statement fallback
correctly resolves both a stale `?view=` and an in-session bucket-emptying, and all four tab
buttons were confirmed to read `effectiveActiveView` exclusively (no raw `activeView` comparison
survives). The `:has()` CSS selector was checked against the actual `@empoweredvote/ev-ui`
`Header` markup (installed package, `node_modules/@empoweredvote/ev-ui/dist/index.js`) and does
correctly match only the intended right-side cluster; the 768px vs. ev-ui's internal 1024px
`navCollapseBreakpoint` is not a mismatch (768px is a subset of ev-ui's own hamburger range), so
no viewport width strands a user without a menu.

However, one **BLOCKER**-level regression was proven by actually running the test suite: the
208-02 punch-list reversal of the DA/prosecutor→judge routing was applied to `classify.js` but
`classify.test.js` was never updated, so 20 tests in that file now fail against the current
implementation (`npx vitest run` — 20 failed, 68 passed in that file; the rest of the suite is
green). Additionally, a per-tab data inconsistency in the zero-results fallback and a duplicated
`react-hooks/exhaustive-deps` warning (both introduced by the Task 1 partition refactor) are
flagged as warnings below.

## Critical Issues

### CR-01: `classify.test.js` was not updated for the 208-02 DA/prosecutor reversal — 20 tests fail

**File:** `src/lib/classify.test.js:139-396` (consumer of `src/lib/classify.js:299-321`)
**Issue:** Plan 208-02's operator punch-list reversed 207-D-02 — prosecutors/public defenders
(District Attorney, County Attorney, Prosecuting Attorney, State's/Commonwealth's Attorney, City
Prosecutor, Public Defender, including the curly-apostrophe/missing-apostrophe variants) no
longer route to `'judge'` in `classifyBucket` (the `PROSECUTOR_DEFENDER_TITLE_RE` override was
deleted from `src/lib/classify.js`). `classify.test.js` still contains the entire
pre-reversal test suite asserting these same titles classify as `'judge'`
(`describe('DA / prosecutor / public defender title override (D-02)', ...)`, the WR-01
state-specific titles describe block, the WR-02 apostrophe-variant describe block, and two
live-fixture assertions for LA's Nathan Hochman and SF's Brooke Jenkins). Running the suite
confirms this is not a hypothetical:
```
$ npx vitest run src/lib/classify.test.js
 Test Files  1 failed (1)
      Tests  20 failed | 68 passed (88)
```
Every failure is `expected 'representative' to be 'judge'` on exactly the titles the 208-02
punch-list reclassified. This means `npm test` (or CI's test step, if one runs it) is currently
red because of a change shipped in this phase, and any future edit to `classify.js` risks being
"verified" against assertions that encode the *old*, reverted behavior. The `208-01-SUMMARY.md`
and `208-02-SUMMARY.md` reports "build clean" / "lint zero new errors" but never mention running
`vitest`, so this externally-visible regression escaped verification.
**Fix:** Update `classify.test.js` to match the reversed behavior — either delete the
DA/prosecutor/public-defender-routes-to-judge assertions (D-02, WR-01, WR-02 blocks, and the two
live fixtures) or flip their expectations to `'representative'`, and add coverage confirming these
titles now group under County/Local Officials as the 208-02 comment describes. Example for one
case:
```js
// classify.test.js — replace the D-02 block's expectation
it.each(titles)('"%s" under district_type COUNTY classifies as representative (208-02 reversal)', (title) => {
  expect(classifyBucket(makePol({ district_type: 'COUNTY', office_title: title }))).toBe('representative');
});
```

## Warnings

### WR-01: Representatives tab's zero-results fallback uses the wrong count, inconsistent with Educators/Judges

**File:** `src/pages/Results.jsx:2264-2271`
**Issue:** The three `renderPeopleTab` call sites pass different semantics for
`fallbackListLength`:
```js
if (effectiveActiveView === 'representatives') {
  return renderPeopleTab(filteredHierarchy, federalFiltered.length, 'representatives');
}
if (effectiveActiveView === 'educators') {
  return renderPeopleTab(educatorsFilteredHierarchy, bucketed.educator.length, 'educators');
}
if (effectiveActiveView === 'judges') {
  return renderPeopleTab(judgesFilteredHierarchy, bucketed.judge.length, 'judges');
}
```
Educators/Judges correctly pass their *own bucket's* count (post-partition). Representatives
passes `federalFiltered.length` — the count of **every** office-holder for the location
(representatives + educators + judges combined), a holdover from before the Task 1 partition when
there was only one combined hierarchy and `federalFiltered.length === 0` was a valid proxy for
"the Representatives hierarchy is empty." After the bucket partition, that equivalence no longer
holds: for a location where every office-holder classifies as `educator`/`judge` (so
`bucketed.representative` is empty and `filteredHierarchy` is `[]`) but `federalFiltered.length >
0`, the "No results found for this location." message at `Results.jsx:2246` is suppressed (since
its guard is `fallbackListLength === 0`), and if `appointedFilter === 'All'` the filter-aware
empty state at `:2253` is also suppressed (it requires `appointedFilter !== 'All'`). The user is
left looking at only the three generic "{tier} official data is not yet available" tier messages
for Local/School/State, which is misleading for what is actually a routing/classification
situation, not a missing-data situation — and no message covers the (untested-for-tier-emptiness)
Federal tier at all.
**Fix:** Use the Representatives bucket's own count, matching the pattern used for the other two
tabs:
```js
return renderPeopleTab(filteredHierarchy, bucketed.representative.length, 'representatives');
```

### WR-02: Task 1's `applyAppointedFilter` helper introduces two new `react-hooks/exhaustive-deps` warnings

**File:** `src/pages/Results.jsx:1405-1433`
**Issue:** Before this phase there was one `useMemo` computing `filteredHierarchy` inline, and
lint already flagged one missing-dependency warning for it (`matchesAppointedFilter` omitted from
`[hierarchy, appointedFilter]`, verified by linting the pre-208 revision of this file). Task 1
generalized the filter body into an in-component function `applyAppointedFilter(hier, filter)`
(itself calling `matchesAppointedFilter`) and now calls it from **three** separate `useMemo`s
(`filteredHierarchy`, `educatorsFilteredHierarchy`, `judgesFilteredHierarchy`), none of which list
`applyAppointedFilter` in their dependency array:
```
1424:5  warning  React Hook useMemo has a missing dependency: 'applyAppointedFilter'
1428:5  warning  React Hook useMemo has a missing dependency: 'applyAppointedFilter'
1432:5  warning  React Hook useMemo has a missing dependency: 'applyAppointedFilter'
```
Confirmed by diffing lint output before/after this phase's commits: pre-208 there was 1 such
warning in this file; post-208 there are 3 (net +2, introduced by this phase's refactor). This is
currently harmless in practice (`applyAppointedFilter`/`matchesAppointedFilter` are pure functions
of their arguments and don't close over changing component state), but it's a hygiene regression
that triplicates a pre-existing lint smell instead of fixing it, and it will keep multiplying if a
fourth bucket/tab is ever added (Phase 210 territory).
**Fix:** Hoist `applyAppointedFilter` and `matchesAppointedFilter` out of the component to module
scope (they don't reference any component state — `matchesAppointedFilter` only reads
`pol`/`filter` arguments), which removes the need for either to appear in any dependency array:
```js
// module scope, outside the Results component
function resolveIsAppointed(pol) { /* ...unchanged... */ }
function matchesAppointedFilter(pol, filter) { /* ...unchanged... */ }
function applyAppointedFilter(hier, filter) { /* ...unchanged, calls matchesAppointedFilter... */ }
```

### WR-03: Mobile header override is coupled to ev-ui's unversioned internal DOM structure with no fallback

**File:** `src/index.css:331-336`
**Issue:** `header div:has(> div > button[aria-label="Profile menu"]) { display: flex !important; }`
depends on `@empoweredvote/ev-ui`'s `Header` component nesting the profile button exactly two
`div` levels below the right-side action cluster (verified against
`node_modules/@empoweredvote/ev-ui/dist/index.js:1397` — currently true for the installed 0.9.8).
There is no test (visual or DOM-shape) asserting this structural assumption, and `.claude`/summary
notes confirm the phase's own verification was a manual/human check against the *current*
published version, not something that will re-run against a future `ev-ui` bump. If a future
`ev-ui` release changes the wrapper depth around the profile button (e.g. adds a dropdown-portal
wrapper), the `:has()` selector silently stops matching — the cluster reverts to ev-ui's own
`display: isMobile ? "none" : "flex"` inline style (hidden ≤1024px) while
`.ev-header-mobile-toggle { display: none !important; }` is unconditional within the same
`@media (max-width: 768px)` block, hiding the hamburger too. Net effect for viewports ≤768px: no
hamburger and no revealed cluster — mobile users at that breakpoint would have no way to reach
Sign-in/Account/Theme at all, with no build or lint signal to catch the regression.
**Fix:** Add a lightweight guard so the two rules can't both apply to a hidden target — either a
CI/smoke check that renders the `Header` component and asserts `.ev-header-mobile-toggle` and the
profile-button ancestor div are never simultaneously `display: none` at ≤768px, or a defensive
CSS fallback (e.g. keep the hamburger visible via a container query / `@supports not
selector(:has(a))` branch) so a structural drift in ev-ui degrades to the old (safe) hamburger
behavior instead of hiding both controls.

## Info

### IN-01: `effectiveActiveView` fallback leaves the raw `?view=` param unchanged (D-08's "reset cleanly" not implemented)

**File:** `src/pages/Results.jsx:1448-1461`
**Issue:** 208-CONTEXT.md D-08 says a stale/bookmarked `?view=judges` should "reset `?view=`
cleanly." The implemented `effectiveActiveView` switch correctly changes what *renders*
(falls back to `'representatives'`), but nothing calls `setSearchParams` to actually clear or
rewrite the URL's `view` value — `activeView` (and thus the URL) still reads `judges` even while
Representatives content is shown. This is functionally safe (every render derives from
`effectiveActiveView`, and clicking any tab button calls `switchView` which correctly rewrites the
param), but a user who copies the URL while viewing the fallback will share/bookmark a link that
still says `?view=judges` for a location that has no judges bucket — cosmetically confusing, not
a security or correctness issue given T-208-01/T-208-02 are otherwise mitigated.
**Fix:** Optionally add an effect that calls `switchView('representatives')` (or directly
`setSearchParams`) when `effectiveActiveView !== activeView`, to keep the URL in sync with what's
rendered. Low priority — cosmetic only.

---

_Reviewed: 2026-07-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
