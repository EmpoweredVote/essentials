---
phase: 173-nevada-playbook-retrospective-close
reviewed: 2026-06-30T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/lib/coverage.js
findings:
  critical: 0
  warning: 0
  info: 2
  total: 2
status: clean
---

# Phase 173: Code Review Report

**Reviewed:** 2026-06-30T00:00:00Z
**Depth:** standard
**Files Reviewed:** 1
**Status:** clean

## Summary

Reviewed `src/lib/coverage.js`, a single data-only edit to the `COVERAGE_STATES` Nevada block. The change (commit `06a9db3`) removes the `hasContext: true` key from the Clark County School District entry while the other 5 NV jurisdictions retain it.

Adversarial verification performed:

- **Parse integrity** — `node --check src/lib/coverage.js` exits 0 (SYNTAX_OK). The array structurally parses; no dangling commas, brackets, or quotes introduced. The trailing comma after the CCSD object (line 190) and the closing `],` / `},` (lines 191-192) are intact.
- **Diff scope** — `git show 06a9db3` confirms the edit is a single line: only the `hasContext: true` key was removed. No other tokens, whitespace anomalies, or collateral edits. Surgical as described.
- **Sibling consistency** — The CCSD entry intentionally differs from its 5 NV siblings: it routes via `browseGeoId: '3200060'` + `browseMtfcc: 'G5420'` (school-district MTFCC) rather than `browseGovernmentList`. This is correct and matches the pre-existing school-district routing contract; it is NOT a regression introduced by this phase (the `browseGeoId`/`browseMtfcc` shape predates this commit, per `6752d70`).
- **Downstream consumption traced** — The `hasContext` key is consumed in two places, both of which handle its absence gracefully:
  - `coverageAreaToPath` (lines 290-318) and `Landing.jsx` `handleAreaClick` (lines 112-135) select the routing branch on `browseGovernmentList ? ... : browseGeoId ? ... : address`. CCSD correctly falls into the `browseGeoId` branch, emitting `browse_geo_id=3200060&browse_mtfcc=G5420`. Removing `hasContext` does not touch routing.
  - `Landing.jsx` line 425 uses `area.hasContext` only to pick the chip color class (purple vs teal). Absent/falsy `hasContext` renders the plain teal chip — exactly the intended "0 compass stances by design" presentation.
  - `searchCoverageAreas` sort tiebreaker (line 280) reads `b.area.hasContext ? 1 : 0`, which is `undefined`-safe; CCSD simply sorts after stance-seeded entries. No crash, no NaN.
- **`nevada -> NV` ride-along** — `STATE_NAME_TO_ABBREV` (line 202) maps `nevada: 'NV'`, and `ALL_COVERAGE_AREAS` derives `stateAbbrev` from `browseStateAbbrev || s.abbrev` (line 256). CCSD carries `browseStateAbbrev: 'NV'`, so the flattened search view tags it correctly.

No bugs, security issues, or structural regressions found. The two info items below are pre-existing observations unrelated to this phase's edit; neither blocks shipping.

## Info

### IN-01: Search typeahead is unreachable for the CCSD entry by its leading-token

**File:** `src/lib/coverage.js:268-284` (`searchCoverageAreas`) and `:190`
**Issue:** `searchCoverageAreas` returns `[]` for any query with a leading digit (`/^\d/.test(raw)`, line 270) to defer to address autocomplete. The CCSD label "Clark County School District" is text-leading, so it remains searchable by "Clark", "County", "School", etc. via the `indexOf` substring match (line 275) — no defect here. This is a confirmation, not a bug: the substring search correctly surfaces CCSD for the typeahead. Noting it only because the CCSD entry is the one NV area without `hasContext`, so it will always rank below the 5 stance-seeded NV areas in the tiebreaker (line 280) — which is the intended behavior.
**Fix:** None required. Behavior is correct by design.

### IN-02: `hasContext` documented as a city-stance flag but reused for the search sort across all kinds

**File:** `src/lib/coverage.js:5` (header comment) and `:280`
**Issue:** The file header (line 5) documents `hasContext: true` as "city has compass stances seeded (rendered as a purple chip)." The same key is also read in the `searchCoverageAreas` sort to rank stance-seeded areas ahead of plain ones (line 280), across cities, counties, and (implicitly) states. This dual purpose is not wrong, but the header comment understates the second consumer. After this phase's edit, CCSD correctly has no `hasContext`, so both consumers treat it as a plain area — consistent. Documentation-only nit.
**Fix:** Optionally extend the header comment to note `hasContext` also influences typeahead ranking, e.g.: `// hasContext: true = compass stances seeded (purple chip + ranked ahead in typeahead).`

---

_Reviewed: 2026-06-30T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
