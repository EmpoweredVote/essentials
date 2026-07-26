---
phase: 100-va-tiger-geofences
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts
  - C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql
  - C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts
findings:
  critical: 3
  warning: 4
  info: 2
  total: 9
status: issues_found
---

# Phase 100: Code Review Report

**Reviewed:** 2026-06-08T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files reviewed: the generalized TIGER loader (`load-state-tiger-boundaries.ts`),
a SQL verification script (`verify-va-tiger-import.sql`), and a TypeScript smoke test
(`smoke-va-geofences.ts`). The VA-specific additions (MTFCC assertion block, VA entries
in the allowlist/assertion/makevalid tables) are structurally sound and consistent with
the prior MD, OR, and ME blocks. However, several bugs were found that can cause silent
data corruption or incorrect pass/fail signals.

---

## Critical Issues

### CR-01: `abbrev` passed as `undefined` to `insertDistrictIfMissing` for any unrecognized FIPS

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:526,1150`

**Issue:** `FIPS_TO_STATE[fips]` returns `undefined` when `fips` is not in the map.
The FIPS → state round-trip validation in `main()` (line 1265) only emits a warning when
`expectedAbbrev` is truthy — it calls `process.exit` only when the FIPS *is* recognized but
mismatched. If an operator passes a valid-looking but unmapped FIPS string (e.g. an older
territorial FIPS not in the table), the loader continues, `abbrev` is `undefined`, and the
`state` column written to `essentials.districts` is the literal string `"undefined"`.
This silently pollutes the districts table with unqueryable rows. `abbrevUpper` falls back
to `fips.toUpperCase()` (line 527), so `insertDistrictIfMissing` receives `abbrev` (the
raw variable, not `abbrevUpper`) — the fallback is never applied to the districts write.

```typescript
// Line 527 fallback is for abbrevUpper only — abbrev is still undefined
const abbrev = FIPS_TO_STATE[fips];         // undefined for unmapped FIPS
const abbrevUpper = (abbrev ?? fips).toUpperCase(); // 'VA' — correct
// ...later:
await insertDistrictIfMissing(client, { ..., state: abbrev, ... });
//                                          ^^^^^ undefined → "undefined" in DB
```

**Fix:** Guard `abbrev` and hard-fail if it is not found, since the parseArgs allowlist
already guarantees the state is known:

```typescript
const abbrev = FIPS_TO_STATE[fips];
if (!abbrev) {
  throw new Error(`FIPS ${fips} not found in FIPS_TO_STATE — cannot derive state abbreviation`);
}
const abbrevUpper = abbrev.toUpperCase();
```

---

### CR-02: SC3 "all layer counts OK" fires even when count failures exist

**File:** `C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts:124-126`

**Issue:** The SC3 success log at line 124 is gated only on whether the number of
*returned* mtfcc keys equals the number of *expected* keys, not on whether any
count mismatches were detected. If, say, all 5 mtfcc types are present in the DB
but one has the wrong count, the loop at line 115-122 will set `allPassed = false`
and push an error, but then line 124 still prints `"SC3: All layer counts OK"`.
This produces contradictory console output that can mislead an operator into thinking
SC3 passed when it failed, especially when reading compressed CI logs.

```typescript
// Current — fires even when mismatches exist:
if (Object.keys(actualCounts).length === Object.keys(expectedCounts).length) {
  console.log('  SC3: All layer counts OK');
}
```

**Fix:** Track whether all SC3 checks passed separately, then only print success
when no SC3 failures occurred:

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

### CR-03: Gate 7 section-split check has a false-negative for the `G4110` (place) layer

**File:** `C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql:61-66`

**Issue:** Gate 7 queries `gb.mtfcc IN ('G5200', 'G5210', 'G5220', 'G4020')` to find
geofences that lack a matching `districts` row. This correctly excludes `G4110` (place),
which intentionally has no districts row. However, `G4020` (county-equivalent) is
included but the `county` layer for VA uses `state='va'` (lowercase) in
`essentials.districts`, while `G5200` (cd119) uses `state='VA'` (uppercase) because
`cd119` passes `abbrevUpper` via `state: abbrev` in `insertDistrictIfMissing`.

Wait — re-examining: all layers pass `state: abbrev` (lowercase) to `insertDistrictIfMissing`
EXCEPT the code path would pass the same `abbrev` variable. Let's be precise:
`abbrev = FIPS_TO_STATE[fips]` returns `'va'` (lowercase) for FIPS 51. So the districts
table for county, sldu, sldl is written with `state='va'`, but cd119 goes through the same
path — also `'va'`. The Gate 5 SQL comment says `VA | NATIONAL_LOWER | 11` (uppercase)
but the loader actually writes lowercase `'va'`. Gate 5 will miss the cd119 rows in the
`state='VA'` bucket if they don't exist, and the expected comment is misleading/wrong
about the casing. The section-split query in Gate 7 uses `gb.state = '51'` (correct —
geofence_boundaries stores FIPS), so that part is fine. But the Gate 5 comment's
claim that cd119 writes `state='VA'` (uppercase) contradicts the code, which always
passes the lowercase `abbrev` to `insertDistrictIfMissing`.

More specifically: if all VA districts are written as `state='va'`, then Gate 5's
expected output row `VA  | NATIONAL_LOWER | 11` will never appear. An operator
who trusts the comment passes Gate 5 even though the districts table has
11 rows with `state='va'` that the comment tells them to expect as `state='VA'`.
This is a correctness issue in the verification script: the comment falsely
asserts a casing that the loader does not produce.

**Fix:** Correct the Gate 5 comment to reflect that all VA district rows use
lowercase `'va'`, consistent with `FIPS_TO_STATE['51'] = 'va'`:

```sql
-- Gate 5: districts table counts for Virginia (case-sensitive)
SELECT state, district_type, COUNT(*) AS cnt
FROM essentials.districts
WHERE state IN ('VA', 'va')
GROUP BY state, district_type ORDER BY state, district_type;
-- Expected: ALL rows under state='va' (lowercase — loader passes abbrev from FIPS_TO_STATE)
--   va | COUNTY         | 133
--   va | STATE_LOWER    | 100
--   va | STATE_UPPER    | 40
--   va | NATIONAL_LOWER | 11
-- NOTE: no 'VA' (uppercase) rows expected; cd119 passes abbrev='va' not abbrevUpper
```

---

## Warnings

### WR-01: Redirect loop is unbounded — no depth limit on `downloadWithRedirects`

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:332-356`

**Issue:** `downloadWithRedirects` recurses on every 301/302 response without a
redirect-count limit. A misconfigured CDN or a temporary census.gov redirect loop
would recurse until the Node.js call stack overflows, producing an unhelpful
`Maximum call stack size exceeded` crash rather than a meaningful HTTP error.
TIGER downloads occasionally hit multi-hop redirects (HTTP → HTTPS → CDN).

**Fix:** Add a depth parameter with a hard limit:

```typescript
function downloadWithRedirects(url: string, destPath: string, redirectDepth = 0): Promise<void> {
  return new Promise((resolve, reject) => {
    if (redirectDepth > 5) {
      return reject(new Error(`Too many redirects (>5) for ${url}`));
    }
    // ... existing logic ...
    return downloadWithRedirects(response.headers.location!, destPath, redirectDepth + 1)
      .then(resolve).catch(reject);
  });
}
```

---

### WR-02: `response.headers.location` is not validated before use — can throw on malformed redirect

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:342`

**Issue:** `response.headers.location!` uses a non-null assertion. Node's `http.IncomingMessage`
types `headers.location` as `string | undefined`. If a server returns a 301/302 with no
`Location` header (malformed response), the non-null assertion silences the type error,
`downloadWithRedirects` is called with `undefined` as the URL, which becomes the string
`"undefined"` passed to `https.get`, producing a confusing ENOTFOUND error instead of
an actionable "missing Location header" message.

**Fix:**

```typescript
const location = response.headers.location;
if (!location) {
  file.close();
  if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
  return reject(new Error(`Redirect response (${response.statusCode}) for ${url} missing Location header`));
}
return downloadWithRedirects(location, destPath).then(resolve).catch(reject);
```

---

### WR-03: VA MTFCC assertion does not cover all layers in VA's allowlist

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:915-951`

**Issue:** The `EXPECTED_VA_MTFCC` table at line 916 covers `cd119`, `sldu`, `sldl`,
`place`, and `county`. But `VA`'s entry in `STATE_LAYER_ALLOWLIST` (line 43) also
includes `'county'` — which is covered. However, the VA allowlist does not include
`cousub` (unlike MA/CA), which is fine. The gap is that the VA assertions were
confirmed via dry-run on 2026-06-08 but `sldl: 100` and `place: 227` are marked
"confirmed via dry-run" in the comments. The issue is that all other state assertion
blocks (MA, ME, OR, MD) follow the same pattern. The real structural gap: if an
operator runs `--layers cd119` only (a valid subset operation), the pre-flight
assertion only checks `cd119` in the table and skips the rest. This is by design
(other states behave identically), so this is not a new bug introduced by the VA
block — but it means the assertion provides no protection on partial runs for layers
not in the subset. This is a documentation gap, not a code bug.

More importantly: the `sldl` entry has a comment "confirmed via dry-run 2026-06-08"
suggesting the value was just established today. If this review runs before the live
load, the assertion value may be newly set and not yet validated against a real import.
However this is a process concern, not a logic bug.

The concrete WARNING: the VA block does not apply the same `filterByStatefp` logic
for `sldl`/`sldu` that it does in the MA block. Both MA and VA `sldl`/`sldu` layers
are state-scoped shapefiles (`filterByStatefp: false` in LAYER_DISPATCH), so no
`STATEFP` filter is needed — the pre-flight count correctly omits it. This is
consistent with other states and is correct. No fix needed for this sub-point.

**Fix:** No code change required. Add a comment to the VA assertion block clarifying
that `sldl` and `sldu` TIGER shapefiles are state-scoped (no STATEFP filter applies):

```typescript
// sldl and sldu TIGER shapefiles are state-scoped (FIPS 51 in filename);
// filterByStatefp is false for these layers — no STATEFP filter in pre-flight count.
```

---

### WR-04: `extractZip` return value ignored in the live path — temp dirs never cleaned up

**File:** `C:/EV-Accounts/backend/scripts/load-state-tiger-boundaries.ts:604-605`

**Issue:** `extractZip` returns `{ cleanup: () => void }` (line 363). In the live
`processLayer` path (line 604), the return value is discarded:

```typescript
extractZip(zipPath, destDir);
// cleanup() is never called
```

The `cleanup()` function only deletes `destDir` if it didn't pre-exist, so this is
not a correctness issue for re-runs (caching is intentional). However, for a first
run across all 5 VA layers, this leaves 5 extracted shapefile directories (each
several MB) under `.tmp-tiger-2024-51/` after the script completes. The zip files
are also retained (intentional caching). This means disk usage accumulates across
runs, potentially growing large for operators who run multiple states. The same
pattern exists in the dry-run aiannh branch (line 559).

**Fix:** Either call `cleanup()` after `streamShapefile` completes, or document
explicitly that temp dirs are intentionally preserved:

```typescript
const { cleanup } = extractZip(zipPath, destDir);
// ... all streamShapefile passes ...
cleanup(); // remove extracted dir (zip cache is preserved for re-runs)
```

If caching is intentional, add a comment: `// cleanup() intentionally not called — extracted dirs cached for re-runs`.

---

## Info

### IN-01: Alexandria `G4110` geo_id comment has a construction note mismatch

**File:** `C:/EV-Accounts/backend/scripts/smoke-va-geofences.ts:39`

**Issue:** The comment reads `// Alexandria city (incorporated place, STATEFP=51 + PLACEFP=01000)`.
The geo_id is `'5101000'` = `STATEFP(51)` + `PLACEFP(01000)` = 7 chars. This is correct.
However, the `verify-va-tiger-import.sql` Gate 4 comment at line 32 shows
`geo_id='5101000'` which is also correct. The two files are consistent. This is
an info-only note confirming correctness.

No issue — informational only.

---

### IN-02: Gate 3 in `verify-va-tiger-import.sql` uses placeholder text, not confirmed counts

**File:** `C:/EV-Accounts/backend/scripts/verify-va-tiger-import.sql:22`

**Issue:** The Gate 3 expected comment reads:
```
-- Expected: G4020|133, G4110|[DRY-RUN-COUNT], G5200|11, G5210|40, G5220|[DRY-RUN-COUNT]
```

The placeholders `[DRY-RUN-COUNT]` were not updated after the dry-run confirmed values
(`G4110=227`, `G5220=100`, both noted in the loader's EXPECTED_VA_MTFCC block at line
919-920). While this does not affect query correctness (it's a comment), it means an
operator comparing Gate 3 output against the "expected" comment gets no actionable
number to check for two of the five mtfcc types. The smoke test (`smoke-va-geofences.ts`)
has the correct values (lines 105, 108), but the SQL verification script remains
inconsistent.

**Fix:** Update Gate 3 expected comment:
```sql
-- Expected: G4020|133, G4110|227, G5200|11, G5210|40, G5220|100
```

---

_Reviewed: 2026-06-08T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
