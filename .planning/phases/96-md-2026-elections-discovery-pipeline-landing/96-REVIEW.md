---
phase: 96-md-2026-elections-discovery-pipeline-landing
reviewed: 2026-06-06T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/pages/Landing.jsx
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 96: Code Review Report

**Reviewed:** 2026-06-06
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

The only change in scope is the insertion of a single Leonardtown/Maryland entry at line 24 of `COVERAGE_CITIES`. The object shape is syntactically valid and fits the `browseGovernmentList` branch of `handleAreaClick`. Two data-correctness issues were found in the inserted entry, and one pre-existing quality issue surfaced during the pass.

---

## Warnings

### WR-01: St. Mary's County geo_id `'24037'` mixed into a city-slot `browseGovernmentList` without a `browseCountyGeoId`

**File:** `src/pages/Landing.jsx:24`

**Issue:** The inserted entry passes two geo_ids to `browseGovernmentList`: `'2446475'` (Leonardtown) and `'24037'` (St. Mary's County FIPS). Those two are forwarded verbatim as `government_geo_ids` in the POST body sent by `browseByGovernmentList` (api.jsx:335). No `browseCountyGeoId` field is present on the object, so `browse_county_geo_id` is never appended to the URL params (Landing.jsx:86), and `county_geo_id` is therefore absent from the API request body (api.jsx:336-338).

All other multi-geo-id entries that bundle a county-level FIPS (e.g. LA County with `'06037'`, Collin County with `'48085'`) carry an explicit `browseCountyGeoId` field. That field controls county-scoped filtering on the backend. Passing the county FIPS only inside `browseGovernmentList` — where the backend expects municipality geo_ids — is inconsistent with the established pattern and is likely to either produce no county-scope results or silently fetch unscoped results.

**Fix:** Decide which behaviour is intended:

Option A — bundle the county as a scoping hint (mirrors LA/Collin pattern):
```js
{
  label: 'Leonardtown',
  state: 'Maryland',
  browseGovernmentList: ['2446475'],
  browseStateAbbrev: 'MD',
  browseCountyGeoId: '24037',
},
```

Option B — pass both geo_ids to the government-list endpoint and rely on the backend to resolve them (no county scoping):
```js
{
  label: 'Leonardtown',
  state: 'Maryland',
  browseGovernmentList: ['2446475', '24037'],
  browseStateAbbrev: 'MD',
},
```

Verify with a backend team member which geo_id format the `/essentials/browse/by-government-list` endpoint expects for county records before choosing.

---

### WR-02: Entry placed in `COVERAGE_CITIES` but `'24037'` is a county FIPS, rendering it in the Cities grid

**File:** `src/pages/Landing.jsx:24`

**Issue:** `COVERAGE_CITIES` is rendered in the "Cities" section (line 304: `<p … >Cities</p>`). Leonardtown is a small town in St. Mary's County, which is arguably appropriate for the Cities grid. However, the second geo_id in the list — `'24037'` — is St. Mary's County's FIPS code, a county-level identifier. If county-level data is intentionally included, this entry arguably belongs in `COVERAGE_COUNTIES` to keep the UI labelling accurate and to enable the `browseCountyGeoId` pattern used by every other county entry. If only municipal data is intended, the `'24037'` geo_id should be removed or moved to `browseCountyGeoId`.

**Fix:** If the intent is to surface St. Mary's County government alongside Leonardtown's town government, move the entry to `COVERAGE_COUNTIES` and add the explicit county field:
```js
// In COVERAGE_COUNTIES:
{
  label: "St. Mary's County",
  state: 'Maryland',
  browseGovernmentList: ['2446475'],
  browseStateAbbrev: 'MD',
  browseCountyGeoId: '24037',
},
```
If the intent is purely municipal (Leonardtown town government only), remove `'24037'` from the array:
```js
{ label: 'Leonardtown', state: 'Maryland', browseGovernmentList: ['2446475'], browseStateAbbrev: 'MD' },
```

---

## Info

### IN-01: `key` collision risk — two entries with `label: 'Portland'` in `COVERAGE_CITIES`

**File:** `src/pages/Landing.jsx:21,23`

**Issue:** React keys for `COVERAGE_CITIES` buttons are derived as `` `${area.label}-${area.state}` `` (line 308). Portland ME (`'Portland-Maine'`) and Portland OR (`'Portland-Oregon'`) produce distinct keys, so no current collision exists. This is pre-existing and not introduced by phase 96, but worth noting: if a second Maryland entry with the same label were ever added the same key-collision pattern would re-emerge. The key strategy is fragile compared to a stable unique id field.

**Fix:** No immediate action required. Long-term, consider adding a stable `id` field to each entry and using it as the React key.

---

_Reviewed: 2026-06-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
