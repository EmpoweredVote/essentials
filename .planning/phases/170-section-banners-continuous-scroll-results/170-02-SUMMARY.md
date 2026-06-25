---
phase: 170-section-banners-continuous-scroll-results
plan: "02"
subsystem: frontend-filter
tags: [filter, tier-removal, filterbar, nav]
dependency_graph:
  requires: []
  provides: [FilterBar without tier props]
  affects: [src/components/FilterBar.jsx, src/pages/Results.jsx (call site — Plan 170-03)]
tech_stack:
  added: []
  patterns: [inline-style dark tokens, React props destructuring]
key_files:
  created: []
  modified:
    - src/components/FilterBar.jsx
decisions:
  - "Remove TIER_OPTIONS + selectedFilter + onFilterChange entirely rather than deprecating; Plan 170-03 handles the call site"
  - "Update inner JSDoc comment (line 62) as well as top-of-file comment to be consistent post-removal"
metrics:
  duration: "< 5 minutes"
  completed: "2026-06-25"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 170 Plan 02: Remove Tier Sort Dropdown from FilterBar Summary

**One-liner:** Tier dropdown removed from FilterBar — TIER_OPTIONS, selectedFilter, and onFilterChange deleted; Type filter, name search, and Compass toggle preserved lint-clean.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove the Tier dropdown and its props from FilterBar | cd64b77 | src/components/FilterBar.jsx |

## What Was Built

Surgical removal of the Local/State/Federal tier sort control from `FilterBar.jsx`:

- Deleted `TIER_OPTIONS` constant (was lines 11-16)
- Removed `selectedFilter` and `onFilterChange` from the `FilterBar` props destructuring
- Removed the Tier `<Dropdown>` render block (was lines 97-104)
- Updated top-of-file JSDoc ("consolidates tier/type/name filters" → "consolidates type/name filters")
- Updated inner JSDoc ("Tier dropdown, Type dropdown" → "Type dropdown")

Preserved unchanged: `Dropdown` helper function, `TYPE_OPTIONS`, the Type `<Dropdown>` render, name-search `<input>` block, Compass toggle `<label>` block, `StickyCompassKey` export.

## Acceptance Criteria Verification

```
grep -c "TIER_OPTIONS" src/components/FilterBar.jsx  → 0  PASS
grep -c "selectedFilter" src/components/FilterBar.jsx → 0  PASS
grep -c "onFilterChange" src/components/FilterBar.jsx → 0  PASS
grep -c "TYPE_OPTIONS" src/components/FilterBar.jsx   → 2  PASS
grep -c "Search by name" src/components/FilterBar.jsx → 2  PASS
grep -c "StickyCompassKey" src/components/FilterBar.jsx → 1 PASS
npx eslint src/components/FilterBar.jsx               → exit 0 PASS
```

## Deviations from Plan

**Minor:** Updated the inner function JSDoc comment at line 62 ("Tier dropdown, Type dropdown, name search…" → "Type dropdown, name search…") in addition to the top-of-file comment. The plan only explicitly called out the top-of-file comment, but the inner comment was equally stale. This is a documentation consistency fix, not a behavior change.

Otherwise plan executed exactly as written.

## Downstream Note (Plan 170-03)

`FilterBar` no longer accepts `selectedFilter` or `onFilterChange`. Plan 170-03 MUST remove those two props from the `<FilterBar … />` call site in `src/pages/Results.jsx` (lines ~1827-1828) or the page will pass dead props.

## Known Stubs

None. This is a pure removal — no new rendering, no placeholder data.

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries introduced. This is a client-side filter component removal only.

## Self-Check: PASSED

- [x] `src/components/FilterBar.jsx` modified — verified via Read
- [x] Commit cd64b77 exists — verified via `git rev-parse --short HEAD`
- [x] All grep acceptance criteria return expected counts
- [x] ESLint exits 0
