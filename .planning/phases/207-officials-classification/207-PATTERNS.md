# Phase 207: Officials Classification - Pattern Map

**Mapped:** 2026-07-17
**Files analyzed:** 2 (1 modified source file, 1 modified test file — no new files)
**Analogs found:** 2 / 2 (both analogs are siblings in the same files being modified)

This is a small, additive, one-function extension of existing, well-understood code. No new
files are created; both target files already exist and already contain the closest possible
analog (a sibling function / sibling test block in the same file). Per CONTEXT.md D-06, do NOT
fork `classify.js` — extend it in place.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/classify.js` (add `classifyBucket`) | utility (pure classifier fn) | transform (object → enum string) | `classifyCategory` in the **same file** (lines 105-248) | exact — same signature, same input fields, same file |
| `src/lib/classify.test.js` (add `describe('classifyBucket', ...)` block) | test | request-response-style unit assertions | existing `describe('classifyCategory — SCHEMA-02 STATE_BOARD...', ...)` block (lines 95-100) + `makePol` helper (lines 9-15) | exact — same test file, same fixture helper, same `describe/it` shape |

No controller/component/service/model/route files are touched — this phase is scoped to one
pure frontend utility function and its unit tests (no DB, no API, no UI).

## Pattern Assignments

### `src/lib/classify.js` — add `classifyBucket(pol)` (utility, transform)

**Analog:** `classifyCategory(pol)` — same file, lines 105-248. This is the strongest possible
analog: same file (no import needed), same three input fields, same "no side effects, pure
lookup" shape, same age/maturity as the code it sits beside.

**Signature / input-field pattern to copy** (`classify.js:105-108`):
```javascript
export function classifyCategory(pol) {
  const dt = pol?.district_type || "";
  const chamber = pol?.chamber_name_formal || pol?.chamber_name || "";
  const title = pol?.office_title || "";
```
`classifyBucket` should read the identical three fields with the identical optional-chaining +
`|| ""` defaulting idiom — this is the project convention for "field may be missing," and it is
what makes `pol?.district_type || ''` safe against `null`/`undefined` rows (D-09's "never
disappears" guarantee starts here: a falsy/missing `district_type` becomes `''`, which matches no
`Set`/regex, and falls through to the `representative` catch-all).

**Base district_type routing pattern to copy** (`classify.js:110-121`, the `if (dt === "X") return {...}` chain):
```javascript
  if (dt === "NATIONAL_UPPER") return { tier: "Federal", group: "U.S. Senate" };
  if (dt === "NATIONAL_LOWER") return { tier: "Federal", group: "U.S. House" };
  ...
  if (dt === "STATE_BOARD")
    return { tier: "State", group: "State Board of Education" };

  if (dt === "NATIONAL_JUDICIAL") {
    return { tier: "Federal", group: "Federal Judiciary" };
  }
```
`classifyBucket` mirrors this early-return-chain style but returns a bare string enum
(`'judge'|'educator'|'representative'`) instead of a `{tier, group}` object. RESEARCH.md's
recommended shape (a `Set.has(dt)` lookup for the Judge/Educator district_types, checked *before*
any override) is the correct adaptation of this same early-return convention — use `Set`s instead
of a long `if` chain only because there are just two positive sets (Judge, Educator) vs.
`classifyCategory`'s ~15-way branch.

**Judicial branch precedent to copy** (`classify.js:228-240` — shows the project already treats
`JUDICIAL` as a single, unsplit bucket at the tier level, same as D-01 requires for `classifyBucket`):
```javascript
  // Judicial officials - separate state courts by type, local courts grouped
  if (dt === "JUDICIAL") {
    if (hasAny(chamber, ["supreme"])) {
      return { tier: "State", group: "State Supreme Court" };
    }
    if (hasAny(chamber, ["appellate", "appeals"])) {
      return { tier: "State", group: "State Court of Appeals" };
    }
    if (hasAny(chamber, ["tax"])) {
      return { tier: "State", group: "State Tax Court" };
    }
    return { tier: "Local", group: "Local Judiciary" };
  }
```
Note: `classifyCategory` still splits `JUDICIAL` by court *level* (supreme/appellate/tax/local)
for display purposes — this is a DIFFERENT axis than judge-vs-clerk (which it doesn't split at
all, consistent with D-01's "no judge-vs-court-staff special-casing"). `classifyBucket` does not
need this level-splitting at all — the whole `JUDICIAL`/`NATIONAL_JUDICIAL` district_type maps to
`'judge'` in one line, confirming D-01 is already how this codebase treats `JUDICIAL` elsewhere.

**Catch-all pattern to copy** (`classify.js:247`):
```javascript
  return { tier: "Unknown", group: "Uncategorized" };
```
Direct precedent for D-09: `classifyCategory` already ends every unmatched row in a safe,
non-disappearing default. `classifyBucket`'s final line (`return 'representative';`) is the
same idiom, string-enum version.

**Keyword-matching helper available to reuse** (`classify.js:1-6`, module-private, already
exported implicitly by file scope — no import needed since same file):
```javascript
const word = (s) => (s || "").toLowerCase();
const hasAny = (s, list) => {
  const t = word(s);
  return list.some((k) => t.includes(k));
};
```
`hasAny(title, [...])` is the file's existing idiom for "does this title contain any of these
keywords" (used ~15 times in `classifyCategory`, e.g. `classify.js:180`
`hasAny(title, ["clerk", "treasurer", "auditor", "recorder", "assessor"])`). RESEARCH.md's
recommended draft uses hand-written regexes (`PROSECUTOR_DEFENDER_TITLE_RE`,
`SCHOOL_SUPERINTENDENT_TITLE_RE`) instead of `hasAny` for the D-02/D-05 overrides — this is the
correct choice, NOT a deviation to flag, because `hasAny`'s plain substring match is what causes
Pitfall 3 (a bare `"attorney"` substring test would match `Attorney General`); the guarded
overrides need regex word-boundaries/phrase-anchoring (`\bcounty attorney\b`,
`superintendent\s+of\s+(public instruction|schools)`) that `hasAny`'s substring-only semantics
cannot express. Do not force the overrides through `hasAny` — use `RegExp.test()` directly, same
as `computeVariant` already does (see below).

**Sibling-function regex-testing pattern to copy** (`classify.js:316-322`, `computeVariant` — the
file's OTHER precedent, showing regex-based title testing rather than `hasAny` for exactly this
kind of guarded, phrase-level match):
```javascript
export function computeVariant(pol, userAnswers, hasStances = true) {
  const title = (pol?.office_title || '').toLowerCase();
  const dt = pol?.district_type || '';

  // Admin and judicial never have compass data — always show unavailable plate
  if (/clerk|treasurer|auditor|recorder|assessor/.test(title)) return 'administrative';
  if (dt === 'JUDICIAL' || /judge|justice|court/.test(title)) return 'judicial';
```
This is the exact shape for D-03's title-detected judge/justice fallback
(`JUDGE_TITLE_RE = /\b(judge|justice)\b/i`) — `computeVariant` already does `dt === 'JUDICIAL' ||
/judge|justice|court/.test(title)` for its own (unrelated) purpose. `classifyBucket` should
mirror the regex style (module-level `const ..._RE = /.../i;` above the function, `.test(title)`
inline) rather than inlining literals, matching how this file already organizes its patterns.

**Where to add it:** insert `classifyBucket` as a new exported function directly below
`classifyCategory` (after line 248, before `orderedEntries` at line 250) or directly below
`computeVariant` at the end of the file (after line 332) — either placement keeps it "alongside"
the sibling classifiers per D-06; do not intersperse it inside `classifyCategory`'s body.

---

### `src/lib/classify.test.js` — add `describe('classifyBucket', ...)` block (test)

**Analog:** the existing `describe('classifyCategory — SCHEMA-02 STATE_BOARD (Phase 133 D-09)',
...)` block, lines 95-100, plus the shared `makePol` helper, lines 9-15.

**Imports pattern to extend** (`classify.test.js:6-7`):
```javascript
import { describe, it, expect, test } from 'vitest';
import { computeVariant, classifyCategory } from './classify.js';
```
Add `classifyBucket` to the named import from `./classify.js` — no new import statement, no new
test file (RESEARCH.md's explicit recommendation, matching Claude's Discretion in CONTEXT.md).

**Fixture helper to reuse as-is** (`classify.test.js:9-15`):
```javascript
function makePol(overrides) {
  return {
    district_type: 'LOCAL',
    office_title: 'Council Member',
    ...overrides,
  };
}
```
Every `classifyBucket` test should call `makePol({ district_type: '...', office_title: '...' })`
exactly like every existing test in this file does — do not invent a second fixture shape. Add
`chamber_name` / `chamber_name_formal` overrides only for the D-04 school-board chamber-text test
case (Portland, ME style), matching the field names `classifyCategory` itself reads
(`chamber_name_formal || chamber_name`, `classify.js:107`).

**`describe`/`it.each` block shape to copy** (`classify.test.js:95-100`, the smallest and most
directly analogous existing block — single `dt` in, single expected value out):
```javascript
describe('classifyCategory — SCHEMA-02 STATE_BOARD (Phase 133 D-09)', () => {
  test('STATE_BOARD classifies into State tier with State Board of Education group', () => {
    const pol = { district_type: 'STATE_BOARD', office_title: 'State Board of Education District 5' };
    expect(classifyCategory(pol)).toEqual({ tier: 'State', group: 'State Board of Education' });
  });
});
```
Mirror this for each `district_type` base case in RESEARCH.md's enumeration table (14 literals
mapped to `judge`/`educator`/`representative`), one `test(...)` per literal or one
`it.each([...])(...)` table — see the richer `it.each` precedent below for the multi-value form.

**`it.each` table-test pattern to copy for the override tests** (`classify.test.js:36-44`, the
project's existing convention for "same assertion, many keyword inputs" — use this shape for the
DA/PD title-override tests (COUNTY vs LOCAL_EXEC per Pitfall 1) and the negative
Attorney-General/City-Attorney guard tests (Pitfall 3), not a hand-written loop or a new
`describe.each`):
```javascript
describe('computeVariant — administrative detection (STATE-02)', () => {
  const answers = [1, 2, 3];
  it.each(['clerk', 'treasurer', 'auditor', 'recorder', 'assessor'])(
    'returns "administrative" for title containing "%s"',
    (keyword) => {
      expect(
        computeVariant(makePol({ office_title: `City ${keyword}` }), answers)
      ).toBe('administrative');
    }
  );
```
Adapt directly: `it.each(['District Attorney', 'County Attorney', 'Prosecuting Attorney', ...])`
with both a `district_type: 'COUNTY'` and a `district_type: 'LOCAL_EXEC'` variant (Pitfall 1
requires exercising both bases, not just COUNTY), asserting `classifyBucket(...) === 'judge'`;
and a second `it.each(['Attorney General', 'City Attorney'])` block asserting `'representative'`
(Pitfall 3's required negative test).

**Where to add it:** new top-level `describe('classifyBucket', ...)` block appended after the
final existing block (after line 112) — do not interleave with the `computeVariant`/`classifyCategory`
blocks above it, matching how each existing `describe` is already a self-contained, sequentially
appended section in this file.

---

## Shared Patterns

### `district_type` as the sole base signal (no helper-module calls)
**Source:** `src/lib/classify.js` itself (every branch in `classifyCategory`, lines 110-247) and
confirmed by RESEARCH.md's "Reuse Recommendation" analysis of `groupHierarchy.js`'s
`getTier`/`isJudicialOfficial`/`isAdminOfficer` (none exported — `src/lib/groupHierarchy.js:11,
144-169`) and `branchType.js`'s `getBranch` (`src/utils/branchType.js:9-44`).
**Apply to:** `classifyBucket` only. Read `pol.district_type` / `pol.office_title` /
`pol.chamber_name(_formal)` directly; do not import `getTier`, `isJudicialOfficial`,
`isAdminOfficer` (not exported — would require an unrelated edit to `groupHierarchy.js`) or
`getBranch` (wrong regex for DA/PD, confirmed below — do not mirror it).
```javascript
// src/utils/branchType.js:29-39 — the COUNTY heuristic explicitly does NOT catch
// "District Attorney" / "County Attorney" / "Prosecuting Attorney" (no "attorney" in the
// regex, and /prosecutor/i does not match any of those three strings). Do not copy this
// regex for the D-02 override — RESEARCH.md's whitelist regex is required instead.
case 'COUNTY': {
  const title = officeTitle || '';
  if (/council/i.test(title)) return 'Legislative';
  if (/commission/i.test(title)) return 'Executive';
  if (/sheriff|clerk|auditor|assessor|recorder|coroner|treasurer|prosecutor|surveyor/i.test(title))
    return 'Executive';
  return null;
}
```
Likewise `src/utils/officeDescriptions.js:84-85` (`/district attorney|prosecutor/.test(t)`) is
insufficient for the same reason (misses "County Attorney", "Prosecuting Attorney") — read-only
reference, do not import or mirror verbatim; use the whitelist regex from RESEARCH.md's
`## Architecture Patterns` section instead.

### Additive-only override precedence (D-07/D-08)
**Source:** RESEARCH.md `## Architecture Patterns` (draft `classifyBucket` implementation) —
this is a new pattern for this file (no exact existing precedent), but its *shape* — "compute a
base value from `district_type` first, then let title/chamber keywords only add to it, never
subtract" — mirrors how `classifyCategory` already lets keyword checks *refine* a `dt`-selected
branch (e.g. `classify.js:169-206`, the `LOCAL` branch: `dt === "LOCAL"` is decided first, then
`hasAny(title, [...])` sub-branches choose the group) without ever re-deciding away from `LOCAL`
itself. `classifyBucket` applies the same "outer type gate, inner keyword refinement" structure
one level coarser (3-bucket instead of ~15-group).
**Apply to:** the full override chain in `classifyBucket` — DA/PD (D-02), title-judge fallback
(D-03), superintendent (D-05), school-board text (D-04) — every override must be structured so it
can only fire when the base bucket (from `district_type`) is still `representative`; a clean
`JUDICIAL`/`SCHOOL`/`STATE_BOARD`/`SCHOOL_BOARD` row must `return` before any override regex runs
(RESEARCH.md's draft already does this correctly — Judge/Educator `Set` checks come first,
followed only then by the four override `if` statements, each implicitly unreachable once an
earlier `return` fires).

### `district_type` completeness — one literal must be ADDED beyond CONTEXT.md's list
**Source:** RESEARCH.md `## District Type Enumeration` (live-DB verified) — `SCHOOL_BOARD` (9
rows, 100% DC SBOE) is a real production literal not in CONTEXT.md D-04's stated list (`SCHOOL` +
`STATE_BOARD`) and not handled by any existing frontend code (`classifyCategory` has no branch
for it — falls to the `{tier:'Unknown', group:'Uncategorized'}` catch-all at `classify.js:247`).
**Apply to:** the Educator `Set`/lookup in `classifyBucket` must include `'SCHOOL_BOARD'`
alongside `'SCHOOL'` and `'STATE_BOARD'`, or SC-02 is violated for every DC address.

## No Analog Found

None. Both target files already exist with a directly-analogous sibling function/test-block in
the same file; no cross-codebase search for a different file was needed or productive here.

## Metadata

**Analog search scope:** `src/lib/classify.js`, `src/lib/classify.test.js`,
`src/lib/groupHierarchy.js`, `src/utils/branchType.js`, `src/utils/officeDescriptions.js`,
`src/lib/compass.js` (lines 380-536) — all read in full or via targeted grep+read; no directory-wide
glob search was needed since RESEARCH.md and CONTEXT.md already named the exact files.
**Files scanned:** 6 (all read directly; no additional candidates found via Grep for
`classifyBucket`, `district_type ===`, or `Superintendent` patterns beyond what RESEARCH.md had
already located).
**Pattern extraction date:** 2026-07-17
