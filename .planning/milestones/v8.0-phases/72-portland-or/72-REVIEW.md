---
phase: 72-portland-or
reviewed: 2026-05-28T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql
  - C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts
  - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 72: Code Review Report

**Reviewed:** 2026-05-28
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files were reviewed: the new OR verify SQL script, the new OR smoke test, and the OR-specific additions to the generalized TIGER loader. The OR-specific additions (4 config entries + fipsArg===41 block) follow the ME/CA precedent closely. One verified fact (the dry-run-confirmed G4110 count of 241) creates a divergence from the research doc (which says 242); the three production files are internally consistent at 241, which is correct.

The critical correctness issues found are at Warning level: a misleading "SC3: All layer counts OK" log that can print even when some counts failed, a missing `forbiddenMtfcc: ['G4110']` assertion on the Salem address (which is within city limits — the omission is a genuine test gap), and a query inversion in Gate 7 of the verify SQL (checks geofences with no matching district row, but the comment claims it checks the other direction). Two info items cover a stale research-doc count and a cosmetic SC3 summary string.

---

## Warnings

### WR-01: Gate 7 section-split query is inverted relative to its comment

**File:** `C:/EV-Accounts/backend/scripts/verify-or-tiger-import.sql:51-58`

**Issue:** The comment says "any district row missing a matching geofence row" but the query does the opposite: it finds `geofence_boundaries` rows whose `geo_id` is NOT IN `districts`. These are two distinct failure modes. The existing query will catch geofences that were loaded but whose corresponding district INSERT was skipped or failed. It will NOT catch districts rows that somehow exist without a matching geofence (which cannot happen given the loader writes geofence first, but the comment is inaccurate and the diagnostic value is the reverse of what the comment says).

The comment from the RESEARCH.md plan correctly describes the intent as "all OR boundaries have matching districts rows" — the query as written does implement this correctly for the actual failure mode that can occur (a geofence upsert that succeeds but the district INSERT fails). However the natural-language comment misleads the operator running the gate: they will expect to diagnose missing-district-row failures but the columns returned (`geo_id, name, mtfcc` from `geofence_boundaries`) point at the geofence, not the district.

**Fix:** Correct the comment to match what the query actually does:

```sql
-- Gate 7: Geofence rows with no matching districts row — any result is a loader bug
-- (geofence loaded but district INSERT failed). Expected: 0 rows.
SELECT gb.geo_id, gb.name, gb.mtfcc
FROM essentials.geofence_boundaries gb
WHERE gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')
  AND gb.state = '41'
  AND gb.geo_id NOT IN (SELECT geo_id FROM essentials.districts)
LIMIT 10;
-- Expected: 0 rows
```

---

### WR-02: SC3 "All layer counts OK" message prints even when individual count failures occurred

**File:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts:126-128`

**Issue:** The success log on line 126 checks only that the number of distinct MTFCC keys returned equals the number of expected keys — it does NOT check that all individual counts matched. Consider: if G4110 returns 240 rows (wrong) and G4020 returns 36 (correct) and G5200 returns 7 (wrong), the length comparison still passes because 5 keys == 5 expected keys. The errors are already pushed to `errors[]` and `allPassed` is already false, so the final result is correct — but the intermediate "SC3: All layer counts OK" console.log will still print, misleading the operator reading real-time output.

```typescript
// Current (line 126) — fires even if some counts failed:
if (Object.keys(actualCounts).length === Object.keys(expectedCounts).length) {
  console.log('  SC3: All layer counts OK');
}
```

**Fix:** Gate the success log on `allPassed` remaining true after the count loop, or track a per-SC3 pass flag:

```typescript
let sc3Passed = true;
for (const [mtfcc, expected] of Object.entries(expectedCounts)) {
  const actual = actualCounts[mtfcc] ?? 0;
  if (actual !== expected) {
    sc3Passed = false;
    // ... existing error push
  }
}
const allMtfccPresent = Object.keys(actualCounts).length === Object.keys(expectedCounts).length;
if (sc3Passed && allMtfccPresent) {
  console.log('  SC3: All layer counts OK');
}
```

---

### WR-03: Salem test address has no `forbiddenMtfcc` guard — cannot verify it falls inside city limits

**File:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts:55-61`

**Issue:** The Salem address (lon: -123.0351, lat: 44.9429) uses `expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220']` with no `forbiddenMtfcc`. This means if the coordinate happens to be outside Salem city limits (e.g. a suburb or unincorporated Marion County), the smoke test will fail on `G4110` missing — but it will NOT catch the inverse: if Salem G4110 is returned but the coordinate is actually outside the city. More concretely, SC2 (Bend unincorporated) correctly uses `forbiddenMtfcc: ['G4110']` to protect against the coordinate drifting into an incorporated area. Salem has no such protection in either direction.

This matters because the smoke test serves as a regression gate for future loader re-runs. Without a `forbiddenMtfcc` for the Salem address, a coordinate that incorrectly returns two G4110 rows (or a wrong G4110) would pass silently.

The deeper problem: Salem is an `expectedMtfcc` address, not a `forbiddenMtfcc` address, so the test will correctly detect if G4110 is absent. The missing piece is an `expectedGeoIds` assertion — like Portland, Salem's G4110 `geo_id` should be asserted once it is confirmed from the DB (the loader will produce it). Adding a verified `expectedGeoIds` for Salem would make the test catch wrong-city-boundary bugs.

**Fix:** After running the loader and confirming Salem's geo_id, add:

```typescript
{
  label: 'Salem OR (state capital, Marion County)',
  lon: -123.0351,
  lat: 44.9429,
  expectedMtfcc: ['G4020', 'G4110', 'G5200', 'G5210', 'G5220'],
  expectedGeoIds: {
    G4110: '<salem-geo-id-from-db>', // e.g. '4164900' — verify after load
    G4020: '<marion-county-geo-id>', // e.g. '41047'
  },
},
```

---

## Info

### IN-01: RESEARCH.md place count (242) is now stale — implementation uses 241 (dry-run confirmed)

**File:** `C:/Transparent Motivations/essentials/.planning/phases/72-portland-or/72-RESEARCH.md` — multiple locations

**Issue:** The research doc's Assumptions Log (A1) and Code Examples both state 242 G4110 incorporated places. The dry-run on 2026-05-28 found 241, and all three production files (`load-state-tiger-boundaries.ts:816`, `smoke-or-geofences.ts:107`, `verify-or-tiger-import.sql:22`) are consistently updated to 241 with the dry-run confirmation note. The RESEARCH.md still says 242 in at least 4 places, creating a confusing discrepancy if a future reviewer reads the research before the implementation.

**Fix:** Update RESEARCH.md Assumptions Log A1, Standard Stack table, Code Examples section, and the Summary paragraph from 242 to 241, noting "confirmed via dry-run 2026-05-28." This is a documentation-only change; no code is affected.

---

### IN-02: SC3 success summary hardcodes "N cities" rather than the actual confirmed count

**File:** `C:/EV-Accounts/backend/scripts/smoke-or-geofences.ts:235`

**Issue:** The final "ALL ASSERTIONS PASSED" banner prints:

```
SC3: All 6 CD + 30 senate + 60 house + 36 counties + N cities present [PASS]
```

The `N` is a literal placeholder, not a substitution. The actual count (241) is already in `expectedCounts.G4110`. Using `N` reduces the diagnostic value of the success banner — an operator verifying the output after a re-run cannot immediately tell if the city count assertion was 241 or something else.

**Fix:**

```typescript
console.log(`  SC3: All 6 CD + 30 senate + 60 house + 36 counties + ${expectedCounts.G4110} cities present [PASS]`);
```

This requires hoisting `expectedCounts` out of the `try` block or referencing it at the point of declaration. Since `expectedCounts` is already in scope within the `try` block where `allPassed` is evaluated, the fix is to move the final banner inside the `try` block or capture the count in a variable before the `finally`.

---

_Reviewed: 2026-05-28_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
