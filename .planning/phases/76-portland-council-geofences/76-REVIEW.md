---
phase: 76-portland-council-geofences
reviewed: 2026-05-29T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts
  - C:/EV-Accounts/backend/scripts/smoke-portland-council-geofences.ts
  - C:/EV-Accounts/backend/migrations/229_portland_council_districts.sql
findings:
  critical: 1
  warning: 3
  info: 1
  total: 5
status: issues_found
---

# Phase 76: Code Review Report

**Reviewed:** 2026-05-29T00:00:00Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the Phase 76 loader, smoke test, and migration for Portland OR council district geofences. The overall structure is solid: per-OBJECTID fetch loop, ST_MakeValid geometry correction, idempotent inserts, and four smoke test gates. One critical issue exists in the smoke test: the SC4 section-split check uses `splitRes.rowCount` for a SELECT query, which the `pg` driver returns as `null` (not `0`) in some environments — the null-falsy guard means SC4 silently reports success even when the orphan query returns rows. Three warnings cover a missing response-stream error handler in `fetchJson`, an unbounded redirect recursion, and an OBJECTID-range assumption that could silently skip fetching if the service reindexes. One info item flags a non-standard ocd_id value.

---

## Critical Issues

### CR-01: SC4 section-split check uses `rowCount` for SELECT — can silently pass when it should fail

**File:** `C:/EV-Accounts/backend/scripts/smoke-portland-council-geofences.ts:133`

**Issue:** The SC4 orphan detection query is a `SELECT` (not INSERT/UPDATE/DELETE). The `pg` driver sets `QueryResult.rowCount` to `null` for SELECT statements in `pg` v8+. The guard `splitRes.rowCount && splitRes.rowCount > 0` evaluates `null && ...` as `false`, so the check enters the else-branch and prints "SC4: OK" regardless of how many orphan rows the query actually returned. If migration 229 failed to insert any districts rows, SC4 would still pass — the entire purpose of the gate is defeated.

**Fix:** Use `splitRes.rows.length` instead of `splitRes.rowCount` for SELECT result inspection:

```typescript
// Before (line 133):
if (splitRes.rowCount && splitRes.rowCount > 0) {

// After:
if (splitRes.rows.length > 0) {
```

This matches how SC1's count result is accessed (`countRes.rows[0].cnt`) and is the correct pattern for all SELECT result-set checks with `pg`.

---

## Warnings

### WR-01: `fetchJson` does not attach an error handler to the response stream

**File:** `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts:88`

**Issue:** The `.on('error', reject)` at line 104 is chained to `lib.get(url, callback)`, which returns the `ClientRequest` object. This catches request-level errors (DNS failure, connection refused). It does NOT catch errors on the `IncomingMessage` response stream itself (e.g., socket hung up mid-transfer, premature close). A partial-read scenario would cause `JSON.parse` to throw inside `res.on('end', ...)`, which is caught at line 101, so the immediate parse error is handled. However, if the socket closes before `end` fires at all, the Promise neither resolves nor rejects — the script hangs indefinitely.

**Fix:** Add a response-level error handler inside the `lib.get` callback:

```typescript
lib.get(url, (res) => {
  // ... existing redirect / status checks ...
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('error', reject);  // ADD THIS LINE
  res.on('end', () => {
    try {
      resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    } catch (e) {
      reject(new Error(`JSON parse error: ${(e as Error).message}`));
    }
  });
}).on('error', reject);
```

### WR-02: Redirect handling in `fetchJson` has no depth limit — unbounded recursion possible

**File:** `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts:89`

**Issue:** `fetchJson` recurses unconditionally on any 3xx response that carries a `Location` header. A misconfigured or adversarial server returning a circular redirect chain (A → B → A) will exhaust the call stack and crash the process with an unhandled "Maximum call stack size exceeded" error rather than a clean failure message.

**Fix:** Thread a `redirectCount` parameter through the recursion and reject after a small threshold (e.g., 5):

```typescript
function fetchJson(url: string, redirectCount = 0): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      return reject(new Error(`Too many redirects fetching ${url}`));
    }
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location, redirectCount + 1).then(resolve).catch(reject);
      }
      // ... rest unchanged
    }).on('error', reject);
  });
}
```

### WR-03: OBJECTID loop assumes OBJECTIDs 1–4 are stable — silent fetch failure if service reindexes

**File:** `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts:146`

**Issue:** The loop iterates `objectId = 1..4` and constructs `OBJECTID%3D${objectId}` queries. The script comment acknowledges that OBJECTID and DISTRICT "happen to match for this dataset." ArcGIS OBJECTIDs are an internal row identifier that can change if the hosted layer is republished, the feature class is rebuilt, or rows are deleted and re-inserted. If the service reindexes to OBJECTIDs 5–8, each per-ID fetch returns an empty feature set, the `!geojson?.features?.length` guard fires at line 158, and the script exits with a clear error. The script will not silently produce wrong data. The risk is that the script breaks in a non-obvious way — the operator would see "no features" for OBJECTID=1 and have to diagnose why.

This is WR not CR because the fail-safe is present (abort on empty feature set). However the fix should use a discovery fetch first:

**Fix:** Add a pre-discovery query to confirm available OBJECTIDs before the fetch loop:

```typescript
// Pre-discovery: fetch all OBJECTIDs from the layer
const discoveryUrl = `${ARCGIS_BASE_URL}?where=1%3D1&returnIdsOnly=true&f=json`;
const idsResponse = await fetchJson(discoveryUrl) as { objectIds: number[] };
const objectIds = idsResponse.objectIds ?? [];
if (objectIds.length !== EXPECTED_COUNT) {
  console.error(`ERROR: Expected ${EXPECTED_COUNT} OBJECTIDs, layer reports ${objectIds.length}`);
  process.exit(1);
}
// then iterate over objectIds instead of 1..EXPECTED_COUNT
```

---

## Info

### IN-01: `ocd_id` column is set to the internal `geo_id` value, not a valid OCD-ID

**File:** `C:/EV-Accounts/backend/scripts/load-portland-council-boundaries.ts:224`

**Issue:** The INSERT passes `geoId` (`'portland-or-council-district-1'` etc.) as both `geo_id` ($1) and `ocd_id` ($2). The OCD (Open Civic Data) division identifier format is `ocd-division/country:us/state:or/place:portland/council_district:1`. Using the internal geo_id as ocd_id is inconsistent with OCD spec. This may be an established placeholder pattern in this project (other loaders — Sacramento, SD — do the same), so it may not warrant a fix now. Worth noting for any future OCD interoperability work.

**Fix:** No immediate action required if this is the project-wide convention. If OCD accuracy is ever needed:
```typescript
const ocdId = `ocd-division/country:us/state:or/place:portland/council_district:${distNum}`;
```

---

_Reviewed: 2026-05-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
