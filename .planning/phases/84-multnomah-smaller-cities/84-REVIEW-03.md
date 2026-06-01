---
phase: 84-multnomah-smaller-cities
reviewed: 2026-06-01T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/lib/groupHierarchy.js
  - C:/EV-Accounts/backend/src/lib/essentialsService.ts
findings:
  critical: 1
  warning: 2
  info: 0
  total: 3
status: issues_found
---

# Phase 84 (Plan 03): Code Review Report

**Reviewed:** 2026-06-01
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Two targeted gap-closure edits were reviewed: the `district_type === 'LOCAL_EXEC'` guard in `subGroupOrderScore` (groupHierarchy.js) and the `ENCLAVE_CITY_ALIASES` + centroid-substitution block in `getRepresentativesByAddress` (essentialsService.ts).

The `LOCAL_EXEC` guard logic is structurally correct — empty-array vacuous-truth is properly blocked by the existing `pols.length > 0` check, and the `every()` predicate correctly gates score-10 to groups where all politicians are `LOCAL_EXEC`. No bugs in that change.

The enclave alias block has one critical correctness bug and one related warning in the trigger condition. The `resolvedLat`/`resolvedLng` variables are consistently threaded through all three downstream queries (district, statewide, tribal).

---

## Critical Issues

### CR-01: Enclave alias fires for any correctly-geocoded Oregon address containing the enclave name

**File:** `C:/EV-Accounts/backend/src/lib/essentialsService.ts:559`

**Issue:** The trigger condition is:
```
addrLower.includes(enclaveName)
  && (matchedAddress.toLowerCase().includes(alias.hostCity) || state.toLowerCase() === 'or')
```
The second arm of the OR — `state.toLowerCase() === 'or'` — is state-only, not city-specific. It will fire whenever the Census geocoder returns `state='OR'` and the address string happens to contain "maywood park" (e.g. a street named "Maywood Park Dr" in Eugene, Bend, or any other Oregon city). In those cases the geocoder already returned a correct, non-Portland coordinate, but this block replaces it with the Maywood Park centroid, silently routing the user to Portland's Maywood Park politicians instead of their actual representatives.

The intent is to catch the case where Census TIGER attributes a Maywood Park street to the surrounding city (Portland) in its address database. The correct discriminator for that case is that the geocoder returned `city='Portland'` (or `matchedAddress` contains "Portland") — not merely that the state is Oregon.

**Fix:** Remove the `state` arm entirely. The `matchedAddress` arm already covers the scenario: when Census misattributes a Maywood Park address to Portland, the returned `matchedAddress` will contain "PORTLAND". If the geocoder correctly resolves the address to another Oregon city (Eugene, etc.), `matchedAddress` will contain that city and the condition will be false — correct behavior.

```typescript
// Before (line 559):
if (addrLower.includes(enclaveName) && (matchedAddress.toLowerCase().includes(alias.hostCity) || state.toLowerCase() === 'or')) {

// After:
if (addrLower.includes(enclaveName) && matchedAddress.toLowerCase().includes(alias.hostCity)) {
```

---

## Warnings

### WR-01: Stale geocoding cache can produce empty `matchedAddress`, weakening the enclave guard

**File:** `C:/EV-Accounts/backend/src/lib/essentialsService.ts:559` (see also `geocodingService.ts:86`)

**Issue:** The Redis cache stores `matchedAddress` as part of the cached payload, but cache entries created before `matchedAddress` was added to the schema are returned with `matchedAddress: ''` (via the `?? ''` fallback at geocodingService.ts:86). An empty `matchedAddress` means `matchedAddress.toLowerCase().includes(alias.hostCity)` returns `false` for every alias. If CR-01 above is fixed and the `state === 'or'` arm is removed, a stale cache hit for a genuine Maywood Park address would bypass the substitution entirely, returning Portland coordinates instead of the Maywood Park centroid — the original bug this code was meant to fix.

This is a time-bounded issue (cache TTL is 24 hours), but it is a silent correctness regression for any user whose address was cached before this deployment.

**Fix:** After fixing CR-01, add a `city` fallback to the alias check. The geocoder already returns and caches `city` (geocodingService.ts:139/142). Use it as a tighter discriminator than `state`:

```typescript
const { lat, lng, matchedAddress, state, city } = await geocodeAddress(address);
// ...
if (
  addrLower.includes(enclaveName) &&
  (matchedAddress.toLowerCase().includes(alias.hostCity) ||
   city.toLowerCase() === alias.hostCity)
) {
```

`city` is the `addressComponents.city` field returned by Census — for a Maywood Park address misattributed to Portland, it will be `"Portland"`. This is both more specific than `state` and more resilient to an empty `matchedAddress`.

---

### WR-02: `district_type === 'LOCAL_EXEC'` guard does not handle mixed LOCAL/LOCAL_EXEC sub-groups

**File:** `C:/Transparent Motivations/essentials/src/lib/groupHierarchy.js:382-386`

**Issue:** The new guard uses `pols.every(p => p.district_type === 'LOCAL_EXEC')`. This is the correct predicate for a homogeneous `LOCAL_EXEC` sub-group. However, `getSubGroupKey` (line 164) assigns key segment `EXEC` to politicians where `(dt === 'LOCAL' || dt === 'LOCAL_EXEC') && LOCAL_EXEC_TITLE_RE.test(title)` — i.e., a Mayor with `district_type === 'LOCAL'` (appointed mayor pattern, as documented at line 165 comment) gets the same `EXEC` key segment as a `LOCAL_EXEC` mayor. These two cases can be grouped together under the same sub-group key if a body has both.

In that mixed sub-group, `pols.every(p => p.district_type === 'LOCAL_EXEC')` returns `false` (because one pol is `LOCAL`), so the group scores 20 instead of 10. The Cambridge-style appointed-mayor pattern (explicitly called out in line 253 comment) would have its mayor sub-group sort at score 20 alongside council, rather than before it at score 10.

However, there is a mitigating Rule 1.5 in `getSubGroupLabel` (line 255-261) that handles this case at the label level. Whether the ordering regresses for Cambridge-style cities depends on whether the mixed case actually occurs in production data. The issue is that the guard was written with the homogeneous case in mind and its interaction with the `LOCAL`-typed-mayor edge case was not documented.

**Fix:** Extend the guard to also accept sub-groups where all politicians have an exec-matching office title, regardless of `district_type`:

```javascript
if (
  pols.length > 0 &&
  (pols.every(p => p.district_type === 'LOCAL_EXEC') ||
   pols.every(p => LOCAL_EXEC_TITLE_RE.test(p.office_title || ''))) &&
  EXECUTIVE_KW.some(kw => lower.includes(kw) || titleLower.includes(kw))
) return 10;
```

This preserves the fix for the Council President false-positive (Council President pols have `district_type='LOCAL'` but their titles do not match `LOCAL_EXEC_TITLE_RE = /\b(mayor|governor)\b/i`) while also correctly scoring appointed-mayor groups at 10.

---

_Reviewed: 2026-06-01_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
