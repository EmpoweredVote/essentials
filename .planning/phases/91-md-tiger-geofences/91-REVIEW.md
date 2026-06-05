---
phase: 91-md-tiger-geofences
reviewed: 2026-06-05T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
  - C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql
  - C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts
findings:
  critical: 2
  warning: 5
  info: 2
  total: 9
status: issues_found
---

# Phase 91: Code Review Report

**Reviewed:** 2026-06-05
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the four MD-specific additions to `load-state-tiger-boundaries.ts`, the 7-gate `verify-md-tiger-import.sql`, and the 3-address `smoke-md-geofences.ts`. The implementations follow the established OR/ME pattern closely. Two blockers were found: one is a structural logic gap that silently passes SC3 when actual row counts differ, and the other is a coordinate precision risk that could cause the Garrett County smoke test to pass falsely. Five warnings cover a data integrity gap in the verify SQL, a missing D-02 invariant test, a place-layer filter discrepancy inside the MD MTFCC pre-flight block, a comment/code mismatch in the pre-flight block comment, and a missing `ORDER BY mtfcc` in Gate 4. Two informational items cover a stale planning artifact comment and a redundant annotation.

---

## Critical Issues

### CR-01: SC3 "all counts OK" log prints even when some MTFCCs are missing from DB

**File:** `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts:123-125`

**Issue:** The SC3 success message `SC3: All layer counts OK` is printed when `Object.keys(actualCounts).length === Object.keys(expectedCounts).length` — that is, when the DB returned the same number of *distinct* MTFCC codes as expected. However `actualCounts` is built only from rows the DB actually returns. If a layer was never loaded (say G5220 has 0 rows), the DB returns no row for that MTFCC code, so `actualCounts` has fewer keys than `expectedCounts` and the condition is `false` — the message is suppressed. So far so good.

But the converse is the real trap: if a layer produces more distinct MTFCC codes than expected (hypothetically impossible given the fixed IN list, but more relevantly) the *per-MTFCC count mismatch* check at lines 114–121 already sets `allPassed = false` correctly, but the `SC3: All layer counts OK` banner at line 124 fires anyway when `Object.keys(actualCounts).length === 5` — even though one or more of those counts just failed. The banner is therefore a false green when any single expected count is wrong but all 5 MTFCC codes are present. The banner has no connection to whether the per-count assertions passed.

The OR analog (smoke-or-geofences.ts:126-128) has exactly the same code — this is an inherited bug that was not corrected when adapting for MD.

**Fix:** Gate the success banner on `allPassed` being still `true` at this point, or track a local `sc3Passed` flag:

```typescript
let sc3Passed = true;
for (const [mtfcc, expected] of Object.entries(expectedCounts)) {
  const actual = actualCounts[mtfcc] ?? 0;
  if (actual !== expected) {
    const msg = `SC3 FAIL: ${mtfcc} expected ${expected} rows, got ${actual}`;
    console.log(`  ERROR: ${msg}`);
    errors.push(msg);
    allPassed = false;
    sc3Passed = false;
  }
}
if (sc3Passed && Object.keys(actualCounts).length === Object.keys(expectedCounts).length) {
  console.log('  SC3: All layer counts OK');
}
```

---

### CR-02: Garrett County smoke coordinate may silently pass when point is inside Oakland city

**File:** `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts:44-49`

**Issue:** The Garrett County test uses `lon: -79.3, lat: 39.53`. The RESEARCH.md (§Pitfall 5, §Assumptions A3) explicitly documents that the Garrett County geographic center is near Oakland city (GEOID ~2456200) and the coordinate may fall inside Oakland's G4110 boundary. The comment on the test case says "If G4110 is returned, the coordinate fell inside Oakland city; shift to (-79.45, 39.65)" — but the shift has NOT been applied. The coordinate shipped is the one the research flagged as potentially wrong.

This means the `forbiddenMtfcc: ['G4110']` assertion may pass even though it should fail (the coordinate is unincorporated), OR the SC2 assertion will fire a false failure (G4110 returned for an allegedly-rural point). Either way the test intent is unreliable until the coordinate is verified or shifted. Given the research explicitly named this as a known risk and provided the safer fallback, shipping the unverified coordinate is a defect — the correct fix is mechanical.

**Fix:** Use the research-recommended fallback coordinate that is confirmed to be in an unincorporated area of Garrett County:

```typescript
{
  label: 'Rural Garrett County MD (unincorporated)',
  lon: -79.45,   // shifted from -79.3 per RESEARCH.md Pitfall 5 / Assumptions A3
  lat: 39.65,    // NW corner of Garrett County, away from Oakland city
  expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
  forbiddenMtfcc: ['G4110'],
},
```

Alternatively, verify the original coordinate against the Oakland city TIGER boundary before shipping. The RESEARCH.md fallback is preferable until that verification is performed.

---

## Warnings

### WR-01: verify-md-tiger-import.sql Gate 3 GROUP BY does not filter by MTFCC — can mask missing layers

**File:** `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql:17-23`

**Issue:** Gate 3 runs `SELECT mtfcc, COUNT(*) FROM essentials.geofence_boundaries WHERE state = '24' GROUP BY mtfcc ORDER BY mtfcc` without filtering to the five expected MTFCCs. If fewer than 5 layers were loaded (e.g., the `sldl` layer failed silently), the query returns only the rows that exist. The expected counts are listed only as a comment; there is no assertion in SQL that checks against those numbers. A reader examining the output must manually notice that G5220 is absent. Compare: the OR analog (verify-or-tiger-import.sql lines 17-23) has the same structure — this is an inherited limitation, not a regression, but it becomes more important here because the SLDL count was previously unknown (TBD) and the comment still contains placeholder language `[DRY-RUN-COUNT]` for G4110 and G5220.

The real risk: an operator running this gate after a partial load sees 4 rows instead of 5 and may not notice the missing MTFCC if they are in a hurry.

**Fix:** Add an explicit expected-count row to Gate 3, or add a companion assertion query:

```sql
-- Gate 3b: Explicit count assertions (will return 0 rows if all counts match)
SELECT expected.mtfcc, expected.n AS expected, COALESCE(actual.row_count, 0) AS actual
FROM (VALUES
  ('G4020'::text, 24::bigint),
  ('G4110', 157),
  ('G5200', 8),
  ('G5210', 47),
  ('G5220', 71)
) AS expected(mtfcc, n)
LEFT JOIN (
  SELECT mtfcc, COUNT(*) AS row_count
  FROM essentials.geofence_boundaries WHERE state = '24' GROUP BY mtfcc
) actual USING (mtfcc)
WHERE COALESCE(actual.row_count, 0) <> expected.n;
-- Expected: 0 rows returned
```

Update the literal counts once dry-run confirms them.

---

### WR-02: D-02 invariant (Baltimore County address must NOT return G4110) has no test in smoke script

**File:** `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts:30-58`

**Issue:** RESEARCH.md D-02 explicitly states: "Baltimore County (separate G4020 entity surrounding but excluding Baltimore City) is a normal county row. A Baltimore County address must NOT return the G4110 Baltimore City row." RESEARCH.md §Baltimore City Sentinel Values and §Pitfall 3 both name Towson (lon: -76.6052, lat: 39.4016) as the correct test coordinate for this invariant. The smoke test has no such test case. If the Baltimore City G4110 polygon boundary is loaded with an error that makes it over-extend into Baltimore County, this invariant will never fire.

The 91-RESEARCH.md Validation Architecture table row for D-02 reads "Optional Gate in smoke test" — but the implementation ships with that optional gate absent.

**Fix:** Add a fourth test address to `TEST_ADDRESSES`:

```typescript
{
  // Towson MD — Baltimore County seat; must NOT return G4110 Baltimore City polygon
  label: 'Towson MD (Baltimore County seat — must NOT return G4110)',
  lon: -76.6052,
  lat: 39.4016,
  expectedMtfcc: ['G4020', 'G5200', 'G5210', 'G5220'],
  forbiddenMtfcc: ['G4110'],
  expectedGeoIds: {
    G4020: '24005', // Baltimore County (not Baltimore City)
  },
},
```

---

### WR-03: MD MTFCC pre-flight block in processLayer() does not apply FUNCSTAT filter for cousub — but cousub is excluded, creating a gap if it is ever added

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:870-896`

**Issue:** The MD MTFCC pre-flight assertion block (fipsArg === '24', lines 859-896) mirrors the OR block but does not include the `cousub` FUNCSTAT filter that appears in the MA block (lines 667-670). This is correct for the current scope because MD does not have `cousub` in its allowlist (D-05). However the pre-flight block's filter logic at lines 870-882 also does not include the same FUNCSTAT filter applied in the actual stream pass (lines 933-945 for cousub). The inconsistency is structural: every other pre-flight block is required to "apply the same filter logic as the upsert pass below" (comment at line 870), but for future state additions that include cousub this asymmetry becomes a silent count mismatch.

More immediately: the pre-flight block comment at line 857 says:

> `// sldl and place values are set to 0 so dry-run MtfccAssertionError reveals actual count.`

But the actual values in the code are `71` and `157` (not `0`). This comment is a leftover from the TBD phase and is now factually incorrect. An operator reading it will expect the assertion to fire immediately (because "set to 0") but it will only fire if TIGER file counts differ from 71/157.

**Fix for comment:** Update the pre-flight block comment to accurately describe the current state:

```typescript
// ── MD MTFCC pre-flight assertion (Phase 91) ────────────────────────────────
// For MD (state='24'), count records satisfying the same filters as the upsert
// pass BEFORE any DB write. Assertion failure is named and fatal.
// sldl=71 and place=157 confirmed via dry-run 2026-06-05.
if (fipsArg === '24') {
```

---

### WR-04: verify-md-tiger-import.sql Gate 4 missing ORDER BY causes non-deterministic row order

**File:** `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql:26-33`

**Issue:** Gate 4 queries two rows (geo_id IN ('2404000', '24510')) and the comment documents the expected order:

```
-- geo_id='24510',   name='Baltimore city', mtfcc='G4020'  (independent city-county)
-- geo_id='2404000', name='Baltimore city', mtfcc='G4110'  (incorporated place)
```

The query has `ORDER BY mtfcc` — wait, checking line 30: `ORDER BY mtfcc` IS present. This is actually correct. Disregard this specific finding.

**Revised finding — Gate 5 districts counts include a casing assumption that may not match actual loader behavior for sldl/sldu/county rows:**

Gate 5 comment (line 42-45) says:
```
--   md  | COUNTY         | 24
--   md  | STATE_LOWER    | [DRY-RUN-COUNT, ~71]
--   md  | STATE_UPPER    | 47
--   MD  | NATIONAL_LOWER |  8
```

The `MD` (uppercase) for NATIONAL_LOWER is correct per Pitfall 6 / loader D-02 pattern. However the query filters `WHERE state IN ('MD', 'md')` — this is the right guard. The comment placeholder `[DRY-RUN-COUNT, ~71]` for STATE_LOWER should be updated to `71` now that the dry-run is confirmed. Leaving it as a placeholder is a quality gap: anyone running the gate after load cannot tell if the output is correct without going back to the RESEARCH.md.

**Fix:** Update the Gate 5 comment to replace `[DRY-RUN-COUNT, ~71]` with `71`:

```sql
-- Expected:
--   md  | COUNTY         | 24
--   md  | STATE_LOWER    | 71
--   md  | STATE_UPPER    | 47
--   MD  | NATIONAL_LOWER |  8
```

---

### WR-05: smoke-md-geofences.ts SC3 "all counts OK" check uses key-count equality, not value equality

**File:** `C:/EV-Accounts/backend/scripts/smoke-md-geofences.ts:123-125`

**Issue:** (This warning is the secondary consequence of CR-01.) Even if CR-01 is fixed by gating on `sc3Passed`, there is still a structural issue: the condition `Object.keys(actualCounts).length === Object.keys(expectedCounts).length` tests that the DB returned the same number of *distinct* MTFCC codes as expected. It does NOT test that all 5 expected MTFCCs are present. If the DB has rows for 5 MTFCC codes but one of them is not in the expected set (e.g., an unexpected X-code from a previous test run), the count equality passes but the content is wrong. More concretely: if G4110 has 0 rows and an unexpected MTFCC like G4040 has rows, the key counts still balance to 5 and the banner fires green.

This is the same pattern as the OR analog. Given that this is a production-targeted verification script, the false-green is a real risk.

**Fix:** Replace the key-count equality with an explicit check that all *expected* MTFCCs are present:

```typescript
const allExpectedPresent = Object.keys(expectedCounts).every(m => m in actualCounts);
if (sc3Passed && allExpectedPresent) {
  console.log('  SC3: All layer counts OK');
}
```

---

## Info

### IN-01: Pre-flight block comment contradicts actual code values

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:857`

**Issue:** Line 857 reads:
```
// sldl and place values are set to 0 so dry-run MtfccAssertionError reveals actual count.
```
But `sldl: 71` and `place: 157` are the actual values at lines 863-864 — neither is `0`. This is a leftover planning artifact from the TBD workflow described in 91-PATTERNS.md. The comment is now factually incorrect and will mislead anyone maintaining the block.

**Fix:** Delete or replace the comment:
```typescript
// sldl=71 and place=157 confirmed via dry-run 2026-06-05.
```

---

### IN-02: verify-md-tiger-import.sql Gate 3 expected-count comment still has placeholder text

**File:** `C:/EV-Accounts/backend/scripts/verify-md-tiger-import.sql:22-23`

**Issue:** The Gate 3 comment reads:
```
-- Expected: G4020|24, G4110|[DRY-RUN-COUNT], G5200|8, G5210|47, G5220|[DRY-RUN-COUNT]
-- (Update G4110 and G5220 expected counts after dry-run confirms actual values)
```
The dry-run has been completed (per the EXPECTED_MD_MTFCC block: G4110=157, G5220=71). The placeholder text `[DRY-RUN-COUNT]` and the parenthetical instruction should be replaced with the confirmed values so the verification script is self-contained.

**Fix:**
```sql
-- Expected: G4020|24, G4110|157, G5200|8, G5210|47, G5220|71
```

---

_Reviewed: 2026-06-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
