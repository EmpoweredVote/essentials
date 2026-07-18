---
phase: 207-officials-classification
reviewed: 2026-07-17T20:35:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/lib/classify.js
  - src/lib/classify.test.js
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 207: Code Review Report

**Reviewed:** 2026-07-17T20:35:00Z
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed the new `classifyBucket(pol)` function (src/lib/classify.js:294-314) and its test suite
(src/lib/classify.test.js:114-335). The pre-existing `classifyCategory`/`computeVariant` functions
were read for context only, per scope, and were not re-audited.

Core correctness properties hold up under adversarial tracing:
- **Null-safety:** all three field reads use `pol?.field || ""`, so `classifyBucket(null)`,
  `classifyBucket({})`, and `classifyBucket({ district_type: null })` cannot throw — verified both
  by code inspection and by the existing null-safety test block, and confirmed by running the
  suite (`npx vitest run src/lib/classify.test.js` → 80/80 passing).
- **Additive-only precedence (D-07/D-08):** the two base `Set.has(dt)` checks `return` immediately,
  so no override regex below them is ever reachable for a row already typed `JUDICIAL`,
  `NATIONAL_JUDICIAL`, `SCHOOL`, `STATE_BOARD`, or `SCHOOL_BOARD` — this is structurally guaranteed
  by early-return control flow, not just by convention.
- **Negative guards (Pitfall 3 / Pitfall 5):** traced `PROSECUTOR_DEFENDER_TITLE_RE` against
  "Attorney General" and "City Attorney" — neither matches any alternative in the whitelist
  (`district attorney|county attorney|prosecuting attorney|state's attorney|city prosecutor|public
  defender`), so both correctly fall through to `representative`. Traced
  `SCHOOL_SUPERINTENDENT_TITLE_RE` against "Superintendent of Police" and "Superintendent of Public
  Works" — neither matches `(public instruction|schools)`, so both correctly fall through. No
  regressions found here; the tests assert exactly these cases and pass.

No Critical/blocker-level defects were found. The three Warnings below are real coverage gaps in
the DA/prosecutor whitelist and one scope-vs-comment mismatch in the school-board chamber fallback
— none of them crash or corrupt data, but they represent title patterns that will silently fall
through to the wrong bucket rather than the intended one.

## Warnings

### WR-01: DA/prosecutor whitelist regex misses real state-specific elected-prosecutor titles

**File:** `src/lib/classify.js:272-273`
**Issue:** `PROSECUTOR_DEFENDER_TITLE_RE` is a whitelist of exactly six phrases: `district attorney`,
`county attorney`, `prosecuting attorney`, `state's attorney`, `city prosecutor`, `public defender`.
Two common real elected-prosecutor titles are not covered and will silently classify as
`representative` instead of `judge`:
- **Florida "State Attorney"** — the bare, apostrophe-less form used for Florida's 20 elected
  circuit prosecutors. The current regex requires `state'?s attorney` (i.e., "state's attorney" or
  "states attorney" with a trailing "s"), which does **not** match "State Attorney" (no "s" between
  "state" and "attorney"). A Florida State Attorney row (likely seeded under `COUNTY` or
  `LOCAL_EXEC`, both representative-base district_types) would incorrectly land in Representatives.
- **Virginia/Kentucky "Commonwealth's Attorney"** — the standard title for VA's elected local
  prosecutors (the project has active/prior Virginia seeding work per `project_v120_virginia.md`).
  Not in the whitelist at all.

RESEARCH.md (line 360) does flag `solicitor` (South Carolina) as an explicitly-deferred,
"not currently in the data" gap — but neither the Florida bare form nor the VA/KY
"Commonwealth's Attorney" form is mentioned or tested anywhere in the phase artifacts, so this
looks like an unintentional gap rather than a scoped-out decision.
**Fix:** Add the missing forms to the whitelist:
```javascript
const PROSECUTOR_DEFENDER_TITLE_RE =
  /\b(district attorney|county attorney|prosecuting attorney|state'?s attorney|state attorney|commonwealth'?s attorney|city prosecutor|public defender)\b/i;
```
Re-verify this doesn't newly catch "Attorney General" / "City Attorney" (it doesn't — "state
attorney" and "commonwealth's attorney" are disjoint substrings from those two), and add regression
tests for both titles.

### WR-02: `state's attorney` regex only accepts the ASCII straight apostrophe

**File:** `src/lib/classify.js:273`
**Issue:** `state'?s attorney` uses a literal ASCII apostrophe (`'`, U+0027) with `?` making it
optional. If a live data source (BallotReady/web-scraped titles) supplies a typographic/curly
apostrophe (`'`, U+2019) — e.g., "State's Attorney" copy-pasted from a government website — the
regex will not match either the apostrophe form or a plain-space form, and the row silently falls
through to `representative`. This is a silent-misclassification risk, not a crash, but it directly
undermines D-02's stated goal for this specific title.
**Fix:** Normalize or widen the character class instead of a single straight quote:
```javascript
const PROSECUTOR_DEFENDER_TITLE_RE =
  /\b(district attorney|county attorney|prosecuting attorney|state\s*['’]?s attorney|city prosecutor|public defender)\b/i;
```
(or normalize `title` with `.replace(/[‘’]/g, "'")` before testing, mirroring how other
apostrophe-bearing strings would need to be handled).

### WR-03: School-board chamber-text fallback is broader than its own documenting comment claims

**File:** `src/lib/classify.js:283-285, 310-311`
**Issue:** The comment above `SCHOOL_BOARD_TEXT_RE` says it exists to "catch LOCAL-mistyped school
boards (live case: Portland, ME)" — implying the fallback is meant for `district_type === 'LOCAL'`
rows specifically. The actual implementation applies the chamber/title match unconditionally to
*any* row whose base bucket is still `representative` (i.e., any `district_type` not in
`JUDGE_DISTRICT_TYPES`/`EDUCATOR_DISTRICT_TYPES` — `STATE_EXEC`, `LOCAL_EXEC`, `COUNTY`,
`NATIONAL_EXEC`, etc. are all reachable). This is a real, if narrow, false-positive surface: any
non-education office whose `chamber_name`/`chamber_name_formal` incidentally contains the substring
"school board" or "board of education" (e.g., a liaison title, a shared administrative chamber
name) would be swept into `educator` regardless of its actual `district_type`. Functionally this
mirrors D-02's already-intentional "regardless of base district_type" design for the DA override,
so it may be deliberate — but the comment doesn't say that, and there's no test proving the scope
is intentionally this wide (only `LOCAL`-typed fixtures are tested at
classify.test.js:197-210).
**Fix:** Either (a) update the comment to state explicitly that the chamber/title fallback is
intentionally dt-independent (matching D-02's precedent), or (b) scope the chamber-text check to
`dt === 'LOCAL'` if the intent really was narrower, per the comment as currently written. Add a
test asserting the boundary either way (e.g., a `STATE_EXEC` row with an unrelated title/chamber
that happens to contain "board of education" — decide and assert the wanted outcome).

## Info

### IN-01: No additive-only-invariant test for STATE_BOARD/SCHOOL_BOARD base types

**File:** `src/lib/classify.test.js:225-234`
**Issue:** The "Additive-only invariant (D-08)" block only exercises `SCHOOL` (stray "Judge"
keyword) and `JUDICIAL` (stray "School" keyword). It does not add the symmetric cases for
`STATE_BOARD`/`SCHOOL_BOARD` (stray judge/prosecutor keyword) or `NATIONAL_JUDICIAL` (stray
educator keyword). The guarantee is structurally true by construction (both base `Set.has(dt)`
checks return before any override runs, for every literal in each Set), so this is not a functional
gap — but a future refactor that changes the early-return structure would not be caught by the
current test suite for these two literals.
**Fix:** Add `it.each` cases for `STATE_BOARD`/`SCHOOL_BOARD`/`NATIONAL_JUDICIAL` mirroring the
existing `SCHOOL`/`JUDICIAL` D-08 tests, for regression safety against future refactors.

### IN-02: RESEARCH.md's documented "DC Attorney General under CITY_COUNCIL" pitfall has no dedicated regression test

**File:** `src/lib/classify.test.js:158-169`
**Issue:** 207-RESEARCH.md (Pitfall 3) specifically calls out that DC's "Attorney General" title
appears under `district_type = 'CITY_COUNCIL'` in live data (a documented data quirk), in addition
to the generic `STATE_EXEC`/`NATIONAL_EXEC` cases. The negative-guard test block only exercises
`STATE_EXEC` (line 160) and `LOCAL_EXEC` (line 165) for "Attorney General"/"City Attorney". Since
the override regex's behavior doesn't depend on `district_type` this passes today by construction,
but the specific documented live-data case named in the phase's own research is not directly
regression-tested.
**Fix:** Add `classifyBucket(makePol({ district_type: 'CITY_COUNCIL', office_title: 'Attorney
General' }))` → `'representative'` as an explicit regression case, matching the documented pitfall.

### IN-03: `hasAny`/`word` helpers and new regex-based overrides use two different keyword-matching idioms in the same file

**File:** `src/lib/classify.js:1-6, 272-285`
**Issue:** `classifyCategory` uses the file's `hasAny(s, list)` substring-match helper throughout;
`classifyBucket`'s overrides use four hand-written `RegExp` constants instead. This divergence is
intentional and documented (207-PATTERNS.md explains `hasAny`'s substring semantics can't express
the required word-boundary/phrase-anchoring guards), so it is not a defect — noting only for future
readers of `classify.js` who might otherwise assume `hasAny` is the file's sole keyword-matching
convention.
**Fix:** None required; consider a one-line comment near the top of the override section
cross-referencing why regexes were chosen over `hasAny` here (the PATTERNS.md rationale), for
future maintainers who don't have the planning artifacts open.

---

_Reviewed: 2026-07-17T20:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
