---
phase: 105-va-2026-elections-discovery
reviewed: 2026-06-09T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/pages/Landing.jsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 105: Code Review Report

**Reviewed:** 2026-06-09
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

The sole change in scope is the Alexandria entry appended to `COVERAGE_CITIES` in `src/pages/Landing.jsx`:

```js
{ label: 'Alexandria', state: 'Virginia', browseGovernmentList: ['5101000', '51510'], browseStateAbbrev: 'VA' },
```

Both geo IDs are correct per `project_v120_virginia.md`: `5101000` is the G4110 incorporated-place FIPS and `51510` is the G4020 county-equivalent FIPS — the documented dual-tier TIGER pattern for Virginia independent cities (same as Baltimore City pattern used in Phase 96). `browseStateAbbrev: 'VA'` is correct. The new entry itself has no defects.

The three warnings and two info items are pre-existing issues in the file, surfaced here under the adversarial mandate to review the full file in scope, not just the diff.

## Warnings

### WR-01: Name-search status classifier treats any non-`'fresh'` API status as an error

**File:** `src/pages/Landing.jsx:120`
**Issue:** `setNameStatus(status === 'fresh' ? 'fresh' : 'error')` will display "Search failed. Try again." for any status string other than `'fresh'`, including valid statuses such as `'stale'`, `'cached'`, or `'ok'` that many API wrappers return. If `searchPoliticiansByName` ever returns valid results under a non-`'fresh'` status key, the user sees a false error while `nameResults` is correctly populated — a confusing and incorrect state.
**Fix:**
```js
// Replace line 120 with an explicit error guard:
const isError = status === 'error' || !Array.isArray(data);
setNameResults(isError ? [] : data);
setNameStatus(isError ? 'error' : 'fresh');
```

---

### WR-02: `useEffect` cleanup registered on early-return path where no timeout was set

**File:** `src/pages/Landing.jsx:112-122`
**Issue:** The cleanup function `return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }` at line 122 is only reached after the early-return guard at line 112 — but the early return at line 114 exits before the cleanup is registered, so cleanup only runs when a timeout was actually set. This is functionally safe today, but it is structurally misleading: a reader expects the cleanup at the end of a `useEffect` body to always be registered. If a future edit reorders the early-return, the cleanup could silently stop working for the active path.
**Fix:** Make the registration intent explicit by placing the cleanup `return` immediately after the `setTimeout` assignment, not at the bottom of the shared scope:
```js
useEffect(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  const q = nameQuery.trim();
  if (q.length < 2) {
    setNameResults([]);
    setNameStatus('idle');
    return;  // no cleanup — no timeout set
  }
  setNameStatus('loading');
  debounceRef.current = setTimeout(async () => {
    const { status, data } = await searchPoliticiansByName(q);
    setNameResults(Array.isArray(data) ? data : []);
    setNameStatus(status === 'fresh' ? 'fresh' : 'error');
  }, 300);
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, [nameQuery]);
```

---

### WR-03: Name search result images use `photo_origin_url` — likely wrong field for CDN-hosted headshots

**File:** `src/pages/Landing.jsx:147`
**Issue:** `src={pol.photo_origin_url}` uses the provenance-tracking field (`photo_origin_url`) as the display image URL. Project memory (`project_ca_state_legislature.md`) notes "politician_images has NO photo_origin_url" and headshot workflow docs establish that uploaded images are stored at a Supabase Storage CDN URL distinct from the original crawl source. If the API returns a raw government-site URL or an unavailable path in `photo_origin_url`, images will 404 silently (the `onError` hides the broken element). The correct field is likely a CDN or storage URL returned by the search endpoint.
**Fix:** Verify the shape of the `searchPoliticiansByName` response. Use the CDN/storage URL field (e.g., `photo_url` or Supabase Storage URL) rather than `photo_origin_url`. The `onError` fallback at line 151 is a good defensive measure regardless and should be kept.

---

## Info

### IN-01: Alexandria appended out of alphabetical order; comment claims "alphabetized horizontally then vertically"

**File:** `src/pages/Landing.jsx:25` (data) and `src/pages/Landing.jsx:303` (comment)
**Issue:** The comment "Cities — 3 columns, alphabetized horizontally then vertically" does not match the array order. Alexandria (A) should precede Berkeley (B) but is appended last. The sort order was already inconsistent before this change (Portland ME appears before Cambridge). The mismatch between the stated display intent and actual rendering order will be visible to users.
**Fix:** Either sort `COVERAGE_CITIES` alphabetically by `label` (simplest: Alexandria, Berkeley, Cambridge, Fremont, Leonardtown, Portland ME, Portland OR, Sacramento, San Diego, San Francisco, San Jose) or remove the misleading comment at line 303.

---

### IN-02: `browseGeoId`/`browseMtfcc` branch in `handleAreaClick` is dead code

**File:** `src/pages/Landing.jsx:89-97`
**Issue:** The `else if (area.browseGeoId)` branch (lines 89-97) is never reached — no entry in `COVERAGE_CITIES` or `COVERAGE_COUNTIES` sets `browseGeoId`. This is a pre-existing condition, not introduced by Phase 105.
**Fix:** Either remove the dead branch if the pattern has been superseded by `browseGovernmentList`, or add a comment noting it is reserved for future use.

---

_Reviewed: 2026-06-09_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
