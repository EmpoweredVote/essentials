---
phase: 207-officials-classification
fixed_at: 2026-07-17T20:44:30Z
review_path: .planning/phases/207-officials-classification/207-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 207: Code Review Fix Report

**Fixed at:** 2026-07-17T20:44:30Z
**Source review:** .planning/phases/207-officials-classification/207-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3 (WR-01, WR-02, WR-03; fix_scope = critical_warning, 0 Critical findings existed)
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: DA/prosecutor whitelist regex misses real state-specific elected-prosecutor titles

**Files modified:** `src/lib/classify.js`, `src/lib/classify.test.js`
**Commit:** `192bd12d`
**Applied fix:** Added Florida's bare "State Attorney" (no apostrophe-s) and VA/KY's
"Commonwealth's Attorney" as additional alternatives in `PROSECUTOR_DEFENDER_TITLE_RE`.
Verified the negative guards ("Attorney General", "City Attorney") still fall through to
`representative` — the existing negative-guard tests (Pitfall 3) re-ran and passed against the
widened regex, and new positive regression tests were added for both new title forms under
`district_type: 'COUNTY'`.

### WR-02: `state's attorney` regex only accepts the ASCII straight apostrophe

**Files modified:** `src/lib/classify.js`, `src/lib/classify.test.js`
**Commit:** `8b0805eb`
**Applied fix:** Widened the apostrophe character class for both `state's attorney` and
`commonwealth's attorney` from a literal ASCII `'?` to `['’]?`, so the regex now accepts the ASCII
straight apostrophe (U+0027), the typographic/curly apostrophe (U+2019 — common in web-scraped
titles), and the missing-apostrophe form (e.g. "States Attorney"). Added four new regression tests
covering curly-apostrophe and missing-apostrophe forms for both "State's Attorney" and
"Commonwealth's Attorney", plus re-ran the full DA/prosecutor and negative-guard test blocks to
confirm no regressions.

### WR-03: School-board chamber-text fallback is broader than its own documenting comment claims

**Files modified:** `src/lib/classify.js`, `src/lib/classify.test.js`
**Commit:** `317147d5`
**Applied fix:** Per the phase's stated preference (additive-only invariant means broader is
safe), left the code behavior unchanged and rewrote the `SCHOOL_BOARD_TEXT_RE` comment to state
explicitly that the chamber/title fallback is intentionally dt-independent — mirroring D-02's
DA/prosecutor override precedent — rather than scoped to `district_type === 'LOCAL'` as the
original comment implied. Added two new regression tests proving the intentional wider scope:
a `STATE_EXEC` row with an incidental "Board of Education" title, and a `COUNTY` row with a
"School Board" chamber name, both correctly classify as `educator`.

## Skipped Issues

None — all in-scope findings were fixed.

---

**Verification performed for every fix:**
- `npx vitest run src/lib/classify.test.js` — 82 -> 86 -> 88 tests, all passing after each
  successive commit.
- `npm test` (full suite) — 197 -> 201 -> 203 tests, all passing after each successive commit.
- No changes made to `classifyCategory` or `computeVariant`, per scope constraint.

_Fixed: 2026-07-17T20:44:30Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
